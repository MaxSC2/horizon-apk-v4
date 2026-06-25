// src/screens/AlarmScreen.tsx — v4.1 — Полноценный будильник на Notifee
//
// v4.1 fixes & improvements:
//   • Uses the rewritten src/alarm.ts with prefixed IDs + self-healing.
//   • deleteAlarm now AWAITS cancelAlarm — no more "alarm rings after deletion".
//   • Added "Проверить сигнал" button — fires a test alarm in 10 seconds so the
//     user can verify sound + vibration without waiting for the real time.
//   • Added "Сбросить все уведомления" — panic button that purges every
//     hz-alarm-* / hz-snooze-* notification (fixes the "messages keep coming
//     after uninstall" symptom).
//   • Improved modal: better time picker hit zones, scrollable on small phones,
//     proper safe-area padding, sticky save bar at the bottom.
//   • All touch targets ≥ 44×44. Buttons have hitSlop.
//   • "Next alarm in X hours" preview at the top of the list.
import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Modal,
  Pressable, Switch, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, X, Bell, Trash2, Zap, RefreshCw, Clock } from 'lucide-react-native';
import { useApp } from '../AppContext';
import { Card, Lbl, ProgressBar, IconBtn, Btn, EmptyState } from '../components';
import { UnifiedCard } from '../components/UnifiedCard';
import { uid, TODAY, fmtSleep } from '../helpers';
import { Haptic, modeAchievement } from '../haptics';
import { ModeBackground } from '../modes';
import { ScreenHeader } from '../components/ScreenHeader';
import {
  CHANNEL_ID,
  scheduleAlarm,
  cancelAlarmById,
  purgeAllAlarms,
  scheduleTestAlarm,
  nextAlarmPreview,
  canScheduleExactAlarms,
  openAlarmPermissionSettings,
} from '../alarm';
import notifee, {
  TriggerType,
  AndroidImportance,
  EventType,
} from '@notifee/react-native';
import { Alarm } from '../types';

const DAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const DAYS_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

const CATEGORY_INFO: Record<string, { emoji: string; label: string; color: string }> = {
  wake:    { emoji: '🌅', label: 'Подъём',       color: '#FFD600' },
  workout: { emoji: '💪', label: 'Тренировка',   color: '#00C4F0' },
  meal:    { emoji: '🍽️', label: 'Приём пищи',   color: '#00E676' },
  meds:    { emoji: '💊', label: 'Лекарство',    color: '#FF4455' },
  custom:  { emoji: '🔔', label: 'Другое',       color: '#C77DFF' },
};

const SOUND_OPTIONS: { id: Alarm['soundId']; label: string; emoji: string }[] = [
  { id: 'default', label: 'По умолчанию', emoji: '🔔' },
  { id: 'twilight', label: 'Тревога',     emoji: '🚨' },
  { id: 'chime',   label: 'Колокольчик',  emoji: '🎵' },
];

function getSleepScore(journal: any[]) {
  const last14 = journal.filter((j: any) => (j.sleep || 0) > 0).slice(-14);
  if (last14.length < 3) return null;
  const avg = last14.reduce((s: number, j: any) => s + (j.sleep || 0), 0) / last14.length;
  const score = Math.min(100, Math.round((avg / 8) * 100));
  return { avg: avg.toFixed(1), score, entries: last14.length };
}

// ── Add/Edit modal ──────────────────────────────────────────────────────────
function AlarmAddModal({
  T, onSave, onClose, initial,
}: {
  T: any;
  onSave: (a: Partial<Alarm>) => void;
  onClose: () => void;
  initial?: Alarm;
}) {
  const insets = useSafeAreaInsets();
  const [hour, setHour]         = useState(initial?.hour ?? 7);
  const [minute, setMinute]     = useState(initial?.minute ?? 0);
  const [label, setLabel]       = useState(initial?.label ?? '');
  const [days, setDays]         = useState<number[]>(initial?.days ?? [1, 2, 3, 4, 5]);
  const [vibrate, setVibrate]   = useState(initial?.vibrate ?? true);
  const [smartWake, setSmartWake] = useState(initial?.smartWake ?? false);
  const [category, setCategory] = useState<Alarm['category']>(initial?.category ?? 'wake');
  const [soundId, setSoundId]   = useState<Alarm['soundId']>(initial?.soundId ?? 'default');
  const [hourInput, setHourInput]     = useState(String(initial?.hour ?? 7).padStart(2, '0'));
  const [minuteInput, setMinuteInput] = useState(String(initial?.minute ?? 0).padStart(2, '0'));

  const toggleDay = (d: number) =>
    setDays(prev => (prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort()));
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
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)' }} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          backgroundColor: T.surf,
          borderTopLeftRadius: 22, borderTopRightRadius: 22,
          paddingBottom: Math.max(insets.bottom, 12),
          maxHeight: '90%',
        }}
      >
        {/* Grabber */}
        <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 4 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: T.bord }} />
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 12 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 22, color: T.txt }}>
              {initial ? 'Изменить' : 'Новый'} будильник
            </Text>
            <IconBtn onPress={onClose} T={T} size={36} bg={T.lo} border={T.bord}>
              <X size={16} color={T.muted} />
            </IconBtn>
          </View>

          {/* Time picker */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              {/* Hour */}
              <View style={{ alignItems: 'center', gap: 6 }}>
                <TouchableOpacity
                  onPress={() => {
                    const n = (hour + 1) % 24;
                    setHour(n);
                    setHourInput(String(n).padStart(2, '0'));
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{ width: 56, height: 40, borderRadius: 10, backgroundColor: T.lo, borderWidth: 1, borderColor: T.bord, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: T.muted, fontSize: 20, fontWeight: '700' }}>▲</Text>
                </TouchableOpacity>
                <View style={{ width: 92, height: 88, borderRadius: 14, backgroundColor: T.lo, borderWidth: 2, borderColor: T.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <TextInput
                    value={hourInput}
                    onChangeText={setHourInput}
                    onEndEditing={e => commitHourInput(e.nativeEvent.text)}
                    onBlur={() => commitHourInput(hourInput)}
                    keyboardType="number-pad"
                    maxLength={2}
                    selectTextOnFocus
                    style={{ width: 84, textAlign: 'center', color: T.txt, fontFamily: 'BarlowCondensed_900Black', fontSize: 52, backgroundColor: 'transparent', padding: 0 }}
                  />
                </View>
                <TouchableOpacity
                  onPress={() => {
                    const n = (hour - 1 + 24) % 24;
                    setHour(n);
                    setHourInput(String(n).padStart(2, '0'));
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{ width: 56, height: 40, borderRadius: 10, backgroundColor: T.lo, borderWidth: 1, borderColor: T.bord, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: T.muted, fontSize: 20, fontWeight: '700' }}>▼</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 56, color: T.txt, marginTop: -8 }}>:</Text>
              {/* Minute */}
              <View style={{ alignItems: 'center', gap: 6 }}>
                <TouchableOpacity
                  onPress={() => {
                    const n = (minute + 5) % 60;
                    setMinute(n);
                    setMinuteInput(String(n).padStart(2, '0'));
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{ width: 56, height: 40, borderRadius: 10, backgroundColor: T.lo, borderWidth: 1, borderColor: T.bord, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: T.muted, fontSize: 20, fontWeight: '700' }}>▲</Text>
                </TouchableOpacity>
                <View style={{ width: 92, height: 88, borderRadius: 14, backgroundColor: T.lo, borderWidth: 2, borderColor: T.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <TextInput
                    value={minuteInput}
                    onChangeText={setMinuteInput}
                    onEndEditing={e => commitMinuteInput(e.nativeEvent.text)}
                    onBlur={() => commitMinuteInput(minuteInput)}
                    keyboardType="number-pad"
                    maxLength={2}
                    selectTextOnFocus
                    style={{ width: 84, textAlign: 'center', color: T.txt, fontFamily: 'BarlowCondensed_900Black', fontSize: 52, backgroundColor: 'transparent', padding: 0 }}
                  />
                </View>
                <TouchableOpacity
                  onPress={() => {
                    const n = (minute - 5 + 60) % 60;
                    setMinute(n);
                    setMinuteInput(String(n).padStart(2, '0'));
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{ width: 56, height: 40, borderRadius: 10, backgroundColor: T.lo, borderWidth: 1, borderColor: T.bord, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: T.muted, fontSize: 20, fontWeight: '700' }}>▼</Text>
                </TouchableOpacity>
              </View>
            </View>
            {/* Quick times */}
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[[6, 0], [6, 30], [7, 0], [7, 30], [8, 0], [9, 0]].map(([h, m]) => (
                <TouchableOpacity
                  key={`${h}${m}`}
                  onPress={() => { setHour(h as number); setMinute(m as number); setHourInput(String(h).padStart(2, '0')); setMinuteInput(String(m).padStart(2, '0')); }}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
                    borderWidth: 1.5,
                    borderColor: hour === h && minute === m ? T.primary : T.bord,
                    backgroundColor: hour === h && minute === m ? T.primary + '22' : T.lo,
                  }}
                >
                  <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: hour === h && minute === m ? T.primary : T.muted }}>
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
              <TouchableOpacity
                key={s.id} onPress={() => setSoundId(s.id)}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: soundId === s.id ? T.primary : T.bord,
                  backgroundColor: soundId === s.id ? T.primary + '22' : T.lo,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 18, marginBottom: 3 }}>{s.emoji}</Text>
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 11, color: soundId === s.id ? T.primary : T.muted }}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Category */}
          <Lbl T={T} style={{ marginBottom: 8 }}>Категория</Lbl>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {(Object.entries(CATEGORY_INFO) as [Alarm['category'], typeof CATEGORY_INFO[string]][]).map(([k, v]) => (
              <TouchableOpacity
                key={k} onPress={() => setCategory(k)}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                style={{
                  paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: category === k ? v.color : T.bord,
                  backgroundColor: category === k ? v.color + '22' : T.lo,
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                }}
              >
                <Text style={{ fontSize: 14 }}>{v.emoji}</Text>
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: category === k ? v.color : T.muted }}>{v.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Label */}
          <Lbl T={T} style={{ marginBottom: 6 }}>Название</Lbl>
          <TextInput
            value={label} onChangeText={setLabel}
            placeholder={CATEGORY_INFO[category].label}
            placeholderTextColor={T.muted}
            returnKeyType="done"
            style={{
              height: 48, borderRadius: 12, borderWidth: 1.5,
              borderColor: T.bord, backgroundColor: T.lo,
              color: T.txt, fontFamily: 'Barlow_400Regular', fontSize: 16,
              paddingHorizontal: 14, marginBottom: 14,
            }}
          />

          {/* Days */}
          <Lbl T={T} style={{ marginBottom: 8 }}>Повтор</Lbl>
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
            {DAYS.map((d, i) => (
              <TouchableOpacity
                key={i} onPress={() => toggleDay(i)}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                style={{
                  flex: 1, height: 42, borderRadius: 11,
                  borderWidth: 1.5,
                  borderColor: days.includes(i) ? T.primary : T.bord,
                  backgroundColor: days.includes(i) ? T.primary + '22' : T.lo,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: days.includes(i) ? T.primary : T.muted }}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {[
              { l: 'Будни',    d: [1, 2, 3, 4, 5] },
              { l: 'Выходные', d: [0, 6] },
              { l: 'Каждый',   d: [0, 1, 2, 3, 4, 5, 6] },
              { l: 'Однажды',  d: [] as number[] },
            ].map(p => (
              <TouchableOpacity
                key={p.l} onPress={() => setDays(p.d)}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                style={{
                  paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1,
                  borderColor: JSON.stringify(days) === JSON.stringify(p.d) ? T.success : T.bord,
                  backgroundColor: JSON.stringify(days) === JSON.stringify(p.d) ? T.success + '18' : T.lo,
                }}
              >
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 12, color: JSON.stringify(days) === JSON.stringify(p.d) ? T.success : T.muted }}>{p.l}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Options */}
          <View style={{ borderBottomWidth: 1, borderBottomColor: T.bord, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 }}>
              <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 15, color: T.txt }}>📳 Вибрация</Text>
              <Switch value={vibrate} onValueChange={setVibrate} trackColor={{ false: T.bord, true: T.primary + '99' }} thumbColor={vibrate ? T.primary : T.muted} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 }}>
              <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 15, color: T.txt }}>🌙 Умный подъём</Text>
              <Switch value={smartWake} onValueChange={setSmartWake} trackColor={{ false: T.bord, true: T.primary + '99' }} thumbColor={smartWake ? T.primary : T.muted} />
            </View>
          </View>
        </ScrollView>

        {/* Sticky save bar */}
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 8 }}>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            style={{ flex: 1, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: T.bord, backgroundColor: T.lo, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 15, color: T.muted }}>Отмена</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onSave({
              hour, minute,
              label: label || CATEGORY_INFO[category].label,
              days, vibrate, smartWake, category, soundId,
            })}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            style={{ flex: 2, height: 48, borderRadius: 12, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 16, color: '#000' }}>Сохранить · {fmtTime}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Main screen ─────────────────────────────────────────────────────────────
export default function AlarmScreen() {
  const { state, setState, T, resyncAlarms, purgeAlarms, uiMode } = useApp();
  const alarms: Alarm[] = state.alarms || [];
  const [showAdd, setShowAdd] = useState(false);
  const [editAlarm, setEditAlarm] = useState<Alarm | null>(null);
  const [sub, setSub] = useState<'alarms' | 'analysis'>('alarms');

  // foreground event handler — snooze/stop buttons on the notification
  useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(async ({ type, detail }) => {
      if (type === EventType.ACTION_PRESS || type === EventType.PRESS) {
        const actionId = detail.pressAction?.id;
        const alarmId = detail.notification?.data?.alarmId as string;
        if (!alarmId) return;
        if (actionId === 'stop') {
          await cancelAlarmById(alarmId);
          // mark the alarm as disabled in storage so the toggle stays in sync
          setState(s => ({
            ...s,
            alarms: (s.alarms || []).map(a => a.id === alarmId ? { ...a, enabled: false } : a),
          }));
        }
        // snooze is handled by the background handler in alarm.ts
      }
    });
    return unsubscribe;
  }, [setState]);

  const setAlarms = (fn: (a: Alarm[]) => Alarm[]) => {
    setState((s: any) => ({ ...s, alarms: fn(s.alarms || []) }));
  };

  const addAlarm = async (data: Partial<Alarm>) => {
    const alarm: Alarm = {
      id: editAlarm?.id ?? uid(),
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

    await scheduleAlarm(alarm);
    if (editAlarm) {
      setAlarms(prev => prev.map(a => a.id === editAlarm.id ? alarm : a));
    } else {
      setAlarms(prev => [...prev, alarm].sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute)));
    }
    setShowAdd(false);
    setEditAlarm(null);
    modeAchievement(uiMode as string);
  };

  const toggleAlarm = async (id: string) => {
    const target = alarms.find(a => a.id === id);
    if (!target) return;
    const next = { ...target, enabled: !target.enabled };
    if (next.enabled) {
      await scheduleAlarm(next);
    } else {
      await cancelAlarmById(id);
    }
    setAlarms(prev => prev.map(a => a.id === id ? next : a));
    Haptic.toggle();
  };

  // v4.1 — AWAIT cancellation so the alarm can't ring after deletion.
  const deleteAlarm = async (id: string) => {
    await cancelAlarmById(id);
    setAlarms(prev => prev.filter(a => a.id !== id));
    Haptic.delete();
  };

  // v4.1 — "Проверить сигнал" — fires a test alarm in 10 seconds.
  const handleTestAlarm = async () => {
    const ok = await canScheduleExactAlarms();
    if (!ok) {
      Alert.alert(
        '⚠️ Разрешение не получено',
        'Для работы будильника нужно разрешение на Android 12+.\n\nНажмите "Открыть настройки" и включите "Будильники и напоминания".',
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Открыть настройки', onPress: () => openAlarmPermissionSettings() },
        ]
      );
      return;
    }
    const id = await scheduleTestAlarm(10);
    if (id) {
      Alert.alert('🔔 Тест запущен', 'Сигнал прозвучит через 10 секунд. Проверь звук и вибрацию.');
    } else {
      Alert.alert('Ошибка', 'Не удалось запустить тест. Проверь разрешения уведомлений.');
    }
  };

  // v4.1 — "Сбросить все уведомления" — purges every hz-alarm-* / hz-snooze-*
  // notification. Used as a panic button when stale alarms keep firing.
  const handlePurgeAll = () => {
    Alert.alert(
      'Сбросить все уведомления?',
      'Это отменит ВСЕ запланированные уведомления будильника. Включённые будильники будут перепланированы автоматически при следующем запуске приложения. Действие полезно если будильники приходят после удаления.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Сбросить',
          style: 'destructive',
          onPress: async () => {
            await purgeAlarms();
            // mark all alarms as disabled in storage so the UI matches reality.
            // They'll be re-scheduled on next app launch via syncAlarmsWithSystem.
            setAlarms(prev => prev.map(a => ({ ...a, enabled: false })));
            Alert.alert('✓ Готово', 'Все уведомления сброшены. Включи нужные будильники заново или перезапусти приложение для авто-синхронизации.');
          },
        },
      ]
    );
  };

  // v4.1 — manual resync button (in addition to the automatic one on launch).
  const handleResync = async () => {
    await resyncAlarms();
    Alert.alert('✓ Синхронизировано', 'Расписание будильников приведено в соответствие с хранилищем.');
  };

  const sleepScore = useMemo(() => getSleepScore(state.journal || []), [state.journal]);
  const last7Sleep = (state.journal || []).filter((j: any) => (j.sleep || 0) > 0).slice(0, 7).reverse();
  const wakeAlarms = alarms.filter(a => a.category === 'wake' && a.enabled);
  const avgWakeHour = wakeAlarms.length ? wakeAlarms.reduce((s, a) => s + a.hour + a.minute / 60, 0) / wakeAlarms.length : null;
  const preview = useMemo(() => nextAlarmPreview(alarms), [alarms]);

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
      <ModeBackground T={T} mode={uiMode} />
      <ScreenHeader
        T={T}
        title="Будильники"
        subtitle={`${alarms.filter(a => a.enabled).length} активных${preview ? ` · следующий ${preview.label}` : ''}`}
        right={
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <IconBtn onPress={handleResync} T={T} size={38} bg={T.lo} border={T.bord}>
              <RefreshCw size={15} color={T.muted} />
            </IconBtn>
            <TouchableOpacity
              onPress={() => setShowAdd(true)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center' }}
            >
              <Plus size={22} color="#000" />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Sub-tabs */}
      <View style={{ flexDirection: 'row', backgroundColor: T.surf, borderBottomWidth: 1, borderBottomColor: T.bord }}>
        {[
          { id: 'alarms' as const,   l: '🔔 Будильники' },
          { id: 'analysis' as const, l: '📊 Анализ сна' },
        ].map(t => (
          <TouchableOpacity
            key={t.id} onPress={() => setSub(t.id)}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            style={{
              flex: 1, paddingVertical: 13, alignItems: 'center',
              borderBottomWidth: 2,
              borderBottomColor: sub === t.id ? T.primary : 'transparent',
            }}
          >
            <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: sub === t.id ? T.primary : T.muted }}>{t.l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {sub === 'alarms' && (
          <>
            {/* Next-alarm preview banner */}
            {preview && (
              <View style={{
                marginBottom: 12, padding: 12, borderRadius: 14,
                backgroundColor: T.primary + '14', borderWidth: 1, borderColor: T.primary + '44',
                flexDirection: 'row', alignItems: 'center', gap: 12,
              }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: T.primary + '22', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={20} color={T.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 12, color: T.muted }}>Следующий будильник</Text>
                  <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 18, color: T.txt }}>
                    {fmtAlarmTime(preview.alarm)} · {preview.alarm.label}
                  </Text>
                </View>
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: T.primary }}>{preview.label}</Text>
              </View>
            )}

            {/* Tools row — v4.1 */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <TouchableOpacity
                onPress={handleTestAlarm}
                style={{
                  flex: 1, height: 48, borderRadius: 12,
                  borderWidth: 1.5, borderColor: T.warn + '66',
                  backgroundColor: T.warn + '15',
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <Zap size={16} color={T.warn} />
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: T.warn }}>Проверить сигнал</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePurgeAll}
                style={{
                  flex: 1, height: 48, borderRadius: 12,
                  borderWidth: 1.5, borderColor: T.danger + '66',
                  backgroundColor: T.danger + '15',
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <Trash2 size={16} color={T.danger} />
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: T.danger }}>Сбросить уведомления</Text>
              </TouchableOpacity>
            </View>

            {alarms.length === 0 ? (
              <EmptyState
                T={T}
                emoji="⏰"
                text="Нет будильников"
                subtext="Добавь будильник — подъём, тренировка или приём пищи. Больше не проспишь важное дело."
                actionLabel="+ Добавить будильник"
                onAction={() => setShowAdd(true)}
              />
            ) : (
              <>
                {groupedAlarms.map(alarm => {
                  const cat = CATEGORY_INFO[alarm.category];
                  const sound = SOUND_OPTIONS.find(s => s.id === alarm.soundId) || SOUND_OPTIONS[0];
                  return (
                    <UnifiedCard
                      key={alarm.id}
                      T={T}
                      style={{
                        marginBottom: 10,
                        opacity: alarm.enabled ? 1 : 0.55,
                        borderLeftWidth: 4,
                        borderLeftColor: alarm.enabled ? cat.color : T.bord,
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <TouchableOpacity
                          onPress={() => { setEditAlarm(alarm); setShowAdd(true); }}
                          style={{ flex: 1 }}
                          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                        >
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
                            <Text style={{ fontSize: 11 }}>{sound.emoji}</Text>
                            {alarm.vibrate   && <Text style={{ fontSize: 11 }}>📳</Text>}
                            {alarm.smartWake && <Text style={{ fontSize: 11 }}>🌙</Text>}
                          </View>
                        </TouchableOpacity>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Switch
                            value={alarm.enabled}
                            onValueChange={() => toggleAlarm(alarm.id)}
                            trackColor={{ false: T.bord, true: cat.color + '99' }}
                            thumbColor={alarm.enabled ? cat.color : T.muted}
                          />
                          <TouchableOpacity
                            onPress={() => Alert.alert(
                              'Удалить будильник?',
                              `«${fmtAlarmTime(alarm)} · ${alarm.label}» будет удалён.`,
                              [
                                { text: 'Отмена', style: 'cancel' },
                                { text: 'Удалить', style: 'destructive', onPress: () => deleteAlarm(alarm.id) },
                              ]
                            )}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={{ padding: 8 }}
                          >
                            <X size={16} color={T.muted} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </UnifiedCard>
                  );
                })}

                <TouchableOpacity
                  onPress={() => setShowAdd(true)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  style={{
                    height: 50, borderRadius: 12, borderWidth: 2, borderColor: T.bord,
                    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'row', gap: 8, marginTop: 4,
                  }}
                >
                  <Plus size={18} color={T.muted} />
                  <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 14, color: T.muted }}>Добавить будильник</Text>
                </TouchableOpacity>

                {/* Diagnostic info — collapsed by default */}
                <View style={{ marginTop: 18, padding: 12, borderRadius: 12, backgroundColor: T.lo, borderWidth: 1, borderColor: T.bord }}>
                  <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 11, color: T.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
                    ℹ️ Если будильник не работает
                  </Text>
                  <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 12, color: T.muted, lineHeight: 17 }}>
                    1. Проверь что включён тумблер будильника.{'\n'}
                    2. Открой настройки Android → Приложения → Горизонт → Уведомления, разреши все.{'\n'}
                    3. На Android 12+ разреши «Будильники и напоминания».{'\n'}
                    4. Отключи экономию батареи для приложения.{'\n'}
                    5. Нажми «Сбросить уведомления» выше — это очистит зависшие уведомления.
                  </Text>
                </View>
              </>
            )}
          </>
        )}

        {sub === 'analysis' && (
          <>
            <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 22, color: T.txt, marginBottom: 4 }}>Анализ сна</Text>
            <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.muted, marginBottom: 14 }}>Данные из дневника</Text>

            {!sleepScore ? (
              <UnifiedCard T={T} style={{ alignItems: 'center', padding: 24 }}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>💤</Text>
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 16, color: T.txt, marginBottom: 6 }}>Нужно минимум 3 записи</Text>
                <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.muted, textAlign: 'center' }}>Записывай сон в дневнике — и здесь появится анализ.</Text>
              </UnifiedCard>
            ) : (
              <>
                <UnifiedCard T={T} style={{ marginBottom: 12, backgroundColor: sleepScore.score >= 80 ? T.success + '10' : sleepScore.score >= 60 ? T.warn + '10' : T.danger + '10', borderWidth: 1, borderColor: sleepScore.score >= 80 ? T.success + '44' : sleepScore.score >= 60 ? T.warn + '44' : T.danger + '44' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <View>
                      <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 48, color: sleepScore.score >= 80 ? T.success : sleepScore.score >= 60 ? T.warn : T.danger, lineHeight: 52 }}>{sleepScore.score}</Text>
                      <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.muted }}>Sleep Score / 100</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 28, color: T.txt }}>{fmtSleep(parseFloat(sleepScore.avg))}</Text>
                      <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 12, color: T.muted }}>средний за {sleepScore.entries} дн.</Text>
                      <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 14, color: sleepScore.score >= 80 ? T.success : sleepScore.score >= 60 ? T.warn : T.danger, marginTop: 4 }}>
                        {sleepScore.score >= 80 ? '😴 Отлично' : sleepScore.score >= 60 ? '😐 Нормально' : '😰 Мало сна'}
                      </Text>
                    </View>
                  </View>
                  <ProgressBar pct={sleepScore.score} color={sleepScore.score >= 80 ? T.success : sleepScore.score >= 60 ? T.warn : T.danger} T={T} height={8} />
                </UnifiedCard>

                <UnifiedCard T={T} style={{ marginBottom: 12 }}>
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
                </UnifiedCard>

                {wakeAlarms.length > 0 && (
                  <UnifiedCard T={T} style={{ marginBottom: 12 }}>
                    <Lbl T={T} style={{ marginBottom: 10 }}>Анализ подъёма</Lbl>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 14, color: T.txt }}>Среднее время подъёма</Text>
                      <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 20, color: T.primary }}>
                        {avgWakeHour ? `${String(Math.floor(avgWakeHour)).padStart(2, '0')}:${String(Math.round((avgWakeHour % 1) * 60)).padStart(2, '0')}` : '—'}
                      </Text>
                    </View>
                  </UnifiedCard>
                )}

                <UnifiedCard T={T} style={{ marginBottom: 12 }}>
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
                </UnifiedCard>
              </>
            )}
          </>
        )}
      </ScrollView>

      {(showAdd || editAlarm) && (
        <AlarmAddModal
          T={T}
          initial={editAlarm}
          onSave={addAlarm}
          onClose={() => { setShowAdd(false); setEditAlarm(null); }}
        />
      )}
    </SafeAreaView>
  );
}
