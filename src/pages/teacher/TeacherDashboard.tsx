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

export const TeacherDashboard = () => {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const {
    classes,
    getStudentsByClass,
    getSubjectsByClass,
    resultStatuses,
    getNotificationsFor,
    markNotificationRead,
  } = useDataStore();

  const totalStudents = classes.reduce((sum, c) => sum + getStudentsByClass(c.id).length, 0);
  const totalSubjects = classes.reduce((sum, c) => sum + getSubjectsByClass(c.id).length, 0);
  const notifications = getNotificationsFor('teacher');
  const unread = notifications.filter((n) => !n.isRead);

  const stats = [
    { label: 'My Classes',     value: classes.length, icon: 'school',        iconBg: 'bg-primary/5 text-primary' },
    { label: 'Total Students', value: totalStudents,  icon: 'group',         iconBg: 'bg-secondary/5 text-secondary' },
    { label: 'Total Subjects', value: totalSubjects,  icon: 'book',          iconBg: 'bg-on-tertiary-container/10 text-on-tertiary-container' },
    { label: 'Notifications',  value: unread.length,  icon: 'notifications', iconBg: 'bg-error/5 text-error' },
  ];

  const workflow = [
    { step: 1, label: 'Add Students',            path: '/teacher/students',     icon: 'group_add',  done: totalStudents > 0 },
    { step: 2, label: 'Add Subjects',            path: '/teacher/subjects',     icon: 'book',       done: totalSubjects > 0 },
    { step: 3, label: 'Enter Scores',            path: '/teacher/scores',       icon: 'edit_note',  done: false },
    { step: 4, label: 'Psychometric Assessment', path: '/teacher/psychometric', icon: 'psychology', done: false },
    { step: 5, label: 'Write Comments',          path: '/teacher/comments',     icon: 'chat',       done: false },
    { step: 6, label: 'Submit for Approval',     path: '/teacher/submit',       icon: 'send',       done: false },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">

        {/* Page header */}
        <div>
          <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight">
            Dashboard
          </h2>
          <p className="text-on-surface-variant text-sm mt-1">
            Welcome back,{' '}
            <span className="font-semibold text-on-surface">{user?.firstName}</span>
            {' '}— First Term · {CURRENT_YEAR}
          </p>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="ledger-card p-6">
              <div className="flex items-start justify-between mb-4">
                <span className={`p-3 rounded-xl ${stat.iconBg}`}>
                  <Icon name={stat.icon} />
                </span>
              </div>
              <p className="text-on-surface-variant text-xs uppercase tracking-widest font-bold">
                {stat.label}
              </p>
              <p className="font-headline font-extrabold text-3xl text-primary mt-1">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Workflow */}
          <div className="lg:col-span-2 ledger-card overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant/10">
              <h3 className="font-headline font-bold text-xl text-primary">Result Workflow</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Complete these steps in order to submit results
              </p>
            </div>
            <div className="divide-y divide-outline-variant/10">
              {workflow.map((w) => (
                <button
                  key={w.step}
                  onClick={() => navigate(w.path)}
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-surface-container-low/60 transition-colors text-left group"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    w.done
                      ? 'bg-secondary-container/40 text-on-secondary-container'
                      : 'bg-surface-container-highest text-on-surface-variant'
                  }`}>
                    {w.done ? <Icon name="check" className="text-sm" /> : w.step}
                  </div>
                  <Icon name={w.icon} className={`flex-shrink-0 ${w.done ? 'text-on-secondary-container' : 'text-on-surface-variant'}`} />
                  <span className={`text-sm font-medium flex-1 ${
                    w.done ? 'text-on-surface-variant line-through' : 'text-on-surface'
                  }`}>
                    {w.label}
                  </span>
                  <Icon name="chevron_right" className="text-outline/40 group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* My Classes */}
          <div className="ledger-card overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant/10">
              <h3 className="font-headline font-bold text-xl text-primary">My Classes</h3>
            </div>
            {classes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center text-on-surface-variant">
                <Icon name="school" className="text-4xl text-outline/30 mb-3" />
                <p className="text-sm">No classes yet — ask your principal to create and assign classes</p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/10">
                {classes.map((cls) => {
                  const studentCount = getStudentsByClass(cls.id).length;
                  const status = resultStatuses.find(
                    (r) => r.classId === cls.id && r.term === CURRENT_TERM && r.academicYear === CURRENT_YEAR
                  );
                  return (
                    <div key={cls.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-on-surface text-sm">{cls.name}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            {studentCount} students
                          </p>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          status?.status === 'approved' ? 'badge-validated'
                          : status?.status === 'submitted' ? 'badge-pending'
                          : status?.status === 'rejected' ? 'badge-error'
                          : 'bg-surface-container-highest text-on-surface-variant'
                        }`}>
                          {status?.status === 'approved' ? 'Approved'
                            : status?.status === 'submitted' ? 'Pending'
                            : status?.status === 'rejected' ? 'Returned'
                            : 'Draft'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Term banner */}
        <div className="bg-gradient-to-br from-primary to-primary-container rounded-xl p-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-on-primary/60 text-xs uppercase tracking-widest font-bold">Current Term</p>
            <h3 className="font-headline font-extrabold text-xl text-on-primary mt-1">
              First Term — {CURRENT_YEAR}
            </h3>
          </div>
          <div className="text-right">
            <p className="text-on-primary/60 text-xs uppercase tracking-widest font-bold">Submission Deadline</p>
            <p className="font-headline font-bold text-on-primary text-lg mt-1">December 15, 2024</p>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};