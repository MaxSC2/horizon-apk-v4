// src/v6/components/V6Background.tsx
//
// Тонкий gradient mesh — как Linear/Arc. Без хаоса частиц, без ярких акцентов.
import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, Dimensions, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { v6Colors } from '../theme';

const { width: W, height: H } = Dimensions.get('window');

export function V6Background() {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(drift, { toValue: 1, duration: 40000, easing: Easing.inOut(Easing.sin), useNativeDriver: false })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const meshPoints = [
    { x: 0.15, y: 0.15, color: v6Colors.accent, opacity: 0.18 },
    { x: 0.85, y: 0.35, color: '#5AC8FA', opacity: 0.12 },
    { x: 0.5, y: 0.9, color: '#30D158', opacity: 0.10 },
  ];

  const dx = drift.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 30, 0] });
  const dy = drift.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -20, 0] });

  return (
    <View style={styles.absolute}>
      <LinearGradient
        colors={[v6Colors.void, v6Colors.surface, v6Colors.void]}
        style={styles.absolute}
      />
      <Animated.View style={[styles.absolute, { transform: [{ translateX: dx }, { translateY: dy }] }]}>
        <Svg width="100%" height="100%" style={styles.absolute}>
          <Defs>
            {meshPoints.map((p, i) => (
              <RadialGradient key={i} id={`mesh${i}`} cx={`${p.x * 100}%`} cy={`${p.y * 100}%`} r="50%">
                <Stop offset="0%" stopColor={p.color} stopOpacity={p.opacity} />
                <Stop offset="100%" stopColor={p.color} stopOpacity="0" />
              </RadialGradient>
            ))}
          </Defs>
          {meshPoints.map((_, i) => (
            <Rect key={i} x={0} y={0} width={W} height={H} fill={`url(#mesh${i})`} />
          ))}
        </Svg>
      </Animated.View>
      <Svg width="100%" height="100%" style={styles.absolute}>
        {Array.from({ length: 50 }, (_, i) => {
          const x = (i * 89) % W;
          const y = (i * 53) % H;
          return <Rect key={i} x={x} y={y} width={1} height={1} fill="#FFFFFF" opacity={0.04} />;
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  absolute: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
});
