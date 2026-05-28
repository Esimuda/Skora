import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') ?? '';
  const email = searchParams.get('email') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState('');

  // If no token or email in URL — invalid link
  const invalidLink = !token || !email;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!password) e.password = 'Password is required';
    else if (password.length < 8) e.password = 'Password must be at least 8 characters';
    else if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(password))
      e.password = 'Password must contain at least one letter and one number';
    if (!confirm) e.confirm = 'Please confirm your password';
    else if (password !== confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      await api.post('/auth/reset-password', {
        email,
        token,
        newPassword: password,
      });
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setApiError(err.message ?? 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (invalidLink) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="w-full max-w-md ledger-card p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-error mb-4 block">link_off</span>
          <h2 className="font-headline font-bold text-xl text-on-surface mb-2">Invalid Reset Link</h2>
          <p className="text-sm text-on-surface-variant mb-6">
            This password reset link is invalid or has already been used. Please request a new one.
          </p>
          <Link to="/forgot-password" className="btn-primary w-full flex items-center justify-center text-sm">
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="w-full max-w-md ledger-card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-secondary">check_circle</span>
          </div>
          <h2 className="font-headline font-bold text-xl text-on-surface mb-2">Password Reset!</h2>
          <p className="text-sm text-on-surface-variant mb-2">
            Your password has been updated successfully.
          </p>
          <p className="text-xs text-on-surface-variant mb-6">Redirecting you to login...</p>
          <Link to="/login" className="btn-primary w-full flex items-center justify-center text-sm">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        <div className="text-center mb-10">
          <h1 className="font-headline font-black text-2xl text-primary">Skora RMS</h1>
          <p className="text-on-surface-variant text-xs tracking-widest uppercase mt-1">Academic Ledger</p>
        </div>

        <div className="ledger-card p-8">
          <div className="mb-6">
            <h2 className="font-headline font-extrabold text-2xl text-primary">Set New Password</h2>
            <p className="text-on-surface-variant text-sm mt-1">
              Choose a strong password for your account
            </p>
          </div>

          {apiError && (
            <div className="rounded-xl bg-error-container text-on-error-container px-4 py-3 text-sm mb-4">
              {apiError}
              {apiError.toLowerCase().includes('expired') && (
                <Link to="/forgot-password" className="block mt-2 font-bold underline">
                  Request a new reset link →
                </Link>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors({ ...errors, password: '' }); }}
                placeholder="8+ chars, with letter and number"
                className={`input-inset ${errors.password ? 'ring-2 ring-error' : ''}`}
                autoFocus
              />
              {errors.password && <p className="mt-1.5 text-xs text-error">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setErrors({ ...errors, confirm: '' }); }}
                placeholder="Repeat your password"
                className={`input-inset ${errors.confirm ? 'ring-2 ring-error' : ''}`}
              />
              {errors.confirm && <p className="mt-1.5 text-xs text-error">{errors.confirm}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> Resetting...</>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};