
import React, { useState, useCallback, useMemo } from 'react';
import type { MealAnalysis, LogEntry, Preferences, PurineIntakeData } from '../types';
import Button from './common/Button';
import { TrashIcon, StarIcon, PlusIcon, LightbulbIcon, SearchIcon, ClipboardCheckIcon, BeakerIcon } from './Icons';
import { useI18n } from '../hooks/useI18n';
import AnalyzerModal from './food/AnalyzerModal';
import MealResultModal from './food/MealResultModal';
import MealComparisonModal from './food/MealComparisonModal';
import MealPlannerModal from './food/MealPlannerModal';
import MealSearchModal from './food/MealSearchModal';

interface FoodAnalyzerPanelProps {
    logs: LogEntry[];
    preferences: Preferences;
    history: MealAnalysis[];
    setHistory: React.Dispatch<React.SetStateAction<MealAnalysis[]>>;
    favoriteMeals: MealAnalysis[];
    onToggleFavorite: (meal: MealAnalysis) => void;
    onAddToDailyLog: (meal: MealAnalysis, timeOfDay: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void;
}

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
        <div className="p-4 sm:p-6 h-full flex flex-col max-w-4xl mx-auto w-full">
            <div className="flex justify-between items-center mb-4 flex-shrink-0 flex-wrap gap-2">
                <h2 className="text-xl font-bold">{t('food.myMealLibrary')}</h2>
                <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={onMealSearch}>
                        <SearchIcon className="w-4 h-4 sm:mr-1"/> <span className="hidden sm:inline">{t('food.search')}</span>
                    </Button>
                    <Button size="sm" variant="secondary" onClick={onMealPlan}>
                        <LightbulbIcon className="w-4 h-4 sm:mr-1"/> <span className="hidden sm:inline">{t('food.plan')}</span>
                    </Button>
                    <Button size="sm" onClick={onNewAnalysis}>
                        <PlusIcon className="w-4 h-4 sm:mr-1"/> <span className="hidden sm:inline">{t('food.analyzeNew')}</span>
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

const FoodAnalyzerPanel: React.FC<FoodAnalyzerPanelProps> = ({ logs, preferences, history, setHistory, favoriteMeals, onToggleFavorite, onAddToDailyLog }) => {
    type ActiveModal = 'analyzer' | 'result' | 'comparison' | 'planner' | 'search' | null;
    const [activeModal, setActiveModal] = useState<ActiveModal>(null);

    const [selectedMeal, setSelectedMeal] = useState<MealAnalysis | null>(null);
    const [comparisonMeals, setComparisonMeals] = useState<MealAnalysis[]>([]);
    const [initialAnalyzerText, setInitialAnalyzerText] = useState('');
    
    const handleAnalysisComplete = useCallback((result: MealAnalysis) => {
        setHistory(prev => [result, ...prev.filter(item => item.id !== result.id)]);
        setSelectedMeal(result);
        setActiveModal('result');
    }, [setHistory]);

    const handleSelectMeal = useCallback((meal: MealAnalysis) => {
        setSelectedMeal(meal);
        setActiveModal('result');
    }, []);

    const handleDeleteMeal = useCallback((mealId: string) => {
        setHistory(prev => prev.filter(m => m.id !== mealId));
        if (selectedMeal?.id === mealId) {
            setSelectedMeal(null);
            setActiveModal(null);
        }
    }, [selectedMeal, setHistory]);
    
    const handleCompare = useCallback((meals: MealAnalysis[]) => {
        if (meals.length >= 2) {
            setComparisonMeals(meals);
            setActiveModal('comparison');
        }
    }, []);
    
    const handleSuggestionSelect = (mealName: string) => {
        setInitialAnalyzerText(mealName);
        setActiveModal('analyzer');
    };

    const handleCloseModal = () => {
        setActiveModal(null);
        setSelectedMeal(null);
        setComparisonMeals([]);
        setInitialAnalyzerText('');
    };

    const isFavorite = useMemo(() => {
        if (!selectedMeal) return false;
        return favoriteMeals.some(fm => fm.id === selectedMeal.id);
    }, [selectedMeal, favoriteMeals]);

    return (
        <div className="h-full flex flex-col w-full">
            <MealLibrary
                history={history}
                favoriteMeals={favoriteMeals}
                onSelectMeal={handleSelectMeal}
                onToggleFavorite={onToggleFavorite}
                onDelete={handleDeleteMeal}
                onNewAnalysis={() => setActiveModal('analyzer')}
                onCompare={handleCompare}
                onMealPlan={() => setActiveModal('planner')}
                onMealSearch={() => setActiveModal('search')}
            />
            
            {activeModal === 'analyzer' && (
                <AnalyzerModal
                    isOpen={true}
                    onClose={handleCloseModal}
                    onAnalysisComplete={handleAnalysisComplete}
                    preferences={preferences}
                    logs={logs}
                    initialText={initialAnalyzerText}
                />
            )}
            {activeModal === 'result' && selectedMeal && (
                 <MealResultModal
                    isOpen={true}
                    onClose={handleCloseModal}
                    meal={selectedMeal}
                    isFavorite={isFavorite}
                    onAddToLog={(timeOfDay) => {
                        onAddToDailyLog(selectedMeal, timeOfDay);
                        handleCloseModal();
                    }}
                    onToggleFavorite={() => onToggleFavorite(selectedMeal)}
                 />
            )}
            {activeModal === 'comparison' && (
                <MealComparisonModal
                    isOpen={true}
                    onClose={handleCloseModal}
                    meals={comparisonMeals}
                />
            )}
            {activeModal === 'planner' && (
                <MealPlannerModal isOpen={true} onClose={handleCloseModal} />
            )}
            {activeModal === 'search' && (
                <MealSearchModal
                    isOpen={true}
                    onClose={handleCloseModal}
                    onSuggestionSelect={handleSuggestionSelect}
                />
            )}
        </div>
    );
};

export default FoodAnalyzerPanel;
