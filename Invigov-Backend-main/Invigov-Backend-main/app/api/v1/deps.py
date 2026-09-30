"""
Authorization dependencies — injected into every gated endpoint.
This is the single enforcement layer for all entitlement checks.
UI state is never trusted; only this module controls access.

SOW §4.4 Enforcement Rules:
- All entitlement checks occur server-side on every gated request.
- UI-only gating is explicitly prohibited.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.models.entitlement import Entitlement
from app.models.audit_log import AuditLog

bearer_scheme = HTTPBearer()


def _log_access_denied(
    db: Session,
    workspace_id,
    actor_id: str = None,
    reason: str = "payment_required",
    detail: dict = None,
) -> None:
    """SOW §4.4 — log every rejected entitlement check to audit_logs."""
    log = AuditLog(
        workspace_id=workspace_id,
        actor_type="user",
        actor_id=actor_id,
        event_type="entitlement.access_denied",
        new_state="denied",
        extra_data={"reason": reason, **(detail or {})},
    )
    db.add(log)
    db.commit()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not user.email_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email not verified")
    return user


def require_sam_onboarding_access(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Entitlement:
    """
    SOW §4.2 — SAM Onboarding entitlement gate.

    Allowed:  sam_onboarding_status == 'active'
    Blocked:
      'inactive'         -> payment not started
      'pending_checkout' -> checkout created but payment not confirmed
      'expired'          -> payment failed
      'canceled'         -> explicitly canceled
      'completed'        -> workflow already finished (one-time lock)
    """
    entitlement = db.query(Entitlement).filter_by(workspace_id=current_user.workspace_id).first()

    if not entitlement:
        _log_access_denied(db, current_user.workspace_id, str(current_user.id),
                           "payment_required", {"gate": "sam_onboarding"})
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "payment_required", "type": "sam_onboarding"},
        )

    # SOW §6.1 — one-time onboarding lock takes precedence over any subscription state.
    # A completed workflow must never accept writes, even if the user still has
    # an active Complete-tier subscription.
    if entitlement.sam_onboarding_status == "completed":
        _log_access_denied(db, current_user.workspace_id, str(current_user.id),
                           "workflow_already_completed", {"gate": "sam_onboarding"})
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "workflow_already_completed"},
        )

    # Tier-based access: intelligence or complete tier with active subscription
    if entitlement.subscription_tier in ("intelligence", "complete") and entitlement.subscription_status == "active":
        return entitlement

    # Legacy field check
    if entitlement.sam_onboarding_status in (
        "inactive", "pending_checkout", "expired", "canceled"
    ):
        _log_access_denied(db, current_user.workspace_id, str(current_user.id),
                           "payment_required", {"gate": "sam_onboarding",
                                                "sam_status": entitlement.sam_onboarding_status,
                                                "sub_status": entitlement.subscription_status})
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "payment_required", "type": "sam_onboarding"},
        )
    # sam_onboarding_status == 'active' -> PASS
    return entitlement


def require_sam_onboarding_read_access(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Entitlement:
    """
    SOW §4.2 — SAM Onboarding read-only access gate.

    Allowed:  sam_onboarding_status == 'active' OR 'completed'
    - 'active': can read and write
    - 'completed': read-only access (workflow locked)

    Blocked:
      'none'             -> payment not started
      'inactive'         -> payment not started
      'pending_checkout' -> checkout created but payment not confirmed
      'expired'          -> payment failed
      'canceled'         -> explicitly canceled
    """
    entitlement = db.query(Entitlement).filter_by(workspace_id=current_user.workspace_id).first()

    if not entitlement:
        _log_access_denied(db, current_user.workspace_id, str(current_user.id),
                           "payment_required", {"gate": "sam_onboarding_read"})
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "payment_required", "type": "sam_onboarding"},
        )

    # New tier-based check: intelligence or complete tier with active subscription
    if entitlement.subscription_tier in ("intelligence", "complete") and entitlement.subscription_status == "active":
        return entitlement

    # Legacy field check
    if entitlement.sam_onboarding_status in (
        "none", "inactive", "pending_checkout", "expired", "canceled"
    ):
        _log_access_denied(db, current_user.workspace_id, str(current_user.id),
                           "payment_required", {"gate": "sam_onboarding_read",
                                                "sam_status": entitlement.sam_onboarding_status,
                                                "sub_status": entitlement.subscription_status})
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "payment_required", "type": "sam_onboarding"},
        )
    # sam_onboarding_status == 'active' OR 'completed' -> PASS
    return entitlement


def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Only users with role 'admin' or 'owner' may call admin endpoints."""
    if current_user.role not in ("admin", "owner"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "admin_required"},
        )
    return current_user


def require_compliance_access(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Entitlement:
    """
    Compliance access gate — requires 'complete' tier with active subscription.
    Falls back to legacy compliance_subscription_status for backward compatibility.
    """
    entitlement = db.query(Entitlement).filter_by(workspace_id=current_user.workspace_id).first()

    if not entitlement:
        _log_access_denied(db, current_user.workspace_id, str(current_user.id),
                           "subscription_required", {"gate": "compliance"})
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "subscription_required"},
        )

    # New tier-based check
    tier = entitlement.subscription_tier or "free"
    sub_status = entitlement.subscription_status or "active"

    if tier == "complete" and sub_status == "active":
        return entitlement

    # Fallback: legacy field check
    if entitlement.compliance_subscription_status == "active":
        return entitlement

    # Determine error code
    if sub_status in ("expired",):
        code = "payment_failed_subscription_suspended"
    elif sub_status in ("canceled",):
        code = "subscription_canceled"
    else:
        code = "subscription_required"

    _log_access_denied(db, current_user.workspace_id, str(current_user.id),
                       code, {"gate": "compliance", "tier": tier, "sub_status": sub_status})
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail={"code": code},
    )
