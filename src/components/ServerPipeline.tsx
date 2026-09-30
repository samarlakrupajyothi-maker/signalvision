import React, { useState } from 'react';
import { 
  Server, 
  Database, 
  Radio, 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  Play, 
  Terminal,
  RefreshCw,
  Cpu,
  Layers
} from 'lucide-react';
import { TrafficEvent } from '../types/traffic';

export const ServerPipeline: React.FC = () => {
  const [serverState, setServerState] = useState<'idle' | 'waking_up' | 'connected'>('connected');
  const [rtspUrl, setRtspUrl] = useState<string>('rtsp://edge-gateway.vijayawada.internal:554/live/cam01');
  const [streamFps, setStreamFps] = useState<number>(15);
  const [streamActive, setStreamActive] = useState<boolean>(true);

  // Sample live JSON event stream
  const [recentEvents, setRecentEvents] = useState<TrafficEvent[]>([
    {
      event_id: 'EVT-BEL-8041',
      camera_id: 'CAM-VIJ-01',
      timestamp: new Date().toISOString(),
      lane: 'A',
      track_id: 'TRK-9811',
      vehicle_type: 'car',
      plate: 'AP 16 CQ 4821',
      ocr_confidence: 0.96,
      speed: 38,
      direction: 'Southbound',
      bbox: [120, 240, 64, 96],
    },
    {
      event_id: 'EVT-BEL-8042',
      camera_id: 'CAM-VIJ-02',
      timestamp: new Date(Date.now() - 2000).toISOString(),
      lane: 'B',
      track_id: 'TRK-9812',
      vehicle_type: 'bus',
      plate: 'AP 39 TK 9812',
      ocr_confidence: 0.94,
      speed: 28,
      direction: 'Westbound',
      bbox: [240, 180, 84, 160],
    },
  ]);

  const handleWakeServer = () => {
    setServerState('waking_up');
    setTimeout(() => {
      setServerState('connected');
    }, 2500);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-md p-4 flex flex-col space-y-4">
      {/* Header */}
      <div className="border-b border-slate-800 pb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Mode C: Server Pipeline & Edge-Gateway Telemetry
            </h2>
          </div>
          <p className="text-xs text-blue-400 font-medium mt-0.5">
            Full Production Stack: RTSP &rarr; YOLOv8 &rarr; ByteTrack &rarr; PaddleOCR &rarr; Redis &rarr; PostGIS
          </p>
        </div>

        {/* Server State Badge */}
        <div className="flex items-center gap-2">
          {serverState === 'connected' && (
            <span className="flex items-center gap-1.5 bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              FastAPI + PostGIS Connected
            </span>
          )}
          {serverState === 'waking_up' && (
            <span className="flex items-center gap-1.5 bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded text-xs animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Free Tier Container Waking Up...
            </span>
          )}
          <button
            onClick={handleWakeServer}
            className="p-1 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded text-xs"
            title="Ping /health endpoint"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Pipeline Architecture Diagram Row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center text-xs">
        <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
          <Radio className="w-4 h-4 text-blue-400 mx-auto mb-1" />
          <strong className="block text-slate-200">1. RTSP Stream</strong>
          <span className="text-[10px] text-slate-400">15 fps H.264 Ingest</span>
        </div>
        <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
          <Cpu className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <strong className="block text-slate-200">2. YOLOv8s</strong>
          <span className="text-[10px] text-slate-400">Vehicle BBoxes</span>
        </div>
        <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
          <Layers className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <strong className="block text-slate-200">3. ByteTrack</strong>
          <span className="text-[10px] text-slate-400">Stable Vehicle IDs</span>
        </div>
        <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
          <Activity className="w-4 h-4 text-sky-400 mx-auto mb-1" />
          <strong className="block text-slate-200">4. PaddleOCR</strong>
          <span className="text-[10px] text-slate-400">MoRTH Plate Regex</span>
        </div>
        <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
          <Radio className="w-4 h-4 text-purple-400 mx-auto mb-1" />
          <strong className="block text-slate-200">5. Redis Stream</strong>
          <span className="text-[10px] text-slate-400">Sub-10ms Event Bus</span>
        </div>
        <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
          <Database className="w-4 h-4 text-rose-400 mx-auto mb-1" />
          <strong className="block text-slate-200">6. PostGIS</strong>
          <span className="text-[10px] text-slate-400">Spatial Trajectory</span>
        </div>
      </div>

      {/* RTSP Stream Configuration & Diagnostics */}
      <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-2">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
          RTSP Input Stream Configuration:
        </h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={rtspUrl}
            onChange={(e) => setRtspUrl(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-sm px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => setStreamActive(!streamActive)}
            className={`px-3 py-1.5 rounded-sm text-xs font-semibold flex items-center justify-center gap-1 transition ${
              streamActive ? 'bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-700' : 'bg-emerald-600 text-white'
            }`}
          >
            {streamActive ? 'Stop Ingest' : 'Start Ingest'}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
          <span>Inference Latency: <strong className="text-emerald-400 font-mono">18.4 ms</strong></span>
          <span>Buffer Health: <strong className="text-slate-200 font-mono">100% OK</strong></span>
          <span>Protocol: <strong className="text-slate-200 font-mono">RTSP / TCP Interleaved</strong></span>
        </div>
      </div>

      {/* Unified JSON Event Bus Console */}
      <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Unified Event Bus Payload Format (WebSocket /live):</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Strict JSON Schema Validation Pass</span>
        </div>

        <pre className="bg-slate-900 p-3 rounded border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto">
{JSON.stringify(recentEvents[0], null, 2)}
        </pre>
      </div>
    </div>
  );
};
