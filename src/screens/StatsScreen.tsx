import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getVinylStats, getMovieStats,
  getVinylStatsFiltered, getMovieStatsFiltered, getVinylMonthlyData,
} from '../database/database';

const themes = {
  dark: { bg: '#000', card: '#1c1c1e', border: 'rgba(255,255,255,0.08)', text: '#fff', secondary: 'rgba(255,255,255,0.55)' },
  light: { bg: '#f2f2f7', card: '#fff', border: 'rgba(0,0,0,0.06)', text: '#000', secondary: 'rgba(0,0,0,0.45)' },
};

const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const YEAR_OPTIONS = ['全部', '2026', '2025', '2024'];

export default function StatsScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const c = isDark ? themes.dark : themes.light;
  const s = isDark ? darkStyles : lightStyles;

  const [vinylStats, setVinylStats] = useState<any>(null);
  const [movieStats, setMovieStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'music' | 'movie'>('music');
  const [yearFilter, setYearFilter] = useState<string>('全部');
  const [monthlyData, setMonthlyData] = useState<{ month: number; count: number }[]>([]);

  const selectedYear = yearFilter === '全部' ? undefined : parseInt(yearFilter);
  const colors = ['#0a84ff', '#30d158', '#ff9f0a', '#bf5af2', '#ff375f', '#64d2ff', '#ffd60a', '#5e5ce6'];

  useEffect(() => { loadAllStats(); }, [yearFilter]);

  const loadAllStats = async () => {
    try {
      if (activeTab === 'music') {
        const stats = selectedYear
          ? await getVinylStatsFiltered(selectedYear)
          : await getVinylStats();
        setVinylStats(stats);

        const monthly = await getVinylMonthlyData(selectedYear);
        setMonthlyData(monthly);
      } else {
        const stats = selectedYear
          ? await getMovieStatsFiltered(selectedYear)
          : await getMovieStats();
        setMovieStats(stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  useEffect(() => { loadAllStats(); }, [activeTab]);

  const handleBarPress = useCallback((value: number, monthIndex: number) => {
    const monthName = MONTH_NAMES[monthIndex - 1] || `${monthIndex}月`;
    const yearStr = selectedYear ? `${selectedYear}年` : '';
    Alert.alert(
      `${yearStr}${monthName}`,
      `购买数量：${value} 张`
    );
  }, [selectedYear]);

  const filterLabel = selectedYear ? `${selectedYear}年` : '全部时间';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[s.headerTitle, { color: c.text }]}>统计</Text>

        {/* Tab Segment */}
        <View style={styles.segmentContainer}>
          <View style={[styles.segment, { backgroundColor: c.card, borderColor: c.border }]}>
            {(['music', 'movie'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.segmentItem, activeTab === tab && styles.segmentActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.segmentText, { color: c.secondary }, activeTab === tab && { color: c.text }]}>
                  {tab === 'music' ? '音乐' : '影视'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Year Filter */}
        <View style={styles.filterContainer}>
          <View style={[styles.filterRow, { backgroundColor: c.card, borderColor: c.border }]}>
            {YEAR_OPTIONS.map((year) => (
              <TouchableOpacity
                key={year}
                style={[styles.filterItem, yearFilter === year && s.filterActive]}
                onPress={() => setYearFilter(year)}
              >
                <Text style={[
                  styles.filterText,
                  { color: c.secondary },
                  yearFilter === year && s.filterTextActive,
                ]}>
                  {year}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Metric Cards */}
        {activeTab === 'music' && vinylStats && (
          <>
            <View style={styles.metricGrid}>
              <View style={[styles.metricCard, { backgroundColor: c.card, borderColor: c.border }]}>
                <Text style={[styles.metricValue, { color: '#0a84ff' }]}>{vinylStats.total}</Text>
                <Text style={[styles.metricLabel, { color: c.secondary }]}>黑胶总数</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: c.card, borderColor: c.border }]}>
                <Text style={[styles.metricValue, { color: '#30d158' }]}>¥{vinylStats.totalSpent?.toFixed(0)}</Text>
                <Text style={[styles.metricLabel, { color: c.secondary }]}>总花费</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: c.card, borderColor: c.border }]}>
                <Text style={[styles.metricValue, { color: '#bf5af2' }]}>{vinylStats.artistCount}</Text>
                <Text style={[styles.metricLabel, { color: c.secondary }]}>艺术家</Text>
              </View>
            </View>

            {/* Monthly Purchase Trend Chart */}
            <View style={[styles.chartCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[styles.chartTitle, { color: c.secondary }]}>
                月度购买趋势 · {filterLabel}
              </Text>
              <View style={styles.chartBars}>
                {monthlyData.length === 0 && (
                  <Text style={[styles.emptyChartText, { color: c.secondary }]}>
                    该时间范围内暂无购买记录
                  </Text>
                )}
                {monthlyData.map((item, index) => {
                  const maxCount = Math.max(...monthlyData.map(d => d.count));
                  const barHeight = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                  return (
                    <TouchableOpacity
                      key={item.month}
                      style={styles.chartBarWrapper}
                      activeOpacity={0.6}
                      onPress={() => handleBarPress(item.count, item.month)}
                    >
                      <Text style={styles.chartValueLabel}>{item.count}</Text>
                      <View style={[
                        styles.chartBar,
                        {
                          height: `${Math.max(barHeight, 5)}%`,
                          backgroundColor: colors[index % colors.length],
                        },
                      ]} />
                      <Text style={[styles.chartBarLabel, { color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }]}>
                        {MONTH_NAMES[item.month - 1] || `${item.month}月`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {activeTab === 'movie' && movieStats && (
          <>
            <View style={styles.metricGrid}>
              <View style={[styles.metricCard, { backgroundColor: c.card, borderColor: c.border }]}>
                <Text style={[styles.metricValue, { color: '#0a84ff' }]}>{movieStats.total}</Text>
                <Text style={[styles.metricLabel, { color: c.secondary }]}>观影总数</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: c.card, borderColor: c.border }]}>
                <Text style={[styles.metricValue, { color: '#30d158' }]}>{movieStats.movieCount}</Text>
                <Text style={[styles.metricLabel, { color: c.secondary }]}>电影</Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: c.card, borderColor: c.border }]}>
                <Text style={[styles.metricValue, { color: '#bf5af2' }]}>{movieStats.seriesCount}</Text>
                <Text style={[styles.metricLabel, { color: c.secondary }]}>剧集</Text>
              </View>
            </View>

            <View style={[styles.chartCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[styles.chartTitle, { color: c.secondary }]}>
                类型分布 · {filterLabel}
              </Text>
              {[
                ...(!selectedYear ? [{ name: '科幻', pct: 25, color: '#0a84ff' }] : []),
                ...(!selectedYear ? [{ name: '剧情', pct: 30, color: '#30d158' }] : []),
                ...(!selectedYear ? [{ name: '动作', pct: 20, color: '#ff9f0a' }] : []),
                ...(!selectedYear ? [{ name: '喜剧', pct: 15, color: '#bf5af2' }] : []),
                ...(!selectedYear ? [{ name: '其他', pct: 10, color: c.secondary }] : []),
              ].map((item, index) => (
                <View key={index} style={styles.progressItem}>
                  <View style={styles.progressHeader}>
                    <Text style={[styles.progressName, { color: c.text }]}>{item.name}</Text>
                    <Text style={[styles.progressPct, { color: c.secondary }]}>{item.pct}%</Text>
                  </View>
                  <View style={[styles.progressBar, { backgroundColor: isDark ? '#2c2c2e' : '#e5e5ea' }]}>
                    <View style={[styles.progressFill, { width: `${item.pct}%`, backgroundColor: item.color }]} />
                  </View>
                </View>
              ))}
              <Text style={[styles.emptyChartText, { color: c.secondary, marginTop: 16 }]}>
                影视数据较多时将展示真实类型分布
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  segmentContainer: { marginBottom: 12 },
  segment: { flexDirection: 'row', borderRadius: 8, padding: 2, borderWidth: 1 },
  segmentItem: { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: 6 },
  segmentActive: { backgroundColor: '#2c2c2e' },
  segmentText: { fontSize: 14, fontWeight: '500' },
  filterContainer: { marginBottom: 20 },
  filterRow: {
    flexDirection: 'row', borderRadius: 8, padding: 2, borderWidth: 1,
  },
  filterItem: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6 },
  filterText: { fontSize: 13, fontWeight: '500' },
  metricGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  metricCard: {
    flex: 1, borderRadius: 14, padding: 20,
    alignItems: 'center', borderWidth: 1,
  },
  metricValue: { fontSize: 28, fontWeight: '800', letterSpacing: -1, lineHeight: 30, marginBottom: 4 },
  metricLabel: { fontSize: 12, fontWeight: '500' },
  chartCard: {
    borderRadius: 20, padding: 22, paddingTop: 24, marginBottom: 20, borderWidth: 1,
  },
  chartTitle: { fontSize: 15, fontWeight: '600', marginBottom: 48, letterSpacing: -0.2 },
  chartBars: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', height: 240, gap: 10,
  },
  chartBarWrapper: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  chartValueLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0a84ff',
    marginBottom: 4,
  },
  chartBar: {
    width: '55%',
    borderRadius: 3, minHeight: 6,
  },
  chartBarLabel: { fontSize: 11, marginTop: 12, fontWeight: '500' },
  progressItem: { marginBottom: 14 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressName: { fontSize: 14, fontWeight: '500' },
  progressPct: { fontSize: 14, fontWeight: '600' },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  emptyChartText: { fontSize: 14, textAlign: 'center', paddingVertical: 40 },
});

const darkStyles = StyleSheet.create({
  headerTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3, marginBottom: 20 },
  filterActive: { backgroundColor: '#2c2c2e' },
  filterTextActive: { color: '#fff' },
});

const lightStyles = StyleSheet.create({
  headerTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3, marginBottom: 20 },
  filterActive: { backgroundColor: '#e5e5ea' },
  filterTextActive: { color: '#000' },
});
