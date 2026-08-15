<div align="center">

# 🛡️ InsureIQ

### AI-Powered Hybrid B2B–B2C Insurance Intelligence Platform

[![Status](https://img.shields.io/badge/Status-In%20Development-blue?style=for-the-badge)](#project-status)
[![License](https://img.shields.io/badge/License-Academic-green?style=for-the-badge)](#license)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](#tech-stack)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](#tech-stack)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](#tech-stack)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](#tech-stack)

**A multi-tenant SaaS platform that replaces manual underwriting, static actuarial pricing, and rule-based claims verification with explainable AI — while giving individual customers a neutral marketplace to compare, buy, and manage insurance across providers.**

---

*MCA Mini-Project (24MCAR295) · Amal Jyothi College of Engineering (Autonomous)*
*Department of Computer Applications*

**Developer:** Jobin James (AJC25MCA-2039)
**Guide:** Lisha Varghese, Assistant Professor / Scrum Master

</div>

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Solution Overview](#-solution-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [User Roles](#-user-roles)
- [Two-Phase Roadmap](#-two-phase-roadmap)
- [AI/ML Modules](#-aiml-modules)
- [Revenue Model](#-revenue-model)
- [Project Structure](#-project-structure)
- [UI Screens](#-ui-screens)
- [Database Design](#-database-design)
- [Getting Started](#-getting-started)
- [Project Status](#-project-status)
- [Documentation](#-documentation)
- [License](#-license)

---

## 🎯 Problem Statement

The insurance industry suffers from deeply entrenched inefficiencies on both the **insurer** and **customer** sides:

| Problem Area | Current State | Impact |
|---|---|---|
| **Underwriting** | Manual review using static actuarial tables and individual judgement | Days-long turnaround; inconsistent pricing across underwriters |
| **Fraud Detection** | Adjuster experience + a few static rules (e.g., claim > ₹X) | Subtle fraud patterns missed; two adjusters can disagree on the same claim |
| **Document Processing** | Staff manually read scanned PDFs and re-type fields into the system | Slow, error-prone; transcription mistakes surface only during audits |
| **Customer Retention** | No early-warning system; lapses noticed only after renewal dates pass | At-risk customers silently churn |
| **Customer Experience** | Each insurer operates a siloed portal; no cross-insurer comparison | Customers must register, KYC, and upload documents separately per insurer |

> *"Claims processing delay was ranked as the highest priority to solve first, since it has the most direct and visible effect on customer satisfaction and repeat business."*
> — Domain expert interview (Requirement Gathering, Q10)

---

## 💡 Solution Overview

InsureIQ addresses both sides of the insurance lifecycle through a **hybrid B2B–B2C architecture**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        InsureIQ Platform                            │
│                                                                     │
│  ┌─────────────────────────┐    ┌─────────────────────────────────┐ │
│  │     B2B Side            │    │         B2C Side                │ │
│  │  (Insurer Operating     │    │   (Customer Marketplace)        │ │
│  │       System)           │    │                                 │ │
│  │                         │    │  ┌───────────────────────────┐  │ │
│  │  ┌───────┐ ┌───────┐   │    │  │  Neutral Comparison       │  │ │
│  │  │Tenant │ │Tenant │   │    │  │  Portal (insureiq.com)    │  │ │
│  │  │ ABC   │ │ XYZ   │   │    │  │                           │  │ │
│  │  │Insur. │ │Insur. │   │    │  │  • Compare across tenants │  │ │
│  │  └───┬───┘ └───┬───┘   │    │  │  • Single KYC             │  │ │
│  │      │         │        │    │  │  • Unified dashboard      │  │ │
│  │      └────┬────┘        │    │  └─────────┬─────────────────┘  │ │
│  │           │             │    │             │                    │ │
│  │     ┌─────▼─────┐      │    │    ┌────────▼────────┐          │ │
│  │     │  Shared    │◄─────┼────┼────│  Application    │          │ │
│  │     │  AI/ML     │      │    │    │  Routing Engine │          │ │
│  │     │  Models    │      │    │    └─────────────────┘          │ │
│  │     └───────────┘      │    │                                  │ │
│  └─────────────────────────┘    └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

**B2B** — Each insurer subscribes as an isolated tenant with its own branded portal, employees, data, and AI models. Customers of ABC Insurance never see the InsureIQ brand.

**B2C** — A neutral, insurer-agnostic marketplace (modelled on [Policybazaar](https://www.policybazaar.com/), [Compare the Market](https://www.comparethemarket.com/), [Insurify](https://insurify.com/)) where customers compare products, apply once, and track everything from one dashboard.

---

## ✨ Key Features

### 🏢 B2B Platform (Per-Tenant)

| Feature | Description |
|---|---|
| **Multi-Tenant Architecture** | Schema-per-tenant or DB-per-tenant isolation; branded subdomains; per-tenant configuration |
| **Policy Management** | Full lifecycle — browse, apply, issue, renew, lapse tracking |
| **Claims Processing** | Intake → document verification → fraud check → settlement, with SLA tracking |
| **Underwriting Workflow** | AI-computed risk scores with SHAP explanations; approve/reject/refer decisions |
| **Role-Based Dashboards** | Tailored interfaces for Customer, Agent, Underwriter, Claims Adjuster, Administrator |
| **Billing & Subscriptions** | Tiered SaaS plans, usage metering, feature-tier gating, invoicing |
| **Super-Admin Console** | Cross-tenant provisioning, platform health monitoring, billing management |

### 🛒 B2C Marketplace

| Feature | Description |
|---|---|
| **Product Comparison** | Side-by-side across insurers — premium, coverage, add-ons, claim settlement ratio |
| **Quote Fan-Out** | Single form → parallel API requests to all relevant tenant risk engines |
| **Application Routing** | Selected insurer receives the application as a normal "New Application" |
| **Unified Dashboard** | "My Insurance" view across all policies/claims, regardless of insurer |
| **Document Vault** | Upload KYC and documents once; reuse across every application |

### 🤖 AI/ML Intelligence

| Module | Technology | Output |
|---|---|---|
| **Risk Scoring & Premium Prediction** | XGBoost / LightGBM + SHAP | Score (0–100) + feature-importance breakdown |
| **Claims Fraud Detection** | Anomaly detection + classification + SHAP | Fraud flags with per-factor explanation |
| **Document Processing** | Tesseract OCR + Hugging Face NLP | Auto-extracted fields from claim forms, medical reports |
| **Churn Prediction & Retention** | Classification model + agent alerts | Churn probability per policyholder + retention dashboard |

---

## 🏗️ System Architecture

```
                    ┌──────────────┐
                    │   Clients    │
                    │ (Browser)    │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ Load Balancer│
                    │ / API Gateway│
                    └──────┬───────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
     ┌──────▼──────┐ ┌────▼────┐  ┌──────▼──────┐
     │   Tenant    │ │Marketplace│ │  Billing    │
     │   Portal    │ │ Service  │  │  Service    │
     │  Service    │ │          │  │             │
     └──────┬──────┘ └────┬────┘  └──────┬──────┘
            │              │              │
     ┌──────▼──────┐       │              │
     │Underwriting │       │              │
     │  & Claims   │       │              │
     │  Service    │       │              │
     └──────┬──────┘       │              │
            │              │              │
     ┌──────▼──────────────▼──────────────▼──────┐
     │              AI Model Service              │
     │  (Risk · Fraud · OCR/NLP · Churn · Advisor)│
     └──────────────────┬─────────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
   ┌──────▼──────┐ ┌───▼────┐ ┌─────▼──────┐
   │ PostgreSQL  │ │ Redis  │ │  Object    │
   │ + pgvector  │ │ Cache  │ │  Storage   │
   │             │ │        │ │ (S3/equiv.)│
   └─────────────┘ └────────┘ └────────────┘
```

### Component Breakdown

| Component | Responsibility |
|---|---|
| **Tenant Portal Service** | Per-tenant branded frontend + API; role-based UI |
| **Underwriting & Claims Service** | Application review, claims processing, settlement workflows |
| **Marketplace Service** | Cross-tenant product catalog, comparison, quote fan-out, lead routing |
| **Billing Service** | Subscription management, usage metering, invoicing, commission ledger |
| **AI Model Service** | ML inference for risk, fraud, churn; OCR/NLP pipeline; RAG advisor |
| **Notification Service** | Email/alerts for renewals, claim status, retention alerts |

---

## 🛠️ Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| **React.js 18+** | Component-based UI framework |
| **Tailwind CSS** | Utility-first styling |
| **Chart.js / Recharts** | Analytics dashboards, KPI visualization |

### Backend

| Technology | Purpose |
|---|---|
| **FastAPI (Python)** | High-performance async REST API framework with auto-docs |
| **Pydantic** | Request/response validation and serialization |
| **JWT** | Stateless authentication across tenants |

### Database & Storage

| Technology | Purpose |
|---|---|
| **PostgreSQL 16+** | Primary relational database with schema-per-tenant isolation |
| **pgvector** | Vector embeddings for RAG-based policy assistant and AI advisor |
| **Redis** | Caching, session management, rate limiting |
| **AWS S3 / equivalent** | Document and file storage |

### AI/ML

| Technology | Purpose |
|---|---|
| **XGBoost / LightGBM** | Gradient-boosted trees for risk scoring, fraud detection, churn prediction |
| **scikit-learn** | Feature engineering, preprocessing, model evaluation |
| **SHAP** | Explainable AI — per-feature contribution breakdowns |
| **PyTorch** | Deep learning components |
| **Hugging Face Transformers** | NLP for document understanding and conversational AI |
| **Sentence-BERT** | Semantic embeddings for retrieval-augmented generation |
| **Tesseract OCR** | Optical character recognition for claim documents |
| **FAISS / pgvector** | Vector similarity search for policy Q&A and recommendations |

### DevOps

| Technology | Purpose |
|---|---|
| **Docker** | Containerization |
| **GitHub Actions** | CI/CD pipeline |

---

## 👥 User Roles

InsureIQ serves **7 distinct user roles** across the B2B and B2C sides:

### B2B Roles (within a tenant boundary)

```
┌──────────────────────────────────────────────────────────────────┐
│                     Tenant (e.g., ABC Insurance)                 │
│                                                                  │
│  👤 Customer ──► Browse → Apply → Upload → Track Claims          │
│                                                                  │
│  🧑‍💼 Agent ──► Manage portfolios → Submit on behalf → Retention │
│                                                                  │
│  📊 Underwriter ──► Review risk scores → Approve/Reject/Refer   │
│                                                                  │
│  🔍 Claims Adjuster ──► Investigate fraud flags → Settle claims  │
│                                                                  │
│  ⚙️ Administrator ──► Configure tenant → Manage users → Audit   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

🔧 Super-Admin ──► Provision tenants → Monitor platform → Billing
   (InsureIQ platform-level, outside any single tenant)
```

### B2C Role

```
🛒 Marketplace Customer ──► Compare across insurers → Apply once
                            → Unified dashboard → Document vault
```

---

## 🗺️ Two-Phase Roadmap

The project follows a **two-phase, two-part** delivery structure:

### Phase 1 — Foundation Platform (Non-AI)

| Part | Scope | Delivery |
|---|---|---|
| **Part A (B2B)** | Multi-tenant core, policy management, claims intake, underwriting workflow, billing, admin dashboards | ✅ **Primary deliverable — fully implemented** |
| **Part B (B2C)** | Marketplace comparison, quote fan-out, application routing, unified dashboard | 📝 Researched extension — partially prototyped |

### Phase 2 — AI Intelligence Layer

| Part | Scope | Delivery |
|---|---|---|
| **Part A (B2B)** | Risk scoring, fraud detection, OCR/NLP document processing, churn prediction | ✅ **Primary deliverable — fully implemented** |
| **Part B (B2C)** | Conversational AI advisor, cross-tenant recommendations, Universal Risk Score, shared fraud intelligence | 📝 Researched extension — simulated |

> **Delivery Strategy:** Part A of both phases is the graded academic core — fully built and demonstrated. Part B is documented to the same depth and partially prototyped, but explicitly not presented as production-ready (IRDAI licensing and full regulatory compliance are out of scope for an academic project).

---

## 🤖 AI/ML Modules

### Module 1 — Risk Scoring & Premium Prediction

```
Applicant Data → Feature Engineering → XGBoost/LightGBM → Risk Score (0-100)
                                                              │
                                                    SHAP Explanation
                                                    (which factors drove
                                                     the score and why)
                                                              │
                                                    Underwriter Review
```

- **Input:** Applicant demographics, asset details, location, claims history
- **Output:** Risk score (0–100) + premium recommendation + per-feature importance
- **Explainability:** SHAP waterfall chart showing each factor's contribution

### Module 2 — Claims Fraud Detection

```
Claim Data → Anomaly Detection + Classification → Fraud Risk Level
                                                        │
                                               SHAP Explanation
                                               (claim timing, amount,
                                                claimant history...)
                                                        │
                                              Claims Adjuster Review
```

- **Input:** Claim amount, timing, policyholder history, document consistency
- **Output:** Fraud flag (Low / Medium / High) with per-factor explanation
- **Key Insight:** Catches slow-building fraud patterns that static rules miss

### Module 3 — Document Processing (OCR/NLP)

```
Scanned PDF/Photo → Tesseract OCR → Text Extraction → HF NLP → Structured Data
                                                                     │
                                                          Auto-populated
                                                          claim fields
```

- **Input:** Claim forms, medical reports, repair estimates, accident photos
- **Output:** Extracted entities (dates, amounts, diagnosis codes, damage codes)
- **Impact:** Reduces processing time by up to 80% and transcription errors by 90% (literature benchmark)

### Module 4 — Churn Prediction & Retention

```
Policyholder Behavior → Classification Model → Churn Probability
                                                      │
                                            Agent Retention Alert
                                            + At-risk Dashboard
```

- **Input:** Payment history, claim frequency, service interactions, policy tenure
- **Output:** Churn probability per policyholder, ranked by risk

---

## 💰 Revenue Model

### B2B Revenue (Primary)

| Model | Mechanism | Phase |
|---|---|---|
| SaaS Subscription | Tiered monthly/annual plans by insurer size | Phase 1 |
| Per-Policy Fee | Fixed fee per policy issued through the platform | Phase 1 |
| Per-Claim Fee | Fixed fee per claim processed | Phase 1 |
| AI Premium Features | Base platform (free) vs paid AI tiers (risk, fraud, OCR, churn) | Phase 2 |

### B2C Revenue (Secondary)

| Model | Mechanism | Phase |
|---|---|---|
| Commission on Sale | % of premium paid by insurer when customer buys via marketplace | Phase 1 Part B |
| Lead Generation | Insurers pay for qualified quote requests routed to them | Phase 1 Part B |
| Featured Placement | Paid visibility with mandatory transparency labeling | Phase 1 Part B |
| Value-Added Services | Document storage, renewal concierge, financial planning | Phase 1/2 Part B |

> The customer **does not pay** to use the marketplace — the same principle real aggregators operate on.

---

## 📁 Project Structure

```
Insure-IQ/
│
├── README.md                    # This file
├── .gitignore                   # Git ignore rules
├── manifest.json                # Project manifest
│
├── docs/                        # Design & specification documents
│   ├── 01_InsureIQ_UI_EndCustomer.md         # End-customer UI spec
│   ├── 02_InsureIQ_UI_Agent.md               # Agent UI spec
│   ├── 03_InsureIQ_UI_Underwriter.md         # Underwriter UI spec
│   ├── 04_InsureIQ_UI_ClaimsAdjuster.md      # Claims adjuster UI spec
│   ├── 05_InsureIQ_UI_TenantAdministrator.md # Tenant admin UI spec
│   ├── 06_InsureIQ_UI_SuperAdmin.md          # Super-admin UI spec
│   ├── 07_InsureIQ_UI_MarketplaceCustomer.md # Marketplace customer UI spec
│   ├── InsureIQ_Software_Design.md           # Software design document
│   ├── InsureIQ_UI_Design.md                 # UI design system
│   └── InsureIQ_UX_Gap_Analysis_Checklist.md # UX gap analysis
│
├── docs1/                       # Academic & research documents
│   ├── InsureIQ_Expanded_Requirements.pdf    # Full requirements (4-phase)
│   ├── InsureIQ_Two_Phase_Requirements.pdf   # Requirements (2-phase, current)
│   ├── InsureIQ_Project_Synopsis.pdf         # Academic synopsis
│   ├── InsureIQ_Requirement_Gathering.pdf    # Domain research & questionnaire
│   ├── InsureIQ_Feasibility_Study.pdf        # 6-dimension feasibility analysis
│   ├── InsureIQ_Litrature_Review.pdf         # Academic literature review
│   ├── InsureIQ_UML_Diagrams.pdf             # 8 UML diagrams
│   └── ui-ux-designs.pdf                     # UI/UX visual mockups
│
├── proj_docs/                   # Project context & evolution
│   ├── PROJECT_CONTEXT_EVOLUTION.md          # Full project reconstruction
│   └── PROJECT_CONTEXT_EVOLUTION_PROMPT.md   # Reconstruction methodology
│
├── screens/                     # 50 HTML screen prototypes
│   ├── End-Customer_Home_*.html              # Customer-facing screens
│   ├── Agent_Dashboard_*.html                # Agent workspace screens
│   ├── Underwriter_Dashboard_*.html          # Underwriter screens
│   ├── Claims_Adjuster_Workspace_*.html      # Claims adjuster screens
│   ├── Tenant_Administrator_*.html           # Admin screens
│   ├── Super-Admin_Platform_Console_*.html   # Platform management screens
│   └── InsureIQ_Marketplace_*.html           # B2C marketplace screens
│
└── schemadocs/                  # Database schema documentation
    ├── modules and tables list               # Full module/table inventory
    ├── schema design chat                    # Schema design discussions
    ├── schema_list                           # Schema listing
    └── module1/                              # Per-module schema details
```

---

## 🖥️ UI Screens

**50 responsive HTML prototypes** have been designed across all 7 user roles:

### Customer (Tenant End-User)
- Home Dashboard · Sign-up & KYC · Browse & Apply · Policy Detail · Application Status · File a Claim · Claim Tracker · Billing & Invoices

### Agent
- Agent Dashboard · Customer Portfolio · Customer Detail · Commission Tracker · Retention Alerts · Profile Settings

### Underwriter
- Underwriter Dashboard · Application Detail (with Risk Score) · Decision History · Model Performance

### Claims Adjuster
- Claims Dashboard · Claims Workspace · Investigation View · SLA Tracker

### Tenant Administrator
- Admin Dashboard · Team Management · Policy Configuration · Billing & Invoices

### Super-Admin (Platform)
- Platform Console · Tenant Directory · Provision New Tenant

### Marketplace Customer (B2C)
- Marketplace Home · Get a Quote · Compare Quotes · Plan Details

> All screens include **desktop and mobile** variants.

---

## 🗄️ Database Design

### Core Entities

```
┌──────────┐    ┌──────────┐    ┌──────────────┐    ┌────────────┐
│  Tenant  │───►│   User   │───►│ Application  │───►│ RiskScore  │
│          │    │          │    │              │    │            │
│ • name   │    │ • role   │    │ • status     │    │ • score    │
│ • brand  │    │ • tenant │    │ • policy_type│    │ • features │
│ • config │    │ • KYC    │    │ • documents  │    │ • SHAP     │
└──────────┘    └──────┬───┘    └──────────────┘    └────────────┘
                       │
                       ▼
                ┌──────────┐    ┌──────────────┐    ┌────────────┐
                │  Policy  │───►│    Claim      │───►│ FraudFlag  │
                │          │    │              │    │            │
                │ • type   │    │ • amount     │    │ • risk     │
                │ • premium│    │ • status     │    │ • SHAP     │
                │ • dates  │    │ • documents  │    │ • explain  │
                └──────────┘    └──────────────┘    └────────────┘

┌──────────────┐    ┌──────────────┐    ┌─────────────────┐
│  ChurnScore  │    │   Billing    │    │ MarketplaceLead │
│              │    │              │    │                 │
│ • probability│    │ • tenant     │    │ • user          │
│ • factors    │    │ • amount     │    │ • tenant        │
│ • model ver. │    │ • status     │    │ • quote_request │
└──────────────┘    └──────────────┘    └─────────────────┘
```

### Data Isolation

- **Schema-per-tenant** (default) or **database-per-tenant** (compliance-sensitive)
- Each tenant's data is completely isolated; cross-tenant queries only via Super-Admin console
- Marketplace uses a read-model synced from tenant data, never direct tenant DB access

---

## 🚀 Getting Started

> ⚠️ **Project is in active development.** Setup instructions will be updated as the codebase matures.

### Prerequisites

| Requirement | Version |
|---|---|
| Python | 3.11+ |
| Node.js | 18+ |
| PostgreSQL | 16+ (with pgvector extension) |
| Redis | 7+ |
| Docker | 24+ |

### Hardware Requirements

| Component | Minimum | Recommended |
|---|---|---|
| Processor | Intel i5 / Ryzen 5 | Intel i7 / Ryzen 7 |
| RAM | 8 GB | 16 GB (for local model training) |
| Storage | 256 GB SSD | 512 GB SSD |

### Quick Start (coming soon)

```bash
# Clone the repository
git clone https://github.com/jobinjames-1234/Insure-IQ.git
cd Insure-IQ

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend setup
cd frontend
npm install
npm run dev
```

---

## 📊 Project Status

| Area | Status |
|---|---|
| Requirements & Gap Analysis | ✅ Complete |
| Feasibility Study (6 dimensions) | ✅ Complete |
| Literature Review (15+ references) | ✅ Complete |
| UML Diagrams (8 types) | ✅ Complete |
| UI/UX Prototypes (50 screens) | ✅ Complete |
| Per-Role UI Specifications (7 roles) | ✅ Complete |
| Database Schema Design | ✅ Complete |
| Software Design Document | ✅ Complete |
| Project Context Reconstruction | ✅ Complete |
| Backend Implementation | 🔄 In Progress |
| Frontend Implementation | 🔄 In Progress |
| AI/ML Model Training | ⏳ Upcoming |
| Integration Testing | ⏳ Upcoming |
| Deployment | ⏳ Upcoming |

---

## 📚 Documentation

### Academic Documents (`docs1/`)

| Document | Pages | Description |
|---|---|---|
| **Expanded Requirements** | 15 | Full requirements with gap analysis and four-phase roadmap |
| **Two-Phase Requirements** | 11 | Restructured requirements (current preferred structure) |
| **Project Synopsis** | 9 | Academic synopsis — overview, existing system, proposed system |
| **Requirement Gathering** | 5 | Modules, roles, domain questionnaire with industry contact |
| **Feasibility Study** | 6 | Technical, economic, operational, legal, schedule, market feasibility |
| **Literature Review** | 11 | 9 research areas, 15+ recent (2025–2026) references, 4 research gaps |
| **UML Diagrams** | 9 | Use case, sequence, state chart, activity, class, object, component, deployment |
| **UI/UX Designs** | 7 | Visual mockups across all user roles |

### Design Documents (`docs/`)

| Document | Description |
|---|---|
| **InsureIQ_Software_Design.md** | Complete software design document |
| **InsureIQ_UI_Design.md** | UI design system and patterns |
| **Per-role UI specs (7 files)** | Detailed screen specifications for each user role |
| **UX Gap Analysis Checklist** | Identified UX gaps and remediation plan |

### Project Context (`proj_docs/`)

| Document | Description |
|---|---|
| **PROJECT_CONTEXT_EVOLUTION.md** | Full chronological reconstruction of project evolution (24 sections, 1000+ lines) |

---

## 🔬 Research Contribution

InsureIQ addresses the **integration gap** identified in the literature review:

> *"While substantial research exists on individual AI applications in insurance — risk scoring, fraud detection, document processing, churn prediction, and conversational AI — few studies address the integration of these capabilities into unified platforms."*

The project uniquely combines:
1. **Multi-tenant SaaS architecture** with per-tenant AI model isolation
2. **Explainable AI** (SHAP) across all four ML modules — not just accuracy, but auditability
3. **Cross-insurer marketplace** integrated with tenant AI infrastructure
4. **End-to-end insurance lifecycle** coverage in a single platform

---

## ⚖️ Regulatory & Compliance Context

| Regulation | Status in Project |
|---|---|
| IRDAI Web Aggregator Regulations, 2017 | Documented; explicitly scoped as simulation (₹25L capital, licensing requirements not applicable to academic project) |
| Digital Personal Data Protection Act (India) | Addressed architecturally (per-tenant isolation, consent framework); full compliance out of academic scope |
| HIPAA-equivalent (health data) | Acknowledged as boundary; not implemented |

> The B2C marketplace is framed as a **demonstration of the aggregator model**, not a system intended for live regulated operation.

---

## 📄 License

This project is developed as an **academic mini-project** for the MCA programme at Amal Jyothi College of Engineering. The prototype and source code are owned by the student developer for academic evaluation purposes. There is no commercial entity currently associated with the system.

---

<div align="center">

**Built with ❤️ for the insurance industry**

*InsureIQ — Making insurance transparent, explainable, and accessible.*

</div>
