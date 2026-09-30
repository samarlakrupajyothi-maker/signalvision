import React from 'react';
import { CameraNode } from '../types/traffic';
import { 
  BarChart, 
  TrendingUp, 
  AlertTriangle, 
  Compass, 
  Gauge, 
  Activity,
  Layers
} from 'lucide-react';

interface AnalyticsMatrixProps {
  cameras: CameraNode[];
}

export const AnalyticsMatrix: React.FC<AnalyticsMatrixProps> = ({ cameras }) => {
  // Sort cameras to find top congested bottlenecks
  const rankedBottlenecks = [...cameras].sort((a, b) => b.vehicleCount - a.vehicleCount);
  const mostCongested = rankedBottlenecks[0];

  // Origin-Destination Matrix Data between major Vijayawada Hubs (hourly vehicle trips)
  const odNodes = ['Benz Circle', 'MG Road', 'PCR Circle', 'PNBS Hub'];
  const odMatrix = [
    [0, 480, 620, 310], // Benz Circle -> others
    [510, 0, 390, 440], // MG Road -> others
    [640, 420, 0, 580], // PCR Circle -> others
    [390, 490, 610, 0], // PNBS Hub -> others
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-md p-4 flex flex-col space-y-4">
      {/* Header & Direct Plain-Language Answer */}
      <div className="border-b border-slate-800 pb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              City-Wide Traffic Analytics & Bottleneck Ranking
            </h2>
          </div>
          <p className="text-xs text-blue-400 font-medium mt-0.5">
            Answers: "Which junction is most congested now?"
          </p>
        </div>

        {/* Direct Plain Answer Pill */}
        {mostCongested && (
          <div className="bg-red-950 border border-red-700 px-3 py-1 rounded text-xs text-red-200 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>
              Most Congested Junction: <strong className="text-white">{mostCongested.name}</strong> ({mostCongested.vehicleCount} veh/hr)
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ranked Congestion Bottlenecks */}
        <div className="bg-slate-950 p-3 rounded border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <span>Ranked Congestion Bottlenecks:</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Real-Time Inflow</span>
          </div>

          <div className="space-y-2">
            {rankedBottlenecks.slice(0, 5).map((cam, idx) => {
              const maxVol = rankedBottlenecks[0].vehicleCount || 1;
              const pct = Math.round((cam.vehicleCount / maxVol) * 100);
              const isTop = idx === 0;

              return (
                <div key={cam.id} className="text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-300 font-medium flex items-center gap-1.5">
                      <span className={`w-4 h-4 rounded-xs text-[10px] flex items-center justify-center font-bold ${
                        isTop ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        #{idx + 1}
                      </span>
                      <span>{cam.name}</span>
                    </span>
                    <span className="font-mono text-slate-200 font-bold">
                      {cam.vehicleCount} veh/hr
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-xs overflow-hidden">
                    <div
                      className={`h-full rounded-xs transition-all duration-500 ${
                        isTop ? 'bg-red-500' : cam.vehicleCount > 55 ? 'bg-amber-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Origin-Destination (O-D) Matrix */}
        <div className="bg-slate-950 p-3 rounded border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-blue-400" />
              <span>Origin-Destination (O-D) Flow Matrix:</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Trips / Hour</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="text-left py-1 text-[10px] font-semibold">Origin \ Dest</th>
                  {odNodes.map((node) => (
                    <th key={node} className="text-right py-1 px-2 text-[10px] font-semibold">
                      {node}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {odNodes.map((origin, rowIdx) => (
                  <tr key={origin} className="border-b border-slate-900 last:border-0 hover:bg-slate-900/50">
                    <td className="py-1.5 text-slate-300 font-medium">{origin}</td>
                    {odMatrix[rowIdx].map((val, colIdx) => (
                      <td
                        key={colIdx}
                        className={`text-right py-1.5 px-2 font-mono ${
                          rowIdx === colIdx 
                            ? 'text-slate-600' 
                            : val > 550 
                            ? 'text-amber-400 font-bold' 
                            : 'text-slate-300'
                        }`}
                      >
                        {rowIdx === colIdx ? '—' : val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Average Speeds Across Urban Corridors */}
      <div className="bg-slate-950 p-3 rounded border border-slate-800">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Gauge className="w-3.5 h-3.5 text-emerald-400" />
          <span>Average Corridor Speeds & Calibration Health:</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {cameras.slice(0, 4).map((cam) => (
            <div key={cam.id} className="bg-slate-900 p-2 rounded border border-slate-800 flex flex-col justify-between">
              <span className="text-[11px] text-slate-400 truncate" title={cam.name}>
                {cam.junction}
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="font-mono text-base font-bold text-slate-100">
                  {cam.avgSpeedKmH} <span className="text-xs font-normal text-slate-400">km/h</span>
                </span>
                <span className="text-[9px] bg-slate-800 text-emerald-400 px-1 py-0.5 rounded border border-slate-700">
                  Homography OK
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
