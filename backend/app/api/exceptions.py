import logging
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.schemas.response import StandardResponse, MetaModel

logger = logging.getLogger(__name__)

async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    Handles standard HTTPExceptions raised by FastAPI/Starlette.
    Wraps the detail message in the StandardResponse format.
    """
    error_msg = str(exc.detail) if exc.detail else "HTTP Error"
    
    response = StandardResponse.error_response(
        error=error_msg,
        meta=MetaModel(code=f"HTTP_{exc.status_code}")
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=response.model_dump()
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handles Pydantic validation errors from incoming requests.
    """
    errors = exc.errors()
    error_msg = "Validation Error"
    if len(errors) > 0:
         error_msg = f"{errors[0]['loc'][-1]}: {errors[0]['msg']}"

    response = StandardResponse.error_response(
        error=error_msg,
        meta=MetaModel(code="VALIDATION_ERROR", detail=str(errors))
    )
    
    return JSONResponse(
        status_code=422,
        content=response.model_dump()
    )

async def global_exception_handler(request: Request, exc: Exception):
    """
    Catch-all for unhandled exceptions. Prevents 500s from returning HTML/raw text.
    """
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    response = StandardResponse.error_response(
        error="Internal Server Error",
        meta=MetaModel(code="INTERNAL_ERROR")
    )
    
    return JSONResponse(
        status_code=500,
        content=response.model_dump()
    )
