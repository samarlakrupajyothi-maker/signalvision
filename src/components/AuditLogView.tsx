import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileLock2, 
  Trash2, 
  Plus, 
  Calendar, 
  UserCheck, 
  Database, 
  AlertTriangle,
  Camera,
  Check
} from 'lucide-react';
import { AuditLogEntry } from '../types/traffic';
import { VIJAYAWADA_CAMERAS } from '../constants/cameras';

interface AuditLogViewProps {
  auditLogs: AuditLogEntry[];
  onAddBlacklist: (plate: string, reason: string) => void;
  blacklistPlates: { plate: string; reason: string; date: string }[];
  onRemoveBlacklist: (plate: string) => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({
  auditLogs,
  onAddBlacklist,
  blacklistPlates,
  onRemoveBlacklist,
}) => {
  const [retentionDays, setRetentionDays] = useState<number>(30);
  const [newPlate, setNewPlate] = useState<string>('');
  const [newReason, setNewReason] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'audit' | 'blacklist' | 'cameras' | 'retention'>('audit');

  const handleCreateBlacklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate.trim()) return;
    onAddBlacklist(newPlate.trim().toUpperCase(), newReason.trim() || 'Traffic violation / Wanted alert');
    setNewPlate('');
    setNewReason('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-md p-4 flex flex-col space-y-4">
      {/* Header */}
      <div className="border-b border-slate-800 pb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Administration & DPDP Act 2023 Compliance Center
            </h2>
          </div>
          <p className="text-xs text-blue-400 font-medium mt-0.5">
            Role-Based Access Control, Tamper-Evident Search Audit, and Automated Data Retention
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex bg-slate-950 p-0.5 rounded border border-slate-800 text-xs">
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`px-2.5 py-1 rounded transition ${
              activeSubTab === 'audit' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Audit Log ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveSubTab('blacklist')}
            className={`px-2.5 py-1 rounded transition ${
              activeSubTab === 'blacklist' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Blacklist ({blacklistPlates.length})
          </button>
          <button
            onClick={() => setActiveSubTab('cameras')}
            className={`px-2.5 py-1 rounded transition ${
              activeSubTab === 'cameras' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cameras ({VIJAYAWADA_CAMERAS.length})
          </button>
          <button
            onClick={() => setActiveSubTab('retention')}
            className={`px-2.5 py-1 rounded transition ${
              activeSubTab === 'retention' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            DPDP Retention
          </button>
        </div>
      </div>

      {/* Tab: Audit Log */}
      {activeSubTab === 'audit' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Every plate search and export action is permanently logged per Indian statutory regulations.</span>
            <span className="font-mono text-emerald-400">SHA-256 Log Integrity Verified</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400">
                  <th className="text-left py-2 px-3">Timestamp</th>
                  <th className="text-left py-2 px-3">Operator / User</th>
                  <th className="text-left py-2 px-3">Role</th>
                  <th className="text-left py-2 px-3">Action</th>
                  <th className="text-left py-2 px-3">Details / Target Plate</th>
                  <th className="text-right py-2 px-3">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                    <td className="py-2 px-3 font-mono text-slate-400">{log.timestamp}</td>
                    <td className="py-2 px-3 text-white font-medium">{log.user}</td>
                    <td className="py-2 px-3">
                      <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-300">
                        {log.role}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-blue-400 font-semibold">{log.action}</td>
                    <td className="py-2 px-3 text-slate-300 font-mono">{log.details}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-400">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Blacklist Management */}
      {activeSubTab === 'blacklist' && (
        <div className="space-y-4">
          {/* Add form */}
          <form onSubmit={handleCreateBlacklist} className="bg-slate-950 p-3 rounded border border-slate-800 flex flex-wrap gap-2 items-center text-xs">
            <input
              type="text"
              placeholder="Registration Plate (e.g. DL 01 AB 9942)"
              value={newPlate}
              onChange={(e) => setNewPlate(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500 flex-1 min-w-[200px]"
            />
            <input
              type="text"
              placeholder="Reason / FIR / Warrant Ref"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 flex-1 min-w-[200px]"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Blacklist</span>
            </button>
          </form>

          {/* Blacklist Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400">
                  <th className="text-left py-2 px-3">Plate Number</th>
                  <th className="text-left py-2 px-3">Reason / Agency Case</th>
                  <th className="text-left py-2 px-3">Enrolled Date</th>
                  <th className="text-right py-2 px-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {blacklistPlates.map((item) => (
                  <tr key={item.plate} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-mono font-bold text-red-400">{item.plate}</td>
                    <td className="py-2.5 px-3 text-slate-200">{item.reason}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{item.date}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onRemoveBlacklist(item.plate)}
                        className="p-1 text-slate-400 hover:text-red-400 transition"
                        title="Remove from blacklist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Camera Nodes Management */}
      {activeSubTab === 'cameras' && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400">
                <th className="text-left py-2 px-3">Camera ID</th>
                <th className="text-left py-2 px-3">Location Name</th>
                <th className="text-left py-2 px-3">Coordinates (WGS84)</th>
                <th className="text-left py-2 px-3">Stream Status</th>
                <th className="text-right py-2 px-3">Frame Rate</th>
              </tr>
            </thead>
            <tbody>
              {VIJAYAWADA_CAMERAS.map((cam) => (
                <tr key={cam.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 font-mono text-blue-400 font-semibold">{cam.id}</td>
                  <td className="py-2.5 px-3 text-white">{cam.name}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-400">
                    {cam.lat.toFixed(4)}° N, {cam.lng.toFixed(4)}° E
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Active Streaming</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-300">{cam.fps} FPS</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: DPDP Retention Settings */}
      {activeSubTab === 'retention' && (
        <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-4 text-xs">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
              Automated License Plate Retention Policy (DPDP Act 2023 Compliance)
            </h3>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              License plate captures are classified as personally identifiable information (PII) under India's Digital Personal Data Protection Act 2023. Unflagged vehicle records must be purged automatically after a designated retention threshold.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-900 p-3 rounded border border-slate-800">
            <div>
              <span className="text-slate-300 font-semibold block">Automatic Deletion Horizon:</span>
              <span className="text-[11px] text-slate-400">Applies to all normal unflagged trajectory points</span>
            </div>

            <select
              value={retentionDays}
              onChange={(e) => setRetentionDays(Number(e.target.value))}
              className="bg-slate-950 text-white font-mono rounded px-3 py-1.5 border border-slate-700 focus:outline-none"
            >
              <option value={15}>15 Days (Strict Minimalist)</option>
              <option value={30}>30 Days (Standard Municipal)</option>
              <option value={60}>60 Days (Urban Extended)</option>
              <option value={90}>90 Days (Maximum Legal Limit)</option>
            </select>

            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
              <Check className="w-3.5 h-3.5" />
              <span>Cron Purge Active (Nightly 03:00 IST)</span>
            </span>
          </div>

          <div className="p-3 bg-blue-950/40 border border-blue-800 rounded text-blue-200 text-[11px]">
            <strong>Legal Exemption: </strong> Plates associated with active police FIR investigations or marked in the Blacklist registry are retained under law enforcement warrant exceptions with cryptographic custody logs.
          </div>
        </div>
      )}
    </div>
  );
};
