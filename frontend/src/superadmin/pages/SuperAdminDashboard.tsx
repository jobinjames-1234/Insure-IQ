import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import api from '../../api';
import ProvisionTenantWizard from '../components/ProvisionTenantWizard';
import ViewTenant from './ViewTenant';
import EditTenant from './EditTenant';
import Profile from './SuperAdminProfile';
import { LogOut, Plus, Server, Database, Eye, Edit2, Trash2, PlayCircle, User, Shield } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);

  useEffect(() => {
    fetchUser();
    fetchTenants();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await api.get('/api/auth/me');
      if (res.data.role !== 'super_admin') {
        localStorage.removeItem('token');
        navigate('/login');
      }
      setUser(res.data);
    } catch (err) {
      navigate('/login');
    }
  };

  const fetchTenants = async () => {
    try {
      const res = await api.get('/api/tenants');
      setTenants(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    }
    return user?.email ? user.email.slice(0, 2).toUpperCase() : 'SA';
  };

  if (!user) return <div className="loading" style={{ padding: 40, color: '#94a3b8' }}>Loading console...</div>;

  const isTenantsActive = location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/tenants') || location.pathname.startsWith('/dashboard/provision');
  const isProfileActive = location.pathname === '/dashboard/profile';

  return (
    <div className="dashboard-layout" style={{ minHeight: '100vh', display: 'flex', background: '#0b1329', color: '#f1f5f9' }}>
      <aside className="sidebar" style={{ width: 260, borderRight: '1px solid #1e293b', background: '#0f172a', display: 'flex', flexDirection: 'column' }}>
        <div className="brand" style={{ padding: '24px 20px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: '#0284c7', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={22} style={{ color: '#ffffff' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                InsureIQ
              </h2>
              <span style={{ fontSize: '0.65rem', background: '#0369a1', color: '#e0f2fe', padding: '2px 6px', borderRadius: 4, fontWeight: 600, textTransform: 'uppercase' }}>
                Console
              </span>
            </div>
          </div>
        </div>

        <nav style={{ padding: '16px 12px', flex: 1 }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, padding: '8px 12px', letterSpacing: '0.05em' }}>
            System Administration
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: '0.9rem',
              fontWeight: 600,
              color: '#ffffff',
              background: isTenantsActive ? '#0284c7' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              marginBottom: 4,
              textAlign: 'left',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              if (!isTenantsActive) e.currentTarget.style.background = '#1e293b';
            }}
            onMouseLeave={e => {
              if (!isTenantsActive) e.currentTarget.style.background = 'transparent';
            }}
          >
            <Database size={18} />
            <span>Tenants</span>
          </button>
          <button
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: '0.9rem',
              fontWeight: 500,
              color: '#94a3b8',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              marginBottom: 4,
              textAlign: 'left'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Server size={18} />
            <span>Platform Health</span>
          </button>
        </nav>

        <div className="sidebar-footer" style={{ padding: 16, borderTop: '1px solid #1e293b', background: '#0b1329' }}>
          <div
            onClick={() => navigate('/dashboard/profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 12,
              cursor: 'pointer',
              padding: '6px 8px',
              borderRadius: 8,
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            title="Manage profile"
          >
            {user.profile_photo ? (
              <img
                src={user.profile_photo}
                alt="Super Admin Avatar"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #0284c7',
                  flexShrink: 0
                }}
              />
            ) : (
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: '#0369a1',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  flexShrink: 0
                }}
              >
                {getInitials()}
              </div>
            )}
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user.name || user.email}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 500 }}>
                Super Admin
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              onClick={() => navigate('/dashboard/profile')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 6,
                background: isProfileActive ? '#0284c7' : '#1e293b',
                border: isProfileActive ? '1px solid #0284c7' : '1px solid #334155',
                color: '#f8fafc',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <User size={14} /> Profile Settings
            </button>
            <button
              onClick={logout}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 6,
                background: 'transparent',
                border: '1px solid #334155',
                color: '#f87171',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#ef4444';
                e.currentTarget.style.background = '#ef444415';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#334155';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={
            <div className="tenants-view">
              <header className="page-header">
                <h1>Tenant Directory</h1>
                <button className="btn-primary" onClick={() => navigate('/dashboard/provision')}>
                  <Plus size={16} /> Provision New Tenant
                </button>
              </header>

              {tenants.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🏢</div>
                  <h3>No tenants provisioned</h3>
                  <p>Get started by provisioning the first insurance tenant.</p>
                  <button className="btn-primary" onClick={() => navigate('/dashboard/provision')}>
                    Start Provisioning Wizard
                  </button>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Subdomain</th>
                      <th>Isolation</th>
                      <th>Plan Tier</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map(t => (
                      <tr key={t.id}>
                        <td>{t.id}</td>
                        <td>{t.name}</td>
                        <td><span className="mono">{t.subdomain}.localhost</span></td>
                        <td><span className={`tag tag-${t.isolation_mode}`}>{t.isolation_mode}</span></td>
                        <td>{t.plan_tier}</td>
                        <td>
                          <span className="tag" style={{backgroundColor: t.status === 'active' ? '#10b98122' : '#ef444422', color: t.status === 'active' ? '#10b981' : '#ef4444'}}>
                            {t.status || 'active'}
                          </span>
                        </td>
                        <td>
                          <div style={{display: 'flex', gap: 8}}>
                            <button className="btn-icon" onClick={() => navigate(`/dashboard/tenants/${t.id}`)} title="View"><Eye size={16} /></button>
                            <button className="btn-icon" onClick={() => navigate(`/dashboard/tenants/${t.id}/edit`)} title="Edit"><Edit2 size={16} /></button>
                            {t.status === 'active' || !t.status ? (
                              <button className="btn-icon" onClick={async () => {
                                if (window.confirm(`Deactivate tenant ${t.name}?`)) {
                                  await api.delete(`/api/tenants/${t.id}`);
                                  fetchTenants();
                                }
                              }} title="Deactivate"><Trash2 size={16} /></button>
                            ) : (
                              <button className="btn-icon" onClick={async () => {
                                if (window.confirm(`Reactivate tenant ${t.name}?`)) {
                                  await api.post(`/api/tenants/${t.id}/reactivate`);
                                  fetchTenants();
                                }
                              }} title="Reactivate"><PlayCircle size={16} /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          } />
          <Route path="/provision" element={<ProvisionTenantWizard onComplete={() => { fetchTenants(); navigate('/dashboard'); }} />} />
          <Route path="/tenants/:id" element={<ViewTenant />} />
          <Route path="/tenants/:id/edit" element={<EditTenant />} />
          <Route path="/profile" element={<Profile user={user} fetchUser={fetchUser} />} />
        </Routes>
      </main>
    </div>
  );
}
