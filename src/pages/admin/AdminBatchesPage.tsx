import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';

const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface Batch {
  id: string;
  schoolId: string;
  schoolName: string;
  principalName: string;
  principalEmail: string;
  quantity: number;
  totalAmount: number;
  status: 'pending_payment' | 'active' | 'exhausted';
  term: string;
  academicYear: string;
  paymentReference?: string;
  notes?: string;
  activatedAt?: string;
  requestedAt: string;
}

const TERM_LABELS: Record<string, string> = {
  first: '1st Term',
  second: '2nd Term',
  third: '3rd Term',
};

const daysSince = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

export const AdminBatchesPage = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending_payment');
  const [activatingBatch, setActivatingBatch] = useState<Batch | null>(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [activationNotes, setActivationNotes] = useState('');
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);

  useEffect(() => {
    api.get<Batch[]>('/admin/batches')
      .then(setBatches)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (!statusFilter ? batches : batches.filter((b) => b.status === statusFilter)),
    [batches, statusFilter],
  );

  const pendingCount = batches.filter((b) => b.status === 'pending_payment').length;

  const handleActivate = async () => {
    if (!activatingBatch || !paymentRef.trim()) return;
    setActivating(true);
    setActivateError(null);
    try {
      const updated = await api.put<Batch>(
        `/admin/batches/${activatingBatch.id}/activate`,
        { paymentReference: paymentRef.trim(), notes: activationNotes.trim() || undefined },
      );
      setBatches((prev) =>
        prev.map((b) => (b.id === updated.id ? updated : b)),
      );
      setActivatingBatch(null);
      setPaymentRef('');
      setActivationNotes('');
    } catch (e: any) {
      setActivateError(e.message ?? 'Activation failed');
    } finally {
      setActivating(false);
    }
  };

  const statusBadge = (status: Batch['status'], requestedAt: string) => {
    const days = daysSince(requestedAt);
    if (status === 'pending_payment') {
      const urgent = days >= 2;
      return (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            urgent
              ? 'bg-error-container text-on-error-container'
              : 'bg-tertiary-fixed-dim/20 text-on-tertiary-container'
          }`}
        >
          {urgent ? `⚠ Waiting ${days}d` : 'Pending'}
        </span>
      );
    }
    if (status === 'active')
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container">
          Active
        </span>
      );
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
        Exhausted
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight">
              Scratch Card Batches
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">
              {loading ? '…' : `${batches.length} total batch${batches.length !== 1 ? 'es' : ''}`}
            </p>
          </div>
          {pendingCount > 0 && (
            <div className="ledger-card flex items-center gap-2 px-4 py-2.5 border-l-4 border-error">
              <Icon name="warning" className="text-error text-base" />
              <span className="text-sm font-bold text-on-surface">
                {pendingCount} pending activation
              </span>
            </div>
          )}
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { value: '', label: 'All' },
            { value: 'pending_payment', label: 'Pending' },
            { value: 'active', label: 'Active' },
            { value: 'exhausted', label: 'Exhausted' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                statusFilter === tab.value
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {tab.label}
              {tab.value === 'pending_payment' && pendingCount > 0 && (
                <span className="ml-2 text-[10px] bg-error text-on-primary rounded-full px-1.5 py-0.5">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Batch list */}
        <div className="ledger-card overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-surface-container-highest animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center text-on-surface-variant">
              <Icon name="style" className="text-4xl mb-2 opacity-30" />
              <p className="text-sm">No batches in this category</p>
            </div>
          ) : (
            <ul className="divide-y divide-outline-variant/10">
              {filtered.map((batch) => (
                <li
                  key={batch.id}
                  className="flex items-center gap-4 px-6 py-4 flex-wrap sm:flex-nowrap"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-on-surface text-sm">{batch.schoolName}</p>
                      {statusBadge(batch.status, batch.requestedAt)}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {TERM_LABELS[batch.term] ?? batch.term} · {batch.academicYear} ·{' '}
                      {batch.quantity.toLocaleString()} cards · ₦
                      {batch.totalAmount.toLocaleString()}
                    </p>
                    <p className="text-xs text-on-surface-variant/60 mt-0.5">
                      Requested{' '}
                      {new Date(batch.requestedAt).toLocaleDateString('en-NG', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}{' '}
                      · {batch.principalName} · {batch.principalEmail}
                    </p>
                  </div>

                  {batch.status === 'pending_payment' && (
                    <button
                      onClick={() => setActivatingBatch(batch)}
                      className="flex-shrink-0 px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary-container hover:text-on-primary-container transition-colors"
                    >
                      Activate
                    </button>
                  )}
                  {batch.status === 'active' && batch.activatedAt && (
                    <p className="text-xs text-secondary font-medium flex-shrink-0">
                      Activated{' '}
                      {new Date(batch.activatedAt).toLocaleDateString('en-NG', {
                        day: 'numeric', month: 'short',
                      })}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Activation modal */}
      {activatingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="ledger-card w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-xl text-primary">Activate Batch</h3>
              <button
                onClick={() => { setActivatingBatch(null); setPaymentRef(''); setActivationNotes(''); setActivateError(null); }}
                className="p-2 rounded-xl hover:bg-surface-container transition-colors"
              >
                <Icon name="close" className="text-on-surface-variant" />
              </button>
            </div>

            {/* Batch summary */}
            <div className="bg-surface-container-low rounded-xl p-4 space-y-1.5 text-sm">
              <p><span className="text-on-surface-variant">School: </span><span className="font-semibold text-on-surface">{activatingBatch.schoolName}</span></p>
              <p><span className="text-on-surface-variant">Term: </span><span className="text-on-surface">{TERM_LABELS[activatingBatch.term] ?? activatingBatch.term} · {activatingBatch.academicYear}</span></p>
              <p><span className="text-on-surface-variant">Quantity: </span><span className="text-on-surface">{activatingBatch.quantity.toLocaleString()} PINs</span></p>
              <p><span className="text-on-surface-variant">Amount: </span><span className="font-bold text-secondary">₦{activatingBatch.totalAmount.toLocaleString()}</span></p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
                  Payment Reference <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. TRF/2025/00123"
                  className="w-full px-4 py-3 bg-surface-container-highest border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">
                  Notes (optional)
                </label>
                <textarea
                  value={activationNotes}
                  onChange={(e) => setActivationNotes(e.target.value)}
                  placeholder="Any additional notes…"
                  rows={2}
                  className="w-full px-4 py-3 bg-surface-container-highest border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
            </div>

            {activateError && (
              <p className="text-sm text-error bg-error-container p-3 rounded-xl">{activateError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setActivatingBatch(null); setPaymentRef(''); setActivationNotes(''); setActivateError(null); }}
                className="flex-1 px-4 py-3 rounded-xl bg-surface-container text-on-surface-variant text-sm font-semibold hover:bg-surface-container-highest transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleActivate}
                disabled={!paymentRef.trim() || activating}
                className="flex-1 px-4 py-3 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {activating ? (
                  <><span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> Activating…</>
                ) : (
                  <><Icon name="verified" className="text-base" /> Confirm &amp; Activate</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
