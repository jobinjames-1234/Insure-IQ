import asyncio
from datetime import datetime, date, timedelta
from uuid import uuid4
import sys
import os

# Ensure app package can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import AsyncSessionLocal, engine, Base
from app.models import (
    Tenant, TenantBranding, TenantSettings, Role, User, UserProfile, TenantUser, UserRole, Password,
    Customer, CustomerProfile, InsuranceProduct, PolicyType, Coverage, PremiumBand,
    SubscriptionPlan
)

# A simple mock hash for seeding (In Phase 4, proper bcrypt hashing will be used)
MOCK_HASH = "$2b$12$FLDf2PUD8AfRZ9e7HV.loe7EBxJIPCfcE5a3y0j.Wid.eDmgsyhVq" # "password123"

async def clear_database(session: AsyncSession):
    # Depending on how the migration is generated, in a real scenario we might drop/recreate.
    # We rely on alembic downgrade / upgrade for clean slates before seeding.
    pass

async def seed_platform_data(session: AsyncSession):
    # 1. Check if already seeded
    existing_roles = await session.execute(select(Role))
    if existing_roles.scalars().first():
        print("Database already seeded. Skipping.")
        return None

    # 2. Subscription Plans
    plan_basic = SubscriptionPlan(name="Basic", price_monthly=49.99, max_users=10, features="Core CRM, 500 Policies")
    plan_pro = SubscriptionPlan(name="Pro", price_monthly=199.99, max_users=50, features="AI Risk Scoring, 5000 Policies")
    session.add_all([plan_basic, plan_pro])
    
    # 3. Roles
    roles = [
        Role(name="admin", description="Tenant Administrator"),
        Role(name="underwriter", description="Risk and Underwriting"),
        Role(name="agent", description="Sales Agent"),
        Role(name="adjuster", description="Claims Adjuster"),
        Role(name="customer", description="End Customer"),
        Role(name="superadmin", description="Platform Super Administrator")
    ]
    session.add_all(roles)
    
    return {"plan_pro": plan_pro, "roles": {r.name: r for r in roles}}

async def create_user(session: AsyncSession, role_id: str, email: str, first: str, last: str, tenant_id: str = None):
    user = User(tenant_id=tenant_id, email=email, is_verified=True)
    session.add(user)
    await session.flush()
    
    profile = UserProfile(tenant_id=tenant_id, user_id=user.id, first_name=first, last_name=last)
    
    # Only add tenant_user if tenant_id is not None
    if tenant_id:
        tenant_user = TenantUser(tenant_id=tenant_id, user_id=user.id)
        session.add(tenant_user)
        
    user_role = UserRole(user_id=user.id, role_id=role_id)
    password = Password(user_id=user.id, hashed_password=MOCK_HASH)
    
    session.add_all([profile, user_role, password])
    return user

async def seed_tenant(session: AsyncSession, name: str, slug: str, color: str, platform_data: dict):
    # Tenant
    tenant = Tenant(name=name, slug=slug, domain=f"{slug}.insureiq.app")
    session.add(tenant)
    await session.flush()
    
    # Branding & Settings
    branding = TenantBranding(tenant_id=tenant.id, primary_color=color)
    settings = TenantSettings(tenant_id=tenant.id)
    session.add_all([branding, settings])
    
    # Users
    admin = await create_user(session, platform_data["roles"]["admin"].id, f"admin@{slug}.com", "Admin", "User", tenant.id)
    uw1 = await create_user(session, platform_data["roles"]["underwriter"].id, f"uw1@{slug}.com", "Alice", "Underwriter", tenant.id)
    agent1 = await create_user(session, platform_data["roles"]["agent"].id, f"agent1@{slug}.com", "Bob", "Agent", tenant.id)
    adj1 = await create_user(session, platform_data["roles"]["adjuster"].id, f"adj1@{slug}.com", "Charlie", "Adjuster", tenant.id)
    
    # Products
    product_auto = InsuranceProduct(tenant_id=tenant.id, name="Auto Insurance", category="Auto", status="active")
    session.add(product_auto)
    await session.flush()
    
    policy_type = PolicyType(tenant_id=tenant.id, product_id=product_auto.id, name="Comprehensive Auto", term_months=12.0)
    session.add(policy_type)
    await session.flush()
    
    coverage1 = Coverage(tenant_id=tenant.id, policy_type_id=policy_type.id, name="Collision", limit_amount=50000, deductible=500)
    coverage2 = Coverage(tenant_id=tenant.id, policy_type_id=policy_type.id, name="Liability", limit_amount=100000, deductible=0)
    premium_band = PremiumBand(tenant_id=tenant.id, policy_type_id=policy_type.id, base_premium=1200.0)
    
    session.add_all([coverage1, coverage2, premium_band])
    
    # Customers
    for i in range(1, 6):
        cust_user = await create_user(session, platform_data["roles"]["customer"].id, f"customer{i}@{slug}.com", f"Cust{i}", "User", tenant.id)
        customer = Customer(tenant_id=tenant.id, user_id=cust_user.id)
        session.add(customer)
        await session.flush()
        
        cust_profile = CustomerProfile(
            tenant_id=tenant.id, 
            customer_id=customer.id, 
            first_name=f"Cust{i}", 
            last_name="User",
            date_of_birth=date(1990, 1, 1),
            phone="555-0100"
        )
        session.add(cust_profile)
    
    return tenant

async def seed():
    async with AsyncSessionLocal() as session:
        async with session.begin():
            print("Seeding platform data...")
            platform_data = await seed_platform_data(session)
            if not platform_data:
                return
            
            print("Creating global superadmin...")
            await create_user(session, platform_data["roles"]["superadmin"].id, "super@platform.com", "Super", "Admin", None)
            
            print("Seeding Tenant 1 (ABC Insurance)...")
            await seed_tenant(session, "ABC Insurance", "abc", "#1A56FF", platform_data)
            
            print("Seeding Tenant 2 (National Life)...")
            await seed_tenant(session, "National Life", "national", "#12805C", platform_data)
            
        print("Database seeding completed.")

if __name__ == "__main__":
    asyncio.run(seed())
