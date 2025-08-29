
import React, { useState } from 'react';
import type { MealAnalysis, AnalyzedFoodItem } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import Button from '../common/Button';
import Card from '../common/Card';
import Gauge from '../common/Gauge';
import { CloseIcon, PlusIcon, StarIcon, DocumentTextIcon } from '../Icons';

interface MealResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    meal: MealAnalysis;
    isFavorite: boolean;
    onToggleFavorite: () => void;
    onAddToLog: (timeOfDay: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void;
}

const getRiskLevelStyles = (level: MealAnalysis['overallRiskLevel']) => {
    switch (level) {
        case 'Low': return {
            text: 'text-green-800 dark:text-green-300',
            bg: 'bg-green-100 dark:bg-green-900/50',
            border: 'border-green-300 dark:border-green-700',
        };
        case 'Moderate': return {
            text: 'text-yellow-800 dark:text-yellow-300',
            bg: 'bg-yellow-100 dark:bg-yellow-900/50',
            border: 'border-yellow-300 dark:border-yellow-700',
        };
        case 'High': return {
            text: 'text-red-800 dark:text-red-300',
            bg: 'bg-red-100 dark:bg-red-900/50',
            border: 'border-red-300 dark:border-red-700',
        };
        default: return {
            text: 'text-slate-800 dark:text-slate-300',
            bg: 'bg-slate-100 dark:bg-slate-700',
            border: 'border-slate-300 dark:border-slate-600',
        };
    }
};

const getPurineLevelColorForItem = (level: AnalyzedFoodItem['purineLevel']) => {
    switch (level) {
        case 'Low': return 'bg-green-500';
        case 'Moderate': return 'bg-yellow-500';
        case 'High': return 'bg-orange-500';
        case 'Very High': return 'bg-red-500';
        default: return 'bg-slate-500';
    }
};

const MealResultModal: React.FC<MealResultModalProps> = ({ isOpen, onClose, meal, isFavorite, onToggleFavorite, onAddToLog }) => {
    const { t } = useI18n();
    const styles = getRiskLevelStyles(meal.overallRiskLevel);
    const [showLogOptions, setShowLogOptions] = useState(false);
    
    const timeOfDayOptions: { id: 'breakfast' | 'lunch' | 'dinner' | 'snack', label: string }[] = [
        { id: 'breakfast', label: t('timeOfDay.breakfast') },
        { id: 'lunch', label: t('timeOfDay.lunch') },
        { id: 'dinner', label: t('timeOfDay.dinner') },
        { id: 'snack', label: t('timeOfDay.snack') },
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl mx-auto relative transform transition-all animate-slide-up sm:animate-fade-in" 
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{meal.mealName}</h2>
                    <div className="flex items-center space-x-2">
                        <button onClick={onToggleFavorite} className={`p-2 rounded-full transition-colors ${isFavorite ? 'text-yellow-500' : 'text-slate-400 hover:text-yellow-500'}`}>
                            <StarIcon filled={isFavorite} className="w-5 h-5"/>
                        </button>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
                            <CloseIcon />
                        </button>
                    </div>
                </header>
                <div className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <Card className={`!p-4 sm:!p-6 ${styles.bg}`}>
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex-1 text-center sm:text-left">
                                <p className={`px-3 py-1 text-sm font-bold rounded-full inline-block ${styles.bg} ${styles.text} border ${styles.border}`}>{meal.overallRiskLevel}</p>
                                <h3 className="text-2xl sm:text-3xl font-bold mt-2 text-slate-800 dark:text-white">{meal.mealName}</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{meal.mealDescription}</p>
                            </div>
                            <Gauge value={meal.totalPurineScore} label={t('food.purineScore')} />
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
                    
                    <Card>
                        <h3 className="text-lg font-bold mb-3">{t('food.ingredientAnalysis')}</h3>
                        <ul className="space-y-3">
                            {meal.items.map((item, index) => (
                                <li key={index} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <p className="font-semibold flex items-center">
                                            <span className={`w-2.5 h-2.5 rounded-full mr-2 ${getPurineLevelColorForItem(item.purineLevel)}`}></span>
                                            {item.foodName}
                                        </p>
                                        <span className={`font-bold text-sm px-2 py-0.5 rounded-md text-white ${getPurineLevelColorForItem(item.purineLevel)}`}>{item.purineLevel}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 pl-4">{item.explanation}</p>
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

                    <div className="relative pt-2">
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
            </div>
        </div>
    );
};

export default MealResultModal;
