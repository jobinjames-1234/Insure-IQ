import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Inbox,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  Plus,
  ShieldCheck,
  ChevronRight,
  X
} from 'lucide-react';
import api from '../../api';

interface UnderwritingStats {
  pending_review_count: number;
  average_risk_score: number;
  approved_today_count: number;
  referred_today_count: number;
}

interface PolicyApplication {
  id: number;
  application_number: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone?: string;
  product_type: string;
  coverage_amount: number;
  proposed_premium: number;
  adjusted_premium?: number;
  risk_score: number;
  risk_tier: 'low' | 'medium' | 'high';
  status: string;
  applicant_data?: any;
  risk_factors?: any;
  created_at: string;
}

interface UnderwriterDashboardProps {
  tenantContext: {
    id: number;
    name: string;
    subdomain: string;
    plan_tier?: string;
  };
  currentUser: {
    id: number;
    name?: string;
    email: string;
    role: string;
  };
}

export default function UnderwriterDashboard({ tenantContext }: UnderwriterDashboardProps) {
  const navigate = useNavigate();
  const [stats, setStats] = useState<UnderwritingStats>({
    pending_review_count: 0,
    average_risk_score: 0,
    approved_today_count: 0,
    referred_today_count: 0
  });
  const [applications, setApplications] = useState<PolicyApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [productFilter, setProductFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('pending_review');
  const [sortBy, setSortBy] = useState('risk_score');
  const [sortOrder, setSortOrder] = useState('desc');

  // Intake Modal
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [submittingIntake, setSubmittingIntake] = useState(false);
  const [intakeForm, setIntakeForm] = useState({
    applicant_name: '',
    applicant_email: '',
    applicant_phone: '',
    product_type: 'auto',
    coverage_amount: 50000,
    proposed_premium: 1200,
    driver_or_subject_age: 32,
    asset_or_vehicle_age: 3
  });

  useEffect(() => {
    fetchData();
  }, [productFilter, statusFilter, sortBy, sortOrder]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, queueRes] = await Promise.all([
        api.get('/api/underwriting/stats'),
        api.get('/api/underwriting/queue', {
          params: {
            product_type: productFilter,
            status: statusFilter,
            sort_by: sortBy,
            order: sortOrder
          }
        })
      ]);
      setStats(statsRes.data);
      setApplications(queueRes.data);
    } catch (err) {
      console.error('Failed to load underwriting queue data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intakeForm.applicant_name || !intakeForm.applicant_email) return;

    setSubmittingIntake(true);
    try {
      await api.post('/api/underwriting/applications/submit', {
        applicant_name: intakeForm.applicant_name.trim(),
        applicant_email: intakeForm.applicant_email.trim(),
        applicant_phone: intakeForm.applicant_phone?.trim() || undefined,
        product_type: intakeForm.product_type,
        coverage_amount: Number(intakeForm.coverage_amount),
        proposed_premium: Number(intakeForm.proposed_premium),
        applicant_data: {
          age: Number(intakeForm.driver_or_subject_age),
          asset_age: Number(intakeForm.asset_or_vehicle_age)
        }
      });
      setShowIntakeModal(false);
      setIntakeForm({
        applicant_name: '',
        applicant_email: '',
        applicant_phone: '',
        product_type: 'auto',
        coverage_amount: 50000,
        proposed_premium: 1200,
        driver_or_subject_age: 32,
        asset_or_vehicle_age: 3
      });
      fetchData();
    } catch (err: any) {
      console.error('Failed to submit application', err);
      const detail = err.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail.map((d: any) => d.msg).join(', ') : 'Error submitting application to queue');
      alert(`Submission Error: ${errorMsg}`);
    } finally {
      setSubmittingIntake(false);
    }
  };

  const filteredApps = applications.filter(app => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      app.applicant_name.toLowerCase().includes(query) ||
      app.application_number.toLowerCase().includes(query) ||
      app.applicant_email.toLowerCase().includes(query)
    );
  });

  const renderConfidencePill = (score: number) => {
    if (score < 40) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 10px',
            borderRadius: 12,
            background: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#4ade80',
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.02em'
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
          {score} low
        </span>
      );
    }
    if (score <= 70) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 10px',
            borderRadius: 12,
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#fbbf24',
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.02em'
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }} />
          {score} medium
        </span>
      );
    }
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '3px 10px',
          borderRadius: 12,
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          fontSize: '0.78rem',
          fontWeight: 700,
          letterSpacing: '0.02em'
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
        {score} high
      </span>
    );
  };

  const getProductBadge = (type: string) => {
    const map: Record<string, { label: string; color: string; bg: string }> = {
      auto: { label: 'Auto', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.12)' },
      health: { label: 'Health', color: '#34d399', bg: 'rgba(16, 185, 129, 0.12)' },
      property: { label: 'Property', color: '#fb923c', bg: 'rgba(249, 115, 22, 0.12)' },
      life: { label: 'Life', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.12)' },
    };
    const item = map[type.toLowerCase()] || { label: type, color: '#94a3b8', bg: '#1e293b' };
    return (
      <span style={{ padding: '2px 8px', borderRadius: 4, background: item.bg, color: item.color, fontSize: '0.75rem', fontWeight: 600 }}>
        {item.label}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Underwriting Dashboard
          </h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.88rem' }}>
            Review, evaluate and decide on inbound policy applications for {tenantContext.name}.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleRefresh}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 14px',
              borderRadius: 6,
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#cbd5e1',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowIntakeModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 16px',
              borderRadius: 6,
              background: '#2563eb',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
            }}
          >
            <Plus size={16} />
            <span>Intake Application</span>
          </button>
        </div>
      </div>

      {/* 4 Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {/* Metric 1: Pending Review */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pending Review
            </span>
            <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: 7, borderRadius: 6 }}>
              <Inbox size={18} style={{ color: '#60a5fa' }} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {stats.pending_review_count}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 8 }}>
            Prioritized by risk score descending
          </div>
        </div>

        {/* Metric 2: Average Risk Score */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Average Risk Score
            </span>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: 7, borderRadius: 6 }}>
              <Activity size={18} style={{ color: '#fbbf24' }} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {stats.average_risk_score}
            <span style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: 500, marginLeft: 4 }}>/ 100</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 8 }}>
            Active queue actuarial exposure
          </div>
        </div>

        {/* Metric 3: Approved Today */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Approved Today
            </span>
            <div style={{ background: 'rgba(34, 197, 94, 0.15)', padding: 7, borderRadius: 6 }}>
              <CheckCircle2 size={18} style={{ color: '#4ade80' }} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {stats.approved_today_count}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#4ade80', marginTop: 8 }}>
            Policies converted & issued
          </div>
        </div>

        {/* Metric 4: Referred Today */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Referred Today
            </span>
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: 7, borderRadius: 6 }}>
              <AlertTriangle size={18} style={{ color: '#f87171' }} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {stats.referred_today_count}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#f87171', marginTop: 8 }}>
            Escalated to senior review
          </div>
        </div>
      </div>

      {/* Queue Table Container */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, overflow: 'hidden' }}>
        {/* Controls Bar */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 280 }}>
            {/* Search Box */}
            <div style={{ position: 'relative', width: 280 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: 10, color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search applicant or ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  borderRadius: 6,
                  background: '#090d16',
                  border: '1px solid #334155',
                  color: '#f8fafc',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            {/* Product Type Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={14} style={{ color: '#64748b' }} />
              <select
                value={productFilter}
                onChange={e => setProductFilter(e.target.value)}
                style={{
                  padding: '7px 10px',
                  borderRadius: 6,
                  background: '#090d16',
                  border: '1px solid #334155',
                  color: '#f8fafc',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Products</option>
                <option value="auto">Auto Insurance</option>
                <option value="health">Health Insurance</option>
                <option value="property">Property Insurance</option>
                <option value="life">Life Insurance</option>
              </select>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: 6,
                background: '#090d16',
                border: '1px solid #334155',
                color: '#f8fafc',
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              <option value="pending_review">Status: Pending Review</option>
              <option value="approved">Status: Approved</option>
              <option value="referred">Status: Referred</option>
              <option value="rejected">Status: Rejected</option>
              <option value="all">Status: All</option>
            </select>
          </div>

          {/* Sort Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowUpDown size={14} style={{ color: '#64748b' }} />
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Sort by:</span>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={e => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so);
              }}
              style={{
                padding: '7px 10px',
                borderRadius: 6,
                background: '#090d16',
                border: '1px solid #334155',
                color: '#f8fafc',
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              <option value="risk_score-desc">Risk Score (Highest First)</option>
              <option value="risk_score-asc">Risk Score (Lowest First)</option>
              <option value="created_at-desc">Submission (Newest First)</option>
              <option value="created_at-asc">Submission (Oldest First)</option>
              <option value="proposed_premium-desc">Premium (Highest First)</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
            <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px auto' }} />
            <div>Loading underwriting queue...</div>
          </div>
        ) : filteredApps.length === 0 ? (
          /* Empty State: Queue Clear */
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <ShieldCheck size={28} style={{ color: '#4ade80' }} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 8px 0' }}>
              Queue Clear
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: 440, margin: '0 auto 20px auto' }}>
              All inbound policy applications have been decided or no applications match current filter criteria.
            </p>
            <button
              onClick={() => setShowIntakeModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 6,
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#60a5fa',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Plus size={15} />
              <span>Intake New Application</span>
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e293b', background: '#0b1329', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Application ID</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Applicant</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Product</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Coverage Limit</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Proposed Premium</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Risk Score</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Submitted</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 600 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map(app => (
                  <tr
                    key={app.id}
                    onClick={() => navigate(`/underwriter/applications/${app.id}`)}
                    style={{
                      borderBottom: '1px solid #1e293b',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#131d35')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 18px', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap' }}>
                      {app.application_number}
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#93c5fd', fontSize: '0.75rem', fontWeight: 700 }}>
                          {app.applicant_name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#f8fafc' }}>{app.applicant_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{app.applicant_email}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      {getProductBadge(app.product_type)}
                    </td>

                    <td style={{ padding: '14px 18px', color: '#cbd5e1' }}>
                      ${app.coverage_amount.toLocaleString()}
                    </td>

                    <td style={{ padding: '14px 18px', fontWeight: 600, color: '#f8fafc' }}>
                      ${app.proposed_premium.toLocaleString()}/yr
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      {renderConfidencePill(app.risk_score)}
                    </td>

                    <td style={{ padding: '14px 18px', color: '#94a3b8', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {new Date(app.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          textTransform: 'capitalize',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: app.status === 'pending_review' ? '#1e293b' : app.status === 'approved' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: app.status === 'pending_review' ? '#94a3b8' : app.status === 'approved' ? '#4ade80' : '#f87171'
                        }}
                      >
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          navigate(`/underwriter/applications/${app.id}`);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          borderRadius: 5,
                          background: '#1e293b',
                          border: '1px solid #334155',
                          color: '#60a5fa',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <span>Review</span>
                        <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Intake Modal */}
      {showIntakeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, width: '100%', maxWidth: 520, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 4px 0' }}>
                  Intake Policy Application
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                  Submit a live policy application directly into the tenant's review queue.
                </p>
              </div>
              <button
                onClick={() => setShowIntakeModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleIntakeSubmit} style={{ padding: '20px 24px' }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                  Applicant Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={intakeForm.applicant_name}
                  onChange={e => setIntakeForm({ ...intakeForm, applicant_name: e.target.value })}
                  placeholder="e.g. Eleanor Vance"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: '#090d16',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                    Applicant Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={intakeForm.applicant_email}
                    onChange={e => setIntakeForm({ ...intakeForm, applicant_email: e.target.value })}
                    placeholder="eleanor@example.com"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: '#090d16',
                      border: '1px solid #334155',
                      color: '#f8fafc',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={intakeForm.applicant_phone}
                    onChange={e => setIntakeForm({ ...intakeForm, applicant_phone: e.target.value })}
                    placeholder="+1 555-019-2831"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: '#090d16',
                      border: '1px solid #334155',
                      color: '#f8fafc',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                    Product Line *
                  </label>
                  <select
                    value={intakeForm.product_type}
                    onChange={e => setIntakeForm({ ...intakeForm, product_type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: '#090d16',
                      border: '1px solid #334155',
                      color: '#f8fafc',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value="auto">Auto Insurance</option>
                    <option value="health">Health Insurance</option>
                    <option value="property">Property Insurance</option>
                    <option value="life">Life Insurance</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                    Coverage Requested ($)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="5000"
                    value={intakeForm.coverage_amount}
                    onChange={e => setIntakeForm({ ...intakeForm, coverage_amount: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: '#090d16',
                      border: '1px solid #334155',
                      color: '#f8fafc',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                    Proposed Premium ($/yr)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={intakeForm.proposed_premium}
                    onChange={e => setIntakeForm({ ...intakeForm, proposed_premium: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: '#090d16',
                      border: '1px solid #334155',
                      color: '#f8fafc',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                    Applicant Age
                  </label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={intakeForm.driver_or_subject_age}
                    onChange={e => setIntakeForm({ ...intakeForm, driver_or_subject_age: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: '#090d16',
                      border: '1px solid #334155',
                      color: '#f8fafc',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #1e293b', paddingTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setShowIntakeModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: '#94a3b8',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingIntake}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 6,
                    background: '#2563eb',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: submittingIntake ? 'not-allowed' : 'pointer',
                    opacity: submittingIntake ? 0.7 : 1
                  }}
                >
                  {submittingIntake ? 'Submitting...' : 'Submit to Queue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
