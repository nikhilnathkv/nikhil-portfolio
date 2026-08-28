"""Object storage for uploaded media and resumes.

Binary files live in object storage; only metadata lives in PostgreSQL. Assets
are public, and ``media.url`` stores a direct public URL built from
``minio_public_url`` so the site and browser load assets without signing.

Vendor is pluggable via ``STORAGE_PROVIDER`` (repository pattern): a thin
``StorageService`` facade delegates the actual byte operations to a
``StorageBackend`` chosen at startup —

  * ``minio`` — host-based S3 (local MinIO, Cloudflare R2, AWS S3) via minio-py
  * ``s3``    — path-style S3 via boto3 (Supabase Storage; also R2 / AWS S3)

Both SDKs are synchronous; calls are small and run inside request handlers.
"""

from __future__ import annotations

import io
import json
import uuid
from functools import lru_cache
from typing import Protocol

from app.core.config import settings


def _public_read_policy(bucket: str) -> str:
    return json.dumps(
        {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"AWS": ["*"]},
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{bucket}/*"],
                }
            ],
        }
    )


class StorageBackend(Protocol):
    """Vendor-specific byte operations. Bucket + public URL are owned by the facade."""

    def ensure_bucket(self, bucket: str) -> None: ...
    def upload(self, bucket: str, key: str, data: bytes, content_type: str) -> None: ...
    def delete(self, bucket: str, key: str) -> None: ...


class MinioBackend:
    """Host-based S3 (MinIO / Cloudflare R2 / AWS S3)."""

    def __init__(self) -> None:
        from minio import Minio

        self._client = Minio(
            settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_secure,
        )

    def ensure_bucket(self, bucket: str) -> None:
        if not self._client.bucket_exists(bucket):
            self._client.make_bucket(bucket)
        self._client.set_bucket_policy(bucket, _public_read_policy(bucket))

    def upload(self, bucket: str, key: str, data: bytes, content_type: str) -> None:
        self._client.put_object(
            bucket, key, io.BytesIO(data), length=len(data), content_type=content_type
        )

    def delete(self, bucket: str, key: str) -> None:
        self._client.remove_object(bucket, key)


class S3Backend:
    """Path-style S3 via boto3 — works with providers whose endpoint carries a
    path (e.g. Supabase Storage's ``…/storage/v1/s3``), and with R2 / AWS S3."""

    def __init__(self) -> None:
        import boto3
        from botocore.config import Config

        scheme = "https" if settings.minio_secure else "http"
        self._client = boto3.client(
            "s3",
            endpoint_url=f"{scheme}://{settings.minio_endpoint}",
            aws_access_key_id=settings.minio_access_key,
            aws_secret_access_key=settings.minio_secret_key,
            region_name=settings.storage_region,
            config=Config(s3={"addressing_style": "path"}),
        )

    def ensure_bucket(self, bucket: str) -> None:
        # Managed providers pre-create the (public) bucket in their UI and may
        # reject create/policy calls — treat this as best-effort.
        from botocore.exceptions import ClientError

        try:
            self._client.head_bucket(Bucket=bucket)
        except ClientError:
            self._client.create_bucket(Bucket=bucket)

    def upload(self, bucket: str, key: str, data: bytes, content_type: str) -> None:
        self._client.put_object(Bucket=bucket, Key=key, Body=data, ContentType=content_type)

    def delete(self, bucket: str, key: str) -> None:
        self._client.delete_object(Bucket=bucket, Key=key)


def make_backend() -> StorageBackend:
    """Select the storage backend from ``STORAGE_PROVIDER`` (default: minio)."""
    if settings.storage_provider.strip().lower() in {"s3", "supabase", "aws"}:
        return S3Backend()
    return MinioBackend()


class StorageService:
    """Vendor-agnostic facade: owns the bucket + public URL, delegates bytes to
    a backend. Consumers depend on this type; the test suite stubs its methods."""

    def __init__(self, backend: StorageBackend | None = None) -> None:
        self.bucket = settings.minio_bucket
        self.public_url = settings.minio_public_url.rstrip("/")
        self.backend = backend or make_backend()

    def ensure_bucket(self) -> None:
        self.backend.ensure_bucket(self.bucket)

    def build_key(self, original_filename: str) -> str:
        """A collision-free storage key that keeps the original extension."""
        ext = ""
        if "." in original_filename:
            ext = "." + original_filename.rsplit(".", 1)[1].lower()
        return f"{uuid.uuid4().hex}{ext}"

    def upload(self, data: bytes, key: str, content_type: str) -> str:
        """Upload bytes under ``key`` and return the public URL."""
        self.backend.upload(self.bucket, key, data, content_type)
        return f"{self.public_url}/{self.bucket}/{key}"

    def delete(self, key: str) -> None:
        self.backend.delete(self.bucket, key)


@lru_cache
def get_storage_service() -> StorageService:
    return StorageService()
