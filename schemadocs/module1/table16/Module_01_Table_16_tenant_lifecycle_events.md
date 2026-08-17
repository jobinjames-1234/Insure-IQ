# Step 3 — Table 16: `tenant_lifecycle_events`

The Module 1 inventory establishes **Table 16** as `tenant_lifecycle_events`, with the purpose **“Tenant lifecycle event history.”**

This table must be distinguished carefully from **Table 15 — `tenant_status_history`**.

The source explicitly establishes both tables as separate entities:

```text
15  tenant_status_history
    Historical tenant status changes

16  tenant_lifecycle_events
    Tenant lifecycle event history
```

That distinction is important enough that I will **not collapse the two tables**.

Also, the available source material gives us the Table 16 name and purpose and confirms that `tenant_lifecycle_events` references the tenant root, but it does **not provide a complete original field-by-field Table 16 specification**. The detailed schema below therefore distinguishes the **architecturally proposed design** from source-established facts instead of pretending unsupported fields were already specified.

This is intentional **content-degradation control**.

---

# 1. Why This Table Exists

The `tenant_lifecycle_events` table records significant events that occur during the operational lifecycle of a tenant.

The Tenant Management module already separates:

```text
tenants
    ↓
current tenant state
```

from:

```text
tenant_status_history
    ↓
status transitions
```

`tenant_lifecycle_events` provides a third, broader layer:

```text
tenant_lifecycle_events
    ↓
significant lifecycle events
```

The conceptual model is:

```text
Tenant
│
├── Current State
│      └── tenants.status
│
├── Status History
│      └── tenant_status_history
│
└── Lifecycle Events
       └── tenant_lifecycle_events
```

This distinction is necessary because **not every lifecycle event is necessarily a status transition**.

For example:

```text
Tenant Created
Tenant Provisioning Started
Tenant Provisioning Completed
Tenant Onboarding Started
Tenant Onboarding Completed
Tenant Activated
Tenant Domain Verified
Tenant Subscription Assigned
Tenant Suspended
Tenant Reactivated
Tenant Archived
Tenant Data Region Migrated
Tenant Backup Initialized
Tenant Deprovisioning Started
Tenant Deprovisioning Completed
```

Some of these may change status.

Others are operational milestones that provide lifecycle context without necessarily changing the tenant's current status.

---

## Why Table 15 Alone Is Not Enough

Consider:

```text
tenant_status_history
```

It may tell us:

```text
pending → active
```

But it does not inherently tell us:

```text
Provisioning Started
Provisioning Completed
Default Configuration Applied
Primary Domain Verified
Initial Administrator Created
Initial Subscription Assigned
```

Those are lifecycle events rather than merely status transitions.

Therefore:

```text
tenant_status_history
        ↓
"What status changed?"

tenant_lifecycle_events
        ↓
"What important lifecycle event occurred?"
```

---

# 2. Business Definition

A **Tenant Lifecycle Event** represents a significant operational or business event occurring during the creation, onboarding, activation, operation, suspension, migration, or retirement of a tenant.

The event belongs to one tenant.

Examples:

| Event | Meaning |
|---|---|
| `TenantCreated` | Tenant record was created |
| `TenantProvisioningStarted` | Infrastructure provisioning began |
| `TenantProvisioningCompleted` | Initial tenant provisioning completed |
| `TenantOnboardingStarted` | Tenant onboarding workflow began |
| `TenantOnboardingCompleted` | Required onboarding steps completed |
| `TenantActivated` | Tenant became operational |
| `TenantSuspended` | Tenant was suspended |
| `TenantReactivated` | Tenant returned to operational state |
| `TenantArchived` | Tenant was archived |
| `TenantDeprovisioningStarted` | Tenant retirement process began |
| `TenantDeprovisioningCompleted` | Tenant retirement process completed |

The exact event vocabulary should ultimately be governed by the tenant lifecycle/application event contract.

---

## Example Lifecycle

```text
Tenant Created
      ↓
Provisioning Started
      ↓
Provisioning Completed
      ↓
Onboarding Started
      ↓
Administrator Configured
      ↓
Onboarding Completed
      ↓
Tenant Activated
      ↓
Tenant Suspended
      ↓
Tenant Reactivated
      ↓
Tenant Archived
```

The lifecycle-event table preserves that broader timeline.

---

# 3. Critical Design Principle — What the Entity IS and IS NOT

## The Tenant Lifecycle Event IS

- A historical lifecycle event.
- An immutable operational record.
- Tenant-scoped event history.
- A source for lifecycle reconstruction.
- A provisioning and onboarding trace.
- A troubleshooting aid.
- An operational analytics source.
- A downstream event/audit integration point.

---

## The Tenant Lifecycle Event IS NOT

- The tenant itself.
- The tenant's current status.
- A replacement for `tenant_status_history`.
- A subscription.
- A billing transaction.
- A general-purpose application log.
- A replacement for infrastructure logs.
- A user authentication event.

The distinction should remain:

```text
tenants
    ↓
Current tenant state
```

```text
tenant_status_history
    ↓
Historical status transitions
```

```text
tenant_lifecycle_events
    ↓
Historical lifecycle milestones/events
```

---

# 4. Aggregate Root Analysis — DDD Structure

The Tenant remains the aggregate root.

```text
Tenant
│
├── Current Status
│      └── tenants.status
│
├── Status History
│      └── tenant_status_history
│
├── Lifecycle Events
│      └── tenant_lifecycle_events
│
├── Provisioning
│      └── tenant_provisioning_logs
│
├── Configuration
│      ├── tenant_settings
│      ├── tenant_branding
│      ├── tenant_locales
│      └── ...
│
└── Commercial Entitlements
       ├── tenant_subscription_plans
       ├── tenant_usage_limits
       └── tenant_modules
```

This demonstrates why lifecycle events should not become the aggregate root themselves.

---

## DDD Relationship

```text
Tenant Aggregate Root
        │
        ├───────────────┐
        │               │
        ▼               ▼
Status History     Lifecycle Events
        │               │
        │               │
        ▼               ▼
State transitions   Lifecycle milestones
```

The lifecycle-event record has no independent business existence outside the tenant lifecycle.

---

# 5. Business Capabilities Supported

| Capability | Supported |
|---|---|
| Tenant lifecycle reconstruction | Yes |
| Provisioning traceability | Yes |
| Onboarding tracking | Yes |
| Activation tracking | Yes |
| Deactivation/retirement tracking | Yes |
| Operational troubleshooting | Yes |
| Lifecycle analytics | Yes |
| Compliance support | Yes |
| Current tenant status | No — `tenants` |
| Status-transition history | Primarily `tenant_status_history` |
| Infrastructure-level logging | No — provisioning/infrastructure logs |
| Authentication auditing | No — Identity domain |

---

## Lifecycle Reconstruction

A support engineer can reconstruct:

```text
Created
   ↓
Provisioned
   ↓
Onboarded
   ↓
Activated
   ↓
Suspended
   ↓
Reactivated
```

rather than seeing only the final:

```text
status = active
```

---

## Provisioning Troubleshooting

Suppose a tenant remains stuck during onboarding.

The lifecycle events may show:

```text
TenantCreated
       ↓
TenantProvisioningStarted
       ↓
TenantProvisioningCompleted
       ↓
TenantOnboardingStarted
       ↓
[No further lifecycle event]
```

This immediately identifies the lifecycle stage where investigation should begin.

---

# 6. Multi-Tenant / Ownership / Isolation Notes

Every lifecycle event belongs to exactly one tenant.

```text
tenant_lifecycle_events.tenant_id
          ↓
       tenants.id
```

The source inventory confirms `tenant_lifecycle_events` as one of the tenant-owned tables referencing the tenant root.

---

## Tenant Isolation

Normal queries must be tenant-scoped:

```sql
SELECT *
FROM tenant_lifecycle_events
WHERE tenant_id = :tenant_id
ORDER BY occurred_at;
```

A tenant must never be able to inspect another tenant's lifecycle history.

---

## Platform-Level Operations

Cross-tenant access can be appropriate for:

- Platform operations.
- Provisioning operations.
- Compliance.
- Security.
- Support.
- Platform analytics.

Such access must be explicitly authorized.

---

## Why `tenant_id` Is Fundamental

The tenant is the ownership boundary.

Therefore the lifecycle event should not rely on indirect ownership through:

```text
subscription
user
domain
integration
```

The relationship should remain explicit:

```text
event
  ↓
tenant_id
  ↓
tenants.id
```

---

# 7. Lifecycle

The lifecycle of the **event record itself** is fundamentally append-only.

```text
Creation:
Lifecycle Event Recorded

Growth:
New Event Added

Modification:
Never Updated

Archival:
Retained According to Lifecycle/Audit Retention Policy
```

---

## Creation

When a significant lifecycle event occurs:

```text
Tenant Created
       ↓
Lifecycle Event Created
```

Example:

```text
event_code = tenant_created
```

---

## Growth

As the tenant moves through its lifecycle:

```text
Event 1
TenantCreated

Event 2
TenantProvisioningStarted

Event 3
TenantProvisioningCompleted

Event 4
TenantActivated

Event 5
TenantSuspended
```

New rows are appended.

---

## Modification

Lifecycle events should not be rewritten after creation.

```text
UPDATE
   ↓
Avoid
```

The historical meaning of an event must remain stable.

If a correction is required, a corrective event or separate audit mechanism should be used.

---

## Archival

The source does not explicitly define a retention period for Table 16.

Therefore **permanent retention should not be silently assumed**.

A production retention policy should be determined according to:

- Compliance requirements.
- Operational requirements.
- Tenant contract requirements.
- Security requirements.
- Storage economics.

This is an important distinction from `tenant_status_history`, where the source explicitly described historical retention.

---

# 8. Proposed Schema

## Table Name

`tenant_lifecycle_events`

## Primary Key Strategy

**UUID**

A UUID provides a stable technical identity for each lifecycle event and allows event identifiers to be referenced by downstream systems.

---

## Full Field-by-Field Schema Definition

Because the available source does not provide a complete original Table 16 physical schema, the following is a **proposed implementation schema**, not a claim that these fields were explicitly specified in the original source.

| Field Name | Data Type | Key Type | Specification | Reason Field Exists |
|---|---|---|---|---|
| `id` | UUID | PK | `NOT NULL` | Stable unique identity of the lifecycle event |
| `tenant_id` | UUID | FK → `tenants.id` | `NOT NULL` | Establishes tenant ownership and isolation |
| `event_code` | VARCHAR(100) | — | `NOT NULL` | Stable machine-readable lifecycle event identifier |
| `event_name` | VARCHAR(200) | — | `NOT NULL` | Human-readable lifecycle event description |
| `event_category` | ENUM | — | `NOT NULL` | Groups lifecycle events by business/operational category |
| `event_description` | TEXT | — | `NULL` | Provides human-readable contextual information |
| `event_data` | JSONB | — | `NULL` | Stores structured event-specific metadata without changing the relational core |
| `source` | ENUM | — | `NOT NULL` | Identifies the subsystem responsible for producing the event |
| `triggered_by` | UUID | FK → `users.id` | `NULL` | Identifies the human actor when applicable |
| `occurred_at` | TIMESTAMPTZ | — | `NOT NULL` | Records when the lifecycle event actually occurred |
| `created_at` | TIMESTAMPTZ | — | `NOT NULL` | Records when the event record was persisted |

---

## `id`

The UUID identifies the lifecycle-event record.

Example:

```text
TenantCreated
id = 9a...
```

and:

```text
TenantActivated
id = 8b...
```

Each event therefore has a stable reference.

---

## `tenant_id`

Establishes ownership:

```text
tenant_lifecycle_events.tenant_id
          ↓
       tenants.id
```

This is mandatory.

---

## `event_code`

This is the machine-readable identity of the lifecycle event.

Examples:

```text
tenant_created
tenant_provisioning_started
tenant_provisioning_completed
tenant_onboarding_started
tenant_onboarding_completed
tenant_activated
tenant_suspended
tenant_reactivated
tenant_archived
tenant_deprovisioning_started
tenant_deprovisioning_completed
```

It should remain stable even if the UI-facing event name changes.

---

## `event_name`

Human-readable representation.

Examples:

```text
Tenant Created
Tenant Provisioning Started
Tenant Provisioning Completed
Tenant Activated
Tenant Suspended
```

This field is presentation/operational metadata rather than the machine-level identity.

---

## `event_category`

Provides coarse classification.

Potential categories:

```text
provisioning
onboarding
activation
suspension
archival
deprovisioning
migration
configuration
commercial
```

This makes lifecycle reporting easier without parsing individual event names.

---

## `event_description`

Provides additional context.

Example:

```text
"Tenant successfully completed initial configuration and
was activated by the provisioning workflow."
```

It should not become an unrestricted application log message.

---

## `event_data`

Stores structured event-specific information.

For example:

```json
{
  "provisioning_job_id": "prov_12345",
  "region": "ap-south-1",
  "schema": "tenant_abc"
}
```

The relational columns should contain the stable fields needed for querying.

`event_data` should be reserved for variable event-specific metadata.

---

## `source`

Identifies the system responsible for generating the lifecycle event.

Potential values:

```text
system
administrator
provisioning
billing
security
api
migration
```

This follows the provenance concept already established for tenant lifecycle/status records.

---

## `triggered_by`

Identifies a human user when a lifecycle action was explicitly initiated by a user.

Example:

```text
Administrator
     ↓
Archive Tenant
     ↓
triggered_by = user UUID
```

For automatic events:

```text
Provisioning Service
     ↓
TenantProvisioningCompleted
     ↓
triggered_by = NULL
```

---

## `occurred_at`

Records the actual event time.

This is distinct from:

```text
created_at
```

because the event may occur before its persistent record is written.

---

## `created_at`

Records when the lifecycle-event row was persisted.

This distinction becomes valuable in distributed systems.

---

# 9. Enum Definitions

The source does **not explicitly define Table 16 enum values**, so the following are proposed implementation enums rather than source-established values.

## `event_category`

| Value | Description |
|---|---|
| `provisioning` | Infrastructure or tenant initialization lifecycle event |
| `onboarding` | Tenant onboarding workflow event |
| `activation` | Operational activation/deactivation lifecycle event |
| `suspension` | Temporary restriction lifecycle event |
| `archival` | Tenant archival lifecycle event |
| `deprovisioning` | Tenant retirement/deployment removal event |
| `migration` | Tenant migration or structural movement |
| `configuration` | Significant tenant lifecycle configuration event |
| `commercial` | Lifecycle event caused by commercial/subscription state |
| `security` | Security-driven lifecycle event |

These should be finalized together with the application's event taxonomy.

---

## `source`

Proposed values:

| Value | Description |
|---|---|
| `system` | Automatic platform process |
| `administrator` | Explicit administrator action |
| `provisioning` | Provisioning/orchestration service |
| `billing` | Billing/subscription subsystem |
| `security` | Security subsystem |
| `api` | Authorized API request |
| `migration` | Migration process |

The precise vocabulary should remain consistent with the source-defined `source` semantics in `tenant_status_history`.

---

# 10. Why `event_code` Exists

`event_code` provides a stable machine-readable identifier for lifecycle events.

Without it, downstream systems would be forced to interpret:

```text
event_name
```

as a business identifier.

That is undesirable.

For example:

```text
event_code:
tenant_provisioning_completed
```

can remain stable while:

```text
event_name:
Tenant Provisioning Completed
```

could be localized or reworded.

---

## Event Consumers

Downstream systems can therefore subscribe to:

```text
tenant_provisioning_completed
```

without depending on human-readable text.

---

## Why Not Use `event_name` Alone?

Because:

```text
"Tenant Activated"
```

is presentation-oriented.

Whereas:

```text
tenant_activated
```

is an appropriate machine-level contract.

---

# 11. Candidate Keys

| Key Type | Field(s) | Rationale |
|---|---|---|
| Primary Key | `id` | Stable technical event identity |
| Candidate / Business Key | `(tenant_id, event_code, occurred_at)` | Identifies an event occurrence within a tenant's lifecycle |

However, this should **not automatically be declared UNIQUE**.

The same event can legitimately occur more than once.

For example:

```text
TenantSuspended
   ↓
TenantReactivated
   ↓
TenantSuspended
```

Therefore:

```text
tenant_suspended
```

can occur multiple times for one tenant.

---

## Idempotency Consideration

If lifecycle events originate from distributed systems, a separate:

```text
event_id
```

or producer-side idempotency key may eventually be required.

The UUID `id` identifies the persisted record but does not automatically solve duplicate-event delivery.

This should be addressed at the event-processing architecture level.

---

# 12. Constraints

The proposed production constraint model is:

| Constraint | Definition | Reason |
|---|---|---|
| Primary Key | `PK(id)` | Unique lifecycle event identity |
| Tenant FK | `tenant_id → tenants.id` | Enforces tenant ownership |
| Event Code Required | `event_code NOT NULL` | Every event needs machine identity |
| Event Name Required | `event_name NOT NULL` | Human-readable event identity |
| Category Required | `event_category NOT NULL` | Enables classification |
| Source Required | `source NOT NULL` | Establishes provenance |
| Occurrence Required | `occurred_at NOT NULL` | Enables chronological reconstruction |
| Persistence Timestamp | `created_at NOT NULL` | Records persistence |
| Append-Only | No normal UPDATE | Preserves historical meaning |
| Tenant Isolation | Tenant-scoped access | Prevents cross-tenant disclosure |

---

## Event Data Validation

`event_data` should contain structured JSON, not arbitrary uncontrolled text.

The system should validate the expected schema for event-specific payloads at the service/event-contract layer.

---

## Append-Only Constraint

The lifecycle event history should behave as:

```text
INSERT
  ↓
allowed

UPDATE
  ↓
normally prohibited

DELETE
  ↓
retention-controlled
```

The source does not explicitly define physical database enforcement for Table 16, so this remains a proposed production rule.

---

# 13. Relationships

## Incoming References / Consumers

The lifecycle event history is logically consumed by:

- Tenant administration.
- Provisioning.
- Operations.
- Audit.
- Compliance.
- Support.
- Analytics.
- Notifications.

These are logical service relationships rather than necessarily physical foreign keys.

---

## Outgoing References

### Tenant

```text
tenant_id → tenants.id
```

### User

```text
triggered_by → users.id
```

The `triggered_by` relationship is nullable because lifecycle events can be generated automatically.

---

## Relationship to `tenant_status_history`

These tables are related but distinct.

```text
tenant_status_history
        │
        │ status transition
        ▼
tenant_lifecycle_events
        │
        │ broader lifecycle context
        ▼
Lifecycle Timeline
```

There should **not automatically be a foreign key** between them.

One lifecycle event may cause a status transition, but not every lifecycle event does.

---

## Relationship to `tenant_provisioning_logs`

These also have different responsibilities:

```text
tenant_lifecycle_events
        ↓
Business lifecycle milestones
```

```text
tenant_provisioning_logs
        ↓
Provisioning/deployment operational details
```

Do not merge them simply because both contain historical information.

---

# 14. Cardinality Analysis

| Relationship | Expected Cardinality |
|---|---:|
| Tenant → Lifecycle Events | 1–N |
| Lifecycle Event → Tenant | Exactly 1 |
| User → Triggered Lifecycle Events | 0–N |
| Lifecycle Event → User | 0–1 |
| Event Code → Tenant | 0–N |
| Tenant → Same Event Code | 0–N |

---

## Expected Growth

Lifecycle events are generally much less frequent than:

```text
API requests
usage counters
application activity
claims
policy transactions
```

but considerably more numerous than static tenant configuration.

Example:

```text
100,000 tenants
×
50 lifecycle events
```

gives:

```text
5,000,000 rows
```

This is still a manageable relational workload.

The larger concern is long-term retention rather than immediate transaction volume.

---

# 15. Query Patterns

## Retrieve Tenant Lifecycle

```sql
SELECT *
FROM tenant_lifecycle_events
WHERE tenant_id = :tenant_id
ORDER BY occurred_at;
```

This is the primary historical reconstruction query.

---

## Retrieve Recent Lifecycle Events

```sql
SELECT *
FROM tenant_lifecycle_events
WHERE tenant_id = :tenant_id
ORDER BY occurred_at DESC
LIMIT 20;
```

Useful for administration and support interfaces.

---

## Retrieve Provisioning Events

```sql
SELECT *
FROM tenant_lifecycle_events
WHERE tenant_id = :tenant_id
AND event_category = 'provisioning'
ORDER BY occurred_at;
```

---

## Retrieve Activation Events

```sql
SELECT *
FROM tenant_lifecycle_events
WHERE tenant_id = :tenant_id
AND event_code = 'tenant_activated'
ORDER BY occurred_at DESC;
```

---

## Retrieve Events Triggered by an Administrator

```sql
SELECT *
FROM tenant_lifecycle_events
WHERE tenant_id = :tenant_id
AND triggered_by = :user_id
ORDER BY occurred_at DESC;
```

---

## Platform-Wide Lifecycle Analytics

Authorized platform operations may query:

```sql
SELECT
    event_code,
    COUNT(*) AS event_count
FROM tenant_lifecycle_events
WHERE occurred_at >= :start_time
AND occurred_at < :end_time
GROUP BY event_code
ORDER BY event_count DESC;
```

This can support platform-level operational analytics.

---

# 16. Index Strategy

The proposed indexes are:

```text
PK(id)
INDEX(tenant_id)
INDEX(tenant_id, occurred_at)
INDEX(event_code)
INDEX(event_category)
INDEX(occurred_at)
INDEX(source)
```

---

## Primary Key

```sql
PRIMARY KEY (id)
```

Provides direct event lookup.

---

## Tenant Index

```sql
INDEX(tenant_id)
```

Supports tenant-scoped lifecycle queries.

---

## Tenant + Timestamp Index

The most important composite index is likely:

```sql
INDEX(tenant_id, occurred_at)
```

because the dominant query is:

```sql
WHERE tenant_id = ?
ORDER BY occurred_at
```

This is preferable to relying only on two independent indexes.

---

## Event Code

```sql
INDEX(event_code)
```

Supports event-specific operational analytics.

---

## Event Category

```sql
INDEX(event_category)
```

Supports queries such as:

```text
all provisioning events
all onboarding events
all archival events
```

---

## Occurrence Time

```sql
INDEX(occurred_at)
```

Supports platform-wide time-window analysis.

---

## Source

```sql
INDEX(source)
```

Supports provenance-based analysis.

---

## High-Volume Consideration

Unlike:

```text
tenant_usage_counters
```

this table is expected to have comparatively low writes.

Therefore a somewhat richer index set can be justified.

However, indexes should still be evaluated against actual query plans.

---

# 17. Read / Write Characteristics

The expected characteristics are:

| Operation | Expected Volume | Reason |
|---|---|---|
| Reads | High | Administration, support, compliance, lifecycle analysis |
| Inserts | Moderate | New lifecycle event for significant lifecycle milestones |
| Updates | None/Very Low | Historical records should be append-only |
| Deletes | Very Low | Retention-controlled rather than operational |

---

## Reads

Common reads:

```text
Tenant Administration
Support
Compliance
Provisioning
Operations
Analytics
```

---

## Writes

Writes happen when meaningful lifecycle events occur.

Examples:

```text
Tenant Created
Provisioning Started
Provisioning Completed
Onboarding Completed
Tenant Activated
Tenant Suspended
Tenant Reactivated
Tenant Archived
```

---

## Updates

Should normally be:

```text
Never
```

---

## Deletes

Should be controlled by the retention policy.

The source does not establish permanent retention for this specific table, so that policy must not be invented.

---

# 18. Caching Strategy

A lifecycle event history can be cached for administrative interfaces.

Proposed Redis key:

```text
tenant-lifecycle-events:{tenant_id}
```

---

## Appropriate Cache Contents

The cache should normally contain:

```text
recent lifecycle events
```

rather than the entire historical dataset.

For example:

```json
{
  "events": [
    {
      "event_code": "tenant_activated",
      "occurred_at": "2026-08-15T08:00:00Z"
    },
    {
      "event_code": "tenant_onboarding_completed",
      "occurred_at": "2026-08-15T07:58:00Z"
    }
  ]
}
```

---

## Cache Invalidation

When a new event is recorded:

```text
Lifecycle Event
      ↓
tenant_lifecycle_events INSERT
      ↓
Invalidate/update
tenant-lifecycle-events:{tenant_id}
```

---

## Database Authority

The database remains authoritative.

```text
PostgreSQL
    ↓
Historical lifecycle record

Redis
    ↓
Read acceleration
```

A cache miss must never mean:

```text
"No lifecycle events exist."
```

---

# 19. Security Considerations

Lifecycle events can expose sensitive operational information.

Examples:

```text
Tenant suspended
Security deprovisioning started
Tenant data migrated
Billing-triggered lifecycle event
```

Therefore:

- Tenant isolation is mandatory.
- RBAC is required.
- Cross-tenant access must be restricted.
- Sensitive `event_data` must be protected.
- Lifecycle event creation should be controlled.
- Historical records should be append-only.
- Administrative access should be auditable.

---

## Sensitive Event Data

`event_data` must not become a mechanism for dumping:

- passwords,
- API keys,
- access tokens,
- secrets,
- unnecessary PII.

The lifecycle event should contain only the information necessary to explain the lifecycle event.

---

## Actor Attribution

Where a human initiated the event:

```text
triggered_by
```

should identify that user.

Where the system generated it:

```text
triggered_by = NULL
source = system/provisioning/etc.
```

This maintains accountability without pretending automated events have human actors.

---

# 20. Audit Requirements

Lifecycle events themselves form a historical record, but significant events should also generate domain events where downstream processing is required.

Recommended events include:

| Event | Trigger | Purpose |
|---|---|---|
| `TenantLifecycleEventRecorded` | Any lifecycle event persisted | Generic lifecycle notification |
| `TenantCreated` | Tenant created | Notify lifecycle consumers |
| `TenantProvisioningStarted` | Provisioning begins | Track provisioning workflow |
| `TenantProvisioningCompleted` | Provisioning succeeds | Signal readiness |
| `TenantOnboardingCompleted` | Onboarding completed | Signal onboarding completion |
| `TenantActivated` | Tenant activated | Signal operational readiness |
| `TenantSuspended` | Tenant suspended | Signal operational restriction |
| `TenantReactivated` | Tenant reactivated | Signal restored operation |
| `TenantArchived` | Tenant archived | Signal lifecycle closure |
| `TenantDeprovisioningCompleted` | Tenant fully deprovisioned | Signal retirement completion |

The exact event contract should be finalized with the platform event architecture.

---

## Important Separation

A database record:

```text
tenant_lifecycle_events
```

and an asynchronous event:

```text
TenantActivated
```

are not necessarily the same thing.

The persisted table answers:

> What happened historically?

The event bus answers:

> Which systems need to react now?

This distinction is critical for a reliable architecture.

---

# 21. Event Producers / Event Consumers

## Producers

Potential producers include:

- Tenant Management Service.
- Provisioning Service.
- Onboarding Service.
- Billing Service.
- Security Service.
- Migration Service.
- Platform Administration.

---

## Consumers

Potential consumers include:

- Audit Service.
- Compliance Service.
- Notification Service.
- Monitoring.
- Analytics.
- Billing.
- Provisioning.
- Support tooling.

---

## Example — Tenant Activation

```text
Onboarding Completed
        ↓
Tenant Lifecycle Service
        ↓
tenant_lifecycle_events
        ↓
TenantActivated
        ↓
Event Bus
   ┌────────┼───────────┬────────────┐
   ▼        ▼           ▼            ▼
Audit   Notifications Analytics   Monitoring
```

---

## Example — Tenant Archival

```text
Administrator
      ↓
Archive Tenant
      ↓
Tenant Lifecycle Service
      ↓
tenant_lifecycle_events
      ↓
TenantArchived
      ↓
Event Bus
   ┌─────────┬──────────┬───────────┐
   ▼         ▼          ▼           ▼
Audit    Billing     Provisioning  Notifications
```

---

# 22. Alternative Designs Considered

| Option | Description | Verdict |
|---|---|---|
| A | Store lifecycle events only in `tenant_status_history` | **Rejected** |
| B | Store lifecycle events only in application logs | **Rejected** |
| C | Store lifecycle state inside `tenants` | **Rejected** |
| D | JSON-only lifecycle history | **Rejected** |
| **E** | Dedicated `tenant_lifecycle_events` table | **Chosen** |

---

## Option A — Use `tenant_status_history`

### Rejected

`tenant_status_history` is specifically concerned with:

```text
previous_status
        ↓
current_status
```

Not every lifecycle event represents a status transition.

For example:

```text
TenantProvisioningStarted
```

may occur while the tenant remains in its current status.

Therefore status history cannot fully represent lifecycle events.

---

## Option B — Application Logs Only

### Rejected

General application logs are optimized for:

```text
debugging
observability
diagnostics
```

rather than durable business history.

Application logs can be:

- rotated,
- archived,
- sampled,
- moved to external systems,
- retained under different policies.

A tenant lifecycle history requires a durable business-level representation.

---

## Option C — Store Everything in `tenants`

Example:

```text
tenants
├── status
├── last_event
├── provisioning_completed
├── onboarding_completed
├── archived_at
└── ...
```

### Rejected

This would turn the tenant root into a historical-event container.

A single current row cannot represent:

```text
Event 1
Event 2
Event 3
Event 4
...
```

without either losing history or introducing a complex JSON structure.

---

## Option D — JSON-Only History

Example:

```json
{
  "events": [
    {
      "type": "tenant_created",
      "timestamp": "..."
    },
    {
      "type": "tenant_activated",
      "timestamp": "..."
    }
  ]
}
```

### Rejected

This weakens:

- chronological querying,
- indexing,
- reporting,
- event-level references,
- retention management,
- tenant-scoped analytics,
- relational integrity.

---

## Option E — Dedicated Table

### Chosen

A dedicated table provides:

- Durable lifecycle history.
- Tenant isolation.
- Efficient chronological queries.
- Event-level identity.
- Structured event classification.
- Provenance.
- Optional structured event payloads.
- Integration with event-driven architecture.
- Independent retention/indexing strategy.

This preserves the distinction between:

```text
Current State
```

```text
Status History
```

```text
Lifecycle Event History
```

```text
Operational Logs
```

which is essential for a production-grade enterprise system.

---

# 23. Final Design Assessment

| Attribute | Rating |
|---|---|
| Complexity | **Medium** |
| Read Volume | **High** |
| Write Volume | **Moderate** |
| Security Importance | **High** |
| Business Criticality | **High** |
| Scalability | **Excellent** |
| Recommended Status | **Core Lifecycle History Table** |

---

# Overall Assessment

`tenant_lifecycle_events` provides the **broader historical lifecycle timeline** of a tenant.

Its role in the Tenant Management domain is:

```text
                         TENANT
                           │
          ┌────────────────┼─────────────────┐
          │                │                 │
          ▼                ▼                 ▼
   Current State      Status History    Lifecycle Events
          │                │                 │
          ▼                ▼                 ▼
  tenants.status    State transitions   Lifecycle milestones
```

The three should not be merged.

---

## Example

Consider this tenant lifecycle:

```text
1. Tenant Created
2. Provisioning Started
3. Provisioning Completed
4. Onboarding Started
5. Onboarding Completed
6. Tenant Activated
7. Subscription Assigned
8. Tenant Suspended
9. Tenant Reactivated
10. Tenant Archived
```

The system can represent this as:

### `tenants`

```text
status = archived
```

### `tenant_status_history`

```text
pending → active
active → suspended
suspended → active
active → archived
```

### `tenant_lifecycle_events`

```text
TenantCreated
TenantProvisioningStarted
TenantProvisioningCompleted
TenantOnboardingStarted
TenantOnboardingCompleted
TenantActivated
TenantSubscriptionAssigned
TenantSuspended
TenantReactivated
TenantArchived
```

This is a much richer and more accurate model.

---

# Critical Production Invariants

1. **Every lifecycle event belongs to exactly one tenant.**
2. **`tenant_lifecycle_events` is historical data, not current tenant state.**
3. **Current tenant status remains in `tenants.status`.**
4. **Status transitions remain represented by `tenant_status_history`.**
5. **Lifecycle events may exist without a status transition.**
6. **Lifecycle event records should be append-only.**
7. **`tenant_id` is mandatory for tenant isolation.**
8. **`event_code` should be a stable machine-readable identifier.**
9. **`event_name` should remain human-readable metadata.**
10. **`source` establishes event provenance.**
11. **`triggered_by` should be nullable for system-generated events.**
12. **`occurred_at` represents the business occurrence time.**
13. **`created_at` represents persistence time.**
14. **The same `event_code` may legitimately occur multiple times for one tenant.**
15. **Do not impose uniqueness on `(tenant_id, event_code)` because lifecycle events can recur.**
16. **`event_data` must not become an uncontrolled dumping ground for secrets or unnecessary PII.**
17. **The table should not replace infrastructure/provisioning logs.**
18. **The table should not replace the general audit system.**
19. **The database record and asynchronous domain event are separate concepts.**
20. **Lifecycle events should be written before/with reliable event publication according to the platform's transactional event strategy.**
21. **Cross-tenant lifecycle history access must be explicitly authorized.**
22. **Historical records should not normally be updated.**
23. **Retention must be explicitly defined; permanent retention must not be assumed without a requirement.**
24. **The dominant tenant timeline query should be supported by `(tenant_id, occurred_at)`.**
25. **The table should remain focused on one question: “What significant lifecycle events has this tenant experienced?”**

---

# Final Conceptual Model

```text
┌──────────────────────────────────────┐
│                TENANT                │
└──────────────────┬───────────────────┘
                   │
       ┌───────────┼────────────┐
       │           │            │
       ▼           ▼            ▼
┌────────────┐ ┌────────────┐ ┌─────────────────────┐
│  tenants   │ │  tenant_   │ │ tenant_lifecycle_  │
│            │ │  status_   │ │      events        │
│ Current    │ │  history   │ │                     │
│ State      │ │            │ │ Lifecycle           │
│            │ │ Status     │ │ Milestones          │
│ status     │ │ transitions│ │ & Events            │
└────────────┘ └────────────┘ └─────────────────────┘
                                      │
                                      ▼
                                Event Consumers
                              ┌──────┼───────┐
                              ▼      ▼       ▼
                            Audit  Ops   Analytics
```

The essential architectural distinction is:

> **`tenants` tells us the tenant's current state; `tenant_status_history` tells us how its status changed; `tenant_lifecycle_events` tells us the broader sequence of significant lifecycle events that occurred around that tenant.**

This separation prevents the Tenant Management domain from collapsing **state, status history, lifecycle history, and operational logs** into a single overloaded structure.

**Step 3 — `tenant_lifecycle_events` is complete.**
