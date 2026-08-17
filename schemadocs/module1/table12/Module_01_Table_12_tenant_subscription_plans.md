# Step 3 — Table 12: `tenant_subscription_plans`

I checked the Module 1 table inventory and the existing Table 12 source before continuing. The inventory establishes Table 12 as `tenant_subscription_plans`, whose purpose is **“Subscription plan assignments.”**

The existing source defines this table as the record of the SaaS subscription assigned to a tenant, supporting commercial contracts, subscription history, renewals, upgrades, downgrades, and enterprise licensing while separating billing concerns from tenant configuration.

I am deliberately **not copying the degraded `Field | Type | Notes` schema** from the old document. The source's original fields are being preserved, but the schema is being restored to the full:

**Field Name → Data Type → Key Type → Specification → Reason Field Exists**

format, with the same 23-section structure used for the stronger table documentation.

Where I add production-grade interpretation, I explicitly identify it as an architectural inference rather than silently changing the source.

---

# 1. Why This Table Exists

The `tenant_subscription_plans` table records the **SaaS subscription assigned to each tenant**.

The source identifies its responsibilities as:

- Commercial contracts
- Subscription history
- Renewals
- Upgrades
- Downgrades
- Enterprise licensing

while explicitly separating subscription information from general tenant configuration.

This table is therefore the commercial entitlement layer between:

```text
Tenant
   ↓
Subscription
   ↓
Modules
   ↓
Features
```

The relationship is especially important because `tenant_modules` should not independently determine whether a tenant is commercially entitled to a module.

Instead:

```text
Commercial Contract
        ↓
tenant_subscription_plans
        ↓
Licensing Decision
        ↓
tenant_modules
        ↓
tenant_features
```

---

# 2. Business Definition

A **Tenant Subscription Plan** represents the **commercial agreement governing a tenant's access to the InsureIQ platform**.

Examples include:

- Starter
- Basic
- Professional
- Enterprise
- Custom Enterprise

Conceptually:

```text
Tenant
│
├── Subscription Plans
│      ├── Starter
│      ├── Professional
│      ├── Enterprise
│      └── Custom
```

The entity therefore represents a tenant's commercial relationship with InsureIQ.

The table answers:

> **What SaaS subscription is this tenant currently operating under, and what subscription history has the tenant had?**

It does not answer:

> What invoice did the tenant receive?

That belongs to billing/invoicing.

It does not answer:

> What payment was made?

That belongs to payment/financial transaction infrastructure.

It does not answer:

> Which individual feature is enabled?

That belongs to `tenant_features`.

It does not answer:

> Which module is technically provisioned?

That belongs to `tenant_modules`.

---

# 3. Critical Design Principle — What the Entity IS and IS NOT

## The Tenant Subscription Plan IS

- A commercial contract.
- Licensing metadata.
- A child entity of the Tenant aggregate.
- A record of the tenant's SaaS subscription.
- A historical commercial record.
- A basis for licensing decisions.
- A source of subscription lifecycle information.

## The Tenant Subscription Plan IS NOT

- A payment transaction.
- An invoice.
- A payment method.
- A billing ledger.
- A user subscription.
- A feature flag.
- A module provisioning record.
- A user authorization record.

## Critical Separation

The architecture must preserve:

```text
Subscription
    =
commercial agreement
```

versus:

```text
Invoice
    =
billing document
```

versus:

```text
Payment
    =
financial transaction
```

versus:

```text
Module
    =
provisioned application capability
```

versus:

```text
Feature
    =
fine-grained platform capability
```

These should not be collapsed into one table.

---

# 4. Aggregate Root Analysis — DDD Structure

```text
Tenant
│
├── Subscription Plans
│      ├── Starter
│      ├── Professional
│      ├── Enterprise
│      └── Custom
```

The broader Tenant aggregate therefore contains:

```text
Tenant
│
├── Tenant Profile
├── Addresses
├── Contacts
├── Branding
├── Settings
├── Locales
├── Features
├── Feature Overrides
├── Modules
├── Subscription Plans
├── Usage Limits
├── Usage Counters
├── Security Settings
├── Data Regions
├── Backup Policies
├── Integrations
├── Webhooks
└── ...
```

A subscription belongs to a tenant:

```text
Tenant A
   │
   ├── Starter Subscription
   ├── Professional Subscription
   └── Enterprise Subscription
```

but only one should be operationally active at a time.

Historical records remain.

The subscription has its own lifecycle:

```text
trial
   ↓
active
   ↓
suspended
   ↓
expired
```

or:

```text
active
   ↓
cancelled
```

This is distinct from the lifecycle of the tenant itself.

---

# 5. Business Capabilities Supported

| Capability | Supported |
|---|---|
| SaaS subscriptions | Yes |
| Plan upgrades | Yes |
| Plan downgrades | Yes |
| Contract renewals | Yes |
| Billing integration | Yes |
| Commercial history | Yes |
| Payment processing | No |
| Invoice generation | No |
| Feature provisioning | Indirectly |
| Module provisioning | Indirectly |
| User authorization | No |

Typical scenarios include starter tenants receiving a subset of modules, enterprise tenants receiving many modules, and module purchase leading to a provisioning workflow.

---

# 6. Multi-Tenant / Ownership / Isolation Notes

Each subscription belongs to one tenant.

```text
tenant_subscription_plans.tenant_id
        ↓
tenants.id
```

is the fundamental ownership relationship.

Every subscription query must be tenant-scoped.

Correct:

```sql
SELECT *
FROM tenant_subscription_plans
WHERE tenant_id = :tenant_id;
```

Correct for current subscription:

```sql
SELECT *
FROM tenant_subscription_plans
WHERE tenant_id = :tenant_id
AND subscription_status = 'active';
```

An application must never retrieve a subscription solely by `plan_code` without tenant context.

The source defines one active subscription per tenant while historical subscriptions are retained.

---

# 7. Lifecycle

The lifecycle is:

```text
Creation:
Subscription Assigned

Growth:
Plan Upgraded

Modification:
Renewed or Downgraded

Archival:
Subscription Closed
```

A subscription can also move through:

```text
trial
   ↓
active
   ↓
suspended
   ↓
expired
```

or:

```text
active
   ↓
cancelled
```

## Creation — Subscription Assigned

```text
Tenant
   ↓
Subscription Assigned
```

Example:

```text
plan_code = professional
subscription_status = active
contract_start = 2026-08-15
```

## Trial

```text
trial
   ↓
Customer converts
   ↓
active
```

or:

```text
trial
   ↓
Trial ends
   ↓
expired
```

## Upgrade

```text
Starter
   ↓
Upgrade
   ↓
Professional
```

The old subscription should generally be retained as history.

## Downgrade

```text
Enterprise
   ↓
Professional
```

The exact effective-date and proration semantics belong to the later billing design.

## Renewal

A subscription may be renewed:

```text
Enterprise
   ↓
Renewal
   ↓
Enterprise
```

The source calls renewal a lifecycle event but does not dictate whether renewal produces a new physical row. That decision should be aligned with the billing/contract model.

## Suspension

```text
active
   ↓
suspended
```

## Expiration

```text
active
   ↓
expired
```

## Cancellation

```text
active
   ↓
cancelled
```

Cancellation must not imply physical deletion.

---

# 8. Proposed Schema

## Table Name

`tenant_subscription_plans`

## Primary Key Strategy

**UUID**

The source explicitly defines UUID as the primary key.

## Full Field-by-Field Schema Definition

| Field Name | Data Type | Key Type | Specification | Reason Field Exists |
|---|---|---|---|---|
| `id` | UUID | PK | `NOT NULL` | Stable unique identity of the subscription record |
| `tenant_id` | UUID | FK → `tenants.id` | `NOT NULL` | Establishes ownership of the subscription |
| `plan_code` | VARCHAR(100) | — | `NOT NULL` | Stable machine-readable identifier for the subscribed plan |
| `plan_name` | VARCHAR(200) | — | `NOT NULL` | Human-readable commercial plan name |
| `billing_cycle` | ENUM | — | `NOT NULL` | Defines subscription billing cadence |
| `subscription_status` | ENUM | — | `NOT NULL` | Defines current subscription lifecycle state |
| `contract_start` | DATE | — | `NOT NULL` | Establishes the contractual start date |
| `contract_end` | DATE | — | `NULL` | Defines contractual end date when applicable |
| `auto_renew` | BOOLEAN | — | `NOT NULL DEFAULT TRUE` | Indicates whether the subscription should renew automatically |
| `monthly_price` | DECIMAL(12,2) | — | `NULL` | Stores the subscription's monthly commercial price |
| `currency_code` | CHAR(3) | — | `NOT NULL` | Identifies the currency associated with the subscription price |
| `created_at` | TIMESTAMPTZ | — | `NOT NULL` | Records subscription record creation |
| `updated_at` | TIMESTAMPTZ | — | `NOT NULL` | Records the latest subscription record modification |

The source's original field set is preserved above and restored to the full schema-documentation format.

## `id`

The UUID provides the stable technical identity of the subscription record.

## `tenant_id`

Establishes ownership:

```text
tenant_subscription_plans.tenant_id
        ↓
tenants.id
```

Every subscription must belong to exactly one tenant.

## `plan_code`

Stable machine-readable identifier, such as:

```text
starter
basic
professional
enterprise
custom_enterprise
```

Runtime/licensing systems should prefer `plan_code` rather than `plan_name`.

## `plan_name`

Human-readable representation for administration, customer-facing screens, reports, support, and commercial documentation.

## `billing_cycle`

Defines how frequently the subscription is commercially billed.

## `subscription_status`

Represents lifecycle state.

## `contract_start`

Beginning of the contractual period.

## `contract_end`

Optional because some commercial relationships may be open-ended or have renewal handled separately.

## `auto_renew`

The source specifies BOOLEAN with DEFAULT TRUE. It indicates whether the subscription is expected to renew automatically.

It should not be interpreted as proof that renewal actually occurred.

## `monthly_price`

The source specifies DECIMAL(12,2), optional.

This represents the monthly commercial price associated with the subscription.

It is not necessarily the same as an invoice amount because invoices can include taxes, discounts, usage, credits, proration, and one-time charges.

## `currency_code`

Three-character currency identifier, such as:

```text
USD
EUR
INR
GBP
```

## `created_at`

Subscription record creation timestamp.

## `updated_at`

Latest modification timestamp.

---

# 9. Enum Definitions

## `billing_cycle`

| Value | Description |
|---|---|
| `monthly` | Subscription billed monthly |
| `quarterly` | Subscription billed every three months |
| `semi_annual` | Subscription billed every six months |
| `annual` | Subscription billed annually |
| `custom` | Contract has a customized billing cadence |

## `subscription_status`

| Value | Description |
|---|---|
| `trial` | Tenant is using a trial subscription |
| `active` | Subscription is currently active |
| `suspended` | Subscription is temporarily suspended |
| `expired` | Contract/subscription period has ended |
| `cancelled` | Subscription has been cancelled |

The source defines the states but does not specify every allowed transition.

---

# 10. Why `plan_code` Exists

`plan_code` provides a stable internal identifier independent of marketing or display names.

For example:

```text
plan_code = enterprise
plan_name = Enterprise
```

A display name can change without changing the underlying commercial identity.

Therefore:

```text
plan_code
    =
stable machine identity

plan_name
    =
human-facing representation
```

A licensing engine can evaluate:

```sql
WHERE plan_code = 'enterprise'
```

without depending on presentation text.

---

# 11. Candidate Keys

| Key Type | Field(s) | Rationale |
|---|---|---|
| Primary Key | `id` | Stable technical identity |
| Candidate Key | `(tenant_id, contract_start)` | Source-defined candidate key for tenant subscription history |

The source identifies `(tenant_id, contract_start)` as a candidate key.

This should be validated against the final renewal/contract model if the business later permits multiple simultaneous contracts beginning on the same date.

---

# 12. Constraints

| Constraint | Definition | Reason |
|---|---|---|
| Primary Key | `PK(id)` | Unique subscription identity |
| Tenant FK | `tenant_id → tenants.id` | Establishes ownership |
| Tenant/Start Candidate Key | `UNIQUE(tenant_id, contract_start)` | Implements source candidate-key model |
| Active Subscription | One `active` subscription per tenant | Prevents conflicting commercial state |
| Plan Code Required | `plan_code NOT NULL` | Stable plan identity required |
| Plan Name Required | `plan_name NOT NULL` | Commercial display identity required |
| Billing Cycle Required | `billing_cycle NOT NULL` | Contract cadence required |
| Status Required | `subscription_status NOT NULL` | Lifecycle state required |
| Contract Start Required | `contract_start NOT NULL` | Contract must have a beginning |
| Currency Required | `currency_code NOT NULL` | Price requires currency context |
| Auto Renew Default | `auto_renew DEFAULT TRUE` | Source-defined default |
| Timestamp Required | `created_at`, `updated_at NOT NULL` | Lifecycle tracking |

## Production Active-Subscription Constraint

A PostgreSQL implementation can enforce the source business rule with:

```sql
CREATE UNIQUE INDEX uq_active_tenant_subscription
ON tenant_subscription_plans (tenant_id)
WHERE subscription_status = 'active';
```

This allows historical subscriptions while preventing multiple active subscriptions.

A production implementation may additionally consider:

```sql
CHECK (
    contract_end IS NULL
    OR contract_end >= contract_start
);
```

This is an implementation-level enhancement rather than a source-defined constraint.

---

# 13. Relationships

## Incoming References / Logical Consumers

- Billing Service
- Licensing Service
- Usage Enforcement
- Provisioning Service
- Finance Reporting

These are service-level consumers rather than foreign-key relationships.

## Outgoing References

```text
tenant_id → tenants.id
```

## Relationship to `tenant_modules`

```text
tenant_subscription_plans
          ↓
Licensing
          ↓
tenant_modules
```

The source does not define a direct module FK and therefore none should be invented.

## Relationship to Billing

```text
Subscription
     ↓
Billing
     ↓
Invoice
     ↓
Payment
```

Subscription is not itself an invoice or payment.

---

# 14. Cardinality Analysis

The source defines:

```text
Active subscriptions per tenant: 1
Historical subscriptions: Many
```

| Relationship | Cardinality |
|---|---:|
| Tenant → Active Subscription | 0–1 |
| Tenant → Historical Subscriptions | 0–N |
| Subscription → Tenant | Exactly 1 |
| Plan Code → Tenants | 0–N |
| Subscription → Billing Records | 0–N logical |
| Subscription → Lifecycle Events | 1–N logical |

Example:

```text
Tenant A
│
├── Starter
│     status = expired
│
├── Professional
│     status = cancelled
│
└── Enterprise
      status = active
```

---

# 15. Query Patterns

## Retrieve Active Subscription

```sql
SELECT *
FROM tenant_subscription_plans
WHERE tenant_id = :tenant_id
AND subscription_status = 'active';
```

## Retrieve Subscription History

```sql
SELECT *
FROM tenant_subscription_plans
WHERE tenant_id = :tenant_id
ORDER BY contract_start DESC;
```

## Retrieve Current Commercial Plan

```sql
SELECT
    plan_code,
    plan_name,
    billing_cycle,
    subscription_status,
    contract_start,
    contract_end,
    auto_renew,
    monthly_price,
    currency_code
FROM tenant_subscription_plans
WHERE tenant_id = :tenant_id
AND subscription_status = 'active';
```

## Find Expiring Subscriptions

```sql
SELECT *
FROM tenant_subscription_plans
WHERE subscription_status = 'active'
AND contract_end IS NOT NULL
AND contract_end <= CURRENT_DATE + INTERVAL '30 days';
```

## Find Trials

```sql
SELECT *
FROM tenant_subscription_plans
WHERE subscription_status = 'trial';
```

## Retrieve Plan Distribution

```sql
SELECT
    plan_code,
    COUNT(*) AS tenant_count
FROM tenant_subscription_plans
WHERE subscription_status = 'active'
GROUP BY plan_code;
```

## Find Non-Renewing Subscriptions

```sql
SELECT *
FROM tenant_subscription_plans
WHERE subscription_status = 'active'
AND auto_renew = FALSE;
```

---

# 16. Index Strategy

The source recommends:

- `PK(id)`
- `INDEX(tenant_id)`
- `INDEX(subscription_status)`
- `INDEX(contract_end)`
- `INDEX(plan_code)`

## Primary Key

```sql
PRIMARY KEY (id)
```

## Tenant Index

```sql
INDEX(tenant_id)
```

Supports tenant-scoped history queries.

## Subscription Status Index

```sql
INDEX(subscription_status)
```

Supports lifecycle-state queries.

## Contract End Index

```sql
INDEX(contract_end)
```

Important for renewal and expiration processing.

## Plan Code Index

```sql
INDEX(plan_code)
```

Supports plan distribution and plan-specific reporting.

## Recommended Production Composite/Partial Index

For the common current-subscription query:

```sql
CREATE INDEX idx_active_tenant_subscription
ON tenant_subscription_plans (tenant_id)
WHERE subscription_status = 'active';
```

This is an implementation optimization beyond the source's basic index list.

---

# 17. Read / Write Characteristics

The source classifies:

```text
Reads: High
Writes: Low
```

Typical reads:

- Current plan
- Contract expiration
- Auto-renew state
- Currency
- Subscription history
- Licensing state

Typical writes:

- New subscription
- Upgrade
- Downgrade
- Renewal
- Suspension
- Cancellation
- Expiration

Physical deletion should generally be avoided.

---

# 18. Caching Strategy

The source recommends:

```text
tenant-subscription:{tenant_id}
```

in Redis.

Conceptual cache value:

```json
{
  "plan_code": "enterprise",
  "plan_name": "Enterprise",
  "billing_cycle": "annual",
  "subscription_status": "active",
  "contract_start": "2026-01-01",
  "contract_end": "2026-12-31",
  "auto_renew": true,
  "monthly_price": 2500.00,
  "currency_code": "USD"
}
```

Runtime flow:

```text
Request
   ↓
Tenant Context
   ↓
Redis
tenant-subscription:{tenant_id}
   │
   ├── HIT → Subscription State
   │
   └── MISS
        ↓
   tenant_subscription_plans
        ↓
      Redis
```

Cache invalidation should occur when subscriptions are assigned, renewed, upgraded, downgraded, suspended, cancelled, or expired.

The database remains authoritative.

---

# 19. Security Considerations

The source explicitly requires:

- Tenant-scoped administration.
- RBAC.
- Restricted access to commercial data.
- Audit logging.

Commercially sensitive data includes:

```text
plan_code
monthly_price
contract dates
auto_renew
subscription status
```

Subscription administration should require elevated privileges.

A client must never be able to submit:

```json
{
  "plan_code": "enterprise",
  "subscription_status": "active"
}
```

and grant itself enterprise access.

The backend must validate commercial authorization before changing subscription state.

---

# 20. Audit Requirements

The source defines:

| Event | Trigger | Purpose |
|---|---|---|
| `TenantSubscriptionAssigned` | Subscription assigned | Record initial commercial relationship |
| `TenantSubscriptionRenewed` | Contract renewed | Record renewal |
| `TenantSubscriptionUpgraded` | Plan upgraded | Record higher-tier transition |
| `TenantSubscriptionDowngraded` | Plan downgraded | Record lower-tier transition |
| `TenantSubscriptionCancelled` | Subscription cancelled | Record termination |

A production audit payload should consider:

```text
event_id
tenant_id
subscription_id
actor_id
previous_plan_code
new_plan_code
previous_status
new_status
effective_at
reason
occurred_at
correlation_id
source_service
```

The exact payload is a production recommendation rather than a source-defined contract.

---

# 21. Event Producers / Event Consumers

## Producers

Typical producers include:

- Licensing/Subscription Service
- Administrative Service
- Billing/Commercial Workflow
- Renewal Workflow

Source-defined events include:

- `TenantSubscriptionAssigned`
- `TenantSubscriptionRenewed`
- `TenantSubscriptionUpgraded`

## Consumers

- Billing Service
- Licensing Service
- Provisioning Service
- Finance Reporting

### Subscription Assignment Workflow

```text
Commercial Administrator
        ↓
Subscription Service
        ↓
tenant_subscription_plans
        ↓
TenantSubscriptionAssigned
        ↓
Event Bus
    ┌───────┼────────┬──────────────┐
    ▼       ▼        ▼              ▼
 Billing Licensing Provisioning Finance
```

### Upgrade Workflow

```text
Tenant requests upgrade
        ↓
Commercial validation
        ↓
Subscription updated
        ↓
TenantSubscriptionUpgraded
        ↓
Licensing Service
        ↓
Module reconciliation
        ↓
Provisioning Service
```

### Downgrade Workflow

```text
Enterprise
    ↓
Downgrade approved
    ↓
Subscription change
    ↓
TenantSubscriptionDowngraded
    ↓
Licensing
    ↓
Determine removed entitlements
    ↓
Provisioning
    ↓
Deprovision affected modules
```

The exact downgrade behavior must be defined by the later licensing/provisioning design.

---

# 22. Alternative Designs Considered

| Option | Description | Verdict |
|---|---|---|
| A | Store subscription in `tenants` | Rejected |
| B | JSON contract | Rejected |
| C | Dedicated table | Chosen |

## Option A — Store Subscription in `tenants`

Rejected because it would overload the tenant root and make subscription history difficult.

It would lose the explicit historical sequence:

```text
Starter
   ↓
Professional
   ↓
Enterprise
```

## Option B — JSON Contract

Rejected because a subscription is a stable, queryable business entity and JSON would weaken:

- relational integrity,
- indexing,
- lifecycle queries,
- historical modeling,
- constraints,
- reporting,
- commercial analytics.

## Option C — Dedicated Table

Chosen because it provides:

- tenant isolation,
- subscription history,
- lifecycle management,
- queryability,
- commercial reporting,
- licensing integration,
- clean separation from billing transactions.

---

# 23. Final Design Assessment

| Attribute | Rating |
|---|---|
| Complexity | **Medium** |
| Read Volume | **High** |
| Write Volume | **Low** |
| Security Importance | **High** |
| Business Criticality | **Very High** |
| Scalability | **Excellent** |
| Data Volatility | **Medium** |
| Runtime Importance | **Very High** |
| Recommended Status | **Core Business Table** |

---

# Overall Design Assessment

`tenant_subscription_plans` is one of the most important tables in Tenant Management because it connects the tenant to the **commercial SaaS model**.

It forms the commercial layer between tenant ownership and technical provisioning:

```text
                         TENANT
                            │
                            ▼
              ┌────────────────────────┐
              │ tenant_subscription_   │
              │ plans                  │
              │                        │
              │ Commercial Agreement   │
              └───────────┬────────────┘
                          │
                          ▼
                    Licensing
                          │
             ┌────────────┴────────────┐
             ▼                         ▼
      tenant_modules             Usage Limits
             │
             ▼
      tenant_features
             │
             ▼
 tenant_feature_overrides
```

## Example: Full Commercial-to-Technical Flow

```text
1. Commercial Contract

tenant_subscription_plans
    plan_code = enterprise
    status = active
```

Then:

```text
2. Licensing

Enterprise entitlement evaluated
```

Then:

```text
3. Module Provisioning

tenant_modules

claims_management = active
underwriting       = active
billing            = active
ai                 = active
reporting          = active
```

Then:

```text
4. Feature Entitlements

tenant_features

fraud_detection    = enabled
ocr                = enabled
predictive_claims  = enabled
```

Then, if a temporary exception exists:

```text
5. Feature Override

tenant_feature_overrides

predictive_claims
    ↓
beta_enable
    ↓
expires in 30 days
```

This produces a clean hierarchy:

```text
Commercial Agreement
        ↓
Module Entitlement
        ↓
Feature Entitlement
        ↓
Feature Exception
```

---

## Critical Production Invariants

1. **Every subscription belongs to exactly one tenant.**
2. **A tenant should have at most one active subscription at a time.**
3. **Historical subscriptions must be retained.**
4. **`plan_code` is the stable machine-readable plan identity.**
5. **`plan_name` is display/commercial metadata.**
6. **Subscription status is distinct from tenant status.**
7. **Subscription is not an invoice.**
8. **Subscription is not a payment transaction.**
9. **Subscription is not a module.**
10. **Subscription is not a feature.**
11. **Commercial entitlement should drive licensing rather than clients directly manipulating module/feature state.**
12. **Tenant isolation must apply to every subscription query and mutation.**
13. **Subscription changes must be strongly authorized.**
14. **Commercial information should have restricted access.**
15. **Subscription lifecycle changes must be auditable.**
16. **Subscription changes should invalidate the tenant's subscription cache.**
17. **Redis is an acceleration layer, not the commercial source of truth.**
18. **Historical subscription records should not be physically deleted.**
19. **The active-subscription invariant should ideally be enforced at the database level.**
20. **Billing/invoice/payment models should remain separate from this table.**
21. **Module provisioning should consume licensing decisions rather than directly modifying subscription records.**
22. **Downgrades must trigger entitlement reconciliation, but the exact reconciliation behavior belongs to the licensing/provisioning design.**
23. **Renewal semantics must be finalized with the billing/contract model; the source does not specify whether renewal always creates a new physical subscription row.**
24. **Do not invent fields such as `invoice_id`, `payment_id`, `subscription_item_id`, or `offer_id` into this table unless the broader schema explicitly requires them.**
25. **The source-defined field set remains the authoritative Table 12 starting point.**

---

## Final Conceptual Model

```text
┌─────────────────────────────────┐
│             Tenant              │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│   tenant_subscription_plans     │
│                                 │
│ Commercial Agreement            │
│                                 │
│ plan_code                       │
│ billing_cycle                   │
│ contract_start                  │
│ contract_end                    │
│ auto_renew                      │
│ monthly_price                   │
│ currency_code                   │
│ subscription_status             │
└────────────────┬────────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ Licensing       │
        │ Engine          │
        └────────┬────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│       tenant_modules            │
│                                 │
│ High-Level Application Access   │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│       tenant_features           │
│                                 │
│ Fine-Grained Capabilities       │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│   tenant_feature_overrides      │
│                                 │
│ Exceptional Feature Treatment   │
└─────────────────────────────────┘
```

The essential architectural distinction is:

> **`tenant_subscription_plans` represents the tenant's commercial SaaS agreement; it does not represent the downstream technical resources that agreement enables.**

That separation is what allows InsureIQ to support **subscription history, upgrades, downgrades, renewals, enterprise licensing, module provisioning, feature licensing, and billing integration** without turning the tenant root table into an overloaded commercial configuration object.
