import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from app.core.database import Base

WORKFLOW_STEPS = [
    "business_info",
    "naics_codes",
    "banking_info",
    "reps_certs",
    "document_review",
    "preflight",
    "complete",
]


class WorkflowSession(Base):
    __tablename__ = "workflow_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=False)
    session_type = Column(
        Enum("sam_onboarding", "renewal", name="workflow_session_type"),
        default="sam_onboarding",
    )
    status = Column(
        Enum("not_started", "in_progress", "preflight", "submitted", "completed", "abandoned",
             name="workflow_status"),
        default="not_started",
    )
    current_step = Column(String(50), default="business_info")
    step_data = Column(JSONB, default=dict)         # partial data per step
    completed_steps = Column(ARRAY(String), default=list)
    preflight_results = Column(JSONB, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    last_active_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)


class RepsCertsResponse(Base):
    __tablename__ = "reps_certs_responses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=False)
    workflow_session_id = Column(UUID(as_uuid=True), ForeignKey("workflow_sessions.id"))
    far_clause = Column(String(30), nullable=False)    # e.g. FAR_52_219_1
    clause_title = Column(String(255), nullable=True)
    responses = Column(JSONB, default=dict)
    is_applicable = Column(String(10), default="yes")
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
