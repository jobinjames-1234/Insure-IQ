import { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Clock,
  CheckCircle,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Shield,
  Car,
  Home,
  HeartPulse,
  Activity,
  Phone,
  Mail,
  ChevronRight,
  Sparkles,
  UserCheck,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Send,
  History,
  Check
} from 'lucide-react';
import api from '../../api';

interface AgentRetentionAlertsProps {
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

interface RetentionAlertItem {
  id: number;
  policy_id?: number;
  policy_number: string;
  customer_id?: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  product_type: string;
  alert_type: string;
  churn_reason?: string;
  renewal_date?: string;
  days_remaining: number;
  urgency: 'critical' | 'moderate' | 'standard';
  status: string;
  resolved_at?: string;
  resolution_note?: string;
  created_at: string;
}

interface OutreachLogItem {
  id: number;
  alert_id?: number;
  customer_id?: number;
  agent_id: number;
  agent_name: string;
  contact_method: string;
  outcome: string;
  notes?: string;
  logged_at: string;
}

export default function AgentRetentionAlerts({ tenantContext, currentUser }: AgentRetentionAlertsProps) {
  const [alerts, setAlerts] = useState<RetentionAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Counters
  const [counts, setCounts] = useState({
    total: 0,
    open_count: 0,
    resolved_count: 0,
    critical_count: 0,
    moderate_count: 0
  });

  // Filter States
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Scanning state
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Slide-over detail drawer
  const [selectedAlert, setSelectedAlert] = useState<RetentionAlertItem | null>(null);
  const [outreachHistory, setOutreachHistory] = useState<OutreachLogItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Outreach Modal State
  const [outreachModalAlert, setOutreachModalAlert] = useState<RetentionAlertItem | null>(null);
  const [contactMethod, setContactMethod] = useState<string>('call');
  const [outreachOutcome, setOutreachOutcome] = useState<string>('contacted_renewing');
  const [outreachNotes, setOutreachNotes] = useState<string>('');
  const [submittingOutreach, setSubmittingOutreach] = useState(false);
  const [outreachSuccess, setOutreachSuccess] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (urgencyFilter !== 'all') params.append('urgency', urgencyFilter);
      if (typeFilter !== 'all') params.append('alert_type', typeFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      params.append('limit', '50');

      const res = await api.get(`/api/agents/me/retention-alerts?${params.toString()}`);
      const data = res.data;
      setAlerts(data.alerts || []);
      setCounts({
        total: data.total || 0,
        open_count: data.open_count || 0,
        resolved_count: data.resolved_count || 0,
        critical_count: data.critical_count || 0,
        moderate_count: data.moderate_count || 0
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load retention alerts.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, urgencyFilter, typeFilter, searchQuery]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Load outreach history when an alert is selected in the drawer
  useEffect(() => {
    if (!selectedAlert) {
      setOutreachHistory([]);
      return;
    }
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const res = await api.get(`/api/agents/me/retention-alerts/${selectedAlert.id}/outreach`);
        setOutreachHistory(res.data);
      } catch (err) {
        console.error('Failed to load outreach history:', err);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [selectedAlert]);

  const handleScanPortfolio = async () => {
    setScanning(true);
    setScanMessage(null);
    try {
      const res = await api.post('/api/agents/me/retention-alerts/scan');
      const result = res.data;
      setScanMessage(
        `Scan complete: Checked ${result.scanned_policies} policies, generated ${result.new_alerts_created} new retention alert(s).`
      );
      fetchAlerts();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Error initiating automated portfolio retention scan.');
    } finally {
      setScanning(false);
    }
  };

  const handleLogOutreachSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outreachModalAlert) return;

    setSubmittingOutreach(true);
    setError(null);
    try {
      const res = await api.post(`/api/agents/me/retention-alerts/${outreachModalAlert.id}/outreach`, {
        contact_method: contactMethod,
        outcome: outreachOutcome,
        notes: outreachNotes.trim() || undefined
      });

      const data = res.data;
      setOutreachSuccess(
        data.policy_renewed
          ? `Outreach logged! Policy renewed and alert #${outreachModalAlert.id} marked as resolved.`
          : `Outreach logged successfully on alert #${outreachModalAlert.id}.`
      );

      // Close modal & reset form
      setOutreachModalAlert(null);
      setOutreachNotes('');
      setContactMethod('call');
      setOutreachOutcome('contacted_renewing');

      // Refresh list
      fetchAlerts();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to record outreach touchpoint.');
    } finally {
      setSubmittingOutreach(false);
    }
  };

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

  const getUrgencyBadge = (alert: RetentionAlertItem) => {
    if (alert.status === 'resolved') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 8px',
            borderRadius: 6,
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#10b981',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontSize: '0.75rem',
            fontWeight: 600
          }}
        >
          <CheckCircle2 size={12} />
          Resolved
        </span>
      );
    }

    if (alert.days_remaining <= 7) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 8px',
            borderRadius: 6,
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            fontSize: '0.75rem',
            fontWeight: 700
          }}
        >
          <AlertCircle size={12} />
          Critical ({alert.days_remaining}d left)
        </span>
      );
    } else if (alert.days_remaining <= 14) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 8px',
            borderRadius: 6,
            background: 'rgba(245, 158, 11, 0.15)',
            color: '#f59e0b',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            fontSize: '0.75rem',
            fontWeight: 600
          }}
        >
          <AlertTriangle size={12} />
          Moderate ({alert.days_remaining}d left)
        </span>
      );
    } else {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 8px',
            borderRadius: 6,
            background: 'rgba(56, 189, 248, 0.12)',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            fontSize: '0.75rem',
            fontWeight: 500
          }}
        >
          <Clock size={12} />
          Standard ({alert.days_remaining}d left)
        </span>
      );
    }
  };

  const formatOutcomeLabel = (outcome: string) => {
    switch (outcome) {
      case 'contacted_renewing':
        return 'Confirmed Renewal';
      case 'left_message':
        return 'Left Voicemail';
      case 'unreachable':
        return 'Unreachable';
      case 'not_renewing':
        return 'Declined Renewal';
      default:
        return outcome.replace(/_/g, ' ');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0b1329', color: '#f8fafc', padding: '32px 40px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header Hero */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                Retention Alerts &amp; Proactive Outreach
              </h1>
              <span
                style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#f59e0b',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}
              >
                Retention Hub
              </span>
            </div>
            <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
              Protect renewals and prevent policy churn for {currentUser.name || currentUser.email}'s portfolio in {tenantContext.name}.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={handleScanPortfolio}
              disabled={scanning}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 15px',
                borderRadius: 8,
                background: scanning ? '#1e293b' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: scanning ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
              }}
            >
              <Sparkles size={15} className={scanning ? 'spin' : ''} />
              {scanning ? 'Auditing Policies...' : 'Scan Portfolio'}
            </button>

            <button
              onClick={fetchAlerts}
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

        {/* Success Banners */}
        {outreachSuccess && (
          <div
            style={{
              marginBottom: 20,
              padding: '12px 18px',
              borderRadius: 8,
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34d399',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={16} />
              <span>{outreachSuccess}</span>
            </div>
            <button
              onClick={() => setOutreachSuccess(null)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              Dismiss
            </button>
          </div>
        )}

        {scanMessage && (
          <div
            style={{
              marginBottom: 20,
              padding: '12px 18px',
              borderRadius: 8,
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={16} />
              <span>{scanMessage}</span>
            </div>
            <button
              onClick={() => setScanMessage(null)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              Dismiss
            </button>
          </div>
        )}

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
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
          {/* Card 1: Open Alerts */}
          <div
            onClick={() => { setStatusFilter('open'); setUrgencyFilter('all'); }}
            style={{
              background: '#0f172a',
              border: statusFilter === 'open' && urgencyFilter === 'all' ? '1px solid #f59e0b' : '1px solid #1e293b',
              borderRadius: 12,
              padding: '18px 20px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                Open Retention Alerts
              </span>
              <AlertCircle size={18} style={{ color: '#f59e0b' }} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f8fafc' }}>
              {counts.open_count}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: 4 }}>
              Active churn risk opportunities
            </div>
          </div>

          {/* Card 2: Critical Urgency */}
          <div
            onClick={() => { setStatusFilter('open'); setUrgencyFilter('critical'); }}
            style={{
              background: '#0f172a',
              border: urgencyFilter === 'critical' ? '1px solid #ef4444' : '1px solid #1e293b',
              borderRadius: 12,
              padding: '18px 20px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                Critical (≤ 7 Days)
              </span>
              <AlertTriangle size={18} style={{ color: '#ef4444' }} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#ef4444' }}>
              {counts.critical_count}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#f87171', marginTop: 4 }}>
              Requires immediate agent contact
            </div>
          </div>

          {/* Card 3: Moderate Urgency */}
          <div
            onClick={() => { setStatusFilter('open'); setUrgencyFilter('moderate'); }}
            style={{
              background: '#0f172a',
              border: urgencyFilter === 'moderate' ? '1px solid #f59e0b' : '1px solid #1e293b',
              borderRadius: 12,
              padding: '18px 20px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                Moderate (8–14 Days)
              </span>
              <Clock size={18} style={{ color: '#f59e0b' }} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f59e0b' }}>
              {counts.moderate_count}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#fbbf24', marginTop: 4 }}>
              Renewal outreach window open
            </div>
          </div>

          {/* Card 4: Resolved */}
          <div
            onClick={() => { setStatusFilter('resolved'); setUrgencyFilter('all'); }}
            style={{
              background: '#0f172a',
              border: statusFilter === 'resolved' ? '1px solid #10b981' : '1px solid #1e293b',
              borderRadius: 12,
              padding: '18px 20px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                Resolved / Retained
              </span>
              <UserCheck size={18} style={{ color: '#10b981' }} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#10b981' }}>
              {counts.resolved_count}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: 4 }}>
              Completed retention engagements
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
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
              { id: 'open', label: 'Open Worklist', count: counts.open_count },
              { id: 'resolved', label: 'Resolved', count: counts.resolved_count },
              { id: 'all', label: 'All Alerts', count: counts.open_count + counts.resolved_count }
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
                    background: statusFilter === tab.id ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.06)',
                    color: statusFilter === tab.id ? '#f59e0b' : '#64748b',
                    fontSize: '0.7rem'
                  }}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
            {/* Urgency Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={14} style={{ color: '#94a3b8' }} />
              <select
                value={urgencyFilter}
                onChange={e => setUrgencyFilter(e.target.value)}
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
                <option value="all">All Urgencies</option>
                <option value="critical">Critical (≤ 7d)</option>
                <option value="moderate">Moderate (8–14d)</option>
                <option value="standard">Standard (15–30d)</option>
              </select>
            </div>

            {/* Alert Type Filter */}
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
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
              <option value="all">All Alert Types</option>
              <option value="upcoming_renewal">Upcoming Renewal</option>
              <option value="lapse_risk">Lapse Risk</option>
              <option value="non_payment">Non-Payment</option>
            </select>

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

        {/* Worklist Table */}
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
              <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px', color: '#f59e0b' }} />
              <div>Loading retention worklist...</div>
            </div>
          ) : alerts.length === 0 ? (
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
                <CheckCircle2 size={32} style={{ color: '#10b981' }} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f1f5f9', margin: '0 0 8px' }}>
                No Active Retention Alerts — Great Work!
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: 480, margin: '0 auto 20px', lineHeight: 1.5 }}>
                {searchQuery || urgencyFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'open'
                  ? 'No retention alerts matched your current filter selection.'
                  : 'All assigned policies in your portfolio are currently up-to-date with no pending churn risks.'}
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={handleScanPortfolio}
                  disabled={scanning}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: '#1e293b',
                    color: '#f59e0b',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  <Sparkles size={14} />
                  Scan Portfolio for Expirations
                </button>
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#0b1329', borderBottom: '1px solid #1e293b', color: '#94a3b8' }}>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Customer</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600 }}>Policy &amp; Line</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600 }}>Expiration</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600 }}>Urgency / Days</th>
                    <th style={{ padding: '14px 16px', fontWeight: 600 }}>Churn Risk Reason</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map(a => {
                    const isCritical = a.days_remaining <= 7 && a.status === 'open';
                    return (
                      <tr
                        key={a.id}
                        style={{
                          borderBottom: '1px solid #1e293b',
                          background: isCritical ? 'rgba(239, 68, 68, 0.03)' : 'transparent',
                          transition: 'background 0.15s'
                        }}
                      >
                        {/* Customer */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontWeight: 600, color: '#f8fafc', marginBottom: 3 }}>
                            {a.customer_name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#94a3b8', fontSize: '0.75rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Mail size={12} />
                              {a.customer_email}
                            </span>
                            {a.customer_phone && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Phone size={12} />
                                {a.customer_phone}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Policy & Line */}
                        <td style={{ padding: '16px 16px' }}>
                          <div style={{ fontFamily: 'monospace', color: '#cbd5e1', fontWeight: 600, marginBottom: 4 }}>
                            {a.policy_number}
                          </div>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 4, background: '#1e293b', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'capitalize' }}>
                            {getProductIcon(a.product_type)}
                            {a.product_type}
                          </div>
                        </td>

                        {/* Renewal Date */}
                        <td style={{ padding: '16px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#e2e8f0' }}>
                            <Calendar size={13} style={{ color: '#94a3b8' }} />
                            <span>
                              {a.renewal_date ? new Date(a.renewal_date).toLocaleDateString() : 'Pending'}
                            </span>
                          </div>
                        </td>

                        {/* Urgency Badge */}
                        <td style={{ padding: '16px 16px' }}>
                          {getUrgencyBadge(a)}
                        </td>

                        {/* Churn Risk */}
                        <td style={{ padding: '16px 16px', maxWidth: 260 }}>
                          <div style={{ color: '#cbd5e1', fontSize: '0.8rem', lineHeight: 1.4 }}>
                            {a.churn_reason || (a.alert_type === 'upcoming_renewal' ? 'Policy expiration approaching within 30-day window' : 'Elevated risk of policy non-renewal')}
                          </div>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                            {a.status === 'open' && (
                              <button
                                onClick={() => setOutreachModalAlert(a)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  padding: '6px 12px',
                                  borderRadius: 6,
                                  background: 'rgba(245, 158, 11, 0.15)',
                                  color: '#f59e0b',
                                  border: '1px solid rgba(245, 158, 11, 0.35)',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                <MessageSquare size={13} />
                                Log Outreach
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedAlert(a)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '6px 12px',
                                borderRadius: 6,
                                background: '#1e293b',
                                color: '#94a3b8',
                                border: '1px solid #334155',
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                              }}
                            >
                              Details
                              <ChevronRight size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Log Outreach Activity */}
        {outreachModalAlert && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              zIndex: 1100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
              backdropFilter: 'blur(3px)'
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 520,
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: 14,
                padding: '28px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
              }}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: 'rgba(245, 158, 11, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <MessageSquare size={18} style={{ color: '#f59e0b' }} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: 600 }}>
                      Log Retention Outreach
                    </h3>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: 2 }}>
                      Record proactive engagement for {outreachModalAlert.customer_name}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setOutreachModalAlert(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  <XCircle size={20} />
                </button>
              </div>

              {/* Policy & Urgency Context Badge */}
              <div
                style={{
                  background: '#0b1329',
                  border: '1px solid #1e293b',
                  borderRadius: 8,
                  padding: '12px 16px',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
                    Policy
                  </div>
                  <div style={{ fontFamily: 'monospace', color: '#38bdf8', fontWeight: 600, fontSize: '0.9rem' }}>
                    {outreachModalAlert.policy_number} ({outreachModalAlert.product_type})
                  </div>
                </div>
                {getUrgencyBadge(outreachModalAlert)}
              </div>

              {/* Form */}
              <form onSubmit={handleLogOutreachSubmit}>
                {/* Contact Method */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                    Contact Method <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {[
                      { id: 'call', label: 'Call', icon: Phone },
                      { id: 'email', label: 'Email', icon: Mail },
                      { id: 'sms', label: 'SMS', icon: MessageSquare },
                      { id: 'in_person', label: 'In-Person', icon: UserCheck }
                    ].map(m => {
                      const Icon = m.icon;
                      const active = contactMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setContactMethod(m.id)}
                          style={{
                            padding: '10px 8px',
                            borderRadius: 8,
                            border: active ? '1px solid #f59e0b' : '1px solid #1e293b',
                            background: active ? 'rgba(245, 158, 11, 0.15)' : '#0b1329',
                            color: active ? '#f59e0b' : '#94a3b8',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <Icon size={16} />
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Outcome */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                    Outreach Outcome <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={outreachOutcome}
                    onChange={e => setOutreachOutcome(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#0b1329',
                      border: '1px solid #1e293b',
                      borderRadius: 8,
                      color: '#f8fafc',
                      padding: '10px 12px',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  >
                    <option value="contacted_renewing">
                      Customer Confirmed Renewal — Mark Resolved &amp; Extend Policy (Recommended)
                    </option>
                    <option value="left_message">
                      Left Voicemail / Follow-Up Scheduled
                    </option>
                    <option value="unreachable">
                      Unreachable / No Answer
                    </option>
                    <option value="not_renewing">
                      Customer Declines Renewal / Churned
                    </option>
                  </select>
                  {outreachOutcome === 'contacted_renewing' && (
                    <div style={{ marginTop: 6, fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Check size={12} />
                      Selecting this marks the alert as Resolved and adds 1 year to the policy expiration date.
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                    Outreach Notes &amp; Follow-up Details
                  </label>
                  <textarea
                    rows={3}
                    value={outreachNotes}
                    onChange={e => setOutreachNotes(e.target.value)}
                    placeholder="Enter discussion notes, agreed coverage adjustments, or scheduled follow-up time..."
                    maxLength={1000}
                    style={{
                      width: '100%',
                      background: '#0b1329',
                      border: '1px solid #1e293b',
                      borderRadius: 8,
                      color: '#f8fafc',
                      padding: '10px 12px',
                      fontSize: '0.85rem',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
                    {outreachNotes.length} / 1000
                  </div>
                </div>

                {/* Modal Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setOutreachModalAlert(null)}
                    disabled={submittingOutreach}
                    style={{
                      padding: '9px 16px',
                      borderRadius: 8,
                      background: '#1e293b',
                      color: '#94a3b8',
                      border: '1px solid #334155',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingOutreach}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '9px 18px',
                      borderRadius: 8,
                      background: submittingOutreach ? '#1e293b' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: submittingOutreach ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
                    }}
                  >
                    <Send size={14} className={submittingOutreach ? 'spin' : ''} />
                    {submittingOutreach ? 'Saving...' : 'Log Activity'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Slide-over Detail Drawer */}
        {selectedAlert && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              zIndex: 1000,
              display: 'flex',
              justifyContent: 'flex-end',
              backdropFilter: 'blur(3px)'
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 500,
                background: '#0f172a',
                borderLeft: '1px solid #1e293b',
                height: '100%',
                overflowY: 'auto',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Drawer Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={20} style={{ color: '#f59e0b' }} />
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: 600 }}>
                    Retention Alert Dossier
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedAlert(null)}
                  style={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 6,
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px 8px'
                  }}
                >
                  <XCircle size={18} />
                </button>
              </div>

              {/* Urgency Banner */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 8,
                  marginBottom: 20,
                  background: selectedAlert.days_remaining <= 7 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  border: selectedAlert.days_remaining <= 7 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>
                    Alert Status
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: selectedAlert.days_remaining <= 7 ? '#ef4444' : '#f59e0b', textTransform: 'capitalize' }}>
                    {selectedAlert.status} &bull; {selectedAlert.days_remaining} Days Remaining
                  </div>
                </div>
                {getUrgencyBadge(selectedAlert)}
              </div>

              {/* Customer Information */}
              <div style={{ background: '#0b1329', padding: 16, borderRadius: 8, border: '1px solid #1e293b', marginBottom: 16 }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, marginBottom: 8 }}>
                  Customer Details
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', marginBottom: 4 }}>
                  {selectedAlert.customer_name}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 4 }}>
                  Email: {selectedAlert.customer_email}
                </div>
                {selectedAlert.customer_phone && (
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    Phone: {selectedAlert.customer_phone}
                  </div>
                )}
              </div>

              {/* Policy Information */}
              <div style={{ background: '#0b1329', padding: 16, borderRadius: 8, border: '1px solid #1e293b', marginBottom: 16 }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, marginBottom: 8 }}>
                  Policy Record
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Policy Number:</span>
                  <span style={{ fontFamily: 'monospace', color: '#38bdf8', fontWeight: 600 }}>
                    {selectedAlert.policy_number}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Product Line:</span>
                  <span style={{ textTransform: 'capitalize', color: '#cbd5e1', fontSize: '0.85rem' }}>
                    {selectedAlert.product_type}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Scheduled Expiration:</span>
                  <span style={{ color: '#f8fafc', fontSize: '0.85rem', fontWeight: 500 }}>
                    {selectedAlert.renewal_date ? new Date(selectedAlert.renewal_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Churn Risk Evaluation */}
              <div style={{ background: '#0b1329', padding: 16, borderRadius: 8, border: '1px solid #1e293b', marginBottom: 16 }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, marginBottom: 8 }}>
                  Churn Analysis &amp; Risk Driver
                </div>
                <div style={{ color: '#e2e8f0', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  {selectedAlert.churn_reason || 'Approaching policy expiration with no active renewal binder.'}
                </div>
                {selectedAlert.resolution_note && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #1e293b', color: '#34d399', fontSize: '0.8rem' }}>
                    <strong>Resolution Note:</strong> {selectedAlert.resolution_note}
                  </div>
                )}
              </div>

              {/* Outreach Activity History */}
              <div style={{ background: '#0b1329', padding: 16, borderRadius: 8, border: '1px solid #1e293b', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>
                    <History size={13} />
                    Outreach Touchpoints ({outreachHistory.length})
                  </div>
                  {selectedAlert.status === 'open' && (
                    <button
                      onClick={() => {
                        const alertToLog = selectedAlert;
                        setSelectedAlert(null);
                        setOutreachModalAlert(alertToLog);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#f59e0b',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      + Log Touchpoint
                    </button>
                  )}
                </div>

                {loadingHistory ? (
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center', padding: '12px 0' }}>
                    Loading history...
                  </div>
                ) : outreachHistory.length === 0 ? (
                  <div style={{ color: '#64748b', fontSize: '0.8rem', textAlign: 'center', padding: '12px 0' }}>
                    No outreach activities logged for this alert yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {outreachHistory.map(log => (
                      <div
                        key={log.id}
                        style={{
                          background: '#0f172a',
                          border: '1px solid #1e293b',
                          borderRadius: 6,
                          padding: '10px 12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span
                            style={{
                              textTransform: 'uppercase',
                              fontWeight: 700,
                              fontSize: '0.7rem',
                              color: log.outcome === 'contacted_renewing' ? '#10b981' : '#f59e0b'
                            }}
                          >
                            {formatOutcomeLabel(log.outcome)} &bull; {log.contact_method}
                          </span>
                          <span style={{ color: '#64748b', fontSize: '0.7rem' }}>
                            {new Date(log.logged_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {log.notes && (
                          <div style={{ color: '#cbd5e1', fontSize: '0.8rem', lineHeight: 1.4 }}>
                            {log.notes}
                          </div>
                        )}
                        <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: 4 }}>
                          Logged by: {log.agent_name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div style={{ marginTop: 'auto', display: 'flex', gap: 10 }}>
                {selectedAlert.status === 'open' && (
                  <button
                    onClick={() => {
                      const alertToLog = selectedAlert;
                      setSelectedAlert(null);
                      setOutreachModalAlert(alertToLog);
                    }}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: 8,
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Log Outreach
                  </button>
                )}
                <button
                  onClick={() => setSelectedAlert(null)}
                  style={{
                    flex: selectedAlert.status === 'open' ? undefined : 1,
                    padding: '10px 16px',
                    borderRadius: 8,
                    background: '#1e293b',
                    color: '#94a3b8',
                    border: '1px solid #334155',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
