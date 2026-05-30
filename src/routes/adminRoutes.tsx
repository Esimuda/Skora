import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

// Simple placeholder pages until you build the full admin pages
const AdminDashboard = () => (
  <DashboardLayout>
    <div className="max-w-4xl mx-auto">
      <h2 className="font-headline font-extrabold text-2xl text-primary mb-4">Admin Dashboard</h2>
      <p className="text-on-surface-variant">Platform overview coming soon.</p>
    </div>
  </DashboardLayout>
);

const AdminBatchesPage = () => (
  <DashboardLayout>
    <div className="max-w-4xl mx-auto">
      <h2 className="font-headline font-extrabold text-2xl text-primary mb-4">Scratch Card Batches</h2>
      <p className="text-on-surface-variant">Batch management coming soon.</p>
    </div>
  </DashboardLayout>
);

const AdminSchoolsPage = () => (
  <DashboardLayout>
    <div className="max-w-4xl mx-auto">
      <h2 className="font-headline font-extrabold text-2xl text-primary mb-4">Schools</h2>
      <p className="text-on-surface-variant">Schools management coming soon.</p>
    </div>
  </DashboardLayout>
);

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/dashboard" />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/batches" element={<AdminBatchesPage />} />
      <Route path="/admin/schools" element={<AdminSchoolsPage />} />
      <Route path="*" element={<Navigate to="/admin/dashboard" />} />
    </Routes>
  );
}