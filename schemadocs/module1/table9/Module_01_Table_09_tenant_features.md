# Step 3 — Table 9: `tenant_features`

The `tenant_features` table manages **tenant-specific feature entitlements**.

The Module 1 inventory identifies Table 9 as `tenant_features`, with the purpose **“Enabled platform features.”**

The existing detailed design defines a Tenant Feature as a platform capability that can be enabled or disabled for an individual tenant. It specifically supports **feature licensing, feature flags, enterprise customization, progressive rollout, and SaaS entitlement management**.

Examples from the source include:

```text
Claims Management
AI Fraud Detection
Customer Portal
API Access
OCR Processing
```

The critical architectural distinction is:

```text
tenant_modules
      ↓
High-level application module entitlement

tenant_features
      ↓
Specific capability entitlement

tenant_feature_overrides
      ↓
Exception to the normal feature entitlement
```

A feature is therefore more granular than an application module.

For example:

```text
Module:
    Claims Management

Features:
    claim_auto_assignment
    claim_fraud_detection
    claim_document_ocr
    claim_customer_notifications
```

This allows InsureIQ to sell, provision, roll out, or restrict capabilities independently without changing application code.

---

# 1. Why This Table Exists

A production SaaS platform cannot assume that every tenant receives exactly the same capabilities.

Different subscription tiers, contracts, enterprise agreements, trials, and rollout programs may provide different functionality.

For example:

```text
Tenant A — Basic

Claims Management
Customer Portal
API Access
```

while:

```text
Tenant B — Enterprise

Claims Management
AI Fraud Detection
OCR Processing
Customer Portal
API Access
Advanced Analytics
```

The existing design specifically states that `tenant_features` enables:

- subscription-based licensing,
- feature flags,
- progressive rollouts,
- enterprise customization,

without changing application code.

Without this table, feature entitlement logic could become scattered across:

```text
subscription code
application configuration
environment variables
hard-coded conditionals
user permissions
tenant settings
```

That would create serious architectural problems.

For example:

```python
if tenant.subscription == "enterprise":
    enable_ai_fraud_detection()
```

is inferior to:

```text
tenant_features
    feature_code = ai_fraud_detection
    is_enabled = TRUE
```

because the latter separates **commercial entitlement** from application implementation.

---

## The Feature Entitlement Layer

The intended architecture is:

```text
Subscription
     ↓
Licensing
     ↓
Tenant Feature Entitlement
     ↓
Runtime Feature Check
     ↓
Application Capability
```

For example:

```text
Enterprise Subscription
        ↓
AI Fraud Detection entitled
        ↓
tenant_features
        ↓
is_enabled = TRUE
        ↓
Fraud Detection Service available
```

This means the application does not need to hard-code every subscription's feature set.

---

# 2. Business Definition

A **Tenant Feature** represents a platform capability enabled or disabled for a specific tenant.

The source explicitly provides these examples:

```text
Claims Management
AI Fraud Detection
Customer Portal
API Access
OCR Processing
```

The entity therefore represents:

```text
Tenant
   +
Feature
   +
Entitlement State
```

Conceptually:

```text
Tenant
│
└── Tenant Features
      │
      ├── Policy Management
      ├── Claims Management
      ├── AI Services
      ├── Customer Portal
      ├── Mobile App
      └── API Access
```

The feature assignment answers:

> **Does this tenant have this particular platform capability?**

It does not answer:

> **Is this user allowed to use it?**

That distinction belongs to Identity and Access Management.

---

# 3. Critical Design Principle — What the Entity IS and IS NOT

## The Tenant Feature IS

- A feature entitlement.
- Licensing metadata.
- Tenant-specific capability configuration.
- A child entity of the Tenant aggregate.
- A runtime feature availability source.
- A mechanism for enterprise customization.
- A mechanism for progressive feature rollout.
- A SaaS entitlement-management record.

## The Tenant Feature IS NOT

- A user permission.
- A user role.
- An application permission.
- Application source code.
- A subscription contract itself.
- A billing transaction.
- A feature override.
- A module assignment.

This distinction is essential.

For example:

```text
tenant_features
    ↓
Tenant has AI Fraud Detection
```

does not automatically mean:

```text
Every employee can use AI Fraud Detection
```

User authorization is a separate concern.

Similarly:

```text
tenant_features
    ↓
Claims module has OCR capability
```

is different from:

```text
tenant_modules
    ↓
Claims Management module is provisioned
```

---

# 4. Aggregate Root Analysis — DDD Structure

The Tenant remains the aggregate root.

```text
Tenant
│
├── Tenant Features
│      │
│      ├── Policy Management
│      ├── Claims Management
│      ├── AI Services
│      ├── Customer Portal
│      ├── Mobile App
│      └── API Access
│
├── Tenant Modules
├── Tenant Subscription
├── Tenant Settings
├── Tenant Branding
├── Tenant Locales
└── ...
```

The source explicitly models Tenant Features as children of Tenant.

---

## Relationship to Modules

The conceptual hierarchy is:

```text
Tenant
   │
   ├── Module Entitlements
   │      │
   │      └── Claims Management
   │
   └── Feature Entitlements
          │
          ├── Fraud Detection
          ├── OCR
          ├── Auto Assignment
          └── Customer Portal
```

This separation allows the platform to distinguish:

```text
"Does the tenant have the Claims module?"
```

from:

```text
"Does the tenant have AI Fraud Detection?"
```

---

## Relationship to Feature Overrides

`tenant_features` is the **base entitlement**.

`tenant_feature_overrides` represents an exception.

Therefore:

```text
tenant_features
       │
       ▼
Base entitlement
       │
       ▼
tenant_feature_overrides
       │
       ▼
Temporary / exceptional runtime behavior
```

This is consistent with the separate Table 10 design, which explicitly states that overrides are not the primary feature assignment.

---

# 5. Business Capabilities Supported

| Capability | Supported |
|---|---|
| Feature licensing | Yes |
| Feature flags | Yes |
| Enterprise customization | Yes |
| Progressive rollout | Yes |
| SaaS entitlement management | Yes |
| Tenant-specific feature enablement | Yes |
| Tenant-specific feature disablement | Yes |
| Subscription-driven provisioning | Yes |
| Runtime feature checks | Yes |
| Feature categorization | Yes |
| User authorization | No |
| Role management | No |
| Application source-code management | No |
| Billing transactions | No |
| Feature exceptions/overrides | No — dedicated table |

The source explicitly identifies the primary capabilities as feature licensing, feature flags, enterprise customization, progressive rollout, and SaaS entitlement management.

---

# 6. Multi-Tenant / Ownership / Isolation Notes

Each feature assignment belongs to exactly one tenant.

Therefore:

```text
Tenant A
   ├── claims_management
   ├── customer_portal
   └── api_access

Tenant B
   ├── claims_management
   ├── ai_fraud_detection
   ├── ocr_processing
   └── advanced_analytics
```

The same feature can exist for many tenants, but each tenant receives its own entitlement record.

---

## Tenant Isolation

Runtime feature resolution must always be tenant-scoped.

Correct:

```sql
SELECT is_enabled
FROM tenant_features
WHERE tenant_id = :tenant_id
AND feature_code = :feature_code;
```

Incorrect:

```sql
SELECT is_enabled
FROM tenant_features
WHERE feature_code = :feature_code;
```

The second query does not identify which tenant's entitlement is being evaluated.

---

## Security Boundary

A feature entitlement is commercially and operationally sensitive.

A tenant must not be able to modify:

```text
tenant_id
feature_code
```

through an ordinary client-side request and thereby grant itself features.

A secure flow is:

```text
Subscription / Licensing Authority
             ↓
Feature Assignment Service
             ↓
tenant_features
             ↓
Runtime Feature Evaluation
```

Tenant administrators may be allowed to manage some features, but commercially controlled features should be governed by the licensing/provisioning layer.

---

# 7. Lifecycle

The source defines the lifecycle as:

```text
Creation:
Tenant Created
      ↓
Default Features Assigned

Growth:
Subscription Upgraded
      ↓
New Features Enabled

Modification:
Feature Enabled or Disabled

Archival:
Tenant Archived
      ↓
Feature Assignments Archived
```

---

## Creation

During tenant provisioning:

```text
Tenant Created
      ↓
Determine Subscription
      ↓
Resolve Default Feature Set
      ↓
Create tenant_features
```

For example:

```text
Basic Plan
    ↓
20 features

Enterprise Plan
    ↓
150 features
```

The feature records then become the tenant's operational entitlement state.

---

## Growth

When a tenant upgrades:

```text
Basic
   ↓
Professional
   ↓
Enterprise
```

the licensing service may add new feature assignments.

For example:

```text
Before:

AI Fraud Detection
    is_enabled = FALSE

After Upgrade:

AI Fraud Detection
    is_enabled = TRUE
```

---

## Modification

A feature can transition:

```text
Enabled
   ↓
Disabled
```

or:

```text
Disabled
   ↓
Enabled
```

The timestamps:

```text
enabled_at
disabled_at
```

provide lifecycle context.

---

## Progressive Rollout

The source explicitly supports progressive rollout.

For example:

```text
Feature:
    advanced_claim_prediction

rollout_version:
    v2
```

The tenant may receive a specific version of a capability during staged deployment.

---

## Archival

When a tenant is archived:

```text
Tenant Archived
      ↓
Feature Assignments Archived
```

The source explicitly defines this lifecycle.

Physical deletion should generally be avoided because feature entitlement history can be useful for:

- billing,
- compliance,
- support,
- audit,
- incident investigation.

---

# 8. Proposed Schema

## Table Name

`tenant_features`

## Primary Key Strategy

**UUID**

The source explicitly specifies UUID as the primary key.

```text
id UUID PRIMARY KEY
```

---

## Full Schema Definition

| Field Name | Data Type | Key | Specification | Reason Field Exists |
|---|---|---|---|---|
| `id` | UUID | PK | `NOT NULL` | Stable unique identity of the tenant feature entitlement |
| `tenant_id` | UUID | FK → `tenants.id` | `NOT NULL` | Establishes tenant ownership and isolation |
| `feature_code` | VARCHAR(100) | UK with `tenant_id` | `NOT NULL` | Stable machine-readable identifier used for runtime feature checks |
| `feature_name` | VARCHAR(200) | — | `NOT NULL` | Human-readable feature name |
| `feature_category` | ENUM | — | `NOT NULL` | Classifies the feature for management and reporting |
| `is_enabled` | BOOLEAN | — | `NOT NULL DEFAULT TRUE` | Determines whether the tenant currently has the feature enabled |
| `enabled_at` | TIMESTAMPTZ | — | `NULL` | Records when the feature was enabled |
| `disabled_at` | TIMESTAMPTZ | — | `NULL` | Records when the feature was disabled |
| `rollout_version` | VARCHAR(50) | — | `NULL` | Identifies a feature rollout/version where progressive rollout is used |
| `created_at` | TIMESTAMPTZ | — | `NOT NULL` | Records creation of the entitlement |
| `updated_at` | TIMESTAMPTZ | — | `NOT NULL` | Records the latest entitlement modification |

---

## `feature_code`

This is the most important business identifier.

It provides a stable machine-readable identifier for runtime feature checks.

Examples:

```text
claims_management
ai_fraud_detection
customer_portal
api_access
ocr_processing
```

The application should use:

```text
feature_code
```

rather than:

```text
feature_name
```

for runtime logic.

---

## Why Runtime Code Must Not Depend on `feature_name`

Bad:

```python
if feature.name == "AI Fraud Detection":
```

Good:

```python
if feature.code == "ai_fraud_detection":
```

The display name can change:

```text
"AI Fraud Detection"
```

→

```text
"AI-Powered Fraud Detection"
```

without breaking application behavior.

The code remains stable.

---

## `feature_name`

This is the human-readable representation.

Examples:

```text
Claims Management
AI Fraud Detection
Customer Portal
API Access
OCR Processing
```

It exists primarily for:

- administration,
- dashboards,
- support,
- reporting,
- UI.

It should not be used as the machine identity.

---

## `feature_category`

The source defines this as an ENUM.

It provides a broad classification of the feature.

For example:

```text
feature_category = ai
```

for:

```text
AI Fraud Detection
```

This enables:

- administrative grouping,
- reporting,
- feature catalog management,
- licensing analysis.

---

## `is_enabled`

This is the runtime entitlement state.

```text
TRUE
    ↓
Feature enabled

FALSE
    ↓
Feature disabled
```

It is important to distinguish this from:

```text
feature exists
```

The platform may know that a feature exists globally while a particular tenant does not have access to it.

---

## `enabled_at`

Records when the entitlement became enabled.

Example:

```text
2026-08-15 10:00:00+05:30
```

This is useful for:

- audit,
- subscription upgrades,
- rollout analysis,
- support,
- entitlement history.

---

## `disabled_at`

Records when the feature was disabled.

For an active feature:

```text
disabled_at = NULL
```

For a disabled feature:

```text
disabled_at = timestamp
```

---

## `rollout_version`

The source defines this as optional and provides `VARCHAR(50)`.

It allows feature rollout metadata such as:

```text
v1
v2
beta-2026-08
2026.08
```

The field should not be confused with the software application's global version.

It specifically describes the feature rollout state associated with the tenant.

---

# 9. Enum Definitions

## `feature_category`

The source defines the following values:

| Value | Description |
|---|---|
| `core` | Core platform capability |
| `policy` | Policy-related functionality |
| `claims` | Claims-related functionality |
| `customer` | Customer-facing functionality |
| `ai` | Artificial intelligence capabilities |
| `analytics` | Analytics and reporting capabilities |
| `integration` | External integration capabilities |
| `security` | Security-related capabilities |
| `workflow` | Workflow and automation capabilities |
| `mobile` | Mobile application functionality |
| `other` | Features that do not fit another category |

---

## Why the Category Matters

The category is not the entitlement itself.

For example:

```text
feature_code:
    ai_fraud_detection

feature_category:
    ai

is_enabled:
    true
```

The category provides organization and classification while:

```text
feature_code
```

provides identity.

---

# 10. Why `feature_code` Exists

`feature_code` is the stable machine-readable identifier used for runtime feature checks.

This is critical to the architecture.

A runtime service should be able to ask:

```text
Does Tenant X have:
    ai_fraud_detection?
```

without knowing:

- subscription names,
- marketing plan names,
- display labels,
- internal database IDs.

The runtime contract becomes:

```text
tenant_id
     +
feature_code
     ↓
entitlement state
```

For example:

```sql
SELECT is_enabled
FROM tenant_features
WHERE tenant_id = :tenant_id
AND feature_code = 'ai_fraud_detection';
```

This creates a stable boundary between:

```text
Licensing
```

and:

```text
Application Runtime
```

---

# 11. Candidate Keys

| Key Type | Field(s) | Rationale |
|---|---|---|
| Primary Key | `id` | Stable technical identity |
| Candidate / Alternate Key | `(tenant_id, feature_code)` | A tenant can have only one base entitlement record for a feature |

---

## Why `feature_code` Alone Is Not Unique

The same feature can be enabled for many tenants:

```text
Tenant A → ai_fraud_detection
Tenant B → ai_fraud_detection
Tenant C → ai_fraud_detection
```

Therefore:

```text
UNIQUE(feature_code)
```

would be incorrect.

The correct uniqueness boundary is:

```text
UNIQUE(tenant_id, feature_code)
```

---

# 12. Constraints

The source explicitly defines:

```text
PK(id)
FK(tenant_id)
UNIQUE(tenant_id, feature_code)
```

The production-grade constraint model is therefore:

| Constraint | Definition | Reason |
|---|---|---|
| Primary Key | `PK(id)` | Stable entitlement identity |
| Tenant FK | `tenant_id → tenants.id` | Establishes ownership |
| Feature Uniqueness | `UNIQUE(tenant_id, feature_code)` | Prevents duplicate base entitlements |
| Required Tenant | `tenant_id NOT NULL` | Every feature belongs to a tenant |
| Required Code | `feature_code NOT NULL` | Runtime identity required |
| Required Name | `feature_name NOT NULL` | Human-readable administration value |
| Required Category | `feature_category NOT NULL` | Classification required |
| Enabled Default | `is_enabled DEFAULT TRUE` | New assignments are enabled by default according to source |
| Timestamp Integrity | `created_at`, `updated_at NOT NULL` | Lifecycle tracking |

---

## Referential Integrity

The database must prevent:

```text
tenant_features.tenant_id
```

from referencing a nonexistent tenant.

---

## Duplicate Feature Prevention

Without the composite unique constraint, this could happen:

```text
Tenant A
    ├── ai_fraud_detection
    └── ai_fraud_detection
```

which makes runtime entitlement resolution ambiguous.

The correct invariant is:

```text
ONE TENANT
    +
ONE FEATURE CODE
    ↓
ONE BASE FEATURE ENTITLEMENT
```

---

# 13. Relationships

## Incoming References

The source identifies:

- Feature Flag Service.
- Subscription Service.
- API Gateway.
- UI Rendering.

Additional logical consumers include:

- Licensing Service.
- Provisioning Service.
- Billing.
- Workflow Engine.
- AI Services.
- Monitoring.

---

## Outgoing References

```text
tenant_features.tenant_id
        ↓
tenants.id
```

This is the primary relational dependency.

---

## Relationship to `tenant_feature_overrides`

Table 10 contains:

```text
feature_id → tenant_features.id
```

The source explicitly defines this relationship for the feature override table.

Therefore:

```text
Tenant
   │
   └── tenant_features
          │
          └── tenant_feature_overrides
```

This is a very important part of the module architecture.

---

## Relationship Diagram

```text
                         ┌──────────────┐
                         │    Tenant    │
                         └──────┬───────┘
                                │
                              1 │ N
                                ▼
                    ┌────────────────────┐
                    │  tenant_features   │
                    ├────────────────────┤
                    │ id                 │
                    │ tenant_id          │
                    │ feature_code       │
                    │ feature_name       │
                    │ feature_category   │
                    │ is_enabled         │
                    │ enabled_at         │
                    │ disabled_at        │
                    │ rollout_version    │
                    │ created_at         │
                    │ updated_at          │
                    └──────────┬─────────┘
                               │
                               │ 1:N
                               ▼
                    tenant_feature_overrides
                               │
                               ▼
                     Runtime Exception
```

---

# 14. Cardinality Analysis

The source defines:

```text
Features per tenant: 20–300
```

Therefore:

| Relationship | Expected Cardinality |
|---|---:|
| Tenant → Features | 20–300 |
| Feature → Tenant | Exactly 1 |
| Tenant → Enabled Features | 0–300 |
| Tenant → Disabled Features | 0–300 |
| Feature → Overrides | 0–N |
| Feature → Runtime Consumers | 1–N |

---

## Platform Scale

Assume:

```text
100,000 tenants
```

and an average:

```text
100 features per tenant
```

Then:

```text
100,000 × 100
=
10,000,000 tenant feature records
```

At the upper conceptual range:

```text
100,000 × 300
=
30,000,000 records
```

This is still manageable in a properly indexed relational database.

However, because this table participates in runtime feature checks, **query efficiency and caching matter more than raw storage size**.

---

# 15. Query Patterns

The primary runtime query is:

```sql
SELECT *
FROM tenant_features
WHERE tenant_id = :tenant_id
AND is_enabled = TRUE;
```

This retrieves all currently enabled features for a tenant.

---

## Retrieve a Specific Feature

```sql
SELECT is_enabled
FROM tenant_features
WHERE tenant_id = :tenant_id
AND feature_code = :feature_code;
```

This is the fundamental runtime entitlement check.

---

## Retrieve All Tenant Features

```sql
SELECT *
FROM tenant_features
WHERE tenant_id = :tenant_id;
```

Useful for:

- administration,
- licensing dashboards,
- support,
- provisioning.

---

## Retrieve Features by Category

```sql
SELECT *
FROM tenant_features
WHERE tenant_id = :tenant_id
AND feature_category = :category;
```

Useful for administrative interfaces.

---

## Retrieve Enabled AI Features

```sql
SELECT feature_code
FROM tenant_features
WHERE tenant_id = :tenant_id
AND feature_category = 'ai'
AND is_enabled = TRUE;
```

---

## Retrieve Feature Rollout

```sql
SELECT
    feature_code,
    rollout_version,
    is_enabled
FROM tenant_features
WHERE tenant_id = :tenant_id
AND rollout_version IS NOT NULL;
```

Useful for progressive rollout management.

---

# 16. Index Strategy

The source recommends:

- `PK(id)`
- `INDEX(tenant_id)`
- `UNIQUE(tenant_id, feature_code)`
- `INDEX(feature_category)`
- `INDEX(is_enabled)`

These should be interpreted according to actual production query patterns.

---

## Primary Key

```sql
PRIMARY KEY (id)
```

Provides direct record identity.

---

## Tenant Index

```sql
INDEX(tenant_id)
```

Supports:

```sql
SELECT *
FROM tenant_features
WHERE tenant_id = ?;
```

This is a common administrative and runtime query.

---

## Composite Unique Index

```sql
UNIQUE(tenant_id, feature_code)
```

This is especially important because it:

1. Enforces the candidate key.
2. Supports exact feature lookup.

For:

```sql
WHERE tenant_id = ?
AND feature_code = ?
```

this composite index is highly effective.

---

## Category Index

```text
INDEX(feature_category)
```

can support feature catalog and administrative reporting.

However, if most queries are tenant-scoped, a composite index such as:

```text
(tenant_id, feature_category)
```

may eventually be more useful.

That should be driven by actual query plans rather than added blindly.

---

## `is_enabled` Index

The source recommends:

```text
INDEX(is_enabled)
```

But `BOOLEAN` is low-cardinality.

A standalone boolean index may not provide substantial benefit depending on table size and data distribution.

A more workload-specific index may be:

```sql
CREATE INDEX idx_tenant_enabled_features
ON tenant_features (tenant_id)
WHERE is_enabled = TRUE;
```

This is an implementation optimization, not a replacement for the source schema.

---

# 17. Read / Write Characteristics

The source explicitly classifies:

```text
Reads: Very High
Writes: Very Low
```

This is one of the most important characteristics of the table.

---

## Read Workload

Feature checks can occur throughout the application.

Examples:

```text
API Gateway
UI Rendering
Workflow Engine
AI Services
Claims
Billing
Subscription
Reporting
```

A request might repeatedly need to answer:

```text
Does this tenant have feature X?
```

Therefore runtime reads can be extremely frequent.

---

## Write Workload

Writes are comparatively rare.

Typical writes:

```text
Tenant Provisioning
Subscription Upgrade
Subscription Downgrade
Feature Enabled
Feature Disabled
Enterprise Feature Assignment
Feature Rollout
```

This produces the ideal workload for caching.

---

## Updates

A feature assignment may be updated when:

```text
is_enabled changes
rollout_version changes
feature metadata changes
```

---

## Deletes

Physical deletion should generally be avoided.

Instead:

```text
is_enabled = FALSE
```

and/or tenant archival should preserve the historical entitlement.

---

# 18. Caching Strategy

The source explicitly recommends Redis:

```text
tenant-features:{tenant_id}
```

This is highly appropriate because the workload is:

```text
Very High Reads
Very Low Writes
```

---

## Recommended Cache Structure

Example:

```text
tenant-features:tenant-123
```

Value:

```json
{
  "claims_management": true,
  "ai_fraud_detection": true,
  "customer_portal": true,
  "api_access": true,
  "ocr_processing": false
}
```

A map keyed by `feature_code` allows extremely fast application-level checks.

---

## Runtime Flow

```text
Request
   ↓
Tenant Context
   ↓
Redis
tenant-features:{tenant_id}
   │
   ├── HIT
   │    ↓
   │  Feature State
   │
   └── MISS
        ↓
   tenant_features
        ↓
      Redis
        ↓
   Feature State
```

---

## Cache Invalidation

The cache must be invalidated when:

```text
Feature Enabled
Feature Disabled
Feature Assigned
Feature Updated
Feature Override Changed
Subscription Changes
Tenant Archived
```

The database remains authoritative.

---

## Feature Override Interaction

Because Table 10 supports overrides, effective feature state may become:

```text
Base Feature
     ↓
tenant_features
     ↓
Override?
     ↓
Effective Feature State
```

Therefore the runtime cache should either:

1. contain already-resolved effective states, or
2. contain base features and evaluate overrides separately.

The architecture should choose one consistent approach.

For high-throughput runtime checks, precomputing the effective state is often preferable.

---

# 19. Security Considerations

The source identifies:

- Tenant-scoped administration.
- RBAC.
- Feature validation.
- Audit logging.

These are critical because feature entitlements can expose commercially valuable functionality.

---

## Tenant-Scoped Administration

A tenant administrator must only manage that tenant's features.

```text
Tenant A Admin
      ↓
Tenant A Features
```

must never become:

```text
Tenant A Admin
      ↓
Tenant B Features
```

---

## RBAC

Not every user should be allowed to enable features.

For example:

```text
Platform Administrator
    → Can provision licensed features

Tenant Administrator
    → Can manage permitted configuration

Ordinary User
    → Cannot change entitlement
```

The exact permission model belongs to IAM.

---

## Feature Validation

The system should verify that a requested feature is actually valid.

For example:

```text
feature_code = "does_not_exist"
```

should not create an arbitrary entitlement.

A controlled feature catalog or licensing service should establish valid feature definitions.

---

## Commercial Security

The application must not rely on:

```text
frontend button hidden = security
```

For example:

```javascript
if (featureEnabled) {
    showButton();
}
```

is only presentation logic.

The backend must independently enforce:

```text
Feature Entitlement Check
```

before executing protected functionality.

---

## Auditability

Every sensitive entitlement change should be auditable.

Especially:

```text
AI features
Billing features
Security features
API features
Premium features
```

---

# 20. Audit Requirements

The source defines these events:

| Event | Trigger | Purpose |
|---|---|---|
| `TenantFeatureAssigned` | Feature assigned to tenant | Record initial entitlement |
| `TenantFeatureEnabled` | Feature enabled | Record activation |
| `TenantFeatureDisabled` | Feature disabled | Record deactivation |
| `TenantFeatureUpdated` | Feature metadata/configuration changed | Track configuration changes |

---

## `TenantFeatureAssigned`

Triggered when:

```text
Tenant
   ↓
Feature assignment created
```

Example:

```json
{
  "event": "TenantFeatureAssigned",
  "tenant_id": "tenant-uuid",
  "feature_code": "ai_fraud_detection",
  "actor_id": "user-uuid"
}
```

---

## `TenantFeatureEnabled`

Triggered when:

```text
FALSE → TRUE
```

Example:

```json
{
  "event": "TenantFeatureEnabled",
  "tenant_id": "tenant-uuid",
  "feature_code": "ocr_processing",
  "actor_id": "user-uuid"
}
```

---

## `TenantFeatureDisabled`

Triggered when:

```text
TRUE → FALSE
```

This is especially important for support and incident investigation.

---

## `TenantFeatureUpdated`

Used for changes such as:

```text
feature_name
feature_category
rollout_version
```

where the entitlement itself may not change.

---

## Recommended Audit Information

The audit record should ideally contain:

```text
tenant_id
feature_code
actor_id
previous_state
new_state
reason
timestamp
source
```

This makes entitlement history reconstructable.

---

# 21. Event Producers / Event Consumers

The source identifies the following producers and consumers.

## Producers

```text
TenantFeatureAssigned
TenantFeatureEnabled
TenantFeatureDisabled
```

Typical producer architecture:

```text
Subscription Service
        ↓
Licensing Service
        ↓
Feature Assignment Service
        ↓
tenant_features
```

Tenant administration can also initiate permitted changes.

---

## Consumers

The source identifies:

- Feature Flag Service.
- Subscription Service.
- Billing.
- API Gateway.
- UI.

Additional logical consumers include:

- Provisioning Service.
- Workflow Engine.
- AI Services.
- Monitoring.
- Audit Service.

---

## Example Subscription Upgrade

```text
Tenant upgrades subscription
          ↓
Subscription Service
          ↓
Licensing Service
          ↓
TenantFeatureEnabled
          ↓
Event Bus
    ┌─────┼──────────┐
    ▼     ▼          ▼
 Billing  API       UI
          Gateway
```

---

## Runtime Feature Check

```text
Request
   ↓
API Gateway
   ↓
Feature Flag Service
   ↓
tenant-features:{tenant_id}
   ↓
is_enabled?
   │
   ├── TRUE → Continue
   │
   └── FALSE → Feature unavailable
```

---

# 22. Alternative Designs Considered

| Option | Description | Verdict |
|---|---|---|
| A | Store feature state in `tenant_settings` | **Rejected** |
| B | Store feature list as JSON | **Rejected** |
| C | Store feature state in user permissions | **Rejected** |
| D | Derive every feature directly from subscription on every request | **Rejected as primary runtime model** |
| **E** | Dedicated `tenant_features` table | **Chosen** |

---

## Option A — Store in `tenant_settings`

Example:

```text
tenant_settings
    enable_claims
    enable_ai
    enable_ocr
    enable_api
    enable_customer_portal
```

Rejected because the settings table would become a growing collection of entitlement-specific booleans.

It would also make:

```text
feature catalog
feature metadata
feature categories
rollout versions
```

difficult to manage.

---

## Option B — JSON Feature List

Example:

```json
{
  "claims_management": true,
  "ai_fraud_detection": true,
  "ocr_processing": false
}
```

Rejected as the primary relational model because feature entitlements have:

- stable identity,
- tenant ownership,
- uniqueness constraints,
- metadata,
- lifecycle timestamps,
- categories,
- audit requirements.

A relational representation is more appropriate.

---

## Option C — Store in User Permissions

Rejected because:

```text
Tenant has feature
```

is different from:

```text
User has permission
```

For example:

```text
Tenant Feature:
    AI Fraud Detection = TRUE

User A:
    Can use AI Fraud Detection = TRUE

User B:
    Can use AI Fraud Detection = FALSE
```

The tenant-level entitlement must exist before user-level authorization can meaningfully operate.

---

## Option D — Derive from Subscription Every Request

One possible design is:

```text
Every request
    ↓
Load subscription
    ↓
Determine plan
    ↓
Determine features
    ↓
Continue
```

This is inefficient for a high-throughput SaaS platform.

Feature entitlement should instead be materialized into:

```text
tenant_features
```

and cached.

Subscription remains the commercial source of entitlement decisions, while `tenant_features` provides the operational materialization.

---

## Option E — Dedicated `tenant_features`

**Chosen.**

It provides:

- Feature-level entitlement.
- Tenant isolation.
- Runtime feature checks.
- Subscription-driven provisioning.
- Progressive rollout.
- Enterprise customization.
- Efficient caching.
- Auditable state.
- Stable feature identifiers.

This matches the source design.

---

# 23. Final Design Assessment

| Attribute | Rating |
|---|---|
| Complexity | **Medium** |
| Read Volume | **Very High** |
| Write Volume | **Very Low** |
| Security Importance | **High** |
| Business Criticality | **Very High** |
| Scalability | **Excellent** |
| Data Volatility | Low |
| Runtime Importance | **Critical** |
| Recommended Status | **Core Supporting Table** |

## Overall Assessment

`tenant_features` is one of the most strategically important configuration tables in the Tenant Management module despite its relatively simple physical schema.

It answers:

> **Which specific platform capabilities is this tenant entitled to use?**

That is different from:

```text
tenant_modules
    ↓
Which major application modules are provisioned?

tenant_subscription_plans
    ↓
What commercial subscription does the tenant have?

tenant_feature_overrides
    ↓
What exceptions modify the normal feature entitlement?

IAM
    ↓
Which individual users are authorized to use the capability?
```

The resulting architecture is:

```text
                    Tenant
                       │
          ┌────────────┼─────────────┐
          │            │             │
          ▼            ▼             ▼
   Subscription     Modules       Features
       │                              │
       ▼                              ▼
Commercial Plan              tenant_features
                                      │
                              ┌───────┴────────┐
                              │                │
                              ▼                ▼
                         Base State       Override
                              │                │
                              └───────┬────────┘
                                      ▼
                              Effective Feature
                                      │
                       ┌──────────────┼──────────────┐
                       ▼              ▼              ▼
                    API Gateway      UI          Services
```

The critical production invariants are:

1. **Every feature assignment belongs to exactly one tenant.**
2. **`(tenant_id, feature_code)` must be unique.**
3. **`feature_code` is the stable runtime identifier.**
4. **`feature_name` is presentation/business metadata, not a runtime key.**
5. **Feature entitlement is not user authorization.**
6. **Feature entitlement is not the same thing as module provisioning.**
7. **Subscription changes may create or modify feature assignments.**
8. **Feature state should be materialized rather than recomputed from the subscription on every request.**
9. **Runtime checks should be tenant-scoped.**
10. **The frontend must never be treated as the security boundary for feature enforcement.**
11. **Feature state should be heavily cached because reads are very high and writes are very low.**
12. **The recommended cache key is `tenant-features:{tenant_id}`.**
13. **Cache invalidation must occur whenever entitlement state changes.**
14. **Feature changes must be auditable.**
15. **Feature overrides belong in `tenant_feature_overrides`, not by corrupting the base entitlement record.**
16. **Feature definitions should ultimately come from a controlled feature catalog/licensing authority rather than arbitrary client input.**
17. **Physical deletion should generally be avoided so entitlement history remains reconstructable.**

The final business model is:

```text
Subscription
     │
     ▼
Licensing / Provisioning
     │
     ▼
┌──────────────────────────────┐
│       tenant_features        │
├──────────────────────────────┤
│ tenant_id                    │
│ feature_code                 │
│ feature_name                 │
│ feature_category             │
│ is_enabled                   │
│ enabled_at                   │
│ disabled_at                  │
│ rollout_version              │
│ created_at                   │
│ updated_at                   │
└──────────────┬───────────────┘
               │
               ▼
      Feature Flag Service
               │
               ▼
       Effective Capability
               │
       ┌───────┼────────┐
       ▼       ▼        ▼
      API      UI     Services
```

This preserves the source design's intended role for `tenant_features`: **the tenant-scoped materialized feature-entitlement layer that connects SaaS licensing and subscription decisions to high-performance runtime capability checks while remaining separate from user authorization, module provisioning, and feature overrides.**

**Step 3 — `tenant_features` is complete.**

The next step is **Step 4 — package this exact documentation into `Module_01_Table_09_tenant_features.md`**.
