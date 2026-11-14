
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
  getThemePalette,
} from './colors';
import { getTypographyStyle } from './typography';
import { getSavedThemeMode, saveThemeMode as persistThemeMode } from '../database/repositories/settingsRepository';
import { useAppPreferences } from '../context/AppPreferencesContext';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemTheme = useColorScheme();
  const { preferences, updatePreferences } = useAppPreferences();

  const [themeMode, setThemeModeState] = useState('system');
  const [themeLoaded, setThemeLoaded] = useState(false);

  const activeMode = themeMode === 'system' ? systemTheme : themeMode;
  const resolvedMode = activeMode === 'dark' ? 'dark' : 'light';
  const colors = React.useMemo(() => getThemePalette(
    preferences.visualTheme,
    resolvedMode,
    preferences.customAccent
  ), [preferences.visualTheme, preferences.customAccent, resolvedMode]);
  const typographyStyle = React.useMemo(() => getTypographyStyle(preferences.typographyStyle), [preferences.typographyStyle]);

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

  const setVisualPreferences = useCallback(async (changes) => updatePreferences(changes), [updatePreferences]);

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        themeLoaded,
        colors,
        isDark: resolvedMode === 'dark',
        themeName: preferences.visualTheme,
        customAccent: preferences.customAccent,
        typographyStyle: preferences.typographyStyle,
        typography: typographyStyle,
        setVisualPreferences,
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

