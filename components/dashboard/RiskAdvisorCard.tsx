import React from 'react';
import Card from '../common/Card';
import Spinner from '../common/Spinner';
import { ArrowPathIcon } from '../Icons';
import { useI18n } from '../../hooks/useI18n';

interface RiskAdvisorCardProps {
    risk: string;
    summary: string;
    forecast: string;
    isLoading: boolean;
    onRefresh: () => void;
}

const getRiskLevelStyles = (level: string) => {
    switch (level) {
        case 'Low': return {
            text: 'text-green-600 dark:text-green-400',
            border: 'border-green-500',
            bg: 'bg-green-50 dark:bg-green-900/50',
            gradient: 'from-green-50 to-green-100 dark:from-green-900/50 dark:to-green-900/70',
        };
        case 'Moderate': return {
            text: 'text-yellow-600 dark:text-yellow-400',
            border: 'border-yellow-500',
            bg: 'bg-yellow-50 dark:bg-yellow-900/50',
            gradient: 'from-yellow-50 to-yellow-100 dark:from-yellow-900/50 dark:to-yellow-900/70',
        };
        case 'High': return {
            text: 'text-red-600 dark:text-red-400',
            border: 'border-red-500',
            bg: 'bg-red-50 dark:bg-red-900/50',
            gradient: 'from-red-50 to-red-100 dark:from-red-900/50 dark:to-red-900/70',
        };
        case 'Error':
        case 'Quota Exceeded': return {
             text: 'text-orange-600 dark:text-orange-400',
            border: 'border-orange-500',
            bg: 'bg-orange-50 dark:bg-orange-900/50',
            gradient: 'from-orange-50 to-orange-100 dark:from-orange-900/50 dark:to-orange-900/70',
        }
        default: return {
            text: 'text-slate-600 dark:text-slate-400',
            border: 'border-slate-500',
            bg: 'bg-slate-50 dark:bg-slate-700',
            gradient: 'from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/70',
        };
    }
};

const RiskAdvisorCard: React.FC<RiskAdvisorCardProps> = ({ risk, summary, forecast, isLoading, onRefresh }) => {
    const { t } = useI18n();
    const styles = getRiskLevelStyles(risk);
    
    const riskLabels: Record<string, string> = {
        Low: t('riskLevels.low'),
        Moderate: t('riskLevels.moderate'),
        High: t('riskLevels.high'),
    };

    const displayRisk = riskLabels[risk] || risk;

    return (
        <Card className={`bg-gradient-to-br ${styles.gradient}`}>
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t('dashboard.riskAdvisor.title')}</h2>
                <button 
                    onClick={onRefresh} 
                    disabled={isLoading} 
                    className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={t('dashboard.riskAdvisor.refresh')}
                >
                    {isLoading ? <Spinner /> : <ArrowPathIcon className="w-5 h-5"/>}
                </button>
            </div>
             {isLoading && risk === '' ? ( // Initial loading state
                <div className="flex justify-center items-center h-24">
                    <Spinner />
                </div>
             ) : (
                <div className="text-center">
                    <p className={`text-3xl font-bold ${styles.text}`}>{displayRisk}</p>
                    <p className="font-semibold mt-2 text-slate-700 dark:text-slate-300">{summary}</p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{forecast}</p>
                </div>
             )}
        </Card>
    );
};

export default RiskAdvisorCard;