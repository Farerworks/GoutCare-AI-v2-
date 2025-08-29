
import React from 'react';

interface GaugeProps {
  value: number;
  max?: number;
  label: string;
}

const getRiskLevelStyles = (value: number, max: number) => {
    const percentage = (value / max) * 100;
    if (percentage < 40) {
        return {
            text: 'text-green-600 dark:text-green-400',
            stroke: 'stroke-green-500',
        };
    }
    if (percentage < 75) {
        return {
            text: 'text-yellow-600 dark:text-yellow-400',
            stroke: 'stroke-yellow-500',
        };
    }
    return {
        text: 'text-red-600 dark:text-red-400',
        stroke: 'stroke-red-500',
    };
};


const Gauge: React.FC<GaugeProps> = ({ value, max = 100, label }) => {
  const styles = getRiskLevelStyles(value, max);
  const clampedValue = Math.min(Math.max(value, 0), max);
  const circumference = 2 * Math.PI * 40; // r = 40
  const strokeDashoffset = circumference - (clampedValue / max) * circumference;

  return (
    <div className="relative flex items-center justify-center w-40 h-40">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          className="stroke-slate-200 dark:stroke-slate-700"
          cx="50"
          cy="50"
          r="40"
          strokeWidth="10"
          fill="transparent"
        />
        <circle
          className={styles.stroke}
          cx="50"
          cy="50"
          r="40"
          strokeWidth="10"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-4xl font-bold ${styles.text}`}>{value}</span>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</span>
      </div>
    </div>
  );
};

export default Gauge;
