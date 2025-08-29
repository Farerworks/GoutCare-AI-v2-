

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LogData, Preferences, SymptomData, MedicationData, LogEntry, MealAnalysis, PurineIntakeData, MedicationInfo, HydrationData } from '../types';
import Button from './common/Button';
import Spinner from './common/Spinner';
import { WaterDropIcon, DietIcon, MedicationIcon, SymptomIcon, ChevronLeftIcon, CloseIcon, SparklesIcon, BookOpenIcon, StarIcon, BeakerIcon } from './Icons';
import { analyzeMealFromText } from '../services/geminiService';
import { useI18n } from '../hooks/useI18n';
import { formatFluid, mlToOz, ozToMl } from '../utils/units';

interface QuickLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLog: (log: LogData, date: Date) => void;
  preferences: Preferences;
  logs: LogEntry[];
  foodHistory: MealAnalysis[];
  favoriteMeals: MealAnalysis[];
  myMedications: MedicationInfo[];
}

const ActionButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center p-4 bg-slate-100 dark:bg-slate-700/50 rounded-xl hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors space-y-2">
    {icon}
    <span className="font-semibold text-slate-700 dark:text-slate-200">{label}</span>
  </button>
);

const WaterLogForm: React.FC<{ onSubmit: (data: HydrationData) => void, preferences: Preferences }> = ({ onSubmit, preferences }) => {
    const { t } = useI18n();
    const [amount, setAmount] = useState<string>(
        preferences.fluidUnit === 'ml' ? '250' : mlToOz(250).toFixed(0)
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (!isNaN(numAmount) && numAmount > 0) {
            const amountInMl = preferences.fluidUnit === 'oz' ? ozToMl(numAmount) : numAmount;
            onSubmit({ amount: Math.round(amountInMl) });
        }
    };
    
    const quickAddValuesMl = [100, 250, 500];
    
    const handleQuickAdd = (mlValue: number) => {
        const displayValue = preferences.fluidUnit === 'ml' ? mlValue : mlToOz(mlValue);
        setAmount(displayValue.toFixed(0));
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full text-center text-3xl font-bold bg-transparent border-b-2 focus:outline-none focus:border-sky-500" autoFocus />
            <div className="flex space-x-2">
                {quickAddValuesMl.map(val => 
                    <Button key={val} type="button" variant="secondary" onClick={() => handleQuickAdd(val)} className="flex-1">
                        {formatFluid(val, preferences.fluidUnit)}
                    </Button>
                )}
            </div>
            <Button type="submit" className="w-full">{t('quickLog.addLog')}</Button>
        </form>
    );
};

const QuickSymptomForm: React.FC<{ onSubmit: (data: SymptomData) => void, logs: LogEntry[] }> = ({ onSubmit, logs }) => {
    const { t } = useI18n();
    const [painLevel, setPainLevel] = useState(5);
    const [location, setLocation] = useState('');
    const locationSuggestions = useMemo(() => [...new Set(logs.filter(l => l.type === 'symptom').map(l => (l.data as SymptomData).location))], [logs]);
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSubmit({ location, painLevel, symptoms: [] }); };
    return (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1">{t('quickLog.symptom.locationLabel')}</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} list="location-suggestions" placeholder={t('quickLog.symptom.locationPlaceholder')} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg" required />
                <datalist id="location-suggestions">{locationSuggestions.map(l => <option key={l} value={l} />)}</datalist>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">{t('quickLog.symptom.painLevelLabel')}: {painLevel}</label>
                <input type="range" min="0" max="10" value={painLevel} onChange={e => setPainLevel(Number(e.target.value))} className="w-full" />
            </div>
            <Button type="submit" className="w-full">{t('quickLog.addLog')}</Button>
        </form>
    );
};

const QuickMedicationForm: React.FC<{ onSubmit: (data: MedicationData) => void; logs: LogEntry[]; myMedications: MedicationInfo[] }> = ({ onSubmit, myMedications }) => {
    const { t } = useI18n();
    const [name, setName] = useState(myMedications[0]?.name || '');
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (name) onSubmit({ name, intakeTime: new Date().toISOString(), timeOfDay: 'morning' }); };
    return (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <select value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg">
                {myMedications.map(med => <option key={med.id} value={med.name}>{med.name}</option>)}
            </select>
            <Button type="submit" className="w-full">{t('quickLog.medication.logIntake')}</Button>
        </form>
    );
};

const QuickSmartDietForm: React.FC<{ onSubmit: (data: PurineIntakeData) => void; history: MealAnalysis[]; favorites: MealAnalysis[] }> = ({ onSubmit, history, favorites }) => {
    const { t } = useI18n();
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;
        setIsLoading(true);
        setError('');
        const result = await analyzeMealFromText(text.trim());
        if (result) {
            onSubmit({ ...result, id: `${Date.now()}`, timeOfDay: 'snack' });
        } else {
            setError(t('errors.aiAnalysisFailed'));
        }
        setIsLoading(false);
    };

    const handleQuickAdd = (meal: MealAnalysis) => {
        onSubmit({ ...meal, timeOfDay: 'snack' });
    };

    return (
        <div className="p-4 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-2">
                <textarea value={text} onChange={e => setText(e.target.value)} rows={2} placeholder={t('quickLog.diet.placeholder')} className="w-full p-2 bg-slate-50 dark:bg-slate-700 border rounded-lg" />
                <Button type="submit" disabled={isLoading} className="w-full">{isLoading ? <Spinner /> : <><SparklesIcon className="w-5 h-5 mr-2" /> {t('quickLog.diet.analyzeAndLog')}</>}</Button>
                {error && <p className="text-red-500 text-sm">{error}</p>}
            </form>
            <div className="space-y-2">
                <h3 className="font-semibold text-sm text-slate-600 dark:text-slate-400">{t('quickLog.diet.favoritesRecents')}</h3>
                <div className="flex flex-wrap gap-2">
                    {favorites.slice(0, 2).map(meal => <button key={meal.id} onClick={() => handleQuickAdd(meal)} className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/50 rounded-full text-sm flex items-center"><StarIcon className="w-4 h-4 mr-1 text-yellow-500"/>{meal.mealName}</button>)}
                    {history.slice(0, 3).map(meal => <button key={meal.id} onClick={() => handleQuickAdd(meal)} className="px-2 py-1 bg-slate-200 dark:bg-slate-600 rounded-full text-sm flex items-center"><BookOpenIcon className="w-4 h-4 mr-1"/>{meal.mealName}</button>)}
                </div>
            </div>
        </div>
    );
};

const QuickLogDrawer: React.FC<QuickLogDrawerProps> = ({ isOpen, onClose, onAddLog, preferences, logs, foodHistory, favoriteMeals, myMedications }) => {
  const { t } = useI18n();
  const [view, setView] = useState<'main' | 'water' | 'diet' | 'medication' | 'symptom'>('main');

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => setView('main'), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleAddLog = (logData: LogData) => {
    onAddLog(logData, new Date());
    onClose();
  };

  const titles = {
      main: t('quickLog.title'),
      water: t('quickLog.hydration.title'),
      diet: t('quickLog.diet.title'),
      medication: t('quickLog.medication.title'),
      symptom: t('quickLog.symptom.title'),
  };
  
  const mainViewActions = [
      { id: 'water', icon: <WaterDropIcon className="w-8 h-8 text-sky-500" />, label: t('quickLog.hydration.title') },
      { id: 'diet', icon: <BeakerIcon className="w-8 h-8 text-teal-500" />, label: t('quickLog.diet.title') },
      { id: 'medication', icon: <MedicationIcon className="w-8 h-8 text-indigo-500" />, label: t('quickLog.medication.title') },
      { id: 'symptom', icon: <SymptomIcon className="w-8 h-8 text-red-500" />, label: t('quickLog.symptom.title') },
  ];

  const renderContent = () => {
    switch (view) {
      case 'main':
        return (
          <div className="grid grid-cols-2 gap-4">
             {mainViewActions.map(action => (
                <ActionButton key={action.id} icon={action.icon} label={action.label} onClick={() => setView(action.id as any)} />
            ))}
          </div>
        );
      case 'water':
        return <WaterLogForm onSubmit={(data) => handleAddLog({ type: 'hydration', data })} preferences={preferences} />;
      case 'diet':
        return <QuickSmartDietForm 
            history={foodHistory} 
            favorites={favoriteMeals} 
            onSubmit={(data) => handleAddLog({ type: 'purine_intake', data })} 
        />;
       case 'medication':
        return <QuickMedicationForm logs={logs} myMedications={myMedications} onSubmit={(data) => handleAddLog({ type: 'medication', data })} />;
      case 'symptom':
        return <QuickSymptomForm logs={logs} onSubmit={(data) => handleAddLog({ type: 'symptom', data })} />;
      default:
        return null;
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ${isOpen ? 'bg-opacity-60' : 'bg-opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-log-title"
      >
        <header className="flex items-center justify-between p-2 border-b border-slate-200 dark:border-slate-700">
          <button onClick={() => setView('main')} className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-opacity ${view === 'main' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <ChevronLeftIcon />
          </button>
          <h2 id="quick-log-title" className="text-lg font-bold text-slate-800 dark:text-slate-100">{titles[view]}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
            <CloseIcon />
          </button>
        </header>
        <div className="p-4">
            {renderContent()}
        </div>
      </div>
    </>
  );
};

export default QuickLogDrawer;
