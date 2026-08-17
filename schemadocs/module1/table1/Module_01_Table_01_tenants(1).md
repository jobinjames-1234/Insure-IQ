# Step 3 — Table 1: `tenants`

The `tenants` table is the **aggregate root and primary isolation boundary** of InsureIQ. The design below preserves the detailed schema standard already established for this table, rather than replacing it with a shorter summary. The source requirements explicitly require InsureIQ to provision each insurer as an isolated tenant with its own users, branding, configuration, and data. fileciteturn6file13L1-L10

---

# 1. Why This Table Exists

The `tenants` table is the **foundation of the entire InsureIQ platform**.

InsureIQ is designed as a **multi-tenant Software-as-a-Service (SaaS)** platform where multiple insurance organizations share the same application while maintaining complete isolation of their business data. The `tenants` table establishes that isolation boundary and serves as the root ownership entity for every operational module.

Without this table:

- Multiple insurance companies could not safely operate within the same platform.
- Data ownership and isolation would not exist.
- Tenant-specific branding and configuration would be impossible.
- Licensing and subscription management could not be enforced.
- Regulatory data residency requirements could not be implemented.
- Security boundaries between insurers would not exist.

Every major business entity—including users, customers, policies, claims, billing records, reports, AI configurations, and integrations—ultimately belongs to one tenant. fileciteturn6file5

---

# 2. Business Definition

A **Tenant** represents an independent insurance organization that subscribes to the InsureIQ platform.

Examples include:

- ABC Insurance Ltd.
- National Life Insurance
- Secure Health Insurance
- Global Motor Insurance
- Regional Mutual Insurance

Each tenant owns:

- Employees
- Customers
- Insurance products
- Policies
- Claims
- Documents
- Reports
- AI configurations
- Financial records
- Integrations
- Workflows
- Platform settings

A tenant is **not**:

- A user.
- A customer.
- A policyholder.
- A subscription.

Instead, it represents the legal organization operating within the platform. fileciteturn6file5

---

# 3. Critical Design Principle — What the Entity IS and IS NOT

## The Tenant IS

- The highest ownership boundary.
- The primary multi-tenant isolation boundary.
- The root business organization using the platform.
- The owner of all operational data.
- The aggregate root of the Tenant Management domain.

## The Tenant IS NOT

- A person.
- An employee.
- A customer.
- An insurance policy.
- A subscription.
- A billing account.

Every operational record ultimately traces back to a tenant. fileciteturn6file6

---

# 4. Aggregate Root Analysis — DDD Structure

```text
Tenant
│
├── Tenant Profile
├── Addresses
├── Contacts
├── Branding
├── Settings
├── Locales
├── Features
├── Module Assignments
├── Subscription Plans
├── Usage Limits
├── Usage Counters
├── Status History
├── Lifecycle Events
├── API Credentials
├── OAuth Clients
├── Security Settings
├── Data Regions
├── Backup Policies
├── Email Settings
├── SMS Settings
├── Storage Settings
├── Integrations
├── Webhooks
└── Provisioning Logs
```

Within Domain-Driven Design (DDD), **Tenant** is the **Aggregate Root** for the Tenant Management bounded context. All subordinate entities are managed through this aggregate. fileciteturn6file5

The aggregate boundary is particularly important because tenant provisioning is not merely the insertion of one row. Creating a tenant initiates a coordinated process involving configuration, subscription, administration, branding, security, storage, and other tenant-scoped resources.

---

# 5. Business Capabilities Supported

| Capability | Supported |
|---|---|
| Multi-tenancy | Yes |
| Tenant onboarding | Yes |
| Data isolation | Yes |
| Organization ownership | Yes |
| Feature licensing | Yes |
| Subscription ownership | Yes |
| Branding | Yes |
| Regional configuration | Yes |
| API ownership | Yes |
| Security policy management | Yes |
| Backup configuration | Yes |
| Integration ownership | Yes |
| Audit boundary | Yes |

The requirements specifically call for tenant provisioning, tenant-specific branding, tenant-scoped configuration, tenant-level administration, subscription management, usage metering, and feature-tier enforcement. fileciteturn6file13L1-L10

---

# 6. Multi-Tenant / Ownership / Isolation Notes

The `tenants` table defines the **highest isolation boundary** within the platform.

Example:

```text
Tenant A
├── 450 Employees
├── 1,800,000 Customers
├── 7,200,000 Policies
└── 320,000 Claims

Tenant B
├── 90 Employees
├── 250,000 Customers
├── 900,000 Policies
└── 42,000 Claims
```

Neither tenant can access the other's operational data.

Every service layer should enforce tenant isolation using logic equivalent to:

```sql
WHERE tenant_id = :tenant_id
```

This rule applies across all business modules.

The requirements explicitly state that every insurer should have its own isolated tenant, users, branding, and data. They also identify tenant isolation as an architectural decision that must exist from the beginning rather than being added later. fileciteturn6file13L1-L10

### Important architectural distinction

The `tenants` table represents the **logical ownership boundary**.

The physical isolation mechanism may vary by tenant:

```text
Standard Tenant
    ↓
Shared PostgreSQL database
    ↓
tenant_id isolation / RLS

Large or regulated Tenant
    ↓
Dedicated PostgreSQL schema

Highly regulated / enterprise Tenant
    ↓
Dedicated database / deployment
```

The requirements explicitly allow either a separate PostgreSQL schema or fully separate database depending on insurer size and compliance requirements. fileciteturn5file2

Therefore, the schema must not assume that every tenant necessarily shares the same physical database.

---

# 7. Lifecycle

## Creation

```text
Insurance Company Registers
        ↓
Tenant Created
        ↓
Default Configuration Created
        ↓
Subscription Assigned
        ↓
Administrator Invited
        ↓
Tenant Provisioned
        ↓
Tenant Activated
```

The tenant record should be created before dependent tenant-scoped resources are provisioned.

---

## Growth / Usage

```text
Employees Added
        ↓
Insurance Products Created
        ↓
Applications Submitted
        ↓
Policies Issued
        ↓
Claims Processed
        ↓
Operational Data Expands
```

The tenant itself remains a relatively low-volume entity even while the data it owns grows into millions or tens of millions of records.

---

## Suspension

```text
Subscription Suspended / Security Event
        ↓
Tenant Disabled
        ↓
Logins Blocked
        ↓
New Operations Blocked
        ↓
Operational Data Retained
```

Suspension must not delete or destroy business records.

---

## Archival

```text
Tenant Cancels Service
        ↓
Tenant Archived
        ↓
Access Disabled
        ↓
Backups Preserved
        ↓
Audit History Retained
```

Hard deletion should only occur under exceptional administrative or legal circumstances. fileciteturn6file7

---

# 8. Proposed Schema

## Table Name

`tenants`

## Primary Key Strategy

**UUID**

### Rationale

UUIDs are selected because they:

- Provide globally unique identifiers.
- Support distributed cloud deployments.
- Avoid predictable sequential IDs.
- Simplify future microservice decomposition.
- Support multi-region replication.

The UUID should be the immutable technical identifier of the tenant. Human-readable business identification should be handled separately through `tenant_code`. fileciteturn6file0

---

## Schema Definition

| Field Name | Data Type | Key | Specification | Reason Field Exists |
|---|---|---|---|---|
| `id` | UUID | PK | `NOT NULL` | Unique tenant identifier and immutable technical identity |
| `tenant_code` | VARCHAR(50) | UK | `NOT NULL`, `UNIQUE` | Human-readable business identifier used by administrators, support, finance, logs, and integrations |
| `tenant_name` | VARCHAR(255) | — | `NOT NULL` | Public/display name of the tenant |
| `legal_name` | VARCHAR(255) | — | `NULL` | Registered legal organization name for contracts, compliance, and financial records |
| `tenant_type` | ENUM | — | `NOT NULL` | Classifies the organization operating within InsureIQ |
| `registration_number` | VARCHAR(100) | — | `NULL` | Government or regulatory registration identifier |
| `tax_identifier` | VARCHAR(100) | — | `NULL` | Tax registration identifier required for financial and billing processes |
| `primary_email` | VARCHAR(255) | — | `NOT NULL` | Official tenant-level communication address |
| `primary_phone` | VARCHAR(50) | — | `NULL` | Primary organization contact number |
| `website_url` | VARCHAR(500) | — | `NULL` | Official tenant website |
| `default_timezone` | VARCHAR(100) | — | `NOT NULL` | Default timezone used for tenant-local operations and scheduling |
| `default_language` | VARCHAR(20) | — | `NOT NULL` | Default language for tenant-facing interfaces and generated content |
| `country_code` | CHAR(2) | — | `NOT NULL` | ISO 3166-1 country code for jurisdictional context |
| `status` | ENUM | — | `NOT NULL` | Current tenant lifecycle state |
| `onboarding_completed` | BOOLEAN | — | `NOT NULL`, `DEFAULT FALSE` | Indicates whether mandatory tenant onboarding has completed |
| `activated_at` | TIMESTAMPTZ | — | `NULL` | Records when the tenant became operational |
| `suspended_at` | TIMESTAMPTZ | — | `NULL` | Records when tenant access was suspended |
| `archived_at` | TIMESTAMPTZ | — | `NULL` | Records when the tenant was archived |
| `created_at` | TIMESTAMPTZ | — | `NOT NULL` | Immutable creation timestamp |
| `updated_at` | TIMESTAMPTZ | — | `NOT NULL` | Last modification timestamp |

### Important implementation note

`tenant_code` should **not** replace the UUID primary key.

The two identifiers serve different purposes:

```text
id
│
└── Technical identity
    ├── Foreign keys
    ├── Internal services
    ├── Distributed systems
    └── Database relationships

tenant_code
│
└── Business identity
    ├── Support
    ├── Finance
    ├── Invoices
    ├── Audit reports
    ├── Logs
    └── Human-facing administration
```

For example:

```text
id:
4dbe6cb6-cb1e-49d8-b74d-9d...

tenant_code:
TEN-000245
```

This distinction is explicitly established in the existing tenant design. fileciteturn6file2

---

# 9. Enum Definitions

## `tenant_type`

Defines the type of organization using the platform.

| Value | Description |
|---|---|
| `insurance_company` | Licensed insurance carrier issuing insurance policies |
| `broker` | Insurance broker managing or distributing insurance products |
| `agent_network` | Independent agency or agency network |
| `tpa` | Third-Party Administrator handling claims or insurance services |
| `reinsurer` | Reinsurance organization |
| `marketplace_operator` | Insurance marketplace or aggregator |
| `enterprise` | Large enterprise customer requiring a customized deployment |

These values reflect the broader InsureIQ ecosystem, which is designed to support insurers and eventually brokers, TPAs, reinsurers, and marketplace participants.

---

## `status`

Defines the tenant lifecycle.

| Value | Description |
|---|---|
| `provisioning` | Tenant is being created and its resources are being provisioned |
| `trial` | Tenant's trial period is active |
| `active` | Tenant is fully operational |
| `suspended` | Tenant is temporarily disabled |
| `archived` | Tenant is inactive but retained |
| `cancelled` | Tenant's subscription/service has permanently ended |

The status history is separately maintained in `tenant_status_history`; therefore, `status` represents the **current state**, not the historical state. fileciteturn6file2

---

# 10. Why `tenant_code` Exists

Although `id` is the primary identifier, UUIDs are unsuitable for many everyday operational activities.

Business users, support engineers, finance teams, and external integrations require a short, human-readable identifier.

Example:

```text
TEN-000245
```

instead of:

```text
4dbe6cb6-cb1e-49d8-b74d-9d...
```

Typical uses include:

- Invoices
- Support tickets
- Audit reports
- Log files
- API integrations
- Administrative dashboards
- Customer-support conversations
- Operational reports

The UUID remains the primary key while `tenant_code` becomes the primary business identifier. fileciteturn6file2

---

# 11. Candidate Keys

| Key Type | Field |
|---|---|
| Primary Key | `id` |
| Alternate / Candidate Key | `tenant_code` |

### Why not use `tenant_name`?

Tenant names are unsuitable as identifiers because:

- Names can change.
- Different organizations can have similar names.
- Legal names can be modified.
- Display names may be localized.
- Names may contain punctuation and spacing.

Therefore:

```text
id          → immutable technical identity
tenant_code → stable business identity
tenant_name → mutable display attribute
```

Future versions may optionally introduce globally unique tenant domains, but domain ownership belongs in the dedicated `tenant_domains` table rather than the root tenant table.

---

# 12. Constraints

| Constraint | Definition | Reason |
|---|---|---|
| Primary Key | `PK(id)` | Provides global tenant identity |
| Unique Tenant Code | `UNIQUE(tenant_code)` | Prevents ambiguous business identifiers |
| Required Name | `tenant_name NOT NULL` | Every tenant requires a display identity |
| Required Type | `tenant_type NOT NULL` | Tenant classification is required |
| Required Email | `primary_email NOT NULL` | Official tenant communication is required |
| Required Timezone | `default_timezone NOT NULL` | Tenant-local operations require timezone context |
| Required Language | `default_language NOT NULL` | Provides deterministic default localization |
| Required Country | `country_code NOT NULL` | Establishes jurisdictional context |
| Required Status | `status NOT NULL` | Tenant must always have a lifecycle state |
| Default Onboarding | `onboarding_completed DEFAULT FALSE` | New tenants should not appear provisioned before onboarding |
| Immutable ID | `id` cannot change | Prevents broken foreign-key references |
| Soft Delete | Do not physically delete operationally | Preserves historical relationships and auditability |
| Timestamp Integrity | `updated_at` must change on updates | Supports change tracking and cache invalidation |

### Additional database-level checks

Where supported:

```sql
CHECK (tenant_code <> '')
CHECK (tenant_name <> '')
CHECK (primary_email <> '')
CHECK (country_code ~ '^[A-Z]{2}$')
```

The exact expression for email validation should generally remain at the application-validation layer rather than attempting to encode full RFC email semantics into a database `CHECK`.

---

# 13. Relationships

## Incoming References

The following Tenant Management tables reference `tenants.id`:

- `tenant_profiles`
- `tenant_addresses`
- `tenant_contacts`
- `tenant_domains`
- `tenant_branding`
- `tenant_settings`
- `tenant_locales`
- `tenant_features`
- `tenant_feature_overrides`
- `tenant_modules`
- `tenant_subscription_plans`
- `tenant_usage_limits`
- `tenant_usage_counters`
- `tenant_status_history`
- `tenant_lifecycle_events`
- `tenant_api_credentials`
- `tenant_oauth_clients`
- `tenant_security_settings`
- `tenant_data_regions`
- `tenant_backup_policies`
- `tenant_integrations`
- `tenant_webhooks`
- `tenant_email_settings`
- `tenant_sms_settings`
- `tenant_storage_settings`
- `tenant_provisioning_logs`

Beyond this module, nearly every major business domain ultimately references the tenant. fileciteturn6file1

Examples include:

```text
Tenant
 ├── Users
 ├── Customers
 ├── Products
 ├── Applications
 ├── Policies
 ├── Claims
 ├── Billing
 ├── Documents
 ├── CRM
 ├── AI
 ├── Reports
 └── Integrations
```

## Outgoing References

None.

`tenants` is the aggregate root and therefore does not depend on subordinate Tenant Management entities.

The exception is that some platform-level implementation metadata may be owned outside this bounded context, but the tenant root itself should remain dependency-light.

---

# 14. Cardinality Analysis

| Entity | Expected Scale |
|---|---:|
| Tenants | 100 – 100,000 |
| Employees per Tenant | 1 – 100,000 |
| Customers per Tenant | Thousands – Millions |
| Policies per Tenant | Millions |
| Claims per Tenant | Millions |
| Documents per Tenant | Tens of Millions |

The `tenants` table itself should remain relatively small compared with almost every other operational table.

The important scaling characteristic is therefore **fan-out**, not row count.

One tenant can own:

```text
1 Tenant
   ↓
100,000 Users
   ↓
Millions of Customers
   ↓
Millions of Policies
   ↓
Millions of Claims
   ↓
Tens of Millions of Documents
```

The expected scale estimates in the existing design reflect this relationship. fileciteturn6file3

---

# 15. Query Patterns

## Resolve Tenant by Primary Key

```sql
SELECT *
FROM tenants
WHERE id = :tenant_id;
```

This is one of the most important queries because authenticated requests commonly need tenant context.

---

## Resolve Tenant by Business Code

```sql
SELECT *
FROM tenants
WHERE tenant_code = :tenant_code;
```

Used by:

- Support
- Administration
- Finance
- Integrations
- Operational tooling

---

## Retrieve Active Tenants

```sql
SELECT id, tenant_code, tenant_name
FROM tenants
WHERE status = 'active';
```

Useful for:

- Platform administration
- Monitoring
- Provisioning
- Reporting

---

## Recently Activated Tenants

```sql
SELECT *
FROM tenants
WHERE activated_at >= NOW() - INTERVAL '30 days';
```

Useful for onboarding and operational analytics.

---

## Tenant Distribution by Status

```sql
SELECT status, COUNT(*)
FROM tenants
GROUP BY status;
```

Useful for platform-level dashboards.

---

## Resolve Tenant During Domain Routing

The actual domain lookup belongs primarily to `tenant_domains`, but the resulting tenant is ultimately resolved to this table:

```sql
SELECT t.*
FROM tenants t
JOIN tenant_domains d
  ON d.tenant_id = t.id
WHERE d.domain_name = :domain
  AND d.verification_status = 'verified'
  AND t.status = 'active';
```

This is important because tenant routing is part of the white-label architecture described in the requirements. fileciteturn5file2

---

# 16. Index Strategy

| Index | Definition | Purpose |
|---|---|---|
| Primary Index | `PK(id)` | Primary tenant lookup |
| Unique Tenant Code | `UNIQUE(tenant_code)` | Business identifier lookup |
| Status Index | `INDEX(status)` | Tenant administration and lifecycle reporting |
| Country Index | `INDEX(country_code)` | Regional reporting and operations |
| Activated Index | `INDEX(activated_at)` | Onboarding and lifecycle reporting |

### Composite indexes

A composite index should not be added automatically merely because a column is frequently queried.

If operational workloads demonstrate a query such as:

```sql
WHERE status = 'active'
AND country_code = :country
```

then:

```text
INDEX(status, country_code)
```

can be introduced.

The initial design should avoid unnecessary indexes because this table is relatively small and write simplicity is valuable.

---

# 17. Read / Write Characteristics

| Operation | Volume | Notes |
|---|---|---|
| Reads | Moderate–High | Tenant context is frequently resolved |
| Writes | Very Low | New tenants are created relatively infrequently |
| Updates | Low | Mostly lifecycle and organizational changes |
| Deletes | Extremely Rare | Tenant records should normally be archived |
| Status Changes | Low | Usually tied to lifecycle events |
| Bulk Writes | Extremely Rare | Tenant creation is transactional and controlled |

### Operational characteristic

Although tenant count may eventually reach tens of thousands, the table remains tiny relative to:

- policies
- claims
- customers
- documents
- transactions
- audit records

The performance priority is therefore **fast indexed lookup and reliable availability**, not massive write throughput.

---

# 18. Caching Strategy

`tenants` is an excellent caching candidate.

### Redis Key

```text
tenant:{tenant_id}
```

### Cached Data

Appropriate cache candidates include:

```text
tenant_id
tenant_code
tenant_name
tenant_type
status
default_timezone
default_language
country_code
```

Configuration that belongs in other tables should generally be cached separately.

For example:

```text
tenant:{id}
tenant-branding:{id}
tenant-settings:{id}
tenant-modules:{id}
tenant-security:{id}
```

This prevents invalidating an entire tenant configuration object when only one subordinate configuration changes.

### Cache Invalidation

Invalidate when:

- Tenant name changes
- Tenant status changes
- Tenant type changes
- Default timezone changes
- Default language changes
- Country changes
- Tenant is archived
- Tenant is reactivated

The existing design identifies `tenant:{tenant_id}` as the core tenant metadata cache key. fileciteturn6file1

---

# 19. Security Considerations

The `tenants` table forms the **highest security boundary** of InsureIQ.

A failure in tenant resolution can result in catastrophic cross-tenant data exposure.

### Tenant Isolation

Every tenant-scoped request should establish an immutable tenant context:

```text
Authenticated Principal
        ↓
Tenant Context
        ↓
Authorization
        ↓
Business Query
        ↓
tenant_id restriction
```

Application code must never allow an arbitrary client-provided `tenant_id` to override the authenticated tenant context.

---

### Authorization

Tenant-level administrators may manage their own tenant but must not be able to:

- Read another tenant.
- Modify another tenant.
- Change another tenant's configuration.
- Access another tenant's credentials.
- Change another tenant's subscription.

Platform-level InsureIQ administrators have broader privileges, but these must still be explicitly controlled and audited.

---

### Database-Level Isolation

Where PostgreSQL shared-table tenancy is used, Row-Level Security (RLS) is a strong defense-in-depth mechanism.

Conceptually:

```sql
CREATE POLICY tenant_isolation
ON some_tenant_scoped_table
USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

The exact implementation depends on the final deployment architecture.

---

### Data Residency

The tenant's `country_code` establishes jurisdictional context, while `tenant_data_regions` stores actual residency and infrastructure policy.

This separation is important:

```text
tenants.country_code
        ↓
Business / jurisdiction identity

tenant_data_regions
        ↓
Infrastructure / residency policy
```

---

### Sensitive Information

`registration_number` and `tax_identifier` may contain sensitive organizational information.

They should therefore receive:

- RBAC restrictions
- Audit logging
- Encryption at rest
- Restricted API exposure
- Masking where appropriate

---

# 20. Audit Requirements

The tenant root should generate auditable lifecycle events.

| Event | Trigger | Important Payload | Purpose |
|---|---|---|---|
| `TenantCreated` | New tenant created | tenant ID, tenant code, tenant type, actor, timestamp | Establish tenant provenance |
| `TenantUpdated` | Core tenant information changes | changed fields, actor, timestamp | Track administrative changes |
| `TenantActivated` | Tenant becomes operational | tenant ID, activation timestamp, actor | Establish production activation |
| `TenantSuspended` | Tenant is suspended | reason, actor, timestamp | Security/commercial traceability |
| `TenantArchived` | Tenant is archived | reason, actor, timestamp | Preserve lifecycle history |
| `TenantCancelled` | Subscription/service cancelled | cancellation reason, actor, timestamp | Commercial and regulatory traceability |
| `TenantReactivated` | Archived/suspended tenant restored | actor, timestamp, previous status | Track restoration |

These events complement, rather than replace, `tenant_status_history`.

The existing tenant design identifies the corresponding lifecycle events. fileciteturn6file3

---

# 21. Event Producers / Event Consumers

## Event Producers

Events concerning the tenant can originate from:

```text
Platform Administration
        ↓
Tenant Provisioning
        ↓
Billing / Subscription
        ↓
Security Operations
        ↓
API Administration
        ↓
Migration / Deployment Operations
```

Examples:

- `TenantCreated`
- `TenantUpdated`
- `TenantActivated`
- `TenantSuspended`
- `TenantArchived`
- `TenantCancelled`

---

## Event Consumers

| Consumer | Why It Consumes Tenant Events |
|---|---|
| Identity Service | Creates and restricts tenant users |
| Subscription Service | Establishes commercial relationship |
| Billing Service | Associates billing with tenant |
| Workflow Engine | Enables tenant workflows |
| Notification Service | Sends tenant lifecycle notifications |
| Reporting Service | Includes/excludes tenant data |
| AI Platform | Determines tenant model availability |
| Provisioning Service | Creates infrastructure |
| Monitoring Service | Tracks tenant health |
| Audit Service | Records lifecycle changes |
| Storage Manager | Provisions tenant storage |
| Integration Service | Enables tenant integrations |

The existing design identifies the principal consumers as Identity, Subscription, Billing, Workflow, Notification, Reporting, AI, Provisioning, and Monitoring services. fileciteturn6file3

---

# 22. Alternative Designs Considered

| Option | Description | Verdict |
|---|---|---|
| A | Single-tenant application | **Rejected** — Does not satisfy the SaaS requirement |
| B | Store tenant information inside user records | **Rejected** — Makes organizational ownership and isolation fragile |
| C | No aggregate root; use independent configuration tables | **Rejected** — Makes provisioning and ownership ambiguous |
| **D** | Dedicated `tenants` aggregate root | **Chosen** |

### Why Option D is chosen

A dedicated tenant root provides:

- Explicit ownership.
- Deterministic tenant resolution.
- Central lifecycle management.
- Consistent foreign-key relationships.
- Strong tenant isolation.
- Subscription ownership.
- Configuration ownership.
- Provisioning orchestration.
- Regulatory traceability.
- Future compatibility with separate database/schema deployments.

This is particularly important because the InsureIQ requirements explicitly require multi-tenant architecture from the beginning rather than retrofitting tenancy later. fileciteturn6file18

---

# 23. Final Design Assessment

| Attribute | Rating |
|---|---|
| Complexity | Medium |
| Read Volume | Moderate–High |
| Write Volume | Very Low |
| Security Importance | **Maximum** |
| Business Criticality | **Maximum** |
| Scalability | Excellent |
| Regulatory Importance | **Critical** |
| Recommended Status | **Core Table — Mandatory** |

## Overall Assessment

The `tenants` table is the **root entity of the entire InsureIQ platform**.

It is not merely an organization lookup table. It establishes the ownership, security, lifecycle, commercial, operational, and regulatory boundary around every insurer using InsureIQ.

Its design must therefore remain deliberately small, stable, highly indexed, heavily audited, and extremely well protected.

The most important invariant is:

```text
One tenant
    ↓
Owns its operational data
    ↓
Owns its configuration
    ↓
Owns its users
    ↓
Owns its commercial relationship
    ↓
Cannot access another tenant's data
```

This table should be considered **foundational infrastructure**, not ordinary business data. fileciteturn6file3

**Step 3 — `tenants` is complete.**

The next step is **Step 4: package this exact documentation into Markdown file(s)**.