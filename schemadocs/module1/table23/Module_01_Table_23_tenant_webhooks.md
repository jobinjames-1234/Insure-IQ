# Table 23 — `tenant_webhooks`

The Module 1 inventory establishes **Table 23** as `tenant_webhooks`, with the purpose **“Tenant webhook registrations.”**

The source defines the Tenant Management architecture around tenant-owned integrations, credentials, OAuth clients, and webhooks. The surviving detailed schema material for Table 23 does not contain a complete original field-by-field definition, so this document preserves that source boundary rather than presenting inferred fields as recovered requirements.

The schema below therefore distinguishes the established architectural role from proposed implementation details where the original source is unavailable.

---

# 1. Why This Table Exists

The `tenant_webhooks` table represents **webhook registrations belonging to a tenant**.

The table exists because InsureIQ needs a controlled mechanism for communicating events from the platform to external systems.

The conceptual relationship is:

```text
InsureIQ
   │
   │ Event
   ▼
Webhook Dispatcher
   │
   ▼
tenant_webhooks
   │
   │ Registered endpoint
   ▼
External System
```

A tenant may integrate with external applications that need to receive events such as:

```text
Policy Created
Policy Updated
Claim Created
Claim Updated
Payment Completed
Customer Updated
```

The webhook registration provides the platform with the information required to determine:

- Where an event should be delivered.
- Which tenant owns the registration.
- Which events the endpoint subscribes to.
- Whether the registration is active.
- How the endpoint should be authenticated or signed.
- When the endpoint was registered.
- Its current operational state.

---

## The Problem It Solves

Without a dedicated webhook registration table, outbound event destinations would have to be stored in:

```text
tenant_settings
tenant_integrations
```

or embedded into arbitrary JSON configuration.

That would make it difficult to support:

- Multiple webhook endpoints per tenant.
- Different event subscriptions.
- Independent activation/deactivation.
- Endpoint-level security.
- Delivery monitoring.
- Retry handling.
- Webhook-specific audit history.

The table therefore provides a **tenant-scoped registry of outbound webhook destinations**.

---

# 2. Business Definition

A **Tenant Webhook** represents a registered endpoint that receives selected InsureIQ events on behalf of a tenant.

Conceptually:

```text
Tenant
   │
   ├── Webhook A → CRM
   ├── Webhook B → Analytics
   ├── Webhook C → Internal ERP
   └── Webhook D → Partner System
```

A webhook is therefore an **outbound event subscription**.

It is different from a general integration.

### Integration

```text
tenant_integrations
        ↓
Connection to an external/internal system
```

### Webhook

```text
tenant_webhooks
        ↓
Specific endpoint to which InsureIQ pushes events
```

One integration may potentially have one or more webhook endpoints.

---

## Business Meaning

The table answers:

> **Which outbound webhook endpoints has this tenant registered, which events are they interested in, and what is the current state of each registration?**

It does not represent:

- An incoming webhook request.
- A webhook delivery attempt.
- A retry job.
- An event itself.
- An API credential.
- An OAuth client.
- A general external integration.

Those are separate concerns.

---

# 3. Critical Design Principle — What the Entity IS and IS NOT

## The Tenant Webhook IS

- A tenant-owned outbound event subscription.
- A registered callback endpoint.
- An event-delivery configuration.
- A child resource of the Tenant aggregate.
- A security-sensitive integration boundary.
- A lifecycle-managed configuration record.

## The Tenant Webhook IS NOT

- An API key.
- An OAuth token.
- An external integration itself.
- A webhook delivery attempt.
- A queue message.
- An event log.
- A retry record.
- A general tenant setting.

The architectural separation is:

```text
tenant_integrations
        │
        │ External connectivity
        ▼
External System

tenant_webhooks
        │
        │ Event delivery
        ▼
Webhook Endpoint
```

---

# 4. Aggregate Root Analysis — DDD Structure

The Tenant Management aggregate establishes:

```text
Tenant
├── Integrations
├── API Credentials
├── OAuth Clients
└── Webhooks
```

Therefore:

```text
Tenant Aggregate Root
        │
        └── TenantWebhook
```

Ownership:

```text
tenant_webhooks.tenant_id
            ↓
         tenants.id
```

---

## Why Webhooks Are Tenant-Owned

Webhook destinations belong to the organization whose data/events they receive.

For example:

```text
Tenant A
   ↓
Webhook → Tenant A's CRM
```

must remain isolated from:

```text
Tenant B
   ↓
Webhook → Tenant B's CRM
```

A webhook cannot be treated as globally reusable configuration because its event stream is tenant-specific.

---

## Aggregate Boundary

```text
Tenant
   │
   ├── Integrations
   │
   └── Webhooks
          │
          ├── Endpoint
          ├── Event Subscription
          ├── Authentication/Signing
          └── Lifecycle State
```

The external destination remains outside the InsureIQ aggregate.

---

# 5. Business Capabilities Supported

| Capability | Supported |
|---|---|
| Outbound event delivery | Yes |
| Webhook registration | Yes |
| Event subscription management | Yes |
| Endpoint lifecycle management | Yes |
| Tenant-specific event integration | Yes |
| Webhook security | Yes |
| Delivery monitoring | Supported architecturally, but detailed delivery history is outside this table |

---

## Outbound Event Delivery

The table provides the destination configuration required for event delivery.

## Webhook Registration

Administrators can register a destination endpoint for the tenant.

## Event Subscription Management

A webhook can subscribe to a defined set of event types.

Conceptually:

```text
Webhook A
    ↓
policy.created
policy.updated
claim.created
```

while another webhook may receive:

```text
claim.created
claim.updated
```

---

## Endpoint Lifecycle Management

A webhook can be:

```text
pending
active
inactive
failed
archived
```

depending on the lifecycle model adopted by the implementation.

The exact state enum is **not present in the surviving source material**, so these values should be treated as architectural recommendations rather than recovered source requirements.

---

## Webhook Security

Webhook endpoints may require:

- Signature verification.
- Secret-based signing.
- TLS.
- Authentication.
- Replay protection.

The actual secret-management mechanism should remain separate from ordinary configuration wherever appropriate.

---

# 6. Multi-Tenant / Ownership / Isolation Notes

Every webhook belongs to exactly one tenant.

```text
tenant_webhooks.tenant_id
            ↓
         tenants.id
```

The tenant is the primary isolation boundary.

---

## Tenant Isolation

Suppose:

```text
Tenant A
    webhook-a.example
```

and:

```text
Tenant B
    webhook-b.example
```

The platform must ensure that:

```text
Tenant A events
       ↓
Webhook A
```

never become:

```text
Tenant B events
       ↓
Webhook A
```

unless explicitly permitted by a separately governed cross-tenant mechanism.

---

## Event Isolation

Tenant isolation applies not only to the webhook record but also to the event payload.

A webhook registered by Tenant A must receive only events that belong to Tenant A unless the event is explicitly classified as a platform-level event.

---

## Correct Access Pattern

```sql
SELECT *
FROM tenant_webhooks
WHERE tenant_id = :authenticated_tenant_id;
```

The tenant identifier should be derived from authenticated context.

---

## Security Consequence

A webhook represents a potential **data-exfiltration boundary**.

A compromised or incorrectly configured webhook could send:

```text
Customer Data
Policy Data
Claim Data
Payment Events
Operational Events
```

to an external endpoint.

Webhook authorization is therefore both:

```text
Tenant isolation
+
Outbound data security
```

---

# 7. Lifecycle

A webhook lifecycle should conceptually follow:

```text
Registration
     ↓
Validation
     ↓
Activation
     ↓
Operational Delivery
     ↓
Modification / Disablement
     ↓
Archival
```

---

## Creation — Webhook Registered

A tenant administrator creates a webhook:

```text
Tenant
   ↓
Register Endpoint
   ↓
Select Events
   ↓
Configure Security
   ↓
Webhook Created
```

---

## Validation

Before activation, the platform may validate:

- URL format.
- TLS.
- Ownership/challenge.
- Signature configuration.
- Reachability.

The exact validation protocol is not defined in the available source.

---

## Activation

Once validated:

```text
Webhook
   ↓
ACTIVE
```

The event dispatcher can then consider it for outbound delivery.

---

## Operational Use

When an event occurs:

```text
Business Event
      ↓
Event Bus / Dispatcher
      ↓
Tenant Webhooks
      ↓
Matching Event Subscription
      ↓
HTTP Delivery
```

---

## Modification

Webhook configuration may change:

```text
Endpoint
Subscribed Events
Security Configuration
Status
```

Each change should be auditable.

---

## Disablement

A webhook may be disabled without physically deleting its historical registration.

This prevents accidental loss of operational history.

---

## Archival

An obsolete webhook can be archived while retaining the record.

This is preferable to immediate hard deletion because historical webhook registrations can be important for:

- Security investigation.
- Audit.
- Incident response.
- Compliance.
- Troubleshooting.

---

# 8. Proposed Schema

## Table Name

`tenant_webhooks`

## Primary Key Strategy

**UUID**

The Module 1 schema convention uses UUID primary keys, and the existing Tenant Management tables consistently use `id` as their primary identifier.

Because a surviving detailed `tenant_webhooks` source schema was not found, the fields below are clearly marked as **proposed reconstruction** where the source does not establish them.

---

## Full Field-by-Field Schema Definition

| Field Name | Data Type | Key Type | Specification | Reason Field Exists |
|---|---|---|---|---|
| `id` | UUID | PK | `NOT NULL` | Stable unique identity of the webhook registration |
| `tenant_id` | UUID | FK → `tenants.id` | `NOT NULL` | Establishes tenant ownership and isolation |
| `webhook_name` | VARCHAR(200) | UK as part of `(tenant_id, webhook_name)` | `NOT NULL` | Provides a tenant-scoped human-readable identity |
| `endpoint_url` | TEXT | — | `NOT NULL` | Identifies the external callback destination |
| `event_types` | JSONB / ARRAY | — | `NOT NULL` | Stores the events to which the webhook is subscribed |
| `authentication_method` | ENUM | — | `NOT NULL` | Defines how the endpoint is authenticated or secured |
| `status` | ENUM | — | `NOT NULL` | Represents the webhook lifecycle state |
| `configuration` | JSONB | — | `NULL` | Stores non-secret provider/webhook-specific configuration |
| `last_delivery_at` | TIMESTAMPTZ | — | `NULL` | Records the most recent delivery attempt |
| `last_success_at` | TIMESTAMPTZ | — | `NULL` | Records the most recent successful delivery |
| `failure_count` | INTEGER | — | `NOT NULL DEFAULT 0, CHECK >= 0` | Supports operational visibility into repeated delivery failures |
| `created_at` | TIMESTAMPTZ | — | `NOT NULL` | Records webhook registration creation |
| `updated_at` | TIMESTAMPTZ | — | `NOT NULL` | Records the latest webhook configuration change |

### Important Source Boundary

The exact field list above is **not recoverable from the available `tenant_webhooks` source files**. The Module 1 inventory only establishes the table's existence and purpose: **Tenant webhook registrations**.

Therefore, fields such as:

```text
event_types
last_delivery_at
last_success_at
failure_count
```

are proposed implementation fields required to make the table operationally complete, not claims about an original missing document.

This distinction is deliberate and prevents false source attribution.

---

## `id`

Provides stable technical identity.

```text
id
↓
Which webhook registration is this?
```

---

## `tenant_id`

Defines ownership and tenant isolation.

```text
tenant_id
↓
tenants.id
```

---

## `webhook_name`

Provides a human-readable tenant-scoped identity.

Examples:

```text
CRM Events
Claims Webhook
Analytics Events
Partner Notifications
```

A composite uniqueness rule is proposed:

```sql
UNIQUE(tenant_id, webhook_name)
```

because different tenants may legitimately use the same name.

---

## `endpoint_url`

Defines the destination to which webhook requests are sent.

Example:

```text
https://partner.example.com/insureiq/events
```

The source does not provide a URL-format constraint, so URL validation should primarily be implemented at the application/domain layer.

---

## `event_types`

Defines which platform events this webhook receives.

Conceptually:

```json
[
  "policy.created",
  "policy.updated",
  "claim.created"
]
```

The exact event catalog is not established by the available `tenant_webhooks` source.

Therefore the event names must be governed by the platform event contract rather than freely invented per webhook.

---

## `authentication_method`

Defines the webhook security mechanism.

Possible mechanisms may include:

```text
signature
bearer_token
basic_auth
mutual_tls
custom
```

These values are **proposed**, not recovered from the missing source schema.

---

## `status`

Represents lifecycle state.

A recommended state model is:

```text
pending
active
inactive
failed
archived
```

Again, these are architectural recommendations because the surviving source does not specify the original webhook status enum.

---

## `configuration`

Stores non-secret webhook-specific configuration.

Examples could include:

```text
timeout
content_type
API version
delivery mode
```

Sensitive secrets should not be stored here in plaintext.

---

## `last_delivery_at`

Records the latest delivery attempt.

It is intentionally different from:

```text
last_success_at
```

because a failed attempt is still a delivery attempt.

---

## `last_success_at`

Records the latest successfully acknowledged delivery.

This allows a quick distinction between:

```text
Last attempted:
10:30

Last successful:
09:15
```

---

## `failure_count`

Provides lightweight operational visibility.

It is not a replacement for a detailed webhook delivery log.

A separate delivery-history table would be appropriate if InsureIQ later requires complete:

```text
request
response
retry
latency
HTTP status
payload
```

history.

---

# 9. Enum Definitions

Because the surviving source does not contain the original `tenant_webhooks` enum definitions, the following are **proposed controlled values**, not recovered source content.

## `authentication_method`

| Value | Description |
|---|---|
| `signature` | Payload-signature verification using a shared secret |
| `bearer_token` | Bearer-token authentication |
| `basic_auth` | HTTP Basic Authentication |
| `mutual_tls` | Mutual TLS/client certificate authentication |
| `custom` | Provider-specific authentication mechanism |

The security implementation must ensure secrets are stored through the appropriate secret-management mechanism.

---

## `status`

| Value | Description |
|---|---|
| `pending` | Registration exists but is not yet active |
| `active` | Webhook is enabled for delivery |
| `inactive` | Webhook is configured but disabled |
| `failed` | Webhook has entered an operational failure state |
| `archived` | Webhook has been retired but retained |

These values should become a formal domain contract before implementation.

---

# 10. Why `event_types` Exists

A tenant may require multiple webhook endpoints with different subscriptions.

For example:

```text
Webhook A
    ↓
policy.created
policy.updated
```

while:

```text
Webhook B
    ↓
claim.created
claim.updated
```

If event subscriptions were stored only at the tenant level, the platform could not route different events to different endpoints.

Therefore:

```text
tenant_webhooks
        ↓
webhook-specific event subscription
```

is necessary.

---

## Why Not One Global Tenant Webhook?

Because a tenant can have multiple consumers:

```text
Tenant
 ├── CRM
 ├── ERP
 ├── Analytics
 └── Partner
```

Each consumer may require a different event set.

---

# 11. Candidate Keys

| Key Type | Field(s) | Rationale |
|---|---|---|
| Primary Key | `id` | Stable technical identity |
| Candidate Key | `(tenant_id, webhook_name)` | Provides tenant-scoped webhook identity |

The composite candidate key is a proposed design decision because the source inventory does not specify the original constraint.

---

## Why Not Globally Unique `webhook_name`?

Because:

```text
Tenant A
    Claims Webhook

Tenant B
    Claims Webhook
```

is completely valid.

Therefore:

```sql
UNIQUE(webhook_name)
```

would incorrectly impose a global constraint.

The appropriate tenant-scoped identity is:

```sql
UNIQUE(tenant_id, webhook_name)
```

---

# 12. Constraints

| Constraint | Definition | Reason |
|---|---|---|
| Primary Key | `PK(id)` | Stable webhook identity |
| Tenant FK | `tenant_id → tenants.id` | Establishes ownership |
| Tenant-Scoped Name | `UNIQUE(tenant_id, webhook_name)` | Prevents duplicate names within one tenant |
| Webhook Name | `NOT NULL` | Registration requires an identity |
| Endpoint | `NOT NULL` | Delivery requires a destination |
| Event Types | `NOT NULL` | Webhook must have a subscription definition |
| Authentication Method | `NOT NULL` | Security mechanism must be defined |
| Status | `NOT NULL` | Lifecycle state is required |
| Failure Count | `DEFAULT 0` | New webhook has no recorded failures |
| Failure Count | `CHECK(failure_count >= 0)` | Prevents invalid failure counts |
| Timestamps | `NOT NULL` | Lifecycle tracking |

The source does **not** establish the exact constraints above except the general Tenant Management architecture and the table's existence. They are therefore proposed constraints.

---

# 13. Relationships

## Incoming References / Logical Consumers

The webhook subsystem would logically be consumed by:

- Webhook Dispatcher.
- Event Bus.
- Integration Manager.
- Monitoring Service.
- Audit Service.

These consumers are architectural relationships; the available source does not provide a surviving detailed Table 23 relationship section.

---

## Outgoing References

```text
tenant_id → tenants.id
```

The webhook may also logically depend on:

```text
Event Catalog
Secret Management
Webhook Delivery Infrastructure
```

but those are service-level dependencies rather than necessarily relational foreign keys.

---

## Integration Manager

A tenant's integration management layer may use webhook registrations when configuring outbound event connectivity.

---

## Event Bus / Dispatcher

The dispatcher determines:

```text
Event
   ↓
Tenant
   ↓
Matching Webhooks
```

---

## Monitoring Service

Consumes webhook operational state and delivery metrics.

---

## Audit Service

Records registration and lifecycle changes.

---

# 14. Cardinality Analysis

The exact source cardinality for `tenant_webhooks` is not present in the accessible detailed files.

A webhook table should therefore be modeled as:

```text
Tenant
   ↓
0..N Webhooks
```

rather than as a one-to-one configuration.

| Relationship | Expected Cardinality |
|---|---:|
| Tenant → Webhooks | 0–N |
| Webhook → Tenant | Exactly 1 |
| Webhook → Event Types | 1–N |
| Event Type → Webhooks | 0–N |

The actual production upper bound should be determined from operational requirements.

---

## Why 0..N?

Some tenants may never use webhooks.

Others may have:

```text
CRM webhook
ERP webhook
Claims webhook
Analytics webhook
Partner webhook
```

Therefore:

```text
Tenant
    ↓
Many Webhooks
```

is fundamental to the entity's purpose.

---

# 15. Query Patterns

## Retrieve Active Tenant Webhooks

```sql
SELECT *
FROM tenant_webhooks
WHERE tenant_id = :tenant_id
AND status = 'active';
```

This is the primary event-dispatch query.

---

## Retrieve a Named Webhook

```sql
SELECT *
FROM tenant_webhooks
WHERE tenant_id = :tenant_id
AND webhook_name = :webhook_name;
```

---

## Find Failed Webhooks

```sql
SELECT *
FROM tenant_webhooks
WHERE tenant_id = :tenant_id
AND status = 'failed';
```

---

## Find Webhooks With Recent Activity

```sql
SELECT *
FROM tenant_webhooks
WHERE tenant_id = :tenant_id
AND last_delivery_at >= :since
ORDER BY last_delivery_at DESC;
```

---

## Find Webhooks Never Successfully Delivered

```sql
SELECT *
FROM tenant_webhooks
WHERE tenant_id = :tenant_id
AND status = 'active'
AND last_success_at IS NULL;
```

This can identify registrations that may require verification.

---

## Event Subscription Lookup

If `event_types` is JSONB:

```sql
SELECT *
FROM tenant_webhooks
WHERE tenant_id = :tenant_id
AND status = 'active'
AND event_types @> '["claim.created"]'::jsonb;
```

The exact JSON structure should be standardized before implementation.

---

# 16. Index Strategy

Recommended indexes:

| Index | Purpose |
|---|---|
| PK(`id`) | Primary identity lookup |
| INDEX(`tenant_id`) | Tenant-scoped retrieval |
| UNIQUE(`tenant_id`, `webhook_name`) | Tenant-scoped identity |
| INDEX(`status`) | Operational filtering |
| INDEX(`last_delivery_at`) | Delivery monitoring |
| INDEX(`last_success_at`) | Health monitoring |
| GIN(`event_types`) | Event subscription lookup |

---

## Primary Key

```sql
PRIMARY KEY(id)
```

---

## Tenant Index

```sql
INDEX(tenant_id)
```

The dominant access pattern is tenant-scoped retrieval.

---

## Composite Unique Index

```sql
UNIQUE(tenant_id, webhook_name)
```

Enforces tenant-scoped identity.

---

## Status Index

```sql
INDEX(status)
```

Supports:

```text
active
failed
inactive
```

operational queries.

---

## Event Subscription Index

If JSONB is selected:

```sql
GIN(event_types)
```

supports event-subscription matching.

---

## Delivery Timestamp Index

```sql
INDEX(last_delivery_at)
```

supports monitoring and operational analysis.

---

# 17. Read / Write Characteristics

The expected workload is:

| Operation | Volume | Notes |
|---|---|---|
| Reads | High | Event dispatch repeatedly resolves active webhooks |
| Writes | Low | Registrations change less frequently |
| Updates | Low–Moderate | Configuration and operational state can change |
| Deletes | Very Low | Prefer archival/disablement |

---

## Reads — High

Every outbound event may require webhook resolution.

Conceptually:

```text
Event
 ↓
Tenant
 ↓
Active Webhooks
 ↓
Matching Event Types
```

For high-volume events, caching becomes important.

---

## Writes — Low

Most webhook configuration is relatively stable.

Writes occur when:

- Creating a webhook.
- Updating its endpoint.
- Changing subscriptions.
- Changing status.
- Rotating configuration.

---

## Operational Updates

`last_delivery_at`, `last_success_at`, and `failure_count` may be updated by delivery infrastructure.

This means write volume can become significant for high-volume tenants.

This is an important architectural consideration:

> **If webhook delivery becomes extremely high volume, operational delivery state should eventually be separated from the configuration table.**

That avoids turning a relatively static configuration table into a hot-write operational table.

---

# 18. Caching Strategy

Recommended Redis key:

```text
tenant-webhooks:{tenant_id}
```

Example:

```text
tenant-webhooks:abc123
```

---

## Cached Data

The cache should primarily contain routing configuration:

```text
id
webhook_name
endpoint_url
event_types
authentication_method
status
configuration
```

Frequently changing operational counters should be treated carefully.

---

## Cache Lookup

```text
Event
  ↓
Tenant
  ↓
Redis
tenant-webhooks:{tenant_id}
  ↓
Active Matching Webhooks
```

---

## Cache Invalidation

When a webhook is created, updated, disabled, or archived:

```text
Database Transaction
       ↓
Commit
       ↓
TenantWebhookChanged
       ↓
Invalidate Cache
```

---

## Security

Secrets must not be blindly placed into Redis.

If signing credentials are referenced by the webhook, the cache should contain a secure credential reference rather than exposing plaintext secret material.

---

## Database Remains Authoritative

```text
PostgreSQL
    ↓
Authoritative Registration

Redis
    ↓
Routing Cache
```

---

# 19. Security Considerations

Webhook security is particularly important because this table defines **where tenant data can leave the platform**.

---

## 1. Tenant Isolation

Every webhook must be tenant-scoped.

---

## 2. Endpoint Validation

The platform should validate webhook endpoints before activation where practical.

Possible controls include:

- HTTPS requirement.
- Domain validation.
- Challenge-response verification.
- SSRF protection.
- Private-network restrictions.

The exact implementation is not defined by the source.

---

## 3. Payload Signing

Webhook payloads should preferably be cryptographically signed.

Conceptually:

```text
Payload
   +
Secret
   ↓
HMAC Signature
   ↓
Webhook Request
```

The receiver can verify that the request originated from InsureIQ.

---

## 4. Secret Management

Signing secrets and authentication credentials should not be treated as ordinary configuration.

They should be:

- Encrypted.
- Access-controlled.
- Rotatable.
- Audited.
- Stored through appropriate secret-management infrastructure.

---

## 5. SSRF Protection

Because tenants can potentially register arbitrary endpoints, webhook delivery infrastructure must protect against server-side request forgery.

The delivery service should not blindly allow requests to:

```text
localhost
127.0.0.1
private IP ranges
cloud metadata endpoints
internal administration services
```

The precise allow/deny model requires infrastructure-level definition.

---

## 6. RBAC

Only authorized tenant administrators should be allowed to:

- Create webhooks.
- Modify endpoints.
- Change subscriptions.
- Enable webhooks.
- Disable webhooks.
- Rotate security configuration.

---

## 7. Audit Logging

All sensitive webhook lifecycle changes should be auditable.

---

## 8. Data Minimization

Webhook payloads should contain only information necessary for the subscribed event.

The webhook registration itself should never grant access to arbitrary tenant data.

---

# 20. Audit Requirements

Recommended audit events:

| Event | Trigger | Purpose |
|---|---|---|
| `TenantWebhookCreated` | New registration | Record webhook creation |
| `TenantWebhookUpdated` | Configuration changed | Record configuration changes |
| `TenantWebhookActivated` | Webhook enabled | Record activation |
| `TenantWebhookDisabled` | Webhook disabled | Record deactivation |
| `TenantWebhookArchived` | Webhook retired | Preserve lifecycle history |
| `TenantWebhookFailed` | Webhook enters failure state | Record operational failure |
| `TenantWebhookSecretRotated` | Signing/authentication secret rotated | Record security change |

These are **recommended audit events**, because the surviving source does not contain the original Table 23 event list.

---

## Sensitive Audit Information

Audit events must not contain:

```text
Raw webhook secrets
Bearer tokens
Private credentials
Complete sensitive payloads
```

Instead, audit:

```text
Secret rotated
```

rather than:

```text
Secret = abc123...
```

---

# 21. Event Producers / Event Consumers

## Producers

Recommended producers:

```text
TenantWebhookCreated
TenantWebhookUpdated
TenantWebhookActivated
TenantWebhookDisabled
TenantWebhookArchived
TenantWebhookFailed
TenantWebhookSecretRotated
```

---

## Consumers

Logical consumers include:

- Webhook Dispatcher.
- Event Bus.
- Monitoring Service.
- Audit Service.
- Integration Manager.

---

## Webhook Creation Workflow

```text
Tenant Administrator
        ↓
Register Webhook
        ↓
RBAC Validation
        ↓
Endpoint Validation
        ↓
tenant_webhooks
        ↓
TenantWebhookCreated
        │
        ├── Webhook Dispatcher
        ├── Monitoring Service
        └── Audit Service
```

---

## Event Delivery Workflow

```text
Business Event
      ↓
Event Bus
      ↓
Tenant Resolution
      ↓
Webhook Cache / Database
      ↓
Event-Type Matching
      ↓
Webhook Dispatcher
      ↓
External Endpoint
```

---

## Failure Workflow

```text
Webhook Delivery
      ↓
Failure
      ↓
Retry Policy
      ↓
Repeated Failure
      ↓
WebhookFailed
      ↓
Monitoring
      ↓
Possible Disablement
```

The retry mechanism itself should be implemented outside the registration table.

---

# 22. Alternative Designs Considered

| Option | Description | Verdict |
|---|---|---|
| A | Store webhooks in `tenant_settings` | Rejected |
| B | Store webhooks inside `tenant_integrations.configuration` | Rejected |
| C | JSON-only tenant webhook registry | Rejected |
| D | Dedicated `tenant_webhooks` table | Chosen |

---

## Option A — `tenant_settings`

Rejected because webhooks are not ordinary tenant settings.

They have:

- Lifecycle.
- Security requirements.
- Event subscriptions.
- Delivery behavior.
- Operational monitoring.

---

## Option B — `tenant_integrations.configuration`

Rejected because an integration and a webhook are related but distinct concepts.

```text
Integration
    ↓
Connection / Provider

Webhook
    ↓
Event Delivery Endpoint
```

One integration may potentially have multiple webhook destinations.

---

## Option C — JSON-Only Registry

Rejected as the primary relational representation because it weakens:

- Tenant-level relational integrity.
- Indexing.
- Lifecycle querying.
- Operational filtering.
- Candidate-key enforcement.
- Security governance.
- Event routing queries.

---

## Option D — Dedicated Table

Chosen because it provides:

- Explicit tenant ownership.
- Multiple webhooks per tenant.
- Tenant-scoped naming.
- Structured lifecycle management.
- Event subscription configuration.
- Dedicated security controls.
- Dedicated indexes.
- Dedicated caching.
- Dedicated audit events.

This also maintains consistency with the Module 1 architectural pattern of separating major tenant-owned configuration domains into dedicated tables.

---

# 23. Final Design Assessment

Because the source does not contain the original Table 23 assessment, the following is a **proposed assessment**, not recovered source content.

| Attribute | Rating |
|---|---|
| Complexity | **Medium** |
| Read Volume | **High** |
| Write Volume | **Low to Moderate** |
| Security Importance | **Critical** |
| Business Criticality | **High** |
| Scalability | **Excellent** |
| Recommended Status | **Core Event Integration Table** |

---

# Overall Assessment

`tenant_webhooks` is the tenant-scoped registry for **outbound event delivery endpoints**.

Its architectural position is:

```text
                         TENANT
                            │
                            ▼
                    tenant_webhooks
                            │
                ┌───────────┼───────────┐
                ▼           ▼           ▼
             Endpoint    Events      Security
                │           │           │
                └───────────┼───────────┘
                            ▼
                     Webhook Dispatcher
                            │
                            ▼
                     External Systems
```

The relationship with `tenant_integrations` should remain explicit:

```text
tenant_integrations
        │
        │
        ├──── External system relationship
        │
        ▼
     Provider

tenant_webhooks
        │
        │
        ├──── Event delivery relationship
        │
        ▼
     Endpoint
```

The essential architectural principle is:

> **`tenant_webhooks` represents tenant-owned outbound event subscriptions, providing a controlled and auditable mechanism for delivering selected InsureIQ events to external endpoints without conflating webhook registrations with integrations, credentials, events, or delivery history.**

---

# Complete Webhook Model

```text
┌──────────────────────────────────────────────┐
│                    TENANT                    │
└───────────────────────┬──────────────────────┘
                        │
                        │ 1 : N
                        ▼
┌──────────────────────────────────────────────┐
│                tenant_webhooks               │
├──────────────────────────────────────────────┤
│ id                                           │
│ tenant_id                                    │
│ webhook_name                                 │
│ endpoint_url                                 │
│ event_types                                  │
│ authentication_method                        │
│ status                                       │
│ configuration                                │
│ last_delivery_at                             │
│ last_success_at                              │
│ failure_count                                │
│ created_at                                   │
│ updated_at                                   │
└───────────────────────┬──────────────────────┘
                        │
                        ▼
                 Webhook Dispatcher
                        │
                        ▼
                  External Endpoint
```

---

# Event Delivery Model

```text
                    BUSINESS EVENT
                           │
                           ▼
                    EVENT BUS / QUEUE
                           │
                           ▼
                    TENANT RESOLUTION
                           │
                           ▼
                 ACTIVE WEBHOOK REGISTRY
                           │
                           ▼
                  EVENT-TYPE MATCHING
                           │
                 ┌─────────┴─────────┐
                 ▼                   ▼
             Webhook A           Webhook B
                 │                   │
                 ▼                   ▼
          External CRM         External ERP
```

---

# Security Model

```text
Tenant
   │
   ▼
Webhook Registration
   │
   ├── RBAC
   ├── Tenant Isolation
   ├── Endpoint Validation
   ├── Secret Management
   ├── Payload Signing
   └── Audit Logging
           │
           ▼
     Webhook Dispatcher
           │
           ▼
     External Endpoint
```

---

# Critical Production Invariants

1. Every webhook belongs to exactly one tenant.
2. `tenant_id` references `tenants.id`.
3. Webhook access must always be tenant-scoped.
4. A webhook is an outbound event subscription, not a general integration.
5. A webhook is not an API credential.
6. A webhook is not an OAuth client.
7. A webhook is not an event itself.
8. A webhook is not a delivery-attempt record.
9. A tenant can have multiple webhook registrations.
10. Different tenants may use identical webhook names.
11. Tenant-scoped uniqueness should therefore use `(tenant_id, webhook_name)`.
12. Endpoint configuration must be validated before operational activation.
13. Webhook delivery must not permit arbitrary unsafe internal network access.
14. Webhook secrets must not be stored or exposed as ordinary plaintext configuration.
15. Webhook payloads should be authenticated through signing or another appropriate mechanism.
16. Webhook subscriptions must only receive events belonging to the authorized tenant.
17. Event subscriptions must be explicitly defined.
18. Webhook lifecycle changes must be auditable.
19. Webhook failures must be observable.
20. Retry processing belongs to delivery infrastructure, not the registration row itself.
21. Complete delivery history should belong to a dedicated operational delivery-history structure if required.
22. Redis is a routing-performance cache; the database remains authoritative.
23. Tenant identity must be included in the cache key.
24. Configuration changes must invalidate or refresh stale webhook cache entries.
25. Secrets must not be copied into ordinary audit-event payloads.
26. Webhook administration requires appropriate RBAC.
27. The webhook table must remain focused on **registration and routing configuration**, not become a generic event-log table.
28. Operational fields such as `failure_count` must not be allowed to turn the configuration table into a high-frequency delivery ledger at scale.
29. If delivery volume becomes extremely high, delivery state/history should be separated from the registration entity.
30. The exact original Table 23 field list, enum definitions, cardinality, index list, and event list were not available in the surviving source material and therefore must not be falsely represented as recovered requirements.

---

## Source Integrity Note

This table required a stricter anti-degradation treatment than Table 22.

The available Module 1 source establishes that **`tenant_webhooks` is Table 23 and represents tenant webhook registrations**, but the accessible detailed schema corpus does **not** contain the original Table 23 field-by-field specification.

Therefore, I have **not silently fabricated a “recovered” schema**. The proposed physical fields and implementation constraints above are explicitly marked as reconstructed/proposed where necessary.

That preserves the distinction between:

```text
SOURCE REQUIREMENT
        vs.
ARCHITECTURAL RECONSTRUCTION
```

which is essential for preventing schema-documentation degradation.

**Step 3 — Table 23 is complete. No `.md` file has been created in this response.**
