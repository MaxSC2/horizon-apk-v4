// src/alarm.ts — Notifee-based alarm helpers
import notifee, {
  TriggerType,
  RepeatFrequency,
  AndroidImportance,
  AndroidVisibility,
  EventType,
  AuthorizationStatus,
} from '@notifee/react-native';
import { Alarm } from './types';

const CHANNEL_ID = 'horizon-alarms';

export async function initAlarmChannel(): Promise<void> {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Будильники',
    description: 'Уведомления будильника приложения ГОРИЗОНТ',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
    vibrationPattern: [300, 500, 300, 500],
    lights: true,
    lightColor: '#FFD600',
    visibility: AndroidVisibility.PUBLIC,
    // fullScreenAction позволяет открыть приложение при сигнале
    bypassDnd: true,
  });
}

export async function requestAlarmPermissions(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return (
    settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.UNDETERMINED
  );
}

function getTriggerTimestamp(hour: number, minute: number): number {
  const now = new Date();
  const trigger = new Date();
  trigger.setHours(hour, minute, 0, 0);
  if (trigger <= now) {
    trigger.setDate(trigger.getDate() + 1);
  }
  return trigger.getTime();
}

export async function scheduleAlarm(alarm: Alarm): Promise<string | null> {
  try {
    const hasPermission = await requestAlarmPermissions();
    if (!hasPermission) {
      return null;
    }

    // Cancel existing notifications for this alarm
    await cancelAlarmById(alarm.id);

    const triggerTimestamp = getTriggerTimestamp(alarm.hour, alarm.minute);

    // If no repeat days, schedule single alarm
    if (alarm.days.length === 0) {
      const notificationId = await notifee.createTriggerNotification(
        {
          id: alarm.id,
          title: `⏰ ${alarm.label || 'Будильник'}`,
          body: `${String(alarm.hour).padStart(2, '0')}:${String(alarm.minute).padStart(2, '0')}`,
          android: {
            channelId: CHANNEL_ID,
            sound: alarm.soundId || 'default',
            importance: AndroidImportance.HIGH,
            pressAction: { id: 'default' },
            fullScreenAction: { id: 'default' },
            category: 'alarm',
            vibrationPattern: alarm.vibrate ? [300, 500, 300, 500] : undefined,
            circularIcon: 'ic_launcher',
            color: '#FFD600',
          },
          data: { alarmId: alarm.id, type: 'alarm' },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: triggerTimestamp,
          alarmManager: { allowWhileIdle: true },
        }
      );
      return notificationId;
    }

    // Schedule weekly alarm for each selected day
    for (const day of alarm.days) {
      const weeklyTrigger = getNextWeekdayTrigger(alarm.hour, alarm.minute, day);
      await notifee.createTriggerNotification(
        {
          title: `⏰ ${alarm.label || 'Будильник'}`,
          body: `${String(alarm.hour).padStart(2, '0')}:${String(alarm.minute).padStart(2, '0')}`,
          android: {
            channelId: CHANNEL_ID,
            sound: alarm.soundId || 'default',
            importance: AndroidImportance.HIGH,
            pressAction: { id: 'default' },
            fullScreenAction: { id: 'default' },
            category: 'alarm',
            vibrationPattern: alarm.vibrate ? [300, 500, 300, 500] : undefined,
            circularIcon: 'ic_launcher',
            color: '#FFD600',
          },
          data: { alarmId: alarm.id, day: String(day), type: 'alarm' },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: weeklyTrigger,
          repeatFrequency: RepeatFrequency.WEEKLY,
          alarmManager: { allowWhileIdle: true },
        }
      );
    }

    return alarm.id;
  } catch (e) {
    console.error('scheduleAlarm error:', e);
    return null;
  }
}

function getNextWeekdayTrigger(hour: number, minute: number, targetDay: number): number {
  const now = new Date();
  const trigger = new Date();
  trigger.setHours(hour, minute, 0, 0);

  const currentDay = now.getDay(); // 0=Sun
  let daysUntil = targetDay - currentDay;
  if (daysUntil < 0) daysUntil += 7;
  if (daysUntil === 0 && trigger <= now) daysUntil += 7;

  trigger.setDate(trigger.getDate() + daysUntil);
  return trigger.getTime();
}

export async function cancelAlarmById(alarmId: string): Promise<void> {
  try {
    await notifee.cancelNotification(alarmId);
    // Also cancel all triggers for this alarm's weekdays
    const triggers = await notifee.getTriggerNotificationIds();
    for (const id of triggers) {
      if (id.startsWith(alarmId)) {
        await notifee.cancelNotification(id);
      }
    }
  } catch (e) {
    // Ignore
  }
}

export async function cancelAllAlarms(): Promise<void> {
  await notifee.cancelAllNotifications();
}

// Foreground event handler
export function setupAlarmForegroundHandler(onAlarmPress: (alarmId: string) => void) {
  return notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
      const alarmId = detail.notification?.data?.alarmId as string;
      if (alarmId) {
        onAlarmPress(alarmId);
      }
    }
  });
}

// Background handler — set in index.js or app entry
export async function setupBackgroundHandler() {
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.TriggerNotification || type === EventType.PRESS) {
      const alarmId = detail.notification?.data?.alarmId as string;
      if (alarmId) {
        // Could show full-screen UI here
        console.log('Alarm triggered:', alarmId);
      }
    }
  });
}

// Available alarm sounds on Android
export const ALARM_SOUNDS = [
  { id: 'default', label: 'По умолчанию', file: 'default' },
  { id: 'twilight', label: 'Тревога', file: 'twilight' },
  { id: 'chime', label: 'Колокольчик', file: 'chime' },
];

// Trigger types
export type AlarmSoundId = 'default' | 'twilight' | 'chime';
