from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID

from app.core.database import get_db
from app.api.deps import get_current_user, require_role
from app.models.user import User
from app.models.customer import Customer
from app.models.policy import Policy
from app.models.ai_stubs import ChurnScore

router = APIRouter(prefix="/agent", tags=["agent"])

@router.get("/customers")
async def get_customers(
    current_user: User = Depends(require_role(["agent", "admin"])),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Customer).where(Customer.tenant_id == current_user.tenant_id))
    return res.scalars().all()

@router.get("/customers/{id}")
async def get_customer_detail(
    id: UUID,
    current_user: User = Depends(require_role(["agent", "admin"])),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Customer).where(Customer.id == id))
    customer = res.scalars().first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Fetch their policies
    pol_res = await db.execute(select(Policy).where(Policy.customer_id == id))
    policies = pol_res.scalars().all()

    return {
        "customer": customer,
        "policies": policies
    }

@router.get("/commission")
async def get_commission(
    current_user: User = Depends(require_role(["agent"])),
    db: AsyncSession = Depends(get_db)
):
    from app.models.billing import CommissionRecord
    from app.models.customer import CustomerProfile
    
    # Query Commission Records joined with Policy and CustomerProfile
    stmt = (
        select(CommissionRecord, Policy, CustomerProfile)
        .join(Policy, CommissionRecord.policy_id == Policy.id)
        .join(CustomerProfile, Policy.customer_id == CustomerProfile.customer_id)
        .where(CommissionRecord.agent_id == current_user.id)
    )
    result = await db.execute(stmt)
    rows = result.all()
    
    ledger = []
    mtd_commission = 0.0
    pending_commission = 0.0
    active_policies = 0
    ytd_commission = 0.0 # simplified for now
    
    for comm, pol, cust in rows:
        amount = comm.amount
        if comm.status == "pending":
            pending_commission += amount
        elif comm.status == "paid":
            mtd_commission += amount
            ytd_commission += amount
            
        if pol.status == "active":
            active_policies += 1
            
        ledger.append({
            "id": str(comm.id),
            "date": comm.calculation_date.strftime("%b %d, %Y") if comm.calculation_date else "",
            "policy_id": pol.policy_number,
            "customer": f"{cust.first_name} {cust.last_name}",
            "premium": pol.total_premium,
            "commission": amount,
            "status": comm.status.capitalize()
        })
        
    return {
        "mtd_commission": mtd_commission,
        "ytd_commission": ytd_commission,
        "active_policies": active_policies,
        "pending_commission": pending_commission,
        "ledger": ledger
    }

@router.get("/retention-alerts")
async def get_retention_alerts(
    current_user: User = Depends(require_role(["agent"])),
    db: AsyncSession = Depends(get_db)
):
    # Query high-risk churn customers
    stmt = (
        select(ChurnScore, Customer)
        .join(Customer, ChurnScore.customer_id == Customer.id)
        .where(ChurnScore.risk_level.in_(["High", "Medium"]))
        .order_by(ChurnScore.probability.desc())
        .limit(10)
    )
    res = await db.execute(stmt)
    results = res.all()
    
    alerts = []
    for score, customer in results:
        alerts.append({
            "customer_id": str(customer.id),
            "name": f"{customer.first_name} {customer.last_name}",
            "reason": f"AI Churn Risk ({score.probability*100:.0f}%)",
            "risk_level": score.risk_level,
            "factors": score.factors
        })
        
    return alerts

@router.post("/applications")
async def create_application(
    payload: dict,
    current_user: User = Depends(require_role(["agent"])),
    db: AsyncSession = Depends(get_db)
):
    from app.models.policy import Application
    
    app = Application(
        customer_id=payload["customer_id"],
        policy_type_id=payload["policy_type_id"],
        status="draft",
        application_data=payload.get("data", {}),
        tenant_id=current_user.tenant_id
    )
    db.add(app)
    await db.commit()
    await db.refresh(app)
    return app
