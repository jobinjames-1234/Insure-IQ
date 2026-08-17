# Step 3 — Table 7: `tenant_settings`

The `tenant_settings` table centralizes **tenant-wide operational configuration** while keeping configuration concerns separate from the tenant's core identity and business data.

The InsureIQ module inventory identifies this as **Table 7** of Tenant Management, with the purpose **“Tenant-wide application settings.”**

The existing table design defines it as the tenant's configurable operational preferences, including language, timezone, currency, date/time formatting, session timeout, notification defaults, and workflow defaults.

This table is deliberately different from `tenant_branding`, `tenant_locales`, and `tenant_security_settings`:

```text
tenant_branding
    → visual identity

tenant_locales
    → supported language/locale configurations

tenant_security_settings
    → security policy

tenant_settings
    → general operational defaults
```

That separation is important for keeping the Tenant Management bounded context maintainable as InsureIQ grows.

---

# 1. Why This Table Exists

A production multi-tenant SaaS platform needs configuration that changes how the application behaves for a particular tenant.

Different insurers may have different operational preferences.

For example:

```text
Tenant A
    Language: English
    Timezone: Asia/Kolkata
    Currency: INR
    Date Format: DD/MM/YYYY
    Time Format: 24-hour
    Notifications: Enabled
    Auto Assignment: Enabled
```

while:

```text
Tenant B
    Language: English
    Timezone: America/New_York
    Currency: USD
    Date Format: MM/DD/YYYY
    Time Format: 12-hour
    Notifications: Enabled
    Auto Assignment: Disabled
```

The application therefore needs a tenant-specific configuration layer.

The existing design explicitly states that `tenant_settings` centralizes tenant-specific operational configuration while keeping business data separate from configuration data.

Without this table, these values could end up scattered across:

```text
tenants
user_preferences
application configuration
environment variables
hard-coded defaults
```

That would create several problems:

- Tenant-specific behavior would become difficult to manage.
- Configuration would become mixed with tenant identity.
- Different services could implement different defaults.
- Configuration caching would become difficult.
- Administrators would lack a central configuration surface.
- Configuration changes would be harder to audit.
- Business logic would become coupled to global application defaults.

The purpose of this table is therefore to establish:

```text
Global Platform Defaults
          +
Tenant Overrides
          ↓
Effective Tenant Configuration
```

---

# 2. Business Definition

A **Tenant Setting** represents a configurable operational preference that determines how InsureIQ behaves for a particular tenant.

The source explicitly identifies these examples:

- Language.
- Timezone.
- Currency.
- Date/time format.
- Session timeout.
- Notification defaults.
- Workflow defaults.

The conceptual structure is:

```text
Tenant
│
└── Tenant Settings
      │
      ├── Localization Defaults
      │      ├── Language
      │      └── Timezone
      │
      ├── Financial Formatting
      │      └── Currency
      │
      ├── Date/Time Formatting
      │      ├── Date Format
      │      └── Time Format
      │
      ├── Session Defaults
      │      └── Session Timeout
      │
      ├── Notification Defaults
      │      └── Notifications Enabled
      │
      └── Workflow Defaults
             └── Auto Assignment
```

The important word is **defaults**.

A tenant setting generally establishes the default behavior for the tenant. It does not necessarily override every individual user's preference.

For example:

```text
Tenant Settings
    default_language = en

User Preferences
    language = ml
```

The tenant establishes the default while the user may have a more specific preference.

---

# 3. Critical Design Principle — What the Entity IS and IS NOT

## The Tenant Setting IS

- Operational configuration.
- Tenant-owned metadata.
- A configuration resource.
- A child entity of the Tenant aggregate.
- A centralized source for tenant-wide defaults.
- Configuration consumed by multiple application services.

## The Tenant Setting IS NOT

- Business transaction data.
- Branding.
- Subscription information.
- Billing configuration.
- A user's personal preference.
- A complete security-policy store.
- A locale registry.
- A feature-entitlement store.
- A module licensing store.

This distinction is important because InsureIQ already has specialized tables for several of these concerns.

For example:

```text
tenant_settings
      ↓
general operational defaults

tenant_branding
      ↓
visual presentation

tenant_locales
      ↓
supported locale configurations

tenant_security_settings
      ↓
security policy

tenant_features
      ↓
feature entitlements

tenant_modules
      ↓
module provisioning
```

The source explicitly states that Tenant Settings are **not branding or subscription information**.

---

# 4. Aggregate Root Analysis — DDD Structure

```text
Tenant
│
├── Tenant Settings
│      │
│      ├── Localization
│      ├── Security Defaults
│      ├── Workflow Defaults
│      ├── Notifications
│      └── Formatting
│
├── Tenant Profile
├── Tenant Addresses
├── Tenant Contacts
├── Tenant Domains
├── Tenant Branding
├── Tenant Locales
├── Tenant Features
├── Tenant Modules
└── ...
```

The `Tenant` remains the **Aggregate Root**.

`tenant_settings` is a configuration entity owned by the tenant.

The existing source models it directly under Tenant.

---

## Aggregate invariant

There should be exactly one current settings record for each tenant:

```text
Tenant
   │
   └── Tenant Settings
```

Therefore:

```text
tenant_settings.tenant_id
```

must be unique.

This gives the database-level invariant:

```text
ONE TENANT
    ↓
ONE CURRENT SETTINGS RECORD
```

---

# 5. Business Capabilities Supported

| Capability | Supported |
|---|---|
| Tenant-wide localization defaults | Yes |
| Default language | Yes |
| Default timezone | Yes |
| Default currency | Yes |
| Date formatting | Yes |
| Time formatting | Yes |
| Session timeout default | Yes |
| Notification defaults | Yes |
| Workflow defaults | Yes |
| Automatic assignment default | Yes |
| Tenant operational configuration | Yes |
| User-specific preferences | No |
| Visual branding | No |
| Feature licensing | No |
| Module licensing | No |
| Detailed security policy | No — dedicated table |
| Subscription management | No |

The capabilities directly correspond to the existing source definition.

---

# 6. Multi-Tenant / Ownership / Isolation Notes

Every settings record belongs to exactly one tenant.

```text
Tenant A
    ↓
tenant_settings A

Tenant B
    ↓
tenant_settings B
```

There must never be a shared settings row that multiple tenants can modify.

---

## Tenant Isolation

An authenticated administrator operating within Tenant A must only be able to access:

```text
tenant_settings
WHERE tenant_id = Tenant A
```

and never Tenant B's configuration.

The recommended access pattern is:

```sql
SELECT *
FROM tenant_settings
WHERE tenant_id = :authenticated_tenant_id;
```

rather than trusting an arbitrary tenant identifier supplied by the client.

---

## Configuration Hierarchy

A production implementation should distinguish between:

```text
Platform Default
       ↓
Tenant Setting
       ↓
User Preference
       ↓
Request-specific override
```

For example:

```text
Platform
    time_format = 24_hour

Tenant A
    time_format = 12_hour

User A
    time_format = 24_hour
```

The effective value can therefore be determined according to precedence.

This prevents `tenant_settings` from becoming a substitute for every other configuration layer.

---

# 7. Lifecycle

## Creation

The source defines:

```text
Tenant Created
      ↓
Default Settings Generated
```

This means tenant provisioning should normally create the settings record automatically.

A new tenant should not need an administrator to manually create the initial configuration before the application can operate.

---

## Initial Defaults

The source specifies these defaults:

```text
default_language         = en
default_timezone         = UTC
default_currency         = USD
date_format              = YYYY-MM-DD
time_format              = 12/24-hour enum
session_timeout_minutes  = 30
notifications_enabled    = TRUE
workflow_auto_assignment = FALSE
```

These defaults provide deterministic behavior immediately after tenant creation.

---

## Growth / Usage

As the tenant begins operating:

```text
Tenant Created
      ↓
Default Settings
      ↓
Administrator Configuration
      ↓
Tenant-Specific Defaults
      ↓
Operational Use
```

Administrators may change settings based on:

- business policy,
- geographic location,
- operational requirements,
- notification preferences,
- workflow requirements.

---

## Modification

Typical modifications include:

```text
Timezone Changed
Currency Changed
Date Format Changed
Time Format Changed
Session Timeout Changed
Notifications Enabled/Disabled
Auto Assignment Enabled/Disabled
```

Each change should update:

```text
updated_at
```

and generate the appropriate audit/event record.

---

## Archival

The source defines:

```text
Tenant Archived
      ↓
Settings Archived
```

Because this is a one-to-one configuration table, archival does not necessarily mean physically deleting the row.

Historical configuration can be useful for:

- audit,
- support,
- compliance,
- reconstruction of past behavior.

---

# 8. Proposed Schema

## Table Name

`tenant_settings`

## Primary Key Strategy

**UUID**

The source explicitly defines:

```text
Primary Key: UUID
```

Therefore:

```text
id UUID PRIMARY KEY
```

is retained.

---

## Schema Definition

The source provides the following fields.

For the production-grade schema documentation standard, they are expanded into the full field definition:

| Field Name | Data Type | Key | Specification | Reason Field Exists |
|---|---|---|---|---|
| `id` | UUID | PK | `NOT NULL` | Stable unique identity of the tenant settings record |
| `tenant_id` | UUID | FK + UK → `tenants.id` | `NOT NULL UNIQUE` | Establishes the one-to-one ownership relationship |
| `default_language` | VARCHAR(10) | — | `NOT NULL DEFAULT 'en'` | Defines the default language for tenant operations |
| `default_timezone` | VARCHAR(100) | — | `NOT NULL DEFAULT 'UTC'` | Defines the timezone used for tenant-local operations |
| `default_currency` | CHAR(3) | — | `NOT NULL DEFAULT 'USD'` | Defines the tenant's default currency |
| `date_format` | VARCHAR(20) | — | `NOT NULL DEFAULT 'YYYY-MM-DD'` | Defines how dates are presented to users |
| `time_format` | ENUM | — | `NOT NULL DEFAULT '24_hour'` | Defines 12-hour or 24-hour time presentation |
| `session_timeout_minutes` | INTEGER | — | `NOT NULL DEFAULT 30` | Provides the tenant-wide session timeout default |
| `password_expiry_days` | INTEGER | — | `NULL` | Provides a tenant-level password-expiry default where applicable |
| `notifications_enabled` | BOOLEAN | — | `NOT NULL DEFAULT TRUE` | Defines the tenant-wide notification default |
| `workflow_auto_assignment` | BOOLEAN | — | `NOT NULL DEFAULT FALSE` | Defines whether supported workflows automatically assign work |
| `created_at` | TIMESTAMPTZ | — | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Records when the settings record was created |
| `updated_at` | TIMESTAMPTZ | — | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Records when the settings record was last changed |

---

## Important Source-vs-Production Note

The source gives:

```text
time_format
```

as an ENUM with:

```text
12/24 hour
```

and defines the other defaults shown above.

The source does **not** specify:

- exact maximum lengths for every field,
- explicit database `CHECK` expressions,
- `archived_at`,
- a settings version,
- an explicit settings status.

Therefore these should not silently be presented as source-defined requirements.

For production implementation, those can be added deliberately if the broader architecture requires them.

---

## `default_language`

The source uses:

```text
VARCHAR(10)
DEFAULT en
```

This should be interpreted as the tenant's default language identifier, not necessarily a complete list of supported locales.

For example:

```text
en
```

may be the default language while:

```text
tenant_locales
```

handles the tenant's supported language-region combinations.

---

## `default_timezone`

The source specifies:

```text
VARCHAR(100)
DEFAULT UTC
```

This should preferably contain an IANA timezone identifier such as:

```text
UTC
Asia/Kolkata
America/New_York
Europe/London
```

rather than a raw numeric offset.

This matters because timezone offsets change with daylight-saving rules in many jurisdictions.

---

## `default_currency`

The source specifies:

```text
CHAR(3)
DEFAULT USD
```

This naturally corresponds to ISO-style three-letter currency codes.

Examples:

```text
USD
INR
EUR
GBP
AED
```

The setting establishes the default tenant currency; it does not necessarily mean every policy, premium, claim, or transaction must use that currency.

---

# 9. Enum Definitions

## `time_format`

The source defines two values:

| Value | Description |
|---|---|
| `12_hour` | Display time using a 12-hour clock with AM/PM |
| `24_hour` | Display time using a 24-hour clock |

This setting affects presentation.

It should not alter how timestamps are stored.

---

## Timestamp Storage Principle

Even when:

```text
time_format = 12_hour
```

timestamps should remain stored as an unambiguous temporal type such as:

```text
TIMESTAMPTZ
```

The formatting decision belongs at the presentation layer.

For example:

```text
Database
    2026-08-15 14:30:00+05:30

12-hour UI
    2:30 PM

24-hour UI
    14:30
```

The stored instant remains the same.

---

# 10. Why `tenant_id` Exists

`tenant_id` establishes the one-to-one relationship between the tenant and its operational configuration.

The relationship is:

```text
tenants.id
    │
    │ 1
    ▼
tenant_settings.tenant_id
    │
    │ 1
    ▼
Tenant Settings
```

It therefore has three simultaneous responsibilities:

1. Ownership.
2. Tenant isolation.
3. One-to-one uniqueness.

---

## Why `tenant_id` must be UNIQUE

Without:

```sql
UNIQUE(tenant_id)
```

the database could contain:

```text
Tenant A
   ├── Settings Record 1
   ├── Settings Record 2
   └── Settings Record 3
```

This would make the phrase:

```text
"the tenant's settings"
```

ambiguous.

The unique constraint guarantees:

```text
Tenant A
   ↓
exactly one current settings row
```

---

## Why settings are not embedded in `tenants`

The tenant root already contains identity and lifecycle information.

Adding:

```text
default_language
default_timezone
default_currency
date_format
time_format
session_timeout_minutes
notifications_enabled
workflow_auto_assignment
```

directly into `tenants` would make the root increasingly responsible for unrelated configuration.

The separation is:

```text
tenants
    ↓
WHO IS THE TENANT?

tenant_settings
    ↓
HOW SHOULD THE PLATFORM BEHAVE FOR THIS TENANT?
```

---

# 11. Candidate Keys

| Key Type | Field(s) | Rationale |
|---|---|---|
| Primary Key | `id` | Stable technical identity |
| Alternate / Candidate Key | `tenant_id` | One current settings record per tenant |

---

## Why `default_language` is not a candidate key

Many tenants can use:

```text
en
```

so it cannot uniquely identify a settings record.

Likewise:

```text
USD
UTC
YYYY-MM-DD
```

are shared configuration values, not identities.

---

# 12. Constraints

The source explicitly requires:

```text
PK(id)
FK(tenant_id)
UNIQUE(tenant_id)
```

For production implementation, the full constraint set should include:

| Constraint | Definition | Reason |
|---|---|---|
| Primary Key | `PK(id)` | Stable settings identity |
| Tenant FK | `tenant_id → tenants.id` | Establishes ownership |
| One-to-One | `UNIQUE(tenant_id)` | Prevents multiple current settings rows |
| Required Language | `default_language NOT NULL` | Deterministic default |
| Required Timezone | `default_timezone NOT NULL` | Tenant-local time handling |
| Required Currency | `default_currency NOT NULL` | Deterministic financial formatting |
| Required Date Format | `date_format NOT NULL` | Deterministic presentation |
| Required Time Format | `time_format NOT NULL` | Deterministic time presentation |
| Positive Session Timeout | `session_timeout_minutes > 0` | Prevent invalid timeout configuration |
| Notification Default | `notifications_enabled NOT NULL` | Explicit operational state |
| Workflow Default | `workflow_auto_assignment NOT NULL` | Explicit operational state |
| Timestamp Integrity | `created_at`, `updated_at NOT NULL` | Lifecycle tracking |

---

## Session Timeout Constraint

A basic database constraint can prevent invalid values:

```sql
CHECK (session_timeout_minutes > 0)
```

However, an upper bound is a business-policy decision.

For example, the database should not arbitrarily impose:

```sql
CHECK (session_timeout_minutes <= 60)
```

unless the product requirements explicitly establish that limit.

---

## Password Expiry

The source marks:

```text
password_expiry_days
```

as optional.

Therefore:

```text
NULL
```

should have an intentional meaning.

A reasonable interpretation is:

```text
NULL
    ↓
No tenant-specific password expiry override
    ↓
Use platform/security policy
```

If the platform later makes password expiry a dedicated security concern, this field should remain subordinate to `tenant_security_settings`.

That separation is especially important because the module already contains a dedicated `tenant_security_settings` table.

---

# 13. Relationships

## Incoming References

The existing source identifies these consumers:

- Authentication.
- Notifications.
- Workflow.
- Reporting.

Additional logical consumers include:

- Web Application.
- Document Generation.
- Localization Service.
- API services.
- Scheduling services.
- User-session services.

---

## Outgoing References

```text
tenant_settings.tenant_id
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
                      1 │ 1
                        │
                        ▼
              ┌──────────────────┐
              │  tenant_settings │
              ├──────────────────┤
              │ id               │
              │ tenant_id        │
              │ default_language │
              │ timezone         │
              │ currency         │
              │ date_format      │
              │ time_format      │
              │ session_timeout  │
              │ notifications   │
              │ workflow_default │
              └────────┬─────────┘
                       │
          ┌────────────┼─────────────┐
          ▼            ▼             ▼
     Authentication  Workflow    Notifications
```

---

# 14. Cardinality Analysis

| Relationship | Expected Cardinality |
|---|---:|
| Tenant → Settings | Exactly 1 |
| Settings → Tenant | Exactly 1 |
| Settings → Users | Indirect |
| Settings → Workflows | Indirect |
| Settings → Notifications | Indirect |
| Settings → Reports | Indirect |

---

## Platform Scale

If InsureIQ has:

```text
100,000 tenants
```

then the expected number of current settings records is approximately:

```text
100,000
```

This table is therefore tiny from a storage perspective.

The important characteristics are:

```text
High read frequency
Low write frequency
Strict tenant isolation
Strong consistency
```

---

# 15. Query Patterns

## Retrieve Tenant Settings

The primary query is:

```sql
SELECT *
FROM tenant_settings
WHERE tenant_id = :tenant_id;
```

---

## Retrieve Localization Defaults

```sql
SELECT
    default_language,
    default_timezone
FROM tenant_settings
WHERE tenant_id = :tenant_id;
```

---

## Retrieve Formatting Configuration

```sql
SELECT
    default_currency,
    date_format,
    time_format
FROM tenant_settings
WHERE tenant_id = :tenant_id;
```

---

## Retrieve Session Configuration

```sql
SELECT
    session_timeout_minutes
FROM tenant_settings
WHERE tenant_id = :tenant_id;
```

---

## Retrieve Notification Default

```sql
SELECT
    notifications_enabled
FROM tenant_settings
WHERE tenant_id = :tenant_id;
```

---

## Retrieve Workflow Default

```sql
SELECT
    workflow_auto_assignment
FROM tenant_settings
WHERE tenant_id = :tenant_id;
```

---

## Retrieve Settings for Administrative Display

```sql
SELECT
    default_language,
    default_timezone,
    default_currency,
    date_format,
    time_format,
    session_timeout_minutes,
    password_expiry_days,
    notifications_enabled,
    workflow_auto_assignment,
    updated_at
FROM tenant_settings
WHERE tenant_id = :tenant_id;
```

This avoids returning unnecessary columns when the administration interface only needs configuration metadata.

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

Provides direct record identity.

---

## Unique Tenant Index

```sql
UNIQUE(tenant_id)
```

This is the most important operational index.

It simultaneously:

- enforces the one-to-one relationship,
- supports tenant lookup,
- prevents duplicate settings rows.

Therefore an additional ordinary index on `tenant_id` is unnecessary.

---

## No Index on Individual Settings

The following normally should **not** receive individual indexes:

```text
default_language
default_timezone
default_currency
date_format
time_format
session_timeout_minutes
notifications_enabled
workflow_auto_assignment
```

Why?

Because the normal query pattern is:

```text
WHERE tenant_id = ?
```

not:

```text
WHERE default_currency = ?
```

A query such as:

```sql
SELECT tenant_id
FROM tenant_settings
WHERE default_currency = 'USD';
```

is possible, but it is generally an administrative/reporting query rather than a core runtime lookup.

At approximately one row per tenant, these indexes would provide little value at normal scale.

---

# 17. Read / Write Characteristics

The source classifies:

```text
Reads: Very High
Writes: Very Low
```

This is appropriate.

---

## Read Workload

Settings can be needed by:

```text
Authentication
Notifications
Workflow
Reporting
Web UI
Document Generation
Scheduling
```

A tenant's configuration may therefore be accessed repeatedly during normal application operation.

---

## Write Workload

Writes are comparatively rare.

Typical write operations include:

```text
Administrator changes timezone
Administrator changes currency
Administrator changes date format
Administrator changes session timeout
Administrator changes notification defaults
Administrator changes workflow defaults
```

These events happen far less frequently than ordinary business transactions.

---

## Delete Workload

Physical deletion should be extremely rare.

When a tenant is archived:

```text
Tenant Archived
      ↓
Settings Retained / Archived
```

rather than:

```text
DELETE FROM tenant_settings
```

This preserves historical context.

---

# 18. Caching Strategy

The source explicitly recommends:

```text
tenant-settings:{tenant_id}
```

in Redis.

This is an appropriate cache key because settings are:

- tenant-specific,
- frequently read,
- rarely changed.

---

## Example

```text
tenant-settings:tenant-123
```

Cached value:

```json
{
  "default_language": "en",
  "default_timezone": "Asia/Kolkata",
  "default_currency": "INR",
  "date_format": "DD/MM/YYYY",
  "time_format": "24_hour",
  "session_timeout_minutes": 30,
  "password_expiry_days": null,
  "notifications_enabled": true,
  "workflow_auto_assignment": false
}
```

---

## Cache Invalidation

Invalidate:

```text
tenant-settings:{tenant_id}
```

when:

- Settings are created.
- Settings are updated.
- Localization defaults change.
- Formatting changes.
- Session defaults change.
- Notification defaults change.
- Workflow defaults change.

---

## Event-Driven Cache Invalidation

A preferred architecture is:

```text
Admin Update
     ↓
tenant_settings UPDATE
     ↓
Commit Transaction
     ↓
TenantSettingsUpdated
     ↓
Event Bus
     ↓
Cache Invalidation
```

The cache should not be treated as the authoritative source.

PostgreSQL remains authoritative.

---

## Why not cache settings globally?

Do not use:

```text
tenant-settings
```

as a single shared cache key.

That risks:

```text
Tenant A settings
       ↓
overwrites
       ↓
Tenant B settings
```

The tenant identifier must be part of the key:

```text
tenant-settings:{tenant_id}
```

---

# 19. Security Considerations

The source identifies:

- Tenant-scoped administration.
- RBAC.
- Validation.
- Audit logging.

These are the core controls.

---

## Tenant-Scoped Administration

Only authorized tenant administrators should be able to modify settings.

The application should enforce:

```text
Authenticated User
        ↓
Tenant Membership
        ↓
Permission Check
        ↓
Tenant Settings Update
```

---

## RBAC

Not every user should necessarily be able to change:

```text
session_timeout_minutes
password_expiry_days
workflow_auto_assignment
```

For example:

```text
Tenant Administrator
    → allowed

Ordinary Employee
    → denied
```

The exact permissions belong to the Identity & Access Management module.

---

## Validation

Configuration values must be validated before persistence.

Examples:

```text
timezone
    → valid IANA timezone

currency
    → valid supported currency

language
    → supported language identifier

time_format
    → valid enum

session_timeout
    → positive integer
```

---

## Security Boundary Clarification

Although the source includes:

```text
session_timeout_minutes
password_expiry_days
```

in `tenant_settings`, the platform also contains a dedicated:

```text
tenant_security_settings
```

table.

Therefore the architecture must establish precedence clearly.

General operational defaults belong here.

Security-enforcement policies should ultimately be governed by the dedicated security configuration.

This prevents security logic from becoming scattered across multiple configuration tables.

---

## Auditability

Configuration changes can affect application behavior.

Therefore administrators should not be able to modify settings without producing an audit trail.

---

# 20. Audit Requirements

The source defines these events:

| Event | Trigger | Purpose |
|---|---|---|
| `TenantSettingsCreated` | Initial settings generated | Establish configuration provenance |
| `TenantSettingsUpdated` | General settings modified | Track configuration changes |
| `TenantLocalizationChanged` | Language/timezone configuration changed | Track localization changes |
| `TenantSecuritySettingsChanged` | Security-related setting changed | Track security-impacting configuration changes |

---

## Recommended Audit Payload

For a general update:

```json
{
  "event": "TenantSettingsUpdated",
  "tenant_id": "tenant-uuid",
  "actor_id": "user-uuid",
  "changed_fields": [
    "default_timezone",
    "default_currency"
  ],
  "timestamp": "2026-08-15T10:30:00Z"
}
```

The audit record should capture:

- tenant,
- actor,
- changed fields,
- timestamp,
- relevant before/after values where policy permits.

---

## Configuration Changes Should Be Field-Aware

Instead of simply recording:

```text
TenantSettingsUpdated
```

with no context, the audit system should ideally know:

```text
default_timezone:
    UTC → Asia/Kolkata

default_currency:
    USD → INR
```

This becomes important for operational troubleshooting.

---

# 21. Event Producers / Event Consumers

## Event Producers

The source identifies:

- `TenantSettingsCreated`
- `TenantSettingsUpdated`.

Typical producers:

```text
Tenant Administration UI
        ↓
Settings API
        ↓
Tenant Settings Service
```

---

## Event Consumers

The source identifies:

- Authentication.
- Notifications.
- Workflow.
- Reporting.

Additional logical consumers include:

| Consumer | Purpose |
|---|---|
| Authentication | Apply relevant session/default configuration |
| Notifications | Determine tenant notification defaults |
| Workflow Engine | Apply workflow defaults |
| Reporting | Format dates, times and tenant reports |
| Document Generator | Format generated documents |
| UI | Apply tenant operational defaults |
| Audit Service | Record configuration changes |
| Cache Manager | Invalidate tenant settings cache |

---

## Example Workflow

```text
Administrator
      ↓
Changes Timezone
      ↓
Tenant Settings API
      ↓
tenant_settings UPDATE
      ↓
Transaction Commit
      ↓
TenantLocalizationChanged
      ↓
Event Bus
      ├── Reporting
      ├── Notifications
      ├── Document Generator
      └── Cache Manager
```

This allows downstream services to react without coupling every service directly to the database.

---

# 22. Alternative Designs Considered

| Option | Description | Verdict |
|---|---|---|
| A | Store settings directly in `tenants` | **Rejected** |
| B | Store all configuration in JSON | **Rejected** |
| C | Store settings in `tenant_branding` | **Rejected** |
| D | Store security settings here | **Rejected as primary security design** |
| **E** | Dedicated `tenant_settings` table | **Chosen** |

---

## Option A — Store in `tenants`

Example:

```text
tenants
├── default_language
├── default_timezone
├── default_currency
├── date_format
├── time_format
├── session_timeout
└── ...
```

Rejected because it makes the tenant root responsible for configuration.

---

## Option B — JSON Configuration

Example:

```json
{
  "localization": {
    "language": "en",
    "timezone": "UTC"
  },
  "workflow": {
    "auto_assignment": false
  }
}
```

Rejected as the primary design because the settings represented here are stable, well-defined fields.

A JSON-only approach would weaken:

- type safety,
- schema visibility,
- database constraints,
- migration discipline,
- direct querying,
- documentation clarity.

JSON can still be appropriate for genuinely dynamic settings in other parts of the architecture, but these core tenant defaults do not require it.

---

## Option C — Store Settings in `tenant_branding`

Rejected because branding is a presentation concern.

```text
tenant_branding
    → logo
    → colors
    → visual identity

tenant_settings
    → timezone
    → currency
    → workflow
    → notifications
```

Combining them would blur bounded-context responsibilities.

---

## Option D — Put All Security Settings Here

Rejected as the primary design because the module already defines:

```text
tenant_security_settings
```

as a dedicated security configuration table.

This is particularly important for production architecture.

Security policies deserve:

- stricter authorization,
- stronger auditing,
- potentially different encryption requirements,
- compliance controls.

Therefore `tenant_settings` should not become the security-policy catch-all.

---

## Option E — Dedicated `tenant_settings`

**Chosen.**

It provides:

- Clean tenant configuration separation.
- One configuration record per tenant.
- Strong tenant isolation.
- Efficient lookup.
- Simple caching.
- Clear operational semantics.
- Clean integration with multiple services.
- A stable location for tenant-wide defaults.

This matches the existing source design.

---

# 23. Final Design Assessment

| Attribute | Rating |
|---|---|
| Complexity | Low |
| Read Volume | **Very High** |
| Write Volume | **Very Low** |
| Security Importance | High |
| Business Criticality | **Very High** |
| Configuration Importance | **Critical** |
| Scalability | Excellent |
| Data Volatility | Low |
| Recommended Status | **Core Supporting Table** |

## Overall Assessment

`tenant_settings` is intentionally a small table, but it is a highly important configuration boundary.

Its purpose is to answer:

> **How should InsureIQ behave by default for this tenant?**

while other specialized tables answer:

```text
Who is the tenant?
    → tenants

What kind of organization is it?
    → tenant_profiles

Where is it located?
    → tenant_addresses

Who are its contacts?
    → tenant_contacts

What domain does it use?
    → tenant_domains

How does it look?
    → tenant_branding

How should it operate?
    → tenant_settings

Which locales does it support?
    → tenant_locales

Which features does it have?
    → tenant_features

Which modules does it have?
    → tenant_modules

What security policy applies?
    → tenant_security_settings
```

The resulting architecture is:

```text
                         Tenant
                           │
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
   tenant_branding   tenant_settings   tenant_security_settings
          │                │                │
          ▼                ▼                ▼
     Visual UI        Operations        Security Policy
```

The runtime configuration path becomes:

```text
Request
   ↓
Tenant Context
   ↓
Redis tenant-settings:{tenant_id}
   │
   ├── Cache Hit → Effective Settings
   │
   └── Cache Miss
          ↓
    tenant_settings
          ↓
        Cache
          ↓
    Effective Settings
```

The most important production decisions are:

1. **Exactly one current `tenant_settings` record should exist per tenant.**
2. **`tenant_id` must be a unique foreign key to `tenants.id`.**
3. **The table contains operational defaults, not business transactions.**
4. **Branding belongs in `tenant_branding`.**
5. **Supported locales belong in `tenant_locales`.**
6. **Detailed security policy belongs in `tenant_security_settings`.**
7. **User-specific preferences must not be stored here.**
8. **Tenant settings should be cached using `tenant-settings:{tenant_id}`.**
9. **Settings changes must invalidate the cache.**
10. **Only authorized tenant administrators should modify settings.**
11. **Timezone values should use stable timezone identifiers rather than raw offsets.**
12. **Currency should use standardized three-letter codes.**
13. **Stored timestamps should remain timezone-safe; `time_format` is presentation logic.**
14. **Settings changes should generate audit events.**
15. **The database should remain authoritative; Redis is only a cache.**

The core model is therefore:

```text
┌─────────────────────────────┐
│           Tenant            │
└──────────────┬──────────────┘
               │
             1 │ 1
               ▼
┌─────────────────────────────┐
│       tenant_settings       │
├─────────────────────────────┤
│ id                          │
│ tenant_id       UNIQUE FK   │
│ default_language            │
│ default_timezone            │
│ default_currency            │
│ date_format                 │
│ time_format                 │
│ session_timeout_minutes     │
│ password_expiry_days        │
│ notifications_enabled       │
│ workflow_auto_assignment    │
│ created_at                  │
│ updated_at                  │
└──────────────┬──────────────┘
               │
       ┌───────┼────────┐
       ▼       ▼        ▼
 Authentication Workflow Notifications
```

This preserves the source design's intended role for `tenant_settings`: **a centralized, tenant-scoped operational configuration layer supporting consistent behavior across the InsureIQ SaaS platform.**

**Step 3 — `tenant_settings` is complete.**

The next step is **Step 4 — package this exact documentation into `Module_01_Table_07_tenant_settings.md`**.
