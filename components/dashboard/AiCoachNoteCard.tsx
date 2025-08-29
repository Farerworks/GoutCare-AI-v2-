import React from 'react';
import Card from '../common/Card';
import { LightbulbIcon } from '../Icons';
import { useI18n } from '../../hooks/useI18n';

interface AiCoachNoteCardProps {
    note?: string | null;
    isLoading: boolean;
}

const AiCoachNoteCard: React.FC<AiCoachNoteCardProps> = ({ note, isLoading }) => {
    const { t } = useI18n();
    if (isLoading) {
        return (
            <Card className="bg-slate-100 dark:bg-slate-800 animate-pulse">
                <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 mr-3"></div>
                    <div>
                        <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded-md mb-2"></div>
                        <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                    </div>
                </div>
            </Card>
        );
    }

    if (!note) {
        return null;
    }

    return (
        <Card className="bg-sky-50 dark:bg-sky-900/50 border-l-4 border-sky-400">
            <div className="flex items-start">
                <LightbulbIcon className="w-8 h-8 text-sky-500 mr-3 flex-shrink-0" />
                <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t('dashboard.aiCoachNote.title')}</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{note}</p>
                </div>
            </div>
        </Card>
    );
};

export default AiCoachNoteCard;