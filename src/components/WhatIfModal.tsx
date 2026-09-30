import React from 'react';
import { X, Scale, CheckCircle2, TrendingDown, ArrowRight, Play, RotateCcw } from 'lucide-react';
import { WhatIfResult } from '../types/traffic';

interface WhatIfModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: WhatIfResult[];
  onRunComparison: () => void;
  isRunningComparison: boolean;
}

export const WhatIfModal: React.FC<WhatIfModalProps> = ({
  isOpen,
  onClose,
  results,
  onRunComparison,
  isRunningComparison,
}) => {
  if (!isOpen) return null;

  const fixed = results.find((r) => r.planType === 'Fixed (Static)');
  const adaptive = results.find((r) => r.planType === 'Webster Adaptive');

  // Compute delta strictly from measured values (no invented percentages!)
  const measuredWaitDelta = fixed && adaptive 
    ? (fixed.avgWaitSeconds - adaptive.avgWaitSeconds).toFixed(1)
    : null;

  const measuredQueueDelta = fixed && adaptive
    ? fixed.maxQueueVehicles - adaptive.maxQueueVehicles
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-md max-w-2xl w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-1">
          <Scale className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            Webster Adaptive vs. Static Fixed Timing (What-If Simulation)
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Runs dual simulation runs with identical random vehicle arrival seeds to measure empirical delays.
        </p>

        {/* Benchmark Run Button */}
        <div className="mb-4 flex items-center justify-between bg-slate-950 p-3 rounded border border-slate-800">
          <div>
            <div className="text-xs font-semibold text-slate-200">
              Deterministic Seed Test: #TRAFFIC-SEED-409
            </div>
            <div className="text-[11px] text-slate-400">
              Evaluates 300 simulation cycles under high-demand peak hour flow.
            </div>
          </div>

          <button
            onClick={onRunComparison}
            disabled={isRunningComparison}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-sm flex items-center gap-1.5 transition"
          >
            {isRunningComparison ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>Simulating...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Run New Comparison</span>
              </>
            )}
          </button>
        </div>

        {/* Results Comparison Table */}
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400">
                <th className="text-left py-2 px-3">Plan Architecture</th>
                <th className="text-center py-2 px-3">Cycle Length</th>
                <th className="text-right py-2 px-3">Measured Avg Wait</th>
                <th className="text-right py-2 px-3">Max Observed Queue</th>
                <th className="text-right py-2 px-3">Throughput Capacity</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => {
                const isAdaptive = r.planType === 'Webster Adaptive';
                return (
                  <tr
                    key={r.planType}
                    className={`border-b border-slate-800/60 ${
                      isAdaptive ? 'bg-blue-950/20 font-medium' : 'bg-slate-900/50'
                    }`}
                  >
                    <td className="py-2.5 px-3 flex items-center gap-1.5 text-slate-200">
                      {isAdaptive && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      <span>{r.planType}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                      {r.cycleSeconds} s
                    </td>
                    <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                      isAdaptive ? 'text-emerald-400' : 'text-slate-200'
                    }`}>
                      {r.avgWaitSeconds.toFixed(1)} s
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                      {r.maxQueueVehicles} veh
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                      {r.throughputPerHour} PCU/hr
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Measured Real Gains Summary */}
        {measuredWaitDelta && (
          <div className="bg-emerald-950/60 border border-emerald-800 rounded p-3 text-xs text-emerald-200 flex items-start gap-2.5">
            <TrendingDown className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="uppercase">EMPIRICAL RUN OUTCOME:</strong>
              <p className="text-[11px] text-emerald-300 mt-0.5">
                Webster Adaptive control reduced measured average driver waiting time by <strong>{measuredWaitDelta} seconds per vehicle</strong> and reduced maximum junction queue backlog by <strong>{measuredQueueDelta} vehicles</strong> compared to static fixed timing.
              </p>
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-sm transition"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
