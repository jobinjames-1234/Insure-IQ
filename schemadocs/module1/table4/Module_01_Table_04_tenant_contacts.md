# Step 3 — Table 4: `tenant_contacts`

The `tenant_contacts` table stores **business contact persons and communication details associated with a tenant**.

The InsureIQ module inventory identifies this as Table 4 and defines its purpose as **“Contact persons and communication details.”**

The existing detailed design further defines a Tenant Contact as an individual, department, or shared business contact associated with the tenant, explicitly separating it from a platform user or employee/authentication record.

For the production-grade design, we should preserve that domain boundary while making the schema more explicit about **contact identity, routing, tenant isolation, primary-contact rules, lifecycle, and PII protection**.

---

# 1. Why This Table Exists

Insurance organizations do not have one universal contact person.

Different operational processes need different contacts:

```text
Tenant
│
├── Executive Contact
├── Administrator
├── Finance Contact
├── Compliance Contact
├── Claims Contact
├── Technical Contact
├── Sales Contact
├── Customer Service Contact
└── Legal Contact
```

The existing design specifically identifies examples such as:

- Chief Executive Officer
- Finance Department
- Claims Manager
- Technical Support
- Customer Service

A single `primary_email` and `primary_phone` on `tenants` cannot adequately represent these relationships.

For example:

```text
Billing
   ↓
Finance Contact

Claims
   ↓
Claims Contact

Security
   ↓
Technical Contact

Regulatory Workflow
   ↓
Compliance Contact
```

The `tenant_contacts` table provides a normalized structure for these business communication relationships.

Without this table:

- The `tenants` table would become overloaded.
- Multiple contacts could not be represented cleanly.
- Department-specific communication would become difficult.
- Billing and claims systems would have no canonical contact relationship.
- Compliance communications would be harder to route.
- Contact information would become duplicated across modules.
- Contact history would be harder to audit.

The source design therefore deliberately keeps business contacts separate from the core tenant record.

---

# 2. Business Definition

A **Tenant Contact** represents an individual, department, or shared business contact associated with a tenant organization.

The important distinction is that this entity represents **business communication information**, not authentication.

Examples:

```text
ABC Insurance
│
├── John Mathews
│     Role: Executive
│
├── Finance Department
│     Role: Finance
│
├── Sarah Thomas
│     Role: Claims
│
├── IT Support
│     Role: Technical
│
└── Compliance Department
      Role: Compliance
```

A Tenant Contact may be:

- A named person.
- A department.
- A shared mailbox.
- A functional business contact.
- A role-based contact.

It does **not** necessarily represent a user who can log into InsureIQ.

---

# 3. Critical Design Principle — What the Entity IS and IS NOT

## The Tenant Contact IS

- Business communication metadata.
- A tenant-owned entity.
- A contact-routing target.
- A representation of an operational business contact.
- Potentially a named person.
- Potentially a department/shared contact.
- A child entity within the Tenant Management bounded context.

## The Tenant Contact IS NOT

- A platform user.
- An authentication identity.
- An employee master record.
- A customer.
- A policyholder.
- A role/permission assignment.
- An API credential.
- A subscription contact by definition.

This distinction prevents a dangerous architectural coupling:

```text
Tenant Contact
       ≠
InsureIQ User
```

For example, an insurer might specify:

```text
Claims Contact:
claims@abcinsurance.com
```

without creating an InsureIQ login account for that mailbox.

Likewise:

```text
CEO Contact:
ceo@abcinsurance.com
```

does not mean that the CEO must be an InsureIQ user.

If the person later receives a platform account, the Identity & Access Management module can establish the appropriate relationship separately.

---

# 4. Aggregate Root Analysis — DDD Structure

```text
Tenant
│
├── Tenant Contacts
│      │
│      ├── Executive
│      ├── Administrator
│      ├── Finance
│      ├── Compliance
│      ├── Claims
│      ├── Technical
│      ├── Sales
│      ├── Customer Service
│      └── Legal
│
├── Tenant Profile
├── Tenant Addresses
├── Tenant Domains
├── Tenant Branding
├── Tenant Settings
├── Tenant Locales
├── Tenant Features
├── Tenant Modules
└── ...
```

`Tenant` remains the **Aggregate Root**.

`tenant_contacts` is a collection of child entities owned by that aggregate.

### Aggregate invariant

Every tenant contact must belong to exactly one tenant:

```text
tenant_contacts.tenant_id
        ↓
tenants.id
```

Therefore:

```text
tenant_id NOT NULL
```

is mandatory.

---

# 5. Business Capabilities Supported

| Capability | Supported |
|---|---|
| Business contact management | Yes |
| Department contacts | Yes |
| Executive contacts | Yes |
| Finance contacts | Yes |
| Compliance contacts | Yes |
| Claims contacts | Yes |
| Technical contacts | Yes |
| Sales contacts | Yes |
| Customer-service contacts | Yes |
| Legal contacts | Yes |
| Notification routing | Yes |
| Contact-method preference | Yes |
| Primary contact designation | Yes |
| Contact archival | Yes |
| Contact audit history | Yes |
| User authentication | No — IAM domain |
| Employee management | No — IAM/HR-related domain |
| Customer contact management | No — Customer domain |
| Policyholder communication preferences | No — Customer domain |

---

# 6. Multi-Tenant / Ownership / Isolation Notes

This table contains potentially sensitive business contact information and therefore requires strict tenant isolation.

The ownership model is:

```text
Tenant A
│
├── Finance Contact A
├── Claims Contact A
└── Technical Contact A

Tenant B
│
├── Finance Contact B
└── Claims Contact B
```

Tenant A must never be able to access Tenant B's contacts.

The application should therefore derive tenant context from the authenticated request.

Preferred:

```sql
SELECT *
FROM tenant_contacts
WHERE tenant_id = :authenticated_tenant_id;
```

Not:

```sql
SELECT *
FROM tenant_contacts
WHERE tenant_id = :tenant_id_from_untrusted_request;
```

without validating that the requested tenant is actually authorized.

---

## Row-Level Security

For a shared PostgreSQL deployment, the table should be compatible with RLS:

```sql
CREATE POLICY tenant_contacts_isolation
ON tenant_contacts
USING (
    tenant_id = current_setting('app.tenant_id')::uuid
);
```

The exact RLS implementation depends on the application's connection-pooling and transaction-context architecture.

---

# 7. Lifecycle

## Creation

A tenant's first important contact can be created during onboarding:

```text
Tenant Created
      ↓
Tenant Profile Created
      ↓
Primary Contact Added
      ↓
Tenant Provisioned
```

---

## Growth

As the organization grows:

```text
Department Created
       ↓
Department Contact Required
       ↓
Tenant Contact Created
```

For example:

```text
Initial tenant
    ↓
1 administrator

Growth
    ↓
Finance contact
Claims contact
Compliance contact
Technical contact
Legal contact
```

---

## Modification

Contact information can change:

```text
Finance Contact
      ↓
Email changed
      ↓
Contact Updated
```

or:

```text
Claims Manager
      ↓
Replaced
      ↓
Old Contact Archived
      ↓
New Contact Created
```

The second approach is preferable when the identity of the actual contact person changes, because it preserves historical meaning.

---

## Primary Contact Change

Example:

```text
Old Primary Contact
        ↓
Role reassigned
        ↓
New Primary Contact
```

The database/application must ensure that the business invariant of a single primary contact for the relevant scope is preserved.

---

## Deactivation

A contact may become inactive without deleting historical information.

```text
Contact
   ↓
Inactive
```

This is preferable to physical deletion where the contact appeared in:

- Audit records.
- Notifications.
- Compliance workflows.
- Historical tenant records.

---

## Tenant Archival

When a tenant is archived:

```text
Tenant Archived
      ↓
Tenant Contacts Archived
```

---

# 8. Proposed Schema

## Table Name

`tenant_contacts`

## Primary Key Strategy

**UUID**

Each contact requires an independent identity because a tenant can have multiple contacts.

```text
Tenant
│
├── Contact UUID 1
├── Contact UUID 2
├── Contact UUID 3
└── Contact UUID N
```

Therefore:

```text
id UUID PRIMARY KEY
```

is appropriate.

---

## Schema Definition

| Field Name | Data Type | Key | Specification | Reason Field Exists |
|---|---|---|---|---|
| `id` | UUID | PK | `NOT NULL` | Globally unique identity of the contact record |
| `tenant_id` | UUID | FK → `tenants.id` | `NOT NULL` | Identifies the tenant that owns the contact |
| `contact_name` | VARCHAR(255) | — | `NOT NULL` | Human-readable name of the person or department |
| `contact_role` | ENUM | — | `NOT NULL` | Defines the business responsibility represented by the contact |
| `department` | VARCHAR(150) | — | `NULL` | Identifies the organizational department when applicable |
| `email` | VARCHAR(255) | — | `NULL` | Business email communication channel |
| `phone` | VARCHAR(50) | — | `NULL` | Primary landline/business telephone |
| `mobile` | VARCHAR(50) | — | `NULL` | Mobile communication channel |
| `preferred_contact_method` | ENUM | — | `NOT NULL DEFAULT 'email'` | Defines which communication channel should normally be preferred |
| `is_primary` | BOOLEAN | — | `NOT NULL DEFAULT FALSE` | Identifies the primary contact within the relevant tenant/contact-role scope |
| `notes` | TEXT | — | `NULL` | Additional administrative information |
| `is_active` | BOOLEAN | — | `NOT NULL DEFAULT TRUE` | Indicates whether the contact is currently usable |
| `valid_from` | TIMESTAMPTZ | — | `NULL` | Indicates when the contact became effective |
| `valid_to` | TIMESTAMPTZ | — | `NULL` | Indicates when the contact ceased to be effective |
| `created_at` | TIMESTAMPTZ | — | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Records contact creation |
| `updated_at` | TIMESTAMPTZ | — | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Records most recent modification |
| `archived_at` | TIMESTAMPTZ | — | `NULL` | Records contact archival |

### Production refinement

The additional lifecycle fields are recommended because production insurance systems need to distinguish current contacts from historical contacts without destroying historical records.

---

# 9. Enum Definitions

## `contact_role`

| Value | Description |
|---|---|
| `executive` | Executive or senior organizational contact |
| `administrator` | General administrative contact |
| `finance` | Billing, finance, or accounting contact |
| `compliance` | Regulatory/compliance contact |
| `claims` | Claims operations contact |
| `technical` | IT, technical support, or platform contact |
| `sales` | Sales/business-development contact |
| `customer_service` | Customer-service contact |
| `legal` | Legal department/contact |
| `other` | Other recognized business responsibility |

---

## `preferred_contact_method`

| Value | Description |
|---|---|
| `email` | Email should be preferred |
| `phone` | Landline/business telephone should be preferred |
| `mobile` | Mobile communication should be preferred |

The default is:

```text
email
```

because email is generally the most suitable channel for business communications and provides a durable audit trail.

---

# 10. Why `contact_role` Exists

`contact_role` is one of the most important fields in this table.

Without it:

```text
ABC Insurance
│
├── John
├── Sarah
├── Finance Department
└── Claims Desk
```

would not tell the application **which contact should receive which communication**.

With roles:

```text
Finance
   ↓
Finance Contact

Claims
   ↓
Claims Contact

Compliance
   ↓
Compliance Contact

Technical
   ↓
Technical Contact
```

the system can implement deterministic routing.

---

## Example

Billing workflow:

```text
Invoice Generation
       ↓
tenant_id
       ↓
tenant_contacts
       ↓
contact_role = finance
       ↓
preferred_contact_method
       ↓
Send Invoice
```

Claims workflow:

```text
Claims escalation
       ↓
tenant_id
       ↓
contact_role = claims
       ↓
Claims Contact
```

This is substantially cleaner than hardcoding email addresses into each module.

---

# 11. Candidate Keys

| Key Type | Field(s) | Rationale |
|---|---|---|
| Primary Key | `id` | Unique contact identity |
| Potential Candidate | `(tenant_id, contact_role, is_primary)` | Represents the primary contact within a role |
| Operational Lookup | `(tenant_id, contact_role)` | Efficient role-based contact lookup |
| Potential Contact Identifier | `(tenant_id, email)` | Useful for duplicate detection but should not necessarily be unique |

### Important decision

Do **not** enforce:

```sql
UNIQUE(email)
```

globally.

The same email address may legitimately be used by:

```text
Finance Department
Claims Department
```

or even across organizations as a shared corporate mailbox.

Likewise, a contact may not have an email address at all.

---

# 12. Constraints

| Constraint | Definition | Reason |
|---|---|---|
| Primary Key | `PK(id)` | Unique contact identity |
| Tenant FK | `tenant_id → tenants.id` | Ensures ownership |
| Required Name | `contact_name NOT NULL` | Every contact requires a display name |
| Required Role | `contact_role NOT NULL` | Every contact requires business classification |
| Preferred Method | Default `email` | Deterministic communication behavior |
| Active Default | `is_active DEFAULT TRUE` | Newly created contacts are active |
| Primary Default | `is_primary DEFAULT FALSE` | Prevents accidental primary designation |
| Validity Period | `valid_to >= valid_from` | Prevents invalid effective periods |
| Tenant Isolation | Tenant-scoped access | Prevents cross-tenant exposure |
| Soft Archive | Avoid hard deletion | Preserves historical context |

---

## Primary Contact Constraint

A production PostgreSQL implementation should use a partial unique index:

```sql
CREATE UNIQUE INDEX uq_tenant_primary_contact_role
ON tenant_contacts (tenant_id, contact_role)
WHERE is_primary = TRUE
  AND is_active = TRUE;
```

This means:

```text
Tenant A
Finance
    ↓
Exactly one active primary Finance contact
```

while still allowing:

```text
Tenant A
Finance
    ↓
multiple non-primary contacts
```

---

## Contact Information Constraint

At least one communication method should normally be present.

A possible constraint is:

```sql
CHECK (
    email IS NOT NULL
    OR phone IS NOT NULL
    OR mobile IS NOT NULL
)
```

This prevents meaningless contact records.

However, if the business permits a department placeholder before communication details are known, this should remain an application-level validation rule rather than a hard database constraint.

---

# 13. Relationships

## Incoming References

Potential consumers include:

- Notification Service
- Billing Service
- Claims Service
- CRM
- Compliance Service
- Tenant Administration
- Customer Service
- Document Generation
- Workflow Engine

These systems should normally **read** the canonical contact record.

They should not create duplicate contact records merely because they need to send a message.

---

## Outgoing References

### `tenant_id`

```text
tenant_contacts.tenant_id
        ↓
tenants.id
```

Mandatory.

---

## Optional Identity Relationship

A future production refinement may introduce:

```text
tenant_contacts.user_id
        ↓
users.id
```

but this should **not** be mandatory.

A business contact does not necessarily require an InsureIQ account.

Therefore the relationship, if introduced, should be optional rather than forcing every business contact into the Identity domain.

---

# 14. Cardinality Analysis

| Relationship | Expected Cardinality | Explanation |
|---|---:|---|
| Tenant → Contacts | 1..N | A functioning tenant normally needs one or more contacts |
| Contact → Tenant | Exactly 1 | Every contact is tenant-owned |
| Contacts per Tenant | ~1–100 | Source estimate |
| Primary Contacts | Multiple by role | One active primary per role is recommended |
| Finance Contacts | 0..N | One primary plus additional contacts |
| Claims Contacts | 0..N | May be multiple claims operations contacts |
| Technical Contacts | 0..N | Larger enterprises may have multiple technical contacts |
| Compliance Contacts | 0..N | Regulatory organizations may require multiple contacts |

For a platform with:

```text
100,000 tenants
```

a reasonable baseline range is:

```text
100,000
–
10,000,000
```

contact records, although the actual distribution will likely be heavily skewed toward smaller tenants.

This remains modest relative to high-volume insurance entities such as policies, claims, documents, transactions, and audit events.

---

# 15. Query Patterns

## Retrieve All Tenant Contacts

```sql
SELECT *
FROM tenant_contacts
WHERE tenant_id = :tenant_id
  AND is_active = TRUE
ORDER BY contact_role, contact_name;
```

---

## Retrieve Finance Contact

```sql
SELECT *
FROM tenant_contacts
WHERE tenant_id = :tenant_id
  AND contact_role = 'finance'
  AND is_active = TRUE;
```

---

## Retrieve Primary Finance Contact

```sql
SELECT *
FROM tenant_contacts
WHERE tenant_id = :tenant_id
  AND contact_role = 'finance'
  AND is_primary = TRUE
  AND is_active = TRUE;
```

---

## Retrieve Claims Contact

```sql
SELECT *
FROM tenant_contacts
WHERE tenant_id = :tenant_id
  AND contact_role = 'claims'
  AND is_primary = TRUE
  AND is_active = TRUE;
```

---

## Retrieve Preferred Contact Method

```sql
SELECT
    contact_name,
    email,
    phone,
    mobile,
    preferred_contact_method
FROM tenant_contacts
WHERE tenant_id = :tenant_id
  AND contact_role = :contact_role
  AND is_primary = TRUE
  AND is_active = TRUE;
```

---

## Find All Primary Contacts

```sql
SELECT
    tenant_id,
    contact_role,
    contact_name,
    email
FROM tenant_contacts
WHERE is_primary = TRUE
  AND is_active = TRUE;
```

Useful for platform administration and notification diagnostics.

---

## Find Contacts by Email

```sql
SELECT *
FROM tenant_contacts
WHERE email = :email
  AND is_active = TRUE;
```

This may be useful for support operations, but access to such cross-tenant searches must be restricted to privileged platform operators.

---

## Find Historical Contacts

```sql
SELECT *
FROM tenant_contacts
WHERE tenant_id = :tenant_id
  AND is_active = FALSE
ORDER BY updated_at DESC;
```

---

# 16. Index Strategy

| Index | Definition | Purpose |
|---|---|---|
| Primary Key | `PK(id)` | Direct contact lookup |
| Tenant | `INDEX(tenant_id)` | Retrieve tenant contacts |
| Tenant + Role | `INDEX(tenant_id, contact_role)` | Role-specific lookup |
| Email | `INDEX(email)` | Support/contact lookup |
| Active | `INDEX(is_active)` | Lifecycle filtering |
| Primary Partial | `(tenant_id, contact_role)` WHERE primary | Fast primary-contact resolution |
| Preferred Method | Optional | Communication analytics |

### Recommended primary operational index

```sql
CREATE INDEX idx_tenant_contacts_tenant_role
ON tenant_contacts (tenant_id, contact_role);
```

This directly supports:

```sql
WHERE tenant_id = ?
AND contact_role = ?
```

---

## Recommended primary-contact constraint/index

```sql
CREATE UNIQUE INDEX uq_tenant_primary_contact_role
ON tenant_contacts (tenant_id, contact_role)
WHERE is_primary = TRUE
  AND is_active = TRUE;
```

This is more valuable than a simple:

```text
INDEX(is_primary)
```

because the query is almost always tenant-scoped.

---

## Email index

If email searches are exclusively tenant-scoped:

```sql
CREATE INDEX idx_tenant_contacts_tenant_email
ON tenant_contacts (tenant_id, email);
```

is preferable to a global email index.

---

# 17. Read / Write Characteristics

| Operation | Volume | Notes |
|---|---|---|
| Reads | Moderate–High | Notifications, billing, claims, administration |
| Inserts | Low | Contacts are added infrequently |
| Updates | Low | Contact details change occasionally |
| Deletes | Extremely Rare | Prefer archival |
| Primary Contact Changes | Low | Occur when organizational responsibilities change |
| Bulk Reads | Moderate | Administration and reporting |
| Bulk Writes | Low | Possible during onboarding/import |

The source characterizes the table as:

```text
Reads: Moderate
Writes: Low
```

The production architecture should preserve that expectation.

---

## Why reads may become relatively high

Contact lookup can occur indirectly through communication workflows:

```text
Billing
   ↓
Finance Contact
```

```text
Claims
   ↓
Claims Contact
```

```text
Compliance
   ↓
Compliance Contact
```

Therefore contacts may be read by several services even though they change rarely.

---

# 18. Caching Strategy

The recommended Redis key is:

```text
tenant-contacts:{tenant_id}
```

That is appropriate.

For extremely frequent role-specific access, a more granular key may be useful:

```text
tenant-primary-contact:{tenant_id}:{contact_role}
```

Example:

```text
tenant-primary-contact:abc123:finance
```

### Cached data

The cache should contain only the active contact information required by consumers.

### Cache invalidation

Invalidate when:

- Contact is created.
- Contact is updated.
- Contact role changes.
- Contact becomes primary.
- Another contact becomes primary.
- Contact becomes inactive.
- Contact is archived.

### PII consideration

Because contact records contain PII, cached values should have:

- controlled access,
- reasonable TTL,
- encrypted transport,
- appropriate Redis security,
- no unnecessary replication to uncontrolled environments.

---

# 19. Security Considerations

This table contains **personally identifiable information and business-sensitive communication data**.

Potentially sensitive fields include:

- `contact_name`
- `email`
- `phone`
- `mobile`
- `notes`

---

## Tenant Isolation

The most important security rule is:

```text
Authenticated Tenant
        ↓
tenant_id
        ↓
tenant_contacts
```

Cross-tenant access must be impossible for normal tenant users.

---

## RBAC

Recommended access:

| Actor | Access |
|---|---|
| Platform Super Admin | Full controlled access |
| Tenant Administrator | Manage own tenant contacts |
| Finance User | Read finance contacts |
| Claims User | Read claims contacts |
| Compliance User | Read compliance contacts |
| Technical User | Read technical contacts |
| Ordinary Tenant User | Limited/read-only access |
| External Customer | No access unless explicitly exposed |

---

## PII Protection

Consider:

- Encryption at rest.
- TLS in transit.
- Restricted database permissions.
- Application-level authorization.
- Audit logging.
- Masking in administrative interfaces.
- Controlled export permissions.

Example:

```text
j***@abcinsurance.com
```

may be preferable in some non-privileged administrative views.

---

## Notes Field

Because `notes` is free-form text, administrators may accidentally enter:

- passwords,
- API keys,
- private credentials,
- personal sensitive information.

The UI should therefore warn users that `notes` is not a secure-secret store.

Secrets must go into the dedicated secrets/integration infrastructure.

---

# 20. Audit Requirements

Contact modifications should be auditable because contact changes can affect:

- Billing.
- Claims.
- Regulatory communication.
- Security operations.
- Legal notifications.

## Audit Events

| Event | Trigger | Payload | Purpose |
|---|---|---|---|
| `TenantContactCreated` | New contact created | tenant ID, contact ID, role, actor, timestamp | Establish provenance |
| `TenantContactUpdated` | Contact details changed | changed fields, actor, timestamp | Track modifications |
| `TenantPrimaryContactChanged` | Primary contact changes | role, old contact, new contact, actor | Track routing changes |
| `TenantContactActivated` | Contact becomes active | contact ID, actor | Record activation |
| `TenantContactDeactivated` | Contact becomes inactive | contact ID, reason, actor | Preserve lifecycle |
| `TenantContactArchived` | Contact archived | contact ID, reason, actor | Historical preservation |

For PII changes, avoid unnecessarily duplicating complete personal data into audit records.

Prefer recording:

```text
field changed
old value
new value
actor
timestamp
reason
```

with appropriate protection.

---

# 21. Event Producers / Event Consumers

## Event Producers

Operational producers may include:

```text
Tenant Administration
        ↓
Contact Management API
        ↓
Tenant Onboarding
        ↓
Enterprise Data Import
```

Typical events include:

- `TenantContactCreated`
- `TenantContactUpdated`
- `TenantPrimaryContactChanged`

---

## Event Consumers

| Consumer | Purpose |
|---|---|
| Notification Service | Route operational communications |
| Billing Service | Resolve finance contacts |
| Claims Service | Resolve claims escalation contacts |
| Compliance Service | Resolve regulatory contacts |
| CRM | Synchronize business relationship data |
| Document Service | Resolve recipient information |
| Audit Service | Record changes |
| Search Service | Update searchable tenant metadata |
| Workflow Engine | Route tasks to appropriate contacts |

---

## Example Event Flow

```text
Tenant Contact Updated
        ↓
Event Bus
        ↓
┌────────────┬────────────┬─────────────┬─────────────┐
│            │            │             │             │
Billing    Claims      Compliance    CRM       Notification
```

This avoids synchronous coupling between contact administration and every downstream service.

---

# 22. Alternative Designs Considered

| Option | Description | Verdict |
|---|---|---|
| A | Store contacts directly in `tenants` | **Rejected** |
| B | Store contacts as JSON | **Rejected as primary design** |
| C | Make every contact an IAM user | **Rejected** |
| D | Separate table per contact role | **Rejected** |
| **E** | Dedicated `tenant_contacts` table | **Chosen** |

## Option A — Store Contacts in `tenants`

Rejected because a tenant could eventually require dozens or hundreds of contacts, creating a wide and difficult-to-evolve table.

---

## Option B — JSON Contact Collection

Rejected as the primary design because it weakens:

- relational integrity,
- indexing,
- role constraints,
- primary-contact uniqueness,
- lifecycle management,
- auditability.

---

## Option C — Every Contact Must Be a User

Rejected because a business contact does not necessarily require an InsureIQ account.

For example:

```text
claims@abcinsurance.com
```

may be a shared mailbox.

Creating a platform user solely to represent it would incorrectly mix business contacts with authentication identities.

---

## Option D — Separate Table Per Role

Rejected because every table would largely repeat:

```text
name
email
phone
mobile
department
timestamps
```

This would cause schema duplication and make generic communication routing unnecessarily complicated.

---

## Option E — Dedicated `tenant_contacts`

**Chosen.**

It provides:

- Normalized contact management.
- Multiple contacts per tenant.
- Role-based routing.
- Strong tenant isolation.
- Contact lifecycle.
- Auditability.
- Reusable communication information.
- Separation from authentication.

---

# 23. Final Design Assessment

| Attribute | Rating |
|---|---|
| Complexity | Low–Medium |
| Read Volume | Moderate–High |
| Write Volume | Low |
| Security Importance | High |
| Business Criticality | High |
| Regulatory Importance | High |
| PII Sensitivity | High |
| Scalability | Excellent |
| Data Volatility | Low–Moderate |
| Recommended Status | **Core Supporting Table — Recommended** |

## Overall Assessment

`tenant_contacts` is a relatively simple relational entity, but it performs an important architectural function.

It prevents business communication information from becoming scattered across:

```text
tenants
billing
claims
compliance
notifications
CRM
```

Instead, the canonical relationship becomes:

```text
Tenant
   │
   ├── Executive Contact
   ├── Finance Contact
   ├── Claims Contact
   ├── Compliance Contact
   ├── Technical Contact
   └── Customer Service Contact
```

with:

```text
tenant_contacts.id
        │
        └── PK

tenant_contacts.tenant_id
        │
        └── FK → tenants.id
```

The critical production-grade invariants are:

1. **Every contact belongs to exactly one tenant.**
2. **A tenant can have many contacts.**
3. **`contact_role` provides standardized business routing.**
4. **Contacts are not automatically InsureIQ users.**
5. **Primary contacts should be enforced with a partial unique constraint.**
6. **Contact PII must be protected by tenant isolation and RBAC.**
7. **Contacts should normally be deactivated/archived rather than hard-deleted.**
8. **Changes to contacts and primary-contact assignments must be auditable.**
9. **Downstream services should consume canonical contact data rather than maintaining independent copies.**
10. **The table should remain focused on tenant-level business contacts, not customer/policyholder contacts.**

The resulting domain model is therefore:

```text
                     ┌─────────────────────┐
                     │       Tenant        │
                     │   Aggregate Root    │
                     └──────────┬──────────┘
                                │
                         1      │      N
                                │
                                ▼
                     ┌─────────────────────┐
                     │   tenant_contacts   │
                     ├─────────────────────┤
                     │ id                  │
                     │ tenant_id           │
                     │ contact_name        │
                     │ contact_role        │
                     │ department          │
                     │ email               │
                     │ phone               │
                     │ mobile              │
                     │ preferred_method    │
                     │ is_primary          │
                     │ lifecycle fields    │
                     └─────────────────────┘
                                │
              ┌─────────────────┼──────────────────┐
              ▼                 ▼                  ▼
          Billing            Claims            Compliance
              │                 │                  │
              └─────────────────┼──────────────────┘
                                ▼
                         Notification /
                         Communication
```

`tenant_contacts` therefore provides **normalized business communication management while preserving tenant isolation**.

**Step 3 — `tenant_contacts` is complete.**

The next step is **Step 4 — package this exact documentation into a Markdown file.**
