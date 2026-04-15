import { useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { AlertTriangle, Clock3, Gauge, ShieldAlert, Siren, Activity, History } from 'lucide-react';
import { apiGetAuditTrail, apiGetOperationsSnapshot, apiSubscribeToTelemetryAlerts, apiUpdateExceptionStatus } from '../api';
import { cn } from '../utils/classnames';
import { canPerform, getCurrentRole, getCurrentUser } from '../utils/auth';
import type { AuditEntry, ExceptionAlert, OperationsKpiSnapshot, UserRole } from '../api/mockData';

type OperationsResponse = {
  kpis: OperationsKpiSnapshot;
  alerts: ExceptionAlert[];
};

const severityClasses: Record<ExceptionAlert['severity'], string> = {
  Critical: 'border-red-200 bg-red-50 text-red-700',
  High: 'border-amber-200 bg-amber-50 text-amber-700',
  Medium: 'border-blue-200 bg-blue-50 text-blue-700',
};

export const Operations = () => {
  const [snapshot, setSnapshot] = useState<OperationsResponse | null>(null);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'All' | ExceptionAlert['status']>('All');
  const currentUser = getCurrentUser();
  const actor = currentUser?.name || 'Unknown User';
  const actorRole = getCurrentRole();
  const canUpdateExceptions = canPerform('exceptions:update');
  const canViewAudit = canPerform('audit:view');

  const loadSnapshot = async () => {
    setLoading(true);
    const [snapshotData, auditData] = await Promise.all([
      apiGetOperationsSnapshot(),
      apiGetAuditTrail(),
    ]);
    setSnapshot(snapshotData as OperationsResponse);
    setAuditEntries(auditData as AuditEntry[]);
    setLoading(false);
  };

  useEffect(() => {
    loadSnapshot();

    const unsubscribe = apiSubscribeToTelemetryAlerts(() => {
      loadSnapshot();
    });

    return () => unsubscribe();
  }, []);

  const filteredAlerts = useMemo(() => {
    if (!snapshot) return [];
    if (statusFilter === 'All') return snapshot.alerts;
    return snapshot.alerts.filter((alert: ExceptionAlert) => alert.status === statusFilter);
  }, [snapshot, statusFilter]);

  const onUpdateStatus = async (id: string, status: ExceptionAlert['status']) => {
    if (!canUpdateExceptions) return;
    await apiUpdateExceptionStatus(id, status, actor, actorRole as UserRole);
    await loadSnapshot();
  };

  if (loading) {
    return <div className="animate-pulse text-slate-600 font-medium">Loading operations center...</div>;
  }

  if (!snapshot) {
    return <div className="text-slate-600">Unable to load operations center data.</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-white via-cyan-50/50 to-emerald-50/30 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Operations Center</h2>
            <p className="mt-1 text-sm text-slate-600">Control tower for SLA health, live exceptions, and fleet risk.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
            <Activity className="h-3.5 w-3.5" />
            Live
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <KpiCard title="On-Time Rate" value={`${snapshot.kpis.onTimeRate}%`} subtitle="SLA adherence" icon={Clock3} />
        <KpiCard title="Active Trips" value={String(snapshot.kpis.activeTrips)} subtitle="In progress now" icon={Gauge} />
        <KpiCard title="Open Exceptions" value={String(snapshot.kpis.exceptionsOpen)} subtitle="Needs action" icon={Siren} />
        <KpiCard title="Avg Delay" value={`${snapshot.kpis.avgDelayMinutes} min`} subtitle="Current risk" icon={AlertTriangle} />
        <KpiCard title="Utilization" value={`${snapshot.kpis.utilizationRate}%`} subtitle="Fleet usage" icon={ShieldAlert} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600">Exception Queue</h3>
            <p className="mt-1 text-xs text-slate-500">Prioritize and resolve operational blockers.</p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'All' | ExceptionAlert['status'])}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none"
              aria-label="Filter exceptions by status"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Investigating">Investigating</option>
              <option value="Resolved">Resolved</option>
            </select>
            <button
              onClick={loadSnapshot}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
            >
              Refresh
            </button>
          </div>
        </div>

        {!canUpdateExceptions && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Current role is read-only for exception updates.
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] uppercase tracking-widest text-slate-500">
                <th className="px-5 py-4 font-semibold">Alert</th>
                <th className="px-5 py-4 font-semibold">Trip / Vehicle</th>
                <th className="px-5 py-4 font-semibold">ETA Impact</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    No exceptions found for this filter.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert: ExceptionAlert) => (
                  <tr key={alert.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="max-w-[360px]">
                        <div className="flex items-center gap-2">
                          <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', severityClasses[alert.severity])}>
                            {alert.severity}
                          </span>
                          <span className="text-xs font-semibold text-slate-700">{alert.type}</span>
                        </div>
                        <p className="mt-2 text-sm text-slate-700">{alert.message}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      <p className="font-medium">{alert.tripId.toUpperCase()}</p>
                      <p className="mt-1 text-xs text-slate-500">Vehicle {alert.vehicleId.toUpperCase()}</p>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-amber-700">+{alert.etaImpactMinutes} min</td>
                    <td className="px-5 py-4">
                      <span className={cn(
                        'rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider',
                        alert.status === 'Resolved' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
                        alert.status === 'Open' && 'border-red-200 bg-red-50 text-red-700',
                        alert.status === 'Investigating' && 'border-blue-200 bg-blue-50 text-blue-700',
                      )}>
                        {alert.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onUpdateStatus(alert.id, 'Investigating')}
                          disabled={!canUpdateExceptions || alert.status === 'Investigating' || alert.status === 'Resolved'}
                          className="rounded-full border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Investigate
                        </button>
                        <button
                          onClick={() => onUpdateStatus(alert.id, 'Resolved')}
                          disabled={!canUpdateExceptions || alert.status === 'Resolved'}
                          className="rounded-full border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Resolve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h3 className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
            <History className="h-4 w-4 text-slate-400" />
            Audit Trail
          </h3>
        </div>

        {!canViewAudit ? (
          <div className="p-5 text-sm text-slate-500">Your role does not permit viewing audit logs.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase tracking-widest text-slate-500">
                  <th className="px-5 py-4 font-semibold">Timestamp</th>
                  <th className="px-5 py-4 font-semibold">Actor</th>
                  <th className="px-5 py-4 font-semibold">Action</th>
                  <th className="px-5 py-4 font-semibold">Entity</th>
                  <th className="px-5 py-4 font-semibold">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditEntries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                      No audit entries available.
                    </td>
                  </tr>
                ) : (
                  auditEntries.map((entry: AuditEntry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {new Date(entry.timestamp).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700">
                        <p className="font-medium">{entry.actor}</p>
                        <p className="text-xs text-slate-500">{entry.actorRole}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700">{entry.action}</td>
                      <td className="px-5 py-4 text-sm text-slate-700">{entry.entityType} {entry.entityId.toUpperCase()}</td>
                      <td className="px-5 py-4 text-sm text-slate-700">{entry.summary}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

type KpiCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
};

const KpiCard = ({ title, value, subtitle, icon: Icon }: KpiCardProps) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
        <span className="inline-flex rounded-lg border border-emerald-100 bg-emerald-50 p-2 text-emerald-700">
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
};
