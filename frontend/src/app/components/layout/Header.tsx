import { useEffect, useRef, useState } from 'react';
import { Bell, Search, Menu, UserCircle, LogOut, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router';
import { getCurrentUser, signOut } from '../../utils/auth';

const NOTIFICATIONS = [
  {
    id: 'maintenance-reminder',
    title: 'Vehicle VH-204 due for maintenance',
    time: '10 min ago',
  },
  {
    id: 'trip-delay',
    title: 'Trip T-112 reported minor route delay',
    time: '26 min ago',
  },
  {
    id: 'driver-checkin',
    title: 'Driver check-in completed for morning shift',
    time: '1 hr ago',
  },
];

type HeaderProps = {
  onOpenSidebar: () => void;
  onOpenCommandPalette: () => void;
};

export const Header = ({ onOpenSidebar, onOpenCommandPalette }: HeaderProps) => {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const user = getCurrentUser();
  const displayName = user?.name || 'Admin';
  const displaySubtext = user?.email || 'Manager';
  const displayPermission = user?.permission || 'Fleet Manager';

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }

      if (!notificationsRef.current?.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const onSignOut = () => {
    signOut();
    navigate('/auth');
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 z-10 sticky top-0 flex-shrink-0 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenSidebar}
          className="md:hidden text-slate-600 hover:text-slate-900 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <button
          onClick={onOpenCommandPalette}
          className="group hidden h-10 items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500 transition-all hover:border-emerald-200 hover:bg-white hover:text-slate-700 md:flex"
          aria-label="Open command palette"
        >
          <span className="text-slate-400 group-hover:text-emerald-500">
            <Search className="w-4 h-4" />
          </span>
          <span>Quick search or jump...</span>
          <span className="ml-4 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Ctrl/Cmd + K
          </span>
        </button>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onSignOut}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>

        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => {
              setIsNotificationsOpen((open: boolean) => !open);
              setIsProfileOpen(false);
            }}
            className="relative p-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)] border border-white"></span>
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.5)]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Notifications</p>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                  {NOTIFICATIONS.length} New
                </span>
              </div>

              <div className="mt-3 space-y-2">
                {NOTIFICATIONS.map((notification) => (
                  <div key={notification.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <p className="text-sm text-slate-800">{notification.title}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">{notification.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 mx-2"></div>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setIsProfileOpen((open: boolean) => !open);
              setIsNotificationsOpen(false);
            }}
            className="flex items-center gap-3 hover:bg-slate-50 p-1.5 pr-3 rounded-full border border-transparent hover:border-slate-200 transition-all"
          >
            <UserCircle className="w-8 h-8 text-emerald-600" />
            <div className="hidden flex-col items-start sm:flex">
              <span className="text-sm font-medium text-slate-900 leading-none">{displayName}</span>
              <span className="text-[10px] text-slate-500 mt-1 tracking-wide">{displaySubtext}</span>
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.5)]">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Profile</p>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <p>
                  <span className="font-semibold text-slate-900">Name:</span> {displayName}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Email:</span> {displaySubtext}
                </p>
                <p className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>
                    <span className="font-semibold text-slate-900">Permission:</span> {displayPermission}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};