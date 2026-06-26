// src/v6/screens/V6Home.tsx
//
// Главная страница V6. Чистая иерархия, без хаоса.
// Структура:
//   • Hero — крупный greeting + дата
//   • Today summary — БОЛЬШАЯ цифра (Score) + кольца прогресса
//   • Quick actions — 3卡片 в ряд
//   • Active quest — крупная карточка с CTA
//   • AI insight — маленькая подсказка
//   • Recent activity — timeline
import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Dimensions } from 'react-native';
import { ChevronRight, Plus, Activity, TrendingUp, Flame } from 'lucide-react-native';
import { V6Background } from '../components/V6Background';
import { V6Card } from '../components/V6Card';
import { v6Colors, v6Typography, v6Geometry } from '../theme';

const { width: W } = Dimensions.get('window');

interface Props {
  onNavigate: (screen: string) => void;
}

export function V6Home({ onNavigate }: Props) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
  const hour = today.getHours();
  const greeting = hour < 6 ? 'Доброй ночи' : hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер';

  return (
    <View style={styles.container}>
      <V6Background />

      <ScrollView
        contentContainerStyle={{ paddingTop: 60, paddingHorizontal: v6Geometry.screenPadding, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero — greeting + date, без "ГОРИЗОНТ" заголовка */}
        <View style={{ marginBottom: v6Geometry.sectionGap }}>
          <Text style={[v6Typography.caption, { color: v6Colors.textTertiary, textTransform: 'capitalize' }]}>
            {dateStr}
          </Text>
          <Text style={[v6Typography.title1, { color: v6Colors.textPrimary, marginTop: 4 }]}>
            {greeting}
          </Text>
        </View>

        {/* Today summary — БОЛЬШАЯ карточка с Score */}
        <V6Card style={{ marginBottom: v6Geometry.cardGap }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <View>
              <Text style={[v6Typography.micro, { color: v6Colors.textTertiary, textTransform: 'uppercase' }]}>
                Жизненный счёт
              </Text>
              <Text style={[v6Typography.display, { color: v6Colors.textPrimary, marginTop: 4 }]}>
                78
              </Text>
              <Text style={[v6Typography.caption, { color: v6Colors.textSecondary, marginTop: 2 }]}>
                из 100 · +5 за неделю
              </Text>
            </View>
            <View style={{
              paddingHorizontal: 10, paddingVertical: 5,
              backgroundColor: v6Colors.accentSoft, borderRadius: v6Geometry.chipRadius,
              flexDirection: 'row', alignItems: 'center', gap: 4,
            }}>
              <TrendingUp size={12} color={v6Colors.accent} />
              <Text style={[v6Typography.micro, { color: v6Colors.accent }]}>+6%</Text>
            </View>
          </View>
          {/* 3 прогресс-кольца */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <ProgressRing label="Тренировки" value={3} max={5} color={v6Colors.accent} />
            <ProgressRing label="Задачи" value={8} max={10} color={v6Colors.success} />
            <ProgressRing label="Дневник" value={5} max={7} color={v6Colors.warning} />
          </View>
        </V6Card>

        {/* Quick actions — 3 кнопки */}
        <View style={{ flexDirection: 'row', gap: v6Geometry.cardGap, marginBottom: v6Geometry.cardGap }}>
          <QuickAction emoji="💪" label="Тренировка" onPress={() => onNavigate('train')} />
          <QuickAction emoji="📔" label="Дневник" onPress={() => onNavigate('journal')} />
          <QuickAction emoji="🤖" label="Нейро AI" onPress={() => onNavigate('ai')} />
        </View>

        {/* Active quest — крупная CTA карточка */}
        <V6Card accent style={{ marginBottom: v6Geometry.cardGap }} onPress={() => onNavigate('train')}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{
              width: 48, height: 48, borderRadius: v6Geometry.iconRadius,
              backgroundColor: v6Colors.accent,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 24 }}>⚔️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[v6Typography.micro, { color: v6Colors.accent, textTransform: 'uppercase' }]}>
                Активный квест
              </Text>
              <Text style={[v6Typography.title2, { color: v6Colors.textPrimary, marginTop: 2 }]}>
                Дневная тренировка
              </Text>
              <Text style={[v6Typography.caption, { color: v6Colors.textSecondary, marginTop: 2 }]}>
                Верх + кор · 5 упражнений · 25 мин
              </Text>
            </View>
            <ChevronRight size={20} color={v6Colors.textTertiary} />
          </View>
        </V6Card>

        {/* AI insight — маленькая подсказка */}
        <V6Card style={{ marginBottom: v6Geometry.cardGap }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View style={{
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: v6Colors.accentSoft,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Activity size={16} color={v6Colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[v6Typography.bodyMedium, { color: v6Colors.textPrimary }]}>
                Сон снизился до 6.2ч
              </Text>
              <Text style={[v6Typography.caption, { color: v6Colors.textSecondary, marginTop: 4 }]}>
                Последние 3 дня ты спишь меньше нормы. Попробуй ложиться на 30 мин раньше.
              </Text>
            </View>
          </View>
        </V6Card>

        {/* Streak + Stats row */}
        <View style={{ flexDirection: 'row', gap: v6Geometry.cardGap, marginBottom: v6Geometry.cardGap }}>
          <V6Card style={{ flex: 1, alignItems: 'center' }}>
            <Flame size={20} color={v6Colors.warning} />
            <Text style={[v6Typography.display, { fontSize: 32, color: v6Colors.textPrimary, marginTop: 4 }]}>
              12
            </Text>
            <Text style={[v6Typography.micro, { color: v6Colors.textTertiary, textTransform: 'uppercase' }]}>
              дней подряд
            </Text>
          </V6Card>
          <V6Card style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 20 }}>🏆</Text>
            <Text style={[v6Typography.display, { fontSize: 32, color: v6Colors.textPrimary, marginTop: 4 }]}>
              8
            </Text>
            <Text style={[v6Typography.micro, { color: v6Colors.textTertiary, textTransform: 'uppercase' }]}>
              достижений
            </Text>
          </V6Card>
          <V6Card style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 20 }}>📊</Text>
            <Text style={[v6Typography.display, { fontSize: 32, color: v6Colors.textPrimary, marginTop: 4 }]}>
              47
            </Text>
            <Text style={[v6Typography.micro, { color: v6Colors.textTertiary, textTransform: 'uppercase' }]}>
              тренировок
            </Text>
          </V6Card>
        </View>

        {/* Recent activity */}
        <View style={{ marginBottom: v6Geometry.cardGap }}>
          <Text style={[v6Typography.title2, { color: v6Colors.textPrimary, marginBottom: 12 }]}>
            Недавняя активность
          </Text>
          <V6Card style={{ padding: 0 }}>
            {[
              { emoji: '💪', title: 'Тренировка · Верх + кор', time: 'Сегодня, 14:30', value: '+150 XP' },
              { emoji: '📔', title: 'Запись в дневнике', time: 'Сегодня, 09:15', value: 'Настр. 4/5' },
              { emoji: '✓', title: 'Привычка · Вода 8 стаканов', time: 'Вчера, 21:00', value: '✓' },
              { emoji: '🥗', title: 'Питание · Куриная грудка', time: 'Вчера, 13:20', value: '165 ккал' },
            ].map((item, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  paddingHorizontal: v6Geometry.cardPadding,
                  paddingVertical: 14,
                  borderBottomWidth: i < 3 ? 1 : 0,
                  borderBottomColor: v6Colors.divider,
                }}
              >
                <View style={{
                  width: 36, height: 36, borderRadius: 10,
                  backgroundColor: v6Colors.accentSoft,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 16 }}>{item.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[v6Typography.bodyMedium, { color: v6Colors.textPrimary }]}>
                    {item.title}
                  </Text>
                  <Text style={[v6Typography.caption, { color: v6Colors.textTertiary, marginTop: 2 }]}>
                    {item.time}
                  </Text>
                </View>
                <Text style={[v6Typography.mono, { color: v6Colors.accent }]}>
                  {item.value}
                </Text>
              </View>
            ))}
          </V6Card>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Progress Ring ──────────────────────────────────────────────────────────
function ProgressRing({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = (value / max) * 100;
  const size = 56;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  // Используем SVG inline
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <SvgRing size={size} stroke={stroke} r={r} circ={circ} pct={pct} color={color} value={value} />
      <Text style={[v6Typography.micro, { color: v6Colors.textTertiary, marginTop: 6, textAlign: 'center' }]}>
        {label}
      </Text>
    </View>
  );
}

function SvgRing({ size, stroke, r, circ, pct, color, value }: any) {
  // Импортируем внутри чтобы не плодить зависимостей в начале файла
  const Svg = require('react-native-svg').default;
  const Circle = Svg.Circle;
  const offset = circ - (circ * pct / 100);
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={v6Colors.divider} strokeWidth={stroke} />
      <Circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${circ} ${circ}`} strokeDashoffset={offset}
        strokeLinecap="round"
        rotation="-90" origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
}

// ── Quick Action ───────────────────────────────────────────────────────────
function QuickAction({ emoji, label, onPress }: { emoji: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{
        flex: 1,
        backgroundColor: v6Colors.card,
        borderRadius: v6Geometry.cardRadius,
        padding: 16,
        alignItems: 'center',
        gap: 8,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4, shadowRadius: 12, elevation: v6Geometry.cardElevation,
        transform: [{ scale: pressed ? 0.96 : 1 }],
      }]}
    >
      <View style={{
        width: 40, height: 40, borderRadius: v6Geometry.iconRadius,
        backgroundColor: v6Colors.accentSoft,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 20 }}>{emoji}</Text>
      </View>
      <Text style={[v6Typography.caption, { color: v6Colors.textPrimary, textAlign: 'center' }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: v6Colors.void },
});
