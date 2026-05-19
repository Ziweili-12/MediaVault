import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, Dimensions, Animated, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  initDatabase, getVinylStats, getMovieStats, getAllVinyls, getAllMovies,
  getVinylMonthlyData, getMovieMonthlyData,
} from '../database/database';
import { useTheme } from '../theme';
import { extractColors, ColorPalette, createGradientColors } from '../utils/colorExtractor';
import { useDeviceAdaptation, DEVICE } from '../utils/deviceAdapter';
import CalendarMode from '../components/CalendarMode';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_PADDING = DEVICE.IS_SMALL_SCREEN ? 14 : 16;
const RECENT_ITEM_WIDTH = DEVICE.IS_SMALL_SCREEN ? 110 : 120;

export default function HomeScreen({ navigation }: any) {
  const { isDark, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const deviceAdaptation = useDeviceAdaptation();

  const [vinylStats, setVinylStats] = useState<any>({ total: 0, totalSpent: 0, artistCount: 0, avgPrice: 0 });
  const [movieStats, setMovieStats] = useState<any>({ total: 0, movieCount: 0, seriesCount: 0 });
  const [recentVinyls, setRecentVinyls] = useState<any[]>([]);
  const [recentMovies, setRecentMovies] = useState<any[]>([]);
  const [vinylMonthly, setVinylMonthly] = useState<{ month: number; count: number }[]>([]);
  const [movieMonthly, setMovieMonthly] = useState<{ month: number; count: number }[]>([]);
  const [showSpending, setShowSpending] = useState(true);
  const [coverIndex, setCoverIndex] = useState(0);
  const [coverPalette, setCoverPalette] = useState<ColorPalette | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const coverOpacity = useRef(new Animated.Value(1)).current;

  const loadData = useCallback(async () => {
    try {
      await initDatabase();

      const vs: any = await getVinylStats();
      setVinylStats(vs || { total: 0, totalSpent: 0, artistCount: 0, avgPrice: 0 });

      const ms: any = await getMovieStats();
      setMovieStats(ms || { total: 0, movieCount: 0, seriesCount: 0 });

      const vinyls: any[] = await getAllVinyls();
      setRecentVinyls(vinyls.slice(0, 8));

      const movies: any[] = await getAllMovies();
      setRecentMovies(movies.slice(0, 8));

      const vm: any[] = await getVinylMonthlyData(currentYear);
      setVinylMonthly(vm);

      const mm: any[] = await getMovieMonthlyData(currentYear);
      setMovieMonthly(mm);

      // Extract colors from the first cover
      if (vinyls.length > 0 && vinyls[0].cover_url) {
        const palette = await extractColors(vinyls[0].cover_url);
        setCoverPalette(palette);
      }
    } catch (error) {
      console.error('❌ Failed to load stats:', error);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  // Entry animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Cover rotation animation
  useEffect(() => {
    const allCovers = [...recentVinyls.map(v => v.cover_url), ...recentMovies.map(m => m.poster_url)].filter(Boolean);
    if (allCovers.length <= 1) return;

    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(coverOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(coverOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      setCoverIndex(prev => (prev + 1) % allCovers.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [recentVinyls, recentMovies]);

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

  // 本月新增数量
  const thisMonthVinyl = vinylMonthly.find(m => m.month === currentMonth)?.count || 0;
  const thisMonthMovie = movieMonthly.find(m => m.month === currentMonth)?.count || 0;

  // 本月花费（黑胶价格合计）
  const thisMonthSpending = recentVinyls
    .filter(v => {
      const d = v.purchase_date || v.created_at;
      if (!d) return false;
      const month = parseInt(d.substring(5, 7) || '0');
      return month === currentMonth;
    })
    .reduce((sum, v) => sum + (v.price || 0), 0);

  // Build cover wall data: take up to 6 recent items for the 3x2 grid
  const musicWallCovers = recentVinyls.slice(0, 6);
  const movieWallCovers = recentMovies.slice(0, 6);
  const allCovers = [...recentVinyls.map(v => v.cover_url), ...recentMovies.map(m => m.poster_url)].filter(Boolean);
  const currentCover = allCovers[coverIndex];

  // 日历模式记录数据
  const calendarRecords = [
    ...recentVinyls.map(v => ({
      id: v.id,
      date: v.purchase_date || v.created_at?.substring(0, 10) || '',
      type: 'music' as const,
      title: v.album_name,
      coverUrl: v.cover_url,
    })),
    ...recentMovies.map(m => ({
      id: m.id,
      date: m.watch_date || m.created_at?.substring(0, 10) || '',
      type: 'movie' as const,
      title: m.title_cn || m.title,
      coverUrl: m.poster_url,
    })),
  ].filter(r => r.date);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { 
          paddingTop: deviceAdaptation.hasNotch ? insets.top + 8 : 8 
        }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 问候语 - 带入场动画 */}
        <Animated.View style={[
          styles.greetingSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}>
          <Text style={styles.greetingIcon}>{getGreetingIcon()}</Text>
          <Text style={[styles.greeting, { color: colors.text }]}>
            {getGreeting()}
          </Text>
          <Text style={[styles.greetingSub, { color: colors.textSecondary }]}>
            欢迎回来
          </Text>
        </Animated.View>

        {/* 本月速览 */}
        <Animated.View style={[
          styles.monthSummary,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}>
          <View style={styles.monthSummaryHeader}>
            <Text style={[styles.monthSummaryTitle, { color: colors.text }]}>📅 本月速览</Text>
            <TouchableOpacity 
              style={styles.calendarBtn}
              onPress={() => setShowCalendar(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={18} color={colors.accent} />
              <Text style={[styles.calendarBtnText, { color: colors.accent }]}>日历</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.monthSummaryRow}>
            <View style={styles.monthStat}>
              <Text style={[styles.monthStatNum, { color: colors.text }]}>{thisMonthVinyl}</Text>
              <Text style={[styles.monthStatLabel, { color: colors.textSecondary }]}>新唱片</Text>
            </View>
            <View style={[styles.monthDivider, { backgroundColor: colors.cardBorder }]} />
            <View style={styles.monthStat}>
              <Text style={[styles.monthStatNum, { color: colors.text }]}>{thisMonthMovie}</Text>
              <Text style={[styles.monthStatLabel, { color: colors.textSecondary }]}>新影视</Text>
            </View>
            <View style={[styles.monthDivider, { backgroundColor: colors.cardBorder }]} />
            <View style={styles.monthStat}>
              <View style={styles.metricValueWrap}>
                <Text style={[styles.monthStatNum, { color: colors.text }]}>
                  {showSpending ? `¥${thisMonthSpending.toLocaleString()}` : '****'}
                </Text>
                <TouchableOpacity
                  style={styles.eyeToggle}
                  onPress={() => setShowSpending(!showSpending)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showSpending ? 'eye-outline' : 'eye-off-outline'}
                    size={16}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              <Text style={[styles.monthStatLabel, { color: colors.textSecondary }]}>本月花费</Text>
            </View>
          </View>
        </Animated.View>

        {/* 音乐媒体卡片 */}
        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{ translateY: Animated.add(slideAnim, new Animated.Value(10)) }],
        }}>
          <TouchableOpacity
            style={[styles.mediaCard, { borderColor: colors.cardBorder }]}
            onPress={() => navigation.navigate('Music')}
            activeOpacity={0.85}
          >
    {/* 动态封面墙背景 */}
            <View style={[styles.coverWall, { opacity: 0.5 }]}>
              {musicWallCovers.map((item, i) => (
                <Animated.View 
                  key={i} 
                  style={[
                    styles.coverWallCell,
                    {
                      opacity: fadeAnim,
                      transform: [{ 
                        scale: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        })
                      }],
                    }
                  ]}
                >
                  {item.cover_url ? (
                    <Image source={{ uri: item.cover_url, headers: { 'User-Agent': 'MediaVault/1.0' } }} style={styles.coverWallImg} resizeMode="cover" />
                  ) : (
                    <View style={[styles.coverWallPlaceholder, { backgroundColor: colors.inputBg }]} />
                  )}
                </Animated.View>
              ))}
              {Array.from({ length: Math.max(0, 6 - musicWallCovers.length) }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.coverWallCell}>
                  <View style={[styles.coverWallPlaceholder, { backgroundColor: colors.inputBg }]} />
                </View>
              ))}
            </View>
            {/* 半透明遮罩 - 保证文字可读 */}
            <View style={[styles.cardOverlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
            {/* Card content */}
            <View style={styles.cardContent}>
              <View style={styles.cardLeft}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(10,132,255,0.15)' }]}>
                  <Ionicons name="musical-notes" size={20} color="#0a84ff" />
                </View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>音乐</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>我的黑胶收藏</Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={[styles.cardCount, { color: '#0a84ff' }]}>{vinylStats.total}</Text>
                <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>张专辑</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* 影视媒体卡片 */}
        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{ translateY: Animated.add(slideAnim, new Animated.Value(20)) }],
        }}>
          <TouchableOpacity
            style={[styles.mediaCard, { borderColor: colors.cardBorder }]}
            onPress={() => navigation.navigate('Movie')}
            activeOpacity={0.85}
          >
            {/* 动态封面墙背景 */}
            <View style={[styles.coverWall, { opacity: 0.5 }]}>
              {movieWallCovers.slice(0, 3).map((item, i) => (
                <Animated.View 
                  key={i} 
                  style={[
                    styles.movieWallCell,
                    {
                      opacity: fadeAnim,
                      transform: [{ 
                        scale: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        })
                      }],
                    }
                  ]}
                >
                  {item.poster_url ? (
                    <Image source={{ uri: item.poster_url }} style={styles.coverWallImg} resizeMode="cover" />
                  ) : (
                    <View style={[styles.coverWallPlaceholder, { backgroundColor: colors.inputBg }]} />
                  )}
                </Animated.View>
              ))}
              {Array.from({ length: Math.max(0, 3 - movieWallCovers.length) }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.movieWallCell}>
                  <View style={[styles.coverWallPlaceholder, { backgroundColor: colors.inputBg }]} />
                </View>
              ))}
            </View>
            {/* 半透明遮罩 - 保证文字可读 */}
            <View style={[styles.cardOverlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
            {/* Card content */}
            <View style={styles.cardContent}>
              <View style={styles.cardLeft}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(10,132,255,0.15)' }]}>
                  <Ionicons name="film" size={20} color="#0a84ff" />
                </View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>影视</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>电影与剧集</Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={[styles.cardCount, { color: '#0a84ff' }]}>{movieStats.total}</Text>
                <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>部作品</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* 最近添加 — 黑胶 */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>💿 最近添加</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Music')}>
              <Text style={[styles.seeAll, { color: colors.accent }]}>查看全部</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {recentVinyls.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.recentCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                onPress={() => navigation.navigate('Music')}
                activeOpacity={0.8}
              >
                {item.cover_url ? (
                  <Image source={{ uri: item.cover_url, headers: { 'User-Agent': 'MediaVault/1.0' } }} style={styles.recentCover} resizeMode="cover" />
                ) : (
                  <View style={[styles.recentCover, { backgroundColor: colors.inputBg, justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 36 }}>💿</Text>
                  </View>
                )}
                <View style={styles.recentCardInfo}>
                  <Text style={[styles.recentCardTitle, { color: colors.text }]} numberOfLines={2}>{item.album_name}</Text>
                  <Text style={[styles.recentCardSub, { color: colors.textSecondary }]} numberOfLines={1}>{item.artist}</Text>
                  <Text style={[styles.recentCardTag, { color: colors.accent }]} numberOfLines={1}>{item.version || 'Vinyl'}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

  {/* 最近观看 — 影视 */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🎬 最近观看</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Movie')}>
              <Text style={[styles.seeAll, { color: colors.accent }]}>查看全部</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {recentMovies.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.recentCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                onPress={() => navigation.navigate('Movie')}
                activeOpacity={0.8}
              >
                {item.poster_url ? (
                  <Image source={{ uri: item.poster_url }} style={styles.recentPoster} resizeMode="cover" />
                ) : (
                  <View style={[styles.recentPoster, { backgroundColor: colors.inputBg, justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 36 }}>🎬</Text>
                  </View>
                )}
                <View style={styles.recentCardInfo}>
                  <Text style={[styles.recentCardTitle, { color: colors.text }]} numberOfLines={2}>
                    {item.original_title || item.title}
                  </Text>
                  <Text style={[styles.recentCardSub, { color: colors.textSecondary }]} numberOfLines={1}>
                    {item.title}{item.country ? ` · ${item.country}` : ''}{item.year ? ` · ${item.year}` : ''}
                  </Text>
                  <Text style={[styles.recentCardTag, { color: item.type === 'movie' ? colors.accent : colors.orange }]} numberOfLines={1}>
                    {item.type === 'movie' ? '电影' : '剧集'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 日历模式 */}
      {showCalendar && (
        <View style={styles.calendarOverlay}>
          <CalendarMode
            records={calendarRecords}
            onClose={() => setShowCalendar(false)}
            onRecordPress={(record) => {
              setShowCalendar(false);
              if (record.type === 'music') {
                navigation.navigate('Music');
              } else {
                navigation.navigate('Movie');
              }
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  content: { padding: CARD_PADDING },

  // 问候
  greetingSection: { marginBottom: 20, marginTop: 8, position: 'relative' },
  greetingIcon: { fontSize: 28, marginBottom: 4 },
  greeting: { fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },
  greetingSub: { fontSize: 15, marginTop: 2 },
  floatingCover: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingCoverImg: {
    width: '100%',
    height: '100%',
  },

  // 本月速览
  monthSummary: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  monthSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  calendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
  },
  calendarBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  monthSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthStat: {
    flex: 1,
    alignItems: 'center',
  },
  monthStatNum: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  monthStatLabel: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  monthDivider: {
    width: 1,
    height: 32,
  },
  metricValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeToggle: {
    marginLeft: 6,
    padding: 2,
  },

  // 媒体卡片
  mediaCard: {
    height: 200,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 40,
    overflow: 'hidden',
    position: 'relative',
  },
  coverWall: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    flexWrap: 'wrap',
    opacity: 0.2,
  },
  coverWallCell: {
    width: '33.33%',
    height: '50%',
    padding: 1,
  },
  movieWallCell: {
    width: '33.33%',
    height: '100%',
    padding: 1,
  },
  coverWallImg: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  coverWallPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  cardOverlayGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  cardLeft: {},
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  cardCount: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  cardLabel: {
    fontSize: 12,
    marginTop: 2,
  },

  // Section
  recentSection: { marginBottom: 40 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  seeAll: { fontSize: 13, fontWeight: '600' },

  // 最近添加横向列表
  horizontalList: { gap: 10 },
  recentCard: {
    width: RECENT_ITEM_WIDTH,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    flexShrink: 0,
  },
  recentCover: {
    width: RECENT_ITEM_WIDTH,
    height: RECENT_ITEM_WIDTH,
  },
  recentPoster: {
    width: RECENT_ITEM_WIDTH,
    height: RECENT_ITEM_WIDTH * 1.5,
  },
  recentCardInfo: {
    padding: 8,
  },
  recentCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  recentCardSub: {
    fontSize: 10,
    marginTop: 2,
  },
  recentCardTag: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 3,
  },
  calendarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 100,
  },
});
