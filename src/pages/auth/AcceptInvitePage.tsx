import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";

export const AcceptInvitePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Invalid invite link — no token found.");
      return;
    }

    api
      .post<{ message: string }>(`/auth/accept-invite?token=${encodeURIComponent(token)}`, {})
      .then((res) => {
        setStatus("success");
        setMessage(res.message ?? "Invite accepted! You can now log in.");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.message ?? "This invite link is invalid or has already been used.");
      });
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-outline-variant p-10 max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center mx-auto mb-6">
          {status === "loading" && (
            <svg className="animate-spin w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          )}
          {status === "success" && (
            <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {status === "error" && (
            <svg className="w-7 h-7 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>

        <h1 className="text-2xl font-bold text-on-surface mb-3">
          {status === "loading" && "Verifying invite..."}
          {status === "success" && "Invite accepted!"}
          {status === "error" && "Invite failed"}
        </h1>

        <p className="text-on-surface-variant mb-8">{message}</p>

        {status !== "loading" && (
          <button
            onClick={() => navigate("/login")}
            className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
          >
            Go to Login
          </button>
        )}
      </div>
    </div>
  );
};
