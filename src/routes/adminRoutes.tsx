import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminDashboard }   from '@/pages/admin/AdminDashboard';
import { AdminSchoolsPage } from '@/pages/admin/AdminSchoolsPage';
import { AdminBatchesPage } from '@/pages/admin/AdminBatchesPage';
import { AdminRevenuePage } from '@/pages/admin/AdminRevenuePage';
import { AdminPayoutsPage } from '@/pages/admin/AdminPayoutsPage';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/"                element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/schools"   element={<AdminSchoolsPage />} />
      <Route path="/admin/batches"   element={<AdminBatchesPage />} />
      <Route path="/admin/revenue"   element={<AdminRevenuePage />} />
      <Route path="/admin/payouts"   element={<AdminPayoutsPage />} />
      <Route path="*"                element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
}
