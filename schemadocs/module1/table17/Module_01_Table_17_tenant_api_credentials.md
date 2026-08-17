# Step 3 — Table 17: `tenant_api_credentials`

The Module 1 inventory identifies **Table 17** as `tenant_api_credentials`, with the purpose **“API keys and authentication credentials.”**

The existing Table 17 design establishes that this table stores secure machine-to-machine credentials issued to tenant integrations and supports API authentication, credential rotation, revocation, auditing, and secure external connectivity. It also establishes the core fields, credential types, statuses, tenant ownership, and `created_by → users.id` relationship.

I am explicitly restoring the **non-degraded schema-definition standard** here:

> **Field Name → Data Type → Key Type → Specification → Reason Field Exists**

The source version had compressed this into `Field / Type / Notes`; the expanded version below restores the missing PK/FK/UNIQUE/NULL/constraint/business-rationale information without silently changing the established table purpose.

---

# 1. Why This Table Exists

The `tenant_api_credentials` table stores **machine-to-machine authentication credentials belonging to a tenant**.

These credentials allow external systems to authenticate against InsureIQ APIs without requiring a human user's credentials.

The source specifically identifies examples such as:

- REST API keys
- HMAC keys
- Service tokens
- Integration keys

The table exists because a multi-tenant insurance SaaS platform needs a secure mechanism for external systems to communicate with a specific tenant's InsureIQ environment.

The conceptual relationship is:

```text
Tenant
  │
  ├── API Credentials
  │
  ├── OAuth Clients
  │
  └── Integrations
```

The source explicitly places API credentials alongside OAuth clients and integrations under the Tenant aggregate.

---

## Why Tenant API Credentials Must Be Separate

A tenant may have:

```text
Insurer Core System
       ↓
InsureIQ API
```

or:

```text
Tenant CRM
       ↓
InsureIQ API
```

or:

```text
Tenant Data Warehouse
       ↓
InsureIQ API
```

These systems need machine authentication.

Using an employee's username/password would be inappropriate because:

- The credential would be tied to a human.
- Employee departure would unexpectedly break integrations.
- Rotation becomes difficult.
- Permissions become ambiguous.
- Audit attribution becomes weak.
- Secrets could be shared between systems.

Therefore:

```text
Human authentication
        ↓
users / identity domain

Machine authentication
        ↓
tenant_api_credentials
```

---

# 2. Business Definition

A **Tenant API Credential** is a secure authentication credential issued to an external or internal machine client that needs authorized access to InsureIQ APIs on behalf of a tenant.

The source defines it as a secure authentication credential used by external systems to access InsureIQ APIs.

Examples include:

```text
REST API Key
HMAC Key
Service Token
Integration Key
```

The credential belongs to the tenant, not to an individual user.

---

## Example

Suppose:

```text
ABC Insurance
```

uses its own claims-management system.

The integration might be:

```text
ABC Claims System
        │
        │ API request
        ▼
InsureIQ API Gateway
        │
        │ validate credential
        ▼
tenant_api_credentials
        │
        ▼
ABC Insurance Tenant
```

The credential establishes:

```text
Who is calling?
        ↓
Which tenant does the credential belong to?
        ↓
Is the credential active?
        ↓
Has it expired/revoked?
        ↓
What operations is it permitted to perform?
```

---

# 3. Critical Design Principle — What the Entity IS and IS NOT

## The Tenant API Credential IS

- A machine authentication credential.
- A tenant-owned security artifact.
- A child entity of the Tenant aggregate.
- A credential lifecycle object.
- A mechanism for API authentication.
- A mechanism for machine-to-machine integration.
- A security-auditable artifact.

The source explicitly defines the credential as a machine authentication credential and tenant-owned security artifact.

---

## The Tenant API Credential IS NOT

- A human user account.
- A password.
- An OAuth authorization grant.
- An OAuth client registration.
- A tenant itself.
- A general application configuration record.
- A permission definition.
- A billing credential.

The source specifically distinguishes it from a user account and OAuth grant.

---

## Critical Security Principle

The plaintext credential should **not be treated as ordinary database data**.

The source explicitly establishes that API keys are displayed only once and stored as cryptographic hashes.

Therefore:

```text
Credential generated
        ↓
Plaintext shown once
        ↓
Cryptographic hash stored
        ↓
Plaintext discarded
```

---

# 4. Aggregate Root Analysis — DDD Structure

The Tenant remains the aggregate root.

```text
Tenant
│
├── API Credentials
│      ├── Credential A
│      ├── Credential B
│      └── Credential C
│
├── OAuth Clients
│
└── Integrations
```

The source explicitly represents the Tenant relationship as:

```text
Tenant
│
├── API Credentials
├── OAuth Clients
└── Integrations
```

---

## DDD Interpretation

The relationship is:

```text
Tenant Aggregate Root
        │
        └── TenantApiCredential
```

The credential has no meaningful independent business existence outside its tenant.

Its identity is therefore always interpreted in tenant context.

---

## Credential Lifecycle

```text
Tenant
   │
   ▼
Credential Generated
   │
   ▼
Active
   │
   ├───────────────┐
   │               │
   ▼               ▼
Expired          Revoked
   │               │
   └───────┬───────┘
           ▼
       Retained
```

---

# 5. Business Capabilities Supported

The source identifies the following capabilities:

| Capability | Supported |
|---|---|
| API authentication | Yes |
| Machine-to-machine integration | Yes |
| Credential rotation | Yes |
| Credential revocation | Yes |
| Secure external connectivity | Yes |
| Credential auditing | Yes |
| Human user authentication | No |
| OAuth authorization | No — separate OAuth domain/table |
| Permission definition | No |
| Tenant configuration | No |

---

## API Authentication

The credential allows the API Gateway/authentication service to establish that:

```text
This request belongs to Tenant X.
```

---

## Machine-to-Machine Integration

External systems can authenticate without human interaction.

Example:

```text
Insurer CRM
    ↓
API Credential
    ↓
InsureIQ
```

---

## Credential Rotation

Credentials should be replaceable without requiring the integration to remain permanently tied to one secret.

The source explicitly recommends rotation by **revoking the old credential and creating a new one**.

---

## Credential Revocation

A compromised or obsolete credential can be immediately invalidated:

```text
active
  ↓
revoked
```

---

## Credential Auditing

The lifecycle of credentials can be audited:

```text
Created
Used
Rotated
Revoked
Expired
```

---

# 6. Multi-Tenant / Ownership / Isolation Notes

Each API credential belongs to exactly one tenant.

The source explicitly states:

> Each API credential belongs to one tenant.

The ownership relationship is:

```text
tenant_api_credentials.tenant_id
          ↓
       tenants.id
```

---

## Tenant Isolation

Credential queries must always be tenant-scoped unless performed by a privileged platform security service.

Correct:

```sql
SELECT *
FROM tenant_api_credentials
WHERE tenant_id = :tenant_id;
```

Incorrect:

```sql
SELECT *
FROM tenant_api_credentials
WHERE credential_name = :credential_name;
```

without verifying tenant ownership.

---

## Why Credential Isolation Is More Sensitive Than Ordinary Data

A tenant API credential is not merely business data.

A compromised credential can potentially provide access to:

```text
Tenant APIs
Tenant data
Tenant operations
Tenant integrations
```

Therefore a cross-tenant credential leak could become an authentication compromise.

---

## Ownership Boundary

The ownership model is:

```text
Tenant A
│
├── Credential A1
├── Credential A2
└── Credential A3

Tenant B
│
├── Credential B1
└── Credential B2
```

Credential A1 must never authenticate as Tenant B.

---

# 7. Lifecycle

The source defines:

```text
Creation:
Credential Generated

Growth:
Credential Used

Modification:
Rotate by Revoking Old and Creating New

Archival:
Revoked and Retained
```

---

## Creation — Credential Generated

The lifecycle begins when an authorized tenant administrator or provisioning/integration workflow creates a credential.

```text
Authorized Request
       ↓
Credential Generated
       ↓
Plaintext Returned Once
       ↓
Hash Stored
       ↓
Credential Active
```

The plaintext secret should not subsequently be recoverable from the database.

---

## Growth / Usage

The credential can be used repeatedly:

```text
Credential
    ↓
API Request
    ↓
Authentication
    ↓
Tenant Context
```

The `last_used_at` field records the latest known use.

---

## Rotation

The source specifies:

> Rotate by Revoking Old and Creating New.

Therefore rotation should be:

```text
Credential A
active
  ↓
revoked

Credential B
created
  ↓
active
```

rather than modifying the secret value in-place.

This preserves historical identity and auditability.

---

## Expiration

If:

```text
expires_at < NOW()
```

the credential becomes expired.

The status should reflect:

```text
expired
```

according to the application's lifecycle enforcement.

---

## Revocation

A credential may be revoked because of:

- Suspected compromise.
- Integration removal.
- Employee/security administration.
- Credential rotation.
- Tenant deactivation.

---

## Archival

The source specifies that revoked credentials are retained.

Retention is important because the platform may need to establish:

```text
Which credential existed?
When was it created?
When was it revoked?
Was it used?
Who created it?
```

---

# 8. Proposed Schema

## Table Name

`tenant_api_credentials`

## Primary Key Strategy

**UUID**

The source establishes UUID as the primary key.

UUID provides:

- Globally unique credential identity.
- Stable references.
- Safe distributed generation.
- No dependency on sequential identifiers.

---

## Full Field-by-Field Schema Definition

The original source provides the following fields and their intended meanings.

The table below restores the complete key/specification/reason structure.

| Field Name | Data Type | Key Type | Specification | Reason Field Exists |
|---|---|---|---|---|
| `id` | UUID | PK | `NOT NULL` | Stable unique identity of the credential record |
| `tenant_id` | UUID | FK → `tenants.id` | `NOT NULL` | Establishes tenant ownership and isolation |
| `credential_name` | VARCHAR(200) | UK within tenant | `NOT NULL` | Human-readable identifier used to distinguish credentials |
| `api_key_hash` | TEXT | — | `NOT NULL` | Stores the cryptographic representation of the secret rather than plaintext |
| `credential_type` | ENUM | — | `NOT NULL` | Identifies the authentication mechanism represented by the credential |
| `status` | ENUM | — | `NOT NULL` | Represents the credential lifecycle state |
| `scopes` | JSONB | — | `NULL` | Stores the authorized API scope set for this credential |
| `expires_at` | TIMESTAMPTZ | — | `NULL` | Allows credentials to have controlled expiration |
| `last_used_at` | TIMESTAMPTZ | — | `NULL` | Records the most recent known credential use |
| `revoked_at` | TIMESTAMPTZ | — | `NULL` | Records when the credential was explicitly revoked |
| `created_by` | UUID | FK → `users.id` | `NULL` | Identifies the human actor who created the credential when applicable |
| `created_at` | TIMESTAMPTZ | — | `NOT NULL` | Records credential creation time |
| `updated_at` | TIMESTAMPTZ | — | `NOT NULL` | Records metadata/lifecycle record modification time |

The core field set matches the source design.

---

## `id`

The UUID uniquely identifies the credential record.

Example:

```text
Credential A
id = 2e4...
```

The identifier is not itself the secret.

---

## `tenant_id`

The ownership foreign key:

```text
tenant_api_credentials.tenant_id
              ↓
           tenants.id
```

It is mandatory because a tenant API credential cannot exist independently of a tenant.

---

## `credential_name`

Provides a human-readable identifier.

Examples:

```text
Production API
Claims Integration
CRM Connector
Analytics Pipeline
Partner API
```

The source establishes `(tenant_id, credential_name)` as the candidate key and requires uniqueness within a tenant.

---

## `api_key_hash`

Stores the cryptographic hash of the API credential.

This is one of the most important security fields.

The source explicitly states:

> API keys are displayed only once and stored only as cryptographic hashes for security.

Therefore:

```text
Plaintext API key
        ↓
Never persist
        ↓
Hash
        ↓
api_key_hash
```

---

## `credential_type`

Identifies what kind of machine credential is being represented.

Source-defined values include:

```text
api_key
hmac
service_token
integration_key
custom
```

---

## `status`

Represents the current lifecycle state of the credential.

Source-defined values:

```text
active
inactive
revoked
expired
```

---

## `scopes`

Stores the permitted API operations.

Example:

```json
{
  "policies": ["read"],
  "claims": ["read", "write"]
}
```

The source specifies this field as optional JSONB.

The scope mechanism should complement, not replace, the platform's authorization model.

---

## `expires_at`

Determines when the credential should stop being valid.

Nullable means:

```text
No expiration configured
```

can be supported where policy permits.

---

## `last_used_at`

Records the most recent known successful or accepted use of the credential.

This supports:

- Security monitoring.
- Dormant credential detection.
- Operational diagnostics.
- Credential cleanup.

---

## `revoked_at`

Records the explicit revocation timestamp.

This is distinct from:

```text
updated_at
```

because updating a record does not necessarily mean the credential was revoked.

---

## `created_by`

Optional foreign key:

```text
created_by → users.id
```

The source explicitly defines this relationship as nullable.

It is nullable because credentials may be created by automated services.

Example:

```text
Administrator
     ↓
created_by = user UUID
```

versus:

```text
Provisioning Service
     ↓
created_by = NULL
```

---

## `created_at`

Records when the credential record was created.

---

## `updated_at`

Records modification time for the credential metadata.

Although the secret itself should not be rotated in-place, other metadata can change, such as:

```text
status
scopes
expires_at
```

---

# 9. Enum Definitions

The source explicitly defines two enums.

## `credential_type`

| Value | Description |
|---|---|
| `api_key` | Standard API-key-based machine authentication |
| `hmac` | HMAC-based request authentication |
| `service_token` | Token used by a trusted service |
| `integration_key` | Credential associated with an external integration |
| `custom` | Extension point for another supported credential mechanism |

---

## `status`

| Value | Description |
|---|---|
| `active` | Credential is currently valid for authorized use |
| `inactive` | Credential is disabled without necessarily being permanently revoked |
| `revoked` | Credential has been explicitly invalidated |
| `expired` | Credential has passed its expiration time |

---

## Status Lifecycle

```text
                 ┌──────────┐
                 │  active  │
                 └────┬─────┘
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
      inactive     revoked     expired
          │
          ▼
       active
```

The exact allowed transitions should be enforced by the credential-management service.

---

# 10. Why `api_key_hash` Exists

`api_key_hash` is the most security-critical non-obvious field in this table.

The source explicitly establishes that API keys are:

1. Displayed only once.
2. Stored only as cryptographic hashes.

---

## Why Plaintext Must Not Be Stored

If plaintext API keys were stored:

```text
Database breach
      ↓
Credentials immediately compromised
```

With hashed credentials:

```text
Database breach
      ↓
Hash values exposed
      ↓
Plaintext credential is not directly recoverable
```

The authentication layer can validate a presented credential against the stored cryptographic representation according to the selected credential scheme.

---

## Important Implementation Principle

The application should never need:

```text
SELECT plaintext_api_key
```

because no plaintext should exist in the table.

---

# 11. Candidate Keys

The source establishes:

| Key Type | Field(s) |
|---|---|
| Primary Key | `id` |
| Candidate Key | `(tenant_id, credential_name)` |

---

## Primary Key

```text
id
```

provides technical identity.

---

## Candidate Key

```text
tenant_id + credential_name
```

provides tenant-scoped business identity.

For example:

```text
Tenant A + "Production API"
```

is unique.

But another tenant may also have:

```text
Tenant B + "Production API"
```

Therefore global uniqueness on `credential_name` would be incorrect.

---

## Why Global Credential Name Uniqueness Is Wrong

This is valid:

```text
Tenant A
Production API

Tenant B
Production API
```

because names are scoped to tenant ownership.

---

# 12. Constraints

The source explicitly defines:

```text
PK(id)
FK(tenant_id)
UNIQUE(tenant_id, credential_name)
```

The restored complete constraint model is:

| Constraint | Definition | Reason |
|---|---|---|
| Primary Key | `PK(id)` | Unique credential record identity |
| Tenant FK | `tenant_id → tenants.id` | Enforces tenant ownership |
| Credential Name Unique | `UNIQUE(tenant_id, credential_name)` | Prevents ambiguous credential names within one tenant |
| Tenant Required | `tenant_id NOT NULL` | Credential must belong to a tenant |
| Name Required | `credential_name NOT NULL` | Credential needs an identifiable business name |
| Hash Required | `api_key_hash NOT NULL` | Authentication material must have a stored cryptographic representation |
| Type Required | `credential_type NOT NULL` | Authentication mechanism must be known |
| Status Required | `status NOT NULL` | Credential lifecycle must always be defined |
| Created Timestamp Required | `created_at NOT NULL` | Credential creation must be auditable |
| Updated Timestamp Required | `updated_at NOT NULL` | Metadata lifecycle must be trackable |

---

## Lifecycle Consistency Constraints

Production implementation should additionally enforce consistency between fields.

Examples:

```text
status = revoked
        ↓
revoked_at IS NOT NULL
```

and:

```text
status = expired
        ↓
expires_at IS NOT NULL
```

These are logical integrity rules and should be enforced at the service/database level where appropriate.

---

## Credential Rotation Constraint

Rotation should not mutate:

```text
api_key_hash
```

of an existing credential to represent a completely new credential identity.

Instead:

```text
Old Credential
      ↓
revoked

New Credential
      ↓
active
```

This preserves credential history.

---

# 13. Relationships

## Incoming References / Consumers

The source identifies these consumers:

- API Gateway
- Authentication Service
- Integration Service
- Security Monitoring

Additional operational consumers include:

- Audit Service.
- SIEM/security analytics.
- Credential-management workflows.

---

## Outgoing References

### Tenant

```text
tenant_id → tenants.id
```

### User

```text
created_by → users.id
```

The `created_by` relationship is nullable.

---

## Relationship to API Gateway

```text
External System
      ↓
API Request
      ↓
API Gateway
      ↓
Credential Validation
      ↓
tenant_api_credentials
      ↓
Tenant Context
```

The gateway determines whether the credential is valid and which tenant context it represents.

---

## Relationship to Authentication Service

The authentication service validates:

```text
credential
status
expiration
hash
```

and establishes machine identity.

---

## Relationship to Integration Service

Integrations can associate their machine-access mechanism with a tenant API credential.

---

## Relationship to Security Monitoring

Security monitoring can detect:

```text
Credential created
Credential used
Credential inactive
Credential expired
Credential revoked
```

and potentially suspicious use patterns.

---

# 14. Cardinality Analysis

The source specifies:

> Credentials per tenant: **5–100**.

| Relationship | Expected Cardinality |
|---|---:|
| Tenant → API Credentials | 5–100 typical |
| API Credential → Tenant | Exactly 1 |
| User → Created Credentials | 0–N |
| API Credential → Creating User | 0–1 |
| Integration → Credential | 0–N depending on integration design |

---

## Platform Scale

If InsureIQ has:

```text
100,000 tenants
```

and an average:

```text
20 credentials / tenant
```

the table would contain approximately:

```text
2,000,000 credentials
```

This remains manageable for a relational database.

---

## Why Credential Count Should Be Controlled

Unlike ordinary configuration rows, credentials represent security attack surfaces.

A tenant creating thousands of credentials unnecessarily can cause:

- Management complexity.
- Credential sprawl.
- Security monitoring overhead.
- Increased rotation burden.

Therefore a reasonable tenant-level credential policy may eventually impose limits.

---

# 15. Query Patterns

The source explicitly provides the following patterns.

## Retrieve Active Tenant Credentials

```sql
SELECT *
FROM tenant_api_credentials
WHERE tenant_id = :tenant_id
AND status = 'active';
```

Used by:

- Administration.
- Integration management.
- Credential inventory.

---

## Retrieve Specific Credential

```sql
SELECT *
FROM tenant_api_credentials
WHERE tenant_id = :tenant_id
AND credential_name = :credential_name;
```

Supports credential administration.

---

## Retrieve Expiring Credentials

```sql
SELECT *
FROM tenant_api_credentials
WHERE tenant_id = :tenant_id
AND status = 'active'
AND expires_at IS NOT NULL
AND expires_at <= :expiration_threshold
ORDER BY expires_at;
```

Useful for credential rotation workflows.

---

## Retrieve Recently Used Credentials

```sql
SELECT *
FROM tenant_api_credentials
WHERE tenant_id = :tenant_id
ORDER BY last_used_at DESC NULLS LAST;
```

Useful for security and operational administration.

---

## Retrieve Revoked Credentials

```sql
SELECT *
FROM tenant_api_credentials
WHERE tenant_id = :tenant_id
AND status = 'revoked'
ORDER BY revoked_at DESC;
```

Supports audit and security investigation.

---

## Find Dormant Credentials

```sql
SELECT *
FROM tenant_api_credentials
WHERE tenant_id = :tenant_id
AND status = 'active'
AND (
    last_used_at IS NULL
    OR last_used_at < :dormancy_threshold
);
```

Useful for identifying credential sprawl.

---

## Authentication Lookup

A production authentication path should generally avoid retrieving every tenant credential.

The lookup should use an appropriate credential identifier/fingerprint and then validate the cryptographic representation.

The exact authentication lookup key is not specified by the source and therefore should be finalized during API Gateway/security architecture design.

---

# 16. Index Strategy

The source defines:

- `PK(id)`
- `INDEX(tenant_id)`
- `UNIQUE(tenant_id, credential_name)`
- `INDEX(status)`
- `INDEX(expires_at)`
- `INDEX(last_used_at)`

---

## Primary Key

```sql
PRIMARY KEY (id)
```

Provides direct credential record lookup.

---

## Tenant Index

```sql
INDEX(tenant_id)
```

Supports tenant-scoped administration and security operations.

---

## Unique Tenant Credential Name

```sql
UNIQUE(tenant_id, credential_name)
```

This simultaneously:

- Enforces the candidate key.
- Supports lookup by tenant + name.

---

## Status Index

```sql
INDEX(status)
```

Supports operational queries such as:

```text
all revoked credentials
all expired credentials
all active credentials
```

---

## Expiration Index

```sql
INDEX(expires_at)
```

Supports:

```text
credentials expiring soon
expired credentials
credential rotation jobs
```

---

## Last-Used Index

```sql
INDEX(last_used_at)
```

Supports:

```text
dormant credentials
recent credential activity
security monitoring
```

---

## Security Lookup Consideration

The source does not specify a separate credential fingerprint/index.

For high-volume authentication, production implementation may require a non-secret lookup identifier or fingerprint.

That is an **implementation consideration**, not a source-defined field, so it should not be silently added to the baseline schema.

---

# 17. Read / Write Characteristics

The source establishes:

```text
Reads: Very High
Writes: Low
```

---

## Reads — Very High

Credentials may be consulted frequently during machine-to-machine API authentication.

Potential path:

```text
Every API request
      ↓
API Gateway
      ↓
Credential validation
```

Therefore credential authentication can become a high-read workload.

---

## Writes — Low

Credential creation is relatively infrequent.

Writes occur during:

- Initial integration setup.
- Credential rotation.
- Credential revocation.
- Credential expiration.
- Scope changes.
- Administrative updates.

---

## Updates

Metadata updates are possible, but the credential secret itself should not be casually overwritten.

Rotation should be:

```text
Revoke old
+
Create new
```

as established by the source.

---

## Deletes

The source's lifecycle specifies:

```text
Revoked and Retained
```

Therefore normal hard deletion is not the preferred lifecycle operation.

---

# 18. Caching Strategy

The source specifies:

```text
Redis:
tenant-api-credentials:{tenant_id}
```

and explicitly states:

> Do not cache plaintext API keys.

---

## What May Be Cached

Safe metadata can include:

```text
credential ID
credential name
credential type
status
scopes
expires_at
revoked_at
last_used_at
```

subject to security policy.

---

## What Must Not Be Cached

Do not cache:

```text
plaintext API key
plaintext secret
raw authentication token
```

The architecture should never introduce a plaintext-secret cache merely to improve performance.

---

## Redis Pattern

```text
tenant-api-credentials:{tenant_id}
```

can accelerate administrative credential listings.

For authentication, a more targeted credential lookup/cache may eventually be required.

---

## Cache Invalidation

Credential state changes require immediate invalidation:

```text
Credential Revoked
       ↓
Database UPDATE
       ↓
Invalidate credential cache
       ↓
Future requests rejected
```

This is particularly important because stale credential caches could allow revoked credentials to remain valid longer than intended.

---

# 19. Security Considerations

The source explicitly identifies:

- Hash API keys.
- RBAC.
- Rotation.
- Expiration.
- Audit logging.
- Tenant isolation.
- Rate limiting.

These are all mandatory security concerns.

---

## 1. Hash API Keys

Never store plaintext credentials.

```text
Plaintext
   ↓
Shown once
   ↓
Hash
   ↓
Database
```

---

## 2. RBAC

Only authorized tenant administrators/security roles should be able to:

- Create credentials.
- View credential metadata.
- Revoke credentials.
- Rotate credentials.
- Modify scopes.

---

## 3. Rotation

Credential rotation should be supported without exposing the existing secret.

```text
Old Credential
       ↓
Revoked

New Credential
       ↓
Active
```

---

## 4. Expiration

Credentials should support time-bound validity.

This reduces the lifetime of compromised credentials.

---

## 5. Audit Logging

Sensitive actions should produce audit records:

```text
CredentialCreated
CredentialRotated
CredentialRevoked
CredentialUsed
```

---

## 6. Tenant Isolation

Credential records must never cross tenant boundaries.

A credential issued to Tenant A must never authenticate as Tenant B.

---

## 7. Rate Limiting

Machine credentials should be subject to API rate limits.

A compromised credential must not allow unlimited automated requests.

---

## 8. Secret Exposure Prevention

Do not expose:

```text
api_key_hash
```

through normal administrative APIs unless absolutely required.

Even hashes should be treated as sensitive authentication material.

---

## 9. Logging

Never log:

```text
Authorization header
API key
plaintext secret
```

in application logs.

Instead log:

```text
credential_id
tenant_id
request_id
timestamp
result
```

where appropriate.

---

# 20. Audit Requirements

The source defines these credential lifecycle events:

| Event | Trigger | Purpose |
|---|---|---|
| `TenantApiCredentialCreated` | New credential generated | Record credential creation |
| `TenantApiCredentialRotated` | Old credential revoked and replacement created | Record credential rotation |
| `TenantApiCredentialRevoked` | Credential explicitly invalidated | Record security/lifecycle revocation |
| `TenantApiCredentialExpired` | Credential reaches expiration | Record expiration |
| `TenantApiCredentialUsed` | Credential successfully used | Record machine authentication activity |

---

## `TenantApiCredentialCreated`

Triggered when a new credential is issued.

Important metadata:

```text
tenant_id
credential_id
credential_type
created_by
created_at
```

The plaintext secret should **never** be placed into the event payload.

---

## `TenantApiCredentialRotated`

Represents:

```text
Old Credential
     ↓
Revoked

New Credential
     ↓
Created
```

The event should reference credential identities, not plaintext secrets.

---

## `TenantApiCredentialRevoked`

Generated when the credential becomes explicitly invalid.

Useful for:

- Security.
- Compliance.
- Incident response.
- Audit.

---

## `TenantApiCredentialExpired`

Generated when the credential reaches its expiration boundary.

---

## `TenantApiCredentialUsed`

Records credential use.

Because this can be extremely high-volume, the implementation should carefully distinguish:

```text
business audit event
```

from:

```text
high-volume access telemetry
```

The source identifies `TenantApiCredentialUsed` as an event, but production implementations may route high-frequency usage telemetry to a specialized security/observability system rather than creating an expensive durable business-event row for every request.

---

# 21. Event Producers / Event Consumers

The source identifies producers and consumers as follows.

## Producers

- `TenantApiCredentialCreated`
- `TenantApiCredentialRotated`
- `TenantApiCredentialUsed`

Additional lifecycle producers:

- `TenantApiCredentialRevoked`
- `TenantApiCredentialExpired`

---

## Consumers

- API Gateway
- Authentication Service
- Security Monitoring
- Audit Service
- SIEM Platform

---

## Credential Creation Workflow

```text
Tenant Administrator
        ↓
Credential Management Service
        ↓
Generate Credential
        ↓
Hash Secret
        ↓
tenant_api_credentials
        ↓
TenantApiCredentialCreated
        ↓
Audit / Security Monitoring
```

---

## API Authentication Workflow

```text
External System
       ↓
API Request
       ↓
API Gateway
       ↓
Credential Validation
       ↓
Authentication Service
       ↓
tenant_api_credentials
       ↓
Tenant Context
       ↓
Authorized API Request
```

---

## Security Monitoring Workflow

```text
Credential Used
       ↓
Authentication Service
       ↓
Security Telemetry
       ↓
Security Monitoring / SIEM
       ↓
Anomaly Detection
```

---

# 22. Alternative Designs Considered

The source explicitly considers three designs:

| Option | Description | Verdict |
|---|---|---|
| A | Store credentials in `tenant_settings` | **Rejected** |
| B | JSON credentials | **Rejected** |
| **C** | Dedicated `tenant_api_credentials` table | **Chosen** |

---

## Option A — Store in `tenant_settings`

### Rejected

Credentials are fundamentally different from ordinary tenant configuration.

Combining:

```text
timezone
branding
locale
```

with:

```text
API secrets
```

creates poor security boundaries.

A dedicated table permits:

- Separate permissions.
- Separate indexing.
- Credential-specific lifecycle.
- Credential-specific auditing.
- Security monitoring.
- Rotation/revocation semantics.

---

## Option B — JSON Credentials

Example:

```json
{
  "api_credentials": [
    {
      "name": "production",
      "key": "..."
    }
  ]
}
```

### Rejected

This weakens:

- Relational constraints.
- Tenant-scoped uniqueness.
- Credential lifecycle queries.
- Indexing.
- Auditing.
- Security controls.

It also encourages storing secrets as arbitrary configuration.

---

## Option C — Dedicated Table

### Chosen

A dedicated table provides:

- Strong tenant ownership.
- Explicit credential lifecycle.
- Independent security controls.
- Secure hashed-secret storage.
- Credential-specific indexes.
- Rotation/revocation support.
- Auditing.
- High-performance lookup.
- Integration with API Gateway and authentication services.

This is the correct design for a multi-tenant enterprise SaaS platform.

---

# 23. Final Design Assessment

The source rates the table as follows:

| Attribute | Rating |
|---|---|
| Complexity | **Medium** |
| Read Volume | **Very High** |
| Write Volume | **Low** |
| Security Importance | **Critical** |
| Business Criticality | **Very High** |
| Scalability | **Excellent** |
| Recommended Status | **Core Security Table** |

---

# Overall Assessment

`tenant_api_credentials` is a **core security table** within the Tenant Management domain.

Its architectural purpose is:

```text
                    TENANT
                       │
                       ▼
             API Credential
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
 Authentication     Scope         Lifecycle
        │              │              │
        ▼              ▼              ▼
 API Gateway       Authorization   Rotation
                                  Revocation
                                  Expiration
```

It provides the machine identity layer required for external systems to securely interact with InsureIQ.

---

## Complete Credential Lifecycle

```text
                 Credential Generated
                         │
                         ▼
                    Plaintext
                  shown once only
                         │
                         ▼
                    Hash Stored
                         │
                         ▼
                      ACTIVE
                    /    |    \
                   /     |     \
                  ▼      ▼      ▼
            INACTIVE  REVOKED  EXPIRED
                  │
                  │ re-enable where policy permits
                  ▼
                ACTIVE
```

For rotation:

```text
Old Credential
      │
      ▼
   REVOKED
      │
      │
      └──────────────┐
                     │
                     ▼
              New Credential
                     │
                     ▼
                   ACTIVE
```

This preserves historical identity instead of mutating one credential record into another credential.

---

# Critical Production Invariants

1. **Every API credential belongs to exactly one tenant.**
2. **`tenant_id` is mandatory and references `tenants.id`.**
3. **API credentials are machine identities, not human identities.**
4. **API credentials are not OAuth grants.**
5. **Plaintext API keys must not be persisted.**
6. **`api_key_hash` stores the cryptographic representation of the credential.**
7. **The plaintext credential is displayed only once.**
8. **`credential_name` is unique within a tenant.**
9. **The same credential name may exist in different tenants.**
10. **`credential_type` must identify the authentication mechanism.**
11. **`status` must always represent the credential lifecycle state.**
12. **Credential rotation should revoke the old credential and create a new one.**
13. **Existing credential identity should not be silently reused for a completely new secret.**
14. **Expired credentials must not remain valid.**
15. **Revoked credentials must not authenticate.**
16. **Credential creation and revocation require appropriate RBAC authorization.**
17. **Credential use should be monitored for security purposes.**
18. **Credential-related audit events must never contain plaintext secrets.**
19. **Credential metadata must remain tenant-isolated.**
20. **Credential caches must never contain plaintext API keys.**
21. **Revocation must invalidate relevant caches promptly.**
22. **API Gateway and Authentication Service are primary runtime consumers.**
23. **Security Monitoring and SIEM provide security visibility.**
24. **High-volume credential-use telemetry should be distinguished from low-volume business audit events.**
25. **The table should remain focused on machine authentication credentials and their lifecycle, rather than becoming a general tenant configuration store.**

---

# Final Conceptual Model

```text
┌──────────────────────────────────────────────┐
│                    TENANT                    │
│                                              │
│  tenant_id                                   │
└──────────────────────┬───────────────────────┘
                       │
                       │ owns
                       ▼
┌──────────────────────────────────────────────┐
│          tenant_api_credentials              │
│                                              │
│ id                                           │
│ tenant_id                                    │
│ credential_name                              │
│ api_key_hash                                 │
│ credential_type                              │
│ status                                       │
│ scopes                                       │
│ expires_at                                   │
│ last_used_at                                 │
│ revoked_at                                   │
│ created_by                                   │
│ created_at                                   │
│ updated_at                                   │
└──────────────────────┬───────────────────────┘
                       │
                       │ authenticated machine request
                       ▼
                 ┌─────────────┐
                 │ API Gateway │
                 └──────┬──────┘
                        │
                        ▼
             ┌────────────────────┐
             │ Authentication     │
             │ Service            │
             └─────────┬──────────┘
                       │
                       ▼
                Tenant Context
                       │
                       ▼
              Authorized API Access
```

The essential architectural principle is:

> **`tenant_api_credentials` provides tenant-scoped machine identity for secure API access while preserving credential lifecycle, rotation, revocation, auditing, and tenant isolation.**

The source establishes this as a **Core Security Table** with **critical security importance**, **very high read volume**, **low write volume**, and **excellent scalability**.

**Step 3 — `tenant_api_credentials` is complete.**

No file has been created in this response. The next step is **Step 4 — package this exact Step 3 content into the Table 17 `.md` file.**
