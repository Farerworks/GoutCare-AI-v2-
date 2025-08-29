

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { LogEntry, ChatMessage, LogData, MealAnalysis, Preferences, PurineIntakeData, HealthReport, MedicationInfo, MedicationData, WellnessData, HydrationData, AlcoholData, CoachingNote } from './types';
import Header from './components/Header';
import DashboardPanel from './components/Dashboard';
import CalendarPanel from './components/LogHistory';
import ChatPanel from './components/AiAssistant';
import FoodAnalyzerPanel from './components/FoodAnalyzerPanel';
import ReportPanel from './components/ReportPanel';
import LogModal from './components/LogModal';
import SettingsModal from './components/SettingsModal';
import ProfileSetupModal from './components/ProfileSetupModal';
import BottomNavBar from './components/BottomNavBar';
import FloatingActionButton from './components/FloatingActionButton';
import QuickLogDrawer from './components/QuickLogDrawer';
import Sidebar from './components/Sidebar';
import Spinner from './components/common/Spinner';
import type { ActiveView } from './types';
import { formatFluid, formatWeight } from './utils/units';
import { generateGoutForecast, generateHealthReport, generateCoachingNote } from './services/geminiService';
import { I18nProvider, useI18n } from './hooks/useI18n';

// --- START OF SAMPLE DATA ---

const sampleMealAnalyses: MealAnalysis[] = [
    {
        id: '1716879892021',
        mealName: 'Cheeseburger and Fries',
        mealDescription: 'A classic meal with a beef patty, cheese, various vegetables in a bun, served with a side of french fries.',
        totalPurineScore: 85,
        overallRiskLevel: 'High',
        overallSummary: 'This meal is very high in purines due to the large portion of red meat (beef patty). It could be very risky for a gout patient.',
        items: [
            { foodName: 'Beef Patty', purineLevel: 'Very High', purineAmount: '> 400mg', explanation: 'Red meat, especially ground beef, is one of the highest sources of purines.' },
            { foodName: 'Cheese', purineLevel: 'Low', purineAmount: '< 50mg', explanation: 'Most dairy products are low in purines.' },
            { foodName: 'French Fries', purineLevel: 'Low', purineAmount: '< 50mg', explanation: 'Potatoes are a low-purine vegetable.' },
            { foodName: 'Bun & Vegetables', purineLevel: 'Low', purineAmount: '< 50mg', explanation: 'Grains and most vegetables are safe.' }
        ],
        recommendations: 'It is best to avoid this meal, especially during an acute flare-up. If you crave a burger, consider a chicken or veggie burger instead.',
        alternatives: ['Grilled Chicken Sandwich', 'Veggie Burger', 'Fish Tacos (with low-purine fish)']
    },
    {
        id: '1716879692021',
        mealName: 'Grilled Chicken Salad',
        mealDescription: 'A healthy salad with grilled chicken breast, mixed greens, tomatoes, and cucumbers.',
        totalPurineScore: 45,
        overallRiskLevel: 'Moderate',
        overallSummary: 'The main ingredient, chicken, has a moderate purine level. The portion size is key. Overall, a much safer choice than red meat.',
        items: [
            { foodName: 'Chicken Breast', purineLevel: 'Moderate', purineAmount: '100-150mg', explanation: 'Poultry has a moderate purine content.' },
            { foodName: 'Mixed Greens', purineLevel: 'Low', purineAmount: '< 50mg', explanation: 'Most vegetables are low in purines.' },
            { foodName: 'Vinaigrette Dressing', purineLevel: 'Low', purineAmount: '< 50mg', explanation: 'Usually oil and vinegar based, which is safe.' }
        ],
        recommendations: 'A good, balanced meal. Ensure the chicken is skinless. Be mindful of dressings that might be high in sugar or unhealthy fats.',
        alternatives: ['Tofu Salad', 'Salmon Salad (in moderation)', 'Quinoa Bowl with Roasted Vegetables']
    },
    {
        id: '1716793292021',
        mealName: 'Vegetable Stir-fry with Tofu',
        mealDescription: 'A mix of various vegetables and tofu stir-fried in a light sauce, served with rice.',
        totalPurineScore: 22,
        overallRiskLevel: 'Low',
        overallSummary: 'This meal is composed of low-purine ingredients like vegetables, tofu, and rice, making it a very safe and recommended option for gout patients.',
        items: [
            { foodName: 'Tofu', purineLevel: 'Low', purineAmount: '< 50mg', explanation: 'A great low-purine protein source.' },
            { foodName: 'Broccoli & Carrots', purineLevel: 'Low', purineAmount: '< 50mg', explanation: 'Most vegetables are safe.' },
            { foodName: 'Mushrooms', purineLevel: 'Moderate', purineAmount: '50-100mg', explanation: 'Fine in moderation.' },
            { foodName: 'Rice', purineLevel: 'Low', purineAmount: '< 50mg', explanation: 'Grains are safe.' }
        ],
        recommendations: 'An excellent and balanced meal. To make it even healthier, use brown rice and control the amount of sodium in the sauce.',
        alternatives: ['Lentil Soup', 'Bean Burrito Bowl', 'Vegetable Curry']
    }
];
const sampleMyMedications: MedicationInfo[] = [
    { id: 'med1', name: 'Allopurinol' },
    { id: 'med2', name: 'Colchicine' },
    { id: 'med3', name: 'Febuxostat' }
];

const sampleFavoriteMeals: MealAnalysis[] = [sampleMealAnalyses[2]];

const createPastDate = (daysAgo: number, hour: number = 12) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(hour, 0, 0, 0);
    return date.toISOString();
};

const sampleLogs: LogEntry[] = [];
const today = new Date();

for (let i = 30; i >= 0; i--) {
    // Base logs: medication and some hydration almost every day
    sampleLogs.push({ id: `log${i}-med`, timestamp: createPastDate(i, 8), type: 'medication', data: { name: 'Allopurinol', timeOfDay: 'morning', intakeTime: createPastDate(i, 8) } });
    sampleLogs.push({ id: `log${i}-hyd1`, timestamp: createPastDate(i, 10), type: 'hydration', data: { amount: 500, drinkType: 'water' } });
    sampleLogs.push({ id: `log${i}-hyd2`, timestamp: createPastDate(i, 15), type: 'hydration', data: { amount: 500, drinkType: 'water' } });
    
    // Add variations based on the day
    switch (i) {
        // Week 4 (most recent)
        case 0: // Today
            sampleLogs.push({ id: `log${i}-meal`, timestamp: createPastDate(i, 13), type: 'purine_intake', data: { ...sampleMealAnalyses[2], timeOfDay: 'lunch' } }); // Vegetable Stir-fry
            sampleLogs.push({ id: `log${i}-hyd3`, timestamp: createPastDate(i, 18), type: 'hydration', data: { amount: 1000, drinkType: 'water' } }); // Extra water
             sampleLogs.push({ id: `log${i}-well`, timestamp: createPastDate(i, 20), type: 'wellness', data: { sleepHours: 7.5, stressLevel: 2, activity: "30 min walk" } });
            break;
        case 1: // Yesterday
            sampleLogs.push({ id: `log${i}-meal`, timestamp: createPastDate(i, 19), type: 'purine_intake', data: { ...sampleMealAnalyses[0], timeOfDay: 'dinner' } }); // Cheeseburger
            sampleLogs.push({ id: `log${i}-symp`, timestamp: createPastDate(i, 12), type: 'symptom', data: { location: 'Right big toe', painLevel: 6, symptoms: ['swelling', 'redness'], notes: "Feeling a flare-up coming on after yesterday's dinner." } });
            sampleLogs.push({ id: `log${i}-well`, timestamp: createPastDate(i, 20), type: 'wellness', data: { stressLevel: 5 } });
            break;
        case 2: // Day before yesterday
            sampleLogs.push({ id: `log${i}-meal`, timestamp: createPastDate(i, 13), type: 'purine_intake', data: { ...sampleMealAnalyses[1], timeOfDay: 'lunch' } }); // Chicken Salad
            sampleLogs.push({ id: `log${i}-hyd3`, timestamp: createPastDate(i, 9), type: 'hydration', data: { amount: 500, drinkType: 'water' } });
            break;
        case 3:
            sampleLogs.push({ id: `log${i}-alc`, timestamp: createPastDate(i, 20), type: 'alcohol', data: { type: 'Beer', amount: 500 } });
            sampleLogs.push({ id: `log${i}-meal`, timestamp: createPastDate(i, 18), type: 'purine_intake', data: { ...sampleMealAnalyses[0], timeOfDay: 'dinner' } }); // Cheeseburger
             sampleLogs.push({ id: `log${i}-well`, timestamp: createPastDate(i, 21), type: 'wellness', data: { stressLevel: 4 } });
            break;
        case 7: // A week ago
            sampleLogs.push({ id: `log${i}-meal`, timestamp: createPastDate(i, 13), type: 'purine_intake', data: { ...sampleMealAnalyses[2], timeOfDay: 'lunch' } }); // Good meal
             sampleLogs.push({ id: `log${i}-well`, timestamp: createPastDate(i, 9), type: 'wellness', data: { sleepHours: 8, stressLevel: 2, activity: "1 hour gym", weight: 84.5 } });
            break;
            
        // Week 3
        case 10:
            sampleLogs.push({ id: `log${i}-symp`, timestamp: createPastDate(i, 7), type: 'symptom', data: { location: 'Left knee', painLevel: 4, symptoms: ['swelling'], notes: "Woke up with a dull ache." } });
            sampleLogs.push({ id: `log${i}-meal`, timestamp: createPastDate(i, 13), type: 'purine_intake', data: { ...sampleMealAnalyses[2], timeOfDay: 'lunch' } }); // Eating clean
            break;
        case 11:
            sampleLogs.push({ id: `log${i}-meal`, timestamp: createPastDate(i, 19), type: 'purine_intake', data: { ...sampleMealAnalyses[0], timeOfDay: 'dinner' } }); // High purine meal
            break;
        case 14: // Two weeks ago
             sampleLogs.push({ id: `log${i}-well`, timestamp: createPastDate(i, 9), type: 'wellness', data: { sleepHours: 6, stressLevel: 3, weight: 85.0 } });
             sampleLogs.push({ id: `log${i}-meal`, timestamp: createPastDate(i, 13), type: 'purine_intake', data: { ...sampleMealAnalyses[1], timeOfDay: 'lunch' } });
            break;

        // Week 2
        case 18:
            sampleLogs.push({ id: `log${i}-alc`, timestamp: createPastDate(i, 21), type: 'alcohol', data: { type: 'Wine', amount: 300 } });
            sampleLogs.push({ id: `log${i}-meal`, timestamp: createPastDate(i, 19), type: 'purine_intake', data: { ...sampleMealAnalyses[1], timeOfDay: 'dinner' } });
            break;
        case 20:
            sampleLogs.push({ id: `log${i}-symp`, timestamp: createPastDate(i, 20), type: 'symptom', data: { location: 'Right big toe', painLevel: 7, symptoms: ['redness', 'swelling', 'warmth'], notes: "Major flare-up. Very painful." } });
            sampleLogs.push({ id: `log${i}-med2`, timestamp: createPastDate(i, 20), type: 'medication', data: { name: 'Colchicine', timeOfDay: 'dinner', intakeTime: createPastDate(i, 20) } }); // Flare-up medication
            break;
        case 21: // 3 weeks ago
            sampleLogs.push({ id: `log${i}-meal`, timestamp: createPastDate(i, 19), type: 'purine_intake', data: { ...sampleMealAnalyses[0], timeOfDay: 'dinner' } }); // Trigger meal
             sampleLogs.push({ id: `log${i}-well`, timestamp: createPastDate(i, 22), type: 'wellness', data: { stressLevel: 5, sleepHours: 4 } }); // Stress and poor sleep
            break;

        // Week 1 (oldest)
        case 25:
            sampleLogs.push({ id: `log${i}-well`, timestamp: createPastDate(i, 8), type: 'wellness', data: { weight: 85.5, activity: "Rest day" } });
            sampleLogs.push({ id: `log${i}-meal`, timestamp: createPastDate(i, 12), type: 'purine_intake', data: { ...sampleMealAnalyses[2], timeOfDay: 'lunch' } });
            break;
        case 28: // 4 weeks ago
            sampleLogs.push({ id: `log${i}-meal`, timestamp: createPastDate(i, 13), type: 'purine_intake', data: { ...sampleMealAnalyses[1], timeOfDay: 'lunch' } }); // Chicken Salad
            sampleLogs.push({ id: `log${i}-hyd3`, timestamp: createPastDate(i, 19), type: 'hydration', data: { amount: 750, drinkType: 'water' } });
            break;

        default:
            // For other days, add a random meal to make it look populated
            if (i > 2 && Math.random() > 0.4) {
                const randomMeal = sampleMealAnalyses[Math.floor(Math.random() * sampleMealAnalyses.length)];
                const timeOfDay = ['lunch', 'dinner'][Math.floor(Math.random() * 2)] as 'lunch' | 'dinner';
                sampleLogs.push({ id: `log${i}-meal-rand`, timestamp: createPastDate(i, timeOfDay === 'lunch' ? 13 : 19), type: 'purine_intake', data: { ...randomMeal, timeOfDay } });
            }
             if (i > 2 && Math.random() > 0.7) {
                 sampleLogs.push({ id: `log${i}-well-rand`, timestamp: createPastDate(i, 20), type: 'wellness', data: { sleepHours: Math.floor(Math.random() * 4) + 5, stressLevel: (Math.floor(Math.random() * 4) + 1) as 1|2|3|4|5 } });
             }
            break;
    }
}
// Sort logs by timestamp descending to ensure they are always in the correct order
sampleLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

// --- END OF SAMPLE DATA ---

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

  const setValue = (value: T | ((val: T) => T)) => {
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

const AppContent: React.FC = () => {
  const { ready, t } = useI18n();

  const [logs, setLogs] = useLocalStorage<LogEntry[]>('goutcare-logs', sampleLogs);
  const [chatHistory, setChatHistory] = useLocalStorage<ChatMessage[]>('goutcare-chat', []);
  const [foodHistory, setFoodHistory] = useLocalStorage<MealAnalysis[]>('goutcare-food-history', sampleMealAnalyses);
  const [favoriteMeals, setFavoriteMeals] = useLocalStorage<MealAnalysis[]>('goutcare-favorites', sampleFavoriteMeals);
  const [myMedications, setMyMedications] = useLocalStorage<MedicationInfo[]>('goutcare-my-meds', sampleMyMedications);
  
  const [preferences, setPreferences] = useLocalStorage<Preferences>('goutcare-prefs', {
    weightUnit: 'kg',
    fluidUnit: 'ml',
    dailyFluidGoal: 2000,
    dailyPurineGoal: 400,
    profileComplete: true,
    gender: 'male',
    birthYear: 1985,
    height: 171,
    weight: 96,
  });

  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logModalDate, setLogModalDate] = useState(new Date());
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isProfileSetupModalOpen, setIsProfileSetupModalOpen] = useState(false);
  const [isQuickLogDrawerOpen, setIsQuickLogDrawerOpen] = useState(false);

  const [risk, setRisk] = useState('');
  const [summary, setSummary] = useState('');
  const [forecast, setForecast] = useState('');
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);
  const [healthReport, setHealthReport] = useState<HealthReport | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [coachingNote, setCoachingNote] = useState<string | null | undefined>(undefined);
  const [isLoadingCoachingNote, setIsLoadingCoachingNote] = useState(true);

  const [showWelcome, setShowWelcome] = useState(localStorage.getItem('goutcare-welcomed') !== 'true');

  const chatRef = useRef<{ addMessage: (message: ChatMessage) => void }>(null);

  const fetchForecast = useCallback(async () => {
    setIsLoadingForecast(true);
    try {
        const result = await generateGoutForecast(logs, chatHistory, preferences);
        const [riskLine, summaryLine, ...forecastLines] = result.split('\n');
        setRisk(riskLine?.replace('RISK_LEVEL: ', '').trim() || t('errors.analysisError'));
        setSummary(summaryLine?.replace('SUMMARY: ', '').trim() || '');
        setForecast(forecastLines.join('\n').replace('FORECAST: ', '').trim() || '');
    } catch (e) {
        console.error(e);
        setRisk('Error');
        setSummary(t('errors.analysisError'));
        setForecast('');
    } finally {
        setIsLoadingForecast(false);
    }
  }, [logs, chatHistory, preferences, t]);
  
  const fetchCoachingNote = useCallback(async () => {
    setIsLoadingCoachingNote(true);
    const todayStr = new Date().toDateString();
    const lastNoteStr = localStorage.getItem('goutcare-last-note-date');
    if (lastNoteStr === todayStr) {
        setCoachingNote(localStorage.getItem('goutcare-last-note'));
        setIsLoadingCoachingNote(false);
        return;
    }
    
    try {
      const note = await generateCoachingNote(logs.slice(0, 20));
      setCoachingNote(note);
      localStorage.setItem('goutcare-last-note', note || '');
      localStorage.setItem('goutcare-last-note-date', todayStr);
    } catch (e) {
        console.error(e);
        setCoachingNote(null);
    } finally {
        setIsLoadingCoachingNote(false);
    }
  }, [logs]);

  useEffect(() => {
    if (ready) {
      if(logs.length > 0) {
          fetchForecast();
          fetchCoachingNote();
      } else {
        setIsLoadingForecast(false);
        setIsLoadingCoachingNote(false);
      }
    }
  }, [ready, fetchForecast, fetchCoachingNote, logs.length]);
  
  useEffect(() => {
    if (!preferences.profileComplete && !showWelcome && !isProfileSetupModalOpen) {
        setIsProfileSetupModalOpen(true);
    }
  }, [preferences.profileComplete, showWelcome, isProfileSetupModalOpen]);
  
  const handleAddLog = useCallback((logData: LogData, date: Date) => {
    const newLog: LogEntry = {
      id: `log-${Date.now()}`,
      timestamp: date.toISOString(),
      ...logData,
    };
    
    if (newLog.type === 'purine_intake') {
        const mealData = newLog.data as PurineIntakeData;
        setFoodHistory(prev => [mealData, ...prev.filter(item => item.id !== mealData.id)]);
    }

    setLogs(prev => [newLog, ...prev].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  }, [setLogs, setFoodHistory]);

  const handleDeleteLog = (logId: string) => {
    setLogs(prev => prev.filter(log => log.id !== logId));
  };

  const handleOpenLogModal = (date: Date) => {
    setLogModalDate(date);
    setIsLogModalOpen(true);
  };
  
  const handleToggleFavoriteMeal = useCallback((meal: MealAnalysis) => {
    setFavoriteMeals(prev => {
        const isFav = prev.some(f => f.id === meal.id);
        if (isFav) {
            return prev.filter(f => f.id !== meal.id);
        } else {
            return [meal, ...prev];
        }
    });
  }, [setFavoriteMeals]);

  const handleGenerateReport = async () => {
    setIsLoadingReport(true);
    setHealthReport(null);
    try {
      const reportData = await generateHealthReport(logs);
      setHealthReport(reportData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingReport(false);
    }
  };
  
  const handleAddToDailyLogFromFood = useCallback((meal: MealAnalysis, timeOfDay: PurineIntakeData['timeOfDay']) => {
      const logData: LogData = {
          type: 'purine_intake',
          data: { ...meal, timeOfDay }
      };
      handleAddLog(logData, new Date());
  }, [handleAddLog]);

  const handleSaveProfile = (profileData: Partial<Preferences>) => {
    setPreferences(prev => ({
        ...prev,
        ...profileData,
        profileComplete: true,
    }));
    setIsProfileSetupModalOpen(false);
  };

  const handleReset = () => {
    if (window.confirm(t('confirmations.resetAllData'))) {
      setLogs([]);
      setChatHistory([]);
      setFoodHistory([]);
      setFavoriteMeals([]);
      setPreferences({
        weightUnit: 'kg',
        fluidUnit: 'ml',
        dailyFluidGoal: 2000,
        dailyPurineGoal: 400,
        profileComplete: false,
      });
      setHealthReport(null);
      localStorage.removeItem('goutcare-welcomed');
      window.location.reload();
    }
  };
  
  const handleExport = () => {
      const data = {
          logs,
          chatHistory,
          foodHistory,
          favoriteMeals,
          preferences,
          myMedications
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `goutcare_ai_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          if (!window.confirm(t('confirmations.importOverwrite'))) return;
          const reader = new FileReader();
          reader.onload = (e) => {
              try {
                  const data = JSON.parse(e.target?.result as string);
                  if (data.logs) setLogs(data.logs);
                  if (data.chatHistory) setChatHistory(data.chatHistory);
                  if (data.foodHistory) setFoodHistory(data.foodHistory);
                  if (data.favoriteMeals) setFavoriteMeals(data.favoriteMeals);
                  if (data.preferences) setPreferences(data.preferences);
                  if (data.myMedications) setMyMedications(data.myMedications);
                  alert('Data imported successfully!');
              } catch (error) {
                  alert(t('errors.invalidFileFormat'));
                  console.error(error);
              }
          };
          reader.onerror = () => alert(t('errors.fileReadError'));
          reader.readAsText(file);
      }
  };
  
  const handleDismissWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('goutcare-welcomed', 'true');
    // After dismissing welcome, if profile is not complete, show profile setup
    if (!preferences.profileComplete) {
      setIsProfileSetupModalOpen(true);
    }
  };

  if (!ready) {
    return <div className="flex items-center justify-center h-screen"><Spinner/></div>;
  }

  const renderActiveView = () => {
    switch(activeView) {
      case 'dashboard':
        return <DashboardPanel 
            logs={logs} 
            preferences={preferences} 
            risk={risk}
            summary={summary}
            forecast={forecast}
            isLoadingForecast={isLoadingForecast}
            onAddLog={handleAddLog}
            onDeleteLog={handleDeleteLog}
            showWelcome={showWelcome}
            onDismissWelcome={handleDismissWelcome}
            healthReport={healthReport}
            onRefreshForecast={fetchForecast}
            coachingNote={coachingNote}
            isLoadingCoachingNote={isLoadingCoachingNote}
        />;
      case 'calendar':
        return <CalendarPanel logs={logs} onOpenLogModal={handleOpenLogModal} preferences={preferences}/>;
      case 'chat':
        return <ChatPanel ref={chatRef} history={chatHistory} setHistory={setChatHistory} />;
      case 'food':
          return <FoodAnalyzerPanel 
            logs={logs} 
            preferences={preferences} 
            history={foodHistory} 
            setHistory={setFoodHistory} 
            favoriteMeals={favoriteMeals}
            onToggleFavorite={handleToggleFavoriteMeal}
            onAddToDailyLog={handleAddToDailyLogFromFood}
          />;
      case 'report':
          return <ReportPanel 
            logs={logs} 
            preferences={preferences}
            report={healthReport}
            isLoading={isLoadingReport}
            onGenerateReport={handleGenerateReport}
          />;
      default:
        return <div>Not Found</div>;
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 text-slate-900 dark:text-slate-200">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onReset={handleReset} onExport={handleExport} onImport={handleImport} onOpenSettings={() => setIsSettingsModalOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:pb-6 pb-24">
          <div className={`h-full ${activeView === 'chat' || activeView === 'food' ? 'flex' : ''}`}>
              {renderActiveView()}
          </div>
        </main>
        <BottomNavBar activeView={activeView} setActiveView={setActiveView} />
        <FloatingActionButton onClick={() => handleOpenLogModal(new Date())} />
      </div>
      {isProfileSetupModalOpen && (
        <ProfileSetupModal
            isOpen={isProfileSetupModalOpen}
            onSave={handleSaveProfile}
            preferences={preferences}
        />
      )}
      {isLogModalOpen && <LogModal 
        date={logModalDate} 
        onClose={() => setIsLogModalOpen(false)} 
        onAddLog={handleAddLog} 
        preferences={preferences} 
        logs={logs}
        foodHistory={foodHistory}
        setFoodHistory={setFoodHistory}
        favoriteMeals={favoriteMeals}
        myMedications={myMedications}
        setMyMedications={setMyMedications}
        onToggleFavorite={handleToggleFavoriteMeal}
       />}
      {isSettingsModalOpen && <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} preferences={preferences} setPreferences={setPreferences} />}
      <QuickLogDrawer 
        isOpen={isQuickLogDrawerOpen} 
        onClose={() => setIsQuickLogDrawerOpen(false)}
        onAddLog={handleAddLog}
        preferences={preferences}
        logs={logs}
        foodHistory={foodHistory}
        favoriteMeals={favoriteMeals}
        myMedications={myMedications}
       />
    </div>
  );
}

const App: React.FC = () => (
  <I18nProvider>
    <AppContent />
  </I18nProvider>
);


export default App;