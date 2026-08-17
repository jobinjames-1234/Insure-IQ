import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function SuperAdminShell() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'superadmin') {
      return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="flex h-screen bg-[#0B0C0E]"> {/* Dark mode vibe for superadmin */}
      <aside className="w-64 bg-[#17181B] border-r border-[#2A2B2F] flex flex-col">
        <div className="p-4 border-b border-[#2A2B2F]">
          <h1 className="text-lg font-semibold text-[#F5F5F6]">Platform Admin</h1>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-2 text-sm text-[#A1A1A6]">
            <li>Tenants</li>
            <li>System Logs</li>
            <li>Global Config</li>
          </ul>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-[#17181B] border-b border-[#2A2B2F] flex items-center px-6 justify-between">
            <span className="text-sm text-[#A1A1A6]">SuperAdmin</span>
            <button onClick={() => useAuthStore.getState().logout()} className="text-sm text-[#F5F5F6]">Logout</button>
        </header>
        <main className="flex-1 overflow-auto p-6 bg-[#0B0C0E] text-[#F5F5F6]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
