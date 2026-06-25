// src/design/designs.ts — v4.6
//
// 8 современных дизайнов интерфейса. Каждый = полный визуальный язык.
// Цвета берутся из темы (src/theme.ts), здесь только структурные токены.
import { DesignTokens, DesignId } from './types';

export const DESIGNS: DesignTokens[] = [
  // ── a) Minimal Glass — iOS 18 / visionOS ────────────────────────────────
  {
    id: 'minimal-glass',
    name: 'Minimal Glass',
    emoji: '🪟',
    desc: 'iOS 18 / visionOS. Матовое стекло, тонкие линии, огромные radius, монохром + 1 accent.',
    cardRadius: 24, btnRadius: 18, modalRadius: 28, inputRadius: 16, chipRadius: 20, iconBtnRadius: 14,
    titleFont: 'BarlowCondensed_900Black', bodyFont: 'Barlow_400Regular', monoFont: 'Barlow_500Medium',
    titleSize: 24, sectionSize: 18, bodySize: 15, captionSize: 11,
    titleLetterSpacing: 0.5, bodyLetterSpacing: 0.3, uppercase: false,
    cardShadow: true, cardShadowColor: '#000', cardShadowOpacity: 0.15, cardShadowRadius: 12, cardElevation: 4,
    cardGlow: false, cardGlowColor: '', cardGlowRadius: 0,
    cardBorderWidth: 1, btnBorderWidth: 0, inputBorderWidth: 1,
    cardBorderColorAlpha: '22',
    cardPadding: 18, screenPadding: 16, contentGap: 12, sectionGap: 18, btnHeight: 48, inputHeight: 48,
    useBlur: true, blurIntensity: 40,
    pressScale: 0.97, pressOpacity: 0.8,
    titlePrefix: '', titleSuffix: '',
    backgroundId: 'focus',
  },

  // ── b) Neon Cyber — synthwave 2.0 ──────────────────────────────────────
  {
    id: 'neon-cyber',
    name: 'Neon Cyber',
    emoji: '⚡',
    desc: 'Synthwave 2.0. Неоновый glow, жирные границы, острые углы, magenta-cyan палитра.',
    cardRadius: 4, btnRadius: 4, modalRadius: 6, inputRadius: 2, chipRadius: 2, iconBtnRadius: 4,
    titleFont: 'BarlowCondensed_900Black', bodyFont: 'Barlow_400Regular', monoFont: 'BarlowCondensed_700Bold',
    titleSize: 22, sectionSize: 18, bodySize: 14, captionSize: 10,
    titleLetterSpacing: 3, bodyLetterSpacing: 1, uppercase: false,
    cardShadow: false, cardShadowColor: '#000', cardShadowOpacity: 0, cardShadowRadius: 0, cardElevation: 0,
    cardGlow: true, cardGlowColor: '', cardGlowRadius: 12,
    cardBorderWidth: 1.5, btnBorderWidth: 1.5, inputBorderWidth: 1.5,
    cardBorderColorAlpha: 'FF',
    cardPadding: 14, screenPadding: 12, contentGap: 10, sectionGap: 16, btnHeight: 46, inputHeight: 44,
    useBlur: false, blurIntensity: 0,
    pressScale: 0.95, pressOpacity: 0.7,
    titlePrefix: '> ', titleSuffix: '',
    backgroundId: 'neon',
  },

  // ── c) Paper Classic — премиальная бумага ──────────────────────────────
  {
    id: 'paper-classic',
    name: 'Paper Classic',
    emoji: '📜',
    desc: 'Премиальная бумага. Тёплый офф-вайт, минимальные тени, гротеск, лёгкая grain текстура.',
    cardRadius: 12, btnRadius: 10, modalRadius: 16, inputRadius: 8, chipRadius: 16, iconBtnRadius: 12,
    titleFont: 'BarlowCondensed_700Bold', bodyFont: 'Barlow_400Regular', monoFont: 'Barlow_500Medium',
    titleSize: 24, sectionSize: 18, bodySize: 15, captionSize: 11,
    titleLetterSpacing: 0.3, bodyLetterSpacing: 0.2, uppercase: false,
    cardShadow: true, cardShadowColor: '#000', cardShadowOpacity: 0.12, cardShadowRadius: 8, cardElevation: 3,
    cardGlow: false, cardGlowColor: '', cardGlowRadius: 0,
    cardBorderWidth: 1, btnBorderWidth: 1, inputBorderWidth: 1,
    cardBorderColorAlpha: '33',
    cardPadding: 18, screenPadding: 16, contentGap: 12, sectionGap: 18, btnHeight: 48, inputHeight: 46,
    useBlur: false, blurIntensity: 0,
    pressScale: 0.98, pressOpacity: 0.85,
    titlePrefix: '', titleSuffix: '',
    backgroundId: 'paper',
  },

  // ── d) Cosmic Deep — космос ────────────────────────────────────────────
  {
    id: 'cosmic-deep',
    name: 'Cosmic Deep',
    emoji: '🪐',
    desc: 'Космос. Глубокий тёмный фон, мерцающие звёзды, орбитальные элементы, glow-карточки.',
    cardRadius: 16, btnRadius: 12, modalRadius: 20, inputRadius: 12, chipRadius: 20, iconBtnRadius: 14,
    titleFont: 'BarlowCondensed_900Black', bodyFont: 'Barlow_400Regular', monoFont: 'Barlow_500Medium',
    titleSize: 22, sectionSize: 18, bodySize: 14, captionSize: 11,
    titleLetterSpacing: 1, bodyLetterSpacing: 0.3, uppercase: false,
    cardShadow: true, cardShadowColor: '#000', cardShadowOpacity: 0.3, cardShadowRadius: 10, cardElevation: 5,
    cardGlow: true, cardGlowColor: '', cardGlowRadius: 14,
    cardBorderWidth: 1, btnBorderWidth: 0, inputBorderWidth: 1,
    cardBorderColorAlpha: '55',
    cardPadding: 16, screenPadding: 14, contentGap: 12, sectionGap: 16, btnHeight: 48, inputHeight: 46,
    useBlur: false, blurIntensity: 0,
    pressScale: 0.96, pressOpacity: 0.8,
    titlePrefix: '✦ ', titleSuffix: '',
    backgroundId: 'cosmic',
  },

  // ── e) Playful Bubble — пузырьковый ────────────────────────────────────
  {
    id: 'playful-bubble',
    name: 'Playful Bubble',
    emoji: '🫧',
    desc: 'Современный пузырьковый. Огромные radius, пастельные цвета, толстые обводки, emoji как часть дизайна.',
    cardRadius: 30, btnRadius: 24, modalRadius: 32, inputRadius: 20, chipRadius: 28, iconBtnRadius: 20,
    titleFont: 'BarlowCondensed_900Black', bodyFont: 'Barlow_400Regular', monoFont: 'Barlow_500Medium',
    titleSize: 26, sectionSize: 20, bodySize: 16, captionSize: 12,
    titleLetterSpacing: 0.5, bodyLetterSpacing: 0.3, uppercase: false,
    cardShadow: true, cardShadowColor: '#000', cardShadowOpacity: 0.2, cardShadowRadius: 16, cardElevation: 6,
    cardGlow: false, cardGlowColor: '', cardGlowRadius: 0,
    cardBorderWidth: 2, btnBorderWidth: 2, inputBorderWidth: 2,
    cardBorderColorAlpha: '44',
    cardPadding: 20, screenPadding: 18, contentGap: 14, sectionGap: 20, btnHeight: 52, inputHeight: 50,
    useBlur: false, blurIntensity: 0,
    pressScale: 0.92, pressOpacity: 0.85,
    titlePrefix: '🌸 ', titleSuffix: '',
    backgroundId: 'aurora',
  },

  // ── f) Retro Pixel — пиксель-арт 2025 ──────────────────────────────────
  {
    id: 'retro-pixel',
    name: 'Retro Pixel',
    emoji: '👾',
    desc: 'Пиксель-арт. Нулевые радиусы, чёткие сетки, ограниченная палитра, scanline overlay, жирные обводки.',
    cardRadius: 0, btnRadius: 0, modalRadius: 0, inputRadius: 0, chipRadius: 0, iconBtnRadius: 0,
    titleFont: 'BarlowCondensed_900Black', bodyFont: 'BarlowCondensed_700Bold', monoFont: 'BarlowCondensed_900Black',
    titleSize: 22, sectionSize: 18, bodySize: 14, captionSize: 10,
    titleLetterSpacing: 0, bodyLetterSpacing: 0.5, uppercase: true,
    cardShadow: false, cardShadowColor: '#000', cardShadowOpacity: 0, cardShadowRadius: 0, cardElevation: 0,
    cardGlow: false, cardGlowColor: '', cardGlowRadius: 0,
    cardBorderWidth: 3, btnBorderWidth: 3, inputBorderWidth: 2,
    cardBorderColorAlpha: 'FF',
    cardPadding: 12, screenPadding: 12, contentGap: 8, sectionGap: 14, btnHeight: 44, inputHeight: 42,
    useBlur: false, blurIntensity: 0,
    pressScale: 0.95, pressOpacity: 0.7,
    titlePrefix: '► ', titleSuffix: '',
    backgroundId: 'neon',
  },

  // ── g) Nature Calm — биофильный ────────────────────────────────────────
  {
    id: 'nature-calm',
    name: 'Nature Calm',
    emoji: '🌿',
    desc: 'Биофильный дизайн. Землистые тона, органические формы, плавные градиенты как закат/лес.',
    cardRadius: 18, btnRadius: 14, modalRadius: 22, inputRadius: 12, chipRadius: 22, iconBtnRadius: 16,
    titleFont: 'BarlowCondensed_700Bold', bodyFont: 'Barlow_400Regular', monoFont: 'Barlow_500Medium',
    titleSize: 23, sectionSize: 18, bodySize: 15, captionSize: 11,
    titleLetterSpacing: 0.3, bodyLetterSpacing: 0.2, uppercase: false,
    cardShadow: true, cardShadowColor: '#000', cardShadowOpacity: 0.15, cardShadowRadius: 14, cardElevation: 4,
    cardGlow: false, cardGlowColor: '', cardGlowRadius: 0,
    cardBorderWidth: 1, btnBorderWidth: 1, inputBorderWidth: 1,
    cardBorderColorAlpha: '33',
    cardPadding: 18, screenPadding: 16, contentGap: 12, sectionGap: 18, btnHeight: 50, inputHeight: 48,
    useBlur: false, blurIntensity: 0,
    pressScale: 0.97, pressOpacity: 0.85,
    titlePrefix: '', titleSuffix: '',
    backgroundId: 'paper',
  },

  // ── h) Mono Print — монохромная печать ─────────────────────────────────
  {
    id: 'mono-print',
    name: 'Mono Print',
    emoji: '📰',
    desc: 'Монохромная печать. Чёрный/белый/серый, колоночная вёрстка, uppercase, контрастные границы.',
    cardRadius: 2, btnRadius: 0, modalRadius: 4, inputRadius: 0, chipRadius: 0, iconBtnRadius: 0,
    titleFont: 'BarlowCondensed_900Black', bodyFont: 'Barlow_400Regular', monoFont: 'Barlow_500Medium',
    titleSize: 26, sectionSize: 18, bodySize: 14, captionSize: 10,
    titleLetterSpacing: 0, bodyLetterSpacing: 0, uppercase: true,
    cardShadow: false, cardShadowColor: '#000', cardShadowOpacity: 0, cardShadowRadius: 0, cardElevation: 0,
    cardGlow: false, cardGlowColor: '', cardGlowRadius: 0,
    cardBorderWidth: 1, btnBorderWidth: 2, inputBorderWidth: 1,
    cardBorderColorAlpha: '66',
    cardPadding: 14, screenPadding: 14, contentGap: 10, sectionGap: 16, btnHeight: 46, inputHeight: 44,
    useBlur: false, blurIntensity: 0,
    pressScale: 0.96, pressOpacity: 0.75,
    titlePrefix: '▎ ', titleSuffix: '',
    backgroundId: 'mono',
  },
];

export function getDesign(id: string | undefined): DesignTokens {
  return DESIGNS.find(d => d.id === id) || DESIGNS[0];
}

// Map old mode IDs → new design IDs for backwards compatibility
export const MODE_TO_DESIGN: Record<string, DesignId> = {
  'focus': 'minimal-glass',
  'aurora': 'playful-bubble',  // aurora → playful bubble (both use blob bg)
  'neon': 'neon-cyber',
  'paper': 'paper-classic',
  'quest': 'playful-bubble',   // quest → playful bubble (gamified)
  'cosmic': 'cosmic-deep',
  'mono': 'mono-print',
  'synthwave': 'neon-cyber',   // synthwave → neon cyber
};

// Reverse map for using existing background components
export const DESIGN_TO_BG: Record<DesignId, 'focus' | 'aurora' | 'neon' | 'paper' | 'quest' | 'cosmic' | 'mono' | 'synthwave'> = {
  'minimal-glass': 'focus',
  'neon-cyber': 'neon',
  'paper-classic': 'paper',
  'cosmic-deep': 'cosmic',
  'playful-bubble': 'aurora',
  'retro-pixel': 'neon',
  'nature-calm': 'paper',
  'mono-print': 'mono',
};
