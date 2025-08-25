import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { MealAnalysis, AnalyzedFoodItem } from '../types';
import Card from './common/Card';
import Button from './common/Button';
import Spinner from './common/Spinner';
import { analyzeMealFromImage, analyzeMealFromText, generateMealIdeas, generateMealComparison } from '../services/geminiService';
import { CameraIcon, PencilIcon, LightbulbIcon, TrashIcon, ClipboardListIcon, XIcon, StarIcon, PlusCircleIcon, SparklesIcon, CheckIcon, ChevronDownIcon, ChevronLeftIcon, BeakerIcon, CalendarIcon, MicrophoneIcon, ClipboardCheckIcon, CheckCircleIcon } from './Icons';

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

const ScoreGauge: React.FC<{ score: number; size?: 'sm' | 'md' }> = ({ score, size = 'md' }) => {
    const isSmall = size === 'sm';
    const radius = isSmall ? 30 : 50;
    const strokeWidth = isSmall ? 6 : 10;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const scoreColor = score >= 75 ? 'stroke-red-500' : score >= 50 ? 'stroke-yellow-500' : 'stroke-green-500';

    const width = isSmall ? 'w-20 h-20' : 'w-32 h-32 sm:w-40 sm:h-40';
    const viewBox = isSmall ? '0 0 72 72' : '0 0 120 120';
    const cx = isSmall ? 36 : 60;
    const cy = isSmall ? 36 : 60;
    const fontSizes = isSmall
      ? { score: 'text-xl', total: 'text-xs' }
      : { score: 'text-3xl sm:text-4xl', total: 'text-xs sm:text-sm' };

    return (
        <div className={`relative ${width}`}>
            <svg className="w-full h-full" viewBox={viewBox}>
                <circle className="text-slate-200 dark:text-slate-700" strokeWidth={strokeWidth} stroke="currentColor" fill="transparent" r={radius} cx={cx} cy={cy} />
                <circle
                    className={`${scoreColor} transition-all duration-1000 ease-in-out`}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={cx}
                    cy={cy}
                    transform={`rotate(-90 ${cx} ${cy})`}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`${fontSizes.score} font-bold ${scoreColor.replace('stroke-', 'text-')}`}>{score}</span>
                {!isSmall && <span className={`${fontSizes.total} font-medium text-slate-500 dark:text-slate-400`}>/ 100</span>}
            </div>
        </div>
    );
};

const AccordionSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ title, icon, children, isOpen, onToggle }) => {
  return (
    <div className="border-t border-slate-200 dark:border-slate-700/50">
      <button
        onClick={onToggle}
        className="flex justify-between items-center w-full py-4 text-left"
      >
        <div className="flex items-center text-md font-semibold text-slate-700 dark:text-slate-300">
          {icon}
          <span>{title}</span>
        </div>
        <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-screen' : 'max-h-0'}`}>
        <div className="pb-4">
          {children}
        </div>
      </div>
    </div>
  );
};


const MealResult: React.FC<{
    result: MealAnalysis;
    isFavorite: boolean;
    isAdded: boolean;
    onToggleFavorite: () => void;
    onPromptAdd: () => void;
    onBackToList: () => void;
}> = ({ result, isFavorite, isAdded, onToggleFavorite, onPromptAdd, onBackToList }) => {
    const [accordionState, setAccordionState] = useState({ items: true, advice: true });

    const handleAccordionToggle = (section: 'items' | 'advice') => {
        setAccordionState(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleAdd = () => {
        onPromptAdd();
    };
    
    return (
    <div className="animate-fade-in space-y-4 lg:space-y-6 pb-24 lg:pb-0">
        <button onClick={onBackToList} className="lg:hidden flex items-center text-sm text-sky-600 dark:text-sky-400 font-semibold mb-2">
            <ChevronLeftIcon className="w-5 h-5" />
            <span>기록 목록으로 돌아가기</span>
        </button>

        <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-100 text-center">{result.mealDescription}</h2>

        <Card>
            <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-4">
                <div className="flex-shrink-0">
                    <ScoreGauge score={result.totalPurineScore} />
                </div>
                <div className="flex-grow">
                     <div className={`inline-block px-3 py-1 mb-2 text-base font-bold rounded-lg border-2 ${getRiskLevelColor(result.overallRiskLevel)}`}>
                        {result.overallRiskLevel}
                     </div>
                     <p className="mt-1 text-md font-semibold text-slate-700 dark:text-slate-300">{result.overallSummary}</p>
                </div>
            </div>
        </Card>
        
        <Card className="!p-0">
            <div className="p-4 sm:p-6 space-y-1">
                <AccordionSection 
                    title="개별 항목 분석" 
                    icon={<ClipboardListIcon className="w-5 h-5 mr-2 text-slate-500" />}
                    isOpen={accordionState.items}
                    onToggle={() => handleAccordionToggle('items')}
                >
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
                </AccordionSection>

                <AccordionSection 
                    title="AI 조언 및 대체 식품"
                    icon={<LightbulbIcon className="w-5 h-5 mr-2 text-yellow-500" />}
                    isOpen={accordionState.advice}
                    onToggle={() => handleAccordionToggle('advice')}
                >
                     <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{result.recommendations}</p>
                     <div className="flex flex-wrap gap-2">
                        {result.alternatives.map((alt, i) => (
                            <span key={i} className="px-2.5 py-1 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full">{alt}</span>
                        ))}
                    </div>
                </AccordionSection>
            </div>
        </Card>

        {/* Action Buttons */}
        <div className="hidden lg:flex items-center justify-center gap-4 pt-2">
            <Button onClick={handleAdd} variant={isAdded ? "secondary" : "primary"} size="md" disabled={isAdded} className="!w-48">
                {isAdded ? <><CheckIcon className="w-5 h-5 mr-2" /> 추가 완료!</> : <><PlusCircleIcon className="w-5 h-5 mr-2" /> 오늘 식단에 추가</>}
            </Button>
            <button onClick={onToggleFavorite} className="p-3 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label="즐겨찾기 추가/제거">
                <StarIcon className={`w-6 h-6 ${isFavorite ? 'text-yellow-400' : 'text-slate-400'}`} filled={isFavorite} />
            </button>
        </div>
        
         {/* Mobile Sticky Action Bar */}
        <div className="lg:hidden fixed bottom-16 left-0 right-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-4 border-t border-slate-200 dark:border-slate-700 z-10">
            <div className="flex items-center justify-center gap-4">
                <Button onClick={handleAdd} variant={isAdded ? "secondary" : "primary"} size="md" disabled={isAdded} className="flex-grow">
                    {isAdded ? <><CheckIcon className="w-5 h-5 mr-2" /> 추가 완료!</> : <><PlusCircleIcon className="w-5 h-5 mr-2" /> 식단에 추가</>}
                </Button>
                <button onClick={onToggleFavorite} className="p-3 rounded-full bg-slate-200 dark:bg-slate-700 transition-colors" aria-label="즐겨찾기 추가/제거">
                    <StarIcon className={`w-6 h-6 ${isFavorite ? 'text-yellow-400' : 'text-slate-400'}`} filled={isFavorite} />
                </button>
            </div>
        </div>
    </div>
)};

const MobileTabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`flex-1 py-3 px-2 text-sm font-semibold border-b-2 transition-colors ${
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

const MealTimeSelectionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSelect: (time: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void;
}> = ({ isOpen, onClose, onSelect }) => {
    if (!isOpen) return null;

    const mealTimes: { key: 'breakfast' | 'lunch' | 'dinner' | 'snack'; label: string }[] = [
        { key: 'breakfast', label: '아침' },
        { key: 'lunch', label: '점심' },
        { key: 'dinner', label: '저녁' },
        { key: 'snack', label: '간식/야식' },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-xs mx-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 text-center">
                    <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-100">언제 드셨나요?</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">오늘 날짜로 기록됩니다.</p>
                    <div className="grid grid-cols-2 gap-3">
                        {mealTimes.map(time => (
                            <Button key={time.key} variant="secondary" size="lg" className="h-16" onClick={() => onSelect(time.key)}>
                                {time.label}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MealComparisonView: React.FC<{ items: MealAnalysis[]; onBack: () => void; }> = ({ items, onBack }) => {
    const [summary, setSummary] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchComparison = async () => {
            setIsLoading(true);
            const result = await generateMealComparison(items);
            setSummary(result);
            setIsLoading(false);
        };
        fetchComparison();
    }, [items]);

    const gridColsClass = `grid-cols-${items.length}`;

    return (
        <div className="p-4 sm:p-6 animate-fade-in">
            <Button onClick={onBack} variant="secondary" size="sm" className="mb-4">
                <ChevronLeftIcon className="w-4 h-4 mr-2" />
                뒤로가기
            </Button>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-100 text-center mb-6">AI 식단 비교 분석</h2>
            <div className={`grid ${gridColsClass} gap-4`}>
                {items.map(item => (
                    <Card key={item.id} className="flex flex-col items-center text-center">
                        <h3 className="font-bold text-md lg:text-lg mb-3 h-12 flex items-center justify-center">{item.mealDescription}</h3>
                        <ScoreGauge score={item.totalPurineScore} size="sm" />
                        <div className={`mt-3 px-2 py-0.5 text-sm font-bold rounded-md border ${getRiskLevelColor(item.overallRiskLevel)}`}>
                            {item.overallRiskLevel}
                        </div>
                    </Card>
                ))}
            </div>
            <Card className="mt-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center">
                    <SparklesIcon className="w-6 h-6 mr-2 text-yellow-400" />
                    AI 최종 결론
                </h3>
                {isLoading ? (
                    <div className="flex justify-center items-center p-4">
                        <Spinner />
                    </div>
                ) : (
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{summary}</p>
                )}
            </Card>
        </div>
    );
};


interface FoodAnalyzerPanelProps {
    history: MealAnalysis[];
    setHistory: React.Dispatch<React.SetStateAction<MealAnalysis[]>>;
    favoriteMeals: MealAnalysis[];
    onToggleFavorite: (meal: MealAnalysis) => void;
    onAddToDailyLog: (meal: MealAnalysis, timeOfDay: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void;
    onActionToAI: (text: string) => void;
}

const FoodAnalyzerPanel: React.FC<FoodAnalyzerPanelProps> = ({ history, setHistory, favoriteMeals, onToggleFavorite, onAddToDailyLog, onActionToAI }) => {
    const [listFilter, setListFilter] = useState<'all' | 'favorites'>('all');
    const [mobileTab, setMobileTab] = useState<'analyze' | 'history'>('analyze');
    
    const [image, setImage] = useState<{ file: File, preview: string } | null>(null);
    const [textInput, setTextInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [selectedAnalysis, setSelectedAnalysis] = useState<MealAnalysis | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [mealIdeas, setMealIdeas] = useState<string[]>([]);
    const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);

    const [isMealTimeModalOpen, setIsMealTimeModalOpen] = useState(false);
    const [isAdded, setIsAdded] = useState(false);

    // Mobile specific state to show result within history tab
    const [showHistoryDetail, setShowHistoryDetail] = useState(false);

    // Comparison feature state
    const [viewMode, setViewMode] = useState<'default' | 'comparison'>('default');
    const [isCompareMode, setIsCompareMode] = useState(false);
    const [comparisonList, setComparisonList] = useState<MealAnalysis[]>([]);


    useEffect(() => {
        const currentList = listFilter === 'all' ? history : favoriteMeals;
        if (!selectedAnalysis && currentList.length > 0 && !isCompareMode && window.innerWidth >= 1024) { // only autoselect on desktop
            setSelectedAnalysis(currentList[0]);
        }
        if (selectedAnalysis && !currentList.some(item => item.id === selectedAnalysis.id)) {
            setSelectedAnalysis(currentList.length > 0 ? currentList[0] : null);
        }
    }, [listFilter, history, favoriteMeals, isCompareMode, selectedAnalysis]);

    useEffect(() => {
        if (selectedAnalysis) {
          setShowHistoryDetail(true);
        }
    }, [selectedAnalysis]);

    useEffect(() => {
        if (mobileTab === 'analyze') {
            setSelectedAnalysis(null);
            setShowHistoryDetail(false);
        }
    }, [mobileTab]);
    
    useEffect(() => {
      setIsAdded(false);
    }, [selectedAnalysis]);

     // Speech Recognition Effect
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            const recognition = recognitionRef.current;
            recognition.continuous = false;
            recognition.lang = 'ko-KR';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setTextInput(transcript);
                setIsListening(false);
            };

            recognition.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };
            
            recognition.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
        }
        setIsListening(!isListening);
    };
    
    const handlePromptAdd = () => {
        setIsMealTimeModalOpen(true);
    };

    const handleSelectMealTime = (time: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
        if (selectedAnalysis) {
            onAddToDailyLog(selectedAnalysis, time);
            setIsMealTimeModalOpen(false);
            setIsAdded(true);
            setTimeout(() => setIsAdded(false), 2000);
        }
    };


    const handleAnalyzeSuccess = useCallback((newResult: MealAnalysis) => {
        setHistory(prev => {
            const newHistory = [newResult, ...prev.filter(item => item.id !== newResult.id)];
            return newHistory.slice(0, 50);
        });
        const itemSummary = newResult.items.map(item => `${item.foodName}(${item.purineLevel})`).join(', ');
        const aiMessage = `AI 식단 분석기로 "${newResult.mealDescription}"을(를) 분석했습니다. [종합 위험도: ${newResult.overallRiskLevel}, 퓨린 점수: ${newResult.totalPurineScore}/100, 개별 항목: ${itemSummary}]. 이 식단에 대해 더 자세한 조언을 해 주세요.`;
        onActionToAI(aiMessage);
        
        // Switch to history tab on mobile to show result
        if (window.innerWidth < 1024) {
             setMobileTab('history');
        }

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
            if (file.size > 5 * 1024 * 1024) {
                setError("이미지 파일은 5MB를 초과할 수 없습니다.");
                return;
            }
            setImage({ file, preview: URL.createObjectURL(file) });
            setSelectedAnalysis(null);
            setError(null);
        }
    };

    const analyze = async (analysisFn: () => Promise<Omit<MealAnalysis, 'id'> | null>) => {
        setIsLoading(true);
        setSelectedAnalysis(null);
        setError(null);
        try {
            const data = await analysisFn();
            if (data) {
                const newResult: MealAnalysis = { ...data, id: Date.now().toString() };
                setSelectedAnalysis(newResult);
                handleAnalyzeSuccess(newResult);
                setListFilter('all');
                return true;
            } else {
                setError('정보를 가져올 수 없습니다. 다시 시도해 주세요.');
                return false;
            }
        } catch (err) {
            setError('분석 중 오류가 발생했습니다.');
            console.error(err);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnalyzePhoto = async () => {
        if (!image) return;
        const success = await analyze(async () => {
            const base64Data = await fileToBase64(image.file);
            return analyzeMealFromImage(base64Data, image.file.type);
        });
        if (success) setImage(null);
    };

    const handleAnalyzeText = async (e?: React.FormEvent, description?: string) => {
        if (e) e.preventDefault();
        const textToAnalyze = description || textInput;
        if (!textToAnalyze.trim()) return;
        const success = await analyze(() => analyzeMealFromText(textToAnalyze));
        if (success) setTextInput('');
    };
    
    const handleFetchMealIdeas = async () => {
        setIsLoadingIdeas(true);
        setMealIdeas([]);
        setError(null);
        try {
            const ideas = await generateMealIdeas();
            if(ideas) {
                setMealIdeas(ideas);
            } else {
                setError('식단 아이디어를 불러오는 데 실패했습니다.');
            }
        } catch (error) {
            setError('식단 아이디어를 불러오는 중 오류가 발생했습니다.');
            console.error("Failed to fetch meal ideas", error);
        } finally {
            setIsLoadingIdeas(false);
        }
    };

    const handleDeleteHistoryItem = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setHistory(prev => prev.filter(item => item.id !== id));
    };
    
    const handleToggleCompareMode = () => {
        setIsCompareMode(!isCompareMode);
        setComparisonList([]);
        setSelectedAnalysis(null);
        setShowHistoryDetail(false);
    };

    const handleToggleComparisonItem = (item: MealAnalysis) => {
        setComparisonList(prev => {
            const isSelected = prev.some(i => i.id === item.id);
            if (isSelected) {
                return prev.filter(i => i.id !== item.id);
            } else {
                if(prev.length < 4) return [...prev, item];
                return prev; // Max 4 items
            }
        });
    };
    
    const handleStartComparison = () => {
        if (comparisonList.length >= 2) {
            setViewMode('comparison');
        }
    };


    const displayedList = listFilter === 'all' ? history : favoriteMeals;

    const renderHistoryList = () => (
        <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-xl shadow-sm lg:p-0">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">분석 기록</h2>
                <Button onClick={handleToggleCompareMode} variant="secondary" size="sm">
                    <ClipboardCheckIcon className="w-4 h-4 mr-2"/>
                    {isCompareMode ? '취소' : '비교'}
                </Button>
            </div>
             <div className="flex-shrink-0">
                <div className="flex rounded-lg bg-slate-100 dark:bg-slate-700 p-1 m-4 lg:m-0 lg:rounded-none">
                    <button onClick={() => setListFilter('all')} className={`w-1/2 py-1.5 text-sm font-semibold rounded-md transition-colors ${listFilter === 'all' ? 'bg-white dark:bg-slate-800 shadow-sm text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}>전체</button>
                    <button onClick={() => setListFilter('favorites')} className={`w-1/2 py-1.5 text-sm font-semibold rounded-md transition-colors ${listFilter === 'favorites' ? 'bg-white dark:bg-slate-800 shadow-sm text-sky-600' : 'text-slate-600 dark:text-slate-300'}`}>즐겨찾기</button>
                </div>
            </div>
            
            {displayedList.length === 0 ? (
                <div className="flex-grow flex items-center justify-center p-4">
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                        {listFilter === 'favorites' ? "즐겨찾기에 추가한 식단이 없습니다." : "최근 분석 기록이 없습니다."}
                    </p>
                </div>
            ) : (
                <ul className={`space-y-2 p-4 pt-0 lg:p-4 overflow-y-auto flex-grow ${isCompareMode ? 'pb-20' : ''}`}>
                    {displayedList.map(item => {
                        const isSelected = selectedAnalysis?.id === item.id;
                        const isFavorite = favoriteMeals.some(fav => fav.id === item.id);
                        const isSelectedForCompare = comparisonList.some(i => i.id === item.id);

                        return (
                            <li key={item.id} onClick={() => isCompareMode ? handleToggleComparisonItem(item) : setSelectedAnalysis(item)} className={`group p-3 rounded-lg cursor-pointer transition-all relative ${isSelected && !isCompareMode ? 'bg-sky-100 dark:bg-sky-900/50' : 'bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-700/50'} ${isSelectedForCompare ? 'ring-2 ring-sky-500 shadow-md' : ''}`}>
                                {isCompareMode && <div className={`absolute top-2 right-2 ${isSelectedForCompare ? 'text-sky-500' : 'text-slate-300 dark:text-slate-600'}`}><CheckCircleIcon filled={isSelectedForCompare} className="w-6 h-6"/></div>}
                                <div className="flex justify-between items-center">
                                    <div className="flex-grow pr-2 overflow-hidden">
                                        <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate">{item.mealDescription}</h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">퓨린 점수: {item.totalPurineScore}/100</p>
                                    </div>
                                    <div className={`flex items-center gap-1 flex-shrink-0 transition-opacity ${isCompareMode ? 'opacity-0' : 'opacity-100 lg:opacity-0 lg:group-hover:opacity-100'}`}>
                                        <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(item); }} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="즐겨찾기 토글">
                                            <StarIcon className={`w-5 h-5 ${isFavorite ? 'text-yellow-400' : 'text-slate-400'}`} filled={isFavorite} />
                                        </button>
                                        {listFilter === 'all' && (
                                            <button onClick={(e) => handleDeleteHistoryItem(e, item.id)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="기록 삭제">
                                                <TrashIcon className="w-5 h-5 text-slate-400 hover:text-red-500" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}
            {isCompareMode && (
                 <div className="absolute bottom-16 lg:bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-4 border-t border-slate-200 dark:border-slate-700 z-10">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{comparisonList.length}개 선택됨</span>
                        <Button onClick={handleStartComparison} disabled={comparisonList.length < 2}>
                            비교하기
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
    
    const renderAnalysisHub = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col justify-center items-center h-full text-center p-4">
                    <Spinner />
                    <p className="text-lg font-semibold text-slate-600 dark:text-slate-300 mt-4">AI가 식단을 분석 중입니다...</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">잠시만 기다려 주세요.</p>
                </div>
            );
        }

        return (
            <div className="space-y-6 p-4">
                {error && <p className="text-center text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg">{error}</p>}
                
                <Card>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">분석 시작하기</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">사진, 텍스트, 음성으로 식단을 분석하세요.</p>
                    <div className="space-y-4">
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        {image ? (
                            <div className="space-y-3">
                                <div className="relative">
                                    <img src={image.preview} alt="음식 사진 미리보기" className="w-full max-h-60 object-contain rounded-lg" />
                                    <button onClick={() => setImage(null)} className="absolute -top-2 -right-2 bg-slate-600 text-white rounded-full p-1"><XIcon className="w-4 h-4" /></button>
                                </div>
                                <Button onClick={handleAnalyzePhoto} className="w-full" size="lg">사진으로 분석하기</Button>
                            </div>
                        ) : (
                            <Button onClick={() => fileInputRef.current?.click()} variant="secondary" className="w-full py-4 flex items-center justify-center">
                                <CameraIcon className="w-6 h-6 mr-2"/> 사진으로 분석
                            </Button>
                        )}
                        <form onSubmit={handleAnalyzeText} className="relative">
                            <div className="flex items-center space-x-2">
                                <input value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder={isListening ? "듣고 있어요..." : "음식 이름 입력 또는 음성으로"} className="flex-grow w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500"/>
                                {recognitionRef.current && (
                                    <button type="button" onClick={toggleListening} className={`p-3 rounded-full ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                        <MicrophoneIcon className="w-5 h-5"/>
                                    </button>
                                )}
                                <Button type="submit" disabled={!textInput.trim()}>분석</Button>
                            </div>
                        </form>
                    </div>
                </Card>

                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">AI 식단 추천</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">무엇을 먹을지 고민되시나요?</p>
                        </div>
                        <Button onClick={handleFetchMealIdeas} disabled={isLoadingIdeas} size="sm" variant="secondary">
                            <SparklesIcon className="w-4 h-4 mr-2" />
                            {isLoadingIdeas ? '로딩중...' : '추천 받기'}
                        </Button>
                    </div>
                     {isLoadingIdeas ? (
                         <div className="flex justify-center p-4"><Spinner /></div>
                    ) : mealIdeas.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {mealIdeas.map((idea, i) => (
                                <button key={i} onClick={() => handleAnalyzeText(undefined, idea)} className="w-full text-left p-3 rounded-lg bg-slate-100 dark:bg-slate-700/50 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors">
                                    <p className="font-medium text-slate-800 dark:text-slate-200">{idea}</p>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-sm text-slate-500 dark:text-slate-400">버튼을 눌러 통풍에 안전한 식단 아이디어를 얻어보세요.</p>
                        </div>
                    )}
                </Card>
            </div>
        );
    };

    if (viewMode === 'comparison') {
        return (
            <MealComparisonView
                items={comparisonList}
                onBack={() => {
                    setViewMode('default');
                    setIsCompareMode(false);
                    setComparisonList([]);
                }}
            />
        );
    }

    return (
        <div className="flex flex-col lg:grid lg:grid-cols-3 xl:grid-cols-5 lg:gap-6 h-full">
            {/* Mobile Tab Navigation */}
            <div className="lg:hidden flex border-b border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm sticky top-0 z-10">
                <MobileTabButton active={mobileTab === 'analyze'} onClick={() => setMobileTab('analyze')}>
                    <BeakerIcon className="w-5 h-5"/><span>분석</span>
                </MobileTabButton>
                <MobileTabButton active={mobileTab === 'history'} onClick={() => setMobileTab('history')}>
                    <CalendarIcon className="w-5 h-5"/><span>기록</span>
                </MobileTabButton>
            </div>

            {/* Desktop View: Left Panel */}
            <div className="hidden lg:flex flex-col h-full lg:col-span-1 xl:col-span-2">
                {renderHistoryList()}
            </div>
            
            {/* Desktop View: Right Panel */}
            <div className="hidden lg:flex flex-col space-y-6 overflow-y-auto p-4 lg:col-span-2 xl:col-span-3">
                 {selectedAnalysis ? (
                    <MealResult 
                        result={selectedAnalysis} 
                        isFavorite={favoriteMeals.some(fav => fav.id === selectedAnalysis.id)}
                        isAdded={isAdded}
                        onToggleFavorite={() => onToggleFavorite(selectedAnalysis)}
                        onPromptAdd={handlePromptAdd}
                        onBackToList={() => setSelectedAnalysis(null)}
                    />
                ) : (
                   renderAnalysisHub()
                )}
            </div>

            {/* Mobile View */}
            <div className="lg:hidden flex-grow overflow-y-auto">
                {mobileTab === 'analyze' && renderAnalysisHub()}
                {mobileTab === 'history' && (
                    showHistoryDetail && selectedAnalysis ? (
                        <div className="p-4">
                            <MealResult 
                                result={selectedAnalysis} 
                                isFavorite={favoriteMeals.some(fav => fav.id === selectedAnalysis.id)}
                                isAdded={isAdded}
                                onToggleFavorite={() => onToggleFavorite(selectedAnalysis)}
                                onPromptAdd={handlePromptAdd}
                                onBackToList={() => setShowHistoryDetail(false)}
                            />
                        </div>
                    ) : (
                        renderHistoryList()
                    )
                )}
            </div>
            
            <MealTimeSelectionModal
                isOpen={isMealTimeModalOpen}
                onClose={() => setIsMealTimeModalOpen(false)}
                onSelect={handleSelectMealTime}
            />
        </div>
    );
};

export default FoodAnalyzerPanel;