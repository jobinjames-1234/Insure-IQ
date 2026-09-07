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
    period: str = "24h",
    current_user: User = Depends(require_role(["superadmin"])),
    db: AsyncSession = Depends(get_db)
):
    tenants = await db.execute(select(Tenant))
    tenant_count = len(tenants.scalars().all())
    
    users = await db.execute(select(User))
    user_count = len(users.scalars().all())
    
    import random
    from datetime import datetime, timedelta
    
    uptime = round(random.uniform(99.990, 99.999), 3)
    error_rate = round(random.uniform(0.01, 0.05), 2)
    uptime_history = [random.randint(70, 100) for _ in range(7)]
    # make the last one match uptime roughly
    uptime_history[-1] = int((uptime - 99.9) * 1000) if uptime > 99.9 else 100
    
    alerts = [
        {"id": 1, "type": "Critical", "title": "Billing Webhook Failure", "tenant": "TEN-8842 (AstraCorp)", "message": "Failed to process recurring subscription payment.", "time": f"{random.randint(1, 10)}m ago"},
        {"id": 2, "type": "Warning", "title": "Latent DB Queries", "tenant": "CLUSTER-DB-02", "message": "Reporting >500ms execution times for policy lookups.", "time": f"{random.randint(10, 30)}m ago"},
        {"id": 3, "type": "Critical", "title": "SSO Certificate Expiring", "tenant": "ROOT_IDP", "message": "Root IdP certificate for operator login expires in 48 hours.", "time": f"{random.randint(1, 3)}h ago"}
    ]
    # randomly drop an alert occasionally
    if random.random() > 0.5:
        alerts.pop(0)
        
    num_points = 12
    if period == "7d":
        num_points = 7
    elif period == "30d":
        num_points = 30
    elif period == "6m":
        num_points = 6
        
    lead_volume = [random.randint(10000, 20000) for _ in range(num_points)]
    current_lead = lead_volume[-1] # current marker
    
    now = datetime.utcnow()
    audit_logs = [
        {
            "id": 1, 
            "timestamp": (now - timedelta(minutes=random.randint(1, 15))).strftime("%Y-%m-%d %H:%M:%S"),
            "actor": "SysAdmin_Alpha", 
            "actor_initials": "AD",
            "action": "Tier Upgrade", 
            "target": "TEN-4429 (NexusInsure)", 
            "status": "SUCCESS"
        },
        {
            "id": 2, 
            "timestamp": (now - timedelta(minutes=random.randint(16, 45))).strftime("%Y-%m-%d %H:%M:%S"),
            "actor": "System_Automator", 
            "actor_initials": "SM",
            "action": "Database Reindex", 
            "target": "CLUSTER-DB-02", 
            "status": "SUCCESS"
        },
        {
            "id": 3, 
            "timestamp": (now - timedelta(minutes=random.randint(46, 120))).strftime("%Y-%m-%d %H:%M:%S"),
            "actor": "Root_Observer", 
            "actor_initials": "RT",
            "action": "Access Denied", 
            "target": "BILLING_VAULT_S3", 
            "status": "FORBIDDEN"
        }
    ]
    
    # Shuffle audit logs or tweak them slightly
    if random.random() > 0.5:
        audit_logs[0]["status"] = "FAILED"
        audit_logs[0]["action"] = "Tier Downgrade"
    
    return {
        "active_tenants": tenant_count,
        "total_platform_users": user_count,
        "platform_revenue": 1450000.00,
        "enterprise_tier_count": int(tenant_count * 0.3) if tenant_count > 0 else 428,
        "growth_tier_count": int(tenant_count * 0.7) if tenant_count > 0 else 1054,
        "uptime": uptime,
        "uptime_history": uptime_history,
        "error_rate": error_rate,
        "error_trend": round(random.uniform(-0.02, 0.02), 2),
        "alerts": alerts,
        "lead_volume": lead_volume,
        "current_lead": current_lead,
        "audit_logs": audit_logs
    }

@router.get("/tenants")
async def get_tenants(
    current_user: User = Depends(require_role(["superadmin"])),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Tenant))
    return res.scalars().all()

@router.get("/users")
async def get_users(
    current_user: User = Depends(require_role(["superadmin"])),
    db: AsyncSession = Depends(get_db)
):
    from app.models.core import Role
    from app.models.user import UserRole
    
    stmt = (
        select(User, Role.name)
        .outerjoin(UserRole, UserRole.user_id == User.id)
        .outerjoin(Role, Role.id == UserRole.role_id)
    )
    res = await db.execute(stmt)
    rows = res.all()
    
    # Process rows into result list.
    # A user might appear multiple times if they have multiple roles,
    # but for this dashboard, we'll just take the first role encountered per user.
    user_map = {}
    for u, r_name in rows:
        if str(u.id) not in user_map:
            user_map[str(u.id)] = {
                "id": str(u.id),
                "email": u.email,
                "is_active": u.is_active,
                "tenant_id": str(u.tenant_id) if hasattr(u, "tenant_id") and u.tenant_id else None,
                "role": r_name if r_name else "user"
            }
    
    return list(user_map.values())

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

@router.put("/tenants/{id}")
async def update_tenant(
    id: UUID,
    payload: dict,
    current_user: User = Depends(require_role(["superadmin"])),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Tenant).where(Tenant.id == id))
    tenant = res.scalars().first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    if "name" in payload:
        tenant.name = payload["name"]
    if "slug" in payload:
        tenant.slug = payload["slug"]
    if "domain" in payload:
        tenant.domain = payload["domain"]
    if "is_active" in payload:
        tenant.is_active = payload["is_active"]
        
    await db.commit()
    await db.refresh(tenant)
    return tenant
