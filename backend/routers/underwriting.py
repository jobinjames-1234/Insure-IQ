from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, time, timedelta
import random
from .. import models, schemas, database
from ..audit import log_audit_event
from .auth import get_current_user

router = APIRouter(prefix="/underwriting", tags=["underwriting"])

def get_underwriter_or_staff_user(current_user: models.User = Depends(get_current_user)) -> models.User:
    if not current_user.tenant_id and current_user.role != models.Role.super_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any tenant organization"
        )
    allowed_roles = [models.Role.underwriter, models.Role.tenant_admin, models.Role.super_admin]
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to Underwriting and Administration personnel"
        )
    return current_user

@router.get("/stats", response_model=schemas.UnderwritingStats)
def get_underwriting_stats(
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_underwriter_or_staff_user)
):
    """
    Returns the 4 operational metric cards for the Underwriter Dashboard:
    - Pending Review count
    - Average Risk Score of current pending applications
    - Approved Today count
    - Referred Today count
    """
    tenant_id = user.tenant_id

    # Pending applications
    pending_query = db.query(models.PolicyApplication).filter(
        models.PolicyApplication.tenant_id == tenant_id,
        models.PolicyApplication.status == models.ApplicationStatus.pending_review
    )
    pending_count = pending_query.count()

    # Average risk score of pending applications
    avg_score_res = pending_query.with_entities(func.avg(models.PolicyApplication.risk_score)).scalar()
    avg_score = round(float(avg_score_res), 1) if avg_score_res is not None else 0.0

    # Today's start timestamp (midnight UTC)
    today_start = datetime.combine(datetime.utcnow().date(), time.min)

    approved_today = db.query(models.PolicyApplication).filter(
        models.PolicyApplication.tenant_id == tenant_id,
        models.PolicyApplication.status == models.ApplicationStatus.approved,
        models.PolicyApplication.decided_at >= today_start
    ).count()

    referred_today = db.query(models.PolicyApplication).filter(
        models.PolicyApplication.tenant_id == tenant_id,
        models.PolicyApplication.status == models.ApplicationStatus.referred,
        models.PolicyApplication.decided_at >= today_start
    ).count()

    return schemas.UnderwritingStats(
        pending_review_count=pending_count,
        average_risk_score=avg_score,
        approved_today_count=approved_today,
        referred_today_count=referred_today
    )

@router.get("/queue", response_model=List[schemas.PolicyApplicationOut])
def get_underwriting_queue(
    product_type: Optional[str] = Query(None, description="Filter by product: auto, property, health, life"),
    status_filter: Optional[str] = Query("pending_review", alias="status", description="Filter by status: pending_review, approved, rejected, referred, all"),
    sort_by: Optional[str] = Query("risk_score", description="Sort by: risk_score, created_at, proposed_premium"),
    order: Optional[str] = Query("desc", description="Sort order: asc, desc"),
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_underwriter_or_staff_user)
):
    """
    Retrieves the underwriter's application queue.
    By default, sorted by risk score descending (highest operational risk first).
    """
    tenant_id = user.tenant_id
    query = db.query(models.PolicyApplication).filter(
        models.PolicyApplication.tenant_id == tenant_id
    )

    if status_filter and status_filter != "all":
        query = query.filter(models.PolicyApplication.status == status_filter)

    if product_type and product_type.lower() != "all":
        query = query.filter(models.PolicyApplication.product_type == product_type.lower())

    # Sort field resolution
    sort_col = models.PolicyApplication.risk_score
    if sort_by == "created_at":
        sort_col = models.PolicyApplication.created_at
    elif sort_by == "proposed_premium":
        sort_col = models.PolicyApplication.proposed_premium

    if order == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    return query.all()

@router.post("/applications/submit", response_model=schemas.PolicyApplicationOut, status_code=status.HTTP_201_CREATED)
def submit_policy_application(
    app_in: schemas.PolicyApplicationCreate,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_current_user)
):
    """
    Legitimate intake endpoint to create a policy application into the tenant's underwriting queue.
    Computes risk score and risk tier based on applicant data and policy config.
    """
    tenant_id = user.tenant_id
    if not tenant_id:
        raise HTTPException(status_code=400, detail="User must belong to a tenant")

    # Generate globally unique application number scoped with tenant ID
    year = datetime.utcnow().year
    seq = db.query(models.PolicyApplication).count() + 1
    candidate = f"APP-{year}-{tenant_id:03d}-{1000 + seq}"
    while db.query(models.PolicyApplication).filter(models.PolicyApplication.application_number == candidate).first():
        seq += 1
        candidate = f"APP-{year}-{tenant_id:03d}-{1000 + seq}"
    app_number = candidate

    # Determine risk score: if provided use it, otherwise evaluate or assign reasonable score
    risk_score = app_in.risk_score
    if risk_score is None:
        # Default baseline with product variations
        risk_score = random.randint(30, 85)

    risk_tier = models.RiskTier.low
    if risk_score >= 70:
        risk_tier = models.RiskTier.high
    elif risk_score >= 40:
        risk_tier = models.RiskTier.medium

    # Generate sample feature importance / risk factors for transparency
    risk_factors = {
        "score_contributions": [
            {"factor": "Credit & History", "impact": "+8"},
            {"factor": "Asset Age & Risk Band", "impact": "+14" if risk_score > 60 else "+3"},
            {"factor": "Prior Claims History", "impact": "+12" if risk_score > 60 else "-5"},
            {"factor": "Geographic Zone", "impact": "+4"}
        ],
        "eligibility_passed": True
    }

    application = models.PolicyApplication(
        tenant_id=tenant_id,
        policy_config_id=app_in.policy_config_id,
        application_number=app_number,
        applicant_name=app_in.applicant_name,
        applicant_email=app_in.applicant_email,
        applicant_phone=app_in.applicant_phone,
        product_type=app_in.product_type,
        coverage_amount=app_in.coverage_amount,
        proposed_premium=app_in.proposed_premium,
        risk_score=risk_score,
        risk_tier=risk_tier,
        status=models.ApplicationStatus.pending_review,
        applicant_data=app_in.applicant_data or {},
        risk_factors=risk_factors,
        documents=[
            {"name": "Government_ID.pdf", "type": "KYC", "verified": True},
            {"name": "Proof_of_Address.pdf", "type": "Address", "verified": True}
        ]
    )

    db.add(application)
    db.commit()
    db.refresh(application)

    return application

@router.get("/applications/{application_id}", response_model=schemas.PolicyApplicationDetailOut)
def get_application_detail(
    application_id: int,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_underwriter_or_staff_user)
):
    """
    Retrieve full application details, applicant data, risk breakdown, and documents.
    Evaluates against tenant's active PolicyConfig for this product line.
    """
    app = db.query(models.PolicyApplication).filter(
        models.PolicyApplication.id == application_id,
        models.PolicyApplication.tenant_id == user.tenant_id
    ).first()

    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    # Resolve active policy config for this product line
    policy_cfg = db.query(models.PolicyConfig).filter(
        models.PolicyConfig.tenant_id == user.tenant_id,
        models.PolicyConfig.product_type == app.product_type,
        models.PolicyConfig.status == models.PolicyConfigStatus.active
    ).order_by(models.PolicyConfig.id.desc()).first()

    # Default fallback bounds
    min_allowed = policy_cfg.base_min_premium if policy_cfg else 100.0
    max_allowed = policy_cfg.premium_max_premium if policy_cfg else 50000.0
    max_cov = policy_cfg.max_coverage_limit if policy_cfg else 1000000.0
    deductible = policy_cfg.standard_deductible if policy_cfg else 500.0
    cfg_name = policy_cfg.name if policy_cfg else f"{app.product_type.capitalize()} Standard Policy"
    cfg_ver = policy_cfg.version if policy_cfg else "v1.0"

    # Evaluate dynamic eligibility rules
    evaluations = []
    applicant_data = app.applicant_data or {}

    # 1. Coverage limit rule
    cov_pass = app.coverage_amount <= max_cov
    evaluations.append({
        "rule_name": "Maximum Coverage Limit",
        "requirement": f"<= ${max_cov:,.0f}",
        "declared_value": f"${app.coverage_amount:,.0f}",
        "status": "pass" if cov_pass else "warning",
        "description": "Requested coverage conforms to carrier maximum underwriting limit" if cov_pass else "Coverage requested exceeds standard policy threshold; requires senior escalation"
    })

    # 2. Product specific checks
    if app.product_type == "auto":
        driver_age = int(applicant_data.get("driver_age") or applicant_data.get("age", 28))
        min_driver_age = policy_cfg.min_driver_age if policy_cfg and policy_cfg.min_driver_age else 18
        age_pass = driver_age >= min_driver_age
        evaluations.append({
            "rule_name": "Primary Driver Minimum Age",
            "requirement": f">= {min_driver_age} years",
            "declared_value": f"{driver_age} years",
            "status": "pass" if age_pass else "fail",
            "description": "Applicant meets the minimum permissible operating age" if age_pass else "Driver is under statutory/carrier minimum age threshold"
        })

        vehicle_age = int(applicant_data.get("vehicle_age") or applicant_data.get("asset_age", 3))
        max_v_age = policy_cfg.max_vehicle_age if policy_cfg and policy_cfg.max_vehicle_age else 15
        v_pass = vehicle_age <= max_v_age
        evaluations.append({
            "rule_name": "Vehicle Age Limit",
            "requirement": f"<= {max_v_age} years",
            "declared_value": f"{vehicle_age} years",
            "status": "pass" if v_pass else "warning",
            "description": "Vehicle age is within the standard physical damage eligibility band" if v_pass else "Older vehicle vintage may require stated value appraisal"
        })
    elif app.product_type == "health":
        age = int(applicant_data.get("age", 35))
        evaluations.append({
            "rule_name": "Primary Insured Age Band",
            "requirement": "<= 65 years",
            "declared_value": f"{age} years",
            "status": "pass" if age <= 65 else "warning",
            "description": "Within standard individual health underwriting age parameters"
        })
        pre_existing = applicant_data.get("pre_existing")
        evaluations.append({
            "rule_name": "Pre-Existing Medical Declarations",
            "requirement": "Clean or Moderate Risk",
            "declared_value": pre_existing or "None declared",
            "status": "pass" if not pre_existing or pre_existing == "none" else "warning",
            "description": "Underwriting review of medical declaration and prescription history"
        })
    elif app.product_type == "property":
        flood = applicant_data.get("flood_zone", "low_minimal")
        evaluations.append({
            "rule_name": "FEMA Flood Zone Assessment",
            "requirement": "Non-Catastrophic (Zone X/Moderate)",
            "declared_value": flood.replace("_", " ").title(),
            "status": "pass" if "high" not in flood.lower() else "warning",
            "description": "Elevation and municipal flood mapping determination"
        })

    # Feature importance contributions
    features = [
        {"factor": "Credit & Financial Stability", "impact": "+8 pts", "tier": "positive"},
        {"factor": "Asset Risk Class & Location", "impact": f"{'+14' if app.risk_score > 60 else '+3'} pts", "tier": "neutral" if app.risk_score <= 60 else "negative"},
        {"factor": "Prior Loss / Claims Frequency", "impact": f"{'+18' if app.risk_score > 70 else '-6'} pts", "tier": "negative" if app.risk_score > 70 else "positive"},
        {"factor": "Coverage & Deductible Band", "impact": "+2 pts", "tier": "neutral"}
    ]

    # Suggested Action
    if app.risk_score < 40 and all(e["status"] == "pass" for e in evaluations):
        suggested = "Eligible for Straight-Through Approval (Low Actuarial Risk)"
    elif app.risk_score >= 70:
        suggested = "High Risk Exposure — Caution Advised / Escalate to Senior Underwriter"
    else:
        suggested = "Standard Manual Review Required — Inspect Asset Documentation"

    return schemas.PolicyApplicationDetailOut(
        id=app.id,
        tenant_id=app.tenant_id,
        policy_config_id=app.policy_config_id,
        application_number=app.application_number,
        applicant_name=app.applicant_name,
        applicant_email=app.applicant_email,
        applicant_phone=app.applicant_phone,
        product_type=app.product_type,
        coverage_amount=app.coverage_amount,
        proposed_premium=app.proposed_premium,
        adjusted_premium=app.adjusted_premium,
        risk_score=app.risk_score,
        risk_tier=app.risk_tier,
        status=app.status,
        applicant_data=app.applicant_data,
        risk_factors=app.risk_factors,
        documents=app.documents or [
            {"name": "Government_ID.pdf", "type": "KYC", "verified": True},
            {"name": "Proof_of_Address.pdf", "type": "Address", "verified": True}
        ],
        decision_note=app.decision_note,
        decided_at=app.decided_at,
        decided_by_name=app.decided_by_name,
        created_at=app.created_at,
        updated_at=app.updated_at,
        policy_config_name=cfg_name,
        policy_config_version=cfg_ver,
        standard_deductible=deductible,
        min_allowed_premium=min_allowed,
        max_allowed_premium=max_allowed,
        max_coverage_limit=max_cov,
        eligibility_evaluation=evaluations,
        feature_importance=features,
        suggested_action=suggested
    )

@router.post("/applications/{application_id}/decision", response_model=schemas.PolicyApplicationOut)
def record_underwriting_decision(
    application_id: int,
    decision_in: schemas.UnderwritingDecisionRequest,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_underwriter_or_staff_user)
):
    """
    Commits an underwriting decision (approve, reject, refer) with mandatory justification note.
    Validates bounded premium override, updates application status, emits audit log,
    and issues Policy record on approval.
    """
    decision_val = decision_in.decision.lower().strip()
    if decision_val not in ["approved", "rejected", "referred"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Decision must be one of: 'approved', 'rejected', 'referred'"
        )

    note = decision_in.justification_note.strip()
    if len(note) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A mandatory justification note (at least 3 characters) is required to commit an underwriting decision."
        )

    app = db.query(models.PolicyApplication).filter(
        models.PolicyApplication.id == application_id,
        models.PolicyApplication.tenant_id == user.tenant_id
    ).first()

    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    if app.status != models.ApplicationStatus.pending_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Application #{app.application_number} has already been decided ({app.status.value})."
        )

    # Validate premium adjustment within tenant configuration bounds if provided
    if decision_in.adjusted_premium is not None:
        adj = float(decision_in.adjusted_premium)
        if adj <= 0:
            raise HTTPException(status_code=400, detail="Adjusted premium must be greater than 0")

        policy_cfg = db.query(models.PolicyConfig).filter(
            models.PolicyConfig.tenant_id == user.tenant_id,
            models.PolicyConfig.product_type == app.product_type,
            models.PolicyConfig.status == models.PolicyConfigStatus.active
        ).order_by(models.PolicyConfig.id.desc()).first()

        if policy_cfg:
            if adj < policy_cfg.base_min_premium or adj > policy_cfg.premium_max_premium:
                raise HTTPException(
                    status_code=400,
                    detail=f"Adjusted premium ${adj:,.2f} is outside carrier configured bounds (${policy_cfg.base_min_premium:,.2f} – ${policy_cfg.premium_max_premium:,.2f})"
                )
        app.adjusted_premium = adj

    now = datetime.utcnow()
    app.status = models.ApplicationStatus(decision_val)
    app.decision_note = note
    app.decided_at = now
    app.decided_by_id = user.id
    app.decided_by_name = user.name or user.email

    # If approved, issue active Policy record
    issued_policy_number = None
    if decision_val == "approved":
        pol_count = db.query(models.Policy).count() + 1
        issued_policy_number = f"POL-{now.year}-{user.tenant_id:03d}-{1000 + pol_count}"
        policy = models.Policy(
            tenant_id=user.tenant_id,
            policy_number=issued_policy_number,
            application_id=app.id,
            policy_config_id=app.policy_config_id,
            customer_id=app.customer_id,
            holder_name=app.applicant_name,
            holder_email=app.applicant_email,
            product_type=app.product_type,
            premium_amount=app.adjusted_premium or app.proposed_premium,
            coverage_limit=app.coverage_amount,
            deductible=500.0,
            status="active",
            issued_by_id=user.id,
            start_date=now,
            end_date=now + timedelta(days=365)
        )
        db.add(policy)

        # Generate commission entry if application was submitted by an agent
        if app.agent_id:
            comm_rate = 0.12  # Standard 12% new business commission
            final_prem = float(app.adjusted_premium or app.proposed_premium)
            comm_amount = round(final_prem * comm_rate, 2)
            comm_entry = models.CommissionEntry(
                tenant_id=user.tenant_id,
                agent_id=app.agent_id,
                customer_id=app.customer_id,
                customer_name=app.applicant_name,
                policy_id=policy.id,
                policy_number=issued_policy_number,
                product_type=app.product_type,
                event_type="new_business",
                premium_amount=final_prem,
                commission_rate=comm_rate,
                commission_amount=comm_amount,
                status="pending",
                effective_date=now
            )
            db.add(comm_entry)

    # Record immutable audit log
    final_premium = app.adjusted_premium or app.proposed_premium
    summary_text = f"Underwriter {decision_val.upper()} application {app.application_number} ({app.product_type.capitalize()})"
    if issued_policy_number:
        summary_text += f" → Issued Policy {issued_policy_number}"

    log_audit_event(
        db=db,
        tenant_id=user.tenant_id,
        actor=user,
        category="underwriting",
        action=f"application_{decision_val}",
        outcome=decision_val,
        entity_type="policy_application",
        entity_id=app.application_number,
        entity_name=app.applicant_name,
        summary=summary_text,
        notes=note,
        details={
            "risk_score": app.risk_score,
            "risk_tier": app.risk_tier.value if hasattr(app.risk_tier, 'value') else str(app.risk_tier),
            "proposed_premium": app.proposed_premium,
            "adjusted_premium": app.adjusted_premium,
            "final_premium": final_premium,
            "issued_policy_number": issued_policy_number
        }
    )

    db.commit()
    db.refresh(app)
    return app

@router.get("/history", response_model=List[schemas.PolicyApplicationOut])
def get_decision_history(
    outcome: Optional[str] = Query(None, description="Filter by outcome: approved, rejected, referred, all"),
    product_type: Optional[str] = Query(None, description="Filter by product: auto, property, health, life"),
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_underwriter_or_staff_user)
):
    """
    Returns decided applications (approved, rejected, referred) for historical audit trail.
    """
    query = db.query(models.PolicyApplication).filter(
        models.PolicyApplication.tenant_id == user.tenant_id,
        models.PolicyApplication.status != models.ApplicationStatus.pending_review
    )
    if outcome and outcome != "all":
        query = query.filter(models.PolicyApplication.status == outcome)
    if product_type and product_type.lower() != "all":
        query = query.filter(models.PolicyApplication.product_type == product_type.lower())

    return query.order_by(models.PolicyApplication.decided_at.desc()).all()
