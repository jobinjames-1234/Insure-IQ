# Step 3 — Table 3: `tenant_addresses`

The `tenant_addresses` table represents the **physical and mailing locations associated with a tenant**.

The existing InsureIQ schema inventory explicitly defines `tenant_addresses` as the third table in the Tenant Management module, with the purpose of storing **physical and mailing addresses**. fileciteturn5file1

The existing design also establishes that insurers may require multiple address types—including registered offices, headquarters, regional branches, billing addresses, mailing addresses, claims offices, and customer-service locations—and that these addresses belong to the Tenant aggregate. fileciteturn6file4

---

# 1. Why This Table Exists

Insurance organizations frequently maintain **multiple addresses for different business purposes**.

A single address embedded inside the `tenants` table is therefore insufficient.

An insurer may have:

- Registered legal office
- Corporate headquarters
- Regional branch offices
- Billing address
- Mailing address
- Claims processing center
- Customer service office
- Operational office
- International office
- Other business locations

For example:

```text
ABC Insurance
│
├── Registered Office
│      Mumbai
│
├── Headquarters
│      Mumbai
│
├── Claims Office
│      Pune
│
├── Regional Branch
│      Delhi
│
└── Customer Service Center
       Bengaluru
```

The `tenant_addresses` table normalizes these locations and allows a tenant to maintain an arbitrary number of addresses.

The source design explicitly identifies the purpose of this table as normalization of address information, support for multiple address types, and future expansion without modifying the core tenant record. fileciteturn6file4

Without this table:

- Multiple addresses would be difficult to represent.
- The root `tenants` table would become increasingly wide.
- Regulatory and operational addresses could become mixed together.
- Address history would become harder to manage.
- International address formats would be difficult to support.
- Billing and mailing workflows would lack a clean address entity.

---

# 2. Business Definition

A **Tenant Address** represents a physical or mailing location associated with an organization using InsureIQ.

Each address describes a specific business location or correspondence destination.

Examples:

- Registered Office
- Headquarters
- Billing Address
- Mailing Address
- Claims Office
- Customer Support Center

The source design explicitly defines a tenant address as a physical or mailing address associated with a tenant organization. fileciteturn6file4

A Tenant Address is **not**:

- The tenant itself.
- A contact person.
- A billing transaction.
- A payment method.
- A branding configuration.
- A security object.
- A standalone organization.

Instead, it is a reusable **location entity owned by a tenant**.

---

# 3. Critical Design Principle — What the Entity IS and IS NOT

## The Tenant Address IS

- A physical location belonging to a tenant.
- A mailing destination belonging to a tenant.
- Business address information.
- A child entity within the Tenant aggregate.
- A potentially reusable location for multiple tenant business processes.

## The Tenant Address IS NOT

- A tenant.
- A contact person.
- A user.
- A customer.
- An invoice.
- A payment account.
- A billing configuration.
- A geographic master-data entity.
- A standalone organization.

A tenant may own **multiple addresses**. fileciteturn6file0

This distinction becomes especially important later when Billing, Claims, Customer Management, and Marketplace modules need addresses.

---

# 4. Aggregate Root Analysis — DDD Structure

```text
Tenant
│
├── Tenant Addresses
│      │
│      ├── Registered Office
│      ├── Headquarters
│      ├── Billing Address
│      ├── Mailing Address
│      ├── Claims Office
│      ├── Customer Service Office
│      └── Branch Office
│
├── Tenant Profile
├── Tenant Contacts
├── Tenant Domains
├── Tenant Branding
├── Tenant Settings
├── Tenant Locales
├── Tenant Features
└── ...
```

The `Tenant` remains the **Aggregate Root**.

`tenant_addresses` is a subordinate entity within the Tenant Management bounded context.

The source design explicitly places tenant addresses underneath the Tenant aggregate and states that they cannot exist independently. fileciteturn6file0

### Aggregate invariant

A tenant address must always belong to a tenant:

```text
tenant_addresses.tenant_id
        ↓
tenants.id
```

Therefore `tenant_id` is mandatory.

---

# 5. Business Capabilities Supported

| Capability | Supported |
|---|---|
| Multiple business addresses | Yes |
| Registered office management | Yes |
| Headquarters management | Yes |
| Branch office management | Yes |
| Billing correspondence | Yes |
| Mailing address management | Yes |
| Claims office management | Yes |
| Customer-service office management | Yes |
| Regional office management | Yes |
| International operations | Yes |
| Regulatory address management | Yes |
| Address classification | Yes |
| Primary address designation | Yes |
| Geographic coordinates | Optional |
| Address history | Through audit/history mechanism |
| Contact person management | No — `tenant_contacts` |
| Payment/billing account management | No — Billing domain |

These capabilities are consistent with the existing table design, which specifically identifies regulatory compliance, billing correspondence, claims offices, regional operations, international operations, and branch management as supported capabilities. fileciteturn6file0

---

# 6. Multi-Tenant / Ownership / Isolation Notes

Every address belongs to **exactly one tenant**.

The ownership model is:

```text
Tenant A
│
├── Address A1
├── Address A2
└── Address A3

Tenant B
│
├── Address B1
└── Address B2
```

Tenant A must never be able to access Tenant B's addresses.

The primary query pattern should therefore always derive the tenant from the authenticated context:

```sql
SELECT *
FROM tenant_addresses
WHERE tenant_id = :authenticated_tenant_id;
```

rather than allowing a user to freely supply an arbitrary `tenant_id`.

### Tenant isolation

The table remains compatible with the InsureIQ tenancy strategies:

```text
Shared PostgreSQL
      ↓
tenant_id + RLS

OR

Dedicated PostgreSQL Schema
      ↓
tenant-specific isolation

OR

Dedicated Database
      ↓
physical tenant isolation
```

The broader requirements explicitly require strict tenant isolation and allow separate PostgreSQL schemas or fully separate databases depending on insurer size and compliance requirements. fileciteturn5file13

---

# 7. Lifecycle

## Creation

A tenant's primary address can be created during tenant onboarding.

```text
Tenant Created
      ↓
Tenant Profile Created
      ↓
Primary Address Added
      ↓
Other Tenant Configuration
      ↓
Tenant Activated
```

A tenant may initially have one address and acquire additional addresses later.

---

## Growth / Usage

As the organization expands:

```text
Business Expansion
       ↓
New Regional Office
       ↓
New Tenant Address
```

For example:

```text
Tenant
│
├── Mumbai Headquarters
├── Delhi Branch
├── Bengaluru Branch
├── Chennai Branch
└── Hyderabad Claims Center
```

The source design explicitly identifies this lifecycle: business expansion results in additional offices and therefore additional address records. fileciteturn6file4

---

## Modification

An office can relocate or change its postal information.

Example:

```text
Old Headquarters
       ↓
Office Relocated
       ↓
Address Updated
```

The current address should represent the current operational state.

Historical changes should be captured through audit/history mechanisms rather than creating unnecessary duplicate active addresses. fileciteturn6file4

---

## Deactivation

A branch can close while the tenant remains active.

Therefore, address lifecycle should ideally support:

```text
active
inactive
archived
```

This is preferable to deleting the address because historical records may still refer to the location.

---

## Tenant Suspension

When a tenant is suspended:

```text
Tenant → Suspended
        ↓
Addresses → Retained
```

The addresses should not be deleted.

---

## Tenant Archival

When a tenant is archived:

```text
Tenant Archived
       ↓
Tenant Addresses Retained
       ↓
Restricted / Read-only
```

The existing design states that tenant addresses should inherit the lifecycle of the parent tenant. fileciteturn6file4

---

# 8. Proposed Schema

## Table Name

`tenant_addresses`

## Primary Key Strategy

**UUID**

Unlike `tenant_profiles`, this entity requires its own identity because one tenant can own many address records.

```text
Tenant
│
├── Address UUID 1
├── Address UUID 2
├── Address UUID 3
└── Address UUID N
```

Therefore:

```text
id UUID PRIMARY KEY
```

is the appropriate design.

---

## Schema Definition

| Field Name | Data Type | Key | Specification | Reason Field Exists |
|---|---|---|---|---|
| `id` | UUID | PK | `NOT NULL` | Globally unique identifier for the address record |
| `tenant_id` | UUID | FK → `tenants.id` | `NOT NULL` | Identifies the tenant that owns the address |
| `address_type` | ENUM | — | `NOT NULL` | Defines the business purpose of the address |
| `address_line_1` | VARCHAR(255) | — | `NOT NULL` | Primary street/building address |
| `address_line_2` | VARCHAR(255) | — | `NULL` | Secondary address information such as suite, floor, unit, or landmark |
| `city` | VARCHAR(150) | — | `NOT NULL` | City/locality |
| `state_province` | VARCHAR(150) | — | `NULL` | State, province, territory, or equivalent administrative region |
| `postal_code` | VARCHAR(30) | — | `NULL` | Postal or ZIP code |
| `country_code` | CHAR(2) | — | `NOT NULL` | ISO country identifier |
| `is_primary` | BOOLEAN | — | `NOT NULL DEFAULT FALSE` | Identifies the tenant's primary address |
| `latitude` | DECIMAL(10,7) | — | `NULL` | Optional geographic latitude |
| `longitude` | DECIMAL(10,7) | — | `NULL` | Optional geographic longitude |
| `is_active` | BOOLEAN | — | `NOT NULL DEFAULT TRUE` | Indicates whether the address is currently active |
| `valid_from` | TIMESTAMPTZ | — | `NULL` | Effective start date of the address |
| `valid_to` | TIMESTAMPTZ | — | `NULL` | Optional end date for the address |
| `created_at` | TIMESTAMPTZ | — | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Records address creation |
| `updated_at` | TIMESTAMPTZ | — | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Records latest modification |
| `archived_at` | TIMESTAMPTZ | — | `NULL` | Records when the address was archived |

The existing source schema explicitly establishes the core fields `id`, `tenant_id`, `address_type`, address lines, city, state/province, postal code, country code, primary designation, latitude, longitude, and timestamps. fileciteturn6file0

The additional lifecycle fields above are a **design refinement** intended to make historical address management production-grade rather than deleting or overwriting business locations.

### Important distinction

`is_primary` does not mean:

> "This is the only address."

It means:

> "This is the currently designated primary address for this particular address purpose/tenant."

That distinction becomes important when multiple address types exist.

---

# 9. Enum Definitions

## `address_type`

The source design specifies the following address types: registered office, headquarters, billing, mailing, branch, claims office, customer service, and other. fileciteturn6file17

| Value | Description |
|---|---|
| `registered_office` | Legally registered organizational address |
| `headquarters` | Primary corporate headquarters |
| `billing` | Address used for billing correspondence |
| `mailing` | General correspondence address |
| `branch` | Regional or local branch office |
| `claims_office` | Claims processing or claims administration location |
| `customer_service` | Customer service or support center |
| `other` | Other recognized business location |

### Important modeling rule

`address_type` describes the **purpose** of an address.

It does not describe the physical geography.

For example:

```text
address_type = branch
city = Bengaluru
```

means:

> This is a branch office located in Bengaluru.

---

# 10. Why `address_type` Exists

Without `address_type`, the database could contain:

```text
Address 1
Address 2
Address 3
Address 4
```

but the application would not know which one represents:

- Registered office
- Billing office
- Headquarters
- Claims center
- Mailing location

The type therefore converts an otherwise generic postal record into a **business-meaningful location**.

It also enables queries such as:

```sql
SELECT *
FROM tenant_addresses
WHERE tenant_id = :tenant_id
  AND address_type = 'billing';
```

or:

```sql
SELECT *
FROM tenant_addresses
WHERE tenant_id = :tenant_id
  AND address_type = 'registered_office';
```

### Why not make every address type a separate table?

That would result in:

```text
tenant_registered_addresses
tenant_billing_addresses
tenant_mailing_addresses
tenant_branch_addresses
tenant_claims_addresses
...
```

This would duplicate the same address structure repeatedly.

A single normalized table with an `address_type` classification is substantially more maintainable.

---

# 11. Candidate Keys

| Key Type | Field(s) | Rationale |
|---|---|---|
| Primary Key | `id` | Unique identity of the address record |
| Candidate Key | `(tenant_id, id)` | Naturally tenant-scoped but redundant because `id` is globally unique |
| Potential Business Key | `(tenant_id, address_type, address_line_1, city, country_code)` | Could detect duplicate addresses but should not generally be enforced |
| Operational Candidate Key | `(tenant_id, address_type, is_primary)` | Useful for enforcing one primary address per relevant type |

### Important decision

The actual address text should **not** be used as a strict unique key.

Reasons:

- Addresses can be formatted differently.
- Postal standards vary by country.
- Building names can change.
- Abbreviations can differ.
- Two legitimate business locations can share an address.
- International addresses have different structures.

Therefore:

```text
UNIQUE(address_line_1, city, ...)
```

would be overly restrictive.

---

# 12. Constraints

| Constraint | Definition | Reason |
|---|---|---|
| Primary Key | `PK(id)` | Unique address identity |
| Tenant FK | `tenant_id → tenants.id` | Every address belongs to a tenant |
| Address Type Required | `address_type NOT NULL` | Every address needs a business purpose |
| Address Line Required | `address_line_1 NOT NULL` | Minimum physical/mailing address |
| City Required | `city NOT NULL` | Required geographic locality |
| Country Required | `country_code NOT NULL` | Required international geographic context |
| Primary Default | `is_primary DEFAULT FALSE` | Prevents accidental multiple primary addresses |
| Active Default | `is_active DEFAULT TRUE` | New addresses become active |
| Latitude Range | `-90 <= latitude <= 90` | Valid geographic coordinate |
| Longitude Range | `-180 <= longitude <= 180` | Valid geographic coordinate |
| Validity Period | `valid_to >= valid_from` | Prevents invalid address periods |
| Tenant Ownership | FK with appropriate delete rule | Prevents orphaned addresses |
| Soft Archive | Prefer archival over deletion | Preserves historical references |

### One-primary-address constraint

If the business rule is:

> A tenant can have only one primary address overall.

then PostgreSQL can enforce:

```sql
CREATE UNIQUE INDEX uq_tenant_primary_address
ON tenant_addresses (tenant_id)
WHERE is_primary = TRUE
  AND is_active = TRUE;
```

However, this may be too restrictive.

A more flexible model is:

```text
One primary registered office
One primary billing address
One primary mailing address
One primary headquarters
...
```

In that case:

```sql
CREATE UNIQUE INDEX uq_tenant_primary_address_type
ON tenant_addresses (tenant_id, address_type)
WHERE is_primary = TRUE
  AND is_active = TRUE;
```

The second approach is generally more appropriate for InsureIQ.

---

# 13. Relationships

## Incoming References

Potential consumers of `tenant_addresses` include:

- Tenant Administration
- Billing
- Compliance
- Document Generation
- Notifications
- Reporting
- Tenant onboarding
- Customer-service operations
- Claims administration
- Marketplace-facing tenant information

Other tables should reference `tenant_addresses.id` when they specifically need a **particular tenant location**.

For example:

```text
Invoice
   ↓
billing_address_id
   ↓
tenant_addresses.id
```

rather than copying the entire address into the invoice's tenant address relationship.

However, financial documents may need an **immutable address snapshot**, which belongs in the Billing domain rather than relying indefinitely on the mutable current address.

---

## Outgoing References

### `tenant_id`

```text
tenant_addresses.tenant_id
        ↓
tenants.id
```

Mandatory ownership relationship.

---

# 14. Cardinality Analysis

| Relationship | Expected Cardinality |
|---|---:|
| Tenant → Addresses | 0..N |
| Address → Tenant | Exactly 1 |
| Tenant → Primary Address | 0..N depending on address-type rule |
| Tenant → Active Addresses | 0..N |
| Tenant → Registered Office | 0..1 recommended |
| Tenant → Headquarters | 0..1 recommended |
| Tenant → Billing Address | 0..1 primary recommended |
| Tenant → Mailing Address | 0..1 primary recommended |
| Tenant → Branches | 0..N |
| Tenant → Claims Offices | 0..N |

### Expected scale

The tenant count may eventually reach:

```text
100,000 tenants
```

while a large enterprise tenant may have:

```text
1
to
thousands
```

of physical locations.

Therefore an approximate platform-wide range might be:

```text
100,000 tenants
×
1–100 addresses
```

with exceptional enterprise tenants producing substantially more.

The table remains relatively small compared with policies, claims, documents, and transactions.

---

# 15. Query Patterns

## Retrieve All Tenant Addresses

```sql
SELECT *
FROM tenant_addresses
WHERE tenant_id = :tenant_id
  AND is_active = TRUE
ORDER BY address_type, city;
```

---

## Retrieve Primary Address

```sql
SELECT *
FROM tenant_addresses
WHERE tenant_id = :tenant_id
  AND is_primary = TRUE
  AND is_active = TRUE;
```

If primary addresses are type-specific:

```sql
SELECT *
FROM tenant_addresses
WHERE tenant_id = :tenant_id
  AND address_type = :address_type
  AND is_primary = TRUE
  AND is_active = TRUE;
```

---

## Retrieve Billing Address

```sql
SELECT *
FROM tenant_addresses
WHERE tenant_id = :tenant_id
  AND address_type = 'billing'
  AND is_primary = TRUE
  AND is_active = TRUE;
```

---

## Retrieve Registered Office

```sql
SELECT *
FROM tenant_addresses
WHERE tenant_id = :tenant_id
  AND address_type = 'registered_office'
  AND is_primary = TRUE
  AND is_active = TRUE;
```

---

## Find Addresses in a Country

```sql
SELECT *
FROM tenant_addresses
WHERE country_code = :country_code
  AND is_active = TRUE;
```

Useful for:

- Regional administration
- Compliance reporting
- Operations
- Localization

---

## Find Tenant Branches

```sql
SELECT *
FROM tenant_addresses
WHERE tenant_id = :tenant_id
  AND address_type = 'branch'
  AND is_active = TRUE;
```

---

## Find Currently Valid Addresses

```sql
SELECT *
FROM tenant_addresses
WHERE tenant_id = :tenant_id
  AND is_active = TRUE
  AND (
      valid_from IS NULL
      OR valid_from <= CURRENT_TIMESTAMP
  )
  AND (
      valid_to IS NULL
      OR valid_to >= CURRENT_TIMESTAMP
  );
```

---

# 16. Index Strategy

| Index | Definition | Purpose |
|---|---|---|
| Primary Index | `PK(id)` | Direct address lookup |
| Tenant Index | `INDEX(tenant_id)` | Retrieve all addresses for a tenant |
| Tenant + Type | `INDEX(tenant_id, address_type)` | Retrieve specific address categories |
| Tenant + Active | `INDEX(tenant_id, is_active)` | Retrieve current tenant locations |
| Country | `INDEX(country_code)` | Regional filtering |
| Parent + Type | Composite where needed | Address administration |
| Primary Partial Index | `(tenant_id, address_type)` WHERE `is_primary = TRUE` | Fast primary-address resolution |

### Recommended high-value index

```sql
CREATE INDEX idx_tenant_addresses_tenant_type
ON tenant_addresses (tenant_id, address_type);
```

This directly supports common queries such as:

```sql
WHERE tenant_id = ?
AND address_type = ?
```

### Primary-address index

```sql
CREATE UNIQUE INDEX uq_tenant_primary_address_type
ON tenant_addresses (tenant_id, address_type)
WHERE is_primary = TRUE
AND is_active = TRUE;
```

This simultaneously provides:

- Fast lookup.
- Business-rule enforcement.

---

# 17. Read / Write Characteristics

| Operation | Volume | Notes |
|---|---|---|
| Reads | Moderate | Administration, billing, documents, compliance |
| Inserts | Low | Usually during onboarding or organizational expansion |
| Updates | Low | Address changes are relatively infrequent |
| Deletes | Extremely Rare | Prefer archival |
| Activations | Low | New offices becoming operational |
| Deactivations | Low | Offices closing or relocating |
| Bulk Reads | Moderate | Administration/reporting |
| Bulk Writes | Low | Possible during enterprise address imports |

This is a **low-write, read-oriented reference/business table**.

It is not expected to experience the transactional volume of:

- policy transactions
- claims
- payments
- customer activity
- audit events

---

# 18. Caching Strategy

Tenant addresses are suitable for caching because they change relatively infrequently.

Recommended Redis key:

```text
tenant-addresses:{tenant_id}
```

For a frequently accessed primary address:

```text
tenant-primary-address:{tenant_id}:{address_type}
```

Example:

```text
tenant-primary-address:abc123:billing
```

### Cached data

The cache may contain:

```json
{
  "id": "uuid",
  "address_type": "headquarters",
  "address_line_1": "123 Example Road",
  "address_line_2": null,
  "city": "Mumbai",
  "state_province": "Maharashtra",
  "postal_code": "400001",
  "country_code": "IN",
  "is_primary": true
}
```

### Invalidation

Invalidate when:

- Address is created.
- Address is updated.
- Address becomes primary.
- Another address replaces the primary address.
- Address is deactivated.
- Address is archived.

### Important consideration

Do not cache an address indefinitely.

Addresses can change for regulatory, legal, billing, or operational reasons.

---

# 19. Security Considerations

Tenant addresses are not normally highly sensitive personal information, but they can still contain **business-sensitive information**.

For example:

- A claims processing center location.
- A corporate headquarters.
- A restricted operational facility.
- A regulatory office.
- A private enterprise location.

### Tenant isolation

The primary security requirement is:

```text
Authenticated Tenant
        ↓
tenant_id
        ↓
tenant_addresses
```

A user belonging to Tenant A must never retrieve:

```text
Tenant B's addresses
```

through manipulation of:

- URL parameters.
- Query parameters.
- Request bodies.
- GraphQL arguments.
- API filters.

---

### Authorization

Recommended access:

| Actor | Access |
|---|---|
| Platform Super Admin | Full platform-level access |
| Tenant Administrator | Full access to own tenant addresses |
| Authorized Operations User | Read/update according to permission |
| Billing User | Billing-designated addresses |
| Claims User | Claims-designated addresses |
| Ordinary User | Usually read-only or no access |
| B2C Customer | Only addresses intentionally exposed by tenant |

---

### Data Exposure

A tenant address should not automatically become publicly accessible merely because it is stored in this table.

Public exposure should require explicit application logic.

For example:

```text
tenant_addresses
      ↓
Public tenant profile
      ↓
Only approved public fields
```

rather than:

```text
SELECT * FROM tenant_addresses
```

---

### Geographic Coordinates

Latitude and longitude should be treated carefully.

They may expose:

- Exact office location.
- Sensitive facilities.
- Operational centers.

Coordinates should therefore be optional and subject to authorization.

---

# 20. Audit Requirements

Address changes should be auditable because organizational addresses may have:

- Regulatory significance.
- Billing significance.
- Legal significance.
- Operational significance.

## Audit Events

| Event | Trigger | Payload | Purpose |
|---|---|---|---|
| `TenantAddressCreated` | New address created | tenant ID, address ID, type, actor, timestamp | Establish address provenance |
| `TenantAddressUpdated` | Address information changed | changed fields, actor, timestamp | Track modifications |
| `TenantAddressPrimaryChanged` | Primary designation changes | address ID, type, previous/new state | Track operational address selection |
| `TenantAddressActivated` | Address becomes active | address ID, actor, timestamp | Record operational activation |
| `TenantAddressDeactivated` | Address becomes inactive | reason, actor, timestamp | Preserve lifecycle history |
| `TenantAddressArchived` | Address archived | address ID, reason, actor | Historical preservation |

### Example audit payload

```json
{
  "event": "TenantAddressUpdated",
  "tenant_id": "tenant-uuid",
  "address_id": "address-uuid",
  "changed_fields": {
    "postal_code": {
      "old": "400001",
      "new": "400002"
    },
    "address_line_1": {
      "old": "Old Road",
      "new": "New Road"
    }
  },
  "actor_id": "user-uuid",
  "timestamp": "2026-08-15T10:00:00Z"
}
```

### Important principle

Do not rely solely on `updated_at` to reconstruct address history.

`updated_at` tells us **when** something changed.

Audit history tells us:

- What changed.
- Who changed it.
- Why it changed.
- What the previous value was.

---

# 21. Event Producers / Event Consumers

## Event Producers

Address lifecycle events can be produced by:

```text
Tenant Administration
        ↓
Tenant Provisioning
        ↓
Organization Management
        ↓
Compliance Administration
        ↓
Enterprise Data Import
```

Typical producers:

- Tenant onboarding workflow.
- Tenant administrator.
- Platform administrator.
- Enterprise migration/import service.
- Address-management API.

---

## Event Consumers

| Consumer | Purpose |
|---|---|
| Billing Service | Updates billing correspondence location |
| Document Service | Uses address for generated documents |
| Compliance Service | Tracks registered/legal locations |
| Notification Service | Uses mailing/business addresses where applicable |
| Reporting Service | Regional reporting |
| Tenant Administration | Refreshes tenant profile |
| Audit Service | Records address changes |
| Search Service | Updates searchable tenant locations |
| Marketplace | May expose approved public locations |
| Analytics | Regional operational analysis |

### Example workflow

```text
Tenant Address Updated
        ↓
Event Bus
        ↓
┌─────────────┬──────────────┬─────────────┬────────────┐
│             │              │             │            │
Billing    Compliance    Documents     Reporting     Audit
```

Consumers that do not need to participate synchronously should process the event asynchronously.

---

# 22. Alternative Designs Considered

| Option | Description | Verdict |
|---|---|---|
| A | Store one address directly in `tenants` | **Rejected** |
| B | Store all addresses as JSON inside `tenants` | **Rejected as primary design** |
| C | Create separate tables for every address type | **Rejected** |
| D | Use a generic global address table | **Not initially recommended** |
| **E** | Dedicated `tenant_addresses` table | **Chosen** |

## Option A — Address fields inside `tenants`

Example:

```text
tenants
├── address_line_1
├── city
├── state
└── country
```

Rejected because it supports only one location and causes the root tenant entity to become responsible for physical-location concerns.

---

## Option B — JSON Array

Example:

```json
{
  "addresses": [
    {
      "type": "headquarters",
      "city": "Mumbai"
    },
    {
      "type": "branch",
      "city": "Delhi"
    }
  ]
}
```

Rejected as the primary design because it weakens:

- Relational integrity.
- Queryability.
- Indexing.
- Constraints.
- Address-level lifecycle management.
- Auditability.

JSON may still be useful for country-specific extension fields if required.

---

## Option C — Separate Table per Address Type

For example:

```text
tenant_registered_addresses
tenant_billing_addresses
tenant_mailing_addresses
tenant_branch_addresses
tenant_claims_addresses
```

Rejected because all tables would contain substantially the same fields.

This creates:

- Schema duplication.
- More migrations.
- More application code.
- More joins.
- More maintenance.
- More difficult generic address handling.

A normalized table with `address_type` is cleaner.

---

## Option D — Global Address Master

A global address entity could theoretically look like:

```text
addresses
    ↓
address references
    ↓
tenants
users
customers
branches
partners
```

This could become valuable in a much larger platform if address normalization is shared across many domains.

However, introducing it now would create a generalized address abstraction before the requirements establish that need.

The current source design explicitly calls for `tenant_addresses`, so a tenant-scoped table is the safer implementation for the current architecture.

---

## Option E — Dedicated `tenant_addresses`

**Chosen.**

It provides:

- Multiple addresses.
- Strong tenant ownership.
- Address classification.
- Clean relational structure.
- Address-level lifecycle.
- Efficient querying.
- Clear DDD boundaries.
- Future compatibility with geographic extensions.

---

# 23. Final Design Assessment

| Attribute | Rating |
|---|---|
| Complexity | Low–Medium |
| Read Volume | Moderate |
| Write Volume | Low |
| Security Importance | Medium–High |
| Business Criticality | High |
| Regulatory Importance | High |
| Scalability | Excellent |
| Data Volatility | Low |
| Recommended Status | **Core Supporting Table — Mandatory** |

## Overall Assessment

`tenant_addresses` is a relatively simple table structurally, but it is important because it prevents the `tenants` aggregate root from becoming overloaded with physical-location information.

Its fundamental model is:

```text
Tenant
   │
   ├── Address
   ├── Address
   ├── Address
   └── Address
```

with:

```text
tenant_addresses.id
        │
        └── PK

tenant_addresses.tenant_id
        │
        └── FK → tenants.id
```

The most important design decisions are:

1. **One tenant can own many addresses.**
2. **Every address belongs to exactly one tenant.**
3. **`address_type` gives each address business meaning.**
4. **`is_primary` identifies the preferred address without restricting the tenant to a single location.**
5. **Addresses should normally be archived/deactivated rather than physically deleted.**
6. **Tenant isolation must be enforced at every access layer.**
7. **Address history should be auditable.**
8. **The table should remain separate from contacts, billing transactions, and tenant configuration.**

This design preserves the source requirement that tenant organizations can maintain multiple registered, headquarters, billing, mailing, claims, customer-service, and branch locations while keeping the Tenant aggregate clean and scalable. fileciteturn6file4

**Step 3 — `tenant_addresses` is complete.**

The next step is **Step 4 — package this exact documentation into a Markdown file.**