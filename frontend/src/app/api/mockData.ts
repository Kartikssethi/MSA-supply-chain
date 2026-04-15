export interface Vehicle {
  id: string;
  number: string;
  type: string;
  capacity: string;
  status: 'Available' | 'In Transit' | 'Maintenance';
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  phone: string;
  assignedVehicleId: string | null;
  status: 'Active' | 'On Leave' | 'Inactive';
}

export type UserRole = 'Admin' | 'Fleet Manager' | 'Dispatcher' | 'Viewer';

export interface Trip {
  id: string;
  driverId: string;
  vehicleId: string;
  status: 'Planned' | 'In Progress' | 'Completed';
  pickup: string;
  destination: string;
  date: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  date: string;
  description: string;
  cost: number;
}

export interface Location {
  id: string;
  vehicleId: string;
  lat: number;
  lng: number;
  speed: number;
  eta: string;
}

export interface ExceptionAlert {
  id: string;
  tripId: string;
  vehicleId: string;
  severity: 'Critical' | 'High' | 'Medium';
  type: 'Delay Risk' | 'Route Deviation' | 'Idle Breach' | 'Compliance Risk';
  status: 'Open' | 'Investigating' | 'Resolved';
  message: string;
  etaImpactMinutes: number;
  createdAt: string;
}

export interface OperationsKpiSnapshot {
  onTimeRate: number;
  activeTrips: number;
  exceptionsOpen: number;
  avgDelayMinutes: number;
  utilizationRate: number;
}

export interface AuditEntry {
  id: string;
  actor: string;
  actorRole: UserRole;
  action: 'Exception Updated' | 'Trip Assigned' | 'Maintenance Logged';
  entityType: 'Exception' | 'Trip' | 'Maintenance';
  entityId: string;
  summary: string;
  timestamp: string;
}

export const initialVehicles: Vehicle[] = [
  { id: 'v1', number: 'TRK-1001', type: 'Heavy Truck', capacity: '20 Tons', status: 'In Transit' },
  { id: 'v2', number: 'TRK-1002', type: 'Medium Truck', capacity: '10 Tons', status: 'Available' },
  { id: 'v3', number: 'VAN-2001', type: 'Cargo Van', capacity: '3 Tons', status: 'Maintenance' },
  { id: 'v4', number: 'TRK-1003', type: 'Heavy Truck', capacity: '20 Tons', status: 'Available' },
  { id: 'v5', number: 'VAN-2002', type: 'Cargo Van', capacity: '3 Tons', status: 'In Transit' },
];

export const initialDrivers: Driver[] = [
  { id: 'd1', name: 'John Doe', licenseNumber: 'CDL-123456', phone: '+1 555-0101', assignedVehicleId: 'v1', status: 'Active' },
  { id: 'd2', name: 'Jane Smith', licenseNumber: 'CDL-234567', phone: '+1 555-0102', assignedVehicleId: 'v5', status: 'Active' },
  { id: 'd3', name: 'Mike Johnson', licenseNumber: 'CDL-345678', phone: '+1 555-0103', assignedVehicleId: null, status: 'On Leave' },
  { id: 'd4', name: 'Sarah Williams', licenseNumber: 'CDL-456789', phone: '+1 555-0104', assignedVehicleId: 'v2', status: 'Active' },
];

export const initialTrips: Trip[] = [
  { id: 't1', driverId: 'd1', vehicleId: 'v1', status: 'In Progress', pickup: 'New York, NY', destination: 'Boston, MA', date: '2023-10-15' },
  { id: 't2', driverId: 'd2', vehicleId: 'v5', status: 'In Progress', pickup: 'Chicago, IL', destination: 'Detroit, MI', date: '2023-10-16' },
  { id: 't3', driverId: 'd4', vehicleId: 'v2', status: 'Planned', pickup: 'Los Angeles, CA', destination: 'Las Vegas, NV', date: '2023-10-20' },
  { id: 't4', driverId: 'd1', vehicleId: 'v1', status: 'Completed', pickup: 'Philadelphia, PA', destination: 'New York, NY', date: '2023-10-10' },
];

export const initialMaintenance: MaintenanceRecord[] = [
  { id: 'm1', vehicleId: 'v3', date: '2023-10-12', description: 'Engine oil replacement and brake inspection', cost: 450 },
  { id: 'm2', vehicleId: 'v1', date: '2023-09-05', description: 'Tire replacement', cost: 1200 },
];

export const initialLocations: Location[] = [
  { id: 'l1', vehicleId: 'v1', lat: 41.5, lng: -73.0, speed: 65, eta: '2 hours' },
  { id: 'l2', vehicleId: 'v5', lat: 42.0, lng: -85.5, speed: 55, eta: '4 hours' },
];

export const initialExceptionAlerts: ExceptionAlert[] = [
  {
    id: 'e1',
    tripId: 't1',
    vehicleId: 'v1',
    severity: 'High',
    type: 'Delay Risk',
    status: 'Open',
    message: 'Traffic congestion is likely to delay arrival into Boston corridor.',
    etaImpactMinutes: 26,
    createdAt: '2026-04-07T09:20:00Z',
  },
  {
    id: 'e2',
    tripId: 't2',
    vehicleId: 'v5',
    severity: 'Critical',
    type: 'Route Deviation',
    status: 'Investigating',
    message: 'Vehicle diverted 13 km from planned lane sequence.',
    etaImpactMinutes: 38,
    createdAt: '2026-04-07T08:55:00Z',
  },
  {
    id: 'e3',
    tripId: 't3',
    vehicleId: 'v2',
    severity: 'Medium',
    type: 'Idle Breach',
    status: 'Open',
    message: 'Engine idle duration exceeded threshold at pickup yard.',
    etaImpactMinutes: 12,
    createdAt: '2026-04-07T10:05:00Z',
  },
];

export const initialOperationsKpiSnapshot: OperationsKpiSnapshot = {
  onTimeRate: 93,
  activeTrips: 2,
  exceptionsOpen: 2,
  avgDelayMinutes: 18,
  utilizationRate: 74,
};

export const initialAuditTrail: AuditEntry[] = [
  {
    id: 'a1',
    actor: 'System Seeder',
    actorRole: 'Admin',
    action: 'Exception Updated',
    entityType: 'Exception',
    entityId: 'e2',
    summary: 'Exception e2 moved to Investigating during initial simulation.',
    timestamp: '2026-04-07T08:56:00Z',
  },
];

// Dashboard Chart Data
export const tripsPerDayData = [
  { name: 'Mon', trips: 4 },
  { name: 'Tue', trips: 7 },
  { name: 'Wed', trips: 5 },
  { name: 'Thu', trips: 8 },
  { name: 'Fri', trips: 12 },
  { name: 'Sat', trips: 6 },
  { name: 'Sun', trips: 3 },
];

export const vehicleUtilizationData = [
  { name: 'In Transit', value: 40 },
  { name: 'Available', value: 45 },
  { name: 'Maintenance', value: 15 },
];

export const deliveryPerformanceData = [
  { name: 'Week 1', onTime: 95, delayed: 5 },
  { name: 'Week 2', onTime: 92, delayed: 8 },
  { name: 'Week 3', onTime: 98, delayed: 2 },
  { name: 'Week 4', onTime: 90, delayed: 10 },
];
