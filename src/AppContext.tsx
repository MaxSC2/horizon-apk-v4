// src/AppContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState, WorkoutSession } from './types';
import { loadState, saveState, DEFAULTS, checkAndMarkVersionUpgrade } from './storage';
import { getTheme } from './theme';
import { Theme } from './types';
import { calcStreak, checkAchievements, fmt, weekDates } from './helpers';
import { PLAN } from './data';
import {
  initAlarmChannel,
  syncAlarmsWithSystem,
  purgeAllAlarms,
  ensureAlarmHandlersRegistered,
} from './alarm';

let globalNavigate: ((tab: string) => void) | null = null;
export const setGlobalNavigate = (fn: (tab: string) => void) => { globalNavigate = fn; };

interface AppContextValue {
  state: AppState;
  setState: (patch: Partial<AppState> | ((s: AppState) => AppState)) => void;
  T: Theme;
  session: WorkoutSession | null;
  setSession: (s: WorkoutSession | null) => void;
  startWorkout: (dayIdx: number) => void;
  finishWorkout: () => void;
  cancelWorkout: () => void;
  editHistory: (date: string, log: any) => void;
  update1RM: (val: number) => void;
  loading: boolean;
  navigateTo: (tab: string) => void;
  // v4.1 — alarm helpers exposed to UI
  resyncAlarms: () => Promise<void>;
  purgeAlarms: () => Promise<void>;
  exportData: () => Promise<string>;
}

const AppContext = createContext<AppContextValue>({} as AppContextValue);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState_] = useState<AppState>(DEFAULTS);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = await loadState();
      if (cancelled) return;
      setState_(s);

      // Alarm self-healing on launch:
      //   1. Always init the channel so notifications can fire.
      //   2. Register background + foreground handlers ONCE.
      //   3. On version upgrade, PURGE every notification we own (defensive
      //      cleanup for stale alarms from v4.0 that survived uninstall via
      //      Android Auto Backup or OEM backup mechanisms).
      //   4. Always run syncAlarmsWithSystem() — cancels orphans and reschedules
      //      every enabled alarm so the system schedule matches storage.
      try {
        await initAlarmChannel();
        ensureAlarmHandlersRegistered();
        const upgraded = await checkAndMarkVersionUpgrade();
        if (upgraded) {
          await purgeAllAlarms();
        }
        await syncAlarmsWithSystem(s.alarms || []);
      } catch (e) {
        console.error('alarm init error:', e);
      }

      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const setState = useCallback((patch: Partial<AppState> | ((s: AppState) => AppState)) => {
    setState_(prev => {
      const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch };
      saveState(next);
      return next;
    });
  }, []);

  const T = getTheme(state.themeId || 'cosmos');

  // ── Workout session helpers ──
  const startWorkout = useCallback((dayIdx: number) => {
    const plan = PLAN[dayIdx];
    const logs: Record<string, any[]> = {};
    plan.exercises.forEach(ex => {
      logs[ex.id] = Array.from({ length: ex.sets }, () => ({ done: false, value: '' }));
    });
    setSession({
      dayIdx,
      phase: plan.warmup.length > 0 ? 'warmup' : 'exercises',
      warmupDone: new Set(),
      exerciseLogs: logs,
      showRest: false,
      difficulty: 5,
      painNotes: '',
      workoutNotes: '',
      startTime: new Date().toISOString(),
    });
  }, []);

  const finishWorkout = useCallback(() => {
    if (!session) return;
    const dates = weekDates();
    const date = fmt(dates[session.dayIdx]);
    setState(s => {
      const newHist = {
        ...s.history,
        [date]: {
          dayId: session.dayIdx + 1,
          completed: true,
          exercises: session.exerciseLogs,
          difficulty: session.difficulty,
          painNotes: session.painNotes,
          workoutNotes: session.workoutNotes,
          startTime: session.startTime,
          endTime: new Date().toISOString(),
        },
      };
      const newAch = checkAchievements({ ...s, history: newHist });
      return { ...s, history: newHist, streak: calcStreak(newHist), achievements: newAch };
    });
    setSession(null);
  }, [session, setState]);

  const editHistory = useCallback((date: string, log: any) => {
    setState(s => ({ ...s, history: { ...s.history, [date]: log } }));
  }, [setState]);

  const update1RM = useCallback((val: number) => {
    setState(s => ({ ...s, user: { ...s.user, maxPushups: val } }));
  }, [setState]);

  const cancelWorkout = useCallback(() => {
    setSession(null);
  }, [setSession]);

  const navigateTo = useCallback((tab: string) => {
    if (globalNavigate) globalNavigate(tab);
  }, []);

  // ── v4.1 — alarm sync helpers exposed to UI ──
  const resyncAlarms = useCallback(async () => {
    await syncAlarmsWithSystem(stateRef.current.alarms || []);
  }, []);

  const purgeAlarms = useCallback(async () => {
    await purgeAllAlarms();
  }, []);

  // ── v4.1 — JSON export for backup / commit ──
  const exportData = useCallback(async () => {
    const snapshot = {
      app: 'ГОРИЗОНТ Life Tracker',
      version: '4.1.0',
      exportedAt: new Date().toISOString(),
      state: stateRef.current,
    };
    return JSON.stringify(snapshot, null, 2);
  }, []);

  return (
    <AppContext.Provider value={{
      state, setState, T, session, setSession,
      startWorkout, finishWorkout, cancelWorkout,
      editHistory, update1RM,
      loading, navigateTo,
      resyncAlarms, purgeAlarms, exportData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
