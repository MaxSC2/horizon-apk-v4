// src/styles.ts — UI Style System (separate from color themes)

export interface UIStyle {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  // Card overrides
  cardRadius: number;
  btnRadius: number;
  modalRadius: number;
  chipRadius: number;
  // Font size multipliers
  fontScale: number;
  // Special visual flags
  hasGlow: boolean;
  hasShadow: boolean;
  hasBorders: boolean;
  borderWidth: number;
  // Font family overrides (applied in RN via fontFamily strings)
  fontTitle: string;   // Barlow Condensed or override
  fontBody: string;    // Barlow or override
  // Spacing
  cardPadding: number;
  screenPadding: number;
  // Special decorative elements
  headerStyle: 'default' | 'rpg' | 'kawaii' | 'pixel';
  tabStyle: 'default' | 'rpg' | 'kawaii' | 'pixel';
  // Background texture effect (css-like description for RN)
  bgPattern: 'none' | 'grid' | 'dots' | 'scanlines';
}

export const UI_STYLES: UIStyle[] = [
  {
    id: 'default',
    name: 'Стандарт',
    desc: 'Чистый минималистичный дизайн',
    emoji: '✦',
    cardRadius: 14, btnRadius: 10, modalRadius: 22, chipRadius: 20,
    fontScale: 1, hasGlow: false, hasShadow: false, hasBorders: true, borderWidth: 1,
    fontTitle: 'BarlowCondensed_900Black', fontBody: 'Barlow_400Regular',
    cardPadding: 16, screenPadding: 14,
    headerStyle: 'default', tabStyle: 'default', bgPattern: 'none',
  },
  {
    id: 'sharp',
    name: 'Резкий',
    desc: 'Острые углы, жирные границы',
    emoji: '⬛',
    cardRadius: 4, btnRadius: 2, modalRadius: 6, chipRadius: 4,
    fontScale: 1, hasGlow: false, hasShadow: false, hasBorders: true, borderWidth: 2,
    fontTitle: 'BarlowCondensed_900Black', fontBody: 'Barlow_400Regular',
    cardPadding: 14, screenPadding: 12,
    headerStyle: 'default', tabStyle: 'default', bgPattern: 'grid',
  },
  {
    id: 'soft',
    name: 'Мягкий',
    desc: 'Пузырчатый, скруглённый, уютный',
    emoji: '🫧',
    cardRadius: 24, btnRadius: 22, modalRadius: 32, chipRadius: 30,
    fontScale: 1.05, hasGlow: false, hasShadow: true, hasBorders: false, borderWidth: 0,
    fontTitle: 'BarlowCondensed_700Bold', fontBody: 'Barlow_400Regular',
    cardPadding: 18, screenPadding: 16,
    headerStyle: 'default', tabStyle: 'default', bgPattern: 'none',
  },
  {
    id: 'glow',
    name: 'Свечение',
    desc: 'Неоновые тени, футуристика',
    emoji: '💎',
    cardRadius: 16, btnRadius: 12, modalRadius: 24, chipRadius: 20,
    fontScale: 1, hasGlow: true, hasShadow: true, hasBorders: true, borderWidth: 1,
    fontTitle: 'BarlowCondensed_900Black', fontBody: 'Barlow_400Regular',
    cardPadding: 16, screenPadding: 14,
    headerStyle: 'default', tabStyle: 'default', bgPattern: 'none',
  },
  {
    id: 'rpg',
    name: 'РПГ',
    desc: 'Фэнтезийный стиль, как в игре',
    emoji: '⚔️',
    cardRadius: 6, btnRadius: 4, modalRadius: 8, chipRadius: 6,
    fontScale: 1.1, hasGlow: true, hasShadow: true, hasBorders: true, borderWidth: 2,
    fontTitle: 'BarlowCondensed_900Black', fontBody: 'Barlow_400Regular',
    cardPadding: 14, screenPadding: 12,
    headerStyle: 'rpg', tabStyle: 'rpg', bgPattern: 'none',
  },
  {
    id: 'kawaii',
    name: 'Кавайный',
    desc: 'Милый японский стиль 🌸',
    emoji: '🌸',
    cardRadius: 20, btnRadius: 18, modalRadius: 28, chipRadius: 24,
    fontScale: 1.05, hasGlow: false, hasShadow: true, hasBorders: true, borderWidth: 1,
    fontTitle: 'BarlowCondensed_700Bold', fontBody: 'Barlow_400Regular',
    cardPadding: 16, screenPadding: 14,
    headerStyle: 'kawaii', tabStyle: 'kawaii', bgPattern: 'dots',
  },
  {
    id: 'pixel',
    name: 'Пиксель',
    desc: '8-бит, ретро-игровой стиль',
    emoji: '👾',
    cardRadius: 0, btnRadius: 0, modalRadius: 0, chipRadius: 0,
    fontScale: 1.1, hasGlow: false, hasShadow: false, hasBorders: true, borderWidth: 3,
    fontTitle: 'BarlowCondensed_900Black', fontBody: 'BarlowCondensed_700Bold',
    cardPadding: 12, screenPadding: 12,
    headerStyle: 'pixel', tabStyle: 'pixel', bgPattern: 'scanlines',
  },
];

export function getUIStyle(id: string): UIStyle {
  return UI_STYLES.find(s => s.id === id) || UI_STYLES[0];
}

// RPG content overrides
export const RPG_LABELS: Record<string, string> = {
  'ГОРИЗОНТ': '⚔️ ГОРИЗОНТ',
  'ТРЕН.': '🗡️ БИТВА',
  'ЗАДАЧИ': '📜 КВЕСТЫ',
  'ПИТАНИЕ': '🍖 ЗЕЛЬЯ',
  'ДНЕВНИК': '📕 ЛЕТОПИСЬ',
  'РАЗУМ': '🔮 ОРАКУЛ',
  'СТАТЫ': '🏆 СТАТЫ',
  'Тренировка': '⚔️ Сражение',
  'Задачи': '📜 Квесты',
  'Дневник': '📕 Летопись',
  'Цели': '🗺️ Миссии',
  'Life Score': '✨ Уровень силы',
  'Серия': '🔥 Цепь побед',
  'Достижения': '🏆 Трофеи',
};

export const KAWAII_LABELS: Record<string, string> = {
  'ГОРИЗОНТ': '🌸 ГОРИЗОНТ',
  'ТРЕН.': '💪 ТРЕН.',
  'ЗАДАЧИ': '✅ ЗАДАЧИ',
  'ПИТАНИЕ': '🍡 ЕДА',
  'ДНЕВНИК': '📔 ДНЕВНИК',
  'РАЗУМ': '✨ ИИ',
  'СТАТЫ': '⭐ СТАТЫ',
};

export const PIXEL_LABELS: Record<string, string> = {
  'ГОРИЗОНТ': '► ГОРИЗОНТ',
  'ТРЕН.': '► ТРЕН.',
  'ЗАДАЧИ': '► ДЕЛА',
  'ПИТАНИЕ': '► ЕДА',
  'ДНЕВНИК': '► LOG',
  'РАЗУМ': '► AI',
  'СТАТЫ': '► RPT.',
};

// Style-specific decorators
export function getStyleDecorators(styleId: string, colors: any) {
  switch (styleId) {
    case 'rpg':
      return {
        headerBg: `${colors.bg}`,
        headerBorder: `2px solid ${colors.primary}`,
        cardExtra: { borderColor: colors.primary + '55' },
        btnDecoLeft: '[ ',
        btnDecoRight: ' ]',
        scoreLabel: 'УРОВЕНЬ СИЛЫ',
        streakLabel: '⚔️ ПОБЕДНАЯ СЕРИЯ',
        divider: '════════════════',
      };
    case 'kawaii':
      return {
        headerBg: colors.bg,
        cardExtra: {},
        btnDecoLeft: '( ',
        btnDecoRight: ' )',
        scoreLabel: 'МОЙ ПРОГРЕСС ♡',
        streakLabel: '🔥 дней подряд ♡',
        divider: '～～～～～～～～',
      };
    case 'pixel':
      return {
        headerBg: colors.bg,
        cardExtra: { borderColor: colors.primary, borderWidth: 3 },
        btnDecoLeft: '> ',
        btnDecoRight: '',
        scoreLabel: 'SCORE',
        streakLabel: 'STREAK',
        divider: '████████████████',
      };
    default:
      return { headerBg: colors.surf, cardExtra: {}, btnDecoLeft: '', btnDecoRight: '', scoreLabel: 'Score недели', streakLabel: 'Серия', divider: '' };
  }
}
