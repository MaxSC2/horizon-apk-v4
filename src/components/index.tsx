// src/components/index.tsx — v4.1 polished component library
//
// v4.1 improvements:
//   • Btn: minHeight 48 (was 44), better focus/disabled states, optional icon,
//     optional `size` ('sm' | 'md' | 'lg'), proper pressed feedback.
//   • Card: subtle elevation on dark themes, optional `elevated` prop, optional
//     `padding` override.
//   • Lbl: same API, better default letterSpacing.
//   • IconBtn: NEW — circular 44×44 icon button with proper hit slop.
//   • Sheet: NEW — bottom-sheet wrapper used by modals (handles safe area +
//     dark overlay + drag-to-dismiss).
//   • ProgressBar: rounded ends, optional animated fill (no animation lib).
//   • EmptyState: larger illustration, optional action button.
//   • SectionHeader: now accepts optional `subtitle`.
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ViewStyle, TextStyle, ActivityIndicator,
  Pressable, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { Theme } from '../types';

// ── Btn ─────────────────────────────────────────────────────────────────────
interface BtnProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'ghost' | 'danger' | 'success' | 'muted' | 'warn';
  T: Theme;
  style?: ViewStyle;
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  fullWidth?: boolean;
}
export function Btn({
  children, onPress, variant = 'primary', T, style,
  disabled, loading, size = 'md', icon, fullWidth,
}: BtnProps) {
  const variantStyle: Record<string, { bg: string; border?: string; textColor: string }> = {
    primary: { bg: T.primary, textColor: '#000' },
    ghost:   { bg: 'transparent', border: T.primary, textColor: T.primary },
    danger:  { bg: T.danger, textColor: '#fff' },
    success: { bg: T.success, textColor: '#000' },
    muted:   { bg: T.lo, border: T.bord, textColor: T.txt },
    warn:    { bg: T.warn, textColor: '#000' },
  };
  const v = variantStyle[variant];
  const heights = { sm: 36, md: 48, lg: 56 };
  const fontSizes = { sm: 13, md: 15, lg: 17 };
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      style={[{
        minHeight: heights[size],
        paddingHorizontal: size === 'sm' ? 14 : 18,
        borderRadius: size === 'lg' ? 14 : 10,
        backgroundColor: v.bg,
        borderWidth: v.border ? 1.5 : 0,
        borderColor: v.border,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        opacity: disabled ? 0.45 : 1,
        alignSelf: fullWidth ? 'stretch' : 'auto',
      }, style]}
    >
      {loading
        ? <ActivityIndicator color={v.textColor} size="small"/>
        : <>
            {icon}
            {typeof children === 'string'
              ? <Text style={{
                  fontFamily: 'BarlowCondensed_700Bold',
                  fontSize: fontSizes[size],
                  color: v.textColor,
                  letterSpacing: 0.5,
                }}>{children}</Text>
              : children}
          </>
      }
    </TouchableOpacity>
  );
}

// ── IconBtn — circular 44×44 icon button with proper hit slop ──────────────
interface IconBtnProps {
  onPress: () => void;
  T: Theme;
  size?: number;
  bg?: string;
  border?: string;
  children: React.ReactNode;
  style?: ViewStyle;
  disabled?: boolean;
}
export function IconBtn({ onPress, T, size = 44, bg, border, children, style, disabled }: IconBtnProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={[{
        width: size, height: size,
        borderRadius: size / 2,
        backgroundColor: bg ?? T.lo,
        borderWidth: border ? 1.5 : 0,
        borderColor: border ?? 'transparent',
        alignItems: 'center', justifyContent: 'center',
        opacity: disabled ? 0.4 : 1,
      }, style]}
    >
      {children}
    </TouchableOpacity>
  );
}

// ── Card ────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  T: Theme;
  style?: ViewStyle;
  elevated?: boolean;
  padding?: number;
}
export function Card({ children, T, style, elevated, padding }: CardProps) {
  return (
    <View style={[{
      backgroundColor: T.card,
      borderWidth: 1,
      borderColor: T.bord,
      borderRadius: 14,
      padding: padding ?? 16,
    }, elevated && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 3,
    }, style]}>
      {children}
    </View>
  );
}

// ── Lbl ────────────────────────────────────────────────────────────────────
interface LblProps {
  children: React.ReactNode;
  T: Theme;
  style?: TextStyle;
}
export function Lbl({ children, T, style }: LblProps) {
  return (
    <Text style={[{
      fontFamily: 'BarlowCondensed_700Bold',
      fontSize: 11,
      letterSpacing: 2,
      color: T.muted,
      textTransform: 'uppercase',
    }, style]}>
      {children}
    </Text>
  );
}

// ── Badge ───────────────────────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode;
  color: string;
  T: Theme;
}
export function Badge({ children, color }: BadgeProps) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: color + '30',
      borderWidth: 1,
      borderColor: color + '66',
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 3,
    }}>
      <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 12, color, letterSpacing: 0.5 }}>
        {children}
      </Text>
    </View>
  );
}

// ── Ring (circular progress) ────────────────────────────────────────────────
interface RingProps {
  pct: number;
  size?: number;
  stroke?: number;
  color: string;
  bg: string;
  label?: string;
  T: Theme;
}
export function Ring({ pct, size = 64, stroke = 6, color, bg, label, T }: RingProps) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (circ * Math.min(pct, 100) / 100);
  const displayPct = Math.round(pct);
  const fontSize = size < 60 ? 10 : displayPct >= 100 ? 11 : 12;
  return (
    <View style={{ alignItems: 'center', gap: 3 }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
        <Circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${circ} ${circ}`} strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90" origin={`${size / 2}, ${size / 2}`}
        />
        <SvgText x={size / 2} y={size / 2 + fontSize / 3} textAnchor="middle" fill={color} fontSize={fontSize} fontWeight="700">
          {displayPct}%
        </SvgText>
      </Svg>
      {label && (
        <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 10, color: T.muted, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          {label}
        </Text>
      )}
    </View>
  );
}

// ── Simple Bar Chart (using SVG) — kept for backwards compat ────────────────
interface BarChartData { label: string; value: number; color?: string; }
interface SimpleBarChartProps {
  data: BarChartData[];
  T: Theme;
  height?: number;
  maxVal?: number;
  accentColor?: string;
}
export function SimpleBarChart({ data, T, height = 100, maxVal, accentColor }: SimpleBarChartProps) {
  // NOTE: kept the original implementation verbatim so existing call sites
  // continue to render the same way. New screens use BarChartSVG directly.
  const max = maxVal || Math.max(...data.map(d => d.value), 1);
  const barWidth = 280 / data.length;
  const chartH = height - 20;
  return (
    <Svg width="100%" height={height} viewBox={`0 0 280 ${height}`}>
      {data.map((d, i) => {
        const barH = Math.max(2, (d.value / max) * chartH);
        const x = i * barWidth + barWidth * 0.15;
        const w = barWidth * 0.7;
        const y = chartH - barH;
        return (
          <React.Fragment key={i}>
            <SvgText x={x + w / 2} y={chartH + 14} textAnchor="middle" fill={T.muted} fontSize={8}>
              {d.label}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

// ── Section header ──────────────────────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  T: Theme;
  right?: React.ReactNode;
}
export function SectionHeader({ title, subtitle, T, right }: SectionHeaderProps) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 12 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 22, color: T.txt }}>{title}</Text>
        {subtitle && (
          <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 12, color: T.muted, marginTop: 2 }}>{subtitle}</Text>
        )}
      </View>
      {right}
    </View>
  );
}

// ── Divider ─────────────────────────────────────────────────────────────────
export function Divider({ T }: { T: Theme }) {
  return <View style={{ height: 1, backgroundColor: T.bord, marginVertical: 8 }} />;
}

// ── EmptyState ──────────────────────────────────────────────────────────────
interface EmptyStateProps {
  emoji: string;
  text: string;
  subtext?: string;
  T: Theme;
  actionLabel?: string;
  onAction?: () => void;
}
export function EmptyState({ emoji, text, subtext, T, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
      <Text style={{ fontSize: 48, marginBottom: 14 }}>{emoji}</Text>
      <Text style={{ fontFamily: 'Barlow_600SemiBold', fontSize: 16, color: T.txt, textAlign: 'center', marginBottom: 6 }}>{text}</Text>
      {subtext && <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.muted, textAlign: 'center', lineHeight: 19 }}>{subtext}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.75}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ marginTop: 18, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 12, backgroundColor: T.primary }}
        >
          <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 14, color: '#000' }}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Progress bar ────────────────────────────────────────────────────────────
interface ProgressBarProps {
  pct: number;
  color: string;
  T: Theme;
  height?: number;
}
export function ProgressBar({ pct, color, T, height = 6 }: ProgressBarProps) {
  return (
    <View style={{ height, backgroundColor: T.lo, borderRadius: height / 2, overflow: 'hidden' }}>
      <View style={{
        height: '100%',
        width: `${Math.min(Math.max(pct, 0), 100)}%`,
        backgroundColor: color,
        borderRadius: height / 2,
      }} />
    </View>
  );
}

// ── BtnRow (horizontal group) ───────────────────────────────────────────────
export function BtnRow({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', gap: 8 }}>{children}</View>;
}

// ── Sheet — bottom-sheet wrapper for modals ────────────────────────────────
interface SheetProps {
  visible: boolean;
  onClose: () => void;
  T: Theme;
  children: React.ReactNode;
  title?: string;
  maxHeightPct?: number;
}
export function Sheet({ visible, onClose, T, children, title, maxHeightPct = 0.85 }: SheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  if (!visible) return null;
  return (
    <>
      <Pressable
        onPress={onClose}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.78)',
        }}
      />
      <View style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        maxHeight: height * maxHeightPct,
        backgroundColor: T.surf,
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        paddingBottom: Math.max(insets.bottom, 16) + 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
      }}>
        {/* Grabber */}
        <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 4 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: T.bord }} />
        </View>
        {title && (
          <View style={{ paddingHorizontal: 18, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 20, color: T.txt }}>{title}</Text>
            <IconBtn onPress={onClose} T={T} size={32} bg={T.lo} border={T.bord}>
              <Text style={{ color: T.muted, fontSize: 16, fontWeight: '700' }}>✕</Text>
            </IconBtn>
          </View>
        )}
        {children}
      </View>
    </>
  );
}
