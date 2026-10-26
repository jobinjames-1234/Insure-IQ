from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional, List
import math
import uuid
import csv
import io
from datetime import datetime, timedelta, timezone
from .. import models, schemas, database
from ..audit import log_audit_event
from .auth import get_current_user

router = APIRouter(prefix="/agents", tags=["agents"])

def verify_agent(current_user: models.User = Depends(get_current_user)):
    """
    Authorization guard ensuring only active users with role 'agent'
    associated with a valid tenant organization can access agent endpoints.
    """
    if current_user.role != models.Role.agent:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: only licensed insurance agents can access this workspace"
        )
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any tenant organization"
        )
    if getattr(current_user, "status", None) == models.UserStatus.suspended:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account has been suspended by tenant administrator"
        )
    return current_user

@router.get("/me/session")
def get_agent_workspace_session(
    db: Session = Depends(database.get_db),
    agent: models.User = Depends(verify_agent)
):
    """
    Returns verified agent workspace identity, tenant scope, and shell status.
    Called by AgentLayout to enforce backend authorization on shell mount.
    """
    tenant = db.query(models.Tenant).filter(models.Tenant.id == agent.tenant_id).first()
    if not tenant or tenant.status != models.TenantStatus.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant workspace is inactive or disabled"
        )

    return {
        "agent_id": agent.id,
        "name": agent.name or agent.email.split("@")[0],
        "email": agent.email,
        "role": agent.role.value if hasattr(agent.role, "value") else str(agent.role),
        "status": agent.status.value if hasattr(agent.status, "value") else str(agent.status),
        "tenant_id": tenant.id,
        "tenant_name": tenant.name,
        "tenant_subdomain": tenant.subdomain,
        "workspace_state": "active",
        "profile_photo": agent.profile_photo
    }

@router.get("/me/profile")
def get_agent_profile(
    db: Session = Depends(database.get_db),
    agent: models.User = Depends(verify_agent)
):
    """
    Returns full profile details for the authenticated agent, including tenant organization context,
    avatar, and real portfolio metrics.
    """
    tenant = db.query(models.Tenant).filter(models.Tenant.id == agent.tenant_id).first()
    if not tenant or tenant.status != models.TenantStatus.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant workspace is inactive or disabled"
        )

    # Real policy count in agent's tenant scope
    policy_count = db.query(models.Policy).filter(
        models.Policy.tenant_id == agent.tenant_id,
        models.Policy.status == "active"
    ).count()

    return {
        "id": agent.id,
        "name": agent.name,
        "email": agent.email,
        "role": agent.role.value if hasattr(agent.role, "value") else str(agent.role),
        "status": agent.status.value if hasattr(agent.status, "value") else str(agent.status),
        "profile_photo": agent.profile_photo,
        "tenant_id": tenant.id,
        "tenant_name": tenant.name,
        "tenant_subdomain": tenant.subdomain,
        "plan_tier": tenant.plan_tier,
        "assigned_policies_count": policy_count,
        "created_at": agent.created_at.isoformat() if getattr(agent, "created_at", None) else None
    }

@router.get("/me/dashboard-stats")
def get_agent_dashboard_stats(
    db: Session = Depends(database.get_db),
    agent: models.User = Depends(verify_agent)
):
    """
    Returns live KPI metrics and renewal/alert feeds for the authenticated agent.
    If the database has no records for this agent, returns legitimate empty state (zeros/empty lists)
    in strict accordance with Development_Methodology.md.
    """
    now = datetime.now(timezone.utc)
    thirty_days_later = now + timedelta(days=30)

    # 1. Total assigned customers for this agent
    assigned_customers_count = db.query(models.Customer).filter(
        models.Customer.tenant_id == agent.tenant_id,
        models.Customer.agent_id == agent.id
    ).count()

    # 2. Total active policies in agent's tenant scope
    policies = db.query(models.Policy).filter(
        models.Policy.tenant_id == agent.tenant_id,
        models.Policy.status == "active"
    ).all()

    # 3. Upcoming renewals (active policies expiring within the next 30 days)
    upcoming_renewals = []
    for p in policies:
        if p.end_date:
            end_dt = p.end_date
            if end_dt.tzinfo is None:
                end_dt = end_dt.replace(tzinfo=timezone.utc)
            if now <= end_dt <= thirty_days_later:
                days_left = max(0, (end_dt - now).days)
                upcoming_renewals.append({
                    "id": p.id,
                    "policy_number": p.policy_number,
                    "holder_name": p.holder_name,
                    "product_type": p.product_type.replace("_", " ").title(),
                    "premium": float(p.premium_amount),
                    "renewal_date": end_dt.strftime("%b %d, %Y"),
                    "days_left": days_left
                })

    upcoming_renewals.sort(key=lambda r: r["days_left"])

    # 4. Renewal pipeline value (sum of premiums in 30-day renewal window)
    renewal_pipeline_value = sum(r["premium"] for r in upcoming_renewals)

    # 5. Retention alerts
    db_alerts = db.query(models.RetentionAlert).filter(
        models.RetentionAlert.tenant_id == agent.tenant_id,
        models.RetentionAlert.agent_id == agent.id,
        models.RetentionAlert.status == "open"
    ).order_by(models.RetentionAlert.days_remaining.asc()).all()

    retention_alerts = [
        {
            "id": a.id,
            "customer_name": a.customer_name,
            "risk_factor": f"{a.alert_type.replace('_', ' ').capitalize()} ({a.days_remaining}d left)" if a.alert_type else f"{a.days_remaining}d left"
        }
        for a in db_alerts[:10]
    ]

    # 6. Commission MTD
    comm_entries = db.query(models.CommissionEntry).filter(
        models.CommissionEntry.tenant_id == agent.tenant_id,
        models.CommissionEntry.agent_id == agent.id
    ).all()
    commission_mtd = sum(
        c.commission_amount for c in comm_entries
        if c.created_at and c.created_at.year == now.year and c.created_at.month == now.month
    )

    return {
        "assigned_customers_count": assigned_customers_count,
        "renewal_pipeline_value": float(renewal_pipeline_value),
        "commission_mtd": float(round(commission_mtd, 2)),
        "open_retention_alerts_count": len(db_alerts),
        "upcoming_renewals": upcoming_renewals,
        "retention_alerts": retention_alerts
    }

@router.get("/me/customers", response_model=schemas.CustomerListResponse)
def list_agent_customers(
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    search: Optional[str] = None,
    risk_flag: Optional[str] = None,
    product_type: Optional[str] = None,
    db: Session = Depends(database.get_db),
    agent: models.User = Depends(verify_agent)
):
    """
    Returns paginated list of customers assigned to the authenticated agent within their tenant.
    Enforces strict tenant isolation and agent ownership: an agent can only see their own assigned customers.
    """
    query = db.query(models.Customer).filter(
        models.Customer.tenant_id == agent.tenant_id,
        models.Customer.agent_id == agent.id
    )

    if search and search.strip():
        search_term = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(models.Customer.first_name).like(search_term),
                func.lower(models.Customer.last_name).like(search_term),
                func.lower(models.Customer.email).like(search_term),
                models.Customer.phone.like(search_term)
            )
        )

    if risk_flag and risk_flag.lower() != "all":
        if risk_flag.lower() in ("high", "churn", "at_risk"):
            query = query.filter(models.Customer.churn_risk_flag == True)
        elif risk_flag.lower() in ("low", "normal"):
            query = query.filter(models.Customer.churn_risk_flag == False)

    all_matching_customers = query.order_by(models.Customer.created_at.desc()).all()

    # Pre-fetch active policies in agent's tenant scope
    tenant_policies = db.query(models.Policy).filter(
        models.Policy.tenant_id == agent.tenant_id,
        models.Policy.status == "active"
    ).all()

    customer_items = []
    for c in all_matching_customers:
        c_policies = [
            p for p in tenant_policies
            if (getattr(p, "customer_id", None) == c.id) or (p.holder_email and p.holder_email.lower() == c.email.lower())
        ]

        if product_type and product_type.lower() != "all":
            if not any(p.product_type.lower() == product_type.lower() for p in c_policies):
                continue

        policy_count = len(c_policies)
        total_premium = sum(float(p.premium_amount) for p in c_policies)

        next_renewal = None
        for p in c_policies:
            if p.end_date:
                if next_renewal is None or p.end_date < next_renewal:
                    next_renewal = p.end_date

        risk_label = "high" if c.churn_risk_flag else "low"

        customer_items.append(
            schemas.CustomerResponse(
                id=c.id,
                tenant_id=c.tenant_id,
                agent_id=c.agent_id,
                first_name=c.first_name,
                last_name=c.last_name,
                full_name=f"{c.first_name} {c.last_name}".strip(),
                email=c.email,
                phone=c.phone,
                date_of_birth=c.date_of_birth,
                dob=c.date_of_birth,
                address=c.address,
                status=c.status,
                churn_risk_flag=bool(c.churn_risk_flag),
                risk_flag=risk_label,
                policy_count=policy_count,
                total_premium=total_premium,
                next_renewal_date=next_renewal.strftime("%b %d, %Y") if next_renewal else None,
                created_at=c.created_at
            )
        )

    total = len(customer_items)
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated_items = customer_items[start_idx:end_idx]

    return {
        "items": paginated_items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }

@router.post("/me/customers", response_model=schemas.CustomerResponse, status_code=status.HTTP_201_CREATED)
def register_customer(
    customer_in: schemas.CustomerCreate,
    db: Session = Depends(database.get_db),
    agent: models.User = Depends(verify_agent)
):
    """
    Registers a new customer lead or policyholder in the agent's tenant portfolio.
    Links the new customer record directly to the authenticated agent and tenant.
    Enforces email uniqueness per tenant and logs an immutable audit event.
    """
    first_name = customer_in.first_name.strip()
    last_name = customer_in.last_name.strip()
    email = customer_in.email.strip().lower()

    if len(first_name) < 2 or len(last_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="First name and last name must each be at least 2 characters long."
        )

    # Email uniqueness within tenant
    existing = db.query(models.Customer).filter(
        models.Customer.tenant_id == agent.tenant_id,
        func.lower(models.Customer.email) == email
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A customer record with email '{email}' already exists in this tenant organization."
        )

    is_churn_risk = bool(customer_in.churn_risk_flag)
    if hasattr(customer_in, 'risk_flag') and customer_in.risk_flag:
        if customer_in.risk_flag.lower() in ("high", "churn", "at_risk"):
            is_churn_risk = True

    dob_val = customer_in.date_of_birth or customer_in.dob

    new_customer = models.Customer(
        tenant_id=agent.tenant_id,
        agent_id=agent.id,
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone=customer_in.phone.strip() if customer_in.phone else None,
        date_of_birth=dob_val.strip() if dob_val else None,
        address=customer_in.address.strip() if customer_in.address else None,
        status="active",
        churn_risk_flag=is_churn_risk
    )
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)

    # Immutable audit event
    log_audit_event(
        db=db,
        tenant_id=agent.tenant_id,
        actor=agent,
        category="customer",
        action="created",
        outcome="success",
        entity_type="customer",
        entity_id=str(new_customer.id),
        entity_name=f"{first_name} {last_name}",
        summary=f"Agent {agent.email} registered customer lead {first_name} {last_name} ({email})",
        notes=f"Assigned to Agent #{agent.id} in tenant #{agent.tenant_id}.",
        details={
            "customer_id": new_customer.id,
            "email": new_customer.email,
            "name": f"{first_name} {last_name}",
            "agent_id": agent.id,
            "churn_risk_flag": is_churn_risk
        }
    )

    return schemas.CustomerResponse(
        id=new_customer.id,
        tenant_id=new_customer.tenant_id,
        agent_id=new_customer.agent_id,
        first_name=new_customer.first_name,
        last_name=new_customer.last_name,
        full_name=f"{new_customer.first_name} {new_customer.last_name}".strip(),
        email=new_customer.email,
        phone=new_customer.phone,
        date_of_birth=new_customer.date_of_birth,
        dob=new_customer.date_of_birth,
        address=new_customer.address,
        status=new_customer.status,
        churn_risk_flag=bool(new_customer.churn_risk_flag),
        risk_flag="high" if new_customer.churn_risk_flag else "low",
        policy_count=0,
        total_premium=0.0,
        next_renewal_date=None,
        created_at=new_customer.created_at
    )

@router.get("/me/customers/{customer_id}", response_model=schemas.CustomerResponse)
def get_customer_dossier(
    customer_id: int,
    db: Session = Depends(database.get_db),
    agent: models.User = Depends(verify_agent)
):
    """
    Returns the customer summary and profile details for a specific customer.
    Enforces strict agent ownership: only the assigned agent within the same tenant can view this customer.
    Returns 404 if the customer does not exist or belongs to another agent.
    """
    customer = db.query(models.Customer).filter(
        models.Customer.id == customer_id,
        models.Customer.tenant_id == agent.tenant_id,
        models.Customer.agent_id == agent.id
    ).first()

    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer #{customer_id} not found in your assigned portfolio."
        )

    # Active policies for this customer
    c_policies = db.query(models.Policy).filter(
        models.Policy.tenant_id == agent.tenant_id,
        models.Policy.status == "active",
        or_(
            models.Policy.customer_id == customer.id,
            func.lower(models.Policy.holder_email) == customer.email.lower()
        )
    ).all()

    policy_count = len(c_policies)
    total_premium = sum(float(p.premium_amount) for p in c_policies)

    next_renewal = None
    for p in c_policies:
        if p.end_date:
            if next_renewal is None or p.end_date < next_renewal:
                next_renewal = p.end_date

    return schemas.CustomerResponse(
        id=customer.id,
        tenant_id=customer.tenant_id,
        agent_id=customer.agent_id,
        first_name=customer.first_name,
        last_name=customer.last_name,
        full_name=f"{customer.first_name} {customer.last_name}".strip(),
        email=customer.email,
        phone=customer.phone,
        date_of_birth=customer.date_of_birth,
        dob=customer.date_of_birth,
        address=customer.address,
        status=customer.status,
        churn_risk_flag=bool(customer.churn_risk_flag),
        risk_flag="high" if customer.churn_risk_flag else "low",
        policy_count=policy_count,
        total_premium=total_premium,
        next_renewal_date=next_renewal.strftime("%b %d, %Y") if next_renewal else None,
        created_at=customer.created_at
    )

@router.get("/me/customers/{customer_id}/policies", response_model=schemas.CustomerPoliciesResponse)
def get_customer_policies(
    customer_id: int,
    db: Session = Depends(database.get_db),
    agent: models.User = Depends(verify_agent)
):
    """
    Returns all insurance policies registered to the customer in the agent's tenant portfolio.
    Enforces strict agent ownership: only the assigned agent within the tenant can access these policies.
    """
    customer = db.query(models.Customer).filter(
        models.Customer.id == customer_id,
        models.Customer.tenant_id == agent.tenant_id,
        models.Customer.agent_id == agent.id
    ).first()

    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer #{customer_id} not found in your assigned portfolio."
        )

    policies = db.query(models.Policy).filter(
        models.Policy.tenant_id == agent.tenant_id,
        or_(
            models.Policy.customer_id == customer.id,
            func.lower(models.Policy.holder_email) == customer.email.lower()
        )
    ).order_by(models.Policy.created_at.desc()).all()

    now = datetime.now(timezone.utc)
    policy_items = []
    total_active_premium = 0.0
    active_count = 0

    for p in policies:
        days_until = None
        renewal_str = None
        if p.end_date:
            end_dt = p.end_date
            if end_dt.tzinfo is None:
                end_dt = end_dt.replace(tzinfo=timezone.utc)
            days_until = (end_dt - now).days
            renewal_str = end_dt.strftime("%b %d, %Y")

        if p.status == "active":
            total_active_premium += float(p.premium_amount)
            active_count += 1

        policy_items.append(
            schemas.CustomerPolicyItem(
                id=p.id,
                policy_number=p.policy_number,
                product_type=p.product_type,
                premium_amount=float(p.premium_amount),
                coverage_limit=float(p.coverage_limit),
                deductible=float(p.deductible),
                status=p.status,
                start_date=p.start_date,
                end_date=p.end_date,
                renewal_date=renewal_str,
                days_until_renewal=days_until,
                created_at=p.created_at
            )
        )

    return schemas.CustomerPoliciesResponse(
        customer_id=customer.id,
        customer_name=f"{customer.first_name} {customer.last_name}".strip(),
        policies=policy_items,
        total_active_premium=total_active_premium,
        active_count=active_count
    )

@router.get("/me/customers/{customer_id}/claims", response_model=schemas.CustomerClaimsResponse)
def get_customer_claims(
    customer_id: int,
    db: Session = Depends(database.get_db),
    agent: models.User = Depends(verify_agent)
):
    """
    Returns the claims activity and status history for the specified customer.
    Enforces strict agent ownership: only the assigned agent within the tenant can access these claims.
    """
    customer = db.query(models.Customer).filter(
        models.Customer.id == customer_id,
        models.Customer.tenant_id == agent.tenant_id,
        models.Customer.agent_id == agent.id
    ).first()

    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer #{customer_id} not found in your assigned portfolio."
        )

    customer_policies = db.query(models.Policy.id).filter(
        models.Policy.tenant_id == agent.tenant_id,
        or_(
            models.Policy.customer_id == customer.id,
            func.lower(models.Policy.holder_email) == customer.email.lower()
        )
    ).all()
    policy_ids = [p[0] for p in customer_policies]

    claim_filter = [func.lower(models.Claim.claimant_email) == customer.email.lower()]
    if policy_ids:
        claim_filter.append(models.Claim.policy_id.in_(policy_ids))

    claims = db.query(models.Claim).filter(
        models.Claim.tenant_id == agent.tenant_id,
        or_(*claim_filter)
    ).order_by(models.Claim.created_at.desc()).all()

    claim_items = []
    total_claimed = 0.0
    total_approved = 0.0
    open_count = 0

    for c in claims:
        status_val = c.status.value if hasattr(c.status, "value") else str(c.status)
        total_claimed += float(c.claimed_amount or 0.0)
        if c.approved_settlement_amount:
            total_approved += float(c.approved_settlement_amount)
        if status_val in ("pending_review", "in_investigation"):
            open_count += 1

        claim_items.append(
            schemas.CustomerClaimItem(
                id=c.id,
                claim_number=c.claim_number,
                policy_number=c.policy_number,
                incident_date=c.incident_date,
                incident_type=c.incident_type,
                incident_description=c.incident_description,
                claimed_amount=float(c.claimed_amount or 0.0),
                approved_settlement_amount=float(c.approved_settlement_amount) if c.approved_settlement_amount else None,
                deductible_applied=float(c.deductible_applied) if c.deductible_applied else None,
                status=status_val,
                sla_deadline=c.sla_deadline,
                created_at=c.created_at,
                decided_at=c.decided_at,
                decided_by_name=c.decided_by_name
            )
        )

    return schemas.CustomerClaimsResponse(
        customer_id=customer.id,
        customer_name=f"{customer.first_name} {customer.last_name}".strip(),
        claims=claim_items,
        total_claimed=total_claimed,
        total_approved=total_approved,
        open_claims_count=open_count
    )

@router.get("/me/customers/{customer_id}/notes", response_model=schemas.CustomerNotesListResponse)
def get_customer_notes(
    customer_id: int,
    db: Session = Depends(database.get_db),
    agent: models.User = Depends(verify_agent)
):
    """
    Returns the chronological feed of outreach and interaction notes for the specified customer.
    Enforces strict agent ownership: only the assigned agent within the tenant can access these notes.
    """
    customer = db.query(models.Customer).filter(
        models.Customer.id == customer_id,
        models.Customer.tenant_id == agent.tenant_id,
        models.Customer.agent_id == agent.id
    ).first()

    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer #{customer_id} not found in your assigned portfolio."
        )

    notes = db.query(models.CustomerNote).filter(
        models.CustomerNote.tenant_id == agent.tenant_id,
        models.CustomerNote.customer_id == customer.id
    ).order_by(models.CustomerNote.created_at.desc(), models.CustomerNote.id.desc()).all()

    return schemas.CustomerNotesListResponse(
        customer_id=customer.id,
        customer_name=f"{customer.first_name} {customer.last_name}".strip(),
        notes=notes,
        total=len(notes)
    )

@router.post("/me/customers/{customer_id}/notes", response_model=schemas.CustomerNoteResponse, status_code=status.HTTP_201_CREATED)
def create_customer_note(
    customer_id: int,
    note_in: schemas.CustomerNoteCreate,
    db: Session = Depends(database.get_db),
    agent: models.User = Depends(verify_agent)
):
    """
    Logs an outreach, phone conversation, or interaction note for the customer.
    Enforces strict agent ownership and logs an immutable audit event.
    """
    customer = db.query(models.Customer).filter(
        models.Customer.id == customer_id,
        models.Customer.tenant_id == agent.tenant_id,
        models.Customer.agent_id == agent.id
    ).first()

    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer #{customer_id} not found in your assigned portfolio."
        )

    raw_note = note_in.note.strip()
    if len(raw_note) < 5 or len(raw_note) > 2000:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Note must be between 5 and 2000 characters."
        )

    agent_display_name = agent.name or agent.email

    new_note = models.CustomerNote(
        tenant_id=agent.tenant_id,
        customer_id=customer.id,
        agent_id=agent.id,
        agent_name=agent_display_name,
        note=raw_note
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)

    # Immutable audit trail
    log_audit_event(
        db=db,
        tenant_id=agent.tenant_id,
        actor=agent,
        category="customer",
        action="note_added",
        outcome="success",
        entity_type="customer_note",
        entity_id=str(new_note.id),
        entity_name=f"{customer.first_name} {customer.last_name}",
        summary=f"Agent {agent.email} added interaction note to customer {customer.first_name} {customer.last_name}",
        notes=raw_note[:150] + "..." if len(raw_note) > 150 else raw_note,
        details={
            "note_id": new_note.id,
            "customer_id": customer.id,
            "agent_id": agent.id,
            "agent_name": agent_display_name
        }
    )

    return new_note

@router.post("/me/applications", response_model=schemas.AgentApplicationResponse, status_code=status.HTTP_201_CREATED)
def submit_customer_application(
    app_in: schemas.AgentApplicationCreate,
    db: Session = Depends(database.get_db),
    agent: models.User = Depends(verify_agent)
):
    """
    Submits a new policy application on behalf of a customer in the agent's portfolio.
    Enforces customer ownership, validates policy parameters, assigns to the underwriting queue in pending_review status,
    and logs an immutable audit event.
    """
    # 1. Enforce customer ownership within tenant
    customer = db.query(models.Customer).filter(
        models.Customer.id == app_in.customer_id,
        models.Customer.tenant_id == agent.tenant_id,
        models.Customer.agent_id == agent.id
    ).first()

    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer #{app_in.customer_id} not found in your assigned portfolio."
        )

    # 2. Validate product_type
    normalized_product = app_in.product_type.lower().strip()
    if normalized_product == "home":
        normalized_product = "property"
    valid_products = ["auto", "property", "life", "health"]
    if normalized_product not in valid_products:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid product type '{app_in.product_type}'. Allowed products: auto, property, home, life, health."
        )

    if app_in.coverage_amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Coverage amount must be greater than 0."
        )

    if app_in.proposed_premium <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Proposed premium must be greater than 0."
        )

    # 3. Generate sequential Application Number APP-{year}-{tenant_id}-{sequence}
    now = datetime.now(timezone.utc)
    year = now.year
    seq_count = db.query(models.PolicyApplication).count() + 1
    candidate_app_num = f"APP-{year}-{agent.tenant_id}-{1000 + seq_count}"
    while db.query(models.PolicyApplication).filter(models.PolicyApplication.application_number == candidate_app_num).first():
        seq_count += 1
        candidate_app_num = f"APP-{year}-{agent.tenant_id}-{1000 + seq_count}"

    # 4. Baseline risk score computation
    baseline_score = 45
    if customer.churn_risk_flag:
        baseline_score += 15
    if app_in.coverage_amount > 500000:
        baseline_score += 10
    baseline_score = max(1, min(99, baseline_score))

    risk_tier = models.RiskTier.low if baseline_score < 40 else (
        models.RiskTier.medium if baseline_score <= 70 else models.RiskTier.high
    )

    # 5. Construct merged applicant data
    applicant_data = dict(app_in.applicant_data) if app_in.applicant_data else {}
    applicant_data["effective_date"] = app_in.effective_date or now.strftime("%Y-%m-%d")
    applicant_data["customer_address"] = customer.address
    applicant_data["date_of_birth"] = customer.date_of_birth
    applicant_data["submission_channel"] = "agent_assisted"
    applicant_data["agent_name"] = agent.name or agent.email

    # 6. Create PolicyApplication record
    full_cust_name = f"{customer.first_name} {customer.last_name}".strip()
    new_app = models.PolicyApplication(
        tenant_id=agent.tenant_id,
        application_number=candidate_app_num,
        applicant_name=full_cust_name,
        applicant_email=customer.email,
        applicant_phone=customer.phone,
        product_type=normalized_product,
        coverage_amount=float(app_in.coverage_amount),
        proposed_premium=float(app_in.proposed_premium),
        risk_score=baseline_score,
        risk_tier=risk_tier,
        status=models.ApplicationStatus.pending_review,
        applicant_data=applicant_data,
        risk_factors={"rule_triggers": [], "flagged_conditions": []},
        documents=[],
        customer_id=customer.id,
        agent_id=agent.id
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)

    # 7. Immutable audit logging
    log_audit_event(
        db=db,
        tenant_id=agent.tenant_id,
        actor=agent,
        category="application",
        action="submitted_by_agent",
        outcome="success",
        entity_type="policy_application",
        entity_id=str(new_app.id),
        entity_name=new_app.application_number,
        summary=f"Agent {agent.email} submitted {normalized_product.upper()} application {new_app.application_number} for customer {full_cust_name}",
        notes=f"Coverage: ${new_app.coverage_amount:,.2f}, Premium: ${new_app.proposed_premium:,.2f}. Assigned to Underwriting Queue.",
        details={
            "application_id": new_app.id,
            "application_number": new_app.application_number,
            "customer_id": customer.id,
            "agent_id": agent.id,
            "product_type": normalized_product,
            "coverage_amount": new_app.coverage_amount,
            "proposed_premium": new_app.proposed_premium,
            "risk_score": new_app.risk_score,
            "risk_tier": new_app.risk_tier.value if hasattr(new_app.risk_tier, 'value') else str(new_app.risk_tier),
            "status": new_app.status.value if hasattr(new_app.status, 'value') else str(new_app.status)
        }
    )

    return schemas.AgentApplicationResponse(
        id=new_app.id,
        tenant_id=new_app.tenant_id,
        agent_id=new_app.agent_id,
        customer_id=new_app.customer_id,
        application_number=new_app.application_number,
        applicant_name=new_app.applicant_name,
        applicant_email=new_app.applicant_email,
        applicant_phone=new_app.applicant_phone,
        product_type=new_app.product_type,
        coverage_amount=new_app.coverage_amount,
        proposed_premium=new_app.proposed_premium,
        adjusted_premium=new_app.adjusted_premium,
        risk_score=new_app.risk_score,
        risk_tier=new_app.risk_tier.value if hasattr(new_app.risk_tier, 'value') else str(new_app.risk_tier),
        status=new_app.status.value if hasattr(new_app.status, 'value') else str(new_app.status),
        applicant_data=new_app.applicant_data,
        documents=new_app.documents,
        created_at=new_app.created_at
    )

@router.get("/me/applications/{application_id}/documents", response_model=schemas.ApplicationDocumentsResponse)
def get_application_documents(
    application_id: int,
    db: Session = Depends(database.get_db),
    agent: models.User = Depends(verify_agent)
):
    """
    Returns the list of supporting KYC and underwriting documents attached to the application.
    Enforces agent ownership: only the originating agent within the tenant can view these documents.
    """
    app = db.query(models.PolicyApplication).filter(
        models.PolicyApplication.id == application_id,
        models.PolicyApplication.tenant_id == agent.tenant_id,
        models.PolicyApplication.agent_id == agent.id
    ).first()

    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy application #{application_id} not found in your assigned portfolio."
        )

    raw_docs = list(app.documents or [])
    doc_items = []
    for d in raw_docs:
        doc_items.append(
            schemas.ApplicationDocumentItem(
                id=str(d.get("id", uuid.uuid4().hex[:8])),
                doc_type=d.get("type", d.get("doc_type", "supporting_doc")),
                name=d.get("name", d.get("file_name", "Document")),
                url=d.get("url", d.get("file_url")),
                size_bytes=int(d.get("size_bytes", d.get("file_size_bytes", 0))),
                description=d.get("description", ""),
                uploaded_at=d.get("uploaded_at", datetime.now(timezone.utc).isoformat()),
                uploaded_by=d.get("uploaded_by", agent.email)
            )
        )

    return schemas.ApplicationDocumentsResponse(
        application_id=app.id,
        application_number=app.application_number,
        documents=doc_items,
        total=len(doc_items)
    )

@router.post("/me/applications/{application_id}/documents", response_model=schemas.ApplicationDocumentItem, status_code=status.HTTP_201_CREATED)
def upload_application_document(
    application_id: int,
    doc_in: schemas.ApplicationDocumentCreate,
    db: Session = Depends(database.get_db),
    agent: models.User = Depends(verify_agent)
):
    """
    Attaches a supporting KYC or underwriting document to the policy application.
    Enforces application ownership, validates file extension and size, updates application.documents,
    and logs an immutable audit event.
    """
    app = db.query(models.PolicyApplication).filter(
        models.PolicyApplication.id == application_id,
        models.PolicyApplication.tenant_id == agent.tenant_id,
        models.PolicyApplication.agent_id == agent.id
    ).first()

    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy application #{application_id} not found in your assigned portfolio."
        )

    valid_types = [
        "drivers_license", "property_deed", "inspection_report", 
        "medical_records", "id_proof", "income_proof", "vehicle_title", "other"
    ]
    norm_type = doc_in.doc_type.lower().strip()
    if norm_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid document type '{doc_in.doc_type}'. Allowed types: {', '.join(valid_types)}"
        )

    # Allowed extensions
    allowed_extensions = (".pdf", ".jpg", ".jpeg", ".png")
    fname_lower = doc_in.file_name.lower().strip()
    if not any(fname_lower.endswith(ext) for ext in allowed_extensions):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid file format. Allowed file extensions: .pdf, .jpg, .jpeg, .png"
        )

    # File size validation (max 10MB)
    size_bytes = doc_in.file_size_bytes or 1024 * 150 # default ~150KB if mock/simulated
    if size_bytes > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="File size exceeds maximum permitted limit of 10MB."
        )

    doc_id = f"doc_{uuid.uuid4().hex[:10]}"
    now_iso = datetime.now(timezone.utc).isoformat()
    mock_storage_url = doc_in.file_url or f"/storage/tenants/{agent.tenant_id}/applications/{app.application_number}/{doc_in.file_name}"

    new_doc_dict = {
        "id": doc_id,
        "name": doc_in.file_name,
        "type": norm_type,
        "doc_type": norm_type,
        "url": mock_storage_url,
        "size_bytes": size_bytes,
        "description": doc_in.description or f"KYC/Supporting document for {norm_type}",
        "uploaded_at": now_iso,
        "uploaded_by": agent.email
    }

    current_docs = list(app.documents or [])
    current_docs.append(new_doc_dict)
    app.documents = current_docs
    db.commit()
    db.refresh(app)

    # Immutable audit logging
    log_audit_event(
        db=db,
        tenant_id=agent.tenant_id,
        actor=agent,
        category="application",
        action="document_uploaded",
        outcome="success",
        entity_type="policy_application",
        entity_id=str(app.id),
        entity_name=app.application_number,
        summary=f"Agent {agent.email} uploaded {norm_type} document '{doc_in.file_name}' to application {app.application_number}",
        notes=f"File: {doc_in.file_name} ({size_bytes} bytes). Attached to underwriting dossier.",
        details={
            "document_id": doc_id,
            "document_name": doc_in.file_name,
            "doc_type": norm_type,
            "size_bytes": size_bytes,
            "application_id": app.id,
            "application_number": app.application_number
        }
    )

    return schemas.ApplicationDocumentItem(
        id=doc_id,
        doc_type=norm_type,
        name=doc_in.file_name,
        url=mock_storage_url,
        size_bytes=size_bytes,
        description=doc_in.description or f"KYC/Supporting document for {norm_type}",
        uploaded_at=now_iso,
        uploaded_by=agent.email
    )

@router.get("/me/applications", response_model=schemas.AgentApplicationsListResponse)
def list_agent_applications(
    customer_id: Optional[int] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    product_type: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(database.get_db),
    agent: models.User = Depends(verify_agent)
):
    """
    Returns the paginated list of policy applications submitted by or assigned to the agent.
    Supports filtering by status, customer_id, product_type, and search term.
    Enforces strict agent ownership within the tenant.
    """
    base_query = db.query(models.PolicyApplication).filter(
        models.PolicyApplication.tenant_id == agent.tenant_id,
        models.PolicyApplication.agent_id == agent.id
    )

    # Compute status breakdown counts across the agent's full application portfolio
    all_agent_apps = base_query.all()
    status_counts = {
        "all": len(all_agent_apps),
        "pending_review": 0,
        "approved": 0,
        "rejected": 0,
        "referred": 0
    }
    for app in all_agent_apps:
        s_val = app.status.value if hasattr(app.status, "value") else str(app.status)
        if s_val in status_counts:
            status_counts[s_val] += 1

    query = base_query

    if customer_id is not None:
        query = query.filter(models.PolicyApplication.customer_id == customer_id)

    if status_filter:
        s_clean = status_filter.lower().strip()
        if s_clean != "all":
            query = query.filter(func.lower(models.PolicyApplication.status) == s_clean)

    if product_type:
        p_clean = product_type.lower().strip()
        if p_clean == "home":
            p_clean = "property"
        query = query.filter(func.lower(models.PolicyApplication.product_type) == p_clean)

    if search:
        search_term = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(models.PolicyApplication.applicant_name).like(search_term),
                func.lower(models.PolicyApplication.applicant_email).like(search_term),
                func.lower(models.PolicyApplication.application_number).like(search_term)
            )
        )

    total_count = query.count()
    total_pages = math.ceil(total_count / limit) if total_count > 0 else 1
    offset = (page - 1) * limit

    apps = query.order_by(models.PolicyApplication.created_at.desc(), models.PolicyApplication.id.desc()).offset(offset).limit(limit).all()

    app_items = []
    for a in apps:
        status_str = a.status.value if hasattr(a.status, "value") else str(a.status)
        tier_str = a.risk_tier.value if hasattr(a.risk_tier, "value") else str(a.risk_tier)
        docs = a.documents or []
        app_items.append(
            schemas.AgentApplicationListItem(
                id=a.id,
                application_number=a.application_number,
                customer_id=a.customer_id,
                applicant_name=a.applicant_name,
                applicant_email=a.applicant_email,
                applicant_phone=a.applicant_phone,
                product_type=a.product_type,
                coverage_amount=float(a.coverage_amount),
                proposed_premium=float(a.proposed_premium),
                adjusted_premium=float(a.adjusted_premium) if a.adjusted_premium is not None else None,
                risk_score=a.risk_score,
                risk_tier=tier_str,
                status=status_str,
                document_count=len(docs),
                decision_note=a.decision_note,
                decided_at=a.decided_at,
                decided_by_name=a.decided_by_name,
                created_at=a.created_at
            )
        )

    return schemas.AgentApplicationsListResponse(
        applications=app_items,
        total=total_count,
        page=page,
        limit=limit,
        total_pages=total_pages,
        status_counts=status_counts
    )

@router.get("/me/applications/{application_id}", response_model=schemas.AgentApplicationResponse)
def get_agent_application_detail(
    application_id: int,
    db: Session = Depends(database.get_db),
    agent: models.User = Depends(verify_agent)
):
    """
    Returns full dossier details for an application submitted by the agent,
    including underwriter decision justification, assigned risk score, and document attachments.
    Enforces strict agent ownership within the tenant.
    """
    app = db.query(models.PolicyApplication).filter(
        models.PolicyApplication.id == application_id,
        models.PolicyApplication.tenant_id == agent.tenant_id,
        models.PolicyApplication.agent_id == agent.id
    ).first()

    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy application #{application_id} not found in your assigned portfolio."
        )

    status_str = app.status.value if hasattr(app.status, "value") else str(app.status)
    tier_str = app.risk_tier.value if hasattr(app.risk_tier, "value") else str(app.risk_tier)

    return schemas.AgentApplicationResponse(
        id=app.id,
        tenant_id=app.tenant_id,
        agent_id=app.agent_id,
        customer_id=app.customer_id,
        application_number=app.application_number,
        applicant_name=app.applicant_name,
        applicant_email=app.applicant_email,
        applicant_phone=app.applicant_phone,
        product_type=app.product_type,
        coverage_amount=float(app.coverage_amount),
        proposed_premium=float(app.proposed_premium),
        adjusted_premium=float(app.adjusted_premium) if app.adjusted_premium is not None else None,
        risk_score=app.risk_score,
        risk_tier=tier_str,
        status=status_str,
        applicant_data=app.applicant_data,
        documents=app.documents,
        decision_note=app.decision_note,
        decided_at=app.decided_at,
        decided_by_name=app.decided_by_name,
        created_at=app.created_at,
        updated_at=app.updated_at
    )

@router.post("/me/logout")
def logout_agent(
    db: Session = Depends(database.get_db),
    agent: models.User = Depends(verify_agent)
):
    """
    Terminates the agent's workspace session and logs an immutable audit event.
    """
    log_audit_event(
        db=db,
        tenant_id=agent.tenant_id,
        actor=agent,
        category="auth",
        action="logout",
        outcome="success",
        entity_type="user",
        entity_id=str(agent.id),
        entity_name=agent.email,
        summary=f"Agent {agent.email} signed out of workspace",
        notes="Agent session terminated via Sign Out action in Agent Layout.",
        details={"agent_id": agent.id, "email": agent.email, "role": "agent"}
    )
    return {"message": "Agent session logged out successfully"}


# ==============================================================================
# RETENTION ALERTS & PROACTIVE OUTREACH (VERTICAL SLICE A7)
# ==============================================================================

def _compute_alert_urgency(days: int) -> str:
    if days <= 7:
        return "critical"
    elif days <= 14:
        return "moderate"
    return "standard"


@router.get("/me/retention-alerts", response_model=schemas.RetentionAlertsListResponse)
def list_agent_retention_alerts(
    status_filter: Optional[str] = Query("open", alias="status"),
    alert_type: Optional[str] = None,
    urgency: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(database.get_db),
    agent: models.User = Depends(verify_agent)
):
    """
    Retrieves the worklist of retention alerts assigned to the agent.
    Supports filtering by status (open, resolved, all), alert type, urgency level,
    and search term against customer name or policy number.
    Strictly scoped to agent.id and agent.tenant_id.
    """
    base_query = db.query(models.RetentionAlert).filter(
        models.RetentionAlert.tenant_id == agent.tenant_id,
        models.RetentionAlert.agent_id == agent.id
    )

    # Compute metrics across the agent's full alert book
    all_alerts = base_query.all()
    open_count = sum(1 for a in all_alerts if a.status == "open")
    resolved_count = sum(1 for a in all_alerts if a.status == "resolved")
    critical_count = sum(1 for a in all_alerts if a.status == "open" and a.days_remaining <= 7)
    moderate_count = sum(1 for a in all_alerts if a.status == "open" and 7 < a.days_remaining <= 14)

    # Apply status filter
    query = base_query
    if status_filter and status_filter.lower() != "all":
        query = query.filter(models.RetentionAlert.status == status_filter.lower())

    # Apply alert_type filter
    if alert_type and alert_type.lower() != "all":
        query = query.filter(models.RetentionAlert.alert_type == alert_type.lower())

    # Apply urgency filter
    if urgency and urgency.lower() != "all":
        urg_val = urgency.lower()
        if urg_val == "critical":
            query = query.filter(models.RetentionAlert.days_remaining <= 7)
        elif urg_val == "moderate":
            query = query.filter(models.RetentionAlert.days_remaining > 7, models.RetentionAlert.days_remaining <= 14)
        elif urg_val == "standard":
            query = query.filter(models.RetentionAlert.days_remaining > 14)

    # Apply text search
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.RetentionAlert.customer_name.ilike(term),
                models.RetentionAlert.policy_number.ilike(term),
                models.RetentionAlert.customer_email.ilike(term)
            )
        )

    # Order: Open alerts first, sorted ascending by days_remaining, then newest created
    query = query.order_by(
        models.RetentionAlert.status.asc(),
        models.RetentionAlert.days_remaining.asc(),
        models.RetentionAlert.created_at.desc()
    )

    total_count = query.count()
    total_pages = math.ceil(total_count / limit) if total_count > 0 else 1
    paged_alerts = query.offset((page - 1) * limit).limit(limit).all()

    alert_items = [
        schemas.RetentionAlertItem(
            id=a.id,
            policy_id=a.policy_id,
            policy_number=a.policy_number,
            customer_id=a.customer_id,
            customer_name=a.customer_name,
            customer_email=a.customer_email,
            customer_phone=a.customer_phone,
            product_type=a.product_type,
            alert_type=a.alert_type,
            churn_reason=a.churn_reason,
            renewal_date=a.renewal_date,
            days_remaining=a.days_remaining,
            urgency=_compute_alert_urgency(a.days_remaining),
            status=a.status,
            resolved_at=a.resolved_at,
            resolution_note=a.resolution_note,
            created_at=a.created_at
        )
        for a in paged_alerts
    ]

    return schemas.RetentionAlertsListResponse(
        alerts=alert_items,
        total=total_count,
        page=page,
        limit=limit,
        total_pages=total_pages,
        open_count=open_count,
        resolved_count=resolved_count,
        critical_count=critical_count,
        moderate_count=moderate_count
    )


@router.get("/me/retention-alerts/{alert_id}", response_model=schemas.RetentionAlertItem)
def get_agent_retention_alert_detail(
    alert_id: int,
    db: Session = Depends(database.get_db),
    agent: models.User = Depends(verify_agent)
):
    """
    Retrieves the full dossier of a specific retention alert assigned to the agent.
    Enforces strict agent ownership within the tenant.
    """
    alert = db.query(models.RetentionAlert).filter(
        models.RetentionAlert.id == alert_id,
        models.RetentionAlert.tenant_id == agent.tenant_id,
        models.RetentionAlert.agent_id == agent.id
    ).first()

    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Retention alert #{alert_id} not found in your assigned worklist."
        )

    return schemas.RetentionAlertItem(
        id=alert.id,
        policy_id=alert.policy_id,
        policy_number=alert.policy_number,
        customer_id=alert.customer_id,
        customer_name=alert.customer_name,
        customer_email=alert.customer_email,
        customer_phone=alert.customer_phone,
        product_type=alert.product_type,
        alert_type=alert.alert_type,
        churn_reason=alert.churn_reason,
        renewal_date=alert.renewal_date,
        days_remaining=alert.days_remaining,
        urgency=_compute_alert_urgency(alert.days_remaining),
        status=alert.status,
        resolved_at=alert.resolved_at,
        resolution_note=alert.resolution_note,
        created_at=alert.created_at
    )


@router.post("/me/retention-alerts/scan")
def scan_and_generate_retention_alerts(
    db: Session = Depends(database.get_db),
    agent: models.User = Depends(verify_agent)
):
    """
    Automated portfolio scan: Evaluates all active policies belonging to the agent's
    assigned customers and creates retention alerts for any policy expiring within 30 days.
    """
    now = datetime.now(timezone.utc)
    threshold_30d = now + timedelta(days=30)

    # Find all customers assigned to this agent
    customers = db.query(models.Customer).filter(
        models.Customer.tenant_id == agent.tenant_id,
        models.Customer.agent_id == agent.id
    ).all()
    customer_map = {c.id: c for c in customers}
    customer_ids = list(customer_map.keys())

    if not customer_ids:
        return {"scanned_policies": 0, "new_alerts_created": 0}

    # Find active policies for these customers
    policies = db.query(models.Policy).filter(
        models.Policy.tenant_id == agent.tenant_id,
        models.Policy.customer_id.in_(customer_ids),
        models.Policy.status == "active",
        models.Policy.end_date.isnot(None),
        models.Policy.end_date <= threshold_30d
    ).all()

    new_alerts_count = 0
    for pol in policies:
        # Check if an open alert already exists for this policy
        existing_alert = db.query(models.RetentionAlert).filter(
            models.RetentionAlert.tenant_id == agent.tenant_id,
            models.RetentionAlert.policy_id == pol.id,
            models.RetentionAlert.status == "open"
        ).first()

        end_d = pol.end_date
        if end_d.tzinfo is None:
            end_d = end_d.replace(tzinfo=timezone.utc)

        days_remaining = max(0, (end_d - now).days)

        if not existing_alert:
            cust = customer_map.get(pol.customer_id)
            cust_name = f"{cust.first_name} {cust.last_name}" if cust else pol.holder_name
            cust_email = cust.email if cust else pol.holder_email
            cust_phone = cust.phone if cust else None

            # Determine alert type based on urgency and prior claim history
            claims_count = db.query(models.Claim).filter(
                models.Claim.tenant_id == agent.tenant_id,
                models.Claim.policy_id == pol.id
            ).count()

            if claims_count > 0:
                alert_type = "lapse_risk"
                churn_reason = f"Active claim history ({claims_count} claim{'s' if claims_count > 1 else ''}) - high churn probability"
            elif days_remaining <= 7:
                alert_type = "lapse_risk"
                churn_reason = f"Imminent expiration ({days_remaining} days remaining)"
            else:
                alert_type = "upcoming_renewal"
                churn_reason = f"Policy renewal window active ({days_remaining} days remaining)"

            new_alert = models.RetentionAlert(
                tenant_id=agent.tenant_id,
                agent_id=agent.id,
                customer_id=pol.customer_id,
                policy_id=pol.id,
                policy_number=pol.policy_number,
                customer_name=cust_name,
                customer_email=cust_email,
                customer_phone=cust_phone,
                product_type=pol.product_type,
                alert_type=alert_type,
                churn_reason=churn_reason,
                renewal_date=pol.end_date,
                days_remaining=days_remaining,
                status="open"
            )
            db.add(new_alert)
            new_alerts_count += 1
        else:
            # Update days_remaining on the existing open alert
            existing_alert.days_remaining = days_remaining

    if new_alerts_count > 0:
        db.commit()
        log_audit_event(
            db=db,
            tenant_id=agent.tenant_id,
            actor=agent,
            category="retention",
            action="alerts_generated",
            outcome="success",
            entity_type="retention_alert",
            entity_id=str(agent.id),
            entity_name="Portfolio Retention Scan",
            summary=f"Agent portfolio scan generated {new_alerts_count} new retention alert(s)",
            notes=f"Scanned {len(policies)} qualifying expiring policies for agent {agent.email}.",
            details={"agent_id": agent.id, "new_alerts": new_alerts_count, "policies_scanned": len(policies)}
        )
    else:
        db.commit()

    return {
        "scanned_policies": len(policies),
        "new_alerts_created": new_alerts_count
    }


@router.get("/me/retention-alerts/{alert_id}/outreach", response_model=List[schemas.OutreachLogItem])
def get_alert_outreach_history(
    alert_id: int,
    db: Session = Depends(database.get_db),
    agent: models.User = Depends(verify_agent)
):
    """
    Retrieves the chronological history of outreach logs recorded against a retention alert.
    Enforces strict agent ownership within the tenant.
    """
    alert = db.query(models.RetentionAlert).filter(
        models.RetentionAlert.id == alert_id,
        models.RetentionAlert.tenant_id == agent.tenant_id,
        models.RetentionAlert.agent_id == agent.id
    ).first()

    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Retention alert #{alert_id} not found in your assigned worklist."
        )

    logs = db.query(models.OutreachLog).filter(
        models.OutreachLog.tenant_id == agent.tenant_id,
        models.OutreachLog.alert_id == alert.id
    ).order_by(models.OutreachLog.logged_at.desc(), models.OutreachLog.id.desc()).all()

    return [
        schemas.OutreachLogItem(
            id=log.id,
            alert_id=log.alert_id,
            customer_id=log.customer_id,
            agent_id=log.agent_id,
            agent_name=log.agent_name,
            contact_method=log.contact_method,
            outcome=log.outcome,
            notes=log.notes,
            logged_at=log.logged_at
        )
        for log in logs
    ]


@router.post("/me/retention-alerts/{alert_id}/outreach", response_model=schemas.AlertOutreachResponse, status_code=status.HTTP_201_CREATED)
def log_retention_alert_outreach(
    alert_id: int,
    log_in: schemas.OutreachLogCreate,
    db: Session = Depends(database.get_db),
    agent: models.User = Depends(verify_agent)
):
    """
    Logs an outreach touchpoint on a retention alert.
    Validates contact method and outcome.
    If the customer commits to renew ('contacted_renewing'), automatically marks the alert
    as resolved and extends the underlying policy expiration by 1 year.
    Logs an immutable audit event.
    """
    alert = db.query(models.RetentionAlert).filter(
        models.RetentionAlert.id == alert_id,
        models.RetentionAlert.tenant_id == agent.tenant_id,
        models.RetentionAlert.agent_id == agent.id
    ).first()

    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Retention alert #{alert_id} not found in your assigned worklist."
        )

    valid_methods = ["call", "email", "sms", "in_person"]
    norm_method = log_in.contact_method.lower().strip()
    if norm_method not in valid_methods:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid contact method '{log_in.contact_method}'. Allowed: {', '.join(valid_methods)}"
        )

    valid_outcomes = ["contacted_renewing", "left_message", "unreachable", "not_renewing"]
    norm_outcome = log_in.outcome.lower().strip()
    if norm_outcome not in valid_outcomes:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid outreach outcome '{log_in.outcome}'. Allowed: {', '.join(valid_outcomes)}"
        )

    notes_str = log_in.notes.strip() if log_in.notes else None
    if notes_str and len(notes_str) > 1000:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Outreach notes cannot exceed 1000 characters."
        )

    agent_display = agent.name or agent.email

    # Create persistent outreach log entry
    new_log = models.OutreachLog(
        tenant_id=agent.tenant_id,
        alert_id=alert.id,
        customer_id=alert.customer_id,
        agent_id=agent.id,
        agent_name=agent_display,
        contact_method=norm_method,
        outcome=norm_outcome,
        notes=notes_str
    )
    db.add(new_log)

    policy_renewed = False
    now = datetime.now(timezone.utc)

    # Business Logic: Customer confirms renewal
    if norm_outcome == "contacted_renewing":
        alert.status = "resolved"
        alert.resolved_at = now
        res_summary = f"Retained via {norm_method}: {notes_str or 'Customer confirmed renewal commitment.'}"
        alert.resolution_note = res_summary[:500]

        # Update underlying policy renewal date if associated
        if alert.policy_id:
            policy = db.query(models.Policy).filter(
                models.Policy.id == alert.policy_id,
                models.Policy.tenant_id == agent.tenant_id
            ).first()
            if policy:
                curr_end = policy.end_date or now
                if curr_end.tzinfo is None:
                    curr_end = curr_end.replace(tzinfo=timezone.utc)
                # Extend policy by 365 days
                policy.end_date = curr_end + timedelta(days=365)
                policy_renewed = True

                # Generate renewal commission entry
                renewal_rate = 0.08  # 8% renewal commission rate
                prem = float(policy.premium_amount or 1000.0)
                comm_amount = round(prem * renewal_rate, 2)
                renewal_comm = models.CommissionEntry(
                    tenant_id=agent.tenant_id,
                    agent_id=agent.id,
                    customer_id=alert.customer_id,
                    customer_name=alert.customer_name,
                    policy_id=policy.id,
                    policy_number=policy.policy_number,
                    product_type=policy.product_type,
                    event_type="renewal",
                    premium_amount=prem,
                    commission_rate=renewal_rate,
                    commission_amount=comm_amount,
                    status="pending",
                    effective_date=now
                )
                db.add(renewal_comm)

    db.commit()
    db.refresh(new_log)
    db.refresh(alert)

    # Immutable Audit Log
    log_audit_event(
        db=db,
        tenant_id=agent.tenant_id,
        actor=agent,
        category="retention",
        action="outreach_logged",
        outcome="success",
        entity_type="outreach_log",
        entity_id=str(new_log.id),
        entity_name=f"Alert #{alert.id} ({alert.policy_number})",
        summary=f"Agent {agent.email} logged {norm_method} outreach on {alert.customer_name} ({norm_outcome})",
        notes=notes_str or f"Outcome: {norm_outcome}",
        details={
            "outreach_id": new_log.id,
            "alert_id": alert.id,
            "policy_number": alert.policy_number,
            "customer_name": alert.customer_name,
            "contact_method": norm_method,
            "outcome": norm_outcome,
            "alert_status": alert.status,
            "policy_renewed": policy_renewed
        }
    )

    outreach_item = schemas.OutreachLogItem(
        id=new_log.id,
        alert_id=new_log.alert_id,
        customer_id=new_log.customer_id,
        agent_id=new_log.agent_id,
        agent_name=new_log.agent_name,
        contact_method=new_log.contact_method,
        outcome=new_log.outcome,
        notes=new_log.notes,
        logged_at=new_log.logged_at
    )

    return schemas.AlertOutreachResponse(
        outreach=outreach_item,
        alert_id=alert.id,
        alert_status=alert.status,
        resolution_note=alert.resolution_note,
        policy_renewed=policy_renewed
    )


# ==============================================================================
# COMMISSION LEDGER & TRACKER (VERTICAL SLICE A8)
# ==============================================================================

@router.get("/me/commission", response_model=schemas.CommissionListResponse)
def list_agent_commissions(
    status_filter: Optional[str] = Query("all", alias="status"),
    event_type: Optional[str] = None,
    month: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(database.get_db),
    agent: models.User = Depends(verify_agent)
):
    """
    Returns the agent's commission ledger with summary KPIs (MTD, YTD, Pending, Paid).
    Strictly scoped to agent.id and agent.tenant_id.
    """
    base_query = db.query(models.CommissionEntry).filter(
        models.CommissionEntry.tenant_id == agent.tenant_id,
        models.CommissionEntry.agent_id == agent.id
    )

    all_entries = base_query.all()
    now = datetime.now(timezone.utc)

    # Calculate summary KPIs
    total_earned = sum(c.commission_amount for c in all_entries)
    paid_amount = sum(c.commission_amount for c in all_entries if c.status == "paid")
    pending_amount = sum(c.commission_amount for c in all_entries if c.status == "pending")

    mtd_amount = sum(
        c.commission_amount for c in all_entries
        if c.created_at and c.created_at.year == now.year and c.created_at.month == now.month
    )
    ytd_amount = sum(
        c.commission_amount for c in all_entries
        if c.created_at and c.created_at.year == now.year
    )
    pending_count = sum(1 for c in all_entries if c.status == "pending")
    paid_count = sum(1 for c in all_entries if c.status == "paid")

    summary = schemas.CommissionSummary(
        total_earned=round(total_earned, 2),
        paid_amount=round(paid_amount, 2),
        pending_amount=round(pending_amount, 2),
        mtd_amount=round(mtd_amount, 2),
        ytd_amount=round(ytd_amount, 2),
        pending_count=pending_count,
        paid_count=paid_count
    )

    query = base_query

    # Status filter
    if status_filter and status_filter.lower() != "all":
        query = query.filter(models.CommissionEntry.status == status_filter.lower())

    # Event type filter
    if event_type and event_type.lower() != "all":
        query = query.filter(models.CommissionEntry.event_type == event_type.lower())

    # Month filter (format: YYYY-MM)
    if month and month.lower() != "all":
        try:
            parts = month.split("-")
            if len(parts) == 2:
                y = int(parts[0])
                m = int(parts[1])
                start_date = datetime(y, m, 1, tzinfo=timezone.utc)
                if m == 12:
                    end_date = datetime(y + 1, 1, 1, tzinfo=timezone.utc)
                else:
                    end_date = datetime(y, m + 1, 1, tzinfo=timezone.utc)
                query = query.filter(
                    models.CommissionEntry.created_at >= start_date,
                    models.CommissionEntry.created_at < end_date
                )
        except Exception:
            pass

    # Search filter
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.CommissionEntry.customer_name.ilike(term),
                models.CommissionEntry.policy_number.ilike(term)
            )
        )

    query = query.order_by(
        models.CommissionEntry.created_at.desc(),
        models.CommissionEntry.id.desc()
    )

    total_count = query.count()
    total_pages = math.ceil(total_count / limit) if total_count > 0 else 1
    paged = query.offset((page - 1) * limit).limit(limit).all()

    items = [
        schemas.CommissionItem(
            id=c.id,
            policy_id=c.policy_id,
            policy_number=c.policy_number,
            customer_id=c.customer_id,
            customer_name=c.customer_name,
            product_type=c.product_type,
            event_type=c.event_type,
            premium_amount=float(c.premium_amount),
            commission_rate=float(c.commission_rate),
            commission_amount=float(c.commission_amount),
            status=c.status,
            effective_date=c.effective_date,
            paid_at=c.paid_at,
            created_at=c.created_at
        )
        for c in paged
    ]

    return schemas.CommissionListResponse(
        entries=items,
        total=total_count,
        page=page,
        limit=limit,
        total_pages=total_pages,
        summary=summary
    )


@router.get("/me/commission/export")
def export_agent_commissions_csv(
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    month: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    event_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(database.get_db),
    agent: models.User = Depends(verify_agent)
):
    """
    Exports the verified agent's commission ledger entries to standard CSV.
    Supports filtering by date range (from/to), month, status, event_type, and search.
    Logs immutable audit trail for compliance.
    """
    query = db.query(models.CommissionEntry).filter(
        models.CommissionEntry.tenant_id == agent.tenant_id,
        models.CommissionEntry.agent_id == agent.id
    )

    # Date filters
    if from_date and from_date.strip():
        try:
            fd = datetime.strptime(from_date.strip(), "%Y-%m-%d").replace(tzinfo=timezone.utc)
            query = query.filter(models.CommissionEntry.created_at >= fd)
        except Exception:
            pass

    if to_date and to_date.strip():
        try:
            td = datetime.strptime(to_date.strip(), "%Y-%m-%d").replace(hour=23, minute=59, second=59, microsecond=999999, tzinfo=timezone.utc)
            query = query.filter(models.CommissionEntry.created_at <= td)
        except Exception:
            pass

    if month and month.lower() != "all":
        try:
            parts = month.split("-")
            if len(parts) == 2:
                y = int(parts[0])
                m = int(parts[1])
                start_date = datetime(y, m, 1, tzinfo=timezone.utc)
                if m == 12:
                    end_date = datetime(y + 1, 1, 1, tzinfo=timezone.utc)
                else:
                    end_date = datetime(y, m + 1, 1, tzinfo=timezone.utc)
                query = query.filter(
                    models.CommissionEntry.created_at >= start_date,
                    models.CommissionEntry.created_at < end_date
                )
        except Exception:
            pass

    # Status filter
    if status_filter and status_filter.lower() != "all":
        query = query.filter(models.CommissionEntry.status == status_filter.lower())

    # Event type filter
    if event_type and event_type.lower() != "all":
        query = query.filter(models.CommissionEntry.event_type == event_type.lower())

    # Search filter
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.CommissionEntry.customer_name.ilike(term),
                models.CommissionEntry.policy_number.ilike(term)
            )
        )

    entries = query.order_by(
        models.CommissionEntry.created_at.desc(),
        models.CommissionEntry.id.desc()
    ).all()

    # Generate CSV
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Entry ID",
        "Date",
        "Customer Name",
        "Policy Number",
        "Product Line",
        "Event Type",
        "Premium Amount",
        "Commission Rate",
        "Commission Amount",
        "Payout Status",
        "Settled Date"
    ])

    for entry in entries:
        date_str = entry.created_at.strftime("%Y-%m-%d %H:%M:%S") if entry.created_at else ""
        settled_str = entry.paid_at.strftime("%Y-%m-%d %H:%M:%S") if entry.paid_at else ""
        writer.writerow([
            entry.id,
            date_str,
            entry.customer_name or "",
            entry.policy_number or "",
            entry.product_type or "",
            entry.event_type or "",
            f"{float(entry.premium_amount):.2f}",
            f"{float(entry.commission_rate) * 100:.1f}%",
            f"{float(entry.commission_amount):.2f}",
            (entry.status or "").capitalize(),
            settled_str
        ])

    csv_data = output.getvalue()
    filename = f"commission_export_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"

    # Immutable Audit Log
    log_audit_event(
        db=db,
        tenant_id=agent.tenant_id,
        actor=agent,
        category="commission",
        action="exported_csv",
        outcome="success",
        entity_type="commission_ledger",
        entity_id=str(agent.id),
        entity_name=f"Commission Ledger Export ({len(entries)} entries)",
        summary=f"Agent {agent.email} exported {len(entries)} commission records to CSV",
        notes=f"Records exported: {len(entries)}",
        details={
            "agent_id": agent.id,
            "record_count": len(entries),
            "filters": {
                "from": from_date,
                "to": to_date,
                "month": month,
                "status": status_filter,
                "event_type": event_type,
                "search": search
            }
        }
    )

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )



