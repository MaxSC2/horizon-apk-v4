// src/v5/V5App.tsx — HORIZON V5
//
// Главный entry point V5. Полностью отдельный UI-стек.
// Включает: V5Provider, FloatingDock navigation, theme switcher FAB,
// 4 экрана (Home + 3 placeholder для других), boot animation.
import React, { useState, useEffect } from 'react';
import { View, Pressable, StyleSheet, AppState } from 'react-native';
import { Palette } from 'lucide-react-native';
import { V5Provider, useV5 } from './V5Context';
import { V5Background } from './components/V5Background';
import { V5Loader } from './loaders/V5Loader';
import { V5Card } from './components/V5Card';
import { V5Text } from './components/V5Text';
import { FloatingDock } from './components/FloatingDock';
import { V5Home } from './screens/V5Home';
import { V5ThemeSwitcher } from './screens/V5ThemeSwitcher';

export function V5App() {
  return (
    <V5Provider>
      <V5AppContent />
    </V5Provider>
  );
}

function V5AppContent() {
  const { theme, activeScreen, setActiveScreen } = useV5();
  const [booting, setBooting] = useState(true);
  const [showThemeSwitcher, setShowThemeSwitcher] = useState(false);

  // Boot animation при первом запуске
  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 2200);
    return () => clearTimeout(t);
  }, []);

  // Boot animation
  if (booting) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.void }]}>
        <V5Background theme={theme} />
        <V5Loader theme={theme} label="Инициализация" />
      </View>
    );
  }

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

      {/* Active screen */}
      {activeScreen === 'home' && <V5Home />}
      {activeScreen === 'train' && <PlaceholderScreen theme={theme} title="Тренировка" emoji="⚔️" subtitle="Раздел в разработке" />}
      {activeScreen === 'journal' && <PlaceholderScreen theme={theme} title="Дневник" emoji="📔" subtitle="Раздел в разработке" />}
      {activeScreen === 'ai' && <PlaceholderScreen theme={theme} title="Нейро" emoji="🤖" subtitle="AI-чат с typewriter" />}
      {activeScreen === 'more' && <PlaceholderScreen theme={theme} title="Ещё" emoji="⋮" subtitle="Полное меню" />}

      {/* Floating Dock */}
      <FloatingDock theme={theme} activeScreen={activeScreen} onSelect={setActiveScreen} />

      {/* Theme Switcher Modal */}
      <V5ThemeSwitcher visible={showThemeSwitcher} onClose={() => setShowThemeSwitcher(false)} />
    </View>
  );
}

// Placeholder для будущих экранов
function PlaceholderScreen({ theme, title, emoji, subtitle }: { theme: any; title: string; emoji: string; subtitle: string }) {
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.void }]}>
      <V5Background theme={theme} />
      <View style={{
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: theme.geometry.screenPadding,
      }}>
        <V5Card theme={theme} emphasized style={{ alignItems: 'center', padding: 32 }}>
          <V5Text theme={theme} variant="mono" style={{ fontSize: 48, marginBottom: 16 }}>
            {emoji}
          </V5Text>
          <V5Text theme={theme} variant="display" style={{ fontSize: 28, marginBottom: 8 }}>
            {title}
          </V5Text>
          <V5Text theme={theme} variant="caption">
            {subtitle}
          </V5Text>
        </V5Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
