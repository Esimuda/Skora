import { useEffect } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import AuthRoutes from "./routes/authRoutes";
import TeacherRoutes from "./routes/teacherRoutes";
import PrincipalRoutes from "./routes/principalRoutes";
import AdminRoutes from "./routes/adminRoutes";
import { ParentPortal } from "./pages/portal/ParentPortal";
import { useAuthStore } from "./store/authStore";
import { useDataStore } from "./store/dataStore";

function App() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const clearData = useDataStore((s) => s.clear);

  useEffect(() => {
    const handleAuthExpired = () => {
      clearData();
      logout();
    };
    window.addEventListener("skora:auth-expired", handleAuthExpired);
    return () => window.removeEventListener("skora:auth-expired", handleAuthExpired);
  }, [logout, clearData]);

  return (
    <HashRouter>
      <Routes>
        {/* Public parent portal — no auth needed */}
        <Route path="/portal/*" element={<ParentPortal />} />

        {/* Authenticated routes */}
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              user?.role === "teacher" ? (
                <TeacherRoutes />
              ) : user?.role === "super_admin" ? (
                <AdminRoutes />
              ) : (
                <PrincipalRoutes />
              )
            ) : (
              <AuthRoutes />
            )
          }
        />
      </Routes>
    </HashRouter>
  );
}

export default App;