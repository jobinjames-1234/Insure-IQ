from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database
from ..audit import log_audit_event
from .auth import get_current_user
from .team import verify_tenant_admin

router = APIRouter(prefix="/policy-configs", tags=["policy-configs"])

def get_tenant_staff_user(current_user: models.User = Depends(get_current_user)):
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any tenant organization"
        )
    return current_user

def increment_version(current_version: str) -> str:
    try:
        clean = current_version.lstrip("v")
        parts = clean.split(".")
        if len(parts) == 2:
            major, minor = int(parts[0]), int(parts[1])
            return f"v{major}.{minor + 1}"
        elif len(parts) == 1:
            major = int(parts[0])
            return f"v{major}.1"
    except Exception:
        pass
    return f"{current_version}.1"

@router.get("/", response_model=List[schemas.PolicyConfig])
def list_policy_configs(
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_tenant_staff_user)
):
    """
    List all insurance product / policy configurations for the current tenant.
    """
    configs = db.query(models.PolicyConfig).filter(
        models.PolicyConfig.tenant_id == user.tenant_id
    ).order_by(models.PolicyConfig.id.asc()).all()
    return configs

@router.get("/{config_id}", response_model=schemas.PolicyConfig)
def get_policy_config(
    config_id: int,
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_tenant_staff_user)
):
    """
    Get a specific policy configuration by ID, verified for current tenant.
    """
    config = db.query(models.PolicyConfig).filter(
        models.PolicyConfig.id == config_id,
        models.PolicyConfig.tenant_id == user.tenant_id
    ).first()
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy configuration not found"
        )
    return config

@router.post("/", response_model=schemas.PolicyConfig, status_code=status.HTTP_201_CREATED)
def create_policy_config(
    config_in: schemas.PolicyConfigCreate,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(verify_tenant_admin)
):
    """
    Create a new product/policy configuration. Tenant Admin only.
    """
    # Check if a product with the exact same name already exists in this tenant
    existing = db.query(models.PolicyConfig).filter(
        models.PolicyConfig.tenant_id == admin.tenant_id,
        models.PolicyConfig.name.ilike(config_in.name)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A policy configuration with the name '{config_in.name}' already exists"
        )

    updater_identity = admin.name if admin.name else admin.email

    new_config = models.PolicyConfig(
        tenant_id=admin.tenant_id,
        product_type=config_in.product_type.lower(),
        name=config_in.name,
        description=config_in.description,
        status=config_in.status or models.PolicyConfigStatus.active,
        version="v1.0",
        last_updated_by=updater_identity,
        min_driver_age=config_in.min_driver_age,
        max_vehicle_age=config_in.max_vehicle_age,
        rules=config_in.rules or {},
        max_coverage_limit=config_in.max_coverage_limit,
        standard_deductible=config_in.standard_deductible,
        base_min_premium=config_in.base_min_premium,
        base_max_premium=config_in.base_max_premium,
        standard_min_premium=config_in.standard_min_premium,
        standard_max_premium=config_in.standard_max_premium,
        premium_min_premium=config_in.premium_min_premium,
        premium_max_premium=config_in.premium_max_premium,
        stp_limit=config_in.stp_limit,
        manual_review_threshold=config_in.manual_review_threshold,
        enable_auto_stp=config_in.enable_auto_stp
    )

    db.add(new_config)
    db.commit()
    db.refresh(new_config)

    # Audit log
    log_audit_event(
        db=db,
        tenant_id=admin.tenant_id,
        actor=admin,
        category="policy_config",
        action="created",
        outcome="success",
        entity_type="policy_config",
        entity_id=str(new_config.id),
        entity_name=new_config.name,
        summary=f"Created new product configuration: {new_config.name} ({new_config.product_type.upper()})",
        notes=f"Initial version v1.0 established with STP limit ${new_config.stp_limit:,.2f}.",
        details={
            "product_type": new_config.product_type,
            "version": new_config.version,
            "stp_limit": new_config.stp_limit,
            "manual_review_threshold": new_config.manual_review_threshold
        }
    )

    return new_config

@router.put("/{config_id}", response_model=schemas.PolicyConfig)
def update_policy_config(
    config_id: int,
    config_update: schemas.PolicyConfigUpdate,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(verify_tenant_admin)
):
    """
    Update rules, premium bands, or thresholds for a product. Automatically increments version.
    """
    config = db.query(models.PolicyConfig).filter(
        models.PolicyConfig.id == config_id,
        models.PolicyConfig.tenant_id == admin.tenant_id
    ).first()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy configuration not found"
        )

    # Check for name uniqueness if name is changed
    if config_update.name and config_update.name.lower() != config.name.lower():
        existing = db.query(models.PolicyConfig).filter(
            models.PolicyConfig.tenant_id == admin.tenant_id,
            models.PolicyConfig.name.ilike(config_update.name),
            models.PolicyConfig.id != config_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Another policy configuration with the name '{config_update.name}' already exists"
            )

    old_version = config.version
    update_data = config_update.dict(exclude_unset=True)

    for field, value in update_data.items():
        setattr(config, field, value)

    # Bump version and record modifier
    config.version = increment_version(config.version)
    config.last_updated_by = admin.name if admin.name else admin.email

    db.commit()
    db.refresh(config)

    # Audit log
    log_audit_event(
        db=db,
        tenant_id=admin.tenant_id,
        actor=admin,
        category="policy_config",
        action="updated",
        outcome="success",
        entity_type="policy_config",
        entity_id=str(config.id),
        entity_name=config.name,
        summary=f"Updated product rules for {config.name} ({old_version} → {config.version})",
        notes=f"Updated underwriting rules and thresholds by {admin.email}.",
        details={
            "previous_version": old_version,
            "new_version": config.version,
            "fields_modified": list(update_data.keys()),
            "stp_limit": config.stp_limit,
            "manual_review_threshold": config.manual_review_threshold
        }
    )

    return config

@router.delete("/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_policy_config(
    config_id: int,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(verify_tenant_admin)
):
    """
    Delete or archive a policy configuration.
    """
    config = db.query(models.PolicyConfig).filter(
        models.PolicyConfig.id == config_id,
        models.PolicyConfig.tenant_id == admin.tenant_id
    ).first()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy configuration not found"
        )

    deleted_name = config.name
    deleted_id = config.id
    db.delete(config)
    db.commit()

    # Audit log
    log_audit_event(
        db=db,
        tenant_id=admin.tenant_id,
        actor=admin,
        category="policy_config",
        action="deleted",
        outcome="warning",
        entity_type="policy_config",
        entity_id=str(deleted_id),
        entity_name=deleted_name,
        summary=f"Deleted product configuration: {deleted_name}",
        notes="Product configuration retired and purged from catalog.",
        details={"deleted_id": deleted_id, "product_name": deleted_name}
    )

    return None

