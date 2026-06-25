// src/components/UnifiedBtn.tsx — v4.6
//
// Единая кнопка на основе DesignSystem. Заменяет Btn, ModeBtn, IconBtn, FAB.
// Все радиусы/шрифты/тени берутся из DesignTokens.
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, StyleSheet } from 'react-native';
import { Theme } from '../types';
import { useDesign } from '../design';
import { Haptic } from '../haptics';

type BtnVariant = 'primary' | 'ghost' | 'danger' | 'success' | 'muted' | 'warn';

interface UnifiedBtnProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: BtnVariant;
  T: Theme;
  style?: ViewStyle;
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function UnifiedBtn({
  children, onPress, variant = 'primary', T, style,
  disabled, loading, size = 'md', icon, fullWidth,
}: UnifiedBtnProps) {
  const { tokens, glowColor } = useDesign();

  const variantStyle: Record<BtnVariant, { bg: string; border?: string; textColor: string }> = {
    primary: { bg: T.primary, textColor: '#000' },
    ghost:   { bg: 'transparent', border: T.primary, textColor: T.primary },
    danger:  { bg: T.danger, textColor: '#fff' },
    success: { bg: T.success, textColor: '#000' },
    muted:   { bg: T.lo, border: T.bord, textColor: T.txt },
    warn:    { bg: T.warn, textColor: '#000' },
  };
  const v = variantStyle[variant];
  const heights = { sm: 36, md: tokens.btnHeight, lg: 56 };
  const fontSizes = { sm: 13, md: 15, lg: 17 };

  // Glow for neon/cosmic/synthwave primary buttons
  const glowStyle: ViewStyle = tokens.cardGlow && variant === 'primary' ? {
    shadowColor: glowColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 0,
  } : {};

  const handlePress = () => {
    Haptic.tap();
    onPress?.();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={tokens.pressOpacity}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      style={[{
        minHeight: heights[size],
        paddingHorizontal: size === 'sm' ? 14 : 18,
        borderRadius: tokens.btnRadius,
        backgroundColor: v.bg,
        borderWidth: v.border ? tokens.btnBorderWidth : 0,
        borderColor: v.border,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
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
                  fontFamily: tokens.id === 'paper-classic' || tokens.id === 'nature-calm'
                    ? 'Barlow_600SemiBold'
                    : 'BarlowCondensed_700Bold',
                  fontSize: fontSizes[size],
                  color: v.textColor,
                  letterSpacing: tokens.bodyLetterSpacing,
                  textTransform: tokens.uppercase ? 'uppercase' as any : 'none' as any,
                }}>{children}</Text>
              : children}
          </>
      }
    </TouchableOpacity>
  );
}
