import React, { useState, useMemo } from 'react';
import { LogType, LogData, SymptomData, MedicationData, DietData, WellnessData, Preferences, LifeEventData, LogEntry } from '../types';
import Button from './common/Button';
import { getLogIcon } from '../utils/logUtils';
import { CloseIcon, SymptomIcon, MedicationIcon, DietIcon, HeartIcon, TagIcon } from './Icons';
import { lbsToKg, ozToMl } from '../utils/units';

interface LogModalProps {
  date: Date;
  onClose: () => void;
  onAddLog: (log: LogData, date: Date) => void;
  preferences: Preferences;
  logs: LogEntry[];
}

// Reusable Autocomplete Input Component
const AutocompleteInput: React.FC<{
    value: string;
    onChange: (value: string) => void;
    suggestions: string[];
    placeholder?: string;
    required?: boolean;
}> = ({ value, onChange, suggestions, placeholder, required }) => {
    const [showSuggestions, setShowSuggestions] = useState(false);

    const filteredSuggestions = useMemo(() =>
        suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase()),
        [suggestions, value]
    );

    return (
        <div className="relative">
            <input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder={placeholder}
                required={required}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {filteredSuggestions.map((suggestion, index) => (
                        <li
                            key={index}
                            onClick={() => {
                                onChange(suggestion);
                                setShowSuggestions(false);
                            }}
                            className="px-4 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-500"
                        >
                            {suggestion}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};


// Sub-components for each log form
const SymptomForm: React.FC<{ onSubmit: (data: SymptomData) => void; logs: LogEntry[] }> = ({ onSubmit, logs }) => {
    const [painLevel, setPainLevel] = useState(5);
    const [location, setLocation] = useState('');
    const [symptoms, setSymptoms] = useState<SymptomData['symptoms']>([]);
    
    const commonLocations = ["엄지발가락", "발목", "무릎", "손목"];
    const locationSuggestions = useMemo(() => 
        [...new Set(logs.filter(l => l.type === 'symptom').map(l => (l.data as SymptomData).location))]
    , [logs]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ painLevel, location, symptoms });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="location" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">통증 부위</label>
                <AutocompleteInput value={location} onChange={setLocation} suggestions={locationSuggestions} placeholder="예: 오른쪽 엄지발가락" required />
                <div className="flex flex-wrap gap-2 mt-2">
                    {commonLocations.map(loc => (
                        <button key={loc} type="button" onClick={() => setLocation(loc)} className="px-2.5 py-1 text-xs bg-slate-200 dark:bg-slate-600 rounded-full hover:bg-sky-200 dark:hover:bg-sky-700">{loc}</button>
                    ))}
                </div>
            </div>
             <div>
                <label htmlFor="painLevel" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">통증 강도: <span className="font-bold">{painLevel}</span>/10</label>
                <input id="painLevel" type="range" min="0" max="10" value={painLevel} onChange={e => setPainLevel(Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-600"/>
            </div>
            <div className="flex justify-end pt-2">
                <Button type="submit" size="lg">기록 저장</Button>
            </div>
        </form>
    );
};

const WellnessForm: React.FC<{ onSubmit: (data: WellnessData) => void, preferences: Preferences }> = ({ onSubmit, preferences }) => {
    const [fluidIntake, setFluidIntake] = useState('');
    const [weight, setWeight] = useState('');
    const [sleepHours, setSleepHours] = useState('');
    const [stressLevel, setStressLevel] = useState<WellnessData['stressLevel']>(3);
    const [activity, setActivity] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const finalWeight = weight && preferences.weightUnit === 'lbs' ? lbsToKg(Number(weight)) : (weight ? Number(weight) : undefined);
        const finalFluid = fluidIntake && preferences.fluidUnit === 'oz' ? ozToMl(Number(fluidIntake)) : (fluidIntake ? Number(fluidIntake) : undefined);

        onSubmit({
            fluidIntake: finalFluid,
            weight: finalWeight,
            sleepHours: sleepHours ? Number(sleepHours) : undefined,
            stressLevel,
            activity: activity || undefined,
        });
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">수분 섭취 ({preferences.fluidUnit})</label>
                    <input type="number" value={fluidIntake} onChange={e => setFluidIntake(e.target.value)} placeholder="예: 2000" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">체중 ({preferences.weightUnit})</label>
                    <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="예: 75.5" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">수면 (시간)</label>
                    <input type="number" step="0.5" value={sleepHours} onChange={e => setSleepHours(e.target.value)} placeholder="예: 7.5" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">스트레스 (1-5)</label>
                    <select value={stressLevel} onChange={e => setStressLevel(Number(e.target.value) as WellnessData['stressLevel'])} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg">
                        <option value={1}>1 (낮음)</option>
                        <option value={2}>2</option>
                        <option value={3}>3 (보통)</option>
                        <option value={4}>4</option>
                        <option value={5}>5 (높음)</option>
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">신체 활동</label>
                <input type="text" value={activity} onChange={e => setActivity(e.target.value)} placeholder="예: 30분 걷기" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"/>
            </div>
            <div className="flex justify-end pt-2">
                <Button type="submit" size="lg">기록 저장</Button>
            </div>
        </form>
    );
};

const LifeEventForm: React.FC<{ onSubmit: (data: LifeEventData) => void }> = ({ onSubmit }) => {
    const [event, setEvent] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ event });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="life-event" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">이벤트 설명</label>
                <textarea 
                    id="life-event" 
                    value={event} 
                    onChange={e => setEvent(e.target.value)} 
                    placeholder="오늘 있었던 특이사항을 자유롭게 기록해보세요. (예: 중요한 미팅으로 스트레스 받음, 날씨가 매우 습함)" 
                    required 
                    rows={4}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"
                />
            </div>
            <div className="flex justify-end pt-2">
                <Button type="submit" size="lg">기록 저장</Button>
            </div>
        </form>
    );
};


const LogModal: React.FC<LogModalProps> = ({ date, onClose, onAddLog, preferences, logs }) => {
  const [step, setStep] = useState<'select' | LogType>('select');

  const handleLogSubmit = (logData: Omit<LogData, 'type'>) => {
      onAddLog({ type: step as LogType, ...logData } as LogData, date);
  };
  
  const renderForm = () => {
      switch(step) {
          case 'symptom':
            return <SymptomForm logs={logs} onSubmit={(data) => onAddLog({type: 'symptom', data}, date)} />;
          case 'medication':
            return <MedicationOrDietForm type="medication" logs={logs} onSubmit={(data) => onAddLog({ type: 'medication', data: data as MedicationData }, date)} />;
          case 'diet':
            return <MedicationOrDietForm type="diet" logs={logs} onSubmit={(data) => onAddLog({ type: 'diet', data: data as DietData }, date)} />;
          case 'wellness':
            return <WellnessForm onSubmit={(data) => onAddLog({ type: 'wellness', data }, date)} preferences={preferences} />;
          case 'life_event':
            return <LifeEventForm onSubmit={(data) => onAddLog({ type: 'life_event', data }, date)} />;
          default:
            return null;
      }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-auto relative transform transition-all" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <CloseIcon />
        </button>
        <div className="p-6">
          <h2 className="text-xl font-bold text-center mb-2 text-slate-800 dark:text-slate-100">
            {step === 'select' ? '무엇을 기록할까요?' : `${step.charAt(0).toUpperCase() + step.slice(1)} Log`}
          </h2>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-6">{date.toLocaleDateString()}</p>
          
          {step === 'select' ? (
             <div className="grid grid-cols-2 gap-4">
                 <TypeButton type="symptom" label="증상" icon={<SymptomIcon />} onClick={() => setStep('symptom')} />
                 <TypeButton type="medication" label="약물" icon={<MedicationIcon />} onClick={() => setStep('medication')} />
                 <TypeButton type="diet" label="식단" icon={<DietIcon />} onClick={() => setStep('diet')} />
                 <TypeButton type="wellness" label="건강 지표" icon={<HeartIcon />} onClick={() => setStep('wellness')} />
                 <div className="col-span-2">
                    <TypeButton type="life_event" label="생활 기록" icon={<TagIcon />} onClick={() => setStep('life_event')} />
                 </div>
             </div>
          ) : (
            <>
              <button onClick={() => setStep('select')} className="text-sm text-sky-600 dark:text-sky-400 hover:underline mb-4">&larr; 뒤로가기</button>
              {renderForm()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const TypeButton: React.FC<{ type: LogType, label: string, icon: React.ReactNode, onClick: () => void }> = ({ label, icon, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center p-4 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-sky-100 dark:hover:bg-sky-900/50 border-2 border-transparent hover:border-sky-500 transition-all w-full h-full">
        <div className="w-10 h-10 mb-2">{icon}</div>
        <span className="font-semibold text-slate-700 dark:text-slate-200">{label}</span>
    </button>
);

const MedicationOrDietForm: React.FC<{ type: 'medication' | 'diet', logs: LogEntry[], onSubmit: (data: MedicationData | DietData) => void }> = ({ type, logs, onSubmit }) => {
    const [name, setName] = useState('');
    const [timeOfDay, setTimeOfDay] = useState<'morning' | 'lunch' | 'dinner' | 'bedtime' | 'breakfast' | 'snack'>(type === 'medication' ? 'morning' : 'breakfast');
    const [photo, setPhoto] = useState<string | undefined>();
    
    const suggestions = useMemo(() => {
        if (type === 'medication') {
            return [...new Set(logs.filter(l => l.type === 'medication').map(l => (l.data as MedicationData).name))];
        } else {
            return [...new Set(logs.filter(l => l.type === 'diet').map(l => (l.data as DietData).description))];
        }
    }, [logs, type]);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhoto(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (type === 'medication') {
            onSubmit({ name, timeOfDay: timeOfDay as MedicationData['timeOfDay'], intakeTime: new Date().toISOString(), photo });
        } else {
            onSubmit({ description: name, timeOfDay: timeOfDay as DietData['timeOfDay'], photo });
        }
    };

    const timeOptions = type === 'medication'
        ? { morning: '아침', lunch: '점심', dinner: '저녁', bedtime: '취침 전' }
        : { breakfast: '아침', lunch: '점심', dinner: '저녁', snack: '간식/야식' };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{type === 'medication' ? '약물 이름' : '음식 설명'}</label>
                <AutocompleteInput value={name} onChange={setName} suggestions={suggestions} required />
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">시간</label>
                <select value={timeOfDay} onChange={e => setTimeOfDay(e.target.value as any)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg">
                    {Object.entries(timeOptions).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
            </div>
            <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">사진 (선택)</label>
                 <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"/>
            </div>
            <div className="flex justify-end pt-2">
                <Button type="submit" size="lg">기록 저장</Button>
            </div>
        </form>
    );
};

export default LogModal;