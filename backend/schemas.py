from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from .models import Role, IsolationMode, TenantStatus, UserStatus, PolicyConfigStatus

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    role: Role
    tenant_id: Optional[int] = None
    status: Optional[UserStatus] = UserStatus.active
    profile_photo: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TeamMemberInvite(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    role: Role
    temporary_password: str = Field(..., min_length=6)

class TeamMemberUpdateRole(BaseModel):
    role: Role

class TeamMemberUpdateDetails(BaseModel):
    name: Optional[str] = None
    email: EmailStr

class TeamMemberResetPassword(BaseModel):
    new_password: str = Field(..., min_length=6)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    tenant_id: int

class SuperAdminForgotPasswordRequest(BaseModel):
    email: EmailStr

class UserUpdate(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    profile_photo: Optional[str] = None

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str


class TenantBase(BaseModel):
    name: str
    subdomain: str = Field(..., pattern="^[a-z0-9-]+$")
    isolation_mode: IsolationMode
    plan_tier: str

class TenantCreate(TenantBase):
    admin_email: EmailStr
    admin_password: str

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    subdomain: Optional[str] = Field(None, pattern="^[a-z0-9-]+$")
    isolation_mode: Optional[IsolationMode] = None
    plan_tier: Optional[str] = None
    status: Optional[TenantStatus] = None

class Tenant(TenantBase):
    id: int
    status: TenantStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    tenant_id: Optional[int] = None

class PolicyConfigBase(BaseModel):
    product_type: str  # e.g., "auto", "property", "health", "life"
    name: str          # e.g., "Auto Comprehensive & Collision"
    description: Optional[str] = None
    status: Optional[PolicyConfigStatus] = PolicyConfigStatus.active

    # Coverage Limits & Deductibles
    max_coverage_limit: float = 100000.0
    standard_deductible: float = 500.0

    # Coverage & Eligibility Rules
    min_driver_age: Optional[int] = 18
    max_vehicle_age: Optional[int] = 25
    rules: Optional[Dict[str, Any]] = None

    # Premium Bands
    base_min_premium: float = 0.0
    base_max_premium: float = 0.0
    standard_min_premium: float = 0.0
    standard_max_premium: float = 0.0
    premium_min_premium: float = 0.0
    premium_max_premium: float = 0.0

    # Approval Thresholds & Workflow Controls
    stp_limit: float = 0.0
    manual_review_threshold: float = 0.0
    enable_auto_stp: bool = True

class PolicyConfigCreate(PolicyConfigBase):
    pass

class PolicyConfigUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[PolicyConfigStatus] = None

    max_coverage_limit: Optional[float] = None
    standard_deductible: Optional[float] = None

    min_driver_age: Optional[int] = None
    max_vehicle_age: Optional[int] = None
    rules: Optional[Dict[str, Any]] = None

    base_min_premium: Optional[float] = None
    base_max_premium: Optional[float] = None
    standard_min_premium: Optional[float] = None
    standard_max_premium: Optional[float] = None
    premium_min_premium: Optional[float] = None
    premium_max_premium: Optional[float] = None

    stp_limit: Optional[float] = None
    manual_review_threshold: Optional[float] = None
    enable_auto_stp: Optional[bool] = None

class PolicyConfig(PolicyConfigBase):
    id: int
    tenant_id: int
    version: str
    last_updated_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AuditLog(BaseModel):
    id: int
    tenant_id: int
    created_at: datetime
    actor_id: Optional[int] = None
    actor_name: Optional[str] = None
    actor_email: Optional[str] = None
    actor_role: Optional[str] = None
    category: str
    action: str
    outcome: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    entity_name: Optional[str] = None
    summary: str
    notes: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class TenantSubscription(BaseModel):
    id: int
    tenant_id: int
    plan_tier: str
    billing_cycle: str
    base_fee: float
    policy_quota: int
    claim_quota: int
    cycle_reset_date: Optional[datetime] = None
    payment_method_type: str
    card_brand: str
    card_last4: str
    card_exp_month: int
    card_exp_year: int
    billing_email: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TenantInvoice(BaseModel):
    id: int
    tenant_id: int
    invoice_number: str
    invoice_date: datetime
    due_date: datetime
    period_start: datetime
    period_end: datetime
    amount: float
    status: str
    paid_at: Optional[datetime] = None
    payment_reference: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UsageMetrics(BaseModel):
    policies_issued: int
    policy_quota: int
    policy_utilization: float
    claims_processed: int
    claim_quota: int
    claim_utilization: float
    is_near_limit: bool

class BillingSummary(BaseModel):
    subscription: TenantSubscription
    usage: UsageMetrics
    invoices: list[TenantInvoice]
    estimated_next_bill: float

class PaymentMethodUpdate(BaseModel):
    cardholder_name: str
    card_number: str
    exp_month: int = Field(..., ge=1, le=12)
    exp_year: int = Field(..., ge=2024, le=2040)
    cvc: str = Field(..., min_length=3, max_length=4)
    billing_email: Optional[EmailStr] = None

class PlanTierUpdate(BaseModel):
    plan_tier: str  # Starter, Growth, Enterprise AI

class UnderwritingStats(BaseModel):
    pending_review_count: int
    average_risk_score: float
    approved_today_count: int
    referred_today_count: int

class PolicyApplicationBase(BaseModel):
    applicant_name: str
    applicant_email: EmailStr
    applicant_phone: Optional[str] = None
    product_type: str
    coverage_amount: float
    proposed_premium: float
    applicant_data: Optional[Dict[str, Any]] = None

class PolicyApplicationCreate(PolicyApplicationBase):
    policy_config_id: Optional[int] = None
    risk_score: Optional[int] = None

class PolicyApplicationOut(BaseModel):
    id: int
    tenant_id: int
    policy_config_id: Optional[int] = None
    application_number: str
    applicant_name: str
    applicant_email: str
    applicant_phone: Optional[str] = None
    product_type: str
    coverage_amount: float
    proposed_premium: float
    adjusted_premium: Optional[float] = None
    risk_score: int
    risk_tier: str
    status: str
    applicant_data: Optional[Dict[str, Any]] = None
    risk_factors: Optional[Dict[str, Any]] = None
    documents: Optional[list] = None
    decision_note: Optional[str] = None
    decided_at: Optional[datetime] = None
    decided_by_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PolicyApplicationDetailOut(PolicyApplicationOut):
    policy_config_name: Optional[str] = None
    policy_config_version: Optional[str] = None
    standard_deductible: Optional[float] = 500.0
    min_allowed_premium: Optional[float] = 100.0
    max_allowed_premium: Optional[float] = 50000.0
    max_coverage_limit: Optional[float] = 1000000.0
    eligibility_evaluation: Optional[list] = None
    feature_importance: Optional[list] = None
    suggested_action: Optional[str] = None

class UnderwritingDecisionRequest(BaseModel):
    decision: str  # approved, rejected, referred
    justification_note: str = Field(..., min_length=3)
    adjusted_premium: Optional[float] = None


class ClaimCreate(BaseModel):
    policy_number: str
    incident_date: datetime
    incident_type: str  # auto_collision, property_water_damage, theft_burglary, medical_injury
    incident_description: str
    claimed_amount: float = Field(..., gt=0)
    claimant_name: Optional[str] = None
    claimant_email: Optional[EmailStr] = None
    documents: Optional[list] = None


class ClaimStats(BaseModel):
    open_claims: int
    sla_at_risk: int
    fraud_flagged: int
    settled_today: int


class ClaimListItem(BaseModel):
    id: int
    claim_number: str
    policy_number: str
    claimant_name: str
    incident_type: str
    claimed_amount: float
    fraud_score: int
    fraud_tier: str
    status: str
    age_days: int
    sla_deadline: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class ClaimDetail(BaseModel):
    id: int
    tenant_id: int
    claim_number: str
    policy_id: int
    policy_number: str
    claimant_name: str
    claimant_email: str
    incident_date: datetime
    incident_type: str
    incident_description: str
    claimed_amount: float
    approved_settlement_amount: Optional[float] = None
    deductible_applied: Optional[float] = None
    fraud_score: int
    fraud_tier: str
    fraud_indicators: Optional[list] = None
    status: str
    documents: Optional[list] = None
    structured_data: Optional[Dict[str, Any]] = None
    investigation_notes: Optional[list] = None
    settlement_note: Optional[str] = None
    sla_deadline: datetime
    created_at: datetime
    decided_at: Optional[datetime] = None
    decided_by_name: Optional[str] = None
    policy_coverage_limit: Optional[float] = None
    policy_deductible: Optional[float] = None
    policy_holder_name: Optional[str] = None
    policy_start_date: Optional[datetime] = None

    class Config:
        from_attributes = True


class ActivePolicyOption(BaseModel):
    id: int
    policy_number: str
    holder_name: str
    holder_email: str
    product_type: str
    coverage_limit: float
    deductible: float
    start_date: datetime

    class Config:
        from_attributes = True


class InvestigationListItem(BaseModel):
    id: int
    claim_number: str
    policy_number: str
    claimant_name: str
    claimant_email: str
    incident_type: str
    claimed_amount: float
    fraud_score: int
    fraud_tier: str
    status: str
    age_days: int
    sla_deadline: datetime
    created_at: datetime
    notes_count: int
    last_note_preview: Optional[str] = None
    last_note_at: Optional[str] = None

    class Config:
        from_attributes = True


class InvestigationNoteCreate(BaseModel):
    text: str = Field(..., min_length=2)
    category: Optional[str] = "General Note"


class ClaimantPriorClaim(BaseModel):
    id: int
    claim_number: str
    incident_date: datetime
    incident_type: str
    claimed_amount: float
    approved_settlement_amount: Optional[float] = None
    status: str
    fraud_score: int
    fraud_tier: str
    created_at: datetime

    class Config:
        from_attributes = True


class SlaClaimItem(BaseModel):
    id: int
    claim_number: str
    policy_number: str
    claimant_name: str
    incident_type: str
    claimed_amount: float
    fraud_score: int
    fraud_tier: str
    status: str
    created_at: datetime
    sla_deadline: datetime
    total_sla_hours: float
    elapsed_hours: float
    remaining_hours: float
    elapsed_percent: float
    sla_status: str  # healthy, warning, critical, overdue

    class Config:
        from_attributes = True


class SlaDashboardSummary(BaseModel):
    total_in_flight: int
    healthy_count: int
    warning_count: int
    critical_count: int
    overdue_count: int
    claims: List[SlaClaimItem]




