# Step 3 — Table 8: `tenant_locales`

The `tenant_locales` table manages **the language and regional configurations supported by each tenant**.

The Module 1 inventory identifies Table 8 as `tenant_locales`, with the purpose **“Language, timezone, regional settings.”**

The detailed source design defines a Tenant Locale as a language-and-region configuration supported by a tenant, with examples such as `en-US`, `en-GB`, `fr-CA`, `ar-AE`, `hi-IN`, and `ml-IN`. It deliberately separates locale configuration from the general operational settings stored in `tenant_settings`.

This distinction is important:

```text
tenant_settings
    ↓
General tenant defaults

tenant_locales
    ↓
Which language/region combinations
the tenant actually supports
```

For example:

```text
Tenant: ABC Insurance

Supported Locales
├── en-IN
├── hi-IN
└── ml-IN

Default Locale
└── en-IN
```

The table therefore provides the foundation for multilingual and regional experiences across InsureIQ.

---

# 1. Why This Table Exists

A production insurance SaaS platform cannot assume that every tenant operates in a single language or region.

An insurer operating in India might need:

```text
English — India
Hindi — India
Malayalam — India
```

while another tenant might operate internationally:

```text
English — United States
English — United Kingdom
French — Canada
Arabic — UAE
```

The existing source explicitly states that `tenant_locales` exists to manage multiple language and regional configurations for each tenant, enabling multilingual experiences and international deployments while keeping localization separate from general tenant settings.

Without a dedicated locale table, the system would have difficulty representing:

- Multiple supported languages.
- Language-region combinations.
- Regional formatting.
- RTL languages.
- A tenant-specific default locale.
- Temporarily disabling a locale.
- Locale-specific UI behavior.
- Locale-aware notifications.
- Locale-aware reporting.
- Locale-aware document generation.

The correct conceptual distinction is:

```text
Tenant Settings
      │
      └── default_language = en

Tenant Locales
      │
      ├── en-US
      ├── en-GB
      ├── fr-CA
      └── ar-AE
```

The first establishes a default.

The second establishes the **set of supported regional configurations**.

---

# 2. Business Definition

A **Tenant Locale** represents a language and regional configuration supported by a tenant.

The source provides these examples:

```text
en-US
en-GB
fr-CA
ar-AE
hi-IN
ml-IN
```

A locale combines concepts such as:

```text
Language
    +
Region
    +
Regional presentation rules
    +
Text direction
```

For example:

```text
en-US
│
├── Language: English
├── Region: United States
└── Direction: LTR
```

while:

```text
ar-AE
│
├── Language: Arabic
├── Region: UAE
└── Direction: RTL
```

The table therefore provides metadata that allows application services to determine how a tenant's localized experience should behave.

---

## Conceptual Model

```text
Tenant
│
└── Tenant Locales
      │
      ├── English (US)
      ├── English (UK)
      ├── French (Canada)
      ├── Arabic (UAE)
      ├── Hindi (India)
      └── Malayalam (India)
```

A tenant can therefore support multiple locales simultaneously.

---

# 3. Critical Design Principle — What the Entity IS and IS NOT

## The Tenant Locale IS

- Regional configuration metadata.
- Language-region configuration.
- Tenant-owned localization metadata.
- A child entity of the Tenant aggregate.
- A configuration consumed by UI and backend services.
- A mechanism for multilingual and international deployments.
- A source for locale-aware presentation behavior.

## The Tenant Locale IS NOT

- A user preference.
- Translation content.
- A language dictionary.
- A translation string.
- A user's language selection.
- A timezone registry.
- A country master table.
- A localization resource file.

This distinction prevents `tenant_locales` from becoming an uncontrolled translation/content store.

---

# 4. Aggregate Root Analysis — DDD Structure

The Tenant remains the aggregate root.

```text
Tenant
│
├── Tenant Locales
│      │
│      ├── English (US)
│      ├── English (UK)
│      ├── French (Canada)
│      ├── Arabic (UAE)
│      ├── Hindi (India)
│      └── Malayalam (India)
│
├── Tenant Settings
├── Tenant Branding
├── Tenant Domains
├── Tenant Features
├── Tenant Modules
└── ...
```

The source explicitly models Tenant Locales underneath the Tenant aggregate.

---

## Aggregate Invariant

A tenant can have multiple locales:

```text
Tenant
   │
   ├── Locale A
   ├── Locale B
   ├── Locale C
   └── ...
```

but there should be **exactly one default locale**.

Therefore:

```text
Tenant
   │
   ├── en-IN
   ├── hi-IN
   ├── ml-IN
   │
   └── DEFAULT → en-IN
```

The database/business model must enforce:

```text
ONE TENANT
    ↓
MANY LOCALES
    ↓
ONE DEFAULT LOCALE
```

---

# 5. Business Capabilities Supported

| Capability | Supported |
|---|---|
| Multiple languages | Yes |
| Multiple regional configurations | Yes |
| Internationalization | Yes |
| Localization | Yes |
| Regional formatting | Yes |
| RTL language support | Yes |
| Tenant-specific default locale | Yes |
| Locale activation/deactivation | Yes |
| Multilingual UI | Yes |
| Localized notifications | Yes |
| Localized reporting | Yes |
| Localized documents | Yes |
| Translation content storage | No |
| User language preference | No |
| Global country master data | No |
| Global language master data | No |

The source explicitly identifies the primary business capabilities as:

- Multiple languages.
- Regional formatting.
- Internationalization.
- Localization.
- RTL language support.

---

# 6. Multi-Tenant / Ownership / Isolation Notes

Each locale belongs to exactly one tenant.

The source explicitly defines:

```text
Each locale belongs to exactly one tenant.
```

Therefore:

```text
Tenant A
   ├── en-US
   ├── fr-CA
   └── ar-AE

Tenant B
   ├── en-IN
   └── hi-IN
```

must remain completely isolated.

---

## Tenant Isolation

An administrator for Tenant A must only be able to manage:

```sql
SELECT *
FROM tenant_locales
WHERE tenant_id = :authenticated_tenant_id;
```

Tenant B's locale records must never become accessible merely because the client submits another tenant identifier.

The authorization boundary should therefore be:

```text
Authenticated User
       ↓
Tenant Membership
       ↓
Locale Management Permission
       ↓
Tenant-scoped Locale Operation
```

---

## Locale Isolation

Even though locale definitions such as:

```text
en-US
```

are globally recognizable concepts, the tenant's **configuration record** is tenant-owned.

For example:

```text
Tenant A
   en-US
   is_default = TRUE

Tenant B
   en-US
   is_default = FALSE
```

These are two separate tenant configuration records.

---

# 7. Lifecycle

## Creation

The source defines:

```text
Tenant Created
      ↓
Default Locale Added
```

Therefore tenant provisioning should normally create at least one locale.

A tenant should not be left without a usable localization configuration.

---

## Initial Locale

For example:

```text
Tenant Created
      ↓
en-IN
      ↓
is_default = TRUE
```

The actual default should be determined from tenant onboarding information rather than blindly assuming a particular country.

---

## Growth

Additional locales can be added as the tenant expands:

```text
Tenant
   ↓
en-IN
   ↓
+ hi-IN
   ↓
+ ml-IN
   ↓
+ ar-AE
```

This supports international expansion without changing the tenant root structure.

---

## Modification

A locale may be modified to change:

```text
display_name
text_direction
is_active
```

depending on the supported implementation.

---

## Default Locale Change

A tenant may switch its default:

```text
Before:
    en-IN → DEFAULT

After:
    ml-IN → DEFAULT
```

The system must guarantee that the final committed state contains only one default locale.

---

## Archival

The source defines:

```text
Tenant Archived
      ↓
Locales Archived
```

The current design uses:

```text
is_active
```

for locale activation state.

Therefore an archived tenant's locales should normally become operationally unavailable while historical configuration can be retained.

---

# 8. Proposed Schema

## Table Name

`tenant_locales`

## Primary Key Strategy

**UUID**

The source explicitly specifies UUID as the primary key.

```text
id UUID PRIMARY KEY
```

---

## Schema Definition

The source defines these fields:

| Field Name | Data Type | Key | Specification | Reason Field Exists |
|---|---|---|---|---|
| `id` | UUID | PK | `NOT NULL` | Stable unique identity of the tenant locale configuration |
| `tenant_id` | UUID | FK → `tenants.id` | `NOT NULL` | Establishes tenant ownership and isolation |
| `locale_code` | VARCHAR(20) | UK with `tenant_id` | `NOT NULL` | Identifies the language-region combination |
| `language_code` | CHAR(2) | — | `NOT NULL` | Identifies the language component of the locale |
| `country_code` | CHAR(2) | — | `NOT NULL` | Identifies the regional/country component |
| `display_name` | VARCHAR(100) | — | `NOT NULL` | Human-readable name shown in administration/UI |
| `is_default` | BOOLEAN | — | `NOT NULL DEFAULT FALSE` | Identifies the tenant's default locale |
| `text_direction` | ENUM | — | `NOT NULL DEFAULT 'ltr'` | Determines left-to-right or right-to-left rendering |
| `is_active` | BOOLEAN | — | `NOT NULL DEFAULT TRUE` | Controls whether the locale is currently available |
| `created_at` | TIMESTAMPTZ | — | `NOT NULL` | Records locale configuration creation |
| `updated_at` | TIMESTAMPTZ | — | `NOT NULL` | Records the most recent configuration change |

---

## `locale_code`

The source specifies:

```text
VARCHAR(20)
```

with the business purpose of uniquely identifying the language-region combination.

Examples:

```text
en-US
en-GB
fr-CA
ar-AE
hi-IN
ml-IN
```

The exact syntactic standard should be consistently defined by the application.

A production implementation should preferably align this field with BCP 47-style locale identifiers if the broader platform adopts that standard.

---

## `language_code`

The source specifies:

```text
CHAR(2)
```

This stores the language component.

Examples:

```text
en
fr
ar
hi
ml
```

It should not be treated as translation content.

---

## `country_code`

The source specifies:

```text
CHAR(2)
```

This stores the regional/country component.

Examples:

```text
US
GB
CA
AE
IN
```

The application should validate these values against the platform's supported country/region reference data.

---

## `display_name`

This provides a human-readable label.

For example:

```text
English (United States)
English (United Kingdom)
French (Canada)
Arabic (UAE)
Hindi (India)
Malayalam (India)
```

The display name is presentation metadata.

It should not replace `locale_code` as the machine-readable identifier.

---

## `is_default`

The source specifies:

```text
BOOLEAN
Default FALSE
```

This identifies the locale used as the tenant's default localization configuration.

The database/business rules must guarantee:

```text
MAX 1 DEFAULT LOCALE PER TENANT
```

---

## `is_active`

The source specifies:

```text
BOOLEAN
Default TRUE
```

This allows a tenant to temporarily disable a locale without destroying its configuration.

Example:

```text
en-IN
is_active = TRUE

hi-IN
is_active = FALSE
```

The configuration remains available for historical/reference purposes but should not normally be offered to new users.

---

# 9. Enum Definitions

## `text_direction`

The source explicitly defines two values:

| Value | Description |
|---|---|
| `ltr` | Left-to-right text and interface direction |
| `rtl` | Right-to-left text and interface direction |

---

## `ltr`

Used by languages such as:

```text
English
French
Hindi
Malayalam
```

for normal text-direction rendering.

---

## `rtl`

Used by languages such as:

```text
Arabic
```

and potentially other right-to-left languages supported by the platform.

This setting is important because RTL support can affect:

- navigation,
- forms,
- tables,
- icons,
- alignment,
- layout direction,
- notification templates.

---

# 10. Why `locale_code` Exists

`locale_code` is the key machine-readable identifier for the language-region combination.

The source explicitly states that it:

> Uniquely identifies the language-region combination used for localization.

For example:

```text
en-US
```

is materially different from:

```text
en-GB
```

even though both use English.

Regional differences can affect:

```text
Date formats
Number formats
Currency presentation
Address formats
Terminology
Legal wording
Document formatting
```

Therefore storing only:

```text
language_code = en
```

would not adequately identify the tenant's localization configuration.

---

## Why the composite uniqueness matters

The candidate key is:

```text
(tenant_id, locale_code)
```

This means:

```text
Tenant A + en-US
```

can exist once, while:

```text
Tenant B + en-US
```

can also exist independently.

The uniqueness is tenant-scoped rather than globally scoped.

---

# 11. Candidate Keys

| Key Type | Field(s) | Rationale |
|---|---|---|
| Primary Key | `id` | Stable technical identity |
| Candidate / Alternate Key | `(tenant_id, locale_code)` | A tenant cannot have the same locale configuration twice |

The source explicitly defines:

```text
Primary: id
Candidate: (tenant_id, locale_code)
```

---

## Why `locale_code` alone is not unique

The same locale can be used by many tenants:

```text
Tenant A → en-US
Tenant B → en-US
Tenant C → en-US
```

Therefore:

```text
UNIQUE(locale_code)
```

would be incorrect.

The correct uniqueness boundary is:

```text
UNIQUE(tenant_id, locale_code)
```

---

# 12. Constraints

The source explicitly identifies:

```text
PK(id)
FK(tenant_id)
One default locale per tenant
```

The production-grade constraint set should therefore include:

| Constraint | Definition | Reason |
|---|---|---|
| Primary Key | `PK(id)` | Stable locale identity |
| Tenant FK | `tenant_id → tenants.id` | Establishes ownership |
| Tenant Locale Uniqueness | `UNIQUE(tenant_id, locale_code)` | Prevents duplicate locale configurations |
| Required Locale | `locale_code NOT NULL` | Every record needs a locale identity |
| Required Language | `language_code NOT NULL` | Language component required |
| Required Country | `country_code NOT NULL` | Regional component required |
| Required Display Name | `display_name NOT NULL` | Administration/UI representation |
| Default State | `is_default DEFAULT FALSE` | Prevents accidental default assignment |
| Direction Default | `text_direction DEFAULT 'ltr'` | Most supported locales use LTR |
| Active State | `is_active DEFAULT TRUE` | New locale configurations are active |
| Timestamp Integrity | `created_at`, `updated_at NOT NULL` | Lifecycle tracking |

---

## One Default Locale Per Tenant

This is one of the most important constraints.

A simple boolean:

```text
is_default
```

alone is not enough.

Without additional enforcement, the database could contain:

```text
Tenant A
    en-US → TRUE
    en-GB → TRUE
    hi-IN → TRUE
```

which violates the business rule.

For PostgreSQL, a partial unique index is an appropriate implementation:

```sql
CREATE UNIQUE INDEX uq_tenant_default_locale
ON tenant_locales (tenant_id)
WHERE is_default = TRUE;
```

This enforces:

```text
Maximum one default locale per tenant
```

while still allowing many non-default locales.

---

## Referential Integrity

The foreign key:

```text
tenant_id → tenants.id
```

should prevent orphaned locale records.

The system should not allow:

```text
tenant_locales
    tenant_id = nonexistent tenant
```

---

# 13. Relationships

## Incoming References

The source identifies these consumers:

- UI.
- Notifications.
- Reporting.
- Translation.

Additional logical consumers include:

- Document Generator.
- Email Service.
- User Onboarding.
- Localization Service.
- PDF/Document Rendering.

---

## Outgoing References

```text
tenant_locales.tenant_id
        ↓
tenants.id
```

This is the primary relational dependency.

---

## Relationship Diagram

```text
                         ┌──────────────┐
                         │    Tenant    │
                         └──────┬───────┘
                                │
                         1      │      N
                                ▼
                    ┌─────────────────────┐
                    │   tenant_locales    │
                    ├─────────────────────┤
                    │ id                  │
                    │ tenant_id           │
                    │ locale_code         │
                    │ language_code       │
                    │ country_code        │
                    │ display_name        │
                    │ is_default          │
                    │ text_direction      │
                    │ is_active           │
                    │ created_at          │
                    │ updated_at          │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             ▼                 ▼                 ▼
            UI           Notifications       Reporting
                               │
                               ▼
                         Translation
```

---

# 14. Cardinality Analysis

The source specifies:

```text
Locales per tenant: 1–50
Default locale: 1
```

Therefore:

| Relationship | Expected Cardinality |
|---|---:|
| Tenant → Locales | 1–50 |
| Tenant → Default Locale | Exactly 1 |
| Locale → Tenant | Exactly 1 |
| Tenant → Active Locales | 1–50 |
| Tenant → Inactive Locales | 0–N |
| Locale → Translation Content | Indirect |
| Locale → Users | Indirect |

---

## Platform Scale

If InsureIQ has:

```text
100,000 tenants
```

and each tenant has an average of:

```text
5 locales
```

the platform would contain approximately:

```text
500,000 tenant_locale records
```

At the maximum conceptual source scale:

```text
100,000 × 50
=
5,000,000 records
```

This remains a manageable relational table.

The dominant workload is therefore not storage but:

```text
locale resolution
+
tenant-scoped reads
+
cache access
```

---

# 15. Query Patterns

## Retrieve All Tenant Locales

The primary query is:

```sql
SELECT *
FROM tenant_locales
WHERE tenant_id = :tenant_id;
```

---

## Retrieve Default Locale

```sql
SELECT *
FROM tenant_locales
WHERE tenant_id = :tenant_id
AND is_default = TRUE;
```

---

## Retrieve Active Locales

```sql
SELECT *
FROM tenant_locales
WHERE tenant_id = :tenant_id
AND is_active = TRUE;
```

This is useful when constructing a language-selection interface.

---

## Resolve a Specific Locale

```sql
SELECT *
FROM tenant_locales
WHERE tenant_id = :tenant_id
AND locale_code = :locale_code;
```

Because `(tenant_id, locale_code)` is unique, this should return at most one record.

---

## Retrieve Active Locale by Code

```sql
SELECT *
FROM tenant_locales
WHERE tenant_id = :tenant_id
AND locale_code = :locale_code
AND is_active = TRUE;
```

Useful during request-level locale resolution.

---

## Retrieve Default Locale Code Only

```sql
SELECT locale_code
FROM tenant_locales
WHERE tenant_id = :tenant_id
AND is_default = TRUE
AND is_active = TRUE;
```

This is an efficient query for services that only need the locale identifier.

---

# 16. Index Strategy

The source explicitly recommends:

- `PK(id)`
- `INDEX(tenant_id)`
- `INDEX(locale_code)`
- `INDEX(is_default)`
- `INDEX(is_active)`

For production PostgreSQL, these should be evaluated against the actual workload because the composite unique index can cover several access patterns.

---

## Primary Key

```sql
PRIMARY KEY (id)
```

Provides direct record identity.

---

## Tenant Index

```sql
INDEX(tenant_id)
```

Supports:

```sql
SELECT *
FROM tenant_locales
WHERE tenant_id = ?;
```

which is one of the most common operations.

---

## Composite Unique Index

The candidate key:

```text
(tenant_id, locale_code)
```

should be enforced:

```sql
UNIQUE(tenant_id, locale_code)
```

This index also efficiently supports:

```text
WHERE tenant_id = ?
AND locale_code = ?
```

---

## Default Locale Index

The business rule:

```text
one default locale per tenant
```

is best enforced with:

```sql
CREATE UNIQUE INDEX uq_tenant_default_locale
ON tenant_locales (tenant_id)
WHERE is_default = TRUE;
```

This index also makes default-locale lookup efficient.

---

## `is_active` Index

The source recommends:

```text
INDEX(is_active)
```

However, because `is_active` is a low-cardinality boolean, a standalone index may have limited value.

A more workload-specific index could be:

```sql
CREATE INDEX idx_tenant_active_locales
ON tenant_locales (tenant_id)
WHERE is_active = TRUE;
```

This is an implementation optimization rather than a change to the conceptual schema.

---

## `locale_code` Index

The source recommends an index on `locale_code`.

However, the primary tenant-scoped query is:

```text
tenant_id + locale_code
```

Therefore:

```text
UNIQUE(tenant_id, locale_code)
```

may already satisfy most application lookup requirements.

A standalone:

```text
INDEX(locale_code)
```

should be retained only if cross-tenant locale reporting or administrative queries actually require it.

---

# 17. Read / Write Characteristics

The source classifies the table as:

```text
Reads: High
Writes: Very Low
```

This is appropriate.

---

## Read Workload

Locale configuration can be read by:

```text
UI
Notifications
Reporting
Translation
Document Generator
Email
Localization Services
```

A tenant's supported locales may be required repeatedly.

---

## Write Workload

Writes are comparatively rare.

Typical writes include:

```text
Locale Added
Locale Disabled
Locale Re-enabled
Default Locale Changed
Display Name Updated
```

These happen far less frequently than normal application reads.

---

## Delete Workload

Physical deletion should generally be avoided for configuration that may have been historically used.

Prefer:

```text
is_active = FALSE
```

or tenant archival behavior.

This preserves historical context.

---

# 18. Caching Strategy

The source explicitly recommends:

```text
tenant-locales:{tenant_id}
```

in Redis.

This is a good cache candidate because:

- Locale configurations are read frequently.
- Locale configurations change infrequently.
- The data is tenant-scoped.
- The entire locale collection is small.

---

## Example Cache

```text
tenant-locales:tenant-123
```

Example cached representation:

```json
{
  "locales": [
    {
      "locale_code": "en-IN",
      "language_code": "en",
      "country_code": "IN",
      "display_name": "English (India)",
      "is_default": true,
      "text_direction": "ltr",
      "is_active": true
    },
    {
      "locale_code": "hi-IN",
      "language_code": "hi",
      "country_code": "IN",
      "display_name": "Hindi (India)",
      "is_default": false,
      "text_direction": "ltr",
      "is_active": true
    }
  ]
}
```

---

## Cache Invalidation

Invalidate:

```text
tenant-locales:{tenant_id}
```

when:

- Locale is created.
- Locale is updated.
- Locale is activated.
- Locale is deactivated.
- Default locale changes.
- Tenant is archived.

---

## Default Locale Cache

If request latency is extremely sensitive, a separate cache entry can be considered:

```text
tenant-default-locale:{tenant_id}
```

However, this is not necessary initially.

The primary cache:

```text
tenant-locales:{tenant_id}
```

can contain the complete tenant locale configuration.

---

# 19. Security Considerations

The source identifies:

- Tenant-scoped administration.
- Locale validation.
- Audit logging.

These should form the baseline security controls.

---

## Tenant-Scoped Administration

Only authorized administrators should be able to:

- add locales,
- remove/deactivate locales,
- change default locale,
- modify locale metadata.

---

## Locale Validation

The system should validate:

```text
locale_code
language_code
country_code
text_direction
```

against supported localization rules.

For example:

```text
en-IN
```

should resolve to:

```text
language = English
country = India
direction = LTR
```

while:

```text
ar-AE
```

should resolve appropriately for Arabic and RTL rendering.

---

## Prevent Invalid Default State

The system must prevent:

```text
No default locale
```

when the tenant requires a default.

It must also prevent:

```text
Multiple default locales
```

through database and application enforcement.

---

## Authorization

Changing the default locale can affect:

- user interfaces,
- reports,
- notifications,
- documents.

Therefore it should require a suitable tenant administration permission.

---

## Tenant Isolation

Locale data should always be resolved within tenant context.

Never resolve:

```sql
SELECT *
FROM tenant_locales
WHERE locale_code = :locale_code;
```

as an authorization decision by itself.

The same locale may legitimately belong to many tenants.

The tenant context is essential.

---

# 20. Audit Requirements

The source defines four events:

| Event | Trigger | Purpose |
|---|---|---|
| `TenantLocaleCreated` | New locale added | Record introduction of a supported locale |
| `TenantLocaleUpdated` | Locale metadata changed | Track configuration changes |
| `TenantDefaultLocaleChanged` | Default locale changed | Track tenant-wide localization changes |
| `TenantLocaleArchived` | Locale disabled/archived | Preserve lifecycle history |

---

## Recommended Audit Payload

Example:

```json
{
  "event": "TenantDefaultLocaleChanged",
  "tenant_id": "tenant-uuid",
  "actor_id": "user-uuid",
  "previous_locale": "en-IN",
  "new_locale": "ml-IN",
  "timestamp": "2026-08-15T10:30:00Z"
}
```

This is more useful than simply recording:

```text
TenantDefaultLocaleChanged
```

because administrators and support engineers need to know exactly what changed.

---

## Locale Creation

Example:

```json
{
  "event": "TenantLocaleCreated",
  "tenant_id": "tenant-uuid",
  "locale_code": "hi-IN",
  "actor_id": "user-uuid"
}
```

---

## Locale Archival

The audit trail should preserve:

```text
tenant
locale
actor
time
reason where available
```

without deleting the historical event.

---

# 21. Event Producers / Event Consumers

## Event Producers

The source identifies:

```text
TenantLocaleCreated
TenantLocaleUpdated
```

Typical producer flow:

```text
Tenant Administration UI
        ↓
Locale API
        ↓
Tenant Locale Service
        ↓
tenant_locales
```

---

## Event Consumers

The source identifies:

- UI.
- Notifications.
- Translation.
- Reporting.
- Document Generator.

Additional logical consumers include:

| Consumer | Purpose |
|---|---|
| UI | Build tenant language-selection and localized interfaces |
| Notifications | Select localized notification templates |
| Translation Service | Resolve supported language configuration |
| Reporting | Format regional output |
| Document Generator | Produce locale-aware documents |
| Email Service | Select localized templates |
| Cache Manager | Invalidate locale cache |
| Audit Service | Persist configuration changes |

---

## Example Event Flow

```text
Administrator Adds Malayalam
            ↓
Locale API
            ↓
tenant_locales INSERT
            ↓
TenantLocaleCreated
            ↓
Event Bus
      ┌─────┼────────────┐
      ▼     ▼            ▼
     UI  Translation  Notifications
```

For default locale changes:

```text
Administrator
      ↓
Change Default Locale
      ↓
Database Transaction
      ↓
TenantDefaultLocaleChanged
      ↓
Event Bus
      ├── UI
      ├── Notifications
      ├── Reporting
      ├── Document Generator
      └── Cache Manager
```

---

# 22. Alternative Designs Considered

| Option | Description | Verdict |
|---|---|---|
| A | Store locale configuration in `tenant_settings` | **Rejected** |
| B | JSON locale collection inside `tenant_settings` | **Rejected** |
| C | Store locale as user preferences | **Rejected** |
| **D** | Dedicated `tenant_locales` table | **Chosen** |

---

## Option A — Store in `tenant_settings`

Example:

```text
tenant_settings
    default_language
    default_timezone
```

This works for the tenant's default.

It does **not** adequately represent:

```text
Tenant supports
    en-US
    en-GB
    fr-CA
    ar-AE
```

Therefore the source explicitly separates tenant locales from general settings.

---

## Option B — JSON Locale Collection

Example:

```json
{
  "locales": [
    {
      "code": "en-IN",
      "default": true
    },
    {
      "code": "hi-IN",
      "default": false
    }
  ]
}
```

Rejected as the primary model because locale configurations have:

- stable fields,
- relational ownership,
- uniqueness requirements,
- default-state constraints,
- activation state.

A relational table provides stronger database-level guarantees.

---

## Option C — Store Locale in User Preferences

Rejected because:

```text
Tenant supports a locale
```

and:

```text
User prefers a locale
```

are fundamentally different concepts.

For example:

```text
Tenant supports:
    English
    Hindi
    Malayalam

User A prefers:
    Malayalam
```

The user preference depends on the tenant-supported locale set.

Therefore tenant-level support must exist independently.

---

## Option D — Dedicated `tenant_locales`

**Chosen.**

It provides:

- Multiple locale support.
- Strong tenant isolation.
- Composite uniqueness.
- One-default enforcement.
- Activation/deactivation.
- Efficient querying.
- Clear ownership.
- Clean integration with localization consumers.

This matches the existing source design.

---

# 23. Final Design Assessment

| Attribute | Rating |
|---|---|
| Complexity | Low |
| Read Volume | **High** |
| Write Volume | **Very Low** |
| Security Importance | Medium |
| Business Criticality | **High** |
| Scalability | Excellent |
| Data Volatility | Low |
| Localization Importance | **Very High** |
| Recommended Status | **Core Supporting Table** |

## Overall Assessment

`tenant_locales` is a relatively small configuration table, but it provides a critical boundary for InsureIQ's internationalization architecture.

Its purpose is to answer:

> **Which language and regional configurations does this tenant support, and which one is the default?**

That is fundamentally different from asking:

> **What is the tenant's default language?**

The latter belongs in:

```text
tenant_settings
```

while the former belongs in:

```text
tenant_locales
```

The resulting architecture is:

```text
                         Tenant
                           │
                           │ 1
                           ▼
                 ┌───────────────────┐
                 │   tenant_settings │
                 │                   │
                 │ default_language  │
                 │ default_timezone  │
                 └───────────────────┘

                           │
                           │ 1:N
                           ▼
                 ┌───────────────────┐
                 │   tenant_locales  │
                 ├───────────────────┤
                 │ id                │
                 │ tenant_id         │
                 │ locale_code       │
                 │ language_code     │
                 │ country_code      │
                 │ display_name      │
                 │ is_default        │
                 │ text_direction    │
                 │ is_active          │
                 │ created_at        │
                 │ updated_at        │
                 └─────────┬─────────┘
                           │
             ┌─────────────┼──────────────┐
             ▼             ▼              ▼
            UI       Notifications     Reporting
                           │
                           ▼
                      Translation
```

The critical production invariants are:

1. **A tenant may have multiple locale configurations.**
2. **`(tenant_id, locale_code)` must be unique.**
3. **Every locale belongs to exactly one tenant.**
4. **A tenant should have exactly one default locale.**
5. **`is_default` must be database-enforced, not merely UI-enforced.**
6. **`is_active` allows locales to be disabled without destroying historical configuration.**
7. **`locale_code` identifies the language-region combination; it is not translation content.**
8. **User language preferences belong to the Identity/User domain, not this table.**
9. **Translation strings belong to a localization/translation subsystem, not this table.**
10. **Tenant locale configuration should be cached under `tenant-locales:{tenant_id}`.**
11. **Locale changes should invalidate that cache.**
12. **Locale administration must be tenant-scoped and RBAC-controlled.**
13. **RTL support must be represented explicitly through `text_direction`.**
14. **Default-locale changes must be audited.**
15. **The table should remain small and configuration-oriented rather than becoming a translation repository.**

The final business model is therefore:

```text
Tenant
   │
   ├── General Operational Defaults
   │       ↓
   │   tenant_settings
   │
   └── Supported Regional Configurations
           ↓
       tenant_locales
           │
           ├── en-IN
           ├── hi-IN
           ├── ml-IN
           └── ...
```

This preserves the source design's intended role for `tenant_locales`: **the tenant-scoped regional and localization configuration layer that enables InsureIQ to support multilingual, international, and RTL experiences without mixing locale configuration with user preferences or translation content.**

**Step 3 — `tenant_locales` is complete.**

The next step is **Step 4 — package this exact documentation into `Module_01_Table_08_tenant_locales.md`**.
