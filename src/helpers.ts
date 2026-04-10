// src/helpers.ts
import { AppState, WorkoutLog, JournalEntry, Task, Goal } from './types';
import { PLAN } from './data';

export const fmt = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
export const uid = (): string => Math.random().toString(36).slice(2, 9);

export function getMonday(): Date {
  const d = new Date();
  const day = d.getDay();
  const m = new Date(d);
  m.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  m.setHours(0, 0, 0, 0);
  return m;
}

export function weekDates(): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(getMonday());
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function todayIdx(): number {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

export const TODAY = fmt(new Date());

export function calcStreak(hist: Record<string, WorkoutLog>): number {
  let s = 0;
  const t = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(t);
    d.setDate(t.getDate() - i);
    const pi = d.getDay() === 0 ? 6 : d.getDay() - 1;
    if (hist[fmt(d)]?.completed) s++;
    else if (PLAN[pi]?.type === 'rest') continue;
    else if (i > 0) break;
  }
  return s;
}

export function getPRs(history: Record<string, WorkoutLog>): Record<string, number> {
  const prs: Record<string, number> = {};
  Object.values(history).forEach(log => {
    if (!log.exercises) return;
    Object.entries(log.exercises).forEach(([id, sets]) => {
      const m = Math.max(0, ...sets.map(s => parseInt(s.value) || 0));
      if (!prs[id] || m > prs[id]) prs[id] = m;
    });
  });
  return prs;
}

export function calcLifeScore(
  history: Record<string, WorkoutLog>,
  tasks: Task[],
  journal: JournalEntry[]
): { workout: number; tasks: number | null; journal: number; total: number } {
  const dates = weekDates();
  const wd = dates.filter((_, i) => {
    const p = PLAN[i];
    if (p.type === 'rest') return false;
    return history[fmt(dates[i])]?.completed;
  }).length;
  const wt = PLAN.filter(p => p.type !== 'rest').length;
  const rec = tasks.filter(t => t.recurring);
  let ts = 0;
  if (rec.length > 0) {
    let done = 0;
    dates.forEach(d => {
      rec.forEach(t => { if (t.completedDates?.includes(fmt(d))) done++; });
    });
    ts = Math.round((done / (rec.length * 7)) * 100);
  }
  const ws = wt > 0 ? Math.round((wd / wt) * 100) : 0;
  const js = dates.some(d => journal.some(j => j.date === fmt(d))) ? 100 : 0;
  const arr = [ws, rec.length > 0 ? ts : null, js].filter(x => x !== null) as number[];
  return {
    workout: ws,
    tasks: rec.length > 0 ? ts : null,
    journal: js,
    total: arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0,
  };
}

export function weeklyTonnage(history: Record<string, WorkoutLog>) {
  return Array.from({ length: 8 }, (_, w) => {
    const m = getMonday();
    m.setDate(m.getDate() - (7 - w) * 7);
    let tonnage = 0;
    for (let d = 0; d < 7; d++) {
      const x = new Date(m);
      x.setDate(m.getDate() + d);
      const log = history[fmt(x)];
      if (!log?.exercises) continue;
      Object.entries(log.exercises).forEach(([exId, sets]) => {
        const ex = PLAN.flatMap(p => p.exercises || []).find(e => e.id === exId);
        if (!ex || ex.type === 'seconds') return;
        sets.forEach(s => { tonnage += parseInt(s.value) || 0; });
      });
    }
    return { week: w === 7 ? 'Эта' : `-${7 - w}н`, tonnage };
  });
}

export function moodWorkoutCorrelation(
  history: Record<string, WorkoutLog>,
  journal: JournalEntry[]
) {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 29 + i);
    const dd = fmt(d);
    const jEntry = journal.filter(j => j.date === dd).slice(-1)[0];
    const didWorkout = history[dd]?.completed ? 1 : 0;
    const planI = d.getDay() === 0 ? 6 : d.getDay() - 1;
    const isRest = PLAN[planI]?.type === 'rest';
    return {
      date: `${d.getDate()}.${d.getMonth() + 1}`,
      mood: jEntry?.mood || null,
      energy: jEntry?.energy || null,
      workout: isRest ? null : didWorkout,
      isRest,
    };
  }).filter(d => d.mood || d.workout !== null);
}

export function computeAuto1RM(history: Record<string, WorkoutLog>): number | null {
  let best = 0;
  Object.values(history).forEach(log => {
    const sets = log.exercises?.['pushups'] || [];
    sets.forEach(s => { const v = parseInt(s.value) || 0; if (v > best) best = v; });
  });
  if (best < 5) return null;
  return Math.round(best * (1 + best / 30));
}

export function checkProgression(
  history: Record<string, WorkoutLog>,
  exercise: { id: string; name: string; hi: number; type: string }
): { message: string } | null {
  const sessions = Object.entries(history)
    .filter(([, l]) => l.exercises?.[exercise.id]?.some(s => (parseInt(s.value) || 0) > 0))
    .sort(([a], [b]) => a > b ? -1 : 1)
    .slice(0, 3);
  if (sessions.length < 3) return null;
  const allHi = sessions.every(([, l]) =>
    l.exercises[exercise.id].some(s => (parseInt(s.value) || 0) >= exercise.hi)
  );
  if (!allHi) return null;
  return {
    message: exercise.type === 'seconds'
      ? `+5-10 сек к «${exercise.name}»`
      : `+1-2 повтора к «${exercise.name}»`,
  };
}

export function getAllProgressionSuggestions(history: Record<string, WorkoutLog>) {
  const seen = new Set<string>();
  const out: { message: string }[] = [];
  PLAN.forEach(d => (d.exercises || []).forEach(ex => {
    if (seen.has(ex.id)) return;
    seen.add(ex.id);
    const s = checkProgression(history, ex);
    if (s) out.push(s);
  }));
  return out;
}

export function generateInsights(
  history: Record<string, WorkoutLog>,
  journal: JournalEntry[],
  tasks: Task[],
  goals: Goal[]
) {
  const insights: { icon: string; color: string; text: string }[] = [];
  const streak = calcStreak(history);
  const totalW = Object.values(history).filter(l => l.completed).length;

  const recentSleep = journal.filter(j => (j.sleep || 0) > 0).slice(-7);
  if (recentSleep.length >= 3) {
    const avgSleep = recentSleep.reduce((s, j) => s + (j.sleep || 0), 0) / recentSleep.length;
    const lowDays = recentSleep.filter(j => (j.sleep || 0) < 7).length;
    if (lowDays >= 3) insights.push({ icon: '😴', color: '#FF9500', text: `${lowDays} из ${recentSleep.length} дней сон меньше 7ч` });
    else if (avgSleep >= 8) insights.push({ icon: '💤', color: '#00E676', text: `Средний сон ${avgSleep.toFixed(1)}ч — отличное восстановление!` });
  }

  if (streak >= 7) insights.push({ icon: '🔥', color: '#FFD600', text: `${streak} дней подряд — ты в потоке!` });
  else if (streak === 0 && totalW > 3) insights.push({ icon: '⚡', color: '#FF4455', text: 'Серия прервана. Один подход сегодня вернёт ритм' });

  goals.filter(g => !g.completed && g.deadline).forEach(g => {
    const daysLeft = Math.ceil((new Date(g.deadline! + 'T12:00:00').getTime() - Date.now()) / 86400000);
    const pct = Math.round((g.currentValue / Math.max(g.targetValue, 1)) * 100);
    if (daysLeft > 0 && daysLeft <= 7 && pct < 80) {
      insights.push({ icon: '🎯', color: '#FF4455', text: `«${g.title}»: ${daysLeft} дн., ${pct}% — ускоряйся!` });
    }
  });

  const thisWeekDone = weekDates().filter((d, i) => {
    if (PLAN[i].type === 'rest') return false;
    return history[fmt(d)]?.completed;
  }).length;
  const thisWeekTotal = PLAN.filter(p => p.type !== 'rest').length;
  if (thisWeekDone === thisWeekTotal && thisWeekTotal > 0) {
    insights.push({ icon: '⭐', color: '#FFD600', text: 'Идеальная неделя — все тренировки выполнены!' });
  }

  return insights.slice(0, 3);
}

export function getMuscleRecovery(history: Record<string, WorkoutLog>) {
  const muscleMap: Record<string, string[]> = {
    upper: ['pushups', 'slow_pushups', 'door_row', 'pause_pushups', 'narrow_pushups', 'pike'],
    lower: ['squats', 'lunges', 'glute_bridge', 'calf_raise', 'bulgarian', 'single_glute'],
    core: ['plank', 'hollow', 'side_plank'],
  };
  const result: Record<string, number | null> = {};
  const sortedDates = Object.keys(history).filter(d => history[d].completed).sort().reverse();
  ['upper', 'lower', 'core'].forEach(group => {
    const exIds = new Set(muscleMap[group]);
    let daysSince: number | null = null;
    for (let i = 0; i < sortedDates.length; i++) {
      const log = history[sortedDates[i]];
      const hasGroup = Object.keys(log.exercises || {}).some(
        id => exIds.has(id) && log.exercises[id].some(s => (parseInt(s.value) || 0) > 0)
      );
      if (hasGroup) {
        const d = new Date(TODAY + 'T12:00:00').getTime() - new Date(sortedDates[i] + 'T12:00:00').getTime();
        daysSince = Math.round(d / 86400000);
        break;
      }
    }
    result[group] = daysSince;
  });
  return result;
}

export function weeklyWorkoutStats(history: Record<string, WorkoutLog>) {
  return Array.from({ length: 8 }, (_, w) => {
    const m = getMonday();
    m.setDate(m.getDate() - (7 - w) * 7);
    let count = 0;
    for (let d = 0; d < 7; d++) {
      const x = new Date(m); x.setDate(m.getDate() + d);
      if (history[fmt(x)]?.completed) count++;
    }
    return { week: w === 7 ? 'Эта' : `-${7 - w}н`, count, value: count };
  });
}

export function exerciseTrend(history: Record<string, WorkoutLog>, exId: string) {
  return Object.entries(history)
    .filter(([, l]) => l.exercises?.[exId]?.some((s: any) => (parseInt(s.value) || 0) > 0))
    .sort(([a], [b]) => a < b ? -1 : 1)
    .slice(-12)
    .map(([date, l]) => ({
      date: date.slice(5),
      val: Math.max(0, ...((l.exercises?.[exId] || []) as any[]).map((s: any) => parseInt(s.value) || 0)),
    }));
}

export function getHeatMapData(history: Record<string, WorkoutLog>, weeks = 13) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayStr = fmt(today);
  const days: { date: string; completed: boolean; difficulty: number; isRest: boolean; isToday: boolean; weekday: number }[] = [];
  for (let i = (weeks * 7 - 1); i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const ds = fmt(d);
    const log = history[ds];
    const planI = d.getDay() === 0 ? 6 : d.getDay() - 1;
    days.push({
      date: ds, completed: log?.completed || false,
      difficulty: log?.difficulty || 0,
      isRest: PLAN[planI]?.type === 'rest',
      isToday: ds === todayStr,
      weekday: d.getDay(),
    });
  }
  return days;
}

export function getMonthlyStats(history: Record<string, WorkoutLog>, journal: JournalEntry[], month: Date) {
  const start = new Date(month); start.setDate(1); start.setHours(0, 0, 0, 0);
  const end = new Date(start); end.setMonth(end.getMonth() + 1);
  const days: any[] = [];
  for (const d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const ds = fmt(d);
    const jEntry = journal.filter(j => j.date === ds).slice(-1)[0];
    days.push({
      date: ds, workout: history[ds]?.completed || false,
      difficulty: history[ds]?.difficulty || 0,
      mood: jEntry?.mood || null, sleep: jEntry?.sleep || null,
      weekday: new Date(ds + 'T12:00:00').getDay(),
    });
  }
  const workoutDays = days.filter(d => d.workout).length;
  const totalDays = days.filter(d => PLAN[new Date(d.date + 'T12:00:00').getDay() === 0 ? 6 : new Date(d.date + 'T12:00:00').getDay() - 1]?.type !== 'rest').length;
  const moodEntries = days.filter(d => d.mood);
  const sleepEntries = days.filter(d => d.sleep);
  const diffEntries = days.filter(d => d.workout && d.difficulty > 0);
  return {
    workoutDays, totalDays,
    consistency: totalDays > 0 ? Math.round((workoutDays / totalDays) * 100) : 0,
    avgMood: moodEntries.length ? (moodEntries.reduce((s, d) => s + d.mood, 0) / moodEntries.length).toFixed(1) : null,
    avgSleep: sleepEntries.length ? (sleepEntries.reduce((s, d) => s + d.sleep, 0) / sleepEntries.length).toFixed(1) : null,
    avgDiff: diffEntries.length ? (diffEntries.reduce((s, d) => s + d.difficulty, 0) / diffEntries.length).toFixed(1) : '—',
    days,
  };
}

export function goalForecast(goal: Goal): { daysNeeded: number; date: string } | null {
  if (!goal || goal.completed || !goal.history || goal.history.length < 2) return null;
  const sorted = goal.history.slice().sort((a, b) => a.date > b.date ? 1 : -1);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const daysDiff = Math.max(1, Math.round(
    (new Date(last.date + 'T12:00:00').getTime() - new Date(first.date + 'T12:00:00').getTime()) / 86400000
  ));
  const ratePerDay = (last.value - first.value) / daysDiff;
  if (ratePerDay <= 0) return null;
  const remaining = goal.targetValue - goal.currentValue;
  const daysNeeded = Math.ceil(remaining / ratePerDay);
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysNeeded);
  return {
    daysNeeded,
    date: targetDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
  };
}

export function checkAchievements(state: AppState): string[] {
  const earned = new Set(state.achievements || []);
  const totalW = Object.values(state.history).filter(l => l.completed).length;
  const streak = calcStreak(state.history);
  const prs = getPRs(state.history);
  if (totalW >= 1) earned.add('first_workout');
  if (totalW >= 10) earned.add('workouts_10');
  if (totalW >= 50) earned.add('workouts_50');
  if (streak >= 7) earned.add('streak_7');
  if (streak >= 30) earned.add('streak_30');
  if (streak >= 100) earned.add('streak_100');
  if (Object.keys(prs).length > 0) earned.add('first_pr');
  if ((prs['pushups'] || 0) >= 30) earned.add('pushups_30');
  if ((state.journal || []).length >= 1) earned.add('first_journal');
  if ((state.journal || []).length >= 7) earned.add('journal_7');
  if ((state.goals || []).length >= 1) earned.add('first_goal');
  if ((state.goals || []).some(g => g.completed)) earned.add('goal_done');
  if ((state.aiHistory || []).length >= 1) earned.add('ai_coach');
  return [...earned];
}

export function buildAIContext(state: AppState): string {
  const totalW = Object.values(state.history || {}).filter(l => l.completed).length;
  const streak = calcStreak(state.history || {});
  const prs = getPRs(state.history || {});
  const recentWorkouts = Object.entries(state.history || {})
    .sort(([a], [b]) => a > b ? -1 : 1).slice(0, 5)
    .map(([date, l]) => `${date}: ${PLAN.find(p => p.id === l.dayId)?.name || 'Тренировка'}, сложность ${l.difficulty}/10`).join('\n');
  const activeGoals = (state.goals || []).filter(g => !g.completed)
    .map(g => `"${g.title}": ${g.currentValue}/${g.targetValue} ${g.unit}`).join(', ');
  const recentMoods = (state.journal || []).slice(0, 7)
    .map(j => `${j.date}: настроение ${j.mood}/5`).join('\n');

  return `Ты — AI-коуч приложения "Горизонт". Отвечай по-русски, кратко и по делу.

ДАННЫЕ ПОЛЬЗОВАТЕЛЯ:
- Тренировок всего: ${totalW}
- Серия: ${streak} дней
- Макс. отжиманий: ${state.user?.maxPushups || 0}
- PR в отжиманиях: ${prs['pushups'] || 0}

ПОСЛЕДНИЕ ТРЕНИРОВКИ:
${recentWorkouts || 'Нет данных'}

АКТИВНЫЕ ЦЕЛИ: ${activeGoals || 'Нет'}

НАСТРОЕНИЕ (последние дни):
${recentMoods || 'Нет данных'}

${state.aiConfig?.persona ? `ПЕРСОНАЖ: ${state.aiConfig.persona}` : ''}`;
}
