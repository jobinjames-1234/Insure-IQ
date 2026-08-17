# Step 1 — Module 2: Identity, Authentication & User Management

## Module Introduction

The **Identity, Authentication & User Management** module is the identity and access foundation of InsureIQ.

It manages every human user in the platform, ranging from:

- InsureIQ Super Admins
- Tenant Administrators
- Underwriters
- Insurance Agents
- Claims Adjusters
- Customer Support Executives
- Finance Officers
- Compliance Officers
- Auditors
- Data Analysts
- AI/ML Administrators
- B2C Marketplace Customers
- Future Brokers
- Future Partner Users

The module provides the mechanisms required to establish **who a user is, how that user authenticates, what that user can access, which organization they belong to, and what organizational relationships they have**.

It supports:

- Role-Based Access Control (RBAC)
- Secure authentication
- Multi-factor authentication (MFA)
- Session management
- Password management and password policies
- Account recovery
- Account lockout
- User verification
- Tenant membership
- Departments
- Teams
- Reporting hierarchy
- User preferences and settings
- Privacy/GDPR consent
- Trusted devices
- Security and access auditing

The module is therefore the identity foundation for the rest of InsureIQ.

Other modules—including policies, claims, documents, billing, workflows, AI predictions, and audit functionality—will ultimately depend on users for **ownership, actions, approvals, responsibility, and accountability**.

---

# Module Structure

The module contains **39 tables**, divided into five logical areas.

## Core Identity

| # | Table Name | Purpose |
|---|---|---|
| 1 | `users` | Master user account |
| 2 | `user_profiles` | Personal profile |
| 3 | `user_addresses` | User addresses |
| 4 | `user_contacts` | Contact information |
| 5 | `user_preferences` | UI preferences |
| 6 | `user_settings` | Account settings |
| 7 | `user_status_history` | Status changes |
| 8 | `user_login_history` | Login audit |
| 9 | `user_devices` | Registered devices |
| 10 | `user_sessions` | Active sessions |

## Authentication

| # | Table Name | Purpose |
|---|---|---|
| 11 | `passwords` | Password metadata |
| 12 | `password_history` | Previous passwords |
| 13 | `password_reset_tokens` | Password reset |
| 14 | `email_verification_tokens` | Email verification |
| 15 | `phone_verification_tokens` | OTP verification |
| 16 | `refresh_tokens` | JWT refresh tokens |
| 17 | `api_tokens` | Personal API tokens |
| 18 | `mfa_methods` | MFA methods |
| 19 | `mfa_backup_codes` | Recovery codes |
| 20 | `login_attempts` | Failed logins |
| 21 | `account_lockouts` | Temporary lockouts |

## Authorization — RBAC

| # | Table Name | Purpose |
|---|---|---|
| 22 | `roles` | System roles |
| 23 | `permissions` | Individual permissions |
| 24 | `role_permissions` | Role-permission mapping |
| 25 | `user_roles` | User-role mapping |
| 26 | `permission_groups` | Permission categories |
| 27 | `custom_roles` | Tenant-defined roles |
| 28 | `custom_role_permissions` | Custom role permissions |

## Organization Membership

| # | Table Name | Purpose |
|---|---|---|
| 29 | `tenant_users` | User belongs to tenant |
| 30 | `departments` | Departments |
| 31 | `user_departments` | Department membership |
| 32 | `teams` | Teams |
| 33 | `team_members` | Team membership |
| 34 | `reporting_hierarchy` | Manager-subordinate relationships |

## Security & Compliance

| # | Table Name | Purpose |
|---|---|---|
| 35 | `user_consents` | Privacy/GDPR consent |
| 36 | `security_questions` | Recovery questions |
| 37 | `security_answers` | Encrypted answers |
| 38 | `trusted_devices` | Trusted devices |
| 39 | `user_access_logs` | Security audit log |

---

# Relationship Overview

```text
Tenant
│
├── Users
│      │
│      ├── Profile
│      ├── Contacts
│      ├── Addresses
│      ├── Preferences
│      ├── Settings
│      ├── Devices
│      ├── Sessions
│      ├── Login History
│      ├── Passwords
│      ├── MFA
│      ├── API Tokens
│      ├── Consents
│      └── Access Logs
│
├── Roles
│      ├── Permissions
│      └── Role Permissions
│
├── Departments
├── Teams
└── Reporting Hierarchy
```

# Major Relationships

| Relationship | Cardinality |
|---|---|
| Tenant → Users | 1:N |
| User → User Profile | 1:1 |
| User → Sessions | 1:N |
| User → Devices | 1:N |
| User → Roles | M:N |
| Role → Permissions | M:N |
| Department → Users | M:N |
| Team → Users | M:N |
| Manager → Employee | 1:N via `reporting_hierarchy` |
| User → Login History | 1:N |
| User → MFA Methods | 1:N |
| User → Access Logs | 1:N |

---

# Organizational Identity Model

The central organizational relationship is:

```text
Tenant
   │
   ▼
tenant_users
   │
   ▼
users
```

This establishes explicit **tenant membership** rather than making user identity and tenant membership the same concept.

A user can then participate in the organization's internal structure:

```text
Tenant
 │
 ├── Users
 │
 ├── Departments
 │      │
 │      └── User Departments
 │
 ├── Teams
 │      │
 │      └── Team Members
 │
 └── Reporting Hierarchy
        │
        ├── Manager
        └── Employee
```

# Authorization Model

The authorization model is centered on RBAC:

```text
User
 │
 ▼
User Roles
 │
 ▼
Roles
 │
 ▼
Role Permissions
 │
 ▼
Permissions
```

The module additionally supports tenant-specific authorization through:

```text
Tenant
   │
   ▼
Custom Roles
   │
   ▼
Custom Role Permissions
   │
   ▼
Permissions
```

This allows InsureIQ to provide predefined system roles while also allowing tenant-specific roles where required.

# Authentication Model

Authentication is separated from identity and authorization:

```text
User
 │
 ├── Password
 ├── Password History
 ├── Password Reset
 ├── Email Verification
 ├── Phone Verification
 ├── MFA Methods
 ├── MFA Backup Codes
 ├── Sessions
 ├── Refresh Tokens
 ├── API Tokens
 ├── Login Attempts
 └── Account Lockouts
```

The separation is important because:

```text
Authentication
     ↓
Who are you?

Authorization
     ↓
What are you allowed to do?

Tenant Membership
     ↓
Which organization are you acting within?

Organizational Membership
     ↓
Which department/team/reporting structure applies?
```

# Security & Compliance Model

```text
User
 │
 ├── Consents
 ├── Security Questions
 ├── Security Answers
 ├── Trusted Devices
 └── Access Logs
```

This allows the system to distinguish between:

- Identity information
- Authentication information
- Security-recovery information
- Device trust
- Privacy consent
- Access/audit history

# Users Covered by This Module

The module is designed to support:

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
Broker (future)
Partner Users (future)
```

The role model therefore needs to support both current enterprise insurance users and future marketplace/partner identities without forcing those identities into a single fixed role structure.

# Module Boundary

The module owns:

```text
Identity
Authentication
Authorization
Tenant Membership
Organizational Membership
User Security
User Preferences
User Settings
User Account Lifecycle
Access Auditing
```

It does **not** own business entities such as:

```text
Policies
Claims
Customers' insurance contracts
Documents
Billing transactions
AI predictions
Workflow definitions
```

Those modules reference IAM identities when they need to establish:

```text
Who owns something?
Who created it?
Who modified it?
Who approved it?
Who reviewed it?
Who performed an action?
Who is accountable?
```

# Module-Level Architectural Principle

The fundamental identity chain is:

```text
                         USER
                          │
             ┌────────────┼────────────┐
             │            │            │
             ▼            ▼            ▼
         Identity     Authentication Authorization
             │            │            │
             │            │            ▼
             │            │          Roles
             │            │            │
             │            │            ▼
             │            │       Permissions
             │            │
             │            ▼
             │        Sessions / MFA
             │
             ▼
       Tenant Membership
             │
       ┌─────┴─────┐
       ▼           ▼
 Departments     Teams
       │
       ▼
 Reporting Hierarchy
```

This module therefore forms the **identity foundation for every other InsureIQ domain**.

---

## Anti-Degradation Standard for the 39 Tables

For every table in this module, the documentation will retain the full 23-section structure:

1. Why This Table Exists
2. Business Definition
3. Critical Design Principle
4. Aggregate Root Analysis
5. Business Capabilities Supported
6. Multi-Tenant / Ownership / Isolation
7. Lifecycle
8. Proposed Schema
9. Enum Definitions
10. Why Key Field Exists
11. Candidate Keys
12. Constraints
13. Relationships
14. Cardinality Analysis
15. Query Patterns
16. Index Strategy
17. Read/Write Characteristics
18. Caching Strategy
19. Security Considerations
20. Audit Requirements
21. Event Producers / Event Consumers
22. Alternative Designs Considered
23. Final Design Assessment

The schema table will **always** retain:

| Field Name | Data Type | Key Type | Specification | Reason Field Exists |
|---|---|---|---|---|

No shortened `Field | Type | Notes` schema will be used.

**Step 1 — Module 2 is now correctly established using the new authoritative 39-table definition.**

I will wait for your confirmation before **Step 2 — creating the exact `.md` file containing this Step 1 content**.
