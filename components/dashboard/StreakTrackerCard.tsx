import React, { useMemo } from 'react';
import type { LogEntry } from '../../types';
import Card from '../common/Card';
import { FlameIcon } from '../Icons';
import { useI18n } from '../../hooks/useI18n';

interface StreakTrackerCardProps {
    logs: LogEntry[];
}

const calculateStreak = (logs: LogEntry[]): number => {
    if (logs.length === 0) return 0;

    const toISODateString = (date: Date) => date.toISOString().split('T')[0];
    
    const logISODates = new Set(
        logs.map(log => toISODateString(new Date(log.timestamp)))
    );

    if (logISODates.size === 0) return 0;

    let currentStreak = 0;
    let checkDate = new Date();
    
    // If there is no log for today, check starting from yesterday.
    if (!logISODates.has(toISODateString(checkDate))) {
        checkDate.setDate(checkDate.getDate() - 1);
    }

    while (logISODates.has(toISODateString(checkDate))) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
    }
    
    return currentStreak;
};


const StreakTrackerCard: React.FC<StreakTrackerCardProps> = ({ logs }) => {
    const { t } = useI18n();
    const streak = useMemo(() => calculateStreak(logs), [logs]);

    if (streak === 0) {
        return null; // Don't show the card if there's no streak
    }

    return (
        <Card className="bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-900/50 dark:to-orange-900/70">
            <div className="flex items-center">
                <FlameIcon className="w-12 h-12 text-orange-500 mr-4" />
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t('dashboard.streak.title', { count: streak })}</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{t('dashboard.streak.subtitle')}</p>
                </div>
            </div>
        </Card>
    );
};

export default StreakTrackerCard;