import React, { useEffect, useState } from 'react';
import api from '../../api';
import {
  Car,
  Home,
  HeartPulse,
  ShieldCheck,
  FileText,
  Plus,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Save,
  Trash2,
  X,
  Layers,
  Filter,
  Info
} from 'lucide-react';

interface PolicyConfig {
  id: number;
  tenant_id: number;
  product_type: string;
  name: string;
  description?: string;
  status: 'active' | 'draft' | 'archived';
  version: string;
  last_updated_by?: string;

  max_coverage_limit: number;
  standard_deductible: number;

  min_driver_age?: number;
  max_vehicle_age?: number;
  rules?: Record<string, any>;

  base_min_premium: number;
  base_max_premium: number;
  standard_min_premium: number;
  standard_max_premium: number;
  premium_min_premium: number;
  premium_max_premium: number;

  stp_limit: number;
  manual_review_threshold: number;
  enable_auto_stp: boolean;

  created_at: string;
  updated_at: string;
}

interface TenantPoliciesProps {
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

export default function TenantPolicies({ tenantContext, currentUser }: TenantPoliciesProps) {
  const [configs, setConfigs] = useState<PolicyConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Availability / Catalog Filter Tab
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'draft' | 'archived'>('ALL');

  // Accordion state: set of expanded config IDs
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});

  // Editing state per config ID
  const [formData, setFormData] = useState<Record<number, Partial<PolicyConfig>>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  // New Product Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newProductError, setNewProductError] = useState('');
  const [newProduct, setNewProduct] = useState({
    product_type: 'auto',
    name: '',
    description: '',
    status: 'active' as const,
    max_coverage_limit: 100000,
    standard_deductible: 500,
    min_driver_age: 18,
    max_vehicle_age: 25,
    base_min_premium: 450,
    base_max_premium: 1200,
    standard_min_premium: 800,
    standard_max_premium: 2500,
    premium_min_premium: 1800,
    premium_max_premium: 5000,
    stp_limit: 3000,
    manual_review_threshold: 5000,
    enable_auto_stp: true,
    rules: {
      clean_record_required: true,
      commercial_use_allowed: false
    } as Record<string, any>
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/policy-configs/');
      setConfigs(res.data);

      const initialForm: Record<number, Partial<PolicyConfig>> = {};
      const initialExpanded: Record<number, boolean> = {};

      res.data.forEach((item: PolicyConfig, index: number) => {
        initialForm[item.id] = { ...item };
        if (index === 0) initialExpanded[item.id] = true;
      });

      setFormData(initialForm);
      setExpandedIds(initialExpanded);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load policy configurations');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleInputChange = (id: number, field: keyof PolicyConfig, value: any) => {
    setFormData(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const handleRuleChange = (id: number, ruleKey: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        rules: {
          ...(prev[id]?.rules || {}),
          [ruleKey]: value
        }
      }
    }));
  };

  const handleSave = async (id: number) => {
    setSavingId(id);
    setError('');
    setSuccessMessage('');

    try {
      const data = formData[id];
      const res = await api.put(`/api/policy-configs/${id}`, {
        name: data?.name,
        description: data?.description,
        status: data?.status,
        max_coverage_limit: Number(data?.max_coverage_limit || 0),
        standard_deductible: Number(data?.standard_deductible || 0),
        min_driver_age: data?.min_driver_age !== undefined ? Number(data.min_driver_age) : undefined,
        max_vehicle_age: data?.max_vehicle_age !== undefined ? Number(data.max_vehicle_age) : undefined,
        rules: data?.rules || {},
        base_min_premium: Number(data?.base_min_premium || 0),
        base_max_premium: Number(data?.base_max_premium || 0),
        standard_min_premium: Number(data?.standard_min_premium || 0),
        standard_max_premium: Number(data?.standard_max_premium || 0),
        premium_min_premium: Number(data?.premium_min_premium || 0),
        premium_max_premium: Number(data?.premium_max_premium || 0),
        stp_limit: Number(data?.stp_limit || 0),
        manual_review_threshold: Number(data?.manual_review_threshold || 0),
        enable_auto_stp: Boolean(data?.enable_auto_stp ?? true)
      });

      const updated = res.data;
      setConfigs(prev => prev.map(c => (c.id === id ? updated : c)));
      setFormData(prev => ({ ...prev, [id]: { ...updated } }));
      setSuccessMessage(`Saved changes for ${updated.name} (Incremented to ${updated.version})`);
      setTimeout(() => setSuccessMessage(''), 4500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save policy configuration');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete or retire '${name}'?`)) {
      return;
    }
    try {
      await api.delete(`/api/policy-configs/${id}`);
      setConfigs(prev => prev.filter(c => c.id !== id));
      setSuccessMessage(`Retired product offering '${name}'`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete policy configuration');
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewProductError('');
    setCreating(true);

    try {
      const res = await api.post('/api/policy-configs/', {
        ...newProduct,
        max_coverage_limit: Number(newProduct.max_coverage_limit),
        standard_deductible: Number(newProduct.standard_deductible),
        min_driver_age: Number(newProduct.min_driver_age),
        max_vehicle_age: Number(newProduct.max_vehicle_age),
        base_min_premium: Number(newProduct.base_min_premium),
        base_max_premium: Number(newProduct.base_max_premium),
        standard_min_premium: Number(newProduct.standard_min_premium),
        standard_max_premium: Number(newProduct.standard_max_premium),
        premium_min_premium: Number(newProduct.premium_min_premium),
        premium_max_premium: Number(newProduct.premium_max_premium),
        stp_limit: Number(newProduct.stp_limit),
        manual_review_threshold: Number(newProduct.manual_review_threshold),
        enable_auto_stp: Boolean(newProduct.enable_auto_stp)
      });

      const created = res.data;
      setConfigs(prev => [...prev, created]);
      setFormData(prev => ({ ...prev, [created.id]: { ...created } }));
      setExpandedIds(prev => ({ ...prev, [created.id]: true }));
      setShowNewModal(false);
      setSuccessMessage(`Created product '${created.name}' (${created.version})`);
      setTimeout(() => setSuccessMessage(''), 4000);

      // Reset form
      setNewProduct({
        product_type: 'auto',
        name: '',
        description: '',
        status: 'active',
        max_coverage_limit: 100000,
        standard_deductible: 500,
        min_driver_age: 18,
        max_vehicle_age: 25,
        base_min_premium: 450,
        base_max_premium: 1200,
        standard_min_premium: 800,
        standard_max_premium: 2500,
        premium_min_premium: 1800,
        premium_max_premium: 5000,
        stp_limit: 3000,
        manual_review_threshold: 5000,
        enable_auto_stp: true,
        rules: {
          clean_record_required: true,
          commercial_use_allowed: false
        }
      });
    } catch (err: any) {
      setNewProductError(err.response?.data?.detail || 'Failed to create product configuration');
    } finally {
      setCreating(false);
    }
  };

  const getProductIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'auto':
        return <Car size={22} style={{ color: '#60a5fa' }} />;
      case 'property':
        return <Home size={22} style={{ color: '#34d399' }} />;
      case 'health':
        return <HeartPulse size={22} style={{ color: '#f87171' }} />;
      case 'life':
        return <ShieldCheck size={22} style={{ color: '#c084fc' }} />;
      default:
        return <FileText size={22} style={{ color: '#fbbf24' }} />;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const activeCount = configs.filter(c => c.status === 'active').length;
  const draftCount = configs.filter(c => c.status === 'draft').length;
  const archivedCount = configs.filter(c => c.status === 'archived').length;

  const filteredConfigs = configs.filter(c => {
    if (statusFilter === 'ALL') return true;
    return c.status === statusFilter;
  });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 6px 0' }}>
            Insurance Product & Business Configuration
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
            Configure product lines, underwriting eligibility rules, premium bands, and approval thresholds for {tenantContext.name} • Managed by {currentUser.name || currentUser.email}.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowNewModal(true)}
          style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}
        >
          <Plus size={18} /> New Product Offering
        </button>
      </div>

      {/* Immutability & Versioning Notice Banner */}
      <div
        style={{
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: 10,
          padding: '12px 18px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: '0.85rem',
          color: '#93c5fd'
        }}
      >
        <Info size={18} style={{ flexShrink: 0, color: '#60a5fa' }} />
        <div>
          <strong>Policy Immutability Protection:</strong> Changes to product rules, deductibles, or premium bands automatically bump product versions (e.g. v1.0 → v1.1). Previously issued customer policies remain bound to their historical terms and are never altered.
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
        <div
          className="error-alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 20
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Availability Status Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 20,
          borderBottom: '1px solid var(--border)',
          paddingBottom: 12,
          alignItems: 'center'
        }}
      >
        <Filter size={16} style={{ color: '#94a3b8', marginRight: 4 }} />
        <button
          onClick={() => setStatusFilter('ALL')}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            border: '1px solid',
            borderColor: statusFilter === 'ALL' ? '#3b82f6' : 'var(--border)',
            background: statusFilter === 'ALL' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            color: statusFilter === 'ALL' ? '#60a5fa' : '#94a3b8',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 500
          }}
        >
          All Offerings ({configs.length})
        </button>

        <button
          onClick={() => setStatusFilter('active')}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            border: '1px solid',
            borderColor: statusFilter === 'active' ? '#10b981' : 'var(--border)',
            background: statusFilter === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
            color: statusFilter === 'active' ? '#34d399' : '#94a3b8',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 500
          }}
        >
          Active ({activeCount})
        </button>

        <button
          onClick={() => setStatusFilter('draft')}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            border: '1px solid',
            borderColor: statusFilter === 'draft' ? '#f59e0b' : 'var(--border)',
            background: statusFilter === 'draft' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
            color: statusFilter === 'draft' ? '#fbbf24' : '#94a3b8',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 500
          }}
        >
          Drafts ({draftCount})
        </button>

        <button
          onClick={() => setStatusFilter('archived')}
          style={{
            padding: '6px 14px',
            borderRadius: 6,
            border: '1px solid',
            borderColor: statusFilter === 'archived' ? '#ef4444' : 'var(--border)',
            background: statusFilter === 'archived' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
            color: statusFilter === 'archived' ? '#f87171' : '#94a3b8',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 500
          }}
        >
          Retired / Archived ({archivedCount})
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Clock className="animate-spin" size={32} style={{ margin: '0 auto 12px auto' }} />
          <div>Loading product configurations...</div>
        </div>
      ) : filteredConfigs.length === 0 ? (
        /* Empty State */
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '60px 20px',
            textAlign: 'center'
          }}
        >
          <Layers size={48} style={{ color: 'var(--text-secondary)', margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '1.25rem', margin: '0 0 8px 0' }}>
            {statusFilter === 'ALL' ? 'No Insurance Products Configured' : `No ${statusFilter.toUpperCase()} Products`}
          </h3>
          <p
            style={{
              color: 'var(--text-secondary)',
              maxWidth: 450,
              margin: '0 auto 24px auto',
              fontSize: '0.9rem'
            }}
          >
            {statusFilter === 'ALL'
              ? 'Your product catalog is empty. Define your first insurance product to configure underwriting rules, coverage limits, and premium bands.'
              : `There are currently no products under the '${statusFilter}' status.`}
          </p>
          <button
            className="btn-primary"
            onClick={() => setShowNewModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, width: 'auto' }}
          >
            <Plus size={16} /> Define Product
          </button>
        </div>
      ) : (
        /* Product Config Cards */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {filteredConfigs.map(config => {
            const isExpanded = expandedIds[config.id];
            const currentForm = formData[config.id] || config;
            const isSaving = savingId === config.id;
            const isArchived = currentForm.status === 'archived';

            return (
              <div
                key={config.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  opacity: isArchived ? 0.85 : 1
                }}
              >
                {/* Card Header */}
                <div
                  onClick={() => toggleExpand(config.id)}
                  style={{
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    background: isExpanded ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                    borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: 'rgba(59, 130, 246, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {getProductIcon(config.product_type)}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600 }}>
                          {config.name}
                        </h3>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            background:
                              config.status === 'active'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : config.status === 'draft'
                                ? 'rgba(245, 158, 11, 0.15)'
                                : 'rgba(239, 68, 68, 0.15)',
                            color:
                              config.status === 'active'
                                ? '#34d399'
                                : config.status === 'draft'
                                ? '#fbbf24'
                                : '#f87171'
                          }}
                        >
                          {config.status}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                          marginTop: 3
                        }}
                      >
                        Line: <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{config.product_type}</strong>
                        {` • Max Coverage: $${Number(config.max_coverage_limit || 100000).toLocaleString()}`}
                        {` • Deductible: $${Number(config.standard_deductible || 500).toLocaleString()}`}
                        {config.description && ` • ${config.description}`}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Last modified by <span style={{ color: 'var(--text-primary)' }}>{config.last_updated_by || 'Admin'}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                        {formatDate(config.updated_at || config.created_at)} •{' '}
                        <strong style={{ color: '#60a5fa' }}>{config.version}</strong>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {/* Card Expanded Content */}
                {isExpanded && (
                  <div style={{ padding: 28 }}>
                    {/* General & Availability Section */}
                    <div style={{ marginBottom: 32 }}>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: '#60a5fa',
                          borderBottom: '1px solid var(--border)',
                          paddingBottom: 8,
                          marginBottom: 16
                        }}
                      >
                        General Offering & Availability
                      </div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                          gap: 16
                        }}
                      >
                        <div className="input-group" style={{ margin: 0 }}>
                          <label>Product Display Name</label>
                          <input
                            type="text"
                            value={currentForm.name || ''}
                            onChange={e => handleInputChange(config.id, 'name', e.target.value)}
                          />
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                          <label>Catalog Availability Status</label>
                          <select
                            value={currentForm.status || 'active'}
                            onChange={e => handleInputChange(config.id, 'status', e.target.value)}
                          >
                            <option value="active">Active (Available for Customer Quotes)</option>
                            <option value="draft">Draft (Under Review / Internal)</option>
                            <option value="archived">Archived (Retired — Existing Policies Preserved)</option>
                          </select>
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                          <label>Maximum Coverage Limit ($)</label>
                          <input
                            type="number"
                            value={currentForm.max_coverage_limit ?? 100000}
                            onChange={e => handleInputChange(config.id, 'max_coverage_limit', e.target.value)}
                          />
                        </div>
                        <div className="input-group" style={{ margin: 0 }}>
                          <label>Standard Deductible ($)</label>
                          <input
                            type="number"
                            value={currentForm.standard_deductible ?? 500}
                            onChange={e => handleInputChange(config.id, 'standard_deductible', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="input-group" style={{ marginTop: 16, marginBottom: 0 }}>
                        <label>Product Description / Scope</label>
                        <input
                          type="text"
                          placeholder="Summary of terms, included perils, and eligibility..."
                          value={currentForm.description || ''}
                          onChange={e => handleInputChange(config.id, 'description', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Line-Specific Structured Rules */}
                    <div style={{ marginBottom: 32 }}>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: '#60a5fa',
                          borderBottom: '1px solid var(--border)',
                          paddingBottom: 8,
                          marginBottom: 16
                        }}
                      >
                        Line-Specific Underwriting Rules ({config.product_type.toUpperCase()})
                      </div>

                      {config.product_type.toLowerCase() === 'auto' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                          <div className="input-group" style={{ margin: 0 }}>
                            <label>Minimum Driver Age</label>
                            <input
                              type="number"
                              value={currentForm.min_driver_age ?? 18}
                              onChange={e => handleInputChange(config.id, 'min_driver_age', e.target.value)}
                            />
                          </div>
                          <div className="input-group" style={{ margin: 0 }}>
                            <label>Max Vehicle Age (Years)</label>
                            <input
                              type="number"
                              value={currentForm.max_vehicle_age ?? 25}
                              onChange={e => handleInputChange(config.id, 'max_vehicle_age', e.target.value)}
                            />
                          </div>
                          <div className="input-group" style={{ margin: 0 }}>
                            <label>Driving Record Requirement</label>
                            <select
                              value={currentForm.rules?.clean_record_required ? 'yes' : 'no'}
                              onChange={e => handleRuleChange(config.id, 'clean_record_required', e.target.value === 'yes')}
                            >
                              <option value="yes">Clean Driving Record Required (No major violations)</option>
                              <option value="no">Standard Violations Permitted (Surcharged)</option>
                            </select>
                          </div>
                          <div className="input-group" style={{ margin: 0 }}>
                            <label>Rideshare / Commercial Use</label>
                            <select
                              value={currentForm.rules?.commercial_use_allowed ? 'yes' : 'no'}
                              onChange={e => handleRuleChange(config.id, 'commercial_use_allowed', e.target.value === 'yes')}
                            >
                              <option value="no">Personal Use Only</option>
                              <option value="yes">Commercial & Rideshare Endorsement Allowed</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {config.product_type.toLowerCase() === 'health' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                          <div className="input-group" style={{ margin: 0 }}>
                            <label>Maximum Entry Age (Years)</label>
                            <input
                              type="number"
                              value={currentForm.rules?.max_entry_age ?? 65}
                              onChange={e => handleRuleChange(config.id, 'max_entry_age', Number(e.target.value))}
                            />
                          </div>
                          <div className="input-group" style={{ margin: 0 }}>
                            <label>Pre-existing Conditions</label>
                            <select
                              value={currentForm.rules?.pre_existing_conditions_covered ? 'yes' : 'no'}
                              onChange={e => handleRuleChange(config.id, 'pre_existing_conditions_covered', e.target.value === 'yes')}
                            >
                              <option value="yes">Covered (Subject to waiting period)</option>
                              <option value="no">Excluded from Standard Policy</option>
                            </select>
                          </div>
                          <div className="input-group" style={{ margin: 0 }}>
                            <label>Tobacco Surcharge (%)</label>
                            <input
                              type="number"
                              value={currentForm.rules?.tobacco_surcharge_percent ?? 20}
                              onChange={e => handleRuleChange(config.id, 'tobacco_surcharge_percent', Number(e.target.value))}
                            />
                          </div>
                          <div className="input-group" style={{ margin: 0 }}>
                            <label>Standard Co-Pay (%)</label>
                            <input
                              type="number"
                              value={currentForm.rules?.copay_percent ?? 15}
                              onChange={e => handleRuleChange(config.id, 'copay_percent', Number(e.target.value))}
                            />
                          </div>
                        </div>
                      )}

                      {config.product_type.toLowerCase() === 'property' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                          <div className="input-group" style={{ margin: 0 }}>
                            <label>Max Structure Age (Years)</label>
                            <input
                              type="number"
                              value={currentForm.rules?.max_building_age ?? 45}
                              onChange={e => handleRuleChange(config.id, 'max_building_age', Number(e.target.value))}
                            />
                          </div>
                          <div className="input-group" style={{ margin: 0 }}>
                            <label>Flood Zone Permitted</label>
                            <select
                              value={currentForm.rules?.flood_zone_covered ? 'yes' : 'no'}
                              onChange={e => handleRuleChange(config.id, 'flood_zone_covered', e.target.value === 'yes')}
                            >
                              <option value="no">Non-High-Risk Flood Zones Only</option>
                              <option value="yes">High-Risk Zones Allowed (With Mandatory Surcharge)</option>
                            </select>
                          </div>
                          <div className="input-group" style={{ margin: 0 }}>
                            <label>Monitored Security System</label>
                            <select
                              value={currentForm.rules?.security_system_required ? 'yes' : 'no'}
                              onChange={e => handleRuleChange(config.id, 'security_system_required', e.target.value === 'yes')}
                            >
                              <option value="no">Optional (Discount applies if present)</option>
                              <option value="yes">Mandatory for High-Value Dwellings</option>
                            </select>
                          </div>
                          <div className="input-group" style={{ margin: 0 }}>
                            <label>Occupancy Requirement</label>
                            <select
                              value={currentForm.rules?.primary_occupancy_required ? 'yes' : 'no'}
                              onChange={e => handleRuleChange(config.id, 'primary_occupancy_required', e.target.value === 'yes')}
                            >
                              <option value="yes">Primary Residence Only</option>
                              <option value="no">Secondary / Rental Dwellings Permitted</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {config.product_type.toLowerCase() === 'life' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                          <div className="input-group" style={{ margin: 0 }}>
                            <label>Maximum Issuance Age</label>
                            <input
                              type="number"
                              value={currentForm.rules?.max_issuance_age ?? 70}
                              onChange={e => handleRuleChange(config.id, 'max_issuance_age', Number(e.target.value))}
                            />
                          </div>
                          <div className="input-group" style={{ margin: 0 }}>
                            <label>Medical Exam Threshold ($ Sum Insured)</label>
                            <input
                              type="number"
                              value={currentForm.rules?.medical_exam_threshold ?? 250000}
                              onChange={e => handleRuleChange(config.id, 'medical_exam_threshold', Number(e.target.value))}
                            />
                          </div>
                          <div className="input-group" style={{ margin: 0 }}>
                            <label>Contestability Period (Years)</label>
                            <input
                              type="number"
                              value={currentForm.rules?.contestability_years ?? 2}
                              onChange={e => handleRuleChange(config.id, 'contestability_years', Number(e.target.value))}
                            />
                          </div>
                          <div className="input-group" style={{ margin: 0 }}>
                            <label>Accelerated Benefit Rider</label>
                            <select
                              value={currentForm.rules?.accelerated_benefit_rider ? 'yes' : 'no'}
                              onChange={e => handleRuleChange(config.id, 'accelerated_benefit_rider', e.target.value === 'yes')}
                            >
                              <option value="yes">Included (Terminal Illness Payout)</option>
                              <option value="no">Standard Death Benefit Only</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Premium Bands Section */}
                    <div style={{ marginBottom: 32 }}>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: '#60a5fa',
                          borderBottom: '1px solid var(--border)',
                          paddingBottom: 8,
                          marginBottom: 16
                        }}
                      >
                        Premium Bands (Pricing Bounds)
                      </div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                          gap: 16
                        }}
                      >
                        {/* Base Tier */}
                        <div
                          style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid var(--border)',
                            borderRadius: 8,
                            padding: 16
                          }}
                        >
                          <div
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              color: 'var(--text-secondary)',
                              marginBottom: 12
                            }}
                          >
                            Base Tier
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div className="input-group" style={{ margin: 0 }}>
                              <label style={{ fontSize: '0.75rem' }}>Min Premium ($)</label>
                              <input
                                type="number"
                                value={currentForm.base_min_premium ?? 0}
                                onChange={e => handleInputChange(config.id, 'base_min_premium', e.target.value)}
                              />
                            </div>
                            <div className="input-group" style={{ margin: 0 }}>
                              <label style={{ fontSize: '0.75rem' }}>Max Premium ($)</label>
                              <input
                                type="number"
                                value={currentForm.base_max_premium ?? 0}
                                onChange={e => handleInputChange(config.id, 'base_max_premium', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Standard Tier */}
                        <div
                          style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid var(--border)',
                            borderRadius: 8,
                            padding: 16
                          }}
                        >
                          <div
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              color: 'var(--text-secondary)',
                              marginBottom: 12
                            }}
                          >
                            Standard Tier
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div className="input-group" style={{ margin: 0 }}>
                              <label style={{ fontSize: '0.75rem' }}>Min Premium ($)</label>
                              <input
                                type="number"
                                value={currentForm.standard_min_premium ?? 0}
                                onChange={e => handleInputChange(config.id, 'standard_min_premium', e.target.value)}
                              />
                            </div>
                            <div className="input-group" style={{ margin: 0 }}>
                              <label style={{ fontSize: '0.75rem' }}>Max Premium ($)</label>
                              <input
                                type="number"
                                value={currentForm.standard_max_premium ?? 0}
                                onChange={e => handleInputChange(config.id, 'standard_max_premium', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Premium Tier */}
                        <div
                          style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid var(--border)',
                            borderRadius: 8,
                            padding: 16
                          }}
                        >
                          <div
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              color: 'var(--text-secondary)',
                              marginBottom: 12
                            }}
                          >
                            Premium Tier
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div className="input-group" style={{ margin: 0 }}>
                              <label style={{ fontSize: '0.75rem' }}>Min Premium ($)</label>
                              <input
                                type="number"
                                value={currentForm.premium_min_premium ?? 0}
                                onChange={e => handleInputChange(config.id, 'premium_min_premium', e.target.value)}
                              />
                            </div>
                            <div className="input-group" style={{ margin: 0 }}>
                              <label style={{ fontSize: '0.75rem' }}>Max Premium ($)</label>
                              <input
                                type="number"
                                value={currentForm.premium_max_premium ?? 0}
                                onChange={e => handleInputChange(config.id, 'premium_max_premium', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Underwriting Thresholds & Workflow Controls */}
                    <div style={{ marginBottom: 32 }}>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: '#60a5fa',
                          borderBottom: '1px solid var(--border)',
                          paddingBottom: 8,
                          marginBottom: 16
                        }}
                      >
                        Underwriting Thresholds & Workflow Controls
                      </div>
                      <div
                        style={{
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          padding: 20
                        }}
                      >
                        {/* STP Toggle */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 16,
                            marginBottom: 20
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                              Automated Straight-Through Processing (STP)
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                              When enabled, eligible applicants below the STP limit auto-approve without manual underwriter intervention.
                            </div>
                          </div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', margin: 0 }}>
                            <input
                              type="checkbox"
                              checked={currentForm.enable_auto_stp ?? true}
                              onChange={e => handleInputChange(config.id, 'enable_auto_stp', e.target.checked)}
                              style={{ width: 18, height: 18, accentColor: '#3b82f6' }}
                            />
                            <span style={{ fontSize: '0.9rem', color: currentForm.enable_auto_stp ? '#34d399' : '#94a3b8', fontWeight: 600 }}>
                              {currentForm.enable_auto_stp ? 'STP Enabled' : 'Mandatory Manual Review'}
                            </span>
                          </label>
                        </div>

                        {/* STP Limit */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 16,
                            borderTop: '1px solid var(--border)',
                            paddingTop: 16,
                            marginBottom: 16
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                              Straight-Through Processing (STP) Limit ($)
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                              Maximum premium / liability eligible for immediate auto-approval.
                            </div>
                          </div>
                          <div style={{ width: 180 }}>
                            <input
                              type="number"
                              value={currentForm.stp_limit ?? 0}
                              onChange={e => handleInputChange(config.id, 'stp_limit', e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Escalation Threshold */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 16,
                            borderTop: '1px solid var(--border)',
                            paddingTop: 16
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                              Senior Underwriter Escalation Limit ($)
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                              Quotes exceeding this premium must receive supervisory sign-off before issuance.
                            </div>
                          </div>
                          <div style={{ width: 180 }}>
                            <input
                              type="number"
                              value={currentForm.manual_review_threshold ?? 0}
                              onChange={e => handleInputChange(config.id, 'manual_review_threshold', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid var(--border)',
                        paddingTop: 20
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleDelete(config.id, config.name)}
                        style={{
                          background: 'transparent',
                          color: '#f87171',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          borderRadius: 6,
                          padding: '8px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        <Trash2 size={15} /> Delete Product
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSave(config.id)}
                        disabled={isSaving}
                        className="btn-primary"
                        style={{
                          width: 'auto',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '10px 24px'
                        }}
                      >
                        <Save size={16} />
                        {isSaving ? 'Saving & Bumping Version...' : 'Save Configuration Changes'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New Product Offering Modal */}
      {showNewModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
            backdropFilter: 'blur(4px)'
          }}
        >
          <div
            className="login-box"
            style={{
              maxWidth: 680,
              width: '100%',
              background: '#0f172a',
              border: '1px solid #1e293b',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Plus size={22} style={{ color: '#3b82f6' }} />
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Define New Insurance Product</h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {newProductError && (
              <div className="error-alert" style={{ marginBottom: 16 }}>
                <AlertCircle size={16} /> <span>{newProductError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProduct}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div className="input-group">
                  <label>Product Line *</label>
                  <select
                    value={newProduct.product_type}
                    onChange={e => setNewProduct(prev => ({ ...prev, product_type: e.target.value }))}
                  >
                    <option value="auto">Auto / Motor Insurance</option>
                    <option value="health">Health & Medical Insurance</option>
                    <option value="property">Property & Home Insurance</option>
                    <option value="life">Term / Whole Life Insurance</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Product Offering Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Comprehensive Motor Shield"
                    value={newProduct.name}
                    onChange={e => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Description / Policy Summary</label>
                <input
                  type="text"
                  placeholder="Outline coverage scope, inclusions, and key targets..."
                  value={newProduct.description}
                  onChange={e => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                <div className="input-group">
                  <label>Maximum Coverage Limit ($)</label>
                  <input
                    type="number"
                    value={newProduct.max_coverage_limit}
                    onChange={e => setNewProduct(prev => ({ ...prev, max_coverage_limit: Number(e.target.value) }))}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Standard Deductible ($)</label>
                  <input
                    type="number"
                    value={newProduct.standard_deductible}
                    onChange={e => setNewProduct(prev => ({ ...prev, standard_deductible: Number(e.target.value) }))}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Catalog Status</label>
                  <select
                    value={newProduct.status}
                    onChange={e => setNewProduct(prev => ({ ...prev, status: e.target.value as any }))}
                  >
                    <option value="active">Active (Available for Quoting)</option>
                    <option value="draft">Draft (Under Review)</option>
                  </select>
                </div>
              </div>

              {/* Pricing & STP */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: 16,
                  margin: '16px 0'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#60a5fa', marginBottom: 12 }}>
                  Baseline Pricing & Underwriting Thresholds
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>Base Min ($)</label>
                    <input
                      type="number"
                      value={newProduct.base_min_premium}
                      onChange={e => setNewProduct(prev => ({ ...prev, base_min_premium: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>Base Max ($)</label>
                    <input
                      type="number"
                      value={newProduct.base_max_premium}
                      onChange={e => setNewProduct(prev => ({ ...prev, base_max_premium: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>STP Limit ($)</label>
                    <input
                      type="number"
                      value={newProduct.stp_limit}
                      onChange={e => setNewProduct(prev => ({ ...prev, stp_limit: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '0.75rem' }}>Escalation Threshold ($)</label>
                    <input
                      type="number"
                      value={newProduct.manual_review_threshold}
                      onChange={e => setNewProduct(prev => ({ ...prev, manual_review_threshold: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={newProduct.enable_auto_stp}
                      onChange={e => setNewProduct(prev => ({ ...prev, enable_auto_stp: e.target.checked }))}
                      style={{ width: 16, height: 16, accentColor: '#3b82f6' }}
                    />
                    <span style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>
                      Enable automated straight-through processing (STP) for eligible applications
                    </span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowNewModal(false)}
                  style={{ flex: 1, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={creating}
                  style={{ flex: 1 }}
                >
                  {creating ? 'Creating...' : 'Create Product Offering'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
