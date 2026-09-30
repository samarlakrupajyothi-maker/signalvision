import React, { useState } from 'react';
import { 
  TrafficAlert 
} from '../types/traffic';
import { 
  Bell, 
  ShieldAlert, 
  AlertTriangle, 
  Siren, 
  Crown, 
  Flame,
  Gauge,
  Navigation2,
  Check, 
  CheckCheck,
  Scale,
  Ban
} from 'lucide-react';

interface AlertsDrawerProps {
  alerts: TrafficAlert[];
  onAcknowledgeAlert: (id: string) => void;
  onClearAll: () => void;
}

export const AlertsDrawer: React.FC<AlertsDrawerProps> = ({
  alerts,
  onAcknowledgeAlert,
  onClearAll,
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  const filteredAlerts = alerts.filter((a) => {
    if (filterType === 'all') return true;
    if (filterType === 'unacknowledged') return !a.acknowledged;
    if (filterType === 'violations') {
      return a.type === 'signal_jumping' || a.type === 'wrong_route' || a.type === 'overspeeding';
    }
    if (filterType === 'emergency') {
      return a.type === 'emergency' || a.type === 'fire_engine';
    }
    if (filterType === 'government') {
      return a.type === 'vip' || a.type === 'govt_vehicle';
    }
    if (filterType === 'blacklist') {
      return a.type === 'blacklist';
    }
    return a.type === filterType;
  });

  const getAlertIcon = (type: TrafficAlert['type']) => {
    switch (type) {
      case 'signal_jumping':
        return <Ban className="w-4 h-4 text-red-500 shrink-0" />;
      case 'wrong_route':
        return <Navigation2 className="w-4 h-4 text-orange-400 shrink-0 rotate-180" />;
      case 'overspeeding':
        return <Gauge className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'fire_engine':
        return <Flame className="w-4 h-4 text-red-500 shrink-0 animate-bounce" />;
      case 'emergency':
        return <Siren className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />;
      case 'vip':
      case 'govt_vehicle':
        return <Crown className="w-4 h-4 text-amber-300 shrink-0" />;
      case 'blacklist':
        return <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'route_anomaly':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      default:
        return <Bell className="w-4 h-4 text-blue-400 shrink-0" />;
    }
  };

  const getSeverityBadge = (severity: TrafficAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return <span className="bg-red-950 text-red-400 border border-red-800 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase">Critical</span>;
      case 'high':
        return <span className="bg-amber-950 text-amber-400 border border-amber-800 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase">High</span>;
      case 'medium':
        return <span className="bg-blue-950 text-blue-400 border border-blue-800 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase">Medium</span>;
      default:
        return <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase">Info</span>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-md p-4 flex flex-col space-y-3">
      {/* Header with count and filters */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-400" />
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Indian Traffic Violations & Government Priority Engine
            </h3>
            <span className="text-[10px] text-slate-400">
              MV Act 1988/2019 • e-Challan Integration • 108 Emergency & Fire Priority
            </span>
          </div>
        </div>

        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] font-mono">
          {alerts.filter((a) => !a.acknowledged).length} active alerts
        </span>
      </div>

      {/* Filter buttons */}
      <div className="flex flex-wrap items-center gap-1 text-[11px]">
        <button
          onClick={() => setFilterType('all')}
          className={`px-2 py-0.5 rounded-xs transition ${
            filterType === 'all' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white bg-slate-950'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterType('violations')}
          className={`px-2 py-0.5 rounded-xs transition flex items-center gap-1 ${
            filterType === 'violations' ? 'bg-red-700 text-white font-bold' : 'text-red-300 hover:text-white bg-slate-950'
          }`}
        >
          <Ban className="w-3 h-3" />
          <span>Traffic Violations</span>
        </button>
        <button
          onClick={() => setFilterType('emergency')}
          className={`px-2 py-0.5 rounded-xs transition flex items-center gap-1 ${
            filterType === 'emergency' ? 'bg-red-700 text-white font-bold' : 'text-red-300 hover:text-white bg-slate-950'
          }`}
        >
          <Flame className="w-3 h-3" />
          <span>Fire & Ambulance</span>
        </button>
        <button
          onClick={() => setFilterType('government')}
          className={`px-2 py-0.5 rounded-xs transition flex items-center gap-1 ${
            filterType === 'government' ? 'bg-amber-700 text-white font-bold' : 'text-amber-300 hover:text-white bg-slate-950'
          }`}
        >
          <Crown className="w-3 h-3" />
          <span>VIP & Govt</span>
        </button>
        <button
          onClick={() => setFilterType('blacklist')}
          className={`px-2 py-0.5 rounded-xs transition flex items-center gap-1 ${
            filterType === 'blacklist' ? 'bg-rose-700 text-white font-bold' : 'text-rose-300 hover:text-white bg-slate-950'
          }`}
        >
          <ShieldAlert className="w-3 h-3" />
          <span>Blocked Vehicles</span>
        </button>
      </div>

      {/* Alerts list */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {filteredAlerts.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500 bg-slate-950 rounded border border-slate-800">
            No active alerts under this filter. Use the simulation controls to trigger Indian traffic rule violations or spawn government/emergency vehicles.
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-2.5 rounded border text-xs flex items-start justify-between gap-3 transition ${
                alert.acknowledged
                  ? 'bg-slate-950/60 border-slate-850 opacity-60'
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {getAlertIcon(alert.type)}
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-slate-200">{alert.title}</span>
                    {getSeverityBadge(alert.severity)}
                    {alert.mvActSection && (
                      <span className="bg-slate-800 text-amber-300 border border-slate-700 text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold">
                        {alert.mvActSection}
                      </span>
                    )}
                    {alert.fineAmount && (
                      <span className="bg-red-950 text-red-300 border border-red-800 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">
                        e-Challan ₹{alert.fineAmount.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{alert.description}</p>
                  <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-3">
                    <span>{alert.timestamp}</span>
                    <span>Camera: {alert.cameraId}</span>
                    {alert.plate && <span className="text-blue-400 font-bold">Plate: {alert.plate}</span>}
                  </div>
                </div>
              </div>

              {/* Acknowledge Button */}
              {!alert.acknowledged ? (
                <button
                  onClick={() => onAcknowledgeAlert(alert.id)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-[10px] font-medium flex items-center gap-1 shrink-0"
                  title="Acknowledge alert"
                >
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Ack</span>
                </button>
              ) : (
                <span className="text-[10px] text-emerald-500 flex items-center gap-1 shrink-0">
                  <CheckCheck className="w-3 h-3" />
                  <span>Acked</span>
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
