# InsureIQ — Architecture Decisions Record (ADR)

> **Purpose:** A locked record of every significant technical decision made for InsureIQ.
> Disputes between any later document and this file are resolved in favour of this file — it was compiled from the highest-authority primary documents.

---

## Status Labels

- `LOCKED` — Decided in primary project documents. Do not reopen.
- `DECIDED` — Set during implementation planning. Reopen only with written justification.
- `OPEN` — Needs resolution before implementation.

---

## ADR-001 — Backend Framework

**Status:** `LOCKED`

**Decision:** **FastAPI (Python 3.11+)**

**Rationale:**
- Explicitly stated in `InsureIQ_Project_Synopsis.pdf` §3.2 and `README.md`.
- Native async aligns with the high-concurrency insurance workload.
- Pydantic v2 integration gives automatic validation + OpenAPI spec for free.
- Same language as ML stack (scikit-learn, XGBoost, SHAP, HuggingFace) — eliminates cross-language RPC boundary.

**Consequences:**
- All route handlers in Python.
- All data models as Pydantic `BaseModel` classes.
- OpenAPI spec auto-generated at `/docs` and `/redoc`.
- Dependency injection via `Depends()`.

> ⚠️ `docs/InsureIQ_Software_Design.md` mentions NestJS/Django as alternatives. That is a "consider" note from an earlier draft, NOT a decision. FastAPI is the chosen framework.

**Source:** `InsureIQ_Project_Synopsis.pdf` §3.2; `README.md`

---

## ADR-002 — Primary Database

**Status:** `LOCKED`

**Decision:** **PostgreSQL 16+ with the pgvector extension**

**Consequences:**
- All schema changes via Alembic migrations.
- Every business table carries `tenant_id UUID NOT NULL`.
- ORM: SQLAlchemy 2.x async engine with `asyncpg` driver.
- Docker image: `pgvector/pgvector:pg16` (NOT plain `postgres:16`).
- pgvector used for embedding storage and ANN similarity search.
- JSONB for semi-structured data (SHAP factor arrays, OCR extracted fields).

**Source:** `InsureIQ_Project_Synopsis.pdf` §3.3; `README.md`; `docs/InsureIQ_Software_Design.md` §3.1

---

## ADR-003 — Multi-Tenancy Strategy

**Status:** `LOCKED`

**Decision:** **Shared-schema with Postgres Row-Level Security (RLS) as the default.**
Schema-per-tenant is available as an enterprise-tier upgrade; DB-per-tenant is theoretical maximum, not implemented.

**Consequences — these are HARD RULES:**
- Every business table MUST have `tenant_id UUID NOT NULL REFERENCES tenants(id)`. Zero exceptions.
- Adding `tenant_id` retroactively is critical architectural debt. Build it in from day one.
- Every SQLAlchemy query MUST include `WHERE tenant_id = :current_tenant_id`.
- Tenant resolution middleware attaches `request.state.tenant_id` before any handler runs.
- RLS policy on all tables: `CREATE POLICY tenant_isolation ON <table> USING (tenant_id = current_setting('app.tenant_id')::uuid)`.
- `tenants` and platform-level `users` tables are exempt from per-tenant RLS.
- Super-Admin JWT carries `tenant_id = null`. Middleware does NOT set the RLS variable for null — Super-Admin endpoints query cross-tenant explicitly.

**Source:** `docs/InsureIQ_Software_Design.md` §2; `InsureIQ_Expanded_Requirements.pdf`

---

## ADR-004 — Authentication Mechanism

**Status:** `LOCKED`

**Decision:** **Stateless JWT (HS256) + DB-backed refresh token**

**JWT payload:**
```json
{
  "sub": "<user_id: uuid>",
  "tenant_id": "<uuid | null>",
  "role": "<role_name>",
  "email": "<string>",
  "iat": "<unix_timestamp>",
  "exp": "<unix_timestamp>"
}
```

**Consequences:**
- `access_token`: 15–30 min lifetime. Stored **in memory only** on frontend — NOT localStorage (XSS risk).
- `refresh_token`: 7-day lifetime. Stored in DB `refresh_tokens` table. Set as `httpOnly` cookie.
- Frontend: on 401, attempt one silent refresh before re-throwing; on second 401, redirect to login.
- Account lockout: 5 failed attempts → blocked, logged in `login_attempts`.
- Passwords: bcrypt via `passlib`, cost factor 12.
- `SECRET_KEY` from environment variable only. Never hardcoded.

**Source:** `docs/InsureIQ_Software_Design.md` §4; `InsureIQ_Project_Synopsis.pdf` §3.3

---

## ADR-005 — Authorization Model

**Status:** `LOCKED`

**Decision:** **Role-Based Access Control (RBAC) with 7 system roles seeded at startup.**

| Role | Scope | Description |
|---|---|---|
| `superadmin` | Platform | InsureIQ operator; cross-tenant |
| `admin` | Tenant | Tenant administrator |
| `underwriter` | Tenant | Reviews policy applications |
| `agent` | Tenant | Manages customer portfolios |
| `adjuster` | Tenant | Processes and settles claims |
| `customer` | Tenant | End-customer / policyholder |
| `marketplace_customer` | Platform | B2C marketplace user |

**Consequences:**
- Custom roles supported in schema but not wired in the academic prototype UI — deferred.
- FastAPI: `Depends(require_role(["underwriter", "admin"]))` on every protected route.
- Frontend: sidebar renders only role-relevant links. No role ever sees another role's pages.
- Super-Admin (`tenant_id=null`) cannot access tenant-scoped endpoints and vice-versa.

**Source:** `docs/InsureIQ_Software_Design.md` §4; `docs/InsureIQ_UI_Design.md` §2

---

## ADR-006 — Frontend Stack

**Status:** `LOCKED`

**Decision:** **React 18 + TypeScript + Vite + Tailwind CSS + Zustand + TanStack Query**

| Package | Purpose |
|---|---|
| `react` + `react-dom` v18 | UI framework |
| `typescript` | Type safety |
| `vite` | Build tool + dev server |
| `tailwindcss` | Utility CSS (tokens from `docs/project_ui.md`) |
| `zustand` | Auth state management |
| `@tanstack/react-query` | Server state, caching, background refetch |
| `react-router-dom` v6 | Client-side routing |
| `axios` | HTTP client with interceptors |
| `react-hook-form` + `zod` | Forms + schema validation |
| `recharts` | Dashboard data visualization |
| `lucide-react` | Icons (outline, 1.5px stroke) |
| `framer-motion` | Micro-animations |
| `clsx` + `tailwind-merge` | Conditional class composition |

**Consequences:**
- Access token in Zustand store (in memory, NOT persisted to localStorage).
- All API calls through `src/services/api.ts` Axios instance (auth interceptor attached).
- TanStack Query for all data fetching. No ad-hoc `useEffect` + `fetch`.
- React Hook Form + Zod for all forms. No raw `useState` for form state.

**Source:** `docs/project_ui.md` §11; `README.md`

---

## ADR-007 — Design System

**Status:** `LOCKED`

**Decision:** **Mercury-inspired fintech aesthetic as defined in `docs/project_ui.md`.**

**Non-negotiable design rules:**
1. **One primary CTA button** visible per screen at a time.
2. **Color is a signal**, not decoration — near-monochrome surfaces.
3. Color tokens: Primary `#1A56FF`, Success `#12805C`, Warning `#B5750A`, Danger `#C4293A`.
4. Typography: Inter (sans), IBM Plex Mono (numeric/amounts). `font-variant-numeric: tabular-nums` on all financial data.
5. Icons: Lucide, outline only, 1.5–1.75px stroke, always paired with text.
6. Motion: ≤ 300ms, `cubic-bezier(0.4, 0, 0.2, 1)`. No bounce or elastic easing.
7. Cards: hairline `1px` border + `0 2px 8px rgba(0,0,0,0.06)` shadow, `border-radius: 12px`.
8. Max 2 accent colors on any single screen.

**Two skins, one component library:**
- **B2B skin**: Dense, grayscale, tenant-configurable accent, monospace IDs, status pills. Think Stripe Dashboard.
- **B2C skin**: Warm, comparative, InsureIQ accent, larger type. Think Policybazaar / Lemonade.

**Signature elements:**
- B2B: **ConfidencePill** — `"84 high"` / `"32 low"`, appears wherever risk/fraud score surfaces.
- B2C: **TrustStrip** — settlement ratio + rating + sponsored label, identical on every plan card.

**Source:** `docs/project_ui.md`; `docs/InsureIQ_UI_Design.md` §1

---

## ADR-008 — ML / AI Stack

**Status:** `LOCKED`

| Use Case | Technology |
|---|---|
| Risk scoring + churn prediction | XGBoost / LightGBM + scikit-learn |
| Explainability (all models) | SHAP — mandatory, not optional |
| Fraud detection | Isolation Forest (anomaly) + XGBoost (classification) ensemble |
| Document OCR | Tesseract OCR |
| Entity extraction | Hugging Face Transformers (NER pipeline) |
| Text/document embeddings | Sentence-BERT |
| Vector similarity search | FAISS (in-memory) or pgvector (persistent) |
| Model serialization | `joblib` |

**Consequences:**
- All models trained offline on Kaggle public insurance datasets.
- Inference runs as FastAPI **background task** (non-blocking).
- Results written to `risk_scores` / `fraud_flags` tables; frontend polls or uses SSE.
- Every model output MUST include SHAP values — the SHAP chart in the UI is a design requirement.
- `model_version` column on result tables for auditability.
- No live training, no federated learning — explicitly out of scope.

**Source:** `InsureIQ_Project_Synopsis.pdf` §3.3; `docs/InsureIQ_Software_Design.md` §6; `InsureIQ_Feasibility_Study.pdf` §9

---

## ADR-009 — API Design Conventions

**Status:** `DECIDED`

**URL structure:**
```
/auth/*          — authentication (public or semi-public)
/tenants/*       — tenant management
/policy-types    — product catalog
/applications/*  — policy applications
/policies/*      — issued policies
/claims/*        — claims
/underwriting/*  — underwriter-specific
/agent/*         — agent-specific
/admin/*         — tenant admin operations
/console/*       — super-admin (tenant_id = null)
/marketplace/*   — B2C marketplace
/ml/*            — ML inference (internal, not exposed to browser)
```

**Response envelope (all endpoints):**
```json
{
  "success": true,
  "data": { "..." },
  "error": null,
  "meta": { "page": 1, "per_page": 20, "total": 143 }
}
```

**Error response:**
```json
{
  "success": false,
  "data": null,
  "error": "Human-readable message",
  "meta": { "code": "POLICY_NOT_FOUND" }
}
```

- Pagination: cursor-based for high-volume lists (claims queue, audit log); offset for low-volume (users, policy types).
- No API versioning for the academic prototype.

**Source:** Implementation planning — `proj_docs/implementation_plan.md`

---

## ADR-010 — Containerization & Local Dev

**Status:** `DECIDED`

**Decision:** **Docker Compose for local development. No Kubernetes.**

| Service | Image | Purpose |
|---|---|---|
| `db` | `pgvector/pgvector:pg16` | PostgreSQL + pgvector |
| `redis` | `redis:7-alpine` | Cache |
| `backend` | Python 3.11-slim Dockerfile | FastAPI + Uvicorn |
| `frontend` | Node 20-alpine Dockerfile | Vite dev server |

**Consequences:**
- `docker-compose up --build` brings entire stack up from cold in under 90 seconds.
- Hot-reload: Uvicorn `--reload` (backend), Vite HMR (frontend).
- Persistent volumes: `postgres_data`, `redis_data`.
- `.env` file maps into containers via `env_file: .env`.
- No external cloud services for local dev (S3 → local filesystem in dev mode).

**Source:** `docs/InsureIQ_Software_Design.md` §5

---

## ADR-011 — Database Schema Strategy

**Status:** `DECIDED`

**Decision:** **Implement ~45-table MVP schema for Phase 1A. Expand module-by-module.**

The full schema design estimates 320–450 tables for a production platform. Implementing all upfront for an academic prototype is wasteful. Build only what is needed for each phase.

**MVP batches (implement in order):**

| Batch | Key Tables |
|---|---|
| 1 — Foundation | tenants, tenant_branding, users, user_profiles, roles, permissions, role_permissions, user_roles, tenant_users |
| 2 — Auth | passwords, refresh_tokens, user_sessions, login_attempts |
| 3 — Customer & KYC | customers, customer_profiles, identity_documents, kyc_applications, kyc_verification_results |
| 4 — Policy catalog | insurance_products, policy_types, coverages, premium_bands, applications, application_documents, application_status_history |
| 5 — Policies | policies, policy_coverages, policy_documents, policy_status_history |
| 6 — Claims | claims, claim_documents, claim_status_history, adjuster_notes |
| 7 — Underwriting/AI stubs | risk_scores, fraud_flags, underwriting_decisions |
| 8 — Billing | subscription_plans, tenant_invoices, commission_records |

**Schema rules:**
- Every table: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `created_at TIMESTAMPTZ DEFAULT now()`, `updated_at TIMESTAMPTZ DEFAULT now()`.
- Every non-platform table: `tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE`.
- Status columns: `VARCHAR` with `CHECK` constraint — NOT Postgres ENUM (easier to migrate).
- No `deleted BOOLEAN`. Use `archived_at TIMESTAMPTZ` where soft-delete is needed.
- One Alembic migration file per batch. Never combine unrelated changes.

**Source:** `schemadocs/`; implementation planning

---

## ADR-012 — Workflow State Machines

**Status:** `DECIDED`

**Decision:** All business object lifecycle transitions enforced server-side. Frontend is UI-only.

**Application:** `submitted → under_review → approved | rejected | referred`

**Policy:** `draft → active → renewal_due → renewed | lapsed | cancelled`

**Claim:** `submitted → doc_verification → fraud_check_complete → approved | rejected | escalated | withdrawn`

**Consequences:**
- Illegal transitions return `400 Bad Request`. Frontend cannot bypass.
- Every transition logged in `_status_history` table: `timestamp`, `from_status`, `to_status`, `actor_user_id`, `note`.

**Source:** `docs/InsureIQ_Software_Design.md`; implementation planning

---

## ADR-013 — Marketplace Architecture

**Status:** `DECIDED`

**Decision:** **The marketplace never underwrites. It is a distribution and comparison layer only.**

**Consequences:**
- Marketplace quote requests are fan-out read operations across tenant risk engines.
- Academic prototype: quote fan-out is simulated with mock data (real event-bus infrastructure deferred).
- "Apply" in marketplace routes the user into the selected tenant's B2B application workflow.
- Marketplace has no access to individual tenant policy/claims data — product catalog only.
- My Insurance unified dashboard and Document Vault are platform-level read operations.

**Source:** `docs/InsureIQ_Software_Design.md` §2; `docs/InsureIQ_UI_Design.md` §9

---

## ADR-014 — AI Inference Pattern

**Status:** `DECIDED`

**Decision:** ML inference is always asynchronous (background task). Results written to DB; frontend reads via polling or SSE.

**Pattern:**
1. User submits application/claim/document.
2. Server stores record, returns `202 Accepted` with record ID.
3. FastAPI `BackgroundTasks` enqueues inference job.
4. Job runs model, writes to `risk_scores` / `fraud_flags` / `claim_documents.extracted_data`.
5. Frontend polls until result populated; ConfidencePill / SHAP chart renders.

Academic prototype: `FastAPI BackgroundTasks` sufficient. No separate Celery worker required.

**Source:** `docs/InsureIQ_Software_Design.md` §6

---

## ADR-015 — Explicit Out-of-Scope Items

**Status:** `LOCKED`

The following must NOT be implemented in the academic prototype:

| Item | Reason |
|---|---|
| Live / online federated learning | `InsureIQ_Feasibility_Study.pdf` §9 — explicitly out of scope |
| IRDAI regulatory compliance filing | Feasibility study — out of scope |
| Real payment gateway | Simulated billing only |
| OAuth / social login | Not in requirements |
| SAML SSO for enterprise tenants | Not in requirements |
| MFA enforcement in UI | Tables designed; wiring deferred |
| Full event-bus B2C quote fan-out | Simulated for academic prototype |
| Multi-region data residency | Not required |
| Production SMTP delivery | In-app notifications only |
| Kubernetes deployment | Docker Compose is sufficient |
| Performance optimization at scale | Functional correctness first |

**Source:** `InsureIQ_Feasibility_Study.pdf` §9; `PROJECT_CONTEXT_EVOLUTION.md`
