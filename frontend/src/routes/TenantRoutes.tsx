import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import api from '../api';
import TenantLogin from '../tenant/pages/TenantLogin';
import TenantLayout from '../tenant/components/TenantLayout';
import TenantAdminDashboard from '../tenant/pages/TenantAdminDashboard';
import TenantTeam from '../tenant/pages/TenantTeam';
import TenantPolicies from '../tenant/pages/TenantPolicies';
import TenantAuditLog from '../tenant/pages/TenantAuditLog';
import TenantBilling from '../tenant/pages/TenantBilling';
import TenantProfile from '../tenant/pages/TenantProfile';
import UnderwriterLayout from '../underwriter/components/UnderwriterLayout';
import UnderwriterDashboard from '../underwriter/pages/UnderwriterDashboard';
import UnderwriterApplicationDetail from '../underwriter/pages/UnderwriterApplicationDetail';
import UnderwriterHistory from '../underwriter/pages/UnderwriterHistory';
import AdjusterLayout from '../adjuster/components/AdjusterLayout';
import AdjusterDashboard from '../adjuster/pages/AdjusterDashboard';
import AdjusterClaimDetail from '../adjuster/pages/AdjusterClaimDetail';
import AdjusterInvestigations from '../adjuster/pages/AdjusterInvestigations';
import AdjusterSlaTracker from '../adjuster/pages/AdjusterSlaTracker';
import AgentLayout from '../agent/components/AgentLayout';
import AgentDashboard from '../agent/pages/AgentDashboard';
import AgentCustomers from '../agent/pages/AgentCustomers';
import AgentRetentionAlerts from '../agent/pages/AgentRetentionAlerts';
import AgentCommission from '../agent/pages/AgentCommission';
import AgentCustomerDetail from '../agent/pages/AgentCustomerDetail';
import AgentNewApplication from '../agent/pages/AgentNewApplication';
import AgentApplications from '../agent/pages/AgentApplications';

interface TenantRoutesProps {
  tenantContext: {
    id: number;
    name: string;
    subdomain: string;
    plan_tier?: string;
    status: string;
  };
}

export default function TenantRoutes({ tenantContext }: TenantRoutesProps) {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [verifyingAuth, setVerifyingAuth] = useState(true);

  useEffect(() => {
    verifySession();
  }, [location.pathname]);

  const verifySession = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCurrentUser(null);
      setVerifyingAuth(false);
      return;
    }

    try {
      const res = await api.get('/api/auth/me');
      const user = res.data;

      // Validate user belongs to this tenant
      if (user.tenant_id !== tenantContext.id) {
        localStorage.removeItem('token');
        setCurrentUser(null);
      } else {
        setCurrentUser(user);
      }
    } catch (err) {
      localStorage.removeItem('token');
      setCurrentUser(null);
    } finally {
      setVerifyingAuth(false);
    }
  };

  if (verifyingAuth) {
    return <div className="loading" style={{ padding: 40 }}>Verifying workspace session...</div>;
  }

  // If user is authenticated as an Underwriter
  if (currentUser && currentUser.role === 'underwriter') {
    return (
      <UnderwriterLayout tenantContext={tenantContext} currentUser={currentUser}>
        <Routes>
          <Route
            path="/underwriter/dashboard"
            element={
              <UnderwriterDashboard
                tenantContext={tenantContext}
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/underwriter/applications/:id"
            element={
              <UnderwriterApplicationDetail
                tenantContext={tenantContext}
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/underwriter/history"
            element={
              <UnderwriterHistory
                tenantContext={tenantContext}
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/underwriter/profile"
            element={
              <TenantProfile
                tenantContext={tenantContext}
                currentUser={currentUser}
              />
            }
          />
          <Route path="/dashboard" element={<Navigate to="/underwriter/dashboard" replace />} />
          <Route path="/login" element={<Navigate to="/underwriter/dashboard" replace />} />
          <Route path="/" element={<Navigate to="/underwriter/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/underwriter/dashboard" replace />} />
        </Routes>
      </UnderwriterLayout>
    );
  }

  // If user is authenticated as a Claims Adjuster
  if (currentUser && currentUser.role === 'adjuster') {
    return (
      <AdjusterLayout tenantContext={tenantContext} currentUser={currentUser}>
        <Routes>
          <Route
            path="/adjuster/dashboard"
            element={
              <AdjusterDashboard
                tenantContext={tenantContext}
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/adjuster/claims/:id"
            element={
              <AdjusterClaimDetail
                tenantContext={tenantContext}
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/adjuster/investigations"
            element={
              <AdjusterInvestigations
                tenantContext={tenantContext}
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/adjuster/sla-tracker"
            element={
              <AdjusterSlaTracker
                tenantContext={tenantContext}
              />
            }
          />
          <Route
            path="/adjuster/profile"
            element={
              <TenantProfile
                tenantContext={tenantContext}
                currentUser={currentUser}
              />
            }
          />
          <Route path="/dashboard" element={<Navigate to="/adjuster/dashboard" replace />} />
          <Route path="/login" element={<Navigate to="/adjuster/dashboard" replace />} />
          <Route path="/" element={<Navigate to="/adjuster/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/adjuster/dashboard" replace />} />
        </Routes>
      </AdjusterLayout>
    );
  }

  // If user is authenticated as an Insurance Agent
  if (currentUser && currentUser.role === 'agent') {
    return (
      <AgentLayout tenantContext={tenantContext} currentUser={currentUser}>
        <Routes>
          <Route
            path="/agent/dashboard"
            element={
              <AgentDashboard
                tenantContext={tenantContext}
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/agent/customers"
            element={
              <AgentCustomers
                tenantContext={tenantContext}
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/agent/customers/new"
            element={
              <AgentCustomers
                tenantContext={tenantContext}
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/agent/customers/:id"
            element={
              <AgentCustomerDetail
                tenantContext={tenantContext}
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/agent/retention-alerts"
            element={
              <AgentRetentionAlerts
                tenantContext={tenantContext}
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/agent/applications"
            element={
              <AgentApplications
                tenantContext={tenantContext}
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/agent/applications/new"
            element={
              <AgentNewApplication
                tenantContext={tenantContext}
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/agent/commission"
            element={
              <AgentCommission
                tenantContext={tenantContext}
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/agent/profile"
            element={
              <TenantProfile
                tenantContext={tenantContext}
                currentUser={currentUser}
              />
            }
          />
          <Route path="/dashboard" element={<Navigate to="/agent/dashboard" replace />} />
          <Route path="/login" element={<Navigate to="/agent/dashboard" replace />} />
          <Route path="/" element={<Navigate to="/agent/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/agent/dashboard" replace />} />
        </Routes>
      </AgentLayout>
    );
  }

  // If user is authenticated as Tenant Admin (or other staff)
  if (currentUser) {
    return (
      <TenantLayout tenantContext={tenantContext} currentUser={currentUser}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <TenantAdminDashboard
                tenantContext={tenantContext}
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/team"
            element={
              <TenantTeam
                tenantContext={tenantContext}
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/policies"
            element={
              <TenantPolicies
                tenantContext={tenantContext}
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/audit"
            element={
              <TenantAuditLog
                tenantContext={tenantContext}
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/billing"
            element={
              <TenantBilling
                tenantContext={tenantContext}
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/profile"
            element={
              <TenantProfile
                tenantContext={tenantContext}
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/underwriter/dashboard"
            element={
              <UnderwriterDashboard
                tenantContext={tenantContext}
                currentUser={currentUser}
              />
            }
          />
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </TenantLayout>
    );
  }

  // If unauthenticated, only expose login
  return (
    <Routes>
      <Route path="/login" element={<TenantLogin tenantContext={tenantContext} />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
