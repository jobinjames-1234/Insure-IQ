from sqlalchemy import Column, String, Boolean, JSON, Float, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base
from app.models.mixins import TimestampMixin, TenantMixin

class InsuranceProduct(Base, TimestampMixin, TenantMixin):
    __tablename__ = "insurance_products"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, default="draft")
    category = Column(String, nullable=False) # e.g., Auto, Health
    
    policy_types = relationship("PolicyType", back_populates="product")

class PolicyType(Base, TimestampMixin, TenantMixin):
    __tablename__ = "policy_types"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("insurance_products.id"), nullable=False)
    name = Column(String, nullable=False)
    term_months = Column(Float, nullable=False)
    
    product = relationship("InsuranceProduct", back_populates="policy_types")

class Coverage(Base, TimestampMixin, TenantMixin):
    __tablename__ = "coverages"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    policy_type_id = Column(UUID(as_uuid=True), ForeignKey("policy_types.id"), nullable=False)
    name = Column(String, nullable=False)
    limit_amount = Column(Float, nullable=False)
    deductible = Column(Float, nullable=True)

class PremiumBand(Base, TimestampMixin, TenantMixin):
    __tablename__ = "premium_bands"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    policy_type_id = Column(UUID(as_uuid=True), ForeignKey("policy_types.id"), nullable=False)
    base_premium = Column(Float, nullable=False)
    risk_factor_multiplier = Column(Float, default=1.0)

class Quote(Base, TimestampMixin, TenantMixin):
    __tablename__ = "quotes"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=True)
    policy_type_id = Column(UUID(as_uuid=True), ForeignKey("policy_types.id"), nullable=False)
    status = Column(String, default="active") # active, converted, expired
    quote_data = Column(JSON, default=dict)
    quoted_premium = Column(Float, nullable=False)
    valid_until = Column(Date, nullable=False)

class Application(Base, TimestampMixin, TenantMixin):
    __tablename__ = "applications"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    policy_type_id = Column(UUID(as_uuid=True), ForeignKey("policy_types.id"), nullable=False)
    quote_id = Column(UUID(as_uuid=True), ForeignKey("quotes.id"), nullable=True)
    status = Column(String, default="draft") # draft, submitted, under_review, approved, rejected
    application_data = Column(JSON, default=dict)
    quoted_premium = Column(Float, nullable=True)

class ApplicationDocument(Base, TimestampMixin, TenantMixin):
    __tablename__ = "application_documents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False)
    document_type = Column(String, nullable=False)
    file_url = Column(String, nullable=False)

class ApplicationStatusHistory(Base, TimestampMixin, TenantMixin):
    __tablename__ = "application_status_history"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False)
    old_status = Column(String, nullable=True)
    new_status = Column(String, nullable=False)
    changed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    comments = Column(String, nullable=True)

class Policy(Base, TimestampMixin, TenantMixin):
    __tablename__ = "policies"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), unique=True, nullable=False)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    policy_type_id = Column(UUID(as_uuid=True), ForeignKey("policy_types.id"), nullable=False)
    policy_number = Column(String, unique=True, nullable=False)
    status = Column(String, default="active") # active, expired, cancelled
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_premium = Column(Float, nullable=False)

class PolicyCoverage(Base, TimestampMixin, TenantMixin):
    __tablename__ = "policy_coverages"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    policy_id = Column(UUID(as_uuid=True), ForeignKey("policies.id"), nullable=False)
    coverage_id = Column(UUID(as_uuid=True), ForeignKey("coverages.id"), nullable=False)

class PolicyDocument(Base, TimestampMixin, TenantMixin):
    __tablename__ = "policy_documents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    policy_id = Column(UUID(as_uuid=True), ForeignKey("policies.id"), nullable=False)
    document_type = Column(String, nullable=False)
    file_url = Column(String, nullable=False)

class PolicyStatusHistory(Base, TimestampMixin, TenantMixin):
    __tablename__ = "policy_status_history"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    policy_id = Column(UUID(as_uuid=True), ForeignKey("policies.id"), nullable=False)
    old_status = Column(String, nullable=True)
    new_status = Column(String, nullable=False)
    changed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reason = Column(String, nullable=True)
