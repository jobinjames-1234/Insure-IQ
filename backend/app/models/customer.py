from sqlalchemy import Column, String, Boolean, JSON, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base
from app.models.mixins import TimestampMixin, TenantMixin

class Customer(Base, TimestampMixin, TenantMixin):
    __tablename__ = "customers"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Depending on architecture, a Customer might link back to a User record
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    status = Column(String, default="active")
    customer_type = Column(String, default="retail")

class CustomerProfile(Base, TimestampMixin, TenantMixin):
    __tablename__ = "customer_profiles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), unique=True, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address_line1 = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)

class IdentityDocument(Base, TimestampMixin, TenantMixin):
    __tablename__ = "identity_documents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    document_type = Column(String, nullable=False) # e.g., Passport, SSN, Driving License
    document_number = Column(String, nullable=False)
    file_url = Column(String, nullable=True)

class KycApplication(Base, TimestampMixin, TenantMixin):
    __tablename__ = "kyc_applications"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    status = Column(String, default="pending") # pending, approved, rejected
    submitted_data = Column(JSON, default=dict)

class KycVerificationResult(Base, TimestampMixin, TenantMixin):
    __tablename__ = "kyc_verification_results"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("kyc_applications.id"), unique=True, nullable=False)
    verified_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    comments = Column(String, nullable=True)
    risk_rating = Column(String, nullable=True)

class RetentionAlert(Base, TimestampMixin, TenantMixin):
    __tablename__ = "retention_alerts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    severity = Column(String, nullable=False) # Urgent, High, Medium, Low
    reason = Column(String, nullable=False)
    action = Column(String, nullable=False)
    status = Column(String, default="open") # open, resolved
