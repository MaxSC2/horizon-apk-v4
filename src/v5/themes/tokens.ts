// src/v5/themes/tokens.ts — HORIZON V5
//
// Полностью новая система дизайн-токенов. Никакой связи с v4.
// Каждая тема — это не набор цветов, а полноценный визуальный язык
// со своей анимационной моделью, типографикой, поведением.
//
// 4 темы:
//   1. SOLO LEVELING — голографические панели, system window, синий glow
//   2. DEV COMMAND — terminal aesthetic, monochrome, typewriter
//   3. GLASS FUTURE — visionOS glassmorphism, parallax, liquid
//   4. CYBERPUNK NEXUS — neon HUD, scanlines, glitches

export type ThemeId = 'solo' | 'dev' | 'glass' | 'cyber';

// ── Цветовая система V5 ─────────────────────────────────────────────────────
// Не "primary/secondary", а семантические роли с конкретным назначением.
export interface V5Colors {
  // Базовые слои фона (3 уровня глубины)
  void: string;        // самый глубокий фон (космос/пустота)
  surface: string;     // основной слой интерфейса
  elevated: string;    // приподнятые элементы (карточки, модалки)

  // Текст
  text: string;        // основной
  textMuted: string;   // приглушённый
  textDim: string;     // совсем тусклый (placeholder, hints)

  // Акценты (3 уровня интенсивности)
  glow: string;        // основной glow-цвет
  glowSoft: string;    // мягкий вариант (для фоновых эффектов)
  glowStrong: string;  // насыщенный (для активных элементов)

  // Семантические
  success: string;
  warning: string;
  danger: string;
  info: string;

  // Границы
  border: string;
  borderGlow: string;  // светящаяся граница

  // Оверлеи
  overlay: string;     // полупрозрачный для модалок
  scrim: string;       // затемнение фона
}

// ── Типографическая система V5 ─────────────────────────────────────────────
export interface V5Typography {
  display: string;     // огромные цифры/заголовки экранов
  title: string;       // заголовки секций
  body: string;        // основной текст
  mono: string;        // моноширинный (terminal/code)
  caption: string;     // мелкий текст

  displaySize: number;
  titleSize: number;
  bodySize: number;
  captionSize: number;

  displayTracking: number;  // letter-spacing
  titleTracking: number;
  bodyTracking: number;

  uppercase: boolean;
}

// ── Геометрия V5 ────────────────────────────────────────────────────────────
export interface V5Geometry {
  cardRadius: number;
  btnRadius: number;
  inputRadius: number;
  chipRadius: number;
  iconRadius: number;

  cardBorderWidth: number;
  btnBorderWidth: number;

  cardPadding: number;
  btnHeight: number;
  inputHeight: number;

  screenPadding: number;
  cardGap: number;
  sectionGap: number;
}

// ── Анимационная модель V5 ──────────────────────────────────────────────────
export interface V5Motion {
  // Длительности (мс)
  fast: number;        // 150-200мс — tap feedback
  normal: number;      // 300-400мс — переходы
  slow: number;        // 600-800мс — полноэкранные

  // Easing
  easeOut: any;
  easeInOut: any;
  spring: any;

  // Поведение нажатия
  pressScale: number;
  pressOpacity: number;

  // Параметры свечения
  glowPulseDuration: number;  // пульсация glow
  glowPulseOpacity: [number, number]; // [min, max]

  // Particle-эффекты
  particleCount: number;
  particleDuration: number;
}

// ── Полная тема V5 ──────────────────────────────────────────────────────────
export interface V5Theme {
  id: ThemeId;
  name: string;
  emoji: string;
  tagline: string;
  description: string;

  colors: V5Colors;
  typography: V5Typography;
  geometry: V5Geometry;
  motion: V5Motion;

  // ID фоновой компоненты (рендерится отдельным компонентом)
  backgroundId: ThemeId;

  // ID лоадера (тоже отдельный компонент)
  loaderId: ThemeId;

  // Уникальные фишки темы (включают определённые декорации)
  features: {
    holographicBorders: boolean;   // светящиеся анимированные границы
    scanlines: boolean;            // CRT scanline overlay
    particles: boolean;            // плавающие частицы
    typewriter: boolean;           // печатающийся текст
    glitch: boolean;               // глитч-эффекты
    parallax: boolean;             // параллакс при скролле
    terminalCursor: boolean;       // мигающий курсор _>
    aura: boolean;                 // аура вокруг активных элементов
  };
}
