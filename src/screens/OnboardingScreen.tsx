// src/screens/OnboardingScreen.tsx — Life Tracker Onboarding (no pushup input)
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../AppContext';

const STEPS = [
  {
    icon: '🌅',
    title: 'Добро пожаловать\nв ГОРИЗОНТ',
    desc: 'Твоя система роста во всех сферах жизни — тело, разум, привычки, цели, питание и энергия.',
    accent: 'primary',
    action: 'Начать →',
    feature_icons: ['💪', '🧠', '🎯', '📊'],
    feature_labels: ['Тренировки', 'Дневник', 'Цели', 'Аналитика'],
  },
  {
    icon: '🎯',
    title: 'Трекинг всего\nважного',
    desc: 'Настроение, сон, вода, питание, замеры тела. Корреляции покажут как всё связано.',
    accent: 'success',
    action: 'Дальше →',
    feature_icons: ['😊', '💤', '💧', '⚖️'],
    feature_labels: ['Настроение', 'Сон', 'Вода', 'Замеры'],
  },
  {
    icon: '🤖',
    title: 'НЕЙРО —\nтвой AI-ментор',
    desc: 'Анализирует твои данные и даёт персональные советы. Claude встроен — работает без ключа.',
    accent: 'primary',
    action: 'Дальше →',
    feature_icons: ['🔮', '📈', '💬', '🔑'],
    feature_labels: ['Анализ', 'Прогноз', 'Советы', 'Без ключа'],
  },
  {
    icon: '⚙️',
    title: 'Настрой\nпод себя',
    desc: 'Выбери своё имя и главные сферы. Всё остальное можно настроить позже в профиле.',
    accent: 'warn',
    action: 'Начать путь 🚀',
    input_name: true,
    input_goals: true,
  },
];

const LIFE_AREAS = [
  { id: 'fitness', emoji: '💪', label: 'Тренировки' },
  { id: 'nutrition', emoji: '🥗', label: 'Питание' },
  { id: 'sleep', emoji: '💤', label: 'Сон' },
  { id: 'mental', emoji: '🧠', label: 'Ментальное' },
  { id: 'goals', emoji: '🎯', label: 'Цели' },
  { id: 'productivity', emoji: '📋', label: 'Продуктивность' },
  { id: 'finance', emoji: '💰', label: 'Финансы' },
  { id: 'relations', emoji: '❤️', label: 'Отношения' },
];

export default function OnboardingScreen() {
  const { setState } = useApp();
  const T = { bg: '#07090D', txt: '#DDE6EE', muted: '#3D5A72', lo: '#0F1C2C', bord: '#1A2E42', primary: '#00C4F0', success: '#00E676', warn: '#FFD600', danger: '#FF4455', card: '#111D2C', surf: '#0D1520' } as any;
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [selectedAreas, setSelectedAreas] = useState<string[]>(['fitness', 'sleep', 'mental']);

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const accentColor = (T as any)[s.accent] || T.primary;

  const toggleArea = (id: string) => {
    setSelectedAreas(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const next = () => {
    if (isLast) {
      setState((prev: any) => ({
        ...prev,
        onboarded: true,
        user: { ...prev.user, name: name.trim() || 'Путник', lifeAreas: selectedAreas },
      }));
    } else {
      setStep(x => x + 1);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 36 }}>

          {/* Progress dots */}
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 32 }}>
            {STEPS.map((_, i) => (
              <View key={i} style={{ height: 4, width: i === step ? 28 : 8, borderRadius: 2, backgroundColor: i <= step ? accentColor : T.bord }} />
            ))}
          </View>

          {/* Icon */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View style={{ width: 90, height: 90, borderRadius: 24, backgroundColor: accentColor + '22', borderWidth: 2, borderColor: accentColor + '66', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 48 }}>{s.icon}</Text>
            </View>
            <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 30, color: T.txt, textAlign: 'center', lineHeight: 36, letterSpacing: 0.5, marginBottom: 12 }}>{s.title}</Text>
            <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 15, color: T.muted, textAlign: 'center', lineHeight: 23, maxWidth: 300 }}>{s.desc}</Text>
          </View>

          {/* Feature icons grid */}
          {s.feature_icons && (
            <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 28 }}>
              {s.feature_icons.map((icon, i) => (
                <View key={i} style={{ alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: accentColor + '18', borderWidth: 1.5, borderColor: accentColor + '44', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 22 }}>{icon}</Text>
                  </View>
                  <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.feature_labels![i]}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Name input */}
          {s.input_name && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: T.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' }}>Как тебя зовут?</Text>
              <TextInput
                value={name} onChangeText={setName}
                placeholder="Твоё имя (необязательно)"
                placeholderTextColor={T.muted}
                returnKeyType="done"
                style={{ height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: name ? accentColor + '99' : T.bord, backgroundColor: T.lo, color: T.txt, fontFamily: 'BarlowCondensed_900Black', fontSize: 22, textAlign: 'center' }}
              />
            </View>
          )}

          {/* Life areas */}
          {s.input_goals && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: T.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10, textAlign: 'center' }}>Что хочешь улучшить?</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {LIFE_AREAS.map(area => {
                  const sel = selectedAreas.includes(area.id);
                  return (
                    <TouchableOpacity key={area.id} onPress={() => toggleArea(area.id)}
                      style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: sel ? accentColor : T.bord, backgroundColor: sel ? accentColor + '22' : T.lo, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 15 }}>{area.emoji}</Text>
                      <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: sel ? accentColor : T.muted }}>{area.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <View style={{ flex: 1 }} />

          {/* CTA */}
          <TouchableOpacity onPress={next} activeOpacity={0.85}
            style={{ height: 56, borderRadius: 16, backgroundColor: accentColor, alignItems: 'center', justifyContent: 'center', shadowColor: accentColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 }}>
            <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 18, color: '#000', letterSpacing: 0.5 }}>{s.action}</Text>
          </TouchableOpacity>

          {step > 0 && (
            <TouchableOpacity onPress={() => setStep(x => x - 1)} style={{ height: 40, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
              <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.muted }}>← Назад</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
