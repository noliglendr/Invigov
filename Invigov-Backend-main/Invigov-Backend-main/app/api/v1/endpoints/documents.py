from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pathlib import Path

from app.core.database import get_db
from app.core.config import settings
from app.api.v1.deps import get_current_user, require_sam_onboarding_read_access
from app.services.document_service import generate_documents, get_document_url

router = APIRouter()


@router.post("/generate")
def generate(
    entitlement=Depends(require_sam_onboarding_read_access),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return generate_documents(db, current_user.workspace_id, actor_id=str(current_user.id))


@router.get("/{document_id}/download")
def download(
    document_id: str,
    current_user=Depends(get_current_user),
    entitlement=Depends(require_sam_onboarding_read_access),
    db: Session = Depends(get_db),
):
    result = get_document_url(db, current_user.workspace_id, document_id, actor_id=str(current_user.id))

    # If using local storage, serve the file directly
    if result.get("storage_type") == "local":
        file_path = Path(result["download_url"])

        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")

        filename = result["filename"]
        if filename.endswith(".docx"):
            media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        else:
            media_type = "application/pdf"

        return FileResponse(
            path=str(file_path),
            filename=filename,
            media_type=media_type,
        )

    # For R2 storage, return the presigned URL
    return result
