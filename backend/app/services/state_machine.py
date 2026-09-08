"""
State Machine — Canonical lifecycle definitions and transition validation.

Every status-bearing entity in the system must define its valid states and
transitions here. No code outside this module should allow arbitrary status
changes.
"""
from __future__ import annotations
from typing import Optional
from enum import Enum


# ---------------------------------------------------------------------------
# State Enums
# ---------------------------------------------------------------------------

class UserStatus(str, Enum):
    INVITED = "invited"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    DEACTIVATED = "deactivated"


class CustomerStatus(str, Enum):
    PENDING_KYC = "pending_kyc"
    ACTIVE = "active"
    INACTIVE = "inactive"


class ApplicationStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"


class PolicyStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"
    LAPSED = "lapsed"


class ClaimStatus(str, Enum):
    SUBMITTED = "submitted"
    INVESTIGATING = "investigating"
    APPROVED = "approved"
    REJECTED = "rejected"
    PAID = "paid"
    CLOSED = "closed"


class QuoteStatus(str, Enum):
    ACTIVE = "active"
    CONVERTED = "converted"
    EXPIRED = "expired"


class CommissionStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"


class KycStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class InvoiceStatus(str, Enum):
    UNPAID = "unpaid"
    PAID = "paid"
    OVERDUE = "overdue"


class FraudFlagStatus(str, Enum):
    OPEN = "open"
    INVESTIGATED = "investigated"
    FALSE_POSITIVE = "false_positive"


class RetentionAlertStatus(str, Enum):
    OPEN = "open"
    RESOLVED = "resolved"


class TenantStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    DEACTIVATED = "deactivated"


# ---------------------------------------------------------------------------
# Transition Definitions
# ---------------------------------------------------------------------------
# Each key is a current state; its value is the set of states reachable from it.

_TRANSITIONS: dict[type[Enum], dict[str, set[str]]] = {
    UserStatus: {
        UserStatus.INVITED:      {UserStatus.ACTIVE, UserStatus.DEACTIVATED},
        UserStatus.ACTIVE:       {UserStatus.SUSPENDED, UserStatus.DEACTIVATED},
        UserStatus.SUSPENDED:    {UserStatus.ACTIVE, UserStatus.DEACTIVATED},
        UserStatus.DEACTIVATED:  set(),  # terminal
    },
    CustomerStatus: {
        CustomerStatus.PENDING_KYC: {CustomerStatus.ACTIVE, CustomerStatus.INACTIVE},
        CustomerStatus.ACTIVE:      {CustomerStatus.INACTIVE},
        CustomerStatus.INACTIVE:    {CustomerStatus.ACTIVE},
    },
    ApplicationStatus: {
        ApplicationStatus.DRAFT:         {ApplicationStatus.SUBMITTED},
        ApplicationStatus.SUBMITTED:     {ApplicationStatus.UNDER_REVIEW, ApplicationStatus.REJECTED},
        ApplicationStatus.UNDER_REVIEW:  {ApplicationStatus.APPROVED, ApplicationStatus.REJECTED},
        ApplicationStatus.APPROVED:      set(),  # terminal — triggers policy creation
        ApplicationStatus.REJECTED:      set(),  # terminal
    },
    PolicyStatus: {
        PolicyStatus.ACTIVE:    {PolicyStatus.EXPIRED, PolicyStatus.CANCELLED, PolicyStatus.LAPSED},
        PolicyStatus.EXPIRED:   set(),
        PolicyStatus.CANCELLED: set(),
        PolicyStatus.LAPSED:    {PolicyStatus.ACTIVE},  # reinstatement
    },
    ClaimStatus: {
        ClaimStatus.SUBMITTED:      {ClaimStatus.INVESTIGATING, ClaimStatus.REJECTED},
        ClaimStatus.INVESTIGATING:  {ClaimStatus.APPROVED, ClaimStatus.REJECTED},
        ClaimStatus.APPROVED:       {ClaimStatus.PAID},
        ClaimStatus.REJECTED:       {ClaimStatus.CLOSED},
        ClaimStatus.PAID:           {ClaimStatus.CLOSED},
        ClaimStatus.CLOSED:         set(),
    },
    QuoteStatus: {
        QuoteStatus.ACTIVE:    {QuoteStatus.CONVERTED, QuoteStatus.EXPIRED},
        QuoteStatus.CONVERTED: set(),
        QuoteStatus.EXPIRED:   set(),
    },
    CommissionStatus: {
        CommissionStatus.PENDING: {CommissionStatus.PAID},
        CommissionStatus.PAID:    set(),
    },
    KycStatus: {
        KycStatus.PENDING:  {KycStatus.APPROVED, KycStatus.REJECTED},
        KycStatus.APPROVED: set(),
        KycStatus.REJECTED: {KycStatus.PENDING},  # resubmission
    },
    RetentionAlertStatus: {
        RetentionAlertStatus.OPEN:     {RetentionAlertStatus.RESOLVED},
        RetentionAlertStatus.RESOLVED: set(),
    },
    TenantStatus: {
        TenantStatus.ACTIVE:      {TenantStatus.SUSPENDED, TenantStatus.DEACTIVATED},
        TenantStatus.SUSPENDED:   {TenantStatus.ACTIVE, TenantStatus.DEACTIVATED},
        TenantStatus.DEACTIVATED: set(),
    },
}

# ---------------------------------------------------------------------------
# Role-based transition permissions
# ---------------------------------------------------------------------------
# Maps (entity_enum, new_status) → set of roles allowed to perform that transition.

_ROLE_PERMISSIONS: dict[tuple[type[Enum], str], set[str]] = {
    # Application transitions
    (ApplicationStatus, ApplicationStatus.SUBMITTED):    {"customer"},
    (ApplicationStatus, ApplicationStatus.UNDER_REVIEW): {"underwriter"},
    (ApplicationStatus, ApplicationStatus.APPROVED):     {"underwriter"},
    (ApplicationStatus, ApplicationStatus.REJECTED):     {"underwriter"},
    # Claim transitions
    (ClaimStatus, ClaimStatus.INVESTIGATING): {"adjuster"},
    (ClaimStatus, ClaimStatus.APPROVED):      {"adjuster"},
    (ClaimStatus, ClaimStatus.REJECTED):      {"adjuster"},
    (ClaimStatus, ClaimStatus.PAID):          {"admin", "adjuster"},
    (ClaimStatus, ClaimStatus.CLOSED):        {"admin", "adjuster"},
    # User transitions
    (UserStatus, UserStatus.ACTIVE):      {"admin", "superadmin"},
    (UserStatus, UserStatus.SUSPENDED):   {"admin", "superadmin"},
    (UserStatus, UserStatus.DEACTIVATED): {"admin", "superadmin"},
    # Policy transitions
    (PolicyStatus, PolicyStatus.CANCELLED): {"admin", "customer"},
    (PolicyStatus, PolicyStatus.ACTIVE):    {"admin"},  # reinstatement
}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

class InvalidTransitionError(Exception):
    """Raised when a state transition is not allowed."""
    def __init__(self, entity_type: str, current: str, target: str, reason: str = ""):
        self.entity_type = entity_type
        self.current = current
        self.target = target
        self.reason = reason or f"Transition from '{current}' to '{target}' is not allowed for {entity_type}"
        super().__init__(self.reason)


class InsufficientPermissionError(Exception):
    """Raised when the actor's role cannot perform a transition."""
    def __init__(self, role: str, entity_type: str, target: str):
        self.role = role
        self.entity_type = entity_type
        self.target = target
        super().__init__(f"Role '{role}' cannot transition {entity_type} to '{target}'")


def validate_transition(
    entity_enum: type[Enum],
    current_status: str,
    new_status: str,
    actor_role: Optional[str] = None,
) -> bool:
    """
    Validate that a state transition is allowed.

    Args:
        entity_enum: The Enum class (e.g. ClaimStatus)
        current_status: Current status value
        new_status: Desired new status value
        actor_role: Role of the user performing the transition (optional)

    Returns:
        True if the transition is valid

    Raises:
        InvalidTransitionError: If the transition is not in the allowed graph
        InsufficientPermissionError: If the actor's role is not permitted
    """
    transitions = _TRANSITIONS.get(entity_enum)
    if transitions is None:
        raise InvalidTransitionError(
            entity_enum.__name__, current_status, new_status,
            f"No transition rules defined for {entity_enum.__name__}"
        )

    # Normalize to enum values
    try:
        current_enum = entity_enum(current_status)
    except ValueError:
        raise InvalidTransitionError(
            entity_enum.__name__, current_status, new_status,
            f"'{current_status}' is not a valid {entity_enum.__name__} state"
        )

    try:
        target_enum = entity_enum(new_status)
    except ValueError:
        raise InvalidTransitionError(
            entity_enum.__name__, current_status, new_status,
            f"'{new_status}' is not a valid {entity_enum.__name__} state"
        )

    allowed = transitions.get(current_enum, set())
    if target_enum not in allowed:
        raise InvalidTransitionError(entity_enum.__name__, current_status, new_status)

    # Check role permission if specified
    if actor_role is not None:
        perm_key = (entity_enum, target_enum)
        allowed_roles = _ROLE_PERMISSIONS.get(perm_key)
        if allowed_roles is not None and actor_role not in allowed_roles:
            raise InsufficientPermissionError(actor_role, entity_enum.__name__, new_status)

    return True


def get_valid_transitions(entity_enum: type[Enum], current_status: str) -> list[str]:
    """Return the list of valid next states from the current state."""
    transitions = _TRANSITIONS.get(entity_enum, {})
    try:
        current_enum = entity_enum(current_status)
    except ValueError:
        return []
    return [s.value for s in transitions.get(current_enum, set())]
