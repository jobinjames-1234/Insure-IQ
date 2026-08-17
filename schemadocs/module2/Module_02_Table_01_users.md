# Step 3 — Table 1: `users`

> **Source-discipline note:** The new Module 2 source explicitly defines `users` only as **“Master user account”** and establishes the module-level identity, authentication, authorization, and tenant-membership relationships.
>
> The surviving source does **not** contain a recovered detailed physical `users` schema for this new 39-table model. Therefore, unlike a recovered table specification, the physical fields below are explicitly marked as **proposed design decisions** where the supplied source does not establish them. The broader SaaS schema reference supports separating `users` from tenant membership and using a membership table for tenant association.

---

# 1. Why This Table Exists

The `users` table is the **master identity table** for every human account that can interact with InsureIQ.

Its purpose in the new Module 2 definition is explicitly:

> **Master user account**

The table establishes the existence and identity of a person within the InsureIQ platform.

It is the central identity record that other Module 2 tables extend.

Conceptually:

```text
                              users
                                │
       ┌────────────────────────┼────────────────────────┐
       │                        │                        │
       ▼                        ▼                        ▼
 user_profiles             user_contacts           user_addresses
       │
       ├── user_preferences
       ├── user_settings
       ├── user_status_history
       ├── user_login_history
       ├── user_devices
       ├── user_sessions
       │
       └── Authentication
              ├── passwords
              ├── MFA
              ├── tokens
              └── recovery
```

The user is then connected to organizational membership:

```text
Tenant
   │
   ▼
tenant_users
   │
   ▼
users
```

The new Module 2 definition explicitly establishes `tenant_users` as the table representing that a user belongs to a tenant.

---

## The Problem It Solves

Without a centralized user entity, every business module would need to independently represent people.

That would produce fragmented identity records:

```text
Policy User
Claims User
Billing User
AI User
Document User
Workflow User
```

Instead, InsureIQ has:

```text
                         users
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
      Policies           Claims            Billing
        │                  │                  │
        └──────────────────┼──────────────────┘
                           ▼
                       user.id
```

This creates a consistent identity reference throughout the platform.

---

## Identity Foundation

The module documentation explicitly states that other InsureIQ modules depend on users for:

- Ownership
- Actions
- Approvals
- Responsibility
- Accountability

Therefore `users` is not merely a login table.

It is the **canonical identity reference** for the platform.

---

# 2. Business Definition

A **User** represents a human identity recognized by InsureIQ.

The user may subsequently participate in one or more organizational contexts through `tenant_users`.

Examples include:

```text
InsureIQ Platform Super Admin
Tenant Administrator
Underwriter
Insurance Agent
Claims Adjuster
Customer Support Executive
Finance Officer
Compliance Officer
Auditor
Data Analyst
AI/ML Administrator
B2C Marketplace Customer
Broker
Partner User
```

These roles are explicitly included in the new Module 2 scope.

---

## Important Identity Separation

The following are different concepts:

```text
User
   ↓
Who is the person?
```

```text
Tenant Membership
   ↓
Which organization does the person belong to?
```

```text
Role
   ↓
What organizational role does the person have?
```

```text
Permission
   ↓
What can that role perform?
```

This produces:

```text
User
  │
  ▼
tenant_users
  │
  ▼
Tenant
  │
  ▼
user_roles
  │
  ▼
roles
  │
  ▼
permissions
```

---

# 3. Critical Design Principle — What the Entity IS and IS NOT

## The User IS

- The canonical human identity.
- The root identity record referenced by other modules.
- The subject of authentication.
- The subject of authorization.
- The owner of user-specific settings and preferences.
- The owner of sessions and authentication artifacts.
- The subject of account lifecycle state.
- A platform identity that may have tenant memberships.

## The User IS NOT

- A tenant.
- A tenant membership.
- A role.
- A permission.
- A department.
- A team.
- A session.
- A password.
- An MFA method.
- A login attempt.
- A security event.
- A business customer record.
- An insurance policyholder record.

This separation is critical.

---

## User vs Tenant

A tenant represents the organization.

A user represents the person.

```text
Tenant
   │
   └── Membership
          │
          └── User
```

The new architecture explicitly introduces `tenant_users` for this membership relationship.

---

## User vs Role

A user does not inherently become a role.

Instead:

```text
User
  ↓
user_roles
  ↓
Role
```

This is necessary because the same human identity can potentially have different roles in different tenant contexts.

---

# 4. Aggregate Root Analysis — DDD Structure

The `users` table is the **identity root** of the Identity Management domain, but tenant membership remains a separate organizational boundary.

Conceptually:

```text
User
│
├── User Profile
├── User Addresses
├── User Contacts
├── User Preferences
├── User Settings
├── User Status History
├── User Login History
├── User Devices
├── User Sessions
│
├── Password
├── Password History
├── Password Reset Tokens
├── Email Verification Tokens
├── Phone Verification Tokens
├── Refresh Tokens
├── API Tokens
├── MFA Methods
├── MFA Backup Codes
├── Login Attempts
└── Account Lockouts
```

Authorization extends from the identity:

```text
User
 │
 └── User Roles
        │
        ▼
      Roles
        │
        ▼
   Permissions
```

Organizational membership is:

```text
User
 │
 └── tenant_users
        │
        ▼
      Tenant
```

---

## DDD Boundary

The important distinction is:

```text
User Aggregate
        │
        ├── Identity
        ├── Authentication state
        └── User-specific state

Tenant Aggregate
        │
        ├── Tenant configuration
        ├── Tenant resources
        └── Tenant policies
```

The user should not contain tenant-specific organizational state merely because the user belongs to a tenant.

---

## Why This Matters

A future broker or partner user may potentially participate in multiple organizational contexts.

Therefore:

```text
User A
 ├── Tenant A membership
 ├── Tenant B membership
 └── Tenant C membership
```

is architecturally more flexible than:

```text
User A
 └── tenant_id = Tenant A
```

The new 39-table model's introduction of `tenant_users` strongly supports this separation.

---

# 5. Business Capabilities Supported

| Capability | Supported By `users` |
|---|---|
| Create human identity | Yes |
| Maintain canonical identity | Yes |
| Authenticate user | Indirectly — authentication tables |
| Associate user with tenant | Indirectly — `tenant_users` |
| Assign roles | Indirectly — `user_roles` |
| Assign permissions | Indirectly — roles/permissions |
| Maintain personal profile | `user_profiles` |
| Maintain contact information | `user_contacts` |
| Maintain addresses | `user_addresses` |
| Maintain preferences | `user_preferences` |
| Maintain account settings | `user_settings` |
| Track account status | `user_status_history` |
| Track login history | `user_login_history` |
| Manage sessions | `user_sessions` |
| Manage MFA | `mfa_methods` |
| Manage password | `passwords` |
| Manage recovery | Authentication/recovery tables |
| Support organizational hierarchy | Departments/teams/reporting tables |
| Support auditing | `user_access_logs` |

The important point is that `users` provides the **identity anchor**, while specialized tables provide the surrounding capabilities.

---

# 6. Multi-Tenant / Ownership / Isolation

The new architecture explicitly establishes:

```text
Tenant
   │
   ▼
tenant_users
   │
   ▼
users
```

This means `users` should **not automatically be treated as a tenant-owned table**.

Instead:

```text
users
   ↓
global identity

tenant_users
   ↓
tenant membership
```

This is an important architectural distinction.

---

## Why `users` Should Not Contain `tenant_id`

A simplistic design would be:

```text
users
-----
id
tenant_id
email
...
```

That would make one user belong to exactly one tenant.

But the new architecture explicitly creates:

```text
tenant_users
```

for membership.

Therefore the preferred conceptual design is:

```text
users
      │
      │ 1:N
      ▼
tenant_users
      │
      │ N:1
      ▼
tenants
```

---

## Tenant Isolation

Tenant-specific queries should resolve membership before granting access.

Conceptually:

```sql
SELECT u.*
FROM users u
JOIN tenant_users tu
  ON tu.user_id = u.id
WHERE tu.tenant_id = :tenant_id
  AND tu.status = 'active';
```

The exact `tenant_users.status` column is not documented here; this query illustrates the intended membership-boundary pattern, not a recovered physical schema.

---

## Platform Users

A platform-level Super Admin may not be associated with an ordinary tenant membership in the same way as a tenant user.

Therefore the design should allow:

```text
Platform Identity
      │
      └── Platform-level authorization
```

while ordinary tenant users use:

```text
User
  ↓
tenant_users
  ↓
Tenant
```

The exact representation of platform-level membership is **not specified by the supplied source** and should be resolved when `tenant_users` is documented.

---

# 7. Lifecycle

The user lifecycle is broader than simply creating and deleting an account.

---

## Creation

Conceptually:

```text
User Registration / Invitation / Administrative Creation
                         │
                         ▼
                       users
                         │
                         ▼
                 Identity Established
```

The identity may subsequently be associated with a tenant:

```text
users
  ↓
tenant_users
  ↓
Tenant Membership
```

---

## Verification

Authentication-related verification may then occur:

```text
User Created
     │
     ├── Email Verification
     │
     └── Phone Verification
```

The verification records are handled by:

- `email_verification_tokens`
- `phone_verification_tokens`

rather than storing verification workflows directly inside `users`.

---

## Authentication Setup

The user may then receive:

```text
Password
MFA Method
Backup Codes
Sessions
```

through the corresponding authentication tables.

---

## Growth / Usage

During normal platform operation:

```text
User
 │
 ├── Logs in
 ├── Creates sessions
 ├── Uses MFA
 ├── Joins teams
 ├── Receives roles
 ├── Performs business actions
 └── Generates audit records
```

---

## Suspension

A user's account may become unavailable without deleting the identity.

Conceptually:

```text
active
  ↓
suspended
```

The actual status vocabulary is not supplied in the new Module 2 source and must be defined explicitly when the implementation schema is finalized.

---

## Archival / Deactivation

Historical business records may reference the user:

```text
Policy
   ↓
created_by
   ↓
users.id
```

Therefore physically deleting the user would break accountability.

Preferred conceptual lifecycle:

```text
Active
   ↓
Suspended
   ↓
Archived / Deactivated
```

rather than:

```sql
DELETE FROM users
```

---

# 8. Proposed Schema

## Table Name

`users`

## Primary Key Strategy

**UUID**

A UUID is proposed as the stable technical identity of the user.

The broader InsureIQ schema design consistently uses UUIDs for core entities, including the Tenant aggregate.

---

## Important Source Limitation

The new Module 2 source does **not provide the physical field list for `users`**.

Therefore the following is a **proposed physical schema**, not a recovered source schema.

The proposed structure intentionally keeps identity fields in `users` and leaves specialized information to the other Module 2 tables.

---

## Full Field-by-Field Schema Definition

| Field Name | Data Type | Key Type | Specification | Reason Field Exists |
|---|---|---|---|---|
| `id` | UUID | PK | `NOT NULL` | Stable canonical identity of the user |
| `username` | VARCHAR(100) | UK / Candidate | `NULL` unless username login is required | Provides a human-readable login identifier where the platform enables usernames |
| `email` | VARCHAR(255) | UK / Candidate | `NOT NULL`, normalized, unique | Provides the canonical electronic identity/login identifier |
| `first_name` | VARCHAR(100) | — | `NOT NULL` | Stores the user's given name for identity and display |
| `last_name` | VARCHAR(100) | — | `NOT NULL` | Stores the user's family name for identity and display |
| `status` | ENUM | — | `NOT NULL` | Represents current account state |
| `email_verified_at` | TIMESTAMPTZ | — | `NULL` | Records successful email verification without storing verification workflow state |
| `last_login_at` | TIMESTAMPTZ | — | `NULL` | Provides the latest successful-login summary for account/security operations |
| `created_at` | TIMESTAMPTZ | — | `NOT NULL`, default current timestamp | Records identity creation |
| `updated_at` | TIMESTAMPTZ | — | `NOT NULL`, default current timestamp | Records last modification |
| `deleted_at` | TIMESTAMPTZ | — | `NULL` | Supports soft deletion/deactivation while preserving historical references |

---

## Why These Fields Are Kept in `users`

The `users` table should remain the **canonical identity record**, not become a catch-all profile table.

Therefore fields such as:

```text
Address
Phone numbers
Preferences
UI settings
MFA configuration
Passwords
Sessions
Roles
Department membership
Team membership
```

belong in their dedicated tables.

The new module explicitly provides those specialized tables.

---

## `id`

The UUID is the canonical technical identity.

It should be referenced by other modules:

```text
policies.created_by_user_id
claims.assigned_to_user_id
documents.created_by_user_id
workflows.approved_by_user_id
```

The exact downstream field names are module-specific and should not be assumed here.

---

## `username`

This field is **proposed and conditional**.

The supplied Module 2 requirements do not state that username-based authentication is required.

If authentication is exclusively email-based, this field should be removed rather than retained unnecessarily.

Therefore:

```text
username
```

is a candidate field, not a confirmed requirement.

---

## `email`

Email is a strong candidate for the canonical login identifier because the module explicitly includes:

```text
email_verification_tokens
password_reset_tokens
```

However, the source does not explicitly state:

> Email is the unique login identifier.

Therefore the uniqueness and authentication semantics should be confirmed during implementation.

---

## `first_name` / `last_name`

These provide the basic human identity representation.

More extensive profile information belongs in:

```text
user_profiles
```

rather than expanding `users` indefinitely.

---

## `status`

The account's current state belongs in the master identity record.

Historical changes belong in:

```text
user_status_history
```

This follows the current-state/history separation used in the Tenant design, where the current lifecycle state is kept in the root record while historical transitions are separately recorded.

---

## `email_verified_at`

This is a compact current-state representation:

```text
NULL
    ↓
Not verified

timestamp
    ↓
Verified
```

The actual verification token lifecycle belongs to:

```text
email_verification_tokens
```

---

## `last_login_at`

This is a convenience field for the latest successful login.

It does **not** replace:

```text
user_login_history
```

The distinction is:

```text
users.last_login_at
       ↓
Current summary

user_login_history
       ↓
Historical login records
```

---

## `deleted_at`

The field is proposed to support soft deletion.

This is important because other InsureIQ modules may retain historical references to users for accountability.

---

# 9. Enum Definitions

The source does not define the actual `users.status` values.

Therefore these are **proposed values**, not recovered source requirements.

## `status`

| Value | Description |
|---|---|
| `pending` | Identity exists but required onboarding/verification is incomplete |
| `active` | Account is operational |
| `suspended` | Account access has been temporarily disabled |
| `locked` | Account is currently blocked because of authentication/security controls |
| `inactive` | Account is intentionally inactive |
| `archived` | Identity is retained but no longer operational |

---

## Important Distinction: `locked` vs `suspended`

These should not automatically mean the same thing.

```text
locked
  ↓
Security/authentication control
```

Example:

```text
Too many failed login attempts
```

while:

```text
suspended
  ↓
Administrative/account lifecycle decision
```

Example:

```text
Employment ended
Compliance action
Administrative suspension
```

The new module's dedicated `account_lockouts` table further supports keeping authentication lockout separate from general user status.

---

# 10. Why `id` Exists

`id` is the canonical identity of the human user.

It exists independently from:

- Email
- Username
- Tenant membership
- Role
- Session
- Authentication credential

This is important because those attributes can change.

For example:

```text
User
id = 7e...
```

may change:

```text
email
role
tenant membership
department
team
```

without becoming a different identity.

---

## Why UUID

UUID provides:

- Stable distributed identity.
- Collision resistance.
- Safe foreign-key references.
- Independence from sequential record counts.
- Compatibility with distributed services.

The existing InsureIQ tenant design uses UUID as the core entity identity strategy.

---

# 11. Candidate Keys

| Key Type | Field(s) | Status | Rationale |
|---|---|---|---|
| Primary Key | `id` | Confirmed design choice | Stable technical identity |
| Candidate Key | `email` | Proposed | Potential unique login/contact identifier |
| Candidate Key | `username` | Proposed/conditional | Only if username authentication is supported |

---

## Important Multi-Tenant Consideration

If the same person can belong to multiple tenants, then:

```text
email
```

should generally remain globally unique if it represents one global identity.

The tenant-specific relationship should instead be unique through:

```text
tenant_users
```

For example:

```text
UNIQUE(tenant_id, user_id)
```

belongs conceptually to `tenant_users`, not `users`.

The broader SaaS reference uses exactly this membership pattern.

---

# 12. Constraints

| Constraint | Definition | Reason |
|---|---|---|
| Primary Key | `PK(id)` | Canonical identity |
| Email Required | `email NOT NULL` | Required proposed login/contact identity |
| Email Unique | `UNIQUE(email)` | Prevent duplicate global identities if email is canonical |
| First Name | `NOT NULL` | Human identity |
| Last Name | `NOT NULL` | Human identity |
| Status | `NOT NULL` | Every account needs a current state |
| Created Timestamp | `NOT NULL` | Identity creation must be traceable |
| Updated Timestamp | `NOT NULL` | Changes must be timestamped |
| Deleted Timestamp | Nullable | Supports soft deletion |
| Username | Conditional unique | Only if username authentication is enabled |

---

## Normalization

Email should be normalized before uniqueness checks.

For example:

```text
User@Example.com
```

and:

```text
user@example.com
```

should not accidentally become two identities if the platform defines email addresses case-insensitively.

The exact normalization policy should be established at the application/database boundary.

---

## Referential Integrity

Other Module 2 tables should reference:

```text
users.id
```

rather than email or username.

For example:

```text
user_sessions.user_id
user_roles.user_id
user_devices.user_id
passwords.user_id
```

---

# 13. Relationships

## Incoming References

Based on the new Module 2 table structure, the following tables logically reference `users.id`:

### Core Identity

- `user_profiles`
- `user_addresses`
- `user_contacts`
- `user_preferences`
- `user_settings`
- `user_status_history`
- `user_login_history`
- `user_devices`
- `user_sessions`

### Authentication

- `passwords`
- `password_history`
- `password_reset_tokens`
- `email_verification_tokens`
- `phone_verification_tokens`
- `refresh_tokens`
- `api_tokens`
- `mfa_methods`
- `mfa_backup_codes`
- `login_attempts`
- `account_lockouts`

### Authorization

- `user_roles`

### Organization Membership

- `tenant_users`
- `user_departments`
- `team_members`
- `reporting_hierarchy`

### Security

- `user_consents`
- `security_answers`
- `trusted_devices`
- `user_access_logs`

These relationships are derived from the new module's table purposes and relationship overview; the exact foreign-key columns are not supplied in the source and must be finalized per table.

---

## Outgoing References

The proposed `users` table has:

```text
No direct tenant_id FK
```

because tenant membership is represented by:

```text
tenant_users
```

The user table therefore remains the global identity root.

---

## Cross-Module Relationships

Other InsureIQ modules will reference the user identity when recording:

```text
created_by
updated_by
approved_by
assigned_to
reviewed_by
owned_by
processed_by
```

The module introduction explicitly states that downstream modules depend on users for ownership, actions, approvals, responsibility, and accountability.

---

# 14. Cardinality Analysis

| Relationship | Expected Cardinality |
|---|---:|
| User → User Profile | 0–1 / ideally 1 |
| User → Addresses | 0–N |
| User → Contacts | 0–N |
| User → Preferences | 0–1 |
| User → Settings | 0–1 |
| User → Status History | 0–N |
| User → Login History | 0–N |
| User → Devices | 0–N |
| User → Sessions | 0–N |
| User → Password Records | 1–N depending on password model |
| User → Password History | 0–N |
| User → MFA Methods | 0–N |
| User → API Tokens | 0–N |
| User → Roles | 0–N through `user_roles` |
| User → Tenant Memberships | 0–N |
| User → Departments | 0–N |
| User → Teams | 0–N |
| User → Consents | 0–N |
| User → Access Logs | 0–N |

---

## Expected User Scale

Unlike the Tenant root, `users` can grow significantly.

Potential populations include:

```text
Platform administrators
+
Insurance employees
+
Agents
+
Brokers
+
Partners
+
B2C marketplace users
```

Therefore the table should be designed for potentially:

```text
100K
   →
1M
   →
10M+
```

users depending on the eventual B2C marketplace scale.

These numbers are **planning scenarios, not source-defined requirements**.

---

# 15. Query Patterns

## Find User by ID

```sql
SELECT *
FROM users
WHERE id = :user_id;
```

This is the primary identity lookup.

---

## Find User by Email

```sql
SELECT *
FROM users
WHERE email = :email;
```

Used for:

- Login.
- Password reset.
- Account recovery.
- User lookup.

---

## Find Active Tenant Users

The membership boundary should be used:

```sql
SELECT u.*
FROM users u
JOIN tenant_users tu
  ON tu.user_id = u.id
WHERE tu.tenant_id = :tenant_id
  AND tu.status = 'active';
```

Again, the exact `tenant_users.status` field is not yet established by the source.

---

## Find User's Tenant Memberships

```sql
SELECT tu.*
FROM tenant_users tu
WHERE tu.user_id = :user_id;
```

---

## Find Recently Created Users

```sql
SELECT *
FROM users
WHERE created_at >= :start_time
ORDER BY created_at DESC;
```

---

## Find Active Users

```sql
SELECT *
FROM users
WHERE status = 'active';
```

---

## Find Users Who Have Not Logged In Recently

```sql
SELECT *
FROM users
WHERE status = 'active'
  AND (
      last_login_at IS NULL
      OR last_login_at < :cutoff
  );
```

This is an operational query rather than a replacement for `user_login_history`.

---

## Identity Lookup for Authorization

```sql
SELECT
    u.id,
    u.status
FROM users u
WHERE u.id = :user_id
  AND u.status = 'active';
```

Authorization should then resolve:

```text
User
 ↓
Tenant Membership
 ↓
Roles
 ↓
Permissions
```

rather than embedding role information into `users`.

---

# 16. Index Strategy

## Primary Index

```text
PK(id)
```

Mandatory.

---

## Email Index

If email is the canonical login identifier:

```text
UNIQUE(email)
```

This simultaneously provides uniqueness and efficient lookup.

---

## Username Index

If usernames are enabled:

```text
UNIQUE(username)
```

Otherwise the field should be omitted.

---

## Status Index

```text
INDEX(status)
```

Useful for:

- Active-user administration.
- Suspended-user queries.
- Operational reporting.

---

## Created-at Index

```text
INDEX(created_at)
```

Useful for:

- Recent-user queries.
- Onboarding reporting.
- Account growth analysis.

---

## Last-login Index

If the platform frequently performs inactive-user analysis:

```text
INDEX(last_login_at)
```

may be justified.

---

## Composite Consideration

Tenant queries should primarily use:

```text
tenant_users
```

rather than adding a `tenant_id` to `users`.

This prevents duplication of membership state.

---

# 17. Read / Write Characteristics

| Operation | Volume | Characteristics |
|---|---|---|
| Identity Reads | Very High | User lookup occurs throughout the platform |
| Email Lookup | Very High | Authentication/recovery |
| Writes | Moderate | Registration and administrative updates |
| Status Updates | Low–Moderate | Account lifecycle |
| Profile Updates | Moderate | User maintenance |
| Deletes | Very Low | Prefer archival/soft deletion |

---

## Reads

The `users` table is likely to be a **hot identity table**.

Many requests may require:

```text
Current User
     ↓
users.id
```

Therefore efficient primary-key and login-identifier lookups are critical.

---

## Writes

Writes occur during:

- Registration.
- Administrative user creation.
- Profile identity changes.
- Account lifecycle changes.
- Email changes.

---

## Updates

Updates should be carefully controlled because identity changes can have security consequences.

For example:

```text
email changed
```

may require:

```text
Old Identity
    ↓
Change Requested
    ↓
Verification
    ↓
New Email Verified
    ↓
Identity Updated
```

---

## Deletes

Hard deletion should generally be avoided where historical business records depend on the identity.

The proposed `deleted_at` supports this principle.

---

# 18. Caching Strategy

The `users` table is a strong caching candidate because identity lookups are frequent.

However, caching must be designed carefully because user state is security-sensitive.

---

## Potential Cache

```text
user:{user_id}
```

Possible contents:

```json
{
  "id": "...",
  "status": "active",
  "email": "user@example.com"
}
```

This is a conceptual cache, not a source-defined contract.

---

## What Should NOT Be Cached Casually

Do not place sensitive authentication secrets in a general identity cache:

```text
Password hash
MFA secrets
Recovery answers
Token secrets
API credentials
```

Those belong to their respective secure storage mechanisms.

---

## Cache Invalidation

Changes to:

```text
status
email
security state
```

may require immediate invalidation.

For example:

```text
User Suspended
      ↓
Update users
      ↓
Invalidate user:{id}
      ↓
Invalidate authorization/session caches
```

---

## Source of Truth

```text
Database
   ↓
Authoritative identity

Cache
   ↓
Performance optimization
```

A cache must never become the authoritative account-status store.

---

# 19. Security Considerations

This is a **maximum-security table**.

Compromise of the identity table can affect the entire platform.

---

## 1. Minimize Stored Identity Data

Only identity data required by the platform should reside in `users`.

Sensitive information should remain in specialized tables.

---

## 2. Password Separation

Passwords must not be stored directly in `users`.

The new architecture explicitly provides:

```text
passwords
password_history
```

for password-related data.

Therefore:

```text
users
   ✗ password

passwords
   ✓ password metadata/hash
```

is the preferred separation.

---

## 3. Tenant Isolation

A successful authentication does not automatically grant access to all tenants.

The system must evaluate:

```text
User
 ↓
Tenant Membership
 ↓
Role
 ↓
Permission
```

---

## 4. Account Status Enforcement

Every authenticated request should be able to determine whether the identity remains active.

For example:

```text
status = suspended
```

should prevent ordinary authenticated operations even if an old session still exists.

---

## 5. Email Change Security

Changing an identity's email is security-sensitive.

A production workflow may require:

```text
Old Identity
    ↓
Change Requested
    ↓
Verification
    ↓
New Email Verified
    ↓
Identity Updated
```

The database table alone does not define this workflow.

---

## 6. Privileged Users

Super Admin identities require stronger controls.

Potential controls include:

- MFA.
- Shorter sessions.
- Strong authentication.
- Security notifications.
- Enhanced access auditing.

The exact policy belongs to tenant/security configuration.

---

## 7. Privacy

The `users` table contains personally identifiable information.

Therefore:

- Encrypt data at rest.
- Encrypt data in transit.
- Restrict database access.
- Apply least privilege.
- Audit privileged access.
- Avoid unnecessary replication into logs.

---

## 8. Soft Deletion

Identity records should generally be retained when historical business records reference them.

---

# 20. Audit Requirements

The `users` table should generate or participate in audit events for security-sensitive identity changes.

The new module explicitly provides:

```text
user_status_history
user_login_history
user_access_logs
```

for historical/security information.

---

## Recommended Identity Events

These are **proposed event names**, not source-defined events.

| Event | Trigger | Purpose |
|---|---|---|
| `UserCreated` | New identity created | Establish identity creation |
| `UserUpdated` | Identity attributes changed | Track identity modification |
| `UserEmailChanged` | Email changed | Security/accountability |
| `UserActivated` | Account activated | Lifecycle history |
| `UserSuspended` | Account suspended | Security/account lifecycle |
| `UserArchived` | Account archived | Identity lifecycle |
| `UserDeleted` | Soft deletion performed | Retention/accountability |
| `UserVerificationCompleted` | Verification completed | Identity assurance |

---

## Audit Payload

A typical identity audit event should contain:

```text
user_id
actor_user_id
event_type
timestamp
tenant_context
source
request_id
```

where applicable.

Do not place passwords, MFA secrets, or recovery answers into the audit payload.

---

# 21. Event Producers / Event Consumers

## Event Producers

Potential producers include:

- Registration Service.
- User Administration Service.
- Authentication Service.
- Account Recovery Service.
- Tenant Administration.
- Security Service.

---

## Example

```text
User Registration
       ↓
Identity Service
       ↓
users
       ↓
UserCreated
```

---

## Event Consumers

Potential consumers include:

- Tenant Membership Service.
- Notification Service.
- Authentication Service.
- Audit Service.
- Security Monitoring.
- Session Service.
- Compliance Service.
- Analytics.

---

## Example: User Suspension

```text
Administrator
      ↓
User Administration
      ↓
users.status = suspended
      ↓
UserSuspended
      │
      ├── Session Service
      │       ↓
      │   Invalidate sessions
      │
      ├── Notification Service
      │       ↓
      │   Notify user
      │
      └── Audit Service
              ↓
          Record action
```

---

# 22. Alternative Designs Considered

| Option | Description | Verdict |
|---|---|---|
| A | Store users separately inside every tenant | **Rejected** |
| B | Put `tenant_id` directly on `users` | **Rejected for the new architecture** |
| C | Make role part of `users` | **Rejected** |
| D | Store password directly in `users` | **Rejected** |
| E | Make `users` a catch-all profile table | **Rejected** |
| F | Dedicated global `users` identity + tenant membership | **Chosen** |

---

## Option A — Tenant-Specific User Tables

Example:

```text
tenant_a_users
tenant_b_users
tenant_c_users
```

Rejected because:

- Duplicates identity.
- Complicates cross-tenant users.
- Makes global identity difficult.
- Increases schema complexity.

---

## Option B — `users.tenant_id`

Example:

```text
users
-----
id
tenant_id
email
```

Rejected for the new architecture because `tenant_users` explicitly exists to represent tenant membership.

---

## Option C — Role Inside `users`

Example:

```text
users.role = underwriter
```

Rejected because the new architecture explicitly provides:

```text
roles
user_roles
permissions
role_permissions
custom_roles
custom_role_permissions
```

Therefore authorization must remain separate from identity.

---

## Option D — Password Inside `users`

Rejected because the new Module 2 explicitly provides a dedicated:

```text
passwords
```

table.

Authentication credentials should not contaminate the canonical identity record.

---

## Option E — Everything Inside `users`

Rejected because the module deliberately provides specialized tables for:

```text
Profile
Contacts
Addresses
Preferences
Settings
Devices
Sessions
MFA
Tokens
Roles
Departments
Teams
Consents
Access Logs
```

The separation improves normalization, security, lifecycle management, and scalability.

---

## Option F — Global Identity + Membership

### Chosen

```text
users
   │
   ▼
tenant_users
   │
   ▼
tenant
```

This provides the cleanest separation between:

```text
WHO
```

and:

```text
WHERE / IN WHICH ORGANIZATION
```

---

# 23. Final Design Assessment

Because the new Module 2 source does not contain the original detailed physical `users` specification, these ratings are an **architectural assessment of the proposed design**, not recovered source values.

| Attribute | Rating |
|---|---|
| Complexity | **Medium** |
| Read Volume | **Very High** |
| Write Volume | **Moderate** |
| Security Importance | **Maximum** |
| Business Criticality | **Maximum** |
| PII Sensitivity | **Very High** |
| Cross-Module Dependency | **Maximum** |
| Scalability Requirement | **Very High** |
| Recommended Status | **Core Identity Table — Mandatory** |

---

# Overall Design Assessment

`users` should remain a **small, stable, canonical identity table**.

Its fundamental responsibility is:

```text
                         USER
                          │
                          │
                    WHO IS THIS?
                          │
          ┌───────────────┼────────────────┐
          │               │                │
          ▼               ▼                ▼
       Identity       Authentication   Authorization
          │               │                │
          │               ▼                ▼
          │          passwords/MFA       roles
          │                              │
          │                              ▼
          │                         permissions
          │
          ▼
     Membership
          │
          ▼
     tenant_users
          │
          ▼
        Tenant
```

The most important architectural rule is:

> **`users` represents the person; `tenant_users` represents the person's organizational membership.**

That separation is directly aligned with the new Module 2 structure and with the broader multi-tenant schema pattern.

Likewise:

```text
users
   ↓
identity

passwords
   ↓
authentication credentials

user_roles
   ↓
authorization assignment

tenant_users
   ↓
tenant membership

user_departments
   ↓
department membership

team_members
   ↓
team membership

reporting_hierarchy
   ↓
organizational hierarchy
```

This prevents `users` from becoming a monolithic table containing every aspect of identity and access management.

---

# Critical Production Invariants

1. Every human identity has exactly one canonical `users.id`.
2. `users.id` must remain stable throughout the identity's lifetime.
3. Tenant membership must be represented through `tenant_users`.
4. `users` should not contain a tenant-specific `tenant_id` under this architecture.
5. Roles must not be embedded directly into `users`.
6. Permissions must not be embedded directly into `users`.
7. Password data must not be stored directly in `users`.
8. MFA secrets must not be stored directly in `users`.
9. Sessions must not be stored directly in `users`.
10. User-specific profile data belongs in the appropriate specialized tables.
11. Historical status changes belong in `user_status_history`.
12. Historical login information belongs in `user_login_history`.
13. Security/access history belongs in `user_access_logs`.
14. Authentication lockouts belong in `account_lockouts`.
15. A suspended or inactive user must not retain effective authorization merely because an old session exists.
16. Historical business records must remain attributable to the user even after account deactivation.
17. Hard deletion of users should be exceptional because downstream records may reference the identity.
18. Email uniqueness must be explicitly defined rather than assumed.
19. Username support must be explicitly confirmed before `username` becomes mandatory.
20. Platform-level identities and tenant-level identities must remain conceptually distinguishable.
21. Authentication establishes identity; it does not establish tenant authorization.
22. Tenant membership establishes organizational context; it does not by itself grant permissions.
23. Roles grant authorization through the RBAC model.
24. Custom tenant roles must not bypass the permission model.
25. Sensitive identity changes must be auditable.
26. Passwords, tokens, MFA secrets, and recovery information must never appear in ordinary user audit payloads.
27. Identity caches must never become the authoritative source of account status.
28. Cross-tenant access must always be resolved through explicit membership/authorization context.
29. The proposed physical fields in this document are not source-recovered fields where the supplied Module 2 specification does not define them.
30. Any later source containing an authoritative `users` physical schema must take precedence over these proposed fields.
