// src/v7/V7App.tsx — HORIZON V7: Life OS
//
// Не трекер. Не органайзер. Life OS.
// Главная идея: приложение знает мой день.
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Modal, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Home, Clock, Sparkles, Grid3x3, X, Check } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { V7_THEMES, V7Theme, getV7Theme } from './themes';
import { V7Background } from './components/Background';
import { TodayScreen } from './screens/TodayScreen';
import { TimelineScreen } from './screens/TimelineScreen';
import { AppProvider, useApp } from '../AppContext';
import { calculateScores, getAIInsights } from './lib/scores';
// v4 экраны для функционала
import WorkoutScreen from '../screens/WorkoutScreen';
import JournalScreen from '../screens/JournalScreen';
import MentorScreen from '../screens/MentorScreen';
import TasksScreen from '../screens/TasksScreen';
import NutritionScreen from '../screens/NutritionScreen';
import CalendarScreen from '../screens/CalendarScreen';
import AlarmScreen from '../screens/AlarmScreen';
import StatsScreen from '../screens/StatsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const THEME_KEY = 'horizon_v7_theme';

export function V7App() {
  return (
    <AppProvider>
      <V7AppInner />
    </AppProvider>
  );
}

function V7AppInner() {
  const { state } = useApp();
  const [themeId, setThemeId] = useState<string>('midnight');
  const [active, setActive] = useState('today');
  const [moreTarget, setMoreTarget] = useState<string | null>(null);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const theme = getV7Theme(themeId);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(stored => {
      if (stored) setThemeId(stored);
    });
  }, []);

  const switchTheme = useCallback(() => {
    const idx = V7_THEMES.findIndex(t => t.id === themeId);
    const next = V7_THEMES[(idx + 1) % V7_THEMES.length];
    setThemeId(next.id);
    AsyncStorage.setItem(THEME_KEY, next.id);
  }, [themeId]);

  const handleNavigate = (screen: string) => {
    if (['tasks', 'nutrition', 'calendar', 'alarm', 'stats', 'settings'].includes(screen)) {
      setMoreTarget(screen);
      setActive('more');
    } else {
      setActive(screen);
    }
  };

  // Обёртка v4 экрана в V7 фон
  const wrapV4 = (Screen: React.ComponentType) => (
    <View style={{ flex: 1, backgroundColor: theme.void }}>
      <V7Background theme={theme} />
      <View style={{ flex: 1 }}>
        <Screen />
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.void }}>
      {/* Screens */}
      {active === 'today' && (
        <TodayScreen
          theme={theme}
          state={state}
          onNavigate={handleNavigate}
          onSwitchTheme={switchTheme}
        />
      )}
      {active === 'timeline' && <TimelineScreen theme={theme} state={state} onBack={() => setActive('today')} />}
      {active === 'ai' && wrapV4(MentorScreen)}
      {active === 'train' && wrapV4(WorkoutScreen)}
      {active === 'tasks' && wrapV4(TasksScreen)}
      {active === 'more' && moreTarget && wrapV4(getMoreScreen(moreTarget))}
      {active === 'more' && !moreTarget && (
        <MoreScreen theme={theme} onSelect={(t) => { setMoreTarget(t); }} onBack={() => setActive('today')} />
      )}

      {/* Navigation — 4 таба */}
      <V7TabBar theme={theme} active={active} onSelect={(id) => {
        setActive(id);
        if (id !== 'more') setMoreTarget(null);
      }} />

      {/* Theme picker modal */}
      <ThemePickerModal
        visible={showThemePicker}
        theme={theme}
        themes={V7_THEMES}
        currentId={themeId}
        onSelect={(id) => { setThemeId(id); AsyncStorage.setItem(THEME_KEY, id); setShowThemePicker(false); }}
        onClose={() => setShowThemePicker(false)}
      />
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

// ── Tab Bar ────────────────────────────────────────────────────────────────
function V7TabBar({ theme, active, onSelect }: { theme: V7Theme; active: string; onSelect: (id: string) => void }) {
  const tabs = [
    { id: 'today', label: 'Сегодня', icon: Home },
    { id: 'timeline', label: 'Лента', icon: Clock },
    { id: 'ai', label: 'AI', icon: Sparkles },
    { id: 'more', label: 'Ещё', icon: Grid3x3 },
  ];

  return (
    <View style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingBottom: Platform.OS === 'ios' ? 24 : 12,
      paddingTop: 8,
      borderTopWidth: 1, borderTopColor: theme.divider,
    }}>
      {Platform.OS !== 'web' ? (
        <BlurView intensity={60} tint={theme.dark ? 'dark' : 'light'} style={[StyleSheet.absoluteFill, { backgroundColor: theme.dark ? 'rgba(8,8,12,0.85)' : 'rgba(245,245,240,0.85)' }]} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.dark ? 'rgba(8,8,12,0.95)' : 'rgba(245,245,240,0.95)' }]} />
      )}
      <View style={{ flexDirection: 'row', paddingHorizontal: 8 }}>
        {tabs.map(tab => {
          const isActive = active === tab.id || (tab.id === 'more' && active === 'more');
          const Icon = tab.icon;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onSelect(tab.id)}
              style={{ flex: 1, alignItems: 'center', paddingVertical: 6, gap: 4 }}
            >
              <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center', height: 28, width: 40 }}>
                <Icon
                  size={22}
                  color={isActive ? theme.accent : theme.textTertiary}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {isActive && (
                  <View style={{
                    position: 'absolute', bottom: -6,
                    width: 4, height: 4, borderRadius: 2,
                    backgroundColor: theme.accent,
                  }} />
                )}
              </View>
              <Text style={{
                fontFamily: 'Barlow_500Medium', fontSize: 10,
                color: isActive ? theme.accent : theme.textTertiary,
              }}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ── More screen ────────────────────────────────────────────────────────────
function MoreScreen({ theme, onSelect, onBack }: { theme: V7Theme; onSelect: (t: string) => void; onBack: () => void }) {
  const items = [
    { id: 'tasks', label: 'Задачи', desc: 'Привычки и цели', emoji: '✓' },
    { id: 'nutrition', label: 'Питание', desc: 'Калории и макросы', emoji: '🥗' },
    { id: 'calendar', label: 'Календарь', desc: 'События', emoji: '📅' },
    { id: 'alarm', label: 'Будильник', desc: 'Уведомления', emoji: '⏰' },
    { id: 'stats', label: 'Статы', desc: 'Графики', emoji: '📊' },
    { id: 'settings', label: 'Настройки', desc: 'Темы, AI', emoji: '⚙️' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.void }}>
      <V7Background theme={theme} />
      <View style={{ flex: 1, paddingTop: 70, paddingHorizontal: 24, paddingBottom: 120 }}>
        <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 26, color: theme.text, marginBottom: 20 }}>
          Ещё
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {items.map(item => (
            <Pressable
              key={item.id}
              onPress={() => onSelect(item.id)}
              style={({ pressed }) => [{
                width: '48%', padding: 18,
                backgroundColor: theme.card, borderRadius: 16,
                aspectRatio: 1.1,
                shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                shadowOpacity: theme.dark ? 0.3 : 0.08, shadowRadius: 8, elevation: 4,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              }]}
            >
              <View style={{
                width: 44, height: 44, borderRadius: 12,
                backgroundColor: theme.accentSoft,
                alignItems: 'center', justifyContent: 'center', marginBottom: 12,
              }}>
                <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
              </View>
              <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 18, color: theme.text }}>
                {item.label}
              </Text>
              <Text style={{ fontFamily: 'Barlow_500Medium', fontSize: 12, color: theme.textTertiary, marginTop: 2 }}>
                {item.desc}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

// ── Theme picker ───────────────────────────────────────────────────────────
function ThemePickerModal({
  visible, theme, themes, currentId, onSelect, onClose,
}: {
  visible: boolean;
  theme: V7Theme;
  themes: V7Theme[];
  currentId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={{
          backgroundColor: theme.surface,
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          padding: 24, paddingBottom: 40,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 22, color: theme.text }}>
              Тема
            </Text>
            <Pressable onPress={onClose} style={{
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: theme.card, alignItems: 'center', justifyContent: 'center',
            }}>
              <X size={16} color={theme.textTertiary} />
            </Pressable>
          </View>
          {themes.map(t => (
            <Pressable
              key={t.id}
              onPress={() => onSelect(t.id)}
              style={({ pressed }) => [{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                padding: 16, marginBottom: 10, borderRadius: 14,
                backgroundColor: t.id === currentId ? t.accentSoft : theme.card,
                borderWidth: t.id === currentId ? 1 : 0,
                borderColor: t.accent,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              }]}
            >
              <View style={{
                width: 48, height: 48, borderRadius: 14,
                backgroundColor: t.void, borderWidth: 2, borderColor: t.accent,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 22 }}>{t.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 18, color: theme.text }}>
                  {t.name}
                </Text>
                <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: theme.textTertiary, marginTop: 2 }}>
                  {t.desc}
                </Text>
              </View>
              {t.id === currentId && <Check size={18} color={theme.accent} strokeWidth={3} />}
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}
