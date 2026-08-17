# Step 3 — Table 2: `tenant_profiles`

The `tenant_profiles` table extends the core `tenants` entity with **business and organizational profile information that is important to operate an insurance organization but does not belong in the tenant identity record itself**.

The separation is deliberate: `tenants` remains a compact, stable aggregate root, while `tenant_profiles` holds extensible organizational attributes that may evolve as InsureIQ supports different insurer types, jurisdictions, regulatory requirements, and enterprise configurations.

---

# 1. Why This Table Exists

The `tenants` table establishes **who the tenant is** at the platform level.

However, an insurance organization has considerably more business information than:

```text
tenant_code
tenant_name
status
country
contact information
```

For example, an insurer may have:

- Legal incorporation information
- Regulatory information
- Organization classification
- Business description
- Number of employees
- Number of branches
- Industry classification
- Year established
- Parent organization
- Regulatory authority
- License information
- Operational profile
- Enterprise size
- Business specialization

Putting all of this directly into `tenants` would make the aggregate root unnecessarily wide and tightly coupled to information that changes independently of tenant identity.

`tenant_profiles` therefore provides a dedicated location for **extended organizational metadata**.

The table exists to preserve a clean separation:

```text
tenants
    ↓
Stable tenant identity + lifecycle
    ↓
tenant_profiles
    ↓
Extended organization/business information
```

This follows the same principle used by the existing tenant design: the root tenant record remains focused while related tenant-specific concerns are represented by dedicated tables.

---

# 2. Business Definition

A **Tenant Profile** represents the extended business identity and organizational characteristics of an organization operating on InsureIQ.

For an insurance company, this can describe:

- What type of organization it is.
- How it is legally constituted.
- When it was established.
- What insurance business it conducts.
- Its organizational size.
- Its regulatory context.
- Its business classification.
- Its parent organization, if applicable.

For example:

```text
Tenant
    SecureLife Insurance

Tenant Profile
    Organization Type:
        Insurance Company

    Legal Name:
        SecureLife Insurance Limited

    Industry:
        Life Insurance

    Established:
        1987

    Employee Count:
        12,500

    Enterprise Size:
        Large

    Regulatory Authority:
        Relevant insurance regulator

    Business Description:
        Life and health insurance provider
```

The profile therefore represents the **business characteristics of the tenant**, rather than the tenant's technical platform configuration.

---

# 3. Critical Design Principle — What the Entity IS and IS NOT

## The Tenant Profile IS

- An extension of a tenant's organizational identity.
- Business metadata about the tenant.
- A tenant-owned entity.
- A place for relatively stable organizational information.
- A separate bounded entity beneath the Tenant aggregate.

## The Tenant Profile IS NOT

- The tenant itself.
- A user profile.
- A customer profile.
- A subscription.
- A billing account.
- A tenant configuration store.
- A regulatory license registry.
- A contact directory.
- A tenant address book.

The distinction is important because several of these concerns deserve their own tables.

For example:

```text
tenant_profiles
    → organizational characteristics

tenant_contacts
    → people / contact points

tenant_addresses
    → physical / mailing addresses

tenant_settings
    → platform configuration

tenant_subscription_plans
    → commercial subscription

tenant_security_settings
    → security policy
```

This prevents `tenant_profiles` from becoming a generic "everything about the tenant" table.

---

# 4. Aggregate Root Analysis — DDD Structure

```text
Tenant
│
├── Tenant Profile
│   │
│   ├── Organization Type
│   ├── Legal Classification
│   ├── Industry Classification
│   ├── Establishment Information
│   ├── Enterprise Size
│   ├── Employee Information
│   ├── Business Description
│   └── Parent Organization
│
├── Tenant Addresses
├── Tenant Contacts
├── Tenant Branding
├── Tenant Settings
├── Tenant Locales
├── Tenant Features
├── Tenant Modules
└── ...
```

`Tenant` remains the **Aggregate Root**.

`tenant_profiles` is a subordinate entity within the Tenant Management bounded context.

The relationship is intentionally close to one-to-one:

```text
Tenant
  │
  │ 1
  │
  ▼
Tenant Profile
```

The profile should not be independently meaningful outside its owning tenant.

### Aggregate invariant

A tenant profile cannot exist without a tenant.

Therefore:

```text
tenant_profiles.tenant_id
        ↓
tenants.id
```

must be a mandatory foreign key.

---

# 5. Business Capabilities Supported

| Capability | Supported |
|---|---|
| Extended organization identity | Yes |
| Legal organization metadata | Yes |
| Industry classification | Yes |
| Enterprise classification | Yes |
| Organization size tracking | Yes |
| Business description | Yes |
| Establishment information | Yes |
| Parent organization representation | Yes |
| Regulatory context | Partially |
| Regulatory license management | No — separate domain |
| Contact management | No — `tenant_contacts` |
| Address management | No — `tenant_addresses` |
| Subscription management | No — subscription tables |
| Platform configuration | No — configuration tables |

The separation is intentional. This table should remain focused on **organizational profile data**, rather than becoming a catch-all tenant configuration table.

---

# 6. Multi-Tenant / Ownership / Isolation Notes

`tenant_profiles` is itself tenant-owned.

Every row belongs to exactly one tenant.

```text
Tenant A
│
└── tenant_profiles
      └── Profile A

Tenant B
│
└── tenant_profiles
      └── Profile B
```

Tenant A must never be able to retrieve Tenant B's profile.

The application should therefore always resolve the profile through the authenticated tenant context.

Example:

```sql
SELECT *
FROM tenant_profiles
WHERE tenant_id = :authenticated_tenant_id;
```

rather than accepting an arbitrary tenant identifier supplied by the client.

### Physical isolation

The same physical tenancy strategies discussed for `tenants` apply:

```text
Shared Database
    ↓
tenant_id + RLS

Dedicated Schema
    ↓
Tenant-specific schema

Dedicated Database
    ↓
Tenant-specific database
```

The table design remains compatible with all three models.

---

# 7. Lifecycle

## Creation

The profile should normally be created as part of tenant provisioning.

```text
Tenant Created
      ↓
Tenant Profile Created
      ↓
Default Configuration
      ↓
Subscription
      ↓
Administrator
      ↓
Tenant Activated
```

A profile should not normally be created independently of its tenant.

---

## Growth / Usage

Profile data changes relatively infrequently.

Typical changes include:

- Legal name change
- Employee count update
- Industry classification update
- Business description update
- Organization size change
- Parent organization change
- Establishment information correction

These changes should not require modification of the tenant's technical identity.

---

## Update

Example:

```text
Tenant
    tenant_name = "ABC Insurance"

Profile
    employee_count = 2,500
```

Several years later:

```text
employee_count = 4,800
```

The tenant identity remains unchanged.

---

## Suspension

Tenant suspension does not require deletion of the profile.

```text
Tenant → suspended
Profile → retained
```

The profile remains available for:

- Administration
- Audit
- Historical reporting
- Support
- Compliance

---

## Archival

When a tenant is archived:

```text
Tenant
   ↓
Archived

Tenant Profile
   ↓
Retained
   ↓
Read-only / restricted access
```

The profile should normally be retained because it provides organizational context for historical records.

---

# 8. Proposed Schema

## Table Name

`tenant_profiles`

## Primary Key Strategy

A dedicated UUID primary key is possible, but for this particular entity a **tenant-scoped one-to-one primary key** is preferable.

### Recommended design

```text
tenant_id UUID PRIMARY KEY
```

The same column therefore acts as:

- Primary Key
- Foreign Key
- Tenant ownership identifier

This enforces the one-to-one relationship at the database level.

```text
tenants
   id
    │
    │ 1 : 1
    ▼
tenant_profiles
   tenant_id
```

This is preferable to introducing another UUID that provides no additional business identity.

---

## Schema Definition

| Field Name | Data Type | Key | Specification | Reason Field Exists |
|---|---|---|---|---|
| `tenant_id` | UUID | PK, FK → `tenants.id` | `NOT NULL`, `ON DELETE RESTRICT` | Identifies the tenant that owns this profile and enforces the one-to-one relationship |
| `organization_type` | ENUM | — | `NOT NULL` | Identifies the organizational nature of the tenant |
| `legal_name` | VARCHAR(255) | — | `NULL` | Stores the organization's formal legal name when different from the tenant display name |
| `registration_number` | VARCHAR(100) | — | `NULL` | Stores the organization's formal registration identifier |
| `industry_code` | VARCHAR(50) | FK/Reference | `NULL` | Identifies the tenant's industry classification |
| `business_description` | TEXT | — | `NULL` | Provides a human-readable description of the organization's business |
| `year_established` | SMALLINT | — | `NULL`, `CHECK` | Records the year the organization was established |
| `employee_count` | INTEGER | — | `NULL`, `CHECK >= 0` | Records approximate organizational workforce size |
| `enterprise_size` | ENUM | — | `NULL` | Classifies the organization by operational size |
| `parent_organization_id` | UUID | FK → `tenants.id` | `NULL` | Represents a parent tenant when organizations belong to a tenant hierarchy |
| `regulatory_authority_name` | VARCHAR(255) | — | `NULL` | Identifies the primary regulatory authority associated with the organization |
| `organization_description` | TEXT | — | `NULL` | Stores a longer organizational profile suitable for administrative and reporting purposes |
| `metadata` | JSONB | — | `NULL` | Provides controlled extensibility for organization-specific non-core attributes |
| `created_at` | TIMESTAMPTZ | — | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | Records profile creation |
| `updated_at` | TIMESTAMPTZ | — | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | Records the most recent profile modification |

### Important design note

`legal_name` appears both conceptually related to the core tenant identity and here in the profile.

The reason for keeping the profile copy separate is that:

```text
tenants.tenant_name
    ↓
Platform-facing display identity

tenant_profiles.legal_name
    ↓
Formal organizational identity
```

If the final implementation determines that legal name is always required for every tenant, it may instead be promoted to `tenants`. However, based on the current domain separation, keeping extended legal/business metadata in the profile is cleaner.

---

# 9. Enum Definitions

## `organization_type`

| Value | Description |
|---|---|
| `insurance_company` | Licensed insurance carrier |
| `broker` | Insurance broker |
| `agent_network` | Agency or agent network |
| `tpa` | Third-party administrator |
| `reinsurer` | Reinsurance organization |
| `marketplace_operator` | Insurance marketplace operator |
| `enterprise` | Other enterprise organization |

The values should ultimately be aligned with the authoritative organization taxonomy established by the platform's Master Data Management domain.

---

## `enterprise_size`

| Value | Description |
|---|---|
| `micro` | Very small organization |
| `small` | Small organization |
| `medium` | Medium-sized organization |
| `large` | Large organization |
| `enterprise` | Very large enterprise organization |

### Important distinction

`enterprise_size` is an **organizational classification**, not a billing plan.

For example:

```text
enterprise_size = large
subscription_plan = professional
```

is entirely valid.

A large organization may be using a lower subscription tier during evaluation, while a smaller organization may purchase an enterprise contract.

---

# 10. Why `tenant_id` Exists as Both PK and FK

This is the most important design decision in this table.

Instead of:

```text
tenant_profiles
----------------
id UUID PK
tenant_id UUID FK UNIQUE
```

the recommended design is:

```text
tenant_profiles
----------------
tenant_id UUID PK + FK
```

### Reason

The business relationship is inherently one-to-one.

A tenant should have:

```text
0..1 Tenant Profile
```

and a tenant profile should belong to:

```text
exactly 1 Tenant
```

Using `tenant_id` as the primary key makes that rule physically enforceable.

It also prevents:

```text
Tenant A
    ↓
Profile 1
Profile 2
Profile 3
```

unless the model is deliberately changed to support profile versioning.

### Additional benefit

Queries become straightforward:

```sql
SELECT *
FROM tenant_profiles
WHERE tenant_id = :tenant_id;
```

No second identifier is required.

---

# 11. Candidate Keys

| Key Type | Field(s) | Rationale |
|---|---|---|
| Primary Key | `tenant_id` | Unique profile per tenant |
| Candidate Key | `tenant_id` | Same as primary identity |
| Potential Business Key | `registration_number` | Only if globally unique within the applicable jurisdiction |
| Potential Composite Candidate Key | `(regulatory_authority_name, registration_number)` | Could identify organizations where registration numbers are authority-scoped |

### Important decision

`registration_number` should **not** automatically be declared globally unique.

Different jurisdictions may use overlapping registration-number formats.

Therefore:

```text
UNIQUE(registration_number)
```

would be unsafe unless the business requirements establish global uniqueness.

---

# 12. Constraints

| Constraint | Definition | Reason |
|---|---|---|
| Primary Key | `PK(tenant_id)` | Enforces one profile per tenant |
| Foreign Key | `tenant_id → tenants.id` | Ensures profile belongs to an existing tenant |
| Required Organization Type | `organization_type NOT NULL` | Every profile requires classification |
| Employee Count | `employee_count >= 0` | Prevents impossible workforce values |
| Establishment Year | Valid historical year | Prevents impossible future/invalid years |
| Parent Tenant | `parent_organization_id → tenants.id` | Maintains organization hierarchy |
| Self-Parent Prevention | `parent_organization_id <> tenant_id` | Prevents direct circular self-reference |
| Timestamps | `created_at`, `updated_at NOT NULL` | Provides lifecycle tracking |
| Soft Deletion | No physical deletion by default | Preserves historical organizational context |

### Establishment year

A reasonable constraint is:

```sql
CHECK (
    year_established IS NULL
    OR year_established BETWEEN 1800 AND EXTRACT(YEAR FROM CURRENT_DATE)
)
```

The exact lower bound should ultimately be determined by supported historical data requirements.

---

# 13. Relationships

## Incoming References

The profile can be referenced by:

- Tenant administration services
- Tenant reporting
- Compliance workflows
- Organization analytics
- Provisioning workflows
- Enterprise onboarding

The database should not create unnecessary foreign keys from every module to `tenant_profiles`.

Most business modules should reference:

```text
tenants.id
```

rather than:

```text
tenant_profiles.tenant_id
```

This preserves `tenants` as the universal ownership root.

---

## Outgoing References

### `tenant_profiles.tenant_id`

```text
tenant_profiles.tenant_id
        ↓
tenants.id
```

Mandatory one-to-one relationship.

### `tenant_profiles.parent_organization_id`

```text
tenant_profiles.parent_organization_id
        ↓
tenants.id
```

Optional hierarchical relationship.

This supports structures such as:

```text
Global Insurance Group
│
├── India Insurance Company
├── UK Insurance Company
└── Singapore Insurance Company
```

Each subsidiary can remain its own tenant while maintaining a parent organizational relationship.

---

# 14. Cardinality Analysis

| Relationship | Expected Cardinality | Explanation |
|---|---:|---|
| Tenant → Profile | 0..1 | Profile may not exist during early provisioning |
| Profile → Tenant | Exactly 1 | Every profile belongs to a tenant |
| Tenant → Parent Organization | 0..1 | A tenant may have no parent |
| Parent Tenant → Child Tenants | 0..N | Enterprise groups may have multiple subsidiaries |
| Profile Rows | Approximately equal to tenant count | Normally one profile per tenant |

### Expected scale

If InsureIQ has:

```text
100,000 tenants
```

the expected profile count is approximately:

```text
0–100,000 profiles
```

This is a very low-volume table compared with:

- customers
- policies
- claims
- transactions
- documents
- audit logs

---

# 15. Query Patterns

## Retrieve Tenant Profile

```sql
SELECT *
FROM tenant_profiles
WHERE tenant_id = :tenant_id;
```

This will be the dominant query.

---

## Retrieve Profile with Tenant Identity

```sql
SELECT
    t.id,
    t.tenant_code,
    t.tenant_name,
    t.status,
    p.organization_type,
    p.legal_name,
    p.employee_count,
    p.enterprise_size
FROM tenants t
LEFT JOIN tenant_profiles p
    ON p.tenant_id = t.id
WHERE t.id = :tenant_id;
```

Useful for administrative dashboards.

---

## Find Large Insurance Organizations

```sql
SELECT
    t.id,
    t.tenant_code,
    t.tenant_name,
    p.employee_count
FROM tenants t
JOIN tenant_profiles p
    ON p.tenant_id = t.id
WHERE p.enterprise_size IN ('large', 'enterprise');
```

---

## Find Organizations by Industry

```sql
SELECT
    t.id,
    t.tenant_code,
    t.tenant_name
FROM tenants t
JOIN tenant_profiles p
    ON p.tenant_id = t.id
WHERE p.industry_code = :industry_code;
```

---

## Find Subsidiaries

```sql
SELECT
    t.id,
    t.tenant_code,
    t.tenant_name
FROM tenants t
JOIN tenant_profiles p
    ON p.tenant_id = t.id
WHERE p.parent_organization_id = :parent_tenant_id;
```

---

## Update Employee Count

```sql
UPDATE tenant_profiles
SET
    employee_count = :employee_count,
    updated_at = CURRENT_TIMESTAMP
WHERE tenant_id = :tenant_id;
```

---

# 16. Index Strategy

| Index | Definition | Purpose |
|---|---|---|
| Primary Key | `PK(tenant_id)` | Fast profile lookup |
| Industry | `INDEX(industry_code)` | Industry filtering |
| Enterprise Size | `INDEX(enterprise_size)` | Organization segmentation |
| Parent Organization | `INDEX(parent_organization_id)` | Hierarchy traversal |
| Organization Type | `INDEX(organization_type)` | Organization classification |
| Employee Count | Optional | Analytical filtering |

### Why employee count should initially be unindexed

Queries such as:

```sql
WHERE employee_count > 10000
```

may eventually justify an index, but this table is expected to be relatively small.

Prematurely adding indexes increases:

- storage
- write cost
- maintenance
- migration complexity

Therefore, add the index only when actual workload demonstrates a requirement.

---

# 17. Read / Write Characteristics

| Operation | Volume | Notes |
|---|---|---|
| Reads | Moderate | Administrative and tenant-context queries |
| Inserts | Very Low | Usually one during tenant provisioning |
| Updates | Low | Organizational metadata changes infrequently |
| Deletes | Extremely Rare | Profile should normally be retained |
| Bulk Updates | Low–Moderate | Possible during organizational data synchronization |
| Analytical Reads | Moderate | Used for tenant segmentation and reporting |

This table is not part of a high-throughput transactional path such as policy issuance or claims processing.

Its workload is primarily:

```text
Administrative
     +
Configuration
     +
Reporting
     +
Compliance
```

---

# 18. Caching Strategy

Tenant profiles are suitable for caching because:

- They are read more frequently than they are changed.
- The data is relatively small.
- Profile changes are infrequent.

A separate cache key is recommended:

```text
tenant-profile:{tenant_id}
```

Example cached object:

```json
{
  "tenant_id": "uuid",
  "organization_type": "insurance_company",
  "legal_name": "ABC Insurance Limited",
  "industry_code": "LIFE",
  "enterprise_size": "large",
  "employee_count": 12500
}
```

### Cache invalidation

Invalidate when:

- Organization type changes
- Legal name changes
- Industry changes
- Employee count changes
- Enterprise classification changes
- Parent organization changes
- Profile metadata changes

The tenant identity cache:

```text
tenant:{tenant_id}
```

should remain independent from:

```text
tenant-profile:{tenant_id}
```

so that profile changes do not unnecessarily invalidate core tenant identity information.

---

# 19. Security Considerations

Although this table normally does not contain policyholder PII, some organizational information can still be sensitive.

### Sensitive Fields

Potentially sensitive fields include:

- `registration_number`
- `employee_count`
- `parent_organization_id`
- `regulatory_authority_name`
- `metadata`

### Access Control

Recommended access:

```text
Tenant Administrator
    ↓
Read / update own profile

Platform Administrator
    ↓
Read / manage tenant profiles

Ordinary Tenant User
    ↓
Read only if explicitly authorized

External Customer
    ↓
No direct access
```

### Tenant Isolation

The most important security rule remains:

```text
Authenticated tenant
       ↓
tenant_id
       ↓
tenant_profiles
```

A tenant administrator must never be able to request:

```text
tenant_profiles
WHERE tenant_id = another_tenant_id
```

by manipulating a request parameter.

### Encryption

If regulatory or contractual requirements classify registration identifiers or other profile attributes as sensitive, encryption or field-level protection may be applied.

### Metadata Security

`metadata` must not become an uncontrolled storage location for:

- passwords
- API secrets
- access tokens
- authentication credentials
- payment credentials
- private keys

Those belong in dedicated secure stores.

---

# 20. Audit Requirements

Profile modifications should be auditable because organizational identity can have regulatory and contractual significance.

| Event | Trigger | Payload | Purpose |
|---|---|---|---|
| `TenantProfileCreated` | Initial profile creation | tenant ID, organization type, actor, timestamp | Establish profile provenance |
| `TenantProfileUpdated` | Profile fields changed | changed fields, actor, timestamp | Track organizational changes |
| `TenantLegalIdentityChanged` | Legal name/registration information changes | previous/new values, actor, timestamp | Compliance traceability |
| `TenantClassificationChanged` | Organization type/size changes | old/new classification, actor | Track organizational classification |
| `TenantParentChanged` | Parent organization changes | previous/new parent, actor | Track corporate hierarchy |
| `TenantProfileArchived` | Profile becomes archived | tenant ID, actor, reason | Historical preservation |

### Audit payload principle

Audit records should store **what changed**, rather than blindly duplicating the entire profile on every update.

Example:

```json
{
  "tenant_id": "uuid",
  "changed_fields": {
    "employee_count": {
      "old": 8200,
      "new": 9100
    },
    "enterprise_size": {
      "old": "large",
      "new": "enterprise"
    }
  },
  "actor_id": "uuid",
  "timestamp": "..."
}
```

This provides a much more useful audit trail.

---

# 21. Event Producers / Event Consumers

## Event Producers

Profile events may originate from:

```text
Tenant Administration
        ↓
Tenant Provisioning
        ↓
Organization Management
        ↓
Compliance Administration
        ↓
Enterprise Data Synchronization
```

Potential events include:

- `TenantProfileCreated`
- `TenantProfileUpdated`
- `TenantClassificationChanged`
- `TenantLegalIdentityChanged`
- `TenantParentChanged`

---

## Event Consumers

| Consumer | Why It Consumes Profile Events |
|---|---|
| Reporting Service | Updates organization reporting dimensions |
| Compliance Service | Detects changes requiring regulatory review |
| Billing Service | May use organization classification for commercial rules |
| Subscription Service | May use enterprise size for plan eligibility |
| Provisioning Service | May adjust infrastructure requirements |
| Analytics Service | Updates tenant segmentation |
| CRM Service | Updates organization metadata |
| Audit Service | Records organizational changes |
| Notification Service | Alerts administrators when required |

### Example workflow

```text
Tenant Profile Updated
        ↓
Event Bus
        ↓
┌──────────────┬───────────────┬──────────────┐
│              │               │              │
Compliance   Analytics     Reporting       Audit
```

Consumers should react asynchronously where possible so that profile updates do not become coupled to unrelated systems.

---

# 22. Alternative Designs Considered

| Option | Description | Verdict |
|---|---|---|
| A | Put every profile field directly into `tenants` | **Rejected** |
| B | Store profile as a JSON document inside `tenants` | **Rejected as primary design** |
| C | Create a generic organization table unrelated to tenants | **Rejected** |
| **D** | Dedicated one-to-one `tenant_profiles` table | **Chosen** |

## Option A — Everything in `tenants`

This would produce a very wide root table:

```text
tenants
├── identity
├── lifecycle
├── legal information
├── organizational information
├── regulatory information
├── configuration
├── branding
├── subscription
└── security
```

Rejected because it violates separation of concerns and makes the aggregate root unnecessarily volatile.

---

## Option B — JSON Profile

Example:

```json
{
  "organization_type": "insurance_company",
  "employee_count": 12000,
  "industry": "life"
}
```

This provides flexibility but weakens:

- relational integrity
- indexing
- type safety
- referential integrity
- reporting consistency
- schema governance

JSONB remains useful for **controlled extension fields**, which is why `metadata` can exist alongside structured columns.

---

## Option C — Generic Organization Entity

A separate organization abstraction could theoretically support:

```text
Organization
├── Tenant
├── Broker
├── TPA
├── Reinsurer
└── Marketplace
```

However, introducing that abstraction at this point would create an additional domain layer not required by the current Tenant Management model.

It should only be introduced if the broader platform requirements establish organization polymorphism as a first-class domain concept.

---

## Option D — Dedicated `tenant_profiles`

Chosen because it provides:

- Clean tenant aggregate boundaries.
- One-to-one ownership.
- Structured fields.
- Relational integrity.
- Extensibility.
- Efficient queries.
- Separation between identity and organizational metadata.
- Compatibility with future tenant types.

---

# 23. Final Design Assessment

| Attribute | Rating |
|---|---|
| Complexity | Medium |
| Read Volume | Moderate |
| Write Volume | Low |
| Security Importance | High |
| Business Criticality | High |
| Regulatory Importance | High |
| Scalability | Excellent |
| Data Volatility | Low–Moderate |
| Recommended Status | **Core Table — Recommended** |

## Overall Assessment

`tenant_profiles` should remain a **focused organizational extension** of the `tenants` aggregate rather than becoming a generalized tenant-data container.

The strongest design characteristics are:

```text
Tenant
  │
  │ 1 : 1
  ▼
Tenant Profile
```

with:

```text
tenant_profiles.tenant_id
        │
        ├── PK
        └── FK → tenants.id
```

This gives the database a direct representation of the business invariant:

> **At most one organizational profile exists for each tenant.**

The table should contain **organizational identity and characteristics**, while separate tables continue to handle:

- addresses,
- contacts,
- branding,
- configuration,
- subscriptions,
- security,
- integrations,
- storage,
- backups,
- domains.

That separation keeps the Tenant aggregate maintainable as InsureIQ expands into a large enterprise SaaS platform.

**Step 3 — `tenant_profiles` is complete.**

The next step is **Step 4 — package this exact documentation into a Markdown file**.