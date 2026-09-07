# Workflow Specification: End Customer

## 1. Role Overview
- **Role**: `customer`
- **Purpose**: End-user policyholders who purchase and manage their insurance policies and file claims.
- **Authorization Level**: Lowest permission level. Strictly limited to reading and writing their own data within their specific tenant.

## 2. Authentication
- **Login**: `POST /api/v1/auth/login`
- **Credentials**: Email & Password
- **Session**: Receives short-lived JWT `access_token` and long-lived `refresh_token`.
- **Role Resolution**: Handled via JWT claims and resolved by `get_current_user`.
- **Logout**: Handled client-side by clearing the Zustand store and server-side by calling `POST /api/v1/auth/logout`.

## 3. Permission Model

### 3.1 Allowed
- Viewing public product catalogs.
- Applying for policies.
- Viewing their own applications, policies, and claims.
- Submitting claims and claim documents against their active policies.

### 3.2 Forbidden
- Viewing any data belonging to other customers.
- Approving or denying applications/claims.
- Accessing `/admin`, `/agent`, `/underwriting`, `/claims` (adjuster queues), or `/console` API routes.

## 4. Navigation (Frontend)
- `/portal` -> `CustomerHomePage.tsx`
- `/portal/apply` -> `BrowseAndApplyPage.tsx`
- `/portal/applications/:id` -> `ApplicationStatusPage.tsx`
- `/portal/policies/:id` -> `PolicyDetailPage.tsx`
- `/portal/claims/new` -> `FileAClaimPage.tsx`
- `/portal/claims/:id` -> `ClaimTrackerPage.tsx`
- `/portal/profile` -> `ProfilePage.tsx`

## 5. Page Workflows

### 5.1 Customer Home (`CustomerHomePage.tsx`)
- **Entry**: Navigating to `/portal` post-login.
- **Data/APIs**: Calls `GET /api/v1/policies/my` to fetch active coverage.
- **Actions**: View policy details, File a claim, Get a new quote.
- **Next States**: Navigates to specific Policy Detail or File Claim forms.

### 5.2 Browse & Apply (`BrowseAndApplyPage.tsx`)
- **Entry**: Navigating to `/portal/apply`.
- **Data/APIs**: 
  - `GET /api/v1/applications/policy-types` (List available products, via applications router)
  - `POST /api/v1/applications` (Submit application form)
  - `POST /api/v1/applications/{id}/documents` (Upload supporting docs)
- **Validation**: Ensures required fields are provided before submission.
- **Backend**: Creates an application directly in `submitted` state. There is **no `draft` intermediate state** for customer-submitted applications (draft state only exists for agent-submitted applications via `POST /agent/applications`).
- **Next States**: Redirects to `ApplicationStatusPage.tsx` on success.

### 5.3 File A Claim (`FileAClaimPage.tsx`)
- **Entry**: Navigating to `/portal/claims/new?policy_id=...`.
- **Data/APIs**: `POST /api/v1/claims`
- **Validation**: Requires incident date, description, and valid policy ID.
- **Next States**: Redirects to `/portal/claims` list or specific tracker.

## 6. Entity Interaction
- **Applications**: `CREATE` (Submit), `READ` (View own). Cannot UPDATE or DELETE.
- **Policies**: `READ` (View own). Cannot CREATE directly.
- **Claims**: `CREATE` (Submit), `READ` (View own). Cannot UPDATE or DELETE.

## 7. Complete End-to-End Journey
1. Navigate to `/login` and authenticate.
2. Redirected to `CustomerHomePage.tsx`.
3. Clicks "Get New Quote" -> `BrowseAndApplyPage.tsx`.
4. Submits application -> Status is immediately `submitted` (no draft state).
5. Waits for Underwriter approval.
6. Once approved, Policy appears in `CustomerHomePage.tsx` (underwriting auto-creates Policy record).
7. Clicks "File Claim" -> `FileAClaimPage.tsx`.
8. Submits claim -> Claim tracking visible.

## 7b. Known Journey Blocker
> [!CAUTION]
> **Missing Customer Record on Registration**: `POST /auth/register` creates a `User` record and assigns the `customer` role, but does **NOT** create a `Customer` record in the `customers` table. Both `POST /applications` and `POST /claims` require a valid `Customer` record (they query `Customer.user_id == current_user.id`). A newly registered user who immediately tries to apply will receive a `400: Customer profile not found` error. A seed/fixture must create the `Customer` record, or registration must be updated to auto-create it.

## 8. Remaining Implementation
- **Status**: IMPLEMENTED.

## 9. Implementation Dependencies
- Depends on `admin` having configured `policy_types`.
- Depends on `underwriter` workflows to process applications.
- Depends on `adjuster` workflows to process claims.

## 10. Validation
Verify this workflow by logging in as `customer1@abc.com` (from seed data) and ensuring they can apply for a policy and file a claim without encountering 403 Forbidden errors, and that they cannot access `/b2b` paths.
