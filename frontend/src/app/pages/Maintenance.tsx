import { useState, useEffect } from 'react';
import { Wrench, Plus, Calendar, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { apiCreateMaintenance } from '../api';
import type { FleetVehicle } from '../api/fleetApi';
import { canPerform, getCurrentRole, getCurrentUser } from '../utils/auth';

export const Maintenance = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const currentUser = getCurrentUser();
  const canLogMaintenance = canPerform('maintenance:create');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch maintenance records and vehicles from backend
      const [maintenanceRes, vehiclesRes] = await Promise.all([
        fetch('http://127.0.0.1:8003/maintenance'),
        fetch('http://127.0.0.1:8003/vehicles'),
      ]);
      
      const records = maintenanceRes.ok ? await maintenanceRes.json() : [];
      const vehicles = vehiclesRes.ok ? await vehiclesRes.json() : [];
      
      setRecords(records);
      setVehicles(vehicles);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  if (!canLogMaintenance) return;

  try {
    const formData = new FormData(e.currentTarget);

    const newRecord = {
      vehicleid: formData.get('vehicleid') as string,
      date: formData.get('date') as string,
      description: formData.get('description') as string,
      cost: Number(formData.get('cost')),
      performed_by: currentUser?.name || 'Unknown User',
      role: getCurrentRole(),
    };

    console.log("SENDING TO BACKEND:", newRecord);

    // Make actual API call to backend
    const res = await fetch('http://127.0.0.1:8003/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to create maintenance record');
    }

    const data = await res.json();
    console.log("BACKEND RESPONSE:", data);

    // ❗ IMPORTANT: only close modal if success
    setIsAddModalOpen(false);

    await loadData();

  } catch (err: any) {
  console.error("CREATE FAILED:", err);

  let message = "Failed to create maintenance record";

  if (typeof err?.message === "string") {
    message = err.message;
  } else if (typeof err === "string") {
    message = err;
  } else {
    message = JSON.stringify(err);
  }

  alert(message);
}
};

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Maintenance</h2>
          <p className="text-slate-500 text-sm mt-1">Service histories and scheduled work.</p>
        </div>
        <button
          onClick={() => canLogMaintenance && setIsAddModalOpen(true)}
          disabled={!canLogMaintenance}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-full font-medium transition-all text-sm shadow-lg hover:shadow-xl border border-emerald-500/50"
        >
          <Plus className="w-4 h-4" />
          Log Service
        </button>
      </div>

      {!canLogMaintenance && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your role is read-only for maintenance logging.
        </div>
      )}

      <div className="bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-200 p-6 rounded-2xl flex items-center gap-6 relative overflow-hidden shadow-sm w-full">
  <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/50 to-blue-100/50 opacity-50"></div>

  <div className="p-4 bg-white/80 border border-emerald-300 rounded-xl text-emerald-700 relative z-10 shadow-sm backdrop-blur-sm">
    <FileText className="w-6 h-6" />
  </div>

  <div className="relative z-10 flex flex-col">
    <h3 className="font-bold text-slate-900 mb-1 text-lg">Total Spent</h3>

    <p className="text-4xl font-black text-slate-900 tracking-tight">
      ${records.reduce((acc, r) => acc + r.cost, 0).toLocaleString()}
    </p>

    <p className="text-xs uppercase tracking-widest text-slate-600 mt-1 font-semibold">
      YTD Expenses
    </p>
  </div>
</div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col w-full min-w-0 shadow-sm">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Wrench className="w-4 h-4 text-emerald-600" />
            Service History
          </h3>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-200">
                <th className="px-6 py-4 font-semibold">Record ID</th>
                <th className="px-6 py-4 font-semibold">Vehicle</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Description</th>
                <th className="px-6 py-4 font-semibold text-right">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 font-medium animate-pulse">Loading records...</td>
                </tr>
              ) : records.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-sm font-mono text-slate-500">{record.id}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-50 text-[10px] font-bold text-slate-700 border border-slate-200 tracking-widest">
                      {record.vehicleNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="w-3.5 h-3.5 opacity-40" />
                      {new Date(record.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 max-w-md">
                    <p className="truncate" title={record.description}>{record.description}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-bold text-slate-900">${record.cost.toLocaleString()}</span>
                  </td>
                </tr>
              ))}
              {records.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No maintenance records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-900">Log Service</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500 hover:text-slate-900 transition-colors text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleAddRecord} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Vehicle</label>
                <select required name="vehicleid" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-900 appearance-none transition-all">
                  <option value="">Select vehicle</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.plate_number} {v.model ? `(${v.model})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Date</label>
                <input required name="date" type="date" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-900 transition-all" />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Description</label>
                <textarea required name="description" rows={3} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-900 placeholder:text-slate-400 transition-all resize-none" placeholder="Describe the maintenance performed..."></textarea>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Cost ($)</label>
                <input required name="cost" type="number" min="0" step="0.01" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-900 placeholder:text-slate-400 transition-all" placeholder="0.00" />
              </div>

              <div className="pt-6 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 rounded-full text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-sm font-medium transition-all shadow-lg hover:shadow-xl border border-emerald-500/50">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
