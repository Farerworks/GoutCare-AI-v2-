
import React, { useState } from 'react';
import type { PlannedMeal } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { generateMealPlan } from '../../services/geminiService';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import Card from '../common/Card';
import { CloseIcon, LightbulbIcon, SparklesIcon } from '../Icons';

interface MealPlannerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const MealPlannerModal: React.FC<MealPlannerModalProps> = ({ isOpen, onClose }) => {
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
    
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-3xl mx-auto relative transform transition-all animate-slide-up sm:animate-fade-in" 
                onClick={(e) => e.stopPropagation()}
            >
                 <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('food.mealPlannerTitle')}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
                        <CloseIcon />
                    </button>
                </header>
                <div className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <Card>
                        <div className="text-center">
                            <LightbulbIcon className="w-12 h-12 mx-auto text-yellow-400 mb-2" />
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
            </div>
        </div>
    );
};

export default MealPlannerModal;
