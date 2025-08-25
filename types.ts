export type LogType = 'symptom' | 'medication' | 'diet' | 'wellness' | 'life_event' | 'purine_intake';

// Data structures for each log type
export interface SymptomData {
  location: string;
  painLevel: number; // 0-10
  symptoms: ('swelling' | 'redness' | 'warmth')[];
  notes?: string;
}

export interface MedicationData {
  name: string;
  timeOfDay: 'morning' | 'lunch' | 'dinner' | 'bedtime';
  intakeTime: string; // ISO String
  notes?: string;
  photo?: string; // base64 encoded image
}

export interface DietData {
  description: string;
  timeOfDay: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  notes?: string;
  photo?: string; // base64 encoded image
}

export interface WellnessData {
    fluidIntake?: number; // in mL
    weight?: number; // in kg
    sleepHours?: number; // in hours
    stressLevel?: 1 | 2 | 3 | 4 | 5;
    activity?: string; // e.g., "30 min walk"
}

export interface LifeEventData {
    event: string;
}

// AI Meal Analyzer types
export interface AnalyzedFoodItem {
  foodName: string;
  purineLevel: '낮음' | '중간' | '높음' | '매우 높음';
  purineAmount: string;
  explanation: string;
}

export interface MealAnalysis {
  id: string; // for history key
  mealDescription: string; // original user query
  totalPurineScore: number; // 0-100
  overallRiskLevel: '낮음' | '주의' | '높음';
  overallSummary: string;
  items: AnalyzedFoodItem[];
  recommendations: string;
  alternatives: string[];
}

export interface PurineIntakeData extends MealAnalysis {
    timeOfDay: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

// Discriminated union for LogEntry
export type LogData = 
  | { type: 'symptom'; data: SymptomData }
  | { type: 'medication'; data: MedicationData }
  | { type: 'diet'; data: DietData }
  | { type: 'wellness'; data: WellnessData }
  | { type: 'life_event'; data: LifeEventData }
  | { type: 'purine_intake'; data: PurineIntakeData };

export type LogEntry = {
  id: string;
  timestamp: string; // ISO string of the date it was logged for
} & LogData;

// Chat types
export interface Part {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string; // base64
  };
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  }
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: Part[];
  timestamp: string;
  groundingChunks?: GroundingChunk[];
}

// User Preferences
export interface Preferences {
  weightUnit: 'kg' | 'lbs';
  fluidUnit: 'ml' | 'oz';
  dailyFluidGoal: number; // in ml
  dailyPurineGoal: number;
}

// Navigation Type
export type ActiveView = 'dashboard' | 'calendar' | 'chat' | 'food';
