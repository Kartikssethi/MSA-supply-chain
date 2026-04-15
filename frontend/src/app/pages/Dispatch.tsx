import { useEffect, useState } from 'react';
import { RefreshCw, Route, UserRound, Truck } from 'lucide-react';
import { apiAssignTrip, apiGetDispatchBoard } from '../api';
import { canPerform, getCurrentRole, getCurrentUser } from '../utils/auth';
import type { Driver, Trip, UserRole, Vehicle } from '../api/mockData';

type DispatchTripRow = Trip & {
  driverName: string;
  vehicleNumber: string;
};

type DispatchSnapshot = {
  trips: DispatchTripRow[];
  drivers: Driver[];
  vehicles: Vehicle[];
};

export const Dispatch = () => {
  const [snapshot, setSnapshot] = useState<DispatchSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');

  const currentUser = getCurrentUser();
  const actor = currentUser?.name || 'Unknown User';
  const actorRole = getCurrentRole();
  const canAssign = canPerform('dispatch:assign');

  const loadDispatchBoard = async () => {
    setLoading(true);
    const data = await apiGetDispatchBoard();
    setSnapshot(data as DispatchSnapshot);
    setLoading(false);
  };

  useEffect(() => {
    loadDispatchBoard();
  }, []);

  const onAssign = async () => {
    if (!selectedTripId || !selectedDriverId || !selectedVehicleId) return;
    if (!canAssign) return;

    await apiAssignTrip(
      selectedTripId,
      selectedDriverId,
      selectedVehicleId,
      actor,
      actorRole as UserRole,
    );

    setSelectedTripId('');
    setSelectedDriverId('');
    setSelectedVehicleId('');
    await loadDispatchBoard();
  };

  if (loading) {
    return <div className="animate-pulse text-slate-600 font-medium">Loading dispatch board...</div>;
  }

  if (!snapshot) {
    return <div className="text-slate-600">Unable to load dispatch board.</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/40 to-cyan-50/30 p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Dispatch Board</h2>
            <p className="mt-1 text-sm text-slate-600">Assign planned trips to available drivers and fleet resources.</p>
          </div>
          <button
            onClick={loadDispatchBoard}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {!canAssign && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Current role is read-only for dispatch assignments.
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Assignment Panel</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <select
            value={selectedTripId}
            onChange={(event) => setSelectedTripId(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none"
          >
            <option value="">Select trip</option>
            {snapshot.trips.map((trip: DispatchTripRow) => (
              <option key={trip.id} value={trip.id}>
                {trip.id.toUpperCase()} - {trip.pickup} to {trip.destination}
              </option>
            ))}
          </select>

          <select
            value={selectedDriverId}
            onChange={(event) => setSelectedDriverId(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none"
          >
            <option value="">Select driver</option>
            {snapshot.drivers.map((driver: Driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name} ({driver.status})
              </option>
            ))}
          </select>

          <select
            value={selectedVehicleId}
            onChange={(event) => setSelectedVehicleId(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none"
          >
            <option value="">Select vehicle</option>
            {snapshot.vehicles.map((vehicle: Vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.number} ({vehicle.status})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onAssign}
          disabled={!canAssign || !selectedTripId || !selectedDriverId || !selectedVehicleId}
          className="mt-4 rounded-full border border-emerald-500/40 bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Assign Trip
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Planned Trips</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] uppercase tracking-widest text-slate-500">
                <th className="px-5 py-4 font-semibold">Trip</th>
                <th className="px-5 py-4 font-semibold">Route</th>
                <th className="px-5 py-4 font-semibold">Current Driver</th>
                <th className="px-5 py-4 font-semibold">Current Vehicle</th>
                <th className="px-5 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {snapshot.trips.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    No planned trips available for assignment.
                  </td>
                </tr>
              ) : (
                snapshot.trips.map((trip: DispatchTripRow) => (
                  <tr key={trip.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 text-sm font-semibold text-slate-800">{trip.id.toUpperCase()}</td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      <span className="inline-flex items-center gap-2">
                        <Route className="h-3.5 w-3.5 text-slate-400" />
                        {trip.pickup} to {trip.destination}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      <span className="inline-flex items-center gap-2">
                        <UserRound className="h-3.5 w-3.5 text-slate-400" />
                        {trip.driverName}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      <span className="inline-flex items-center gap-2">
                        <Truck className="h-3.5 w-3.5 text-slate-400" />
                        {trip.vehicleNumber}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{trip.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
