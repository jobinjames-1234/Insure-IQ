import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function B2BShell() {
  const { isAuthenticated, user } = useAuthStore();

  // Basic guard (will be expanded in auth phase)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Tenant portal guard
  if (user?.role !== 'tenant_admin' && user?.role !== 'underwriter' && user?.role !== 'agent') {
      return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="flex h-screen bg-[#F4F4F5]">
      {/* Sidebar Placeholder */}
      <aside className="w-64 bg-white border-r border-[#E7E7E9] flex flex-col">
        <div className="p-4 border-b border-[#E7E7E9]">
          <h1 className="text-lg font-semibold text-[#0A0A0A]">InsureIQ B2B</h1>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-2 text-sm text-[#5B5B60]">
            <li>Dashboard</li>
            <li>Policies</li>
            <li>Claims</li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar Placeholder */}
        <header className="h-16 bg-white border-b border-[#E7E7E9] flex items-center px-6 justify-between">
          <span className="text-sm text-[#5B5B60]">Welcome, {user.first_name}</span>
          <button onClick={() => useAuthStore.getState().logout()} className="text-sm text-[#1A56FF]">
            Logout
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
