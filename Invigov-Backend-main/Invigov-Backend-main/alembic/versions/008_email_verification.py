"""Add email verification fields to users table

Revision ID: 008
Revises: 007
Create Date: 2026-03-25
"""
from alembic import op
import sqlalchemy as sa

revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("email_verified", sa.Boolean(), server_default="false", nullable=False))
    op.add_column("users", sa.Column("verification_token", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("verification_token_expires_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "verification_token_expires_at")
    op.drop_column("users", "verification_token")
    op.drop_column("users", "email_verified")
