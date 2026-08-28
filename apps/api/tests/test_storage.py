"""Storage repository pattern: backend selection + facade wiring."""

from app.services import storage as storage_mod
from app.services.storage import MinioBackend, S3Backend, StorageService, make_backend


def test_make_backend_defaults_to_minio(monkeypatch) -> None:
    monkeypatch.setattr(storage_mod.settings, "storage_provider", "minio")
    assert isinstance(make_backend(), MinioBackend)


def test_make_backend_selects_s3(monkeypatch) -> None:
    for provider in ("s3", "S3", "supabase"):
        monkeypatch.setattr(storage_mod.settings, "storage_provider", provider)
        assert isinstance(make_backend(), S3Backend), provider


def test_facade_uses_injected_backend_and_config(monkeypatch) -> None:
    monkeypatch.setattr(storage_mod.settings, "minio_bucket", "media")
    monkeypatch.setattr(storage_mod.settings, "minio_public_url", "https://cdn.example.com/")

    class FakeBackend:
        def __init__(self) -> None:
            self.calls: list[tuple] = []

        def ensure_bucket(self, bucket: str) -> None:
            self.calls.append(("ensure", bucket))

        def upload(self, bucket, key, data, content_type) -> None:
            self.calls.append(("upload", bucket, key, content_type))

        def delete(self, bucket, key) -> None:
            self.calls.append(("delete", bucket, key))

    fake = FakeBackend()
    svc = StorageService(backend=fake)
    assert svc.bucket == "media"
    assert svc.public_url == "https://cdn.example.com"  # trailing slash trimmed
    assert svc.build_key("photo.PNG").endswith(".png")
    assert svc.backend is fake
