

import React from 'react';
import type { LogEntry, Preferences, HealthReport } from '../types';
import Card from './common/Card';
import WelcomeGuide from './dashboard/WelcomeGuide';
import RiskAdvisorCard from './dashboard/RiskAdvisorCard';
import AiCoachNoteCard from './dashboard/AiCoachNoteCard';
import StreakTrackerCard from './dashboard/StreakTrackerCard';
import RecentLogsCard from './dashboard/RecentLogsCard';
import DailySummaryCard from './dashboard/DailySummaryCard';
import { useI18n } from '../hooks/useI18n';

interface DashboardPanelProps {
  logs: LogEntry[];
  preferences: Preferences;
  risk: string;
  summary: string;
  forecast: string;
  isLoadingForecast: boolean;
  onDeleteLog: (logId: string) => void;
  showWelcome: boolean;
  onDismissWelcome: () => void;
  healthReport: HealthReport | null;
  onRefreshForecast: () => void;
  coachingNote?: string | null;
  isLoadingCoachingNote: boolean;
}

const DashboardPanel: React.FC<DashboardPanelProps> = ({ 
    logs, 
    preferences, 
    risk, 
    summary, 
    forecast, 
    isLoadingForecast,
    onDeleteLog,
    showWelcome,
    onDismissWelcome,
    healthReport,
    onRefreshForecast,
    coachingNote,
    isLoadingCoachingNote
}) => {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      {showWelcome && <WelcomeGuide onDismiss={onDismissWelcome} />}
      <DailySummaryCard logs={logs} preferences={preferences} />
      <RiskAdvisorCard risk={risk} summary={summary} forecast={forecast} isLoading={isLoadingForecast} onRefresh={onRefreshForecast} />
      <AiCoachNoteCard note={coachingNote} isLoading={isLoadingCoachingNote} />
      <StreakTrackerCard logs={logs} />
      <RecentLogsCard logs={logs} preferences={preferences} onDeleteLog={onDeleteLog} />
       {healthReport && (
            <Card>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{t('dashboard.latestReportSummary')}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">{healthReport.overallSummary}</p>
            </Card>
       )}
    </div>
  );
};

export default DashboardPanel;
