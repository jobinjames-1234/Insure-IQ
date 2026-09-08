from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from jose import jwt
from app.core.config import settings

class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        """
        Intercepts incoming requests, decodes the JWT (if present) to extract the tenant_id.
        """
        request.state.tenant_id = None
        
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                # We decode the token here just to extract the tenant_id.
                # Actual route-level authorization is handled by FastAPI Depends().
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
                request.state.tenant_id = payload.get("tenant_id")
            except Exception:
                pass
                
        response = await call_next(request)
        return response
