import { useEffect, useState } from 'react';
import { supabase } from "../supabase";

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

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  const API_URL = "http://127.0.0.1:8000";

  // 🔹 Load shipments for logged-in user
  const loadShipments = async () => {
    try {
      const userData = localStorage.getItem("user_id")

      if (!userData) {
        console.error("User not logged in");
        setLoading(false);
        return;
      }
      const user = userData

      const res = await fetch(`${API_URL}/shipments?user_id=${user}`);

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

    // temporary UI item
    const tempShipment: Shipment = {
      id: "temp-" + Date.now(),
      origin,
      destination,
      status: "pending"
    };

    setShipments(prev => [tempShipment, ...prev]);

    try {
      const userData = localStorage.getItem("user_id")

      if (!userData) {
        alert("User not logged in");
        setCreating(false);
        return;
      }

      const user_id = userData;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const res = await fetch(`${API_URL}/shipments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origin,
          destination,
          user_id
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const error = await res.text();
        console.error("API Error:", error);
        throw new Error(`Failed to create shipment: ${res.status}`);
      }

      const realShipment = await res.json();
      console.log("Shipment created:", realShipment);

      // replace temp with real
      setShipments(prev =>
        prev.map(s => s.id === tempShipment.id ? realShipment : s)
      );

      // Clear fields immediately
      setOrigin('');
      setDestination('');

    } catch (err) {
      console.error("Error creating shipment:", err);

      // rollback
      setShipments(prev => prev.filter(s => s.id !== tempShipment.id));
      alert("Failed to create shipment. Check console for details.");
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    loadShipments();

    // 🔹 Auto-sync with database every 3 seconds
    const syncInterval = setInterval(() => {
      loadShipments();
    }, 3000);

    // Cleanup interval on unmount
    return () => clearInterval(syncInterval);
  }, []);

  if (loading) {
    return <div className="p-4 text-slate-600">Loading shipments...</div>;
  }

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">Dispatch (Shipments)</h1>

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