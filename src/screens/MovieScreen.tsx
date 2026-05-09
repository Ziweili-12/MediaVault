import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getAllMovies, deleteMovie } from '../database/database';
import MovieDetailModal from './modals/MovieDetailModal';
import AddMovieModal from './modals/AddMovieModal';

const themes = {
  dark: { bg: '#000', card: '#1c1c1e', border: 'rgba(255,255,255,0.08)', text: '#fff', secondary: 'rgba(255,255,255,0.55)' },
  light: { bg: '#f2f2f7', card: '#fff', border: 'rgba(0,0,0,0.06)', text: '#000', secondary: 'rgba(0,0,0,0.45)' },
};

export default function MovieScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const c = isDark ? themes.dark : themes.light;

  const [movies, setMovies] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [filter, setFilter] = useState<'all' | 'movie' | 'series'>('all');

  useEffect(() => { loadMovies(); }, [filter]);

  const loadMovies = async () => {
    try {
      const data = filter === 'all' ? await getAllMovies() : await getAllMovies(filter);
      setMovies(data);
    } catch (error) {
      console.error('Failed to load movies:', error);
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
      console.error('Delete failed:', error);
    }
  };

  const renderMovieItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.gridItem, { backgroundColor: c.card, borderColor: c.border }]}
      onPress={() => handleMoviePress(item)}
      activeOpacity={0.8}
    >
      <View style={[styles.movieInner, { backgroundColor: c.card }]}>
        <Text style={styles.movieEmoji}>{item.poster_url ? null : '🎬'}</Text>
      </View>
      <View style={styles.movieTitle}>
        <Text style={styles.titleText} numberOfLines={2}>{item.title}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: c.text }]}>影视</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)} activeOpacity={0.8}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.segmentContainer}>
        <View style={[styles.segment, { backgroundColor: c.card, borderColor: c.border }]}>
          {(['all', 'movie', 'series'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.segmentItem, filter === type && styles.segmentActive]}
              onPress={() => setFilter(type)}
            >
              <Text style={[styles.segmentText, { color: c.secondary }, filter === type && { color: c.text }]}>
                {type === 'all' ? '全部' : type === 'movie' ? '电影' : '剧集'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={movies}
        renderItem={renderMovieItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        contentContainerStyle={styles.grid}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#0a84ff" />}
        showsVerticalScrollIndicator={false}
      />

      <AddMovieModal visible={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={() => { setShowAddModal(false); loadMovies(); }} />
      <MovieDetailModal visible={showDetail} movie={selectedMovie} onClose={() => setShowDetail(false)} onDelete={() => { setShowDetail(false); if (selectedMovie) handleDelete(selectedMovie.id); }} onUpdate={() => { setShowDetail(false); loadMovies(); }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  addButton: {
    width: 40, height: 40,
    backgroundColor: '#0a84ff',
    borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  segmentContainer: { paddingHorizontal: 16, marginBottom: 12 },
  segment: {
    flexDirection: 'row', borderRadius: 8, padding: 2, borderWidth: 1,
  },
  segmentItem: { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: 6 },
  segmentActive: { backgroundColor: '#2c2c2e' },
  segmentText: { fontSize: 14, fontWeight: '500' },
  grid: { padding: 16, paddingBottom: 100 },
  gridItem: {
    flex: 1, aspectRatio: 2/3,
    margin: 5, borderRadius: 8, overflow: 'hidden',
    borderWidth: 1,
  },
  movieInner: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  movieEmoji: { fontSize: 44 },
  movieTitle: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  titleText: { color: '#fff', fontSize: 10, fontWeight: '600', lineHeight: 12 },
});
