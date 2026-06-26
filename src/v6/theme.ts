// src/v6/theme.ts — HORIZON V6
//
// ОДИН проработанный дизайн. Без рамок, без ярких акцентов, без хаоса.
// Вдохновлено: Apple Health, Whoop, Linear, Arc Browser, Raycast.
//
// Принципы:
//   • Чистый тёмный фон с тонким gradient mesh (как Linear)
//   • Карточки БЕЗ рамок — только elevation через тень
//   • Единая типографика: SF Pro style (используем Barlow как fallback)
//   • Акцент — мягкий cyan/teal, не "кричащий" зелёный
//   • Большие отступы (20px), воздушность
//   • Минимум иконок — только там где они несут смысл
//   • navigation — Apple Health style, не floating dock

export interface V6Colors {
  // 3 уровня фона — градиент
  void: string;        // самый глубокий
  surface: string;     // основной
  card: string;        // приподнятые карточки (на 1 уровень выше surface)

  // Текст — белый с разной прозрачностью
  textPrimary: string;     // 100%
  textSecondary: string;   // 70%
  textTertiary: string;    // 45%

  // Акцент — мягкий, не кричащий
  accent: string;          // основной
  accentSoft: string;      // для фоновых подсказок
  accentText: string;      // текст на акцентном фоне

  // Семантика
  success: string;
  warning: string;
  danger: string;

  // Границы — ЕДИНСТВЕННОЕ использование (для divider'ов)
  divider: string;
}

export const v6Colors: V6Colors = {
  void: '#000000',           // чёрный как космос
  surface: '#0A0A0F',        // чуть светлее
  card: '#14141C',           // карточки

  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textTertiary: 'rgba(255, 255, 255, 0.45)',

  // Soft cyan — современный акцент (как Linear/Arc)
  accent: '#5AC8FA',
  accentSoft: 'rgba(90, 200, 250, 0.12)',
  accentText: '#000000',

  success: '#30D158',
  warning: '#FF9F0A',
  danger: '#FF453A',

  divider: 'rgba(255, 255, 255, 0.06)',
};

// Типографика — единая система размеров
export const v6Typography = {
  // Display — только для hero цифр (Level, Streak)
  display: { fontFamily: 'BarlowCondensed_900Black', fontSize: 56, letterSpacing: -1, lineHeight: 60 },
  // Title — заголовки секций
  title1: { fontFamily: 'BarlowCondensed_900Black', fontSize: 28, letterSpacing: -0.5, lineHeight: 32 },
  title2: { fontFamily: 'BarlowCondensed_900Black', fontSize: 22, letterSpacing: -0.3, lineHeight: 26 },
  // Body — основной текст
  body: { fontFamily: 'Barlow_400Regular', fontSize: 16, letterSpacing: 0, lineHeight: 22 },
  bodyMedium: { fontFamily: 'Barlow_500Medium', fontSize: 15, letterSpacing: 0, lineHeight: 20 },
  // Caption — подписи, метки
  caption: { fontFamily: 'Barlow_500Medium', fontSize: 13, letterSpacing: 0.2, lineHeight: 16 },
  micro: { fontFamily: 'Barlow_500Medium', fontSize: 11, letterSpacing: 0.5, lineHeight: 14 },
  // Моноширинный — для чисел/статусов
  mono: { fontFamily: 'Barlow_500Medium', fontSize: 14, letterSpacing: 0.5, lineHeight: 18 },
};

// Геометрия
export const v6Geometry = {
  cardRadius: 20,        // мягкие скругления
  btnRadius: 14,
  inputRadius: 12,
  chipRadius: 8,
  iconRadius: 12,

  screenPadding: 20,     // большие отступы
  cardPadding: 20,
  cardGap: 14,           // между карточками
  sectionGap: 24,        // между секциями

  btnHeight: 52,
  inputHeight: 48,

  cardElevation: 8,      // shadow depth
};
