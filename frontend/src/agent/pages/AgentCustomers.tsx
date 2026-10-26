import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Filter, 
  ChevronRight, 
  AlertCircle, 
  ShieldCheck, 
  Phone, 
  Mail, 
  RefreshCw,
  Plus,
  X,
  CheckCircle2,
  Calendar,
  MapPin,
  UserPlus
} from 'lucide-react';

interface AgentCustomersProps {
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

interface CustomerRecord {
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

interface CustomerListApiResponse {
  items: CustomerRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export default function AgentCustomers({ tenantContext, currentUser }: AgentCustomersProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(15);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');

  // Registration Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDob, setRegDob] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regRiskFlag, setRegRiskFlag] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // If URL is /agent/customers/new, open modal automatically
  useEffect(() => {
    if (location.pathname === '/agent/customers/new') {
      setIsRegisterModalOpen(true);
    }
  }, [location.pathname]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });

      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      if (riskFilter !== 'all') {
        params.append('risk_flag', riskFilter);
      }
      if (productFilter !== 'all') {
        params.append('product_type', productFilter);
      }

      const res = await fetch(`/api/agents/me/customers?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Access denied: only licensed agents can view this customer portfolio.');
        }
        throw new Error(`Failed to load customer portfolio (HTTP ${res.status})`);
      }

      const data: CustomerListApiResponse = await res.json();
      setCustomers(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while fetching customers.');
      }
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchTerm, riskFilter, productFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleRiskChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRiskFilter(e.target.value);
    setPage(1);
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProductFilter(e.target.value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setRiskFilter('all');
    setProductFilter('all');
    setPage(1);
  };

  const handleOpenRegisterModal = () => {
    setRegError(null);
    setRegSuccess(null);
    setIsRegisterModalOpen(true);
  };

  const handleCloseRegisterModal = () => {
    setIsRegisterModalOpen(false);
    setRegError(null);
    setRegSuccess(null);
    if (location.pathname === '/agent/customers/new') {
      navigate('/agent/customers', { replace: true });
    }
  };

  const handleRegisterCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    if (regFirstName.trim().length < 2 || regLastName.trim().length < 2) {
      setRegError('First name and last name must each be at least 2 characters long.');
      return;
    }

    if (!regEmail.trim() || !regEmail.includes('@')) {
      setRegError('Please provide a valid customer email address.');
      return;
    }

    setRegLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        first_name: regFirstName.trim(),
        last_name: regLastName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim() || null,
        date_of_birth: regDob.trim() || null,
        address: regAddress.trim() || null,
        churn_risk_flag: regRiskFlag
      };

      const res = await fetch('/api/agents/me/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        if (res.status === 409) {
          throw new Error(errorData?.detail || 'A customer with this email already exists in your tenant.');
        } else if (res.status === 422) {
          throw new Error(errorData?.detail || 'Invalid customer information entered.');
        }
        throw new Error(errorData?.detail || `Failed to register customer (HTTP ${res.status})`);
      }

      const newCustomer: CustomerRecord = await res.json();
      setRegSuccess(`Successfully registered ${newCustomer.full_name}!`);

      // Prepend to current list and update total
      setCustomers((prev) => [newCustomer, ...prev]);
      setTotal((prev) => prev + 1);

      // Clear form fields
      setRegFirstName('');
      setRegLastName('');
      setRegEmail('');
      setRegPhone('');
      setRegDob('');
      setRegAddress('');
      setRegRiskFlag(false);

      // Close modal after brief feedback
      setTimeout(() => {
        handleCloseRegisterModal();
      }, 900);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setRegError(err.message);
      } else {
        setRegError('Failed to register customer. Please try again.');
      }
    } finally {
      setRegLoading(false);
    }
  };

  const hasActiveFilters = searchTerm.trim() !== '' || riskFilter !== 'all' || productFilter !== 'all';

  return (
    <div style={{ minHeight: '100vh', background: '#0b1329', color: '#f8fafc', padding: '32px 40px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 700, margin: 0, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                Customer Portfolio
              </h1>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: 'rgba(2, 132, 199, 0.15)',
                  color: '#38bdf8',
                  border: '1px solid rgba(2, 132, 199, 0.3)'
                }}
              >
                {total} Assigned
              </span>
            </div>
            <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
              Search, filter, and inspect your policyholders and active renewals for {tenantContext.name}.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => fetchCustomers()}
              title="Refresh list"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 14px',
                borderRadius: 8,
                background: '#0f172a',
                border: '1px solid #1e293b',
                color: '#cbd5e1',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              id="register-customer-btn"
              onClick={handleOpenRegisterModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                borderRadius: 8,
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
              }}
            >
              <Plus size={16} />
              <span>Register Customer</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div
          style={{
            background: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap'
          }}
        >
          {/* Search box */}
          <div style={{ position: 'relative', flex: '1 1 320px', minWidth: 260 }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b'
              }}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by name, email, or phone..."
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: 8,
                background: '#0b1329',
                border: '1px solid #1e293b',
                color: '#f8fafc',
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Filter Dropdowns */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter size={14} style={{ color: '#64748b' }} />
              <select
                value={riskFilter}
                onChange={handleRiskChange}
                style={{
                  padding: '9px 12px',
                  borderRadius: 8,
                  background: '#0b1329',
                  border: '1px solid #1e293b',
                  color: '#cbd5e1',
                  fontSize: '0.85rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Risk Statuses</option>
                <option value="low">Normal Risk (Low)</option>
                <option value="high">At-Risk of Lapse (High)</option>
              </select>
            </div>

            <select
              value={productFilter}
              onChange={handleProductChange}
              style={{
                padding: '9px 12px',
                borderRadius: 8,
                background: '#0b1329',
                border: '1px solid #1e293b',
                color: '#cbd5e1',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Policy Lines</option>
              <option value="auto">Auto</option>
              <option value="property">Property</option>
              <option value="health">Health</option>
              <option value="life">Life</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'transparent',
                  border: '1px solid #334155',
                  color: '#94a3b8',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        {error ? (
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 12,
              padding: '32px',
              textAlign: 'center',
              color: '#f87171'
            }}
          >
            <AlertCircle size={32} style={{ margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>Failed to Load Customers</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: 460, margin: '0 auto 16px' }}>{error}</p>
            <button
              onClick={() => fetchCustomers()}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                background: '#0284c7',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Try Again
            </button>
          </div>
        ) : loading && customers.length === 0 ? (
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: 12,
              padding: '64px 32px',
              textAlign: 'center',
              color: '#94a3b8'
            }}
          >
            <RefreshCw size={28} className="spin" style={{ margin: '0 auto 12px', color: '#38bdf8' }} />
            <p style={{ fontSize: '0.95rem', margin: 0 }}>Loading your customer portfolio...</p>
          </div>
        ) : customers.length === 0 ? (
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: 12,
              padding: '60px 32px',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}
          >
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: 18,
                background: 'rgba(2, 132, 199, 0.1)',
                border: '1px solid rgba(2, 132, 199, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px'
              }}
            >
              <Users size={34} style={{ color: '#38bdf8' }} />
            </div>

            {hasActiveFilters ? (
              <>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#f1f5f9', margin: '0 0 8px 0' }}>
                  No Matching Customers Found
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: 440, margin: '0 auto 20px', lineHeight: 1.5 }}>
                  No customer in your book matches the selected filters. Try broadening your search or resetting the filter options.
                </p>
                <button
                  onClick={handleClearFilters}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 8,
                    background: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Clear All Filters
                </button>
              </>
            ) : (
              <>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f1f5f9', margin: '0 0 8px 0' }}>
                  No Customers in Your Portfolio Yet
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: 500, margin: '0 auto 24px', lineHeight: 1.6 }}>
                  You will see your assigned customers here once your tenant administrator assigns accounts to you, or when you register new customer leads.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 14 }}>
                  <button
                    onClick={handleOpenRegisterModal}
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
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={16} />
                    <span>Register Your First Customer</span>
                  </button>
                </div>
                <div style={{ marginTop: 24, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#64748b' }}>
                  <ShieldCheck size={16} style={{ color: '#10b981' }} />
                  <span>Agent Scope: {currentUser.email} (ID #{currentUser.id})</span>
                </div>
              </>
            )}
          </div>
        ) : (
          /* Customers Table */
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
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Customer Name</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Contact Info</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Policies</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Total Premium</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Next Renewal</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600 }}>Lapse Risk</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600, textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => {
                    const isHighRisk = c.churn_risk_flag || c.risk_flag === 'high';
                    return (
                      <tr
                        key={c.id}
                        onClick={() => navigate(`/agent/customers/${c.id}`)}
                        style={{
                          borderBottom: '1px solid #1e293b',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(30, 41, 59, 0.45)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* Name & Avatar */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                background: isHighRisk ? 'rgba(239, 68, 68, 0.15)' : 'rgba(2, 132, 199, 0.15)',
                                color: isHighRisk ? '#f87171' : '#38bdf8',
                                border: `1px solid ${isHighRisk ? 'rgba(239, 68, 68, 0.3)' : 'rgba(2, 132, 199, 0.3)'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.85rem'
                              }}
                            >
                              {c.first_name?.[0] || ''}{c.last_name?.[0] || 'C'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem' }}>
                                {c.full_name}
                              </div>
                              <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'capitalize' }}>
                                {c.status || 'Active'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#cbd5e1', fontSize: '0.825rem' }}>
                              <Mail size={13} style={{ color: '#64748b' }} />
                              <span>{c.email}</span>
                            </div>
                            {c.phone && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: '0.8rem' }}>
                                <Phone size={13} style={{ color: '#64748b' }} />
                                <span>{c.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Policy Count */}
                        <td style={{ padding: '16px 20px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '3px 9px',
                              borderRadius: 6,
                              background: c.policy_count > 0 ? 'rgba(2, 132, 199, 0.12)' : 'rgba(100, 116, 139, 0.15)',
                              color: c.policy_count > 0 ? '#38bdf8' : '#94a3b8',
                              fontWeight: 600,
                              fontSize: '0.8rem'
                            }}
                          >
                            {c.policy_count} {c.policy_count === 1 ? 'Policy' : 'Policies'}
                          </span>
                        </td>

                        {/* Total Premium */}
                        <td style={{ padding: '16px 20px', fontWeight: 600, color: '#f1f5f9' }}>
                          ${c.total_premium.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 400, marginLeft: 3 }}>/yr</span>
                        </td>

                        {/* Next Renewal */}
                        <td style={{ padding: '16px 20px', color: c.next_renewal_date ? '#cbd5e1' : '#64748b' }}>
                          {c.next_renewal_date || '—'}
                        </td>

                        {/* Risk Dot */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                              {isHighRisk ? 'At Risk' : 'Normal'}
                            </span>
                          </div>
                        </td>

                        {/* Action */}
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/agent/customers/${c.id}`);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '6px 12px',
                              borderRadius: 6,
                              background: '#1e293b',
                              border: '1px solid #334155',
                              color: '#cbd5e1',
                              fontSize: '0.8rem',
                              fontWeight: 500,
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#0284c7';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#1e293b';
                              e.currentTarget.style.color = '#cbd5e1';
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

            {/* Pagination Controls */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderTop: '1px solid #1e293b',
                background: '#0b1329',
                color: '#94a3b8',
                fontSize: '0.825rem',
                flexWrap: 'wrap',
                gap: 12
              }}
            >
              <div>
                Showing <strong>{Math.min(total, (page - 1) * pageSize + 1)}</strong> to{' '}
                <strong>{Math.min(total, page * pageSize)}</strong> of <strong>{total}</strong> customers
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    background: page <= 1 ? '#0f172a' : '#1e293b',
                    color: page <= 1 ? '#475569' : '#cbd5e1',
                    border: '1px solid #334155',
                    cursor: page <= 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  Previous
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    background: page >= totalPages ? '#0f172a' : '#1e293b',
                    color: page >= totalPages ? '#475569' : '#cbd5e1',
                    border: '1px solid #334155',
                    cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CUSTOMER REGISTRATION MODAL / SLIDE-IN (Sub-Slice A4.2)                     */}
        {/* ========================================================================= */}
        {isRegisterModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(2, 6, 23, 0.75)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20
            }}
            onClick={handleCloseRegisterModal}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 580,
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: 16,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                overflow: 'hidden'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid #1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#0b1329'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'rgba(2, 132, 199, 0.15)',
                      color: '#38bdf8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <UserPlus size={18} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                      Register New Customer
                    </h2>
                    <p style={{ margin: '2px 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>
                      Assisted customer intake · Scoped to {tenantContext.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseRegisterModal}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: 6,
                    borderRadius: 6
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={handleRegisterCustomer} style={{ padding: '24px' }}>
                {regError && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      borderRadius: 8,
                      padding: '12px 16px',
                      marginBottom: 18,
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <AlertCircle size={16} />
                    <span>{regError}</span>
                  </div>
                )}

                {regSuccess && (
                  <div
                    style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#34d399',
                      borderRadius: 8,
                      padding: '12px 16px',
                      marginBottom: 18,
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>{regSuccess}</span>
                  </div>
                )}

                {/* Name Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                      First Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Alexander"
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: '#0b1329',
                        border: '1px solid #334155',
                        borderRadius: 8,
                        color: '#f8fafc',
                        fontSize: '0.875rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                      Last Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Pierce"
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: '#0b1329',
                        border: '1px solid #334155',
                        borderRadius: 8,
                        color: '#f8fafc',
                        fontSize: '0.875rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Email & Phone Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                      Email Address <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                      <input
                        type="email"
                        required
                        placeholder="customer@example.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 36px',
                          background: '#0b1329',
                          border: '1px solid #334155',
                          borderRadius: 8,
                          color: '#f8fafc',
                          fontSize: '0.875rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                      Phone Number
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                      <input
                        type="tel"
                        placeholder="(555) 000-0000"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 36px',
                          background: '#0b1329',
                          border: '1px solid #334155',
                          borderRadius: 8,
                          color: '#f8fafc',
                          fontSize: '0.875rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Date of Birth & Initial Churn Risk Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                      Date of Birth
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Calendar size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                      <input
                        type="date"
                        value={regDob}
                        onChange={(e) => setRegDob(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px 10px 36px',
                          background: '#0b1329',
                          border: '1px solid #334155',
                          borderRadius: 8,
                          color: '#f8fafc',
                          fontSize: '0.875rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                      Initial Risk Profile
                    </label>
                    <select
                      value={regRiskFlag ? 'high' : 'low'}
                      onChange={(e) => setRegRiskFlag(e.target.value === 'high')}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: '#0b1329',
                        border: '1px solid #334155',
                        borderRadius: 8,
                        color: '#f8fafc',
                        fontSize: '0.875rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="low">Normal Risk (Low)</option>
                      <option value="high">At-Risk of Lapse (High)</option>
                    </select>
                  </div>
                </div>

                {/* Street Address */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                    Street Address & Location
                  </label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={15} style={{ position: 'absolute', left: 12, top: 12, color: '#64748b' }} />
                    <textarea
                      rows={2}
                      placeholder="e.g., 450 Brickell Ave, Miami, FL 33131"
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 36px',
                        background: '#0b1329',
                        border: '1px solid #334155',
                        borderRadius: 8,
                        color: '#f8fafc',
                        fontSize: '0.875rem',
                        outline: 'none',
                        resize: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
                  <button
                    type="button"
                    onClick={handleCloseRegisterModal}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 8,
                      background: 'transparent',
                      border: '1px solid #334155',
                      color: '#cbd5e1',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={regLoading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 22px',
                      borderRadius: 8,
                      background: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      cursor: regLoading ? 'not-allowed' : 'pointer',
                      opacity: regLoading ? 0.75 : 1
                    }}
                  >
                    {regLoading ? (
                      <>
                        <RefreshCw size={14} className="spin" />
                        <span>Registering...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} />
                        <span>Confirm & Register</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
