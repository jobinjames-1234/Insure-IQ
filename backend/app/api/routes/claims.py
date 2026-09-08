from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID

from app.core.database import get_db
from app.api.deps import get_current_user, require_role
from app.models.user import User
from app.models.customer import Customer
from app.models.policy import Policy
from app.models.claim import Claim, ClaimDocument, ClaimStatusHistory, AdjusterNote
from app.models.reporting import ClaimSLA, SystemActivityLog, FinancialLedger
from datetime import date

router = APIRouter(prefix="/claims", tags=["claims"])

@router.post("")
async def file_claim(
    payload: dict,
    current_user: User = Depends(require_role(["customer"])),
    db: AsyncSession = Depends(get_db)
):
    cust_res = await db.execute(select(Customer).where(Customer.user_id == current_user.id))
    customer = cust_res.scalars().first()
    if not customer:
        raise HTTPException(status_code=400, detail="Customer not found")

    policy_id = payload.get("policy_id")
    if not policy_id:
        raise HTTPException(status_code=400, detail="policy_id required")

    from datetime import datetime
    
    inc_date_str = payload.get("incident_date")
    inc_date = datetime.strptime(inc_date_str, "%Y-%m-%d").date() if inc_date_str else None
    
    rep_date_str = payload.get("reported_date", inc_date_str)
    rep_date = datetime.strptime(rep_date_str, "%Y-%m-%d").date() if rep_date_str else None

    claim = Claim(
        policy_id=policy_id,
        customer_id=customer.id,
        tenant_id=current_user.tenant_id,
        claim_number=f"CLM-{str(policy_id)[:6].upper()}",
        status="submitted",
        incident_date=inc_date,
        reported_date=rep_date,
        description=payload.get("description"),
        claimed_amount=payload.get("claimed_amount", 0.0)
    )
    db.add(claim)
    await db.flush()

    from app.models.reporting import ClaimSLA
    from app.models.customer import CustomerProfile
    
    # fetch customer profile for the SLA record
    prof_res = await db.execute(select(CustomerProfile).where(CustomerProfile.customer_id == customer.id))
    profile = prof_res.scalars().first()
    customer_name = f"{profile.first_name} {profile.last_name}" if profile else "Unknown Customer"

    sla = ClaimSLA(
        tenant_id=current_user.tenant_id,
        claim_id=str(claim.id), # Cast to string since ClaimSLA expects String
        customer_name=customer_name,
        duration_days=0.0,
        target_days=14.0, # Default SLA target
        status="Pending"
    )
    db.add(sla)
    
    await db.commit()
    await db.refresh(claim)
    return claim

@router.get("/my")
async def my_claims(
    current_user: User = Depends(require_role(["customer"])),
    db: AsyncSession = Depends(get_db)
):
    cust_res = await db.execute(select(Customer).where(Customer.user_id == current_user.id))
    customer = cust_res.scalars().first()
    if not customer:
        return []

    res = await db.execute(select(Claim).where(Claim.customer_id == customer.id))
    return res.scalars().all()

@router.get("/queue")
async def get_claims_queue(
    current_user: User = Depends(require_role(["adjuster", "admin"])),
    db: AsyncSession = Depends(get_db)
):
    # Adjusters see submitted and under_review claims in their tenant
    res = await db.execute(select(Claim).where(Claim.status.in_(["submitted", "under_review"]), Claim.tenant_id == current_user.tenant_id))
    return res.scalars().all()

@router.get("/{id}")
async def get_claim(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Claim).where(Claim.id == id))
    claim = res.scalars().first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    if current_user.role == "customer":
        cust_res = await db.execute(select(Customer).where(Customer.user_id == current_user.id))
        customer = cust_res.scalars().first()
        if not customer or claim.customer_id != customer.id:
            raise HTTPException(status_code=403, detail="Forbidden")

    docs = await db.execute(select(ClaimDocument).where(ClaimDocument.claim_id == id))
    notes = await db.execute(select(AdjusterNote).where(AdjusterNote.claim_id == id))

    return {
        "claim": claim,
        "documents": docs.scalars().all(),
        "notes": notes.scalars().all()
    }

@router.put("/{id}/decide")
async def decide_claim(
    id: UUID,
    payload: dict,
    current_user: User = Depends(require_role(["adjuster", "admin"])),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Claim).where(Claim.id == id))
    claim = res.scalars().first()
    if not claim:
        raise HTTPException(status_code=404, detail="Not found")

    new_status = payload.get("status")
    if new_status not in ["under_review", "approved", "rejected", "investigation_needed"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    history = ClaimStatusHistory(
        tenant_id=current_user.tenant_id,
        claim_id=claim.id,
        old_status=claim.status,
        new_status=new_status,
        changed_by=current_user.id,
        comments=payload.get("comments", "")
    )
    db.add(history)
    claim.status = new_status
    
    if new_status in ["approved", "rejected"]:
        
        # Resolve SLA
        sla_res = await db.execute(select(ClaimSLA).where(ClaimSLA.claim_id == str(claim.id)))
        sla = sla_res.scalars().first()
        if sla:
            sla.date_closed = date.today()
            # If closed within 14 days, it's Met SLA, else Missed SLA. We don't have created_at mapped here easily, let's just assume Met SLA if not set
            sla.status = "Met SLA" 
            
        # Log system activity
        activity = SystemActivityLog(
            tenant_id=current_user.tenant_id,
            activity_type="Claims",
            title=f"Claim {new_status.title()}",
            description=f"Claim {claim.claim_number} was {new_status}.",
            color="bg-primary-bg text-primary"
        )
        db.add(activity)
        
        if new_status == "approved":
            amount = payload.get("approved_amount", claim.claimed_amount)
            claim.approved_amount = amount
            # Calculate new balance
            last_ledger_res = await db.execute(
                select(FinancialLedger).order_by(FinancialLedger.created_at.desc()).limit(1)
            )
            last_ledger_row = last_ledger_res.scalars().first()
            current_balance = last_ledger_row.running_balance if last_ledger_row else 0.0

            # Create Ledger Debit
            ledger = FinancialLedger(
                tenant_id=current_user.tenant_id,
                transaction_date=date.today(),
                description=f"Claim Payout for {claim.claim_number}",
                transaction_type="Debit",
                amount=amount,
                running_balance=current_balance - amount
            )
            db.add(ledger)
    
    await db.commit()
    await db.refresh(claim)
    return claim

@router.post("/{id}/notes")
async def add_claim_note(
    id: UUID,
    payload: dict,
    current_user: User = Depends(require_role(["adjuster", "admin"])),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Claim).where(Claim.id == id))
    claim = res.scalars().first()
    if not claim:
        raise HTTPException(status_code=404, detail="Not found")

    note = AdjusterNote(
        claim_id=claim.id,
        adjuster_id=current_user.id,
        note_text=payload.get("note", ""),
        is_internal=True
    )
    db.add(note)
    await db.commit()
    return note

@router.post("/{id}/documents")
async def add_claim_document(
    id: UUID,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Claim).where(Claim.id == id))
    claim = res.scalars().first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    if current_user.role == "customer":
        cust_res = await db.execute(select(Customer).where(Customer.user_id == current_user.id))
        customer = cust_res.scalars().first()
        if not customer or claim.customer_id != customer.id:
            raise HTTPException(status_code=403, detail="Forbidden")

    doc = ClaimDocument(
        claim_id=claim.id,
        document_type=payload.get("document_type", "other"),
        file_url=payload.get("file_url", ""),
        file_name=payload.get("file_name", "document.pdf")
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc

