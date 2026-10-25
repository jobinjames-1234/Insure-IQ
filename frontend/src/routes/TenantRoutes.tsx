import { Routes, Route, Navigate } from 'react-router-dom';

interface TenantRoutesProps {
  tenantContext: any;
}

export default function TenantRoutes({ tenantContext }: TenantRoutesProps) {
  return (
    <Routes>
      <Route
        path="/*"
        element={
          <div className="tenant-container" style={{ padding: 40 }}>
            <header style={{ marginBottom: 24, borderBottom: '1px solid #333', paddingBottom: 16 }}>
              <h1 style={{ margin: 0, fontSize: '1.75rem' }}>{tenantContext?.name} Workspace</h1>
              <p style={{ color: '#888', margin: '4px 0 0 0' }}>
                Plan: <span style={{ textTransform: 'uppercase' }}>{tenantContext?.plan_tier}</span> | Subdomain: {tenantContext?.subdomain}
              </p>
            </header>
            <div className="card" style={{ padding: 24, background: '#18181b', borderRadius: 8, border: '1px solid #27272a' }}>
              <h2>Tenant Portal</h2>
              <p>Welcome to the {tenantContext?.name} administration workspace.</p>
            </div>
          </div>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
