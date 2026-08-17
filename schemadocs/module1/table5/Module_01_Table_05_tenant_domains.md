# Step 3 — Table 5: `tenant_domains`

The `tenant_domains` table manages **custom internet domains associated with a tenant**, enabling tenant-specific routing, white-label portals, branded access points, API endpoints, and domain verification.

The existing InsureIQ inventory identifies `tenant_domains` as **Table 5** of the Tenant Management module, with the purpose **“Custom domains used by tenants.”**

The existing schema design defines a Tenant Domain as a verified internet domain or subdomain through which users access a tenant's services, with support for multiple domains, white-label portals, domain verification, SSL integration, and tenant routing.

For a production-grade SaaS implementation, this table needs to be treated as more than a simple list of domain names. It becomes part of the **tenant resolution, custom-domain onboarding, DNS verification, TLS/SSL lifecycle, routing, and potentially API ingress architecture**.

---

# 1. Why This Table Exists

A production SaaS platform cannot assume that every tenant will access InsureIQ through one shared platform URL.

A tenant may want:

```text
portal.insureiq.com
```

or its own branded domain:

```text
portal.abcinsurance.com
```

or multiple specialized domains:

```text
portal.abcinsurance.com
claims.abcinsurance.com
broker.abcinsurance.com
api.abcinsurance.com
support.abcinsurance.com
```

The source design explicitly identifies custom domains as a mechanism for:

- White-label portals.
- Tenant routing.
- Branding.
- SSL management.
- Multiple tenant domains.

Without `tenant_domains`, domain information would have to be embedded in `tenants`, which would create several problems:

- A tenant could not have multiple domains cleanly.
- Domain verification would have nowhere to live.
- Primary-domain selection would be difficult.
- SSL state would become mixed into tenant identity.
- Domain-specific routing would be difficult.
- DNS onboarding would become difficult to track.
- Domain lifecycle history would be difficult to preserve.
- Domain uniqueness could not be enforced globally.

The domain therefore deserves its own entity.

---

# 2. Business Definition

A **Tenant Domain** represents an internet domain or subdomain through which a tenant's InsureIQ services can be accessed.

Examples:

```text
portal.company.com
claims.company.com
broker.company.com
api.company.com
support.company.com
```

A domain can serve different purposes:

```text
abcinsurance.com
        │
        ├── portal
        ├── claims
        ├── broker
        ├── api
        └── support
```

Each of these can potentially be represented as a separate `tenant_domains` record.

---

# 3. Critical Design Principle — What the Entity IS and IS NOT

## The Tenant Domain IS

- A tenant-owned routing identifier.
- A custom access point.
- A domain/subdomain registered for tenant use.
- A white-label SaaS configuration.
- A domain verification target.
- A potential SSL/TLS configuration target.
- A child entity of the Tenant aggregate.

## The Tenant Domain IS NOT

- The tenant itself.
- A DNS server.
- A DNS zone management system.
- An SSL certificate.
- A certificate authority.
- A hosting server.
- A CDN configuration.
- A reverse proxy.
- A user account.
- An API credential.

This distinction is critical.

For example:

```text
tenant_domains
      ↓
portal.abcinsurance.com
```

does **not** mean the database itself manages DNS.

Rather:

```text
InsureIQ
   ↓
records desired domain configuration
   ↓
DNS / cloud infrastructure
   ↓
domain resolves to InsureIQ
```

The database stores the **business state and ownership relationship**; infrastructure systems perform the actual DNS/TLS operations.

---

# 4. Aggregate Root Analysis — DDD Structure

```text
Tenant
│
├── Tenant Domains
│      │
│      ├── portal.company.com
│      ├── claims.company.com
│      ├── broker.company.com
│      ├── api.company.com
│      └── support.company.com
│
├── Tenant Profile
├── Tenant Addresses
├── Tenant Contacts
├── Tenant Branding
├── Tenant Settings
├── Tenant Locales
├── Tenant Features
├── Tenant Modules
└── ...
```

The `Tenant` remains the **Aggregate Root**.

`tenant_domains` contains child domain entities owned by the tenant.

### Aggregate invariant

Every tenant domain must belong to exactly one tenant:

```text
tenant_domains.tenant_id
        ↓
tenants.id
```

Therefore:

```text
tenant_id NOT NULL
```

is mandatory.

---

## Important global invariant

Unlike many tenant-owned tables, a domain has a **platform-wide uniqueness requirement**.

A domain such as:

```text
portal.abcinsurance.com
```

must not simultaneously belong to:

```text
Tenant A
```

and:

```text
Tenant B
```

Therefore `domain_name` requires a global uniqueness constraint.

This is one of the most important architectural differences between `tenant_domains` and ordinary tenant-child tables.

---

# 5. Business Capabilities Supported

| Capability | Supported |
|---|---|
| Custom domains | Yes |
| Multiple domains per tenant | Yes |
| White-label portals | Yes |
| Tenant routing | Yes |
| Domain verification | Yes |
| DNS verification workflow | Yes |
| SSL/TLS integration | Yes |
| Primary domain designation | Yes |
| Portal-specific domains | Yes |
| Claims-specific domains | Yes |
| Broker-specific domains | Yes |
| API domains | Yes |
| Support domains | Yes |
| Domain activation/deactivation | Yes |
| Domain lifecycle tracking | Yes |
| Domain ownership validation | Yes |
| DNS provider management | Possible extension |
| Certificate storage | No — certificate/secrets infrastructure |
| DNS zone management | No — infrastructure provider |
| CDN configuration | No — infrastructure layer |

---

# 6. Multi-Tenant / Ownership / Isolation Notes

Each domain belongs to exactly one tenant.

Example:

```text
Tenant A
│
├── portal.a.com
├── claims.a.com
└── api.a.com

Tenant B
│
├── portal.b.com
└── api.b.com
```

The platform must never allow:

```text
portal.a.com
      ↓
Tenant B
```

after that domain has been successfully registered to Tenant A.

---

## Domain uniqueness is global

Unlike most tenant-owned entities:

```text
tenant_id + domain_name
```

is **not sufficient** to guarantee correctness.

This would incorrectly allow:

```text
Tenant A → abc.com
Tenant B → abc.com
```

Therefore:

```sql
UNIQUE(domain_name)
```

is required.

---

## Tenant resolution

One of the most important runtime operations will be:

```text
Incoming HTTP request
        ↓
Host header
        ↓
portal.abcinsurance.com
        ↓
tenant_domains
        ↓
tenant_id
        ↓
Tenant Context
        ↓
Application
```

For example:

```sql
SELECT tenant_id
FROM tenant_domains
WHERE domain_name = :normalized_host
  AND verification_status = 'verified'
  AND is_active = TRUE;
```

This lookup is security-critical.

The application should never assume a tenant solely because a client supplies an arbitrary tenant identifier.

---

# 7. Lifecycle

## Creation

The domain lifecycle begins when a tenant requests a custom domain.

```text
Tenant Created
      ↓
Domain Requested
      ↓
Domain Record Created
      ↓
Verification Pending
```

A production implementation should distinguish between:

```text
requested
```

and:

```text
verified
```

because merely entering a domain name does not prove ownership.

---

## Domain Verification

Typical flow:

```text
Domain Added
      ↓
Verification Token Generated
      ↓
Tenant Configures DNS
      ↓
InsureIQ Checks DNS
      ↓
Verification Successful
      ↓
Domain Activated
```

Possible verification mechanisms include:

```text
TXT record
CNAME record
HTTP challenge
```

The exact verification mechanism is infrastructure-dependent.

---

## Growth

A tenant can add multiple domains:

```text
Tenant
│
├── portal.company.com
├── claims.company.com
├── broker.company.com
├── api.company.com
└── support.company.com
```

The source estimates approximately **1–20 domains per tenant**.

---

## Modification

A domain may undergo:

- SSL renewal.
- Verification refresh.
- Activation/deactivation.
- Routing changes.
- Domain-purpose changes.
- Certificate changes.

However, `domain_name` itself should generally be treated as an immutable identity once verified.

If the tenant wants:

```text
portal.oldcompany.com
```

changed to:

```text
portal.newcompany.com
```

the safer lifecycle is:

```text
Old Domain
    ↓
Deactivate / Archive

New Domain
    ↓
Create
    ↓
Verify
    ↓
Activate
```

rather than mutating the identity of an already-established domain.

---

## Archival

When a domain is no longer used:

```text
Verified
   ↓
Deactivated
   ↓
Archived
```

The record should normally remain for historical and audit purposes.

---

## Tenant Archival

When the tenant is archived:

```text
Tenant Archived
      ↓
Tenant Domains Disabled
      ↓
Routing Disabled
```

The domain records themselves should generally remain available for historical reference.

---

# 8. Proposed Schema

## Table Name

`tenant_domains`

## Primary Key Strategy

**UUID**

Every domain record needs its own identity because:

- One tenant can have multiple domains.
- Domain lifecycle needs independent tracking.
- Verification state belongs to the domain.
- SSL state belongs to the domain.
- Audit events need a stable domain identifier.

Therefore:

```text
id UUID PRIMARY KEY
```

---

## Schema Definition

| Field Name | Data Type | Key | Specification | Reason Field Exists |
|---|---|---|---|---|
| `id` | UUID | PK | `NOT NULL` | Stable unique identity for the domain record |
| `tenant_id` | UUID | FK → `tenants.id` | `NOT NULL` | Identifies the owning tenant |
| `domain_name` | VARCHAR(255) | UK | `NOT NULL UNIQUE` | Canonical domain used for tenant routing |
| `domain_type` | ENUM | — | `NOT NULL` | Defines the business purpose of the domain |
| `is_primary` | BOOLEAN | — | `NOT NULL DEFAULT FALSE` | Identifies the primary tenant access domain |
| `verification_status` | ENUM | — | `NOT NULL DEFAULT 'pending'` | Tracks domain ownership verification |
| `verification_method` | ENUM | — | `NULL` | Records the verification mechanism used |
| `verification_token_hash` | VARCHAR(255) | — | `NULL` | Stores a protected representation of a verification token |
| `verified_at` | TIMESTAMPTZ | — | `NULL` | Records successful verification time |
| `ssl_enabled` | BOOLEAN | — | `NOT NULL DEFAULT TRUE` | Indicates whether TLS is expected for the domain |
| `ssl_expiry_date` | DATE | — | `NULL` | Tracks certificate expiration |
| `is_active` | BOOLEAN | — | `NOT NULL DEFAULT FALSE` | Prevents unverified domains from becoming active |
| `valid_from` | TIMESTAMPTZ | — | `NULL` | Effective activation time |
| `valid_to` | TIMESTAMPTZ | — | `NULL` | Optional deactivation time |
| `created_at` | TIMESTAMPTZ | — | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Records creation |
| `updated_at` | TIMESTAMPTZ | — | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Records modification |
| `archived_at` | TIMESTAMPTZ | — | `NULL` | Records archival |

### Important design refinement

The following are **production-design extensions**:

```text
verification_method
verification_token_hash
is_active
valid_from
valid_to
archived_at
```

They are useful because domain onboarding is an asynchronous infrastructure workflow rather than a simple CRUD operation.

---

## Domain Normalization

`domain_name` should be stored in a canonical normalized form.

For example:

```text
Portal.ABCInsurance.COM
```

should normalize to:

```text
portal.abcinsurance.com
```

Trailing dots should normally be normalized:

```text
portal.abcinsurance.com.
```

→

```text
portal.abcinsurance.com
```

The application should also normalize internationalized domain names appropriately using IDNA/Punycode rules.

---

# 9. Enum Definitions

## `domain_type`

| Value | Description |
|---|---|
| `primary` | Main tenant-facing domain |
| `customer` | Customer-facing portal domain |
| `broker` | Broker/agent-facing portal domain |
| `claims` | Claims-specific domain |
| `api` | API endpoint domain |
| `support` | Support/service domain |
| `other` | Other tenant-specific domain |

---

## `verification_status`

| Value | Description |
|---|---|
| `pending` | Domain has been requested but ownership has not been verified |
| `verified` | Domain ownership has been successfully verified |
| `failed` | Verification attempt failed |
| `expired` | Previously valid verification is no longer considered valid |

---

## `verification_method`

**Production refinement.**

Recommended values:

| Value | Description |
|---|---|
| `dns_txt` | Verification through DNS TXT record |
| `dns_cname` | Verification through DNS CNAME record |
| `http` | Verification through HTTP challenge |
| `https` | Verification through HTTPS challenge |
| `provider` | Verification through an integrated domain provider |
| `manual` | Controlled manual verification |

The actual supported values should be determined by the infrastructure architecture.

---

# 10. Why `domain_name` Exists

`domain_name` is the most important business field in the table.

It provides the mapping:

```text
Incoming Host
      ↓
domain_name
      ↓
tenant_id
      ↓
Tenant Context
```

For example:

```text
claims.abcinsurance.com
             ↓
tenant_domains
             ↓
Tenant ABC
```

Without this relationship, the application cannot reliably determine which tenant should handle a custom-domain request.

---

## Why it must be globally unique

Suppose:

```text
Tenant A → portal.insure.com
Tenant B → portal.insure.com
```

An incoming request would be ambiguous.

Therefore:

```sql
UNIQUE(domain_name)
```

is mandatory.

---

## Why it should not be part of `tenants`

A tenant can have:

```text
1
2
5
20
```

domains.

Therefore:

```text
tenants.domain_name
```

would impose an artificial one-domain limitation.

The normalized model is:

```text
Tenant
   │
   ├── Domain
   ├── Domain
   ├── Domain
   └── Domain
```

---

# 11. Candidate Keys

| Key Type | Field(s) | Rationale |
|---|---|---|
| Primary Key | `id` | Stable internal identity |
| Alternate / Candidate Key | `domain_name` | Globally unique routing identity |
| Operational Lookup Key | `domain_name` | Direct host-to-tenant resolution |
| Composite Operational Key | `(tenant_id, domain_type)` | Useful for tenant-specific domain administration |

`domain_name` is a stronger business identifier than most fields in this table because it participates directly in runtime routing.

Therefore changing it after verification should be treated as a lifecycle operation rather than a normal update.

---

# 12. Constraints

| Constraint | Definition | Reason |
|---|---|---|
| Primary Key | `PK(id)` | Stable domain identity |
| Tenant FK | `tenant_id → tenants.id` | Every domain belongs to a tenant |
| Global Unique Domain | `UNIQUE(domain_name)` | Prevents routing collisions |
| Domain Required | `domain_name NOT NULL` | Domain is the entity's business identity |
| Type Required | `domain_type NOT NULL` | Every domain has a purpose |
| Verification Required | `verification_status NOT NULL` | Domain state must be explicit |
| Primary Default | `is_primary DEFAULT FALSE` | Prevent accidental primary assignment |
| SSL Default | `ssl_enabled DEFAULT TRUE` | Secure access is expected |
| Active Default | `is_active DEFAULT FALSE` | Unverified domains must not become active automatically |
| Validity | `valid_to >= valid_from` | Prevent invalid lifecycle periods |
| Tenant Isolation | Tenant-scoped administration | Prevent cross-tenant manipulation |

---

## One Primary Domain Per Tenant

Recommended PostgreSQL enforcement:

```sql
CREATE UNIQUE INDEX uq_tenant_primary_domain
ON tenant_domains (tenant_id)
WHERE is_primary = TRUE
  AND is_active = TRUE;
```

This allows:

```text
Tenant A
├── portal.a.com       primary
├── claims.a.com       non-primary
└── api.a.com          non-primary
```

but prevents:

```text
Tenant A
├── portal.a.com       primary
└── app.a.com          primary
```

at the same time.

---

## Verified Domain Activation

A critical business invariant should be:

```text
is_active = TRUE
```

only when:

```text
verification_status = verified
```

and the tenant/domain is otherwise permitted to operate.

This can be enforced at the application/service layer and, where practical, through database constraints.

---

# 13. Relationships

## Incoming References

Potential consumers include:

- Authentication Service
- API Gateway
- Tenant Router
- Branding Service
- SSL/TLS Manager
- CDN/Edge infrastructure
- White-label portal
- Domain Verification Service
- Monitoring/Observability

---

## Outgoing References

### `tenant_id`

```text
tenant_domains.tenant_id
        ↓
tenants.id
```

Every domain is owned by exactly one tenant.

---

## Runtime Dependency

Although not necessarily a relational foreign key, the domain also participates in:

```text
DNS
 ↓
Load Balancer / CDN
 ↓
Ingress
 ↓
Tenant Router
 ↓
tenant_domains
 ↓
tenant_id
```

This means the table is closely coupled to infrastructure behavior even though the database does not directly control the infrastructure.

---

# 14. Cardinality Analysis

| Relationship | Expected Cardinality |
|---|---:|
| Tenant → Domains | 1..20 |
| Domain → Tenant | Exactly 1 |
| Primary Domains per Tenant | 0..1 active |
| Customer Domains | 0..N |
| Broker Domains | 0..N |
| Claims Domains | 0..N |
| API Domains | 0..N |
| Support Domains | 0..N |

The existing source estimates **1–20 domains per tenant** and identifies one primary domain as the normal rule.

---

## Platform scale

If the platform reaches:

```text
100,000 tenants
```

and the average tenant has:

```text
3 domains
```

then:

```text
≈ 300,000 domain records
```

At:

```text
20 domains / tenant
```

the theoretical upper range becomes:

```text
2,000,000 domain records
```

This is still a relatively small table.

The important scalability issue is not row count.

It is **lookup latency**.

A custom domain may be involved in almost every incoming HTTP request.

Therefore the domain lookup path needs extremely efficient indexing and caching.

---

# 15. Query Patterns

## Resolve Tenant from Domain

This is the most important query.

```sql
SELECT tenant_id
FROM tenant_domains
WHERE domain_name = :domain_name
  AND verification_status = 'verified'
  AND is_active = TRUE;
```

This should normally return:

```text
0 or 1 row
```

because `domain_name` is globally unique.

---

## Retrieve All Tenant Domains

```sql
SELECT *
FROM tenant_domains
WHERE tenant_id = :tenant_id
  AND is_active = TRUE
ORDER BY is_primary DESC, domain_name;
```

---

## Retrieve Primary Domain

```sql
SELECT *
FROM tenant_domains
WHERE tenant_id = :tenant_id
  AND is_primary = TRUE
  AND is_active = TRUE;
```

---

## Retrieve Claims Domain

```sql
SELECT *
FROM tenant_domains
WHERE tenant_id = :tenant_id
  AND domain_type = 'claims'
  AND is_active = TRUE;
```

---

## Retrieve Unverified Domains

```sql
SELECT *
FROM tenant_domains
WHERE verification_status IN ('pending', 'failed')
ORDER BY created_at ASC;
```

This is useful for domain-provisioning operations.

---

## Find Domains Expiring Soon

```sql
SELECT *
FROM tenant_domains
WHERE ssl_enabled = TRUE
  AND ssl_expiry_date IS NOT NULL
  AND ssl_expiry_date <= CURRENT_DATE + INTERVAL '30 days'
  AND is_active = TRUE;
```

Useful for certificate monitoring.

---

## Find All Domains for a Tenant

```sql
SELECT
    id,
    domain_name,
    domain_type,
    is_primary,
    verification_status,
    ssl_enabled,
    ssl_expiry_date
FROM tenant_domains
WHERE tenant_id = :tenant_id
ORDER BY domain_type, domain_name;
```

---

# 16. Index Strategy

This table has one particularly important index requirement.

## Primary Key

```sql
PRIMARY KEY (id)
```

Provides direct domain-record lookup.

---

## Global Domain Lookup

```sql
CREATE UNIQUE INDEX uq_tenant_domains_domain_name
ON tenant_domains(domain_name);
```

This is the most important runtime index.

It supports:

```sql
WHERE domain_name = ?
```

with effectively constant-time indexed lookup.

---

## Tenant Administration

```sql
CREATE INDEX idx_tenant_domains_tenant
ON tenant_domains(tenant_id);
```

Supports:

```sql
WHERE tenant_id = ?
```

---

## Tenant + Domain Type

```sql
CREATE INDEX idx_tenant_domains_tenant_type
ON tenant_domains(tenant_id, domain_type);
```

Supports tenant-specific domain management.

---

## Verification Status

```sql
CREATE INDEX idx_tenant_domains_verification
ON tenant_domains(verification_status);
```

Useful for asynchronous domain-verification workers.

---

## SSL Expiry

If certificate expiry is stored locally:

```sql
CREATE INDEX idx_tenant_domains_ssl_expiry
ON tenant_domains(ssl_expiry_date)
WHERE ssl_enabled = TRUE
  AND is_active = TRUE;
```

Useful for certificate monitoring.

---

## Primary Domain

The partial unique index:

```sql
CREATE UNIQUE INDEX uq_tenant_primary_domain
ON tenant_domains(tenant_id)
WHERE is_primary = TRUE
  AND is_active = TRUE;
```

provides both:

- Business-rule enforcement.
- Fast lookup.

---

# 17. Read / Write Characteristics

| Operation | Volume | Notes |
|---|---|---|
| Reads | **Very High** | Domain resolution can occur on incoming requests |
| Inserts | Very Low | Domains are added infrequently |
| Updates | Low | Verification and SSL state change occasionally |
| Deletes | Extremely Rare | Prefer deactivation/archival |
| Verification Reads | Moderate | Background verification workers |
| SSL Monitoring Reads | Low–Moderate | Certificate lifecycle monitoring |
| Tenant Administration Reads | Low | Admin UI |
| Routing Reads | Very High | Potentially every request |

For production architecture, the runtime routing path can make the effective read frequency much higher than ordinary tenant configuration tables.

This is why caching is especially important.

---

# 18. Caching Strategy

Recommended Redis key:

```text
tenant-domain:{normalized_domain}
```

Example:

```text
tenant-domain:portal.abcinsurance.com
```

Value:

```json
{
  "tenant_id": "tenant-uuid",
  "domain_id": "domain-uuid",
  "domain_type": "primary",
  "verified": true,
  "active": true
}
```

---

## Why domain-based caching is better than tenant-based caching

The incoming request begins with:

```text
Host:
portal.abcinsurance.com
```

not:

```text
tenant_id:
abc123
```

Therefore the natural cache lookup is:

```text
Host
 ↓
Redis
 ↓
tenant_id
```

rather than:

```text
tenant_id
 ↓
Redis
 ↓
domains
```

---

## Cache invalidation

Invalidate when:

- Domain created.
- Domain verification status changes.
- Domain becomes active.
- Domain becomes inactive.
- Domain is archived.
- Domain ownership changes.
- Tenant is suspended.
- Tenant is archived.
- Primary domain changes.

---

## Negative caching

Negative caching can be useful:

```text
tenant-domain:unknown.example.com
      ↓
NOT_FOUND
```

with a short TTL.

This prevents repeated database lookups for obviously invalid domains.

The TTL should be short because a legitimate domain can be added later.

---

## Edge caching

For very large scale, domain resolution may eventually move toward:

```text
CDN / Edge
      ↓
Tenant routing cache
      ↓
Application
```

rather than querying PostgreSQL on every request.

The database remains the authoritative source.

---

# 19. Security Considerations

This table is **security-critical** because domain ownership determines where users are routed.

A compromised domain association could result in:

```text
Tenant A domain
      ↓
Tenant B application
```

which could become a severe tenant-isolation vulnerability.

---

## Domain Ownership Verification

A tenant must prove control over the domain before activation.

For example:

```text
Tenant enters:
portal.abcinsurance.com
        ↓
InsureIQ generates token
        ↓
Tenant adds DNS TXT record
        ↓
InsureIQ verifies DNS
        ↓
Domain becomes verified
```

Never activate a custom domain merely because a tenant typed it into a form.

---

## Tenant Isolation

Every administrative mutation must verify:

```text
authenticated_tenant_id
        ==
domain.tenant_id
```

before allowing modification.

---

## Host Header Security

The platform must not blindly trust arbitrary host headers.

The request flow should be:

```text
Incoming Host
     ↓
Normalize
     ↓
Lookup registered domain
     ↓
Verify active + verified
     ↓
Resolve tenant
     ↓
Create tenant context
```

Unknown hosts should not automatically map to a tenant.

---

## SSL/TLS

`ssl_enabled` indicates expected TLS behavior but does not mean certificates themselves should be stored in this table.

Private keys must never be stored in plaintext here.

Certificate/private-key management should use:

- cloud certificate managers,
- secret managers,
- dedicated TLS infrastructure.

---

## Domain Takeover Protection

A domain that becomes unavailable or changes DNS configuration should be handled carefully.

A stale verified record could potentially allow an unintended party to point the domain toward infrastructure.

Therefore production systems should periodically revalidate ownership where appropriate.

---

## Reserved Domains

The platform should maintain a separate reserved-domain policy for domains such as:

```text
insureiq.com
api.insureiq.com
admin.insureiq.com
support.insureiq.com
```

and other infrastructure-controlled names.

A tenant must not be allowed to register platform-owned domains.

This logic may belong partly outside this table, but the domain-registration service must enforce it.

---

# 20. Audit Requirements

Domain operations are security-sensitive and therefore require strong auditing.

## Audit Events

| Event | Trigger | Payload | Purpose |
|---|---|---|---|
| `TenantDomainCreated` | Domain requested | tenant ID, domain ID, domain name, actor | Establish creation history |
| `TenantDomainVerificationStarted` | Verification initiated | domain ID, method, timestamp | Track verification workflow |
| `TenantDomainVerified` | Ownership confirmed | domain ID, verification method, timestamp | Establish ownership |
| `TenantDomainVerificationFailed` | Verification fails | domain ID, reason, timestamp | Diagnose onboarding |
| `TenantDomainActivated` | Domain enabled | domain ID, actor, timestamp | Record production activation |
| `TenantDomainDeactivated` | Domain disabled | domain ID, reason, actor | Track routing changes |
| `TenantPrimaryDomainChanged` | Primary domain changes | old/new domain IDs | Track tenant routing changes |
| `TenantDomainArchived` | Domain archived | domain ID, reason | Preserve history |
| `TenantDomainSSLUpdated` | SSL state changes | domain ID, expiry/status | Track certificate lifecycle |

Audit records should avoid storing verification secrets or private certificate material.

---

# 21. Event Producers / Event Consumers

## Event Producers

Typical producers include:

```text
Tenant Administration
        ↓
Domain Management API
        ↓
Domain Verification Worker
        ↓
SSL/TLS Manager
        ↓
Infrastructure Provisioning
```

Possible events:

- `TenantDomainCreated`
- `TenantDomainVerificationStarted`
- `TenantDomainVerified`
- `TenantDomainVerificationFailed`
- `TenantDomainActivated`
- `TenantDomainDeactivated`
- `TenantPrimaryDomainChanged`
- `TenantDomainSSLUpdated`
- `TenantDomainArchived`

---

## Event Consumers

| Consumer | Purpose |
|---|---|
| Tenant Router | Updates domain-to-tenant resolution |
| API Gateway | Updates accepted hostnames |
| CDN/Edge | Configures edge routing |
| SSL Manager | Provisions/renews certificates |
| Branding Service | Associates branded access points |
| Authentication Service | Determines tenant from host |
| Monitoring Service | Monitors domain availability |
| Notification Service | Alerts about verification/SSL failures |
| Audit Service | Records domain lifecycle |
| Compliance Service | Tracks relevant tenant configuration |

---

## Example Workflow

```text
Tenant Domain Created
        ↓
Domain Verification Service
        ↓
DNS Verification
        ↓
TenantDomainVerified
        ↓
SSL Manager
        ↓
Certificate Provisioned
        ↓
TenantDomainActivated
        ↓
Tenant Router
        ↓
Domain Available
```

This is preferable to making the HTTP request wait synchronously for every infrastructure operation.

---

# 22. Alternative Designs Considered

| Option | Description | Verdict |
|---|---|---|
| A | Store one domain in `tenants` | **Rejected** |
| B | Store domains as JSON in `tenants` | **Rejected as primary design** |
| C | Global domain table without tenant relationship | **Rejected** |
| D | Store DNS configuration directly in database as infrastructure state | **Rejected** |
| **E** | Dedicated `tenant_domains` table | **Chosen** |

## Option A — Domain Inside `tenants`

Rejected because it supports only one domain and mixes routing configuration into the root tenant identity.

---

## Option B — JSON Domain Array

Rejected as the primary design because it weakens:

- Global uniqueness.
- Domain lookup.
- Indexing.
- Verification lifecycle.
- Primary-domain constraints.
- Auditability.
- Operational querying.

---

## Option C — Global Domain Table Without Tenant Relationship

Rejected because the central business relationship is:

```text
Domain
   ↓
Tenant
```

Without `tenant_id`, domain ownership cannot be directly represented.

---

## Option D — Store Complete DNS Infrastructure State

Rejected because this would turn the business database into an infrastructure-control database.

The better architecture is:

```text
tenant_domains
      ↓
desired business state
      ↓
Infrastructure Service
      ↓
DNS / CDN / TLS Provider
```

---

## Option E — Dedicated `tenant_domains`

**Chosen.**

It provides:

- Multiple domains.
- Global domain uniqueness.
- Tenant ownership.
- Domain verification.
- Primary-domain management.
- SSL lifecycle metadata.
- Efficient host-based lookup.
- Clear DDD boundaries.
- Integration with infrastructure automation.

---

# 23. Final Design Assessment

| Attribute | Rating |
|---|---|
| Complexity | Medium |
| Read Volume | **Very High** |
| Write Volume | Very Low |
| Security Importance | **Critical** |
| Business Criticality | **Critical** |
| Regulatory Importance | Medium–High |
| Routing Importance | **Critical** |
| Scalability | Excellent |
| Data Volatility | Low–Moderate |
| Infrastructure Coupling | High |
| Recommended Status | **Core Infrastructure-Supporting Table — Mandatory** |

## Overall Assessment

`tenant_domains` looks simple at the relational level, but it is considerably more important than its row count suggests.

The fundamental architecture is:

```text
                    Incoming Request
                          │
                          │ Host
                          ▼
              portal.abcinsurance.com
                          │
                          ▼
                  tenant_domains
                          │
                    domain_name
                          │
                          ▼
                      tenant_id
                          │
                          ▼
                    Tenant Context
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
       Billing          Claims         Customer
```

The most important production decisions are:

1. **`domain_name` must be globally unique.**
2. **Every domain belongs to exactly one tenant.**
3. **A domain must be verified before activation.**
4. **Only one active primary domain should exist per tenant.**
5. **Domain resolution must be extremely fast because it can occur on virtually every request.**
6. **Domain-to-tenant resolution is a security boundary.**
7. **Unknown or unverified domains must never automatically resolve to a tenant.**
8. **SSL private keys and certificate secrets must not be stored in this table.**
9. **Domains should normally be deactivated/archived rather than deleted.**
10. **Changing a verified domain should generally be modeled as replacing one domain with another, not mutating the established identity.**
11. **Redis/edge caching is strongly recommended for high-scale host-to-tenant resolution.**
12. **Domain lifecycle events must be audited because domain ownership and routing changes can have security consequences.**

The resulting model is:

```text
┌───────────────────────────────┐
│            Tenant             │
│        Aggregate Root         │
└───────────────┬───────────────┘
                │
             1  │  N
                ▼
┌────────────────────────────────┐
│        tenant_domains          │
├────────────────────────────────┤
│ id                             │
│ tenant_id  ────────────────┐   │
│ domain_name  [GLOBAL UK]   │   │
│ domain_type                │   │
│ is_primary                 │   │
│ verification_status        │   │
│ verification_method        │   │
│ verified_at                │   │
│ ssl_enabled                │   │
│ ssl_expiry_date            │   │
│ is_active                  │   │
│ lifecycle fields           │   │
└────────────────────────────┘   │
                                 │
                                 ▼
                           tenants.id
```

And the runtime resolution path becomes:

```text
HTTP Host
    ↓
Normalize Domain
    ↓
Redis
    ↓
Cache Miss?
    ↓
tenant_domains.domain_name
    ↓
Verified + Active?
    ↓
tenant_id
    ↓
Tenant Context
    ↓
Application Request
```

**Step 3 — `tenant_domains` is complete.**

The next step is **Step 4 — package this exact documentation into `Module_01_Table_05_tenant_domains.md`**.
