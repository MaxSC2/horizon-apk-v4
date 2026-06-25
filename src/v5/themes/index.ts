// src/v5/themes/index.ts — HORIZON V5
//
// 4 радикально разных темы. Каждая = полноценный визуальный язык.
// Вдохновлено: Solo Leveling, Warp/VS Code, Apple VisionOS, Cyberpunk 2077.
import { Easing } from 'react-native';
import { V5Theme } from './tokens';

// ═══════════════════════════════════════════════════════════════════════════
// THEME 1: SOLO LEVELING — System Window aesthetic
// ═══════════════════════════════════════════════════════════════════════════
// Вдохновлено: Solo Leveling, Eve Online, sci-fi RPG system windows
// Характер: тёмный, мистический, с синим/фиолетовым свечением
// Цель: пользователь чувствует себя оператором RPG-системы
const SOLO_LEVELING: V5Theme = {
  id: 'solo',
  name: 'Solo Leveling',
  emoji: '⚔️',
  tagline: 'System Window Active',
  description: 'Голографические панели, синий/фиолет glow, частицы маны. Чувство оператора RPG-системы.',

  colors: {
    void: '#050816',         // глубокий космос
    surface: '#0A0F1F',      // основной слой
    elevated: '#0F1729',     // приподнятые карточки
    text: '#E0E7FF',         // холодный белый
    textMuted: '#6B7BB0',    // приглушённый синеватый
    textDim: '#3D4870',      // очень тусклый
    glow: '#4D7CFE',         // основной синий glow
    glowSoft: '#1E2D5C',     // мягкий фоновый
    glowStrong: '#7B9BFF',   // насыщенный активный
    success: '#00E5A0',
    warning: '#FFB938',
    danger: '#FF4757',
    info: '#5B9BFF',
    border: '#1F2D52',
    borderGlow: '#4D7CFE',
    overlay: 'rgba(10, 15, 31, 0.85)',
    scrim: 'rgba(5, 8, 22, 0.95)',
  },

  typography: {
    display: 'BarlowCondensed_900Black',
    title: 'BarlowCondensed_900Black',
    body: 'Barlow_400Regular',
    mono: 'BarlowCondensed_700Bold',
    caption: 'Barlow_500Medium',
    displaySize: 48,
    titleSize: 20,
    bodySize: 15,
    captionSize: 11,
    displayTracking: 4,
    titleTracking: 2,
    bodyTracking: 0.3,
    uppercase: true,
  },

  geometry: {
    cardRadius: 4,           // острые углы = system window
    btnRadius: 2,
    inputRadius: 2,
    chipRadius: 0,
    iconRadius: 2,
    cardBorderWidth: 1.5,
    btnBorderWidth: 1.5,
    cardPadding: 16,
    btnHeight: 46,
    inputHeight: 44,
    screenPadding: 14,
    cardGap: 10,
    sectionGap: 16,
  },

  motion: {
    fast: 180,
    normal: 350,
    slow: 700,
    easeOut: Easing.out(Easing.cubic),
    easeInOut: Easing.inOut(Easing.cubic),
    spring: { damping: 14, stiffness: 150, mass: 0.8 },
    pressScale: 0.96,
    pressOpacity: 0.85,
    glowPulseDuration: 3000,
    glowPulseOpacity: [0.4, 0.9],
    particleCount: 30,
    particleDuration: 8000,
  },

  backgroundId: 'solo',
  loaderId: 'solo',

  features: {
    holographicBorders: true,
    scanlines: false,
    particles: true,
    typewriter: false,
    glitch: false,
    parallax: true,
    terminalCursor: false,
    aura: true,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// THEME 2: DEVELOPER COMMAND CENTER — Terminal aesthetic
// ═══════════════════════════════════════════════════════════════════════════
// Вдохновлено: Warp, VS Code, GitHub, Raycast
// Характер: monochrome, code-inspired, профессиональный
// Цель: пользователь чувствует себя в AI-окружении разработки
const DEV_COMMAND: V5Theme = {
  id: 'dev',
  name: 'Dev Command',
  emoji: '⌘',
  tagline: 'AI Development Environment',
  description: 'Terminal aesthetic, monochrome, typewriter rendering. Профессиональное AI-dev окружение.',

  colors: {
    void: '#0A0A0A',
    surface: '#0F0F0F',
    elevated: '#161616',
    text: '#E8E8E8',
    textMuted: '#7A7A7A',
    textDim: '#4A4A4A',
    glow: '#00FF88',         // терминальный зелёный
    glowSoft: '#0A2A1A',
    glowStrong: '#39FF14',
    success: '#00FF88',
    warning: '#FFD60A',
    danger: '#FF453A',
    info: '#0A84FF',
    border: '#262626',
    borderGlow: '#00FF88',
    overlay: 'rgba(15, 15, 15, 0.92)',
    scrim: 'rgba(10, 10, 10, 0.96)',
  },

  typography: {
    display: 'BarlowCondensed_900Black',
    title: 'BarlowCondensed_700Bold',
    body: 'Barlow_500Medium',
    mono: 'BarlowCondensed_700Bold',
    caption: 'Barlow_500Medium',
    displaySize: 32,
    titleSize: 18,
    bodySize: 14,
    captionSize: 11,
    displayTracking: 0,
    titleTracking: 0.5,
    bodyTracking: 0,
    uppercase: false,
  },

  geometry: {
    cardRadius: 2,
    btnRadius: 0,
    inputRadius: 0,
    chipRadius: 0,
    iconRadius: 0,
    cardBorderWidth: 1,
    btnBorderWidth: 1,
    cardPadding: 14,
    btnHeight: 44,
    inputHeight: 42,
    screenPadding: 12,
    cardGap: 8,
    sectionGap: 14,
  },

  motion: {
    fast: 120,
    normal: 250,
    slow: 500,
    easeOut: Easing.out(Easing.poly(2)),
    easeInOut: Easing.inOut(Easing.poly(2)),
    spring: { damping: 18, stiffness: 200, mass: 0.6 },
    pressScale: 0.97,
    pressOpacity: 0.7,
    glowPulseDuration: 1200,  // быстрое мерцание курсора
    glowPulseOpacity: [0.3, 1.0],
    particleCount: 0,         // без частиц — terminal не нуждается
    particleDuration: 0,
  },

  backgroundId: 'dev',
  loaderId: 'dev',

  features: {
    holographicBorders: false,
    scanlines: false,
    particles: false,
    typewriter: true,
    glitch: false,
    parallax: false,
    terminalCursor: true,
    aura: false,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// THEME 3: GLASS FUTURE — VisionOS / Nothing aesthetic
// ═══════════════════════════════════════════════════════════════════════════
// Вдохновлено: Apple VisionOS, Nothing OS, Linear, modern concepts
// Характер: лёгкий, воздушный, glassmorphism, layered depth
// Цель: интерфейс feels lightweight and futuristic
const GLASS_FUTURE: V5Theme = {
  id: 'glass',
  name: 'Glass Future',
  emoji: '🪟',
  tagline: 'VisionOS Layered Experience',
  description: 'Glassmorphism, layered depth, parallax, liquid motion. Лёгкий футуристичный интерфейс.',

  colors: {
    void: '#1A1A2E',
    surface: '#1F1F35',
    elevated: '#252540',
    text: '#FFFFFF',
    textMuted: 'rgba(255, 255, 255, 0.6)',
    textDim: 'rgba(255, 255, 255, 0.35)',
    glow: '#A78BFA',         // лавандовый
    glowSoft: 'rgba(167, 139, 250, 0.15)',
    glowStrong: '#C4B5FD',
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171',
    info: '#60A5FA',
    border: 'rgba(255, 255, 255, 0.1)',
    borderGlow: 'rgba(167, 139, 250, 0.5)',
    overlay: 'rgba(31, 31, 53, 0.7)',
    scrim: 'rgba(26, 26, 46, 0.85)',
  },

  typography: {
    display: 'BarlowCondensed_900Black',
    title: 'BarlowCondensed_900Black',
    body: 'Barlow_400Regular',
    mono: 'Barlow_500Medium',
    caption: 'Barlow_400Regular',
    displaySize: 44,
    titleSize: 22,
    bodySize: 15,
    captionSize: 12,
    displayTracking: 1,
    titleTracking: 0.5,
    bodyTracking: 0.2,
    uppercase: false,
  },

  geometry: {
    cardRadius: 28,          // огромные скругления
    btnRadius: 22,
    inputRadius: 18,
    chipRadius: 24,
    iconRadius: 16,
    cardBorderWidth: 1,
    btnBorderWidth: 0,
    cardPadding: 20,
    btnHeight: 52,
    inputHeight: 50,
    screenPadding: 18,
    cardGap: 14,
    sectionGap: 20,
  },

  motion: {
    fast: 220,
    normal: 400,
    slow: 800,
    easeOut: Easing.out(Easing.sin),
    easeInOut: Easing.inOut(Easing.sin),
    spring: { damping: 18, stiffness: 120, mass: 1.0 },
    pressScale: 0.95,
    pressOpacity: 0.9,
    glowPulseDuration: 5000,
    glowPulseOpacity: [0.3, 0.6],
    particleCount: 12,       // мало, но плавно
    particleDuration: 12000,
  },

  backgroundId: 'glass',
  loaderId: 'glass',

  features: {
    holographicBorders: false,
    scanlines: false,
    particles: true,
    typewriter: false,
    glitch: false,
    parallax: true,
    terminalCursor: false,
    aura: false,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// THEME 4: CYBERPUNK NEXUS — Neon HUD
// ═══════════════════════════════════════════════════════════════════════════
// Вдохновлено: Cyberpunk 2077, sci-fi HUDs, AI operating systems
// Характер: агрессивный неон, scanlines, glitch, holographic widgets
// Цель: пользователь чувствует себя в продвинутой AI control system
const CYBERPUNK_NEXUS: V5Theme = {
  id: 'cyber',
  name: 'Cyberpunk Nexus',
  emoji: '🦾',
  tagline: 'AI Control System Online',
  description: 'Neon accents, scanlines, glitch effects, holographic HUD. Киберпанк control system.',

  colors: {
    void: '#0A0014',
    surface: '#0F001F',
    elevated: '#150029',
    text: '#FFE5F5',
    textMuted: '#9B5C8A',
    textDim: '#5C2E4D',
    glow: '#FF00FF',         // magenta
    glowSoft: 'rgba(255, 0, 255, 0.1)',
    glowStrong: '#FF0080',
    success: '#00FFFF',      // cyan
    warning: '#FFE600',
    danger: '#FF0040',
    info: '#00DDFF',
    border: '#3D1A52',
    borderGlow: '#FF00FF',
    overlay: 'rgba(15, 0, 31, 0.85)',
    scrim: 'rgba(10, 0, 20, 0.95)',
  },

  typography: {
    display: 'BarlowCondensed_900Black',
    title: 'BarlowCondensed_900Black',
    body: 'Barlow_400Regular',
    mono: 'BarlowCondensed_700Bold',
    caption: 'Barlow_500Medium',
    displaySize: 40,
    titleSize: 20,
    bodySize: 14,
    captionSize: 11,
    displayTracking: 3,
    titleTracking: 2,
    bodyTracking: 0.5,
    uppercase: true,
  },

  geometry: {
    cardRadius: 2,
    btnRadius: 0,
    inputRadius: 0,
    chipRadius: 0,
    iconRadius: 0,
    cardBorderWidth: 2,
    btnBorderWidth: 2,
    cardPadding: 14,
    btnHeight: 46,
    inputHeight: 44,
    screenPadding: 12,
    cardGap: 10,
    sectionGap: 16,
  },

  motion: {
    fast: 100,               // резкие быстрые движения
    normal: 250,
    slow: 500,
    easeOut: Easing.out(Easing.poly(3)),
    easeInOut: Easing.inOut(Easing.poly(3)),
    spring: { damping: 10, stiffness: 250, mass: 0.5 },
    pressScale: 0.93,
    pressOpacity: 0.65,
    glowPulseDuration: 1500,
    glowPulseOpacity: [0.5, 1.0],
    particleCount: 40,
    particleDuration: 4000,
  },

  backgroundId: 'cyber',
  loaderId: 'cyber',

  features: {
    holographicBorders: true,
    scanlines: true,
    particles: true,
    typewriter: false,
    glitch: true,
    parallax: false,
    terminalCursor: false,
    aura: true,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
export const V5_THEMES: V5Theme[] = [SOLO_LEVELING, DEV_COMMAND, GLASS_FUTURE, CYBERPUNK_NEXUS];

export function getV5Theme(id: string | undefined): V5Theme {
  return V5_THEMES.find(t => t.id === id) || V5_THEMES[0];
}

// Re-export types for convenience
export type { V5Theme, ThemeId, V5Colors, V5Typography, V5Geometry, V5Motion } from './tokens';
