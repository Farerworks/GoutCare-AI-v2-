import React, { useState, useEffect } from 'react';
import { LogData, Preferences, SymptomData, DietData, MedicationData } from '../types';
import Button from './common/Button';
import { WaterDropIcon, DietIcon, MedicationIcon, SymptomIcon, ChevronLeftIcon, CloseIcon } from './Icons';

interface QuickLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLog: (log: LogData, date: Date) => void;
  preferences: Preferences;
}

const QuickLogDrawer: React.FC<QuickLogDrawerProps> = ({ isOpen, onClose, onAddLog, preferences }) => {
  const [view, setView] = useState<'main' | 'water' | 'diet' | 'medication' | 'symptom'>('main');

  useEffect(() => {
    if (!isOpen) {
      // Reset view after closing animation
      const timer = setTimeout(() => setView('main'), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleAddLog = (logData: Omit<LogData, 'type'>, type: LogData['type']) => {
    onAddLog({ type, ...logData } as LogData, new Date());
  };

  const renderContent = () => {
    switch (view) {
      case 'main':
        return (
          <div className="grid grid-cols-2 gap-4">
            <ActionButton icon={<WaterDropIcon className="w-8 h-8 text-sky-500" />} label="수분 섭취" onClick={() => setView('water')} />
            <ActionButton icon={<DietIcon className="w-8 h-8 text-amber-500" />} label="식단" onClick={() => setView('diet')} />
            <ActionButton icon={<MedicationIcon className="w-8 h-8 text-indigo-500" />} label="약물" onClick={() => setView('medication')} />
            <ActionButton icon={<SymptomIcon className="w-8 h-8 text-red-500" />} label="증상" onClick={() => setView('symptom')} />
          </div>
        );
      case 'water':
        return <WaterLogForm onSubmit={handleAddLog} />;
      case 'diet':
        return <QuickDietOrMedicationForm type="diet" onSubmit={(data) => handleAddLog({ data }, 'diet')} />;
       case 'medication':
        return <QuickDietOrMedicationForm type="medication" onSubmit={(data) => handleAddLog({ data }, 'medication')} />;
      case 'symptom':
        return <QuickSymptomForm onSubmit={(data) => handleAddLog({ data }, 'symptom')} />;
      default:
        return null;
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ${isOpen ? 'bg-opacity-60' : 'bg-opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="p-4 pt-5">
            <div className="flex items-center justify-between mb-4">
                {view !== 'main' ? (
                    <button onClick={() => setView('main')} className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                ) : <div className="w-10"></div> }
                 <h3 className="text-lg font-bold text-center text-slate-800 dark:text-slate-200">
                    빠른 기록
                </h3>
                <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <CloseIcon className="w-6 h-6" />
                </button>
            </div>
          {renderContent()}
        </div>
      </div>
    </>
  );
};

const ActionButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; }> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center p-4 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-sky-100 dark:hover:bg-sky-900/50 border-2 border-transparent hover:border-sky-500 transition-all h-28"
  >
    {icon}
    <span className="mt-2 font-semibold text-slate-700 dark:text-slate-200">{label}</span>
  </button>
);


const WaterLogForm: React.FC<{ onSubmit: (logData: { data: { fluidIntake: number } }, type: 'wellness') => void }> = ({ onSubmit }) => {
    const quickAmounts = [250, 500, 750];
    const [customAmount, setCustomAmount] = useState('');

    const handleQuickAdd = (amount: number) => {
        onSubmit({ data: { fluidIntake: amount } }, 'wellness');
    };
    
    const handleCustomSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseInt(customAmount, 10);
        if (amount > 0) {
            onSubmit({ data: { fluidIntake: amount } }, 'wellness');
        }
    }

    return (
        <div className="space-y-4 p-2">
            <div className="grid grid-cols-3 gap-3">
                {quickAmounts.map(amount => (
                    <Button key={amount} onClick={() => handleQuickAdd(amount)} variant="secondary" size="lg" className="h-20 text-xl">
                        {amount}ml
                    </Button>
                ))}
            </div>
            <form onSubmit={handleCustomSubmit} className="flex items-center gap-2">
                <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="직접 입력 (ml)"
                    className="flex-grow w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <Button type="submit" size="md">저장</Button>
            </form>
        </div>
    );
};

const QuickDietOrMedicationForm: React.FC<{ type: 'medication' | 'diet', onSubmit: (data: MedicationData | DietData) => void }> = ({ type, onSubmit }) => {
    const [name, setName] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        if (type === 'medication') {
            onSubmit({ name, timeOfDay: 'morning', intakeTime: new Date().toISOString() });
        } else {
            onSubmit({ description: name, timeOfDay: 'snack' });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-2">
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{type === 'medication' ? '약물 이름' : '음식/음료 설명'}</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder={type === 'medication' ? '예: 콜히친' : '예: 오렌지 주스'} className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"/>
            </div>
            <Button type="submit" size="lg" className="w-full">기록 저장</Button>
        </form>
    );
};

const QuickSymptomForm: React.FC<{ onSubmit: (data: SymptomData) => void }> = ({ onSubmit }) => {
    const [painLevel, setPainLevel] = useState(5);
    const [location, setLocation] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!location.trim()) return;
        onSubmit({ painLevel, location, symptoms: [] });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-2">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">통증 부위</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="예: 오른쪽 엄지발가락" required className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"/>
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">통증 강도: <span className="font-bold">{painLevel}</span>/10</label>
                <input type="range" min="0" max="10" value={painLevel} onChange={e => setPainLevel(Number(e.target.value))} className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-600"/>
            </div>
            <Button type="submit" size="lg" className="w-full">기록 저장</Button>
        </form>
    );
};


export default QuickLogDrawer;
