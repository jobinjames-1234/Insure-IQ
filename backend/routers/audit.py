from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from .. import models, schemas, database
from .auth import get_current_user

router = APIRouter(prefix="/audit-logs", tags=["audit-logs"])

def get_tenant_staff_user(current_user: models.User = Depends(get_current_user)):
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any tenant organization"
        )
    return current_user

@router.get("/", response_model=List[schemas.AuditLog])
def list_audit_logs(
    search: Optional[str] = Query(None, description="Free text search query"),
    category: Optional[str] = Query(None, description="Filter by event category"),
    outcome: Optional[str] = Query(None, description="Filter by outcome or status"),
    date_range: Optional[str] = Query(None, description="Date filter: today, 7d, 30d"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(database.get_db),
    user: models.User = Depends(get_tenant_staff_user)
):
    """
    List immutable audit log records scoped strictly to the authenticated tenant.
    Supports comprehensive search and multi-dimensional filtering.
    """
    query = db.query(models.AuditLog).filter(
        models.AuditLog.tenant_id == user.tenant_id
    )

    # Category filter
    if category and category.lower() != "all":
        query = query.filter(models.AuditLog.category == category.lower())

    # Outcome filter
    if outcome and outcome.lower() != "all":
        query = query.filter(models.AuditLog.outcome == outcome.lower())

    # Date range filter
    now = datetime.now(timezone.utc)
    if date_range == "today":
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        query = query.filter(models.AuditLog.created_at >= start_of_day)
    elif date_range == "7d":
        seven_days_ago = now - timedelta(days=7)
        query = query.filter(models.AuditLog.created_at >= seven_days_ago)
    elif date_range == "30d":
        thirty_days_ago = now - timedelta(days=30)
        query = query.filter(models.AuditLog.created_at >= thirty_days_ago)

    # Search filter
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.AuditLog.summary.ilike(term),
                models.AuditLog.notes.ilike(term),
                models.AuditLog.entity_name.ilike(term),
                models.AuditLog.entity_id.ilike(term),
                models.AuditLog.actor_name.ilike(term),
                models.AuditLog.actor_email.ilike(term),
            )
        )

    logs = query.order_by(models.AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    return logs
