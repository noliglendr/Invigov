"""Add compliance_deadlines table

Revision ID: 006
Revises: 005
Create Date: 2026-03-06
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, ENUM

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create deadline_type enum if it doesn't exist
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE deadline_type AS ENUM (
                'sam_renewal',
                'reps_certs_renewal',
                'cage_code_renewal',
                'custom'
            );
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)

    # Create compliance_deadlines table
    op.create_table(
        "compliance_deadlines",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("workspace_id", UUID(as_uuid=True), sa.ForeignKey("workspaces.id"), nullable=False),
        sa.Column("deadline_type", ENUM(
            "sam_renewal",
            "reps_certs_renewal",
            "cage_code_renewal",
            "custom",
            name="deadline_type",
            create_type=False  # Don't try to create the enum type
        ), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("deadline_date", sa.Date, nullable=False),
        sa.Column("is_completed", sa.Boolean, default=False),
        sa.Column("completed_at", sa.DateTime, nullable=True),
        sa.Column("notification_sent_30d", sa.Boolean, default=False),
        sa.Column("notification_sent_14d", sa.Boolean, default=False),
        sa.Column("notification_sent_7d", sa.Boolean, default=False),
        sa.Column("notification_sent_1d", sa.Boolean, default=False),
        sa.Column("source_workflow_session_id", UUID(as_uuid=True), sa.ForeignKey("workflow_sessions.id"), nullable=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.text("now()")),
    )

    # Create index on workspace_id for faster queries
    op.create_index(
        "ix_compliance_deadlines_workspace_id",
        "compliance_deadlines",
        ["workspace_id"]
    )

    # Create index on deadline_date for sorting
    op.create_index(
        "ix_compliance_deadlines_deadline_date",
        "compliance_deadlines",
        ["deadline_date"]
    )


def downgrade() -> None:
    # Drop indexes
    op.drop_index("ix_compliance_deadlines_deadline_date")
    op.drop_index("ix_compliance_deadlines_workspace_id")

    # Drop table
    op.drop_table("compliance_deadlines")

    # Drop enum type
    op.execute("DROP TYPE deadline_type")
