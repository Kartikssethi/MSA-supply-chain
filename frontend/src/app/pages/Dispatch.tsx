import { useEffect, useState, useMemo } from 'react';
import { LocationInput } from "../api/LocationInput.tsx"
import { Info } from 'lucide-react';

type Shipment = {
  id: string;
  origin: string;
  destination: string;
  origin_lat: number;
  origin_long: number;
  destination_lat: number;
  destination_long: number;

  status: string;
  name?: string;

  driver_id?: string | null;
  driver_name?: string | null;

  user_id?: string;
  created_at?: string;
  estimated_price?: number;
};

type Driver = {
  id: string;
  name: string;
  license: string;
  status: string;
  assigned_vehicle_plate?: string | null;
};

// --- Helpers ---
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const FUEL_RATE = 0.5;
const LABOR_RATE = 0.3;

export const Dispatch = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [name, setName] = useState('');
  const [shipmentDate, setShipmentDate] = useState('');

  const [originData, setOriginData] = useState<any>(null);
  const [destinationData, setDestinationData] = useState<any>(null);

  // ⚠️ THE BROWSER CANNOT READ DOCKER HOSTNAMES. It must be localhost.
  const API_URL = "http://localhost:8000";

  // Calculate local estimate
  const estimation = useMemo(() => {
    if (!originData || !destinationData) return null;
    const distance = calculateDistance(originData.lat, originData.long, destinationData.lat, destinationData.long);
    const price = distance * (FUEL_RATE + LABOR_RATE);
    return {
      distance: distance.toFixed(1),
      price: price.toFixed(2)
    };
  }, [originData, destinationData]);

  // ================================
  // 🔹 LOAD SHIPMENTS
  // ================================
  const loadShipments = async () => {
    try {
      const user_id = localStorage.getItem("user_id");

      if (!user_id) {
        console.error("User not logged in");
        return;
      }

      const res = await fetch(`${API_URL}/shipments?user_id=${user_id}`);
      if (!res.ok) throw new Error("Failed to fetch shipments");

      const data = await res.json();
      setShipments(data);

    } catch (err) {
      console.error("SHIPMENT ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // 🔹 LOAD DRIVERS (ONLY AVAILABLE)
  // ================================
  const loadDrivers = async () => {
    try {
      const res = await fetch(`http://localhost:8002/fleet/drivers`);
      if (!res.ok) throw new Error("Failed to fetch drivers");

      const data = await res.json();

      const available = data.filter(
        (d: Driver) => d.status === "ACTIVE" && !d.assigned_vehicle_plate
      );

      setDrivers(available);

    } catch (err) {
      console.error("DRIVER ERROR:", err);
    }
  };

  // ================================
  // 🔹 CREATE SHIPMENT
  // ================================
  const createShipment = async () => {
    if (!origin || !destination || !name || creating) return;

    setCreating(true);

    const tempShipment: Shipment = {
      id: "temp-" + Date.now(),
      origin,
      destination,
      origin_lat: originData?.lat,
      origin_long: originData?.long,
      destination_lat: destinationData?.lat,
      destination_long: destinationData?.long,
      name,
      status: "pending",
      shipment_date: shipmentDate || new Date().toISOString(),
      driver_name: null,
      estimated_price: estimation ? parseFloat(estimation.price) : 0
    };

    setShipments(prev => [tempShipment, ...prev]);

    try {
      const user_id = localStorage.getItem("user_id");
      if (!user_id) throw new Error("User not logged in");

      const res = await fetch(`${API_URL}/shipments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          origin: originData?.name,
          origin_lat: originData?.lat,
          origin_long: originData?.long,
          destination: destinationData?.name,
          destination_lat: destinationData?.lat,
          destination_long: destinationData?.long,
          user_id,
          shipment_date: shipmentDate || new Date().toISOString()
        })
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const realShipment = await res.json();

      setShipments(prev =>
        prev.map(s => s.id === tempShipment.id ? realShipment : s)
      );

      setSuccessMsg("Shipment created successfully");

      setName('');
      setOrigin('');
      setDestination('');
      setShipmentDate('');

      setOriginData(null)
      setDestinationData(null)

    } catch (err: any) {
      console.error("CREATE ERROR:", err);
      setShipments(prev => prev.filter(s => s.id !== tempShipment.id));
      alert("Failed to create shipment");
    } finally {
      setCreating(false);
    }
  };

  // ================================
  // 🔹 ASSIGN DRIVER
  // ================================
  const assignDriver = async (driver: any) => {
    try {
      if (!selectedShipment) return;

      const res = await fetch(
        `${API_URL}/shipments/${selectedShipment.id}/assign-driver`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ driver_id: driver.id }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error("backend error:", data)
        throw new Error(data.detail || "failed to assign driver");
      }


      await loadShipments();
      setSelectedShipment(null);

    } catch (err: any) {
      console.error("ASSIGN ERROR:", err);
      alert(err.message || "Failed to assign driver");
    }
  };

  // ================================
  // 🔹 SIMULATE DRIVE
  // ================================
  const simulateDrive = async (s: Shipment) => {
    try {
      const res = await fetch(`http://localhost:8004/simulate/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driver_id: s.driver_id,
          driver_name: s.driver_name,
          origin_lat: s.origin_lat,
          origin_lng: s.origin_long,
          destination_lat: s.destination_lat,
          destination_lng: s.destination_long
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to start simulation");
      alert(data.message + " Check the Tracking tab!");
    } catch (err: any) {
      console.error("SIMULATE ERROR:", err);
      alert(err.message || "Failed to start simulation");
    }
  };

  // ================================
  // 🔹 INITIAL LOAD
  // ================================
  useEffect(() => {
    loadShipments();

    const interval = setInterval(() => {
      loadShipments();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // ================================
  // 🔹 LOAD DRIVERS WHEN MODAL OPENS
  // ================================
  useEffect(() => {
    if (selectedShipment) {
      loadDrivers();
    }
  }, [selectedShipment]);

  // ================================
  // 🔹 SUCCESS MESSAGE AUTO HIDE
  // ================================
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  if (loading) {
    return <div className="p-4 text-slate-600 animate-pulse">Loading shipments telemetry...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dispatch</h1>
          <p className="text-slate-500 mt-1">Manage shipments and assign active drivers.</p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ================= CREATE ================= */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit sticky top-6">
          <h2 className="text-lg font-bold text-slate-800">Create New Shipment</h2>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Reference Name</label>
              <input
                type="text"
                placeholder="e.g. Morning Grocery Run"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-sm"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Shipment Date</label>
              <input
                type="datetime-local"
                value={shipmentDate}
                onChange={(e) => setShipmentDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all text-sm"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Route Details</label>
              <LocationInput
                placeholder="Origin address"
                onSelect={(loc) => {
                  setOrigin(loc.name);
                  setOriginData(loc);
                }}
              />
              <LocationInput
                placeholder="Destination address"
                onSelect={(loc) => {
                  setDestination(loc.name);
                  setDestinationData(loc);
                }}
              />
            </div>

            {estimation && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl space-y-2 group">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-blue-600">Price Assumption</span>
                  <div className="relative cursor-help">
                    <Info className="w-3.5 h-3.5 text-blue-400" />
                    <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-900 text-[10px] text-white rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-50">
                      Formula: Distance ({estimation.distance}km) × (Fuel $0.5 + Labor $0.3)
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <div className="text-2xl font-bold text-blue-900 tracking-tight">
                    ${estimation.price}
                  </div>
                  <div className="text-[10px] font-medium text-blue-500 uppercase tracking-wide">
                    {estimation.distance} km total
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={createShipment}
              disabled={creating || !originData || !destinationData || !name}
              className={`w-full py-3 rounded-xl text-white font-bold text-sm transition-all shadow-lg ${creating
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                  : "bg-blue-600 hover:bg-blue-500 hover:shadow-blue-200 border-b-4 border-blue-700 active:border-b-0 active:translate-y-1"
                }`}
            >
              {creating ? "Processing..." : "Confirm Shipment"}
            </button>
          </div>
        </div>

        {/* ================= TABLE ================= */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Active Dispatch Log</h2>
          </div>

          <div className="overflow-x-auto">
            {shipments.length === 0 ? (
              <div className="p-12 text-center text-slate-400 italic">No active shipments in queue.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/30 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    <th className="px-6 py-4">Ref</th>
                    <th className="px-6 py-4">Timeline</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Assignment</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {shipments.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 text-sm">{s.name || 'Shipment'}</div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">#{s.id.substring(0, 8)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                          <span className="w-2 h-2 rounded-full bg-blue-400 ring-4 ring-blue-50" />
                          {s.origin}
                        </div>
                        <div className="ml-1 my-1 h-3 w-px bg-slate-200" />
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-50" />
                          {s.destination}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold ring-1 ring-inset ring-blue-700/10">
                          ${s.estimated_price?.toFixed(2) || '0.00'}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {s.driver_name ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                              {s.driver_name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <button
                              onClick={() => simulateDrive(s)}
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border border-indigo-200"
                            >
                              Live Simulation
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedShipment(s)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-emerald-200 hover:bg-emerald-100 transition-all translate-y-0 hover:-translate-y-0.5 shadow-sm"
                          >
                            Assign Driver
                          </button>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${s.status === 'pending' ? 'bg-amber-50 text-amber-700 ring-amber-700/10' :
                            s.status === 'assigned' ? 'bg-blue-50 text-blue-700 ring-blue-700/10' :
                              'bg-emerald-50 text-emerald-700 ring-emerald-700/10'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'pending' ? 'bg-amber-500' :
                              s.status === 'assigned' ? 'bg-blue-500' :
                                'bg-emerald-500'
                            }`} />
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ================= MODAL ================= */}
      {selectedShipment && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Assign Fleet Resource</h2>
                <p className="text-xs text-slate-500 font-medium">Shipment: {selectedShipment.name}</p>
              </div>
              <button
                onClick={() => setSelectedShipment(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="p-6">
              <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                {drivers.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 italic">No resources available for dispatch.</div>
                ) : (
                  drivers.map((d) => (
                    <div
                      key={d.id}
                      className="flex justify-between items-center p-4 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all group cursor-default"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                          {d.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{d.name}</p>
                          <p className="text-[10px] font-mono text-slate-400 uppercase">LICENSE: {d.license}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => assignDriver(d)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-500 shadow-lg shadow-blue-100 transition-all hover:scale-105"
                      >
                        Assign
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedShipment(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest px-4"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};