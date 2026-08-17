# InsureIQ UI Design — Agent

**Side:** B2B tenant portal · **Logs in at:** `{tenant}.insureiq.app`

---

## 1. Who this is and what the screen owes them

An agent's job is relationship management at volume — a portfolio of customers, each at a different point in their policy lifecycle, and a revenue target that depends on renewals not lapsing and new business getting written. Unlike the end-customer (occasional visitor) or the underwriter (heads-down queue worker), the agent's day is a mix of proactive outreach and reactive service, so the UI needs to answer two different questions equally well: "who needs my attention right now" and "let me help this specific person."

**Visual register:** SaaS-dense but relationship-oriented — more like a CRM (Salesforce, HubSpot) than a back-office queue. Customer names and photos/avatars are prominent (this is a people business), status is conveyed through color-coded flags, and the dashboard leads with pipeline value and commission, the numbers an agent is actually compensated against.

---

## 2. Navigation shell

Left sidebar: **Dashboard**, **My customers**, **Retention alerts**, **New application**, **Commission**. Tenant accent color on the active item and the sidebar's top brand mark, same as every B2B role — the chrome should feel identical in structure to the underwriter's and adjuster's sidebars, differing only in the item list, since all three share the same tenant portal shell.

---

## 3. Pages, in full

### 3.1 Agent dashboard

**Purpose:** the day's starting point — what's the state of my book of business right now.

**Layout:** a row of metric cards (assigned customers, renewal pipeline value, commission-to-date this cycle, retention alerts open) followed by two lists below the fold: **upcoming renewals** (next 30 days, sorted by date) and **retention alerts** (customers flagged as at risk of lapsing). This dual-list layout is deliberate — renewals are scheduled work, retention alerts are unscheduled, urgent work, and mixing them into one undifferentiated feed would bury the urgent items.

**Empty state (new agent, no book yet):** a short explainer plus a "you'll see your assigned customers here once the admin assigns your first accounts" message — this role never starts from zero by their own action, so the empty state should say so rather than imply something's broken.

### 3.2 Customer portfolio

**Purpose:** the full list of assigned customers, for searching and triage.

**Layout:** a table, not cards — this is a working list an agent scans and filters, not a browsing experience. Columns: customer name, policy count, total premium value, next renewal date, risk-of-lapse flag (a colored dot, not a full pill, to keep the row scannable at a glance). Filters for policy type, renewal window, and flag status sit above the table. Search-as-you-type on customer name.

**Row interaction:** clicking any row opens that customer's detail view — this table is a routing surface, not a destination in itself.

### 3.3 Customer detail

**Purpose:** everything about one person, in service of the next action on their account.

**Layout:** header with name, contact info, and a "call" / "email" quick action; below that, tabs or stacked sections for **policies** (all of theirs, with status), **claims** (recent activity), and **recommended add-ons** (a cross-sell panel — populated by the collaborative-filtering recommendation module once Phase 2 is live; pre-AI, this panel is simply hidden rather than shown empty, since an empty recommendation panel reads as "the system is broken," not "there's nothing to recommend yet").

**Primary actions from here:** "start new application" (pre-fills this customer's known details into the application form) and "log outreach" (a lightweight note-plus-timestamp, used to clear a retention alert once the agent has actually made contact).

### 3.4 New application (on behalf of)

**Purpose:** identical application form to the end-customer's, with one structural difference — the agent is recorded as the submitter of record, and the form opens pre-populated with the customer's existing details if they're already in the system, rather than starting from a blank KYC step.

**Layout:** same section structure as the customer-facing form (Section 3.3 in the end-customer document) for consistency — an agent who also uses the customer-facing view for demos shouldn't have to relearn a second form layout.

### 3.5 Retention alerts

**Purpose:** the agent's proactive worklist.

**Layout:** a list (not a table — these are fewer in number and benefit from more context per row) of at-risk customers, each showing the specific churn driver where known (Phase 2: "premium increased 18% at last renewal," "no login in 90 days"; pre-AI: a manually-set flag with a note from the admin). Each item has a single clear action — "log outreach," which moves it out of the active list into a resolved history, not a delete, since the record of contact matters for later renewal conversations.

**Empty state:** "No customers need outreach right now" — genuinely good news, and the copy should read that way rather than as a placeholder.

### 3.6 Commission tracker

**Purpose:** a periodic check-in, not a daily habit — reflects that.

**Layout:** a simple table of policies with commission earned/pending per row, a running total at the top, and a date-range filter. Exportable (CSV) since agents often need this for their own personal tracking outside the platform.

---

## 4. Full journey, step by step

**Daily loop:** dashboard → scan retention alerts and upcoming renewals → open the most urgent customer's detail → either log outreach (clears the alert, returns to dashboard) or start a new application on their behalf (application form → submit → back to that customer's detail, now showing the new pending application).

**Prospecting loop:** customer portfolio → search or filter for a specific segment (e.g., "renewals in the next 7 days") → work down the filtered list, opening each customer's detail in turn.

**Periodic loop:** commission tracker, checked weekly or monthly rather than daily — reached from the sidebar directly, not part of the customer-facing flow above.

---

## 5. Notifications and alerts specific to this role

A renewal entering its 30-day window, a churn flag newly raised (Phase 2), and a customer-submitted application awaiting the agent's own follow-up all surface as sidebar badge counts on **Retention alerts** and **My customers** — this role should never need to open the dashboard just to know something changed; the badge counts are the ambient-awareness layer, the dashboard is the deep-dive.

## 6. Mobile considerations

Agents are frequently in the field (visiting customers, on calls) — the mobile view prioritizes the customer detail page and "log outreach" as one-tap actions, with the full portfolio table collapsing into a searchable list rather than trying to preserve every column on a small screen.
