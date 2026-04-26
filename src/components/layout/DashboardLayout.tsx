import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useDataStore } from '@/store/dataStore';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const notifications = useDataStore((s) => s.notifications);
  const notifRole = user?.role === 'teacher' ? 'teacher' : 'principal';
  const notifCount = notifications.filter((n) => !n.isRead && n.for === notifRole).length;

  const handleLogout = () => { logout(); navigate('/login'); };

  const teacherLinks = [
    { to: '/teacher/dashboard',    label: 'Dashboard',      icon: 'dashboard' },
    { to: '/teacher/students',     label: 'Students',       icon: 'group' },
    { to: '/teacher/subjects',     label: 'Subjects',       icon: 'book' },
    { to: '/teacher/scores',       label: 'Score Entry',    icon: 'edit_note' },
    { to: '/teacher/psychometric', label: 'Psychometrics',  icon: 'psychology' },
    { to: '/teacher/comments',    label: 'Comments',       icon: 'chat' },
    { to: '/teacher/attendance',  label: 'Attendance',     icon: 'calendar_today' },
    { to: '/teacher/submit',      label: 'Submit Results', icon: 'send' },
  ];

  const principalLinks = [
    { to: '/principal/dashboard',  label: 'Dashboard',  icon: 'dashboard' },
    { to: '/principal/teachers',   label: 'Teachers',   icon: 'person_search' },
    { to: '/principal/classes',    label: 'Classes',    icon: 'school' },
    { to: '/principal/approvals',  label: 'Approvals',  icon: 'verified', badge: notifCount },
    { to: '/principal/downloads',  label: 'Downloads',  icon: 'download' },
    { to: '/principal/settings',   label: 'Settings',   icon: 'settings' },
  ];

  const navLinks = user?.role === 'teacher' ? teacherLinks : principalLinks;
  const isTeacher = user?.role === 'teacher';
  const userInitial = (user?.firstName?.[0] ?? 'U').toUpperCase();
  const userName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
  const userRole = isTeacher ? 'Class Teacher' : 'School Principal';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-8 pt-8 pb-10">
        <h1 className="font-headline font-black text-xl text-primary">Skora RMS</h1>
        <p className="text-on-surface-variant text-[10px] tracking-widest uppercase mt-1">
          Academic Ledger
        </p>
      </div>

      <nav className="flex-1 space-y-0.5">
        {navLinks.map((link) => {
          const isActive =
            location.pathname === link.to ||
            (link.to !== '/teacher/dashboard' &&
              link.to !== '/principal/dashboard' &&
              location.pathname.startsWith(link.to));
          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center justify-between px-6 py-3 transition-all duration-200 ${
  isActive ? 'nav-active' : 'nav-inactive hover:translate-x-1'
}`}
            >
              <span className="flex items-center gap-4 text-sm font-medium">
                <Icon name={link.icon} />
                {link.label}
              </span>
              {'badge' in link && (link as { badge?: number }).badge! > 0 && (
                <span className="bg-error text-on-error text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight">
                  {(link as { badge?: number }).badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pb-8 space-y-4">
        {isTeacher && (
          <Link
            to="/teacher/submit"
            className="block w-full bg-gradient-to-br from-primary to-primary-container text-on-primary py-3 rounded-xl font-headline font-bold text-sm text-center shadow-ambient hover:opacity-90 transition-opacity"
          >
            Submit Results
          </Link>
        )}
        <div className="pt-4 border-t border-outline-variant/15">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary font-bold text-sm flex-shrink-0">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-on-surface truncate">{userName}</p>
              <p className="text-[10px] text-on-surface-variant">{userRole}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-colors"
            >
              <Icon name="logout" className="text-base" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-surface">

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 h-screen sticky top-0 bg-surface-container-low flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-on-surface/30 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-surface-container-low flex flex-col shadow-ambient animate-slide-up">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="h-16 px-6 md:px-8 flex justify-between items-center bg-surface/80 backdrop-blur-md sticky top-0 z-40 shadow-[0px_12px_32px_rgba(7,30,39,0.04)]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors"
          >
            <Icon name="menu" />
          </button>

          <div className="hidden md:flex items-center gap-2 bg-surface-container-low rounded-full px-4 py-2 w-72 group">
            <Icon name="search" className="text-on-surface-variant/60 group-focus-within:text-primary transition-colors" />
            <input
              className="bg-transparent text-sm outline-none text-on-surface placeholder:text-on-surface-variant/50 w-full"
              placeholder="Search students, classes..."
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs bg-secondary-container/30 text-on-secondary-container px-3 py-1.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 bg-secondary rounded-full" />
              Offline Ready
            </div>

            <button className="relative p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors">
              <Icon name="notifications" />
              {notifCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border-2 border-surface" />
              )}
            </button>

            <div className="h-8 w-px bg-outline-variant/30" />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-primary leading-tight">{userName}</p>
                <p className="text-[10px] text-on-surface-variant">{userRole}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary font-bold text-sm">
                {userInitial}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="px-8 py-5 border-t border-outline-variant/15 bg-surface-container-low">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-[11px] text-on-surface-variant">
            <span className="font-headline font-bold text-primary">Skora RMS</span>
            <span>© {new Date().getFullYear()} Skora RMS — The Academic Ledger for Educators</span>
            <div className="flex gap-6">
              <a href="#" className="hover:text-primary transition-colors uppercase tracking-wide">Support</a>
              <a href="#" className="hover:text-primary transition-colors uppercase tracking-wide">Privacy</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};