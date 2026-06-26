// src/v5/V5App.tsx — HORIZON V5.1
//
// v5.1: Подключены реальные v4 экраны (TRAIN/JOURNAL/AI/MORE работают, не placeholder).
// V5 даёт тему + фон + dock, а контент берётся из v4 экранов, обёрнутых в V5Background.
// Это решает "все наши фичи заблоканы" — пользователь получает доступ ко всему
// функционалу v4 (тренировки, дневник, AI-чат, задачи, будильник, и т.д.) в новом V5 UI.
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Palette } from 'lucide-react-native';
import { V5Provider, useV5 } from './V5Context';
import { V5Background } from './components/V5Background';
import { V5Loader } from './loaders/V5Loader';
import { FloatingDock } from './components/FloatingDock';
import { V5Home } from './screens/V5Home';
import { V5ThemeSwitcher } from './screens/V5ThemeSwitcher';
// Импортируем v4 экраны — они полностью функциональны
import DashboardScreen from '../screens/DashboardScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import JournalScreen from '../screens/JournalScreen';
import MentorScreen from '../screens/MentorScreen';
import TasksScreen from '../screens/TasksScreen';
import NutritionScreen from '../screens/NutritionScreen';
import CalendarScreen from '../screens/CalendarScreen';
import AlarmScreen from '../screens/AlarmScreen';
import StatsScreen from '../screens/StatsScreen';
import SettingsScreen from '../screens/SettingsScreen';
// v4 AppProvider — нужен для v4 экранов (они используют useApp)
import { AppProvider } from '../AppContext';

export function V5App() {
  return (
    <V5Provider>
      <AppProvider>
        <V5AppContent />
      </AppProvider>
    </V5Provider>
  );
}

function V5AppContent() {
  const { theme, activeScreen, setActiveScreen } = useV5();
  const [booting, setBooting] = useState(true);
  const [showThemeSwitcher, setShowThemeSwitcher] = useState(false);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 2200);
    return () => clearTimeout(t);
  }, []);

  if (booting) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.void }]}>
        <V5Background theme={theme} />
        <V5Loader theme={theme} label="Инициализация" />
      </View>
    );
  }

  // Адаптер: оборачиваем v4 экран в V5Background чтобы он получил новый фон
  // v4 экраны сами управляют своим контентом (используют v4 theme из AppContext)
  const wrapV4 = (Screen: React.ComponentType) => (
    <View style={styles.container}>
      <V5Background theme={theme} />
      <View style={{ flex: 1, position: 'relative' }}>
        <Screen />
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.void }]}>
      {/* Theme switcher FAB */}
      <Pressable
        onPress={() => setShowThemeSwitcher(true)}
        style={({ pressed }) => [{
          position: 'absolute', top: 50, right: 16, zIndex: 100,
          width: 44, height: 44, borderRadius: theme.geometry.iconRadius,
          backgroundColor: theme.colors.elevated,
          borderWidth: theme.geometry.cardBorderWidth,
          borderColor: theme.colors.borderGlow,
          alignItems: 'center', justifyContent: 'center',
          transform: [{ scale: pressed ? theme.motion.pressScale : 1 }],
          shadowColor: theme.colors.glow, shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
        }]}
      >
        <Palette size={20} color={theme.colors.glow} />
      </Pressable>

      {/* Активный экран — реальные v4 экраны с V5 фоном */}
      {activeScreen === 'home' && <V5Home />}
      {activeScreen === 'train' && wrapV4(WorkoutScreen)}
      {activeScreen === 'journal' && wrapV4(JournalScreen)}
      {activeScreen === 'ai' && wrapV4(MentorScreen)}
      {activeScreen === 'more' && <V5MoreScreen theme={theme} onSelect={(target) => {
        if (target === 'tasks') setActiveScreen('tasks');
        else if (target === 'nutrition') setActiveScreen('nutrition');
        else if (target === 'calendar') setActiveScreen('calendar');
        else if (target === 'alarm') setActiveScreen('alarm');
        else if (target === 'stats') setActiveScreen('stats');
        else if (target === 'settings') setActiveScreen('settings');
      }} />}
      {activeScreen === 'tasks' && wrapV4(TasksScreen)}
      {activeScreen === 'nutrition' && wrapV4(NutritionScreen)}
      {activeScreen === 'calendar' && wrapV4(CalendarScreen)}
      {activeScreen === 'alarm' && wrapV4(AlarmScreen)}
      {activeScreen === 'stats' && wrapV4(StatsScreen)}
      {activeScreen === 'settings' && wrapV4(SettingsScreen)}

      {/* Floating Dock */}
      <FloatingDock
        theme={theme}
        activeScreen={activeScreen === 'tasks' || activeScreen === 'nutrition' || activeScreen === 'calendar' || activeScreen === 'alarm' || activeScreen === 'stats' || activeScreen === 'settings' ? 'more' : activeScreen}
        onSelect={(id) => setActiveScreen(id)}
      />

      <V5ThemeSwitcher visible={showThemeSwitcher} onClose={() => setShowThemeSwitcher(false)} />
    </View>
  );
}

// V5 "Ещё" экран — меню для доступа к Tasks/Nutrition/Calendar/Alarm/Stats/Settings
function V5MoreScreen({ theme, onSelect }: { theme: any; onSelect: (target: string) => void }) {
  const items = [
    { id: 'tasks', label: 'Задачи', desc: 'Привычки и цели', emoji: '✓' },
    { id: 'nutrition', label: 'Питание', desc: 'Калории и макросы', emoji: '🥗' },
    { id: 'calendar', label: 'Календарь', desc: 'События и история', emoji: '📅' },
    { id: 'alarm', label: 'Будильник', desc: 'Уведомления и сон', emoji: '⏰' },
    { id: 'stats', label: 'Статы', desc: 'Графики и рекорды', emoji: '📊' },
    { id: 'settings', label: 'Настройки', desc: 'Темы, AI, данные', emoji: '⚙️' },
  ];
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.void }]}>
      <V5Background theme={theme} />
      <View style={{ flex: 1, paddingTop: 80, paddingHorizontal: theme.geometry.screenPadding, paddingBottom: 120 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.geometry.cardGap }}>
          {items.map(item => (
            <Pressable
              key={item.id}
              onPress={() => onSelect(item.id)}
              style={({ pressed }) => [{
                width: '48%', padding: 16,
                backgroundColor: theme.colors.elevated,
                borderRadius: theme.geometry.cardRadius,
                borderWidth: theme.geometry.cardBorderWidth,
                borderColor: theme.colors.border,
                aspectRatio: 1.1,
                transform: [{ scale: pressed ? theme.motion.pressScale : 1 }],
              }]}
            >
              <View style={{
                width: 44, height: 44, borderRadius: theme.geometry.iconRadius,
                backgroundColor: theme.colors.glow + '22',
                borderWidth: 1, borderColor: theme.colors.glow + '44',
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 10,
              }}>
                <Text style={{ fontSize: 22, color: theme.colors.glow }}>
                  {item.emoji}
                </Text>
              </View>
              <Text style={{ fontFamily: theme.typography.title, fontSize: theme.typography.titleSize, color: theme.colors.text, letterSpacing: theme.typography.titleTracking }}>
                {item.label}
              </Text>
              <Text style={{ fontFamily: theme.typography.caption, fontSize: theme.typography.captionSize, color: theme.colors.textMuted, marginTop: 2 }}>
                {item.desc}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
