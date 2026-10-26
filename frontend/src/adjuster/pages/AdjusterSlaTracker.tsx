import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  Search,
  ArrowUpRight,
  Activity
} from 'lucide-react';
import api from '../../api';

interface AdjusterSlaTrackerProps {
  tenantContext: {
    id: number;
    name: string;
    subdomain: string;
  };
}

interface SlaClaimItem {
  id: number;
  claim_number: string;
  policy_number: string;
  claimant_name: string;
  incident_type: string;
  claimed_amount: number;
  fraud_score: number;
  fraud_tier: string;
  status: string;
  created_at: string;
  sla_deadline: string;
  total_sla_hours: number;
  elapsed_hours: number;
  remaining_hours: number;
  elapsed_percent: number;
  sla_status: 'healthy' | 'warning' | 'critical' | 'overdue';
}

interface SlaDashboardSummary {
  total_in_flight: number;
  healthy_count: number;
  warning_count: number;
  critical_count: number;
  overdue_count: number;
  claims: SlaClaimItem[];
}

export default function AdjusterSlaTracker({ tenantContext }: AdjusterSlaTrackerProps) {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<SlaDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [lossTypeFilter, setLossTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSlaQueue();
  }, [statusFilter, lossTypeFilter]);

  const fetchSlaQueue = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status_filter', statusFilter);
      }
      if (lossTypeFilter !== 'all') {
        params.append('incident_type', lossTypeFilter);
      }
      if (searchQuery.trim()) {
        params.append('q', searchQuery.trim());
      }
      const res = await api.get(`/api/claims/sla-tracker?${params.toString()}`);
      setSummary(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to retrieve SLA tracker data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSlaQueue();
  };

  const formatRemainingTime = (remainingHours: number) => {
    if (remainingHours <= 0) {
      const overdueHours = Math.abs(Math.round(remainingHours));
      if (overdueHours < 24) return `Overdue by ${overdueHours}h`;
      return `Overdue by ${(overdueHours / 24).toFixed(1)}d`;
    }
    if (remainingHours < 24) {
      return `${Math.round(remainingHours)}h Remaining`;
    }
    const days = (remainingHours / 24).toFixed(1);
    return `${days}d Remaining`;
  };

  const getSlaBadge = (slaStatus: string, elapsedPct: number) => {
    switch (slaStatus) {
      case 'overdue':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 4, background: '#7f1d1d35', color: '#f87171', border: '1px solid #ef4444', fontSize: '0.72rem', fontWeight: 800 }}>
            <AlertCircle size={12} />
            BREACHED ({Math.round(elapsedPct)}%)
          </span>
        );
      case 'critical':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 4, background: '#ef444425', color: '#f87171', border: '1px solid #ef444450', fontSize: '0.72rem', fontWeight: 700 }}>
            <AlertTriangle size={12} />
            CRITICAL ({Math.round(elapsedPct)}%)
          </span>
        );
      case 'warning':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 4, background: '#f59e0b25', color: '#fbbf24', border: '1px solid #f59e0b50', fontSize: '0.72rem', fontWeight: 700 }}>
            <Clock size={12} />
            WARNING ({Math.round(elapsedPct)}%)
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 4, background: '#10b98125', color: '#34d399', border: '1px solid #10b98150', fontSize: '0.72rem', fontWeight: 600 }}>
            <ShieldCheck size={12} />
            HEALTHY ({Math.round(elapsedPct)}%)
          </span>
        );
    }
  };

  const getProgressBarColor = (slaStatus: string) => {
    switch (slaStatus) {
      case 'overdue':
      case 'critical':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      default:
        return '#10b981';
    }
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1560, margin: '0 auto' }}>
      {/* Tracker Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
            Turnaround SLA Compliance Tracker
          </h1>
          <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700, background: '#f59e0b20', color: '#fbbf24', border: '1px solid #f59e0b40', textTransform: 'uppercase' }}>
            Catch-up Triage
          </span>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: 4, margin: 0 }}>
          {tenantContext.name} • Time-based urgency sorting against carrier settlement deadlines (5-day turnaround target)
        </p>
      </div>

      {/* 5 Operational Cockpit Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 28 }}>
        {/* Card 1: Total In-Flight */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
              Total In-Flight
            </span>
            <Activity size={18} style={{ color: '#38bdf8' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f8fafc' }}>
            {summary?.total_in_flight ?? '—'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
            Pending review + investigations
          </div>
        </div>

        {/* Card 2: Healthy (<60%) */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
              Healthy (&lt;60%)
            </span>
            <ShieldCheck size={18} style={{ color: '#34d399' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#34d399' }}>
            {summary?.healthy_count ?? '—'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
            Well within carrier targets
          </div>
        </div>

        {/* Card 3: Warning (60-80%) */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
              Warning (60-80%)
            </span>
            <Clock size={18} style={{ color: '#fbbf24' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fbbf24' }}>
            {summary?.warning_count ?? '—'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
            Turnaround window closing
          </div>
        </div>

        {/* Card 4: Critical SLA Breach Risk (>80%) */}
        <div style={{ background: '#0f172a', border: '1px solid #ef444450', borderRadius: 10, padding: 18, boxShadow: summary?.critical_count ? '0 0 15px rgba(239, 68, 68, 0.15)' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f87171', textTransform: 'uppercase' }}>
              Critical Risk (&gt;80%)
            </span>
            <AlertTriangle size={18} style={{ color: '#f87171' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f87171' }}>
            {summary?.critical_count ?? '—'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#f87171', marginTop: 4 }}>
            Immediate catch-up required
          </div>
        </div>

        {/* Card 5: Overdue Breached */}
        <div style={{ background: '#0f172a', border: '1px solid #7f1d1d', borderRadius: 10, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase' }}>
              Breached / Overdue
            </span>
            <AlertCircle size={18} style={{ color: '#ef4444' }} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#ef4444' }}>
            {summary?.overdue_count ?? '—'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: 4 }}>
            Carrier deadline passed
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `All In-Flight (${summary?.total_in_flight || 0})` },
            { id: 'critical', label: `Critical Risk >80% (${summary?.critical_count || 0})` },
            { id: 'warning', label: `Warning 60-80% (${summary?.warning_count || 0})` },
            { id: 'healthy', label: `Healthy <60% (${summary?.healthy_count || 0})` },
            { id: 'overdue', label: `Overdue (${summary?.overdue_count || 0})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                border: statusFilter === tab.id ? '1px solid #38bdf8' : '1px solid #334155',
                background: statusFilter === tab.id ? '#0284c725' : '#1e293b',
                color: statusFilter === tab.id ? '#38bdf8' : '#94a3b8',
                fontSize: '0.78rem',
                fontWeight: statusFilter === tab.id ? 700 : 500,
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            value={lossTypeFilter}
            onChange={e => setLossTypeFilter(e.target.value)}
            style={{
              padding: '7px 10px',
              borderRadius: 6,
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#94a3b8',
              fontSize: '0.82rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Loss Types</option>
            <option value="auto_collision">Auto Collision</option>
            <option value="property_water_leak">Property Water Leak</option>
            <option value="theft_burglary">Theft & Burglary</option>
            <option value="health_critical_care">Health Critical Care</option>
            <option value="fire_damage">Fire Damage</option>
          </select>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search claim, claimant..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                padding: '7px 12px 7px 32px',
                borderRadius: 6,
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#f8fafc',
                fontSize: '0.82rem',
                outline: 'none',
                width: 240
              }}
            />
          </div>
          <button
            type="submit"
            style={{ padding: '7px 14px', borderRadius: 6, border: 'none', background: '#0284c7', color: '#ffffff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Search
          </button>
        </form>
      </div>

      {/* SLA Triage Catch-Up Table */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 64, textAlign: 'center', color: '#94a3b8' }}>
            Loading SLA catch-up queue...
          </div>
        ) : error ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#f87171' }}>
            {error}
          </div>
        ) : !summary || summary.claims.length === 0 ? (
          <div style={{ padding: 64, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#10b98120', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <ShieldCheck size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 6px' }}>
              No Claims Matching Filter
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
              All open carrier claims are accounted for within permissible SLA timelines.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#0b1329', borderBottom: '1px solid #1e293b', color: '#64748b' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Claim #</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Policyholder & Policy</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Loss Type & Claimed</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Turnaround SLA Progress</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Time Remaining</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Urgency Status</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'right' }}>Catch-up Action</th>
                </tr>
              </thead>
              <tbody>
                {summary.claims.map(claim => {
                  const isCritical = claim.sla_status === 'critical' || claim.sla_status === 'overdue';
                  return (
                    <tr
                      key={claim.id}
                      style={{
                        borderBottom: '1px solid #1e293b',
                        borderLeft: `4px solid ${getProgressBarColor(claim.sla_status)}`,
                        background: isCritical ? '#ef444408' : 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* Claim # and Intake Date */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 700, color: '#f8fafc' }}>
                          {claim.claim_number}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                          Filed: {new Date(claim.created_at).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Policyholder & Policy Number */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: '#e2e8f0' }}>
                          {claim.claimant_name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                          {claim.policy_number}
                        </div>
                      </td>

                      {/* Loss Type & Claimed Amount */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ textTransform: 'capitalize', color: '#cbd5e1' }}>
                          {claim.incident_type.replace(/_/g, ' ')}
                        </div>
                        <div style={{ fontWeight: 700, color: '#34d399', marginTop: 2 }}>
                          ${claim.claimed_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>

                      {/* SLA Progress Bar */}
                      <td style={{ padding: '14px 18px', minWidth: 220 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: 4 }}>
                          <span style={{ color: '#94a3b8' }}>Target Window: 5 Days</span>
                          <span style={{ fontWeight: 700, color: getProgressBarColor(claim.sla_status) }}>
                            {Math.round(claim.elapsed_percent)}%
                          </span>
                        </div>
                        <div style={{ height: 6, width: '100%', background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${claim.elapsed_percent}%`,
                              background: getProgressBarColor(claim.sla_status),
                              borderRadius: 3
                            }}
                          />
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 4 }}>
                          Deadline: {new Date(claim.sla_deadline).toLocaleDateString()} {new Date(claim.sla_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Remaining Window */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          color: claim.remaining_hours <= 24 ? '#f87171' : '#cbd5e1'
                        }}>
                          <Clock size={13} style={{ color: claim.remaining_hours <= 24 ? '#ef4444' : '#64748b' }} />
                          <span>{formatRemainingTime(claim.remaining_hours)}</span>
                        </div>
                      </td>

                      {/* Urgency Status Badge */}
                      <td style={{ padding: '14px 18px' }}>
                        {getSlaBadge(claim.sla_status, claim.elapsed_percent)}
                      </td>

                      {/* Action */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            if (claim.status === 'in_investigation') {
                              navigate('/adjuster/investigations');
                            } else {
                              navigate(`/adjuster/claims/${claim.id}`);
                            }
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: isCritical ? 'none' : '1px solid #334155',
                            background: isCritical ? '#ef4444' : '#1e293b',
                            color: '#ffffff',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            boxShadow: isCritical ? '0 2px 4px rgba(239, 68, 68, 0.3)' : 'none'
                          }}
                        >
                          <span>Adjudicate</span>
                          <ArrowUpRight size={13} />
                        </button>
                      </td>
                    </tr>
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

