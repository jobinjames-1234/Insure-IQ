# Workflow Specification: Tenant Admin

## 1. Role Overview
- **Role**: `admin`
- **Purpose**: System administrator for a specific insurance agency (Tenant). Manages staff, policy catalogs, and views high-level metrics.
- **Authorization Level**: Highest permission level within a tenant. Cannot access other tenants' data or the Super Admin console.

## 2. Authentication
- **Login**: `POST /api/v1/auth/login`
- **Role Resolution**: Handled via JWT claims for `admin`.
- **Redirect**: Sent to `/b2b` which loads `AdminDashboardPage.tsx`.

## 3. Permission Model

### 3.1 Allowed
- `GET /api/v1/admin/users` - View all staff and users within the tenant.
- `POST /api/v1/admin/users` - Invite/create new staff users.
- `PUT /api/v1/admin/users/{id}/role` - Change user roles (e.g. promote to underwriter).
- `GET / POST /api/v1/admin/policy-config` - Configure insurance products available to customers.
- `GET /api/v1/admin/kpis` - View tenant-wide metrics.
- `GET /api/v1/admin/billing` - View tenant subscription billing.

### 3.2 Forbidden
- Provisioning new tenants (`/console/*`).
- Acting as an end-customer (cannot file claims for themselves easily via `/admin`).

## 4. Navigation (Frontend)
Located within `B2BShell`:
- `/b2b` (Dashboard) -> `AdminDashboardPage.tsx`
- `/b2b/team` -> `TeamManagementPage.tsx`
- `/b2b/policy-config` -> `PolicyConfigPage.tsx`
- `/b2b/billing` -> `BillingPage.tsx`

## 5. Page Workflows

### 5.1 Admin Dashboard (`AdminDashboardPage.tsx`)
- **Data/APIs**: `GET /api/v1/admin/kpis` (Total premium, active policies, claim ratio).
- **Actions**: Review audit logs and high-level health.

### 5.2 Team Management (`TeamManagementPage.tsx`)
- **Data/APIs**: `GET /api/v1/admin/users`.
- **Actions**: "Invite Member" -> Triggers `POST` to create an account and send an email. "Change Role" -> `PUT` to adjust permissions.

### 5.3 Policy Configuration (`PolicyConfigPage.tsx`)
- **Data/APIs**: `GET /api/v1/admin/policy-config`.
- **Actions**: Create new `insurance_products` and `policy_types`. This determines what customers see on the `BrowseAndApplyPage.tsx`.

## 6. Entity Interaction
- **Users/Roles**: `CREATE`, `READ`, `UPDATE`.
- **Products/Policy Types**: `CREATE`, `READ`, `UPDATE`.
- **KPIs**: `READ`.

## 7. Complete End-to-End Journey
1. Logs in -> `AdminDashboardPage.tsx`.
2. Navigates to Policy Configuration.
3. Adds a new "Comprehensive Auto" product.
4. Navigates to Team Management.
5. Invites a new employee as an `underwriter`.
6. Checks Billing to ensure subscription is active.

## 8. Remaining Implementation
- **Status**: IMPLEMENTED.

## 9. Implementation Dependencies
- Super Admin must provision the Tenant before the Admin can log in.
- Without Admin configuration of products, Customers cannot apply for policies.

## 10. Validation
Verify by logging in as `admin@abc.com`, viewing KPIs, and managing the team list.
