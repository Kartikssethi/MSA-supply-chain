import { NavLink } from 'react-router';
import { LayoutDashboard, Truck, Users, Map, Wrench, Route, Radar, ClipboardCheck } from 'lucide-react';
import { cn } from '../../utils/classnames';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Vehicles', path: '/vehicles', icon: Truck },
  { name: 'Drivers', path: '/drivers', icon: Users },
  { name: 'Trips', path: '/trips', icon: Route },
  { name: 'Tracking', path: '/tracking', icon: Map },
  { name: 'Dispatch', path: '/dispatch', icon: ClipboardCheck },
  { name: 'Maintenance', path: '/maintenance', icon: Wrench },
  { name: 'Operations', path: '/operations', icon: Radar },
];

type SidebarProps = {
  className?: string;
  onNavigate?: () => void;
};

export const Sidebar = ({ className, onNavigate }: SidebarProps) => {
  return (
    <aside className={cn("w-64 bg-[#f8faf9] border-r border-slate-200 flex flex-col flex-shrink-0 shadow-sm", className)}>
      <div className="p-6">
        <h1 className="text-xl font-bold text-slate-900 tracking-wide flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Truck className="w-5 h-5 text-emerald-600" />
          </div>
          FleetFlow
        </h1>
      </div>

      <nav className="flex-1 mt-4">
        <ul className="space-y-1 px-4">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm border border-transparent",
                    isActive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )
                }
              >
                <item.icon className="w-5 h-5 opacity-80" />
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-6 mt-auto">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-widest font-semibold">System Status</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
            <span className="text-slate-900 text-sm font-medium">Operational</span>
          </div>
        </div>
      </div>
    </aside>
  );
};