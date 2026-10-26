import React, { useState, useEffect } from 'react';
import api from '../../api';
import {
  User,
  Shield,
  KeyRound,
  Camera,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Server,
  Building2,
  CheckCircle
} from 'lucide-react';

interface SuperAdminProfileProps {
  user: {
    id: number;
    email: string;
    name?: string;
    role: string;
    tenant_id?: number | null;
    profile_photo?: string | null;
    status?: string;
    created_at?: string;
  };
  fetchUser: () => void;
}

export default function SuperAdminProfile({ user, fetchUser }: SuperAdminProfileProps) {
  // Profile details state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(user?.profile_photo || null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setProfilePhoto(user.profile_photo || null);
    }
  }, [user]);

  // Handle Photo File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setProfileError('Photo size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePhoto(reader.result as string);
      setProfileError('');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProfilePhoto(null);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    setSavingProfile(true);

    try {
      const res = await api.put('/api/auth/me', {
        name: name.trim() || null,
        email: email.trim(),
        profile_photo: profilePhoto
      });

      if (res.data.access_token) {
        localStorage.setItem('token', res.data.access_token);
      }

      setProfileSuccess('Super Administrator profile details and avatar updated successfully!');
      fetchUser();
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err: any) {
      setProfileError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }

    setUpdatingPassword(true);

    try {
      await api.put('/api/auth/me/password', {
        current_password: currentPassword,
        new_password: newPassword
      });

      setPasswordSuccess('Password updated successfully! Next time you sign in, use your new password.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 5000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.detail || 'Failed to update password. Check your current password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const getInitials = () => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  if (!user) return <div className="loading" style={{ padding: 40, color: '#94a3b8' }}>Loading profile...</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 6px 0' }}>Profile & Account Management</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
            Manage your Super Administrator profile, avatar, credentials, and platform authority settings.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        {/* Personal Details Card */}
        <div
          className="card"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 28
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <User size={20} style={{ color: '#0284c7' }} />
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Root Identity & Avatar</h2>
          </div>

          {profileSuccess && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid #10b981',
                color: '#34d399',
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
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="error-alert" style={{ marginBottom: 20 }}>
              <AlertCircle size={18} />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile}>
            {/* Avatar Section */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                padding: '16px 20px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 10,
                border: '1px solid var(--border)',
                marginBottom: 24
              }}
            >
              <div style={{ position: 'relative' }}>
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt="Profile Avatar"
                    style={{
                      width: 88,
                      height: 88,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #0284c7'
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 88,
                      height: 88,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.8rem',
                      fontWeight: 700,
                      border: '2px solid #0284c7'
                    }}
                  >
                    {getInitials()}
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>Root Profile Photo</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                  Upload a headshot to represent your Super Administrator account across the console (PNG or JPG, max 2MB).
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <label
                    className="btn-secondary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: '0.85rem',
                      padding: '8px 14px',
                      cursor: 'pointer',
                      margin: 0
                    }}
                  >
                    <Camera size={16} /> Choose Photo
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handlePhotoUpload}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {profilePhoto && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#f87171',
                        borderRadius: 6,
                        padding: '8px 14px',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Trash2 size={16} /> Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              <div className="input-group">
                <label>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Master Administrator"
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Platform & Authority Readonly Metadata */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16,
                marginTop: 8,
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.01)',
                borderRadius: 8,
                border: '1px solid var(--border)'
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Assigned Role</div>
                <div style={{ fontWeight: 600, color: '#38bdf8', fontSize: '0.9rem', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Shield size={14} /> Super Administrator
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Console Authority Scope</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Server size={14} /> Platform-Wide / All Tenants
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Multi-Tenancy Mode</div>
                <div style={{ fontWeight: 600, color: '#34d399', fontSize: '0.9rem', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Building2 size={14} /> Master Orchestrator
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Clearance Status</div>
                <div style={{ fontWeight: 600, color: '#10b981', fontSize: '0.9rem', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={14} /> Root System Operator
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={savingProfile}
                style={{ width: 'auto', padding: '10px 24px' }}
              >
                {savingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Password Security Card */}
        <div
          className="card"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 28
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <KeyRound size={20} style={{ color: '#f59e0b' }} />
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Password & Security Credentials</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 20px 0' }}>
            Ensure your root administrative account uses a secure password. If you recently used "Forgot Password", set your permanent password here.
          </p>

          {passwordSuccess && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid #10b981',
                color: '#34d399',
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
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="error-alert" style={{ marginBottom: 20 }}>
              <AlertCircle size={18} />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePassword}>
            <div className="input-group">
              <label>Current Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }}
                  title={showCurrentPassword ? 'Hide password' : 'Show password'}
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div className="input-group">
                <label>New Password (Min 6 characters)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer'
                    }}
                    title={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label>Confirm New Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer'
                    }}
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={updatingPassword}
                style={{ width: 'auto', padding: '10px 24px' }}
              >
                {updatingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
