"""add business profiles table

Revision ID: 003
Revises: 002
Create Date: 2026-03-04

M2 Migration: Creates business_profiles table for storing completed workflow data.
This table holds all business entity information collected during the SAM onboarding workflow.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create business_profiles table
    # Note: business_type enum is created inline by SQLAlchemy, no need to create separately
    op.create_table(
        'business_profiles',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), nullable=False),

        # Core identity
        sa.Column('legal_name', sa.String(255), nullable=True),
        sa.Column('dba_name', sa.String(255), nullable=True),
        sa.Column('ein_encrypted', sa.LargeBinary, nullable=True),
        sa.Column('ein_last_four', sa.String(4), nullable=True),

        # Address
        sa.Column('address_line1', sa.String(255), nullable=True),
        sa.Column('address_line2', sa.String(255), nullable=True),
        sa.Column('city', sa.String(100), nullable=True),
        sa.Column('state', sa.String(2), nullable=True),
        sa.Column('zip_code', sa.String(10), nullable=True),
        sa.Column('country', sa.String(2), server_default='US'),

        # Entity type (reference existing enum if it exists)
        sa.Column('business_type', sa.Enum('sole_proprietor', 'llc', 'corporation',
                                           'partnership', 'nonprofit',
                                           name='business_type', create_type=False), nullable=True),

        # NAICS codes
        sa.Column('naics_codes', postgresql.ARRAY(sa.String(6)), nullable=True),
        sa.Column('primary_naics', sa.String(6), nullable=True),

        # Banking (AES-256-GCM encrypted)
        sa.Column('banking_routing_encrypted', sa.LargeBinary, nullable=True),
        sa.Column('routing_last_four', sa.String(4), nullable=True),
        sa.Column('banking_account_encrypted', sa.LargeBinary, nullable=True),
        sa.Column('account_last_four', sa.String(4), nullable=True),
        sa.Column('banking_account_holder', sa.String(255), nullable=True),
        sa.Column('bank_name', sa.String(255), nullable=True),

        # SAM.gov identifiers
        sa.Column('uei_number', sa.String(12), nullable=True),
        sa.Column('cage_code', sa.String(5), nullable=True),

        # Size metrics
        sa.Column('annual_receipts_avg', sa.Integer, nullable=True),
        sa.Column('total_employees', sa.Integer, nullable=True),

        # Timestamps
        sa.Column('created_at', sa.DateTime, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime, server_default=sa.text('now()')),

        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.UniqueConstraint('workspace_id', name='uq_business_profiles_workspace_id')
    )

    # Create indexes for common queries
    op.create_index('ix_business_profiles_workspace_id', 'business_profiles', ['workspace_id'])
    op.create_index('ix_business_profiles_uei_number', 'business_profiles', ['uei_number'])


def downgrade() -> None:
    op.drop_index('ix_business_profiles_uei_number', 'business_profiles')
    op.drop_index('ix_business_profiles_workspace_id', 'business_profiles')
    op.drop_table('business_profiles')
    op.execute('DROP TYPE IF EXISTS business_type')
