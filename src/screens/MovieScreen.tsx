     1|import React, { useEffect, useState } from 'react';
     2|import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
     3|import { getAllMovies, deleteMovie } from '../database/database';
     4|import MovieDetailModal from './modals/MovieDetailModal';
     5|import AddMovieModal from './modals/AddMovieModal';
     6|
     7|export default function MovieScreen() {
     8|  const [movies, setMovies] = useState<any[]>([]);
     9|  const [refreshing, setRefreshing] = useState(false);
    10|  const [selectedMovie, setSelectedMovie] = useState<any>(null);
    11|  const [showAddModal, setShowAddModal] = useState(false);
    12|  const [showDetail, setShowDetail] = useState(false);
    13|  const [filter, setFilter] = useState<'all' | 'movie' | 'series'>('all');
    14|
    15|  useEffect(() => {
    16|    loadMovies();
    17|  }, [filter]);
    18|
    19|  const loadMovies = async () => {
    20|    try {
    21|      const data = filter === 'all' ? await getAllMovies() : await getAllMovies(filter);
    22|      setMovies(data);
    23|    } catch (error) {
    24|      console.error('❌ Failed to load movies:', error);
    25|    }
    26|  };
    27|
    28|  const handleRefresh = async () => {
    29|    setRefreshing(true);
    30|    await loadMovies();
    31|    setRefreshing(false);
    32|  };
    33|
    34|  const handleMoviePress = (movie: any) => {
    35|    setSelectedMovie(movie);
    36|    setShowDetail(true);
    37|  };
    38|
    39|  const handleDelete = async (id: number) => {
    40|    try {
    41|      await deleteMovie(id);
    42|      await loadMovies();
    43|    } catch (error) {
    44|      console.error('❌ Delete failed:', error);
    45|    }
    46|  };
    47|
    48|  const renderMovieItem = ({ item }: { item: any }) => (
    49|    <TouchableOpacity
    50|      style={styles.gridItem}
    51|      onPress={() => handleMoviePress(item)}
    52|      activeOpacity={0.8}
    53|    >
    54|      <View style={styles.movieInner}>
    55|        <Text style={styles.movieEmoji}>🎬</Text>
    56|      </View>
    57|      <View style={styles.movieTitle}>
    58|        <Text style={styles.titleText} numberOfLines={2}>
    59|          {item.title}
    60|        </Text>
    61|      </View>
    62|    </TouchableOpacity>
    63|  );
    64|
    65|  return (
    66|    <View style={styles.container}>
    67|      <View style={styles.header}>
    68|        <Text style={styles.headerTitle}>影视</Text>
    69|        <TouchableOpacity
    70|          style={styles.addButton}
    71|          onPress={() => setShowAddModal(true)}
    72|        >
    73|          <Text style={styles.addButtonText}>+</Text>
    74|        </TouchableOpacity>
    75|      </View>
    76|
    77|      {/* 筛选器 */}
    78|      <View style={styles.segmentContainer}>
    79|        <View style={styles.segment}>
    80|          <TouchableOpacity
    81|            style={[styles.segmentItem, filter === 'all' && styles.segmentActive]}
    82|            onPress={() => setFilter('all')}
    83|          >
    84|            <Text style={[styles.segmentText, filter === 'all' && styles.segmentTextActive]}>全部</Text>
    85|          </TouchableOpacity>
    86|          <TouchableOpacity
    87|            style={[styles.segmentItem, filter === 'movie' && styles.segmentActive]}
    88|            onPress={() => setFilter('movie')}
    89|          >
    90|            <Text style={[styles.segmentText, filter === 'movie' && styles.segmentTextActive]}>电影</Text>
    91|          </TouchableOpacity>
    92|          <TouchableOpacity
    93|            style={[styles.segmentItem, filter === 'series' && styles.segmentActive]}
    94|            onPress={() => setFilter('series')}
    95|          >
    96|            <Text style={[styles.segmentText, filter === 'series' && styles.segmentTextActive]}>剧集</Text>
    97|          </TouchableOpacity>
    98|        </View>
    99|      </View>
   100|
   101|      <FlatList
   102|        data={movies}
   103|        renderItem={renderMovieItem}
   104|        keyExtractor={(item) => item.id.toString()}
   105|        numColumns={3}
   106|        contentContainerStyle={styles.grid}
   107|        refreshControl={
   108|          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#0a84ff" />
   109|        }
   110|      />
   111|
   112|      {/* 添加影视弹窗 */}
   113|      <AddMovieModal
   114|        visible={showAddModal}
   115|        onClose={() => setShowAddModal(false)}
   116|        onSuccess={() => {
   117|          setShowAddModal(false);
   118|          loadMovies();
   119|        }}
   120|      />
   121|
   122|      {/* 详情弹窗 */}
   123|      <MovieDetailModal
   124|        visible={showDetail}
   125|        movie={selectedMovie}
   126|        onClose={() => setShowDetail(false)}
   127|        onDelete={() => {
   128|          setShowDetail(false);
   129|          if (selectedMovie) handleDelete(selectedMovie.id);
   130|        }}
   131|        onUpdate={() => {
   132|          setShowDetail(false);
   133|          loadMovies();
   134|        }}
   135|      />
   136|    </View>
   137|  );
   138|}
   139|
   140|const styles = StyleSheet.create({
   141|  container: {
   142|    flex: 1,
   143|    backgroundColor: '#000',
   144|  },
   145|  header: {
   146|    flexDirection: 'row',
   147|    justifyContent: 'space-between',
   148|    alignItems: 'center',
   149|    paddingHorizontal: 16,
   150|    paddingTop: 24,
   151|    paddingBottom: 16,
   152|  },
   153|  headerTitle: {
   154|    fontSize: 22,
   155|    fontWeight: '700',
   156|    color: '#fff',
   157|    letterSpacing: -0.3,
   158|  },
   159|  addButton: {
   160|    width: 28,
   161|    height: 28,
   162|    backgroundColor: '#0a84ff',
   163|    borderRadius: 14,
   164|    justifyContent: 'center',
   165|    alignItems: 'center',
   166|  },
   167|  addButtonText: {
   168|    color: '#fff',
   169|    fontSize: 20,
   170|    fontWeight: '300',
   171|    lineHeight: 28,
   172|  },
   173|  segmentContainer: {
   174|    paddingHorizontal: 16,
   175|    marginBottom: 16,
   176|  },
   177|  segment: {
   178|    flexDirection: 'row',
   179|    backgroundColor: '#1c1c1e',
   180|    borderRadius: 8,
   181|    padding: 2,
   182|    borderWidth: 1,
   183|    borderColor: 'rgba(255,255,255,0.08)',
   184|  },
   185|  segmentItem: {
   186|    flex: 1,
   187|    paddingVertical: 7,
   188|    alignItems: 'center',
   189|    borderRadius: 6,
   190|  },
   191|  segmentActive: {
   192|    backgroundColor: '#2c2c2e',
   193|  },
   194|  segmentText: {
   195|    fontSize: 14,
   196|    fontWeight: '500',
   197|    color: 'rgba(255,255,255,0.3)',
   198|  },
   199|  segmentTextActive: {
   200|    color: '#fff',
   201|    fontWeight: '600',
   202|  },
   203|  grid: {
   204|    padding: 16,
   205|    paddingBottom: 100,
   206|  },
   207|  gridItem: {
   208|    flex: 1,
   209|    aspectRatio: 2/3,
   210|    margin: 5,
   211|    borderRadius: 8,
   212|    overflow: 'hidden',
   213|    backgroundColor: '#1c1c1e',
   214|    borderWidth: 1,
   215|    borderColor: 'rgba(255,255,255,0.08)',
   216|  },
   217|  movieInner: {
   218|    flex: 1,
   219|    justifyContent: 'center',
   220|    alignItems: 'center',
   221|    backgroundColor: '#1c1c1e',
   222|  },
   223|  movieEmoji: {
   224|    fontSize: 44,
   225|  },
   226|  movieTitle: {
   227|    position: 'absolute',
   228|    bottom: 0,
   229|    left: 0,
   230|    right: 0,
   231|    padding: 20,
   232|    backgroundColor: 'rgba(0,0,0,0.9)',
   233|  },
   234|  titleText: {
   235|    color: '#fff',
   236|    fontSize: 10,
   237|    fontWeight: '600',
   238|    lineHeight: 12,
   239|  },
   240|});
   241|