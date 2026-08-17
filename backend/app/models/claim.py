from sqlalchemy import Column, String, Float, Date, ForeignKey, JSON, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base
from app.models.mixins import TimestampMixin, TenantMixin

class Claim(Base, TimestampMixin, TenantMixin):
    __tablename__ = "claims"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    policy_id = Column(UUID(as_uuid=True), ForeignKey("policies.id"), nullable=False)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    claim_number = Column(String, unique=True, nullable=False)
    status = Column(String, default="submitted") # submitted, investigating, approved, rejected, paid
    incident_date = Column(Date, nullable=False)
    reported_date = Column(Date, nullable=False)
    description = Column(String, nullable=False)
    claimed_amount = Column(Float, nullable=False)
    approved_amount = Column(Float, nullable=True)

class ClaimDocument(Base, TimestampMixin, TenantMixin):
    __tablename__ = "claim_documents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    claim_id = Column(UUID(as_uuid=True), ForeignKey("claims.id"), nullable=False)
    document_type = Column(String, nullable=False) # e.g., Police Report, Photo, Estimate
    file_url = Column(String, nullable=False)
    extracted_data = Column(JSON, nullable=True) # Used by OCR/NLP model later

class ClaimStatusHistory(Base, TimestampMixin, TenantMixin):
    __tablename__ = "claim_status_history"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    claim_id = Column(UUID(as_uuid=True), ForeignKey("claims.id"), nullable=False)
    old_status = Column(String, nullable=True)
    new_status = Column(String, nullable=False)
    changed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    comments = Column(String, nullable=True)

class AdjusterNote(Base, TimestampMixin, TenantMixin):
    __tablename__ = "adjuster_notes"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    claim_id = Column(UUID(as_uuid=True), ForeignKey("claims.id"), nullable=False)
    adjuster_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    note_text = Column(String, nullable=False)
    is_internal = Column(Boolean, default=True)
