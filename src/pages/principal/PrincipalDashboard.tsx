import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { useDataStore } from '@/store/dataStore';
import { Term } from '@/types';

const CURRENT_TERM: Term = 'first';
const CURRENT_YEAR = '2024/2025';

const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export const PrincipalDashboard = () => {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const {
    school,
    classes,
    students,
    resultStatuses,
    getNotificationsFor,
    markNotificationRead,
    computeClassResults,
  } = useDataStore();

  const termStatuses = resultStatuses.filter(
    (r) => r.term === CURRENT_TERM && r.academicYear === CURRENT_YEAR
  );
  const pending = termStatuses.filter((r) => r.status === 'submitted');
  const approved = termStatuses.filter((r) => r.status === 'approved');
  const notifications = getNotificationsFor('principal');

  const principalName =
    school?.principalName ??
    `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

  const stats = [
    { label: 'Total Classes',     value: classes.length,  icon: 'school',          iconBg: 'bg-primary/5 text-primary' },
    { label: 'Total Students',    value: students.length, icon: 'group',           iconBg: 'bg-secondary/5 text-secondary' },
    { label: 'Pending Approvals', value: pending.length,  icon: 'pending_actions', iconBg: 'bg-tertiary-fixed-dim/20 text-on-tertiary-container', alert: pending.length > 0 },
    { label: 'Approved Results',  value: approved.length, icon: 'verified',        iconBg: 'bg-secondary/5 text-secondary' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight">
              Dashboard
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">
              Welcome,{' '}
              <span className="font-semibold text-on-surface">{principalName}</span>
              {' '}— First Term · {CURRENT_YEAR}
            </p>
          </div>
          {school?.name && (
            <div className="ledger-card flex items-center gap-3 px-4 py-3">
              <Icon name="apartment" className="text-primary" />
              <div>
                <p className="font-bold text-on-surface text-sm">{school.name}</p>
                <p className="text-xs text-on-surface-variant">{school.address}</p>
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={`ledger-card p-4 flex items-start gap-4 cursor-pointer transition-opacity ${n.isRead ? 'opacity-40' : ''}`}
              >
                <span className={`p-2 rounded-lg flex-shrink-0 ${
                  n.type === 'approved' ? 'bg-secondary-container/40 text-on-secondary-container'
                  : n.type === 'rejected' ? 'bg-error-container text-on-error-container'
                  : 'bg-surface-container-low text-primary'
                }`}>
                  <Icon name={
                    n.type === 'approved' ? 'check_circle'
                    : n.type === 'rejected' ? 'cancel'
                    : 'notifications'
                  } />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-on-surface text-sm">{n.title}</p>
                  <p className="text-sm text-on-surface-variant mt-0.5">{n.message}</p>
                  <p className="text-xs text-on-surface-variant/60 mt-1">
                    {new Date(n.createdAt).toLocaleString('en-NG')}
                    {!n.isRead && (
                      <span className="ml-2 text-primary font-medium">· tap to dismiss</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="ledger-card p-4 sm:p-6">
              <div className="flex items-start justify-between mb-3 md:mb-4">
                <span className={`p-2 md:p-3 rounded-xl ${stat.iconBg}`}>
                  <Icon name={stat.icon} />
                </span>
                {'alert' in stat && stat.alert && (
                  <span className="text-[10px] font-bold text-error bg-error-container px-2 py-0.5 rounded-full">
                    Action needed
                  </span>
                )}
              </div>
              <p className="text-on-surface-variant text-[10px] md:text-xs uppercase tracking-widest font-bold">
                {stat.label}
              </p>
              <p className="font-headline font-extrabold text-2xl md:text-3xl text-primary mt-1">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Pending approvals */}
          <div className="ledger-card overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant/10 flex items-center justify-between">
              <h3 className="font-headline font-bold text-xl text-primary">Pending Approvals</h3>
              <button
                onClick={() => navigate('/principal/approvals')}
                className="text-sm text-primary font-semibold hover:underline"
              >
                View all
              </button>
            </div>
            {pending.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
                <Icon name="check_circle" className="text-4xl text-outline/30 mb-3" />
                <p className="text-sm">No pending approvals</p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/10">
                {pending.map((r) => {
                  const results = computeClassResults(r.classId, r.term, r.academicYear);
                  return (
                    <div key={r.classId} className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-on-surface">{r.className}</p>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {r.teacherName} · {results.length} students
                        </p>
                      </div>
                      <button
                        onClick={() => navigate('/principal/approvals')}
                        className="px-4 py-2 text-xs bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-xl font-bold hover:opacity-90 transition-opacity"
                      >
                        Review
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Approved results */}
          <div className="ledger-card overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant/10 flex items-center justify-between">
              <h3 className="font-headline font-bold text-xl text-primary">Approved Results</h3>
              <button
                onClick={() => navigate('/principal/downloads')}
                className="text-sm text-primary font-semibold hover:underline"
              >
                Downloads
              </button>
            </div>
            {approved.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
                <Icon name="download" className="text-4xl text-outline/30 mb-3" />
                <p className="text-sm">No approved results yet</p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/10">
                {approved.map((r) => (
                  <div key={r.classId} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-on-surface">{r.className}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {r.teacherName} · {r.studentCount} students
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/principal/downloads')}
                      className="px-4 py-2 text-xs border border-outline-variant/30 text-on-surface-variant rounded-xl font-bold hover:bg-surface-container-low transition-colors"
                    >
                      Print
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="ledger-card p-4 md:p-6">
          <h3 className="font-headline font-bold text-lg md:text-xl text-primary mb-4 md:mb-5">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Approvals', desc: `${pending.length} pending`,    icon: 'verified',  path: '/principal/approvals', highlight: pending.length > 0 },
              { label: 'Downloads', desc: 'Print approved results',        icon: 'download',  path: '/principal/downloads', highlight: false },
              { label: 'Classes',   desc: `${classes.length} classes`,     icon: 'school',    path: '/principal/classes',   highlight: false },
              { label: 'Settings',  desc: 'School configuration',          icon: 'settings',  path: '/principal/settings',  highlight: false },
            ].map((qa) => (
              <button
                key={qa.path}
                onClick={() => navigate(qa.path)}
                className={`p-4 md:p-5 rounded-xl text-left transition-all hover:shadow-card ${
                  qa.highlight
                    ? 'bg-gradient-to-br from-primary to-primary-container text-on-primary'
                    : 'bg-surface-container-low hover:bg-surface-container text-on-surface'
                }`}
              >
                <Icon name={qa.icon} className={`text-2xl mb-2 md:mb-3 block ${qa.highlight ? 'text-on-primary/80' : 'text-primary'}`} />
                <p className="font-bold text-sm">{qa.label}</p>
                <p className={`text-xs mt-0.5 ${qa.highlight ? 'text-on-primary/70' : 'text-on-surface-variant'}`}>
                  {qa.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Workflow reminder */}
        <div className="bg-gradient-to-br from-primary to-primary-container rounded-xl p-6">
          <h3 className="font-headline font-bold text-on-primary mb-4">Approval Workflow</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { n: 1, text: 'Teacher enters scores, psychometric & comments' },
              { n: 2, text: 'Teacher submits and notifies you' },
              { n: 3, text: 'You review, add comment & approve' },
              { n: 4, text: 'Results unlocked for download & print' },
            ].map((s) => (
              <div key={s.n} className="bg-on-primary/10 rounded-xl p-4 text-on-primary">
                <p className="font-headline font-black text-2xl mb-2">{s.n}</p>
                <p className="text-xs text-on-primary/80 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};