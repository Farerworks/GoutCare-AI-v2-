import React, { useState, useCallback, useRef } from 'react';
import type { MealAnalysis, AnalyzedFoodItem } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import Spinner from './common/Spinner';
import { analyzeMealFromImage, analyzeMealFromText } from '../services/geminiService';
import { CameraIcon, PencilIcon, LightbulbIcon, TrashIcon, ClipboardListIcon, XIcon, StarIcon, PlusCircleIcon } from './Icons';

const getRiskLevelColor = (level: MealAnalysis['overallRiskLevel']) => {
    switch (level) {
        case '낮음': return 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700';
        case '주의': return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
        case '높음': return 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700';
        default: return 'bg-slate-100 dark:bg-slate-700';
    }
};

const getPurineLevelColorForItem = (level: AnalyzedFoodItem['purineLevel']) => {
    switch (level) {
        case '낮음': return 'text-green-600 dark:text-green-400';
        case '중간': return 'text-yellow-600 dark:text-yellow-400';
        case '높음': return 'text-orange-600 dark:text-orange-400';
        case '매우 높음': return 'text-red-600 dark:text-red-400';
        default: return 'text-slate-500';
    }
};

const ScoreGauge: React.FC<{ score: number }> = ({ score }) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    const scoreColor = score >= 75 ? 'stroke-red-500' : score >= 50 ? 'stroke-yellow-500' : 'stroke-green-500';

    return (
        <div className="relative w-40 h-40">
            <svg className="w-full h-full" viewBox="0 0 120 120">
                <circle
                    className="text-slate-200 dark:text-slate-700"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="60"
                    cy="60"
                />
                <circle
                    className={`${scoreColor} transition-all duration-1000 ease-in-out`}
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="60"
                    cy="60"
                    transform="rotate(-90 60 60)"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-bold ${scoreColor.replace('stroke-', 'text-')}`}>{score}</span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">/ 100</span>
            </div>
        </div>
    );
};


const MealResult: React.FC<{
    result: MealAnalysis;
    isFavorite: boolean;
    onToggleFavorite: () => void;
    onAddToDailyLog: () => void;
}> = ({ result, isFavorite, onToggleFavorite, onAddToDailyLog }) => (
    <Card className="mt-6 animate-fade-in">
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg space-y-5">
            <div className="flex flex-col items-center text-center">
                 <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100">{result.mealDescription}</h4>
                 <div className="my-4">
                     <ScoreGauge score={result.totalPurineScore} />
                 </div>
                 <div className={`inline-block px-3 py-1 text-base font-bold rounded-lg border-2 ${getRiskLevelColor(result.overallRiskLevel)}`}>
                    {result.overallRiskLevel}
                 </div>
                 <p className="mt-3 text-md font-semibold text-slate-700 dark:text-slate-300 max-w-md">{result.overallSummary}</p>
            </div>
            
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700/50">
                <div className="flex items-center text-md font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    <ClipboardListIcon className="w-5 h-5 mr-2 text-slate-500" />
                    <span>개별 항목 분석</span>
                </div>
                <ul className="space-y-3">
                    {result.items.map((item, index) => (
                        <li key={index} className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                            <div className="flex justify-between items-start gap-2">
                                <div className="flex-grow">
                                    <h5 className="font-bold text-slate-800 dark:text-slate-100">{item.foodName}</h5>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.explanation}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className={`font-semibold text-sm ${getPurineLevelColorForItem(item.purineLevel)}`}>{item.purineLevel}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.purineAmount}</p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700/50">
                <div className="flex items-center text-md font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    <LightbulbIcon className="w-5 h-5 mr-2 text-yellow-500" />
                    <span>AI 조언 및 대체 식품</span>
                </div>
                 <p className="text-sm text-slate-600 dark:text-slate-400 pl-7 mb-3">{result.recommendations}</p>
                 <div className="flex flex-wrap gap-2 pl-7">
                    {result.alternatives.map((alt, i) => (
                        <span key={i} className="px-2.5 py-1 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full">{alt}</span>
                    ))}
                </div>
            </div>
            <div className="mt-6 flex items-center justify-center gap-4 border-t border-slate-200 dark:border-slate-700/50 pt-5">
                <Button onClick={onAddToDailyLog} variant="secondary" size="md">
                    <PlusCircleIcon className="w-5 h-5 mr-2" />
                    오늘 식단에 추가
                </Button>
                <button onClick={onToggleFavorite} className="p-3 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label="즐겨찾기 추가/제거">
                    <StarIcon className={`w-6 h-6 ${isFavorite ? 'text-yellow-400' : 'text-slate-400'}`} filled={isFavorite} />
                </button>
          </div>
        </div>
    </Card>
);

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`flex-1 py-3 px-2 text-sm sm:text-base font-semibold border-b-2 transition-colors ${
        active
            ? 'border-sky-500 text-sky-600 dark:text-sky-400'
            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
        }`}
    >
        <div className="flex items-center justify-center space-x-2">
            {children}
        </div>
    </button>
);

interface FoodAnalyzerPanelProps {
    history: MealAnalysis[];
    setHistory: React.Dispatch<React.SetStateAction<MealAnalysis[]>>;
    favoriteMeals: MealAnalysis[];
    onToggleFavorite: (meal: MealAnalysis) => void;
    onAddToDailyLog: (meal: MealAnalysis) => void;
    onActionToAI: (text: string) => void;
}

const FoodAnalyzerPanel: React.FC<FoodAnalyzerPanelProps> = ({ history, setHistory, favoriteMeals, onToggleFavorite, onAddToDailyLog, onActionToAI }) => {
    const [activeInputTab, setActiveInputTab] = useState<'photo' | 'text'>('photo');
    const [activeListTab, setActiveListTab] = useState<'history' | 'favorites'>('history');
    
    const [image, setImage] = useState<{ file: File, preview: string } | null>(null);
    const [textInput, setTextInput] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [selectedAnalysis, setSelectedAnalysis] = useState<MealAnalysis | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAnalyzeSuccess = useCallback((newResult: MealAnalysis) => {
        setHistory(prev => {
            const newHistory = [newResult, ...prev.filter(item => item.id !== newResult.id)];
            return newHistory.slice(0, 20);
        });
        const itemSummary = newResult.items.map(item => `${item.foodName}(${item.purineLevel})`).join(', ');
        const aiMessage = `AI 식단 분석기로 "${newResult.mealDescription}"을(를) 분석했습니다. [종합 위험도: ${newResult.overallRiskLevel}, 퓨린 점수: ${newResult.totalPurineScore}/100, 개별 항목: ${itemSummary}]. 이 식단에 대해 더 자세한 조언을 해 주세요.`;
        onActionToAI(aiMessage);
    }, [setHistory, onActionToAI]);
    
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = error => reject(error);
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError("이미지 파일은 5MB를 초과할 수 없습니다.");
                return;
            }
            setImage({ file, preview: URL.createObjectURL(file) });
            setSelectedAnalysis(null);
            setError(null);
        }
    };

    const handleAnalyzePhoto = useCallback(async () => {
        if (!image) return;
        setIsLoading(true);
        setSelectedAnalysis(null);
        setError(null);
        try {
            const base64Data = await fileToBase64(image.file);
            const data = await analyzeMealFromImage(base64Data, image.file.type);

            if (data) {
                const newResult: MealAnalysis = { ...data, id: Date.now().toString() };
                setSelectedAnalysis(newResult);
                handleAnalyzeSuccess(newResult);
            } else {
                setError('정보를 가져올 수 없습니다. 다시 시도해 주세요.');
            }
        } catch (err) {
            setError('분석 중 오류가 발생했습니다.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [image, handleAnalyzeSuccess]);

    const handleAnalyzeText = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!textInput.trim()) return;
        setIsLoading(true);
        setSelectedAnalysis(null);
        setError(null);
        try {
            const data = await analyzeMealFromText(textInput);
            if (data) {
                const newResult: MealAnalysis = { ...data, id: Date.now().toString() };
                setSelectedAnalysis(newResult);
                handleAnalyzeSuccess(newResult);
                setTextInput('');
            } else {
                setError('정보를 가져올 수 없습니다. 다시 시도해 주세요.');
            }
        } catch (err) {
            setError('분석 중 오류가 발생했습니다.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [textInput, handleAnalyzeSuccess]);

    const handleDeleteHistoryItem = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setHistory(prev => prev.filter(item => item.id !== id));
        if (selectedAnalysis?.id === id) {
            setSelectedAnalysis(null);
        }
    };

    const renderList = (items: MealAnalysis[], isFavoritesList: boolean = false) => {
        if (items.length === 0) {
            return <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-8">
                {isFavoritesList ? "즐겨찾기에 추가한 식단이 없습니다." : "최근 분석 기록이 없습니다."}
            </p>;
        }
        return (
            <ul className="space-y-2">
                {items.map(item => {
                    const isSelected = selectedAnalysis?.id === item.id;
                    const isFavorite = favoriteMeals.some(fav => fav.id === item.id);
                    return (
                        <li 
                            key={item.id} 
                            onClick={() => setSelectedAnalysis(item)}
                            className={`group p-3 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-sky-100 dark:bg-sky-900/50' : 'bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
                        >
                           <div className="flex justify-between items-center">
                                <div className="flex-grow pr-2 overflow-hidden">
                                    <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate">{item.mealDescription}</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">퓨린 점수: {item.totalPurineScore}/100</p>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); onAddToDailyLog(item); }} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="오늘 식단에 추가">
                                        <PlusCircleIcon className="w-5 h-5 text-sky-600" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(item); }} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="즐겨찾기 토글">
                                        <StarIcon className={`w-5 h-5 ${isFavorite ? 'text-yellow-400' : 'text-slate-400'}`} filled={isFavorite} />
                                    </button>
                                    {!isFavoritesList && (
                                        <button onClick={(e) => handleDeleteHistoryItem(e, item.id)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="기록 삭제">
                                            <TrashIcon className="w-5 h-5 text-red-500" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </li>
                    )
                })}
            </ul>
        );
    };
    
    return (
        <div className="space-y-6">
            <Card>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">AI 식단 분석기</h2>
                <div className="flex border-b border-slate-200 dark:border-slate-700 mt-3">
                    <TabButton active={activeInputTab === 'photo'} onClick={() => setActiveInputTab('photo')}>
                        <CameraIcon className="w-5 h-5" /><span>사진으로 분석</span>
                    </TabButton>
                    <TabButton active={activeInputTab === 'text'} onClick={() => setActiveInputTab('text')}>
                         <PencilIcon className="w-5 h-5" /><span>텍스트로 분석</span>
                    </TabButton>
                </div>

                <div className="pt-4">
                {activeInputTab === 'photo' ? (
                     <>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">분석하고 싶은 식단 사진을 업로드하세요.</p>
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" disabled={isLoading} />
                        {!image ? (
                            <div onClick={() => !isLoading && fileInputRef.current?.click()} className={`flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-center transition ${!isLoading ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50' : 'cursor-not-allowed opacity-50'}`}>
                                <CameraIcon className="w-12 h-12 text-slate-400 dark:text-slate-500 mb-2"/>
                                <p className="font-semibold text-slate-600 dark:text-slate-300">음식 사진 업로드</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">탭하여 파일을 선택하세요</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="relative">
                                    <img src={image.preview} alt="음식 사진 미리보기" className="w-full max-h-60 object-contain rounded-lg" />
                                    <button onClick={() => !isLoading && setImage(null)} disabled={isLoading} className="absolute -top-2 -right-2 bg-slate-600 text-white rounded-full p-1 disabled:opacity-50">
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                <Button onClick={handleAnalyzePhoto} disabled={isLoading || !image} className="w-full" size="lg">
                                    {isLoading ? <Spinner /> : '사진 분석하기'}
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <form onSubmit={handleAnalyzeText}>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">분석하고 싶은 음식 설명을 입력하세요.</p>
                        <textarea
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="예: 삼겹살 구이와 소주 한 병"
                            className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                            rows={3}
                            disabled={isLoading}
                        />
                        <Button type="submit" disabled={isLoading || !textInput.trim()} className="w-full mt-3" size="lg">
                            {isLoading ? <Spinner /> : '텍스트 분석하기'}
                        </Button>
                    </form>
                )}
                </div>
            </Card>

            {isLoading && (
                <div className="flex flex-col justify-center items-center h-48 text-center">
                    <Spinner />
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">AI가 식단을 분석 중입니다... <br/>잠시만 기다려 주세요.</p>
                </div>
            )}
            {error && <p className="mt-4 text-center text-red-500">{error}</p>}
            
            {selectedAnalysis && <MealResult 
                result={selectedAnalysis}
                isFavorite={favoriteMeals.some(fav => fav.id === selectedAnalysis.id)}
                onToggleFavorite={() => onToggleFavorite(selectedAnalysis)}
                onAddToDailyLog={() => onAddToDailyLog(selectedAnalysis)}
            />}

            {(history.length > 0 || favoriteMeals.length > 0) && (
                <Card>
                    <div className="flex border-b border-slate-200 dark:border-slate-700">
                         <TabButton active={activeListTab === 'history'} onClick={() => setActiveListTab('history')}>
                            <span>최근 기록</span>
                        </TabButton>
                        <TabButton active={activeListTab === 'favorites'} onClick={() => setActiveListTab('favorites')}>
                             <span>즐겨찾기</span>
                        </TabButton>
                    </div>
                    <div className="pt-4 max-h-80 overflow-y-auto">
                        {activeListTab === 'history' ? renderList(history) : renderList(favoriteMeals, true)}
                    </div>
                </Card>
            )}
        </div>
    );
};

export default FoodAnalyzerPanel;