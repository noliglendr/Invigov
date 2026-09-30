"""add generated documents table

Revision ID: 004
Revises: 003
Create Date: 2026-03-04

M3 Migration: Creates generated_documents table for tracking PDF documents
stored in Cloudflare R2 with signed URL access.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create generated_documents table
    # Note: document_type enum references existing type or creates if not exists
    op.create_table(
        'generated_documents',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('workflow_session_id', postgresql.UUID(as_uuid=True), nullable=True),

        # Document metadata
        sa.Column('document_type', sa.Enum('sam_checklist', 'reps_certs', 'banking_authorization',
                                           name='document_type', create_type=False), nullable=False),
        sa.Column('filename', sa.String(255), nullable=False),

        # R2 storage
        sa.Column('r2_object_key', sa.String(500), nullable=False),
        sa.Column('file_size_bytes', sa.Integer, nullable=True),
        sa.Column('content_type', sa.String(100), server_default='application/pdf'),

        # Access control
        sa.Column('signed_url_expires_at', sa.DateTime, nullable=True),
        sa.Column('download_count', sa.Integer, server_default='0', nullable=False),
        sa.Column('last_downloaded_at', sa.DateTime, nullable=True),

        # Generation metadata
        sa.Column('generated_at', sa.DateTime, server_default=sa.text('now()'), nullable=False),
        sa.Column('generated_by_user_id', postgresql.UUID(as_uuid=True), nullable=True),

        # Status
        sa.Column('is_active', sa.Boolean, server_default='true', nullable=False),
        sa.Column('deleted_at', sa.DateTime, nullable=True),

        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.ForeignKeyConstraint(['workflow_session_id'], ['workflow_sessions.id']),
    )

    # Create indexes for common queries
    op.create_index('ix_generated_documents_workspace_id', 'generated_documents', ['workspace_id'])
    op.create_index('ix_generated_documents_document_type', 'generated_documents', ['document_type'])
    op.create_index('ix_generated_documents_generated_at', 'generated_documents', ['generated_at'])
    op.create_index('ix_generated_documents_r2_object_key', 'generated_documents', ['r2_object_key'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_generated_documents_r2_object_key', 'generated_documents')
    op.drop_index('ix_generated_documents_generated_at', 'generated_documents')
    op.drop_index('ix_generated_documents_document_type', 'generated_documents')
    op.drop_index('ix_generated_documents_workspace_id', 'generated_documents')
    op.drop_table('generated_documents')
    op.execute('DROP TYPE IF EXISTS document_type')
