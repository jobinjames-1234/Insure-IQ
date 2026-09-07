# Final Implementation Plan

## 1. Executive Summary

- **Current State**: The backend and frontend are structurally complete, with most Phase 1–11 endpoints and components existing either as functional implementations or stubs. However, several critical architectural bugs and workflow gaps block end-to-end functionality.
- **Target State**: A fully working, tenant-isolated, multi-role B2B2C insurance platform where all 6 user roles (Super Admin, Admin, Agent, Underwriter, Adjuster, Customer) can perform their intended workflows securely.
- **Major Blockers**: 
  1. Super Admin shell and console routing are broken/exposed.
  2. Customer registration fails to create a `Customer` record, blocking applications.
  3. B2B staff creation is a stub, preventing new staff onboarding.
  4. Tenant isolation is missing on key queues.
- **Implementation Strategy**: We will use a targeted, dependency-driven batching strategy. We will fix critical P0 blockers (Routing & Registration), address P1 access control and user-generation features, and then complete P2 functional enhancements and missing pages.

## 2. Verified Current State

- **Working**: JWT Authentication, Role Resolution, Database Schema, Policies APIs, Application Submission, Underwriting Decide API, Claims creation.
- **Partially Working**: Claims Queue, Agent Customers, Underwriting Queue (all missing tenant isolation filters).
- **Implemented but not Integrated**: Agent Retention Alerts (Backend ✅, Frontend Route ❌), Document upload API.
- **Missing**: Token Refresh/Logout API, Frontend `CustomerPortfolioPage.tsx`, `RetentionAlertsPage.tsx`.
- **Broken**: Super Admin UI Routing (broken Outlet), Console Route Exposure (accessible by B2B users in UI).
- **Blocked**: Customer Application Flow (blocked by missing Customer record on registration), B2B Staff Workflows (blocked by stubbed invite system).

## 3. Target State

"Working software" means:
1. Super Admin can securely provision tenants via a functional `/admin` shell without exposing console pages to B2B users.
2. Tenant Admins can invite staff (Agents, Underwriters, Adjusters) using a functional invite system.
3. Customers can register, immediately apply for policies, and file claims.
4. Agents, Underwriters, and Adjusters can securely manage their tenant's isolated data.
5. All endpoints properly enforce `tenant_id` where applicable.

## 4. Remaining Implementation Inventory

1. **Routing & Security (P0)**: Fix `AuthSuperAdminShell` to use `<Outlet />`. Move console pages from `/b2b` to `/admin`.
2. **Customer Workflow (P0)**: Update `POST /auth/register` to auto-create a `Customer` record for users with the `customer` role.
3. **Staff Generation (P1)**: Implement `POST /admin/users` to actually create B2B staff users and assign roles.
4. **Data Isolation (P1)**: Add `tenant_id` filters to `GET /agent/customers`, `GET /claims/queue`, and `GET /underwriting/queue`.
5. **Authentication (P2)**: Implement `POST /auth/logout` and `POST /auth/refresh`.
6. **Frontend Pages (P2)**: Create and wire up `CustomerPortfolioPage.tsx` and `RetentionAlertsPage.tsx`.

## 5. Dependency Graph

```text
[1] Router & Shell Fixes (Unblocks Super Admin)
      ↓
[2] Customer Record on Registration (Unblocks Customer Apply/Claims)
      ↓
[3] Staff Invite System (Unblocks Tenant Staff Workflows)
      ↓
[4] Tenant Isolation Fixes (Secures Staff Workflows)
      ↓
[5] Missing Pages & Refresh/Logout (Completes UX & Security)
```

## 6. Critical Path

The P0/P1 blockers represent the critical path:
- **P0**: Super Admin Routing & Customer Registration Fix. Without these, the platform operator cannot function, and the primary customer journey cannot begin.
- **P1**: Staff Invite System & Tenant Isolation. Without these, the multi-tenant SaaS value proposition is broken.

## 7. Implementation Phases

### Phase 1: Shell & Routing Remediation (P0)
- **Objective**: Secure and fix the Super Admin frontend experience.
- **Tasks**: Fix `AuthSuperAdminShell` in `router.tsx` to render `<Outlet />`. Move Console, Tenant Directory, and Provision Tenant pages under `/admin`.
- **Expected Result**: Super Admins can access their console. B2B users can no longer navigate to `/b2b/console`.

### Phase 2: Customer Journey Unblocking (P0)
- **Objective**: Allow new customers to apply for insurance.
- **Tasks**: Modify `POST /auth/register` to insert a `Customer` record when `role == "customer"`.
- **Expected Result**: Customers can register and immediately submit an application without 400 errors.

### Phase 3: B2B Staff Onboarding (P1)
- **Objective**: Allow Tenant Admins to create staff.
- **Tasks**: Fully implement `POST /admin/users` to generate user records tied to the admin's `tenant_id` with the requested role.
- **Expected Result**: Agents, Underwriters, and Adjusters can be provisioned.

### Phase 4: Tenant Data Isolation (P1)
- **Objective**: Ensure B2B users only see their tenant's data.
- **Tasks**: Add `tenant_id` checks to `/agent/customers`, `/claims/queue`, `/underwriting/queue`.
- **Expected Result**: No cross-tenant data leakage.

### Phase 5: Secondary Workflows & UX (P2)
- **Objective**: Complete remaining functionality.
- **Tasks**: Implement Refresh/Logout APIs. Create Customer Portfolio and Retention Alerts pages.
- **Expected Result**: End-to-end completeness.

## 8. User-Type Implementation Roadmaps

- **Super Admin**: Requires Phase 1 (Routing Fix).
- **Customer**: Requires Phase 2 (Customer Record Fix).
- **Admin**: Requires Phase 3 (Staff Invite Fix).
- **Agent/Underwriter/Adjuster**: Requires Phase 3 (to be created) and Phase 4 (for secure queue viewing).

## 9. Cross-User Workflows

**Customer Registration -> Application -> Underwriting**:
1. Fix Phase 2 allows Customer creation.
2. Application goes directly to `submitted`.
3. Underwriter (created via Phase 3) views queue (secured via Phase 4).
4. Underwriting approval auto-creates `Policy`.

## 10. Database Plan
No schema changes required. The tables already exist. Implementation only requires writing records to `customers`, `users`, and `refresh_tokens`.

## 11. Backend Plan
- `auth.py`: Add `Customer` creation logic to register. Add refresh/logout.
- `admin.py`: Implement user creation logic.
- `agent.py`, `claims.py`, `underwriting.py`: Add `tenant_id` filter to queues.

## 12. API Plan
- `POST /auth/register`: Update to return customer profile.
- `POST /admin/users`: Update to take `email`, `role`, `password` and create user.

## 13. Frontend Plan
- `router.tsx`: Move `/b2b/console*` to `/admin/console*`. Fix `AuthSuperAdminShell`. Add missing agent routes.
- `CustomerPortfolioPage.tsx`: Build standard data table.
- `RetentionAlertsPage.tsx`: Build standard data table.

## 14. Authentication & Authorization Plan
Frontend routing changes will align the UI with the backend's already solid `require_role` and `require_superadmin` dependencies. Token invalidation (logout) and refresh will be added for completeness.

## 15. Error Handling Plan
- Registration must rollback if Customer record creation fails.
- Staff creation must handle duplicate email errors gracefully.

## 16. Testing Strategy
- **Level 3 (API)**: Test `/admin/users` creation. Test missing tenant isolation endpoints with cross-tenant fixtures.
- **Level 5 (E2E)**: Complete Customer Journey (Register -> Apply). Complete Super Admin Journey (Login -> Console). Complete Admin Journey (Login -> Invite Staff).

## 17. Regression Strategy
- Ensure JWT parsing and `TenantMiddleware` remain intact. Do not modify `core/security.py` or `deps.py` unless absolutely necessary.

## 18. Risk Register
- **HIGH**: Moving frontend console routes might break hardcoded links. Mitigation: Search and replace all `<Link to="/b2b/console...">` across the frontend.
- **MEDIUM**: Adding `Customer` creation to `register` might break existing auth tests. Mitigation: Run auth tests post-modification.

## 19. Definition of Done
The project is done when:
- Super Admin can log in and view the console at `/admin`.
- B2B users cannot view the console.
- A newly registered customer can successfully submit a policy application.
- An admin can create an agent account, and that agent can log in and only see their tenant's customers.

## 20. Recommended Implementation Sequence

1. [Routing] Fix `AuthSuperAdminShell` and `router.tsx` console routes.
2. [Workflow] Update `POST /auth/register` to create `Customer` records.
3. [API] Implement `POST /admin/users` for staff creation.
4. [API] Add `tenant_id` filtering to Agent, Claim, and Underwriting queues.
5. [Frontend] Create `CustomerPortfolioPage` and `RetentionAlertsPage`.
6. [API] Implement `POST /auth/refresh` and `POST /auth/logout`.
7. [Validation] Perform E2E manual/automated testing.
