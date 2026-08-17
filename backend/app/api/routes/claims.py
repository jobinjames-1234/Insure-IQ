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

    claim = Claim(
        policy_id=policy_id,
        customer_id=customer.id,
        claim_number=f"CLM-{str(policy_id)[:6].upper()}",
        status="submitted",
        incident_date=payload.get("incident_date"),
        reported_date=payload.get("reported_date", payload.get("incident_date")),
        description=payload.get("description"),
        claimed_amount=payload.get("claimed_amount", 0.0)
    )
    db.add(claim)
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
    # Adjusters see submitted and under_review claims
    res = await db.execute(select(Claim).where(Claim.status.in_(["submitted", "under_review"])))
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
        claim_id=claim.id,
        old_status=claim.status,
        new_status=new_status,
        changed_by=current_user.id,
        comments=payload.get("comments", "")
    )
    db.add(history)
    claim.status = new_status
    
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
