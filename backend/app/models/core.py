from sqlalchemy import Column, String, Boolean, JSON, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base
from app.models.mixins import TimestampMixin, TenantMixin

class Tenant(Base, TimestampMixin):
    __tablename__ = "tenants"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    domain = Column(String, unique=True, nullable=True)

class TenantBranding(Base, TimestampMixin, TenantMixin):
    __tablename__ = "tenant_branding"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    logo_url = Column(String, nullable=True)
    primary_color = Column(String, default="#1A56FF")
    favicon_url = Column(String, nullable=True)

class TenantSettings(Base, TimestampMixin, TenantMixin):
    __tablename__ = "tenant_settings"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    default_language = Column(String, default="en")
    timezone = Column(String, default="UTC")
    currency = Column(String, default="USD")
    config = Column(JSON, default=dict)

class TenantSubscriptionPlan(Base, TimestampMixin, TenantMixin):
    __tablename__ = "tenant_subscription_plans"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plan_id = Column(UUID(as_uuid=True), nullable=False) # FK to SubscriptionPlan (in billing)
    status = Column(String, default="active")

class TenantUsageCounter(Base, TimestampMixin, TenantMixin):
    __tablename__ = "tenant_usage_counters"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    metric_name = Column(String, nullable=False)
    current_value = Column(Integer, default=0)

class Role(Base, TimestampMixin):
    __tablename__ = "roles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)

class Permission(Base, TimestampMixin):
    __tablename__ = "permissions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)
    module = Column(String, nullable=False)

class RolePermission(Base):
    __tablename__ = "role_permissions"
    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id"), primary_key=True)
    permission_id = Column(UUID(as_uuid=True), ForeignKey("permissions.id"), primary_key=True)
