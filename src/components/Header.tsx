import React from 'react';
import { 
  ShieldAlert, 
  Clock, 
  HelpCircle, 
  Globe, 
  UserCheck, 
  Camera, 
  Sliders, 
  Radio, 
  FileSpreadsheet, 
  FileText,
  AlertTriangle
} from 'lucide-react';
import { Language, TRANSLATIONS } from '../constants/i18n';

interface HeaderProps {
  currentMode: 'A' | 'B' | 'C';
  onModeChange: (mode: 'A' | 'B' | 'C') => void;
  userRole: 'Public' | 'Operator' | 'Admin';
  onRoleChange: (role: 'Public' | 'Operator' | 'Admin') => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenSettings: () => void;
  onOpenWhatIf: () => void;
  onStartTour: () => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
  emergencyActiveLane: string | { lane: string; type: 'ambulance' | 'fire_engine' | 'vip' | 'blocked' } | null;
  activeRule: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onModeChange,
  userRole,
  onRoleChange,
  language,
  onLanguageChange,
  onOpenSettings,
  onOpenWhatIf,
  onStartTour,
  onExportCSV,
  onExportPDF,
  emergencyActiveLane,
  activeRule,
}) => {
  const [currentTime, setCurrentTime] = React.useState<string>('');
  const t = TRANSLATIONS[language];

  // Helper to extract emergency info
  const emgInfo = React.useMemo(() => {
    if (!emergencyActiveLane) return null;
    if (typeof emergencyActiveLane === 'string') {
      return { lane: emergencyActiveLane, type: 'ambulance' as const, label: `AMBULANCE LANE ${emergencyActiveLane}` };
    }
    const { lane, type } = emergencyActiveLane;
    if (type === 'fire_engine') return { lane, type, label: `🔥 FIRE FIGHTER LANE ${lane}` };
    if (type === 'vip') return { lane, type, label: `👑 VIP GOVT CONVOY LANE ${lane}` };
    if (type === 'blocked') return { lane, type, label: `🛑 BLOCKED CAR IN LANE ${lane}` };
    return { lane, type, label: `🚑 AMBULANCE LANE ${lane}` };
  }, [emergencyActiveLane]);

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="relative bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40">
      {/* Top Banner with branding, mode switch, role and emergency alert */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* App Title & SIH Tag */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-blue-700 border border-blue-500 rounded-md flex items-center justify-center font-bold text-white tracking-wider text-base shadow-sm">
            SV
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight text-white">
                {t.appTitle}
              </h1>
              <span className="text-xs bg-slate-800 text-blue-300 border border-slate-700 px-1.5 py-0.5 rounded font-mono">
                SIH PS-26127 (BEL)
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Center: Mode Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-md border border-slate-800 text-xs">
          <button
            onClick={() => onModeChange('A')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              currentMode === 'A'
                ? 'bg-blue-700 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Mode A: 4-Way Sim
          </button>
          <button
            onClick={() => onModeChange('B')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              currentMode === 'B'
                ? 'bg-blue-700 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Mode B: Video/Webcam
          </button>
          <button
            onClick={() => onModeChange('C')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              currentMode === 'C'
                ? 'bg-blue-700 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Mode C: Server Pipeline
          </button>
        </div>

        {/* Right Section: Time, Role Switch, Language, Actions, and Emergency Badge */}
        <div className="flex items-center gap-2.5">
          {/* Live Clock */}
          <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-slate-300 bg-slate-950 px-2 py-1 rounded border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>{currentTime || '00:00:00 IST'}</span>
          </div>

          {/* User Role Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
            <select
              value={userRole}
              onChange={(e) => onRoleChange(e.target.value as any)}
              className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer py-0.5"
              title="Switch user perspective"
            >
              <option value="Public" className="bg-slate-900 text-slate-200">Public Viewer</option>
              <option value="Operator" className="bg-slate-900 text-slate-200">Operator</option>
              <option value="Admin" className="bg-slate-900 text-slate-200">Admin</option>
            </select>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-xs">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as Language)}
              className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer py-0.5"
              title="Select interface language"
            >
              <option value="en" className="bg-slate-900 text-slate-200">EN (English)</option>
              <option value="te" className="bg-slate-900 text-slate-200">TE (తెలుగు)</option>
              <option value="hi" className="bg-slate-900 text-slate-200">HI (हिन्दी)</option>
            </select>
          </div>

          {/* Tour Help */}
          <button
            onClick={onStartTour}
            className="p-1 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded hover:border-slate-700 transition"
            title="Start Guided Tour"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Emergency / Government Priority Badge (Fixed slot in header, does NOT cover panels) */}
          {emgInfo ? (
            <div className={`flex items-center gap-1.5 border px-2.5 py-1 rounded text-xs font-semibold animate-pulse ${
              emgInfo.type === 'fire_engine'
                ? 'bg-red-950 border-red-500 text-red-200'
                : emgInfo.type === 'vip'
                ? 'bg-amber-950 border-amber-500 text-amber-200'
                : emgInfo.type === 'blocked'
                ? 'bg-purple-950 border-purple-500 text-purple-200'
                : 'bg-rose-950 border-rose-500 text-rose-200'
            }`}>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{emgInfo.label}</span>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-950 border border-slate-800 text-slate-400 text-xs px-2 py-1 rounded">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[11px] truncate max-w-[170px]" title={activeRule}>
                {activeRule}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
