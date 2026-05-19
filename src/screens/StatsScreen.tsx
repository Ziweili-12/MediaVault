import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
  getAllVinyls, getAllMovies,
  getVinylStatsFiltered, getMovieStatsFiltered,
  getVinylMonthlyData, getMovieMonthlyData,
} from '../database/database';
import type { Vinyl, Movie } from '../database/schema';
import { useTheme } from '../theme';
import { DEVICE } from '../utils/deviceAdapter';
import ArtistDetailModal from './modals/ArtistDetailModal';
import VinylDetailModal from './modals/VinylDetailModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_PADDING = DEVICE.IS_SMALL_SCREEN ? 14 : 16;
const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const CHART_COLORS = [
  '#0a84ff', '#30b5ff', '#64d2ff', '#5e5ce6', '#bf9af0',
  '#30d158', '#6ee08a', '#ff9f0a', '#ffb340', '#ff375f', '#ff6b8a', '#ffd60a',
];
const CURRENT_MONTH = new Date().getMonth() + 1;

export default function StatsScreen() {
  const { isDark, colors } = useTheme();
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState<'music' | 'movie'>('music');
  const [yearFilter, setYearFilter] = useState<string>('全部');

  // Raw data
  const [allVinyls, setAllVinyls] = useState<Vinyl[]>([]);
  const [allMovies, setAllMovies] = useState<Movie[]>([]);

  // Music stats
  const [vinylStats, setVinylStats] = useState<any>(null);
  const [musicMonthly, setMusicMonthly] = useState<{ month: number; count: number }[]>([]);

  // Movie stats
  const [movieStats, setMovieStats] = useState<any>(null);
  const [movieMonthly, setMovieMonthly] = useState<{ month: number; count: number }[]>([]);
  const [movieChartType, setMovieChartType] = useState<'all' | 'movie' | 'series'>('all');

  // Eye toggle for spend amount
  const [showAmount, setShowAmount] = useState(true);

  // Tapped month for tooltip
  const [tappedMonth, setTappedMonth] = useState<number | null>(null);

  // Artist detail modal
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [showArtistModal, setShowArtistModal] = useState(false);

  // Vinyl detail modal (from artist detail)
  const [selectedVinyl, setSelectedVinyl] = useState<Vinyl | null>(null);
  const [showVinylDetail, setShowVinylDetail] = useState(false);

  const selectedYear = yearFilter === '全部' ? undefined : parseInt(yearFilter);

  // Compute year options from actual data
  const yearOptions = useMemo(() => {
    const years = new Set<string>();
    allVinyls.forEach(v => {
      if (v.purchase_date) years.add(v.purchase_date.substring(0, 4));
    });
    allMovies.forEach(m => {
      if (m.watch_date) years.add(m.watch_date.substring(0, 4));
    });
    if (years.size === 0) return [];
    const sorted = Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
    return ['全部', ...sorted];
  }, [allVinyls, allMovies]);

  // Load all data
  const loadData = useCallback(async () => {
    try {
      const [vinyls, movies] = await Promise.all([getAllVinyls(), getAllMovies()]);
      setAllVinyls(vinyls);
      setAllMovies(movies);
    } catch (e) {
      console.error('Failed to load data:', e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 每次页面获得焦点时刷新数据
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  // Reload stats when year or tab changes
  useEffect(() => {
    loadStats();
  }, [yearFilter, activeTab, allVinyls, allMovies]);

  // Reload movie monthly when filter type changes
  useEffect(() => {
    if (activeTab === 'movie') loadMovieMonthly();
  }, [movieChartType, yearFilter, activeTab]);

  const loadStats = async () => {
    try {
      if (activeTab === 'music') {
        const stats = await getVinylStatsFiltered(selectedYear);
        setVinylStats(stats);
        const monthly = await getVinylMonthlyData(selectedYear);
        // Ensure 12 months
        const filled = MONTH_NAMES.map((_, i) => {
          const found = monthly.find((m: any) => m.month === i + 1);
          return { month: i + 1, count: found ? found.count : 0 };
        });
        setMusicMonthly(filled);
      } else {
        const stats = await getMovieStatsFiltered(selectedYear);
        setMovieStats(stats);
        await loadMovieMonthly();
      }
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  };

  const loadMovieMonthly = async () => {
    try {
      const monthly = await getMovieMonthlyData(selectedYear);
      // For sub-tabs, we need to filter from raw data
      const filtered = yearFilter === '全部' ? allMovies : allMovies.filter(m => {
        const raw = m.watch_date || m.created_at;
        if (!raw) return false;
        // 兼容 YYYYMMDD 和 YYYY-MM-DD
        const year = raw.length === 8 && !raw.includes('-') ? raw.substring(0, 4) : raw.substring(0, 4);
        return year === yearFilter;
      });

      const typeFiltered = movieChartType === 'all'
        ? filtered
        : filtered.filter(m => m.type === movieChartType);

      // Compute monthly from filtered
      const monthCounts: Record<number, { all: number; movie: number; series: number }> = {};
      MONTH_NAMES.forEach((_, i) => { monthCounts[i + 1] = { all: 0, movie: 0, series: 0 }; });

      typeFiltered.forEach(m => {
        if (!m.watch_date) return;
        const d = new Date(m.watch_date);
        const mo = d.getMonth() + 1;
        monthCounts[mo].all++;
        if (m.type === 'movie') monthCounts[mo].movie++;
        else monthCounts[mo].series++;
      });

      const filled = MONTH_NAMES.map((_, i) => {
        const mc = monthCounts[i + 1];
        return {
          month: i + 1,
          count: movieChartType === 'all' ? mc.all : movieChartType === 'movie' ? mc.movie : mc.series,
          movieCount: mc.movie,
          seriesCount: mc.series,
        };
      });
      setMovieMonthly(filled as any);
    } catch (e) {
      console.error('Failed to load movie monthly:', e);
    }
  };

  // Computed groupings from raw data
  const filteredVinyls = useMemo(() => {
    if (yearFilter === '全部') return allVinyls;
    return allVinyls.filter(v => {
      if (!v.purchase_date) return false;
      return v.purchase_date.startsWith(yearFilter);
    });
  }, [allVinyls, yearFilter]);

  const filteredMovies = useMemo(() => {
    if (yearFilter === '全部') return allMovies;
    return allMovies.filter(m => {
      if (!m.watch_date) return false;
      return m.watch_date.startsWith(yearFilter);
    });
  }, [allMovies, yearFilter]);

  // Monthly spending from filtered vinyls
  const monthlySpending = useMemo(() => {
    const spending: Record<number, number> = {};
    MONTH_NAMES.forEach((_, i) => { spending[i + 1] = 0; });
    filteredVinyls.forEach(v => {
      const raw = v.purchase_date || v.created_at;
      if (!raw) return;
      const d = new Date(raw);
      const mo = d.getMonth() + 1;
      spending[mo] = (spending[mo] || 0) + (v.price || 0);
    });
    return spending;
  }, [filteredVinyls]);

  const maxSpending = useMemo(() => {
    const vals = Object.values(monthlySpending);
    return Math.max(...vals, 1);
  }, [monthlySpending]);

  // Genre count for music
  const genreCount = useMemo(() => {
    const genres = new Set(filteredVinyls.map(v => v.genre).filter(Boolean));
    return genres.size;
  }, [filteredVinyls]);

  // Movie avg rating
  const avgRating = useMemo(() => {
    const rated = filteredMovies.filter(m => m.personal_rating != null);
    if (rated.length === 0) return '-';
    const avg = rated.reduce((s, m) => s + (m.personal_rating || 0), 0) / rated.length;
    return avg.toFixed(1);
  }, [filteredMovies]);

  // Top release years (music) — 使用数据库中的 year 字段
  const topReleaseYears = useMemo(() => {
    const yearMap: Record<string, number> = {};
    filteredVinyls.forEach(v => {
      const yr = v.year ? String(v.year) : (v.release_date ? v.release_date.substring(0, 4) : null);
      if (yr) yearMap[yr] = (yearMap[yr] || 0) + 1;
    });
    return Object.entries(yearMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([year, count]) => ({ year, count }));
  }, [filteredVinyls]);

  // Top artists (music)
  const topArtists = useMemo(() => {
    const artistMap: Record<string, number> = {};
    filteredVinyls.forEach(v => {
      if (v.artist) artistMap[v.artist] = (artistMap[v.artist] || 0) + 1;
    });
    return Object.entries(artistMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [filteredVinyls]);

  // Movie release years
  const topMovieYears = useMemo(() => {
    const yearMap: Record<number, number> = {};
    filteredMovies.forEach(m => {
      if (m.year) yearMap[m.year] = (yearMap[m.year] || 0) + 1;
    });
    return Object.entries(yearMap)
      .map(([yr, cnt]) => ({ year: yr, count: cnt }))
      .sort((a, b) => parseInt(a.year) - parseInt(b.year));
  }, [filteredMovies]);

  // Top directors — 拆分 / 分隔的多导演
  const topDirectors = useMemo(() => {
    const dirMap: Record<string, number> = {};
    filteredMovies.forEach(m => {
      if (m.director) {
        // 支持 / 和 , 分隔
        const dirs = m.director.split(/[\/,]/).map((d: string) => d.trim()).filter(Boolean);
        dirs.forEach((d: string) => {
          dirMap[d] = (dirMap[d] || 0) + 1;
        });
      }
    });
    return Object.entries(dirMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [filteredMovies]);

  // Vinyls for the selected artist
  const artistVinyls = useMemo(() => {
    if (!selectedArtist) return [];
    return filteredVinyls.filter(v => v.artist === selectedArtist);
  }, [filteredVinyls, selectedArtist]);

  // Current month monthly data for bar chart display
  const musicMax = Math.max(...musicMonthly.map(m => m.count), 1);

  // Render ranked list component
  const renderRankedList = (
    items: { label: string; count: number }[],
    maxCount?: number,
    onPressItem?: (label: string) => void
  ) => {
    if (items.length === 0) {
      return (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>暂无数据</Text>
      );
    }
    const mx = maxCount ?? Math.max(...items.map(i => i.count), 1);
    return (
      <View style={styles.topList}>
        {items.map((item, i) => {
          const rank = i + 1;
          const rankBg = rank === 1 ? '#ffd60a' : rank === 2 ? '#a0a0a0' : rank === 3 ? '#cd7f32' : colors.inputBg;
          const rankColor = rank <= 1 ? '#000' : rank <= 3 ? '#fff' : colors.textSecondary;
          const barColor = CHART_COLORS[i % CHART_COLORS.length];
          const Wrapper = onPressItem ? TouchableOpacity : View;
          const wrapperProps = onPressItem
            ? { activeOpacity: 0.6, onPress: () => onPressItem(item.label) }
            : {};
          return (
            <Wrapper key={item.label + i} style={styles.topRow} {...wrapperProps}>
              <View style={[styles.rankBadge, { backgroundColor: rankBg }]}>
                <Text style={[styles.rankText, { color: rankColor }]}>{rank}</Text>
              </View>
              <Text style={[styles.topName, { color: colors.text }]} numberOfLines={1}>
                {item.label}
              </Text>
              <View style={[styles.barTrack, { backgroundColor: colors.inputBg }]}>
                <View style={[styles.barFill, { width: `${(item.count / mx) * 100}%`, backgroundColor: barColor }]} />
              </View>
              <Text style={[styles.topCount, { color: colors.textSecondary }]}>{item.count}</Text>
              {onPressItem && <Text style={{ fontSize: 14, color: colors.textSecondary }}>›</Text>}
            </Wrapper>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>统计</Text>

        {/* Top Tabs: 音乐 / 影视 */}
        <View style={styles.statsTabs}>
          {(['music', 'movie'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.statsTabPill,
                {
                  backgroundColor: activeTab === tab ? colors.accent : colors.inputBg,
                },
              ]}
              onPress={() => { setActiveTab(tab); setYearFilter('全部'); setShowAmount(true); setMovieChartType('all'); }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.statsTabText,
                { color: activeTab === tab ? '#fff' : colors.textSecondary },
              ]}>
                {tab === 'music' ? '🎵 音乐' : '🎬 影视'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Year Filter - only show when data exists */}
        {yearOptions.length > 1 && (
          <View style={styles.yearFilterRow}>
            {yearOptions.map((year) => (
              <TouchableOpacity
                key={year}
                style={[
                  styles.yearPill,
                  { backgroundColor: yearFilter === year ? colors.accent : colors.inputBg },
                ]}
                onPress={() => setYearFilter(year)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.yearPillText,
                  { color: yearFilter === year ? '#fff' : colors.textSecondary },
                ]}>
                  {year}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ============ MUSIC STATS ============ */}
        {activeTab === 'music' && (
          <>
            {/* 4 Metric Cards */}
            <View style={styles.metricGrid}>
              <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {vinylStats?.total ?? 0}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>总收藏</Text>
              </View>

              <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <View style={styles.amountRow}>
                  <Text style={[styles.metricValue, { color: colors.text }]}>
                    {showAmount ? `¥${(vinylStats?.totalSpent ?? 0).toLocaleString()}` : '¥••••'}
                  </Text>
                  <TouchableOpacity onPress={() => setShowAmount(!showAmount)} style={styles.eyeBtn}>
                    <Ionicons
                      name={showAmount ? 'eye-outline' : 'eye-off-outline'}
                      size={18}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>总花费</Text>
              </View>

              <TouchableOpacity style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]} onPress={() => { setShowArtistModal(true); setSelectedArtist(null); }}>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {vinylStats?.artistCount ?? 0}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>艺术家数 ▸</Text>
              </TouchableOpacity>

              <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {genreCount}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>流派数</Text>
              </View>
            </View>

            {/* Monthly Purchase Trend Bar Chart with spending overlay */}
            <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>月度购买趋势</Text>
              {musicMonthly.every(m => m.count === 0) ? (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>该时间范围内暂无购买记录</Text>
              ) : (
                <View style={styles.barChartRow}>
                  {musicMonthly.map((item, i) => {
                    const isCurrentMonth = item.month === CURRENT_MONTH;
                    const barH = (item.count / musicMax) * 100;
                    const barBg = isCurrentMonth ? colors.accent : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)');
                    const spending = monthlySpending[item.month] || 0;
                    const isTapped = tappedMonth === item.month;
                    return (
                      <TouchableOpacity
                        key={item.month}
                        style={styles.barCol}
                        activeOpacity={0.7}
                        onPress={() => setTappedMonth(isTapped ? null : item.month)}
                      >
                        <View style={styles.barColInner}>
                          {/* Orange spending dot */}
                          {spending > 0 && (
                            <View style={[styles.spendingDot, {
                              bottom: `${Math.max((spending / maxSpending) * 90, 8)}%`,
                              backgroundColor: '#ff9f0a',
                            }]} />
                          )}
                          <View style={[styles.bar, {
                            height: `${Math.max(barH, item.count > 0 ? 6 : 2)}%`,
                            backgroundColor: barBg,
                            borderRadius: 3,
                          }]} />
                        </View>
                        <Text style={[styles.barMonthLabel, { color: colors.textSecondary }]}>
                          {selectedYear ? `${selectedYear}年${MONTH_NAMES[i]}` : MONTH_NAMES[i]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  {/* Spending connecting line overlay */}
                  <View style={styles.barChartOverlay} pointerEvents="none">
                    {musicMonthly.map((item, i) => {
                      const spending = monthlySpending[item.month] || 0;
                      const dotH = maxSpending > 0 ? (spending / maxSpending) * 90 : 0;
                      return (
                        <View key={item.month} style={styles.barCol}>
                          <View style={styles.barColInner}>
                            {spending > 0 && (
                              <View style={[styles.spendingLinePoint, {
                                bottom: `${Math.max(dotH, 8)}%`,
                              }]} />
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
              {/* Month detail indicator card */}
              {(() => {
                if (!tappedMonth) {
                  return (
                    <View style={[styles.monthDetailCard, { borderColor: colors.cardBorder }]}>
                      <Text style={[styles.monthDetailHint, { color: colors.textSecondary }]}>点击柱子查看详情</Text>
                    </View>
                  );
                }
                const monthData = musicMonthly.find(m => m.month === tappedMonth);
                const spending = monthlySpending[tappedMonth] || 0;
                return (
                  <View style={[styles.monthDetailCard, { borderColor: colors.accent }]}>
                    <Text style={[styles.monthDetailTitle, { color: colors.text }]}>{tappedMonth}月</Text>
                    <View style={styles.monthDetailRow}>
                      <Text style={[styles.monthDetailMetric, { color: colors.text }]}>
                        数量: <Text style={{ fontWeight: '800' }}>{monthData?.count ?? 0}张</Text>
                      </Text>
                      <Text style={[styles.monthDetailMetric, { color: colors.text }]}>
                        花费: <Text style={{ fontWeight: '800' }}>¥{spending.toLocaleString()}</Text>
                      </Text>
                    </View>
                  </View>
                );
              })()}
            </View>

            {/* 发行年份 TOP */}
            <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>发行年份 TOP</Text>
              {renderRankedList(topReleaseYears.map(i => ({ label: i.year, count: i.count })))}
            </View>

            {/* 艺术家 TOP */}
            <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>艺术家 TOP</Text>
              {renderRankedList(
                topArtists.map(i => ({ label: i.name, count: i.count })),
                undefined,
                (artistName) => { setSelectedArtist(artistName); setShowArtistModal(true); }
              )}
            </View>
          </>
        )}

        {/* ============ MOVIE STATS ============ */}
        {activeTab === 'movie' && (
          <>
            {/* 4 Metric Cards */}
            <View style={styles.metricGrid}>
              <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {movieStats?.total ?? 0}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>总观影</Text>
              </View>

              <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {movieStats?.movieCount ?? 0}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>电影</Text>
              </View>

              <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {movieStats?.seriesCount ?? 0}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>剧集</Text>
              </View>

              <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {avgRating}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>均分</Text>
              </View>
            </View>

            {/* Monthly Viewing Trend */}
            <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>月度观影趋势</Text>

              {/* Sub-tabs */}
              <View style={styles.movieChartTabs}>
                {(['all', 'movie', 'series'] as const).map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.movieChartTab,
                      { backgroundColor: movieChartType === tab ? colors.accent : colors.inputBg },
                    ]}
                    onPress={() => setMovieChartType(tab)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.movieChartTabText,
                      { color: movieChartType === tab ? '#fff' : colors.textSecondary },
                    ]}>
                      {tab === 'all' ? '全部' : tab === 'movie' ? '电影' : '剧集'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {movieMonthly.length === 0 || (movieMonthly as any[]).every((m: any) => m.count === 0 && m.movieCount === 0 && m.seriesCount === 0) ? (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>该时间范围内暂无观看记录</Text>
              ) : (
                <>
                  <View style={styles.barChartRow}>
                    {(movieMonthly as any[]).map((item: any, i: number) => {
                      const total = item.movieCount + item.seriesCount;
                      const maxVal = Math.max(...(movieMonthly as any[]).map((m: any) => m.movieCount + m.seriesCount), 1);
                      const movieH = maxVal > 0 ? (item.movieCount / maxVal) * 80 : 0;
                      const seriesH = maxVal > 0 ? (item.seriesCount / maxVal) * 80 : 0;
                      const isCurrentMonth = item.month === CURRENT_MONTH;
                      const movieColor = isCurrentMonth ? '#3b82f6' : (isDark ? 'rgba(59,130,246,0.6)' : 'rgba(59,130,246,0.5)');
                      const seriesColor = isCurrentMonth ? '#f97316' : (isDark ? 'rgba(249,115,22,0.6)' : 'rgba(249,115,22,0.5)');
                      const isTapped = tappedMonth === item.month;
                      return (
                        <TouchableOpacity
                          key={item.month}
                          style={styles.barCol}
                          activeOpacity={0.7}
                          onPress={() => setTappedMonth(isTapped ? null : item.month)}
                        >
                          <View style={styles.barColInner}>
                            {/* TV series bar (orange, top) */}
                            {item.seriesCount > 0 && (
                              <View style={[styles.stackedBar, {
                                height: `${seriesH}%`,
                                backgroundColor: seriesColor,
                                borderTopLeftRadius: 3,
                                borderTopRightRadius: item.movieCount === 0 ? 3 : 0,
                              }]} />
                            )}
                            {/* Movie bar (blue, bottom) */}
                            {item.movieCount > 0 && (
                              <View style={[styles.stackedBar, {
                                height: `${movieH}%`,
                                backgroundColor: movieColor,
                                borderBottomLeftRadius: 3,
                                borderBottomRightRadius: 3,
                                borderTopLeftRadius: item.seriesCount === 0 ? 3 : 0,
                                borderTopRightRadius: item.seriesCount === 0 ? 3 : 0,
                              }]} />
                            )}
                          </View>
                          <Text style={[styles.barMonthLabel, { color: colors.textSecondary }]}>
                            {selectedYear ? `${selectedYear}年${MONTH_NAMES[i]}` : MONTH_NAMES[i]}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {/* Movie month detail indicator card */}
                  {(() => {
                    if (!tappedMonth) {
                      return (
                        <View style={[styles.monthDetailCard, { borderColor: colors.cardBorder }]}>
                          <Text style={[styles.monthDetailHint, { color: colors.textSecondary }]}>点击柱子查看详情</Text>
                        </View>
                      );
                    }
                    const monthData = (movieMonthly as any[]).find((m: any) => m.month === tappedMonth);
                    return (
                      <View style={[styles.monthDetailCard, { borderColor: '#3b82f6' }]}>
                        <Text style={[styles.monthDetailTitle, { color: colors.text }]}>{tappedMonth}月</Text>
                        <View style={styles.monthDetailRow}>
                          <Text style={[styles.monthDetailMetric, { color: '#3b82f6' }]}>
                            电影: <Text style={{ fontWeight: '800' }}>{monthData?.movieCount ?? 0}部</Text>
                          </Text>
                          <Text style={[styles.monthDetailMetric, { color: '#f97316' }]}>
                            剧集: <Text style={{ fontWeight: '800' }}>{monthData?.seriesCount ?? 0}部</Text>
                          </Text>
                          <Text style={[styles.monthDetailMetric, { color: colors.text }]}>
                            共计: <Text style={{ fontWeight: '800' }}>{(monthData?.movieCount ?? 0) + (monthData?.seriesCount ?? 0)}部</Text>
                          </Text>
                        </View>
                      </View>
                    );
                  })()}
                  {/* 图例 */}
                  <View style={styles.movieChartLegend}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
                      <Text style={[styles.legendText, { color: colors.textSecondary }]}>电影</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#f97316' }]} />
                      <Text style={[styles.legendText, { color: colors.textSecondary }]}>剧集</Text>
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* 发行年份 TOP */}
            <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>发行年份 TOP</Text>
              {renderRankedList(topMovieYears.map(i => ({ label: i.year, count: i.count })))}
            </View>

            {/* 导演 TOP */}
            <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>导演 TOP</Text>
              {renderRankedList(topDirectors.map(i => ({ label: i.name, count: i.count })))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Artist Detail Modal */}
      <ArtistDetailModal
        visible={showArtistModal}
        artistName={selectedArtist || ''}
        vinyls={artistVinyls}
        artists={topArtists}
        onClose={() => { setShowArtistModal(false); setSelectedArtist(null); }}
        onVinylPress={(vinyl) => {
          setShowArtistModal(false);
          setSelectedVinyl(vinyl);
          setShowVinylDetail(true);
        }}
        onArtistPress={(name) => setSelectedArtist(name)}
      />

      {/* Vinyl Detail Modal (opened from artist detail) */}
      <VinylDetailModal
        visible={showVinylDetail}
        vinyl={selectedVinyl}
        onClose={() => { setShowVinylDetail(false); setSelectedVinyl(null); }}
        onDelete={() => { setShowVinylDetail(false); setSelectedVinyl(null); }}
        onUpdate={() => { loadData(); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: CHART_PADDING, paddingBottom: 100 },
  headerTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3, marginBottom: 20 },

  // Top pill tabs
  statsTabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statsTabPill: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20,
  },
  statsTabText: { fontSize: 14, fontWeight: '600' },

  // Year filter
  yearFilterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  yearPill: {
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20,
  },
  yearPillText: { fontSize: 13, fontWeight: '500' },

  // Metric cards - 2x2 grid
  metricGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16,
  },
  metricCard: {
    width: '47%', // roughly half minus gap
    borderRadius: 14, padding: 18,
    alignItems: 'center', borderWidth: 1,
  },
  metricValue: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  metricLabel: { fontSize: 12, fontWeight: '500' },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eyeBtn: { padding: 2 },

  // Chart cards
  chartCard: {
    borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1,
  },
  chartTitle: { fontSize: 15, fontWeight: '600', marginBottom: 14, letterSpacing: -0.2 },

  // Bar chart (vertical columns)
  barChartRow: {
    flexDirection: 'row', alignItems: 'flex-end', height: 160,
  },
  barCol: { flex: 1, alignItems: 'center', height: '100%' },
  barColInner: { flex: 1, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: '55%', minHeight: 2 },
  stackedBar: { width: '55%', minHeight: 2 },
  barCountLabel: { fontSize: 10, fontWeight: '600', marginBottom: 3 },
  barMonthLabel: { fontSize: 9, marginTop: 6, fontWeight: '500' },

  // Spending overlay
  barChartOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 20,
    flexDirection: 'row', alignItems: 'flex-end',
  },
  spendingDot: {
    position: 'absolute', width: 8, height: 8, borderRadius: 4,
    zIndex: 10, borderWidth: 1.5, borderColor: '#fff',
  },
  spendingLinePoint: {
    position: 'absolute', width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#ff9f0a', borderWidth: 1, borderColor: '#fff',
  },

  // Tooltip badge
  tooltipBadge: {
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8,
    marginBottom: 4, zIndex: 20,
  },
  tooltipText: {
    fontSize: 9, fontWeight: '700', color: '#fff', textAlign: 'center', letterSpacing: -0.2,
  },

  // Legend
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: 11 },
  movieChartLegend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 12 },

  // Month detail indicator card
  monthDetailCard: {
    marginTop: 12, padding: 12, borderRadius: 12,
    borderWidth: 1, alignItems: 'center',
  },
  monthDetailHint: { fontSize: 12, fontWeight: '500' },
  monthDetailTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6, letterSpacing: -0.3 },
  monthDetailRow: { flexDirection: 'row', gap: 20 },
  monthDetailMetric: { fontSize: 13, fontWeight: '500' },

  // Ranked list (top N)
  topList: { gap: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rankBadge: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  rankText: { fontSize: 11, fontWeight: '700' },
  topName: { flex: 1, fontSize: 13, fontWeight: '600' },
  barTrack: {
    width: 80, height: 12, borderRadius: 6, overflow: 'hidden', flexShrink: 0,
  },
  barFill: { height: '100%', borderRadius: 6 },
  topCount: { width: 20, textAlign: 'right', fontSize: 13, fontWeight: '700', flexShrink: 0 },

  // Movie chart sub-tabs
  movieChartTabs: { flexDirection: 'row', gap: 4, marginBottom: 12 },
  movieChartTab: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 16 },
  movieChartTabText: { fontSize: 12, fontWeight: '500' },

  // Empty state
  emptyText: { textAlign: 'center', fontSize: 13, paddingVertical: 20 },
});
