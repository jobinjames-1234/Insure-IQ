import { useEffect, useState } from 'react';
import api from '../../api';
import {
  Search,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  Clock,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Users,
  Layers,
  Code
} from 'lucide-react';

interface AuditLogItem {
  id: number;
  tenant_id: number;
  created_at: string;
  actor_id?: number;
  actor_name?: string;
  actor_email?: string;
  actor_role?: string;
  category: string;
  action: string;
  outcome: string;
  entity_type?: string;
  entity_id?: string;
  entity_name?: string;
  summary: string;
  notes?: string;
  details?: Record<string, any>;
}

interface TenantAuditLogProps {
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

export default function TenantAuditLog({ tenantContext, currentUser }: TenantAuditLogProps) {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedOutcome, setSelectedOutcome] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState('all');

  // Expanded rows state
  const [expandedRowIds, setExpandedRowIds] = useState<Record<number, boolean>>({});
  const [showJsonForId, setShowJsonForId] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchAuditLogs();
  }, [selectedCategory, selectedOutcome, selectedDateRange]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError('');

      const params: Record<string, string> = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedOutcome !== 'all') params.outcome = selectedOutcome;
      if (selectedDateRange !== 'all') params.date_range = selectedDateRange;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await api.get('/api/audit-logs/', { params });
      setLogs(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAuditLogs();
  };

  const toggleRow = (id: number) => {
    setExpandedRowIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleJson = (id: number) => {
    setShowJsonForId(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const exportToCsv = () => {
    if (logs.length === 0) return;

    const headers = [
      'ID',
      'Timestamp',
      'Category',
      'Action',
      'Outcome',
      'Entity Type',
      'Entity Name',
      'Actor Name',
      'Actor Email',
      'Actor Role',
      'Summary',
      'Notes'
    ];

    const rows = logs.map(l => [
      l.id,
      new Date(l.created_at).toISOString(),
      l.category,
      l.action,
      l.outcome,
      l.entity_type || '',
      `"${(l.entity_name || '').replace(/"/g, '""')}"`,
      `"${(l.actor_name || '').replace(/"/g, '""')}"`,
      l.actor_email || '',
      l.actor_role || '',
      `"${(l.summary || '').replace(/"/g, '""')}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `${tenantContext.subdomain}_audit_log_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return {
        date: d.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        time: d.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      };
    } catch {
      return { date: dateStr, time: '' };
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category.toLowerCase()) {
      case 'policy_config':
        return { label: 'Policy Config', icon: FileText, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' };
      case 'team_management':
        return { label: 'Team', icon: Users, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)' };
      case 'underwriting':
        return { label: 'Underwriting', icon: ShieldCheck, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
      case 'claims':
        return { label: 'Claims', icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
      default:
        return { label: category, icon: Layers, color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)' };
    }
  };

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome.toLowerCase()) {
      case 'approved':
      case 'success':
        return {
          label: outcome.toUpperCase(),
          bg: 'rgba(16, 185, 129, 0.15)',
          color: '#10b981',
          dot: '#10b981'
        };
      case 'rejected':
      case 'failed':
        return {
          label: outcome.toUpperCase(),
          bg: 'rgba(239, 68, 68, 0.15)',
          color: '#ef4444',
          dot: '#ef4444'
        };
      case 'escalated':
      case 'warning':
        return {
          label: outcome.toUpperCase(),
          bg: 'rgba(245, 158, 11, 0.15)',
          color: '#f59e0b',
          dot: '#f59e0b'
        };
      default:
        return {
          label: outcome.toUpperCase(),
          bg: 'rgba(148, 163, 184, 0.15)',
          color: '#94a3b8',
          dot: '#94a3b8'
        };
    }
  };

  return (
    <div style={{ maxWidth: 1150, margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 6px 0' }}>
            Audit Log
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
            Immutable audit record of decisions, rule changes, and security events for {tenantContext.name} (Auditor: {currentUser.name || currentUser.email})
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={exportToCsv}
            disabled={logs.length === 0}
            className="btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              opacity: logs.length === 0 ? 0.5 : 1,
              cursor: logs.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 24,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ flex: '1 1 300px', display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)'
              }}
            />
            <input
              type="text"
              placeholder="Search by reference, applicant, actor, or notes..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '0 16px' }}>
            Search
          </button>
        </form>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={15} style={{ color: 'var(--text-secondary)' }} />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{ width: 'auto', padding: '8px 12px' }}
            >
              <option value="all">All Categories</option>
              <option value="policy_config">Policy Config</option>
              <option value="team_management">Team & Staff</option>
              <option value="underwriting">Underwriting</option>
              <option value="claims">Claims</option>
            </select>
          </div>

          <select
            value={selectedOutcome}
            onChange={e => setSelectedOutcome(e.target.value)}
            style={{ width: 'auto', padding: '8px 12px' }}
          >
            <option value="all">All Outcomes</option>
            <option value="success">Success</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="warning">Warning / Suspended</option>
            <option value="escalated">Escalated</option>
          </select>

          <select
            value={selectedDateRange}
            onChange={e => setSelectedDateRange(e.target.value)}
            style={{ width: 'auto', padding: '8px 12px' }}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="error-alert" style={{ marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Table Container */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          overflow: 'hidden'
        }}
      >
        {/* Table Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '40px 180px 140px 1fr 180px 130px',
            padding: '14px 20px',
            borderBottom: '1px solid var(--border)',
            background: 'rgba(255, 255, 255, 0.02)',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-secondary)'
          }}
        >
          <div></div>
          <div>Timestamp</div>
          <div>Category</div>
          <div>Entity / Subject</div>
          <div>Actor</div>
          <div style={{ textAlign: 'right' }}>Outcome</div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Clock className="animate-spin" size={32} style={{ margin: '0 auto 12px auto' }} />
            <div>Loading audit log records...</div>
          </div>
        ) : logs.length === 0 ? (
          /* Empty State */
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <ShieldCheck size={44} style={{ color: '#64748b', margin: '0 auto 16px auto' }} />
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              No Audit Records Found
            </h3>
            <p style={{ maxWidth: 450, margin: '0 auto', fontSize: '0.9rem' }}>
              {searchTerm || selectedCategory !== 'all' || selectedOutcome !== 'all' || selectedDateRange !== 'all'
                ? 'No audit log entries match your selected criteria. Try adjusting your search query or filters.'
                : 'Your audit log is currently clear. Administrative actions, rule adjustments, and decisions will automatically record here.'}
            </p>
          </div>
        ) : (
          /* Table Rows */
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {logs.map((log, index) => {
              const isExpanded = expandedRowIds[log.id];
              const showJson = showJsonForId[log.id];
              const { date, time } = formatTimestamp(log.created_at);
              const catBadge = getCategoryBadge(log.category);
              const outBadge = getOutcomeBadge(log.outcome);
              const CatIcon = catBadge.icon;

              return (
                <div
                  key={log.id}
                  style={{
                    borderBottom: index < logs.length - 1 ? '1px solid var(--border)' : 'none',
                    transition: 'background 0.15s'
                  }}
                >
                  {/* Summary Row */}
                  <div
                    onClick={() => toggleRow(log.id)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '40px 180px 140px 1fr 180px 130px',
                      padding: '16px 20px',
                      alignItems: 'center',
                      cursor: 'pointer',
                      background: isExpanded ? 'var(--bg-card-hover)' : 'transparent',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ color: 'var(--text-secondary)' }}>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>

                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{date}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{time}</div>
                    </div>

                    <div>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: catBadge.bg,
                          color: catBadge.color
                        }}
                      >
                        <CatIcon size={12} />
                        {catBadge.label}
                      </span>
                    </div>

                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                        {log.summary}
                      </div>
                      {log.entity_name && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                          Ref: <strong style={{ color: 'var(--text-primary)' }}>{log.entity_name}</strong>
                          {log.entity_id && ` (#${log.entity_id})`}
                        </div>
                      )}
                    </div>

                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                        {log.actor_name || log.actor_email || 'System'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                        {log.actor_role?.replace('_', ' ') || 'Automated'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '3px 10px',
                          borderRadius: 12,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          background: outBadge.bg,
                          color: outBadge.color
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: outBadge.dot
                          }}
                        />
                        {outBadge.label}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div
                      style={{
                        padding: '16px 20px 24px 60px',
                        background: 'rgba(0, 0, 0, 0.25)',
                        borderTop: '1px dashed var(--border)',
                        borderBottom: '1px solid var(--border)'
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
                        {/* Narrative and Notes */}
                        <div>
                          <div
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              color: 'var(--text-secondary)',
                              marginBottom: 6
                            }}
                          >
                            Justification / Event Narrative
                          </div>
                          <div
                            style={{
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border)',
                              borderRadius: 8,
                              padding: 12,
                              fontSize: '0.85rem',
                              lineHeight: 1.5,
                              color: 'var(--text-primary)'
                            }}
                          >
                            {log.notes || log.summary}
                          </div>

                          {/* Technical metadata pills */}
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 16,
                              marginTop: 12,
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)'
                            }}
                          >
                            <div>
                              Action Code:{' '}
                              <strong style={{ color: 'var(--text-primary)' }}>{log.action}</strong>
                            </div>
                            <div>
                              Audit ID:{' '}
                              <strong style={{ color: 'var(--text-primary)' }}>#{log.id}</strong>
                            </div>
                            {log.actor_email && (
                              <div>
                                Email:{' '}
                                <strong style={{ color: 'var(--text-primary)' }}>
                                  {log.actor_email}
                                </strong>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Structured details / Inspector */}
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: 6
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                color: 'var(--text-secondary)'
                              }}
                            >
                              Event Metadata
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleJson(log.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#3b82f6',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                cursor: 'pointer'
                              }}
                            >
                              <Code size={12} /> {showJson ? 'Hide JSON' : 'Inspect JSON'}
                            </button>
                          </div>

                          {showJson ? (
                            <pre
                              style={{
                                background: '#0a0c10',
                                border: '1px solid var(--border)',
                                borderRadius: 8,
                                padding: 10,
                                fontSize: '0.75rem',
                                color: '#38bdf8',
                                overflowX: 'auto',
                                maxHeight: 150,
                                margin: 0
                              }}
                            >
                              {JSON.stringify(log.details || {}, null, 2)}
                            </pre>
                          ) : (
                            <div
                              style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                borderRadius: 8,
                                padding: 12,
                                fontSize: '0.8rem'
                              }}
                            >
                              {log.details && Object.keys(log.details).length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  {Object.entries(log.details).map(([key, value]) => (
                                    <div
                                      key={key}
                                      style={{ display: 'flex', justifyContent: 'space-between' }}
                                    >
                                      <span style={{ color: 'var(--text-secondary)' }}>
                                        {key.replace(/_/g, ' ')}:
                                      </span>
                                      <strong style={{ color: 'var(--text-primary)' }}>
                                        {typeof value === 'object'
                                          ? JSON.stringify(value)
                                          : String(value)}
                                      </strong>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                  No additional payload metadata recorded.
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
