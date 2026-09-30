from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1.deps import get_current_user, require_compliance_access
from app.schemas.compliance import CustomDeadlineRequest
from app.services.compliance_service import (
    get_dashboard,
    mark_deadline_complete,
    add_custom_deadline,
)

router = APIRouter()


@router.get("/dashboard")
def dashboard(
    entitlement=Depends(require_compliance_access),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_dashboard(db, current_user.workspace_id)


@router.post("/deadlines/{deadline_id}/complete")
def complete_deadline(
    deadline_id: str,
    entitlement=Depends(require_compliance_access),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return mark_deadline_complete(db, current_user.workspace_id, deadline_id)


@router.post("/deadlines")
def create_deadline(
    payload: CustomDeadlineRequest,
    entitlement=Depends(require_compliance_access),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return add_custom_deadline(db, current_user.workspace_id, payload)
