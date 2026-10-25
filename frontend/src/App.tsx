import { BrowserRouter } from 'react-router-dom';
import { useEffect, useState } from 'react';
import SuperAdminRoutes from './routes/SuperAdminRoutes';
import TenantRoutes from './routes/TenantRoutes';
import api from './api';

function App() {
  const hostname = window.location.hostname;
  const isConsole = hostname.startsWith('console');
  const [tenantContext, setTenantContext] = useState<any>(null);
  const [loading, setLoading] = useState(!isConsole);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isConsole) {
      // Extract subdomain (e.g., abc from abc.jobinjames.in or abc.localhost)
      const subdomain = hostname.split('.')[0];
      api.get('/api/tenants/by-subdomain/' + subdomain)
        .then(res => {
          setTenantContext(res.data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.response?.status === 404 ? 'Tenant not found' : 'Unable to verify tenant');
          setLoading(false);
        });
    }
  }, [isConsole, hostname]);

  // Tenant / Customer Portal routing
  if (!isConsole) {
    if (loading) return <div className="loading" style={{ padding: 40 }}>Loading tenant environment...</div>;

    if (error) return <div className="error-state" style={{ padding: 40, textAlign: 'center' }}><h1>{error}</h1></div>;

    if (tenantContext?.status === 'inactive') {
      return (
        <div className="error-state" style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>
          <h1>Access Blocked</h1>
          <p>This tenant environment is currently inactive.</p>
        </div>
      );
    }

    return (
      <BrowserRouter>
        <TenantRoutes tenantContext={tenantContext} />
      </BrowserRouter>
    );
  }

  // Super Admin Console routing
  return (
    <BrowserRouter>
      <SuperAdminRoutes />
    </BrowserRouter>
  );
}

export default App;
