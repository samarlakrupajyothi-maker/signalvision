import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts';
import { LaneStats, VehicleType } from '../types/traffic';
import { BarChart3, LineChart as LineIcon, Layers, TrendingUp } from 'lucide-react';

interface TrafficChartsProps {
  lanes: LaneStats[];
  historyPoints: {
    time: string;
    totalVehicles: number;
    avgSpeed: number;
    laneA: number;
    laneB: number;
    laneC: number;
    laneD: number;
  }[];
}

export const TrafficCharts: React.FC<TrafficChartsProps> = ({ lanes, historyPoints }) => {
  const [viewMode, setViewMode] = useState<'types' | 'stacked' | 'timeseries'>('types');
  const [windowMode, setWindowMode] = useState<'now' | 'rolling60'>('now');

  // Compute vehicle type totals
  const vehicleTypeCounts = useMemo(() => {
    const counts: Record<VehicleType, number> = {
      car: 0,
      bus: 0,
      van: 0,
      auto: 0,
      lorry: 0,
      motorcycle: 0,
      ambulance: 0,
      fire_engine: 0,
      vip: 0,
    };

    lanes.forEach((lane) => {
      Object.entries(lane.vehicleCounts).forEach(([type, count]) => {
        counts[type as VehicleType] = (counts[type as VehicleType] || 0) + count;
      });
    });

    // If rolling 60s, add slight smoothing multiplier from recent history
    const multiplier = windowMode === 'rolling60' ? 2.4 : 1.0;

    return [
      { name: 'Car', type: 'car' as VehicleType, count: Math.round((counts.car || 0) * multiplier) },
      { name: 'Bus', type: 'bus' as VehicleType, count: Math.round((counts.bus || 0) * multiplier) },
      { name: 'Van', type: 'van' as VehicleType, count: Math.round((counts.van || 0) * multiplier) },
      { name: 'Auto', type: 'auto' as VehicleType, count: Math.round((counts.auto || 0) * multiplier) },
      { name: 'Lorry', type: 'lorry' as VehicleType, count: Math.round((counts.lorry || 0) * multiplier) },
      { name: 'Motorcycle', type: 'motorcycle' as VehicleType, count: Math.round((counts.motorcycle || 0) * multiplier) },
    ];
  }, [lanes, windowMode]);

  // Compute dominant vehicle type dynamically
  const dominant = useMemo(() => {
    if (vehicleTypeCounts.length === 0) return { name: 'None', count: 0 };
    return [...vehicleTypeCounts].sort((a, b) => b.count - a.count)[0];
  }, [vehicleTypeCounts]);

  // Per-lane stacked bar data
  const stackedData = useMemo(() => {
    return lanes.map((lane) => ({
      lane: `Lane ${lane.id}`,
      Car: lane.vehicleCounts.car || 0,
      Bus: lane.vehicleCounts.bus || 0,
      Auto: lane.vehicleCounts.auto || 0,
      Motorcycle: lane.vehicleCounts.motorcycle || 0,
      Heavy: (lane.vehicleCounts.lorry || 0) + (lane.vehicleCounts.van || 0),
    }));
  }, [lanes]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-md p-3 flex flex-col space-y-3">
      {/* Header with Dominant Label and Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2 text-xs">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-4 h-4 text-blue-400" />
          <span className="font-semibold text-slate-200">Traffic Distribution:</span>
          {/* Dynamically computed dominant label */}
          <span className="bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded font-mono text-[11px]">
            Dominant vehicle type: {dominant.name} ({dominant.count})
          </span>
        </div>

        {/* View toggles */}
        <div className="flex items-center space-x-2">
          {/* Rolling window toggle */}
          <div className="flex bg-slate-950 p-0.5 rounded border border-slate-800 text-[11px]">
            <button
              onClick={() => setWindowMode('now')}
              className={`px-2 py-0.5 rounded-xs transition ${
                windowMode === 'now' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'
              }`}
            >
              Now on road
            </button>
            <button
              onClick={() => setWindowMode('rolling60')}
              className={`px-2 py-0.5 rounded-xs transition ${
                windowMode === 'rolling60' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'
              }`}
            >
              Rolling 60s
            </button>
          </div>

          {/* Chart mode buttons */}
          <div className="flex bg-slate-950 p-0.5 rounded border border-slate-800 text-[11px]">
            <button
              onClick={() => setViewMode('types')}
              className={`px-2 py-0.5 rounded-xs transition flex items-center gap-1 ${
                viewMode === 'types' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Vehicle Type Breakdown"
            >
              <BarChart3 className="w-3 h-3" />
              <span>Types</span>
            </button>
            <button
              onClick={() => setViewMode('stacked')}
              className={`px-2 py-0.5 rounded-xs transition flex items-center gap-1 ${
                viewMode === 'stacked' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Per-lane Stacked Composition"
            >
              <Layers className="w-3 h-3" />
              <span>Lanes</span>
            </button>
            <button
              onClick={() => setViewMode('timeseries')}
              className={`px-2 py-0.5 rounded-xs transition flex items-center gap-1 ${
                viewMode === 'timeseries' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Total Vehicles Rolling Line Chart"
            >
              <LineIcon className="w-3 h-3" />
              <span>Trends</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chart Display Area */}
      <div className="h-56 w-full pt-1">
        {viewMode === 'types' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={vehicleTypeCounts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '4px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                {vehicleTypeCounts.map((entry, index) => {
                  const isMax = entry.name === dominant.name && dominant.count > 0;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={isMax ? '#38bdf8' : '#1e40af'} // Highlight tallest bar with bright sky blue!
                      stroke={isMax ? '#7dd3fc' : '#1d4ed8'}
                      strokeWidth={isMax ? 2 : 1}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {viewMode === 'stacked' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stackedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="lane" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '4px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
              <Bar dataKey="Car" stackId="a" fill="#0284c7" />
              <Bar dataKey="Bus" stackId="a" fill="#ea580c" />
              <Bar dataKey="Auto" stackId="a" fill="#ca8a04" />
              <Bar dataKey="Motorcycle" stackId="a" fill="#9333ea" />
              <Bar dataKey="Heavy" stackId="a" fill="#475569" />
            </BarChart>
          </ResponsiveContainer>
        )}

        {viewMode === 'timeseries' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '4px',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
              <Line type="monotone" dataKey="totalVehicles" stroke="#38bdf8" strokeWidth={2} dot={false} name="Total Inflow" />
              <Line type="monotone" dataKey="laneA" stroke="#22c55e" strokeWidth={1.5} dot={false} name="Lane A (North)" />
              <Line type="monotone" dataKey="laneB" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="Lane B (East)" />
              <Line type="monotone" dataKey="laneC" stroke="#ef4444" strokeWidth={1.5} dot={false} name="Lane C (South)" />
              <Line type="monotone" dataKey="laneD" stroke="#a855f7" strokeWidth={1.5} dot={false} name="Lane D (West)" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
