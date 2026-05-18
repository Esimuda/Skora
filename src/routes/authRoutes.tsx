import { Routes, Route } from "react-router-dom";
import { LoginPage } from "../pages/auth/LoginPage";
import { SignupPage } from "../pages/auth/SignupPage";
import { AcceptInvitePage } from "../pages/auth/AcceptInvitePage";
import { LandingPage } from "../pages/landing/LandingPage";

export default function AuthRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/accept-invite" element={<AcceptInvitePage />} />
    </Routes>
  );
}
