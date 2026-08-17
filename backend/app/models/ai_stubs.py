from sqlalchemy import Column, String, Float, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base
from app.models.mixins import TimestampMixin, TenantMixin

class RiskScore(Base, TimestampMixin, TenantMixin):
    __tablename__ = "risk_scores"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), unique=True, nullable=False)
    score_value = Column(Float, nullable=False)
    risk_band = Column(String, nullable=False) # Low, Medium, High
    factors = Column(JSON, default=list) # SHAP values stored here

class FraudFlag(Base, TimestampMixin, TenantMixin):
    __tablename__ = "fraud_flags"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    claim_id = Column(UUID(as_uuid=True), ForeignKey("claims.id"), nullable=False)
    flag_type = Column(String, nullable=False) # Anomaly, Watchlist, etc.
    confidence_score = Column(Float, nullable=False)
    status = Column(String, default="open") # open, investigated, false_positive
    description = Column(String, nullable=True)

class UnderwritingDecision(Base, TimestampMixin, TenantMixin):
    __tablename__ = "underwriting_decisions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), unique=True, nullable=False)
    underwriter_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    decision = Column(String, nullable=False) # approved, rejected, referred
    rationale = Column(String, nullable=False)
    conditions = Column(String, nullable=True)

class ChurnScore(Base, TimestampMixin, TenantMixin):
    __tablename__ = "churn_scores"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), unique=True, nullable=False)
    probability = Column(Float, nullable=False) # 0.0 to 1.0
    risk_level = Column(String, nullable=False) # Low, Medium, High
    factors = Column(JSON, default=list) # SHAP factors
    model_version = Column(String, default="v1.0")
