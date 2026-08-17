# Step 3 — Table 27: `tenant_provisioning_logs`

The Module 1 inventory establishes **Table 27** as `tenant_provisioning_logs`, with the purpose **“Tenant provisioning and deployment history.”**

This is the **final table in Module 1 — Tenant Management**. The module itself is the root ownership domain for InsureIQ: every major business domain ultimately belongs to a tenant.

The source material establishes the table's existence and purpose, but I could not locate a surviving detailed original Table 27 schema specification containing the complete field list, exact enums, constraints, indexes, cardinality estimates, or audit/event definitions.

Therefore, to explicitly **fight content degradation**:

- **Source-established:** Table name, purpose, Tenant Management placement, tenant ownership, and its distinction from general tenant lifecycle history.
- **Proposed reconstruction:** Physical fields, exact constraints, enums, indexes, lifecycle states, caching, and event details where the original detailed specification is unavailable.
- I will **not silently present reconstructed fields as recovered source requirements**.

---

# 1. Why This Table Exists

The `tenant_provisioning_logs` table records the **operational history of provisioning and deployment activities performed for a tenant**.

Its documented purpose is:

> **Tenant provisioning and deployment history.**

Tenant creation in InsureIQ is not simply the insertion of one row into `tenants`.

A tenant may require provisioning of:

```text
Tenant
   │
   ├── Database / schema resources
   ├── Storage namespace
   ├── Application modules
   ├── Configuration
   ├── Integrations
   ├── API resources
   ├── Webhooks
   ├── Security configuration
   └── Other infrastructure
```

Therefore the platform needs a historical operational record of what happened during provisioning.

---

## The Problem It Solves

Without a provisioning log, an administrator might only see:

```text
tenants.status = provisioning
```

but not know:

```text
What step failed?
When did it fail?
Which provisioning operation was running?
What service executed it?
How many attempts occurred?
Was the operation retried?
What was the resulting status?
```

The provisioning log provides that operational history.

---

## Example

A tenant onboarding sequence might look like:

```text
Tenant Created
      ↓
Provisioning Started
      ↓
Database Configuration
      ↓
Storage Configuration
      ↓
Module Provisioning
      ↓
Security Configuration
      ↓
Integration Setup
      ↓
Provisioning Completed
      ↓
Tenant Activated
```

If storage provisioning fails:

```text
Tenant Created
      ↓
Provisioning Started
      ↓
Database Configuration ✓
      ↓
Storage Configuration ✗
      ↓
Provisioning Failed
```

The provisioning log preserves that sequence.

---

## Critical Distinction

This table records:

```text
HOW TENANT PROVISIONING OPERATIONS HAPPENED
```

It does not represent:

```text
CURRENT TENANT STATE
```

or:

```text
BUSINESS LIFECYCLE MILESTONES
```

Those responsibilities belong elsewhere.

---

# 2. Business Definition

A **Tenant Provisioning Log** represents an operational record generated while creating, configuring, deploying, modifying, suspending, or deprovisioning tenant resources.

It belongs to a tenant and provides an operational history of provisioning activity.

Conceptually:

```text
Tenant
   │
   └── Provisioning History
          │
          ├── Provisioning Started
          ├── Resource Created
          ├── Configuration Applied
          ├── Validation
          ├── Retry
          ├── Failure
          └── Completion
```

---

## Business Meaning

The table answers questions such as:

> Has this tenant been provisioned?

> What provisioning operations were performed?

> Which operation failed?

> When did provisioning fail?

> How many attempts were made?

> What deployment stage was reached?

> What was the final result of the provisioning operation?

---

## What This Table Represents

It represents:

- Provisioning operations.
- Deployment operations.
- Provisioning attempts.
- Provisioning results.
- Operational provisioning failures.
- Provisioning execution history.
- Resource-provisioning stages.

---

## What This Table Does NOT Represent

It is not:

- The tenant record.
- Current tenant status.
- Tenant lifecycle history.
- Application logs in general.
- Infrastructure logs in general.
- Authentication audit history.
- Billing history.
- User activity history.
- Storage-object history.
- Configuration state itself.

The distinction is:

```text
tenants
    ↓
Current tenant state
```

```text
tenant_lifecycle_events
    ↓
Business lifecycle milestones
```

```text
tenant_provisioning_logs
    ↓
Operational provisioning/deployment history
```

---

# 3. Critical Design Principle — What the Entity IS and IS NOT

## The Tenant Provisioning Log IS

- An operational history record.
- Tenant-scoped provisioning metadata.
- A deployment/provisioning trace.
- An operational troubleshooting resource.
- An audit-supporting record.
- A child record associated with the Tenant domain.
- A historical record rather than current configuration.

## The Tenant Provisioning Log IS NOT

- The tenant itself.
- The tenant's current status.
- A replacement for `tenant_status_history`.
- A replacement for `tenant_lifecycle_events`.
- A general-purpose application log.
- A system-wide infrastructure log.
- A deployment platform itself.
- A provisioning workflow definition.
- A tenant configuration record.

---

## Three-Way Separation

This distinction is particularly important:

```text
┌───────────────────────────────┐
│ tenants                       │
│                               │
│ Current state                 │
└───────────────┬───────────────┘
                │
                ▼
        status = active
```

```text
┌───────────────────────────────┐
│ tenant_lifecycle_events       │
│                               │
│ Business lifecycle history    │
└───────────────┬───────────────┘
                │
                ▼
        TenantActivated
```

```text
┌───────────────────────────────┐
│ tenant_provisioning_logs      │
│                               │
│ Operational execution history │
└───────────────┬───────────────┘
                │
                ▼
      DatabaseProvisioning
      StorageProvisioning
      ModuleProvisioning
```

These tables should not be collapsed.

---

# 4. Aggregate Root Analysis — DDD Structure

The Tenant remains the aggregate root.

```text
Tenant
│
├── Tenant Profile
├── Tenant Settings
├── Tenant Modules
├── Tenant Features
├── Tenant Subscription
├── Tenant Integrations
├── Tenant Storage Settings
├── Tenant Backup Policies
├── Tenant Lifecycle Events
└── Tenant Provisioning Logs
```

The provisioning log belongs to the Tenant operational domain.

However, unlike configuration entities, it represents **historical execution records**.

---

## DDD Relationship

```text
Tenant Aggregate Root
        │
        ├───────────────┐
        │               │
        ▼               ▼
Lifecycle Events   Provisioning Logs
        │               │
        ▼               ▼
Business events    Technical execution
```

---

## Why Provisioning Logs Are Not the Aggregate Root

A provisioning operation cannot independently exist as a business tenant.

It exists because:

```text
Tenant
   ↓
Provisioning Operation
```

Therefore the tenant remains the ownership boundary.

---

## Relationship With `tenant_lifecycle_events`

These two tables may contain events relating to the same broad operation but answer different questions.

Example:

```text
tenant_lifecycle_events
    ↓
TenantProvisioningCompleted
```

answers:

> **What business lifecycle milestone occurred?**

While:

```text
tenant_provisioning_logs
    ↓
StorageProvisioning
    ↓
completed
    ↓
duration = ...
```

answers:

> **How did the technical provisioning process execute?**

---

# 5. Business Capabilities Supported

| Capability | Supported |
|---|---|
| Tenant provisioning history | Yes |
| Deployment history | Yes |
| Provisioning attempt tracking | Yes |
| Provisioning failure tracking | Yes |
| Provisioning-stage tracking | Yes |
| Operational troubleshooting | Yes |
| Provisioning analytics | Yes |
| Retry visibility | Yes |
| Provisioning audit support | Yes |
| Current tenant status | No — `tenants` |
| Business lifecycle history | No — `tenant_lifecycle_events` |
| Status transition history | No — `tenant_status_history` |
| General application logging | No |
| Infrastructure monitoring | No |
| Provisioning workflow definition | No |

---

## Operational Troubleshooting

Suppose tenant onboarding appears stuck:

```text
Tenant Status
    ↓
provisioning
```

The provisioning log can reveal:

```text
Database Provisioning       completed
Storage Provisioning        completed
Module Provisioning         completed
Security Provisioning       failed
```

This allows operations teams to identify the failing stage without examining unrelated application logs.

---

## Retry Tracking

A provisioning step may fail and be retried:

```text
Attempt 1 → failed
Attempt 2 → failed
Attempt 3 → completed
```

The log should preserve these attempts rather than overwriting history.

---

# 6. Multi-Tenant / Ownership / Isolation Notes

Every provisioning log belongs to one tenant:

```text
tenant_provisioning_logs.tenant_id
             ↓
          tenants.id
```

---

## Tenant Isolation

Tenant administrators should only see provisioning history belonging to their tenant.

Correct:

```sql
SELECT *
FROM tenant_provisioning_logs
WHERE tenant_id = :authenticated_tenant_id
ORDER BY occurred_at DESC;
```

Incorrect:

```sql
SELECT *
FROM tenant_provisioning_logs;
```

for ordinary tenant-level users.

---

## Platform Operations

Platform-level administrators may require cross-tenant access for:

- Infrastructure operations.
- Provisioning monitoring.
- Incident investigation.
- Deployment dashboards.
- Platform reliability.
- Support.

Such access must be privileged.

---

## Sensitive Information

Provisioning logs may contain infrastructure-related information.

They must therefore not expose:

```text
Passwords
API secrets
Private keys
Database credentials
Access tokens
```

Even if those values were available to the provisioning service.

---

# 7. Lifecycle

The provisioning log itself is historical and therefore does not have a business lifecycle like a configuration table.

Instead, each provisioning operation can have an operational execution lifecycle:

```text
Requested
    ↓
Queued
    ↓
Started
    ↓
Running
    │
    ├───────────────┐
    ▼               ▼
Completed         Failed
                    │
                    ▼
                  Retried
                    │
                    ▼
                  Running
```

---

## Creation

A provisioning record is created when a provisioning operation begins or is queued.

For example:

```text
Tenant Created
      ↓
Provisioning Requested
      ↓
Provisioning Log Created
```

---

## Execution

The record may move through:

```text
queued
running
completed
failed
cancelled
```

These states are **proposed** because the original detailed Table 27 enum specification was not found.

---

## Retry

A failed operation should not necessarily overwrite the original record.

Preferred:

```text
Attempt 1 → failed
Attempt 2 → failed
Attempt 3 → completed
```

This preserves the operational history.

---

## Completion

A successful operation should record:

```text
started_at
completed_at
duration
result
```

where applicable.

---

## Archival

Provisioning logs should generally be retained longer than ordinary application debug logs when they are required for:

- Compliance.
- Support.
- Operational history.
- Tenant lifecycle reconstruction.

Old records may eventually be archived according to platform retention policy.

---

# 8. Proposed Schema

## Table Name

`tenant_provisioning_logs`

## Primary Key Strategy

**UUID**

Each provisioning operation/attempt receives its own stable identifier.

---

## Full Field-by-Field Schema Definition

The exact original Table 27 field list was not found in the surviving source. The following is therefore a **proposed reconstruction**.

| Field Name | Data Type | Key Type | Specification | Reason Field Exists |
|---|---|---|---|---|
| `id` | UUID | PK | `NOT NULL` | Stable identity of the provisioning log record |
| `tenant_id` | UUID | FK → `tenants.id` | `NOT NULL` | Establishes tenant ownership and isolation |
| `operation_id` | UUID | UK/Logical ID | `NOT NULL` | Groups/references a provisioning operation across retries or stages |
| `operation_type` | ENUM | — | `NOT NULL` | Identifies the type of provisioning operation |
| `provisioning_stage` | ENUM | — | `NOT NULL` | Identifies which provisioning stage generated the record |
| `status` | ENUM | — | `NOT NULL` | Records execution outcome/state |
| `attempt_number` | INTEGER | — | `NOT NULL DEFAULT 1`, `CHECK > 0` | Tracks retries for the operation |
| `started_at` | TIMESTAMPTZ | — | `NULL` | Records actual execution start |
| `completed_at` | TIMESTAMPTZ | — | `NULL` | Records execution completion |
| `duration_ms` | BIGINT | — | `NULL`, `CHECK >= 0` | Supports operational performance analysis |
| `message` | TEXT | — | `NULL` | Human-readable operational result/message |
| `error_code` | VARCHAR(100) | — | `NULL` | Stable machine-readable failure category |
| `error_message` | TEXT | — | `NULL` | Diagnostic description of failure |
| `resource_type` | VARCHAR(100) | — | `NULL` | Identifies the type of resource being provisioned |
| `resource_reference` | VARCHAR(255) | — | `NULL` | Identifies the affected resource without exposing secrets |
| `metadata` | JSONB | — | `NULL` | Stores structured non-secret provisioning details |
| `triggered_by` | UUID | FK → `users.id` | `NULL` | Identifies the administrator/user that initiated the operation when applicable |
| `created_at` | TIMESTAMPTZ | — | `NOT NULL` | Records log creation time |

---

## `id`

Stable identity of the provisioning record.

It answers:

```text
Which provisioning execution record is this?
```

---

## `tenant_id`

Establishes ownership:

```text
tenant_provisioning_logs.tenant_id
          ↓
       tenants.id
```

This is mandatory for tenant isolation.

---

## `operation_id`

Groups records belonging to the same logical provisioning operation.

For example:

```text
operation_id = OP-001
```

could contain:

```text
Database Provisioning
Storage Provisioning
Module Provisioning
Security Provisioning
```

This becomes particularly useful when each stage is recorded separately.

---

## `operation_type`

Identifies what overall provisioning operation occurred.

Examples:

```text
tenant_provisioning
tenant_reprovisioning
tenant_deprovisioning
tenant_resource_update
tenant_migration
```

These values are proposed.

---

## `provisioning_stage`

Identifies the stage being executed.

Examples:

```text
database
storage
modules
configuration
security
integrations
webhooks
validation
```

The exact stage catalogue should be standardized by the provisioning subsystem.

---

## `status`

Represents the operational execution state.

---

## `attempt_number`

Allows retries to remain visible.

Example:

```text
operation_id = OP-001

attempt 1 → failed
attempt 2 → failed
attempt 3 → completed
```

This is more useful than overwriting one row repeatedly.

---

## `started_at`

Records when execution actually began.

It is different from:

```text
created_at
```

because a provisioning operation may be queued before it begins.

---

## `completed_at`

Records when execution finished.

It may remain null while:

```text
status = queued
status = running
```

---

## `duration_ms`

Provides direct operational timing.

For example:

```text
Storage provisioning = 4,200 ms
Database provisioning = 18,500 ms
```

This supports:

- Performance analysis.
- SLA monitoring.
- Bottleneck identification.

---

## `message`

Stores a concise human-readable outcome.

Example:

```text
Storage namespace created successfully.
```

---

## `error_code`

Provides a stable machine-readable category.

For example:

```text
STORAGE_PERMISSION_DENIED
DATABASE_CONNECTION_FAILED
MODULE_PROVISIONING_TIMEOUT
```

This is more useful for automation than parsing free-form error text.

---

## `error_message`

Stores diagnostic information appropriate for operational users.

It must not contain secrets.

---

## `resource_type`

Identifies what kind of infrastructure/resource was affected.

Examples:

```text
database
bucket
module
api_client
webhook
configuration
```

---

## `resource_reference`

Identifies the affected resource.

Examples:

```text
bucket identifier
deployment identifier
module code
configuration identifier
```

It must never contain raw credentials.

---

## `metadata`

Allows structured non-secret details without continuously changing the relational schema.

Example:

```json
{
  "provider": "object_storage",
  "region": "ap-south-1",
  "retryable": true
}
```

Secrets must not be stored here.

---

## `triggered_by`

Optional reference to the user who initiated the operation.

It may be null when provisioning is automatic:

```text
System
   ↓
Provisioning
```

rather than:

```text
Administrator
   ↓
Provisioning
```

---

# 9. Enum Definitions

The original Table 27 enum values are unavailable.

The following are **proposed controlled values**.

## `operation_type`

| Value | Description |
|---|---|
| `tenant_provisioning` | Initial tenant provisioning |
| `tenant_reprovisioning` | Re-running provisioning for an existing tenant |
| `tenant_deprovisioning` | Removing tenant infrastructure/resources |
| `tenant_resource_update` | Updating provisioned tenant resources |
| `tenant_migration` | Moving tenant infrastructure/resources |

---

## `provisioning_stage`

| Value | Description |
|---|---|
| `database` | Database/schema/resource provisioning |
| `storage` | Object-storage provisioning |
| `configuration` | Tenant configuration setup |
| `modules` | Application-module provisioning |
| `security` | Tenant security setup |
| `integrations` | Third-party integration provisioning |
| `webhooks` | Webhook/resource setup |
| `validation` | Final provisioning validation |

---

## `status`

| Value | Description |
|---|---|
| `queued` | Operation is waiting to execute |
| `running` | Operation is currently executing |
| `completed` | Operation completed successfully |
| `failed` | Operation failed |
| `cancelled` | Operation was intentionally cancelled |

These are proposed implementation values, not recovered source enums.

---

# 10. Why `operation_id` Exists

`operation_id` is important because one tenant provisioning process may consist of multiple technical stages.

For example:

```text
OP-1001
   │
   ├── Database
   ├── Storage
   ├── Modules
   ├── Security
   └── Validation
```

Without a common operation identifier, it becomes difficult to reconstruct which stages belonged to the same provisioning run.

---

## Retry Example

```text
operation_id = OP-1001

Attempt 1
   └── Storage → failed

Attempt 2
   └── Storage → failed

Attempt 3
   └── Storage → completed
```

The operation identifier groups these attempts while `attempt_number` distinguishes them.

---

## Why Not Use Only `id`?

The `id` identifies one individual log record.

It does not necessarily identify the broader provisioning operation.

Therefore:

```text
id
    ↓
Individual log record

operation_id
    ↓
Logical provisioning operation
```

---

# 11. Candidate Keys

| Key Type | Field(s) | Rationale |
|---|---|---|
| Primary Key | `id` | Stable identity of one provisioning record |
| Logical Candidate | `operation_id + attempt_number + provisioning_stage` | Identifies a specific stage attempt within an operation |

---

## Important Note

Whether:

```text
UNIQUE(operation_id, attempt_number, provisioning_stage)
```

should be enforced physically depends on whether one stage can legitimately emit multiple records during one attempt.

If one stage has exactly one authoritative record per attempt, the constraint is appropriate.

If multiple sub-events are expected, it should not be imposed.

Therefore the uniqueness rule is **proposed**, not source-established.

---

# 12. Constraints

| Constraint | Definition | Reason |
|---|---|---|
| Primary Key | `PK(id)` | Stable log identity |
| Tenant FK | `tenant_id → tenants.id` | Tenant ownership/isolation |
| User FK | `triggered_by → users.id` | Optional initiating-user reference |
| Operation ID | `NOT NULL` | Groups provisioning records |
| Operation Type | `NOT NULL` | Identifies operation |
| Provisioning Stage | `NOT NULL` | Identifies execution stage |
| Status | `NOT NULL` | Execution state required |
| Attempt Number | `NOT NULL`, `DEFAULT 1`, `CHECK > 0` | Valid retry numbering |
| Duration | `CHECK >= 0` | Prevents invalid timing values |
| Completed Timestamp | Nullable | Operations may still be running |
| Error Code | Nullable | Only needed for failures |
| Error Message | Nullable | Only needed when diagnostics exist |
| Metadata | Nullable | Additional structured information |
| Timestamps | `NOT NULL` | Historical ordering |

---

## Conditional Constraints

Recommended domain rules:

```text
status = completed
        →
completed_at IS NOT NULL
```

and:

```text
status = failed
        →
error_code should exist
```

and:

```text
status = running
        →
completed_at IS NULL
```

These should be enforced at the application/domain layer unless the database implementation deliberately encodes them.

---

## No Secret Storage

The following should be explicitly prohibited from:

```text
message
error_message
metadata
resource_reference
```

when they contain:

```text
passwords
API keys
tokens
private keys
credentials
```

---

# 13. Relationships

## Incoming References / Logical Consumers

The provisioning logs are consumed by:

- Tenant Administration.
- Provisioning Service.
- Infrastructure Orchestrator.
- Operations.
- Support.
- Monitoring.
- Compliance.
- Audit.
- Deployment dashboards.

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

The user reference is nullable because automated provisioning may have no human initiator.

---

## Relationship With `tenant_lifecycle_events`

The two tables are related but intentionally separate:

```text
tenant_lifecycle_events
        ↓
Business milestone
```

```text
tenant_provisioning_logs
        ↓
Technical execution
```

For example:

```text
TenantProvisioningCompleted
```

may be generated after:

```text
Database → completed
Storage → completed
Modules → completed
Security → completed
Validation → completed
```

---

## Relationship With `tenant_storage_settings`

Storage configuration can be the desired state:

```text
tenant_storage_settings
        ↓
Desired storage configuration
```

while provisioning logs show:

```text
tenant_provisioning_logs
        ↓
Actual provisioning execution
```

---

## Relationship With `tenant_modules`

Similarly:

```text
tenant_modules
        ↓
Module entitlement/provisioning state
```

while:

```text
tenant_provisioning_logs
        ↓
Technical execution history
```

---

# 14. Cardinality Analysis

| Relationship | Expected Cardinality |
|---|---:|
| Tenant → Provisioning Logs | 0–N |
| Provisioning Log → Tenant | Exactly 1 |
| Operation → Log Records | 1–N |
| User → Triggered Logs | 0–N |
| Provisioning Log → User | 0–1 |
| Provisioning Stage → Logs | 0–N |
| Status → Logs | 0–N |

---

## Expected Scale

Provisioning logs grow faster than static configuration tables.

A reasonable planning model is:

```text
Tenants
   ×
Provisioning Operations
   ×
Provisioning Stages
   ×
Retry Attempts
```

For example:

```text
100,000 tenants
× 3 major provisioning operations
× 8 stages
× 1.5 average attempts
```

can produce millions of records.

Therefore the table should be treated as a **historical/log table**, not a small configuration table.

---

## Growth Characteristics

Growth can come from:

- Initial provisioning.
- Reprovisioning.
- Resource changes.
- Provider migration.
- Module provisioning.
- Tenant migration.
- Deprovisioning.
- Retries.

This makes retention and indexing important.

---

# 15. Query Patterns

## Retrieve Recent Provisioning History

```sql
SELECT *
FROM tenant_provisioning_logs
WHERE tenant_id = :tenant_id
ORDER BY created_at DESC
LIMIT 50;
```

This is the primary operational query.

---

## Retrieve One Provisioning Operation

```sql
SELECT *
FROM tenant_provisioning_logs
WHERE tenant_id = :tenant_id
AND operation_id = :operation_id
ORDER BY created_at;
```

This reconstructs one provisioning run.

---

## Find Failed Provisioning Operations

```sql
SELECT *
FROM tenant_provisioning_logs
WHERE tenant_id = :tenant_id
AND status = 'failed'
ORDER BY created_at DESC;
```

---

## Find Currently Running Operations

```sql
SELECT *
FROM tenant_provisioning_logs
WHERE status = 'running'
ORDER BY started_at;
```

This query should normally be restricted to privileged platform operations.

---

## Find Failed Storage Provisioning

```sql
SELECT *
FROM tenant_provisioning_logs
WHERE provisioning_stage = 'storage'
AND status = 'failed'
ORDER BY created_at DESC;
```

---

## Find Slow Provisioning Operations

```sql
SELECT *
FROM tenant_provisioning_logs
WHERE duration_ms > :threshold
ORDER BY duration_ms DESC;
```

---

## Provisioning Failure Analytics

```sql
SELECT
    error_code,
    COUNT(*) AS failure_count
FROM tenant_provisioning_logs
WHERE status = 'failed'
GROUP BY error_code
ORDER BY failure_count DESC;
```

---

## Average Provisioning Duration

```sql
SELECT
    provisioning_stage,
    AVG(duration_ms) AS avg_duration_ms
FROM tenant_provisioning_logs
WHERE status = 'completed'
GROUP BY provisioning_stage;
```

---

## Retry Analysis

```sql
SELECT
    provisioning_stage,
    MAX(attempt_number) AS max_attempts
FROM tenant_provisioning_logs
GROUP BY provisioning_stage
ORDER BY max_attempts DESC;
```

---

# 16. Index Strategy

Recommended indexes:

| Index | Purpose |
|---|---|
| PK(`id`) | Direct record lookup |
| INDEX(`tenant_id`, `created_at`) | Tenant provisioning timeline |
| INDEX(`operation_id`) | Operation reconstruction |
| INDEX(`status`, `created_at`) | Operational failure/running queries |
| INDEX(`provisioning_stage`, `status`) | Stage-specific operations |
| INDEX(`error_code`) | Failure analytics |
| INDEX(`triggered_by`) | Administrative activity analysis |

---

## Most Important Index

```sql
INDEX(tenant_id, created_at)
```

This supports:

```sql
SELECT *
FROM tenant_provisioning_logs
WHERE tenant_id = :tenant_id
ORDER BY created_at DESC;
```

---

## Operation Index

```sql
INDEX(operation_id)
```

allows all stages/attempts of one provisioning run to be retrieved efficiently.

---

## Time-Based Indexing

Because this is a historical log table, time-based access patterns are expected.

The broader database design guidance recommends indexes containing `tenant_id` for tenant-selective queries and time-based partitioning for large log/event tables.

Therefore, if this table reaches sufficiently large scale, monthly or other time-range partitioning should be considered.

---

## Partitioning

Potential strategy:

```text
tenant_provisioning_logs
        │
        ├── 2026-01
        ├── 2026-02
        ├── 2026-03
        ├── ...
        └── 2027-...
```

Partitioning should be introduced based on actual volume and retention requirements rather than prematurely.

---

# 17. Read / Write Characteristics

| Operation | Volume | Notes |
|---|---|---|
| Reads | Moderate–High | Operations/support frequently inspect recent provisioning |
| Writes | Moderate | Each provisioning stage can generate records |
| Updates | Low | Prefer append-oriented historical records |
| Deletes | Low | Archive according to retention policy |

---

## Writes — Moderate

Unlike configuration tables:

```text
tenant_storage_settings
tenant_email_settings
```

provisioning logs can generate multiple records during one provisioning process.

For example:

```text
One Tenant Provisioning
    ↓
8 stages
    ↓
8+ records
```

Retries increase this further.

---

## Updates — Low

A log may transition:

```text
queued
   ↓
running
   ↓
completed
```

but historical log design should minimize destructive updates.

---

## Append-Oriented Design

Where practical:

```text
Event / Attempt 1 → append
Event / Attempt 2 → append
Event / Attempt 3 → append
```

is preferable to repeatedly rewriting historical records.

---

## Deletes — Low

Retention should be policy-driven.

Operationally useful records may need to survive long enough to support:

- Incident investigation.
- Tenant support.
- Compliance.
- Deployment history.
- Root-cause analysis.

---

# 18. Caching Strategy

Caching is **not a primary requirement** for this table.

Provisioning history is fundamentally historical data rather than hot configuration.

---

## Why Not Cache Entire History?

A tenant may have:

```text
hundreds/thousands
```

of historical records.

Caching the entire dataset would waste memory.

---

## Recommended Approach

Cache only small operational summaries if required.

For example:

```text
tenant-provisioning-status:{tenant_id}
```

could represent:

```text
current_operation
current_stage
current_status
last_failure
```

---

## Example

```text
tenant-provisioning-status:abc123

{
  "operation_id": "...",
  "stage": "storage",
  "status": "running"
}
```

This is a **derived operational cache**, not the source of truth.

---

## Database Remains Authoritative

```text
PostgreSQL
     ↓
Provisioning History Source of Truth

Redis
     ↓
Optional Current-State Summary
```

---

## Cache Invalidation

When a provisioning event changes state:

```text
Provisioning Status Changed
        ↓
Update / invalidate
tenant-provisioning-status:{tenant_id}
```

---

# 19. Security Considerations

Provisioning logs are **highly sensitive operational records**.

They may reveal:

```text
Infrastructure topology
Resource identifiers
Deployment details
Provider information
Failure details
Operational behavior
```

---

## 1. Tenant Isolation

Tenant users must only access their own provisioning history.

---

## 2. Platform-Operator Access

Detailed provisioning information may require elevated permissions.

A normal tenant administrator may only need:

```text
Provisioning status
Failure reason
Timestamp
```

while platform engineers may require:

```text
Detailed stage
Resource reference
Error code
Execution metadata
```

---

## 3. Secret Redaction

Never store:

```text
password
API key
token
private key
credential
```

in log messages or metadata.

---

## 4. Error Sanitization

External provider errors may accidentally include secrets.

For example:

```text
connection failed using password=...
```

must be sanitized before being persisted.

---

## 5. RBAC

Recommended access levels:

```text
Tenant Administrator
    ↓
Own tenant provisioning status/history

Platform Operations
    ↓
Cross-tenant operational access

Security / Compliance
    ↓
Audited privileged access
```

---

## 6. Audit Access

Reading highly sensitive provisioning information may itself be auditable for privileged operators.

---

## 7. Retention

Retention must follow:

- Compliance requirements.
- Operational requirements.
- Tenant contractual requirements.
- Security policies.

---

# 20. Audit Requirements

Provisioning logs themselves are already historical records, but important provisioning actions should also generate audit events.

The following are **recommended events**, not source-recovered event definitions:

| Event | Trigger | Purpose |
|---|---|---|
| `TenantProvisioningStarted` | Provisioning begins | Establish execution start |
| `TenantProvisioningCompleted` | Entire provisioning succeeds | Establish successful provisioning |
| `TenantProvisioningFailed` | Provisioning fails | Record failure |
| `TenantProvisioningRetried` | Failed operation retried | Track retry behavior |
| `TenantProvisioningCancelled` | Operation cancelled | Record administrative cancellation |
| `TenantProvisioningStageCompleted` | Individual stage succeeds | Track stage progression |
| `TenantProvisioningStageFailed` | Individual stage fails | Track stage failure |
| `TenantDeprovisioningStarted` | Resource removal begins | Record deprovisioning |
| `TenantDeprovisioningCompleted` | Resource removal succeeds | Record completion |

---

## Audit Payload

Recommended:

```text
tenant_id
operation_id
provisioning_stage
status
actor_id
timestamp
error_code
```

Never include raw credentials.

---

# 21. Event Producers / Event Consumers

## Producers

Potential producers include:

- Tenant Provisioning Service.
- Infrastructure Orchestrator.
- Storage Provisioner.
- Database Provisioner.
- Module Provisioner.
- Integration Provisioner.
- Security Provisioner.

---

## Producer Flow

```text
Tenant Created
      ↓
Provisioning Orchestrator
      ↓
Provisioning Stage
      ↓
tenant_provisioning_logs
      ↓
Provisioning Event
```

---

## Consumers

Logical consumers include:

- Tenant Administration.
- Operations Dashboard.
- Monitoring.
- Support.
- Compliance.
- Audit.
- Notification Service.
- Incident Management.

---

## Full Provisioning Flow

```text
┌──────────────────────┐
│ Tenant Created       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Provisioning         │
│ Orchestrator         │
└──────────┬───────────┘
           │
           ▼
      ┌───────────┐
      │ Database  │
      └─────┬─────┘
            │
            ▼
      ┌───────────┐
      │ Storage   │
      └─────┬─────┘
            │
            ▼
      ┌───────────┐
      │ Modules   │
      └─────┬─────┘
            │
            ▼
      ┌───────────┐
      │ Security  │
      └─────┬─────┘
            │
            ▼
      ┌───────────┐
      │ Validate  │
      └─────┬─────┘
            │
            ▼
        COMPLETED
```

At each stage:

```text
Provisioning Stage
       ↓
tenant_provisioning_logs
       ↓
Operational Event
```

---

# 22. Alternative Designs Considered

| Option | Description | Verdict |
|---|---|---|
| A | Store provisioning history in `tenant_lifecycle_events` | **Rejected** |
| B | Store provisioning state only in `tenants` | **Rejected** |
| C | Use general application logs | **Rejected** |
| D | Use infrastructure logs only | **Rejected** |
| E | Dedicated `tenant_provisioning_logs` table | **Chosen** |
| F | Store one mutable provisioning record per tenant | **Rejected** |

---

## Option A — Use `tenant_lifecycle_events`

Rejected because lifecycle events and provisioning execution have different purposes.

```text
Lifecycle
    ↓
Business milestone
```

```text
Provisioning
    ↓
Technical execution
```

Combining them would produce a vague event history containing incompatible levels of detail.

---

## Option B — Store Only in `tenants`

Rejected because a single current state cannot explain:

```text
Which step failed?
How many retries?
How long did provisioning take?
What happened previously?
```

---

## Option C — General Application Logs

Rejected because application logs are:

- Broad.
- Operationally noisy.
- Not necessarily tenant-domain structured.
- Often subject to different retention policies.
- Not appropriate as a business database history.

---

## Option D — Infrastructure Logs Only

Rejected because infrastructure logs may know that:

```text
bucket creation failed
```

but may not know the full business context:

```text
Tenant
Operation
Provisioning Stage
Attempt
Business provisioning workflow
```

The provisioning table provides that business context.

---

## Option E — Dedicated `tenant_provisioning_logs`

### Chosen

It provides:

- Tenant ownership.
- Structured provisioning history.
- Stage tracking.
- Retry tracking.
- Failure analysis.
- Operational queries.
- Auditability.
- Clear separation from tenant lifecycle state.

---

## Option F — One Mutable Record Per Tenant

Rejected because it would lose historical attempts.

For example:

```text
Attempt 1 → failed
Attempt 2 → failed
Attempt 3 → completed
```

should remain reconstructable.

A historical log must not simply become:

```text
status = completed
```

with no evidence of earlier failures.

---

# 23. Final Design Assessment

Because the original Table 27 detailed assessment was not found, this is a **proposed architectural assessment**.

| Attribute | Rating |
|---|---|
| Complexity | **Medium** |
| Read Volume | **Moderate–High** |
| Write Volume | **Moderate** |
| Security Importance | **High** |
| Business Criticality | **High** |
| Historical Growth | **High** |
| Scalability | **Excellent with time-based management** |
| Recommended Status | **Core Tenant Operational History Table** |

---

# Overall Assessment

`tenant_provisioning_logs` provides the **operational execution history of tenant provisioning and deployment**.

Its architectural position is:

```text
                         TENANT
                            │
                            │ owns
                            ▼
                ┌──────────────────────────┐
                │ tenant_provisioning_logs │
                ├──────────────────────────┤
                │ operation_id             │
                │ operation_type           │
                │ provisioning_stage       │
                │ status                   │
                │ attempt_number           │
                │ started_at               │
                │ completed_at             │
                │ duration_ms              │
                │ error_code               │
                │ resource_type            │
                │ resource_reference       │
                │ metadata                 │
                └────────────┬─────────────┘
                             │
                             ▼
                  PROVISIONING ORCHESTRATOR
                             │
             ┌───────────────┼───────────────┐
             ▼               ▼               ▼
          Database        Storage          Modules
             │               │               │
             └───────────────┼───────────────┘
                             ▼
                         Validation
                             │
                             ▼
                         Tenant Ready
```

---

# Relationship With the Other Tenant History Tables

The final part of Module 1 has an important historical separation:

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
Business lifecycle milestones
```

```text
tenant_provisioning_logs
   ↓
Technical provisioning/deployment execution
```

These four concepts should remain separate.

---

## Example: Tenant Activation

A single tenant activation could generate:

### `tenants`

```text
status = active
```

### `tenant_status_history`

```text
provisioning → active
```

### `tenant_lifecycle_events`

```text
TenantActivated
```

### `tenant_provisioning_logs`

```text
DatabaseProvisioning     completed
StorageProvisioning      completed
ModuleProvisioning       completed
SecurityProvisioning     completed
Validation               completed
```

That separation provides substantially better architectural clarity than putting all four concepts into one event table.

---

# Provisioning Lifecycle

```text
                    TENANT CREATED
                         │
                         ▼
               PROVISIONING REQUESTED
                         │
                         ▼
                    OPERATION ID
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
        Database                  Storage
        Provisioning              Provisioning
             │                       │
             └───────────┬───────────┘
                         ▼
                     Modules
                   Provisioning
                         │
                         ▼
                     Security
                   Provisioning
                         │
                         ▼
                     Validation
                         │
                 ┌───────┴───────┐
                 ▼               ▼
              FAILED          COMPLETED
                 │               │
                 ▼               ▼
              RETRY          TENANT READY
                 │
                 └───────→ RETRY
```

Every meaningful technical stage can produce a corresponding provisioning log record.

---

# Critical Production Invariants

1. Every provisioning log belongs to exactly one tenant.
2. `tenant_id` references `tenants.id`.
3. Provisioning history must remain tenant-isolated.
4. `operation_id` groups records belonging to one logical provisioning operation.
5. `attempt_number` distinguishes retries.
6. Historical provisioning attempts must not be silently overwritten.
7. Provisioning logs represent technical execution, not current tenant state.
8. Provisioning logs do not replace `tenant_status_history`.
9. Provisioning logs do not replace `tenant_lifecycle_events`.
10. Provisioning logs do not replace general infrastructure logs.
11. Provisioning logs do not replace application logs.
12. Provisioning stages should be explicitly identifiable.
13. Provisioning failures should have machine-readable error categories where possible.
14. Secrets must never be persisted in provisioning messages or metadata.
15. Resource references must not expose sensitive credentials.
16. Automated provisioning may have `triggered_by = NULL`.
17. Privileged platform operators may require cross-tenant access.
18. Tenant administrators should only see their own provisioning history.
19. Provisioning history should be append-oriented where practical.
20. Retry attempts should remain reconstructable.
21. `created_at` must provide deterministic chronological ordering.
22. Large historical volumes should eventually be managed using retention and/or time-based partitioning.
23. The tenant configuration tables represent desired state; provisioning logs represent execution history.
24. Changing a configuration row does not by itself prove successful infrastructure provisioning.
25. A successful provisioning log does not replace verification of the actual infrastructure state.
26. Provisioning completion should occur only after required validation succeeds.
27. Provisioning operations should be idempotent where practical so retries do not create duplicate infrastructure.
28. Deprovisioning must be handled as a controlled operation rather than simply deleting the log.
29. The exact original Table 27 field list, enums, indexes, lifecycle, and event definitions were not available in the surviving source.
30. Proposed implementation decisions must remain clearly distinguishable from source-derived requirements.

---

## Source Integrity Note

The source inventory explicitly establishes:

```text
27 tenant_provisioning_logs
```

with the purpose:

```text
Tenant provisioning and deployment history
```

within Module 1 — Tenant Management.

The module is the root ownership domain for InsureIQ, and the source lists `tenant_provisioning_logs` alongside tenant lifecycle, status, configuration, storage, backup, integration, and communication tables.

The surviving source material does **not** provide the original detailed physical Table 27 schema.

Therefore:

```text
SOURCE
  │
  ├── Table 27 exists
  ├── Name = tenant_provisioning_logs
  ├── Purpose = tenant provisioning and deployment history
  └── Tenant Management domain
          │
          ▼
PROPOSED RECONSTRUCTION
  │
  ├── Physical fields
  ├── Constraints
  ├── Enums
  ├── Indexes
  ├── Operational lifecycle
  ├── Caching
  ├── Security implementation
  └── Audit/event model
```

This distinction is intentional. It prevents the content degradation problem from becoming a **fabrication problem**: missing source detail is reconstructed where useful, but is never mislabeled as recovered source material.

**Step 3 — Table 27 is complete. No `.md` file has been created in this response.**
