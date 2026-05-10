import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  useColorScheme, Image, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { initDatabase, getVinylStats, getMovieStats, getAllVinyls, getAllMovies } from '../database/database';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_HEIGHT = 200;
const COVER_SIZE = (SCREEN_WIDTH - 32) / 3;

// ============ 颜色方案 ============
const themes = {
  dark: {
    bg: '#000000',
    card: '#1c1c1e',
    cardBorder: 'rgba(255,255,255,0.08)',
    text: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.55)',
    overlay: 'rgba(0,0,0,0.65)',
    tabBar: '#1c1c1e',
    tabBorder: 'rgba(255,255,255,0.08)',
  },
  light: {
    bg: '#f2f2f7',
    card: '#ffffff',
    cardBorder: 'rgba(0,0,0,0.06)',
    text: '#000000',
    textSecondary: 'rgba(0,0,0,0.45)',
    overlay: 'rgba(255,255,255,0.65)',
    tabBar: '#ffffff',
    tabBorder: 'rgba(0,0,0,0.06)',
  },
};

export default function HomeScreen({ navigation }: any) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = isDark ? themes.dark : themes.light;

  const [vinylStats, setVinylStats] = useState({ total: 0 });
  const [movieStats, setMovieStats] = useState({ total: 0 });
  const [recentVinyls, setRecentVinyls] = useState<any[]>([]);
  const [recentMovies, setRecentMovies] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      await initDatabase();

      const vs: any = await getVinylStats();
      setVinylStats({ total: vs.total || 0 });

      const ms: any = await getMovieStats();
      setMovieStats({ total: ms.total || 0 });

      // 加载最近9个封面/海报作为背景墙
      const vinyls: any[] = await getAllVinyls();
      setRecentVinyls(vinyls.slice(0, 9));

      const movies: any[] = await getAllMovies();
      setRecentMovies(movies.slice(0, 9));
    } catch (error) {
      console.error('❌ Failed to load stats:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 每次回到首页刷新数据
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 12) return '早上好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  const getGreetingIcon = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '🌙';
    if (hour < 18) return '☀️';
    return '🌙';
  };

  // 渲染封面网格背景
  const renderCoverWall = (covers: any[], type: 'vinyl' | 'movie') => {
    if (covers.length === 0) return null;

    return (
      <View style={[styles.coverGrid, { width: SCREEN_WIDTH - 32, opacity: 0.25 }]}>
        {covers.map((item, index) => (
          <View key={index} style={styles.coverCell}>
            {item.cover_url || item.poster_url ? (
              <Image
                source={{ uri: item.cover_url || item.poster_url }}
                style={[
                  styles.coverImage,
                  type === 'movie' && { aspectRatio: 2 / 3 },
                ]}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.coverPlaceholder, { backgroundColor: colors.card }]}>
                <Ionicons
                  name={type === 'vinyl' ? 'disc' : 'film'}
                  size={24}
                  color={colors.textSecondary}
                />
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 问候语 */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingIcon}>{getGreetingIcon()}</Text>
          <Text style={[styles.greeting, { color: colors.text }]}>
            {getGreeting()}
          </Text>
          <Text style={[styles.greetingSub, { color: colors.textSecondary }]}>
            欢迎回来
          </Text>
        </View>

        {/* 音乐卡片 — 封面墙背景 */}
        <TouchableOpacity
          style={[styles.mediaCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={() => navigation.navigate('Music')}
          activeOpacity={0.85}
        >
          {recentVinyls.length > 0 ? (
            <View style={styles.cardCoverWall}>
              {renderCoverWall(recentVinyls, 'vinyl')}
              <View style={[styles.cardOverlay, { backgroundColor: colors.overlay }]} />
            </View>
          ) : (
            <View style={[styles.cardOverlay, { backgroundColor: colors.overlay }]} />
          )}
          <View style={styles.cardContent}>
            <View style={styles.cardLeft}>
              <View style={styles.cardIconRow}>
                <View style={[styles.iconCircle, { backgroundColor: '#0a84ff20' }]}>
                  <Ionicons name="musical-notes" size={22} color="#0a84ff" />
                </View>
              </View>
              <Text style={styles.cardTitle}>音乐</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                我的黑胶收藏
              </Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={[styles.cardCount, { color: '#0a84ff' }]}>
                {vinylStats.total}
              </Text>
              <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
                张专辑
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* 影视卡片 — 海报墙背景 */}
        <TouchableOpacity
          style={[styles.mediaCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={() => navigation.navigate('Movie')}
          activeOpacity={0.85}
        >
          {recentMovies.length > 0 ? (
            <View style={styles.cardCoverWall}>
              {renderCoverWall(recentMovies, 'movie')}
              <View style={[styles.cardOverlay, { backgroundColor: colors.overlay }]} />
            </View>
          ) : (
            <View style={[styles.cardOverlay, { backgroundColor: colors.overlay }]} />
          )}
          <View style={styles.cardContent}>
            <View style={styles.cardLeft}>
              <View style={styles.cardIconRow}>
                <View style={[styles.iconCircle, { backgroundColor: '#30d15820' }]}>
                  <Ionicons name="film" size={22} color="#30d158" />
                </View>
              </View>
              <Text style={styles.cardTitle}>影视</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                电影与剧集
              </Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={[styles.cardCount, { color: '#30d158' }]}>
                {movieStats.total}
              </Text>
              <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
                部作品
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* 统计入口 — 简洁版 */}
        <TouchableOpacity
          style={[
            styles.statsCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
          onPress={() => navigation.navigate('Stats')}
          activeOpacity={0.85}
        >
          <View style={styles.statsCardRow}>
            <View style={[styles.iconCircle, { backgroundColor: '#ff9f0a20' }]}>
              <Ionicons name="stats-chart" size={20} color="#ff9f0a" />
            </View>
            <View style={styles.statsCardText}>
              <Text style={[styles.statsCardTitle, { color: colors.text }]}>
                数据统计
              </Text>
              <Text style={[styles.statsCardSub, { color: colors.textSecondary }]}>
                查看详细的分析报告
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  // ===== 问候语 =====
  greetingSection: {
    marginBottom: 28,
    marginTop: 8,
  },
  greetingIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  greetingSub: {
    fontSize: 15,
    fontWeight: '400',
    marginTop: 2,
  },

  // ===== 媒体卡片 =====
  mediaCard: {
    height: CARD_HEIGHT,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  cardCoverWall: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    overflow: 'hidden',
  },
  coverGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  coverCell: {
    width: COVER_SIZE,
    height: COVER_SIZE,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 20,
  },
  cardLeft: {
    flex: 1,
  },
  cardIconRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
    marginBottom: 4,
    // 海报背景上白色文字更清晰
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  cardCount: {
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1.5,
    lineHeight: 48,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: -2,
  },

  // ===== 统计卡片 =====
  statsCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginTop: 6,
  },
  statsCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsCardText: {
    flex: 1,
    marginLeft: 12,
  },
  statsCardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsCardSub: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 2,
  },
});
