# Project Context: Authorization & Security

## 1. Purpose
This document maps the security boundaries, authentication mechanisms, and authorization roles within InsureIQ.

## 2. Current Understanding

### 2.1 Authentication
- **Mechanism**: JSON Web Tokens (JWT) issued on successful login (`POST /api/v1/auth/login`).
- **Storage**: Tokens are typically returned to the frontend and attached as a `Bearer` token in the `Authorization` header via Axios interceptors.
- **Refresh**: The system supports token refreshing via `POST /api/v1/auth/refresh`.

### 2.2 Roles & Permissions
Roles are statically checked at the route level using a FastAPI dependency: `Depends(require_role(["role1", "role2"]))`.

The following roles exist:
1. **superadmin**: Platform owner. Has access to cross-tenant provisioning routes (`/console/*`).
2. **admin**: Tenant administrator. Can configure policies, invite users, and view billing/KPIs (`/admin/*`).
3. **agent**: Insurance broker. Sells policies on behalf of the tenant to customers, earns commissions (`/agent/*`).
4. **underwriter**: Risk assessor. Reviews policy applications, views ML risk scores, and approves/rejects them (`/underwriting/*`).
5. **adjuster**: Claims processor. Investigates claims, views ML fraud flags, and approves/denies payouts (`/claims/queue`, `/claims/{id}/decide`).
6. **customer**: The end-user policyholder. Can apply for policies and file claims for themselves (`/applications/my`, `/policies/my`, `/claims/my`).

### 2.3 Tenant Isolation (Data Security)
- Every request passing through `TenantMiddleware` extracts the tenant context.
- The `get_current_user` dependency resolves the user. 
- *Crucially*, the database queries in business logic rely on SQLAlchemy filtering by `tenant_id`.
- An agent from Tenant A cannot see an application from Tenant B, even though both have the `agent` role.

## 3. Evidence / Source Locations
- `backend/app/api/deps.py`: `get_current_user`, `require_role`.
- `backend/app/core/security.py`: JWT generation and password hashing (bcrypt).
- Backend Routes (`backend/app/api/routes/*.py`): Hardcoded role guards on every endpoint.

## 4. Implementation Implications
- If a route is missing a `require_role` dependency, it defaults to only requiring authentication (via `get_current_user`), meaning ANY role could access it. Developers must explicitly lock down routes.
- The frontend shells (`B2BShell`, `SuperAdminShell`) do a secondary client-side check, but the backend is the authoritative enforcer.

## 5. Known Uncertainties
- Role hierarchy. There does not appear to be a strict role hierarchy (e.g., `admin` does not automatically inherit `underwriter` permissions unless explicitly included in the `require_role` array for that route).

## 6. Known Authorization Gaps (MVP)
> [!CAUTION]
> **Super Admin UI Shell Bug**: `AuthSuperAdminShell` in `router.tsx` renders `<AdminHome />` (a stub) instead of `<Outlet />`. This means no child routes under `/admin` can ever render. The Super Admin has no functional frontend console.

> [!WARNING]
> **Console Page Exposure**: `PlatformConsolePage`, `TenantDirectoryPage`, and `ProvisionTenantPage` are registered as children of the `/b2b` route (accessible to all B2B roles: `agent`, `underwriter`, `adjuster`, `admin`). Any tenant admin can navigate to `/b2b/console` and interact with the Super Admin UI pages. The **backend API correctly rejects** these calls with 403, but the **frontend does not prevent navigation**.

> [!WARNING]
> **Staff Account Creation Gap**: `POST /admin/users` is a stub that returns `{"message": "Invite sent"}` without writing to the database. There is currently **no working path to create agent, underwriter, adjuster, or admin accounts** through the application.
