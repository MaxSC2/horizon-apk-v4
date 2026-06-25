// src/screens/SettingsScreen.tsx — v4.1 — centralized settings
//
// Moved out of StatsScreen → Profile tab so settings are easier to find.
// Sections:
//   1. Внешний вид (theme + UI style)
//   2. Профиль (max pushups, name)
//   3. AI-ментор (provider, model, API key, persona, system prompt, test)
//   4. Будильник (sync, purge, test, diagnostics link)
//   5. Данные (export, import, reset)
//   6. О приложении
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Switch, Alert,
  Linking, Share, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Palette, Sparkles, Bell, Database, Info, ChevronRight, X, Check,
  Trash2, Download, Upload, RefreshCw, Zap, User, MessageSquare,
} from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useApp } from '../AppContext';
import { Card, Lbl, IconBtn, Btn, SectionHeader, Divider } from '../components';
import { THEMES } from '../theme';
import { UI_STYLES } from '../styles';
import { AI_PROVIDERS } from '../data';
import { AIConfig } from '../types';
import { callAI } from './MentorScreen';
import { scheduleTestAlarm, canScheduleExactAlarms, openAlarmPermissionSettings } from '../alarm';
import { UI_MODES, UIModeId, ModeBackground, ModeCard, getUIMode } from '../modes';

const PERSONA_PRESETS = [
  { id: 'coach',   emoji: '💪', label: 'Тренер',     text: 'Ты строгий, но поддерживающий тренер. Короткие чёткие указания, без воды.' },
  { id: 'friend',  emoji: '🤝', label: 'Друг',       text: 'Ты дружелюбный приятель. На «ты», с шутками и эмоциями, но по делу.' },
  { id: 'science', emoji: '🔬', label: 'Учёный',     text: 'Ты научный консультант. Объясняй механизмы, цитируй исследования, будь точным.' },
  { id: 'stoic',   emoji: '🧘', label: 'Стоик',      text: 'Ты мудрый наставник в духе стоиков. Спокойно, лаконично, с фокусом на дисциплине.' },
  { id: 'custom',  emoji: '✦',  label: 'Свой',       text: '' },
];

export default function SettingsScreen() {
  const { state, setState, T, exportData, resyncAlarms, purgeAlarms, uiMode } = useApp();
  const insets = useSafeAreaInsets();
  const [expandedSection, setExpandedSection] = useState<string | null>('appearance');

  // AI config local state (edited separately, saved on blur / button press)
  const ai: AIConfig = state.aiConfig || { provider: 'claude', apiKey: '', model: '', endpoint: '', persona: '', systemExtra: '' };
  const [apiKey, setApiKey] = useState(ai.apiKey || '');
  const [endpoint, setEndpoint] = useState(ai.endpoint || '');
  const [persona, setPersona] = useState(ai.persona || '');
  const [systemExtra, setSystemExtra] = useState(ai.systemExtra || '');
  const [customModel, setCustomModel] = useState((ai as any).customModel || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingAI, setTestingAI] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    setApiKey(ai.apiKey || '');
    setEndpoint(ai.endpoint || '');
    setPersona(ai.persona || '');
    setSystemExtra(ai.systemExtra || '');
    setCustomModel((ai as any).customModel || '');
  }, [state.aiConfig]);

  const prov = AI_PROVIDERS.find(p => p.id === (ai.provider || 'claude')) || AI_PROVIDERS[0];
  const model = ai.model || prov.defaultModel;

  const updateAI = (patch: Partial<AIConfig>) => {
    setState(s => ({ ...s, aiConfig: { ...s.aiConfig, ...patch } as AIConfig }));
  };

  const handleTestAI = async () => {
    setTestingAI(true);
    setTestResult(null);
    try {
      const reply = await callAI(
        [{ role: 'user', content: 'Скажи «соединение установлено» одним предложением.', ts: Date.now() }],
        'Ты — AI-ассистент. Ответь коротко.',
        { ...ai, apiKey, endpoint, persona, systemExtra, customModel } as AIConfig,
      );
      setTestResult({ ok: true, msg: `✓ ${reply.slice(0, 80)}` });
    } catch (e: any) {
      setTestResult({ ok: false, msg: `✗ ${e?.message || String(e)}` });
    } finally {
      setTestingAI(false);
    }
  };

  const handleExport = async () => {
    try {
      const json = await exportData();
      const fn = `horizon-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const path = `${FileSystem.cacheDirectory || ''}${fn}`;
      await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'Экспорт данных ГОРИЗОНТ' });
      } else {
        Alert.alert('✓ Готово', `Данные экспортированы в ${path}`);
      }
    } catch (e: any) {
      Alert.alert('Ошибка экспорта', e?.message || String(e));
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Сбросить все данные?',
      'Тренировки, задачи, цели, дневник, будильники, AI-история — всё будет удалено безвозвратно.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить всё',
          style: 'destructive',
          onPress: async () => {
            await purgeAlarms();
            setState({ ...require('../storage').DEFAULTS, themeId: state.themeId, uiStyleId: state.uiStyleId });
            Alert.alert('✓ Сброшено', 'Все данные удалены.');
          },
        },
      ]
    );
  };

  const handlePurgeAlarms = () => {
    Alert.alert(
      'Сбросить все уведомления будильника?',
      'Отменит ВСЕ запланированные уведомления. Включённые будильники перепланируются при следующем запуске приложения. Полезно если будильники приходят после удаления.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Сбросить',
          style: 'destructive',
          onPress: async () => {
            await purgeAlarms();
            setState(s => ({ ...s, alarms: (s.alarms || []).map(a => ({ ...a, enabled: false })) }));
            Alert.alert('✓ Готово', 'Все уведомления сброшены. Перезапусти приложение для авто-синхронизации.');
          },
        },
      ]
    );
  };

  const handleTestAlarm = async () => {
    const ok = await canScheduleExactAlarms();
    if (!ok) {
      Alert.alert(
        '⚠️ Разрешение не получено',
        'Для работы будильника нужно разрешение на Android 12+.\n\nОткрой настройки и включи «Будильники и напоминания».',
        [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Открыть настройки', onPress: () => openAlarmPermissionSettings() },
        ]
      );
      return;
    }
    await scheduleTestAlarm(10);
    Alert.alert('🔔 Тест запущен', 'Сигнал прозвучит через 10 секунд.');
  };

  const toggleSection = (id: string) => setExpandedSection(prev => prev === id ? null : id);

  // Section component
  const Section = ({ id, icon, title, subtitle, children }: any) => {
    const expanded = expandedSection === id;
    return (
      <Card T={T} style={{ marginBottom: 10, padding: 0, overflow: 'hidden' }}>
        <TouchableOpacity
          onPress={() => toggleSection(id)}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 12,
            paddingHorizontal: 16, paddingVertical: 14,
          }}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <View style={{
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: T.primary + '18', borderWidth: 1, borderColor: T.primary + '44',
            alignItems: 'center', justifyContent: 'center',
          }}>
            {icon}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 16, color: T.txt }}>{title}</Text>
            {subtitle && <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 11, color: T.muted, marginTop: 1 }}>{subtitle}</Text>}
          </View>
          <ChevronRight size={18} color={T.muted} style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }} />
        </TouchableOpacity>
        {expanded && (
          <View style={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 }}>
            <Divider T={T} />
            {children}
          </View>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <ModeBackground T={T} mode={uiMode} />
      {/* Header */}
      <View style={{
        backgroundColor: uiMode === 'aurora' ? 'transparent' : T.surf, borderBottomWidth: uiMode === 'aurora' ? 0 : 1, borderBottomColor: T.bord,
        paddingHorizontal: 16, paddingVertical: 12,
      }}>
        <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 22, color: T.txt, letterSpacing: 1 }}>⚙️ Настройки</Text>
        <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 11, color: T.muted, marginTop: 2 }}>Внешний вид, AI, будильник, данные</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>

        {/* ── 1. Внешний вид ── */}
        <Section
          id="appearance"
          icon={<Palette size={18} color={T.primary} />}
          title="Внешний вид"
          subtitle={`${getUIMode(state.uiMode).name} · ${THEMES.find(t => t.id === state.themeId)?.name || 'Космос'}`}
        >
          {/* v4.2 — Interface mode picker with live preview */}
          <View style={{ marginTop: 12 }}>
            <Lbl T={T} style={{ marginBottom: 8 }}>🎭 Режим интерфейса</Lbl>
            <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 11, color: T.muted, marginBottom: 10, lineHeight: 16 }}>
              Кардинально разные визуальные стили — от минимализма до геймификации. Каждый режим меняет фон, карточки, кнопки и анимации.
            </Text>

            {/* Live preview block */}
            <View style={{
              height: 100, borderRadius: 14, overflow: 'hidden',
              marginBottom: 12, borderWidth: 1, borderColor: T.bord,
            }}>
              <ModeBackground T={T} mode={getUIMode(state.uiMode).id} />
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: 12, justifyContent: 'center' }}>
                <ModeCard T={T} mode={getUIMode(state.uiMode).id} style={{ padding: 10 }}>
                  <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 14, color: T.txt }}>
                    {getUIMode(state.uiMode).emoji} {getUIMode(state.uiMode).name}
                  </Text>
                  <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 10, color: T.muted, marginTop: 2 }}>
                    Превью карточки в этом режиме
                  </Text>
                </ModeCard>
              </View>
            </View>

            {/* Mode grid 2×3 */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {UI_MODES.map(m => {
                const cur = (state.uiMode || 'focus') === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => setState(s => ({ ...s, uiMode: m.id }))}
                    style={{
                      width: '48%', padding: 12, borderRadius: 12,
                      borderWidth: cur ? 2 : 1,
                      borderColor: cur ? T.primary : T.bord,
                      backgroundColor: cur ? T.primary + '15' : T.lo,
                    }}
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Text style={{ fontSize: 20 }}>{m.emoji}</Text>
                      <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 14, color: cur ? T.primary : T.txt }}>{m.name}</Text>
                    </View>
                    <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 10, color: T.muted, lineHeight: 14 }}>
                      {m.desc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={{ marginTop: 16 }}>
            <Lbl T={T} style={{ marginBottom: 8 }}>Тема оформления (цвета)</Lbl>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {THEMES.map(theme => {
                const cur = (state.themeId || 'cosmos') === theme.id;
                return (
                  <TouchableOpacity
                    key={theme.id}
                    onPress={() => setState(s => ({ ...s, themeId: theme.id }))}
                    style={{
                      width: 46, height: 46, borderRadius: 12,
                      borderWidth: cur ? 2.5 : 2,
                      borderColor: cur ? theme.primary : T.bord,
                      backgroundColor: theme.bg,
                      alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  >
                    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 8, backgroundColor: theme.primary }} />
                    <Text style={{ fontSize: 16, zIndex: 1 }}>{theme.icon}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={{ marginTop: 16 }}>
            <Lbl T={T} style={{ marginBottom: 8 }}>Стиль интерфейса (тонкая настройка)</Lbl>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {UI_STYLES.map(s => {
                const cur = (state.uiStyleId || 'default') === s.id;
                return (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => setState(s2 => ({ ...s2, uiStyleId: s.id }))}
                    style={{
                      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
                      borderWidth: cur ? 2 : 1,
                      borderColor: cur ? T.success : T.bord,
                      backgroundColor: cur ? T.success + '18' : T.lo,
                      flexDirection: 'row', alignItems: 'center', gap: 6,
                    }}
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  >
                    <Text style={{ fontSize: 13 }}>{s.emoji}</Text>
                    <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 12, color: cur ? T.success : T.muted }}>{s.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Section>

        {/* ── 2. Профиль ── */}
        <Section
          id="profile"
          icon={<User size={18} color={T.success} />}
          title="Профиль"
          subtitle={`Макс. отжиманий: ${state.user?.maxPushups || 15}`}
        >
          <View style={{ marginTop: 12 }}>
            <Lbl T={T} style={{ marginBottom: 8 }}>Максимум отжиманий</Lbl>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <IconBtn
                onPress={() => setState(s => ({ ...s, user: { ...s.user, maxPushups: Math.max(1, (s.user.maxPushups || 15) - 1) } }))}
                T={T} size={42} bg={T.lo} border={T.bord}
              >
                <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 22, color: T.muted }}>{"−"}</Text>
              </IconBtn>
              <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 36, color: T.primary, flex: 1, textAlign: 'center' }}>{state.user?.maxPushups || 15}</Text>
              <IconBtn
                onPress={() => setState(s => ({ ...s, user: { ...s.user, maxPushups: (s.user.maxPushups || 15) + 1 } }))}
                T={T} size={42} bg={T.lo} border={T.bord}
              >
                <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 22, color: T.muted }}>{"+"}</Text>
              </IconBtn>
            </View>
            <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 11, color: T.muted, marginTop: 8, textAlign: 'center' }}>От этого значения считается рабочий диапазон 60–70%</Text>
          </View>
        </Section>

        {/* ── 3. AI-ментор ── */}
        <Section
          id="ai"
          icon={<Sparkles size={18} color="#C77DFF" />}
          title="AI-ментор (НЕЙРО)"
          subtitle={`${prov.name} · ${model}${prov.needsKey ? (apiKey ? ' · ✓ ключ' : ' · ⚠ нет ключа') : ' · бесплатно'}`}
        >
          {/* Provider picker */}
          <View style={{ marginTop: 12 }}>
            <Lbl T={T} style={{ marginBottom: 8 }}>Провайдер</Lbl>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {AI_PROVIDERS.map(p => {
                const cur = (ai.provider || 'claude') === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => updateAI({ provider: p.id, model: p.defaultModel, apiKey: '', endpoint: '' })}
                    style={{
                      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
                      borderWidth: cur ? 2 : 1,
                      borderColor: cur ? p.color : T.bord,
                      backgroundColor: cur ? p.color + '18' : T.lo,
                      flexDirection: 'row', alignItems: 'center', gap: 6,
                    }}
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  >
                    <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: cur ? p.color : T.muted }}>{p.short}</Text>
                    {p.badge && <Text style={{ fontSize: 9, color: cur ? p.color : T.muted, opacity: 0.7 }}>({p.badge})</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 12, color: T.muted, marginTop: 8, lineHeight: 17 }}>{prov.desc}</Text>
          </View>

          {/* Model picker */}
          {prov.models.length > 0 && (
            <View style={{ marginTop: 14 }}>
              <Lbl T={T} style={{ marginBottom: 8 }}>Модель</Lbl>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {prov.models.map(m => {
                  const cur = (ai.model || prov.defaultModel) === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      onPress={() => updateAI({ model: m })}
                      style={{
                        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
                        borderWidth: cur ? 1.5 : 1,
                        borderColor: cur ? T.primary : T.bord,
                        backgroundColor: cur ? T.primary + '15' : T.lo,
                      }}
                      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                    >
                      <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 11, color: cur ? T.primary : T.muted }}>{m}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Custom model (for custom provider) */}
          {prov.id === 'custom' && (
            <View style={{ marginTop: 14 }}>
              <Lbl T={T} style={{ marginBottom: 6 }}>Название модели</Lbl>
              <TextInput
                value={customModel} onChangeText={setCustomModel}
                onBlur={() => updateAI({ customModel } as any)}
                placeholder="например, gpt-3.5-turbo"
                placeholderTextColor={T.muted}
                autoCapitalize="none"
                autoCorrect={false}
                style={{
                  height: 44, borderRadius: 10, borderWidth: 1.5,
                  borderColor: T.bord, backgroundColor: T.lo,
                  color: T.txt, fontFamily: 'Barlow_400Regular', fontSize: 14,
                  paddingHorizontal: 12,
                }}
              />
            </View>
          )}

          {/* API key */}
          {prov.needsKey && (
            <View style={{ marginTop: 14 }}>
              <Lbl T={T} style={{ marginBottom: 6 }}>API ключ {prov.keyPrefix && `(начинается с ${prov.keyPrefix})`}</Lbl>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <TextInput
                  value={apiKey} onChangeText={setApiKey}
                  onBlur={() => updateAI({ apiKey })}
                  placeholder="вставь ключ"
                  placeholderTextColor={T.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={!showApiKey}
                  style={{
                    flex: 1, height: 44, borderRadius: 10, borderWidth: 1.5,
                    borderColor: apiKey ? T.success : T.bord,
                    backgroundColor: T.lo,
                    color: T.txt, fontFamily: 'Barlow_400Regular', fontSize: 13,
                    paddingHorizontal: 12,
                  }}
                />
                <IconBtn onPress={() => setShowApiKey(s => !s)} T={T} size={42} bg={T.lo} border={T.bord}>
                  <Text style={{ fontSize: 11, color: T.muted }}>{showApiKey ? '👁' : '👁‍🗨'}</Text>
                </IconBtn>
              </View>
              {prov.hint && <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 10, color: T.muted, marginTop: 6 }}>Где взять: {prov.hint}</Text>}
            </View>
          )}

          {/* Endpoint (custom provider only) */}
          {prov.id === 'custom' && (
            <View style={{ marginTop: 14 }}>
              <Lbl T={T} style={{ marginBottom: 6 }}>Endpoint (OpenAI-совместимый)</Lbl>
              <TextInput
                value={endpoint} onChangeText={setEndpoint}
                onBlur={() => updateAI({ endpoint })}
                placeholder="https://api.example.com/v1/chat/completions"
                placeholderTextColor={T.muted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                style={{
                  height: 44, borderRadius: 10, borderWidth: 1.5,
                  borderColor: T.bord, backgroundColor: T.lo,
                  color: T.txt, fontFamily: 'Barlow_400Regular', fontSize: 12,
                  paddingHorizontal: 12,
                }}
              />
            </View>
          )}

          {/* Persona presets */}
          <View style={{ marginTop: 14 }}>
            <Lbl T={T} style={{ marginBottom: 8 }}>Персонаж</Lbl>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {PERSONA_PRESETS.map(p => {
                const cur = (persona || (ai.persona || '')) === p.text && p.id !== 'custom' ||
                  (p.id === 'custom' && persona && !PERSONA_PRESETS.find(x => x.id !== 'custom' && x.text === persona));
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => {
                      setPersona(p.text);
                      updateAI({ persona: p.text });
                    }}
                    style={{
                      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
                      borderWidth: cur ? 2 : 1,
                      borderColor: cur ? '#C77DFF' : T.bord,
                      backgroundColor: cur ? '#C77DFF18' : T.lo,
                      flexDirection: 'row', alignItems: 'center', gap: 6,
                    }}
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  >
                    <Text style={{ fontSize: 14 }}>{p.emoji}</Text>
                    <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 12, color: cur ? '#C77DFF' : T.muted }}>{p.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TextInput
              value={persona} onChangeText={setPersona}
              onBlur={() => updateAI({ persona })}
              placeholder="Опиши своего персонажа..."
              placeholderTextColor={T.muted}
              multiline
              style={{
                marginTop: 8, minHeight: 70, borderRadius: 10, borderWidth: 1.5,
                borderColor: T.bord, backgroundColor: T.lo,
                color: T.txt, fontFamily: 'Barlow_400Regular', fontSize: 13,
                paddingHorizontal: 12, paddingVertical: 10, textAlignVertical: 'top',
              }}
            />
          </View>

          {/* System prompt extra */}
          <View style={{ marginTop: 14 }}>
            <Lbl T={T} style={{ marginBottom: 6 }}>Доп. системный промпт (необязательно)</Lbl>
            <TextInput
              value={systemExtra} onChangeText={setSystemExtra}
              onBlur={() => updateAI({ systemExtra })}
              placeholder="Дополнительные инструкции для AI..."
              placeholderTextColor={T.muted}
              multiline
              style={{
                minHeight: 60, borderRadius: 10, borderWidth: 1.5,
                borderColor: T.bord, backgroundColor: T.lo,
                color: T.txt, fontFamily: 'Barlow_400Regular', fontSize: 13,
                paddingHorizontal: 12, paddingVertical: 10, textAlignVertical: 'top',
              }}
            />
          </View>

          {/* Test connection */}
          <View style={{ marginTop: 16 }}>
            <Btn
              onPress={handleTestAI}
              T={T}
              variant="ghost"
              size="md"
              fullWidth
              loading={testingAI}
              icon={<Zap size={15} color={T.primary} />}
            >
              Проверить соединение
            </Btn>
            {testResult && (
              <View style={{
                marginTop: 8, padding: 10, borderRadius: 10,
                backgroundColor: testResult.ok ? T.success + '15' : T.danger + '15',
                borderWidth: 1, borderColor: testResult.ok ? T.success + '44' : T.danger + '44',
              }}>
                <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 12, color: testResult.ok ? T.success : T.danger }}>{testResult.msg}</Text>
              </View>
            )}
          </View>
        </Section>

        {/* ── 4. Будильник ── */}
        <Section
          id="alarm"
          icon={<Bell size={18} color={T.warn} />}
          title="Будильник"
          subtitle="Синхронизация, тест, сброс уведомлений"
        >
          <View style={{ marginTop: 12, gap: 8 }}>
            <Btn onPress={async () => { await resyncAlarms(); Alert.alert('✓', 'Синхронизировано'); }} T={T} variant="muted" fullWidth icon={<RefreshCw size={15} color={T.txt} />}>
              Синхронизировать расписание
            </Btn>
            <Btn onPress={handleTestAlarm} T={T} variant="warn" fullWidth icon={<Zap size={15} color="#000" />}>
              Проверить сигнал (10 сек)
            </Btn>
            <Btn onPress={handlePurgeAlarms} T={T} variant="danger" fullWidth icon={<Trash2 size={15} color="#fff" />}>
              Сбросить все уведомления
            </Btn>
            <TouchableOpacity
              onPress={() => openAlarmPermissionSettings()}
              style={{ padding: 12, borderRadius: 10, backgroundColor: T.lo, borderWidth: 1, borderColor: T.bord, alignItems: 'center' }}
            >
              <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 12, color: T.primary }}>Открыть настройки Android →</Text>
            </TouchableOpacity>
          </View>
        </Section>

        {/* ── 5. Данные ── */}
        <Section
          id="data"
          icon={<Database size={18} color={T.primary} />}
          title="Данные"
          subtitle="Экспорт, импорт, сброс"
        >
          <View style={{ marginTop: 12, gap: 8 }}>
            <Btn onPress={handleExport} T={T} variant="ghost" fullWidth icon={<Download size={15} color={T.primary} />}>
              Экспорт в JSON
            </Btn>
            <Btn onPress={handleReset} T={T} variant="danger" fullWidth icon={<Trash2 size={15} color="#fff" />}>
              Сбросить все данные
            </Btn>
          </View>
        </Section>

        {/* ── 6. О приложении ── */}
        <Section
          id="about"
          icon={<Info size={18} color={T.muted} />}
          title="О приложении"
          subtitle="ГОРИЗОНТ v4.3.0"
        >
          <View style={{ marginTop: 12, alignItems: 'center', paddingVertical: 12 }}>
            <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 28, letterSpacing: 3, color: T.txt }}>ГОРИЗОНТ</Text>
            <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.muted, marginTop: 4 }}>Life Tracker · v4.3.0 · Expo React Native</Text>
            <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 11, color: T.muted, marginTop: 2 }}>Тело · Разум · Дисциплина · Горизонт</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Text style={{ fontSize: 10, color: T.muted }}>⏰ Notifee alarms</Text>
              <Text style={{ fontSize: 10, color: T.muted }}>🤖 Claude / GPT / Gemini / Groq</Text>
              <Text style={{ fontSize: 10, color: T.muted }}>📊 9 экранов</Text>
              <Text style={{ fontSize: 10, color: T.muted }}>🎨 8 тем · 7 стилей</Text>
            </View>
          </View>
        </Section>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
