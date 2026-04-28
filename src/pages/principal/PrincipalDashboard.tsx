import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { useDataStore } from '@/store/dataStore';
import { api } from '@/lib/api';
import { Class, School } from '@/types';

const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

interface ClassResult {
  id: string;
  classId: string;
  className: string;
  teacherName: string;
  term: string;
  academicYear: string;
  status: 'submitted' | 'approved' | 'rejected';
  submittedAt?: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const PrincipalDashboard = () => {
  const user = useAuthStore((s) => s.user);
  const { school, setSchool } = useDataStore();
  const navigate = useNavigate();
  const schoolId = user?.schoolId ?? '';

  const [classes, setClasses] = useState<Class[]>([]);
  const [results, setResults] = useState<ClassResult[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    Promise.all([
      api.get<School>(`/schools/${schoolId}`),
      api.get<Class[]>(`/schools/${schoolId}/classes`),
      api.get<ClassResult[]>(`/schools/${schoolId}/results`),
      api.get<Notification[]>('/notifications'),
    ]).then(([s, cls, res, notifs]) => {
      setSchool(s);
      setClasses(cls);
      setResults(res);
      setNotifications(notifs);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [schoolId]);

  const pending = results.filter((r) => r.status === 'submitted');
  const approved = results.filter((r) => r.status === 'approved');
  const totalStudents = classes.reduce((sum, c) => sum + ((c as any).studentCount ?? 0), 0);

  const principalName =
    school?.principalName ??
    `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

  const stats = [
    { label: 'Total Classes',     value: classes.length,  icon: 'school',          iconBg: 'bg-primary/5 text-primary' },
    { label: 'Total Students',    value: totalStudents,   icon: 'group',           iconBg: 'bg-secondary/5 text-secondary' },
    { label: 'Pending Approvals', value: pending.length,  icon: 'pending_actions', iconBg: 'bg-tertiary-fixed-dim/20 text-on-tertiary-container', alert: pending.length > 0 },
    { label: 'Approved Results',  value: approved.length, icon: 'verified',        iconBg: 'bg-secondary/5 text-secondary' },
  ];

  const handleMarkRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight">Dashboard</h2>
            <p className="text-on-surface-variant text-sm mt-1">
              Welcome, <span className="font-semibold text-on-surface">{principalName}</span>
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
        {notifications.filter((n) => !n.isRead).length > 0 && (
          <div className="space-y-2">
            {notifications.filter((n) => !n.isRead).map((n) => (
              <div
                key={n.id}
                onClick={() => handleMarkRead(n.id)}
                className="ledger-card p-4 flex items-start gap-4 cursor-pointer transition-opacity"
              >
                <span className={`p-2 rounded-lg flex-shrink-0 ${
                  n.type === 'result_approved' ? 'bg-secondary-container/40 text-on-secondary-container'
                  : n.type === 'result_rejected' ? 'bg-error-container text-on-error-container'
                  : 'bg-surface-container-low text-primary'
                }`}>
                  <Icon name={n.type === 'result_approved' ? 'check_circle' : n.type === 'result_rejected' ? 'cancel' : 'notifications'} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-on-surface text-sm">{n.title}</p>
                  <p className="text-sm text-on-surface-variant mt-0.5">{n.message}</p>
                  <p className="text-xs text-on-surface-variant/60 mt-1">
                    {new Date(n.createdAt).toLocaleString('en-NG')}
                    <span className="ml-2 text-primary font-medium">· tap to dismiss</span>
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
                  <span className="text-[10px] font-bold text-error bg-error-container px-2 py-0.5 rounded-full">Action needed</span>
                )}
              </div>
              <p className="text-on-surface-variant text-[10px] md:text-xs uppercase tracking-widest font-bold">{stat.label}</p>
              <p className="font-headline font-extrabold text-2xl md:text-3xl text-primary mt-1">
                {loading ? <span className="block w-8 h-7 bg-surface-container-highest rounded animate-pulse" /> : stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Pending approvals */}
          <div className="ledger-card overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant/10 flex items-center justify-between">
              <h3 className="font-headline font-bold text-xl text-primary">Pending Approvals</h3>
              <button onClick={() => navigate('/principal/approvals')} className="text-sm text-primary font-semibold hover:underline">View all</button>
            </div>
            {pending.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
                <Icon name="check_circle" className="text-4xl text-outline/30 mb-3" />
                <p className="text-sm">No pending approvals</p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/10">
                {pending.map((r) => (
                  <div key={r.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-on-surface">{r.className}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{r.teacherName} · {r.term} term</p>
                    </div>
                    <button
                      onClick={() => navigate('/principal/approvals')}
                      className="px-4 py-2 text-xs bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-xl font-bold hover:opacity-90 transition-opacity"
                    >
                      Review
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Approved results */}
          <div className="ledger-card overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant/10 flex items-center justify-between">
              <h3 className="font-headline font-bold text-xl text-primary">Approved Results</h3>
              <button onClick={() => navigate('/principal/downloads')} className="text-sm text-primary font-semibold hover:underline">Downloads</button>
            </div>
            {approved.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
                <Icon name="download" className="text-4xl text-outline/30 mb-3" />
                <p className="text-sm">No approved results yet</p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/10">
                {approved.map((r) => (
                  <div key={r.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-on-surface">{r.className}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{r.teacherName}</p>
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
                className={`p-4 md:p-5 rounded-xl text-left transition-all hover:shadow-card ${qa.highlight ? 'bg-gradient-to-br from-primary to-primary-container text-on-primary' : 'bg-surface-container-low hover:bg-surface-container text-on-surface'}`}
              >
                <Icon name={qa.icon} className={`text-2xl mb-2 md:mb-3 block ${qa.highlight ? 'text-on-primary/80' : 'text-primary'}`} />
                <p className="font-bold text-sm">{qa.label}</p>
                <p className={`text-xs mt-0.5 ${qa.highlight ? 'text-on-primary/70' : 'text-on-surface-variant'}`}>{qa.desc}</p>
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
