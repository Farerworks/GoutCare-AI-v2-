import React, { useState, useMemo } from 'react';
import type { LogEntry, WellnessData, Preferences } from '../types';
import Card from './common/Card';
import { getLogIcon } from '../utils/logUtils';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from './Icons';
import { formatWeight, formatFluid } from '../utils/units';
import Button from './common/Button';

interface CalendarPanelProps {
  logs: LogEntry[];
  onOpenLogModal: (date: Date) => void;
  preferences: Preferences;
}

const isSameDay = (d1: Date, d2: Date) => 
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

const UnifiedCalendar: React.FC<{
    currentDate: Date;
    setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
    selectedDate: Date;
    setSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
    logs: LogEntry[];
}> = ({ currentDate, setCurrentDate, selectedDate, setSelectedDate, logs }) => {
  
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
  
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
          <ChevronLeftIcon />
        </button>
        <h3 className="text-lg font-semibold">
          {currentDate.getFullYear()}년 {currentDate.toLocaleString('ko-KR', { month: 'long' })}
        </h3>
        <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
          <ChevronRightIcon />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {['일', '월', '화', '수', '목', '금', '토'].map(day => (
          <div key={day} className="font-medium text-slate-500 dark:text-slate-400">{day}</div>
        ))}
        {days.map((day, index) => {
          if (!day) return <div key={index} className="relative pt-[100%]" />;

          const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const logsForDay = logs.filter(log => isSameDay(new Date(log.timestamp), cellDate));
          const isToday = isSameDay(cellDate, today);
          const isSelected = isSameDay(cellDate, selectedDate);
          
          return (
            <div key={index} className="relative pt-[100%]" onClick={() => setSelectedDate(cellDate)}>
              <div className={`absolute inset-0.5 flex flex-col items-center justify-center rounded-lg transition-colors cursor-pointer ${isSelected ? 'bg-sky-500 text-white' : 'hover:bg-sky-100 dark:hover:bg-sky-900/50'}`}>
                 <span className={`absolute top-1 right-1 text-xs w-6 h-6 flex items-center justify-center rounded-full font-semibold ${isToday && !isSelected ? 'bg-slate-200 dark:bg-slate-700' : ''}`}>
                     {day}
                 </span>
                 <div className="flex items-center justify-center gap-1 mt-4">
                    {Array.from(new Set(logsForDay.map(l => l.type))).slice(0, 3).map(type => (
                        <div key={type} className="w-4 h-4">{getLogIcon(type, `w-4 h-4 ${isSelected ? 'text-white' : ''}`)}</div>
                    ))}
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

const timeOfDayLabels: Record<string, string> = {
    morning: '아침',
    lunch: '점심',
    dinner: '저녁',
    bedtime: '취침 전',
    breakfast: '아침',
    snack: '간식/야식'
};

const formatWellnessData = (data: WellnessData, preferences: Preferences) => {
    const parts: string[] = [];
    if (data.weight) parts.push(`체중: ${formatWeight(data.weight, preferences.weightUnit)}`);
    if (data.fluidIntake) parts.push(`수분: ${formatFluid(data.fluidIntake, preferences.fluidUnit)}`);
    if (data.sleepHours) parts.push(`수면: ${data.sleepHours} 시간`);
    if (data.stressLevel) parts.push(`스트레스: ${data.stressLevel}/5`);
    if (data.activity) parts.push(`활동: ${data.activity}`);
    return parts.join(', ');
};


const DailyLogList: React.FC<{
    logs: LogEntry[],
    selectedDate: Date,
    preferences: Preferences,
    onOpenLogModal: (date: Date) => void
}> = ({ logs, selectedDate, preferences, onOpenLogModal }) => {

    const logsForDay = useMemo(() => {
        return logs
            .filter(log => isSameDay(new Date(log.timestamp), selectedDate))
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [logs, selectedDate]);
    
    const groupedLogs = useMemo(() => {
        return logsForDay.reduce((acc, log) => {
            if (!acc[log.type]) {
                acc[log.type] = [];
            }
            acc[log.type].push(log);
            return acc;
        }, {} as Record<LogEntry['type'], LogEntry[]>);
    }, [logsForDay]);

    const logOrder: LogEntry['type'][] = ['symptom', 'medication', 'diet', 'wellness', 'life_event'];

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                    {selectedDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 기록
                </h3>
                <Button size="sm" variant="secondary" onClick={() => onOpenLogModal(selectedDate)}>
                    <PlusIcon className="w-4 h-4 mr-2" />
                    기록 추가
                </Button>
            </div>
            {logsForDay.length === 0 ? (
                <p className="text-center text-slate-500 dark:text-slate-400 py-8">이 날짜에는 기록이 없습니다.</p>
            ) : (
                <div className="space-y-4">
                    {logOrder.map(type => {
                        if (!groupedLogs[type] || groupedLogs[type].length === 0) return null;
                        
                        return (
                            <div key={type}>
                                <h4 className="font-semibold text-slate-600 dark:text-slate-300 mb-2 flex items-center">
                                    {getLogIcon(type, "w-5 h-5 mr-2")}
                                    {type === 'symptom' && '증상'}
                                    {type === 'medication' && '약물'}
                                    {type === 'diet' && '식단'}
                                    {type === 'wellness' && '건강 지표'}
                                    {type === 'life_event' && '생활 기록'}
                                </h4>
                                <ul className="space-y-2 pl-7">
                                    {groupedLogs[type].map(log => (
                                        <li key={log.id} className="text-sm text-slate-700 dark:text-slate-400">
                                            {log.type === 'symptom' && `통증: ${log.data.location} (강도: ${log.data.painLevel}/10)`}
                                            {log.type === 'medication' && `${log.data.name} - ${timeOfDayLabels[log.data.timeOfDay] || log.data.timeOfDay}`}
                                            {log.type === 'diet' && `${log.data.description} - ${timeOfDayLabels[log.data.timeOfDay] || log.data.timeOfDay}`}
                                            {log.type === 'wellness' && formatWellnessData(log.data, preferences)}
                                            {log.type === 'life_event' && log.data.event}
                                        </li>
                                    ))}

                                </ul>
                            </div>
                        )
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
    <div className="space-y-6">
       <UnifiedCalendar 
        logs={logs}
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
       />
       <DailyLogList 
        logs={logs} 
        selectedDate={selectedDate}
        preferences={preferences}
        onOpenLogModal={onOpenLogModal}
       />
    </div>
  );
};

export default CalendarPanel;