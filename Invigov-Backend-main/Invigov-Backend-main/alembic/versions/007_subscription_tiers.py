"""Add subscription tier columns to entitlements

Revision ID: 007
Revises: 006
Create Date: 2026-03-23
"""
from alembic import op
import sqlalchemy as sa

revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum types
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE subscription_tier AS ENUM ('free', 'intelligence', 'complete');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE subscription_status_v2 AS ENUM ('active', 'pending_checkout', 'expired', 'canceled');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Add new columns
    op.add_column(
        "entitlements",
        sa.Column(
            "subscription_tier",
            sa.Enum("free", "intelligence", "complete", name="subscription_tier", create_type=False),
            nullable=False,
            server_default="free",
        ),
    )
    op.add_column(
        "entitlements",
        sa.Column(
            "subscription_status",
            sa.Enum("active", "pending_checkout", "expired", "canceled", name="subscription_status_v2", create_type=False),
            nullable=False,
            server_default="active",
        ),
    )
    op.add_column(
        "entitlements",
        sa.Column("subscription_start_at", sa.DateTime, nullable=True),
    )
    op.add_column(
        "entitlements",
        sa.Column("subscription_end_at", sa.DateTime, nullable=True),
    )

    # Migrate existing data:
    # compliance_subscription_status='active' -> tier='intelligence', status='active'
    op.execute("""
        UPDATE entitlements
        SET subscription_tier = 'intelligence',
            subscription_status = 'active',
            subscription_start_at = compliance_subscription_start_at,
            subscription_end_at = compliance_subscription_end_at
        WHERE compliance_subscription_status = 'active'
    """)

    # sam_onboarding_status in ('active', 'completed') with no active compliance -> tier='free'
    op.execute("""
        UPDATE entitlements
        SET subscription_tier = 'free',
            subscription_status = 'active'
        WHERE sam_onboarding_status IN ('active', 'completed')
          AND compliance_subscription_status != 'active'
    """)

    # All others default to free/active (already handled by server_default,
    # but be explicit for any rows not covered above)
    op.execute("""
        UPDATE entitlements
        SET subscription_tier = 'free',
            subscription_status = 'active'
        WHERE subscription_tier = 'free'
          AND subscription_status = 'active'
          AND compliance_subscription_status != 'active'
    """)


def downgrade() -> None:
    op.drop_column("entitlements", "subscription_end_at")
    op.drop_column("entitlements", "subscription_start_at")
    op.drop_column("entitlements", "subscription_status")
    op.drop_column("entitlements", "subscription_tier")

    op.execute("DROP TYPE IF EXISTS subscription_status_v2")
    op.execute("DROP TYPE IF EXISTS subscription_tier")
