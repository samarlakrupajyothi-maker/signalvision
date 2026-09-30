import React from 'react';
import { 
  Network, 
  Layers, 
  Terminal, 
  Database, 
  Cpu, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle,
  Activity,
  Server
} from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-md p-5 flex flex-col space-y-6 max-w-5xl mx-auto">
      {/* SIH PS 26127 Title Banner */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-blue-900/60 text-blue-300 border border-blue-700 px-2 py-0.5 rounded text-xs font-mono font-bold">
            SMART INDIA HACKATHON
          </span>
          <span className="text-xs text-slate-400 font-mono">
            Problem Statement 26127
          </span>
        </div>
        <h1 className="text-lg font-bold text-white uppercase tracking-tight">
          Bharat Electronics Limited (BEL) &bull; Smart Automation (Software)
        </h1>
        <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
          Signal Vision solves the urban surveillance fragmentation dilemma. In Indian metropolitan corridors, independent CCTV/ANPR cameras fail to correlate vehicle tracks across intersections, traffic signals operate on static schedules, and emergency vehicles lose critical response minutes.
        </p>
      </div>

      {/* End-To-End Technical Workflow Architecture Diagram */}
      <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Network className="w-4 h-4 text-emerald-400" />
          <span>Full Pipeline Technical Workflow Architecture:</span>
        </h3>

        <div className="bg-slate-900 p-4 rounded border border-slate-800 font-mono text-[11px] text-slate-300 leading-loose overflow-x-auto">
          <pre>{`Camera / Video Feed (RTSP, MP4 File, Browser Webcam)
  │
  ▼
[1] Frame Sampler (5 to 15 FPS adaptive decimation)
  │
  ▼
[2] Vehicle Detection (YOLOv8n / YOLOX-Nano Apache-2.0 fallback)
  │
  ▼
[3] Multi-Object Tracking (ByteTrack Kalman Filter -> Stable Vehicle IDs)
  │
  ▼
[4] License Plate Crop & OpenCV Enhancement (CLAHE, Deskew, Unsharp Mask)
  │
  ▼
[5] OCR Engine (PaddleOCR v4 / EasyOCR fallback) -> MoRTH Format Validation & Confidence
  │
  ▼
[6] High-Throughput Event Bus (Redis Streams / In-process ZeroMQ queue)
  │
  ├───► Worker A: Trajectory Linker (Levenshtein Fuzzy Plate + OSNet Appearance Embedding)
  ├───► Worker B: Analytics Aggregator (PCU Volume, Density, O-D Matrix, Bottlenecks)
  ├───► Worker C: Alert Engine (Blacklist Match, Route Anomaly, Ambulance Preemption)
  └───► Worker D: Signal Planner (Webster Optimal Cycle C0 = (1.5L + 5)/(1 - Y))
  │
  ▼
[7] Spatial Storage Layer (PostgreSQL with PostGIS extension & SQLite prototype)
  │
  ▼
[8] API Server Layer (FastAPI REST for queries, WebSockets for sub-second updates)
  │
  ▼
[9] React Dashboard (Leaflet OpenStreetMap, Recharts, 60 FPS HTML5 Canvas Sim)`}
          </pre>
        </div>
      </div>

      {/* Database Schema & Relational Structure */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Database className="w-4 h-4 text-blue-400" />
          <span>PostGIS Relational Database Schema & Entities:</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded border border-slate-800">
            <strong className="text-white font-mono block mb-1">cameras</strong>
            <p className="text-slate-400 text-[11px]">
              camera_id (PK), junction_name, geom (Point 4326), ip_address, rtsp_url, fps, status, last_heartbeat
            </p>
          </div>
          <div className="bg-slate-950 p-3 rounded border border-slate-800">
            <strong className="text-white font-mono block mb-1">plate_reads</strong>
            <p className="text-slate-400 text-[11px]">
              read_id (PK), camera_id (FK), track_id, normalized_plate, ocr_confidence, hsrp_verified, timestamp, crop_uri
            </p>
          </div>
          <div className="bg-slate-950 p-3 rounded border border-slate-800">
            <strong className="text-white font-mono block mb-1">trajectories</strong>
            <p className="text-slate-400 text-[11px]">
              trajectory_id (PK), normalized_plate, path_linestring (LineString 4326), stop_count, avg_speed_kmh, anomaly_flag
            </p>
          </div>
          <div className="bg-slate-950 p-3 rounded border border-slate-800">
            <strong className="text-white font-mono block mb-1">signal_plans</strong>
            <p className="text-slate-400 text-[11px]">
              plan_id (PK), junction_id, cycle_length_sec, phase_a_green, phase_b_green, phase_c_green, phase_d_green, computed_at
            </p>
          </div>
          <div className="bg-slate-950 p-3 rounded border border-slate-800">
            <strong className="text-white font-mono block mb-1">blacklist</strong>
            <p className="text-slate-400 text-[11px]">
              plate_number (PK), reason, fir_number, issuing_agency, priority_level, created_at, active
            </p>
          </div>
          <div className="bg-slate-950 p-3 rounded border border-slate-800">
            <strong className="text-white font-mono block mb-1">audit_log</strong>
            <p className="text-slate-400 text-[11px]">
              log_id (PK), user_id, action, queried_plate, client_ip, authorization_ref, timestamp (DPDP 2023 tamper-evident)
            </p>
          </div>
        </div>
      </div>

      {/* REST & WebSocket Endpoints Specification */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Terminal className="w-4 h-4 text-amber-400" />
          <span>Production REST & WebSocket API Specification:</span>
        </h3>

        <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between py-1 border-b border-slate-900">
            <span className="text-emerald-400 font-bold">GET /health</span>
            <span className="text-slate-400 font-sans text-[11px]">Returns database connectivity, GPU inference health, and worker queue depths</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-slate-900">
            <span className="text-emerald-400 font-bold">GET /cameras</span>
            <span className="text-slate-400 font-sans text-[11px]">List all active camera nodes with current congestion classification</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-slate-900">
            <span className="text-emerald-400 font-bold">GET /plates/{'{plate}'}/trajectory</span>
            <span className="text-slate-400 font-sans text-[11px]">Returns chronological GeoJSON line and camera stops with velocity checks</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-slate-900">
            <span className="text-emerald-400 font-bold">GET /analytics/flow</span>
            <span className="text-slate-400 font-sans text-[11px]">Real-time PCU arrival rates and rolling 60-second classification</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-slate-900">
            <span className="text-emerald-400 font-bold">GET /analytics/od</span>
            <span className="text-slate-400 font-sans text-[11px]">Origin-Destination trip matrix aggregated across major municipal nodes</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-slate-900">
            <span className="text-emerald-400 font-bold">GET /signals/plan</span>
            <span className="text-slate-400 font-sans text-[11px]">Current Webster cycle length and proportional phase splits</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-slate-900">
            <span className="text-blue-400 font-bold">POST /blacklist</span>
            <span className="text-slate-400 font-sans text-[11px]">Register high-priority stolen/wanted vehicle with instant alert hook</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-purple-400 font-bold">WS /live</span>
            <span className="text-slate-400 font-sans text-[11px]">Bidirectional WebSocket streaming sub-second detections, events, and signal states</span>
          </div>
        </div>
      </div>
    </div>
  );
};
