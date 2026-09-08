"""
Notification Service — In-app notification delivery.

Per user decision: email is stubbed; notifications are in-app only for now.
"""
from __future__ import annotations
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.core.database import Base
from app.models.mixins import TenantMixin


class Notification(Base, TenantMixin):
    """In-app notification for a user."""
    __tablename__ = "notifications"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PGUUID(as_uuid=True), nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    category = Column(String, default="info")  # info, warning, success, error
    link = Column(String, nullable=True)  # e.g. "/portal/claims" — for click-through
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


async def send_notification(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    tenant_id: Optional[uuid.UUID],
    title: str,
    message: str,
    category: str = "info",
    link: Optional[str] = None,
) -> Notification:
    """Create an in-app notification for a user."""
    notif = Notification(
        user_id=user_id,
        tenant_id=tenant_id,
        title=title,
        message=message,
        category=category,
        link=link,
    )
    db.add(notif)
    return notif


async def send_email_stub(
    to_email: str,
    subject: str,
    body: str,
) -> None:
    """
    Stub for email delivery. Logs the intent but does not send.
    Replace with real SMTP/SES integration later.
    """
    import logging
    logger = logging.getLogger("notifications")
    logger.info(f"[EMAIL STUB] To: {to_email} | Subject: {subject} | Body length: {len(body)}")
