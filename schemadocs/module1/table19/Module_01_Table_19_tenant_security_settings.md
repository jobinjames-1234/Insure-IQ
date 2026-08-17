Step 3 — Table 19: tenant_security_settings

The Module 1 inventory identifies Table 19 as tenant_security_settings, with the purpose “Tenant-specific security policies.”

The source defines this table as the tenant-wide security-policy layer governing authentication, authorization, sessions, password rules, IP restrictions, trusted devices, and compliance-related security configuration.

This table is deliberately separate from tenant_settings. tenant_settings provides general operational defaults, while tenant_security_settings represents the tenant's dedicated security policy. The source explicitly identifies this separation.

I am also explicitly restoring the non-degraded schema standard:

Field Name → Data Type → Key Type → Specification → Reason Field Exists

The source version had compressed the schema into Field / Type / Notes. The expanded definition below restores the key classification, nullability, constraints, and field-level business rationale while preserving the source-defined schema.

1. Why This Table Exists

The tenant_security_settings table stores tenant-wide security policies governing authentication, authorization, sessions, password rules, IP restrictions, and compliance requirements.

A multi-tenant platform cannot assume that every insurance organization has identical security requirements.

For example, one insurer may require:

MFA
Password complexity
Short sessions
Trusted devices

while another enterprise tenant may additionally require:

IP allowlisting
Aggressive account lockout
Strict password expiration
Enterprise device controls

The table provides a dedicated security-policy boundary so these requirements can be configured per tenant.

The source explicitly identifies the following business capabilities:

Password policy management.
MFA enforcement.
Session management.
Account lockout.
IP allowlisting.
Device trust.
Compliance configuration.
Why Security Settings Must Be Separate

The architecture contains:

tenant_settings
        ↓
General operational configuration

and:

tenant_security_settings
        ↓
Security policy

This separation is important.

General settings may include:

language
timezone
currency
notification defaults
workflow defaults

while security settings govern:

password requirements
MFA
session lifetime
failed-login controls
IP restrictions
trusted devices

The source explicitly treats detailed security policy as belonging in tenant_security_settings.

Security Policy Boundary

The conceptual relationship is:

Tenant
   │
   ├── General Settings
   │
   └── Security Settings
          │
          ├── Password Policy
          ├── MFA Policy
          ├── Session Policy
          ├── Login Protection
          ├── IP Restrictions
          └── Device Trust

This gives the platform one authoritative tenant-level security-policy record.

2. Business Definition

A Tenant Security Setting defines the security configuration applied across an entire tenant.

Examples include:

Password Policy
MFA Enforcement
Session Timeout
IP Allowlisting
Account Lockout
Trusted Devices

The entity answers:

What security policy should apply to users and security services operating within this tenant?

Example

Suppose:

SecureLife Insurance

requires:

Password minimum length:
12


Uppercase:
Required


Lowercase:
Required


Numbers:
Required


Special characters:
Required


MFA:
Required


Session timeout:
30 minutes


Failed login attempts:
5


Account lockout:
30 minutes


IP allowlist:
Enabled


Trusted devices:
Enabled

The security services can retrieve this policy from:

tenant_security_settings

and apply it consistently.

Security Configuration Consumers

The source identifies:

Authentication Service.
Authorization Service.
API Gateway.
Session Manager.

This means the table is not merely an administrative configuration table. It is runtime security configuration.

3. Critical Design Principle — What the Entity IS and IS NOT
The Tenant Security Setting IS
A tenant-wide security policy.
A configuration resource.
A child entity of the Tenant aggregate.
A security enforcement configuration.
A tenant-specific authentication policy.
A tenant-specific session policy.
A tenant-specific login-protection policy.
A security-governance resource.

The source explicitly defines it as a tenant-wide security policy and configuration resource.

The Tenant Security Setting IS NOT
A user profile.
A security event.
A login attempt.
A user session.
An MFA challenge.
A password history record.
A permission.
An API credential.
An OAuth client.
An audit log.

Those are separate entities in the architecture.

For example:

tenant_security_settings
        ↓
What security policy applies?


login_attempts
        ↓
What actually happened during login?


mfa_challenges
        ↓
What MFA challenge occurred?


user_sessions
        ↓
What sessions exist?


user_security_events
        ↓
What security events occurred for a user?
Critical Security Principle

This table contains policy, not security activity.

That distinction must remain intact:

POLICY
   ↓
tenant_security_settings


ACTIVITY
   ↓
security events / login attempts / sessions


CREDENTIAL
   ↓
credentials / API credentials / OAuth clients

The table should never become a security-event or credential-storage table.

4. Aggregate Root Analysis — DDD Structure

The source gives the aggregate structure as:

Tenant
│
├── Security Settings
├── API Credentials
├── OAuth Clients
└── Users

The Tenant remains the Aggregate Root.

tenant_security_settings is a tenant-owned security-policy entity.

DDD Relationship
Tenant Aggregate Root
        │
        └── TenantSecuritySettings

The ownership relationship is:

tenant_security_settings.tenant_id
            ↓
         tenants.id
One-to-One Aggregate Relationship

The source establishes:

Each tenant owns exactly one active security settings record.

Therefore:

Tenant A
    │
    └── Security Settings A


Tenant B
    │
    └── Security Settings B

The database must prevent:

Tenant A
    ├── Security Settings A1
    ├── Security Settings A2
    └── Security Settings A3

for the current active configuration.

This is enforced through:

UNIQUE(tenant_id)

as specified by the source.

Aggregate Responsibilities

The Tenant aggregate owns:

Who is the tenant?

while this entity answers:

What security policy governs the tenant?

This keeps the Tenant root from becoming responsible for every individual security-policy attribute.

5. Business Capabilities Supported

The source identifies the following capabilities.

| Capability | Supported |
| --- | --- |
| Password policy management | Yes |
| MFA enforcement | Yes |
| Session management | Yes |
| Account lockout | Yes |
| IP allowlisting | Yes |
| Device trust | Yes |
| Compliance configuration | Yes |
| Tenant-wide security policy | Yes |
| User-specific security state | No |
| Security event storage | No |
| Login-attempt storage | No |
| MFA challenge storage | No |
| API credential storage | No |
| OAuth client registration | No |
Password Policy Management

The table controls password requirements such as:

Minimum length
Uppercase requirement
Lowercase requirement
Number requirement
Special-character requirement
Password expiration
MFA Enforcement

The source includes:

mfa_required

which determines whether MFA is required for the tenant.

Session Management

The table defines:

session_timeout_minutes

which provides the tenant-level session timeout policy.

Account Lockout

The source includes:

max_failed_login_attempts
account_lockout_minutes

These allow authentication services to implement tenant-specific failed-login protection.

IP Allowlisting

The source explicitly identifies ip_allowlist as supporting enterprise restrictions to approved IP addresses and ranges.

Trusted Devices

The source includes:

trusted_device_enabled

which enables tenant-level device-trust behavior.

Security Notifications

The source includes:

security_notification_enabled

which provides a tenant-wide configuration switch for security notifications.

6. Multi-Tenant / Ownership / Isolation Notes

Each tenant owns exactly one active security-settings record.

The ownership relationship is:

tenant_security_settings.tenant_id
              ↓
           tenants.id
Tenant Isolation

Security configuration is especially sensitive because a cross-tenant policy leak could affect authentication behavior.

For example:

Tenant A:
MFA required = TRUE

must never accidentally be applied to:

Tenant B

and vice versa.

Correct Access Pattern
SELECT *
FROM tenant_security_settings
WHERE tenant_id = :authenticated_tenant_id;

The tenant context should come from the authenticated security context rather than an arbitrary tenant ID supplied by an untrusted caller.

Cross-Tenant Risk

A cross-tenant configuration error could cause:

Tenant A's security policy
        ↓
Tenant B authentication

This could result in:

Incorrect MFA enforcement.
Incorrect password policy.
Incorrect session duration.
Incorrect lockout behavior.
Incorrect IP restrictions.

Therefore tenant isolation is a security-critical invariant.

7. Lifecycle

The source defines the lifecycle as:

Creation:
Default settings created


Growth:
Policies updated


Modification:
Configuration changes audited


Archival:
Retained for compliance
Creation — Default Settings Created

When a tenant is provisioned:

Tenant Created
      ↓
Default Security Policy
      ↓
tenant_security_settings

The initial configuration should provide valid secure defaults.

Growth / Policy Updates

Security policy evolves as the tenant changes its requirements.

Examples:

MFA disabled
      ↓
MFA enabled


Password length 8
      ↓
Password length 12


Session timeout 60
      ↓
Session timeout 30
Modification

Security configuration changes must be audited.

The source explicitly identifies:

TenantSecuritySettingsUpdated
TenantMFAEnabled
TenantPasswordPolicyChanged
TenantSessionPolicyChanged

as audit events.

Archival

The source specifies:

Retained for compliance.

Therefore the current policy should not simply be physically deleted when changed.

Historical security-policy changes should remain reconstructable through the audit/event architecture.

Important Lifecycle Distinction

This table contains the current policy.

Historical policy changes should generally be represented through:

Audit/Event History

rather than repeatedly inserting unrestricted active configuration rows into the current settings table.

8. Proposed Schema
Table Name

tenant_security_settings

Primary Key Strategy

UUID

The source explicitly specifies UUID as the primary key.

The UUID provides stable database identity for the security-settings record.

Full Field-by-Field Schema Definition

The source defines the following physical field set.

| Field Name | Data Type | Key Type | Specification | Reason Field Exists |
| --- | --- | --- | --- | --- |
| id | UUID | PK | NOT NULL | Stable unique identity of the tenant security-policy record |
| tenant_id | UUID | FK → tenants.id, UK | NOT NULL, UNIQUE | Establishes tenant ownership and enforces one current security-settings record per tenant |
| password_min_length | SMALLINT | — | NOT NULL, CHECK > 0 | Defines the minimum permitted password length |
| password_requires_uppercase | BOOLEAN | — | NOT NULL | Requires uppercase characters when enabled |
| password_requires_lowercase | BOOLEAN | — | NOT NULL | Requires lowercase characters when enabled |
| password_requires_numbers | BOOLEAN | — | NOT NULL | Requires numeric characters when enabled |
| password_requires_special | BOOLEAN | — | NOT NULL | Requires special characters when enabled |
| password_expiry_days | SMALLINT | — | NULL | Defines optional password expiration policy |
| mfa_required | BOOLEAN | — | NOT NULL | Determines whether MFA is mandatory for the tenant |
| session_timeout_minutes | INTEGER | — | NOT NULL, CHECK > 0 | Defines tenant session timeout policy |
| max_failed_login_attempts | SMALLINT | — | NOT NULL | Defines the number of failed authentication attempts permitted before lockout |
| account_lockout_minutes | INTEGER | — | NOT NULL | Defines how long an account remains locked after exceeding failed-login limits |
| ip_allowlist | JSONB | — | NULL | Stores approved IP addresses/ranges for tenant access restrictions |
| trusted_device_enabled | BOOLEAN | — | NOT NULL | Enables tenant-level trusted-device behavior |
| security_notification_enabled | BOOLEAN | — | NOT NULL | Enables tenant-level security notifications |
| created_at | TIMESTAMPTZ | — | NOT NULL | Records creation of the security policy |
| updated_at | TIMESTAMPTZ | — | NOT NULL | Records the latest modification of the security policy |

The field set is preserved from the source rather than introducing additional security-policy fields that were not defined there.

id

The UUID provides technical identity.

It is separate from:

tenant_id

because a tenant and its security-policy record are different database entities.

tenant_id

This is the most important ownership field.

tenant_security_settings.tenant_id
              ↓
           tenants.id

It simultaneously serves as:

Foreign key.
Tenant ownership reference.
One-to-one business key.

The source explicitly defines it as unique.

password_min_length

Defines the minimum number of characters required for passwords.

The source explicitly requires:

CHECK(password_min_length > 0)

This prevents invalid configurations such as:

0
-1
password_requires_uppercase

Controls whether uppercase characters are required.

Example:

TRUE

means the authentication service must enforce at least one uppercase character according to the password policy implementation.

password_requires_lowercase

Controls lowercase-character requirements.

password_requires_numbers

Controls numeric-character requirements.

password_requires_special

Controls special-character requirements.

password_expiry_days

Defines the optional password-expiration interval.

The source marks it as optional.

Therefore:

NULL

can represent an unset tenant-specific expiration policy.

The exact interpretation of NULL should be consistent with the identity/security policy engine.

mfa_required

Determines whether MFA is mandatory.

This is a highly security-sensitive runtime policy.

Example:

mfa_required = TRUE

means authentication must include the configured MFA mechanism where applicable.

session_timeout_minutes

Defines how long a user session may remain valid before timeout.

The source explicitly requires:

CHECK(session_timeout_minutes > 0)

max_failed_login_attempts

Defines the threshold for failed authentication attempts.

Example:

5

means the security service can trigger lockout after five failed attempts according to the login-protection workflow.

account_lockout_minutes

Defines the duration of the resulting lockout.

This separates:

How many failures?

from:

How long is the account locked?
ip_allowlist

Stores approved IP addresses and/or ranges.

The source specifically explains that it exists to allow enterprise tenants to restrict access to approved IP addresses and ranges.

Example conceptual representation:

[
  "203.0.113.0/24",
  "198.51.100.25"
]

The exact JSON structure is not defined by the source and should therefore be standardized by the implementation before production use.

trusted_device_enabled

Determines whether the tenant permits trusted-device functionality.

This should integrate with the Identity & Access Management device/session model rather than storing individual devices here.

security_notification_enabled

Controls tenant-level security notifications.

Examples can include notifications related to security-sensitive activities.

The source establishes the field but does not enumerate the exact notification events.

created_at

Records when the current security-policy record was created.

updated_at

Records when the current security-policy record was most recently changed.

9. Enum Definitions

The source explicitly states:

No ENUM fields are required.

Therefore this table does not require enum definitions.

The policy is represented using:

Boolean values.
Numeric values.
JSONB configuration.
Timestamps.

This keeps the security configuration straightforward and avoids encoding policy states into an unnecessary enumeration.

10. Why ip_allowlist Exists

ip_allowlist is the most structurally non-obvious field in the table.

The source explicitly states:

Allows enterprise tenants to restrict access to approved IP addresses and ranges.

Business Purpose

An enterprise insurer may operate from known corporate networks.

For example:

Corporate Headquarters
        ↓
203.0.113.0/24

The tenant may want authentication requests to be accepted only from approved networks.

Security Model

Conceptually:

Incoming Request
       ↓
Determine Source IP
       ↓
Tenant Security Policy
       ↓
ip_allowlist
       ↓
Allowed?
   /       \
 Yes        No
 ↓          ↓
Continue   Reject
Why JSONB

The source explicitly specifies:

ip_allowlist JSONB

This allows the field to represent a variable number of addresses/ranges without requiring a separate table in the current design.

The source also specifies a GIN index for it.

Important Implementation Boundary

ip_allowlist is tenant policy.

It is not:

Firewall configuration

and it should not replace network-level security controls.

It represents an application-level access policy consumed by the platform's security layer.

11. Candidate Keys

The source defines:

| Key Type | Field(s) | Rationale |
| --- | --- | --- |
| Primary Key | id | Technical identity |
| Candidate Key | tenant_id | One security-settings record per tenant |
Primary Key
id

is the database identity.

Candidate Key
tenant_id

is unique because the source defines exactly one active/current security-settings record per tenant.

Therefore:

Tenant A
      ↓
one current security policy
Why the Combination (tenant_id, id) Is Not a Business Key

id is already globally unique.

The important business invariant is:

one tenant
    ↓
one current security policy

Therefore tenant_id itself is the meaningful candidate key.

12. Constraints

The source explicitly defines:

PK(id)
FK(tenant_id)
UNIQUE(tenant_id)
CHECK(password_min_length > 0)
CHECK(session_timeout_minutes > 0)

The complete restored constraint model is:

| Constraint | Definition | Reason |
| --- | --- | --- |
| Primary Key | PK(id) | Stable security-policy identity |
| Tenant FK | tenant_id → tenants.id | Establishes tenant ownership |
| One-to-One | UNIQUE(tenant_id) | Prevents multiple current security policies per tenant |
| Password Length | CHECK(password_min_length > 0) | Prevents invalid password length |
| Session Timeout | CHECK(session_timeout_minutes > 0) | Prevents invalid session timeout |
| Password Uppercase | password_requires_uppercase NOT NULL | Explicit policy state |
| Password Lowercase | password_requires_lowercase NOT NULL | Explicit policy state |
| Password Numbers | password_requires_numbers NOT NULL | Explicit policy state |
| Password Special | password_requires_special NOT NULL | Explicit policy state |
| MFA | mfa_required NOT NULL | Explicit MFA policy |
| Failed Attempts | max_failed_login_attempts NOT NULL | Explicit login-protection threshold |
| Lockout Duration | account_lockout_minutes NOT NULL | Explicit lockout policy |
| Trusted Device | trusted_device_enabled NOT NULL | Explicit device-trust state |
| Security Notifications | security_notification_enabled NOT NULL | Explicit notification policy |
| Created Timestamp | created_at NOT NULL | Lifecycle tracking |
| Updated Timestamp | updated_at NOT NULL | Policy modification tracking |
Numeric Policy Validation

The source explicitly defines positive constraints only for:

password_min_length
session_timeout_minutes

Therefore additional numeric restrictions should not be invented as database requirements without a product/security-policy decision.

For example, the source does not establish a maximum:

password_min_length <= 128

or:

session_timeout_minutes <= 1440

Those can be introduced later if product requirements define them.

IP Allowlist Validation

The source defines ip_allowlist as JSONB but does not define its exact JSON schema.

Therefore the implementation must validate:

IP syntax.
CIDR syntax.
Address family.
Duplicate entries.
Maximum list size.

But these are implementation considerations, not source-defined physical constraints.

13. Relationships
Incoming References

The source identifies:

Authentication Service.
Authorization Service.
API Gateway.
Session Manager.

These services consume the security policy.

Outgoing References
Tenant
tenant_id → tenants.id

This is the table's explicit database relationship.

Authentication Service

The Authentication Service uses the policy to determine:

Password requirements
MFA requirement
Failed-login threshold
Lockout duration
Authorization Service

The Authorization Service can use tenant-level security policy as part of authorization/security enforcement.

API Gateway

The API Gateway can enforce relevant access restrictions, including tenant-level security policy and potentially IP restrictions.

Session Manager

The Session Manager consumes:

session_timeout_minutes

and potentially:

trusted_device_enabled

to manage session behavior.

14. Cardinality Analysis

The source specifies:

One security settings record per tenant.

| Relationship | Expected Cardinality |
| --- | --- |
| Tenant → Security Settings | Exactly 1 current record |
| Security Settings → Tenant | Exactly 1 |
| Authentication Service → Settings | Many tenant policies consumed |
| Session Manager → Settings | Many tenant policies consumed |
| API Gateway → Settings | Many tenant policies consumed |
Platform Scale

If InsureIQ has:

100,000 tenants

the expected current configuration cardinality is approximately:

100,000 security-settings records

This is a small relational table.

Its importance comes from security sensitivity and read frequency, not row volume.

Why One Record Per Tenant Matters

A one-to-one configuration simplifies runtime resolution:

SELECT *
FROM tenant_security_settings
WHERE tenant_id = :tenant_id;

There is no need to determine which of multiple competing policy rows is currently authoritative.

15. Query Patterns

The source explicitly provides the following queries.

Retrieve Tenant Security Settings
SELECT *
FROM tenant_security_settings
WHERE tenant_id = :tenant_id;

This is the primary runtime configuration lookup.

Find Tenants Requiring MFA
SELECT tenant_id
FROM tenant_security_settings
WHERE mfa_required = TRUE;

Useful for:

Security reporting.
Compliance dashboards.
Policy analysis.
Administrative reporting.
Retrieve Tenants With Strong Password Requirements

A policy-analysis query can inspect:

SELECT tenant_id, password_min_length
FROM tenant_security_settings
WHERE password_min_length >= :minimum_length;

This supports security-policy reporting.

Retrieve Tenants With IP Restrictions

Conceptually:

SELECT tenant_id, ip_allowlist
FROM tenant_security_settings
WHERE ip_allowlist IS NOT NULL;

The exact query for determining whether a particular address belongs to a JSONB list depends on the final JSON representation.

Retrieve Session Policies
SELECT tenant_id, session_timeout_minutes
FROM tenant_security_settings
ORDER BY session_timeout_minutes;

Useful for policy audits and compliance analysis.

16. Index Strategy

The source specifies:

PK(id)
UNIQUE(tenant_id)
INDEX(mfa_required)
INDEX(password_min_length)
GIN(ip_allowlist)
Primary Key
PRIMARY KEY (id)

Provides technical identity.

Unique Tenant Index
UNIQUE(tenant_id)

This is both:

The candidate-key enforcement mechanism.
The primary runtime lookup path.

It allows:

SELECT *
FROM tenant_security_settings
WHERE tenant_id = :tenant_id;

to resolve efficiently.

MFA Index
INDEX(mfa_required)

Supports policy-analysis queries such as:

WHERE mfa_required = TRUE
Password Length Index
INDEX(password_min_length)

Supports policy reporting and comparisons.

Because the table is relatively small, this index is more useful for standardized policy reporting than for raw performance.

GIN IP Allowlist
GIN(ip_allowlist)

supports queries over the JSONB allowlist representation.

The usefulness depends on the final JSON structure and query patterns.

Indexing Trade-Off

This table has:

Reads: Very High
Writes: Very Low

according to the source.

Therefore the additional indexes are reasonable despite their small write overhead.

17. Read / Write Characteristics

The source explicitly classifies:

Reads: Very High
Writes: Very Low
Reads — Very High

Security services may need tenant security configuration during authentication and session processing.

A conceptual path is:

Authentication Request
        ↓
Resolve Tenant
        ↓
tenant_security_settings
        ↓
Apply Security Policy

This makes read latency important.

Writes — Very Low

Security settings change infrequently compared with authentication requests.

Writes occur when:

A tenant is provisioned.
An administrator changes policy.
MFA is enabled/disabled.
Password policy changes.
Session policy changes.
IP restrictions change.
Trusted-device policy changes.
Why Read/Write Asymmetry Matters

A typical tenant may generate:

Thousands or millions of authentication/session operations

while changing security configuration only:

Occasionally

Therefore this is an ideal candidate for:

Database
+
Redis cache

as specified by the source.

18. Caching Strategy

The source specifies:

tenant-security-settings:{tenant_id}

in Redis.

Why Cache Security Settings

Security settings are:

Tenant-specific.
Read very frequently.
Written very infrequently.

This makes them suitable for caching.

Cache Key

Use:

tenant-security-settings:{tenant_id}

Example:

tenant-security-settings:tenant-123

Tenant identity must be part of the cache key to preserve isolation.

Cached Contents

The cache may contain the current policy:

password_min_length
password_requires_uppercase
password_requires_lowercase
password_requires_numbers
password_requires_special
password_expiry_days
mfa_required
session_timeout_minutes
max_failed_login_attempts
account_lockout_minutes
ip_allowlist
trusted_device_enabled
security_notification_enabled
Cache Invalidation

When security policy changes:

Administrator
      ↓
Security Settings Update
      ↓
Database Transaction
      ↓
Commit
      ↓
TenantSecuritySettingsUpdated
      ↓
Invalidate Redis

This is particularly important for security changes.

Revocation-Like Configuration Changes

If:

mfa_required

changes from:

FALSE → TRUE

the new policy should become effective promptly.

Likewise:

session_timeout_minutes
60 → 15

should not remain stale indefinitely in the cache.

Database Remains Authoritative

The architecture should remain:

PostgreSQL
     ↓
Security Policy Source of Truth


Redis
     ↓
Performance Cache

A cache failure must never cause the platform to lose the tenant's security policy.

19. Security Considerations

The source explicitly identifies:

RBAC.
Audit logging.
Tenant isolation.
Controlled configuration updates.
Optional encryption.
Policy governance.

Because this table directly governs authentication and access behavior, its security importance is Critical.

1. RBAC

Only appropriately privileged tenant administrators/security operators should be allowed to modify these settings.

Examples of sensitive changes:

mfa_required
password_min_length
session_timeout_minutes
max_failed_login_attempts
account_lockout_minutes
ip_allowlist
trusted_device_enabled
2. Audit Logging

Every security-policy change should be auditable.

The source explicitly requires security-setting audit events.

3. Tenant Isolation

The security policy must always be evaluated in the correct tenant context.

A policy belonging to Tenant A must never be applied to Tenant B.

4. Controlled Configuration Updates

Security configuration should not be changed through unrestricted generic CRUD endpoints.

A safer architecture is:

Authorized Administrator
        ↓
Security Policy API
        ↓
RBAC
        ↓
Validation
        ↓
Security Policy Update
        ↓
Audit Event
5. Optional Encryption

The source identifies optional encryption.

Sensitive policy data such as detailed IP restrictions may require encryption at rest depending on the platform's compliance/security architecture.

The source does not mandate encryption of every individual field.

6. Policy Governance

Security settings should be subject to governance rules.

For example:

MFA disabled

may require stronger administrative privileges than:

security notifications enabled

The source does not define the exact RBAC roles, so those should remain an IAM design decision.

7. No Credential Storage

Do not store:

passwords
password hashes
MFA secrets
API keys
OAuth secrets

in this table.

It defines policy only.

8. No Security Event Storage

Do not turn this table into:

login history
security events
MFA challenges

Those are event/activity entities.

20. Audit Requirements

The source defines these events:

| Event | Trigger | Purpose |
| --- | --- | --- |
| TenantSecuritySettingsCreated | Default security settings created | Establish initial security-policy provenance |
| TenantSecuritySettingsUpdated | General security configuration changed | Record security-policy modification |
| TenantMFAEnabled | MFA requirement enabled | Record a security-control activation |
| TenantPasswordPolicyChanged | Password rules modified | Record password-policy changes |
| TenantSessionPolicyChanged | Session policy modified | Record session-security changes |
TenantSecuritySettingsCreated

Generated when a tenant receives its initial security policy.

Useful audit metadata:

tenant_id
security_settings_id
actor_id / provisioning_service
created_at
TenantSecuritySettingsUpdated

Generated when security configuration changes.

Important metadata should identify:

tenant_id
actor
changed fields
timestamp

For example:

mfa_required:
false → true
TenantMFAEnabled

Generated specifically when:

mfa_required
FALSE → TRUE

This provides a high-value security event for monitoring and compliance.

TenantPasswordPolicyChanged

Generated when password-policy fields change.

Examples:

password_min_length
password_requires_uppercase
password_requires_numbers
password_expiry_days
TenantSessionPolicyChanged

Generated when session-security policy changes, particularly:

session_timeout_minutes
Audit Payload Principle

Audit events should describe the policy change, not expose secrets.

There are no credentials in this table, but the general principle remains:

Policy metadata
    → auditable


Secrets
    → never expose
21. Event Producers / Event Consumers
Producers

The source identifies:

TenantSecuritySettingsUpdated
TenantMFAEnabled.

The complete source event set also includes:

TenantSecuritySettingsCreated
TenantPasswordPolicyChanged
TenantSessionPolicyChanged
Consumers

The source identifies:

Authentication Service.
Authorization Service.
Session Manager.
API Gateway.
Audit Service.
Compliance Engine.
Security Policy Update Workflow
Tenant Security Administrator
          ↓
Security Settings API
          ↓
RBAC Authorization
          ↓
Policy Validation
          ↓
tenant_security_settings
          ↓
Commit
          ↓
TenantSecuritySettingsUpdated
          │
          ├── Authentication Service
          ├── Authorization Service
          ├── Session Manager
          ├── API Gateway
          ├── Audit Service
          └── Compliance Engine
MFA Enablement Workflow
Administrator
      ↓
Enable MFA
      ↓
Validate Permission
      ↓
Update mfa_required = TRUE
      ↓
Commit
      ↓
TenantMFAEnabled
      ↓
Authentication Service
      ↓
MFA becomes required
Password Policy Workflow
Administrator
      ↓
Change Password Policy
      ↓
Validate Policy
      ↓
Database Update
      ↓
TenantPasswordPolicyChanged
      ↓
Authentication Service
      ↓
New Password Policy Applied
22. Alternative Designs Considered

The source explicitly considers three designs:

| Option | Description | Verdict |
| --- | --- | --- |
| A | Store security settings in tenant_settings | Rejected |
| B | JSON configuration | Rejected |
| C | Dedicated tenant_security_settings table | Chosen |
Option A — Store in tenant_settings
Rejected

The source architecture already distinguishes:

tenant_settings
    ↓
general operational defaults


tenant_security_settings
    ↓
security policy

Security configuration requires:

Stronger RBAC.
Stronger auditability.
Policy governance.
Potentially stronger encryption.
Dedicated security-service integration.

Combining both would blur these responsibilities.

Option B — JSON Configuration

Example:

{
  "password": {
    "min_length": 12,
    "uppercase": true,
    "numbers": true
  },
  "mfa": {
    "required": true
  },
  "session": {
    "timeout_minutes": 30
  }
}
Rejected

A JSON-only approach would weaken the explicit relational structure of important security policies.

It would make:

Constraint enforcement harder.
Policy querying harder.
Documentation less explicit.
Validation less database-visible.
Indexing more complicated.
Governance less transparent.

The source therefore rejects JSON configuration as the primary design.

Option C — Dedicated Table
Chosen

The dedicated table provides:

One security policy per tenant.
Explicit relational constraints.
Strong tenant ownership.
Clear security semantics.
Direct runtime lookup.
Dedicated indexing.
Dedicated caching.
Dedicated audit events.
Clear integration with authentication/session/security services.

This matches the source design.

23. Final Design Assessment

The source rates the table as follows:

| Attribute | Rating |
| --- | --- |
| Complexity | Medium |
| Read Volume | Very High |
| Write Volume | Very Low |
| Security Importance | Critical |
| Business Criticality | Very High |
| Scalability | Excellent |
| Recommended Status | Core Security Configuration Table |
Overall Assessment

tenant_security_settings is a core security configuration table within Tenant Management.

Its architectural role is:

                         TENANT
                            │
                            ▼
                Security Configuration
                            │
       ┌────────────────────┼────────────────────┐
       ▼                    ▼                    ▼
 Password Policy       MFA / Sessions       Access Controls
       │                    │                    │
       ▼                    ▼                    ▼
 Authentication       Session Manager       API Gateway
 Service

The table establishes the tenant-wide security policy that downstream security services must enforce.

Complete Security Policy Model
┌─────────────────────────────────────────────┐
│                   TENANT                    │
└──────────────────────┬──────────────────────┘
                       │
                       │ 1 : 1
                       ▼
┌─────────────────────────────────────────────┐
│       tenant_security_settings              │
├─────────────────────────────────────────────┤
│ id                                          │
│ tenant_id                                   │
│ password_min_length                         │
│ password_requires_uppercase                 │
│ password_requires_lowercase                 │
│ password_requires_numbers                   │
│ password_requires_special                   │
│ password_expiry_days                        │
│ mfa_required                                │
│ session_timeout_minutes                     │
│ max_failed_login_attempts                  │
│ account_lockout_minutes                     │
│ ip_allowlist                                │
│ trusted_device_enabled                      │
│ security_notification_enabled               │
│ created_at                                  │
│ updated_at                                  │
└──────────────────────┬──────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
 Authentication   Session       API Gateway
   Service        Manager
          │
          ▼
     Authorization
       Service
          │
          ▼
    Compliance Engine
Security Policy Lifecycle
                Tenant Provisioned
                       │
                       ▼
              Default Security Policy
                       │
                       ▼
                    ACTIVE
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
 Password Policy      MFA          Session Policy
   Changed          Enabled          Changed
        │              │              │
        └──────────────┼──────────────┘
                       ▼
             Security Settings Updated
                       │
                       ▼
                 Audit Event
                       │
                       ▼
             Security Services
                       │
                       ▼
              New Policy Enforced

The policy itself remains the current configuration record, while changes are retained through the audit/compliance architecture.

Critical Production Invariants
Every security-settings record belongs to exactly one tenant.
Every tenant has exactly one current security-settings record.
tenant_id is both an FK to tenants.id and a unique candidate key.
Security settings are tenant-wide policy, not user-specific state.
Security settings are not security events.
Security settings are not credentials.
Security settings are not sessions.
password_min_length must be greater than zero.
session_timeout_minutes must be greater than zero.
Password complexity requirements must always have explicit boolean values.
MFA enforcement must always have an explicit boolean state.
Failed-login and lockout policies must always have explicit values.
ip_allowlist must remain tenant-scoped.
The exact JSON representation of ip_allowlist must be standardized before production implementation.
Security policy changes require appropriate RBAC authorization.
Security policy changes must be audited.
MFA enablement must generate a dedicated security event.
Password-policy changes must be auditable.
Session-policy changes must be auditable.
Security settings must never contain passwords, API keys, OAuth secrets, or MFA secrets.
Authentication Service is a primary runtime consumer.
Session Manager is a primary runtime consumer.
API Gateway may consume applicable tenant access policies.
The cache must use a tenant-specific key.
The database remains authoritative; Redis is only a performance cache.
Security-policy changes must invalidate the relevant cache promptly.
Cross-tenant security-policy access must be prevented.
Security configuration should not be merged back into generic tenant_settings.
Historical security-policy changes must remain reconstructable for compliance.
The table should remain focused on the question: “What security policy currently governs this tenant?”
Final Conceptual Model
                 ┌────────────────────┐
                 │       TENANT       │
                 └─────────┬──────────┘
                           │
                           │ owns
                           ▼
              ┌─────────────────────────┐
              │ tenant_security_settings│
              ├─────────────────────────┤
              │ Password Policy         │
              │ MFA Policy              │
              │ Session Policy          │
              │ Login Protection        │
              │ IP Restrictions         │
              │ Trusted Devices         │
              │ Security Notifications  │
              └────────────┬────────────┘
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
      Authentication   Session       API Gateway
         Service       Manager
             │             │             │
             └─────────────┼─────────────┘
                           ▼
                   Tenant Security
                      Enforcement
                           │
                           ▼
                 Audit / Compliance

The essential architectural principle is:

tenant_security_settings provides the authoritative tenant-scoped security policy for InsureIQ, separating security enforcement configuration from general tenant settings, credentials, sessions, and security events while supporting centralized authentication, session, access-control, auditing, and compliance behavior.

The source establishes this as a Core Security Configuration Table with Critical security importance, Very High read volume, Very Low write volume, Very High business criticality, and Excellent scalability.

Step 3 — tenant_security_settings is complete.

No file has been created in this response. The next step is Step 4 — package this exact Step 3 content into the Table 19 .md file.
