# Workflow Specification: Claims Adjuster

## 1. Role Overview
- **Role**: `adjuster`
- **Purpose**: Investigates and processes insurance claims made by customers within their Tenant.
- **Authorization Level**: Has access to all claims across the tenant.

## 2. Authentication
- **Login**: `POST /api/v1/auth/login`
- **Role Resolution**: Handled via JWT claims for `adjuster`.
- **Redirect**: Sent to `/b2b` which loads `ClaimsDashboardPage.tsx`.

## 3. Permission Model

### 3.1 Allowed
- `GET /api/v1/claims/queue` - View pending claims.
- `GET /api/v1/claims/{id}` - View claim details, documents, and policy info.
- `POST /api/v1/claims/{id}/notes` - Add internal investigation notes.
- `PUT /api/v1/claims/{id}/decide` - Submit an approval or denial.

### 3.2 Forbidden
- Changing Tenant configuration (`/admin/*`).
- Approving policies (`/underwriting/*`).

## 4. Navigation (Frontend)
Located within `B2BShell`:
- `/b2b` (Dashboard) -> `ClaimsDashboardPage.tsx`
- `/b2b/claims/:id` -> `ClaimsWorkspacePage.tsx`
- `/b2b/claims/:id/investigation` -> `InvestigationViewPage.tsx`
- `/b2b/sla-tracker` -> `SLATrackerPage.tsx`

## 5. Page Workflows

### 5.1 Claims Dashboard (`ClaimsDashboardPage.tsx`)
- **Data/APIs**: `GET /api/v1/claims/queue` (Fetches claims).
- **Actions**: Click into a claim to review it.

### 5.2 Claims Workspace (`ClaimsWorkspacePage.tsx`)
- **Entry**: Clicking a claim from the queue.
- **Data/APIs**: `GET /api/v1/claims/{id}`.
- **AI Integration**: Displays `fraud_flags` associated with the claim, and auto-extracted data from `claim_documents` via OCR/NER.
- **Actions**: Add notes, "Approve", or "Deny".
- **Backend Logic**: When approved via `PUT /api/v1/claims/{id}/decide`, the backend records the decision and triggers payout processes (mocked).

## 6. Entity Interaction
- **Claims**: `READ`, `UPDATE` (status).
- **Adjuster Notes**: `CREATE`, `READ`.
- **Policies**: `READ`.

## 7. Complete End-to-End Journey
1. Logs in -> `ClaimsDashboardPage.tsx`.
2. Selects a high-priority claim.
3. Views `ClaimsWorkspacePage.tsx`.
4. Reviews the AI fraud score (e.g., "High Risk of padding").
5. Enters investigation notes.
6. Clicks "Deny".
7. Customer's `ClaimTrackerPage.tsx` updates to show denied status.

## 8. Remaining Implementation
- **Status**: IMPLEMENTED.

## 9. Implementation Dependencies
- Depends on `customer` filing Claims.
- Relies on AI models generating `fraud_flags` and `document-extract` data.

## 10. Validation
Verify by logging in as an adjuster, reviewing a claim, adding a note, and deciding the outcome.
