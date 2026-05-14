import { useEffect } from "react";
import { HashRouter } from "react-router-dom";
import AuthRoutes from "./routes/authRoutes";
import TeacherRoutes from "./routes/teacherRoutes";
import PrincipalRoutes from "./routes/principalRoutes";
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
      {isAuthenticated && user?.schoolId ? (
        user?.role === "teacher" ? (
          <TeacherRoutes />
        ) : (
          <PrincipalRoutes />
        )
      ) : (
        <AuthRoutes />
      )}
    </HashRouter>
  );
}

export default App;
