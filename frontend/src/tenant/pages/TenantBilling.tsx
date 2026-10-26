import React, { useEffect, useState } from 'react';
import api from '../../api';
import {
  CreditCard,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  Edit,
  ArrowUpRight,
  Clock,
  X
} from 'lucide-react';

interface Subscription {
  id: number;
  tenant_id: number;
  plan_tier: string;
  billing_cycle: string;
  base_fee: number;
  policy_quota: number;
  claim_quota: number;
  cycle_reset_date?: string;
  payment_method_type: string;
  card_brand: string;
  card_last4: string;
  card_exp_month: number;
  card_exp_year: number;
  billing_email?: string;
}

interface UsageMetrics {
  policies_issued: number;
  policy_quota: number;
  policy_utilization: number;
  claims_processed: number;
  claim_quota: number;
  claim_utilization: number;
  is_near_limit: boolean;
}

interface Invoice {
  id: number;
  tenant_id: number;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  period_start: string;
  period_end: string;
  amount: number;
  status: 'paid' | 'due' | 'pending';
  paid_at?: string;
  payment_reference?: string;
}

interface TenantBillingProps {
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
    role: string;
    name?: string;
    tenant_id: number;
  };
}

export default function TenantBilling({ tenantContext, currentUser }: TenantBillingProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageMetrics | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [estNextBill, setEstNextBill] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    cardholder_name: currentUser.name || 'Tenant Finance Admin',
    card_number: '4242 4242 4242 4242',
    exp_month: 12,
    exp_year: 2028,
    cvc: '123',
    billing_email: currentUser.email
  });

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Enterprise AI');

  const [payingInvoiceId, setPayingInvoiceId] = useState<number | null>(null);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/billing/summary');
      setSubscription(res.data.subscription);
      setUsage(res.data.usage);
      setInvoices(res.data.invoices);
      setEstNextBill(res.data.estimated_next_bill);
      if (res.data.subscription?.plan_tier) {
        setSelectedPlan(res.data.subscription.plan_tier);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load billing summary');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingPayment(true);
    setError('');

    try {
      const res = await api.put('/api/billing/payment-method', {
        ...paymentForm,
        exp_month: Number(paymentForm.exp_month),
        exp_year: Number(paymentForm.exp_year)
      });
      setSubscription(res.data);
      setShowPaymentModal(false);
      setSuccessMessage('Payment method updated successfully.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update payment method');
    } finally {
      setUpdatingPayment(false);
    }
  };

  const handleUpdatePlan = async () => {
    setUpdatingPlan(true);
    setError('');

    try {
      const res = await api.put('/api/billing/plan', {
        plan_tier: selectedPlan
      });
      setSubscription(res.data);
      setShowPlanModal(false);
      setSuccessMessage(`Subscription plan upgraded to ${res.data.plan_tier}.`);
      setTimeout(() => setSuccessMessage(''), 4000);
      await fetchBillingData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to change plan tier');
    } finally {
      setUpdatingPlan(false);
    }
  };

  const handlePayInvoice = async (invoiceId: number) => {
    setPayingInvoiceId(invoiceId);
    setError('');

    try {
      const res = await api.post(`/api/billing/invoices/${invoiceId}/pay`);
      const updated = res.data;
      setInvoices(prev => prev.map(inv => (inv.id === invoiceId ? updated : inv)));
      setSuccessMessage(`Invoice ${updated.invoice_number} paid successfully.`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to process invoice payment');
    } finally {
      setPayingInvoiceId(null);
    }
  };

  const handleDownloadReceipt = (invoiceId: number, invoiceNumber: string) => {
    const url = `/api/billing/invoices/${invoiceId}/receipt`;

    // Fetch receipt blob with auth header
    api.get(url, { responseType: 'blob' })
      .then(res => {
        const blob = new Blob([res.data], { type: 'text/html' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `${invoiceNumber}_receipt.html`;
        link.click();
      })
      .catch(() => {
        setError('Failed to download invoice receipt');
      });
  };

  const formatCycleDate = (dateStr?: string) => {
    if (!dateStr) return 'Next cycle';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 6px 0' }}>
            Billing & Invoices
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
            Manage platform subscription, monitor usage quotas, and view billing history for {tenantContext.name}.
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid #10b981',
            color: '#10b981',
            padding: '12px 16px',
            borderRadius: 8,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.9rem'
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="error-alert" style={{ marginBottom: 20 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Clock className="animate-spin" size={32} style={{ margin: '0 auto 12px auto' }} />
          <div>Loading billing and usage metrics...</div>
        </div>
      ) : subscription && (
        <>
          {/* Bento Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 24,
              marginBottom: 32
            }}
          >
            {/* Bento Card 1: Current Plan & Live Usage Metering */}
            <div
              style={{
                gridColumn: 'span 2',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 28
              }}
            >
              {/* Card Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  borderBottom: '1px solid var(--border)',
                  paddingBottom: 20,
                  marginBottom: 24
                }}
              >
                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: 12,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      background: 'rgba(59, 130, 246, 0.15)',
                      color: '#3b82f6',
                      marginBottom: 8
                    }}
                  >
                    CURRENT PLAN
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>
                    {subscription.plan_tier}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    Usage cycle resets on <strong>{formatCycleDate(subscription.cycle_reset_date)}</strong>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Monthly Base Subscription
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                    ${estNextBill.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Usage Meters */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Meter 1: Policies Issued */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: '0.95rem' }}>
                      <FileText size={18} style={{ color: '#3b82f6' }} />
                      <span>Policies Issued & Active</span>
                    </div>
                    <div style={{ fontSize: '0.85rem' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {usage?.policies_issued.toLocaleString()}
                      </strong>{' '}
                      <span style={{ color: 'var(--text-secondary)' }}>
                        / {usage?.policy_quota.toLocaleString()} limit
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div
                    style={{
                      width: '100%',
                      height: 8,
                      background: 'var(--border)',
                      borderRadius: 4,
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${usage?.policy_utilization || 0}%`,
                        background: (usage?.policy_utilization || 0) >= 80 ? '#f59e0b' : '#3b82f6',
                        borderRadius: 4,
                        transition: 'width 0.8s ease'
                      }}
                    />
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    {usage?.policy_utilization}% utilized
                  </div>
                </div>

                {/* Meter 2: Claims Processed */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: '0.95rem' }}>
                      <CheckCircle2 size={18} style={{ color: '#10b981' }} />
                      <span>Claims Processed</span>
                    </div>
                    <div style={{ fontSize: '0.85rem' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {usage?.claims_processed.toLocaleString()}
                      </strong>{' '}
                      <span style={{ color: 'var(--text-secondary)' }}>
                        / {usage?.claim_quota.toLocaleString()} limit
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div
                    style={{
                      width: '100%',
                      height: 8,
                      background: 'var(--border)',
                      borderRadius: 4,
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${usage?.claim_utilization || 0}%`,
                        background: (usage?.claim_utilization || 0) >= 80 ? '#f59e0b' : '#10b981',
                        borderRadius: 4,
                        transition: 'width 0.8s ease'
                      }}
                    />
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    {usage?.claim_utilization}% utilized
                  </div>
                </div>

                {/* Quota warning banner if near limit */}
                {usage?.is_near_limit && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '12px 16px',
                      borderRadius: 8,
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      color: '#f59e0b',
                      fontSize: '0.85rem'
                    }}
                  >
                    <AlertTriangle size={18} />
                    <span>
                      Approaching quota threshold. Consider upgrading your plan tier to ensure uninterrupted straight-through processing.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bento Card 2: Saved Payment Method & Actions */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 24,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', fontWeight: 600 }}>
                Payment Method
              </h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Auto-pay instrument for monthly billing
              </p>

              {/* Card representation */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: 20,
                  marginBottom: 'auto'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <CreditCard size={28} style={{ color: '#3b82f6' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {subscription.card_brand}
                  </span>
                </div>
                <div style={{ fontSize: '1.1rem', letterSpacing: '0.15em', fontWeight: 600, marginBottom: 12 }}>
                  •••• •••• •••• {subscription.card_last4}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span>EXPIRES {subscription.card_exp_month.toString().padStart(2, '0')}/{subscription.card_exp_year}</span>
                  <span>{subscription.billing_email || 'Corporate Account'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(true)}
                  className="btn-secondary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '10px 16px'
                  }}
                >
                  <Edit size={16} /> Update Payment Method
                </button>
                <button
                  type="button"
                  onClick={() => setShowPlanModal(true)}
                  className="btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '10px 16px'
                  }}
                >
                  <ArrowUpRight size={16} /> Change Plan Tier
                </button>
              </div>
            </div>
          </div>

          {/* Invoice History Section */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 600 }}>
                Invoice History
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Download official PDF tax receipts and view settlement status.
              </p>
            </div>

            {invoices.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
                No invoices recorded yet. Next billing cycle will generate your first invoice.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderBottom: '1px solid var(--border)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      <th style={{ padding: '14px 20px' }}>Invoice ID</th>
                      <th style={{ padding: '14px 20px' }}>Date</th>
                      <th style={{ padding: '14px 20px' }}>Status</th>
                      <th style={{ padding: '14px 20px', textAlign: 'right' }}>Amount</th>
                      <th style={{ padding: '14px 20px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv, idx) => (
                      <tr
                        key={inv.id}
                        style={{
                          borderBottom: idx < invoices.length - 1 ? '1px solid var(--border)' : 'none',
                          fontSize: '0.9rem'
                        }}
                      >
                        <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: 600 }}>
                          {inv.invoice_number}
                        </td>
                        <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                          {formatCycleDate(inv.invoice_date)}
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '2px 10px',
                              borderRadius: 12,
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              background:
                                inv.status === 'paid'
                                  ? 'rgba(16, 185, 129, 0.15)'
                                  : 'rgba(245, 158, 11, 0.15)',
                              color: inv.status === 'paid' ? '#10b981' : '#f59e0b'
                            }}
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: inv.status === 'paid' ? '#10b981' : '#f59e0b'
                              }}
                            />
                            {inv.status}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '16px 20px',
                            textAlign: 'right',
                            fontFamily: 'monospace',
                            fontWeight: 600
                          }}
                        >
                          ${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 10, alignItems: 'center' }}>
                            {inv.status !== 'paid' && (
                              <button
                                type="button"
                                onClick={() => handlePayInvoice(inv.id)}
                                disabled={payingInvoiceId === inv.id}
                                className="btn-primary"
                                style={{
                                  width: 'auto',
                                  padding: '6px 12px',
                                  fontSize: '0.8rem'
                                }}
                              >
                                {payingInvoiceId === inv.id ? 'Processing...' : 'Pay Now'}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDownloadReceipt(inv.id, inv.invoice_number)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#3b82f6',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: '0.85rem',
                                fontWeight: 600
                              }}
                            >
                              <Download size={14} /> Receipt
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Update Payment Method Modal */}
          {showPaymentModal && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: 20
              }}
            >
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  width: '100%',
                  maxWidth: 480,
                  boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                }}
              >
                <div
                  style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>
                    Update Corporate Card
                  </h3>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleUpdatePayment} style={{ padding: 24 }}>
                  <div className="input-group">
                    <label>Cardholder Name</label>
                    <input
                      type="text"
                      required
                      value={paymentForm.cardholder_name}
                      onChange={e => setPaymentForm({ ...paymentForm, cardholder_name: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label>Corporate Card Number</label>
                    <input
                      type="text"
                      required
                      placeholder="4242 4242 4242 4242"
                      value={paymentForm.card_number}
                      onChange={e => setPaymentForm({ ...paymentForm, card_number: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div className="input-group">
                      <label>Exp Month</label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        required
                        value={paymentForm.exp_month}
                        onChange={e => setPaymentForm({ ...paymentForm, exp_month: Number(e.target.value) })}
                      />
                    </div>
                    <div className="input-group">
                      <label>Exp Year</label>
                      <input
                        type="number"
                        min="2024"
                        max="2040"
                        required
                        value={paymentForm.exp_year}
                        onChange={e => setPaymentForm({ ...paymentForm, exp_year: Number(e.target.value) })}
                      />
                    </div>
                    <div className="input-group">
                      <label>CVC</label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        value={paymentForm.cvc}
                        onChange={e => setPaymentForm({ ...paymentForm, cvc: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="input-group" style={{ marginBottom: 24 }}>
                    <label>Billing Invoices Email</label>
                    <input
                      type="email"
                      value={paymentForm.billing_email}
                      onChange={e => setPaymentForm({ ...paymentForm, billing_email: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setShowPaymentModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updatingPayment}
                      className="btn-primary"
                      style={{ width: 'auto' }}
                    >
                      {updatingPayment ? 'Saving...' : 'Save Payment Card'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Change Plan Modal */}
          {showPlanModal && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: 20
              }}
            >
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  width: '100%',
                  maxWidth: 620,
                  boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                }}
              >
                <div
                  style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>
                    Change Subscription Tier
                  </h3>
                  <button
                    onClick={() => setShowPlanModal(false)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div style={{ padding: 24 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
                    {[
                      {
                        name: 'Starter',
                        price: '$499/mo',
                        policies: '1,000 policies',
                        claims: '500 claims',
                        desc: 'Ideal for local agencies launching first digital products.'
                      },
                      {
                        name: 'Growth',
                        price: '$1,499/mo',
                        policies: '5,000 policies',
                        claims: '2,500 claims',
                        desc: 'Expanding regional insurers scaling underwriting operations.'
                      },
                      {
                        name: 'Enterprise AI',
                        price: '$4,250/mo',
                        policies: '10,000 policies',
                        claims: '5,000 claims',
                        desc: 'Full platform access with straight-through processing limits.'
                      }
                    ].map(tier => {
                      const isSelected = selectedPlan === tier.name;
                      return (
                        <div
                          key={tier.name}
                          onClick={() => setSelectedPlan(tier.name)}
                          style={{
                            border: `2px solid ${isSelected ? '#3b82f6' : 'var(--border)'}`,
                            background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                            borderRadius: 10,
                            padding: '16px 20px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.15s'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <strong style={{ fontSize: '1.05rem' }}>{tier.name}</strong>
                              <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600 }}>
                                {tier.policies} • {tier.claims}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                              {tier.desc}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 700, fontSize: '1.15rem' }}>{tier.price}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setShowPlanModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={updatingPlan}
                      onClick={handleUpdatePlan}
                      className="btn-primary"
                      style={{ width: 'auto' }}
                    >
                      {updatingPlan ? 'Updating Plan...' : 'Confirm Tier Change'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
