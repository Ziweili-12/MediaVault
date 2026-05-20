import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Navigation from './src/navigation/AppNavigator';
import { initDatabase } from './src/database/database';
import { ThemeProvider } from './src/components/ThemeProvider';
import { useTheme } from './src/theme';

function AppContent() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Navigation />
    </>
  );
}

export default function App() {
  // 初始化数据库
  React.useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
        console.log('✅ App initialized');
      } catch (error) {
        console.error('❌ App initialization failed:', error);
      }
    };

    init();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
