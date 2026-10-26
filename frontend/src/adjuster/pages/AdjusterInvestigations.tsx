import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Search,
  Filter,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  MessageSquare,
  History,
  Send,
  ArrowUpRight,
  ChevronRight,
  X
} from 'lucide-react';
import api from '../../api';

interface AdjusterInvestigationsProps {
  tenantContext: {
    id: number;
    name: string;
    subdomain: string;
  };
  currentUser?: {
    id: number;
    email: string;
    name?: string;
    role: string;
  };
}

interface InvestigationItem {
  id: number;
  claim_number: string;
  policy_number: string;
  claimant_name: string;
  claimant_email: string;
  incident_type: string;
  claimed_amount: number;
  fraud_score: number;
  fraud_tier: string;
  status: string;
  age_days: number;
  sla_deadline: string;
  created_at: string;
  notes_count: number;
  last_note_preview?: string;
  last_note_at?: string;
}

interface ClaimantPriorClaim {
  id: number;
  claim_number: string;
  incident_date: string;
  incident_type: string;
  claimed_amount: number;
  approved_settlement_amount?: number;
  status: string;
  fraud_score: number;
  fraud_tier: string;
  created_at: string;
}

export default function AdjusterInvestigations({ tenantContext }: AdjusterInvestigationsProps) {
  const navigate = useNavigate();

  // Investigation Queue State (Sub-slice 3.2)
  const [investigations, setInvestigations] = useState<InvestigationItem[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [queueError, setQueueError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLossType, setFilterLossType] = useState('all');

  // Selected Case File Dossier State (Sub-slice 3.3)
  const [selectedClaimId, setSelectedClaimId] = useState<number | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState('');

  // Prior Claimant History
  const [claimantHistory, setClaimantHistory] = useState<ClaimantPriorClaim[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // New Note Composer State
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState('Field Inspection');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [noteSuccess, setNoteSuccess] = useState('');
  const [noteError, setNoteError] = useState('');

  // Final Settlement Adjudication Modal State
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState<'approved' | 'rejected'>('approved');
  const [settlementAmountInput, setSettlementAmountInput] = useState<number | string>('');
  const [justificationNote, setJustificationNote] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [decisionError, setDecisionError] = useState('');
  const [decisionSuccess, setDecisionSuccess] = useState('');

  const lossTypeLabels: Record<string, string> = {
    all: 'All Losses',
    auto_collision: 'Auto Collision',
    property_water_damage: 'Water Damage',
    theft_burglary: 'Theft / Burglary',
    medical_injury: 'Bodily Injury'
  };

  const noteCategories = [
    'Field Inspection',
    'Phone Interview',
    'Document Verification',
    'Legal Review',
    'SIU Escort',
    'General Note'
  ];

  useEffect(() => {
    fetchInvestigations();
  }, [filterLossType]);

  const fetchInvestigations = async () => {
    setLoadingQueue(true);
    setQueueError('');
    try {
      let url = '/api/claims/investigations';
      const params = new URLSearchParams();
      if (filterLossType !== 'all') {
        params.append('incident_type', filterLossType);
      }
      if (searchQuery.trim()) {
        params.append('q', searchQuery.trim());
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      const res = await api.get(url);
      setInvestigations(res.data);
      if (res.data.length > 0 && !selectedClaimId) {
        setSelectedClaimId(res.data[0].id);
      }
    } catch (err: any) {
      setQueueError(err.response?.data?.detail || 'Failed to load investigations queue.');
    } finally {
      setLoadingQueue(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvestigations();
  };

  useEffect(() => {
    if (selectedClaimId) {
      fetchClaimDetail(selectedClaimId);
      fetchClaimantHistory(selectedClaimId);
    }
  }, [selectedClaimId]);

  const fetchClaimDetail = async (id: number) => {
    setLoadingDetail(true);
    setDetailError('');
    try {
      const res = await api.get(`/api/claims/${id}`);
      setSelectedClaim(res.data);
    } catch (err: any) {
      setDetailError(err.response?.data?.detail || 'Failed to load claim dossier.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const fetchClaimantHistory = async (id: number) => {
    setLoadingHistory(true);
    try {
      const res = await api.get(`/api/claims/${id}/claimant-history`);
      setClaimantHistory(res.data);
    } catch (err: any) {
      console.error('Failed to load claimant prior history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setNoteError('');
    setNoteSuccess('');
    if (!newNoteText.trim() || newNoteText.trim().length < 2) {
      setNoteError('Please enter note details before appending.');
      return;
    }

    setSubmittingNote(true);
    try {
      const res = await api.post(`/api/claims/${selectedClaimId}/investigation-notes`, {
        text: newNoteText.trim(),
        category: newNoteCategory
      });
      // Update local notes
      if (selectedClaim) {
        setSelectedClaim({ ...selectedClaim, investigation_notes: res.data });
      }
      setNewNoteText('');
      setNoteSuccess('Investigation note recorded in audit log!');
      setTimeout(() => setNoteSuccess(''), 3000);
      // Refresh list to update notes count
      fetchInvestigations();
    } catch (err: any) {
      setNoteError(err.response?.data?.detail || 'Failed to record investigation note.');
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleOpenDecisionModal = (type: 'approved' | 'rejected') => {
    setDecisionType(type);
    setDecisionError('');
    setJustificationNote('');
    if (type === 'approved' && selectedClaim) {
      const net = (selectedClaim.structured_data?.calculated_net_payable !== undefined)
        ? selectedClaim.structured_data.calculated_net_payable
        : Math.max(0, Math.min(selectedClaim.claimed_amount, selectedClaim.policy_coverage_limit || selectedClaim.claimed_amount) - (selectedClaim.policy_deductible || 500));
      setSettlementAmountInput(net);
    } else {
      setSettlementAmountInput(0);
    }
    setIsDecisionModalOpen(true);
  };

  const handleCommitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    setDecisionError('');
    if (!justificationNote.trim() || justificationNote.trim().length < 3) {
      setDecisionError('Mandatory adjudication note must be at least 3 characters.');
      return;
    }

    let parsedAmount = 0;
    if (decisionType === 'approved') {
      parsedAmount = parseFloat(String(settlementAmountInput));
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        setDecisionError('Settlement payout amount must be a positive number.');
        return;
      }
      if (selectedClaim?.policy_coverage_limit && parsedAmount > selectedClaim.policy_coverage_limit) {
        setDecisionError(`Settlement payout cannot exceed coverage limit of $${selectedClaim.policy_coverage_limit.toLocaleString()}.`);
        return;
      }
    }

    setSubmittingDecision(true);
    try {
      const payload = {
        decision: decisionType,
        justification_note: justificationNote.trim(),
        settlement_amount: decisionType === 'approved' ? parsedAmount : 0
      };
      await api.post(`/api/claims/${selectedClaimId}/decision`, payload);
      setIsDecisionModalOpen(false);
      setDecisionSuccess(`Claim ${selectedClaim?.claim_number} successfully adjudicated as ${decisionType === 'approved' ? 'Approved' : 'Rejected'}!`);
      // Re-fetch queue (the claim is now closed and will drop out of active investigations)
      setSelectedClaim(null);
      setSelectedClaimId(null);
      fetchInvestigations();
      setTimeout(() => setDecisionSuccess(''), 4500);
    } catch (err: any) {
      setDecisionError(err.response?.data?.detail || 'Failed to commit claim adjudication.');
    } finally {
      setSubmittingDecision(false);
    }
  };

  const getFraudBadge = (score: number, tier: string) => {
    if (tier === 'high' || score >= 65) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, background: '#ef444420', color: '#f87171', border: '1px solid #ef444440', fontSize: '0.72rem', fontWeight: 700 }}>
          <ShieldAlert size={12} />
          Fraud: High ({score})
        </span>
      );
    }
    if (tier === 'medium' || score >= 35) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, background: '#f59e0b20', color: '#fbbf24', border: '1px solid #f59e0b40', fontSize: '0.72rem', fontWeight: 700 }}>
          <AlertTriangle size={12} />
          Fraud: Med ({score})
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, background: '#10b98120', color: '#34d399', border: '1px solid #10b98140', fontSize: '0.72rem', fontWeight: 700 }}>
        <ShieldCheck size={12} />
        Fraud: Low ({score})
      </span>
    );
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Field Inspection': return { bg: '#0284c725', text: '#38bdf8', border: '#0284c750' };
      case 'Phone Interview': return { bg: '#8b5cf625', text: '#c084fc', border: '#8b5cf650' };
      case 'Legal Review': return { bg: '#ec489925', text: '#f472b6', border: '#ec489950' };
      case 'Document Verification': return { bg: '#10b98125', text: '#34d399', border: '#10b98150' };
      case 'SIU Escort': return { bg: '#f59e0b25', text: '#fbbf24', border: '#f59e0b50' };
      default: return { bg: '#64748b25', text: '#94a3b8', border: '#64748b50' };
    }
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1560, margin: '0 auto' }}>
      {/* Workspace Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
              Active Investigations Workspace
            </h1>
            <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700, background: '#8b5cf620', color: '#c084fc', border: '1px solid #8b5cf640', textTransform: 'uppercase' }}>
              Slow-Lane Dossier
            </span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: 4, margin: 0 }}>
            {tenantContext.name} • Multi-session case files, claimant loss history, and SIU evidence tracking
          </p>
        </div>

        {decisionSuccess && (
          <div style={{ padding: '10px 16px', borderRadius: 8, background: '#10b98120', border: '1px solid #10b98150', color: '#34d399', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={16} />
            <span>{decisionSuccess}</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Filter size={14} /> Loss Type:
          </span>
          {Object.entries(lossTypeLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterLossType(key)}
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                border: filterLossType === key ? '1px solid #8b5cf6' : '1px solid #334155',
                background: filterLossType === key ? '#8b5cf620' : '#1e293b',
                color: filterLossType === key ? '#c084fc' : '#94a3b8',
                fontSize: '0.78rem',
                fontWeight: filterLossType === key ? 600 : 400,
                cursor: 'pointer'
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search claim, claimant, policy..."
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
                width: 250
              }}
            />
          </div>
          <button
            type="submit"
            style={{ padding: '7px 14px', borderRadius: 6, border: 'none', background: '#8b5cf6', color: '#ffffff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Search
          </button>
        </form>
      </div>

      {/* Main Two-Column Master-Detail Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 24, alignItems: 'flex-start' }}>
        {/* Left Column: Active Investigations Queue */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Inquiries ({investigations.length})
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              Sorted by Fraud Severity
            </span>
          </div>

          {loadingQueue ? (
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: 32, textAlign: 'center', color: '#94a3b8' }}>
              Loading inquiries...
            </div>
          ) : queueError ? (
            <div style={{ background: '#0f172a', border: '1px solid #ef444440', borderRadius: 8, padding: 20, color: '#f87171', fontSize: '0.85rem' }}>
              {queueError}
            </div>
          ) : investigations.length === 0 ? (
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 48, textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#10b98120', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <ShieldCheck size={24} />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 6px' }}>
                No Active Investigations
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                All routine claims are currently proceeding smoothly in the fast-lane triage queue.
              </p>
            </div>
          ) : (
            investigations.map(item => {
              const isSelected = selectedClaimId === item.id;
              const isHigh = item.fraud_tier === 'high' || item.fraud_score >= 65;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedClaimId(item.id)}
                  style={{
                    background: isSelected ? '#1e293b' : '#0f172a',
                    border: isSelected ? '1px solid #8b5cf6' : '1px solid #1e293b',
                    borderLeft: `4px solid ${isHigh ? '#ef4444' : '#8b5cf6'}`,
                    borderRadius: 8,
                    padding: 16,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 4px 12px rgba(139, 92, 246, 0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
                        {item.claim_number}
                      </span>
                    </div>
                    {getFraudBadge(item.fraud_score, item.fraud_tier)}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 6 }}>
                    <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{item.claimant_name}</span>
                    <span style={{ color: '#34d399', fontWeight: 700 }}>
                      ${item.claimed_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: '#64748b', marginBottom: 10 }}>
                    <span>{item.policy_number}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} /> {item.age_days}d in inquiry
                    </span>
                  </div>

                  {item.last_note_preview && (
                    <div style={{
                      background: '#0b1329',
                      border: '1px solid #1e293b',
                      borderRadius: 4,
                      padding: '6px 8px',
                      fontSize: '0.72rem',
                      color: '#94a3b8',
                      fontStyle: 'italic',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      "{item.last_note_preview}"
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: '1px solid #1e293b20', fontSize: '0.72rem' }}>
                    <span style={{ color: '#8b5cf6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MessageSquare size={12} /> {item.notes_count} Notes in Thread
                    </span>
                    <ChevronRight size={14} style={{ color: isSelected ? '#8b5cf6' : '#475569' }} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Deep-Dive Investigation Case File */}
        <div>
          {!selectedClaimId || !selectedClaim ? (
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 64, textAlign: 'center', color: '#64748b' }}>
              Select an active investigation from the queue to view complete case history and multi-session notes.
            </div>
          ) : loadingDetail ? (
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 64, textAlign: 'center', color: '#94a3b8' }}>
              Loading case file dossier for {selectedClaim.claim_number}...
            </div>
          ) : detailError ? (
            <div style={{ background: '#0f172a', border: '1px solid #ef444440', borderRadius: 10, padding: 24, color: '#f87171' }}>
              {detailError}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Top Case File Dossier Header & Resolution Actions */}
              <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                        {selectedClaim.claim_number}
                      </h2>
                      <span style={{ padding: '3px 9px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 700, background: '#8b5cf625', color: '#c084fc', border: '1px solid #8b5cf650' }}>
                        In Investigation
                      </span>
                      {getFraudBadge(selectedClaim.fraud_score, selectedClaim.fraud_tier)}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                      Claimant: <strong style={{ color: '#f8fafc' }}>{selectedClaim.claimant_name}</strong> ({selectedClaim.claimant_email}) • Policy: <strong style={{ color: '#cbd5e1' }}>{selectedClaim.policy_number}</strong>
                    </div>
                  </div>

                  {/* Top Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      onClick={() => navigate(`/adjuster/claims/${selectedClaim.id}`)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 6,
                        border: '1px solid #334155',
                        background: '#1e293b',
                        color: '#cbd5e1',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <FileText size={14} />
                      <span>Evidence Vault</span>
                      <ArrowUpRight size={14} />
                    </button>
                    <button
                      onClick={() => handleOpenDecisionModal('approved')}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 6,
                        border: 'none',
                        background: '#10b981',
                        color: '#ffffff',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      <CheckCircle2 size={14} />
                      <span>Resolve & Settle</span>
                    </button>
                    <button
                      onClick={() => handleOpenDecisionModal('rejected')}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 6,
                        border: '1px solid #ef444450',
                        background: '#ef444420',
                        color: '#f87171',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <XCircle size={14} />
                      <span>Resolve & Reject</span>
                    </button>
                  </div>
                </div>

                {/* Financial Summary Strip */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, background: '#0b1329', padding: 14, borderRadius: 8, border: '1px solid #1e293b' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Claimed Loss</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>
                      ${selectedClaim.claimed_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Policy Limit</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8', marginTop: 2 }}>
                      ${(selectedClaim.policy_coverage_limit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Deductible</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ef4444', marginTop: 2 }}>
                      -${(selectedClaim.policy_deductible || 500).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Calculated Net Payout</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399', marginTop: 2 }}>
                      ${((selectedClaim.structured_data?.calculated_net_payable !== undefined)
                        ? selectedClaim.structured_data.calculated_net_payable
                        : Math.max(0, Math.min(selectedClaim.claimed_amount, selectedClaim.policy_coverage_limit || selectedClaim.claimed_amount) - (selectedClaim.policy_deductible || 500))
                      ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fraud Factors & Inception Risk Alert Callout */}
              <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <AlertTriangle size={18} style={{ color: '#fbbf24' }} />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: '#f8fafc' }}>
                    Escalation Findings & Contributing Fraud Factors
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedClaim.fraud_indicators && selectedClaim.fraud_indicators.length > 0 ? (
                    selectedClaim.fraud_indicators.map((ind: string, idx: number) => (
                      <div key={idx} style={{ padding: '8px 12px', borderRadius: 6, background: '#ef444415', border: '1px solid #ef444430', color: '#fca5a5', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ShieldAlert size={14} style={{ color: '#f87171', flexShrink: 0 }} />
                        <span>{ind}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '8px 12px', borderRadius: 6, background: '#0b1329', border: '1px solid #1e293b', color: '#94a3b8', fontSize: '0.8rem' }}>
                      Escalated by adjuster manual referral for in-depth witness and documentation verification.
                    </div>
                  )}
                </div>
              </div>

              {/* Policyholder Prior Claim History Table (Sub-slice 3.3) */}
              <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <History size={18} style={{ color: '#38bdf8' }} />
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: '#f8fafc' }}>
                      Claimant Prior Loss Events ({claimantHistory.length})
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Cross-policy carrier historical records
                  </span>
                </div>

                {loadingHistory ? (
                  <div style={{ padding: 16, textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                    Checking historical claims database...
                  </div>
                ) : claimantHistory.length === 0 ? (
                  <div style={{ padding: '14px 16px', borderRadius: 6, background: '#10b98110', border: '1px solid #10b98125', color: '#34d399', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={16} />
                    <span>First-time claimant on this policy. No previous loss events recorded for this individual.</span>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #1e293b', color: '#64748b' }}>
                          <th style={{ padding: '8px 10px', fontWeight: 600 }}>Claim #</th>
                          <th style={{ padding: '8px 10px', fontWeight: 600 }}>Date</th>
                          <th style={{ padding: '8px 10px', fontWeight: 600 }}>Loss Type</th>
                          <th style={{ padding: '8px 10px', fontWeight: 600 }}>Claimed Amount</th>
                          <th style={{ padding: '8px 10px', fontWeight: 600 }}>Approved Payout</th>
                          <th style={{ padding: '8px 10px', fontWeight: 600 }}>Status</th>
                          <th style={{ padding: '8px 10px', fontWeight: 600 }}>Risk Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {claimantHistory.map((pc: ClaimantPriorClaim) => (
                          <tr key={pc.id} style={{ borderBottom: '1px solid #1e293b20', color: '#cbd5e1' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 600, color: '#f8fafc' }}>{pc.claim_number}</td>
                            <td style={{ padding: '8px 10px' }}>{new Date(pc.incident_date).toLocaleDateString()}</td>
                            <td style={{ padding: '8px 10px', textTransform: 'capitalize' }}>{pc.incident_type.replace('_', ' ')}</td>
                            <td style={{ padding: '8px 10px' }}>${pc.claimed_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td style={{ padding: '8px 10px', color: pc.approved_settlement_amount ? '#34d399' : '#94a3b8' }}>
                              {pc.approved_settlement_amount ? `$${pc.approved_settlement_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'}
                            </td>
                            <td style={{ padding: '8px 10px' }}>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: 4,
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                textTransform: 'capitalize',
                                background: pc.status === 'approved' ? '#10b98120' : (pc.status === 'rejected' ? '#ef444420' : '#8b5cf620'),
                                color: pc.status === 'approved' ? '#34d399' : (pc.status === 'rejected' ? '#f87171' : '#c084fc')
                              }}>
                                {pc.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td style={{ padding: '8px 10px', fontWeight: 700, color: pc.fraud_score >= 65 ? '#f87171' : '#34d399' }}>
                              {pc.fraud_score}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Multi-Session Chronological Case Notes Thread (Sub-slice 3.3) */}
              <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MessageSquare size={18} style={{ color: '#c084fc' }} />
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: '#f8fafc' }}>
                      Multi-Session Investigation Notes Thread ({(selectedClaim.investigation_notes || []).length})
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Permanent, tamper-evident case inquiry audit trail
                  </span>
                </div>

                {/* Chronological Notes Feed */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                  {(selectedClaim.investigation_notes || []).length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: '0.82rem', background: '#0b1329', borderRadius: 8, border: '1px solid #1e293b' }}>
                      No investigation notes recorded yet. Append the opening case observation below.
                    </div>
                  ) : (
                    (selectedClaim.investigation_notes || []).map((note: any, idx: number) => {
                      const colors = getCategoryColor(note.category);
                      return (
                        <div
                          key={idx}
                          style={{
                            background: '#0b1329',
                            border: '1px solid #1e293b',
                            borderRadius: 8,
                            padding: 14
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>
                                {note.author_name}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                ({note.author_role || 'Adjuster'})
                              </span>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: 4,
                                fontSize: '0.68rem',
                                fontWeight: 600,
                                background: colors.bg,
                                color: colors.text,
                                border: `1px solid ${colors.border}`
                              }}>
                                {note.category || 'General Note'}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              {note.created_at ? new Date(note.created_at).toLocaleString() : ''}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                            {note.text}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Append Investigation Note Composer */}
                <form onSubmit={handleAddNote} style={{ background: '#0b1329', border: '1px solid #1e293b', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc', marginBottom: 10 }}>
                    Append New Case Note
                  </div>

                  {noteError && (
                    <div style={{ padding: '8px 12px', borderRadius: 6, background: '#ef444420', color: '#f87171', fontSize: '0.8rem', marginBottom: 12 }}>
                      {noteError}
                    </div>
                  )}

                  {noteSuccess && (
                    <div style={{ padding: '8px 12px', borderRadius: 6, background: '#10b98120', color: '#34d399', fontSize: '0.8rem', marginBottom: 12 }}>
                      {noteSuccess}
                    </div>
                  )}

                  {/* Category Selection Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {noteCategories.map(cat => {
                      const isCatSelected = newNoteCategory === cat;
                      const colors = getCategoryColor(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setNewNoteCategory(cat)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            border: isCatSelected ? `1px solid ${colors.text}` : '1px solid #334155',
                            background: isCatSelected ? colors.bg : '#1e293b',
                            color: isCatSelected ? colors.text : '#94a3b8',
                            fontSize: '0.74rem',
                            fontWeight: isCatSelected ? 700 : 500,
                            cursor: 'pointer'
                          }}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>

                  <textarea
                    rows={3}
                    placeholder="Enter detailed investigator observations, body shop contact report, or claimant interview transcription..."
                    value={newNoteText}
                    onChange={e => setNewNoteText(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      background: '#1e293b',
                      border: '1px solid #334155',
                      color: '#f8fafc',
                      fontSize: '0.82rem',
                      outline: 'none',
                      resize: 'vertical',
                      marginBottom: 12
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="submit"
                      disabled={submittingNote}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 6,
                        border: 'none',
                        background: '#8b5cf6',
                        color: '#ffffff',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Send size={13} />
                      <span>{submittingNote ? 'Recording...' : 'Append Investigation Note'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settlement Decision Modal (Direct Adjudication from Investigation Case File) */}
      {isDecisionModalOpen && selectedClaim && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
          }}
        >
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, width: '100%', maxWidth: 540, overflow: 'hidden' }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: decisionType === 'approved' ? '#064e3b20' : '#7f1d1d20'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  background: decisionType === 'approved' ? '#10b98125' : '#ef444425',
                  padding: 8,
                  borderRadius: 8,
                  color: decisionType === 'approved' ? '#34d399' : '#f87171'
                }}>
                  {decisionType === 'approved' ? <CheckCircle2 size={22} /> : <XCircle size={22} />}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, color: '#f8fafc' }}>
                    {decisionType === 'approved' ? 'Resolve Investigation & Approve Settlement' : 'Resolve Investigation & Reject Claim'}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Claim: {selectedClaim.claim_number} • Policyholder: {selectedClaim.claimant_name}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsDecisionModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCommitDecision} style={{ padding: '20px 24px' }}>
              {decisionError && (
                <div style={{ padding: '8px 12px', borderRadius: 6, background: '#ef444420', color: '#f87171', fontSize: '0.82rem', marginBottom: 14 }}>
                  {decisionError}
                </div>
              )}

              {decisionType === 'approved' ? (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                    Approved Settlement Payout ($ USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={selectedClaim.policy_coverage_limit || undefined}
                    value={settlementAmountInput}
                    onChange={e => setSettlementAmountInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 6,
                      background: '#1e293b',
                      border: '1px solid #334155',
                      color: '#34d399',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  />
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
                    Max coverage limit: ${(selectedClaim.policy_coverage_limit || 0).toLocaleString()} • Deductible: ${(selectedClaim.policy_deductible || 500).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '12px 14px', borderRadius: 8, background: '#ef444415', border: '1px solid #ef444430', marginBottom: 16, fontSize: '0.8rem', color: '#f87171' }}>
                  Rejection will close this claim and conclude the investigation with zero payout.
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                  Investigation Findings Rationale Templates
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(decisionType === 'approved' ? [
                    'Field inspection confirmed legitimate damage. Suspicion resolved through claimant interview.',
                    'Independent appraiser validated vehicle repair estimate within permissible policy scope.',
                    'Police accident report authenticated; fraud inquiry concluded with clear liability.'
                  ] : [
                    'Investigation substantiated intentional staging or pre-existing unrecorded damage.',
                    'Claimant failed to provide requested documentation and corroborating police report.',
                    'Discrepancy confirmed: loss occurred prior to policy inception date.'
                  ]).map((template, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setJustificationNote(template)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 4,
                        border: '1px solid #334155',
                        background: '#1e293b',
                        color: '#94a3b8',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      + {template}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                  Mandatory Final Adjudication Justification Note *
                </label>
                <textarea
                  rows={3}
                  placeholder="Summarize the conclusion of the investigation and legal/coverage basis for this decision..."
                  value={justificationNote}
                  onChange={e => setJustificationNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsDecisionModalOpen(false)}
                  style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #334155', background: '#1e293b', color: '#94a3b8', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDecision}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: decisionType === 'approved' ? '#10b981' : '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {decisionType === 'approved' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  <span>{submittingDecision ? 'Committing...' : (decisionType === 'approved' ? 'Resolve & Approve Settlement' : 'Resolve & Reject Claim')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
