// src/v7/components/Background.tsx — HORIZON V7
//
// 3 живых фона. Не 8. Каждый — атмосфера, не просто картинка.
// Midnight: чёрный + 2 cyan glow + subtle stars
// Aurora: индиго + purple/teal drift orbs
// Paper: тёплый крем + subtle texture
import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, Dimensions, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { V7Theme } from '../themes';

const { width: W, height: H } = Dimensions.get('window');

export function V7Background({ theme }: { theme: V7Theme }) {
  switch (theme.id) {
    case 'midnight': return <MidnightBg theme={theme} />;
    case 'aurora':   return <AuroraBg theme={theme} />;
    case 'paper':    return <PaperBg theme={theme} />;
  }
}

function MidnightBg({ theme }: { theme: V7Theme }) {
  const drift = useRef(new Animated.Value(0)).current;
  const twinkle = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const dLoop = Animated.loop(
      Animated.timing(drift, { toValue: 1, duration: 30000, easing: Easing.inOut(Easing.sin), useNativeDriver: false })
    );
    const tLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(twinkle, { toValue: 0.8, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(twinkle, { toValue: 0.2, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    );
    dLoop.start(); tLoop.start();
    return () => { dLoop.stop(); tLoop.stop(); };
  }, []);

  // Stars — фиксированные позиции
  const stars = useRef(Array.from({ length: 35 }, (_, i) => ({
    x: (i * 89) % W,
    y: (i * 53) % H,
    size: i % 4 === 0 ? 2 : 1,
  }))).current;

  const dx = drift.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 40, 0] });
  const dy = drift.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -25, 0] });

  return (
    <View style={s.abs}>
      <LinearGradient colors={[theme.void, theme.surface, theme.void]} style={s.abs} />
      {/* Glow 1 — cyan top-left */}
      <Animated.View style={{
        position: 'absolute', top: -100, left: -80,
        width: 320, height: 320, borderRadius: 160,
        backgroundColor: theme.glow1, opacity: 0.12,
        transform: [{ translateX: dx }, { translateY: dy }],
      }} />
      {/* Glow 2 — blue bottom-right */}
      <Animated.View style={{
        position: 'absolute', bottom: -120, right: -100,
        width: 360, height: 360, borderRadius: 180,
        backgroundColor: theme.glow2, opacity: 0.08,
        transform: [{ translateX: drift.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -30, 0] }) }],
      }} />
      {/* Stars */}
      {stars.map((st, i) => (
        <Animated.View key={i} style={{
          position: 'absolute', left: st.x, top: st.y,
          width: st.size, height: st.size, borderRadius: st.size / 2,
          backgroundColor: '#FFFFFF', opacity: twinkle,
        }} />
      ))}
    </View>
  );
}

function AuroraBg({ theme }: { theme: V7Theme }) {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(drift, { toValue: 1, duration: 25000, easing: Easing.inOut(Easing.sin), useNativeDriver: false })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={s.abs}>
      <LinearGradient
        colors={[theme.void, theme.surface, theme.void]}
        style={s.abs}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {/* Purple orb */}
      <Animated.View style={{
        position: 'absolute', top: -80, left: -60,
        width: 340, height: 340, borderRadius: 170,
        backgroundColor: theme.glow1, opacity: 0.15,
        transform: [
          { translateX: drift.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 60, 0] }) },
          { translateY: drift.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 30, 0] }) },
        ],
      }} />
      {/* Teal orb */}
      <Animated.View style={{
        position: 'absolute', bottom: -100, right: -80,
        width: 300, height: 300, borderRadius: 150,
        backgroundColor: theme.glow2, opacity: 0.12,
        transform: [
          { translateX: drift.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -40, 0] }) },
          { translateY: drift.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -20, 0] }) },
        ],
      }} />
    </View>
  );
}

function PaperBg({ theme }: { theme: V7Theme }) {
  return (
    <View style={s.abs}>
      <LinearGradient
        colors={[theme.void, theme.surface, theme.void]}
        style={s.abs}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      {/* Subtle blue glow top */}
      <View style={{
        position: 'absolute', top: -100, left: W / 2 - 150,
        width: 300, height: 300, borderRadius: 150,
        backgroundColor: theme.glow1, opacity: 0.06,
      }} />
    </View>
  );
}

const s = StyleSheet.create({ abs: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } });
