import asyncio
from datetime import datetime, date, timedelta
from uuid import uuid4
import sys
import os
import random

# Ensure app package can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import AsyncSessionLocal, engine, Base
from app.models import (
    Tenant, TenantBranding, TenantSettings, Role, User, UserProfile, TenantUser, UserRole, Password,
    Customer, CustomerProfile, InsuranceProduct, PolicyType, Coverage, PremiumBand,
    SubscriptionPlan, SystemActivityLog, FinancialLedger, ClaimSLA, Policy, Claim, Application, Quote
)

MOCK_HASH = "$2b$12$FLDf2PUD8AfRZ9e7HV.loe7EBxJIPCfcE5a3y0j.Wid.eDmgsyhVq" # "password123"

async def clear_database(session: AsyncSession):
    pass

async def seed_platform_data(session: AsyncSession):
    existing_roles = await session.execute(select(Role))
    if existing_roles.scalars().first():
        print("Database already seeded. Skipping.")
        return None

    plan_basic = SubscriptionPlan(name="Basic", price_monthly=49.99, max_users=10, features="Core CRM, 500 Policies")
    plan_pro = SubscriptionPlan(name="Pro", price_monthly=199.99, max_users=50, features="AI Risk Scoring, 5000 Policies")
    session.add_all([plan_basic, plan_pro])
    
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
    
    if tenant_id:
        tenant_user = TenantUser(tenant_id=tenant_id, user_id=user.id)
        session.add(tenant_user)
        
    user_role = UserRole(user_id=user.id, role_id=role_id)
    password = Password(user_id=user.id, hashed_password=MOCK_HASH)
    
    session.add_all([profile, user_role, password])
    return user

async def seed_tenant(session: AsyncSession, name: str, slug: str, color: str, platform_data: dict):
    tenant = Tenant(name=name, slug=slug, domain=f"{slug}.insureiq.app")
    session.add(tenant)
    await session.flush()
    
    branding = TenantBranding(tenant_id=tenant.id, primary_color=color)
    settings = TenantSettings(tenant_id=tenant.id)
    session.add_all([branding, settings])
    
    admin = await create_user(session, platform_data["roles"]["admin"].id, f"admin@{slug}.com", "Admin", "User", tenant.id)
    uw1 = await create_user(session, platform_data["roles"]["underwriter"].id, f"uw1@{slug}.com", "Alice", "Underwriter", tenant.id)
    agent1 = await create_user(session, platform_data["roles"]["agent"].id, f"agent1@{slug}.com", "Bob", "Agent", tenant.id)
    adj1 = await create_user(session, platform_data["roles"]["adjuster"].id, f"adj1@{slug}.com", "Charlie", "Adjuster", tenant.id)
    
    # 1. Products (Match marketplace.py mock data)
    products = [
        InsuranceProduct(tenant_id=tenant.id, name="Auto Insurance", category="auto", status="active", description="Protect your vehicle and passengers."),
        InsuranceProduct(tenant_id=tenant.id, name="Homeowners Insurance", category="home", status="active", description="Protect your most valuable asset."),
        InsuranceProduct(tenant_id=tenant.id, name="Life Insurance", category="life", status="active", description="Financial security for your loved ones."),
        InsuranceProduct(tenant_id=tenant.id, name="Renters Insurance", category="renters", status="active", description="Protect your personal belongings.")
    ]
    session.add_all(products)
    await session.flush()

    pt_auto = PolicyType(tenant_id=tenant.id, product_id=products[0].id, name="Comprehensive Auto", term_months=12.0)
    session.add(pt_auto)
    await session.flush()
    
    session.add(Coverage(tenant_id=tenant.id, policy_type_id=pt_auto.id, name="Collision", limit_amount=50000, deductible=500))
    session.add(PremiumBand(tenant_id=tenant.id, policy_type_id=pt_auto.id, base_premium=1200.0))
    
    # Customers
    customers = []
    for i in range(1, 6):
        cust_user = await create_user(session, platform_data["roles"]["customer"].id, f"customer{i}@{slug}.com", f"Cust{i}", "User", tenant.id)
        customer = Customer(tenant_id=tenant.id, user_id=cust_user.id)
        session.add(customer)
        await session.flush()
        
        cust_profile = CustomerProfile(
            tenant_id=tenant.id, customer_id=customer.id, 
            first_name=f"Cust{i}", last_name="User", date_of_birth=date(1990, 1, 1), phone="555-0100"
        )
        session.add(cust_profile)
        customers.append(customer)

    # Quotes (Match marketplace mock quotes logic)
    for c in customers:
        q = Quote(tenant_id=tenant.id, customer_id=c.id, policy_type_id=pt_auto.id, status="active", quote_data={"provider": "Alpha Shield", "features": ["24/7 Roadside Assistance", "Accident Forgiveness"]}, quoted_premium=85.0, valid_until=date(2027, 1, 1))
        session.add(q)
        
        # Policy
        app = Application(tenant_id=tenant.id, customer_id=c.id, policy_type_id=pt_auto.id, quote_id=q.id, status="approved", quoted_premium=85.0)
        session.add(app)
        await session.flush()
        
        pol = Policy(tenant_id=tenant.id, application_id=app.id, customer_id=c.id, policy_type_id=pt_auto.id, policy_number=f"POL-{str(uuid4())[:8].upper()}", status="active", start_date=date(2023,1,1), end_date=date(2024,1,1), total_premium=1020.0)
        session.add(pol)
        await session.flush()
        
        # Claim
        if random.random() > 0.5:
            clm = Claim(tenant_id=tenant.id, policy_id=pol.id, customer_id=c.id, claim_number=f"CLM-{str(uuid4())[:8].upper()}", status="under_review", incident_date=date(2023,6,1), reported_date=date(2023,6,2), description="Fender bender", claimed_amount=2500.0)
            session.add(clm)
            await session.flush()

            # Claim SLA
            session.add(ClaimSLA(tenant_id=tenant.id, claim_id=clm.claim_number, customer_name=f"Cust{c.id} User", duration_days=3.2, target_days=5.0, date_closed=date(2023,6,5), status="Met SLA"))

    # System Activity Log
    activities = [
        SystemActivityLog(tenant_id=tenant.id, activity_type="Underwriting", title="Underwriting Approval", description="Policy #AX-9023 was approved.", color="bg-success-bg text-success", icon_name="FactCheck"),
        SystemActivityLog(tenant_id=tenant.id, activity_type="Team", title="New Agent Onboarded", description="Sarah Jenkins joined.", color="bg-primary-fixed text-primary", icon_name="PersonAdd")
    ]
    session.add_all(activities)

    # Financial Ledger
    ledgers = [
        FinancialLedger(tenant_id=tenant.id, transaction_date=date(2023,10,31), description="Stripe Payout", transaction_type="Credit", amount=142500.0, running_balance=1245000.0),
        FinancialLedger(tenant_id=tenant.id, transaction_date=date(2023,10,28), description="Claim Payout", transaction_type="Debit", amount=45000.0, running_balance=1102500.0)
    ]
    session.add_all(ledgers)
    
    return tenant

async def seed():
    async with AsyncSessionLocal() as session:
        async with session.begin():
            print("Seeding platform data...")
            platform_data = await seed_platform_data(session)
            if not platform_data:
                return
            
            print("Creating Platform Tenant for superadmin...")
            platform_tenant = Tenant(name="Platform Admin", slug="platform", domain="platform.insureiq.app")
            session.add(platform_tenant)
            await session.flush()

            print("Creating global superadmin...")
            await create_user(session, platform_data["roles"]["superadmin"].id, "super@platform.com", "Super", "Admin", platform_tenant.id)
            
            print("Seeding Tenant 1 (ABC Insurance)...")
            await seed_tenant(session, "ABC Insurance", "abc", "#1A56FF", platform_data)
            
            print("Seeding Tenant 2 (National Life)...")
            await seed_tenant(session, "National Life", "national", "#12805C", platform_data)
            
        print("Database seeding completed.")

if __name__ == "__main__":
    asyncio.run(seed())
