import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, Trash2, Edit2 } from 'lucide-react';
import { apiGetVehicles, apiDeleteVehicle, apiCreateVehicle } from '../api';
import type { Vehicle } from '../api/mockData';
import { cn } from '../utils/classnames';

export const Vehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | Vehicle['status']>('All');

  const filteredVehicles = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return vehicles.filter((vehicle) => {
      const matchesSearch = !normalizedSearch
        || vehicle.id.toLowerCase().includes(normalizedSearch)
        || vehicle.number.toLowerCase().includes(normalizedSearch)
        || vehicle.type.toLowerCase().includes(normalizedSearch)
        || vehicle.capacity.toLowerCase().includes(normalizedSearch);

      const matchesStatus = statusFilter === 'All' || vehicle.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [vehicles, searchTerm, statusFilter]);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = () => {
    setLoading(true);
    apiGetVehicles().then(data => {
      setVehicles(data);
      setLoading(false);
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Remove this vehicle?')) {
      await apiDeleteVehicle(id);
      loadVehicles();
    }
  };

  const handleAddVehicle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newVehicle = {
      number: formData.get('number') as string,
      type: formData.get('type') as string,
      capacity: formData.get('capacity') as string,
      status: formData.get('status') as any,
    };
    await apiCreateVehicle(newVehicle);
    setIsAddModalOpen(false);
    loadVehicles();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Vehicles</h2>
          <p className="text-slate-500 text-sm mt-1">Fleet registry and active status.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-full font-medium transition-all text-sm shadow-lg hover:shadow-xl border border-emerald-500/50"
        >
          <Plus className="w-4 h-4" />
          Add Vehicle
        </button>
      </div>

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
                onChange={(event) => setStatusFilter(event.target.value as 'All' | Vehicle['status'])}
                className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
                aria-label="Filter vehicles by status"
              >
                <option value="All">All statuses</option>
                <option value="Available">Available</option>
                <option value="In Transit">In Transit</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
              }}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-200">
                <th className="px-6 py-4 font-semibold">ID</th>
                <th className="px-6 py-4 font-semibold">Number</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Capacity</th>
                <th className="px-6 py-4 font-semibold">Status</th>
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
                    No vehicles matched your current filters.
                  </td>
                </tr>
              ) : filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-sm text-slate-500 font-mono">{vehicle.id}</td>
                  <td className="px-6 py-4 text-sm text-slate-900 font-medium">{vehicle.number}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{vehicle.type}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{vehicle.capacity}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold inline-flex items-center gap-1.5",
                      vehicle.status === 'Available' && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                      vehicle.status === 'In Transit' && "bg-blue-50 text-blue-700 border border-blue-200",
                      vehicle.status === 'Maintenance' && "bg-slate-100 text-slate-600 border border-slate-200"
                    )}>
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        vehicle.status === 'Available' && "bg-emerald-500",
                        vehicle.status === 'In Transit' && "bg-blue-500",
                        vehicle.status === 'Maintenance' && "bg-slate-500"
                      )}></span>
                      {vehicle.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
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

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-900">Add Vehicle</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500 hover:text-slate-900 transition-colors text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleAddVehicle} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Number</label>
                <input required name="number" type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-900 placeholder:text-slate-400 transition-all" placeholder="TRK-9999" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Type</label>
                <select required name="type" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-900 appearance-none transition-all">
                  <option value="Heavy Truck">Heavy Truck</option>
                  <option value="Medium Truck">Medium Truck</option>
                  <option value="Cargo Van">Cargo Van</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Capacity</label>
                <input required name="capacity" type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-900 placeholder:text-slate-400 transition-all" placeholder="10 Tons" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Status</label>
                <select required name="status" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-900 appearance-none transition-all">
                  <option value="Available">Available</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
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