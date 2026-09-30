import React from 'react';
import { LaneStats, VehicleType } from '../types/traffic';
import { ArrowUp, ArrowRight, ArrowDown, ArrowLeft, Car, Bus, Truck, Bike } from 'lucide-react';

interface LanePanelsProps {
  lanes: LaneStats[];
  onManualTriggerGreen?: (laneId: string) => void;
}

export const LanePanels: React.FC<LanePanelsProps> = ({ lanes, onManualTriggerGreen }) => {
  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'North': return <ArrowDown className="w-3.5 h-3.5 text-blue-400" />; // Coming from North
      case 'East': return <ArrowLeft className="w-3.5 h-3.5 text-blue-400" />;
      case 'South': return <ArrowUp className="w-3.5 h-3.5 text-blue-400" />;
      case 'West': return <ArrowRight className="w-3.5 h-3.5 text-blue-400" />;
      default: return null;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {lanes.map((lane) => {
        const isGreen = lane.signal === 'GREEN';
        const isYellow = lane.signal === 'YELLOW';
        const isRed = lane.signal === 'RED' || lane.signal === 'ALL_RED';

        // Circular countdown progress
        const radius = 18;
        const circumference = 2 * Math.PI * radius;
        const totalDuration = isGreen ? lane.allocatedGreen : isYellow ? 3 : 24;
        const progressPct = Math.min(1, Math.max(0, lane.countdown / Math.max(1, totalDuration)));
        const strokeDashoffset = circumference * (1 - progressPct);

        const circleColor = isGreen ? '#22c55e' : isYellow ? '#eab308' : '#ef4444';

        return (
          <div
            key={lane.id}
            className={`relative bg-slate-900 border rounded-md p-3.5 flex flex-col justify-between transition-all ${
              isGreen 
                ? 'border-emerald-500/80 shadow-[0_0_12px_rgba(34,197,94,0.15)]' 
                : isYellow
                ? 'border-amber-500/80'
                : 'border-slate-800'
            }`}
          >
            {/* Header: Lane ID, Direction, and FIXED CORNER CIRCULAR TIMER */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-sm">Lane {lane.id}</span>
                  <div className="flex items-center text-xs text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                    {getDirectionIcon(lane.direction)}
                    <span className="ml-1 text-[11px]">{lane.direction} Approach</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {lane.name}
                </div>
              </div>

              {/* Fixed Corner Circular Countdown Timer */}
              <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                <svg className="w-12 h-12 transform -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r={radius}
                    stroke="#1e293b"
                    strokeWidth="3.5"
                    fill="transparent"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r={radius}
                    stroke={circleColor}
                    strokeWidth="3.5"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-300 ease-linear"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                  <span className={`text-xs font-bold ${
                    isGreen ? 'text-emerald-400' : isYellow ? 'text-amber-400' : 'text-slate-300'
                  }`}>
                    {String(lane.countdown).padStart(2, '0')}
                  </span>
                  <span className="text-[7.5px] uppercase text-slate-400 tracking-tighter">SEC</span>
                </div>
              </div>
            </div>

            {/* Signal Status Badge */}
            <div className="mt-2.5 mb-2 flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase ${
                isGreen
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                  : isYellow
                  ? 'bg-amber-950 text-amber-300 border border-amber-700'
                  : 'bg-red-950 text-red-300 border border-red-800'
              }`}>
                {lane.signal}
              </span>

              <span className="text-[11px] text-slate-400 font-mono">
                Alloc: <strong className="text-slate-200">{lane.allocatedGreen}s</strong>
              </span>
            </div>

            {/* Metrics Row: Queue Length, Total PCU, Avg Wait */}
            <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-2 rounded border border-slate-800/80 text-center my-1">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Queue</div>
                <div className="text-xs font-mono font-bold text-slate-100">
                  {String(lane.queueLength).padStart(2, ' ')} veh
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Load</div>
                <div className="text-xs font-mono font-bold text-blue-400">
                  {lane.totalPCU.toFixed(1)} PCU
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Avg Wait</div>
                <div className="text-xs font-mono font-bold text-amber-400">
                  {lane.avgWaitSeconds.toFixed(1)} s
                </div>
              </div>
            </div>

            {/* Vehicle Breakdown Pills */}
            <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
              <span title="Cars">Car: <strong className="text-slate-200 font-mono">{lane.vehicleCounts.car || 0}</strong></span>
              <span title="Buses">Bus: <strong className="text-slate-200 font-mono">{lane.vehicleCounts.bus || 0}</strong></span>
              <span title="Auto Rickshaws">Auto: <strong className="text-slate-200 font-mono">{lane.vehicleCounts.auto || 0}</strong></span>
              <span title="Two Wheelers">Bike: <strong className="text-slate-200 font-mono">{lane.vehicleCounts.motorcycle || 0}</strong></span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
