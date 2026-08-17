from pydantic import BaseModel, EmailStr
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    is_active: bool = True
    is_verified: bool = False

class UserCreate(UserBase):
    password: str
    first_name: str
    last_name: str
    tenant_id: Optional[UUID] = None

class UserProfileResponse(BaseModel):
    first_name: str
    last_name: str
    avatar_url: Optional[str] = None

class UserResponse(UserBase):
    id: UUID
    tenant_id: Optional[UUID]
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserMeResponse(BaseModel):
    user: UserResponse
    profile: Optional[UserProfileResponse]
    role: str
