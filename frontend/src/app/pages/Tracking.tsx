import { useState, useEffect, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import { Map as MapIcon, Navigation, Clock, Activity, Target } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { apiGetTracking, apiGetDrivers } from '../api';

const customIcon = new L.Icon({
// ... keep existing icon stuff
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const MapFitter = ({ liveLocations }: { liveLocations: any }) => {
  const map = useMap();
  useEffect(() => {
    const locs: any[] = Object.values(liveLocations);
    if (locs.length > 0) {
      const bounds = L.latLngBounds(locs.map(l => [l.latitude, l.longitude]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { animate: true, padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [Object.keys(liveLocations).length]); // Only fit bounds when a new driver appears
  return null;
};

export const Tracking = () => {
  const [staticLocations, setStaticLocations] = useState<any[]>([]);
  const [liveLocations, setLiveLocations] = useState<Record<string, any>>({});
  const [locationHistory, setLocationHistory] = useState<Record<string, [number, number][]>>({});
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load static metadata and drivers
  useEffect(() => {
    Promise.all([apiGetTracking(), apiGetDrivers()]).then(([locData, driverData]) => {
      setStaticLocations(locData);
      setDrivers(driverData);
      if (locData.length > 0) {
        setSelectedVehicleId(locData[0].vehicleId);
      }
      setLoading(false);
    });
  }, []);

  // Connect to the Telemetry WebSocket
  useEffect(() => {
    const wsUrl = "ws://localhost:8004/ws/dispatcher";
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'init') {
        setLiveLocations(data.data);
      } else if (data.type === 'location_update') {
        const livePing = data.data;
        setLiveLocations(prev => ({
          ...prev,
          [livePing.driver_id]: livePing
        }));
        setLocationHistory(prev => {
          const history = prev[livePing.driver_id] || [];
          return {
            ...prev,
            [livePing.driver_id]: [...history, [livePing.latitude, livePing.longitude]]
          };
        });
      }
    };

    return () => ws.close();
  }, []);

  const getDriver = (driverId: string) => drivers.find(d => d.id === driverId) || { name: driverId, assignedVehicleId: null };

  const mergedSelectedVehicle = useMemo(() => {
    if (!selectedVehicleId) return null;
    
    const staticProfile = staticLocations.find(l => l.vehicleId === selectedVehicleId) || {};
    const assignedDriver = drivers.find(d => d.assignedVehicleId === selectedVehicleId);
    const driverId = assignedDriver?.id;
    
    // Fallback if driver is live but has no static location matched yet
    const liveStats = driverId ? liveLocations[driverId] : null;
    
    return {
      ...staticProfile,
      speed: liveStats?.speed ? Math.round(liveStats.speed) : staticProfile.speed || 0,
      lat: liveStats?.latitude || staticProfile.lat || 0,
      lng: liveStats?.longitude || staticProfile.lng || 0,
      driverName: assignedDriver?.name || staticProfile.driverName || 'Unassigned',
      vehicleNumber: staticProfile.vehicleNumber || `Vehicle ${selectedVehicleId}`,
      currentTripDestination: staticProfile.currentTripDestination || 'Boston, MA',
      eta: staticProfile.eta || '2 Hours'
    };
  }, [selectedVehicleId, staticLocations, liveLocations, drivers]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full h-full flex flex-col">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Real-Time Fleet Tracking</h2>
        <p className="text-slate-500 text-sm mt-1">Live telemetry streaming directly from vehicles via WebSockets.</p>
      </div>

      <div className="flex-1 min-h-[500px] bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col lg:flex-row w-full shadow-sm relative z-0">
        
        {/* Real React-Leaflet Map Container */}
        <div className="flex-1 relative border-r border-slate-200 bg-slate-100 z-0">
          <MapContainer 
            center={[40.7580, -73.9855]} 
            zoom={13} 
            style={{ height: '100%', width: '100%', zIndex: 0 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapFitter liveLocations={liveLocations} />
            
            {/* Render Live WebSockets Drivers */}
            {Object.values(liveLocations).map((loc: any) => {
              const driver = getDriver(loc.driver_id);
              const path = locationHistory[loc.driver_id] || [];
              const isSelected = selectedVehicleId === driver.assignedVehicleId;
              
              return (
                <div key={`container-${loc.driver_id}`}>
                  {path.length > 1 && (
                    <Polyline 
                      positions={path} 
                      color={isSelected ? "#10b981" : "#3b82f6"} 
                      weight={isSelected ? 4 : 2} 
                      opacity={0.8}
                    />
                  )}
                  <Marker 
                    key={loc.driver_id} 
                    position={[loc.latitude, loc.longitude]}
                    icon={customIcon}
                    eventHandlers={{
                      click: () => {
                        if (driver.assignedVehicleId) setSelectedVehicleId(driver.assignedVehicleId);
                      }
                    }}
                  >
                    <Tooltip permanent direction="top" offset={[0, -40]}>
                      <div className="font-bold text-center">
                        <div>{loc.driver_name || driver.name}</div>
                        <div className="text-[10px] text-emerald-600 border-t mt-0.5 pt-0.5">{Math.round(loc.speed)} mph</div>
                      </div>
                    </Tooltip>
                  </Marker>
                </div>
              );
            })}

            {/* Render Static Inactive Drivers */}
            {staticLocations.map((loc: any) => {
               const attachedDriver = drivers.find(d => d.assignedVehicleId === loc.vehicleId);
               if (attachedDriver && liveLocations[attachedDriver.id]) return null; 

               return (
                <Marker 
                  key={loc.id} 
                  position={[loc.lat, loc.lng]}
                  icon={customIcon}
                  eventHandlers={{
                    click: () => setSelectedVehicleId(loc.vehicleId)
                  }}
                >
                  <Tooltip permanent direction="top" offset={[0, -40]}>
                    <div className="font-bold text-center text-slate-500">
                      <div>{loc.vehicleNumber}</div>
                      <div className="text-[10px] text-slate-400 border-t mt-0.5 pt-0.5">Offline</div>
                    </div>
                  </Tooltip>
                </Marker>
               )
            })}
          </MapContainer>
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
          ) : mergedSelectedVehicle ? (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Asset</span>
                    <h4 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{mergedSelectedVehicle.vehicleNumber}</h4>
                  </div>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm group">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:border-emerald-300 transition-colors">
                      <Activity className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-slate-500 text-[10px] uppercase tracking-widest font-semibold mb-0.5">Speed</p>
                      <p className="font-semibold text-slate-900">{mergedSelectedVehicle.speed} mph</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm group">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:border-blue-300 transition-colors">
                      <Target className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-slate-500 text-[10px] uppercase tracking-widest font-semibold mb-0.5">Destination</p>
                      <p className="font-semibold text-slate-900">{mergedSelectedVehicle.currentTripDestination}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm group">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:border-cyan-300 transition-colors">
                      <Clock className="w-4 h-4 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-slate-500 text-[10px] uppercase tracking-widest font-semibold mb-0.5">ETA</p>
                      <p className="font-semibold text-slate-900">{mergedSelectedVehicle.eta}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-widest">Operator</h4>
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer group">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-sm font-bold text-emerald-700">
                    {mergedSelectedVehicle.driverName?.split(' ').map((n: string) => n[0]).join('') || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{mergedSelectedVehicle.driverName}</p>
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
