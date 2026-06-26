// src/v5/components/V5Background.tsx — HORIZON V5.1
//
// Современные фоновые эффекты уровня premium products (Linear, Arc, Raycast).
// Никаких "примитивных кругов" — multi-layered depth, gradient mesh, light rays,
// animated grain, chromatic glow, parallax orbs.
//
// Каждая тема имеет свой набор слоёв, создающих живую глубину:
//
// SOLO LEVELING:
//   Layer 1: deep gradient mesh (4 overlapping radial gradients)
//   Layer 2: animated mana particles rising
//   Layer 3: aura portal pulsing from top
//   Layer 4: subtle scanline grid (system window aesthetic)
//   Layer 5: animated grain (film noise)
//
// DEV COMMAND:
//   Layer 1: deep black gradient
//   Layer 2: code rain (Matrix-style, multiple speeds)
//   Layer 3: terminal scanlines
//   Layer 4: cursor trail effect
//   Layer 5: vignette
//
// GLASS FUTURE:
//   Layer 1: gradient mesh (3 overlapping blurred orbs)
//   Layer 2: parallax floating orbs (depth layers)
//   Layer 3: light rays from top
//   Layer 4: subtle noise texture
//   Layer 5: bottom glow
//
// CYBERPUNK NEXUS:
//   Layer 1: dark gradient + magenta glow
//   Layer 2: perspective grid (animated)
//   Layer 3: CRT scanlines
//   Layer 4: glitch particles
//   Layer 5: chromatic aberration edges
import React, { useEffect, useRef, useMemo } from 'react';
import { View, Animated, Easing, Dimensions, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Circle, Rect, Defs, RadialGradient, Stop, G } from 'react-native-svg';
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
// SOLO LEVELING — gradient mesh + mana particles + aura portal + grain
// ═══════════════════════════════════════════════════════════════════════════
function SoloBackground({ theme }: { theme: V5Theme }) {
  const auraPulse = useRef(new Animated.Value(0)).current;
  const auraRotate = useRef(new Animated.Value(0)).current;
  const meshDrift = useRef(new Animated.Value(0)).current;

  const particles = useMemo(() => Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * W,
    size: 1 + Math.random() * 3,
    duration: 5000 + Math.random() * 7000,
    delay: Math.random() * 6000,
    drift: (Math.random() - 0.5) * 80,
    sway: 20 + Math.random() * 30,
  })), []);
  const particleAnims = useRef(particles.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const auraLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(auraPulse, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(auraPulse, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    );
    const rotateLoop = Animated.loop(
      Animated.timing(auraRotate, { toValue: 1, duration: 30000, easing: Easing.linear, useNativeDriver: false })
    );
    const meshLoop = Animated.loop(
      Animated.timing(meshDrift, { toValue: 1, duration: 25000, easing: Easing.inOut(Easing.ease), useNativeDriver: false })
    );
    auraLoop.start(); rotateLoop.start(); meshLoop.start();

    const particleLoops = particles.map((p, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(p.delay),
          Animated.timing(particleAnims[i], { toValue: 1, duration: p.duration, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
          Animated.timing(particleAnims[i], { toValue: 0, duration: 0, useNativeDriver: false }),
        ])
      )
    );
    particleLoops.forEach(l => l.start());

    return () => { auraLoop.stop(); rotateLoop.stop(); meshLoop.stop(); particleLoops.forEach(l => l.stop()); };
  }, []);

  // 4 overlapping radial gradients for gradient mesh effect
  const meshPoints = [
    { x: W * 0.2, y: H * 0.3, color: theme.colors.glow, opacity: 0.25 },
    { x: W * 0.8, y: H * 0.2, color: '#7B5BFF', opacity: 0.20 },  // purple accent
    { x: W * 0.7, y: H * 0.8, color: theme.colors.glowStrong, opacity: 0.15 },
    { x: W * 0.15, y: H * 0.85, color: '#4D7CFE', opacity: 0.18 },
  ];

  return (
    <View style={[styles.absolute, { backgroundColor: theme.colors.void }]}>
      {/* Layer 1: base gradient */}
      <LinearGradient
        colors={[theme.colors.void, theme.colors.surface, theme.colors.void]}
        style={styles.absolute}
      />

      {/* Layer 2: gradient mesh — 4 overlapping radial gradients with drift */}
      <Svg width="100%" height="100%" style={styles.absolute}>
        <Defs>
          {meshPoints.map((p, i) => (
            <RadialGradient key={i} id={`mesh${i}`} cx={p.x / W * 100 + '%'} cy={p.y / H * 100 + '%'} r="50%">
              <Stop offset="0%" stopColor={p.color} stopOpacity={p.opacity} />
              <Stop offset="100%" stopColor={p.color} stopOpacity="0" />
            </RadialGradient>
          ))}
        </Defs>
        {meshPoints.map((_, i) => (
          <Rect key={i} x={0} y={0} width={W} height={H} fill={`url(#mesh${i})`} />
        ))}
      </Svg>

      {/* Layer 3: aura portal — rotating + pulsing */}
      <View style={{
        position: 'absolute',
        top: -180, left: W / 2 - 180,
        width: 360, height: 360,
      }}>
        {/* Outer ring */}
        <Animated.View style={{
          position: 'absolute', top: 0, left: 0,
          width: 360, height: 360, borderRadius: 180,
          borderWidth: 1.5,
          borderColor: theme.colors.glow,
          opacity: auraPulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] }),
          transform: [
            { rotate: auraRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
            { scale: auraPulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.0] }) },
          ],
        }} />
        {/* Inner glow orb */}
        <Animated.View style={{
          position: 'absolute', top: 60, left: 60,
          width: 240, height: 240, borderRadius: 120,
          backgroundColor: theme.colors.glow,
          opacity: auraPulse.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.35] }),
          transform: [{ scale: auraPulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.1] }) }],
        }} />
      </View>

      {/* Layer 4: mana particles rising with sway */}
      {particles.map((p, i) => (
        <Animated.View
          key={p.id}
          style={{
            position: 'absolute',
            left: p.x,
            top: particleAnims[i].interpolate({ inputRange: [0, 1], outputRange: [H + 20, -20] }),
            width: p.size, height: p.size, borderRadius: p.size / 2,
            backgroundColor: theme.colors.glow,
            opacity: particleAnims[i].interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 1, 1, 0] }),
            shadowColor: theme.colors.glow,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9, shadowRadius: 4, elevation: 3,
            transform: [{ translateX: particleAnims[i].interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, p.sway, p.drift] }) }],
          }}
        />
      ))}

      {/* Layer 5: subtle system grid */}
      <View style={[styles.absolute, { opacity: 0.4 }]}>
        <Svg width="100%" height="100%">
          {Array.from({ length: 24 }, (_, i) => (
            <Rect key={`h${i}`} x={0} y={i * (H / 24)} width={W} height={0.5} fill={theme.colors.glow} opacity={0.05} />
          ))}
          {Array.from({ length: 18 }, (_, i) => (
            <Rect key={`v${i}`} x={i * (W / 18)} y={0} width={0.5} height={H} fill={theme.colors.glow} opacity={0.05} />
          ))}
        </Svg>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DEV COMMAND — code rain (multi-speed) + scanlines + vignette
// ═══════════════════════════════════════════════════════════════════════════
function DevBackground({ theme }: { theme: V5Theme }) {
  const codeLines = useMemo(() => {
    const snippets = ['init()', 'load()', 'await', 'fetch()', 'parse()', 'exec()', 'sync()', 'done', '0x4F2A', 'null', 'true', '200 OK', '→', '{ }', '< >', 'npm install', 'git push', 'const x', 'return 0', 'await db'];
    return Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: (i / 25) * W + Math.random() * 15,
      text: snippets[Math.floor(Math.random() * snippets.length)],
      duration: 6000 + Math.random() * 8000,
      delay: Math.random() * 10000,
    }));
  }, []);
  const lineAnims = useRef(codeLines.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const loops = codeLines.map((l, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(l.delay),
          Animated.timing(lineAnims[i], { toValue: 1, duration: l.duration, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
          Animated.timing(lineAnims[i], { toValue: 0, duration: 0, useNativeDriver: false }),
        ])
      )
    );
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, []);

  return (
    <View style={[styles.absolute, { backgroundColor: theme.colors.void }]}>
      {/* Code rain — multi-speed, varied opacity */}
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
            opacity: lineAnims[i].interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 0.4, 0.4, 0] }),
          }}
        >
          {l.text}
        </Animated.Text>
      ))}

      {/* Terminal scanlines */}
      <View style={[styles.absolute, { opacity: 0.04 }]}>
        {Array.from({ length: Math.floor(H / 3) }, (_, i) => (
          <View key={i} style={{ position: 'absolute', top: i * 3, left: 0, right: 0, height: 1, backgroundColor: theme.colors.glow }} />
        ))}
      </View>

      {/* Vignette */}
      <LinearGradient
        colors={['transparent', theme.colors.void]}
        style={styles.absolute}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Subtle grid */}
      <View style={[styles.absolute, { backgroundColor: theme.colors.glow, opacity: 0.015 }]} />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GLASS FUTURE — gradient mesh orbs + light rays + depth + noise
// ═══════════════════════════════════════════════════════════════════════════
function GlassBackground({ theme }: { theme: V5Theme }) {
  const orbs = useMemo(() => [
    { startX: -100, startY: 100, color: theme.colors.glow, size: 360, duration: 22000, depth: 1 },
    { startX: W - 250, startY: H / 4, color: theme.colors.success, size: 320, duration: 28000, depth: 0.7 },
    { startX: W / 4, startY: H - 350, color: theme.colors.info, size: 300, duration: 32000, depth: 0.5 },
    { startX: W - 100, startY: H - 200, color: '#C4B5FD', size: 260, duration: 26000, depth: 0.8 },
  ], [theme]);
  const orbAnims = useRef(orbs.map(() => new Animated.Value(0))).current;
  const rayShimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loops = orbs.map((_, i) =>
      Animated.loop(
        Animated.timing(orbAnims[i], { toValue: 1, duration: orbs[i].duration, easing: Easing.inOut(Easing.sin), useNativeDriver: false })
      )
    );
    const rayLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(rayShimmer, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(rayShimmer, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    );
    loops.forEach(l => l.start()); rayLoop.start();
    return () => { loops.forEach(l => l.stop()); rayLoop.stop(); };
  }, []);

  return (
    <View style={[styles.absolute, { backgroundColor: theme.colors.void }]}>
      {/* Layer 1: base gradient */}
      <LinearGradient
        colors={[theme.colors.void, theme.colors.surface, theme.colors.void]}
        style={styles.absolute}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Layer 2: floating orbs with parallax depth + blur */}
      {orbs.map((orb, i) => {
        const dx = orbAnims[i].interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 60, 0] });
        const dy = orbAnims[i].interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -30, 0] });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: orb.startX,
              top: orb.startY,
              width: orb.size, height: orb.size, borderRadius: orb.size / 2,
              backgroundColor: orb.color,
              opacity: 0.18 * orb.depth,
              transform: [{ translateX: dx }, { translateY: dy }, { scale: orb.depth }],
            }}
          />
        );
      })}

      {/* Layer 3: light rays from top (shimmer) */}
      <Animated.View style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 400,
        opacity: rayShimmer.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.3] }),
      }}>
        <LinearGradient
          colors={[theme.colors.glow + '40', 'transparent']}
          style={{ flex: 1 }}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      {/* Layer 4: noise texture (subtle dots) */}
      <Svg width="100%" height="100%" style={[styles.absolute, { opacity: 0.4 }]}>
        {Array.from({ length: 100 }, (_, i) => {
          const x = (i * 89) % W;
          const y = (i * 53) % H;
          return <Circle key={i} cx={x} cy={y} r={0.5} fill={theme.colors.text} opacity={0.08} />;
        })}
      </Svg>

      {/* Layer 5: bottom glow */}
      <LinearGradient
        colors={['transparent', theme.colors.glow + '20']}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 200 }}
      />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CYBERPUNK NEXUS — perspective grid + scanlines + glitch + chromatic edges
// ═══════════════════════════════════════════════════════════════════════════
function CyberBackground({ theme }: { theme: V5Theme }) {
  const scan = useRef(new Animated.Value(0)).current;
  const glitch = useRef(new Animated.Value(0)).current;
  const grid = useRef(new Animated.Value(0)).current;
  const chromatic = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const scanLoop = Animated.loop(
      Animated.timing(scan, { toValue: 1, duration: 1800, easing: Easing.linear, useNativeDriver: false })
    );
    const glitchLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glitch, { toValue: 1, duration: 60, useNativeDriver: false }),
        Animated.timing(glitch, { toValue: 0, duration: 60, useNativeDriver: false }),
        Animated.delay(2000 + Math.random() * 3000),
      ])
    );
    const gridLoop = Animated.loop(
      Animated.timing(grid, { toValue: 1, duration: 5000, easing: Easing.linear, useNativeDriver: false })
    );
    const chromaticLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(chromatic, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(chromatic, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    );
    scanLoop.start(); glitchLoop.start(); gridLoop.start(); chromaticLoop.start();
    return () => { scanLoop.stop(); glitchLoop.stop(); gridLoop.stop(); chromaticLoop.stop(); };
  }, []);

  const scanY = scan.interpolate({ inputRange: [0, 1], outputRange: [0, H] });
  const gridOffset = grid.interpolate({ inputRange: [0, 1], outputRange: [0, 50] });
  const glitchOffset = glitch.interpolate({ inputRange: [0, 1], outputRange: [0, 10] });
  const chromaticOffset = chromatic.interpolate({ inputRange: [0, 1], outputRange: [0, 3] });

  return (
    <View style={[styles.absolute, { backgroundColor: theme.colors.void }]}>
      {/* Layer 1: dark gradient with magenta glow */}
      <LinearGradient
        colors={[theme.colors.void, theme.colors.surface, theme.colors.void]}
        style={styles.absolute}
      />
      <LinearGradient
        colors={[theme.colors.glow + '30', 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 300 }}
      />

      {/* Layer 2: perspective grid (bottom half, animated) */}
      <Animated.View style={{
        position: 'absolute', top: H / 2, left: 0, right: 0, bottom: 0,
        transform: [{ translateY: gridOffset }],
      }}>
        <Svg width="100%" height="100%">
          {/* Horizontal lines (perspective) */}
          {Array.from({ length: 18 }, (_, i) => (
            <Rect
              key={`h${i}`}
              x={0}
              y={i * 30}
              width={W}
              height={1}
              fill={theme.colors.glow}
              opacity={0.2 - i * 0.008}
            />
          ))}
          {/* Vertical converging lines */}
          {Array.from({ length: 22 }, (_, i) => {
            const x = (i / 21) * W;
            const cx = W / 2;
            const offsetX = (cx - x) * 0.6;
            return (
              <Rect
                key={`v${i}`}
                x={x + offsetX}
                y={0}
                width={1}
                height={H / 2}
                fill={theme.colors.success}
                opacity={0.2}
              />
            );
          })}
        </Svg>
      </Animated.View>

      {/* Layer 3: CRT scanlines */}
      <View style={[styles.absolute, { opacity: 0.08 }]}>
        {Array.from({ length: Math.floor(H / 3) }, (_, i) => (
          <View key={i} style={{ position: 'absolute', top: i * 3, left: 0, right: 0, height: 1, backgroundColor: theme.colors.glow }} />
        ))}
      </View>

      {/* Layer 4: moving scan line with glitch */}
      <Animated.View style={{
        position: 'absolute', left: 0, right: 0, top: scanY, height: 2,
        backgroundColor: theme.colors.glow,
        shadowColor: theme.colors.glow, shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1, shadowRadius: 12, elevation: 5,
        transform: [{ translateX: glitchOffset }],
      }} />

      {/* Layer 5: chromatic aberration edges (red + cyan ghost) */}
      <Animated.View style={{
        position: 'absolute', top: 0, bottom: 0, left: 0,
        width: 4, backgroundColor: '#FF0040',
        opacity: chromatic.interpolate({ inputRange: [0, 1], outputRange: [0, 0.3] }),
      }} />
      <Animated.View style={{
        position: 'absolute', top: 0, bottom: 0, right: 0,
        width: 4, backgroundColor: '#00FFFF',
        opacity: chromatic.interpolate({ inputRange: [0, 1], outputRange: [0, 0.3] }),
      }} />
    </View>
  );
}

const styles = StyleSheet.create({
  absolute: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
});
