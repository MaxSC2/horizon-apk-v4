// src/components/ModeQuickSwitcher.tsx — v4.4
//
// Быстрый переключатель режимов интерфейса — доступен прямо из шапки дашборда
// или как FAB на других экранах. Открывает модалку с сеткой всех 8 режимов,
// тап на режим сразу его применяет + даёт haptic feedback.
//
// Это решает проблему «не могу найти где переключить интерфейс» — кнопка
// всегда видна в шапке дашборда (иконка.palette).
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Palette, X, Check } from 'lucide-react-native';
import { useApp } from '../AppContext';
import { UI_MODES, getUIMode, ModeBackground, ModeCard } from '../modes';
import { Haptic } from '../haptics';
import { Theme } from '../types';

interface Props {
  T: Theme;
  // Position variant — 'header' для кнопки в шапке, 'fab' для плавающей кнопки
  variant?: 'header' | 'fab';
}

export function ModeQuickSwitcher({ T, variant = 'header' }: Props) {
  const { state, setState, uiMode } = useApp();
  const [open, setOpen] = useState(false);

  const currentMode = getUIMode(state.uiMode);

  const selectMode = (modeId: string) => {
    setState(s => ({ ...s, uiMode: modeId }));
    Haptic.tap();
    // Close modal after a short delay so user sees the selection
    setTimeout(() => setOpen(false), 200);
  };

  const trigger = variant === 'fab' ? (
    <TouchableOpacity
      onPress={() => { Haptic.tap(); setOpen(true); }}
      activeOpacity={0.75}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={{
        position: 'absolute', bottom: 16, right: 16, zIndex: 50,
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: T.primary,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
      }}
    >
      <Palette size={22} color="#000" />
    </TouchableOpacity>
  ) : (
    <TouchableOpacity
      onPress={() => { Haptic.tap(); setOpen(true); }}
      activeOpacity={0.75}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={{
        width: 38, height: 38, borderRadius: 12,
        backgroundColor: T.primary + '18', borderWidth: 1.5, borderColor: T.primary + '44',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Palette size={16} color={T.primary} />
    </TouchableOpacity>
  );

  return (
    <>
      {trigger}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.88)' }} onPress={() => setOpen(false)} />
        <View style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          backgroundColor: T.surf,
          borderTopLeftRadius: 22, borderTopRightRadius: 22,
          paddingBottom: 24,
          maxHeight: '85%',
        }}>
          {/* Grabber */}
          <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 4 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: T.bord }} />
          </View>

          {/* Header */}
          <View style={{ paddingHorizontal: 18, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 20, color: T.txt }}>🎭 Режим интерфейса</Text>
              <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 11, color: T.muted, marginTop: 2 }}>
                Сейчас: {currentMode.emoji} {currentMode.name} · тапни чтобы сменить
              </Text>
            </View>
            <TouchableOpacity onPress={() => setOpen(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: T.bord, backgroundColor: T.lo, alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} color={T.muted} />
            </TouchableOpacity>
          </View>

          {/* Live preview of current mode */}
          <View style={{
            marginHorizontal: 16, marginBottom: 14, height: 80, borderRadius: 14,
            overflow: 'hidden', borderWidth: 1, borderColor: T.bord,
          }}>
            <ModeBackground T={T} mode={uiMode} />
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: 10, justifyContent: 'center' }}>
              <ModeCard T={T} mode={uiMode} style={{ padding: 8 }}>
                <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 14, color: T.txt }}>
                  {currentMode.emoji} {currentMode.name}
                </Text>
                <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 10, color: T.muted, marginTop: 1 }}>
                  {currentMode.desc.length > 50 ? currentMode.desc.slice(0, 50) + '…' : currentMode.desc}
                </Text>
              </ModeCard>
            </View>
          </View>

          {/* Grid of all modes */}
          <View style={{ paddingHorizontal: 12 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {UI_MODES.map(m => {
                const cur = (state.uiMode || 'focus') === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => selectMode(m.id)}
                    activeOpacity={0.75}
                    style={{
                      width: '48%', padding: 12, borderRadius: 14,
                      borderWidth: cur ? 2 : 1,
                      borderColor: cur ? T.primary : T.bord,
                      backgroundColor: cur ? T.primary + '15' : T.lo,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
                      <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 15, color: cur ? T.primary : T.txt, flex: 1 }}>
                        {m.name}
                      </Text>
                      {cur && <Check size={14} color={T.primary} strokeWidth={3} />}
                    </View>
                    <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 10, color: T.muted, lineHeight: 14 }}>
                      {m.desc.length > 60 ? m.desc.slice(0, 60) + '…' : m.desc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
