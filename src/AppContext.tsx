// src/AppContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState, WorkoutSession } from './types';
import { loadState, saveState, DEFAULTS } from './storage';
import { getTheme } from './theme';
import { Theme } from './types';
import { calcStreak, checkAchievements, fmt, weekDates } from './helpers';
import { PLAN } from './data';

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
}

const AppContext = createContext<AppContextValue>({} as AppContextValue);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState_] = useState<AppState>(DEFAULTS);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadState().then(s => { setState_(s); setLoading(false); });
  }, []);

  const setState = useCallback((patch: Partial<AppState> | ((s: AppState) => AppState)) => {
    setState_(prev => {
      const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch };
      saveState(next);
      return next;
    });
  }, []);

  const T = getTheme(state.themeId || 'cosmos');

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

  return (
    <AppContext.Provider value={{ state, setState, T, session, setSession, startWorkout, finishWorkout, cancelWorkout, editHistory, update1RM, loading, navigateTo }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
