

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { LogType, LogData, SymptomData, MedicationData, WellnessData, Preferences, HydrationData, AlcoholData, LogEntry, MealAnalysis, PurineIntakeData, MedicationInfo } from '../types';
import Button from './common/Button';
import Spinner from './common/Spinner';
import { getLogIcon } from '../utils/logUtils';
import { CloseIcon, SymptomIcon, MedicationIcon, HeartIcon, CameraIcon, PlusIcon, ChevronLeftIcon, ImageIcon, XIcon, WaterDropIcon, AlcoholIcon, BeerIcon, SojuIcon, WineIcon, ScaleIcon, MoonIcon, FaceFrownIcon, RunningIcon, BeakerIcon, StarIcon, SparklesIcon, BookOpenIcon } from './Icons';
import { analyzeMealFromText } from '../services/geminiService';
import { useI18n } from '../hooks/useI18n';

interface LogModalProps {
  date: Date;
  onClose: () => void;
  onAddLog: (log: LogData, date: Date) => void;
  preferences: Preferences;
  logs: LogEntry[];
  foodHistory: MealAnalysis[];
  setFoodHistory: React.Dispatch<React.SetStateAction<MealAnalysis[]>>;
  favoriteMeals: MealAnalysis[];
  myMedications: MedicationInfo[];
  setMyMedications: React.Dispatch<React.SetStateAction<MedicationInfo[]>>;
  onToggleFavorite: (meal: MealAnalysis) => void;
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

const SymptomForm: React.FC<{ onSubmit: (data: SymptomData) => void; logs: LogEntry[] }> = ({ onSubmit, logs }) => {
    const { t } = useI18n();
    const [painLevel, setPainLevel] = useState(5);
    const [location, setLocation] = useState('');
    const [symptoms, setSymptoms] = useState<SymptomData['symptoms']>([]);
    const [notes, setNotes] = useState('');
    const [photo, setPhoto] = useState<{ file: File, preview: string, base64: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const locationSuggestions = useMemo(() =>
        [...new Set(logs.filter(l => l.type === 'symptom').map(l => (l.data as SymptomData).location))]
    , [logs]);

    const handleSymptomToggle = (symptom: SymptomData['symptoms'][number]) => {
        setSymptoms(prev => prev.includes(symptom) ? prev.filter(item => item !== symptom) : [...prev, symptom]);
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = error => reject(error);
        });
    };
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const preview = URL.createObjectURL(file);
            const base64 = await fileToBase64(file);
            setPhoto({ file, preview, base64 });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            location,
            painLevel,
            symptoms,
            notes,
            photo: photo?.base64
        });
    };
    
    const symptomTypes: { id: SymptomData['symptoms'][number], label: string }[] = [
        { id: 'swelling', label: t('logModal.symptom.swelling') },
        { id: 'redness', label: t('logModal.symptom.redness') },
        { id: 'warmth', label: t('logModal.symptom.warmth') },
    ];

    return (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('logModal.symptom.locationLabel')}</label>
                <AutocompleteInput value={location} onChange={setLocation} suggestions={locationSuggestions} placeholder={t('logModal.symptom.locationPlaceholder')} required />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('logModal.symptom.painLevelLabel')}: <span className="font-bold">{painLevel}</span>/10</label>
                <input type="range" min="0" max="10" value={painLevel} onChange={e => setPainLevel(Number(e.target.value))} className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-600"/>
            </div>
            <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('logModal.symptom.detailsLabel')}</label>
                <div className="flex space-x-2">
                    {symptomTypes.map(symptom => (
                        <button type="button" key={symptom.id} onClick={() => handleSymptomToggle(symptom.id)} className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors capitalize ${symptoms.includes(symptom.id) ? 'bg-sky-600 text-white' : 'bg-slate-200 dark:bg-slate-600'}`}>
                            {symptom.label}
                        </button>
                    ))}
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('logModal.notesLabel')}</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder={t('logModal.symptom.notesPlaceholder')} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"/>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('logModal.symptom.attachPhotoLabel')}</label>
                 <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                 <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-sky-500 transition-colors">
                    {photo ? (
                        <div className="relative">
                            <img src={photo.preview} alt="symptom preview" className="w-20 h-20 object-cover rounded-md" />
                            <button onClick={() => setPhoto(null)} className="absolute -top-2 -right-2 bg-slate-600 text-white rounded-full p-1"><XIcon className="w-3 h-3"/></button>
                        </div>
                    ) : (
                        <>
                            <ImageIcon className="w-6 h-6 mr-2 text-slate-500" />
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('logModal.symptom.choosePhoto')}</span>
                        </>
                    )}
                </button>
            </div>
            <Button type="submit" className="w-full">{t('logModal.saveLog')}</Button>
        </form>
    );
};

const HydrationForm: React.FC<{ onSubmit: (data: HydrationData) => void; preferences: Preferences }> = ({ onSubmit, preferences }) => {
    const { t } = useI18n();
    const [amount, setAmount] = useState(250);
    const [notes, setNotes] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ amount, notes });
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('logModal.hydration.amountLabel', { unit: preferences.fluidUnit })}</label>
                <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg" required/>
                <div className="flex space-x-2 mt-2">
                    {[250, 500, 1000].map(val => (
                         <button type="button" key={val} onClick={() => setAmount(val)} className={`flex-1 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${amount === val ? 'bg-sky-600 text-white' : 'bg-slate-200 dark:bg-slate-600'}`}>{val}{preferences.fluidUnit}</button>
                    ))}
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('logModal.notesLabel')}</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder={t('logModal.hydration.notesPlaceholder')} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"/>
            </div>
            <Button type="submit" className="w-full">{t('logModal.saveLog')}</Button>
        </form>
    );
};

const AlcoholForm: React.FC<{ onSubmit: (data: AlcoholData) => void; preferences: Preferences }> = ({ onSubmit, preferences }) => {
    const { t } = useI18n();
    const [type, setType] = useState('Beer');
    const [amount, setAmount] = useState(500);
    const [notes, setNotes] = useState('');

    const alcoholTypes = [
        { name: t('logModal.alcohol.beer'), icon: <BeerIcon/>, defaultAmount: 500, id: 'Beer' },
        { name: t('logModal.alcohol.soju'), icon: <SojuIcon/>, defaultAmount: 180, id: 'Soju' },
        { name: t('logModal.alcohol.wine'), icon: <WineIcon/>, defaultAmount: 150, id: 'Wine' },
    ];
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ type, amount, notes });
    };

    return (
         <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('logModal.alcohol.typeLabel')}</label>
                <div className="grid grid-cols-3 gap-2">
                    {alcoholTypes.map(item => (
                        <button type="button" key={item.id} onClick={() => { setType(item.id); setAmount(item.defaultAmount); }} className={`p-2 rounded-lg flex flex-col items-center justify-center transition-colors ${type === item.id ? 'bg-sky-600 text-white' : 'bg-slate-200 dark:bg-slate-600'}`}>
                           <div className="w-6 h-6 mb-1">{item.icon}</div>
                           <span className="text-sm font-semibold">{item.name}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('logModal.alcohol.amountLabel', { unit: preferences.fluidUnit })}</label>
                <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg" required/>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('logModal.notesLabel')}</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder={t('logModal.alcohol.notesPlaceholder')} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"/>
            </div>
            <Button type="submit" className="w-full">{t('logModal.saveLog')}</Button>
        </form>
    );
};

const WellnessForm: React.FC<{ onSubmit: (data: WellnessData) => void; preferences: Preferences }> = ({ onSubmit, preferences }) => {
    const { t } = useI18n();
    const [weight, setWeight] = useState<string>('');
    const [sleepHours, setSleepHours] = useState<string>('');
    const [stressLevel, setStressLevel] = useState<WellnessData['stressLevel'] | undefined>(undefined);
    const [activity, setActivity] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            weight: weight ? Number(weight) : undefined,
            sleepHours: sleepHours ? Number(sleepHours) : undefined,
            stressLevel,
            activity: activity || undefined,
            notes: notes || undefined
        });
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('logModal.wellness.weightLabel', { unit: preferences.weightUnit })}</label>
                    <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="75.5" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('logModal.wellness.sleepLabel')}</label>
                    <input type="number" step="0.5" value={sleepHours} onChange={e => setSleepHours(e.target.value)} placeholder="7.5" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg" />
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('logModal.wellness.stressLabel')}</label>
                <div className="flex justify-between">
                    {[1, 2, 3, 4, 5].map(level => (
                         <button type="button" key={level} onClick={() => setStressLevel(level as WellnessData['stressLevel'])} className={`w-10 h-10 rounded-full text-lg font-bold transition-colors ${stressLevel === level ? 'bg-sky-600 text-white' : 'bg-slate-200 dark:bg-slate-600'}`}>{level}</button>
                    ))}
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('logModal.wellness.activityLabel')}</label>
                <input type="text" value={activity} onChange={e => setActivity(e.target.value)} placeholder={t('logModal.wellness.activityPlaceholder')} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"/>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('logModal.notesLabelFull')}</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder={t('logModal.wellness.notesPlaceholder')} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg"/>
            </div>
            <Button type="submit" className="w-full">{t('logModal.saveLog')}</Button>
        </form>
    );
};

const MedicationForm: React.FC<{ 
    onSubmit: (data: MedicationData) => void; 
    myMedications: MedicationInfo[];
    setMyMedications: React.Dispatch<React.SetStateAction<MedicationInfo[]>>;
}> = ({ onSubmit, myMedications, setMyMedications }) => {
    const { t } = useI18n();
    const [name, setName] = useState(myMedications[0]?.name || '');
    const [timeOfDay, setTimeOfDay] = useState<'morning' | 'lunch' | 'dinner' | 'bedtime'>('morning');
    const [dosage, setDosage] = useState('');
    const [unit, setUnit] = useState('');

    const medicationSuggestions = useMemo(() => myMedications.map(m => m.name), [myMedications]);
    
    const timeOfDayOptions: { id: typeof timeOfDay, label: string }[] = [
        { id: 'morning', label: t('timeOfDay.morning') },
        { id: 'lunch', label: t('timeOfDay.lunch') },
        { id: 'dinner', label: t('timeOfDay.dinner') },
        { id: 'bedtime', label: t('timeOfDay.bedtime') },
    ];


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        if (!myMedications.some(med => med.name.toLowerCase() === name.trim().toLowerCase())) {
            const newMed: MedicationInfo = { id: `${Date.now()}`, name: name.trim() };
            setMyMedications(prev => [newMed, ...prev]);
        }

        onSubmit({ 
            name: name.trim(), 
            timeOfDay, 
            intakeTime: new Date().toISOString(),
            dosage: dosage || undefined,
            unit: unit || undefined,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('logModal.medication.nameLabel')}</label>
                <AutocompleteInput value={name} onChange={setName} suggestions={medicationSuggestions} placeholder={t('logModal.medication.namePlaceholder')} required />
            </div>
             <div className="grid grid-cols-5 gap-2">
                <div className="col-span-3">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('logModal.medication.dosageLabel')}</label>
                    <input type="number" value={dosage} onChange={e => setDosage(e.target.value)} placeholder={t('logModal.medication.dosagePlaceholder')} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg" />
                </div>
                 <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('logModal.medication.unitLabel')}</label>
                    <input type="text" value={unit} onChange={e => setUnit(e.target.value)} placeholder={t('logModal.medication.unitPlaceholder')} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg" />
                </div>
            </div>
            <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('logModal.timeOfDayLabel')}</label>
                <div className="grid grid-cols-4 gap-2">
                    {timeOfDayOptions.map(t => (
                        <button type="button" key={t.id} onClick={() => setTimeOfDay(t.id)} className={`px-2 py-2 rounded-lg text-sm font-semibold transition-colors capitalize ${timeOfDay === t.id ? 'bg-sky-600 text-white' : 'bg-slate-200 dark:bg-slate-600'}`}>
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>
            <Button type="submit" className="w-full">{t('logModal.medication.logIntake')}</Button>
        </form>
    );
};

const PurineIntakeForm: React.FC<{
    onSubmit: (data: PurineIntakeData) => void;
    foodHistory: MealAnalysis[];
    favoriteMeals: MealAnalysis[];
}> = ({ onSubmit, foodHistory, favoriteMeals }) => {
    const { t } = useI18n();
    const [tab, setTab] = useState<'history' | 'favorites' | 'new'>('new');
    const [selectedMeal, setSelectedMeal] = useState<MealAnalysis | null>(null);
    const [timeOfDay, setTimeOfDay] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');

    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    const timeOfDayOptions: { id: typeof timeOfDay, label: string }[] = [
        { id: 'breakfast', label: t('timeOfDay.breakfast') },
        { id: 'lunch', label: t('timeOfDay.lunch') },
        { id: 'dinner', label: t('timeOfDay.dinner') },
        { id: 'snack', label: t('timeOfDay.snack') },
    ];


    const handleAnalysisSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;
        setIsLoading(true);
        setError('');
        const result = await analyzeMealFromText(text.trim());
        if (result) {
            setSelectedMeal({ ...result, id: `${Date.now()}` });
        } else {
            setError(t('errors.aiAnalysisFailed'));
        }
        setIsLoading(false);
    };

    const handleSubmit = () => {
        if (selectedMeal) {
            onSubmit({ ...selectedMeal, timeOfDay });
        }
    };

    const MealListItem: React.FC<{meal: MealAnalysis}> = ({ meal }) => (
        <li onClick={() => setSelectedMeal(meal)} className={`p-3 rounded-lg cursor-pointer border-2 ${selectedMeal?.id === meal.id ? 'bg-sky-50 border-sky-500 dark:bg-sky-900/50' : 'bg-slate-100 border-transparent dark:bg-slate-700/50'}`}>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{meal.mealName}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('food.purineScore')}: {meal.totalPurineScore}</p>
        </li>
    );

    return (
        <div className="p-4 space-y-4">
             {selectedMeal ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 space-y-3">
                     <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{selectedMeal.mealName}</p>
                     <p className="text-sm text-slate-600 dark:text-slate-300">{t('food.purineScore')}: {selectedMeal.totalPurineScore} / 100 ({selectedMeal.overallRiskLevel})</p>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('logModal.timeOfDayLabel')}</label>
                        <div className="grid grid-cols-4 gap-2">
                            {timeOfDayOptions.map(t => (
                                <button type="button" key={t.id} onClick={() => setTimeOfDay(t.id)} className={`px-2 py-2 rounded-lg text-sm font-semibold transition-colors capitalize ${timeOfDay === t.id ? 'bg-sky-600 text-white' : 'bg-slate-200 dark:bg-slate-600'}`}>
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>
                     <div className="flex gap-2 pt-2">
                        <Button onClick={handleSubmit} className="w-full">{t('logModal.saveLog')}</Button>
                        <Button variant="secondary" onClick={() => setSelectedMeal(null)}>{t('logModal.reselect')}</Button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex rounded-lg bg-slate-200 dark:bg-slate-700 p-1">
                        <button onClick={() => setTab('new')} className={`w-1/3 py-1.5 text-sm font-semibold rounded-md ${tab === 'new' ? 'bg-white dark:bg-slate-800 shadow-sm' : ''}`}>{t('logModal.diet.newAnalysis')}</button>
                        <button onClick={() => setTab('history')} className={`w-1/3 py-1.5 text-sm font-semibold rounded-md ${tab === 'history' ? 'bg-white dark:bg-slate-800 shadow-sm' : ''}`}>{t('logModal.diet.history')}</button>
                        <button onClick={() => setTab('favorites')} className={`w-1/3 py-1.5 text-sm font-semibold rounded-md ${tab === 'favorites' ? 'bg-white dark:bg-slate-800 shadow-sm' : ''}`}>{t('logModal.diet.favorites')}</button>
                    </div>

                    {tab === 'new' && (
                        <form onSubmit={handleAnalysisSubmit} className="space-y-2">
                            <textarea value={text} onChange={e => setText(e.target.value)} rows={2} placeholder={t('logModal.diet.placeholder')} className="w-full p-2 bg-slate-50 dark:bg-slate-700 border rounded-lg" />
                            <Button type="submit" disabled={isLoading} className="w-full">{isLoading ? <Spinner /> : <><SparklesIcon className="w-5 h-5 mr-2" /> {t('logModal.diet.analyzeWithAi')}</>}</Button>
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        </form>
                    )}
                    
                    {tab === 'history' && <ul className="space-y-2 max-h-60 overflow-y-auto">{foodHistory.map(meal => <MealListItem key={meal.id} meal={meal} />)}</ul>}
                    {tab === 'favorites' && <ul className="space-y-2 max-h-60 overflow-y-auto">{favoriteMeals.map(meal => <MealListItem key={meal.id} meal={meal} />)}</ul>}
                </>
            )}
        </div>
    );
};

const LogModal: React.FC<LogModalProps> = ({ date, onClose, onAddLog, preferences, logs, foodHistory, setFoodHistory, favoriteMeals, myMedications, setMyMedications, onToggleFavorite }) => {
  const { t, locale } = useI18n();
  const [activeView, setActiveView] = useState<'main' | LogType>('main');

  const handleAddLogAndClose = (logData: LogData) => {
    onAddLog(logData, date);
    onClose();
  };

  const viewTitles: Record<LogType | 'main', string> = {
    main: t('logModal.addLogTitle', { date: date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' }) }),
    symptom: t('logModal.symptom.title'),
    purine_intake: t('logModal.diet.title'),
    medication: t('logModal.medication.title'),
    hydration: t('logModal.hydration.title'),
    alcohol: t('logModal.alcohol.title'),
    wellness: t('logModal.wellness.title')
  };

  const LogTypeButton: React.FC<{ type: LogType, label: string }> = ({ type, label }) => (
    <button onClick={() => setActiveView(type)} className="flex flex-col items-center justify-center p-4 bg-slate-100 dark:bg-slate-700/50 rounded-xl hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors">
        {getLogIcon(type, "w-8 h-8 mb-2")}
        <span className="font-semibold text-slate-700 dark:text-slate-200">{label}</span>
    </button>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'symptom':
        return <SymptomForm logs={logs} onSubmit={(data) => handleAddLogAndClose({type: 'symptom', data})} />;
      case 'hydration':
        return <HydrationForm preferences={preferences} onSubmit={(data) => handleAddLogAndClose({type: 'hydration', data})} />;
      case 'alcohol':
        return <AlcoholForm preferences={preferences} onSubmit={(data) => handleAddLogAndClose({type: 'alcohol', data})} />;
      case 'wellness':
        return <WellnessForm preferences={preferences} onSubmit={(data) => handleAddLogAndClose({type: 'wellness', data})} />;
      case 'purine_intake':
        return <PurineIntakeForm 
            onSubmit={(data) => handleAddLogAndClose({type: 'purine_intake', data})}
            foodHistory={foodHistory}
            favoriteMeals={favoriteMeals}
        />;
      case 'medication':
        return <MedicationForm 
            onSubmit={(data) => handleAddLogAndClose({type: 'medication', data})}
            myMedications={myMedications}
            setMyMedications={setMyMedications}
        />;
      case 'main':
      default:
        return (
             <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                <LogTypeButton type="symptom" label={t('logModal.symptom.title')} />
                <LogTypeButton type="purine_intake" label={t('logModal.diet.title')} />
                <LogTypeButton type="medication" label={t('logModal.medication.title')} />
                <LogTypeButton type="hydration" label={t('logModal.hydration.title')} />
                <LogTypeButton type="alcohol" label={t('logModal.alcohol.title')} />
                <LogTypeButton type="wellness" label={t('logModal.wellness.title')} />
            </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg mx-auto relative transform transition-all animate-slide-up sm:animate-fade-in" 
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          {activeView !== 'main' && (
            <button onClick={() => setActiveView('main')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
                <ChevronLeftIcon />
            </button>
          )}
          <h2 className={`text-lg font-bold text-slate-800 dark:text-slate-100 ${activeView === 'main' ? 'w-full text-center' : ''}`}>
            {viewTitles[activeView]}
          </h2>
           <button onClick={onClose} className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 ${activeView === 'main' ? 'absolute top-2 right-2' : ''}`}>
                <CloseIcon />
            </button>
        </header>
        <div className="max-h-[70vh] overflow-y-auto">
            {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default LogModal;
