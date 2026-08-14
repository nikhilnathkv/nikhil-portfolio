"""Object storage (MinIO / S3-compatible) for uploaded media and resumes.

Binary files live in object storage; only metadata lives in PostgreSQL. The
bucket is created with a public-read policy (portfolio assets are public), and
``media.url`` stores a direct public URL built from ``minio_public_url`` so the
public site and browser can load assets without signing.

The MinIO SDK is synchronous; calls are small and run inside request handlers.
"""

from __future__ import annotations

import io
import json
import uuid
from functools import lru_cache

from minio import Minio

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


class StorageService:
    def __init__(self) -> None:
        self.bucket = settings.minio_bucket
        self.public_url = settings.minio_public_url.rstrip("/")
        self._client = Minio(
            settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_secure,
        )

    def ensure_bucket(self) -> None:
        """Create the bucket + public-read policy if missing (idempotent)."""
        if not self._client.bucket_exists(self.bucket):
            self._client.make_bucket(self.bucket)
        self._client.set_bucket_policy(self.bucket, _public_read_policy(self.bucket))

    def build_key(self, original_filename: str) -> str:
        """A collision-free storage key that keeps the original extension."""
        ext = ""
        if "." in original_filename:
            ext = "." + original_filename.rsplit(".", 1)[1].lower()
        return f"{uuid.uuid4().hex}{ext}"

    def upload(self, data: bytes, key: str, content_type: str) -> str:
        """Upload bytes under ``key`` and return the public URL."""
        self._client.put_object(
            self.bucket,
            key,
            io.BytesIO(data),
            length=len(data),
            content_type=content_type,
        )
        return f"{self.public_url}/{self.bucket}/{key}"

    def delete(self, key: str) -> None:
        self._client.remove_object(self.bucket, key)


@lru_cache
def get_storage_service() -> StorageService:
    return StorageService()
