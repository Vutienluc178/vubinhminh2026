import React from 'react';
import { AppStep } from '../types';

interface ProgressBarProps {
  currentStep: AppStep;
}

const steps: { key: AppStep; label: string; index: number }[] = [
  { key: 'INPUT', label: '1. Nhập Đề', index: 0 },
  { key: 'ANALYSIS', label: '2. Phân Tích', index: 1 },
  { key: 'CONFIG', label: '3. Cấu Hình', index: 2 },
  { key: 'GENERATION', label: '4. Xử Lý AI', index: 3 },
  { key: 'RESULT', label: '5. Kết Quả', index: 4 },
];

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep }) => {
  const currentIndex = steps.find(s => s.key === currentStep)?.index || 0;

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative max-w-4xl mx-auto px-4">
        {/* Connection Line */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-slate-200 -z-10" />
        <div 
          className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-indigo-600 -z-10 transition-all duration-500" 
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step) => {
          const isActive = step.index <= currentIndex;
          const isCurrent = step.key === currentStep;

          return (
            <div key={step.key} className="flex flex-col items-center bg-white p-2 rounded-lg">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
                  ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}
                  ${isCurrent ? 'ring-4 ring-indigo-100 scale-110' : ''}
                `}
              >
                {step.index + 1}
              </div>
              <span className={`mt-2 text-xs font-medium ${isActive ? 'text-indigo-700' : 'text-slate-400'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
