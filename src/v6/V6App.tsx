// src/v6/V6App.tsx — HORIZON V6
//
// Один проработанный дизайн. Минимализм, без рамок, без хаоса.
// Navigation — Apple Health style tab bar (не floating dock).
// Все v4 экраны доступны (через wrapV4 — V6 фон + v4 контент).
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { V6Background } from './components/V6Background';
import { V6Card } from './components/V6Card';
import { V6TabBar } from './components/V6TabBar';
import { V6Home } from './screens/V6Home';
import { V6Mentor } from './screens/V6Mentor';
import { V6Journal } from './screens/V6Journal';
import { V6Tasks } from './screens/V6Tasks';
import { v6Colors, v6Typography, v6Geometry } from './theme';
import WorkoutScreen from '../screens/WorkoutScreen';
import JournalScreen from '../screens/JournalScreen';
import MentorScreen from '../screens/MentorScreen';
import TasksScreen from '../screens/TasksScreen';
import NutritionScreen from '../screens/NutritionScreen';
import CalendarScreen from '../screens/CalendarScreen';
import AlarmScreen from '../screens/AlarmScreen';
import StatsScreen from '../screens/StatsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { AppProvider } from '../AppContext';

export function V6App() {
  return (
    <AppProvider>
      <V6AppContent />
    </AppProvider>
  );
}

function V6AppContent() {
  const [active, setActive] = useState('home');
  const [moreTarget, setMoreTarget] = useState<string | null>(null);

  const handleNavigate = (screen: string) => {
    if (['tasks', 'nutrition', 'calendar', 'alarm', 'stats', 'settings'].includes(screen)) {
      setMoreTarget(screen);
      setActive('more');
    } else {
      setActive(screen);
    }
  };

  const goHome = () => {
    setActive('home');
    setMoreTarget(null);
  };

  // Обёртка для v4 экранов — V6 фон + v4 контент
  const wrapV4 = (Screen: React.ComponentType) => (
    <View style={styles.container}>
      <V6Background />
      <View style={{ flex: 1 }}>
        <Screen />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {active === 'home' && <V6Home onNavigate={handleNavigate} />}
      {active === 'train' && wrapV4(WorkoutScreen)}
      {active === 'journal' && <V6Journal onBack={goHome} />}
      {active === 'ai' && <V6Mentor onBack={goHome} />}
      {active === 'tasks' && <V6Tasks onBack={goHome} />}
      {active === 'more' && moreTarget === 'tasks' && <V6Tasks onBack={goHome} />}
      {active === 'more' && moreTarget && moreTarget !== 'tasks' && wrapV4(getMoreScreen(moreTarget))}
      {active === 'more' && !moreTarget && <V6More onSelect={setMoreTarget} />}
      <V6TabBar active={active} onSelect={(id) => { setActive(id); if (id !== 'more') setMoreTarget(null); }} />
    </View>
  );
}

function getMoreScreen(target: string): React.ComponentType {
  switch (target) {
    case 'tasks': return TasksScreen;
    case 'nutrition': return NutritionScreen;
    case 'calendar': return CalendarScreen;
    case 'alarm': return AlarmScreen;
    case 'stats': return StatsScreen;
    case 'settings': return SettingsScreen;
    default: return TasksScreen;
  }
}

// V6 "Ещё" экран — простая сетка
function V6More({ onSelect }: { onSelect: (target: string) => void }) {
  const items = [
    { id: 'tasks', label: 'Задачи', desc: 'Привычки и цели', emoji: '✓' },
    { id: 'nutrition', label: 'Питание', desc: 'Калории и макросы', emoji: '🥗' },
    { id: 'calendar', label: 'Календарь', desc: 'События и история', emoji: '📅' },
    { id: 'alarm', label: 'Будильник', desc: 'Уведомления и сон', emoji: '⏰' },
    { id: 'stats', label: 'Статы', desc: 'Графики и рекорды', emoji: '📊' },
    { id: 'settings', label: 'Настройки', desc: 'Темы, AI, данные', emoji: '⚙️' },
  ];

  return (
    <View style={styles.container}>
      <V6Background />
      <View style={{ flex: 1, paddingTop: 70, paddingHorizontal: v6Geometry.screenPadding, paddingBottom: 120 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: v6Geometry.cardGap }}>
          {items.map(item => (
            <V6Card key={item.id} style={{ width: '48%', padding: 18, aspectRatio: 1 }} onPress={() => onSelect(item.id)}>
              <View style={{
                width: 44, height: 44, borderRadius: v6Geometry.iconRadius,
                backgroundColor: v6Colors.accentSoft,
                alignItems: 'center', justifyContent: 'center', marginBottom: 12,
              }}>
                <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
              </View>
              <Text style={[v6Typography.title2, { color: v6Colors.textPrimary }]}>
                {item.label}
              </Text>
              <Text style={[v6Typography.caption, { color: v6Colors.textTertiary, marginTop: 2 }]}>
                {item.desc}
              </Text>
            </V6Card>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
});
