Step 3 — Table 26: tenant_storage_settings

The Module 1 inventory establishes Table 26 as tenant_storage_settings, with the purpose “Storage quotas and object storage configuration.”

The Tenant Management module explicitly identifies Storage configuration as a capability of the module. The wider schema establishes Tenant as the highest ownership boundary, with tenant-owned storage configuration separate from backup policy and regional configuration.

I could not locate a surviving original detailed Table 26 document containing its exact field list, enums, constraints, indexes, lifecycle, or event definitions. Therefore, consistent with the anti-degradation rule, those implementation details below are explicitly marked proposed reconstruction rather than being falsely presented as recovered source.

1. Why This Table Exists

The tenant_storage_settings table represents the storage configuration and storage quotas applicable to a tenant.

The Module 1 inventory explicitly defines its purpose as:

Storage quotas and object storage configuration.

The Tenant Management module treats storage configuration as a first-class tenant capability.

The table therefore establishes a boundary between:

Tenant
   │
   ▼
Storage Policy / Configuration
   │
   ├── Storage Quotas
   ├── Object Storage
   ├── Storage Provider
   └── Storage Behavior

and the actual infrastructure:

Storage Configuration
        ↓
Storage Service
        ↓
Cloud/Object Storage Infrastructure
The Problem It Solves

Without a dedicated storage-settings table, storage information could be incorrectly embedded in:

tenants
tenant_settings
tenant_data_regions
tenant_backup_policies
tenant_integrations

These entities have different responsibilities.

The architectural distinction is:

tenant_data_regions
        ↓
Where tenant data should reside


tenant_storage_settings
        ↓
How tenant storage is configured and constrained


tenant_backup_policies
        ↓
How tenant data is backed up and recovered

These should remain separate.

Storage Is a Tenant-Owned Resource

Different insurers may require different storage allocations.

For example:

Tenant A
   ↓
500 GB document quota


Tenant B
   ↓
5 TB document quota


Tenant C
   ↓
Enterprise object storage

The platform therefore needs a tenant-level storage configuration boundary.

2. Business Definition

A Tenant Storage Settings record represents the storage configuration and quota policy assigned to one tenant.

It defines the storage resources and limits that the Storage Service should apply to that tenant.

Conceptually:

Tenant
   │
   └── Storage Settings
          │
          ├── Storage Provider
          ├── Storage Type
          ├── Bucket / Container
          ├── Storage Quota
          ├── Object Size Limits
          ├── Storage Status
          └── Provider Configuration

The configuration can be consumed by:

Storage Service.
Document Service.
Claims Document Processing.
Policy Document Service.
Backup Service.
Provisioning Service.
Compliance Service.
Billing/Usage Services.
Business Examples

Tenant storage can support:

Policy documents
Claim photographs
Medical reports
Vehicle inspection images
Customer documents
KYC documents
Generated reports
AI-processing artifacts
Attachments
Backups or exported tenant data

The actual document records themselves do not belong in this table.

What This Table Represents

It represents:

How storage is configured and constrained for this tenant.

It does not represent:

Individual files.
Individual documents.
Object metadata.
Upload sessions.
Storage transactions.
Backup executions.
Cloud servers.
Storage-provider credentials.
Individual storage usage events.

Those belong to other domains/services.

3. Critical Design Principle — What the Entity IS and IS NOT
The Tenant Storage Settings IS
Tenant-owned storage configuration.
A tenant storage policy.
A quota configuration.
An object-storage configuration.
A storage-infrastructure abstraction.
A child configuration of the Tenant domain.
A security-sensitive infrastructure configuration.
The Tenant Storage Settings IS NOT
A file.
A document.
A storage bucket itself.
A cloud server.
A backup.
A backup execution.
A storage usage counter.
A storage credential.
A document metadata record.

The architectural distinction is:

tenant_storage_settings
        ↓
Desired storage configuration
        ↓
Storage Service
        ↓
Actual object-storage infrastructure
Declarative Configuration Principle

The table should describe:

WHAT STORAGE THE TENANT SHOULD HAVE

rather than:

EVERY OBJECT CURRENTLY STORED

For example:

storage_quota_bytes = 549755813888

is configuration.

Whereas:

tenant_id
object_id
file_name
size
uploaded_at

belongs to document/object-storage metadata.

4. Aggregate Root Analysis — DDD Structure

The Tenant aggregate contains infrastructure-oriented child configurations:

Tenant
├── Data Regions
├── Backup Policies
├── Storage Settings
├── Email Settings
├── SMS Settings
├── Integrations
├── Webhooks
└── Security Settings

Therefore:

Tenant Aggregate Root
        │
        └── TenantStorageSettings
Aggregate Relationship

The proposed current relationship is:

Tenant
   │
   └── 0..1 current storage configuration

A tenant may initially exist before storage configuration is provisioned.

After provisioning:

Tenant
   │
   └── 1 current storage configuration
Relationship With Data Regions

These are related but distinct:

tenant_data_regions
        ↓
Where tenant data should reside


tenant_storage_settings
        ↓
How tenant storage is configured

For example:

Data Region
    ↓
India / Mumbai


Storage Settings
    ↓
Object Storage
    ↓
Tenant-specific bucket
    ↓
500 GB quota
Relationship With Backup Policies

Backup configuration is separate:

tenant_storage_settings
        ↓
Primary tenant storage


tenant_backup_policies
        ↓
Backup / retention / recovery policy

The storage table should not become a backup-policy table.

5. Business Capabilities Supported
| Capability | Supported |
| --- | --- |
| Tenant storage configuration | Yes |
| Tenant storage quota | Yes |
| Object-storage configuration | Yes |
| Storage provider selection | Yes |
| Bucket/container configuration | Yes |
| Maximum object-size policy | Yes |
| Storage enablement/disablement | Yes |
| Storage usage tracking | No — separate usage mechanism |
| Document metadata | No — separate domain |
| Backup policy | No — tenant_backup_policies |
| Storage credentials | No — secure secret management |
| Individual file records | No — separate document/object metadata |
Storage Quotas

The table can establish the maximum storage allocated to a tenant.

For example:

Tenant
   ↓
Storage quota
   ↓
500 GB

The actual current consumption should be tracked separately.

This prevents the configuration row from becoming a high-frequency counter.

Object Storage

The configuration can identify the object-storage system used for tenant files.

Conceptually:

Tenant
   ↓
Storage Settings
   ↓
Object Storage Provider
   ↓
Tenant Storage Namespace
Object Isolation

Tenant A's object namespace must never be confused with Tenant B's.

For example:

Tenant A
   ↓
tenant-a/objects/...


Tenant B
   ↓
tenant-b/objects/...

The exact namespace strategy is an implementation decision.

6. Multi-Tenant / Ownership / Isolation Notes

Every storage configuration belongs to exactly one tenant.

tenant_storage_settings.tenant_id
              ↓
           tenants.id
Tenant Storage Isolation

Incorrect:

Tenant A
   ↓
Shared unrestricted bucket
   ↓
Tenant B objects accessible

Correct:

Tenant A
   ↓
Tenant-scoped storage namespace
   ↓
Tenant A objects


Tenant B
   ↓
Tenant-scoped storage namespace
   ↓
Tenant B objects
Logical Isolation

Even if multiple tenants use the same physical cloud storage service, the application must maintain logical isolation.

For example:

Object Storage
│
├── tenant-A/
│     ├── policies/
│     └── claims/
│
└── tenant-B/
      ├── policies/
      └── claims/
Credential Isolation

Storage-provider credentials should never be shared accidentally across tenant contexts.

If tenant-specific credentials exist:

Tenant A
   ↓
Credential Reference A


Tenant B
   ↓
Credential Reference B
Application Access Pattern
SELECT *
FROM tenant_storage_settings
WHERE tenant_id = :authenticated_tenant_id;

Tenant identity should be derived from authenticated context.

Quota Isolation

Quota calculations must always be tenant-scoped:

Tenant A usage
    ≤
Tenant A quota

not:

All tenants usage
    ≤
Tenant A quota
7. Lifecycle

The following lifecycle is proposed reconstruction:

Not Configured
       ↓
Provisioning
       ↓
Configured
       ↓
Validated
       ↓
Active
       ↓
Updated
       ↓
Suspended
       ↓
Archived
Creation

A tenant may initially have no storage configuration:

Tenant Created
      ↓
Storage Not Configured

During provisioning, the storage configuration is created.

Provisioning

The provisioning process may establish:

Storage Provider
Storage Type
Bucket / Container
Storage Namespace
Quota
Object Limits
Validation

Before activation, the Storage Service can validate:

Provider availability.
Bucket/container existence.
Namespace correctness.
Access permissions.
Encryption configuration.
Regional compatibility.
Credential validity.
Activation

After validation:

Storage Settings
      ↓
ACTIVE

The tenant can begin using storage.

Quota Change

An administrator may change:

500 GB
    ↓
1 TB

Such changes should be auditable.

Provider Migration

A tenant may move:

Provider A
    ↓
Provider B

This is significantly more complex than updating a provider name because existing objects may need migration.

Therefore a storage configuration change should not be interpreted as proof that physical data has already migrated.

Suspension

Storage access may be temporarily disabled because of:

Tenant suspension.
Security incident.
Provider outage.
Compliance issue.
Administrative action.
Archival

When a tenant is archived, storage configuration should be retained where required for audit and data-retention purposes.

Physical object deletion should be handled by a controlled data-retention workflow, not by blindly deleting this configuration row.

8. Proposed Schema
Table Name

tenant_storage_settings

Primary Key Strategy

UUID

The table is a tenant-owned configuration entity and therefore uses a stable UUID identity.

Full Field-by-Field Schema Definition

The exact original Table 26 field list was not found in the available source material. The following is therefore a proposed reconstruction.

| Field Name | Data Type | Key Type | Specification | Reason Field Exists |
| --- | --- | --- | --- | --- |
| id | UUID | PK | NOT NULL | Stable identity of the storage configuration |
| tenant_id | UUID | FK → tenants.id | NOT NULL, UNIQUE | Establishes tenant ownership and one current configuration |
| storage_provider | VARCHAR(100) | — | NOT NULL | Identifies the object-storage provider |
| storage_type | ENUM | — | NOT NULL | Defines the storage mechanism |
| bucket_name | VARCHAR(255) | — | NULL | Identifies the tenant's storage bucket/container where applicable |
| storage_namespace | VARCHAR(500) | — | NULL | Provides a tenant-specific logical object prefix/namespace |
| region | VARCHAR(100) | — | NULL | Identifies storage region where storage is independently configured |
| quota_bytes | BIGINT | — | NOT NULL, CHECK >= 0 | Defines the maximum allocated storage capacity |
| max_object_size_bytes | BIGINT | — | NULL, CHECK > 0 | Prevents individual objects from exceeding configured limits |
| encryption_enabled | BOOLEAN | — | NOT NULL, DEFAULT TRUE | Declares whether tenant storage must use encryption |
| versioning_enabled | BOOLEAN | — | NOT NULL, DEFAULT FALSE | Controls object-version retention where supported |
| status | ENUM | — | NOT NULL | Represents storage configuration lifecycle |
| configuration | JSONB | — | NULL | Stores provider-specific non-secret configuration |
| credential_reference | VARCHAR(255) | — | NULL | References securely managed provider credentials |
| created_at | TIMESTAMPTZ | — | NOT NULL | Records configuration creation |
| updated_at | TIMESTAMPTZ | — | NOT NULL | Records the latest configuration change |
id

Provides stable relational identity:

Which storage configuration record is this?
tenant_id

Establishes:

tenant_storage_settings.tenant_id
        ↓
tenants.id

The proposed uniqueness constraint makes the table one-current-configuration-per-tenant.

storage_provider

Identifies the storage infrastructure provider.

The source only establishes object storage configuration; it does not prescribe a specific provider.

Therefore provider names should remain configurable.

storage_type

Separates storage mechanisms.

Possible examples include:

object_storage

and potentially future provider-specific storage mechanisms.

bucket_name

Identifies the physical/logical bucket or container when the provider model uses one.

The exact physical resource should not be confused with the configuration record itself.

storage_namespace

Provides logical tenant isolation inside shared infrastructure.

For example:

tenant-001/
tenant-002/

This is useful where multiple tenants share an object-storage account.

region

Represents storage location when the storage configuration independently needs a region.

This should not automatically replace tenant_data_regions.

The architectural distinction remains:

tenant_data_regions
        ↓
Tenant's declared regional/residency policy


tenant_storage_settings.region
        ↓
Storage-specific placement/configuration

If the implementation derives storage placement entirely from tenant_data_regions, this field may be omitted.

quota_bytes

Defines the configured maximum storage allocation.

For example:

549755813888

represents approximately 512 GiB.

The exact quota unit and display convention should be standardized by implementation.

max_object_size_bytes

Limits the maximum size of an individual object.

This is different from:

quota_bytes

because:

Quota
    ↓
Total tenant storage


Max Object Size
    ↓
One individual object
encryption_enabled

Declares whether tenant storage is expected to use encryption.

This is configuration intent.

It does not by itself prove that the underlying provider has actually encrypted the data.

Actual infrastructure compliance should be validated separately.

versioning_enabled

Allows object versions to be retained where the provider supports versioning.

This can be useful for:

Accidental deletion recovery.
Document replacement history.
Operational resilience.

However, versioning can significantly increase storage consumption.

status

Represents configuration lifecycle.

configuration

Stores provider-specific non-secret options without repeatedly modifying the relational schema.

Examples:

provider-specific storage class
endpoint configuration
object lifecycle options
provider feature flags

Secrets must not be stored here.

credential_reference

References secure provider credentials.

tenant_storage_settings
        │
        └── credential_reference
                  ↓
             Secret Manager
9. Enum Definitions

The original Table 26 enum definitions are unavailable.

The following are proposed controlled values.

storage_type
| Value | Description |
| --- | --- |
| object_storage | Object-based storage for tenant files and documents |
| custom | Provider-specific storage mechanism |
status
| Value | Description |
| --- | --- |
| pending | Configuration created but not yet validated |
| provisioning | Storage resources are being provisioned |
| active | Storage configuration is operational |
| suspended | Storage access is temporarily disabled |
| failed | Provisioning or validation failed |
| archived | Configuration retired |

These are proposed values rather than source-recovered enums.

10. Why credential_reference Exists

Cloud/object-storage providers can require credentials such as:

Access Key
Secret Key
Service Account
OAuth Credential
Managed Identity Reference

These should not be stored directly in the configuration row.

Instead:

tenant_storage_settings
        │
        └── credential_reference
                  ↓
             Secret Manager
Why Not Store access_key and secret_key?

Doing so would:

Expose sensitive infrastructure credentials.
Increase database compromise impact.
Complicate credential rotation.
Couple the schema to one provider authentication model.

A logical credential reference allows:

Access Key
        ↓
Credential Reference


Service Account
        ↓
Credential Reference


Managed Identity
        ↓
Credential Reference

without changing the relational model.

Credential Rotation
Credential Reference
        ↓
Old Credential
        ↓
Rotation
        ↓
New Credential

The configuration record can remain unchanged.

11. Candidate Keys
| Key Type | Field(s) | Rationale |
| --- | --- | --- |
| Primary Key | id | Stable technical identity |
| Candidate Key | tenant_id | One current storage configuration per tenant |
Why Not bucket_name?

A bucket/container may not be globally unique across all storage systems.

Even when a provider requires global uniqueness, that uniqueness belongs to the provider's infrastructure namespace, not necessarily to the business entity.

Why Not storage_provider?

Many tenants can use the same provider.

Therefore:

storage_provider

cannot identify a configuration.

12. Constraints
| Constraint | Definition | Reason |
| --- | --- | --- |
| Primary Key | PK(id) | Stable configuration identity |
| Tenant FK | tenant_id → tenants.id | Establishes ownership |
| One Current Configuration | UNIQUE(tenant_id) | Prevents ambiguous current storage configuration |
| Provider | NOT NULL | Storage provider must be known |
| Storage Type | NOT NULL | Storage mechanism must be explicit |
| Quota | NOT NULL, >= 0 | Storage allocation cannot be negative |
| Maximum Object Size | Nullable, > 0 | Individual object limit where applicable |
| Encryption | NOT NULL, default TRUE | Secure storage should be the default |
| Versioning | NOT NULL, default FALSE | Explicitly controls object versioning |
| Status | NOT NULL | Lifecycle state required |
| Credential Reference | Nullable | Some providers can use managed identities |
| Configuration | Nullable | Provider-specific settings are optional |
| Timestamps | NOT NULL | Lifecycle tracking |
Conditional Constraints

Recommended domain constraints:

storage_type = object_storage
        →
bucket_name should exist

and:

max_object_size_bytes <= quota_bytes

where both are configured.

Important Source Boundary

The source establishes the table's purpose as storage quotas and object-storage configuration, but does not establish these exact physical constraints.

Therefore:

CHECK(quota_bytes >= 0)

and:

CHECK(max_object_size_bytes <= quota_bytes)

are proposed implementation constraints, not recovered source requirements.

13. Relationships
Incoming References / Logical Consumers

The storage configuration can be consumed by:

Storage Service.
Document Service.
Claims Document Service.
Policy Document Service.
Provisioning Service.
Backup Service.
Compliance Service.
Usage Metering Service.
Audit Service.
Outgoing References

The explicit relational relationship is:

tenant_id → tenants.id

The credential reference points logically to secure secret-management infrastructure.

Storage Service

Primary consumer:

Tenant Request
      ↓
Storage Service
      ↓
Tenant Storage Settings
      ↓
Storage Provider
Document Service

Uses storage configuration when storing:

Policy Documents
Claim Documents
KYC Documents
Customer Attachments
Claims Document Processing

The AI document-processing pipeline may depend on object storage for:

Scanned claim forms
Medical reports
Accident photographs
Supporting documents

The Expanded Requirements explicitly identify object storage for claim documents as part of the broader InsureIQ architecture.

Provisioning Service

Uses configuration when creating tenant storage resources.

Backup Service

Uses storage infrastructure for backup targets, while the actual backup policy remains represented by tenant_backup_policies.

Compliance Service

Can compare declared configuration against actual infrastructure state.

For example:

Declared:
encryption_enabled = true


Actual:
Provider encryption = disabled

This should produce a compliance discrepancy rather than being silently accepted.

14. Cardinality Analysis

The proposed cardinality is:

Tenant
   ↓
0..1 current Storage Settings
| Relationship | Expected Cardinality |
| --- | --- |
| Tenant → Storage Settings | 0–1 before provisioning; 1 once configured |
| Storage Settings → Tenant | Exactly 1 |
| Provider → Tenants | 0–N |
| Storage Type → Settings | 0–N |
| Region → Tenant Storage Configurations | 0–N |
| Status → Settings | 0–N |
Why This Table Is Small

This is configuration rather than storage-object data.

Therefore:

100,000 tenants
≈
100,000 current storage configuration rows

rather than millions or billions of storage-object records.

Where Large Volumes Belong

Large datasets should exist elsewhere:

Documents
Objects
Usage Events
Storage Metering Events
Backup Executions

The configuration table must remain relatively small.

15. Query Patterns
Retrieve Tenant Storage Configuration
SELECT *
FROM tenant_storage_settings
WHERE tenant_id = :tenant_id;

This is the primary runtime query.

Retrieve Active Storage Configuration
SELECT *
FROM tenant_storage_settings
WHERE tenant_id = :tenant_id
AND status = 'active';
Find Tenants by Storage Provider
SELECT tenant_id, storage_provider
FROM tenant_storage_settings
WHERE storage_provider = :storage_provider;

Useful for migration and infrastructure reporting.

Find Storage Configurations Near Quota

The exact usage table is outside this table, but conceptually:

SELECT
    s.tenant_id,
    s.quota_bytes,
    u.used_bytes
FROM tenant_storage_settings s
JOIN tenant_usage_counters u
    ON u.tenant_id = s.tenant_id
WHERE u.resource_code = 'storage'
AND u.used_bytes >= s.quota_bytes * 0.8;

This illustrates the distinction:

tenant_storage_settings
        ↓
Configured quota


tenant_usage_counters
        ↓
Actual usage
Find Suspended Storage
SELECT tenant_id, storage_provider
FROM tenant_storage_settings
WHERE status = 'suspended';
Find Configurations Requiring Provisioning
SELECT tenant_id, storage_provider
FROM tenant_storage_settings
WHERE status = 'provisioning';
Find Encrypted Storage Configurations
SELECT tenant_id, storage_provider
FROM tenant_storage_settings
WHERE encryption_enabled = TRUE;
16. Index Strategy

Recommended indexes:

| Index | Purpose |
| --- | --- |
| PK(id) | Direct configuration lookup |
| UNIQUE(tenant_id) | One configuration per tenant |
| INDEX(storage_provider) | Provider analysis |
| INDEX(status) | Operational filtering |
| INDEX(region) | Regional infrastructure analysis |
Primary Key
PRIMARY KEY(id)
Tenant Unique Index
UNIQUE(tenant_id)

This is the most important index because tenant-scoped storage resolution is the dominant runtime access pattern.

Provider Index
INDEX(storage_provider)

Useful for:

Provider migration.
Provider usage reporting.
Infrastructure analysis.
Status Index
INDEX(status)

Supports:

pending
provisioning
active
suspended
failed
archived

queries.

Region Index

If storage region is represented directly:

INDEX(region)

supports infrastructure/compliance analysis.

If region is always derived from tenant_data_regions, this index should be omitted.

Do Not Over-Index

Avoid indexes on:

bucket_name
storage_namespace
configuration
credential_reference

unless real query workloads require them.

17. Read / Write Characteristics
| Operation | Volume | Notes |
| --- | --- | --- |
| Reads | High | Storage operations may resolve tenant configuration frequently |
| Writes | Very Low | Configuration changes are infrequent |
| Updates | Low | Quota/provider/configuration changes |
| Deletes | Very Low | Prefer suspension/archival |
Reads — High

Storage access can occur throughout the platform:

Policies
Claims
Customers
Documents
AI Processing
Reports
Backups

The Storage Service may therefore resolve configuration frequently.

Writes — Very Low

Typical changes include:

Initial provisioning
Quota increase
Provider migration
Storage configuration change
Enable/disable
Credential rotation
Updates — Low

Quota changes can be more common than provider migrations, but still should remain low relative to transactional data.

Deletes — Very Low

Deleting storage configuration can destroy important operational context.

Prefer:

ACTIVE
   ↓
SUSPENDED
   ↓
ARCHIVED

rather than physical deletion.

18. Caching Strategy

Recommended Redis key:

tenant-storage-settings:{tenant_id}

Example:

tenant-storage-settings:abc123
Cached Data

Potentially cache:

storage_provider
storage_type
bucket_name
storage_namespace
region
quota_bytes
max_object_size_bytes
encryption_enabled
versioning_enabled
status
configuration
credential_reference

Actual credentials should never be placed into the cache.

Cache Lookup
Storage Request
      ↓
Tenant ID
      ↓
Redis
tenant-storage-settings:{tenant_id}
      ↓
Storage Service
      ↓
Provider Adapter
Cache Miss
Redis Miss
    ↓
PostgreSQL
    ↓
tenant_storage_settings
    ↓
Populate Redis
Cache Invalidation

Configuration changes should invalidate:

tenant-storage-settings:{tenant_id}

For example:

Storage Configuration Updated
        ↓
TenantStorageSettingsUpdated
        ↓
Invalidate Redis
Quota Cache Consideration

Do not treat the cached quota as actual usage.

Cached quota
      ≠
Actual storage consumption

Actual usage belongs to the usage/metering subsystem.

Database Remains Authoritative
PostgreSQL
     ↓
Source of Truth


Redis
     ↓
Performance Cache
19. Security Considerations

Storage configuration is a high-security infrastructure boundary.

A compromised storage configuration could allow:

Unauthorized object access.
Unauthorized object writes.
Data exfiltration.
Tenant cross-access.
Storage abuse.
Destructive deletion.
1. Tenant Isolation

Every storage request must resolve configuration using authenticated tenant context.

2. Credential Management

Never store plaintext:

Access Key
Secret Key
API Secret
Service Account Private Key
OAuth Secret

in ordinary database fields.

Use a secret-management system.

3. Encryption at Rest

Tenant storage should support encryption at rest.

The separate multi-tenant database guidance also establishes encryption of sensitive data and backups as an important security requirement.

4. Encryption in Transit

Storage-provider communication should use secure transport:

HTTPS / TLS
5. Tenant-Scoped Object Paths

Objects should have tenant isolation at the storage layer as well as application layer.

For example:

tenant-A/
tenant-B/

or separate buckets where required.

6. Least Privilege

Storage credentials should have only the permissions necessary for the tenant's operations.

Avoid broad administrative provider permissions.

7. Administrative RBAC

Only authorized administrators should modify:

Storage provider.
Bucket/container.
Namespace.
Quota.
Region.
Encryption policy.
Versioning.
Credentials.
Status.
8. Quota Protection

Quota changes are financially and operationally sensitive.

An administrator should not be able to silently increase:

100 GB
   ↓
100 TB

without appropriate authorization.

9. Object Deletion Protection

Storage configuration changes should not automatically trigger destructive deletion.

Migration/decommissioning should be a separate controlled workflow.

10. Secret Exposure Prevention

Secrets must never appear in:

API responses
logs
audit events
exceptions
Redis
debug output
11. Compliance

Actual storage configuration should be periodically compared against declared tenant policy.

For example:

Declared:
encryption_enabled = true


Actual:
provider encryption = false

must be detectable.

20. Audit Requirements

The original Table 26 audit requirements are unavailable.

The following are recommended audit events:

| Event | Trigger | Purpose |
| --- | --- | --- |
| TenantStorageSettingsCreated | Configuration created | Establish provenance |
| TenantStorageSettingsUpdated | Configuration changed | Record modifications |
| TenantStorageSettingsActivated | Storage becomes active | Record activation |
| TenantStorageSettingsSuspended | Storage disabled | Record suspension |
| TenantStorageProvisioningFailed | Provisioning fails | Record infrastructure failure |
| TenantStorageQuotaChanged | Quota changes | Record capacity changes |
| TenantStorageProviderChanged | Provider changes | Record migration |
| TenantStorageCredentialRotated | Credential reference changes | Record security-sensitive change |
Audit Payload

Recommended:

tenant_id
actor_id
configuration_id
event_type
timestamp
changed_fields

Do not include:

access_key
secret_key
private_key
API secret
Quota Change Example

Instead of simply:

quota changed

record:

tenant_id
old_quota_bytes
new_quota_bytes
actor_id
timestamp
reason

provided the values themselves are not sensitive.

This gives administrators a meaningful audit trail.

21. Event Producers / Event Consumers
Producers

Recommended events:

TenantStorageSettingsCreated
TenantStorageSettingsUpdated
TenantStorageSettingsActivated
TenantStorageSettingsSuspended
TenantStorageProvisioningFailed
TenantStorageQuotaChanged
TenantStorageProviderChanged
TenantStorageCredentialRotated

These are proposed events rather than recovered source-defined events.

Producer Flow
Tenant Administrator
        ↓
Tenant Administration UI
        ↓
Storage Configuration API
        ↓
Storage Configuration Service
        ↓
tenant_storage_settings
        ↓
Domain Event
Consumers

Logical consumers include:

Storage Service.
Provisioning Service.
Document Service.
Backup Service.
Compliance Service.
Usage Metering.
Monitoring.
Cache Manager.
Audit Service.
Configuration Update Flow
Administrator
      ↓
Storage Configuration API
      ↓
RBAC Validation
      ↓
Configuration Validation
      ↓
Database Update
      ↓
TenantStorageSettingsUpdated
      │
      ├── Storage Service
      ├── Cache Manager
      ├── Provisioning
      ├── Compliance
      └── Audit Service
Storage Provisioning Flow
Tenant Created
      ↓
Tenant Provisioning
      ↓
Storage Settings
      ↓
Storage Provisioner
      ↓
Cloud/Object Storage
      ↓
Validation
      ↓
Storage ACTIVE
22. Alternative Designs Considered
| Option | Description | Verdict |
| --- | --- | --- |
| A | Store storage configuration in tenants | Rejected |
| B | Store it in tenant_settings | Rejected |
| C | Store it inside tenant_data_regions | Rejected |
| D | Store it inside tenant_backup_policies | Rejected |
| E | Store it inside tenant_integrations.configuration | Rejected |
| F | Dedicated tenant_storage_settings table | Chosen |
| G | Store storage credentials directly | Rejected |
Option A — Store in tenants

Rejected because the Tenant root should not become a storage-infrastructure object.

The tenant represents:

Business Ownership

while storage settings represent:

Infrastructure Configuration
Option B — Store in tenant_settings

Rejected because generic tenant application settings have different:

Security requirements.
Consumers.
Lifecycle.
Validation.
Operational meaning.
Option C — Store in tenant_data_regions

Rejected because:

Data Region
    ↓
Where tenant data is governed to reside


Storage Settings
    ↓
How tenant storage is configured

A tenant may have a regional residency policy independent of the details of its object-storage configuration.

Option D — Store in tenant_backup_policies

Rejected because:

Storage
    ↓
Primary operational storage


Backup
    ↓
Recovery copy / retention policy

Combining them would make it difficult to distinguish primary storage from backup infrastructure.

Option E — Store in tenant_integrations.configuration

Rejected because an integration registry answers:

Which external systems does the tenant connect to?

while storage settings answer:

How should the platform store the tenant's data?

Storage is core tenant infrastructure rather than merely an arbitrary third-party integration.

Option F — Dedicated tenant_storage_settings
Chosen

It provides:

Explicit tenant ownership.
Dedicated storage policy.
Quota management.
Object-storage configuration.
Security boundary.
Provider abstraction.
Dedicated cache.
Dedicated audit events.
Clear separation from documents, usage, and backups.
Option G — Store Credentials Directly

Rejected.

Preferred:

tenant_storage_settings
        ↓
credential_reference
        ↓
Secret Manager
23. Final Design Assessment

Because the original Table 26 assessment was not found, this is a proposed architectural assessment.

| Attribute | Rating |
| --- | --- |
| Complexity | Medium |
| Read Volume | High |
| Write Volume | Very Low |
| Security Importance | Critical |
| Business Criticality | Very High |
| Scalability | Excellent |
| Infrastructure Sensitivity | Critical |
| Recommended Status | Core Tenant Infrastructure Configuration Table |
Overall Assessment

tenant_storage_settings is the tenant-scoped storage configuration boundary within Tenant Management.

Its architectural position is:

                         TENANT
                            │
                            │ owns
                            ▼
                ┌──────────────────────────┐
                │ tenant_storage_settings  │
                ├──────────────────────────┤
                │ storage_provider         │
                │ storage_type             │
                │ bucket_name              │
                │ storage_namespace        │
                │ region                   │
                │ quota_bytes              │
                │ max_object_size_bytes   │
                │ encryption_enabled       │
                │ versioning_enabled       │
                │ credential_reference     │
                │ status                   │
                └────────────┬─────────────┘
                             │
                             ▼
                      STORAGE SERVICE
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
             Object Storage      Provider Adapter
                    │
                    ▼
             Tenant Objects
Relationship With Adjacent Module 1 Tables

The separation of responsibilities should remain:

tenants
   │
   ├── tenant_data_regions
   │       ↓
   │   Where tenant data should reside
   │
   ├── tenant_storage_settings
   │       ↓
   │   How tenant storage is configured
   │
   ├── tenant_backup_policies
   │       ↓
   │   How tenant data is backed up/recovered
   │
   ├── tenant_usage_limits
   │       ↓
   │   Licensed resource limits
   │
   ├── tenant_usage_counters
   │       ↓
   │   Actual resource consumption
   │
   └── tenant_provisioning_logs
           ↓
       Provisioning history

This distinction is particularly important.

For example:

tenant_storage_settings
    quota = 500 GB

does not mean:

tenant_usage_counters
    used = 500 GB

The first is configuration.

The second is actual consumption.

Storage Configuration Lifecycle
             Tenant Provisioned
                    │
                    ▼
             NOT CONFIGURED
                    │
                    ▼
               PROVISIONING
                    │
                    ▼
                VALIDATION
                 /       \
                /         \
             FAIL         PASS
              │             │
              ▼             ▼
           FAILED         ACTIVE
                            │
                   ┌────────┴────────┐
                   ▼                 ▼
                UPDATE           SUSPEND
                   │                 │
                   ▼                 ▼
                ACTIVE          SUSPENDED
                                     │
                                     ▼
                                  ARCHIVED

The exact state machine is proposed because the original Table 26 lifecycle definition is unavailable.

Storage Architecture
┌──────────────────────┐
│ Tenant Operation     │
│                      │
│ Policy / Claim /     │
│ Customer / AI        │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Document / Storage   │
│ Service              │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────┐
│ tenant_storage_settings      │
│                              │
│ tenant_id                    │
│ storage_provider             │
│ storage_type                 │
│ bucket_name                  │
│ storage_namespace            │
│ region                       │
│ quota_bytes                  │
│ max_object_size              │
│ encryption_enabled           │
│ versioning_enabled           │
│ credential_reference         │
│ status                       │
└──────────────┬───────────────┘
               │
               ▼
       ┌───────────────┐
       │ Secret Manager│
       └───────┬───────┘
               │
               ▼
       ┌───────────────┐
       │ Provider      │
       │ Adapter       │
       └───────┬───────┘
               │
               ▼
        Object Storage
               │
               ▼
       Tenant Documents
Critical Production Invariants
Every storage configuration belongs to exactly one tenant.
tenant_id references tenants.id.
A tenant has at most one current storage configuration under the proposed model.
UNIQUE(tenant_id) should enforce one current configuration if no versioning model is introduced.
Storage configuration must remain tenant-isolated.
Tenant A must never access Tenant B's storage namespace.
Storage quotas are configuration, not actual usage.
Actual storage consumption must be tracked separately.
storage_provider identifies infrastructure but is not a business key.
storage_type explicitly identifies the storage mechanism.
Provider credentials must not be stored as plaintext database configuration.
credential_reference should point to secure secret-management infrastructure.
Credential rotation must be supported.
Storage configuration does not represent individual files.
Storage configuration does not represent document metadata.
Storage configuration does not represent backup execution history.
Storage configuration does not replace tenant_data_regions.
Storage configuration does not replace tenant_backup_policies.
Storage configuration does not replace usage counters.
Encryption configuration must be validated against actual infrastructure rather than assumed to be effective merely because a database flag is true.
Storage configuration changes require appropriate RBAC authorization.
Quota changes should be auditable.
Provider changes should be auditable.
Credential changes should be auditable without exposing the credential itself.
Redis is a performance cache; PostgreSQL remains authoritative.
Cache keys must contain tenant identity.
Configuration changes must invalidate stale cached storage settings.
Storage-object access must enforce tenant isolation independently of configuration lookup.
Physical storage migration must not be inferred merely from changing storage_provider.
Storage decommissioning should be a controlled workflow rather than an automatic consequence of deleting a configuration row.
bucket_name and storage_namespace should not be assumed globally unique unless the actual provider/infrastructure contract requires it.
The exact original Table 26 field list, enums, indexes, lifecycle, and events were not available in the surviving source.
Proposed implementation decisions must remain clearly distinguishable from source-derived requirements.
The table should remain focused on the question: “How is this tenant's storage configured and constrained?”
Source Integrity Note

The available source definitively establishes Table 26 — tenant_storage_settings — “Storage quotas and object storage configuration.” It also establishes Storage Configuration as a core Tenant Management capability.

The wider schema establishes separate tenant data-region, backup-policy, usage-limit, and usage-counter concepts, which is why this design deliberately keeps those responsibilities separate.

The original detailed Table 26 physical schema was not recoverable from the available files.

Therefore, the following distinction must be preserved:

SOURCE
  │
  ├── Table 26 exists
  ├── Name = tenant_storage_settings
  ├── Purpose = storage quotas and object storage configuration
  ├── Tenant Management domain
  └── Storage configuration capability
          │
          ▼
PROPOSED RECONSTRUCTION
  │
  ├── Physical fields
  ├── Constraints
  ├── Enums
  ├── Indexes
  ├── Lifecycle
  ├── Caching
  ├── Security implementation
  └── Audit/event model

No missing requirement has been silently represented as an original source requirement.

Step 3 — Table 26 is complete. No .md file has been created in this response.
