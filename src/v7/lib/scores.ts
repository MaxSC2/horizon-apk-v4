// src/v7/lib/scores.ts — HORIZON V7
//
// Life OS Scores. Не просто цифры — calculated из реальных данных пользователя.
//
// Life Score = взвешенное среднее из 4 под-скоров
// Focus Score = задачи + настроение
// Recovery Score = сон + дни отдыха
// Balance Score = разнообразие активностей
import { AppState } from '../../types';
import { TODAY, weekDates, fmt } from '../../helpers';
import { PLAN } from '../../data';

export interface Scores {
  life: number;
  focus: number;
  recovery: number;
  balance: number;
  // Под-метрики для деталей
  sleep: number;
  hydration: number;
  activity: number;
  mood: number;
  goals: number;
}

export function calculateScores(state: AppState): Scores {
  // ── Sleep score (0-100) ──
  const todayJournal = (state.journal || []).find(j => j.date === TODAY);
  const recentSleep = (state.journal || []).filter(j => (j.sleep || 0) > 0).slice(-7);
  const avgSleep = recentSleep.length
    ? recentSleep.reduce((s, j) => s + (j.sleep || 0), 0) / recentSleep.length
    : 0;
  // 7-9h = 100%, <6h или >10h снижается
  const sleepScore = todayJournal?.sleep
    ? Math.max(0, Math.min(100, 100 - Math.abs(todayJournal.sleep - 8) * 15))
    : avgSleep
    ? Math.max(0, Math.min(100, 100 - Math.abs(avgSleep - 8) * 15))
    : 0;

  // ── Hydration score (0-100) ──
  const waterGlasses = todayJournal?.waterGlasses || 0;
  const hydrationScore = Math.min(100, (waterGlasses / 8) * 100);

  // ── Activity score (0-100) ──
  const todayLog = state.history?.[TODAY];
  const dates = weekDates();
  const weekWorkouts = dates.filter((d, i) => {
    if (PLAN[i]?.type === 'rest') return false;
    return state.history?.[fmt(d)]?.completed;
  }).length;
  const weekTotal = PLAN.filter(p => p.type !== 'rest').length;
  const activityScore = todayLog?.completed
    ? 100
    : weekTotal > 0
    ? Math.round((weekWorkouts / weekTotal) * 70)
    : 0;

  // ── Mood score (0-100) ──
  const mood = todayJournal?.mood;
  const moodScore = mood ? (mood / 5) * 100 : 0;

  // ── Goals score (0-100) ──
  const todayTasks = (state.tasks || []).filter(t => t.recurring || t.dueDate === TODAY);
  const todayTasksDone = todayTasks.filter(t => t.completedDates?.includes(TODAY)).length;
  const goalsScore = todayTasks.length > 0
    ? Math.round((todayTasksDone / todayTasks.length) * 100)
    : 50;

  // ── Focus Score = задачи + настроение ──
  const focus = Math.round(goalsScore * 0.6 + moodScore * 0.4);

  // ── Recovery Score = сон + активность (меньше = лучше recovery) ──
  const recovery = Math.round(sleepScore * 0.7 + (100 - Math.min(activityScore, 100)) * 0.3);

  // ── Balance Score = разнообразие ──
  const balance = Math.round(
    (sleepScore > 0 ? 25 : 0) +
    (hydrationScore > 0 ? 25 : 0) +
    (activityScore > 0 ? 25 : 0) +
    (moodScore > 0 ? 25 : 0)
  );

  // ── Life Score = взвешенное ──
  const life = Math.round(
    sleepScore * 0.20 +
    hydrationScore * 0.15 +
    activityScore * 0.20 +
    moodScore * 0.15 +
    goalsScore * 0.30
  );

  return {
    life,
    focus,
    recovery,
    balance,
    sleep: Math.round(sleepScore),
    hydration: Math.round(hydrationScore),
    activity: Math.round(activityScore),
    mood: Math.round(moodScore),
    goals: Math.round(goalsScore),
  };
}

// ── Today's checklist — что уже сделано, что нет ──────────────────────────
export interface ChecklistItem {
  id: string;
  label: string;
  emoji: string;
  done: boolean;
}

export function getTodayChecklist(state: AppState): ChecklistItem[] {
  const todayJournal = (state.journal || []).find(j => j.date === TODAY);
  const todayLog = state.history?.[TODAY];
  const tasks = (state.tasks || []).filter(t => t.recurring || t.dueDate === TODAY);
  const tasksDone = tasks.filter(t => t.completedDates?.includes(TODAY)).length;
  const allTasksDone = tasks.length > 0 && tasksDone === tasks.length;

  return [
    {
      id: 'sleep',
      label: 'Спал',
      emoji: '😴',
      done: !!todayJournal?.sleep && todayJournal.sleep >= 6,
    },
    {
      id: 'water',
      label: 'Выпил воду',
      emoji: '💧',
      done: (todayJournal?.waterGlasses || 0) >= 4,
    },
    {
      id: 'workout',
      label: 'Тренировка',
      emoji: '🏋️',
      done: !!todayLog?.completed,
    },
    {
      id: 'mood',
      label: 'Настроение',
      emoji: '😊',
      done: !!todayJournal?.mood,
    },
    {
      id: 'goals',
      label: 'Главное дело',
      emoji: '🎯',
      done: allTasksDone,
    },
  ];
}

// ── Timeline events — день как лента ───────────────────────────────────────
export interface TimelineEvent {
  id: string;
  time: string;
  emoji: string;
  title: string;
  detail?: string;
}

export function getTodayTimeline(state: AppState): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const todayJournal = (state.journal || []).filter(j => j.date === TODAY);
  const todayLog = state.history?.[TODAY];
  const tasks = (state.tasks || []).filter(t => t.completedDates?.includes(TODAY));

  // Утро — проснулся (по journal sleep)
  const sleepEntry = todayJournal.find(j => j.sleep);
  if (sleepEntry) {
    events.push({
      id: 'wake',
      time: '07:10',
      emoji: '😴',
      title: 'Проснулся',
      detail: `Сон ${sleepEntry.sleep?.toFixed(1)}ч`,
    });
  }

  // Вода
  const waterEntry = todayJournal.find(j => j.waterGlasses);
  if (waterEntry?.waterGlasses) {
    events.push({
      id: 'water',
      time: '08:30',
      emoji: '💧',
      title: 'Выпил воду',
      detail: `${waterEntry.waterGlasses} стаканов`,
    });
  }

  // Задачи
  tasks.forEach((t, i) => {
    events.push({
      id: `task-${t.id}`,
      time: '09:00',
      emoji: '✓',
      title: t.title,
      detail: 'Выполнено',
    });
  });

  // Тренировка
  if (todayLog?.completed) {
    events.push({
      id: 'workout',
      time: '18:00',
      emoji: '🏋️',
      title: 'Тренировка',
      detail: `Сложность ${todayLog.difficulty}/10`,
    });
  }

  // Настроение
  const moodEntry = todayJournal.find(j => j.mood);
  if (moodEntry?.mood) {
    events.push({
      id: 'mood',
      time: '21:00',
      emoji: '😊',
      title: 'Записал настроение',
      detail: `${moodEntry.mood}/5`,
    });
  }

  // Сон — подготовка
  events.push({
    id: 'bedtime',
    time: '22:30',
    emoji: '🌙',
    title: 'Подготовка ко сну',
    detail: 'Завершение дня',
  });

  return events;
}

// ── AI Insights — контекстные подсказки ────────────────────────────────────
export interface AIInsight {
  id: string;
  emoji: string;
  text: string;
  context: string;  // где показывается
  priority: 'low' | 'medium' | 'high';
}

export function getAIInsights(state: AppState): AIInsight[] {
  const insights: AIInsight[] = [];
  const scores = calculateScores(state);
  const todayJournal = (state.journal || []).find(j => j.date === TODAY);
  const recentSleep = (state.journal || []).filter(j => (j.sleep || 0) > 0).slice(-3);

  // Сон
  if (scores.sleep < 50) {
    insights.push({
      id: 'sleep-low',
      emoji: '😴',
      text: 'Сон снижен. Попробуй лечь до 23:00 — завтра будет больше фокуса.',
      context: 'sleep',
      priority: 'high',
    });
  }

  // Вода
  if (scores.hydration < 50) {
    const remaining = 8 - (todayJournal?.waterGlasses || 0);
    insights.push({
      id: 'water-low',
      emoji: '💧',
      text: `Осталось выпить ${remaining * 250}мл воды. Это ${remaining} стаканов.`,
      context: 'water',
      priority: 'medium',
    });
  }

  // Тренировка
  if (scores.activity < 50) {
    const todayI = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    const todayPlan = PLAN[todayI];
    if (todayPlan && todayPlan.type !== 'rest') {
      insights.push({
        id: 'workout-pending',
        emoji: '💪',
        text: `Сегодня «${todayPlan.name}». ${todayPlan.exercises.length} упражнений, займёт ~25 мин.`,
        context: 'workout',
        priority: 'high',
      });
    }
  }

  // Настроение
  if (!todayJournal?.mood) {
    insights.push({
      id: 'mood-log',
      emoji: '😊',
      text: 'Запиши настроение — это поможет AI лучше понять твой день.',
      context: 'mood',
      priority: 'low',
    });
  }

  // Recovery
  if (scores.recovery > 80) {
    insights.push({
      id: 'recovery-good',
      emoji: '🔄',
      text: 'Восстановление отличное. Можно увеличить нагрузку завтра.',
      context: 'recovery',
      priority: 'low',
    });
  }

  // Focus
  if (scores.focus > 70) {
    insights.push({
      id: 'focus-good',
      emoji: '🎯',
      text: 'Фокус на максимуме. Самое время взяться за главную цель.',
      context: 'focus',
      priority: 'medium',
    });
  }

  return insights.slice(0, 3);
}
