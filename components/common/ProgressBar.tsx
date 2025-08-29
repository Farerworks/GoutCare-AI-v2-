
import React from 'react';
import { formatFluid } from '../../utils/units';

interface ProgressBarProps {
  value: number;
  max: number;
  colorClass: string;
  label: string;
  currentValue: string;
  goalValue: string;
  unit?: 'ml' | 'oz';
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, max, colorClass, label, currentValue, goalValue, unit }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  
  const displayCurrent = unit ? formatFluid(parseFloat(currentValue), unit) : currentValue;
  const displayGoal = unit ? formatFluid(parseFloat(goalValue), unit) : goalValue;

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">{displayCurrent} / {displayGoal}</span>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
        <div className={`${colorClass} h-2.5 rounded-full`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
      </div>
    </div>
  );
};

export default ProgressBar;
