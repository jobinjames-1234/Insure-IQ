from sqlalchemy import Column, Integer, String, Enum, DateTime
from sqlalchemy.sql import func
from .database import Base
import enum

class IsolationMode(str, enum.Enum):
    shared = "shared"
    dedicated = "dedicated"

class TenantStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"

class Role(str, enum.Enum):
    super_admin = "super_admin"
    tenant_admin = "tenant_admin"
    underwriter = "underwriter"
    adjuster = "adjuster"
    agent = "agent"
    end_customer = "end_customer"

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    subdomain = Column(String, unique=True, index=True, nullable=False)
    isolation_mode = Column(Enum(IsolationMode), default=IsolationMode.shared, nullable=False)
    plan_tier = Column(String, nullable=False)
    status = Column(Enum(TenantStatus), default=TenantStatus.active, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now(), nullable=False)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, nullable=True, index=True) # Null for super-admin
    role = Column(Enum(Role), nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
