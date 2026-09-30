"""001_initial_schema

M1 Migration — creates all tables required for:
  - workspaces, users (auth)
  - entitlements (SOW §4.2 state machine)
  - stripe_events (idempotency)
  - audit_logs (SOW §4.4 auditability)

Revision ID: 001
Revises: (none)
Create Date: 2026-02-19
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import types
import uuid

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- ENUM types (must be created before tables) ---
    conn = op.get_bind()

    # Helper function to check if ENUM exists
    def enum_exists(enum_name):
        result = conn.execute(sa.text(
            "SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = :name)"
        ), {"name": enum_name})
        return result.scalar()

    # SOW §4.2 SAM onboarding states
    if not enum_exists("sam_onboarding_status"):
        conn.execute(sa.text(
            "CREATE TYPE sam_onboarding_status AS ENUM "
            "('inactive', 'pending_checkout', 'active', 'expired', 'canceled', 'completed')"
        ))

    # SOW §4.2 Compliance subscription states
    if not enum_exists("compliance_sub_status"):
        conn.execute(sa.text(
            "CREATE TYPE compliance_sub_status AS ENUM "
            "('inactive', 'pending_checkout', 'active', 'expired', 'canceled')"
        ))

    if not enum_exists("user_role"):
        conn.execute(sa.text(
            "CREATE TYPE user_role AS ENUM ('owner', 'admin', 'viewer')"
        ))

    if not enum_exists("stripe_event_status"):
        conn.execute(sa.text(
            "CREATE TYPE stripe_event_status AS ENUM ('pending', 'success', 'failed')"
        ))

    if not enum_exists("audit_actor_type"):
        conn.execute(sa.text(
            "CREATE TYPE audit_actor_type AS ENUM ('user', 'system', 'admin')"
        ))

    # --- workspaces ---
    op.create_table(
        "workspaces",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # --- users ---
    conn.execute(sa.text("""
        CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            workspace_id UUID NOT NULL REFERENCES workspaces(id),
            email VARCHAR(255) UNIQUE NOT NULL,
            hashed_password VARCHAR(255) NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT true,
            role user_role NOT NULL DEFAULT 'owner',
            created_at TIMESTAMP DEFAULT now(),
            last_login_at TIMESTAMP
        )
    """))
    op.create_index("ix_users_email", "users", ["email"])

    # --- entitlements (SOW §4.2 state machine) ---
    conn.execute(sa.text("""
        CREATE TABLE entitlements (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            workspace_id UUID UNIQUE NOT NULL REFERENCES workspaces(id),
            sam_onboarding_status sam_onboarding_status NOT NULL DEFAULT 'inactive',
            sam_onboarding_paid_at TIMESTAMP,
            sam_onboarding_completed_at TIMESTAMP,
            compliance_subscription_status compliance_sub_status NOT NULL DEFAULT 'inactive',
            compliance_subscription_start_at TIMESTAMP,
            compliance_subscription_end_at TIMESTAMP,
            stripe_customer_id VARCHAR(255),
            stripe_subscription_id VARCHAR(255),
            stripe_onboarding_checkout_id VARCHAR(255),
            updated_at TIMESTAMP DEFAULT now()
        )
    """))
    op.create_index("ix_entitlements_stripe_customer_id", "entitlements", ["stripe_customer_id"])

    # --- stripe_events (idempotency — SOW §4.4) ---
    conn.execute(sa.text("""
        CREATE TABLE stripe_events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
            event_type VARCHAR(100) NOT NULL,
            processing_status stripe_event_status DEFAULT 'pending',
            error_message TEXT,
            payload JSONB,
            processed_at TIMESTAMP DEFAULT now()
        )
    """))
    op.create_index("ix_stripe_events_stripe_event_id", "stripe_events", ["stripe_event_id"])

    # --- audit_logs (SOW §4.4 — all entitlement/workflow changes logged) ---
    conn.execute(sa.text("""
        CREATE TABLE audit_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            workspace_id UUID NOT NULL REFERENCES workspaces(id),
            actor_type audit_actor_type NOT NULL,
            actor_id VARCHAR(255),
            event_type VARCHAR(100) NOT NULL,
            previous_state VARCHAR(50),
            new_state VARCHAR(50),
            metadata JSONB,
            created_at TIMESTAMP DEFAULT now()
        )
    """))
    op.create_index("ix_audit_logs_workspace_id", "audit_logs", ["workspace_id"])
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"])


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("stripe_events")
    op.drop_table("entitlements")
    op.drop_table("users")
    op.drop_table("workspaces")

    op.execute("DROP TYPE IF EXISTS audit_actor_type")
    op.execute("DROP TYPE IF EXISTS stripe_event_status")
    op.execute("DROP TYPE IF EXISTS user_role")
    op.execute("DROP TYPE IF EXISTS compliance_sub_status")
    op.execute("DROP TYPE IF EXISTS sam_onboarding_status")
