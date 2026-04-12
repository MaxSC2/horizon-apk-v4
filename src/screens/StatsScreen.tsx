// src/screens/StatsScreen.tsx
import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, BedDouble, ChevronLeft, ChevronRight, Trash2, Palette } from 'lucide-react-native';
import Svg, { Circle, Text as SvgText, Rect, Line, G, Polygon, Polyline } from 'react-native-svg';
import { useApp } from '../AppContext';
import { Card, Lbl, Badge, ProgressBar, Ring } from '../components';
import {
  calcStreak, getPRs, weeklyTonnage, computeAuto1RM, calcLifeScore,
  getAllProgressionSuggestions, moodWorkoutCorrelation, weeklyWorkoutStats,
  exerciseTrend, getMonthlyStats, TODAY, fmt, fmtSleep,
} from '../helpers';
import { PLAN, ACHIEVEMENT_DEFS } from '../data';
import { DEFAULTS } from '../storage';
import ThemePickerModal from '../components/ThemePickerModal';
import StylePickerModal from '../components/StylePickerModal';
import { UI_STYLES, getUIStyle } from '../styles';

// Simple bar chart using SVG (no custom dot renderers = no crashes)
function BarChartSVG({ data, T, height = 100, accentLast = false, refVal }: { data: { label: string; value: number; highlight?: boolean }[]; T: any; height?: number; accentLast?: boolean; refVal?: number }) {
  const max = Math.max(...data.map(d => d.value), refVal || 0, 1);
  const chartH = height - 20;
  const barW = 260 / data.length;
  return (
    <Svg width="100%" height={height} viewBox={`0 0 280 ${height}`}>
      {refVal && <Line x1={10} y1={chartH * (1 - refVal / max)} x2={270} y2={chartH * (1 - refVal / max)} stroke={T.success} strokeWidth={1} strokeDasharray="4 3" />}
      {data.map((d, i) => {
        const bh = Math.max(2, (d.value / max) * chartH);
        const x = 10 + i * barW + barW * 0.1;
        const w = barW * 0.8;
        const y = chartH - bh;
        const color = d.highlight || (accentLast && i === data.length - 1) ? T.primary : T.primary + '66';
        return (
          <React.Fragment key={i}>
            <Rect x={x} y={y} width={w} height={bh} rx={3} fill={color} />
            <SvgText x={x + w / 2} y={chartH + 14} textAnchor="middle" fill={T.muted} fontSize={8}>{d.label}</SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

// Area chart using SVG
function AreaChartSVG({ data, T, height = 80, color }: { data: (number | null)[]; T: any; height?: number; color?: string }) {
  const vals = data.filter(v => v !== null) as number[];
  const max = Math.max(...vals, 1);
  const c = color || T.success;
  const w = 260;
  const h = height - 10;
  const pts = data.map((v, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * w + 10;
    const y = v !== null ? h - (v / max) * (h - 4) + 5 : null;
    return { x, y };
  });
  const linePts = pts.filter(p => p.y !== null).map(p => `${p.x},${p.y}`).join(' ');
  if (!linePts) return null;
  const firstValid = pts.find(p => p.y !== null);
  const lastValid = [...pts].reverse().find(p => p.y !== null);
  const area = linePts + ` ${lastValid!.x},${h + 10} ${firstValid!.x},${h + 10}`;
  return (
    <Svg width="100%" height={height} viewBox={`0 0 280 ${height}`}>
      <Polygon points={area} fill={c + '30'} />
      <Polyline points={linePts} fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Radar chart using SVG
function RadarSVG({ data, T, size = 160 }: { data: { label: string; value: number }[]; T: any; size?: number }) {
  const cx = size / 2; const cy = size / 2; const r = size * 0.35;
  const n = data.length;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const gridPts = (scale: number) => data.map((_, i) => {
    const a = angle(i);
    return `${cx + Math.cos(a) * r * scale},${cy + Math.sin(a) * r * scale}`;
  }).join(' ');
  const valuePts = data.map((d, i) => {
    const a = angle(i);
    const pct = Math.min(d.value, 100) / 100;
    return `${cx + Math.cos(a) * r * pct},${cy + Math.sin(a) * r * pct}`;
  }).join(' ');
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.25, 0.5, 0.75, 1].map(s => <Polygon key={s} points={gridPts(s)} fill="none" stroke={T.bord} strokeWidth={1} />)}
      <Polygon points={valuePts} fill={T.primary + '30'} stroke={T.primary} strokeWidth={2} />
      {data.map((d, i) => {
        const a = angle(i);
        const lx = cx + Math.cos(a) * (r + 18);
        const ly = cy + Math.sin(a) * (r + 18);
        return <SvgText key={i} x={lx} y={ly + 4} textAnchor="middle" fill={T.muted} fontSize={9}>{d.label}</SvgText>;
      })}
    </Svg>
  );
}

export default function StatsScreen() {
  const { state, T, update1RM } = useApp();
  const { history, tasks, goals, journal, achievements } = state;
  const [sub, setSub] = useState<'stats' | 'achievements' | 'anatomy' | 'profile'>('stats');
  const [selEx, setSelEx] = useState('pushups');
  const [monthOffset, setMonthOffset] = useState(0);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showStylePicker, setShowStylePicker] = useState(false);
  const { setState } = useApp();

  const prs = useMemo(() => getPRs(history), [history]);
  const streak = useMemo(() => calcStreak(history), [history]);
  const totalW = Object.values(history).filter(l => l.completed).length;
  const auto1RM = useMemo(() => computeAuto1RM(history), [history]);
  const alerts = useMemo(() => getAllProgressionSuggestions(history), [history]);
  const corrData = useMemo(() => moodWorkoutCorrelation(history, journal), [history, journal]);
  const tonnage = useMemo(() => weeklyTonnage(history), [history]);

  const avgDiff = (() => {
    const a = Object.values(history).filter(l => l.completed && l.difficulty);
    return a.length ? (a.reduce((s, l) => s + l.difficulty, 0) / a.length).toFixed(1) : '—';
  })();

  const sleepEntries = journal.filter(j => (j.sleep || 0) > 0).slice(-30);
  const avgSleepVal = sleepEntries.length ? sleepEntries.reduce((s, j) => s + (j.sleep || 0), 0) / sleepEntries.length : null;
  const avgSleepLabel = avgSleepVal ? fmtSleep(avgSleepVal) : '—';

  const trackedEx = PLAN.flatMap(d => d.exercises || []).reduce((a: any[], e) => {
    if (!a.find((x: any) => x.id === e.id)) a.push(e); return a;
  }, []);

  // Workout frequency last 8 weeks
  const wFreq = tonnage.map((t, i) => ({ label: t.week, value: (() => {
    const wk = new Date(); wk.setDate(wk.getDate() - (7 - i) * 7);
    let c = 0;
    for (let d = 0; d < 7; d++) { const x = new Date(wk); x.setDate(wk.getDate() + d); if (history[fmt(x)]?.completed) c++; }
    return c;
  })() }));

  // Mood correlation bars
  const moodBars = corrData.slice(-14).map(d => ({ label: d.date.split('.')[0], value: d.mood || 0, highlight: d.workout === 1 }));

  // Sleep last 30 days
  const sleepLine = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 29 + i);
    const e = journal.filter(j => j.date === fmt(d) && (j.sleep || 0) > 0).slice(-1)[0];
    return e?.sleep || null;
  });

  // Exercise trend
  const exTrend = Object.entries(history)
    .filter(([, l]) => l.exercises?.[selEx]?.some(s => (parseInt(s.value) || 0) > 0))
    .sort(([a], [b]) => a < b ? -1 : 1).slice(-10)
    .map(([, l]) => Math.max(0, ...l.exercises[selEx].map(s => parseInt(s.value) || 0)));

  const radarData = [
    { label: 'Трен.', value: Math.round((wFreq.slice(-1)[0]?.value || 0) / 7 * 100) },
    { label: 'Задачи', value: Math.min(Math.round(tasks.filter(t => t.recurring && t.completedDates?.includes(TODAY)).length / Math.max(tasks.filter(t => t.recurring).length, 1) * 100), 100) },
    { label: 'Цели', value: Math.min(goals.filter(g => !g.completed).length * 20, 100) },
    { label: 'Дневник', value: journal.some(j => { const d = new Date(); d.setDate(d.getDate() - 7); return j.date > fmt(d); }) ? 100 : 0 },
    { label: 'Серия', value: Math.min(Math.round(streak / 10 * 100), 100) },
  ];

  const earned = achievements || [];
  const notEarned = ACHIEVEMENT_DEFS.filter(a => !earned.includes(a.id));
  const workoutMoods = corrData.filter(d => d.workout === 1 && d.mood);
  const restMoods = corrData.filter(d => d.workout === 0 && d.mood && !d.isRest);
  const avgMoodW = workoutMoods.length ? (workoutMoods.reduce((s, d) => s + (d.mood || 0), 0) / workoutMoods.length).toFixed(1) : null;
  const avgMoodR = restMoods.length ? (restMoods.reduce((s, d) => s + (d.mood || 0), 0) / restMoods.length).toFixed(1) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ backgroundColor: T.surf, borderBottomWidth: 1, borderBottomColor: T.bord, maxHeight: 44 }}>
        <View style={{ flexDirection: 'row' }}>
          {[{ id: 'stats' as const, l: '📊 Статы' }, { id: 'achievements' as const, l: '🏆 Достиж.' }, { id: 'anatomy' as const, l: '🫀 Анатомия' }, { id: 'profile' as const, l: '⚙️ Профиль' }].map(t => (
            <TouchableOpacity key={t.id} onPress={() => setSub(t.id)} style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: sub === t.id ? T.primary : 'transparent' }}>
              <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: sub === t.id ? T.primary : T.muted }}>{t.l}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 20 }}>

        {sub === 'stats' && (
          <>
            {/* Summary */}
            <View style={{ flexDirection: 'row', gap: 7, marginBottom: 14 }}>
              {[
                { l: 'Тренировок', v: totalW, c: T.primary },
                { l: 'Ср. сложность', v: avgDiff, c: T.warn },
                { l: '🔥 Серия', v: streak, c: T.success },
                { l: '💤 Сон avg', v: avgSleepLabel, c: T.primary },
              ].map((s, i) => (
                <Card key={i} T={T} style={{ flex: 1, padding: 10, alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 20, color: s.c, lineHeight: 24 }}>{s.v}</Text>
                  <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 8, letterSpacing: 1, color: T.muted, textTransform: 'uppercase', marginTop: 3, textAlign: 'center' }}>{s.l}</Text>
                </Card>
              ))}
            </View>

            {/* 1RM suggestion */}
            {auto1RM && auto1RM !== (state.user?.maxPushups || 27) && (
              <View style={{ padding: 12, paddingHorizontal: 14, backgroundColor: T.success + '15', borderWidth: 1, borderColor: T.success + '44', borderRadius: 12, marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TrendingUp size={18} color={T.success} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 14, color: T.success }}>Расчётный максимум обновился</Text>
                  <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 12, color: T.txt, marginTop: 2 }}>По формуле Эпли: {auto1RM} повт (сейчас: {state.user?.maxPushups || 27})</Text>
                </View>
                <TouchableOpacity onPress={() => update1RM(auto1RM!)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: T.success + '55', backgroundColor: T.success + '22' }}>
                  <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 12, color: T.success }}>Обновить</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Radar */}
            <Card T={T} style={{ marginBottom: 14, alignItems: 'center' }}>
              <Lbl T={T} style={{ marginBottom: 8, alignSelf: 'flex-start' }}>Баланс жизни</Lbl>
              <RadarSVG data={radarData} T={T} size={200} />
            </Card>

            {/* Frequency + Tonnage */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
              <Card T={T} style={{ flex: 1 }}>
                <Lbl T={T} style={{ marginBottom: 8 }}>Дней / нед.</Lbl>
                <BarChartSVG data={wFreq} T={T} height={110} accentLast />
              </Card>
              <Card T={T} style={{ flex: 1 }}>
                <Lbl T={T} style={{ marginBottom: 8 }}>Объём / нед.</Lbl>
                <AreaChartSVG data={tonnage.map(t => t.tonnage)} T={T} height={110} color={T.success} />
              </Card>
            </View>

            {/* Mood correlation */}
            {moodBars.filter(b => b.value > 0).length >= 5 && (
              <Card T={T} style={{ marginBottom: 14 }}>
                <Lbl T={T} style={{ marginBottom: 4 }}>Настроение и тренировки</Lbl>
                {avgMoodW && avgMoodR && (
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                    <View style={{ flex: 1, padding: 8, backgroundColor: T.success + '15', borderWidth: 1, borderColor: T.success + '44', borderRadius: 9, alignItems: 'center' }}>
                      <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 22, color: T.success }}>{avgMoodW}</Text>
                      <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 10, color: T.muted }}>после трен.</Text>
                    </View>
                    <View style={{ flex: 1, padding: 8, backgroundColor: T.lo, borderWidth: 1, borderColor: T.bord, borderRadius: 9, alignItems: 'center' }}>
                      <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 22, color: T.muted }}>{avgMoodR}</Text>
                      <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 10, color: T.muted }}>без трен.</Text>
                    </View>
                    <View style={{ flex: 2, padding: 8, backgroundColor: T.lo, borderRadius: 9, justifyContent: 'center' }}>
                      <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 12, color: T.txt, lineHeight: 17 }}>
                        {parseFloat(avgMoodW) > parseFloat(avgMoodR)
                          ? `✅ После тренировок настроение выше на ${(parseFloat(avgMoodW) - parseFloat(avgMoodR)).toFixed(1)} балла`
                          : `📊 Тренировки не влияют заметно`}
                      </Text>
                    </View>
                  </View>
                )}
                <BarChartSVG data={moodBars} T={T} height={80} />
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: T.primary }} />
                    <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 10, color: T.muted }}>День тренировки</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: T.primary + '66' }} />
                    <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 10, color: T.muted }}>Обычный день</Text>
                  </View>
                </View>
              </Card>
            )}

            {/* Sleep */}
            {sleepEntries.length >= 3 && (
              <Card T={T} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Lbl T={T}>Сон / 30 дней</Lbl>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <BedDouble size={12} color={avgSleepVal !== null && avgSleepVal >= 7 ? T.success : T.warn} />
                    <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: avgSleepVal !== null && avgSleepVal >= 7 ? T.success : T.warn }}>avg {avgSleepLabel}</Text>
                  </View>
                </View>
                <AreaChartSVG data={sleepLine} T={T} height={80} color={T.primary} />
                <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 10, color: T.muted, marginTop: 3 }}>Норма: 7+ часов</Text>
              </Card>
            )}

            {/* Exercise trend */}
            <Card T={T} style={{ marginBottom: 14 }}>
              <Lbl T={T} style={{ marginBottom: 8 }}>Динамика упражнения</Lbl>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {['pushups', 'squats', 'plank', 'hollow'].map(id => {
                    const ex = trackedEx.find((e: any) => e.id === id);
                    if (!ex) return null;
                    return (
                      <TouchableOpacity key={id} onPress={() => setSelEx(id)}
                        style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1.5, borderColor: selEx === id ? T.primary : T.bord, backgroundColor: selEx === id ? T.primary + '22' : T.lo }}>
                        <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 12, color: selEx === id ? T.primary : T.muted }}>{ex.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
              {exTrend.length > 1
                ? <BarChartSVG data={exTrend.map((v, i) => ({ label: String(i + 1), value: v }))} T={T} height={110} accentLast />
                : <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.muted, textAlign: 'center', paddingVertical: 20 }}>Нужно минимум 2 записи</Text>
              }
            </Card>

            {/* PRs */}
            {Object.keys(prs).length > 0 && (
              <Card T={T} style={{ marginBottom: 14 }}>
                <Lbl T={T} style={{ marginBottom: 10 }}>🏆 Личные рекорды</Lbl>
                {Object.entries(prs).slice(0, 8).map(([id, val]) => {
                  const ex = trackedEx.find((e: any) => e.id === id);
                  if (!ex || !val) return null;
                  return (
                    <View key={id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: T.bord }}>
                      <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 14, color: T.txt }}>{ex.name}</Text>
                      <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 16, color: T.warn }}>{val} {ex.type === 'seconds' ? 'сек' : 'повт'}</Text>
                    </View>
                  );
                })}
              </Card>
            )}

            {/* Progression alerts */}
            {alerts.length > 0 && (
              <Card T={T} style={{ marginBottom: 14, backgroundColor: T.warn + '0C', borderWidth: 1, borderColor: T.warn + '44' }}>
                <Lbl T={T} style={{ marginBottom: 10 }}>💡 Прогрессия</Lbl>
                {alerts.map((a, i) => <Text key={i} style={{ fontFamily: 'Barlow_400Regular', fontSize: 14, color: T.txt, paddingVertical: 5, borderBottomWidth: i < alerts.length - 1 ? 1 : 0, borderBottomColor: T.bord }}>{a.message}</Text>)}
              </Card>
            )}
          </>
        )}

        {sub === 'achievements' && (
          <>
            <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 22, color: T.txt, marginBottom: 4 }}>Достижения</Text>
            <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.muted, marginBottom: 10 }}>{earned.length} / {ACHIEVEMENT_DEFS.length}</Text>
            <ProgressBar pct={Math.round(earned.length / ACHIEVEMENT_DEFS.length * 100)} color={T.primary} T={T} height={8} />
            <View style={{ height: 16 }} />

            {/* Monthly Stats */}
            {(() => {
              const monthDate = new Date(); monthDate.setDate(1); monthDate.setMonth(monthDate.getMonth() - monthOffset);
              const ms = getMonthlyStats(history, journal, monthDate);
              const MOOD_EMOJI = ['', '😢', '😕', '😐', '🙂', '😊'];
              const firstDay = new Date(monthDate); const startOffset = (firstDay.getDay() + 6) % 7;
              const cells = [...Array(startOffset).fill(null), ...ms.days];
              const rows: any[] = [];
              for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
              return (
                <Card T={T} style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Lbl T={T}>Месяц</Lbl>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <TouchableOpacity onPress={() => setMonthOffset(o => o + 1)} style={{ width: 26, height: 26, borderRadius: 7, borderWidth: 1, borderColor: T.bord, backgroundColor: T.lo, alignItems: 'center', justifyContent: 'center' }}>
                        <ChevronLeft size={13} color={T.muted} />
                      </TouchableOpacity>
                      <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: T.txt, minWidth: 110, textAlign: 'center', textTransform: 'capitalize' }}>
                        {monthDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                      </Text>
                      <TouchableOpacity onPress={() => setMonthOffset(o => Math.max(0, o - 1))} disabled={monthOffset === 0} style={{ width: 26, height: 26, borderRadius: 7, borderWidth: 1, borderColor: T.bord, backgroundColor: T.lo, alignItems: 'center', justifyContent: 'center', opacity: monthOffset === 0 ? 0.3 : 1 }}>
                        <ChevronRight size={13} color={T.muted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {/* KPIs */}
                  <View style={{ flexDirection: 'row', gap: 7, marginBottom: 12 }}>
                    {[
                      { l: 'Тренировок', v: `${ms.workoutDays}/${ms.totalDays}`, c: T.primary },
                      { l: 'Консист.', v: ms.consistency + '%', c: ms.consistency >= 80 ? T.success : ms.consistency >= 50 ? T.warn : T.danger },
                      { l: 'Настроение', v: ms.avgMood ? `${ms.avgMood} ${MOOD_EMOJI[Math.round(parseFloat(ms.avgMood))]}` : '—', c: T.success },
                      { l: 'Сон avg', v: ms.avgSleep ? fmtSleep(parseFloat(ms.avgSleep)) : '—', c: T.primary },
                    ].map((s, i) => (
                      <View key={i} style={{ flex: 1, padding: 8, backgroundColor: T.lo, borderRadius: 10, alignItems: 'center' }}>
                        <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 14, color: s.c, lineHeight: 18 }}>{s.v}</Text>
                        <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 8, color: T.muted, textTransform: 'uppercase', textAlign: 'center', marginTop: 2 }}>{s.l}</Text>
                      </View>
                    ))}
                  </View>
                  {/* Mini calendar */}
                  <View style={{ flexDirection: 'row', marginBottom: 5 }}>
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
                      <View key={d} style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 9, color: T.muted }}>{d}</Text>
                      </View>
                    ))}
                  </View>
                  {rows.map((row, ri) => (
                    <View key={ri} style={{ flexDirection: 'row', gap: 2, marginBottom: 2 }}>
                      {Array.from({ length: 7 }, (_, di) => {
                        const d = row[di];
                        if (!d) return <View key={di} style={{ flex: 1 }} />;
                        const isRest = PLAN[new Date(d.date + 'T12:00:00').getDay() === 0 ? 6 : new Date(d.date + 'T12:00:00').getDay() - 1]?.type === 'rest';
                        return (
                          <View key={di} style={{ flex: 1, aspectRatio: 1, borderRadius: 3, backgroundColor: d.workout ? T.success + '99' : isRest ? T.bord + '44' : T.lo, borderWidth: d.date === TODAY ? 1.5 : 0, borderColor: T.primary, alignItems: 'center', justifyContent: 'center' }}>
                            {d.mood && !d.workout && <Text style={{ fontSize: 7 }}>{MOOD_EMOJI[d.mood]}</Text>}
                          </View>
                        );
                      })}
                    </View>
                  ))}
                </Card>
              );
            })()}

            {earned.length > 0 && (
              <>
                <Lbl T={T} style={{ marginBottom: 10 }}>Получено</Lbl>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {ACHIEVEMENT_DEFS.filter(a => earned.includes(a.id)).map(a => (
                    <Card key={a.id} T={T} style={{ width: '47%', padding: 12, backgroundColor: T.success + '0C', borderWidth: 1, borderColor: T.success + '55' }}>
                      <Text style={{ fontSize: 28, marginBottom: 6 }}>{a.emoji}</Text>
                      <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 14, color: T.success, marginBottom: 2 }}>{a.title}</Text>
                      <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 11, color: T.muted }}>{a.desc}</Text>
                    </Card>
                  ))}
                </View>
              </>
            )}

            {notEarned.length > 0 && (
              <>
                <Lbl T={T} style={{ marginBottom: 10 }}>Впереди</Lbl>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {notEarned.map(a => (
                    <Card key={a.id} T={T} style={{ width: '47%', padding: 12, opacity: 0.4 }}>
                      <Text style={{ fontSize: 28, marginBottom: 6 }}>{a.emoji}</Text>
                      <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 14, color: T.muted, marginBottom: 2 }}>{a.title}</Text>
                      <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 11, color: T.muted }}>{a.desc}</Text>
                    </Card>
                  ))}
                </View>
              </>
            )}
          </>
        )}

        {/* ── ANATOMY ── */}
        {sub === 'anatomy' && (
          <>
            <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 22, color: T.txt, marginBottom: 4 }}>🫀 Анатомия</Text>
            <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.muted, marginBottom: 14 }}>Знай свои мышцы — тренируйся умнее</Text>

            {[
              { name: 'Грудь', emoji: '💪', color: '#00C4F0', zone: 'upper',
                desc: 'Большая и малая грудная мышца. Отвечает за сведение рук и горизонтальное жимовое движение.',
                exercises: ['pushups', 'pause_pushups', 'narrow_pushups'],
                tips: ['Держи лопатки сведёнными', 'Контролируй опускание 2-3 сек', 'Локти под углом 45° от корпуса'],
                mistakes: ['Провисание в пояснице', 'Разведение локтей в стороны', 'Неполная амплитуда'],
                recovery: '48-72 часа' },
              { name: 'Трицепс', emoji: '🦾', color: '#C77DFF', zone: 'upper',
                desc: 'Трёхглавая мышца плеча. Разгибает руку в локте, работает во всех отжиманиях.',
                exercises: ['narrow_pushups', 'pushups', 'pike'],
                tips: ['Узкая постановка рук для акцента', 'Держи локти близко к корпусу', 'Полное разгибание вверху'],
                mistakes: ['Расстановка рук слишком широко', 'Неполное разгибание'],
                recovery: '48 часов' },
              { name: 'Спина', emoji: '🎯', color: '#00E676', zone: 'upper',
                desc: 'Широчайшие и трапеции. Тяговые движения — дверная тяга, горизонтальные ряды.',
                exercises: ['door_row', 'iso_row'],
                tips: ['Тяни лопатки друг к другу', 'Держи корпус прямым', 'Контролируй скорость'],
                mistakes: ['Рывковые движения', 'Помощь поясницей'],
                recovery: '48-72 часа' },
              { name: 'Квадрицепс', emoji: '🦵', color: '#FFD600', zone: 'lower',
                desc: 'Передняя часть бедра. Разгибает колено, работает в приседаниях и выпадах.',
                exercises: ['squats', 'lunges', 'bulgarian', 'wall_sit'],
                tips: ['Колени над стопами', 'Пятки на полу', 'Спина прямая'],
                mistakes: ['Колени внутрь', 'Наклон вперёд', 'Подъём на носки'],
                recovery: '48-72 часа' },
              { name: 'Ягодицы', emoji: '🍑', color: '#FF9500', zone: 'lower',
                desc: 'Большая ягодичная мышца. Разгибает бедро, работает в мосте и выпадах.',
                exercises: ['glute_bridge', 'single_glute', 'lunges', 'bulgarian'],
                tips: ['Сжимай ягодицы вверху', 'Полное разгибание бедра', 'Нейтральный таз'],
                mistakes: ['Поясница вместо ягодиц', 'Неполная амплитуда'],
                recovery: '48 часов' },
              { name: 'Кор', emoji: '⚡', color: '#FF4455', zone: 'core',
                desc: 'Поперечные и прямые мышцы живота, стабилизаторы. Основа всех упражнений.',
                exercises: ['plank', 'hollow', 'side_plank'],
                tips: ['Нейтральный позвоночник', 'Не задерживай дыхание', 'Напрягай пресс, не тяни'],
                mistakes: ['Прогиб в пояснице', 'Поднятый таз', 'Расслабленный живот'],
                recovery: '24-48 часов' },
            ].map(muscle => {
              const musclePRs = muscle.exercises.map(id => prs[id] || 0).filter(v => v > 0);
              const bestPR = musclePRs.length ? Math.max(...musclePRs) : 0;
              return (
                <Card key={muscle.name} T={T} style={{ marginBottom: 12, borderTopWidth: 3, borderTopColor: muscle.color }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Text style={{ fontSize: 28 }}>{muscle.emoji}</Text>
                      <View>
                        <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 18, color: T.txt }}>{muscle.name}</Text>
                        <View style={{ flexDirection: 'row', gap: 5, marginTop: 3 }}>
                          <View style={{ paddingHorizontal: 7, paddingVertical: 2, backgroundColor: muscle.color + '22', borderRadius: 6 }}>
                            <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 10, color: muscle.color }}>{muscle.zone === 'upper' ? 'Верх' : muscle.zone === 'lower' ? 'Ноги' : 'Кор'}</Text>
                          </View>
                          {bestPR > 0 && <View style={{ paddingHorizontal: 7, paddingVertical: 2, backgroundColor: T.warn + '22', borderRadius: 6 }}>
                            <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 10, color: T.warn }}>🏆 PR: {bestPR}</Text>
                          </View>}
                        </View>
                      </View>
                    </View>
                    <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 11, color: T.muted }}>⏱ {muscle.recovery}</Text>
                  </View>
                  <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.muted, lineHeight: 18, marginBottom: 10 }}>{muscle.desc}</Text>
                  <Lbl T={T} style={{ marginBottom: 6 }}>Советы по технике</Lbl>
                  {muscle.tips.map((tip, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
                      <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: muscle.color + '22', borderWidth: 1, borderColor: muscle.color + '44', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 9, color: muscle.color }}>{i + 1}</Text>
                      </View>
                      <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.txt, lineHeight: 18, flex: 1 }}>{tip}</Text>
                    </View>
                  ))}
                  <Lbl T={T} style={{ marginTop: 8, marginBottom: 6 }}>Частые ошибки</Lbl>
                  {muscle.mistakes.map((m, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 7, marginBottom: 3 }}>
                      <Text style={{ color: T.danger }}>✗</Text>
                      <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.txt, flex: 1 }}>{m}</Text>
                    </View>
                  ))}
                </Card>
              );
            })}
          </>
        )}

        {/* ── PROFILE ── */}
        {sub === 'profile' && (
          <>
            {/* Stats summary */}
            <Card T={T} style={{ marginBottom: 12, backgroundColor: T.primary + '12', borderWidth: 1, borderColor: T.primary + '44' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                {[
                  { l: 'Тренировок', v: Object.values(history).filter(l => l.completed).length, c: T.primary },
                  { l: 'Рабочий диап.', v: `${Math.round((state.user.maxPushups || 27) * 0.6)}-${Math.round((state.user.maxPushups || 27) * 0.7)}`, c: T.success },
                  { l: 'Макс. повт.', v: state.user.maxPushups, c: T.warn },
                ].map((s, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <View style={{ width: 1, backgroundColor: T.bord }} />}
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 26, color: s.c }}>{s.v}</Text>
                      <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 9, color: T.muted, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', marginTop: 2 }}>{s.l}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </Card>

            {/* Max pushups editor */}
            <Card T={T} style={{ marginBottom: 12 }}>
              <Lbl T={T} style={{ marginBottom: 8 }}>Максимум отжиманий</Lbl>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity onPress={() => setState((s: any) => ({ ...s, user: { ...s.user, maxPushups: Math.max(1, (s.user.maxPushups || 27) - 1) } }))} style={{ width: 36, height: 36, borderRadius: 9, borderWidth: 1, borderColor: T.bord, backgroundColor: T.lo, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 20, color: T.muted }}>−</Text>
                </TouchableOpacity>
                <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 36, color: T.primary, flex: 1, textAlign: 'center' }}>{state.user.maxPushups}</Text>
                <TouchableOpacity onPress={() => setState((s: any) => ({ ...s, user: { ...s.user, maxPushups: (s.user.maxPushups || 27) + 1 } }))} style={{ width: 36, height: 36, borderRadius: 9, borderWidth: 1, borderColor: T.bord, backgroundColor: T.lo, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 20, color: T.muted }}>+</Text>
                </TouchableOpacity>
              </View>
            </Card>

            {/* Style section */}
            <Card T={T} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Text style={{ fontSize: 14 }}>🎨</Text>
                <Lbl T={T} style={{ color: T.success }}>Стиль интерфейса</Lbl>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                {UI_STYLES.map(s => {
                  const cur = ((state as any).uiStyleId || 'default') === s.id;
                  return (
                    <TouchableOpacity key={s.id} onPress={() => setState((st: any) => ({ ...st, uiStyleId: s.id }))}
                      style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: cur ? 2 : 1, borderColor: cur ? T.success : T.bord, backgroundColor: cur ? T.success + '18' : T.lo, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Text style={{ fontSize: 12 }}>{s.emoji}</Text>
                      <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 12, color: cur ? T.success : T.muted }}>{s.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity onPress={() => setShowStylePicker(true)} style={{ height: 36, borderRadius: 9, borderWidth: 1, borderColor: T.success + '55', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: T.success }}>Выбрать стиль →</Text>
              </TouchableOpacity>
            </Card>

            {/* Theme swatches */}
            <Card T={T} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Palette size={14} color={T.primary} />
                <Lbl T={T} style={{ color: T.primary }}>Тема оформления</Lbl>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {require('../theme').THEMES.map((theme: any) => {
                  const th = require('../theme').getTheme(theme.id);
                  const cur = (state.themeId || 'cosmos') === theme.id;
                  return (
                    <TouchableOpacity key={theme.id} onPress={() => setState((s: any) => ({ ...s, themeId: theme.id }))}
                      style={{ width: 44, height: 44, borderRadius: 12, borderWidth: cur ? 2.5 : 2, borderColor: cur ? th.primary : T.bord, backgroundColor: th.bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 8, backgroundColor: th.primary }} />
                      <Text style={{ fontSize: 16, zIndex: 1 }}>{theme.icon}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity onPress={() => setShowThemePicker(true)} style={{ marginTop: 10, height: 36, borderRadius: 9, borderWidth: 1, borderColor: T.primary + '55', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: T.primary }}>Все темы →</Text>
              </TouchableOpacity>
            </Card>

            {/* Reset */}
            <TouchableOpacity onPress={() => Alert.alert('Сбросить всё?', 'Тренировки, задачи, цели, дневник — всё удалится.', [{ text: 'Отмена', style: 'cancel' }, { text: 'Удалить всё', style: 'destructive', onPress: () => setState({ ...DEFAULTS, themeId: state.themeId }) }])}
              style={{ height: 44, borderRadius: 10, borderWidth: 1, borderColor: T.danger + '66', backgroundColor: T.danger + '15', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <Trash2 size={14} color={T.danger} />
              <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 14, color: T.danger }}>Сбросить данные</Text>
            </TouchableOpacity>

            <Card T={T} style={{ marginBottom: 0 }}>
              <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 22, letterSpacing: 2, color: T.txt }}>ГОРИЗОНТ</Text>
                <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 12, color: T.muted, marginTop: 4 }}>Life Tracker · v4.0 · Expo React Native</Text>
                <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 11, color: T.muted, marginTop: 2 }}>Тело · Разум · Дисциплина · Горизонт</Text>
              </View>
            </Card>
          </>
        )}
      </ScrollView>
      {showThemePicker && <ThemePickerModal T={T} currentThemeId={state.themeId} onSelect={id => setState((s: any) => ({ ...s, themeId: id }))} onClose={() => setShowThemePicker(false)} />}
      {showStylePicker && <StylePickerModal T={T} currentStyleId={(state as any).uiStyleId || 'default'} currentThemeId={state.themeId} onSelect={id => setState((s: any) => ({ ...s, uiStyleId: id }))} onClose={() => setShowStylePicker(false)} />}
    </SafeAreaView>
  );
}
