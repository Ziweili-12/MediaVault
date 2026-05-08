import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, SegmentedControlIOS } from 'react-native';
import { getMovies, deleteMovie } from '../database/database';
import MovieDetailModal from './modals/MovieDetailModal';
import AddMovieModal from './modals/AddMovieModal';

export default function MovieScreen() {
  const [movies, setMovies] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [filter, setFilter] = useState<'all' | 'movie' | 'series'>('all');

  useEffect(() => {
    loadMovies();
  }, [filter]);

  const loadMovies = async () => {
    try {
      const data = filter === 'all' ? await getMovies() : await getMovies(filter);
      setMovies(data);
    } catch (error) {
      console.error('❌ Failed to load movies:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMovies();
    setRefreshing(false);
  };

  const handleMoviePress = (movie: any) => {
    setSelectedMovie(movie);
    setShowDetail(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMovie(id);
      await loadMovies();
    } catch (error) {
      console.error('❌ Delete failed:', error);
    }
  };

  const renderMovieItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => handleMoviePress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.movieInner}>
        <Text style={styles.movieEmoji}>🎬</Text>
      </View>
      <View style={styles.movieTitle}>
        <Text style={styles.titleText} numberOfLines={2}>
          {item.title}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>影视</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* 筛选器 */}
      <View style={styles.segmentContainer}>
        <View style={styles.segment}>
          <TouchableOpacity
            style={[styles.segmentItem, filter === 'all' && styles.segmentActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.segmentText, filter === 'all' && styles.segmentTextActive]}>全部</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentItem, filter === 'movie' && styles.segmentActive]}
            onPress={() => setFilter('movie')}
          >
            <Text style={[styles.segmentText, filter === 'movie' && styles.segmentTextActive]}>电影</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentItem, filter === 'series' && styles.segmentActive]}
            onPress={() => setFilter('series')}
          >
            <Text style={[styles.segmentText, filter === 'series' && styles.segmentTextActive]}>剧集</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={movies}
        renderItem={renderMovieItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#0a84ff" />
        }
      />

      {/* 添加影视弹窗 */}
      <AddMovieModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          loadMovies();
        }}
      />

      {/* 详情弹窗 */}
      <MovieDetailModal
        visible={showDetail}
        movie={selectedMovie}
        onClose={() => setShowDetail(false)}
        onDelete={() => {
          setShowDetail(false);
          if (selectedMovie) handleDelete(selectedMovie.id);
        }}
        onUpdate={() => {
          setShowDetail(false);
          loadMovies();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
  },
  addButton: {
    width: 28,
    height: 28,
    backgroundColor: '#0a84ff',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '300',
    lineHeight: 28,
  },
  segmentContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
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
  grid: {
    padding: 16,
    paddingBottom: 100,
  },
  gridItem: {
    flex: 1,
    aspectRatio: 2/3,
    margin: 5,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  movieInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
  },
  movieEmoji: {
    fontSize: 44,
  },
  movieTitle: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  titleText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 12,
  },
});
