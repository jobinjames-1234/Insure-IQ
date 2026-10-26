import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Inbox,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
  ShieldAlert,
  ArrowRight,
  Plus,
  X,
  FileText,
  DollarSign,
  Calendar,
  ShieldCheck,
  RefreshCw,
  SlidersHorizontal,
  Flame,
  Car,
  Home,
  ShieldX,
  Activity
} from 'lucide-react';
import api from '../../api';

interface AdjusterDashboardProps {
  tenantContext: {
    id: number;
    name: string;
    subdomain: string;
    plan_tier?: string;
  };
  currentUser: {
    id: number;
    email: string;
    name?: string;
    role: string;
  };
}

export default function AdjusterDashboard({ tenantContext }: AdjusterDashboardProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    open_claims: 0,
    sla_at_risk: 0,
    fraud_flagged: 0,
    settled_today: 0
  });
  const [claims, setClaims] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [incidentTypeFilter, setIncidentTypeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'fraud_score_desc' | 'age_desc'>('fraud_score_desc');
  const [fraudFilterActive, setFraudFilterActive] = useState(false);

  // Intake Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePolicies, setActivePolicies] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [intakeError, setIntakeError] = useState('');
  const [intakeSuccess, setIntakeSuccess] = useState('');

  // Form Fields
  const [selectedPolicyNumber, setSelectedPolicyNumber] = useState('');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [incidentType, setIncidentType] = useState('auto_collision');
  const [claimedAmount, setClaimedAmount] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [sortBy]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, queueRes] = await Promise.all([
        api.get('/api/claims/stats').catch(() => null),
        api.get(`/api/claims/queue?sort_by=${sortBy}`).catch(() => null)
      ]);
      if (statsRes?.data) setStats(statsRes.data);
      if (queueRes?.data) setClaims(queueRes.data);
    } finally {
      setLoading(false);
    }
  };

  const openIntakeModal = async () => {
    setIsModalOpen(true);
    setIntakeError('');
    setIntakeSuccess('');
    try {
      const res = await api.get('/api/claims/policies/active');
      setActivePolicies(res.data || []);
      if (res.data?.length > 0 && !selectedPolicyNumber) {
        setSelectedPolicyNumber(res.data[0].policy_number);
      }
    } catch (err: any) {
      setIntakeError('Could not load active policies. Please verify policies exist.');
    }
  };

  const handleIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIntakeError('');
    setIntakeSuccess('');

    if (!selectedPolicyNumber) {
      setIntakeError('Please select an active policy.');
      return;
    }
    const amt = parseFloat(claimedAmount);
    if (isNaN(amt) || amt <= 0) {
      setIntakeError('Please enter a valid claimed amount greater than $0.');
      return;
    }
    if (!incidentDescription.trim()) {
      setIntakeError('Please provide a narrative description of the loss.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        policy_number: selectedPolicyNumber,
        incident_date: new Date(incidentDate).toISOString(),
        incident_type: incidentType,
        claimed_amount: amt,
        incident_description: incidentDescription.trim()
      };
      const res = await api.post('/api/claims/submit', payload);
      setIntakeSuccess(`Claim ${res.data.claim_number} successfully registered into triage queue!`);
      setClaimedAmount('');
      setIncidentDescription('');
      fetchDashboardData();
      setTimeout(() => {
        setIsModalOpen(false);
        setIntakeSuccess('');
      }, 1500);
    } catch (err: any) {
      setIntakeError(err.response?.data?.detail || 'Failed to submit claim. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPolicy = activePolicies.find(p => p.policy_number === selectedPolicyNumber);

  const filteredClaims = claims.filter(c => {
    const matchesSearch =
      c.claim_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.policy_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.claimant_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = incidentTypeFilter === 'ALL' || c.incident_type === incidentTypeFilter;
    const matchesFraudFilter = !fraudFilterActive || c.fraud_tier === 'high';
    return matchesSearch && matchesType && matchesFraudFilter;
  });

  const getFraudPill = (tier: string, score: number) => {
    if (tier === 'high' || score >= 65) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600, background: '#ef444420', color: '#f87171', border: '1px solid #ef444440', width: 'fit-content' }}>
            <ShieldAlert size={12} />
            High ({score})
          </span>
          <span style={{ fontSize: '0.68rem', color: '#f87171', fontWeight: 500 }}>
            Escalate recommended
          </span>
        </div>
      );
    }
    if (tier === 'medium' || score >= 35) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600, background: '#f59e0b20', color: '#fbbf24', border: '1px solid #f59e0b40' }}>
          Med ({score})
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600, background: '#10b98120', color: '#34d399', border: '1px solid #10b98140' }}>
        Low ({score})
      </span>
    );
  };

  const lossTypeChips = [
    { label: 'All Types', value: 'ALL', icon: SlidersHorizontal },
    { label: 'Auto Collision', value: 'auto_collision', icon: Car },
    { label: 'Property Damage', value: 'property_water_damage', icon: Home },
    { label: 'Theft / Burglary', value: 'theft_burglary', icon: ShieldX },
    { label: 'Medical / Bodily', value: 'medical_injury', icon: Activity },
  ];

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
            Claims Triage Queue
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: 6, margin: 0 }}>
            {tenantContext.name} · Fast-lane adjudication prioritized by fraud risk confidence
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={fetchDashboardData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 14px',
              borderRadius: 8,
              border: '1px solid #1e293b',
              background: '#0f172a',
              color: '#94a3b8',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>

          <button
            onClick={openIntakeModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#0284c7',
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)'
            }}
          >
            <Plus size={16} />
            <span>Intake New Claim</span>
          </button>
        </div>
      </div>

      {/* Metric Cockpit (Interactive Filters) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginBottom: 28 }}>
        <div
          onClick={() => setFraudFilterActive(false)}
          style={{
            background: '#0f172a',
            border: !fraudFilterActive ? '1px solid #0284c7' : '1px solid #1e293b',
            borderRadius: 10,
            padding: 20,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>Open Claims</span>
            <div style={{ background: '#0284c720', padding: 8, borderRadius: 8, color: '#38bdf8' }}>
              <Inbox size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f8fafc', marginTop: 10 }}>
            {stats.open_claims}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>Pending fast-lane review</div>
        </div>

        <div
          onClick={() => navigate('/adjuster/sla-tracker')}
          style={{
            background: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: 10,
            padding: 20,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>SLA At Risk (&gt;80%)</span>
            <div style={{ background: '#f59e0b20', padding: 8, borderRadius: 8, color: '#fbbf24' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: stats.sla_at_risk > 0 ? '#fbbf24' : '#f8fafc', marginTop: 10 }}>
            {stats.sla_at_risk}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>Turnaround deadline urgent</div>
        </div>

        <div
          onClick={() => setFraudFilterActive(!fraudFilterActive)}
          style={{
            background: '#0f172a',
            border: fraudFilterActive ? '1px solid #ef4444' : '1px solid #1e293b',
            borderRadius: 10,
            padding: 20,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>Fraud Flagged</span>
            <div style={{ background: '#ef444420', padding: 8, borderRadius: 8, color: '#f87171' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: stats.fraud_flagged > 0 ? '#f87171' : '#f8fafc', marginTop: 10 }}>
            {stats.fraud_flagged}
          </div>
          <div style={{ fontSize: '0.75rem', color: fraudFilterActive ? '#f87171' : '#64748b', marginTop: 4 }}>
            {fraudFilterActive ? 'Filter Active (Click to reset)' : 'Recommend escalation'}
          </div>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>Settled Today</span>
            <div style={{ background: '#10b98120', padding: 8, borderRadius: 8, color: '#34d399' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f8fafc', marginTop: 10 }}>
            {stats.settled_today}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>Approved / Rejected outcomes</div>
        </div>
      </div>

      {/* Loss Type Filter Chips */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {lossTypeChips.map(chip => {
          const Icon = chip.icon;
          const isSelected = incidentTypeFilter === chip.value;
          return (
            <button
              key={chip.value}
              onClick={() => setIncidentTypeFilter(chip.value)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 20,
                border: isSelected ? '1px solid #0284c7' : '1px solid #1e293b',
                background: isSelected ? '#0284c725' : '#0f172a',
                color: isSelected ? '#38bdf8' : '#94a3b8',
                fontSize: '0.8rem',
                fontWeight: isSelected ? 600 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={14} />
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>

      {/* Toolbar: Search & Sort Mode Toggle */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 540 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search by claim #, policy #, or claimant name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 38px',
              borderRadius: 8,
              border: '1px solid #1e293b',
              background: '#0f172a',
              color: '#f8fafc',
              fontSize: '0.875rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Priority Sort Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: 3 }}>
          <button
            onClick={() => setSortBy('fraud_score_desc')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 6,
              border: 'none',
              background: sortBy === 'fraud_score_desc' ? '#0284c7' : 'transparent',
              color: sortBy === 'fraud_score_desc' ? '#ffffff' : '#94a3b8',
              fontSize: '0.8rem',
              fontWeight: sortBy === 'fraud_score_desc' ? 600 : 500,
              cursor: 'pointer'
            }}
          >
            <Flame size={13} style={{ color: sortBy === 'fraud_score_desc' ? '#ffffff' : '#f87171' }} />
            <span>Fraud Priority (Default)</span>
          </button>

          <button
            onClick={() => setSortBy('age_desc')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 6,
              border: 'none',
              background: sortBy === 'age_desc' ? '#0284c7' : 'transparent',
              color: sortBy === 'age_desc' ? '#ffffff' : '#94a3b8',
              fontSize: '0.8rem',
              fontWeight: sortBy === 'age_desc' ? 600 : 500,
              cursor: 'pointer'
            }}
          >
            <Clock size={13} style={{ color: sortBy === 'age_desc' ? '#ffffff' : '#fbbf24' }} />
            <span>Age / SLA Triage</span>
          </button>
        </div>
      </div>

      {/* Claims Queue Table */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
            Loading prioritized claims queue...
          </div>
        ) : filteredClaims.length === 0 ? (
          <div style={{ padding: 64, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#64748b' }}>
              <Inbox size={26} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 8px' }}>
              No Claims Match Current Filters
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', maxWidth: 460, margin: '0 auto 20px', lineHeight: 1.5 }}>
              Try adjusting your search criteria, loss type filters, or intake a new claim against an active policy.
            </p>
            <button
              onClick={openIntakeModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 6,
                border: 'none',
                background: '#0284c7',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Plus size={15} />
              <span>Intake New Claim</span>
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e293b', background: '#0b1329' }}>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 600 }}>Claim #</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 600 }}>Policy #</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 600 }}>Claimant</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 600 }}>Loss Type</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 600 }}>Amount Claimed</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 600 }}>Fraud Confidence</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 600 }}>Age in Queue</th>
                <th style={{ padding: '14px 18px', color: '#94a3b8', fontWeight: 600, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredClaims.map(claim => {
                const isHighFraud = claim.fraud_tier === 'high' || claim.fraud_score >= 65;
                return (
                  <tr
                    key={claim.id}
                    style={{
                      borderBottom: '1px solid #1e293b',
                      borderLeft: isHighFraud ? '3px solid #ef4444' : '3px solid transparent',
                      transition: 'background 0.15s ease',
                      background: isHighFraud ? '#ef444408' : 'transparent'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = isHighFraud ? '#ef444415' : '#1e293b50')}
                    onMouseLeave={e => (e.currentTarget.style.background = isHighFraud ? '#ef444408' : 'transparent')}
                  >
                    <td style={{ padding: '14px 18px', fontWeight: 600, color: '#38bdf8' }}>
                      {claim.claim_number}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#cbd5e1' }}>
                      {claim.policy_number}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#f8fafc', fontWeight: 500 }}>
                      {claim.claimant_name}
                    </td>
                    <td style={{ padding: '14px 18px', color: '#94a3b8' }}>
                      {claim.incident_type?.replace(/_/g, ' ')}
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: 600, color: '#f8fafc' }}>
                      ${Number(claim.claimed_amount).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      {getFraudPill(claim.fraud_tier, claim.fraud_score)}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ color: claim.age_days >= 4 ? '#fbbf24' : '#94a3b8', fontWeight: claim.age_days >= 4 ? 600 : 400 }}>
                        {claim.age_days}d
                      </span>
                      {claim.age_days >= 4 && (
                        <span style={{ fontSize: '0.68rem', background: '#f59e0b20', color: '#fbbf24', padding: '1px 5px', borderRadius: 4, marginLeft: 6, fontWeight: 600 }}>
                          SLA Urgent
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <button
                        onClick={() => navigate(`/adjuster/claims/${claim.id}`)}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 6,
                          border: 'none',
                          background: isHighFraud ? '#ef4444' : '#0284c7',
                          color: '#ffffff',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: isHighFraud ? '0 2px 4px rgba(239, 68, 68, 0.25)' : 'none'
                        }}
                      >
                        <span>Review</span>
                        <ArrowRight size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Claim Intake Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: 12,
              width: '100%',
              maxWidth: 580,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: '#0284c720', padding: 8, borderRadius: 8, color: '#38bdf8' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0, color: '#f8fafc' }}>
                    Intake & Register Claim
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Links directly to an active policy in {tenantContext.name}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleIntakeSubmit} style={{ padding: '20px 24px' }}>
              {intakeError && (
                <div style={{ padding: '10px 14px', borderRadius: 6, background: '#ef444420', border: '1px solid #ef444440', color: '#f87171', fontSize: '0.85rem', marginBottom: 16 }}>
                  {intakeError}
                </div>
              )}
              {intakeSuccess && (
                <div style={{ padding: '10px 14px', borderRadius: 6, background: '#10b98120', border: '1px solid #10b98140', color: '#34d399', fontSize: '0.85rem', marginBottom: 16 }}>
                  {intakeSuccess}
                </div>
              )}

              {/* Policy Selection */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                  Select Active Policy *
                </label>
                {activePolicies.length === 0 ? (
                  <div style={{ padding: '10px 14px', borderRadius: 6, background: '#1e293b', color: '#f59e0b', fontSize: '0.85rem' }}>
                    No active policies found in this tenant. Please issue an active policy via Underwriting first.
                  </div>
                ) : (
                  <select
                    value={selectedPolicyNumber}
                    onChange={e => setSelectedPolicyNumber(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 6,
                      background: '#1e293b',
                      border: '1px solid #334155',
                      color: '#f8fafc',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  >
                    {activePolicies.map(p => (
                      <option key={p.policy_number} value={p.policy_number}>
                        {p.policy_number} — {p.holder_name} (${p.coverage_limit.toLocaleString()} limit)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Selected Policy Dossier Summary */}
              {selectedPolicy && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: '#0b1329', border: '1px solid #1e293b', marginBottom: 16, display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Policyholder: </span>
                    <span style={{ color: '#f8fafc', fontWeight: 600 }}>{selectedPolicy.holder_name}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Coverage Limit: </span>
                    <span style={{ color: '#38bdf8', fontWeight: 600 }}>${selectedPolicy.coverage_limit.toLocaleString()}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Deductible: </span>
                    <span style={{ color: '#fbbf24', fontWeight: 600 }}>${selectedPolicy.deductible}</span>
                  </div>
                </div>
              )}

              {/* Loss Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                    Loss / Incident Date *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={14} style={{ position: 'absolute', left: 10, top: 12, color: '#64748b' }} />
                    <input
                      type="date"
                      value={incidentDate}
                      onChange={e => setIncidentDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px 8px 32px',
                        borderRadius: 6,
                        background: '#1e293b',
                        border: '1px solid #334155',
                        color: '#f8fafc',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                    Loss / Incident Type *
                  </label>
                  <select
                    value={incidentType}
                    onChange={e => setIncidentType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 6,
                      background: '#1e293b',
                      border: '1px solid #334155',
                      color: '#f8fafc',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  >
                    <option value="auto_collision">Auto Collision</option>
                    <option value="property_water_damage">Property Water Damage</option>
                    <option value="theft_burglary">Theft / Burglary</option>
                    <option value="medical_injury">Medical / Bodily Injury</option>
                  </select>
                </div>
              </div>

              {/* Claimed Amount */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                  Total Claimed Loss ($ USD) *
                </label>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={14} style={{ position: 'absolute', left: 10, top: 12, color: '#64748b' }} />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 4500"
                    value={claimedAmount}
                    onChange={e => setClaimedAmount(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px 8px 32px',
                      borderRadius: 6,
                      background: '#1e293b',
                      border: '1px solid #334155',
                      color: '#f8fafc',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Narrative Description */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                  Incident Description & Circumstances *
                </label>
                <textarea
                  rows={3}
                  placeholder="Detail the location, sequence of events, and damages sustained..."
                  value={incidentDescription}
                  onChange={e => setIncidentDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '0.85rem',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid #334155',
                    background: '#1e293b',
                    color: '#94a3b8',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || activePolicies.length === 0}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 6,
                    border: 'none',
                    background: activePolicies.length === 0 ? '#475569' : '#0284c7',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: activePolicies.length === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <ShieldCheck size={15} />
                  <span>{submitting ? 'Registering...' : 'Register Claim'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
