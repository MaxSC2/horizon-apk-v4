// src/v5/screens/V5Home.tsx — HORIZON V5.1
//
// v5.1: Улучшенная иерархия, контраст, читаемость по результатам VLM аудита:
//   • Белый текст вместо серого (был "нечитаемый серый на чёрном")
//   • Чёткая иерархия размеров (display 48 → title 22 → body 15 → caption 12)
//   • Акцентные блоки с разным визуальным весом
//   • Контрастные прогресс-бары с glow
//   • Лучшее разделение секций
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
        contentContainerStyle={{
          paddingTop: 70,
          paddingHorizontal: theme.geometry.screenPadding,
          paddingBottom: 140,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero — крупная типографика с акцентом */}
        <View style={{ marginBottom: theme.geometry.sectionGap + 4 }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            marginBottom: 12,
          }}>
            <View style={{
              width: 8, height: 8, borderRadius: 4,
              backgroundColor: theme.colors.glow,
              shadowColor: theme.colors.glow, shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1, shadowRadius: 6,
            }} />
            <V5Text theme={theme} variant="caption" style={{ color: theme.colors.glow }}>
              {theme.tagline}
            </V5Text>
          </View>
          <V5Text theme={theme} variant="display">
            ГОРИЗОНТ
          </V5Text>
          <V5Text theme={theme} variant="body" style={{
            color: theme.colors.text,  // белый вместо серого
            marginTop: 6, opacity: 0.7,
          }}>
            Life Tracking System · v5.1
          </V5Text>
        </View>

        {/* Hero stat — Level + Streak, крупные цифры */}
        <V5Card theme={theme} label="STATS" emphasized style={{ marginBottom: theme.geometry.cardGap }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <V5Text theme={theme} variant="caption" style={{ color: theme.colors.textMuted, marginBottom: 6 }}>
                CURRENT LEVEL
              </V5Text>
              <V5Text theme={theme} variant="display" style={{ fontSize: 44, lineHeight: 48 }}>
                07
              </V5Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <V5Text theme={theme} variant="caption" style={{ color: theme.colors.textMuted, marginBottom: 6 }}>
                STREAK
              </V5Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <V5Text theme={theme} variant="display" style={{ fontSize: 44, lineHeight: 48, color: theme.colors.glow }}>
                  12
                </V5Text>
                <V5Text theme={theme} variant="title" style={{ marginLeft: 4, color: theme.colors.glow, fontSize: 18 }}>
                  дн
                </V5Text>
              </View>
            </View>
          </View>
          {/* Прогресс-бар с glow */}
          <View style={{
            marginTop: 20, height: 6,
            backgroundColor: theme.colors.border,
            borderRadius: 3, overflow: 'hidden',
          }}>
            <View style={{
              width: '68%', height: '100%',
              backgroundColor: theme.colors.glow,
              shadowColor: theme.colors.glow,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.9, shadowRadius: 8, elevation: 4,
            }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <V5Text theme={theme} variant="caption" style={{ color: theme.colors.text }}>
              680 XP
            </V5Text>
            <V5Text theme={theme} variant="caption" style={{ color: theme.colors.textMuted }}>
              1000 XP до уровня 8
            </V5Text>
          </View>
        </V5Card>

        {/* Quick Actions — 3 крупные кнопки с иконками */}
        <View style={{
          flexDirection: 'row', gap: theme.geometry.cardGap,
          marginBottom: theme.geometry.cardGap,
        }}>
          <Pressable
            onPress={() => setActiveScreen('train')}
            style={({ pressed }) => [{
              flex: 1,
              backgroundColor: theme.colors.elevated,
              borderRadius: theme.geometry.cardRadius,
              borderWidth: theme.geometry.cardBorderWidth,
              borderColor: theme.colors.border,
              padding: 14,
              alignItems: 'center',
              transform: [{ scale: pressed ? theme.motion.pressScale : 1 }],
            }]}
          >
            <View style={{
              width: 40, height: 40, borderRadius: theme.geometry.iconRadius,
              backgroundColor: theme.colors.glow + '22',
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 8,
            }}>
              <V5Text theme={theme} variant="mono" style={{ fontSize: 22 }}>⚔️</V5Text>
            </View>
            <V5Text theme={theme} variant="caption" style={{ color: theme.colors.text, textAlign: 'center' }}>
              ТРЕНИРОВКА
            </V5Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveScreen('journal')}
            style={({ pressed }) => [{
              flex: 1,
              backgroundColor: theme.colors.elevated,
              borderRadius: theme.geometry.cardRadius,
              borderWidth: theme.geometry.cardBorderWidth,
              borderColor: theme.colors.border,
              padding: 14,
              alignItems: 'center',
              transform: [{ scale: pressed ? theme.motion.pressScale : 1 }],
            }]}
          >
            <View style={{
              width: 40, height: 40, borderRadius: theme.geometry.iconRadius,
              backgroundColor: theme.colors.glow + '22',
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 8,
            }}>
              <V5Text theme={theme} variant="mono" style={{ fontSize: 22 }}>📔</V5Text>
            </View>
            <V5Text theme={theme} variant="caption" style={{ color: theme.colors.text, textAlign: 'center' }}>
              ДНЕВНИК
            </V5Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveScreen('ai')}
            style={({ pressed }) => [{
              flex: 1,
              backgroundColor: theme.colors.elevated,
              borderRadius: theme.geometry.cardRadius,
              borderWidth: theme.geometry.cardBorderWidth,
              borderColor: theme.colors.border,
              padding: 14,
              alignItems: 'center',
              transform: [{ scale: pressed ? theme.motion.pressScale : 1 }],
            }]}
          >
            <View style={{
              width: 40, height: 40, borderRadius: theme.geometry.iconRadius,
              backgroundColor: theme.colors.glow + '22',
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 8,
            }}>
              <V5Text theme={theme} variant="mono" style={{ fontSize: 22 }}>🤖</V5Text>
            </View>
            <V5Text theme={theme} variant="caption" style={{ color: theme.colors.text, textAlign: 'center' }}>
              НЕЙРО AI
            </V5Text>
          </Pressable>
        </View>

        {/* AI Prompt — крупный CTA */}
        <V5Card theme={theme} label="AI" emphasized style={{ marginBottom: theme.geometry.cardGap }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <View style={{
              width: 32, height: 32, borderRadius: theme.geometry.iconRadius,
              backgroundColor: theme.colors.glow,
              alignItems: 'center', justifyContent: 'center',
              shadowColor: theme.colors.glow, shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6, shadowRadius: 8,
            }}>
              <V5Text theme={theme} variant="mono" style={{ color: theme.colors.void, fontSize: 16 }}>✦</V5Text>
            </View>
            <V5Text theme={theme} variant="caption" style={{ color: theme.colors.glow }}>
              NEURAL ASSISTANT
            </V5Text>
          </View>
          <V5Text theme={theme} variant="title" style={{ marginBottom: 6, color: theme.colors.text }}>
            Что тебя беспокоит?
          </V5Text>
          <V5Text theme={theme} variant="body" style={{
            color: theme.colors.text, opacity: 0.7, marginBottom: 16,
          }}>
            AI-коуч проанализирует твои тренировки, сон и настроение. Даст персональный совет за секунды.
          </V5Text>
          <Pressable
            onPress={() => setActiveScreen('ai')}
            style={({ pressed }) => [{
              backgroundColor: theme.colors.glow,
              padding: 14, borderRadius: theme.geometry.btnRadius,
              alignItems: 'center',
              transform: [{ scale: pressed ? theme.motion.pressScale : 1 }],
              shadowColor: theme.colors.glow, shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5, shadowRadius: 12, elevation: 5,
            }]}
          >
            <V5Text theme={theme} variant="mono" style={{
              color: theme.colors.void, letterSpacing: 1, fontSize: 13,
            }}>
              → ОТКРЫТЬ ЧАТ
            </V5Text>
          </Pressable>
        </V5Card>

        {/* Today's Quest */}
        <V5Card theme={theme} label="QUEST" style={{ marginBottom: theme.geometry.cardGap }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <View style={{
              width: 6, height: 6, borderRadius: 3,
              backgroundColor: theme.colors.warning,
              shadowColor: theme.colors.warning, shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1, shadowRadius: 4,
            }} />
            <V5Text theme={theme} variant="caption" style={{ color: theme.colors.warning }}>
              АКТИВНЫЙ КВЕСТ
            </V5Text>
          </View>
          <V5Text theme={theme} variant="title" style={{ marginBottom: 10, color: theme.colors.text }}>
            Дневная тренировка
          </V5Text>
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.colors.border,
          }}>
            <V5Text theme={theme} variant="caption" style={{ color: theme.colors.text }}>
              💪 Верх + кор · 5 упражнений
            </V5Text>
            <View style={{
              paddingHorizontal: 8, paddingVertical: 3,
              backgroundColor: theme.colors.success + '22',
              borderWidth: 1, borderColor: theme.colors.success + '44',
              borderRadius: 4,
            }}>
              <V5Text theme={theme} variant="mono" style={{ color: theme.colors.success, fontSize: 11 }}>
                +150 XP
              </V5Text>
            </View>
          </View>
        </V5Card>

        {/* Theme info */}
        <V5Card theme={theme} label="SYSTEM" style={{ marginBottom: theme.geometry.cardGap }}>
          <V5Text theme={theme} variant="title" style={{ marginBottom: 10, color: theme.colors.text }}>
            {theme.emoji} {theme.name}
          </V5Text>
          <V5Text theme={theme} variant="body" style={{ color: theme.colors.text, opacity: 0.7, marginBottom: 12, lineHeight: 20 }}>
            {theme.description}
          </V5Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {Object.entries(theme.features).filter(([_, v]) => v).map(([k]) => (
              <View key={k} style={{
                paddingHorizontal: 8, paddingVertical: 4,
                backgroundColor: theme.colors.glow + '15',
                borderRadius: 4, borderWidth: 1, borderColor: theme.colors.glow + '33',
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
