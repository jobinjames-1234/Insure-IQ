import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import api from '../../api';
import ProvisionTenantWizard from '../components/ProvisionTenantWizard';
import ViewTenant from './ViewTenant';
import EditTenant from './EditTenant';
import Profile from './SuperAdminProfile';
import { LogOut, Plus, Server, Database, Eye, Edit2, Trash2, PlayCircle, User } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
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

  if (!user) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="brand">
          <h2>InsureIQ <span className="badge">CONSOLE</span></h2>
        </div>
        <nav>
          <a className="nav-item active" onClick={() => navigate('/dashboard')}><Database size={18} /> Tenants</a>
          <a className="nav-item"><Server size={18} /> Platform Health</a>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info" style={{marginBottom: 12}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 6, color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4}}>
              <User size={12}/> Super Admin
            </div>
            <div style={{overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500, fontSize: '0.875rem'}}>{user.email}</div>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
            <button onClick={() => navigate('/dashboard/profile')} className="btn-icon" style={{width: '100%', justifyContent: 'flex-start', padding: '8px 12px', borderRadius: 6}}><User size={16} /> Profile</button>
            <button onClick={logout} className="btn-icon" style={{width: '100%', justifyContent: 'flex-start', padding: '8px 12px', borderRadius: 6, color: '#ef4444'}}><LogOut size={16} /> Logout</button>
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
