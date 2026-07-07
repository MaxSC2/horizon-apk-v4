// src/v6/screens/V6Mentor.tsx — HORIZON V6
//
// AI чат в чистом v6 стиле. Без v4 темы.
// Структура:
//   • Header — компактный, с провайдером и моделью
//   • Messages — chat bubbles (user справа с accent, AI слева с card bg)
//   • Quick prompts — горизонтальный скролл
//   • Input — фиксированный внизу с blur фоном
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Send, Sparkles, ChevronLeft } from 'lucide-react-native';
import { V6Background } from '../components/V6Background';
import { V6Card } from '../components/V6Card';
import { v6Colors, v6Typography, v6Geometry } from '../theme';
import { callAI } from '../../screens/MentorScreen';
import { buildAIContext } from '../../helpers';
import { useApp } from '../../AppContext';
import { ChatMessage } from '../../types';

const QUICK_PROMPTS = [
  { icon: '📊', text: 'Проанализируй мои тренировки' },
  { icon: '⚡', text: 'Как мне прогрессировать?' },
  { icon: '❤️', text: 'Советы по восстановлению' },
  { icon: '📅', text: 'Составь план на неделю' },
  { icon: '🎯', text: 'Помоги с моими целями' },
  { icon: '⚖️', text: 'Питание и вес' },
];

export function V6Mentor({ onBack }: { onBack: () => void }) {
  const { state } = useApp();
  const aiConfig = state.aiConfig || { provider: 'claude', apiKey: '', model: '', endpoint: '' } as any;
  const [messages, setMessages] = useState<ChatMessage[]>(() => state.aiHistory || []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, loading]);

  const send = async (text?: string) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput('');
    const userMsg: ChatMessage = { role: 'user', content: userText, ts: Date.now() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setLoading(true);
    try {
      const reply = await callAI(newMsgs, buildAIContext(state), aiConfig);
      const aMsg: ChatMessage = { role: 'assistant', content: reply, ts: Date.now(), provider: aiConfig.provider || 'claude' };
      setMessages([...newMsgs, aMsg]);
    } catch (e: any) {
      setMessages([...newMsgs, { role: 'assistant', content: `Ошибка: ${e.message}`, ts: Date.now(), provider: 'error' }]);
    } finally {
      setLoading(false);
    }
  };

  const fmtTime = (ts: number) => new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.container}>
      <V6Background />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <ChevronLeft size={22} color={v6Colors.textPrimary} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.aiDot} />
              <Text style={[v6Typography.title2, { color: v6Colors.textPrimary }]}>Нейро</Text>
            </View>
            <Text style={[v6Typography.micro, { color: v6Colors.textTertiary, marginTop: 2 }]}>
              {aiConfig.provider || 'claude'} · готов к работе
            </Text>
          </View>
          <View style={styles.aiIcon}>
            <Sparkles size={16} color={v6Colors.accent} />
          </View>
        </View>

        {/* Quick prompts */}
        {messages.length === 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: v6Geometry.screenPadding, gap: 8, paddingBottom: 12 }}
          >
            {QUICK_PROMPTS.map((p, i) => (
              <Pressable
                key={i}
                onPress={() => send(p.text)}
                disabled={loading}
                style={({ pressed }) => [{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  paddingHorizontal: 14, paddingVertical: 8,
                  backgroundColor: v6Colors.card, borderRadius: 20,
                  opacity: loading ? 0.5 : 1,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                }]}
              >
                <Text style={{ fontSize: 14 }}>{p.icon}</Text>
                <Text style={[v6Typography.caption, { color: v6Colors.textSecondary }]}>{p.text}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: v6Geometry.screenPadding, paddingVertical: 12, gap: 14 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <View style={styles.welcomeIcon}>
                <Sparkles size={28} color={v6Colors.accent} />
              </View>
              <Text style={[v6Typography.title2, { color: v6Colors.textPrimary, marginTop: 16 }]}>
                Чем могу помочь?
              </Text>
              <Text style={[v6Typography.body, { color: v6Colors.textSecondary, marginTop: 8, textAlign: 'center', maxWidth: 280 }]}>
                AI-коуч знает твои тренировки, цели и настроение. Задай вопрос или выбери подсказку выше.
              </Text>
            </View>
          )}

          {messages.map((m, i) => {
            const isUser = m.role === 'user';
            return (
              <View key={i} style={{ alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                <View style={[
                  styles.bubble,
                  isUser ? styles.bubbleUser : styles.bubbleAI,
                ]}>
                  <Text style={[
                    v6Typography.body,
                    { color: isUser ? v6Colors.accentText : v6Colors.textPrimary },
                  ]}>
                    {m.content}
                  </Text>
                </View>
                <Text style={[v6Typography.micro, { color: v6Colors.textTertiary, marginTop: 4, marginHorizontal: 4 }]}>
                  {fmtTime(m.ts)}
                </Text>
              </View>
            );
          })}

          {loading && (
            <View style={{ alignItems: 'flex-start' }}>
              <View style={[styles.bubble, styles.bubbleAI]}>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {[0, 1, 2].map(i => (
                    <View key={i} style={styles.typingDot} />
                  ))}
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputWrap}>
          <View style={styles.inputRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Напиши сообщение..."
              placeholderTextColor={v6Colors.textTertiary}
              multiline
              style={styles.input}
              onSubmitEditing={() => send()}
            />
            <Pressable
              onPress={() => send()}
              disabled={!input.trim() || loading}
              style={({ pressed }) => [
                styles.sendBtn,
                { opacity: !input.trim() || loading ? 0.4 : 1, transform: [{ scale: pressed ? 0.92 : 1 }] },
              ]}
            >
              {loading ? (
                <ActivityIndicator color={v6Colors.accentText} size="small" />
              ) : (
                <Send size={18} color={v6Colors.accentText} />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: v6Colors.void },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: v6Geometry.screenPadding,
    paddingTop: 56, paddingBottom: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  aiDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: v6Colors.success,
    shadowColor: v6Colors.success, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 4,
  },
  aiIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: v6Colors.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  welcomeIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: v6Colors.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 18,
  },
  bubbleUser: {
    backgroundColor: v6Colors.accent,
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: v6Colors.card,
    borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  typingDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: v6Colors.textTertiary,
  },
  inputWrap: {
    paddingHorizontal: v6Geometry.screenPadding,
    paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1, borderTopColor: v6Colors.divider,
    backgroundColor: 'rgba(10, 10, 15, 0.95)',
  },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  input: {
    flex: 1, minHeight: 44, maxHeight: 100,
    backgroundColor: v6Colors.card, borderRadius: v6Geometry.inputRadius,
    paddingHorizontal: 16, paddingVertical: 12,
    color: v6Colors.textPrimary,
    fontFamily: v6Typography.body.fontFamily,
    fontSize: v6Typography.body.fontSize,
    lineHeight: v6Typography.body.lineHeight,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: v6Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
});
