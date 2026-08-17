Step 3 — Table 25: tenant_sms_settings

The Module 1 inventory establishes Table 25 as tenant_sms_settings, with the purpose “SMS provider configuration.”

The Tenant Management module explicitly identifies Email/SMS configuration as one of its capabilities. The broader InsureIQ requirements establish the platform as a multi-tenant SaaS system in which each insurer operates within an isolated tenant context.

The available source material does not contain a surviving detailed Table 25 schema specification with the original field list, exact enums, constraints, indexes, lifecycle, or audit events.

Therefore, consistent with the anti-degradation rule established for this project:

Source-established: Table 25 exists, is named tenant_sms_settings, represents SMS provider configuration, belongs to Tenant Management, and participates in tenant-specific configuration.
Proposed reconstruction: The physical schema, exact field names, enum values, constraints, indexes, caching, lifecycle states, and audit events below are explicitly proposed where the original Table 25 specification is unavailable.
No proposed field is presented as if it were recovered source material.
1. Why This Table Exists

The tenant_sms_settings table stores the SMS delivery configuration for an individual tenant.

InsureIQ is designed as a multi-tenant insurance SaaS platform. Each insurer may need its own SMS provider, sender identity, credentials, regional routing, and delivery configuration.

The module inventory explicitly defines:

tenant_sms_settings
        ↓
SMS provider configuration

and identifies Email/SMS configuration as a Tenant Management capability.

The table therefore establishes this boundary:

InsureIQ
    │
    ▼
Tenant
    │
    ▼
SMS Configuration
    │
    ▼
SMS Provider
    │
    ▼
Recipient
The Problem It Solves

Without a dedicated SMS configuration entity, SMS configuration could be placed inside:

tenants
tenant_settings
tenant_integrations

This would mix fundamentally different responsibilities.

For example:

Tenant Identity
      ≠
General Tenant Settings
      ≠
SMS Delivery Infrastructure
      ≠
External Integration Registry

A dedicated table allows the platform to manage:

SMS provider selection.
SMS delivery method.
Sender identity.
Provider endpoint.
Provider credential reference.
Regional/provider configuration.
Enablement/disablement.
Tenant-specific SMS delivery behavior.
Why SMS Configuration Is Tenant-Specific

Consider:

Tenant A
    ↓
ABC Insurance
    ↓
SMS Provider A
    ↓
Sender ID: ABCINS

while:

Tenant B
    ↓
XYZ Insurance
    ↓
SMS Provider B
    ↓
Sender ID: XYZINS

The platform cannot assume that every tenant should share:

provider
credentials
sender identity
country routing
API endpoint
messaging configuration

Therefore SMS delivery configuration must be tenant-scoped.

2. Business Definition

A Tenant SMS Settings record represents the configuration required for InsureIQ to send SMS messages on behalf of a tenant.

It defines how the platform communicates with an external SMS provider for that tenant.

Conceptually:

Tenant
   │
   └── SMS Settings
          │
          ├── Provider
          ├── Delivery Method
          ├── Sender Identity
          ├── Provider Endpoint
          ├── Credential Reference
          ├── Regional Configuration
          └── Operational Status

The settings may be consumed by:

Authentication services.
Notification services.
Policy services.
Claims services.
Billing services.
Workflow services.
Customer communication services.
Business Examples

SMS may be used for:

OTP delivery
Account security alerts
Claim status notifications
Policy renewal reminders
Payment notifications
Appointment reminders
Underwriting notifications
Operational alerts

The exact notification catalog is outside this table.

What This Table Represents

It represents:

How InsureIQ should deliver SMS for this tenant.

It does not represent:

An individual SMS message.
An SMS template.
An SMS delivery attempt.
A user phone number.
An OTP itself.
An SMS conversation.
A notification preference.
A messaging campaign.
A communication history.

Those are separate concerns.

3. Critical Design Principle — What the Entity IS and IS NOT
The Tenant SMS Settings IS
Tenant-owned SMS infrastructure configuration.
A configuration entity.
A child configuration of the Tenant domain.
A provider abstraction.
A security-sensitive configuration boundary.
A reusable configuration consumed by communication services.
The Tenant SMS Settings IS NOT
An SMS message.
An SMS template.
A user phone number.
An OTP.
A notification record.
A delivery attempt.
An SMS conversation.
A messaging campaign.
A provider credential itself.

The architectural distinction is:

tenant_sms_settings
        ↓
How SMS is delivered


sms_messages / sms_delivery_logs
        ↓
What was sent and what happened
Critical Security Boundary

SMS-provider credentials can be highly sensitive.

A compromised credential may allow an attacker to:

send fraudulent messages
impersonate a tenant
consume provider credits
abuse the tenant's messaging account

Therefore credentials should preferably be represented as:

credential_reference
        ↓
Secret Manager
        ↓
Actual Secret

rather than:

smtp_password
api_secret

stored directly in plaintext.

4. Aggregate Root Analysis — DDD Structure

The Tenant Management domain contains multiple tenant-owned configuration entities:

Tenant
├── Tenant Profile
├── Tenant Addresses
├── Tenant Contacts
├── Tenant Domains
├── Tenant Branding
├── Tenant Settings
├── Tenant Locales
├── Tenant Features
├── Tenant Modules
├── Tenant Subscription
├── Tenant Security Settings
├── Tenant Data Regions
├── Tenant Backup Policies
├── Tenant Integrations
├── Tenant Webhooks
├── Tenant Email Settings
├── Tenant SMS Settings
└── Tenant Storage Settings

Therefore:

Tenant Aggregate Root
        │
        └── TenantSmsSettings
Aggregate Relationship

The recommended relationship is:

Tenant
  │
  └── 0..1 current SMS configuration

A tenant may initially have no SMS provider configured.

Once configured, it should have one current effective configuration.

Why It Belongs Under Tenant

The provider configuration exists to serve the tenant's communication infrastructure.

For example:

Tenant A
   ↓
SMS Sender
   ↓
Provider A

must not accidentally become:

Tenant B
   ↓
Provider A

unless that sharing is explicitly modeled and authorized.

5. Business Capabilities Supported
| Capability | Supported |
| --- | --- |
| Tenant-specific SMS delivery | Yes |
| SMS provider configuration | Yes |
| Sender identity configuration | Yes |
| Provider endpoint configuration | Yes |
| Provider credential reference | Yes |
| SMS delivery enablement | Yes |
| Regional/provider routing configuration | Yes |
| SMS message history | No — separate concern |
| SMS template management | No — separate concern |
| User phone-number management | No — separate concern |
| OTP storage | No — separate concern |
| SMS delivery-attempt history | No — separate concern |
Tenant-Specific Delivery

The table allows:

Authenticated Tenant
        ↓
Tenant SMS Settings
        ↓
SMS Provider
        ↓
Recipient
Sender Identity

The tenant may have a provider-approved sender identity such as:

ABCINS

or an approved originating number.

The exact sender mechanism depends on provider and destination country.

Provider Abstraction

Business services should not need to know provider-specific APIs.

Instead:

Business Service
      ↓
SMS Service
      ↓
Tenant SMS Settings
      ↓
Provider Adapter
      ↓
SMS Provider

This allows providers to be changed without rewriting business modules.

6. Multi-Tenant / Ownership / Isolation Notes

Every SMS configuration belongs to exactly one tenant.

tenant_sms_settings.tenant_id
              ↓
           tenants.id
Tenant Isolation

Tenant A's SMS configuration must never be used for Tenant B's messages.

Incorrect:

Tenant B Message
       ↓
Tenant A SMS Credentials
       ↓
Tenant A Sender

Correct:

Tenant B Message
       ↓
Tenant B SMS Settings
       ↓
Tenant B Provider
       ↓
Tenant B Sender
Credential Isolation

A credential reference belonging to:

Tenant A

must not be resolved in:

Tenant B

context.

Sender Isolation

Sender identities must remain tenant-scoped.

This is particularly important because SMS sender identity can affect customer trust and regulatory compliance.

Application Access Pattern
SELECT *
FROM tenant_sms_settings
WHERE tenant_id = :authenticated_tenant_id;

Tenant identity should come from authenticated context.

It should not be trusted solely from arbitrary client-provided parameters.

7. Lifecycle

The proposed lifecycle is:

Not Configured
       ↓
Configured
       ↓
Validated
       ↓
Active
       ↓
Updated / Rotated
       ↓
Disabled
       ↓
Archived

These lifecycle states are proposed, not recovered from the original Table 25 source.

Creation

A newly provisioned tenant may initially have:

Not Configured

because SMS is not necessarily required during initial tenant creation.

Configuration

An administrator supplies:

Provider
Delivery Method
Sender Identity
Endpoint
Credential Reference
Regional Configuration
Validation

The configuration should be validated before activation.

Potential checks include:

Provider credentials.
API connectivity.
Sender identity.
Provider account status.
Destination-country support.
Sender registration.
Required provider configuration.

The exact validation workflow depends on the SMS provider.

Activation

After successful validation:

SMS Settings
      ↓
ACTIVE

The SMS service can use the configuration.

Modification

Configuration may change when:

Provider changes.
Credentials rotate.
Sender identity changes.
API endpoint changes.
Regional routing changes.

All sensitive changes should be auditable.

Disablement

A tenant can disable SMS without deleting its configuration.

This is important because SMS may be temporarily disabled for:

cost control
provider outage
compliance issue
configuration maintenance
Archival

Retired configurations should generally be retained where audit/history requirements apply.

The current table should represent the current configuration unless explicit versioning is introduced.

8. Proposed Schema
Table Name

tenant_sms_settings

Primary Key Strategy

UUID

The Tenant Management schema convention uses UUID-based identities for tenant-owned entities.

Full Field-by-Field Schema Definition

The original detailed Table 25 field list is not available in the surviving source material. The following is therefore a proposed reconstruction.

| Field Name | Data Type | Key Type | Specification | Reason Field Exists |
| --- | --- | --- | --- | --- |
| id | UUID | PK | NOT NULL | Stable identity of the SMS configuration |
| tenant_id | UUID | FK → tenants.id | NOT NULL, UNIQUE | Establishes ownership and one current configuration per tenant |
| provider_name | VARCHAR(100) | — | NOT NULL | Identifies the SMS provider |
| delivery_method | ENUM | — | NOT NULL | Identifies the provider communication mechanism |
| api_endpoint | TEXT | — | NULL | Stores provider API endpoint when API delivery is used |
| credential_reference | VARCHAR(255) | — | NULL | References securely managed provider credentials |
| sender_type | ENUM | — | NOT NULL | Defines the kind of sender identity used by the provider |
| sender_identity | VARCHAR(100) | — | NOT NULL | Stores the provider-approved sender identity |
| country_code | VARCHAR(8) | — | NULL | Supports country/region-specific provider configuration |
| configuration | JSONB | — | NULL | Stores provider-specific non-secret settings |
| status | ENUM | — | NOT NULL | Represents configuration lifecycle/operational state |
| created_at | TIMESTAMPTZ | — | NOT NULL | Records configuration creation |
| updated_at | TIMESTAMPTZ | — | NOT NULL | Records the latest configuration change |
id

Provides stable technical identity.

Which SMS configuration record is this?
tenant_id

Defines ownership:

tenant_sms_settings.tenant_id
        ↓
tenants.id

The proposed uniqueness constraint:

UNIQUE(tenant_id)

enforces one current configuration per tenant.

provider_name

Identifies the external SMS provider.

The exact provider catalog is not established by the source.

delivery_method

Separates communication mechanisms.

A provider may expose:

API

or another provider-specific mechanism.

The exact supported methods must be defined by the provider adapter architecture.

api_endpoint

Stores the provider endpoint where applicable.

It allows the provider integration to remain configurable without hardcoding every endpoint into application code.

credential_reference

References a secure credential rather than storing the credential itself.

Conceptually:

tenant_sms_settings
        │
        └── credential_reference
                  ↓
             Secret Manager
                  ↓
              SMS Secret
sender_type

Different SMS providers and regions may use different sender mechanisms.

Examples:

alphanumeric_sender
phone_number
short_code
toll_free_number

These are proposed values.

sender_identity

Stores the actual provider-approved sender identifier.

For example:

ABCINS

or:

+14155550100

depending on provider and country.

country_code

Supports country-specific configuration.

This becomes important when a tenant sends messages to multiple countries and provider rules differ by destination.

However, a single global configuration may be sufficient for an initial implementation.

Therefore this field should only be retained if the actual provider architecture requires country-specific behavior.

configuration

Stores provider-specific non-secret options.

Possible examples:

region
API version
timeout
messaging service identifier
delivery settings
provider-specific flags

Secrets must not be placed here in plaintext.

status

Represents whether the SMS configuration can currently be used.

9. Enum Definitions

The original Table 25 enum definitions are unavailable.

The following are proposed controlled values.

delivery_method
| Value | Description |
| --- | --- |
| api | SMS delivered through provider API |
| custom | Provider-specific communication mechanism |
sender_type
| Value | Description |
| --- | --- |
| alphanumeric_sender | Alphanumeric sender identity |
| phone_number | Registered originating phone number |
| short_code | Registered short-code sender |
| toll_free_number | Registered toll-free originating number |

Not every provider or country supports every sender type.

status
| Value | Description |
| --- | --- |
| pending | Configuration exists but has not been validated |
| active | Configuration is available for SMS delivery |
| inactive | Configuration is intentionally disabled |
| failed | Provider/configuration validation or operation has failed |
| archived | Configuration has been retired |

These values are proposed rather than source-recovered.

10. Why credential_reference Exists

SMS providers normally require authentication.

Depending on the provider, this can involve:

API key
API secret
Bearer token
OAuth credential
Account credential

Storing these directly in:

tenant_sms_settings

would create a high-value secret repository.

Instead:

tenant_sms_settings
       │
       └── credential_reference
                 ↓
           Secret Manager

provides a clean separation between:

Configuration

and:

Secrets
Why Not api_key?

A field such as:

api_key

would unnecessarily couple the table to one authentication mechanism.

A provider may later use:

OAuth
service account
managed identity
API key

A reference is therefore more extensible.

Credential Rotation

The logical reference can remain stable while the underlying secret changes:

Credential Reference
        ↓
Old Secret
        ↓
Rotation
        ↓
New Secret

This avoids unnecessary schema changes during credential rotation.

11. Candidate Keys
| Key Type | Field(s) | Rationale |
| --- | --- | --- |
| Primary Key | id | Stable technical identity |
| Candidate Key | tenant_id | One current SMS configuration per tenant |
Why Not provider_name?

Many tenants can use the same provider:

Tenant A → Provider X
Tenant B → Provider X
Tenant C → Provider X

Therefore:

provider_name

cannot be globally unique.

Why Not sender_identity?

The same sender identifier can potentially exist under different tenants or providers.

It therefore cannot safely serve as the table's global identity.

12. Constraints
| Constraint | Definition | Reason |
| --- | --- | --- |
| Primary Key | PK(id) | Stable configuration identity |
| Tenant FK | tenant_id → tenants.id | Establishes ownership |
| One Current Configuration | UNIQUE(tenant_id) | Prevents ambiguous current configurations |
| Provider | NOT NULL | Provider must be identified |
| Delivery Method | NOT NULL | Delivery mechanism must be explicit |
| Sender Type | NOT NULL | Sender mechanism must be known |
| Sender Identity | NOT NULL | Provider requires an originating identity |
| Status | NOT NULL | Configuration lifecycle must be known |
| Credential Reference | Nullable | Provider may support alternative authentication |
| API Endpoint | Nullable | Provider-specific |
| Country Code | Nullable | Only needed for region-specific configuration |
| Configuration | Nullable | Provider-specific options |
| Timestamps | NOT NULL | Lifecycle tracking |
Conditional Constraints

Recommended domain-level rules include:

delivery_method = api
        →
api_endpoint must exist

and:

sender_type = phone_number
        →
sender_identity must contain a valid provider-approved number

and:

sender_type = alphanumeric_sender
        →
sender_identity must satisfy provider/country rules

These are domain/application constraints unless the implementation chooses to encode a subset directly in the database.

13. Relationships
Incoming References / Logical Consumers

The SMS configuration is logically consumed by:

SMS Service.
Notification Service.
Authentication Service.
Policy Service.
Claims Service.
Billing Service.
Workflow Engine.
Monitoring Service.
Audit Service.
Outgoing References

The explicit relational relationship is:

tenant_id → tenants.id

The credential reference is a logical dependency on secret-management infrastructure.

SMS Service

Primary runtime consumer:

Business Event
      ↓
SMS Service
      ↓
Tenant SMS Settings
      ↓
Provider Adapter
      ↓
SMS Provider
Authentication Service

May use SMS for:

OTP
MFA
Security Alerts
Account Verification

The identity domain remains responsible for authentication semantics; this table only supplies delivery infrastructure.

Notification Service

Uses the tenant's SMS configuration for notification delivery.

Policy Service

May generate:

Policy Notifications
Renewal Reminders
Policy Status Alerts
Claims Service

May generate:

Claim Received
Claim Status Changed
Claim Decision
Billing Service

May generate:

Payment Reminder
Payment Confirmation
Billing Alert
Workflow Engine

May invoke SMS as a workflow action.

14. Cardinality Analysis

The recommended cardinality is:

Tenant
   ↓
0..1 current SMS configuration
| Relationship | Expected Cardinality |
| --- | --- |
| Tenant → SMS Settings | 0–1 |
| SMS Settings → Tenant | Exactly 1 |
| Provider → Tenants | 0–N |
| Sender Type → Settings | 0–N |
| Status → Settings | 0–N |
Why 0–1?

SMS may be optional for a tenant.

Therefore:

Tenant Created
      ↓
No SMS Provider

is valid.

Later:

Tenant
      ↓
SMS Configuration

can be created.

Why Not 1:N?

Allowing several current configurations without explicit priority would make runtime behavior ambiguous.

For example:

Provider A
Provider B
Provider C

raises:

Which provider should be used?

If failover becomes necessary, introduce explicit routing semantics rather than allowing uncontrolled duplicate configurations.

For example:

primary
secondary
priority

could be introduced in a future version.

15. Query Patterns
Retrieve Tenant SMS Configuration
SELECT *
FROM tenant_sms_settings
WHERE tenant_id = :tenant_id;

This is the primary runtime query.

Retrieve Active Configuration
SELECT *
FROM tenant_sms_settings
WHERE tenant_id = :tenant_id
AND status = 'active';
Find Configurations Using a Provider
SELECT tenant_id, provider_name
FROM tenant_sms_settings
WHERE provider_name = :provider_name;

Useful for provider migration and operational analysis.

Find Disabled SMS Configurations
SELECT tenant_id, provider_name
FROM tenant_sms_settings
WHERE status = 'inactive';
Find Failed Configurations
SELECT tenant_id, provider_name
FROM tenant_sms_settings
WHERE status = 'failed';
Find Configurations Requiring Validation
SELECT tenant_id, provider_name
FROM tenant_sms_settings
WHERE status = 'pending';
Find Configurations by Sender Type
SELECT tenant_id, provider_name, sender_identity
FROM tenant_sms_settings
WHERE sender_type = :sender_type;

Useful for provider/country operational analysis.

Find Region-Specific Configurations
SELECT tenant_id, provider_name, country_code
FROM tenant_sms_settings
WHERE country_code = :country_code;

Only relevant if country-specific configuration is adopted.

16. Index Strategy

Recommended indexes:

| Index | Purpose |
| --- | --- |
| PK(id) | Direct identity lookup |
| UNIQUE(tenant_id) | One configuration per tenant |
| INDEX(provider_name) | Provider analysis |
| INDEX(status) | Operational filtering |
| INDEX(delivery_method) | Delivery mechanism filtering |
| INDEX(country_code) | Regional configuration analysis |
Primary Key
PRIMARY KEY(id)
Tenant Unique Index
UNIQUE(tenant_id)

This is the most important index because runtime delivery begins with tenant context.

Provider Index
INDEX(provider_name)

Useful for:

Provider migration.
Provider usage analysis.
Operational reporting.
Status Index
INDEX(status)

Supports:

active
inactive
failed
pending

queries.

Country Index

If regional configuration is actually used:

INDEX(country_code)

can support country-specific operational analysis.

If every tenant has only one global configuration and country-specific routing is handled elsewhere, this index should be omitted.

Do Not Over-Index

Avoid unnecessary indexes on:

sender_identity
api_endpoint
credential_reference
configuration

unless actual query workloads justify them.

17. Read / Write Characteristics

The expected workload is:

| Operation | Volume | Notes |
| --- | --- | --- |
| Reads | High | SMS delivery resolves configuration frequently |
| Writes | Very Low | Provider configuration changes infrequently |
| Updates | Low | Credential/provider/sender changes |
| Deletes | Very Low | Disable/archive preferred |
Reads — High

SMS may be triggered by many parts of InsureIQ:

Authentication
Notifications
Policies
Claims
Billing
Workflow

Therefore configuration reads can become frequent.

Writes — Very Low

Typical writes are:

Initial configuration
Provider migration
Sender change
Credential rotation
Enable/disable
Operational State

Unlike a delivery-history table, this configuration table should not be updated for every individual SMS delivery.

High-frequency delivery metrics belong in:

SMS Delivery History

or an observability/event system.

This keeps tenant_sms_settings relatively static and cache-friendly.

18. Caching Strategy

Recommended Redis key:

tenant-sms-settings:{tenant_id}

Example:

tenant-sms-settings:abc123
Cached Data

Potentially cache:

provider_name
delivery_method
api_endpoint
credential_reference
sender_type
sender_identity
country_code
configuration
status

Actual secret material should never be copied into the cache merely for convenience.

Cache Lookup
SMS Request
      ↓
Tenant ID
      ↓
Redis
tenant-sms-settings:{tenant_id}
      ↓
SMS Service
      ↓
Provider Adapter
Cache Miss
Redis Miss
    ↓
PostgreSQL
    ↓
tenant_sms_settings
    ↓
Populate Redis
Cache Invalidation

When configuration changes:

Database Update
      ↓
TenantSmsSettingsUpdated
      ↓
Invalidate
tenant-sms-settings:{tenant_id}
Credential Rotation

Credential rotation should invalidate any provider client or credential cache associated with the tenant.

Credential Rotated
       ↓
Invalidate Provider Client
       ↓
Reload Credential Reference
Database Remains Authoritative
PostgreSQL
     ↓
Source of Truth


Redis
     ↓
Performance Cache

This is consistent with the broader schema design principle that configuration data remains authoritative in the relational database while caches provide acceleration.

19. Security Considerations

SMS configuration is a high-security tenant configuration domain.

A compromised configuration could allow an attacker to send messages using the tenant's identity or consume the tenant's provider resources.

1. Tenant Isolation

All configuration access must be tenant-scoped.

2. Secret Management

Never store plaintext:

API keys
API secrets
Bearer tokens
provider passwords
OAuth secrets

in ordinary columns.

Use secure secret management.

3. Encryption at Rest

Sensitive configuration that must remain in the database should be encrypted appropriately.

4. Encryption in Transit

Provider API communication should use:

HTTPS / TLS

for production.

5. Sender Authorization

The platform must not allow a tenant to arbitrarily impersonate another organization's sender identity.

Provider registration and sender verification requirements must be respected.

6. Regional Compliance

SMS sender requirements vary by country.

The platform should not assume:

one sender type
one routing model
one registration requirement

works globally.

7. RBAC

Only authorized tenant administrators should be able to change:

Provider.
Sender identity.
Delivery method.
Provider endpoint.
Credential reference.
Status.
Regional configuration.
8. Credential Rotation

Provider credentials should be rotatable without requiring destructive reconfiguration.

9. Audit Logging

Security-sensitive changes must be auditable.

10. Secret Exposure Prevention

Secrets must not appear in:

API responses
logs
audit events
exception messages
Redis values
debug output
11. SMS Abuse Prevention

The SMS service should enforce platform-level controls such as:

Rate limits.
Per-tenant quotas.
Destination restrictions.
Abuse detection.
Provider spend controls.

These controls belong to the SMS delivery subsystem rather than the configuration table.

20. Audit Requirements

The original Table 25 audit event list is unavailable.

The following are recommended audit events:

| Event | Trigger | Purpose |
| --- | --- | --- |
| TenantSmsSettingsCreated | Initial SMS configuration created | Establish configuration provenance |
| TenantSmsSettingsUpdated | Configuration changed | Record modifications |
| TenantSmsSettingsActivated | Configuration enabled | Record activation |
| TenantSmsSettingsDisabled | Configuration disabled | Record disablement |
| TenantSmsSettingsValidationFailed | Provider/configuration validation fails | Record configuration failure |
| TenantSmsCredentialRotated | Credential reference changed | Record security-sensitive rotation |
| TenantSmsProviderChanged | Provider changes | Record provider migration |
Audit Payload

Recommended fields:

tenant_id
actor_id
configuration_id
event_type
timestamp
changed_fields

Do not include:

API key
API secret
Bearer token
provider password
private credential
Credential Rotation Example

Do not record:

api_secret = "..."

Record:

credential_reference changed

This preserves accountability without exposing credentials.

21. Event Producers / Event Consumers
Producers

Recommended domain events:

TenantSmsSettingsCreated
TenantSmsSettingsUpdated
TenantSmsSettingsActivated
TenantSmsSettingsDisabled
TenantSmsSettingsValidationFailed
TenantSmsCredentialRotated
TenantSmsProviderChanged

These are proposed because the original Table 25 event definitions are unavailable.

Producer Flow
Tenant Administrator
        ↓
Tenant Administration UI
        ↓
SMS Configuration API
        ↓
SMS Configuration Service
        ↓
tenant_sms_settings
        ↓
Domain Event
Consumers

Logical consumers include:

SMS Service.
Notification Service.
Authentication Service.
Monitoring Service.
Cache Manager.
Audit Service.
Configuration Update Flow
Administrator
      ↓
SMS Configuration API
      ↓
RBAC Validation
      ↓
Provider Validation
      ↓
Database Update
      ↓
TenantSmsSettingsUpdated
      │
      ├── SMS Service
      ├── Cache Manager
      ├── Monitoring
      └── Audit Service
SMS Delivery Flow
Business Event
      ↓
Notification / Business Service
      ↓
SMS Service
      ↓
Tenant Resolution
      ↓
Redis Cache
      │
      └── Miss → PostgreSQL
      ↓
Tenant SMS Settings
      ↓
Provider Adapter
      ↓
SMS Provider
      ↓
Recipient
Authentication SMS Flow
Authentication Request
        ↓
OTP / MFA Challenge
        ↓
SMS Service
        ↓
Tenant SMS Settings
        ↓
Provider Adapter
        ↓
SMS Provider
        ↓
User Phone

The OTP itself belongs to the Identity & Access Management domain, not to tenant_sms_settings.

22. Alternative Designs Considered
| Option | Description | Verdict |
| --- | --- | --- |
| A | Store SMS configuration directly in tenants | Rejected |
| B | Store it in tenant_settings | Rejected |
| C | Store it inside tenant_integrations.configuration | Rejected |
| D | JSON-only SMS configuration | Rejected |
| E | Dedicated tenant_sms_settings table | Chosen |
| F | Store provider secrets directly in the table | Rejected |
Option A — Store in tenants

Rejected because:

Tenant Identity

and:

SMS Infrastructure

are separate concerns.

Putting provider details directly into the tenant root would make the root increasingly infrastructure-specific.

Option B — Store in tenant_settings

Rejected because generic tenant settings and SMS provider infrastructure have different:

Security requirements.
Lifecycle.
Operational consumers.
Validation rules.
Caching requirements.
Option C — Store in tenant_integrations.configuration

Rejected because an integration registry and SMS delivery configuration answer different questions.

tenant_integrations:

Which external systems does the tenant connect to?

tenant_sms_settings:

How should InsureIQ deliver SMS for this tenant?

They may interact but should not be collapsed.

Option D — JSON-Only Configuration

Example:

{
  "provider": "...",
  "sender": "...",
  "credentials": "..."
}

Rejected as the primary relational representation because it weakens:

Tenant-level constraints.
Candidate keys.
Structured validation.
Operational queries.
Indexing.
Security boundaries.
Lifecycle management.

JSON can still be used for provider-specific non-secret configuration.

Option E — Dedicated tenant_sms_settings
Chosen

It provides:

Explicit tenant ownership.
One-current-configuration semantics.
Provider abstraction.
Sender configuration.
Dedicated security boundary.
Dedicated indexes.
Dedicated cache.
Dedicated audit events.
Separation from SMS messages and delivery history.
Option F — Store Provider Secrets Directly

Rejected.

For example:

api_key
api_secret

would make the relational table a sensitive secret store.

Preferred:

tenant_sms_settings
        ↓
credential_reference
        ↓
Secret Manager
23. Final Design Assessment

Because the original Table 25 assessment is unavailable, the following is a proposed architectural assessment.

| Attribute | Rating |
| --- | --- |
| Complexity | Medium |
| Read Volume | High |
| Write Volume | Very Low |
| Security Importance | Critical |
| Business Criticality | High |
| Scalability | Excellent |
| Recommended Status | Core Tenant Communication Configuration Table |
Overall Assessment

tenant_sms_settings is the tenant-scoped SMS-provider configuration boundary within the Tenant Management domain.

Its architectural position is:

                         TENANT
                            │
                            │ owns
                            ▼
                ┌─────────────────────────┐
                │   tenant_sms_settings   │
                ├─────────────────────────┤
                │ provider                │
                │ delivery_method         │
                │ endpoint                │
                │ credential_reference    │
                │ sender_type             │
                │ sender_identity         │
                │ country_code            │
                │ configuration           │
                │ status                  │
                └────────────┬────────────┘
                             │
                             ▼
                        SMS SERVICE
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
               Provider A        Provider B
                    │                 │
                    └────────┬────────┘
                             ▼
                          Recipient
Relationship With Adjacent Tenant Configuration Tables

The separation of responsibilities is:

tenants
   │
   ├── tenant_branding
   │       ↓
   │   How the tenant looks
   │
   ├── tenant_integrations
   │       ↓
   │   External systems connected to tenant
   │
   ├── tenant_webhooks
   │       ↓
   │   Where tenant events are delivered
   │
   ├── tenant_email_settings
   │       ↓
   │   How tenant email is delivered
   │
   ├── tenant_sms_settings
   │       ↓
   │   How tenant SMS is delivered
   │
   └── tenant_storage_settings
           ↓
       How tenant files are stored

This separation prevents communication infrastructure from being hidden inside generic tenant configuration.

SMS Configuration Lifecycle
             Tenant Provisioned
                    │
                    ▼
             NOT CONFIGURED
                    │
                    ▼
               CONFIGURED
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
                UPDATE           DISABLE
                   │                 │
                   ▼                 ▼
                ACTIVE           INACTIVE
                                     │
                                     ▼
                                  ARCHIVED

The exact state machine is proposed because the original Table 25 lifecycle specification was not found.

SMS Delivery Architecture
┌──────────────────────┐
│ Business Operation   │
│                      │
│ Identity / Policy /  │
│ Claims / Billing     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Notification /       │
│ Business Service     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│      SMS Service     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────┐
│ tenant_sms_settings          │
│                              │
│ tenant_id                    │
│ provider_name                │
│ delivery_method              │
│ sender_type                  │
│ sender_identity              │
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
          SMS Provider
               │
               ▼
            Recipient
Critical Production Invariants
Every SMS configuration belongs to exactly one tenant.
tenant_id references tenants.id.
A tenant has at most one current SMS configuration under the proposed model.
UNIQUE(tenant_id) should enforce that invariant if no versioning/failover model is introduced.
SMS configuration must remain tenant-isolated.
Tenant A's SMS provider configuration must never be used for Tenant B.
Sender identities must remain tenant-scoped.
provider_name is not a global business key.
delivery_method must explicitly identify the communication mechanism.
Provider credentials must not be stored as ordinary plaintext configuration.
credential_reference should point to secure secret-management infrastructure.
Credential rotation must be supported.
Sender identities must comply with provider and destination-country requirements.
SMS transport must use secure communication.
SMS configuration changes require appropriate RBAC authorization.
Sensitive SMS configuration changes must be auditable.
Audit events must never contain provider secrets.
Redis must never contain plaintext provider secrets.
PostgreSQL remains authoritative over SMS configuration.
SMS configuration is not an SMS message.
SMS configuration is not an SMS template.
SMS configuration is not an OTP.
SMS configuration is not a delivery-attempt history.
SMS delivery history should be represented separately if detailed delivery tracking is required.
User phone numbers belong to the Identity/Customer domains rather than this table.
User notification preferences belong outside this table.
tenant_integrations remains the general external-system registry.
Provider-specific non-secret configuration may be represented in JSON where justified.
High-frequency SMS delivery telemetry must not turn the configuration row into a delivery ledger.
If provider failover is required, explicit primary/secondary/priority semantics should be introduced.
Country-specific configuration should only be introduced if actual provider/regulatory requirements require it.
SMS abuse controls belong to the delivery subsystem rather than the configuration row.
The exact original Table 25 field list, enums, indexes, cardinality, and audit events were not available in the surviving source.
Proposed implementation decisions must remain clearly distinguishable from source-derived requirements.
Source Integrity Note

The source definitively establishes Table 25 — tenant_sms_settings — “SMS provider configuration” within Tenant Management. It also establishes Email/SMS configuration as a Tenant Management capability and places the platform within a strict multi-tenant architecture.

The original detailed Table 25 schema was not recoverable from the available files.

Accordingly, this documentation deliberately does not pretend that the proposed physical fields, enum values, indexes, lifecycle states, audit events, or caching strategy were present in the missing original specification.

The anti-degradation boundary is:

SOURCE
  │
  ├── Table 25 exists
  ├── Name = tenant_sms_settings
  ├── Purpose = SMS provider configuration
  ├── Tenant Management domain
  └── Tenant-specific configuration
          │
          ▼
PROPOSED RECONSTRUCTION
  │
  ├── Physical schema
  ├── Constraints
  ├── Indexes
  ├── Lifecycle
  ├── Caching
  ├── Security implementation
  └── Audit/event model

This preserves the distinction between what InsureIQ's source actually establishes and what is being proposed to complete the physical database design.

Step 3 — Table 25 is complete. No .md file has been created in this response.
