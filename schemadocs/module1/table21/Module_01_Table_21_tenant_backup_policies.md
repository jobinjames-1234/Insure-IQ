# Table 21 — `tenant_backup_policies`

## 1. Why This Table Exists

The `tenant_backup_policies` table stores tenant-specific backup and disaster-recovery policy.

It exists so each tenant can have an explicit policy governing:

- Backup frequency
- Backup type
- Retention
- Replication
- Encryption
- Recovery Point Objective (RPO)
- Recovery Time Objective (RTO)

The table is therefore a policy/configuration boundary between the Tenant domain and the actual backup/disaster-recovery infrastructure.

It solves the problem of forcing every tenant to use one global backup policy. Different insurance organizations can have different regulatory, contractual, operational, and resilience requirements.

The table represents the desired policy. It does not represent individual backup files, backup executions, restore jobs, or replication jobs.

---

## 2. Business Definition

A **Tenant Backup Policy** defines how tenant data should be backed up, retained, replicated, encrypted, and recovered.

Examples include:

- Daily backup
- Hourly backup
- Continuous backup
- Weekly archive

A tenant may therefore have a configuration such as:

| Policy Attribute | Example |
|---|---|
| Backup frequency | `daily` |
| Backup type | `full` |
| Retention | `90 days` |
| Replication | Enabled |
| Encryption | Enabled |
| RPO | `60 minutes` |
| RTO | `120 minutes` |

The policy is consumed by backup, storage, disaster-recovery, infrastructure, and compliance services.

---

## 3. Critical Design Principle — What the Entity IS and IS NOT

### The Tenant Backup Policy IS

- A tenant-wide operational policy.
- A backup scheduling policy.
- A retention policy.
- A disaster-recovery configuration.
- A recovery-objective policy.
- A replication policy.
- An encryption-policy declaration.
- A child of the Tenant aggregate.

### The Tenant Backup Policy IS NOT

- A backup file.
- A backup snapshot.
- A restore job.
- A replication job.
- A storage bucket.
- A database snapshot.
- A disaster-recovery server.
- A backup execution log.
- An encryption-key store.

The architectural distinction is:

```text
tenant_backup_policies
        ↓
Desired backup / recovery policy
        ↓
Backup & DR Infrastructure
        ↓
Actual backups, replication and restores
```

The policy table must remain declarative.

---

## 4. Aggregate Root Analysis — DDD Structure

```text
Tenant
├── Backup Policies
├── Data Regions
├── Storage Settings
└── Lifecycle Events
```

The `Tenant` remains the aggregate root.

```text
Tenant Aggregate Root
        │
        └── TenantBackupPolicy
```

Ownership:

```text
tenant_backup_policies.tenant_id
            ↓
         tenants.id
```

### One-to-One Configuration

Each tenant owns one active backup policy.

```text
Tenant A
    │
    └── Backup Policy A

Tenant B
    │
    └── Backup Policy B
```

The current model therefore enforces:

```text
ONE TENANT
    ↓
ONE ACTIVE BACKUP POLICY
```

through:

```sql
UNIQUE(tenant_id)
```

### Relationship With Data Regions

```text
tenant_data_regions
        ↓
Where tenant data resides

tenant_backup_policies
        ↓
How tenant data is protected and recovered
```

These are separate responsibilities and should remain separate entities.

### Relationship With Storage Settings

```text
Storage Settings
        ↓
Storage configuration

Backup Policy
        ↓
Backup / retention / recovery behavior
```

Backup policy can influence storage consumption without becoming the storage-configuration table.

---

## 5. Business Capabilities Supported

| Capability | Supported |
|---|---|
| Automated backups | Yes |
| Backup scheduling | Yes |
| Disaster recovery | Yes |
| Backup retention | Yes |
| Geo-replication | Yes |
| Backup encryption | Yes |
| Compliance management | Yes |

### Automated Backups

The policy provides the configuration required by automated backup infrastructure.

### Backup Scheduling

`backup_frequency` defines the intended backup cadence.

### Disaster Recovery

RPO and RTO establish recovery expectations.

### Backup Retention

`retention_days` defines the intended retention period.

### Geo-Replication

`replication_enabled` indicates whether replication is part of the tenant policy.

### Backup Encryption

`encryption_enabled` defines whether encrypted backup protection is required.

The field does not store encryption keys.

### Compliance Management

The Compliance Engine can evaluate:

```text
Retention
Encryption
Replication
RPO
RTO
```

against applicable requirements.

---

## 6. Multi-Tenant / Ownership / Isolation Notes

Each tenant owns one active backup policy.

```text
tenant_backup_policies.tenant_id
              ↓
           tenants.id
```

Tenant isolation is critical.

For example:

```text
Tenant A
    ↓
RPO = 15 minutes

Tenant B
    ↓
RPO = 4 hours
```

must remain independent.

A tenant's backup policy must never be applied to another tenant's infrastructure.

### Correct Access Pattern

```sql
SELECT *
FROM tenant_backup_policies
WHERE tenant_id = :authenticated_tenant_id;
```

The tenant identifier should be derived from the authenticated security context rather than trusted from arbitrary client input.

### Consequences of Cross-Tenant Policy Leakage

A cross-tenant error could produce:

- Incorrect retention.
- Incorrect RPO.
- Incorrect RTO.
- Incorrect replication.
- Incorrect encryption behavior.
- Regulatory exposure.
- Data-loss exposure.

Tenant isolation is therefore a security and compliance invariant.

---

## 7. Lifecycle

### Creation — Policy Created

During tenant provisioning:

```text
Tenant Created
      ↓
Default Backup Policy
      ↓
tenant_backup_policies
```

The tenant should receive a valid backup posture before normal operation.

### Growth — Policy Updated

Backup requirements can become more stringent.

Example:

```text
daily
  ↓
hourly
```

or:

```text
30-day retention
  ↓
90-day retention
```

### Modification — Recovery Objectives Adjusted

RPO and RTO can change as business criticality changes.

Example:

```text
RPO:
60 minutes
    ↓
15 minutes
```

or:

```text
RTO:
240 minutes
    ↓
60 minutes
```

These changes may require infrastructure changes and approval.

### Archival — Policy Retained

The policy should be retained for compliance and historical reconstruction.

The current table represents the current policy. Historical changes should be preserved through audit/event mechanisms.

---

## 8. Proposed Schema

### Primary Key Strategy

The primary key is a UUID.

### Full Field-by-Field Schema Definition

| Field Name | Data Type | Key Type | Specification | Reason Field Exists |
|---|---|---|---|---|
| `id` | UUID | PK | `NOT NULL` | Stable unique identity of the tenant backup-policy record |
| `tenant_id` | UUID | FK → `tenants.id`, UK | `NOT NULL, UNIQUE` | Establishes tenant ownership and enforces one active backup policy per tenant |
| `backup_frequency` | ENUM | — | `NOT NULL` | Defines how frequently backups should be created |
| `backup_type` | ENUM | — | `NOT NULL` | Defines the tenant's backup strategy/type |
| `retention_days` | INTEGER | — | `NOT NULL, CHECK > 0` | Defines how long backups should be retained |
| `replication_enabled` | BOOLEAN | — | `NOT NULL` | Determines whether backup data should be replicated |
| `encryption_enabled` | BOOLEAN | — | `NOT NULL` | Determines whether backup protection requires encryption |
| `recovery_point_objective_minutes` | INTEGER | — | `NOT NULL, CHECK > 0` | Defines the maximum acceptable data-loss interval |
| `recovery_time_objective_minutes` | INTEGER | — | `NOT NULL, CHECK > 0` | Defines the maximum acceptable recovery duration |
| `policy_notes` | TEXT | — | `NULL` | Stores additional human-readable backup/recovery context |
| `created_at` | TIMESTAMPTZ | — | `NOT NULL` | Records policy creation |
| `updated_at` | TIMESTAMPTZ | — | `NOT NULL` | Records the latest policy modification |

### `id`

Provides technical row identity.

```text
id
↓
Which policy record is this?
```

### `tenant_id`

Provides ownership and the one-policy-per-tenant business key.

```text
tenant_id
↓
Who owns this policy?
```

### `backup_frequency`

Defines the intended backup cadence.

### `backup_type`

Defines the backup strategy.

### `retention_days`

Defines the intended retention period and must be greater than zero.

### `replication_enabled`

Represents replication policy, not replication-job status.

### `encryption_enabled`

Represents encryption policy. It must never contain encryption keys.

### `recovery_point_objective_minutes`

Defines the maximum acceptable amount of data loss in minutes.

### `recovery_time_objective_minutes`

Defines the maximum acceptable recovery duration in minutes.

### `policy_notes`

Provides optional human-readable context and must not replace structured policy fields.

### `created_at`

Records creation time.

### `updated_at`

Records the most recent modification.

---

## 9. Enum Definitions

### `backup_frequency`

| Value | Description |
|---|---|
| `continuous` | Continuous or near-continuous backup protection policy |
| `hourly` | Hourly backup policy |
| `daily` | Daily backup policy |
| `weekly` | Weekly backup policy |
| `monthly` | Monthly backup policy |

The exact scheduling semantics are implemented by the Backup Scheduler.

### `backup_type`

| Value | Description |
|---|---|
| `full` | Full backup strategy |
| `incremental` | Backup of changes since the applicable previous backup |
| `differential` | Backup of changes relative to the applicable full backup |
| `snapshot` | Snapshot-based backup strategy |

The exact infrastructure behavior for each type belongs to the backup implementation.

---

## 10. Why `recovery_point_objective_minutes` Exists

This field defines the maximum acceptable amount of data loss in minutes.

RPO is not simply another name for backup frequency.

```text
backup_frequency
        ↓
Configured backup cadence

RPO
        ↓
Business recovery requirement
```

For example:

```text
Backup frequency = hourly
RPO = 60 minutes
```

expresses a recovery target rather than merely describing the scheduler.

RPO can affect:

- Backup frequency.
- Replication strategy.
- Infrastructure cost.
- Disaster-recovery design.
- Compliance.

The infrastructure layer must verify that the actual protection strategy can satisfy the configured RPO.

---

## 11. Candidate Keys

| Key Type | Field | Rationale |
|---|---|---|
| Primary Key | `id` | Technical row identity |
| Candidate Key | `tenant_id` | One active backup policy per tenant |

`backup_frequency`, `backup_type`, and other policy fields are not candidate keys because many tenants can legitimately share the same values.

---

## 12. Constraints

| Constraint | Definition | Reason |
|---|---|---|
| Primary Key | `PK(id)` | Stable policy identity |
| Tenant FK | `tenant_id → tenants.id` | Establishes ownership |
| One Policy per Tenant | `UNIQUE(tenant_id)` | Prevents multiple current policies |
| Retention Validation | `CHECK(retention_days > 0)` | Prevents invalid retention periods |
| RPO Validation | `CHECK(recovery_point_objective_minutes > 0)` | Prevents invalid recovery targets |
| RTO Validation | `CHECK(recovery_time_objective_minutes > 0)` | Prevents invalid recovery targets |

The source does not define additional maximum-value checks or cross-field checks such as:

```text
RPO <= backup interval
replication required for a particular RPO
encryption required for a particular compliance class
```

Those should remain business/infrastructure validation rules unless formally promoted to database constraints.

---

## 13. Relationships

### Incoming References / Logical Consumers

- Backup Scheduler
- Disaster Recovery Service
- Storage Manager
- Compliance Engine
- Infrastructure Orchestrator
- Audit Service

### Outgoing References

```text
tenant_id → tenants.id
```

### Backup Scheduler

Consumes:

```text
backup_frequency
backup_type
```

to determine backup scheduling and strategy.

### Disaster Recovery Service

Consumes:

```text
recovery_point_objective_minutes
recovery_time_objective_minutes
replication_enabled
```

to coordinate recovery behavior.

### Storage Manager

Consumes:

```text
retention_days
backup_type
```

for capacity and retention planning.

### Compliance Engine

Evaluates whether the configured policy meets applicable requirements.

### Infrastructure Orchestrator

Translates policy changes into infrastructure configuration.

### Audit Service

Consumes policy-change events for historical accountability.

---

## 14. Cardinality Analysis

The current model is:

> One backup policy per tenant.

| Relationship | Expected Cardinality |
|---|---:|
| Tenant → Backup Policy | Exactly 1 active policy |
| Backup Policy → Tenant | Exactly 1 |
| Backup Frequency → Tenants | 0–N |
| Backup Type → Tenants | 0–N |
| Compliance Engine → Policies | Many |
| Backup Scheduler → Policies | Many |

The table scales approximately with tenant count.

For example:

```text
100,000 tenants
≈
100,000 current backup-policy rows
```

It should not grow with every backup execution. Backup execution history belongs to operational backup infrastructure.

---

## 15. Query Patterns

### Retrieve Tenant Backup Policy

```sql
SELECT *
FROM tenant_backup_policies
WHERE tenant_id = :tenant_id;
```

This is the primary runtime lookup.

### Find Tenants With Daily Backups

```sql
SELECT *
FROM tenant_backup_policies
WHERE backup_frequency = 'daily';
```

### Find Tenants With Strict RPO Targets

```sql
SELECT tenant_id,
       recovery_point_objective_minutes
FROM tenant_backup_policies
WHERE recovery_point_objective_minutes <= :rpo_threshold;
```

### Find Replicated Policies

```sql
SELECT tenant_id,
       backup_frequency,
       backup_type
FROM tenant_backup_policies
WHERE replication_enabled = TRUE;
```

### Find Encryption-Enabled Policies

```sql
SELECT tenant_id
FROM tenant_backup_policies
WHERE encryption_enabled = TRUE;
```

### Find Long-Retention Policies

```sql
SELECT tenant_id,
       retention_days
FROM tenant_backup_policies
WHERE retention_days >= :retention_threshold
ORDER BY retention_days DESC;
```

---

## 16. Index Strategy

The source specifies:

| Index | Purpose |
|---|---|
| PK(`id`) | Primary row lookup |
| UNIQUE(`tenant_id`) | Tenant lookup and one-policy enforcement |
| INDEX(`backup_frequency`) | Frequency-based operational reporting |
| INDEX(`backup_type`) | Backup-strategy reporting |
| INDEX(`replication_enabled`) | Replication-policy reporting |

### Primary Key

```sql
PRIMARY KEY (id)
```

### Tenant Unique Index

```sql
UNIQUE(tenant_id)
```

This both enforces the business invariant and optimizes the dominant lookup.

### Backup Frequency

```sql
INDEX(backup_frequency)
```

Supports queries for daily/hourly/etc. policies.

### Backup Type

```sql
INDEX(backup_type)
```

Supports operational and compliance reporting.

### Replication

```sql
INDEX(replication_enabled)
```

Supports replication-policy reporting.

The source does not specify indexes on RPO/RTO. Such indexes should be workload-driven rather than added automatically.

---

## 17. Read / Write Characteristics

| Operation | Volume | Notes |
|---|---|---|
| Reads | High | Backup/DR services repeatedly resolve tenant policy |
| Writes | Very Low | Policy changes are comparatively rare |
| Updates | Very Low | Mostly administrative configuration changes |
| Deletes | Extremely Rare | Policy should generally be retained |

Typical runtime flow:

```text
Backup Operation
      ↓
Resolve Tenant
      ↓
Load Backup Policy
      ↓
Determine Backup / Recovery Behavior
```

Because reads are high and writes are very low, caching is appropriate.

---

## 18. Caching Strategy

Redis key:

```text
tenant-backup-policy:{tenant_id}
```

Example:

```text
tenant-backup-policy:abc123
```

The tenant ID must be part of the cache key to prevent cross-tenant cache collisions.

### Cached Data

The cache can contain the current policy values:

```text
backup_frequency
backup_type
retention_days
replication_enabled
encryption_enabled
recovery_point_objective_minutes
recovery_time_objective_minutes
policy_notes
```

### Cache Invalidation

When the policy changes:

```text
Database Update
       ↓
Transaction Commit
       ↓
TenantBackupPolicyUpdated
       ↓
Invalidate Redis
```

This is particularly important for changes such as:

```text
RPO:
60 minutes → 15 minutes
```

The old value must not remain active indefinitely.

### Source of Truth

```text
PostgreSQL
    ↓
Authoritative Policy

Redis
    ↓
Performance Cache
```

Redis must never become the authoritative backup policy.

---

## 19. Security Considerations

Security controls include:

- RBAC.
- Tenant isolation.
- Audit logging.
- Encryption-policy enforcement.
- Approval workflows.
- Compliance validation.

### RBAC

Only appropriately authorized administrators should modify backup policy.

Particularly sensitive changes include:

```text
retention_days
replication_enabled
encryption_enabled
recovery_point_objective_minutes
recovery_time_objective_minutes
```

### Tenant Isolation

A tenant must never read or modify another tenant's backup policy.

### Audit Logging

Policy changes must be auditable.

### Encryption Policy

`encryption_enabled` defines policy but does not store keys.

Key material belongs to dedicated key-management infrastructure.

### Approval Workflows

Significant changes to resilience posture may require approval.

For example:

```text
RPO:
15 minutes
    ↓
24 hours
```

can materially weaken recovery capability.

### Compliance Validation

The Compliance Engine can compare configured policy with required controls.

### Policy Versus Actual State

The table does not prove that:

- Backups actually ran.
- Backups are encrypted.
- Replication is healthy.
- RPO is being achieved.
- RTO is achievable.

Those are operational compliance conditions.

---

## 20. Audit Requirements

| Event | Trigger | Purpose |
|---|---|---|
| `TenantBackupPolicyCreated` | Initial policy created | Establish policy provenance |
| `TenantBackupPolicyUpdated` | Backup configuration changed | Track general policy modification |
| `TenantBackupFrequencyChanged` | Backup frequency changes | Track scheduling-policy changes |
| `TenantReplicationEnabled` | Replication becomes enabled | Track resilience-policy activation |
| `TenantRecoveryObjectivesUpdated` | RPO/RTO changes | Track recovery-policy changes |

### `TenantBackupPolicyCreated`

Generated when the tenant receives its initial backup policy.

### `TenantBackupPolicyUpdated`

Generated when general backup-policy configuration changes.

Examples include:

```text
retention_days
backup_type
encryption_enabled
```

### `TenantBackupFrequencyChanged`

Generated when:

```text
backup_frequency
```

changes.

Example:

```text
daily
  ↓
hourly
```

### `TenantReplicationEnabled`

Generated when:

```text
replication_enabled
FALSE → TRUE
```

### `TenantRecoveryObjectivesUpdated`

Generated when RPO or RTO changes.

Audit events should describe policy changes without exposing secrets or key material.

---

## 21. Event Producers / Event Consumers

### Producers

- `TenantBackupPolicyCreated`
- `TenantBackupPolicyUpdated`
- `TenantBackupFrequencyChanged`
- `TenantReplicationEnabled`
- `TenantRecoveryObjectivesUpdated`

### Consumers

- Backup Scheduler
- Disaster Recovery Service
- Storage Manager
- Infrastructure Orchestrator
- Compliance Engine
- Audit Service

### Policy Creation Workflow

```text
Tenant Provisioning
        ↓
Default Backup Policy
        ↓
tenant_backup_policies
        ↓
TenantBackupPolicyCreated
        │
        ├── Backup Scheduler
        ├── Disaster Recovery Service
        ├── Storage Manager
        ├── Infrastructure Orchestrator
        ├── Compliance Engine
        └── Audit Service
```

### Frequency Change Workflow

```text
Administrator
      ↓
Change Frequency
      ↓
RBAC / Validation
      ↓
Database Update
      ↓
TenantBackupFrequencyChanged
      │
      ├── Backup Scheduler
      ├── Infrastructure Orchestrator
      ├── Compliance Engine
      └── Audit Service
```

### Recovery Objective Workflow

```text
Administrator
      ↓
Change RPO / RTO
      ↓
Approval / Validation
      ↓
Policy Updated
      ↓
TenantRecoveryObjectivesUpdated
      │
      ├── Disaster Recovery Service
      ├── Infrastructure Orchestrator
      ├── Compliance Engine
      └── Audit Service
```

---

## 22. Alternative Designs Considered

| Option | Description | Verdict |
|---|---|---|
| A | Store backup policy in `tenant_settings` | Rejected |
| B | JSON configuration | Rejected |
| C | Dedicated `tenant_backup_policies` table | Chosen |

### Option A — `tenant_settings`

Rejected because general tenant settings and disaster-recovery configuration have different responsibilities.

```text
tenant_settings
    ↓
General application configuration

tenant_backup_policies
    ↓
Backup + disaster recovery
```

### Option B — JSON Configuration

Rejected as the primary representation because it weakens:

- Relational constraints.
- Tenant uniqueness enforcement.
- Queryability.
- Indexing.
- Compliance reporting.
- Schema visibility.
- Governance.

### Option C — Dedicated Table

Chosen because it provides:

- Explicit tenant ownership.
- One active policy per tenant.
- Strong RPO/RTO constraints.
- Structured retention.
- Explicit replication policy.
- Explicit encryption policy.
- Dedicated indexes.
- Dedicated caching.
- Dedicated audit events.
- Clear integration with backup/DR infrastructure.

---

## 23. Final Design Assessment

| Attribute | Rating |
|---|---|
| Complexity | **Medium** |
| Read Volume | **High** |
| Write Volume | **Very Low** |
| Security Importance | **Critical** |
| Compliance Importance | **Critical** |
| Business Criticality | **Very High** |
| Scalability | **Excellent** |
| Recommended Status | **Core Disaster Recovery Configuration Table** |

---

# Overall Assessment

`tenant_backup_policies` is the tenant-specific backup and disaster-recovery policy layer of the Tenant Management module.

Its architectural role is:

```text
                         TENANT
                            │
                            ▼
                    Backup Policy
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   Scheduling          Recovery             Retention
        │              Objectives               │
        │              RPO / RTO                │
        ▼                   ▼                   ▼
 Backup Scheduler    Disaster Recovery      Storage
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
                    Infrastructure
                            │
                            ▼
                     Compliance
```

---

# Complete Backup Policy Model

```text
┌─────────────────────────────────────────────┐
│                   TENANT                    │
└──────────────────────┬──────────────────────┘
                       │
                       │ 1 : 1
                       ▼
┌─────────────────────────────────────────────┐
│          tenant_backup_policies             │
├─────────────────────────────────────────────┤
│ id                                          │
│ tenant_id                                   │
│ backup_frequency                            │
│ backup_type                                 │
│ retention_days                              │
│ replication_enabled                         │
│ encryption_enabled                          │
│ recovery_point_objective_minutes            │
│ recovery_time_objective_minutes             │
│ policy_notes                                │
│ created_at                                  │
│ updated_at                                  │
└──────────────────────┬──────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
      Scheduler        DR         Storage
       Service       Service      Manager
          │            │            │
          └────────────┼────────────┘
                       ▼
               Infrastructure
                  Orchestrator
                       │
                       ▼
                Compliance Engine
                       │
                       ▼
                  Audit Service
```

---

# Backup Policy Lifecycle

```text
                 Tenant Provisioned
                        │
                        ▼
                  Policy Created
                        │
                        ▼
                     ACTIVE
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
    Frequency Change  RPO/RTO      Replication
                      Change         Change
          │             │             │
          └─────────────┼─────────────┘
                        ▼
                 Policy Updated
                        │
                        ▼
                   Audit Event
                        │
                        ▼
              Backup / DR Services
```

---

# Critical Production Invariants

1. Every backup-policy record belongs to exactly one tenant.
2. Each tenant has one active backup policy under the current model.
3. `tenant_id` references `tenants.id`.
4. `tenant_id` is unique within the table.
5. `backup_frequency` is mandatory.
6. `backup_type` is mandatory.
7. `retention_days` must be greater than zero.
8. `replication_enabled` is mandatory.
9. `encryption_enabled` is mandatory.
10. `recovery_point_objective_minutes` must be greater than zero.
11. `recovery_time_objective_minutes` must be greater than zero.
12. `policy_notes` is optional.
13. The table represents backup/recovery policy, not backup artifacts.
14. The table does not represent individual backup execution jobs.
15. The table does not store backup files.
16. The table does not store encryption keys.
17. RPO is a business recovery requirement, not merely a copy of backup frequency.
18. RTO is a recovery target, not proof that infrastructure can always achieve it.
19. Actual backup execution belongs to backup infrastructure.
20. Actual replication state belongs to disaster-recovery/infrastructure systems.
21. Tenant isolation must apply to every policy lookup and mutation.
22. Security-sensitive policy changes require appropriate RBAC.
23. Backup-policy changes must be auditable.
24. Replication enablement must be auditable.
25. Recovery-objective changes must be auditable.
26. Backup-frequency changes must be auditable.
27. Compliance services must validate configured policy against actual operational controls.
28. Encryption policy must not be confused with encryption-key storage.
29. Redis is a performance cache; PostgreSQL remains authoritative.
30. The tenant identifier must be part of the cache key.
31. Policy changes must invalidate stale cached configuration.
32. The current physical model represents one active backup policy per tenant rather than an arbitrary collection of simultaneous policies.
33. The exact operational semantics of `continuous` backup must be defined by the backup infrastructure.
34. The exact relationship between backup frequency and RPO must be validated by the infrastructure/compliance layer rather than assumed by the database.
35. The exact operational semantics of each `backup_type` belong to the backup implementation.
36. The table should remain focused on the question: **“What backup and recovery policy currently governs this tenant?”**

---

# Final Conceptual Model

```text
                         ┌────────────────────┐
                         │       TENANT       │
                         └─────────┬──────────┘
                                   │
                                   │ owns
                                   ▼
                    ┌──────────────────────────┐
                    │ tenant_backup_policies   │
                    ├──────────────────────────┤
                    │ backup_frequency          │
                    │ backup_type               │
                    │ retention_days            │
                    │ replication_enabled       │
                    │ encryption_enabled         │
                    │ RPO                       │
                    │ RTO                       │
                    │ policy_notes               │
                    └────────────┬─────────────┘
                                 │
             ┌───────────────────┼───────────────────┐
             ▼                   ▼                   ▼
       Backup Scheduler      Disaster Recovery     Storage
             │                   │                   │
             └───────────────────┼───────────────────┘
                                 ▼
                       Infrastructure Orchestrator
                                 │
                                 ▼
                          Compliance Engine
                                 │
                                 ▼
                            Audit Service
```

The essential architectural principle is:

> **`tenant_backup_policies` provides the authoritative tenant-scoped backup and disaster-recovery policy, separating recovery requirements and backup governance from actual backup artifacts, execution jobs, storage infrastructure, and general tenant settings.**

The design establishes this as a **Core Disaster Recovery Configuration Table** with **Critical compliance/security importance**, **High read volume**, **Very Low write volume**, **Very High business criticality**, and **Excellent scalability**.
