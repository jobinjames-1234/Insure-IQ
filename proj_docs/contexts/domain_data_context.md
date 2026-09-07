# Project Context: Domain & Data Model

## 1. Purpose
This document explains the core domain models and database relationships of InsureIQ.

## 2. Current Understanding

InsureIQ operates on a multi-tenant B2B2C model, allowing various insurance agencies (Tenants) to serve their policyholders (Customers) while providing internal staff (Agents, Underwriters, Adjusters) with management interfaces.

### 2.1 Core Entities

#### 1. Tenants (`tenants`)
- Represents an insurance agency or brokerage using the InsureIQ platform.
- Has associated settings, branding, and billing/subscription data.
- **Tenant Isolation**: Almost all other tables have a `tenant_id` and are strictly partitioned.

#### 2. Users and Roles (`users`, `roles`, `user_roles`)
- Identity management. Users log in with email/password.
- A user can belong to multiple tenants (via `tenant_users`) or have different roles, though typically a user operates within one tenant context.
- **Key Roles**: `customer`, `agent`, `underwriter`, `adjuster`, `admin`, `superadmin`.

#### 3. Customers (`customers`, `customer_profiles`)
- The end-user policyholders. Linked to a `users` record.
- Have KYC data (Know Your Customer) stored for compliance.

#### 4. Products & Pricing (`insurance_products`, `policy_types`, `coverages`, `premium_bands`)
- The catalog of insurance offerings configured by `admin` users.

#### 5. Applications (`applications`)
- The primary onboarding artifact. A customer applies for a policy type.
- **State Machine**: `draft` -> `submitted` -> `under_review` -> `approved` / `rejected`.
- Analyzed by AI (`risk_scores`).

#### 6. Policies (`policies`)
- An active insurance contract. Created when an `application` is approved.
- Has effective dates, premiums, and linked coverages.

#### 7. Claims (`claims`)
- A request for payout against an active `policy`.
- **State Machine**: `submitted` -> `under_investigation` -> `approved` / `denied`.
- Has associated `claim_documents` and `adjuster_notes`.
- Analyzed by AI (`fraud_flags`).

#### 8. AI Intelligence (Stubs)
- `risk_scores` (Underwriting application risk)
- `fraud_flags` (Claim fraud detection)
- `churn_scores` (Agent retention insights)

## 3. Evidence / Source Locations
- **Core models**: `backend/app/models/` (`core.py`, `user.py`, `customer.py`, `policy.py`, `claim.py`, `billing.py`, `ai_stubs.py`).
- **Schema Docs**: `schemadocs/` directory contains legacy/initial schema planning, but the SQLAlchemy models represent the *actual* running schema.

## 4. Implementation Implications
- Creating a new entity requires adding `tenant_id` and setting up the relationship to `Tenant`.
- SQLAlchemy `lazy="selectin"` is frequently used for async loading of relationships.

## 5. Data Lifecycle
- **Admin**: Configures Products and Users.
- **Customer / Agent**: Creates Applications and Claims.
- **Underwriter**: Reads Applications, creates Decisions -> triggers Policy creation.
- **Adjuster**: Reads Claims, creates Notes/Decisions.
