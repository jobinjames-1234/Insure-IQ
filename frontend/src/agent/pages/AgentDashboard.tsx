import { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Briefcase
} from 'lucide-react';
import api from '../../api';

interface AgentDashboardProps {
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
    name?: string;
    role: string;
    tenant_id: number;
    profile_photo?: string;
  };
}

interface DashboardStats {
  assigned_customers_count: number;
  renewal_pipeline_value: number;
  commission_mtd: number;
  open_retention_alerts_count: number;
  upcoming_renewals: Array<{
    id: number;
    policy_number: string;
    holder_name: string;
    product_type: string;
    renewal_date: string;
    premium: number;
    days_left?: number;
  }>;
  retention_alerts: Array<{
    id: number;
    customer_name: string;
    policy_type: string;
    risk_factor: string;
    severity: string;
  }>;
}

export default function AgentDashboard({ tenantContext, currentUser }: AgentDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    assigned_customers_count: 0,
    renewal_pipeline_value: 0.0,
    commission_mtd: 0.0,
    open_retention_alerts_count: 0,
    upcoming_renewals: [],
    retention_alerts: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/agents/me/dashboard-stats')
      .then(res => {
        if (res.data) {
          setStats(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0b1329', color: '#f8fafc', padding: '32px 40px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Welcome Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                Good day, {currentUser.name || currentUser.email.split('@')[0]}
              </h1>
              <span
                style={{
                  background: 'rgba(56, 189, 248, 0.12)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Insurance Agent
              </span>
            </div>
            <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
              {tenantContext.name} Portfolio Overview &bull; Active Workspace
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0f172a', border: '1px solid #1e293b', padding: '8px 14px', borderRadius: 8 }}>
            <Briefcase size={16} style={{ color: '#38bdf8' }} />
            <span style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 500 }}>
              Agent ID: #{currentUser.id}
            </span>
          </div>
        </div>

        {/* 4 Metric KPI Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
            marginBottom: 32
          }}
        >
          {/* Card 1: Assigned Customers */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em' }}>
                Assigned Customers
              </span>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(56, 189, 248, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={18} style={{ color: '#38bdf8' }} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f8fafc' }}>
              {loading ? '—' : stats.assigned_customers_count}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
              Active accounts in portfolio
            </div>
          </div>

          {/* Card 2: Renewal Pipeline Value */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em' }}>
                Renewal Pipeline
              </span>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={18} style={{ color: '#10b981' }} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f8fafc' }}>
              {loading ? '—' : `$${stats.renewal_pipeline_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
              Upcoming 30-day renewal premium
            </div>
          </div>

          {/* Card 3: Commission MTD */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em' }}>
                Commission MTD
              </span>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(234, 179, 8, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={18} style={{ color: '#eab308' }} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f8fafc' }}>
              {loading ? '—' : `$${stats.commission_mtd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
              Earned / credited this cycle
            </div>
          </div>

          {/* Card 4: Retention Alerts Open */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em' }}>
                Retention Alerts
              </span>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={18} style={{ color: '#ef4444' }} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: stats.open_retention_alerts_count > 0 ? '#ef4444' : '#f8fafc' }}>
              {loading ? '—' : stats.open_retention_alerts_count}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
              Immediate intervention items
            </div>
          </div>
        </div>

        {/* Dual-List Sections Below the Fold */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: 24 }}>
          {/* List 1: Upcoming Renewals (Next 30 Days) */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={18} style={{ color: '#38bdf8' }} />
                <h2 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: '#f1f5f9' }}>
                  Upcoming Renewals
                </h2>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                Next 30 Days
              </span>
            </div>

            {stats.upcoming_renewals.length === 0 ? (
              <div style={{ padding: '36px 20px', textAlign: 'center', background: '#0b1329', borderRadius: 8, border: '1px dashed #1e293b' }}>
                <Clock size={28} style={{ color: '#475569', margin: '0 auto 10px' }} />
                <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500 }}>
                  No upcoming renewals in the next 30 days
                </div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 4 }}>
                  You will see assigned policy expirations and renewal workflows here once accounts are active.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {stats.upcoming_renewals.map(r => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#0b1329', borderRadius: 8, border: '1px solid #1e293b' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem' }}>{r.holder_name}</div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{r.policy_number} &bull; {r.product_type}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#34d399', fontWeight: 600, fontSize: '0.85rem' }}>${r.premium.toLocaleString()}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginTop: 2 }}>
                        {r.days_left !== undefined && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              padding: '1px 6px',
                              borderRadius: 4,
                              background: r.days_left <= 7 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: r.days_left <= 7 ? '#ef4444' : '#f59e0b',
                              border: `1px solid ${r.days_left <= 7 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                            }}
                          >
                            {r.days_left === 0 ? 'Today' : `${r.days_left}d left`}
                          </span>
                        )}
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Renews {r.renewal_date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* List 2: Retention Alerts (Proactive Intervention) */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={18} style={{ color: '#ef4444' }} />
                <h2 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: '#f1f5f9' }}>
                  Retention Alerts
                </h2>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                High Churn Risk
              </span>
            </div>

            {stats.retention_alerts.length === 0 ? (
              <div style={{ padding: '36px 20px', textAlign: 'center', background: '#0b1329', borderRadius: 8, border: '1px dashed #1e293b' }}>
                <CheckCircle2 size={28} style={{ color: '#10b981', margin: '0 auto 10px' }} />
                <div style={{ color: '#f1f5f9', fontSize: '0.9rem', fontWeight: 500 }}>
                  No customers need outreach right now
                </div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 4 }}>
                  All accounts in your book of business are currently in good standing.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {stats.retention_alerts.map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#0b1329', borderRadius: 8, border: '1px solid #1e293b' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem' }}>{a.customer_name}</div>
                      <div style={{ color: '#ef4444', fontSize: '0.75rem' }}>{a.risk_factor}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* New Agent Onboarding Guidance (per docs §3.1) */}
        {stats.assigned_customers_count === 0 && (
          <div
            style={{
              marginTop: 24,
              padding: '16px 20px',
              borderRadius: 8,
              background: 'rgba(56, 189, 248, 0.05)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#38bdf8' }} />
            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              <strong>New Agent Workspace:</strong> You will see your assigned portfolio records here once the administrator assigns your first accounts or when you submit new customer applications.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
