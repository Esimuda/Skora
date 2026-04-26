import { HashRouter } from "react-router-dom";
import AuthRoutes from "./routes/authRoutes";
import TeacherRoutes from "./routes/teacherRoutes";
import PrincipalRoutes from "./routes/principalRoutes";
import { useAuthStore } from "./store/authStore";

function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <HashRouter>
      {isAuthenticated ? (
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
