
import React, { useState } from 'react';
import type { MealSuggestion } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { generateMealSuggestions } from '../../services/geminiService';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import Card from '../common/Card';
import { CloseIcon, SearchIcon, SparklesIcon } from '../Icons';

interface MealSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuggestionSelect: (mealName: string) => void;
}

const MealSearchModal: React.FC<MealSearchModalProps> = ({ isOpen, onClose, onSuggestionSelect }) => {
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
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-3xl mx-auto relative transform transition-all animate-slide-up sm:animate-fade-in" 
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('food.mealSearchTitle')}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
                        <CloseIcon />
                    </button>
                </header>
                <div className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <Card>
                        <div className="text-center">
                            <SearchIcon className="w-12 h-12 mx-auto text-sky-500 mb-2" />
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
            </div>
        </div>
    );
};

export default MealSearchModal;
