
import React from 'react';

const Spinner: React.FC = () => {
  return (
    <div className="flex items-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-slate-500 dark:bg-slate-400 animate-pulse [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 rounded-full bg-slate-500 dark:bg-slate-400 animate-pulse [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 rounded-full bg-slate-500 dark:bg-slate-400 animate-pulse"></div>
    </div>
  );
};

export default Spinner;
