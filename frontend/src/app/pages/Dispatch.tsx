import { useEffect, useState } from 'react';
import {LocationInput} from "../api/LocationInput.tsx"

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
  driver_name?: string|null;

  user_id?: string;
  created_at?: string;
};

type Driver = {
  id: string;
  name: string;
  license: string;
  status: string;
  assigned_vehicle_plate?: string | null;
};

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

  const [originData, setOriginData] = useState<any>(null);
  const [destinationData, setDestinationData] = useState<any>(null);

  // ⚠️ THE BROWSER CANNOT READ DOCKER HOSTNAMES. It must be localhost.
  const API_URL = "http://localhost:8000";

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
      
      driver_name: null
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
        user_id
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
          origin_long: s.origin_long,
          destination_lat: s.destination_lat,
          destination_long: s.destination_long
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
    return <div className="p-4 text-slate-600">Loading shipments...</div>;
  }

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">Dispatch (Shipments)</h1>

      {successMsg && (
        <div className="bg-green-100 text-green-700 px-4 py-2 rounded">
          {successMsg}
        </div>
      )}

      {/* ================= CREATE ================= */}
      <div className="bg-white p-4 rounded-xl shadow space-y-3">
        <h2 className="font-semibold">Create Shipment</h2>

        <input
          type="text"
          placeholder="Shipment Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 rounded w-full"
        />

        <LocationInput
          placeholder="Search Origin"
          onSelect={(loc) => {
            setOrigin(loc.name);
            setOriginData(loc);
          }}
        />

        <LocationInput
          placeholder="Search Destination"
          onSelect={(loc) => {
            setDestination(loc.name);
            setDestinationData(loc);
          }}
        />

        <button
          onClick={createShipment}
          disabled={creating || !originData || !destinationData || !name}
          className={`px-4 py-2 rounded text-white ${
            creating ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-500"
          }`}
        >
          {creating ? "Creating..." : "Create Shipment"}
        </button>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="font-semibold mb-3">All Shipments</h2>

        {shipments.length === 0 ? (
          <p>No shipments found</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th>ID</th>
                <th>Origin</th>
                <th>Destination</th>
                <th>Name</th>
                <th>Driver</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => (
                <tr key={s.id} className="border-b">
                  <td>{s.id.substring(0, 8)}...</td>
                  <td>{s.origin}</td>
                  <td>{s.destination}</td>
                  <td>{s.name || 'Unnamed'}</td>

                  <td>
                    {s.driver_name ? (
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {s.driver_name}
                        </span>
                        <button
                          onClick={() => simulateDrive(s)}
                          className="bg-purple-100 text-purple-700 border border-purple-200 px-2 py-1 rounded hover:bg-purple-200 text-sm whitespace-nowrap"
                        >
                          ▶ Simulate Drive
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedShipment(s)}
                        className="text-green-600 border border-green-500 px-2 py-1 rounded hover:bg-green-50"
                      >
                        + Assign Driver
                      </button>
                    )}
                  </td>

                  <td>{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ================= MODAL ================= */}
      {selectedShipment && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white w-[600px] rounded-xl shadow-lg p-6 space-y-4">

            <h2 className="text-xl font-semibold">Assign Driver</h2>

            <div className="bg-gray-50 p-3 rounded">
              <p className="font-medium">{selectedShipment.name}</p>
              <p className="text-sm text-gray-600">
                {selectedShipment.origin} → {selectedShipment.destination}
              </p>
            </div>

            <div className="max-h-64 overflow-y-auto border rounded">
              {drivers.length === 0 ? (
                <p className="p-3 text-gray-500">No available drivers</p>
              ) : (
                drivers.map((d) => (
                  <div
                    key={d.id}
                    className="flex justify-between items-center p-3 border-b"
                  >
                    <div>
                      <p className="font-medium">{d.name}</p>
                      <p className="text-sm text-gray-500">
                        License: {d.license}
                      </p>
                    </div>

                    <button
                      onClick={() => assignDriver(d)}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-500"
                    >
                      Assign
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setSelectedShipment(null)}
              className="text-red-500"
            >
              Cancel
            </button>

          </div>
        </div>
      )}

    </div>
  );
};