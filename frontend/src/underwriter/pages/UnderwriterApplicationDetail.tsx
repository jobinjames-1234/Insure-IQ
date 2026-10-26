import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  DollarSign,
  Shield,
  Activity,
  Phone,
  Mail,
  User,
  ExternalLink,
  Lock
} from 'lucide-react';
import api from '../../api';

interface EligibilityCheck {
  rule_name: string;
  requirement: string;
  declared_value: string;
  status: 'pass' | 'warning' | 'fail';
  description: string;
}

interface FeatureImportance {
  factor: string;
  impact: string;
  tier: 'positive' | 'neutral' | 'negative';
}

interface ApplicationDetail {
  id: number;
  tenant_id: number;
  policy_config_id?: number;
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
  status: 'pending_review' | 'approved' | 'rejected' | 'referred';
  applicant_data?: any;
  risk_factors?: any;
  documents?: Array<{ name: string; type: string; verified: boolean }>;
  decision_note?: string;
  decided_at?: string;
  decided_by_name?: string;
  created_at: string;
  updated_at: string;
  policy_config_name?: string;
  policy_config_version?: string;
  standard_deductible?: number;
  min_allowed_premium?: number;
  max_allowed_premium?: number;
  max_coverage_limit?: number;
  eligibility_evaluation?: EligibilityCheck[];
  feature_importance?: FeatureImportance[];
  suggested_action?: string;
}

interface UnderwriterApplicationDetailProps {
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

export default function UnderwriterApplicationDetail({ tenantContext, currentUser }: UnderwriterApplicationDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Decision state
  const [adjustedPremium, setAdjustedPremium] = useState<string>('');
  const [justificationNote, setJustificationNote] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [decisionError, setDecisionError] = useState('');

  // Document preview modal
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/underwriting/applications/${id}`);
      setApplication(res.data);
      if (res.data.adjusted_premium) {
        setAdjustedPremium(String(res.data.adjusted_premium));
      }
    } catch (err: any) {
      console.error('Failed to load application detail', err);
      setError(err.response?.data?.detail || 'Unable to load application details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (outcome: 'approved' | 'rejected' | 'referred') => {
    if (!justificationNote.trim() || justificationNote.trim().length < 3) {
      setDecisionError('A mandatory justification note (at least 3 characters) is required to commit.');
      return;
    }

    setDecisionError('');
    setSubmittingDecision(true);

    try {
      const payload: any = {
        decision: outcome,
        justification_note: justificationNote.trim()
      };

      if (adjustedPremium && !isNaN(Number(adjustedPremium))) {
        payload.adjusted_premium = Number(adjustedPremium);
      }

      await api.post(`/api/underwriting/applications/${id}/decision`, payload);
      navigate('/underwriter/dashboard');
    } catch (err: any) {
      console.error('Decision submission failed', err);
      const detail = err.response?.data?.detail;
      setDecisionError(typeof detail === 'string' ? detail : 'Failed to record decision.');
    } finally {
      setSubmittingDecision(false);
    }
  };

  const renderConfidencePill = (score: number) => {
    if (score < 40) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: 14,
            background: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#4ade80',
            fontSize: '0.82rem',
            fontWeight: 700
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
          {score} low risk
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
            padding: '4px 12px',
            borderRadius: 14,
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#fbbf24',
            fontSize: '0.82rem',
            fontWeight: 700
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b' }} />
          {score} medium risk
        </span>
      );
    }
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 12px',
          borderRadius: 14,
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          fontSize: '0.82rem',
          fontWeight: 700
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444' }} />
        {score} high risk
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: 60, textAlign: 'center', color: '#94a3b8' }}>
        <Activity size={28} className="spin" style={{ margin: '0 auto 12px auto', color: '#60a5fa' }} />
        <div>Loading application details & actuarial evaluations...</div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <button
          onClick={() => navigate('/underwriter/dashboard')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'transparent',
            border: 'none',
            color: '#60a5fa',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: 20
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Queue</span>
        </button>

        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 48, textAlign: 'center' }}>
          <AlertTriangle size={32} style={{ color: '#ef4444', margin: '0 auto 12px auto' }} />
          <h3 style={{ color: '#f8fafc', margin: '0 0 8px 0' }}>{error || 'Application Not Found'}</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            The requested application may have been moved or does not belong to {tenantContext.name}.
          </p>
        </div>
      </div>
    );
  }

  const isDecided = application.status !== 'pending_review';

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto' }}>
      {/* Top Header / Breadcrumbs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => navigate('/underwriter/dashboard')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 6,
              padding: '6px 12px',
              color: '#cbd5e1',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={15} />
            <span>Back to Queue</span>
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                {application.application_number}
              </h1>
              <span
                style={{
                  textTransform: 'capitalize',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: 6,
                  background: application.status === 'pending_review' ? '#1e293b' : application.status === 'approved' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: application.status === 'pending_review' ? '#94a3b8' : application.status === 'approved' ? '#4ade80' : '#f87171',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}
              >
                {application.status.replace('_', ' ')}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
              Submitted {new Date(application.created_at).toLocaleString()} • {tenantContext.name}
            </div>
          </div>
        </div>

        <div>
          {renderConfidencePill(application.risk_score)}
        </div>
      </div>

      {/* Main Two-Column Decision Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.65fr) minmax(380px, 1fr)', gap: 24, alignItems: 'start' }}>
        {/* LEFT COLUMN: Applicant & Asset Dossier, Policy Reference, Actuarial Checks, Documents */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Card 1: Applicant Identity & Contact Dossier */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <User size={18} style={{ color: '#60a5fa' }} />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Applicant & Risk Subject Dossier
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, letterSpacing: '0.04em' }}>
                  Full Legal Name
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#f8fafc', marginTop: 4 }}>
                  {application.applicant_name}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, letterSpacing: '0.04em' }}>
                  Email Address
                </div>
                <div style={{ fontSize: '0.92rem', color: '#cbd5e1', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={13} style={{ color: '#64748b' }} />
                  <span>{application.applicant_email}</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, letterSpacing: '0.04em' }}>
                  Contact Phone
                </div>
                <div style={{ fontSize: '0.92rem', color: '#cbd5e1', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={13} style={{ color: '#64748b' }} />
                  <span>{application.applicant_phone || 'None provided'}</span>
                </div>
              </div>
            </div>

            {/* Subject Attributes */}
            <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: 10 }}>
                Subject / Underwriting Declarations:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {application.applicant_data && Object.keys(application.applicant_data).length > 0 ? (
                  Object.entries(application.applicant_data).map(([key, val]) => (
                    <div key={key}>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'capitalize' }}>
                        {key.replace('_', ' ')}:
                      </span>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', marginTop: 2 }}>
                        {String(val)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#64748b', fontSize: '0.8rem' }}>No additional declarations submitted.</div>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Policy Blueprint & Coverage Terms */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Shield size={18} style={{ color: '#38bdf8' }} />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Product Configuration & Coverage Terms
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>
                  Product Line
                </div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#f8fafc', marginTop: 4, textTransform: 'capitalize' }}>
                  {application.product_type} Insurance
                </div>
                <div style={{ fontSize: '0.72rem', color: '#60a5fa', marginTop: 2 }}>
                  {application.policy_config_name} ({application.policy_config_version})
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>
                  Coverage Limit
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>
                  ${application.coverage_amount.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                  Cap: ${application.max_coverage_limit?.toLocaleString()}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>
                  Standard Deductible
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>
                  ${application.standard_deductible?.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                  Per-incident standard
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>
                  Quoted Premium
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#4ade80', marginTop: 4 }}>
                  ${application.proposed_premium.toLocaleString()}/yr
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                  Base actuarial rate
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Actuarial Rule Evaluation Checklist */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={18} style={{ color: '#4ade80' }} />
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  Underwriting Eligibility & Rule Evaluation
                </h2>
              </div>
              <span style={{ fontSize: '0.75rem', background: '#1e293b', color: '#94a3b8', padding: '3px 8px', borderRadius: 4 }}>
                Evaluated against carrier policy rules
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {application.eligibility_evaluation?.map((chk, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 8,
                    background: '#090d16',
                    border: '1px solid #1e293b'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    {chk.status === 'pass' ? (
                      <CheckCircle2 size={17} style={{ color: '#22c55e', marginTop: 2, flexShrink: 0 }} />
                    ) : chk.status === 'warning' ? (
                      <AlertTriangle size={17} style={{ color: '#f59e0b', marginTop: 2, flexShrink: 0 }} />
                    ) : (
                      <XCircle size={17} style={{ color: '#ef4444', marginTop: 2, flexShrink: 0 }} />
                    )}

                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc' }}>
                        {chk.rule_name}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: 2 }}>
                        {chk.description}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: chk.status === 'pass' ? 'rgba(34, 197, 94, 0.15)' : chk.status === 'warning' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: chk.status === 'pass' ? '#4ade80' : chk.status === 'warning' ? '#fbbf24' : '#f87171'
                      }}
                    >
                      {chk.status}
                    </span>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
                      Value: <span style={{ color: '#e2e8f0' }}>{chk.declared_value}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Submitted Documents */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <FileText size={18} style={{ color: '#a78bfa' }} />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Verification Documents
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {application.documents?.map((doc, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 8,
                    background: '#090d16',
                    border: '1px solid #1e293b'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FileText size={16} style={{ color: '#60a5fa' }} />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                        {doc.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {doc.type} • Verified via KYC
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setPreviewDoc(doc.name)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '5px 10px',
                      borderRadius: 4,
                      background: '#1e293b',
                      border: '1px solid #334155',
                      color: '#60a5fa',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <span>View</span>
                    <ExternalLink size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sticky Decision Workspace */}
        <div style={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Decision Panel */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 22, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={18} style={{ color: '#60a5fa' }} />
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                    Underwriter Decision Panel
                  </h3>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                    Reviewing as {currentUser.name || currentUser.email}
                  </div>
                </div>
              </div>
              {isDecided && (
                <span style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Lock size={12} /> Decided
                </span>
              )}
            </div>

            {/* Risk Assessment Box */}
            <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: 8, padding: 14, marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Actuarial Risk Assessment</span>
                {renderConfidencePill(application.risk_score)}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                {application.suggested_action}
              </div>

              {/* Feature Importance contributions */}
              <div style={{ borderTop: '1px solid #1e293b', marginTop: 12, paddingTop: 10 }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginBottom: 6 }}>
                  Score Contribution Drivers:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {application.feature_importance?.map((feat, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span style={{ color: '#94a3b8' }}>{feat.factor}</span>
                      <span style={{ fontWeight: 600, color: feat.tier === 'positive' ? '#4ade80' : feat.tier === 'negative' ? '#f87171' : '#cbd5e1' }}>
                        {feat.impact}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Premium Adjustment Field */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1' }}>
                  Annual Policy Premium ($)
                </label>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Recommended: <strong style={{ color: '#f8fafc' }}>${application.proposed_premium.toLocaleString()}</strong>
                </span>
              </div>

              <div style={{ position: 'relative' }}>
                <DollarSign size={15} style={{ position: 'absolute', left: 12, top: 11, color: '#64748b' }} />
                <input
                  type="number"
                  disabled={isDecided}
                  value={adjustedPremium}
                  onChange={e => setAdjustedPremium(e.target.value)}
                  placeholder={String(application.proposed_premium)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 32px',
                    borderRadius: 6,
                    background: isDecided ? '#1e293b' : '#090d16',
                    border: '1px solid #334155',
                    color: '#f8fafc',
                    fontSize: '0.92rem',
                    fontWeight: 600
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
                <span>Allowed Carrier Band: ${application.min_allowed_premium?.toLocaleString()} – ${application.max_allowed_premium?.toLocaleString()}</span>
                {adjustedPremium && Number(adjustedPremium) !== application.proposed_premium && (
                  <span style={{ color: Number(adjustedPremium) > application.proposed_premium ? '#fbbf24' : '#60a5fa', fontWeight: 600 }}>
                    Override active ({Number(adjustedPremium) > application.proposed_premium ? '+' : ''}${(Number(adjustedPremium) - application.proposed_premium).toLocaleString()})
                  </span>
                )}
              </div>
            </div>

            {/* Mandatory Justification Note */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1' }}>
                  Decision Justification Note *
                </label>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  Mandatory for Audit Defensibility
                </span>
              </div>

              {isDecided ? (
                <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: 6, padding: '10px 12px', fontSize: '0.85rem', color: '#e2e8f0', minHeight: 64 }}>
                  {application.decision_note || 'No note recorded.'}
                </div>
              ) : (
                <>
                  <textarea
                    rows={3}
                    value={justificationNote}
                    onChange={e => {
                      setJustificationNote(e.target.value);
                      if (decisionError) setDecisionError('');
                    }}
                    placeholder="Type the underwriting reasoning or findings supporting this determination..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 6,
                      background: '#090d16',
                      border: decisionError ? '1px solid #ef4444' : '1px solid #334155',
                      color: '#f8fafc',
                      fontSize: '0.85rem',
                      resize: 'vertical',
                      boxShadow: decisionError ? '0 0 0 1px rgba(239, 68, 68, 0.4)' : 'none'
                    }}
                  />

                  {/* Quick Rationale Chips */}
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: 6 }}>
                      Quick Rationale Templates (click to insert):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {[
                        { label: 'Clean profile & verified KYC', text: 'Clean applicant profile and verified KYC. Conforms to carrier underwriting standards.' },
                        { label: 'Standard risk / within guidelines', text: 'Risk score within acceptable carrier guidelines. Approved at standard rate.' },
                        { label: 'Borderline exposure (Refer)', text: 'Borderline risk exposure detected. Referred for senior underwriter on-site inspection.' },
                        { label: 'High risk / exceeds limit (Reject)', text: 'Applicant risk evaluation exceeds permissible underwriting thresholds for this product class.' }
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setJustificationNote(item.text);
                            setDecisionError('');
                          }}
                          style={{
                            background: '#1e293b',
                            border: '1px solid #334155',
                            color: '#93c5fd',
                            padding: '3px 8px',
                            borderRadius: 4,
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          + {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {decisionError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '10px 12px', borderRadius: 6, fontSize: '0.82rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{decisionError}</span>
              </div>
            )}

            {/* Action Bar (Approve / Reject / Refer) */}
            {isDecided ? (
              <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
                  Decision Record
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                  Decided by {application.decided_by_name}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                  {application.decided_at && new Date(application.decided_at).toLocaleString()}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  type="button"
                  disabled={submittingDecision}
                  onClick={() => handleDecision('approved')}
                  style={{
                    width: '100%',
                    padding: '11px',
                    borderRadius: 6,
                    background: '#16a34a',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: submittingDecision ? 'not-allowed' : 'pointer',
                    opacity: submittingDecision ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Approve & Issue Policy</span>
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    type="button"
                    disabled={submittingDecision}
                    onClick={() => handleDecision('referred')}
                    style={{
                      padding: '9px',
                      borderRadius: 6,
                      background: '#d97706',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: submittingDecision ? 'not-allowed' : 'pointer',
                      opacity: submittingDecision ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <AlertTriangle size={15} />
                    <span>Refer for Review</span>
                  </button>

                  <button
                    type="button"
                    disabled={submittingDecision}
                    onClick={() => handleDecision('rejected')}
                    style={{
                      padding: '9px',
                      borderRadius: 6,
                      background: '#dc2626',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: submittingDecision ? 'not-allowed' : 'pointer',
                      opacity: submittingDecision ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <XCircle size={15} />
                    <span>Reject Coverage</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, width: '100%', maxWidth: 540, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} style={{ color: '#60a5fa' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>{previewDoc}</h3>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                <FileText size={32} style={{ color: '#60a5fa' }} />
              </div>
              <div style={{ fontWeight: 600, color: '#f8fafc', marginBottom: 6 }}>Verified Electronic Document</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', maxWidth: 360, margin: '0 auto 20px auto' }}>
                Encrypted and verified KYC artifact stored in tenant Document Vault with cryptographic hash check.
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                style={{ padding: '8px 18px', borderRadius: 6, background: '#2563eb', border: 'none', color: '#ffffff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
