import React, { useState } from 'react';
import { X, Sliders, RotateCcw, Check, HelpCircle } from 'lucide-react';
import { VehicleType } from '../types/traffic';
import { DEFAULT_PCU_WEIGHTS, PCU_DESCRIPTIONS } from '../constants/pcu';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pcuWeights: Record<VehicleType, number>;
  onSaveWeights: (newWeights: Record<VehicleType, number>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  pcuWeights,
  onSaveWeights,
}) => {
  const [weights, setWeights] = useState<Record<VehicleType, number>>({ ...pcuWeights });

  if (!isOpen) return null;

  const handleChange = (type: VehicleType, val: number) => {
    setWeights((prev) => ({
      ...prev,
      [type]: Math.max(0.1, Number(val)),
    }));
  };

  const handleReset = () => {
    setWeights({ ...DEFAULT_PCU_WEIGHTS });
  };

  const handleSave = () => {
    onSaveWeights(weights);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-md max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Sliders className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            Passenger Car Units (PCU) Weight Table
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Modify IRC equivalent weights dynamically. Webster signal timings recalculate instantly from these parameters.
        </p>

        {/* Weights Form Table */}
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {(Object.keys(weights) as VehicleType[]).map((type) => (
            <div
              key={type}
              className="flex items-center justify-between p-2 bg-slate-950 rounded border border-slate-800 text-xs"
            >
              <div>
                <strong className="text-slate-200 capitalize">{type}</strong>
                <span className="block text-[10px] text-slate-400">
                  {PCU_DESCRIPTIONS[type]}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10.0"
                  value={weights[type]}
                  onChange={(e) => handleChange(type, parseFloat(e.target.value) || 1.0)}
                  className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono text-white text-xs focus:outline-none focus:border-blue-500"
                />
                <span className="text-[11px] text-slate-400 font-mono">PCU</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-sm transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset IRC Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white text-xs rounded-sm transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-sm transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save & Apply</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
