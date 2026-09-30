import React, { useEffect, useRef, useState } from 'react';
import { 
  Play, 
  Pause, 
  FastForward, 
  Siren, 
  Crown, 
  Eye, 
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertOctagon,
  ArrowRight
} from 'lucide-react';
import { 
  Vehicle, 
  Pedestrian, 
  SignalPhase, 
  LightState, 
  VehicleType, 
  LaneStats,
  TrafficEvent
} from '../types/traffic';
import { DEFAULT_PCU_WEIGHTS, DEFAULT_YELLOW_SECONDS, DEFAULT_ALL_RED_SECONDS, PEDESTRIAN_WALK_SECONDS, PEDESTRIAN_CLEARANCE_SECONDS } from '../constants/pcu';

interface JunctionViewProps {
  laneStats: LaneStats[];
  onStatsUpdate: (stats: LaneStats[], activeRule: string) => void;
  onEventGenerated: (event: TrafficEvent) => void;
  pcuWeights: Record<VehicleType, number>;
  onEmergencyDetected: (lane: SignalPhase) => void;
  onEmergencyCleared: () => void;
}

// Indian plate prefixes for simulation
const INDIAN_STATES = ['AP', 'TS', 'KA', 'MH', 'DL', 'TN'];
const INDIAN_SERIES = ['CQ', 'EH', 'BD', 'FA', 'TK', 'AB', 'MH'];

function generateSamplePlate(): string {
  const state = INDIAN_STATES[Math.floor(Math.random() * INDIAN_STATES.length)];
  const rto = String(Math.floor(Math.random() * 36) + 1).padStart(2, '0');
  const series = INDIAN_SERIES[Math.floor(Math.random() * INDIAN_SERIES.length)];
  const num = String(Math.floor(Math.random() * 9000) + 1000);
  return `${state} ${rto} ${series} ${num}`;
}

export const JunctionView: React.FC<JunctionViewProps> = ({
  laneStats,
  onStatsUpdate,
  onEventGenerated,
  pcuWeights,
  onEmergencyDetected,
  onEmergencyCleared,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Simulation state
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1); // 1x, 2x, 4x
  const [trafficDensity, setTrafficDensity] = useState<number>(50); // 10 to 100
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  const [activeRule, setActiveRule] = useState<string>('Webster Adaptive Coordination (IRC-SP-41)');
  const [manualOverridePhase, setManualOverridePhase] = useState<SignalPhase | null>(null);

  // Phase controller refs (to avoid closure capture in requestAnimationFrame loop)
  const phaseOrder: SignalPhase[] = ['A', 'B', 'C', 'D'];
  const currentPhaseIndexRef = useRef<number>(0);
  const lightStateRef = useRef<LightState>('GREEN');
  const phaseTimerRef = useRef<number>(24); // remaining seconds in phase
  const isPedestrianWalkRef = useRef<boolean>(false);
  const emergencyTargetLaneRef = useRef<SignalPhase | null>(null);
  const vipTargetLaneRef = useRef<SignalPhase | null>(null);

  // Entities
  const vehiclesRef = useRef<Vehicle[]>([]);
  const pedestriansRef = useRef<Pedestrian[]>([]);
  const nextTrackIdRef = useRef<number>(101);
  const lastSpawnTimeRef = useRef<number>(0);
  const lastSecondTickRef = useRef<number>(0);

  // Measured lane stats accumulator
  const laneStatsRef = useRef<Record<SignalPhase, {
    queueLength: number;
    totalPCU: number;
    waitTimes: number[];
    counts: Record<VehicleType, number>;
  }>>({
    A: { queueLength: 0, totalPCU: 0, waitTimes: [], counts: { car: 0, bus: 0, van: 0, auto: 0, lorry: 0, motorcycle: 0, ambulance: 0, vip: 0 } },
    B: { queueLength: 0, totalPCU: 0, waitTimes: [], counts: { car: 0, bus: 0, van: 0, auto: 0, lorry: 0, motorcycle: 0, ambulance: 0, vip: 0 } },
    C: { queueLength: 0, totalPCU: 0, waitTimes: [], counts: { car: 0, bus: 0, van: 0, auto: 0, lorry: 0, motorcycle: 0, ambulance: 0, vip: 0 } },
    D: { queueLength: 0, totalPCU: 0, waitTimes: [], counts: { car: 0, bus: 0, van: 0, auto: 0, lorry: 0, motorcycle: 0, ambulance: 0, vip: 0 } },
  });

  // Spawn vehicle helper
  const spawnVehicle = (forcedType?: VehicleType, forcedLane?: SignalPhase) => {
    const lanes: SignalPhase[] = ['A', 'B', 'C', 'D'];
    const originLane = forcedLane || lanes[Math.floor(Math.random() * lanes.length)];
    
    // Pick vehicle type based on Indian urban traffic distribution
    let type: VehicleType = 'car';
    if (forcedType) {
      type = forcedType;
    } else {
      const r = Math.random();
      if (r < 0.35) type = 'motorcycle';
      else if (r < 0.60) type = 'car';
      else if (r < 0.75) type = 'auto';
      else if (r < 0.85) type = 'bus';
      else if (r < 0.95) type = 'van';
      else type = 'lorry';
    }

    const id = `TRK-${nextTrackIdRef.current++}`;
    const plate = generateSamplePlate();
    const pcu = pcuWeights[type] || 1.0;

    // Dimensions based on type
    let length = 32;
    let width = 16;
    let color = '#38bdf8'; // car blue

    if (type === 'bus') {
      length = 58; width = 20; color = '#f97316'; // orange transport bus
    } else if (type === 'lorry') {
      length = 62; width = 22; color = '#ca8a04'; // yellow/brown truck
    } else if (type === 'van') {
      length = 38; width = 18; color = '#94a3b8'; // grey van
    } else if (type === 'auto') {
      length = 22; width = 14; color = '#eab308'; // auto rickshaw yellow/green
    } else if (type === 'motorcycle') {
      length = 16; width = 8; color = '#a855f7'; // two-wheeler
    } else if (type === 'ambulance') {
      length = 42; width = 19; color = '#ef4444'; // white/red ambulance
    } else if (type === 'vip') {
      length = 36; width = 17; color = '#0f172a'; // black VIP sedan
    }

    // Pick a destination lane different from origin
    const possibleTargets = lanes.filter((l) => l !== originLane);
    const targetLane = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];

    // Initial position based on origin lane (canvas coordinates: center is 300, 300)
    // Lane A = North approach (coming from top y=0 to y=230)
    // Lane B = East approach (coming from right x=600 to x=370)
    // Lane C = South approach (coming from bottom y=600 to y=370)
    // Lane D = West approach (coming from left x=0 to x=230)
    let x = 0, y = 0;
    const offset = (Math.random() - 0.5) * 6; // slight lane jitter

    if (originLane === 'A') {
      x = 278 + offset;
      y = -length - 10;
    } else if (originLane === 'B') {
      x = 600 + length + 10;
      y = 278 + offset;
    } else if (originLane === 'C') {
      x = 322 + offset;
      y = 600 + length + 10;
    } else if (originLane === 'D') {
      x = -length - 10;
      y = 322 + offset;
    }

    const newVehicle: Vehicle = {
      id,
      type,
      lane: originLane,
      targetLane,
      turnDirection: 'straight',
      x,
      y,
      speed: 2.2 + Math.random() * 0.8,
      targetSpeed: 2.5,
      length,
      width,
      color,
      plate,
      isEmergency: type === 'ambulance',
      isVip: type === 'vip',
      isBlacklisted: type === 'car' && Math.random() < 0.05, // 5% sample blacklist for alert demo
      waitTime: 0,
      passedStopLine: false,
      progress: 0,
      pcu,
    };

    vehiclesRef.current.push(newVehicle);

    // Track emergency in lane
    if (type === 'ambulance') {
      emergencyTargetLaneRef.current = originLane;
      onEmergencyDetected(originLane);
      setActiveRule(`EMERGENCY VEHICLE IN LANE ${originLane} - PREEMPTION CLEARANCE`);
    } else if (type === 'vip') {
      vipTargetLaneRef.current = originLane;
      setActiveRule(`VIP CONVOY IN LANE ${originLane} - PRIORITY DISPATCH`);
    }

    // Emit initial detection event
    onEventGenerated({
      event_id: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      camera_id: `CAM-JUNCTION-${originLane}`,
      timestamp: new Date().toISOString(),
      lane: originLane,
      track_id: id,
      vehicle_type: type,
      plate,
      ocr_confidence: type === 'motorcycle' ? 0.88 : 0.96,
      speed: Math.round(newVehicle.speed * 15),
      direction: originLane === 'A' ? 'Southbound' : originLane === 'B' ? 'Westbound' : originLane === 'C' ? 'Northbound' : 'Eastbound',
      bbox: [Math.round(x), Math.round(y), width, length],
    });
  };

  // Spawn pedestrian on zebra crossing
  const spawnPedestrian = (crossing: SignalPhase) => {
    const id = `PED-${Date.now()}-${Math.floor(Math.random() * 100)}`;
    let startX = 0, startY = 0, targetX = 0, targetY = 0;

    // Crossing A is North zebra (y=210, x from 220 to 380)
    // Crossing B is East zebra (x=390, y from 220 to 380)
    // Crossing C is South zebra (y=390, x from 220 to 380)
    // Crossing D is West zebra (x=210, y from 220 to 380)
    if (crossing === 'A') {
      startX = 215; startY = 210;
      targetX = 385; targetY = 210;
    } else if (crossing === 'B') {
      startX = 390; startY = 215;
      targetX = 390; targetY = 385;
    } else if (crossing === 'C') {
      startX = 385; startY = 390;
      targetX = 215; targetY = 390;
    } else {
      startX = 210; startY = 385;
      targetX = 210; targetY = 215;
    }

    pedestriansRef.current.push({
      id,
      crossing,
      x: startX,
      y: startY,
      targetX,
      targetY,
      progress: 0,
      speed: 0.6 + Math.random() * 0.3,
      state: 'waiting',
    });
  };

  // Main 60 fps simulation loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTimestamp = performance.now();

    const render = (now: number) => {
      const dt = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      const canvas = canvasRef.current;
      if (!canvas) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const effectiveSpeed = isRunning ? simSpeed : 0;

      // 1. TIMING & PHASE STATE MACHINE
      if (isRunning) {
        const timePassed = dt * effectiveSpeed;
        phaseTimerRef.current -= timePassed;

        // Check if current phase expired
        if (phaseTimerRef.current <= 0) {
          const currentPhase = phaseOrder[currentPhaseIndexRef.current];

          if (lightStateRef.current === 'GREEN') {
            // GREEN -> YELLOW (3 seconds)
            lightStateRef.current = 'YELLOW';
            phaseTimerRef.current = DEFAULT_YELLOW_SECONDS;
            setActiveRule(`Phase ${currentPhase} Change: 3s Yellow Clearance`);
          } else if (lightStateRef.current === 'YELLOW') {
            // YELLOW -> ALL-RED (2 seconds safe junction clearance)
            lightStateRef.current = 'ALL_RED';
            phaseTimerRef.current = DEFAULT_ALL_RED_SECONDS;
            setActiveRule('All-Red Junction Clearance: Zero Conflict Clearance');
          } else if (lightStateRef.current === 'ALL_RED') {
            // Check if emergency is waiting
            if (emergencyTargetLaneRef.current) {
              const emgLane = emergencyTargetLaneRef.current;
              currentPhaseIndexRef.current = phaseOrder.indexOf(emgLane);
              lightStateRef.current = 'GREEN';
              phaseTimerRef.current = 15; // hold green for ambulance
              setActiveRule(`Emergency Priority: Lane ${emgLane} Green Active`);
            } else {
              // ALL-RED -> Check Pedestrian Phase or Next Phase
              // Advance to next phase
              let nextIndex = (currentPhaseIndexRef.current + 1) % 4;
              currentPhaseIndexRef.current = nextIndex;
              const nextPhase = phaseOrder[nextIndex];
              
              // Find allocated green for this lane from stats (Webster plan)
              const laneConfig = laneStats.find((l) => l.id === nextPhase);
              const allocatedGreen = laneConfig ? laneConfig.allocatedGreen : 22;

              lightStateRef.current = 'GREEN';
              phaseTimerRef.current = allocatedGreen;
              setActiveRule(`Phase ${nextPhase} Green Active (${allocatedGreen}s Webster Plan)`);

              // Periodically trigger a safe pedestrian walk on non-conflicting crossings
              if (Math.random() < 0.4) {
                spawnPedestrian(nextPhase);
              }
            }
          }
        }

        // Spawning logic based on traffic density
        if (now - lastSpawnTimeRef.current > (3200 / (trafficDensity / 25)) / effectiveSpeed) {
          spawnVehicle();
          lastSpawnTimeRef.current = now;
        }

        // 1-second interval stats update
        if (now - lastSecondTickRef.current > 1000) {
          lastSecondTickRef.current = now;

          // Compute queue lengths and wait times
          const updatedStats = laneStats.map((lane) => {
            const laneVehicles = vehiclesRef.current.filter((v) => v.lane === lane.id);
            const queuedVehicles = laneVehicles.filter((v) => !v.passedStopLine && v.speed < 0.5);
            const totalPCU = queuedVehicles.reduce((sum, v) => sum + (pcuWeights[v.type] || 1), 0);
            const avgWait = queuedVehicles.length > 0 
              ? queuedVehicles.reduce((s, v) => s + v.waitTime, 0) / queuedVehicles.length 
              : 0;

            const counts: Record<VehicleType, number> = {
              car: 0, bus: 0, van: 0, auto: 0, lorry: 0, motorcycle: 0, ambulance: 0, vip: 0
            };
            laneVehicles.forEach((v) => { counts[v.type] = (counts[v.type] || 0) + 1; });

            const isCurrentGreen = phaseOrder[currentPhaseIndexRef.current] === lane.id && lightStateRef.current === 'GREEN';
            const isCurrentYellow = phaseOrder[currentPhaseIndexRef.current] === lane.id && lightStateRef.current === 'YELLOW';
            const signalState: LightState = isCurrentGreen ? 'GREEN' : isCurrentYellow ? 'YELLOW' : 'RED';

            return {
              ...lane,
              signal: signalState,
              countdown: Math.max(0, Math.ceil(phaseTimerRef.current)),
              queueLength: queuedVehicles.length,
              totalPCU: Number(totalPCU.toFixed(1)),
              avgWaitSeconds: Number(avgWait.toFixed(1)),
              vehicleCounts: counts,
            };
          });

          onStatsUpdate(updatedStats, activeRule);
        }
      }

      // 2. VEHICLE PHYSICS & MOVEMENT
      const activePhase = phaseOrder[currentPhaseIndexRef.current];
      const currentLight = lightStateRef.current;

      vehiclesRef.current.forEach((veh, index) => {
        if (!isRunning) return;

        // Stop line coordinates
        // Lane A (North, moving down): stop line at y = 200
        // Lane B (East, moving left): stop line at x = 400
        // Lane C (South, moving up): stop line at y = 400
        // Lane D (West, moving right): stop line at x = 200
        let distToStopLine = 999;
        if (veh.lane === 'A') distToStopLine = 200 - (veh.y + veh.length);
        else if (veh.lane === 'B') distToStopLine = veh.x - 400;
        else if (veh.lane === 'C') distToStopLine = veh.y - 400;
        else if (veh.lane === 'D') distToStopLine = 200 - (veh.x + veh.length);

        if (distToStopLine < -10) {
          veh.passedStopLine = true;
        }

        // Distance to vehicle ahead in same lane
        let distToAhead = 999;
        for (let j = 0; j < vehiclesRef.current.length; j++) {
          if (j === index) continue;
          const other = vehiclesRef.current[j];
          if (other.lane === veh.lane && !other.passedStopLine) {
            let gap = 999;
            if (veh.lane === 'A' && other.y > veh.y) gap = other.y - (veh.y + veh.length);
            else if (veh.lane === 'B' && other.x < veh.x) gap = veh.x - (other.x + other.length);
            else if (veh.lane === 'C' && other.y < veh.y) gap = veh.y - (other.y + other.length);
            else if (veh.lane === 'D' && other.x > veh.x) gap = other.x - (veh.x + veh.length);

            if (gap > 0 && gap < distToAhead) distToAhead = gap;
          }
        }

        // Check if pedestrians are occupying the zebra crossing
        let zebraOccupied = false;
        const crossingPedestrians = pedestriansRef.current.filter(
          (p) => p.crossing === veh.lane && p.state === 'crossing'
        );
        if (crossingPedestrians.length > 0 && distToStopLine > 0 && distToStopLine < 50) {
          zebraOccupied = true;
        }

        // Signal rule: Stop if Red/Yellow and hasn't passed stop line, or if vehicle ahead is too close, or zebra is occupied
        const isRedForMe = veh.lane !== activePhase || currentLight !== 'GREEN';
        const mustStopForSignal = !veh.passedStopLine && isRedForMe && distToStopLine > -5 && distToStopLine < 120;
        const mustStopForVehicleAhead = distToAhead < 20;

        if (mustStopForSignal || mustStopForVehicleAhead || zebraOccupied) {
          veh.speed = Math.max(0, veh.speed - 0.15 * effectiveSpeed);
          veh.waitTime += (dt * effectiveSpeed);
        } else {
          veh.speed = Math.min(veh.targetSpeed, veh.speed + 0.1 * effectiveSpeed);
        }

        // Advance position
        const moveStep = veh.speed * effectiveSpeed;
        if (veh.lane === 'A') veh.y += moveStep;
        else if (veh.lane === 'B') veh.x -= moveStep;
        else if (veh.lane === 'C') veh.y -= moveStep;
        else if (veh.lane === 'D') veh.x += moveStep;

        // Check ambulance exit
        if (veh.isEmergency && veh.passedStopLine && (veh.y > 450 || veh.x < 150 || veh.y < 150 || veh.x > 450)) {
          emergencyTargetLaneRef.current = null;
          onEmergencyCleared();
        }
      });

      // Remove vehicles that left the junction view
      vehiclesRef.current = vehiclesRef.current.filter((v) => {
        return v.x >= -100 && v.x <= 700 && v.y >= -100 && v.y <= 700;
      });

      // 3. PEDESTRIAN MOVEMENT
      pedestriansRef.current.forEach((ped) => {
        if (!isRunning) return;
        // Pedestrians only cross when their zebra crossing's corresponding lane is RED
        const isLaneRed = activePhase !== ped.crossing || currentLight !== 'GREEN';
        if (isLaneRed && ped.state === 'waiting') {
          ped.state = 'crossing';
        }

        if (ped.state === 'crossing') {
          const dx = ped.targetX - ped.x;
          const dy = ped.targetY - ped.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 3) {
            ped.x += (dx / dist) * ped.speed * effectiveSpeed;
            ped.y += (dy / dist) * ped.speed * effectiveSpeed;
          } else {
            ped.state = 'cleared';
          }
        }
      });

      pedestriansRef.current = pedestriansRef.current.filter((p) => p.state !== 'cleared');

      // 4. DRAW JUNCTION CANVAS
      ctx.clearRect(0, 0, 600, 600);

      // Background grass/pavement
      ctx.fillStyle = '#0f172a'; // slate-900 background
      ctx.fillRect(0, 0, 600, 600);

      // Curbs & Sidewalks (Slate-800)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 200, 200); // Top Left
      ctx.fillRect(400, 0, 200, 200); // Top Right
      ctx.fillRect(0, 400, 200, 200); // Bottom Left
      ctx.fillRect(400, 400, 200, 200); // Bottom Right

      // Road Asphalt (Dark realistic asphalt #1a202c)
      ctx.fillStyle = '#131b26';
      ctx.fillRect(200, 0, 200, 600); // North-South Road
      ctx.fillRect(0, 200, 600, 200); // East-West Road

      // Road boundary borders
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(200, 0, 200, 600);
      ctx.strokeRect(0, 200, 600, 200);

      // Yellow Center Dividers (Double Yellow Lines)
      ctx.strokeStyle = '#eab308'; // Amber-yellow
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      
      // North approach divider
      ctx.beginPath();
      ctx.moveTo(298, 0); ctx.lineTo(298, 190);
      ctx.moveTo(302, 0); ctx.lineTo(302, 190);
      ctx.stroke();

      // South approach divider
      ctx.beginPath();
      ctx.moveTo(298, 410); ctx.lineTo(298, 600);
      ctx.moveTo(302, 410); ctx.lineTo(302, 600);
      ctx.stroke();

      // West approach divider
      ctx.beginPath();
      ctx.moveTo(0, 298); ctx.lineTo(190, 298);
      ctx.moveTo(0, 302); ctx.lineTo(190, 302);
      ctx.stroke();

      // East approach divider
      ctx.beginPath();
      ctx.moveTo(410, 298); ctx.lineTo(600, 298);
      ctx.moveTo(410, 302); ctx.lineTo(600, 302);
      ctx.stroke();

      // White Stop Lines
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.setLineDash([]);

      // Lane A (North) Stop Line
      ctx.beginPath();
      ctx.moveTo(200, 200); ctx.lineTo(300, 200);
      ctx.stroke();

      // Lane B (East) Stop Line
      ctx.beginPath();
      ctx.moveTo(400, 200); ctx.lineTo(400, 300);
      ctx.stroke();

      // Lane C (South) Stop Line
      ctx.beginPath();
      ctx.moveTo(300, 400); ctx.lineTo(400, 400);
      ctx.stroke();

      // Lane D (West) Stop Line
      ctx.beginPath();
      ctx.moveTo(200, 300); ctx.lineTo(200, 400);
      ctx.stroke();

      // Zebra Crossings (Realistic white stripes)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      // North Zebra (between y=205 and 225)
      for (let x = 205; x < 395; x += 18) {
        ctx.fillRect(x, 205, 10, 16);
      }
      // South Zebra (between y=375 and 395)
      for (let x = 205; x < 395; x += 18) {
        ctx.fillRect(x, 379, 10, 16);
      }
      // West Zebra (between x=205 and 225)
      for (let y = 205; y < 395; y += 18) {
        ctx.fillRect(205, y, 16, 10);
      }
      // East Zebra (between x=375 and 395)
      for (let y = 205; y < 395; y += 18) {
        ctx.fillRect(379, y, 16, 10);
      }

      // Lane Label Badges on Canvas
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = '#64748b';
      ctx.fillText('LANE A (NORTH)', 205, 25);
      ctx.fillText('LANE B (EAST)', 505, 285);
      ctx.fillText('LANE C (SOUTH)', 305, 585);
      ctx.fillText('LANE D (WEST)', 15, 315);

      // Signal Light Heads on Corner Curbs
      const drawTrafficLight = (x: number, y: number, phase: SignalPhase) => {
        const isCurrentPhase = activePhase === phase;
        let colorRed = '#450a0a';
        let colorYellow = '#422006';
        let colorGreen = '#052e16';

        if (isCurrentPhase) {
          if (currentLight === 'GREEN') colorGreen = '#22c55e';
          else if (currentLight === 'YELLOW') colorYellow = '#eab308';
          else colorRed = '#ef4444';
        } else {
          colorRed = '#ef4444';
        }

        // Housing
        ctx.fillStyle = '#020617';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.fillRect(x - 8, y - 22, 16, 44);
        ctx.strokeRect(x - 8, y - 22, 16, 44);

        // Bulbs
        ctx.fillStyle = colorRed;
        ctx.beginPath(); ctx.arc(x, y - 13, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = colorYellow;
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = colorGreen;
        ctx.beginPath(); ctx.arc(x, y + 13, 5, 0, Math.PI * 2); ctx.fill();
      };

      // Draw light heads at appropriate corners facing drivers
      drawTrafficLight(190, 185, 'A'); // For Lane A
      drawTrafficLight(415, 190, 'B'); // For Lane B
      drawTrafficLight(415, 415, 'C'); // For Lane C
      drawTrafficLight(185, 415, 'D'); // For Lane D

      // DRAW PEDESTRIANS
      pedestriansRef.current.forEach((ped) => {
        ctx.fillStyle = ped.state === 'crossing' ? '#38bdf8' : '#64748b';
        ctx.beginPath();
        ctx.arc(ped.x, ped.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // DRAW VEHICLES
      vehiclesRef.current.forEach((veh) => {
        ctx.save();
        ctx.translate(veh.x + (veh.lane === 'A' || veh.lane === 'C' ? veh.width / 2 : veh.length / 2), 
                      veh.y + (veh.lane === 'A' || veh.lane === 'C' ? veh.length / 2 : veh.width / 2));

        // Heading angle based on lane
        let angle = 0;
        if (veh.lane === 'A') angle = Math.PI / 2; // facing down
        else if (veh.lane === 'B') angle = Math.PI; // facing left
        else if (veh.lane === 'C') angle = -Math.PI / 2; // facing up
        else if (veh.lane === 'D') angle = 0; // facing right

        ctx.rotate(angle);

        // Vehicle Body (Rectangular)
        ctx.fillStyle = veh.color;
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        const w = veh.length;
        const h = veh.width;
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.strokeRect(-w / 2, -h / 2, w, h);

        // Windshield
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(w * 0.1, -h * 0.4, w * 0.25, h * 0.8);

        // Headlights
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(w * 0.45, -h * 0.45, 3, 4);
        ctx.fillRect(w * 0.45, h * 0.45 - 4, 3, 4);

        // Emergency Flashing Beacon for Ambulance
        if (veh.isEmergency) {
          const flash = Math.floor(now / 150) % 2 === 0;
          ctx.fillStyle = flash ? '#ef4444' : '#38bdf8';
          ctx.beginPath();
          ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // VIP Convoy Emblem
        if (veh.isVip) {
          ctx.fillStyle = '#facc15';
          ctx.fillRect(-3, -3, 6, 6);
        }

        ctx.restore();

        // Bounding Box & ANPR Label Overlay (YOLOv8 style)
        if (showBoundingBoxes) {
          ctx.strokeStyle = veh.isEmergency ? '#ef4444' : veh.isVip ? '#facc15' : '#38bdf8';
          ctx.lineWidth = 1;
          const boxX = veh.x - 2;
          const boxY = veh.y - 2;
          const boxW = (veh.lane === 'A' || veh.lane === 'C' ? veh.width : veh.length) + 4;
          const boxH = (veh.lane === 'A' || veh.lane === 'C' ? veh.length : veh.width) + 4;
          
          ctx.strokeRect(boxX, boxY, boxW, boxH);

          // Top label tag
          ctx.fillStyle = veh.isEmergency ? '#ef4444' : '#0284c7';
          ctx.fillRect(boxX, boxY - 14, Math.max(70, ctx.measureText(veh.plate).width + 8), 13);

          ctx.font = 'bold 9px monospace';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(`${veh.type.toUpperCase()} | ${veh.plate}`, boxX + 3, boxY - 4);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isRunning, simSpeed, trafficDensity, showBoundingBoxes, pcuWeights, laneStats, onStatsUpdate, onEventGenerated]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-md p-3 flex flex-col space-y-3">
      {/* Junction View Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2 text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-200">Live 4-Way Junction:</span>
          <span className="text-slate-400">Benz Circle Central Model</span>
          <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded font-mono text-[11px]">
            60 FPS CANVAS
          </span>
        </div>

        {/* Play/Pause & Speed Buttons */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`p-1.5 rounded-sm border font-medium flex items-center gap-1 transition ${
              isRunning 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
            }`}
            title={isRunning ? 'Pause Simulation' : 'Resume Simulation'}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isRunning ? 'Pause' : 'Play'}</span>
          </button>

          <div className="flex bg-slate-950 p-0.5 rounded border border-slate-800 text-[11px]">
            {[1, 2, 4].map((speed) => (
              <button
                key={speed}
                onClick={() => setSimSpeed(speed)}
                className={`px-2 py-0.5 rounded-xs transition ${
                  simSpeed === speed ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
            className={`px-2 py-1 rounded-sm border text-[11px] flex items-center gap-1 transition ${
              showBoundingBoxes
                ? 'bg-blue-900/40 text-blue-300 border-blue-700'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="Toggle YOLO Bounding Boxes & ANPR tags"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Bounding Boxes</span>
          </button>
        </div>
      </div>

      {/* Canvas Display */}
      <div className="relative flex justify-center bg-slate-950 rounded border border-slate-800 p-2 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={600}
          height={600}
          className="w-full max-w-[540px] aspect-square object-contain rounded-xs shadow-inner"
        />

        {/* Corner Indicator Badges */}
        <div className="absolute top-4 left-4 bg-slate-900/90 border border-slate-800 px-2 py-1 rounded text-[11px] text-slate-300">
          Lane A: <span className="font-mono text-emerald-400">North</span>
        </div>
        <div className="absolute top-4 right-4 bg-slate-900/90 border border-slate-800 px-2 py-1 rounded text-[11px] text-slate-300">
          Lane B: <span className="font-mono text-emerald-400">East</span>
        </div>
        <div className="absolute bottom-10 left-4 bg-slate-900/90 border border-slate-800 px-2 py-1 rounded text-[11px] text-slate-300">
          Lane D: <span className="font-mono text-emerald-400">West</span>
        </div>
        <div className="absolute bottom-10 right-4 bg-slate-900/90 border border-slate-800 px-2 py-1 rounded text-[11px] text-slate-300">
          Lane C: <span className="font-mono text-emerald-400">South</span>
        </div>

        {/* Bottom Rule Status Line */}
        <div className="absolute bottom-2 left-4 right-4 bg-slate-900/95 border border-slate-700/80 px-3 py-1.5 rounded flex items-center justify-between text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
            <span className="font-semibold text-slate-400">Active Rule:</span>
            <span className="text-blue-300 font-mono truncate">{activeRule}</span>
          </div>
          <span className="text-slate-400 hidden sm:inline text-[10px]">
            IRC SP-41 / Webster Timing Active
          </span>
        </div>
      </div>

      {/* Simulator Quick Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        <button
          onClick={() => spawnVehicle('ambulance', 'A')}
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800 rounded-sm text-xs font-semibold transition"
        >
          <Siren className="w-3.5 h-3.5 text-red-400" />
          <span>Spawn Ambulance (Lane A)</span>
        </button>

        <button
          onClick={() => spawnVehicle('vip', 'B')}
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-800 rounded-sm text-xs font-semibold transition"
        >
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          <span>Spawn VIP Escort (Lane B)</span>
        </button>

        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-sm">
          <span className="text-xs text-slate-400 whitespace-nowrap">Density:</span>
          <input
            type="range"
            min={20}
            max={90}
            value={trafficDensity}
            onChange={(e) => setTrafficDensity(Number(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            title="Adjust traffic inflow rate"
          />
          <span className="text-xs font-mono text-slate-300">{trafficDensity}%</span>
        </div>

        <button
          onClick={() => spawnPedestrian('A')}
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-sm text-xs font-medium transition"
        >
          <span>Request Zebra Walk</span>
        </button>
      </div>
    </div>
  );
};
