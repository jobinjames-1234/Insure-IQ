# Step 3 — Table 6: `tenant_branding`

The `tenant_branding` table stores the **visual identity and white-label presentation configuration of each tenant**.

The InsureIQ module inventory identifies this as **Table 6** in Tenant Management, with the purpose **“Logos, themes, colors, branding assets.”**

The existing detailed design describes a Tenant Branding record as the visual identity of a tenant, covering the company logo, favicon, theme colors, login-page assets, email branding, and mobile branding. It also explicitly treats branding as a separate configuration entity rather than embedding it inside the core tenant record.

For production-grade SaaS, this table should remain focused on **branding metadata and configuration**, while the actual image/font files live in object storage/CDN infrastructure.

---

# 1. Why This Table Exists

A multi-tenant SaaS platform cannot assume that every insurance company wants to use InsureIQ's default visual identity.

Each insurer may require its own:

```text
Logo
Favicon
Primary Color
Secondary Color
Accent Color
Login Background
Email Logo
Mobile Logo
Font
```

For example:

```text
InsureIQ
│
├── Tenant A
│     ├── Blue branding
│     ├── Company logo
│     └── Custom login screen
│
├── Tenant B
│     ├── Green branding
│     ├── Company logo
│     └── Different email identity
│
└── Tenant C
      ├── Red branding
      ├── Company logo
      └── Custom mobile branding
```

The source design explicitly states that `tenant_branding` exists to enable:

- White-label deployments.
- UI customization.
- Independent branding management.

Without a dedicated table, branding would have to be placed directly inside `tenants`, causing the tenant root to accumulate presentation-specific attributes.

That would create several problems:

- Tenant identity and visual presentation become coupled.
- Branding fields become difficult to extend.
- Branding updates become mixed with organizational updates.
- Email/mobile/web branding cannot evolve independently.
- Caching becomes less granular.
- Branding history becomes harder to track.
- White-label functionality becomes harder to maintain.

The dedicated entity therefore provides a clean separation:

```text
Tenant Identity
        ≠
Tenant Presentation
```

---

# 2. Business Definition

A **Tenant Branding** record represents the visual identity configuration of a tenant organization.

The existing source explicitly includes:

- Company logo.
- Favicon.
- Theme colors.
- Login-page assets.
- Email branding.
- Mobile branding.

A tenant therefore has a branding configuration such as:

```text
ABC Insurance
│
├── Logo
│     logo_url
│
├── Browser Identity
│     favicon_url
│
├── Application Theme
│     primary_color
│     secondary_color
│     accent_color
│
├── Login Experience
│     login_background_url
│
├── Email Identity
│     email_logo_url
│
├── Mobile Identity
│     mobile_logo_url
│
└── Typography
      font_family
```

This allows InsureIQ to present itself as a tenant-branded platform.

---

# 3. Critical Design Principle — What the Entity IS and IS NOT

## The Tenant Branding IS

- Visual identity metadata.
- White-label configuration.
- UI presentation configuration.
- Tenant-owned configuration.
- A child entity of the Tenant aggregate.
- A reusable presentation configuration consumed by multiple applications.

## The Tenant Branding IS NOT

- The tenant itself.
- Business/legal identity.
- Subscription information.
- Security policy.
- User preferences.
- Authentication configuration.
- An image storage system.
- A CDN.
- An object-storage bucket.
- A design system for the entire platform.

This distinction is particularly important for asset storage.

The database should contain:

```text
logo_url
```

rather than the binary image itself.

The architecture should instead be:

```text
Tenant Branding
      │
      └── logo_url
              ↓
       Object Storage / CDN
              ↓
         Logo Binary
```

---

# 4. Aggregate Root Analysis — DDD Structure

```text
Tenant
│
├── Tenant Branding
│      │
│      ├── Logo
│      ├── Favicon
│      ├── Theme Colors
│      ├── Login Screen
│      ├── Email Branding
│      └── Mobile Branding
│
├── Tenant Profile
├── Tenant Addresses
├── Tenant Contacts
├── Tenant Domains
├── Tenant Settings
├── Tenant Locales
├── Tenant Features
├── Tenant Modules
└── ...
```

The `Tenant` remains the **Aggregate Root**.

`tenant_branding` is a tenant-owned configuration entity.

---

## Aggregate invariant

The existing design establishes a **one-to-one relationship**:

```text
Tenant
  │
  └── exactly one active branding configuration
```

Therefore:

```text
tenant_branding.tenant_id
        ↓
tenants.id
```

must be unique.

The key invariant is:

```text
ONE TENANT
   ↓
ONE CURRENT BRANDING RECORD
```

If branding version history is eventually required, that should be modeled deliberately rather than accidentally allowing multiple current branding rows.

---

# 5. Business Capabilities Supported

| Capability | Supported |
|---|---|
| White-label branding | Yes |
| Custom logos | Yes |
| Favicon customization | Yes |
| Primary theme color | Yes |
| Secondary theme color | Yes |
| Accent color | Yes |
| Login-page branding | Yes |
| Email branding | Yes |
| Mobile branding | Yes |
| Corporate identity | Yes |
| Tenant-specific typography | Yes |
| CDN-backed branding assets | Yes |
| Branding caching | Yes |
| Branding audit history | Yes |
| Subscription management | No |
| Security policy | No |
| User preferences | No |
| Asset binary storage | No — object storage |
| Image processing | No — media infrastructure |

---

# 6. Multi-Tenant / Ownership / Isolation Notes

Every branding configuration belongs to exactly one tenant.

Example:

```text
Tenant A
   ↓
Branding A

Tenant B
   ↓
Branding B
```

Tenant A must never be able to modify or retrieve Tenant B's branding configuration through tenant-scoped APIs.

The normal access pattern should be:

```sql
SELECT *
FROM tenant_branding
WHERE tenant_id = :authenticated_tenant_id;
```

not:

```sql
SELECT *
FROM tenant_branding
WHERE tenant_id = :arbitrary_client_supplied_tenant_id;
```

without authorization validation.

---

## One-to-One Isolation

Because `tenant_id` is unique:

```text
tenant_branding.tenant_id
```

is both:

- an ownership foreign key,
- and an alternate candidate key.

This is a classic one-to-one tenant configuration table.

---

## Branding Assets and Tenant Isolation

The same isolation requirement applies to the underlying files.

For example:

```text
Tenant A
   ↓
logo_url
   ↓
tenant-assets/tenant-A/logo.png
```

and:

```text
Tenant B
   ↓
logo_url
   ↓
tenant-assets/tenant-B/logo.png
```

Object-storage paths should be tenant-scoped.

A tenant should never be able to guess or access another tenant's private branding assets.

---

# 7. Lifecycle

## Creation

Branding is normally created automatically as part of tenant provisioning:

```text
Tenant Created
      ↓
Default Branding Created
      ↓
Tenant Provisioned
```

The existing source explicitly defines:

```text
Tenant Created → Default Branding Created
```

as the creation lifecycle.

A default InsureIQ theme can therefore exist immediately even before the tenant uploads its own assets.

---

## Initial Default Branding

A newly created tenant might initially receive:

```text
primary_color   = #0052CC
secondary_color = NULL
accent_color    = NULL
logo_url        = NULL
favicon_url     = NULL
```

The source specifies `#0052CC` as the default primary color.

This allows the UI to function before customization is completed.

---

## Growth

Branding evolves as the tenant configures its organization:

```text
Default Branding
       ↓
Upload Logo
       ↓
Set Colors
       ↓
Customize Login
       ↓
Configure Email Branding
       ↓
Configure Mobile Branding
```

---

## Modification

Common modifications include:

```text
Logo Changed
Theme Changed
Favicon Changed
Login Background Changed
Email Logo Changed
Mobile Logo Changed
Font Changed
```

These changes should invalidate the tenant branding cache.

---

## Archival

When the tenant is archived:

```text
Tenant Archived
      ↓
Branding Archived
```

The branding files themselves should normally remain retained according to the platform's retention policy if historical records or auditability require them.

---

## Branding Versioning

The current source does **not** require a separate branding-version table.

For the base schema, a single current branding configuration is therefore appropriate.

If future requirements require:

```text
Branding Version 1
Branding Version 2
Branding Version 3
```

with rollback capability, a separate:

```text
tenant_branding_versions
```

table would be preferable rather than turning `tenant_branding` into an uncontrolled historical table.

That is a future extension, not part of the current required table inventory.

---

# 8. Proposed Schema

## Table Name

`tenant_branding`

## Primary Key Strategy

**UUID**

The existing source explicitly uses UUID as the primary key.

```text
id UUID PRIMARY KEY
```

The UUID gives the branding configuration its own stable identity even though `tenant_id` establishes the one-to-one relationship.

---

## Schema Definition

The existing source defines the following fields.

For production-grade documentation, the fields are expanded into the full constraint/reason format:

| Field Name | Data Type | Key | Specification | Reason Field Exists |
|---|---|---|---|---|
| `id` | UUID | PK | `NOT NULL` | Stable unique identity of the branding configuration |
| `tenant_id` | UUID | FK + UK → `tenants.id` | `NOT NULL UNIQUE` | Establishes the one-to-one tenant-to-branding relationship |
| `logo_url` | VARCHAR(500) | — | `NULL` | Stores the location of the tenant's primary logo asset |
| `favicon_url` | VARCHAR(500) | — | `NULL` | Stores the location of the tenant's browser favicon |
| `primary_color` | CHAR(7) | — | `NOT NULL DEFAULT '#0052CC'` | Defines the primary application theme color |
| `secondary_color` | CHAR(7) | — | `NULL` | Provides a secondary theme color |
| `accent_color` | CHAR(7) | — | `NULL` | Provides an accent/highlight color |
| `login_background_url` | VARCHAR(500) | — | `NULL` | Provides tenant-specific login-page visual branding |
| `email_logo_url` | VARCHAR(500) | — | `NULL` | Provides branding for tenant-facing emails |
| `mobile_logo_url` | VARCHAR(500) | — | `NULL` | Provides branding for mobile applications |
| `font_family` | VARCHAR(100) | — | `NULL` | Allows tenant-specific typography where supported |
| `created_at` | TIMESTAMPTZ | — | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Records creation |
| `updated_at` | TIMESTAMPTZ | — | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Records most recent modification |

---

## Production Design Note — Asset URLs

The fields:

```text
logo_url
favicon_url
login_background_url
email_logo_url
mobile_logo_url
```

should contain **references**, not binary data.

Do not use:

```text
BYTEA
BLOB
```

for the actual image files in this table.

The preferred architecture is:

```text
PostgreSQL
   │
   └── logo_url
          ↓
Object Storage
          ↓
CDN
          ↓
Client
```

This keeps the transactional database small and avoids unnecessary database I/O for static assets.

---

## Production Design Note — URL vs Object Key

Although the source uses `*_url`, an implementation may eventually prefer storing an object key:

```text
tenant-assets/{tenant_id}/branding/logo/{asset_id}.png
```

and generating signed/CDN URLs dynamically.

That is especially useful when branding assets are private or when URLs need to change without changing the database record.

The source itself specifies URL fields, so this is a production implementation refinement rather than a replacement of the documented model.

---

# 9. Enum Definitions

**No ENUM fields are currently defined.**

This is appropriate because the current fields are primarily:

- URLs.
- Colors.
- Typography.
- Timestamps.

There is no need to introduce artificial enums such as:

```text
logo_type
theme_type
branding_type
```

when the existing schema does not require them.

---

# 10. Why `tenant_id` Exists

`tenant_id` is the most important business relationship in this table.

It establishes:

```text
Tenant
   │
   └── exactly one Branding Configuration
```

Therefore:

```text
tenant_id
```

must be:

```text
NOT NULL
UNIQUE
FK → tenants.id
```

---

## Why `id` alone is insufficient

The UUID:

```text
tenant_branding.id
```

identifies the branding record.

But the application almost never asks:

```text
"Give me branding record UUID 123."
```

Instead it asks:

```text
"Give me the branding for Tenant ABC."
```

Therefore:

```text
tenant_id
```

is the primary operational lookup key even though:

```text
id
```

remains the technical primary key.

---

## One-to-one model

```text
Tenant A
   │
   └── tenant_branding
           │
           └── tenant_id = A
```

The unique constraint prevents:

```text
Tenant A
   ├── Branding 1
   └── Branding 2
```

from existing simultaneously under the current model.

---

# 11. Candidate Keys

| Key Type | Field | Rationale |
|---|---|---|
| Primary Key | `id` | Stable technical identity |
| Alternate / Candidate Key | `tenant_id` | Each tenant has exactly one current branding configuration |

---

## Why `logo_url` is not a candidate key

A logo can be:

- reused,
- replaced,
- absent,
- shared between multiple tenant contexts.

Therefore it cannot uniquely identify the branding configuration.

Likewise:

```text
primary_color
```

is obviously not unique.

---

# 12. Constraints

| Constraint | Definition | Reason |
|---|---|---|
| Primary Key | `PK(id)` | Unique branding identity |
| Tenant FK | `tenant_id → tenants.id` | Establishes ownership |
| One-to-One | `UNIQUE(tenant_id)` | Exactly one current branding record |
| Required Tenant | `tenant_id NOT NULL` | Branding cannot exist independently |
| Primary Color | `NOT NULL DEFAULT '#0052CC'` | Every tenant has a valid default primary theme |
| HEX Color Format | `^#[0-9A-Fa-f]{6}$` | Prevent invalid six-digit HEX values |
| URL Length | Maximum 500 characters | Prevent unexpectedly large URL values |
| Timestamp Creation | `created_at NOT NULL` | Lifecycle traceability |
| Timestamp Update | `updated_at NOT NULL` | Change tracking |

---

## HEX Color Validation

For:

```text
#0052CC
```

the expected format is:

```text
#
+
6 hexadecimal characters
```

A PostgreSQL check can be:

```sql
CHECK (primary_color ~ '^#[0-9A-Fa-f]{6}$')
```

and similarly for:

```text
secondary_color
accent_color
```

where those values are not null.

For example:

```sql
CHECK (
    secondary_color IS NULL
    OR secondary_color ~ '^#[0-9A-Fa-f]{6}$'
)
```

---

## URL Validation

Full URL validation should generally remain at the application layer.

The database should primarily enforce:

```text
length
NOT NULL where required
```

rather than attempting to implement the entire URI specification through complex database regular expressions.

---

# 13. Relationships

## Incoming References

The source identifies these consumers:

- Web Portal.
- Mobile App.
- Email Service.
- Authentication UI.

Production consumers can also include:

- Notification Service.
- CDN Cache Manager.
- White-label Login.
- Document/Email Rendering.
- Tenant Administration.

---

## Outgoing References

```text
tenant_branding.tenant_id
        ↓
tenants.id
```

This is the only relational dependency in the current table design.

---

## Relationship Diagram

```text
                 ┌─────────────────┐
                 │     Tenant      │
                 └────────┬────────┘
                          │
                        1 │ 1
                          │
                          ▼
                 ┌─────────────────┐
                 │ tenant_branding │
                 ├─────────────────┤
                 │ id              │
                 │ tenant_id       │
                 │ logo_url        │
                 │ favicon_url     │
                 │ colors          │
                 │ login assets    │
                 │ email assets    │
                 │ mobile assets   │
                 │ font_family     │
                 └─────────────────┘
                          │
          ┌───────────────┼────────────────┐
          ▼               ▼                ▼
       Web App         Mobile           Email
```

---

# 14. Cardinality Analysis

| Relationship | Expected Cardinality | Explanation |
|---|---:|---|
| Tenant → Branding | Exactly 1 | Current design defines one branding configuration per tenant |
| Branding → Tenant | Exactly 1 | Every branding record belongs to one tenant |
| Logo Assets | 0..N | Current table supports several URL fields |
| Theme Colors | 1..3 | Primary plus optional secondary/accent |
| Login Background | 0..1 | Optional tenant-specific asset |
| Email Logo | 0..1 | Optional email branding |
| Mobile Logo | 0..1 | Optional mobile branding |

---

## Platform scale

If InsureIQ reaches:

```text
100,000 tenants
```

the table should contain approximately:

```text
100,000 branding records
```

This is an extremely small relational table.

The real scalability concern is not database storage.

It is:

```text
branding lookup frequency
+
asset delivery
+
CDN caching
```

---

# 15. Query Patterns

## Retrieve Tenant Branding

This is the primary query:

```sql
SELECT *
FROM tenant_branding
WHERE tenant_id = :tenant_id;
```

---

## Retrieve Logo

```sql
SELECT logo_url
FROM tenant_branding
WHERE tenant_id = :tenant_id;
```

---

## Retrieve Complete UI Branding

```sql
SELECT
    logo_url,
    favicon_url,
    primary_color,
    secondary_color,
    accent_color,
    login_background_url,
    font_family
FROM tenant_branding
WHERE tenant_id = :tenant_id;
```

---

## Retrieve Email Branding

```sql
SELECT
    email_logo_url,
    primary_color,
    secondary_color,
    accent_color
FROM tenant_branding
WHERE tenant_id = :tenant_id;
```

---

## Retrieve Mobile Branding

```sql
SELECT
    mobile_logo_url,
    primary_color,
    secondary_color,
    accent_color
FROM tenant_branding
WHERE tenant_id = :tenant_id;
```

---

## Find Tenants Using a Specific Primary Color

```sql
SELECT tenant_id
FROM tenant_branding
WHERE primary_color = :color;
```

This is more useful for administrative/reporting purposes than normal application operation.

---

# 16. Index Strategy

The core workload requires:

- PK(`id`)
- UNIQUE(`tenant_id`)

These are sufficient for the normal workload.

---

## Primary Key

```sql
PRIMARY KEY (id)
```

Provides direct record lookup.

---

## Tenant Unique Index

```sql
UNIQUE(tenant_id)
```

This simultaneously provides:

- one-to-one enforcement,
- tenant lookup,
- efficient retrieval.

Therefore an additional index on `tenant_id` is unnecessary in PostgreSQL because the unique index already supports the lookup.

---

## Color Indexes

Normally **not required**.

Queries such as:

```sql
WHERE primary_color = '#0052CC'
```

are administrative/reporting queries and do not justify another operational index at normal scale.

---

## URL Indexes

No indexes should normally be created on:

```text
logo_url
favicon_url
login_background_url
email_logo_url
mobile_logo_url
```

These are not common search predicates.

---

# 17. Read / Write Characteristics

The source explicitly classifies the table as:

```text
Reads: Very High
Writes: Very Low
```

This is logical because branding is read frequently by:

- Web Portal.
- Authentication UI.
- Mobile Application.
- Email Service.
- Notification Service.

while branding changes are relatively rare.

---

## Read workload

Typical pattern:

```text
User Opens Application
       ↓
Resolve Tenant
       ↓
Load Branding
       ↓
Render UI
```

This may happen repeatedly across:

- login,
- dashboard,
- navigation,
- email generation,
- mobile startup.

Therefore branding should be treated as a **high-read, low-write configuration entity**.

---

## Write workload

Writes normally occur when an administrator:

- Uploads a logo.
- Changes a color.
- Changes favicon.
- Changes login background.
- Changes typography.

These events are infrequent compared with reads.

---

# 18. Caching Strategy

The source explicitly recommends:

```text
tenant-branding:{tenant_id}
```

in Redis.

This is the correct primary cache key.

Example:

```text
tenant-branding:abc123
```

---

## Cached Value

A typical cached representation could be:

```json
{
  "logo_url": "https://cdn.example.com/tenant-a/logo.png",
  "favicon_url": "https://cdn.example.com/tenant-a/favicon.png",
  "primary_color": "#0052CC",
  "secondary_color": "#FFFFFF",
  "accent_color": "#00AEEF",
  "login_background_url": "https://cdn.example.com/tenant-a/login.png",
  "email_logo_url": "https://cdn.example.com/tenant-a/email-logo.png",
  "mobile_logo_url": "https://cdn.example.com/tenant-a/mobile.png",
  "font_family": "Inter"
}
```

---

## Cache Invalidation

Invalidate:

```text
tenant-branding:{tenant_id}
```

when:

- Branding created.
- Branding updated.
- Logo changed.
- Favicon changed.
- Theme changed.
- Login background changed.
- Email branding changed.
- Mobile branding changed.

---

## CDN Caching

The database/Redis cache should not become the mechanism for serving image binaries.

Instead:

```text
PostgreSQL
   ↓
logo_url
   ↓
CDN
   ↓
Browser
```

The CDN should cache the actual image.

This separates:

```text
Configuration caching
```

from:

```text
Asset caching
```

---

# 19. Security Considerations

The source specifically requires:

- Tenant-scoped updates.
- Asset validation.
- Upload restrictions.
- Audit logging.

These are essential because branding assets ultimately become part of the application's user-facing surface.

---

## Tenant-Scoped Updates

Only authorized tenant administrators should be allowed to modify:

```text
tenant_branding
```

A request must verify:

```text
authenticated_user
        ↓
belongs to tenant
        ↓
has branding-management permission
```

---

## Asset Validation

Uploaded images should be validated for:

- MIME type.
- File signature/magic bytes.
- File size.
- Image dimensions.
- Supported formats.
- Malware where appropriate.

Do not trust:

```text
Content-Type
```

alone.

For example, a file named:

```text
logo.png
```

does not guarantee that it actually contains a valid PNG.

---

## Upload Restrictions

Recommended limits:

```text
Logo
   ↓
Maximum size
Maximum dimensions
Allowed formats

Favicon
   ↓
ICO / PNG / SVG according to frontend support

Background
   ↓
Larger maximum size
```

SVG requires particular care because SVG can contain active content.

If SVG is allowed, it should be sanitized before serving.

---

## XSS Considerations

Branding data ultimately enters HTML/CSS rendering.

Potentially dangerous values include:

```text
font_family
URLs
SVG assets
custom CSS if later introduced
```

The current schema does not include arbitrary CSS, which is good.

Avoid adding:

```text
custom_css TEXT
```

without a strong sanitization and security design.

---

## URL Security

Asset URLs should ideally point to:

```text
https://
```

and should not allow arbitrary executable schemes such as:

```text
javascript:
data:
```

where those are not explicitly required.

---

## Cache Isolation

Redis keys must include tenant identity:

```text
tenant-branding:{tenant_id}
```

and should never use a generic key such as:

```text
branding
```

because that could cause cross-tenant cache contamination.

---

# 20. Audit Requirements

Branding changes are business-significant even though they are generally not as security-critical as authentication settings.

The source identifies these events:

| Event | Trigger | Purpose |
|---|---|---|
| `TenantBrandingCreated` | Initial branding configuration created | Establish branding provenance |
| `TenantBrandingUpdated` | Branding configuration changed | Track configuration changes |
| `TenantLogoChanged` | Logo asset changed | Track visual identity changes |
| `TenantThemeChanged` | Theme colors changed | Track presentation changes |

---

## Recommended Audit Payload

```json
{
  "event": "TenantThemeChanged",
  "tenant_id": "tenant-uuid",
  "changed_fields": [
    "primary_color",
    "accent_color"
  ],
  "actor_id": "user-uuid",
  "timestamp": "2026-08-15T10:30:00Z"
}
```

The audit record should capture **what changed** and **who changed it** rather than unnecessarily duplicating binary assets.

---

## Logo Change

A logo event can record:

```text
old_asset_reference
new_asset_reference
actor
timestamp
```

rather than embedding the image itself in the audit system.

---

# 21. Event Producers / Event Consumers

## Event Producers

The source identifies:

- `TenantBrandingCreated`
- `TenantBrandingUpdated`
- `TenantLogoChanged`
- `TenantThemeChanged`

Operational producers include:

```text
Tenant Administration UI
        ↓
Branding API
        ↓
Branding Service
```

---

## Event Consumers

The source identifies:

- Web Portal.
- Mobile Application.
- Email Service.
- Notification Service.
- CDN Cache Manager.

Additional logical consumers include:

| Consumer | Purpose |
|---|---|
| Web Portal | Apply tenant visual identity |
| Authentication UI | Render branded login experience |
| Mobile Application | Apply tenant mobile branding |
| Email Service | Apply email branding |
| Notification Service | Render branded notifications |
| CDN Cache Manager | Invalidate asset caches |
| Audit Service | Record changes |
| Search/Admin UI | Display tenant branding metadata |

---

## Example Event Flow

```text
Administrator Changes Logo
          ↓
Branding API
          ↓
tenant_branding UPDATE
          ↓
TenantLogoChanged
          ↓
Event Bus
     ┌────┼───────────┐
     ▼    ▼           ▼
 Web UI  Email      CDN Cache
```

This allows the branding database transaction to remain independent from downstream cache and presentation updates.

---

# 22. Alternative Designs Considered

| Option | Description | Verdict |
|---|---|---|
| A | Store branding directly in `tenants` | **Rejected** |
| B | Store branding as JSON | **Rejected** |
| C | Store binary assets in PostgreSQL | **Rejected** |
| D | Separate table per branding channel | **Rejected** |
| **E** | Dedicated `tenant_branding` table | **Chosen** |

## Option A — Store Branding in `tenants`

Example:

```text
tenants
├── logo_url
├── primary_color
├── secondary_color
├── favicon_url
└── ...
```

Rejected because it mixes:

```text
Tenant Identity
```

with:

```text
Tenant Presentation
```

and makes the root table unnecessarily wide.

---

## Option B — JSON Branding Object

Example:

```json
{
  "logo": "...",
  "colors": {
    "primary": "#0052CC"
  },
  "email": {
    "logo": "..."
  }
}
```

Rejected as the primary model because the current branding structure is stable and relational.

JSON would weaken:

- schema validation,
- direct field querying,
- constraints,
- predictable application behavior,
- migration management.

---

## Option C — Store Binary Images in PostgreSQL

Example:

```text
logo BYTEA
favicon BYTEA
background BYTEA
```

Rejected.

Branding images are static assets and should be served by object storage/CDN rather than the transactional database.

Database rows should contain references.

---

## Option D — Separate Table for Every Branding Channel

Example:

```text
tenant_web_branding
tenant_mobile_branding
tenant_email_branding
tenant_login_branding
```

Rejected for the current scope because all these settings represent one conceptual tenant branding configuration.

Splitting them would introduce unnecessary joins and duplicated tenant relationships.

If the product eventually develops highly independent branding systems for each channel, separate aggregates can be introduced later.

---

## Option E — Dedicated `tenant_branding`

**Chosen.**

It provides:

- Clear separation of identity and presentation.
- One branding configuration per tenant.
- White-label support.
- Centralized theme management.
- Efficient caching.
- Clean integration with web/mobile/email consumers.
- Simple tenant isolation.

This matches the existing source design.

---

# 23. Final Design Assessment

| Attribute | Rating |
|---|---|
| Complexity | Low |
| Read Volume | **Very High** |
| Write Volume | **Very Low** |
| Security Importance | Medium |
| Business Criticality | **High** |
| PII Sensitivity | Low |
| Asset Infrastructure Dependency | High |
| Scalability | Excellent |
| Data Volatility | Low |
| Recommended Status | **Core Supporting Table** |

## Overall Assessment

`tenant_branding` is intentionally a small table.

Its importance comes from the fact that it sits at the intersection of:

```text
Tenant
   │
   ├── Web Application
   ├── Mobile Application
   ├── Authentication UI
   ├── Email
   ├── Notifications
   └── White-Label Experience
```

The correct architecture is:

```text
                 ┌──────────────────┐
                 │      Tenant      │
                 └────────┬─────────┘
                          │
                          │ 1:1
                          ▼
                 ┌──────────────────┐
                 │ tenant_branding  │
                 ├──────────────────┤
                 │ id               │
                 │ tenant_id        │
                 │ logo_url         │
                 │ favicon_url      │
                 │ primary_color    │
                 │ secondary_color  │
                 │ accent_color     │
                 │ login_background │
                 │ email_logo       │
                 │ mobile_logo      │
                 │ font_family      │
                 └────────┬─────────┘
                          │
              ┌───────────┼────────────┐
              ▼           ▼            ▼
           Web UI      Mobile       Email
              │           │            │
              └───────────┼────────────┘
                          ▼
                         CDN
```

The most important production decisions are:

1. **There should be one current branding configuration per tenant.**
2. **`tenant_id` must be a unique foreign key.**
3. **Branding is presentation metadata, not tenant identity.**
4. **Image binaries should not be stored in PostgreSQL.**
5. **`*_url` fields should reference object storage/CDN assets.**
6. **Branding reads are very high-volume and writes are very low-volume.**
7. **Redis caching with `tenant-branding:{tenant_id}` is appropriate.**
8. **Tenant administrators must be authorized before branding changes are accepted.**
9. **Uploaded assets must undergo strict validation and sanitization.**
10. **Branding changes should generate auditable events.**
11. **Branding configuration must remain tenant-isolated in both PostgreSQL and asset storage.**
12. **The database should not become an asset-management or CDN system.**

The resulting business model is therefore:

```text
Tenant
   │
   │ 1
   ▼
Tenant Branding
   │
   ├── Visual Identity
   ├── Theme
   ├── Login Branding
   ├── Email Branding
   └── Mobile Branding
```

while the actual assets remain outside the transactional database:

```text
tenant_branding
      │
      └── asset reference
              ↓
       Object Storage
              ↓
             CDN
              ↓
         End User
```

This preserves the source design's intended role for `tenant_branding`: **centralized tenant-specific visual identity supporting scalable white-label SaaS deployments.**

**Step 3 — `tenant_branding` is complete.**

The next step is **Step 4 — package this exact documentation into `Module_01_Table_06_tenant_branding.md`**.
