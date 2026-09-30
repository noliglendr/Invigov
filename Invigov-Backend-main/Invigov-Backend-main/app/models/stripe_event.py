import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base


class StripeEvent(Base):
    __tablename__ = "stripe_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stripe_event_id = Column(String(255), unique=True, nullable=False, index=True)
    event_type = Column(String(100), nullable=False)
    processing_status = Column(
        Enum("pending", "success", "failed", name="stripe_event_status"),
        default="pending",
    )
    error_message = Column(Text, nullable=True)
    payload = Column(JSONB, nullable=True)
    processed_at = Column(DateTime, default=datetime.utcnow)
