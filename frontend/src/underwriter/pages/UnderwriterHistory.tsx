import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import api from '../../api';

interface HistoricalApplication {
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
  status: 'approved' | 'rejected' | 'referred';
  decision_note?: string;
  decided_at?: string;
  decided_by_name?: string;
  created_at: string;
}

interface UnderwriterHistoryProps {
  tenantContext: {
    id: number;
    name: string;
    subdomain: string;
  };
  currentUser: {
    id: number;
    name?: string;
    email: string;
    role: string;
  };
}

export default function UnderwriterHistory({ tenantContext }: UnderwriterHistoryProps) {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoricalApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [outcomeFilter, productFilter]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/underwriting/history', {
        params: {
          outcome: outcomeFilter,
          product_type: productFilter
        }
      });
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to load decision history', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.applicant_name.toLowerCase().includes(q) ||
      item.application_number.toLowerCase().includes(q) ||
      item.applicant_email.toLowerCase().includes(q) ||
      (item.decision_note && item.decision_note.toLowerCase().includes(q))
    );
  });

  const counts = {
    total: history.length,
    approved: history.filter(h => h.status === 'approved').length,
    referred: history.filter(h => h.status === 'referred').length,
    rejected: history.filter(h => h.status === 'rejected').length,
  };

  const renderConfidencePill = (score: number) => {
    if (score < 40) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '2px 8px',
            borderRadius: 10,
            background: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#4ade80',
            fontSize: '0.75rem',
            fontWeight: 700
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e' }} />
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
            padding: '2px 8px',
            borderRadius: 10,
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#fbbf24',
            fontSize: '0.75rem',
            fontWeight: 700
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f59e0b' }} />
          {score} med
        </span>
      );
    }
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '2px 8px',
          borderRadius: 10,
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          fontSize: '0.75rem',
          fontWeight: 700
        }}
      >
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444' }} />
        {score} high
      </span>
    );
  };

  const renderOutcomeBadge = (status: string) => {
    if (status === 'approved') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 10px',
            borderRadius: 6,
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#4ade80',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase'
          }}
        >
          <CheckCircle2 size={12} />
          Approved
        </span>
      );
    }
    if (status === 'referred') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 10px',
            borderRadius: 6,
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#fbbf24',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase'
          }}
        >
          <AlertTriangle size={12} />
          Referred
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
          borderRadius: 6,
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'uppercase'
        }}
      >
        <XCircle size={12} />
        Rejected
      </span>
    );
  };

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Decision History
          </h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.88rem' }}>
            Filterable audit archive of historical determinations, notes, and overrides for {tenantContext.name}.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 6,
            background: '#1e293b',
            border: '1px solid #334155',
            color: '#cbd5e1',
            fontSize: '0.82rem',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={14} />
          <span>Refresh Archive</span>
        </button>
      </div>

      {/* Outcome Tab Chips */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {[
          { key: 'all', label: 'All Decisions', count: counts.total },
          { key: 'approved', label: 'Approved', count: counts.approved, color: '#4ade80' },
          { key: 'referred', label: 'Referred', count: counts.referred, color: '#fbbf24' },
          { key: 'rejected', label: 'Rejected', count: counts.rejected, color: '#f87171' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setOutcomeFilter(tab.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              borderRadius: 8,
              background: outcomeFilter === tab.key ? '#1e293b' : 'transparent',
              border: `1px solid ${outcomeFilter === tab.key ? '#3b82f6' : '#1e293b'}`,
              color: outcomeFilter === tab.key ? '#f8fafc' : '#94a3b8',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <span>{tab.label}</span>
            <span
              style={{
                fontSize: '0.72rem',
                background: '#090d16',
                color: tab.color || '#94a3b8',
                padding: '1px 6px',
                borderRadius: 4,
                fontWeight: 700
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table Container */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, overflow: 'hidden' }}>
        {/* Controls Bar */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 260 }}>
            <div style={{ position: 'relative', width: 280 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: 10, color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search applicant, ID, or note..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 12px 7px 34px',
                  borderRadius: 6,
                  background: '#090d16',
                  border: '1px solid #334155',
                  color: '#f8fafc',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={13} style={{ color: '#64748b' }} />
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
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
            <History size={24} className="spin" style={{ margin: '0 auto 12px auto' }} />
            <div>Loading historical records...</div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <History size={26} style={{ color: '#60a5fa' }} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 8px 0' }}>
              No Historical Decisions Found
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', maxWidth: 440, margin: '0 auto' }}>
              No applications match the selected outcome or product filters. Once decisions are committed from the queue, they are permanently archived here.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e293b', background: '#0b1329', color: '#64748b', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Application ID</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Applicant</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Product</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Risk Score</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Final Premium</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Outcome</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Decided By</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600 }}>Decided Date</th>
                  <th style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 600 }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map(item => {
                  const isExpanded = expandedId === item.id;
                  const finalPrem = item.adjusted_premium || item.proposed_premium;
                  return (
                    <div key={item.id} style={{ display: 'contents' }}>
                      <tr
                        key={item.id}
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        style={{
                          borderBottom: '1px solid #1e293b',
                          cursor: 'pointer',
                          background: isExpanded ? '#111a33' : 'transparent',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={e => !isExpanded && (e.currentTarget.style.background = '#131d35')}
                        onMouseLeave={e => !isExpanded && (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '14px 18px', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap' }}>
                          {item.application_number}
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 600, color: '#f8fafc' }}>{item.applicant_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.applicant_email}</div>
                        </td>

                        <td style={{ padding: '14px 18px', textTransform: 'capitalize', color: '#cbd5e1' }}>
                          {item.product_type}
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          {renderConfidencePill(item.risk_score)}
                        </td>

                        <td style={{ padding: '14px 18px', fontWeight: 700, color: '#f8fafc' }}>
                          ${finalPrem.toLocaleString()}/yr
                          {item.adjusted_premium && (
                            <span style={{ fontSize: '0.7rem', color: '#fbbf24', display: 'block', fontWeight: 500 }}>
                              Adjusted
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '14px 18px' }}>
                          {renderOutcomeBadge(item.status)}
                        </td>

                        <td style={{ padding: '14px 18px', color: '#cbd5e1', fontSize: '0.82rem' }}>
                          {item.decided_by_name || 'Underwriter'}
                        </td>

                        <td style={{ padding: '14px 18px', color: '#94a3b8', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                          {item.decided_at && new Date(item.decided_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>

                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setExpandedId(isExpanded ? null : item.id);
                            }}
                            style={{
                              background: '#1e293b',
                              border: '1px solid #334155',
                              borderRadius: 4,
                              padding: 6,
                              color: '#94a3b8',
                              cursor: 'pointer'
                            }}
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Audit Defensibility Row */}
                      {isExpanded && (
                        <tr style={{ background: '#090d16', borderBottom: '1px solid #1e293b' }}>
                          <td colSpan={9} style={{ padding: '18px 22px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(280px, 1fr)', gap: 20 }}>
                              <div>
                                <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em', marginBottom: 6 }}>
                                  Underwriter Justification Note (Audit Defensibility Record)
                                </div>
                                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 6, padding: '12px 14px', color: '#e2e8f0', fontSize: '0.86rem', lineHeight: 1.5 }}>
                                  "{item.decision_note || 'No note recorded.'}"
                                </div>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 6, padding: '12px 14px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
                                    <span style={{ color: '#64748b' }}>Original Proposed:</span>
                                    <span style={{ color: '#cbd5e1', fontWeight: 600 }}>${item.proposed_premium.toLocaleString()}/yr</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
                                    <span style={{ color: '#64748b' }}>Final Rate:</span>
                                    <span style={{ color: '#4ade80', fontWeight: 700 }}>${finalPrem.toLocaleString()}/yr</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                    <span style={{ color: '#64748b' }}>Coverage Limit:</span>
                                    <span style={{ color: '#cbd5e1', fontWeight: 600 }}>${item.coverage_amount.toLocaleString()}</span>
                                  </div>
                                </div>

                                <button
                                  onClick={() => navigate(`/underwriter/applications/${item.id}`)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                    padding: '8px 14px',
                                    borderRadius: 6,
                                    background: '#1e293b',
                                    border: '1px solid #334155',
                                    color: '#60a5fa',
                                    fontSize: '0.82rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    marginTop: 10
                                  }}
                                >
                                  <span>View Full Application Dossier</span>
                                  <ExternalLink size={13} />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </div>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
