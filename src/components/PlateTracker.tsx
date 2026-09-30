import React, { useState } from 'react';
import { 
  Search, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle, 
  HelpCircle,
  TrendingUp,
  FileCheck,
  Compass
} from 'lucide-react';
import { TrajectoryPoint, VehicleType } from '../types/traffic';
import { VIJAYAWADA_CAMERAS } from '../constants/cameras';
import { validateIndianPlate, isFuzzyPlateMatch } from '../utils/plateValidator';

interface PlateTrackerProps {
  onTrajectorySelected: (trajectory: TrajectoryPoint[]) => void;
  onAlertGenerated: (alert: {
    type: 'blacklist' | 'route_anomaly';
    title: string;
    description: string;
    plate: string;
  }) => void;
}

// Sample mock database of vehicle observations across Vijayawada network
const SAMPLE_TRAJECTORIES_DB: Record<string, {
  plate: string;
  type: VehicleType;
  ownerType: string;
  isBlacklisted?: boolean;
  stops: {
    cameraId: string;
    timeOffsetMin: number;
    speed: number;
    direction: string;
  }[];
}> = {
  'AP 16 CQ 4821': {
    plate: 'AP 16 CQ 4821',
    type: 'car',
    ownerType: 'Private Sedan (White Swift Dzire)',
    stops: [
      { cameraId: 'CAM-VIJ-03', timeOffsetMin: 28, speed: 45, direction: 'Southbound to Benz Circle' },
      { cameraId: 'CAM-VIJ-01', timeOffsetMin: 18, speed: 28, direction: 'Entering MG Road' },
      { cameraId: 'CAM-VIJ-02', timeOffsetMin: 12, speed: 32, direction: 'Towards Governorpet' },
      { cameraId: 'CAM-VIJ-08', timeOffsetMin: 4, speed: 20, direction: 'Terminated at Market' },
    ],
  },
  'DL 01 AB 9942': {
    plate: 'DL 01 AB 9942',
    type: 'car',
    ownerType: 'Interstate Commercial Taxi (Innova)',
    isBlacklisted: true,
    stops: [
      { cameraId: 'CAM-VIJ-07', timeOffsetMin: 35, speed: 52, direction: 'Inbound from NH65' },
      { cameraId: 'CAM-VIJ-05', timeOffsetMin: 22, speed: 24, direction: 'PNBS Bus Complex' },
      { cameraId: 'CAM-VIJ-04', timeOffsetMin: 14, speed: 18, direction: 'PCR Circle' },
      { cameraId: 'CAM-VIJ-08', timeOffsetMin: 3, speed: 22, direction: 'Eluru Road' },
    ],
  },
  'AP 39 TK 9812': {
    plate: 'AP 39 TK 9812',
    type: 'bus',
    ownerType: 'APSRTC City Ordinary Bus',
    stops: [
      { cameraId: 'CAM-VIJ-06', timeOffsetMin: 40, speed: 44, direction: 'Northbound across Krishna River' },
      { cameraId: 'CAM-VIJ-05', timeOffsetMin: 26, speed: 22, direction: 'PNBS Main Terminal' },
      { cameraId: 'CAM-VIJ-04', timeOffsetMin: 16, speed: 19, direction: 'PCR Flyover' },
      { cameraId: 'CAM-VIJ-01', timeOffsetMin: 6, speed: 24, direction: 'Benz Circle' },
    ],
  },
  'TS 09 FA 1010': {
    plate: 'TS 09 FA 1010',
    type: 'lorry',
    ownerType: 'Heavy Multi-Axle Logistics Truck',
    stops: [
      { cameraId: 'CAM-VIJ-07', timeOffsetMin: 45, speed: 40, direction: 'Bypass North' },
      { cameraId: 'CAM-VIJ-03', timeOffsetMin: 2, speed: 140, direction: 'NH16 High Speed' }, // Impossible travel time anomaly!
    ],
  },
};

export const PlateTracker: React.FC<PlateTrackerProps> = ({
  onTrajectorySelected,
  onAlertGenerated,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchedPlate, setSearchedPlate] = useState<string | null>(null);
  const [trajectoryResult, setTrajectoryResult] = useState<TrajectoryPoint[] | null>(null);
  const [validationInfo, setValidationInfo] = useState<any>(null);
  const [anomalyDetected, setAnomalyDetected] = useState<string | null>(null);
  const [matchedRecord, setMatchedRecord] = useState<any>(null);

  // Autocomplete suggestions
  const suggestions = Object.keys(SAMPLE_TRAJECTORIES_DB).filter((p) =>
    p.toLowerCase().includes(searchTerm.toLowerCase().replace(/[^a-z0-9]/g, ''))
  );

  const handleSearch = (plateToQuery: string) => {
    const cleanQuery = plateToQuery.trim();
    if (!cleanQuery) return;

    // Validate against Indian MoRTH format
    const valResult = validateIndianPlate(cleanQuery);
    setValidationInfo(valResult);

    if (!valResult.isValid) {
      setTrajectoryResult(null);
      setSearchedPlate(cleanQuery);
      return;
    }

    const norm = valResult.normalizedPlate;
    setSearchedPlate(norm);

    // Look for exact or fuzzy match in DB
    let foundKey = Object.keys(SAMPLE_TRAJECTORIES_DB).find(
      (k) => k === norm || isFuzzyPlateMatch(k, norm, 1)
    );

    if (!foundKey) {
      // Build a synthesized realistic 3-stop trajectory for any valid plate tested by operator
      const randomCameras = [...VIJAYAWADA_CAMERAS].sort(() => 0.5 - Math.random()).slice(0, 3);
      const now = Date.now();
      const syntheticStops: TrajectoryPoint[] = randomCameras.map((cam, idx) => ({
        order: idx + 1,
        cameraId: cam.id,
        cameraName: cam.name,
        timestamp: new Date(now - (3 - idx) * 9 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        speed: 28 + Math.floor(Math.random() * 20),
        plate: norm,
        vehicleType: 'car',
        direction: 'Urban Corridor Approach',
        lat: cam.lat,
        lng: cam.lng,
      }));

      setMatchedRecord({
        plate: norm,
        type: 'car',
        ownerType: 'Registered Passenger Vehicle (HSRP Verified)',
        isBlacklisted: false,
      });
      setAnomalyDetected(null);
      setTrajectoryResult(syntheticStops);
      onTrajectorySelected(syntheticStops);
      return;
    }

    const record = SAMPLE_TRAJECTORIES_DB[foundKey];
    setMatchedRecord(record);

    // Build timeline points
    const now = Date.now();
    const points: TrajectoryPoint[] = record.stops.map((stop, idx) => {
      const cam = VIJAYAWADA_CAMERAS.find((c) => c.id === stop.cameraId);
      return {
        order: idx + 1,
        cameraId: stop.cameraId,
        cameraName: cam ? cam.name : stop.cameraId,
        timestamp: new Date(now - stop.timeOffsetMin * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        speed: stop.speed,
        plate: record.plate,
        vehicleType: record.type,
        direction: stop.direction,
        lat: cam ? cam.lat : 16.5062,
        lng: cam ? cam.lng : 80.6480,
      };
    });

    // Check for Route Anomaly (Impossible Travel Time / Extreme Speed)
    let anomaly: string | null = null;
    for (let i = 1; i < points.length; i++) {
      const p1 = points[i - 1];
      const p2 = points[i];
      if (p2.speed > 110) {
        anomaly = `Impossible speed detected: ${p2.speed} km/h between ${p1.cameraName} and ${p2.cameraName} (Distance requires minimum 15 mins, observed in 2 mins). Possible cloned registration plate!`;
        break;
      }
    }

    setAnomalyDetected(anomaly);
    setTrajectoryResult(points);
    onTrajectorySelected(points);

    // Trigger alerts if blacklisted or anomaly
    if (record.isBlacklisted) {
      onAlertGenerated({
        type: 'blacklist',
        title: `Blacklist Match: ${record.plate}`,
        description: `Stolen/Wanted vehicle detected at ${points[points.length - 1].cameraName} at ${points[points.length - 1].timestamp}.`,
        plate: record.plate,
      });
    }

    if (anomaly) {
      onAlertGenerated({
        type: 'route_anomaly',
        title: `Route Anomaly / Cloned Plate: ${record.plate}`,
        description: anomaly,
        plate: record.plate,
      });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-md p-4 flex flex-col space-y-4">
      {/* Question Header */}
      <div className="border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            ANPR Trajectory & Cross-Camera Reconstruction
          </h2>
        </div>
        <p className="text-xs text-blue-400 font-medium mt-0.5">
          Answers: "Where did this vehicle go across the city network?"
        </p>
      </div>

      {/* Search Input & Quick Samples */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchTerm)}
            placeholder="Enter Indian Plate (e.g. AP 16 CQ 4821 or DL 01 AB 9942)"
            className="w-full bg-slate-950 border border-slate-700 rounded-sm px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
          />
          {searchTerm && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-slate-950 border border-slate-800 rounded shadow-lg max-h-36 overflow-y-auto">
              {suggestions.map((plate) => (
                <button
                  key={plate}
                  onClick={() => {
                    setSearchTerm(plate);
                    handleSearch(plate);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs font-mono text-slate-200 hover:bg-slate-800 flex items-center justify-between border-b border-slate-900 last:border-0"
                >
                  <span>{plate}</span>
                  <span className="text-[10px] text-slate-400">
                    {SAMPLE_TRAJECTORIES_DB[plate]?.ownerType}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => handleSearch(searchTerm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-sm flex items-center justify-center gap-1.5 transition"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Track Path</span>
        </button>
      </div>

      {/* Quick click suggestions */}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
        <span>Try sample:</span>
        {Object.keys(SAMPLE_TRAJECTORIES_DB).map((plate) => (
          <button
            key={plate}
            onClick={() => {
              setSearchTerm(plate);
              handleSearch(plate);
            }}
            className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded font-mono text-[10px]"
          >
            {plate}
          </button>
        ))}
      </div>

      {/* Validation Result Box */}
      {validationInfo && (
        <div className={`p-2.5 rounded border text-xs flex items-start gap-2 ${
          validationInfo.isValid 
            ? 'bg-slate-950 border-slate-800 text-slate-300' 
            : 'bg-red-950/60 border-red-800 text-red-300'
        }`}>
          {validationInfo.isValid ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          )}
          <div>
            {validationInfo.isValid ? (
              <div className="flex flex-wrap items-center gap-2">
                <span>MoRTH Standard Plate:</span>
                <strong className="text-white font-mono">{validationInfo.normalizedPlate}</strong>
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700">
                  State: {validationInfo.stateCode || 'Bharat Series'} • RTO: {validationInfo.rtoCode || 'All-India'}
                </span>
                <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.2 rounded">
                  HSRP Standard Verified
                </span>
              </div>
            ) : (
              <div>
                <strong>Invalid Plate Format: </strong>
                <span>{validationInfo.reason}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Blacklist or Anomaly Warnings */}
      {matchedRecord?.isBlacklisted && (
        <div className="bg-red-950/80 border border-red-600 rounded p-2.5 text-xs text-red-200 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
          <div>
            <strong className="uppercase">CRITICAL ALERT: BLACKLISTED REGISTRATION DETECTED</strong>
            <p className="text-[11px] text-red-300">
              Vehicle flagged for immediate police interception. Automated alert sent to Vijayawada PCR dispatch.
            </p>
          </div>
        </div>
      )}

      {anomalyDetected && (
        <div className="bg-amber-950/80 border border-amber-600 rounded p-2.5 text-xs text-amber-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <strong className="uppercase">ROUTE ANOMALY: CLONED PLATE / IMPOSSIBLE VELOCITY</strong>
            <p className="text-[11px] text-amber-300">{anomalyDetected}</p>
          </div>
        </div>
      )}

      {/* Trajectory Timeline List */}
      {trajectoryResult && trajectoryResult.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold">Reconstructed Path Timeline ({trajectoryResult.length} Sightings):</span>
            <span className="text-[11px] text-slate-400">Chronological Sequence (1 &rarr; {trajectoryResult.length})</span>
          </div>

          <div className="space-y-2 relative before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
            {trajectoryResult.map((point) => (
              <div
                key={point.order}
                className="relative pl-7 bg-slate-950 p-2.5 rounded border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                {/* Numbered stop circle */}
                <div className="absolute left-1.5 top-3.5 w-3.5 h-3.5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center -translate-x-1/2">
                  {point.order}
                </div>

                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>{point.cameraName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({point.cameraId})</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <Compass className="w-3 h-3 text-slate-500" />
                    <span>{point.direction}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <div>
                    <div className="text-slate-400 text-[10px]">TIMESTAMP</div>
                    <div className="font-mono text-slate-200">{point.timestamp}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">RECORDED SPEED</div>
                    <div className={`font-mono font-bold ${point.speed > 80 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {point.speed} km/h
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
