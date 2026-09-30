export type VehicleType = 
  | 'car' 
  | 'bus' 
  | 'van' 
  | 'auto' 
  | 'lorry' 
  | 'motorcycle' 
  | 'ambulance' 
  | 'fire_engine'
  | 'vip';

export type SignalPhase = 'A' | 'B' | 'C' | 'D';
export type LightState = 'GREEN' | 'YELLOW' | 'RED' | 'ALL_RED';

export interface Vehicle {
  id: string;
  type: VehicleType;
  lane: SignalPhase; // Origin lane: A=North, B=East, C=South, D=West
  targetLane: SignalPhase; // Destination lane
  turnDirection: 'straight' | 'left' | 'right';
  x: number;
  y: number;
  speed: number;
  targetSpeed: number;
  length: number;
  width: number;
  color: string;
  plate: string;
  isBlacklisted?: boolean;
  isEmergency?: boolean;
  isFireEngine?: boolean;
  isVip?: boolean;
  isGovtVehicle?: boolean;
  isSignalJump?: boolean;
  isWrongRoute?: boolean;
  isOverspeeding?: boolean;
  violationLogged?: boolean;
  waitTime: number;
  passedStopLine: boolean;
  progress: number;
  pcu: number;
}

export interface Pedestrian {
  id: string;
  crossing: SignalPhase; // which crossing zebra
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
  state: 'waiting' | 'crossing' | 'cleared';
}

export interface LaneStats {
  id: SignalPhase;
  name: string;
  direction: 'North' | 'East' | 'South' | 'West';
  signal: LightState;
  countdown: number;
  queueLength: number;
  totalPCU: number;
  avgWaitSeconds: number;
  vehicleCounts: Record<VehicleType, number>;
  allocatedGreen: number;
  flowRate: number; // PCU per hour
  saturationFlow: number;
}

export interface TrafficEvent {
  event_id: string;
  camera_id: string;
  timestamp: string;
  lane: SignalPhase;
  track_id: string;
  vehicle_type: VehicleType;
  plate: string | null;
  ocr_confidence: number;
  speed: number; // km/h
  direction: string;
  bbox: [number, number, number, number]; // [x, y, w, h]
  is_approximate?: boolean;
}

export interface CameraNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  junction: string;
  status: 'active' | 'maintenance' | 'offline';
  congestionLevel: 'low' | 'moderate' | 'high'; // green, amber, red
  vehicleCount: number;
  avgSpeedKmH: number;
  fps: number;
  lastPlate: string;
}

export interface TrajectoryPoint {
  order: number;
  cameraId: string;
  cameraName: string;
  timestamp: string;
  speed: number;
  plate: string;
  vehicleType: VehicleType;
  direction: string;
  lat: number;
  lng: number;
}

export interface TrafficAlert {
  id: string;
  type: 
    | 'blacklist' 
    | 'route_anomaly' 
    | 'emergency' 
    | 'vip' 
    | 'fire_engine'
    | 'govt_vehicle'
    | 'signal_jumping' 
    | 'wrong_route' 
    | 'overspeeding' 
    | 'congestion';
  severity: 'critical' | 'high' | 'medium' | 'info';
  title: string;
  description: string;
  timestamp: string;
  cameraId: string;
  plate?: string;
  mvActSection?: string;
  fineAmount?: number;
  acknowledged: boolean;
}

export interface SignalPlan {
  cycleLength: number;
  lostTime: number;
  phaseGreens: Record<SignalPhase, number>;
  yellowTime: number;
  allRedTime: number;
  pedestrianWalkTime: number;
  pedestrianClearanceTime: number;
  mode: 'fixed' | 'webster_adaptive' | 'emergency_override' | 'manual';
  activeRule: string;
}

export interface WhatIfResult {
  planType: 'Fixed (Static)' | 'Webster Adaptive';
  cycleSeconds: number;
  avgWaitSeconds: number;
  maxQueueVehicles: number;
  throughputPerHour: number;
  delayReductionPct?: number;
  measuredAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  role: 'Public' | 'Operator' | 'Admin';
  action: string;
  details: string;
  ipAddress: string;
}
