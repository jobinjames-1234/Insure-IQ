import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

export default function EditTenant() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    isolation_mode: 'shared',
    plan_tier: 'standard',
    status: 'active'
  });

  const [subdomainState, setSubdomainState] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error'>('idle');
  const checkTimeout = useRef<any>(null);

  useEffect(() => {
    fetchTenant();
  }, [id]);

  const fetchTenant = async () => {
    try {
      const res = await api.get(`/api/tenants/${id}`);
      setFormData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load tenant.');
    } finally {
      setLoading(false);
    }
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
      const res = await api.get(`/api/tenants/check-subdomain?subdomain=${subdomain}&exclude_tenant_id=${id}`);
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
    setFormData(prev => ({ ...prev, subdomain: val }));
    
    if (checkTimeout.current) clearTimeout(checkTimeout.current);
    checkTimeout.current = setTimeout(() => {
      checkSubdomain(val);
    }, 500);
  };

  const submit = async () => {
    if (subdomainState === 'taken' || subdomainState === 'invalid') return;
    setSaving(true);
    setError('');
    try {
      await api.put(`/api/tenants/${id}`, formData);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update tenant');
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{maxWidth: 600, margin: '0 auto'}}>
      <div className="page-header" style={{display: 'flex', gap: 16, alignItems: 'center'}}>
        <button className="btn-icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={20} />
        </button>
        <h1>Edit Tenant</h1>
      </div>

      <div className="card" style={{padding: 24}}>
        {error && <div className="error-alert">{error}</div>}
        
        <div className="input-group">
          <label>Company Name</label>
          <input 
            value={formData.name} 
            onChange={e => setFormData(p => ({...p, name: e.target.value}))} 
          />
        </div>

        <div className="input-group">
          <label>Subdomain</label>
          <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
            <input 
              value={formData.subdomain} 
              onChange={e => handleSubdomainChange(e.target.value)} 
              style={{flex: 1}} 
            />
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

        <div className="input-group">
          <label>Isolation Mode</label>
          <select value={formData.isolation_mode} onChange={e => setFormData(p => ({...p, isolation_mode: e.target.value}))}>
            <option value="shared">Shared Schema (Standard)</option>
            <option value="dedicated">Dedicated Schema (Enterprise)</option>
          </select>
        </div>

        <div className="input-group">
          <label>Plan Tier</label>
          <select value={formData.plan_tier} onChange={e => setFormData(p => ({...p, plan_tier: e.target.value}))}>
            <option value="standard">Standard</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>

        <div className="input-group">
          <label>Status</label>
          <select value={formData.status} onChange={e => setFormData(p => ({...p, status: e.target.value}))}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div style={{marginTop: 24, display: 'flex', justifyContent: 'flex-end'}}>
          <button 
            className="btn-primary" 
            onClick={submit} 
            disabled={saving || subdomainState === 'taken' || subdomainState === 'invalid'}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
