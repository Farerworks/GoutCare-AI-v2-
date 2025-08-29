import React, { useMemo } from 'react';
import type { LogEntry, Preferences, MedicationData, PurineIntakeData, WellnessData, SymptomData, HydrationData, AlcoholData } from '../../types';
import Card from '../common/Card';
import { TrashIcon, BookOpenIcon } from '../Icons';
import { formatFluid, formatWeight } from '../../utils/units';
import { getLogIcon } from '../../utils/logUtils';
import { useI18n } from '../../hooks/useI18n';

interface RecentLogsCardProps {
    logs: LogEntry[];
    preferences: Preferences;
    onDeleteLog: (id: string) => void;
}

const LogItem: React.FC<{ log: LogEntry; preferences: Preferences; onDelete: (id: string) => void }> = ({ log, preferences, onDelete }) => {
    const { t, locale } = useI18n();
    const time = new Date(log.timestamp).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: true });

    const renderLogContent = () => {
        let content = '';
        switch (log.type) {
            case 'symptom': {
                const data = log.data as SymptomData;
                content = t('dashboard.recentLogs.symptom', { location: data.location, painLevel: data.painLevel });
                break;
            }
            case 'medication': {
                const data = log.data as MedicationData;
                let medInfo = data.name;
                if (data.dosage) medInfo += ` (${data.dosage}${data.unit || ''})`;
                content = t('dashboard.recentLogs.medication', { medInfo });
                break;
            }
            case 'purine_intake': {
                const data = log.data as PurineIntakeData;
                content = t('dashboard.recentLogs.purineIntake', { mealName: data.mealName, score: data.totalPurineScore });
                break;
            }
            case 'hydration': {
                const data = log.data as HydrationData;
                content = t('dashboard.recentLogs.hydration', { amount: formatFluid(data.amount, preferences.fluidUnit) });
                break;
            }
            case 'alcohol': {
                const data = log.data as AlcoholData;
                content = t('dashboard.recentLogs.alcohol', { type: data.type, amount: formatFluid(data.amount, preferences.fluidUnit) });
                break;
            }
            case 'wellness': {
                const data = log.data as WellnessData;
                const parts = [];
                if (data.weight) parts.push(t('dashboard.recentLogs.wellnessWeight', { weight: formatWeight(data.weight, preferences.weightUnit) }));
                if (data.sleepHours) parts.push(t('dashboard.recentLogs.wellnessSleep', { hours: data.sleepHours }));
                if (data.stressLevel) parts.push(t('dashboard.recentLogs.wellnessStress', { level: data.stressLevel }));
                if (data.activity) parts.push(t('dashboard.recentLogs.wellnessActivity'));
                if (data.notes) parts.push(t('dashboard.recentLogs.wellnessNote'));
                content = t('dashboard.recentLogs.wellness', { parts: parts.join(', ') });
                break;
            }
            default:
                content = t('dashboard.recentLogs.unknown');
        }
        return <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{content}</p>;
    };

    return (
        <li className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50">
            <div className="flex items-center overflow-hidden">
                <div className="flex-shrink-0 mr-3">{getLogIcon(log.type, "w-5 h-5")}</div>
                <div className="flex-grow overflow-hidden">
                    {renderLogContent()}
                    <p className="text-xs text-slate-500 dark:text-slate-400">{time}</p>
                </div>
            </div>
            <button onClick={() => onDelete(log.id)} className="flex-shrink-0 p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400">
                <TrashIcon className="w-4 h-4" />
            </button>
        </li>
    );
};


const RecentLogsCard: React.FC<RecentLogsCardProps> = ({ logs, preferences, onDeleteLog }) => {
    const { t } = useI18n();
    const todayLogs = useMemo(() => {
        const today = new Date().toDateString();
        return logs.filter(log => new Date(log.timestamp).toDateString() === today);
    }, [logs]);

    return (
        <Card>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{t('dashboard.recentLogs.title')}</h2>
            {todayLogs.length > 0 ? (
                <ul className="divide-y divide-slate-100 dark:divide-slate-700/50 -mx-3">
                    {todayLogs.slice(0, 5).map(log => (
                        <LogItem key={log.id} log={log} preferences={preferences} onDelete={onDeleteLog} />
                    ))}
                </ul>
            ) : (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <BookOpenIcon className="w-10 h-10 mx-auto mb-2" />
                    <p>{t('dashboard.recentLogs.noLogs')}</p>
                </div>
            )}
        </Card>
    );
};

export default RecentLogsCard;