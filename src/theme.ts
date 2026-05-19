import { useColorScheme } from 'react-native';

export interface ThemeColors {
  bg: string;
  card: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  overlay: string;
  inputBg: string;
  accent: string;
  green: string;
  orange: string;
  red: string;
}

export const darkColors: ThemeColors = {
  bg: '#000000',
  card: '#1c1c1e',
  cardBorder: 'rgba(255,255,255,0.08)',
  text: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.55)',
  overlay: 'rgba(0,0,0,0.65)',
  inputBg: '#2c2c2e',
  accent: '#0a84ff',
  green: '#30d158',
  orange: '#ff9f0a',
  red: '#ff375f',
};

export const lightColors: ThemeColors = {
  bg: '#f2f2f7',
  card: '#ffffff',
  cardBorder: 'rgba(0,0,0,0.06)',
  text: '#000000',
  textSecondary: 'rgba(0,0,0,0.45)',
  overlay: 'rgba(255,255,255,0.65)',
  inputBg: '#e5e5ea',
  accent: '#0a84ff',
  green: '#34c759',
  orange: '#ff9500',
  red: '#ff3b30',
};

export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return { isDark, colors: isDark ? darkColors : lightColors };
}
