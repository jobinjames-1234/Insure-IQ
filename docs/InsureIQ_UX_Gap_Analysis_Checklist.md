# InsureIQ UX Gap Analysis & Implementation Checklist

## Status Legend
- ✅ **Complete**: Screen exists and covers documented requirements.
- 🟡 **Partially Implemented**: Screen exists but missing critical actions or sub-flows.
- ❌ **Missing**: Documented page or mandatory enterprise workflow page is absent.

---

## 1. End-Customer (Tenant Policyholder)
- ✅ **Home / My Policies** ({{DATA:SCREEN:SCREEN_12}})
- ✅ **Apply Flow** ({{DATA:SCREEN:SCREEN_10}})
- ✅ **Claim Tracker** ({{DATA:SCREEN:SCREEN_11}})
- ❌ **Sign up / KYC** (Step-by-step identity verification)
- ❌ **Browse & Apply** (Category gallery for starting new apps)
- ❌ **Application Status** (List of pending applications)
- ❌ **File a Claim** (Intake flow/form)
- ❌ **Policy Detail** (Deep dive into terms, premium history)
- ❌ **Profile & Documents** (Account settings and vault)

## 2. Agent
- ✅ **Dashboard** ({{DATA:SCREEN:SCREEN_9}})
- ❌ **Customer Portfolio** (Searchable/filterable table of assigned customers)
- ❌ **Customer Detail** (CRM-style view for one person)
- ❌ **Retention Alerts** (Dedicated worklist for at-risk churn)
- ❌ **Commission Tracker** (Detailed earnings breakdown)

## 3. Underwriter
- ✅ **Dashboard Queue** ({{DATA:SCREEN:SCREEN_8}})
- ❌ **Application Detail** (Decision-making pane + risk breakdown)
- ❌ **Decision History** (Audit view of past actions)
- ❌ **Model Performance** (AI sanity check view)

## 4. Claims Adjuster
- ✅ **Workspace / Detail** ({{DATA:SCREEN:SCREEN_7}})
- ❌ **Claims Dashboard** (High-level queue and metrics)
- ❌ **Investigation View** (Slow-lane deep-dive for fraud cases)
- ❌ **SLA Tracker** (Time-based triage view)

## 5. Tenant Administrator
- ✅ **Admin Dashboard** ({{DATA:SCREEN:SCREEN_6}})
- ❌ **Team / User Management** (Role assignment and invites)
- ❌ **Policy Configuration** (Underwriting rules and premium bands)
- ❌ **AI Settings** (Feature gating and model monitoring)
- ❌ **Billing & Invoices** (Usage metering and payment history)
- ❌ **Audit Log** (Platform-wide decision history)

## 6. Super-Admin (Platform Console)
- ✅ **Platform Overview** ({{DATA:SCREEN:SCREEN_5}})
- ❌ **Tenant Directory** (List of all insurers on platform)
- ❌ **Tenant Provisioning Wizard** (Infrastructure creation flow)
- ❌ **Billing Oversight** (Aggregate MRR and commission totals)
- ❌ **Model Registry** (Platform-wide drift monitoring)

## 7. Marketplace Customer (B2C)
- ✅ **Comparison Results** ({{DATA:SCREEN:SCREEN_3}})
- ❌ **Home / Landing** (Entry point "What are you insuring?")
- ❌ **Quote Request Form** (Short intake form)
- ❌ **Plan Detail** (Plan-specific terms and add-ons)
- ❌ **My Insurance** (Unified cross-tenant dashboard)
- ❌ **Document Vault** (Portable identity storage)
- ❌ **Consent Center** (Data sharing permissions)

---

## Next Steps:
I will begin generating these missing pages in logical workflow batches, starting with the **End-Customer KYC and Browse/Apply** flows to complete the onboarding and purchase journey.