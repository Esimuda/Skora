import { Routes, Route, Navigate } from "react-router-dom";
import { PrincipalDashboard } from "../pages/principal/PrincipalDashboard";
import { TeachersPage } from "../pages/principal/TeachersPage";
import { ClassesPage } from "../pages/principal/ClassesPage";
import { ApprovalsPage } from "../pages/principal/ApprovalsPage";
import { DownloadsPage } from "../pages/principal/DownloadsPage";
import { SettingsPage } from "../pages/principal/SettingsPage";

export default function PrincipalRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/principal/dashboard" />} />
      <Route path="/principal/dashboard" element={<PrincipalDashboard />} />
      <Route path="/principal/teachers" element={<TeachersPage />} />
      <Route path="/principal/classes" element={<ClassesPage />} />
      <Route path="/principal/approvals" element={<ApprovalsPage />} />
      <Route path="/principal/downloads" element={<DownloadsPage />} />
      <Route path="/principal/settings" element={<SettingsPage />} />
    </Routes>
  );
}
