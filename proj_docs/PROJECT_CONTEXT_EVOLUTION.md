# Project Context & Evolution

## 1. Executive Understanding

InsureIQ is an **AI-powered, hybrid B2B–B2C, multi-tenant SaaS insurance intelligence platform** being developed as an MCA mini-project (course code 24MCAR295) at Amal Jyothi College of Engineering (Autonomous), Department of Computer Applications, by **Jobin James (AJC25MCA-2039)**, under the guidance of **Lisha Varghese**, Assistant Professor and Scrum Master.

The project began as a **single-insurer, B2B-only, AI-centered platform** for automating underwriting, fraud detection, document processing, and churn prediction. It subsequently evolved — through an explicit business-model update — into a **multi-tenant SaaS product with a B2C marketplace layer** modelled on established insurance aggregators (Policybazaar, Compare the Market, Insurify, The Zebra, GoCompare).

The project is organized into a **two-phase, two-part roadmap**:

- **Phase 1 — Foundation Platform (Non-AI)**
  - Part A: B2B multi-tenant core (policy management, claims, underwriting, billing)
  - Part B: B2C marketplace (cross-insurer comparison, application routing, unified dashboard)
- **Phase 2 — AI Intelligence Layer**
  - Part A: B2B AI (risk scoring, fraud detection, OCR/NLP, churn prediction)
  - Part B: B2C AI (conversational advisor, cross-tenant recommendations, Universal Risk Score, shared fraud intelligence)

The academic delivery recommendation — consistently stated across the Expanded Requirements, Two-Phase Requirements, and Feasibility Study — is to **fully implement Part A of both phases** as the graded core, and to deliver **Part B as a well-researched, partially-prototyped extension**.

**Domain**: Insurance (InsurTech), a sub-domain of financial services — specifically underwriting, claims processing, fraud detection, customer retention, and insurance distribution/aggregation.

---

## 2. Project Identity

| Attribute | Value |
|---|---|
| **Project Name** | InsureIQ |
| **Full Title** | AI-Powered Hybrid B2B–B2C Insurance Intelligence Platform |
| **Course Code** | 24MCAR295 — MCA Mini Project |
| **Institution** | Amal Jyothi College of Engineering (Autonomous), Dept. of Computer Applications |
| **Developer** | Jobin James (AJC25MCA-2039) |
| **Guide** | Lisha Varghese, Assistant Professor / Scrum Master |
| **Domain** | Insurance (InsurTech) / Financial Services |
| **Target Users** | Insurers (tenants) + individual policyholders (B2C customers) |
| **System Ownership** | Academic — no commercial entity; prototype + source code owned by the student |
| **Purpose** | Replace manual underwriting, static actuarial pricing, and rule-based claims verification with an AI-driven, multi-tenant SaaS platform; additionally provide a neutral cross-insurer marketplace for individual customers |
| **Non-Goals (explicit)** | Production IRDAI licensing; full regulatory compliance; live commercial deployment; real paying tenants/customers |

### Goals (reconstructed from documents)

1. Reduce underwriting turnaround time via automated risk scoring with explainable AI
2. Flag fraudulent claims before payout with justifiable, SHAP-based reasoning
3. Automate document processing (OCR/NLP) for claim forms, medical reports, accident records
4. Give insurers early visibility into customers likely to churn
5. Provide a neutral marketplace where individual customers compare, buy, and track insurance across providers
6. Demonstrate a commercially coherent, multi-tenant SaaS business model
7. Serve as a defensible academic demonstration of applied AI and SaaS platform design in a regulated domain

### Non-Goals (inferred)

- Acquiring actual market share or real customers
- Full federated learning infrastructure (explicitly stated as simulation-only)
- Live payment processing (academic prototype)
- Annual IRDAI security audits or capital requirements
- Multi-language support (explicitly excluded from initial scope in reference materials)

---

## 3. Current Understanding State

### Clearly Understood

- **Project identity**: Name, purpose, domain, academic context, developer, guide — consistently established across all documents.
- **Core problem statement**: Manual underwriting, static actuarial tables, rule-based claims verification → slow policy issuance, inconsistent pricing, fraud exposure.
- **B2B user roles**: Customer, Agent, Underwriter, Claims Adjuster, Administrator (tenant-level), InsureIQ Super-Admin — consistently defined with identical responsibilities across Synopsis, Requirement Gathering, Expanded Requirements, and Two-Phase Requirements.
- **B2C marketplace concept**: Modelled on Policybazaar/Compare the Market; neutral comparison front door routing leads to tenant backends.
- **Technology stack**: React.js + Tailwind CSS (frontend), FastAPI/Python (backend), PostgreSQL + pgvector (database), XGBoost/LightGBM + scikit-learn (ML), SHAP (explainability), Tesseract OCR + Hugging Face Transformers (NLP), Docker + GitHub Actions (CI/CD), Redis (caching), JWT auth.
- **Four AI modules**: Risk scoring & premium prediction, claims fraud detection, OCR/NLP document processing, churn prediction & retention.
- **Multi-tenant architecture**: Schema-per-tenant or database-per-tenant isolation in PostgreSQL; tenant branding, subdomain, per-tenant configuration.
- **Revenue model**: B2B (subscription, per-policy fee, per-claim fee, AI premium tiers) + B2C (commission on sale, lead-generation fees, featured placement, value-added services).
- **Delivery recommendation**: Part A (B2B) fully built; Part B (B2C) researched + partially prototyped.
- **Feasibility assessment**: Part A technically, economically, operationally feasible; Part B partially feasible (simulation only for federated learning, IRDAI licensing impossible for academic project).
- **UML design**: Use case, sequence, state chart, activity, class, object, component, and deployment diagrams all produced.

### Probably Understood

- **The phasing model** is settled on the two-phase (Foundation + AI), two-part (B2B + B2C) structure from the Two-Phase Requirements document, which supersedes the four-phase structure in the Expanded Requirements. Evidence: the Two-Phase document was created later (Jul 29 vs Jul 26) and explicitly restructures the four phases into two phases with two parts each.
- **Class diagram entities**: Tenant, User, Application, RiskScore, Policy, Claim, FraudFlag, Document, ChurnScore, Billing, MarketplaceLead — defined in UML Diagrams document. These represent the expected database schema structure.
- **The deployment model**: Dockerized multi-tenant app server → ML inference server → PostgreSQL (pgvector) + object storage.

### Partially Understood

- **Database schema**: Core entities are named and relationships defined at the class-diagram level, but field-level schema (columns, types, constraints, indexes) is documented separately in `schemadocs/` (outside `docs1/` scope) and not fully reconciled with the domain model in the requirements documents.
- **UI/UX designs**: The `ui-ux-designs.odt/pdf` contains visual mockups (images) but minimal extractable text — the actual screen specifications are in `docs/` (outside `docs1/` scope) as separate per-role UI design markdown files.
- **API specification**: No API endpoints are explicitly documented in `docs1/`; the architecture describes "REST APIs" and "JWT-based authentication" but does not enumerate routes.
- **Billing implementation details**: The revenue model is described at a business level, but the billing module's technical implementation (payment gateway integration, invoicing logic, usage metering implementation) is not specified beyond feature descriptions.

### Conflicting

- **Phase structure**: The Expanded Requirements uses a **four-phase** model (Phase 1: B2B Foundation, Phase 2: B2C Marketplace, Phase 3: B2B AI, Phase 4: B2C AI). The Two-Phase Requirements restructures this into a **two-phase, two-part** model (Phase 1: Foundation [Part A: B2B, Part B: B2C], Phase 2: AI [Part A: B2B, Part B: B2C]). Both documents contain substantively identical content but organized differently. See §16 Contradictions & Conflicts for detailed analysis.
- **Payment gateway**: The reference example documents (Serenity Styles) mention PayPal, Stripe, and Razor Pay. The InsureIQ documents do not specify a payment gateway — this is an open question for the billing module.

### Unknown

- **Data model field-level specification within docs1/**: While entities are named, individual field definitions (data types, constraints, validation rules) are not present in `docs1/`.
- **Testing strategy**: No testing plan, test cases, or quality assurance approach is documented in `docs1/`.
- **Error handling and edge cases**: Not addressed in any `docs1/` document.
- **Deployment environment**: "AWS S3/EC2 or equivalent" is mentioned once; no specific cloud provider commitment or deployment procedure exists.
- **Authentication flow details**: JWT-based auth is stated; OAuth/SAML mentioned in reference material but not confirmed for InsureIQ.
- **Data seeding / demo data strategy**: How the academic prototype will be populated with realistic insurance data is not documented.

### Missing

- **Acceptance criteria** for any requirement
- **API endpoint specification**
- **Wireflow / user-journey maps** (within `docs1/`; may exist in `docs/`)
- **Sprint/iteration plan** or development schedule
- **Risk register** (project management risks, not insurance risk)
- **Data dictionary** (within `docs1/`; exists in `schemadocs/`)
- **Security architecture** beyond "JWT auth" and "per-tenant isolation"
- **Performance requirements** (response times, concurrent users, throughput)
- **Accessibility requirements**
- **Internationalization / localization requirements**

---

## 4. Project Evolution Timeline

### Stage 1 — Initial Discovery & Learning (~late June 2026)

**Evidence**: The `notes b2b-b2c` file (filesystem modified: 2026-06-24, birth: 2026-07-22) is an empty file, suggesting the B2B/B2C distinction was being considered as early as late June. The `Diagrams` file (birth: 2026-07-22) contains personal learning notes about UML diagram types — class, object, component, deployment, use case, sequence, activity, state chart — written in informal study-note style with spelling errors ("assosiation," "puropse"), indicating early-stage learning of software engineering documentation concepts.

**Understanding at this point**: The developer was learning foundational UML concepts and beginning to think about the B2B vs B2C business model distinction, but had not yet formulated project-specific requirements.

---

### Stage 2 — Requirements Template & Feasibility Framework (~Jul 22–26, 2026)

**Evidence**:
- `InsureIQ_Expanded_Requirements.docx` (birth: 2026-07-22, PDF created: 2026-07-26)
- `feasibility study-format` (birth: 2026-07-26) — a generic textbook description of feasibility studies
- `feasibility-types-requirement` (birth: 2026-07-26) — a structured list of SaaS-specific feasibility types (technical, economic, operational, legal, schedule, market) with sub-studies
- `requirement-gathering` (birth: 2026-07-27) — a blank template for requirement gathering with section headers

**Key developments**:
1. The **Expanded Requirements** document was created — the first comprehensive, project-specific document. It establishes InsureIQ as a **four-phase** B2B–B2C platform with a gap analysis against an "original abstract" (not present in `docs1/`, pre-dates these documents). This document was produced from a Word file (Microsoft® Word 2016) and converted to PDF via ilovepdf.com.
2. The developer collected **feasibility study reference materials** — generic descriptions and SaaS-specific feasibility frameworks — to prepare for writing the project's own feasibility study.
3. A **blank requirement gathering template** was saved, showing preparation for the formal requirement-gathering document.

**Understanding at this point**: The developer had progressed from learning UML to producing a detailed, 15-page expanded requirements document with gap analysis, four-phase roadmap, user roles, AI modules, revenue model, and delivery recommendation. The original abstract (referenced but not in `docs1/`) appears to have been a simpler, single-tenant, B2B-only design.

---

### Stage 3 — Formal Documentation Wave (~Jul 27, 2026)

**Evidence**: Five major documents were created on the same day:
- `InsureIQ_Two_Phase_Requirements.docx` (birth: 2026-07-27 01:32)
- `feasibility study  example` (birth: 2026-07-27 01:37) — Serenity Styles reference example
- `InsureIQ_Feasibility_Study.docx` (birth: 2026-07-27 01:49)
- `InsureIQ_Requirement_Gathering.docx` (birth: 2026-07-27 01:51)
- `Project Synopsis Example` (birth: 2026-07-27 02:02) — Serenity Styles reference example
- `InsureIQ_Project_Synopsis.docx` (birth: 2026-07-27 04:56)
- `InsureIQ_UML_Diagrams.docx` (birth: 2026-07-27 05:19)
- PDF versions of Synopsis, Requirement Gathering, and Feasibility Study (birth: 2026-07-27 05:23)

**Key developments**:
1. The **four-phase model was restructured into a two-phase, two-part model**. The Two-Phase Requirements document explicitly reorganizes the same content: Phase 1 becomes Phase 1 Part A + Part B; Phase 2 becomes Phase 1 Part B (was Phase 2); Phase 3 becomes Phase 2 Part A; Phase 4 becomes Phase 2 Part B. This is a structural redesign, not a content change.
2. **Reference examples** were collected — the "Serenity Styles" beauty salon booking system's synopsis and feasibility study — as models for the format and depth expected in the InsureIQ versions.
3. The **Feasibility Study** was written, applying all six feasibility types (technical, economic, operational, legal & compliance, schedule, market) to InsureIQ. This introduced the critical insight that IRDAI regulatory compliance is impossible for an academic project, and explicitly recommended framing the B2C marketplace as a simulation.
4. The **Requirement Gathering** document was produced with domain-specific questionnaire responses from an insurance industry contact, validating the modules through practical Q&A about real insurance workflows.
5. The **Project Synopsis** was written following the academic format (project overview, specification, introduction, existing system, proposed system, advantages, feasibility, system specification, software description).
6. **UML Diagrams** document was created with 8 diagram types (use case, sequence, state chart, activity, class, object, component, deployment), all specific to InsureIQ.

**Understanding at this point**: The developer had a complete, consistent set of formal academic documentation — requirements, feasibility, synopsis, UML — and had restructured the phasing model for clarity. The B2B core was firmly established as the primary deliverable; the B2C marketplace was consistently scoped as a researched extension.

---

### Stage 4 — Two-Phase Requirements PDF (~Jul 29, 2026)

**Evidence**: `InsureIQ_Two_Phase_Requirements.pdf` (birth: 2026-07-29, created by LibreOffice 7.3 Writer)

**Key development**: The Two-Phase Requirements PDF was generated from LibreOffice rather than Word (unlike the DOCX which was Word-created), suggesting the document was edited or reformatted in LibreOffice after the initial Word creation. This is the latest version of the requirements restructuring.

---

### Stage 5 — Literature Review & Design Refinement (~Aug 13, 2026)

**Evidence**:
- `InsureIQ_Litrature_Review.odt/pdf` (birth: 2026-08-13 03:53)
- `InsureIQ_UML_Diagrams.pdf` (birth: 2026-08-13 03:39)
- `ui-ux-designs.odt/pdf` (birth: 2026-08-13 05:48)

**Key developments**:
1. An **11-page academic literature review** was produced, covering 9 major topic areas with 15+ recent (2025–2026) academic references. This is a substantive research document covering: AI revolution in insurance, risk scoring & premium prediction, emerging approaches (generative AI, adaptive questionnaires), fraud detection & XAI, NLP in insurance, churn prediction & retention, multi-tenant SaaS architecture, RAG & conversational AI, privacy-preserving & cross-tenant AI. It identifies four research gaps: integration gap, explainability–performance trade-off, cross-tenant intelligence, regulatory alignment.
2. The **UML Diagrams PDF was regenerated** (Aug 13, from LibreOffice), likely reflecting updates to the diagrams.
3. **UI/UX design mockups** were produced — the document contains mostly visual screenshots/mockups with only a title header as extractable text.

**Understanding at this point**: The developer had reached a mature understanding with formal academic grounding — the literature review demonstrates command of the field, establishes theoretical justification for InsureIQ's approach, and identifies the "integration gap" as the core research contribution. The UI/UX work indicates movement toward implementation.

---

### Current State (as of analysis date)

The project has a comprehensive set of formal documentation covering requirements, feasibility, literature review, UML design, and UI/UX mockups. Additional implementation-level documentation exists outside `docs1/` (in `docs/` for per-role UI specs, in `schemadocs/` for database schema). The developer appears to be transitioning from documentation/design to implementation.

---

## 5. Document Inventory

### Primary Project Documents (InsureIQ-specific)

| # | Filename | Extension | Size | FS Birth | FS Modified | Internal Created | Internal Modified | Creator | Pages | Type |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | InsureIQ_Expanded_Requirements.docx | .docx | 24,749 B | 2026-07-22 11:51 | 2026-07-22 11:52 | — | — | MS Word 2016 | — | Requirements / Roadmap |
| 2 | InsureIQ_Expanded_Requirements.pdf | .pdf | 660,918 B | 2026-07-26 17:22 | 2026-07-26 17:22 | 2026-07-26 | 2026-07-26 | MS Word 2016 / ilovepdf | 15 | Requirements / Roadmap |
| 3 | InsureIQ_Two_Phase_Requirements.docx | .docx | 22,776 B | 2026-07-27 01:32 | 2026-07-27 01:32 | — | — | — | — | Requirements / Roadmap (revised) |
| 4 | InsureIQ_Two_Phase_Requirements.pdf | .pdf | 102,698 B | 2026-07-29 05:37 | 2026-07-29 05:37 | 2026-07-29 | — | Writer / LibreOffice 7.3 | 11 | Requirements / Roadmap (revised) |
| 5 | InsureIQ_Feasibility_Study.docx | .docx | 15,930 B | 2026-07-27 01:49 | 2026-07-27 01:49 | — | — | — | — | Feasibility / Analysis |
| 6 | InsureIQ_Feasibility_Study.odt | .odt | 21,054 B | 2026-07-27 01:50 | 2026-07-27 01:50 | — | — | — | — | Feasibility / Analysis |
| 7 | InsureIQ_Feasibility_Study.pdf | .pdf | 167,130 B | 2026-07-27 05:23 | 2026-07-27 05:23 | 2026-07-27 | 2026-07-27 | MS Word 2016 / ilovepdf | 6 | Feasibility / Analysis |
| 8 | InsureIQ_Requirement_Gathering.docx | .docx | 15,115 B | 2026-07-27 01:51 | 2026-07-27 01:51 | — | — | — | — | Requirements / Data Collection |
| 9 | InsureIQ_Requirement_Gathering.odt | .odt | 19,067 B | 2026-07-27 01:53 | 2026-07-27 01:53 | — | — | — | — | Requirements / Data Collection |
| 10 | InsureIQ_Requirement_Gathering.pdf | .pdf | 159,037 B | 2026-07-27 05:23 | 2026-07-27 05:23 | 2026-07-27 | 2026-07-27 | MS Word 2016 / ilovepdf | 5 | Requirements / Data Collection |
| 11 | InsureIQ_Project_Synopsis.docx | .docx | 20,528 B | 2026-07-27 04:56 | 2026-07-27 04:56 | — | — | — | — | Specification / Synopsis |
| 12 | InsureIQ_Project_Synopsis.odt | .odt | 24,111 B | 2026-07-27 04:58 | 2026-07-27 04:58 | — | — | — | — | Specification / Synopsis |
| 13 | InsureIQ_Project_Synopsis.pdf | .pdf | 189,064 B | 2026-07-27 05:23 | 2026-07-27 05:23 | 2026-07-27 | 2026-07-27 | MS Word 2016 / ilovepdf | 9 | Specification / Synopsis |
| 14 | InsureIQ_UML_Diagrams.docx | .docx | 815,680 B | 2026-07-27 05:19 | 2026-07-27 05:19 | — | — | — | — | Design / UML |
| 15 | InsureIQ_UML_Diagrams.pdf | .pdf | 684,941 B | 2026-08-13 03:39 | 2026-08-13 03:39 | 2026-08-13 | — | Writer / LibreOffice 7.3 | 9 | Design / UML |
| 16 | InsureIQ_Litrature_Review.odt | .odt | 25,811 B | 2026-08-13 03:53 | 2026-08-13 03:53 | — | — | — | — | Research / Literature Review |
| 17 | InsureIQ_Litrature_Review.pdf | .pdf | 92,647 B | 2026-08-13 03:53 | 2026-08-13 03:53 | 2026-08-13 | — | Writer / LibreOffice 7.3 | 11 | Research / Literature Review |
| 18 | ui-ux-designs.odt | .odt | 518,887 B | 2026-08-13 05:48 | 2026-08-13 05:48 | — | — | — | — | UI/UX / Visual Design |
| 19 | ui-ux-designs.pdf | .pdf | 382,381 B | 2026-08-13 05:48 | 2026-08-13 05:48 | 2026-08-13 | — | Writer / LibreOffice 7.3 | 7 | UI/UX / Visual Design |

### Reference / Template / Learning Documents

| # | Filename | Extension | Size | FS Birth | FS Modified | Type |
|---|---|---|---|---|---|---|
| 20 | Diagrams | (none/txt) | 2,743 B | 2026-07-22 10:58 | 2026-07-22 10:58 | Notes / Learning |
| 21 | notes b2b-b2c | (none/txt) | 0 B | 2026-07-22 11:01 | 2026-06-24 16:36 | Notes / Placeholder (empty) |
| 22 | feasibility study-format | (none/txt) | 4,672 B | 2026-07-26 17:27 | 2026-07-26 17:27 | Reference / Textbook |
| 23 | feasibility-types-requirement | (none/txt) | 2,957 B | 2026-07-26 17:35 | 2026-07-26 17:35 | Reference / Framework |
| 24 | requirement-gathering | (none/txt) | 1,276 B | 2026-07-27 01:47 | 2026-07-27 01:47 | Template / Blank |
| 25 | feasibility study  example | (none/txt) | 10,664 B | 2026-07-27 01:37 | 2026-07-27 01:37 | Reference / Example (Serenity Styles) |
| 26 | Project Synopsis Example | (none/txt) | 21,968 B | 2026-07-27 02:02 | 2026-07-27 02:02 | Reference / Example (Serenity Styles) |

---

## 6. Document Relationships

### Format Variants (same content, different formats)

Each primary document exists in multiple formats. In each case, the DOCX was created first, then converted to ODT and/or PDF:

1. **InsureIQ_Expanded_Requirements**: `.docx` (Jul 22) → `.pdf` (Jul 26). The PDF was generated ~4 days after the DOCX, suggesting editing between creation and PDF export. Confidence: **High**.
2. **InsureIQ_Two_Phase_Requirements**: `.docx` (Jul 27) → `.pdf` (Jul 29, via LibreOffice). The PDF was generated 2 days later in a different tool (LibreOffice vs Word), suggesting the document was edited/reformatted in LibreOffice. Confidence: **High**.
3. **InsureIQ_Feasibility_Study**: `.docx` (Jul 27 01:49) → `.odt` (Jul 27 01:50) → `.pdf` (Jul 27 05:23). Near-simultaneous DOCX/ODT creation, PDF hours later. Confidence: **High**.
4. **InsureIQ_Requirement_Gathering**: `.docx` (Jul 27 01:51) → `.odt` (Jul 27 01:53) → `.pdf` (Jul 27 05:23). Same pattern. Confidence: **High**.
5. **InsureIQ_Project_Synopsis**: `.docx` (Jul 27 04:56) → `.odt` (Jul 27 04:58) → `.pdf` (Jul 27 05:23). Same pattern. Confidence: **High**.
6. **InsureIQ_UML_Diagrams**: `.docx` (Jul 27 05:19) → `.pdf` (Aug 13 03:39, via LibreOffice). The PDF was regenerated ~17 days later, suggesting diagram updates. Confidence: **High**.
7. **InsureIQ_Litrature_Review**: `.odt` (Aug 13) → `.pdf` (Aug 13). Created natively in LibreOffice, not Word. Confidence: **High**.
8. **ui-ux-designs**: `.odt` (Aug 13) → `.pdf` (Aug 13). Created natively in LibreOffice. Confidence: **High**.

### Supersession Relationships

**InsureIQ_Two_Phase_Requirements supersedes InsureIQ_Expanded_Requirements (structurally)**

- Evidence: Two-Phase was created 5 days after Expanded (Jul 27 vs Jul 22).
- Two-Phase retains all of Expanded's core content (gap analysis, roles, modules, revenue model, delivery recommendation).
- Two-Phase restructures the four-phase model into a two-phase, two-part model.
- Both documents reference the same "original abstract" and "updated requirements."
- The Two-Phase document's conclusion explicitly recommends the same delivery approach with the new structure.
- Confidence: **High** that Two-Phase is the preferred structural organization.

### Derived Relationships

- **InsureIQ_Feasibility_Study** is derived from **InsureIQ_Expanded_Requirements**: The feasibility study explicitly states "This study determines whether the InsureIQ platform, as scoped in the Expanded Project Requirements document, is practical and workable." It references the Expanded Requirements' section numbering (§8.1, §8.2). Confidence: **High**.
- **InsureIQ_Project_Synopsis** is derived from **InsureIQ_Expanded_Requirements** and **InsureIQ_Two_Phase_Requirements**: The Synopsis's project overview, specification, and system descriptions closely mirror the requirements documents' content. Confidence: **High**.
- **InsureIQ_Requirement_Gathering** is derived from the same source material but formatted specifically for the academic requirement-gathering format. The domain questionnaire (Q1–Q10) appears to be primary research (interview responses) not found in other documents. Confidence: **High**.
- **InsureIQ_UML_Diagrams** is derived from the domain model established in the requirements documents. The class diagram entities (Tenant, User, Application, RiskScore, Policy, Claim, FraudFlag, Document, ChurnScore, Billing, MarketplaceLead) directly map to the requirements' domain concepts. Confidence: **High**.

### Template/Reference Relationships

- **`feasibility study  example`** and **`Project Synopsis Example`** are reference examples of another project (Serenity Styles — a beauty salon booking system). They were used as format templates for InsureIQ's own feasibility study and synopsis. Evidence: identical section structures, collected the same day or day before InsureIQ's own documents. Confidence: **High**.
- **`feasibility study-format`** and **`feasibility-types-requirement`** are generic textbook/reference material about feasibility study methodology. They informed the structure of InsureIQ's feasibility study. Confidence: **High**.
- **`requirement-gathering`** is a blank template with section headers. It was filled in to produce **InsureIQ_Requirement_Gathering**. Confidence: **High**.
- **`Diagrams`** contains UML learning notes that informed the creation of **InsureIQ_UML_Diagrams**. Confidence: **High**.

---

## 7. Actors & User Context

### B2B Actors (within a tenant boundary)

#### 1. Customer (Tenant End-User)

| Attribute | Detail |
|---|---|
| **Responsibilities** | Self-service insurance lifecycle management |
| **Permissions** | Own data only; no cross-tenant visibility |
| **Goals** | Apply for policies, file claims, track status, manage profile |
| **Workflows** | Register → KYC verification → browse policies → apply → upload documents → track application → receive policy → file claim → track claim |
| **Pages/Screens** | Registration, KYC upload, policy catalog, application form, document upload, claim filing, status tracker, policy/premium history, renewal reminders |
| **Actions** | Register, verify identity, browse, apply, upload, file claim, track, view history |
| **Relationships** | Served by Agent; applications reviewed by Underwriter; claims reviewed by Claims Adjuster |

[Source: docs1/InsureIQ_Expanded_Requirements.pdf, §4.2; docs1/InsureIQ_Project_Synopsis.pdf, §1.2; docs1/InsureIQ_Requirement_Gathering.pdf, "User Roles"]

#### 2. Agent

| Attribute | Detail |
|---|---|
| **Responsibilities** | Customer portfolio management, application submission, retention |
| **Permissions** | View/manage assigned customer portfolios; cannot approve/reject applications |
| **Goals** | Submit applications on behalf of customers, maximize retention, earn commission |
| **Workflows** | View assigned customers → submit application on behalf → view cross-sell suggestions → track commission → receive retention alerts for at-risk policyholders |
| **Pages/Screens** | Customer portfolio, application submission, cross-sell recommendations, commission tracker, retention alerts dashboard |
| **Actions** | Manage portfolios, initiate applications, view cross-sell, track commission, access retention alerts |
| **Relationships** | Acts on behalf of Customer; submits to Underwriter |

[Source: docs1/InsureIQ_Expanded_Requirements.pdf, §4.2; docs1/InsureIQ_Project_Synopsis.pdf, §1.2]

#### 3. Underwriter

| Attribute | Detail |
|---|---|
| **Responsibilities** | Application risk assessment and approval decisions |
| **Permissions** | Review applications, approve/reject/refer, adjust premiums within bounds |
| **Goals** | Make accurate, defensible, timely underwriting decisions |
| **Workflows** | Receive application → view risk score + breakdown → review supporting documents → approve/reject/refer → record decision rationale → access audit history |
| **Pages/Screens** | Application review queue, risk score dashboard (with SHAP explanations), approval/rejection form, audit history |
| **Actions** | Review, approve, reject, refer, adjust premium, view risk breakdown, access audit trail |
| **Relationships** | Reviews applications submitted by Customer/Agent; decisions audited by Administrator |

[Source: docs1/InsureIQ_Expanded_Requirements.pdf, §4.2; docs1/InsureIQ_Requirement_Gathering.pdf, Q1, Q5]

#### 4. Claims Adjuster

| Attribute | Detail |
|---|---|
| **Responsibilities** | Claims review, fraud investigation, settlement decisions |
| **Permissions** | Review claims, investigate flags, approve/reject/escalate settlements |
| **Goals** | Process claims efficiently while catching fraud |
| **Workflows** | Receive claim → review extracted document data → check fraud flags with SHAP explanations → investigate if flagged → approve/reject/escalate → record notes → track SLA compliance |
| **Pages/Screens** | Claims review queue, fraud flag dashboard (with SHAP explanations), investigation notes, settlement form, SLA tracker |
| **Actions** | Review, investigate, approve, reject, escalate, record notes, track ageing |
| **Relationships** | Reviews claims filed by Customer; flags investigated with AI assistance; escalation path to Administrator |

[Source: docs1/InsureIQ_Expanded_Requirements.pdf, §4.2; docs1/InsureIQ_Requirement_Gathering.pdf, Q2, Q3, Q4]

#### 5. Administrator (Tenant-Level)

| Attribute | Detail |
|---|---|
| **Responsibilities** | Tenant configuration, user management, analytics, audit |
| **Permissions** | Full tenant-level access; no cross-tenant visibility |
| **Goals** | Configure and monitor the tenant's operations |
| **Workflows** | Manage users/roles → configure policy types/premium bands → monitor KPIs → audit decisions → manage model versions |
| **Pages/Screens** | User management, tenant configuration, KPI dashboard (policies sold, claims pending, avg settlement time, revenue), audit log, model version manager |
| **Actions** | Manage users, configure rules, monitor analytics, audit decisions, manage models |
| **Relationships** | Oversees all tenant roles; reports to InsureIQ Super-Admin (platform level) |

[Source: docs1/InsureIQ_Expanded_Requirements.pdf, §4.2]

#### 6. InsureIQ Super-Admin

| Attribute | Detail |
|---|---|
| **Responsibilities** | Platform-level operations |
| **Permissions** | Cross-tenant access; tenant provisioning; billing |
| **Goals** | Provision tenants, monitor platform health, manage cross-tenant billing |
| **Workflows** | Provision new tenant → configure branding/subdomain → monitor platform health → manage billing across tenants |
| **Pages/Screens** | Tenant provisioning console, platform health dashboard, cross-tenant billing management |
| **Actions** | Provision, monitor, bill |
| **Relationships** | Operates above all tenants; separate from any single tenant's Administrator |

[Source: docs1/InsureIQ_Expanded_Requirements.pdf, §4.1; docs1/InsureIQ_Requirement_Gathering.pdf, "User Roles"]

### B2C Actor

#### 7. Marketplace Customer (B2C)

| Attribute | Detail |
|---|---|
| **Responsibilities** | Cross-insurer insurance shopping and management |
| **Permissions** | SSO across tenants; compare/apply across insurers; unified dashboard |
| **Goals** | Compare products, get best coverage, manage all insurance in one place |
| **Workflows** | Register once → complete KYC once → browse product catalog → compare insurers → request quotes (fan-out) → select insurer → application routed to tenant → track policies/claims across all insurers |
| **Pages/Screens** | Marketplace landing, product catalog with filters, side-by-side comparison, quote request form, application routing, unified "My Insurance" dashboard, document vault |
| **Actions** | Register (SSO), compare, request quotes, apply, track cross-insurer |
| **Relationships** | Interacts with multiple tenants simultaneously; leads routed to individual tenant backends |

[Source: docs1/InsureIQ_Expanded_Requirements.pdf, §5; docs1/InsureIQ_Two_Phase_Requirements.pdf, §4.2]

---

## 8. Requirements Model

### Functional Requirements

| ID | Requirement | Source | First Appearance | Current State | Confidence |
|---|---|---|---|---|---|
| FR-01 | Multi-tenant architecture with per-tenant data isolation | Expanded Req | Jul 22 | Active — confirmed in all subsequent docs | High |
| FR-02 | Tenant provisioning (separate schema/DB per tenant) | Expanded Req | Jul 22 | Active | High |
| FR-03 | Tenant branding layer (subdomain/custom domain) | Expanded Req | Jul 22 | Active | High |
| FR-04 | Role-based access control (6 B2B roles + 1 B2C role) | Expanded Req | Jul 22 | Active | High |
| FR-05 | Policy application workflow (browse → apply → upload → track) | Expanded Req | Jul 22 | Active | High |
| FR-06 | Claims intake and tracking (file → track → settle) | Expanded Req | Jul 22 | Active | High |
| FR-07 | Risk scoring & premium prediction (XGBoost/LightGBM, SHAP) | Expanded Req | Jul 22 | Active | High |
| FR-08 | Claims fraud detection (anomaly + classification, SHAP) | Expanded Req | Jul 22 | Active | High |
| FR-09 | OCR/NLP document processing (Tesseract, HF Transformers) | Expanded Req | Jul 22 | Active | High |
| FR-10 | Churn prediction & retention alerts | Expanded Req | Jul 22 | Active | High |
| FR-11 | KYC/identity verification | Expanded Req | Jul 22 | Active | High |
| FR-12 | B2C marketplace — product comparison across tenants | Expanded Req | Jul 22 | Active (Part B — researched extension) | High |
| FR-13 | B2C marketplace — quote fan-out and lead routing | Expanded Req | Jul 22 | Active (Part B) | High |
| FR-14 | Unified "My Insurance" cross-insurer dashboard | Expanded Req | Jul 22 | Active (Part B) | High |
| FR-15 | Billing & subscription management (SaaS tiers) | Expanded Req | Jul 22 | Active | High |
| FR-16 | Usage metering (policies issued, claims processed) | Expanded Req | Jul 22 | Active | High |
| FR-17 | Feature-tier gating (basic vs premium AI) | Expanded Req | Jul 22 | Active | High |
| FR-18 | AI insurance advisor (conversational recommender) | Expanded Req | Jul 22 | Active (Part B) | High |
| FR-19 | Personalized cross-sell recommendation | Expanded Req | Jul 22 | Active (Part B) | High |
| FR-20 | Universal Insurance Risk Score (portable risk profile) | Expanded Req | Jul 22 | Active (Part B — highest strategic extension) | High |
| FR-21 | Shared fraud intelligence (cross-tenant, privacy-preserving) | Expanded Req | Jul 22 | Active (Part B — highest governance module) | High |
| FR-22 | Premium comparison intelligence (ML best-fit scoring) | Expanded Req | Jul 22 | Active (Part B) | High |
| FR-23 | Industry benchmarking dashboards | Expanded Req | Jul 22 | Active (Part B) | High |
| FR-24 | Consent management service (cross-tenant data sharing) | Expanded Req | Jul 22 | Active (Part B) | High |

### Non-Functional Requirements

| ID | Requirement | Source | Confidence |
|---|---|---|---|
| NFR-01 | Explainable AI — every risk score and fraud flag must have SHAP-based explanation | Expanded Req, Literature Review | High |
| NFR-02 | Data isolation — tenant data must be strictly separated | Expanded Req, Feasibility Study | High |
| NFR-03 | JWT-based authentication | Synopsis, Req Gathering | High |
| NFR-04 | Responsive web design (modern browser support) | Synopsis | Medium |
| NFR-05 | Docker containerization | Synopsis | High |
| NFR-06 | CI/CD via GitHub Actions | Synopsis | Medium |

### Security Requirements

| ID | Requirement | Source | Confidence |
|---|---|---|---|
| SEC-01 | Per-tenant data isolation | Expanded Req, Feasibility Study | High |
| SEC-02 | JWT-based authentication | Synopsis | High |
| SEC-03 | Encrypted lead data transmission (for marketplace) | Feasibility Study (IRDAI reference) | Medium — stated as requirement for live operation, not necessarily for demo |
| SEC-04 | Consent framework for cross-tenant data sharing | Expanded Req | High (Part B) |

---

## 9. Domain Model

### Core Entities

[Source: docs1/InsureIQ_UML_Diagrams.pdf, Class Diagram]

| Entity | Description | Key Attributes (inferred from class diagram) | Relationships |
|---|---|---|---|
| **Tenant** | An insurance company subscribing to InsureIQ | ID, name, branding config, subdomain, status | Provisions many Users; configures many Policies |
| **User** | Any person using the system (any role) | ID, tenant_id, role, name, email, KYC status | Belongs to Tenant; submits Applications; profiled by ChurnScore; generates MarketplaceLeads |
| **Application** | A policy application submitted by a customer | ID, user_id, policy_type, status, submitted_date | Submitted by User; scored by exactly one RiskScore |
| **RiskScore** | ML-generated risk assessment for an application | ID, application_id, score (0–100), feature_importance, model_version | Scores exactly one Application |
| **Policy** | An active insurance policy | ID, tenant_id, user_id, type, coverage, premium, start_date, end_date, status | Belongs to Tenant; held by User; has many Claims |
| **Claim** | An insurance claim filed against a policy | ID, policy_id, type, amount, status, filed_date | Filed against Policy; checked by one FraudFlag; supported by Documents |
| **FraudFlag** | ML-generated fraud assessment for a claim | ID, claim_id, risk_level, SHAP_explanation, model_version | Checks exactly one Claim |
| **Document** | An uploaded document (claim form, medical report, photo) | ID, claim_id/application_id, type, OCR_extracted_data, file_path | Supports Claim or Application |
| **ChurnScore** | ML-generated churn probability for a customer | ID, user_id, churn_probability, risk_factors, model_version | Profiles one User |
| **Billing** | Tenant billing/invoice record | ID, tenant_id, period, amount, status | Invoiced to Tenant |
| **MarketplaceLead** | A lead generated through the B2C marketplace | ID, user_id, tenant_id, quote_request_id, status | Generated by User; routed to Tenant |

### Entity Lifecycle (key entities)

**Application Lifecycle**: Submitted → Risk Scored → Under Review → Approved / Rejected / Referred → (if approved) Policy Issued

**Claim Lifecycle** [Source: docs1/InsureIQ_UML_Diagrams.pdf, State Chart Diagram]:
Submitted → Document Verification → Fraud Check → {Auto-Approved | Manual Investigation | Rejected} → (if approved) Payment Processed → Closed

**Policy Lifecycle** (inferred): Draft → Active → Renewal Due → Renewed / Lapsed

### Business Rules (extracted)

1. Risk score is computed as 0–100 with feature-importance breakdown [Source: Req Gathering, Module table]
2. Fraud flag must include SHAP-based explanation showing which factors drove the decision [Source: Expanded Req, Synopsis]
3. Underwriters can adjust premium recommendations only "within approved bounds" [Source: Expanded Req, §4.2]
4. Claims adjusters can approve, reject, or escalate — escalation path exists [Source: Expanded Req, §4.2]
5. The marketplace never underwrites or assumes risk — it is a distribution layer [Source: Expanded Req, §5]
6. The customer does not pay to use the B2C marketplace — aggregator commission is a distribution cost [Source: Expanded Req, §8.2]
7. Featured placement must be transparently labeled, not misleading [Source: Expanded Req, gap analysis table]
8. Cross-tenant data sharing requires explicit, granular consent [Source: Expanded Req, §7.3]
9. Shared fraud intelligence must use privacy-preserving techniques (federated learning or hashed identifiers), never raw data pooling [Source: Expanded Req, §7.4]

---

## 10. Workflows

### W1 — Policy Application (B2B, per-tenant)

```
Customer → Register & KYC → Browse Policies → Select Policy Type → 
Fill Application → Upload Documents → Submit → 
[System: OCR extracts document data] → 
[System: Risk Score computed (XGBoost/LightGBM)] → 
Underwriter Reviews (with SHAP explanation) → 
Approve / Reject / Refer → 
[If approved] → Policy Issued → Customer notified
```

[Source: docs1/InsureIQ_UML_Diagrams.pdf, Sequence Diagram; docs1/InsureIQ_Requirement_Gathering.pdf, Q1]

### W2 — Claims Processing (B2B, per-tenant)

```
Customer → File Claim → Upload Supporting Documents →
[System: OCR extracts fields from documents] →
[System: Fraud Detection model scores claim] →
[System: SHAP explanation generated for fraud flag] →
{Low risk} → Auto-Approved → Payment Processed → Closed
{High risk / Anomalous} → Claims Adjuster investigates →
  Adjuster reviews extracted data + fraud explanation →
  Approve / Reject / Escalate →
  Record notes + justification → 
  [If approved] Payment Processed → Closed
  [If rejected] Customer notified → Closed
```

[Source: docs1/InsureIQ_UML_Diagrams.pdf, State Chart Diagram; docs1/InsureIQ_Requirement_Gathering.pdf, Q2–Q4]

### W3 — Churn Prediction & Retention (B2B, per-tenant)

```
[System: Churn model scores all active policyholders periodically] →
At-risk customers flagged →
Agent receives retention alerts →
Agent reviews customer portfolio →
Agent takes retention action (contact, offer, etc.)
```

[Source: docs1/InsureIQ_Expanded_Requirements.pdf; docs1/InsureIQ_Requirement_Gathering.pdf, Q6]

### W4 — Marketplace Comparison & Application (B2C)

```
Marketplace Customer → Register (SSO) → Complete KYC once →
Browse Product Catalog (aggregated from all tenants) →
Filter by category (motor, health, life, travel, home) →
Compare side-by-side (premium, coverage, add-ons, rating, settlement ratio) →
Request Quote (single form) →
[System: Fan-out to relevant tenant risk-scoring engines] →
Receive indicative premiums from multiple insurers →
Select insurer →
[System: Route application + documents + KYC to selected tenant's B2B backend] →
[Tenant's normal workflow takes over — application appears as ordinary "New Application"]
```

[Source: docs1/InsureIQ_Expanded_Requirements.pdf, §5.2; docs1/InsureIQ_Two_Phase_Requirements.pdf, §4.2.2]

### W5 — Tenant Onboarding (Super-Admin)

```
Super-Admin → Provision new tenant →
Configure: tenant name, branding, subdomain/domain →
Create isolated schema/database →
Configure default policy types, premium bands →
Create tenant Administrator account →
Tenant is live
```

[Source: docs1/InsureIQ_Expanded_Requirements.pdf, §4.1]

---

## 11. UI/UX Understanding

### Known Screens/Pages (within docs1/)

The `ui-ux-designs.odt/pdf` contains **visual mockups** (7 pages of screenshots) but minimal extractable text. The title is "INSURE-IQ UI/UX DESIGNS." Detailed per-role UI specifications exist in `docs/` (outside `docs1/` scope) as separate markdown files for each role.

From the requirements and UML documents, the following screens are implied:

#### Customer Screens
- Registration / Login
- KYC / Identity Verification upload
- Policy catalog / browse
- Application form
- Document upload
- Application status tracker
- Claim filing form
- Claim status tracker
- Policy/premium history
- Renewal reminders
- Profile management

#### Agent Screens
- Customer portfolio view
- Application submission (on behalf)
- Cross-sell recommendations
- Commission tracker
- Retention alerts dashboard

#### Underwriter Screens
- Application review queue
- Risk score dashboard with SHAP explanations
- Application approval/rejection form
- Audit history

#### Claims Adjuster Screens
- Claims review queue
- Fraud flag dashboard with SHAP explanations
- Investigation notes
- Settlement approval/rejection form
- SLA compliance tracker

#### Administrator Screens
- User/role management
- Tenant configuration (policy types, premium bands)
- KPI dashboard (policies sold, claims pending, avg settlement time, revenue)
- Audit log
- Model version management

#### Super-Admin Screens
- Tenant provisioning console
- Platform health dashboard
- Cross-tenant billing management

#### Marketplace Customer Screens
- Marketplace landing page
- Product catalog with filters
- Side-by-side comparison view
- Quote request form
- "My Insurance" unified dashboard (cross-insurer)
- Document vault

### UI/UX Gaps (within docs1/)
- No wireframes with labeled components extractable from `docs1/`
- No navigation flow / sitemap diagram
- No responsive breakpoint specifications
- No design system (colors, typography, spacing) documented in `docs1/`
- Empty states, loading states, error states not specified

---

## 12. Technical Architecture

### Stack (explicit, consistently stated)

| Layer | Technology | Source |
|---|---|---|
| **Frontend** | React.js, Tailwind CSS, Chart.js / Recharts | Synopsis, Req Gathering |
| **Backend** | FastAPI (Python), REST APIs | Synopsis, Req Gathering |
| **Authentication** | JWT-based | Synopsis, Req Gathering |
| **Database** | PostgreSQL (with pgvector extension) | Synopsis, Req Gathering |
| **ML — Risk/Fraud** | XGBoost, LightGBM, scikit-learn | Expanded Req, Synopsis |
| **ML — Explainability** | SHAP | Expanded Req, Synopsis, Literature Review |
| **ML — Deep Learning** | PyTorch | Synopsis |
| **NLP** | Hugging Face Transformers, Tesseract OCR | Synopsis, Expanded Req |
| **Vector Search** | pgvector (within PostgreSQL) | Expanded Req, Synopsis |
| **Embeddings** | Sentence-BERT | Expanded Req |
| **Retrieval** | FAISS / pgvector | Expanded Req |
| **Caching** | Redis | Synopsis |
| **Containerization** | Docker | Synopsis |
| **CI/CD** | GitHub Actions | Synopsis |
| **Object Storage** | AWS S3 or equivalent | Expanded Req (deployment diagram) |
| **Compute** | AWS EC2 or equivalent | Expanded Req |

### Architecture Patterns

- **Multi-tenant**: Schema-per-tenant or database-per-tenant isolation in PostgreSQL
- **API-first**: FastAPI REST endpoints serving React frontend
- **Microservice-adjacent**: Component diagram shows 6 separate service components (Tenant Portal, Underwriting & Claims Service, Billing Service, AI Model Service, Marketplace Service, Notification Service)
- **ML inference**: Dedicated ML inference server separate from application server
- **Deployment**: Client → Load Balancer/API Gateway → Dockerized multi-tenant app server → ML inference server → PostgreSQL (pgvector) + Object Storage

[Source: docs1/InsureIQ_UML_Diagrams.pdf, Component Diagram, Deployment Diagram]

### Technology Decisions & Rationale

| Decision | Rationale | Source |
|---|---|---|
| FastAPI over Django/Flask | Async support, auto-docs, Pydantic validation, multi-tenant endpoint efficiency | Synopsis §3.3.1 |
| PostgreSQL over MySQL | Schema-per-tenant isolation, pgvector for embeddings, transaction support | Synopsis §3.3.2 |
| XGBoost/LightGBM over deep learning for tabular | Strong accuracy, fast training on modest hardware, native feature-importance for SHAP | Synopsis §3.3.3 |
| SHAP for explainability | Per-feature contribution breakdown for auditable, justifiable AI decisions | Synopsis §3.3.4 |
| pgvector over separate vector DB | Embeddings stored and queried within same DB as operational data | Synopsis §3.3.2 |

---

## 13. Data & Schema Understanding

### Within docs1/

The class diagram (UML Diagrams document) defines 11 core entities with their relationships (see §9 Domain Model). The object diagram provides a concrete example: customer Rahul Menon with ABC Insurance tenant, motor policy, risk score, active policy, fraud-flagged claim with supporting document, churn score, and tenant invoice.

### Field-Level Schema

Field-level schema definitions are **not present in docs1/**. They are documented in `schemadocs/` (outside `docs1/` scope), specifically in files like `modules and tables list` (51,140 B), `schema design chat` (44,593 B), and `schema_list` (18,433 B), plus a `module1/` subdirectory with per-module schema details.

### Enums/Statuses (inferred from requirements and state chart)

- **Application Status**: Submitted, Risk Scored, Under Review, Approved, Rejected, Referred
- **Claim Status**: Submitted, Document Verification, Fraud Check, Auto-Approved, Under Investigation, Rejected, Payment Processed, Closed
- **Policy Status**: Draft, Active, Renewal Due, Renewed, Lapsed, Cancelled (inferred)
- **User Role**: Customer, Agent, Underwriter, Claims Adjuster, Administrator, Super-Admin, Marketplace Customer
- **Fraud Risk Level**: Low, Medium, High (inferred from "high-risk or anomalous" and auto-approval for low-risk)
- **Tenant Status**: Active, Suspended, Deprovisioned (inferred)
- **Billing Status**: Pending, Paid, Overdue (inferred)
- **Policy Types**: Auto, Health, Life, Property (explicit), Travel, Home (explicit in marketplace context)

---

## 14. Terminology Evolution

| Original / Earlier Term | Later / Current Term | Nature of Change | Evidence |
|---|---|---|---|
| "customer" (single meaning) | "tenant-customer" (B2B) + "end-customer" (B2C) | Entity split | Expanded Req gap analysis: formally split "customer" into two distinct actors |
| "Phase 1, Phase 2" (original abstract) | "Phase 1, Phase 2, Phase 3, Phase 4" (Expanded Req) → "Phase 1 Part A/B, Phase 2 Part A/B" (Two-Phase Req) | Structural redesign | Expanded Req introduced four phases; Two-Phase Req consolidated back to two phases with sub-parts |
| "single insurer instance" | "multi-tenant SaaS" | Conceptual change | Gap analysis: original assumed single org, updated requires multi-tenant |
| (no monetization concept) | "SaaS Subscription / Per-Policy Fee / Per-Claim Fee / AI Premium Features / Commission / Lead Generation / Featured Placement" | New concept introduced | Expanded Req §8: "commercial logic absent from the original abstract entirely" |
| "optional integrations" (original abstract, re: AI advisor) | "customer-facing, spanning every participating tenant's catalog" | Scope expansion | Expanded Req §7.1: upgraded from single-tenant optional to cross-tenant B2C feature |

---

## 15. Decisions & Changes

### D1 — Multi-Tenancy Decision

- **What changed**: From single-insurer instance to multi-tenant SaaS
- **When**: Between original abstract (pre-Jul 22) and Expanded Requirements (Jul 22)
- **Why**: Updated business requirements introduced a B2B SaaS model requiring multiple insurer tenants
- **Impact**: Architectural — must be built from day one, cannot be retrofitted
- **Status**: Decided, active

[Source: docs1/InsureIQ_Expanded_Requirements.pdf, §2 Gap Analysis, §4.1]

### D2 — B2C Marketplace Introduction

- **What changed**: From B2B-only to hybrid B2B–B2C with marketplace
- **When**: Between original abstract and Expanded Requirements (Jul 22)
- **Why**: Updated business requirements added customer-facing marketplace modelled on real aggregators
- **Impact**: Major scope addition — new Phase/Part B
- **Status**: Decided; scoped as researched extension, not full implementation

[Source: docs1/InsureIQ_Expanded_Requirements.pdf, §5]

### D3 — Four-Phase to Two-Phase Restructuring

- **What changed**: Four separate phases → two phases with two parts each
- **When**: Jul 27 (Two-Phase Requirements created)
- **Why**: Better grouping — Phase 1 groups all non-AI work (B2B + B2C foundation), Phase 2 groups all AI work (B2B + B2C intelligence)
- **Impact**: Structural clarity; no content change
- **Status**: Decided — Two-Phase is the current preferred structure

[Source: docs1/InsureIQ_Two_Phase_Requirements.pdf, §3]

### D4 — B2C Scope Limitation for Academic Delivery

- **What changed**: B2C marketplace explicitly scoped as "simulation" or "partial prototype"
- **When**: Jul 27 (Feasibility Study)
- **Why**: IRDAI regulatory requirements impossible for academic project; schedule infeasible for full B2C build alongside full B2B build; single developer constraint
- **Impact**: Part B of each phase = researched + documented + partially prototyped, not production-ready
- **Status**: Decided

[Source: docs1/InsureIQ_Feasibility_Study.pdf, §5, §6, §9]

### D5 — Federated Learning Scoped as Simulation

- **What changed**: Cross-tenant fraud intelligence uses hashed-identifier matching or simplified simulation, not true federated learning
- **When**: Jul 22 (Expanded Requirements, §7.4) + Jul 27 (Feasibility Study, §2.1)
- **Why**: "Federated learning is a research-grade infrastructure problem on its own"
- **Impact**: Shared fraud intelligence module = simulation, not production federated learning
- **Status**: Decided

[Source: docs1/InsureIQ_Feasibility_Study.pdf, §2.1; docs1/InsureIQ_Expanded_Requirements.pdf, §7.4]

---

## 16. Contradictions & Conflicts

### Conflict 1 — Phase Structure (Four-Phase vs Two-Phase)

**Conflict**: InsureIQ_Expanded_Requirements uses a four-phase model; InsureIQ_Two_Phase_Requirements uses a two-phase, two-part model.

**Evidence A**: Expanded Requirements (Jul 22–26): Phase 1 (B2B Foundation), Phase 2 (B2C Marketplace), Phase 3 (B2B AI), Phase 4 (B2C AI).

**Evidence B**: Two-Phase Requirements (Jul 27–29): Phase 1 (Foundation: Part A = B2B, Part B = B2C), Phase 2 (AI: Part A = B2B, Part B = B2C).

**Likely Explanation**: The Two-Phase document is a structural reorganization of the same content. The grouping changed from "by business model" (B2B phases then B2C phases) to "by capability layer" (foundation then AI, each with B2B and B2C parts). No functional content was added, removed, or changed.

**Chronological Interpretation**: Two-Phase was created 5 days after Expanded and explicitly restructures it. The Two-Phase version groups non-AI and AI work more clearly, which better supports the delivery recommendation (build Part A fully, prototype Part B).

**Current Best Interpretation**: The **Two-Phase, Two-Part** structure is the current preferred organization.

**Confidence**: High

**Needs Human Confirmation**: No — the chronology is clear and the content is consistent.

---

### Conflict 2 — Payment Gateway (from reference material only)

**Conflict**: The reference examples (Serenity Styles) mention PayPal, Stripe, and Razor Pay as payment gateways. InsureIQ documents do not specify a payment gateway.

**Evidence A**: Project Synopsis Example (Serenity Styles): "PayPal or Stripe" and "Razor pay"

**Evidence B**: InsureIQ documents: No payment gateway specified. Billing module described at business-model level only.

**Likely Explanation**: The reference examples are for a different project (beauty salon). InsureIQ's billing is B2B SaaS billing (tenant subscriptions), not consumer payment processing. The payment gateway choice is an implementation detail not yet decided.

**Current Best Interpretation**: No payment gateway has been selected for InsureIQ. This is an open implementation question.

**Confidence**: High that this is not a conflict but an undecided detail.

**Needs Human Confirmation**: Yes — which payment gateway (if any) will be integrated for the billing module.

---

## 17. Facts vs Inferences vs Unknowns

### Explicit Facts (directly stated in documents)

1. InsureIQ is an MCA mini-project (24MCAR295) at AJCE by Jobin James under Lisha Varghese. [Source: Req Gathering]
2. The tech stack is React.js / FastAPI / PostgreSQL+pgvector / XGBoost / SHAP / Tesseract / Docker. [Source: Synopsis §3.2]
3. There are 7 user roles: Customer, Agent, Underwriter, Claims Adjuster, Administrator, Super-Admin, Marketplace Customer. [Source: Req Gathering, Expanded Req]
4. The B2C marketplace is modelled on Policybazaar, Compare the Market, GoCompare, Insurify, The Zebra. [Source: Expanded Req §5]
5. IRDAI licensing is not achievable within an academic project. [Source: Feasibility Study §5.1]
6. The class diagram has 11 core entities. [Source: UML Diagrams]
7. Part A should be fully implemented; Part B should be researched + partially prototyped. [Source: Expanded Req §9, Two-Phase Req §7, Feasibility Study §9]
8. The domain questionnaire responses were gathered from an insurance industry contact. [Source: Req Gathering, Questionnaire section]
9. Claims processing delay was ranked as highest-priority problem by the industry contact. [Source: Req Gathering, Q10]

### Strong Inferences

1. The "original abstract" pre-dates all `docs1/` documents and described a single-tenant, B2B-only, two-phase platform. Evidence: every requirements document references it as prior work; gap analysis table shows what it contained. The abstract itself is not in `docs1/`.
2. The Two-Phase structure supersedes the Four-Phase structure. Evidence: later creation date; explicitly reorganizes the same content; better supports the delivery recommendation.
3. The developer's understanding progressed from learning UML concepts → comprehensive requirements → feasibility analysis → academic literature grounding → UI/UX design, in that order. Evidence: file dates and content sophistication.
4. The project is currently in the design-to-implementation transition. Evidence: the latest documents (Aug 13) are literature review, updated UML, and UI/UX mockups; implementation-level docs exist outside `docs1/` in `docs/` and `schemadocs/`.

### Weak Inferences

1. The developer may have received guidance on restructuring from four phases to two phases. Evidence: the restructuring improves academic presentation clarity, which could reflect advisor feedback. But this could also be the developer's own decision.
2. The Serenity Styles example project may be from a classmate or previous year's project. Evidence: it's used as a format template, not a content reference.

### Unknowns

1. What the "original abstract" contains in full — it is referenced but not present in `docs1/`.
2. Whether the developer has begun any code implementation.
3. What specific insurance data (real or synthetic) will be used for the AI models.
4. What the specific API endpoints will be.
5. How the academic evaluation criteria map to the documented features.

---

## 18. Completed / In-Progress / Unresolved

### Researched ✓
- Insurance industry domain (domain questionnaire with industry contact)
- AI/ML techniques for insurance (comprehensive literature review with 15+ 2025–2026 references)
- Real-world insurance aggregator models (Policybazaar, Compare the Market, etc.)
- Regulatory landscape (IRDAI regulations, Digital Personal Data Protection Act)
- Multi-tenant SaaS architecture patterns
- Feasibility across 6 dimensions (technical, economic, operational, legal, schedule, market)
- Privacy-preserving AI techniques (federated learning, differential privacy)

### Specified ✓
- Project identity, purpose, domain, stakeholders
- All 7 user roles with responsibilities, permissions, and workflows
- All functional requirements across B2B and B2C
- Revenue model (B2B: 4 models; B2C: 4 models)
- Technology stack with rationale for each choice
- Multi-tenant architecture (schema-per-tenant / DB-per-tenant)
- Four AI modules (risk scoring, fraud detection, OCR/NLP, churn prediction)
- B2C marketplace capabilities (comparison, fan-out, routing, unified dashboard)
- Hardware and software specifications
- Delivery recommendation (Part A: full build; Part B: researched extension)

### Designed ✓
- UML diagrams: use case, sequence, state chart, activity, class, object, component, deployment (8 diagrams)
- UI/UX visual mockups (7 pages)
- System architecture (component and deployment diagrams)
- Domain model (11 entities with relationships)

### Partially Designed
- Database schema — entity-level design in `docs1/`, field-level in `schemadocs/` (outside `docs1/`)
- Per-role UI specifications — in `docs/` (outside `docs1/`)

### Not Yet Addressed (within docs1/)
- API endpoint specification
- Testing strategy
- Error handling and edge cases
- Sprint/iteration plan
- Data seeding / demo data
- Deployment procedures
- Performance requirements
- Acceptance criteria

### Superseded
- Four-phase structure (superseded by two-phase, two-part structure)

---

## 19. Project Gaps

### Genuinely Missing

| Gap | Category | Impact | Priority |
|---|---|---|---|
| API endpoint specification | Technical / Integration | Cannot implement backend without defined endpoints | High |
| Testing strategy | Quality | No plan for validating correctness | High |
| Error handling / edge cases | Technical | Fragile system without error handling design | High |
| Acceptance criteria | Requirements | No way to verify requirements are met | High |
| Sprint/iteration plan | Project Management | No development schedule | Medium |
| Performance requirements | Non-Functional | No targets for response time, throughput | Medium |
| Data seeding strategy | Implementation | No plan for demo data | Medium |
| Deployment procedure | Operational | No documented deployment steps | Medium |
| Security architecture detail | Security | Only "JWT auth" and "per-tenant isolation" — insufficient for implementation | Medium |

### Probably Documented Elsewhere

| Gap (in docs1/) | Likely Location | Confidence |
|---|---|---|
| Field-level database schema | `schemadocs/` directory | High |
| Per-role UI specifications | `docs/` directory (7 per-role .md files visible) | High |
| UI design system | `docs/InsureIQ_UI_Design.md` | High |
| Software design document | `docs/InsureIQ_Software_Design.md` | High |
| UX gap analysis | `docs/InsureIQ_UX_Gap_Analysis_Checklist.md` | High |

### Intentionally Out of Scope

| Item | Evidence |
|---|---|
| IRDAI regulatory licensing | Feasibility Study §5.1: "None of this is achievable, or meant to be achievable, within an academic project" |
| Production federated learning | Feasibility Study §2.1: "research-grade infrastructure problem…demonstrable only as a simplified simulation" |
| Full HIPAA/health-data compliance | Feasibility Study §5.3: "worth one explicit sentence acknowledging the boundary, without attempting to implement it" |
| Live payment processing with real money | Implicit — academic prototype |
| Multi-language support | Reference example (Serenity Styles): "not essential in the initial phase" |
| Real insurer onboarding | Feasibility Study §4.2: "a dynamic a single-tenant academic demo cannot fully replicate" |

### Obsolete Because of Later Changes

| Item | Evidence |
|---|---|
| Four-phase structure | Superseded by two-phase, two-part structure in Two-Phase Requirements |

---

## 20. Current Source-of-Truth Map

| Category | Primary Source | Why |
|---|---|---|
| **Requirements (structure/roadmap)** | `InsureIQ_Two_Phase_Requirements.pdf` | Latest restructuring of requirements; supersedes Expanded Requirements structurally |
| **Requirements (detail/depth)** | `InsureIQ_Expanded_Requirements.pdf` | Most detailed version of requirements content; Two-Phase references same content |
| **Domain model** | `InsureIQ_UML_Diagrams.pdf` (class diagram) | Most recent version (Aug 13 PDF); defines entities and relationships |
| **User roles & permissions** | `InsureIQ_Requirement_Gathering.pdf` + `InsureIQ_Expanded_Requirements.pdf` | Both consistently define all 7 roles with identical responsibilities |
| **Feasibility assessment** | `InsureIQ_Feasibility_Study.pdf` | Only document performing systematic feasibility analysis |
| **Academic context** | `InsureIQ_Requirement_Gathering.pdf` | Contains system ownership, academic identifiers, industry contact data |
| **Technology stack** | `InsureIQ_Project_Synopsis.pdf` §3.2–3.3 | Most specific and rationale-rich technology descriptions |
| **Revenue model** | `InsureIQ_Expanded_Requirements.pdf` §8 | Most detailed revenue model tables |
| **Literature/research grounding** | `InsureIQ_Litrature_Review.pdf` | Only formal literature review; 15+ recent references |
| **UML/system design** | `InsureIQ_UML_Diagrams.pdf` | 8 UML diagrams with narrative descriptions |
| **UI/UX visual design** | `ui-ux-designs.pdf` | Visual mockups (images) |
| **Database schema** | Outside `docs1/` — likely `schemadocs/` | Not documented at field level within `docs1/` |

---

## 21. What I Currently Understand

Based on the reconstructed evolution, the developer currently understands:

1. **The full problem domain**: Manual insurance workflows → AI-driven automation, with specific pain points validated by industry contact (claims delay = #1 priority, fraud detection = #2).
2. **The business model**: Hybrid B2B–B2C SaaS with 8 revenue streams across both sides, modelled on real-world precedents.
3. **The academic constraints**: Solo developer, 3–4 month window, Part A = full build, Part B = researched extension, no regulatory compliance beyond documentation.
4. **The technology stack**: Fully specified with rationale for each choice, grounded in MCA-level coursework capability.
5. **The user model**: 7 distinct roles with clear responsibilities, workflows, and UI requirements.
6. **The AI approach**: Four modules (risk, fraud, OCR, churn) using explainable ML (XGBoost + SHAP), with theoretical grounding from literature review.
7. **The multi-tenant architecture**: Schema-per-tenant isolation, tenant branding, per-tenant configuration, super-admin console.
8. **The delivery strategy**: Build B2B fully, prototype B2C, document everything to the same depth.
9. **The regulatory landscape**: IRDAI requirements understood and explicitly scoped out for academic delivery.
10. **The system design**: 8 UML diagrams, 11 core entities, 6 architectural components, deployment model.

---

## 22. What I Still Need to Understand

1. **API endpoint design**: What specific REST endpoints does each service expose? What are the request/response schemas?
2. **Field-level database schema**: What are the exact columns, types, constraints, and indexes for each entity? (May be in `schemadocs/`)
3. **Authentication flow**: How exactly does JWT auth work across tenant boundaries and for the marketplace SSO?
4. **Per-role UI specifications**: What are the exact screen layouts, components, and interactions for each role? (May be in `docs/`)
5. **Development schedule**: What is the sprint plan? What gets built first?
6. **Testing approach**: How will the system be tested? What are the test scenarios?
7. **Demo data**: What data will populate the prototype for demonstration?
8. **AI model training data**: Where will training data for the four ML models come from?
9. **Error handling patterns**: How does the system handle failures, timeouts, and edge cases?
10. **Marketplace event sync**: How exactly does the marketplace's cross-tenant read-model stay in sync with tenant data?

---

## 23. Recommended Next Analysis Sequence

Based on the reconstructed project state and identified gaps, the following sequence is recommended:

1. **Analyze `schemadocs/` directory** — reconcile field-level schema with the class diagram entities to produce a complete data dictionary.
2. **Analyze `docs/` directory** — integrate the per-role UI specifications and software design document with the requirements and UML to produce a complete screen inventory.
3. **Define API endpoints** — based on the workflows, user roles, and entity model, specify the REST API surface.
4. **Create authentication/authorization design** — JWT flow, multi-tenant scoping, marketplace SSO mechanism.
5. **Establish development schedule** — map the delivery recommendation to a sprint plan with the academic timeline.
6. **Define testing strategy** — unit tests for AI models, integration tests for workflows, UI tests for role-based screens.
7. **Plan demo data** — synthetic insurance data for tenants, policies, claims, documents.
8. **Begin implementation** — starting with Phase 1 Part A (multi-tenant core, policy management, claims, underwriting, admin, billing).

---

## 24. Evidence Index

| Document | Short Reference | Key Content Areas |
|---|---|---|
| `docs1/InsureIQ_Expanded_Requirements.pdf` | [Expanded Req] | Four-phase roadmap, gap analysis, all requirements, revenue model, delivery recommendation |
| `docs1/InsureIQ_Two_Phase_Requirements.pdf` | [Two-Phase Req] | Two-phase restructuring of same content, current preferred structure |
| `docs1/InsureIQ_Feasibility_Study.pdf` | [Feasibility] | 6-dimension feasibility analysis, IRDAI constraints, delivery recommendation |
| `docs1/InsureIQ_Requirement_Gathering.pdf` | [Req Gathering] | Modules, user roles, academic context, domain questionnaire with industry contact |
| `docs1/InsureIQ_Project_Synopsis.pdf` | [Synopsis] | Academic synopsis format, existing system, proposed system, tech stack with rationale |
| `docs1/InsureIQ_UML_Diagrams.pdf` | [UML] | 8 UML diagrams (use case, sequence, state chart, activity, class, object, component, deployment) |
| `docs1/InsureIQ_Litrature_Review.pdf` | [Lit Review] | 11-section literature review, 15+ recent references, 4 research gaps |
| `docs1/ui-ux-designs.pdf` | [UI/UX] | Visual mockups (7 pages, mostly images) |
| `docs1/Diagrams` | [Diagrams Notes] | UML learning notes |
| `docs1/notes b2b-b2c` | [B2B-B2C Notes] | Empty file (placeholder) |
| `docs1/feasibility study-format` | [Feas Format] | Generic feasibility study textbook material |
| `docs1/feasibility-types-requirement` | [Feas Types] | SaaS-specific feasibility framework |
| `docs1/requirement-gathering` | [Req Template] | Blank requirement gathering template |
| `docs1/feasibility study  example` | [Feas Example] | Serenity Styles feasibility study (reference) |
| `docs1/Project Synopsis Example` | [Synopsis Example] | Serenity Styles project synopsis (reference) |

---

*This document was generated by analyzing all 26 files in `docs1/` following the methodology specified in `proj_docs/PROJECT_CONTEXT_EVOLUTION_PROMPT.md`. Every supported file was inspected. Filesystem dates, internal document dates, and content-based chronological clues were used to reconstruct the evolution. No new requirements were invented. All conclusions are traceable to source documents as indicated by [Source] references.*

### Final Validation Checklist

- [x] Every supported file in `docs1/` was inspected.
- [x] Every file has an inventory entry.
- [x] Dates were collected where available.
- [x] Document chronology was reconstructed.
- [x] Important requirements were extracted.
- [x] Actors were reconstructed.
- [x] Workflows were reconstructed.
- [x] UI/page context was reconstructed.
- [x] Architecture was reconstructed.
- [x] Data/schema concepts were reconstructed.
- [x] Document relationships were analyzed.
- [x] Contradictions were identified.
- [x] Terminology evolution was analyzed.
- [x] Facts and inferences were separated.
- [x] Current project understanding was established.
- [x] Knowledge gaps were identified.
- [x] Completed vs unresolved work was identified.
- [x] Source-of-truth hierarchy was established.
- [x] Evidence references were included.
- [x] No unsupported requirements were invented.
- [x] The result can be used as context by another expert agent without reopening every source document.
