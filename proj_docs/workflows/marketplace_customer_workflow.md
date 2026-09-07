# Workflow Specification: Marketplace Customer

## 1. Role Overview
- **Role**: `public` (unauthenticated user browsing the B2C Marketplace).
- **Purpose**: Prospective customer browsing insurance products across different providers (mocked) and obtaining a quote before creating an account.
- **Authorization Level**: Unauthenticated. Can only access public endpoints.

## 2. Authentication
- **Login**: N/A. Operates anonymously.
- **Registration**: If they choose to purchase a plan, they transition to the `customer` workflow by calling `POST /api/v1/auth/register`.

## 3. Permission Model

### 3.1 Allowed
- `GET /api/v1/marketplace/products` - View featured aggregate insurance products.
- `POST /api/v1/marketplace/quotes` - Submit basic info to receive estimated quotes.
- `GET /api/v1/marketplace/compare` - Compare multiple quotes.

### 3.2 Forbidden
- Everything else.

## 4. Navigation (Frontend)
Located within `MarketplaceShell`:
- `/` -> `MarketplaceHomePage.tsx`
- `/quote` -> `GetAQuotePage.tsx`
- `/compare` -> `CompareQuotesPage.tsx`
- `/plan/:id` -> `PlanDetailPage.tsx`

## 5. Page Workflows

### 5.1 Marketplace Home (`MarketplaceHomePage.tsx`)
- **Entry**: Navigating to the root domain.
- **Data/APIs**: `GET /api/v1/marketplace/products`.
- **Actions**: View featured products. Click "Get a Quote".

### 5.2 Get A Quote (`GetAQuotePage.tsx`)
- **Entry**: Clicking "Get a Quote".
- **Data/APIs**: `POST /api/v1/marketplace/quotes`.
- **Validation**: User must provide basic demographic data (Age, Zip code, Vehicle make).
- **Next States**: Redirects to `CompareQuotesPage.tsx`.

### 5.3 Compare Quotes (`CompareQuotesPage.tsx`)
- **Data/APIs**: Uses the response from the previous `POST`.
- **Actions**: Selects a specific plan -> `PlanDetailPage.tsx`.

### 5.4 Plan Detail (`PlanDetailPage.tsx`)
- **Actions**: Clicks "Buy Now" -> Redirects to `/register` to create an account and finalize the purchase.

## 6. Entity Interaction
- **Quotes (Mocked)**: `CREATE` (Generate).
- **Products**: `READ`.

## 7. Complete End-to-End Journey
1. Lands on `MarketplaceHomePage.tsx`.
2. Selects "Auto Insurance" -> "Get a Quote".
3. Fills out form on `GetAQuotePage.tsx`.
4. Views 3 different options on `CompareQuotesPage.tsx`.
5. Selects the middle option -> views `PlanDetailPage.tsx`.
6. Clicks "Buy Now" -> redirected to `/register`.
7. (Workflow transitions to `customer` workflow).

## 8. Remaining Implementation
- **Status**: IMPLEMENTED.

## 9. Implementation Dependencies
- Requires public product metadata to be available (often cached in Redis or managed globally).

## 10. Validation
Verify by launching the frontend, remaining logged out, navigating to `/quote`, entering dummy data, and seeing the generated quotes.
