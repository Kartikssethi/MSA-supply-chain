import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ArrowRight, Calendar, Navigation } from 'lucide-react';

import type { Trip, Vehicle, Driver } from '../api/mockData';
import { cn } from '../utils/classnames';

type TripRow = Trip & {
  driverName: string;
  vehicleNumber: string;
};

export const Trips = () => {
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | Trip['status']>('All');

  const filteredTrips = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return trips.filter((trip) => {
      const matchesSearch = !normalizedSearch
        || trip.pickup.toLowerCase().includes(normalizedSearch)
        || trip.destination.toLowerCase().includes(normalizedSearch)
        || trip.driverName.toLowerCase().includes(normalizedSearch)
        || trip.id.toLowerCase().includes(normalizedSearch);

      const matchesStatus = statusFilter === 'All' || trip.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [trips, searchTerm, statusFilter]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
  setLoading(true);

  const userId = localStorage.getItem("user_id");
  const res = await fetch(`http://localhost:8000/shipments?user_id=${userId}`);
  const data = await res.json();

  const formatStatus = (status: string) => {
  switch (status) {
    case "assigned":
      return "In Progress";
    case "completed":
      return "Completed";
    default:
      return "Unassigned";
  }
};


  const mapped = data.map((s: any) => ({
    id: s.id,
    pickup: s.origin,
    destination: s.destination,
    date: s.created_at,
    status: formatStatus(s.status),
    driverName: s.name || "Unassigned",
    vehicleNumber: "-", // you don’t have vehicle yet
  }));

  setTrips(mapped);
  setLoading(false);
};


  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Trips</h2>
          <p className="text-slate-500 text-sm mt-1">View created shipments and statuses.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col w-full min-w-0 shadow-sm">
        <div className="p-4 flex flex-col sm:flex-row gap-4 justify-between border-b border-slate-200">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search location..."
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
                onChange={(event) => setStatusFilter(event.target.value as 'All' | Trip['status'])}
                className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
                aria-label="Filter trips by status"
              >
                <option value="All">All statuses</option>
                <option value="Planned">Planned</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
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
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-200">
                <th className="px-6 py-4 font-semibold">ID</th>
                <th className="px-6 py-4 font-semibold">Route</th>
                
                <th className="px-6 py-4 font-semibold">Shipment Name</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 font-medium animate-pulse">Loading...</td>
                </tr>
              ) : filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No trips matched your current filters.
                  </td>
                </tr>
              ) : filteredTrips.map((trip) => (
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
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-900">{trip.driverName}</span>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
