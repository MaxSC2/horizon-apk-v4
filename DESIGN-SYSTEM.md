# Дизайн-система ГОРИЗОНТ v4.6

## Архитектура

```
src/
├── design/
│   ├── types.ts        ← DesignTokens interface (15+ параметров)
│   ├── designs.ts      ← 8 дизайнов + маппинг старых mode IDs
│   └── index.ts        ← useDesign() hook
├── components/
│   ├── UnifiedCard.tsx  ← Единая карточка (заменяет Card + ModeCard)
│   ├── UnifiedBtn.tsx   ← Единая кнопка (заменяет Btn + ModeBtn)
│   ├── ScreenHeader.tsx ← Заголовок с кнопкой "Назад"
│   ├── ModeQuickSwitcher.tsx
│   ├── SplashView.tsx
│   └── index.tsx        ← Старые компоненты (для совместимости)
├── modes/
│   └── index.tsx        ← 8 фоновых компонент (переиспользуются)
└── theme.ts             ← 8 цветовых тем (без изменений)
```

## 8 дизайнов

| ID | Название | Описание | Фон |
|----|----------|----------|-----|
| `minimal-glass` | Minimal Glass | iOS 18, blur, огромные radius | focus |
| `neon-cyber` | Neon Cyber | Synthwave 2.0, glow, острые углы | neon |
| `paper-classic` | Paper Classic | Премиальная бумага, тёплый | paper |
| `cosmic-deep` | Cosmic Deep | Космос, звёзды, орбиты | cosmic |
| `playful-bubble` | Playful Bubble | Пузырьки, огромные radius, пастель | aurora |
| `retro-pixel` | Retro Pixel | Пиксель-арт, scanlines, 0 radius | neon |
| `nature-calm` | Nature Calm | Биофильный, землистые тона | paper |
| `mono-print` | Mono Print | Монохром, колонки, uppercase | mono |

## DesignTokens — что меняется

Каждый дизайн определяет:

### Радиусы
- `cardRadius` (0-30)
- `btnRadius` (0-24)
- `modalRadius`, `inputRadius`, `chipRadius`, `iconBtnRadius`

### Шрифты
- `titleFont`, `bodyFont`, `monoFont`
- `titleSize`, `sectionSize`, `bodySize`, `captionSize`
- `titleLetterSpacing`, `bodyLetterSpacing`
- `uppercase` (для mono-print)

### Тени и glow
- `cardShadow`, `cardShadowColor`, `cardShadowOpacity`, `cardShadowRadius`, `cardElevation`
- `cardGlow`, `cardGlowColor`, `cardGlowRadius`

### Borders
- `cardBorderWidth`, `btnBorderWidth`, `inputBorderWidth`
- `cardBorderColorAlpha` (hex suffix, применяется к theme primary)

### Отступы
- `cardPadding`, `screenPadding`, `contentGap`, `sectionGap`
- `btnHeight`, `inputHeight`

### Backdrop
- `useBlur`, `blurIntensity` (для minimal-glass)

### Анимации
- `pressScale`, `pressOpacity`

### Иконография
- `titlePrefix` (`> ` для neon, `✦ ` для cosmic, и т.д.)
- `titleSuffix`

### Background
- `backgroundId` — переиспользует существующие 8 фонов из `src/modes/`

## Использование

```tsx
import { useDesign } from '../design';
import { UnifiedCard, UnifiedBtn } from '../components';

function MyScreen() {
  const { tokens, T } = useDesign();

  return (
    <View>
      <UnifiedCard T={T}>
        <Text>Контент</Text>
      </UnifiedCard>

      <UnifiedBtn T={T} onPress={() => {}} variant="primary">
        Нажми меня
      </UnifiedBtn>
    </View>
  );
}
```

## Маппинг старых mode IDs → новых design IDs

| Старый (uiMode) | Новый (design) |
|-----------------|----------------|
| `focus` | `minimal-glass` |
| `aurora` | `playful-bubble` |
| `neon` | `neon-cyber` |
| `paper` | `paper-classic` |
| `quest` | `playful-bubble` |
| `cosmic` | `cosmic-deep` |
| `mono` | `mono-print` |
| `synthwave` | `neon-cyber` |

Старые ID автоматически маппятся в `useDesign()` для обратной совместимости.

## Принципы

1. **Единая точка правды** — все токены в `designs.ts`, не размазаны по компонентам
2. **Цвета отделены от структуры** — тема (`theme.ts`) даёт цвета, дизайн — форму
3. **8 × 8 = 64 комбинации** — 8 цветовых тем × 8 дизайнов
4. **Backwards compatible** — старый код с `Card`/`Btn`/`ModeCard` продолжает работать
5. **Новые компоненты** — `UnifiedCard`/`UnifiedBtn`/`ScreenHeader` используют DesignSystem
