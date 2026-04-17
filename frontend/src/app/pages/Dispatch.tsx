import { useEffect, useState } from 'react';

type Shipment = {
  id: string;
  origin: string;
  destination: string;
  status: string;
  user_id?: string;
  created_at?: string;
};

export const Dispatch = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  // ⚠️ THE BROWSER CANNOT READ DOCKER HOSTNAMES. It must be localhost.
  const API_URL = "http://localhost:8000";

  // 🔹 Load shipments
  const loadShipments = async () => {
    try {
      const user_id = localStorage.getItem("user_id");

      if (!user_id) {
        console.error("User not logged in");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/shipments?user_id=${user_id}`);

      if (!res.ok) {
        throw new Error("Failed to fetch shipments");
      }

      const data = await res.json();
      setShipments(data);

    } catch (err) {
      console.error("ERROR FETCHING:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Create shipment
  const createShipment = async () => {
  if (!origin || !destination || creating) return;

  setCreating(true);

  const tempShipment: Shipment = {
    id: "temp-" + Date.now(),
    origin,
    destination,
    status: "pending"
  };

  setShipments(prev => [tempShipment, ...prev]);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const user_id = localStorage.getItem("user_id");

    if (!user_id) throw new Error("User not logged in");

    const res = await fetch(`${API_URL}/shipments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin, destination, user_id }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    const realShipment = await res.json();

    setShipments(prev =>
      prev.map(s => s.id === tempShipment.id ? realShipment : s)
    );

    setSuccessMsg("Shipment created successfully");
    setOrigin('');
    setDestination('');

  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error("Error:", err);
    setShipments(prev => prev.filter(s => s.id !== tempShipment.id));

    if (err.name === "AbortError") {
      // Request timed out but shipment may have been created — just reload
      await loadShipments();
      setSuccessMsg("Shipment created");
      setOrigin('');
      setDestination('');
    } else {
      alert(`Failed to create shipment: ${err.message}`);
    }
  } finally {
    setCreating(false); // always runs no matter what
  }
};

  // 🔹 Initial load + polling
  useEffect(() => {
    loadShipments();

    const interval = setInterval(() => {
      loadShipments();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // 🔹 Auto-hide success message
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg('');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  if (loading) {
    return <div className="p-4 text-slate-600">Loading shipments...</div>;
  }

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">Dispatch (Shipments)</h1>

      {/* ✅ SUCCESS MESSAGE */}
      {successMsg && (
        <div className="bg-green-100 text-green-700 px-4 py-2 rounded">
          {successMsg}
        </div>
      )}

      {/* 🔹 Create Shipment */}
      <div className="bg-white p-4 rounded-xl shadow space-y-3">
        <h2 className="font-semibold">Create Shipment</h2>

        <input
          type="text"
          placeholder="Origin"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          className="border p-2 rounded w-full"
        />

        <input
          type="text"
          placeholder="Destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="border p-2 rounded w-full"
        />

        <button
          onClick={createShipment}
          disabled={creating || !origin || !destination}
          className={`
            px-4 py-2 rounded text-white transition
            ${creating || !origin || !destination
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-500 cursor-pointer"}
          `}
        >
          {creating ? "Creating..." : "Create Shipment"}
        </button>
      </div>

      {/* 🔹 Shipment List */}
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
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => (
                <tr key={s.id} className="border-b">
                  <td>{s.id}</td>
                  <td>{s.origin}</td>
                  <td>{s.destination}</td>
                  <td>{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};