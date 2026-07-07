// src/v6/screens/V6Journal.tsx — HORIZON V6
//
// Дневник в v6 стиле. Timeline записей по дням.
// Структура:
//   • Header с кнопкой "Назад" и "+ Запись"
//   • Mood filter chips (горизонтальный скролл)
//   • Timeline — записи сгруппированы по дате
//   • FAB или inline кнопка для новой записи
import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Modal, TextInput } from 'react-native';
import { ChevronLeft, Plus, X } from 'lucide-react-native';
import { V6Background } from '../components/V6Background';
import { V6Card } from '../components/V6Card';
import { v6Colors, v6Typography, v6Geometry } from '../theme';
import { useApp } from '../../AppContext';
import { uid, TODAY } from '../../helpers';
import { MOODS, ENERGY } from '../../data';

export function V6Journal({ onBack }: { onBack: () => void }) {
  const { state, setState } = useApp();
  const journal = state.journal || [];
  const [filterMood, setFilterMood] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [jText, setJText] = useState('');
  const [jMood, setJMood] = useState(3);
  const [jEnergy, setJEnergy] = useState(3);
  const [jSleep, setJSleep] = useState(7);

  const filtered = useMemo(() => {
    let arr = filterMood !== null ? journal.filter(j => j.mood === filterMood) : journal;
    return arr.sort((a, b) => b.date > a.date ? 1 : -1);
  }, [journal, filterMood]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: { date: string; label: string; entries: typeof filtered }[] = [];
    filtered.forEach(e => {
      let g = groups.find(g => g.date === e.date);
      if (!g) {
        const d = new Date(e.date + 'T12:00:00');
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const yest = new Date(today); yest.setDate(yest.getDate() - 1);
        const label = d.toDateString() === today.toDateString() ? 'Сегодня'
          : d.toDateString() === yest.toDateString() ? 'Вчера'
          : d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
        g = { date: e.date, label, entries: [] };
        groups.push(g);
      }
      g.entries.push(e);
    });
    return groups;
  }, [filtered]);

  const saveJournal = () => {
    if (!jText.trim()) return;
    setState(s => ({
      ...s,
      journal: [{
        id: uid(), date: TODAY, text: jText.trim(),
        mood: jMood, energy: jEnergy, sleep: jSleep,
        waterGlasses: 0, createdAt: new Date().toISOString(),
      }, ...s.journal],
    }));
    setJText(''); setJMood(3); setJEnergy(3); setJSleep(7);
    setShowAdd(false);
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
          <Text style={[v6Typography.title2, { color: v6Colors.textPrimary }]}>Дневник</Text>
          <Text style={[v6Typography.micro, { color: v6Colors.textTertiary, marginTop: 2 }]}>
            {journal.length} записей
          </Text>
        </View>
        <Pressable
          onPress={() => setShowAdd(true)}
          style={({ pressed }) => [
            styles.addBtn,
            { transform: [{ scale: pressed ? 0.92 : 1 }] },
          ]}
        >
          <Plus size={20} color={v6Colors.accentText} />
        </Pressable>
      </View>

      {/* Mood filter */}
      {journal.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: v6Geometry.screenPadding, gap: 8, paddingBottom: 12 }}
        >
          <Pressable
            onPress={() => setFilterMood(null)}
            style={[
              styles.chip,
              filterMood === null && { backgroundColor: v6Colors.accentSoft, borderColor: v6Colors.accent },
            ]}
          >
            <Text style={[
              v6Typography.caption,
              { color: filterMood === null ? v6Colors.accent : v6Colors.textTertiary },
            ]}>Все</Text>
          </Pressable>
          {MOODS.map(m => (
            <Pressable
              key={m.v}
              onPress={() => setFilterMood(filterMood === m.v ? null : m.v)}
              style={[
                styles.chip,
                filterMood === m.v && { backgroundColor: v6Colors.accentSoft, borderColor: v6Colors.accent },
              ]}
            >
              <Text style={{ fontSize: 14 }}>{m.e}</Text>
              <Text style={[
                v6Typography.caption,
                { color: filterMood === m.v ? v6Colors.accent : v6Colors.textTertiary },
              ]}>{m.l}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Timeline */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: v6Geometry.screenPadding, paddingBottom: 120, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
      >
        {grouped.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📔</Text>
            <Text style={[v6Typography.title2, { color: v6Colors.textPrimary }]}>
              {filterMood !== null ? 'Ничего не найдено' : 'Дневник пуст'}
            </Text>
            <Text style={[v6Typography.body, { color: v6Colors.textSecondary, marginTop: 8, textAlign: 'center' }]}>
              {filterMood !== null ? 'Измени фильтр' : 'Записывай мысли, настроение и сон каждый день'}
            </Text>
          </View>
        )}

        {grouped.map(group => (
          <View key={group.date} style={{ marginBottom: 24 }}>
            {/* Date header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <View style={{
                width: 6, height: 6, borderRadius: 3,
                backgroundColor: group.date === TODAY ? v6Colors.accent : v6Colors.textTertiary,
              }} />
              <Text style={[
                v6Typography.caption,
                {
                  color: group.date === TODAY ? v6Colors.accent : v6Colors.textTertiary,
                  textTransform: 'uppercase', letterSpacing: 1, flex: 1,
                },
              ]}>
                {group.label}
              </Text>
              <Text style={[v6Typography.micro, { color: v6Colors.textTertiary }]}>
                {group.entries.length} зап.
              </Text>
            </View>

            {/* Entries */}
            {group.entries.map(entry => {
              const m = MOODS.find(x => x.v === entry.mood);
              const en = ENERGY.find(x => x.v === entry.energy);
              return (
                <V6Card key={entry.id} style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Text style={{ fontSize: 24 }}>{m?.e}</Text>
                    {entry.energy && <Text style={{ fontSize: 18, opacity: 0.6 }}>{en?.e}</Text>}
                    {entry.sleep && (
                      <View style={styles.pill}>
                        <Text style={[v6Typography.micro, { color: v6Colors.textTertiary }]}>
                          😴 {entry.sleep}ч
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }} />
                    <Pressable
                      onPress={() => setState(s => ({ ...s, journal: s.journal.filter(x => x.id !== entry.id) }))}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={14} color={v6Colors.textTertiary} />
                    </Pressable>
                  </View>
                  {entry.text && (
                    <Text style={[v6Typography.body, { color: v6Colors.textPrimary, lineHeight: 22 }]}>
                      {entry.text}
                    </Text>
                  )}
                </V6Card>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowAdd(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[v6Typography.title2, { color: v6Colors.textPrimary }]}>Новая запись</Text>
              <Pressable onPress={() => setShowAdd(false)} style={styles.closeBtn}>
                <X size={16} color={v6Colors.textTertiary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Mood */}
              <Text style={[v6Typography.caption, { color: v6Colors.textTertiary, marginBottom: 8, textTransform: 'uppercase' }]}>
                Настроение
              </Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
                {MOODS.map(m => (
                  <Pressable
                    key={m.v}
                    onPress={() => setJMood(m.v)}
                    style={[
                      styles.moodBtn,
                      jMood === m.v && { backgroundColor: v6Colors.accentSoft, borderColor: v6Colors.accent },
                    ]}
                  >
                    <Text style={{ fontSize: 22 }}>{m.e}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Energy */}
              <Text style={[v6Typography.caption, { color: v6Colors.textTertiary, marginBottom: 8, textTransform: 'uppercase' }]}>
                Энергия
              </Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
                {ENERGY.map(e => (
                  <Pressable
                    key={e.v}
                    onPress={() => setJEnergy(e.v)}
                    style={[
                      styles.moodBtn,
                      jEnergy === e.v && { backgroundColor: v6Colors.accentSoft, borderColor: v6Colors.accent },
                    ]}
                  >
                    <Text style={{ fontSize: 20 }}>{e.e}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Sleep */}
              <Text style={[v6Typography.caption, { color: v6Colors.textTertiary, marginBottom: 8, textTransform: 'uppercase' }]}>
                Сон: {jSleep}ч
              </Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
                {[4, 5, 6, 7, 8, 9].map(h => (
                  <Pressable
                    key={h}
                    onPress={() => setJSleep(h)}
                    style={[
                      styles.sleepBtn,
                      jSleep === h && { backgroundColor: v6Colors.accentSoft, borderColor: v6Colors.accent },
                    ]}
                  >
                    <Text style={[
                      v6Typography.bodyMedium,
                      { color: jSleep === h ? v6Colors.accent : v6Colors.textTertiary },
                    ]}>{h}ч</Text>
                  </Pressable>
                ))}
              </View>

              {/* Text */}
              <TextInput
                value={jText}
                onChangeText={setJText}
                placeholder="Мысли, идеи, наблюдения..."
                placeholderTextColor={v6Colors.textTertiary}
                multiline
                style={styles.textInput}
              />

              {/* Save */}
              <Pressable
                onPress={saveJournal}
                disabled={!jText.trim()}
                style={({ pressed }) => [
                  styles.saveBtn,
                  { opacity: !jText.trim() ? 0.4 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
                ]}
              >
                <Text style={[v6Typography.bodyMedium, { color: v6Colors.accentText }]}>
                  Сохранить запись
                </Text>
              </Pressable>
            </ScrollView>
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
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1, borderColor: v6Colors.divider,
    backgroundColor: v6Colors.card,
  },
  pill: {
    paddingHorizontal: 8, paddingVertical: 2,
    backgroundColor: v6Colors.accentSoft, borderRadius: 6,
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
  moodBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, borderColor: v6Colors.divider,
    backgroundColor: v6Colors.card,
    alignItems: 'center',
  },
  sleepBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: v6Colors.divider,
    backgroundColor: v6Colors.card, alignItems: 'center',
  },
  textInput: {
    minHeight: 100, borderRadius: 12,
    backgroundColor: v6Colors.card, borderWidth: 1, borderColor: v6Colors.divider,
    paddingHorizontal: 14, paddingVertical: 12,
    color: v6Colors.textPrimary,
    fontFamily: v6Typography.body.fontFamily,
    fontSize: v6Typography.body.fontSize,
    lineHeight: v6Typography.body.lineHeight,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  saveBtn: {
    height: 50, borderRadius: v6Geometry.btnRadius,
    backgroundColor: v6Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
});
