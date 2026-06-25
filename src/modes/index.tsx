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
export type UIModeId = 'focus' | 'aurora' | 'neon' | 'paper' | 'quest';

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
    desc: 'Минимализм. Чистые линии, монохром с одним акцентом. Как Linear / Notion.',
    cardBg: (T) => T.card,
    cardBorder: (T) => T.bord,
    cardBorderWidth: 1,
    cardRadius: 12,
    cardBlur: false,
    cardShadow: false,
    cardGlow: false,
    btnRadius: 8,
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
];

export function getUIMode(id: string | undefined): UIMode {
  return UI_MODES.find(m => m.id === id) || UI_MODES[0];
}

// ── Backgrounds ─────────────────────────────────────────────────────────────

// 1. FOCUS — subtle dot grid
function FocusBackground({ T }: { T: Theme }) {
  const spacing = 24;
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
            opacity: 0.18,
          }}
        />
      );
    }
  }
  return <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>{dots}</View>;
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

// ── Dispatcher ──────────────────────────────────────────────────────────────
export function ModeBackground({ T, mode }: { T: Theme; mode: UIModeId }) {
  switch (mode) {
    case 'focus':  return <FocusBackground T={T} />;
    case 'aurora': return <AuroraBackground T={T} />;
    case 'neon':   return <NeonBackground T={T} />;
    case 'paper':  return <PaperBackground T={T} />;
    case 'quest':  return <QuestBackground T={T} />;
    default:       return <FocusBackground T={T} />;
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

  const glowStyle: ViewStyle = mode === 'neon' && variant === 'primary' ? {
    shadowColor: T.primary,
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
                  letterSpacing: mode === 'neon' ? 1.5 : 0.5,
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
        fontSize: mode === 'paper' ? 24 : 22,
        color: m.accentOverride(T) || T.txt,
        letterSpacing: mode === 'neon' ? 3 : 1,
      }}>
        {mode === 'neon' ? '> ' : mode === 'quest' ? '⚜ ' : ''}{title}
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
