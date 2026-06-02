import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';

const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface RevenueRow {
  schoolId: string;
  schoolName: string;
  batchesCount: number;
  totalPinsIssued: number;
  totalPinsUsed: number;
  totalRevenue: number;
  lastBatchDate: string;
}

export const AdminRevenuePage = () => {
  const [rows, setRows] = useState<RevenueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<keyof RevenueRow>('totalRevenue');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const load = () => {
    setLoading(true);
    setError(null);
    api.get<RevenueRow[]>('/admin/revenue')
      .then(setRows)
      .catch(() => setError('Failed to load revenue data. Check your connection and try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let data = rows.filter(
      (r) => !search || r.schoolName.toLowerCase().includes(search.toLowerCase()),
    );
    data = [...data].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'desc' ? bv - av : av - bv;
      }
      return sortDir === 'desc'
        ? String(bv).localeCompare(String(av))
        : String(av).localeCompare(String(bv));
    });
    return data;
  }, [rows, search, sortKey, sortDir]);

  const totals = useMemo(
    () => ({
      revenue: rows.reduce((s, r) => s + r.totalRevenue, 0),
      pins: rows.reduce((s, r) => s + r.totalPinsIssued, 0),
      used: rows.reduce((s, r) => s + r.totalPinsUsed, 0),
    }),
    [rows],
  );

  const toggleSort = (key: keyof RevenueRow) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const exportCsv = () => {
    const headers = [
      'School',
      'Batches',
      'PINs Issued',
      'PINs Used',
      'Usage %',
      'Revenue (₦)',
      'Last Batch',
    ];
    const csvRows = filtered.map((r) => [
      `"${r.schoolName}"`,
      r.batchesCount,
      r.totalPinsIssued,
      r.totalPinsUsed,
      r.totalPinsIssued > 0
        ? `${Math.round((r.totalPinsUsed / r.totalPinsIssued) * 100)}%`
        : '0%',
      r.totalRevenue,
      new Date(r.lastBatchDate).toLocaleDateString('en-NG'),
    ]);
    const csv = [headers, ...csvRows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skora-revenue-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ col }: { col: keyof RevenueRow }) =>
    sortKey === col ? (
      <Icon
        name={sortDir === 'desc' ? 'arrow_downward' : 'arrow_upward'}
        className="text-xs ml-1 text-primary"
      />
    ) : (
      <Icon name="unfold_more" className="text-xs ml-1 text-on-surface-variant/40" />
    );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight">
              Revenue
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">
              Per-school breakdown of PIN sales
            </p>
          </div>
          <button
            onClick={exportCsv}
            disabled={rows.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            <Icon name="download" className="text-base" /> Export CSV
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

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Total Revenue', value: `₦${totals.revenue.toLocaleString()}`, icon: 'payments', color: 'text-secondary' },
            { label: 'PINs Issued', value: totals.pins.toLocaleString(), icon: 'style', color: 'text-primary' },
            { label: 'PINs Used', value: `${totals.used.toLocaleString()} (${totals.pins > 0 ? Math.round((totals.used / totals.pins) * 100) : 0}%)`, icon: 'done_all', color: 'text-on-tertiary-container' },
          ].map((card, i) => (
            <div key={i} className="ledger-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon name={card.icon} className={`text-base ${card.color}`} />
                <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
                  {card.label}
                </p>
              </div>
              <p className={`font-headline font-extrabold text-2xl ${card.color}`}>
                {loading ? (
                  <span className="block w-20 h-7 bg-surface-container-highest rounded animate-pulse" />
                ) : (
                  card.value
                )}
              </p>
            </div>
          ))}
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
              placeholder="Search by school name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-surface-container-highest border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Table */}
        <div className="ledger-card overflow-hidden overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-surface-container-highest animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 && !error ? (
            <div className="p-16 text-center text-on-surface-variant">
              <Icon name="payments" className="text-4xl mb-2 opacity-30" />
              <p className="text-sm">No revenue data yet</p>
            </div>
          ) : (
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-surface-container-low/50 border-b border-outline-variant/10">
                <tr>
                  {[
                    { key: 'schoolName', label: 'School' },
                    { key: 'batchesCount', label: 'Batches' },
                    { key: 'totalPinsIssued', label: 'Issued' },
                    { key: 'totalPinsUsed', label: 'Used' },
                    { key: 'totalRevenue', label: 'Revenue' },
                    { key: 'lastBatchDate', label: 'Last Batch' },
                  ].map((col) => (
                    <th
                      key={col.key}
                      onClick={() => toggleSort(col.key as keyof RevenueRow)}
                      className="px-4 py-3 text-left text-[10px] uppercase tracking-widest font-bold text-on-surface-variant cursor-pointer hover:text-on-surface select-none"
                    >
                      <span className="flex items-center">
                        {col.label}
                        <SortIcon col={col.key as keyof RevenueRow} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filtered.map((row) => {
                  const usagePct =
                    row.totalPinsIssued > 0
                      ? Math.round((row.totalPinsUsed / row.totalPinsIssued) * 100)
                      : 0;
                  return (
                    <tr key={row.schoolId} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-on-surface">{row.schoolName}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{row.batchesCount}</td>
                      <td className="px-4 py-3 text-on-surface-variant">
                        {row.totalPinsIssued.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-on-surface-variant">
                            {row.totalPinsUsed.toLocaleString()}
                          </span>
                          <div className="w-16 h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                            <div
                              className="h-full rounded-full bg-secondary"
                              style={{ width: `${usagePct}%` }}
                            />
                          </div>
                          <span className="text-xs text-on-surface-variant/60">{usagePct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-secondary">
                        ₦{row.totalRevenue.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant text-xs">
                        {new Date(row.lastBatchDate).toLocaleDateString('en-NG', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Totals row */}
              <tfoot className="bg-surface-container-low/50 border-t-2 border-outline-variant/20">
                <tr>
                  <td className="px-4 py-3 font-bold text-on-surface">
                    Total ({filtered.length} schools)
                  </td>
                  <td className="px-4 py-3 font-bold text-on-surface">
                    {filtered.reduce((s, r) => s + r.batchesCount, 0)}
                  </td>
                  <td className="px-4 py-3 font-bold text-on-surface">
                    {filtered.reduce((s, r) => s + r.totalPinsIssued, 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-bold text-on-surface">
                    {filtered.reduce((s, r) => s + r.totalPinsUsed, 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-bold text-secondary text-base">
                    ₦{filtered.reduce((s, r) => s + r.totalRevenue, 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3" />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
