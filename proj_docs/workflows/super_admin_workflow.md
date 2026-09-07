# Workflow Specification: Super Admin

## 1. Role Overview
- **Role**: `superadmin`
- **Purpose**: Platform owner/operator of the SaaS application itself. Manages the lifecycle of multiple Tenants (Insurance Agencies).
- **Authorization Level**: Global root access. Bypasses standard tenant-isolation to view all tenants on the platform.

## 2. Authentication
- **Login**: `POST /api/v1/auth/login`
- **Role Resolution**: Handled via JWT claims for `superadmin`.
- **Redirect**: Expected to be sent to `/admin`, but currently the UI routing is broken.

## 3. Permission Model

### 3.1 Allowed
- `GET /api/v1/console/health` - View global platform health metrics.
- `GET /api/v1/console/tenants` - List all tenants on the platform.
- `POST /api/v1/console/tenants` - Provision a new tenant and its initial `admin` user.
- `GET /api/v1/console/tenants/{id}` - View tenant details.

### 3.2 Forbidden
- Logging into a tenant to process claims or policies (super admins manage the platform, not the insurance business).

## 4. Navigation (Frontend)

> [!CAUTION]
> **Super Admin Shell Bug**: The `SuperAdminShell` for `/admin` routes in `router.tsx` is broken. It renders a stub `AdminHome` component rather than `<Outlet />`, meaning no child routes can render.

> [!WARNING]
> **Console Route Exposure**: The console pages listed below are mistakenly registered as children of the `/b2b` shell in `router.tsx`, meaning they are accessible to B2B users (`agent`, `underwriter`, `adjuster`, `admin`) via the `/b2b/console*` path. The backend API correctly rejects non-superadmin requests, but the UI is accessible.

Expected Navigation (Currently Broken):
- `/admin/console` -> `PlatformConsolePage.tsx`
- `/admin/tenants` -> `TenantDirectoryPage.tsx`
- `/admin/tenants/new` -> `ProvisionTenantPage.tsx`

## 5. Page Workflows

### 5.1 Platform Console (`PlatformConsolePage.tsx`)
- **Data/APIs**: `GET /api/v1/console/health`.
- **Actions**: View system uptime, total active tenants, global API latency.

### 5.2 Tenant Directory (`TenantDirectoryPage.tsx`)
- **Data/APIs**: `GET /api/v1/console/tenants`.
- **Actions**: Search and filter tenants. Click to view billing or suspension status.

### 5.3 Provision Tenant (`ProvisionTenantPage.tsx`)
- **Entry**: "Provision New Tenant" button.
- **Data/APIs**: `POST /api/v1/console/tenants`.
- **Backend Logic**: Creates the `tenants` record, generates the initial `admin` user, assigns the `admin` role, and sends a welcome email (mocked).
- **Next States**: Redirects back to `TenantDirectoryPage.tsx` on success.

## 6. Entity Interaction
- **Tenants**: `CREATE`, `READ`, `UPDATE` (suspend/activate).
- **Users**: `CREATE` (Initial tenant admin only).

## 7. Complete End-to-End Journey (Currently Broken)
1. Logs in -> expected `PlatformConsolePage.tsx`.
2. Reviews global health.
3. Navigates to "Tenants" -> clicks "Provision New Tenant".
4. Fills out form: "Acme Insurance", Domain: `acme.insureiq.app`, Admin: `ceo@acme.com`.
5. Submits -> Tenant is instantly available.

> [!CAUTION]
> The end-to-end journey is **non-functional** in the frontend due to the broken `AuthSuperAdminShell` and misconfigured routes.

## 8. Remaining Implementation
- **Status**: BACKEND IMPLEMENTED, FRONTEND ROUTING BROKEN.

## 9. Implementation Dependencies
- This is the top of the pyramid. No other user can function until a Super Admin provisions their Tenant.

## 10. Validation
Verify by logging in as `super@abc.com`, navigating to `/console/tenants/new`, and successfully creating a new tenant.
