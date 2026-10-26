import React, { useEffect, useState } from 'react';
import api from '../../api';
import {
  UserPlus,
  Shield,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  Edit2,
  KeyRound,
  RefreshCw
} from 'lucide-react';


interface TeamMember {
  id: number;
  tenant_id: number;
  email: string;
  name?: string;
  role: string;
  status: string;
  profile_photo?: string;
  created_at?: string;
}

interface TenantTeamProps {
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
    tenant_id: number;
  };
}

export default function TenantTeam({ tenantContext, currentUser }: TenantTeamProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('underwriter');
  const [invitePassword, setInvitePassword] = useState('');
  const [showInvitePassword, setShowInvitePassword] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviting, setInviting] = useState(false);

  // Edit role modal state
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [newRole, setNewRole] = useState('');
  const [updatingRole, setUpdatingRole] = useState(false);

  // Edit details modal state
  const [editingDetailsMember, setEditingDetailsMember] = useState<TeamMember | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);
  const [editDetailsError, setEditDetailsError] = useState('');

  // Reset password modal state
  const [resetPasswordMember, setResetPasswordMember] = useState<TeamMember | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState('');

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/team/');
      setMembers(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviting(true);

    try {
      await api.post('/api/team/invite', {
        name: inviteName.trim() || undefined,
        email: inviteEmail.trim(),
        role: inviteRole,
        temporary_password: invitePassword
      });

      setShowInviteModal(false);
      setInviteName('');
      setInviteEmail('');
      setInvitePassword('');
      setInviteRole('underwriter');
      await fetchTeamMembers();
    } catch (err: any) {
      setInviteError(err.response?.data?.detail || 'Failed to invite team member');
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!editingMember) return;
    setUpdatingRole(true);
    try {
      await api.put(`/api/team/${editingMember.id}/role`, { role: newRole });
      setEditingMember(null);
      await fetchTeamMembers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update role');
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleToggleSuspend = async (member: TeamMember) => {
    const isSuspended = member.status === 'suspended';
    const action = isSuspended ? 'reactivate' : 'suspend';
    const confirmMsg = isSuspended
      ? `Reactivate account for ${member.email}?`
      : `Are you sure you want to suspend ${member.email}? They will not be able to log in.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.post(`/api/team/${member.id}/${action}`);
      await fetchTeamMembers();
    } catch (err: any) {
      alert(err.response?.data?.detail || `Failed to ${action} user`);
    }
  };

  const handleOpenEditDetails = (member: TeamMember) => {
    setEditingDetailsMember(member);
    setEditName(member.name || '');
    setEditEmail(member.email);
    setEditDetailsError('');
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDetailsMember) return;
    setSavingDetails(true);
    setEditDetailsError('');

    try {
      await api.put(`/api/team/${editingDetailsMember.id}/details`, {
        name: editName.trim() || undefined,
        email: editEmail.trim()
      });
      setEditingDetailsMember(null);
      await fetchTeamMembers();
    } catch (err: any) {
      setEditDetailsError(err.response?.data?.detail || 'Failed to update details');
    } finally {
      setSavingDetails(false);
    }
  };

  const handleOpenResetPassword = (member: TeamMember) => {
    setResetPasswordMember(member);
    // Standard template default: <name>_123456789
    const rawName = member.name || member.email.split('@')[0];
    const cleanName = rawName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'staff';
    setResetNewPassword(`${cleanName}_123456789`);
    setShowResetPassword(true);
    setResetPasswordError('');
    setResetPasswordSuccess('');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordMember) return;
    setResettingPassword(true);
    setResetPasswordError('');

    try {
      const res = await api.post(`/api/team/${resetPasswordMember.id}/reset-password`, {
        new_password: resetNewPassword
      });
      setResetPasswordSuccess(res.data.message);
      setTimeout(() => {
        setResetPasswordMember(null);
        setResetPasswordSuccess('');
      }, 3000);
    } catch (err: any) {
      setResetPasswordError(err.response?.data?.detail || 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'tenant_admin':
        return { background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' };
      case 'underwriter':
        return { background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' };
      case 'adjuster':
        return { background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' };
      case 'agent':
        return { background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' };
      case 'end_customer':
        return { background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', border: '1px solid rgba(236, 72, 153, 0.3)' };
      default:
        return { background: '#27272a', color: '#94a3b8', border: '1px solid #3f3f46' };
    }
  };

  const formatRole = (role: string) => {
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch =
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      (m.name && m.name.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = roleFilter === 'ALL' || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', margin: '0 0 6px 0' }}>Team & Staff Management</h1>
          <p style={{ margin: 0, color: '#94a3b8' }}>
            Manage staff roles, invite underwriters, claims adjusters, and agents for {tenantContext.name}.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setInviteError('');
            setShowInviteModal(true);
          }}
          style={{ width: 'auto', padding: '10px 18px' }}
        >
          <UserPlus size={18} /> Invite Staff Member
        </button>
      </div>

      {error && (
        <div className="error-alert" style={{ marginBottom: 20 }}>
          <AlertCircle size={18} /> <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: 14,
          marginBottom: 20,
          background: '#0f172a',
          border: '1px solid #1e293b',
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#64748b' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            style={{ paddingLeft: 36 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={16} style={{ color: '#64748b' }} />
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            style={{ width: 'auto', minWidth: 160 }}
          >
            <option value="ALL">All Roles ({members.length})</option>
            <option value="tenant_admin">Tenant Administrators</option>
            <option value="underwriter">Underwriters</option>
            <option value="adjuster">Claims Adjusters</option>
            <option value="agent">Insurance Agents</option>
            <option value="end_customer">Customers / Policyholders</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="card" style={{ padding: 0, background: '#0f172a', border: '1px solid #1e293b', overflow: 'hidden' }}>
        {loading ? (
          <div className="loading" style={{ padding: 40, textAlign: 'center' }}>
            Loading organization roster...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
            <Shield size={36} style={{ margin: '0 auto 12px auto', color: '#475569' }} />
            <h3 style={{ margin: '0 0 6px 0', color: '#e2e8f0' }}>No team members found</h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              {search || roleFilter !== 'ALL'
                ? 'Try adjusting your search filters.'
                : 'Click "Invite Staff Member" above to add your first underwriter or adjuster.'}
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e293b', background: '#182235', color: '#94a3b8' }}>
                <th style={{ padding: '14px 18px' }}>Staff Member</th>
                <th style={{ padding: '14px 18px' }}>Role</th>
                <th style={{ padding: '14px 18px' }}>Status</th>
                <th style={{ padding: '14px 18px' }}>Added Date</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map(m => {
                const isCurrentAdmin = m.id === currentUser.id;
                const isSuspended = m.status === 'suspended';
                const roleBadge = getRoleBadgeStyle(m.role);

                return (
                  <tr
                    key={m.id}
                    style={{
                      borderBottom: '1px solid #22262f',
                      background: isSuspended ? 'rgba(239, 68, 68, 0.03)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {m.profile_photo ? (
                          <img
                            src={m.profile_photo}
                            alt={m.name || m.email}
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '1px solid #3b82f6',
                              flexShrink: 0
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                              border: '1px solid #475569',
                              color: '#e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              flexShrink: 0
                            }}
                          >
                            {m.name
                              ? m.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                              : m.email.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {m.name || 'Staff User'}
                            {isCurrentAdmin && (
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  background: '#2e333d',
                                  color: '#94a3b8'
                                }}
                              >
                                You
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{m.email}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 999,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          ...roleBadge
                        }}
                      >
                        {formatRole(m.role)}
                      </span>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      {isSuspended ? (
                        <span style={{ color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}>
                          <XCircle size={14} /> Suspended
                        </span>
                      ) : (
                        <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}>
                          <CheckCircle2 size={14} /> Active
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '14px 18px', color: '#64748b', fontSize: '0.8rem' }}>
                      {m.created_at ? new Date(m.created_at).toLocaleDateString() : 'N/A'}
                    </td>

                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        <button
                          onClick={() => handleOpenEditDetails(m)}
                          className="btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          title="Edit Staff Details"
                        >
                          <Edit2 size={13} /> Edit
                        </button>

                        <button
                          onClick={() => {
                            setEditingMember(m);
                            setNewRole(m.role);
                          }}
                          className="btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          Role
                        </button>

                        <button
                          onClick={() => handleOpenResetPassword(m)}
                          className="btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          title="Reset Password"
                        >
                          <KeyRound size={13} /> Reset
                        </button>

                        <button
                          onClick={() => handleToggleSuspend(m)}
                          disabled={isCurrentAdmin}
                          style={{
                            padding: '6px 10px',
                            fontSize: '0.8rem',
                            borderRadius: 6,
                            border: '1px solid #3f3f46',
                            background: isSuspended ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isSuspended ? '#34d399' : '#f87171',
                            cursor: isCurrentAdmin ? 'not-allowed' : 'pointer',
                            opacity: isCurrentAdmin ? 0.4 : 1
                          }}
                          title={isCurrentAdmin ? 'Cannot suspend your own administrator account' : ''}
                        >
                          {isSuspended ? 'Reactivate' : 'Suspend'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
          }}
        >
          <div
            className="login-box"
            style={{
              maxWidth: 480,
              width: '100%',
              background: '#0f172a',
              border: '1px solid #1e293b',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserPlus size={22} style={{ color: '#3b82f6' }} />
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Invite Staff Member</h3>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {inviteError && (
              <div className="error-alert" style={{ marginBottom: 16 }}>
                <AlertCircle size={16} /> <span>{inviteError}</span>
              </div>
            )}

            <form onSubmit={handleInvite}>
              <div className="input-group">
                <label>Full Name (Optional)</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                />
              </div>

              <div className="input-group">
                <label>Staff Email Address *</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                />
              </div>

              <div className="input-group">
                <label>Assigned Role *</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                  required
                >
                  <option value="underwriter">Underwriter — Risk assessment & policy decisions</option>
                  <option value="adjuster">Claims Adjuster — Claims investigation & payouts</option>
                  <option value="agent">Insurance Agent — Customer quotes & applications</option>
                  <option value="end_customer">Customer / Policyholder — Customer Portal</option>
                  <option value="tenant_admin">Tenant Administrator — Operations & configuration</option>
                </select>
              </div>

              <div className="input-group">
                <label>Temporary Password * (Min 6 characters)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showInvitePassword ? 'text' : 'password'}
                    value={invitePassword}
                    onChange={e => setInvitePassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowInvitePassword(!showInvitePassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer'
                    }}
                    title={showInvitePassword ? 'Hide password' : 'Show password'}
                  >
                    {showInvitePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowInviteModal(false)}
                  style={{ flex: 1, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={inviting}
                  style={{ flex: 1 }}
                >
                  {inviting ? 'Inviting...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editingMember && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
          }}
        >
          <div
            className="login-box"
            style={{
              maxWidth: 440,
              width: '100%',
              background: '#0f172a',
              border: '1px solid #1e293b'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Update Staff Role</h3>
              <button
                onClick={() => setEditingMember(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 16 }}>
              Select a new role assignment for <strong>{editingMember.email}</strong>:
            </p>

            <div className="input-group">
              <label>Role</label>
              <select value={newRole} onChange={e => setNewRole(e.target.value)}>
                <option value="underwriter">Underwriter</option>
                <option value="adjuster">Claims Adjuster</option>
                <option value="agent">Insurance Agent</option>
                <option value="end_customer">Customer / Policyholder</option>
                <option value="tenant_admin">Tenant Administrator</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setEditingMember(null)}
                style={{ flex: 1, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleUpdateRole}
                disabled={updatingRole}
                style={{ flex: 1 }}
              >
                {updatingRole ? 'Updating...' : 'Save Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Details Modal */}
      {editingDetailsMember && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
          }}
        >
          <div
            className="login-box"
            style={{
              maxWidth: 440,
              width: '100%',
              background: '#0f172a',
              border: '1px solid #1e293b'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit2 size={20} style={{ color: '#3b82f6' }} />
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Edit Staff Details</h3>
              </div>
              <button
                onClick={() => setEditingDetailsMember(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {editDetailsError && (
              <div className="error-alert" style={{ marginBottom: 16 }}>
                <AlertCircle size={16} /> <span>{editDetailsError}</span>
              </div>
            )}

            <form onSubmit={handleSaveDetails}>
              <div className="input-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                />
              </div>

              <div className="input-group">
                <label>Staff Email Address *</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditingDetailsMember(null)}
                  style={{ flex: 1, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={savingDetails}
                  style={{ flex: 1 }}
                >
                  {savingDetails ? 'Saving...' : 'Save Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordMember && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
          }}
        >
          <div
            className="login-box"
            style={{
              maxWidth: 460,
              width: '100%',
              background: '#0f172a',
              border: '1px solid #1e293b'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <KeyRound size={20} style={{ color: '#f59e0b' }} />
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Reset Password</h3>
              </div>
              <button
                onClick={() => setResetPasswordMember(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 16 }}>
              Set new administrative login credentials for <strong>{resetPasswordMember.email}</strong>:
            </p>

            {resetPasswordSuccess && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid #10b981',
                  color: '#34d399',
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                  marginBottom: 16
                }}
              >
                {resetPasswordSuccess}
              </div>
            )}

            {resetPasswordError && (
              <div className="error-alert" style={{ marginBottom: 16 }}>
                <AlertCircle size={16} /> <span>{resetPasswordError}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword}>
              <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ margin: 0 }}>New Password * (Min 6 characters)</label>
                  <button
                    type="button"
                    onClick={() => {
                      const rawName = resetPasswordMember.name || resetPasswordMember.email.split('@')[0];
                      const cleanName = rawName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'staff';
                      setResetNewPassword(`${cleanName}_123456789`);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#60a5fa',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <RefreshCw size={11} /> Generate Template
                  </button>
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    value={resetNewPassword}
                    onChange={e => setResetNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer'
                    }}
                    title={showResetPassword ? 'Hide password' : 'Show password'}
                  >
                    {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setResetPasswordMember(null)}
                  style={{ flex: 1, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={resettingPassword}
                  style={{ flex: 1 }}
                >
                  {resettingPassword ? 'Resetting...' : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
