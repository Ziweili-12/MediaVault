import React from 'react';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Navigation from './src/navigation/AppNavigator';
import { initDatabase } from './src/database/database';

export default function App() {
  const scheme = useColorScheme();

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
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Navigation />
    </SafeAreaProvider>
  );
}
