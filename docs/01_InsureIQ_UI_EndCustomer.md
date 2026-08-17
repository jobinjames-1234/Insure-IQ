# InsureIQ UI Design — End-Customer (Tenant Policyholder)

**Side:** B2B tenant portal · **Logs in at:** `{tenant}.insureiq.app` · **Example:** `app.abcinsurance.com`

---

## 1. Who this is and what the screen owes them

This person bought insurance from one specific company. They never see the word "InsureIQ" — the portal is fully white-labeled to that insurer's logo, name, and accent color, resolved from the tenant's branding record at load time. Their mental model is "this is ABC Insurance's website," and every design decision has to protect that illusion: no InsureIQ chrome, no cross-insurer language, no comparison features (that belongs to the marketplace persona, a different role entirely even though it's the same kind of human).

This is a low-frequency user. Most people open this a handful of times a year — buying a policy, renewing, or filing the occasional claim. The design has to be legible to someone who forgot the interface exists since their last visit, not optimized for daily muscle memory the way the underwriter or adjuster views are.

**Visual register:** consumer-simple, not SaaS-dense. Large touch targets, generous white space, one primary action per screen, plain-language copy over insurance jargon wherever the underlying field allows it ("Amount claimed," not "Claim principal"). Tenant's accent color drives every primary button and active state; everything else is neutral gray/white so the tenant's own brand reads through cleanly.

---

## 2. Navigation shell

A simple top nav (desktop) / bottom tab bar (mobile) with four destinations: **Home**, **Apply**, **Claims**, **Profile**. No sidebar, no nested menus — this role has four things to do, ever, and the IA should say so at a glance.

```
┌─────────────────────────────────────────┐
│ [Tenant logo]      Home  Apply  Claims  Profile │
└─────────────────────────────────────────┘
```

A single notification bell in the top-right surfaces renewal reminders, claim status changes, and document requests — this is the one place urgency lives outside of the page content itself.

---

## 3. Pages, in full

### 3.1 Sign up / KYC

**Purpose:** get a verified identity on file before any policy or claim exists.

**Layout:** a 3-step progress indicator (Details → Documents → Verification) stays pinned at the top through the whole flow so the person always knows how much is left.
- **Step 1 — Details:** name, DOB, address, phone, email. Standard form validation inline (not on submit) — a red-underline-and-message the moment a field is invalid, not a wall of errors at the end.
- **Step 2 — Documents:** ID upload (drag-and-drop or camera capture on mobile), with a live thumbnail preview and a re-upload option if the shot is blurry (a client-side blur/glare check gives instant feedback rather than waiting on the backend to reject it).
- **Step 3 — Verification pending:** a calm holding screen — "We're verifying your details. This usually takes less than a day." — with an estimated time and no action required. This is the interface's voice explaining a wait, not apologizing for one.

**States:** verification can resolve to *verified* (auto-advances to Home) or *needs another document* (returns to step 2 with a specific, named reason — "The photo on your ID doesn't match the selfie. Try again in better lighting," never a generic "verification failed").

### 3.2 Home / My policies

**Purpose:** the return point for everything. First thing seen on every visit after onboarding.

**Layout:** a card grid, one card per active policy — policy type icon, nickname (e.g. "Honda City — Motor"), premium, renewal date, and a status pill if anything needs attention (amber "Renews in 12 days," red "Document required"). Above the grid, a single banner surfaces the single most urgent thing across all policies (never stack more than one banner — if two things need attention, the banner names the most urgent and the rest wait their turn in the relevant policy card).

**Empty state (new customer, no policies yet):** not a blank page — a single large "Get a quote" card naming the categories available from this insurer, functioning as an invitation rather than a dead end.

**Primary action:** a persistent "Apply for new policy" button, always visible regardless of how many policies already exist.

### 3.3 Browse & apply

**Purpose:** start a new application.

**Layout:** a simple category gallery (Auto, Health, Life, Property — only the types this tenant actually offers, per their Phase 1 Part A configuration) → tapping one opens the application form for that type.

**Application form:** broken into logical sections (applicant details, asset/subject details, coverage preferences) with a persistent summary sidebar (desktop) or collapsible summary (mobile) showing the running premium estimate as fields are filled in — this only becomes live once Phase 2's risk-scoring is active; pre-AI, it shows the tenant's static band instead, clearly labeled "estimated, final premium set by underwriter."

**Document upload step:** same upload component as KYC, reused for consistency — supporting documents relevant to the policy type (vehicle registration for auto, medical history forms for health).

**Submit confirmation:** a specific, calm confirmation screen — application ID, what happens next, and expected review time — not a generic "success!" toast.

### 3.4 Application status

**Purpose:** track one specific pending application.

**Layout:** a horizontal stepper — Submitted → Under review → Approved / Rejected — with a timestamp on each completed stage. If referred for manual review, an explanatory line appears ("An underwriter is reviewing a few extra details") rather than leaving the person guessing why it's taking longer than the estimate.

**On rejection:** the interface states the reason in plain terms where the tenant's underwriting rules allow disclosure, and — where relevant — offers a next step (adjust coverage, contact support) rather than a dead end.

### 3.5 File a claim

**Purpose:** report an incident.

**Layout:** a guided, single-question-at-a-time flow on mobile (where most claims are actually filed, often right after an incident) — incident date, description, photos/documents, amount claimed. Each step saves progress automatically; a person filing a claim after a car accident should never lose their place because they got a phone call mid-form.

**Submission confirmation:** claim ID, and an immediate hand-off into the claim tracker (Section 3.6) so there's no gap between "I submitted this" and "here's where it stands."

### 3.6 Claim tracker

**Purpose:** the single most emotionally loaded screen in this role's experience — someone filing a claim is usually having a bad day, and the design should be calm, specific, and honest rather than falsely reassuring.

**Layout:** a vertical stepper — Submitted → Under review → Fraud check complete → Approved → Payment sent — each stage timestamped once reached. Adjuster notes appear only where the tenant's policy allows customer-facing notes (internal investigation notes never surface here). No stage is skipped silently: if a claim is flagged for extended review, the stepper says so in plain language rather than just stalling with no explanation.

**States:** approved (shows settlement amount, payment date), rejected (shows the specific reason and, where applicable, an appeal path), partially approved (shows the breakdown).

### 3.7 Policy detail

**Purpose:** the single source of truth for one policy.

**Layout:** coverage terms in plain language (not a wall of legal text — a short summary up top with the full document available as a download), premium history as a simple line/bar chart, all associated documents, and renewal date with a "renew now" action that activates as the date approaches.

### 3.8 Profile & documents

**Purpose:** account-level settings.

**Layout:** contact details, KYC documents on file (re-viewable, replaceable if expired), and notification preferences (email/SMS/push toggles per notification type — renewal reminders, claim updates, document requests).

---

## 4. Full journey, step by step

**First-time journey:** land on sign up → complete KYC → verification pending → (async) verified → home (empty state, single "get a quote" invitation) → browse & apply → application form → submit → application status (tracked until resolved) → back to home, now showing the new policy as a card.

**Returning journey (the common case):** land directly on home → either open an existing policy (policy detail → maybe file a claim → claim tracker) or start a new application (browse & apply, same flow as above). Home is the hub every path returns to; nothing in this role's IA is more than two taps from it.

**Interrupted journey:** if a person abandons an application mid-form, it's saved as a draft and surfaces on home as a soft-highlighted card ("Continue your health insurance application") rather than vanishing — a common real-world pattern (insurance forms are long, phones ring) that the design should expect, not treat as an edge case.

---

## 5. Mobile considerations

This role skews heavily toward mobile, especially for claims (filed in the moment) and status checks (a quick glance while doing something else). Bottom tab bar over top nav on mobile, single-column everything, camera-first document capture, and the claim-filing flow in particular should work fully one-handed and tolerate being backgrounded mid-flow without losing progress.
