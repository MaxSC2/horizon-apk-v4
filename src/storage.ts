// src/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from './types';

const KEY = 'horizon_v4';
// Bumped whenever a migration is needed. Stored alongside the state so we can
// detect upgrades and run cleanup logic (e.g. purge stale alarms on v4.0 → v4.1).
const VERSION_KEY = 'horizon_version';
export const APP_VERSION = '4.4.0';

export const DEFAULTS: AppState = {
  history: {},
  tasks: [],
  goals: [],
  journal: [],
  bodyLog: [],
  reflections: [],
  painLog: [],
  achievements: [],
  aiHistory: [],
  focus: { text: '', date: '' },
  customPlan: null,
  onboarded: false,
  user: { maxPushups: 15, note: '' },
  themeId: 'cosmos',
  uiStyleId: 'default',
  uiMode: 'focus',
  alarms: [],
  calEvents: [],
  aiConfig: {
    provider: 'claude',
    apiKey: '',
    model: '',
    endpoint: '',
    persona: '',
    systemExtra: '',
  },
  streak: 0,
};

export async function loadState(): Promise<AppState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULTS, ...parsed };
    }
  } catch (e) {
    console.error('loadState error', e);
  }
  return { ...DEFAULTS };
}

// Returns true if this is the first launch on this app version — used to
// trigger cleanup of stale alarms from previous versions.
export async function checkAndMarkVersionUpgrade(): Promise<boolean> {
  try {
    const prev = await AsyncStorage.getItem(VERSION_KEY);
    const upgraded = prev !== null && prev !== APP_VERSION;
    await AsyncStorage.setItem(VERSION_KEY, APP_VERSION);
    return upgraded;
  } catch (e) {
    console.error('checkAndMarkVersionUpgrade error', e);
    return false;
  }
}

export async function saveState(state: AppState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.error('saveState error', e);
  }
}

export async function clearState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (e) {
    console.error('clearState error', e);
  }
}

// Photos stored separately to keep main state lean
const PHOTOS_KEY = 'hz_photos';
export async function loadPhotos(): Promise<any[]> {
  try {
    const raw = await AsyncStorage.getItem(PHOTOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
export async function savePhotos(photos: any[]): Promise<void> {
  try { await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(photos.slice(0, 20))); } catch {}
}

// Nutrition stored separately
const NUTRITION_KEY = 'hz_nutrition';
export async function loadNutrition(): Promise<Record<string, any>> {
  try {
    const raw = await AsyncStorage.getItem(NUTRITION_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
export async function saveNutrition(data: Record<string, any>): Promise<void> {
  try { await AsyncStorage.setItem(NUTRITION_KEY, JSON.stringify(data)); } catch {}
}
