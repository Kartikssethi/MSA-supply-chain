import { useState, useEffect } from 'react';
import { Plus, Search, Filter, ArrowRight, Calendar, Navigation } from 'lucide-react';
import { apiGetTrips, apiCreateTrip, apiGetVehicles, apiGetDrivers } from '../api';
import type { Trip, Vehicle, Driver } from '../api/mockData';
import { cn } from '../utils/classnames';

export const Trips = () => {
  const [trips, setTrips] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [t, v, d] = await Promise.all([apiGetTrips(), apiGetVehicles(), apiGetDrivers()]);
    setTrips(t);
    setVehicles(v);
    setDrivers(d);
    setLoading(false);
  };

  const handleCreateTrip = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newTrip = {
      driverId: formData.get('driverId') as string,
      vehicleId: formData.get('vehicleId') as string,
      pickup: formData.get('pickup') as string,
      destination: formData.get('destination') as string,
      date: formData.get('date') as string,
      status: 'Planned' as any,
    };
    await apiCreateTrip(newTrip);
    setIsAddModalOpen(false);
    loadData();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Trips</h2>
          <p className="text-slate-500 text-sm mt-1">Schedule and track routes.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-full font-medium transition-all text-sm shadow-lg hover:shadow-xl border border-emerald-500/50"
        >
          <Plus className="w-4 h-4" />
          Create Trip
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col w-full min-w-0 shadow-sm">
        <div className="p-4 flex flex-col sm:flex-row gap-4 justify-between border-b border-slate-200">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search location..."
              className="pl-10 pr-4 py-2 w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-900 placeholder:text-slate-400 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-sm font-medium text-slate-700 transition-colors">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-200">
                <th className="px-6 py-4 font-semibold">ID</th>
                <th className="px-6 py-4 font-semibold">Route</th>
                <th className="px-6 py-4 font-semibold">Date</th>
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
              ) : trips.map((trip) => (
                <tr key={trip.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-sm font-mono text-slate-500">{trip.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 max-w-[280px]">
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm font-medium text-slate-900 truncate" title={trip.pickup}>{trip.pickup}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-500/60 flex-shrink-0" />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm font-medium text-slate-900 truncate" title={trip.destination}>{trip.destination}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="w-3.5 h-3.5 opacity-40" />
                      {new Date(trip.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900">{trip.driverName}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-mono">
                        <Navigation className="w-3 h-3 opacity-50" />
                        {trip.vehicleNumber}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold inline-flex items-center gap-1.5",
                      trip.status === 'Completed' && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                      trip.status === 'In Progress' && "bg-blue-50 text-blue-700 border border-blue-200",
                      trip.status === 'Planned' && "bg-slate-100 text-slate-600 border border-slate-200"
                    )}>
                      {trip.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-sm font-medium text-emerald-600 hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-900">Create Trip</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500 hover:text-slate-900 transition-colors text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleCreateTrip} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Pickup</label>
                  <input required name="pickup" type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-900 placeholder:text-slate-400 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Destination</label>
                  <input required name="destination" type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-900 placeholder:text-slate-400 transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Date</label>
                <input required name="date" type="date" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-900 transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Driver</label>
                  <select required name="driverId" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-900 appearance-none transition-all">
                    <option value="">Select driver</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Vehicle</label>
                  <select required name="vehicleId" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-900 appearance-none transition-all">
                    <option value="">Select vehicle</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.number}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-6 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 rounded-full text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-sm font-medium transition-all shadow-lg hover:shadow-xl border border-emerald-500/50">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
