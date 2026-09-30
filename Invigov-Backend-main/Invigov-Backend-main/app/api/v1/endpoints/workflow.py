from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1.deps import get_current_user, require_sam_onboarding_access, require_sam_onboarding_read_access
from app.schemas.workflow import (
    BusinessInfoRequest,
    NaicsCodesRequest,
    BankingInfoRequest,
    RepsCertsRequest,
)
from app.services.workflow_service import (
    get_or_create_session,
    save_step,
    get_preflight_status,
    complete_workflow,
    get_far_clauses_for_entity,
)

router = APIRouter()


@router.get("/session")
def get_session(
    entitlement=Depends(require_sam_onboarding_read_access),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_or_create_session(db, current_user.workspace_id)


@router.post("/step/business-info")
def step_business_info(
    payload: BusinessInfoRequest,
    entitlement=Depends(require_sam_onboarding_access),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return save_step(db, current_user.workspace_id, "business_info", payload.model_dump())


@router.post("/step/naics-codes")
def step_naics(
    payload: NaicsCodesRequest,
    entitlement=Depends(require_sam_onboarding_access),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return save_step(db, current_user.workspace_id, "naics_codes", payload.model_dump())


@router.post("/step/banking-info")
def step_banking(
    payload: BankingInfoRequest,
    entitlement=Depends(require_sam_onboarding_access),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return save_step(db, current_user.workspace_id, "banking_info", payload.model_dump())


@router.post("/step/reps-certs")
def step_reps_certs(
    payload: RepsCertsRequest,
    entitlement=Depends(require_sam_onboarding_access),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return save_step(db, current_user.workspace_id, "reps_certs", payload.model_dump())


@router.get("/preflight")
def preflight(
    entitlement=Depends(require_sam_onboarding_access),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_preflight_status(db, current_user.workspace_id)


@router.post("/complete")
def complete(
    entitlement=Depends(require_sam_onboarding_access),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return complete_workflow(db, current_user.workspace_id)


@router.get("/far-clauses/{business_type}")
def get_far_clauses(
    business_type: str,
    entitlement=Depends(require_sam_onboarding_access),
    current_user=Depends(get_current_user),
):
    """
    Returns filtered FAR/DFARS clauses based on business entity type.
    Used by frontend to display appropriate Reps & Certs questions.
    """
    return get_far_clauses_for_entity(business_type)
