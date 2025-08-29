

import React, { useState, useMemo } from 'react';
import type { LogEntry, WellnessData, Preferences, PurineIntakeData, SymptomData, MedicationData, HydrationData, AlcoholData } from '../types';
import Card from './common/Card';
import { getLogIcon, getLogColor } from '../utils/logUtils';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, MedicationIcon, WaterDropIcon, ScaleIcon, MoonIcon, FaceFrownIcon, CheckCircleIcon, SymptomIcon, BeakerIcon, FlameIcon, ImageIcon, CoffeeIcon, AlcoholIcon, HeartIcon } from './Icons';
import { formatWeight, formatFluid } from '../utils/units';
import Button from './common/Button';
import { useI18n } from '../hooks/useI18n';

interface CalendarPanelProps {
  logs: LogEntry[];
  onOpenLogModal: (date: Date) => void;
  preferences: Preferences;
}

const isSameDay = (d1: Date, d2: Date) => 
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

const getDailyStatusIcons = (logsForDay: LogEntry[], preferences: Preferences): React.ReactNode[] => {
    const icons = [];
    
    // 1. High-pain symptom
    const highPainSymptom = logsForDay.find(log => log.type === 'symptom' && (log.data as SymptomData).painLevel > 5);
    if (highPainSymptom) {
        icons.push(<SymptomIcon key="symptom" className="w-4 h-4 text-red-500" />);
    }

    // 2. High-purine meal
    const highPurineMeal = logsForDay.find(log => log.type === 'purine_intake' && (log.data as PurineIntakeData).totalPurineScore > 70);
    if (highPurineMeal) {
        icons.push(<BeakerIcon key="purine" className="w-4 h-4 text-amber-600" />);
    }

    // 3. Met fluid goal
    const totalFluid = logsForDay
        .filter(log => log.type === 'hydration')
        .reduce((sum, log) => sum + ((log.data as HydrationData).amount || 0), 0);
    if (preferences.dailyFluidGoal > 0 && totalFluid >= preferences.dailyFluidGoal) {
        icons.push(<CheckCircleIcon key="fluid" className="w-4 h-4 text-sky-500" />);
    }
    
    // 4. Took medication
    if (logsForDay.some(log => log.type === 'medication')) {
        icons.push(<MedicationIcon key="meds" className="w-4 h-4 text-indigo-500" />);
    }

    return icons.slice(0, 3);
};


const UnifiedCalendar: React.FC<{
    currentDate: Date;
    setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
    selectedDate: Date;
    setSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
    logs: LogEntry[];
    preferences: Preferences;
}> = ({ currentDate, setCurrentDate, selectedDate, setSelectedDate, logs, preferences }) => {
  const { locale } = useI18n();
  
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();

  const days = Array.from({ length: startDay }, (_, i) => null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );
  
  const today = new Date();

  const changeMonth = (offset: number) => {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };
  
  const dayNames = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    return [...Array(7).keys()].map(day => formatter.format(new Date(Date.UTC(2021, 5, 6 + day))));
  }, [locale]);


  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
          <ChevronLeftIcon />
        </button>
        <h3 className="text-lg font-semibold">
          {currentDate.toLocaleString(locale, { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
          <ChevronRightIcon />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {dayNames.map(day => (
          <div key={day} className="font-medium text-slate-500 dark:text-slate-400">{day}</div>
        ))}
        {days.map((day, index) => {
          if (!day) return <div key={index} className="relative pt-[100%]" />;

          const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const logsForDay = logs.filter(log => isSameDay(new Date(log.timestamp), cellDate));
          const dailyIcons = getDailyStatusIcons(logsForDay, preferences);
          const isToday = isSameDay(cellDate, today);
          const isSelected = isSameDay(cellDate, selectedDate);
          
          return (
            <div key={index} className="relative pt-[100%]" onClick={() => setSelectedDate(cellDate)}>
              <div className={`absolute inset-0.5 flex flex-col items-center justify-center rounded-lg transition-colors cursor-pointer ${isSelected ? 'bg-sky-500 text-white' : 'hover:bg-sky-100 dark:hover:bg-sky-900/50'}`}>
                 <span className={`absolute top-1.5 right-1.5 text-xs w-6 h-6 flex items-center justify-center rounded-full font-semibold ${isToday && !isSelected ? 'bg-slate-200 dark:bg-slate-700' : ''} ${isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                     {day}
                 </span>
                 <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex space-x-1">
                    {dailyIcons}
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

const WellnessDataChip: React.FC<{ icon: React.ReactNode, value: string | number | undefined }> = ({ icon, value }) => {
    if (value === undefined || value === '') return null;
    return (
        <div className="flex items-center bg-slate-200 dark:bg-slate-600 rounded-full px-2.5 py-1 text-xs">
            {icon}
            <span className="ml-1.5 font-medium text-slate-700 dark:text-slate-200">{value}</span>
        </div>
    );
};

const SymptomDetailChip: React.FC<{ symptom: SymptomData['symptoms'][number] }> = ({ symptom }) => {
    const { t } = useI18n();
    const details = {
        swelling: { label: t('logModal.symptom.swelling'), icon: <FlameIcon className="w-3.5 h-3.5" />, color: "text-orange-600 dark:text-orange-400" },
        redness: { label: t('logModal.symptom.redness'), icon: <FlameIcon className="w-3.5 h-3.5" />, color: "text-red-600 dark:text-red-400" },
        warmth: { label: t('logModal.symptom.warmth'), icon: <FlameIcon className="w-3.5 h-3.5" />, color: "text-amber-600 dark:text-amber-400" },
    };
    const detail = details[symptom];
    if (!detail) return null;
    return (
         <div className={`flex items-center bg-slate-200 dark:bg-slate-600 rounded-full px-2.5 py-1 text-xs ${detail.color}`}>
            {detail.icon}
            <span className="ml-1.5 font-medium">{detail.label}</span>
        </div>
    );
};

const LogListItem: React.FC<{ log: LogEntry, preferences: Preferences }> = ({ log, preferences }) => {
    const { t } = useI18n();
    const renderContent = () => {
        switch (log.type) {
            case 'symptom': {
                const { data } = log;
                const painPercentage = data.painLevel * 10;
                const painColor = data.painLevel > 7 ? 'bg-red-500' : data.painLevel > 4 ? 'bg-yellow-500' : 'bg-green-500';
                return (
                    <div>
                        <div className="flex justify-between items-start">
                             <p className="font-semibold text-slate-800 dark:text-slate-200">{data.location}</p>
                            {data.photo && (
                                <img src={`data:image/jpeg;base64,${data.photo}`} alt="symptom" className="w-12 h-12 object-cover rounded-md ml-4" />
                            )}
                        </div>
                        <div className="mt-2">
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className="font-medium text-slate-600 dark:text-slate-300">{t('logModal.symptom.painLevelLabel')}</span>
                                <span className="font-bold text-slate-800 dark:text-slate-100">{data.painLevel}/10</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                                <div className={`${painColor} h-2 rounded-full`} style={{ width: `${painPercentage}%` }}></div>
                            </div>
                        </div>
                        {(data.symptoms.length > 0 || data.notes) && (
                            <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-700/60">
                                {data.symptoms.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {data.symptoms.map(s => <SymptomDetailChip key={s} symptom={s} />)}
                                    </div>
                                )}
                                {data.notes && <p className="text-sm text-slate-500 dark:text-slate-400 italic">"{data.notes}"</p>}
                            </div>
                        )}
                    </div>
                );
            }
            case 'purine_intake': {
                const { mealName, totalPurineScore, overallRiskLevel } = log.data;
                const riskColor = overallRiskLevel === 'High' ? 'bg-red-500' : overallRiskLevel === 'Moderate' ? 'bg-yellow-500' : 'bg-green-500';
                 return (
                    <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{mealName}</p>
                        <div className="mt-2">
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className="font-medium text-slate-600 dark:text-slate-300">{t('food.purineScore')}</span>
                                <span className="font-bold text-slate-800 dark:text-slate-100">{totalPurineScore}/100</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                                <div className={`${riskColor} h-2 rounded-full`} style={{ width: `${totalPurineScore}%` }}></div>
                            </div>
                        </div>
                    </div>
                );
            }
            case 'hydration': {
                const data = log.data as HydrationData;
                return (
                    <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {t('logModal.hydration.title')}: {formatFluid(data.amount, preferences.fluidUnit)}
                        </p>
                        {data.notes && <p className="text-sm text-slate-500 dark:text-slate-400 italic mt-1">"{data.notes}"</p>}
                    </div>
                );
            }
            case 'alcohol': {
                const data = log.data as AlcoholData;
                return (
                    <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {t('logModal.alcohol.title')}: {data.type} {formatFluid(data.amount, preferences.fluidUnit)}
                        </p>
                        {data.notes && <p className="text-sm text-slate-500 dark:text-slate-400 italic mt-1">"{data.notes}"</p>}
                    </div>
                );
            }
             case 'wellness': {
                const { data } = log;
                if (Object.keys(data).length === 0 || (Object.keys(data).length === 1 && 'notes' in data && !data.notes)) return null;
                return (
                    <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 mb-2">{t('logModal.wellness.title')}</p>
                        <div className="flex flex-wrap gap-2">
                           <WellnessDataChip icon={<ScaleIcon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400"/>} value={data.weight ? formatWeight(data.weight, preferences.weightUnit) : undefined} />
                           <WellnessDataChip icon={<MoonIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400"/>} value={data.sleepHours ? `${data.sleepHours}h` : undefined} />
                           <WellnessDataChip icon={<FaceFrownIcon className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400"/>} value={data.stressLevel ? `${data.stressLevel}/5` : undefined} />
                        </div>
                        {data.activity && <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 pl-1">{t('logModal.wellness.activityLabel')}: {data.activity}</p>}
                        {data.notes && <p className="text-sm text-slate-500 dark:text-slate-400 italic mt-2 pl-1">{t('logModal.notesLabel')}: "{data.notes}"</p>}
                    </div>
                );
            }
            case 'medication': {
                const { name, dosage, unit } = log.data as MedicationData;
                let medDesc = name;
                if (dosage) medDesc += ` ${dosage}`;
                if (unit) medDesc += `${unit}`;
                return <p className="font-semibold text-slate-800 dark:text-slate-200">{medDesc}</p>;
            }
            default: return '';
        }
    };

    const content = renderContent();
    if (!content) return null; // Don't render empty wellness logs

    return (
        <li className="flex items-start p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 shadow-sm">
            <div className={`flex-shrink-0 mt-1 mr-3 w-8 h-8 rounded-full flex items-center justify-center ${getLogColor(log.type)}/20`}>
                {getLogIcon(log.type, "w-5 h-5")}
            </div>
            <div className="flex-grow">
                {content}
            </div>
        </li>
    );
};


const DailyLogList: React.FC<{
    logs: LogEntry[],
    selectedDate: Date,
    preferences: Preferences,
    onOpenLogModal: (date: Date) => void
}> = ({ logs, selectedDate, preferences, onOpenLogModal }) => {
    const { t, locale } = useI18n();

    const groupedLogs = useMemo(() => {
        const logsForDay = logs
            .filter(log => isSameDay(new Date(log.timestamp), selectedDate))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        if (logsForDay.length === 0) return null;

        const groups: Record<string, LogEntry[]> = {
            symptom: [],
            purine_intake: [],
            medication: [],
            hydration: [],
            alcohol: [],
            wellness: [],
        };
        
        logsForDay.forEach(log => {
            if (groups[log.type]) {
                groups[log.type].push(log);
            }
        });

        return groups;
    }, [logs, selectedDate]);
    
    const groupOrder: (keyof typeof groupedLogs)[] = ['symptom', 'purine_intake', 'medication', 'hydration', 'alcohol', 'wellness'];

    const groupDetails: Record<string, { title: string, icon: React.ReactNode }> = {
        symptom: { title: t('logHistory.groups.symptoms'), icon: <SymptomIcon className="w-5 h-5 text-red-500" /> },
        purine_intake: { title: t('logHistory.groups.meals'), icon: <BeakerIcon className="w-5 h-5 text-teal-500" /> },
        medication: { title: t('logHistory.groups.medications'), icon: <MedicationIcon className="w-5 h-5 text-indigo-500" /> },
        hydration: { title: t('logHistory.groups.hydration'), icon: <WaterDropIcon className="w-5 h-5 text-sky-500" /> },
        alcohol: { title: t('logHistory.groups.alcohol'), icon: <AlcoholIcon className="w-5 h-5 text-purple-500" /> },
        wellness: { title: t('logHistory.groups.wellness'), icon: <HeartIcon className="w-5 h-5 text-green-500" /> },
    };

    const PurineGroupSummary: React.FC<{ logs: LogEntry[] }> = ({ logs }) => {
        const total = logs.reduce((sum, log) => sum + (log.data as PurineIntakeData).totalPurineScore, 0);
        return <span className="text-sm font-normal text-slate-500 dark:text-slate-400"> - {t('logHistory.groups.totalPurine', { score: total })}</span>;
    };
    
    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                    {t('logHistory.logsForDate', { date: selectedDate.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' }) })}
                </h3>
                <Button size="sm" variant="secondary" onClick={() => onOpenLogModal(selectedDate)}>
                    <PlusIcon className="w-4 h-4 mr-2" />
                    {t('logHistory.addLog')}
                </Button>
            </div>
            {!groupedLogs ? (
                <div className="flex flex-col items-center justify-center text-center h-48">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                       {getLogIcon('wellness', 'w-8 h-8')}
                    </div>
                    <p className="font-semibold">{t('logHistory.noLogs')}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{t('logHistory.noLogsDescription')}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {groupOrder.map(groupKey => {
                        const logsInGroup = groupedLogs[groupKey];
                        if (logsInGroup.length === 0) return null;

                        const details = groupDetails[groupKey];
                        return (
                            <div key={groupKey}>
                                <h4 className="text-md font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center">
                                    {details.icon}
                                    <span className="ml-2">{details.title}</span>
                                    {groupKey === 'purine_intake' && <PurineGroupSummary logs={logsInGroup} />}
                                </h4>
                                <ul className="space-y-2">
                                    {logsInGroup.map(log => <LogListItem key={log.id} log={log} preferences={preferences} />)}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
};


const CalendarPanel: React.FC<CalendarPanelProps> = ({ logs, onOpenLogModal, preferences }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
       <div className="xl:col-span-1">
            <UnifiedCalendar 
                logs={logs}
                preferences={preferences}
                currentDate={currentDate}
                setCurrentDate={setCurrentDate}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
            />
       </div>
       <div className="xl:col-span-1">
            <DailyLogList 
                logs={logs} 
                selectedDate={selectedDate}
                preferences={preferences}
                onOpenLogModal={onOpenLogModal}
            />
       </div>
    </div>
  );
};

export default CalendarPanel;
