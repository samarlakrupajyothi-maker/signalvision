import React from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  Search, 
  BarChart3, 
  Cpu, 
  Network, 
  ShieldCheck, 
  FileLock2,
  Sliders,
  Scale
} from 'lucide-react';
import { Language, TRANSLATIONS } from '../constants/i18n';

export type ActiveTab = 
  | 'dashboard' 
  | 'map' 
  | 'trajectory' 
  | 'analytics' 
  | 'models' 
  | 'architecture' 
  | 'admin' 
  | 'privacy';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  language: Language;
  onOpenWhatIf: () => void;
  onOpenSettings: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  language,
  onOpenWhatIf,
  onOpenSettings,
}) => {
  const t = TRANSLATIONS[language];

  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'map', label: t.cityMap, icon: MapPin },
    { id: 'trajectory', label: t.trajectorySearch, icon: Search },
    { id: 'analytics', label: t.analytics, icon: BarChart3 },
    { id: 'models', label: t.models, icon: Cpu },
    { id: 'architecture', label: t.architecture, icon: Network },
    { id: 'admin', label: t.admin, icon: ShieldCheck },
    { id: 'privacy', label: t.privacy, icon: FileLock2 },
  ];

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 text-xs px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto scrollbar-none py-1.5 gap-2">
        <nav className="flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-600/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quick action buttons on nav bar */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={onOpenWhatIf}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-sm font-medium transition"
            title="Open Webster What-If Simulation Comparison"
          >
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{t.whatIfComparison}</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-sm font-medium transition"
            title="Edit PCU weights and timing rules"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
