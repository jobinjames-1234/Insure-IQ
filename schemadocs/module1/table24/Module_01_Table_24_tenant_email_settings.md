Step 3 — Table 24: tenant_email_settings

The Module 1 inventory establishes Table 24 as tenant_email_settings, with the purpose “Email provider configuration.”

The Tenant Management module explicitly includes email/SMS configuration as part of the tenant-owned configuration domain. The broader InsureIQ requirements also establish that each insurer operates as an isolated tenant with its own configuration and branded experience.

However, unlike several earlier tables, I could not find a surviving detailed Table 24 source containing its original field-by-field schema, exact enums, indexes, cardinality, or audit-event definitions.

Therefore, to fight content degradation without creating false source claims, this documentation uses the following rule:

Established by source: Table name, business purpose, tenant ownership, email configuration role, multi-tenant isolation.
Proposed reconstruction: Physical fields, exact constraints, indexes, lifecycle states, cache key, audit events, and implementation-level details where the original Table 24 specification is unavailable.

This is intentionally explicit rather than silently presenting reconstructed material as recovered source content.

1. Why This Table Exists

The tenant_email_settings table stores the email delivery configuration for an individual tenant.

InsureIQ is a multi-tenant SaaS platform. Each insurance organization can require its own email-delivery configuration rather than using a single platform-wide configuration.

The Module 1 design explicitly identifies:

Email/SMS configuration

as a tenant-management capability.

The table therefore establishes the configuration boundary between:

InsureIQ Platform
        │
        ▼
Tenant
        │
        ▼
Email Configuration
        │
        ▼
Email Provider
The Problem It Solves

Without a dedicated tenant email configuration entity, email settings could be incorrectly placed in:

tenants
tenant_settings
tenant_integrations

This would mix different responsibilities.

For example:

Tenant Identity
    ≠
General Tenant Settings
    ≠
Email Delivery Configuration
    ≠
External Integration Registry

A dedicated table allows the platform to manage:

Email provider selection.
SMTP/API delivery configuration.
Sender identity.
Reply-to identity.
Provider endpoint configuration.
Enablement/disablement.
Tenant-specific email behavior.
Operational email configuration.
Why Email Configuration Is Tenant-Specific

Consider:

Tenant A
    ↓
ABC Insurance branded email
    ↓
ABC's email provider


Tenant B
    ↓
XYZ Insurance branded email
    ↓
XYZ's email provider

The platform cannot assume that both tenants should use:

same provider
same sender
same SMTP server
same credentials
same domain

Therefore email delivery configuration must remain tenant-scoped.

2. Business Definition

A Tenant Email Settings record represents the configuration required for InsureIQ to send email on behalf of a tenant.

It belongs to one tenant and defines how the tenant's outbound email should be delivered.

Conceptually:

Tenant
   │
   └── Email Settings
          │
          ├── Provider
          ├── Delivery Method
          ├── Sender Identity
          ├── Reply-To Identity
          ├── Provider Endpoint
          └── Operational Status

The tenant's email settings may be consumed by:

Authentication services.
Notification services.
Policy services.
Claims services.
Billing services.
Workflow services.
Customer communication services.
Business Examples

Email can be used for:

Account verification
Password reset
Policy issuance
Policy renewal reminder
Claim status update
Payment receipt
Billing notification
Underwriting notification
Administrative notification

The exact message catalog belongs to the notification/email domain rather than this configuration table.

What This Table Represents

It represents:

How InsureIQ should deliver email for this tenant.

It does not represent:

Individual email messages.
Email templates.
Email delivery attempts.
Email events.
Notification preferences of individual users.
Email campaign records.
Email attachments.
Email inboxes.

Those are separate concerns.

3. Critical Design Principle — What the Entity IS and IS NOT
The Tenant Email Settings IS
Tenant-owned email infrastructure configuration.
A configuration entity.
A child of the Tenant aggregate.
A delivery-provider abstraction.
A security-sensitive configuration boundary.
A reusable configuration consumed by multiple platform services.
The Tenant Email Settings IS NOT
An email message.
An email template.
A notification.
A user email address.
An SMTP credential itself.
A tenant integration registry.
A communication history table.
An email delivery log.

The distinction is:

tenant_email_settings
        ↓
How email is delivered


email_messages / delivery_logs
        ↓
What was sent and what happened
Critical Security Boundary

Provider credentials should not be treated as ordinary configuration.

The configuration record may identify:

credential reference

rather than storing:

SMTP password
API secret
private credential

in plaintext.

This is particularly important because email-provider credentials can potentially be abused to send messages impersonating a tenant.

4. Aggregate Root Analysis — DDD Structure

The Tenant aggregate contains multiple tenant-owned configuration entities:

Tenant
├── Tenant Profile
├── Tenant Addresses
├── Tenant Contacts
├── Tenant Branding
├── Tenant Settings
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
        └── TenantEmailSettings
Aggregate Relationship
Tenant
   │
   │ 1 : 1
   ▼
tenant_email_settings

A tenant should have one current effective email configuration.

If historical versions are eventually required, versioning should be deliberately introduced rather than accidentally allowing multiple active configurations.

Why It Belongs Under Tenant

Email settings are not globally owned by InsureIQ.

They are owned by the insurer/tenant whose communications are being delivered.

For example:

Tenant A
   ↓
Email Sender:
notifications@abcinsurance.com

must remain isolated from:

Tenant B
   ↓
Email Sender:
notifications@xyzinsurance.com
5. Business Capabilities Supported
| Capability | Supported |
| --- | --- |
| Tenant-specific email delivery | Yes |
| Email provider configuration | Yes |
| Sender identity configuration | Yes |
| Reply-to configuration | Yes |
| Provider endpoint configuration | Yes |
| Email delivery enablement | Yes |
| Provider credential reference | Yes |
| Email delivery history | No — separate concern |
| Email template management | No — separate concern |
| User notification preferences | No — separate concern |
Tenant-Specific Delivery

The table allows the platform to resolve:

Authenticated Tenant
        ↓
Tenant Email Settings
        ↓
Email Provider
        ↓
Recipient
Sender Identity

The tenant can have a configured sender identity such as:

ABC Insurance
notifications@abcinsurance.com

This supports the branded tenant experience required by the multi-tenant architecture. The requirements explicitly establish tenant-specific branding and branded customer-facing experiences.

Provider Abstraction

The platform should not need every business service to understand SMTP, API-based providers, or provider-specific protocols.

Instead:

Business Service
      ↓
Email Service
      ↓
Tenant Email Settings
      ↓
Provider Adapter
      ↓
Email Provider

This keeps provider-specific implementation behind the email delivery service.

6. Multi-Tenant / Ownership / Isolation Notes

Every email-settings record belongs to exactly one tenant.

tenant_email_settings.tenant_id
              ↓
           tenants.id

The recommended relationship is:

Tenant
  │
  └── exactly one current email configuration
Tenant Isolation

Tenant A's email configuration must never be used to send Tenant B's messages.

Incorrect:

Tenant B Message
       ↓
Tenant A SMTP Credentials
       ↓
Tenant A Sender

Correct:

Tenant B Message
       ↓
Tenant B Email Settings
       ↓
Tenant B Provider
       ↓
Tenant B Sender
Sender Isolation

Tenant-specific sender identities must remain tenant-scoped.

This prevents accidental cross-tenant impersonation.

Credential Isolation

Provider credentials must also be tenant-scoped.

A credential reference associated with:

Tenant A

must never be resolved under:

Tenant B
Application Access Pattern
SELECT *
FROM tenant_email_settings
WHERE tenant_id = :authenticated_tenant_id;

Tenant identity should come from the authenticated execution context rather than being trusted from arbitrary client input.

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

These states are proposed implementation states, because the surviving source does not provide an original Table 24 lifecycle enum.

Creation

When a tenant is provisioned, email settings may initially be:

Not Configured

The provisioning workflow can subsequently establish the tenant's email provider.

Configuration

An administrator supplies:

Provider
Delivery Method
Sender Identity
Reply-To
Endpoint
Credential Reference
Validation

The email service should validate the configuration before it becomes active.

Possible validation includes:

Provider connectivity.
Sender-domain verification.
Credential validity.
TLS configuration.
Provider API authentication.
SMTP connection verification.

The exact validation mechanism depends on the selected provider.

Activation

Once validated:

Email Settings
      ↓
ACTIVE

The email service may use the configuration.

Modification

Configuration may change when:

Provider changes.
Sender domain changes.
Credentials rotate.
SMTP endpoint changes.
API endpoint changes.
Reply-to address changes.

Changes should be auditable.

Disablement

A tenant may temporarily disable email delivery.

This is preferable to deleting configuration if the tenant may later reactivate it.

Archival

Historical configuration should be retained where required for audit purposes, but the current table should represent the active/current configuration unless explicit versioning is introduced.

8. Proposed Schema
Table Name

tenant_email_settings

Primary Key Strategy

UUID

The Module 1 design consistently uses tenant-owned tables with an id identity and a tenant_id ownership relationship.

Full Field-by-Field Schema Definition

Because the original Table 24 field list was not found, the following is a proposed reconstruction, not a claim that these exact fields appeared in the missing source.

| Field Name | Data Type | Key Type | Specification | Reason Field Exists |
| --- | --- | --- | --- | --- |
| id | UUID | PK | NOT NULL | Stable identity of the email-settings record |
| tenant_id | UUID | FK → tenants.id | NOT NULL, UNIQUE | Establishes tenant ownership and enforces one current configuration per tenant |
| provider_name | VARCHAR(100) | — | NOT NULL | Identifies the email service provider |
| delivery_method | ENUM | — | NOT NULL | Identifies how email is delivered |
| smtp_host | VARCHAR(255) | — | NULL | Stores SMTP host when SMTP delivery is used |
| smtp_port | INTEGER | — | NULL | Stores SMTP port when SMTP delivery is used |
| smtp_encryption | ENUM | — | NULL | Defines SMTP transport security |
| api_endpoint | TEXT | — | NULL | Stores provider API endpoint when API-based delivery is used |
| credential_reference | VARCHAR(255) | — | NULL | References securely managed provider credentials without storing raw secrets |
| from_name | VARCHAR(200) | — | NOT NULL | Defines the tenant-facing sender display name |
| from_email | VARCHAR(320) | — | NOT NULL | Defines the tenant's outbound sender address |
| reply_to_email | VARCHAR(320) | — | NULL | Defines where recipients should send replies |
| status | ENUM | — | NOT NULL | Represents configuration lifecycle/operational state |
| configuration | JSONB | — | NULL | Stores provider-specific non-secret configuration |
| created_at | TIMESTAMPTZ | — | NOT NULL | Records configuration creation |
| updated_at | TIMESTAMPTZ | — | NOT NULL | Records the latest configuration change |
id

Stable technical identity.

It answers:

Which email configuration record is this?
tenant_id

Establishes the ownership relationship:

tenant_email_settings.tenant_id
        ↓
tenants.id

The proposed UNIQUE(tenant_id) constraint expresses the intended one-current-configuration-per-tenant model.

provider_name

Identifies the provider.

Examples might include:

SMTP Provider
Cloud Email Provider
Enterprise Mail Service

The exact provider catalog is not established by the source.

delivery_method

Separates provider transport mechanisms.

A provider may support:

SMTP
API

The exact enum is proposed.

smtp_host

Required only for SMTP-based delivery.

smtp_port

Stores the SMTP service port.

The application should validate that it is appropriate for the selected transport configuration.

smtp_encryption

Defines transport security.

Possible values:

TLS
STARTTLS
NONE

These are proposed controlled values.

Plaintext SMTP should generally not be accepted for production delivery unless explicitly required by a controlled environment.

api_endpoint

Allows API-based providers to expose their delivery endpoint without forcing the table to assume SMTP.

credential_reference

This field is deliberately a reference, not the secret itself.

Conceptually:

tenant_email_settings
        │
        └── credential_reference
                  ↓
            Secret Manager
                  ↓
             Actual Secret

This keeps provider credentials separate from ordinary database configuration.

from_name

Defines the sender's display name.

Example:

ABC Insurance
from_email

Defines the sender email address.

Example:

notifications@abcinsurance.com
reply_to_email

Optional reply destination.

This allows:

From:
notifications@abcinsurance.com


Reply-To:
support@abcinsurance.com
status

Represents whether the configuration can currently be used.

configuration

Allows provider-specific non-secret settings without continually changing the relational schema.

Examples:

region
API version
timeout
provider-specific flags

Secrets should not be stored here in plaintext.

9. Enum Definitions

The original Table 24 enum definitions are not available. The following are proposed controlled values.

delivery_method
| Value | Description |
| --- | --- |
| smtp | Email delivered through an SMTP server |
| api | Email delivered through a provider API |
| custom | Provider-specific delivery mechanism |
smtp_encryption
| Value | Description |
| --- | --- |
| tls | TLS-secured SMTP connection |
| starttls | SMTP connection upgraded using STARTTLS |
| none | No transport-level encryption |

none should generally be restricted or prohibited by production security policy.

status
| Value | Description |
| --- | --- |
| pending | Configuration exists but has not been validated |
| active | Configuration is available for email delivery |
| inactive | Configuration is intentionally disabled |
| failed | Configuration or provider connectivity has failed |
| archived | Configuration has been retired |

These values are proposed and should become an explicit domain contract before implementation.

10. Why credential_reference Exists

Email delivery providers frequently require authentication.

For SMTP this may include:

Username
Password

For API-based providers:

API key
API secret
Bearer token

Storing those raw secrets directly in tenant_email_settings would make the table a high-value secret repository.

Instead:

tenant_email_settings
       │
       └── credential_reference
                 ↓
           Secret Manager

allows the database to identify which secure credential should be used without storing its plaintext value.

Why This Field Is Not password

A field such as:

smtp_password

would tightly couple the database schema to one authentication mechanism and increase secret exposure.

A reference is more flexible:

credential_reference

can point to:

SMTP credentials
API credentials
rotated credentials
provider-specific secret

without changing the relational model.

Credential Rotation

A rotation can occur without rewriting the business configuration:

Old Secret
    ↓
Secret Manager
    ↓
Rotate
    ↓
New Secret

The email-settings record can continue referencing the logical credential.

11. Candidate Keys
| Key Type | Field(s) | Rationale |
| --- | --- | --- |
| Primary Key | id | Stable technical identity |
| Candidate Key | tenant_id | One current email configuration per tenant |

The proposed candidate key:

UNIQUE(tenant_id)

reflects the configuration nature of the table.

Why Not provider_name?

A provider name is not unique.

Many tenants may use:

same provider

Therefore:

provider_name

cannot identify a configuration globally.

12. Constraints
| Constraint | Definition | Reason |
| --- | --- | --- |
| Primary Key | PK(id) | Stable configuration identity |
| Tenant FK | tenant_id → tenants.id | Establishes ownership |
| One Current Configuration | UNIQUE(tenant_id) | Prevents multiple current configurations |
| Provider | NOT NULL | Provider must be identified |
| Delivery Method | NOT NULL | Delivery mechanism must be explicit |
| From Name | NOT NULL | Sender identity is required |
| From Email | NOT NULL | Sender address is required |
| Status | NOT NULL | Configuration requires lifecycle state |
| Credential Reference | Nullable | Some delivery providers may use alternative authentication |
| SMTP Fields | Nullable | Only applicable to SMTP delivery |
| API Endpoint | Nullable | Only applicable to API delivery |
| Configuration | Nullable | Provider-specific settings are optional |
| Timestamps | NOT NULL | Lifecycle tracking |
Conditional Constraints

The following are recommended application/domain constraints, rather than source-established physical constraints:

delivery_method = smtp
        →
smtp_host must exist
delivery_method = api
        →
api_endpoint must exist

Similarly:

delivery_method = smtp
        →
smtp_port / smtp_encryption should be valid

These rules should be implemented explicitly rather than inferred from nullable columns.

13. Relationships
Incoming References / Logical Consumers

The email settings are logically consumed by:

Email Service.
Notification Service.
Authentication Service.
Policy Service.
Claims Service.
Billing Service.
Workflow Engine.
Audit Service.
Outgoing References

The explicit relational relationship is:

tenant_id → tenants.id

The credential reference is a logical dependency on a secret-management system, not necessarily a relational FK.

Email Service

Primary runtime consumer.

Business Event
      ↓
Email Service
      ↓
Tenant Email Settings
      ↓
Provider Adapter
      ↓
Email Provider
Notification Service

Uses tenant email configuration when delivering user notifications.

Authentication Service

May use tenant email configuration for:

Email Verification
Password Reset
Security Notifications
Policy Service

May use email delivery for:

Policy Issuance
Renewal Reminder
Policy Changes
Claims Service

May use email delivery for:

Claim Submitted
Claim Status Changed
Claim Decision
Billing Service

May use email delivery for:

Invoices
Payment Receipts
Payment Failures
Subscription Notifications
Workflow Engine

May trigger email as one step in a tenant-specific workflow.

Audit Service

Records administrative configuration changes.

14. Cardinality Analysis

The recommended cardinality is:

Tenant
   ↓
Exactly 1 current email configuration
| Relationship | Expected Cardinality |
| --- | --- |
| Tenant → Email Settings | 0–1 before configuration; exactly 1 once configured |
| Email Settings → Tenant | Exactly 1 |
| Provider → Tenants | 0–N |
| Delivery Method → Settings | 0–N |
| Status → Settings | 0–N |
Why 0–1 Initially?

A tenant may be provisioned before its email provider is configured.

Therefore:

New Tenant
   ↓
No Email Configuration

can be valid during provisioning.

After configuration:

Tenant
   ↓
One Current Email Configuration
Why Not 1:N?

Multiple simultaneous configurations create ambiguity:

Which provider should send the message?
Which sender should be used?
Which credentials are authoritative?

If fallback providers are eventually required, the architecture should introduce an explicit concept such as:

primary
secondary
priority
failover

rather than silently allowing arbitrary duplicate rows.

15. Query Patterns
Retrieve Tenant Email Configuration
SELECT *
FROM tenant_email_settings
WHERE tenant_id = :tenant_id;

This is the primary runtime query.

Retrieve Active Configuration
SELECT *
FROM tenant_email_settings
WHERE tenant_id = :tenant_id
AND status = 'active';
Find Tenants Using a Provider
SELECT tenant_id, provider_name
FROM tenant_email_settings
WHERE provider_name = :provider_name;

Useful for operational/provider migration analysis.

Find SMTP Configurations
SELECT tenant_id, provider_name, smtp_host, smtp_port
FROM tenant_email_settings
WHERE delivery_method = 'smtp';
Find API-Based Configurations
SELECT tenant_id, provider_name, api_endpoint
FROM tenant_email_settings
WHERE delivery_method = 'api';
Find Disabled Email Configurations
SELECT tenant_id, provider_name
FROM tenant_email_settings
WHERE status = 'inactive';
Find Configurations Requiring Validation
SELECT tenant_id, provider_name
FROM tenant_email_settings
WHERE status = 'pending';
16. Index Strategy

Recommended indexes:

| Index | Purpose |
| --- | --- |
| PK(id) | Direct configuration lookup |
| UNIQUE(tenant_id) | One configuration per tenant |
| INDEX(provider_name) | Provider analysis |
| INDEX(status) | Operational filtering |
| INDEX(delivery_method) | Delivery-method filtering |
Primary Key
PRIMARY KEY(id)
Tenant Unique Index
UNIQUE(tenant_id)

This is the most important lookup/index because runtime email delivery begins with tenant context.

Provider Index
INDEX(provider_name)

Useful for:

Provider migration.
Provider usage reporting.
Operational analysis.
Status Index
INDEX(status)

Supports:

active
inactive
failed
pending

operational queries.

Delivery Method Index
INDEX(delivery_method)

Useful for infrastructure/provider analysis.

Do Not Over-Index

This table should remain small relative to transactional business tables.

Indexes on:

from_name
from_email
reply_to_email

are generally unnecessary unless actual product queries require them.

17. Read / Write Characteristics

The expected workload is:

| Operation | Volume | Notes |
| --- | --- | --- |
| Reads | High | Email services resolve configuration for outbound messages |
| Writes | Very Low | Configuration changes infrequently |
| Updates | Low | Provider/configuration changes and credential rotation |
| Deletes | Very Low | Prefer disablement/archival |
Reads — High

Email delivery can occur throughout the platform:

Authentication
Policy
Claims
Billing
Notifications
Workflow

Each may need to resolve:

Tenant
   ↓
Email Settings
Writes — Very Low

Administrators do not continuously modify provider configuration.

Typical writes include:

Initial configuration.
Provider migration.
Sender identity change.
Credential reference change.
Enablement/disablement.
Operational Consideration

If the email configuration becomes a hot-read dependency, it should be cached.

The database should not be queried independently for every email if the configuration is stable.

18. Caching Strategy

Recommended Redis key:

tenant-email-settings:{tenant_id}

Example:

tenant-email-settings:abc123
Cached Data

Safe cacheable configuration may include:

provider_name
delivery_method
smtp_host
smtp_port
smtp_encryption
api_endpoint
credential_reference
from_name
from_email
reply_to_email
status
configuration

However, actual secret material must never be copied into the cache merely for convenience.

Cache Lookup
Email Request
      ↓
Tenant ID
      ↓
Redis
tenant-email-settings:{tenant_id}
      ↓
Email Service
      ↓
Provider Adapter
Cache Invalidation

When configuration changes:

Database Update
      ↓
TenantEmailSettingsUpdated
      ↓
Invalidate
tenant-email-settings:{tenant_id}
Credential Rotation

Credential rotation should invalidate relevant cached provider clients/references.

Credential Rotated
       ↓
Invalidate Email Provider Cache
       ↓
Reload Credential Reference
Database Remains Authoritative
PostgreSQL
     ↓
Source of Truth


Redis
     ↓
Performance Cache
19. Security Considerations

Email configuration is a high-security configuration domain because compromise can allow unauthorized email to be sent using a tenant's identity.

1. Tenant Isolation

Email configuration must always be resolved within tenant context.

2. Secret Management

Do not store plaintext:

SMTP passwords
API keys
Bearer tokens
Provider secrets

in ordinary database columns.

Use a secret-management layer and store only a reference.

3. Encryption at Rest

Any sensitive configuration that genuinely must reside in the database should be encrypted appropriately.

4. Encryption in Transit

Provider connections should use secure transport.

For SMTP:

TLS / STARTTLS

should be preferred.

For APIs:

HTTPS

should be required for production provider communication.

5. Sender Authorization

The platform should ensure that tenants cannot arbitrarily impersonate unrelated domains.

For example, configuring:

from_email = ceo@unrelated-company.com

should not automatically make that sender valid.

Domain verification and provider-level sender authorization should be respected.

6. RBAC

Only authorized tenant administrators should modify:

Provider.
Sender address.
Delivery method.
Endpoint.
Credential reference.
Email configuration status.
7. Audit Logging

Configuration changes should generate auditable events.

8. Credential Rotation

Credentials should support rotation without requiring broad application downtime.

9. Secret Exposure Prevention

Never include secrets in:

API responses
logs
audit payloads
error messages
cache values
debug output
10. Email Abuse Prevention

Tenant email configuration should not bypass platform-level abuse controls.

The email service should still enforce appropriate:

Rate limits.
Sending quotas.
Abuse detection.
Bounce handling.
Provider restrictions.

Those controls belong to the email-delivery subsystem rather than this table itself.

20. Audit Requirements

Because the original Table 24 audit specification is unavailable, the following events are recommended, not recovered source requirements.

| Event | Trigger | Purpose |
| --- | --- | --- |
| TenantEmailSettingsCreated | Initial configuration created | Establish configuration provenance |
| TenantEmailSettingsUpdated | Configuration changed | Record configuration modifications |
| TenantEmailSettingsActivated | Configuration becomes active | Record activation |
| TenantEmailSettingsDisabled | Email delivery disabled | Record disablement |
| TenantEmailSettingsValidationFailed | Provider/configuration validation fails | Record configuration failure |
| TenantEmailCredentialRotated | Credential reference changed | Record security-sensitive rotation |
| TenantEmailProviderChanged | Provider changes | Record infrastructure/provider migration |
Audit Payload Principles

An audit event should contain:

tenant_id
actor_id
configuration_id
event_type
timestamp
changed_fields

but should not contain:

SMTP password
API secret
Bearer token
private credential
Example

Instead of:

smtp_password = "secret123"

audit:

credential_reference changed

This preserves accountability without leaking credentials.

21. Event Producers / Event Consumers
Producers

Recommended producers:

TenantEmailSettingsCreated
TenantEmailSettingsUpdated
TenantEmailSettingsActivated
TenantEmailSettingsDisabled
TenantEmailSettingsValidationFailed
TenantEmailCredentialRotated
TenantEmailProviderChanged
Producers in the Application

Conceptually:

Tenant Administrator
       ↓
Tenant Administration UI
       ↓
Email Configuration API
       ↓
Email Configuration Service
       ↓
tenant_email_settings
       ↓
Domain Event
Consumers

Logical consumers include:

Email Service.
Notification Service.
Authentication Service.
Policy Service.
Claims Service.
Billing Service.
Workflow Engine.
Audit Service.
Monitoring Service.
Configuration Update Flow
Administrator
      ↓
Email Configuration API
      ↓
RBAC Validation
      ↓
Validation
      ↓
Database Update
      ↓
TenantEmailSettingsUpdated
      │
      ├── Email Service
      ├── Cache Manager
      ├── Monitoring
      └── Audit Service
Email Delivery Flow
Business Event
      ↓
Notification / Business Service
      ↓
Email Service
      ↓
Tenant Resolution
      ↓
Redis Cache
      │
      └── Miss → PostgreSQL
      ↓
Tenant Email Settings
      ↓
Provider Adapter
      ↓
Email Provider
      ↓
Recipient
22. Alternative Designs Considered
| Option | Description | Verdict |
| --- | --- | --- |
| A | Store email settings directly in tenants | Rejected |
| B | Store them in tenant_settings | Rejected |
| C | Store them inside tenant_integrations.configuration | Rejected |
| D | Dedicated tenant_email_settings table | Chosen |
| E | Store provider credentials directly in the table | Rejected |
Option A — Store in tenants

Rejected because tenant identity and email-delivery infrastructure are different concerns.

It would make the root entity increasingly wide and infrastructure-specific.

Option B — Store in tenant_settings

Rejected because general application settings and email-provider configuration have different:

Security requirements.
Lifecycle.
Operational consumers.
Validation rules.
Caching behavior.
Option C — Store in tenant_integrations.configuration

Rejected because an email provider is a specialized communication dependency.

The integration registry answers:

What external systems is this tenant connected to?

while email settings answer:

How should InsureIQ deliver email for this tenant?

These concepts can interact but should not be collapsed.

Option D — Dedicated tenant_email_settings

Chosen.

It provides:

Explicit tenant ownership.
Clear one-current-configuration semantics.
Provider abstraction.
Dedicated security boundary.
Dedicated indexes.
Dedicated caching.
Dedicated lifecycle.
Dedicated audit events.
Clear separation from email messages and delivery history.
Option E — Store Credentials Directly

Rejected.

For example:

smtp_password
api_secret

would turn the configuration table into a sensitive secret store.

The preferred design is:

tenant_email_settings
       ↓
credential_reference
       ↓
Secret Manager
23. Final Design Assessment

Because the original Table 24 assessment was not found in the available source corpus, this is a proposed architectural assessment.

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

tenant_email_settings is the tenant-scoped email-provider configuration boundary for InsureIQ.

Its architectural position is:

                         TENANT
                            │
                            │ owns
                            ▼
                ┌─────────────────────────┐
                │ tenant_email_settings   │
                ├─────────────────────────┤
                │ provider                 │
                │ delivery_method          │
                │ endpoint                 │
                │ sender identity          │
                │ reply-to                 │
                │ credential reference     │
                │ status                   │
                │ configuration            │
                └────────────┬────────────┘
                             │
                             ▼
                       EMAIL SERVICE
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
               SMTP Provider      API Provider
                    │                 │
                    └────────┬────────┘
                             ▼
                         RECIPIENT
Relationship With Adjacent Module 1 Tables

The separation from neighboring configuration tables is important:

tenants
   │
   ├── tenant_branding
   │       ↓
   │   How the tenant looks
   │
   ├── tenant_integrations
   │       ↓
   │   What external systems the tenant connects to
   │
   ├── tenant_webhooks
   │       ↓
   │   Where tenant/platform events are delivered
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

This gives each configuration entity a clear responsibility.

Email Configuration Lifecycle
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

The exact state machine is proposed because the surviving source does not define the original Table 24 lifecycle states.

Email Delivery Architecture
┌─────────────────────┐
│ Business Operation  │
│                     │
│ Policy / Claim /    │
│ Billing / Identity  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Notification /      │
│ Business Service    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    Email Service    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────┐
│ tenant_email_settings       │
│                             │
│ tenant_id                   │
│ provider_name               │
│ delivery_method             │
│ sender identity             │
│ credential reference        │
│ status                      │
└──────────────┬──────────────┘
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
        Email Provider
               │
               ▼
           Recipient
Critical Production Invariants
Every email configuration belongs to exactly one tenant.
tenant_id references tenants.id.
A tenant has at most one current email configuration.
UNIQUE(tenant_id) should enforce one current configuration if no versioning model is introduced.
Email configuration must remain tenant-isolated.
Tenant A's provider configuration must never be used for Tenant B.
Tenant-specific sender identity must remain tenant-scoped.
provider_name identifies the provider but is not a business key.
delivery_method explicitly identifies the delivery mechanism.
SMTP-specific fields should only be meaningful when SMTP delivery is selected.
API-specific fields should only be meaningful when API delivery is selected.
Provider credentials must not be stored as ordinary plaintext configuration.
credential_reference should point to secure secret-management infrastructure.
Credential rotation must be supported.
Sender domains should be appropriately verified before production use.
Email transport should use secure communication.
Email configuration changes require appropriate RBAC authorization.
Email configuration changes must be auditable.
Audit events must never contain plaintext credentials.
Redis must never contain plaintext provider secrets.
The database remains authoritative over cached email configuration.
Email configuration is not an email message.
Email configuration is not an email template.
Email configuration is not an email delivery history.
Email delivery history should be represented separately if detailed tracking is required.
User-level notification preferences belong outside this table.
Tenant branding remains separate from email transport configuration.
tenant_integrations remains the general external-system registry rather than becoming the email configuration table.
Email abuse prevention and sending quotas belong to the delivery subsystem, not the configuration row.
If provider failover is eventually required, explicit primary/secondary semantics should be introduced rather than allowing ambiguous multiple configurations.
The exact original Table 24 field list, enum definitions, indexes, cardinality, and audit events were not available in the surviving source and therefore must not be represented as recovered requirements.
Proposed implementation decisions must remain clearly distinguishable from source-derived requirements.
Source Integrity Note

The available source definitively establishes Table 24 — tenant_email_settings — “Email provider configuration” within Tenant Management. It also establishes that tenant-specific configuration and tenant isolation are foundational requirements of InsureIQ.

The detailed Table 24 physical schema itself was not recoverable from the available source files.

Therefore, unlike the earlier detailed tables where source-defined fields and constraints can be reproduced directly, this table deliberately marks its physical schema, enum values, indexes, audit events, and operational details as proposed reconstruction.

That distinction is part of the anti-degradation standard:

SOURCE
  │
  ├── What the architecture explicitly establishes
  │
  └── What the original detailed table document actually says


PROPOSED DESIGN
  │
  └── Necessary implementation detail where the original
      Table 24 specification is missing

No missing requirement has been silently presented as an original requirement.

Step 3 — Table 24 is complete. No .md file has been created in this response.
