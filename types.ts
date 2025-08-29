

export type LogType = 'symptom' | 'medication' | 'wellness' | 'purine_intake' | 'hydration' | 'alcohol';

// Data structures for each log type
export interface SymptomData {
  location: string;
  painLevel: number; // 0-10
  symptoms: ('swelling' | 'redness' | 'warmth')[];
  notes?: string;
  photo?: string; // base64 encoded image
}

export interface MedicationData {
  name: string;
  dosage?: string;
  unit?: string;
  timeOfDay: 'morning' | 'lunch' | 'dinner' | 'bedtime';
  intakeTime: string; // ISO String
  notes?: string;
  photo?: string; // base64 encoded image
}

export interface MedicationInfo {
  id: string;
  name: string;
  dosage?: string;
  unit?: string;
  photo?: string; // base64 encoded image
}

export interface DietData {
  description: string;
  timeOfDay: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  notes?: string;
  photo?: string; // base64 encoded image
}

export interface HydrationData {
  amount: number; // in mL
  notes?: string;
}

export interface AlcoholData {
  type: string; // 'Beer', 'Soju', 'Wine' etc.
  amount: number; // in mL
  notes?: string;
}

export interface WellnessData {
    weight?: number; // in kg
    sleepHours?: number; // in hours
    stressLevel?: 1 | 2 | 3 | 4 | 5;
    activity?: string; // e.g., "30 min walk"
    notes?: string; // For memo integration
}

// AI Meal Analyzer types
export interface AnalyzedFoodItem {
  foodName: string;
  purineLevel: 'Low' | 'Moderate' | 'High' | 'Very High';
  purineAmount: string;
  explanation: string;
}

export interface MealAnalysis {
  id: string; // for history key
  mealName: string;
  mealDescription: string; // original user query
  totalPurineScore: number; // 0-100
  overallRiskLevel: 'Low' | 'Moderate' | 'High';
  overallSummary: string;
  items: AnalyzedFoodItem[];
  recommendations: string;
  alternatives: string[];
  dailyImpactAnalysis?: string;
}

export interface PurineIntakeData extends MealAnalysis {
    timeOfDay: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

// AI Meal Planner type
export interface PlannedMeal {
  mealName: string;
  description: string;
  estimatedPurineScore: number;
  riskLevel: 'Low' | 'Moderate' | 'High';
  ingredients: string[];
  recipe: string;
}

// AI Meal Suggestion for Search
export interface MealSuggestion {
  mealName: string;
  description: string;
  estimatedPurineScore: number;
  riskLevel: 'Low' | 'Moderate' | 'High';
  keyIngredients: string[];
}


// Discriminated union for LogEntry
export type LogData = 
  | { type: 'symptom'; data: SymptomData }
  | { type: 'medication'; data: MedicationData }
  | { type: 'wellness'; data: WellnessData }
  | { type: 'purine_intake'; data: PurineIntakeData }
  | { type: 'hydration'; data: HydrationData }
  | { type: 'alcohol'; data: AlcoholData };

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
export type ActiveView = 'dashboard' | 'calendar' | 'chat' | 'food' | 'report';

// AI Health Report Types
export interface KeyFinding {
  title: string;
  finding: string;
  evidence: string;
  recommendation: string;
}

export interface ReportHabit {
    title: string;
    description: string;
}

export interface HealthReport {
    overallSummary: string;
    keyFindings: KeyFinding[];
    positiveHabits: ReportHabit[];
    areasForImprovement: ReportHabit[];
}

// AI Coach Note
export interface CoachingNote {
    note: string;
    date: string; // YYYY-MM-DD
}