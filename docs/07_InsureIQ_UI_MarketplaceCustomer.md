# InsureIQ UI Design — Marketplace Customer

**Side:** B2C marketplace · **Logs in at:** `insureiq.com`

---

## 1. Who this is and what the screen owes them

This is InsureIQ's own consumer brand, in the same category as Policybazaar, Compare the Market, Lemonade, or Insurify — a person who wants to compare insurance across providers without having to visit each insurer's site individually, and who has no existing loyalty to InsureIQ itself that the design can lean on. Every screen has to earn trust from a cold start: this person is about to compare prices and hand over KYC documents to a platform they may be visiting for the first time, so the design's job is reassurance and clarity at least as much as functionality.

The other defining fact about this role: it has two completely different modes depending on tenure. A first-time visitor has nothing to return to and needs to be guided linearly toward a decision. A returning customer with one or more policies already has a genuine home base — "my insurance" — and the comparison/shopping flow becomes something they detour into occasionally, not the default screen. The IA below is built around that split explicitly, rather than treating every visit as a first visit.

**Visual register:** the warmest, most consumer-facing register in the whole product — bigger type, more white space, illustration-friendly empty states, and the trust-strip signature element (settlement ratio, rating, sponsored labeling) repeated identically everywhere a plan or insurer appears, so it becomes a piece of visual vocabulary the customer learns once and trusts everywhere after.

---

## 2. Navigation shell

Top nav (desktop) / bottom tabs (mobile): **Home**, **Compare** (category entry), **My insurance**, **Documents**, **Account**. For a first-time visitor with no policies yet, "My insurance" is present but shows an inviting empty state rather than being hidden — hiding it would suggest the feature doesn't exist yet, which undersells the platform's actual value proposition (one dashboard across every insurer they'll ever buy from).

---

## 3. Pages, in full

### 3.1 Home / landing

**Purpose:** a single clear entry point — "what are you insuring" — not a dashboard, since a first-time visitor has nothing yet to show a dashboard of.

**Layout:** a small set of large category tiles (Auto, Health, Life, Travel, Home), each with a one-line description in plain language, no jargon. Below the fold, lightweight trust-building content — aggregate stats like "insurers compared," "average savings," or short explainer copy on how the ranking works — the kind of above-the-fold-plus-trust-signals layout real aggregator homepages use to convert a cold visitor.

**For a returning customer who already holds a policy:** home redirects straight to "my insurance" instead (see 3.6) — this page is effectively retired the moment there's something better to show, which is the whole point of the role-reversal described in Section 1.

### 3.2 Quote request form

**Purpose:** capture just enough structured detail to fan out a real quote request.

**Layout:** a short, single-category form (e.g., for Auto: vehicle make/model/year, usage, location) — kept intentionally brief, since a long form here is the single biggest drop-off risk in any real comparison-shopping product. A progress indicator if the form spans more than one screen, and an explicit note about what happens next ("We'll show quotes from every insurer that covers this in about 10 seconds") to set expectation before the wait.

**Alternative entry:** a persistent "not sure what you need? Ask our advisor" link (Phase 2's AI Insurance Advisor, Section 3.9) for a customer who doesn't yet know which category or coverage level applies to them.

### 3.3 Comparison results

*(This is the screen shown in the earlier mockup — described here at full detail.)*

**Purpose:** the core decision-making screen of the entire marketplace.

**Layout:** a card grid, one card per insurer's quote — insurer name, premium, one-line coverage summary, and the trust strip (settlement ratio badge, star rating) identically positioned on every card. The system's top recommendation carries a "Best match" badge and a 2px accent border (the one deliberate exception to the product's otherwise-restrained border weight, reserved for exactly this kind of single featured item). Any insurer that paid for placement carries a small, plainly worded "Sponsored" label in a neutral gray badge — never styled to blend in, and never positioned to look like the "Best match" badge, since conflating the two would be exactly the "misleading ranking" failure mode the underlying business requirements explicitly call out.

**Sort and filter:** a "sort" control defaulting to "best match" (the documented, auditable ranking blend), with alternatives for "lowest price" and "highest rated" — giving the customer the ability to override the default ranking rather than only ever seeing InsureIQ's own blend.

**"How we rank" link:** a small, always-present link opening a plain-language explanation of the ranking algorithm and how sponsored placement is disclosed — the actual regulatory-style transparency requirement made visible and easy to find, not buried in a footer terms page.

### 3.4 Plan detail

**Purpose:** the full picture before applying — coverage terms in plain language, not a legal wall of text.

**Layout:** a summary section up top (what's covered, what's not, key exclusions, in plain sentences) with the full policy wording available as a "read the full terms" expandable or download, add-ons as optional toggles that update the shown premium live, and a single clear "Apply" call to action.

### 3.5 Application (routed)

**Purpose:** one form, handed off behind the scenes to the selected insurer's own tenant workflow.

**Layout:** reuses the KYC and application-form components already built for the tenant-side end-customer role (Section 3.1 and 3.3 of that document) — same document upload component, same section structure — so a customer who's already completed KYC once in the Document Vault (3.8 below) skips straight past that step here, the direct payoff of "upload documents once."

**Hand-off confirmation:** a clear statement that the application has been submitted to the specific insurer chosen ("Your application has been sent to DEF Insurance"), setting the expectation that from here the insurer's own underwriting process takes over — this is the moment the design has to be honest that InsureIQ itself doesn't underwrite, without making that feel like a loss of ownership over the outcome.

### 3.6 My insurance (unified dashboard)

**Purpose:** the true home screen for any returning customer — every policy, across every insurer, in one place.

**Layout:** a card grid identical in structure to the tenant-side end-customer's "Home" (Section 3.2 of that document) — policy type, insurer name, premium, renewal date, status pill — but explicitly labeled with which insurer each card belongs to, since that's the one piece of context this cross-tenant view has to add that the single-insurer version doesn't need. A persistent "compare & apply for new coverage" action sits alongside the grid, the entry point back into the shopping flow for a customer who already has policies but wants to add or switch coverage.

**Empty state (genuinely new customer, mid-first-visit before any policy exists):** does not appear as a dead-end "nothing here" message — instead redirects into Home (3.1), since this nav item exists for the future, not for right now.

### 3.7 Unified claim tracker

**Purpose:** the same claim-status stepper pattern as the tenant-side view (Submitted → Under review → Fraud check complete → Approved → Payment sent), aggregated here regardless of which insurer the claim belongs to.

**Layout:** identical stepper component to the tenant-side claim tracker, with the relevant insurer's name shown at the top of the tracker — consistency here matters because a customer who's used the tenant-branded claim tracker once (say, filing directly with one insurer for an older policy) shouldn't have to relearn a different pattern here.

### 3.8 Document vault

**Purpose:** the actual mechanism behind "upload documents once."

**Layout:** a simple list of documents on file (ID, address proof, any medical or vehicle documents uploaded for a specific past application), each showing which applications it's been used for, with re-upload/replace available for expired documents. This screen's value is almost entirely invisible in normal use — it does its job by making Section 3.5's application flow shorter, not by being a destination itself.

### 3.9 AI advisor (Phase 2 Part B)

**Purpose:** a conversational alternative to the structured quote form, for someone who doesn't yet know what coverage they need.

**Layout:** a simple chat interface — structured follow-up questions (vehicle type, family size, budget, existing conditions) asked conversationally rather than as a form, ending in a hand-off directly into comparison results (3.3) once enough information is gathered, so the advisor is an alternate front door to the same results screen, not a separate destination.

### 3.10 Universal risk score & consent center (Phase 2 Part B)

**Purpose:** the customer's portable score, and full visibility into exactly what's been shared, with whom.

**Layout:** the score itself shown plainly (a single number, with a short explanation of what it means and how it's used — deliberately not styled like a credit-score-anxiety-inducing gauge, since the goal is faster underwriting for the customer's benefit, not another number to worry about). Below that, a list of consent grants — which data elements, shared with which insurer, since when — each with a clear **Revoke** action. This is a permissions screen first and a feature-showcase second: every grant needs to be as easy to take back as it was to give.

---

## 4. Full journey, step by step

**First-time visitor:** home → quote request form (or AI advisor, 3.9) → comparison results → plan detail → application (routed) → hand-off confirmation → my insurance, now showing the new policy. From here, home effectively stops being visited again.

**Returning customer, routine check:** lands directly on my insurance → opens a specific policy's claim tracker if something's active, otherwise just confirms everything looks fine → done.

**Returning customer, adding coverage:** my insurance → "compare & apply for new coverage" → same shopping flow as the first-time visitor, starting from quote request rather than home.

**Consent journey (Phase 2 Part B):** typically triggered externally — an insurer requests access to the universal score during a new application — surfaces as a specific consent prompt at that moment (not something the customer has to proactively seek out), which then resolves into an entry on the consent center's list for later review or revocation.

---

## 5. Mobile considerations

This role is mobile-heavy, matching how real insurance-aggregator traffic actually skews — comparison shopping, quick renewal reminders, and claim-status checks are all frequently mobile moments. Bottom tab navigation, single-column comparison cards (stacked, not a horizontal scroll, since side-by-side comparison of 3+ cards doesn't survive a narrow viewport gracefully), and the application flow's document upload should default to camera capture, matching the tenant-side end-customer's own mobile-first claim-filing pattern for consistency across the two "customer" roles.
