// src/v6/components/V6Card.tsx
//
// Карточка БЕЗ рамок. Глубина через shadow elevation (как iOS).
// Мягкое скругление 20px. Прозрачность 0.95 чтобы фон слегка просвечивал.
import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle, Platform } from 'react-native';
import { v6Colors, v6Geometry } from '../theme';

interface V6CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  onPress?: () => void;
  // accent — карточка с акцентным цветом (например AI prompt)
  accent?: boolean;
}

export function V6Card({ children, style, padding, onPress, accent }: V6CardProps) {
  const cardStyle: ViewStyle = {
    backgroundColor: accent ? v6Colors.accentSoft : v6Colors.card,
    borderRadius: v6Geometry.cardRadius,
    padding: padding ?? v6Geometry.cardPadding,
    // ТЕНЬ вместо рамки — даёт глубину как в iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: v6Geometry.cardElevation,
    // Лёгкая полупрозрачность — фон просвечивает
    ...(accent ? { borderWidth: 0 } : {}),
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          cardStyle,
          { transform: [{ scale: pressed ? 0.98 : 1 }] },
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
}
