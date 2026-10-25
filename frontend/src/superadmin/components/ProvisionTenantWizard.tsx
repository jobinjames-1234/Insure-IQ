import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';

export default function ProvisionTenantWizard({ onComplete }: { onComplete: () => void }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    isolation_mode: 'shared',
    plan_tier: 'standard',
    admin_email: '',
    admin_password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [subdomainState, setSubdomainState] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error'>('idle');
  const checkTimeout = useRef<any>(null);

  const updateForm = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const checkSubdomain = async (subdomain: string) => {
    if (!subdomain) {
      setSubdomainState('invalid');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      setSubdomainState('invalid');
      return;
    }

    setSubdomainState('checking');
    try {
      const res = await api.get(`/api/tenants/check-subdomain?subdomain=${subdomain}`);
      if (res.data.available) {
        setSubdomainState('available');
      } else {
        setSubdomainState('taken');
      }
    } catch (err) {
      setSubdomainState('error');
    }
  };

  const handleSubdomainChange = (val: string) => {
    updateForm('subdomain', val);
    
    if (checkTimeout.current) clearTimeout(checkTimeout.current);
    checkTimeout.current = setTimeout(() => {
      checkSubdomain(val);
    }, 500);
  };

  const submit = async () => {
    if (subdomainState !== 'available') return;
    setLoading(true);
    setError('');
    try {
      await api.post('/api/tenants/', formData);
      onComplete();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to provision tenant');
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Provision New Tenant</h1>
        <button className="btn-secondary" onClick={() => navigate('/dashboard')}>Cancel</button>
      </div>

      <div className="wizard-container">
        <div className="wizard-header">
          {[1, 2, 3, 4].map(num => (
            <div key={num} className={`wizard-step-tab ${step === num ? 'active' : ''}`}>
              Step {num}
            </div>
          ))}
        </div>

        <div className="wizard-body">
          {error && <div className="error-alert">{error}</div>}

          {step === 1 && (
            <div>
              <h3>Tenant Identity</h3>
              <p className="text-secondary" style={{marginBottom: 20}}>Set the tenant name and subdomain.</p>
              <div className="input-group">
                <label>Company Name</label>
                <input value={formData.name} onChange={e => updateForm('name', e.target.value)} placeholder="e.g. Acme Insurance" />
              </div>
              <div className="input-group">
                <label>Subdomain</label>
                <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                  <input value={formData.subdomain} onChange={e => handleSubdomainChange(e.target.value)} placeholder="acme" style={{flex: 1}} />
                  <span className="text-secondary">.localhost</span>
                </div>
                <div style={{marginTop: 8, fontSize: '0.875rem'}}>
                  {subdomainState === 'checking' && <span style={{color: '#888'}}>Checking...</span>}
                  {subdomainState === 'available' && <span style={{color: '#10b981', display: 'flex', alignItems: 'center', gap: 4}}><CheckCircle size={14}/> Available</span>}
                  {subdomainState === 'taken' && <span style={{color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4}}><XCircle size={14}/> Already taken</span>}
                  {subdomainState === 'invalid' && <span style={{color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4}}><XCircle size={14}/> Invalid subdomain</span>}
                  {subdomainState === 'error' && <span style={{color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4}}>⚠ Unable to check availability</span>}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3>Plan & Isolation</h3>
              <p className="text-secondary" style={{marginBottom: 20}}>Configure the technical isolation and billing tier.</p>
              <div className="input-group">
                <label>Isolation Mode</label>
                <select value={formData.isolation_mode} onChange={e => updateForm('isolation_mode', e.target.value)}>
                  <option value="shared">Shared Schema (Standard)</option>
                  <option value="dedicated">Dedicated Schema (Enterprise)</option>
                </select>
              </div>
              <div className="input-group">
                <label>Plan Tier</label>
                <select value={formData.plan_tier} onChange={e => updateForm('plan_tier', e.target.value)}>
                  <option value="standard">Standard (No AI features)</option>
                  <option value="pro">Pro (Risk & Fraud AI)</option>
                  <option value="enterprise">Enterprise (Full Suite)</option>
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3>Initial Admin Account</h3>
              <p className="text-secondary" style={{marginBottom: 20}}>This account will be given to the tenant to configure their system.</p>
              <div className="input-group">
                <label>Admin Email</label>
                <input type="email" value={formData.admin_email} onChange={e => updateForm('admin_email', e.target.value)} placeholder="admin@acme.com" />
              </div>
              <div className="input-group">
                <label>Temporary Password</label>
                <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={formData.admin_password} 
                    onChange={e => updateForm('admin_password', e.target.value)} 
                    style={{flex: 1, paddingRight: 40}}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', 
                      right: 12, 
                      background: 'none', 
                      border: 'none', 
                      color: '#888',
                      cursor: 'pointer'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h3>Review & Provision</h3>
              <p className="text-secondary" style={{marginBottom: 20}}>Please review the details before provisioning the new tenant space.</p>
              
              <div className="summary-box">
                <div className="summary-item">
                  <span className="summary-label">Name</span>
                  <span className="summary-value">{formData.name}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Subdomain</span>
                  <span className="summary-value">{formData.subdomain}.localhost</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Isolation Mode</span>
                  <span className="summary-value">{formData.isolation_mode}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Plan Tier</span>
                  <span className="summary-value">{formData.plan_tier}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Admin Email</span>
                  <span className="summary-value">{formData.admin_email}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="wizard-footer">
          <button className="btn-secondary" onClick={() => setStep(step - 1)} disabled={step === 1}>Back</button>
          
          {step < 4 ? (
            <button 
              className="btn-primary" 
              style={{width: 'auto', padding: '10px 24px'}} 
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && subdomainState !== 'available'}
            >
              Next Step
            </button>
          ) : (
            <button 
              className="btn-primary" 
              style={{width: 'auto', padding: '10px 24px'}} 
              onClick={submit} 
              disabled={loading || subdomainState !== 'available'}
            >
              {loading ? 'Provisioning...' : <><CheckCircle size={16} /> Provision Tenant</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
