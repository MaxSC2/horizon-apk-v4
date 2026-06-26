// src/v6/components/V6TabBar.tsx
//
// Navigation — Apple Health / Strava style. НЕ floating dock.
// Стандартная нижняя панель, фиксированная, с blur-фоном.
// 5 иконок одного стиля, активная — с цветом + подчёркиванием.
import React from 'react';
import { View, Pressable, Text, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Home, Dumbbell, BookOpen, Sparkles, Grid3x3, LucideIcon } from 'lucide-react-native';
import { v6Colors, v6Typography, v6Geometry } from '../theme';

interface TabItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

const TABS: TabItem[] = [
  { id: 'home', label: 'Главная', icon: Home },
  { id: 'train', label: 'Тренировка', icon: Dumbbell },
  { id: 'journal', label: 'Дневник', icon: BookOpen },
  { id: 'ai', label: 'Нейро', icon: Sparkles },
  { id: 'more', label: 'Ещё', icon: Grid3x3 },
];

interface Props {
  active: string;
  onSelect: (id: string) => void;
}

export function V6TabBar({ active, onSelect }: Props) {
  return (
    <View style={styles.container}>
      {Platform.OS !== 'web' ? (
        <BlurView intensity={60} tint="dark" style={[StyleSheet.absoluteFill, styles.blur]} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10, 10, 15, 0.9)' }]} />
      )}
      <View style={styles.tabs}>
        {TABS.map(tab => {
          const isActive = active === tab.id;
          const Icon = tab.icon;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onSelect(tab.id)}
              style={styles.tab}
            >
              <View style={styles.iconWrap}>
                <Icon
                  size={22}
                  color={isActive ? v6Colors.accent : v6Colors.textTertiary}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {isActive && (
                  <View style={styles.activeDot} />
                )}
              </View>
              <Text style={[
                styles.label,
                { color: isActive ? v6Colors.accent : v6Colors.textTertiary },
              ]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: v6Colors.divider,
  },
  blur: {
    backgroundColor: 'rgba(10, 10, 15, 0.8)',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    gap: 4,
  },
  iconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
    width: 40,
  },
  activeDot: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: v6Colors.accent,
  },
  label: {
    ...v6Typography.micro,
    fontSize: 10,
  },
});
