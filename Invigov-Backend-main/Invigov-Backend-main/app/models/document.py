import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Enum, Boolean
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


class GeneratedDocument(Base):
    __tablename__ = "generated_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=False, index=True)
    workflow_session_id = Column(UUID(as_uuid=True), ForeignKey("workflow_sessions.id"), nullable=True)

    # Document metadata
    document_type = Column(
        Enum("sam_checklist", "reps_certs", "banking_authorization", name="document_type"),
        nullable=False,
        index=True,
    )
    filename = Column(String(255), nullable=False)

    # R2 storage
    r2_object_key = Column(String(500), nullable=False, unique=True, index=True)
    file_size_bytes = Column(Integer, nullable=True)
    content_type = Column(String(100), default="application/pdf")

    # Access control
    signed_url_expires_at = Column(DateTime, nullable=True)
    download_count = Column(Integer, default=0, nullable=False)
    last_downloaded_at = Column(DateTime, nullable=True)

    # Generation metadata
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    generated_by_user_id = Column(UUID(as_uuid=True), nullable=True)

    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
