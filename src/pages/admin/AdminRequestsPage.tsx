import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';

const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface Batch {
  id: string;
  schoolName: string;
  principalName: string;
  principalEmail: string;
  quantity: number;
  totalAmount: number;
  status: 'pending_payment' | 'active' | 'exhausted';
  term: string;
  academicYear: string;
  requestedAt: string;
  activatedAt?: string;
}

interface DownloadUnlock {
  id: string;
  schoolName: string;
  principalName: string;
  principalEmail: string;
  scope: 'class' | 'school';
  className: string | null;
  studentCount: number;
  totalAmount: number;
  status: 'pending_payment' | 'active';
  term: string;
  academicYear: string;
  requestedAt: string;
  activatedAt?: string;
}

// Unified shape for rendering both request types in one list
type UnifiedRequest =
  | { kind: 'batch'; data: Batch }
  | { kind: 'unlock'; data: DownloadUnlock };

const TERM_LABELS: Record<string, string> = {
  first: '1st Term',
  second: '2nd Term',
  third: '3rd Term',
};

const daysSince = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

export const AdminRequestsPage = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [unlocks, setUnlocks] = useState<DownloadUnlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<'' | 'batch' | 'unlock'>('');
  const [statusFilter, setStatusFilter] = useState('pending_payment');

  // Activation modal state — shared between batch and unlock, kind tells which
  const [activating, setActivating] = useState<UnifiedRequest | null>(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [activationNotes, setActivationNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.get<Batch[]>('/admin/batches'),
      api.get<DownloadUnlock[]>('/admin/download-unlocks'),
    ])
      .then(([batchesData, unlocksData]) => {
        setBatches(batchesData);
        setUnlocks(unlocksData);
      })
      .catch(() => setError('Failed to load requests. Check your connection and try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const allRequests: UnifiedRequest[] = useMemo(() => [
    ...batches.map((b): UnifiedRequest => ({ kind: 'batch', data: b })),
    ...unlocks.map((u): UnifiedRequest => ({ kind: 'unlock', data: u })),
  ], [batches, unlocks]);

  const filtered = useMemo(() => {
    return allRequests
      .filter((r) => !typeFilter || r.kind === typeFilter)
      .filter((r) => !statusFilter || r.data.status === statusFilter)
      .sort((a, b) => new Date(b.data.requestedAt).getTime() - new Date(a.data.requestedAt).getTime());
  }, [allRequests, typeFilter, statusFilter]);

  const pendingBatchCount = batches.filter((b) => b.status === 'pending_payment').length;
  const pendingUnlockCount = unlocks.filter((u) => u.status === 'pending_payment').length;
  const totalPending = pendingBatchCount + pendingUnlockCount;

  const handleActivate = async () => {
    if (!activating || !paymentRef.trim()) return;
    setSubmitting(true);
    setActivateError(null);
    try {
      if (activating.kind === 'batch') {
        const updated = await api.put<Batch>(
          `/admin/batches/${activating.data.id}/activate`,
          { paymentReference: paymentRef.trim(), notes: activationNotes.trim() || undefined },
        );
        setBatches((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      } else {
        const updated = await api.put<DownloadUnlock>(
          `/admin/download-unlocks/${activating.data.id}/activate`,
          { paymentReference: paymentRef.trim(), notes: activationNotes.trim() || undefined },
        );
        setUnlocks((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      }
      setActivating(null);
      setPaymentRef('');
      setActivationNotes('');
    } catch (e: any) {
      setActivateError(e.message ?? 'Activation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setActivating(null);
    setPaymentRef('');
    setActivationNotes('');
    setActivateError(null);
  };

  const statusBadge = (status: string, requestedAt: string) => {
    const days = daysSince(requestedAt);
    if (status === 'pending_payment') {
      const urgent = days >= 2;
      return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          urgent ? 'bg-error-container text-on-error-container' : 'bg-tertiary-fixed-dim/20 text-on-tertiary-container'
        }`}>
          {urgent ? `⚠ Waiting ${days}d` : 'Pending'}
        </span>
      );
    }
    if (status === 'active')
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container">Active</span>;
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">Exhausted</span>;
  };

  const typeBadge = (kind: 'batch' | 'unlock') => (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
      kind === 'batch' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
    }`}>
      <Icon name={kind === 'batch' ? 'style' : 'sim_card_download'} className="text-[12px]" />
      {kind === 'batch' ? 'Scratch Cards' : 'ZIP Download'}
    </span>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight">
              Requests
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">
              {loading ? '…' : `${allRequests.length} total request${allRequests.length !== 1 ? 's' : ''} · scratch cards & physical downloads`}
            </p>
          </div>
          {totalPending > 0 && (
            <div className="ledger-card flex items-center gap-2 px-4 py-2.5 border-l-4 border-error">
              <Icon name="warning" className="text-error text-base" />
              <span className="text-sm font-bold text-on-surface">
                {totalPending} pending activation{totalPending > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="ledger-card p-4 border-l-4 border-error flex items-center gap-3">
            <Icon name="error" className="text-error text-base flex-shrink-0" />
            <p className="text-sm text-on-surface flex-1">{error}</p>
            <button onClick={load} className="px-3 py-1.5 rounded-lg bg-error text-on-error text-sm font-semibold hover:bg-error/90 transition-colors flex-shrink-0">
              Retry
            </button>
          </div>
        )}

        {/* Type filter */}
        <div className="flex gap-2 flex-wrap">
          {[
            { value: '', label: 'All Types' },
            { value: 'batch', label: 'Scratch Cards' },
            { value: 'unlock', label: 'ZIP Downloads' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setTypeFilter(tab.value as '' | 'batch' | 'unlock')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                typeFilter === tab.value ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-2 flex-wrap">
          {[
            { value: '', label: 'All Statuses' },
            { value: 'pending_payment', label: 'Pending' },
            { value: 'active', label: 'Active' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                statusFilter === tab.value ? 'bg-surface-container-highest text-primary ring-2 ring-primary/30' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              {tab.label}
              {tab.value === 'pending_payment' && totalPending > 0 && (
                <span className="ml-2 text-[10px] bg-error text-on-primary rounded-full px-1.5 py-0.5">{totalPending}</span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="ledger-card overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-surface-container-highest animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 && !error ? (
            <div className="p-16 text-center text-on-surface-variant">
              <Icon name="inbox" className="text-4xl mb-2 opacity-30" />
              <p className="text-sm">No requests in this category</p>
            </div>
          ) : (
            <ul className="divide-y divide-outline-variant/10">
              {filtered.map((req) => {
                const d = req.data;
                const scopeLabel = req.kind === 'unlock'
                  ? (req.data as DownloadUnlock).scope === 'school'
                    ? 'Entire School'
                    : `Class: ${(req.data as DownloadUnlock).className}`
                  : null;
                const quantityLabel = req.kind === 'batch'
                  ? `${(req.data as Batch).quantity.toLocaleString()} cards`
                  : `${(req.data as DownloadUnlock).studentCount.toLocaleString()} students`;

                return (
                  <li key={`${req.kind}-${d.id}`} className="flex items-center gap-4 px-6 py-4 flex-wrap sm:flex-nowrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-on-surface text-sm">{d.schoolName}</p>
                        {typeBadge(req.kind)}
                        {statusBadge(d.status, d.requestedAt)}
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {TERM_LABELS[d.term] ?? d.term} · {d.academicYear} · {quantityLabel}
                        {scopeLabel && ` · ${scopeLabel}`} · ₦{d.totalAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-on-surface-variant/60 mt-0.5">
                        Requested {formatDate(d.requestedAt)} · {d.principalName} · {d.principalEmail}
                      </p>
                    </div>

                    {d.status === 'pending_payment' && (
                      <button
                        onClick={() => setActivating(req)}
                        className="flex-shrink-0 px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary-container hover:text-on-primary-container transition-colors"
                      >
                        Activate
                      </button>
                    )}
                    {d.status === 'active' && d.activatedAt && (
                      <p className="text-xs text-secondary font-medium flex-shrink-0">
                        Activated {formatDate(d.activatedAt)}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Activation modal */}
      {activating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="ledger-card w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-xl text-primary">
                Activate {activating.kind === 'batch' ? 'Batch' : 'Download Access'}
              </h3>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-surface-container transition-colors">
                <Icon name="close" className="text-on-surface-variant" />
              </button>
            </div>

            <div className="bg-surface-container-low rounded-xl p-4 space-y-1.5 text-sm">
              <p><span className="text-on-surface-variant">School: </span><span className="font-semibold text-on-surface">{activating.data.schoolName}</span></p>
              <p><span className="text-on-surface-variant">Term: </span><span className="text-on-surface">{TERM_LABELS[activating.data.term] ?? activating.data.term} · {activating.data.academicYear}</span></p>
              {activating.kind === 'batch' ? (
                <p><span className="text-on-surface-variant">Quantity: </span><span className="text-on-surface">{(activating.data as Batch).quantity.toLocaleString()} PINs</span></p>
              ) : (
                <>
                  <p><span className="text-on-surface-variant">Scope: </span><span className="text-on-surface">{(activating.data as DownloadUnlock).scope === 'school' ? 'Entire School' : (activating.data as DownloadUnlock).className}</span></p>
                  <p><span className="text-on-surface-variant">Students: </span><span className="text-on-surface">{(activating.data as DownloadUnlock).studentCount.toLocaleString()}</span></p>
                </>
              )}
              <p><span className="text-on-surface-variant">Amount: </span><span className="font-bold text-secondary">₦{activating.data.totalAmount.toLocaleString()}</span></p>
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
                onClick={closeModal}
                className="flex-1 px-4 py-3 rounded-xl bg-surface-container text-on-surface-variant text-sm font-semibold hover:bg-surface-container-highest transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleActivate}
                disabled={!paymentRef.trim() || submitting}
                className="flex-1 px-4 py-3 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
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
