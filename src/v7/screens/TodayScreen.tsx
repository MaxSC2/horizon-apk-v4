// src/v7/screens/TodayScreen.tsx — HORIZON V7
//
// Главный экран = история дня. Не список карточек.
//
// «Доброе утро.
//  Сегодня.
//  Life Score 87%
//  █████████████
//  Сегодня ты уже:
//  ✓ Спал
//  ✓ Выпил 800мл
//  ✓ Сделал зарядку
//  ○ Записал настроение
//  ○ Выполнил главную цель
//  Продолжить сегодняшний день →»
import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Dimensions } from 'react-native';
import { ChevronRight, Sparkles } from 'lucide-react-native';
import { V7Background } from '../components/Background';
import { V7Theme } from '../themes';
import { AppState } from '../../types';
import { calculateScores, getTodayChecklist, getAIInsights, ChecklistItem, AIInsight } from '../lib/scores';

const { width: W } = Dimensions.get('window');

interface Props {
  theme: V7Theme;
  state: AppState;
  onNavigate: (screen: string) => void;
  onSwitchTheme: () => void;
}

export function TodayScreen({ theme, state, onNavigate, onSwitchTheme }: Props) {
  const scores = calculateScores(state);
  const checklist = getTodayChecklist(state);
  const insights = getAIInsights(state);
  const doneCount = checklist.filter(c => c.done).length;
  const today = new Date();
  const dateStr = today.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
  const hour = today.getHours();
  const greeting = hour < 6 ? 'Доброй ночи' : hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер';
  const periodEmoji = hour < 6 ? '🌙' : hour < 12 ? '🌅' : hour < 18 ? '☀️' : '🌆';

  return (
    <View style={{ flex: 1, backgroundColor: theme.void }}>
      <V7Background theme={theme} />

      <ScrollView
        contentContainerStyle={{ paddingTop: 70, paddingHorizontal: 24, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Story header ── */}
        <View style={{ marginBottom: 32 }}>
          <Text style={[styles(theme).micro, { color: theme.textTertiary, textTransform: 'capitalize' }]}>
            {periodEmoji} {dateStr}
          </Text>
          <Text style={[styles(theme).display, { color: theme.text, marginTop: 8 }]}>
            {greeting}.
          </Text>
          <Text style={[styles(theme).title, { color: theme.textSecondary, marginTop: 4 }]}>
            Сегодня.
          </Text>
        </View>

        {/* ── Life Score — большой, как в ТЗ ── */}
        <View style={{ marginBottom: 28 }}>
          <Text style={[styles(theme).micro, { color: theme.textTertiary, textTransform: 'uppercase', letterSpacing: 1.5 }]}>
            Life Score
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
            <Text style={[styles(theme).display, { fontSize: 64, color: theme.text }]}>
              {scores.life}
            </Text>
            <Text style={[styles(theme).title, { color: theme.textTertiary, fontSize: 24 }]}>
              /100
            </Text>
          </View>
          {/* Progress bar — широкий, с glow */}
          <View style={{
            marginTop: 12, height: 8,
            backgroundColor: theme.divider, borderRadius: 4, overflow: 'hidden',
          }}>
            <View style={{
              width: `${scores.life}%`, height: '100%',
              backgroundColor: theme.accent, borderRadius: 4,
              shadowColor: theme.accent, shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6, shadowRadius: 8,
            }} />
          </View>
          {/* Под-скоры */}
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 16 }}>
            <SubScore theme={theme} label="Фокус" value={scores.focus} />
            <SubScore theme={theme} label="Восст." value={scores.recovery} />
            <SubScore theme={theme} label="Баланс" value={scores.balance} />
          </View>
        </View>

        {/* ── Checklist — «Сегодня ты уже:» ── */}
        <View style={{ marginBottom: 28 }}>
          <Text style={[styles(theme).body, { color: theme.textSecondary, marginBottom: 12 }]}>
            Сегодня ты уже:
          </Text>
          {checklist.map(item => (
            <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
              <View style={{
                width: 24, height: 24, borderRadius: 6,
                borderWidth: 2, borderColor: item.done ? theme.success : theme.textTertiary,
                backgroundColor: item.done ? theme.success : 'transparent',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {item.done && <Text style={{ color: theme.dark ? '#000' : '#fff', fontSize: 14, fontWeight: '700' }}>✓</Text>}
              </View>
              <Text style={{ fontSize: 18 }}>{item.emoji}</Text>
              <Text style={[
                styles(theme).body,
                { color: item.done ? theme.text : theme.textTertiary, flex: 1, textDecorationLine: item.done ? 'none' : 'none' },
              ]}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>

        {/* ── AI Insight — контекстная подсказка ── */}
        {insights.length > 0 && (
          <Pressable
            onPress={() => onNavigate('ai')}
            style={({ pressed }) => [{
              backgroundColor: theme.accentSoft,
              borderRadius: 16, padding: 16,
              marginBottom: 28,
              flexDirection: 'row', alignItems: 'flex-start', gap: 12,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            }]}
          >
            <View style={{
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: theme.accent,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={16} color={theme.accentText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles(theme).micro, { color: theme.accent, textTransform: 'uppercase', letterSpacing: 1 }]}>
                AI подсказка
              </Text>
              <Text style={[styles(theme).body, { color: theme.text, marginTop: 4 }]}>
                {insights[0].text}
              </Text>
            </View>
          </Pressable>
        )}

        {/* ── CTA — «Продолжить сегодняшний день» ── */}
        <Pressable
          onPress={() => {
            // Перейти к первой невыполненной задаче
            const next = checklist.find(c => !c.done);
            if (next?.id === 'workout') onNavigate('train');
            else if (next?.id === 'mood' || next?.id === 'sleep') onNavigate('journal');
            else if (next?.id === 'water') onNavigate('journal');
            else if (next?.id === 'goals') onNavigate('tasks');
            else onNavigate('timeline');
          }}
          style={({ pressed }) => [{
            backgroundColor: theme.accent,
            borderRadius: 16, paddingVertical: 18, paddingHorizontal: 24,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 28,
            transform: [{ scale: pressed ? 0.98 : 1 }],
            shadowColor: theme.accent, shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
          }]}
        >
          <View>
            <Text style={[styles(theme).body, { color: theme.accentText, fontWeight: '600' }]}>
              Продолжить сегодняшний день
            </Text>
            {doneCount < checklist.length && (
              <Text style={[styles(theme).micro, { color: theme.accentText, opacity: 0.7, marginTop: 2 }]}>
                Осталось {checklist.length - doneCount} из {checklist.length}
              </Text>
            )}
          </View>
          <ChevronRight size={22} color={theme.accentText} />
        </Pressable>

        {/* ── Bento grid — модульные карточки ── */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          {/* Сон — квадрат */}
          <BentoCard theme={theme} size="square" emoji="😴" label="Сон" value={`${scores.sleep}%`} accent={theme.accent} onPress={() => onNavigate('journal')} />
          {/* Вода — квадрат */}
          <BentoCard theme={theme} size="square" emoji="💧" label="Вода" value={`${scores.hydration}%`} accent={theme.success} onPress={() => onNavigate('journal')} />
          {/* Тренировка — широкая */}
          <BentoCard theme={theme} size="wide" emoji="💪" label="Активность" value={`${scores.activity}%`} accent={theme.warning} onPress={() => onNavigate('train')} />
          {/* Настроение — квадрат */}
          <BentoCard theme={theme} size="square" emoji="😊" label="Настроение" value={`${scores.mood}%`} accent="#BF5AF2" onPress={() => onNavigate('journal')} />
          {/* Цели — квадрат */}
          <BentoCard theme={theme} size="square" emoji="🎯" label="Цели" value={`${scores.goals}%`} accent={theme.danger} onPress={() => onNavigate('tasks')} />
        </View>

        {/* ── Theme switch hint ── */}
        <Pressable
          onPress={onSwitchTheme}
          style={({ pressed }) => [{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            paddingVertical: 12,
            opacity: pressed ? 0.6 : 1,
          }]}
        >
          <Text style={{ fontSize: 16 }}>{theme.emoji}</Text>
          <Text style={[styles(theme).caption, { color: theme.textTertiary }]}>
            Тема: {theme.name} · сменить
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

// ── Sub-score ──────────────────────────────────────────────────────────────
function SubScore({ theme, label, value }: { theme: V7Theme; label: string; value: number }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[styles(theme).micro, { color: theme.textTertiary, textTransform: 'uppercase' }]}>
        {label}
      </Text>
      <Text style={[styles(theme).title, { color: theme.text, fontSize: 22, marginTop: 2 }]}>
        {value}
      </Text>
    </View>
  );
}

// ── Bento card ─────────────────────────────────────────────────────────────
function BentoCard({
  theme, size, emoji, label, value, accent, onPress,
}: {
  theme: V7Theme;
  size: 'square' | 'wide';
  emoji: string;
  label: string;
  value: string;
  accent: string;
  onPress: () => void;
}) {
  const width = size === 'wide' ? '100%' : '48%';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{
        width: width as any,
        backgroundColor: theme.card,
        borderRadius: 16, padding: 16,
        flexDirection: 'row', alignItems: 'center', gap: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: theme.dark ? 0.3 : 0.08, shadowRadius: 8, elevation: 4,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      }]}
    >
      <View style={{
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: accent + '22',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 20 }}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles(theme).micro, { color: theme.textTertiary, textTransform: 'uppercase' }]}>
          {label}
        </Text>
        <Text style={[styles(theme).title, { color: theme.text, fontSize: 20, marginTop: 2 }]}>
          {value}
        </Text>
      </View>
    </Pressable>
  );
}

function styles(theme: V7Theme) {
  return StyleSheet.create({
    display: { fontFamily: 'BarlowCondensed_900Black', fontSize: 48, letterSpacing: -1, lineHeight: 52 },
    title: { fontFamily: 'BarlowCondensed_900Black', fontSize: 26, letterSpacing: -0.3, lineHeight: 30 },
    body: { fontFamily: 'Barlow_400Regular', fontSize: 16, letterSpacing: 0, lineHeight: 22 },
    bodyMedium: { fontFamily: 'Barlow_500Medium', fontSize: 15, letterSpacing: 0, lineHeight: 20 },
    caption: { fontFamily: 'Barlow_500Medium', fontSize: 13, letterSpacing: 0.2, lineHeight: 16 },
    micro: { fontFamily: 'Barlow_500Medium', fontSize: 11, letterSpacing: 0.5, lineHeight: 14 },
  });
}
