/**
 * fleetApi.ts — Real API client for the Fleet Service (port 8002).
 * Replaces mock data for vehicles and drivers.
 */

const FLEET_BASE = "http://127.0.0.1:8002/fleet";

// --- Types ---
export interface FleetVehicle {
  id: string;
  plate_number: string;
  model: string;
  v_type: string;
  status: string;
  current_driver_id: string | null;
  current_driver_name: string | null;
}

export interface FleetDriver {
  id: string;
  name: string;
  license: string;
  status: string;
  assigned_vehicle_plate?: string | null;
}

// --- Vehicles ---

export const fleetGetVehicles = async (): Promise<FleetVehicle[]> => {
  const res = await fetch(`${FLEET_BASE}/vehicles`);
  if (!res.ok) throw new Error("Failed to fetch vehicles");
  return res.json();
};

export const fleetCreateVehicle = async (data: {
  plate_number: string;
  model: string;
  v_type: string;
}): Promise<FleetVehicle> => {
  const res = await fetch(`${FLEET_BASE}/vehicles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to create vehicle");
  }
  return res.json();
};

export const fleetDeleteVehicle = async (id: string): Promise<void> => {
  const res = await fetch(`${FLEET_BASE}/vehicles/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete vehicle");
};

// --- Drivers ---

export const fleetGetDrivers = async (): Promise<FleetDriver[]> => {
  const res = await fetch(`${FLEET_BASE}/drivers`);
  if (!res.ok) throw new Error("Failed to fetch drivers");
  return res.json();
};

export const fleetCreateDriver = async (data: {
  name: string;
  license: string;
}): Promise<FleetDriver> => {
  const res = await fetch(`${FLEET_BASE}/drivers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to create driver");
  }
  return res.json();
};

export const fleetDeleteDriver = async (id: string): Promise<void> => {
  const res = await fetch(`${FLEET_BASE}/drivers/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete driver");
};

// --- Assignments ---

export const fleetAssignDriver = async (
  vehicleId: string,
  driverId: string
): Promise<{ message: string }> => {
  const res = await fetch(
    `${FLEET_BASE}/vehicles/${vehicleId}/assign/${driverId}`,
    { method: "POST" }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Assignment failed");
  }
  return res.json();
};

export const fleetUnassignDriver = async (
  vehicleId: string
): Promise<{ message: string }> => {
  const res = await fetch(`${FLEET_BASE}/vehicles/${vehicleId}/unassign`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Unassignment failed");
  }
  return res.json();
};
