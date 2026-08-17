# Table 22 — `tenant_integrations`

The Module 1 inventory identifies **Table 22** as `tenant_integrations`, with the purpose **“Connected third-party integrations.”**

The source defines `tenant_integrations` as the table that stores **tenant-specific integrations with external and internal systems**, supporting secure configuration, lifecycle management, monitoring, and governance. Examples include payment gateways, CRMs, ERPs, AI providers, SMS gateways, and government APIs.

The existing source document is a **degraded schema version**: its schema uses only `Field / Type / Notes`, while the original documentation standard requires explicit PK/FK/UK information, constraints, nullability, defaults, and business rationale.

Therefore, the schema below deliberately restores the full documentation standard:

> **Field Name → Data Type → Key Type → Specification → Reason Field Exists**

I will preserve the source-defined field set and architectural decisions. Where the source does not specify an exact constraint or implementation rule, I will explicitly identify that rather than silently inventing one.

---

# 1. Why This Table Exists

The `tenant_integrations` table stores **tenant-specific integrations with external and internal systems**.

The source identifies four core responsibilities:

- Secure configuration.
- Lifecycle management.
- Monitoring.
- Governance.

InsureIQ is intended to operate as a multi-tenant insurance platform. Individual insurance organizations may need to connect their tenant environment to many different systems.

For example:

```text
Tenant
   │
   ├── Payment Gateway
   ├── CRM
   ├── ERP
   ├── AI Provider
   ├── SMS Gateway
   └── Government API
```

Without a dedicated integration entity, these connections would have to be mixed into unrelated configuration tables.

That would make it difficult to:

- Identify which integrations a tenant has.
- Enable or disable individual integrations.
- Track integration health.
- Distinguish providers.
- Determine authentication methods.
- Store provider-specific configuration.
- Audit integration changes.
- Allow multiple integrations of different types for the same tenant.

The table therefore acts as the **tenant-level integration registry**.

---

## The Problem It Solves

The conceptual problem is:

```text
Tenant
   ↓
Many external systems
```

where each external system can have different:

```text
Provider
Integration Type
Endpoint
Authentication Method
Configuration
Status
Health
```

The table provides a normalized registry:

```text
Tenant
   ↓
tenant_integrations
   ├── Payment Gateway
   ├── CRM
   ├── ERP
   ├── AI Service
   └── Government API
```

This allows the platform to manage integrations as first-class tenant-owned resources.

---

# 2. Business Definition

A **Tenant Integration** represents a **configured connection between a tenant and an external or internal service**.

The source gives the following examples:

- Payment Gateway
- CRM
- ERP
- AI Provider
- SMS Gateway
- Government API.

The integration record describes the connection and its lifecycle.

---

## Example

A tenant may have:

```text
Tenant:
ABC Insurance
```

with:

```text
Integration 1
    Name:
    Primary Payment Gateway

    Provider:
    Stripe-like Payment Provider

    Type:
    payment_gateway

    Authentication:
    api_key

    Status:
    active
```

and:

```text
Integration 2
    Name:
    Corporate CRM

    Provider:
    Enterprise CRM

    Type:
    crm

    Authentication:
    oauth2

    Status:
    active
```

Both belong to the same tenant but represent separate integration resources.

---

## Business Meaning

The table answers:

> **Which external/internal services is this tenant connected to, and what configuration governs each connection?**

It does not represent the actual provider account itself.

It also does not replace:

```text
tenant_api_credentials
tenant_oauth_clients
tenant_webhooks
```

Those tables represent specialized authentication and callback resources.

---

# 3. Critical Design Principle — What the Entity IS and IS NOT

## The Tenant Integration IS

The source defines the Tenant Integration as:

- A tenant-owned integration configuration.
- A business connectivity resource.
- A child of the Tenant aggregate.

It can therefore be understood as:

```text
Tenant
    ↓
Integration
    ↓
External/Internal Service
```

---

## The Tenant Integration IS NOT

The source explicitly states that it is:

> **NOT an API key or OAuth token.**

Therefore:

```text
tenant_integrations
        ↓
Integration definition/configuration
```

while:

```text
tenant_api_credentials
        ↓
API authentication credentials
```

and:

```text
tenant_oauth_clients
        ↓
OAuth client registration
```

remain separate concerns.

---

## Critical Boundary

An integration record may reference or depend on authentication credentials, but it should not become the credential store.

Conceptually:

```text
Tenant
 │
 ├── Integration
 │      │
 │      └── Authentication Configuration
 │
 ├── API Credentials
 │
 └── OAuth Clients
```

This separation reduces security coupling.

---

# 4. Aggregate Root Analysis — DDD Structure

The source defines the aggregate structure as:

```text
Tenant
├── Integrations
├── API Credentials
├── OAuth Clients
└── Webhooks
```

The `Tenant` remains the aggregate root.

---

## DDD Relationship

```text
Tenant Aggregate Root
        │
        └── TenantIntegration
```

Ownership is established through:

```text
tenant_integrations.tenant_id
            ↓
         tenants.id
```

---

## Why Integration Is a Tenant Child

An integration has no independent business ownership outside its tenant.

For example:

```text
Payment Gateway
```

is not simply:

```text
Payment Gateway
```

within InsureIQ.

It is:

```text
Tenant A
   ↓
Payment Gateway Configuration A
```

and another tenant can have:

```text
Tenant B
   ↓
Payment Gateway Configuration B
```

with completely different:

- Endpoint.
- Authentication.
- Configuration.
- Status.
- Provider account.

---

## Integration Aggregate Boundary

The tenant remains responsible for ownership:

```text
Tenant
   │
   └── Integration
          ├── Provider
          ├── Type
          ├── Endpoint
          ├── Authentication Method
          ├── Configuration
          └── Status
```

The actual external system remains outside the InsureIQ aggregate.

---

# 5. Business Capabilities Supported

The source identifies five primary capabilities:

| Capability | Supported |
|---|---|
| Third-party integration management | Yes |
| Provider configuration | Yes |
| Lifecycle management | Yes |
| Operational monitoring | Yes |
| Enterprise interoperability | Yes |

---

## Third-Party Integration Management

The table provides a central registry of connected services.

Examples:

```text
CRM
ERP
Payment Gateway
AI Provider
Government API
```

---

## Provider Configuration

`provider_name`, `endpoint_url`, and `configuration` allow provider-specific connection information to be represented.

---

## Lifecycle Management

The `status` field supports lifecycle states:

```text
pending
active
inactive
failed
archived
```

This allows the platform to distinguish a configured integration from one that is currently operational.

---

## Operational Monitoring

`last_health_check` provides a location for recording the latest known health-check timestamp.

The table does not itself represent a complete monitoring history.

---

## Enterprise Interoperability

The table provides a standardized tenant-level abstraction over many different external systems.

Conceptually:

```text
Different Providers
       ↓
Different Protocols
       ↓
tenant_integrations
       ↓
Common Tenant Integration Model
```

---

# 6. Multi-Tenant / Ownership / Isolation Notes

Each integration belongs to exactly one tenant.

The ownership relationship is:

```text
tenant_integrations.tenant_id
              ↓
           tenants.id
```

---

## Tenant Isolation

Integration configurations are highly tenant-specific.

For example:

```text
Tenant A
    CRM endpoint:
    crm-a.example

Tenant B
    CRM endpoint:
    crm-b.example
```

The platform must never expose Tenant A's configuration to Tenant B.

---

## Correct Access Pattern

```sql
SELECT *
FROM tenant_integrations
WHERE tenant_id = :authenticated_tenant_id;
```

Tenant context should come from the authenticated security context.

---

## Why Isolation Is Especially Important

Integration configuration may contain sensitive provider-specific settings.

A cross-tenant leak could expose:

- Endpoint URLs.
- Provider identifiers.
- Configuration values.
- Authentication-related metadata.
- Operational integration status.

The source explicitly requires:

- RBAC.
- Tenant isolation.
- Encrypted sensitive configuration.
- Secret management.
- Audit logging.
- Health monitoring.

---

# 7. Lifecycle

The source defines the lifecycle as:

```text
Creation:
Integration configured

Growth:
Connection validated and used

Modification:
Configuration updated

Archival:
Disabled and retained
```

---

## Creation — Integration Configured

The lifecycle begins when a tenant configures an integration.

Example:

```text
Tenant
   ↓
Add CRM Integration
   ↓
Provider Selected
   ↓
Authentication Configured
   ↓
Integration Created
```

---

## Growth — Connection Validated and Used

After configuration:

```text
Integration
    ↓
Connection Validation
    ↓
Health Check
    ↓
Operational Use
```

The integration may then be used by services such as:

- API Gateway.
- Workflow Engine.
- Integration Manager.

---

## Modification — Configuration Updated

Provider-specific configuration can change.

Examples:

```text
Endpoint changed
Provider configuration changed
Retry policy changed
API version changed
Feature flags changed
```

The source specifically gives API versions, regions, retry policies, and feature flags as examples of values stored in `configuration`.

---

## Archival — Disabled and Retained

The source states:

> Disabled and retained.

Therefore an integration should not normally be physically deleted simply because it is no longer active.

Its historical presence can remain available for:

- Audit.
- Troubleshooting.
- Compliance.
- Operational history.

---

# 8. Proposed Schema

## Table Name

`tenant_integrations`

## Primary Key Strategy

**UUID**

The source explicitly identifies `id` as the primary key.

---

## Full Field-by-Field Schema Definition

| Field Name | Data Type | Key Type | Specification | Reason Field Exists |
|---|---|---|---|---|
| `id` | UUID | PK | `NOT NULL` | Stable unique identity of the tenant integration |
| `tenant_id` | UUID | FK → `tenants.id` | `NOT NULL` | Establishes tenant ownership |
| `integration_name` | VARCHAR(200) | UK as part of `(tenant_id, integration_name)` | `NOT NULL` | Provides a tenant-scoped human-readable identity for the integration |
| `provider_name` | VARCHAR(150) | — | `NOT NULL` | Identifies the external/internal service provider |
| `integration_type` | ENUM | — | `NOT NULL` | Classifies the integration by business/technical purpose |
| `endpoint_url` | TEXT | — | `NULL` | Stores the service endpoint when the integration requires one |
| `authentication_method` | ENUM | — | `NOT NULL` | Defines how the integration authenticates |
| `status` | ENUM | — | `NOT NULL` | Represents the integration lifecycle/operational state |
| `configuration` | JSONB | — | `NULL` | Stores provider-specific settings such as API versions, regions, retry policies, and feature flags |
| `last_health_check` | TIMESTAMPTZ | — | `NULL` | Records the most recent known health-check time |
| `created_at` | TIMESTAMPTZ | — | `NOT NULL` | Records integration creation |
| `updated_at` | TIMESTAMPTZ | — | `NOT NULL` | Records the latest integration modification |

The composite uniqueness of:

```sql
UNIQUE(tenant_id, integration_name)
```

is explicitly defined by the source.

---

## `id`

Provides the immutable technical identity of the integration record.

It answers:

```text
Which integration record is this?
```

rather than:

```text
Which tenant owns this integration?
```

That second question is answered by `tenant_id`.

---

## `tenant_id`

Establishes ownership:

```text
tenant_integrations.tenant_id
        ↓
     tenants.id
```

This is the integration's tenant boundary.

---

## `integration_name`

Provides a tenant-scoped name for identifying an integration.

Examples:

```text
Primary CRM
Claims CRM
Payment Gateway
Government Verification API
```

The source makes the pair:

```text
tenant_id + integration_name
```

a candidate key.

This means two tenants may use the same integration name without conflict, while the same tenant cannot have two integrations with the same name under the documented constraint.

---

## `provider_name`

Identifies the service provider.

Examples could include a:

```text
CRM provider
Payment provider
AI provider
Government provider
```

The exact provider catalog is not defined by the source.

---

## `integration_type`

Classifies the integration.

The source defines the available enum values and they are documented in Section 9.

---

## `endpoint_url`

Stores an integration endpoint when one is applicable.

It is optional because not every integration necessarily exposes a directly configured endpoint in the same way.

The source does not define URL-format validation constraints.

---

## `authentication_method`

Defines how the connection authenticates.

The source supports:

```text
api_key
oauth2
basic_auth
bearer_token
mutual_tls
custom
```

This field identifies the method, not the secret itself.

---

## `status`

Represents the integration's lifecycle/operational state.

The source defines:

```text
active
inactive
pending
failed
archived
```

---

## `configuration`

The source explicitly states that this field stores provider-specific settings such as:

- API versions.
- Regions.
- Retry policies.
- Feature flags.

It is therefore intentionally flexible because different integration providers expose different configuration requirements.

---

## `last_health_check`

Records when the integration was most recently health-checked.

The source identifies this field as optional.

The field is therefore a **latest-known timestamp**, not a complete health-history store.

---

## `created_at`

Records when the integration was created.

---

## `updated_at`

Records when the integration was last modified.

---

# 9. Enum Definitions

The source defines three enums.

## `integration_type`

| Value | Description |
|---|---|
| `payment_gateway` | Integration with a payment-processing service |
| `crm` | Customer relationship management integration |
| `erp` | Enterprise resource planning integration |
| `messaging` | Messaging/communication service integration |
| `storage` | External storage service integration |
| `identity` | Identity/authentication-related integration |
| `government` | Government or regulatory service integration |
| `ai_service` | AI/ML service integration |
| `analytics` | Analytics/reporting service integration |
| `custom` | Integration that does not fit the predefined categories |

---

## `authentication_method`

| Value | Description |
|---|---|
| `api_key` | Authentication using an API key |
| `oauth2` | OAuth 2.0-based authentication |
| `basic_auth` | HTTP Basic Authentication |
| `bearer_token` | Bearer-token authentication |
| `mutual_tls` | Mutual TLS/client-certificate authentication |
| `custom` | Provider-specific authentication mechanism |

The table identifies the authentication mechanism but does not itself constitute the credential store.

---

## `status`

| Value | Description |
|---|---|
| `active` | Integration is enabled and operational |
| `inactive` | Integration is configured but not currently active |
| `pending` | Integration configuration or activation is pending |
| `failed` | Integration has entered a failed state |
| `archived` | Integration has been retired but retained |

---

# 10. Why `configuration` Exists

The source explicitly identifies `configuration` as the field for provider-specific settings such as:

- API versions.
- Regions.
- Retry policies.
- Feature flags.

This is necessary because integrations are heterogeneous.

For example:

```text
CRM
    ↓
API Version
Region
Sync Settings
```

while:

```text
Payment Gateway
    ↓
API Version
Region
Retry Policy
```

and:

```text
AI Service
    ↓
Model / API Version
Region
Feature Flags
```

may all require different configuration structures.

---

## Why JSONB Rather Than Separate Columns

The chosen design uses:

```text
configuration JSONB
```

rather than adding every possible provider-specific setting as a relational column.

This prevents the table from becoming a collection of provider-specific columns.

The relational columns represent stable cross-provider concepts, while `configuration` holds provider-specific variability.

---

## Important Security Boundary

`configuration` must not become an unrestricted secret store.

Where configuration contains credentials or sensitive secrets, those values should be handled according to the source's security requirements for:

- Encrypted sensitive configuration.
- Secret management.

The exact secret-management implementation is not specified by the source.

---

# 11. Candidate Keys

| Key Type | Field(s) | Rationale |
|---|---|---|
| Primary Key | `id` | Stable technical identity |
| Candidate Key | `(tenant_id, integration_name)` | Ensures an integration name is unique within its tenant |

---

## Why the Candidate Key Is Composite

The same integration name can legitimately exist across different tenants:

```text
Tenant A
    Primary CRM

Tenant B
    Primary CRM
```

Therefore:

```text
UNIQUE(integration_name)
```

would be unnecessarily restrictive.

Instead:

```text
UNIQUE(tenant_id, integration_name)
```

creates tenant-scoped uniqueness.

---

# 12. Constraints

The source explicitly defines:

```text
PK(id)
FK(tenant_id)
UNIQUE(tenant_id, integration_name)
```

The restored constraint table is:

| Constraint | Definition | Reason |
|---|---|---|
| Primary Key | `PK(id)` | Stable integration identity |
| Tenant FK | `tenant_id → tenants.id` | Establishes ownership |
| Tenant-Scoped Name | `UNIQUE(tenant_id, integration_name)` | Prevents duplicate integration names within one tenant |
| Integration Name | `NOT NULL` | Every integration requires an identity |
| Provider Name | `NOT NULL` | Provider must be identified |
| Integration Type | `NOT NULL` | Integration classification is required |
| Authentication Method | `NOT NULL` | Authentication mechanism must be known |
| Status | `NOT NULL` | Every integration requires a lifecycle state |
| Endpoint | Nullable | Source explicitly marks `endpoint_url` optional |
| Configuration | Nullable | Source explicitly marks provider-specific configuration optional |
| Health Check | Nullable | Source explicitly marks `last_health_check` optional |
| Created Timestamp | `NOT NULL` | Lifecycle tracking |
| Updated Timestamp | `NOT NULL` | Modification tracking |

The source does not explicitly define additional checks such as URL-format validation, state-transition constraints, or authentication-specific credential requirements.

---

# 13. Relationships

## Incoming References / Logical Consumers

- Integration Manager.
- API Gateway.
- Workflow Engine.
- Monitoring Service.
- Audit Service.

## Outgoing References

```text
tenant_id → tenants.id
```

## Integration Manager

The Integration Manager is the primary domain service responsible for managing integration configuration and lifecycle.

## API Gateway

The API Gateway can consume integration configuration when routing or authenticating integration traffic.

## Workflow Engine

The Workflow Engine can use tenant integrations as external workflow endpoints.

Example:

```text
Claim Approved
      ↓
Workflow
      ↓
External CRM / ERP / Messaging Provider
```

## Monitoring Service

Consumes integration health information, including the latest known health-check timestamp.

## Audit Service

Consumes integration lifecycle events to preserve integration history.

---

# 14. Cardinality Analysis

The source specifies:

> **10–200 integrations per tenant.**

| Relationship | Expected Cardinality |
|---|---:|
| Tenant → Integrations | 10–200 |
| Integration → Tenant | Exactly 1 |
| Provider → Tenants | 0–N |
| Integration Type → Integrations | 0–N |
| Status → Integrations | 0–N |

Unlike singular tenant policy tables, integrations are naturally plural.

A large enterprise tenant may have:

```text
CRM
ERP
Payment Gateway
SMS
Email
AI
Government APIs
Analytics
Storage
Identity Provider
```

and potentially multiple providers within a category.

---

## Expected Platform Scale

If:

```text
100,000 tenants
```

and each tenant averages:

```text
50 integrations
```

then the table could contain approximately:

```text
5,000,000 integration records
```

This is an illustrative scale calculation, not a source-defined capacity requirement.

The source rates scalability as **Excellent**.

---

# 15. Query Patterns

## Retrieve Active Tenant Integrations

```sql
SELECT *
FROM tenant_integrations
WHERE tenant_id = :tenant_id
AND status = 'active';
```

This is the primary runtime query.

## Find Payment Gateway Integrations

```sql
SELECT *
FROM tenant_integrations
WHERE integration_type = 'payment_gateway';
```

## Retrieve All Tenant Integrations

```sql
SELECT *
FROM tenant_integrations
WHERE tenant_id = :tenant_id
ORDER BY integration_name;
```

## Retrieve One Named Integration

```sql
SELECT *
FROM tenant_integrations
WHERE tenant_id = :tenant_id
AND integration_name = :integration_name;
```

The composite candidate key makes this an efficient lookup.

## Find Failed Integrations

```sql
SELECT *
FROM tenant_integrations
WHERE tenant_id = :tenant_id
AND status = 'failed';
```

## Find Integrations Requiring Health Attention

```sql
SELECT *
FROM tenant_integrations
WHERE tenant_id = :tenant_id
AND status IN ('active', 'failed')
ORDER BY last_health_check ASC NULLS FIRST;
```

This is an operational query pattern derived from the source's health-monitoring responsibility; the exact SLA/threshold is not defined by the source.

---

# 16. Index Strategy

The source explicitly defines:

- `PK(id)`
- `INDEX(tenant_id)`
- `UNIQUE(tenant_id, integration_name)`
- `INDEX(integration_type)`
- `INDEX(status)`
- `INDEX(provider_name)`
- `GIN(configuration)`

---

## Primary Key

```sql
PRIMARY KEY (id)
```

Provides direct row identity.

## Tenant Index

```sql
INDEX(tenant_id)
```

Supports tenant-scoped integration retrieval.

## Composite Unique Index

```sql
UNIQUE(tenant_id, integration_name)
```

simultaneously:

- Enforces candidate-key uniqueness.
- Optimizes lookup by tenant and integration name.

## Integration Type Index

```sql
INDEX(integration_type)
```

Supports queries for integration categories.

## Status Index

```sql
INDEX(status)
```

Supports operational status queries.

## Provider Name Index

```sql
INDEX(provider_name)
```

Supports provider-oriented reporting.

## GIN Configuration Index

```sql
GIN(configuration)
```

supports JSONB queries against provider-specific configuration.

---

# 17. Read / Write Characteristics

The source specifies:

```text
Reads:
High

Writes:
Low to Moderate
```

## Reads — High

Integration configuration can be accessed by:

- Integration Manager.
- API Gateway.
- Workflow Engine.
- Monitoring Service.

Typical flow:

```text
Business Operation
       ↓
Determine Tenant
       ↓
Resolve Integration
       ↓
Load Configuration
       ↓
Call External Service
```

## Writes — Low to Moderate

Writes occur when administrators:

- Add integrations.
- Modify configuration.
- Enable integrations.
- Disable integrations.
- Change providers.
- Update endpoints.
- Reconfigure authentication.
- Archive obsolete integrations.

Health checks may also update `last_health_check`.

---

# 18. Caching Strategy

The source defines the Redis key:

```text
tenant-integrations:{tenant_id}
```

Caching is appropriate because integration configuration may be read frequently while configuration changes comparatively infrequently.

---

## Cache Key

```text
tenant-integrations:{tenant_id}
```

Example:

```text
tenant-integrations:abc123
```

Tenant identity must be embedded in the key.

---

## Cache Contents

A cache entry may represent the tenant's currently relevant integration configuration, such as:

```text
integration_name
provider_name
integration_type
endpoint_url
authentication_method
status
configuration
last_health_check
```

The exact cache serialization is not defined by the source.

---

## Cache Invalidation

When an integration changes:

```text
Integration Updated
       ↓
Database Commit
       ↓
TenantIntegrationUpdated
       ↓
Invalidate / Refresh
tenant-integrations:{tenant_id}
```

Sensitive credentials must not be indiscriminately cached in plaintext.

---

## Database Remains Authoritative

```text
PostgreSQL
    ↓
Integration Configuration Source of Truth

Redis
    ↓
Performance Cache
```

---

# 19. Security Considerations

The source explicitly identifies:

- RBAC.
- Tenant isolation.
- Encrypted sensitive configuration.
- Secret management.
- Audit logging.
- Health monitoring.

## 1. RBAC

Only appropriately authorized administrators should create or modify integrations.

Sensitive operations include:

```text
Create Integration
Update Authentication Method
Change Endpoint
Enable Integration
Disable Integration
Modify Sensitive Configuration
```

## 2. Tenant Isolation

An integration belonging to Tenant A must never be accessible to Tenant B.

## 3. Sensitive Configuration Encryption

The source explicitly requires encrypted sensitive configuration.

## 4. Secret Management

Authentication secrets should be managed through appropriate secret-management infrastructure rather than treating `tenant_integrations.configuration` as a generic plaintext secret store.

This includes:

```text
API keys
Bearer tokens
OAuth secrets
Basic-auth passwords
Private certificates
```

## 5. Audit Logging

Integration lifecycle changes must be auditable.

## 6. Health Monitoring

The integration's operational health should be monitored independently of its configuration.

`last_health_check` provides a latest-known health timestamp.

## 7. Authentication Separation

The table identifies `authentication_method` but should not become the authoritative credential store.

The architecture already contains:

```text
tenant_api_credentials
tenant_oauth_clients
```

for specialized credential/client concerns.

---

# 20. Audit Requirements

The source defines six integration audit events:

| Event | Trigger | Purpose |
|---|---|---|
| `TenantIntegrationCreated` | New integration configured | Establish integration provenance |
| `TenantIntegrationUpdated` | Integration configuration changes | Record configuration changes |
| `TenantIntegrationActivated` | Integration becomes active | Record activation |
| `TenantIntegrationDisabled` | Integration becomes inactive/disabled | Record deactivation |
| `TenantIntegrationFailed` | Integration enters failed state | Record operational failure |
| `TenantIntegrationHealthChecked` | Health check performed | Record integration health activity |

## `TenantIntegrationCreated`

Generated when a tenant creates a new integration.

Useful information includes:

```text
tenant_id
integration_name
provider_name
integration_type
actor
timestamp
```

## `TenantIntegrationUpdated`

Generated when integration configuration changes.

Sensitive secrets should not be placed directly into audit payloads.

## `TenantIntegrationActivated`

Generated when `status` changes to `active`.

## `TenantIntegrationDisabled`

Generated when an active integration is disabled.

## `TenantIntegrationFailed`

Generated when the integration enters `failed`.

## `TenantIntegrationHealthChecked`

Generated when a health check is performed according to the source's audit model.

---

# 21. Event Producers / Event Consumers

## Producers

- `TenantIntegrationCreated`
- `TenantIntegrationUpdated`
- `TenantIntegrationActivated`
- `TenantIntegrationDisabled`
- `TenantIntegrationFailed`
- `TenantIntegrationHealthChecked`

## Consumers

- Integration Manager.
- Monitoring Service.
- Workflow Engine.
- Audit Service.

## Integration Creation Workflow

```text
Tenant Administrator
        ↓
Integration Configuration
        ↓
RBAC Validation
        ↓
tenant_integrations
        ↓
TenantIntegrationCreated
        │
        ├── Integration Manager
        ├── Monitoring Service
        ├── Workflow Engine
        └── Audit Service
```

## Integration Update Workflow

```text
Administrator
      ↓
Configuration Change
      ↓
Validation
      ↓
Database Update
      ↓
TenantIntegrationUpdated
      │
      ├── Integration Manager
      ├── Monitoring Service
      ├── Workflow Engine
      └── Audit Service
```

## Integration Failure Workflow

```text
Health / Runtime Failure
        ↓
Integration Status
        ↓
failed
        ↓
TenantIntegrationFailed
        │
        ├── Monitoring Service
        ├── Integration Manager
        └── Audit Service
```

## Health Check Workflow

```text
Monitoring Service
        ↓
Health Check
        ↓
Integration
        ↓
Health Result
        ↓
last_health_check
        ↓
TenantIntegrationHealthChecked
```

---

# 22. Alternative Designs Considered

| Option | Description | Verdict |
|---|---|---|
| A | Store integrations in `tenant_settings` | Rejected |
| B | JSON-only configuration | Rejected |
| C | Dedicated `tenant_integrations` table | Chosen |

## Option A — Store in `tenant_settings`

Rejected because general tenant settings and integrations have distinct responsibilities.

```text
tenant_settings
    ↓
General tenant configuration

tenant_integrations
    ↓
External/internal connectivity
```

## Option B — JSON-Only Configuration

Rejected because it weakens:

- Relational tenant-level constraints.
- Candidate-key enforcement.
- Integration-level status queries.
- Provider-level indexes.
- Integration lifecycle management.
- Operational monitoring.
- Auditability.
- Queryability.

## Option C — Dedicated Table

Chosen because it provides:

- One row per integration.
- Explicit tenant ownership.
- Tenant-scoped integration-name uniqueness.
- Structured integration classification.
- Structured authentication method.
- Explicit lifecycle status.
- Provider indexing.
- JSONB provider-specific configuration.
- Health-check metadata.
- Dedicated integration events.
- Dedicated caching.
- Clear integration-service boundaries.

---

# 23. Final Design Assessment

| Attribute | Rating |
|---|---|
| Complexity | **Medium** |
| Read Volume | **High** |
| Write Volume | **Low to Moderate** |
| Security Importance | **High** |
| Business Criticality | **Very High** |
| Scalability | **Excellent** |
| Recommended Status | **Core Integration Management Table** |

---

# Overall Assessment

`tenant_integrations` is the **central tenant-level integration registry** for InsureIQ.

It provides the abstraction between:

```text
Tenant
   ↓
Integration Configuration
   ↓
External / Internal Service
```

while keeping specialized authentication resources separate.

Its architectural role is:

```text
                         TENANT
                            │
                            ▼
                   Integrations
                            │
        ┌───────────────────┼────────────────────┐
        ▼                   ▼                    ▼
    Provider             Endpoint          Authentication
        │                   │                    │
        └───────────────────┼────────────────────┘
                            ▼
                     Integration Manager
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
        API Gateway     Workflow       Monitoring
                         Engine          Service
              │             │             │
              └─────────────┼─────────────┘
                            ▼
                       Audit Service
```

---

# Complete Integration Model

```text
┌──────────────────────────────────────────────┐
│                    TENANT                    │
└───────────────────────┬──────────────────────┘
                        │
                        │ 1 : N
                        ▼
┌──────────────────────────────────────────────┐
│              tenant_integrations             │
├──────────────────────────────────────────────┤
│ id                                           │
│ tenant_id                                    │
│ integration_name                             │
│ provider_name                                │
│ integration_type                             │
│ endpoint_url                                 │
│ authentication_method                        │
│ status                                       │
│ configuration                                │
│ last_health_check                            │
│ created_at                                   │
│ updated_at                                   │
└───────────────────────┬──────────────────────┘
                        │
           ┌────────────┼────────────┐
           ▼            ▼            ▼
     Integration     API Gateway   Workflow
       Manager                      Engine
           │            │            │
           └────────────┼────────────┘
                        ▼
                 Monitoring Service
                        │
                        ▼
                   Audit Service
```

---

# Integration Lifecycle

```text
                 Integration Configured
                          │
                          ▼
                       PENDING
                          │
                    Validation
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
           ACTIVE                   FAILED
              │                       │
       ┌──────┴──────┐                │
       ▼             ▼                │
   Updated       Disabled             │
       │             │                │
       │             ▼                │
       │         INACTIVE             │
       │                              │
       └──────────────┬───────────────┘
                      ▼
                  ARCHIVED
```

The source defines the states but does not define every permitted transition; the transition model above is therefore a conceptual interpretation rather than a source-defined state machine.

---

# Critical Production Invariants

1. Every integration belongs to exactly one tenant.
2. `tenant_id` references `tenants.id`.
3. Integration names are unique within a tenant through `UNIQUE(tenant_id, integration_name)`.
4. The same integration name may exist under different tenants.
5. `integration_name` is required.
6. `provider_name` is required.
7. `integration_type` is required.
8. `authentication_method` is required.
9. `status` is required.
10. `endpoint_url` is optional according to the source.
11. `configuration` is optional according to the source.
12. `last_health_check` is optional according to the source.
13. The table represents an integration configuration, not an API key.
14. The table represents an integration configuration, not an OAuth token.
15. Specialized credentials remain separate from the integration registry.
16. Sensitive configuration must be protected through encryption and secret-management controls.
17. Integration access must be tenant-isolated.
18. Integration administration requires appropriate RBAC.
19. Integration lifecycle changes must be auditable.
20. Integration failures must be observable.
21. Health monitoring must not be confused with the configuration record itself.
22. `configuration` provides provider-specific flexibility without making the entire table an unstructured JSON document.
23. `GIN(configuration)` supports JSONB configuration queries.
24. Redis is a performance cache; the database remains authoritative.
25. Tenant identity must be included in the integration cache key.
26. Integration configuration changes must invalidate or refresh stale cached data.
27. Integration secrets must not be indiscriminately placed into ordinary audit payloads.
28. The table should not become a generic secret store.
29. The table should not become a complete integration health-history store.
30. The table should remain focused on the question: **“What external or internal systems is this tenant connected to, and what configuration governs those connections?”**

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
                    │   tenant_integrations    │
                    ├──────────────────────────┤
                    │ integration_name          │
                    │ provider_name             │
                    │ integration_type           │
                    │ endpoint_url                │
                    │ authentication_method       │
                    │ status                      │
                    │ configuration               │
                    │ last_health_check           │
                    └────────────┬─────────────┘
                                 │
             ┌───────────────────┼───────────────────┐
             ▼                   ▼                   ▼
      Integration Manager   API Gateway       Workflow Engine
             │                   │                   │
             └───────────────────┼───────────────────┘
                                 ▼
                         Monitoring Service
                                 │
                                 ▼
                            Audit Service
```

The essential architectural principle is:

> **`tenant_integrations` provides the authoritative tenant-scoped registry of configured external and internal integrations, separating integration identity, provider configuration, lifecycle state, and health metadata from specialized credentials, OAuth clients, webhook registrations, and actual external-system infrastructure.**

The source establishes this as a **Core Integration Management Table** with **High security importance**, **Very High business criticality**, **High read volume**, **Low-to-Moderate write volume**, and **Excellent scalability**.

**Step 3 — `tenant_integrations` is complete.**

**No file has been created in this response.** The next step is **Step 4 — package this exact Step 3 content into the Table 22 `.md` file.**
