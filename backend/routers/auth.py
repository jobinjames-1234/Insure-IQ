from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from .. import models, schemas, auth, database
from jose import JWTError, jwt

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(
            email=email,
            role=payload.get("role"),
            tenant_id=payload.get("tenant_id")
        )
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # If the user belongs to a tenant, ensure the tenant is active
    if user.tenant_id:
        tenant = db.query(models.Tenant).filter(models.Tenant.id == user.tenant_id).first()
        if not tenant or tenant.status != models.TenantStatus.active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tenant account is inactive or disabled",
            )

    # Ensure the user account is not suspended
    if getattr(user, "status", None) == models.UserStatus.suspended:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account has been suspended by tenant administrator",
        )


    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Store email as subject, and custom claims
    token_data = {
        "sub": user.email,
        "role": user.role.value,
        "tenant_id": user.tenant_id
    }
    
    access_token = auth.create_access_token(
        data=token_data, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

from ..audit import log_audit_event

@router.get("/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=schemas.Token)
def update_user_me(user_update: schemas.UserUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    email_changed = False
    if user_update.email != current_user.email:
        existing_user = db.query(models.User).filter(models.User.email == user_update.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = user_update.email
        email_changed = True

    if user_update.name is not None:
        current_user.name = user_update.name.strip() if user_update.name else None

    if "profile_photo" in user_update.model_fields_set:
        current_user.profile_photo = user_update.profile_photo or None

    db.commit()
    db.refresh(current_user)

    if current_user.tenant_id:
        log_audit_event(
            db=db,
            tenant_id=current_user.tenant_id,
            actor=current_user,
            category="user_profile",
            action="updated",
            outcome="success",
            entity_type="user",
            entity_id=str(current_user.id),
            entity_name=current_user.email,
            summary=f"User {current_user.email} updated their profile details",
            notes="Profile information updated via Profile Management.",
            details={"email_changed": email_changed, "has_photo": bool(current_user.profile_photo)}
        )

    # Return a new token since the email (which is the subject in the token) might have changed
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    token_data = {
        "sub": current_user.email,
        "role": current_user.role.value,
        "tenant_id": current_user.tenant_id
    }
    access_token = auth.create_access_token(
        data=token_data, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.put("/me/password")
def update_password_me(password_update: schemas.PasswordUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    # Verify current password
    if not auth.verify_password(password_update.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    # Update to new password
    current_user.hashed_password = auth.get_password_hash(password_update.new_password)
    db.commit()

    if current_user.tenant_id:
        log_audit_event(
            db=db,
            tenant_id=current_user.tenant_id,
            actor=current_user,
            category="user_profile",
            action="password_changed",
            outcome="success",
            entity_type="user",
            entity_id=str(current_user.id),
            entity_name=current_user.email,
            summary=f"User {current_user.email} changed their password",
            notes="Password security credentials refreshed via Profile Management.",
            details={"user_id": current_user.id}
        )
    
    return {"message": "Password updated successfully"}

@router.post("/tenant-forgot-password")
def tenant_forgot_password(
    payload: schemas.ForgotPasswordRequest,
    db: Session = Depends(database.get_db)
):
    # Find user by email and tenant_id
    user = db.query(models.User).filter(
        models.User.email == payload.email,
        models.User.tenant_id == payload.tenant_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No account with email '{payload.email}' exists in this workspace"
        )

    # Derive clean name representation: <admin name>_123456789
    raw_name = user.name or user.email.split("@")[0]
    clean_name = "".join(c for c in raw_name.lower() if c.isalnum()) or "admin"
    reset_pwd = f"{clean_name}_123456789"

    user.hashed_password = auth.get_password_hash(reset_pwd)
    db.commit()

    # Audit log
    if user.tenant_id:
        log_audit_event(
            db=db,
            tenant_id=user.tenant_id,
            actor=user,
            category="auth",
            action="forgot_password_reset",
            outcome="warning",
            entity_type="user",
            entity_id=str(user.id),
            entity_name=user.email,
            summary=f"Password reset initiated via workspace login for {user.email}",
            notes=f"Password temporarily set to '{reset_pwd}'. Mandatory reset in Profile Management recommended.",
            details={"reset_account": user.email, "role": user.role.value if hasattr(user.role, 'value') else str(user.role)}
        )

    return {
        "message": "Password has been reset and autofilled. You can now sign in and update your password in Profile Management.",
        "temporary_password": reset_pwd
    }


@router.post("/superadmin-forgot-password")
def superadmin_forgot_password(
    payload: schemas.SuperAdminForgotPasswordRequest,
    db: Session = Depends(database.get_db)
):
    """
    Super-Admin forgot password recovery endpoint.
    Verifies user has super_admin role and tenant_id is None.
    Sets a safe temporary password and returns instructions for login and immediate profile update.
    """
    user = db.query(models.User).filter(
        models.User.email == payload.email,
        models.User.role == models.Role.super_admin,
        models.User.tenant_id.is_(None)
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No Super-Admin account with email '{payload.email}' exists"
        )

    raw_name = user.name or user.email.split("@")[0]
    clean_name = "".join(c for c in raw_name.lower() if c.isalnum()) or "superadmin"
    reset_pwd = f"{clean_name}_admin123456"

    user.hashed_password = auth.get_password_hash(reset_pwd)
    db.commit()

    return {
        "message": "Super-Admin credentials have been temporarily reset and autofilled. Sign in and update your password in Profile immediately.",
        "temporary_password": reset_pwd
    }


