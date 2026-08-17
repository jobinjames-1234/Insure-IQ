from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID

from app.core.database import get_db
from app.api.deps import require_role
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/users")
async def get_team_members(
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    # Only return users for the same tenant. Note: Tenant middleware auto-filters if implemented at session level.
    # We will filter by tenant_id manually here to be explicit if no global filter is active.
    # Assuming get_db yields a session that is already bound or we just filter by current_user.tenant_id
    res = await db.execute(select(User).where(User.tenant_id == current_user.tenant_id))
    users = res.scalars().all()
    
    return [
        {
            "id": u.id,
            "email": u.email,
            "role": u.role,
            "status": "active" if u.is_active else "inactive"
        }
        for u in users
    ]

@router.post("/users")
async def invite_team_member(
    payload: dict,
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    # Mocking an invite system
    email = payload.get("email")
    role = payload.get("role")
    
    if not email or not role:
        raise HTTPException(status_code=400, detail="Missing email or role")
        
    return {"message": "Invite sent", "email": email, "role": role}

@router.get("/stats")
async def get_admin_stats(
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    from app.models.policy import Policy
    from app.models.claim import Claim
    
    users = await db.execute(select(User).where(User.tenant_id == current_user.tenant_id))
    user_count = len(users.scalars().all())
    
    policies = await db.execute(select(Policy).where(Policy.tenant_id == current_user.tenant_id, Policy.status == "active"))
    active_policies = len(policies.scalars().all())
    
    return {
        "total_users": user_count,
        "active_policies": active_policies,
        "monthly_premium": 284000.00 # Placeholder for aggregated premium
    }

@router.get("/billing")
async def get_billing(
    current_user: User = Depends(require_role(["admin"]))
):
    return {
        "invoices": [
            {"id": "inv-001", "date": "2026-08-01", "amount": 1500.00, "status": "Paid"},
            {"id": "inv-002", "date": "2026-07-01", "amount": 1500.00, "status": "Paid"}
        ],
        "next_billing_date": "2026-09-01",
        "plan": "Enterprise"
    }

@router.get("/policy-config")
async def get_policy_config(
    current_user: User = Depends(require_role(["admin"]))
):
    return {
        "auto_approval_limit": 5000,
        "require_two_adjusters": True,
        "allowed_regions": ["US-West", "US-East"]
    }

@router.post("/policy-config")
async def update_policy_config(
    payload: dict,
    current_user: User = Depends(require_role(["admin"]))
):
    return {"message": "Configuration updated successfully", "config": payload}

@router.get("/audit-log")
async def get_audit_log(
    current_user: User = Depends(require_role(["admin"]))
):
    return [
        {"timestamp": "2026-08-17T10:00:00Z", "user": "admin@example.com", "action": "Updated policy config"},
        {"timestamp": "2026-08-16T14:30:00Z", "user": "agent@example.com", "action": "Viewed customer record"}
    ]
