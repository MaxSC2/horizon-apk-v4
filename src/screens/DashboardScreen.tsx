// src/screens/DashboardScreen.tsx
import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Modal, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Flame, Droplets, Trophy, Target, Zap, BedDouble, Palette, Bell } from 'lucide-react-native';
import { useApp } from '../AppContext';
import { Card, Lbl, Ring, Badge, ProgressBar } from '../components';
import { calcLifeScore, calcStreak, generateInsights, TODAY, fmt, weekDates, todayIdx, uid, getHeatMapData, fmtSleep } from '../helpers';
import { MOODS, ENERGY, QUOTES, PLAN } from '../data';
import ThemePickerModal from '../components/ThemePickerModal';
import { nextAlarmPreview } from '../alarm';
import { ModeBackground, ModeCard, ModeHeader, XPBar, getUIMode } from '../modes';

// ── HeatMap
function HeatMap({ T, history }: any) {
  const data = useMemo(() => getHeatMapData(history, 13), [history]);
  const completed = data.filter(d => d.completed).length;
  const total = data.filter(d => !d.isRest).length;

  // Group into weeks starting Monday
  const weeks: typeof data[] = [];
  let week: typeof data = [];
  data.forEach((d, i) => {
    week.push(d);
    if (week.length === 7 || i === data.length - 1) { weeks.push(week); week = []; }
  });

  const getColor = (d: typeof data[0]) => {
    if (d.isToday && !d.completed) return { bg: T.primary + '44', border: T.primary };
    if (!d.completed && d.isRest) return { bg: T.bord + '40', border: 'transparent' };
    if (!d.completed) return { bg: T.lo, border: 'transparent' };
    const op = 0.4 + (d.difficulty || 5) * 0.06;
    return { bg: T.success + Math.round(Math.min(op, 1) * 255).toString(16).padStart(2, '0'), border: 'transparent' };
  };

  return (
    <Card T={T} style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Lbl T={T}>Активность · 3 месяца</Lbl>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 15, color: T.success }}>{completed}</Text>
          <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 11, color: T.muted }}>из {total} дней</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 3 }}>
          {weeks.map((wk, wi) => (
            <View key={wi} style={{ flexDirection: 'column', gap: 3 }}>
              {wk.map((d, di) => {
                const col = getColor(d);
                return (
                  <View key={di} style={{ width: 13, height: 13, borderRadius: 3, backgroundColor: col.bg, borderWidth: col.border !== 'transparent' ? 1.5 : 0, borderColor: col.border }} />
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 }}>
        <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 9, color: T.muted }}>Меньше</Text>
        {[0.25, 0.45, 0.65, 0.85, 1].map((o, i) => (
          <View key={i} style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: T.success + Math.round(o * 255).toString(16).padStart(2, '0') }} />
        ))}
        <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 9, color: T.muted }}>Больше</Text>
      </View>
    </Card>
  );
}

export default function DashboardScreen() {
  const { state, setState, T, startWorkout, session, uiMode } = useApp();
  const navigation = useNavigation<any>();
  const { history, tasks, goals, journal } = state;

  const [showThemePicker, setShowThemePicker] = useState(false);
  const [focusText, setFocusText] = useState(state.focus?.date === TODAY ? state.focus.text : '');
  const [editFocus, setEditFocus] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);

  const score = useMemo(() => calcLifeScore(history, tasks, journal), [history, tasks, journal]);
  const streak = useMemo(() => calcStreak(history), [history]);
  const insights = useMemo(() => generateInsights(history, journal, tasks, goals), [history, journal, tasks, goals]);
  const todayI = todayIdx();
  const dates = useMemo(() => weekDates(), []);
  const todayPlan = PLAN[todayI];
  const todayLog = history[TODAY];
  const todayJournal = journal.find(j => j.date === TODAY);
  const [sleepHour, setSleepHour] = useState(Math.floor(todayJournal?.sleep || 7));
  const [sleepMinute, setSleepMinute] = useState(Math.round(((todayJournal?.sleep || 7) % 1) * 60));
  const waterToday = todayJournal?.waterGlasses || 0;
  const todayTasks = tasks.filter(t => t.recurring || t.dueDate === TODAY);
  const todayTasksDone = todayTasks.filter(t => t.completedDates?.includes(TODAY)).length;
  const activeGoals = goals.filter(g => !g.completed).slice(0, 3);
  const dayNum = Math.floor(Date.now() / 86400000);
  const quote = QUOTES[dayNum % QUOTES.length];

  const saveFocus = () => {
    setState(s => ({ ...s, focus: { text: focusText, date: TODAY } }));
    setEditFocus(false);
  };

  const setWater = (n: number) => {
    setState(s => {
      const j = [...s.journal];
      const idx = j.findIndex(x => x.date === TODAY);
      if (idx >= 0) j[idx] = { ...j[idx], waterGlasses: n, waterDone: n >= 8 };
      else j.unshift({ id: uid(), date: TODAY, text: '', mood: 3, energy: 3, waterGlasses: n, waterDone: n >= 8, createdAt: new Date().toISOString() });
      return { ...s, journal: j };
    });
  };

  const setSleep = (h: number) => {
    setState(s => {
      const j = [...s.journal];
      const idx = j.findIndex(x => x.date === TODAY);
      if (idx >= 0) j[idx] = { ...j[idx], sleep: h };
      else j.unshift({ id: uid(), date: TODAY, text: '', mood: 3, energy: 3, sleep: h, waterGlasses: 0, createdAt: new Date().toISOString() });
      return { ...s, journal: j };
    });
  };

  const saveSleep = () => {
    const totalHours = sleepHour + sleepMinute / 60;
    setSleep(totalHours);
    setShowSleepModal(false);
  };

  const openSleepModal = () => {
    const current = todayJournal?.sleep || 7;
    setSleepHour(Math.floor(current));
    setSleepMinute(Math.round((current % 1) * 60));
    setShowSleepModal(true);
  };

  // Quick check-in: track locally until BOTH selected, then save together
  const [localMood, setLocalMood] = useState<number | null>(null);
  const [localEnergy, setLocalEnergy] = useState<number | null>(null);
  const [checkinDone, setCheckinDone] = useState(!!todayJournal?.mood && !!todayJournal?.energy);

  const saveCheckin = (mood: number | null, energy: number | null) => {
    if (!mood && !energy) return;
    setState(s => {
      const j = [...s.journal];
      const idx = j.findIndex(x => x.date === TODAY);
      const patch: any = {};
      if (mood) patch.mood = mood;
      if (energy) patch.energy = energy;
      if (idx >= 0) j[idx] = { ...j[idx], ...patch };
      else j.unshift({ id: uid(), date: TODAY, text: '', mood: mood || 3, energy: energy || 3, waterGlasses: 0, createdAt: new Date().toISOString() });
      return { ...s, journal: j };
    });
    if (mood && energy) setCheckinDone(true);
  };

  const sleepHours = todayJournal?.sleep || 0;
  const sleepColor = sleepHours >= 7 ? T.success : sleepHours >= 6 ? T.warn : sleepHours > 0 ? T.danger : T.muted;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      {/* v4.2 — animated mode background */}
      <ModeBackground T={T} mode={uiMode} />

      {/* v4.2 — XP bar at top in Quest mode */}
      {uiMode === 'quest' && (
        <XPBar T={T} level={Math.floor((state.streak || 0) / 7) + 1} xp={(state.streak || 0) % 7 * 100} xpToNext={700} />
      )}

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: uiMode === 'aurora' ? 'transparent' : T.surf, borderBottomWidth: uiMode === 'aurora' ? 0 : 1, borderBottomColor: T.bord }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: T.primary + '22', borderWidth: 1.5, borderColor: T.primary + '44', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 16 }}>🌅</Text>
          </View>
          <View>
            <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 22, color: T.txt, letterSpacing: 2 }}>ГОРИЗОНТ</Text>
            <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 9, color: T.muted, letterSpacing: 1.5 }}>LIFE TRACKER</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {streak > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: T.lo, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: T.bord }}>
              <Flame size={13} color={T.warn} fill={T.warn} />
              <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 15, color: T.warn }}>{streak}</Text>
            </View>
          )}
          <TouchableOpacity onPress={() => setShowThemePicker(true)} style={{ width: 34, height: 34, borderRadius: 9, borderWidth: 1, borderColor: T.bord, backgroundColor: T.lo, alignItems: 'center', justifyContent: 'center' }}>
            <Palette size={16} color={T.muted} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>

        {/* Quote */}
        <View style={{ padding: 12, backgroundColor: T.primary + '18', borderWidth: 1, borderColor: T.primary + '33', borderRadius: 12, marginBottom: 12 }}>
          <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 14, color: T.txt, lineHeight: 20, fontStyle: 'italic' }}>«{quote.text}»</Text>
          <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 11, color: T.primary, marginTop: 6, letterSpacing: 1 }}>— {quote.author.toUpperCase()}</Text>
        </View>

        {/* Next-alarm preview — v4.1 */}
        {(() => {
          const preview = nextAlarmPreview(state.alarms || []);
          if (!preview) return null;
          const t = preview.alarm;
          const timeStr = `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`;
          return (
            <TouchableOpacity
              onPress={() => navigation.navigate('Alarm')}
              activeOpacity={0.75}
              style={{
                marginBottom: 12, padding: 14, borderRadius: 14,
                backgroundColor: T.card, borderWidth: 1, borderColor: T.bord,
                flexDirection: 'row', alignItems: 'center', gap: 12,
              }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: T.warn + '22', borderWidth: 1.5, borderColor: T.warn + '66', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={20} color={T.warn} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 11, color: T.muted, letterSpacing: 1.5, textTransform: 'uppercase' }}>Следующий будильник</Text>
                <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 22, color: T.txt, lineHeight: 26 }}>{timeStr} · {t.label}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: T.warn }}>{preview.label}</Text>
                <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 10, color: T.muted, marginTop: 2 }}>открыть →</Text>
              </View>
            </TouchableOpacity>
          );
        })()}

        {/* Focus */}
        <Card T={T} style={{ marginBottom: 12, borderWidth: state.focus?.date === TODAY && state.focus.text ? 1.5 : 1, borderColor: state.focus?.date === TODAY && state.focus.text ? T.warn + '66' : T.bord }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Lbl T={T}>🎯 Главный фокус дня</Lbl>
            {!editFocus && (
              <TouchableOpacity onPress={() => setEditFocus(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={{ fontSize: 14, color: T.muted }}>✏️</Text>
              </TouchableOpacity>
            )}
          </View>
          {editFocus ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                value={focusText}
                onChangeText={setFocusText}
                placeholder="Одна важнейшая задача дня…"
                placeholderTextColor={T.muted}
                onSubmitEditing={saveFocus}
                style={{ flex: 1, height: 40, borderRadius: 8, borderWidth: 1.5, borderColor: T.warn, backgroundColor: T.lo, color: T.txt, fontFamily: 'Barlow_400Regular', fontSize: 15, paddingHorizontal: 12 }}
              />
              <TouchableOpacity onPress={saveFocus} style={{ height: 40, paddingHorizontal: 14, borderRadius: 8, backgroundColor: T.warn, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 14, color: '#000' }}>OK</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setEditFocus(true)}>
              <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 15, color: state.focus?.date === TODAY && state.focus.text ? T.txt : T.muted, minHeight: 22 }}>
                {state.focus?.date === TODAY && state.focus.text ? state.focus.text : 'Нажми чтобы добавить фокус…'}
              </Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Quick Actions — v4.1 — primary actions one tap away */}
        <View style={{ marginBottom: 12 }}>
          <Lbl T={T} style={{ marginBottom: 8 }}>⚡ Быстрые действия</Lbl>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => {
                if (session) { navigation.navigate('Workout'); return; }
                startWorkout(todayI);
                navigation.navigate('Workout');
              }}
              activeOpacity={0.75}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              style={{
                flex: 1, borderRadius: 14, padding: 12,
                backgroundColor: T.primary + '15', borderWidth: 1.5, borderColor: T.primary + '55',
                alignItems: 'center', gap: 4,
              }}
            >
              <Text style={{ fontSize: 22 }}>{todayPlan?.emoji || '💪'}</Text>
              <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 12, color: T.primary, letterSpacing: 0.5 }}>
                {session ? 'ПРОДОЛЖИТЬ' : 'ТРЕНИРОВКА'}
              </Text>
              <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 9, color: T.muted }}>{todayPlan?.name || ''}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Journal')}
              activeOpacity={0.75}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              style={{
                flex: 1, borderRadius: 14, padding: 12,
                backgroundColor: T.success + '15', borderWidth: 1.5, borderColor: T.success + '55',
                alignItems: 'center', gap: 4,
              }}
            >
              <Text style={{ fontSize: 22 }}>📔</Text>
              <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 12, color: T.success, letterSpacing: 0.5 }}>ДНЕВНИК</Text>
              <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 9, color: T.muted }}>{todayJournal ? '✓ есть запись' : 'добавить'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Mentor')}
              activeOpacity={0.75}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              style={{
                flex: 1, borderRadius: 14, padding: 12,
                backgroundColor: '#C77DFF' + '15', borderWidth: 1.5, borderColor: '#C77DFF' + '55',
                alignItems: 'center', gap: 4,
              }}
            >
              <Text style={{ fontSize: 22 }}>🤖</Text>
              <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 12, color: '#C77DFF', letterSpacing: 0.5 }}>НЕЙРО</Text>
              <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 9, color: T.muted }}>совет AI</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's plan card — v4.1 — shows what workout is scheduled today */}
        {todayPlan && todayPlan.type !== 'rest' && (
          <Card T={T} style={{ marginBottom: 12, borderLeftWidth: 4, borderLeftColor: T.primary }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Lbl T={T} style={{ marginBottom: 4 }}>Сегодня · {todayPlan.day}</Lbl>
                <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 20, color: T.txt, marginBottom: 4 }}>{todayPlan.emoji} {todayPlan.name}</Text>
                <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 12, color: T.muted }}>
                  {todayLog?.completed
                    ? '✓ Выполнено сегодня'
                    : `${todayPlan.exercises.length} упр. · ${todayPlan.warmup.length + todayPlan.exercises.length + todayPlan.stretch.length} блока`}
                </Text>
              </View>
              {!todayLog?.completed && (
                <TouchableOpacity
                  onPress={() => {
                    if (session) { navigation.navigate('Workout'); return; }
                    startWorkout(todayI);
                    navigation.navigate('Workout');
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
                    backgroundColor: T.primary,
                  }}
                >
                  <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 13, color: '#000' }}>
                    {session ? 'ПРОДОЛЖ.' : 'НАЧАТЬ'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        )}

        {/* Life Score */}
        <Card T={T} style={{ marginBottom: 12, backgroundColor: T.card }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <View>
              <Lbl T={T} style={{ marginBottom: 4 }}>Score недели</Lbl>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 38, color: score.total >= 80 ? T.success : score.total >= 50 ? T.warn : T.danger, lineHeight: 42 }}>{score.total}</Text>
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 18, color: T.muted, marginBottom: 4 }}>/100</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Ring pct={score.workout} size={56} stroke={5} color={T.primary} bg={T.lo} label="Трен." T={T} />
              {score.tasks !== null && <Ring pct={score.tasks} size={56} stroke={5} color={T.success} bg={T.lo} label="Задачи" T={T} />}
              <Ring pct={score.journal} size={56} stroke={5} color={T.warn} bg={T.lo} label="Дневник" T={T} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {streak > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: T.lo, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: T.bord }}>
                <Flame size={13} color={T.warn} fill={T.warn} />
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 14, color: T.warn }}>Серия {streak} дн.</Text>
              </View>
            )}
            {(state.achievements || []).length >= 3 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: T.success + '22', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: T.success + '44' }}>
                <Trophy size={12} color={T.success} />
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 14, color: T.success }}>{(state.achievements || []).length} достиж.</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Smart Insights */}
        {insights.length > 0 && (
          <Card T={T} style={{ marginBottom: 12 }}>
            <Lbl T={T} style={{ marginBottom: 10 }}>💡 Инсайты</Lbl>
            {insights.map((ins, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: i < insights.length - 1 ? 8 : 0, paddingBottom: i < insights.length - 1 ? 8 : 0, borderBottomWidth: i < insights.length - 1 ? 1 : 0, borderBottomColor: T.bord }}>
                <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: ins.color + '22', borderWidth: 1, borderColor: ins.color + '44', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 14 }}>{ins.icon}</Text>
                </View>
                <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.txt, lineHeight: 19, flex: 1, paddingTop: 4 }}>{ins.text}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* Heat Map */}
        {Object.keys(history).length >= 3 && <HeatMap T={T} history={history} />}

        {/* Today card */}
        <Card T={T} style={{ marginBottom: 12 }}>
          <Lbl T={T} style={{ marginBottom: 10 }}>Сегодня — {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</Lbl>

          {/* Workout */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, backgroundColor: T.lo, borderRadius: 10, borderWidth: 1, borderColor: todayLog?.completed ? T.success + '66' : T.bord, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 22 }}>{todayPlan.emoji}</Text>
              <View>
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 15, color: T.txt }}>{todayPlan.name}</Text>
                <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 12, color: T.muted }}>
                  {todayPlan.type === 'rest' ? 'День отдыха' : todayLog?.completed ? `Сложность: ${todayLog.difficulty}/10` : `${todayPlan.exercises?.length || 0} упражнений`}
                </Text>
              </View>
            </View>
            {todayLog?.completed
              ? <Badge color={T.success} T={T}>✓</Badge>
              : todayPlan.type !== 'rest'
                ? <TouchableOpacity onPress={() => { startWorkout(todayI); navigation.navigate('Workout'); }} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: T.primary }}>
                    <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 14, color: '#000' }}>▶ Начать</Text>
                  </TouchableOpacity>
                : <Badge color={T.muted} T={T}>~</Badge>
            }
          </View>

          {/* Sleep quick-log */}
          <TouchableOpacity onPress={openSleepModal} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, backgroundColor: T.lo, borderRadius: 10, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <BedDouble size={16} color={sleepColor} />
              <View>
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 14, color: T.txt }}>Сон</Text>
                <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 11, color: sleepColor }}>
                  {sleepHours > 0 ? fmtSleep(sleepHours) : 'Нажмите'}
                </Text>
              </View>
            </View>
            <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 20, color: T.muted }}>→</Text>
          </TouchableOpacity>

          {/* Tasks progress */}
          {todayTasks.length > 0 && (
            <View style={{ padding: 10, backgroundColor: T.lo, borderRadius: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 14, color: T.txt }}>Задачи дня</Text>
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 14, color: todayTasksDone === todayTasks.length ? T.success : T.primary }}>{todayTasksDone}/{todayTasks.length}</Text>
              </View>
              <ProgressBar pct={todayTasks.length ? (todayTasksDone / todayTasks.length) * 100 : 0} color={T.success} T={T} />
            </View>
          )}
        </Card>

        {/* Quick check-in — stays visible until BOTH selected */}
        {!checkinDone && (
          <Card T={T} style={{ marginBottom: 12, borderWidth: 1.5, borderColor: T.primary + '55', backgroundColor: T.card }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <Zap size={14} color={T.primary} />
              <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, letterSpacing: 1.5, color: T.primary, textTransform: 'uppercase' }}>Быстрый чек-ин</Text>
              {(localMood && localEnergy) && (
                <TouchableOpacity onPress={() => saveCheckin(localMood, localEnergy)} style={{ marginLeft: 'auto', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, backgroundColor: T.success }}>
                  <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 12, color: '#000' }}>Сохранить ✓</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 12, color: T.muted, marginBottom: 12 }}>
              {!localMood ? 'Шаг 1: выбери настроение' : !localEnergy ? 'Шаг 2: выбери уровень энергии' : 'Нажми «Сохранить» →'}
            </Text>

            {/* Mood row */}
            <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 11, color: T.muted, marginBottom: 6 }}>😊 Настроение</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
              {MOODS.map(m => (
                <TouchableOpacity key={m.v} onPress={() => { setLocalMood(m.v); saveCheckin(m.v, localEnergy); }}
                  style={{ flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 2,
                    borderColor: localMood === m.v ? T.primary : T.bord,
                    backgroundColor: localMood === m.v ? T.primary + '28' : T.lo,
                    alignItems: 'center' }}>
                  <Text style={{ fontSize: 22 }}>{m.e}</Text>
                  <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 9, color: localMood === m.v ? T.primary : T.muted, marginTop: 3 }}>{m.l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Energy row */}
            <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 11, color: T.muted, marginBottom: 6 }}>⚡ Энергия</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {ENERGY.map(e => (
                <TouchableOpacity key={e.v} onPress={() => { setLocalEnergy(e.v); saveCheckin(localMood, e.v); }}
                  style={{ flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 2,
                    borderColor: localEnergy === e.v ? T.success : T.bord,
                    backgroundColor: localEnergy === e.v ? T.success + '28' : T.lo,
                    alignItems: 'center' }}>
                  <Text style={{ fontSize: 20 }}>{e.e}</Text>
                  <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 9, color: localEnergy === e.v ? T.success : T.muted, marginTop: 3 }}>{e.l}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}

        {/* Water tracker */}
        <Card T={T} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <Droplets size={16} color={T.primary} />
              <Lbl T={T}>Вода сегодня</Lbl>
            </View>
            <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 16, color: waterToday >= 8 ? T.success : T.primary }}>{waterToday}/8 ст.</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 5, flexWrap: 'wrap' }}>
            {Array.from({ length: 8 }, (_, i) => (
              <TouchableOpacity key={i} onPress={() => setWater(waterToday === i + 1 ? i : i + 1)}
                style={{ width: 36, height: 36, borderRadius: 8, borderWidth: 1.5, borderColor: i < waterToday ? T.primary : T.bord, backgroundColor: i < waterToday ? T.primary + '30' : T.lo, alignItems: 'center', justifyContent: 'center' }}>
                <Droplets size={14} color={i < waterToday ? T.primary : T.bord} fill={i < waterToday ? T.primary + '80' : 'none'} />
              </TouchableOpacity>
            ))}
          </View>
          {waterToday >= 8 && (
            <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 12, color: T.success, marginTop: 6 }}>✓ Норма выполнена!</Text>
          )}
        </Card>

        {/* Active goals */}
        {activeGoals.length > 0 && (
          <Card T={T} style={{ marginBottom: 12 }}>
            <Lbl T={T} style={{ marginBottom: 10 }}>🎯 Активные цели</Lbl>
            {activeGoals.map(g => {
              const pct = Math.round((g.currentValue / Math.max(g.targetValue, 1)) * 100);
              return (
                <View key={g.id} style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                    <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 14, color: T.txt }}>{g.emoji} {g.title}</Text>
                    <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 14, color: T.primary }}>{pct}%</Text>
                  </View>
                  <ProgressBar pct={pct} color={T.primary} T={T} height={6} />
                </View>
              );
            })}
          </Card>
        )}
      </ScrollView>

      {showThemePicker && <ThemePickerModal T={T} currentThemeId={state.themeId} onSelect={id => setState(s => ({ ...s, themeId: id }))} onClose={() => setShowThemePicker(false)} />}

      {/* Sleep Picker Modal */}
      <Modal visible={showSleepModal} transparent animationType="slide" onRequestClose={() => setShowSleepModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <Pressable style={{ flex: 1, justifyContent: 'flex-end' }} onPress={() => setShowSleepModal(false)}>
            <View style={{ backgroundColor: T.surf, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 34 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 20, color: T.txt }}>Время сна</Text>
                  <TouchableOpacity onPress={() => setShowSleepModal(false)} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: T.lo, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: T.muted, fontSize: 16 }}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 30 }}>
                  <View style={{ alignItems: 'center', gap: 8 }}>
                    <TouchableOpacity onPress={() => setSleepHour(h => h >= 23 ? 0 : h + 1)} style={{ width: 70, height: 40, borderRadius: 10, backgroundColor: T.lo, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: T.muted, fontSize: 20 }}>▲</Text>
                    </TouchableOpacity>
                    <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 52, color: T.txt }}>{String(sleepHour).padStart(2, '0')}</Text>
                    <TouchableOpacity onPress={() => setSleepHour(h => h <= 0 ? 23 : h - 1)} style={{ width: 70, height: 40, borderRadius: 10, backgroundColor: T.lo, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: T.muted, fontSize: 20 }}>▼</Text>
                    </TouchableOpacity>
                    <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 12, color: T.muted }}>часов</Text>
                  </View>

                  <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 52, color: T.txt, marginTop: -20 }}>:</Text>

                  <View style={{ alignItems: 'center', gap: 8 }}>
                    <TouchableOpacity onPress={() => setSleepMinute(m => m >= 59 ? 0 : m + 1)} style={{ width: 70, height: 40, borderRadius: 10, backgroundColor: T.lo, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: T.muted, fontSize: 20 }}>▲</Text>
                    </TouchableOpacity>
                    <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 52, color: T.txt }}>{String(sleepMinute).padStart(2, '0')}</Text>
                    <TouchableOpacity onPress={() => setSleepMinute(m => m <= 0 ? 59 : m - 1)} style={{ width: 70, height: 40, borderRadius: 10, backgroundColor: T.lo, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: T.muted, fontSize: 20 }}>▼</Text>
                    </TouchableOpacity>
                    <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 12, color: T.muted }}>минут</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
                  {[[6, 0], [7, 0], [8, 0], [9, 0]].map(([h, m]) => (
                    <TouchableOpacity key={`${h}${m}`} onPress={() => { setSleepHour(h); setSleepMinute(m); }}
                      style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: sleepHour === h && sleepMinute === m ? T.primary : T.bord, backgroundColor: sleepHour === h && sleepMinute === m ? T.primary + '22' : T.lo }}>
                      <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 14, color: sleepHour === h && sleepMinute === m ? T.primary : T.muted }}>{h}ч</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity onPress={saveSleep} style={{ height: 50, borderRadius: 12, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 18, color: '#000' }}>Сохранить</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </View>
        </Modal>
    </SafeAreaView>
  );
}

