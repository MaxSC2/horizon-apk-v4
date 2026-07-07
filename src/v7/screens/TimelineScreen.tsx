// src/v7/screens/TimelineScreen.tsx — HORIZON V7
//
// Timeline — день как лента событий.
// 07:10 😴 Проснулся — Сон 7.5ч
// 08:30 💧 Выпил воду — 4 стакана
// 09:00 ✓ Привычка выполнена
// 18:00 🏋️ Тренировка — Сложность 7/10
// 21:00 😊 Записал настроение — 4/5
// 22:30 🌙 Подготовка ко сну
//
// AI видит эту ленту и делает выводы.
import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { ChevronLeft, Sparkles } from 'lucide-react-native';
import { V7Background } from '../components/Background';
import { V7Theme } from '../themes';
import { AppState } from '../../types';
import { getTodayTimeline, getAIInsights } from '../lib/scores';

interface Props {
  theme: V7Theme;
  state: AppState;
  onBack: () => void;
}

export function TimelineScreen({ theme, state, onBack }: Props) {
  const events = getTodayTimeline(state);
  const insights = getAIInsights(state);
  const today = new Date();
  const dateStr = today.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <View style={{ flex: 1, backgroundColor: theme.void }}>
      <V7Background theme={theme} />

      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 24, paddingTop: 60, paddingBottom: 8,
      }}>
        <Pressable onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ChevronLeft size={22} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[s(theme).title, { color: theme.text }]}>Лента дня</Text>
          <Text style={[s(theme).micro, { color: theme.textTertiary, textTransform: 'capitalize', marginTop: 2 }]}>
            {dateStr}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Timeline */}
        <View style={{ position: 'relative' }}>
          {/* Vertical line */}
          <View style={{
            position: 'absolute', left: 28, top: 8, bottom: 8,
            width: 2, backgroundColor: theme.divider,
          }} />

          {events.map((event, i) => (
            <View key={event.id} style={{ flexDirection: 'row', gap: 16, marginBottom: 24 }}>
              {/* Time */}
              <View style={{ width: 56, alignItems: 'flex-end', paddingTop: 2 }}>
                <Text style={[s(theme).micro, { color: theme.textTertiary, fontFamily: 'Barlow_500Medium' }]}>
                  {event.time}
                </Text>
              </View>

              {/* Dot */}
              <View style={{
                width: 16, height: 16, borderRadius: 8,
                backgroundColor: theme.accent, marginTop: 2,
                borderWidth: 3, borderColor: theme.void,
                shadowColor: theme.accent, shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5, shadowRadius: 4,
                zIndex: 1,
              }} />

              {/* Content */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 18 }}>{event.emoji}</Text>
                  <Text style={[s(theme).body, { color: theme.text, fontWeight: '500' }]}>
                    {event.title}
                  </Text>
                </View>
                {event.detail && (
                  <Text style={[s(theme).caption, { color: theme.textTertiary, marginTop: 2 }]}>
                    {event.detail}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* AI summary — «AI видит эту ленту и делает выводы» */}
        {insights.length > 0 && (
          <View style={{
            backgroundColor: theme.accentSoft,
            borderRadius: 16, padding: 16, marginTop: 8,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <View style={{
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: theme.accent,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={14} color={theme.accentText} />
              </View>
              <Text style={[s(theme).caption, { color: theme.accent, textTransform: 'uppercase', letterSpacing: 1 }]}>
                AI анализ дня
              </Text>
            </View>
            {insights.map((ins, i) => (
              <View key={ins.id} style={{ flexDirection: 'row', gap: 8, marginTop: i > 0 ? 8 : 0 }}>
                <Text style={{ fontSize: 14 }}>{ins.emoji}</Text>
                <Text style={[s(theme).body, { color: theme.text, flex: 1 }]}>
                  {ins.text}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function s(theme: V7Theme) {
  return StyleSheet.create({
    display: { fontFamily: 'BarlowCondensed_900Black', fontSize: 48, letterSpacing: -1, lineHeight: 52 },
    title: { fontFamily: 'BarlowCondensed_900Black', fontSize: 26, letterSpacing: -0.3, lineHeight: 30 },
    body: { fontFamily: 'Barlow_400Regular', fontSize: 16, letterSpacing: 0, lineHeight: 22 },
    caption: { fontFamily: 'Barlow_500Medium', fontSize: 13, letterSpacing: 0.2, lineHeight: 16 },
    micro: { fontFamily: 'Barlow_500Medium', fontSize: 11, letterSpacing: 0.5, lineHeight: 14 },
  });
}
