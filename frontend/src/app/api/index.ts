import { 
  initialVehicles, 
  initialDrivers, 
  initialTrips, 
  initialMaintenance, 
  initialLocations,
  initialExceptionAlerts,
  initialOperationsKpiSnapshot,
  initialAuditTrail,
  tripsPerDayData,
  vehicleUtilizationData,
  deliveryPerformanceData,
  type Vehicle,
  type Trip,
  type MaintenanceRecord,
  type ExceptionAlert,
  type OperationsKpiSnapshot,
  type AuditEntry,
  type UserRole,
} from './mockData';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let vehicles = [...initialVehicles];
let drivers = [...initialDrivers];
let trips = [...initialTrips];
let maintenance = [...initialMaintenance];
let locations = [...initialLocations];
let exceptionAlerts = [...initialExceptionAlerts];
let operationsKpiSnapshot: OperationsKpiSnapshot = { ...initialOperationsKpiSnapshot };
let auditTrail = [...initialAuditTrail];
const telemetrySubscribers = new Set<(alert: ExceptionAlert) => void>();
let telemetryIntervalHandle: ReturnType<typeof setInterval> | null = null;

const createAuditEntry = (
  action: AuditEntry['action'],
  entityType: AuditEntry['entityType'],
  entityId: string,
  summary: string,
  actor: string,
  actorRole: UserRole,
) => {
  const entry: AuditEntry = {
    id: `a${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    actor,
    actorRole,
    action,
    entityType,
    entityId,
    summary,
    timestamp: new Date().toISOString(),
  };

  auditTrail = [entry, ...auditTrail].slice(0, 200);
};

const emitTelemetryAlert = () => {
  const inProgressTrips = trips.filter((trip) => trip.status === 'In Progress');
  if (!inProgressTrips.length) return;

  const targetTrip = inProgressTrips[Math.floor(Math.random() * inProgressTrips.length)];
  const issuePool: Array<{
    severity: ExceptionAlert['severity'];
    type: ExceptionAlert['type'];
    message: string;
    impact: number;
  }> = [
    {
      severity: 'High',
      type: 'Delay Risk',
      message: 'Telemetry predicts late arrival due to congestion build-up.',
      impact: 22,
    },
    {
      severity: 'Critical',
      type: 'Route Deviation',
      message: 'Vehicle has departed from geo-fenced route segment.',
      impact: 34,
    },
    {
      severity: 'Medium',
      type: 'Idle Breach',
      message: 'Idle duration exceeded threshold at a non-planned stop.',
      impact: 11,
    },
  ];

  const generated = issuePool[Math.floor(Math.random() * issuePool.length)];
  const alert: ExceptionAlert = {
    id: `e${Date.now()}`,
    tripId: targetTrip.id,
    vehicleId: targetTrip.vehicleId,
    severity: generated.severity,
    type: generated.type,
    status: 'Open',
    message: generated.message,
    etaImpactMinutes: generated.impact,
    createdAt: new Date().toISOString(),
  };

  exceptionAlerts = [alert, ...exceptionAlerts].slice(0, 100);
  createAuditEntry(
    'Exception Updated',
    'Exception',
    alert.id,
    `Telemetry ingestion created ${alert.type} alert for ${alert.tripId.toUpperCase()}.`,
    'Telemetry Engine',
    'Admin',
  );
  telemetrySubscribers.forEach((subscriber) => subscriber(alert));
};

const startTelemetryFeed = () => {
  if (telemetryIntervalHandle) return;
  telemetryIntervalHandle = setInterval(emitTelemetryAlert, 18000);
};

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

export const apiCreateMaintenance = async (
  record: Omit<MaintenanceRecord, 'id'>,
  actor: string,
  actorRole: UserRole,
) => {
  await delay(500);
  const newRecord = { ...record, id: `m${Date.now()}` };
  maintenance.push(newRecord);
  
  // Update vehicle status
  const vehicleIndex = vehicles.findIndex(v => v.id === record.vehicleId);
  if (vehicleIndex >= 0) {
    vehicles[vehicleIndex] = { ...vehicles[vehicleIndex], status: 'Maintenance' };
  }

  createAuditEntry(
    'Maintenance Logged',
    'Maintenance',
    newRecord.id,
    `Logged maintenance for ${record.vehicleId.toUpperCase()} costing $${record.cost}.`,
    actor,
    actorRole,
  );
  
  return newRecord;
};

// Operations API
export const apiGetOperationsSnapshot = async () => {
  await delay(400);
  startTelemetryFeed();
  const openExceptions = exceptionAlerts.filter((alert) => alert.status !== 'Resolved');
  const totalDelay = openExceptions.reduce((sum, alert) => sum + alert.etaImpactMinutes, 0);
  const avgDelay = openExceptions.length ? Math.round(totalDelay / openExceptions.length) : 0;

  operationsKpiSnapshot = {
    ...operationsKpiSnapshot,
    activeTrips: trips.filter((trip) => trip.status === 'In Progress').length,
    exceptionsOpen: openExceptions.length,
    avgDelayMinutes: avgDelay,
  };

  return {
    kpis: operationsKpiSnapshot,
    alerts: [...exceptionAlerts],
  };
};

export const apiUpdateExceptionStatus = async (
  id: string,
  status: ExceptionAlert['status'],
  actor: string,
  actorRole: UserRole,
) => {
  await delay(300);
  exceptionAlerts = exceptionAlerts.map((alert) => (
    alert.id === id ? { ...alert, status } : alert
  ));

  createAuditEntry(
    'Exception Updated',
    'Exception',
    id,
    `Updated exception ${id.toUpperCase()} to ${status}.`,
    actor,
    actorRole,
  );

  return exceptionAlerts.find((alert) => alert.id === id) || null;
};

export const apiSubscribeToTelemetryAlerts = (subscriber: (alert: ExceptionAlert) => void) => {
  startTelemetryFeed();
  telemetrySubscribers.add(subscriber);

  return () => {
    telemetrySubscribers.delete(subscriber);
  };
};

export const apiGetAuditTrail = async () => {
  await delay(250);
  return [...auditTrail];
};

export const apiGetDispatchBoard = async () => {
  await delay(350);

  const assignableTrips = trips
    .filter((trip) => trip.status === 'Planned')
    .map((trip) => ({
      ...trip,
      driverName: drivers.find((driver) => driver.id === trip.driverId)?.name || 'Unassigned',
      vehicleNumber: vehicles.find((vehicle) => vehicle.id === trip.vehicleId)?.number || 'Unassigned',
    }));

  const availableDrivers = drivers.filter((driver) => driver.status === 'Active');
  const availableVehicles = vehicles.filter((vehicle) => vehicle.status === 'Available' || vehicle.status === 'In Transit');

  return {
    trips: assignableTrips,
    drivers: availableDrivers,
    vehicles: availableVehicles,
  };
};

export const apiAssignTrip = async (
  tripId: string,
  driverId: string,
  vehicleId: string,
  actor: string,
  actorRole: UserRole,
) => {
  await delay(300);

  const tripIndex = trips.findIndex((trip) => trip.id === tripId);
  if (tripIndex < 0) return null;

  const previousDriverId = trips[tripIndex].driverId;
  if (previousDriverId && previousDriverId !== driverId) {
    const previousDriverIndex = drivers.findIndex((driver) => driver.id === previousDriverId);
    if (previousDriverIndex >= 0) {
      drivers[previousDriverIndex] = { ...drivers[previousDriverIndex], assignedVehicleId: null };
    }
  }

  trips[tripIndex] = { ...trips[tripIndex], driverId, vehicleId };

  const driverIndex = drivers.findIndex((driver) => driver.id === driverId);
  if (driverIndex >= 0) {
    drivers[driverIndex] = { ...drivers[driverIndex], assignedVehicleId: vehicleId };
  }

  const vehicleIndex = vehicles.findIndex((vehicle) => vehicle.id === vehicleId);
  if (vehicleIndex >= 0) {
    vehicles[vehicleIndex] = { ...vehicles[vehicleIndex], status: 'In Transit' };
  }

  createAuditEntry(
    'Trip Assigned',
    'Trip',
    tripId,
    `Assigned trip ${tripId.toUpperCase()} to ${driverId.toUpperCase()} using ${vehicleId.toUpperCase()}.`,
    actor,
    actorRole,
  );

  return { ...trips[tripIndex] };
};
