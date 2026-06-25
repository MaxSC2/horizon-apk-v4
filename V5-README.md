# HORIZON V5 — Complete UI/UX Rebuild

> Полный демонтаж UI-системы v4 и создание новой дизайн-архитектуры с нуля.

## Что нового

V5 — это не обновление v4, а **полностью отдельный UI-стек**:
- 4 радикально разных темы (не 8 косметических вариантов)
- Кастомные загрузчики (никаких spinners)
- Floating Dock navigation (не bottom tab bar)
- Typewriter AI chat rendering
- Анимированные фоны с частицами, glitch, scanlines
- V4 код сохранён как legacy (доступен через `V5_ENABLED = false` в App.tsx)

## 4 темы

### ⚔️ Solo Leveling
**Вдохновение**: Solo Leveling, Eve Online, sci-fi RPG system windows
- Тёмный космический фон с магическими частицами маны (поднимаются снизу)
- Аура-портал пульсирует сверху
- Голографические панели с синим/фиолет glow
- System window aesthetic: острые углы,uppercase, "SYSTEM" метки
- Aura-эффект вокруг активных элементов
- **Загрузчик**: Hologram Construction — собирается голографическая панель + "[ SYSTEM ] INITIALIZING..."

### ⌘ Dev Command
**Вдохновение**: Warp, VS Code, GitHub, Raycast
- Чисто чёрный фон с code rain (Matrix-style, monochrome green)
- Terminal aesthetic: monospace шрифт, мигающий курсор █
- Typewriter effect на всех текстах (печатаются символы)
- Острые углы, тонкие границы, никаких теней
- **Загрузчик**: Terminal Boot Sequence — печатающиеся строки загрузки
  ```
  $ horizon --init
  > Loading core modules...
  > Checking AI providers... [OK]
  > Mounting storage... [OK]
  ...
  ```

### 🪟 Glass Future
**Вдохновение**: Apple VisionOS, Nothing OS, Linear
- Плавающие gradient orbs с parallax-подобным дрейфом
- Glassmorphism через expo-blur (BlurView, intensity 50)
- Огромные radius (28px), воздушные отступы
- Лавандовый glow, плавные sin-easing анимации
- **Загрузчик**: Particle Assembly — 20 частиц собираются в сферу из случайных позиций

### 🦾 Cyberpunk Nexus
**Вдохновение**: Cyberpunk 2077, sci-fi HUDs, AI operating systems
- Perspective grid в нижней половине + scanlines overlay
- Magenta/cyan neon палитра
- Glitch effects: случайные смещения, глитч-текст
- Moving scan line проходит по экрану
- Holographic corner brackets на карточках
- **Загрузчик**: Scan Boot — сканирующий луч + glitch текст + progress bar "▓▓▓▓▓▓▓▓▓░░ 78%"

## Архитектура

```
src/v5/
├── themes/
│   ├── tokens.ts        ← V5Theme interface (colors, typography, geometry, motion, features)
│   └── index.ts         ← 4 темы + getV5Theme()
├── V5Context.tsx         ← V5Provider + useV5() hook
├── V5App.tsx             ← Главный entry с boot animation + dock
├── components/
│   ├── V5Background.tsx  ← 4 анимированных фона
│   ├── V5Card.tsx        ← Карточка с темой (glow, holographic borders, blur)
│   ├── V5Text.tsx        ← Текст с typewriter + cursor
│   └── FloatingDock.tsx  ← Парящая навигация (5 пунктов)
├── loaders/
│   └── V5Loader.tsx      ← 4 кастомных загрузчика
└── screens/
    ├── V5Home.tsx        ← Главная страница (showcase темы)
    └── V5ThemeSwitcher.tsx ← Модалка переключения тем с live preview
```

## Дизайн-токены

Каждая тема определяет:
- **Colors** (16 семантических ролей: void, surface, elevated, text, textMuted, glow, glowSoft, glowStrong, success, warning, danger, info, border, borderGlow, overlay, scrim)
- **Typography** (display, title, body, mono, caption + размеры + letterSpacing + uppercase)
- **Geometry** (6 radius + 3 borderWidth + 6 padding/height)
- **Motion** (3 длительности + 3 easing + spring + pressScale + glowPulse + particle params)
- **Features** (8 boolean флагов: holographicBorders, scanlines, particles, typewriter, glitch, parallax, terminalCursor, aura)

## Floating Dock Navigation

Заменяет стандартный bottom tab bar:
- Парит над контентом с отступом 16-24px от низа
- Активный пункт имеет glow + label-pill снизу
- Glass тема: BlurView фон
- Solo/Cyber: aura glow подчёркивание
- Spring animation при появлении

## Переключение v4/v5

В `App.tsx`:
```ts
const V5_ENABLED = true;  // V5 активен по умолчанию
// const V5_ENABLED = false;  // вернуться к V4
```

## Технологии

- **React Native Animated API** — все анимации (GPU-ускорённые)
- **expo-blur** — glassmorphism для Glass Future
- **expo-linear-gradient** — градиентные фоны
- **react-native-svg** — векторная графика (сетки, частицы)
- **lucide-react-native** — иконки
- **AsyncStorage** — сохранение выбранной темы

Без Framer Motion / Tailwind / shadcn (это веб-стек, не применим к RN).
