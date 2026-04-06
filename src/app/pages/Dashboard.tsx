import { useState, useEffect } from 'react';
import { Truck, Route, Users, Wrench, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { apiGetDashboardStats } from '../api';
import { cn } from '../utils/classnames';

const COLORS = ['#10b981', '#3b82f6', '#22d3ee', '#e2e8f0'];

export const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetDashboardStats().then(data => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="animate-pulse text-slate-600 font-medium">Loading dashboard telemetry...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h2>
        <p className="text-slate-500 text-sm mt-1">Real-time metrics and fleet status.</p>
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
              <AreaChart data={stats.tripsPerDayData}>
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
                  {stats.vehicleUtilizationData.map((entry: any, index: number) => (
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
              <BarChart data={stats.deliveryPerformanceData}>
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