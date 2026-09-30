"""
AuditLog — SOW §4.4

Records ALL state changes for:
  - Entitlement changes (entitlement.sam_onboarding.*, entitlement.compliance_subscription.*)
  - Workflow progression (workflow.step.*)
  - Document access and downloads (document.generated, document.downloaded)
  - Admin overrides (admin.entitlement.override, admin.workflow.reset)
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=False)
    actor_type = Column(
        Enum("user", "system", "admin", name="audit_actor_type"),
        nullable=False,
    )
    actor_id = Column(String(255), nullable=True)    # user.id or 'stripe_webhook'
    event_type = Column(String(100), nullable=False) # e.g. 'entitlement.sam_onboarding.active'
    previous_state = Column(String(50), nullable=True)
    new_state = Column(String(50), nullable=True)
    extra_data = Column(JSONB, nullable=True)          # stripe_event_id, step_name, doc_id, etc.
    created_at = Column(DateTime, default=datetime.utcnow)
