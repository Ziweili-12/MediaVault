import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, useColorScheme, Image } from 'react-native';
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
      activeOpacity={0.85}
    >
      <View style={styles.movieCover}>
        {item.poster_url ? (
          <Image
            source={{ uri: item.poster_url }}
            style={styles.posterImage}
            resizeMode="cover"
            defaultSource={{ uri: 'https://via.placeholder.com/200x300' }}
          />
        ) : (
          <View style={[styles.posterPlaceholder, { backgroundColor: '#2c2c2e' }]}>
            <Ionicons name="film" size={48} color={c.secondary} />
          </View>
        )}
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{item.type === 'movie' ? '电影' : '剧集'}</Text>
        </View>
        {item.personal_rating && (
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>{'⭐'.repeat(item.personal_rating)}</Text>
          </View>
        )}
      </View>
      <View style={styles.movieInfo}>
        <Text style={[styles.titleText, { color: c.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.yearText, { color: c.secondary }]}>
          {item.year}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: c.text }]}>影视</Text>
          <Text style={[styles.headerSub, { color: c.secondary }]}>
            共 {movies.length} 部作品
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)} activeOpacity={0.8}>
          <Ionicons name="plus" size={22} color="#fff" />
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
              <Text style={[styles.segmentText, filter === type ? { color: '#0a84ff', fontWeight: '600' } : { color: c.secondary }]}>
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
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5 },
  headerSub: { fontSize: 14, fontWeight: '400', marginTop: 2 },
  addButton: {
    width: 44,
    height: 44,
    backgroundColor: '#30d158',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#30d158',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  segmentContainer: { paddingHorizontal: 16, marginBottom: 12 },
  segment: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    backgroundColor: '#1c1c1e',
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: '#2c2c2e',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
  },
  grid: { padding: 16, paddingBottom: 100 },
  gridItem: {
    flex: 1,
    aspectRatio: 2 / 3,
    margin: 5,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    backgroundColor: '#1c1c1e',
  },
  movieCover: {
    flex: 1,
    position: 'relative',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  posterPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  typeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '600',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  ratingText: {
    fontSize: 9,
  },
  movieInfo: {
    padding: 8,
    backgroundColor: '#1c1c1e',
  },
  titleText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  yearText: {
    fontSize: 11,
    fontWeight: '400',
    marginTop: 1,
    lineHeight: 14,
  },
});