import { Routes, Route, Navigate } from 'react-router-dom';
import SuperAdminLogin from '../superadmin/pages/SuperAdminLogin';
import SuperAdminDashboard from '../superadmin/pages/SuperAdminDashboard';

export default function SuperAdminRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<SuperAdminLogin />} />
      <Route path="/dashboard/*" element={<SuperAdminDashboard />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
