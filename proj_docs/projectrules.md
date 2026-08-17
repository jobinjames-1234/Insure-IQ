# InsureIQ — Project Rules

> **Purpose:** Non-negotiable working agreements for anyone (human or AI agent) contributing to this codebase.
> These rules exist to prevent the most common failure modes in complex projects: conflicting decisions, orphaned features, skipped foundations, and accumulating inconsistency.
>
> Read this file before writing a single line of code. If any rule conflicts with a specific instruction you received, the rule wins unless the instruction comes directly from the user.

---

## 1. Source-of-Truth Hierarchy

When two documents disagree, the higher-authority document wins:

1. `proj_docs/projectrules.md` ← **this file** (highest authority for process)
2. `proj_docs/architecture_decisions.md` (highest authority for technical decisions)
3. `proj_docs/implementation_plan.md` (highest authority for sequencing)
4. Primary academic documents: Synopsis, Requirements, Feasibility Study
5. `docs/InsureIQ_Software_Design.md`
6. `docs/project_ui.md` (design system)
7. `docs/InsureIQ_UI_Design.md` (per-screen UX spec)
8. `schemadocs/` (column-level schema reference)
9. All other documents

If you encounter a contradiction, note it explicitly and resolve it using this hierarchy. Do not silently pick the easier path.

---

## 2. Phase Gate Rule

> **"Complete one vertical slice before multiplying unfinished features."**

**You may not start Phase N+1 until Phase N's exit criteria are met.**

This means:
- You may not build the underwriter dashboard before `GET /health` works.
- You may not wire the frontend before database migrations run cleanly.
- You may not build the AI layer before the application workflow is end-to-end functional.

There is one exception: tasks within a phase that are genuinely independent can proceed in parallel (e.g., backend API and frontend component for the same feature). Work within a phase is parallelizable; phases themselves are sequential.

**Check `proj_docs/implementation_status.md` before starting any new feature.** If the prerequisite phase's exit criteria are not marked ✅, stop and complete it first.

---

## 3. The tenant_id Rule

> **Every non-platform database table MUST have `tenant_id UUID NOT NULL`.**

There are zero exceptions to this rule. Exceptions create cross-tenant data leaks.

**Platform-scope tables** (exempt from per-tenant RLS, managed by Super-Admin only):
- `tenants`, `tenant_branding`, `tenant_settings`, `tenant_subscription_plans`, `tenant_usage_counters`
- `roles`, `permissions`, `role_permissions` (system roles only)
- `users` (platform-level user record)
- `marketplace_products` (aggregated catalog)

**Everything else:** add `tenant_id`. No exceptions. No "I'll add it later."

---

## 4. No Hardcoding Rule

Never hardcode any of the following:
- Secret keys, JWT secrets, database passwords → environment variables only
- Tenant IDs → always resolved from the authenticated JWT
- User IDs → always resolved from `request.state.user_id`
- API base URLs → environment variables / Vite env variables
- Color values outside of the Tailwind design token config → tokens only
- "ABC Insurance" in user-facing UI → use `tenant.name` from the branding API

---

## 5. The "Consequences" Rule

Before implementing any feature, read the relevant ADR in `proj_docs/architecture_decisions.md`. The "Consequences" section of each ADR describes what the decision forces downstream. These are not suggestions — they are mandatory patterns.

Most common violations:
- Calling `fetch()` directly instead of the Axios API client → violates ADR-006
- Storing access token in localStorage → violates ADR-004 (XSS risk)
- Using `useEffect` + `fetch` for data fetching → violates ADR-006 (use TanStack Query)
- Trusting frontend state machine for authorization → violates ADR-012
- Running ML inference synchronously inside a request handler → violates ADR-014

---

## 6. Schema Migration Rule

- **Never modify a table by editing SQL directly.** Always create an Alembic migration.
- **Never combine unrelated schema changes in a single migration.** One logical change per migration file.
- **Run `alembic upgrade head` before running the backend.** If migrations are unapplied, the app should not start (enforce this in the startup check).
- Migration files are **permanent records**. Do not delete or modify a migration after it has been committed.
- Naming convention: `YYYYMMDD_NNN_descriptive_name.py` (e.g., `20260817_001_foundation_tables.py`).

---

## 7. API Response Envelope Rule

Every backend endpoint MUST return the standard response envelope:

```json
{
  "success": true | false,
  "data": { ... } | null,
  "error": "message" | null,
  "meta": { "page": 1, "per_page": 20, "total": 143 } | {}
}
```

No endpoint may return a raw dict, a raw list, or a plain string body. Use a `ResponseModel` Pydantic class that wraps the envelope. This rule exists so the frontend Axios interceptor can handle all responses uniformly.

---

## 8. State Machine Enforcement Rule

Business object lifecycle transitions (Application, Policy, Claim) are enforced server-side.

- **Backend:** validate `current_status` before applying any transition. Return `400 Bad Request` for illegal transitions.
- **Frontend:** disable buttons for illegal transitions as a UX convenience. Never rely on this as the sole enforcement point.
- **History:** every transition MUST be logged to the corresponding `_status_history` table.

Never skip the history log. It is the audit trail.

---

## 9. Design System Compliance Rule

The Mercury-inspired design system defined in `docs/project_ui.md` is the law for all UI components. No component may be shipped with:
- Hardcoded color values outside of Tailwind tokens
- Inline `style` props with pixel values (use Tailwind classes)
- Bounce or elastic animation easing (`cubic-bezier` only, ≤ 300ms)
- More than 2 accent colors on a single screen
- A primary action button without keyboard focus ring

When implementing a new screen, load the corresponding HTML prototype from `screens/` and match the layout and component structure as closely as possible, then implement it using the shared component library (not one-off inline HTML).

---

## 10. SHAP Mandatory Rule

Every machine learning model output exposed to the UI MUST include SHAP values.

This is a design requirement, not optional. The SHAP factor list and bar chart in the Application Detail and Claims Workspace views exist specifically to explain model decisions. Without SHAP, the explainability value proposition of InsureIQ is lost.

If you implement an ML model without SHAP, the feature is considered incomplete.

---

## 11. Role Guard Rule

Every API endpoint that is not genuinely public MUST have a role guard.

```python
# Example
@router.get("/underwriting/queue")
async def get_underwriting_queue(
    current_user: User = Depends(require_role(["underwriter", "admin"])),
    db: AsyncSession = Depends(get_db),
):
    ...
```

There is no endpoint that is "probably fine without a guard." If in doubt, add the guard. Missing guards are security vulnerabilities.

Role guards are also enforced by verifying `tenant_id` consistency: a user of Tenant A cannot access Tenant B's resources even if they have the right role. The tenant middleware handles this by setting `current_setting('app.tenant_id')` before any query, and the RLS policy enforces it at the DB level.

---

## 12. Out-of-Scope Boundary Rule

Do not implement items listed in **ADR-015** (Out-of-Scope Items). If you find yourself about to implement:
- Live federated learning
- IRDAI compliance filing
- Real payment gateway
- Kubernetes infrastructure
- OAuth / SAML SSO

...stop. These are explicitly deferred. If the user requests one of these items, confirm that it is intentional and update the ADR before proceeding.

---

## 13. Update `implementation_status.md` Rule

When you complete any item listed in `proj_docs/implementation_status.md`, update the status from ❌ to ✅ (or 🔄 for in-progress). Update the "Last updated" date.

This rule exists because the status file is the shared memory of the project. If it is not kept current, future agents will re-do already-completed work or skip things they believe are done.

**Do this before ending your turn, not after.** If the task fails partway through, mark the relevant items 🔄 with a note.

---

## 14. Naming Conventions

### Backend (Python)
- Modules: `snake_case` (e.g., `auth_router.py`, `tenant_service.py`)
- Classes: `PascalCase` (e.g., `UserProfile`, `ClaimStatusHistory`)
- Functions: `snake_case` (e.g., `get_current_user`, `resolve_tenant`)
- Constants: `UPPER_SNAKE_CASE`
- Alembic migrations: `YYYYMMDD_NNN_descriptive_name.py`

### Frontend (TypeScript/React)
- Components: `PascalCase` (e.g., `BrowseAndApplyPage.tsx`, `ConfidencePill.tsx`)
- Hooks: `camelCase` with `use` prefix (e.g., `useAuthStore`, `useApplicationList`)
- Services: `camelCase` (e.g., `api.ts`, `authService.ts`)
- Types/Interfaces: `PascalCase` (e.g., `Application`, `ClaimStatus`)
- Route paths: `kebab-case` (e.g., `/underwriting/queue`, `/claims/new`)

### Database
- Table names: `snake_case`, plural (e.g., `applications`, `claim_documents`)
- Column names: `snake_case` (e.g., `tenant_id`, `created_at`, `policy_number`)
- Indexes: `idx_{table}_{column(s)}` (e.g., `idx_applications_tenant_id`)
- Foreign keys: `fk_{table}_{referenced_table}_{column}` (e.g., `fk_applications_tenants_tenant_id`)

---

## 15. Comment and Documentation Rule

- Every FastAPI router file MUST have a module docstring explaining the resource it manages and which roles can access it.
- Every Alembic migration file MUST have a `docstring` describing what the migration does and why.
- Every React page component MUST have a file-level comment naming the Stitch reference prototype it was built from.
- Do not write comments that restate what the code does. Write comments that explain *why* a choice was made, especially for non-obvious decisions.

---

## 16. The "Stable Foundation" Rule

> **"Do the work that reduces future uncertainty first. Build stable foundations before dependent features."**

If a task requires creating something that many other features depend on (e.g., the Axios API client, the `get_current_user` dependency, the tenant middleware), build it to its full specification — not a stub — before building the dependent features.

Stubs that you build to "come back to later" compound into tech debt that blocks all downstream work. A stub that is "good enough for now" is never good enough.

The only acceptable stubs are AI model stubs: inserting a fixed risk score of `72` in Phase 7 so the underwriter workflow can be demonstrated before Phase 9 (AI layer) is complete. This is an explicitly allowed and documented exception.

---

## 17. The "Test Every Meaningful Change" Rule

> **"Test every meaningful change before adding another layer of complexity."**

After completing each item in the phase checklist:
1. Verify it works (manually or via automated test).
2. Record the verification result in `proj_docs/implementation_status.md`.
3. Only then move to the next item.

Do not batch-implement 10 endpoints and then test them all at once. If something breaks, you will not know which change broke it.

**Minimum verification per item:**
- Backend endpoint: `curl` or test client call returns the expected response shape.
- Frontend component: renders without console errors; correct data displayed.
- Migration: `alembic upgrade head` runs cleanly; `alembic current` shows correct revision.
- End-to-end: the user flow can be completed without errors.
