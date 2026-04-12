// src/screens/AlarmScreen.tsx — Полноценный будильник на Notifee
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Pressable, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, X, Check } from 'lucide-react-native';
import { useApp } from '../AppContext';
import { Card, Lbl, ProgressBar } from '../components';
import { uid, TODAY, fmtSleep } from '../helpers';

// Notifee alarm integration
// Установить: npx expo install @notifee/react-native
// Или: yarn add @notifee/react-native
import notifee, {
  TriggerType,
  RepeatFrequency,
  AndroidImportance,
  AndroidVisibility,
  EventType,
  AuthorizationStatus,
} from '@notifee/react-native';

const CHANNEL_ID = 'horizon-alarms';

interface Alarm {
  id: string;
  hour: number;
  minute: number;
  label: string;
  days: number[]; // 0=Sun..6=Sat, empty = once
  enabled: boolean;
  notifId?: string;
  vibrate: boolean;
  smartWake: boolean;
  category: 'wake' | 'workout' | 'meal' | 'meds' | 'custom';
  soundId: 'default' | 'twilight' | 'chime';
}

const DAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const DAYS_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

const CATEGORY_INFO: Record<string, { emoji: string; label: string; color: string }> = {
  wake:    { emoji: '🌅', label: 'Подъём', color: '#FFD600' },
  workout: { emoji: '💪', label: 'Тренировка', color: '#00C4F0' },
  meal:    { emoji: '🍽️', label: 'Приём пищи', color: '#00E676' },
  meds:    { emoji: '💊', label: 'Лекарство', color: '#FF4455' },
  custom:  { emoji: '🔔', label: 'Другое', color: '#C77DFF' },
};

const SOUND_OPTIONS: { id: Alarm['soundId']; label: string; emoji: string }[] = [
  { id: 'default', label: 'По умолчанию', emoji: '🔔' },
  { id: 'twilight', label: 'Тревога', emoji: '🚨' },
  { id: 'chime', label: 'Колокольчик', emoji: '🎵' },
];

async function initAlarmChannel(): Promise<void> {
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
    bypassDnd: true,
  });
}

async function checkExactAlarmPermission(): Promise<boolean> {
  try {
    if (typeof notifee.canScheduleExactAlarms === 'function') {
      const canSchedule = await notifee.canScheduleExactAlarms();
      if (!canSchedule) {
        Alert.alert(
          '⚠️ Разрешение не получено',
          'Для работы будильника нужно разрешение на Android 12+.\n\nНажмите "Открыть настройки" и включите "Будильники и напоминания".',
          [
            { text: 'Отмена', style: 'cancel' },
            { 
              text: 'Открыть настройки', 
              onPress: async () => {
                try {
                  if (typeof (notifee as any).openAlarmPermissionSettings === 'function') {
                    await (notifee as any).openAlarmPermissionSettings();
                  }
                } catch (e) {
                  // Fallback: try to open app settings
                  try {
                    await notifee.openNotificationSettings();
                  } catch (e2) {}
                }
              }
            },
          ]
        );
        return false;
      }
    }
  } catch (e) {
    // Ignore if function doesn't exist
  }
  return true;
}

async function requestPermissions(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return (
    settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.UNDETERMINED
  );
}

function getNextTriggerTime(hour: number, minute: number): number {
  const now = new Date();
  const trigger = new Date();
  trigger.setHours(hour, minute, 0, 0);
  if (trigger <= now) {
    trigger.setDate(trigger.getDate() + 1);
  }
  return trigger.getTime();
}

function getNextWeekdayTrigger(hour: number, minute: number, targetDay: number): number {
  const now = new Date();
  const trigger = new Date();
  trigger.setHours(hour, minute, 0, 0);
  const currentDay = now.getDay();
  let daysUntil = targetDay - currentDay;
  if (daysUntil < 0) daysUntil += 7;
  if (daysUntil === 0 && trigger <= now) daysUntil += 7;
  trigger.setDate(trigger.getDate() + daysUntil);
  return trigger.getTime();
}

async function scheduleAlarm(alarm: Alarm): Promise<string | null> {
  try {
    const granted = await requestPermissions();
    if (!granted) {
      Alert.alert('Нет разрешения', 'Для будильника нужно разрешение на уведомления');
      return null;
    }

    // Check exact alarm permission (Android 12+)
    const exactAllowed = await checkExactAlarmPermission();
    if (!exactAllowed) return null;

    await cancelAlarm(alarm.id);

    if (alarm.days.length === 0) {
      const triggerTime = getNextTriggerTime(alarm.hour, alarm.minute);
      const notificationId = await notifee.createTriggerNotification(
        {
          id: alarm.id,
          title: `⏰ ${alarm.label}`,
          body: `${String(alarm.hour).padStart(2, '0')}:${String(alarm.minute).padStart(2, '0')}`,
          android: {
            channelId: CHANNEL_ID,
            sound: 'default',
            importance: AndroidImportance.HIGH,
            pressAction: { id: 'default' },
            fullScreenAction: { id: 'default' },
            vibrationPattern: alarm.vibrate ? [300, 500, 300, 500, 300, 500] : [0, 500, 200, 500, 200, 500],
            actions: [
              { title: '⏰ Отложить 10 мин', pressAction: { id: 'snooze' } },
              { title: '✓ Остановить', pressAction: { id: 'stop' } },
            ],
          },
          data: { alarmId: alarm.id, type: 'alarm' },
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp: triggerTime,
          alarmManager: { allowWhileIdle: true },
        }
      );
      return notificationId;
    } else {
      // Schedule individual notification for each selected day
      const ids: string[] = [];
      for (let i = 0; i < alarm.days.length; i++) {
        const day = alarm.days[i];
        const weeklyTrigger = getNextWeekdayTrigger(alarm.hour, alarm.minute, day);
        const dayId = `${alarm.id}-${day}`;
        const id = await notifee.createTriggerNotification(
          {
            id: dayId,
            title: `⏰ ${alarm.label}`,
            body: `${String(alarm.hour).padStart(2, '0')}:${String(alarm.minute).padStart(2, '0')}`,
            android: {
              channelId: CHANNEL_ID,
              sound: 'default',
              importance: AndroidImportance.HIGH,
              pressAction: { id: 'default' },
              fullScreenAction: { id: 'default' },
              vibrationPattern: alarm.vibrate ? [300, 500, 300, 500, 300, 500] : [0, 500, 200, 500, 200, 500],
              actions: [
                { title: '⏰ Отложить 10 мин', pressAction: { id: 'snooze' } },
                { title: '✓ Остановить', pressAction: { id: 'stop' } },
              ],
            },
            data: { alarmId: alarm.id, day: String(day), type: 'alarm' },
          },
          {
            type: TriggerType.TIMESTAMP,
            timestamp: weeklyTrigger,
            alarmManager: { allowWhileIdle: true },
          }
        );
        ids.push(id);
      }
      return ids[0] || alarm.id;
    }
  } catch (e) {
    console.error('scheduleAlarm error:', e);
    Alert.alert('Ошибка', 'Не удалось создать будильник');
    return null;
  }
}

async function cancelAlarm(alarmId: string): Promise<void> {
  try {
    await notifee.cancelNotification(alarmId);
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

function getSleepScore(journal: any[]) {
  const last14 = journal.filter((j: any) => (j.sleep || 0) > 0).slice(-14);
  if (last14.length < 3) return null;
  const avg = last14.reduce((s: number, j: any) => s + (j.sleep || 0), 0) / last14.length;
  const score = Math.min(100, Math.round((avg / 8) * 100));
  return { avg: avg.toFixed(1), score, entries: last14.length };
}

function AlarmAddModal({ T, onSave, onClose, initial }: { T: any; onSave: (a: Partial<Alarm>) => void; onClose: () => void; initial?: Alarm }) {
  const [hour, setHour] = useState(initial?.hour ?? 7);
  const [minute, setMinute] = useState(initial?.minute ?? 0);
  const [label, setLabel] = useState(initial?.label ?? '');
  const [days, setDays] = useState<number[]>(initial?.days ?? [1, 2, 3, 4, 5]);
  const [vibrate, setVibrate] = useState(initial?.vibrate ?? true);
  const [smartWake, setSmartWake] = useState(initial?.smartWake ?? false);
  const [category, setCategory] = useState<Alarm['category']>(initial?.category ?? 'wake');
  const [soundId, setSoundId] = useState<Alarm['soundId']>(initial?.soundId ?? 'default');
  const [hourInput, setHourInput] = useState(String(initial?.hour ?? 7).padStart(2, '0'));
  const [minuteInput, setMinuteInput] = useState(String(initial?.minute ?? 0).padStart(2, '0'));

  const toggleDay = (d: number) => setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort());
  const fmtTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  const commitHourInput = (v: string) => {
    const n = parseInt(v);
    if (!isNaN(n) && n >= 0 && n <= 23) setHour(n);
    setHourInput(String(hour).padStart(2, '0'));
  };

  const commitMinuteInput = (v: string) => {
    const n = parseInt(v);
    if (!isNaN(n) && n >= 0 && n <= 59) setMinute(n);
    setMinuteInput(String(minute).padStart(2, '0'));
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      {/* Full screen dark overlay */}
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.88)' }}>
        {/* Dark background - closes modal when pressed */}
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        
        {/* Modal content - stretches to bottom */}
        <View style={{ backgroundColor: T.surf, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: 20 }}>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 20 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 20, color: T.txt }}>
              {initial ? 'Изменить' : 'Новый'} будильник
            </Text>
            <TouchableOpacity onPress={onClose} style={{ width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: T.bord, backgroundColor: T.lo, alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} color={T.muted} />
            </TouchableOpacity>
          </View>

          {/* Time picker */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              {/* Hour */}
              <View style={{ alignItems: 'center', gap: 6 }}>
                <TouchableOpacity onPress={() => { setHour(h => (h + 1) % 24); setHourInput(String((hour + 1) % 24).padStart(2, '0')); }} style={{ width: 50, height: 36, borderRadius: 8, backgroundColor: T.lo, borderWidth: 1, borderColor: T.bord, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: T.muted, fontSize: 18 }}>▲</Text>
                </TouchableOpacity>
                <View style={{ width: 88, height: 80, borderRadius: 12, backgroundColor: T.lo, borderWidth: 2, borderColor: T.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <TextInput
                    value={hourInput}
                    onChangeText={setHourInput}
                    onEndEditing={e => commitHourInput(e.nativeEvent.text)}
                    onBlur={() => commitHourInput(hourInput)}
                    keyboardType="number-pad"
                    maxLength={2}
                    style={{ width: 80, textAlign: 'center', color: T.txt, fontFamily: 'BarlowCondensed_900Black', fontSize: 48, backgroundColor: 'transparent', padding: 0 }}
                  />
                </View>
                <TouchableOpacity onPress={() => { setHour(h => (h - 1 + 24) % 24); setHourInput(String((hour - 1 + 24) % 24).padStart(2, '0')); }} style={{ width: 50, height: 36, borderRadius: 8, backgroundColor: T.lo, borderWidth: 1, borderColor: T.bord, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: T.muted, fontSize: 18 }}>▼</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 52, color: T.txt, marginTop: -8 }}>:</Text>
              {/* Minute */}
              <View style={{ alignItems: 'center', gap: 6 }}>
                <TouchableOpacity onPress={() => { setMinute(m => (m + 5) % 60); setMinuteInput(String((minute + 5) % 60).padStart(2, '0')); }} style={{ width: 50, height: 36, borderRadius: 8, backgroundColor: T.lo, borderWidth: 1, borderColor: T.bord, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: T.muted, fontSize: 18 }}>▲</Text>
                </TouchableOpacity>
                <View style={{ width: 88, height: 80, borderRadius: 12, backgroundColor: T.lo, borderWidth: 2, borderColor: T.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <TextInput
                    value={minuteInput}
                    onChangeText={setMinuteInput}
                    onEndEditing={e => commitMinuteInput(e.nativeEvent.text)}
                    onBlur={() => commitMinuteInput(minuteInput)}
                    keyboardType="number-pad"
                    maxLength={2}
                    style={{ width: 80, textAlign: 'center', color: T.txt, fontFamily: 'BarlowCondensed_900Black', fontSize: 48, backgroundColor: 'transparent', padding: 0 }}
                  />
                </View>
                <TouchableOpacity onPress={() => setMinute(m => (m - 5 + 60) % 60)} style={{ width: 50, height: 36, borderRadius: 8, backgroundColor: T.lo, borderWidth: 1, borderColor: T.bord, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: T.muted, fontSize: 18 }}>▼</Text>
                </TouchableOpacity>
              </View>
            </View>
            {/* Quick times */}
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[[6, 0], [6, 30], [7, 0], [7, 30], [8, 0]].map(([h, m]) => (
                <TouchableOpacity key={`${h}${m}`} onPress={() => { setHour(h); setMinute(m); }}
                  style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: hour === h && minute === m ? T.primary : T.bord, backgroundColor: hour === h && minute === m ? T.primary + '22' : T.lo }}>
                  <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 12, color: hour === h && minute === m ? T.primary : T.muted }}>
                    {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sound selection */}
          <Lbl T={T} style={{ marginBottom: 8 }}>🔊 Мелодия</Lbl>
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
            {SOUND_OPTIONS.map(s => (
              <TouchableOpacity key={s.id} onPress={() => setSoundId(s.id)}
                style={{ flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: soundId === s.id ? T.primary : T.bord, backgroundColor: soundId === s.id ? T.primary + '22' : T.lo, alignItems: 'center' }}>
                <Text style={{ fontSize: 16, marginBottom: 2 }}>{s.emoji}</Text>
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 10, color: soundId === s.id ? T.primary : T.muted }}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Category */}
          <Lbl T={T} style={{ marginBottom: 8 }}>Категория</Lbl>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {(Object.entries(CATEGORY_INFO) as [Alarm['category'], typeof CATEGORY_INFO[string]][]).map(([k, v]) => (
              <TouchableOpacity key={k} onPress={() => setCategory(k)}
                style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1.5, borderColor: category === k ? v.color : T.bord, backgroundColor: category === k ? v.color + '22' : T.lo, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Text style={{ fontSize: 14 }}>{v.emoji}</Text>
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 12, color: category === k ? v.color : T.muted }}>{v.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Label */}
          <Lbl T={T} style={{ marginBottom: 6 }}>Название</Lbl>
          <TextInput value={label} onChangeText={setLabel} placeholder={CATEGORY_INFO[category].label} placeholderTextColor={T.muted}
            style={{ height: 40, borderRadius: 9, borderWidth: 1.5, borderColor: T.bord, backgroundColor: T.lo, color: T.txt, fontFamily: 'Barlow_400Regular', fontSize: 15, paddingHorizontal: 12, marginBottom: 14 }} />

          {/* Days */}
          <Lbl T={T} style={{ marginBottom: 8 }}>Повтор</Lbl>
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
            {DAYS.map((d, i) => (
              <TouchableOpacity key={i} onPress={() => toggleDay(i)}
                style={{ flex: 1, height: 38, borderRadius: 9, borderWidth: 1.5, borderColor: days.includes(i) ? T.primary : T.bord, backgroundColor: days.includes(i) ? T.primary + '22' : T.lo, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 12, color: days.includes(i) ? T.primary : T.muted }}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
            {[
              { l: 'Будни', d: [1, 2, 3, 4, 5] },
              { l: 'Выходные', d: [0, 6] },
              { l: 'Каждый', d: [0, 1, 2, 3, 4, 5, 6] },
              { l: 'Однажды', d: [] },
            ].map(p => (
              <TouchableOpacity key={p.l} onPress={() => setDays(p.d)}
                style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: JSON.stringify(days) === JSON.stringify(p.d) ? T.success : T.bord, backgroundColor: JSON.stringify(days) === JSON.stringify(p.d) ? T.success + '18' : T.lo }}>
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 11, color: JSON.stringify(days) === JSON.stringify(p.d) ? T.success : T.muted }}>{p.l}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Options */}
          <View style={{ borderBottomWidth: 1, borderBottomColor: T.bord, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 }}>
              <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 14, color: T.txt }}>📳 Вибрация</Text>
              <Switch value={vibrate} onValueChange={setVibrate} trackColor={{ false: T.bord, true: T.primary + '99' }} thumbColor={vibrate ? T.primary : T.muted} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 }}>
              <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 14, color: T.txt }}>🌙 Умный подъём</Text>
              <Switch value={smartWake} onValueChange={setSmartWake} trackColor={{ false: T.bord, true: T.primary + '99' }} thumbColor={smartWake ? T.primary : T.muted} />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
            <TouchableOpacity onPress={onClose} style={{ flex: 1, height: 44, borderRadius: 10, borderWidth: 1, borderColor: T.bord, backgroundColor: T.lo, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 14, color: T.muted }}>Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onSave({ hour, minute, label: label || CATEGORY_INFO[category].label, days, vibrate, smartWake, category, soundId })}
              style={{ flex: 2, height: 44, borderRadius: 10, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 15, color: '#000' }}>Сохранить {fmtTime}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function AlarmScreen() {
  const { state, setState, T } = useApp();
  const alarms: Alarm[] = (state as any).alarms || [];
  const [showAdd, setShowAdd] = useState(false);
  const [editAlarm, setEditAlarm] = useState<Alarm | null>(null);
  const [sub, setSub] = useState<'alarms' | 'analysis'>('alarms');

  useEffect(() => {
    initAlarmChannel().catch(console.error);

    const unsubscribe = notifee.onForegroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
        const actionId = detail.pressAction?.id;
        const alarmId = detail.notification?.data?.alarmId as string;
        const alarmData = detail.notification?.data as { label?: string; hour?: number; minute?: number } | undefined;
        
        if (actionId === 'stop') {
          await notifee.cancelNotification(alarmId);
          setAlarms(prev => prev.map(a => a.id === alarmId ? { ...a, enabled: false } : a));
        } else if (actionId === 'snooze') {
          await notifee.cancelNotification(alarmId);
          if (alarmData?.hour !== undefined && alarmData?.minute !== undefined) {
            const snoozeTime = Date.now() + 10 * 60 * 1000;
            await notifee.createTriggerNotification(
              {
                id: `snooze-${alarmId}`,
                title: `⏰ ${alarmData.label || 'Будильник'} (Отложено)`,
                body: `${String(alarmData.hour).padStart(2, '0')}:${String(alarmData.minute).padStart(2, '0')}`,
                android: {
                  channelId: CHANNEL_ID,
                  sound: 'default',
                  importance: AndroidImportance.HIGH,
                  pressAction: { id: 'default' },
                  fullScreenAction: { id: 'default' },
                  vibrationPattern: [300, 500, 300, 500],
                  actions: [
                    { title: '✓ Остановить', pressAction: { id: 'stop' } },
                  ],
                },
                data: { alarmId, type: 'alarm', snoozed: 'true', label: alarmData.label, hour: alarmData.hour, minute: alarmData.minute },
              },
              {
                type: TriggerType.TIMESTAMP,
                timestamp: snoozeTime,
                alarmManager: { allowWhileIdle: true },
              }
            );
          }
        } else if (alarmId) {
          await notifee.cancelNotification(alarmId);
        }
      }
    });

    return unsubscribe;
  }, []);

  const setAlarms = (fn: (a: Alarm[]) => Alarm[]) => {
    setState((s: any) => ({ ...s, alarms: fn(s.alarms || []) }));
  };

  const addAlarm = async (data: Partial<Alarm>) => {
    const alarm: Alarm = {
      id: uid(),
      enabled: true,
      hour: data.hour ?? 7,
      minute: data.minute ?? 0,
      label: data.label ?? 'Будильник',
      days: data.days ?? [1, 2, 3, 4, 5],
      vibrate: data.vibrate ?? true,
      smartWake: data.smartWake ?? false,
      category: data.category ?? 'wake',
      soundId: data.soundId ?? 'default',
    };

    const notifId = await scheduleAlarm(alarm);
    if (notifId) alarm.notifId = notifId;

    if (editAlarm) {
      setAlarms(prev => prev.map(a => a.id === editAlarm.id ? alarm : a));
    } else {
      setAlarms(prev => [...prev, alarm].sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute)));
    }
    setShowAdd(false);
    setEditAlarm(null);
  };

  const toggleAlarm = async (id: string) => {
    setAlarms(prev => prev.map(a => {
      if (a.id !== id) return a;
      const next = { ...a, enabled: !a.enabled };
      if (next.enabled) {
        scheduleAlarm(next).then(notifId => {
          if (notifId) setAlarms(p => p.map(x => x.id === id ? { ...x, notifId } : x));
        });
      } else {
        cancelAlarm(a.id);
      }
      return next;
    }));
  };

  const deleteAlarm = (id: string) => {
    cancelAlarm(id);
    setAlarms(prev => prev.filter(a => a.id !== id));
  };

  const sleepScore = useMemo(() => getSleepScore(state.journal || []), [state.journal]);
  const last7Sleep = (state.journal || []).filter((j: any) => (j.sleep || 0) > 0).slice(0, 7).reverse();
  const wakeAlarms = alarms.filter(a => a.category === 'wake' && a.enabled);
  const avgWakeHour = wakeAlarms.length ? wakeAlarms.reduce((s, a) => s + a.hour + a.minute / 60, 0) / wakeAlarms.length : null;

  const fmtAlarmTime = (a: Alarm) => `${String(a.hour).padStart(2, '0')}:${String(a.minute).padStart(2, '0')}`;
  const daysLabel = (days: number[]) => {
    if (!days.length) return 'Однажды';
    if (days.length === 7) return 'Каждый день';
    if (JSON.stringify(days) === JSON.stringify([1, 2, 3, 4, 5])) return 'Будни';
    if (JSON.stringify(days) === JSON.stringify([0, 6])) return 'Выходные';
    return days.map(d => DAYS_SHORT[d]).join(' ');
  };

  const groupedAlarms = useMemo(() => {
    const today = new Date();
    const todayDay = today.getDay();
    return alarms.map(a => {
      const nextDays = a.days.length === 0 ? 0 : (() => {
        for (let i = 0; i < 7; i++) {
          if (a.days.includes((todayDay + i) % 7)) {
            if (i === 0 && (a.hour * 60 + a.minute) > (today.getHours() * 60 + today.getMinutes())) return 0;
            if (i > 0) return i;
          }
        }
        return 7;
      })();
      return { ...a, nextDays };
    });
  }, [alarms]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={{ backgroundColor: T.surf, borderBottomWidth: 1, borderBottomColor: T.bord, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 22, color: T.txt, letterSpacing: 1 }}>⏰ Будильники</Text>
          <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 11, color: T.muted }}>{alarms.filter(a => a.enabled).length} активных</Text>
        </View>
        <TouchableOpacity onPress={() => setShowAdd(true)} style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={20} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', backgroundColor: T.surf, borderBottomWidth: 1, borderBottomColor: T.bord }}>
        {[
          { id: 'alarms' as const, l: '🔔 Будильники' },
          { id: 'analysis' as const, l: '📊 Анализ сна' },
        ].map(t => (
          <TouchableOpacity key={t.id} onPress={() => setSub(t.id)} style={{ flex: 1, paddingVertical: 11, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: sub === t.id ? T.primary : 'transparent' }}>
            <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: sub === t.id ? T.primary : T.muted }}>{t.l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        {sub === 'alarms' && (
          <>
            {alarms.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <Text style={{ fontSize: 56, marginBottom: 12 }}>⏰</Text>
                <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 22, color: T.txt, marginBottom: 6 }}>Нет будильников</Text>
                <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 14, color: T.muted, textAlign: 'center', marginBottom: 24, lineHeight: 21 }}>
                  Добавь будильник — подъём,{'\n'}тренировка или приём пищи
                </Text>
                <TouchableOpacity onPress={() => setShowAdd(true)} style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, backgroundColor: T.primary }}>
                  <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 16, color: '#000' }}>+ Добавить будильник</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {groupedAlarms.map(alarm => {
                  const cat = CATEGORY_INFO[alarm.category];
                  const sound = SOUND_OPTIONS.find(s => s.id === alarm.soundId) || SOUND_OPTIONS[0];
                  return (
                    <Card key={alarm.id} T={T} style={{ marginBottom: 10, opacity: alarm.enabled ? 1 : 0.5, borderLeftWidth: 4, borderLeftColor: alarm.enabled ? cat.color : T.bord }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <TouchableOpacity onPress={() => { setEditAlarm(alarm); setShowAdd(true); }} style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 5 }}>
                            <Text style={{ fontSize: 18 }}>{cat.emoji}</Text>
                            <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 38, color: alarm.enabled ? T.txt : T.muted, lineHeight: 42 }}>
                              {fmtAlarmTime(alarm)}
                            </Text>
                            {alarm.nextDays === 0 && alarm.enabled && (
                              <View style={{ paddingHorizontal: 7, paddingVertical: 2, backgroundColor: T.success + '22', borderRadius: 6, marginBottom: 6 }}>
                                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 11, color: T.success }}>СЕГОДНЯ</Text>
                              </View>
                            )}
                            {alarm.nextDays === 1 && alarm.enabled && (
                              <View style={{ paddingHorizontal: 7, paddingVertical: 2, backgroundColor: T.warn + '22', borderRadius: 6, marginBottom: 6 }}>
                                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 11, color: T.warn }}>ЗАВТРА</Text>
                              </View>
                            )}
                          </View>
                          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.muted }}>{alarm.label}</Text>
                            <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 11, color: T.muted }}>· {daysLabel(alarm.days)}</Text>
                            <Text style={{ fontSize: 10 }}>{sound.emoji}</Text>
                            {alarm.vibrate && <Text style={{ fontSize: 10 }}>📳</Text>}
                            {alarm.smartWake && <Text style={{ fontSize: 10 }}>🌙</Text>}
                          </View>
                        </TouchableOpacity>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Switch value={alarm.enabled} onValueChange={() => toggleAlarm(alarm.id)}
                            trackColor={{ false: T.bord, true: cat.color + '99' }} thumbColor={alarm.enabled ? cat.color : T.muted} />
                          <TouchableOpacity onPress={() => Alert.alert('Удалить?', `Будильник ${fmtAlarmTime(alarm)}`, [{ text: 'Отмена', style: 'cancel' }, { text: 'Удалить', style: 'destructive', onPress: () => deleteAlarm(alarm.id) }])} style={{ padding: 6 }}>
                            <X size={14} color={T.muted} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </Card>
                  );
                })}
                <TouchableOpacity onPress={() => setShowAdd(true)} style={{ height: 46, borderRadius: 12, borderWidth: 2, borderColor: T.bord, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  <Plus size={16} color={T.muted} />
                  <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 14, color: T.muted }}>Добавить будильник</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        {sub === 'analysis' && (
          <>
            <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 22, color: T.txt, marginBottom: 4 }}>Анализ сна</Text>
            <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.muted, marginBottom: 14 }}>Данные из дневника</Text>

            {!sleepScore ? (
              <Card T={T} style={{ alignItems: 'center', padding: 24 }}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>💤</Text>
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 16, color: T.txt, marginBottom: 6 }}>Нужно минимум 3 записи</Text>
                <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.muted, textAlign: 'center' }}>Записывай сон в дневнике</Text>
              </Card>
            ) : (
              <>
                <Card T={T} style={{ marginBottom: 12, backgroundColor: sleepScore.score >= 80 ? T.success + '10' : sleepScore.score >= 60 ? T.warn + '10' : T.danger + '10', borderWidth: 1, borderColor: sleepScore.score >= 80 ? T.success + '44' : sleepScore.score >= 60 ? T.warn + '44' : T.danger + '44' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <View>
                      <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 48, color: sleepScore.score >= 80 ? T.success : sleepScore.score >= 60 ? T.warn : T.danger, lineHeight: 52 }}>{sleepScore.score}</Text>
                      <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.muted }}>Sleep Score / 100</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 28, color: T.txt }}>{fmtSleep(sleepScore.avg)}</Text>
                      <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 12, color: T.muted }}>средний за {sleepScore.entries} дн.</Text>
                      <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 14, color: sleepScore.score >= 80 ? T.success : sleepScore.score >= 60 ? T.warn : T.danger, marginTop: 4 }}>
                        {sleepScore.score >= 80 ? '😴 Отлично' : sleepScore.score >= 60 ? '😐 Нормально' : '😰 Мало сна'}
                      </Text>
                    </View>
                  </View>
                  <ProgressBar pct={sleepScore.score} color={sleepScore.score >= 80 ? T.success : sleepScore.score >= 60 ? T.warn : T.danger} T={T} height={8} />
                </Card>

                <Card T={T} style={{ marginBottom: 12 }}>
                  <Lbl T={T} style={{ marginBottom: 12 }}>Последние ночи</Lbl>
                  {last7Sleep.map((entry: any, i) => {
                    const h = entry.sleep || 0;
                    const col = h >= 7 ? T.success : h >= 6 ? T.warn : T.danger;
                    const pct = Math.min((h / 9) * 100, 100);
                    return (
                      <View key={entry.id || i} style={{ marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.txt }}>
                            {new Date(entry.date + 'T12:00:00').toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </Text>
                          <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 14, color: col }}>{fmtSleep(h)}</Text>
                        </View>
                        <ProgressBar pct={pct} color={col} T={T} height={6} />
                      </View>
                    );
                  })}
                </Card>

                {wakeAlarms.length > 0 && (
                  <Card T={T} style={{ marginBottom: 12 }}>
                    <Lbl T={T} style={{ marginBottom: 10 }}>Анализ подъёма</Lbl>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 14, color: T.txt }}>Среднее время подъёма</Text>
                      <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 20, color: T.primary }}>
                        {avgWakeHour ? `${String(Math.floor(avgWakeHour)).padStart(2, '0')}:${String(Math.round((avgWakeHour % 1) * 60)).padStart(2, '0')}` : '—'}
                      </Text>
                    </View>
                  </Card>
                )}

                <Card T={T} style={{ marginBottom: 12 }}>
                  <Lbl T={T} style={{ marginBottom: 10 }}>💡 Рекомендации</Lbl>
                  {[
                    { condition: parseFloat(sleepScore.avg) < 7, text: 'Старайся спать минимум 7 часов.', icon: '😴' },
                    { condition: true, text: 'Ложись и вставай в одно время — даже в выходные.', icon: '🔄' },
                    { condition: wakeAlarms.length === 0, text: 'Добавь будильник подъёма.', icon: '🔔' },
                  ].filter(r => r.condition).slice(0, 3).map((rec, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 10, marginBottom: 8, paddingBottom: 8, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: T.bord }}>
                      <Text style={{ fontSize: 18 }}>{rec.icon}</Text>
                      <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.txt, lineHeight: 19, flex: 1 }}>{rec.text}</Text>
                    </View>
                  ))}
                </Card>
              </>
            )}
          </>
        )}
      </ScrollView>

      {(showAdd || editAlarm) && (
        <AlarmAddModal T={T} initial={editAlarm} onSave={addAlarm} onClose={() => { setShowAdd(false); setEditAlarm(null); }} />
      )}
    </SafeAreaView>
  );
}
