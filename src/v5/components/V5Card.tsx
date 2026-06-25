// src/v5/components/V5Card.tsx — HORIZON V5
//
// Единая карточка V5. Использует V5Theme — полностью независима от v4.
// Поддерживает: holographic borders (solo/cyber), glow (solo/cyber),
// glassmorphism (glass), monochrome (dev), glitch (cyber).
import React, { useEffect, useRef } from 'react';
import { View, Animated, Pressable, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { V5Theme } from '../themes';

interface V5CardProps {
  theme: V5Theme;
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  onPress?: () => void;
  // Активировать особые эффекты темы (aura для solo, glitch для cyber)
  emphasized?: boolean;
  // Заголовок-метка в углу (solo style "SYSTEM")
  label?: string;
}

export function V5Card({ theme, children, style, padding, onPress, emphasized, label }: V5CardProps) {
  const glowPulse = useRef(new Animated.Value(theme.motion.glowPulseOpacity[0])).current;

  useEffect(() => {
    if (!theme.features.holographicBorders && !emphasized) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: theme.motion.glowPulseOpacity[1], duration: theme.motion.glowPulseDuration, easing: theme.motion.easeInOut, useNativeDriver: false }),
        Animated.timing(glowPulse, { toValue: theme.motion.glowPulseOpacity[0], duration: theme.motion.glowPulseDuration, easing: theme.motion.easeInOut, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [theme, emphasized]);

  const baseStyle: ViewStyle = {
    borderRadius: theme.geometry.cardRadius,
    borderWidth: theme.geometry.cardBorderWidth,
    borderColor: theme.colors.border,
    padding: padding ?? theme.geometry.cardPadding,
    overflow: 'hidden',
  };

  // Glow shadow for solo/cyber themes
  const glowStyle: ViewStyle = (theme.features.aura || emphasized) ? {
    shadowColor: theme.colors.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: glowPulse as any,
    shadowRadius: emphasized ? 16 : 8,
    elevation: emphasized ? 8 : 4,
  } : {};

  // Border glow (solo/cyber holographic borders)
  const borderGlowStyle: ViewStyle = theme.features.holographicBorders ? {
    borderColor: theme.colors.borderGlow,
  } : {};

  const content = (
    <>
      {/* Label in corner (solo style) */}
      {label && (
        <View style={{
          position: 'absolute', top: 0, left: 0,
          backgroundColor: theme.colors.glow,
          paddingHorizontal: 8, paddingVertical: 2,
        }}>
          <Animated.Text style={{
            fontFamily: theme.typography.mono,
            fontSize: 9,
            color: theme.colors.void,
            letterSpacing: 1,
            opacity: glowPulse as any,
          }}>
            {label}
          </Animated.Text>
        </View>
      )}
      {children}

      {/* Cyberpunk corner brackets */}
      {theme.id === 'cyber' && (
        <>
          <View style={{ position: 'absolute', top: 0, left: 0, width: 12, height: 12, borderLeftWidth: 2, borderTopWidth: 2, borderColor: theme.colors.glow }} />
          <View style={{ position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderRightWidth: 2, borderTopWidth: 2, borderColor: theme.colors.glow }} />
          <View style={{ position: 'absolute', bottom: 0, left: 0, width: 12, height: 12, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: theme.colors.glow }} />
          <View style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRightWidth: 2, borderBottomWidth: 2, borderColor: theme.colors.glow }} />
        </>
      )}
    </>
  );

  // Glass theme: use BlurView
  if (theme.id === 'glass' && Platform.OS !== 'web') {
    const card = (
      <BlurView
        intensity={40}
        tint="dark"
        style={[baseStyle, borderGlowStyle, style]}
      >
        {content}
      </BlurView>
    );
    if (onPress) {
      return (
        <Pressable onPress={onPress} style={({ pressed }) => [{ transform: [{ scale: pressed ? theme.motion.pressScale : 1 }] }]}>
          {card}
        </Pressable>
      );
    }
    return card;
  }

  const card = (
    <View style={[baseStyle, borderGlowStyle, { backgroundColor: theme.colors.elevated }, glowStyle, style]}>
      {content}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [{ transform: [{ scale: pressed ? theme.motion.pressScale : 1 }], opacity: pressed ? theme.motion.pressOpacity : 1 }]}
      >
        {card}
      </Pressable>
    );
  }

  return card;
}
