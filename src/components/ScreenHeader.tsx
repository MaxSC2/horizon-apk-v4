// src/components/ScreenHeader.tsx — v4.6
//
// Единый заголовок экрана с кнопкой возврата. Используется на всех скрытых
// экранах (Tasks/Nutrition/Calendar/Alarm/Stats/Settings), открытых из «Ещё».
//
// Заменяет разбросанные по экранам самописные заголовки — даёт единый вид
// и ГАРАНТИРУЕТ что пользователь всегда может вернуться назад.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { Theme } from '../types';
import { useApp } from '../AppContext';
import { Haptic } from '../haptics';
import { navigationRef } from '../../App';

interface ScreenHeaderProps {
  T: Theme;
  title: string;
  subtitle?: string;
  // Right-side action (optional)
  right?: React.ReactNode;
  // Show back button (default true). Set false for top-level tabs.
  showBack?: boolean;
  // Override back target (default: go back to previous screen, fallback to 'More')
  backTo?: string;
}

export function ScreenHeader({ T, title, subtitle, right, showBack = true, backTo }: ScreenHeaderProps) {
  const { uiMode } = useApp();

  const handleBack = () => {
    Haptic.tap();
    if (navigationRef.isReady()) {
      if (backTo) {
        (navigationRef.navigate as any)(backTo);
      } else {
        if (navigationRef.canGoBack()) {
          navigationRef.goBack();
        } else {
          // Fallback — go to More tab
          (navigationRef.navigate as any)('More');
        }
      }
    }
  };

  // Mode-specific prefix
  const prefix = uiMode === 'neon' ? '> ' : uiMode === 'quest' ? '⚜ ' : uiMode === 'cosmic' ? '✦ ' : uiMode === 'mono' ? '▎ ' : uiMode === 'synthwave' ? '◆ ' : '';

  return (
    <View style={[styles.header, {
      backgroundColor: uiMode === 'aurora' ? 'transparent' : T.surf,
      borderBottomWidth: uiMode === 'aurora' ? 0 : 1,
      borderBottomColor: T.bord,
    }]}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity
            onPress={handleBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={[styles.backBtn, { backgroundColor: T.lo, borderColor: T.bord }]}
            accessibilityLabel="Назад"
            accessibilityRole="button"
          >
            <ChevronLeft size={20} color={T.txt} strokeWidth={2.5} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, {
            color: T.txt,
            fontFamily: 'BarlowCondensed_900Black',
            fontSize: uiMode === 'paper' ? 24 : uiMode === 'mono' ? 26 : 22,
            letterSpacing: uiMode === 'neon' ? 3 : uiMode === 'mono' ? 0 : uiMode === 'synthwave' ? 2 : 1,
            textTransform: uiMode === 'mono' ? 'uppercase' as any : 'none' as any,
          }]}>
            {prefix}{title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, {
              color: T.muted,
              fontStyle: uiMode === 'paper' ? 'italic' : 'normal',
            }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {right && <View style={styles.right}>{right}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'BarlowCondensed_900Black',
    fontSize: 22,
  },
  subtitle: {
    fontFamily: 'Barlow_400Regular',
    fontSize: 11,
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
