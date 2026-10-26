import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  RefreshCw,
  Shield,
  Car,
  Home,
  HeartPulse,
  Activity,
  Award,
  User,
  Download
} from 'lucide-react';
import api from '../../api';

interface AgentCommissionProps {
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

interface CommissionItem {
  id: number;
  policy_id?: number;
  policy_number: string;
  customer_id?: number;
  customer_name: string;
  product_type: string;
  event_type: string;
  premium_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: string;
  effective_date?: string;
  paid_at?: string;
  created_at: string;
}

interface CommissionSummary {
  total_earned: number;
  paid_amount: number;
  pending_amount: number;
  mtd_amount: number;
  ytd_amount: number;
  pending_count: number;
  paid_count: number;
}

export default function AgentCommission({ tenantContext, currentUser }: AgentCommissionProps) {
  const [entries, setEntries] = useState<CommissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<CommissionSummary>({
    total_earned: 0,
    paid_amount: 0,
    pending_amount: 0,
    mtd_amount: 0,
    ytd_amount: 0,
    pending_count: 0,
    paid_count: 0
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [exporting, setExporting] = useState(false);

  const fetchCommissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (eventTypeFilter !== 'all') params.append('event_type', eventTypeFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      params.append('limit', '50');

      const res = await api.get(`/api/agents/me/commission?${params.toString()}`);
      const data = res.data;
      setEntries(data.entries || []);
      if (data.summary) {
        setSummary(data.summary);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'An unexpected error occurred while fetching commission data.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, eventTypeFilter, searchQuery]);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (eventTypeFilter !== 'all') params.append('event_type', eventTypeFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await api.get(`/api/agents/me/commission/export?${params.toString()}`, {
        responseType: 'blob'
      });

      const blob = new Blob([res.data], { type: 'text/csv' });
      const contentDisposition = res.headers['content-disposition'];
      let filename = 'commission_ledger.csv';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to download CSV export');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, [fetchCommissions]);

  const getProductIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'auto':
        return <Car size={15} style={{ color: '#38bdf8' }} />;
      case 'property':
      case 'home':
        return <Home size={15} style={{ color: '#fb923c' }} />;
      case 'health':
        return <HeartPulse size={15} style={{ color: '#ec4899' }} />;
      case 'life':
        return <Activity size={15} style={{ color: '#a855f7' }} />;
      default:
        return <Shield size={15} style={{ color: '#38bdf8' }} />;
    }
  };

  const getEventBadge = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'new_business':
        return (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 4,
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase'
            }}
          >
            New Business
          </span>
        );
      case 'renewal':
        return (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 4,
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#f59e0b',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase'
            }}
          >
            Renewal
          </span>
        );
      case 'referral_bonus':
        return (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 4,
              background: 'rgba(168, 85, 247, 0.15)',
              color: '#c084fc',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase'
            }}
          >
            Referral Bonus
          </span>
        );
      default:
        return (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 4,
              background: '#1e293b',
              color: '#94a3b8',
              fontSize: '0.75rem',
              textTransform: 'capitalize'
            }}
          >
            {eventType.replace(/_/g, ' ')}
          </span>
        );
    }
  };

  const getStatusBadge = (entry: CommissionItem) => {
    if (entry.status === 'paid') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: 6,
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#10b981',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontSize: '0.75rem',
            fontWeight: 600
          }}
        >
          <CheckCircle2 size={12} />
          Paid
        </span>
      );
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 8px',
          borderRadius: 6,
          background: 'rgba(245, 158, 11, 0.15)',
          color: '#f59e0b',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          fontSize: '0.75rem',
          fontWeight: 600
        }}
      >
        <Clock size={12} />
        Pending Payout
      </span>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0b1329', color: '#f8fafc', padding: '32px 40px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header Hero */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                Commission Tracker &amp; Ledger
              </h1>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}
              >
                Earnings Hub
              </span>
            </div>
            <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
              Track earnings, statement schedules, and review payout records for {currentUser.name || currentUser.email}'s portfolio in {tenantContext.name}.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={handleExportCSV}
              disabled={exporting || loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 14px',
                borderRadius: 8,
                background: 'rgba(56, 189, 248, 0.12)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: exporting || loading ? 'not-allowed' : 'pointer',
                opacity: exporting ? 0.7 : 1
              }}
            >
              <Download size={14} className={exporting ? 'spin' : ''} />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>

            <button
              onClick={fetchCommissions}
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
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div
            style={{
              marginBottom: 20,
              padding: '12px 18px',
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
            >
              &times;
            </button>
          </div>
        )}

        {/* 4 Bento KPI Metric Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
            marginBottom: 24
          }}
        >
          {/* Card 1: MTD Commission */}
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: 12,
              padding: '18px 20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                MTD Earnings
              </span>
              <TrendingUp size={18} style={{ color: '#10b981' }} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#10b981' }}>
              ${summary.mtd_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
              Current month's book production
            </div>
          </div>

          {/* Card 2: YTD Commission */}
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: 12,
              padding: '18px 20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                YTD Gross Earnings
              </span>
              <Award size={18} style={{ color: '#38bdf8' }} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f8fafc' }}>
              ${summary.ytd_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
              Cumulative calendar year volume
            </div>
          </div>

          {/* Card 3: Pending Payout */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
            style={{
              background: '#0f172a',
              border: statusFilter === 'pending' ? '1px solid #f59e0b' : '1px solid #1e293b',
              borderRadius: 12,
              padding: '18px 20px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                Pending Payout ({summary.pending_count})
              </span>
              <Clock size={18} style={{ color: '#f59e0b' }} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f59e0b' }}>
              ${summary.pending_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#fbbf24', marginTop: 4 }}>
              Scheduled for next statement run
            </div>
          </div>

          {/* Card 4: Paid Out */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'paid' ? 'all' : 'paid')}
            style={{
              background: '#0f172a',
              border: statusFilter === 'paid' ? '1px solid #10b981' : '1px solid #1e293b',
              borderRadius: 12,
              padding: '18px 20px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                Disbursed Payouts ({summary.paid_count})
              </span>
              <CheckCircle2 size={18} style={{ color: '#10b981' }} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#10b981' }}>
              ${summary.paid_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: 4 }}>
              Successfully settled to agent account
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div
          style={{
            background: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: 12,
            padding: '14px 18px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 14
          }}
        >
          {/* Status Tab Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#0b1329', padding: 4, borderRadius: 8, border: '1px solid #1e293b' }}>
            {[
              { id: 'all', label: 'All Entries', count: summary.pending_count + summary.paid_count },
              { id: 'pending', label: 'Pending Payout', count: summary.pending_count },
              { id: 'paid', label: 'Settled', count: summary.paid_count }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: statusFilter === tab.id ? '#1e293b' : 'transparent',
                  color: statusFilter === tab.id ? '#f8fafc' : '#94a3b8',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {tab.label}
                <span
                  style={{
                    padding: '1px 6px',
                    borderRadius: 10,
                    background: statusFilter === tab.id ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.06)',
                    color: statusFilter === tab.id ? '#38bdf8' : '#64748b',
                    fontSize: '0.7rem'
                  }}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
            {/* Event Type Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={14} style={{ color: '#94a3b8' }} />
              <select
                value={eventTypeFilter}
                onChange={e => setEventTypeFilter(e.target.value)}
                style={{
                  background: '#0b1329',
                  border: '1px solid #1e293b',
                  borderRadius: 8,
                  color: '#cbd5e1',
                  padding: '6px 10px',
                  fontSize: '0.8rem',
                  outline: 'none'
                }}
              >
                <option value="all">All Events</option>
                <option value="new_business">New Business</option>
                <option value="renewal">Renewal</option>
                <option value="referral_bonus">Referral Bonus</option>
              </select>
            </div>

            {/* Search Box */}
            <div style={{ position: 'relative', minWidth: 240 }}>
              <Search
                size={14}
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search customer, policy..."
                style={{
                  width: '100%',
                  background: '#0b1329',
                  border: '1px solid #1e293b',
                  borderRadius: 8,
                  padding: '6px 12px 6px 32px',
                  color: '#f8fafc',
                  fontSize: '0.8rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        </div>

        {/* Commission Table */}
        <div
          style={{
            background: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}
        >
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
              <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px', color: '#10b981' }} />
              <div>Loading commission ledger...</div>
            </div>
          ) : entries.length === 0 ? (
            /* Empty State */
            <div style={{ padding: '64px 32px', textAlign: 'center' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}
              >
                <DollarSign size={32} style={{ color: '#10b981' }} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f1f5f9', margin: '0 0 8px' }}>
                No Commission Entries Yet
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: 480, margin: '0 auto 20px', lineHeight: 1.5 }}>
                {searchQuery || eventTypeFilter !== 'all' || statusFilter !== 'all'
                  ? 'No commission entries matched your active filter selections.'
                  : 'Commissions earned from issued policies and successful customer renewals will automatically appear here.'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#0b1329', borderBottom: '1px solid #1e293b', color: '#94a3b8' }}>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Date</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600 }}>Customer</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600 }}>Policy / Line</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600 }}>Event Type</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'right' }}>Base Premium</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'right' }}>Rate</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'right' }}>Commission</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(e => (
                    <tr
                      key={e.id}
                      style={{
                        borderBottom: '1px solid #1e293b',
                        transition: 'background 0.15s'
                      }}
                    >
                      {/* Date */}
                      <td style={{ padding: '14px 20px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        <div style={{ color: '#f1f5f9', fontWeight: 500 }}>
                          {new Date(e.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Customer */}
                      <td style={{ padding: '14px 16px', color: '#f8fafc', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <User size={13} style={{ color: '#94a3b8' }} />
                          <span>{e.customer_name}</span>
                        </div>
                      </td>

                      {/* Policy & Line */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontFamily: 'monospace', color: '#38bdf8', fontWeight: 600, fontSize: '0.85rem' }}>
                          {e.policy_number}
                        </div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#94a3b8', fontSize: '0.75rem', textTransform: 'capitalize' }}>
                          {getProductIcon(e.product_type)}
                          {e.product_type}
                        </div>
                      </td>

                      {/* Event Type */}
                      <td style={{ padding: '14px 16px' }}>
                        {getEventBadge(e.event_type)}
                      </td>

                      {/* Base Premium */}
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: '#cbd5e1' }}>
                        ${e.premium_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Rate */}
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: '#94a3b8' }}>
                        {Math.round(e.commission_rate * 100)}%
                      </td>

                      {/* Commission Amount */}
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: '#10b981', fontSize: '0.95rem' }}>
                        +${e.commission_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        {getStatusBadge(e)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
