import React, { useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeContext, darkColors, lightColors } from '../theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === 'dark');
  const [useSystemTheme, setUseSystemTheme] = useState(true);

  // 跟随系统主题变化
  useEffect(() => {
    if (useSystemTheme) {
      setIsDark(systemScheme === 'dark');
    }
  }, [systemScheme, useSystemTheme]);

  const toggleTheme = () => {
    setUseSystemTheme(false);
    setIsDark(prev => !prev);
  };

  const setDarkMode = (dark: boolean) => {
    setUseSystemTheme(false);
    setIsDark(dark);
  };

  return React.createElement(
    ThemeContext.Provider,
    {
      value: {
        isDark,
        colors: isDark ? darkColors : lightColors,
        toggleTheme,
        setDarkMode,
      },
    },
    children
  );
}
