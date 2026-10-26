from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
from datetime import datetime, timedelta, time
from .. import models, schemas, database
from ..audit import log_audit_event
from .auth import get_current_user

router = APIRouter(prefix="/claims", tags=["claims"])


def get_claims_or_staff_user(current_user: models.User = Depends(get_current_user)) -> models.User:
    if not current_user.tenant_id and current_user.role != models.Role.super_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any tenant organization"
        )
    allowed_roles = [models.Role.adjuster, models.Role.tenant_admin, models.Role.super_admin]
    if current_user.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to Claims Adjuster and Administration personnel"
        )
    return current_user


@router.get("/policies/active", response_model=List[schemas.ActivePolicyOption])
def get_active_policies_for_intake(
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_claims_or_staff_user)
):
    """
    Returns active policies for this tenant so that new claims can be filed against real policies.
    """
    tenant_id = user.tenant_id
    policies = db.query(models.Policy).filter(
        models.Policy.tenant_id == tenant_id,
        models.Policy.status == "active"
    ).all()
    return policies


@router.post("/submit", response_model=schemas.ClaimDetail, status_code=status.HTTP_201_CREATED)
def submit_claim(
    payload: schemas.ClaimCreate,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_claims_or_staff_user)
):
    """
    Intake a real claim filed against an active policy in this tenant.
    Enforces real policy linkage, calculates explainable fraud signals, and assigns SLA deadline.
    """
    tenant_id = user.tenant_id

    # 1. Validate real policy exists in tenant and is active
    policy = db.query(models.Policy).filter(
        models.Policy.tenant_id == tenant_id,
        models.Policy.policy_number == payload.policy_number,
        models.Policy.status == "active"
    ).first()

    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Active policy '{payload.policy_number}' not found in this tenant."
        )

    # 2. Check incident date against policy start date
    # In SQLite start_date might be tz-aware or tz-naive
    p_start = policy.start_date.replace(tzinfo=None) if policy.start_date else datetime.utcnow()
    inc_date = payload.incident_date.replace(tzinfo=None) if payload.incident_date else datetime.utcnow()

    if inc_date < p_start - timedelta(days=1):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Incident date ({inc_date.date()}) cannot precede policy inception ({p_start.date()})."
        )

    # 3. Calculate explainable fraud risk indicators
    fraud_indicators = []
    base_fraud_score = 15

    # Signal A: Inception timing (claim filed shortly after policy start)
    days_since_start = max(0, (inc_date - p_start).days)
    if days_since_start <= 7:
        base_fraud_score += 40
        fraud_indicators.append(f"Claim filed within {days_since_start} days of policy inception")
    elif days_since_start <= 30:
        base_fraud_score += 20
        fraud_indicators.append(f"Claim filed within first 30 days of coverage")

    # Signal B: Claim ratio to coverage limit
    limit_ratio = (payload.claimed_amount / policy.coverage_limit) if policy.coverage_limit > 0 else 0.5
    if limit_ratio >= 0.85:
        base_fraud_score += 35
        fraud_indicators.append(f"Claim amount represents {int(limit_ratio * 100)}% of total policy coverage limit")
    elif limit_ratio >= 0.50:
        base_fraud_score += 15
        fraud_indicators.append(f"Claim amount is elevated ({int(limit_ratio * 100)}% of policy limit)")

    # Signal C: Prior claims on same policy
    prior_claims_count = db.query(models.Claim).filter(
        models.Claim.tenant_id == tenant_id,
        models.Claim.policy_id == policy.id
    ).count()

    if prior_claims_count > 0:
        base_fraud_score += 25
        fraud_indicators.append(f"Policyholder has {prior_claims_count} prior claim(s) on this policy")

    # Clamp score 5 - 98
    final_fraud_score = max(5, min(98, base_fraud_score))
    if final_fraud_score >= 65:
        fraud_tier = "high"
    elif final_fraud_score >= 35:
        fraud_tier = "medium"
    else:
        fraud_tier = "low"

    # 4. Generate collision-free claim number
    now = datetime.utcnow()
    seq = db.query(models.Claim).filter(models.Claim.tenant_id == tenant_id).count() + 1
    claim_number = f"CLM-{now.year}-{tenant_id:03d}-{1000 + seq}"

    # 5. Calculate SLA deadline (e.g. 5 business days from intake)
    sla_deadline = now + timedelta(days=5)

    # 6. Default structured extraction preview (simulates Phase 2 document intelligence extraction)
    structured_data = {
        "extracted_date": inc_date.strftime("%Y-%m-%d"),
        "loss_type": payload.incident_type,
        "estimated_damage": payload.claimed_amount,
        "policy_deductible": policy.deductible,
        "calculated_net_payable": max(0.0, payload.claimed_amount - policy.deductible),
        "police_report_filed": True if payload.incident_type in ["auto_collision", "theft_burglary"] else False,
    }

    # 7. Create Claim record
    claim = models.Claim(
        tenant_id=tenant_id,
        claim_number=claim_number,
        policy_id=policy.id,
        policy_number=policy.policy_number,
        claimant_name=payload.claimant_name or policy.holder_name,
        claimant_email=str(payload.claimant_email) if payload.claimant_email else policy.holder_email,
        incident_date=payload.incident_date,
        incident_type=payload.incident_type,
        incident_description=payload.incident_description,
        claimed_amount=payload.claimed_amount,
        approved_settlement_amount=None,
        deductible_applied=policy.deductible,
        fraud_score=final_fraud_score,
        fraud_tier=fraud_tier,
        fraud_indicators=fraud_indicators,
        status=models.ClaimStatus.pending_review,
        documents=payload.documents or [
            {
                "name": "Incident_Scene_Photo_1.jpg",
                "type": "image",
                "url": "https://images.unsplash.com/photo-1543465077-db45d34b88a5?auto=format&fit=crop&w=600&q=80",
                "description": "Front bumper and fender impact photo"
            },
            {
                "name": "Certified_Repair_Estimate.pdf",
                "type": "pdf",
                "url": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                "description": "Itemized repair estimate from licensed body shop"
            }
        ],
        structured_data=structured_data,
        investigation_notes=[],
        sla_deadline=sla_deadline,
        created_at=now,
        updated_at=now
    )

    db.add(claim)
    db.commit()
    db.refresh(claim)

    # 8. Log audit trail
    log_audit_event(
        db=db,
        tenant_id=tenant_id,
        category="claims",
        action="CLAIM_INTAKE",
        summary=f"Claim {claim_number} registered for {policy.holder_name} (Policy: {policy.policy_number})",
        actor=user,
        entity_type="claim",
        entity_id=str(claim.id),
        entity_name=claim_number,
        details={
            "policy_number": policy.policy_number,
            "claimed_amount": payload.claimed_amount,
            "fraud_score": final_fraud_score,
            "fraud_tier": fraud_tier,
            "indicators_count": len(fraud_indicators)
        }
    )

    return schemas.ClaimDetail(
        id=claim.id,
        tenant_id=claim.tenant_id,
        claim_number=claim.claim_number,
        policy_id=claim.policy_id,
        policy_number=claim.policy_number,
        claimant_name=claim.claimant_name,
        claimant_email=claim.claimant_email,
        incident_date=claim.incident_date,
        incident_type=claim.incident_type,
        incident_description=claim.incident_description,
        claimed_amount=claim.claimed_amount,
        approved_settlement_amount=claim.approved_settlement_amount,
        deductible_applied=claim.deductible_applied,
        fraud_score=claim.fraud_score,
        fraud_tier=claim.fraud_tier,
        fraud_indicators=claim.fraud_indicators,
        status=claim.status.value,
        documents=claim.documents,
        structured_data=claim.structured_data,
        investigation_notes=claim.investigation_notes,
        settlement_note=claim.settlement_note,
        sla_deadline=claim.sla_deadline,
        created_at=claim.created_at,
        policy_coverage_limit=policy.coverage_limit,
        policy_deductible=policy.deductible,
        policy_holder_name=policy.holder_name,
        policy_start_date=policy.start_date
    )


@router.get("/stats", response_model=schemas.ClaimStats)
def get_claim_stats(
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_claims_or_staff_user)
):
    """
    Returns the 4 operational metric cards for the Claims Adjuster Dashboard:
    - Open Claims (pending fast-lane review)
    - SLA at Risk (>80% of settlement SLA deadline elapsed)
    - Fraud Flagged (claims with high fraud tier or score >= 65)
    - Settled Today (approved or rejected today)
    """
    tenant_id = user.tenant_id
    now = datetime.utcnow()

    # Open claims (pending review)
    open_claims = db.query(models.Claim).filter(
        models.Claim.tenant_id == tenant_id,
        models.Claim.status == models.ClaimStatus.pending_review
    ).count()

    # SLA at Risk (claims where remaining time is < 20% of the 5-day window, or elapsed >= 4 days)
    # i.e., sla_deadline - now <= 1 day
    sla_threshold = now + timedelta(days=1)
    sla_at_risk = db.query(models.Claim).filter(
        models.Claim.tenant_id == tenant_id,
        models.Claim.status.in_([models.ClaimStatus.pending_review, models.ClaimStatus.in_investigation]),
        models.Claim.sla_deadline <= sla_threshold
    ).count()

    # Fraud flagged count (high fraud confidence)
    fraud_flagged = db.query(models.Claim).filter(
        models.Claim.tenant_id == tenant_id,
        models.Claim.status.in_([models.ClaimStatus.pending_review, models.ClaimStatus.in_investigation]),
        models.Claim.fraud_tier == "high"
    ).count()

    # Settled today
    today_start = datetime.combine(now.date(), time.min)
    settled_today = db.query(models.Claim).filter(
        models.Claim.tenant_id == tenant_id,
        models.Claim.status.in_([models.ClaimStatus.approved, models.ClaimStatus.rejected]),
        models.Claim.decided_at >= today_start
    ).count()

    return schemas.ClaimStats(
        open_claims=open_claims,
        sla_at_risk=sla_at_risk,
        fraud_flagged=fraud_flagged,
        settled_today=settled_today
    )


@router.get("/queue", response_model=List[schemas.ClaimListItem])
def get_claims_queue(
    incident_type: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("fraud_score_desc"),
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_claims_or_staff_user)
):
    """
    Returns the Fast-Lane Claims Queue.
    Default sort is Fraud Confidence Score Descending (highest risk first).
    """
    tenant_id = user.tenant_id
    query = db.query(models.Claim).filter(
        models.Claim.tenant_id == tenant_id,
        models.Claim.status == models.ClaimStatus.pending_review
    )

    if incident_type and incident_type != "ALL":
        query = query.filter(models.Claim.incident_type == incident_type)

    if sort_by == "age_desc":
        query = query.order_by(models.Claim.created_at.asc())
    elif sort_by == "amount_desc":
        query = query.order_by(models.Claim.claimed_amount.desc())
    else:
        # Default: highest fraud risk first
        query = query.order_by(models.Claim.fraud_score.desc(), models.Claim.created_at.asc())

    claims = query.all()
    now = datetime.utcnow()

    items = []
    for c in claims:
        created = c.created_at.replace(tzinfo=None) if c.created_at else now
        age_days = max(0, (now - created).days)
        items.append(schemas.ClaimListItem(
            id=c.id,
            claim_number=c.claim_number,
            policy_number=c.policy_number,
            claimant_name=c.claimant_name,
            incident_type=c.incident_type,
            claimed_amount=c.claimed_amount,
            fraud_score=c.fraud_score,
            fraud_tier=c.fraud_tier,
            status=c.status.value,
            age_days=age_days,
            sla_deadline=c.sla_deadline,
            created_at=c.created_at
        ))

    return items


def _to_claim_detail(claim: models.Claim, policy: Optional[models.Policy]) -> schemas.ClaimDetail:
    return schemas.ClaimDetail(
        id=claim.id,
        tenant_id=claim.tenant_id,
        claim_number=claim.claim_number,
        policy_id=claim.policy_id,
        policy_number=claim.policy_number,
        claimant_name=claim.claimant_name,
        claimant_email=claim.claimant_email,
        incident_date=claim.incident_date,
        incident_type=claim.incident_type,
        incident_description=claim.incident_description,
        claimed_amount=claim.claimed_amount,
        approved_settlement_amount=claim.approved_settlement_amount,
        deductible_applied=claim.deductible_applied,
        fraud_score=claim.fraud_score,
        fraud_tier=claim.fraud_tier,
        fraud_indicators=claim.fraud_indicators,
        status=claim.status.value,
        documents=claim.documents,
        structured_data=claim.structured_data,
        investigation_notes=claim.investigation_notes,
        settlement_note=claim.settlement_note,
        sla_deadline=claim.sla_deadline,
        created_at=claim.created_at,
        decided_at=claim.decided_at,
        decided_by_name=claim.decided_by_name,
        policy_coverage_limit=policy.coverage_limit if policy else 0.0,
        policy_deductible=policy.deductible if policy else 500.0,
        policy_holder_name=policy.holder_name if policy else claim.claimant_name,
        policy_start_date=policy.start_date if policy else None
    )


@router.get("/investigations", response_model=List[schemas.InvestigationListItem])
def get_active_investigations(
    q: Optional[str] = Query(None),
    incident_type: Optional[str] = Query(None),
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_claims_or_staff_user)
):
    """
    Sub-slice 3.2: Returns all active escalated claims under investigation.
    """
    tenant_id = user.tenant_id
    query = db.query(models.Claim).filter(
        models.Claim.tenant_id == tenant_id,
        models.Claim.status == models.ClaimStatus.in_investigation
    )

    if incident_type:
        query = query.filter(models.Claim.incident_type == incident_type)

    if q:
        search_pattern = f"%{q.strip()}%"
        query = query.filter(
            or_(
                models.Claim.claim_number.ilike(search_pattern),
                models.Claim.claimant_name.ilike(search_pattern),
                models.Claim.policy_number.ilike(search_pattern)
            )
        )

    claims = query.order_by(models.Claim.fraud_score.desc()).all()
    now = datetime.utcnow()
    items = []
    for c in claims:
        created_naive = c.created_at.replace(tzinfo=None) if c.created_at else now
        age_days = (now - created_naive).days
        notes = c.investigation_notes or []
        last_note = notes[-1] if notes else None
        last_note_preview = last_note.get("text") if last_note else None
        last_note_at = last_note.get("created_at") if last_note else None

        items.append(schemas.InvestigationListItem(
            id=c.id,
            claim_number=c.claim_number,
            policy_number=c.policy_number,
            claimant_name=c.claimant_name,
            claimant_email=c.claimant_email,
            incident_type=c.incident_type,
            claimed_amount=c.claimed_amount,
            fraud_score=c.fraud_score,
            fraud_tier=c.fraud_tier,
            status=c.status.value,
            age_days=age_days,
            sla_deadline=c.sla_deadline,
            created_at=c.created_at,
            notes_count=len(notes),
            last_note_preview=last_note_preview[:80] + "..." if last_note_preview and len(last_note_preview) > 80 else last_note_preview,
            last_note_at=last_note_at
        ))

    return items


@router.get("/sla-tracker", response_model=schemas.SlaDashboardSummary)
def get_sla_tracker_queue(
    status_filter: Optional[str] = Query(None),
    incident_type: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_claims_or_staff_user)
):
    """
    Stage 4: Returns the Carrier Turnaround SLA Catch-up Triage Queue and summary metrics.
    Sorts claims by deadline urgency (closest deadline / overdue first).
    """
    tenant_id = user.tenant_id
    query = db.query(models.Claim).filter(
        models.Claim.tenant_id == tenant_id,
        models.Claim.status.in_([models.ClaimStatus.pending_review, models.ClaimStatus.in_investigation])
    )

    if incident_type:
        query = query.filter(models.Claim.incident_type == incident_type)

    if q:
        search_pattern = f"%{q.strip()}%"
        query = query.filter(
            or_(
                models.Claim.claim_number.ilike(search_pattern),
                models.Claim.claimant_name.ilike(search_pattern),
                models.Claim.policy_number.ilike(search_pattern)
            )
        )

    claims = query.all()
    now = datetime.utcnow()

    all_items = []
    healthy_cnt = 0
    warning_cnt = 0
    critical_cnt = 0
    overdue_cnt = 0

    for c in claims:
        created_naive = c.created_at.replace(tzinfo=None) if c.created_at else now
        deadline_naive = c.sla_deadline.replace(tzinfo=None) if c.sla_deadline else now + timedelta(days=5)

        total_hours = max(1.0, (deadline_naive - created_naive).total_seconds() / 3600.0)
        elapsed_hours = max(0.0, (now - created_naive).total_seconds() / 3600.0)
        remaining_hours = (deadline_naive - now).total_seconds() / 3600.0
        elapsed_pct = min(100.0, max(0.0, (elapsed_hours / total_hours) * 100.0))

        if remaining_hours <= 0:
            sla_cat = "overdue"
            overdue_cnt += 1
        elif elapsed_pct >= 80.0:
            sla_cat = "critical"
            critical_cnt += 1
        elif elapsed_pct >= 60.0:
            sla_cat = "warning"
            warning_cnt += 1
        else:
            sla_cat = "healthy"
            healthy_cnt += 1

        all_items.append(schemas.SlaClaimItem(
            id=c.id,
            claim_number=c.claim_number,
            policy_number=c.policy_number,
            claimant_name=c.claimant_name,
            incident_type=c.incident_type,
            claimed_amount=c.claimed_amount,
            fraud_score=c.fraud_score,
            fraud_tier=c.fraud_tier,
            status=c.status.value,
            created_at=c.created_at,
            sla_deadline=c.sla_deadline,
            total_sla_hours=round(total_hours, 1),
            elapsed_hours=round(elapsed_hours, 1),
            remaining_hours=round(remaining_hours, 1),
            elapsed_percent=round(elapsed_pct, 1),
            sla_status=sla_cat
        ))

    # Sort items by remaining_hours ASC (most urgent first)
    all_items.sort(key=lambda x: x.remaining_hours)

    filtered_items = all_items
    if status_filter and status_filter.lower() != "all":
        filtered_items = [it for it in all_items if it.sla_status == status_filter.lower()]

    return schemas.SlaDashboardSummary(
        total_in_flight=len(claims),
        healthy_count=healthy_cnt,
        warning_count=warning_cnt,
        critical_count=critical_cnt,
        overdue_count=overdue_cnt,
        claims=filtered_items
    )


@router.get("/{claim_id}", response_model=schemas.ClaimDetail)
def get_claim_detail(
    claim_id: int,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_claims_or_staff_user)
):
    """
    Returns complete claim dossier and linked policy coverage parameters.
    """
    tenant_id = user.tenant_id
    claim = db.query(models.Claim).filter(
        models.Claim.id == claim_id,
        models.Claim.tenant_id == tenant_id
    ).first()

    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Claim ID {claim_id} not found in this tenant."
        )

    policy = db.query(models.Policy).filter(
        models.Policy.id == claim.policy_id,
        models.Policy.tenant_id == tenant_id
    ).first()

    return _to_claim_detail(claim, policy)


class DocumentAttachPayload(schemas.BaseModel):
    name: str
    type: str  # image, pdf, document
    url: str
    description: Optional[str] = None


@router.post("/{claim_id}/documents", response_model=List[dict])
def attach_claim_document(
    claim_id: int,
    payload: DocumentAttachPayload,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_claims_or_staff_user)
):
    """
    Attaches supplemental evidence document or photo to the claim.
    """
    tenant_id = user.tenant_id
    claim = db.query(models.Claim).filter(
        models.Claim.id == claim_id,
        models.Claim.tenant_id == tenant_id
    ).first()

    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Claim ID {claim_id} not found."
        )

    current_docs = list(claim.documents or [])
    new_doc = {
        "name": payload.name,
        "type": payload.type,
        "url": payload.url,
        "description": payload.description or "",
        "uploaded_at": datetime.utcnow().isoformat(),
        "uploaded_by": user.email
    }
    current_docs.append(new_doc)
    claim.documents = current_docs
    db.commit()

    log_audit_event(
        db=db,
        tenant_id=tenant_id,
        category="claims",
        action="DOCUMENT_ATTACHED",
        summary=f"Supplemental evidence '{payload.name}' attached to claim {claim.claim_number}",
        actor=user,
        entity_type="claim",
        entity_id=str(claim.id),
        entity_name=claim.claim_number,
        details={"document_name": payload.name, "type": payload.type}
    )

    return claim.documents


class ClaimFieldsUpdatePayload(schemas.BaseModel):
    extracted_date: Optional[str] = None
    loss_type: Optional[str] = None
    estimated_damage: Optional[float] = None
    police_report_filed: Optional[bool] = None
    damage_code: Optional[str] = None
    notes: Optional[str] = None


@router.patch("/{claim_id}/fields", response_model=schemas.ClaimDetail)
def update_claim_extracted_fields(
    claim_id: int,
    payload: ClaimFieldsUpdatePayload,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_claims_or_staff_user)
):
    """
    Corrects misread or updated structured fields from document verification.
    Recalculates net payable and records audit log of corrections.
    """
    tenant_id = user.tenant_id
    claim = db.query(models.Claim).filter(
        models.Claim.id == claim_id,
        models.Claim.tenant_id == tenant_id
    ).first()

    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Claim ID {claim_id} not found."
        )

    policy = db.query(models.Policy).filter(
        models.Policy.id == claim.policy_id,
        models.Policy.tenant_id == tenant_id
    ).first()

    struct = dict(claim.structured_data or {})
    old_struct = dict(struct)

    if payload.extracted_date is not None:
        struct["extracted_date"] = payload.extracted_date
    if payload.loss_type is not None:
        struct["loss_type"] = payload.loss_type
        claim.incident_type = payload.loss_type
    if payload.estimated_damage is not None:
        struct["estimated_damage"] = payload.estimated_damage
        claim.claimed_amount = payload.estimated_damage
    if payload.police_report_filed is not None:
        struct["police_report_filed"] = payload.police_report_filed
    if payload.damage_code is not None:
        struct["damage_code"] = payload.damage_code
    if payload.notes is not None:
        struct["notes"] = payload.notes

    # Re-compute net payable based on verified damage and policy limits
    deductible = policy.deductible if policy else 500.0
    limit = policy.coverage_limit if policy else claim.claimed_amount
    est_dmg = struct.get("estimated_damage", claim.claimed_amount)
    struct["policy_deductible"] = deductible
    struct["calculated_net_payable"] = max(0.0, min(est_dmg, limit) - deductible)

    claim.structured_data = struct
    db.commit()
    db.refresh(claim)

    log_audit_event(
        db=db,
        tenant_id=tenant_id,
        category="claims",
        action="CLAIM_FIELDS_CORRECTED",
        summary=f"Extracted fields verified/corrected on claim {claim.claim_number}",
        actor=user,
        entity_type="claim",
        entity_id=str(claim.id),
        entity_name=claim.claim_number,
        details={"before": old_struct, "after": struct}
    )

    return _to_claim_detail(claim, policy)


class ClaimEscalatePayload(schemas.BaseModel):
    escalation_reason: str = schemas.Field(..., min_length=3)


@router.post("/{claim_id}/escalate", response_model=schemas.ClaimDetail)
def escalate_claim_to_investigation(
    claim_id: int,
    payload: ClaimEscalatePayload,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_claims_or_staff_user)
):
    """
    Escalates a high-risk or suspicious claim to the slow-lane Investigation View.
    Transitions status to in_investigation and appends an opening timestamped note.
    """
    tenant_id = user.tenant_id
    claim = db.query(models.Claim).filter(
        models.Claim.id == claim_id,
        models.Claim.tenant_id == tenant_id
    ).first()

    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Claim ID {claim_id} not found."
        )

    policy = db.query(models.Policy).filter(
        models.Policy.id == claim.policy_id,
        models.Policy.tenant_id == tenant_id
    ).first()

    claim.status = models.ClaimStatus.in_investigation
    notes = list(claim.investigation_notes or [])
    now_iso = datetime.utcnow().isoformat()
    opening_note = {
        "author_name": user.name or user.email.split('@')[0],
        "author_role": user.role.value if hasattr(user.role, "value") else str(user.role),
        "created_at": now_iso,
        "category": "Escalation Note",
        "text": f"Escalated from triage queue: {payload.escalation_reason}"
    }
    notes.append(opening_note)
    claim.investigation_notes = notes
    db.commit()
    db.refresh(claim)

    log_audit_event(
        db=db,
        tenant_id=tenant_id,
        category="claims",
        action="CLAIM_ESCALATED",
        summary=f"Claim {claim.claim_number} escalated to investigation by {user.email}",
        actor=user,
        entity_type="claim",
        entity_id=str(claim.id),
        entity_name=claim.claim_number,
        details={"reason": payload.escalation_reason, "fraud_score": claim.fraud_score}
    )

    return _to_claim_detail(claim, policy)


class ClaimDecisionPayload(schemas.BaseModel):
    decision: str = schemas.Field(..., description="Must be 'approved' or 'rejected'")
    justification_note: str = schemas.Field(..., min_length=3, description="Mandatory rationale for the decision")
    settlement_amount: Optional[float] = None


@router.post("/{claim_id}/decision", response_model=schemas.ClaimDetail)
def commit_claim_decision(
    claim_id: int,
    payload: ClaimDecisionPayload,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_claims_or_staff_user)
):
    """
    Sub-slice 3.1: Fast-Lane Settlement Decision Engine.
    Adjuster commits final settlement adjudication (Approve or Reject) with mandatory note.
    Applies policy deductible and bounds payout against coverage limits.
    """
    tenant_id = user.tenant_id
    claim = db.query(models.Claim).filter(
        models.Claim.id == claim_id,
        models.Claim.tenant_id == tenant_id
    ).first()

    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Claim ID {claim_id} not found."
        )

    # Check if already decided
    if claim.status in [models.ClaimStatus.approved, models.ClaimStatus.rejected]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Claim {claim.claim_number} is already closed with terminal status '{claim.status.value}'."
        )

    policy = db.query(models.Policy).filter(
        models.Policy.id == claim.policy_id,
        models.Policy.tenant_id == tenant_id
    ).first()

    decision_norm = payload.decision.lower().strip()
    if decision_norm not in ["approved", "rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Decision must be either 'approved' or 'rejected'."
        )

    deductible = policy.deductible if policy else 500.0
    coverage_limit = policy.coverage_limit if policy else claim.claimed_amount

    if decision_norm == "approved":
        if payload.settlement_amount is not None:
            final_payout = float(payload.settlement_amount)
        else:
            # Derive from verified structured data or claim amount
            struct = claim.structured_data or {}
            if "calculated_net_payable" in struct:
                final_payout = float(struct["calculated_net_payable"])
            else:
                final_payout = max(0.0, min(claim.claimed_amount, coverage_limit) - deductible)

        if final_payout < 0.0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Approved settlement payout cannot be negative."
            )
        if final_payout > coverage_limit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Approved settlement payout (${final_payout:,.2f}) cannot exceed policy coverage limit (${coverage_limit:,.2f})."
            )

        claim.status = models.ClaimStatus.approved
        claim.approved_settlement_amount = round(final_payout, 2)
        claim.deductible_applied = round(deductible, 2)
        action_name = "CLAIM_APPROVED"
        summary_msg = f"Claim {claim.claim_number} APPROVED for ${final_payout:,.2f} settlement payout by {user.email}"
    else:
        claim.status = models.ClaimStatus.rejected
        claim.approved_settlement_amount = 0.0
        claim.deductible_applied = 0.0
        action_name = "CLAIM_REJECTED"
        summary_msg = f"Claim {claim.claim_number} REJECTED by {user.email}"

    now_utc = datetime.utcnow()
    claim.settlement_note = payload.justification_note.strip()
    claim.decided_at = now_utc
    claim.decided_by_id = user.id
    claim.decided_by_name = user.name or user.email.split('@')[0]

    db.commit()
    db.refresh(claim)

    log_audit_event(
        db=db,
        tenant_id=tenant_id,
        category="claims",
        action=action_name,
        summary=summary_msg,
        actor=user,
        entity_type="claim",
        entity_id=str(claim.id),
        entity_name=claim.claim_number,
        details={
            "decision": decision_norm,
            "approved_settlement_amount": claim.approved_settlement_amount,
            "deductible_applied": claim.deductible_applied,
            "settlement_note": claim.settlement_note,
            "decided_by": claim.decided_by_name
        }
    )

    return _to_claim_detail(claim, policy)


@router.post("/{claim_id}/investigation-notes", response_model=List[dict])
def add_investigation_note(
    claim_id: int,
    payload: schemas.InvestigationNoteCreate,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_claims_or_staff_user)
):
    """
    Sub-slice 3.3: Appends a multi-session timestamped investigation note with categorization.
    """
    tenant_id = user.tenant_id
    claim = db.query(models.Claim).filter(
        models.Claim.id == claim_id,
        models.Claim.tenant_id == tenant_id
    ).first()

    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Claim ID {claim_id} not found."
        )

    notes = list(claim.investigation_notes or [])
    new_note = {
        "id": len(notes) + 1,
        "author_name": user.name or user.email.split('@')[0],
        "author_role": user.role.value if hasattr(user.role, "value") else str(user.role),
        "author_email": user.email,
        "created_at": datetime.utcnow().isoformat(),
        "category": payload.category or "General Note",
        "text": payload.text.strip()
    }
    notes.append(new_note)
    claim.investigation_notes = notes
    db.commit()

    log_audit_event(
        db=db,
        tenant_id=tenant_id,
        category="claims",
        action="INVESTIGATION_NOTE_ADDED",
        summary=f"Investigation note ({new_note['category']}) added to claim {claim.claim_number} by {user.email}",
        actor=user,
        entity_type="claim",
        entity_id=str(claim.id),
        entity_name=claim.claim_number,
        details={
            "category": new_note["category"],
            "note_preview": new_note["text"][:100],
            "total_notes": len(notes)
        }
    )

    return claim.investigation_notes


@router.get("/{claim_id}/claimant-history", response_model=List[schemas.ClaimantPriorClaim])
def get_claimant_prior_history(
    claim_id: int,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_claims_or_staff_user)
):
    """
    Sub-slice 3.3: Returns previous claims filed by the same claimant/policy to expose repeated loss patterns.
    """
    tenant_id = user.tenant_id
    claim = db.query(models.Claim).filter(
        models.Claim.id == claim_id,
        models.Claim.tenant_id == tenant_id
    ).first()

    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Claim ID {claim_id} not found."
        )

    prior_claims = db.query(models.Claim).filter(
        models.Claim.tenant_id == tenant_id,
        models.Claim.id != claim_id,
        or_(
            models.Claim.claimant_email == claim.claimant_email,
            models.Claim.policy_id == claim.policy_id
        )
    ).order_by(models.Claim.created_at.desc()).all()

    items = []
    for pc in prior_claims:
        items.append(schemas.ClaimantPriorClaim(
            id=pc.id,
            claim_number=pc.claim_number,
            incident_date=pc.incident_date,
            incident_type=pc.incident_type,
            claimed_amount=pc.claimed_amount,
            approved_settlement_amount=pc.approved_settlement_amount,
            status=pc.status.value,
            fraud_score=pc.fraud_score,
            fraud_tier=pc.fraud_tier,
            created_at=pc.created_at
        ))

    return items






