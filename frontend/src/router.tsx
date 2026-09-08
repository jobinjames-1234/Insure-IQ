import { createBrowserRouter, Outlet, Navigate } from 'react-router-dom';
import { B2BShell } from './components/layout/B2BShell';
import { MarketplaceShell } from './components/layout/MarketplaceShell';
import { SuperAdminShell } from './components/layout/SuperAdminShell';
import { StyleGuide } from './pages/StyleGuide';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { KYCWizard } from './pages/auth/KYCWizard';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LayoutDashboard, Shield, FileText, Settings } from 'lucide-react';
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
import { ModelPerformancePage } from './pages/underwriting/ModelPerformancePage';

// Agent Pages
import { AgentDashboardPage } from './pages/underwriting/AgentDashboardPage';
import { CustomerDetailPage } from './pages/underwriting/CustomerDetailPage';
import { CommissionTrackerPage } from './pages/underwriting/CommissionTrackerPage';
import { CustomerPortfolioPage } from './pages/underwriting/CustomerPortfolioPage';
import { RetentionAlertsPage } from './pages/underwriting/RetentionAlertsPage';
import { AgentProfilePage } from './pages/underwriting/AgentProfilePage';
import { AgentPolicyDetailPage } from './pages/underwriting/AgentPolicyDetailPage';
import { AdminUserProfilePage } from './pages/underwriting/AdminUserProfilePage';

// Tenant Admin Pages
import { AdminDashboardPage } from './pages/underwriting/AdminDashboardPage';
import { TeamManagementPage } from './pages/underwriting/TeamManagementPage';
import { BillingPage } from './pages/underwriting/BillingPage';
import { PolicyConfigPage } from './pages/underwriting/PolicyConfigPage';
import { AdminPoliciesSoldView } from './pages/underwriting/AdminPoliciesSoldView';
import { AdminClaimsPendingView } from './pages/underwriting/AdminClaimsPendingView';
import { AdminSettlementTimeView } from './pages/underwriting/AdminSettlementTimeView';
import { AdminRevenueView } from './pages/underwriting/AdminRevenueView';
import { AdminActivityView } from './pages/underwriting/AdminActivityView';
import { AdminUpdatePaymentPage } from './pages/underwriting/AdminUpdatePaymentPage';
import { AdminChangePlanPage } from './pages/underwriting/AdminChangePlanPage';
import { AdminPlanDetailsPage } from './pages/underwriting/AdminPlanDetailsPage';

// Super-Admin Pages
import { PlatformConsolePage } from './pages/underwriting/PlatformConsolePage';
import { TenantDirectoryPage } from './pages/underwriting/TenantDirectoryPage';
import { ProvisionTenantPage } from './pages/underwriting/ProvisionTenantPage';
import { TenantDetailPage } from './pages/underwriting/TenantDetailPage';
import { TenantEditPage } from './pages/underwriting/TenantEditPage';
import PlatformUsersPage from './pages/underwriting/PlatformUsersPage';
import GlobalSettingsPage from './pages/underwriting/GlobalSettingsPage';

// Phase 11 imports
import { MarketplaceHomePage } from './pages/marketplace/MarketplaceHomePage';
import { GetAQuotePage } from './pages/marketplace/GetAQuotePage';
import { CompareQuotesPage } from './pages/marketplace/CompareQuotesPage';
import { PlanDetailPage } from './pages/marketplace/PlanDetailPage';

import { getRoleDashboardRoute } from './utils/routing';

const RoleBasedRedirect = () => {
  const { user } = useAuthStore()
  const route = getRoleDashboardRoute(user?.role)
  // Prevent infinite loops if getRoleDashboardRoute returns /b2b for an unknown role
  if (route === '/b2b') return <div>B2B Dashboard Content</div>
  return <Navigate to={route} replace />
}



const AuthB2BShell = () => {
  const { user } = useAuthStore()
  
  let b2bItems = []
  const dashboardItem = {label: "Dashboard", href: "/b2b", icon: <LayoutDashboard className="w-4 h-4" />, active: false}

  if (user?.role === 'agent') {
    b2bItems = [
      dashboardItem,
      {label: "Agent Portal", href: "/b2b/agent", icon: <Shield className="w-4 h-4" />, active: false}
    ]
  } else if (user?.role === 'underwriter') {
    b2bItems = [
      dashboardItem,
      {label: "Underwriting", href: "/b2b/underwriting", icon: <Shield className="w-4 h-4" />, active: false}
    ]
  } else if (user?.role === 'adjuster') {
    b2bItems = [
      dashboardItem,
      {label: "Claims", href: "/b2b/claims", icon: <FileText className="w-4 h-4" />, active: false}
    ]
  } else if (user?.role === 'admin') {
    b2bItems = [
      {label: "Admin Dashboard", href: "/b2b/admin", icon: <LayoutDashboard className="w-4 h-4" />, active: false},
      {label: "Team Management", href: "/b2b/admin/team", icon: <Shield className="w-4 h-4" />, active: false},
      {label: "Billing", href: "/b2b/admin/billing", icon: <FileText className="w-4 h-4" />, active: false},
      {label: "Policy Config", href: "/b2b/admin/policy-config", icon: <Settings className="w-4 h-4" />, active: false}
    ]
  } else {
    b2bItems = [
      dashboardItem,
      {label: "Underwriting", href: "/b2b/underwriting", icon: <Shield className="w-4 h-4" />, active: false},
      {label: "Claims", href: "/b2b/claims", icon: <FileText className="w-4 h-4" />, active: false},
      {label: "Agent Portal", href: "/b2b/agent", icon: <Shield className="w-4 h-4" />, active: false},
      {label: "Admin", href: "/b2b/admin", icon: <LayoutDashboard className="w-4 h-4" />, active: false}
    ]
  }

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
      <Outlet />
    </SuperAdminShell>
  )
}

const commonAuthRoutes = [
  {
    path: '/login',
    element: <LoginPage portalType="customer" />,
  },
  {
    path: '/institution/login',
    element: <LoginPage portalType="institution" />,
  },
  {
    path: '/superadmin/login',
    element: <LoginPage portalType="superadmin" />,
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
  {
    path: '/styleguide',
    element: <StyleGuide />,
  }
];

export const superadminRouter = createBrowserRouter([
  ...commonAuthRoutes,
  {
    path: '/admin',
    element: <ProtectedRoute allowedRoles={['superadmin']}><AuthSuperAdminShell /></ProtectedRoute>,
    children: [
      {
        index: true,
        element: <Navigate to="/admin/console" replace />,
      },
      {
        path: 'console',
        element: <PlatformConsolePage />,
      },
      {
        path: 'tenants',
        element: <TenantDirectoryPage />,
      },
      {
        path: 'tenants/new',
        element: <ProvisionTenantPage />,
      },
      {
        path: 'tenants/:id',
        element: <TenantDetailPage />,
      },
      {
        path: 'tenants/:id/edit',
        element: <TenantEditPage />,
      },
      {
        path: 'users',
        element: <PlatformUsersPage />,
      },
      {
        path: 'settings',
        element: <GlobalSettingsPage />,
      }
    ],
  },
  {
    path: '/',
    element: <Navigate to="/admin" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/admin" replace />,
  }
]);

export const marketplaceRouter = createBrowserRouter([
  ...commonAuthRoutes,
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
  {
    path: '/',
    element: <Navigate to="/marketplace" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/marketplace" replace />,
  }
]);

export const b2bRouter = createBrowserRouter([
  ...commonAuthRoutes,
  {
    path: '/b2b',
    element: <ProtectedRoute allowedRoles={['agent', 'underwriter', 'adjuster', 'admin']}><AuthB2BShell /></ProtectedRoute>,
    children: [
      {
        index: true,
        element: <RoleBasedRedirect />,
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
        path: 'performance',
        element: <ModelPerformancePage />,
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
        path: 'agent/customers',
        element: <CustomerPortfolioPage />,
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
        path: 'agent/retention-alerts',
        element: <RetentionAlertsPage />,
      },
      {
        path: 'agent/profile',
        element: <AgentProfilePage />,
      },
      {
        path: 'agent/policies/:id',
        element: <AgentPolicyDetailPage />,
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
        path: 'admin/team/:id',
        element: <AdminUserProfilePage />,
      },
      {
        path: 'admin/billing',
        children: [
          {
            index: true,
            element: <BillingPage />,
          },
          {
            path: 'payment',
            element: <AdminUpdatePaymentPage />,
          },
          {
            path: 'plan',
            element: <AdminChangePlanPage />,
          },
          {
            path: 'plans/:planId',
            element: <AdminPlanDetailsPage />,
          }
        ]
      },
      {
        path: 'admin/policy-config',
        element: <PolicyConfigPage />,
      },
      {
        path: 'admin/policies-sold',
        element: <AdminPoliciesSoldView />,
      },
      {
        path: 'admin/claims-pending',
        element: <AdminClaimsPendingView />,
      },
      {
        path: 'admin/settlement-time',
        element: <AdminSettlementTimeView />,
      },
      {
        path: 'admin/revenue',
        element: <AdminRevenueView />,
      },
      {
        path: 'admin/activity',
        element: <AdminActivityView />,
      }
    ],
  },
  {
    path: '/',
    element: <Navigate to="/b2b" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/b2b" replace />,
  }
]);

export function getRouterForSubdomain(subdomain: string) {
  switch (subdomain) {
    case 'superadmin':
      return superadminRouter;
    case 'marketplace':
      return marketplaceRouter;
    case 'b2b':
    default:
      return b2bRouter;
  }
}

