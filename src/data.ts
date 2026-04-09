// src/data.ts
import { PlanDay } from './types';

export const PLAN: PlanDay[] = [
  {
    id: 1, name: 'Верх + кор', type: 'upper', emoji: '💪', day: 'ПН',
    warmup: ['Вращение плеч 30 сек', 'Прыжки на месте 30 сек', 'Вращение запястий 20 сек'],
    stretch: ['Растяжка груди у стены 30 сек', 'Кобра 30 сек'],
    exercises: [
      { id: 'pushups', name: 'Отжимания', type: 'reps', sets: 4, reps: '15-20', hi: 20, notes: 'Темп 2-1-1' },
      { id: 'slow_pushups', name: 'Медленные отжимания', type: 'reps', sets: 3, reps: '5-8', hi: 8, notes: '5 сек вниз' },
      { id: 'plank', name: 'Планка', type: 'seconds', sets: 3, reps: '30-60', hi: 60 },
      { id: 'door_row', name: 'Тяга к двери', type: 'reps', sets: 3, reps: '10-15', hi: 15 },
      { id: 'hollow', name: 'Hollow Body', type: 'seconds', sets: 3, reps: '20-40', hi: 40 },
    ],
  },
  {
    id: 2, name: 'Ноги', type: 'lower', emoji: '🦵', day: 'ВТ',
    warmup: ['Приседания без веса 10 раз', 'Вращение бёдер 30 сек', 'Выпады на месте 10 раз'],
    stretch: ['Растяжка квадрицепса 30 сек', 'Растяжка задней поверхности бедра 30 сек'],
    exercises: [
      { id: 'squats', name: 'Приседания', type: 'reps', sets: 4, reps: '15-20', hi: 20 },
      { id: 'lunges', name: 'Выпады', type: 'reps', sets: 3, reps: '10-12', hi: 12, notes: 'Каждая нога' },
      { id: 'glute_bridge', name: 'Ягодичный мост', type: 'reps', sets: 3, reps: '15-20', hi: 20 },
      { id: 'calf_raise', name: 'Подъём на носки', type: 'reps', sets: 3, reps: '20-25', hi: 25 },
      { id: 'side_plank', name: 'Боковая планка', type: 'seconds', sets: 2, reps: '20-30', hi: 30, notes: 'Каждая сторона' },
    ],
  },
  {
    id: 3, name: 'Лёгкий', type: 'light', emoji: '🌿', day: 'СР',
    warmup: ['Ходьба на месте 1 мин', 'Вращение суставов'],
    stretch: ['Полная растяжка 5 мин'],
    exercises: [
      { id: 'min_pushups', name: 'Отжимания', type: 'reps', sets: 2, reps: '8-10', hi: 10, notes: '50% от максимума' },
      { id: 'min_squats', name: 'Приседания', type: 'reps', sets: 2, reps: '10-12', hi: 12 },
      { id: 'min_plank', name: 'Планка', type: 'seconds', sets: 2, reps: '20-30', hi: 30 },
    ],
  },
  {
    id: 4, name: 'Верх (сила)', type: 'upper', emoji: '🏋️', day: 'ЧТ',
    warmup: ['Вращение плеч 30 сек', 'Прыжки 30 сек'],
    stretch: ['Растяжка грудных 30 сек', 'Кобра 30 сек'],
    exercises: [
      { id: 'pause_pushups', name: 'Отжимания с паузой', type: 'reps', sets: 4, reps: '6-10', hi: 10, notes: '2 сек пауза внизу' },
      { id: 'narrow_pushups', name: 'Узкие отжимания', type: 'reps', sets: 3, reps: '8-12', hi: 12 },
      { id: 'pike', name: 'Пайк пуш-ап', type: 'reps', sets: 3, reps: '8-12', hi: 12 },
      { id: 'iso_row', name: 'Изометрическая тяга', type: 'seconds', sets: 3, reps: '15-20', hi: 20 },
      { id: 'hollow', name: 'Hollow Body', type: 'seconds', sets: 3, reps: '20-40', hi: 40 },
    ],
  },
  {
    id: 5, name: 'Ноги (акцент)', type: 'lower', emoji: '🦿', day: 'ПТ',
    warmup: ['Приседания 10 раз', 'Выпады 10 раз'],
    stretch: ['Растяжка бёдер 1 мин'],
    exercises: [
      { id: 'bulgarian', name: 'Болгарские выпады', type: 'reps', sets: 3, reps: '8-10', hi: 10, notes: 'Каждая нога' },
      { id: 'single_glute', name: 'Мост на одной ноге', type: 'reps', sets: 3, reps: '10-12', hi: 12, notes: 'Каждая нога' },
      { id: 'squats', name: 'Глубокие приседания', type: 'reps', sets: 3, reps: '15-18', hi: 18 },
      { id: 'wall_sit', name: 'Стул у стены', type: 'seconds', sets: 3, reps: '30-45', hi: 45 },
    ],
  },
  {
    id: 6, name: 'Смешанный', type: 'mixed', emoji: '⚡', day: 'СБ',
    warmup: ['Разминка всего тела 2 мин'],
    stretch: ['Полная растяжка 5 мин'],
    exercises: [
      { id: 'pushups', name: 'Отжимания', type: 'reps', sets: 3, reps: '12-15', hi: 15 },
      { id: 'squats', name: 'Приседания', type: 'reps', sets: 3, reps: '15-18', hi: 18 },
      { id: 'plank', name: 'Планка', type: 'seconds', sets: 2, reps: '30-45', hi: 45 },
      { id: 'glute_bridge', name: 'Ягодичный мост', type: 'reps', sets: 2, reps: '15-20', hi: 20 },
    ],
  },
  {
    id: 7, name: 'Отдых', type: 'rest', emoji: '😴', day: 'ВС',
    warmup: [], stretch: [], exercises: [],
  },
];

export const ACHIEVEMENT_DEFS = [
  { id: 'first_workout', emoji: '🏃', title: 'Первый шаг', desc: 'Выполнена первая тренировка' },
  { id: 'workouts_10', emoji: '🔟', title: 'Десятка', desc: '10 тренировок' },
  { id: 'workouts_50', emoji: '🏆', title: 'Полтинник', desc: '50 тренировок' },
  { id: 'streak_7', emoji: '🔥', title: 'Неделя огня', desc: '7 дней подряд' },
  { id: 'streak_30', emoji: '💎', title: 'Месяц силы', desc: '30 дней подряд' },
  { id: 'streak_100', emoji: '🌟', title: 'Легенда', desc: '100 дней подряд' },
  { id: 'first_pr', emoji: '📈', title: 'Первый рекорд', desc: 'Новый личный рекорд' },
  { id: 'pushups_30', emoji: '💪', title: '30 отжиманий', desc: 'Рекорд 30+ отжиманий' },
  { id: 'first_journal', emoji: '📓', title: 'Первая запись', desc: 'Дневник начат' },
  { id: 'journal_7', emoji: '📖', title: 'Неделя дневника', desc: '7 записей в дневнике' },
  { id: 'first_goal', emoji: '🎯', title: 'Цель поставлена', desc: 'Первая цель добавлена' },
  { id: 'goal_done', emoji: '✅', title: 'Цель достигнута', desc: 'Первая цель выполнена' },
  { id: 'ai_coach', emoji: '🤖', title: 'AI Коуч', desc: 'Первый разговор с НЕЙРО' },
  { id: 'water_7', emoji: '💧', title: 'Привычка воды', desc: '7 дней нормы воды' },
  { id: 'reflection_done', emoji: '🧘', title: 'Рефлексия', desc: 'Первая еженедельная рефлексия' },
];

export const MOODS = [
  { v: 1, e: '😢', l: 'Тяжело' },
  { v: 2, e: '😕', l: 'Плохо' },
  { v: 3, e: '😐', l: 'Нейтр.' },
  { v: 4, e: '🙂', l: 'Хорошо' },
  { v: 5, e: '😊', l: 'Отлично' },
];

export const ENERGY = [
  { v: 1, e: '🪫', l: 'Разряжен' },
  { v: 2, e: '😴', l: 'Слабо' },
  { v: 3, e: '⚡', l: 'Норм' },
  { v: 4, e: '🔋', l: 'Энергично' },
  { v: 5, e: '🚀', l: 'Мощь' },
];

export const PAIN_ZONES = [
  { id: 'shoulder', name: 'Плечо', emoji: '💪', color: '#FF6B6B' },
  { id: 'elbow', name: 'Локоть', emoji: '🦾', color: '#FF9500' },
  { id: 'wrist', name: 'Запястье', emoji: '✋', color: '#FFD600' },
  { id: 'knee', name: 'Колено', emoji: '🦵', color: '#FF6B6B' },
  { id: 'lower_back', name: 'Поясница', emoji: '🔙', color: '#FF4455' },
  { id: 'neck', name: 'Шея', emoji: '🧘', color: '#A78BFA' },
  { id: 'hip', name: 'Бедро', emoji: '🍑', color: '#FF9500' },
  { id: 'other', name: 'Другое', emoji: '⚡', color: '#8B5CF6' },
];

export const FOOD_PRESETS = [
  { name: 'Куриная грудь 100г', cal: 165, p: 31, c: 0, f: 3.6 },
  { name: 'Овсянка 100г', cal: 389, p: 17, c: 66, f: 7 },
  { name: 'Яйцо 1шт', cal: 78, p: 6, c: 0.6, f: 5 },
  { name: 'Творог 200г', cal: 180, p: 34, c: 6, f: 1 },
  { name: 'Рис варёный 150г', cal: 195, p: 4, c: 45, f: 0.5 },
  { name: 'Банан 1шт', cal: 105, p: 1.3, c: 27, f: 0.3 },
  { name: 'Гречка 150г', cal: 196, p: 7, c: 40, f: 2 },
  { name: 'Протеин 1 скуп', cal: 120, p: 24, c: 3, f: 1 },
  { name: 'Молоко 200мл', cal: 102, p: 5.4, c: 9.4, f: 4.8 },
  { name: 'Хлеб 1 ломтик', cal: 65, p: 2.5, c: 12, f: 0.6 },
];

export const AI_PROVIDERS = [
  { id: 'claude', name: 'Claude', short: 'Claude', color: '#CC785C', needsKey: false, free: true, badge: 'Встроен', defaultModel: 'claude-sonnet-4-20250514', models: ['claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001'], desc: 'Встроен, ключ не нужен', hint: '' },
  { id: 'openai', name: 'OpenAI', short: 'GPT', color: '#10A37F', needsKey: true, free: false, defaultModel: 'gpt-4o', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1-mini'], desc: 'GPT-4o и o3 — мощные модели', hint: 'platform.openai.com → API keys', keyPrefix: 'sk-' },
  { id: 'gemini', name: 'Google Gemini', short: 'Gemini', color: '#4285F4', needsKey: true, free: true, badge: 'Бесплатный tier', defaultModel: 'gemini-2.0-flash', models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'], desc: 'Бесплатный tier, быстрый', hint: 'aistudio.google.com → Get API key', keyPrefix: 'AIza' },
  { id: 'groq', name: 'Groq', short: 'Groq', color: '#F55036', needsKey: true, free: true, badge: 'Бесплатный tier', defaultModel: 'llama-3.3-70b-versatile', models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'], desc: 'Llama 3.3 70B — очень быстро', hint: 'console.groq.com → API Keys', keyPrefix: 'gsk_' },
  { id: 'custom', name: 'Свой API', short: 'Custom', color: '#8B5CF6', needsKey: true, free: false, defaultModel: '', models: [], desc: 'Любой OpenAI-совместимый', hint: 'Authorization: Bearer …' },
];

export const QUOTES = [
  { text: 'Не жди идеального момента. Возьми момент и сделай его идеальным.', author: 'Зиг Зиглар' },
  { text: 'Каждая тренировка либо ослабляет тебя, либо делает сильнее. Выбирай.', author: 'Неизвестный' },
  { text: 'Дисциплина — это мост между целями и достижениями.', author: 'Джим Рон' },
  { text: 'Твоё тело слышит всё, что говорит твой разум.', author: 'Наоми Джуд' },
  { text: 'Сила не приходит от физических возможностей. Она приходит от несгибаемой воли.', author: 'Махатма Ганди' },
  { text: 'Маленький прогресс каждый день складывается в большие результаты.', author: 'Сатья Надела' },
];

export const QUICK_PROMPTS = [
  { icon: '📊', text: 'Проанализируй мои тренировки' },
  { icon: '⚡', text: 'Как мне прогрессировать?' },
  { icon: '❤️', text: 'Советы по восстановлению' },
  { icon: '📅', text: 'Составь план на неделю' },
  { icon: '💪', text: 'Объясни технику отжиманий' },
  { icon: '🧠', text: 'Советы по продуктивности' },
  { icon: '🎯', text: 'Помоги с моими целями' },
  { icon: '⚖️', text: 'Питание и вес' },
];
