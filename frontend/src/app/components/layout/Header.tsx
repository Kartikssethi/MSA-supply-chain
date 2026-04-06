import { Bell, Search, Menu, UserCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router';
import { getCurrentUser, signOut } from '../../utils/auth';

export const Header = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const displayName = user?.name || 'Admin';
  const displaySubtext = user?.email || 'Manager';

  const onSignOut = () => {
    signOut();
    navigate('/auth');
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 z-10 sticky top-0 flex-shrink-0 shadow-sm">
      <div className="flex items-center gap-4">
        <button className="md:hidden text-slate-600 hover:text-slate-900 transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search resources..."
            className="pl-10 pr-4 py-2 w-80 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-900 placeholder:text-slate-400 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onSignOut}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>

        <button className="relative p-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)] border border-white"></span>
        </button>

        <div className="h-6 w-px bg-slate-200 mx-2"></div>

        <button className="flex items-center gap-3 hover:bg-slate-50 p-1.5 pr-3 rounded-full border border-transparent hover:border-slate-200 transition-all">
          <UserCircle className="w-8 h-8 text-emerald-600" />
          <div className="flex flex-col items-start hidden sm:flex">
            <span className="text-sm font-medium text-slate-900 leading-none">{displayName}</span>
            <span className="text-[10px] text-slate-500 mt-1 tracking-wide">{displaySubtext}</span>
          </div>
        </button>
      </div>
    </header>
  );
};