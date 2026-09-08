"""
Pydantic schemas for Application, Policy, and related entities.
"""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import date


# ---------------------------------------------------------------------------
# Application Schemas
# ---------------------------------------------------------------------------

class ApplicationCreate(BaseModel):
    policy_type_id: UUID
    application_data: dict = Field(default_factory=dict)
    quoted_premium: Optional[float] = None
    quote_id: Optional[UUID] = None


class ApplicationSubmit(BaseModel):
    """Used when transitioning from draft to submitted."""
    pass  # No extra fields needed; the application already exists


class ApplicationDecision(BaseModel):
    """Used by underwriters to approve/reject an application."""
    decision: str = Field(..., pattern="^(approved|rejected|referred)$")
    rationale: str = Field(..., min_length=10, max_length=2000)
    conditions: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: UUID
    customer_id: UUID
    policy_type_id: UUID
    quote_id: Optional[UUID] = None
    status: str
    application_data: dict
    quoted_premium: Optional[float] = None
    created_at: Optional[str] = None

    model_config = {"from_attributes": True}


class ApplicationListResponse(BaseModel):
    id: UUID
    status: str
    quoted_premium: Optional[float] = None
    created_at: Optional[str] = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Policy Schemas
# ---------------------------------------------------------------------------

class PolicyResponse(BaseModel):
    id: UUID
    policy_number: str
    customer_id: UUID
    policy_type_id: UUID
    application_id: UUID
    status: str
    start_date: date
    end_date: date
    total_premium: float
    created_at: Optional[str] = None

    model_config = {"from_attributes": True}


class PolicyListResponse(BaseModel):
    id: UUID
    policy_number: str
    status: str
    start_date: date
    end_date: date
    total_premium: float

    model_config = {"from_attributes": True}


class PolicyCancelRequest(BaseModel):
    reason: str = Field(..., min_length=5, max_length=500)
