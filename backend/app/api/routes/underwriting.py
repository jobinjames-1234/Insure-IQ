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
    from app.models.customer import Customer, CustomerProfile
    from app.models.policy import PolicyType
    
    # Fetch pending applications for the tenant
    stmt = (
        select(Application, CustomerProfile.first_name, CustomerProfile.last_name, PolicyType.name.label("policy_name"))
        .join(Customer, Customer.id == Application.customer_id)
        .join(CustomerProfile, CustomerProfile.customer_id == Customer.id)
        .join(PolicyType, PolicyType.id == Application.policy_type_id)
        .where(Application.status.in_(["submitted", "under_review"]), Application.tenant_id == current_user.tenant_id)
    )
    res = await db.execute(stmt)
    
    results = []
    for row in res:
        app, fn, ln, pn = row
        results.append({
            "id": str(app.id),
            "name": f"{fn} {ln}",
            "policy": pn,
            "premium": f"${app.quoted_premium:,.2f}" if app.quoted_premium else "$0.00",
            "riskScore": app.application_data.get("risk_score", 50),
            "riskLevel": app.application_data.get("risk_level", "medium"),
            "status": "In Review" if app.status == "under_review" else "Queued",
            "customer_id": str(app.customer_id)
        })
    return results

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
        premium = app.quoted_premium or 1200.0
        
        policy = Policy(
            application_id=app.id,
            customer_id=app.customer_id,
            policy_type_id=app.policy_type_id,
            policy_number=policy_num,
            start_date=start,
            end_date=end,
            total_premium=premium,
            tenant_id=current_user.tenant_id
        )
        db.add(policy)

        from app.models.reporting import SystemActivityLog, FinancialLedger

        # Create System Activity Log
        activity = SystemActivityLog(
            tenant_id=current_user.tenant_id,
            activity_type="Underwriting",
            title="Underwriting Approval",
            description=f"Policy #{policy_num} was approved.",
            color="bg-success-bg text-success",
            icon_name="FactCheck"
        )
        db.add(activity)

        # Update Financial Ledger
        # Get latest balance
        last_ledger = await db.execute(select(FinancialLedger).where(FinancialLedger.tenant_id == current_user.tenant_id).order_by(FinancialLedger.created_at.desc()).limit(1))
        last_ledger_row = last_ledger.scalars().first()
        current_balance = last_ledger_row.running_balance if last_ledger_row else 0.0

        ledger = FinancialLedger(
            tenant_id=current_user.tenant_id,
            transaction_date=date.today(),
            description=f"Premium Payment for Policy #{policy_num}",
            transaction_type="Credit",
            amount=premium,
            running_balance=current_balance + premium
        )
        db.add(ledger)

    await db.commit()
    await db.refresh(app)
    
    return {"status": app.status, "message": "Decision recorded"}
