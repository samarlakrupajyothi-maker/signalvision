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
  ArrowRight,
  Flame,
  Ban,
  Navigation2,
  Gauge,
  ShieldAlert
} from 'lucide-react';
import { 
  Vehicle, 
  Pedestrian, 
  SignalPhase, 
  LightState, 
  VehicleType, 
  LaneStats,
  TrafficEvent,
  TrafficAlert
} from '../types/traffic';
import { DEFAULT_PCU_WEIGHTS, DEFAULT_YELLOW_SECONDS, DEFAULT_ALL_RED_SECONDS } from '../constants/pcu';

interface JunctionViewProps {
  laneStats: LaneStats[];
  onStatsUpdate: (stats: LaneStats[], activeRule: string) => void;
  onEventGenerated: (event: TrafficEvent) => void;
  onAlertGenerated: (alert: Omit<TrafficAlert, 'id' | 'timestamp' | 'acknowledged'>) => void;
  pcuWeights: Record<VehicleType, number>;
  onEmergencyDetected: (lane: SignalPhase, type: 'ambulance' | 'fire_engine' | 'vip' | 'blocked') => void;
  onEmergencyCleared: () => void;
}

// Indian state registration codes
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
  onAlertGenerated,
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
  const [activeRule, setActiveRule] = useState<string>('Indian LHT Rules & Webster Adaptive (IRC-SP-41)');

  // Phase controller refs
  const phaseOrder: SignalPhase[] = ['A', 'B', 'C', 'D'];
  const currentPhaseIndexRef = useRef<number>(0);
  const lightStateRef = useRef<LightState>('GREEN');
  const phaseTimerRef = useRef<number>(24);
  const emergencyTargetLaneRef = useRef<SignalPhase | null>(null);
  const emergencyTypeRef = useRef<'ambulance' | 'fire_engine' | 'vip' | null>(null);

  // Entities
  const vehiclesRef = useRef<Vehicle[]>([]);
  const pedestriansRef = useRef<Pedestrian[]>([]);
  const nextTrackIdRef = useRef<number>(101);
  const lastSpawnTimeRef = useRef<number>(0);
  const lastSecondTickRef = useRef<number>(0);

  /**
   * Spawns a vehicle adhering strictly to Indian Left-Hand Traffic (LHT):
   * Lane A (North): heading South (+y), driver's LEFT is x = 325 (East half)
   * Lane B (East): heading West (-x), driver's LEFT is y = 325 (South half)
   * Lane C (South): heading North (-y), driver's LEFT is x = 275 (West half)
   * Lane D (West): heading East (+x), driver's LEFT is y = 275 (North half)
   */
  const spawnVehicle = (
    forcedType?: VehicleType, 
    forcedLane?: SignalPhase, 
    violationType?: 'signal_jump' | 'wrong_route' | 'overspeeding'
  ) => {
    const lanes: SignalPhase[] = ['A', 'B', 'C', 'D'];
    const originLane = forcedLane || lanes[Math.floor(Math.random() * lanes.length)];
    
    // Pick vehicle type
    let type: VehicleType = 'car';
    if (forcedType) {
      type = forcedType;
    } else {
      const r = Math.random();
      if (r < 0.35) type = 'motorcycle';
      else if (r < 0.58) type = 'car';
      else if (r < 0.72) type = 'auto';
      else if (r < 0.83) type = 'bus';
      else if (r < 0.94) type = 'van';
      else type = 'lorry';
    }

    const id = `TRK-${nextTrackIdRef.current++}`;
    const plate = generateSamplePlate();
    const pcu = pcuWeights[type] || 1.0;

    // Dimensions & colors
    let length = 32;
    let width = 16;
    let color = '#38bdf8'; // car blue

    if (type === 'bus') {
      length = 58; width = 20; color = '#f97316'; // orange public transport bus
    } else if (type === 'lorry') {
      length = 62; width = 22; color = '#ca8a04'; // yellow/brown goods carrier
    } else if (type === 'van') {
      length = 38; width = 18; color = '#94a3b8'; // grey delivery van
    } else if (type === 'auto') {
      length = 22; width = 14; color = '#eab308'; // auto rickshaw yellow/green
    } else if (type === 'motorcycle') {
      length = 16; width = 8; color = '#a855f7'; // two-wheeler
    } else if (type === 'ambulance') {
      length = 42; width = 19; color = '#ffffff'; // white ambulance with red stripe
    } else if (type === 'fire_engine') {
      length = 60; width = 22; color = '#dc2626'; // bright emergency fire red
    } else if (type === 'vip') {
      length = 36; width = 17; color = '#020617'; // executive black VIP sedan
    }

    // INDIAN LEFT-HAND TRAFFIC (LHT) LANE COORDINATES
    let x = 0, y = 0;
    const offset = (Math.random() - 0.5) * 6; // slight lane jitter

    // If simulating wrong_route, deliberately place vehicle on opposite right side!
    const isWrongRoute = violationType === 'wrong_route';

    if (originLane === 'A') {
      // Heading South: Left is East (x = 325)
      x = (isWrongRoute ? 265 : 325) + offset;
      y = -length - 10;
    } else if (originLane === 'B') {
      // Heading West: Left is South (y = 325)
      x = 600 + length + 10;
      y = (isWrongRoute ? 265 : 325) + offset;
    } else if (originLane === 'C') {
      // Heading North: Left is West (x = 265)
      x = (isWrongRoute ? 325 : 265) + offset;
      y = 600 + length + 10;
    } else if (originLane === 'D') {
      // Heading East: Left is North (y = 265)
      x = -length - 10;
      y = (isWrongRoute ? 325 : 265) + offset;
    }

    const isOverspeeding = violationType === 'overspeeding';
    const isSignalJump = violationType === 'signal_jump';

    // Speed in pixels/frame
    const baseSpeed = isOverspeeding ? 4.8 : 2.2 + Math.random() * 0.6;

    const newVehicle: Vehicle = {
      id,
      type,
      lane: originLane,
      targetLane: 'A',
      turnDirection: 'straight',
      x,
      y,
      speed: baseSpeed,
      targetSpeed: isOverspeeding ? 5.2 : 2.5,
      length,
      width,
      color,
      plate,
      isEmergency: type === 'ambulance' || type === 'fire_engine',
      isFireEngine: type === 'fire_engine',
      isVip: type === 'vip',
      isGovtVehicle: type === 'vip',
      isBlacklisted: type === 'car' && Math.random() < 0.04,
      isSignalJump,
      isWrongRoute,
      isOverspeeding,
      violationLogged: false,
      waitTime: 0,
      passedStopLine: false,
      progress: 0,
      pcu,
    };

    vehiclesRef.current.push(newVehicle);

    // Track emergency preemption
    if (type === 'fire_engine') {
      emergencyTargetLaneRef.current = originLane;
      emergencyTypeRef.current = 'fire_engine';
      onEmergencyDetected(originLane, 'fire_engine');
      setActiveRule(`FIRE FIGHTER IN LANE ${originLane} - IMMEDIATE PREEMPTION GREEN`);
      onAlertGenerated({
        type: 'fire_engine',
        severity: 'critical',
        title: `Fire Fighter Emergency Priority: Lane ${originLane}`,
        description: `Fire brigade emergency transit detected. Traffic signal preemption engaged for life safety.`,
        cameraId: `CAM-JUNCTION-${originLane}`,
        plate,
      });
    } else if (type === 'ambulance') {
      emergencyTargetLaneRef.current = originLane;
      emergencyTypeRef.current = 'ambulance';
      onEmergencyDetected(originLane, 'ambulance');
      setActiveRule(`AMBULANCE (108 EMS) IN LANE ${originLane} - GREEN CORRIDOR CLEARANCE`);
      onAlertGenerated({
        type: 'emergency',
        severity: 'critical',
        title: `Ambulance 108 Emergency: Lane ${originLane}`,
        description: `Critical medical emergency corridor cleared under IRC priority standard.`,
        cameraId: `CAM-JUNCTION-${originLane}`,
        plate,
      });
    } else if (type === 'vip') {
      onEmergencyDetected(originLane, 'vip');
      setActiveRule(`GOVERNMENT / VIP ESCORT IN LANE ${originLane} - PROTOCOL CLEARANCE`);
      onAlertGenerated({
        type: 'vip',
        severity: 'high',
        title: `Government / VIP Escort Convoy: Lane ${originLane}`,
        description: `State protocol security convoy verified. Coordinated signal wave active.`,
        cameraId: `CAM-JUNCTION-${originLane}`,
        plate,
      });
    }

    // If spawned as wrong route, immediately flag violation
    if (isWrongRoute) {
      onAlertGenerated({
        type: 'wrong_route',
        severity: 'critical',
        title: `Wrong Route / Opposite Driving: ${plate}`,
        description: `Vehicle observed moving on wrong side opposing Indian Keep-Left rules (MV Act Sec 177/184 - Interception Dispatched).`,
        cameraId: `CAM-JUNCTION-${originLane}`,
        plate,
        mvActSection: 'MV Act Sec 177 / 184',
        fineAmount: 1000,
      });
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

    if (crossing === 'A') {
      startX = 215; startY = 210; targetX = 385; targetY = 210;
    } else if (crossing === 'B') {
      startX = 390; startY = 215; targetX = 390; targetY = 385;
    } else if (crossing === 'C') {
      startX = 385; startY = 390; targetX = 215; targetY = 390;
    } else {
      startX = 210; startY = 385; targetX = 210; targetY = 215;
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

        if (phaseTimerRef.current <= 0) {
          const currentPhase = phaseOrder[currentPhaseIndexRef.current];

          if (lightStateRef.current === 'GREEN') {
            lightStateRef.current = 'YELLOW';
            phaseTimerRef.current = DEFAULT_YELLOW_SECONDS;
            setActiveRule(`Phase ${currentPhase} Change: 3s Amber Clearance`);
          } else if (lightStateRef.current === 'YELLOW') {
            lightStateRef.current = 'ALL_RED';
            phaseTimerRef.current = DEFAULT_ALL_RED_SECONDS;
            setActiveRule('All-Red Junction Clearance: Zero Conflict Clearance');
          } else if (lightStateRef.current === 'ALL_RED') {
            // Check if emergency is waiting
            if (emergencyTargetLaneRef.current) {
              const emgLane = emergencyTargetLaneRef.current;
              currentPhaseIndexRef.current = phaseOrder.indexOf(emgLane);
              lightStateRef.current = 'GREEN';
              phaseTimerRef.current = 16; // hold green for emergency
              setActiveRule(`${emergencyTypeRef.current === 'fire_engine' ? 'Fire Fighter' : 'Ambulance'} Preemption: Lane ${emgLane} Green Active`);
            } else {
              // Advance to next phase
              let nextIndex = (currentPhaseIndexRef.current + 1) % 4;
              currentPhaseIndexRef.current = nextIndex;
              const nextPhase = phaseOrder[nextIndex];
              
              const laneConfig = laneStats.find((l) => l.id === nextPhase);
              const allocatedGreen = laneConfig ? laneConfig.allocatedGreen : 24;

              lightStateRef.current = 'GREEN';
              phaseTimerRef.current = allocatedGreen;
              setActiveRule(`Phase ${nextPhase} Green Active (${allocatedGreen}s Webster Plan)`);

              if (Math.random() < 0.4) {
                spawnPedestrian(nextPhase);
              }
            }
          }
        }

        // Spawning logic
        if (now - lastSpawnTimeRef.current > (3200 / (trafficDensity / 25)) / effectiveSpeed) {
          spawnVehicle();
          lastSpawnTimeRef.current = now;
        }

        // 1-second interval stats update
        if (now - lastSecondTickRef.current > 1000) {
          lastSecondTickRef.current = now;

          const updatedStats = laneStats.map((lane) => {
            const laneVehicles = vehiclesRef.current.filter((v) => v.lane === lane.id);
            const queuedVehicles = laneVehicles.filter((v) => !v.passedStopLine && v.speed < 0.5);
            const totalPCU = queuedVehicles.reduce((sum, v) => sum + (pcuWeights[v.type] || 1), 0);
            const avgWait = queuedVehicles.length > 0 
              ? queuedVehicles.reduce((s, v) => s + v.waitTime, 0) / queuedVehicles.length 
              : 0;

            const counts: Record<VehicleType, number> = {
              car: 0, bus: 0, van: 0, auto: 0, lorry: 0, motorcycle: 0, ambulance: 0, fire_engine: 0, vip: 0
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

      // 2. VEHICLE PHYSICS & MOVEMENT (INDIAN LHT KEEP LEFT)
      const activePhase = phaseOrder[currentPhaseIndexRef.current];
      const currentLight = lightStateRef.current;

      vehiclesRef.current.forEach((veh, index) => {
        if (!isRunning) return;

        // Stop line coordinates:
        // Lane A (North, heading South): stop line at y = 200
        // Lane B (East, heading West): stop line at x = 400
        // Lane C (South, heading North): stop line at y = 400
        // Lane D (West, heading East): stop line at x = 200
        let distToStopLine = 999;
        if (veh.lane === 'A') distToStopLine = 200 - (veh.y + veh.length);
        else if (veh.lane === 'B') distToStopLine = veh.x - 400;
        else if (veh.lane === 'C') distToStopLine = veh.y - 400;
        else if (veh.lane === 'D') distToStopLine = 200 - (veh.x + veh.length);

        // Check if passed stop line
        if (distToStopLine < -8 && !veh.passedStopLine) {
          veh.passedStopLine = true;

          // VIOLATION CHECK: SIGNAL JUMPING (RED LIGHT VIOLATION)
          const isRed = veh.lane !== activePhase || currentLight === 'RED' || currentLight === 'ALL_RED';
          if (isRed && !veh.isEmergency && !veh.violationLogged) {
            veh.isSignalJump = true;
            veh.violationLogged = true;
            onAlertGenerated({
              type: 'signal_jumping',
              severity: 'critical',
              title: `Signal Jumping Violation: ${veh.plate}`,
              description: `Vehicle jumped red light at Lane ${veh.lane} stop line (MV Act Sec 119/177 - Automated e-Challan ₹1,000 issued).`,
              cameraId: `CAM-JUNCTION-${veh.lane}`,
              plate: veh.plate,
              mvActSection: 'MV Act Sec 119/177',
              fineAmount: 1000,
            });
          }
        }

        // VIOLATION CHECK: OVER-SPEEDING (SPEED LIMIT CROSSING)
        const currentSpeedKmh = Math.round(veh.speed * 15);
        if (currentSpeedKmh > 55 && !veh.isEmergency && !veh.violationLogged) {
          veh.isOverspeeding = true;
          veh.violationLogged = true;
          onAlertGenerated({
            type: 'overspeeding',
            severity: 'high',
            title: `Speed Limit Violation: ${veh.plate}`,
            description: `Vehicle clocked at ${currentSpeedKmh} km/h exceeding 40 km/h urban junction speed limit (MV Act Sec 112/183 - e-Challan ₹2,000 issued).`,
            cameraId: `CAM-JUNCTION-${veh.lane}`,
            plate: veh.plate,
            mvActSection: 'MV Act Sec 112/183',
            fineAmount: 2000,
          });
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

        // Check if pedestrians are occupying zebra
        let zebraOccupied = false;
        const crossingPedestrians = pedestriansRef.current.filter(
          (p) => p.crossing === veh.lane && p.state === 'crossing'
        );
        if (crossingPedestrians.length > 0 && distToStopLine > 0 && distToStopLine < 50) {
          zebraOccupied = true;
        }

        // Stop rule (unless intentionally forced to signal jump)
        const isRedForMe = veh.lane !== activePhase || currentLight !== 'GREEN';
        const mustStopForSignal = !veh.passedStopLine && isRedForMe && !veh.isSignalJump && distToStopLine > -5 && distToStopLine < 120;
        const mustStopForVehicleAhead = distToAhead < 20;

        if (mustStopForSignal || mustStopForVehicleAhead || zebraOccupied) {
          veh.speed = Math.max(0, veh.speed - 0.16 * effectiveSpeed);
          veh.waitTime += (dt * effectiveSpeed);
        } else {
          veh.speed = Math.min(veh.targetSpeed, veh.speed + 0.12 * effectiveSpeed);
        }

        // Advance position
        const moveStep = veh.speed * effectiveSpeed;
        if (veh.lane === 'A') veh.y += moveStep;
        else if (veh.lane === 'B') veh.x -= moveStep;
        else if (veh.lane === 'C') veh.y -= moveStep;
        else if (veh.lane === 'D') veh.x += moveStep;

        // Check emergency exit
        if (veh.isEmergency && veh.passedStopLine && (veh.y > 450 || veh.x < 150 || veh.y < 150 || veh.x > 450)) {
          emergencyTargetLaneRef.current = null;
          emergencyTypeRef.current = null;
          onEmergencyCleared();
        }
      });

      // Cleanup exited vehicles
      vehiclesRef.current = vehiclesRef.current.filter((v) => {
        return v.x >= -120 && v.x <= 720 && v.y >= -120 && v.y <= 720;
      });

      // 3. PEDESTRIAN MOVEMENT
      pedestriansRef.current.forEach((ped) => {
        if (!isRunning) return;
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

      // 4. DRAW JUNCTION CANVAS (INDIAN LHT KEEP LEFT GEOMETRY)
      ctx.clearRect(0, 0, 600, 600);

      // Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 600, 600);

      // Sidewalks
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 200, 200);
      ctx.fillRect(400, 0, 200, 200);
      ctx.fillRect(0, 400, 200, 200);
      ctx.fillRect(400, 400, 200, 200);

      // Road Asphalt
      ctx.fillStyle = '#131b26';
      ctx.fillRect(200, 0, 200, 600); // North-South
      ctx.fillRect(0, 200, 600, 200); // East-West

      // Road boundary borders
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(200, 0, 200, 600);
      ctx.strokeRect(0, 200, 600, 200);

      // Yellow Center Dividers (Double Yellow Lines at center 300)
      ctx.strokeStyle = '#eab308';
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

      // INDIAN LEFT-HAND TRAFFIC STOP LINES (Across Inbound Left-Hand Approach Lanes Only!)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.setLineDash([]);

      // Lane A (North approach, inbound is East half x=300 to 400)
      ctx.beginPath();
      ctx.moveTo(300, 200); ctx.lineTo(400, 200);
      ctx.stroke();

      // Lane B (East approach, inbound is South half y=300 to 400)
      ctx.beginPath();
      ctx.moveTo(400, 300); ctx.lineTo(400, 400);
      ctx.stroke();

      // Lane C (South approach, inbound is West half x=200 to 300)
      ctx.beginPath();
      ctx.moveTo(200, 400); ctx.lineTo(300, 400);
      ctx.stroke();

      // Lane D (West approach, inbound is North half y=200 to 300)
      ctx.beginPath();
      ctx.moveTo(200, 200); ctx.lineTo(200, 300);
      ctx.stroke();

      // Zebra Crossings
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      for (let x = 205; x < 395; x += 18) ctx.fillRect(x, 205, 10, 16);
      for (let x = 205; x < 395; x += 18) ctx.fillRect(x, 379, 10, 16);
      for (let y = 205; y < 395; y += 18) ctx.fillRect(205, y, 16, 10);
      for (let y = 205; y < 395; y += 18) ctx.fillRect(379, y, 16, 10);

      // Asphalt Stencils & Arrows for Indian Left-Hand Driving
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('KEEP LEFT ⬇', 320, 120);
      ctx.fillText('⬆ KEEP LEFT', 225, 480);
      ctx.fillText('KEEP LEFT ⬅', 480, 350);
      ctx.fillText('KEEP LEFT ➡', 60, 250);

      // Signal Light Heads
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

        ctx.fillStyle = '#020617';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.fillRect(x - 8, y - 22, 16, 44);
        ctx.strokeRect(x - 8, y - 22, 16, 44);

        ctx.fillStyle = colorRed;
        ctx.beginPath(); ctx.arc(x, y - 13, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = colorYellow;
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = colorGreen;
        ctx.beginPath(); ctx.arc(x, y + 13, 5, 0, Math.PI * 2); ctx.fill();
      };

      // Place light heads facing incoming drivers
      drawTrafficLight(415, 185, 'A'); // Facing Lane A (inbound on East half)
      drawTrafficLight(415, 415, 'B'); // Facing Lane B (inbound on South half)
      drawTrafficLight(185, 415, 'C'); // Facing Lane C (inbound on West half)
      drawTrafficLight(185, 185, 'D'); // Facing Lane D (inbound on North half)

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
        ctx.translate(
          veh.x + (veh.lane === 'A' || veh.lane === 'C' ? veh.width / 2 : veh.length / 2), 
          veh.y + (veh.lane === 'A' || veh.lane === 'C' ? veh.length / 2 : veh.width / 2)
        );

        let angle = 0;
        if (veh.lane === 'A') angle = Math.PI / 2; // South
        else if (veh.lane === 'B') angle = Math.PI; // West
        else if (veh.lane === 'C') angle = -Math.PI / 2; // North
        else if (veh.lane === 'D') angle = 0; // East

        ctx.rotate(angle);

        // Body
        ctx.fillStyle = veh.color;
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        const w = veh.length;
        const h = veh.width;
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.strokeRect(-w / 2, -h / 2, w, h);

        // Fire engine ladder & cabin details
        if (veh.type === 'fire_engine') {
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(-w * 0.35, -h * 0.25, w * 0.6, h * 0.5);
          ctx.strokeStyle = '#475569';
          ctx.strokeRect(-w * 0.35, -h * 0.25, w * 0.6, h * 0.5);
          // Dual flashing emergency beacons
          const flash = Math.floor(now / 120) % 2 === 0;
          ctx.fillStyle = flash ? '#ef4444' : '#38bdf8';
          ctx.beginPath(); ctx.arc(w * 0.3, -h * 0.3, 3, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = flash ? '#38bdf8' : '#ef4444';
          ctx.beginPath(); ctx.arc(w * 0.3, h * 0.3, 3, 0, Math.PI * 2); ctx.fill();
        }

        // Ambulance flashing beacon
        if (veh.type === 'ambulance') {
          // Red cross
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-4, -1.5, 8, 3);
          ctx.fillRect(-1.5, -4, 3, 8);
          // Flashing beacon
          const flash = Math.floor(now / 150) % 2 === 0;
          ctx.fillStyle = flash ? '#ef4444' : '#38bdf8';
          ctx.beginPath(); ctx.arc(w * 0.25, 0, 4, 0, Math.PI * 2); ctx.fill();
        }

        // VIP Convoy flag
        if (veh.isVip) {
          ctx.fillStyle = '#f97316'; // Saffron
          ctx.fillRect(w * 0.35, -h * 0.45, 4, 2);
          ctx.fillStyle = '#ffffff'; // White
          ctx.fillRect(w * 0.35, -h * 0.45 + 2, 4, 2);
          ctx.fillStyle = '#16a34a'; // Green
          ctx.fillRect(w * 0.35, -h * 0.45 + 4, 4, 2);
        }

        ctx.restore();

        // Bounding Box & Violations / ANPR Label
        if (showBoundingBoxes) {
          let boxStroke = '#38bdf8';
          let tagColor = '#0284c7';
          let tagText = `${veh.type.toUpperCase()} | ${veh.plate}`;

          if (veh.isFireEngine) {
            boxStroke = '#ef4444';
            tagColor = '#dc2626';
            tagText = `🔥 FIRE FIGHTER | ${veh.plate}`;
          } else if (veh.type === 'ambulance') {
            boxStroke = '#ef4444';
            tagColor = '#dc2626';
            tagText = `🚑 AMBULANCE 108 | ${veh.plate}`;
          } else if (veh.isVip) {
            boxStroke = '#facc15';
            tagColor = '#b45309';
            tagText = `👑 VIP CONVOY | ${veh.plate}`;
          } else if (veh.isSignalJump) {
            boxStroke = '#dc2626';
            tagColor = '#991b1b';
            tagText = `🚨 SIGNAL JUMP! ₹1,000 | ${veh.plate}`;
          } else if (veh.isWrongRoute) {
            boxStroke = '#f97316';
            tagColor = '#c2410c';
            tagText = `⛔ WRONG ROUTE! | ${veh.plate}`;
          } else if (veh.isOverspeeding) {
            boxStroke = '#eab308';
            tagColor = '#854d0e';
            tagText = `⚡ OVERSPEED ₹2,000 | ${veh.plate}`;
          } else if (veh.isBlacklisted) {
            boxStroke = '#e11d48';
            tagColor = '#be123c';
            tagText = `🛑 BLOCKED VEHICLE | ${veh.plate}`;
          }

          ctx.strokeStyle = boxStroke;
          ctx.lineWidth = veh.isSignalJump || veh.isFireEngine ? 2 : 1;
          const boxX = veh.x - 2;
          const boxY = veh.y - 2;
          const boxW = (veh.lane === 'A' || veh.lane === 'C' ? veh.width : veh.length) + 4;
          const boxH = (veh.lane === 'A' || veh.lane === 'C' ? veh.length : veh.width) + 4;
          
          ctx.strokeRect(boxX, boxY, boxW, boxH);

          // Top label tag
          ctx.font = 'bold 9px monospace';
          const textWidth = ctx.measureText(tagText).width;
          ctx.fillStyle = tagColor;
          ctx.fillRect(boxX, boxY - 14, Math.max(70, textWidth + 8), 13);

          ctx.fillStyle = '#ffffff';
          ctx.fillText(tagText, boxX + 4, boxY - 4);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isRunning, simSpeed, trafficDensity, showBoundingBoxes, pcuWeights, laneStats, onStatsUpdate, onEventGenerated, onAlertGenerated]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-md p-3 flex flex-col space-y-3">
      {/* Junction View Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2 text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-200">Live 4-Way Junction:</span>
          <span className="text-slate-400">Indian Left-Hand Drive (LHT)</span>
          <span className="bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.5 rounded font-mono text-[11px]">
            KEEP LEFT ACTIVE
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
            <span className="hidden md:inline">Boxes</span>
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
          Lane A: <span className="font-mono text-emerald-400">North (Keep Left)</span>
        </div>
        <div className="absolute top-4 right-4 bg-slate-900/90 border border-slate-800 px-2 py-1 rounded text-[11px] text-slate-300">
          Lane B: <span className="font-mono text-emerald-400">East (Keep Left)</span>
        </div>
        <div className="absolute bottom-10 left-4 bg-slate-900/90 border border-slate-800 px-2 py-1 rounded text-[11px] text-slate-300">
          Lane D: <span className="font-mono text-emerald-400">West (Keep Left)</span>
        </div>
        <div className="absolute bottom-10 right-4 bg-slate-900/90 border border-slate-800 px-2 py-1 rounded text-[11px] text-slate-300">
          Lane C: <span className="font-mono text-emerald-400">South (Keep Left)</span>
        </div>

        {/* Bottom Rule Status Line */}
        <div className="absolute bottom-2 left-4 right-4 bg-slate-900/95 border border-slate-700/80 px-3 py-1.5 rounded flex items-center justify-between text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
            <span className="font-semibold text-slate-400">Active Rule:</span>
            <span className="text-blue-300 font-mono truncate">{activeRule}</span>
          </div>
          <span className="text-slate-400 hidden sm:inline text-[10px]">
            Indian MV Act 1988/2019 Enforcement
          </span>
        </div>
      </div>

      {/* Indian Traffic Actions: Emergency / Govt Vehicles & Violation Triggers */}
      <div className="space-y-2 pt-1 text-xs">
        <div className="flex items-center justify-between text-slate-400 text-[11px]">
          <span className="font-semibold text-slate-200">Government & Emergency Preemption:</span>
          <span>Click to dispatch live vehicle into junction:</span>
        </div>

        {/* Emergency & Govt Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => spawnVehicle('fire_engine', 'A')}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-950 hover:bg-red-900 text-red-200 border border-red-700 rounded-sm font-semibold transition"
            title="Dispatch Fire Fighter Emergency Engine (Preempts signal immediately)"
          >
            <Flame className="w-4 h-4 text-red-400" />
            <span>Fire Fighter (Lane A)</span>
          </button>

          <button
            onClick={() => spawnVehicle('ambulance', 'B')}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-700 rounded-sm font-semibold transition"
            title="Dispatch 108 Emergency Ambulance (Green wave priority)"
          >
            <Siren className="w-4 h-4 text-rose-400" />
            <span>Ambulance 108 (Lane B)</span>
          </button>

          <button
            onClick={() => spawnVehicle('vip', 'C')}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-950 hover:bg-amber-900 text-amber-200 border border-amber-700 rounded-sm font-semibold transition"
            title="Dispatch Government Protocol / VIP Escort Convoy"
          >
            <Crown className="w-4 h-4 text-amber-400" />
            <span>VIP Govt Convoy (Lane C)</span>
          </button>

          <button
            onClick={() => spawnVehicle('car', 'D', undefined)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-700 rounded-sm font-semibold transition"
            title="Simulate Blocked / Stolen Vehicle on National Blacklist"
          >
            <ShieldAlert className="w-4 h-4 text-purple-400" />
            <span>Blocked / Wanted Car</span>
          </button>
        </div>

        {/* Indian Traffic Rule Violations Simulation Row */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span className="font-semibold text-slate-200">Simulate Indian Traffic Rule Violations:</span>
            <span className="text-amber-400">Generates instant e-Challan & MV Act citation</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => spawnVehicle('car', 'A', 'signal_jump')}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-red-950/60 text-red-300 border border-slate-800 hover:border-red-800 rounded-sm font-medium transition"
              title="Vehicle crosses stop line during RED signal (MV Act Sec 119/177)"
            >
              <Ban className="w-3.5 h-3.5 text-red-400" />
              <span>Simulate Signal Jump (₹1,000)</span>
            </button>

            <button
              onClick={() => spawnVehicle('auto', 'B', 'wrong_route')}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-orange-950/60 text-orange-300 border border-slate-800 hover:border-orange-800 rounded-sm font-medium transition"
              title="Vehicle moves on the wrong side opposing Keep-Left rule (MV Act Sec 177/184)"
            >
              <Navigation2 className="w-3.5 h-3.5 text-orange-400 rotate-180" />
              <span>Simulate Wrong Route (Sec 177)</span>
            </button>

            <button
              onClick={() => spawnVehicle('motorcycle', 'C', 'overspeeding')}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-amber-950/60 text-amber-300 border border-slate-800 hover:border-amber-800 rounded-sm font-medium transition"
              title="Vehicle exceeds junction speed limit (MV Act Sec 112/183)"
            >
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Speeding (₹2,000)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
