from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import models, schemas, database, auth
from .auth import get_current_user

router = APIRouter(prefix="/tenants", tags=["tenants"])

@router.get("/check-subdomain")
def check_subdomain(subdomain: str, exclude_tenant_id: int = None, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.Role.super_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    query = db.query(models.Tenant).filter(models.Tenant.subdomain == subdomain)
    if exclude_tenant_id is not None:
        query = query.filter(models.Tenant.id != exclude_tenant_id)
    exists = query.first() is not None
    return {"available": not exists}

@router.post("/", response_model=schemas.Tenant)
def create_tenant(tenant: schemas.TenantCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    # Only super admin can create tenants
    if current_user.role != models.Role.super_admin:
        raise HTTPException(status_code=403, detail="Not authorized to create tenants")
        
    db_tenant = db.query(models.Tenant).filter(models.Tenant.subdomain == tenant.subdomain).first()
    if db_tenant:
        raise HTTPException(status_code=400, detail="Subdomain already registered")

    new_tenant = models.Tenant(
        name=tenant.name,
        subdomain=tenant.subdomain,
        isolation_mode=tenant.isolation_mode,
        plan_tier=tenant.plan_tier,
        status=models.TenantStatus.active
    )
    db.add(new_tenant)
    db.commit()
    db.refresh(new_tenant)

    # Create the initial tenant admin user
    hashed_password = auth.get_password_hash(tenant.admin_password)
    admin_user = models.User(
        email=tenant.admin_email,
        hashed_password=hashed_password,
        role=models.Role.tenant_admin,
        tenant_id=new_tenant.id
    )
    db.add(admin_user)
    db.commit()

    return new_tenant

@router.get("/", response_model=list[schemas.Tenant])
def list_tenants(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.Role.super_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    tenants = db.query(models.Tenant).offset(skip).limit(limit).all()
    return tenants

@router.get("/by-subdomain/{subdomain}")
def get_tenant_by_subdomain(subdomain: str, db: Session = Depends(database.get_db)):
    # Public endpoint to get tenant status for the frontend portal routing
    tenant = db.query(models.Tenant).filter(models.Tenant.subdomain == subdomain).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return {
        "id": tenant.id,
        "name": tenant.name,
        "subdomain": tenant.subdomain,
        "plan_tier": tenant.plan_tier,
        "status": tenant.status
    }

@router.get("/me", response_model=schemas.Tenant)
def get_my_tenant(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="User is not associated with any tenant")
    tenant = db.query(models.Tenant).filter(models.Tenant.id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant


@router.get("/{tenant_id}", response_model=schemas.Tenant)
def get_tenant(tenant_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.Role.super_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    tenant = db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant

@router.put("/{tenant_id}", response_model=schemas.Tenant)
def update_tenant(tenant_id: int, tenant_update: schemas.TenantUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.Role.super_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    tenant = db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    if tenant_update.subdomain and tenant_update.subdomain != tenant.subdomain:
        existing = db.query(models.Tenant).filter(models.Tenant.subdomain == tenant_update.subdomain).first()
        if existing:
            raise HTTPException(status_code=400, detail="Subdomain already registered")

    update_data = tenant_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(tenant, key, value)
        
    db.commit()
    db.refresh(tenant)
    return tenant

@router.delete("/{tenant_id}")
def deactivate_tenant(tenant_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.Role.super_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    tenant = db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    tenant.status = models.TenantStatus.inactive
    db.commit()
    return {"message": "Tenant deactivated successfully"}

@router.post("/{tenant_id}/reactivate")
def reactivate_tenant(tenant_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.Role.super_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    tenant = db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
        
    tenant.status = models.TenantStatus.active
    db.commit()
    return {"message": "Tenant reactivated successfully"}

