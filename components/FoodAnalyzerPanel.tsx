

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { MealAnalysis, AnalyzedFoodItem, LogEntry, Preferences, PurineIntakeData, PlannedMeal, MealSuggestion } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import Spinner from './common/Spinner';
import { analyzeMealFromImage, analyzeMealFromText, generateMealComparison, generateMealPlan, generateMealSuggestions } from '../services/geminiService';
import { CameraIcon, PencilIcon, TrashIcon, XIcon, StarIcon, SparklesIcon, ChevronLeftIcon, BeakerIcon, ClipboardCheckIcon, DocumentTextIcon, ImageIcon, PlusIcon, LightbulbIcon, SearchIcon } from './Icons';
import { useI18n } from '../hooks/useI18n';

interface FoodAnalyzerPanelProps {
    logs: LogEntry[];
    preferences: Preferences;
    history: MealAnalysis[];
    setHistory: React.Dispatch<React.SetStateAction<MealAnalysis[]>>;
    favoriteMeals: MealAnalysis[];
    onToggleFavorite: (meal: MealAnalysis) => void;
    onAddToDailyLog: (meal: MealAnalysis, timeOfDay: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void;
}

const getRiskLevelStyles = (level: MealAnalysis['overallRiskLevel']) => {
    switch (level) {
        case 'Low': return {
            indicator: 'bg-green-500', text: 'text-green-800 dark:text-green-300',
            bg: 'bg-green-100 dark:bg-green-900/50', border: 'border-green-300 dark:border-green-700',
        };
        case 'Moderate': return {
            indicator: 'bg-yellow-500', text: 'text-yellow-800 dark:text-yellow-300',
            bg: 'bg-yellow-100 dark:bg-yellow-900/50', border: 'border-yellow-300 dark:border-yellow-700',
        };
        case 'High': return {
            indicator: 'bg-red-500', text: 'text-red-800 dark:text-red-300',
            bg: 'bg-red-100 dark:bg-red-900/50', border: 'border-red-300 dark:border-red-700',
        };
        default: return {
            indicator: 'bg-slate-500', text: 'text-slate-800 dark:text-slate-300',
            bg: 'bg-slate-100 dark:bg-slate-700', border: 'border-slate-300 dark:border-slate-600',
        };
    }
};

const getPurineLevelColorForItem = (level: AnalyzedFoodItem['purineLevel']) => {
    switch (level) {
        case 'Low': return 'text-green-600 dark:text-green-400';
        case 'Moderate': return 'text-yellow-600 dark:text-yellow-400';
        case 'High': return 'text-orange-600 dark:text-orange-400';
        case 'Very High': return 'text-red-600 dark:text-red-400';
        default: return 'text-slate-500';
    }
};

const MealResult: React.FC<{
    meal: MealAnalysis;
    onAddToLog: (timeOfDay: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void;
    onToggleFavorite: () => void;
    isFavorite: boolean;
    onAnalyzeAnother: () => void;
}> = ({ meal, onAddToLog, onToggleFavorite, isFavorite, onAnalyzeAnother }) => {
    const { t } = useI18n();
    const styles = getRiskLevelStyles(meal.overallRiskLevel);
    const [showLogOptions, setShowLogOptions] = useState(false);
    
    const timeOfDayOptions: { id: 'breakfast' | 'lunch' | 'dinner' | 'snack', label: string }[] = [
        { id: 'breakfast', label: t('timeOfDay.breakfast') },
        { id: 'lunch', label: t('timeOfDay.lunch') },
        { id: 'dinner', label: t('timeOfDay.dinner') },
        { id: 'snack', label: t('timeOfDay.snack') },
    ];

    return (
        <div className="p-4 sm:p-6 space-y-4 max-w-3xl mx-auto">
            <Card className={`!p-4 sm:!p-6 ${styles.bg}`}>
                <div className="flex justify-between items-start">
                    <div>
                        <p className={`px-3 py-1 text-sm font-bold rounded-full inline-block ${styles.bg} ${styles.text} border ${styles.border}`}>{meal.overallRiskLevel}</p>
                        <h2 className="text-2xl sm:text-3xl font-bold mt-2 text-slate-800 dark:text-white">{meal.mealName}</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{meal.mealDescription}</p>
                    </div>
                     <button onClick={onToggleFavorite} className={`p-2 rounded-full transition-colors ${isFavorite ? 'text-yellow-500' : 'text-slate-400 hover:text-yellow-500'}`}>
                        <StarIcon filled={isFavorite} className="w-6 h-6"/>
                    </button>
                </div>

                <div className="mt-4 text-center">
                    <p className="text-sm text-slate-600 dark:text-slate-300">{t('food.overallPurineScore')}</p>
                    <p className={`text-5xl font-bold ${styles.text}`}>{meal.totalPurineScore} <span className="text-lg">/ 100</span></p>
                </div>
                <p className="mt-4 text-center text-sm text-slate-700 dark:text-slate-300 bg-white/50 dark:bg-black/20 p-3 rounded-lg">{meal.overallSummary}</p>
                 {meal.dailyImpactAnalysis && (
                    <div className="mt-4 p-3 rounded-lg bg-sky-100/50 dark:bg-sky-900/40 border border-sky-200 dark:border-sky-800">
                        <h4 className="font-semibold text-sky-800 dark:text-sky-300 flex items-center">
                            <DocumentTextIcon className="w-5 h-5 mr-2" />
                            {t('food.dailyIntakeAnalysis')}
                        </h4>
                        <p className="text-sm text-sky-700 dark:text-sky-400 mt-1">{meal.dailyImpactAnalysis}</p>
                    </div>
                )}
            </Card>
            
            <div className="grid grid-cols-2 gap-4">
                 <Button onClick={onAnalyzeAnother} variant="secondary">
                    <BeakerIcon className="w-5 h-5 mr-2" />
                    {t('food.analyzeAnother')}
                </Button>
                <div className="relative">
                    <Button onClick={() => setShowLogOptions(!showLogOptions)} className="w-full">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        {t('food.addToLog')}
                    </Button>
                    {showLogOptions && (
                        <div className="absolute bottom-full mb-2 w-full grid grid-cols-2 sm:grid-cols-4 gap-2 animate-fade-in">
                            {timeOfDayOptions.map(time => (
                                <Button key={time.id} variant="secondary" onClick={() => { onAddToLog(time.id); setShowLogOptions(false); }} className="capitalize">
                                    {time.label}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Card>
                <h3 className="text-lg font-bold mb-3">{t('food.ingredientAnalysis')}</h3>
                <ul className="space-y-3">
                    {meal.items.map((item, index) => (
                        <li key={index} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold">{item.foodName}</span>
                                <span className={`font-bold text-sm ${getPurineLevelColorForItem(item.purineLevel)}`}>{item.purineLevel} ({item.purineAmount})</span>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{item.explanation}</p>
                        </li>
                    ))}
                </ul>
            </Card>

            <Card>
                <h3 className="text-lg font-bold mb-2">{t('food.aiRecommendations')}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{meal.recommendations}</p>
            </Card>

            <Card>
                <h3 className="text-lg font-bold mb-2">{t('food.alternativeSuggestions')}</h3>
                <div className="flex flex-wrap gap-2">
                    {meal.alternatives.map((alt, index) => (
                        <span key={index} className="px-3 py-1 bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 rounded-full text-sm font-medium">{alt}</span>
                    ))}
                </div>
            </Card>
        </div>
    );
};

const Analyzer: React.FC<{
    onAnalysisComplete: (result: MealAnalysis) => void;
    preferences: Preferences;
    logs: LogEntry[];
    initialText?: string;
}> = ({ onAnalysisComplete, preferences, logs, initialText }) => {
    const { t } = useI18n();
    const [mode, setMode] = useState<'text' | 'image'>('text');
    const [text, setText] = useState(initialText || '');
    const [image, setImage] = useState<{ file: File, preview: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        if(initialText) {
            setText(initialText);
        }
    }, [initialText]);

    const currentPurineIntake = useMemo(() => {
        const today = new Date().toDateString();
        return logs
            .filter(log => log.type === 'purine_intake' && new Date(log.timestamp).toDateString() === today)
            .reduce((sum, log) => sum + (log.data as PurineIntakeData).totalPurineScore, 0);
    }, [logs]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage({ file, preview: URL.createObjectURL(file) });
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = error => reject(error);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((mode === 'text' && !text.trim()) || (mode === 'image' && !image)) return;
        setIsLoading(true);
        setError('');

        const context = { dailyPurineGoal: preferences.dailyPurineGoal, currentPurineIntake };
        let result: Omit<MealAnalysis, 'id'> | null = null;
        try {
             if (mode === 'text') {
                result = await analyzeMealFromText(text.trim(), context);
            } else if (image) {
                const base64 = await fileToBase64(image.file);
                result = await analyzeMealFromImage(base64, image.file.type, text.trim(), context);
            }
            if (result) {
                onAnalysisComplete({ ...result, id: `${Date.now()}` });
            } else {
                 setError(t('errors.aiAnalysisFailed'));
            }
        } catch (e) {
            console.error(e);
            setError(t('errors.analysisError'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 max-w-3xl mx-auto">
            <Card>
                <div className="p-1 bg-slate-200 dark:bg-slate-700 rounded-lg flex mb-4">
                    <button onClick={() => setMode('text')} className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${mode === 'text' ? 'bg-white dark:bg-slate-800 shadow' : 'text-slate-600 dark:text-slate-300'}`}>
                        <PencilIcon className="w-5 h-5 inline-block mr-2" />{t('food.analyzeWithText')}
                    </button>
                     <button onClick={() => setMode('image')} className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${mode === 'image' ? 'bg-white dark:bg-slate-800 shadow' : 'text-slate-600 dark:text-slate-300'}`}>
                        <CameraIcon className="w-5 h-5 inline-block mr-2" />{t('food.analyzeWithImage')}
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                     {mode === 'image' && (
                         <div>
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full h-40 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-sky-500 transition-colors">
                                {image ? (
                                    <div className="relative">
                                        <img src={image.preview} alt="upload preview" className="w-32 h-32 object-cover rounded-md" />
                                        <button type="button" onClick={(e) => { e.stopPropagation(); setImage(null); }} className="absolute -top-2 -right-2 bg-slate-600 text-white rounded-full p-1"><XIcon className="w-3 h-3"/></button>
                                    </div>
                                ) : (
                                    <>
                                        <ImageIcon className="w-10 h-10 text-slate-400" />
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-2">{t('food.choosePhoto')}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                    <textarea value={text} onChange={e => setText(e.target.value)} rows={mode === 'text' ? 4 : 2} placeholder={t(mode === 'text' ? 'food.textPlaceholder' : 'food.imagePlaceholder')} className="w-full p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg" />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Spinner/> : <><SparklesIcon className="w-5 h-5 mr-2" /> {t('food.requestAnalysis')}</>}
                    </Button>
                    {error && <p className="text-sm text-center text-red-500">{error}</p>}
                </form>
            </Card>
        </div>
    );
};

const MealComparison: React.FC<{
    meals: MealAnalysis[];
}> = ({ meals }) => {
    const { t } = useI18n();
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchComparison = async () => {
            setIsLoading(true);
            const res = await generateMealComparison(meals);
            setResult(res);
            setIsLoading(false);
        };
        fetchComparison();
    }, [meals]);

    return (
        <div className="p-4 sm:p-6 max-w-3xl mx-auto">
            <Card>
                <h2 className="text-xl font-bold mb-4">{t('food.mealComparison')}</h2>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    {meals.map(meal => (
                        <div key={meal.id} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-center">
                            <p className="font-semibold">{meal.mealName}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{meal.totalPurineScore} points</p>
                        </div>
                    ))}
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg min-h-[10rem] flex items-center justify-center">
                    {isLoading ? <Spinner/> : <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{result}</p>}
                </div>
            </Card>
        </div>
    );
};

const MealLibrary: React.FC<{
    history: MealAnalysis[];
    favoriteMeals: MealAnalysis[];
    onSelectMeal: (meal: MealAnalysis) => void;
    onToggleFavorite: (meal: MealAnalysis) => void;
    onDelete: (mealId: string) => void;
    onNewAnalysis: () => void;
    onCompare: (meals: MealAnalysis[]) => void;
    onMealPlan: () => void;
    onMealSearch: () => void;
}> = ({ history, favoriteMeals, onSelectMeal, onToggleFavorite, onDelete, onNewAnalysis, onCompare, onMealPlan, onMealSearch }) => {
    const { t } = useI18n();
    const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
    
    const handleToggleComparison = (id: string) => {
        setSelectedForComparison(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleCompareClick = () => {
        const mealsToCompare = history.filter(m => selectedForComparison.includes(m.id));
        if (mealsToCompare.length >= 2) {
            onCompare(mealsToCompare);
            setSelectedForComparison([]);
        }
    };

    return (
        <div className="p-4 sm:p-6 h-full flex flex-col max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-xl font-bold">{t('food.myMealLibrary')}</h2>
                <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={onMealSearch}>
                        <SearchIcon className="w-4 h-4 mr-1"/> {t('food.search')}
                    </Button>
                    <Button size="sm" variant="secondary" onClick={onMealPlan}>
                        <LightbulbIcon className="w-4 h-4 mr-1"/> {t('food.plan')}
                    </Button>
                    <Button size="sm" onClick={onNewAnalysis}>
                        <PlusIcon className="w-4 h-4 mr-1"/> {t('food.analyzeNew')}
                    </Button>
                </div>
            </div>
            
            <div className="flex-grow overflow-y-auto space-y-2 pr-2 -mr-2">
                {history.length === 0 ? (
                     <div className="text-center py-16 text-slate-500 dark:text-slate-400">
                        <BeakerIcon className="w-12 h-12 mx-auto mb-2" />
                        <p>{t('food.noHistory')}</p>
                        <p className="text-sm">{t('food.noHistoryDescription')}</p>
                    </div>
                ) : (
                    history.map(meal => {
                        const isFavorite = favoriteMeals.some(fm => fm.id === meal.id);
                        const isSelectedForCompare = selectedForComparison.includes(meal.id);
                        return (
                            <div key={meal.id} className={`p-3 rounded-lg flex items-center transition-colors ${isSelectedForCompare ? 'bg-sky-100 dark:bg-sky-900/50' : 'bg-slate-50 dark:bg-slate-700/50'}`}>
                                <input type="checkbox" checked={isSelectedForCompare} onChange={() => handleToggleComparison(meal.id)} className="mr-3 form-checkbox h-5 w-5 rounded text-sky-600 bg-slate-200 dark:bg-slate-600 border-slate-300 dark:border-slate-500 focus:ring-sky-500"/>
                                <div className="flex-grow cursor-pointer" onClick={() => onSelectMeal(meal)}>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">{meal.mealName}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('food.purineScore')}: {meal.totalPurineScore}</p>
                                </div>
                                <button onClick={() => onToggleFavorite(meal)} className={`p-1 rounded-full ${isFavorite ? 'text-yellow-500' : 'text-slate-400'}`}><StarIcon className="w-5 h-5" filled={isFavorite} /></button>
                                <button onClick={() => onDelete(meal.id)} className="p-1 rounded-full text-slate-400 hover:text-red-500"><TrashIcon className="w-5 h-5" /></button>
                            </div>
                        )
                    })
                )}
            </div>
             <div className="pt-4 mt-auto border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                 <Button className="w-full" disabled={selectedForComparison.length < 2} onClick={handleCompareClick}>
                    <ClipboardCheckIcon className="w-5 h-5 mr-2" />
                    {t('food.compareSelected', { count: selectedForComparison.length })}
                </Button>
            </div>
        </div>
    );
};

const MealPlanner: React.FC = () => {
    const { t } = useI18n();
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<PlannedMeal[] | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        setIsLoading(true);
        setError('');
        setResult(null);
        try {
            const plan = await generateMealPlan(prompt);
            if (plan) {
                setResult(plan);
            } else {
                setError(t('errors.aiMealPlanError'));
            }
        } catch (err) {
            console.error(err);
            setError(t('errors.mealPlanGenerationError'));
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
            <Card>
                <div className="text-center">
                    <LightbulbIcon className="w-12 h-12 mx-auto text-yellow-400 mb-2" />
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('food.mealPlannerTitle')}</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-300">{t('food.mealPlannerDescription')}</p>
                </div>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={3}
                        placeholder={t('food.mealPlannerPlaceholder')}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg"
                        disabled={isLoading}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Spinner /> : <><SparklesIcon className="w-5 h-5 mr-2" /> {t('food.getAiMealPlan')}</>}
                    </Button>
                    {error && <p className="text-sm text-center text-red-500">{error}</p>}
                </form>
            </Card>

            {result && (
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-center">{t('food.aiRecommendedMealPlan')}</h3>
                    {result.map((meal, index) => (
                        <Card key={index}>
                            <h4 className="text-lg font-bold text-sky-700 dark:text-sky-400">{meal.mealName}</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{meal.description}</p>
                            <div className="mt-3 text-xs font-semibold flex items-center space-x-4">
                                <span>{t('food.purineScore')}: {meal.estimatedPurineScore}</span>
                                <span>{t('food.risk')}: {meal.riskLevel}</span>
                            </div>

                            <div className="mt-4">
                                <h5 className="font-semibold mb-2">{t('food.ingredients')}</h5>
                                <div className="flex flex-wrap gap-2">
                                    {meal.ingredients.map((ing, i) => (
                                        <span key={i} className="px-2 py-1 bg-slate-200 dark:bg-slate-600 rounded-md text-sm">{ing}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-4">
                                <h5 className="font-semibold mb-2">{t('food.recipe')}</h5>
                                <p className="text-sm whitespace-pre-wrap bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">{meal.recipe}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

const MealSearch: React.FC<{
    onSuggestionSelect: (mealName: string) => void;
}> = ({ onSuggestionSelect }) => {
    const { t } = useI18n();
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [results, setResults] = useState<MealSuggestion[] | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        setIsLoading(true);
        setError('');
        setResults(null);
        try {
            const suggestions = await generateMealSuggestions(prompt);
            if (suggestions) {
                setResults(suggestions);
            } else {
                setError(t('errors.aiMealSearchError'));
            }
        } catch (err) {
            console.error(err);
            setError(t('errors.mealSearchError'));
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
         <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
            <Card>
                <div className="text-center">
                    <SearchIcon className="w-12 h-12 mx-auto text-sky-500 mb-2" />
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('food.mealSearchTitle')}</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-300">{t('food.mealSearchDescription')}</p>
                </div>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={2}
                        placeholder={t('food.mealSearchPlaceholder')}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg"
                        disabled={isLoading}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Spinner /> : <><SparklesIcon className="w-5 h-5 mr-2" /> {t('food.getAiMealSuggestions')}</>}
                    </Button>
                    {error && <p className="text-sm text-center text-red-500">{error}</p>}
                </form>
            </Card>

            {results && (
                <div className="space-y-3">
                     <h3 className="text-xl font-bold text-center">{t('food.aiRecommendedMeals')}</h3>
                    {results.map((meal, index) => (
                        <Card 
                            key={index} 
                            className="!p-4 cursor-pointer hover:shadow-xl hover:border-sky-500 border-2 border-transparent transition-all"
                            onClick={() => onSuggestionSelect(meal.mealName)}
                        >
                            <h4 className="font-bold text-sky-700 dark:text-sky-400">{meal.mealName}</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{meal.description}</p>
                            <div className="mt-2 text-xs font-semibold">
                                <span>{t('food.estPurineScore')}: {meal.estimatedPurineScore}</span>
                                <span className="mx-2">|</span>
                                <span>{t('food.risk')}: {meal.riskLevel}</span>
                            </div>
                        </Card>
                    ))}
                     <p className="text-xs text-center text-slate-500 dark:text-slate-400 pt-2">
                        {t('food.clickForAnalysis')}
                    </p>
                </div>
            )}
        </div>
    );
};


const FoodAnalyzerPanel: React.FC<FoodAnalyzerPanelProps> = ({ logs, preferences, history, setHistory, favoriteMeals, onToggleFavorite, onAddToDailyLog }) => {
    const { t } = useI18n();
    type View = 'library' | 'analyzer' | 'result' | 'comparison' | 'planner' | 'search';
    const [view, setView] = useState<View>('library');
    const [selectedMeal, setSelectedMeal] = useState<MealAnalysis | null>(null);
    const [comparisonMeals, setComparisonMeals] = useState<MealAnalysis[]>([]);
    const [initialAnalyzerText, setInitialAnalyzerText] = useState('');
    
    const handleAnalysisComplete = useCallback((result: MealAnalysis) => {
        setHistory(prev => [result, ...prev.filter(item => item.id !== result.id)]);
        setSelectedMeal(result);
        setView('result');
    }, [setHistory]);

    const handleSelectMeal = useCallback((meal: MealAnalysis) => {
        setSelectedMeal(meal);
        setView('result');
    }, []);

    const handleDeleteMeal = useCallback((mealId: string) => {
        setHistory(prev => prev.filter(m => m.id !== mealId));
        if (selectedMeal?.id === mealId) {
            setSelectedMeal(null);
            setView('library');
        }
    }, [selectedMeal, setHistory]);
    
    const handleCompare = useCallback((meals: MealAnalysis[]) => {
        if (meals.length >= 2) {
            setComparisonMeals(meals);
            setView('comparison');
        }
    }, []);
    
    const handleSuggestionSelect = (mealName: string) => {
        setInitialAnalyzerText(mealName);
        setView('analyzer');
    };

    const isFavorite = useMemo(() => {
        if (!selectedMeal) return false;
        return favoriteMeals.some(fm => fm.id === selectedMeal.id);
    }, [selectedMeal, favoriteMeals]);

    const handleBack = () => {
        setView('library');
        setSelectedMeal(null);
        setComparisonMeals([]);
        setInitialAnalyzerText('');
    }
    
    const handleAnalyzeAnother = () => {
        setSelectedMeal(null);
        setInitialAnalyzerText('');
        setView('analyzer');
    };

    const renderContent = () => {
        switch (view) {
            case 'analyzer':
                return <Analyzer 
                    onAnalysisComplete={handleAnalysisComplete} 
                    preferences={preferences} 
                    logs={logs}
                    initialText={initialAnalyzerText}
                />;
            case 'planner':
                return <MealPlanner />;
            case 'search':
                return <MealSearch onSuggestionSelect={handleSuggestionSelect} />;
            case 'result':
                if (selectedMeal) {
                    return <MealResult
                        meal={selectedMeal}
                        onAddToLog={(timeOfDay) => onAddToDailyLog(selectedMeal, timeOfDay)}
                        onToggleFavorite={() => onToggleFavorite(selectedMeal)}
                        isFavorite={isFavorite}
                        onAnalyzeAnother={handleAnalyzeAnother}
                    />;
                }
                setView('library'); // Fallback to library if no meal is selected
                return null;
            case 'comparison':
                return <MealComparison meals={comparisonMeals} />;
            case 'library':
            default:
                return <MealLibrary
                    history={history}
                    favoriteMeals={favoriteMeals}
                    onSelectMeal={handleSelectMeal}
                    onToggleFavorite={onToggleFavorite}
                    onDelete={handleDeleteMeal}
                    onNewAnalysis={() => setView('analyzer')}
                    onCompare={handleCompare}
                    onMealPlan={() => setView('planner')}
                    onMealSearch={() => setView('search')}
                />;
        }
    }

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950">
            {view !== 'library' && (
                <div className="p-2 flex-shrink-0">
                    <Button variant="secondary" size="sm" onClick={handleBack}>
                        <ChevronLeftIcon className="w-5 h-5 mr-1"/>
                        {t('food.backToLibrary')}
                    </Button>
                </div>
            )}
            <div className="flex-grow overflow-y-auto">
                {renderContent()}
            </div>
        </div>
    );
};

export default FoodAnalyzerPanel;
