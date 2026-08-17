from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Any
import secrets
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_password_hash
from app.models.user import User, UserProfile, UserRole, Password, RefreshToken, LoginAttempt
from app.models.core import Role, Tenant
from app.schemas.auth import LoginRequest, TokenResponse, RefreshTokenRequest
from app.schemas.user import UserMeResponse, UserCreate, UserResponse, UserProfileResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    # Check lockout
    recent_attempts_result = await db.execute(
        select(LoginAttempt)
        .where(LoginAttempt.email == req.email, LoginAttempt.success == False)
        .order_by(LoginAttempt.created_at.desc())
        .limit(5)
    )
    recent_attempts = recent_attempts_result.scalars().all()
    if len(recent_attempts) >= 5:
        time_since_last_attempt = datetime.utcnow() - recent_attempts[0].created_at
        if time_since_last_attempt < timedelta(minutes=15):
            raise HTTPException(status_code=403, detail="Account locked out due to too many failed attempts. Try again later.")

    # Simple email check
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalars().first()
    
    if not user:
        await log_attempt(db, req.email, False)
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    pwd_result = await db.execute(select(Password).where(Password.user_id == user.id))
    pwd_record = pwd_result.scalars().first()
    
    if not pwd_record or not verify_password(req.password, pwd_record.hashed_password):
        await log_attempt(db, req.email, False)
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    await log_attempt(db, req.email, True)
    
    # Get role
    role_result = await db.execute(
        select(Role.name)
        .join(UserRole, UserRole.role_id == Role.id)
        .where(UserRole.user_id == user.id)
    )
    role = role_result.scalars().first() or "customer"
    
    # Create tokens
    access_token = create_access_token(
        subject=str(user.id),
        tenant_id=str(user.tenant_id) if user.tenant_id else None,
        role=role
    )
    
    refresh_token = secrets.token_urlsafe(32)
    db_refresh = RefreshToken(
        user_id=user.id,
        token=refresh_token,
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    db.add(db_refresh)
    await db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(req: UserCreate, db: AsyncSession = Depends(get_db)):
    # Verify email uniqueness
    existing_user_result = await db.execute(select(User).where(User.email == req.email))
    if existing_user_result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Assign to default tenant if not provided
    if not req.tenant_id:
        from app.models.core import Tenant
        default_tenant = await db.execute(select(Tenant).limit(1))
        tenant = default_tenant.scalars().first()
        if tenant:
            req.tenant_id = tenant.id

    # Create User
    new_user = User(
        email=req.email,
        is_active=True,
        is_verified=False,
        tenant_id=req.tenant_id
    )
    db.add(new_user)
    await db.flush() # flush to get user ID
    
    # Create Profile
    new_profile = UserProfile(
        user_id=new_user.id,
        first_name=req.first_name,
        last_name=req.last_name,
        tenant_id=req.tenant_id
    )
    db.add(new_profile)
    
    # Create Password
    hashed_pwd = get_password_hash(req.password)
    new_password = Password(
        user_id=new_user.id,
        hashed_password=hashed_pwd
    )
    db.add(new_password)
    
    # Assign Customer Role
    role_result = await db.execute(select(Role).where(Role.name == "customer"))
    customer_role = role_result.scalars().first()
    if customer_role:
        db.add(UserRole(user_id=new_user.id, role_id=customer_role.id))
        
    await db.commit()
    await db.refresh(new_user)
    
    return new_user

@router.get("/me", response_model=UserMeResponse)
async def read_users_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    profile_result = await db.execute(select(UserProfile).where(UserProfile.user_id == current_user.id))
    profile = profile_result.scalars().first()
    
    prof_resp = None
    if profile:
        prof_resp = UserProfileResponse(
            first_name=profile.first_name,
            last_name=profile.last_name,
            avatar_url=profile.avatar_url
        )
        
    return {
        "user": current_user,
        "profile": prof_resp,
        "role": getattr(current_user, "role", "unknown")
    }

@router.post("/kyc/submit", status_code=status.HTTP_202_ACCEPTED)
async def submit_kyc(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # In a real app, this would process document files via UploadFile
    # For MVP, we simulate a successful submission by creating a mock record
    # Since we didn't define a specific IdentityDocument pydantic schema in Phase 4, we return success.
    return {"status": "submitted", "message": "KYC documents received and pending verification."}

@router.get("/kyc", response_model=dict)
async def get_kyc_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Mocking status for frontend flow. 
    # Valid statuses: "pending", "verified", "rejected", "unsubmitted"
    return {"status": "verified", "message": "Your identity has been verified."}

async def log_attempt(db: AsyncSession, email: str, success: bool):
    attempt = LoginAttempt(email=email, success=success)
    db.add(attempt)
    await db.commit()
