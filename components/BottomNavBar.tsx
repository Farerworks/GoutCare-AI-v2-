import React from 'react';
import type { ActiveView } from '../types';
import { HomeIcon, CalendarIcon, ChatBubbleIcon, BeakerIcon, ChartBarIcon } from './Icons';
import { useI18n } from '../hooks/useI18n';

interface BottomNavBarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeView, setActiveView }) => {
  const { t } = useI18n();
  const navItems = [
    { id: 'dashboard', label: t('nav.home'), icon: <HomeIcon className="w-6 h-6 mb-1" /> },
    { id: 'calendar', label: t('nav.logs'), icon: <CalendarIcon className="w-6 h-6 mb-1" /> },
    { id: 'food', label: t('nav.foodLab'), icon: <BeakerIcon className="w-6 h-6 mb-1" /> },
    { id: 'report', label: t('nav.report'), icon: <ChartBarIcon className="w-6 h-6 mb-1" /> },
    { id: 'chat', label: t('nav.assistant'), icon: <ChatBubbleIcon className="w-6 h-6 mb-1" /> },
  ];

  return (
    <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-t-md z-20">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as ActiveView)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center text-xs font-medium w-full h-full transition-colors duration-200 ${
                isActive
                  ? 'text-sky-600 dark:text-sky-500'
                  : 'text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-500'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </footer>
  );
};

export default BottomNavBar;