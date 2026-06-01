import { ReactNode, useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import * as syncManager from '@/lib/syncManager';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

interface AppNotification {
  id: string;
  type: 'result_submitted' | 'result_approved' | 'result_rejected' | 'general';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  classId?: string;
  term?: string;
  academicYear?: string;
  actionUrl?: string;
}

interface ToastNotif {
  id: string;
  title: string;
  message: string;
  type: AppNotification['type'];
}

const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

const formatTimeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
  return `${Math.round(diff / 86_400_000)}d ago`;
};

const LAST_SEEN_KEY = 'skora-notif-last-seen';

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastNotif[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncState, setSyncState] = useState<syncManager.SyncState>('idle');
  const [pendingCount, setPendingCount] = useState(syncManager.getCurrentCount());
  const bellRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const notifCount = notifications.filter((n) => !n.isRead).length;

  const loadNotifications = async () => {
    try {
      const ns = await api.get<AppNotification[]>('/notifications');
      setNotifications(ns);
      return ns;
    } catch {
      return [];
    }
  };

  useEffect(() => {
    // Initial load + auto-popup check
    loadNotifications().then((ns) => {
      const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
      const lastSeenTime = lastSeen ? new Date(lastSeen).getTime() : 0;

      // Find unread notifications newer than the last time we showed a popup
      const newUnread = ns.filter(
        (n) => !n.isRead && new Date(n.createdAt).getTime() > lastSeenTime,
      );

      if (newUnread.length > 0) {
        // Show up to 3 toasts, newest first
        const toShow = newUnread.slice(0, 3);
        setToasts(toShow.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
        })));
        // Update last-seen timestamp to now so we don't show these again
        localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
      }
    });

    // Online/offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Sync state listener
    const unsubSync = syncManager.onSyncStateChange((state, count) => {
      setSyncState(state);
      setPendingCount(count);
    });

    // Refresh notifications after a sync completes
    const handleSyncDone = () => loadNotifications();
    window.addEventListener('skora:sync-complete', handleSyncDone);

    // Refresh notifications when a new one is triggered by any page action
    const handleNewNotif = () => loadNotifications();
    window.addEventListener('skora:notification-sent', handleNewNotif);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('skora:sync-complete', handleSyncDone);
      window.removeEventListener('skora:notification-sent', handleNewNotif);
      unsubSync();
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(e.target as Node)
      ) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-dismiss toasts after 5 seconds each
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 5000);
    return () => clearTimeout(timer);
  }, [toasts]);

  const handleBellClick = () => {
    setNotifOpen((prev) => !prev);
  };

  const handleNotifClick = async (notif: AppNotification) => {
    // Mark as read
    try {
      await api.put(`/notifications/${notif.id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
      );
    } catch {}

    // Close the dropdown
    setNotifOpen(false);

    // Navigate to the action page if one is set
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const teacherLinks = [
    { to: '/teacher/dashboard',    label: 'Dashboard',      icon: 'dashboard' },
    { to: '/teacher/students',     label: 'Students',       icon: 'group' },
    { to: '/teacher/subjects',     label: 'Subjects',       icon: 'book' },
    { to: '/teacher/scores',       label: 'Score Entry',    icon: 'edit_note' },
    { to: '/teacher/psychometric', label: 'Psychometrics',  icon: 'psychology' },
    { to: '/teacher/comments',     label: 'Comments',       icon: 'chat' },
    { to: '/teacher/attendance',   label: 'Attendance',     icon: 'calendar_today' },
    { to: '/teacher/submit',       label: 'Submit Results', icon: 'send' },
  ];

  const principalLinks = [
    { to: '/principal/dashboard',  label: 'Dashboard',  icon: 'dashboard' },
    { to: '/principal/teachers',   label: 'Teachers',   icon: 'person_search' },
    { to: '/principal/classes',    label: 'Classes',    icon: 'school' },
    { to: '/principal/approvals',  label: 'Approvals',  icon: 'verified', badge: notifCount },
    { to: '/principal/downloads',  label: 'Downloads',  icon: 'download' },
    { to: '/principal/settings',   label: 'Settings',   icon: 'settings' },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/admin/schools',   label: 'Schools',   icon: 'apartment' },
    { to: '/admin/batches',   label: 'Batches',   icon: 'style' },
    { to: '/admin/revenue',   label: 'Revenue',   icon: 'payments' },
    { to: '/admin/payouts',   label: 'Payouts',   icon: 'account_balance' },
  ];

  const isAdmin = user?.role === 'super_admin';
  const navLinks = user?.role === 'teacher' ? teacherLinks : isAdmin ? adminLinks : principalLinks;
  const isTeacher = user?.role === 'teacher';
  const userInitial = (user?.firstName?.[0] ?? 'U').toUpperCase();
  const userName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
  const userRole = isTeacher ? 'Class Teacher' : isAdmin ? 'Platform Administrator' : 'School Principal';

  const teacherMobileLinks = [
    { to: '/teacher/dashboard',  label: 'Home',     icon: 'dashboard' },
    { to: '/teacher/students',   label: 'Students', icon: 'group' },
    { to: '/teacher/scores',     label: 'Scores',   icon: 'edit_note' },
    { to: '/teacher/submit',     label: 'Submit',   icon: 'send' },
  ];
  const adminMobileLinks = [
    { to: '/admin/dashboard', label: 'Home',    icon: 'dashboard' },
    { to: '/admin/schools',   label: 'Schools', icon: 'apartment' },
    { to: '/admin/batches',   label: 'Batches', icon: 'style' },
    { to: '/admin/revenue',   label: 'Revenue', icon: 'payments' },
  ];
  const principalMobileLinks = [
    { to: '/principal/dashboard', label: 'Home',      icon: 'dashboard' },
    { to: '/principal/approvals', label: 'Approvals', icon: 'verified', badge: notifCount },
    { to: '/principal/downloads', label: 'Downloads', icon: 'download' },
    { to: '/principal/settings',  label: 'Settings',  icon: 'settings' },
  ];
  const mobileLinks = isTeacher ? teacherMobileLinks : isAdmin ? adminMobileLinks : principalMobileLinks;

  const isLinkActive = (to: string) =>
    location.pathname === to ||
    (to !== '/teacher/dashboard' &&
      to !== '/principal/dashboard' &&
      location.pathname.startsWith(to));

  const getNotifIcon = (type: AppNotification['type']) => {
    if (type === 'result_submitted') return 'send';
    if (type === 'result_approved') return 'verified';
    if (type === 'result_rejected') return 'undo';
    return 'notifications';
  };

  const getNotifColor = (type: AppNotification['type']) => {
    if (type === 'result_approved') return 'text-secondary';
    if (type === 'result_rejected') return 'text-error';
    return 'text-primary';
  };

  // Sync status bar content
  const SyncBar = () => {
    if (isOnline && syncState === 'idle' && pendingCount === 0) return null;
    if (syncState === 'synced') return (
      <div className="flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-semibold bg-secondary text-on-secondary">
        <Icon name="cloud_done" className="text-sm" /> All changes synced
      </div>
    );
    if (syncState === 'syncing') return (
      <div className="flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-semibold bg-primary text-on-primary">
        <span className="w-3 h-3 border border-on-primary/40 border-t-on-primary rounded-full animate-spin" />
        Syncing {pendingCount} change{pendingCount !== 1 ? 's' : ''}…
      </div>
    );
    if (!isOnline) return (
      <div className="flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-semibold bg-error-container text-on-error-container">
        <Icon name="cloud_off" className="text-sm" />
        Offline — changes saved locally{pendingCount > 0 ? ` (${pendingCount} pending)` : ''}
      </div>
    );
    if (pendingCount > 0) return (
      <div className="flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-semibold bg-tertiary-fixed text-on-tertiary-fixed-variant">
        <Icon name="sync" className="text-sm" />
        {pendingCount} change{pendingCount !== 1 ? 's' : ''} queued — tap to sync
        <button onClick={() => syncManager.syncNow()} className="underline font-bold ml-1">
          Sync now
        </button>
      </div>
    );
    return null;
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-8 pt-8 pb-10">
        <h1 className="font-headline font-black text-xl text-primary">Skora RMS</h1>
        <p className="text-on-surface-variant text-[10px] tracking-widest uppercase mt-1">
          Academic Ledger
        </p>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {navLinks.map((link) => {
          const isActive = isLinkActive(link.to);
          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center justify-between px-6 py-3.5 transition-all duration-200 ${
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
              className="h-10 w-10 flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-colors"
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
          <aside className="absolute left-0 top-0 bottom-0 w-[85vw] max-w-72 bg-surface-container-low flex flex-col shadow-ambient animate-slide-up">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Toast pop-up alerts — top-right corner */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-surface-container-low shadow-ambient rounded-xl p-4 flex items-start gap-3 border border-outline-variant/20 animate-fade-in"
          >
            <span className={`material-symbols-outlined text-lg flex-shrink-0 mt-0.5 ${getNotifColor(toast.type)}`}>
              {getNotifIcon(toast.type)}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-on-surface text-sm">{toast.title}</p>
              <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{toast.message}</p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="flex-shrink-0 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <Icon name="close" className="text-base" />
            </button>
          </div>
        ))}
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Sync / Connectivity Status Bar */}
        <SyncBar />

        {/* Topbar */}
        <header className="h-14 md:h-16 px-4 md:px-8 flex justify-between items-center bg-surface/80 backdrop-blur-md sticky top-0 z-40 shadow-[0px_12px_32px_rgba(7,30,39,0.04)]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden h-11 w-11 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors"
            >
              <Icon name="menu" />
            </button>
            <span className="md:hidden font-headline font-black text-base text-primary">Skora RMS</span>
          </div>

          <div className="hidden md:flex items-center gap-2 bg-surface-container-low rounded-full px-4 py-2 w-72 group">
            <Icon name="search" className="text-on-surface-variant/60 group-focus-within:text-primary transition-colors" />
            <input
              className="bg-transparent text-sm outline-none text-on-surface placeholder:text-on-surface-variant/50 w-full"
              placeholder="Search students, classes..."
            />
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {/* Connectivity pill */}
            <div className={`hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              isOnline
                ? 'bg-secondary-container/30 text-on-secondary-container'
                : 'bg-error-container text-on-error-container'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-secondary' : 'bg-error'}`} />
              <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            {/* Notification bell + dropdown */}
            <div className="relative">
              <button
                ref={bellRef}
                onClick={handleBellClick}
                className="relative h-11 w-11 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors"
              >
                <Icon name="notifications" />
                {notifCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-surface" />
                )}
              </button>

              {/* Dropdown panel */}
              {notifOpen && (
                <div
                  ref={dropdownRef}
                  className="absolute right-0 top-12 w-80 bg-surface-container-low rounded-2xl shadow-ambient border border-outline-variant/15 overflow-hidden z-50"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/10">
                    <span className="font-headline font-bold text-sm text-on-surface">Notifications</span>
                    {notifCount > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-error text-on-error rounded-full">
                        {notifCount} unread
                      </span>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-outline-variant/10">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-on-surface-variant">
                        <Icon name="notifications_none" className="text-3xl text-outline/30 mb-2" />
                        <p className="text-sm font-bold">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <button
                          key={n.id}
                          onClick={() => handleNotifClick(n)}
                          className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-surface-container transition-colors ${
                            !n.isRead ? 'bg-primary/3' : ''
                          }`}
                        >
                          <span className={`material-symbols-outlined text-base flex-shrink-0 mt-0.5 ${getNotifColor(n.type)}`}>
                            {getNotifIcon(n.type)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm leading-snug ${!n.isRead ? 'font-bold text-on-surface' : 'font-medium text-on-surface-variant'}`}>
                                {n.title}
                              </p>
                              {!n.isRead && (
                                <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{n.message}</p>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-[10px] text-on-surface-variant/60">{formatTimeAgo(n.createdAt)}</p>
                              {n.actionUrl && (
                                <span className="text-[10px] font-bold text-primary flex items-center gap-0.5">
                                  View <Icon name="arrow_forward" className="text-xs" />
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-2.5 border-t border-outline-variant/10 bg-surface-container-low">
                      <button
                        onClick={async () => {
                          try {
                            await api.put('/notifications/mark-all-read');
                            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                          } catch {}
                        }}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Mark all as read
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-outline-variant/30 hidden sm:block" />

            <div className="flex items-center gap-2 md:gap-3">
              <div className="text-right hidden md:block">
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
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto">
          {children}
        </main>

        {/* Footer — desktop only */}
        <footer className="hidden md:block px-8 py-5 border-t border-outline-variant/15 bg-surface-container-low">
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

      {/* Mobile bottom navigation bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-surface-container-low/95 backdrop-blur-md border-t border-outline-variant/15 flex items-stretch"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {mobileLinks.map((link) => {
          const isActive = isLinkActive(link.to);
          const badge = 'badge' in link ? (link as { badge?: number }).badge ?? 0 : 0;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`relative flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] transition-colors ${
                isActive ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              <span
                className="material-symbols-outlined text-[22px] leading-none"
                style={isActive ? { fontVariationSettings: '"FILL" 1, "wght" 600, "GRAD" 0, "opsz" 24' } : {}}
              >
                {link.icon}
              </span>
              <span className={`text-[9px] font-bold tracking-wide ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
                {link.label}
              </span>
              {badge > 0 && (
                <span className="absolute top-1.5 right-[calc(50%-14px)] h-4 min-w-[16px] bg-error text-on-error text-[9px] font-black rounded-full flex items-center justify-center px-1">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

    </div>
  );
};