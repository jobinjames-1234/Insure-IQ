import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  Car,
  Home,
  HeartPulse,
  Activity,
  Shield,
  ChevronRight,
  User,
  Paperclip,
  ExternalLink,
  X
} from 'lucide-react';
import api from '../../api';

interface AgentApplicationsProps {
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

interface ApplicationListItem {
  id: number;
  application_number: string;
  customer_id?: number;
  applicant_name: string;
  applicant_email: string;
  applicant_phone?: string;
  product_type: string;
  coverage_amount: number;
  proposed_premium: number;
  adjusted_premium?: number;
  risk_score: number;
  risk_tier: string;
  status: string;
  document_count: number;
  decision_note?: string;
  decided_at?: string;
  decided_by_name?: string;
  created_at: string;
}

interface ApplicationDetailData extends ApplicationListItem {
  applicant_data?: Record<string, any>;
  documents?: Array<{
    id?: string;
    name?: string;
    type?: string;
    doc_type?: string;
    size_bytes?: number;
    uploaded_at?: string;
    uploaded_by?: string;
    description?: string;
  }>;
}

export default function AgentApplications({ tenantContext, currentUser }: AgentApplicationsProps) {
  const navigate = useNavigate();

  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({
    all: 0,
    pending_review: 0,
    approved: 0,
    rejected: 0,
    referred: 0
  });

  // Slide-over Modal State
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [selectedAppDetail, setSelectedAppDetail] = useState<ApplicationDetailData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (productFilter !== 'all') params.append('product_type', productFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      params.append('limit', '50');

      const res = await api.get(`/api/agents/me/applications?${params.toString()}`);
      const data = res.data;
      setApplications(data.applications || []);
      setTotalCount(data.total || 0);
      if (data.status_counts) {
        setStatusCounts(data.status_counts);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'An unexpected error occurred while loading applications.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, productFilter, searchQuery]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const fetchApplicationDetail = async (appId: number) => {
    setSelectedAppId(appId);
    setLoadingDetail(true);
    setDetailError(null);
    try {
      const res = await api.get(`/api/agents/me/applications/${appId}`);
      setSelectedAppDetail(res.data);
    } catch (err: any) {
      setDetailError(err.response?.data?.detail || err.message || 'Failed to load application dossier.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          text: '#34d399',
          border: 'rgba(16, 185, 129, 0.3)',
          icon: CheckCircle2,
          label: 'Approved'
        };
      case 'rejected':
        return {
          bg: 'rgba(239, 68, 68, 0.15)',
          text: '#f87171',
          border: 'rgba(239, 68, 68, 0.3)',
          icon: XCircle,
          label: 'Rejected'
        };
      case 'referred':
        return {
          bg: 'rgba(168, 85, 247, 0.15)',
          text: '#c084fc',
          border: 'rgba(168, 85, 247, 0.3)',
          icon: HelpCircle,
          label: 'Referred'
        };
      default:
        return {
          bg: 'rgba(251, 146, 60, 0.15)',
          text: '#fb923c',
          border: 'rgba(251, 146, 60, 0.3)',
          icon: Clock,
          label: 'Pending Review'
        };
    }
  };

  const getProductIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'auto':
        return <Car size={16} style={{ color: '#38bdf8' }} />;
      case 'property':
      case 'home':
        return <Home size={16} style={{ color: '#fb923c' }} />;
      case 'health':
        return <HeartPulse size={16} style={{ color: '#ec4899' }} />;
      case 'life':
        return <Activity size={16} style={{ color: '#a855f7' }} />;
      default:
        return <Shield size={16} style={{ color: '#38bdf8' }} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0b1329', color: '#f8fafc', padding: '32px 40px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header Hero */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 6px', color: '#f8fafc' }}>
              Policy Applications & Status Tracking
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
              Monitor underwriting progress, risk ratings, and review decisions for {currentUser.name || currentUser.email}'s portfolio in {tenantContext.name}.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={fetchApplications}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 14px',
                borderRadius: 8,
                background: '#1e293b',
                color: '#cbd5e1',
                border: '1px solid #334155',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => navigate('/agent/applications/new')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                borderRadius: 8,
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(2, 132, 199, 0.3)'
              }}
            >
              <Plus size={16} />
              <span>New Application</span>
            </button>
          </div>
        </div>

        {/* Bento KPI Summary Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 24
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: 12,
              padding: '20px 24px'
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Submitted
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f8fafc', margin: '8px 0 2px' }}>
              {statusCounts.all}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
              All applications filed by you
            </div>
          </div>

          <div
            style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: 12,
              padding: '20px 24px'
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fb923c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pending Underwriting
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fb923c', margin: '8px 0 2px' }}>
              {statusCounts.pending_review}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Awaiting underwriter decision
            </div>
          </div>

          <div
            style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: 12,
              padding: '20px 24px'
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Approved
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#34d399', margin: '8px 0 2px' }}>
              {statusCounts.approved}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Converted into active policies
            </div>
          </div>

          <div
            style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: 12,
              padding: '20px 24px'
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Rejected / Referred
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f87171', margin: '8px 0 2px' }}>
              {statusCounts.rejected + statusCounts.referred}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Requires modification or appeal
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div
          style={{
            background: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}
        >
          {/* Status Tab Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All', count: statusCounts.all },
              { id: 'pending_review', label: 'Pending Review', count: statusCounts.pending_review },
              { id: 'approved', label: 'Approved', count: statusCounts.approved },
              { id: 'rejected', label: 'Rejected', count: statusCounts.rejected },
              { id: 'referred', label: 'Referred', count: statusCounts.referred }
            ].map((tab) => {
              const isSelected = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 20,
                    background: isSelected ? '#0284c7' : '#1e293b',
                    color: isSelected ? '#ffffff' : '#94a3b8',
                    border: `1px solid ${isSelected ? '#38bdf8' : '#334155'}`,
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{tab.label}</span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      padding: '1px 6px',
                      borderRadius: 10,
                      background: isSelected ? 'rgba(255, 255, 255, 0.2)' : '#090e1a',
                      color: isSelected ? '#ffffff' : '#cbd5e1'
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Product Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 280px' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: 11, color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search by applicant name, email, or APP reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: '#090e1a',
                  border: '1px solid #1e293b',
                  borderRadius: 8,
                  padding: '8px 12px 8px 36px',
                  color: '#f8fafc',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Product:</span>
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                style={{
                  background: '#090e1a',
                  border: '1px solid #1e293b',
                  borderRadius: 8,
                  padding: '8px 12px',
                  color: '#f8fafc',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              >
                <option value="all">All Products</option>
                <option value="auto">Auto Insurance</option>
                <option value="property">Property / Home</option>
                <option value="life">Term Life</option>
                <option value="health">Health & Medical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications List Table / Card Feed */}
        {loading ? (
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: 12,
              padding: '60px 24px',
              textAlign: 'center'
            }}
          >
            <RefreshCw size={28} className="spin" style={{ color: '#38bdf8', margin: '0 auto 12px' }} />
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Loading policy applications...</p>
          </div>
        ) : error ? (
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 12,
              padding: '32px 24px',
              textAlign: 'center'
            }}
          >
            <AlertCircle size={32} style={{ color: '#f87171', margin: '0 auto 12px' }} />
            <p style={{ color: '#f87171', fontSize: '0.95rem', margin: '0 0 16px' }}>{error}</p>
            <button
              onClick={fetchApplications}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                background: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #334155',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        ) : applications.length === 0 ? (
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: 12,
              padding: '64px 32px',
              textAlign: 'center'
            }}
          >
            <FileText size={40} style={{ color: '#64748b', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f1f5f9', margin: '0 0 8px' }}>
              No Applications Found
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', maxWidth: 440, margin: '0 auto 24px' }}>
              {searchQuery || statusFilter !== 'all' || productFilter !== 'all'
                ? 'No policy applications match your active filters. Try resetting the search or status filter.'
                : 'You have not submitted any policy applications yet. Click below to start an assisted intake on behalf of a customer.'}
            </p>
            <button
              onClick={() => navigate('/agent/applications/new')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 22px',
                borderRadius: 8,
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              <Plus size={16} />
              <span>Start New Application</span>
            </button>
          </div>
        ) : (
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#090e1a', borderBottom: '1px solid #1e293b', color: '#94a3b8' }}>
                    <th style={{ padding: '14px 18px', fontWeight: 600 }}>Application Ref</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600 }}>Applicant</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600 }}>Product Line</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600 }}>Coverage & Premium</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600 }}>Risk Rating</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600 }}>Submitted</th>
                    <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => {
                    const badge = getStatusBadge(app.status);
                    const StatusIcon = badge.icon;
                    const dateFormatted = new Date(app.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    });

                    return (
                      <tr
                        key={app.id}
                        style={{
                          borderBottom: '1px solid #1e293b',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#15203b')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* Application Ref */}
                        <td style={{ padding: '16px 18px' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              color: '#38bdf8',
                              fontSize: '0.85rem'
                            }}
                          >
                            {app.application_number}
                          </span>
                          {app.document_count > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94a3b8', fontSize: '0.72rem', marginTop: 2 }}>
                              <Paperclip size={11} />
                              <span>{app.document_count} doc{app.document_count > 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </td>

                        {/* Applicant Name & Email */}
                        <td style={{ padding: '16px 18px' }}>
                          <div style={{ fontWeight: 600, color: '#f8fafc' }}>
                            {app.applicant_name}
                          </div>
                          <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                            {app.applicant_email}
                          </div>
                        </td>

                        {/* Product Line */}
                        <td style={{ padding: '16px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {getProductIcon(app.product_type)}
                            <span style={{ fontWeight: 500, color: '#cbd5e1', textTransform: 'capitalize' }}>
                              {app.product_type}
                            </span>
                          </div>
                        </td>

                        {/* Coverage & Premium */}
                        <td style={{ padding: '16px 18px' }}>
                          <div style={{ fontWeight: 600, color: '#f8fafc' }}>
                            ${app.coverage_amount.toLocaleString()} limit
                          </div>
                          <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                            ${app.proposed_premium.toLocaleString()}/yr
                          </div>
                        </td>

                        {/* Risk Rating */}
                        <td style={{ padding: '16px 18px' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 4,
                              background: 'rgba(2, 132, 199, 0.12)',
                              color: '#38bdf8',
                              border: '1px solid rgba(2, 132, 199, 0.25)',
                              textTransform: 'capitalize'
                            }}
                          >
                            {app.risk_tier} ({app.risk_score})
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '16px 18px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              padding: '3px 10px',
                              borderRadius: 6,
                              background: badge.bg,
                              color: badge.text,
                              border: `1px solid ${badge.border}`
                            }}
                          >
                            <StatusIcon size={12} />
                            <span>{badge.label}</span>
                          </span>
                        </td>

                        {/* Submitted Date */}
                        <td style={{ padding: '16px 18px', color: '#94a3b8', fontSize: '0.8rem' }}>
                          {dateFormatted}
                        </td>

                        {/* Action */}
                        <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                          <button
                            onClick={() => fetchApplicationDetail(app.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '6px 12px',
                              borderRadius: 6,
                              background: '#1e293b',
                              color: '#38bdf8',
                              border: '1px solid #334155',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            <span>Dossier</span>
                            <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div
              style={{
                padding: '14px 20px',
                background: '#090e1a',
                borderTop: '1px solid #1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
                color: '#94a3b8'
              }}
            >
              <span>Showing {applications.length} of {totalCount} applications</span>
              <span>Updated in real-time</span>
            </div>
          </div>
        )}

        {/* Slide-over Application Details Modal */}
        {selectedAppId && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              justifyContent: 'flex-end',
              zIndex: 100
            }}
            onClick={() => {
              setSelectedAppId(null);
              setSelectedAppDetail(null);
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 620,
                height: '100vh',
                background: '#0b1329',
                borderLeft: '1px solid #1e293b',
                padding: '32px',
                overflowY: 'auto',
                boxSizing: 'border-box'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Application Review Dossier
                  </span>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', margin: '4px 0 0' }}>
                    {selectedAppDetail ? selectedAppDetail.application_number : `Application #${selectedAppId}`}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setSelectedAppId(null);
                    setSelectedAppDetail(null);
                  }}
                  style={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 6,
                    padding: '6px',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {loadingDetail ? (
                <div style={{ textAlign: 'center', paddingTop: 60 }}>
                  <RefreshCw size={24} className="spin" style={{ color: '#38bdf8', margin: '0 auto 12px' }} />
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Loading application details...</p>
                </div>
              ) : detailError ? (
                <div style={{ padding: 20, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 8, color: '#f87171' }}>
                  {detailError}
                </div>
              ) : selectedAppDetail ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                  {/* Underwriting Status Card */}
                  <div
                    style={{
                      background: '#0f172a',
                      border: '1px solid #1e293b',
                      borderRadius: 12,
                      padding: '20px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                        Underwriting Outcome
                      </span>
                      {(() => {
                        const b = getStatusBadge(selectedAppDetail.status);
                        const BIcon = b.icon;
                        return (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              padding: '3px 10px',
                              borderRadius: 6,
                              background: b.bg,
                              color: b.text,
                              border: `1px solid ${b.border}`
                            }}
                          >
                            <BIcon size={12} />
                            <span>{b.label}</span>
                          </span>
                        );
                      })()}
                    </div>

                    {selectedAppDetail.status === 'pending_review' ? (
                      <p style={{ color: '#fb923c', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                        This application is currently waiting in the {tenantContext.name} underwriting queue. An underwriter will evaluate the risk factors, eligibility rules, and document evidence.
                      </p>
                    ) : (
                      <div>
                        {selectedAppDetail.decided_by_name && (
                          <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginBottom: 6 }}>
                            Decision by: <strong>{selectedAppDetail.decided_by_name}</strong>
                            {selectedAppDetail.decided_at && (
                              <span style={{ color: '#64748b' }}> · {new Date(selectedAppDetail.decided_at).toLocaleString()}</span>
                            )}
                          </div>
                        )}
                        {selectedAppDetail.decision_note && (
                          <div style={{ background: '#090e1a', padding: '12px 14px', borderRadius: 8, border: '1px solid #1e293b', fontSize: '0.85rem', color: '#f1f5f9' }}>
                            <strong>Justification Note:</strong>
                            <p style={{ margin: '4px 0 0', color: '#cbd5e1', fontStyle: 'italic' }}>
                              "{selectedAppDetail.decision_note}"
                            </p>
                          </div>
                        )}
                        {selectedAppDetail.adjusted_premium && (
                          <div style={{ marginTop: 10, fontSize: '0.82rem', color: '#34d399' }}>
                            Final Approved Premium: <strong>${selectedAppDetail.adjusted_premium.toLocaleString()}/yr</strong>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Applicant Details Bento */}
                  <div
                    style={{
                      background: '#0f172a',
                      border: '1px solid #1e293b',
                      borderRadius: 12,
                      padding: '20px'
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 12 }}>
                      Applicant & Financial Limits
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Applicant Name</span>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc' }}>
                          {selectedAppDetail.applicant_name}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Email Address</span>
                        <div style={{ fontSize: '0.85rem', color: '#f8fafc' }}>
                          {selectedAppDetail.applicant_email}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Product Line</span>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#38bdf8', textTransform: 'capitalize' }}>
                          {selectedAppDetail.product_type}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Requested Coverage</span>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                          ${selectedAppDetail.coverage_amount.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {selectedAppDetail.customer_id && (
                      <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #1e293b' }}>
                        <button
                          onClick={() => navigate(`/agent/customers/${selectedAppDetail.customer_id}`)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: 'transparent',
                            border: 'none',
                            color: '#38bdf8',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          <User size={13} />
                          <span>Open Complete Customer Dossier</span>
                          <ExternalLink size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Attached Documents */}
                  <div
                    style={{
                      background: '#0f172a',
                      border: '1px solid #1e293b',
                      borderRadius: 12,
                      padding: '20px'
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 12 }}>
                      Attached Evidence Documents ({selectedAppDetail.documents?.length || 0})
                    </div>
                    {(!selectedAppDetail.documents || selectedAppDetail.documents.length === 0) ? (
                      <p style={{ color: '#64748b', fontSize: '0.82rem', margin: 0, fontStyle: 'italic' }}>
                        No KYC or supplemental evidence documents attached.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {selectedAppDetail.documents.map((d, idx) => (
                          <div
                            key={d.id || idx}
                            style={{
                              background: '#090e1a',
                              border: '1px solid #1e293b',
                              borderRadius: 6,
                              padding: '10px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <FileText size={15} style={{ color: '#38bdf8' }} />
                              <span style={{ fontSize: '0.82rem', color: '#f8fafc', fontWeight: 500 }}>
                                {d.name || 'Document'}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 600 }}>
                              Verified
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              ) : null}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
