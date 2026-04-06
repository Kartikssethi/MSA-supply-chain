import { 
  initialVehicles, 
  initialDrivers, 
  initialTrips, 
  initialMaintenance, 
  initialLocations,
  tripsPerDayData,
  vehicleUtilizationData,
  deliveryPerformanceData,
  type Vehicle,
  type Driver,
  type Trip,
  type MaintenanceRecord
} from './mockData';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let vehicles = [...initialVehicles];
let drivers = [...initialDrivers];
let trips = [...initialTrips];
let maintenance = [...initialMaintenance];
let locations = [...initialLocations];

// Dashboard API
export const apiGetDashboardStats = async () => {
  await delay(500);
  return {
    totalVehicles: vehicles.length,
    activeTrips: trips.filter(t => t.status === 'In Progress').length,
    availableDrivers: drivers.filter(d => d.assignedVehicleId === null && d.status === 'Active').length,
    vehiclesUnderMaintenance: vehicles.filter(v => v.status === 'Maintenance').length,
    tripsPerDayData,
    vehicleUtilizationData,
    deliveryPerformanceData,
  };
};

// Vehicles API
export const apiGetVehicles = async () => {
  await delay(500);
  return [...vehicles];
};

export const apiCreateVehicle = async (vehicle: Omit<Vehicle, 'id'>) => {
  await delay(500);
  const newVehicle: Vehicle = { ...vehicle, id: `v${Date.now()}` };
  vehicles.push(newVehicle);
  return newVehicle;
};

export const apiDeleteVehicle = async (id: string) => {
  await delay(500);
  vehicles = vehicles.filter(v => v.id !== id);
  return true;
};

// Drivers API
export const apiGetDrivers = async () => {
  await delay(500);
  return [...drivers];
};

// Trips API
export const apiGetTrips = async () => {
  await delay(500);
  return trips.map(t => {
    const driver = drivers.find(d => d.id === t.driverId);
    const vehicle = vehicles.find(v => v.id === t.vehicleId);
    return {
      ...t,
      driverName: driver?.name || 'Unknown',
      vehicleNumber: vehicle?.number || 'Unknown'
    };
  });
};

export const apiCreateTrip = async (trip: Omit<Trip, 'id'>) => {
  await delay(500);
  const newTrip: Trip = { ...trip, id: `t${Date.now()}` };
  trips.push(newTrip);
  return newTrip;
};

// Tracking API
export const apiGetTracking = async () => {
  await delay(500);
  return locations.map(l => {
    const vehicle = vehicles.find(v => v.id === l.vehicleId);
    const driver = drivers.find(d => d.assignedVehicleId === l.vehicleId);
    const currentTrip = trips.find(t => t.vehicleId === l.vehicleId && t.status === 'In Progress');
    return {
      ...l,
      vehicleNumber: vehicle?.number,
      driverName: driver?.name,
      currentTripDestination: currentTrip?.destination
    };
  });
};

// Maintenance API
export const apiGetMaintenance = async () => {
  await delay(500);
  return maintenance.map(m => {
    const vehicle = vehicles.find(v => v.id === m.vehicleId);
    return {
      ...m,
      vehicleNumber: vehicle?.number || 'Unknown'
    };
  });
};

export const apiCreateMaintenance = async (record: Omit<MaintenanceRecord, 'id'>) => {
  await delay(500);
  const newRecord = { ...record, id: `m${Date.now()}` };
  maintenance.push(newRecord);
  
  // Update vehicle status
  const vehicleIndex = vehicles.findIndex(v => v.id === record.vehicleId);
  if (vehicleIndex >= 0) {
    vehicles[vehicleIndex] = { ...vehicles[vehicleIndex], status: 'Maintenance' };
  }
  
  return newRecord;
};
