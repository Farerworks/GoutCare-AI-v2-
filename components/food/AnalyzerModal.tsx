
import React, { useState, useMemo, useRef } from 'react';
import type { MealAnalysis, LogEntry, Preferences, PurineIntakeData } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { analyzeMealFromImage, analyzeMealFromText } from '../../services/geminiService';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import { CloseIcon, PencilIcon, CameraIcon, ImageIcon, XIcon, SparklesIcon } from '../Icons';

interface AnalyzerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAnalysisComplete: (result: MealAnalysis) => void;
    preferences: Preferences;
    logs: LogEntry[];
    initialText?: string;
}

const AnalyzerModal: React.FC<AnalyzerModalProps> = ({ isOpen, onClose, onAnalysisComplete, preferences, logs, initialText = '' }) => {
    const { t } = useI18n();
    const [mode, setMode] = useState<'text' | 'image'>('text');
    const [text, setText] = useState(initialText);
    const [image, setImage] = useState<{ file: File, preview: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg mx-auto relative transform transition-all animate-slide-up sm:animate-fade-in" 
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t('food.analyzeNew')}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
                        <CloseIcon />
                    </button>
                </header>
                <div className="p-4">
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
                </div>
            </div>
        </div>
    );
};

export default AnalyzerModal;
