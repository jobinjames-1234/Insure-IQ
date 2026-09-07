# Subdomain Architecture Across Insure-IQ User Types

Based on the `InsureIQ_Software_Design.md` and related architecture documents in the repository, the software is structured as a **Multi-Tenant B2B–B2C Insurance Intelligence Platform**. 

The core of this multi-tenancy relies on **subdomains (e.g., `{tenant}.insureiq.app` or `xyz.insureiq.com`)** to isolate tenants (insurance companies) from each other. When a user navigates to a subdomain, the *Identity & Access* module resolves the tenant context from the URL and attaches the correct `tenant_id` to their session and all subsequent database writes.

Here is a study of how this subdomain structure applies to the **6 user types** in the system:

---

## 1. End Customer
**Domain Context:** Hybrid (Central Marketplace + Tenant Subdomain)

- **B2C Marketplace:** When shopping for insurance, comparing quotes, or managing a unified dashboard of all their policies across multiple insurers, the customer interacts with the global, tenant-agnostic domain (e.g., `marketplace.insureiq.com`).
- **B2B / B2B2C Interactions:** When a customer applies directly with a specific insurer (e.g., XYZ Insurance), they interact with that insurer's branded subdomain (e.g., `xyz.insureiq.com`). The frontend resolves the theme (logo, colors) for XYZ Insurance based on this subdomain.

## 2. Agent (B2B)
**Domain Context:** Tenant Subdomain (`xyz.insureiq.com`)

- Agents operate on behalf of a specific insurer (the tenant). 
- When an agent logs in, they do so via their employer's specific subdomain. The system uses this subdomain to enforce that the agent can only generate quotes, sell policies, and view leads that belong to XYZ Insurance. They are strictly bound to this tenant's isolated data.

## 3. Underwriter (B2B)
**Domain Context:** Tenant Subdomain (`xyz.insureiq.com`)

- Underwriters are employees of a specific insurance company evaluating risk and approving applications for that company alone.
- They log into the tenant's subdomain. The `tenant_id` resolved from the subdomain ensures that their work queues, risk scoring models (which can be fine-tuned per tenant), and approval workflows are strictly isolated to their insurer's data.

## 4. Claims Adjuster (B2B)
**Domain Context:** Tenant Subdomain (`xyz.insureiq.com`)

- Claims Adjusters process and settle claims for their specific insurance company.
- Similar to Underwriters, they access the platform via their tenant's subdomain. This context ensures they only see claims filed against policies issued by their employer. Any fraud flags or document intelligence models they use are scoped to this tenant's environment.

## 5. Tenant Administrator (B2B)
**Domain Context:** Tenant Subdomain (`xyz.insureiq.com`)

- The Tenant Admin is responsible for configuring the software for their specific insurance company (setting up policy types, coverage rules, premium bands, and managing employee roles).
- They manage everything entirely within their own tenant boundary via the subdomain. The software design explicitly states they have no visibility into other tenants' configurations, and this isolation is driven by the URL they access.

## 6. Super Admin (Platform Operator)
**Domain Context:** Global/Management Domain (e.g., `admin.insureiq.com`)

- The Super Admin works for Insure-IQ itself, not for any specific insurance company.
- They do **not** use the tenant subdomains. Instead, they access a distinct cross-tenant console (or management domain) to provision new tenants, assign subdomains to new insurers (e.g., creating `xyz.insureiq.com`), monitor platform health, and oversee billing across all tenants. 
- The architecture deliberately keeps this UI and domain separate from the tenant subdomains to guarantee a Super Admin bug never accidentally leaks one tenant's console to another.

---

### Summary of the Mechanism
1. **Provisioning:** Super Admin assigns the subdomain (`xyz`) to a tenant in the Global Domain.
2. **Resolution:** When a user (Customer, Agent, Underwriter, Adjuster, or Tenant Admin) visits `xyz.insureiq.com`, the frontend loads the branding for XYZ, and the API gateway attaches `tenant_id = XYZ` to their session.
3. **Data Isolation:** Every read and write to the database automatically includes this `tenant_id` (enforced via Postgres Row-Level Security), ensuring the user only interacts with their company's isolated slice of the platform.
