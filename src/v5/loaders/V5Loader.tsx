// src/v5/loaders/V5Loader.tsx — HORIZON V5
//
// 4 кастомных загрузчика. Никаких spinners.
// Solo: hologram construction (Animated.View + scale)
// Dev: terminal boot (typing lines)
// Glass: particle assembly (Animated.View positions)
// Cyber: scan boot (moving scan line + glitch text)
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing, Dimensions, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { V5Theme } from '../themes';

const { width: W, height: H } = Dimensions.get('window');

interface LoaderProps {
  theme: V5Theme;
  label?: string;
}

export function V5Loader({ theme, label = 'Initializing' }: LoaderProps) {
  switch (theme.id) {
    case 'solo':  return <SoloLoader theme={theme} label={label} />;
    case 'dev':   return <DevLoader theme={theme} label={label} />;
    case 'glass': return <GlassLoader theme={theme} label={label} />;
    case 'cyber': return <CyberLoader theme={theme} label={label} />;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SOLO — Hologram Construction
// ═══════════════════════════════════════════════════════════════════════════
function SoloLoader({ theme, label }: LoaderProps) {
  const construct = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const [systemMsg, setSystemMsg] = useState('');

  useEffect(() => {
    const cLoop = Animated.timing(construct, { toValue: 1, duration: 1800, easing: theme.motion.easeOut, useNativeDriver: false });
    const gLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1200, easing: theme.motion.easeInOut, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0.4, duration: 1200, easing: theme.motion.easeInOut, useNativeDriver: false }),
      ])
    );
    cLoop.start(); gLoop.start();

    const msg = `[ SYSTEM ] ${label.toUpperCase()}...`;
    let i = 0;
    const interval = setInterval(() => {
      if (i <= msg.length) {
        setSystemMsg(msg.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 50);

    return () => { cLoop.stop(); gLoop.stop(); clearInterval(interval); };
  }, []);

  const size = 120;
  const opacity = construct.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.5, 1] });
  const scale = construct.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });

  return (
    <View style={[styles.center, { backgroundColor: theme.colors.void }]}>
      <Animated.View style={{
        width: size, height: size,
        opacity,
        transform: [{ scale }],
        alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Outer glow */}
        <Animated.View style={{
          position: 'absolute',
          width: size, height: size, borderRadius: size / 2,
          backgroundColor: theme.colors.glow,
          opacity: glow,
        }} />
        {/* Hex frame */}
        <View style={{
          width: size - 8, height: size - 8,
          borderWidth: 2, borderColor: theme.colors.glow,
          backgroundColor: 'transparent',
        }} />
        {/* Inner circle */}
        <View style={{
          position: 'absolute', width: 40, height: 40, borderRadius: 20,
          borderWidth: 1.5, borderColor: theme.colors.glowStrong,
        }} />
        <Animated.View style={{
          position: 'absolute', width: 12, height: 12, borderRadius: 6,
          backgroundColor: theme.colors.glowStrong,
          opacity: glow,
        }} />
      </Animated.View>

      <Text style={{
        marginTop: 24,
        fontFamily: theme.typography.mono,
        fontSize: 13,
        color: theme.colors.glow,
        letterSpacing: 2,
        textTransform: 'uppercase',
      }}>
        {systemMsg}
        <Animated.Text style={{ opacity: glow, color: theme.colors.glow }}>▎</Animated.Text>
      </Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DEV — Terminal Boot Sequence
// ═══════════════════════════════════════════════════════════════════════════
function DevLoader({ theme, label }: LoaderProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState('');
  const cursorBlink = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const bootSeq = [
      '$ horizon --init',
      '> Loading core modules...',
      '> Checking AI providers... [OK]',
      '> Mounting storage... [OK]',
      '> Initializing themes... [OK]',
      '> Establishing neural link... [OK]',
      '> ' + label + '...',
    ];

    let lineIdx = 0;
    let charIdx = 0;
    let current = '';

    const interval = setInterval(() => {
      if (lineIdx >= bootSeq.length) {
        clearInterval(interval);
        return;
      }
      const target = bootSeq[lineIdx];
      if (charIdx < target.length) {
        current += target[charIdx];
        setCurrentLine(current);
        charIdx++;
      } else {
        setLines(prev => [...prev, current]);
        current = '';
        setCurrentLine('');
        lineIdx++;
        charIdx = 0;
      }
    }, 30);

    const cursorLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorBlink, { toValue: 0, duration: 400, useNativeDriver: false }),
        Animated.timing(cursorBlink, { toValue: 1, duration: 400, useNativeDriver: false }),
      ])
    );
    cursorLoop.start();

    return () => { clearInterval(interval); cursorLoop.stop(); };
  }, []);

  return (
    <View style={[styles.center, { backgroundColor: theme.colors.void, alignItems: 'flex-start', paddingHorizontal: 24 }]}>
      <View style={{ width: '100%', maxWidth: 400 }}>
        {lines.map((line, i) => (
          <Text key={i} style={{
            fontFamily: theme.typography.mono,
            fontSize: 13,
            color: line.includes('[OK]') ? theme.colors.success : theme.colors.text,
            marginBottom: 4,
          }}>
            {line}
          </Text>
        ))}
        <Text style={{
          fontFamily: theme.typography.mono,
          fontSize: 13,
          color: theme.colors.glow,
          marginBottom: 4,
        }}>
          {currentLine}
          <Animated.Text style={{ opacity: cursorBlink, color: theme.colors.glow }}>█</Animated.Text>
        </Text>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GLASS — Particle Assembly
// ═══════════════════════════════════════════════════════════════════════════
function GlassLoader({ theme, label }: LoaderProps) {
  const particles = useRef(Array.from({ length: 20 }, (_, i) => ({
    startX: Math.random() * W,
    startY: Math.random() * H,
    targetX: W / 2 + Math.cos((i / 20) * Math.PI * 2) * 40,
    targetY: H / 2 - 40 + Math.sin((i / 20) * Math.PI * 2) * 40,
  }))).current;
  const assemble = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const aLoop = Animated.timing(assemble, { toValue: 1, duration: 1500, easing: theme.motion.easeOut, useNativeDriver: false });
    const bLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 2000, easing: theme.motion.easeInOut, useNativeDriver: false }),
        Animated.timing(breathe, { toValue: 0, duration: 2000, easing: theme.motion.easeInOut, useNativeDriver: false }),
      ])
    );
    aLoop.start(); bLoop.start();
    return () => { aLoop.stop(); bLoop.stop(); };
  }, []);

  return (
    <View style={[styles.center, { backgroundColor: theme.colors.void }]}>
      <View style={{ width: W, height: 300, position: 'relative' }}>
        {particles.map((p, i) => (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: assemble.interpolate({ inputRange: [0, 1], outputRange: [p.startX, p.targetX] }),
              top: assemble.interpolate({ inputRange: [0, 1], outputRange: [p.startY, p.targetY] }),
              width: 6, height: 6, borderRadius: 3,
              backgroundColor: theme.colors.glow,
              opacity: assemble.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 0.7, 1] }),
            }}
          />
        ))}
        {/* Center orb */}
        <Animated.View style={{
          position: 'absolute',
          left: W / 2 - 20, top: H / 2 - 60,
          width: 40, height: 40, borderRadius: 20,
          backgroundColor: theme.colors.glow,
          opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] }),
        }} />
        <Animated.View style={{
          position: 'absolute',
          left: W / 2 - 10, top: H / 2 - 50,
          width: 20, height: 20, borderRadius: 10,
          backgroundColor: theme.colors.glowStrong,
          opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
        }} />
      </View>

      <Text style={{
        marginTop: 20,
        fontFamily: theme.typography.title,
        fontSize: theme.typography.titleSize,
        color: theme.colors.text,
        letterSpacing: theme.typography.titleTracking,
      }}>
        {label}
      </Text>
      <Text style={{
        marginTop: 6,
        fontFamily: theme.typography.caption,
        fontSize: theme.typography.captionSize,
        color: theme.colors.textMuted,
      }}>
        Assembling particles...
      </Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CYBER — Scan Boot
// ═══════════════════════════════════════════════════════════════════════════
function CyberLoader({ theme, label }: LoaderProps) {
  const scan = useRef(new Animated.Value(0)).current;
  const glitch = useRef(new Animated.Value(0)).current;
  const [glitchText, setGlitchText] = useState(label.toUpperCase());

  useEffect(() => {
    const scanLoop = Animated.loop(
      Animated.timing(scan, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: false })
    );
    const glitchLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glitch, { toValue: 1, duration: 60, useNativeDriver: false }),
        Animated.timing(glitch, { toValue: 0, duration: 60, useNativeDriver: false }),
        Animated.delay(800 + Math.random() * 2000),
      ])
    );
    scanLoop.start(); glitchLoop.start();

    const glitchChars = '!@#$%^&*<>?/|\\';
    const interval = setInterval(() => {
      if (Math.random() < 0.3) {
        const arr = label.toUpperCase().split('');
        const idx = Math.floor(Math.random() * arr.length);
        if (arr[idx] !== ' ') arr[idx] = glitchChars[Math.floor(Math.random() * glitchChars.length)];
        setGlitchText(arr.join(''));
      } else {
        setGlitchText(label.toUpperCase());
      }
    }, 150);

    return () => { scanLoop.stop(); glitchLoop.stop(); clearInterval(interval); };
  }, []);

  const scanY = scan.interpolate({ inputRange: [0, 1], outputRange: [0, 80] });
  const glitchX = glitch.interpolate({ inputRange: [0, 1], outputRange: [0, 6] });

  return (
    <View style={[styles.center, { backgroundColor: theme.colors.void }]}>
      <View style={{
        width: 200, height: 80,
        borderWidth: 2, borderColor: theme.colors.glow,
        overflow: 'hidden',
      }}>
        <Animated.View style={{
          position: 'absolute', left: 0, right: 0, top: scanY, height: 2,
          backgroundColor: theme.colors.glow,
          shadowColor: theme.colors.glow, shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1, shadowRadius: 8,
        }} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.Text style={{
            fontFamily: theme.typography.title,
            fontSize: 18,
            color: theme.colors.glow,
            letterSpacing: 3,
            transform: [{ translateX: glitchX }],
            textShadowColor: theme.colors.success,
            textShadowOffset: { width: -2, height: 0 },
            textShadowRadius: 0,
          }}>
            {glitchText}
          </Animated.Text>
        </View>
      </View>

      <Text style={{
        marginTop: 24,
        fontFamily: theme.typography.mono,
        fontSize: 11,
        color: theme.colors.textMuted,
        letterSpacing: 2,
        textTransform: 'uppercase',
      }}>
        // SCANNING SYSTEM
      </Text>
      <Text style={{
        marginTop: 4,
        fontFamily: theme.typography.mono,
        fontSize: 11,
        color: theme.colors.success,
      }}>
        ▓▓▓▓▓▓▓▓▓░░ 78%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
