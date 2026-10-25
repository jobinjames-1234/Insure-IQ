from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from .models import Role, IsolationMode, TenantStatus

class UserBase(BaseModel):
    email: EmailStr
    role: Role
    tenant_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    email: EmailStr

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

class TenantBase(BaseModel):
    name: str
    subdomain: str = Field(..., pattern="^[a-z0-9-]+$")
    isolation_mode: IsolationMode
    plan_tier: str

class TenantCreate(TenantBase):
    admin_email: EmailStr
    admin_password: str

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    subdomain: Optional[str] = Field(None, pattern="^[a-z0-9-]+$")
    isolation_mode: Optional[IsolationMode] = None
    plan_tier: Optional[str] = None
    status: Optional[TenantStatus] = None

class Tenant(TenantBase):
    id: int
    status: TenantStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    tenant_id: Optional[int] = None
