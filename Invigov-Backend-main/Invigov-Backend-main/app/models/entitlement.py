import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

# SOW §4.2 — Required Entitlement States
SAM_ONBOARDING_STATES = (
    "inactive",          # default: no action taken
    "pending_checkout",  # Stripe checkout session created, not yet paid
    "active",            # payment confirmed via checkout.session.completed webhook
    "expired",           # payment failed (invoice.payment_failed) — not applicable to one-time
    "canceled",          # explicitly canceled
    "completed",         # workflow fully completed (onboarding only — one-time lock)
)

COMPLIANCE_SUB_STATES = (
    "inactive",          # default: not subscribed
    "pending_checkout",  # checkout session created, not yet paid
    "active",            # invoice.payment_succeeded or checkout.session.completed
    "expired",           # invoice.payment_failed — access blocked immediately
    "canceled",          # customer.subscription.deleted — access blocked immediately
)


class Entitlement(Base):
    __tablename__ = "entitlements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id"), unique=True, nullable=False)

    # One-time SAM onboarding (SOW §4.1)
    sam_onboarding_status = Column(
        Enum(*SAM_ONBOARDING_STATES, name="sam_onboarding_status"),
        default="inactive",
        nullable=False,
    )
    sam_onboarding_paid_at = Column(DateTime, nullable=True)
    sam_onboarding_completed_at = Column(DateTime, nullable=True)

    # Recurring compliance subscription (SOW §4.1)
    compliance_subscription_status = Column(
        Enum(*COMPLIANCE_SUB_STATES, name="compliance_sub_status"),
        default="inactive",
        nullable=False,
    )
    compliance_subscription_start_at = Column(DateTime, nullable=True)
    compliance_subscription_end_at = Column(DateTime, nullable=True)

    # Subscription tier model (v2)
    SUBSCRIPTION_TIERS = ("free", "intelligence", "complete")
    SUBSCRIPTION_STATUSES = ("active", "pending_checkout", "expired", "canceled")

    subscription_tier = Column(
        Enum("free", "intelligence", "complete", name="subscription_tier"),
        default="free",
        nullable=False,
        server_default="free",
    )
    subscription_status = Column(
        Enum("active", "pending_checkout", "expired", "canceled", name="subscription_status_v2"),
        default="active",
        nullable=False,
        server_default="active",
    )
    subscription_start_at = Column(DateTime, nullable=True)
    subscription_end_at = Column(DateTime, nullable=True)

    # Stripe references
    stripe_customer_id = Column(String(255), nullable=True, index=True)
    stripe_subscription_id = Column(String(255), nullable=True)
    stripe_onboarding_checkout_id = Column(String(255), nullable=True)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
