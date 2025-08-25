import React, { useMemo } from 'react';
import type { LogEntry, Preferences, MedicationData, MealAnalysis } from '../types';
import Card from './common/Card';
import { CheckIcon, TrashIcon, CameraIcon, TargetIcon, SparklesIcon, BookOpenIcon, FlameIcon, TrophyIcon, ShieldCheckIcon } from './Icons';
import { formatFluid, formatWeight, kgToLbs } from '../utils/units';

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
}

const getRiskLevelStyles = (level: string) => {
    switch (level) {
        case '낮음': return {
            text: 'text-green-600 dark:text-green-400',
            border: 'border-green-500',
            bg: 'bg-green-50 dark:bg-green-900/50',
            gradient: 'from-green-50 to-green-100 dark:from-green-900/50 dark:to-green-900/70',
        };
        case '주의': return {
            text: 'text-yellow-600 dark:text-yellow-400',
            border: 'border-yellow-500',
            bg: 'bg-yellow-50 dark:bg-yellow-900/50',
            gradient: 'from-yellow-50 to-yellow-100 dark:from-yellow-900/50 dark:to-yellow-900/70',
        };
        case '높음': return {
            text: 'text-red-600 dark:text-red-400',
            border: 'border-red-500',
            bg: 'bg-red-50 dark:bg-red-900/50',
            gradient: 'from-red-50 to-red-100 dark:from-red-900/50 dark:to-red-900/70',
        };
        default: return {
            text: 'text-slate-600 dark:text-slate-400',
            border: 'border-slate-500',
            bg: 'bg-slate-50 dark:bg-slate-700',
            gradient: 'from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/70',
        };
    }
};

const WelcomeGuide: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => {
    const features = [
        {
            icon: <CameraIcon className="w-8 h-8 text-sky-500" />,
            title: "AI 식단 분석",
            description: "사진 한 장으로 식단의 퓨린 위험도를 분석하고 건강한 대안을 찾아보세요."
        },
        {
            icon: <TargetIcon className="w-8 h-8 text-green-500" />,
            title: "일일 퓨린 트래커",
            description: "분석한 식단을 기록하고, 하루 섭취량을 목표에 맞춰 관리하세요."
        },
        {
            icon: <SparklesIcon className="w-8 h-8 text-yellow-500" />,
            title: "AI 비서",
            description: "통풍에 대해 궁금한 점을 언제든지 물어보고, 개인화된 조언을 받으세요."
        },
        {
            icon: <BookOpenIcon className="w-8 h-8 text-indigo-500" />,
            title: "통합 기록 관리",
            description: "증상, 약물, 활동 등 모든 건강 데이터를 한곳에서 관리하고 패턴을 파악하세요."
        }
    ];

    return (
        <Card className="bg-gradient-to-br from-sky-50 to-indigo-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">GoutCare AI에 오신 것을 환영합니다!</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">AI와 함께 통풍을 스마트하게 관리하고 건강한 라이프스타일을 되찾으세요.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {features.map(feature => (
                    <div key={feature.title} className="flex items-start space-x-4 p-3 rounded-lg bg-white/50 dark:bg-slate-800/50">
                        <div className="flex-shrink-0">{feature.icon}</div>
                        <div>
                            <h4 className="font-semibold text-slate-700 dark:text-slate-200">{feature.title}</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{feature.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="text-center">
                 <button 
                    onClick={onDismiss} 
                    className="px-6 py-2 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-700 transition-colors"
                >
                    시작하기
                </button>
            </div>
        </Card>
    );
};


interface DailyGoutRiskAdvisorProps {
    risk: string;
    summary: string;
    forecast: string;
    isLoading: boolean;
}

const DailyGoutRiskAdvisor: React.FC<DailyGoutRiskAdvisorProps> = ({ risk, summary, forecast, isLoading }) => {
    const styles = getRiskLevelStyles(risk);
    return (
        <Card className={`bg-gradient-to-br ${styles.gradient}`}>
             <div className="flex items-center mb-3">
                <ShieldCheckIcon className={`w-6 h-6 mr-2 ${styles.text}`} />
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">오늘의 통풍 위험도</h3>
            </div>
            {isLoading ? (
                <div className="space-y-3 animate-pulse">
                    <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                    <div className="h-5 w-full bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                    <div className="h-4 w-4/5 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className={`inline-block px-3 py-1 text-base font-bold rounded-lg border-2 ${styles.text} ${styles.border} ${styles.bg}`}>
                        {risk}
                    </div>
                    <p className="text-md font-semibold text-slate-700 dark:text-slate-300">{summary}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{forecast}</p>
                </div>
            )}
        </Card>
    );
};

const DailyPurineTracker: React.FC<{ logs: LogEntry[], onDeleteLog: (logId: string) => void, dailyGoal: number }> = ({ logs, onDeleteLog, dailyGoal }) => {
    const todayStr = new Date().toISOString().split('T')[0];

    const todaysPurineLogs = useMemo(() => logs.filter(log =>
        log.timestamp.startsWith(todayStr) && log.type === 'purine_intake'
    ) as (LogEntry & { type: 'purine_intake', data: MealAnalysis })[], [logs, todayStr]);

    const totalScore = useMemo(() => todaysPurineLogs.reduce((sum, log) => sum + log.data.totalPurineScore, 0), [todaysPurineLogs]);
    const progress = Math.min((totalScore / dailyGoal) * 100, 100);
    
    const progressColor = totalScore > dailyGoal ? 'bg-red-500' : totalScore > dailyGoal * 0.75 ? 'bg-yellow-500' : 'bg-sky-500';

    return (
        <Card>
            <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200">오늘의 퓨린 섭취량</h3>
            <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalScore}</span>
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">목표: {dailyGoal} 이하</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                <div className={`${progressColor} h-3 rounded-full transition-all duration-500`} style={{ width: `${progress}%` }}></div>
            </div>
            
            {todaysPurineLogs.length > 0 ? (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="text-md font-semibold mb-2 text-slate-700 dark:text-slate-300">섭취한 식단</h4>
                    <ul className="space-y-2">
                        {todaysPurineLogs.map(log => (
                            <li key={log.id} className="flex items-center justify-between p-2 rounded-md bg-slate-100 dark:bg-slate-900/50 group">
                                <span className="text-sm flex-grow truncate pr-2">{log.data.mealDescription}</span>
                                <span className="text-sm font-semibold mx-2 flex-shrink-0">{log.data.totalPurineScore}점</span>
                                <button onClick={() => onDeleteLog(log.id)} aria-label={`Delete ${log.data.mealDescription} log`} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">오늘 기록된 식단이 없습니다.</p>
            )}
        </Card>
    );
};


const TodaysChecklist: React.FC<{ logs: LogEntry[], preferences: Preferences }> = ({ logs, preferences }) => {
    const dailyFluidGoalMl = preferences.dailyFluidGoal;
    const todayStr = new Date().toISOString().split('T')[0];

    const todaysLogs = useMemo(() => logs.filter(log => log.timestamp.startsWith(todayStr)), [logs, todayStr]);

    const todaysIntake = useMemo(() => todaysLogs.reduce((total, log) => {
        if (log.type === 'wellness' && log.data.fluidIntake) {
            return total + log.data.fluidIntake;
        }
        return total;
    }, 0), [todaysLogs]);

    const loggedMedicationTimes = useMemo(() => new Set(
        todaysLogs.filter(log => log.type === 'medication').map(log => (log.data as MedicationData).timeOfDay)
    ), [todaysLogs]);

    const fluidPercentage = Math.min((todaysIntake / dailyFluidGoalMl) * 100, 100);

    const checklistItems = [
        { id: 'fluid', label: `수분 섭취 (${formatFluid(todaysIntake, preferences.fluidUnit)} / ${formatFluid(dailyFluidGoalMl, preferences.fluidUnit)})`, completed: todaysIntake >= dailyFluidGoalMl },
        { id: 'med-morning', label: '아침 약 복용', completed: loggedMedicationTimes.has('morning') },
        { id: 'med-lunch', label: '점심 약 복용', completed: loggedMedicationTimes.has('lunch') },
        { id: 'med-dinner', label: '저녁 약 복용', completed: loggedMedicationTimes.has('dinner') },
    ];
    
    return (
        <Card>
            <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">오늘의 체크리스트</h3>
            <ul className="space-y-3">
                {checklistItems.map(item => (
                    <li key={item.id} className="flex items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${item.completed ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                           {item.completed && <CheckIcon className="w-4 h-4 text-white" />}
                        </div>
                        <span className={`flex-grow text-sm ${item.completed ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'}`}>
                            {item.label}
                        </span>
                    </li>
                ))}
            </ul>
             <div className="mt-4">
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                    <div className="bg-sky-500 h-2.5 rounded-full" style={{ width: `${fluidPercentage}%` }}></div>
                </div>
            </div>
        </Card>
    );
};


const WeeklyHealthReport: React.FC<{ logs: LogEntry[], preferences: Preferences }> = ({ logs, preferences }) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const weightLogs = logs
        .reduce((acc, log) => {
            if (log.type === 'wellness' && log.data.weight && new Date(log.timestamp) >= thirtyDaysAgo) {
                acc.push({
                    date: new Date(log.timestamp),
                    weight: log.data.weight,
                });
            }
            return acc;
        }, [] as { date: Date, weight: number }[])
        .sort((a, b) => a.date.getTime() - b.date.getTime());
    
    const weightsInKg = weightLogs.map(l => l.weight);
    const minWeightKg = weightsInKg.length > 0 ? Math.min(...weightsInKg) : 0;
    const maxWeightKg = weightsInKg.length > 0 ? Math.max(...weightsInKg) : 0;

    const minWeightDisplay = preferences.weightUnit === 'lbs' ? kgToLbs(minWeightKg) : minWeightKg;
    const maxWeightDisplay = preferences.weightUnit === 'lbs' ? kgToLbs(maxWeightKg) : maxWeightKg;


    const points = weightLogs.map((log, index) => {
        const x = (index / (weightLogs.length - 1 || 1)) * 100;
        const y = 100 - ((log.weight - minWeightKg) / (maxWeightKg - minWeightKg || 1)) * 100;
        return `${x},${y}`;
    }).join(' ');
    
    return (
        <Card>
            <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">주간 건강 리포트</h3>
            <div className="h-48">
                {weightLogs.length > 1 ? (
                    <>
                    <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">체중 추이 (지난 30일)</h4>
                    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                         {/* Y-axis labels */}
                         <text x="0" y="8" fontSize="6" fill="currentColor" className="text-slate-400">{maxWeightDisplay.toFixed(1)} {preferences.weightUnit}</text>
                         <text x="0" y="100" fontSize="6" fill="currentColor" className="text-slate-400">{minWeightDisplay.toFixed(1)} {preferences.weightUnit}</text>
                        {/* Grid lines */}
                        <line x1="15" y1="5" x2="100" y2="5" stroke="currentColor" strokeWidth="0.2" className="text-slate-200 dark:text-slate-700" />
                        <line x1="15" y1="99" x2="100" y2="99" stroke="currentColor" strokeWidth="0.5" className="text-slate-300 dark:text-slate-600" />
                        <polyline fill="none" stroke="currentColor" className="text-sky-500" strokeWidth="1" points={points} transform="translate(15, 0) scale(0.85, 1)"/>
                    </svg>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-center text-slate-500 dark:text-slate-400">
                        <p>차트를 표시할 체중 기록이 부족합니다.</p>
                    </div>
                )}
            </div>
        </Card>
    );
};

const calculateStreaks = (logs: LogEntry[]) => {
    if (logs.length === 0) {
        return { loggingStreak: 0 };
    }

    const logDates = [...new Set(logs.map(log => log.timestamp.split('T')[0]))];
    logDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const mostRecentLogDate = new Date(logDates[0]);
    const mostRecentLogDateStart = new Date(mostRecentLogDate.getFullYear(), mostRecentLogDate.getMonth(), mostRecentLogDate.getDate());

    const timeDiff = todayStart.getTime() - mostRecentLogDateStart.getTime();
    const dayDiff = Math.round(timeDiff / (1000 * 3600 * 24));

    if (dayDiff > 1) {
        return { loggingStreak: 0 };
    }

    let streak = 1;
    let lastDate = new Date(logDates[0]);
    for (let i = 1; i < logDates.length; i++) {
        const currentDate = new Date(logDates[i]);
        const dateDiff = lastDate.getTime() - currentDate.getTime();
        const daysApart = Math.round(dateDiff / (1000 * 3600 * 24));
        
        if (daysApart === 1) {
            streak++;
            lastDate = currentDate;
        } else {
            break;
        }
    }
    
    return { loggingStreak: streak };
};

const AchievementsCard: React.FC<{ logs: LogEntry[] }> = ({ logs }) => {
    const { loggingStreak } = calculateStreaks(logs);

    const achievements = [
        {
            icon: <FlameIcon className="w-8 h-8 text-orange-500" />,
            title: "연속 기록",
            value: loggingStreak,
            unit: "일째",
            description: "매일 기록하는 습관을 만들어보세요!",
            isAchieved: loggingStreak > 0,
        },
    ];

    return (
        <Card>
            <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">나의 달성 현황</h3>
            {achievements.length > 0 ? (
                <div className="space-y-4">
                    {achievements.map(ach => (
                        <div key={ach.title} className={`flex items-center space-x-4 p-3 rounded-lg ${ach.isAchieved ? 'bg-green-50 dark:bg-green-900/50' : 'bg-slate-100 dark:bg-slate-700/50'}`}>
                            <div className="flex-shrink-0">{ach.icon}</div>
                            <div className="flex-grow">
                                <h4 className="font-semibold text-slate-700 dark:text-slate-200">{ach.title}</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{ach.description}</p>
                            </div>
                            {ach.isAchieved && (
                                <div className="text-right flex-shrink-0">
                                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{ach.value}<span className="text-sm font-medium ml-1">{ach.unit}</span></p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">아직 달성한 목표가 없습니다.</p>
            )}
        </Card>
    );
};


const DashboardPanel: React.FC<DashboardPanelProps> = ({ logs, preferences, risk, summary, forecast, isLoadingForecast, onDeleteLog, showWelcome, onDismissWelcome }) => {
  return (
    <div className="space-y-6">
        {showWelcome && <WelcomeGuide onDismiss={onDismissWelcome} />}
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">오늘의 통풍 관리</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <DailyGoutRiskAdvisor 
                    risk={risk}
                    summary={summary}
                    forecast={forecast}
                    isLoading={isLoadingForecast}
                />
            </div>
            <div className="lg:col-span-1">
                 <AchievementsCard logs={logs} />
            </div>
            <div className="lg:col-span-2">
                <DailyPurineTracker logs={logs} onDeleteLog={onDeleteLog} dailyGoal={preferences.dailyPurineGoal} />
            </div>
            <div className="lg:col-span-1">
                <TodaysChecklist logs={logs} preferences={preferences} />
            </div>
            <div className="lg:col-span-3">
                <WeeklyHealthReport logs={logs} preferences={preferences} />
            </div>
        </div>
    </div>
  );
};

export default DashboardPanel;