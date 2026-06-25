// src/v5/screens/V5ThemeSwitcher.tsx — HORIZON V5
//
// Экран переключения тем. Показывает все 4 темы с live preview.
// Тап по теме мгновенно меняет весь интерфейс.
import React from 'react';
import { View, ScrollView, StyleSheet, Pressable, Modal, Dimensions } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { useV5 } from '../V5Context';
import { V5Background } from '../components/V5Background';
import { V5Card } from '../components/V5Card';
import { V5Text } from '../components/V5Text';
import { V5_THEMES, V5Theme } from '../themes';

const { width: W } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function V5ThemeSwitcher({ visible, onClose }: Props) {
  const { theme: currentTheme, setTheme, themeId } = useV5();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: currentTheme.colors.scrim }}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: currentTheme.colors.surface,
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            maxHeight: '85%',
            paddingBottom: 32,
          }}>
            {/* Grabber */}
            <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 6 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: currentTheme.colors.border }} />
            </View>

            {/* Header */}
            <View style={{
              paddingHorizontal: 20, paddingVertical: 14,
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <View>
                <V5Text theme={currentTheme} variant="title">Тема интерфейса</V5Text>
                <V5Text theme={currentTheme} variant="caption" style={{ marginTop: 2 }}>
                  Сейчас: {currentTheme.emoji} {currentTheme.name}
                </V5Text>
              </View>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [{
                  width: 36, height: 36, borderRadius: currentTheme.geometry.iconRadius,
                  backgroundColor: currentTheme.colors.elevated,
                  borderWidth: currentTheme.geometry.cardBorderWidth,
                  borderColor: currentTheme.colors.border,
                  alignItems: 'center', justifyContent: 'center',
                  transform: [{ scale: pressed ? currentTheme.motion.pressScale : 1 }],
                }]}
              >
                <X size={16} color={currentTheme.colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}>
              {V5_THEMES.map(t => {
                const isActive = themeId === t.id;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => { setTheme(t.id); }}
                    style={({ pressed }) => [{
                      marginBottom: 12,
                      transform: [{ scale: pressed ? currentTheme.motion.pressScale : 1 }],
                    }]}
                  >
                    <ThemePreviewCard theme={t} isActive={isActive} />
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ThemePreviewCard({ theme, isActive }: { theme: V5Theme; isActive: boolean }) {
  return (
    <View style={{
      borderRadius: 16, overflow: 'hidden',
      borderWidth: isActive ? 2 : 1,
      borderColor: isActive ? theme.colors.glow : theme.colors.border,
    }}>
      {/* Live preview area */}
      <View style={{ height: 120, position: 'relative', overflow: 'hidden' }}>
        <V5Background theme={theme} />
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          padding: 12, justifyContent: 'center',
        }}>
          <V5Text theme={theme} variant="caption" style={{ color: theme.colors.glow, marginBottom: 4 }}>
            {theme.emoji} {theme.tagline}
          </V5Text>
          <V5Text theme={theme} variant="display" style={{ fontSize: 28 }}>
            {theme.name}
          </V5Text>
        </View>
        {isActive && (
          <View style={{
            position: 'absolute', top: 8, right: 8,
            width: 28, height: 28, borderRadius: 14,
            backgroundColor: theme.colors.glow,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: theme.colors.glow, shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6, shadowRadius: 8,
          }}>
            <Check size={16} color={theme.colors.void} strokeWidth={3} />
          </View>
        )}
      </View>

      {/* Description */}
      <View style={{ padding: 12, backgroundColor: theme.colors.surface }}>
        <V5Text theme={theme} variant="body" style={{ color: theme.colors.textMuted, fontSize: 12, lineHeight: 18 }}>
          {theme.description}
        </V5Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
          {Object.entries(theme.features).filter(([_, v]) => v).slice(0, 5).map(([k]) => (
            <View key={k} style={{
              paddingHorizontal: 6, paddingVertical: 2,
              backgroundColor: theme.colors.glow + '15',
              borderRadius: 2,
            }}>
              <V5Text theme={theme} variant="caption" style={{ color: theme.colors.glow, fontSize: 8 }}>
                {k.toUpperCase()}
              </V5Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
