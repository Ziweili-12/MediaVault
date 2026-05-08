import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { initDatabase, getVinylStats, getMovieStats } from '../database/database';

export default function HomeScreen({ navigation }: any) {
  const [vinylCount, setVinylCount] = useState(0);
  const [movieCount, setMovieCount] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      await initDatabase();
      
      const vinylStats: any = await getVinylStats();
      setVinylCount(vinylStats.total || 0);
      setTotalSpent(vinylStats.totalSpent || 0);

      const movieStats: any = await getMovieStats();
      setMovieCount(movieStats.total || 0);
    } catch (error) {
      console.error('❌ Failed to load stats:', error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了 🌙';
    if (hour < 12) return '早上好 ☀️';
    if (hour < 14) return '中午好 🍜';
    if (hour < 18) return '下午好 🌤️';
    return '晚上好 🌙';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>{getGreeting()}</Text>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Music')}
        activeOpacity={0.8}
      >
        <Text style={styles.emoji}>🎵</Text>
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>音乐</Text>
            <Text style={styles.cardSubtitle}>我的黑胶收藏</Text>
          </View>
          <Text style={[styles.cardCount, { color: '#0a84ff' }]}>{vinylCount}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Movie')}
        activeOpacity={0.8}
      >
        <Text style={styles.emoji}>🎬</Text>
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>影视</Text>
            <Text style={styles.cardSubtitle}>电影与剧集</Text>
          </View>
          <Text style={[styles.cardCount, { color: '#30d158' }]}>{movieCount}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Stats')}
        activeOpacity={0.8}
      >
        <Text style={styles.emoji}>📊</Text>
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>统计</Text>
            <Text style={styles.cardSubtitle}>数据概览与分析</Text>
          </View>
          <Text style={[styles.cardCount, { color: '#ff9f0a' }]}>2</Text>
        </View>
      </TouchableOpacity>

      {/* 预算卡片 */}
      <View style={[styles.card, { marginTop: 20 }]}>
        <Text style={styles.emoji}>💰</Text>
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>总花费</Text>
            <Text style={styles.cardSubtitle}>黑胶收藏投资</Text>
          </View>
          <Text style={[styles.cardCount, { color: '#ff375f' }]}>¥{totalSpent.toFixed(0)}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 24,
    marginTop: 8,
    letterSpacing: -0.5,
  },
  card: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 22,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  emoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '400',
  },
  cardCount: {
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1.5,
    lineHeight: 48,
  },
});
