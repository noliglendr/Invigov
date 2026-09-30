import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, LargeBinary, Integer, Enum
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from app.core.database import Base


class BusinessProfile(Base):
    __tablename__ = "business_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id"), unique=True, nullable=False)

    # Core identity
    legal_name = Column(String(255), nullable=True)
    dba_name = Column(String(255), nullable=True)
    ein_encrypted = Column(LargeBinary, nullable=True)   # AES-256-GCM
    ein_last_four = Column(String(4), nullable=True)      # display only

    # Address
    address_line1 = Column(String(255), nullable=True)
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(2), nullable=True)
    zip_code = Column(String(10), nullable=True)
    country = Column(String(2), default="US")

    # Entity type
    business_type = Column(
        Enum("sole_proprietor", "llc", "corporation", "partnership", "nonprofit",
             name="business_type"),
        nullable=True,
    )

    # NAICS
    naics_codes = Column(ARRAY(String(6)), nullable=True)
    primary_naics = Column(String(6), nullable=True)

    # Banking (encrypted)
    banking_routing_encrypted = Column(LargeBinary, nullable=True)
    routing_last_four = Column(String(4), nullable=True)      # display only
    banking_account_encrypted = Column(LargeBinary, nullable=True)
    account_last_four = Column(String(4), nullable=True)      # display only
    banking_account_holder = Column(String(255), nullable=True)
    bank_name = Column(String(255), nullable=True)

    # SAM identifiers
    uei_number = Column(String(12), nullable=True)
    cage_code = Column(String(5), nullable=True)

    # Size metrics
    annual_receipts_avg = Column(Integer, nullable=True)
    total_employees = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
