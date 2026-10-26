import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  AlertCircle, 
  RefreshCw, 
  FileText, 
  FileCheck2, 
  MessageSquare,
  Plus,
  Shield,
  Clock,
  Car,
  Home,
  HeartPulse,
  Activity,
  User,
  CheckCircle2
} from 'lucide-react';

interface AgentCustomerDetailProps {
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

interface CustomerDossier {
  id: number;
  tenant_id: number;
  agent_id?: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  dob?: string;
  address?: string;
  status: string;
  churn_risk_flag: boolean;
  risk_flag: string;
  policy_count: number;
  total_premium: number;
  next_renewal_date?: string;
  created_at?: string;
}

interface PolicyItem {
  id: number;
  policy_number: string;
  product_type: string;
  premium_amount: number;
  coverage_limit: number;
  deductible: number;
  status: string;
  start_date: string;
  end_date?: string;
  renewal_date?: string;
  days_until_renewal?: number;
  created_at: string;
}

interface CustomerPoliciesResponse {
  customer_id: number;
  customer_name: string;
  policies: PolicyItem[];
  total_active_premium: number;
  active_count: number;
}

interface ClaimItem {
  id: number;
  claim_number: string;
  policy_number: string;
  incident_date: string;
  incident_type: string;
  incident_description: string;
  claimed_amount: number;
  approved_settlement_amount?: number;
  deductible_applied?: number;
  status: string;
  sla_deadline?: string;
  created_at: string;
  decided_at?: string;
  decided_by_name?: string;
}

interface CustomerClaimsResponse {
  customer_id: number;
  customer_name: string;
  claims: ClaimItem[];
  total_claimed: number;
  total_approved: number;
  open_claims_count: number;
}

interface NoteItem {
  id: number;
  customer_id: number;
  agent_id: number;
  agent_name: string;
  note: string;
  created_at: string;
}

interface CustomerNotesListResponse {
  customer_id: number;
  customer_name: string;
  notes: NoteItem[];
  total: number;
}

export default function AgentCustomerDetail({ tenantContext, currentUser }: AgentCustomerDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<CustomerDossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'policies' | 'claims' | 'notes'>('policies');

  // Policies Tab State (A5.2)
  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [policiesError, setPoliciesError] = useState<string | null>(null);

  // Claims Tab State (A5.3)
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [claimsError, setClaimsError] = useState<string | null>(null);

  // Notes Tab State (A5.4)
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  // Note creation form state
  const [newNoteText, setNewNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [createNoteError, setCreateNoteError] = useState<string | null>(null);
  const [createNoteSuccess, setCreateNoteSuccess] = useState(false);

  const fetchCustomer = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/agents/me/customers/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(`Customer #${id} was not found in your assigned portfolio.`);
        } else if (res.status === 403) {
          throw new Error('Access denied: You are not authorized to view this customer record.');
        }
        throw new Error(`Failed to load customer profile (HTTP ${res.status})`);
      }

      const data: CustomerDossier = await res.json();
      setCustomer(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while loading the customer dossier.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchPolicies = useCallback(async () => {
    if (!id) return;
    setPoliciesLoading(true);
    setPoliciesError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/agents/me/customers/${id}/policies`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error(`Failed to load customer policies (HTTP ${res.status})`);
      }

      const data: CustomerPoliciesResponse = await res.json();
      setPolicies(data.policies || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setPoliciesError(err.message);
      } else {
        setPoliciesError('Failed to load customer policies.');
      }
    } finally {
      setPoliciesLoading(false);
    }
  }, [id]);

  const fetchClaims = useCallback(async () => {
    if (!id) return;
    setClaimsLoading(true);
    setClaimsError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/agents/me/customers/${id}/claims`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error(`Failed to load customer claims (HTTP ${res.status})`);
      }

      const data: CustomerClaimsResponse = await res.json();
      setClaims(data.claims || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setClaimsError(err.message);
      } else {
        setClaimsError('Failed to load customer claims.');
      }
    } finally {
      setClaimsLoading(false);
    }
  }, [id]);

  const fetchNotes = useCallback(async () => {
    if (!id) return;
    setNotesLoading(true);
    setNotesError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/agents/me/customers/${id}/notes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error(`Failed to load customer notes (HTTP ${res.status})`);
      }

      const data: CustomerNotesListResponse = await res.json();
      setNotes(data.notes || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setNotesError(err.message);
      } else {
        setNotesError('Failed to load customer notes.');
      }
    } finally {
      setNotesLoading(false);
    }
  }, [id]);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newNoteText.trim();
    if (trimmed.length < 5) {
      setCreateNoteError('Note must be at least 5 characters.');
      return;
    }
    if (trimmed.length > 2000) {
      setCreateNoteError('Note cannot exceed 2000 characters.');
      return;
    }

    setSubmittingNote(true);
    setCreateNoteError(null);
    setCreateNoteSuccess(false);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/agents/me/customers/${id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ note: trimmed })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || `Failed to add note (HTTP ${res.status})`);
      }

      const created: NoteItem = await res.json();
      setNotes(prev => [created, ...prev]);
      setNewNoteText('');
      setCreateNoteSuccess(true);
      setTimeout(() => setCreateNoteSuccess(false), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setCreateNoteError(err.message);
      } else {
        setCreateNoteError('Failed to record note.');
      }
    } finally {
      setSubmittingNote(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  useEffect(() => {
    if (activeTab === 'policies') {
      fetchPolicies();
    } else if (activeTab === 'claims') {
      fetchClaims();
    } else if (activeTab === 'notes') {
      fetchNotes();
    }
  }, [activeTab, fetchPolicies, fetchClaims, fetchNotes]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0b1329', color: '#f8fafc', padding: '40px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center', paddingTop: 80 }}>
          <RefreshCw size={32} className="spin" style={{ color: '#38bdf8', margin: '0 auto 16px' }} />
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Loading customer dossier #{id}...</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div style={{ minHeight: '100vh', background: '#0b1329', color: '#f8fafc', padding: '40px' }}>
        <div style={{ maxWidth: 640, margin: '60px auto 0', textAlign: 'center' }}>
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 16,
              padding: '48px 32px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
          >
            <AlertCircle size={40} style={{ color: '#f87171', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 10px', color: '#f1f5f9' }}>
              Customer Not Available
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 24px' }}>
              {error || `Unable to load customer #${id}. It may belong to another agent or organization.`}
            </p>
            <button
              onClick={() => navigate('/agent/customers')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 8,
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Customer Portfolio</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isHighRisk = customer.churn_risk_flag || customer.risk_flag === 'high';

  const getProductIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'auto':
        return <Car size={16} style={{ color: '#38bdf8' }} />;
      case 'property':
        return <Home size={16} style={{ color: '#fb923c' }} />;
      case 'health':
        return <HeartPulse size={16} style={{ color: '#ec4899' }} />;
      case 'life':
        return <Activity size={16} style={{ color: '#a855f7' }} />;
      default:
        return <Shield size={16} style={{ color: '#38bdf8' }} />;
    }
  };

  const getClaimStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
      case 'rejected':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
      case 'in_investigation':
        return { bg: 'rgba(2, 132, 199, 0.15)', text: '#38bdf8', border: 'rgba(2, 132, 199, 0.3)' };
      default:
        return { bg: 'rgba(251, 146, 60, 0.15)', text: '#fb923c', border: 'rgba(251, 146, 60, 0.3)' };
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0b1329', color: '#f8fafc', padding: '32px 40px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Back Navigation & Breadcrumb */}
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => navigate('/agent/customers')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '0.85rem',
              cursor: 'pointer',
              padding: 0
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
          >
            <ArrowLeft size={14} />
            <span>Back to Customers</span>
          </button>
        </div>

        {/* Header Hero Dossier Card */}
        <div
          style={{
            background: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: 16,
            padding: '28px 32px',
            marginBottom: 24,
            boxShadow: '0 4px 24px rgba(0,0,0,0.25)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              {/* Avatar Initials */}
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 16,
                  background: isHighRisk ? 'rgba(239, 68, 68, 0.15)' : 'rgba(2, 132, 199, 0.15)',
                  color: isHighRisk ? '#f87171' : '#38bdf8',
                  border: `1px solid ${isHighRisk ? 'rgba(239, 68, 68, 0.3)' : 'rgba(2, 132, 199, 0.3)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.4rem'
                }}
              >
                {customer.first_name?.[0] || ''}{customer.last_name?.[0] || 'C'}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                    {customer.full_name}
                  </h1>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '3px 9px',
                      borderRadius: 6,
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#34d399',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      textTransform: 'capitalize'
                    }}
                  >
                    {customer.status || 'Active'}
                  </span>

                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: isHighRisk ? '#ef4444' : '#10b981',
                        display: 'inline-block',
                        boxShadow: isHighRisk ? '0 0 6px rgba(239, 68, 68, 0.6)' : '0 0 6px rgba(16, 185, 129, 0.5)'
                      }}
                    />
                    <span style={{ fontSize: '0.8rem', color: isHighRisk ? '#fca5a5' : '#a7f3d0', fontWeight: 500 }}>
                      {isHighRisk ? 'At Risk of Lapse' : 'Normal Risk'}
                    </span>
                  </div>
                </div>

                <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                  Customer ID #{customer.id} · Assigned to {currentUser.name || currentUser.email} · {tenantContext.name}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {customer.phone && (
                <a
                  href={`tel:${customer.phone}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '9px 14px',
                    borderRadius: 8,
                    background: '#1e293b',
                    color: '#cbd5e1',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    textDecoration: 'none',
                    border: '1px solid #334155'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#1e293b')}
                >
                  <Phone size={14} />
                  <span>Call</span>
                </a>
              )}

              <a
                href={`mailto:${customer.email}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 14px',
                  borderRadius: 8,
                  background: '#1e293b',
                  color: '#cbd5e1',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  border: '1px solid #334155'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#1e293b')}
              >
                <Mail size={14} />
                <span>Email</span>
              </a>

              <button
                onClick={() => navigate(`/agent/applications/new?customer_id=${customer.id}`)}
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
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
                }}
              >
                <Plus size={16} />
                <span>Start New Application</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bento Grid: Customer Details & Key Portfolio Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 28 }}>
          
          {/* Card 1: Contact Information */}
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: 12,
              padding: '20px 24px'
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>
              Contact Information
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#f1f5f9', fontSize: '0.9rem' }}>
                <Mail size={15} style={{ color: '#38bdf8' }} />
                <span>{customer.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#f1f5f9', fontSize: '0.9rem' }}>
                <Phone size={15} style={{ color: '#38bdf8' }} />
                <span>{customer.phone || 'No phone recorded'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#cbd5e1', fontSize: '0.85rem' }}>
                <Calendar size={15} style={{ color: '#64748b' }} />
                <span>DOB: {customer.date_of_birth || customer.dob || 'Not provided'}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Address & Location */}
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: 12,
              padding: '20px 24px'
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>
              Residence & Assignment
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, color: '#f1f5f9', fontSize: '0.9rem' }}>
                <MapPin size={15} style={{ color: '#38bdf8', marginTop: 2 }} />
                <span>{customer.address || 'Address not recorded'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#cbd5e1', fontSize: '0.85rem' }}>
                <ShieldCheck size={15} style={{ color: '#10b981' }} />
                <span>Customer Since: {customer.created_at ? new Date(customer.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Portfolio Metrics */}
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: 12,
              padding: '20px 24px'
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>
              Book Value & Renewals
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Active Policies</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8' }}>{customer.policy_count}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Annual Premium</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
                ${customer.total_premium.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Next Renewal</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: customer.next_renewal_date ? '#f1f5f9' : '#64748b' }}>
                {customer.next_renewal_date || 'None scheduled'}
              </span>
            </div>
          </div>

        </div>

        {/* Section Tabs: Policies, Claims, Outreach & Notes */}
        <div style={{ borderBottom: '1px solid #1e293b', marginBottom: 24, display: 'flex', gap: 24 }}>
          <button
            onClick={() => setActiveTab('policies')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 4px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'policies' ? '2px solid #0284c7' : '2px solid transparent',
              color: activeTab === 'policies' ? '#38bdf8' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            <FileText size={16} />
            <span>Policies ({policies.length || customer.policy_count})</span>
          </button>

          <button
            onClick={() => setActiveTab('claims')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 4px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'claims' ? '2px solid #0284c7' : '2px solid transparent',
              color: activeTab === 'claims' ? '#38bdf8' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            <FileCheck2 size={16} />
            <span>Claims ({claims.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 4px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'notes' ? '2px solid #0284c7' : '2px solid transparent',
              color: activeTab === 'notes' ? '#38bdf8' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            <MessageSquare size={16} />
            <span>Outreach & Notes</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SUB-SLICE A5.2: POLICIES TAB VIEW                                         */}
        {/* ========================================================================= */}
        {activeTab === 'policies' && (
          <div>
            {policiesLoading ? (
              <div
                style={{
                  background: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: 12,
                  padding: '48px 24px',
                  textAlign: 'center'
                }}
              >
                <RefreshCw size={26} className="spin" style={{ color: '#38bdf8', margin: '0 auto 12px' }} />
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Loading policy records...</p>
              </div>
            ) : policiesError ? (
              <div
                style={{
                  background: '#0f172a',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 12,
                  padding: '32px 24px',
                  textAlign: 'center',
                  color: '#f87171'
                }}
              >
                <AlertCircle size={28} style={{ margin: '0 auto 10px' }} />
                <p style={{ margin: '0 0 12px', fontSize: '0.9rem' }}>{policiesError}</p>
                <button
                  onClick={() => fetchPolicies()}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    background: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Retry
                </button>
              </div>
            ) : policies.length === 0 ? (
              /* Authentic Empty State per §A5.2 */
              <div
                style={{
                  background: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: 12,
                  padding: '48px 24px',
                  textAlign: 'center',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: 'rgba(2, 132, 199, 0.1)',
                    border: '1px solid rgba(2, 132, 199, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}
                >
                  <FileText size={28} style={{ color: '#38bdf8' }} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', margin: '0 0 8px' }}>
                  No Policies Yet
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem', maxWidth: 440, margin: '0 auto 20px', lineHeight: 1.5 }}>
                  This customer does not currently hold any active policies. Submit an application on their behalf to begin underwriting coverage.
                </p>
                <button
                  onClick={() => navigate(`/agent/applications/new?customer_id=${customer.id}`)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '9px 18px',
                    borderRadius: 8,
                    background: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={16} />
                  <span>Start First Application</span>
                </button>
              </div>
            ) : (
              /* Policies Table */
              <div
                style={{
                  background: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: 12,
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}
              >
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ background: '#0b1329', borderBottom: '1px solid #1e293b', color: '#94a3b8' }}>
                        <th style={{ padding: '14px 20px', fontWeight: 600 }}>Policy Number</th>
                        <th style={{ padding: '14px 20px', fontWeight: 600 }}>Product Line</th>
                        <th style={{ padding: '14px 20px', fontWeight: 600 }}>Annual Premium</th>
                        <th style={{ padding: '14px 20px', fontWeight: 600 }}>Coverage & Deductible</th>
                        <th style={{ padding: '14px 20px', fontWeight: 600 }}>Renewal Window</th>
                        <th style={{ padding: '14px 20px', fontWeight: 600 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {policies.map((p) => {
                        const isExpiringSoon = p.days_until_renewal !== null && p.days_until_renewal !== undefined && p.days_until_renewal >= 0 && p.days_until_renewal <= 30;
                        return (
                          <tr
                            key={p.id}
                            style={{
                              borderBottom: '1px solid #1e293b',
                              transition: 'background 0.15s ease'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(30, 41, 59, 0.45)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            {/* Policy Number */}
                            <td style={{ padding: '16px 20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontWeight: 600, color: '#f8fafc', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                                  {p.policy_number}
                                </span>
                              </div>
                            </td>

                            {/* Product Line */}
                            <td style={{ padding: '16px 20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {getProductIcon(p.product_type)}
                                <span style={{ color: '#cbd5e1', textTransform: 'capitalize', fontWeight: 500 }}>
                                  {p.product_type.replace('_', ' ')}
                                </span>
                              </div>
                            </td>

                            {/* Premium */}
                            <td style={{ padding: '16px 20px', fontWeight: 600, color: '#f8fafc' }}>
                              ${p.premium_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 400, marginLeft: 3 }}>/yr</span>
                            </td>

                            {/* Coverage & Deductible */}
                            <td style={{ padding: '16px 20px' }}>
                              <div style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                                Limit: ${p.coverage_limit.toLocaleString()}
                              </div>
                              <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                                Ded: ${p.deductible.toLocaleString()}
                              </div>
                            </td>

                            {/* Renewal Window */}
                            <td style={{ padding: '16px 20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f1f5f9', fontSize: '0.85rem' }}>
                                <Clock size={13} style={{ color: isExpiringSoon ? '#fb923c' : '#64748b' }} />
                                <span>{p.renewal_date || 'No end date'}</span>
                              </div>
                              {isExpiringSoon && (
                                <span
                                  style={{
                                    display: 'inline-block',
                                    marginTop: 4,
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    background: 'rgba(251, 146, 60, 0.15)',
                                    color: '#fb923c',
                                    border: '1px solid rgba(251, 146, 60, 0.3)'
                                  }}
                                >
                                  Expires in {p.days_until_renewal} days
                                </span>
                              )}
                            </td>

                            {/* Status */}
                            <td style={{ padding: '16px 20px' }}>
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  padding: '3px 8px',
                                  borderRadius: 6,
                                  background: p.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                                  color: p.status === 'active' ? '#34d399' : '#94a3b8',
                                  border: `1px solid ${p.status === 'active' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(100, 116, 139, 0.3)'}`,
                                  textTransform: 'capitalize'
                                }}
                              >
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUB-SLICE A5.3: CLAIMS TAB VIEW                                           */}
        {/* ========================================================================= */}
        {activeTab === 'claims' && (
          <div>
            {claimsLoading ? (
              <div
                style={{
                  background: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: 12,
                  padding: '48px 24px',
                  textAlign: 'center'
                }}
              >
                <RefreshCw size={26} className="spin" style={{ color: '#38bdf8', margin: '0 auto 12px' }} />
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Loading customer claims history...</p>
              </div>
            ) : claimsError ? (
              <div
                style={{
                  background: '#0f172a',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 12,
                  padding: '32px 24px',
                  textAlign: 'center',
                  color: '#f87171'
                }}
              >
                <AlertCircle size={28} style={{ margin: '0 auto 10px' }} />
                <p style={{ margin: '0 0 12px', fontSize: '0.9rem' }}>{claimsError}</p>
                <button
                  onClick={() => fetchClaims()}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    background: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Retry
                </button>
              </div>
            ) : claims.length === 0 ? (
              /* Authentic Empty State per §A5.3 */
              <div
                style={{
                  background: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: 12,
                  padding: '48px 24px',
                  textAlign: 'center',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: 'rgba(2, 132, 199, 0.1)',
                    border: '1px solid rgba(2, 132, 199, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}
                >
                  <FileCheck2 size={28} style={{ color: '#38bdf8' }} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f1f5f9', margin: '0 0 8px' }}>
                  No Claims on File
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem', maxWidth: 440, margin: '0 auto', lineHeight: 1.5 }}>
                  This customer currently has no claims history. Any insurance claims filed under their policies will appear here for tracking and service coordination.
                </p>
              </div>
            ) : (
              /* Claims Table */
              <div
                style={{
                  background: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: 12,
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}
              >
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ background: '#0b1329', borderBottom: '1px solid #1e293b', color: '#94a3b8' }}>
                        <th style={{ padding: '14px 20px', fontWeight: 600 }}>Claim Number</th>
                        <th style={{ padding: '14px 20px', fontWeight: 600 }}>Policy</th>
                        <th style={{ padding: '14px 20px', fontWeight: 600 }}>Incident Details</th>
                        <th style={{ padding: '14px 20px', fontWeight: 600 }}>Claimed Amount</th>
                        <th style={{ padding: '14px 20px', fontWeight: 600 }}>Approved Settlement</th>
                        <th style={{ padding: '14px 20px', fontWeight: 600 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {claims.map((c) => {
                        const statusColors = getClaimStatusColor(c.status);
                        return (
                          <tr
                            key={c.id}
                            style={{
                              borderBottom: '1px solid #1e293b',
                              transition: 'background 0.15s ease'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(30, 41, 59, 0.45)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            {/* Claim Number */}
                            <td style={{ padding: '16px 20px' }}>
                              <span style={{ fontWeight: 600, color: '#f8fafc', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                {c.claim_number}
                              </span>
                            </td>

                            {/* Policy */}
                            <td style={{ padding: '16px 20px', color: '#cbd5e1', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                              {c.policy_number}
                            </td>

                            {/* Incident Details */}
                            <td style={{ padding: '16px 20px' }}>
                              <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.85rem', textTransform: 'capitalize' }}>
                                {c.incident_type.replace('_', ' ')}
                              </div>
                              <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: 2, maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {c.incident_description}
                              </div>
                              <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 2 }}>
                                Date: {new Date(c.incident_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </div>
                            </td>

                            {/* Claimed Amount */}
                            <td style={{ padding: '16px 20px', fontWeight: 600, color: '#f8fafc' }}>
                              ${c.claimed_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>

                            {/* Approved Settlement */}
                            <td style={{ padding: '16px 20px', fontWeight: 600, color: c.approved_settlement_amount ? '#34d399' : '#94a3b8' }}>
                              {c.approved_settlement_amount 
                                ? `$${c.approved_settlement_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : '—'}
                            </td>

                            {/* Status */}
                            <td style={{ padding: '16px 20px' }}>
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  padding: '3px 8px',
                                  borderRadius: 6,
                                  background: statusColors.bg,
                                  color: statusColors.text,
                                  border: `1px solid ${statusColors.border}`,
                                  textTransform: 'capitalize'
                                }}
                              >
                                {c.status.replace('_', ' ')}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notes & Outreach Tab (A5.4) */}
        {activeTab === 'notes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Note Entry Card */}
            <div
              style={{
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: 12,
                padding: '24px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <MessageSquare size={18} style={{ color: '#38bdf8' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f1f5f9', margin: 0 }}>
                  Log Customer Interaction or Outreach Note
                </h3>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0 0 16px' }}>
                Document client phone calls, coverage discussions, renewal negotiations, or policyholder inquiries.
                Notes are immutably attributed to your agent profile and logged in the tenant audit trail.
              </p>

              <form onSubmit={handleCreateNote}>
                <div style={{ position: 'relative', marginBottom: 12 }}>
                  <textarea
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Enter customer interaction details, discussion points, agreed follow-ups, or notes from call/meeting..."
                    rows={4}
                    maxLength={2000}
                    style={{
                      width: '100%',
                      background: '#090e1a',
                      border: '1px solid #1e293b',
                      borderRadius: 8,
                      padding: '14px 16px',
                      color: '#f8fafc',
                      fontSize: '0.9rem',
                      lineHeight: 1.5,
                      resize: 'vertical',
                      outline: 'none',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#0284c7')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#1e293b')}
                  />
                </div>

                {createNoteError && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 14px',
                      borderRadius: 6,
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: '#f87171',
                      fontSize: '0.82rem',
                      marginBottom: 12
                    }}
                  >
                    <AlertCircle size={15} />
                    <span>{createNoteError}</span>
                  </div>
                )}

                {createNoteSuccess && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 14px',
                      borderRadius: 6,
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      color: '#34d399',
                      fontSize: '0.82rem',
                      marginBottom: 12
                    }}
                  >
                    <CheckCircle2 size={15} />
                    <span>Note recorded successfully and synced to customer dossier!</span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ fontSize: '0.78rem', color: newNoteText.trim().length < 5 ? '#94a3b8' : '#38bdf8' }}>
                    {newNoteText.trim().length} / 2000 characters {newNoteText.trim().length < 5 && '(min 5)'}
                  </div>

                  <button
                    type="submit"
                    disabled={submittingNote || newNoteText.trim().length < 5}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 18px',
                      background: newNoteText.trim().length >= 5 && !submittingNote ? '#0284c7' : '#1e293b',
                      color: newNoteText.trim().length >= 5 && !submittingNote ? '#ffffff' : '#64748b',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: newNoteText.trim().length >= 5 && !submittingNote ? 'pointer' : 'not-allowed',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {submittingNote ? (
                      <>
                        <RefreshCw size={14} className="spin" />
                        Saving Note...
                      </>
                    ) : (
                      <>
                        <Plus size={15} />
                        Save Interaction Note
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Notes Feed Header & List */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f1f5f9', margin: 0 }}>
                  Interaction History & Audit Log ({notes.length})
                </h4>
                <button
                  onClick={fetchNotes}
                  disabled={notesLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 6,
                    color: '#94a3b8',
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={12} className={notesLoading ? 'spin' : ''} />
                  Refresh
                </button>
              </div>

              {notesLoading && notes.length === 0 ? (
                <div
                  style={{
                    background: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: 12,
                    padding: '40px',
                    textAlign: 'center'
                  }}
                >
                  <RefreshCw size={24} className="spin" style={{ color: '#38bdf8', margin: '0 auto 12px' }} />
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>Loading interaction notes...</p>
                </div>
              ) : notesError ? (
                <div
                  style={{
                    background: '#0f172a',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 12,
                    padding: '24px',
                    textAlign: 'center'
                  }}
                >
                  <AlertCircle size={28} style={{ color: '#f87171', margin: '0 auto 10px' }} />
                  <p style={{ color: '#f87171', fontSize: '0.88rem', margin: '0 0 12px' }}>{notesError}</p>
                  <button
                    onClick={fetchNotes}
                    style={{
                      padding: '6px 14px',
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: 6,
                      color: '#f8fafc',
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    Retry Loading
                  </button>
                </div>
              ) : notes.length === 0 ? (
                <div
                  style={{
                    background: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: 12,
                    padding: '48px 24px',
                    textAlign: 'center'
                  }}
                >
                  <MessageSquare size={36} style={{ color: '#64748b', margin: '0 auto 14px' }} />
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#f1f5f9', margin: '0 0 6px' }}>
                    No Outreach Notes Recorded
                  </h4>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', maxWidth: 440, margin: '0 auto' }}>
                    No notes or outreach logs have been recorded for this customer yet. Use the form above to log your first phone call, meeting notes, or renewal communication.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {notes.map((n) => {
                    const noteDate = new Date(n.created_at);
                    const formattedDate = noteDate.toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    });
                    const formattedTime = noteDate.toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div
                        key={n.id}
                        style={{
                          background: '#0f172a',
                          border: '1px solid #1e293b',
                          borderRadius: 12,
                          padding: '18px 20px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 12,
                            paddingBottom: 10,
                            borderBottom: '1px solid #1e293b',
                            flexWrap: 'wrap',
                            gap: 8
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                background: '#1e293b',
                                border: '1px solid #334155',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#38bdf8'
                              }}
                            >
                              <User size={14} />
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f8fafc' }}>
                                  {n.agent_name}
                                </span>
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    padding: '1px 6px',
                                    borderRadius: 4,
                                    background: 'rgba(56, 189, 248, 0.12)',
                                    color: '#38bdf8',
                                    border: '1px solid rgba(56, 189, 248, 0.25)'
                                  }}
                                >
                                  Agent #{n.agent_id}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: '0.78rem' }}>
                            <Clock size={13} style={{ color: '#64748b' }} />
                            <span>{formattedDate} at {formattedTime}</span>
                          </div>
                        </div>

                        <div
                          style={{
                            color: '#cbd5e1',
                            fontSize: '0.88rem',
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                          }}
                        >
                          {n.note}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
