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
    SubscriptionPlan, CommissionRecord, TenantInvoice, Claim, ClaimSLA, RetentionAlert, Policy, Application
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

        # Retention Alerts mock
        if i == 1:
            alert1 = RetentionAlert(tenant_id=tenant.id, customer_id=customer.id, severity="Urgent", reason="Multiple claims in last 3 months. Policy premium increased by 15%. High churn risk.", action="Call Now")
            alert2 = RetentionAlert(tenant_id=tenant.id, customer_id=customer.id, severity="Medium", reason="Missed second payment reminder. Auto-pay card expired last week.", action="Update Card")
            alert3 = RetentionAlert(tenant_id=tenant.id, customer_id=customer.id, severity="Low", reason="Browsing competitor rates via partner portal link.", action="Offer Discount")
            session.add_all([alert1, alert2, alert3])

    # Create mock applications, policies and commissions for agent1
    app1 = Application(tenant_id=tenant.id, customer_id=customer.id, policy_type_id=policy_type.id, status="approved", quoted_premium=1200)
    app2 = Application(tenant_id=tenant.id, customer_id=customer.id, policy_type_id=policy_type.id, status="approved", quoted_premium=4500)
    app3 = Application(tenant_id=tenant.id, customer_id=customer.id, policy_type_id=policy_type.id, status="approved", quoted_premium=850)
    session.add_all([app1, app2, app3])
    await session.flush()

    policy1 = Policy(tenant_id=tenant.id, application_id=app1.id, customer_id=customer.id, policy_type_id=policy_type.id, policy_number=f"POL-8492-AX-{tenant.slug}", start_date=date(2026, 1, 1), end_date=date(2026, 12, 31), total_premium=1200)
    policy2 = Policy(tenant_id=tenant.id, application_id=app2.id, customer_id=customer.id, policy_type_id=policy_type.id, policy_number=f"POL-3310-BQ-{tenant.slug}", start_date=date(2026, 2, 1), end_date=date(2027, 1, 31), total_premium=4500)
    policy3 = Policy(tenant_id=tenant.id, application_id=app3.id, customer_id=customer.id, policy_type_id=policy_type.id, policy_number=f"POL-9921-CX-{tenant.slug}", start_date=date(2026, 3, 1), end_date=date(2027, 2, 28), total_premium=850)
    session.add_all([policy1, policy2, policy3])
    await session.flush()

    comm1 = CommissionRecord(tenant_id=tenant.id, agent_id=agent1.id, policy_id=policy1.id, amount=180, status="paid", calculation_date=date(2026, 10, 24))
    comm2 = CommissionRecord(tenant_id=tenant.id, agent_id=agent1.id, policy_id=policy2.id, amount=675, status="pending", calculation_date=date(2026, 10, 22))
    comm3 = CommissionRecord(tenant_id=tenant.id, agent_id=agent1.id, policy_id=policy3.id, amount=127.5, status="paid", calculation_date=date(2026, 10, 18))
    session.add_all([comm1, comm2, comm3])

    # Tenant Invoices
    inv1 = TenantInvoice(tenant_id=tenant.id, amount_due=499.00, due_date=date(2023, 10, 1), status="paid")
    session.add(inv1)

    # Claims and SLA
    claim1 = Claim(tenant_id=tenant.id, policy_id=policy1.id, customer_id=customer.id, claim_number=f"CLM-89241-{tenant.slug}", status="under_review", incident_date=date(2023, 9, 1), reported_date=date(2023, 9, 2), description="Mock claim", claimed_amount=1000)
    session.add(claim1)
    await session.flush()

    sla1 = ClaimSLA(tenant_id=tenant.id, claim_id=str(claim1.id), customer_name="Sarah Jenkins", duration_days=13, target_days=14, status="Met SLA", date_closed=date(2023, 9, 15))
    session.add(sla1)
    
    return tenant

async def seed():
    async with AsyncSessionLocal() as session:
        async with session.begin():
            print("Seeding platform data...")
            platform_data = await seed_platform_data(session)
            if not platform_data:
                return
            
            print("Seeding Tenant 1 (ABC Insurance)...")
            tenant1 = await seed_tenant(session, "ABC Insurance", "abc", "#1A56FF", platform_data)
            
            print("Creating global superadmin...")
            await create_user(session, platform_data["roles"]["superadmin"].id, "super@platform.com", "Super", "Admin", tenant1.id)

            
            print("Seeding Tenant 2 (National Life)...")
            await seed_tenant(session, "National Life", "national", "#12805C", platform_data)
            
        print("Database seeding completed.")

if __name__ == "__main__":
    asyncio.run(seed())
