import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  FileText,
  CreditCard,
  LogOut,
  Building2,
  CheckCircle2,
  UserCircle
} from 'lucide-react';

interface TenantLayoutProps {
  children: ReactNode;
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
    name?: string;
    role: string;
    tenant_id: number;
    profile_photo?: string;
  };
}

export default function TenantLayout({ children, tenantContext, currentUser }: TenantLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Team & Staff', path: '/team', icon: Users },
    { label: 'Policy Settings', path: '/policies', icon: FileText },
    { label: 'Audit Log', path: '/audit', icon: ShieldAlert },
    { label: 'Billing & Invoices', path: '/billing', icon: CreditCard },
    { label: 'My Profile', path: '/profile', icon: UserCircle },
  ];

  const formatRole = (role: string) => {
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getInitials = () => {
    if (currentUser.name) {
      return currentUser.name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    }
    return currentUser.email.slice(0, 2).toUpperCase();
  };

  return (
    <div className="dashboard-layout" style={{ minHeight: '100vh', display: 'flex', background: '#0b1329', color: '#f1f5f9' }}>
      <aside className="sidebar" style={{ width: 260, borderRight: '1px solid #1e293b', background: '#0f172a', display: 'flex', flexDirection: 'column' }}>
        {/* Brand header */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: '#0284c7', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={22} style={{ color: '#ffffff' }} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {tenantContext.name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: '0.65rem', background: '#0369a1', color: '#e0f2fe', padding: '2px 6px', borderRadius: 4, fontWeight: 600, textTransform: 'uppercase' }}>
                  Tenant Admin Portal
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    fontSize: '0.68rem',
                    color: '#10b981',
                    fontWeight: 600
                  }}
                >
                  <CheckCircle2 size={10} /> Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, padding: '8px 12px', letterSpacing: '0.05em' }}>
            Workflows
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#ffffff' : '#94a3b8',
                  background: isActive ? '#0284c7' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  marginBottom: 4,
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.background = '#1e293b';
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <Icon size={18} style={{ color: isActive ? '#ffffff' : '#64748b' }} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User profile & session */}
        <div style={{ padding: 16, borderTop: '1px solid #1e293b', background: '#0b1329' }}>
          <div
            onClick={() => navigate('/profile')}
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
            title="Click to manage profile"
          >
            {currentUser.profile_photo ? (
              <img
                src={currentUser.profile_photo}
                alt="Profile"
                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #0284c7', flexShrink: 0 }}
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
                {currentUser.name || currentUser.email}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {formatRole(currentUser.role)}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
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
              color: '#94a3b8',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#ef4444';
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.background = '#ef444415';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#334155';
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
