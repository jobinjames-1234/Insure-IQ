import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { Eye, EyeOff, Shield, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Please enter your Super-Admin email address above first.');
      return;
    }

    setError('');
    setForgotSuccess('');
    setResetting(true);

    try {
      const res = await api.post('/api/auth/superadmin-forgot-password', {
        email: email.trim()
      });

      setPassword(res.data.temporary_password);
      setShowPassword(false);
      setForgotSuccess(res.data.message || 'Password has been temporarily reset and autofilled. You can now authenticate.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reset password. Verify your Super-Admin email address.');
    } finally {
      setResetting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setForgotSuccess('');
    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('username', email.trim());
      formData.append('password', password);
      
      const res = await api.post('/api/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      localStorage.setItem('token', res.data.access_token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-container"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0b1329',
        padding: 20
      }}
    >
      <div
        className="login-box"
        style={{
          background: '#0f172a',
          padding: 36,
          borderRadius: 14,
          width: '100%',
          maxWidth: 420,
          border: '1px solid #1e293b',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
        }}
      >
        <div className="login-header" style={{ textAlign: 'center', marginBottom: 28 }}>
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
            <Shield size={28} style={{ color: '#38bdf8' }} />
          </div>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc' }}>
            Platform Console
          </h2>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
            InsureIQ Super-Admin Control Gateway
          </p>
        </div>
        
        {error && (
          <div
            className="error-alert"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: '#ef444415',
              border: '1px solid #ef4444',
              color: '#f87171',
              padding: '10px 14px',
              borderRadius: 8,
              marginBottom: 20,
              fontSize: '0.82rem'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {forgotSuccess && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              background: '#10b98115',
              border: '1px solid #10b981',
              color: '#34d399',
              padding: '12px 14px',
              borderRadius: 8,
              marginBottom: 20,
              fontSize: '0.82rem',
              lineHeight: 1.4
            }}
          >
            <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>{forgotSuccess}</div>
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <div className="input-group" style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: '0.82rem', color: '#94a3b8', fontWeight: 500 }}>
              Email Address
            </label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              placeholder="superadmin@insureiq.com"
              required 
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 8,
                color: '#f8fafc',
                fontSize: '0.875rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          <div className="input-group" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 500 }}>
                Password
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetting}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: resetting ? 'not-allowed' : 'pointer',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <KeyRound size={12} />
                {resetting ? 'Resetting...' : 'Forgot password?'}
              </button>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required 
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 14px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 8,
                  color: '#f8fafc',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', 
                  right: 12, 
                  background: 'none', 
                  border: 'none', 
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: 4
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '11px',
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s ease'
            }}
          >
            {loading ? 'Authenticating...' : 'Authenticate'}
          </button>
        </form>
      </div>
    </div>
  );
}

