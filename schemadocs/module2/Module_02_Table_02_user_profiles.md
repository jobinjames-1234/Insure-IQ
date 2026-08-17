# Step 5 — Table 2: `user_profiles`

## 1. Why This Table Exists

The `user_profiles` table stores the **personal profile information associated with a master `users` identity**.

The architectural separation is:

```text
users
  ↓
Who is this identity?

user_profiles
  ↓
What personal/profile information describes this identity?
```

The new Module 2 definition explicitly separates:

```text
users
user_profiles
user_addresses
user_contacts
user_preferences
user_settings
```

Therefore, `user_profiles` should not become another master-user table or a catch-all location for every piece of user information.

## 2. Business Definition

A **User Profile** represents the personal descriptive information associated with a master InsureIQ user identity.

It describes the person without defining:

- Their tenant membership.
- Their role.
- Their permissions.
- Their authentication credentials.
- Their sessions.
- Their department membership.
- Their team membership.

The relationship is:

```text
User
  │
  │ 1:1
  ▼
User Profile
```

The supplied module relationship overview explicitly identifies:

> User → User Profile (1:1)

Therefore, the intended model is a one-to-one extension of the master user identity.

## 3. Critical Design Principle — What the Entity IS and IS NOT

### The User Profile IS

- Personal descriptive information about a user.
- A subordinate identity record.
- An extension of `users`.
- A place for profile attributes that do not belong in the authentication or authorization model.
- Potentially the source for user-facing identity/display information.

### The User Profile IS NOT

- The master user identity.
- A login credential.
- A password record.
- An MFA record.
- A tenant membership.
- A role.
- A permission.
- A department.
- A team.
- A user session.
- An address book.
- A notification preference record.
- An account-security record.

### Separation from `user_contacts`

The new module explicitly contains both:

```text
user_profiles
user_contacts
```

Therefore contact information should not automatically be duplicated in `user_profiles`.

```text
user_profiles
    ↓
Personal identity/profile

user_contacts
    ↓
Contact mechanisms
```

## 4. Aggregate Root Analysis — DDD Structure

`user_profiles` should be treated as a **dependent identity component of the User aggregate**, rather than as an independent business aggregate.

```text
User
 │
 └── User Profile
```

The master identity remains:

```text
users.id
```

while the profile extends it:

```text
user_profiles.user_id
        │
        ▼
    users.id
```

### Why `users` Remains the Root

The identity exists independently of whether a complete profile exists.

```text
User Created
    │
    ▼
users
    │
    ├── Authentication Setup
    │
    └── Profile Completion
             │
             ▼
       user_profiles
```

### DDD Boundary

```text
User Identity Aggregate
        │
        ├── users
        │
        └── user_profiles

Tenant Aggregate
        │
        ├── Tenant configuration
        ├── Tenant resources
        └── Tenant policies
```

The user should not contain tenant-specific organizational state merely because the user belongs to a tenant.

## 5. Business Capabilities Supported

| Capability | `user_profiles` |
|---|---|
| Store personal profile | Yes |
| Store canonical identity | No — `users` |
| Store password | No |
| Store MFA | No |
| Store login history | No |
| Store addresses | No — `user_addresses` |
| Store contact mechanisms | No — `user_contacts` |
| Store UI preferences | No — `user_preferences` |
| Store account settings | No — `user_settings` |
| Store roles | No |
| Store tenant membership | No |
| Store department membership | No |
| Store team membership | No |
| Provide profile data for display | Yes |
| Support profile completion | Yes |

## 6. Multi-Tenant / Ownership / Isolation

The new module distinguishes:

```text
users
```

from:

```text
tenant_users
```

Therefore `user_profiles` should normally follow the identity model rather than becoming a tenant-specific duplicate.

```text
Tenant
  │
  ▼
tenant_users
  │
  ▼
users
  │
  ▼
user_profiles
```

### Why `tenant_id` Should Not Be Added Automatically

A simplistic implementation might create:

```text
user_profiles
----------------
id
tenant_id
user_id
...
```

But the supplied module definition does not establish that profiles are tenant-specific.

The current baseline should therefore be:

```text
users
   │
   │ 1:1
   ▼
user_profiles
```

with no tenant ownership field unless later requirements explicitly establish tenant-specific profiles.

### Important Future Consideration

If InsureIQ later determines that certain profile attributes are tenant-specific—for example:

```text
Employee ID
Job title
Office location
Tenant-specific display name
```

those should not automatically be added to `user_profiles`.

They may belong to an organizational membership table such as:

```text
tenant_users
```

## 7. Lifecycle

### Creation

```text
User Created
    │
    ▼
users
    │
    ▼
Profile Created
    │
    ▼
user_profiles
```

### Profile Completion

```text
Identity Created
       ↓
Profile Incomplete
       ↓
Profile Information Added
       ↓
Profile Complete
```

### Modification

```text
User
  │
  └── Profile Updated
```

### Deactivation

```text
users.status
      ↓
inactive / suspended / archived
```

The profile can normally remain preserved.

### Deletion

Preferred behavior:

```text
User Deactivated
      ↓
Profile Retained
```

rather than automatically destroying the profile.

## 8. Proposed Schema

### Table Name

`user_profiles`

### Primary Key Strategy

Two designs are possible:

**Option A — Dedicated UUID**

```text
user_profiles.id
```

**Option B — User ID as Primary Key**

```text
user_profiles.user_id
        PK + FK
```

For a strict 1:1 dependent table, **Option B is the cleaner baseline**.

### Recommended Design

```text
user_profiles
----------------
user_id PK/FK
...
```

### Important Source Limitation

The new Module 2 source does **not provide the physical field list for `user_profiles`**.

Therefore the following is a **proposed physical schema**, not a recovered source schema.

### Full Field-by-Field Schema Definition

| Field Name | Data Type | Key Type | Specification | Reason Field Exists |
|---|---|---|---|---|
| `user_id` | UUID | PK, FK | `NOT NULL`, references `users.id` | Makes the profile a strict 1:1 extension of the user identity |
| `display_name` | VARCHAR(200) | — | `NULL` | Provides a user-facing display representation independent of authentication identity |
| `middle_name` | VARCHAR(100) | — | `NULL` | Supports users whose personal name includes a middle name |
| `date_of_birth` | DATE | — | `NULL` | Stores date-of-birth information if required by the platform |
| `gender` | ENUM / VARCHAR | — | `NULL` | Stores gender information only if required by a supported business process |
| `profile_photo_url` | TEXT / VARCHAR | — | `NULL` | References the user's profile image |
| `bio` | TEXT | — | `NULL` | Provides optional descriptive profile information |
| `created_at` | TIMESTAMPTZ | — | `NOT NULL` | Records profile creation |
| `updated_at` | TIMESTAMPTZ | — | `NOT NULL` | Records profile modification |

### Important Schema Qualification

The following fields are **not established by the supplied source**:

```text
display_name
middle_name
date_of_birth
gender
profile_photo_url
bio
```

They are proposed because the table's stated purpose is **Personal profile**.

They must not be treated as confirmed InsureIQ requirements until supported by a detailed requirement or source document.

### Why `user_id` Is the Primary Key

The module explicitly defines:

```text
User → User Profile = 1:1
```

Therefore:

```text
user_profiles.user_id
```

can simultaneously function as:

```text
Primary Key
+
Foreign Key → users.id
```

This prevents multiple profiles for one user at the database level.

### Why `display_name`

A display name may differ from authentication identity.

### Why `middle_name`

Some users have a middle name or additional personal-name component.

### Why `date_of_birth`

Date of birth can be relevant in insurance-related contexts. However, the supplied Module 2 definition does **not** state that user date of birth is required.

### Why `gender`

Gender may be required by some insurance workflows, but the supplied Module 2 source does not establish gender as a required identity attribute.

### Why `profile_photo_url`

If implemented, storing the binary image directly in the identity database is not recommended. A reference to object storage is preferable.

### Why `bio`

A free-form biography is useful for internal user-facing profiles but is not a core identity requirement.

## 9. Enum Definitions

The supplied source does not define any `user_profiles` enums.

Therefore no enum should be considered authoritative at this stage.

If a `gender` field is eventually required, the exact allowed values must be established by InsureIQ requirements rather than introducing an undocumented enum vocabulary.

## 10. Why Key Field Exists

### `user_id`

This is the most important field.

It exists because the profile is an extension of a user identity.

```text
users.id
   │
   │ 1:1
   ▼
user_profiles.user_id
```

Using `user_id` as the primary key expresses the relationship directly.

### Why Not `profile_id`

An alternative is:

```text
profile_id PK
user_id UNIQUE FK
```

This works technically, but adds an identifier that provides little value when the profile has no independent business identity.

The recommended design therefore uses:

```text
user_id PK/FK
```

## 11. Candidate Keys

| Key Type | Field(s) | Status | Rationale |
|---|---|---|---|
| Primary Key | `user_id` | Recommended | Enforces 1:1 user/profile relationship |
| Candidate Key | `user_id` | Confirmed by design | Profile belongs to exactly one user |
| Candidate Key | None otherwise | — | Profile attributes should not be treated as identity keys |

No personal attribute such as `display_name`, `date_of_birth`, or `bio` should be considered a candidate key.

## 12. Constraints

| Constraint | Definition | Reason |
|---|---|---|
| Primary Key | `PK(user_id)` | Enforces one profile per user |
| Foreign Key | `FK(user_id) → users.id` | Maintains identity integrity |
| User ID Required | `user_id NOT NULL` | Every profile belongs to a user |
| Display Name | Nullable | Profile display information is optional |
| Date of Birth | Nullable | Not established as universally required |
| Gender | Nullable | Not established as universally required |
| Created Timestamp | `NOT NULL` | Profile creation must be traceable |
| Updated Timestamp | `NOT NULL` | Profile modifications must be traceable |

### Referential Integrity

A profile cannot exist without its master identity.

The reverse behavior must be deliberately selected. For InsureIQ's accountability requirements, soft deletion/retention is the safer baseline.

## 13. Relationships

### Parent Relationship

```text
users
  │
  │ 1:1
  ▼
user_profiles
```

This is the primary relationship explicitly defined by the module.

### Related Identity Tables

```text
users
 ├── user_profiles
 ├── user_addresses
 ├── user_contacts
 ├── user_preferences
 └── user_settings
```

These should remain separate concerns.

### Important Non-Relationships

`user_profiles` should not directly own:

```text
roles
permissions
tenant membership
departments
teams
sessions
passwords
MFA
login attempts
```

### Cross-Module Usage

Other modules may display profile information after resolving:

```text
business_record
      ↓
user_id
      ↓
users
      ↓
user_profiles
```

## 14. Cardinality Analysis

| Relationship | Cardinality |
|---|---:|
| User → Profile | 1:0..1 or 1:1 depending on creation policy |
| Profile → User | Exactly 1 |
| Profile → Addresses | None directly; separate `user_addresses` |
| Profile → Contacts | None directly; separate `user_contacts` |
| Profile → Preferences | None directly; separate `user_preferences` |
| Profile → Settings | None directly; separate `user_settings` |
| Profile → Roles | None |
| Profile → Tenant Memberships | None |
| Profile → Departments | None |
| Profile → Teams | None |

The module's relationship overview says User → User Profile is 1:1. The implementation must decide whether profile creation is immediate or deferred.

## 15. Query Patterns

### Retrieve Profile by User

```sql
SELECT *
FROM user_profiles
WHERE user_id = :user_id;
```

### Retrieve User and Profile Together

```sql
SELECT
    u.id,
    u.email,
    u.status,
    p.display_name,
    p.middle_name,
    p.profile_photo_url
FROM users u
LEFT JOIN user_profiles p
    ON p.user_id = u.id
WHERE u.id = :user_id;
```

### Update Profile

```sql
UPDATE user_profiles
SET
    display_name = :display_name,
    middle_name = :middle_name,
    bio = :bio,
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = :user_id;
```

### Find Users by Display Name

If `display_name` becomes a supported requirement:

```sql
SELECT
    u.id,
    u.email,
    p.display_name
FROM users u
JOIN user_profiles p
    ON p.user_id = u.id
WHERE p.display_name ILIKE :search;
```

### Profile Completion

If profile completeness becomes a product requirement, completeness can be calculated from required fields. The exact completeness rules are not defined by the source.

## 16. Index Strategy

### Primary Index

```text
PK(user_id)
```

This is sufficient for the primary access pattern.

### Display Name Index

If display-name searching becomes frequent:

```text
INDEX(display_name)
```

may be added.

### Date-of-Birth Index

No index should be added merely because `date_of_birth` exists.

### General Principle

Do not create indexes for every profile attribute.

Profile data is primarily retrieved by:

```text
user_id
```

Therefore:

```text
PK(user_id)
```

is the dominant index.

## 17. Read / Write Characteristics

| Operation | Volume | Characteristics |
|---|---|---|
| Profile Reads | High | UI and user-facing identity display |
| Profile Writes | Moderate | User profile maintenance |
| Profile Creation | Moderate | Registration/onboarding |
| Search by Profile Attribute | Low–Moderate | Depends on product features |
| Deletes | Very Low | Prefer retention with user lifecycle |

Profile reads are likely frequent, while writes are primarily user-driven. Physical deletion should be rare.

## 18. Caching Strategy

`user_profiles` is a reasonable caching candidate for frequently displayed profile information.

Possible conceptual cache:

```text
user-profile:{user_id}
```

Example:

```json
{
  "user_id": "...",
  "display_name": "John",
  "profile_photo_url": "..."
}
```

### Cache Invalidation

When profile data changes:

```text
Profile Updated
      ↓
Database Updated
      ↓
Invalidate user-profile:{user_id}
```

### What Should Not Be Cached Here

Do not place:

```text
passwords
MFA secrets
session tokens
API token secrets
security answers
```

into the profile cache.

### Source of Truth

```text
Database
   ↓
Authoritative profile

Cache
   ↓
Performance optimization
```

## 19. Security Considerations

Although less security-sensitive than `passwords` or `mfa_methods`, `user_profiles` can contain sensitive personal information.

### PII

Potential fields such as:

```text
date_of_birth
gender
personal biography
profile photograph
```

can constitute personal information depending on jurisdiction and use.

### Least Privilege

Not every user or service should automatically receive every profile attribute.

### Profile Photo

If profile images are supported, preferably use:

```text
Object Storage
      ↓
profile_photo_url
```

rather than large binary image objects inside the identity database.

### Date of Birth

If eventually required, access should be restricted.

### Profile Update Authorization

A user should normally be able to modify their own profile. Administrative modification should require appropriate permissions.

## 20. Audit Requirements

Profile changes can have accountability implications.

Examples:

```text
Profile Created
Profile Updated
Profile Photo Changed
Profile Deleted
```

The new Module 2 definition includes `user_access_logs` for security audit logging.

### Recommended Events

| Event | Purpose |
|---|---|
| `UserProfileCreated` | Records initial profile creation |
| `UserProfileUpdated` | Records profile modification |
| `UserProfilePhotoChanged` | Records profile-image changes |
| `UserProfileDeleted` | Records profile removal where applicable |

### Sensitive Field Auditing

If fields such as date of birth are introduced, the audit system should avoid unnecessarily copying their values into general logs.

Prefer:

```text
field_changed = date_of_birth
```

over storing old/new values unless explicitly required.

## 21. Event Producers / Event Consumers

### Event Producers

Potential producers:

- User Registration Service.
- User Profile Service.
- User Administration Service.
- Account Onboarding Service.

Example:

```text
User Onboarding
      ↓
Profile Service
      ↓
user_profiles
      ↓
UserProfileCreated
```

### Event Consumers

Potential consumers:

- Notification Service.
- Audit Service.
- Search/Indexing Service.
- User Directory Service.
- Analytics.
- UI/Profile Cache Service.

Example:

```text
User
 ↓
Profile Update
 ↓
user_profiles
 ↓
UserProfileUpdated
       │
       ├── Audit Service
       ├── Search Index
       └── Profile Cache
```

The exact event infrastructure is not specified by the source.

## 22. Alternative Designs Considered

| Option | Description | Verdict |
|---|---|---|
| A | Put all profile attributes directly in `users` | **Rejected** |
| B | One profile per tenant | **Rejected by current 1:1 definition** |
| C | Profile has independent UUID PK | **Possible, but not preferred** |
| D | `user_id` as PK/FK | **Recommended** |
| E | Merge profile with contacts | **Rejected** |
| F | Merge profile with settings/preferences | **Rejected** |

### Option A — Profile Inside `users`

Rejected because it undermines the explicit Core Identity separation.

### Option B — Tenant-Specific Profiles

Rejected under the current module definition because the stated relationship is User → User Profile = 1:1 and tenant membership has its own table.

### Option C — Independent Profile UUID

Technically valid, but creates an identity for the profile that the business model does not require.

### Option D — User ID as PK/FK

**Recommended:**

```text
user_profiles.user_id
       PK
       FK → users.id
```

### Option E — Merge Contacts

Rejected because the module explicitly separates `user_profiles` and `user_contacts`.

### Option F — Merge Preferences/Settings

Rejected because `user_preferences` and `user_settings` have different conceptual purposes.

## 23. Final Design Assessment

Because the new Module 2 source only defines the purpose and relationship of `user_profiles`, the following assesses the **proposed architecture**, not a recovered physical implementation.

| Attribute | Rating |
|---|---|
| Complexity | **Low–Medium** |
| Read Volume | **High** |
| Write Volume | **Moderate** |
| Security Importance | **High** |
| PII Sensitivity | **High** |
| Cross-Module Dependency | **High** |
| Tenant Coupling | **Low** |
| Scalability Requirement | **High** |
| Recommended PK | **`user_id`** |
| Recommended Status | **Core Identity Extension — Required** |

## Overall Design Assessment

`user_profiles` should be a **thin one-to-one extension of `users`**.

Its responsibility is:

```text
                         users
                           │
                    Master Identity
                           │
                           ▼
                    user_profiles
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
       Personal Data    Display Data   Profile Data
```

while other identity concerns remain separated:

```text
users
 │
 ├── user_profiles       → personal profile
 ├── user_addresses      → addresses
 ├── user_contacts       → contacts
 ├── user_preferences    → UI preferences
 ├── user_settings       → account settings
 ├── user_devices        → registered devices
 └── user_sessions       → active sessions
```

The most important invariant is:

> **`user_profiles` extends the user identity; it does not redefine the identity.**

Because the supplied module explicitly defines the relationship as **User → User Profile (1:1)**, the preferred physical implementation is:

```text
user_profiles
-------------------------
user_id PK
     │
     └── FK → users.id
```

rather than introducing an unnecessary independent profile identity.

## Critical Production Invariants

1. Every `user_profiles` record must reference exactly one `users.id`.
2. `user_profiles.user_id` should be unique by being the primary key.
3. A profile must never become an alternative master identity.
4. Profile data must not replace `users` as the canonical identity source.
5. Tenant membership must remain in `tenant_users`.
6. Roles must remain in the RBAC tables.
7. Permissions must remain in the authorization model.
8. Passwords must remain outside `user_profiles`.
9. MFA secrets must remain outside `user_profiles`.
10. Sessions must remain outside `user_profiles`.
11. Addresses must remain in `user_addresses`.
12. Contact information must remain in `user_contacts`.
13. UI preferences must remain in `user_preferences`.
14. Account settings must remain in `user_settings`.
15. Tenant-specific employment information must not be added merely because it describes a user.
16. The current module definition establishes a 1:1 user/profile relationship.
17. The supplied source does not establish the exact physical profile fields.
18. Proposed fields such as `date_of_birth`, `gender`, `bio`, and `profile_photo_url` must not be treated as mandatory requirements without source support.
19. Profile attributes containing personal information must be protected by appropriate authorization.
20. Sensitive profile attributes should not be indiscriminately exposed through APIs.
21. Profile images should preferably be stored in object storage with a database reference.
22. Profile updates should be auditable where they affect security, compliance, or accountability.
23. Profile caches must never become the source of truth.
24. Profile deletion should be coordinated with the user lifecycle.
25. Historical identity references should remain valid after user deactivation.
26. A profile should not be duplicated per tenant unless a future requirement explicitly changes the current 1:1 model.
27. The `user_id` primary key should enforce the one-profile-per-user invariant.
28. Any later authoritative source containing the physical `user_profiles` schema must take precedence over these proposed fields.
29. No undocumented enum vocabulary should be introduced as an InsureIQ requirement.
30. The final implementation must preserve the separation between identity, profile, contact, preferences, settings, authentication, authorization, and organizational membership.
