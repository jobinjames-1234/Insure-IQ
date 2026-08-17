import uuid
from typing import Dict, List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.ai_stubs import RiskScore, FraudFlag, ChurnScore
from app.models.claim import Claim, ClaimDocument
from app.models.policy import Application
from app.models.customer import Customer
from app.schemas.response import StandardResponse

router = APIRouter(prefix="/ml", tags=["AI / ML Models"])

@router.post("/risk-score", response_model=StandardResponse)
async def generate_risk_score(application_id: str, db: AsyncSession = Depends(get_db)):
    """Mock XGBoost model to generate a risk score and SHAP values for an application."""
    # Check if application exists
    stmt = select(Application).where(Application.id == application_id)
    result = await db.execute(stmt)
    application = result.scalars().first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # Check if risk score already exists
    stmt = select(RiskScore).where(RiskScore.application_id == application_id)
    result = await db.execute(stmt)
    existing_score = result.scalars().first()
    if existing_score:
        return StandardResponse(success=True, data={"risk_score": {
            "score_value": existing_score.score_value,
            "risk_band": existing_score.risk_band,
            "factors": existing_score.factors
        }})

    # Generate mock deterministic score based on application_id
    seed = sum(ord(c) for c in str(application_id))
    score = (seed % 60) + 20 # Score between 20 and 80
    
    if score < 40:
        band = "Low"
    elif score < 70:
        band = "Medium"
    else:
        band = "High"

    factors = [
        {"feature": "Age", "contribution": -1.2, "value": "28"},
        {"feature": "Credit Score", "contribution": 3.4, "value": "720"},
        {"feature": "Past Claims", "contribution": 5.1, "value": "1"},
        {"feature": "Location Risk", "contribution": -0.8, "value": "Suburban"}
    ]

    risk_score = RiskScore(
        application_id=application_id,
        score_value=score,
        risk_band=band,
        factors=factors,
        tenant_id=application.tenant_id
    )
    db.add(risk_score)
    await db.commit()
    await db.refresh(risk_score)

    return StandardResponse(success=True, data={"risk_score": {
        "score_value": risk_score.score_value,
        "risk_band": risk_score.risk_band,
        "factors": risk_score.factors
    }})

@router.post("/fraud-score", response_model=StandardResponse)
async def generate_fraud_score(claim_id: str, db: AsyncSession = Depends(get_db)):
    """Mock Isolation Forest model to detect claims fraud anomalies."""
    stmt = select(Claim).where(Claim.id == claim_id)
    result = await db.execute(stmt)
    claim = result.scalars().first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    stmt = select(FraudFlag).where(FraudFlag.claim_id == claim_id)
    result = await db.execute(stmt)
    existing_flag = result.scalars().first()
    if existing_flag:
        return StandardResponse(success=True, data={"fraud_flag": {
            "confidence_score": existing_flag.confidence_score,
            "flag_type": existing_flag.flag_type,
            "description": existing_flag.description
        }})

    # Generate mock deterministic score
    seed = sum(ord(c) for c in str(claim_id))
    score = (seed % 100) / 100.0 # 0.0 to 1.0

    if score > 0.75:
        flag_type = "Anomaly"
        description = "High anomaly detected: Claim timing and amount are statistically unusual."
    elif score > 0.4:
        flag_type = "Watchlist"
        description = "Medium risk: Claimant matches patterns of past suspected activity."
    else:
        flag_type = "Normal"
        description = "No significant fraud patterns detected."

    fraud_flag = FraudFlag(
        claim_id=claim_id,
        flag_type=flag_type,
        confidence_score=score,
        description=description,
        tenant_id=claim.tenant_id
    )
    db.add(fraud_flag)
    await db.commit()
    await db.refresh(fraud_flag)

    return StandardResponse(success=True, data={"fraud_flag": {
        "confidence_score": fraud_flag.confidence_score,
        "flag_type": fraud_flag.flag_type,
        "description": fraud_flag.description
    }})

@router.post("/document-extract", response_model=StandardResponse)
async def extract_document_data(document_id: str, db: AsyncSession = Depends(get_db)):
    """Mock HuggingFace NER/OCR pipeline for claim documents."""
    stmt = select(ClaimDocument).where(ClaimDocument.id == document_id)
    result = await db.execute(stmt)
    doc = result.scalars().first()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Mock extracted data
    extracted = {
        "entities": [
            {"label": "DATE", "text": "2023-10-15", "confidence": 0.98},
            {"label": "AMOUNT", "text": "$4,500.00", "confidence": 0.95},
            {"label": "VENDOR", "text": "City Auto Repair", "confidence": 0.89},
            {"label": "DIAGNOSIS_CODE", "text": "V01.9", "confidence": 0.75}
        ],
        "summary": "Document appears to be a repair estimate for a front-end collision."
    }

    doc.extracted_data = extracted
    await db.commit()

    return StandardResponse(success=True, data={"extracted_data": extracted})

@router.post("/churn-predict", response_model=StandardResponse)
async def batch_churn_predict(tenant_id: str, db: AsyncSession = Depends(get_db)):
    """Mock Batch XGBoost model to predict churn for all active customers in a tenant."""
    # Find all customers for the tenant
    stmt = select(Customer).where(Customer.tenant_id == tenant_id)
    result = await db.execute(stmt)
    customers = result.scalars().all()

    created_count = 0
    for customer in customers:
        # Check if score exists
        stmt_score = select(ChurnScore).where(ChurnScore.customer_id == customer.id)
        res_score = await db.execute(stmt_score)
        if res_score.scalars().first():
            continue # Skip existing
            
        seed = sum(ord(c) for c in str(customer.id))
        prob = (seed % 100) / 100.0
        
        if prob > 0.8:
            level = "High"
        elif prob > 0.4:
            level = "Medium"
        else:
            level = "Low"
            
        factors = [
            {"feature": "Policy Age", "contribution": 0.1, "value": "11 months"},
            {"feature": "Recent Claims", "contribution": 0.3, "value": "1"},
            {"feature": "Premium Increase", "contribution": 0.5, "value": "12%"}
        ]
        
        score = ChurnScore(
            customer_id=customer.id,
            probability=prob,
            risk_level=level,
            factors=factors,
            tenant_id=tenant_id
        )
        db.add(score)
        created_count += 1
        
    await db.commit()
    
    return StandardResponse(success=True, message=f"Generated {created_count} churn predictions.")
