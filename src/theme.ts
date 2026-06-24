// src/theme.ts
import { Theme } from './types';

export const THEMES: Theme[] = [
  {
    id: 'cosmos', name: 'Космос', icon: '🌌', dark: true,
    bg: '#07090D', surf: '#0D1520', card: '#111D2C', bord: '#1A2E42',
    txt: '#DDE6EE', muted: '#3D5A72', lo: '#0F1C2C',
    primary: '#00C4F0', success: '#00E676', warn: '#FFD600', danger: '#FF4455',
  },
  {
    id: 'aurora', name: 'Аврора', icon: '🌠', dark: true,
    bg: '#06030F', surf: '#100820', card: '#160B2E', bord: '#2A1250',
    txt: '#EAD9FF', muted: '#6B3FA0', lo: '#120A26',
    primary: '#C77DFF', success: '#56CFE1', warn: '#FFD166', danger: '#FF4D6D',
  },
  {
    id: 'neon', name: 'Неон', icon: '⚡', dark: true,
    bg: '#040408', surf: '#08080F', card: '#0C0C18', bord: '#1A1A35',
    txt: '#E0FFFF', muted: '#3D5060', lo: '#0A0A16',
    primary: '#00FFCC', success: '#39FF14', warn: '#FFE600', danger: '#FF003C',
  },
  {
    id: 'forest', name: 'Лес', icon: '🌿', dark: true,
    bg: '#060D08', surf: '#0A1A0D', card: '#0F2214', bord: '#1A3D22',
    txt: '#D4EDD9', muted: '#3D6B48', lo: '#0C1C10',
    primary: '#4ADE80', success: '#86EFAC', warn: '#FDE047', danger: '#FF6B6B',
  },
  {
    id: 'sunset', name: 'Закат', icon: '🌅', dark: true,
    bg: '#0D0805', surf: '#1A100A', card: '#211510', bord: '#3D2518',
    txt: '#F0DDD0', muted: '#7A4A35', lo: '#1C1008',
    primary: '#FB923C', success: '#4ADE80', warn: '#FACC15', danger: '#F43F5E',
  },
  {
    id: 'steel', name: 'Сталь', icon: '🔩', dark: true,
    bg: '#0C0E12', surf: '#141820', card: '#1C2130', bord: '#2A3245',
    txt: '#C8D4E8', muted: '#4A5A70', lo: '#151A24',
    primary: '#7EB8FF', success: '#4DD8A0', warn: '#F5C842', danger: '#FF6060',
  },
  {
    id: 'arctic', name: 'Арктика', icon: '❄️', dark: false,
    bg: '#F0F7FF', surf: '#FFFFFF', card: '#FFFFFF', bord: '#D0E4F5',
    txt: '#0F2740', muted: '#6B99BF', lo: '#E8F4FF',
    primary: '#0284C7', success: '#059669', warn: '#D97706', danger: '#DC2626',
  },
  {
    id: 'sand', name: 'Песок', icon: '🏜️', dark: false,
    bg: '#FAF5EB', surf: '#FFFFFF', card: '#FFFFFF', bord: '#E2D5BE',
    txt: '#3D2B0E', muted: '#9B7F56', lo: '#F5EDD8',
    primary: '#B45309', success: '#16A34A', warn: '#CA8A04', danger: '#DC2626',
  },
];

export function getTheme(id: string): Theme {
  return THEMES.find(t => t.id === id) || THEMES[0];
}

// Hex to rgba helper
export function hex(color: string, opacity: number): string {
  const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
  return color + alpha;
}
