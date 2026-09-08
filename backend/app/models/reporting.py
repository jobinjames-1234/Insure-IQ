from sqlalchemy import Column, String, Float, Date, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.core.database import Base
from app.models.mixins import TimestampMixin, TenantMixin
from datetime import datetime

class SystemActivityLog(Base, TimestampMixin, TenantMixin):
    __tablename__ = "system_activity_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    activity_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    color = Column(String, nullable=True)
    icon_name = Column(String, nullable=True)

class FinancialLedger(Base, TimestampMixin, TenantMixin):
    __tablename__ = "financial_ledgers"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_date = Column(Date, nullable=False)
    description = Column(String, nullable=False)
    transaction_type = Column(String, nullable=False) # Credit, Debit
    amount = Column(Float, nullable=False)
    running_balance = Column(Float, nullable=False)

class ClaimSLA(Base, TimestampMixin, TenantMixin):
    __tablename__ = "claim_slas"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    claim_id = Column(String, nullable=False) # Store claim number or ID
    customer_name = Column(String, nullable=False)
    duration_days = Column(Float, nullable=False)
    target_days = Column(Float, nullable=False)
    date_closed = Column(Date, nullable=True)
    status = Column(String, nullable=False) # Met SLA, Missed SLA
