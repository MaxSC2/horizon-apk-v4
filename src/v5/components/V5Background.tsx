// src/v5/components/V5Background.tsx — HORIZON V5
//
// 4 радикально разных фона. Каждый — не просто картинка, а живая среда
// со своими частицами, анимациями, поведением.
//
// Solo Leveling: магические частицы маны + аура-портал
// Dev Command: terminal scanlines + scrolling code rain
// Glass Future: плавающие gradient orbs с parallax
// Cyberpunk Nexus: glitch grid + neon scanlines + data streams
import React, { useEffect, useRef, useMemo } from 'react';
import { View, Animated, Easing, Dimensions, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Rect, Text as SvgText, Defs, RadialGradient, Stop } from 'react-native-svg';
import { V5Theme } from '../themes';

const { width: W, height: H } = Dimensions.get('window');

interface Props {
  theme: V5Theme;
}

export function V5Background({ theme }: Props) {
  switch (theme.id) {
    case 'solo':  return <SoloBackground theme={theme} />;
    case 'dev':   return <DevBackground theme={theme} />;
    case 'glass': return <GlassBackground theme={theme} />;
    case 'cyber': return <CyberBackground theme={theme} />;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SOLO LEVELING BACKGROUND
// Глубокий космос + магические частицы маны + аура-портал сверху
// ═══════════════════════════════════════════════════════════════════════════
function SoloBackground({ theme }: { theme: V5Theme }) {
  const auraPulse = useRef(new Animated.Value(0)).current;
  const particles = useMemo(() => Array.from({ length: theme.motion.particleCount }, (_, i) => ({
    id: i,
    x: Math.random() * W,
    y: Math.random() * H,
    size: 1 + Math.random() * 3,
    duration: 4000 + Math.random() * 6000,
    delay: Math.random() * 5000,
    drift: (Math.random() - 0.5) * 100,
  })), [theme.motion.particleCount]);
  const particleAnims = useRef(particles.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Аура пульсирует
    const auraLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(auraPulse, { toValue: 1, duration: theme.motion.glowPulseDuration, easing: theme.motion.easeInOut, useNativeDriver: false }),
        Animated.timing(auraPulse, { toValue: 0, duration: theme.motion.glowPulseDuration, easing: theme.motion.easeInOut, useNativeDriver: false }),
      ])
    );
    auraLoop.start();

    // Частицы поднимаются снизу вверх
    const particleLoops = particles.map((p, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(p.delay),
          Animated.timing(particleAnims[i], { toValue: 1, duration: p.duration, easing: theme.motion.easeOut, useNativeDriver: false }),
          Animated.timing(particleAnims[i], { toValue: 0, duration: 0, useNativeDriver: false }),
        ])
      )
    );
    particleLoops.forEach(l => l.start());

    return () => { auraLoop.stop(); particleLoops.forEach(l => l.stop()); };
  }, []);

  return (
    <View style={[styles.absolute, { backgroundColor: theme.colors.void }]}>
      {/* Базовый градиент */}
      <LinearGradient
        colors={[theme.colors.void, theme.colors.surface, theme.colors.void]}
        style={styles.absolute}
      />

      {/* Аура-портал сверху */}
      <Animated.View style={{
        position: 'absolute',
        top: -200, left: W / 2 - 200,
        width: 400, height: 400, borderRadius: 200,
        backgroundColor: theme.colors.glow,
        opacity: auraPulse.interpolate({ inputRange: [0, 1], outputRange: theme.motion.glowPulseOpacity }),
        transform: [{ scale: auraPulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.1] }) }],
      }} />

      {/* Магические частицы */}
      {particles.map((p, i) => (
        <Animated.View
          key={p.id}
          style={{
            position: 'absolute',
            left: p.x,
            top: particleAnims[i].interpolate({ inputRange: [0, 1], outputRange: [H + 20, -20] }),
            width: p.size, height: p.size, borderRadius: p.size / 2,
            backgroundColor: theme.colors.glow,
            opacity: particleAnims[i].interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 1, 1, 0] }),
            shadowColor: theme.colors.glow,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8, shadowRadius: 4, elevation: 2,
            transform: [{ translateX: particleAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] }) }],
          }}
        />
      ))}

      {/* Тонкая сетка для system-window ощущения */}
      <Svg width="100%" height="100%" style={styles.absolute}>
        {Array.from({ length: 20 }, (_, i) => (
          <Rect key={`h${i}`} x={0} y={i * (H / 20)} width={W} height={0.5} fill={theme.colors.glow} opacity={0.04} />
        ))}
        {Array.from({ length: 15 }, (_, i) => (
          <Rect key={`v${i}`} x={i * (W / 15)} y={0} width={0.5} height={H} fill={theme.colors.glow} opacity={0.04} />
        ))}
      </Svg>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DEV COMMAND BACKGROUND
// Чисто чёрный + code rain (Matrix-style, но monochrome green)
// ═══════════════════════════════════════════════════════════════════════════
function DevBackground({ theme }: { theme: V5Theme }) {
  const codeLines = useMemo(() => {
    const snippets = ['init()', 'load()', 'await', 'fetch()', 'parse()', 'exec()', 'sync()', 'done', '0x4F2A', 'null', 'true', '200 OK', '→', '{ }', '< >'];
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: (i / 18) * W + Math.random() * 20,
      text: snippets[Math.floor(Math.random() * snippets.length)],
      duration: 8000 + Math.random() * 6000,
      delay: Math.random() * 8000,
    }));
  }, []);
  const lineAnims = useRef(codeLines.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const loops = codeLines.map((l, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(l.delay),
          Animated.timing(lineAnims[i], { toValue: 1, duration: l.duration, easing: theme.motion.easeInOut, useNativeDriver: false }),
          Animated.timing(lineAnims[i], { toValue: 0, duration: 0, useNativeDriver: false }),
        ])
      )
    );
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, []);

  return (
    <View style={[styles.absolute, { backgroundColor: theme.colors.void }]}>
      {/* Code rain — animated via translateY on View wrappers */}
      {codeLines.map((l, i) => (
        <Animated.Text
          key={l.id}
          style={{
            position: 'absolute',
            left: l.x,
            top: lineAnims[i].interpolate({ inputRange: [0, 1], outputRange: [-20, H + 20] }),
            fontFamily: theme.typography.mono,
            fontSize: 11,
            color: theme.colors.glow,
            opacity: 0.25,
          }}
        >
          {l.text}
        </Animated.Text>
      ))}

      {/* Тонкая сетка */}
      <View style={[styles.absolute, {
        backgroundColor: theme.colors.glow,
        opacity: 0.02,
      }]} />

      {/* Vignette */}
      <LinearGradient
        colors={['transparent', theme.colors.void]}
        style={styles.absolute}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GLASS FUTURE BACKGROUND
// Плавающие gradient orbs с parallax-подобным дрейфом
// ═══════════════════════════════════════════════════════════════════════════
function GlassBackground({ theme }: { theme: V5Theme }) {
  const orbs = useMemo(() => [
    { startX: -100, startY: 100, color: theme.colors.glow, size: 320, duration: 18000 },
    { startX: W - 200, startY: H / 3, color: theme.colors.success, size: 280, duration: 24000 },
    { startX: W / 3, startY: H - 300, color: theme.colors.info, size: 260, duration: 30000 },
  ], [theme]);
  const orbAnims = useRef(orbs.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const loops = orbs.map((_, i) =>
      Animated.loop(
        Animated.timing(orbAnims[i], { toValue: 1, duration: orbs[i].duration, easing: theme.motion.easeInOut, useNativeDriver: false })
      )
    );
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, []);

  return (
    <View style={[styles.absolute, { backgroundColor: theme.colors.void }]}>
      <LinearGradient
        colors={[theme.colors.void, theme.colors.surface, theme.colors.void]}
        style={styles.absolute}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Floating orbs */}
      {orbs.map((orb, i) => {
        const dx = orbAnims[i].interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 80, 0] });
        const dy = orbAnims[i].interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -40, 0] });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: orb.startX,
              top: orb.startY,
              width: orb.size, height: orb.size, borderRadius: orb.size / 2,
              backgroundColor: orb.color,
              opacity: 0.18,
              transform: [{ translateX: dx }, { translateY: dy }],
            }}
          />
        );
      })}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CYBERPUNK NEXUS BACKGROUND
// Glitch grid + neon scanlines + data streams
// ═══════════════════════════════════════════════════════════════════════════
function CyberBackground({ theme }: { theme: V5Theme }) {
  const scan = useRef(new Animated.Value(0)).current;
  const glitch = useRef(new Animated.Value(0)).current;
  const grid = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const scanLoop = Animated.loop(
      Animated.timing(scan, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: false })
    );
    const glitchLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glitch, { toValue: 1, duration: 80, useNativeDriver: false }),
        Animated.timing(glitch, { toValue: 0, duration: 80, useNativeDriver: false }),
        Animated.delay(2000 + Math.random() * 3000),
      ])
    );
    const gridLoop = Animated.loop(
      Animated.timing(grid, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: false })
    );
    scanLoop.start(); glitchLoop.start(); gridLoop.start();
    return () => { scanLoop.stop(); glitchLoop.stop(); gridLoop.stop(); };
  }, []);

  const scanY = scan.interpolate({ inputRange: [0, 1], outputRange: [0, H] });
  const gridOffset = grid.interpolate({ inputRange: [0, 1], outputRange: [0, 40] });
  const glitchOffset = glitch.interpolate({ inputRange: [0, 1], outputRange: [0, 8] });

  return (
    <View style={[styles.absolute, { backgroundColor: theme.colors.void }]}>
      {/* Perspective grid bottom half */}
      <Animated.View style={{
        position: 'absolute', top: H / 2, left: 0, right: 0, bottom: 0,
        transform: [{ translateY: gridOffset }],
      }}>
        <Svg width="100%" height="100%">
          {Array.from({ length: 15 }, (_, i) => (
            <Rect key={`h${i}`} x={0} y={i * 30} width={W} height={1} fill={theme.colors.glow} opacity={0.15} />
          ))}
          {Array.from({ length: 20 }, (_, i) => {
            const x = (i / 19) * W;
            const cx = W / 2;
            return <Rect key={`v${i}`} x={x + (cx - x) * 0.6} y={0} width={1} height={H / 2} fill={theme.colors.success} opacity={0.2} />;
          })}
        </Svg>
      </Animated.View>

      {/* Scanlines overlay */}
      <View style={[styles.absolute, { opacity: 0.06 }]}>
        {Array.from({ length: H / 3 }, (_, i) => (
          <View key={i} style={{ position: 'absolute', top: i * 3, left: 0, right: 0, height: 1, backgroundColor: theme.colors.glow }} />
        ))}
      </View>

      {/* Moving scan line */}
      <Animated.View style={{
        position: 'absolute', left: 0, right: 0, top: scanY, height: 2,
        backgroundColor: theme.colors.glow,
        shadowColor: theme.colors.glow, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1, shadowRadius: 10, elevation: 5,
        transform: [{ translateX: glitchOffset }],
      }} />

      {/* Top magenta glow */}
      <LinearGradient
        colors={[theme.colors.glowSoft, 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  absolute: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
});
