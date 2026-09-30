import { VehicleType } from '../types/traffic';

// Indian Road Congress (IRC) standard PCU equivalents
export const DEFAULT_PCU_WEIGHTS: Record<VehicleType, number> = {
  car: 1.0,
  bus: 3.0,
  van: 1.5,
  auto: 0.7,
  lorry: 3.0,
  motorcycle: 0.5,
  ambulance: 1.0,
  vip: 1.0,
};

export const PCU_DESCRIPTIONS: Record<VehicleType, string> = {
  car: 'Passenger Car (Base 1.0 PCU)',
  bus: 'Heavy Passenger Vehicle (3.0 PCU)',
  van: 'Light Commercial Vehicle (1.5 PCU)',
  auto: 'Three-Wheeler Auto-rickshaw (0.7 PCU)',
  lorry: 'Heavy Goods Truck (3.0 PCU)',
  motorcycle: 'Two-Wheeler Motorbike / Scooter (0.5 PCU)',
  ambulance: 'Priority Emergency Unit (1.0 PCU)',
  vip: 'Priority Escort Convoy (1.0 PCU)',
};

// Saturation flow per lane (PCU/hour of green)
export const DEFAULT_SATURATION_FLOW = 1800; // standard IRC value for single approach lane
export const MIN_GREEN_SECONDS = 10;
export const MAX_GREEN_SECONDS = 60;
export const DEFAULT_YELLOW_SECONDS = 3;
export const DEFAULT_ALL_RED_SECONDS = 2;
export const PEDESTRIAN_WALK_SECONDS = 7;
export const PEDESTRIAN_CLEARANCE_SECONDS = 5;
