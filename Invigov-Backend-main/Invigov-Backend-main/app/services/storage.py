# Storage service - supports both local filesystem and Cloudflare R2
import os
from pathlib import Path
import boto3
from botocore.exceptions import ClientError
from app.core.config import settings


def _get_r2_client():
    """Get Cloudflare R2 client (S3-compatible)"""
    from botocore.config import Config

    return boto3.client(
        "s3",
        endpoint_url=settings.R2_ENDPOINT_URL,
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        region_name="auto",  # Cloudflare R2 uses "auto" region
        config=Config(
            signature_version="s3v4",  # Use SigV4 signature
            s3={"addressing_style": "path"}
        )
    )


def _ensure_local_storage_dir():
    """Create local storage directory if it doesn't exist"""
    storage_path = Path(settings.LOCAL_STORAGE_PATH)
    storage_path.mkdir(parents=True, exist_ok=True)
    return storage_path


def upload_file(object_key: str, file_bytes: bytes, content_type: str = "application/pdf") -> str:
    """
    Upload file to storage (local or R2 based on STORAGE_TYPE setting)

    Args:
        object_key: Path/key for the file (e.g., "workspace_id/document_type/uuid.pdf")
        file_bytes: File content as bytes
        content_type: MIME type of the file

    Returns:
        object_key: The key/path where the file was stored
    """
    if settings.STORAGE_TYPE == "local":
        # Local filesystem storage
        storage_path = _ensure_local_storage_dir()
        file_path = storage_path / object_key

        # Create subdirectories if needed
        file_path.parent.mkdir(parents=True, exist_ok=True)

        # Write file to disk
        with open(file_path, "wb") as f:
            f.write(file_bytes)

        return object_key

    elif settings.STORAGE_TYPE == "r2":
        # Cloudflare R2 storage
        client = _get_r2_client()
        client.put_object(
            Bucket=settings.R2_BUCKET_NAME,
            Key=object_key,
            Body=file_bytes,
            ContentType=content_type,
        )
        return object_key

    else:
        raise ValueError(f"Invalid STORAGE_TYPE: {settings.STORAGE_TYPE}. Must be 'local' or 'r2'.")


def generate_signed_url(object_key: str, expires_in: int = 3600) -> str:
    """
    Generate a download URL for a file

    Args:
        object_key: Path/key for the file
        expires_in: URL expiration time in seconds (only applies to R2)

    Returns:
        URL: Download URL (local file path or R2 presigned URL)
    """
    if settings.STORAGE_TYPE == "local":
        # For local storage, return a file:// URL or relative path
        # In production, you'd typically serve these through a web server
        storage_path = _ensure_local_storage_dir()
        file_path = storage_path / object_key

        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {object_key}")

        # Return absolute file path (the API endpoint will read and serve this)
        return str(file_path.absolute())

    elif settings.STORAGE_TYPE == "r2":
        # Cloudflare R2 presigned URL
        client = _get_r2_client()
        return client.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.R2_BUCKET_NAME, "Key": object_key},
            ExpiresIn=expires_in,
        )

    else:
        raise ValueError(f"Invalid STORAGE_TYPE: {settings.STORAGE_TYPE}. Must be 'local' or 'r2'.")


def check_storage_connection() -> bool:
    """
    Check if storage is properly configured and accessible

    Returns:
        bool: True if storage is accessible, False otherwise
    """
    if settings.STORAGE_TYPE == "local":
        try:
            storage_path = _ensure_local_storage_dir()
            # Test write access
            test_file = storage_path / ".test_write"
            test_file.write_text("test")
            test_file.unlink()
            return True
        except Exception:
            return False

    elif settings.STORAGE_TYPE == "r2":
        try:
            client = _get_r2_client()
            client.head_bucket(Bucket=settings.R2_BUCKET_NAME)
            return True
        except ClientError:
            return False

    else:
        return False


# Alias for backwards compatibility
check_r2_connection = check_storage_connection
