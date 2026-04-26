import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.config import settings

ALLOWED_SUPPORT_CONTENT_TYPES = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


def save_support_file(upload: UploadFile) -> tuple[str, str]:
    extension = Path(upload.filename or "").suffix.lower()
    if not extension:
        extension = ALLOWED_SUPPORT_CONTENT_TYPES.get(upload.content_type or "", "")

    generated_filename = f"{uuid4().hex}{extension}"
    storage_dir = Path(settings.support_upload_dir)
    absolute_path = storage_dir / generated_filename

    upload.file.seek(0)
    with absolute_path.open("wb") as destination:
        shutil.copyfileobj(upload.file, destination)

    return generated_filename, str(absolute_path)


def resolve_support_file_path(storage_path: str) -> Path:
    path = Path(storage_path)
    if path.is_absolute():
        return path

    return Path.cwd() / path


def delete_support_file(storage_path: str) -> None:
    path = resolve_support_file_path(storage_path)
    if path.exists():
        path.unlink()
