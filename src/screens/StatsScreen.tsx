import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SegmentedControlIOS } from 'react-native';
import { getVinylStats, getMovieStats } from '../database/database';

export default function StatsScreen() {
  const [vinylStats, setVinylStats] = useState<any>(null);
  const [movieStats, setMovieStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'music' | 'movie'>('music');

  useEffect(() => {
    loadAllStats();
  }, []);

  const loadAllStats = async () => {
    try {
      const vStats = await getVinylStats();
      setVinylStats(vStats);

      const mStats = await getMovieStats();
      setMovieStats(mStats);
    } catch (error) {
      console.error('❌ Failed to load stats:', error);
    }
  };

  // 模拟月度数据（实际应该从数据库查询）
  const monthlyData = [40, 60, 45, 80, 65, 55, 75, 50];

  const maxValue = Math.max(...monthlyData);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>统计</Text>
      </View>

      {/* Segment切换 */}
      <View style={styles.segmentContainer}>
        <View style={styles.segment}>
          <TouchableOpacity
            style={[styles.segmentItem, activeTab === 'music' && styles.segmentActive]}
            onPress={() => setActiveTab('music')}
          >
            <Text style={[styles.segmentText, activeTab === 'music' && styles.segmentTextActive]}>音乐</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentItem, activeTab === 'movie' && styles.segmentActive]}
            onPress={() => setActiveTab('movie')}
          >
            <Text style={[styles.segmentText, activeTab === 'movie' && styles.segmentTextActive]}>影视</Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'music' && vinylStats && (
        <>
          {/* 指标卡 */}
          <View style={styles.metricGrid}>
            <View style={styles.metricCard}>
              <Text style={[styles.metricValue, styles.blue]}>{vinylStats.total}</Text>
              <Text style={styles.metricLabel}>黑胶总数</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={[styles.metricValue, styles.green]}>¥{vinylStats.totalSpent?.toFixed(0)}</Text>
              <Text style={styles.metricLabel}>总花费</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={[styles.metricValue, styles.purple]}>{vinylStats.artistCount}</Text>
              <Text style={styles.metricLabel}>艺术家</Text>
            </View>
          </View>

          {/* 月度趋势图 */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>月度购买趋势 · 2026</Text>
            <View style={styles.chartBars}>
              {monthlyData.map((value, index) => (
                <View key={index} style={styles.chartBarWrapper}>
                  <View
                    style={[
                      styles.chartBar,
                      { height: `${(value / maxValue) * 100}%` },
                      index === 6 && { backgroundColor: '#30d158' },
                    ]}
                  />
                  <Text style={styles.chartBarLabel}>
                    {`${index + 1}月`}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </>
      )}

      {activeTab === 'movie' && movieStats && (
        <>
          {/* 指标卡 */}
          <View style={styles.metricGrid}>
            <View style={styles.metricCard}>
              <Text style={[styles.metricValue, styles.blue]}>{movieStats.total}</Text>
              <Text style={styles.metricLabel}>观影总数</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={[styles.metricValue, styles.green]}>{movieStats.movieCount}</Text>
              <Text style={styles.metricLabel}>电影</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={[styles.metricValue, styles.purple]}>{movieStats.seriesCount}</Text>
              <Text style={styles.metricLabel}>剧集</Text>
            </View>
          </View>

          {/* 类型分布进度条（模拟数据）*/}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>类型分布</Text>
            <View style={styles.progressList}>
              {[
                { name: '科幻', pct: 25, color: '#0a84ff' },
                { name: '剧情', pct: 30, color: '#30d158' },
                { name: '动作', pct: 20, color: '#ff9f0a' },
                { name: '喜剧', pct: 15, color: '#bf5af2' },
                { name: '其他', pct: 10, color: 'rgba(255,255,255,0.3)' },
              ].map((item, index) => (
                <View key={index} style={styles.progressItem}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressName}>{item.name}</Text>
                    <Text style={styles.progressPct}>{item.pct}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${item.pct}%`, backgroundColor: item.color },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </>
      )}
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
    paddingTop: 24,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
  },
  segmentContainer: {
    marginBottom: 24,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#1c1c1e',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: '#2c2c2e',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.3)',
  },
  segmentTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 30,
    marginBottom: 4,
  },
  blue: {
    color: '#0a84ff',
  },
  green: {
    color: '#30d158',
  },
  purple: {
    color: '#bf5af2',
  },
  metricLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
  },
  chartCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    gap: 6,
  },
  chartBarWrapper: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '100%',
    backgroundColor: '#0a84ff',
    borderRadius: 3,
    minHeight: 8,
  },
  chartBarLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 6,
    fontWeight: '500',
  },
  progressList: {
    gap: 14,
  },
  progressItem: {
    // no specific style needed
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  progressPct: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#2c2c2e',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
