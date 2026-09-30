import React from 'react';
import { Check, ChevronRight, X, Sparkles } from 'lucide-react';

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = React.useState<number>(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Welcome to Signal Vision (SIH PS 26127 - BEL)',
      subtitle: 'Smart Automation for City-Wide Traffic & ANPR Intelligence',
      body: 'Urban traffic cameras are often siloed. Signal Vision unifies multi-camera feeds with automated vehicle tracking, Webster adaptive traffic signal calculation, and cross-camera trajectory reconstruction.',
      highlight: 'Every screen answers one direct question in plain words.',
    },
    {
      title: 'Three Operational Modes (Free Hosting Ready)',
      subtitle: 'Client-first architecture that works anywhere',
      body: '• Mode A (Default): 60 fps 4-way junction simulation with realistic Indian vehicles, pedestrians, and queue dynamics.\n• Mode B: Test with your own video clip or webcam entirely inside the browser without uploading.\n• Mode C: Full server pipeline specification with RTSP streaming, Redis Streams, and PostGIS.',
      highlight: 'No expensive GPU server required for public evaluation.',
    },
    {
      title: 'Webster Adaptive Signal Timing & Emergency Priority',
      subtitle: 'Real traffic formulas, not simple timers',
      body: 'Signals adapt automatically using Webster\'s formula: C0 = (1.5L + 5) / (1 - Y) based on measured Passenger Car Units (PCU). Ambulances trigger instant safe yellow clearance and get green until cleared. Pedestrians cross only during dedicated WALK intervals.',
      highlight: 'Test "What-If" to measure real delay reductions.',
    },
    {
      title: 'ANPR Trajectory & DPDP Act 2023 Compliance',
      subtitle: 'Trace vehicle movement with privacy by design',
      body: 'Search any simulated Indian license plate to see its time-ordered path across Vijayawada junctions. The system flags route anomalies (impossible travel times) and maintains a tamper-evident audit log adhering to India\'s DPDP Act 2023.',
      highlight: 'Personal data is protected and automatically deleted.',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      localStorage.setItem('signal_vision_tour_completed', 'true');
      onClose();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('signal_vision_tour_completed', 'true');
    onClose();
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-md max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-1.5 mb-4">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-xs transition-all ${
                idx === currentStep ? 'w-8 bg-blue-500' : 'w-3 bg-slate-700'
              }`}
            />
          ))}
          <span className="text-xs text-slate-400 ml-2 font-mono">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>

        <h3 className="text-lg font-bold text-white mb-1">
          {step.title}
        </h3>
        <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">
          {step.subtitle}
        </h4>

        <div className="text-sm text-slate-300 whitespace-pre-line leading-relaxed mb-4">
          {step.body}
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded p-2.5 mb-6 text-xs text-amber-300 font-medium">
          Key Principle: {step.highlight}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            onClick={handleSkip}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Skip Tour
          </button>
          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-md transition"
          >
            {currentStep === steps.length - 1 ? (
              <>
                <span>Get Started</span>
                <Check className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
