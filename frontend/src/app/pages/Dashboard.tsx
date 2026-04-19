import { useState, useEffect } from 'react';
import { Truck, Route, Users, Wrench, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend, ComposedChart, Line } from 'recharts';
import { apiGetDashboardStats } from '../api';
import { cn } from '../utils/classnames';

const COLORS = ['#10b981', '#3b82f6', '#22d3ee', '#e2e8f0'];

export const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [visibleDays, setVisibleDays] = useState(7);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotificationToast, setShowNotificationToast] = useState(false);


  const filteredTripsPerDayData = stats
    ? stats.tripsPerDayData.slice(-visibleDays)
    : [];

  const filteredDeliveryPerformanceData = stats
    ? stats.deliveryPerformanceData.slice(-Math.max(2, Math.ceil(visibleDays / 2)))
    : [];

  const operationsPulseData = stats
    ? filteredTripsPerDayData.map((day: any, index: number) => {
        const weekData = filteredDeliveryPerformanceData[index % filteredDeliveryPerformanceData.length];
        const completionRate = weekData ? weekData.onTime : 90;

        return {
          name: day.name,
          planned: day.trips + 2,
          completed: day.trips,
          completionRate,
        };
      })
    : [];

  useEffect(() => {
    
    apiGetDashboardStats().then(data => {
      setStats(data);
      setLoading(false);
    });

    
    // Connect to notification-service WebSocket
    const socket = io('http://localhost:8000', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    // Listen for real-time shipment updates
    socket.on('shipment_update', (data) => {
      const newNotification = {
        id: data.shipment_id,
        message: `New shipment from ${data.origin} to ${data.destination}`,
        timestamp: new Date(),
        ...data
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      setShowNotificationToast(true);
      
      // Auto-hide toast after 5 seconds
      setTimeout(() => setShowNotificationToast(false), 5000);
    });

    return () => socket.disconnect();
  }, []);

  if (loading) return <div className="animate-pulse text-slate-600 font-medium">Loading dashboard telemetry...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Notification Toast */}
      {showNotificationToast && notifications.length > 0 && (
        <div className="fixed top-20 right-6 bg-emerald-50 border border-emerald-200 rounded-xl shadow-lg p-4 z-50 animate-slide-in max-w-sm">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">{notifications[0].message}</p>
              <p className="text-xs text-emerald-700 mt-1">{notifications[0].timestamp.toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      )}
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h2>
          <p className="text-slate-500 text-sm mt-1">Real-time metrics and fleet status.</p>
        </div>

        <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
            <span className="text-slate-500">Data Window</span>
            <span className="text-emerald-700">Last {visibleDays} days</span>
          </div>
          <input
            type="range"
            min={3}
            max={7}
            step={1}
            value={visibleDays}
            onChange={(event) => setVisibleDays(Number(event.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gradient-to-r from-emerald-300 via-emerald-400 to-cyan-400 accent-emerald-600"
            aria-label="Filter dashboard data by number of days"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Vehicles" value={stats.totalVehicles} icon={Truck} trend="+12%" trendUp={true} />
        <StatCard title="Active Trips" value={stats.activeTrips} icon={Route} trend="+5%" trendUp={true} />
        <StatCard title="Available Drivers" value={stats.availableDrivers} icon={Users} trend="-2%" trendUp={false} />
        <StatCard title="Under Maintenance" value={stats.vehiclesUnderMaintenance} icon={Wrench} trend="+1" trendUp={false} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full min-w-0">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm w-full min-w-0">
          <h3 className="text-xs font-semibold mb-6 text-slate-500 uppercase tracking-widest">Trips per Day</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredTripsPerDayData}>
                <defs>
                  <linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1a1a1a', borderRadius: '8px' }}
                  itemStyle={{ color: '#1a1a1a' }}
                  cursor={{stroke: '#e2e8f0', strokeWidth: 1}}
                />
                <Area type="monotone" dataKey="trips" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorTrips)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm w-full min-w-0 flex flex-col">
          <h3 className="text-xs font-semibold mb-6 text-slate-500 uppercase tracking-widest">Utilization</h3>
          <div className="flex-1 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.vehicleUtilizationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.vehicleUtilizationData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1a1a1a', borderRadius: '8px' }}
                  itemStyle={{ color: '#1a1a1a' }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', color: '#64748b' }} iconType="circle"/>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none -mt-8">
               <span className="text-2xl font-bold text-slate-900">{stats.vehicleUtilizationData[0].value}%</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm w-full min-w-0">
          <h3 className="text-xs font-semibold mb-6 text-slate-500 uppercase tracking-widest">Delivery Performance</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredDeliveryPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} />
                <Tooltip
                  cursor={{fill: '#f1f5f9', opacity: 0.5}}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1a1a1a', borderRadius: '8px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#64748b', paddingTop: '10px' }} iconType="circle" />
                <Bar dataKey="onTime" name="On Time" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="delayed" name="Delayed" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-3 rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/40 to-cyan-50/40 p-6 shadow-sm w-full min-w-0">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-semibold text-emerald-700 uppercase tracking-widest">Operations Pulse</h3>
              <p className="mt-1 text-sm text-slate-600">Planned vs completed trips with daily completion rate.</p>
            </div>
            <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
              Live Snapshot
            </span>
          </div>

          <div className="h-80 w-full rounded-xl border border-white/70 bg-white/80 p-3 backdrop-blur-sm">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={operationsPulseData}>
                <defs>
                  <linearGradient id="pulseBars" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.85} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.45} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#dbeafe" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={8} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[60, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#0f766e', fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  cursor={{ fill: '#ecfeff', opacity: 0.55 }}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#dbeafe', color: '#1a1a1a', borderRadius: '10px' }}
                  formatter={(value: number, name: string) => {
                    if (name === 'completionRate') return [`${value}%`, 'Completion Rate'];
                    if (name === 'planned') return [value, 'Planned Trips'];
                    return [value, 'Completed Trips'];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#64748b', paddingTop: '8px' }} iconType="circle" />
                <Bar yAxisId="left" dataKey="planned" name="Planned Trips" fill="#cbd5e1" radius={[8, 8, 0, 0]} barSize={18} />
                <Bar yAxisId="left" dataKey="completed" name="Completed Trips" fill="url(#pulseBars)" radius={[8, 8, 0, 0]} barSize={18} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="completionRate"
                  name="Completion Rate"
                  stroke="#0f766e"
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 2, fill: '#ffffff' }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

function StatCard({ title, value, icon: Icon, trend, trendUp }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden group hover:border-emerald-400/60 hover:shadow-lg transition-all">
      <div className="absolute -top-4 -right-4 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
        <Icon className="w-24 h-24 text-emerald-500" />
      </div>
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{title}</h3>
      </div>
      <div className="flex items-end justify-between z-10">
        <span className="text-4xl font-bold text-slate-900 tracking-tight">{value}</span>
        <span className={cn(
          "text-xs font-semibold flex items-center gap-1 px-2 py-1 rounded-md border",
          trendUp ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-blue-700 bg-blue-50 border-blue-200"
        )}>
          {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend}
        </span>
      </div>
    </div>
  );
}