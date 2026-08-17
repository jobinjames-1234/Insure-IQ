# Step 3 — Table 15: `tenant_status_history`

The Module 1 inventory identifies **Table 15** as `tenant_status_history`, whose purpose is **“Historical tenant status changes.”**

The existing Table 15 source defines this table as an **immutable history of tenant status transitions**. The current status remains in `tenants`; this table preserves the historical transitions for auditing, compliance, troubleshooting, reporting, and analytics.

I am maintaining the anti-degradation standard:

**Field Name → Data Type → Key Type → Specification → Reason Field Exists**

rather than collapsing the schema into a simplified `Field / Type / Notes` table.

---

# 1. Why This Table Exists

The `tenant_status_history` table maintains the historical sequence of lifecycle status changes experienced by a tenant.

The current tenant status belongs in:

```text
tenants.status
```

The historical sequence belongs in:

```text
tenant_status_history
```

This distinction is fundamental.

For example, a tenant may have experienced:

```text
pending
   ↓
active
   ↓
suspended
   ↓
active
   ↓
locked
   ↓
active
```

The `tenants` table should contain only the **current state**:

```text
status = active
```

while `tenant_status_history` preserves the complete sequence.

The table's purposes are:

- Auditing
- Compliance
- Troubleshooting
- Reporting
- Analytics
- Lifecycle transparency

---

## Why Current Status Alone Is Insufficient

Suppose an insurer is currently:

```text
active
```

That does not tell us:

- When it became active.
- Whether it was previously suspended.
- Whether security previously locked it.
- Whether billing caused a suspension.
- Who changed the status.
- Why the status changed.
- What the previous state was.

The history table provides that missing context.

```text
tenants
   │
   └── status = active
                 │
                 │ current state only
                 ▼
tenant_status_history
   │
   ├── pending → active
   ├── active → suspended
   ├── suspended → active
   ├── active → locked
   └── ...
```

---

# 2. Business Definition

A **Tenant Status History** record represents **one status transition experienced by a tenant**.

Examples include:

```text
Pending → Active
Active → Suspended
Suspended → Active
Active → Locked
Active → Archived
```

A history record therefore represents an event in the tenant's lifecycle rather than a current tenant configuration.

---

## Example

Suppose:

```text
Tenant:
ABC Insurance
```

experiences:

```text
2026-01-01
pending → active

2026-03-15
active → suspended

2026-03-17
suspended → active
```

The table would contain three historical records.

Conceptually:

| Time | Previous | Current | Reason |
|---|---|---|---|
| Jan 1 | `pending` | `active` | Onboarding completed |
| Mar 15 | `active` | `suspended` | Billing issue |
| Mar 17 | `suspended` | `active` | Billing resolved |

The `tenants.status` field would ultimately contain:

```text
active
```

---

# 3. Critical Design Principle — What the Entity IS and IS NOT

## The Tenant Status History IS

- An immutable lifecycle audit record.
- A historical state transition.
- A child entity of the Tenant aggregate.
- A compliance record.
- A security investigation record.
- A lifecycle reporting source.
- A historical reconstruction mechanism.

---

## The Tenant Status History IS NOT

- The current tenant status.
- A replacement for `tenants.status`.
- A general-purpose audit log.
- A tenant configuration record.
- A subscription record.
- A billing transaction.

This distinction is critical:

```text
tenants.status
       ↓
Current truth

tenant_status_history
       ↓
Historical truth
```

---

# 4. Aggregate Root Analysis — DDD Structure

The structure is:

```text
Tenant
│
├── Current Status
├── Status History
└── Lifecycle Events
```

Expanded:

```text
Tenant
│
├── Current State
│      └── tenants.status
│
├── Status History
│      ├── pending → active
│      ├── active → suspended
│      ├── suspended → active
│      ├── active → locked
│      └── ...
│
└── Lifecycle Events
       ├── provisioning
       ├── activation
       ├── suspension
       ├── archival
       └── cancellation
```

---

## DDD Interpretation

`Tenant` remains the aggregate root.

`tenant_status_history` is subordinate historical state.

It should therefore not be treated as an independent business aggregate.

Conceptually:

```text
Tenant
  │
  └── StatusHistoryEntry
```

The history entry exists because the tenant experienced a state transition.

---

# 5. Business Capabilities Supported

| Capability | Supported |
|---|---|
| Lifecycle auditing | Yes |
| Compliance reporting | Yes |
| Security investigations | Yes |
| SLA reporting | Yes |
| Tenant analytics | Yes |
| Current status management | No — `tenants` |
| Subscription management | No |
| Billing transactions | No |
| General audit logging | No — separate audit infrastructure |

---

## Lifecycle Auditing

Provides a chronological record of status changes.

---

## Compliance Reporting

A compliance team can answer:

> Was this tenant ever suspended?

or:

> When was this tenant archived?

---

## Security Investigations

Security personnel can determine whether a tenant was:

```text
active
   ↓
locked
```

and identify the actor/source responsible.

---

## SLA Reporting

The history can help calculate periods such as:

```text
suspended_at → reactivated_at
```

to determine how long a tenant was unavailable.

---

# 6. Multi-Tenant / Ownership / Isolation Notes

Every history record belongs to exactly one tenant.

```text
tenant_status_history.tenant_id
          ↓
       tenants.id
```

---

## Tenant Isolation

Correct:

```sql
SELECT *
FROM tenant_status_history
WHERE tenant_id = :tenant_id
ORDER BY changed_at;
```

A tenant administrator should never receive another tenant's status history.

---

## Platform-Level Access

Cross-tenant queries may be appropriate for:

- Platform administrators.
- Compliance.
- Security.
- Billing operations.
- Platform analytics.

But such access must be explicitly authorized.

---

## Why Tenant ID Must Be Present

Even though the record could theoretically be reached through other tenant relationships, storing:

```text
tenant_id
```

makes the ownership boundary explicit and allows:

```sql
WHERE tenant_id = :tenant_id
```

to become the fundamental isolation predicate.

---

# 7. Lifecycle

The lifecycle is:

```text
Creation:
Initial Status Recorded

Growth:
New Record Added for Every Status Change

Modification:
Never Updated

Archival:
Retained Permanently
```

This is an **append-only** table.

---

## Creation — Initial Status Recorded

When the tenant is initially created, its first status transition/state record can be recorded.

For example:

```text
NULL → pending
```

or:

```text
pending → active
```

depending on the lifecycle implementation.

`previous_status` is optional, which supports an initial status record without requiring a previous state.

---

## Growth — New Record for Every Status Change

Every transition creates a new row.

Example:

```text
active → suspended
```

creates a record.

Then:

```text
suspended → active
```

creates another record.

The previous record is never overwritten.

---

## Modification — Never Updated

This is a critical invariant.

Once created:

```text
tenant_status_history.id = X
```

should not be changed.

Updates are **Never**.

If an incorrect history entry is created, the correction should itself be represented through an appropriate corrective/audit mechanism rather than silently rewriting the historical record.

---

## Archival — Retained Permanently

Historical records are retained permanently.

This is appropriate because lifecycle history can have:

- Legal significance.
- Compliance significance.
- Security significance.
- Financial significance.
- Operational significance.

---

# 8. Proposed Schema

## Table Name

`tenant_status_history`

## Primary Key Strategy

**UUID**

---

## Full Field-by-Field Schema Definition

| Field Name | Data Type | Key Type | Specification | Reason Field Exists |
|---|---|---|---|---|
| `id` | UUID | PK | `NOT NULL` | Stable unique identity of the historical status record |
| `tenant_id` | UUID | FK → `tenants.id` | `NOT NULL` | Establishes the tenant whose lifecycle is being recorded |
| `previous_status` | ENUM | — | `NULL` | Records the tenant status immediately before the transition |
| `current_status` | ENUM | — | `NOT NULL` | Records the new tenant status after the transition |
| `status_reason` | TEXT | — | `NULL` | Explains why the status transition occurred |
| `changed_by` | UUID | FK → `users.id` | `NULL` | Identifies the user responsible for the change when applicable |
| `changed_at` | TIMESTAMPTZ | — | `NOT NULL` | Records the exact time of the status transition |
| `source` | ENUM | — | `NOT NULL` | Identifies the subsystem or authority that caused the transition |
| `created_at` | TIMESTAMPTZ | — | `NOT NULL` | Records when the historical record was persisted |

These fields preserve the source-defined schema.

---

## `id`

UUID provides the immutable technical identity of the history record.

Example:

```text
Status transition #1
id = UUID-A

Status transition #2
id = UUID-B
```

The UUID remains stable even if the history is queried through different business contexts.

---

## `tenant_id`

Establishes ownership:

```text
tenant_status_history.tenant_id
          ↓
       tenants.id
```

This is the principal tenant-isolation field.

---

## `previous_status`

Stores the state before the transition.

Example:

```text
previous_status = active
current_status  = suspended
```

This field is optional.

This is useful for the initial lifecycle record where no prior state exists.

---

## `current_status`

Stores the new status.

Example:

```text
current_status = suspended
```

It is the most important business field in the history record.

---

## `status_reason`

Stores the business context explaining why the transition occurred.

Examples:

```text
"Subscription payment overdue"

"Security investigation initiated"

"Tenant onboarding completed"

"Regulatory suspension"

"Tenant requested account closure"
```

This field exists to provide business context.

---

## `changed_by`

Identifies the actor responsible for the status change.

It may be:

```text
User
```

or absent when the transition was system-generated.

The relationship is:

```text
changed_by → users.id
```

and is nullable.

---

## `changed_at`

Records when the business transition occurred.

This should represent the actual transition timestamp rather than merely the timestamp at which an unrelated downstream process happened.

It is also part of the historical ordering.

---

## `source`

Identifies the subsystem responsible for the status transition.

Examples:

```text
system
administrator
billing
security
api
migration
```

This is important because:

```text
active → suspended
```

has different operational meaning depending on whether the source was:

```text
billing
```

or:

```text
security
```

---

## `created_at`

Records when the history record was persisted.

This is intentionally distinct from:

```text
changed_at
```

because the business event and database persistence may not occur at exactly the same instant.

---

# 9. Enum Definitions

## `tenant_status`

| Value | Description |
|---|---|
| `pending` | Tenant exists but is awaiting activation or completion of onboarding |
| `active` | Tenant is operational |
| `suspended` | Tenant is temporarily prevented from normal operation |
| `locked` | Tenant access has been restricted, typically for security or administrative reasons |
| `inactive` | Tenant is no longer operational but has not necessarily been permanently archived |
| `archived` | Tenant is retained for historical purposes and is no longer operational |

The exact transition rules between these statuses belong to the tenant lifecycle domain.

---

## `source`

| Value | Description |
|---|---|
| `system` | Automatic platform/system-generated status transition |
| `administrator` | Explicit administrative action |
| `billing` | Status transition caused by billing/subscription processes |
| `security` | Security-related status transition |
| `api` | Transition initiated through an authorized API |
| `migration` | Status transition produced during data migration |

---

## Why `source` Is Important

Without `source`, these records:

```text
active → suspended
```

would not reveal whether suspension came from:

```text
Billing
Security
Administrator
System
```

The source therefore adds operational provenance.

---

# 10. Why `status_reason` Exists

`status_reason` provides business context explaining why the status changed.

This is important because `current_status` and `source` alone are insufficient.

For example:

```text
current_status = suspended
source = billing
```

still does not explain:

```text
Why was billing suspension triggered?
```

The reason could be:

```text
"Invoice INV-2041 overdue by 45 days"
```

or:

```text
"Payment method failed three consecutive times"
```

That context is useful for:

- Support.
- Compliance.
- Finance.
- Audit.
- Incident investigation.

---

## `status_reason` Should Not Become an Event Log

It should contain the reason for **this specific status transition**.

It should not become:

```text
free-form audit history
```

for unrelated tenant activity.

General audit activity belongs elsewhere.

---

# 11. Candidate Keys

| Key Type | Field(s) | Rationale |
|---|---|---|
| Primary Key | `id` | Stable identity of the historical record |
| Candidate Key | `(tenant_id, changed_at)` | Identifies the tenant's status transition at a point in time |

---

## Important Consideration — Timestamp Precision

The conceptual candidate key is:

```text
tenant_id + changed_at
```

but production implementations should ensure that `changed_at` has sufficient precision.

Two transitions could theoretically occur extremely close together.

For example:

```text
10:00:00.123456
10:00:00.123457
```

PostgreSQL `TIMESTAMPTZ` can preserve microsecond precision, but application-level uniqueness should still be carefully considered.

The source-defined candidate key should not be silently expanded without a requirement.

---

## Why `id` Remains the Primary Key

The UUID primary key provides a stable reference for:

- Audit systems.
- Events.
- APIs.
- Support tooling.
- Cross-service references.

The candidate business key is useful for chronology, while UUID remains the technical identity.

---

# 12. Constraints

The constraint model is:

| Constraint | Definition | Reason |
|---|---|---|
| Primary Key | `PK(id)` | Unique historical record identity |
| Tenant FK | `tenant_id → tenants.id` | Enforces ownership |
| Current Status Required | `current_status NOT NULL` | Every history entry must identify the resulting state |
| Changed At Required | `changed_at NOT NULL` | Historical ordering requires a timestamp |
| Source Required | `source NOT NULL` | Provenance is mandatory |
| Append-Only | No UPDATE operations | Preserves historical integrity |
| Historical Retention | No ordinary DELETE | Preserves compliance and audit history |
| Previous Status Optional | `previous_status NULL` | Allows initial state record |

---

## Production Transition Integrity

A strong implementation should consider:

```sql
CHECK (
    previous_status IS NULL
    OR previous_status <> current_status
);
```

This prevents a record such as:

```text
active → active
```

from being recorded as a status transition.

However, this is a **production recommendation**, not a source-defined constraint.

---

## Append-Only Enforcement

Application code alone should not be trusted to preserve append-only semantics.

Production implementations can reinforce the rule through:

- Database permissions.
- Repository restrictions.
- Trigger policies where appropriate.
- Dedicated history-writing service.
- Audit controls.

The core requirement remains:

```text
Updates = Never
```

---

# 13. Relationships

## Incoming References / Consumers

- Audit Service
- Compliance
- Security
- Billing
- Notifications

---

## Outgoing References

### Tenant

```text
tenant_id → tenants.id
```

### User

```text
changed_by → users.id
```

The `changed_by` relationship is nullable because the source allows system-generated transitions.

---

## Why `changed_by` Is Nullable

Consider:

```text
Billing Service
      ↓
Payment failure
      ↓
Tenant suspended
```

There may be no human user responsible.

Therefore:

```text
changed_by = NULL
source = billing
```

is valid.

Conversely:

```text
Administrator
      ↓
Manually locks tenant
```

could produce:

```text
changed_by = user UUID
source = administrator
```

---

## Relationship to `tenants.status`

The relationship is:

```text
tenants.status
      │
      │ current state
      ▼
tenant_status_history
      │
      │ historical transitions
      ▼
Lifecycle Timeline
```

The history should not replace the current status field.

---

# 14. Cardinality Analysis

The source specifies:

> Many history records per tenant.

| Relationship | Expected Cardinality |
|---|---:|
| Tenant → Status History | 1–N |
| Status History → Tenant | Exactly 1 |
| User → Status Changes | 0–N |
| Status Change → User | 0–1 |
| Tenant → Current Status | Exactly 1 current value |
| Tenant → Historical Statuses | 1–N |

---

## Expected Growth

Unlike configuration tables, this table grows with lifecycle transitions.

However, tenant status changes should remain relatively infrequent compared with:

```text
tenant_usage_counters
```

Therefore writes remain **Low**.

---

## Example

If a tenant experiences:

```text
10 status changes
```

then:

```text
tenant_status_history
```

contains approximately:

```text
10 history rows
```

over that tenant's lifecycle.

At:

```text
100,000 tenants
×
20 historical transitions
```

the table would contain approximately:

```text
2,000,000 rows
```

This remains a very manageable relational workload.

---

# 15. Query Patterns

## Retrieve Complete Tenant Status History

```sql
SELECT *
FROM tenant_status_history
WHERE tenant_id = :tenant_id
ORDER BY changed_at;
```

This supports:

- Audit.
- Compliance.
- Timeline display.
- Incident investigation.

---

## Retrieve Most Recent Status Transition

```sql
SELECT *
FROM tenant_status_history
WHERE tenant_id = :tenant_id
ORDER BY changed_at DESC
LIMIT 1;
```

This supports:

- Tenant lifecycle dashboards.
- Support tooling.
- Status verification.
- Operational monitoring.

---

## Retrieve Suspensions

```sql
SELECT *
FROM tenant_status_history
WHERE tenant_id = :tenant_id
AND current_status = 'suspended'
ORDER BY changed_at DESC;
```

Useful for compliance and support.

---

## Retrieve Security Locks

```sql
SELECT *
FROM tenant_status_history
WHERE tenant_id = :tenant_id
AND current_status = 'locked'
ORDER BY changed_at DESC;
```

Useful for security investigations.

---

## Retrieve Billing-Originated Changes

```sql
SELECT *
FROM tenant_status_history
WHERE tenant_id = :tenant_id
AND source = 'billing'
ORDER BY changed_at DESC;
```

This separates billing-driven lifecycle changes from security or administrative actions.

---

# 16. Index Strategy

The source recommends:

- `PK(id)`
- `INDEX(tenant_id)`
- `INDEX(current_status)`
- `INDEX(changed_at)`
- `INDEX(source)`

---

## Primary Key

```sql
PRIMARY KEY (id)
```

Provides direct historical-record lookup.

---

## Tenant Index

```sql
INDEX(tenant_id)
```

This is the most important operational index because almost every query is tenant-scoped.

---

## Current Status Index

```sql
INDEX(current_status)
```

Supports queries such as:

```sql
WHERE current_status = 'suspended'
```

for operational reporting.

---

## Changed Timestamp Index

```sql
INDEX(changed_at)
```

Supports chronological and recent-event queries.

---

## Source Index

```sql
INDEX(source)
```

Supports analysis of:

```text
billing-originated
security-originated
administrator-originated
```

changes.

---

## Production Index Consideration

Because the most common query is likely:

```sql
WHERE tenant_id = :tenant_id
ORDER BY changed_at DESC
```

a production query planner may eventually show that:

```sql
INDEX(tenant_id, changed_at DESC)
```

is more useful than two separate indexes.

However, the baseline design should preserve the source-specified indexes until implementation/query-plan testing justifies refinement.

---

# 17. Read / Write Characteristics

The source specifies:

```text
Reads: High
Writes: Low
Updates: Never
```

---

## Reads

Expected reads include:

- Tenant administration.
- Compliance investigations.
- Security investigations.
- Audit screens.
- SLA reporting.
- Support tooling.
- Analytics.

---

## Writes

Writes occur when:

```text
Tenant Created
Tenant Activated
Tenant Suspended
Tenant Locked
Tenant Reactivated
Tenant Archived
Tenant Deactivated
```

or another recognized lifecycle transition occurs.

---

## Updates

```text
Never
```

This is a fundamental design characteristic.

---

## Deletes

Normal deletion should not occur.

Historical records are retained.

---

# 18. Caching Strategy

The source recommends:

```text
tenant-status-history:{tenant_id}
```

in Redis.

---

## Appropriate Cache Use

Caching can support:

```text
Tenant Administration
        ↓
Recent status timeline
        ↓
Redis
```

For example, the cache could contain the most recent N history records.

---

## Cache Invalidation

Whenever a status transition occurs:

```text
TenantStatusChanged
        ↓
Invalidate/update
tenant-status-history:{tenant_id}
```

Because writes are low, cache invalidation is comparatively inexpensive.

---

## Database Authority

The database remains the authoritative history.

```text
PostgreSQL
    ↓
Immutable lifecycle history

Redis
    ↓
Read acceleration
```

A Redis cache miss must never imply:

```text
"No history exists."
```

The system should query the database.

---

# 19. Security Considerations

The source explicitly identifies:

- Tenant isolation.
- RBAC.
- Append-only policy.
- Audit logging.

---

## Tenant Isolation

History must always be filtered by tenant unless the caller has explicit cross-tenant platform authority.

---

## RBAC

Status history can contain sensitive information.

For example:

```text
security
```

as a source may reveal an internal security action.

Therefore not every employee should necessarily see every status reason or source.

---

## Append-Only Security

An attacker who can modify status history could conceal:

```text
suspension
lock
security incident
```

Therefore write access should be extremely restricted.

Normal application users should have:

```text
READ
```

where authorized.

The history-writing service should have:

```text
INSERT
```

but not ordinary:

```text
UPDATE
DELETE
```

privileges.

---

## Audit Logging

Status transitions themselves are already historical events.

Nevertheless, access to sensitive history and administrative corrections should be auditable through the broader platform audit system.

---

# 20. Audit Requirements

The source defines these events:

| Event | Trigger | Purpose |
|---|---|---|
| `TenantStatusChanged` | Any tenant status transition | Record lifecycle state change |
| `TenantActivated` | Tenant becomes active | Record activation |
| `TenantSuspended` | Tenant becomes suspended | Record suspension |
| `TenantLocked` | Tenant becomes locked | Record security/administrative lock |
| `TenantArchived` | Tenant becomes archived | Record archival |

---

## `TenantStatusChanged`

This is the general event.

Example:

```text
active → suspended
```

produces:

```text
TenantStatusChanged
```

---

## `TenantActivated`

Specialized event when:

```text
current_status = active
```

after the transition.

---

## `TenantSuspended`

Generated when:

```text
current_status = suspended
```

---

## `TenantLocked`

Generated when:

```text
current_status = locked
```

---

## `TenantArchived`

Generated when:

```text
current_status = archived
```

---

## Event Payload Recommendation

The source does not define a complete payload schema.

For production, a useful event payload would contain:

```text
event_id
tenant_id
history_id
previous_status
current_status
status_reason
changed_by
source
changed_at
correlation_id
```

This is an implementation recommendation rather than a source-defined contract.

---

# 21. Event Producers / Event Consumers

## Producer

```text
TenantStatusChanged
```

## Consumers

- Audit
- Compliance
- Billing
- Security
- Notifications

---

## Status Change Workflow

```text
Tenant Lifecycle Service
          ↓
Status Transition
          ↓
tenant_status_history
          ↓
TenantStatusChanged
          ↓
       Event Bus
    ┌────┼───────┬──────────┬────────────┐
    ▼    ▼       ▼          ▼            ▼
 Audit Compliance Billing  Security  Notifications
```

---

## Example — Billing Suspension

```text
Invoice overdue
      ↓
Billing Service
      ↓
Tenant suspended
      ↓
tenant_status_history
      ↓
TenantStatusChanged
      ↓
Billing / Audit / Notification
```

---

## Example — Security Lock

```text
Security incident
      ↓
Security Service
      ↓
Tenant locked
      ↓
tenant_status_history
      ↓
TenantStatusChanged
      ↓
Security / Audit / Notifications
```

The `source` field allows downstream consumers to distinguish these scenarios.

---

# 22. Alternative Designs Considered

| Option | Description | Verdict |
|---|---|---|
| A | Store only current status | **Rejected** |
| B | JSON history | **Rejected** |
| C | Dedicated history table | **Chosen** |

---

## Option A — Store Only Current Status

Example:

```text
tenants
│
└── status = active
```

### Rejected

This loses historical information.

It cannot answer:

```text
Was this tenant previously suspended?
Who suspended it?
When did the suspension occur?
How long was it suspended?
Was it security or billing?
```

---

## Option B — JSON History

Example:

```json
{
  "history": [
    {
      "from": "pending",
      "to": "active"
    },
    {
      "from": "active",
      "to": "suspended"
    }
  ]
}
```

### Rejected

This weakens:

- Queryability.
- Indexing.
- Relational integrity.
- Auditability.
- Chronological querying.
- Reporting.
- Retention management.

It also makes individual history entries harder to reference from other systems.

---

## Option C — Dedicated Table

### Chosen

A dedicated relational table provides:

- Immutable history.
- Tenant isolation.
- Efficient chronological queries.
- Strong FK relationships.
- Source/provenance tracking.
- Compliance support.
- Security investigation support.
- Independent indexing.
- Clear append-only semantics.

This is the appropriate design for an enterprise SaaS platform.

---

# 23. Final Design Assessment

| Attribute | Rating |
|---|---|
| Complexity | **Low** |
| Read Volume | **High** |
| Write Volume | **Low** |
| Security Importance | **Very High** |
| Business Criticality | **High** |
| Scalability | **Excellent** |
| Recommended Status | **Core Audit Table** |

---

# Overall Assessment

`tenant_status_history` is the **immutable lifecycle-history layer** of the Tenant Management domain.

Its relationship with `tenants` is:

```text
┌───────────────────────────────┐
│           tenants             │
│                               │
│ status = active               │
│                               │
│ CURRENT STATE                 │
└───────────────┬───────────────┘
                │
                │ historical transitions
                ▼
┌──────────────────────────────────────┐
│       tenant_status_history          │
│                                      │
│ pending → active                     │
│ active → suspended                   │
│ suspended → active                   │
│ active → locked                      │
│ locked → active                      │
│ ...                                  │
│                                      │
│ HISTORICAL STATE                     │
└──────────────────────────────────────┘
```

The architectural distinction is:

### `tenants.status`

> **What is the tenant's status now?**

### `tenant_status_history`

> **How did the tenant arrive at its current status?**

---

## Example Complete Timeline

```text
Tenant Created
      │
      ▼
pending
      │
      │ onboarding completed
      ▼
active
      │
      │ invoice overdue
      ▼
suspended
      │
      │ payment received
      ▼
active
      │
      │ security investigation
      ▼
locked
      │
      │ investigation cleared
      ▼
active
      │
      │ tenant permanently leaves
      ▼
archived
```

The current `tenants.status` would eventually be:

```text
archived
```

while `tenant_status_history` retains every transition.

---

# Critical Production Invariants

1. **Every history record belongs to exactly one tenant.**
2. **`tenant_status_history` stores historical transitions, not current state.**
3. **Current tenant state remains in `tenants.status`.**
4. **Every genuine status transition creates a new history record.**
5. **History records are append-only.**
6. **History records must never be casually updated.**
7. **Historical records should not be physically deleted under normal lifecycle operations.**
8. **`current_status` is mandatory.**
9. **`previous_status` may be NULL for an initial state record.**
10. **`changed_at` establishes chronological business ordering.**
11. **`created_at` records persistence time and is distinct from `changed_at`.**
12. **`source` establishes the subsystem/provenance responsible for the transition.**
13. **`changed_by` is nullable because many transitions are system-generated.**
14. **`status_reason` provides business context and should not become a general-purpose audit log.**
15. **Tenant isolation must apply to every ordinary history query.**
16. **Sensitive status history must be protected by RBAC.**
17. **Write permissions should be restricted to trusted lifecycle services.**
18. **The source-defined candidate key is `(tenant_id, changed_at)`.**
19. **UUID `id` remains the stable technical identity of each history entry.**
20. **Status-specific events should complement, not replace, the persisted history record.**
21. **`TenantStatusChanged` is the general lifecycle event.**
22. **Specialized events such as `TenantSuspended` and `TenantLocked` support downstream workflows.**
23. **Billing-originated and security-originated transitions must remain distinguishable through `source`.**
24. **Redis is only a read-acceleration layer; PostgreSQL remains authoritative.**
25. **The table should remain focused on one question: “What status transitions has this tenant experienced?”**

---

# Final Conceptual Model

```text
                         TENANT
                           │
                           │ current state
                           ▼
                ┌─────────────────────┐
                │      tenants        │
                │                     │
                │ status = active     │
                └──────────┬──────────┘
                           │
                           │ history
                           ▼
             ┌─────────────────────────────┐
             │   tenant_status_history     │
             │                             │
             │ previous_status             │
             │ current_status              │
             │ status_reason               │
             │ changed_by                  │
             │ changed_at                  │
             │ source                      │
             └──────────────┬──────────────┘
                            │
                            │ TenantStatusChanged
                            ▼
                       EVENT BUS
                 ┌──────────┼───────────┐
                 ▼          ▼           ▼
              Audit     Compliance   Security
                 │          │           │
                 └──────────┼───────────┘
                            ▼
                       Reporting
```

The essential architectural principle is:

> **`tenants` stores the tenant's current lifecycle state; `tenant_status_history` preserves the immutable historical sequence of state transitions that produced that state.**

This makes the table a foundational component for **auditability, compliance, security investigations, lifecycle reporting, SLA analysis, and operational transparency** while preserving the tenant isolation boundary.

**Step 3 — `tenant_status_history` is complete.**
