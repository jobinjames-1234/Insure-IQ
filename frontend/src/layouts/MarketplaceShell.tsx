import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function MarketplaceShell() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'insured') {
      return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Top Navbar for B2C */}
      <header className="h-16 bg-white border-b border-[#E7E7E9] flex items-center px-6 justify-between max-w-7xl mx-auto w-full">
        <h1 className="text-xl font-semibold text-[#0A0A0A]">InsureIQ Marketplace</h1>
        <nav className="flex gap-4 items-center text-sm text-[#5B5B60]">
          <span>My Policies</span>
          <span>Submit Claim</span>
          <button onClick={() => useAuthStore.getState().logout()} className="text-[#1A56FF]">Logout</button>
        </nav>
      </header>

      {/* Page Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6">
        <Outlet />
      </main>
    </div>
  );
}
