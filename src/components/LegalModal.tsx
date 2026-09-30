import React from 'react';
import { X, ShieldCheck, FileLock2, Scale } from 'lucide-react';

interface LegalModalProps {
  type: 'privacy' | 'terms' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-md max-w-2xl w-full p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800">
          {type === 'privacy' ? (
            <FileLock2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <Scale className="w-5 h-5 text-blue-400" />
          )}
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            {type === 'privacy'
              ? 'Privacy Policy & DPDP Act 2023 Compliance Declaration'
              : 'Terms & Conditions of Operational Deployment'}
          </h2>
        </div>

        <div className="text-xs text-slate-300 space-y-4 overflow-y-auto pr-2 leading-relaxed">
          {type === 'privacy' ? (
            <>
              <div className="bg-slate-950 p-3 rounded border border-slate-800 text-[11px] text-amber-300">
                Notice: In this public demonstration deployment, all license plate registrations, vehicle trajectories, and timestamps are synthetic algorithmic samples. No actual citizen records or personal surveillance data are stored or exposed.
              </div>

              <div>
                <h4 className="text-xs font-bold text-white uppercase mb-1">
                  1. Statutory Context: India's DPDP Act 2023
                </h4>
                <p>
                  Automatic Number Plate Recognition (ANPR) records, when correlated across urban intersections, can reveal individual travel patterns and routines. Under India's Digital Personal Data Protection (DPDP) Act 2023 and the landmark Puttaswamy judgment, license plate data constitutes digital personal data requiring strict legal authorization, purpose limitation, and storage safeguards.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white uppercase mb-1">
                  2. Client-Side Video Processing (Mode B)
                </h4>
                <p>
                  Any video uploaded or streamed via webcam in Mode B is processed entirely in your web browser utilizing WebGPU or WebAssembly. Neither the raw video streams, cropped license plate images, nor detection metadata are transmitted to external servers. Closing the browser tab irreversibly releases all video memory.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white uppercase mb-1">
                  3. Production Safeguards & Tamper-Evident Audit Logging
                </h4>
                <p>
                  For real-world municipal or police deployment:
                  <br />• Role-Based Access Control (RBAC): Only authorized operators with documented case warrants can perform targeted license plate lookups.
                  <br />• Tamper-Evident Logs: Every lookup, trajectory reconstruction, and data export is immutably logged with timestamp, user ID, IP address, and legal authorization reference.
                  <br />• Automated Data Purging: Routine trajectory points are purged after the statutory retention horizon (default 30 days).
                  <br />• Encryption: AES-256 for data at rest and TLS 1.3 for data in transit.
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <h4 className="text-xs font-bold text-white uppercase mb-1">
                  1. Smart India Hackathon Scope
                </h4>
                <p>
                  This software platform has been engineered for Smart India Hackathon, Problem Statement 26127 (Bharat Electronics Limited, Theme: Smart Automation, Category: Software). It is provided for evaluation, prototyping, and smart city infrastructure validation.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white uppercase mb-1">
                  2. Open Source Licensing & Model Attribution
                </h4>
                <p>
                  • Ultralytics YOLOv8 is distributed under the GNU Affero General Public License v3.0 (AGPL-3.0). Any public network hosting requires corresponding source code disclosure.
                  <br />• Apache-2.0 alternatives (YOLOX-Nano, PaddleOCR) and MIT libraries (ByteTrack) are provided as drop-in replacements for proprietary or classified defense deployments.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white uppercase mb-1">
                  3. Disclaimer on Model Accuracy & Automated Signals
                </h4>
                <p>
                  Traffic signal recommendations derived via Webster's method C0 = (1.5L + 5) / (1 - Y) must be validated against Indian Road Congress (IRC) safety clearances before physical traffic controller interlocking. Emergency preemption logic prioritizes ambulances and protected pedestrian intervals under all operational states.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-sm transition"
          >
            I Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};
