import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { LogEntry, ChatMessage, LogData, MealAnalysis, Preferences, PurineIntakeData } from './types';
import Header from './components/Header';
import DashboardPanel from './components/Dashboard';
import CalendarPanel from './components/LogHistory';
import ChatPanel from './components/AiAssistant';
import FoodAnalyzerPanel from './components/FoodAnalyzerPanel';
import LogModal from './components/LogModal';
import SettingsModal from './components/SettingsModal';
import BottomNavBar from './components/BottomNavBar';
import FloatingActionButton from './components/FloatingActionButton';
import QuickLogDrawer from './components/QuickLogDrawer';
import Sidebar from './components/Sidebar';
import type { ActiveView } from './types';
import { formatFluid, formatWeight } from './utils/units';
import { generateGoutForecast } from './services/geminiService';

// Custom hook to use localStorage, embedded here to avoid creating new files.
const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
};

const timeOfDayLabels: Record<string, string> = {
    morning: '아침',
    lunch: '점심',
    dinner: '저녁',
    bedtime: '취침 전',
    breakfast: '아침',
    snack: '간식/야식'
};


const App: React.FC = () => {
  const [logs, setLogs] = useLocalStorage<LogEntry[]>('goutcare-logs', []);
  const [chatHistory, setChatHistory] = useLocalStorage<ChatMessage[]>('goutcare-chatHistory', []);
  const [foodHistory, setFoodHistory] = useLocalStorage<MealAnalysis[]>('goutcare-meal-history', []);
  const [favoriteMeals, setFavoriteMeals] = useLocalStorage<MealAnalysis[]>('goutcare-favorite-meals', []);
  const [preferences, setPreferences] = useLocalStorage<Preferences>('goutcare-prefs', {
    weightUnit: 'kg',
    fluidUnit: 'ml',
    dailyFluidGoal: 2500,
    dailyPurineGoal: 150,
  });
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState<boolean>(false);
  const [modalDate, setModalDate] = useState<Date>(new Date());
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [showWelcome, setShowWelcome] = useLocalStorage<boolean>('goutcare-show-welcome', true);

  // State for Daily Gout Risk Advisor
  const [risk, setRisk] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [forecast, setForecast] = useState<string>('');
  const [isLoadingForecast, setIsLoadingForecast] = useState<boolean>(true);
  
  const chatPanelRef = useRef<{ addMessage: (message: ChatMessage) => void }>(null);

  useEffect(() => {
    const fetchForecast = async () => {
        setIsLoadingForecast(true);
        try {
            const result = await generateGoutForecast(logs, chatHistory);
            const lines = result.split('\n');
            const riskLine = lines.find(l => l.startsWith('RISK_LEVEL:'));
            const summaryLine = lines.find(l => l.startsWith('SUMMARY:'));
            const forecastLine = lines.find(l => l.startsWith('FORECAST:'));
            
            setRisk(riskLine?.replace('RISK_LEVEL:', '').trim() || '알 수 없음');
            setSummary(summaryLine?.replace('SUMMARY:', '').trim() || '예보를 불러오는 데 실패했습니다.');
            setForecast(forecastLine?.replace('FORECAST:', '').trim() || '');
        } catch (e) {
            setRisk('알 수 없음');
            setSummary('예보 생성 중 오류가 발생했습니다.');
            setForecast('');
        } finally {
            setIsLoadingForecast(false);
        }
    };
    fetchForecast();
  }, [logs, chatHistory]);

  const sendActionToAI = useCallback((text: string) => {
    const userMessage: ChatMessage = {
      role: 'user',
      parts: [{ text }],
      timestamp: new Date().toISOString()
    };
    
    if(chatPanelRef.current) {
        chatPanelRef.current.addMessage(userMessage);
    }
  }, []);

  const addLog = useCallback((logData: LogData, date: Date) => {
    const newLog: LogEntry = {
      id: `${Date.now()}`,
      timestamp: date.toISOString(),
      ...logData,
    };
    setLogs(prevLogs => [...prevLogs, newLog].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    setIsModalOpen(false);
    setIsQuickLogOpen(false);
    
    let logSummary = '';
    switch (newLog.type) {
        case 'symptom':
            logSummary = `오늘 ${newLog.data.location} 부위에 통증 강도 ${newLog.data.painLevel}/10의 증상을 기록했습니다. 어떻게 대처하면 좋을까요?`;
            break;
        case 'medication':
            logSummary = `오늘 ${timeOfDayLabels[newLog.data.timeOfDay] || '해당 시간에'} 약으로 "${newLog.data.name}" 복용을 기록했습니다.`;
            break;
        case 'diet':
            logSummary = `방금 ${timeOfDayLabels[newLog.data.timeOfDay] || '식사'}로 "${newLog.data.description}"을(를) 먹었다고 기록했습니다. 이 식단은 괜찮을까요?`;
            break;
        case 'wellness': {
            const wellnessParts = [];
            const { data } = newLog;
            if (data.fluidIntake) wellnessParts.push(`수분 섭취 ${formatFluid(data.fluidIntake, preferences.fluidUnit)}`);
            if (data.weight) wellnessParts.push(`체중 ${formatWeight(data.weight, preferences.weightUnit)}`);
            if (data.sleepHours) wellnessParts.push(`수면 ${data.sleepHours}시간`);
            if (data.stressLevel) wellnessParts.push(`스트레스 지수 ${data.stressLevel}/5`);
            if (data.activity) wellnessParts.push(`활동 '${data.activity}'`);
    
            if (wellnessParts.length > 0) {
                logSummary = `방금 건강 상태를 기록했습니다: ${wellnessParts.join(', ')}.`;
            }
            break;
        }
        case 'life_event':
            logSummary = `오늘 "${newLog.data.event}"라는 생활 기록을 남겼습니다. 이게 통풍에 영향을 줄까요?`;
            break;
        case 'purine_intake': {
            const mealTime = timeOfDayLabels[(newLog.data as PurineIntakeData).timeOfDay] || '해당 식사';
            logSummary = `방금 ${mealTime}(으)로 식단 "${newLog.data.mealDescription}" (퓨린 점수: ${newLog.data.totalPurineScore})을(를) 기록했습니다. 오늘의 총 섭취량을 고려했을 때 괜찮을까요?`;
            break;
        }
    }
    
    if (logSummary) {
      sendActionToAI(logSummary);
    }

  }, [setLogs, sendActionToAI, preferences]);

  const deleteLog = useCallback((logId: string) => {
      setLogs(prev => prev.filter(log => log.id !== logId));
  }, [setLogs]);

  const handleAddToDailyLog = useCallback((meal: MealAnalysis, timeOfDay: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
      const logData: LogData = {
          type: 'purine_intake',
          data: {
            ...meal,
            timeOfDay,
          },
      };
      addLog(logData, new Date());
  }, [addLog]);

  const handleToggleFavorite = useCallback((meal: MealAnalysis) => {
      setFavoriteMeals(prev => {
          const isFavorite = prev.some(item => item.id === meal.id);
          if (isFavorite) {
              return prev.filter(item => item.id !== meal.id);
          } else {
              // Ensure we don't add duplicates from history that might have the same content
              const filteredPrev = prev.filter(item => item.id !== meal.id);
              return [meal, ...filteredPrev];
          }
      });
  }, [setFavoriteMeals]);

  const handleOpenLogModal = useCallback((date: Date) => {
    setModalDate(date);
    setIsModalOpen(true);
  }, []);

  const handleDataReset = () => {
    if (window.confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
        setLogs([]);
        setChatHistory([]);
        setFoodHistory([]);
        setFavoriteMeals([]);
        setPreferences({ 
            weightUnit: 'kg', 
            fluidUnit: 'ml', 
            dailyFluidGoal: 2500, 
            dailyPurineGoal: 150 
        });
        setShowWelcome(true);
        window.location.reload();
    }
  };

  const handleDataExport = () => {
      const data = {
          logs,
          chatHistory,
          foodHistory,
          favoriteMeals,
          preferences
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `goutcare_ai_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
  };

  const handleDataImport = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
              try {
                  const data = JSON.parse(e.target?.result as string);
                  if (data.logs && data.chatHistory && window.confirm('Importing will overwrite your current data. Continue?')) {
                      setLogs(data.logs);
                      setChatHistory(data.chatHistory);
                      if(data.foodHistory) setFoodHistory(data.foodHistory);
                      if(data.favoriteMeals) setFavoriteMeals(data.favoriteMeals);
                      if (data.preferences) {
                        setPreferences(data.preferences);
                      }
                  } else {
                    alert('Invalid file format.');
                  }
              } catch (error) {
                  alert('Error reading file.');
                  console.error("Import error:", error);
              }
          };
          reader.readAsText(file);
      }
  };
  
  const mainContentClass = {
      dashboard: 'overflow-y-auto p-4 sm:p-6',
      calendar: 'overflow-y-auto p-4 sm:p-6',
      chat: 'flex flex-col overflow-hidden',
      food: 'overflow-hidden'
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardPanel 
            logs={logs} 
            preferences={preferences} 
            risk={risk}
            summary={summary}
            forecast={forecast}
            isLoadingForecast={isLoadingForecast}
            onDeleteLog={deleteLog}
            showWelcome={showWelcome}
            onDismissWelcome={() => setShowWelcome(false)}
        />;
      case 'calendar':
        return <CalendarPanel logs={logs} onOpenLogModal={handleOpenLogModal} preferences={preferences} />;
      case 'food':
        return <FoodAnalyzerPanel 
            history={foodHistory} 
            setHistory={setFoodHistory}
            favoriteMeals={favoriteMeals}
            onToggleFavorite={handleToggleFavorite}
            onAddToDailyLog={handleAddToDailyLog}
            onActionToAI={sendActionToAI} 
        />;
      case 'chat':
        return <ChatPanel ref={chatPanelRef} history={chatHistory} setHistory={setChatHistory} />;
      default:
        return <DashboardPanel 
            logs={logs} 
            preferences={preferences} 
            risk={risk}
            summary={summary}
            forecast={forecast}
            isLoadingForecast={isLoadingForecast}
            onDeleteLog={deleteLog}
            showWelcome={showWelcome}
            onDismissWelcome={() => setShowWelcome(false)}
        />;
    }
  }

  return (
    <div className="flex h-screen font-sans bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onReset={handleDataReset} onExport={handleDataExport} onImport={handleDataImport} onOpenSettings={() => setIsSettingsModalOpen(true)} />
        <main className={`flex-grow ${mainContentClass[activeView] || ''} pb-16 md:pb-0`}>
             {renderActiveView()}
        </main>
      </div>
      
      {isModalOpen && <LogModal logs={logs} date={modalDate} onClose={() => setIsModalOpen(false)} onAddLog={addLog} preferences={preferences} />}
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} preferences={preferences} setPreferences={setPreferences} />
      
      <div>
        <FloatingActionButton onClick={() => setIsQuickLogOpen(true)} />
        <QuickLogDrawer logs={logs} isOpen={isQuickLogOpen} onClose={() => setIsQuickLogOpen(false)} onAddLog={addLog} preferences={preferences} />
      </div>

      <BottomNavBar activeView={activeView} setActiveView={setActiveView} />
    </div>
  );
};

export default App;
