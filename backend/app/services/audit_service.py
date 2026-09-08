"""
Audit Service — Records important business and security events.

Every major state change, CRUD operation on sensitive entities, and
security event should flow through this service.
"""
from __future__ import annotations
import uuid
from datetime import datetime
from typing import Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import Column, String, DateTime, JSON, text
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.core.database import Base
from app.models.mixins import TenantMixin


class AuditEvent(Base, TenantMixin):
    """Immutable audit trail table."""
    __tablename__ = "audit_events"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_id = Column(PGUUID(as_uuid=True), nullable=True)  # null for system events
    actor_email = Column(String, nullable=True)
    actor_role = Column(String, nullable=True)
    action = Column(String, nullable=False)  # e.g. "claim.status_changed"
    target_type = Column(String, nullable=True)  # e.g. "Claim"
    target_id = Column(String, nullable=True)  # UUID as string
    before_state = Column(JSON, nullable=True)
    after_state = Column(JSON, nullable=True)
    metadata_ = Column("metadata", JSON, nullable=True)  # renamed to avoid shadowing
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


async def record_event(
    db: AsyncSession,
    *,
    action: str,
    tenant_id: Optional[uuid.UUID] = None,
    actor_id: Optional[uuid.UUID] = None,
    actor_email: Optional[str] = None,
    actor_role: Optional[str] = None,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    before_state: Optional[dict] = None,
    after_state: Optional[dict] = None,
    metadata: Optional[dict] = None,
    ip_address: Optional[str] = None,
) -> AuditEvent:
    """
    Write an audit event to the database.

    This should be called inside the same transaction as the operation
    it audits, so that the audit record and the mutation succeed or fail
    together.
    """
    event = AuditEvent(
        tenant_id=tenant_id,
        actor_id=actor_id,
        actor_email=actor_email,
        actor_role=actor_role,
        action=action,
        target_type=target_type,
        target_id=str(target_id) if target_id else None,
        before_state=before_state,
        after_state=after_state,
        metadata_=metadata,
        ip_address=ip_address,
    )
    db.add(event)
    # We do NOT commit here — the caller owns the transaction boundary.
    return event
