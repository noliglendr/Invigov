from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.entitlement import Entitlement
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, RegisterResponse, ResendVerificationRequest
from app.services.auth_service import register_user, login_user, refresh_access_token, verify_email, resend_verification
from app.core.config import settings

router = APIRouter()


@router.post("/register", response_model=RegisterResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    return register_user(db, payload)


@router.post("/verify-email", response_model=TokenResponse)
def verify(token: str = Query(...), db: Session = Depends(get_db)):
    return verify_email(db, token)


@router.post("/resend-verification")
def resend(payload: ResendVerificationRequest, db: Session = Depends(get_db)):
    return resend_verification(db, payload.email)



@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    return login_user(db, payload)


@router.post("/refresh", response_model=TokenResponse)
def refresh(refresh_token: str = Query(...), db: Session = Depends(get_db)):
    return refresh_access_token(db, refresh_token)


@router.get("/me")
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Get entitlement for the user's workspace
    entitlement = db.query(Entitlement).filter(
        Entitlement.workspace_id == current_user.workspace_id
    ).first()

    # Return both new tier-based fields and legacy fields
    if not entitlement:
        entitlement_data = {
            "subscription_tier": "free",
            "subscription_status": "active",
            "subscription_start_at": None,
            "subscription_end_at": None,
            "sam_onboarding_status": "inactive",
            "compliance_subscription_status": "inactive",
            "sam_onboarding_paid_at": None,
            "sam_onboarding_completed_at": None,
        }
    else:
        entitlement_data = {
            "subscription_tier": entitlement.subscription_tier or "free",
            "subscription_status": entitlement.subscription_status or "active",
            "subscription_start_at": entitlement.subscription_start_at.isoformat() if entitlement.subscription_start_at else None,
            "subscription_end_at": entitlement.subscription_end_at.isoformat() if entitlement.subscription_end_at else None,
            "sam_onboarding_status": entitlement.sam_onboarding_status,
            "compliance_subscription_status": entitlement.compliance_subscription_status,
            "sam_onboarding_paid_at": entitlement.sam_onboarding_paid_at.isoformat() if entitlement.sam_onboarding_paid_at else None,
            "sam_onboarding_completed_at": entitlement.sam_onboarding_completed_at.isoformat() if entitlement.sam_onboarding_completed_at else None,
        }

    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "role": current_user.role,
        "workspace_id": str(current_user.workspace_id),
        "entitlement": entitlement_data,
    }
