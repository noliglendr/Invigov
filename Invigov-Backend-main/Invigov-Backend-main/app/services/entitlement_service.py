"""
Stripe webhook event handlers — entitlement state transitions.

SOW §4.3 Required Stripe-Driven Transitions:
  checkout.session.completed    -> onboarding: inactive/pending_checkout -> active
                                   OR subscription: inactive/pending_checkout -> active
  invoice.payment_succeeded     -> subscription: confirm renewal, update end_date
  invoice.payment_failed        -> subscription: active -> expired (immediate)
  customer.subscription.deleted -> subscription: any -> canceled (immediate)

SOW §4.4: All entitlement state changes must be written to audit_log.
SOW §3.3: Webhooks must be idempotent and transaction-safe.
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.entitlement import Entitlement
from app.models.audit_log import AuditLog


def _log_entitlement_change(
    db: Session,
    workspace_id,
    event_type: str,
    previous_state: str,
    new_state: str,
    metadata: dict = None,
) -> None:
    """Write every entitlement state change to audit_logs (SOW §4.4)."""
    log = AuditLog(
        workspace_id=workspace_id,
        actor_type="system",
        actor_id="stripe_webhook",
        event_type=event_type,
        previous_state=previous_state,
        new_state=new_state,
        extra_data=metadata or {},
    )
    db.add(log)


def _get_entitlement_by_customer(db: Session, stripe_customer_id: str) -> Entitlement | None:
    return db.query(Entitlement).filter_by(stripe_customer_id=stripe_customer_id).first()


def _get_entitlement_by_subscription(db: Session, stripe_subscription_id: str) -> Entitlement | None:
    return db.query(Entitlement).filter_by(stripe_subscription_id=stripe_subscription_id).first()


def handle_checkout_completed(db: Session, session_obj: dict) -> None:
    """
    checkout.session.completed
    Dispatches to onboarding or subscription handler based on session mode.
    """
    mode = session_obj.get("mode")
    customer_id = session_obj.get("customer")
    metadata = session_obj.get("metadata", {})
    workspace_id = metadata.get("workspace_id")

    entitlement = None
    if workspace_id:
        entitlement = db.query(Entitlement).filter_by(workspace_id=workspace_id).first()
    elif customer_id:
        entitlement = _get_entitlement_by_customer(db, customer_id)

    if not entitlement:
        return  # workspace not found — log and skip

    # Store Stripe customer_id if not already set
    if customer_id and not entitlement.stripe_customer_id:
        entitlement.stripe_customer_id = customer_id

    if mode == "payment":
        # One-time SAM Onboarding payment (legacy)
        prev = entitlement.sam_onboarding_status
        entitlement.sam_onboarding_status = "active"
        entitlement.sam_onboarding_paid_at = datetime.utcnow()
        _log_entitlement_change(
            db, entitlement.workspace_id,
            "entitlement.sam_onboarding.active",
            prev, "active",
            {"stripe_session_id": session_obj.get("id")},
        )

    elif mode == "subscription":
        # Tier-based subscription activation
        tier = metadata.get("tier")
        subscription_id = session_obj.get("subscription")

        prev_status = entitlement.subscription_status
        prev_tier = entitlement.subscription_tier

        if tier:
            entitlement.subscription_tier = tier
        entitlement.subscription_status = "active"
        entitlement.subscription_start_at = datetime.utcnow()

        if subscription_id:
            entitlement.stripe_subscription_id = subscription_id

        # Update legacy compliance fields — only for complete tier
        if tier == "complete":
            entitlement.compliance_subscription_status = "active"
            entitlement.compliance_subscription_start_at = datetime.utcnow()
        else:
            entitlement.compliance_subscription_status = "inactive"

        _log_entitlement_change(
            db, entitlement.workspace_id,
            "entitlement.subscription.active",
            f"{prev_tier}/{prev_status}", f"{tier}/active",
            {"stripe_session_id": session_obj.get("id"), "stripe_subscription_id": subscription_id, "tier": tier},
        )

    db.commit()


def handle_payment_succeeded(db: Session, invoice_obj: dict) -> None:
    """
    invoice.payment_succeeded
    Confirms subscription renewal and updates end_date.
    Only applies to subscription invoices (not one-time payments).
    """
    subscription_id = invoice_obj.get("subscription")
    if not subscription_id:
        return  # one-time payment invoice — not relevant here

    entitlement = _get_entitlement_by_subscription(db, subscription_id)
    if not entitlement:
        # Fallback: lookup by customer
        customer_id = invoice_obj.get("customer")
        if customer_id:
            entitlement = _get_entitlement_by_customer(db, customer_id)
    if not entitlement:
        return

    prev = entitlement.subscription_status

    # Renew: set status active and extend end_date by 30 days
    entitlement.subscription_status = "active"
    entitlement.subscription_end_at = datetime.utcnow() + timedelta(days=30)

    # Update legacy fields — only for complete tier
    if entitlement.subscription_tier == "complete":
        entitlement.compliance_subscription_status = "active"
        entitlement.compliance_subscription_end_at = datetime.utcnow() + timedelta(days=30)
    else:
        entitlement.compliance_subscription_status = "inactive"

    _log_entitlement_change(
        db, entitlement.workspace_id,
        "entitlement.subscription.renewed",
        prev, "active",
        {"stripe_invoice_id": invoice_obj.get("id")},
    )
    db.commit()


def handle_payment_failed(db: Session, invoice_obj: dict) -> None:
    """
    invoice.payment_failed
    Immediately sets subscription_status = 'expired'.
    SOW §4.3: access blocked immediately, no grace period.
    """
    subscription_id = invoice_obj.get("subscription")
    customer_id = invoice_obj.get("customer")

    entitlement = None
    if subscription_id:
        entitlement = _get_entitlement_by_subscription(db, subscription_id)
    if not entitlement and customer_id:
        entitlement = _get_entitlement_by_customer(db, customer_id)
    if not entitlement:
        return

    prev = entitlement.subscription_status
    entitlement.subscription_status = "expired"

    # Also update legacy field
    entitlement.compliance_subscription_status = "expired"

    _log_entitlement_change(
        db, entitlement.workspace_id,
        "entitlement.subscription.expired",
        prev, "expired",
        {"stripe_invoice_id": invoice_obj.get("id")},
    )
    db.commit()


def handle_subscription_updated(db: Session, subscription_obj: dict) -> None:
    """
    customer.subscription.updated
    Updates subscription_tier based on the current price ID.
    Handles plan upgrades/downgrades.
    """
    from app.core.config import settings

    subscription_id = subscription_obj.get("id")
    customer_id = subscription_obj.get("customer")

    entitlement = None
    if subscription_id:
        entitlement = _get_entitlement_by_subscription(db, subscription_id)
    if not entitlement and customer_id:
        entitlement = _get_entitlement_by_customer(db, customer_id)
    if not entitlement:
        return

    # Read the price ID from the first subscription item
    items_data = subscription_obj.get("items", {}).get("data", [])
    if not items_data:
        return
    price_id = items_data[0].get("price", {}).get("id")
    if not price_id:
        return

    # Map price ID back to tier
    price_to_tier = {
        settings.STRIPE_PRICE_ID_INTELLIGENCE: "intelligence",
        settings.STRIPE_PRICE_ID_COMPLETE: "complete",
    }
    new_tier = price_to_tier.get(price_id)
    if not new_tier:
        return  # Unknown price ID — skip

    prev_tier = entitlement.subscription_tier
    if prev_tier == new_tier:
        return  # No change

    entitlement.subscription_tier = new_tier

    _log_entitlement_change(
        db, entitlement.workspace_id,
        "entitlement.subscription.tier_changed",
        prev_tier, new_tier,
        {"stripe_subscription_id": subscription_id, "price_id": price_id},
    )
    db.commit()


def handle_subscription_deleted(db: Session, subscription_obj: dict) -> None:
    """
    customer.subscription.deleted
    Immediately sets subscription_status = 'canceled' and subscription_tier = 'free'.
    SOW §4.3: any -> canceled (immediate, no grace period).
    """
    subscription_id = subscription_obj.get("id")
    customer_id = subscription_obj.get("customer")

    entitlement = None
    if subscription_id:
        entitlement = _get_entitlement_by_subscription(db, subscription_id)
    if not entitlement and customer_id:
        entitlement = _get_entitlement_by_customer(db, customer_id)
    if not entitlement:
        return

    prev_status = entitlement.subscription_status
    prev_tier = entitlement.subscription_tier
    entitlement.subscription_status = "canceled"
    entitlement.subscription_tier = "free"
    entitlement.stripe_subscription_id = None  # clear so re-subscription works

    # Also update legacy field
    entitlement.compliance_subscription_status = "canceled"

    _log_entitlement_change(
        db, entitlement.workspace_id,
        "entitlement.subscription.canceled",
        f"{prev_tier}/{prev_status}", "free/canceled",
        {"stripe_subscription_id": subscription_id},
    )
    db.commit()
