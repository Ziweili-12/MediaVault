import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import MusicScreen from '../screens/MusicScreen';
import MovieScreen from '../screens/MovieScreen';
import StatsScreen from '../screens/StatsScreen';

const Tab = createBottomTabNavigator();

export default function Navigation() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: '#1c1c1e',
            borderTopColor: 'rgba(255,255,255,0.08)',
            height: 83,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#0a84ff',
          tabBarInactiveTintColor: 'rgba(255,255,255,0.3)',
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
