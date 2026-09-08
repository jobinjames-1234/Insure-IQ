from fastapi import APIRouter
from typing import List, Dict, Any
from pydantic import BaseModel

router = APIRouter(prefix="/marketplace", tags=["marketplace"])

class QuoteRequest(BaseModel):
    category: str
    zip_code: str
    age: int
    coverage_level: str

from app.api.deps import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends
from sqlalchemy.future import select
from app.models import InsuranceProduct

@router.get("/products")
async def get_products(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(InsuranceProduct).where(InsuranceProduct.status == 'active'))
    products = result.scalars().all()
    
    icon_map = {
        "auto": "directions_car",
        "home": "home",
        "life": "favorite",
        "renters": "apartment"
    }
    
    categories = []
    for p in products:
        categories.append({
            "id": p.category,
            "name": p.name,
            "icon": icon_map.get(p.category, "category"),
            "description": p.description or ""
        })
        
    return {"categories": categories}

@router.post("/quotes")
async def get_quotes(req: QuoteRequest):
    from app.core.redis import cache_get, cache_set
    import hashlib
    
    # Generate a cache key based on the request parameters
    req_str = f"{req.category}_{req.zip_code}_{req.age}_{req.coverage_level}"
    cache_key = f"quotes:{hashlib.md5(req_str.encode()).hexdigest()}"
    
    # Check cache
    cached_quotes = await cache_get(cache_key)
    if cached_quotes:
        return {"quotes": cached_quotes, "cached": True}

    # Simulated quotes based on coverage level
    base_price = 100
    if req.coverage_level == "Premium":
        base_price = 250
    elif req.coverage_level == "Standard":
        base_price = 150
        
    # Introduce age-based and location-based mock modifiers
    if req.age < 25:
        base_price += 50
    if req.zip_code.startswith("9"):
        base_price += 25
        
    quotes = [
        {
            "id": "q1",
            "provider": "Alpha Shield",
            "monthly_premium": base_price - 15,
            "deductible": 1000,
            "coverage_limit": 500000,
            "features": ["24/7 Roadside Assistance", "Accident Forgiveness"],
            "best_value": True
        },
        {
            "id": "q2",
            "provider": "Nexus Auto",
            "monthly_premium": base_price + 20,
            "deductible": 500,
            "coverage_limit": 300000,
            "features": ["Rental Car Reimbursement", "New Car Replacement"],
            "best_value": False
        },
        {
            "id": "q3",
            "provider": "SecureLife Direct",
            "monthly_premium": base_price - 5,
            "deductible": 750,
            "coverage_limit": 400000,
            "features": ["Zero Deductible Glass"],
            "best_value": False
        }
    ]
    
    # Cache for 15 minutes (900 seconds)
    await cache_set(cache_key, quotes, expire_seconds=900)
    
    return {
        "quotes": quotes,
        "cached": False
    }

@router.get("/compare")
async def compare_quotes(quote_ids: str):
    # Simple simulated comparison
    return {
        "comparison": [
            {
                "feature": "Deductible",
                "q1": "$1,000",
                "q2": "$500",
                "q3": "$750"
            },
            {
                "feature": "Bodily Injury Limit",
                "q1": "$500k",
                "q2": "$300k",
                "q3": "$400k"
            },
            {
                "feature": "Roadside Assistance",
                "q1": "Included",
                "q2": "Optional ($5/mo)",
                "q3": "Included"
            },
            {
                "feature": "Telematics Discount",
                "q1": "Up to 30%",
                "q2": "Not available",
                "q3": "Up to 15%"
            }
        ]
    }
