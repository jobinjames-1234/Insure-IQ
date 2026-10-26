from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from .database import engine, Base
from .migrations import auto_upgrade_schema
from .routers import auth, tenants, team, policy_config, audit, billing, underwriting, claims, agents

# Auto-migrate database schema: creates missing tables, types, and adds newly added columns
auto_upgrade_schema(engine)

app = FastAPI(title="InsureIQ Platform API")

# Configure CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://console.localhost:5173,https://console.jobinjames.in").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://([a-zA-Z0-9-]+\.)?(jobinjames\.in|localhost|vercel\.app)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(tenants.router, prefix="/api")
app.include_router(team.router, prefix="/api")
app.include_router(policy_config.router, prefix="/api")
app.include_router(audit.router, prefix="/api")
app.include_router(billing.router, prefix="/api")
app.include_router(underwriting.router, prefix="/api")
app.include_router(claims.router, prefix="/api")
app.include_router(agents.router, prefix="/api")

@app.on_event("startup")
def ensure_super_admin():
    from .database import SessionLocal
    from . import models, auth as auth_lib
    db = SessionLocal()
    try:
        admin_email = os.getenv("SUPER_ADMIN_EMAIL", "superadmin@insureiq.com")
        admin_pass = os.getenv("SUPER_ADMIN_PASSWORD", "admin123")
        existing_admin = db.query(models.User).filter(models.User.role == models.Role.super_admin).first()
        if not existing_admin:
            super_admin = models.User(
                email=admin_email,
                hashed_password=auth_lib.get_password_hash(admin_pass),
                role=models.Role.super_admin,
                tenant_id=None
            )
            db.add(super_admin)
            db.commit()
            print(f"Created initial Super Admin: {admin_email}")
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to InsureIQ API"}
