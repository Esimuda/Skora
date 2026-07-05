import { useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthRoutes from "./routes/authRoutes";
import TeacherRoutes from "./routes/teacherRoutes";
import PrincipalRoutes from "./routes/principalRoutes";
import AdminRoutes from "./routes/adminRoutes";
import { ParentPortal } from "./pages/portal/ParentPortal";
import { TermsPage } from "./pages/legal/TermsPage";
import { PrivacyPage } from "./pages/legal/PrivacyPage";
import { useAuthStore } from "./store/authStore";
import { useDataStore } from "./store/dataStore";
import { api } from "@/lib/api";

// How long a signed-in user can sit idle (no mouse/keyboard/touch activity)
// before they're automatically logged out. Adjust to taste.
const IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutes

// How often to double-check with the server that the session is still valid
// while the tab is open. Catches a dead/expired/revoked token even without
// any user activity — e.g. after a password reset elsewhere, or the token
// simply expiring — so the user isn't left in a half-broken "logged in but
// nothing saves" state until they happen to trigger a request that 401s.
const SESSION_CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function App() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const clearData = useDataStore((s) => s.clear);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleAuthExpired = () => {
      clearData();
      logout();
    };
    window.addEventListener("skora:auth-expired", handleAuthExpired);
    return () => window.removeEventListener("skora:auth-expired", handleAuthExpired);
  }, [logout, clearData]);

  // ── Auto-logout after a period of inactivity ────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      return;
    }

    const resetIdleTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        clearData();
        logout();
      }, IDLE_TIMEOUT_MS);
    };

    const activityEvents = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    activityEvents.forEach((evt) => window.addEventListener(evt, resetIdleTimer, { passive: true }));
    resetIdleTimer();

    return () => {
      activityEvents.forEach((evt) => window.removeEventListener(evt, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isAuthenticated, logout, clearData]);

  // ── Revalidate the session when the tab regains focus, and periodically
  //    in the background. A 401 here is already handled globally by api.ts,
  //    which clears the stored token and fires "skora:auth-expired" — the
  //    listener above then logs the user out cleanly.
  useEffect(() => {
    if (!isAuthenticated) return;

    const revalidate = () => {
      api.get("/auth/me").catch(() => {
        // Any failure (401 or otherwise) is already handled by api.ts.
        // Nothing further to do here.
      });
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") revalidate();
    };

    window.addEventListener("focus", revalidate);
    document.addEventListener("visibilitychange", handleVisibility);
    const intervalId = setInterval(revalidate, SESSION_CHECK_INTERVAL_MS);

    return () => {
      window.removeEventListener("focus", revalidate);
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(intervalId);
    };
  }, [isAuthenticated]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public parent portal — no auth needed */}
        <Route path="/portal/*" element={<ParentPortal />} />

        {/* Public legal pages — accessible whether logged in or not */}
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />

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
    </BrowserRouter>
  );
}

export default App;