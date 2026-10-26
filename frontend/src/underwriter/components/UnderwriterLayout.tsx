import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Inbox,
  History,
  UserCircle,
  LogOut,
  ShieldCheck
} from 'lucide-react';

interface UnderwriterLayoutProps {
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

export default function UnderwriterLayout({ children, tenantContext, currentUser }: UnderwriterLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navItems = [
    { label: 'Underwriting Queue', path: '/underwriter/dashboard', icon: Inbox },
    { label: 'Decision History', path: '/underwriter/history', icon: History },
    { label: 'My Profile', path: '/underwriter/profile', icon: UserCircle },
  ];

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
            <div style={{ background: '#1e3a8a', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={22} style={{ color: '#60a5fa' }} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {tenantContext.name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: '0.65rem', background: '#1e293b', color: '#94a3b8', padding: '2px 6px', borderRadius: 4, fontWeight: 600, textTransform: 'uppercase' }}>
                  Underwriter Portal
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
            const isActive = location.pathname === item.path || (item.path === '/underwriter/dashboard' && location.pathname.startsWith('/underwriter/applications'));
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
                  background: isActive ? '#2563eb' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  marginBottom: 4,
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={18} style={{ color: isActive ? '#ffffff' : '#64748b' }} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Card & Logout Footer */}
        <div style={{ padding: '16px 14px', borderTop: '1px solid #1e293b', background: '#0b1329' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            {currentUser.profile_photo ? (
              <img
                src={currentUser.profile_photo}
                alt={currentUser.name || currentUser.email}
                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #3b82f6' }}
              />
            ) : (
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: '#1e3a8a',
                  color: '#93c5fd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}
              >
                {getInitials()}
              </div>
            )}
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {currentUser.name || 'Underwriter'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {currentUser.email}
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
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#f87171',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, overflowY: 'auto', background: '#090d16', padding: '32px 36px' }}>
        {children}
      </main>
    </div>
  );
}
