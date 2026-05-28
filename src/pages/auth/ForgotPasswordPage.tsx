import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSubmitted(true);
    } catch {
      // Show success anyway — prevents user enumeration
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-headline font-black text-2xl text-primary">Skora RMS</h1>
          <p className="text-on-surface-variant text-xs tracking-widest uppercase mt-1">Academic Ledger</p>
        </div>

        {submitted ? (
          /* Success state */
          <div className="ledger-card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-secondary">mark_email_read</span>
            </div>
            <h2 className="font-headline font-bold text-xl text-on-surface mb-2">Check your email</h2>
            <p className="text-sm text-on-surface-variant mb-6">
              If an account exists for <strong>{email}</strong>, we have sent a password reset link. Check your inbox and spam folder.
            </p>
            <p className="text-xs text-on-surface-variant mb-6">
              The link expires in <strong>1 hour</strong>.
            </p>
            <Link
              to="/login"
              className="btn-primary w-full flex items-center justify-center text-sm"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          /* Form state */
          <div className="ledger-card p-8">
            <div className="mb-6">
              <h2 className="font-headline font-extrabold text-2xl text-primary">Forgot Password</h2>
              <p className="text-on-surface-variant text-sm mt-1">
                Enter your email and we will send you a reset link
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@school.edu.ng"
                  className={`input-inset ${error ? 'ring-2 ring-error' : ''}`}
                  autoFocus
                />
                {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> Sending...</>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

            <p className="text-center text-sm text-on-surface-variant mt-6">
              Remembered it?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Back to login
              </Link>
            </p>
          </div>
        )}

      </div>
    </div>
  );
};