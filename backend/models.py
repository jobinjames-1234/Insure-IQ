from sqlalchemy import Column, Integer, String, Enum, DateTime, Float, JSON, Text, Boolean
from sqlalchemy.sql import func
from .database import Base
import enum

class IsolationMode(str, enum.Enum):
    shared = "shared"
    dedicated = "dedicated"

class TenantStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"

class Role(str, enum.Enum):
    super_admin = "super_admin"
    tenant_admin = "tenant_admin"
    underwriter = "underwriter"
    adjuster = "adjuster"
    agent = "agent"
    end_customer = "end_customer"

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    subdomain = Column(String, unique=True, index=True, nullable=False)
    isolation_mode = Column(Enum(IsolationMode), default=IsolationMode.shared, nullable=False)
    plan_tier = Column(String, nullable=False)
    status = Column(Enum(TenantStatus), default=TenantStatus.active, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now(), nullable=False)

class UserStatus(str, enum.Enum):
    active = "active"
    suspended = "suspended"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, nullable=True, index=True) # Null for super-admin
    role = Column(Enum(Role), nullable=False)
    name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    status = Column(Enum(UserStatus), default=UserStatus.active, nullable=False)
    profile_photo = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)

class PolicyConfigStatus(str, enum.Enum):
    active = "active"
    draft = "draft"
    archived = "archived"

class PolicyConfig(Base):
    __tablename__ = "policy_configs"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, nullable=False, index=True)
    product_type = Column(String, nullable=False)  # e.g., 'auto', 'property', 'health', 'life'
    name = Column(String, nullable=False)          # e.g., 'Auto Comprehensive & Collision'
    description = Column(String, nullable=True)
    status = Column(Enum(PolicyConfigStatus), default=PolicyConfigStatus.active, nullable=False)
    version = Column(String, default="v1.0", nullable=False)
    last_updated_by = Column(String, nullable=True)

    # Coverage & Eligibility Rules
    min_driver_age = Column(Integer, nullable=True)
    max_vehicle_age = Column(Integer, nullable=True)
    rules = Column(JSON, nullable=True)

    # Premium Bands
    base_min_premium = Column(Float, default=0.0, nullable=False)
    base_max_premium = Column(Float, default=0.0, nullable=False)
    standard_min_premium = Column(Float, default=0.0, nullable=False)
    standard_max_premium = Column(Float, default=0.0, nullable=False)
    premium_min_premium = Column(Float, default=0.0, nullable=False)
    premium_max_premium = Column(Float, default=0.0, nullable=False)

    # Coverage Limits & Deductibles
    max_coverage_limit = Column(Float, default=100000.0, nullable=False)
    standard_deductible = Column(Float, default=500.0, nullable=False)

    # Approval Thresholds & Workflow Controls
    stp_limit = Column(Float, default=0.0, nullable=False)  # Straight-Through Processing Limit
    manual_review_threshold = Column(Float, default=0.0, nullable=False)
    enable_auto_stp = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now(), nullable=False)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True, nullable=False)

    # Actor information
    actor_id = Column(Integer, nullable=True)
    actor_name = Column(String, nullable=True)
    actor_email = Column(String, nullable=True)
    actor_role = Column(String, nullable=True)

    # Classification & Action
    category = Column(String, index=True, nullable=False)  # policy_config, team_management, underwriting, claims, billing
    action = Column(String, index=True, nullable=False)    # created, updated, deleted, role_changed, suspended, approved, etc.
    outcome = Column(String, default="success", nullable=False) # success, approved, rejected, escalated, warning

    # Target entity
    entity_type = Column(String, nullable=True)  # policy_config, user, application, claim
    entity_id = Column(String, nullable=True)    # e.g., '1', 'POL-104', 'USR-12'
    entity_name = Column(String, nullable=True)  # e.g., 'Comprehensive Auto Shield', 'john@example.com'

    # Narrative notes & structured payload
    summary = Column(String, nullable=False)     # Human-readable single line summary
    notes = Column(Text, nullable=True)          # Detailed reasoning / justification notes
    details = Column(JSON, nullable=True)        # Structured delta / context (old/new values, scores, etc.)

class TenantSubscription(Base):
    __tablename__ = "tenant_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, nullable=False, unique=True, index=True)
    plan_tier = Column(String, default="Growth", nullable=False)  # Starter, Growth, Enterprise AI
    billing_cycle = Column(String, default="monthly", nullable=False)
    base_fee = Column(Float, default=1499.0, nullable=False)

    # Quotas for Usage Metering
    policy_quota = Column(Integer, default=5000, nullable=False)
    claim_quota = Column(Integer, default=2500, nullable=False)
    cycle_reset_date = Column(DateTime(timezone=True), nullable=True)

    # Saved Corporate Payment Method
    payment_method_type = Column(String, default="card", nullable=False)
    card_brand = Column(String, default="Visa", nullable=False)
    card_last4 = Column(String, default="4242", nullable=False)
    card_exp_month = Column(Integer, default=12, nullable=False)
    card_exp_year = Column(Integer, default=2028, nullable=False)
    billing_email = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now(), nullable=False)

class TenantInvoice(Base):
    __tablename__ = "tenant_invoices"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, nullable=False, index=True)
    invoice_number = Column(String, unique=True, index=True, nullable=False)  # e.g., INV-2026-10
    invoice_date = Column(DateTime(timezone=True), nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=False)
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String, default="paid", nullable=False)  # paid, due, pending
    paid_at = Column(DateTime(timezone=True), nullable=True)
    payment_reference = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class ApplicationStatus(str, enum.Enum):
    pending_review = "pending_review"
    approved = "approved"
    rejected = "rejected"
    referred = "referred"

class RiskTier(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"

class PolicyApplication(Base):
    __tablename__ = "policy_applications"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, nullable=False, index=True)
    policy_config_id = Column(Integer, nullable=True, index=True)
    application_number = Column(String, unique=True, index=True, nullable=False)  # e.g., APP-2026-1001
    applicant_name = Column(String, nullable=False)
    applicant_email = Column(String, nullable=False)
    applicant_phone = Column(String, nullable=True)
    product_type = Column(String, nullable=False)  # auto, health, property, life
    coverage_amount = Column(Float, default=0.0, nullable=False)
    proposed_premium = Column(Float, default=0.0, nullable=False)
    adjusted_premium = Column(Float, nullable=True)
    risk_score = Column(Integer, default=50, nullable=False)  # 1-100
    risk_tier = Column(Enum(RiskTier), default=RiskTier.medium, nullable=False)
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.pending_review, nullable=False, index=True)

    # Detailed applicant dossier and risk factors
    applicant_data = Column(JSON, nullable=True)  # driver_age, vehicle_age, property_address, medical_history, etc.
    risk_factors = Column(JSON, nullable=True)  # rule triggers / feature evaluation
    documents = Column(JSON, nullable=True)  # list of uploaded document metadata

    # Underwriter assignment and decision
    assigned_to_id = Column(Integer, nullable=True)
    decision_note = Column(Text, nullable=True)  # Mandatory justification note
    decided_at = Column(DateTime(timezone=True), nullable=True)
    decided_by_id = Column(Integer, nullable=True)
    decided_by_name = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now(), nullable=False)

class Policy(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, nullable=False, index=True)
    policy_number = Column(String, unique=True, index=True, nullable=False)  # e.g., POL-2026-001
    application_id = Column(Integer, nullable=True, index=True)
    policy_config_id = Column(Integer, nullable=True, index=True)
    holder_name = Column(String, nullable=False)
    holder_email = Column(String, nullable=False)
    product_type = Column(String, nullable=False)
    premium_amount = Column(Float, nullable=False)
    coverage_limit = Column(Float, nullable=False)
    deductible = Column(Float, default=500.0, nullable=False)
    status = Column(String, default="active", nullable=False)  # active, lapsed, cancelled
    start_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=True)
    issued_by_id = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class ClaimStatus(str, enum.Enum):
    pending_review = "pending_review"
    in_investigation = "in_investigation"
    approved = "approved"
    rejected = "rejected"


class Claim(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, nullable=False, index=True)
    claim_number = Column(String, unique=True, index=True, nullable=False)  # e.g., CLM-2026-004-1001
    policy_id = Column(Integer, nullable=False, index=True)
    policy_number = Column(String, nullable=False, index=True)
    claimant_name = Column(String, nullable=False)
    claimant_email = Column(String, nullable=False)

    incident_date = Column(DateTime(timezone=True), nullable=False)
    incident_type = Column(String, nullable=False)  # auto_collision, property_water_damage, theft_burglary, medical_injury
    incident_description = Column(Text, nullable=False)

    claimed_amount = Column(Float, nullable=False)
    approved_settlement_amount = Column(Float, nullable=True)
    deductible_applied = Column(Float, nullable=True)

    fraud_score = Column(Integer, default=15, nullable=False)  # 1 - 100
    fraud_tier = Column(String, default="low", nullable=False)  # low, medium, high
    fraud_indicators = Column(JSON, default=list, nullable=True)  # Explainable risk factor signals

    status = Column(Enum(ClaimStatus), default=ClaimStatus.pending_review, nullable=False, index=True)

    documents = Column(JSON, default=list, nullable=True)  # Source documents [{name, type, url, description}]
    structured_data = Column(JSON, default=dict, nullable=True)  # Extracted fields: repair_estimate, damage_code, etc.
    investigation_notes = Column(JSON, default=list, nullable=True)  # Multi-session thread: [{author_name, author_role, created_at, text}]
    settlement_note = Column(Text, nullable=True)

    sla_deadline = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now(), nullable=False)
    decided_at = Column(DateTime(timezone=True), nullable=True)
    decided_by_id = Column(Integer, nullable=True)
    decided_by_name = Column(String, nullable=True)



