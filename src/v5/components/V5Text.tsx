// src/v5/components/V5Text.tsx — HORIZON V5
//
// Текстовые компоненты V5. Каждый вариант = сочетание токенов типографики.
// Поддерживает typewriter effect (dev тема) и terminal cursor.
import React, { useEffect, useState, useRef } from 'react';
import { Text, Animated, TextStyle } from 'react-native';
import { V5Theme } from '../themes';

interface V5TextProps {
  theme: V5Theme;
  children: React.ReactNode;
  variant?: 'display' | 'title' | 'body' | 'mono' | 'caption';
  style?: TextStyle;
  // Включить typewriter effect (для dev темы — по умолчанию true)
  typewriter?: boolean;
  // Мигающий курсор в конце (для terminal aesthetic)
  cursor?: boolean;
  // Скорость печати (мс на символ) — только если typewriter=true
  typeSpeed?: number;
}

export function V5Text({
  theme, children, variant = 'body', style,
  typewriter, cursor, typeSpeed = 30,
}: V5TextProps) {
  // Typewriter по умолчанию для dev темы
  const useTypewriter = typewriter ?? (theme.features.typewriter && variant !== 'caption');
  const useCursor = cursor ?? theme.features.terminalCursor;

  // Coerce children to string for typewriter
  const text = typeof children === 'string' ? children : String(children ?? '');

  const [displayed, setDisplayed] = useState(useTypewriter ? '' : text);
  const cursorBlink = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!useTypewriter) {
      setDisplayed(text);
      return;
    }
    let i = 0;
    const interval = setInterval(() => {
      if (i <= text.length) {
        setDisplayed(text.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, typeSpeed);
    return () => clearInterval(interval);
  }, [text, useTypewriter, typeSpeed]);

  useEffect(() => {
    if (!useCursor) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorBlink, { toValue: 0, duration: 400, useNativeDriver: false }),
        Animated.timing(cursorBlink, { toValue: 1, duration: 400, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [useCursor]);

  const variantStyle: TextStyle = ({
    display: {
      fontFamily: theme.typography.display,
      fontSize: theme.typography.displaySize,
      letterSpacing: theme.typography.displayTracking,
      color: theme.colors.text,
      textTransform: theme.typography.uppercase ? 'uppercase' : 'none',
    } as TextStyle,
    title: {
      fontFamily: theme.typography.title,
      fontSize: theme.typography.titleSize,
      letterSpacing: theme.typography.titleTracking,
      color: theme.colors.text,
      textTransform: theme.typography.uppercase ? 'uppercase' : 'none',
    } as TextStyle,
    body: {
      fontFamily: theme.typography.body,
      fontSize: theme.typography.bodySize,
      letterSpacing: theme.typography.bodyTracking,
      color: theme.colors.text,
    } as TextStyle,
    mono: {
      fontFamily: theme.typography.mono,
      fontSize: theme.typography.bodySize,
      color: theme.colors.glow,
    } as TextStyle,
    caption: {
      fontFamily: theme.typography.caption,
      fontSize: theme.typography.captionSize,
      color: theme.colors.textMuted,
    } as TextStyle,
  } as Record<string, TextStyle>)[variant];

  return (
    <Text style={[variantStyle, style]}>
      {displayed}
      {useCursor && (
        <Animated.Text style={{ color: theme.colors.glow, opacity: cursorBlink }}>█</Animated.Text>
      )}
    </Text>
  );
}
