// src/v6/screens/V6Tasks.tsx — HORIZON V6
//
// Задачи и цели в v6 стиле. Timeline привычек + цели с прогрессом.
import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Modal, TextInput } from 'react-native';
import { ChevronLeft, Plus, X, Check, Flame } from 'lucide-react-native';
import { V6Background } from '../components/V6Background';
import { V6Card } from '../components/V6Card';
import { v6Colors, v6Typography, v6Geometry } from '../theme';
import { useApp } from '../../AppContext';
import { uid, TODAY, goalForecast } from '../../helpers';
import { Task } from '../../types';

const TASK_CATS = [
  { id: 'workout', label: 'Тренировка', emoji: '💪', color: v6Colors.accent },
  { id: 'health',  label: 'Здоровье',  emoji: '❤️', color: v6Colors.success },
  { id: 'mind',    label: 'Разум',     emoji: '🧠', color: '#C77DFF' },
  { id: 'habit',   label: 'Привычка',  emoji: '🔁', color: v6Colors.success },
  { id: 'study',   label: 'Учёба',     emoji: '📚', color: v6Colors.warning },
  { id: 'other',   label: 'Другое',    emoji: '✦',  color: '#FF9500' },
];

function taskStreak(task: Task): number {
  let s = 0;
  const t = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(t);
    d.setDate(t.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    if (task.completedDates?.includes(ds)) s++;
    else if (i > 0) break;
  }
  return s;
}

export function V6Tasks({ onBack }: { onBack: () => void }) {
  const { state, setState } = useApp();
  const { tasks, goals } = state;
  const [sub, setSub] = useState<'tasks' | 'goals'>('tasks');
  const [showAdd, setShowAdd] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCat, setTaskCat] = useState('habit');
  const [recurring, setRecurring] = useState(true);
  const [goalForm, setGoalForm] = useState({ title: '', emoji: '🎯', target: '100', unit: '%' });

  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 13 + i);
    return d.toISOString().split('T')[0];
  });

  const toggleTask = (id: string) => {
    setState(s => ({
      ...s,
      tasks: s.tasks.map(task => {
        if (task.id !== id) return task;
        const done = task.completedDates?.includes(TODAY);
        return { ...task, completedDates: done ? task.completedDates.filter(d => d !== TODAY) : [...(task.completedDates || []), TODAY] };
      }),
    }));
  };

  const addTask = () => {
    if (!taskTitle.trim()) return;
    setState(s => ({
      ...s,
      tasks: [...s.tasks, {
        id: uid(), title: taskTitle.trim(), category: taskCat,
        recurring, completedDates: [], createdAt: new Date().toISOString(),
      }],
    }));
    setTaskTitle(''); setShowAdd(false);
  };

  const addGoal = () => {
    if (!goalForm.title.trim()) return;
    setState(s => ({
      ...s,
      goals: [...s.goals, {
        id: uid(), title: goalForm.title.trim(), emoji: goalForm.emoji,
        category: 'skill', targetValue: parseInt(goalForm.target) || 100,
        currentValue: 0, unit: goalForm.unit, completed: false,
        createdAt: new Date().toISOString(), history: [],
      }],
    }));
    setGoalForm({ title: '', emoji: '🎯', target: '100', unit: '%' });
    setShowAdd(false);
  };

  const updateProgress = (id: string, val: number) => {
    setState(s => ({
      ...s,
      goals: s.goals.map(g => {
        if (g.id !== id) return g;
        const nv = Math.max(0, Math.min(val, g.targetValue));
        return { ...g, currentValue: nv, completed: nv >= g.targetValue, history: [...(g.history || []), { date: TODAY, value: nv }].slice(-30) };
      }),
    }));
  };

  return (
    <View style={styles.container}>
      <V6Background />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ChevronLeft size={22} color={v6Colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[v6Typography.title2, { color: v6Colors.textPrimary }]}>
            {sub === 'tasks' ? 'Задачи и привычки' : 'Цели'}
          </Text>
          <Text style={[v6Typography.micro, { color: v6Colors.textTertiary, marginTop: 2 }]}>
            {sub === 'tasks' ? `${tasks.length} активных` : `${goals.filter(g => !g.completed).length} в работе`}
          </Text>
        </View>
        <Pressable
          onPress={() => setShowAdd(true)}
          style={({ pressed }) => [styles.addBtn, { transform: [{ scale: pressed ? 0.92 : 1 }] }]}
        >
          <Plus size={20} color={v6Colors.accentText} />
        </Pressable>
      </View>

      {/* Sub-tabs */}
      <View style={styles.subTabs}>
        {[
          { id: 'tasks' as const, l: 'Задачи' },
          { id: 'goals' as const, l: 'Цели' },
        ].map(t => (
          <Pressable
            key={t.id}
            onPress={() => setSub(t.id)}
            style={[
              styles.subTab,
              sub === t.id && { backgroundColor: v6Colors.accentSoft },
            ]}
          >
            <Text style={[
              v6Typography.bodyMedium,
              { color: sub === t.id ? v6Colors.accent : v6Colors.textTertiary },
            ]}>
              {t.l}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: v6Geometry.screenPadding, paddingBottom: 120, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {sub === 'tasks' && (
          <>
            {tasks.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>📋</Text>
                <Text style={[v6Typography.title2, { color: v6Colors.textPrimary }]}>Нет задач</Text>
                <Text style={[v6Typography.body, { color: v6Colors.textSecondary, marginTop: 8, textAlign: 'center' }]}>
                  Добавь первую привычку или задачу
                </Text>
              </View>
            )}

            {tasks.map(task => {
              const c = TASK_CATS.find(x => x.id === task.category) || TASK_CATS[4];
              const done = task.completedDates?.includes(TODAY);
              const streak = taskStreak(task);
              return (
                <V6Card key={task.id} style={{ marginBottom: 10, padding: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                    {/* Checkbox */}
                    <Pressable
                      onPress={() => toggleTask(task.id)}
                      style={[
                        styles.checkbox,
                        done && { backgroundColor: v6Colors.success, borderColor: v6Colors.success },
                      ]}
                    >
                      {done && <Check size={16} color={v6Colors.accentText} strokeWidth={3} />}
                    </Pressable>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text style={[
                          v6Typography.bodyMedium,
                          { color: done ? v6Colors.textTertiary : v6Colors.textPrimary, flex: 1, textDecorationLine: done ? 'line-through' : 'none' },
                        ]}>
                          {task.title}
                        </Text>
                        {streak > 0 && (
                          <View style={styles.streakPill}>
                            <Flame size={10} color={v6Colors.warning} />
                            <Text style={[v6Typography.micro, { color: v6Colors.warning }]}>{streak}</Text>
                          </View>
                        )}
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Text style={{ fontSize: 12 }}>{c.emoji}</Text>
                        <Text style={[v6Typography.micro, { color: v6Colors.textTertiary }]}>
                          {c.label} · {task.recurring ? 'ежедневно' : 'однократно'}
                        </Text>
                      </View>

                      {/* 14-day grid */}
                      {task.recurring && (
                        <View style={{ flexDirection: 'row', gap: 3 }}>
                          {last14.map(d => {
                            const isDone = task.completedDates?.includes(d);
                            return (
                              <View
                                key={d}
                                style={{
                                  width: 14, height: 14, borderRadius: 3,
                                  backgroundColor: isDone ? v6Colors.success : v6Colors.card,
                                  borderWidth: 1, borderColor: isDone ? v6Colors.success : v6Colors.divider,
                                }}
                              />
                            );
                          })}
                        </View>
                      )}
                    </View>

                    <Pressable
                      onPress={() => setState(s => ({ ...s, tasks: s.tasks.filter(x => x.id !== task.id) }))}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={16} color={v6Colors.textTertiary} />
                    </Pressable>
                  </View>
                </V6Card>
              );
            })}
          </>
        )}

        {sub === 'goals' && (
          <>
            {goals.filter(g => !g.completed).length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>🎯</Text>
                <Text style={[v6Typography.title2, { color: v6Colors.textPrimary }]}>Нет целей</Text>
                <Text style={[v6Typography.body, { color: v6Colors.textSecondary, marginTop: 8, textAlign: 'center' }]}>
                  Поставь первую цель и отслеживай прогресс
                </Text>
              </View>
            )}

            {goals.filter(g => !g.completed).map(g => {
              const pct = Math.round((g.currentValue / Math.max(g.targetValue, 1)) * 100);
              const fc = goalForecast(g);
              return (
                <V6Card key={g.id} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[v6Typography.title2, { color: v6Colors.textPrimary }]}>
                        {g.emoji} {g.title}
                      </Text>
                      <Text style={[v6Typography.caption, { color: v6Colors.textTertiary, marginTop: 2 }]}>
                        {g.currentValue} / {g.targetValue} {g.unit}
                      </Text>
                    </View>
                    <Text style={[v6Typography.display, { fontSize: 28, color: pct >= 100 ? v6Colors.success : pct >= 50 ? v6Colors.warning : v6Colors.accent }]}>
                      {pct}%
                    </Text>
                  </View>

                  {/* Progress bar */}
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${pct}%` }]} />
                  </View>

                  {/* Quick +/- */}
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                    {[-10, -1, 1, 10].map(delta => (
                      <Pressable
                        key={delta}
                        onPress={() => updateProgress(g.id, g.currentValue + delta)}
                        style={({ pressed }) => [{
                          flex: 1, height: 36, borderRadius: 8,
                          backgroundColor: delta > 0 ? v6Colors.accentSoft : v6Colors.card,
                          borderWidth: 1, borderColor: delta > 0 ? v6Colors.accent + '55' : v6Colors.divider,
                          alignItems: 'center', justifyContent: 'center',
                          transform: [{ scale: pressed ? 0.95 : 1 }],
                        }]}
                      >
                        <Text style={[
                          v6Typography.bodyMedium,
                          { color: delta > 0 ? v6Colors.accent : v6Colors.textTertiary },
                        ]}>
                          {delta > 0 ? '+' : ''}{delta}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {fc && (
                    <View style={styles.forecastPill}>
                      <Text style={{ fontSize: 12 }}>📈</Text>
                      <Text style={[v6Typography.caption, { color: v6Colors.textSecondary }]}>
                        Готово к {fc.date} ({fc.daysNeeded} дн.)
                      </Text>
                    </View>
                  )}
                </V6Card>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowAdd(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[v6Typography.title2, { color: v6Colors.textPrimary }]}>
                {sub === 'tasks' ? 'Новая задача' : 'Новая цель'}
              </Text>
              <Pressable onPress={() => setShowAdd(false)} style={styles.closeBtn}>
                <X size={16} color={v6Colors.textTertiary} />
              </Pressable>
            </View>

            {sub === 'tasks' ? (
              <>
                <TextInput
                  value={taskTitle}
                  onChangeText={setTaskTitle}
                  placeholder="Название задачи..."
                  placeholderTextColor={v6Colors.textTertiary}
                  style={styles.textInput}
                  onSubmitEditing={addTask}
                />
                <Text style={[v6Typography.caption, { color: v6Colors.textTertiary, marginBottom: 8, textTransform: 'uppercase' }]}>
                  Категория
                </Text>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                  {TASK_CATS.map(c => (
                    <Pressable
                      key={c.id}
                      onPress={() => setTaskCat(c.id)}
                      style={[
                        styles.catChip,
                        taskCat === c.id && { backgroundColor: v6Colors.accentSoft, borderColor: v6Colors.accent },
                      ]}
                    >
                      <Text style={{ fontSize: 14 }}>{c.emoji}</Text>
                      <Text style={[
                        v6Typography.caption,
                        { color: taskCat === c.id ? v6Colors.accent : v6Colors.textTertiary },
                      ]}>{c.label}</Text>
                    </Pressable>
                  ))}
                </View>

                <Pressable
                  onPress={() => setRecurring(!recurring)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}
                >
                  <View style={[
                    styles.checkbox,
                    recurring && { backgroundColor: v6Colors.accent, borderColor: v6Colors.accent },
                  ]}>
                    {recurring && <Check size={16} color={v6Colors.accentText} strokeWidth={3} />}
                  </View>
                  <Text style={[v6Typography.body, { color: v6Colors.textPrimary }]}>
                    Ежедневная привычка
                  </Text>
                </Pressable>

                <Pressable
                  onPress={addTask}
                  disabled={!taskTitle.trim()}
                  style={({ pressed }) => [
                    styles.saveBtn,
                    { opacity: !taskTitle.trim() ? 0.4 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
                  ]}
                >
                  <Text style={[v6Typography.bodyMedium, { color: v6Colors.accentText }]}>
                    Добавить
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <TextInput
                  value={goalForm.title}
                  onChangeText={v => setGoalForm(f => ({ ...f, title: v }))}
                  placeholder="Название цели..."
                  placeholderTextColor={v6Colors.textTertiary}
                  style={styles.textInput}
                />
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[v6Typography.caption, { color: v6Colors.textTertiary, marginBottom: 6, textTransform: 'uppercase' }]}>
                      Цель
                    </Text>
                    <TextInput
                      value={goalForm.target}
                      onChangeText={v => setGoalForm(f => ({ ...f, target: v }))}
                      keyboardType="numeric"
                      style={styles.shortInput}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[v6Typography.caption, { color: v6Colors.textTertiary, marginBottom: 6, textTransform: 'uppercase' }]}>
                      Единица
                    </Text>
                    <TextInput
                      value={goalForm.unit}
                      onChangeText={v => setGoalForm(f => ({ ...f, unit: v }))}
                      placeholder="кг, %, повт..."
                      placeholderTextColor={v6Colors.textTertiary}
                      style={styles.shortInput}
                    />
                  </View>
                  <View style={{ flex: 0.5 }}>
                    <Text style={[v6Typography.caption, { color: v6Colors.textTertiary, marginBottom: 6, textTransform: 'uppercase' }]}>
                      Иконка
                    </Text>
                    <TextInput
                      value={goalForm.emoji}
                      onChangeText={v => setGoalForm(f => ({ ...f, emoji: v }))}
                      style={styles.shortInput}
                    />
                  </View>
                </View>

                <Pressable
                  onPress={addGoal}
                  disabled={!goalForm.title.trim()}
                  style={({ pressed }) => [
                    styles.saveBtn,
                    { opacity: !goalForm.title.trim() ? 0.4 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
                  ]}
                >
                  <Text style={[v6Typography.bodyMedium, { color: v6Colors.accentText }]}>
                    Добавить цель
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: v6Colors.void },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: v6Geometry.screenPadding,
    paddingTop: 56, paddingBottom: 12,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: v6Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  subTabs: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: v6Geometry.screenPadding,
    marginBottom: 8,
  },
  subTab: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 12,
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 6,
    borderWidth: 2, borderColor: v6Colors.textTertiary,
    alignItems: 'center', justifyContent: 'center',
  },
  streakPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 6, paddingVertical: 2,
    backgroundColor: v6Colors.warning + '22', borderRadius: 6,
  },
  progressBar: {
    height: 6, backgroundColor: v6Colors.card, borderRadius: 3, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: v6Colors.accent, borderRadius: 3,
  },
  forecastPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 12, paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: v6Colors.success + '15', borderRadius: 8, alignSelf: 'flex-start',
  },
  modalContent: {
    backgroundColor: v6Colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 40, maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: v6Colors.card, alignItems: 'center', justifyContent: 'center',
  },
  textInput: {
    height: 48, borderRadius: 12,
    backgroundColor: v6Colors.card, borderWidth: 1, borderColor: v6Colors.divider,
    paddingHorizontal: 14,
    color: v6Colors.textPrimary,
    fontFamily: v6Typography.body.fontFamily,
    fontSize: v6Typography.body.fontSize,
    marginBottom: 16,
  },
  shortInput: {
    height: 44, borderRadius: 10,
    backgroundColor: v6Colors.card, borderWidth: 1, borderColor: v6Colors.divider,
    paddingHorizontal: 12,
    color: v6Colors.textPrimary,
    fontFamily: v6Typography.body.fontFamily,
    fontSize: 16,
    textAlign: 'center',
  },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1, borderColor: v6Colors.divider,
    backgroundColor: v6Colors.card,
  },
  saveBtn: {
    height: 50, borderRadius: v6Geometry.btnRadius,
    backgroundColor: v6Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
});
