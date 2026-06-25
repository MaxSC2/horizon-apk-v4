// src/design/index.ts — v4.6
//
// Единая точка входа в дизайн-систему. Хук useDesign() возвращает текущий
// DesignTokens + Theme. Все компоненты читают стили отсюда, никогда не
// хардкодят радиусы/шрифты/тени.
import { DESIGNS, getDesign, MODE_TO_DESIGN, DESIGN_TO_BG } from './designs';
import { DesignTokens, DesignId } from './types';
import { useApp } from '../AppContext';
import { Theme } from '../types';

// Re-export for external consumers
export { MODE_TO_DESIGN, DESIGN_TO_BG };

export interface DesignContext {
  tokens: DesignTokens;
  T: Theme;
  // Helper: get glow color (defaults to theme primary if not overridden)
  glowColor: string;
  // Helper: get card border color (theme primary + alpha)
  cardBorderColor: string;
}

export function useDesign(): DesignContext {
  const { state, T } = useApp();
  // state.uiMode может содержать старый ID (focus/aurora/...) или новый (minimal-glass/...)
  // Если это старый ID — маппим через MODE_TO_DESIGN
  const rawMode = state.uiMode || 'focus';
  const designId = MODE_TO_DESIGN[rawMode] || (rawMode as DesignId);
  const tokens = getDesign(designId);
  const glowColor = tokens.cardGlowColor || T.primary;
  const cardBorderColor = T.primary + tokens.cardBorderColorAlpha;
  return { tokens, T, glowColor, cardBorderColor };
}

export { DESIGNS, getDesign };
export type { DesignTokens, DesignId };
