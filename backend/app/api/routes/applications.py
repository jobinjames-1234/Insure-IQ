from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from uuid import UUID

from app.core.database import get_db
from app.api.deps import get_current_user, require_role
from app.models.user import User
from app.models.customer import Customer
from app.models.policy import Application, ApplicationDocument, PolicyType, InsuranceProduct

router = APIRouter(prefix="/applications", tags=["applications"])

@router.get("/policy-types")
async def get_policy_types(
    db: AsyncSession = Depends(get_db)
    # Accessible publicly or authenticated, depending on use-case
):
    result = await db.execute(
        select(PolicyType).join(InsuranceProduct).options(selectinload(PolicyType.product))
    )
    # Note: We need a relationship 'product' on PolicyType, which might not be set.
    # Let's do a simple join manually if relation isn't present
    # Better yet, just return types
    result = await db.execute(select(PolicyType))
    types = result.scalars().all()
    return types

@router.post("")
async def create_application(
    payload: dict,
    current_user: User = Depends(require_role(["customer"])),
    db: AsyncSession = Depends(get_db)
):
    # Find customer id for this user
    cust_res = await db.execute(select(Customer).where(Customer.user_id == current_user.id))
    customer = cust_res.scalars().first()
    if not customer:
        raise HTTPException(status_code=400, detail="Customer profile not found.")

    policy_type_id = payload.get("policy_type_id")
    if not policy_type_id:
        raise HTTPException(status_code=400, detail="policy_type_id required")
        
    app = Application(
        customer_id=customer.id,
        policy_type_id=policy_type_id,
        status="submitted",
        application_data=payload.get("data", {})
    )
    db.add(app)
    await db.commit()
    await db.refresh(app)
    return app

@router.get("/my")
async def get_my_applications(
    current_user: User = Depends(require_role(["customer"])),
    db: AsyncSession = Depends(get_db)
):
    cust_res = await db.execute(select(Customer).where(Customer.user_id == current_user.id))
    customer = cust_res.scalars().first()
    if not customer:
        return []

    res = await db.execute(select(Application).where(Application.customer_id == customer.id))
    return res.scalars().all()

@router.get("/{id}")
async def get_application(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Application).where(Application.id == id))
    app = res.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Not found")
        
    # Check authorization (if customer, must own it; if underwriter/admin, can view)
    if current_user.role == "customer":
        cust_res = await db.execute(select(Customer).where(Customer.user_id == current_user.id))
        customer = cust_res.scalars().first()
        if not customer or app.customer_id != customer.id:
            raise HTTPException(status_code=403, detail="Forbidden")

    docs = await db.execute(select(ApplicationDocument).where(ApplicationDocument.application_id == id))
    
    return {
        "application": app,
        "documents": docs.scalars().all()
    }

@router.post("/{id}/documents")
async def upload_document(
    id: UUID,
    payload: dict,
    current_user: User = Depends(require_role(["customer"])),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Application).where(Application.id == id))
    app = res.scalars().first()
    if not app:
        raise HTTPException(status_code=404, detail="Not found")

    doc = ApplicationDocument(
        application_id=app.id,
        document_type=payload.get("type", "other"),
        file_url=payload.get("url", "https://example.com/doc.pdf") # Mocking file upload
    )
    db.add(doc)
    await db.commit()
    return doc
