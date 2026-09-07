# Workflow Specification: Agent

## 1. Role Overview
- **Role**: `agent`
- **Purpose**: Sales representative/broker operating within a Tenant. Sells policies to customers and tracks commissions.
- **Authorization Level**: Has access to their assigned customer portfolio within the Tenant. Cannot alter global tenant settings.

## 2. Authentication
- **Login**: `POST /api/v1/auth/login`
- **Role Resolution**: Handled via JWT claims for `agent`.
- **Redirect**: Sent to `/b2b` which loads `AgentDashboardPage.tsx`.

## 3. Permission Model

### 3.1 Allowed
- `GET /api/v1/agent/customers` - View assigned customers.
- `GET /api/v1/agent/customers/{id}` - View specific customer details.
- `POST /api/v1/agent/applications` - Submit an application on behalf of a customer.
- `GET /api/v1/agent/commission` - Track earned commissions.
- `GET /api/v1/agent/retention-alerts` - View ML-generated churn risks.

### 3.2 Forbidden
- Changing Tenant configuration (`/admin/*`).
- Approving policies (`/underwriting/*`).
- Approving claims (`/claims/*` except viewing).

## 4. Navigation (Frontend)
Located within `B2BShell` under the `/b2b/agent` prefix:
- `/b2b/agent` -> `AgentDashboardPage.tsx`
- `/b2b/agent/customers/:id` -> `CustomerDetailPage.tsx` (customer list page does NOT exist)
- `/b2b/agent/commission` -> `CommissionTrackerPage.tsx`

> [!WARNING]
> **Missing Pages**: Two pages have no routes and no component files:
> - Customer Portfolio List (`CustomerPortfolioPage.tsx`) — **does not exist**. Only individual customer detail is accessible via direct URL.
> - Retention Alerts (`RetentionAlertsPage.tsx`) — file exists but **has no router entry**. Backend API `GET /agent/retention-alerts` is implemented but has no frontend consumer.

## 5. Page Workflows

### 5.1 Agent Dashboard (`AgentDashboardPage.tsx`)
- **Data/APIs**: Loads high-level KPIs, upcoming renewals, and churn alerts.
- **Actions**: Quick link to "New Application".

### 5.2 Customer Detail (`CustomerDetailPage.tsx`)
- **Entry**: Clicking a customer from the portfolio.
- **Data/APIs**: `GET /api/v1/agent/customers/{id}`.
- **Actions**: "Submit on Behalf" button. Opens a modal or directs to a form similar to `BrowseAndApplyPage` but injected with the customer's ID.

### 5.3 Commission Tracker (`CommissionTrackerPage.tsx`)
- **Entry**: Sidebar navigation.
- **Data/APIs**: `GET /api/v1/agent/commission`.
- **Actions**: View tabular history of payouts and pending commissions based on bound policies.

## 6. Entity Interaction
- **Customers**: `READ` (Assigned only).
- **Applications**: `CREATE` (On behalf of customer), `READ`.
- **Policies**: `READ`.

## 7. Complete End-to-End Journey
1. Logs in -> `AgentDashboardPage.tsx`.
2. Reviews `RetentionAlertsPage.tsx` to see at-risk customers.
3. Contacts customer, opens `CustomerDetailPage.tsx`.
4. Uses "Submit Application" to bind a new policy on their behalf.
5. Monitors `CommissionTrackerPage.tsx` to verify payout.

## 8. Remaining Implementation
- **Status**: IMPLEMENTED.

## 9. Implementation Dependencies
- Depends on ML background jobs (`/ml/churn-predict`) to populate retention alerts.
- Depends on Underwriters to approve the applications they submit.

## 10. Validation
Verify by logging in as `agent1@abc.com`, navigating the B2B shell, and ensuring the portfolio loads.
