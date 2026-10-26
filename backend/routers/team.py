from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from .. import models, schemas, database, auth
from ..audit import log_audit_event
from .auth import get_current_user

router = APIRouter(prefix="/team", tags=["team"])

ALLOWED_STAFF_ROLES = [
    models.Role.tenant_admin,
    models.Role.underwriter,
    models.Role.adjuster,
    models.Role.agent,
    models.Role.end_customer
]

def verify_tenant_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.Role.tenant_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Tenant Administrators can manage team members"
        )
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any tenant organization"
        )
    return current_user

@router.get("/", response_model=list[schemas.User])
def list_team_members(
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(verify_tenant_admin)
):
    users = db.query(models.User).filter(
        models.User.tenant_id == admin.tenant_id
    ).order_by(models.User.id.asc()).all()
    return users

@router.post("/invite", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def invite_team_member(
    invite: schemas.TeamMemberInvite,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(verify_tenant_admin)
):
    # Verify role is an allowed tenant staff role
    if invite.role not in ALLOWED_STAFF_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid staff role. Allowed roles: {[r.value for r in ALLOWED_STAFF_ROLES]}"
        )

    # Check if email is already taken
    existing_user = db.query(models.User).filter(models.User.email == invite.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address is already registered in the system"
        )

    new_user = models.User(
        email=invite.email,
        name=invite.name.strip() if invite.name else None,
        role=invite.role,
        tenant_id=admin.tenant_id,
        status=models.UserStatus.active,
        hashed_password=auth.get_password_hash(invite.temporary_password),
        created_at=datetime.utcnow()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Audit log
    role_str = invite.role.value if hasattr(invite.role, "value") else str(invite.role)
    log_audit_event(
        db=db,
        tenant_id=admin.tenant_id,
        actor=admin,
        category="team_management",
        action="invited",
        outcome="success",
        entity_type="user",
        entity_id=str(new_user.id),
        entity_name=new_user.email,
        summary=f"Invited team member {new_user.email} as {role_str.replace('_', ' ').title()}",
        notes=f"User invited with temporary credentials and role '{role_str}'.",
        details={"invited_role": role_str, "name": new_user.name}
    )

    return new_user

@router.put("/{user_id}/role", response_model=schemas.User)
def update_team_member_role(
    user_id: int,
    role_update: schemas.TeamMemberUpdateRole,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(verify_tenant_admin)
):
    target_user = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.tenant_id == admin.tenant_id
    ).first()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found in this organization"
        )

    if role_update.role not in ALLOWED_STAFF_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid staff role. Allowed roles: {[r.value for r in ALLOWED_STAFF_ROLES]}"
        )

    old_role = target_user.role.value if hasattr(target_user.role, "value") else str(target_user.role)
    new_role = role_update.role.value if hasattr(role_update.role, "value") else str(role_update.role)

    target_user.role = role_update.role
    db.commit()
    db.refresh(target_user)

    # Audit log
    log_audit_event(
        db=db,
        tenant_id=admin.tenant_id,
        actor=admin,
        category="team_management",
        action="role_changed",
        outcome="success",
        entity_type="user",
        entity_id=str(target_user.id),
        entity_name=target_user.email,
        summary=f"Changed role for {target_user.email} from {old_role} to {new_role}",
        notes=f"Administrative role change executed by {admin.email}.",
        details={"previous_role": old_role, "new_role": new_role}
    )

    return target_user

@router.post("/{user_id}/suspend")
def suspend_team_member(
    user_id: int,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(verify_tenant_admin)
):
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot suspend your own administrative account"
        )

    target_user = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.tenant_id == admin.tenant_id
    ).first()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found in this organization"
        )

    target_user.status = models.UserStatus.suspended
    db.commit()

    # Audit log
    log_audit_event(
        db=db,
        tenant_id=admin.tenant_id,
        actor=admin,
        category="team_management",
        action="suspended",
        outcome="warning",
        entity_type="user",
        entity_id=str(target_user.id),
        entity_name=target_user.email,
        summary=f"Suspended team member account: {target_user.email}",
        notes="Account access blocked; active sessions invalidated.",
        details={"previous_status": "active", "new_status": "suspended"}
    )

    return {"message": f"Team member {target_user.email} suspended successfully"}

@router.post("/{user_id}/reactivate")
def reactivate_team_member(
    user_id: int,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(verify_tenant_admin)
):
    target_user = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.tenant_id == admin.tenant_id
    ).first()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found in this organization"
        )

    target_user.status = models.UserStatus.active
    db.commit()

    # Audit log
    log_audit_event(
        db=db,
        tenant_id=admin.tenant_id,
        actor=admin,
        category="team_management",
        action="reactivated",
        outcome="success",
        entity_type="user",
        entity_id=str(target_user.id),
        entity_name=target_user.email,
        summary=f"Reactivated team member account: {target_user.email}",
        notes="Account access restored to active standing.",
        details={"previous_status": "suspended", "new_status": "active"}
    )

    return {"message": f"Team member {target_user.email} reactivated successfully"}

@router.put("/{user_id}/details", response_model=schemas.User)
def update_team_member_details(
    user_id: int,
    details: schemas.TeamMemberUpdateDetails,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(verify_tenant_admin)
):
    target_user = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.tenant_id == admin.tenant_id
    ).first()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found in this organization"
        )

    # Check email uniqueness if email changed
    if details.email != target_user.email:
        existing = db.query(models.User).filter(models.User.email == details.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists"
            )
        target_user.email = details.email

    target_user.name = details.name.strip() if details.name else None
    db.commit()
    db.refresh(target_user)

    # Audit log
    log_audit_event(
        db=db,
        tenant_id=admin.tenant_id,
        actor=admin,
        category="team_management",
        action="details_updated",
        outcome="success",
        entity_type="user",
        entity_id=str(target_user.id),
        entity_name=target_user.email,
        summary=f"Updated details for team member {target_user.email}",
        notes=f"Administrative profile update executed by {admin.email}.",
        details={"name": target_user.name, "email": target_user.email}
    )

    return target_user

@router.post("/{user_id}/reset-password")
def reset_team_member_password(
    user_id: int,
    reset_data: schemas.TeamMemberResetPassword,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(verify_tenant_admin)
):
    target_user = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.tenant_id == admin.tenant_id
    ).first()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found in this organization"
        )

    target_user.hashed_password = auth.get_password_hash(reset_data.new_password)
    db.commit()

    # Audit log
    log_audit_event(
        db=db,
        tenant_id=admin.tenant_id,
        actor=admin,
        category="team_management",
        action="password_reset_by_admin",
        outcome="warning",
        entity_type="user",
        entity_id=str(target_user.id),
        entity_name=target_user.email,
        summary=f"Administrator reset password for {target_user.email}",
        notes=f"New credentials provisioned by administrator {admin.email}.",
        details={"user_id": target_user.id}
    )

    return {"message": f"Password for {target_user.email} was reset successfully"}


