# InsureIQ UI Design — Claims Adjuster

**Side:** B2B tenant portal · **Logs in at:** `{tenant}.insureiq.app`

---

## 1. Who this is and what the screen owes them

An adjuster's work has two distinct speeds baked into one job: the fast lane (routine, low-fraud-confidence claims that need a quick, correct settlement) and the slow lane (flagged, high-fraud-confidence, or otherwise unusual claims that need real investigation). A design that treats every claim identically will either make the fast lane slower than it needs to be, or make the slow lane feel rushed — both are real failure modes in claims software, and this role's IA is built specifically to keep the two lanes separate rather than forcing them through one undifferentiated queue.

The other defining fact about this role: every claim starts life as unstructured input — photos, PDFs, handwritten forms — and the adjuster's real job is judgment on top of extracted data, not data entry. The design should put the source documents and the system's extracted interpretation of them side by side, so the adjuster is verifying, not re-typing.

**Visual register:** same dense, quiet SaaS register as the underwriter's screens (same tenant portal shell, same confidence-pill pattern), but with more emphasis on document viewing — this role spends more time looking at images and PDFs than any other, so the layout budget leans toward a large document pane rather than a data-heavy sidebar.

---

## 2. Navigation shell

Left sidebar: **Dashboard** (claims queue), **Investigations**, **SLA tracker**. Same tenant portal chrome as the underwriter and agent — consistent structure, different item list, per the shared-shell principle across all B2B roles.

---

## 3. Pages, in full

### 3.1 Claims dashboard

**Purpose:** the fast lane's home base.

**Layout:** metric cards across the top (open claims, aging/SLA-at-risk count, fraud-flagged count, settled today), followed by the claims queue table — columns: claim ID, policy, claimant, amount claimed, fraud confidence (a confidence pill, same visual language as the underwriter's risk-score pill, deliberately — an adjuster who occasionally reviews a colleague's underwriting notes shouldn't have to learn a second color system), and age (days since submission, since SLA compliance is measured against this).

**Default sort:** by fraud confidence descending, same reasoning as the underwriter's queue — the highest-risk items should never sit unreviewed simply because they arrived after a batch of routine ones. A secondary "sort by age" toggle exists for end-of-day SLA triage specifically (see Section 3.4).

**Row interaction:** low-fraud-confidence rows open directly into claim detail for a fast decision; high-fraud-confidence rows (above the tenant's configured threshold) open into claim detail with a visible "recommended: escalate to investigation" banner rather than silently routing away — the adjuster stays in control of that call, the system just makes its recommendation impossible to miss.

### 3.2 Claim detail

**Purpose:** verify the extracted data, decide, or escalate.

**Layout:** a two-pane layout. Left pane: the original submitted documents (photos, PDFs) in a viewer with zoom/rotate. Right pane: the system's extracted structured data (Phase 2 OCR/NLP output) — dates, amounts, diagnosis/damage codes — laid out as editable fields directly beneath each source document, so a misread field can be corrected in place, and that correction feeds the retraining feedback loop rather than just being silently overridden.

**Fraud-flag explanation (Phase 2):** where the claim carries a fraud flag, a small explanation panel shows the driving factors in plain terms ("Claim filed 3 days after policy start," "Similar claim amount to 2 prior claims from this policyholder") — the SHAP-based explainability output translated into adjuster-readable language, not raw feature weights.

**Action bar:** **Approve**, **Reject**, **Escalate to investigation**, each requiring a settlement-justification note — this note is what the audit log and, eventually, the model's feedback loop both draw on.

**Pre-AI state:** identical layout, minus the extracted-data panel and fraud-flag explanation — the adjuster manually enters the structured fields from the source documents instead. Same two-pane structure either way, so the screen doesn't change shape once Phase 2 activates.

### 3.3 Investigation view

**Purpose:** the slow lane — reached only from an escalated claim, never from the main queue directly, to keep it from competing for attention with routine work.

**Layout:** the full claim history for this policyholder (not just this claim — prior claims, prior flags, prior outcomes), a running adjuster-notes thread (timestamped, multi-entry, since investigations often span days and multiple people), and any related claims the fraud model has surfaced as similar (Phase 2 Part B's shared fraud intelligence, once live, surfaces cross-tenant *signals* here — a hashed pattern match, never another insurer's raw claim data). The action bar here is the same three options as claim detail, but this screen is designed to be revisited over several sessions rather than resolved in one sitting.

### 3.4 SLA tracker

**Purpose:** a purely time-based triage view, separate from the fraud-sorted main queue, used specifically for end-of-day or end-of-week catch-up.

**Layout:** the same claims list, re-sorted by age against the tenant's configured settlement-time target, with a simple visual marker (a colored left-border accent, not a full pill, to avoid visual noise duplicate of the fraud-confidence pill) for anything past 80% of the target SLA.

---

## 4. Full journey, step by step

**Fast-lane loop, most of the day:** dashboard → open a low-fraud-confidence claim → verify extracted data → approve/reject with a note → back to dashboard, next claim.

**Slow-lane loop, a smaller fraction of the day but the higher-stakes fraction:** dashboard → open a high-fraud-confidence claim → see the escalate recommendation → escalate → investigation view → review history and related signals → add notes over one or more sessions → eventually resolve (approve/reject) from within investigation view itself.

**Catch-up loop, periodic:** SLA tracker, checked specifically when aging claims need triage — a distinct entry point from the sidebar, not part of the fraud-sorted daily rhythm.

---

## 5. Notifications specific to this role

A claim crossing into "SLA at risk" and a claim's fraud confidence rising after a re-score (Phase 2, if new information arrives mid-review) both surface as sidebar badge counts on **Dashboard** and **SLA tracker** respectively — ambient awareness without forcing a full dashboard visit to notice something changed.

## 6. Mobile considerations

Like the underwriter, this role is desktop-primary — document review at zoom needs real screen space. A mobile view is limited to status-checking and approving genuinely routine, already-reviewed claims; document-heavy review and anything touching investigation view is designed to wait for a desktop session.
