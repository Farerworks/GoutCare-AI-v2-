

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
import BottomNavBar from './components/BottomNavBar';
import FloatingActionButton from './components/FloatingActionButton';
import QuickLogDrawer from './components/QuickLogDrawer';
import Sidebar from './components/Sidebar';
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

const sampleLogs: LogEntry[] = [
    // Today's logs
    { id: 'log' + Date.now() + 1, timestamp: createPastDate(0, 13), type: 'purine_intake', data: { ...sampleMealAnalyses[2], timeOfDay: 'lunch' } },
    { id: 'log' + Date.now() + 2, timestamp: createPastDate(0, 8), type: 'medication', data: { name: 'Allopurinol', timeOfDay: 'morning', intakeTime: createPastDate(0, 8) } },
    { id: 'log' + Date.now() + 3, timestamp: createPastDate(0, 10), type: 'hydration', data: { amount: 1500 } },
    { id: 'log' + Date.now() + 3.1, timestamp: createPastDate(0, 7), type: 'wellness', data: { weight: 75.5 } },
    // Yesterday's logs
    { id: 'log' + Date.now() + 4, timestamp: createPastDate(1, 19), type: 'purine_intake', data: { ...sampleMealAnalyses[0], timeOfDay: 'dinner' } },
    { id: 'log' + Date.now() + 4.1, timestamp: createPastDate(1, 20), type: 'alcohol', data: { type: 'Beer', amount: 360, notes: 'At a social event' } },
    { id: 'log' + Date.now() + 5, timestamp: createPastDate(1, 22), type: 'symptom', data: { location: 'Right big toe', painLevel: 7, symptoms: ['swelling', 'redness'] } },
    { id: 'log' + Date.now() + 6, timestamp: createPastDate(1, 14), type: 'hydration', data: { amount: 500 } },
    { id: 'log' + Date.now() + 7, timestamp: createPastDate(1, 9), type: 'wellness', data: { stressLevel: 5, notes: 'Stressed due to an important meeting' } },
    // 2 days ago
    { id: 'log' + Date.now() + 8, timestamp: createPastDate(2, 18), type: 'purine_intake', data: { ...sampleMealAnalyses[1], timeOfDay: 'dinner' } },
    { id: 'log' + Date.now() + 9, timestamp: createPastDate(2, 12), type: 'hydration', data: { amount: 2000 } },
    { id: 'log' + Date.now() + 9.1, timestamp: createPastDate(2, 7), type: 'wellness', data: { sleepHours: 6 } },
    // 3 days ago
    { id: 'log' + Date.now() + 10, timestamp: createPastDate(3, 8), type: 'medication', data: { name: 'Allopurinol', timeOfDay: 'morning', intakeTime: createPastDate(3, 8) } },
    { id: 'log' + Date.now() + 11, timestamp: createPastDate(3, 13), type: 'purine_intake', data: { ...sampleMealAnalyses[1], timeOfDay: 'lunch' } },
    { id: 'log' + Date.now() + 12, timestamp: createPastDate(3, 15), type: 'hydration', data: { amount: 2200 } },
    // 4 days ago
    { id: 'log' + Date.now() + 13, timestamp: createPastDate(4, 19), type: 'purine_intake', data: { ...sampleMealAnalyses[2], timeOfDay: 'dinner' } },
    { id: 'log' + Date.now() + 14, timestamp: createPastDate(4, 7), type: 'wellness', data: { sleepHours: 8, stressLevel: 2 } },
    { id: 'log' + Date.now() + 15, timestamp: createPastDate(4, 11), type: 'hydration', data: { amount: 2500 } },
    // 5 days ago (Weekend start)
    { id: 'log' + Date.now() + 16, timestamp: createPastDate(5, 20), type: 'purine_intake', data: { ...sampleMealAnalyses[0], timeOfDay: 'dinner' } },
    { id: 'log' + Date.now() + 17, timestamp: createPastDate(5, 20), type: 'alcohol', data: { type: 'Beer', amount: 500 } },
    { id: 'log' + Date.now() + 18, timestamp: createPastDate(5, 10), type: 'hydration', data: { amount: 1000 } },
    // 6 days ago
    { id: 'log' + Date.now() + 19, timestamp: createPastDate(6, 9), type: 'symptom', data: { location: 'Left knee', painLevel: 5, symptoms: ['swelling'] } },
    { id: 'log' + Date.now() + 20, timestamp: createPastDate(6, 9), type: 'medication', data: { name: 'Colchicine', timeOfDay: 'morning', intakeTime: createPastDate(6, 9) } },
    { id: 'log' + Date.now() + 21, timestamp: createPastDate(6, 12), type: 'hydration', data: { amount: 3000 } },
    // 7 days ago
    { id: 'log' + Date.now() + 22, timestamp: createPastDate(7, 13), type: 'purine_intake', data: { ...sampleMealAnalyses[2], timeOfDay: 'lunch' } },
    { id: 'log' + Date.now() + 23, timestamp: createPastDate(7, 7), type: 'wellness', data: { weight: 75.8 } },
    { id: 'log' + Date.now() + 24, timestamp: createPastDate(7, 15), type: 'hydration', data: { amount: 2800 } },
    // 8 days ago
    { id: 'log' + Date.now() + 25, timestamp: createPastDate(8, 19), type: 'purine_intake', data: { ...sampleMealAnalyses[1], timeOfDay: 'dinner' } },
    { id: 'log' + Date.now() + 26, timestamp: createPastDate(8, 8), type: 'medication', data: { name: 'Allopurinol', timeOfDay: 'morning', intakeTime: createPastDate(8, 8) } },
    // 9 days ago
    { id: 'log' + Date.now() + 27, timestamp: createPastDate(9, 14), type: 'hydration', data: { amount: 2100 } },
    { id: 'log' + Date.now() + 28, timestamp: createPastDate(9, 10), type: 'wellness', data: { stressLevel: 4, notes: 'Work deadline' } },
    // 10 days ago
    { id: 'log' + Date.now() + 29, timestamp: createPastDate(10, 20), type: 'purine_intake', data: { ...sampleMealAnalyses[0], timeOfDay: 'dinner' } },
    { id: 'log' + Date.now() + 30, timestamp: createPastDate(10, 13), type: 'hydration', data: { amount: 1200 } },
    // 11 days ago
    { id: 'log' + Date.now() + 31, timestamp: createPastDate(11, 13), type: 'purine_intake', data: { ...sampleMealAnalyses[0], timeOfDay: 'lunch' } },
    { id: 'log' + Date.now() + 32, timestamp: createPastDate(11, 21), type: 'alcohol', data: { type: 'Soju', amount: 360 } },
    { id: 'log' + Date.now() + 33, timestamp: createPastDate(11, 23), type: 'symptom', data: { location: 'Right big toe', painLevel: 6, symptoms: ['redness'] } },
    // 12 days ago
    { id: 'log' + Date.now() + 34, timestamp: createPastDate(12, 10), type: 'hydration', data: { amount: 2900 } },
    { id: 'log' + Date.now() + 35, timestamp: createPastDate(12, 9), type: 'medication', data: { name: 'Colchicine', timeOfDay: 'morning', intakeTime: createPastDate(12, 9) } },
    // 13 days ago
    { id: 'log' + Date.now() + 36, timestamp: createPastDate(13, 19), type: 'purine_intake', data: { ...sampleMealAnalyses[1], timeOfDay: 'dinner' } },
    { id: 'log' + Date.now() + 37, timestamp: createPastDate(13, 7), type: 'wellness', data: { sleepHours: 5 } },
    // 14 days ago
    { id: 'log' + Date.now() + 38, timestamp: createPastDate(14, 13), type: 'purine_intake', data: { ...sampleMealAnalyses[2], timeOfDay: 'lunch' } },
    { id: 'log' + Date.now() + 39, timestamp: createPastDate(14, 15), type: 'hydration', data: { amount: 2600 } },
    { id: 'log' + Date.now() + 40, timestamp: createPastDate(14, 7), type: 'wellness', data: { weight: 76.0 } },
    // 15 days ago
    { id: 'log' + Date.now() + 41, timestamp: createPastDate(15, 11), type: 'hydration', data: { amount: 2300 } },
    { id: 'log' + Date.now() + 42, timestamp: createPastDate(15, 8), type: 'medication', data: { name: 'Allopurinol', timeOfDay: 'morning', intakeTime: createPastDate(15, 8) } },
    // 16 days ago
    { id: 'log' + Date.now() + 43, timestamp: createPastDate(16, 18), type: 'purine_intake', data: { ...sampleMealAnalyses[1], timeOfDay: 'dinner' } },
    { id: 'log' + Date.now() + 44, timestamp: createPastDate(16, 10), type: 'wellness', data: { stressLevel: 3 } },
];


const sampleChatHistory: ChatMessage[] = [
    {
        role: 'user',
        parts: [{ text: 'Is it okay for gout patients to drink beer?' }],
        timestamp: new Date().toISOString()
    },
    {
        role: 'model',
        parts: [{ text: "Beer is particularly bad for gout patients. Compared to other alcoholic beverages, beer has a significantly higher purine content. Additionally, alcohol itself promotes uric acid production and inhibits its excretion. Even a small amount can trigger an acute gout attack, so it's best to avoid it as much as possible.\n\nImportant: I am an AI assistant and not a medical professional. All information provided is for informational and educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with your doctor or another qualified healthcare provider if you have any health concerns." }],
        timestamp: new Date().toISOString()
    }
];

// --- END OF SAMPLE DATA ---


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

const AppContent: React.FC = () => {
  const { t, ready } = useI18n();
  const [logs, setLogs] = useLocalStorage<LogEntry[]>('goutcare-logs', sampleLogs);
  const [chatHistory, setChatHistory] = useLocalStorage<ChatMessage[]>('goutcare-chatHistory', sampleChatHistory);
  const [foodHistory, setFoodHistory] = useLocalStorage<MealAnalysis[]>('goutcare-meal-history', sampleMealAnalyses);
  const [favoriteMeals, setFavoriteMeals] = useLocalStorage<MealAnalysis[]>('goutcare-favorite-meals', sampleFavoriteMeals);
  const [myMedications, setMyMedications] = useLocalStorage<MedicationInfo[]>('goutcare-my-meds', sampleMyMedications);

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
  const [showWelcome, setShowWelcome] = useLocalStorage<boolean>('goutcare-show-welcome', logs.length === 0);

  // State for Daily Gout Risk Advisor
  const [risk, setRisk] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [forecast, setForecast] = useState<string>('');
  const [isLoadingForecast, setIsLoadingForecast] = useState<boolean>(true);

  // State for AI Coach Note
  const [coachingNote, setCoachingNote] = useLocalStorage<CoachingNote | null>('goutcare-coaching-note', null);
  const [isLoadingCoachingNote, setIsLoadingCoachingNote] = useState<boolean>(true);

  // State for AI Health Report
  const [healthReport, setHealthReport] = useLocalStorage<HealthReport | null>('goutcare-health-report', null);
  const [isReportLoading, setIsReportLoading] = useState<boolean>(false);
  
  const chatPanelRef = useRef<{ addMessage: (message: ChatMessage) => void }>(null);
  
  const timeOfDayLabels: Record<string, string> = {
    morning: t('timeOfDay.morning'),
    lunch: t('timeOfDay.lunch'),
    dinner: t('timeOfDay.dinner'),
    bedtime: t('timeOfDay.bedtime'),
    breakfast: t('timeOfDay.breakfast'),
    snack: t('timeOfDay.snack')
  };

  const fetchForecast = useCallback(async () => {
    setIsLoadingForecast(true);
    try {
        const result = await generateGoutForecast(logs, chatHistory);
        const lines = result.split('\n');
        const riskLine = lines.find(l => l.startsWith('RISK_LEVEL:'));
        const summaryLine = lines.find(l => l.startsWith('SUMMARY:'));
        const forecastLine = lines.find(l => l.startsWith('FORECAST:'));
        
        setRisk(riskLine?.replace('RISK_LEVEL:', '').trim() || 'Unknown');
        setSummary(summaryLine?.replace('SUMMARY:', '').trim() || 'Failed to load forecast.');
        setForecast(forecastLine?.replace('FORECAST:', '').trim() || '');
    } catch (e) {
        console.error("Error generating forecast:", e);
        setRisk('Error');
        setSummary('An error occurred while generating the forecast.');
        setForecast('You might have exceeded your API quota. Please try refreshing after a while.');
    } finally {
        setIsLoadingForecast(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCoachingNote = useCallback(async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (coachingNote?.date === todayStr) {
        setIsLoadingCoachingNote(false);
        return;
    }

    setIsLoadingCoachingNote(true);
    try {
        const note = await generateCoachingNote(logs);
        if (note) {
            setCoachingNote({ note, date: todayStr });
        }
    } catch (e) {
        console.error("Error generating coaching note:", e);
        // Do not show an error in the UI, just fail silently.
    } finally {
        setIsLoadingCoachingNote(false);
    }
  }, [logs, coachingNote, setCoachingNote]);

  useEffect(() => {
    fetchForecast();
    fetchCoachingNote();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleGenerateReport = useCallback(async () => {
    setIsReportLoading(true);
    try {
        const reportData = await generateHealthReport(logs);
        setHealthReport(reportData);
    } catch(e) {
        console.error("Failed to generate health report", e);
        // Optionally, set an error state to show in the UI
    } finally {
        setIsReportLoading(false);
    }
  }, [logs, setHealthReport]);

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
            logSummary = `I just logged a symptom in my ${newLog.data.location} with a pain level of ${newLog.data.painLevel}/10. What should I do?`;
            break;
        case 'medication': {
            const { name } = newLog.data as MedicationData;
            const medDesc = name;
            logSummary = `I've just logged taking my medication: "${medDesc}" for the ${timeOfDayLabels[newLog.data.timeOfDay] || 'designated time'}.`;
            break;
        }
        case 'hydration': {
            const data = newLog.data as HydrationData;
            logSummary = `I just logged drinking ${formatFluid(data.amount, preferences.fluidUnit)} of water.`;
            if (data.notes) logSummary += ` (Note: ${data.notes})`;
            break;
        }
         case 'alcohol': {
            const data = newLog.data as AlcoholData;
            logSummary = `I just logged drinking ${formatFluid(data.amount, preferences.fluidUnit)} of ${data.type}. Is this okay for my gout?`;
            if (data.notes) logSummary += ` (Note: ${data.notes})`;
            break;
        }
        case 'wellness': {
            const wellnessParts = [];
            const data = newLog.data as WellnessData;
            if (data.weight) wellnessParts.push(`weight ${formatWeight(data.weight, preferences.weightUnit)}`);
            if (data.sleepHours) wellnessParts.push(`sleep ${data.sleepHours} hours`);
            if (data.stressLevel) wellnessParts.push(`stress level ${data.stressLevel}/5`);
            if (data.activity) wellnessParts.push(`activity '${data.activity}'`);
            if (data.notes) wellnessParts.push(`note: "${data.notes}"`);
    
            if (wellnessParts.length > 0) {
                logSummary = `I've just logged my wellness status: ${wellnessParts.join(', ')}.`;
                 if (data.notes) {
                    logSummary += ` Could this note affect my gout?`;
                }
            }
            break;
        }
        case 'purine_intake': {
            const mealTime = timeOfDayLabels[(newLog.data as PurineIntakeData).timeOfDay] || 'a meal';
            logSummary = `I've just logged "${newLog.data.mealName}" (Purine Score: ${newLog.data.totalPurineScore}) for ${mealTime}. Is this okay considering my total intake today?`;
            break;
        }
    }
    
    if (logSummary) {
      sendActionToAI(logSummary);
    }

  }, [setLogs, sendActionToAI, preferences, timeOfDayLabels]);

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
    if (window.confirm(t('confirmations.resetAllData'))) {
        setLogs([]);
        setChatHistory([]);
        setFoodHistory([]);
        setFavoriteMeals([]);
        setMyMedications([]);
        setPreferences({ 
            weightUnit: 'kg', 
            fluidUnit: 'ml', 
            dailyFluidGoal: 2500, 
            dailyPurineGoal: 150 
        });
        setHealthReport(null);
        setCoachingNote(null);
        setShowWelcome(true);
        window.localStorage.removeItem('goutcare-logs');
        window.localStorage.removeItem('goutcare-chatHistory');
        window.localStorage.removeItem('goutcare-meal-history');
        window.localStorage.removeItem('goutcare-favorite-meals');
        window.localStorage.removeItem('goutcare-my-meds');
        window.localStorage.removeItem('goutcare-prefs');
        window.localStorage.removeItem('goutcare-show-welcome');
        window.localStorage.removeItem('goutcare-health-report');
        window.localStorage.removeItem('goutcare-coaching-note');
        window.location.reload();
    }
  };

  const handleDataExport = () => {
      const data = {
          logs,
          chatHistory,
          foodHistory,
          favoriteMeals,
          myMedications,
          preferences,
          healthReport,
          coachingNote
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
                  if (data.logs && data.chatHistory && window.confirm(t('confirmations.importOverwrite'))) {
                      setLogs(data.logs);
                      setChatHistory(data.chatHistory);
                      if(data.foodHistory) setFoodHistory(data.foodHistory);
                      if(data.favoriteMeals) setFavoriteMeals(data.favoriteMeals);
                      if(data.myMedications) setMyMedications(data.myMedications);
                      if (data.preferences) setPreferences(data.preferences);
                      if (data.healthReport) setHealthReport(data.healthReport);
                      if (data.coachingNote) setCoachingNote(data.coachingNote);
                  } else {
                    alert(t('errors.invalidFileFormat'));
                  }
              } catch (error) {
                  alert(t('errors.fileReadError'));
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
      food: 'overflow-hidden',
      report: 'overflow-y-auto p-4 sm:p-6'
  };

  if (!ready) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-100 dark:bg-slate-900">
            <p className="text-slate-600 dark:text-slate-300">Loading...</p>
        </div>
    );
  }

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
            healthReport={healthReport}
            onRefreshForecast={fetchForecast}
            coachingNote={coachingNote?.note}
            isLoadingCoachingNote={isLoadingCoachingNote}
        />;
      case 'calendar':
        return <CalendarPanel logs={logs} onOpenLogModal={handleOpenLogModal} preferences={preferences} />;
      case 'food':
        return <FoodAnalyzerPanel 
            logs={logs}
            preferences={preferences}
            history={foodHistory} 
            setHistory={setFoodHistory}
            favoriteMeals={favoriteMeals}
            onToggleFavorite={handleToggleFavorite}
            onAddToDailyLog={handleAddToDailyLog}
        />;
      case 'report':
        return <ReportPanel
            logs={logs}
            preferences={preferences}
            report={healthReport}
            isLoading={isReportLoading}
            onGenerateReport={handleGenerateReport}
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
            healthReport={healthReport}
            onRefreshForecast={fetchForecast}
            coachingNote={coachingNote?.note}
            isLoadingCoachingNote={isLoadingCoachingNote}
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
      
      {isModalOpen && <LogModal 
          logs={logs} 
          date={modalDate} 
          onClose={() => setIsModalOpen(false)} 
          onAddLog={addLog} 
          preferences={preferences} 
          foodHistory={foodHistory}
          setFoodHistory={setFoodHistory} 
          favoriteMeals={favoriteMeals}
          myMedications={myMedications}
          setMyMedications={setMyMedications}
          onToggleFavorite={handleToggleFavorite}
      />}
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} preferences={preferences} setPreferences={setPreferences} />
      
      <div>
        <FloatingActionButton onClick={() => setIsQuickLogOpen(true)} />
        <QuickLogDrawer 
            logs={logs} 
            isOpen={isQuickLogOpen} 
            onClose={() => setIsQuickLogOpen(false)} 
            onAddLog={addLog} 
            preferences={preferences} 
            foodHistory={foodHistory}
            favoriteMeals={favoriteMeals}
            myMedications={myMedications}
        />
        <BottomNavBar activeView={activeView} setActiveView={setActiveView} />
      </div>

    </div>
  );
};


const App: React.FC = () => {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  )
}

export default App;
