import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, Trash2, UserPlus, UserMinus, Truck } from 'lucide-react';
import {
  fleetGetVehicles,
  fleetCreateVehicle,
  fleetDeleteVehicle,
  fleetGetDrivers,
  fleetAssignDriver,
  fleetUnassignDriver,
  type FleetVehicle,
  type FleetDriver,
} from '../api/fleetApi';
import { cn } from '../utils/classnames';

export const Vehicles = () => {
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [drivers, setDrivers] = useState<FleetDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [assignModal, setAssignModal] = useState<FleetVehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const filteredVehicles = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return vehicles.filter((vehicle) => {
      const matchesSearch = !normalizedSearch
        || vehicle.plate_number.toLowerCase().includes(normalizedSearch)
        || vehicle.model.toLowerCase().includes(normalizedSearch)
        || vehicle.v_type.toLowerCase().includes(normalizedSearch)
        || (vehicle.current_driver_name || '').toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === 'All' || vehicle.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [vehicles, searchTerm, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [v, d] = await Promise.all([fleetGetVehicles(), fleetGetDrivers()]);
      setVehicles(v);
      setDrivers(d);
    } catch (e) {
      setError('Failed to load fleet data. Is the Fleet Service running on port 8002?');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (busy) return;
    if (confirm('Remove this vehicle?')) {
      setBusy(true);
      try {
        await fleetDeleteVehicle(id);
        await loadData();
      } finally {
        setBusy(false);
      }
    }
  };

  const handleAddVehicle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    const formData = new FormData(e.currentTarget);
    try {
      await fleetCreateVehicle({
        plate_number: formData.get('plate_number') as string,
        model: formData.get('model') as string,
        v_type: formData.get('v_type') as string,
      });
      setIsAddModalOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleAssign = async (driverId: string) => {
    if (!assignModal || busy) return;
    setError('');
    setBusy(true);
    try {
      await fleetAssignDriver(assignModal.id, driverId);
      setAssignModal(null);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleUnassign = async (vehicleId: string) => {
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      await fleetUnassignDriver(vehicleId);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  // Available drivers for assignment (not currently assigned to anything)
  const availableDrivers = drivers.filter(d => !d.assigned_vehicle_plate && d.status);

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Vehicles</h2>
          <p className="text-slate-500 text-sm mt-1">Fleet registry, status, and driver assignments.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-full font-medium transition-all text-sm shadow-lg hover:shadow-xl border border-emerald-500/50"
        >
          <Plus className="w-4 h-4" />
          Add Vehicle
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
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10 pr-4 py-2 w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-900 placeholder:text-slate-400 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
                aria-label="Filter vehicles by status"
              >
                <option value="All">All statuses</option>
                <option value="Available">Available</option>
                <option value="In Use">In Use</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter('All'); }}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-200">
                <th className="px-6 py-4 font-semibold">Plate</th>
                <th className="px-6 py-4 font-semibold">Model</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Assigned Driver</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 font-medium animate-pulse">Loading...</td>
                </tr>
              ) : filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    {vehicles.length === 0 ? 'No vehicles yet. Add one to get started!' : 'No vehicles matched your filters.'}
                  </td>
                </tr>
              ) : filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                        <Truck className="w-4 h-4" />
                      </div>
                      <span className="text-sm text-slate-900 font-semibold font-mono">{vehicle.plate_number}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{vehicle.model}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{vehicle.v_type}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold inline-flex items-center gap-1.5",
                      vehicle.status === 'Available' && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                      vehicle.status === 'In Use' && "bg-blue-50 text-blue-700 border border-blue-200",
                      vehicle.status === 'Maintenance' && "bg-slate-100 text-slate-600 border border-slate-200"
                    )}>
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        vehicle.status === 'Available' && "bg-emerald-500",
                        vehicle.status === 'In Use' && "bg-blue-500",
                        vehicle.status === 'Maintenance' && "bg-slate-500"
                      )}></span>
                      {vehicle.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {vehicle.current_driver_name ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700">
                          {vehicle.current_driver_name}
                        </span>
                        <button
                          onClick={() => handleUnassign(vehicle.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Unassign driver"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAssignModal(vehicle)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-dashed border-slate-300 text-xs text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                      >
                        <UserPlus className="w-3 h-3" />
                        Assign
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleDelete(vehicle.id)} className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition-colors">
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

      {/* Add Vehicle Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-900">Add Vehicle</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500 hover:text-slate-900 transition-colors text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleAddVehicle} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Plate Number</label>
                <input required name="plate_number" type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-900 placeholder:text-slate-400 transition-all" placeholder="MH-04-AB-1234" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Model</label>
                <input required name="model" type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-900 placeholder:text-slate-400 transition-all" placeholder="Tata Ace" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Type</label>
                <select required name="v_type" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-900 appearance-none transition-all">
                  <option value="Truck">Truck</option>
                  <option value="Van">Van</option>
                  <option value="Trailer">Trailer</option>
                  <option value="Tanker">Tanker</option>
                </select>
              </div>
              <div className="pt-6 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 rounded-full text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" disabled={busy} className={cn("px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-sm font-medium transition-all shadow-lg hover:shadow-xl border border-emerald-500/50", busy && "opacity-50 cursor-not-allowed")}>{busy ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Driver Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Assign Driver</h3>
                <p className="text-xs text-slate-500 mt-1">Vehicle: <span className="font-mono font-semibold">{assignModal.plate_number}</span></p>
              </div>
              <button onClick={() => setAssignModal(null)} className="text-slate-500 hover:text-slate-900 transition-colors text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6">
              {availableDrivers.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No available drivers. All drivers are currently assigned.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableDrivers.map((driver) => (
                    <button
                      key={driver.id}
                      onClick={() => handleAssign(driver.id)}
                      disabled={busy}
                      className={cn("w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all group", busy && "opacity-50 cursor-not-allowed")}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-200">
                          {driver.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-slate-900">{driver.name}</p>
                          <p className="text-xs text-slate-500 font-mono">{driver.license}</p>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Assign →
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <div className="pt-4 flex justify-end">
                <button onClick={() => setAssignModal(null)} className="px-5 py-2.5 rounded-full text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};