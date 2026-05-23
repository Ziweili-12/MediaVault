import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Navigation from './src/navigation/AppNavigator';
import { initDatabase } from './src/database/database';
import { ThemeProvider } from './src/components/ThemeProvider';
import { useTheme } from './src/theme';
import * as SplashScreen from 'expo-splash-screen';

// 防止启动画面自动隐藏
SplashScreen.preventAutoHideAsync();

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
  const [appReady, setAppReady] = React.useState(false);

  React.useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
        console.log('✅ App initialized');
        // 延迟 1.5 秒后隐藏启动画面
        await new Promise(resolve => setTimeout(resolve, 1500));
        await SplashScreen.hideAsync();
        setAppReady(true);
      } catch (error) {
        console.error('❌ App initialization failed:', error);
        await SplashScreen.hideAsync();
        setAppReady(true);
      }
    };

    init();
  }, []);

  if (!appReady) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
