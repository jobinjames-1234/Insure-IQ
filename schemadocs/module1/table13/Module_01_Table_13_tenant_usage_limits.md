# Step 3 — Table 13: `tenant_usage_limits`

The Module 1 inventory establishes `tenant_usage_limits` as **Table 13**, with the purpose **“Licensed usage limits.”**

The source defines this table as the place where **contractual quotas for tenant resource consumption** are stored. It supports subscription-limit enforcement, enterprise custom quotas, capacity planning, and usage-based licensing while deliberately separating **limits** from **actual usage**.

I am also explicitly enforcing the anti-degradation rule here: the source's original schema fields are preserved, but the documentation is restored to the full five-column schema format:

**Field Name → Data Type → Key Type → Specification → Reason Field Exists**

No `Field | Type | Notes` compression.

---

# 1. Why This Table Exists

The `tenant_usage_limits` table stores **contractual quotas for tenant resource consumption**.

Its purpose is to define how much of a particular platform resource a tenant is permitted to consume.

The major purposes are:

- Subscription-limit enforcement
- Enterprise custom quotas
- Capacity planning
- Usage-based licensing
- Separation of limits from actual usage

The distinction between a limit and actual usage is fundamental.

```text
                 Tenant
                   │
          ┌────────┴────────┐
          │                 │
          ▼                 ▼
   Usage Limit         Usage Counter
          │                 │
          │                 │
          ▼                 ▼
   "How much may       "How much has
    be consumed?"       been consumed?"
```

For example:

```text
tenant_usage_limits
────────────────────
API Calls = 1,000,000 / month
Storage   = 500 GB
Users     = 250
Policies  = 100,000
```

while:

```text
tenant_usage_counters
──────────────────────
API Calls = 642,391
Storage   = 318 GB
Users     = 187
Policies  = 74,201
```

The limit table therefore represents **authorization/quota policy**, whereas the counter table represents **operational consumption**.

The usage-limit table is contractual quota data and is **not current usage or billing data**.

---

# 2. Business Definition

A **Tenant Usage Limit** defines the maximum permitted quantity of a specific resource for a tenant.

Examples include:

- Users
- Customers
- Policies
- Claims
- Storage
- API Calls
- AI Requests

Conceptually:

```text
Tenant
│
├── Subscription
│
├── Usage Limits
│      ├── Users
│      ├── Customers
│      ├── Policies
│      ├── Claims
│      ├── Storage
│      ├── API Calls
│      └── AI Requests
│
└── Usage Counters
```

The table answers:

> **What is this tenant allowed to consume?**

It does not answer:

> How much has the tenant consumed?

That is `tenant_usage_counters`.

It does not answer:

> What subscription does the tenant have?

That is `tenant_subscription_plans`.

It does not answer:

> How much money was charged?

That belongs to billing.

---

## Example

Suppose a tenant has an Enterprise subscription.

Its limits might be:

```text
Users       = 5,000
Customers   = 2,000,000
Policies    = 10,000,000
Claims      = 5,000,000
Storage     = 5 TB
API Calls   = 50,000,000
AI Requests = 10,000,000
```

These are **entitlements**, not measurements.

---

# 3. Critical Design Principle — What the Entity IS and IS NOT

## The Tenant Usage Limit IS

- A contractual quota.
- Licensing metadata.
- A resource-consumption boundary.
- A child entity of the Tenant aggregate.
- A quota-enforcement input.
- A basis for enterprise customization.
- A capacity-planning input.

## The Tenant Usage Limit IS NOT

- Current usage.
- A usage counter.
- An invoice.
- A payment.
- A subscription itself.
- A user permission.
- A feature flag.
- A billing ledger.

The distinction between limits and counters is especially important:

```text
Limit:
"You may use 1,000,000 API calls."

Counter:
"You have used 642,391 API calls."
```

---

## Critical Architectural Separation

```text
tenant_subscription_plans
          │
          │ commercial entitlement
          ▼
tenant_usage_limits
          │
          │ permitted capacity
          ▼
tenant_usage_counters
          │
          │ actual consumption
          ▼
Usage Enforcement
```

This separation prevents the subscription table from becoming an overloaded collection of resource quotas.

---

# 4. Aggregate Root Analysis — DDD Structure

The DDD relationship is:

```text
Tenant
│
├── Subscription
├── Usage Limits
└── Usage Counters
```

Expanded:

```text
Tenant
│
├── Subscription Plans
│
├── Usage Limits
│      ├── User Limit
│      ├── Customer Limit
│      ├── Policy Limit
│      ├── Claim Limit
│      ├── Storage Limit
│      ├── API Limit
│      └── AI Request Limit
│
└── Usage Counters
       ├── Current Users
       ├── Current Customers
       ├── Current Policies
       ├── Current Claims
       ├── Current Storage
       ├── API Consumption
       └── AI Consumption
```

The important DDD distinction is:

```text
Tenant
   │
   ├── Policy
   │     └── defines what is allowed
   │
   └── Counter
         └── records what happened
```

The limit is therefore policy/configuration data rather than telemetry.

---

## Aggregate Ownership

The usage limit belongs to exactly one tenant:

```text
tenant_usage_limits.tenant_id
          ↓
     tenants.id
```

The tenant is the ownership boundary.

---

# 5. Business Capabilities Supported

| Capability | Supported |
|---|---|
| Quota enforcement | Yes |
| Resource allocation | Yes |
| Usage validation | Yes |
| Enterprise custom limits | Yes |
| Capacity planning | Yes |
| Subscription limit enforcement | Yes |
| Usage-based licensing | Yes |
| Actual usage tracking | No — `tenant_usage_counters` |
| Payment processing | No |
| Invoice generation | No |

---

## Quota Enforcement Example

Suppose:

```text
limit_value = 100,000
resource_code = policies
```

and:

```text
current_value = 98,500
```

Then:

```text
98,500 < 100,000
```

the tenant can still create policies.

When:

```text
100,000 >= 100,000
```

the enforcement layer can reject or restrict additional consumption according to business policy.

The exact enforcement behavior—hard block, warning, grace period, overage—is not defined by the source and should therefore be determined by the later usage/billing design.

---

# 6. Multi-Tenant / Ownership / Isolation Notes

Each usage limit belongs to exactly one tenant.

```text
tenant_usage_limits.tenant_id
          ↓
       tenants.id
```

This means the same resource code can exist for many tenants:

```text
Tenant A
   policies = 100,000

Tenant B
   policies = 1,000,000

Tenant C
   policies = 50,000
```

There is no global uniqueness on `resource_code`.

The uniqueness boundary is:

```text
tenant_id + resource_code
```

---

## Tenant Isolation

Correct:

```sql
SELECT *
FROM tenant_usage_limits
WHERE tenant_id = :tenant_id;
```

Incorrect for an ordinary tenant request:

```sql
SELECT *
FROM tenant_usage_limits
WHERE resource_code = :resource_code;
```

The second query can retrieve quota records across tenants and should only be used by trusted platform-level administrative/reporting services where cross-tenant access is explicitly authorized.

---

## Security Boundary

A tenant must never be able to modify another tenant's limits.

A quota mutation must be authorized against the tenant context before it reaches the database.

---

# 7. Lifecycle

The lifecycle is:

```text
Creation:
Default Limits Assigned

Growth:
Limits Increased

Modification:
Custom Quotas Applied

Archival:
Limits Archived
```

---

## Creation — Default Limits Assigned

When a tenant is provisioned:

```text
Tenant
   ↓
Subscription
   ↓
Default Usage Limits
```

Example:

```text
Professional
   ↓
Users = 250
Policies = 100,000
Storage = 500 GB
```

---

## Growth — Limits Increased

A tenant may upgrade or negotiate a higher quota.

Example:

```text
Policies
100,000
   ↓
500,000
```

The increase may result from:

- Subscription upgrade.
- Enterprise contract.
- Purchased capacity.
- Administrative quota increase.

---

## Modification — Custom Quotas Applied

Enterprise tenants may have customized quotas.

Example:

```text
Standard Enterprise:
Policies = 1,000,000

Custom Enterprise:
Policies = 5,000,000
```

---

## Archival

When a quota is no longer applicable:

```text
active limit
     ↓
expired/archived
```

The lifecycle calls for archival rather than physical deletion.

---

## Effective-Dated Lifecycle

The schema contains:

```text
effective_from
effective_to
```

which allows a quota to have a validity window.

Conceptually:

```text
2026-01-01 ───────── 2026-12-31
       │
       │
       ▼
Policies = 100,000
```

A future quota can therefore be scheduled.

---

# 8. Proposed Schema

## Table Name

`tenant_usage_limits`

## Primary Key Strategy

**UUID**

## Full Field-by-Field Schema Definition

| Field Name | Data Type | Key Type | Specification | Reason Field Exists |
|---|---|---|---|---|
| `id` | UUID | PK | `NOT NULL` | Stable unique identity of the tenant usage-limit record |
| `tenant_id` | UUID | FK → `tenants.id` | `NOT NULL` | Establishes tenant ownership and isolation |
| `resource_code` | VARCHAR(100) | UK with `tenant_id` | `NOT NULL` | Stable machine-readable identifier for the quota resource |
| `resource_name` | VARCHAR(200) | — | `NOT NULL` | Human-readable name for administration and reporting |
| `limit_value` | BIGINT | — | `NOT NULL` | Defines the maximum permitted quantity |
| `limit_unit` | ENUM | — | `NOT NULL` | Defines the measurement unit of the quota |
| `is_unlimited` | BOOLEAN | — | `NOT NULL DEFAULT FALSE` | Allows a resource to have an explicitly unlimited entitlement |
| `effective_from` | DATE | — | `NOT NULL` | Defines when the quota becomes effective |
| `effective_to` | DATE | — | `NULL` | Defines when the quota ceases to be effective |
| `created_at` | TIMESTAMPTZ | — | `NOT NULL` | Records creation of the quota record |
| `updated_at` | TIMESTAMPTZ | — | `NOT NULL` | Records the latest modification |

These fields preserve the source-defined Table 13 schema.

## `id`

UUID uniquely identifies the usage-limit record.

## `tenant_id`

Foreign key establishing ownership:

```text
tenant_usage_limits.tenant_id
          ↓
       tenants.id
```

Every quota must belong to exactly one tenant.

## `resource_code`

Stable machine-readable resource identifier.

Examples:

```text
users
customers
policies
claims
storage
api_calls
ai_requests
```

## `resource_name`

Human-readable resource description.

## `limit_value`

Defines the maximum permitted quantity.

The source specifies `BIGINT`.

## `limit_unit`

Defines what `limit_value` means.

For example:

```text
limit_value = 500
limit_unit = gb
```

means 500 GB.

## `is_unlimited`

Allows a tenant to have no finite quota for a resource.

The source specifies a default of `FALSE`.

## `effective_from`

Defines when the quota becomes effective.

## `effective_to`

Defines when the quota ceases to be effective.

A `NULL` value can represent an open-ended quota period.

## `created_at`

Records when the quota record was created.

## `updated_at`

Records the latest modification.

---

# 9. Enum Definitions

The `limit_unit` enum is:

| Value | Description |
|---|---|
| `count` | Generic count-based quota |
| `gb` | Gigabyte-based quota |
| `tb` | Terabyte-based quota |
| `requests` | Number of requests |
| `messages` | Number of messages |
| `documents` | Number of documents |
| `custom` | Custom resource-specific measurement |

---

## Why Units Matter

Without `limit_unit`, this is ambiguous:

```text
limit_value = 500
```

It could mean:

```text
500 users
500 GB
500 documents
500 requests
```

The unit resolves the meaning.

---

## `custom`

`custom` supports resource types that do not fit predefined units.

Its semantics should be controlled by the resource definition/enforcement layer rather than interpreted arbitrarily by individual services.

---

# 10. Why `resource_code` Exists

`resource_code` provides a stable machine-readable identifier for quota validation.

This is important because a human-readable resource name can change.

For example:

```text
resource_name = Insurance Policies
```

might later become:

```text
resource_name = Policies
```

while:

```text
resource_code = policies
```

remains stable.

---

## Runtime Validation

The Usage Enforcement service can evaluate:

```sql
SELECT limit_value, limit_unit, is_unlimited
FROM tenant_usage_limits
WHERE tenant_id = :tenant_id
AND resource_code = :resource_code;
```

This makes `resource_code` part of the runtime quota contract.

---

## Why Not Use `resource_name`?

Because names are presentation data.

Machine logic should depend on:

```text
policies
```

rather than:

```text
Insurance Policies
```

---

# 11. Candidate Keys

| Key Type | Field(s) | Rationale |
|---|---|---|
| Primary Key | `id` | Stable technical identity |
| Candidate Key | `(tenant_id, resource_code)` | One current quota definition per resource for a tenant |

The candidate key is:

```text
tenant_id + resource_code
```

not:

```text
resource_code
```

alone.

---

## Important Temporal Consideration

The schema also provides:

```text
effective_from
effective_to
```

which introduces an architectural consideration.

If the implementation needs to preserve **multiple historical quota versions for the same resource**, then a simple:

```text
UNIQUE(tenant_id, resource_code)
```

would conflict with that requirement.

The current source simultaneously specifies:

```text
UNIQUE(tenant_id, resource_code)
```

and effective dates.

Therefore, under the current source design, the intended model appears to be:

> one current quota record per tenant/resource, with effective dates describing its validity.

If full quota-version history is required later, that history should be modeled explicitly rather than silently weakening the uniqueness rule.

---

# 12. Constraints

| Constraint | Definition | Reason |
|---|---|---|
| Primary Key | `PK(id)` | Unique quota identity |
| Tenant FK | `tenant_id → tenants.id` | Tenant ownership |
| Resource Uniqueness | `UNIQUE(tenant_id, resource_code)` | One quota definition per resource/tenant |
| Tenant Required | `tenant_id NOT NULL` | Every quota belongs to a tenant |
| Resource Code Required | `resource_code NOT NULL` | Runtime quota identity |
| Resource Name Required | `resource_name NOT NULL` | Human-readable administration |
| Limit Required | `limit_value NOT NULL` | Finite quota requires a value |
| Unit Required | `limit_unit NOT NULL` | Quantity needs a measurement context |
| Unlimited Default | `is_unlimited DEFAULT FALSE` | Explicitly finite by default |
| Effective Start Required | `effective_from NOT NULL` | Quota must have an activation date |
| Timestamp Required | `created_at`, `updated_at NOT NULL` | Lifecycle tracking |

---

## Production Validation Constraints

A production implementation should strongly consider:

```sql
CHECK (limit_value >= 0)
```

to prevent nonsensical negative quotas.

The exact treatment of `limit_value` when `is_unlimited = TRUE` should also be standardized by the implementation.

---

## Effective-Date Validation

A production implementation should consider:

```sql
CHECK (
    effective_to IS NULL
    OR effective_to >= effective_from
);
```

This prevents an invalid interval.

These are implementation recommendations rather than source-defined constraints.

---

# 13. Relationships

## Incoming References / Logical Consumers

The source identifies:

- Usage Enforcement
- Billing
- API Gateway
- Storage Service
- AI Service

These are service-level consumers rather than foreign-key relationships.

---

## Outgoing References

```text
tenant_id → tenants.id
```

There is no source-defined FK to `tenant_subscription_plans`.

Therefore no `subscription_id` should be invented into this table.

---

## Relationship to Subscription

The domain relationship is:

```text
tenant_subscription_plans
          │
          │ licensing rules
          ▼
tenant_usage_limits
```

The physical schema remains independently tenant-scoped.

---

## Relationship to Usage Counters

The key logical relationship is:

```text
tenant_usage_limits
        │
        │ maximum permitted
        ▼
tenant_usage_counters
        │
        │ actual consumed
        ▼
Usage Enforcement
```

Both identify the resource through:

```text
tenant_id
resource_code
```

---

# 14. Cardinality Analysis

The source specifies:

> **Limits per tenant: 20–100**

| Relationship | Expected Cardinality |
|---|---:|
| Tenant → Usage Limits | 20–100 |
| Usage Limit → Tenant | Exactly 1 |
| Resource Code → Tenants | 0–N |
| Tenant + Resource Code → Limit | 1 |
| Tenant → Unlimited Limits | 0–N |
| Tenant → Finite Limits | 0–N |

At:

```text
100,000 tenants
×
100 limits
```

the upper planning estimate is:

```text
10,000,000 rows
```

The source rates scalability as **Excellent**.

---

# 15. Query Patterns

## Retrieve All Tenant Limits

```sql
SELECT *
FROM tenant_usage_limits
WHERE tenant_id = :tenant_id;
```

## Retrieve Specific Resource Limit

```sql
SELECT *
FROM tenant_usage_limits
WHERE tenant_id = :tenant_id
AND resource_code = :resource_code;
```

## Retrieve Finite Limits

```sql
SELECT *
FROM tenant_usage_limits
WHERE tenant_id = :tenant_id
AND is_unlimited = FALSE;
```

## Retrieve Unlimited Resources

```sql
SELECT *
FROM tenant_usage_limits
WHERE tenant_id = :tenant_id
AND is_unlimited = TRUE;
```

## Find Effective Limits

A production runtime query can use the effective period:

```sql
SELECT *
FROM tenant_usage_limits
WHERE tenant_id = :tenant_id
AND resource_code = :resource_code
AND effective_from <= CURRENT_DATE
AND (
    effective_to IS NULL
    OR effective_to >= CURRENT_DATE
);
```

This is an implementation inference based on the source's effective-date fields.

---

## Quota Enforcement Query

A service can combine limit and usage:

```sql
SELECT
    l.limit_value,
    l.limit_unit,
    l.is_unlimited,
    c.current_value
FROM tenant_usage_limits l
JOIN tenant_usage_counters c
  ON c.tenant_id = l.tenant_id
 AND c.resource_code = l.resource_code
WHERE l.tenant_id = :tenant_id
AND l.resource_code = :resource_code;
```

Then:

```text
current_value < limit_value
```

means the resource is within quota for finite limits.

The exact enforcement policy remains outside this table.

---

# 16. Index Strategy

The source recommends:

- `PK(id)`
- `INDEX(tenant_id)`
- `UNIQUE(tenant_id, resource_code)`
- `INDEX(is_unlimited)`
- `INDEX(effective_from)`

## Primary Key

```sql
PRIMARY KEY (id)
```

## Tenant Index

```sql
INDEX(tenant_id)
```

## Composite Unique Index

```sql
UNIQUE(tenant_id, resource_code)
```

This simultaneously enforces uniqueness and supports specific quota lookup.

## Unlimited Index

```sql
INDEX(is_unlimited)
```

Because Boolean values have low cardinality, actual usefulness should be validated against query plans.

## Effective-Date Index

```sql
INDEX(effective_from)
```

Supports scheduled quota changes and effective-date queries.

A composite or specialized index may be introduced after production query-plan analysis, but it should not be invented into the baseline schema without evidence.

---

# 17. Read / Write Characteristics

The source classifies:

```text
Reads: Very High
Writes: Low
```

Quota validation may occur on many operations:

```text
Create User
Create Policy
Create Claim
Upload Document
Call API
Execute AI Request
```

while the limit itself changes relatively infrequently.

---

## Reads

Expected high-volume operations:

- Runtime quota checks
- Tenant dashboards
- API gateway validation
- Storage validation
- AI request validation
- Billing calculations
- Administrative screens

## Writes

Typical writes:

- Initial tenant provisioning
- Subscription changes
- Enterprise quota negotiation
- Quota increase
- Quota reduction
- Quota expiration
- Administrative correction

## Updates

Commonly modified:

```text
limit_value
is_unlimited
effective_from
effective_to
updated_at
```

## Deletes

Physical deletion should generally be avoided where quota history is commercially or operationally important.

The lifecycle calls for archival rather than deletion.

---

# 18. Caching Strategy

The source recommends Redis:

```text
tenant-usage-limits:{tenant_id}
```

This is appropriate because:

```text
Reads = Very High
Writes = Low
```

---

## Conceptual Cache Value

```json
{
  "users": {
    "limit": 5000,
    "unit": "count",
    "unlimited": false
  },
  "policies": {
    "limit": 1000000,
    "unit": "count",
    "unlimited": false
  },
  "storage": {
    "limit": 5,
    "unit": "tb",
    "unlimited": false
  },
  "api_calls": {
    "limit": null,
    "unit": "requests",
    "unlimited": true
  }
}
```

This is an implementation example rather than a source-defined cache payload.

---

## Runtime Flow

```text
Incoming Operation
       ↓
Tenant Context
       ↓
Redis
tenant-usage-limits:{tenant_id}
       │
       ├── HIT
       │    ↓
       │  Quota
       │
       └── MISS
             ↓
      tenant_usage_limits
             ↓
           Redis
```

---

## Cache Invalidation

Invalidate when quota configuration changes, including:

```text
TenantUsageLimitAssigned
TenantUsageLimitUpdated
TenantUsageLimitIncreased
TenantUsageLimitReduced
TenantUsageLimitExpired
```

---

## Database Authority

```text
PostgreSQL
    ↓
Authoritative quota state

Redis
    ↓
Runtime acceleration
```

If Redis is unavailable, the system should be able to fall back to the database or an appropriate quota service rather than silently treating the tenant as unlimited.

---

# 19. Security Considerations

The source specifies:

> Tenant-scoped administration, RBAC, quota validation, and audit logging.

These are essential because usage limits directly affect commercial entitlements and operational access.

---

## Tenant-Scoped Administration

Quota modification must always be performed within an authorized tenant context.

---

## RBAC

Quota management should be restricted to privileged roles.

Conceptually:

```text
Platform Administrator
        ↓
Can manage quota policies

Tenant Commercial Administrator
        ↓
Can manage authorized quota settings

Ordinary Employee
        ↓
Cannot change quota
```

---

## Prevent Quota Escalation

A normal tenant user must not be able to change:

```text
limit_value = 1,000
```

to:

```text
limit_value = 1,000,000,000
```

through an ordinary application request.

Quota mutation should pass through:

```text
Authorization
      ↓
Commercial entitlement validation
      ↓
Policy validation
      ↓
Audit
      ↓
Mutation
```

---

## Auditability

Quota changes can affect:

- Revenue
- Capacity
- Service availability
- Billing
- Contract compliance

Therefore every privileged change should be auditable.

---

# 20. Audit Requirements

The source defines:

| Event | Trigger | Purpose |
|---|---|---|
| `TenantUsageLimitAssigned` | Initial quota assigned | Record quota creation |
| `TenantUsageLimitUpdated` | Quota configuration changed | Record general modification |
| `TenantUsageLimitIncreased` | Quota increased | Record capacity increase |
| `TenantUsageLimitReduced` | Quota reduced | Record capacity reduction |
| `TenantUsageLimitExpired` | Quota reaches end of validity | Record expiration |

---

## `TenantUsageLimitAssigned`

Generated when a tenant receives a quota.

Example:

```text
Tenant A
Policies
100,000
   ↓
TenantUsageLimitAssigned
```

## `TenantUsageLimitUpdated`

Generated for non-directional configuration changes.

## `TenantUsageLimitIncreased`

Example:

```text
100,000
   ↓
500,000
```

## `TenantUsageLimitReduced`

Example:

```text
500,000
   ↓
100,000
```

This can have operational consequences if current usage already exceeds the new limit.

## `TenantUsageLimitExpired`

Generated when the effective period ends.

---

## Recommended Audit Payload

A production implementation should consider:

```text
event_id
tenant_id
usage_limit_id
resource_code
actor_id
previous_limit_value
new_limit_value
previous_unit
new_unit
previous_unlimited_state
new_unlimited_state
effective_from
effective_to
reason
occurred_at
correlation_id
source_service
```

This payload is a production recommendation, not a source-defined event contract.

---

# 21. Event Producers / Event Consumers

The source identifies producers:

- `TenantUsageLimitAssigned`
- `TenantUsageLimitUpdated`

and consumers:

- Usage Enforcement
- Billing
- API Gateway
- Storage Service
- AI Service

---

## Assignment Workflow

```text
Subscription / Tenant Provisioning
              ↓
      Usage Limit Service
              ↓
     tenant_usage_limits
              ↓
TenantUsageLimitAssigned
              ↓
          Event Bus
      ┌───────┼────────┬───────────┐
      ▼       ▼        ▼           ▼
 Usage     Billing   Storage      AI
Enforcement          Service    Service
```

---

## Quota Increase Workflow

```text
Enterprise Request
        ↓
Commercial Approval
        ↓
Quota Update
        ↓
TenantUsageLimitIncreased
        ↓
Event Bus
        ↓
Usage Enforcement
        ↓
New quota active
```

---

## Quota Reduction Workflow

```text
Quota Reduction
      ↓
TenantUsageLimitReduced
      ↓
Usage Enforcement
      ↓
Compare current usage
      ↓
Within limit?
   ┌──┴──┐
  YES    NO
   │      │
   ▼      ▼
Normal   Policy-specific
operation handling
```

The exact over-limit response is outside the source.

---

# 22. Alternative Designs Considered

| Option | Description | Verdict |
|---|---|---|
| A | Store in subscription table | Rejected |
| B | JSON quotas | Rejected |
| C | Dedicated table | Chosen |

## Option A — Store Quotas in Subscription

Example:

```text
tenant_subscription_plans
│
├── plan_code
├── monthly_price
├── user_limit
├── policy_limit
├── claim_limit
├── storage_limit
├── api_limit
└── ai_limit
```

### Rejected

This would make the subscription table responsible for two separate concepts:

```text
Commercial Contract
        +
Operational Resource Quotas
```

It would also make enterprise custom quotas increasingly difficult to represent.

Every new resource would require another subscription column.

---

## Option B — JSON Quotas

Example:

```json
{
  "users": 5000,
  "policies": 1000000,
  "claims": 500000,
  "storage_gb": 5000,
  "api_calls": 50000000
}
```

### Rejected

Although flexible, JSON would weaken:

- Relational integrity
- Resource-level indexing
- Queryability
- Constraint enforcement
- Quota lifecycle management
- Administrative reporting
- Resource-level auditing

It would also make the relationship between quota definitions and usage counters less explicit.

---

## Option C — Dedicated Table

### Chosen

A dedicated table provides:

- Tenant isolation
- Resource-level uniqueness
- Strong relational constraints
- Efficient runtime lookup
- Enterprise customization
- Quota lifecycle management
- Effective dates
- Auditability
- High-read caching
- Separation from subscription and billing

This is the correct design under the source architecture.

---

# 23. Final Design Assessment

| Attribute | Rating |
|---|---|
| Complexity | **Medium** |
| Read Volume | **Very High** |
| Write Volume | **Low** |
| Security Importance | **High** |
| Business Criticality | **Very High** |
| Scalability | **Excellent** |
| Recommended Status | **Core Business Table** |

---

# Overall Assessment

The `tenant_usage_limits` table is the **quota policy layer** of the Tenant Management domain.

Its architectural position is:

```text
                     TENANT
                        │
                        ▼
             tenant_subscription_plans
                        │
                        │ commercial entitlement
                        ▼
             tenant_usage_limits
                        │
                        │ permitted capacity
                        ▼
             tenant_usage_counters
                        │
                        │ actual consumption
                        ▼
               Usage Enforcement
```

The distinction between the three layers is critical:

### Subscription

```text
"What commercial plan does this tenant have?"
```

### Usage Limit

```text
"What is this tenant allowed to consume?"
```

### Usage Counter

```text
"What has this tenant actually consumed?"
```

---

## Example: Policy Quota

Suppose:

```text
Subscription:
Enterprise
```

produces:

```text
Usage Limit:
resource_code = policies
limit_value = 1,000,000
limit_unit = count
```

The actual tenant has:

```text
Usage Counter:
resource_code = policies
current_value = 742,350
```

Therefore:

```text
742,350 / 1,000,000
```

means:

```text
74.235% consumed
```

The limit table does not calculate this itself.

The enforcement/usage layer combines the two.

---

# Critical Production Invariants

1. **Every usage limit belongs to exactly one tenant.**
2. **`resource_code` must be stable and machine-readable.**
3. **`resource_name` is presentation metadata and should not be the runtime identity.**
4. **`(tenant_id, resource_code)` is the source-defined candidate key.**
5. **A resource code is not globally unique; it is unique within a tenant.**
6. **`limit_value` represents permitted capacity, not actual consumption.**
7. **Actual consumption belongs in `tenant_usage_counters`.**
8. **A usage limit is not a billing transaction.**
9. **A usage limit is not a subscription.**
10. **A usage limit is not a feature flag.**
11. **`limit_unit` must always establish the semantic meaning of `limit_value`.**
12. **`is_unlimited` must be handled explicitly rather than inferred from arbitrary numeric values.**
13. **Quota changes require privileged authorization.**
14. **Quota records must always be tenant-scoped.**
15. **Quota changes must be auditable.**
16. **Runtime quota reads should be cacheable because reads are very high and writes are low.**
17. **The database remains authoritative over Redis.**
18. **Quota reductions can create an over-limit condition and therefore require downstream enforcement policy.**
19. **Effective dates must be respected when determining the active quota.**
20. **The source currently specifies `UNIQUE(tenant_id, resource_code)` despite having effective-date fields; if true historical quota versions are required, this must be explicitly redesigned rather than silently changing the constraint.**
21. **Do not add `subscription_id` merely because quotas originate commercially from subscriptions; the source deliberately keeps the quota table independently tenant-scoped.**
22. **Do not put actual usage into this table.**
23. **Do not put invoices, payments, or billing transactions into this table.**
24. **Do not use JSON as a substitute for the relational quota model.**
25. **The table should remain focused on the question: “What is this tenant allowed to consume?”**

---

# Final Conceptual Model

```text
┌──────────────────────────────────┐
│              Tenant              │
└────────────────┬─────────────────┘
                 │
                 ▼
┌──────────────────────────────────┐
│   tenant_subscription_plans      │
│                                  │
│ Commercial Entitlement           │
└────────────────┬─────────────────┘
                 │
                 ▼
┌──────────────────────────────────┐
│      tenant_usage_limits         │
│                                  │
│ Contractual / Licensed Quota     │
│                                  │
│ resource_code                    │
│ limit_value                      │
│ limit_unit                       │
│ is_unlimited                     │
│ effective_from                   │
│ effective_to                     │
└────────────────┬─────────────────┘
                 │
                 │ compare against
                 ▼
┌──────────────────────────────────┐
│     tenant_usage_counters        │
│                                  │
│ Actual Consumption               │
│                                  │
│ resource_code                    │
│ current_value                    │
│ measurement_period               │
└────────────────┬─────────────────┘
                 │
                 ▼
┌──────────────────────────────────┐
│       Usage Enforcement          │
│                                  │
│ current usage < permitted quota  │
└──────────────────────────────────┘
```

The essential architectural distinction is:

> **`tenant_usage_limits` defines the contractual/licensed capacity available to a tenant; `tenant_usage_counters` measures the tenant's actual consumption.**

This separation is what allows InsureIQ to support **subscription-based quotas, enterprise custom limits, usage-based licensing, high-frequency quota enforcement, billing integration, capacity planning, and resource-specific controls** without coupling commercial subscriptions to live operational usage.

**Step 3 — `tenant_usage_limits` is complete.**

I have **not created the file yet**. The next response is **Step 4 — exact packaging of this Step 3 content into the Table 13 `.md` file**.
