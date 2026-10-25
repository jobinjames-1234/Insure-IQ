from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from .database import engine, Base
from .routers import auth, tenants

# We use create_all instead of alembic for now, as requested.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="InsureIQ Platform API")

# Configure CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://console.localhost:5173,https://console.jobinjames.in").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://([a-zA-Z0-9-]+\.)?(jobinjames\.in|localhost)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(tenants.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to InsureIQ API"}
