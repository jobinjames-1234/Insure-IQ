# Step 1 — Module 1: Tenant Management

## Why This Module Exists

The **Tenant Management** module is the foundation of the entire InsureIQ platform. It establishes the platform as a **multi-tenant Software-as-a-Service (SaaS)** application, where multiple insurance companies (tenants) share the same application while remaining completely isolated from one another.

Without this module:

- Multiple insurance companies could not safely use the same platform.
- Data isolation between insurers would not exist.
- Tenant-specific branding would be impossible.
- Separate subscription plans could not be managed.
- Per-tenant configuration would not exist.
- Usage limits and licensing could not be enforced.
- API credentials and integrations would not be tenant-specific.
- Security policies could not differ between insurers.

Every business object in InsureIQ ultimately belongs to exactly one tenant. The Tenant Management module therefore defines the highest business ownership boundary across the platform. fileciteturn3file2L1-L30

---

## Business Definition

A **Tenant** represents an independent insurance organization using the InsureIQ platform.

Examples include:

- ABC Insurance Ltd.
- National Life Insurance
- Secure Health Insurance
- Global Motor Insurance
- Regional Mutual Insurance

Each tenant owns:

- Users
- Customers
- Insurance products
- Policies
- Claims
- Documents
- AI models
- Reports
- Billing
- Configurations
- Integrations

A tenant is **not** an employee, customer, or policyholder. It is the organization that owns all operational data within its isolated workspace. fileciteturn3file2L1-L30

---

## Critical Design Principle

The Tenant:

- **IS** the highest business ownership boundary.
- **IS** the primary multi-tenant isolation boundary.
- **IS NOT** an individual user.
- **IS NOT** a customer.
- **IS NOT** an insurance policy.
- **IS NOT** a subscription itself (subscriptions belong to tenants).

Every operational module references the tenant either directly or indirectly. fileciteturn3file2L1-L30

---

# Tables in This Module

| # | Table | Purpose |
|---|---|---|
| 1 | `tenants` | Primary tenant (insurance company) record |
| 2 | `tenant_profiles` | Extended tenant business profile |
| 3 | `tenant_addresses` | Physical and mailing addresses |
| 4 | `tenant_contacts` | Contact persons and communication details |
| 5 | `tenant_domains` | Custom domains used by tenants |
| 6 | `tenant_branding` | Logos, themes, colors, branding assets |
| 7 | `tenant_settings` | Tenant-wide application settings |
| 8 | `tenant_locales` | Language, timezone, regional settings |
| 9 | `tenant_features` | Enabled platform features |
| 10 | `tenant_feature_overrides` | Tenant-specific feature overrides |
| 11 | `tenant_modules` | Enabled application modules |
| 12 | `tenant_subscription_plans` | Subscription plan assignments |
| 13 | `tenant_usage_limits` | Licensed usage limits |
| 14 | `tenant_usage_counters` | Current platform usage statistics |
| 15 | `tenant_status_history` | Historical tenant status changes |
| 16 | `tenant_lifecycle_events` | Tenant lifecycle event history |
| 17 | `tenant_api_credentials` | API keys and authentication credentials |
| 18 | `tenant_oauth_clients` | OAuth client registrations |
| 19 | `tenant_security_settings` | Tenant-specific security policies |
| 20 | `tenant_data_regions` | Data residency and storage regions |
| 21 | `tenant_backup_policies` | Backup and recovery configuration |
| 22 | `tenant_integrations` | Connected third-party integrations |
| 23 | `tenant_webhooks` | Tenant webhook registrations |
| 24 | `tenant_email_settings` | Email provider configuration |
| 25 | `tenant_sms_settings` | SMS provider configuration |
| 26 | `tenant_storage_settings` | Storage quotas and object storage configuration |
| 27 | `tenant_provisioning_logs` | Tenant provisioning and deployment history |

This module serves as the **root ownership domain** for the entire InsureIQ platform. Every major business domain—including Identity, Customer Management, Policies, Claims, Billing, AI, Reporting, Workflow, Finance, Marketplace, and Integrations—ultimately belongs to a tenant. It is the foundation upon which all remaining modules are built. fileciteturn3file0

**Step 1 is complete.** I will wait for your confirmation before producing **Step 2 — the exact `.md` file**.
