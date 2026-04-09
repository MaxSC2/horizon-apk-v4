// src/components/StylePickerModal.tsx — UI Style picker with preview
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, ScrollView } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { Theme } from '../types';
import { UI_STYLES, UIStyle } from '../styles';

interface Props {
  T: Theme;
  currentStyleId: string;
  currentThemeId: string;
  onSelect: (styleId: string) => void;
  onClose: () => void;
}

// Mini UI preview component
function StylePreview({ style, T, theme }: { style: UIStyle; T: Theme; theme: string }) {
  const isPixel = style.id === 'pixel';
  const isKawaii = style.id === 'kawaii';
  const isRPG = style.id === 'rpg';
  const isGlow = style.id === 'glow';

  return (
    <View style={{
      height: 100, backgroundColor: T.bg, borderRadius: style.cardRadius / 2,
      overflow: 'hidden', padding: 7,
      borderWidth: isPixel ? 3 : isRPG ? 2 : 1, borderColor: isPixel ? T.primary : isRPG ? T.primary + '88' : T.bord,
    }}>
      {/* Fake header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 5, padding: 4,
        backgroundColor: T.surf, borderRadius: Math.min(style.cardRadius / 2, 6) }}>
        <Text style={{ fontSize: 8 }}>{isRPG ? '⚔️' : isKawaii ? '🌸' : isPixel ? '►' : '🌅'}</Text>
        <Text style={{ fontFamily: isPixel ? 'BarlowCondensed_900Black' : 'BarlowCondensed_700Bold', fontSize: 8, color: T.txt }}>
          {isRPG ? 'ГОРИЗОНТ' : isKawaii ? 'ГОРИЗОНТ ♡' : isPixel ? '► HORIZON' : 'ГОРИЗОНТ'}
        </Text>
        <View style={{ flex: 1 }} />
        <View style={{ width: 20, height: 4, borderRadius: 2, backgroundColor: T.primary }} />
      </View>
      {/* Fake cards */}
      <View style={{ flexDirection: 'row', gap: 4, marginBottom: 4 }}>
        {[T.primary, T.success, T.warn].map((c, i) => (
          <View key={i} style={{ flex: 1, height: 22, backgroundColor: T.card, borderRadius: style.cardRadius / 3,
            borderWidth: style.borderWidth, borderColor: isRPG ? T.primary + '44' : T.bord,
            alignItems: 'center', justifyContent: 'center',
            ...(isGlow ? { shadowColor: T.primary, shadowOpacity: 0.5, shadowRadius: 4 } : {}),
          }}>
            <View style={{ width: 12, height: 3, borderRadius: 2, backgroundColor: c, opacity: 0.8 }} />
          </View>
        ))}
      </View>
      {/* Fake button */}
      <View style={{ height: 16, backgroundColor: T.primary, borderRadius: style.btnRadius / 2, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: isPixel ? 'BarlowCondensed_900Black' : 'BarlowCondensed_700Bold', fontSize: 7, color: '#000' }}>
          {isRPG ? '[ СРАЖЕНИЕ ]' : isKawaii ? '( НАЖМИ ♡ )' : isPixel ? '> СТАРТ' : 'Начать'}
        </Text>
      </View>
      {/* Pixel scanlines overlay */}
      {isPixel && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.06 }}>
          {Array.from({ length: 20 }, (_, i) => (
            <View key={i} style={{ height: 1, backgroundColor: '#fff', marginBottom: 4 }} />
          ))}
        </View>
      )}
    </View>
  );
}

export default function StylePickerModal({ T, currentStyleId, currentThemeId, onSelect, onClose }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  const categories = [
    { label: '✦ Стандартные', ids: ['default', 'sharp', 'soft', 'glow'] },
    { label: '🎮 Игровые', ids: ['rpg', 'kawaii', 'pixel'] },
  ];

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable onPress={() => {}} style={{ backgroundColor: T.surf }}>
          <View style={{ borderTopLeftRadius: 22, borderTopRightRadius: 22 }}>
            {/* Header */}
            <View style={{ padding: 18, paddingBottom: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <View>
                  <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 20, color: T.txt }}>Стиль интерфейса</Text>
                  <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 12, color: T.muted }}>Форма UI · цвета меняются отдельно в Темах</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: T.bord, backgroundColor: T.lo, alignItems: 'center', justifyContent: 'center' }}>
                  <X size={14} color={T.muted} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 28 }}>
              {categories.map(cat => (
                <View key={cat.label} style={{ marginBottom: 16 }}>
                  <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 11, color: T.muted, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>{cat.label}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    {cat.ids.map(id => {
                      const s = UI_STYLES.find(x => x.id === id)!;
                      const isActive = id === currentStyleId;
                      return (
                        <TouchableOpacity key={id} onPress={() => { onSelect(id); onClose(); }}
                          activeOpacity={0.85}
                          style={{ width: '47%', borderRadius: 14, borderWidth: isActive ? 2.5 : 1.5,
                            borderColor: isActive ? T.primary : T.bord,
                            backgroundColor: isActive ? T.primary + '10' : T.card,
                            overflow: 'hidden', padding: 10 }}>
                          {/* Preview */}
                          <StylePreview style={s} T={T} theme={currentThemeId} />
                          {/* Label */}
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 }}>
                            <Text style={{ fontSize: 14 }}>{s.emoji}</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 14, color: isActive ? T.primary : T.txt }}>{s.name}</Text>
                              <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 10, color: T.muted }}>{s.desc}</Text>
                            </View>
                            {isActive && <Check size={14} color={T.primary} strokeWidth={2.5} />}
                          </View>
                          {/* Special badge */}
                          {(id === 'rpg' || id === 'kawaii' || id === 'pixel') && (
                            <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: T.warn, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1 }}>
                              <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 8, color: '#000' }}>UNIQUE</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
