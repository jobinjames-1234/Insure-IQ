from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.core import Tenant, TenantBranding

router = APIRouter(prefix="/tenants", tags=["tenants"])

@router.get("/branding")
async def get_tenant_branding(request: Request, db: AsyncSession = Depends(get_db)):
    # In a real SaaS, tenant is usually resolved via subdomain (e.g. abc.insureiq.app)
    # For MVP, we allow an optional header `x-tenant-slug` for easy testing, fallback to a default.
    tenant_slug = request.headers.get("x-tenant-slug", "abc")
    
    result = await db.execute(select(Tenant).where(Tenant.slug == tenant_slug))
    tenant = result.scalars().first()
    
    if not tenant:
        # Fallback to a generic platform branding if tenant is missing
        return {
            "name": "InsureIQ Platform",
            "logo_url": None,
            "primary_color": "#1A56FF"
        }
        
    branding_result = await db.execute(select(TenantBranding).where(TenantBranding.tenant_id == tenant.id))
    branding = branding_result.scalars().first()
    
    return {
        "name": tenant.name,
        "logo_url": branding.logo_url if branding else None,
        "primary_color": branding.primary_color if branding else "#1A56FF"
    }
