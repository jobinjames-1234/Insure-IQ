# Step 3 — Table 10: `tenant_feature_overrides`

`tenant_feature_overrides` is the **exception layer for tenant feature entitlements**.

The source design defines this table as the mechanism for applying temporary or permanent exceptions to a tenant's normal feature entitlement **without modifying the base `tenant_features` record**. It specifically supports trials, beta rollouts, regulatory restrictions, emergency rollbacks, and enterprise-specific exceptions.

The critical architectural distinction is:

```text
tenant_features
      ↓
Base feature entitlement

tenant_feature_overrides
      ↓
Exception to that entitlement
```

This distinction is important because the base entitlement and an exception have different business meanings.

For example:

```text
Base entitlement:

AI Fraud Detection
is_enabled = FALSE
```

A temporary enterprise trial can then be represented as:

```text
tenant_feature_overrides

override_action = beta_enable
starts_at       = 2026-08-15
expires_at      = 2026-09-15
is_active       = TRUE
reason          = "Enterprise AI pilot"
```

The base record remains unchanged.

That gives the system a clean separation between:

```text
Normal commercial entitlement
        ↓
tenant_features

Exceptional runtime treatment
        ↓
tenant_feature_overrides
```

The source explicitly describes the table as supporting **trial licensing, beta rollout, emergency rollback, regulatory restrictions, and enterprise customization**.

---

# 1. Why This Table Exists

A production SaaS platform will inevitably require exceptions to normal entitlement rules.

The subscription or standard feature configuration may say:

```text
AI Fraud Detection = disabled
```

but an insurer may receive:

- a temporary trial,
- an early-access beta,
- a contractual exception,
- a regulatory restriction,
- an emergency feature disablement,
- a controlled rollback.

Changing the underlying `tenant_features` record directly would destroy the distinction between:

```text
normal entitlement
```

and:

```text
exceptional treatment
```

That creates problems for:

- auditing,
- subscription reconciliation,
- rollback,
- expiry,
- support,
- compliance,
- entitlement history.

The dedicated override table solves this.

---

## Example: Temporary AI Trial

Normal state:

```text
tenant_features

feature_code = ai_fraud_detection
is_enabled   = FALSE
```

Trial:

```text
tenant_feature_overrides

override_action = beta_enable
starts_at       = 2026-08-15
expires_at      = 2026-09-15
is_active       = TRUE
```

Effective runtime state:

```text
Base:
    disabled

Override:
    beta_enable

Effective:
    enabled
```

After expiry:

```text
Override:
    expired

Effective:
    disabled
```

The base entitlement never had to be changed.

---

## Why Direct Modification Is Dangerous

Consider a tenant that normally does not have OCR.

If the system simply changes:

```text
tenant_features.is_enabled
```

from:

```text
FALSE
```

to:

```text
TRUE
```

for a 30-day trial, the database no longer tells us whether:

```text
the tenant purchased OCR
```

or:

```text
the tenant was temporarily granted OCR.
```

That distinction can matter to billing and compliance.

The override layer preserves it.

---

# 2. Business Definition

A **Tenant Feature Override** represents an exceptional instruction that modifies the runtime treatment of an existing tenant feature.

The source gives these examples:

- AI Trial
- OCR Disabled
- Premium Analytics Pilot
- Regulatory Restriction

Conceptually:

```text
Tenant
   │
   └── Tenant Feature
          │
          └── Feature Override
```

The override therefore does not represent a standalone feature.

It modifies an existing feature assignment.

---

## Business Meaning

The entity answers:

> **Is there an exceptional rule currently affecting this tenant's feature entitlement?**

It does not answer:

> **What features does this tenant normally have?**

That is `tenant_features`.

It also does not answer:

> **Which users are allowed to use the feature?**

That belongs to IAM and authorization.

---

## Example

```text
tenant_features

tenant_id:
    TENANT-A

feature_code:
    ocr_processing

is_enabled:
    TRUE
```

Then:

```text
tenant_feature_overrides

tenant_id:
    TENANT-A

feature_id:
    <OCR feature UUID>

override_action:
    restrict

reason:
    "Regulatory restriction in jurisdiction X"

is_active:
    TRUE
```

Effective state:

```text
OCR
    ↓
Base entitlement = ENABLED
    ↓
Override = RESTRICT
    ↓
Effective access = RESTRICTED
```

---

# 3. Critical Design Principle — What the Entity IS and IS NOT

## The Tenant Feature Override IS

- Runtime feature override metadata.
- An exception to a base feature entitlement.
- A child entity of the Tenant aggregate.
- A mechanism for temporary feature treatment.
- A mechanism for beta access.
- A mechanism for emergency rollback.
- A mechanism for regulatory restrictions.
- A mechanism for enterprise-specific exceptions.
- An auditable entitlement exception.

## The Tenant Feature Override IS NOT

- The primary feature assignment.
- A replacement for `tenant_features`.
- A subscription plan.
- A billing transaction.
- A user permission.
- A user role.
- A permanent feature catalog.
- Application source code.
- A general-purpose tenant setting.

The source explicitly states that it is **not the primary feature assignment** and **not billing or authorization data**.

---

## The Most Important Rule

```text
tenant_features
    =
normal/base entitlement

tenant_feature_overrides
    =
exception

effective feature state
    =
base entitlement + applicable override
```

This is the core design principle of the table.

---

# 4. Aggregate Root Analysis — DDD Structure

The source provides the following DDD hierarchy:

```text
Tenant
│
├── Tenant Features
│      └── Feature
│            └── Feature Override
```

In relational terms:

```text
tenants
   │
   └── tenant_features
          │
          └── tenant_feature_overrides
```

---

## Aggregate Interpretation

The Tenant is the ultimate ownership boundary.

`tenant_features` represents the tenant's base feature state.

`tenant_feature_overrides` represents exceptional behavior applied to a particular feature assignment.

Therefore:

```text
Tenant Aggregate
│
├── Feature A
│     └── Override
│
├── Feature B
│
├── Feature C
│     └── Override
│
└── Feature D
```

Not every feature requires an override.

---

## Why the Override Points to `tenant_features`

The source explicitly states that `feature_id` links an override to an existing feature assignment and preserves referential integrity.

This prevents an override from floating independently of a tenant's actual feature entitlement.

The relationship becomes:

```text
tenant_feature_overrides.feature_id
                ↓
tenant_features.id
```

This is stronger than simply storing:

```text
tenant_id
feature_code
```

inside the override.

---

## Effective-State Model

The conceptual DDD flow is:

```text
Tenant
   ↓
Base Feature Entitlement
   ↓
Applicable Override?
   │
   ├── No
   │    ↓
   │  Base State
   │
   └── Yes
        ↓
   Override Action
        ↓
   Effective State
```

This distinction becomes important when runtime feature checks are implemented.

---

# 5. Business Capabilities Supported

| Capability | Supported |
|---|---|
| Trial licensing | Yes |
| Beta rollout | Yes |
| Emergency rollback | Yes |
| Regulatory restrictions | Yes |
| Enterprise customization | Yes |
| Temporary feature enablement | Yes |
| Temporary feature disablement | Yes |
| Feature restriction | Yes |
| Scheduled activation | Yes |
| Scheduled expiration | Yes |
| Runtime exception handling | Yes |
| Base feature entitlement | No — `tenant_features` |
| User authorization | No |
| Billing transaction management | No |
| Subscription definition | No |

The first five capabilities are explicitly identified in the source. The scheduled activation/expiration behavior follows directly from the source's `starts_at` and `expires_at` fields.

---

## Typical Business Scenarios

### Scenario 1 — AI Trial

```text
Base:
AI = disabled

Override:
beta_enable

Period:
30 days
```

---

### Scenario 2 — Emergency Disablement

```text
Base:
Fraud AI = enabled

Override:
disable

Reason:
Model incident

is_active:
true
```

---

### Scenario 3 — Regulatory Restriction

```text
Base:
OCR = enabled

Override:
restrict

Reason:
Jurisdictional regulation
```

---

### Scenario 4 — Enterprise Pilot

```text
Base:
Premium Analytics = disabled

Override:
beta_enable

Tenant:
Enterprise customer

Expiration:
90 days
```

---

# 6. Multi-Tenant / Ownership / Isolation Notes

Each override belongs to one tenant and references one tenant feature.

Therefore:

```text
Tenant A
│
├── Feature A
│    └── Override
│
└── Feature B
```

is completely isolated from:

```text
Tenant B
│
├── Feature A
│
└── Feature C
     └── Override
```

---

## Tenant Isolation Rule

Every override operation must be tenant-scoped.

Correct:

```sql
SELECT *
FROM tenant_feature_overrides
WHERE tenant_id = :tenant_id
AND feature_id = :feature_id
AND is_active = TRUE;
```

A dangerous implementation would be:

```sql
SELECT *
FROM tenant_feature_overrides
WHERE feature_id = :feature_id;
```

without verifying tenant ownership.

---

## Cross-Tenant Reference Protection

The database should ensure that:

```text
override.tenant_id
```

and:

```text
override.feature_id → tenant_features.tenant_id
```

belong to the **same tenant**.

This is an important production-grade integrity rule.

A simple pair of foreign keys does not automatically guarantee this.

### Recommended Integrity Design

A stronger implementation can introduce a composite candidate key on `tenant_features`:

```text
UNIQUE(id, tenant_id)
```

and then reference:

```text
(feature_id, tenant_id)
        ↓
tenant_features(id, tenant_id)
```

This ensures the feature and override belong to the same tenant.

This is a **production-grade inference**, not explicitly stated in the source, but it follows directly from the source's multi-tenant ownership requirement.

---

# 7. Lifecycle

The source defines the lifecycle as:

```text
Creation:
Override Created

Growth:
Override Active

Modification:
Override Updated

Archival:
Override Expired or Archived
```

---

## Creation

Example:

```text
Enterprise tenant requests AI trial
        ↓
Licensing / Administration approval
        ↓
Create tenant_feature_override
        ↓
is_active = TRUE
```

---

## Activation

If:

```text
starts_at > NOW()
```

the override may be scheduled but not yet effective.

Conceptually:

```text
Created
   ↓
Scheduled
   ↓
starts_at reached
   ↓
Active
```

---

## Active Period

During the active period:

```text
is_active = TRUE
```

and:

```text
NOW() >= starts_at
```

and, where applicable:

```text
NOW() < expires_at
```

the override participates in effective feature resolution.

---

## Modification

An override can be changed before or during its active period.

Examples:

```text
reason changed
expires_at extended
override_action changed
```

Sensitive changes should be audited.

---

## Expiration

When:

```text
NOW() >= expires_at
```

the override becomes ineffective.

The source explicitly identifies expiration as an archival lifecycle state.

---

## Why Expired Records Should Be Retained

Historical overrides may be required to answer:

```text
Why did this tenant have access to AI last month?
```

or:

```text
Why was OCR disabled for this customer?
```

Therefore:

```text
expired
```

should generally mean:

```text
no longer operationally effective
```

rather than:

```text
physically deleted
```

---

# 8. Proposed Schema

## Table Name

`tenant_feature_overrides`

## Primary Key Strategy

**UUID**

The source explicitly defines UUID as the primary key.

```text
id UUID PRIMARY KEY
```

---

## Full Schema Definition

| Field Name | Data Type | Key | Specification | Reason Field Exists |
|---|---|---|---|---|
| `id` | UUID | PK | `NOT NULL` | Stable unique identity of the override |
| `tenant_id` | UUID | FK → `tenants.id` | `NOT NULL` | Establishes tenant ownership and isolation |
| `feature_id` | UUID | FK → `tenant_features.id` | `NOT NULL` | Identifies the base feature entitlement being overridden |
| `override_action` | ENUM | — | `NOT NULL` | Defines what exceptional behavior should be applied |
| `reason` | TEXT | — | `NULL` | Records business/operational justification for the exception |
| `starts_at` | TIMESTAMPTZ | — | `NULL` | Supports scheduled activation |
| `expires_at` | TIMESTAMPTZ | — | `NULL` | Supports automatic expiration |
| `is_active` | BOOLEAN | — | `NOT NULL DEFAULT TRUE` | Indicates whether the override is currently active |
| `created_by` | UUID | Future FK | `NULL` | Identifies the actor/system that created the override |
| `created_at` | TIMESTAMPTZ | — | `NOT NULL` | Records override creation |
| `updated_at` | TIMESTAMPTZ | — | `NOT NULL` | Records the latest override modification |

The source marks `created_by` as a **future FK**, so it should not be silently promoted to a confirmed relationship to a specific identity table at this stage.

---

## `id`

The UUID identifies the individual override.

For example:

```text
override A
    id = UUID-1

override B
    id = UUID-2
```

This is preferable to using:

```text
tenant_id + feature_id
```

as the primary key because the same feature may have multiple historical override records over its lifetime.

For example:

```text
2026:
AI Trial

2027:
Emergency Disablement

2028:
Enterprise Pilot
```

These are separate override events.

---

## `tenant_id`

This establishes ownership.

```text
tenant_feature_overrides.tenant_id
        ↓
tenants.id
```

It also allows:

```sql
WHERE tenant_id = :tenant_id
```

to efficiently isolate overrides.

---

## `feature_id`

This identifies the **specific base tenant feature assignment** being overridden.

The source explicitly states that this preserves referential integrity and simplifies rollback.

This is preferable to only storing:

```text
feature_code
```

because the override should point to the actual tenant-specific feature entitlement.

---

## `override_action`

This defines the actual exceptional behavior.

For example:

```text
enable
disable
beta_enable
restrict
expire
```

The exact enum values are documented in Section 9.

---

## `reason`

The reason is intentionally `TEXT`.

This is important because an override often has a business justification rather than a short technical description.

Examples:

```text
"Enterprise customer approved for 30-day AI pilot"

"Temporary regulatory restriction in jurisdiction X"

"Fraud model rollback following production incident INC-1042"
```

A reason also improves auditability.

---

## `starts_at`

Allows an override to be scheduled.

Example:

```text
created_at = 2026-08-10
starts_at  = 2026-08-15
```

The override exists but does not become effective until its start time.

---

## `expires_at`

Defines the end of the exception.

Example:

```text
starts_at  = 2026-08-15
expires_at = 2026-09-15
```

This is especially useful for:

- trials,
- beta programs,
- temporary restrictions,
- contractual exceptions.

---

## `is_active`

The source defines:

```text
BOOLEAN
DEFAULT TRUE
```

It provides an explicit operational state.

However, production logic should not rely on this field alone.

Effective activity should generally consider:

```text
is_active
+
starts_at
+
expires_at
```

For example:

```text
is_active = TRUE
starts_at = tomorrow
```

does not mean the override should be active today.

---

## `created_by`

The source defines this as:

```text
UUID
Future FK
```

It should identify the user or service responsible for creating the override.

Potential future relationship:

```text
created_by
    ↓
users.id
```

or potentially a broader actor/service identity model.

Because the source explicitly marks it as a future FK, the exact target should be decided when the Identity module is finalized.

---

## `created_at`

Records when the override was created.

---

## `updated_at`

Records the latest modification.

This is necessary for:

- audit,
- concurrency control,
- operational troubleshooting,
- cache invalidation.

---

# 9. Enum Definitions

## `override_action`

The source defines five values:

| Value | Description |
|---|---|
| `enable` | Explicitly enable a normally disabled feature |
| `disable` | Explicitly disable a normally enabled feature |
| `beta_enable` | Enable a feature as part of a beta/trial/pilot |
| `restrict` | Restrict feature behavior or availability |
| `expire` | Mark the override as expired |

---

## `enable`

Used for straightforward exceptional enablement.

Example:

```text
Base:
    disabled

Override:
    enable

Effective:
    enabled
```

---

## `disable`

Used for exceptional disabling.

Example:

```text
Base:
    enabled

Override:
    disable

Effective:
    disabled
```

This is particularly useful for emergency rollback or regulatory controls.

---

## `beta_enable`

Semantically different from ordinary enablement.

It indicates:

```text
feature access is being granted as part of
a controlled beta/trial/pilot
```

This distinction can matter for:

- reporting,
- billing,
- support,
- product analytics,
- audit.

---

## `restrict`

This is intentionally different from `disable`.

A restriction may mean:

```text
Feature available
BUT
specific functionality restricted
```

rather than:

```text
feature completely unavailable
```

The exact runtime semantics of `restrict` must be defined by the consuming feature service.

---

## `expire`

Represents an expiration state.

However, because the table already has:

```text
expires_at
```

the exact use of `expire` should be standardized during implementation.

A robust design would normally let the temporal lifecycle determine expiration rather than requiring application code to manually create an `expire` override.

That is an implementation consideration; the source nevertheless explicitly includes `expire` in the enum.

---

# 10. Why `feature_id` Exists

`feature_id` is the key relational field of this table.

The source explicitly says:

> It links every override to an existing feature assignment, preserving referential integrity and simplifying rollback.

Without it, the override could instead contain:

```text
tenant_id
feature_code
```

but this would create unnecessary duplication and weaken the relationship.

The chosen design is:

```text
tenant_feature_overrides.feature_id
            ↓
tenant_features.id
```

---

## Why This Helps Rollback

Suppose:

```text
Feature:
AI Fraud Detection

Base:
disabled
```

Override:

```text
beta_enable
```

After the override expires, the system can resolve:

```text
Base entitlement
    ↓
Override expired
    ↓
Return to base state
```

The base record was never modified.

This is much safer than attempting to reconstruct the previous value after changing `tenant_features`.

---

## Why `feature_code` Is Not Enough

`feature_code` identifies a capability conceptually.

`feature_id` identifies the **tenant's actual entitlement record**.

That distinction is valuable because:

```text
feature_code
    =
global business capability identifier

feature_id
    =
specific tenant feature assignment
```

---

# 11. Candidate Keys

| Key Type | Field(s) | Rationale |
|---|---|---|
| Primary Key | `id` | Unique identity of each override |
| Candidate / Business Key | `(tenant_id, feature_id, is_active)` | Represents the active override relationship |

---

## Important Production Consideration

The source describes:

```text
(tenant_id, feature_id, is_active)
```

as a candidate key and separately states:

> One active override per feature (business rule).

In a production PostgreSQL implementation, the cleanest enforcement would normally be a **partial unique index**:

```sql
CREATE UNIQUE INDEX uq_active_tenant_feature_override
ON tenant_feature_overrides (tenant_id, feature_id)
WHERE is_active = TRUE;
```

This is preferable to:

```text
UNIQUE(tenant_id, feature_id, is_active)
```

because the latter permits only one inactive record as well.

Historical inactive overrides should be allowed.

Therefore:

```text
Tenant A + Feature X + inactive
Tenant A + Feature X + inactive
Tenant A + Feature X + inactive
```

should be valid.

But:

```text
Tenant A + Feature X + active
Tenant A + Feature X + active
```

should not be valid.

This is a **production-grade implementation inference** derived from the source's stated business rule.

---

# 12. Constraints

The source explicitly defines:

```text
PK(id)
FK(tenant_id)
FK(feature_id)
One active override per feature
```

The expanded production constraint model is:

| Constraint | Definition | Reason |
|---|---|---|
| Primary Key | `PK(id)` | Unique override identity |
| Tenant FK | `tenant_id → tenants.id` | Tenant ownership |
| Feature FK | `feature_id → tenant_features.id` | Override must target an existing feature |
| Active Uniqueness | One active override per `(tenant_id, feature_id)` | Prevents conflicting simultaneous overrides |
| Required Action | `override_action NOT NULL` | Every override must define behavior |
| Active Default | `is_active DEFAULT TRUE` | New overrides are active by source design |
| Timestamp Integrity | `created_at`, `updated_at NOT NULL` | Lifecycle tracking |
| Temporal Integrity | `expires_at >= starts_at` where both exist | Prevents invalid time windows |
| Tenant Consistency | `feature_id` must belong to `tenant_id` | Prevents cross-tenant references |

---

## Referential Integrity

The database must prevent:

```text
tenant_feature_overrides.feature_id
```

from referencing a nonexistent tenant feature.

---

## Cross-Tenant Integrity

The application and database should prevent:

```text
Override Tenant A
        +
Tenant B Feature
```

from being stored.

---

# 13. Relationships

## Incoming References / Logical Consumers

The source identifies:

- Feature Flag Service.
- Licensing Engine.
- Audit Service.

Additional logical consumers can include:

- Subscription Service.
- Billing.
- Monitoring.
- Provisioning.
- Administrative UI.
- Runtime authorization/entitlement service.

These are service relationships rather than relational foreign keys.

---

## Outgoing References

The source explicitly defines:

```text
tenant_id → tenants.id
feature_id → tenant_features.id
```

Therefore:

```text
tenant_feature_overrides
        │
        ├──────────────→ tenants
        │
        └──────────────→ tenant_features
```

---

## Full Relationship

```text
┌──────────────┐
│    Tenant    │
└──────┬───────┘
       │
       │ 1:N
       ▼
┌────────────────────┐
│ tenant_features    │
└──────────┬─────────┘
           │
           │ 1:N historical
           ▼
┌─────────────────────────────┐
│ tenant_feature_overrides   │
└─────────────────────────────┘
```

Operationally, however:

```text
Active overrides per feature
        =
0 or 1
```

while historical overrides can be many.

---

# 14. Cardinality Analysis

The source defines:

```text
Overrides per tenant: 0–100
Active overrides per feature: Typically 0–1
```

Therefore:

| Relationship | Expected Cardinality |
|---|---:|
| Tenant → Overrides | 0–100 typical |
| Feature → Overrides | 0–N historically |
| Feature → Active Overrides | 0–1 |
| Override → Tenant | Exactly 1 |
| Override → Feature | Exactly 1 |
| Override → Audit Events | 1–N |

---

## Why Historical Cardinality Is Greater Than Active Cardinality

A feature may experience multiple exceptions over time:

```text
Feature X

2026-01
    Beta Enable

2026-03
    Expired

2026-05
    Regulatory Disable

2026-06
    Removed

2026-08
    Enterprise Trial
```

Therefore:

```text
Historical Overrides = N
```

but:

```text
Active Overrides = 0 or 1
```

This distinction should be preserved.

---

## Platform Scale Example

Assume:

```text
100,000 tenants
```

and an average:

```text
20 overrides per tenant
```

Then:

```text
2,000,000 override records
```

Even if historical records accumulate, this remains manageable in a relational system provided that:

- indexes are appropriate,
- archival policies exist,
- active queries are selective.

---

# 15. Query Patterns

The source defines two primary queries.

## Retrieve Active Overrides for Tenant

```sql
SELECT *
FROM tenant_feature_overrides
WHERE tenant_id = :tenant_id
AND is_active = TRUE;
```

This is useful for:

- tenant administration,
- runtime entitlement resolution,
- support,
- auditing.

---

## Retrieve Active Override for Specific Feature

```sql
SELECT *
FROM tenant_feature_overrides
WHERE tenant_id = :tenant_id
AND feature_id = :feature_id
AND is_active = TRUE;
```

This is the primary feature-specific override lookup.

---

## Retrieve Effective Override by Time

For production temporal evaluation:

```sql
SELECT *
FROM tenant_feature_overrides
WHERE tenant_id = :tenant_id
AND feature_id = :feature_id
AND is_active = TRUE
AND (starts_at IS NULL OR starts_at <= NOW())
AND (expires_at IS NULL OR expires_at > NOW());
```

This is an implementation-level query derived from the source's temporal fields.

---

## Retrieve Expired Overrides

```sql
SELECT *
FROM tenant_feature_overrides
WHERE tenant_id = :tenant_id
AND expires_at IS NOT NULL
AND expires_at <= NOW();
```

Useful for cleanup/archival workflows.

---

## Retrieve Override History

```sql
SELECT *
FROM tenant_feature_overrides
WHERE tenant_id = :tenant_id
AND feature_id = :feature_id
ORDER BY created_at DESC;
```

Useful for support and audit investigation.

---

## Find Overrides Expiring Soon

```sql
SELECT *
FROM tenant_feature_overrides
WHERE is_active = TRUE
AND expires_at IS NOT NULL
AND expires_at <= NOW() + INTERVAL '7 days';
```

Useful for:

- trial expiration notifications,
- customer success,
- licensing operations.

---

# 16. Index Strategy

The source recommends:

- `PK(id)`
- `INDEX(tenant_id)`
- `INDEX(feature_id)`
- `INDEX(is_active)`
- `INDEX(expires_at)`

---

## Primary Key

```sql
PRIMARY KEY (id)
```

Provides direct lookup.

---

## Tenant Index

```sql
INDEX(tenant_id)
```

Supports:

```sql
WHERE tenant_id = ?
```

This is important for tenant-scoped administrative queries.

---

## Feature Index

```sql
INDEX(feature_id)
```

Supports feature-specific override lookup.

---

## Active State Index

The source explicitly recommends:

```text
INDEX(is_active)
```

However, because `is_active` is a low-cardinality boolean, a standalone index may not be optimal at large scale.

A stronger production design is:

```sql
CREATE INDEX idx_active_tenant_overrides
ON tenant_feature_overrides (tenant_id, feature_id)
WHERE is_active = TRUE;
```

This simultaneously supports:

```text
tenant_id
feature_id
active state
```

and aligns directly with the business rule:

```text
maximum one active override per feature
```

---

## Expiration Index

```sql
INDEX(expires_at)
```

supports scheduled expiration processing.

A worker can efficiently identify:

```text
overrides expiring soon
```

or:

```text
overrides already expired
```

---

## Recommended Composite Index

For the common runtime lookup:

```sql
WHERE tenant_id = ?
AND feature_id = ?
AND is_active = TRUE
```

a partial composite index is especially useful:

```sql
CREATE INDEX idx_active_feature_override_lookup
ON tenant_feature_overrides (tenant_id, feature_id)
WHERE is_active = TRUE;
```

Again, this is an implementation optimization beyond the source's basic index list.

---

# 17. Read / Write Characteristics

The source explicitly classifies the table as:

```text
Reads: Moderate
Writes: Low
```

---

## Read Workload

Typical reads include:

```text
Runtime feature evaluation
Tenant administration
Feature-specific lookup
Support investigations
Expiration processing
Audit queries
```

The table is not expected to receive the extremely high runtime read volume of `tenant_features`, because many systems can first retrieve the tenant's base feature state and only consult overrides where required.

---

## Write Workload

Writes are comparatively low.

Typical writes:

```text
Create trial
Create beta override
Create emergency disablement
Create regulatory restriction
Update expiration
Deactivate override
Archive override
```

---

## Update Characteristics

Updates are relatively uncommon.

The most likely fields to change are:

```text
reason
starts_at
expires_at
is_active
override_action
updated_at
```

---

## Delete Characteristics

Physical deletion should generally be avoided.

Instead:

```text
is_active = FALSE
```

or:

```text
expires_at = timestamp
```

preserves history.

This is particularly important for:

- regulatory investigations,
- enterprise support,
- billing reconciliation,
- incident analysis.

---

# 18. Caching Strategy

The source recommends Redis using:

```text
tenant-feature-overrides:{tenant_id}
```

This is appropriate because overrides are tenant-scoped and relatively small in number.

---

## Recommended Cache Structure

Example:

```text
tenant-feature-overrides:tenant-123
```

Value conceptually:

```json
{
  "ai_fraud_detection": {
    "action": "beta_enable",
    "starts_at": "2026-08-15T00:00:00Z",
    "expires_at": "2026-09-15T00:00:00Z"
  },
  "ocr_processing": {
    "action": "restrict",
    "starts_at": "2026-08-01T00:00:00Z",
    "expires_at": null
  }
}
```

---

## Runtime Resolution

The combined feature system can operate as:

```text
Request
   ↓
Tenant Context
   ↓
Base Features Cache
   ↓
Override Cache
   ↓
Effective Feature Resolver
   ↓
Feature Decision
```

---

## Alternative: Precompute Effective State

For high-performance systems, an alternative is:

```text
tenant_features
       +
tenant_feature_overrides
       ↓
Effective Feature State
       ↓
Redis
```

Then runtime requests only need:

```text
tenant-features:{tenant_id}
```

This can eliminate repeated override resolution.

However, it makes invalidation more important.

---

## Cache Invalidation

Override cache should be invalidated when:

```text
Override Created
Override Updated
Override Activated
Override Expired
Override Removed
```

The source's audit events provide the natural triggers for this.

---

## Expiration Handling

Because overrides have:

```text
starts_at
expires_at
```

the cache strategy must account for time.

A cache entry should not remain active after:

```text
expires_at
```

even if:

```text
is_active = TRUE
```

Therefore TTL-based invalidation or scheduled expiration processing should be considered.

---

# 19. Security Considerations

The source explicitly requires:

- Tenant-scoped administration.
- RBAC.
- Approval workflow for sensitive overrides.
- Complete audit logging.

These are appropriate because an override can bypass normal feature entitlement.

---

## Tenant-Scoped Administration

A tenant administrator must not be able to create:

```text
override → another tenant's feature
```

Tenant ownership must be verified at both:

```text
application layer
```

and:

```text
database integrity layer
```

where practical.

---

## RBAC

Not every administrator should be allowed to create overrides.

For example:

```text
Platform Licensing Administrator
        ↓
Can create commercial overrides

Tenant Administrator
        ↓
Can request permitted overrides

Ordinary User
        ↓
Cannot create overrides
```

---

## Approval Workflow

Sensitive overrides may require:

```text
Request
   ↓
Approval
   ↓
Override Created
```

Especially:

- premium feature activation,
- regulatory restrictions,
- security-related disablement,
- emergency production changes.

The source explicitly calls for approval workflow for sensitive overrides.

---

## Prevent Self-Elevation

A tenant should never be able to send:

```json
{
  "override_action": "enable",
  "feature_id": "premium-ai"
}
```

and immediately gain the capability merely because the API accepts the request.

The backend must verify:

```text
Actor
+
Tenant
+
Feature
+
Commercial entitlement
+
Permission
+
Approval requirement
```

before creating the override.

---

## Auditability

Every override creation and modification should identify:

```text
who
what
when
why
which tenant
which feature
previous state
new state
```

This is particularly important because overrides can alter normal licensing behavior.

---

# 20. Audit Requirements

The source defines five events:

| Event | Trigger | Purpose |
|---|---|---|
| `TenantFeatureOverrideCreated` | New override created | Record creation |
| `TenantFeatureOverrideUpdated` | Override changed | Track modification |
| `TenantFeatureOverrideActivated` | Override becomes active | Record activation |
| `TenantFeatureOverrideExpired` | Override reaches expiration | Record expiration |
| `TenantFeatureOverrideRemoved` | Override removed/deactivated | Record removal |

---

## `TenantFeatureOverrideCreated`

Example:

```json
{
  "event": "TenantFeatureOverrideCreated",
  "tenant_id": "tenant-uuid",
  "feature_id": "feature-uuid",
  "override_action": "beta_enable",
  "created_by": "actor-uuid"
}
```

---

## `TenantFeatureOverrideUpdated`

Triggered when:

```text
expires_at
reason
override_action
starts_at
```

or other mutable fields change.

---

## `TenantFeatureOverrideActivated`

Triggered when a scheduled override becomes effective.

For example:

```text
starts_at reached
        ↓
OverrideActivated
```

---

## `TenantFeatureOverrideExpired`

Triggered when:

```text
expires_at reached
```

This is useful for:

- cache invalidation,
- licensing reconciliation,
- notifications,
- audit.

---

## `TenantFeatureOverrideRemoved`

Triggered when the override is deliberately deactivated or removed from active operation.

---

## Recommended Audit Payload

A production audit event should ideally include:

```text
event_id
tenant_id
feature_id
override_id
actor_id
override_action
previous_state
new_state
reason
occurred_at
correlation_id
source_service
```

The exact event payload is not defined in the source; this is a production-grade recommendation.

---

# 21. Event Producers / Event Consumers

The source identifies:

## Producers

```text
TenantFeatureOverrideCreated
TenantFeatureOverrideUpdated
TenantFeatureOverrideExpired
```

Operationally, activation/removal events are also generated as defined in Section 20.

Typical producers include:

```text
Licensing Engine
Feature Management Service
Administrative Service
Scheduled Expiration Worker
```

---

## Consumers

The source identifies:

- Feature Flag Service.
- Licensing Engine.
- Billing.
- Monitoring.
- Audit.

---

## Business Workflow

Example trial:

```text
Enterprise Customer
        ↓
Trial Approved
        ↓
Licensing Engine
        ↓
Create Override
        ↓
TenantFeatureOverrideCreated
        ↓
Event Bus
   ┌────┼─────────┐
   ▼    ▼         ▼
Feature Billing  Audit
Flag
Service
```

---

## Expiration Workflow

```text
Scheduled Worker
       ↓
expires_at reached
       ↓
Override Expired
       ↓
TenantFeatureOverrideExpired
       ↓
┌──────┼───────────┐
▼      ▼           ▼
Cache  Licensing   Audit
      Reconciliation
```

---

# 22. Alternative Designs Considered

The source explicitly considers three designs:

| Option | Description | Verdict |
|---|---|---|
| A | Modify `tenant_features` directly | **Rejected** |
| B | JSON overrides | **Rejected** |
| **C** | Dedicated table | **Chosen** |

---

## Option A — Modify `tenant_features` Directly

Example:

```text
tenant_features
is_enabled = TRUE
```

during a trial.

### Rejected because

It destroys the distinction between:

```text
base entitlement
```

and:

```text
temporary exception
```

It also complicates rollback.

---

## Option B — JSON Overrides

Example:

```json
{
  "ai_fraud_detection": {
    "action": "beta_enable",
    "expires_at": "2026-09-15"
  }
}
```

### Rejected because

A JSON structure makes:

- relational integrity,
- tenant ownership,
- active uniqueness,
- querying,
- auditing,
- temporal processing

more difficult.

---

## Option C — Dedicated Table

**Chosen.**

A dedicated table provides:

- referential integrity,
- tenant isolation,
- temporal lifecycle,
- auditability,
- queryability,
- active override enforcement,
- independent historical records.

---

## Additional Production Design Consideration

The dedicated table also creates a clean separation:

```text
Commercial entitlement
        ↓
tenant_features

Exception management
        ↓
tenant_feature_overrides

Effective runtime state
        ↓
Feature Flag / Entitlement Service
```

This is a strong architecture for a production SaaS system.

---

# 23. Final Design Assessment

| Attribute | Rating |
|---|---|
| Complexity | **Medium** |
| Read Volume | **Moderate** |
| Write Volume | **Low** |
| Security Importance | **High** |
| Business Criticality | **High** |
| Scalability | **Excellent** |
| Data Volatility | Medium |
| Runtime Importance | **High** |
| Recommended Status | **Core Supporting Table** |

The source's original assessment is **Medium complexity, Moderate read volume, Low write volume, High security importance, High business criticality, Excellent scalability, and Core Supporting Table**.

---

## Overall Assessment

`tenant_feature_overrides` is a relatively small table physically, but it has an important architectural role.

It prevents exceptional entitlement scenarios from contaminating the tenant's normal feature state.

The fundamental model is:

```text
                    Tenant
                       │
                       ▼
               tenant_features
                       │
                Base Entitlement
                       │
                       ▼
          tenant_feature_overrides
                       │
                Exceptional Rule
                       │
                       ▼
             Effective Feature State
                       │
                       ▼
              Feature Flag Service
                       │
             ┌─────────┼─────────┐
             ▼         ▼         ▼
            API        UI      Services
```

The key production invariants are:

1. **Every override belongs to exactly one tenant.**
2. **Every override targets an existing `tenant_features` record.**
3. **`tenant_features` remains the base entitlement.**
4. **An override represents an exception, not a replacement entitlement.**
5. **Only one active override should exist for a feature at a time.**
6. **Historical inactive/expired overrides should be retained.**
7. **`starts_at` and `expires_at` control temporal applicability.**
8. **`is_active` represents operational state but should not be interpreted without temporal fields.**
9. **Tenant ownership must be validated when resolving overrides.**
10. **Cross-tenant feature references should be prevented at the database level where practical.**
11. **Sensitive overrides should require RBAC and, where appropriate, approval.**
12. **Override creation, activation, modification, expiration, and removal should be auditable.**
13. **Override changes must invalidate relevant caches.**
14. **The runtime feature resolver should combine base entitlement and applicable override into an effective state.**
15. **The table should not become a substitute for IAM authorization.**
16. **The table should not become a substitute for subscription/billing logic.**
17. **The database should remain the authoritative historical record even when Redis is used for runtime resolution.**

### Final Conceptual Model

```text
┌───────────────────────┐
│       Tenant          │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│   tenant_features     │
│                       │
│ Base Entitlement      │
│                       │
│ AI = disabled         │
│ OCR = enabled         │
└───────────┬───────────┘
            │
            │ 0..N historical
            ▼
┌──────────────────────────────┐
│ tenant_feature_overrides     │
│                              │
│ beta_enable                  │
│ disable                      │
│ restrict                     │
│ enable                       │
│ expire                       │
│                              │
│ starts_at                    │
│ expires_at                   │
│ is_active                    │
│ reason                       │
└──────────────┬───────────────┘
               │
               ▼
       Effective Entitlement
               │
               ▼
       Feature Flag Service
               │
       ┌───────┼────────┐
       ▼       ▼        ▼
      API      UI     Services
```

The most important architectural decision is therefore:

> **Never confuse the base entitlement with the exception applied to that entitlement.**

`tenant_features` answers:

```text
"What does this tenant normally have?"
```

while `tenant_feature_overrides` answers:

```text
"What exceptional rule currently modifies that entitlement?"
```

Together they provide the entitlement model required for trials, beta programs, regulatory restrictions, emergency controls, and enterprise-specific exceptions while preserving the original tenant feature state and its audit history.

**Step 3 — `tenant_feature_overrides` is complete.**

The next step is **Step 4 — package this exact content into `Module_01_Table_10_tenant_feature_overrides.md`**.
