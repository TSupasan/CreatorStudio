
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';

import {
  useColorScheme,
} from 'react-native';

import {
  lightColors,
  darkColors,
} from './colors';
import { getSavedThemeMode, saveThemeMode as persistThemeMode } from '../database/repositories/settingsRepository';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemTheme = useColorScheme();

  const [themeMode, setThemeModeState] = useState('system');
  const [themeLoaded, setThemeLoaded] = useState(false);

  const [colors, setColors] = useState(
    systemTheme === 'dark' ? darkColors : lightColors
  );

  useEffect(() => {
    let isActive = true;

    getSavedThemeMode()
      .then((savedMode) => {
        if (isActive) setThemeModeState(savedMode);
      })
      .catch((error) => console.warn('Could not load saved theme:', error))
      .finally(() => {
        if (isActive) setThemeLoaded(true);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const setThemeMode = useCallback(async (mode) => {
    await persistThemeMode(mode);
    setThemeModeState(mode);
  }, []);

  useEffect(() => {
    const activeTheme =
      themeMode === 'system' ? systemTheme : themeMode;

    setColors(
      activeTheme === 'dark' ? darkColors : lightColors
    );
  }, [themeMode, systemTheme]);

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        themeLoaded,
        colors,
        isDark: colors === darkColors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      'useTheme must be used inside ThemeProvider'
    );
  }

  return context;
}

