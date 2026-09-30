import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Date, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


class ComplianceDeadline(Base):
    __tablename__ = "compliance_deadlines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=False)
    deadline_type = Column(
        Enum("sam_renewal", "reps_certs_renewal", "cage_code_renewal", "custom",
             name="deadline_type"),
        nullable=False,
    )
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    deadline_date = Column(Date, nullable=False)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    notification_sent_30d = Column(Boolean, default=False)
    notification_sent_14d = Column(Boolean, default=False)
    notification_sent_7d = Column(Boolean, default=False)
    notification_sent_1d = Column(Boolean, default=False)
    source_workflow_session_id = Column(UUID(as_uuid=True), ForeignKey("workflow_sessions.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
