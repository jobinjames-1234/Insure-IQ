# InsureIQ UI Design — InsureIQ Super-Admin (Platform Operator)

**Side:** Platform operator console (distinct application shell) · **Logs in at:** `console.insureiq.com`

---

## 1. Who this is and what the screen owes them

This is InsureIQ's own team, not any tenant's staff — the people running the platform that every insurer and every marketplace customer depends on. This role sits above the tenant/marketplace boundary entirely, which is exactly why it needs its own visually distinct console rather than living as "one more role" inside a tenant's shell: the entire safety model of the platform depends on it being structurally impossible to mistake this console for a tenant's own admin view. A super-admin accidentally believing they're inside a specific tenant's context (or a tenant admin somehow landing here) is the kind of mistake multi-tenant incidents are made of, and the design's first job is to make that mistake visually unthinkable, not just technically prevented.

This is also a deliberately low-frequency, alert-driven role in a healthy platform — the console should feel calm on a normal day and should escalate visibly, not subtly, when something needs a human.

**Visual register:** distinct from both the tenant portal and the marketplace — a darker, more technical chrome (closer to a cloud-provider console like AWS or Vercel's dashboard than to either consumer product), no tenant branding anywhere, InsureIQ's own operator-facing mark instead. Every screen that touches a specific tenant's data displays that tenant's name in a persistent, impossible-to-miss context bar, so a super-admin scrolling through one tenant's billing detail is never in doubt about whose data they're looking at.

---

## 2. Navigation shell

Left sidebar, dark chrome: **Platform overview**, **Tenants**, **Billing oversight**, **Model registry** (Phase 2), **Platform audit log**. A search bar pinned at the top (search by tenant name, tenant ID, or customer universal ID) reflects this role's actual daily need — jumping to a specific tenant or account to investigate something, more often than browsing linearly through the sidebar.

---

## 3. Pages, in full

### 3.1 Platform overview

**Purpose:** is the platform healthy, right now.

**Layout:** metric cards — tenant count by tier (small/medium/large/enterprise), platform uptime, error rate, total marketplace lead volume (today/this week) — followed by an alerts panel surfacing anything currently needing attention: a tenant approaching its usage limits, a model showing drift (Phase 2), a billing failure. This alerts panel is the actual heart of the page — on a calm day it's empty or near-empty, and it should look genuinely calm, not padded with low-priority noise just to have content.

**Empty/calm state:** "All systems normal" stated plainly, with the metric cards still visible — a quiet console is the goal state, not a design failure to compensate for.

### 3.2 Tenant directory

**Purpose:** every tenant, searchable, for both routine lookup and provisioning a new one.

**Layout:** a table — tenant name, plan tier, isolation mode (shared / dedicated schema / dedicated database), status (active / suspended / provisioning), and a "view" action per row. A persistent "Provision new tenant" button opens the wizard (below). Filters for tier and status support the common task of, say, reviewing every enterprise-tier tenant's isolation setup at once.

**Tenant detail (opened from a row):** a read-focused view of that one tenant's configuration, current plan, usage against limits, and a link into billing oversight and model registry filtered to just this tenant — this is where the persistent tenant-name context bar matters most, since it's the screen most likely to be open for an extended investigation.

### 3.3 Tenant provisioning wizard

**Purpose:** onboard a new insurer — a distinct, infrequent, multi-step flow, reached from the tenant directory rather than the overview, since it's a deliberate action, not something to stumble into.

**Layout:** a 4-step wizard — **Details** (tenant name, subdomain or custom domain) → **Plan & isolation** (tier selection, shared vs. dedicated isolation mode, with a plain-language cost/isolation tradeoff summary rather than raw infrastructure jargon) → **Initial admin** (that tenant's first Administrator account) → **Review & provision**, which shows a summary before committing, since provisioning creates real infrastructure (a schema or database) that isn't casually undone.

**Post-provisioning state:** the new tenant appears in the directory with a "provisioning" status that updates live (schema creation, default template seeding, branding setup) rather than a spinner with no detail — this is infrastructure work with real steps, and showing them briefly builds trust that something real is happening.

### 3.4 Billing oversight

**Purpose:** platform-wide revenue health, across both B2B subscriptions and B2C commission.

**Layout:** aggregate MRR at the top, broken into B2B subscription revenue and B2C commission/lead-fee revenue as two clearly separated figures (these are genuinely different businesses with different dynamics, and conflating them into one number would hide which side is actually driving growth). Below that, a per-tenant invoice-status table (paid / overdue / failed) and a separate commission-ledger summary for the marketplace side.

### 3.5 Model registry (Phase 2)

**Purpose:** which model version runs where, and whether any of them are drifting.

**Layout:** a table — model type (risk scoring, fraud detection, document intelligence, churn), tenant, current version, deployed date, and drift status. Drift alerts here are the technical, detailed version of what a tenant administrator sees in plain language on their own AI settings page — this screen shows the actual metrics (accuracy delta, data-distribution shift) since this audience is equipped to act on them directly (trigger a retrain, roll back a version).

### 3.6 Platform audit log

**Purpose:** the full record of platform-level actions — provisioning events, billing changes, and any escalated support actions taken on a tenant's behalf.

**Layout:** a filterable table, similar in structure to a tenant administrator's own audit log but scoped to platform-level actions rather than underwriting/claims decisions (those stay inside each tenant's own audit trail, which this console can view via tenant detail but does not duplicate here).

---

## 4. Full journey, step by step

**Calm-day loop:** platform overview → confirm the alerts panel is empty or routine → done. This should be a genuinely short visit on most days.

**Investigation loop (the common real task):** search bar → find the specific tenant or account in question → tenant detail → review configuration, usage, or billing status → resolve directly or escalate into model registry / billing oversight for a deeper look.

**Provisioning loop, infrequent:** tenant directory → provision new tenant → 4-step wizard → new tenant appears live-updating in the directory → done, typically followed by handing off to that tenant's own new Administrator to take it from there.

**Alert-driven loop:** an alert on platform overview (drift, billing failure, usage limit) → click through directly to the relevant detail screen (model registry or billing oversight, pre-filtered to the flagged tenant) → resolve or escalate.

---

## 5. Mobile considerations

This console is desktop-only by design — provisioning, billing oversight, and model-registry work all involve dense tables and multi-step decisions that don't meaningfully compress to a phone, and pretending otherwise would risk exactly the kind of careless, on-the-go action (provisioning a tenant, changing a billing record) that this role's entire design philosophy is built to prevent.
