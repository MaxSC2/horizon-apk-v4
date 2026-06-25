// App.tsx — Горизонт Life Tracker v4.1
//
// v4.1 navigation reorganization:
//   Bottom tab bar reduced from 9 tabs to 5 (Главная, Тренировка, Дневник, НЕЙРО, Ещё).
//   Less-frequent screens (Задачи, Питание, Календарь, Будильник, Статы, Настройки)
//   are reached from the new "Ещё" screen via a 2-column grid of large tappable cards.
//   This dramatically improves one-handed reachability — primary actions are always
//   within thumb's reach, and the tab bar no longer overflows on smaller phones.
import React, { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StatusBar, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
  Sun, Dumbbell, BookOpen, Sparkles, Grid,
  ClipboardList, Leaf, BarChart2, Activity,
  Bell, Calendar, Settings as SettingsIcon,
} from 'lucide-react-native';

import { AppProvider, useApp, setGlobalNavigate } from './src/AppContext';
import { getUIStyle } from './src/styles';
import DashboardScreen  from './src/screens/DashboardScreen';
import WorkoutScreen    from './src/screens/WorkoutScreen';
import JournalScreen    from './src/screens/JournalScreen';
import MentorScreen     from './src/screens/MentorScreen';
import TasksScreen      from './src/screens/TasksScreen';
import NutritionScreen  from './src/screens/NutritionScreen';
import StatsScreen      from './src/screens/StatsScreen';
import AlarmScreen      from './src/screens/AlarmScreen';
import CalendarScreen   from './src/screens/CalendarScreen';
import SettingsScreen   from './src/screens/SettingsScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { ensureAlarmHandlersRegistered } from './src/alarm';
import { ModeBackground } from './src/modes';

// Register background event handler ASAP — before any screen mounts — so
// snooze/stop actions on notifications work even if the app was cold-started
// by tapping the notification.
ensureAlarmHandlersRegistered();

const Tab = createBottomTabNavigator();

// "Ещё" screen — a hub for less-frequent destinations.
function MoreScreen() {
  const { T, state, navigateTo, uiMode } = useApp();
  const insets = useSafeAreaInsets();
  const items = [
    { label: 'Задачи',    desc: 'Привычки и цели',     icon: ClipboardList, color: '#00C4F0', target: 'TasksScreen' },
    { label: 'Питание',   desc: 'Калории и макросы',   icon: Leaf,          color: '#00E676', target: 'NutritionScreen' },
    { label: 'Календарь', desc: 'События и история',   icon: Calendar,      color: '#C77DFF', target: 'CalendarScreen' },
    { label: 'Будильник', desc: 'Уведомления и сон',   icon: Bell,          color: '#FFD600', target: 'AlarmScreen' },
    { label: 'Статы',     desc: 'Графики и рекорды',   icon: BarChart2,     color: '#FF9500', target: 'StatsScreen' },
    { label: 'Настройки', desc: 'Темы, AI, данные',    icon: SettingsIcon,  color: '#7EB8FF', target: 'SettingsScreen' },
  ];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <ModeBackground T={T} mode={uiMode} />
      <View style={{
        backgroundColor: uiMode === 'aurora' ? 'transparent' : T.surf, borderBottomWidth: uiMode === 'aurora' ? 0 : 1, borderBottomColor: T.bord,
        paddingHorizontal: 16, paddingVertical: 12,
      }}>
        <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 22, color: T.txt, letterSpacing: 1 }}>Ещё</Text>
        <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 11, color: T.muted, marginTop: 2 }}>Все разделы приложения</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 24 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {items.map(item => {
            const IconComp = item.icon;
            return (
              <TouchableOpacity
                key={item.label}
                onPress={() => navigateTo(item.target)}
                activeOpacity={0.75}
                style={{
                  width: '48%',
                  backgroundColor: T.card,
                  borderWidth: 1,
                  borderColor: T.bord,
                  borderRadius: 16,
                  padding: 16,
                  aspectRatio: 1.05,
                }}
              >
                <View style={{
                  width: 44, height: 44, borderRadius: 12,
                  backgroundColor: item.color + '18',
                  borderWidth: 1.5, borderColor: item.color + '44',
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: 10,
                }}>
                  <IconComp size={22} color={item.color} />
                </View>
                <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 18, color: T.txt }}>{item.label}</Text>
                <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 11, color: T.muted, marginTop: 2 }}>{item.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Quick summary at bottom */}
        <View style={{ marginTop: 18, padding: 14, borderRadius: 14, backgroundColor: T.lo, borderWidth: 1, borderColor: T.bord }}>
          <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 11, color: T.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Быстрая сводка</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 20, color: T.primary }}>{state.tasks?.length || 0}</Text>
              <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 10, color: T.muted }}>задач</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 20, color: T.warn }}>{state.alarms?.filter((a: any) => a.enabled).length || 0}</Text>
              <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 10, color: T.muted }}>будильников</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 20, color: T.success }}>{state.goals?.filter((g: any) => !g.completed).length || 0}</Text>
              <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 10, color: T.muted }}>целей</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 20, color: '#C77DFF' }}>{state.journal?.length || 0}</Text>
              <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 10, color: T.muted }}>записей</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Navigation() {
  const { state, T, session, loading } = useApp();
  const uiStyle = getUIStyle(state.uiStyleId || 'default');
  const navigationRef = useRef<any>(null as any);

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

  const isPixel = uiStyle.id === 'pixel';
  const isRPG = uiStyle.id === 'rpg';
  const isGlow = uiStyle.id === 'glow';

  const tabBarStyle: any = {
    backgroundColor: T.surf,
    borderTopColor: isPixel ? T.primary : isRPG ? T.primary + '88' : T.bord,
    borderTopWidth: isPixel ? 3 : isRPG ? 2 : 1,
    height: 64,
    paddingBottom: 10,
    paddingTop: 8,
    ...(isGlow ? { shadowColor: T.primary, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.25, shadowRadius: 12 } : {}),
  };

  // 5 primary tabs — fits comfortably on any phone
  const TABS = [
    { name: 'Dashboard', label: 'ГЛАВНАЯ',  icon: Sun,                              comp: DashboardScreen },
    { name: 'Workout',   label: 'ТРЕН.',     icon: session ? Activity : Dumbbell,   comp: WorkoutScreen   },
    { name: 'Journal',   label: 'ДНЕВНИК',   icon: BookOpen,                        comp: JournalScreen   },
    { name: 'Mentor',    label: 'НЕЙРО',     icon: Sparkles,                        comp: MentorScreen    },
    { name: 'More',      label: 'ЕЩЁ',       icon: Grid,                            comp: MoreScreen      },
  ];

  // Secondary screens — registered without tab bar icons, reached via "Ещё" or
  // via navigation.navigate() from anywhere.
  const HIDDEN_SCREENS = [
    { name: 'TasksScreen',       comp: TasksScreen      },
    { name: 'NutritionScreen',   comp: NutritionScreen  },
    { name: 'CalendarScreen',    comp: CalendarScreen   },
    { name: 'AlarmScreen',       comp: AlarmScreen      },
    { name: 'StatsScreen',       comp: StatsScreen      },
    { name: 'SettingsScreen',    comp: SettingsScreen   },
  ];

  const TabNav = Tab.Navigator as any;
  return (
    <TabNav
      ref={navigationRef}
      screenOptions={({ route }: any) => {
        const tabInfo = TABS.find(t => t.name === route.name);
        const IconComp = tabInfo?.icon || Sun;
        return {
          headerShown: false,
          tabBarStyle: HIDDEN_SCREENS.some(s => s.name === route.name) ? { display: 'none' } : tabBarStyle,
          tabBarButton: HIDDEN_SCREENS.some(s => s.name === route.name) ? () => null : undefined,
          tabBarActiveTintColor: T.primary,
          tabBarInactiveTintColor: T.muted,
          tabBarLabelStyle: {
            fontFamily: isPixel ? 'BarlowCondensed_900Black' : 'BarlowCondensed_700Bold',
            fontSize: isPixel ? 8 : 9,
            letterSpacing: isPixel ? 0 : 0.5,
            marginTop: 2,
          },
          tabBarIcon: ({ color, focused }) => (
            <IconComp size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
          ),
          animation: 'fade',
        };
      }}
    >
      {TABS.map(tab => (
        <Tab.Screen key={tab.name} name={tab.name} component={tab.comp} options={{ tabBarLabel: tab.label }} />
      ))}
      {HIDDEN_SCREENS.map(s => (
        <Tab.Screen key={s.name} name={s.name} component={s.comp} options={{ tabBarButton: () => null }} />
      ))}
    </TabNav>
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
      <StatusBar backgroundColor={T.surf} barStyle={T.dark ? 'light-content' : 'dark-content'} translucent={false} />
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: T.primary,
            background: T.bg,
            card: T.surf,
            text: T.txt,
            border: T.bord,
            notification: T.primary,
          },
        }}
      >
        <Navigation />
      </NavigationContainer>
    </>
  );
}
