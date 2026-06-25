// src/design/types.ts — v4.6 Unified Design System types
//
// Единая дизайн-система, объединяющая:
//   • Цвета (из src/theme.ts — не дублируем, используем как есть)
//   • Радиусы (card, button, modal, input, chip)
//   • Шрифты (title, body, mono + размеры)
//   • Тени и glow
//   • Отступы (card padding, screen padding, gaps)
//   • BorderWidth
//   • Анимации
//   • Иконографические префиксы
//
// Каждый дизайн — это полный визуальный язык, а не набор радиусов.
// Применяется ко ВСЕМ компонентам: Card, Btn, Header, Input, Modal, Tab.

export type DesignId =
  | 'minimal-glass'  // a) iOS 18, blur, huge radius
  | 'neon-cyber'     // b) synthwave 2.0, glow, sharp
  | 'paper-classic'  // c) premium paper, warm
  | 'cosmic-deep'    // d) space, stars, orbits
  | 'playful-bubble' // e) huge radius, pastel, thick
  | 'retro-pixel'    // f) pixel art, zero radius, scanlines
  | 'nature-calm'    // g) biophilic, earthy, organic
  | 'mono-print';    // h) monochrome print, columns, uppercase

export interface DesignTokens {
  // ── Идентификация ──────────────────────────────────────────────────────
  id: DesignId;
  name: string;
  emoji: string;
  desc: string;

  // ── Радиусы ────────────────────────────────────────────────────────────
  cardRadius: number;
  btnRadius: number;
  modalRadius: number;
  inputRadius: number;
  chipRadius: number;
  iconBtnRadius: number;

  // ── Шрифты ─────────────────────────────────────────────────────────────
  titleFont: string;
  bodyFont: string;
  monoFont: string;
  titleSize: number;       //大型 заголовок экрана
  sectionSize: number;     // заголовок секции
  bodySize: number;
  captionSize: number;
  titleLetterSpacing: number;
  bodyLetterSpacing: number;
  uppercase: boolean;      // для mono-print

  // ── Тени и glow ────────────────────────────────────────────────────────
  cardShadow: boolean;
  cardShadowColor: string;
  cardShadowOpacity: number;
  cardShadowRadius: number;
  cardElevation: number;
  cardGlow: boolean;
  cardGlowColor: string;  // null = use theme primary
  cardGlowRadius: number;

  // ── Borders ────────────────────────────────────────────────────────────
  cardBorderWidth: number;
  btnBorderWidth: number;
  inputBorderWidth: number;
  // Цвета границ берутся из темы, но можно переопределить
  cardBorderColorAlpha: string;  // hex suffix like '22' for primary+22

  // ── Отступы ────────────────────────────────────────────────────────────
  cardPadding: number;
  screenPadding: number;
  contentGap: number;     // между карточками
  sectionGap: number;     // между секциями
  btnHeight: number;
  inputHeight: number;

  // ── Backdrop / Blur ────────────────────────────────────────────────────
  useBlur: boolean;
  blurIntensity: number;

  // ── Анимации ───────────────────────────────────────────────────────────
  pressScale: number;     // 0.95 = сжимается на 5% при нажатии
  pressOpacity: number;   // 0.75 = прозрачность при нажатии

  // ── Иконографические префиксы ──────────────────────────────────────────
  titlePrefix: string;    // '> ' для neon, '⚜ ' для quest и т.д.
  titleSuffix: string;

  // ── Background component ───────────────────────────────────────────────
  // ID фонового компонента из modes/index.tsx — переиспользуем существующие
  backgroundId: 'focus' | 'aurora' | 'neon' | 'paper' | 'quest' | 'cosmic' | 'mono' | 'synthwave';
}
