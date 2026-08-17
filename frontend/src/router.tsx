import { createBrowserRouter, Outlet } from 'react-router-dom';
import { B2BShell } from './components/layout/B2BShell';
import { MarketplaceShell } from './components/layout/MarketplaceShell';
import { SuperAdminShell } from './components/layout/SuperAdminShell';
import { StyleGuide } from './pages/StyleGuide';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { KYCWizard } from './pages/auth/KYCWizard';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LayoutDashboard, Shield, FileText, Server } from 'lucide-react';
import { useAuthStore } from './store/authStore';

// Phase 7 imports
import { BrowseAndApplyPage } from './pages/customer/BrowseAndApplyPage';
import { ApplicationStatusPage } from './pages/customer/ApplicationStatusPage';

// Phase 8 imports
import { CustomerHomePage } from './pages/customer/CustomerHomePage';
import { PolicyDetailPage } from './pages/customer/PolicyDetailPage';
import { FileAClaimPage } from './pages/customer/FileAClaimPage';
import { ClaimTrackerPage } from './pages/customer/ClaimTrackerPage';
import { ProfilePage } from './pages/customer/ProfilePage';

// Underwriter / Adjuster Pages
import { UnderwriterDashboardPage } from './pages/underwriting/UnderwriterDashboardPage';
import { ApplicationDetailPage } from './pages/underwriting/ApplicationDetailPage';
import { DecisionHistoryPage } from './pages/underwriting/DecisionHistoryPage';
import { ClaimsDashboardPage } from './pages/underwriting/ClaimsDashboardPage';
import { ClaimsWorkspacePage } from './pages/underwriting/ClaimsWorkspacePage';
import { InvestigationViewPage } from './pages/underwriting/InvestigationViewPage';
import { SLATrackerPage } from './pages/underwriting/SLATrackerPage';

// Agent Pages
import { AgentDashboardPage } from './pages/underwriting/AgentDashboardPage';
import { CustomerDetailPage } from './pages/underwriting/CustomerDetailPage';
import { CommissionTrackerPage } from './pages/underwriting/CommissionTrackerPage';

// Tenant Admin Pages
import { AdminDashboardPage } from './pages/underwriting/AdminDashboardPage';
import { TeamManagementPage } from './pages/underwriting/TeamManagementPage';
import { BillingPage } from './pages/underwriting/BillingPage';
import { PolicyConfigPage } from './pages/underwriting/PolicyConfigPage';

// Super-Admin Pages
import { PlatformConsolePage } from './pages/underwriting/PlatformConsolePage';
import { TenantDirectoryPage } from './pages/underwriting/TenantDirectoryPage';
import { ProvisionTenantPage } from './pages/underwriting/ProvisionTenantPage';

// Phase 11 imports
import { MarketplaceHomePage } from './pages/marketplace/MarketplaceHomePage';
import { GetAQuotePage } from './pages/marketplace/GetAQuotePage';
import { CompareQuotesPage } from './pages/marketplace/CompareQuotesPage';
import { PlanDetailPage } from './pages/marketplace/PlanDetailPage';

// Stub components for initial routing
const Dashboard = () => <div>B2B Dashboard Content</div>;
const AdminHome = () => <div>SuperAdmin Dashboard</div>;

const AuthB2BShell = () => {
  const { user } = useAuthStore()
  
  const b2bItems = [
    {label: "Dashboard", href: "/b2b", icon: <LayoutDashboard className="w-4 h-4" />, active: false},
    {label: "Underwriting", href: "/b2b/underwriting", icon: <Shield className="w-4 h-4" />, active: false},
    {label: "Claims", href: "/b2b/claims", icon: <FileText className="w-4 h-4" />, active: false},
    {label: "Agent Portal", href: "/b2b/agent", icon: <Shield className="w-4 h-4" />, active: false},
    {label: "Admin", href: "/b2b/admin", icon: <LayoutDashboard className="w-4 h-4" />, active: false},
    {label: "Console", href: "/b2b/console", icon: <Server className="w-4 h-4" />, active: true}
  ]

  return (
    <B2BShell 
      userName={`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email || 'User'} 
      userRole={user?.role || 'User'} 
      tenantName="InsureIQ Platform" 
      sidebarItems={b2bItems}
    >
      <Outlet />
    </B2BShell>
  )
}

const AuthMarketplaceShell = () => {
  const { user, isAuthenticated } = useAuthStore()
  return (
    <MarketplaceShell 
      isLoggedIn={isAuthenticated} 
      userName={`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email || 'User'}
    >
      <Outlet />
    </MarketplaceShell>
  )
}

const PublicMarketplaceShell = () => {
  return (
    <MarketplaceShell isLoggedIn={false}>
      <Outlet />
    </MarketplaceShell>
  )
}

const AuthSuperAdminShell = () => {
  const { user } = useAuthStore()
  return (
    <SuperAdminShell userName={`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email || 'Admin'}>
      <AdminHome />
    </SuperAdminShell>
  )
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/kyc',
    element: <ProtectedRoute allowedRoles={['customer']}><KYCWizard /></ProtectedRoute>,
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
  // --- B2B Tenant Routes ---
  {
    path: '/b2b',
    element: <ProtectedRoute allowedRoles={['agent', 'underwriter', 'adjuster', 'admin']}><AuthB2BShell /></ProtectedRoute>,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'underwriting',
        element: <UnderwriterDashboardPage />,
      },
      {
        path: 'underwriting/:id',
        element: <ApplicationDetailPage />,
      },
      {
        path: 'decisions',
        element: <DecisionHistoryPage />,
      },
      {
        path: 'claims',
        element: <ClaimsDashboardPage />,
      },
      {
        path: 'claims/:id',
        element: <ClaimsWorkspacePage />,
      },
      {
        path: 'claims/:id/investigation',
        element: <InvestigationViewPage />,
      },
      {
        path: 'claims/sla',
        element: <SLATrackerPage />,
      },
      {
        path: 'agent',
        element: <AgentDashboardPage />,
      },
      {
        path: 'agent/customers/:id',
        element: <CustomerDetailPage />,
      },
      {
        path: 'agent/commission',
        element: <CommissionTrackerPage />,
      },
      {
        path: 'admin',
        element: <AdminDashboardPage />,
      },
      {
        path: 'admin/team',
        element: <TeamManagementPage />,
      },
      {
        path: 'admin/billing',
        element: <BillingPage />,
      },
      {
        path: 'admin/policy-config',
        element: <PolicyConfigPage />,
      },
      {
        path: 'console',
        element: <PlatformConsolePage />,
      },
      {
        path: 'console/tenants',
        element: <TenantDirectoryPage />,
      },
      {
        path: 'console/tenants/new',
        element: <ProvisionTenantPage />,
      }
    ],
  },
  // --- B2C Marketplace Routes ---
  {
    path: '/portal',
    element: <ProtectedRoute allowedRoles={['customer']}><AuthMarketplaceShell /></ProtectedRoute>,
    children: [
      {
        index: true,
        element: <CustomerHomePage />,
      },
      {
        path: 'policies/:id',
        element: <PolicyDetailPage />,
      },
      {
        path: 'claims',
        element: <ClaimTrackerPage />,
      },
      {
        path: 'claims/new',
        element: <FileAClaimPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'apply',
        element: <BrowseAndApplyPage />,
      },
      {
        path: 'applications',
        element: <ApplicationStatusPage />,
      }
    ],
  },
  // --- Platform Super Admin Routes ---
  {
    path: '/admin',
    element: <ProtectedRoute allowedRoles={['superadmin']}><AuthSuperAdminShell /></ProtectedRoute>,
    children: [
      {
        index: true,
        element: <AdminHome />,
      },
    ],
  },
  // --- Public Marketplace Routes ---
  {
    path: '/marketplace',
    element: <PublicMarketplaceShell />,
    children: [
      {
        index: true,
        element: <MarketplaceHomePage />
      },
      {
        path: 'quote',
        element: <GetAQuotePage />
      },
      {
        path: 'compare',
        element: <CompareQuotesPage />
      },
      {
        path: 'plan/:id',
        element: <PlanDetailPage />
      }
    ]
  },
  // Default redirect (temporary)
  {
    path: '/',
    element: <LoginPage />,
  },
  {
    path: '/styleguide',
    element: <StyleGuide />,
  }
]);
