# Step 3 — Table 11: `tenant_modules`

I reviewed the original Module 1 inventory and the existing `Table_11_tenant_modules.md` source before continuing, specifically to prevent the schema-definition degradation identified earlier.

The module inventory confirms that `tenant_modules` is Table 11, immediately following `tenant_feature_overrides`, and describes it as “Enabled application modules.”

The source design defines `tenant_modules` as the table that manages high-level application modules provisioned for each tenant, supporting modular SaaS deployments, enterprise licensing, and selective access to business domains.

---

# 1. Why This Table Exists

The `tenant_modules` table manages high-level application modules provisioned for each tenant.

This is different from `tenant_features`.

The architectural hierarchy is:

```text
Tenant
   │
   ├── Module Entitlements
   │       │
   │       ├── Policy Management
   │       ├── Claims Management
   │       ├── Underwriting
   │       ├── Billing
   │       └── Reporting
   │
   └── Feature Entitlements
           │
           ├── OCR
           ├── AI Fraud Detection
           └── Auto Assignment
```

The module answers:

> Which major application domains have actually been provisioned for this tenant?

That is the responsibility of `tenant_modules`.

---

# 2. Business Definition

A Tenant Module represents a major functional application module assigned to a tenant.

Examples include:

- Policy Management
- Claims Management
- Underwriting
- Billing
- CRM
- AI Services
- Reporting

Conceptually:

```text
Tenant
   │
   └── Tenant Modules
          │
          ├── Policy Management
          ├── Claims Management
          ├── Underwriting
          ├── Billing
          ├── CRM
          ├── AI Services
          └── Reporting
```

The entity represents:

```text
Tenant
   +
Application Module
   +
Provisioning State
   +
Entitlement State
```

It answers:

> Which major InsureIQ application modules are provisioned for this tenant?

It does not answer which individual user may access the module, nor which individual capabilities inside the module are enabled.

---

# 3. Critical Design Principle — What the Entity IS and IS NOT

## The Tenant Module IS

- A module entitlement.
- Application provisioning metadata.
- A child entity of the Tenant aggregate.
- A high-level SaaS licensing boundary.
- A modular deployment control.
- Enterprise packaging metadata.
- A tenant-specific application availability record.

## The Tenant Module IS NOT

- A feature flag.
- A user permission.
- A user role.
- A subscription plan.
- A billing transaction.
- A feature override.
- An individual business transaction.
- Application source code.

## Critical Three-Level Model

```text
                    TENANT
                       │
            ┌──────────┴──────────┐
            │                     │
            ▼                     ▼
     MODULE ENTITLEMENT     FEATURE ENTITLEMENT
     tenant_modules         tenant_features
            │                     │
            │                     ▼
            │              tenant_feature_overrides
            │
            ▼
     Application Domain
```

---

# 4. Aggregate Root Analysis — DDD Structure

```text
Tenant
│
├── Tenant Modules
│      ├── Policy Management
│      ├── Claims Management
│      ├── Underwriting
│      ├── Billing
│      └── Reporting
```

The broader Tenant aggregate contains tenant profile, addresses, contacts, branding, settings, locales, features, feature overrides, subscription plans, usage limits, usage counters, security settings, data regions, backup policies, integrations, and related tenant-owned configuration.

A module assignment belongs to a specific tenant.

A module may have a provisioning lifecycle:

```text
provisioning
      ↓
active
      ↓
suspended
      ↓
deprovisioned
```

or:

```text
provisioning
      ↓
failed
```

---

# 5. Business Capabilities Supported

| Capability | Supported |
|---|---|
| Module provisioning | Yes |
| SaaS licensing | Yes |
| Modular deployment | Yes |
| Enterprise packaging | Yes |
| Platform customization | Yes |
| Module enablement | Yes |
| Module disablement | Yes |
| Module suspension | Yes |
| Module deprovisioning | Yes |
| Provisioning failure tracking | Yes |
| Fine-grained feature licensing | No — `tenant_features` |
| User authorization | No — IAM |
| Subscription definition | No — `tenant_subscription_plans` |
| Billing transactions | No |

Typical scenarios include starter tenants receiving a subset of modules, enterprise tenants receiving many modules, and module purchase leading to a provisioning workflow.

---

# 6. Multi-Tenant / Ownership / Isolation Notes

Each module assignment belongs to one tenant.

```text
tenant_modules.tenant_id
        ↓
tenants.id
```

Every module query must be tenant-scoped.

Correct:

```sql
SELECT *
FROM tenant_modules
WHERE tenant_id = :tenant_id;
```

A tenant must never be able to manipulate another tenant's module assignment.

Module provisioning is also more privileged than ordinary feature configuration because provisioning an entire module may involve database structures, services, queues, object-storage namespaces, API routes, workers, integrations, and monitoring.

---

# 7. Lifecycle

The lifecycle is:

```text
Creation:
Default Modules Assigned

Growth:
Additional Modules Enabled

Modification:
Modules Added, Disabled, or Reprovisioned

Archival:
Assignments Archived
```

Provisioning can additionally move through:

```text
provisioning
    ↓
active
    ↓
suspended
    ↓
deprovisioned
```

or:

```text
provisioning
    ↓
failed
```

An assignment may therefore exist before technical provisioning has completed.

For example:

```text
is_enabled = TRUE
provisioning_status = provisioning
```

means the tenant is entitled to the module but provisioning is still underway.

Historical assignments should generally be retained rather than physically deleted.

---

# 8. Proposed Schema

## Table Name

`tenant_modules`

## Primary Key Strategy

UUID.

## Full Field-by-Field Schema Definition

| Field Name | Data Type | Key Type | Specification | Reason Field Exists |
|---|---|---|---|---|
| `id` | UUID | PK | `NOT NULL` | Stable unique identity of the tenant's module assignment |
| `tenant_id` | UUID | FK → `tenants.id` | `NOT NULL` | Establishes ownership and tenant isolation |
| `module_code` | VARCHAR(100) | UK with `tenant_id` | `NOT NULL` | Stable machine-readable identifier for module provisioning and runtime checks |
| `module_name` | VARCHAR(200) | — | `NOT NULL` | Human-readable module name for administration and display |
| `module_category` | ENUM | — | `NOT NULL` | Classifies the application module |
| `is_enabled` | BOOLEAN | — | `NOT NULL DEFAULT TRUE` | Indicates whether the tenant's module entitlement is enabled |
| `enabled_at` | TIMESTAMPTZ | — | `NULL` | Records when the module became enabled |
| `disabled_at` | TIMESTAMPTZ | — | `NULL` | Records when the module was disabled |
| `provisioning_status` | ENUM | — | `NOT NULL DEFAULT 'active'` | Tracks the technical provisioning state of the module |
| `created_at` | TIMESTAMPTZ | — | `NOT NULL` | Records creation of the module assignment |
| `updated_at` | TIMESTAMPTZ | — | `NOT NULL` | Records the latest modification |

### `id`

UUID uniquely identifies one tenant-module assignment.

### `tenant_id`

Foreign key establishing ownership:

```text
tenant_modules.tenant_id
        ↓
tenants.id
```

### `module_code`

Stable machine-readable identifier, such as:

```text
policy_management
claims_management
underwriting
billing
crm
ai
reporting
```

Runtime logic should use the code rather than the display name.

### `module_name`

Human-readable administrative/display name.

### `module_category`

Classifies the module.

### `is_enabled`

Tenant-level entitlement state.

It is deliberately distinct from `provisioning_status`.

For example:

```text
is_enabled = TRUE
provisioning_status = provisioning
```

can mean the tenant is entitled but technical provisioning is incomplete.

### `enabled_at`

Timestamp at which the module became enabled.

### `disabled_at`

Timestamp at which the module was disabled.

### `provisioning_status`

Technical provisioning state.

### `created_at`

Creation timestamp.

### `updated_at`

Latest modification timestamp.

---

# 9. Enum Definitions

## `module_category`

| Value | Description |
|---|---|
| `core` | Core platform functionality |
| `policy` | Insurance policy management functionality |
| `claims` | Claims management functionality |
| `underwriting` | Underwriting functionality |
| `billing` | Billing and financial functionality |
| `crm` | Customer relationship management |
| `ai` | Artificial intelligence services |
| `reporting` | Reporting and analytics functionality |
| `integration` | Integration-related functionality |
| `administration` | Administrative platform functionality |

## `provisioning_status`

| Value | Description |
|---|---|
| `provisioning` | Module is currently being provisioned |
| `active` | Module provisioning is complete and operational |
| `suspended` | Module is temporarily suspended |
| `deprovisioned` | Module has been removed from active provisioning |
| `failed` | Module provisioning failed |

Do not collapse `is_enabled` and `provisioning_status`. They describe different dimensions.

---

# 10. Why `module_code` Exists

`module_code` provides a stable machine-readable identifier for module provisioning and runtime checks.

For example:

```text
claims_management
```

is preferable to:

```text
Claims Management
```

for application logic.

A display name can change without changing the module's identity.

---

# 11. Candidate Keys

| Key Type | Field(s) | Rationale |
|---|---|---|
| Primary Key | `id` | Stable technical identity |
| Candidate / Alternate Key | `(tenant_id, module_code)` | A tenant should have one assignment for a given module |

The uniqueness boundary is:

```text
UNIQUE(tenant_id, module_code)
```

not `module_code` alone.

---

# 12. Constraints

| Constraint | Definition | Reason |
|---|---|---|
| Primary Key | `PK(id)` | Unique module assignment |
| Tenant FK | `tenant_id → tenants.id` | Establishes tenant ownership |
| Module Uniqueness | `UNIQUE(tenant_id, module_code)` | Prevents duplicate module assignments |
| Tenant Required | `tenant_id NOT NULL` | Every module belongs to a tenant |
| Code Required | `module_code NOT NULL` | Runtime identity required |
| Name Required | `module_name NOT NULL` | Administrative identity required |
| Category Required | `module_category NOT NULL` | Classification required |
| Enabled Default | `is_enabled DEFAULT TRUE` | Default state |
| Provisioning Default | `provisioning_status DEFAULT 'active'` | Default provisioning state |
| Timestamp Required | `created_at`, `updated_at NOT NULL` | Lifecycle tracking |

A production implementation may additionally validate that `disabled_at` is not earlier than `enabled_at` where both are present. This is an implementation inference rather than a source-defined constraint.

---

# 13. Relationships

## Incoming References / Logical Consumers

- Provisioning Service
- Licensing Service
- API Gateway
- Navigation Service
- Monitoring
- Audit Service
- Administrative UI

## Outgoing References

```text
tenant_id → tenants.id
```

Conceptually:

```text
tenant_modules
      │
      └──────────────→ tenants
```

There is a logical relationship between modules and features, but no physical FK from `tenant_modules` to `tenant_features` should be invented unless the broader schema explicitly establishes one.

---

# 14. Cardinality Analysis

The expected source-level range is:

```text
Modules per tenant: 5–30
```

| Relationship | Expected Cardinality |
|---|---:|
| Tenant → Modules | 5–30 typical |
| Tenant → Enabled Modules | 0–30 |
| Tenant → Disabled Modules | 0–30 |
| Module Assignment → Tenant | Exactly 1 |
| Module Code → Tenants | 0–N |
| Module Assignment → Features | 0–N logical |
| Module Assignment → Provisioning Events | 1–N |

Example at 100,000 tenants and 15 modules per tenant:

```text
1,500,000 module assignments
```

At 30 modules per tenant:

```text
3,000,000 records
```

This is a small relational dataset relative to transactional domains such as claims, policies, documents, and events.

---

# 15. Query Patterns

## Retrieve Enabled Modules

```sql
SELECT *
FROM tenant_modules
WHERE tenant_id = :tenant_id
AND is_enabled = TRUE;
```

## Retrieve Specific Module

```sql
SELECT is_enabled
FROM tenant_modules
WHERE tenant_id = :tenant_id
AND module_code = :module_code;
```

## Runtime Module State

```sql
SELECT
    is_enabled,
    provisioning_status
FROM tenant_modules
WHERE tenant_id = :tenant_id
AND module_code = :module_code;
```

## Retrieve Operational Modules

```sql
SELECT
    module_code,
    module_name,
    module_category
FROM tenant_modules
WHERE tenant_id = :tenant_id
AND is_enabled = TRUE
AND provisioning_status = 'active';
```

## Retrieve Modules Being Provisioned

```sql
SELECT *
FROM tenant_modules
WHERE tenant_id = :tenant_id
AND provisioning_status = 'provisioning';
```

## Find Failed Provisioning

```sql
SELECT *
FROM tenant_modules
WHERE provisioning_status = 'failed';
```

## Retrieve Modules by Category

```sql
SELECT *
FROM tenant_modules
WHERE tenant_id = :tenant_id
AND module_category = :category;
```

---

# 16. Index Strategy

The source strategy is:

- `PK(id)`
- `INDEX(tenant_id)`
- `UNIQUE(tenant_id, module_code)`
- `INDEX(module_category)`
- `INDEX(provisioning_status)`
- `INDEX(is_enabled)`

The composite unique index both enforces the business rule and supports exact module lookup.

Because Boolean columns are low-cardinality, the standalone `is_enabled` index should be validated against actual query plans. A production PostgreSQL implementation may prefer a tenant-scoped partial index such as:

```sql
CREATE INDEX idx_active_tenant_modules
ON tenant_modules (tenant_id, module_code)
WHERE is_enabled = TRUE
AND provisioning_status = 'active';
```

This is an implementation optimization, not a replacement for the source design.

---

# 17. Read / Write Characteristics

The source classifies:

```text
Reads: High
Writes: Very Low
```

This is expected because runtime services frequently need to determine which modules a tenant has.

Typical reads:

- Runtime module checks
- Navigation construction
- API gateway checks
- Tenant administration
- Provisioning dashboards

Typical writes:

- Tenant provisioning
- Subscription upgrade
- Module purchase
- Module enablement
- Module disablement
- Module suspension
- Module deprovisioning
- Provisioning retry

Physical deletion should generally be avoided; historical assignments should be retained.

---

# 18. Caching Strategy

The source recommends:

```text
tenant-modules:{tenant_id}
```

in Redis.

Example conceptual value:

```json
{
  "policy_management": {
    "enabled": true,
    "status": "active"
  },
  "claims_management": {
    "enabled": true,
    "status": "active"
  },
  "underwriting": {
    "enabled": false,
    "status": "deprovisioned"
  },
  "ai": {
    "enabled": true,
    "status": "provisioning"
  }
}
```

Runtime flow:

```text
Request
   ↓
Tenant Context
   ↓
Redis
tenant-modules:{tenant_id}
   │
   ├── HIT → Module State
   │
   └── MISS
        ↓
   tenant_modules
        ↓
      Redis
```

Cache invalidation should occur whenever module state changes.

The database remains authoritative:

```text
PostgreSQL
    ↓
Authoritative state

Redis
    ↓
Runtime acceleration
```

---

# 19. Security Considerations

The source requires:

- Tenant-scoped administration.
- RBAC.
- Provisioning controls.
- Audit logging.

Module provisioning can grant access to entire business domains, so module administration should be tightly controlled.

Example privilege model:

```text
Platform Administrator
       ↓
Can provision/deprovision modules

Tenant Licensing Administrator
       ↓
Can manage approved module assignments

Tenant User
       ↓
Cannot modify module entitlement
```

Clients must never be trusted to grant themselves modules simply by submitting:

```json
{
  "module_code": "ai",
  "is_enabled": true
}
```

The backend must validate:

```text
Actor
   ↓
Tenant
   ↓
Subscription / License
   ↓
Module entitlement
   ↓
Provisioning policy
   ↓
Authorization
```

---

# 20. Audit Requirements

The source defines:

| Event | Trigger | Purpose |
|---|---|---|
| `TenantModuleAssigned` | Module assigned to tenant | Record initial module entitlement |
| `TenantModuleEnabled` | Module enabled | Record activation |
| `TenantModuleDisabled` | Module disabled | Record deactivation |
| `TenantModuleProvisioned` | Technical provisioning completed | Record successful provisioning |
| `TenantModuleDeprovisioned` | Module technically removed | Record deprovisioning |

A production audit payload should ideally include:

```text
event_id
tenant_id
module_id
module_code
actor_id
previous_enabled_state
new_enabled_state
previous_provisioning_status
new_provisioning_status
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

- Licensing Service
- Module Assignment Service
- Provisioning Service
- Administrative Service
- Provisioning Worker

Workflow:

```text
Tenant purchases Claims Module
            ↓
Licensing Service
            ↓
TenantModuleAssigned
            ↓
Provisioning Service
            ↓
provisioning_status = provisioning
            ↓
Technical setup
            ↓
provisioning_status = active
            ↓
TenantModuleProvisioned
```

## Consumers

- Provisioning Service
- Licensing Service
- API Gateway
- Navigation
- Monitoring
- Audit Service

Failure workflow:

```text
Module Assigned
      ↓
Provisioning
      ↓
Failure
      ↓
provisioning_status = failed
      ↓
Monitoring
      ↓
Support / Retry
```

---

# 22. Alternative Designs Considered

| Option | Description | Verdict |
|---|---|---|
| A | Store module assignments in `tenant_settings` | Rejected |
| B | JSON modules | Rejected |
| C | Dedicated table | Chosen |

## Option A — `tenant_settings`

Example:

```text
enable_policy = TRUE
enable_claims = TRUE
enable_billing = FALSE
enable_ai = TRUE
```

Rejected because a general settings table would become a growing collection of module-specific switches and would poorly represent module metadata, categories, provisioning state, lifecycle, indexing, and audit.

## Option B — JSON Modules

Example:

```json
{
  "claims_management": {
    "enabled": true,
    "status": "active"
  },
  "ai": {
    "enabled": false,
    "status": "deprovisioned"
  }
}
```

Rejected because JSON weakens relational integrity, uniqueness enforcement, tenant-level querying, provisioning workflows, indexing, lifecycle management, and auditability.

## Option C — Dedicated Table

Chosen because it provides:

- tenant isolation,
- relational integrity,
- module-level uniqueness,
- provisioning state,
- lifecycle tracking,
- efficient querying,
- caching,
- auditability,
- scalable modular deployment.

---

# 23. Final Design Assessment

| Attribute | Rating |
|---|---|
| Complexity | **Medium** |
| Read Volume | **High** |
| Write Volume | **Very Low** |
| Security Importance | **High** |
| Business Criticality | **Very High** |
| Scalability | **Excellent** |
| Data Volatility | **Low** |
| Runtime Importance | **High** |
| Recommended Status | **Core Supporting Table** |

---

# Overall Design Assessment

`tenant_modules` is physically a relatively small table but represents a major architectural boundary.

It sits between:

```text
Commercial Licensing
        ↓
Application Provisioning
        ↓
Runtime Module Availability
```

while `tenant_features` sits one level below it.

The resulting architecture is:

```text
                         TENANT
                            │
             ┌──────────────┴──────────────┐
             │                             │
             ▼                             ▼
      Subscription                    Module Entitlement
             │                             │
             │                     tenant_modules
             │                             │
             │                     ┌───────┴────────┐
             │                     │                │
             │                     ▼                ▼
             │                 Provisioning     Runtime Check
             │                     │                │
             │                     ▼                ▼
             │                 Module Ready    Application
             │                                      │
             │                                      ▼
             │                              tenant_features
             │                                      │
             │                                      ▼
             │                         tenant_feature_overrides
             │
             ▼
       Commercial Rules
```

## Three Important Layers

### Layer 1 — Subscription

```text
tenant_subscription_plans
```

Answers:

> What commercial plan/contract does this tenant have?

### Layer 2 — Module

```text
tenant_modules
```

Answers:

> Which major application domains are provisioned for this tenant?

### Layer 3 — Feature

```text
tenant_features
```

Answers:

> Which specific capabilities inside the platform are enabled?

And:

```text
tenant_feature_overrides
```

answers:

> Is there an exceptional rule modifying one of those feature entitlements?

---

## Critical Production Invariants

1. Every module assignment belongs to exactly one tenant.
2. `(tenant_id, module_code)` must be unique.
3. `module_code` is the stable machine-readable module identity.
4. `module_name` is human-readable metadata, not the runtime identity.
5. A module is a high-level application domain, not a feature.
6. A module is not a user permission.
7. `is_enabled` and `provisioning_status` represent different dimensions and must not be collapsed.
8. A tenant can be entitled to a module while that module is still being provisioned.
9. Provisioning failure must be representable without deleting the entitlement record.
10. Module changes must be tenant-scoped and strongly authorized.
11. Subscription/licensing logic should determine whether a module may be assigned.
12. Provisioning services should determine whether the technical module is ready.
13. Runtime services should evaluate both entitlement and provisioning state where appropriate.
14. Historical module assignments should generally be retained rather than physically deleted.
15. Module state should be cached because reads are high and writes are very low.
16. The database remains authoritative; Redis is an acceleration layer.
17. Module lifecycle changes should generate auditable events.
18. Module-level provisioning and feature-level entitlement should remain separate.
19. Do not invent a physical FK from `tenant_modules` to `tenant_features`; their relationship is logical/domain-level unless the broader schema explicitly establishes one.
20. Do not use `tenant_modules` as a substitute for IAM authorization.

## Final Conceptual Model

```text
┌────────────────────────────┐
│           Tenant           │
└──────────────┬─────────────┘
               │
               ▼
┌────────────────────────────┐
│ tenant_subscription_plans  │
│                            │
│ Commercial Entitlement     │
└──────────────┬─────────────┘
               │
               ▼
┌────────────────────────────┐
│      tenant_modules        │
│                            │
│ Module Entitlement         │
│ Provisioning State         │
│ Runtime Module Availability│
└──────────────┬─────────────┘
               │
               │ logical containment
               ▼
┌────────────────────────────┐
│      tenant_features       │
│                            │
│ Fine-grained capabilities  │
└──────────────┬─────────────┘
               │
               ▼
┌────────────────────────────┐
│ tenant_feature_overrides   │
│                            │
│ Exceptional treatment      │
└────────────────────────────┘
```

The essential distinction is:

> **`tenant_modules` represents the tenant's high-level application-domain provisioning, while `tenant_features` represents the fine-grained capabilities available within the platform.**

This distinction prevents the schema from degenerating into a collection of unrelated Boolean flags and provides the foundation for modular SaaS licensing, provisioning, enterprise packaging, runtime module discovery, and fine-grained capability management.
