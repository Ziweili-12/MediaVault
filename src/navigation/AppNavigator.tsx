import React from 'react';
import { useColorScheme } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import MusicScreen from '../screens/MusicScreen';
import MovieScreen from '../screens/MovieScreen';
import StatsScreen from '../screens/StatsScreen';

const Tab = createBottomTabNavigator();

const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#f2f2f7',
    card: '#ffffff',
    text: '#000000',
    border: 'rgba(0,0,0,0.06)',
    primary: '#0a84ff',
  },
};

const DarkNavTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#000000',
    card: '#1c1c1e',
    text: '#ffffff',
    border: 'rgba(255,255,255,0.08)',
    primary: '#0a84ff',
  },
};

export default function Navigation() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <NavigationContainer theme={isDark ? DarkNavTheme : LightTheme}>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
            borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            height: 83,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#0a84ff',
          tabBarInactiveTintColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)',
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '500',
          },
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
            tabBarLabel: '首页',
          }}
        />
        <Tab.Screen
          name="Music"
          component={MusicScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="musical-notes" size={size} color={color} />
            ),
            tabBarLabel: '音乐',
          }}
        />
        <Tab.Screen
          name="Movie"
          component={MovieScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="film" size={size} color={color} />
            ),
            tabBarLabel: '影视',
          }}
        />
        <Tab.Screen
          name="Stats"
          component={StatsScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="stats-chart" size={size} color={color} />
            ),
            tabBarLabel: '统计',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
