import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Inbox,
  ShieldAlert,
  Clock,
  UserCircle,
  LogOut,
  FileCheck
} from 'lucide-react';
import api from '../../api';

interface AdjusterLayoutProps {
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

export default function AdjusterLayout({
  children,
  tenantContext,
  currentUser,
}: AdjusterLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [badgeStats, setBadgeStats] = useState({ sla_at_risk: 0, fraud_flagged: 0 });

  useEffect(() => {
    api.get('/api/claims/stats')
      .then(res => {
        if (res.data) {
          setBadgeStats({
            sla_at_risk: res.data.sla_at_risk,
            fraud_flagged: res.data.fraud_flagged
          });
        }
      })
      .catch(() => {});
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navItems = [
    {
      label: 'Claims Queue',
      path: '/adjuster/dashboard',
      icon: Inbox,
      badge: badgeStats.fraud_flagged > 0 ? badgeStats.fraud_flagged : undefined,
      badgeColor: '#ef4444'
    },
    {
      label: 'Investigations',
      path: '/adjuster/investigations',
      icon: ShieldAlert,
    },
    {
      label: 'SLA Tracker',
      path: '/adjuster/sla-tracker',
      icon: Clock,
      badge: badgeStats.sla_at_risk > 0 ? badgeStats.sla_at_risk : undefined,
      badgeColor: '#f59e0b'
    },
    {
      label: 'My Profile',
      path: '/adjuster/profile',
      icon: UserCircle
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

  return (
    <div className="dashboard-layout" style={{ minHeight: '100vh', display: 'flex', background: '#0b1329', color: '#f1f5f9' }}>
      <aside className="sidebar" style={{ width: 260, borderRight: '1px solid #1e293b', background: '#0f172a', display: 'flex', flexDirection: 'column' }}>
        {/* Brand header */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: '#0284c7', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileCheck size={22} style={{ color: '#ffffff' }} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {tenantContext.name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: '0.65rem', background: '#0369a1', color: '#e0f2fe', padding: '2px 6px', borderRadius: 4, fontWeight: 600, textTransform: 'uppercase' }}>
                  Claims Adjuster Portal
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
              (item.path === '/adjuster/dashboard' && location.pathname.startsWith('/adjuster/claims')) ||
              (item.path === '/adjuster/investigations' && location.pathname.startsWith('/adjuster/investigations/'));
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
                {item.badge !== undefined && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      background: item.badgeColor,
                      color: '#ffffff',
                      padding: '2px 7px',
                      borderRadius: 10,
                      fontWeight: 700,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
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
                Claims Adjuster
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
