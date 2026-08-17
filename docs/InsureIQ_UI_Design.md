# InsureIQ — UI Design Specification
### Views classified by user, page-by-page breakdown, and navigation flow per user

---

## 1. Two visual skins, one design system

InsureIQ is two products wearing two different faces on one shared component library — this is deliberate, and it mirrors how real hybrid B2B–B2C platforms (Gusto, Rippling, or Deel on the B2B side; Policybazaar, Lemonade, and Compare the Market on the consumer side) actually split their design language.

**B2B tenant chrome — quiet, dense, brand-neutral.** Underwriters and adjusters live here for eight hours a day; the UI should disappear so the data doesn't have to compete with it. Grayscale surfaces, one configurable accent color per tenant (so "ABC Insurance's portal" actually looks like ABC Insurance's), tables over cards, monospace for policy/claim IDs, status conveyed with small text-and-color pills rather than illustration. This is the Stripe-dashboard / Gusto register of interface: restrained, keyboard-friendly, built for repeated use.

**B2C marketplace — warm, comparative, trust-signaling.** A customer comparing three insurers for the first time needs confidence, not density: bigger type, rating stars, a visible claim-settlement-ratio badge on every card, a clearly labeled "sponsored" slot (see the mockup above), and a single accent color that's InsureIQ's own brand, not any tenant's. This is the register of Policybazaar, Lemonade, and Compare the Market — the products this module is explicitly modeled on.

**Shared underneath both:** the same typographic scale, the same status-color vocabulary (green = healthy/approved, amber = needs attention, red = flagged/rejected), the same component primitives (metric card, data table, status pill, empty state). Only the density and warmth shift between the two skins.

**Signature elements** (the one memorable thing on each side):
- B2C: the **trust strip** — settlement ratio + rating + sponsored label, appearing identically on every plan card, comparison row, and insurer profile, so a customer learns to read it once and trusts it everywhere.
- B2B: the **confidence pill** — a single small badge (score + tier word: "32 low", "84 high") that appears identically wherever a risk score or fraud flag surfaces, from the queue table to the full application detail view.

---

## 2. User classification

| # | User | Side | Logs in at |
|---|---|---|---|
| 1 | End-customer (tenant policyholder) | B2B tenant portal | `{tenant}.insureiq.app` |
| 2 | Agent | B2B tenant portal | `{tenant}.insureiq.app` |
| 3 | Underwriter | B2B tenant portal | `{tenant}.insureiq.app` |
| 4 | Claims adjuster | B2B tenant portal | `{tenant}.insureiq.app` |
| 5 | Tenant administrator | B2B tenant portal | `{tenant}.insureiq.app` |
| 6 | InsureIQ super-admin | Platform operator console | `console.insureiq.com` |
| 7 | Marketplace customer | B2C marketplace | `insureiq.com` |

Note: #1 and #7 are the same kind of person (an individual buying insurance) but a genuinely different *experience* — one is inside a single insurer's branded world, the other is comparing across insurers on InsureIQ's own neutral ground. They're listed separately because their pages, navigation, and even visual skin differ.

---

## 3. End-customer (tenant policyholder) — B2B portal

### Pages
1. **Sign up / KYC** — identity verification, document upload, progress indicator (3 steps: details → documents → verification pending).
2. **Home / My policies** — card grid of active policies (type, premium, renewal date), a banner for anything needing action (renewal due, document missing).
3. **Browse & apply** — policy type gallery (auto, health, life, property) → application form → document upload → review & submit.
4. **Application status** — single-application tracker (Submitted → Under review → Approved/Rejected), read-only.
5. **File a claim** — guided form (incident details, documents, photos) → submission confirmation.
6. **Claim tracker** — status stepper (Submitted → Under review → Fraud check → Approved → Payment sent), adjuster notes visible where relevant.
7. **Policy detail** — coverage terms, premium history, documents, renewal reminders.
8. **Profile & documents** — KYC documents, contact details, notification preferences.

### UI flow
Sign up → home. From home, two branches: **apply for a new policy** (browse → form → submit → application status, which resolves back into home once approved and the policy appears as a card) or **manage an existing policy** (policy detail → file a claim → claim tracker, which the customer can leave and return to at any time from home). Home is always the return point — nothing is a dead end.

---

## 4. Agent — B2B portal

### Pages
1. **Agent dashboard** — assigned customer count, renewal pipeline value, commission-to-date, retention alerts needing attention.
2. **Customer portfolio** — searchable/filterable list of assigned customers, each row showing policy count and risk-of-lapse flag.
3. **Customer detail** — that customer's policies, claims, and a "recommended add-ons" panel (cross-sell suggestions, Phase 2).
4. **New application (on behalf of)** — same application form as the customer-facing one, with the agent as the submitter of record.
5. **Retention alerts** — list of at-risk policyholders (churn-flagged in Phase 2, manually flagged pre-AI), each with a one-click "log outreach" action.
6. **Commission tracker** — earned/pending commission by policy, exportable.

### UI flow
Dashboard → customer portfolio (day-to-day home base) → customer detail for any specific case → either **submit an application on their behalf** (loops back to that customer's detail once submitted) or **act on a retention alert** (log outreach, which clears the flag). Commission tracker is a side branch, checked periodically rather than part of the daily loop.

---

## 5. Underwriter — B2B portal

*(See the queue mockup above — this is that screen's home role.)*

### Pages
1. **Underwriting dashboard** — the metrics-and-queue view shown above: pending count, average risk score, approved/referred today, and the full application queue sorted by risk.
2. **Application detail** — applicant data, computed risk score with feature-importance breakdown (Phase 2), premium recommendation, and the approve / reject / refer action bar.
3. **Decision history** — past decisions on this tenant, filterable by outcome, for audit purposes.
4. **Model performance** (Phase 2) — how the risk model's predictions have tracked against actual claims outcomes, at a level the underwriter can sanity-check, not just the MLOps team.

### UI flow
Dashboard queue → click a row → application detail → decide (approve/reject/refer) → back to queue, one row shorter. Decision history and model performance are reference views, opened from the dashboard but not part of the per-application loop — they answer "was I right last time," not "what do I do next."

---

## 6. Claims adjuster — B2B portal

### Pages
1. **Claims dashboard** — open claims count, aging/SLA-at-risk count, fraud-flagged count, all as metric cards above a claims queue table (same visual pattern as the underwriter queue, different columns: claim ID, policy, amount claimed, fraud confidence, age).
2. **Claim detail** — extracted document data (Phase 2 OCR/NLP output) side-by-side with the original uploaded documents, fraud-flag explanation (SHAP factors, Phase 2), and the approve / reject / escalate action bar with a notes field.
3. **Investigation view** — for escalated/high-fraud-confidence claims: full claim history, related claims from the same policyholder, adjuster notes thread.
4. **SLA tracker** — claims sorted purely by age against the tenant's settlement-time target, for end-of-day triage.

### UI flow
Dashboard → claim detail (the bulk of the day) → decide or escalate. Escalated claims move into investigation view, which is a deeper, slower page reached only from a flagged claim, not from the main queue directly — this keeps the fast lane (routine claims) and the slow lane (investigations) from competing for the same screen.

---

## 7. Tenant administrator — B2B portal

### Pages
1. **Admin dashboard** — tenant-wide KPIs (policies sold, claims pending, average settlement time, revenue), the numbers a Gusto/Rippling-style admin home would lead with.
2. **User management** — list of the tenant's own users (agents, underwriters, adjusters), role assignment, account status.
3. **Policy configuration** — policy types, coverage rules, premium bands, approval thresholds — the tenant's own rules, editable only by them.
4. **Model & AI settings** (Phase 2) — which AI features are enabled (feature-tier gated), model version currently deployed, drift-monitoring status.
5. **Billing & invoices** — current plan tier, usage metering (policies/claims this cycle), invoice history, payment status.
6. **Audit log** — underwriting and claims decisions across the whole tenant, filterable, exportable.

### UI flow
Admin dashboard is the landing page and the return point for everything. From there: user management and policy configuration are periodic, low-frequency tasks (set once, revisited rarely); billing is checked monthly; audit log and model settings are checked reactively (something looked wrong, go verify) rather than on a schedule. This is a hub-and-spoke pattern, not a linear flow — unlike the underwriter/adjuster queues, there's no single daily task the admin repeats.

---

## 8. InsureIQ super-admin — platform operator console

*(Deliberately a separate application shell from any tenant's admin view — see Section 4.1.2 of the architecture doc for why.)*

### Pages
1. **Platform overview** — tenant count by tier, platform-wide health (uptime, error rates), total marketplace lead volume.
2. **Tenant directory** — every tenant, its plan tier, isolation mode, and status; search and filter.
3. **Tenant provisioning wizard** — create a new tenant: name, plan tier, isolation mode, initial admin account.
4. **Cross-tenant billing oversight** — aggregate MRR, per-tenant invoice status, commission ledger totals from the marketplace side.
5. **Model registry** (Phase 2) — which model version is deployed to which tenant, drift alerts across the whole platform.
6. **Platform audit log** — provisioning events, billing changes, and (with appropriate access controls) escalated support actions.

### UI flow
Platform overview is the daily check-in. Tenant provisioning is a distinct, infrequent wizard flow reached from the tenant directory, not from the overview directly. Model registry and billing oversight are reference views opened when something needs investigating — this console is intentionally low-frequency and alert-driven, since a super-admin should rarely need to intervene in a healthy multi-tenant system.

---

## 9. Marketplace customer — B2C (insureiq.com)

*(See the comparison-page mockup above — this is the core screen of this role's flow.)*

### Pages
1. **Home / landing** — a single "what are you insuring" entry point (motor, health, life, travel, home), not a dashboard — this role's first visit has nothing to return to yet.
2. **Quote request form** — a short structured form per category (vehicle details, family size, budget, etc.) feeding the AI Insurance Advisor in Phase 2, or a plain form pre-AI.
3. **Comparison results** — the trust-strip card grid shown above: premium, coverage, settlement ratio, rating, sponsored labeling, default ranking explained via a small "how we rank" link.
4. **Plan detail** — full coverage terms in plain language, add-ons, and the "apply" call to action.
5. **Application (routed)** — same core form fields as the tenant-side application, submitted once and handed off to the selected insurer's tenant workflow behind the scenes.
6. **My insurance (unified dashboard)** — every policy the customer holds across every insurer, in one list, each linking out to that policy's claim status.
7. **Unified claim tracker** — the same stepper pattern as the tenant-side claim tracker, but aggregating claims from whichever insurer they belong to.
8. **Document vault** — KYC and supporting documents uploaded once, reused across every application.
9. **AI advisor** (Phase 2 Part B) — conversational entry point as an alternative to the structured quote form, for a customer who doesn't know what they need yet.
10. **Universal risk score & consent center** (Phase 2 Part B) — shows the customer's portable score, and exactly what data they've consented to share with which counterpart insurers, with a revoke control per grant.

### UI flow
First-time flow is linear: home → quote request → comparison results → plan detail → application → (redirected into that insurer's confirmation, then back to) my insurance. Returning-customer flow is different: they land on **my insurance** first (it becomes the real home once they hold at least one policy), and only detour into a new quote request when they want to add coverage. The consent center is reached from my insurance or from a specific prompt (e.g., an insurer requesting access to the universal score) — it's a permissions screen, not a destination someone browses to for its own sake.

---

## 10. Cross-role navigation shell (how it all fits together)

Every B2B role shares one shell: a left sidebar showing only that role's pages (an agent never sees "policy configuration," an underwriter never sees "user management") plus the tenant's own logo/accent color at the top. The marketplace shares a different shell: a top nav (insureiq.com's own brand, category tabs, "my insurance" always visible once the customer holds a policy). The super-admin console is a third, visually distinct shell so it's never confusable with a tenant's own admin view — this is a deliberate safety signal as much as a design one: if the chrome looks different, a click in the wrong console is much harder to make by accident.
