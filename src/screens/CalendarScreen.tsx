// src/screens/CalendarScreen.tsx — Full calendar with events and history overlay
import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Plus, X, Check, Target, Dumbbell, BookOpen, Heart } from 'lucide-react-native';
import { useApp } from '../AppContext';
import { Card, Lbl, Badge } from '../components';
import { uid, fmt } from '../helpers';
import { PLAN, MOODS } from '../data';

interface CalEvent {
  id: string;
  date: string;
  title: string;
  category: 'workout' | 'goal' | 'note' | 'health' | 'study' | 'social' | 'other';
  done: boolean;
  color?: string;
  time?: string;
}

const CAT_INFO: Record<string, { emoji: string; color: string; label: string }> = {
  workout: { emoji: '💪', color: '#00C4F0', label: 'Тренировка' },
  goal:    { emoji: '🎯', color: '#FFD600', label: 'Цель' },
  note:    { emoji: '📝', color: '#C77DFF', label: 'Заметка' },
  health:  { emoji: '❤️', color: '#FF4455', label: 'Здоровье' },
  study:   { emoji: '📚', color: '#00E676', label: 'Учёба' },
  social:  { emoji: '👥', color: '#FF9500', label: 'Социальное' },
  other:   { emoji: '✦',  color: '#8B5CF6', label: 'Другое' },
};

const MONTH_NAMES = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const TODAY = fmt(new Date());

export default function CalendarScreen() {
  const { state, setState, T } = useApp();
  const { history, journal } = state;
  const events: CalEvent[] = (state as any).calEvents || [];

  const setEvents = (fn: (e: CalEvent[]) => CalEvent[]) => {
    setState((s: any) => ({ ...s, calEvents: fn(s.calEvents || []) }));
  };

  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [showAdd, setShowAdd] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', category: 'note' as CalEvent['category'], time: '', done: false });

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  // Build calendar days
  const { days, startOffset } = useMemo(() => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const offset = (first.getDay() + 6) % 7; // Mon=0
    const ds: string[] = [];
    for (let d = 1; d <= last.getDate(); d++) ds.push(fmt(new Date(year, month, d)));
    return { days: ds, startOffset: offset };
  }, [year, month]);

  // Map date → data
  const dayData = useMemo(() => {
    const map: Record<string, { workout?: boolean; mood?: number; hasEvent?: boolean; eventColors: string[] }> = {};
    days.forEach(d => {
      map[d] = {
        workout: history[d]?.completed,
        mood: journal.filter((j: any) => j.date === d).slice(-1)[0]?.mood,
        hasEvent: events.some(e => e.date === d),
        eventColors: events.filter(e => e.date === d).map(e => CAT_INFO[e.category]?.color || T.muted),
      };
    });
    return map;
  }, [days, history, journal, events]);

  const selectedDayData = dayData[selectedDate] || { eventColors: [] };
  const selectedEvents = events.filter(e => e.date === selectedDate).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const selectedWorkout = history[selectedDate];
  const selectedJournal = journal.filter((j: any) => j.date === selectedDate).slice(-1)[0];
  const selectedPlanDay = (() => { const d = new Date(selectedDate + 'T12:00:00'); const i = d.getDay() === 0 ? 6 : d.getDay() - 1; return PLAN[i]; })();

  const addEvent = () => {
    if (!newEvent.title.trim()) return;
    setEvents(prev => [...prev, { id: uid(), date: selectedDate, ...newEvent, title: newEvent.title.trim() }]);
    setNewEvent({ title: '', category: 'note', time: '', done: false });
    setShowAdd(false);
  };

  const toggleEvent = (id: string) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, done: !e.done } : e));
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const MOOD_EMOJI = ['', '😢', '😕', '😐', '🙂', '😊'];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} stickyHeaderIndices={[0]}>

        {/* Sticky Calendar Header */}
        <View style={{ backgroundColor: T.surf, borderBottomWidth: 1, borderBottomColor: T.bord }}>
          {/* Month nav */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
            <TouchableOpacity onPress={prevMonth} style={{ width: 34, height: 34, borderRadius: 10, borderWidth: 1, borderColor: T.bord, backgroundColor: T.lo, alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={16} color={T.muted} />
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 22, color: T.txt, letterSpacing: 0.5 }}>{MONTH_NAMES[month]}</Text>
              <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 12, color: T.muted }}>{year}</Text>
            </View>
            <TouchableOpacity onPress={nextMonth} style={{ width: 34, height: 34, borderRadius: 10, borderWidth: 1, borderColor: T.bord, backgroundColor: T.lo, alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={16} color={T.muted} />
            </TouchableOpacity>
          </View>

          {/* Day headers */}
          <View style={{ flexDirection: 'row', paddingHorizontal: 8, paddingBottom: 6 }}>
            {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => (
              <View key={d} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 11, color: T.muted, letterSpacing: 0.5 }}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={{ paddingHorizontal: 8, paddingBottom: 10 }}>
            {/* Build weeks */}
            {(() => {
              const allCells = [...Array(startOffset).fill(null), ...days];
              const weeks: (string | null)[][] = [];
              for (let i = 0; i < allCells.length; i += 7) weeks.push(allCells.slice(i, i + 7));
              return weeks.map((week, wi) => (
                <View key={wi} style={{ flexDirection: 'row', marginBottom: 4 }}>
                  {Array.from({ length: 7 }, (_, di) => {
                    const d = week[di];
                    if (!d) return <View key={di} style={{ flex: 1 }} />;
                    const data = dayData[d] || { eventColors: [] };
                    const isToday = d === TODAY;
                    const isSelected = d === selectedDate;
                    const hasWorkout = data.workout;
                    const hasMood = data.mood;
                    return (
                      <TouchableOpacity key={di} onPress={() => setSelectedDate(d)} style={{ flex: 1, alignItems: 'center', paddingVertical: 3 }}>
                        <View style={{
                          width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                          backgroundColor: isSelected ? T.primary : isToday ? T.primary + '22' : 'transparent',
                          borderWidth: isToday && !isSelected ? 1.5 : 0,
                          borderColor: T.primary,
                        }}>
                          <Text style={{ fontFamily: isToday || isSelected ? 'BarlowCondensed_900Black' : 'BarlowCondensed_700Bold', fontSize: 14, color: isSelected ? '#000' : isToday ? T.primary : T.txt }}>
                            {new Date(d + 'T12:00:00').getDate()}
                          </Text>
                        </View>
                        {/* Indicator dots */}
                        <View style={{ flexDirection: 'row', gap: 2, marginTop: 2, height: 5 }}>
                          {hasWorkout && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: T.success }} />}
                          {hasMood && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: T.warn }} />}
                          {data.eventColors.slice(0, 2).map((c, i) => <View key={i} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: c }} />)}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ));
            })()}
          </View>

          {/* Legend */}
          <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 14, paddingBottom: 10 }}>
            {[{ c: T.success, l: 'Тренировка' }, { c: T.warn, l: 'Настроение' }, { c: T.primary, l: 'Сегодня' }].map(x => (
              <View key={x.l} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: x.c }} />
                <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 10, color: T.muted }}>{x.l}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Selected day detail */}
        <View style={{ padding: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View>
              <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 20, color: T.txt }}>
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Text>
              {selectedDate === TODAY && (
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 12, color: T.primary, letterSpacing: 1 }}>СЕГОДНЯ</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => setShowAdd(true)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9, backgroundColor: T.primary, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Plus size={13} color="#000" />
              <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: '#000' }}>Событие</Text>
            </TouchableOpacity>
          </View>

          {/* Workout for this day */}
          {selectedPlanDay && (
            <Card T={T} style={{ marginBottom: 10, borderWidth: selectedWorkout?.completed ? 1.5 : 1, borderColor: selectedWorkout?.completed ? T.success + '66' : T.bord }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 22 }}>{selectedPlanDay.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 15, color: T.txt }}>{selectedPlanDay.name}</Text>
                  <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 12, color: T.muted }}>
                    {selectedPlanDay.type === 'rest' ? 'День отдыха' : selectedWorkout?.completed ? `✓ Выполнено · Сложность ${selectedWorkout.difficulty}/10` : `${selectedPlanDay.exercises?.length || 0} упражнений по плану`}
                  </Text>
                </View>
                {selectedWorkout?.completed && <Badge color={T.success} T={T}>✓</Badge>}
              </View>
            </Card>
          )}

          {/* Mood for this day */}
          {selectedJournal && (
            <Card T={T} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 24 }}>{MOOD_EMOJI[selectedJournal.mood || 3]}</Text>
                <View>
                  <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 14, color: T.txt }}>
                    {MOODS.find(m => m.v === selectedJournal.mood)?.l || 'Нейтр.'}
                    {selectedJournal.sleep ? ` · 💤 ${selectedJournal.sleep}ч` : ''}
                  </Text>
                  {selectedJournal.text ? <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 12, color: T.muted, marginTop: 2 }} numberOfLines={2}>{selectedJournal.text}</Text> : null}
                </View>
              </View>
            </Card>
          )}

          {/* Calendar events */}
          {selectedEvents.length === 0 && !selectedWorkout && !selectedJournal && (
            <View style={{ alignItems: 'center', paddingVertical: 24 }}>
              <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 14, color: T.muted }}>Нет событий. Нажми «+ Событие»</Text>
            </View>
          )}

          {selectedEvents.map(event => {
            const cat = CAT_INFO[event.category];
            return (
              <Card key={event.id} T={T} style={{ marginBottom: 8, borderLeftWidth: 4, borderLeftColor: cat.color, opacity: event.done ? 0.6 : 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <TouchableOpacity onPress={() => toggleEvent(event.id)} style={{ width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: event.done ? T.success : cat.color, backgroundColor: event.done ? T.success : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                    {event.done && <Check size={13} color="#000" strokeWidth={3} />}
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 15, color: T.txt, textDecorationLine: event.done ? 'line-through' : 'none' }}>{cat.emoji} {event.title}</Text>
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 2 }}>
                      {event.time && <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 11, color: T.muted }}>🕐 {event.time}</Text>}
                      <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 11, color: cat.color }}>{cat.label}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => deleteEvent(event.id)} style={{ padding: 4, opacity: 0.5 }}>
                    <X size={13} color={T.muted} />
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })}
        </View>
      </ScrollView>

      {/* Add event modal */}
      {showAdd && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }} onPress={() => setShowAdd(false)}>
            <Pressable onPress={() => {}}>
              <View style={{ backgroundColor: T.surf, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 18, color: T.txt }}>Новое событие</Text>
                  <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.muted }}>
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>

                <TextInput value={newEvent.title} onChangeText={v => setNewEvent(n => ({ ...n, title: v }))} placeholder="Название события…" placeholderTextColor={T.muted} autoFocus
                  style={{ height: 46, borderRadius: 10, borderWidth: 1.5, borderColor: T.primary, backgroundColor: T.lo, color: T.txt, fontFamily: 'BarlowCondensed_900Black', fontSize: 18, paddingHorizontal: 14, marginBottom: 12 }} />

                <TextInput value={newEvent.time} onChangeText={v => setNewEvent(n => ({ ...n, time: v }))} placeholder="Время (напр. 10:00)"  placeholderTextColor={T.muted} keyboardType="numbers-and-punctuation"
                  style={{ height: 40, borderRadius: 9, borderWidth: 1, borderColor: T.bord, backgroundColor: T.lo, color: T.txt, fontFamily: 'Barlow_400Regular', fontSize: 15, paddingHorizontal: 12, marginBottom: 12 }} />

                <Lbl T={T} style={{ marginBottom: 8 }}>Категория</Lbl>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
                  {Object.entries(CAT_INFO).map(([k, v]) => (
                    <TouchableOpacity key={k} onPress={() => setNewEvent(n => ({ ...n, category: k as any }))}
                      style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1.5, borderColor: newEvent.category === k ? v.color : T.bord, backgroundColor: newEvent.category === k ? v.color + '22' : T.lo, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Text style={{ fontSize: 13 }}>{v.emoji}</Text>
                      <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 12, color: newEvent.category === k ? v.color : T.muted }}>{v.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity onPress={() => setShowAdd(false)} style={{ flex: 1, height: 44, borderRadius: 10, borderWidth: 1, borderColor: T.bord, backgroundColor: T.lo, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 14, color: T.muted }}>Отмена</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={addEvent} disabled={!newEvent.title.trim()} style={{ flex: 2, height: 44, borderRadius: 10, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center', opacity: !newEvent.title.trim() ? 0.5 : 1 }}>
                    <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 15, color: '#000' }}>Добавить</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
}
