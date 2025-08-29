
import React, { useMemo } from 'react';
import type { LogEntry, Preferences, PurineIntakeData, HydrationData } from '../../types';
import Card from '../common/Card';
import ProgressBar from '../common/ProgressBar';
import { useI18n } from '../../hooks/useI18n';

interface DailySummaryCardProps {
  logs: LogEntry[];
  preferences: Preferences;
}

const DailySummaryCard: React.FC<DailySummaryCardProps> = ({ logs, preferences }) => {
  const { t } = useI18n();
  
  const todaySummary = useMemo(() => {
    const today = new Date().toDateString();
    const todayLogs = logs.filter(log => new Date(log.timestamp).toDateString() === today);

    const totalPurine = todayLogs
      .filter(log => log.type === 'purine_intake')
      .reduce((sum, log) => sum + (log.data as PurineIntakeData).totalPurineScore, 0);

    const totalFluid = todayLogs
      .filter(log => log.type === 'hydration')
      .reduce((sum, log) => sum + (log.data as HydrationData).amount, 0);
      
    return { totalPurine, totalFluid };
  }, [logs]);

  return (
    <Card>
      <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{t('dashboard.dailySummary.title')}</h2>
      <div className="space-y-4">
        <ProgressBar 
          value={todaySummary.totalPurine}
          max={preferences.dailyPurineGoal}
          colorClass="bg-yellow-500"
          label={t('dashboard.dailySummary.purineGoal')}
          currentValue={todaySummary.totalPurine.toFixed(0)}
          goalValue={preferences.dailyPurineGoal.toFixed(0)}
        />
        <ProgressBar
          value={todaySummary.totalFluid}
          max={preferences.dailyFluidGoal}
          colorClass="bg-sky-500"
          label={t('dashboard.dailySummary.hydrationGoal')}
          currentValue={todaySummary.totalFluid.toFixed(0)}
          goalValue={preferences.dailyFluidGoal.toFixed(0)}
          unit={preferences.fluidUnit}
        />
      </div>
    </Card>
  );
};

export default DailySummaryCard;
