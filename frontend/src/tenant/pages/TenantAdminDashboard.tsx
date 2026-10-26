import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import {
  Users,
  ShieldCheck,
  FileText,
  Activity,
  Layers,
  Calendar,
  CheckCircle2,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

interface TenantAdminDashboardProps {
  tenantContext: {
    id: number;
    name: string;
    subdomain: string;
    plan_tier?: string;
    status: string;
  };
  currentUser: {
    id: number;
    email: string;
    role: string;
    tenant_id: number;
  };
}

export default function TenantAdminDashboard({ tenantContext, currentUser }: TenantAdminDashboardProps) {
  const navigate = useNavigate();
  const [tenantData, setTenantData] = useState<any>(null);
  const [teamCount, setTeamCount] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [tenantRes, teamRes] = await Promise.all([
        api.get('/api/tenants/me'),
        api.get('/api/team/')
      ]);
      setTenantData(tenantRes.data);
      setTeamCount(teamRes.data.length);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load tenant configuration');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return <div className="loading" style={{ padding: 40 }}>Loading tenant dashboard...</div>;
  }

  if (error) {
    return (
      <div className="error-alert" style={{ margin: 20 }}>
        <AlertCircle size={20} />
        <span>{error}</span>
      </div>
    );
  }

  const tenant = tenantData || tenantContext;

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', margin: '0 0 6px 0' }}>Tenant Operations Overview</h1>
          <p style={{ margin: 0, color: '#94a3b8' }}>
            Welcome back, <strong>{currentUser.email}</strong>. Operational control center for{' '}
            <span style={{ color: '#e2e8f0' }}>{tenant.name}</span>.
          </p>
        </div>
      </div>

      {/* Real KPI Metrics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 32
        }}
      >
        <div className="card" style={{ padding: '18px 20px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>Tenant Status</span>
            <div style={{ background: '#10b98118', padding: 7, borderRadius: 8 }}>
              <Activity size={18} style={{ color: '#10b981' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#10b981', textTransform: 'capitalize' }}>
            {tenant.status}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
            Subdomain: <code style={{ color: '#38bdf8' }}>{tenant.subdomain}</code>
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>Subscription Tier</span>
            <div style={{ background: '#0284c718', padding: 7, borderRadius: 8 }}>
              <Layers size={18} style={{ color: '#38bdf8' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>
            {tenant.plan_tier}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
            Isolation Mode: {tenant.isolation_mode || 'Shared'}
          </div>
        </div>

        <div
          className="card"
          onClick={() => navigate('/team')}
          style={{ padding: '18px 20px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, cursor: 'pointer', transition: 'border-color 0.15s ease' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#0284c7'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#1e293b'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>Team Members</span>
            <div style={{ background: '#f59e0b18', padding: 7, borderRadius: 8 }}>
              <Users size={18} style={{ color: '#f59e0b' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f8fafc' }}>
            {teamCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
            <span>Manage team</span> <ArrowRight size={12} />
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>Configured Policies</span>
            <div style={{ background: '#8b5cf618', padding: 7, borderRadius: 8 }}>
              <FileText size={18} style={{ color: '#a78bfa' }} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f8fafc' }}>
            0
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
            Pending initial catalog setup
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* Organization Information Card */}
        <div className="card" style={{ padding: 24, background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8, color: '#f8fafc' }}>
            <ShieldCheck size={20} style={{ color: '#38bdf8' }} /> Organization Profile
          </h3>
          <div style={{ display: 'grid', gap: 12, fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: 8 }}>
              <span style={{ color: '#94a3b8' }}>Organization Name</span>
              <span style={{ fontWeight: 600, color: '#f8fafc' }}>{tenant.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: 8 }}>
              <span style={{ color: '#94a3b8' }}>Dedicated Subdomain</span>
              <span><code style={{ color: '#38bdf8' }}>{tenant.subdomain}</code></span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: 8 }}>
              <span style={{ color: '#94a3b8' }}>Tenant ID</span>
              <span style={{ color: '#f8fafc' }}>#{tenant.id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: 8 }}>
              <span style={{ color: '#94a3b8' }}>Created Timestamp</span>
              <span style={{ color: '#f8fafc' }}>
                {tenant.created_at ? new Date(tenant.created_at).toLocaleString() : 'Recent'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Database Architecture</span>
              <span style={{ textTransform: 'capitalize', color: '#f8fafc' }}>{tenant.isolation_mode || 'Shared'}</span>
            </div>
          </div>
        </div>

        {/* Setup & Onboarding Progress */}
        <div className="card" style={{ padding: 24, background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={20} style={{ color: '#10b981' }} /> Getting Started Checklist
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <CheckCircle2 size={18} style={{ color: '#10b981', marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Tenant Workspace Provisioned</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Your dedicated tenant environment is active.</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <CheckCircle2 size={18} style={{ color: '#10b981', marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Tenant Administrator Logged In</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Authenticated with verified role permissions.</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              {teamCount > 1 ? (
                <CheckCircle2 size={18} style={{ color: '#10b981', marginTop: 2, flexShrink: 0 }} />
              ) : (
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: '2px solid #64748b',
                    marginTop: 2,
                    flexShrink: 0
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#e2e8f0' }}>
                    Invite Team Members (Underwriters & Adjusters)
                  </div>
                  {teamCount === 1 && (
                    <button
                      onClick={() => navigate('/team')}
                      className="btn-secondary"
                      style={{ padding: '2px 8px', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      Invite
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {teamCount > 1
                    ? `${teamCount} staff members active across operations.`
                    : 'Add staff users to begin underwriting and claims processing.'}
                </div>
              </div>
            </div>


            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  border: '2px solid #64748b',
                  marginTop: 2,
                  flexShrink: 0
                }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#e2e8f0' }}>
                  Define Insurance Policy Types
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Configure coverage bands, approval thresholds, and base rates.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
