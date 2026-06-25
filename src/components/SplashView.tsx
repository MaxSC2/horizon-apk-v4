// src/components/SplashView.tsx — v4.5
//
// Анимированный экран загрузки для каждой темы. Показывается:
//   1. При первом запуске приложения (поверх Expo splash)
//   2. При смене темы/режима (как переходная анимация)
//   3. При длительных операциях (AI запросы, экспорт)
//
// Каждый режим имеет свой уникальный анимационный паттерн:
//   focus     → Пульсирующее кольцо с градиентом
//   aurora    → Сливающиеся цветные блобы
//   neon      → Бегущая неоновая линия по контуру
//   paper     → Разворачивающийся свиток
//   quest     → Вращающийся щит с мечом
//   cosmic    → Расширяющиеся орбиты с планетами
//   mono      → Печатная машинка (появляющиеся символы)
//   synthwave → Сетка-перспектива с заходящим солнцем
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing, StyleSheet, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Rect, G, Path, Defs, Stop, RadialGradient } from 'react-native-svg';
import { Theme } from '../types';
import { UIModeId } from '../modes';

const { width: W, height: H } = Dimensions.get('window');

interface SplashViewProps {
  T: Theme;
  mode: UIModeId;
  // Текст надписи под логотипом
  label?: string;
  // Длительность показа в мс (0 = бесконечно, до unmount)
  duration?: number;
  // Показывать ли wordmark «ГОРИЗОНТ»
  showWordmark?: boolean;
  // Колбэк по завершении (если duration > 0)
  onDone?: () => void;
}

export function SplashView({ T, mode, label = 'Загрузка', duration = 0, showWordmark = true, onDone }: SplashViewProps) {
  // Общая fade-in анимация
  const fadeAnim = useRef(new Animated.Value(0)).current;
  // Для режима «печатная машинки» (mono)
  const [typedText, setTypedText] = useState('');

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: false }).start();
    if (duration > 0 && onDone) {
      const t = setTimeout(onDone, duration);
      return () => clearTimeout(t);
    }
  }, []);

  // Mono mode: typewriter effect
  useEffect(() => {
    if (mode !== 'mono') return;
    const full = label.toUpperCase();
    let i = 0;
    const interval = setInterval(() => {
      if (i <= full.length) {
        setTypedText(full.slice(0, i) + (i < full.length ? '▎' : ''));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 80);
    return () => clearInterval(interval);
  }, [mode, label]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, backgroundColor: T.bg }]}>
      {/* Mode-specific animated background */}
      <ModeSplashBackground T={T} mode={mode} />

      {/* Centered logo + wordmark */}
      <View style={styles.center}>
        <ModeLogo T={T} mode={mode} />
        {showWordmark && (
          <View style={{ marginTop: 24, alignItems: 'center' }}>
            <Text style={{
              fontFamily: 'BarlowCondensed_900Black',
              fontSize: 32,
              color: T.txt,
              letterSpacing: 4,
            }}>ГОРИЗОНТ</Text>
            <Text style={{
              fontFamily: 'Barlow_400Regular',
              fontSize: 11,
              color: T.muted,
              letterSpacing: 3,
              marginTop: 2,
            }}>LIFE TRACKER</Text>
          </View>
        )}
        {/* Label / loading text */}
        <View style={{ marginTop: 20 }}>
          {mode === 'mono' ? (
            <Text style={{ fontFamily: 'Barlow_500Medium', fontSize: 13, color: T.muted, letterSpacing: 1 }}>
              {typedText || ' '}
            </Text>
          ) : (
            <Text style={{
              fontFamily: 'Barlow_400Regular',
              fontSize: 13,
              color: T.muted,
              fontStyle: mode === 'paper' ? 'italic' : 'normal',
              letterSpacing: mode === 'neon' ? 2 : 0.5,
            }}>
              {mode === 'neon' ? '> ' : mode === 'quest' ? '⚜ ' : mode === 'cosmic' ? '✦ ' : mode === 'synthwave' ? '◆ ' : ''}
              {label}
              {mode === 'neon' && ' _'}
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
});

// ── Mode-specific animated backgrounds ──────────────────────────────────────

function ModeSplashBackground({ T, mode }: { T: Theme; mode: UIModeId }) {
  switch (mode) {
    case 'focus':     return <FocusSplashBg T={T} />;
    case 'aurora':    return <AuroraSplashBg T={T} />;
    case 'neon':      return <NeonSplashBg T={T} />;
    case 'paper':     return <PaperSplashBg T={T} />;
    case 'quest':     return <QuestSplashBg T={T} />;
    case 'cosmic':    return <CosmicSplashBg T={T} />;
    case 'mono':      return <MonoSplashBg T={T} />;
    case 'synthwave': return <SynthwaveSplashBg T={T} />;
    default:          return <FocusSplashBg T={T} />;
  }
}

function FocusSplashBg({ T }: { T: Theme }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2000, easing: Easing.out(Easing.sin), useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      <LinearGradient colors={[T.bg, T.lo, T.bg]} style={{ flex: 1 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <Animated.View style={{
        position: 'absolute', top: H / 2 - 200, left: W / 2 - 200,
        width: 400, height: 400, borderRadius: 200,
        backgroundColor: T.primary,
        opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.04, 0.14] }),
        transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.2] }) }],
      }} />
    </View>
  );
}

function AuroraSplashBg({ T }: { T: Theme }) {
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const l1 = Animated.loop(Animated.timing(a, { toValue: 1, duration: 6000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }));
    const l2 = Animated.loop(Animated.timing(b, { toValue: 1, duration: 8000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }));
    l1.start(); l2.start();
    return () => { l1.stop(); l2.stop(); };
  }, []);
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: T.bg, overflow: 'hidden' }}>
      <Animated.View style={{
        position: 'absolute', top: H / 4,
        left: a.interpolate({ inputRange: [0, 1], outputRange: [-100, W - 200] }),
        width: 300, height: 300, borderRadius: 150,
        backgroundColor: T.primary, opacity: 0.35,
      }} />
      <Animated.View style={{
        position: 'absolute', top: H / 3,
        left: b.interpolate({ inputRange: [0, 1], outputRange: [W - 200, -100] }),
        width: 280, height: 280, borderRadius: 140,
        backgroundColor: '#C77DFF', opacity: 0.30,
      }} />
    </View>
  );
}

function NeonSplashBg({ T }: { T: Theme }) {
  const scan = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(scan, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: false }));
    loop.start();
    return () => loop.stop();
  }, []);
  const y = scan.interpolate({ inputRange: [0, 1], outputRange: [0, H] });
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: T.bg, overflow: 'hidden' }}>
      {/* Grid */}
      <Svg width="100%" height="100%">
        {Array.from({ length: 25 }, (_, i) => (
          <Rect key={`h${i}`} x={0} y={i * 40} width={W} height={0.5} fill={T.primary} opacity={0.08} />
        ))}
        {Array.from({ length: 25 }, (_, i) => (
          <Rect key={`v${i}`} x={i * 40} y={0} width={0.5} height={H} fill={T.primary} opacity={0.08} />
        ))}
      </Svg>
      {/* Scan line */}
      <Animated.View style={{
        position: 'absolute', left: 0, right: 0, top: y, height: 2,
        backgroundColor: T.primary,
        shadowColor: T.primary, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1, shadowRadius: 12, elevation: 5,
      }} />
    </View>
  );
}

function PaperSplashBg({ T }: { T: Theme }) {
  const unroll = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(unroll, { toValue: 1, duration: 2500, easing: Easing.out(Easing.ease), useNativeDriver: false }),
        Animated.delay(500),
        Animated.timing(unroll, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const width = unroll.interpolate({ inputRange: [0, 1], outputRange: [0, W * 0.8] });
  return (
    <LinearGradient colors={[T.bg, T.lo, T.bg]} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <Svg width="100%" height="100%">
        {Array.from({ length: 60 }, (_, i) => {
          const x = (i * 137) % W;
          const y = (i * 71) % H;
          return <Circle key={i} cx={x} cy={y} r={1} fill={T.muted} opacity={0.08} />;
        })}
      </Svg>
      <Animated.View style={{
        position: 'absolute', top: H / 2 - 80, left: W / 2,
        width: width, height: 160,
        backgroundColor: T.card, borderWidth: 1, borderColor: T.bord,
        borderLeftWidth: 0,
        opacity: 0.6,
      }} />
    </LinearGradient>
  );
}

function QuestSplashBg({ T }: { T: Theme }) {
  const rotate = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const r = Animated.loop(Animated.timing(rotate, { toValue: 1, duration: 8000, easing: Easing.linear, useNativeDriver: false }));
    const g = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 1500, useNativeDriver: false }),
      Animated.timing(glow, { toValue: 0, duration: 1500, useNativeDriver: false }),
    ]));
    r.start(); g.start();
    return () => { r.stop(); g.stop(); };
  }, []);
  const angle = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: T.bg, overflow: 'hidden' }}>
      {/* Звёзды */}
      {Array.from({ length: 30 }, (_, i) => {
        const x = (i * 53) % W;
        const y = (i * 89) % H;
        return <View key={i} style={{ position: 'absolute', left: x, top: y, width: 2, height: 2, borderRadius: 1, backgroundColor: i % 3 === 0 ? T.warn : T.primary, opacity: 0.4 }} />;
      })}
      {/* Вращающийся щит */}
      <Animated.View style={{
        position: 'absolute', top: H / 2 - 120, left: W / 2 - 120,
        width: 240, height: 240, borderRadius: 120,
        borderWidth: 2, borderColor: T.warn,
        opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] }),
        transform: [{ rotate: angle }],
      }} />
      <View style={{
        position: 'absolute', top: H / 2 - 80, left: W / 2 - 80,
        width: 160, height: 160, borderRadius: 80,
        borderWidth: 1, borderColor: T.warn + '66',
      }} />
    </View>
  );
}

function CosmicSplashBg({ T }: { T: Theme }) {
  const orbit = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(orbit, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: false }));
    loop.start();
    return () => loop.stop();
  }, []);
  const angle = orbit.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: T.bg, overflow: 'hidden' }}>
      {/* Туманности */}
      <View style={{ position: 'absolute', top: -100, left: -100, width: 350, height: 350, borderRadius: 175, backgroundColor: T.primary, opacity: 0.07 }} />
      <View style={{ position: 'absolute', bottom: -100, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: '#C77DFF', opacity: 0.06 }} />
      {/* Звёзды */}
      {Array.from({ length: 50 }, (_, i) => {
        const x = (i * 89) % W;
        const y = (i * 53) % H;
        return <View key={i} style={{ position: 'absolute', left: x, top: y, width: 1, height: 1, borderRadius: 0.5, backgroundColor: '#FFFFFF', opacity: 0.6 }} />;
      })}
      {/* Орбиты */}
      <Animated.View style={{
        position: 'absolute', top: H / 2 - 100, left: W / 2 - 100,
        width: 200, height: 200, borderRadius: 100,
        borderWidth: 1, borderColor: T.primary + '33',
        transform: [{ rotate: angle }],
      }}>
        <View style={{ position: 'absolute', top: -6, left: 100 - 6, width: 12, height: 12, borderRadius: 6, backgroundColor: T.primary }} />
      </Animated.View>
      <Animated.View style={{
        position: 'absolute', top: H / 2 - 60, left: W / 2 - 60,
        width: 120, height: 120, borderRadius: 60,
        borderWidth: 1, borderColor: '#C77DFF33',
        transform: [{ rotate: orbit.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] }) }],
      }}>
        <View style={{ position: 'absolute', top: -4, left: 60 - 4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#C77DFF' }} />
      </Animated.View>
    </View>
  );
}

function MonoSplashBg({ T }: { T: Theme }) {
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: T.bg }}>
      {/* Колонки */}
      {[0.25, 0.5, 0.75].map((p, i) => (
        <View key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: W * p, width: 1, backgroundColor: T.txt, opacity: 0.05 }} />
      ))}
      <View style={{ position: 'absolute', top: 80, left: 16, right: 16, height: 2, backgroundColor: T.txt, opacity: 0.15 }} />
      <View style={{ position: 'absolute', top: 84, left: 16, right: 16, height: 1, backgroundColor: T.txt, opacity: 0.10 }} />
      {/* Бумажная текстура */}
      <Svg width="100%" height="100%">
        {Array.from({ length: 60 }, (_, i) => {
          const x = (i * 113) % W;
          const y = (i * 67) % H;
          return <Circle key={i} cx={x} cy={y} r={0.6} fill={T.txt} opacity={0.04} />;
        })}
      </Svg>
    </View>
  );
}

function SynthwaveSplashBg({ T }: { T: Theme }) {
  const grid = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(grid, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: false }));
    loop.start();
    return () => loop.stop();
  }, []);
  const offset = grid.interpolate({ inputRange: [0, 1], outputRange: [0, 40] });
  const horizon = H * 0.5;
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: T.bg, overflow: 'hidden' }}>
      {/* Закат */}
      <LinearGradient
        colors={['#1A0033', '#3D0066', '#FF006E', '#FFB400']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: horizon }}
      />
      {/* Солнце */}
      <View style={{
        position: 'absolute', top: horizon - 80, left: W / 2 - 80,
        width: 160, height: 160, borderRadius: 80,
        backgroundColor: '#FF006E', opacity: 0.85,
      }} />
      {[0, 1, 2, 3, 4].map(i => (
        <View key={i} style={{
          position: 'absolute', top: horizon - 70 + i * 20, left: W / 2 - 80,
          width: 160, height: 3, backgroundColor: T.bg, opacity: 0.6,
        }} />
      ))}
      {/* Сетка */}
      <View style={{ position: 'absolute', top: horizon, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
        <Animated.View style={{ position: 'absolute', top: -40, left: 0, right: 0, bottom: -40, transform: [{ translateY: offset }] }}>
          <Svg width="100%" height="100%">
            {Array.from({ length: 20 }, (_, i) => (
              <Rect key={`h${i}`} x={0} y={i * 30} width={W} height={1} fill="#FF00FF" opacity={0.3} />
            ))}
          </Svg>
        </Animated.View>
      </View>
    </View>
  );
}

// ── Mode-specific logos ─────────────────────────────────────────────────────

function ModeLogo({ T, mode }: { T: Theme; mode: UIModeId }) {
  const size = 80;
  const Logo = () => {
    switch (mode) {
      case 'focus':
        return <FocusLogo T={T} size={size} />;
      case 'aurora':
        return <AuroraLogo T={T} size={size} />;
      case 'neon':
        return <NeonLogo T={T} size={size} />;
      case 'paper':
        return <PaperLogo T={T} size={size} />;
      case 'quest':
        return <QuestLogo T={T} size={size} />;
      case 'cosmic':
        return <CosmicLogo T={T} size={size} />;
      case 'mono':
        return <MonoLogo T={T} size={size} />;
      case 'synthwave':
        return <SynthwaveLogo T={T} size={size} />;
      default:
        return <FocusLogo T={T} size={size} />;
    }
  };
  return <Logo />;
}

function FocusLogo({ T, size }: { T: Theme; size: number }) {
  const rotate = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(rotate, { toValue: 1, duration: 12000, easing: Easing.linear, useNativeDriver: false }));
    loop.start();
    return () => loop.stop();
  }, []);
  const angle = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{
        width: size, height: size, borderRadius: size / 2,
        borderWidth: 2, borderColor: T.primary + '33',
        transform: [{ rotate: angle }],
      }} />
      <View style={{
        position: 'absolute', width: size * 0.6, height: size * 0.6, borderRadius: (size * 0.6) / 2,
        backgroundColor: T.primary, opacity: 0.15,
      }} />
      <View style={{
        position: 'absolute', width: 12, height: 12, borderRadius: 6,
        backgroundColor: T.primary,
      }} />
    </View>
  );
}

function AuroraLogo({ T, size }: { T: Theme; size: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="auroraLogo">
            <Stop offset="0" stopColor={T.primary} stopOpacity="0.9" />
            <Stop offset="0.5" stopColor="#C77DFF" stopOpacity="0.7" />
            <Stop offset="1" stopColor={T.primary} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#auroraLogo)" />
        <Circle cx={size / 2} cy={size / 2} r={size * 0.3} fill={T.primary} opacity="0.6" />
        <Circle cx={size / 2} cy={size / 2} r={size * 0.15} fill="#FFFFFF" opacity="0.9" />
      </Svg>
    </View>
  );
}

function NeonLogo({ T, size }: { T: Theme; size: number }) {
  const blink = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(blink, { toValue: 0.3, duration: 600, useNativeDriver: false }),
      Animated.timing(blink, { toValue: 1, duration: 600, useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View style={{
      width: size, height: size, borderRadius: 8,
      borderWidth: 2, borderColor: T.primary,
      alignItems: 'center', justifyContent: 'center',
      opacity: blink,
      shadowColor: T.primary, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8, shadowRadius: 12, elevation: 5,
    }}>
      <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 32, color: T.primary, letterSpacing: 2 }}>H</Text>
    </Animated.View>
  );
}

function PaperLogo({ T, size }: { T: Theme; size: number }) {
  return (
    <View style={{
      width: size, height: size, borderRadius: 12,
      backgroundColor: T.card, borderWidth: 1, borderColor: T.bord,
      alignItems: 'center', justifyContent: 'center',
      transform: [{ rotate: '-3deg' }],
      shadowColor: '#000', shadowOffset: { width: 2, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
    }}>
      <Text style={{ fontSize: 36 }}>📜</Text>
    </View>
  );
}

function QuestLogo({ T, size }: { T: Theme; size: number }) {
  return (
    <View style={{
      width: size, height: size, borderRadius: 8,
      borderWidth: 2, borderColor: T.warn,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: T.warn + '15',
      shadowColor: T.warn, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 4,
    }}>
      <Text style={{ fontSize: 40 }}>⚔️</Text>
    </View>
  );
}

function CosmicLogo({ T, size }: { T: Theme; size: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="cosmicLogo">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
            <Stop offset="0.3" stopColor={T.primary} stopOpacity="0.9" />
            <Stop offset="1" stopColor={T.primary} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#cosmicLogo)" />
        <Circle cx={size / 2} cy={size / 2} r={size * 0.2} fill="#FFFFFF" />
      </Svg>
    </View>
  );
}

function MonoLogo({ T, size }: { T: Theme; size: number }) {
  return (
    <View style={{
      width: size, height: size, borderRadius: 2,
      borderWidth: 2, borderColor: T.txt,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 36, color: T.txt, letterSpacing: 0 }}>Г</Text>
    </View>
  );
}

function SynthwaveLogo({ T, size }: { T: Theme; size: number }) {
  return (
    <View style={{
      width: size, height: size, borderRadius: 6,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: '#FF00FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 14, elevation: 5,
    }}>
      <LinearGradient
        colors={['#FF00FF', '#00FFFF']}
        style={{ width: size, height: size, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 36, color: '#000', letterSpacing: 2 }}>H</Text>
      </LinearGradient>
    </View>
  );
}
