// src/v5/V5Context.tsx — HORIZON V5
//
// Контекст V5. Полностью независим от v4 AppContext.
// Хранит: текущую тему, навигационное состояние, AI-сообщения.
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { V5Theme, ThemeId } from './themes';
import { getV5Theme } from './themes';

const V5_THEME_KEY = 'horizon_v5_theme';

interface V5ContextValue {
  theme: V5Theme;
  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;
  // Текущий активный экран (для floating dock navigation)
  activeScreen: string;
  setActiveScreen: (s: string) => void;
}

const V5Context = createContext<V5ContextValue>({} as V5ContextValue);

export function V5Provider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>('solo');
  const [activeScreen, setActiveScreen] = useState('home');

  useEffect(() => {
    AsyncStorage.getItem(V5_THEME_KEY).then(stored => {
      if (stored && ['solo', 'dev', 'glass', 'cyber'].includes(stored)) {
        setThemeId(stored as ThemeId);
      }
    });
  }, []);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeId(id);
    AsyncStorage.setItem(V5_THEME_KEY, id);
  }, []);

  const theme = getV5Theme(themeId);

  return (
    <V5Context.Provider value={{ theme, themeId, setTheme, activeScreen, setActiveScreen }}>
      {children}
    </V5Context.Provider>
  );
}

export const useV5 = () => useContext(V5Context);
