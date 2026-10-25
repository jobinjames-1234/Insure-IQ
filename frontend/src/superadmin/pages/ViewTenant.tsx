import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import { ArrowLeft } from 'lucide-react';

export default function ViewTenant() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenant();
  }, [id]);

  const fetchTenant = async () => {
    try {
      const res = await api.get(`/api/tenants/${id}`);
      setTenant(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!tenant) return <div>Tenant not found</div>;

  return (
    <div style={{maxWidth: 800, margin: '0 auto'}}>
      <div className="page-header" style={{display: 'flex', gap: 16, alignItems: 'center'}}>
        <button className="btn-icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={20} />
        </button>
        <h1>{tenant.name}</h1>
      </div>

      <div className="card" style={{padding: 24, display: 'flex', flexDirection: 'column', gap: 16}}>
        <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: 16}}>
          <span className="text-secondary">Tenant ID</span>
          <span style={{color: '#fff'}}>{tenant.id}</span>
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: 16}}>
          <span className="text-secondary">Company Name</span>
          <span style={{color: '#fff'}}>{tenant.name}</span>
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: 16}}>
          <span className="text-secondary">Subdomain</span>
          <span style={{color: '#fff'}}>{tenant.subdomain}</span>
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: 16}}>
          <span className="text-secondary">Local Domain</span>
          <span style={{color: '#fff'}}>{tenant.subdomain}.localhost</span>
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: 16}}>
          <span className="text-secondary">Isolation Mode</span>
          <span style={{color: '#fff'}}>{tenant.isolation_mode}</span>
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: 16}}>
          <span className="text-secondary">Plan Tier</span>
          <span style={{color: '#fff'}}>{tenant.plan_tier}</span>
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: 16}}>
          <span className="text-secondary">Status</span>
          <span style={{
            color: tenant.status === 'active' ? '#10b981' : '#ef4444'
          }}>{tenant.status}</span>
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: 16}}>
          <span className="text-secondary">Created At</span>
          <span style={{color: '#fff'}}>{new Date(tenant.created_at).toLocaleString()}</span>
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between'}}>
          <span className="text-secondary">Last Updated</span>
          <span style={{color: '#fff'}}>{new Date(tenant.updated_at).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
