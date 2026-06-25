// src/v5/components/FloatingDock.tsx — HORIZON V5
//
// Floating Dock navigation — заменяет стандартный bottom tab bar.
// Парит над контентом с отступом, имеет активное состояние с aura/glow.
// Адаптируется под тему: solo = system window, dev = terminal prompt,
// glass = translucent capsule, cyber = neon HUD.
import React, { useEffect, useRef } from 'react';
import { View, Pressable, Animated, StyleSheet, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Home, Dumbbell, BookOpen, Sparkles, Grid3x3 } from 'lucide-react-native';
import { V5Theme } from '../themes';
import { LucideIcon } from 'lucide-react-native';

const { width: W } = Dimensions.get('window');

interface DockItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

const DOCK_ITEMS: DockItem[] = [
  { id: 'home', label: 'HOME', icon: Home },
  { id: 'train', label: 'TRAIN', icon: Dumbbell },
  { id: 'journal', label: 'JOURNAL', icon: BookOpen },
  { id: 'ai', label: 'NEURAL', icon: Sparkles },
  { id: 'more', label: 'MORE', icon: Grid3x3 },
];

interface Props {
  theme: V5Theme;
  activeScreen: string;
  onSelect: (id: string) => void;
}

export function FloatingDock({ theme, activeScreen, onSelect }: Props) {
  const itemWidth = (W - theme.geometry.screenPadding * 2 - 16) / DOCK_ITEMS.length;
  const activeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(activeAnim, {
      toValue: 1,
      friction: theme.motion.spring.damping,
      tension: theme.motion.spring.stiffness,
      useNativeDriver: true,
    }).start();
  }, [activeScreen]);

  const dockBg = theme.id === 'glass' ? (
    <BlurView
      intensity={50}
      tint="dark"
      style={[StyleSheet.absoluteFill, { borderRadius: theme.geometry.cardRadius }]}
    />
  ) : (
    <View style={[StyleSheet.absoluteFill, {
      backgroundColor: theme.colors.elevated,
      borderRadius: theme.geometry.cardRadius,
      borderWidth: theme.geometry.cardBorderWidth,
      borderColor: theme.colors.border,
    }]} />
  );

  return (
    <Animated.View style={{
      position: 'absolute',
      bottom: Platform.OS === 'ios' ? 24 : 16,
      left: theme.geometry.screenPadding,
      right: theme.geometry.screenPadding,
      height: 64,
      opacity: activeAnim,
      transform: [{ translateY: activeAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
    }}>
      {dockBg}

      {/* Glow underline for active */}
      {(theme.features.aura || theme.features.holographicBorders) && (
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
          backgroundColor: theme.colors.glow,
          opacity: 0.4,
          borderRadius: theme.geometry.cardRadius,
        }} />
      )}

      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}>
        {DOCK_ITEMS.map(item => {
          const isActive = activeScreen === item.id;
          const Icon = item.icon;
          return (
            <Pressable
              key={item.id}
              onPress={() => onSelect(item.id)}
              style={({ pressed }) => [{
                flex: 1,
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ scale: pressed ? theme.motion.pressScale : 1 }],
              }]}
            >
              <View style={{
                width: 40, height: 40,
                borderRadius: theme.geometry.iconRadius,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: isActive ? theme.colors.glow + '22' : 'transparent',
                borderWidth: isActive ? 1 : 0,
                borderColor: isActive ? theme.colors.borderGlow : 'transparent',
              }}>
                <Icon
                  size={20}
                  color={isActive ? theme.colors.glow : theme.colors.textMuted}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
              </View>
              {/* Active label */}
              {isActive && (
                <View style={{
                  position: 'absolute', bottom: 4,
                  paddingHorizontal: 6, paddingVertical: 1,
                  backgroundColor: theme.colors.glow,
                  borderRadius: 2,
                }}>
                  <Text style={{
                    fontFamily: theme.typography.mono,
                    fontSize: 8,
                    color: theme.colors.void,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                  }}>
                    {item.label}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

// Need Text import
import { Text } from 'react-native';
