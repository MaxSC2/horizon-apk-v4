# ГОРИЗОНТ APK — Инструкция сборки

> **Текущая версия: 4.1.0** — см. [CHANGELOG.md](./CHANGELOG.md) для списка изменений.
>
> Главное в 4.1: исправлен критический баг будильника (уведомления после
> удаления), добавлен self-healing расписания, тест сигнала, сброс уведомлений,
> превью следующего будильника на дашборде, экспорт данных в JSON.

## Требования
- Node.js 18+
- npx / npm
- Android Studio (для AVD) или физический Android телефон

---

## Шаг 1 — Установить зависимости

```bash
cd horizon-apk
npm install
```

---

## Шаг 2 — Установить шрифты Expo Google Fonts

```bash
npx expo install @expo-google-fonts/barlow-condensed @expo-google-fonts/barlow
```

---

## Шаг 3 — Запуск в режиме разработки

```bash
npx expo start
```

Открой на телефоне через **Expo Go** (Android/iOS).

---

## Шаг 4 — Сборка APK (без аккаунта EAS)

### Локальная сборка через expo-dev-client:

```bash
# Установить EAS CLI
npm install -g eas-cli

# Авторизоваться (бесплатный аккаунт expo.dev)
eas login

# Инициализировать проект
eas build:configure

# Собрать APK preview (без Play Store)
eas build -p android --profile preview
```

Через 5-10 минут получишь ссылку на скачивание `.apk`.

### Или локально без EAS (нужен Android SDK):

```bash
npx expo run:android
```

---

## Шаг 5 — Установка на телефон

1. Скачай `.apk` файл
2. На Android: Настройки → Безопасность → Разрешить установку из неизвестных источников
3. Открой `.apk` → Установить

---

## Структура проекта

```
horizon-apk/
├── App.tsx                    ← Точка входа, навигация, шрифты
├── app.json                   ← Expo конфиг
├── package.json               ← Зависимости
├── src/
│   ├── types.ts               ← TypeScript типы
│   ├── theme.ts               ← 8 тем оформления
│   ├── storage.ts             ← AsyncStorage обёртка
│   ├── helpers.ts             ← Вычисления (streak, PR, score...)
│   ├── data.ts                ← Планы, константы, AI провайдеры
│   ├── AppContext.tsx          ← Глобальный state + React Context
│   ├── components/
│   │   ├── index.tsx          ← Btn, Card, Lbl, Badge, Ring, ProgressBar
│   │   └── ThemePickerModal.tsx
│   └── screens/
│       ├── OnboardingScreen.tsx
│       ├── DashboardScreen.tsx  ← Главная с инсайтами, тепловой картой
│       ├── WorkoutScreen.tsx    ← Тренировки с нампадом, таймером
│       ├── TasksScreen.tsx      ← Задачи и цели с прогнозом
│       ├── NutritionScreen.tsx  ← Трекер питания
│       ├── JournalScreen.tsx    ← Дневник + замеры тела
│       ├── MentorScreen.tsx     ← НЕЙРО AI чат (Claude/Gemini/GPT)
│       └── StatsScreen.tsx      ← Статистика, достижения, профиль
```

---

## Добавление иконки

Замени файлы в `assets/`:
- `icon.png` — 1024×1024 PNG
- `adaptive-icon.png` — 1024×1024 PNG (foreground)
- `splash.png` — 1242×2436 PNG

Используй: https://www.appicon.co

---

## Что работает из коробки

- ✅ Claude AI (встроен, без ключа)
- ✅ AsyncStorage (данные сохраняются на устройстве)
- ✅ 8 тем оформления
- ✅ Все 7 экранов навигации
- ✅ Haptics (вибрация) в таймере отдыха
- ✅ Onboarding при первом запуске
- ✅ Wake Lock во время тренировки

## Что нужно добавить для полной версии

- [ ] Google/OpenAI/Groq ключи (вводятся в настройках НЕЙРО)
- [ ] `assets/icon.png` — своя иконка
- [ ] `eas.json` — для EAS сборки
- [ ] Push уведомления (expo-notifications, требует EAS)

---

## Важные зависимости

| Пакет | Назначение |
|-------|-----------|
| `@react-navigation` | Навигация с вкладками |
| `@react-native-async-storage` | Хранение данных |
| `expo-font` | Barlow Condensed + Barlow |
| `expo-haptics` | Вибрация в таймере |
| `expo-notifications` | Напоминания |
| `react-native-svg` | Графики (Ring, BarChart, LineChart) |
| `lucide-react-native` | Иконки |
