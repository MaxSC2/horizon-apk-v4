// src/components/UnifiedCard.tsx — v4.6
//
// Единая карточка, использующая DesignSystem. Заменяет Card и ModeCard.
// Все радиусы/тени/бордеры берутся из DesignTokens — больше никаких
// расхождений между экранами.
import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../types';
import { DesignTokens } from '../design/types';
import { useDesign } from '../design';
import { Haptic } from '../haptics';

interface UnifiedCardProps {
  children: React.ReactNode;
  T: Theme;
  style?: ViewStyle;
  padding?: number;
  // Делает карточку тапаемой
  onPress?: () => void;
  // Режим подсветки при нажатии
  pressable?: boolean;
  // Дополнительный glow (переопределяет дизайн)
  glow?: boolean;
  // LinearGradient stops (если нужна градиентная карточка)
  gradient?: string[];
  // Лёгкий наклон (для paper режима)
  tilt?: boolean;
}

export function UnifiedCard({
  children, T, style, padding, onPress, pressable, glow, gradient, tilt,
}: UnifiedCardProps) {
  const { tokens, glowColor, cardBorderColor } = useDesign();

  // Стабильный tilt для paper режима (генерируется один раз на mount)
  const tiltValue = useRef(tilt ? (Math.random() * 0.6 - 0.3) : 0).current;

  // ── Base card style from tokens ──
  const baseStyle: ViewStyle = {
    borderRadius: tokens.cardRadius,
    borderWidth: tokens.cardBorderWidth,
    borderColor: cardBorderColor,
    padding: padding ?? tokens.cardPadding,
    overflow: 'hidden',
  };

  // ── Shadow / Glow ──
  const shadowStyle: ViewStyle = {};
  if (glow ?? tokens.cardGlow) {
    shadowStyle.shadowColor = glowColor;
    shadowStyle.shadowOffset = { width: 0, height: 0 };
    shadowStyle.shadowOpacity = 0.6;
    shadowStyle.shadowRadius = tokens.cardGlowRadius;
    shadowStyle.elevation = 0;
  } else if (tokens.cardShadow) {
    shadowStyle.shadowColor = tokens.cardShadowColor;
    shadowStyle.shadowOffset = { width: 0, height: 2 };
    shadowStyle.shadowOpacity = tokens.cardShadowOpacity;
    shadowStyle.shadowRadius = tokens.cardShadowRadius;
    shadowStyle.elevation = tokens.cardElevation;
  }

  // ── Tilt (paper-style organic feel) ──
  const tiltStyle: ViewStyle = tilt ? { transform: [{ rotate: `${tiltValue.toFixed(2)}deg` }] } : {};

  // ── Content ──
  const renderContent = () => {
    if (gradient) {
      return (
        <LinearGradient
          colors={gradient as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: padding ?? tokens.cardPadding }}
        >
          {children}
        </LinearGradient>
      );
    }
    return children;
  };

  const cardContent = (
    <>
      {renderContent()}
      {/* Quest mode: golden corners */}
      {tokens.id === 'playful-bubble' && (
        <>
          <View style={{ position: 'absolute', top: 0, left: 0, width: 16, height: 16, borderTopLeftRadius: tokens.cardRadius, borderLeftWidth: 3, borderTopWidth: 3, borderColor: T.warn }} />
          <View style={{ position: 'absolute', top: 0, right: 0, width: 16, height: 16, borderTopRightRadius: tokens.cardRadius, borderRightWidth: 3, borderTopWidth: 3, borderColor: T.warn }} />
          <View style={{ position: 'absolute', bottom: 0, left: 0, width: 16, height: 16, borderBottomLeftRadius: tokens.cardRadius, borderLeftWidth: 3, borderBottomWidth: 3, borderColor: T.warn }} />
          <View style={{ position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, borderBottomRightRadius: tokens.cardRadius, borderRightWidth: 3, borderBottomWidth: 3, borderColor: T.warn }} />
        </>
      )}
      {/* Mono-print: double top border */}
      {tokens.id === 'mono-print' && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderTopWidth: 2, borderBottomWidth: 1, borderColor: T.txt, opacity: 0.7 }} />
      )}
      {/* Synthwave/Neon: gradient underline */}
      {(tokens.id === 'neon-cyber') && (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, backgroundColor: glowColor, opacity: 0.6 }} />
      )}
      {/* Cosmic: tiny star in corner */}
      {tokens.id === 'cosmic-deep' && (
        <>
          <View style={{ position: 'absolute', top: 8, right: 8, width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFFFFF', opacity: 0.8 }} />
          <View style={{ position: 'absolute', top: 14, right: 16, width: 2, height: 2, borderRadius: 1, backgroundColor: T.primary, opacity: 0.7 }} />
        </>
      )}
    </>
  );

  // ── Blur (Minimal Glass) ──
  if (tokens.useBlur && Platform.OS !== 'web') {
    const blurView = (
      <BlurView
        intensity={tokens.blurIntensity}
        tint={T.dark ? 'dark' : 'light'}
        style={[baseStyle, shadowStyle, tiltStyle, style]}
      >
        {cardContent}
      </BlurView>
    );
    if (onPress || pressable) {
      return (
        <TouchableOpacity
          onPress={() => { Haptic.tap(); onPress?.(); }}
          activeOpacity={tokens.pressOpacity}
          disabled={!onPress}
        >
          {blurView}
        </TouchableOpacity>
      );
    }
    return blurView;
  }

  // ── Regular card ──
  const card = (
    <View style={[baseStyle, { backgroundColor: T.card }, shadowStyle, tiltStyle, style]}>
      {cardContent}
    </View>
  );

  if (onPress || pressable) {
    return (
      <TouchableOpacity
        onPress={() => { Haptic.tap(); onPress?.(); }}
        activeOpacity={tokens.pressOpacity}
        disabled={!onPress}
      >
        {card}
      </TouchableOpacity>
    );
  }

  return card;
}
