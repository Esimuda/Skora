import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface PlatformStats {
  totalSchools: number;
  activeSchools: number;
  pendingBatches: number;
  pendingUnlocks: number;
  totalPendingRequests: number;
  totalPinsIssued: number;
  totalPinsUsed: number;
  estimatedRevenue: number;
}

interface ActivityItem {
  type: string;
  message: string;
  date: string;
}

export const AdminDashboard = () => {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<PlatformStats>('/admin/stats'),
      api.get<ActivityItem[]>('/admin/activity'),
    ])
      .then(([s, a]) => { setStats(s); setActivity(a); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    {
      label: 'Total Schools',
      value: stats.totalSchools,
      icon: 'apartment',
      iconBg: 'bg-primary/5 text-primary',
      action: () => navigate('/admin/schools'),
    },
    {
      label: 'Pending Requests',
      value: stats.totalPendingRequests,
      icon: 'pending_actions',
      iconBg: stats.totalPendingRequests > 0
        ? 'bg-error-container text-on-error-container'
        : 'bg-surface-container text-on-surface-variant',
      alert: stats.totalPendingRequests > 0,
      action: () => navigate('/admin/requests'),
    },
    {
      label: 'PINs Issued',
      value: stats.totalPinsIssued.toLocaleString(),
      icon: 'style',
      iconBg: 'bg-secondary/5 text-secondary',
      action: () => navigate('/admin/requests'),
    },
    {
      label: 'Est. Revenue',
      value: `₦${(stats.estimatedRevenue).toLocaleString()}`,
      icon: 'payments',
      iconBg: 'bg-tertiary-fixed-dim/20 text-on-tertiary-container',
      action: () => navigate('/admin/revenue'),
    },
  ] : [];

  const getActivityIcon = (type: string) => {
    if (type === 'batch_requested' || type === 'unlock_requested') return 'pending_actions';
    if (type === 'batch_activated' || type === 'unlock_activated') return 'verified';
    if (type === 'school_registered') return 'apartment';
    return 'info';
  };

  const getActivityColor = (type: string) => {
    if (type === 'batch_requested' || type === 'unlock_requested') return 'bg-tertiary-fixed-dim/20 text-on-tertiary-container';
    if (type === 'batch_activated' || type === 'unlock_activated') return 'bg-secondary-container/40 text-on-secondary-container';
    return 'bg-primary/5 text-primary';
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight">
              Platform Overview
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">
              Welcome back,{' '}
              <span className="font-semibold text-on-surface">
                {user?.firstName} {user?.lastName}
              </span>
            </p>
          </div>
          <div className="ledger-card flex items-center gap-2 px-4 py-2.5">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="text-sm font-medium text-on-surface">Skora Platform Admin</span>
          </div>
        </div>

        {/* Pending requests alert */}
        {stats && stats.totalPendingRequests > 0 && (
          <button
            onClick={() => navigate('/admin/requests')}
            className="w-full ledger-card p-4 flex items-center gap-3 border-l-4 border-error text-left hover:bg-error-container/10 transition-colors"
          >
            <Icon name="warning" className="text-error flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-on-surface text-sm">
                {stats.totalPendingRequests} request{stats.totalPendingRequests !== 1 ? 's' : ''} awaiting activation
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {stats.pendingBatches > 0 && `${stats.pendingBatches} scratch card batch${stats.pendingBatches !== 1 ? 'es' : ''}`}
                {stats.pendingBatches > 0 && stats.pendingUnlocks > 0 && ' · '}
                {stats.pendingUnlocks > 0 && `${stats.pendingUnlocks} download unlock${stats.pendingUnlocks !== 1 ? 's' : ''}`}
                {' '}— click to review and activate
              </p>
            </div>
            <Icon name="chevron_right" className="text-on-surface-variant flex-shrink-0" />
          </button>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="ledger-card p-4 sm:p-6 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-highest mb-4" />
                  <div className="w-16 h-3 rounded bg-surface-container-highest mb-2" />
                  <div className="w-10 h-7 rounded bg-surface-container-highest" />
                </div>
              ))
            : statCards.map((card, i) => (
                <button
                  key={i}
                  onClick={card.action}
                  className="ledger-card p-4 sm:p-6 text-left hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3 md:mb-4">
                    <span className={`p-2 md:p-3 rounded-xl ${card.iconBg}`}>
                      <Icon name={card.icon} />
                    </span>
                    {card.alert && (
                      <span className="text-[10px] font-bold text-error bg-error-container px-2 py-0.5 rounded-full">
                        Action needed
                      </span>
                    )}
                  </div>
                  <p className="text-on-surface-variant text-[10px] md:text-xs uppercase tracking-widest font-bold">
                    {card.label}
                  </p>
                  <p className="font-headline font-extrabold text-2xl md:text-3xl text-primary mt-1">
                    {card.value}
                  </p>
                </button>
              ))}
        </div>

        {/* PIN usage bar */}
        {stats && stats.totalPinsIssued > 0 && (
          <div className="ledger-card p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-headline font-bold text-lg text-primary">PIN Usage</h3>
              <span className="text-sm text-on-surface-variant">
                {stats.totalPinsUsed.toLocaleString()} /{' '}
                {stats.totalPinsIssued.toLocaleString()} used
              </span>
            </div>
            <div className="h-3 rounded-full bg-surface-container-highest overflow-hidden">
              <div
                className="h-full rounded-full bg-secondary transition-all duration-700"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((stats.totalPinsUsed / stats.totalPinsIssued) * 100),
                  )}%`,
                }}
              />
            </div>
            <p className="text-xs text-on-surface-variant mt-2">
              {Math.round((stats.totalPinsUsed / stats.totalPinsIssued) * 100)}% of all issued PINs
              have been used by parents
            </p>
          </div>
        )}

        {/* Activity feed */}
        <div className="ledger-card overflow-hidden">
          <div className="px-6 py-5 border-b border-outline-variant/10">
            <h3 className="font-headline font-bold text-xl text-primary">Recent Activity</h3>
          </div>
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-surface-container-highest rounded w-3/4" />
                    <div className="h-2 bg-surface-container-highest rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : activity.length === 0 ? (
            <div className="p-12 text-center text-on-surface-variant">
              <Icon name="history" className="text-4xl mb-2 opacity-30" />
              <p className="text-sm">No activity yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-outline-variant/10">
              {activity.map((item, i) => (
                <li key={i} className="flex items-center gap-4 px-6 py-4">
                  <span className={`p-2 rounded-xl flex-shrink-0 ${getActivityColor(item.type)}`}>
                    <Icon name={getActivityIcon(item.type)} className="text-base" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-on-surface font-medium truncate">{item.message}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {new Date(item.date).toLocaleString('en-NG', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
