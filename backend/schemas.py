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


class CustomerBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    dob: Optional[str] = None
    address: Optional[str] = None

class CustomerCreate(CustomerBase):
    churn_risk_flag: Optional[bool] = False
    risk_flag: Optional[str] = "low"


class CustomerResponse(BaseModel):
    id: int
    tenant_id: int
    agent_id: Optional[int] = None
    first_name: str
    last_name: str
    full_name: str
    email: str
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    dob: Optional[str] = None
    address: Optional[str] = None
    status: str
    churn_risk_flag: bool = False
    risk_flag: str = "low"
    policy_count: int = 0
    total_premium: float = 0.0
    next_renewal_date: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CustomerListResponse(BaseModel):
    items: List[CustomerResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class CustomerPolicyItem(BaseModel):
    id: int
    policy_number: str
    product_type: str
    premium_amount: float
    coverage_limit: float
    deductible: float
    status: str
    start_date: datetime
    end_date: Optional[datetime] = None
    renewal_date: Optional[str] = None
    days_until_renewal: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CustomerPoliciesResponse(BaseModel):
    customer_id: int
    customer_name: str
    policies: List[CustomerPolicyItem]
    total_active_premium: float
    active_count: int


class CustomerClaimItem(BaseModel):
    id: int
    claim_number: str
    policy_number: str
    incident_date: datetime
    incident_type: str
    incident_description: str
    claimed_amount: float
    approved_settlement_amount: Optional[float] = None
    deductible_applied: Optional[float] = None
    status: str
    sla_deadline: Optional[datetime] = None
    created_at: datetime
    decided_at: Optional[datetime] = None
    decided_by_name: Optional[str] = None

    class Config:
        from_attributes = True


class CustomerClaimsResponse(BaseModel):
    customer_id: int
    customer_name: str
    claims: List[CustomerClaimItem]
    total_claimed: float
    total_approved: float
    open_claims_count: int


class CustomerNoteCreate(BaseModel):
    note: str = Field(..., min_length=5, max_length=2000, description="Customer interaction or outreach note")


class CustomerNoteResponse(BaseModel):
    id: int
    customer_id: int
    agent_id: int
    agent_name: str
    note: str
    created_at: datetime

    class Config:
        from_attributes = True


class CustomerNotesListResponse(BaseModel):
    customer_id: int
    customer_name: str
    notes: List[CustomerNoteResponse]
    total: int


class AgentApplicationCreate(BaseModel):
    customer_id: int
    product_type: str = Field(..., description="auto, property, home, life, health")
    coverage_amount: float = Field(..., gt=0, description="Total coverage limit")
    proposed_premium: float = Field(..., gt=0, description="Proposed annual premium")
    effective_date: Optional[str] = None
    applicant_data: Optional[Dict[str, Any]] = None


class AgentApplicationResponse(BaseModel):
    id: int
    tenant_id: int
    agent_id: Optional[int] = None
    customer_id: Optional[int] = None
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
    documents: Optional[list] = None
    decision_note: Optional[str] = None
    decided_at: Optional[datetime] = None
    decided_by_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AgentApplicationListItem(BaseModel):
    id: int
    application_number: str
    customer_id: Optional[int] = None
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
    document_count: int
    decision_note: Optional[str] = None
    decided_at: Optional[datetime] = None
    decided_by_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AgentApplicationsListResponse(BaseModel):
    applications: List[AgentApplicationListItem]
    total: int
    page: int
    limit: int
    total_pages: int
    status_counts: Dict[str, int]



class ApplicationDocumentCreate(BaseModel):
    doc_type: str = Field(..., description="drivers_license, property_deed, inspection_report, medical_records, id_proof, income_proof, vehicle_title, other")
    file_name: str = Field(..., min_length=3, max_length=255)
    file_url: Optional[str] = None
    file_size_bytes: Optional[int] = Field(default=0, ge=0, le=10 * 1024 * 1024)
    description: Optional[str] = None


class ApplicationDocumentItem(BaseModel):
    id: str
    doc_type: str
    name: str
    url: Optional[str] = None
    size_bytes: int
    description: Optional[str] = None
    uploaded_at: str
    uploaded_by: str


class ApplicationDocumentsResponse(BaseModel):
    application_id: int
    application_number: str
    documents: List[ApplicationDocumentItem]
    total: int


class RetentionAlertItem(BaseModel):
    id: int
    policy_id: Optional[int] = None
    policy_number: str
    customer_id: Optional[int] = None
    customer_name: str
    customer_email: str
    customer_phone: Optional[str] = None
    product_type: str
    alert_type: str
    churn_reason: Optional[str] = None
    renewal_date: Optional[datetime] = None
    days_remaining: int
    urgency: str  # critical (<=7), moderate (8-14), standard (>14)
    status: str
    resolved_at: Optional[datetime] = None
    resolution_note: Optional[str] = None
    created_at: datetime


class RetentionAlertsListResponse(BaseModel):
    alerts: List[RetentionAlertItem]
    total: int
    page: int
    limit: int
    total_pages: int
    open_count: int
    resolved_count: int
    critical_count: int
    moderate_count: int


class RetentionAlertCreate(BaseModel):
    agent_id: int
    customer_id: Optional[int] = None
    policy_id: Optional[int] = None
    policy_number: str
    customer_name: str
    customer_email: str
    customer_phone: Optional[str] = None
    product_type: str
    alert_type: str = "upcoming_renewal"
    churn_reason: Optional[str] = None
    renewal_date: Optional[datetime] = None
    days_remaining: int = 30


class OutreachLogCreate(BaseModel):
    contact_method: str = Field(..., description="call, email, in_person, sms")
    outcome: str = Field(..., description="contacted_renewing, left_message, unreachable, not_renewing")
    notes: Optional[str] = Field(None, max_length=1000)


class OutreachLogItem(BaseModel):
    id: int
    alert_id: Optional[int] = None
    customer_id: Optional[int] = None
    agent_id: int
    agent_name: str
    contact_method: str
    outcome: str
    notes: Optional[str] = None
    logged_at: datetime


class AlertOutreachResponse(BaseModel):
    outreach: OutreachLogItem
    alert_id: int
    alert_status: str
    resolution_note: Optional[str] = None
    policy_renewed: bool


class CommissionItem(BaseModel):
    id: int
    policy_id: Optional[int] = None
    policy_number: str
    customer_id: Optional[int] = None
    customer_name: str
    product_type: str
    event_type: str
    premium_amount: float
    commission_rate: float
    commission_amount: float
    status: str
    effective_date: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    created_at: datetime


class CommissionSummary(BaseModel):
    total_earned: float
    paid_amount: float
    pending_amount: float
    mtd_amount: float
    ytd_amount: float
    pending_count: int
    paid_count: int


class CommissionListResponse(BaseModel):
    entries: List[CommissionItem]
    total: int
    page: int
    limit: int
    total_pages: int
    summary: CommissionSummary













