from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID

from app.core.database import get_db
from app.api.deps import require_role
from app.models.core import Tenant
from app.models.user import User

router = APIRouter(prefix="/console", tags=["console"])

@router.get("/stats")
async def get_console_stats(
    current_user: User = Depends(require_role(["superadmin"])),
    db: AsyncSession = Depends(get_db)
):
    tenants = await db.execute(select(Tenant))
    tenant_count = len(tenants.scalars().all())
    
    users = await db.execute(select(User))
    user_count = len(users.scalars().all())
    
    return {
        "active_tenants": tenant_count,
        "total_platform_users": user_count,
        "platform_revenue": 1450000.00
    }

@router.get("/tenants")
async def get_tenants(
    current_user: User = Depends(require_role(["superadmin"])),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Tenant))
    return res.scalars().all()

@router.post("/tenants")
async def provision_tenant(
    payload: dict,
    current_user: User = Depends(require_role(["superadmin"])),
    db: AsyncSession = Depends(get_db)
):
    name = payload.get("name")
    slug = payload.get("slug")
    if not name or not slug:
        raise HTTPException(status_code=400, detail="Missing name or slug")
        
    tenant = Tenant(
        name=name,
        slug=slug,
        is_active=True
    )
    db.add(tenant)
    await db.commit()
    await db.refresh(tenant)
    return tenant

@router.get("/health")
async def get_console_health(
    current_user: User = Depends(require_role(["superadmin"]))
):
    return {"status": "ok", "version": "1.0.0"}

@router.get("/tenants/{id}")
async def get_tenant_detail(
    id: UUID,
    current_user: User = Depends(require_role(["superadmin"])),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Tenant).where(Tenant.id == id))
    tenant = res.scalars().first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant
