
import React, { useState, useEffect } from 'react';
import type { MealAnalysis } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { generateMealComparison } from '../../services/geminiService';
import Spinner from '../common/Spinner';
import Card from '../common/Card';
import { CloseIcon, SparklesIcon } from '../Icons';

interface MealComparisonModalProps {
    isOpen: boolean;
    onClose: () => void;
    meals: MealAnalysis[];
}

const MealComparisonModal: React.FC<MealComparisonModalProps> = ({ isOpen, onClose, meals }) => {
    const { t } = useI18n();
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            const fetchComparison = async () => {
                setIsLoading(true);
                const res = await generateMealComparison(meals);
                setResult(res);
                setIsLoading(false);
            };
            fetchComparison();
        }
    }, [isOpen, meals]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-3xl mx-auto relative transform transition-all animate-slide-up sm:animate-fade-in" 
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('food.mealComparison')}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
                        <CloseIcon />
                    </button>
                </header>
                <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
                    <div className={`grid grid-cols-${meals.length > 2 ? 3 : 2} gap-4 mb-4`}>
                        {meals.map(meal => (
                            <div key={meal.id} className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg text-center">
                                <p className="font-semibold">{meal.mealName}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{meal.totalPurineScore} {t('food.points')}</p>
                            </div>
                        ))}
                    </div>
                    <Card>
                        <h3 className="font-semibold text-center mb-4 flex items-center justify-center">
                            <SparklesIcon className="w-5 h-5 mr-2 text-yellow-400" />
                            {t('food.aiRecommendation')}
                        </h3>
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg min-h-[10rem] flex items-center justify-center">
                            {isLoading ? <Spinner/> : <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{result}</p>}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default MealComparisonModal;
