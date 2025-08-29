
import React, { useState, useMemo } from 'react';
import type { LogEntry, HealthReport, Preferences, SymptomData, PurineIntakeData, HydrationData, WellnessData } from '../types';
import Button from './common/Button';
import Card from './common/Card';
import { SparklesIcon, ChartBarIcon, LightbulbIcon, CheckCircleIcon, ArrowPathIcon, TrendingUpIcon, TrendingDownIcon } from './Icons';
import { formatWeight } from '../utils/units';
import { useI18n } from '../hooks/useI18n';

// A simple Lottie-like loading animation using SVG/CSS
const AiAnalysisLoader: React.FC = () => {
    const { t } = useI18n();
    return (
    <div className="flex flex-col items-center justify-center text-center space-y-4">
        <div className="relative w-32 h-32">
            <svg className="absolute inset-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="4" className="text-sky-200/50 dark:text-sky-800/50" />
                <path d="M50 5 A 45 45 0 0 1 95 50" stroke="currentColor" strokeWidth="4" className="text-sky-500" strokeLinecap="round">
                    <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0 50 50"
                        to="360 50 50"
                        dur="1s"
                        repeatCount="indefinite"
                    />
                </path>
            </svg>
            <SparklesIcon className="absolute inset-0 m-auto w-12 h-12 text-sky-500 animate-pulse" />
        </div>
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">{t('report.loadingTitle')}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
            {t('report.loadingDescription')}
        </p>
    </div>
)};

const InitialState: React.FC<{ onGenerate: () => void, hasLogs: boolean }> = ({ onGenerate, hasLogs }) => {
    const { t } = useI18n();
    return (
    <Card>
        <div className="flex flex-col items-center justify-center text-center h-full p-6">
            <div className="w-24 h-24 bg-sky-100 dark:bg-sky-900/50 rounded-full flex items-center justify-center mb-6">
                <ChartBarIcon className="w-12 h-12 text-sky-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('report.initialTitle')}</h2>
            <p className="mt-2 mb-8 max-w-md text-slate-600 dark:text-slate-400">
                {t('report.initialDescription')}
            </p>
            <Button size="lg" onClick={onGenerate} disabled={!hasLogs}>
                <SparklesIcon className="w-6 h-6 mr-2" />
                {hasLogs ? t('report.generateButton') : t('report.notEnoughData')}
            </Button>
            {!hasLogs && <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">{t('report.notEnoughDataDescription')}</p>}
        </div>
    </Card>
)};

const ReportDisplay: React.FC<{ report: HealthReport }> = ({ report }) => {
    const { t } = useI18n();
    return (
        <div className="space-y-6">
             <Card className="bg-gradient-to-br from-sky-50 to-indigo-100 dark:from-slate-800 dark:to-slate-900">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">{t('report.overallSummary')}</h3>
                <p className="text-slate-600 dark:text-slate-400">{report.overallSummary}</p>
            </Card>

            <Card>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center">
                    <LightbulbIcon className="w-6 h-6 mr-2 text-yellow-500" />
                    {t('report.keyFindings')}
                </h3>
                <div className="space-y-4">
                    {report.keyFindings.map((item, index) => (
                        <div key={index} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 border-l-4 border-yellow-500">
                            <h4 className="font-bold text-slate-800 dark:text-slate-100">{item.title}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{item.finding}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">"{item.evidence}"</p>
                            <p className="text-sm text-sky-700 dark:text-sky-400 mt-3 font-semibold bg-sky-100 dark:bg-sky-900/50 p-2 rounded-md">{t('report.recommendation')}: {item.recommendation}</p>
                        </div>
                    ))}
                </div>
            </Card>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center">
                        <CheckCircleIcon className="w-6 h-6 mr-2 text-green-500" />
                        {t('report.positiveHabits')}
                    </h3>
                    <ul className="space-y-3">
                        {report.positiveHabits.map((item, index) => (
                           <li key={index} className="flex items-start">
                                <CheckCircleIcon className="w-5 h-5 mr-3 mt-1 text-green-500 flex-shrink-0" filled />
                                <div>
                                    <p className="font-semibold text-slate-700 dark:text-slate-200">{item.title}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>
                <Card>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center">
                        <ArrowPathIcon className="w-6 h-6 mr-2 text-indigo-500" />
                        {t('report.areasForImprovement')}
                    </h3>
                    <ul className="space-y-3">
                        {report.areasForImprovement.map((item, index) => (
                           <li key={index} className="flex items-start">
                                <ArrowPathIcon className="w-5 h-5 mr-3 mt-1 text-indigo-500 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-slate-700 dark:text-slate-200">{item.title}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
        </div>
    );
};


const TrendChartCard: React.FC<{ title: string; children: React.ReactNode; avgValue: string; trend: 'up' | 'down' | 'neutral' }> = ({ title, children, avgValue, trend }) => {
    const { t } = useI18n();
    const trendText = {
        up: t('report.trends.increasing'),
        down: t('report.trends.decreasing'),
        neutral: ''
    };
    return (
    <Card>
        <div className="flex justify-between items-start mb-2">
            <div>
                 <h4 className="font-bold text-slate-800 dark:text-slate-100">{title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('report.trends.periodAverage')}</p>
            </div>
            <div className="text-right">
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{avgValue}</p>
                {trend !== 'neutral' && (
                    <div className={`flex items-center justify-end text-xs font-semibold ${trend === 'up' ? 'text-red-500' : 'text-green-500'}`}>
                        {trend === 'up' ? <TrendingUpIcon className="w-4 h-4 mr-1" /> : <TrendingDownIcon className="w-4 h-4 mr-1" />}
                        <span>{trendText[trend]}</span>
                    </div>
                )}
            </div>
        </div>
        <div className="h-32">
            {children}
        </div>
    </Card>
)};

const SimpleBarChart: React.FC<{ data: { label: string, value: number }[]; goal?: number; color: string; }> = ({ data, goal, color }) => {
    const { t } = useI18n();
    const maxValue = Math.max(...data.map(d => d.value), goal || 0) * 1.2;
    if (maxValue === 0) return <div className="h-full flex items-center justify-center text-sm text-slate-400">{t('report.trends.noData')}</div>;

    return (
        <div className="h-full w-full flex items-end justify-around gap-1 relative pt-4">
            {goal && (
                <div className="absolute top-0 left-0 w-full border-b-2 border-dashed border-green-500 dark:border-green-400" style={{ bottom: `${(goal / maxValue) * 100}%` }}>
                    <span className="absolute -top-3 right-0 text-xs text-green-600 dark:text-green-300 font-semibold bg-green-100 dark:bg-green-900 px-1 rounded">{t('report.trends.goal')}</span>
                </div>
            )}
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group">
                    <div className="w-full h-full flex items-end">
                       <div className={`w-full ${color} rounded-t-md transition-all duration-300 group-hover:opacity-80`} style={{ height: `${(d.value / maxValue) * 100}%` }}></div>
                    </div>
                    <span className="text-xs mt-1 text-slate-500 dark:text-slate-400">{d.label}</span>
                </div>
            ))}
        </div>
    );
};

const SimpleLineChart: React.FC<{ data: { label: string, value: number | null }[]; colorClass: string }> = ({ data, colorClass }) => {
    const { t } = useI18n();
    const pointsWithValue = data.map((d, i) => ({ ...d, index: i })).filter(d => d.value !== null);
    if (pointsWithValue.length < 2) return <div className="h-full flex items-center justify-center text-sm text-slate-400">{t('report.trends.notEnoughData')}</div>;
    
    const validValues = pointsWithValue.map(p => p.value as number);
    const minValue = Math.min(...validValues);
    const maxValue = Math.max(...validValues);
    const range = maxValue - minValue || 1;

    const points = pointsWithValue.map(p => {
        const x = (p.index / (data.length - 1)) * 100;
        const y = 100 - ((p.value! - minValue) / range) * 100;
        return `${x},${y}`;
    }).join(' ');
    
    return (
        <div className="h-full w-full flex items-end justify-around relative">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full absolute inset-0">
                <polyline points={points} fill="none" className={colorClass} strokeWidth="2" />
            </svg>
        </div>
    );
};


const HealthTrends: React.FC<{ logs: LogEntry[]; preferences: Preferences }> = ({ logs, preferences }) => {
    const { t, locale } = useI18n();
    const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');
    const days = timeRange === '7d' ? 7 : 30;

    const chartData = useMemo(() => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days + 1);

        const dateMap = new Map<string, LogEntry[]>();
        for (let i = 0; i < days; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            dateMap.set(d.toISOString().split('T')[0], []);
        }

        logs.forEach(log => {
            const logDate = new Date(log.timestamp).toISOString().split('T')[0];
            if (dateMap.has(logDate)) {
                dateMap.get(logDate)!.push(log);
            }
        });

        const labels = Array.from(dateMap.keys()).map(dateStr => {
             // Adding T00:00:00 ensures it's interpreted as local time midnight, not UTC, preventing off-by-one-day errors in some timezones.
             const safeDate = new Date(dateStr + 'T00:00:00');
             return safeDate.toLocaleDateString(locale, { month: 'numeric', day: 'numeric' });
        });
        
        const painData = Array.from(dateMap.values()).map(dayLogs => {
            const painLogs = dayLogs.filter(l => l.type === 'symptom') as Extract<LogEntry, { type: 'symptom' }>[];
            if (painLogs.length === 0) return { value: null };
            const avg = painLogs.reduce((sum, l) => sum + l.data.painLevel, 0) / painLogs.length;
            return { value: avg };
        });

        const purineData = Array.from(dateMap.values()).map(dayLogs => {
            const total = dayLogs.filter(l => l.type === 'purine_intake').reduce((sum, l) => sum + (l.data as PurineIntakeData).totalPurineScore, 0);
            return { value: total };
        });

        const hydrationData = Array.from(dateMap.values()).map(dayLogs => {
            const total = dayLogs.filter(l => l.type === 'hydration').reduce((sum, l) => sum + (l.data as HydrationData).amount, 0);
            return { value: total };
        });

        const weightData = Array.from(dateMap.keys()).map(dateStr => {
            const dayLogs = dateMap.get(dateStr)!;
            const weightLog = dayLogs.filter(l => l.type === 'wellness' && (l.data as WellnessData).weight).pop();
            return { value: weightLog ? (weightLog.data as WellnessData).weight! : null };
        });
        
        // Fill null weight values with the last known weight
        let lastKnownWeight: number | null = null;
        for (let i = 0; i < weightData.length; i++) {
            if (weightData[i].value !== null) {
                lastKnownWeight = weightData[i].value;
            } else if (lastKnownWeight !== null) {
                // Do not forward-fill, show gaps
            }
        }


        const createChartData = (data: {value: number | null}[]) => data.map((d, i) => ({ label: labels[i], value: d.value }));

        return {
            pain: createChartData(painData),
            purine: createChartData(purineData),
            hydration: createChartData(hydrationData),
            weight: createChartData(weightData),
        };
    }, [logs, days, locale]);
    
     const calculateTrend = (data: { value: number | null }[]) => {
        const validData = data.map(d => d.value).filter(v => v !== null && v > 0) as number[];
        if (validData.length < 2) return 'neutral';
        const firstHalf = validData.slice(0, Math.floor(validData.length / 2));
        const secondHalf = validData.slice(Math.ceil(validData.length / 2));
        const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / (firstHalf.length || 1);
        const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / (secondHalf.length || 1);
        if (avgSecond > avgFirst * 1.1) return 'up';
        if (avgSecond < avgFirst * 0.9) return 'down';
        return 'neutral';
    };

    const painValues = chartData.pain.map(p => p.value).filter(v => v !== null) as number[];
    const avgPain = painValues.length ? painValues.reduce((a, b) => a + b, 0) / painValues.length : 0;
    const avgPurine = chartData.purine.reduce((sum, d) => sum + (d.value ?? 0), 0) / days;
    const avgHydration = chartData.hydration.reduce((sum, d) => sum + (d.value ?? 0), 0) / days;
    const lastWeight = [...chartData.weight].reverse().find(d => d.value !== null)?.value;

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('report.trends.title')}</h3>
                    <div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-lg">
                        <button onClick={() => setTimeRange('7d')} className={`px-3 py-1 text-sm font-semibold rounded-md ${timeRange === '7d' ? 'bg-white dark:bg-slate-800 shadow' : ''}`}>{t('report.trends.7days')}</button>
                        <button onClick={() => setTimeRange('30d')} className={`px-3 py-1 text-sm font-semibold rounded-md ${timeRange === '30d' ? 'bg-white dark:bg-slate-800 shadow' : ''}`}>{t('report.trends.30days')}</button>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <TrendChartCard title={t('report.trends.painLevel')} avgValue={avgPain.toFixed(1)} trend={calculateTrend(chartData.pain)}>
                    <SimpleLineChart data={chartData.pain} colorClass="stroke-red-500" />
                </TrendChartCard>
                 <TrendChartCard title={t('report.trends.purineIntake')} avgValue={avgPurine.toFixed(0)} trend={calculateTrend(chartData.purine)}>
                    <SimpleBarChart data={chartData.purine as {label: string, value: number}[]} color="bg-yellow-500" goal={preferences.dailyPurineGoal} />
                </TrendChartCard>
                <TrendChartCard title={t('report.trends.hydration')} avgValue={`${avgHydration.toFixed(0)}ml`} trend={calculateTrend(chartData.hydration) === 'up' ? 'down' : 'up'}>
                    <SimpleBarChart data={chartData.hydration as {label: string, value: number}[]} goal={preferences.dailyFluidGoal} color="bg-sky-500" />
                </TrendChartCard>
                <TrendChartCard title={t('report.trends.weight')} avgValue={lastWeight ? formatWeight(lastWeight, preferences.weightUnit) : '-'} trend={calculateTrend(chartData.weight)}>
                    <SimpleLineChart data={chartData.weight} colorClass="stroke-green-500" />
                </TrendChartCard>
            </div>
        </div>
    );
};

interface ReportPanelProps {
    logs: LogEntry[];
    preferences: Preferences;
    report: HealthReport | null;
    isLoading: boolean;
    onGenerateReport: () => void;
}

const ReportPanel: React.FC<ReportPanelProps> = ({ logs, preferences, report, isLoading, onGenerateReport }) => {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <HealthTrends logs={logs} preferences={preferences} />
            <div className="border-t border-slate-200 dark:border-slate-700 my-8"></div>
            {isLoading ? (
                <div className="flex items-center justify-center h-96">
                    <AiAnalysisLoader />
                </div>
            ) : report ? (
                <ReportDisplay report={report} />
            ) : (
                <InitialState onGenerate={onGenerateReport} hasLogs={logs.length > 2} />
            )}
        </div>
    );
};

export default ReportPanel;
