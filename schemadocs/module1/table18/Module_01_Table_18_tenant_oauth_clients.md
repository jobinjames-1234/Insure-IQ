# Step 3 — Table 18: `tenant_oauth_clients`

The Module 1 inventory identifies **Table 18** as `tenant_oauth_clients`, with the purpose **“OAuth client registrations.”**

The source design defines this table as the repository for **OAuth 2.0 / OpenID Connect client registrations for tenant-owned applications**. It supports delegated authorization, client registration, secret rotation, redirect-URI validation, and secure third-party integrations.

This table is intentionally kept separate from **Table 17 — `tenant_api_credentials`**. Table 17 represents API authentication credentials; Table 18 represents OAuth client registrations.

I am also explicitly restoring the non-degraded schema standard:

> **Field Name → Data Type → Key Type → Specification → Reason Field Exists**

The original Table 18 document had compressed this into `Field / Type / Notes`. The detailed version below restores the missing key classification, nullability/specification, constraints, and field-level business rationale while preserving the source-defined field set.

---

# 1. Why This Table Exists

The `tenant_oauth_clients` table stores **OAuth 2.0 / OpenID Connect client registrations belonging to tenant-owned applications**.

The table exists because InsureIQ needs to support applications that authenticate and participate in delegated authorization flows without treating those applications as human users.

Examples from the source include:

- Mobile App
- Customer Portal
- Broker Portal
- CRM Integration
- ERP Connector

The basic model is:

```text
Tenant
   │
   ├── API Credentials
   │
   ├── OAuth Clients
   │
   └── Integrations
```

The OAuth client therefore represents an **application identity**, rather than an individual human identity.

---

## Why OAuth Clients Must Be Separate From API Credentials

Table 17:

```text
tenant_api_credentials
        ↓
Machine API authentication credentials
```

Table 18:

```text
tenant_oauth_clients
        ↓
OAuth/OIDC application registrations
```

These are related security resources but have different protocol semantics.

An API credential can directly authenticate a machine request.

An OAuth client participates in an authorization protocol involving concepts such as:

```text
Client
   ↓
Authorization Server
   ↓
Authorization Flow
   ↓
Authorization Code / Token
   ↓
Protected Resource
```

Therefore the two entities should not be merged merely because both contain authentication-related information.

---

# 2. Business Definition

A **Tenant OAuth Client** represents an application registered with the InsureIQ Authorization Server.

Examples include:

```text
Mobile App
Customer Portal
Broker Portal
CRM Integration
ERP Connector
```

The registration identifies:

- Which application is requesting authorization.
- Which OAuth grant types it supports.
- Which redirect URIs are permitted.
- Which scopes it may request.
- Which client-authentication mechanism it uses.
- Whether the client is active.
- Whether its client secret has expired.
- When it was last used.

The OAuth client is therefore the persistent **application registration**, not the access token issued to that application.

---

## Example

Consider a tenant's broker portal:

```text
ABC Insurance
      │
      ▼
Broker Portal
      │
      │ OAuth Authorization Request
      ▼
InsureIQ Authorization Server
      │
      ▼
tenant_oauth_clients
      │
      ▼
Validate Client Registration
```

The registration can establish:

```text
client_id
      ↓
Which application?

grant_types
      ↓
Which authorization flows?

redirect_uris
      ↓
Where may authorization responses be sent?

scopes
      ↓
What resources may be requested?

authentication_method
      ↓
How does the client authenticate?

status
      ↓
Is the client currently permitted?
```

---

# 3. Critical Design Principle — What the Entity IS and IS NOT

## The Tenant OAuth Client IS

- An OAuth client registration.
- A tenant-owned security resource.
- A child entity of the Tenant aggregate.
- An application identity.
- A configuration object for OAuth authorization.
- A registration consumed by the Authorization Server.
- A security-auditable resource.

The source explicitly defines it as an OAuth client registration and tenant-owned security resource.

---

## The Tenant OAuth Client IS NOT

- A human user account.
- An access token.
- A refresh token.
- An authorization grant.
- A tenant.
- A general API key.
- A general tenant setting.

The source specifically states that it is **not a user account or access token**.

---

## Critical Security Principle

The OAuth client registration may contain a client secret hash:

```text
client_secret_hash
```

but should never require persistent plaintext client-secret storage.

The source explicitly requires client-secret hashing and states that plaintext client secrets must not be cached.

Therefore:

```text
Client Secret Generated
        ↓
Plaintext delivered according to OAuth client-registration flow
        ↓
Cryptographic hash stored
        ↓
Plaintext not persisted
```

---

# 4. Aggregate Root Analysis — DDD Structure

The Tenant remains the aggregate root.

```text
Tenant
│
├── API Credentials
│
├── OAuth Clients
│
└── Integrations
```

This structure is explicitly defined by the source.

---

## DDD Interpretation

```text
Tenant Aggregate Root
        │
        └── TenantOAuthClient
```

The OAuth client belongs to the tenant and exists in the tenant's security/integration context.

Its ownership relationship is:

```text
tenant_oauth_clients.tenant_id
            ↓
         tenants.id
```

---

## OAuth Client Versus OAuth Token

The distinction should remain:

```text
tenant_oauth_clients
        ↓
Application registration
```

versus:

```text
access_tokens
        ↓
Issued authorization artifact
```

The source inventory places OAuth-related authorization artifacts in the Identity & Access Management domain, while `tenant_oauth_clients` belongs to Tenant Management.

This separation prevents the tenant configuration domain from becoming a token store.

---

# 5. Business Capabilities Supported

The source identifies these capabilities:

| Capability | Supported |
|---|---|
| OAuth 2.0 authorization | Yes |
| OpenID Connect | Yes |
| Client registration | Yes |
| Secret rotation | Yes |
| Redirect URI validation | Yes |
| Delegated authorization | Yes |
| Machine/application identity | Yes |
| Human user authentication | No |
| Access-token storage | No |
| General API-key authentication | No — Table 17 |
| Tenant configuration | No |

---

## OAuth 2.0 Authorization

The table allows registered tenant applications to participate in OAuth authorization flows.

---

## OpenID Connect

The same client-registration model can support OIDC flows where identity information is layered onto OAuth authorization.

---

## Client Registration

A tenant-owned application can be registered with:

```text
client_id
client_name
grant_types
redirect_uris
scopes
authentication_method
```

---

## Secret Rotation

The client secret can be rotated without replacing the entire conceptual client registration.

The source explicitly includes:

```text
TenantOAuthClientSecretRotated
```

as an audit event.

---

## Redirect URI Validation

OAuth redirect URIs are security-sensitive.

The registered:

```text
redirect_uris
```

provide the allowed destinations against which authorization requests can be validated.

---

## Delegated Authorization

OAuth enables an application to obtain authorized access through the authorization server rather than directly receiving a user's password.

---

# 6. Multi-Tenant / Ownership / Isolation Notes

The source explicitly states:

> Each OAuth client belongs to one tenant.

Therefore:

```text
Tenant A
│
├── OAuth Client A1
└── OAuth Client A2

Tenant B
│
├── OAuth Client B1
└── OAuth Client B2
```

An OAuth client belonging to Tenant A must never be interpreted as a client of Tenant B.

---

## Tenant Isolation

Administrative queries should be tenant-scoped:

```sql
SELECT *
FROM tenant_oauth_clients
WHERE tenant_id = :tenant_id;
```

The application must derive the tenant context from the authenticated administrative/security context rather than trusting an arbitrary tenant identifier from an untrusted client.

---

## Client ID Globality

There is an important distinction in the source:

```text
client_id
```

is globally unique, while:

```text
(tenant_id, client_name)
```

is a tenant-scoped candidate key.

Therefore:

```text
client_id
    ↓
global application identity
```

while:

```text
tenant_id + client_name
    ↓
tenant-local business identity
```

---

## Cross-Tenant Authentication Risk

If a client ID could be interpreted in the wrong tenant context, an application could potentially authenticate against the wrong security boundary.

Therefore the authorization server must resolve the client registration unambiguously.

---

# 7. Lifecycle

The source defines the lifecycle as:

```text
Creation:
Client Registered

Growth:
Used in Authorization Flows

Modification:
Secret Rotated / Configuration Updated

Archival:
Disabled or Revoked
```

---

## Creation — Client Registered

The lifecycle begins when a tenant-owned application is registered.

```text
Tenant Administrator / Registration Workflow
                ↓
       OAuth Client Registration
                ↓
       tenant_oauth_clients
                ↓
              active
```

The registration establishes the client's protocol configuration.

---

## Growth / Usage

The client can participate in authorization flows repeatedly.

```text
OAuth Client
      ↓
Authorization Request
      ↓
Authorization Server
      ↓
Authorization Flow
```

The `last_used_at` field records the latest known usage.

---

## Configuration Update

The source explicitly allows:

```text
Configuration Updated
```

Examples include changes to:

```text
grant_types
redirect_uris
scopes
authentication_method
status
```

Such changes are security-sensitive and should be audited.

---

## Secret Rotation

The client secret can be rotated while retaining the same client registration.

Conceptually:

```text
Client
  │
  ├── Existing Secret
  │
  └── New Secret
```

The old secret should cease to be valid according to the rotation policy.

---

## Disable / Inactive

A client can become:

```text
inactive
```

without necessarily representing permanent revocation.

This provides an operational state for temporarily disabling the registration.

---

## Suspension

The source defines:

```text
suspended
```

as a distinct status.

This permits a security/operational state that is different from ordinary inactivity.

---

## Revocation

A revoked OAuth client should no longer be accepted for authorization.

Typical reasons can include:

- Security incident.
- Application retirement.
- Tenant integration removal.
- Compromise.
- Administrative action.

---

# 8. Proposed Schema

## Table Name

`tenant_oauth_clients`

## Primary Key Strategy

**UUID**

The source explicitly specifies UUID as the primary key.

The UUID provides the database identity of the client registration.

---

## Full Field-by-Field Schema Definition

The source defines the following field set.

The table below restores the full non-degraded schema format.

| Field Name | Data Type | Key Type | Specification | Reason Field Exists |
|---|---|---|---|---|
| `id` | UUID | PK | `NOT NULL` | Stable database identity of the OAuth client registration |
| `tenant_id` | UUID | FK → `tenants.id` | `NOT NULL` | Establishes tenant ownership and isolation |
| `client_id` | VARCHAR(255) | UK | `NOT NULL, UNIQUE` | Stable public OAuth client identifier required by OAuth specifications |
| `client_secret_hash` | TEXT | — | `NULL` | Stores the cryptographic representation of the client secret when the selected authentication method requires one |
| `client_name` | VARCHAR(200) | Candidate within tenant | `NOT NULL` | Human-readable name used to identify the registered application |
| `grant_types` | JSONB | — | `NOT NULL` | Defines the OAuth authorization grant types supported by the client |
| `redirect_uris` | JSONB | — | `NOT NULL` | Defines the authorized redirect destinations for authorization flows |
| `scopes` | JSONB | — | `NULL` | Defines the scopes the client is allowed/requested to use |
| `authentication_method` | ENUM | — | `NOT NULL` | Defines how the OAuth client authenticates to the authorization server |
| `status` | ENUM | — | `NOT NULL` | Represents the lifecycle/security state of the client registration |
| `secret_expires_at` | TIMESTAMPTZ | — | `NULL` | Defines expiration of the client secret |
| `last_used_at` | TIMESTAMPTZ | — | `NULL` | Records the most recent known use of the OAuth client |
| `created_by` | UUID | FK → `users.id` | `NULL` | Identifies the human actor who created the registration when applicable |
| `created_at` | TIMESTAMPTZ | — | `NOT NULL` | Records registration creation time |
| `updated_at` | TIMESTAMPTZ | — | `NOT NULL` | Records metadata/configuration modification time |

The source-defined physical field set is preserved here.

---

## `id`

The UUID is the technical identity of the OAuth client registration.

It is not the OAuth protocol's public client identifier.

That distinction is important:

```text
id
 ↓
Database identity
```

versus:

```text
client_id
 ↓
OAuth protocol identity
```

---

## `tenant_id`

Establishes ownership:

```text
tenant_oauth_clients.tenant_id
              ↓
           tenants.id
```

It is mandatory because the source defines every OAuth client as belonging to one tenant.

---

## `client_id`

This is the public OAuth identifier.

It is the identifier that an OAuth authorization request uses to identify the application.

The source explicitly states that `client_id` provides the stable public identifier required by OAuth specifications.

---

## `client_secret_hash`

Stores the cryptographic representation of the client secret.

It is optional because not every OAuth authentication method requires a client secret.

For example:

```text
authentication_method = none
```

does not require a traditional client secret.

Therefore:

```text
client_secret_hash = NULL
```

can be valid.

---

## `client_name`

Provides the human-readable application name.

Examples:

```text
ABC Customer Portal
ABC Broker Portal
ABC Mobile Application
ABC CRM Integration
```

The source establishes:

```text
(tenant_id, client_name)
```

as a candidate key.

---

## `grant_types`

Stores the OAuth grant types supported by the client.

The source specifies this as required JSONB.

This allows the registration to describe the authorization flows supported by that client.

---

## `redirect_uris`

Stores authorized redirect destinations.

This is mandatory according to the source.

Redirect URIs are security-critical because authorization responses must not be redirected to arbitrary destinations.

---

## `scopes`

Stores the scopes associated with the OAuth client.

The source defines it as optional JSONB.

Example conceptual values:

```text
openid
profile
policy.read
claims.read
claims.write
```

The exact scope vocabulary belongs to the authorization architecture and is not specified by the Table 18 source.

---

## `authentication_method`

Defines how the client authenticates to the authorization server.

The source explicitly defines five values.

---

## `status`

Represents the operational/security state of the client registration.

The source defines:

```text
active
inactive
suspended
revoked
```

---

## `secret_expires_at`

Controls the lifetime of a client secret.

A client registration can remain conceptually valid while its current secret has expired.

This allows secret lifecycle management to be separated from client identity.

---

## `last_used_at`

Records the most recent known usage.

This supports:

- Security monitoring.
- Dormant-client detection.
- Operational administration.
- Investigation.

---

## `created_by`

Nullable foreign key:

```text
created_by → users.id
```

The source explicitly defines this relationship as nullable.

This permits both:

```text
Administrator
      ↓
created_by = user UUID
```

and:

```text
Automated Registration Service
      ↓
created_by = NULL
```

---

## `created_at`

Records when the client registration was created.

---

## `updated_at`

Records when the registration metadata was last changed.

This supports:

- Configuration auditing.
- Cache invalidation.
- Operational diagnostics.

---

# 9. Enum Definitions

The source explicitly defines the following enums.

## `authentication_method`

| Value | Description |
|---|---|
| `client_secret_basic` | Client authenticates using a client secret through the basic authentication mechanism |
| `client_secret_post` | Client authenticates by supplying the client secret through the request body mechanism |
| `private_key_jwt` | Client authenticates using a private-key JWT mechanism |
| `client_secret_jwt` | Client authenticates using a client-secret JWT mechanism |
| `none` | Client does not use a client secret for authentication |

The exact protocol behavior should follow the OAuth/OIDC implementation specification adopted by InsureIQ.

---

## `status`

| Value | Description |
|---|---|
| `active` | Client is currently permitted to participate in authorization flows |
| `inactive` | Client is disabled without necessarily representing permanent revocation |
| `suspended` | Client is temporarily restricted |
| `revoked` | Client registration has been explicitly invalidated |

---

# 10. Why `client_id` Exists

`client_id` is the most important protocol-specific identifier in the table.

The source explicitly states:

> Provides the stable public identifier required by OAuth specifications.

---

## Why `id` Is Not Enough

The database UUID:

```text
id
```

is an internal relational identifier.

OAuth clients require:

```text
client_id
```

as their protocol-level public identity.

Therefore:

```text
Database
   ↓
id

OAuth Protocol
   ↓
client_id
```

---

## Why `client_id` Must Be Unique

The authorization server needs to resolve an OAuth client unambiguously.

Therefore:

```text
UNIQUE(client_id)
```

is required by the source.

---

## Client Name Is Different

```text
client_name
```

is a human-readable label.

It is not appropriate as the OAuth protocol identifier.

For example:

```text
client_name:
ABC Customer Portal
```

can be changed without changing the protocol identity:

```text
client_id:
abc-customer-portal-8f31...
```

---

# 11. Candidate Keys

The source establishes:

| Key Type | Field(s) | Rationale |
|---|---|---|
| Primary Key | `id` | Technical identity |
| Candidate Key | `client_id` | OAuth protocol identity |
| Candidate Key | `(tenant_id, client_name)` | Tenant-scoped business identity |

---

## Primary Key

```text
id
```

is the database-level identity.

---

## Candidate Key — `client_id`

```text
client_id
```

must uniquely identify the registered OAuth application.

---

## Candidate Key — `(tenant_id, client_name)`

This identifies a tenant's named OAuth client.

For example:

```text
Tenant A + Customer Portal
```

can be distinct from:

```text
Tenant B + Customer Portal
```

---

## Why `client_name` Alone Is Not Unique

Two tenants may legitimately have:

```text
Customer Portal
```

as an application name.

Therefore global uniqueness belongs to:

```text
client_id
```

not:

```text
client_name
```

---

# 12. Constraints

The source explicitly specifies:

```text
PK(id)
FK(tenant_id)
UNIQUE(client_id)
Required grant_types
Required redirect_uris
```

The restored constraint model is:

| Constraint | Definition | Reason |
|---|---|---|
| Primary Key | `PK(id)` | Unique database identity |
| Tenant FK | `tenant_id → tenants.id` | Enforces tenant ownership |
| Client ID Unique | `UNIQUE(client_id)` | Required for unambiguous OAuth client identification |
| Tenant Required | `tenant_id NOT NULL` | Every client belongs to a tenant |
| Client ID Required | `client_id NOT NULL` | OAuth registration requires public client identity |
| Client Name Required | `client_name NOT NULL` | Registration needs a human-readable identifier |
| Grant Types Required | `grant_types NOT NULL` | Client must declare supported authorization flows |
| Redirect URIs Required | `redirect_uris NOT NULL` | Authorization redirects must be explicitly registered |
| Authentication Method Required | `authentication_method NOT NULL` | Server must know how the client authenticates |
| Status Required | `status NOT NULL` | Registration must have an operational state |
| Created Timestamp Required | `created_at NOT NULL` | Registration creation must be traceable |
| Updated Timestamp Required | `updated_at NOT NULL` | Configuration modifications must be traceable |

---

## Client Secret Constraint

The source makes `client_secret_hash` optional.

Therefore:

```text
authentication_method = none
```

may legitimately correspond to:

```text
client_secret_hash = NULL
```

For secret-based methods, the application should require an appropriate secret representation.

---

## Redirect URI Security Constraint

Registered redirect URIs must be validated before persistence.

The source explicitly identifies redirect URI validation as a business capability and security consideration.

---

## HTTPS Requirement

The source explicitly requires enforcing HTTPS as part of security considerations.

Therefore production authorization flows should reject insecure redirect destinations where the deployment/security policy requires HTTPS.

---

# 13. Relationships

## Incoming References

The source identifies:

- Authorization Server
- Authentication Service
- API Gateway

Additional logical consumers include:

- Security Monitoring.
- Audit Service.
- SIEM Platform.

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

## Authorization Server Relationship

The Authorization Server is the primary consumer.

```text
OAuth Request
      ↓
Authorization Server
      ↓
client_id
      ↓
tenant_oauth_clients
      ↓
Client Registration
```

---

## Authentication Service Relationship

The Authentication Service validates the client's configured authentication method and secret representation where applicable.

---

## API Gateway Relationship

The API Gateway may use the client registration to establish application identity and enforce authorization-related policies before allowing access to protected APIs.

---

## Security Monitoring Relationship

Security monitoring can consume:

```text
Client Created
Client Updated
Client Authenticated
Client Secret Rotated
Client Revoked
```

for security analysis.

---

# 14. Cardinality Analysis

The source specifies:

> OAuth clients per tenant: **5–100**.

| Relationship | Expected Cardinality |
|---|---:|
| Tenant → OAuth Clients | 5–100 typical |
| OAuth Client → Tenant | Exactly 1 |
| User → Created OAuth Clients | 0–N |
| OAuth Client → Creating User | 0–1 |
| `client_id` → Client Registration | Exactly 1 |

---

## Platform Scale

At:

```text
100,000 tenants
```

and:

```text
20 OAuth clients / tenant
```

the table would contain approximately:

```text
2,000,000 OAuth client registrations
```

This is consistent with a manageable relational workload.

The dominant concern is not raw row count but:

```text
security
authentication lookup performance
redirect validation
secret lifecycle
tenant isolation
```

---

# 15. Query Patterns

The source explicitly defines the two core queries.

## Retrieve Active Tenant OAuth Clients

```sql
SELECT *
FROM tenant_oauth_clients
WHERE tenant_id = :tenant_id
AND status = 'active';
```

This supports:

- Tenant administration.
- Integration management.
- OAuth configuration displays.

---

## Retrieve Client by `client_id`

```sql
SELECT *
FROM tenant_oauth_clients
WHERE client_id = :client_id;
```

This is a critical runtime authentication/authorization lookup.

---

## Retrieve Expiring Client Secrets

```sql
SELECT *
FROM tenant_oauth_clients
WHERE tenant_id = :tenant_id
AND status = 'active'
AND secret_expires_at IS NOT NULL
AND secret_expires_at <= :expiration_threshold
ORDER BY secret_expires_at;
```

Supports secret-rotation operations.

---

## Retrieve Recently Used Clients

```sql
SELECT *
FROM tenant_oauth_clients
WHERE tenant_id = :tenant_id
ORDER BY last_used_at DESC NULLS LAST;
```

Supports operational/security review.

---

## Retrieve Revoked Clients

```sql
SELECT *
FROM tenant_oauth_clients
WHERE tenant_id = :tenant_id
AND status = 'revoked'
ORDER BY updated_at DESC;
```

Supports historical security investigation.

---

## Retrieve Client Configuration

```sql
SELECT
    client_id,
    client_name,
    grant_types,
    redirect_uris,
    scopes,
    authentication_method,
    status,
    secret_expires_at,
    last_used_at
FROM tenant_oauth_clients
WHERE tenant_id = :tenant_id
AND client_id = :client_id;
```

This provides the authorization layer with registration metadata without exposing the stored secret hash unnecessarily.

---

# 16. Index Strategy

The source specifies:

- `PK(id)`
- `UNIQUE(client_id)`
- `INDEX(tenant_id)`
- `INDEX(status)`
- `INDEX(secret_expires_at)`
- `INDEX(last_used_at)`
- `GIN(grant_types)`
- `GIN(redirect_uris)`
- `GIN(scopes)`

---

## Primary Key

```sql
PRIMARY KEY (id)
```

Provides direct database identity lookup.

---

## Unique Client ID

```sql
UNIQUE(client_id)
```

This is one of the most important runtime indexes because authorization requests commonly arrive with:

```text
client_id
```

---

## Tenant Index

```sql
INDEX(tenant_id)
```

Supports tenant-scoped administration.

---

## Status Index

```sql
INDEX(status)
```

Supports:

```text
active clients
inactive clients
suspended clients
revoked clients
```

---

## Secret Expiration Index

```sql
INDEX(secret_expires_at)
```

Supports:

```text
clients with secrets expiring soon
expired secrets
rotation jobs
```

---

## Last-Used Index

```sql
INDEX(last_used_at)
```

Supports:

```text
recently used clients
dormant clients
security investigation
```

---

## GIN — Grant Types

```sql
GIN(grant_types)
```

Supports queries against the JSONB grant-type configuration.

---

## GIN — Redirect URIs

```sql
GIN(redirect_uris)
```

Supports queries involving registered redirect URI data.

---

## GIN — Scopes

```sql
GIN(scopes)
```

Supports scope-oriented queries against the JSONB representation.

---

## Indexing Trade-Off

The source explicitly specifies these GIN indexes.

They improve JSONB querying but increase write/storage overhead.

Given that the source characterizes:

```text
Reads: Very High
Writes: Low
```

the trade-off is reasonable.

---

# 17. Read / Write Characteristics

The source classifies:

```text
Reads: Very High
Writes: Low
```

---

## Reads — Very High

OAuth clients may be consulted during authorization/authentication flows.

A common runtime path is:

```text
Authorization Request
        ↓
client_id
        ↓
tenant_oauth_clients
        ↓
Client Validation
```

Therefore read latency is important.

---

## Writes — Low

Client registrations are created comparatively infrequently.

Writes occur during:

- Application registration.
- Configuration changes.
- Secret rotation.
- Revocation.
- Suspension.
- Administrative updates.

---

## Updates

Updates are legitimate for configuration:

```text
redirect_uris
grant_types
scopes
status
secret_expires_at
```

However, secret rotation should follow the credential lifecycle rather than exposing or storing plaintext secrets.

---

## Deletes

The source lifecycle states:

```text
Disabled or Revoked
```

rather than describing physical deletion.

Therefore hard deletion should not be assumed as the normal operational lifecycle.

Retaining revoked registrations supports auditability and security investigation.

---

# 18. Caching Strategy

The source specifies:

```text
tenant-oauth-clients:{tenant_id}
```

in Redis.

It also explicitly states:

> Never cache plaintext client secrets.

---

## Appropriate Cache Contents

Safe registration metadata may include:

```text
client_id
client_name
grant_types
redirect_uris
scopes
authentication_method
status
secret_expires_at
last_used_at
```

subject to security policy.

---

## What Must Never Be Cached

Do not cache:

```text
plaintext client secret
raw secret
plaintext credential material
```

The source explicitly prohibits plaintext client-secret caching.

---

## Redis Key

```text
tenant-oauth-clients:{tenant_id}
```

This maintains tenant isolation in the distributed cache.

---

## Cache Invalidation

When a client is modified:

```text
Client Configuration Updated
        ↓
Database UPDATE
        ↓
Invalidate:
tenant-oauth-clients:{tenant_id}
```

When a client is revoked:

```text
Client Revoked
        ↓
Database UPDATE
        ↓
Immediate Cache Invalidation
        ↓
Authorization Requests Rejected
```

Revocation must not be delayed by a stale cache.

---

## Database Remains Authoritative

The architecture remains:

```text
PostgreSQL
     ↓
Source of Truth

Redis
     ↓
Performance Layer
```

A cache failure must not change the security meaning of the client registration.

---

# 19. Security Considerations

The source explicitly identifies:

- Client-secret hashing.
- Redirect URI validation.
- HTTPS enforcement.
- RBAC.
- Secret rotation.
- Tenant isolation.
- Audit logging.

These are the core security controls.

---

## 1. Hash Client Secrets

Client secrets must be represented cryptographically rather than stored in plaintext.

```text
Client Secret
     ↓
Hash
     ↓
client_secret_hash
```

---

## 2. Redirect URI Validation

Redirect URIs are a major OAuth security boundary.

Only registered redirect destinations should be accepted.

Conceptually:

```text
Authorization Request
        ↓
redirect_uri
        ↓
Compare against registered redirect_uris
        ↓
Allowed / Rejected
```

---

## 3. HTTPS

OAuth authorization flows must enforce secure transport according to deployment/security policy.

The source explicitly identifies HTTPS enforcement as a security requirement.

---

## 4. RBAC

Only authorized tenant administrators/security operators should be able to:

- Register OAuth clients.
- Modify redirect URIs.
- Modify scopes.
- Rotate secrets.
- Suspend clients.
- Revoke clients.

---

## 5. Secret Rotation

Client secrets should have a defined lifecycle:

```text
Active Secret
      ↓
Rotation
      ↓
New Secret
      ↓
Old Secret Invalidated
```

---

## 6. Tenant Isolation

An OAuth client must never cross tenant boundaries.

```text
Tenant A Client
      ↓
Tenant A authorization context
```

must never become:

```text
Tenant B authorization context
```

---

## 7. Audit Logging

Sensitive actions must be auditable:

```text
ClientCreated
ClientUpdated
SecretRotated
ClientRevoked
ClientAuthenticated
```

---

## 8. No Secret Logging

Application logs must never contain:

```text
client_secret
Authorization header
plaintext token
```

Use non-secret identifiers such as:

```text
client_id
tenant_id
request_id
timestamp
result
```

where operationally appropriate.

---

## 9. Cache Security

Never place plaintext client secrets in:

```text
Redis
Application memory snapshots
Logs
Metrics
Tracing payloads
```

The source explicitly prohibits plaintext client-secret caching.

---

# 20. Audit Requirements

The source explicitly defines these events:

| Event | Trigger | Purpose |
|---|---|---|
| `TenantOAuthClientCreated` | New OAuth client registered | Record application registration |
| `TenantOAuthClientUpdated` | Client configuration changed | Record configuration modification |
| `TenantOAuthClientSecretRotated` | Client secret rotated | Record secret lifecycle change |
| `TenantOAuthClientRevoked` | Client explicitly revoked | Record security/lifecycle revocation |
| `TenantOAuthClientAuthenticated` | OAuth client successfully authenticates | Record client authentication activity |

---

## `TenantOAuthClientCreated`

Triggered when a new client registration is created.

Useful payload metadata:

```text
tenant_id
client_id
client_name
authentication_method
created_by
created_at
```

Never include the plaintext client secret.

---

## `TenantOAuthClientUpdated`

Generated when registration configuration changes.

Examples:

```text
grant_types changed
redirect_uris changed
scopes changed
authentication_method changed
```

Because redirect URI and scope changes can alter security behavior, these should be explicitly visible in audit records.

---

## `TenantOAuthClientSecretRotated`

Generated when the client secret is replaced.

The event should identify:

```text
client_id
tenant_id
rotation timestamp
actor
```

but never the plaintext secret.

---

## `TenantOAuthClientRevoked`

Generated when the client is invalidated.

This is particularly important for security incident response.

---

## `TenantOAuthClientAuthenticated`

Generated when the OAuth client successfully authenticates.

The source explicitly includes this event.

Because authentication may occur at high frequency, production architecture should distinguish:

```text
business/security audit event
```

from:

```text
high-volume authentication telemetry
```

The source establishes the event but does not prescribe the final telemetry-storage architecture.

---

# 21. Event Producers / Event Consumers

The source defines the following producers and consumers.

## Producers

- `TenantOAuthClientCreated`
- `TenantOAuthClientSecretRotated`
- `TenantOAuthClientAuthenticated`

Additional lifecycle events from the source:

- `TenantOAuthClientUpdated`
- `TenantOAuthClientRevoked`

---

## Consumers

- Authorization Server
- Authentication Service
- API Gateway
- Security Monitoring
- Audit Service
- SIEM Platform

---

## Client Registration Workflow

```text
Tenant Administrator
        ↓
OAuth Client Registration Service
        ↓
Generate / Register Client
        ↓
Hash Secret if applicable
        ↓
tenant_oauth_clients
        ↓
TenantOAuthClientCreated
        ↓
Audit / Security Monitoring
```

---

## Authorization Workflow

```text
OAuth Client
      ↓
Authorization Request
      ↓
Authorization Server
      ↓
client_id
      ↓
tenant_oauth_clients
      ↓
Validate:
  status
  grant_types
  redirect_uris
  authentication_method
  secret state
      ↓
Authorization Flow
      ↓
Token Issuance
```

---

## Security Monitoring Workflow

```text
Client Authentication
        ↓
Authentication Service
        ↓
TenantOAuthClientAuthenticated
        ↓
Security Monitoring
        ↓
SIEM
        ↓
Anomaly Detection
```

---

# 22. Alternative Designs Considered

The source explicitly considers three alternatives.

| Option | Description | Verdict |
|---|---|---|
| A | Store OAuth clients together with API credentials | **Rejected** |
| B | JSON configuration | **Rejected** |
| **C** | Dedicated `tenant_oauth_clients` table | **Chosen** |

---

## Option A — Store With API Credentials

### Rejected

Although both are security credentials, they represent different protocol entities.

```text
API Credential
     ↓
API authentication
```

versus:

```text
OAuth Client
     ↓
OAuth/OIDC authorization
```

Combining them would make:

- Protocol semantics unclear.
- Lifecycle management harder.
- Indexing less focused.
- Security policies less explicit.
- OAuth-specific configuration more difficult to model.

---

## Option B — JSON Configuration

Example:

```json
{
  "oauth_clients": [
    {
      "client_id": "...",
      "redirect_uris": [],
      "scopes": []
    }
  ]
}
```

### Rejected

This weakens:

- Relational integrity.
- Client identity lookup.
- Uniqueness enforcement.
- Security administration.
- Lifecycle queries.
- Indexing.
- Auditability.

OAuth client registrations are sufficiently important and structured to justify first-class relational entities.

---

## Option C — Dedicated Table

### Chosen

A dedicated table provides:

- Strong tenant ownership.
- Globally unique OAuth client IDs.
- Explicit OAuth-specific configuration.
- Redirect URI storage.
- Grant-type storage.
- Scope storage.
- Secret lifecycle management.
- Security-specific indexing.
- Auditing.
- Efficient Authorization Server lookup.

This is the architecture established by the source.

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

`tenant_oauth_clients` is the **OAuth application-registration layer** of the Tenant Management domain.

Its architectural position is:

```text
                         TENANT
                            │
                            ▼
                  OAuth Client Registration
                            │
        ┌───────────────────┼──────────────────┐
        ▼                   ▼                  ▼
   Client Identity     OAuth Config       Lifecycle
        │                   │                  │
        ▼                   ▼                  ▼
   client_id          grant_types         active
                      redirect_uris        inactive
                      scopes              suspended
                      auth method          revoked
                            │
                            ▼
                  Authorization Server
                            │
                            ▼
                     Authorization
                            │
                            ▼
                       Token Flow
```

The fundamental distinction remains:

```text
tenant_api_credentials
        ↓
API authentication credentials
```

while:

```text
tenant_oauth_clients
        ↓
OAuth/OIDC application registrations
```

---

# Complete OAuth Client Lifecycle

```text
                Client Registered
                       │
                       ▼
                    ACTIVE
                  /    │    \
                 /     │     \
                ▼      ▼      ▼
           INACTIVE SUSPENDED REVOKED
                │
                │ re-enabled where permitted
                ▼
              ACTIVE
```

Secret lifecycle operates independently:

```text
Client Registration
        │
        ▼
    Secret Active
        │
        ▼
      Rotation
        │
        ▼
 New Secret Active
        │
        ▼
Old Secret Invalidated
```

This allows the **OAuth client identity** to remain stable while its authentication secret changes.

---

# Critical Production Invariants

1. **Every OAuth client belongs to exactly one tenant.**
2. **`tenant_id` is mandatory and references `tenants.id`.**
3. **An OAuth client is an application registration, not a human user.**
4. **An OAuth client is not an access token.**
5. **`client_id` is the stable OAuth protocol identifier.**
6. **`client_id` must be globally unique according to the source design.**
7. **`client_name` is human-readable metadata rather than the protocol identity.**
8. **`(tenant_id, client_name)` represents tenant-scoped business identity.**
9. **`grant_types` is required.**
10. **`redirect_uris` is required.**
11. **Redirect URIs must be explicitly validated.**
12. **OAuth clients must not accept arbitrary redirect destinations.**
13. **`client_secret_hash` must never contain plaintext secrets.**
14. **Client secrets must not be cached in plaintext.**
15. **Secret rotation must invalidate the previous secret according to policy.**
16. **`authentication_method` determines the applicable client-authentication mechanism.**
17. **Clients using `none` must not be treated as requiring a traditional client secret.**
18. **`status` must always represent the client registration lifecycle state.**
19. **Revoked clients must not participate in authorization.**
20. **Suspended clients must be blocked according to the authorization policy.**
21. **Tenant administrators require appropriate RBAC permissions for registration changes.**
22. **Client configuration changes must be auditable.**
23. **Secret rotation must be auditable.**
24. **Client revocation must be auditable.**
25. **Client authentication activity must be security-visible.**
26. **Client IDs, tenant IDs, and request IDs may be used for operational logging; plaintext secrets must never be logged.**
27. **The Redis cache must be tenant-keyed and must never contain plaintext client secrets.**
28. **The database remains the authoritative source of client registration state.**
29. **High-frequency authentication telemetry should be distinguished from durable business/security audit records.**
30. **OAuth client registrations should remain separate from `tenant_api_credentials`.**
31. **OAuth client registrations should remain separate from access-token storage.**
32. **OAuth-specific configuration should not be hidden inside general tenant settings.**
33. **The table should remain focused on the question: “Which OAuth/OIDC applications are registered for this tenant, and how are those applications configured and controlled?”**

---

# Final Conceptual Model

```text
┌───────────────────────────────────────────┐
│                  TENANT                   │
└──────────────────────┬────────────────────┘
                       │
                       │ owns
                       ▼
┌───────────────────────────────────────────┐
│          tenant_oauth_clients              │
│                                           │
│ id                                        │
│ tenant_id                                 │
│ client_id                                 │
│ client_secret_hash                        │
│ client_name                               │
│ grant_types                               │
│ redirect_uris                             │
│ scopes                                    │
│ authentication_method                     │
│ status                                    │
│ secret_expires_at                         │
│ last_used_at                              │
│ created_by                                │
│ created_at                                │
│ updated_at                                │
└──────────────────────┬────────────────────┘
                       │
                       ▼
              ┌──────────────────┐
              │ Authorization     │
              │ Server            │
              └────────┬─────────┘
                       │
             ┌─────────┼─────────┐
             ▼         ▼         ▼
          OAuth 2.0   OIDC   Delegated
          Flows              Authorization
             │         │         │
             └─────────┼─────────┘
                       ▼
                  Token Flow
                       │
                       ▼
                Protected APIs
```

The essential architectural principle is:

> **`tenant_oauth_clients` provides tenant-scoped OAuth 2.0/OpenID Connect application registrations, giving the Authorization Server a durable, auditable, and securely isolated representation of which applications are permitted to participate in delegated authorization flows.**

The source establishes this as a **Core Security Table** with **critical security importance**, **very high read volume**, **low write volume**, and **excellent scalability**.

**Step 3 — `tenant_oauth_clients` is complete.**

No file has been created in this response. The next step is **Step 4 — package this exact Step 3 content into the Table 18 `.md` file.**
