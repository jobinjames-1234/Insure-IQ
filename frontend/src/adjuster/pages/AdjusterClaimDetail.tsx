import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  Clock,
  User,
  AlertCircle,
  FileText,
  DollarSign,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize2,
  ExternalLink,
  Download,
  Plus,
  X,
  FileSpreadsheet,
  Edit3,
  Save,
  Check,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';
import api from '../../api';

interface AdjusterClaimDetailProps {
  tenantContext: {
    id: number;
    name: string;
    subdomain: string;
  };
  currentUser: {
    id: number;
    email: string;
    name?: string;
    role: string;
  };
}

export default function AdjusterClaimDetail({ tenantContext }: AdjusterClaimDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [claim, setClaim] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Evidence Viewer State
  const [activeDocIndex, setActiveDocIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Attach Document Modal State
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocType, setNewDocType] = useState('image');
  const [newDocUrl, setNewDocUrl] = useState('');
  const [newDocDescription, setNewDocDescription] = useState('');
  const [attaching, setAttaching] = useState(false);
  const [attachError, setAttachError] = useState('');

  // Structured Field Verification & Correction State (Sub-slice 2.3)
  const [isEditingFields, setIsEditingFields] = useState(false);
  const [fieldDate, setFieldDate] = useState('');
  const [fieldLossType, setFieldLossType] = useState('auto_collision');
  const [fieldDamage, setFieldDamage] = useState<number | string>('');
  const [fieldPoliceReport, setFieldPoliceReport] = useState(false);
  const [fieldDamageCode, setFieldDamageCode] = useState('COLL-DMG-01');
  const [fieldNotes, setFieldNotes] = useState('');
  const [savingFields, setSavingFields] = useState(false);
  const [fieldSaveSuccess, setFieldSaveSuccess] = useState('');
  const [fieldSaveError, setFieldSaveError] = useState('');

  // Escalation Modal State (Sub-slice 2.4)
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  const [escalating, setEscalating] = useState(false);
  const [escalateError, setEscalateError] = useState('');

  // Settlement Decision State (Sub-slice 3.1)
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState<'approved' | 'rejected'>('approved');
  const [settlementAmountInput, setSettlementAmountInput] = useState<number | string>('');
  const [justificationNote, setJustificationNote] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [decisionError, setDecisionError] = useState('');
  const [decisionSuccess, setDecisionSuccess] = useState('');

  useEffect(() => {
    fetchClaimDetail();
  }, [id]);

  const fetchClaimDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/claims/${id}`);
      setClaim(res.data);
      // Initialize verified fields
      const struct = res.data.structured_data || {};
      setFieldDate(struct.extracted_date || res.data.incident_date?.split('T')[0] || '');
      setFieldLossType(struct.loss_type || res.data.incident_type || 'auto_collision');
      setFieldDamage(struct.estimated_damage !== undefined ? struct.estimated_damage : res.data.claimed_amount);
      setFieldPoliceReport(Boolean(struct.police_report_filed));
      setFieldDamageCode(struct.damage_code || 'COLL-DMG-01');
      setFieldNotes(struct.notes || '');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to retrieve claim details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFieldCorrections = async () => {
    setFieldSaveError('');
    setFieldSaveSuccess('');
    const dmg = parseFloat(String(fieldDamage));
    if (isNaN(dmg) || dmg <= 0) {
      setFieldSaveError('Verified loss amount must be a valid number greater than $0.');
      return;
    }

    setSavingFields(true);
    try {
      const payload = {
        extracted_date: fieldDate,
        loss_type: fieldLossType,
        estimated_damage: dmg,
        police_report_filed: fieldPoliceReport,
        damage_code: fieldDamageCode,
        notes: fieldNotes
      };
      const res = await api.patch(`/api/claims/${id}/fields`, payload);
      setClaim(res.data);
      setIsEditingFields(false);
      setFieldSaveSuccess('Fields verified & corrections recorded in audit log!');
      setTimeout(() => setFieldSaveSuccess(''), 3000);
    } catch (err: any) {
      setFieldSaveError(err.response?.data?.detail || 'Failed to save field corrections.');
    } finally {
      setSavingFields(false);
    }
  };

  const handleEscalateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setEscalateError('');
    if (!escalateReason.trim()) {
      setEscalateError('Please provide an escalation justification note.');
      return;
    }

    setEscalating(true);
    try {
      const res = await api.post(`/api/claims/${id}/escalate`, {
        escalation_reason: escalateReason.trim()
      });
      setClaim(res.data);
      setIsEscalateModalOpen(false);
      setEscalateReason('');
      navigate('/adjuster/investigations');
    } catch (err: any) {
      setEscalateError(err.response?.data?.detail || 'Failed to escalate claim.');
    } finally {
      setEscalating(false);
    }
  };

  const handleOpenDecisionModal = (type: 'approved' | 'rejected') => {
    setDecisionType(type);
    setDecisionError('');
    setJustificationNote('');
    if (type === 'approved') {
      const net = (claim?.structured_data?.calculated_net_payable !== undefined)
        ? claim.structured_data.calculated_net_payable
        : Math.max(0, Math.min(claim?.claimed_amount || 0, claim?.policy_coverage_limit || 0) - (claim?.policy_deductible || 500));
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
      if (claim?.policy_coverage_limit && parsedAmount > claim.policy_coverage_limit) {
        setDecisionError(`Settlement payout cannot exceed coverage limit of $${claim.policy_coverage_limit.toLocaleString()}.`);
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
      const res = await api.post(`/api/claims/${id}/decision`, payload);
      setClaim(res.data);
      setIsDecisionModalOpen(false);
      setDecisionSuccess(`Claim ${res.data.claim_number} successfully ${decisionType === 'approved' ? 'Approved & Settled' : 'Rejected'}!`);
      setTimeout(() => setDecisionSuccess(''), 4000);
    } catch (err: any) {
      setDecisionError(err.response?.data?.detail || 'Failed to commit claim adjudication.');
    } finally {
      setSubmittingDecision(false);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3.0));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleResetView = () => {
    setZoom(1);
    setRotation(0);
  };

  const handleAttachSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttachError('');
    if (!newDocName.trim()) {
      setAttachError('Please enter a document name.');
      return;
    }
    if (!newDocUrl.trim()) {
      setAttachError('Please enter a valid document or image URL.');
      return;
    }

    setAttaching(true);
    try {
      await api.post(`/api/claims/${id}/documents`, {
        name: newDocName.trim(),
        type: newDocType,
        url: newDocUrl.trim(),
        description: newDocDescription.trim()
      });
      setIsAttachModalOpen(false);
      setNewDocName('');
      setNewDocUrl('');
      setNewDocDescription('');
      fetchClaimDetail();
    } catch (err: any) {
      setAttachError(err.response?.data?.detail || 'Failed to attach document.');
    } finally {
      setAttaching(false);
    }
  };

  const getFraudPill = (tier: string, score: number) => {
    if (tier === 'high' || score >= 65) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 14, fontSize: '0.8rem', fontWeight: 700, background: '#ef444420', color: '#f87171', border: '1px solid #ef444440' }}>
          <ShieldAlert size={14} />
          Fraud Risk: High ({score})
        </span>
      );
    }
    if (tier === 'medium' || score >= 35) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 14, fontSize: '0.8rem', fontWeight: 700, background: '#f59e0b20', color: '#fbbf24', border: '1px solid #f59e0b40' }}>
          Fraud Risk: Med ({score})
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 14, fontSize: '0.8rem', fontWeight: 700, background: '#10b98120', color: '#34d399', border: '1px solid #10b98140' }}>
        <ShieldCheck size={14} />
        Fraud Risk: Low ({score})
      </span>
    );
  };

  const getStatusPill = (status: string) => {
    switch (status) {
      case 'approved':
        return <span style={{ padding: '3px 9px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 600, background: '#10b98125', color: '#34d399' }}>Approved</span>;
      case 'rejected':
        return <span style={{ padding: '3px 9px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 600, background: '#ef444425', color: '#f87171' }}>Rejected</span>;
      case 'in_investigation':
        return <span style={{ padding: '3px 9px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 600, background: '#8b5cf625', color: '#c084fc' }}>In Investigation</span>;
      default:
        return <span style={{ padding: '3px 9px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 600, background: '#0284c725', color: '#38bdf8' }}>Pending Review</span>;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 40px', maxWidth: 1440, margin: '0 auto', textAlign: 'center', color: '#94a3b8' }}>
        Loading claim dossier...
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div style={{ padding: '60px 40px', maxWidth: 1440, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#ef444420', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#f87171' }}>
          <AlertCircle size={26} />
        </div>
        <h2 style={{ fontSize: '1.25rem', color: '#f8fafc', marginBottom: 8 }}>{error || 'Claim Not Found'}</h2>
        <button
          onClick={() => navigate('/adjuster/dashboard')}
          style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#1e293b', color: '#f8fafc', cursor: 'pointer', marginTop: 12 }}
        >
          Return to Queue
        </button>
      </div>
    );
  }

  const isHighFraud = claim.fraud_tier === 'high' || claim.fraud_score >= 65;
  const netPayable = Math.max(0, Math.min(claim.claimed_amount, claim.policy_coverage_limit) - (claim.policy_deductible || 500));
  const documents = claim.documents || [];
  const activeDoc = documents[activeDocIndex] || null;

  return (
    <div style={{ padding: '28px 40px', maxWidth: 1440, margin: '0 auto' }}>
      {/* Top Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <button
          onClick={() => navigate('/adjuster/dashboard')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '0.85rem',
            cursor: 'pointer',
            padding: 0
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Claims Queue</span>
        </button>

        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
          {tenantContext.name} · Fast-Lane Adjudication
        </div>
      </div>

      {/* Header Bar */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                {claim.claim_number}
              </h1>
              {getStatusPill(claim.status)}
              {getFraudPill(claim.fraud_tier, claim.fraud_score)}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 6 }}>
              Loss Type: <span style={{ color: '#cbd5e1', fontWeight: 500 }}>{claim.incident_type?.replace(/_/g, ' ')}</span> · Registered: <span style={{ color: '#cbd5e1' }}>{new Date(claim.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>SLA Compliance</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end', marginTop: 2 }}>
                <Clock size={14} />
                <span>5-Day Turnaround</span>
              </div>
            </div>
          </div>
        </div>

        {/* High Fraud Recommendation Alert Banner */}
        {isHighFraud && claim.status === 'pending_review' && (
          <div style={{ marginTop: 18, padding: '12px 16px', borderRadius: 8, background: '#ef444415', border: '1px solid #ef444440', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={18} style={{ color: '#f87171' }} />
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f87171' }}>
                  Recommended: Escalate to Investigation
                </span>
                <span style={{ fontSize: '0.8rem', color: '#cbd5e1', marginLeft: 8 }}>
                  Elevated risk indicators detected. Review evidence before approving settlement.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KPI Financial Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>Claimed Loss Amount</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f8fafc', marginTop: 6 }}>
            ${Number(claim.claimed_amount).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>Claimant reported damages</div>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>Policy Coverage Limit</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#38bdf8', marginTop: 6 }}>
            ${Number(claim.policy_coverage_limit).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>Maximum carrier liability</div>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>Standard Deductible</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fbbf24', marginTop: 6 }}>
            ${Number(claim.policy_deductible || 500).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>Policyholder contribution</div>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>Calculated Net Settlement</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#34d399', marginTop: 6 }}>
            ${Number(netPayable).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>Payable = Claimed − Deductible</div>
        </div>
      </div>

      {/* Policy & Claimant Dossier Card */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
            <User size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc' }}>
              {claim.claimant_name}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              {claim.claimant_email}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: '0.82rem' }}>
          <div>
            <span style={{ color: '#64748b' }}>Active Policy: </span>
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>{claim.policy_number}</span>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Policy Inception: </span>
            <span style={{ color: '#cbd5e1' }}>{claim.policy_start_date ? new Date(claim.policy_start_date).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Incident Date: </span>
            <span style={{ color: '#cbd5e1' }}>{new Date(claim.incident_date).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Two-Pane Workspace Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '56% 44%', gap: 24, alignItems: 'start' }}>
        
        {/* Left Pane: Interactive Document & Photo Evidence Vault (Sub-slice 2.2) */}
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, overflow: 'hidden' }}>
          {/* Vault Header & Document Tabs */}
          <div style={{ padding: '14px 18px', background: '#0b1329', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileSpreadsheet size={18} style={{ color: '#38bdf8' }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: '#f8fafc' }}>
                Evidence Vault ({documents.length} files)
              </h3>
            </div>

            <button
              onClick={() => setIsAttachModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 10px',
                borderRadius: 6,
                border: '1px solid #334155',
                background: '#1e293b',
                color: '#cbd5e1',
                fontSize: '0.75rem',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              <Plus size={13} />
              <span>Attach File</span>
            </button>
          </div>

          {/* Document Tabs Strip */}
          <div style={{ display: 'flex', gap: 4, padding: '8px 12px', background: '#070d1d', borderBottom: '1px solid #1e293b', overflowX: 'auto' }}>
            {documents.map((doc: any, idx: number) => {
              const isActive = idx === activeDocIndex;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveDocIndex(idx);
                    handleResetView();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: isActive ? '1px solid #0284c7' : '1px solid transparent',
                    background: isActive ? '#0284c720' : '#0f172a',
                    color: isActive ? '#38bdf8' : '#94a3b8',
                    fontSize: '0.75rem',
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <FileText size={13} style={{ color: isActive ? '#38bdf8' : '#64748b' }} />
                  <span>{doc.name}</span>
                  <span style={{ fontSize: '0.65rem', padding: '1px 4px', borderRadius: 4, background: '#1e293b', color: '#94a3b8', textTransform: 'uppercase' }}>
                    {doc.type}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Document Viewer Viewport */}
          {activeDoc ? (
            <div style={{ position: 'relative', background: '#030712' }}>
              {/* Floating Toolbar Controls */}
              <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, display: 'flex', gap: 6, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)', padding: '4px 8px', borderRadius: 8, border: '1px solid #334155' }}>
                <button
                  onClick={handleZoomIn}
                  title="Zoom In (+25%)"
                  style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: 4, display: 'flex' }}
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  onClick={handleZoomOut}
                  title="Zoom Out (-25%)"
                  style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: 4, display: 'flex' }}
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  onClick={handleRotate}
                  title="Rotate 90° Clockwise"
                  style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: 4, display: 'flex' }}
                >
                  <RotateCw size={16} />
                </button>
                <button
                  onClick={handleResetView}
                  title="Reset View"
                  style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: 4, display: 'flex' }}
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  onClick={() => setIsFullscreen(true)}
                  title="Expand Preview"
                  style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: 4, display: 'flex' }}
                >
                  <Maximize2 size={16} />
                </button>
              </div>

              {/* Viewport Canvas */}
              <div style={{ height: 460, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 16 }}>
                {activeDoc.type === 'image' ? (
                  <img
                    src={activeDoc.url}
                    alt={activeDoc.name}
                    style={{
                      maxHeight: '100%',
                      maxWidth: '100%',
                      objectFit: 'contain',
                      borderRadius: 4,
                      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      transition: 'transform 0.2s ease',
                      cursor: zoom > 1 ? 'grab' : 'default'
                    }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: 32, maxWidth: 380 }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#0284c720', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <FileText size={32} />
                    </div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', margin: '0 0 6px' }}>
                      {activeDoc.name}
                    </h4>
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 16px', lineHeight: 1.4 }}>
                      {activeDoc.description || 'Certified PDF evidence record attached to this claim.'}
                    </p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                      <a
                        href={activeDoc.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 14px',
                          borderRadius: 6,
                          background: '#0284c7',
                          color: '#ffffff',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          textDecoration: 'none'
                        }}
                      >
                        <ExternalLink size={14} />
                        <span>Open Document</span>
                      </a>
                      <a
                        href={activeDoc.url}
                        download
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 14px',
                          borderRadius: 6,
                          background: '#1e293b',
                          color: '#cbd5e1',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          textDecoration: 'none',
                          border: '1px solid #334155'
                        }}
                      >
                        <Download size={14} />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Document Caption / Metadata Strip */}
              <div style={{ padding: '12px 18px', background: '#0f172a', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                  <span style={{ color: '#64748b' }}>Caption:</span>
                  <span style={{ color: '#cbd5e1', fontWeight: 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {activeDoc.description || activeDoc.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#64748b' }}>
                  <span>Zoom: {Math.round(zoom * 100)}%</span>
                  <span>Rotation: {rotation}°</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
              No documents attached to this claim.
            </div>
          )}
        </div>

        {/* Right Pane: Extracted Data Verification & Fraud Rationale (Sub-slices 2.3, 2.4) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Extracted Data Verification Panel (Sub-slice 2.3) */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid #1e293b', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <DollarSign size={18} style={{ color: '#34d399' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: '#f8fafc' }}>
                  Extracted Data Verification
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: 4, background: '#0284c720', color: '#38bdf8', fontWeight: 600, textTransform: 'uppercase' }}>
                  Document Intelligence
                </span>
                {!isEditingFields ? (
                  <button
                    onClick={() => setIsEditingFields(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '4px 9px',
                      borderRadius: 6,
                      background: '#1e293b',
                      border: '1px solid #334155',
                      color: '#cbd5e1',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    <Edit3 size={13} />
                    <span>Edit Fields</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditingFields(false)}
                    style={{
                      padding: '4px 9px',
                      borderRadius: 6,
                      background: '#1e293b',
                      border: '1px solid #334155',
                      color: '#94a3b8',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {fieldSaveSuccess && (
              <div style={{ padding: '8px 12px', borderRadius: 6, background: '#10b98120', border: '1px solid #10b98140', color: '#34d399', fontSize: '0.8rem', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check size={14} />
                <span>{fieldSaveSuccess}</span>
              </div>
            )}
            {fieldSaveError && (
              <div style={{ padding: '8px 12px', borderRadius: 6, background: '#ef444420', border: '1px solid #ef444440', color: '#f87171', fontSize: '0.8rem', marginBottom: 14 }}>
                {fieldSaveError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Incident Date */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>Verified Loss Date</label>
                {isEditingFields ? (
                  <input
                    type="date"
                    value={fieldDate}
                    onChange={e => setFieldDate(e.target.value)}
                    style={{ padding: '5px 8px', borderRadius: 6, background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', fontSize: '0.82rem', outline: 'none' }}
                  />
                ) : (
                  <span style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 600 }}>{fieldDate || 'Not Extracted'}</span>
                )}
              </div>

              {/* Loss / Incident Type */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>Loss Classification</label>
                {isEditingFields ? (
                  <select
                    value={fieldLossType}
                    onChange={e => setFieldLossType(e.target.value)}
                    style={{ padding: '5px 8px', borderRadius: 6, background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', fontSize: '0.82rem', outline: 'none' }}
                  >
                    <option value="auto_collision">Auto Collision</option>
                    <option value="property_water_damage">Property Damage</option>
                    <option value="theft_burglary">Theft / Burglary</option>
                    <option value="medical_injury">Medical / Bodily Injury</option>
                  </select>
                ) : (
                  <span style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600, textTransform: 'capitalize' }}>
                    {fieldLossType?.replace(/_/g, ' ')}
                  </span>
                )}
              </div>

              {/* Verified Damage Amount */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>Verified Repair Damage ($)</label>
                {isEditingFields ? (
                  <input
                    type="number"
                    step="0.01"
                    value={fieldDamage}
                    onChange={e => setFieldDamage(e.target.value)}
                    style={{ width: 140, padding: '5px 8px', borderRadius: 6, background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', fontSize: '0.82rem', outline: 'none' }}
                  />
                ) : (
                  <span style={{ fontSize: '0.9rem', color: '#38bdf8', fontWeight: 700 }}>
                    ${Number(fieldDamage || 0).toLocaleString()}
                  </span>
                )}
              </div>

              {/* Police Report Verification */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>Police Report Filed</label>
                {isEditingFields ? (
                  <input
                    type="checkbox"
                    checked={fieldPoliceReport}
                    onChange={e => setFieldPoliceReport(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#0284c7', cursor: 'pointer' }}
                  />
                ) : (
                  <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: 4, background: fieldPoliceReport ? '#10b98120' : '#ef444420', color: fieldPoliceReport ? '#34d399' : '#f87171', fontWeight: 600 }}>
                    {fieldPoliceReport ? 'Verified' : 'Unconfirmed'}
                  </span>
                )}
              </div>

              {/* Damage Code */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>Damage Diagnostic Code</label>
                {isEditingFields ? (
                  <input
                    type="text"
                    value={fieldDamageCode}
                    onChange={e => setFieldDamageCode(e.target.value)}
                    style={{ width: 150, padding: '5px 8px', borderRadius: 6, background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', fontSize: '0.82rem', outline: 'none' }}
                  />
                ) : (
                  <span style={{ fontSize: '0.82rem', color: '#cbd5e1', fontFamily: 'monospace' }}>
                    {fieldDamageCode}
                  </span>
                )}
              </div>

              {/* Notes */}
              {isEditingFields ? (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500, marginBottom: 4 }}>
                    Adjuster Verification Rationale
                  </label>
                  <textarea
                    rows={2}
                    value={fieldNotes}
                    onChange={e => setFieldNotes(e.target.value)}
                    placeholder="Rationale for field adjustments or estimate correction..."
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, background: '#1e293b', border: '1px solid #334155', color: '#f8fafc', fontSize: '0.82rem', outline: 'none', resize: 'vertical' }}
                  />
                </div>
              ) : fieldNotes ? (
                <div style={{ padding: '8px 10px', background: '#0b1329', borderRadius: 6, border: '1px solid #1e293b', fontSize: '0.78rem', color: '#94a3b8' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Adjuster Note: </span>{fieldNotes}
                </div>
              ) : null}

              {/* Save Corrections Action */}
              {isEditingFields && (
                <button
                  onClick={handleSaveFieldCorrections}
                  disabled={savingFields}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 6,
                    background: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: 6
                  }}
                >
                  <Save size={14} />
                  <span>{savingFields ? 'Saving Corrections...' : 'Save Field Corrections'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Explainable Fraud Risk Factors Panel (Sub-slice 2.4) */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid #1e293b', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldAlert size={18} style={{ color: isHighFraud ? '#f87171' : '#38bdf8' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: '#f8fafc' }}>
                  Explainable Fraud Risk Factors
                </h3>
              </div>
              <span style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: 4, background: '#1e293b', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                SHAP Risk Intelligence
              </span>
            </div>

            {/* Risk Gauge Bar */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: '0.8rem' }}>
                <span style={{ color: '#94a3b8' }}>Fraud Confidence Score</span>
                <span style={{ fontWeight: 700, color: isHighFraud ? '#f87171' : claim.fraud_score >= 35 ? '#fbbf24' : '#34d399' }}>
                  {claim.fraud_score} / 100 ({claim.fraud_tier?.toUpperCase()})
                </span>
              </div>
              <div style={{ height: 6, width: '100%', background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${claim.fraud_score}%`,
                    background: isHighFraud ? '#ef4444' : claim.fraud_score >= 35 ? '#f59e0b' : '#10b981',
                    borderRadius: 3,
                    transition: 'width 0.4s ease'
                  }}
                />
              </div>
            </div>

            {/* Explainability Indicator Chips / List */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.04em' }}>
                Driving Signals & Heuristics
              </div>
              {claim.fraud_indicators && claim.fraud_indicators.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {claim.fraud_indicators.map((ind: string, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 6,
                        background: '#0b1329',
                        border: '1px solid #1e293b',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10
                      }}
                    >
                      <AlertTriangle size={15} style={{ color: isHighFraud ? '#f87171' : '#fbbf24', marginTop: 2, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.82rem', color: '#f8fafc', fontWeight: 500, lineHeight: 1.4 }}>
                          {ind}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>
                          Factor weight: Elevated risk contribution
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '12px 14px', borderRadius: 6, background: '#10b98110', border: '1px solid #10b98130', color: '#34d399', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={16} />
                  <span>No elevated fraud anomalies detected. Claim matches baseline heuristics.</span>
                </div>
              )}
            </div>

            {/* Prominent Escalation Recommendation Callout */}
            {isHighFraud && claim.status === 'pending_review' ? (
              <div style={{ padding: '14px 16px', borderRadius: 8, background: '#ef444415', border: '1px solid #ef444440' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f87171', marginBottom: 4 }}>
                  Recommended: Escalate to Investigation
                </div>
                <p style={{ fontSize: '0.78rem', color: '#cbd5e1', margin: '0 0 12px', lineHeight: 1.4 }}>
                  This claim exceeds carrier threshold. Escalate to the slow-lane workspace to review full policyholder claims history and maintain multi-session notes.
                </p>
                <button
                  onClick={() => setIsEscalateModalOpen(true)}
                  style={{
                    width: '100%',
                    padding: '8px 14px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                  }}
                >
                  <ShieldAlert size={14} />
                  <span>Escalate Claim to Investigation Workspace</span>
                  <ArrowUpRight size={14} />
                </button>
              </div>
            ) : claim.status === 'in_investigation' ? (
              <div style={{ padding: '12px 16px', borderRadius: 8, background: '#8b5cf615', border: '1px solid #8b5cf640', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '0.8rem', color: '#c084fc', fontWeight: 600 }}>
                  Case Active in Investigation Workspace
                </div>
                <button
                  onClick={() => navigate('/adjuster/investigations')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid #8b5cf650',
                    background: '#8b5cf620',
                    color: '#c084fc',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <span>Open Investigation</span>
                  <ArrowUpRight size={12} />
                </button>
              </div>
            ) : null}
          </div>

          {/* Sub-slice 3.1: Fast-Lane Settlement Adjudication Console or Settled Record */}
          {decisionSuccess && (
            <div style={{ padding: '12px 16px', borderRadius: 8, background: '#10b98120', border: '1px solid #10b98150', color: '#34d399', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} />
              <span>{decisionSuccess}</span>
            </div>
          )}

          {claim.status === 'approved' || claim.status === 'rejected' ? (
            /* Settled Adjudication Record */
            <div style={{
              background: claim.status === 'approved' ? '#064e3b15' : '#7f1d1d15',
              border: `1px solid ${claim.status === 'approved' ? '#10b98140' : '#ef444440'}`,
              borderRadius: 10,
              padding: 20
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${claim.status === 'approved' ? '#10b98125' : '#ef444425'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {claim.status === 'approved' ? (
                    <CheckCircle2 size={20} style={{ color: '#34d399' }} />
                  ) : (
                    <XCircle size={20} style={{ color: '#f87171' }} />
                  )}
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: claim.status === 'approved' ? '#34d399' : '#f87171' }}>
                    Settlement Adjudication Record
                  </h3>
                </div>
                <span style={{
                  padding: '3px 9px',
                  borderRadius: 12,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  background: claim.status === 'approved' ? '#10b98125' : '#ef444425',
                  color: claim.status === 'approved' ? '#34d399' : '#f87171',
                  border: `1px solid ${claim.status === 'approved' ? '#10b98150' : '#ef444450'}`
                }}>
                  {claim.status === 'approved' ? 'Claim Approved' : 'Claim Rejected'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div style={{ background: '#0b1329', padding: '10px 14px', borderRadius: 8, border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>Settlement Payout</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: claim.status === 'approved' ? '#34d399' : '#94a3b8' }}>
                    ${(claim.approved_settlement_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div style={{ background: '#0b1329', padding: '10px 14px', borderRadius: 8, border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>Deductible Applied</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
                    ${(claim.deductible_applied || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>
                  Official Justification Rationale:
                </div>
                <div style={{
                  background: '#0b1329',
                  border: '1px solid #1e293b',
                  borderRadius: 6,
                  padding: '12px 14px',
                  fontSize: '0.82rem',
                  color: '#e2e8f0',
                  fontStyle: 'italic',
                  lineHeight: 1.5
                }}>
                  "{claim.settlement_note || 'No justification note recorded.'}"
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', paddingTop: 8, borderTop: '1px solid #1e293b' }}>
                <span>Adjudicated by: <strong style={{ color: '#cbd5e1' }}>{claim.decided_by_name || 'Claims Adjuster'}</strong></span>
                <span>{claim.decided_at ? new Date(claim.decided_at).toLocaleString() : ''}</span>
              </div>
            </div>
          ) : (
            /* Active Adjudication Console for pending_review or in_investigation */
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid #1e293b', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DollarSign size={18} style={{ color: '#38bdf8' }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: '#f8fafc' }}>
                    Settlement Adjudication
                  </h3>
                </div>
                <span style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: 4, background: '#0284c720', color: '#38bdf8', fontWeight: 600, textTransform: 'uppercase' }}>
                  Decision Engine
                </span>
              </div>

              <div style={{ background: '#0b1329', border: '1px solid #1e293b', borderRadius: 8, padding: 14, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#94a3b8', marginBottom: 6 }}>
                  <span>Verified Loss Assessment:</span>
                  <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                    ${(claim.structured_data?.estimated_damage ?? claim.claimed_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#94a3b8', marginBottom: 8 }}>
                  <span>Policy Deductible:</span>
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>
                    -${(claim.policy_deductible || 500).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div style={{ borderTop: '1px solid #1e293b', paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc' }}>Net Settlement Payout:</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399' }}>
                    ${((claim.structured_data?.calculated_net_payable !== undefined)
                      ? claim.structured_data.calculated_net_payable
                      : Math.max(0, Math.min(claim.claimed_amount, claim.policy_coverage_limit || claim.claimed_amount) - (claim.policy_deductible || 500))
                    ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  onClick={() => handleOpenDecisionModal('approved')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#10b981',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <CheckCircle2 size={15} />
                  <span>Approve Settlement</span>
                </button>
                <button
                  onClick={() => handleOpenDecisionModal('rejected')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 6,
                    border: '1px solid #ef444450',
                    background: '#ef444420',
                    color: '#f87171',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <XCircle size={15} />
                  <span>Reject Claim</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Preview Modal */}
      {isFullscreen && activeDoc && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3, 7, 18, 0.95)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            padding: 24
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileText size={20} style={{ color: '#38bdf8' }} />
              <span style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>{activeDoc.name}</span>
            </div>
            <button
              onClick={() => setIsFullscreen(false)}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
            >
              <X size={24} />
            </button>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img
              src={activeDoc.url}
              alt={activeDoc.name}
              style={{
                maxHeight: '90vh',
                maxWidth: '90vw',
                objectFit: 'contain',
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease'
              }}
            />
          </div>
        </div>
      )}

      {/* Attach Supplemental Document Modal */}
      {isAttachModalOpen && (
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
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, width: '100%', maxWidth: 500, overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, color: '#f8fafc' }}>
                Attach Supplemental Evidence
              </h3>
              <button
                onClick={() => setIsAttachModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAttachSubmit} style={{ padding: '20px 24px' }}>
              {attachError && (
                <div style={{ padding: '8px 12px', borderRadius: 6, background: '#ef444420', color: '#f87171', fontSize: '0.82rem', marginBottom: 14 }}>
                  {attachError}
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                  Document Name / Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Police_Accident_Report_Official.pdf"
                  value={newDocName}
                  onChange={e => setNewDocName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                  Document Type *
                </label>
                <select
                  value={newDocType}
                  onChange={e => setNewDocType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                >
                  <option value="image">Incident Damage Photo</option>
                  <option value="pdf">Certified PDF Document</option>
                  <option value="estimate">Body Shop / Repair Estimate</option>
                  <option value="report">Police / Authority Report</option>
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                  Evidence Source URL *
                </label>
                <input
                  type="text"
                  placeholder="https://... or sample URL"
                  value={newDocUrl}
                  onChange={e => setNewDocUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                  Description / Adjuster Note
                </label>
                <textarea
                  rows={2}
                  placeholder="Details regarding source, timestamp, or authenticity..."
                  value={newDocDescription}
                  onChange={e => setNewDocDescription(e.target.value)}
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
                  onClick={() => setIsAttachModalOpen(false)}
                  style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #334155', background: '#1e293b', color: '#94a3b8', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={attaching}
                  style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#0284c7', color: '#ffffff', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  {attaching ? 'Attaching...' : 'Attach Evidence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Escalation to Investigation Modal (Sub-slice 2.4) */}
      {isEscalateModalOpen && (
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
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, width: '100%', maxWidth: 520, overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ background: '#ef444420', padding: 8, borderRadius: 8, color: '#f87171' }}>
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, color: '#f8fafc' }}>
                    Escalate to Investigation Workspace
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Handoff claim to multi-session deep-dive inquiry
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsEscalateModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEscalateClaim} style={{ padding: '20px 24px' }}>
              {escalateError && (
                <div style={{ padding: '8px 12px', borderRadius: 6, background: '#ef444420', color: '#f87171', fontSize: '0.82rem', marginBottom: 14 }}>
                  {escalateError}
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                  Quick Rationale Templates
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    'Inception proximity requires claimant & agent interview',
                    'Elevated loss-to-limit ratio requires on-site appraiser inspection',
                    'Discrepancy between stated loss and photo evidence',
                    'Suspected pre-existing damage or prior unrecorded loss'
                  ].map((template, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEscalateReason(template)}
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
                  Mandatory Escalation Justification Note *
                </label>
                <textarea
                  rows={3}
                  placeholder="Detail the suspicious findings, inconsistent evidence, or reasoning for escalating this claim..."
                  value={escalateReason}
                  onChange={e => setEscalateReason(e.target.value)}
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
                  onClick={() => setIsEscalateModalOpen(false)}
                  style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #334155', background: '#1e293b', color: '#94a3b8', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={escalating}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <ShieldAlert size={14} />
                  <span>{escalating ? 'Escalating...' : 'Confirm Escalation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-slice 3.1: Settlement Decision Adjudication Modal */}
      {isDecisionModalOpen && (
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
                    {decisionType === 'approved' ? 'Approve Settlement Adjudication' : 'Reject Claim Adjudication'}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Claim: {claim.claim_number} • Claimant: {claim.claimant_name}
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
                    max={claim.policy_coverage_limit || undefined}
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
                    Max coverage limit: ${(claim.policy_coverage_limit || 0).toLocaleString()} • Deductible applied: ${(claim.policy_deductible || 500).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '12px 14px', borderRadius: 8, background: '#ef444415', border: '1px solid #ef444430', marginBottom: 16, fontSize: '0.8rem', color: '#f87171' }}>
                  Rejection will close this claim with zero settlement payout. A formal rejection record will be archived.
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                  Quick Rationale Templates
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(decisionType === 'approved' ? [
                    'Damage verified against certified body shop repair estimate',
                    'Incident corroborated by official police report; coverage active',
                    'Photo evidence authentic; loss falls within policy coverage scope',
                    'Claim documents verified and net settlement calculated within policy limits'
                  ] : [
                    'Damage exceeds policy scope / specific exclusion clause applies',
                    'Failure to report within mandatory policy notice timeframe',
                    'Pre-existing vehicular damage identified; outside coverage period',
                    'Unsubstantiated loss; lack of corroborating evidence or proof of incident'
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
                  Mandatory Adjudication Justification Note *
                </label>
                <textarea
                  rows={3}
                  placeholder={decisionType === 'approved'
                    ? "State the verification basis for authorizing this settlement payout..."
                    : "State the regulatory and policy grounds for rejecting this claim..."
                  }
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
                  <span>{submittingDecision ? 'Committing...' : (decisionType === 'approved' ? 'Confirm & Approve Settlement' : 'Confirm & Reject Claim')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
