# История изменений — ГОРИЗОНТ Life Tracker

## [4.1.0] — 2026-06-25

### 🐛 Bugfixes

#### Критический фикс будильника
- **Уведомления после удаления приложения.** Все ID уведомлений теперь имеют
  префикс `hz-alarm-` (будильники) и `hz-snooze-` (отложенные). На каждом старте
  приложения запускается self-healing: orphaned-уведомления (те, что не
  соответствуют ни одному активному будильнику в хранилище) отменяются.
- **Уведомления после удаления будильника.** `deleteAlarm` теперь ожидает
  завершения `cancelAlarmById` перед удалением записи из стейта — раньше
  асинхронная отмена могла не успеть выполниться до перерисовки.
- **Snooze/Stop не работали, если экран будильника не открыт.** Background и
  foreground event handlers теперь регистрируются один раз на старте приложения
  (в `App.tsx` + `AppContext.tsx`), а не в `useEffect` экрана.
- **Восстановление после переустановки / Android Auto Backup.** При первом
  запуске новой версии приложения вызывается `purgeAllAlarms()`, а затем
  `syncAlarmsWithSystem()` перепланирует все активные будильники из хранилища.
- **Cancel теперь атомарный.** `cancelAlarmById` отменяет и one-shot ID, и все
  weekday-варианты (`hz-alarm-{id}-d{n}`), и любой snooze — в одном вызове,
  через `getTriggerNotificationIds()` + `getDisplayedNotifications()`.

#### Другие фиксы
- Исправлен TS-error в DashboardScreen: `todayJournal` использовался до
  объявления в `useState`-инициализаторах.
- Убраны `circularIcon: 'ic_launcher'` поля, отсутствующие в типах Notifee.
- `AuthorizationStatus.UNDETERMINED` → `NOT_DETERMINED` (правильное имя enum'а).

### ✨ Новые функции

#### Будильник
- **«Проверить сигнал»** — кнопка в AlarmScreen запускает тестовый сигнал через
  10 секунд. Удобно проверить звук и вибрацию без необходимости ждать.
- **«Сбросить все уведомления»** — panic-кнопка, отменяющая все уведомления с
  префиксом `hz-alarm-` / `hz-snooze-`. Полезна когда зависшие уведомления всё
  же приходят.
- **«Синхронизировать»** (иконка в шапке) — ручной запуск
  `syncAlarmsWithSystem()`.
- **Превью следующего будильника** на главном экране и в шапке AlarmScreen:
  «через 5 ч 23 мин».
- **Диагностическая карточка** в AlarmScreen с пошаговой инструкцией, что
  делать, если будильник не работает.

#### Дашборд
- **Карточка «Следующий будильник»** под цитатой — тапаемая, ведёт на экран
  будильника.

#### Профиль
- **Экспорт данных в JSON.** Кнопка в StatsScreen → Профиль сохраняет полное
  состояние приложения в `horizon-backup-YYYY-MM-DD.json` через системный
  share-sheet (expo-sharing + expo-file-system).

#### Onboarding
- Добавлен 3-й шаг «Будильник и привычки» с превью категорий будильника.

### 🎨 UI / UX

#### Компоненты (`src/components/index.tsx`)
- **`Btn`** — minHeight 48 (было 44), добавлены props `size` ('sm'|'md'|'lg'),
  `icon`, `fullWidth`, улучшены disabled/focus states, hitSlop 6.
- **`IconBtn`** — новый компонент: круглая 44×44 кнопка-иконка с правильным
  hitSlop.
- **`Card`** — добавлены props `elevated` (тень) и `padding` override.
- **`SectionHeader`** — добавлен optional `subtitle`.
- **`EmptyState`** — добавлены optional `actionLabel` + `onAction` для кнопки
  действия.
- **`Sheet`** — новый компонент-обёртка для bottom-sheet модалок с учётом
  safe-area, тёмным оверлеем и «грабером» сверху.

#### AlarmScreen
- Переписан полностью: лучший time-picker с hitSlop'ами, скроллящаяся модалка
  на маленьких экранах, sticky-бар «Отмена / Сохранить» внизу, быстрые пресеты
  времени расширены (6:00, 6:30, 7:00, 7:30, 8:00, 9:00).
- Все тач-зоны ≥ 44×44.
- Padding'и, border-radius'ы и типографика приведены к единой системе.

#### StatsScreen → Профиль
- Высота кнопок 48 (было 44), border-radius 12 (было 10), border-width 1.5
  (было 1) — лучше попадание пальцем, визуально чётче.

### 🏗 Архитектура

#### `src/alarm.ts` — полностью переписан
- Единый источник правды для расписания будильников.
- Все ID детерминированы и префиксированы.
- 4 публичные self-healing функции:
  - `syncAlarmsWithSystem(alarms)` — отменяет orphaned + перепланирует active.
  - `cleanupOrphanedAlarms(alarms)` — только отмена orphaned.
  - `purgeAllAlarms()` — отмена всех уведомлений приложения.
  - `scheduleTestAlarm(seconds)` — тестовый сигнал.
- `nextAlarmPreview(alarms)` — возвращает `{alarm, msUntil, label}` для UI.
- `ensureAlarmHandlersRegistered()` — идемпотентная регистрация foreground +
  background handlers.

#### `src/AppContext.tsx`
- На старте: `initAlarmChannel()` → `ensureAlarmHandlersRegistered()` →
  `checkAndMarkVersionUpgrade()` → (если upgrade) `purgeAllAlarms()` →
  `syncAlarmsWithSystem(state.alarms)`.
- Добавлены `resyncAlarms`, `purgeAlarms`, `exportData` в контекст — доступны
  из любого экрана.
- `stateRef` для доступа к свежему стейту в колбэках без перерегистрации.

#### `src/storage.ts`
- Добавлена `checkAndMarkVersionUpgrade()` — возвращает `true` при первом
  запуске новой версии. Используется для запуска cleanup-логики.
- Добавлена константа `APP_VERSION = '4.1.0'`.

#### `app.json`
- Версия `4.1.0`, `versionCode` 5.
- Добавлены permissions: `SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM`,
  `RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK`, `FOREGROUND_SERVICE` — критично для
  работы будильника на Android 12+ и после перезагрузки устройства.
- Добавлен плагин `@notifee/react-native` с конфигурацией канала
  `horizon-alarms`.

#### `tsconfig.json` (новый)
- Корректная конфигурация TypeScript для Expo-проекта: `module: esnext`,
  `jsx: react-native`, `skipLibCheck`, `esModuleInterop`.
- Раньше tsc не запускался вовсе — теперь можно ловить ошибки до сборки.

### 📦 Зависимости
- Без новых runtime-зависимостей. Используются уже подключённые
  `expo-sharing` и `expo-file-system` для экспорта JSON.

### 📝 Совместимость
- Expo SDK 51, React Native 0.74.5 — без изменений.
- Android API 21+, iOS 13+.
- Существующие данные пользователя сохраняются и мигрируются автоматически.

---

## [4.0.0] — Initial release
- Базовый life-tracker с 9 экранами, 8 темами, AI-чатом, будильником на Notifee.
