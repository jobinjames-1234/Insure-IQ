from sqlalchemy import Column, String, Float, Boolean, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base
from app.models.mixins import TimestampMixin, TenantMixin

class SubscriptionPlan(Base, TimestampMixin):
    __tablename__ = "subscription_plans"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)
    price_monthly = Column(Float, nullable=False)
    max_users = Column(Float, nullable=True) # Float to allow Infinity if we wanted, or Integer
    features = Column(String, nullable=True)

class TenantInvoice(Base, TimestampMixin, TenantMixin):
    __tablename__ = "tenant_invoices"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    amount_due = Column(Float, nullable=False)
    due_date = Column(Date, nullable=False)
    status = Column(String, default="unpaid") # unpaid, paid, overdue
    invoice_url = Column(String, nullable=True)

class CommissionRecord(Base, TimestampMixin, TenantMixin):
    __tablename__ = "commission_records"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    policy_id = Column(UUID(as_uuid=True), ForeignKey("policies.id"), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String, default="pending") # pending, paid
    calculation_date = Column(Date, nullable=False)
