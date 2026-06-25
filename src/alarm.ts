// src/alarm.ts — Notifee-based alarm helpers (v4.1 — rewritten for reliability)
//
// KEY FIXES vs v4.0:
//   1. ALL notification IDs are prefixed with `hz-alarm-` and snoozes with `hz-snooze-`.
//      This lets us reliably identify OUR notifications and clean up everything else
//      that doesn't belong to a current alarm ("orphan" cleanup — fixes the bug where
//      notifications keep firing after the alarm is deleted or the app is reinstalled).
//   2. `syncAlarmsWithSystem()` runs on app launch: cancels orphaned notifications
//      and reschedules every enabled alarm so the schedule is always consistent
//      with what's in AsyncStorage. This survives Android Auto Backup restores,
//      app reinstalls, OS upgrades, and OEM battery-killer reboots.
//   3. `purgeAllAlarms()` wipes every notification whose ID starts with our prefix —
//      used on version upgrades and as a panic button in the UI.
//   4. `cancelAlarm` is now atomic: cancels the base ID + every weekday variant +
//      every snooze, all in one pass.
//   5. `scheduleAlarm` always sets an explicit `id` on every createTriggerNotification
//      call (single AND weekday variants) so we can cancel them deterministically.
//   6. Background event handler registered once at module load — no more reliance on
//      the screen component being mounted for snooze/stop actions to work.
import notifee, {
  TriggerType,
  RepeatFrequency,
  AndroidImportance,
  AndroidVisibility,
  AndroidCategory,
  EventType,
  AuthorizationStatus,
} from '@notifee/react-native';
import { Alarm } from './types';

// ── Channel + ID prefixes ───────────────────────────────────────────────────
export const CHANNEL_ID = 'horizon-alarms';
const ALARM_PREFIX = 'hz-alarm-';
const SNOOZE_PREFIX = 'hz-snooze-';

// ── Channel init ────────────────────────────────────────────────────────────
export async function initAlarmChannel(): Promise<void> {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Будильники ГОРИЗОНТ',
    description: 'Уведомления будильника приложения ГОРИЗОНТ',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
    vibrationPattern: [300, 500, 300, 500],
    lights: true,
    lightColor: '#FFD600',
    visibility: AndroidVisibility.PUBLIC,
    bypassDnd: true,
  });
}

// ── Permissions ─────────────────────────────────────────────────────────────
export async function requestAlarmPermissions(): Promise<boolean> {
  try {
    const settings = await notifee.requestPermission();
    return (
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.NOT_DETERMINED
    );
  } catch (e) {
    console.error('requestAlarmPermissions error:', e);
    return false;
  }
}

// Notifee's TS types don't include `canScheduleExactAlarms` / `openAlarmPermissionSettings`
// (they were added in a later version), so we go through a typed-escape hatch.
const NotifeeModule = notifee as any;

export async function canScheduleExactAlarms(): Promise<boolean> {
  try {
    if (typeof NotifeeModule.canScheduleExactAlarms === 'function') {
      return await NotifeeModule.canScheduleExactAlarms();
    }
  } catch (e) {
    /* ignore — older Android */
  }
  return true;
}

export async function openAlarmPermissionSettings(): Promise<void> {
  try {
    if (typeof NotifeeModule.openAlarmPermissionSettings === 'function') {
      await NotifeeModule.openAlarmPermissionSettings();
      return;
    }
  } catch (e) { /* ignore */ }
  try { await notifee.openNotificationSettings(); } catch (e) { /* ignore */ }
}

// ── Time helpers ────────────────────────────────────────────────────────────
function getTriggerTimestamp(hour: number, minute: number): number {
  const now = new Date();
  const trigger = new Date();
  trigger.setHours(hour, minute, 0, 0);
  if (trigger <= now) trigger.setDate(trigger.getDate() + 1);
  return trigger.getTime();
}

function getNextWeekdayTrigger(hour: number, minute: number, targetDay: number): number {
  const now = new Date();
  const trigger = new Date();
  trigger.setHours(hour, minute, 0, 0);
  const currentDay = now.getDay(); // 0=Sun..6=Sat
  let daysUntil = targetDay - currentDay;
  if (daysUntil < 0) daysUntil += 7;
  if (daysUntil === 0 && trigger <= now) daysUntil += 7;
  trigger.setDate(trigger.getDate() + daysUntil);
  return trigger.getTime();
}

// ── ID helpers ──────────────────────────────────────────────────────────────
// Public — used by the screen so it can also build preview strings.
export function alarmNotificationId(alarmId: string): string {
  return `${ALARM_PREFIX}${alarmId}`;
}
export function alarmDayNotificationId(alarmId: string, day: number): string {
  return `${ALARM_PREFIX}${alarmId}-d${day}`;
}
export function snoozeNotificationId(alarmId: string): string {
  return `${SNOOZE_PREFIX}${alarmId}`;
}

// ── Schedule ────────────────────────────────────────────────────────────────
export async function scheduleAlarm(alarm: Alarm): Promise<string | null> {
  try {
    const hasPermission = await requestAlarmPermissions();
    if (!hasPermission) return null;

    // Always cancel previous schedule for this alarm first (idempotent).
    await cancelAlarmById(alarm.id);

    const baseAndroid = {
      channelId: CHANNEL_ID,
      sound: 'default',
      importance: AndroidImportance.HIGH,
      pressAction: { id: 'default' },
      fullScreenAction: { id: 'default' },
      category: AndroidCategory.ALARM,
      vibrationPattern: alarm.vibrate ? [300, 500, 300, 500, 300, 500] : [0, 500, 200, 500, 200, 500],
      actions: [
        { title: '⏰ Отложить 10 мин', pressAction: { id: 'snooze' } },
        { title: '✓ Остановить', pressAction: { id: 'stop' } },
      ],
      color: '#FFD600',
    };

    if (alarm.days.length === 0) {
      // One-shot alarm
      const notifId = alarmNotificationId(alarm.id);
      await notifee.createTriggerNotification(
        {
          id: notifId,
          title: `⏰ ${alarm.label || 'Будильник'}`,
          body: `${String(alarm.hour).padStart(2, '0')}:${String(alarm.minute).padStart(2, '0')}`,
          android: baseAndroid,
          data: {
            alarmId: alarm.id,
            type: 'alarm',
            label: alarm.label || '',
            hour: String(alarm.hour),
            minute: String(alarm.minute),
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: getTriggerTimestamp(alarm.hour, alarm.minute),
          alarmManager: { allowWhileIdle: true },
        }
      );
      return notifId;
    }

    // Repeating weekday alarm — one notification per selected day
    for (const day of alarm.days) {
      const dayId = alarmDayNotificationId(alarm.id, day);
      await notifee.createTriggerNotification(
        {
          id: dayId,
          title: `⏰ ${alarm.label || 'Будильник'}`,
          body: `${String(alarm.hour).padStart(2, '0')}:${String(alarm.minute).padStart(2, '0')}`,
          android: baseAndroid,
          data: {
            alarmId: alarm.id,
            day: String(day),
            type: 'alarm',
            label: alarm.label || '',
            hour: String(alarm.hour),
            minute: String(alarm.minute),
          },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: getNextWeekdayTrigger(alarm.hour, alarm.minute, day),
          repeatFrequency: RepeatFrequency.WEEKLY,
          alarmManager: { allowWhileIdle: true },
        }
      );
    }
    return alarmNotificationId(alarm.id);
  } catch (e) {
    console.error('scheduleAlarm error:', e);
    return null;
  }
}

// ── Cancel ──────────────────────────────────────────────────────────────────
export async function cancelAlarmById(alarmId: string): Promise<void> {
  try {
    // Cancel the one-shot ID, every weekday variant, and any snooze.
    // We iterate over getTriggerNotificationIds() so we don't miss anything
    // (handles the case where the alarm's day-set was changed between schedules).
    const triggers = await notifee.getTriggerNotificationIds();
    const baseId = alarmNotificationId(alarmId);
    const dayPrefix = `${ALARM_PREFIX}${alarmId}-d`;
    const snoozeId = snoozeNotificationId(alarmId);
    const toCancel: string[] = [];
    for (const id of triggers) {
      if (id === baseId || id === snoozeId || id.startsWith(dayPrefix)) {
        toCancel.push(id);
      }
    }
    // Also cancel delivered notifications for the same IDs (in case the alarm
    // is currently firing / snoozed).
    toCancel.push(baseId, snoozeId);
    await Promise.all(toCancel.map(id => notifee.cancelNotification(id).catch(() => {})));
  } catch (e) {
    console.error('cancelAlarmById error:', e);
  }
}

// ── Self-healing: purge ALL alarms we own ──────────────────────────────────
// Used on version upgrades and as a panic button. Cancels every notification
// whose ID starts with `hz-alarm-` or `hz-snooze-`.
export async function purgeAllAlarms(): Promise<void> {
  try {
    const triggers = await notifee.getTriggerNotificationIds();
    const delivered = await notifee.getDisplayedNotifications();
    const deliveredIds = delivered.map(n => n.id).filter(Boolean) as string[];
    const allIds = [...new Set([...triggers, ...deliveredIds])];
    await Promise.all(
      allIds
        .filter(id => id.startsWith(ALARM_PREFIX) || id.startsWith(SNOOZE_PREFIX))
        .map(id => notifee.cancelNotification(id).catch(() => {}))
    );
  } catch (e) {
    console.error('purgeAllAlarms error:', e);
  }
}

// ── Self-healing: remove orphaned alarms ───────────────────────────────────
// Cancels every hz-alarm-* / hz-snooze-* notification that doesn't belong to
// a currently-enabled alarm in the supplied list.
export async function cleanupOrphanedAlarms(alarms: Alarm[]): Promise<void> {
  try {
    const validIds = new Set<string>();
    for (const a of alarms) {
      if (!a.enabled) continue;
      if (a.days.length === 0) {
        validIds.add(alarmNotificationId(a.id));
      } else {
        for (const d of a.days) validIds.add(alarmDayNotificationId(a.id, d));
      }
    }

    const triggers = await notifee.getTriggerNotificationIds();
    const delivered = await notifee.getDisplayedNotifications();
    const deliveredIds = delivered.map(n => n.id).filter(Boolean) as string[];
    const allIds = [...new Set([...triggers, ...deliveredIds])];

    const orphans = allIds.filter(id =>
      (id.startsWith(ALARM_PREFIX) || id.startsWith(SNOOZE_PREFIX)) && !validIds.has(id)
    );
    await Promise.all(orphans.map(id => notifee.cancelNotification(id).catch(() => {})));
  } catch (e) {
    console.error('cleanupOrphanedAlarms error:', e);
  }
}

// ── Self-healing: reschedule every enabled alarm ───────────────────────────
// Used on app launch to ensure the system schedule matches AsyncStorage state.
// Safe to call repeatedly — scheduleAlarm cancels the previous schedule first.
export async function syncAlarmsWithSystem(alarms: Alarm[]): Promise<void> {
  try {
    // 1) cancel orphaned notifications (alarms that were deleted, disabled, or
    //    survived an uninstall/reinstall via Android Auto Backup).
    await cleanupOrphanedAlarms(alarms);
    // 2) reschedule every enabled alarm so the schedule is always fresh.
    for (const a of alarms) {
      if (a.enabled) await scheduleAlarm(a);
    }
  } catch (e) {
    console.error('syncAlarmsWithSystem error:', e);
  }
}

// ── Foreground + background event handlers ─────────────────────────────────
// Registered ONCE at module load so snooze/stop work even if the AlarmScreen
// is not mounted (e.g. the user tapped the notification from another app).
let backgroundHandlerRegistered = false;
export function ensureAlarmHandlersRegistered(onStop?: (alarmId: string) => void) {
  if (backgroundHandlerRegistered) return;
  backgroundHandlerRegistered = true;

  // Background event — must be synchronous registration.
  try {
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.ACTION_PRESS || type === EventType.PRESS) {
        const actionId = detail.pressAction?.id;
        const alarmId = detail.notification?.data?.alarmId as string | undefined;
        if (!alarmId) return;
        if (actionId === 'stop') {
          await cancelAlarmById(alarmId);
        } else if (actionId === 'snooze') {
          await snoozeAlarm(
            alarmId,
            detail.notification?.data?.label as string | undefined,
            detail.notification?.data?.hour as string | undefined,
            detail.notification?.data?.minute as string | undefined,
          );
        }
      }
    });
  } catch (e) {
    console.error('onBackgroundEvent register error:', e);
  }

  // Foreground event — also registered once.
  try {
    notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.ACTION_PRESS || type === EventType.PRESS) {
        const actionId = detail.pressAction?.id;
        const alarmId = detail.notification?.data?.alarmId as string | undefined;
        if (!alarmId) return;
        if (actionId === 'stop') {
          cancelAlarmById(alarmId).catch(() => {});
          onStop?.(alarmId);
        } else if (actionId === 'snooze') {
          snoozeAlarm(
            alarmId,
            detail.notification?.data?.label as string | undefined,
            detail.notification?.data?.hour as string | undefined,
            detail.notification?.data?.minute as string | undefined,
          ).catch(() => {});
        }
      }
    });
  } catch (e) {
    console.error('onForegroundEvent register error:', e);
  }
}

// ── Snooze helper ──────────────────────────────────────────────────────────
export async function snoozeAlarm(
  alarmId: string,
  label?: string,
  hour?: string,
  minute?: string,
  minutesFromNow = 10,
): Promise<void> {
  try {
    // Cancel the firing notification and any existing snooze for this alarm.
    await notifee.cancelNotification(alarmNotificationId(alarmId)).catch(() => {});
    await notifee.cancelNotification(snoozeNotificationId(alarmId)).catch(() => {});

    const snoozeTime = Date.now() + minutesFromNow * 60 * 1000;
    const h = hour ?? '7';
    const m = minute ?? '0';
    const lbl = label || 'Будильник';

    await notifee.createTriggerNotification(
      {
        id: snoozeNotificationId(alarmId),
        title: `⏰ ${lbl} (отложено)`,
        body: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
        android: {
          channelId: CHANNEL_ID,
          sound: 'default',
          importance: AndroidImportance.HIGH,
          pressAction: { id: 'default' },
          fullScreenAction: { id: 'default' },
          category: AndroidCategory.ALARM,
          vibrationPattern: [300, 500, 300, 500],
          actions: [
            { title: '⏰ Ещё 10 мин', pressAction: { id: 'snooze' } },
            { title: '✓ Остановить', pressAction: { id: 'stop' } },
          ],
          color: '#FFD600',
        },
        data: { alarmId, type: 'alarm', snoozed: 'true', label: lbl, hour: h, minute: m },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: snoozeTime,
        alarmManager: { allowWhileIdle: true },
      }
    );
  } catch (e) {
    console.error('snoozeAlarm error:', e);
  }
}

// ── Quick test alarm (rings in N seconds) ──────────────────────────────────
// Used by the "Проверить сигнал" button in the UI so the user can verify
// sound + vibration without waiting for the actual alarm time.
export async function scheduleTestAlarm(secondsFromNow = 10): Promise<string | null> {
  try {
    const hasPermission = await requestAlarmPermissions();
    if (!hasPermission) return null;
    const id = `${SNOOZE_PREFIX}test-${Date.now()}`;
    await notifee.createTriggerNotification(
      {
        id,
        title: '🔔 Тест будильника',
        body: 'Проверка звука и вибрации',
        android: {
          channelId: CHANNEL_ID,
          sound: 'default',
          importance: AndroidImportance.HIGH,
          pressAction: { id: 'default' },
          category: AndroidCategory.ALARM,
          vibrationPattern: [300, 500, 300, 500],
          actions: [{ title: '✓ Остановить', pressAction: { id: 'stop' } }],
          color: '#FFD600',
        },
        data: { type: 'test' },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: Date.now() + secondsFromNow * 1000,
        alarmManager: { allowWhileIdle: true },
      }
    );
    return id;
  } catch (e) {
    console.error('scheduleTestAlarm error:', e);
    return null;
  }
}

// ── Misc ────────────────────────────────────────────────────────────────────
export const ALARM_SOUNDS = [
  { id: 'default', label: 'По умолчанию', file: 'default' },
  { id: 'twilight', label: 'Тревога', file: 'twilight' },
  { id: 'chime', label: 'Колокольчик', file: 'chime' },
] as const;

export type AlarmSoundId = 'default' | 'twilight' | 'chime';

// ── "Next alarm" preview helper ────────────────────────────────────────────
// Returns a human-readable string like "через 5 ч 23 мин" or null if no
// enabled alarm is scheduled in the next 7 days.
export function nextAlarmPreview(alarms: Alarm[]): { alarm: Alarm; msUntil: number; label: string } | null {
  const now = Date.now();
  let best: { alarm: Alarm; msUntil: number } | null = null;
  for (const a of alarms) {
    if (!a.enabled) continue;
    if (a.days.length === 0) {
      const ts = getTriggerTimestamp(a.hour, a.minute);
      const ms = ts - now;
      if (!best || ms < best.msUntil) best = { alarm: a, msUntil: ms };
    } else {
      for (const d of a.days) {
        const ts = getNextWeekdayTrigger(a.hour, a.minute, d);
        const ms = ts - now;
        if (!best || ms < best.msUntil) best = { alarm: a, msUntil: ms };
      }
    }
  }
  if (!best) return null;
  return { ...best, label: formatMsUntil(best.msUntil) };
}

function formatMsUntil(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `через ${days} д ${hours} ч`;
  if (hours > 0) return `через ${hours} ч ${mins} мин`;
  return `через ${mins} мин`;
}
