import React from 'react';
import type { ActiveView } from '../types';
import { GoutIcon, HomeIcon, CalendarIcon, ChatBubbleIcon, BeakerIcon, ChartBarIcon } from './Icons';
import { useI18n } from '../hooks/useI18n';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const { t } = useI18n();
  const navItems = [
    { id: 'dashboard', label: t('nav.home'), icon: <HomeIcon className="w-5 h-5" /> },
    { id: 'calendar', label: t('nav.logs'), icon: <CalendarIcon className="w-5 h-5" /> },
    { id: 'food', label: t('nav.foodLab'), icon: <BeakerIcon className="w-5 h-5" /> },
    { id: 'report', label: t('nav.report'), icon: <ChartBarIcon className="w-5 h-5" /> },
    { id: 'chat', label: t('nav.assistant'), icon: <ChatBubbleIcon className="w-5 h-5" /> },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex-shrink-0">
      <div className="flex items-center space-x-3 h-16 px-4 border-b border-slate-200 dark:border-slate-700">
        <GoutIcon />
        <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <span>GoutCare AI</span>
          <span className="text-sm font-semibold bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300 px-2 py-0.5 rounded-full">v3</span>
        </h1>
      </div>
      <nav className="flex-grow p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveView(item.id as ActiveView)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded-lg text-left transition-colors duration-200 ${
                    isActive
                      ? 'bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;