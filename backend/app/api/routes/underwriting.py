from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID
from datetime import date, timedelta
import random

from app.core.database import get_db
from app.api.deps import get_current_user, require_role
from app.models.user import User
from app.models.policy import Application, ApplicationStatusHistory, Policy

router = APIRouter(prefix="/underwriting", tags=["underwriting"])

@router.get("/queue")
async def get_queue(
    current_user: User = Depends(require_role(["underwriter", "admin"])),
    db: AsyncSession = Depends(get_db)
):
    # Fetch pending applications for the tenant
    res = await db.execute(select(Application).where(Application.status.in_(["submitted", "under_review"]), Application.tenant_id == current_user.tenant_id))
    return res.scalars().all()

@router.get("/history")
async def get_history(
    current_user: User = Depends(require_role(["underwriter", "admin"])),
    db: AsyncSession = Depends(get_db)
):
    # Fetch processed applications for the tenant
    res = await db.execute(select(Application).where(Application.status.in_(["approved", "rejected", "referred"]), Application.tenant_id == current_user.tenant_id).order_by(Application.updated_at.desc()))
    return res.scalars().all()

@router.put("/applications/{id}/decide")
async def decide_application(
    id: UUID,
    payload: dict,
    current_user: User = Depends(require_role(["underwriter", "admin"])),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Application).where(Application.id == id))
    app = res.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Not found")

    new_status = payload.get("status")
    if new_status not in ["under_review", "approved", "rejected", "referred"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    # Enforce state machine
    if app.status == "approved" or app.status == "rejected":
        raise HTTPException(status_code=400, detail="Application is already closed")

    history = ApplicationStatusHistory(
        application_id=app.id,
        old_status=app.status,
        new_status=new_status,
        changed_by=current_user.id,
        comments=payload.get("comments", ""),
        tenant_id=current_user.tenant_id
    )
    db.add(history)
    
    app.status = new_status
    
    # Auto-issue policy if approved
    if new_status == "approved":
        start = date.today()
        end = start.replace(year=start.year + 1)
        policy_num = f"POL-{random.randint(100000, 999999)}"
        
        policy = Policy(
            application_id=app.id,
            customer_id=app.customer_id,
            policy_type_id=app.policy_type_id,
            policy_number=policy_num,
            start_date=start,
            end_date=end,
            total_premium=app.quoted_premium or 1200.0,
            tenant_id=current_user.tenant_id
        )
        db.add(policy)

    await db.commit()
    await db.refresh(app)
    
    return {"status": app.status, "message": "Decision recorded"}
