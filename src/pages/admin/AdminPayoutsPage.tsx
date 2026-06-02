import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import { School } from '@/types';

const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface Payout {
  id: string;
  schoolId: string;
  schoolName: string;
  amount: number;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  reference: string;
  notes?: string;
  processedBy: string;
  processedAt: string;
}

const emptyForm = {
  schoolId: '',
  amount: '',
  bankName: '',
  accountNumber: '',
  accountName: '',
  reference: '',
  notes: '',
};

export const AdminPayoutsPage = () => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.get<Payout[]>('/admin/payouts'),
      api.get<School[]>('/schools'),
    ])
      .then(([p, s]) => { setPayouts(p); setSchools(s); })
      .catch(() => setError('Failed to load payouts. Check your connection and try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () =>
      payouts.filter(
        (p) =>
          !search ||
          p.schoolName.toLowerCase().includes(search.toLowerCase()) ||
          p.reference.toLowerCase().includes(search.toLowerCase()),
      ),
    [payouts, search],
  );

  const totalPaidOut = payouts.reduce((s, p) => s + p.amount, 0);

  const handleSubmit = async () => {
    if (!form.schoolId || !form.amount || !form.reference.trim()) {
      setFormError('School, amount, and reference are required.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const created = await api.post<Payout>('/admin/payouts', {
        schoolId: form.schoolId,
        amount: Number(form.amount),
        bankName: form.bankName || undefined,
        accountNumber: form.accountNumber || undefined,
        accountName: form.accountName || undefined,
        reference: form.reference.trim(),
        notes: form.notes.trim() || undefined,
      });
      setPayouts((prev) => [created, ...prev]);
      setShowForm(false);
      setForm(emptyForm);
    } catch (e: any) {
      setFormError(e.message ?? 'Failed to record payout');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass =
    'w-full px-4 py-3 bg-surface-container-highest border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight">
              Payouts
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">
              Record transfers from Skora to schools
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Icon name="add" className="text-base" /> Record Payout
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div className="ledger-card p-4 border-l-4 border-error flex items-center gap-3">
            <Icon name="error" className="text-error text-base flex-shrink-0" />
            <p className="text-sm text-on-surface flex-1">{error}</p>
            <button
              onClick={load}
              className="px-3 py-1.5 rounded-lg bg-error text-on-error text-sm font-semibold hover:bg-error/90 transition-colors flex-shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="ledger-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="account_balance" className="text-base text-primary" />
              <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
                Total Paid Out
              </p>
            </div>
            <p className="font-headline font-extrabold text-2xl text-primary">
              {loading ? (
                <span className="block w-24 h-7 bg-surface-container-highest rounded animate-pulse" />
              ) : (
                `₦${totalPaidOut.toLocaleString()}`
              )}
            </p>
          </div>
          <div className="ledger-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="receipt_long" className="text-base text-secondary" />
              <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
                Transactions
              </p>
            </div>
            <p className="font-headline font-extrabold text-2xl text-secondary">
              {loading ? (
                <span className="block w-12 h-7 bg-surface-container-highest rounded animate-pulse" />
              ) : (
                payouts.length
              )}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="ledger-card p-4">
          <div className="relative">
            <Icon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base"
            />
            <input
              type="text"
              placeholder="Search by school or reference…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-surface-container-highest border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Payout list */}
        <div className="ledger-card overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-surface-container-highest animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 && !error ? (
            <div className="p-16 text-center text-on-surface-variant">
              <Icon name="account_balance" className="text-4xl mb-2 opacity-30" />
              <p className="text-sm">No payouts recorded yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-outline-variant/10">
              {filtered.map((payout) => (
                <li key={payout.id} className="flex items-center gap-4 px-6 py-4 flex-wrap sm:flex-nowrap">
                  <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center bg-secondary/5">
                    <Icon name="account_balance" className="text-secondary text-base" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-on-surface text-sm">{payout.schoolName}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Ref: {payout.reference}
                      {payout.bankName ? ` · ${payout.bankName}` : ''}
                      {payout.accountNumber ? ` · ${payout.accountNumber}` : ''}
                    </p>
                    {payout.notes && (
                      <p className="text-xs text-on-surface-variant/60 mt-0.5 italic">{payout.notes}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-secondary">₦{payout.amount.toLocaleString()}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {new Date(payout.processedAt).toLocaleDateString('en-NG', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Record payout modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="ledger-card w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-xl text-primary">Record Payout</h3>
              <button
                onClick={() => { setShowForm(false); setForm(emptyForm); setFormError(null); }}
                className="p-2 rounded-xl hover:bg-surface-container transition-colors"
              >
                <Icon name="close" className="text-on-surface-variant" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
                  School <span className="text-error">*</span>
                </label>
                <select
                  value={form.schoolId}
                  onChange={(e) => setForm((f) => ({ ...f, schoolId: e.target.value }))}
                  className={fieldClass}
                >
                  <option value="">Select school…</option>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
                  Amount (₦) <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="e.g. 150000"
                  className={fieldClass}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
                  Payment Reference <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={form.reference}
                  onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                  placeholder="e.g. TRF/2025/00124"
                  className={fieldClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={form.bankName}
                    onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                    placeholder="e.g. Access Bank"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
                    Account No.
                  </label>
                  <input
                    type="text"
                    value={form.accountNumber}
                    onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
                    placeholder="0123456789"
                    className={fieldClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
                  Account Name
                </label>
                <input
                  type="text"
                  value={form.accountName}
                  onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))}
                  placeholder="e.g. Greenfield Academy"
                  className={fieldClass}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional notes…"
                  rows={2}
                  className={`${fieldClass} resize-none`}
                />
              </div>
            </div>

            {formError && (
              <p className="text-sm text-error bg-error-container p-3 rounded-xl">{formError}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setShowForm(false); setForm(emptyForm); setFormError(null); }}
                className="flex-1 px-4 py-3 rounded-xl bg-surface-container text-on-surface-variant text-sm font-semibold hover:bg-surface-container-highest transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-3 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> Saving…</>
                ) : (
                  <><Icon name="save" className="text-base" /> Record Payout</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
