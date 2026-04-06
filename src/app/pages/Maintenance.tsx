import { useState, useEffect } from 'react';
import { Wrench, Plus, Calendar, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { apiGetMaintenance, apiCreateMaintenance, apiGetVehicles } from '../api';
import type { MaintenanceRecord, Vehicle } from '../api/mockData';
import { cn } from '../utils/classnames';

export const Maintenance = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [r, v] = await Promise.all([apiGetMaintenance(), apiGetVehicles()]);
    setRecords(r);
    setVehicles(v);
    setLoading(false);
  };

  const handleAddRecord = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newRecord = {
      vehicleId: formData.get('vehicleId') as string,
      date: formData.get('date') as string,
      description: formData.get('description') as string,
      cost: Number(formData.get('cost')),
    };
    await apiCreateMaintenance(newRecord);
    setIsAddModalOpen(false);
    loadData();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Maintenance</h2>
          <p className="text-slate-500 text-sm mt-1">Service histories and scheduled work.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-full font-medium transition-all text-sm shadow-lg hover:shadow-xl border border-emerald-500/50"
        >
          <Plus className="w-4 h-4" />
          Log Service
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-6 rounded-2xl flex items-start gap-4 relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <AlertTriangle className="w-16 h-16 text-amber-500" />
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="relative z-10">
            <h3 className="font-bold text-slate-900 mb-1">Action Required</h3>
            <p className="text-xs text-slate-600 leading-relaxed">3 assets are due for inspection.</p>
            <button className="mt-3 text-[10px] uppercase tracking-widest font-bold text-amber-600 hover:text-amber-500">View Schedule &rarr;</button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-2xl flex items-start gap-4 relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="relative z-10">
            <h3 className="font-bold text-slate-900 mb-1">Cleared</h3>
            <p className="text-xs text-slate-600 leading-relaxed">TRK-1002 cleared for operation.</p>
            <button className="mt-3 text-[10px] uppercase tracking-widest font-bold text-emerald-600 hover:text-emerald-500">View Report &rarr;</button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-200 p-6 rounded-2xl flex items-start gap-4 relative overflow-hidden shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/50 to-blue-100/50 opacity-50"></div>
          <div className="p-3 bg-white/80 border border-emerald-300 rounded-xl text-emerald-700 relative z-10 shadow-sm backdrop-blur-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div className="relative z-10">
            <h3 className="font-bold text-slate-900 mb-1">Total Spent</h3>
            <p className="text-3xl font-black text-slate-900 mt-1 tracking-tight">
              ${records.reduce((acc, r) => acc + r.cost, 0).toLocaleString()}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-slate-600 mt-1 font-semibold">YTD Expenses</p>
          </div>
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
                <select required name="vehicleId" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-slate-900 appearance-none transition-all">
                  <option value="">Select vehicle</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.number}</option>
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
