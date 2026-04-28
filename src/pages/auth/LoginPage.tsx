import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/api";
import { User } from "@/types";

export const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!formData.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      e.email = "Enter a valid email";
    if (!formData.password) e.password = "Password is required";
    else if (formData.password.length < 6) e.password = "At least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setApiError("");
    try {
      const res = await api.post<{ access_token: string; user: User }>(
        "/auth/login",
        { email: formData.email, password: formData.password },
      );
      login(res.user, res.access_token);
      navigate(
        res.user.role === "teacher"
          ? "/teacher/dashboard"
          : "/principal/dashboard",
      );
    } catch (err: any) {
      setApiError(err.message ?? "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex w-[45%] bg-gradient-to-br from-primary to-primary-container flex-col justify-between p-12">
        <div>
          <h1 className="font-headline font-black text-3xl text-on-primary">
            Skora RMS
          </h1>
          <p className="text-on-primary/60 text-xs tracking-widest uppercase mt-1">
            Academic Ledger
          </p>
        </div>
        <div>
          <p className="text-on-primary/80 text-2xl font-headline font-bold leading-snug">
            "Precision is the highest form of professional trust."
          </p>
          <p className="text-on-primary/50 text-sm mt-4">
            The result management system built for Nigerian secondary schools.
          </p>
        </div>
        <div className="flex items-center gap-3 text-on-primary/50 text-xs">
          <span className="w-1.5 h-1.5 bg-secondary rounded-full" />
          Offline-capable · Secure · Fast
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10 text-center">
            <h1 className="font-headline font-black text-2xl text-primary">
              Skora RMS
            </h1>
            <p className="text-on-surface-variant text-xs tracking-widest uppercase mt-1">
              Academic Ledger
            </p>
          </div>

          <div className="mb-8">
            <h2 className="font-headline font-extrabold text-3xl text-primary">
              Welcome back
            </h2>
            <p className="text-on-surface-variant text-sm mt-2">
              Sign in to access your academic ledger
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@school.edu.ng"
                className={`input-inset ${errors.email ? "ring-2 ring-error" : ""}`}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-error">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                Password
              </label>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`input-inset ${errors.password ? "ring-2 ring-error" : ""}`}
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-error">{errors.password}</p>
              )}
            </div>

            {apiError && (
              <p className="text-sm text-error bg-error-container/30 rounded-lg px-4 py-2.5">
                {apiError}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-on-surface-variant mt-8">
            New school?{" "}
            <Link
              to="/signup"
              className="text-primary font-semibold hover:underline"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
