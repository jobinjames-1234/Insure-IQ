# InsureIQ UI Design — Tenant Administrator

**Side:** B2B tenant portal · **Logs in at:** `{tenant}.insureiq.app`

---

## 1. Who this is and what the screen owes them

The tenant administrator runs one insurer's side of the platform — not a single case at a time, but the operation as a whole: who works here, what the rules are, what it costs, and whether anything is going wrong that needs their attention. Unlike the underwriter or adjuster, there's no single repeated task that defines their day; this is a hub-and-spoke role, checking in on different concerns at different rhythms (billing monthly, user management occasionally, the dashboard perhaps daily, the audit log only when something needs verifying).

**Visual register:** the "business owner" register of the B2B side — closer to a Stripe or Gusto admin home than to the underwriter's queue. KPIs lead, configuration lives one level down, and nothing here is designed to be touched multiple times a day except the dashboard glance itself.

---

## 2. Navigation shell

Left sidebar: **Dashboard**, **Team** (user management), **Policy settings**, **AI settings** (Phase 2 only, hidden entirely on non-AI plan tiers), **Billing**, **Audit log**. This is the longest sidebar of any B2B role, reflecting the breadth (not depth) of this job — each item leads to a fairly self-contained area rather than a deep, multi-step flow.

---

## 3. Pages, in full

### 3.1 Admin dashboard

**Purpose:** the tenant's business health at a glance.

**Layout:** a row of metric cards — policies sold (this period), claims pending, average settlement time, revenue — the same four numbers a tenant's own leadership would ask about first. Below that, a lightweight activity feed: recent underwriting decisions, recent claim escalations, and any billing or model-drift alerts (Phase 2), each linking directly to the relevant detail rather than requiring a separate navigation step. This feed is intentionally shallow (last 10–20 items, not a full log) — the full history lives in the audit log; this is a glance, not a report.

**Time-range control:** a simple period selector (this week / this month / this quarter) above the metric cards, since "policies sold" and "revenue" are only meaningful with a stated window.

### 3.2 Team (user management)

**Purpose:** who has access, and to what.

**Layout:** a table of the tenant's own users — name, role (agent / underwriter / adjuster / administrator), status (active / suspended), last login. An "invite user" action opens a lightweight modal (role selection + email) rather than a full-page flow, since this is a quick, occasional task, not a wizard-worthy one.

**Role assignment:** changing a user's role is a direct edit on their row, with a confirmation step specifically when *removing* underwriter or administrator permissions (since that has audit and access implications), but no confirmation friction for routine additions.

### 3.3 Policy settings (configuration)

**Purpose:** the tenant's own underwriting rules, editable only by them, invisible to every other tenant.

**Layout:** organized by policy type (Auto, Health, Life, Property — only the types this tenant has enabled), each expandable to reveal coverage rules, premium bands, and approval thresholds as structured forms rather than free text, so the values feed directly into the underwriting engine without a translation step. Changes here are versioned — a small "last changed by X on [date]" line under each section, since premium-band changes are exactly the kind of thing that needs a paper trail if a customer later disputes a quote.

### 3.4 AI settings (Phase 2)

**Purpose:** which AI features are switched on, and how they're performing — the administrator's view into the model registry, one level less technical than the super-admin's.

**Layout:** a simple toggle list — risk scoring, fraud detection, document intelligence, churn prediction — each gated by the tenant's plan tier (an admin on a basic plan sees these as "upgrade to enable," not a broken toggle). For each enabled feature: current model version, last updated date, and a plain-language drift status ("Performing as expected" / "Under review — accuracy has dropped, our team is investigating") rather than raw drift-detection metrics.

### 3.5 Billing & invoices

**Purpose:** what this costs, and whether it's paid.

**Layout:** current plan tier and its included limits at the top, a usage meter below (policies issued / claims processed this cycle, shown as a simple progress bar against the plan's included volume — this is also where an upsell to a higher tier or the AI-feature add-on naturally surfaces, as a plain "you're near your limit" prompt rather than an aggressive upsell banner), and an invoice history table beneath, each row downloadable as a PDF.

### 3.6 Audit log

**Purpose:** the full, unabridged record — reached deliberately, not glanced at casually.

**Layout:** a filterable table of every underwriting decision and claims decision across the tenant, filterable by user, date range, and outcome, each row expandable to the full decision detail (the same view an underwriter or adjuster would see in their own decision history, but here aggregated across the whole team). This is the screen an administrator opens when something specific needs verifying — a customer dispute, an internal review — not a screen anyone scrolls idly.

---

## 4. Full journey, step by step

**Daily glance (optional, not required):** dashboard → scan the KPI cards and activity feed → done, unless something in the feed warrants a click-through.

**Periodic tasks, each a self-contained visit:**
- New hire joins the underwriting team → Team → invite user → assign role → done.
- Premium bands need adjusting for the new quarter → Policy settings → edit the relevant policy type's bands → saved, versioned.
- Monthly billing check → Billing → review usage against plan, download last invoice if needed.
- A customer disputes a claim decision from three months ago → Audit log → filter by claimant or date → open the specific decision → verify.

**Reactive tasks, triggered by the activity feed rather than scheduled:** a model-drift alert (Phase 2) appears in the dashboard feed → AI settings → review the flagged feature's status → escalate to InsureIQ support if needed (this hands off to the super-admin's world, outside this role's own console).

This is the one B2B role whose "flow" is genuinely non-linear — the design reflects that by making every sidebar item a fully self-contained destination rather than a step in a sequence.

---

## 5. Mobile considerations

Administrator tasks are overwhelmingly desktop tasks (configuration, billing, audit review all benefit from a full screen and, often, a keyboard for filtering/searching). The dashboard glance is the one screen worth a genuinely good mobile view — a tenant owner checking their numbers from a phone is a real, common case — while Team, Policy settings, and Audit log degrade gracefully to mobile but aren't designed around it.
