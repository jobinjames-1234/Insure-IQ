# Project Context: API & Frontend

## 1. Purpose
This document explains how the React frontend interfaces with the FastAPI backend, detailing the API structure and frontend routing.

## 2. Current Understanding

### 2.1 API Structure (FastAPI)
The backend is logically divided into domain-specific routers mounted under `/api/v1/`:
- `/auth`: Login, register, token refresh, `me` profile.
- `/tenants`: Tenant branding and public info.
- `/applications`: Policy application submission and management (Customer).
- `/underwriting`: Underwriter queues and decisions.
- `/policies`: Active policy viewing.
- `/claims`: Claim submission and adjuster queues.
- `/agent`: Agent portfolio, commissions, and retention.
- `/admin`: Tenant-level configuration and user management.
- `/console`: Super-admin cross-tenant provisioning.
- `/ml`: AI inference stubs (Risk, Fraud, Document Extraction).
- `/marketplace`: Public B2C product quotes.

### 2.2 Frontend State & Fetching
- **Global State**: Managed by Zustand (`store/authStore.ts`), which holds the active user profile and JWT tokens.
- **API Client**: A centralized Axios instance (`services/api.ts`) automatically attaches the `Authorization: Bearer <token>` header to all outgoing requests. It also handles 401 Unauthorized responses by attempting to refresh the token, or logging the user out and redirecting to `/login` if the refresh fails.
- **Data Fetching**: Primarily done inside `useEffect` blocks within the page components.

### 2.3 Frontend Routing (React Router v6)
Routes are defined in `frontend/src/router.tsx` using a component tree:
- **Public Routes**: `/login`, `/register`, `/`, `/marketplace/*`
- **Customer Portal**: `/portal/*` (Uses `MarketplaceShell` or a simplified nav).
- **Internal User Portal**: `/b2b/*` or standard `/portal/*` depending on role, wrapped in `B2BShell`.
- **Tenant Admin**: `/admin/*` wrapped in `B2BShell`.
- **Super Admin**: `/console/*` wrapped in `SuperAdminShell`.

## 3. Evidence / Source Locations
- `backend/app/main.py`: Where routers are registered.
- `frontend/src/router.tsx`: React Router configuration mapping URLs to Pages.
- `frontend/src/services/api.ts`: Axios configuration.

## 4. Implementation Implications
- When adding a new API endpoint, it must be added to the appropriate router in `backend/app/api/routes/` and then registered in `main.py` if a new file is created.
- On the frontend, new routes must be added to `router.tsx` inside the appropriate layout shell to inherit the correct navigation and auth guards.

## 5. Known Uncertainties
- Error handling in the frontend relies heavily on generic `catch (err) { alert(...) }` or simple console logging. A unified toast notification system exists in the UI library but is not universally adopted across all API calls.
