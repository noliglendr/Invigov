"""Rename audit_logs.metadata to extra_data

Fixes mismatch between migration and model.

Revision ID: 005
Revises: 004
Create Date: 2026-03-04
"""
from alembic import op
import sqlalchemy as sa

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Rename metadata column to extra_data
    op.alter_column(
        "audit_logs",
        "metadata",
        new_column_name="extra_data",
        existing_type=sa.dialects.postgresql.JSONB,
        existing_nullable=True,
    )


def downgrade() -> None:
    # Rename extra_data back to metadata
    op.alter_column(
        "audit_logs",
        "extra_data",
        new_column_name="metadata",
        existing_type=sa.dialects.postgresql.JSONB,
        existing_nullable=True,
    )
