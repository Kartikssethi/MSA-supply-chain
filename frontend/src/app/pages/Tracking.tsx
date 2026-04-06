import { useState, useEffect } from 'react';
import { Map as MapIcon, Navigation, Clock, Activity, Target } from 'lucide-react';
import { apiGetTracking } from '../api';

export const Tracking = () => {
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetTracking().then(data => {
      setLocations(data);
      if (data.length > 0) setSelectedVehicle(data[0]);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full h-full flex flex-col">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Fleet Tracking</h2>
        <p className="text-slate-500 text-sm mt-1">Real-time location monitoring and telemetry.</p>
      </div>

      <div className="flex-1 min-h-[500px] bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col lg:flex-row w-full min-w-0 shadow-sm">

        {/* Mock Map Area */}
        <div className="flex-1 relative bg-slate-50 p-4 border-r border-slate-200">
          {/* Map Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%2310b981\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-emerald-500/10 font-black text-4xl tracking-widest uppercase">LIVE RADAR</span>
          </div>

          {/* Markers */}
          {locations.map((loc) => {
            const isSelected = selectedVehicle?.id === loc.id;
            return (
              <button
                key={loc.id}
                onClick={() => setSelectedVehicle(loc)}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 p-2.5 rounded-full shadow-lg transition-all duration-300 ${isSelected ? 'scale-125 bg-emerald-500 text-white z-10 ring-4 ring-emerald-500/20 shadow-emerald-500/40' : 'bg-white text-emerald-600 hover:scale-110 z-0 border-2 border-emerald-200 shadow-slate-300'}`}
                style={{
                  left: `${(loc.lng + 100) * 1.5}%`,
                  top: `${(loc.lat) * 1.5}%`
                }}
              >
                <Navigation className="w-4 h-4" style={{ transform: `rotate(${Math.random() * 360}deg)` }} />
              </button>
            )
          })}
        </div>

        {/* Sidebar details */}
        <div className="w-full lg:w-96 bg-white p-6 flex flex-col h-full overflow-y-auto shrink-0 z-10">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <MapIcon className="w-4 h-4 text-emerald-600" />
            Telemetry
          </h3>

          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-32 bg-slate-100 rounded-2xl border border-slate-200"></div>
              <div className="h-24 bg-slate-100 rounded-2xl border border-slate-200"></div>
            </div>
          ) : selectedVehicle ? (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Asset</span>
                    <h4 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{selectedVehicle.vehicleNumber}</h4>
                  </div>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Online
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm group">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:border-emerald-300 transition-colors">
                      <Activity className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-slate-500 text-[10px] uppercase tracking-widest font-semibold mb-0.5">Speed</p>
                      <p className="font-semibold text-slate-900">{selectedVehicle.speed} mph</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm group">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:border-blue-300 transition-colors">
                      <Target className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-slate-500 text-[10px] uppercase tracking-widest font-semibold mb-0.5">Destination</p>
                      <p className="font-semibold text-slate-900">{selectedVehicle.currentTripDestination || 'No active trip'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm group">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:border-cyan-300 transition-colors">
                      <Clock className="w-4 h-4 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-slate-500 text-[10px] uppercase tracking-widest font-semibold mb-0.5">ETA</p>
                      <p className="font-semibold text-slate-900">{selectedVehicle.eta}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-widest">Operator</h4>
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer group">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-sm font-bold text-emerald-700">
                    {selectedVehicle.driverName?.split(' ').map((n: string) => n[0]).join('') || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{selectedVehicle.driverName || 'Unassigned'}</p>
                    <p className="text-xs text-emerald-600 group-hover:text-emerald-500 transition-colors mt-0.5 font-medium">Communicate &rarr;</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm font-medium">
              Select an asset on the map
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
