import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Trash2, Truck } from 'lucide-react';
import {
  fleetGetDrivers,
  fleetCreateDriver,
  fleetDeleteDriver,
  type FleetDriver,
} from '../api/fleetApi';
import { cn } from '../utils/classnames';

export const Drivers = () => {
  const [drivers, setDrivers] = useState<FleetDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<FleetDriver | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  const filteredDrivers = useMemo(() => {
    const s = searchTerm.trim().toLowerCase();
    if (!s) return drivers;
    return drivers.filter(
      (d) =>
        d.name.toLowerCase().includes(s) ||
        d.license.toLowerCase().includes(s) ||
        (d.assigned_vehicle_plate || '').toLowerCase().includes(s)
    );
  }, [drivers, searchTerm]);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const data = await fleetGetDrivers();
      setDrivers(data);
    } catch {
      setError('Failed to load drivers. Is the Fleet Service running on port 8002?');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const handleAddDriver = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    try {
      await fleetCreateDriver({
        name: formData.get('name') as string,
        license: formData.get('license') as string,
      });
      setIsAddModalOpen(false);
      loadDrivers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Remove this driver?')) {
      try {
        await fleetDeleteDriver(id);
        loadDrivers();
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Drivers</h2>
          <p className="text-slate-500 text-sm mt-1">Manage personnel and assignments.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-full font-medium transition-all text-sm shadow-lg hover:shadow-xl border border-emerald-500/50"
        >
          <Plus className="w-4 h-4" />
          Add Driver
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
          <button onClick={() => setError('')} className="ml-3 text-rose-500 hover:text-rose-800 font-bold">&times;</button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col w-full min-w-0 shadow-sm">
        <div className="p-4 flex flex-col sm:flex-row gap-4 justify-between border-b border-slate-200">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search drivers..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10 pr-4 py-2 w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-900 placeholder:text-slate-400 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-200">
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">License</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Assignment</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 font-medium animate-pulse">Loading...</td>
                </tr>
              ) : filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    {drivers.length === 0 ? 'No drivers yet. Add one to get started!' : 'No drivers matched your search.'}
                  </td>
                </tr>
              ) : filteredDrivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-200">
                        {driver.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-medium text-slate-900">{driver.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono">{driver.license}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold inline-flex items-center gap-1.5",
                      driver.status
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    )}>
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        driver.status ? "bg-emerald-500" : "bg-slate-400"
                      )}></span>
                      {driver.status === "Active"? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {driver.assigned_vehicle_plate ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700">
                        <Truck className="w-3 h-3" />
                        {driver.assigned_vehicle_plate}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setSelectedDriver(driver)}
                        className="text-sm font-medium text-emerald-600 hover:text-emerald-500 px-2 py-1 rounded transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(driver.id)}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Driver Detail Modal */}
      {selectedDriver && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-900">Driver Details</h3>
              <button onClick={() => setSelectedDriver(null)} className="text-slate-500 hover:text-slate-900 transition-colors text-2xl leading-none" aria-label="Close driver details">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Name</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{selectedDriver.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">License Number</p>
                <p className="mt-1 text-sm font-mono text-slate-700">{selectedDriver.license}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Status</p>
                <p className="mt-1 text-sm text-slate-700">{selectedDriver.status === "Active" ? 'Active' : 'Inactive'}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Assigned Vehicle</p>
                <p className="mt-1 text-sm text-slate-700">
                  {selectedDriver.assigned_vehicle_plate || 'Unassigned'}
                </p>
              </div>
              <div className="pt-2 flex justify-end">
                <button onClick={() => setSelectedDriver(null)} className="px-5 py-2.5 rounded-full text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Driver Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-900">Add Driver</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500 hover:text-slate-900 transition-colors text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleAddDriver} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Full Name</label>
                <input required name="name" type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-900 placeholder:text-slate-400 transition-all" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">License Number</label>
                <input required name="license" type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-900 placeholder:text-slate-400 transition-all" placeholder="CDL-123456" />
              </div>
              <div className="pt-6 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 rounded-full text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-sm font-medium transition-all shadow-lg hover:shadow-xl border border-emerald-500/50">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
