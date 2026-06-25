// src/v5/screens/V5Home.tsx — HORIZON V5
//
// Главная страница V5. Showcase всех возможностей темы:
// - Hero блок с display-типографикой
// - Quick stats с кастомными карточками
// - AI prompt card
// - Theme switcher preview
import React from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useV5 } from '../V5Context';
import { V5Background } from '../components/V5Background';
import { V5Card } from '../components/V5Card';
import { V5Text } from '../components/V5Text';

export function V5Home() {
  const { theme, setActiveScreen } = useV5();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.void }]}>
      <V5Background theme={theme} />

      <ScrollView
        contentContainerStyle={{ paddingTop: 60, paddingHorizontal: theme.geometry.screenPadding, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={{ marginBottom: theme.geometry.sectionGap }}>
          <V5Text theme={theme} variant="caption" style={{ color: theme.colors.glow, marginBottom: 8 }}>
            {theme.emoji} {theme.tagline}
          </V5Text>
          <V5Text theme={theme} variant="display">
            ГОРИЗОНТ
          </V5Text>
          <V5Text theme={theme} variant="caption" style={{ marginTop: 4 }}>
            Life Tracking System · v5.0
          </V5Text>
        </View>

        {/* System Stats Card */}
        <V5Card theme={theme} label="STATS" emphasized style={{ marginBottom: theme.geometry.cardGap }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <V5Text theme={theme} variant="caption">CURRENT LEVEL</V5Text>
              <V5Text theme={theme} variant="display" style={{ fontSize: 32 }}>
                07
              </V5Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <V5Text theme={theme} variant="caption">STREAK</V5Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <V5Text theme={theme} variant="display" style={{ fontSize: 32, color: theme.colors.glow }}>
                  12
                </V5Text>
                <V5Text theme={theme} variant="caption" style={{ marginLeft: 4 }}>
                  дн
                </V5Text>
              </View>
            </View>
          </View>
          {/* Progress bar */}
          <View style={{
            marginTop: 16, height: 4, backgroundColor: theme.colors.border,
            borderRadius: 2, overflow: 'hidden',
          }}>
            <View style={{
              width: '68%', height: '100%', backgroundColor: theme.colors.glow,
              shadowColor: theme.colors.glow, shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8, shadowRadius: 4,
            }} />
          </View>
          <V5Text theme={theme} variant="caption" style={{ marginTop: 8, textAlign: 'center' }}>
            680 / 1000 XP TO NEXT LEVEL
          </V5Text>
        </V5Card>

        {/* Quick Actions Grid */}
        <View style={{
          flexDirection: 'row', gap: theme.geometry.cardGap,
          marginBottom: theme.geometry.cardGap,
        }}>
          <V5Card theme={theme} style={{ flex: 1 }} onPress={() => setActiveScreen('train')}>
            <V5Text theme={theme} variant="mono" style={{ fontSize: 24, textAlign: 'center' }}>⚔️</V5Text>
            <V5Text theme={theme} variant="caption" style={{ textAlign: 'center', marginTop: 4 }}>
              ТРЕНИРОВКА
            </V5Text>
          </V5Card>
          <V5Card theme={theme} style={{ flex: 1 }} onPress={() => setActiveScreen('journal')}>
            <V5Text theme={theme} variant="mono" style={{ fontSize: 24, textAlign: 'center' }}>📔</V5Text>
            <V5Text theme={theme} variant="caption" style={{ textAlign: 'center', marginTop: 4 }}>
              ДНЕВНИК
            </V5Text>
          </V5Card>
          <V5Card theme={theme} style={{ flex: 1 }} onPress={() => setActiveScreen('ai')}>
            <V5Text theme={theme} variant="mono" style={{ fontSize: 24, textAlign: 'center' }}>🤖</V5Text>
            <V5Text theme={theme} variant="caption" style={{ textAlign: 'center', marginTop: 4 }}>
              НЕЙРО
            </V5Text>
          </V5Card>
        </View>

        {/* AI Prompt Card */}
        <V5Card theme={theme} label="AI" emphasized style={{ marginBottom: theme.geometry.cardGap }}>
          <V5Text theme={theme} variant="caption" style={{ color: theme.colors.glow, marginBottom: 8 }}>
            NEURAL ASSISTANT
          </V5Text>
          <V5Text theme={theme} variant="title" style={{ marginBottom: 8 }}>
            Что тебя беспокоит?
          </V5Text>
          <V5Text theme={theme} variant="body" style={{ color: theme.colors.textMuted, marginBottom: 16 }}>
            AI-коуч проанализирует твои данные и даст персональный совет
          </V5Text>
          <Pressable
            onPress={() => setActiveScreen('ai')}
            style={({ pressed }) => [{
              backgroundColor: theme.colors.glow,
              padding: 12, borderRadius: theme.geometry.btnRadius,
              alignItems: 'center',
              transform: [{ scale: pressed ? theme.motion.pressScale : 1 }],
              shadowColor: theme.colors.glow,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4, shadowRadius: 12, elevation: 4,
            }]}
          >
            <V5Text theme={theme} variant="mono" style={{ color: theme.colors.void, letterSpacing: 1 }}>
              → ОТКРЫТЬ ЧАТ
            </V5Text>
          </Pressable>
        </V5Card>

        {/* Today's Quest */}
        <V5Card theme={theme} label="QUEST" style={{ marginBottom: theme.geometry.cardGap }}>
          <V5Text theme={theme} variant="caption" style={{ color: theme.colors.warning, marginBottom: 6 }}>
            АКТИВНЫЙ КВЕСТ
          </V5Text>
          <V5Text theme={theme} variant="title" style={{ marginBottom: 8 }}>
            Дневная тренировка
          </V5Text>
          <V5Text theme={theme} variant="caption">
            Тренировка · 5 упражнений · награда 150 XP
          </V5Text>
        </V5Card>

        {/* Theme-specific feature card */}
        <V5Card theme={theme} label="SYSTEM" style={{ marginBottom: theme.geometry.cardGap }}>
          <V5Text theme={theme} variant="title" style={{ marginBottom: 12 }}>
            {theme.description}
          </V5Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {Object.entries(theme.features).filter(([_, v]) => v).map(([k]) => (
              <View key={k} style={{
                paddingHorizontal: 8, paddingVertical: 4,
                backgroundColor: theme.colors.glow + '15',
                borderRadius: 4, borderWidth: 1, borderColor: theme.colors.glow + '44',
              }}>
                <V5Text theme={theme} variant="caption" style={{ color: theme.colors.glow, fontSize: 9 }}>
                  {k.toUpperCase()}
                </V5Text>
              </View>
            ))}
          </View>
        </V5Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
