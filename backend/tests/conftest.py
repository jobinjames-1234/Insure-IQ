import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.core.database import get_db, Base
from app.core.config import settings
from app.core.security import create_access_token
from app.models import Role, Tenant, User, TenantBranding, TenantSettings

# Use a test database if available, otherwise just use the main one (for MVP testing purposes)
TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL", settings.async_database_uri)

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestingSessionLocal = async_sessionmaker(
    bind=test_engine, class_=AsyncSession, expire_on_commit=False
)

@pytest_asyncio.fixture(scope="session", autouse=True)
async def prepare_database():
    # Setup test DB tables (In a real app, use alembic downgrade/upgrade or a separate test DB)
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # We will NOT drop all tables here because we are likely testing against the dev database
    # In a real environment, we'd drop tables after test session.

@pytest_asyncio.fixture
async def db_session():
    async with TestingSessionLocal() as session:
        yield session

@pytest_asyncio.fixture
def override_get_db(db_session):
    async def _get_db_override():
        yield db_session
    return _get_db_override

@pytest_asyncio.fixture
async def async_client(override_get_db):
    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()

@pytest_asyncio.fixture
async def mock_admin_token(db_session):
    # This generates a token for an admin user in a mocked tenant
    tenant = Tenant(name="Test Tenant", slug="test-tenant", domain="test.insureiq.app")
    db_session.add(tenant)
    await db_session.commit()
    
    token = create_access_token(
        subject="admin@test.com",
        tenant_id=str(tenant.id),
        role="admin"
    )
    return {"Authorization": f"Bearer {token}", "X-Tenant-ID": str(tenant.id)}

@pytest_asyncio.fixture
async def mock_agent_token(db_session):
    tenant = Tenant(name="Test Tenant", slug="test-tenant", domain="test.insureiq.app")
    db_session.add(tenant)
    await db_session.commit()
    
    token = create_access_token(
        subject="agent@test.com",
        tenant_id=str(tenant.id),
        role="agent"
    )
    return {"Authorization": f"Bearer {token}", "X-Tenant-ID": str(tenant.id)}
