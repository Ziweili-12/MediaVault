import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getVinylStats, getMovieStats } from '../database/database';

const themes = {
  dark: { bg: '#000', card: '#1c1c1e', border: 'rgba(255,255,255,0.08)', text: '#fff', secondary: 'rgba(255,255,255,0.55)' },
  light: { bg: '#f2f2f7', card: '#fff', border: 'rgba(0,0,0,0.06)', text: '#000', secondary: 'rgba(0,0,0,0.45)' },
};

export default function StatsScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const c = isDark ? themes.dark : themes.light;

  const [vinylStats, setVinylStats] = useState<any>(null);
  const [movieStats, setMovieStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'music' | 'movie'>('music');

  useEffect(() => { loadAllStats(); }, []);

  const loadAllStats = async () => {
    try {
      setVinylStats(await getVinylStats());
      setMovieStats(await getMovieStats());
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const monthlyData = [40, 60, 45, 80, 65, 55, 75, 50];
  const maxValue = Math.max(...monthlyData);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.headerTitle, { color: c.text }]}>统计</Text>

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

            <View style={[styles.chartCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <Text style={[styles.chartTitle, { color: c.secondary }]}>月度购买趋势 · 2026</Text>
              <View style={styles.chartBars}>
                {monthlyData.map((value, index) => (
                  <TouchableOpacity key={index} style={styles.chartBarWrapper} activeOpacity={0.7} onPress={() => {}}>
                    <Text style={styles.chartValueLabel}>{value}</Text>
                    <View style={[
                      styles.chartBar,
                      { height: `${(value / maxValue) * 100}%` },
                      index === 6 && { backgroundColor: '#30d158' },
                    ]} />
                    <Text style={[styles.chartBarLabel, { color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }]}>
                      {index + 1}月
                    </Text>
                  </TouchableOpacity>
                ))}
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
              <Text style={[styles.chartTitle, { color: c.secondary }]}>类型分布</Text>
              {[
                { name: '科幻', pct: 25, color: '#0a84ff' },
                { name: '剧情', pct: 30, color: '#30d158' },
                { name: '动作', pct: 20, color: '#ff9f0a' },
                { name: '喜剧', pct: 15, color: '#bf5af2' },
                { name: '其他', pct: 10, color: c.secondary },
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
  headerTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3, marginBottom: 20 },
  segmentContainer: { marginBottom: 20 },
  segment: { flexDirection: 'row', borderRadius: 8, padding: 2, borderWidth: 1 },
  segmentItem: { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: 6 },
  segmentActive: { backgroundColor: '#2c2c2e' },
  segmentText: { fontSize: 14, fontWeight: '500' },
  metricGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  metricCard: {
    flex: 1, borderRadius: 14, padding: 20,
    alignItems: 'center', borderWidth: 1,
  },
  metricValue: { fontSize: 28, fontWeight: '800', letterSpacing: -1, lineHeight: 30, marginBottom: 4 },
  metricLabel: { fontSize: 12, fontWeight: '500' },
  chartCard: {
    borderRadius: 20, padding: 22, paddingTop: 28, marginBottom: 20, borderWidth: 1,
  },
  chartTitle: { fontSize: 15, fontWeight: '600', marginBottom: 28, letterSpacing: -0.2 },
  chartBars: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', height: 200, gap: 14,
  },
  chartBarWrapper: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  chartValueLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0a84ff',
    marginBottom: 4,
  },
  chartBar: {
    width: '100%', backgroundColor: '#0a84ff',
    borderRadius: 3, minHeight: 8,
  },
  chartBarLabel: { fontSize: 11, marginTop: 10, fontWeight: '500' },
  progressItem: { marginBottom: 14 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressName: { fontSize: 14, fontWeight: '500' },
  progressPct: { fontSize: 14, fontWeight: '600' },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
});
