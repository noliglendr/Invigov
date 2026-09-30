from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1.deps import get_current_user
from app.services.payment_service import create_tier_checkout

router = APIRouter()


@router.post("/checkout/{tier}")
def checkout_tier(
    tier: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_tier_checkout(db, current_user.workspace_id, current_user, tier)
