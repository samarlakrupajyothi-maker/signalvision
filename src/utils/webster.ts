import { SignalPhase } from '../types/traffic';
import { MIN_GREEN_SECONDS, MAX_GREEN_SECONDS, DEFAULT_SATURATION_FLOW } from '../constants/pcu';

export interface WebsterResult {
  optimumCycleLength: number;
  totalLostTime: number;
  sumCriticalFlowRatio: number;
  phaseGreens: Record<SignalPhase, number>;
  phaseFlowRatios: Record<SignalPhase, number>;
  theoreticalCapacityPCUPerHour: number;
}

/**
 * Calculates Webster's optimum cycle length and phase green allocations
 * C0 = (1.5 * L + 5) / (1 - Y)
 * where:
 *   L = total lost time per cycle (seconds)
 *   Y = sum of critical flow ratios (y_i = q_i / s_i)
 *   q_i = arrival flow rate (PCU/hr)
 *   s_i = saturation flow rate (PCU/hr)
 */
export function calculateWebsterPlan(
  laneFlowRatesPCUPerHour: Record<SignalPhase, number>,
  saturationFlow: number = DEFAULT_SATURATION_FLOW,
  lostTimePerPhase: number = 3.5, // yellow + all-red startup clearance lost time
  phases: SignalPhase[] = ['A', 'B', 'C', 'D']
): WebsterResult {
  const numPhases = phases.length;
  const totalLostTime = numPhases * lostTimePerPhase;

  // Calculate flow ratios y_i = q_i / s_i
  const phaseFlowRatios: Record<SignalPhase, number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
  };

  let sumY = 0;
  for (const p of phases) {
    const q = Math.max(10, laneFlowRatesPCUPerHour[p] || 10); // minimum baseline demand
    const y = q / saturationFlow;
    phaseFlowRatios[p] = y;
    sumY += y;
  }

  // Cap Y at 0.85 to prevent oversaturated infinity or negative cycle times
  const safeY = Math.min(0.85, Math.max(0.15, sumY));

  // Webster formula
  const rawCycleLength = (1.5 * totalLostTime + 5) / (1 - safeY);

  // Reasonable practical bounds: minimum 45s, maximum 150s for 4-phase junction
  const optimumCycleLength = Math.round(Math.min(150, Math.max(45, rawCycleLength)));

  // Available total green time
  const totalGreenTime = Math.max(20, optimumCycleLength - totalLostTime);

  // Proportional distribution
  const phaseGreens: Record<SignalPhase, number> = {
    A: MIN_GREEN_SECONDS,
    B: MIN_GREEN_SECONDS,
    C: MIN_GREEN_SECONDS,
    D: MIN_GREEN_SECONDS,
  };

  for (const p of phases) {
    const proportion = phaseFlowRatios[p] / sumY;
    const computedGreen = Math.round(totalGreenTime * proportion);
    // Clamp to [10, 60] seconds as requested
    phaseGreens[p] = Math.min(MAX_GREEN_SECONDS, Math.max(MIN_GREEN_SECONDS, computedGreen));
  }

  return {
    optimumCycleLength,
    totalLostTime: Math.round(totalLostTime),
    sumCriticalFlowRatio: Number(safeY.toFixed(3)),
    phaseGreens,
    phaseFlowRatios,
    theoreticalCapacityPCUPerHour: Math.round(saturationFlow * (1 - safeY)),
  };
}
