from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.exceptions import (
    custom_http_exception_handler,
    validation_exception_handler,
    global_exception_handler
)
from app.api.middleware import TenantMiddleware
from app.schemas.response import StandardResponse

# Initialize logging
setup_logging(settings.ENVIRONMENT)

app = FastAPI(title="InsureIQ API", version="1.0.0")

# --- Middlewares ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(TenantMiddleware)

# --- Exception Handlers ---
app.add_exception_handler(StarletteHTTPException, custom_http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)


# --- Routes ---
from app.api.routes.auth import router as auth_router
from app.api.routes.tenants import router as tenants_router
from app.api.routes.applications import router as applications_router
from app.api.routes.underwriting import router as underwriting_router
from app.api.routes.policies import router as policies_router
from app.api.routes.claims import router as claims_router
from app.api.routes.agent import router as agent_router
from app.api.routes.admin import router as admin_router
from app.api.routes.console import router as console_router
from app.api.routes.ml import router as ml_router
from app.api.routes.marketplace import router as marketplace_router

app.include_router(auth_router, prefix="/api/v1")
app.include_router(tenants_router, prefix="/api/v1")
app.include_router(applications_router, prefix="/api/v1")
app.include_router(underwriting_router, prefix="/api/v1")
app.include_router(policies_router, prefix="/api/v1")
app.include_router(claims_router, prefix="/api/v1")
app.include_router(agent_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(console_router, prefix="/api/v1")
app.include_router(ml_router, prefix="/api/v1")
app.include_router(marketplace_router, prefix="/api/v1")

@app.get("/health", response_model=StandardResponse[dict])
async def health_check():
    """
    Health check endpoint to verify backend is running.
    """
    return StandardResponse.success_response({"status": "healthy"})
