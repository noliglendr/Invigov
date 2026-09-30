"""add workflow tables

Revision ID: 002_workflow_tables
Revises: 001_initial_schema
Create Date: 2026-02-27

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create workflow_sessions table
    op.create_table(
        'workflow_sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('session_type', sa.Enum('sam_onboarding', 'renewal', name='workflow_session_type'), server_default='sam_onboarding'),
        sa.Column('status', sa.Enum('not_started', 'in_progress', 'preflight', 'submitted', 'completed', 'abandoned', name='workflow_status'), server_default='not_started'),
        sa.Column('current_step', sa.String(50), server_default='business_info'),
        sa.Column('step_data', postgresql.JSONB, server_default='{}'),
        sa.Column('completed_steps', postgresql.ARRAY(sa.String), server_default='{}'),
        sa.Column('preflight_results', postgresql.JSONB, nullable=True),
        sa.Column('started_at', sa.DateTime, server_default=sa.text('now()')),
        sa.Column('last_active_at', sa.DateTime, server_default=sa.text('now()')),
        sa.Column('completed_at', sa.DateTime, nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'])
    )

    # Create reps_certs_responses table
    op.create_table(
        'reps_certs_responses',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('workflow_session_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('far_clause', sa.String(30), nullable=False),
        sa.Column('clause_title', sa.String(255), nullable=True),
        sa.Column('responses', postgresql.JSONB, server_default='{}'),
        sa.Column('is_applicable', sa.String(10), server_default='yes'),
        sa.Column('completed_at', sa.DateTime, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.ForeignKeyConstraint(['workflow_session_id'], ['workflow_sessions.id'])
    )


def downgrade() -> None:
    op.drop_table('reps_certs_responses')
    op.drop_table('workflow_sessions')
    op.execute('DROP TYPE IF EXISTS workflow_status')
    op.execute('DROP TYPE IF EXISTS workflow_session_type')
