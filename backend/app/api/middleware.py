from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from jose import jwt
from app.core.config import settings

class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        """
        Intercepts incoming requests, decodes the JWT (if present),
        and extracts the tenant_id, placing it in request.state.tenant_id.
        This ensures ADR-003 multi-tenancy rules can be enforced downstream.
        """
        # Default to None (platform-scope) if no auth header
        request.state.tenant_id = None
        
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                # We decode the token here just to extract the tenant_id.
                # Actual route-level authorization is handled by FastAPI Depends().
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
                # Extract tenant_id (will be a UUID string or None for superadmins)
                request.state.tenant_id = payload.get("tenant_id")
            except Exception:
                # Invalid tokens are ignored here; the auth dependency will reject them later
                pass
                
        response = await call_next(request)
        return response
