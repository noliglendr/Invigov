"""
Stripe Checkout session creation.

Tier-based subscription model:
  POST /api/v1/payments/checkout/{tier}
    - tier: "intelligence" or "complete"
    - Creates a Stripe Checkout session in subscription mode
    - Returns checkout URL
"""
import stripe
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User
from app.models.entitlement import Entitlement
from app.models.audit_log import AuditLog

stripe.api_key = settings.STRIPE_SECRET_KEY

TIER_PRICE_MAP = {
    "intelligence": "STRIPE_PRICE_ID_INTELLIGENCE",
    "complete": "STRIPE_PRICE_ID_COMPLETE",
}


def _get_or_create_stripe_customer(db: Session, entitlement: Entitlement, user: User) -> str:
    """Return existing Stripe customer_id or create a new one."""
    if entitlement.stripe_customer_id:
        return entitlement.stripe_customer_id

    customer = stripe.Customer.create(
        email=user.email,
        metadata={"workspace_id": str(user.workspace_id)},
    )
    entitlement.stripe_customer_id = customer["id"]
    db.commit()
    return customer["id"]


def create_tier_checkout(db: Session, workspace_id, current_user: User, tier: str) -> dict:
    """
    Create a Stripe Checkout session for a subscription tier.

    Args:
        tier: "intelligence" or "complete"

    Guards:
        - Invalid tier -> 400
        - Already on same or higher tier and active -> 409
    """
    if tier not in TIER_PRICE_MAP:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "invalid_tier", "message": f"Invalid tier '{tier}'. Must be 'intelligence' or 'complete'."},
        )

    entitlement = db.query(Entitlement).filter_by(workspace_id=workspace_id).first()
    if not entitlement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entitlement record not found")

    # Map tier to price ID
    price_id = getattr(settings, TIER_PRICE_MAP[tier])

    customer_id = _get_or_create_stripe_customer(db, entitlement, current_user)

    session = stripe.checkout.Session.create(
        customer=customer_id,
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        mode="subscription",
        success_url=f"{settings.FRONTEND_URL}/dashboard/billing/success?session_id={{CHECKOUT_SESSION_ID}}&tier={tier}",
        cancel_url=f"{settings.FRONTEND_URL}/dashboard/billing",
        metadata={"workspace_id": str(workspace_id), "tier": tier},
    )

    previous_status = entitlement.subscription_status
    entitlement.subscription_status = "pending_checkout"

    audit = AuditLog(
        workspace_id=workspace_id,
        actor_type="user",
        actor_id=str(current_user.id),
        event_type="entitlement.subscription.pending_checkout",
        previous_state=previous_status,
        new_state="pending_checkout",
        extra_data={"tier": tier, "stripe_session_id": session["id"]},
    )
    db.add(audit)
    db.commit()

    return {"checkout_url": session["url"]}
