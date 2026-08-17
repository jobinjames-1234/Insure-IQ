# InsureIQ UI Design — Underwriter

**Side:** B2B tenant portal · **Logs in at:** `{tenant}.insureiq.app`

---

## 1. Who this is and what the screen owes them

The underwriter's entire job is repeated, high-stakes judgment calls against a queue that refills every day. This is the highest-frequency, highest-density role in the whole product — someone who might make 30–80 decisions in a shift, each one carrying real financial and regulatory weight. The design has to optimize for two things simultaneously: speed (don't waste a single click on a routine, low-risk application) and defensibility (when a decision is questioned six months later, the record and the reasoning need to be reconstructable instantly).

**Visual register:** the densest, quietest screen in the product. No decoration, no illustration, no colorful cards competing for attention — status is conveyed through small, consistent pills (the confidence-pill signature element), and the whole layout is built around a queue-plus-detail pattern familiar from any serious ops tool (a support-ticket queue, a code-review list, an e-commerce order-fulfillment screen).

---

## 2. Navigation shell

Left sidebar: **Dashboard** (queue), **Decision history**, **Model performance** (Phase 2 only — hidden entirely for tenants on a non-AI plan tier rather than shown grayed-out, since a visible-but-disabled nav item invites confused support tickets). No customer-facing or agent-facing items ever appear here — this role's IA is deliberately narrow.

---

## 3. Pages, in full

### 3.1 Underwriting dashboard (the queue)

*(This is the screen shown in the earlier mockup — described here at full detail.)*

**Purpose:** the entire working day happens on or from this one screen.

**Layout:** four metric cards across the top — pending review, average risk score, approved today, referred today — giving a one-glance read on how the day is going before touching a single row. Below that, the application queue itself: a table sorted by risk score descending by default (the highest-stakes decisions surface first, since a low-risk application reviewed an hour late costs nothing, but a high-risk one sitting unreviewed is the actual operational risk). Columns: applicant name, policy type, premium, risk score (as a confidence pill — "32 low" in green, "61 medium" in amber, "84 high" in red), and status.

**Sort and filter controls:** sort by risk score, submission date, or premium value; filter by policy type and status. An underwriter working through a specific book (say, only property applications today) needs this without leaving the dashboard.

**Row interaction:** clicking a row opens application detail (below) in the same tab — not a modal, since the decision that follows deserves full screen real estate, not a cramped overlay.

**Empty state:** "Queue clear" — genuinely rare and worth stating plainly, since an empty queue after a busy morning is meaningfully different from an empty queue at 9am on a slow Monday, and the copy shouldn't pretend otherwise either way.

### 3.2 Application detail

**Purpose:** everything needed to decide, on one screen, without tab-switching.

**Layout:** a two-column layout on desktop. Left column: applicant data (personal details, asset/subject details, submitted documents, viewable inline). Right column, sticky as the left scrolls: the decision panel — computed risk score with a feature-importance breakdown (Phase 2: a small horizontal bar list, "credit history: +12, claims history: +8, location: -4" — enough to sanity-check the model's reasoning without demanding a data-science background to read it), the system's premium recommendation, and the action bar — **Approve**, **Reject**, **Refer for review** — each requiring a one-line justification note before it commits, since that note is what makes the decision auditable later.

**Premium adjustment:** the underwriter can adjust the recommended premium within the tenant's configured approval bounds directly in this panel — shown as an editable field with the system's number visible as a placeholder/reference, not hidden once overridden, so the audit trail shows both what the model suggested and what the human decided.

**Pre-AI state (Phase 1 only, no risk model yet):** the same layout, but the risk-score panel is replaced by the tenant's static actuarial band lookup — same visual position, same decision-panel structure, so the screen doesn't need to be redesigned once Phase 2 ships; the AI panel simply activates in the same slot.

### 3.3 Decision history

**Purpose:** audit and self-review — "was I right last time," not "what do I do next."

**Layout:** a filterable table of past decisions (approved/rejected/referred), each row expandable to show the original risk score, the underwriter's note, and — once enough time has passed — the actual claims outcome, closing the loop between prediction and reality. Filterable by outcome, date range, and policy type.

### 3.4 Model performance (Phase 2)

**Purpose:** lets the underwriter (not just the MLOps team) see whether the model they're relying on is actually earning that trust.

**Layout:** a simple, non-technical view — predicted risk tier vs. actual claims rate, plotted as a small bar comparison per tier, with a one-line plain-language summary ("Applications scored 'high risk' filed claims at 3.2× the rate of 'low risk' ones over the last quarter") rather than raw model metrics (AUC, precision/recall) that would mean nothing to this audience. This is intentionally a lighter-weight view than the tenant admin's or super-admin's model-registry screens — it answers "should I still trust this," not "how do I retrain it."

---

## 4. Full journey, step by step

**Core loop, repeated all day:** dashboard queue → click highest-priority row → application detail → review data and risk breakdown → approve / reject / refer with a note → back to queue, one row shorter, next highest-priority row now at the top.

**Referred applications:** a referred application doesn't disappear from this underwriter's world — it either routes to a senior underwriter's queue (if the tenant's role hierarchy has one) or stays visible in decision history tagged "referred," so nothing silently vanishes from the audit trail.

**Periodic loop:** decision history and model performance are opened deliberately, away from the queue — typically at the start or end of a shift, or when a specific past decision is being questioned, not as part of the per-application rhythm.

---

## 5. Keyboard and speed considerations

Given the volume of decisions, this screen should support keyboard shortcuts for the core actions (approve/reject/refer) and arrow-key navigation between queue rows — the kind of speed layer a support-ticket tool or code-review tool would offer a power user, since an underwriter clicking through 60 applications a day genuinely benefits from never touching the mouse for the routine ones.

## 6. Mobile considerations

This role is desktop-primary — the two-column detail layout and the density of the queue table are not meant to compress well to a phone screen, and InsureIQ should not pretend otherwise. A lightweight mobile view exists only for checking queue status and approving genuinely routine, low-risk applications on the go; anything referred or high-risk is designed to wait for a desktop session, and the mobile view should say so rather than force a cramped decision panel onto a small screen.
