import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { Eye, EyeOff, Building2 } from 'lucide-react';

interface TenantLoginProps {
  tenantContext: {
    id: number;
    name: string;
    subdomain: string;
    plan_tier?: string;
    status: string;
  };
}

export default function TenantLogin({ tenantContext }: TenantLoginProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Please enter your staff or admin email address above first.');
      return;
    }

    setError('');
    setForgotSuccess('');
    setResetting(true);

    try {
      const res = await api.post('/api/auth/tenant-forgot-password', {
        email: email.trim(),
        tenant_id: tenantContext.id
      });

      // Autofill the password field and keep masked
      setPassword(res.data.temporary_password);
      setShowPassword(false);
      setForgotSuccess(res.data.message || 'Password has been reset and autofilled. You can now sign in.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reset password. Please check your email.');
    } finally {
      setResetting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setForgotSuccess('');
    setSubmitting(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', email.trim());
      formData.append('password', password);

      const res = await api.post('/api/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const token = res.data.access_token;
      localStorage.setItem('token', token);

      // Verify the authenticated user belongs to this tenant
      const meRes = await api.get('/api/auth/me');
      const currentUser = meRes.data;

      if (currentUser.tenant_id !== tenantContext.id) {
        localStorage.removeItem('token');
        setError(`Access denied. This account does not belong to ${tenantContext.name}.`);
        setSubmitting(false);
        return;
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              background: '#0284c718',
              border: '1px solid #0284c733',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}
          >
            <Building2 size={28} style={{ color: '#38bdf8' }} />
          </div>
          <h2>{tenantContext.name}</h2>
          <p style={{ marginTop: 4 }}>
            Tenant Workspace Portal ({tenantContext.subdomain})
          </p>
        </div>

        {error && <div className="error-alert">{error}</div>}

        {forgotSuccess && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              color: '#34d399',
              padding: '12px 14px',
              borderRadius: 8,
              fontSize: '0.85rem',
              marginBottom: 16,
              lineHeight: 1.4
            }}
          >
            {forgotSuccess}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Staff / Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@company.com"
              required
              autoFocus
            />
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label style={{ margin: 0 }}>Password</label>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetting}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#60a5fa',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                {resetting ? 'Resetting...' : 'Forgot Password?'}
              </button>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ flex: 1, paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={submitting}
            style={{ marginTop: 8 }}
          >
            {submitting ? 'Authenticating...' : 'Sign In to Workspace'}
          </button>
        </form>
      </div>
    </div>
  );
}
