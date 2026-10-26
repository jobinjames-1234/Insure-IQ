import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  AlertCircle,
  DollarSign,
  UserCircle,
  LogOut,
  Briefcase,
  FilePlus,
  FileText
} from 'lucide-react';
import api from '../../api';

interface AgentLayoutProps {
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

export default function AgentLayout({
  children,
  tenantContext,
  currentUser,
}: AgentLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sessionVerified, setSessionVerified] = useState(false);

  useEffect(() => {
    api.get('/api/agents/me/session')
      .then(() => {
        setSessionVerified(true);
      })
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/login');
      });
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await api.post('/api/agents/me/logout');
    } catch (err) {
      // Even if network or backend fails, token must still be purged
    } finally {
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  const navItems = [
    {
      label: 'Dashboard',
      path: '/agent/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'My customers',
      path: '/agent/customers',
      icon: Users,
    },
    {
      label: 'Retention alerts',
      path: '/agent/retention-alerts',
      icon: AlertCircle,
    },
    {
      label: 'Applications',
      path: '/agent/applications',
      icon: FileText,
    },
    {
      label: 'New application',
      path: '/agent/applications/new',
      icon: FilePlus,
    },
    {
      label: 'Commission',
      path: '/agent/commission',
      icon: DollarSign,
    },
    {
      label: 'My Profile',
      path: '/agent/profile',
      icon: UserCircle,
    },
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

  if (!sessionVerified) {
    return (
      <div style={{ minHeight: '100vh', background: '#0b1329', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
        Verifying agent workspace session...
      </div>
    );
  }

  return (
    <div className="dashboard-layout" style={{ minHeight: '100vh', display: 'flex', background: '#0b1329', color: '#f1f5f9' }}>
      <aside className="sidebar" style={{ width: 260, borderRight: '1px solid #1e293b', background: '#0f172a', display: 'flex', flexDirection: 'column' }}>
        {/* Brand header */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: '#0284c7', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase size={22} style={{ color: '#ffffff' }} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {tenantContext.name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: '0.65rem', background: '#0369a1', color: '#e0f2fe', padding: '2px 6px', borderRadius: 4, fontWeight: 600, textTransform: 'uppercase' }}>
                  Insurance Agent Portal
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
            const isActive = location.pathname === item.path ||
              (item.path === '/agent/customers' && location.pathname.startsWith('/agent/customers/'));
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Icon size={18} style={{ color: isActive ? '#ffffff' : '#64748b' }} />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* User profile & session */}
        <div style={{ padding: 16, borderTop: '1px solid #1e293b', background: '#0b1329' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            {currentUser.profile_photo ? (
              <img
                src={currentUser.profile_photo}
                alt="Profile"
                style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '2px solid #0284c7' }}
              />
            ) : (
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: '#0369a1',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                }}
              >
                {getInitials()}
              </div>
            )}
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {currentUser.name || currentUser.email.split('@')[0]}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                Licensed Agent
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
              color: '#94a3b8',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 500,
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#ef444420';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#1e293b';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content body */}
      <main style={{ flex: 1, overflowY: 'auto', background: '#0b1329' }}>
        {children}
      </main>
    </div>
  );
}
