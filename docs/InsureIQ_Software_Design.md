# InsureIQ — Software Design Document
### Multi-Tenant B2B–B2C Insurance Intelligence Platform

This document translates the requirements/gap-analysis brief into an actual system design: architecture, data model, module boundaries, technology choices, and end-to-end flows — treated as a commercial product with paying tenants and a live marketplace, not a coursework prototype.

---

## 1. Design Principles (and why they're non-negotiable here)

Four decisions shape everything downstream, and they need to be made before a single migration runs — retrofitting any of them later costs several times more than building them in from day one:

1. **Tenant-awareness is architectural, not a feature.** Every table, job, cache key, and background task carries tenant context from the start. This is the single most common reason multi-tenant SaaS rebuilds happen late — teams add a `tenant_id` column after the fact and discover it's threaded through queued jobs, cron tasks, and caches inconsistently.
2. **The marketplace never underwrites.** B2C is a distribution and comparison layer that hands qualified leads to a tenant's own B2B workflow. It carries no insurance risk itself — this is exactly the operating model of Policybazaar, Compare the Market, and Insurify, and it's what keeps the marketplace's own liability minimal.
3. **Cross-tenant intelligence is consent-gated by construction**, not by policy. The Universal Risk Score and Shared Fraud Intelligence modules must be technically incapable of moving raw tenant data across the boundary — the safeguard has to live in the pipeline, not in a document nobody reads.
4. **Phase 1 must be a complete, sellable product with the AI switched off.** Feature-tier gating (basic vs. AI-premium) only works commercially if the non-AI platform is genuinely usable and valuable on its own — this is also what de-risks the project if Phase 2 slips.

---

## 2. Multi-Tenancy Architecture (Part A foundation)

### 2.1 Isolation model: hybrid, tiered by tenant size

There is no single "correct" multi-tenant database pattern — the three standard options trade off isolation, cost, and operational load:

| Pattern | Isolation | Cost/complexity | Best for |
|---|---|---|---|
| Shared DB, shared schema (`tenant_id` column + row-level security) | Logical only; RLS moves the safety net from "developer remembered the WHERE clause" to "the database won't return rows you shouldn't see" | Lowest cost, one migration path, but noisy-neighbor risk at scale | Small/starter insurers |
| Schema-per-tenant | Moderate — schemas isolate objects but share the DB instance/connections | Migrations must run per schema; schema sprawl gets hard to manage past a few hundred tenants | Mid-size insurers |
| Database-per-tenant | Strongest; each tenant is fully isolated (own backup granularity, own encryption keys) | Highest cost, connection-pool exhaustion at scale, migrations must be coordinated across every database | Large/regulated insurers with strict compliance demands |

**Recommendation for InsureIQ:** a **tiered hybrid**, matching how the plan design already implies different insurer sizes:
- **Small/medium insurer tenants** → shared PostgreSQL cluster, shared schema, `tenant_id` on every row, enforced via **Postgres Row-Level Security** (not just application-layer WHERE clauses — RLS makes a forgotten filter fail closed instead of leaking data).
- **Large/enterprise insurer tenants** → dedicated schema or dedicated database, offered as a paid "dedicated infrastructure" enterprise tier — which also gives the billing model a natural upsell lever beyond the AI-feature tiers already scoped.
- **Tenant context propagation:** tenant ID is embedded in the auth JWT at login and re-validated on every request; a middleware layer resolves it to a schema/connection before any query executes. This must also cover background jobs, scheduled tasks, and webhook handlers — not just HTTP request handlers — since retrofitting tenant-context into jobs after the fact is the single most underestimated cost in multi-tenant builds.
- **Analytics/cross-tenant reporting** (super-admin dashboards, industry benchmarking in Phase 2 Part B) reads from a **separate analytics warehouse** fed by a change-data-capture pipeline, never by querying tenant operational databases directly. This keeps the "can InsureIQ's own ops team see everything" question answerable and auditable, and avoids operational databases being touched by ad hoc cross-tenant queries.

### 2.2 Tenant provisioning workflow

1. Super-admin (InsureIQ operator, not a tenant admin) creates a tenant record → tenant ID, plan tier, and isolation mode (shared/dedicated) chosen based on size and compliance need.
2. Provisioning service creates the schema/database, seeds default policy-type templates and role definitions, and creates the tenant's first Administrator account.
3. Branding service allocates a subdomain (`{tenant}.insureiq.app`) or accepts a custom-domain CNAME, and stores a theme record (logo, colors, name) resolved by the frontend at load time.
4. Billing service creates a subscription record in the chosen tier and starts usage metering from day one, even before any policies are issued.
5. Tenant admin then configures policy types, coverage rules, premium bands, and approval thresholds — entirely within their own tenant boundary, with no visibility into other tenants' configuration.

### 2.3 Cross-tenant super-admin console

A distinct application (or distinct role inside the same shell) from any tenant's Administrator view: tenant lifecycle management, platform health, cross-tenant billing/invoicing oversight, and — once Phase 2 lands — model registry and drift-monitoring oversight across tenants. This is deliberately kept separate in the UI and in the authorization model so a bug can never let a tenant admin see another tenant's console.

---

## 3. Core Data Model

The domain entities are unchanged in spirit from the original abstract; what's added is the tenancy dimension and the marketplace's read-model layer.

### 3.1 Entity-relationship overview

```
erDiagram
  TENANTS ||--o{ USERS : employs
  TENANTS ||--o{ POLICY_TYPES : configures
  TENANTS ||--o{ POLICIES : issues
  TENANTS ||--o{ CLAIMS : processes
  USERS ||--o{ POLICIES : underwrites
  CUSTOMERS ||--o{ POLICIES : holds
  CUSTOMERS ||--o{ CLAIMS : files
  POLICIES ||--o{ CLAIMS : "covered by"
  POLICIES }o--|| POLICY_TYPES : "is a"
  CUSTOMERS ||--o{ DOCUMENTS : uploads
  CLAIMS ||--o{ DOCUMENTS : supports
  CLAIMS ||--o{ FRAUD_FLAGS : triggers
  POLICIES ||--o{ RISK_SCORES : "scored by"
  CUSTOMERS ||--o{ MARKETPLACE_LEADS : generates
  MARKETPLACE_LEADS }o--|| TENANTS : "routed to"
  CUSTOMERS ||--o{ CONSENT_GRANTS : authorizes
  TENANTS {
    uuid id PK
    string name
    string isolation_mode
    string plan_tier
    string subdomain
  }
  USERS {
    uuid id PK
    uuid tenant_id FK
    string role
    string email
  }
  CUSTOMERS {
    uuid id PK
    string kyc_status
    string universal_id
  }
  POLICIES {
    uuid id PK
    uuid tenant_id FK
    uuid customer_id FK
    uuid policy_type_id FK
    string status
    numeric premium
  }
  CLAIMS {
    uuid id PK
    uuid tenant_id FK
    uuid policy_id FK
    string status
    numeric amount_claimed
  }
  RISK_SCORES {
    uuid id PK
    uuid policy_id FK
    string model_version
    int score
  }
  FRAUD_FLAGS {
    uuid id PK
    uuid claim_id FK
    string model_version
    float confidence
  }
  MARKETPLACE_LEADS {
    uuid id PK
    uuid customer_id FK
    uuid routed_tenant_id FK
    string status
  }
  CONSENT_GRANTS {
    uuid id PK
    uuid customer_id FK
    string data_scope
    string granted_to
  }
```

Note the deliberate asymmetry: `CUSTOMERS` is a **platform-level** entity (one row per real person, identified by a `universal_id`), while `POLICIES` and `CLAIMS` carry `tenant_id` and physically live inside that tenant's isolated storage. The marketplace never merges tenant data stores — the Unified Policy & Claims Dashboard (Section 5) is a read-model each tenant syncs into, keyed by `universal_id`, not a cross-tenant JOIN.

### 3.2 Why the customer identity is split this way

This single design decision is what makes the B2B/B2C split actually work: an insurer's tenant database can be dropped, migrated, or made fully isolated (dedicated-database tier) without touching how the customer's cross-insurer identity or marketplace history is stored. The alternative — one shared `customers` table with tenant-scoped rows — would make the "customer sees all their policies in one dashboard" requirement fight against the "insurer data must stay isolated" requirement, instead of both being true at once.

---

## 4. Module / Service Boundaries

A **modular monolith at launch, service-extractable later** is the right shape for this project — not a day-one microservices sprawl. The natural seams (below) become service boundaries exactly when a module's load profile, deployment cadence, or team ownership diverges from the rest — which for an academic/early-commercial build is usually Phase 2 onward.

| Module | Owns | Talks to |
|---|---|---|
| **Identity & Access** | Tenant users, customer accounts, roles, JWT issuance, tenant resolution | Everything (cross-cutting) |
| **Policy & Underwriting** (B2B core) | Policy types, applications, underwriting decisions | Risk Scoring (Phase 2), Billing |
| **Claims** (B2B core) | Claim intake, adjuster workflow, settlement | Fraud Detection (Phase 2), Document Intelligence (Phase 2) |
| **Billing & Commission** | Subscriptions, usage metering, invoices, commission ledger | All revenue-generating modules |
| **Marketplace Catalog & Comparison** (B2C) | Cross-tenant product listings, comparison, ranking | Policy & Underwriting (read-only sync) |
| **Lead & Application Routing** (B2C) | Quote fan-out, lead logging, application hand-off | Marketplace Catalog, Policy & Underwriting |
| **Unified Dashboard (read-model)** (B2C) | Cross-tenant policy/claims aggregation for the customer view | Event Bus (consumes tenant events) |
| **AI Model Platform** (Phase 2) | Model registry, per-tenant model versions, drift monitoring | Risk Scoring, Fraud, Churn, Document Intelligence |
| **Consent & Governance** (Phase 2 Part B) | Consent grants, data-scope enforcement, audit trail | Universal Risk Score, Shared Fraud Intelligence |

An **event bus** (Kafka or Redis Streams) connects the B2B tenant cores to the B2C read-model and to the AI platform, so that a claim status change inside one tenant propagates to the customer's unified dashboard and to any fraud-signal pipeline without the marketplace ever querying a tenant's database directly.

---

## 5. Phase 1 — Foundation Platform, as a working system

### 5.1 Part A: B2B tenant core — request flow

A policy application, end to end:

1. Customer (inside `app.abcinsurance.com`, the tenant-branded portal) submits an application with uploaded documents.
2. Identity & Access resolves tenant context from the subdomain, attaches `tenant_id` to every subsequent write.
3. Policy & Underwriting creates an application record in `pending` status; Billing's usage meter increments the tenant's "applications processed" counter (this matters even pre-AI, since per-policy billing starts from day one).
4. An Underwriter reviews the application in their tenant-scoped queue, approves/rejects/refers, and adjusts premium within their configured bounds.
5. On approval, Policy & Underwriting emits a `policy.issued` event onto the event bus.
6. The Unified Dashboard read-model (B2C side) and any Marketplace lead-attribution record consume that event, if the application originated from a marketplace-routed lead.

### 5.2 Part B: B2C marketplace — request flow

The differentiator here is that the marketplace is a genuine distribution layer, mirroring how Policybazaar-style aggregators operate: it never underwrites, it hands qualified applications to the tenant that will actually issue the policy.

1. Customer creates a single InsureIQ account, completes KYC once (Document Vault stores it centrally, reused across every subsequent application to every tenant).
2. Customer requests a quote (e.g. motor insurance); Lead & Application Routing fans this out as parallel requests to every relevant tenant's Phase 2 Part A risk-scoring endpoint (pre-Phase-2, this falls back to each tenant's static premium bands).
3. Each fanned-out request is logged as a `MARKETPLACE_LEAD` — the unit that drives commission and lead-generation revenue.
4. Comparison Engine ranks results using the documented, auditable ranking algorithm (price, claim-settlement ratio, customer rating — never "highest bidder first"); any sponsored placement is visibly labeled, mirroring how price-comparison-site regulation in mature markets (e.g. UK FCA guidance) requires ranking logic to be disclosed.
5. Customer selects an insurer; Application Routing hands the application, documents, and KYC data into that tenant's ordinary Phase 1 Part A "New Application" queue — indistinguishable, from the underwriter's side, from a customer who applied directly.
6. Once issued, the policy and all future claim-status changes sync (via the event bus) into the customer's Unified Policy & Claims Dashboard.

### 5.3 Billing & commercial layer

Runs underneath both parts from day one:
- **Usage metering** counts policies issued and claims processed per tenant (feeds per-policy/per-claim pricing).
- **Feature-tier gating** is enforced at the API-gateway/middleware level, not just hidden in the UI — a tenant on the "basic" tier should get a `403` from the risk-scoring endpoint, not just a hidden button, since this is the actual mechanism that makes AI features sellable as an upsell.
- **Commission ledger** (B2C) attributes each marketplace-originated policy sale back to a lead record for commission calculation, feeding the same invoicing pipeline as the B2B subscription billing.

---

## 6. Phase 2 — AI Intelligence Layer, operationalized

### 6.1 Part A: per-tenant models, shared infrastructure

The four modules (risk scoring, fraud detection, document intelligence, churn prediction) are unchanged in purpose from the original abstract; what Phase 2 adds is the **MLOps layer** needed to run them safely across many tenants:

- **Model registry**: tracks which model version is deployed to which tenant — critical because underwriting rules and risk appetite differ by insurer, so a one-size-fits-all model is both a technical and a commercial mismatch.
- **Base model + tenant fine-tune** strategy: train a shared base model (e.g. on fraud patterns common across the industry) and fine-tune per tenant, rather than training every model from scratch per tenant — this keeps training cost from scaling linearly with tenant count while still respecting data isolation, since only model weights, not raw claims data, are shared upstream.
- **Per-tenant drift monitoring**: a model trained on one insurer's claims mix (say, mostly auto) will silently degrade if applied unchanged to another's (say, mostly health) — this needs its own dashboard, extending the tenant Administrator's existing "manage model versions" capability into a proper MLOps view.
- **Explainability by default**: SHAP-based feature importance is not optional here — underwriters and adjusters are making decisions with legal/regulatory weight, and "the model said so" is not an audit-defensible answer in a regulated domain.

### 6.2 Part B: cross-tenant AI, built consent-first

This is the highest-governance part of the entire system, and it needs to be designed differently from Part A, not just layered on top of it.

**Universal Insurance Risk Score.** Rather than each tenant computing an isolated score, this is customer-owned and portable — closely analogous to how open-banking/account-aggregator frameworks handle cross-institution financial data sharing. Concretely:
- A `CONSENT_GRANTS` record specifies exactly what the customer has agreed to share (which data elements, with which counterpart tenants, for how long) — enforced at the query layer, not just documented in a privacy policy.
- The score itself is computed from data the customer explicitly released, not from a background aggregation of everything InsureIQ happens to hold — this is the difference between "portable credit-score-like trust" and a silent cross-tenant surveillance layer, and it's the detail that keeps this feature commercially viable without becoming a regulatory liability.

**Shared Fraud Intelligence.** The requirements explicitly flag this as "subject to legal and privacy requirements," so raw data pooling across tenants is out of scope by design. Two realistic architectures, both well-established in current fraud-detection research:
- **Federated learning**: each tenant's fraud model trains locally and contributes only gradient/parameter updates to a shared global model — insurers "learn fraud patterns without sharing their data," which is the core value proposition of federated approaches in cross-institution fraud detection (used in practice for cross-hospital-insurer and cross-bank fraud models). Differential-privacy noise injection on the shared updates adds a second layer of protection against reconstructing any individual tenant's raw data from the aggregated model.
- **Hashed/blinded-identifier matching** (simpler, lower-fidelity fallback): a claimant pattern flagged as fraudulent by one insurer surfaces as a risk *signal* — a hashed identifier and a risk category, never raw personal data or claim detail — to another tenant's fraud pipeline.

Given the complexity of standing up true federated training, the realistic build order is: ship the hashed-identifier matching scheme first (weeks, not months, of engineering), and treat full federated learning as the natural Phase 2+ extension once there's a large enough tenant base for it to be worth the infrastructure — this is also the honest, defensible answer if asked "why isn't federated learning in the MVP."

**Other Part B modules** (AI Insurance Advisor, personalized cross-sell, premium comparison intelligence, benchmarking dashboards) all reuse the Sentence-BERT + FAISS/pgvector retrieval stack already scoped for the B2B optional Q&A assistant, just pointed at the aggregated, marketplace-wide product catalog instead of a single tenant's — these are lower-governance than the two modules above since they operate on data the marketplace already legitimately holds (product listings, the customer's own comparison history), not cross-tenant personal data.

---

## 7. Security, Compliance & Governance Summary

- **Data isolation** enforced at the database layer (RLS or schema/DB separation), not only in application code — this is the single biggest lesson from how multi-tenant SaaS incidents actually happen (a forgotten `WHERE tenant_id = ?`).
- **Consent as a first-class object**, not a checkbox buried in onboarding — every cross-tenant AI feature reads from `CONSENT_GRANTS` before touching customer data, and every grant is revocable.
- **Auditability**: underwriting decisions, claim settlements, and every AI-assisted recommendation (risk score, fraud flag) are logged with the model version that produced them, satisfying the existing "access historical underwriting decisions for audit purposes" requirement and extending it to model-assisted decisions.
- **Ranking transparency**: the marketplace's ranking algorithm and any sponsored placement are documented and disclosed in-product, matching the regulatory posture mature-market comparison sites already operate under.

---

## 8. Recommended Technology Stack

| Layer | Choice | Why |
|---|---|---|
| Core backend | Node.js/NestJS or Django (modular monolith, service-extractable) | Fast to iterate on a modular monolith; clean module boundaries map directly to Section 4 |
| Database | PostgreSQL (RLS for shared tenants; schema/DB-per-tenant for enterprise tier) | Native RLS support is the deciding factor for the hybrid isolation model |
| Event bus | Kafka or Redis Streams | Syncs tenant events into the B2C read-model and AI pipelines without cross-tenant queries |
| Analytics warehouse | Separate OLAP store (e.g. BigQuery/ClickHouse), fed via CDC | Keeps cross-tenant benchmarking off tenant operational databases |
| Risk & churn models | XGBoost / LightGBM | Matches original abstract; production-proven for tabular underwriting/churn data |
| Fraud detection | Random Forest / Autoencoder + SHAP | Explainability requirement for regulated decisions |
| Document intelligence | Tesseract OCR + Hugging Face Transformers (NER) | Matches original abstract's OCR/NLP scope |
| Cross-tenant fraud (Phase 2 Part B) | Hashed-identifier matching → federated learning (phased) | De-risks delivery; federated learning is the correct end-state per current research |
| Retrieval/advisor stack | Sentence-BERT + FAISS/pgvector + lightweight LLM | Shared across B2B optional assistant and B2C advisor |
| Model ops | Simple model registry + versioned inference endpoints (cloud-hosted) | Matches Section 6.1's per-tenant model requirement |

---

## 9. Delivery Sequencing (mapped to the roadmap)

1. **Phase 1 Part A** (B2B foundation, multi-tenant from day one) — the implementable, defensible core.
2. **Billing & commercial layer** — stood up alongside Part A, not bolted on later, since usage metering needs data from day one.
3. **Phase 1 Part B** (marketplace) — only once Part A is stable, since the marketplace routes into it.
4. **Phase 2 Part A** (per-tenant AI) — plugs into the now-stable B2B workflow.
5. **Phase 2 Part B** (cross-tenant AI) — last, and internally sequenced by governance weight: personalization/advisor first (low governance) → Universal Risk Score (consent framework required) → Shared Fraud Intelligence (highest governance, hashed-matching before any federated learning).

This ordering keeps every intermediate state a shippable, demonstrable product — which is exactly what makes the two-phase structure defensible even if only Phase 1 is fully delivered within a given timeline.
