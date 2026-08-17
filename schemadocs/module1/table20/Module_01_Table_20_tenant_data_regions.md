# Step 3 — Table 20: `tenant_data_regions`

The Module 1 inventory identifies **Table 20** as `tenant_data_regions`, with the purpose **“Data residency and storage regions.”**

The source defines this table as the tenant-level configuration that determines **where tenant data is stored, processed, replicated, and backed up**, supporting regulatory compliance, disaster recovery, and multi-region deployment.

The existing Table 20 document is clearly **degraded** relative to the required documentation standard: its schema uses only `Field / Type / Notes`, and Sections 14, 17, 19, 20, 21, and 22 are substantially abbreviated.

Therefore, this Step 3 deliberately restores the full documentation depth and the required schema format:

> **Field Name → Data Type → Key Type → Specification → Reason Field Exists**

I will **not invent source-defined fields, enums, relationships, cardinalities, or constraints**. Where the source does not specify an exact database constraint, that limitation is explicitly identified rather than silently converted into a requirement.

---

# 1. Why This Table Exists

The `tenant_data_regions` table stores **tenant-specific data residency and regional infrastructure policies**.

The source identifies three primary architectural reasons for this table:

- Regulatory compliance.
- Disaster recovery.
- Multi-region deployments.

A multi-tenant insurance platform cannot assume that every tenant can store its data in the same geographic region.

For example:

```text
Tenant A
    ↓
India / Mumbai

Tenant B
    ↓
Europe / Frankfurt

Tenant C
    ↓
Singapore

Tenant D
    ↓
United States / Virginia
```

The table provides the tenant-level policy that tells infrastructure and compliance services **where that tenant's data should primarily reside and how regional replication should be handled**.

---

## The Problem It Solves

Without a dedicated data-region configuration:

```text
Tenant
   ↓
Generic infrastructure
   ↓
Unknown data location
```

This creates problems for:

- Data residency compliance.
- Regional regulatory requirements.
- Disaster recovery.
- Infrastructure provisioning.
- Backup placement.
- Cross-region replication.
- Multi-region deployment.

With this table:

```text
Tenant
   ↓
tenant_data_regions
   ↓
Regional Policy
   ├── Primary Region
   ├── DR Region
   ├── Cloud Provider
   ├── Replication
   └── Residency Policy
```

---

# 2. Business Definition

A **Tenant Data Region** defines **where a tenant's data is stored, processed, replicated, and backed up**.

The source gives these examples:

- India (Mumbai)
- Europe (Frankfurt)
- Singapore
- United States (Virginia)

This is therefore an **infrastructure and compliance configuration entity**, not an infrastructure resource itself.

---

## Example

Suppose:

```text
Tenant:
ABC Insurance Ltd.
```

has:

```text
Primary Region:
ap-south-1

Disaster Recovery Region:
ap-south-2

Cloud Provider:
AWS

Replication:
Enabled

Residency Policy:
Strict
```

The tenant's regional configuration can then be consumed by:

```text
Provisioning Service
Storage Manager
Backup Manager
Compliance Engine
Infrastructure Orchestrator
```

---

## Business Meaning

The table answers:

> **Where must this tenant's data live, and what regional infrastructure policy governs it?**

It does **not** answer:

> Which exact database server contains the tenant?

That distinction is fundamental.

---

# 3. Critical Design Principle — What the Entity IS and IS NOT

## The Tenant Data Region IS

- A tenant-level infrastructure configuration.
- A data residency policy.
- A child of the Tenant aggregate.
- A regional deployment policy.
- A compliance-related configuration.
- A disaster-recovery configuration input.
- A replication-policy configuration.

The source explicitly defines it as:

- Tenant-level infrastructure configuration.
- Data residency policy.
- Child of the Tenant aggregate.

---

## The Tenant Data Region IS NOT

- A cloud server.
- A database instance.
- A storage bucket.
- A Kubernetes cluster.
- A physical data center.
- A backup itself.
- A replication job.
- An infrastructure deployment record.

The source explicitly states:

> It is **not a cloud server or database instance**.

---

## Critical Architectural Distinction

```text
tenant_data_regions
        ↓
Policy / desired regional configuration
```

versus:

```text
Infrastructure
        ↓
Actual deployed resources
```

The data-region table should therefore remain declarative.

It tells infrastructure services **what regional configuration the tenant requires**, rather than becoming an infrastructure inventory table.

---

# 4. Aggregate Root Analysis — DDD Structure

The source gives the following aggregate structure:

```text
Tenant
│
├── Data Regions
├── Backup Policies
├── Storage Settings
└── Integrations
```

The `Tenant` remains the aggregate root.

---

## DDD Relationship

```text
Tenant Aggregate Root
        │
        └── TenantDataRegion
```

The ownership relationship is:

```text
tenant_data_regions.tenant_id
            ↓
         tenants.id
```

---

## One-to-One Configuration

The source states:

> Each tenant owns one active data region configuration.

Therefore the current model is:

```text
Tenant A
    │
    └── Data Region Configuration A

Tenant B
    │
    └── Data Region Configuration B
```

rather than:

```text
Tenant A
    ├── Region Configuration 1
    ├── Region Configuration 2
    └── Region Configuration 3
```

for the current active configuration model.

---

## Relationship With Backup Policies

The aggregate structure places:

```text
Tenant
 ├── Data Regions
 └── Backup Policies
```

as separate child configurations.

This is important because:

```text
Data Region
    ↓
Where data resides

Backup Policy
    ↓
How backups are managed
```

They are related but not the same responsibility.

---

## Relationship With Storage Settings

Likewise:

```text
Data Region
    ↓
Geographic / residency placement

Storage Settings
    ↓
Storage capacity / object-storage configuration
```

The data-region table should not absorb storage quota or object-storage configuration.

---

# 5. Business Capabilities Supported

The source explicitly identifies six capabilities:

| Capability | Supported |
|---|---|
| Data residency enforcement | Yes |
| Multi-region deployment | Yes |
| Disaster recovery planning | Yes |
| Cross-region replication | Yes |
| Regulatory compliance | Yes |
| Cloud region management | Yes |

---

## Data Residency Enforcement

The tenant can specify a primary geographic region where its data should reside.

This allows infrastructure and compliance services to evaluate:

```text
Actual deployment
        vs.
Tenant residency policy
```

---

## Multi-Region Deployment

The presence of:

```text
primary_region
disaster_recovery_region
```

allows the architecture to represent primary and disaster-recovery regional placement.

---

## Disaster Recovery Planning

The `disaster_recovery_region` provides a tenant-specific target region for disaster recovery.

This is especially relevant for enterprise insurers with geographic resilience requirements.

---

## Cross-Region Replication

The source includes:

```text
replication_enabled
```

which determines whether the tenant's regional deployment uses replication.

---

## Regulatory Compliance

The source identifies residency policy values including:

```text
strict
preferred
replicated
global
```

These provide the platform with a policy classification for regional data handling.

---

## Cloud Region Management

The table combines:

```text
primary_region
cloud_provider
```

so infrastructure services can interpret the tenant's desired deployment environment.

---

# 6. Multi-Tenant / Ownership / Isolation Notes

The source explicitly states:

> Each tenant owns one active data region configuration.

The ownership relationship is:

```text
tenant_data_regions.tenant_id
              ↓
           tenants.id
```

---

## Tenant Isolation

Regional configuration is tenant-specific.

Therefore:

```text
Tenant A
    ↓
India

Tenant B
    ↓
Europe
```

must remain independent.

An infrastructure or provisioning service must never accidentally apply:

```text
Tenant A's region
```

to:

```text
Tenant B's deployment.
```

---

## Tenant Context

Regional configuration should always be resolved through an authenticated tenant context.

Example:

```sql
SELECT *
FROM tenant_data_regions
WHERE tenant_id = :authenticated_tenant_id;
```

The application should not trust an arbitrary tenant ID supplied by an untrusted client.

---

## Why This Matters More Than Ordinary Configuration

A cross-tenant data-region error could cause:

```text
Tenant A's data
        ↓
Wrong geographic region
```

which could become:

- Regulatory violation.
- Contractual violation.
- Data residency violation.
- Disaster-recovery failure.
- Compliance incident.

Therefore tenant isolation is a critical invariant.

---

# 7. Lifecycle

The source defines the lifecycle as:

```text
Creation:
Region assigned

Growth:
Policy updated

Modification:
Region migrated

Archival:
Configuration retained
```

---

## Creation — Region Assigned

During tenant provisioning:

```text
Tenant Created
      ↓
Determine Regional Policy
      ↓
tenant_data_regions
      ↓
Primary Region Assigned
```

The provisioning service can then use the configuration to determine infrastructure placement.

---

## Growth — Policy Updated

Regional requirements can evolve.

For example:

```text
Preferred
    ↓
Strict
```

or:

```text
Replication disabled
    ↓
Replication enabled
```

Such changes should be controlled and audited.

---

## Modification — Region Migrated

A primary region can potentially change:

```text
Mumbai
   ↓
Singapore
```

However, this is not a simple ordinary row update from an operational perspective.

A real regional migration may involve:

```text
Compliance validation
        ↓
Infrastructure provisioning
        ↓
Data replication
        ↓
Data validation
        ↓
Traffic migration
        ↓
Primary region switch
```

The source explicitly identifies **region migrated** as the lifecycle modification.

The exact migration workflow is not specified by the source, so the above is architectural context rather than a source-defined implementation sequence.

---

## Archival — Configuration Retained

The source explicitly states:

> Configuration retained.

Therefore historical configuration must not be casually destroyed.

This is particularly important for:

- Compliance investigations.
- Regulatory audits.
- Migration history.
- Incident analysis.

The current table represents the current configuration; historical changes should be captured through the audit architecture.

---

# 8. Proposed Schema

## Table Name

`tenant_data_regions`

## Primary Key Strategy

**UUID**

The source explicitly specifies UUID as the primary key.

---

## Full Field-by-Field Schema Definition

The source defines these fields.

The original source compressed them into `Field / Type / Notes`. The table below restores the required schema-documentation format.

| Field Name | Data Type | Key Type | Specification | Reason Field Exists |
|---|---|---|---|---|
| `id` | UUID | PK | `NOT NULL` | Stable unique identity of the tenant's regional configuration |
| `tenant_id` | UUID | FK → `tenants.id`, UK | `NOT NULL, UNIQUE` | Establishes tenant ownership and enforces one active configuration per tenant |
| `primary_region` | VARCHAR(100) | — | `NOT NULL` | Defines the principal geographic/cloud region where tenant data is stored and processed |
| `disaster_recovery_region` | VARCHAR(100) | — | `NULL` | Identifies the optional geographic region designated for disaster recovery |
| `cloud_provider` | ENUM | — | `NOT NULL` | Identifies the infrastructure provider hosting the tenant's regional deployment |
| `replication_enabled` | BOOLEAN | — | `NOT NULL` | Determines whether cross-region replication is enabled for the tenant |
| `residency_policy` | ENUM | — | `NOT NULL` | Defines the tenant's required/preferred geographic data-residency policy |
| `compliance_notes` | TEXT | — | `NULL` | Provides additional human-readable compliance or residency context not represented by structured fields |
| `created_at` | TIMESTAMPTZ | — | `NOT NULL` | Records creation of the regional configuration |
| `updated_at` | TIMESTAMPTZ | — | `NOT NULL` | Records the most recent modification of the configuration |

This preserves the source-defined physical field set without silently introducing additional fields.

---

## `id`

Provides the technical identity of the configuration record.

It is distinct from:

```text
tenant_id
```

because:

```text
tenant_id
    ↓
Who owns this configuration?

id
    ↓
Which configuration record is this?
```

---

## `tenant_id`

Establishes:

```text
tenant_data_regions
        ↓
Tenant ownership
```

The source explicitly defines it as:

```text
FK → tenants.id
Unique
```

Therefore it is both a relationship field and the candidate key for the one-to-one configuration.

---

## `primary_region`

Defines the principal geographic location where tenant data is stored and processed.

The source explicitly identifies this as the reason for the field.

Examples:

```text
India (Mumbai)
Europe (Frankfurt)
Singapore
United States (Virginia)
```

---

## `disaster_recovery_region`

Defines the optional regional location associated with disaster recovery.

The source marks this field as optional.

Therefore:

```text
NULL
```

is permitted by the documented schema.

The source does not define whether the DR region must differ from the primary region; that rule should therefore not be silently promoted to a database constraint.

---

## `cloud_provider`

Identifies the cloud/infrastructure environment.

The source defines five possible values:

```text
aws
azure
gcp
private_cloud
hybrid
```

---

## `replication_enabled`

Defines whether regional replication is enabled.

This is a policy switch rather than a record of individual replication jobs.

Actual replication infrastructure belongs to infrastructure/orchestration systems.

---

## `residency_policy`

Defines the tenant's data-residency policy.

The source defines:

```text
strict
preferred
replicated
global
```

This field is central to compliance behavior.

---

## `compliance_notes`

Provides additional explanatory compliance information.

The source marks it optional.

This field should remain descriptive rather than becoming an unstructured replacement for structured policy fields.

---

## `created_at`

Records creation time.

This supports lifecycle tracking and audit correlation.

---

## `updated_at`

Records the latest configuration modification.

This is particularly important because regional configuration changes can affect infrastructure and compliance.

---

# 9. Enum Definitions

The source explicitly defines two enums.

## `cloud_provider`

| Value | Description |
|---|---|
| `aws` | Tenant regional infrastructure is hosted using AWS |
| `azure` | Tenant regional infrastructure is hosted using Microsoft Azure |
| `gcp` | Tenant regional infrastructure is hosted using Google Cloud |
| `private_cloud` | Tenant regional infrastructure uses a private-cloud environment |
| `hybrid` | Tenant regional infrastructure spans a hybrid environment |

The source provides the values but does not provide detailed prose descriptions for each value. The descriptions above are therefore direct semantic interpretations of the source enum names, not additional requirements.

---

## `residency_policy`

| Value | Description |
|---|---|
| `strict` | Tenant requires strict geographic residency controls |
| `preferred` | Tenant expresses a preferred geographic placement |
| `replicated` | Tenant permits/uses replicated regional placement |
| `global` | Tenant permits globally distributed placement |

The source defines these values but does not provide a formal policy matrix for their exact enforcement semantics. Therefore the implementation must establish the precise operational meaning before production.

---

# 10. Why `primary_region` Exists

The source explicitly states:

> Defines the principal geographic location where tenant data is stored and processed.

This field is therefore the central regional-placement attribute.

---

## Primary Versus DR Region

The distinction is:

```text
primary_region
        ↓
Normal operational data placement
```

versus:

```text
disaster_recovery_region
        ↓
Recovery / resilience placement
```

This prevents the primary operational location from being confused with the disaster-recovery location.

---

## Why It Is Not Just `region`

The word `primary` communicates that the table can also represent:

```text
disaster_recovery_region
```

Therefore:

```text
primary_region
```

is semantically more precise than a generic:

```text
region
```

---

## Why It Matters for Compliance

A tenant may have a contractual requirement that:

```text
Primary data
    ↓
Specific geography
```

while allowing:

```text
DR data
    ↓
Another approved geography
```

The two fields allow those policies to be represented separately.

---

# 11. Candidate Keys

The source defines:

| Key Type | Field | Rationale |
|---|---|---|
| Primary Key | `id` | Technical identity |
| Candidate Key | `tenant_id` | One active data-region configuration per tenant |

---

## Primary Key

```text
id
```

provides stable relational identity.

---

## Candidate Key

```text
tenant_id
```

is unique because the source defines one active data-region configuration per tenant.

---

## Why `primary_region` Is Not Unique

Multiple tenants can legitimately use:

```text
India (Mumbai)
```

Therefore:

```text
UNIQUE(primary_region)
```

would be incorrect.

The uniqueness belongs to:

```text
tenant_id
```

not the geographic region.

---

# 12. Constraints

The source explicitly defines:

```text
PK(id)
FK(tenant_id)
UNIQUE(tenant_id)
Required primary_region
Required cloud_provider
Required residency_policy
```

The restored constraint table is:

| Constraint | Definition | Reason |
|---|---|---|
| Primary Key | `PK(id)` | Stable configuration identity |
| Tenant FK | `tenant_id → tenants.id` | Establishes ownership |
| One Configuration per Tenant | `UNIQUE(tenant_id)` | Prevents multiple current configurations |
| Primary Region Required | `primary_region NOT NULL` | Every configuration requires a principal region |
| Cloud Provider Required | `cloud_provider NOT NULL` | Infrastructure provider must be defined |
| Residency Policy Required | `residency_policy NOT NULL` | Residency behavior must be explicitly defined |
| DR Region Optional | `disaster_recovery_region NULL` | Source explicitly permits an optional DR region |
| Compliance Notes Optional | `compliance_notes NULL` | Additional notes are not mandatory |

---

## Constraints the Source Does NOT Define

The source does **not** explicitly specify:

```text
CHECK(primary_region <> '')
CHECK(disaster_recovery_region <> primary_region)
CHECK(replication_enabled = TRUE when residency_policy = replicated)
CHECK(cloud_provider <> ...)
```

Therefore these must **not** be presented as source-defined database constraints.

They may become implementation/business rules after the regional-policy model is formally defined.

---

# 13. Relationships

## Incoming References / Logical Consumers

The source identifies:

- Provisioning Service.
- Storage Manager.
- Backup Manager.
- Compliance Engine.

The expanded event-consumer architecture additionally identifies:

- Infrastructure Orchestrator.
- Audit Service.

---

## Outgoing References

The table has one explicit database relationship:

```text
tenant_id → tenants.id
```

---

## Provisioning Service

Consumes the data-region configuration to determine the intended regional infrastructure for the tenant.

---

## Storage Manager

Uses the region configuration to determine appropriate regional storage placement.

---

## Backup Manager

Uses:

```text
primary_region
disaster_recovery_region
```

to coordinate tenant-specific recovery placement.

---

## Compliance Engine

Uses:

```text
residency_policy
primary_region
disaster_recovery_region
```

to evaluate whether tenant infrastructure conforms to policy.

---

## Infrastructure Orchestrator

The source identifies it as an event consumer.

It can translate:

```text
Desired regional configuration
        ↓
Actual infrastructure deployment
```

---

# 14. Cardinality Analysis

The source explicitly states:

> One configuration per tenant.

| Relationship | Expected Cardinality |
|---|---:|
| Tenant → Data Region Configuration | Exactly 1 active configuration |
| Data Region Configuration → Tenant | Exactly 1 |
| Primary Region → Tenants | 0–N |
| Cloud Provider → Tenants | 0–N |
| Residency Policy → Tenants | 0–N |
| DR Region → Tenants | 0–N |

---

## Why This Table Is Small

Unlike:

```text
Policies
Claims
Documents
Transactions
```

this table contains configuration rather than operational records.

Therefore:

```text
1 tenant
   ↓
1 data-region configuration
```

means row count is approximately proportional to tenant count.

For example:

```text
100,000 tenants
≈
100,000 current data-region rows
```

The source rates scalability as **Excellent**.

---

## Multi-Region Caveat

The source says the table supports **multi-region deployment**, but the current physical schema stores:

```text
one primary_region
one optional disaster_recovery_region
```

It does **not** define a separate child table containing an arbitrary number of active regions.

Therefore the documented schema should not be interpreted as supporting unlimited active regions per tenant.

---

# 15. Query Patterns

## Retrieve Tenant's Data Region

The source explicitly defines:

```sql
SELECT *
FROM tenant_data_regions
WHERE tenant_id = :tenant_id;
```

This is the primary runtime configuration lookup.

---

## Find Tenants Using a Region

The source explicitly defines:

```sql
SELECT *
FROM tenant_data_regions
WHERE primary_region = :region;
```

This supports regional infrastructure and operational reporting.

---

## Retrieve Tenants Using a Specific Cloud Provider

The documented index supports this class of query:

```sql
SELECT tenant_id, primary_region
FROM tenant_data_regions
WHERE cloud_provider = :cloud_provider;
```

Useful for:

- Infrastructure reporting.
- Cloud migration planning.
- Provider-specific operational analysis.

---

## Retrieve Tenants Under a Residency Policy

```sql
SELECT tenant_id, primary_region, disaster_recovery_region
FROM tenant_data_regions
WHERE residency_policy = :residency_policy;
```

Useful for compliance analysis.

---

## Find Replication-Enabled Tenants

```sql
SELECT tenant_id,
       primary_region,
       disaster_recovery_region
FROM tenant_data_regions
WHERE replication_enabled = TRUE;
```

Useful for disaster-recovery and infrastructure reporting.

---

# 16. Index Strategy

The source explicitly specifies:

- `PK(id)`
- `UNIQUE(tenant_id)`
- `INDEX(primary_region)`
- `INDEX(cloud_provider)`
- `INDEX(residency_policy)`

---

## Primary Key

```sql
PRIMARY KEY (id)
```

Provides technical row identity.

---

## Unique Tenant Index

```sql
UNIQUE(tenant_id)
```

is simultaneously:

- Candidate-key enforcement.
- Tenant lookup optimization.

This supports:

```sql
WHERE tenant_id = :tenant_id
```

---

## Primary Region Index

```sql
INDEX(primary_region)
```

supports regional reporting and infrastructure queries.

---

## Cloud Provider Index

```sql
INDEX(cloud_provider)
```

supports queries such as:

```text
All AWS tenants
All Azure tenants
All GCP tenants
```

---

## Residency Policy Index

```sql
INDEX(residency_policy)
```

supports compliance reporting.

For example:

```text
All tenants with strict residency
```

---

## Why No Index on `replication_enabled`?

The source does not specify one.

Because this is a boolean field, an index may not provide sufficient selectivity depending on the distribution.

Therefore it should not be added automatically.

If production workload demonstrates a frequent and selective query involving replication state, the index can be evaluated later.

---

## Why No Index on `disaster_recovery_region`?

The source does not specify one.

If operational queries frequently search by DR region, a later workload-driven index can be introduced.

---

# 17. Read / Write Characteristics

The source specifies:

```text
Reads: High
Writes: Very Low
```

---

## Reads — High

Regional configuration may be consulted by:

- Provisioning.
- Storage.
- Backup.
- Compliance.
- Infrastructure orchestration.

Therefore read performance matters.

---

## Writes — Very Low

Configuration changes are comparatively rare.

Writes occur primarily when:

```text
Tenant provisioned
        ↓
Region assigned
```

or:

```text
Regional policy changed
        ↓
Configuration updated
```

or:

```text
Region migration
        ↓
Primary region changed
```

---

## Why the Read/Write Ratio Matters

This is a classic configuration table:

```text
Many operational reads
        +
Very few configuration writes
```

Therefore:

- Caching is appropriate.
- Strong indexes are inexpensive.
- Read availability is important.
- Write optimization is less important.

---

# 18. Caching Strategy

The source explicitly defines the Redis key:

```text
tenant-data-region:{tenant_id}
```

---

## Why Cache It

The configuration is:

- Small.
- Tenant-specific.
- Read frequently.
- Changed infrequently.

Therefore it is a strong cache candidate.

---

## Cache Contents

The cache can represent:

```text
tenant_id
primary_region
disaster_recovery_region
cloud_provider
replication_enabled
residency_policy
compliance_notes
```

subject to the platform's cache policy.

---

## Cache Key

Use:

```text
tenant-data-region:{tenant_id}
```

Example:

```text
tenant-data-region:abc123
```

The tenant ID in the key is critical for isolation.

---

## Cache Invalidation

When the configuration changes:

```text
Database Update
       ↓
Commit
       ↓
TenantDataRegionChanged
       ↓
Invalidate
tenant-data-region:{tenant_id}
```

The source specifically identifies regional-change events.

---

## Region Migration

Because region migration can be compliance-critical:

```text
Old Region
     ↓
Migration
     ↓
New Region
```

the cache should not retain the old primary region after the authoritative database configuration changes.

---

## Database Remains Authoritative

The architecture remains:

```text
PostgreSQL
    ↓
Source of Truth

Redis
    ↓
Read Optimization
```

The cache should never become the authoritative regional policy.

---

# 19. Security Considerations

The source explicitly identifies:

- RBAC.
- Tenant isolation.
- Audit logging.
- Approval workflows for migrations.
- Compliance validation.

Because regional configuration can determine where regulated insurance data resides, security and compliance importance are high.

---

## 1. RBAC

Changing a tenant's regional configuration should require appropriate administrative privileges.

A normal tenant user should not be able to arbitrarily change:

```text
primary_region
cloud_provider
residency_policy
replication_enabled
```

---

## 2. Tenant Isolation

Regional configuration must always be tenant-scoped.

A request authenticated for:

```text
Tenant A
```

must never retrieve or modify:

```text
Tenant B's region configuration.
```

---

## 3. Audit Logging

Regional configuration changes must be auditable.

Particularly:

```text
Primary Region Changed
Residency Policy Changed
Replication Enabled
```

---

## 4. Approval Workflow for Migrations

The source explicitly calls for approval workflows for migrations.

A primary-region change should therefore not be treated as an ordinary self-service configuration edit without appropriate governance.

---

## 5. Compliance Validation

Before a region change is accepted:

```text
Requested Region
       ↓
Compliance Validation
       ↓
Allowed?
```

Only then should the migration process proceed.

---

## 6. Data Residency Enforcement

The table represents policy, but the infrastructure layer must enforce it.

There should be a conceptual control loop:

```text
Policy
  ↓
Provisioned Infrastructure
  ↓
Compliance Scanner
  ↓
Policy Comparison
  ↓
Compliant / Violation
```

---

## 7. Do Not Confuse Policy With Actual Location

A particularly important security principle is:

```text
tenant_data_regions
        ↓
Desired / approved regional policy
```

not:

```text
tenant_data_regions
        ↓
Proof that data currently exists there
```

Actual infrastructure state must be obtained from infrastructure and compliance systems.

---

# 20. Audit Requirements

The source explicitly defines four events:

| Event | Trigger | Important Payload | Purpose |
|---|---|---|---|
| `TenantDataRegionCreated` | Initial regional configuration created | tenant ID, region, provider, policy, actor, timestamp | Establish regional-policy provenance |
| `TenantPrimaryRegionChanged` | Primary region changes | old region, new region, actor, timestamp, migration context | Track regional migration |
| `TenantReplicationEnabled` | Replication becomes enabled | tenant ID, region configuration, actor, timestamp | Track resilience-policy activation |
| `TenantResidencyPolicyChanged` | Residency policy changes | old policy, new policy, actor, timestamp | Track compliance-policy changes |

---

## `TenantDataRegionCreated`

Generated when a tenant receives its regional configuration.

Example audit metadata:

```text
tenant_id
primary_region
cloud_provider
residency_policy
created_by
created_at
```

---

## `TenantPrimaryRegionChanged`

This is the most operationally significant event.

The audit record should capture:

```text
old_primary_region
new_primary_region
actor
timestamp
migration/request reference
```

The source does not define the exact payload schema, so these fields are recommended audit metadata rather than source-defined mandatory payload fields.

---

## `TenantReplicationEnabled`

Generated when:

```text
replication_enabled
FALSE → TRUE
```

This records activation of regional replication.

---

## `TenantResidencyPolicyChanged`

Generated when:

```text
residency_policy
```

changes.

This is especially important for compliance.

---

## Audit Versus Configuration

The current table stores:

```text
Current Policy
```

Audit events store:

```text
What changed
Who changed it
When it changed
```

These responsibilities should remain separate.

---

# 21. Event Producers / Event Consumers

## Producers

The source explicitly identifies:

- `TenantDataRegionCreated`
- `TenantPrimaryRegionChanged`

The source's audit section additionally defines:

- `TenantReplicationEnabled`
- `TenantResidencyPolicyChanged`

---

## Consumers

The source identifies:

- Provisioning Service.
- Infrastructure Orchestrator.
- Backup Manager.
- Compliance Engine.
- Audit Service.

---

## Region Assignment Workflow

```text
Tenant Provisioning
        ↓
Regional Policy Determination
        ↓
tenant_data_regions
        ↓
TenantDataRegionCreated
        │
        ├── Provisioning Service
        ├── Infrastructure Orchestrator
        ├── Backup Manager
        ├── Compliance Engine
        └── Audit Service
```

---

## Primary Region Migration Workflow

```text
Migration Request
        ↓
RBAC
        ↓
Compliance Validation
        ↓
Migration Approval
        ↓
Infrastructure Migration
        ↓
Primary Region Updated
        ↓
TenantPrimaryRegionChanged
        │
        ├── Infrastructure Orchestrator
        ├── Backup Manager
        ├── Compliance Engine
        └── Audit Service
```

---

## Replication Enablement Workflow

```text
Administrator
      ↓
Enable Replication
      ↓
Validation
      ↓
replication_enabled = TRUE
      ↓
TenantReplicationEnabled
      ↓
Infrastructure / Backup Services
```

---

# 22. Alternative Designs Considered

The source explicitly identifies three alternatives:

| Option | Description | Verdict |
|---|---|---|
| A | Store region configuration in `tenant_settings` | **Rejected** |
| B | JSON configuration | **Rejected** |
| **C** | Dedicated `tenant_data_regions` table | **Chosen** |

---

## Option A — Store in `tenant_settings`

### Rejected

`tenant_settings` represents general tenant-wide application settings.

Regional infrastructure configuration has a different responsibility:

```text
tenant_settings
    ↓
General application behavior

tenant_data_regions
    ↓
Infrastructure + residency policy
```

Combining them would blur:

- Infrastructure configuration.
- Compliance configuration.
- General application configuration.

The source therefore rejects this design.

---

## Option B — JSON Configuration

Example:

```json
{
  "primary_region": "ap-south-1",
  "disaster_recovery_region": "ap-south-2",
  "cloud_provider": "aws",
  "replication_enabled": true,
  "residency_policy": "strict"
}
```

### Rejected

The dedicated fields are sufficiently important to justify first-class relational representation.

A JSON-only design would weaken:

- Explicit relational constraints.
- Candidate-key enforcement.
- Queryability.
- Indexing.
- Documentation.
- Governance.
- Compliance reporting.

---

## Option C — Dedicated Table

### Chosen

The dedicated table provides:

- Explicit tenant ownership.
- One configuration per tenant.
- Strong regional-policy semantics.
- Indexed region queries.
- Cloud-provider reporting.
- Residency-policy reporting.
- Dedicated caching.
- Dedicated audit events.
- Clear infrastructure-service integration.

This is the source-selected architecture.

---

# 23. Final Design Assessment

The source rates the table as follows:

| Attribute | Rating |
|---|---|
| Complexity | **Medium** |
| Read Volume | **High** |
| Write Volume | **Very Low** |
| Compliance Importance | **Critical** |
| Business Criticality | **High** |
| Scalability | **Excellent** |
| Recommended Status | **Core Infrastructure Configuration Table** |

---

# Overall Assessment

`tenant_data_regions` is the **tenant-specific geographic and data-residency policy layer** of the Tenant Management module.

Its architectural role is:

```text
                         TENANT
                            │
                            ▼
                  Data Region Policy
                            │
          ┌─────────────────┼──────────────────┐
          ▼                 ▼                  ▼
   Primary Region       DR Region        Residency Policy
          │                 │                  │
          └─────────────────┼──────────────────┘
                            ▼
                 Infrastructure Services
                            │
          ┌─────────────────┼──────────────────┐
          ▼                 ▼                  ▼
     Provisioning        Storage            Backup
          │                 │                  │
          └─────────────────┼──────────────────┘
                            ▼
                    Compliance Engine
```

---

# Complete Regional Configuration Model

```text
┌─────────────────────────────────────────────┐
│                   TENANT                    │
└──────────────────────┬──────────────────────┘
                       │
                       │ 1 : 1
                       ▼
┌─────────────────────────────────────────────┐
│             tenant_data_regions             │
├─────────────────────────────────────────────┤
│ id                                          │
│ tenant_id                                   │
│ primary_region                              │
│ disaster_recovery_region                    │
│ cloud_provider                              │
│ replication_enabled                         │
│ residency_policy                            │
│ compliance_notes                            │
│ created_at                                  │
│ updated_at                                  │
└──────────────────────┬──────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
   Provisioning     Storage       Backup
      Service        Manager      Manager
          │            │            │
          └────────────┼────────────┘
                       ▼
                Compliance Engine
                       │
                       ▼
                Audit Service
```

---

# Regional Policy Lifecycle

```text
                 Tenant Provisioned
                        │
                        ▼
                  Region Assigned
                        │
                        ▼
                     ACTIVE
                        │
           ┌────────────┼────────────┐
           ▼            ▼            ▼
      Policy Change  Replication   Migration
                        │            │
                        │            ▼
                        │      New Primary Region
                        │            │
                        └────────────┼
                                     ▼
                              Audit / Compliance
```

---

# Critical Production Invariants

1. **Every data-region configuration belongs to exactly one tenant.**
2. **Each tenant has one active data-region configuration under the current model.**
3. **`tenant_id` references `tenants.id`.**
4. **`tenant_id` is unique within the table.**
5. **`primary_region` is mandatory.**
6. **`cloud_provider` is mandatory.**
7. **`residency_policy` is mandatory.**
8. **`disaster_recovery_region` is optional according to the source.**
9. **`compliance_notes` is optional according to the source.**
10. **The table represents regional policy, not infrastructure inventory.**
11. **The table does not represent an individual cloud server or database instance.**
12. **The table does not replace backup-policy configuration.**
13. **The table does not replace storage configuration.**
14. **Multiple tenants may use the same primary region.**
15. **`primary_region` must therefore not be globally unique.**
16. **Regional configuration must always be resolved in the authenticated tenant context.**
17. **Cross-tenant regional configuration access must be prevented.**
18. **Primary-region changes require appropriate administrative authorization.**
19. **Primary-region migrations require approval workflows according to the source design.**
20. **Residency policy changes must be auditable.**
21. **Replication enablement must be auditable.**
22. **Primary-region changes must be auditable.**
23. **Initial regional configuration creation must be auditable.**
24. **Compliance services must validate actual infrastructure against the declared policy.**
25. **The declared region must not be treated as proof of actual physical data location.**
26. **Redis is a performance cache; PostgreSQL remains authoritative.**
27. **The cache key must contain the tenant identifier.**
28. **Regional configuration changes must invalidate stale cached policy.**
29. **The current physical schema supports one primary region and one optional DR region; it does not define arbitrary multi-region child records.**
30. **The precise enforcement semantics of `residency_policy` values must be formally defined before production implementation.**
31. **The exact JSON structure of any infrastructure-level representation must not be confused with this relational policy record.**
32. **The table should remain focused on the question: “Where is this tenant permitted or required to store/process/replicate its data, and what regional infrastructure policy governs it?”**

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
                    │   tenant_data_regions    │
                    ├──────────────────────────┤
                    │ primary_region            │
                    │ disaster_recovery_region  │
                    │ cloud_provider             │
                    │ replication_enabled        │
                    │ residency_policy           │
                    │ compliance_notes            │
                    └────────────┬───────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
        Provisioning          Storage             Backup
          Service             Manager             Manager
              │                  │                  │
              └──────────────────┼──────────────────┘
                                 ▼
                         Compliance Engine
                                 │
                                 ▼
                            Audit Service
```

The essential architectural principle is:

> **`tenant_data_regions` provides the authoritative tenant-scoped data-residency and regional infrastructure policy, separating geographic/compliance requirements from general tenant settings and from the actual infrastructure resources that implement those requirements.**

The source establishes this as a **Core Infrastructure Configuration Table** with **Critical compliance importance**, **High read volume**, **Very Low write volume**, **High business criticality**, and **Excellent scalability**.

**Step 3 — `tenant_data_regions` is complete.**

**No file has been created in this response.** The next step is **Step 4 — package this exact Step 3 content into the Table 20 `.md` file.**
