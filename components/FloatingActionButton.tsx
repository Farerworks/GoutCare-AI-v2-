import React from 'react';
import { PlusIcon } from './Icons';

interface FloatingActionButtonProps {
  onClick: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-5 md:bottom-6 md:right-6 z-40 h-16 w-16 rounded-full bg-sky-600 text-white shadow-lg hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 flex items-center justify-center transition-transform duration-200 ease-in-out active:scale-95"
      aria-label="Add new log"
    >
      <PlusIcon className="w-8 h-8" strokeWidth={2.5} />
    </button>
  );
};

export default FloatingActionButton;