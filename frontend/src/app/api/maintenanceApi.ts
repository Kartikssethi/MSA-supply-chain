export type MaintenanceRecord = {
  id: string;
  vehicleid: string;
  vehicleNumber?: string;
  date: string;
  description: string;
  cost: number;
  performed_by?: string;
};

const API_URL = "http://localhost:8003";

// ================================
// GET
// ================================
export const apiGetMaintenance = async (): Promise<MaintenanceRecord[]> => {
  const res = await fetch(`${API_URL}/maintenance`);

  if (!res.ok) {
    throw new Error("Failed to fetch maintenance");
  }

  return res.json();
};

// ================================
// CREATE
// ================================
export const apiCreateMaintenance = async (
  data: Omit<MaintenanceRecord, "id">,
  user: string,
  role: string
) => {
  const res = await fetch(`${API_URL}/maintenance`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      vehicleid: data.vehicleid,   // 🔥 mapping happens HERE
      date: data.date,
      description: data.description,
      cost: data.cost,
      performed_by: user,
      role: role,
    }),
  });

  if (!res.ok) {
  const err = await res.json();
  console.error("BACKEND ERROR RESPONSE:", err);

  let message = "Failed to create maintenance";

  if (typeof err?.detail === "string") {
    message = err.detail;
  } else if (typeof err?.message === "string") {
    message = err.message;
  } else {
    message = JSON.stringify(err);
  }

  throw new Error(message);
}

  return res.json();
};

// ================================
// GET VEHICLES
// ================================
export const apiGetVehicles = async () => {
  const res = await fetch(`${API_URL}/vehicles`);

  if (!res.ok) {
    throw new Error("Failed to fetch vehicles");
  }

  return res.json();
};