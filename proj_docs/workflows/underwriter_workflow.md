# Workflow Specification: Underwriter

## 1. Role Overview
- **Role**: `underwriter`
- **Purpose**: Evaluates risk and approves or rejects customer insurance applications within their Tenant.
- **Authorization Level**: Has access to all applications across the tenant.

## 2. Authentication
- **Login**: `POST /api/v1/auth/login`
- **Role Resolution**: Handled via JWT claims for `underwriter`.
- **Redirect**: Sent to `/b2b` which loads `UnderwriterDashboardPage.tsx`.

## 3. Permission Model

### 3.1 Allowed
- `GET /api/v1/underwriting/queue` - View pending applications.
- `GET /api/v1/applications/{id}` - View application details and attached documents.
- `PUT /api/v1/underwriting/applications/{id}/decide` - Submit an approval or rejection.

### 3.2 Forbidden
- Changing Tenant configuration (`/admin/*`).
- Approving claims (`/claims/*`).

## 4. Navigation (Frontend)
Located within `B2BShell`:
- `/b2b` (Dashboard) -> `UnderwriterDashboardPage.tsx`
- `/b2b/applications/:id` -> `ApplicationDetailPage.tsx`
- `/b2b/decisions` -> `DecisionHistoryPage.tsx`

## 5. Page Workflows

### 5.1 Underwriter Dashboard (`UnderwriterDashboardPage.tsx`)
- **Data/APIs**: `GET /api/v1/underwriting/queue` (Fetches applications in `submitted` or `under_review` state).
- **Actions**: Click into an application to review it.

### 5.2 Application Detail (`ApplicationDetailPage.tsx`)
- **Entry**: Clicking an application from the queue.
- **Data/APIs**: `GET /api/v1/applications/{id}`.
- **AI Integration**: Displays `risk_scores` associated with the application (e.g., XGBoost risk predictions).
- **Actions**: "Approve" or "Reject".
- **Backend Logic**: When approved via `PUT /api/v1/underwriting/applications/{id}/decide`, the backend automatically generates an active `Policy` record and updates the Application state machine to `approved`.

## 6. Entity Interaction
- **Applications**: `READ`, `UPDATE` (status).
- **Policies**: `CREATE` (indirectly via approval).

## 7. Complete End-to-End Journey
1. Logs in -> `UnderwriterDashboardPage.tsx`.
2. Sees 5 pending applications in the queue.
3. Clicks first application -> `ApplicationDetailPage.tsx`.
4. Reviews attached documents and AI risk score.
5. Clicks "Approve" -> Policy is created.
6. Returns to dashboard to process the next one.

## 8. Remaining Implementation
- **Status**: IMPLEMENTED.

## 9. Implementation Dependencies
- Depends on `customer` or `agent` generating Applications.
- Relies on AI models generating `risk_scores` for decision support.

## 10. Validation
Verify by logging in as `uw1@abc.com`, opening a pending application, and clicking approve.
