// src/modes/index.tsx — v4.2 — Multi-mode interface system
//
// Five distinct interface paradigms, each with its own visual language,
// background, card style, and interactive elements. Users can switch
// between modes in Settings → "Режим интерфейса".
//
// Modes:
//   1. focus  — Минимализм (Linear/Notion-inspired, monochrome + 1 accent)
//   2. aurora — Aurora (iOS 18 / Apple Vision Pro glassmorphism)
//   3. neon   — Неон (Cyberpunk, glowing borders, animated grid)
//   4. paper  — Бумага (Bear / Day One, handwritten, organic)
//   5. quest  — Квест (Habitica / RPG, gamified, XP bars)
import React, { useEffect, useRef, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, Animated, Easing, StyleSheet,
  ViewStyle, TextStyle, Platform, Dimensions, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Defs, RadialGradient, Stop, Circle, Rect, G } from 'react-native-svg';
import { Theme } from '../types';

const { width: W, height: H } = Dimensions.get('window');

// ── Mode definition ─────────────────────────────────────────────────────────
export type UIModeId = 'focus' | 'aurora' | 'neon' | 'paper' | 'quest' | 'cosmic' | 'mono' | 'synthwave';

export interface UIMode {
  id: UIModeId;
  name: string;
  emoji: string;
  desc: string;
  cardBg: (T: Theme) => string | string[];
  cardBorder: (T: Theme) => string;
  cardBorderWidth: number;
  cardRadius: number;
  cardBlur: boolean;
  cardShadow: boolean;
  cardGlow: boolean;
  btnRadius: number;
  fontTitle: string;
  fontBody: string;
  fontMono: string;
  accentOverride: (T: Theme) => string | null;
}

export const UI_MODES: UIMode[] = [
  {
    id: 'focus',
    name: 'Фокус',
    emoji: '◇',
    desc: 'Современный минимализм. Gradient mesh, glass cards, micro-animations. Тренд 2025-2026.',
    cardBg: (T) => T.card,
    cardBorder: (T) => T.primary + '22',
    cardBorderWidth: 1,
    cardRadius: 18,
    cardBlur: false,    // v4.5: focus теперь использует полупрозрачный card + subtle shadow вместо blur
    cardShadow: true,   // v4.5: добавлен elevation shadow для глубины
    cardGlow: false,
    btnRadius: 12,
    fontTitle: 'BarlowCondensed_900Black',
    fontBody: 'Barlow_400Regular',
    fontMono: 'Barlow_500Medium',
    accentOverride: () => null,
  },
  {
    id: 'aurora',
    name: 'Аврора',
    emoji: '🌌',
    desc: 'Стеклянные карточки с blur, плавающие градиентные блобы. Как iOS 18.',
    cardBg: (T) => T.card,
    cardBorder: (T) => T.primary + '33',
    cardBorderWidth: 1,
    cardRadius: 22,
    cardBlur: true,
    cardShadow: true,
    cardGlow: false,
    btnRadius: 16,
    fontTitle: 'BarlowCondensed_900Black',
    fontBody: 'Barlow_400Regular',
    fontMono: 'Barlow_500Medium',
    accentOverride: () => null,
  },
  {
    id: 'neon',
    name: 'Неон',
    emoji: '⚡',
    desc: 'Киберпанк. Свечение, неоновые акценты, движущаяся сетка. Тех-виб.',
    cardBg: (T) => T.card,
    cardBorder: (T) => T.primary,
    cardBorderWidth: 1.5,
    cardRadius: 4,
    cardBlur: false,
    cardShadow: false,
    cardGlow: true,
    btnRadius: 4,
    fontTitle: 'BarlowCondensed_900Black',
    fontBody: 'Barlow_400Regular',
    fontMono: 'BarlowCondensed_700Bold',
    accentOverride: (T) => T.primary,
  },
  {
    id: 'paper',
    name: 'Бумага',
    emoji: '📜',
    desc: 'Тёплая бумага, рукописный шрифт, органичные формы. Как Bear / Day One.',
    cardBg: (T) => T.card,
    cardBorder: (T) => T.bord,
    cardBorderWidth: 1,
    cardRadius: 18,
    cardBlur: false,
    cardShadow: true,
    cardGlow: false,
    btnRadius: 14,
    fontTitle: 'BarlowCondensed_700Bold',
    fontBody: 'Barlow_400Regular',
    fontMono: 'Barlow_500Medium',
    accentOverride: () => null,
  },
  {
    id: 'quest',
    name: 'Квест',
    emoji: '⚔️',
    desc: 'Геймификация. XP-бары, золотые углы, анимация. Как Habitica / RPG.',
    cardBg: (T) => T.card,
    cardBorder: (T) => T.warn + '88',
    cardBorderWidth: 2,
    cardRadius: 8,
    cardBlur: false,
    cardShadow: true,
    cardGlow: false,
    btnRadius: 6,
    fontTitle: 'BarlowCondensed_900Black',
    fontBody: 'Barlow_400Regular',
    fontMono: 'BarlowCondensed_700Bold',
    accentOverride: (T) => T.warn,
  },
  {
    id: 'cosmic',
    name: 'Космос',
    emoji: '🪐',
    desc: 'Глубокий космос. Орбиты планет, мерцающие звёзды, туманности. Для мечтателей.',
    cardBg: (T) => T.card,
    cardBorder: (T) => T.primary + '55',
    cardBorderWidth: 1,
    cardRadius: 16,
    cardBlur: false,
    cardShadow: true,
    cardGlow: true,
    btnRadius: 12,
    fontTitle: 'BarlowCondensed_900Black',
    fontBody: 'Barlow_400Regular',
    fontMono: 'Barlow_500Medium',
    accentOverride: (T) => T.primary,
  },
  {
    id: 'mono',
    name: 'Газета',
    emoji: '📰',
    desc: 'Газетный стиль. Чёрно-белый, серифные акценты, колонки. Для любителей классики.',
    cardBg: (T) => T.card,
    cardBorder: (T) => T.txt + '33',
    cardBorderWidth: 1,
    cardRadius: 2,
    cardBlur: false,
    cardShadow: false,
    cardGlow: false,
    btnRadius: 0,
    fontTitle: 'BarlowCondensed_900Black',
    fontBody: 'Barlow_400Regular',
    fontMono: 'Barlow_500Medium',
    accentOverride: (T) => T.txt,
  },
  {
    id: 'synthwave',
    name: 'Synthwave',
    emoji: '🌅',
    desc: 'Ретро 80-х. Сетка-перспектива, неоновый закат, лазурно-розовая палитра.',
    cardBg: (T) => T.card,
    cardBorder: (T) => '#FF00FF',
    cardBorderWidth: 1.5,
    cardRadius: 6,
    cardBlur: false,
    cardShadow: true,
    cardGlow: true,
    btnRadius: 4,
    fontTitle: 'BarlowCondensed_900Black',
    fontBody: 'Barlow_400Regular',
    fontMono: 'BarlowCondensed_700Bold',
    accentOverride: () => '#FF00FF',
  },
];

export function getUIMode(id: string | undefined): UIMode {
  return UI_MODES.find(m => m.id === id) || UI_MODES[0];
}

// ── Backgrounds ─────────────────────────────────────────────────────────────

// 1. FOCUS — v4.5 modern gradient mesh + subtle animated glow
// Современный тренд 2025-2026: медленно дышащие цветные «облака» поверх
// монохромного градиента. Создаёт ощущение глубины без перегрузки.
function FocusBackground({ T }: { T: Theme }) {
  const breathe = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 8000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(breathe, { toValue: 0, duration: 8000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    );
    const driftLoop = Animated.loop(
      Animated.timing(drift, { toValue: 1, duration: 40000, easing: Easing.inOut(Easing.ease), useNativeDriver: false })
    );
    breatheLoop.start(); driftLoop.start();
    return () => { breatheLoop.stop(); driftLoop.stop(); };
  }, []);

  const breatheOpacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.10, 0.20] });
  const driftX = drift.interpolate({ inputRange: [0, 0.5, 1], outputRange: [-50, 50, -50] });
  const driftY = drift.interpolate({ inputRange: [0, 0.5, 1], outputRange: [30, -30, 30] });

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: T.bg, overflow: 'hidden' }}>
      {/* Базовый вертикальный градиент — глубокий фон */}
      <LinearGradient
        colors={[T.bg, T.lo, T.bg]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Дышащее цветное облако сверху-слева (primary) */}
      <Animated.View style={{
        position: 'absolute', top: -120, left: -100,
        width: 360, height: 360, borderRadius: 180,
        backgroundColor: T.primary,
        opacity: breatheOpacity,
        transform: [{ translateX: driftX }, { translateY: driftY }],
      }} />

      {/* Второе облако снизу-справа (accent) — медленнее, в противофазе */}
      <Animated.View style={{
        position: 'absolute', bottom: -150, right: -120,
        width: 400, height: 400, borderRadius: 200,
        backgroundColor: (T as any).success || '#00E676',
        opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.16] }),
        transform: [{ translateX: drift.interpolate({ inputRange: [0, 0.5, 1], outputRange: [40, -40, 40] }) }],
      }} />

      {/* Тонкая точечная сетка для текстуры (как Linear) */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.5 }}>
        {(() => {
          const spacing = 32;
          const cols = Math.ceil(W / spacing) + 1;
          const rows = Math.ceil(H / spacing) + 1;
          const dots: React.ReactNode[] = [];
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              dots.push(
                <View
                  key={`${r}-${c}`}
                  style={{
                    position: 'absolute',
                    left: c * spacing,
                    top: r * spacing,
                    width: 1, height: 1,
                    borderRadius: 0.5,
                    backgroundColor: T.muted,
                    opacity: 0.12,
                  }}
                />
              );
            }
          }
          return dots;
        })()}
      </View>
    </View>
  );
}

// 2. AURORA — animated gradient blobs
function AuroraBackground({ T }: { T: Theme }) {
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop1 = Animated.loop(Animated.timing(anim1, { toValue: 1, duration: 18000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }));
    const loop2 = Animated.loop(Animated.timing(anim2, { toValue: 1, duration: 24000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }));
    const loop3 = Animated.loop(Animated.timing(anim3, { toValue: 1, duration: 30000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }));
    loop1.start(); loop2.start(); loop3.start();
    return () => { loop1.stop(); loop2.stop(); loop3.stop(); };
  }, []);

  const pos1 = anim1.interpolate({ inputRange: [0, 1], outputRange: [0, W - 280] });
  const pos2 = anim2.interpolate({ inputRange: [0, 1], outputRange: [W - 320, 0] });
  const pos3 = anim3.interpolate({ inputRange: [0, 1], outputRange: [H / 3, H - 320] });

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', backgroundColor: T.bg }}>
      <Animated.View style={{ position: 'absolute', left: pos1, top: 50, width: 280, height: 280, borderRadius: 140, backgroundColor: T.primary, opacity: 0.22 }} />
      <Animated.View style={{ position: 'absolute', left: pos2, top: pos3, width: 320, height: 320, borderRadius: 160, backgroundColor: (T as any).success || '#00E676', opacity: 0.18 }} />
      <Animated.View style={{ position: 'absolute', left: W / 3, top: pos3, width: 260, height: 260, borderRadius: 130, backgroundColor: '#C77DFF', opacity: 0.15 }} />
    </View>
  );
}

// 3. NEON — moving grid
function NeonBackground({ T }: { T: Theme }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(anim, { toValue: 1, duration: 12000, easing: Easing.linear, useNativeDriver: false }));
    loop.start();
    return () => loop.stop();
  }, []);
  const offset = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 40] });

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: T.bg, overflow: 'hidden' }}>
      <Animated.View style={{ position: 'absolute', top: -40, left: 0, right: 0, bottom: 0, transform: [{ translateY: offset }] }}>
        <Svg width="100%" height="100%">
          {Array.from({ length: 30 }, (_, i) => (
            <Rect key={`h${i}`} x={0} y={i * 40} width={W} height={0.5} fill={T.primary} opacity={0.08} />
          ))}
          {Array.from({ length: 30 }, (_, i) => (
            <Rect key={`v${i}`} x={i * 40} y={0} width={0.5} height={H} fill={T.primary} opacity={0.08} />
          ))}
        </Svg>
      </Animated.View>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: T.primary, opacity: 0.02 }} />
    </View>
  );
}

// 4. PAPER — warm gradient with noise
function PaperBackground({ T }: { T: Theme }) {
  return (
    <LinearGradient
      colors={[T.bg, T.lo, T.bg]}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
        {Array.from({ length: 80 }, (_, i) => {
          const x = (i * 137) % W;
          const y = (i * 71) % H;
          return <Circle key={i} cx={x} cy={y} r={1} fill={T.muted} opacity={0.08} />;
        })}
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#F5E6C8', opacity: 0.04 }} />
    </LinearGradient>
  );
}

// 5. QUEST — floating stars
function QuestBackground({ T }: { T: Theme }) {
  const stars = useMemo(() => Array.from({ length: 25 }, (_, i) => ({
    id: i,
    x: (i * 53) % W,
    y: (i * 89) % H,
    size: 1 + (i % 3),
    delay: (i * 200) % 3000,
  })), []);
  const opacities = useRef(stars.map(() => new Animated.Value(0.3))).current;

  useEffect(() => {
    const loops = stars.map((s, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(s.delay),
          Animated.timing(opacities[i], { toValue: 0.9, duration: 1500, useNativeDriver: false }),
          Animated.timing(opacities[i], { toValue: 0.2, duration: 1500, useNativeDriver: false }),
        ])
      )
    );
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, []);

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: T.bg, overflow: 'hidden' }}>
      <LinearGradient colors={['transparent', T.bg]} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.6 }} />
      {stars.map((s, i) => (
        <Animated.View
          key={s.id}
          style={{
            position: 'absolute', left: s.x, top: s.y,
            width: s.size, height: s.size, borderRadius: s.size / 2,
            backgroundColor: i % 4 === 0 ? T.warn : i % 4 === 1 ? T.primary : i % 4 === 2 ? T.success : '#C77DFF',
            opacity: opacities[i],
          }}
        />
      ))}
    </View>
  );
}

// 6. COSMIC — deep space with orbiting planets + twinkling stars
function CosmicBackground({ T }: { T: Theme }) {
  const orbit = useRef(new Animated.Value(0)).current;
  const twinkle = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loopOrbit = Animated.loop(Animated.timing(orbit, { toValue: 1, duration: 40000, easing: Easing.linear, useNativeDriver: false }));
    const loopTwinkle = Animated.loop(Animated.sequence([
      Animated.timing(twinkle, { toValue: 1, duration: 2000, useNativeDriver: false }),
      Animated.timing(twinkle, { toValue: 0.3, duration: 2000, useNativeDriver: false }),
    ]));
    loopOrbit.start(); loopTwinkle.start();
    return () => { loopOrbit.stop(); loopTwinkle.stop(); };
  }, []);

  const angle = orbit.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const angle2 = orbit.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: T.bg, overflow: 'hidden' }}>
      {/* Nebula glow */}
      <View style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, borderRadius: 200, backgroundColor: T.primary, opacity: 0.08 }} />
      <View style={{ position: 'absolute', bottom: -100, right: -100, width: 350, height: 350, borderRadius: 175, backgroundColor: '#C77DFF', opacity: 0.07 }} />

      {/* Twinkling stars */}
      {Array.from({ length: 40 }, (_, i) => {
        const x = (i * 89) % W;
        const y = (i * 53) % H;
        const size = i % 3 === 0 ? 2 : 1;
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute', left: x, top: y,
              width: size, height: size, borderRadius: size / 2,
              backgroundColor: '#FFFFFF',
              opacity: twinkle,
            }}
          />
        );
      })}

      {/* Orbit 1 — large planet */}
      <Animated.View style={{
        position: 'absolute', left: W / 2 - 130, top: H / 3 - 130,
        width: 260, height: 260, borderRadius: 130,
        borderWidth: 1, borderColor: T.primary + '22',
        transform: [{ rotate: angle }],
      }}>
        <View style={{ position: 'absolute', top: -8, left: 130 - 8, width: 16, height: 16, borderRadius: 8, backgroundColor: T.primary, opacity: 0.7 }} />
      </Animated.View>

      {/* Orbit 2 — small planet */}
      <Animated.View style={{
        position: 'absolute', left: W / 2 - 80, top: H / 3 - 80,
        width: 160, height: 160, borderRadius: 80,
        borderWidth: 1, borderColor: '#C77DFF33',
        transform: [{ rotate: angle2 }],
      }}>
        <View style={{ position: 'absolute', top: -5, left: 80 - 5, width: 10, height: 10, borderRadius: 5, backgroundColor: '#C77DFF', opacity: 0.6 }} />
      </Animated.View>
    </View>
  );
}

// 7. MONO — newspaper column lines, no animation, classic print
function MonoBackground({ T }: { T: Theme }) {
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: T.bg, overflow: 'hidden' }}>
      {/* Column rules (vertical lines like in newspaper) */}
      {[0.33, 0.66].map((pct, i) => (
        <View key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: W * pct, width: 1, backgroundColor: T.txt, opacity: 0.06 }} />
      ))}
      {/* Horizontal rules at top and bottom */}
      <View style={{ position: 'absolute', top: 80, left: 16, right: 16, height: 2, backgroundColor: T.txt, opacity: 0.18 }} />
      <View style={{ position: 'absolute', top: 84, left: 16, right: 16, height: 1, backgroundColor: T.txt, opacity: 0.12 }} />
      {/* Paper grain */}
      <Svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
        {Array.from({ length: 60 }, (_, i) => {
          const x = (i * 113) % W;
          const y = (i * 67) % H;
          return <Circle key={i} cx={x} cy={y} r={0.6} fill={T.txt} opacity={0.05} />;
        })}
      </Svg>
    </View>
  );
}

// 8. SYNTHWAVE — 80s perspective grid + neon sunset
function SynthwaveBackground({ T }: { T: Theme }) {
  const grid = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(grid, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: false }));
    loop.start();
    return () => loop.stop();
  }, []);

  const offset = grid.interpolate({ inputRange: [0, 1], outputRange: [0, 40] });
  const horizon = H * 0.45;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: T.bg, overflow: 'hidden' }}>
      {/* Sunset gradient (top half) */}
      <LinearGradient
        colors={['#1A0033', '#3D0066', '#FF006E', '#FFB400']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: horizon }}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      {/* Sun (semicircle) */}
      <View style={{
        position: 'absolute', top: horizon - 80, left: W / 2 - 80,
        width: 160, height: 160, borderRadius: 80,
        backgroundColor: '#FF006E',
        opacity: 0.85,
      }} />
      {/* Sun horizontal lines (80s style) */}
      {[0, 1, 2, 3, 4].map(i => (
        <View key={i} style={{
          position: 'absolute', top: horizon - 70 + i * 20, left: W / 2 - 80,
          width: 160, height: 3, backgroundColor: T.bg, opacity: 0.6,
        }} />
      ))}

      {/* Perspective grid (bottom half) */}
      <View style={{ position: 'absolute', top: horizon, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
        <Animated.View style={{ position: 'absolute', top: -40, left: 0, right: 0, bottom: -40, transform: [{ translateY: offset }] }}>
          <Svg width="100%" height="100%">
            {/* Horizontal grid lines (perspective) */}
            {Array.from({ length: 20 }, (_, i) => (
              <Rect key={`h${i}`} x={0} y={i * 30} width={W} height={1} fill="#FF00FF" opacity={0.35 - i * 0.01} />
            ))}
            {/* Vertical converging lines */}
            {Array.from({ length: 21 }, (_, i) => {
              const x = (i / 20) * W;
              const cx = W / 2;
              return <Rect key={`v${i}`} x={x} y={0} width={1} height={H * 0.6} fill="#00FFFF" opacity={0.25} transform={`translate(${(cx - x) * 0.7}, 0)`} />;
            })}
          </Svg>
        </Animated.View>
      </View>
    </View>
  );
}

// ── Dispatcher ──────────────────────────────────────────────────────────────
export function ModeBackground({ T, mode }: { T: Theme; mode: UIModeId }) {
  switch (mode) {
    case 'focus':     return <FocusBackground T={T} />;
    case 'aurora':    return <AuroraBackground T={T} />;
    case 'neon':      return <NeonBackground T={T} />;
    case 'paper':     return <PaperBackground T={T} />;
    case 'quest':     return <QuestBackground T={T} />;
    case 'cosmic':    return <CosmicBackground T={T} />;
    case 'mono':      return <MonoBackground T={T} />;
    case 'synthwave': return <SynthwaveBackground T={T} />;
    default:          return <FocusBackground T={T} />;
  }
}

// ── ModeCard ────────────────────────────────────────────────────────────────
interface ModeCardProps {
  children: React.ReactNode;
  T: Theme;
  mode: UIModeId;
  style?: ViewStyle;
  padding?: number;
}
export function ModeCard({ children, T, mode, style, padding }: ModeCardProps) {
  const m = getUIMode(mode);
  const cardStyle: ViewStyle = {
    borderRadius: m.cardRadius,
    borderWidth: m.cardBorderWidth,
    borderColor: m.cardBorder(T),
    padding: padding ?? 16,
    overflow: 'hidden',
  };

  const glowStyle: ViewStyle = m.cardGlow ? {
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 0,
  } : m.cardShadow ? {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  } : {};

  // Paper mode: slight rotation for organic feel (stable per-mount)
  const tiltRef = useRef(mode === 'paper' ? (Math.random() * 0.6 - 0.3) : 0).current;
  const paperTilt: ViewStyle = mode === 'paper' ? { transform: [{ rotate: `${tiltRef.toFixed(2)}deg` }] } : {};

  if (m.cardBlur && Platform.OS !== 'web') {
    return (
      <BlurView intensity={40} tint={T.dark ? 'dark' : 'light'} style={[cardStyle, glowStyle, paperTilt, style]}>
        {children}
      </BlurView>
    );
  }

  return (
    <View style={[cardStyle, { backgroundColor: T.card }, glowStyle, paperTilt, style]}>
      {mode === 'quest' && (
        <>
          <View style={{ position: 'absolute', top: 0, left: 0, width: 16, height: 16, borderTopLeftRadius: m.cardRadius, borderLeftWidth: 3, borderTopWidth: 3, borderColor: T.warn }} />
          <View style={{ position: 'absolute', top: 0, right: 0, width: 16, height: 16, borderTopRightRadius: m.cardRadius, borderRightWidth: 3, borderTopWidth: 3, borderColor: T.warn }} />
          <View style={{ position: 'absolute', bottom: 0, left: 0, width: 16, height: 16, borderBottomLeftRadius: m.cardRadius, borderLeftWidth: 3, borderBottomWidth: 3, borderColor: T.warn }} />
          <View style={{ position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, borderBottomRightRadius: m.cardRadius, borderRightWidth: 3, borderBottomWidth: 3, borderColor: T.warn }} />
        </>
      )}
      {mode === 'cosmic' && (
        <>
          {/* tiny star in top-right corner */}
          <View style={{ position: 'absolute', top: 8, right: 8, width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFFFFF', opacity: 0.8 }} />
          <View style={{ position: 'absolute', top: 14, right: 16, width: 2, height: 2, borderRadius: 1, backgroundColor: T.primary, opacity: 0.7 }} />
        </>
      )}
      {mode === 'mono' && (
        <>
          {/* Double rule at top */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderTopWidth: 2, borderBottomWidth: 1, borderColor: T.txt, opacity: 0.7 }} />
        </>
      )}
      {mode === 'synthwave' && (
        <>
          {/* Neon underline at bottom */}
          <LinearGradient
            colors={['#FF00FF', '#00FFFF', '#FF00FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, opacity: 0.85 }}
          />
        </>
      )}
      {children}
    </View>
  );
}

// ── ModeBtn ─────────────────────────────────────────────────────────────────
interface ModeBtnProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'ghost' | 'danger' | 'success' | 'muted' | 'warn';
  T: Theme;
  mode: UIModeId;
  style?: ViewStyle;
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  fullWidth?: boolean;
}
export function ModeBtn({
  children, onPress, variant = 'primary', T, mode, style,
  disabled, loading, size = 'md', icon, fullWidth,
}: ModeBtnProps) {
  const m = getUIMode(mode);
  const variantStyle: Record<string, { bg: string; border?: string; textColor: string }> = {
    primary: { bg: T.primary, textColor: '#000' },
    ghost:   { bg: 'transparent', border: T.primary, textColor: T.primary },
    danger:  { bg: T.danger, textColor: '#fff' },
    success: { bg: T.success, textColor: '#000' },
    muted:   { bg: T.lo, border: T.bord, textColor: T.txt },
    warn:    { bg: T.warn, textColor: '#000' },
  };
  const v = variantStyle[variant];
  const heights = { sm: 36, md: 48, lg: 56 };
  const fontSizes = { sm: 13, md: 15, lg: 17 };

  const glowStyle: ViewStyle = (mode === 'neon' || mode === 'synthwave' || mode === 'cosmic') && variant === 'primary' ? {
    shadowColor: mode === 'synthwave' ? '#FF00FF' : T.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 0,
  } : {};

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      style={[{
        minHeight: heights[size],
        paddingHorizontal: size === 'sm' ? 14 : 18,
        borderRadius: m.btnRadius,
        backgroundColor: v.bg,
        borderWidth: v.border ? 1.5 : 0,
        borderColor: v.border,
        alignItems: 'center', justifyContent: 'center',
        flexDirection: 'row', gap: 8,
        opacity: disabled ? 0.45 : 1,
        alignSelf: fullWidth ? 'stretch' : 'auto',
      }, glowStyle, style]}
    >
      {loading
        ? <ActivityIndicator color={v.textColor} size="small"/>
        : <>
            {icon}
            {typeof children === 'string'
              ? <Text style={{
                  fontFamily: mode === 'paper' ? 'Barlow_600SemiBold' : 'BarlowCondensed_700Bold',
                  fontSize: fontSizes[size],
                  color: v.textColor,
                  letterSpacing: mode === 'neon' ? 1.5 : mode === 'mono' ? 0 : mode === 'synthwave' ? 1.5 : 0.5,
                  textTransform: mode === 'mono' ? 'uppercase' as any : 'none' as any,
                }}>{children}</Text>
              : children}
          </>
      }
    </TouchableOpacity>
  );
}

// ── ModeHeader ──────────────────────────────────────────────────────────────
export function ModeHeader({ T, mode, title, subtitle }: { T: Theme; mode: UIModeId; title: string; subtitle?: string }) {
  const m = getUIMode(mode);
  return (
    <View style={{
      paddingHorizontal: 16, paddingVertical: 14,
      backgroundColor: mode === 'aurora' ? 'transparent' : T.surf,
      borderBottomWidth: mode === 'aurora' ? 0 : 1,
      borderBottomColor: T.bord,
    }}>
      <Text style={{
        fontFamily: m.fontTitle,
        fontSize: mode === 'paper' ? 24 : mode === 'mono' ? 26 : 22,
        color: m.accentOverride(T) || T.txt,
        letterSpacing: mode === 'neon' ? 3 : mode === 'mono' ? 0 : mode === 'synthwave' ? 2 : 1,
        textTransform: mode === 'mono' ? 'uppercase' as any : 'none' as any,
      }}>
        {mode === 'neon' ? '> ' : mode === 'quest' ? '⚜ ' : mode === 'cosmic' ? '✦ ' : mode === 'mono' ? '▎ ' : mode === 'synthwave' ? '◆ ' : ''}{title}
      </Text>
      {subtitle && (
        <Text style={{
          fontFamily: m.fontBody, fontSize: 11, color: T.muted, marginTop: 2,
          fontStyle: mode === 'paper' ? 'italic' : 'normal',
        }}>{subtitle}</Text>
      )}
    </View>
  );
}

// ── XP Bar (Quest mode only) ────────────────────────────────────────────────
export function XPBar({ T, level, xp, xpToNext }: { T: Theme; level: number; xp: number; xpToNext: number }) {
  const pct = Math.min(100, (xp / xpToNext) * 100);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: T.surf }}>
      <View style={{
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: T.warn, borderWidth: 2, borderColor: '#FFD700',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 14, color: '#000' }}>{level}</Text>
      </View>
      <View style={{ flex: 1, height: 12, backgroundColor: T.lo, borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: T.bord }}>
        <LinearGradient colors={['#FFD700', '#FFA500']} style={{ height: '100%', width: `${pct}%` }} />
      </View>
      <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 11, color: T.warn }}>{xp}/{xpToNext} XP</Text>
    </View>
  );
}
