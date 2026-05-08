     1|import React, { useEffect, useState } from 'react';
     2|import { View, Text, StyleSheet, ScrollView, SegmentedControlIOS } from 'react-native';
     3|import { getVinylStats, getMovieStats } from '../database/database';
     4|
     5|export default function StatsScreen() {
     6|  const [vinylStats, setVinylStats] = useState<any>(null);
     7|  const [movieStats, setMovieStats] = useState<any>(null);
     8|  const [activeTab, setActiveTab] = useState<'music' | 'movie'>('music');
     9|
    10|  useEffect(() => {
    11|    loadAllStats();
    12|  }, []);
    13|
    14|  const loadAllStats = async () => {
    15|    try {
    16|      const vStats = await getVinylStats();
    17|      setVinylStats(vStats);
    18|
    19|      const mStats = await getMovieStats();
    20|      setMovieStats(mStats);
    21|    } catch (error) {
    22|      console.error('❌ Failed to load stats:', error);
    23|    }
    24|  };
    25|
    26|  // 模拟月度数据（实际应该从数据库查询）
    27|  const monthlyData = [40, 60, 45, 80, 65, 55, 75, 50];
    28|
    29|  const maxValue = Math.max(...monthlyData);
    30|
    31|  return (
    32|    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    33|      <View style={styles.header}>
    34|        <Text style={styles.headerTitle}>统计</Text>
    35|      </View>
    36|
    37|      {/* Segment切换 */}
    38|      <View style={styles.segmentContainer}>
    39|        <View style={styles.segment}>
    40|          <TouchableOpacity
    41|            style={[styles.segmentItem, activeTab === 'music' && styles.segmentActive]}
    42|            onPress={() => setActiveTab('music')}
    43|          >
    44|            <Text style={[styles.segmentText, activeTab === 'music' && styles.segmentTextActive]}>音乐</Text>
    45|          </TouchableOpacity>
    46|          <TouchableOpacity
    47|            style={[styles.segmentItem, activeTab === 'movie' && styles.segmentActive]}
    48|            onPress={() => setActiveTab('movie')}
    49|          >
    50|            <Text style={[styles.segmentText, activeTab === 'movie' && styles.segmentTextActive]}>影视</Text>
    51|          </TouchableOpacity>
    52|        </View>
    53|      </View>
    54|
    55|      {activeTab === 'music' && vinylStats && (
    56|        <>
    57|          {/* 指标卡 */}
    58|          <View style={styles.metricGrid}>
    59|            <View style={styles.metricCard}>
    60|              <Text style={[styles.metricValue, styles.blue]}>{vinylStats.total}</Text>
    61|              <Text style={styles.metricLabel}>黑胶总数</Text>
    62|            </View>
    63|            <View style={styles.metricCard}>
    64|              <Text style={[styles.metricValue, styles.green]}>¥{vinylStats.totalSpent?.toFixed(0)}</Text>
    65|              <Text style={styles.metricLabel}>总花费</Text>
    66|            </View>
    67|            <View style={styles.metricCard}>
    68|              <Text style={[styles.metricValue, styles.purple]}>{vinylStats.artistCount}</Text>
    69|              <Text style={styles.metricLabel}>艺术家</Text>
    70|            </View>
    71|          </View>
    72|
    73|          {/* 月度趋势图 */}
    74|          <View style={styles.chartCard}>
    75|            <Text style={styles.chartTitle}>月度购买趋势 · 2026</Text>
    76|            <View style={styles.chartBars}>
    77|              {monthlyData.map((value, index) => (
    78|                <View key={index} style={styles.chartBarWrapper}>
    79|                  <View
    80|                    style={[
    81|                      styles.chartBar,
    82|                      { height: `${(value / maxValue) * 100}%` },
    83|                      index === 6 && { backgroundColor: '#30d158' },
    84|                    ]}
    85|                  />
    86|                  <Text style={styles.chartBarLabel}>
    87|                    {`${index + 1}月`}
    88|                  </Text>
    89|                </View>
    90|              ))}
    91|            </View>
    92|          </View>
    93|        </>
    94|      )}
    95|
    96|      {activeTab === 'movie' && movieStats && (
    97|        <>
    98|          {/* 指标卡 */}
    99|          <View style={styles.metricGrid}>
   100|            <View style={styles.metricCard}>
   101|              <Text style={[styles.metricValue, styles.blue]}>{movieStats.total}</Text>
   102|              <Text style={styles.metricLabel}>观影总数</Text>
   103|            </View>
   104|            <View style={styles.metricCard}>
   105|              <Text style={[styles.metricValue, styles.green]}>{movieStats.movieCount}</Text>
   106|              <Text style={styles.metricLabel}>电影</Text>
   107|            </View>
   108|            <View style={styles.metricCard}>
   109|              <Text style={[styles.metricValue, styles.purple]}>{movieStats.seriesCount}</Text>
   110|              <Text style={styles.metricLabel}>剧集</Text>
   111|            </View>
   112|          </View>
   113|
   114|          {/* 类型分布进度条（模拟数据）*/}
   115|          <View style={styles.chartCard}>
   116|            <Text style={styles.chartTitle}>类型分布</Text>
   117|            <View style={styles.progressList}>
   118|              {[
   119|                { name: '科幻', pct: 25, color: '#0a84ff' },
   120|                { name: '剧情', pct: 30, color: '#30d158' },
   121|                { name: '动作', pct: 20, color: '#ff9f0a' },
   122|                { name: '喜剧', pct: 15, color: '#bf5af2' },
   123|                { name: '其他', pct: 10, color: 'rgba(255,255,255,0.3)' },
   124|              ].map((item, index) => (
   125|                <View key={index} style={styles.progressItem}>
   126|                  <View style={styles.progressHeader}>
   127|                    <Text style={styles.progressName}>{item.name}</Text>
   128|                    <Text style={styles.progressPct}>{item.pct}%</Text>
   129|                  </View>
   130|                  <View style={styles.progressBar}>
   131|                    <View
   132|                      style={[
   133|                        styles.progressFill,
   134|                        { width: `${item.pct}%`, backgroundColor: item.color },
   135|                      ]}
   136|                    />
   137|                  </View>
   138|                </View>
   139|              ))}
   140|            </View>
   141|          </View>
   142|        </>
   143|      )}
   144|    </ScrollView>
   145|  );
   146|}
   147|
   148|const styles = StyleSheet.create({
   149|  container: {
   150|    flex: 1,
   151|    backgroundColor: '#000',
   152|  },
   153|  content: {
   154|    padding: 16,
   155|    paddingTop: 24,
   156|    paddingBottom: 100,
   157|  },
   158|  header: {
   159|    marginBottom: 24,
   160|  },
   161|  headerTitle: {
   162|    fontSize: 22,
   163|    fontWeight: '700',
   164|    color: '#fff',
   165|    letterSpacing: -0.3,
   166|  },
   167|  segmentContainer: {
   168|    marginBottom: 24,
   169|  },
   170|  segment: {
   171|    flexDirection: 'row',
   172|    backgroundColor: '#1c1c1e',
   173|    borderRadius: 8,
   174|    padding: 2,
   175|    borderWidth: 1,
   176|    borderColor: 'rgba(255,255,255,0.08)',
   177|  },
   178|  segmentItem: {
   179|    flex: 1,
   180|    paddingVertical: 7,
   181|    alignItems: 'center',
   182|    borderRadius: 6,
   183|  },
   184|  segmentActive: {
   185|    backgroundColor: '#2c2c2e',
   186|  },
   187|  segmentText: {
   188|    fontSize: 14,
   189|    fontWeight: '500',
   190|    color: 'rgba(255,255,255,0.3)',
   191|  },
   192|  segmentTextActive: {
   193|    color: '#fff',
   194|    fontWeight: '600',
   195|  },
   196|  metricGrid: {
   197|    flexDirection: 'row',
   198|    gap: 10,
   199|    marginBottom: 24,
   200|  },
   201|  metricCard: {
   202|    flex: 1,
   203|    backgroundColor: '#1c1c1e',
   204|    borderRadius: 10,
   205|    padding: 16,
   206|    alignItems: 'center',
   207|    borderWidth: 1,
   208|    borderColor: 'rgba(255,255,255,0.08)',
   209|  },
   210|  metricValue: {
   211|    fontSize: 28,
   212|    fontWeight: '800',
   213|    letterSpacing: -1,
   214|    lineHeight: 30,
   215|    marginBottom: 4,
   216|  },
   217|  blue: {
   218|    color: '#0a84ff',
   219|  },
   220|  green: {
   221|    color: '#30d158',
   222|  },
   223|  purple: {
   224|    color: '#bf5af2',
   225|  },
   226|  metricLabel: {
   227|    fontSize: 12,
   228|    color: 'rgba(255,255,255,0.55)',
   229|    fontWeight: '500',
   230|  },
   231|  chartCard: {
   232|    backgroundColor: '#1c1c1e',
   233|    borderRadius: 16,
   234|    padding: 18,
   235|    marginBottom: 14,
   236|    borderWidth: 1,
   237|    borderColor: 'rgba(255,255,255,0.08)',
   238|  },
   239|  chartTitle: {
   240|    fontSize: 15,
   241|    fontWeight: '600',
   242|    color: 'rgba(255,255,255,0.55)',
   243|    marginBottom: 16,
   244|    letterSpacing: -0.2,
   245|  },
   246|  chartBars: {
   247|    flexDirection: 'row',
   248|    justifyContent: 'space-between',
   249|    alignItems: 'flex-end',
   250|    height: 140,
   251|    gap: 6,
   252|  },
   253|  chartBarWrapper: {
   254|    flex: 1,
   255|    alignItems: 'center',
   256|    height: '100%',
   257|    justifyContent: 'flex-end',
   258|  },
   259|  chartBar: {
   260|    width: '100%',
   261|    backgroundColor: '#0a84ff',
   262|    borderRadius: 3,
   263|    minHeight: 8,
   264|  },
   265|  chartBarLabel: {
   266|    fontSize: 10,
   267|    color: 'rgba(255,255,255,0.3)',
   268|    marginTop: 6,
   269|    fontWeight: '500',
   270|  },
   271|  progressList: {
   272|    gap: 14,
   273|  },
   274|  progressItem: {
   275|    // no specific style needed
   276|  },
   277|  progressHeader: {
   278|    flexDirection: 'row',
   279|    justifyContent: 'space-between',
   280|    marginBottom: 6,
   281|  },
   282|  progressName: {
   283|    color: '#fff',
   284|    fontSize: 14,
   285|    fontWeight: '500',
   286|  },
   287|  progressPct: {
   288|    color: 'rgba(255,255,255,0.55)',
   289|    fontSize: 14,
   290|    fontWeight: '600',
   291|  },
   292|  progressBar: {
   293|    height: 6,
   294|    backgroundColor: '#2c2c2e',
   295|    borderRadius: 3,
   296|    overflow: 'hidden',
   297|  },
   298|  progressFill: {
   299|    height: '100%',
   300|    borderRadius: 3,
   301|  },
   302|});
   303|