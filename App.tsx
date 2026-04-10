// App.tsx — Горизонт Life Tracker
import React, { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  BarlowCondensed_400Regular, BarlowCondensed_700Bold, BarlowCondensed_900Black,
} from '@expo-google-fonts/barlow-condensed';
import { Barlow_400Regular, Barlow_500Medium, Barlow_600SemiBold } from '@expo-google-fonts/barlow';

import {
  Sun, Dumbbell, ClipboardList, Leaf,
  BookOpen, Sparkles, BarChart2, Activity,
  Bell, Calendar,
} from 'lucide-react-native';

import { AppProvider, useApp, setGlobalNavigate } from './src/AppContext';
import { getUIStyle } from './src/styles';
import DashboardScreen  from './src/screens/DashboardScreen';
import WorkoutScreen    from './src/screens/WorkoutScreen';
import TasksScreen      from './src/screens/TasksScreen';
import NutritionScreen  from './src/screens/NutritionScreen';
import JournalScreen    from './src/screens/JournalScreen';
import MentorScreen     from './src/screens/MentorScreen';
import StatsScreen      from './src/screens/StatsScreen';
import AlarmScreen      from './src/screens/AlarmScreen';
import CalendarScreen   from './src/screens/CalendarScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

const Tab = createBottomTabNavigator();

// Style-aware tab label helper
function getTabLabel(base: string, styleId: string): string {
  const RPG: Record<string, string> = { 'ГОРИЗОНТ': '⚔️ МИР', 'ТРЕН.': '🗡️ БИТВА', 'ЗАДАЧИ': '📜 КВЕСТ', 'ПИТАНИЕ': '🍖 ЗЕЛЬЯ', 'ДНЕВНИК': '📕 LOG', 'РАЗУМ': '🔮 ОРАКУЛ', 'СТАТЫ': '🏆 СТАТЫ', 'ТРЕВОГА': '🔔', 'КАЛ.': '📅' };
  const KAWAII: Record<string, string> = { 'ГОРИЗОНТ': '🌸 HOME', 'ТРЕН.': '💪 ГО!', 'ЗАДАЧИ': '✅ TODO', 'ПИТАНИЕ': '🍡 ЕДА', 'ДНЕВНИК': '📔 ♡', 'РАЗУМ': '✨ AI', 'СТАТЫ': '⭐ СТАТ', 'ТРЕВОГА': '🔔', 'КАЛ.': '📅' };
  const PIXEL: Record<string, string> = { 'ГОРИЗОНТ': '► HOME', 'ТРЕН.': '► FIGHT', 'ЗАДАЧИ': '► QUEST', 'ПИТАНИЕ': '► FOOD', 'ДНЕВНИК': '► LOG', 'РАЗУМ': '► AI', 'СТАТЫ': '► RPT', 'ТРЕВОГА': '► ALM', 'КАЛ.': '► CAL' };
  if (styleId === 'rpg') return RPG[base] || base;
  if (styleId === 'kawaii') return KAWAII[base] || base;
  if (styleId === 'pixel') return PIXEL[base] || base;
  return base;
}

function Navigation() {
  const { state, T, session, loading } = useApp();
  const uiStyle = getUIStyle((state as any).uiStyleId || 'default');
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    setGlobalNavigate((tab: string) => {
      navigationRef.current?.navigate(tab);
    });
  }, []);

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={T.primary} size="large" />
    </View>;
  }

  if (!state.onboarded) return <OnboardingScreen />;

  // RPG/Kawaii/Pixel tab bar styles
  const isRPG = uiStyle.id === 'rpg';
  const isKawaii = uiStyle.id === 'kawaii';
  const isPixel = uiStyle.id === 'pixel';
  const isGlow = uiStyle.id === 'glow';

  const tabBarStyle: any = {
    backgroundColor: T.surf,
    borderTopColor: isPixel ? T.primary : isRPG ? T.primary + '88' : T.bord,
    borderTopWidth: isPixel ? 3 : isRPG ? 2 : 1,
    height: 62,
    paddingBottom: 8,
    paddingTop: 6,
    ...(isGlow ? { shadowColor: T.primary, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.25, shadowRadius: 12 } : {}),
    ...(isRPG ? { borderTopStyle: 'solid' } : {}),
  };

  const TABS = [
    { name: 'Dashboard', label: 'ГЛАВНАЯ', icon: Sun },
    { name: 'Workout',   label: 'ТРЕН.',    icon: session ? Activity : Dumbbell, hasActive: !!session },
    { name: 'Tasks',     label: 'ЗАДАЧИ',   icon: ClipboardList },
    { name: 'Nutrition', label: 'ПИТАНИЕ',  icon: Leaf },
    { name: 'Journal',   label: 'ДНЕВНИК',  icon: BookOpen },
    { name: 'Calendar',  label: 'КАЛ.',     icon: Calendar },
    { name: 'Mentor',    label: 'НЕЙРО',    icon: Sparkles },
    { name: 'Alarm',     label: 'ТРЕВОГА',  icon: Bell },
    { name: 'Stats',     label: 'СТАТЫ',    icon: BarChart2 },
  ];

  return (
    <Tab.Navigator
      ref={navigationRef}
      screenOptions={({ route }) => {
        const tabInfo = TABS.find(t => t.name === route.name);
        const IconComp = tabInfo?.icon || Sunrise;
        return {
          headerShown: false,
          tabBarStyle,
          tabBarActiveTintColor: T.primary,
          tabBarInactiveTintColor: T.muted,
          tabBarLabelStyle: {
            fontFamily: isPixel ? 'BarlowCondensed_900Black' : 'BarlowCondensed_700Bold',
            fontSize: isPixel ? 7 : 7.5,
            letterSpacing: isPixel ? 0 : 0.5,
          },
          tabBarIcon: ({ color, focused }) => (
            <IconComp size={20} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
        };
      }}
    >
      {TABS.map(tab => (
        <Tab.Screen key={tab.name} name={tab.name}
          component={
            tab.name === 'Dashboard'  ? DashboardScreen  :
            tab.name === 'Workout'    ? WorkoutScreen    :
            tab.name === 'Tasks'      ? TasksScreen      :
            tab.name === 'Nutrition'  ? NutritionScreen  :
            tab.name === 'Journal'    ? JournalScreen    :
            tab.name === 'Calendar'   ? CalendarScreen   :
            tab.name === 'Mentor'     ? MentorScreen     :
            tab.name === 'Alarm'      ? AlarmScreen      :
            StatsScreen
          }
          options={{ tabBarLabel: getTabLabel(tab.label, (state as any).uiStyleId || 'default') }}
        />
      ))}
    </Tab.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    BarlowCondensed_400Regular, BarlowCondensed_700Bold, BarlowCondensed_900Black,
    Barlow_400Regular, Barlow_500Medium, Barlow_600SemiBold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#07090D', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color="#00C4F0" size="large" />
    </View>;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppContent() {
  const { T } = useApp();
  return (
    <>
      <StatusBar backgroundColor={T.surf} barStyle={T.dark ? 'light-content' : 'dark-content'} translucent={false} androidNavigationBarColor={T.surf} />
      <NavigationContainer>
        <Navigation />
      </NavigationContainer>
    </>
  );
}
