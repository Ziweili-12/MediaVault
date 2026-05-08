import React from 'react';
import { StatusBar } from 'expo-status-bar';
import Navigation from './src/navigation/AppNavigator';
import { initDatabase } from './src/database/database';

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
    <>
      <StatusBar style="light" />
      <Navigation />
    </>
  );
}
