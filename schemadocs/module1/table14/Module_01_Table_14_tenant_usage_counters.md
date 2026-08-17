# Step 3 — Table 14: `tenant_usage_counters`

The Module 1 inventory establishes `tenant_usage_counters` as **Table 14**, with the purpose **“Current platform usage statistics.”**

The source defines this table as the place where **current resource consumption for each tenant** is maintained. It complements `tenant_usage_limits`: limits answer **what the tenant is allowed to consume**, while counters answer **what the tenant has actually consumed**.

I am deliberately restoring the documentation to the non-degraded standard. The source's original `Field / Type / Notes` schema is expanded into:

**Field Name → Data Type → Key Type → Specification → Reason Field Exists**

The source fields themselves are preserved; production-grade additions are explicitly identified as architectural recommendations rather than silently inserted into the baseline schema.

---

# 1. Why This Table Exists

The `tenant_usage_counters` table stores **current resource consumption for each tenant**.

It complements:

```text
tenant_usage_limits
```

by recording actual usage for:

- Quota enforcement
- Usage monitoring
- Billing support
- Operational dashboards
- Capacity planning
- Analytics

The fundamental distinction is:

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
 "How much may         "How much has
  be consumed?"         been consumed?"
```

For example:

```text
tenant_usage_limits
────────────────────
API Calls = 1,000,000
Storage   = 500 GB
Users     = 250
Policies  = 100,000
```

versus:

```text
tenant_usage_counters
──────────────────────
API Calls = 642,391
Storage   = 318 GB
Users     = 187
Policies  = 74,201
```

The counter is therefore **operational measurement data**.

---

# 2. Business Definition

A **Tenant Usage Counter** records the current measured consumption of a specific resource by a tenant.

Examples include:

- Users
- Customers
- Policies
- Claims
- Storage
- API Calls
- AI Requests

The table answers:

> **How much of this resource has the tenant currently consumed?**

It does not answer:

> How much is the tenant allowed to consume?

That belongs to:

```text
tenant_usage_limits
```

It does not answer:

> What subscription does the tenant have?

That belongs to:

```text
tenant_subscription_plans
```

It does not answer:

> What individual usage events occurred?

Those belong in a separate usage-event/telemetry architecture if detailed event history is required.

---

## Example

Suppose:

```text
Tenant:
ABC Insurance
```

has:

```text
Subscription:
Enterprise
```

and:

```text
Usage Limit:
Policies = 1,000,000
```

The counter may contain:

```text
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

The counter itself does not need to store the percentage.

---

# 3. Critical Design Principle — What the Entity IS and IS NOT

## The Tenant Usage Counter IS

- An operational metric.
- Resource-consumption data.
- A child entity of the Tenant aggregate.
- Current usage state.
- A runtime input to quota enforcement.
- A source for usage dashboards.
- A source for billing-support calculations.
- A capacity-planning input.

## The Tenant Usage Counter IS NOT

- A contractual usage limit.
- A subscription.
- An invoice.
- A payment transaction.
- A billing ledger.
- A user permission.
- A feature flag.
- A complete historical usage-event log.

This separation is critical.

```text
Subscription
     ↓
commercial entitlement

Usage Limit
     ↓
permitted capacity

Usage Counter
     ↓
current consumption
```

---

## Critical Architectural Separation

```text
tenant_subscription_plans
          │
          │ commercial relationship
          ▼
tenant_usage_limits
          │
          │ permitted quantity
          ▼
tenant_usage_counters
          │
          │ actual quantity
          ▼
Usage Enforcement
```

This is one of the most important relationships in the Tenant Management domain.

---

# 4. Aggregate Root Analysis — DDD Structure

The source defines:

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

The conceptual distinction is:

```text
Tenant
   │
   ├── Usage Limit
   │      └── defines what is allowed
   │
   └── Usage Counter
          └── records current consumption
```

---

## Aggregate Ownership

Every usage counter belongs to exactly one tenant.

```text
tenant_usage_counters.tenant_id
          ↓
       tenants.id
```

The tenant is therefore the ownership and isolation boundary.

---

# 5. Business Capabilities Supported

| Capability | Supported |
|---|---|
| Quota enforcement | Yes |
| Usage monitoring | Yes |
| Billing support | Yes |
| Capacity planning | Yes |
| Operational dashboards | Yes |
| Analytics | Yes |
| Contractual quota definition | No — `tenant_usage_limits` |
| Payment processing | No |
| Invoice generation | No |

---

## Quota Enforcement

The enforcement system can compare:

```text
Current Usage
      vs.
Allowed Limit
```

For example:

```text
Current policies = 742,350
Policy limit     = 1,000,000
```

Result:

```text
742,350 < 1,000,000
```

The tenant remains within quota.

---

## Usage Monitoring

Dashboards can display:

```text
Policies
742,350 / 1,000,000

Storage
318 GB / 500 GB

API Calls
642,391 / 1,000,000
```

The counter provides the numerator.

---

# 6. Multi-Tenant / Ownership / Isolation Notes

Each counter belongs to exactly one tenant.

```text
tenant_usage_counters.tenant_id
          ↓
       tenants.id
```

The same resource can exist independently for different tenants:

```text
Tenant A
policies = 742,350

Tenant B
policies = 82,400

Tenant C
policies = 9,832,771
```

The tenant boundary therefore forms part of the logical identity.

---

## Tenant Isolation

Correct:

```sql
SELECT *
FROM tenant_usage_counters
WHERE tenant_id = :tenant_id;
```

Correct for one resource:

```sql
SELECT current_value
FROM tenant_usage_counters
WHERE tenant_id = :tenant_id
AND resource_code = :resource_code;
```

---

## Security Boundary

Usage counters can reveal commercially sensitive information.

For example:

```text
API Calls = 9,821,432
AI Requests = 7,451,221
Policies = 3,721,883
```

This can reveal tenant scale, business activity, or consumption patterns.

Therefore tenant isolation must be enforced at:

```text
API
 ↓
Service
 ↓
Repository
 ↓
Database
```

not merely at the UI.

---

# 7. Lifecycle

The lifecycle is:

```text
Creation:
Counters Initialized

Growth:
Counters Incremented

Modification:
Counters Updated Continuously

Archival:
Counters Frozen
```

---

## Creation — Counters Initialized

When a tenant is provisioned:

```text
Tenant
   ↓
Usage Counter Initialization
   ↓
users = 0
customers = 0
policies = 0
claims = 0
...
```

The initial value will normally be zero for count-based resources, although the exact initialization semantics depend on the resource.

---

## Growth — Counters Incremented

Example:

```text
Policies
100
 ↓
101
 ↓
102
 ↓
103
```

The counter is continuously changed as the underlying resource population changes.

---

## Modification — Counters Updated Continuously

The source classifies writes as **Extremely High**.

This is important.

Unlike:

```text
tenant_usage_limits
```

which changes infrequently, usage counters can change constantly.

For example:

```text
Policy Created
      ↓
policy usage +1

Policy Deleted
      ↓
policy usage -1

API Request
      ↓
API usage +1

AI Request
      ↓
AI usage +1
```

---

## Archival — Counters Frozen

When a tenant becomes inactive or is otherwise archived:

```text
Active Counter
      ↓
Frozen
```

The source describes archival as **counters frozen**, not physical deletion.

---

# 8. Proposed Schema

## Table Name

`tenant_usage_counters`

## Primary Key Strategy

**UUID**

---

## Full Field-by-Field Schema Definition

| Field Name | Data Type | Key Type | Specification | Reason Field Exists |
|---|---|---|---|---|
| `id` | UUID | PK | `NOT NULL` | Stable unique identity of the usage-counter record |
| `tenant_id` | UUID | FK → `tenants.id` | `NOT NULL` | Establishes tenant ownership and isolation |
| `resource_code` | VARCHAR(100) | UK with `tenant_id` | `NOT NULL` | Stable machine-readable identifier for the measured resource |
| `resource_name` | VARCHAR(200) | — | `NOT NULL` | Human-readable description of the measured resource |
| `current_value` | BIGINT | — | `NOT NULL` | Stores the current measured resource consumption |
| `last_reset_at` | TIMESTAMPTZ | — | `NULL` | Records when the current measurement period was last reset |
| `measurement_period` | ENUM | — | `NOT NULL` | Defines the temporal scope of the counter |
| `updated_at` | TIMESTAMPTZ | — | `NOT NULL` | Records when the current usage value was last changed |
| `created_at` | TIMESTAMPTZ | — | `NOT NULL` | Records when the counter was initialized |

These fields are the source-defined Table 14 fields.

---

## `id`

UUID provides the technical identity of the counter.

Example:

```text
Tenant A
Policies
       ↓
Counter ID = UUID
```

The UUID is not intended to be the resource identity used by runtime services.

---

## `tenant_id`

Establishes ownership:

```text
tenant_usage_counters.tenant_id
          ↓
       tenants.id
```

Every counter must belong to exactly one tenant.

---

## `resource_code`

Stable machine-readable identifier.

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

This field is critical for runtime services because services need a stable identifier to update and validate counters.

---

## `resource_name`

Human-readable resource name.

Examples:

```text
Users
Customers
Policies
Claims
Storage
API Calls
AI Requests
```

It should not be used as the primary machine identity.

---

## `current_value`

The actual current measured consumption.

Examples:

```text
users       = 187
policies    = 742350
api_calls   = 642391
storage     = 318
```

The unit is interpreted together with the resource definition.

---

## `last_reset_at`

Records when the counter was last reset.

This becomes particularly important for periodic counters.

Example:

```text
measurement_period = monthly

last_reset_at =
2026-08-01 00:00:00
```

---

## `measurement_period`

Defines the temporal scope of the measurement.

For example:

```text
realtime
daily
monthly
lifetime
```

This prevents:

```text
current_value = 500
```

from being interpreted without knowing whether 500 means:

```text
500 requests right now
500 requests today
500 requests this month
500 requests over the tenant lifetime
```

---

## `updated_at`

Records the latest counter modification.

Because writes are extremely high, this timestamp is operationally useful for:

- monitoring,
- freshness detection,
- synchronization,
- troubleshooting.

---

## `created_at`

Records when the counter was initialized.

---

# 9. Enum Definitions

The `measurement_period` enum is:

| Value | Description |
|---|---|
| `realtime` | Current continuously updated consumption |
| `daily` | Consumption measured for a daily period |
| `weekly` | Consumption measured for a weekly period |
| `monthly` | Consumption measured for a monthly period |
| `yearly` | Consumption measured for a yearly period |
| `lifetime` | Cumulative consumption over the tenant/resource lifetime |

---

## Why Measurement Period Matters

Consider:

```text
current_value = 50,000
```

Without the period, this is ambiguous.

It could mean:

```text
50,000 API requests this minute
```

or:

```text
50,000 API requests this month
```

or:

```text
50,000 API requests since tenant creation
```

The `measurement_period` establishes that semantic boundary.

---

# 10. Why `resource_code` Exists

`resource_code` provides a stable identifier for internal services to update and validate counters.

This is particularly important because this table is likely to sit directly in runtime usage paths.

For example:

```text
Policy Service
      ↓
resource_code = policies
      ↓
tenant_usage_counters
```

or:

```text
API Gateway
      ↓
resource_code = api_calls
      ↓
tenant_usage_counters
```

---

## Runtime Update

A service can identify the correct counter with:

```sql
UPDATE tenant_usage_counters
SET current_value = current_value + 1,
    updated_at = NOW()
WHERE tenant_id = :tenant_id
AND resource_code = :resource_code;
```

The `resource_code` therefore becomes part of the internal usage contract.

---

## Why Not `resource_name`?

Because:

```text
resource_name = Insurance Policies
```

could change to:

```text
resource_name = Policies
```

without changing the underlying resource.

The machine-level identifier should remain:

```text
policies
```

---

# 11. Candidate Keys

| Key Type | Field(s) | Rationale |
|---|---|---|
| Primary Key | `id` | Stable technical identity |
| Candidate Key | `(tenant_id, resource_code)` | Identifies the tenant's counter for a resource |

The candidate key is:

```text
tenant_id + resource_code
```

---

## Important Measurement-Period Consideration

The source explicitly defines:

```text
UNIQUE(tenant_id, resource_code)
```

while also defining:

```text
measurement_period
```

Therefore the baseline source design assumes one counter per:

```text
tenant + resource
```

rather than multiple simultaneous counters for different periods.

For example, under the source model:

```text
Tenant A
    policies
```

has one counter.

It does not simultaneously have:

```text
policies + daily
policies + monthly
policies + lifetime
```

as separate rows.

If production requirements later demand multiple independently maintained periods, the key would need to evolve to something like:

```text
(tenant_id, resource_code, measurement_period)
```

or the periodic aggregation would need to be modeled elsewhere.

**Do not silently change the source-defined key in the baseline design.**

---

# 12. Constraints

The source explicitly defines:

```text
PK(id)
FK(tenant_id)
UNIQUE(tenant_id, resource_code)
```

The expanded constraint model is:

| Constraint | Definition | Reason |
|---|---|---|
| Primary Key | `PK(id)` | Unique counter identity |
| Tenant FK | `tenant_id → tenants.id` | Establishes ownership |
| Resource Uniqueness | `UNIQUE(tenant_id, resource_code)` | One counter per tenant/resource |
| Tenant Required | `tenant_id NOT NULL` | Counter must belong to a tenant |
| Resource Code Required | `resource_code NOT NULL` | Runtime identity required |
| Resource Name Required | `resource_name NOT NULL` | Human-readable identity |
| Current Value Required | `current_value NOT NULL` | Counter must have a value |
| Measurement Period Required | `measurement_period NOT NULL` | Establishes measurement semantics |
| Timestamp Required | `created_at`, `updated_at NOT NULL` | Lifecycle tracking |

---

## Production Counter Validation

A natural production invariant for count-based resources is:

```sql
CHECK (current_value >= 0)
```

However, whether negative values should ever be permitted depends on the resource semantics.

For ordinary quantities such as:

```text
users
policies
claims
documents
storage
```

negative usage should be invalid.

The source does not explicitly specify this CHECK constraint, so it remains an implementation recommendation.

---

## Atomicity Requirement

Because writes are extremely high, increments must be atomic.

Prefer:

```sql
UPDATE tenant_usage_counters
SET current_value = current_value + :delta,
    updated_at = NOW()
WHERE tenant_id = :tenant_id
AND resource_code = :resource_code;
```

rather than:

```text
SELECT current_value
      ↓
Application adds 1
      ↓
UPDATE current_value
```

The latter can introduce lost updates under concurrency.

This is an implementation-level production requirement inferred from the source's **Extremely High** write classification.

---

# 13. Relationships

## Incoming References / Logical Consumers

The source identifies:

- Usage Enforcement
- Billing
- Analytics
- Dashboard

The event-consumer model additionally identifies:

- Monitoring

---

## Outgoing References

```text
tenant_id → tenants.id
```

The source defines no other physical FK.

---

## Relationship to `tenant_usage_limits`

The conceptual relationship is:

```text
tenant_usage_limits
        │
        │ permitted
        ▼
tenant_usage_counters
        │
        │ consumed
        ▼
Usage Enforcement
```

The two tables share:

```text
tenant_id
resource_code
```

but should remain separate.

---

## Relationship to Subscription

The indirect relationship is:

```text
tenant_subscription_plans
          ↓
tenant_usage_limits
          ↓
tenant_usage_counters
```

The counter should not contain:

```text
subscription_id
```

because actual usage can continue across subscription changes.

---

# 14. Cardinality Analysis

The source defines:

> **Counters per tenant: 20–100**

| Relationship | Expected Cardinality |
|---|---:|
| Tenant → Usage Counters | 20–100 |
| Usage Counter → Tenant | Exactly 1 |
| Resource Code → Tenants | 0–N |
| Tenant + Resource Code → Counter | 1 |

---

## Scale Example

At:

```text
100,000 tenants
×
100 counters
```

the counter table contains approximately:

```text
10,000,000 rows
```

The number of rows is manageable.

The more important scaling challenge is **write frequency**, not merely row count.

For example:

```text
10 million counter rows
```

could still be easy to store.

But:

```text
millions of updates per second
```

would require careful architecture.

Therefore the source's:

```text
Reads = Very High
Writes = Extremely High
```

is more operationally important than the table's raw cardinality.

---

# 15. Query Patterns

## Retrieve All Tenant Counters

```sql
SELECT *
FROM tenant_usage_counters
WHERE tenant_id = :tenant_id;
```

## Retrieve Specific Counter

```sql
SELECT current_value
FROM tenant_usage_counters
WHERE tenant_id = :tenant_id
AND resource_code = :resource_code;
```

This is likely the critical runtime lookup.

---

## Retrieve Counter With Metadata

```sql
SELECT
    resource_code,
    resource_name,
    current_value,
    measurement_period,
    last_reset_at,
    updated_at
FROM tenant_usage_counters
WHERE tenant_id = :tenant_id
AND resource_code = :resource_code;
```

---

## Atomic Increment

A production implementation should use:

```sql
UPDATE tenant_usage_counters
SET current_value = current_value + :delta,
    updated_at = NOW()
WHERE tenant_id = :tenant_id
AND resource_code = :resource_code;
```

This avoids read-modify-write races.

---

## Atomic Decrement

For resources where consumption can decrease:

```sql
UPDATE tenant_usage_counters
SET current_value = current_value - :delta,
    updated_at = NOW()
WHERE tenant_id = :tenant_id
AND resource_code = :resource_code;
```

The application/database should prevent invalid negative values where the resource semantics require non-negative usage.

---

## Quota Comparison

A service can retrieve:

```sql
SELECT
    l.limit_value,
    l.is_unlimited,
    c.current_value
FROM tenant_usage_limits l
JOIN tenant_usage_counters c
  ON c.tenant_id = l.tenant_id
 AND c.resource_code = l.resource_code
WHERE l.tenant_id = :tenant_id
AND l.resource_code = :resource_code;
```

Then evaluate:

```text
current_value
      <
limit_value
```

for finite quotas.

---

# 16. Index Strategy

The source recommends:

- `PK(id)`
- `INDEX(tenant_id)`
- `UNIQUE(tenant_id, resource_code)`
- `INDEX(measurement_period)`
- `INDEX(updated_at)`

---

## Primary Key

```sql
PRIMARY KEY (id)
```

Provides stable direct lookup.

---

## Tenant Index

```sql
INDEX(tenant_id)
```

Supports:

```sql
SELECT *
FROM tenant_usage_counters
WHERE tenant_id = :tenant_id;
```

---

## Composite Unique Index

```sql
UNIQUE(tenant_id, resource_code)
```

This is particularly important because it:

1. Enforces the source's candidate key.
2. Supports runtime resource lookup.
3. Prevents duplicate counters for the same tenant/resource.

---

## Measurement Period Index

```sql
INDEX(measurement_period)
```

Supports reporting and operational queries by measurement scope.

Its actual usefulness should be evaluated because the enum has low cardinality.

---

## Updated Timestamp Index

```sql
INDEX(updated_at)
```

Useful for:

- stale-counter detection,
- synchronization,
- monitoring,
- operational diagnostics.

---

## High-Write Consideration

Every additional index increases write cost.

This table is explicitly classified as having **Extremely High writes**.

Therefore the index set should remain intentionally small.

Do not add indexes merely because a column is queryable.

Measure actual production workloads.

---

# 17. Read / Write Characteristics

The source classifies:

```text
Reads: Very High
Writes: Extremely High
```

This is one of the most operationally important tables in the module.

---

## Reads

Potential high-volume reads include:

- API quota checks
- Usage dashboards
- Billing calculations
- Analytics
- Capacity monitoring
- Administrative usage views
- Operational monitoring

---

## Writes

Writes can occur on:

```text
Policy creation
Policy deletion
Claim creation
Claim deletion
Customer creation
Customer deletion
User creation
User deactivation
Document upload
API request
AI request
Storage change
```

depending on the resource.

---

## Updates

The primary mutable field is:

```text
current_value
```

along with:

```text
updated_at
```

and occasionally:

```text
last_reset_at
measurement_period
```

---

## Deletes

Physical deletion should generally not be part of normal runtime operation.

The source describes archival as **freezing counters**, not deleting them.

---

# 18. Caching Strategy

The source recommends:

```text
tenant-usage-counters:{tenant_id}
```

in Redis.

Caching can substantially reduce database reads because:

```text
Reads = Very High
```

---

## Conceptual Cache

```json
{
  "users": {
    "current_value": 187,
    "measurement_period": "lifetime"
  },
  "policies": {
    "current_value": 742350,
    "measurement_period": "lifetime"
  },
  "api_calls": {
    "current_value": 642391,
    "measurement_period": "monthly"
  }
}
```

This is an implementation example, not a source-defined cache contract.

---

## Runtime Flow

```text
Operation
    ↓
Tenant Context
    ↓
Redis
tenant-usage-counters:{tenant_id}
    │
    ├── HIT
    │    ↓
    │  Current Usage
    │
    └── MISS
         ↓
tenant_usage_counters
         ↓
       Redis
```

---

## Critical Difference From Usage Limits

For `tenant_usage_limits`:

```text
Writes = Low
```

so cache invalidation is comparatively easy.

For `tenant_usage_counters`:

```text
Writes = Extremely High
```

therefore naïvely invalidating the cache on every increment may itself become expensive.

A production architecture should carefully choose between:

```text
Cache-aside
```

and:

```text
Write-through / atomic cache update
```

depending on consistency requirements.

---

## Source-of-Truth Principle

The database remains authoritative.

```text
Database
   ↓
Authoritative usage state

Redis
   ↓
Acceleration / runtime optimization
```

The system must never interpret:

```text
Redis miss
```

as:

```text
usage = 0
```

---

# 19. Security Considerations

The source specifies:

- Tenant isolation
- RBAC
- Controlled updates
- Validation
- Audit logging

---

## Tenant Isolation

Every usage operation must contain tenant context.

---

## RBAC

Ordinary users should generally have:

```text
READ
```

access only to usage information appropriate to their role.

Mutation should be restricted to trusted services.

For example:

```text
Policy Service
     ↓
authorized usage update
```

is preferable to:

```text
Browser
     ↓
directly modifies current_value
```

---

## Controlled Updates

Because counters affect quotas and potentially billing, arbitrary client-side mutation must be prohibited.

The preferred architecture is:

```text
Business Event
      ↓
Authorized Service
      ↓
Usage Counter Update
```

---

## Validation

Usage updates must validate:

- Tenant ownership.
- Resource code.
- Measurement period.
- Delta semantics.
- Counter boundaries.
- Authorization.
- Idempotency where applicable.

---

## Audit Logging

Corrections and administrative changes should be auditable.

However, logging every high-frequency counter increment synchronously into a traditional audit table could create unacceptable write amplification.

Therefore:

```text
normal increment
    ↓
operational event/telemetry

administrative correction
    ↓
strong audit event
```

is generally a better production separation.

This is an architectural recommendation; the source only requires audit logging.

---

# 20. Audit Requirements

The source defines the following events:

| Event | Trigger | Purpose |
|---|---|---|
| `TenantUsageCounterInitialized` | Counter created | Record initialization |
| `TenantUsageCounterIncremented` | Usage increases | Record increase |
| `TenantUsageCounterDecremented` | Usage decreases | Record decrease |
| `TenantUsageCounterReset` | Counter reset | Record measurement reset |
| `TenantUsageCounterCorrected` | Manual/system correction | Record exceptional correction |

---

## `TenantUsageCounterInitialized`

Example:

```text
Tenant A
Policies
0
↓
TenantUsageCounterInitialized
```

---

## `TenantUsageCounterIncremented`

Example:

```text
742,349
   ↓
742,350
```

This event represents increased consumption.

Because increments can happen at extremely high volume, the implementation should determine whether every increment needs durable event publication or whether aggregation/batching is appropriate.

---

## `TenantUsageCounterDecremented`

Example:

```text
742,350
   ↓
742,349
```

Used when consumption decreases.

---

## `TenantUsageCounterReset`

Relevant for:

```text
daily
weekly
monthly
yearly
```

measurement periods.

Example:

```text
2026-08-31
API Calls = 950,000

        ↓ reset

2026-09-01
API Calls = 0
```

---

## `TenantUsageCounterCorrected`

Used when an operator or trusted process detects an inaccurate counter.

Example:

```text
Current = 742,350
Actual  = 742,410
```

Correction:

```text
742,350
   ↓
742,410
```

Corrections should carry strong audit context.

---

# 21. Event Producers / Event Consumers

## Producers

- `TenantUsageCounterIncremented`
- `TenantUsageCounterReset`

## Consumers

- Usage Enforcement
- Billing
- Analytics
- Dashboard
- Monitoring

---

## Usage Increment Workflow

```text
Business Operation
      ↓
Usage-producing service
      ↓
tenant_usage_counters
      ↓
TenantUsageCounterIncremented
      ↓
Event Bus
   ┌───────┬─────────┬──────────┬────────────┐
   ▼       ▼         ▼          ▼
Usage    Billing   Analytics  Monitoring
```

---

## Quota Enforcement Workflow

```text
Business Operation
      ↓
Current Usage
      ↓
tenant_usage_counters
      ↓
Compare with tenant_usage_limits
      ↓
Within quota?
   ┌──┴──┐
  YES    NO
   │      │
   ▼      ▼
Allow   Restrict / reject /
        warning / overage
```

The exact behavior when a quota is exceeded is not specified by the source.

---

## Billing Relationship

The source identifies Billing as a consumer.

Conceptually:

```text
Usage Counter
      ↓
Billing
      ↓
Usage-based commercial calculation
```

But:

```text
usage counter ≠ billing transaction
```

The counter should remain operational data.

---

# 22. Alternative Designs Considered

| Option | Description | Verdict |
|---|---|---|
| A | Store in usage limits | Rejected |
| B | JSON counters | Rejected |
| C | Dedicated table | Chosen |

## Option A — Store in Usage Limits

Example:

```text
tenant_usage_limits
│
├── limit_value
└── current_value
```

### Rejected

This would combine:

```text
Policy
+
Operational State
```

into one entity.

The two have fundamentally different characteristics:

```text
Limits
Reads: Very High
Writes: Low
```

versus:

```text
Counters
Reads: Very High
Writes: Extremely High
```

Combining them would also make the semantic distinction between entitlement and consumption unclear.

---

## Option B — JSON Counters

Example:

```json
{
  "users": 187,
  "policies": 742350,
  "claims": 18542,
  "api_calls": 642391,
  "ai_requests": 72194
}
```

### Rejected

A JSON-only counter model would weaken:

- Resource-level lookup.
- Relational integrity.
- Indexing.
- Concurrency control.
- Resource-level auditing.
- Operational querying.
- Clear schema semantics.

It also becomes difficult to evolve when different resources require different measurement periods.

---

## Option C — Dedicated Table

### Chosen

The dedicated table provides:

- Tenant isolation.
- Resource-level identity.
- Strong relational constraints.
- Atomic counter operations.
- Efficient runtime lookup.
- Resource-level indexing.
- Clear measurement semantics.
- Independent scaling strategy.
- Separation from quota definitions.

This is the correct baseline architecture under the source design.

---

# 23. Final Design Assessment

| Attribute | Rating |
|---|---|
| Complexity | **Medium** |
| Read Volume | **Very High** |
| Write Volume | **Extremely High** |
| Security Importance | **High** |
| Business Criticality | **Very High** |
| Scalability | **Excellent** |
| Recommended Status | **Core Operational Table** |

---

# Overall Assessment

`tenant_usage_counters` is the **operational consumption layer** of the Tenant Management domain.

Its position is:

```text
                     TENANT
                        │
                        ▼
             tenant_subscription_plans
                        │
                        ▼
              tenant_usage_limits
                        │
                        │ allowed
                        ▼
              tenant_usage_counters
                        │
                        │ consumed
                        ▼
               Usage Enforcement
```

The three layers answer three different questions:

### Subscription

```text
"What commercial plan does the tenant have?"
```

### Usage Limit

```text
"What is the tenant allowed to consume?"
```

### Usage Counter

```text
"What has the tenant actually consumed?"
```

---

## Example: API Usage

Suppose:

```text
Subscription:
Enterprise
```

and:

```text
Usage Limit:
api_calls = 1,000,000 / month
```

The counter contains:

```text
resource_code:
api_calls

current_value:
642,391

measurement_period:
monthly
```

The runtime system can calculate:

```text
642,391 / 1,000,000
```

=

```text
64.2391%
```

The counter stores the operational measurement.

The limit stores the contractual boundary.

The enforcement service combines them.

---

# Critical Production Invariants

1. **Every usage counter belongs to exactly one tenant.**
2. **`resource_code` must be stable and machine-readable.**
3. **`resource_name` is human-readable metadata and should not be the machine identity.**
4. **`(tenant_id, resource_code)` is the source-defined candidate key.**
5. **A tenant/resource combination must not have duplicate counters under the baseline design.**
6. **`current_value` represents actual consumption, not permitted capacity.**
7. **Permitted capacity belongs in `tenant_usage_limits`.**
8. **A usage counter is not a subscription.**
9. **A usage counter is not an invoice.**
10. **A usage counter is not a payment transaction.**
11. **A usage counter is not a detailed historical event log.**
12. **`measurement_period` establishes the temporal semantics of `current_value`.**
13. **Counter mutations must be tenant-scoped.**
14. **Counter mutations must be performed by authorized trusted services.**
15. **High-frequency increments must use atomic database operations or an equally safe concurrency mechanism.**
16. **Read-modify-write counter updates should be avoided because they can lose concurrent updates.**
17. **The source-defined `UNIQUE(tenant_id, resource_code)` should remain unchanged in the baseline schema.**
18. **If multiple simultaneous measurement periods become a requirement, the schema must be deliberately redesigned rather than silently adding period to the key.**
19. **The database remains authoritative over Redis.**
20. **Redis must never interpret a cache miss as zero usage.**
21. **Usage counters should not be physically deleted during ordinary tenant lifecycle transitions.**
22. **Archival should freeze or otherwise preserve the counter state.**
23. **Administrative corrections require stronger auditing than ordinary high-frequency increments.**
24. **Every additional index must be justified because this table has extremely high write volume.**
25. **The table should remain focused on the question: “What has this tenant actually consumed?”**

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
│ Permitted Capacity               │
│                                  │
│ resource_code                    │
│ limit_value                      │
│ limit_unit                       │
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
│ last_reset_at                    │
└────────────────┬─────────────────┘
                 │
                 ▼
┌──────────────────────────────────┐
│       Usage Enforcement          │
│                                  │
│ Allow / Warn / Restrict         │
└──────────────────────────────────┘
```

The essential architectural distinction is:

> **`tenant_usage_counters` stores the current operational consumption of a tenant's resources; `tenant_usage_limits` stores the permitted capacity against which that consumption is evaluated.**

This separation allows InsureIQ to support **high-frequency usage tracking, quota enforcement, usage-based billing support, dashboards, analytics, monitoring, and capacity planning** without mixing operational consumption with commercial entitlement.

**Step 3 — `tenant_usage_counters` is complete.**

I have **not created the file yet**. The next response is **Step 4 — exact packaging of this Step 3 content into the Table 14 `.md` file**.
