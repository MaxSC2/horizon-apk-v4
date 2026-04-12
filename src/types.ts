// src/types.ts

export interface AIProvider {
  id: string;
  name: string;
  short: string;
  color: string;
  needsKey: boolean;
  free: boolean;
  badge?: string;
  defaultModel: string;
  models: string[];
  desc: string;
  hint?: string;
  keyPrefix?: string;
}

export interface Theme {
  id: string;
  name: string;
  icon: string;
  dark: boolean;
  bg: string;
  surf: string;
  card: string;
  bord: string;
  txt: string;
  muted: string;
  lo: string;
  primary: string;
  success: string;
  warn: string;
  danger: string;
}

export interface Exercise {
  id: string;
  name: string;
  type: 'reps' | 'seconds';
  sets: number;
  reps: string;
  hi: number;
  notes?: string;
}

export interface PlanDay {
  id: number;
  name: string;
  type: 'upper' | 'lower' | 'light' | 'rest' | 'mixed';
  emoji: string;
  day: string;
  exercises: Exercise[];
  warmup: string[];
  stretch: string[];
}

export interface SetLog {
  done: boolean;
  value: string;
}

export interface WorkoutLog {
  dayId: number;
  completed: boolean;
  exercises: Record<string, SetLog[]>;
  difficulty: number;
  painNotes: string;
  workoutNotes?: string;
  startTime: string;
  endTime?: string;
}

export interface Task {
  id: string;
  title: string;
  category: string;
  recurring: boolean;
  completedDates: string[];
  createdAt: string;
  dueDate?: string;
}

export interface Goal {
  id: string;
  title: string;
  desc?: string;
  category: string;
  emoji: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline?: string;
  completed: boolean;
  createdAt: string;
  history: { date: string; value: number }[];
}

export interface JournalEntry {
  id: string;
  date: string;
  text: string;
  mood: number;
  energy?: number;
  sleep?: number;
  waterGlasses?: number;
  waterDone?: boolean;
  createdAt: string;
}

export interface BodyMeasurement {
  id: string;
  date: string;
  weight?: string;
  height?: string;
  chest?: string;
  waist?: string;
  arms?: string;
  hips?: string;
  createdAt: string;
}

export interface WeeklyReflection {
  id: string;
  date: string;
  went: string;
  didnt: string;
  focus: string;
  createdAt: string;
}

export interface PainEntry {
  id: string;
  date: string;
  zone: string;
  intensity: number;
  isRight: boolean;
  note: string;
  createdAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  ts: number;
  provider?: string;
}

export interface NutritionEntry {
  id: string;
  name: string;
  cal: number;
  p: number;
  c: number;
  f: number;
  time: string;
}

export interface AIConfig {
  provider: string;
  apiKey: string;
  model: string;
  endpoint: string;
  persona?: string;
  systemExtra?: string;
  customModel?: string;
}

export interface Alarm {
  id: string;
  hour: number;
  minute: number;
  label: string;
  days: number[];
  enabled: boolean;
  vibrate: boolean;
  smartWake: boolean;
  category: 'wake' | 'workout' | 'meal' | 'meds' | 'custom';
  soundId: 'default' | 'twilight' | 'chime';
}

export type CalEventCategory = 'workout' | 'goal' | 'note' | 'health' | 'study' | 'social' | 'other';

export interface CalEvent {
  id: string;
  date: string;
  title: string;
  category: CalEventCategory;
  time?: string;
  reminder: string;
  completed: boolean;
}

export interface AppState {
  history: Record<string, WorkoutLog>;
  tasks: Task[];
  goals: Goal[];
  journal: JournalEntry[];
  bodyLog: BodyMeasurement[];
  reflections: WeeklyReflection[];
  painLog: PainEntry[];
  achievements: string[];
  aiHistory: ChatMessage[];
  focus: { text: string; date: string };
  customPlan: PlanDay[] | null;
  onboarded: boolean;
  user: {
    maxPushups: number;
    note: string;
    reminderTime?: string;
    reminderEnabled?: boolean;
  };
  themeId: string;
  uiStyleId: string;
  alarms: Alarm[];
  calEvents: CalEvent[];
  aiConfig: AIConfig;
  streak?: number;
}

export interface WorkoutSession {
  dayIdx: number;
  phase: 'warmup' | 'exercises' | 'finish';
  warmupDone: Set<number>;
  exerciseLogs: Record<string, SetLog[]>;
  showRest: boolean;
  difficulty: number;
  painNotes: string;
  workoutNotes: string;
  startTime: string;
}
