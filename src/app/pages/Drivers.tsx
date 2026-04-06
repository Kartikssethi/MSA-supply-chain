import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Phone } from 'lucide-react';
import { apiGetDrivers } from '../api';
import type { Driver } from '../api/mockData';
import { cn } from '../utils/classnames';

export const Drivers = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetDrivers().then(data => {
      setDrivers(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Drivers</h2>
          <p className="text-slate-500 text-sm mt-1">Manage personnel and assignments.</p>
        </div>
        <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-full font-medium transition-all text-sm shadow-lg hover:shadow-xl border border-emerald-500/50">
          <Plus className="w-4 h-4" />
          Add Driver
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col w-full min-w-0 shadow-sm">
        <div className="p-4 flex flex-col sm:flex-row gap-4 justify-between border-b border-slate-200">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search drivers..."
              className="pl-10 pr-4 py-2 w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-900 placeholder:text-slate-400 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-sm font-medium text-slate-700 transition-colors">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-200">
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">License</th>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 font-semibold">Assignment</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 font-medium animate-pulse">Loading...</td>
                </tr>
              ) : drivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-200">
                        {driver.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-medium text-slate-900">{driver.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono">{driver.licenseNumber}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="w-3.5 h-3.5 opacity-40" /> {driver.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {driver.assignedVehicleId ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 font-mono">
                        {driver.assignedVehicleId.toUpperCase()}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold inline-flex items-center gap-1.5",
                      driver.status === 'Active' && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                      driver.status === 'On Leave' && "bg-blue-50 text-blue-700 border border-blue-200",
                      driver.status === 'Inactive' && "bg-slate-100 text-slate-600 border border-slate-200"
                    )}>
                      {driver.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-sm font-medium text-emerald-600 hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
