
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  useColorScheme,
} from 'react-native';

import {
  lightColors,
  darkColors,
} from './colors';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemTheme = useColorScheme();

  const [themeMode, setThemeMode] = useState('system');

  const [colors, setColors] = useState(
    systemTheme === 'dark' ? darkColors : lightColors
  );

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

