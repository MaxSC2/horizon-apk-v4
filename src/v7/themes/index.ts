// src/v7/themes/index.ts — HORIZON V7: Life OS
//
// 3 темы. Не 8. Каждая — полноценная философия, не вариант раскраски.
//
// Midnight — AMOLED чёрный, холодный cyan. Для ночи и фокуса.
// Aurora — тёмный индиго, фиолетовый + бирюзовый. Для глубины.
// Paper — светлый минимализм. Для дня и ясности.

export type ThemeId = 'midnight' | 'aurora' | 'paper';

export interface V7Theme {
  id: ThemeId;
  name: string;
  emoji: string;
  desc: string;
  dark: boolean;

  // 3 уровня фона
  void: string;
  surface: string;
  card: string;

  // Текст
  text: string;
  textSecondary: string;
  textTertiary: string;

  // Акцент — один на тему
  accent: string;
  accentSoft: string;
  accentText: string;

  // Семантика
  success: string;
  warning: string;
  danger: string;

  // Разделитель
  divider: string;

  // Glow цвет для фона
  glow1: string;
  glow2: string;
}

export const V7_THEMES: V7Theme[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    emoji: '🌙',
    desc: 'AMOLED чёрный, холодный cyan. Для ночи и фокуса.',
    dark: true,
    void: '#000000',
    surface: '#08080C',
    card: '#101018',
    text: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.65)',
    textTertiary: 'rgba(255,255,255,0.35)',
    accent: '#5AC8FA',
    accentSoft: 'rgba(90,200,250,0.12)',
    accentText: '#000000',
    success: '#30D158',
    warning: '#FF9F0A',
    danger: '#FF453A',
    divider: 'rgba(255,255,255,0.06)',
    glow1: '#5AC8FA',
    glow2: '#0A84FF',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    emoji: '🌌',
    desc: 'Тёмный индиго, фиолетовый + бирюзовый. Для глубины.',
    dark: true,
    void: '#0A0A1A',
    surface: '#101028',
    card: '#181838',
    text: '#F0F0FF',
    textSecondary: 'rgba(240,240,255,0.65)',
    textTertiary: 'rgba(240,240,255,0.35)',
    accent: '#BF5AF2',
    accentSoft: 'rgba(191,90,242,0.15)',
    accentText: '#FFFFFF',
    success: '#30D158',
    warning: '#FFD60A',
    danger: '#FF453A',
    divider: 'rgba(191,90,242,0.12)',
    glow1: '#BF5AF2',
    glow2: '#5AC8FA',
  },
  {
    id: 'paper',
    name: 'Paper',
    emoji: '📄',
    desc: 'Светлый минимализм. Для дня и ясности.',
    dark: false,
    void: '#F5F5F0',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: 'rgba(26,26,26,0.6)',
    textTertiary: 'rgba(26,26,26,0.35)',
    accent: '#007AFF',
    accentSoft: 'rgba(0,122,255,0.08)',
    accentText: '#FFFFFF',
    success: '#34C759',
    warning: '#FF9500',
    danger: '#FF3B30',
    divider: 'rgba(0,0,0,0.06)',
    glow1: '#007AFF',
    glow2: '#5AC8FA',
  },
];

export function getV7Theme(id: string | undefined): V7Theme {
  return V7_THEMES.find(t => t.id === id) || V7_THEMES[0];
}
