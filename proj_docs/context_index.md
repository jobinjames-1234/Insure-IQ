# Context Index

Welcome to the InsureIQ Developer Context documentation. If you are an AI assistant or human developer onboarding to this project, this directory is your single source of truth for understanding how the system operates, how data is secured, and how users move through the application.

> [!IMPORTANT]
> The source-of-truth hierarchy is:
> 1. Actual deployed code in `backend/` and `frontend/`.
> 2. This Context Index and associated workflow files.
> 3. Old `schemadocs/` or design mockups.

## System Contexts
These documents outline the technical and architectural boundaries of the application:
1. **[Architecture Context](file:///home/user/1Projects/Insure-IQ/proj_docs/contexts/architecture_context.md)**: Tech stack, Tenant Middleware, caching, and database interaction.
2. **[Domain & Data Model](file:///home/user/1Projects/Insure-IQ/proj_docs/contexts/domain_data_context.md)**: Core entities (Customers, Agents, Applications, Policies, Claims) and their relationships.
3. **[Authorization & Security](file:///home/user/1Projects/Insure-IQ/proj_docs/contexts/authorization_security_context.md)**: JWT mechanisms, role-based access control, and strict tenant-isolation logic.
4. **[API & Frontend](file:///home/user/1Projects/Insure-IQ/proj_docs/contexts/api_frontend_context.md)**: REST routing structure, Zustand state management, and Axios interceptors.

## User Workflows
The platform supports 7 distinct user personas. Their complete end-to-end journeys are documented below:
- **[Customer Workflow](file:///home/user/1Projects/Insure-IQ/proj_docs/workflows/customer_workflow.md)**: The end-user applying for policies and filing claims.
- **[Marketplace Customer Workflow](file:///home/user/1Projects/Insure-IQ/proj_docs/workflows/marketplace_customer_workflow.md)**: An unauthenticated user browsing for quotes.
- **[Agent Workflow](file:///home/user/1Projects/Insure-IQ/proj_docs/workflows/agent_workflow.md)**: The broker selling policies and monitoring their portfolio.
- **[Underwriter Workflow](file:///home/user/1Projects/Insure-IQ/proj_docs/workflows/underwriter_workflow.md)**: The risk assessor approving/rejecting applications.
- **[Claims Adjuster Workflow](file:///home/user/1Projects/Insure-IQ/proj_docs/workflows/claims_adjuster_workflow.md)**: The investigator deciding payouts.
- **[Tenant Admin Workflow](file:///home/user/1Projects/Insure-IQ/proj_docs/workflows/tenant_admin_workflow.md)**: The agency manager configuring products and staff.
- **[Super Admin Workflow](file:///home/user/1Projects/Insure-IQ/proj_docs/workflows/super_admin_workflow.md)**: The platform owner provisioning new tenants.

## Progress Tracking
For current sprint or phase status, always consult the **[Implementation Status](file:///home/user/1Projects/Insure-IQ/proj_docs/implementation_status.md)**.
