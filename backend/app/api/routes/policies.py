from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID

from app.core.database import get_db
from app.api.deps import get_current_user, require_role
from app.models.user import User
from app.models.customer import Customer
from app.models.policy import Policy

router = APIRouter(prefix="/policies", tags=["policies"])

@router.get("/my")
async def get_my_policies(
    current_user: User = Depends(require_role(["customer"])),
    db: AsyncSession = Depends(get_db)
):
    cust_res = await db.execute(select(Customer).where(Customer.user_id == current_user.id))
    customer = cust_res.scalars().first()
    if not customer:
        return []

    res = await db.execute(select(Policy).where(Policy.customer_id == customer.id))
    return res.scalars().all()

@router.get("/all")
async def get_all_policies(
    current_user: User = Depends(require_role(["admin", "superadmin"])),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Policy).where(Policy.tenant_id == current_user.tenant_id))
    return res.scalars().all()

@router.get("/{id}")
async def get_policy(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Policy).where(Policy.id == id))
    policy = res.scalars().first()
    if not policy:
        raise HTTPException(status_code=404, detail="Not found")
        
    if current_user.role == "customer":
        cust_res = await db.execute(select(Customer).where(Customer.user_id == current_user.id))
        customer = cust_res.scalars().first()
        if not customer or policy.customer_id != customer.id:
            raise HTTPException(status_code=403, detail="Forbidden")

    return policy
