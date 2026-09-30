import React from 'react';
import { ActiveTab } from './Navigation';
import { ShieldCheck, Cpu, Network, FileLock2, Scale } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: ActiveTab) => void;
  onOpenLegal: (type: 'privacy' | 'terms') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenLegal }) => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-xs py-5 px-4 mt-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Attribution & SIH info */}
        <div>
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <span>Signal Vision: ANPR Trajectory & Traffic Intelligence Platform</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Smart India Hackathon • Problem Statement 26127 (Bharat Electronics Limited • Theme: Smart Automation • Category: Software)
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <button
            onClick={() => onNavigate('dashboard')}
            className="hover:text-slate-200 transition"
          >
            Dashboard
          </button>
          <button
            onClick={() => onNavigate('map')}
            className="hover:text-slate-200 transition"
          >
            City Map
          </button>
          <button
            onClick={() => onNavigate('models')}
            className="hover:text-slate-200 transition"
          >
            AI Models & Licences
          </button>
          <button
            onClick={() => onNavigate('architecture')}
            className="hover:text-slate-200 transition"
          >
            Architecture & Workflow
          </button>
          <button
            onClick={() => onOpenLegal('privacy')}
            className="hover:text-slate-200 text-emerald-400 transition"
          >
            Privacy Policy (DPDP Act)
          </button>
          <button
            onClick={() => onOpenLegal('terms')}
            className="hover:text-slate-200 transition"
          >
            Terms of Use
          </button>
        </div>
      </div>
    </footer>
  );
};
