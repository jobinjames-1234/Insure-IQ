from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from . import models

def log_audit_event(
    db: Session,
    tenant_id: int,
    category: str,
    action: str,
    summary: str,
    actor: Optional[models.User] = None,
    outcome: str = "success",
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    entity_name: Optional[str] = None,
    notes: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    commit: bool = True
) -> models.AuditLog:
    """
    Records an immutable audit log entry scoped strictly to a tenant.
    Used across Team Management, Policy Settings, Underwriting, Claims, and Billing.
    """
    actor_id = actor.id if actor else None
    actor_email = actor.email if actor else None
    actor_name = actor.name if (actor and actor.name) else actor_email
    actor_role = actor.role.value if (actor and hasattr(actor.role, "value")) else (actor.role if actor else "system")

    log_entry = models.AuditLog(
        tenant_id=tenant_id,
        actor_id=actor_id,
        actor_name=actor_name,
        actor_email=actor_email,
        actor_role=actor_role,
        category=category,
        action=action,
        outcome=outcome,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id is not None else None,
        entity_name=entity_name,
        summary=summary,
        notes=notes,
        details=details or {}
    )

    db.add(log_entry)
    if commit:
        db.commit()
        db.refresh(log_entry)
    return log_entry
