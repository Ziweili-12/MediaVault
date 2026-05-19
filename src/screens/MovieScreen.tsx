import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Image, TextInput, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getAllMovies, deleteMovie } from '../database/database';
import { useTheme } from '../theme';
import MovieDetailModal from './modals/MovieDetailModal';
import AddMovieModal from './modals/AddMovieModal';
import { DEVICE } from '../utils/deviceAdapter';
import SearchFilter, { FilterState } from '../components/SearchFilter';
import SearchResult from '../components/SearchResult';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = DEVICE.GRID_GAP;
const GRID_PADDING = DEVICE.IS_SMALL_SCREEN ? 14 : 16;
const NUM_COLUMNS = 2;
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / NUM_COLUMNS;

export default function MovieScreen() {
  const { isDark, colors } = useTheme();
  const navigation = useNavigation();

  const [movies, setMovies] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [filter, setFilter] = useState<'all' | 'movie' | 'series'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'title' | 'year' | 'created_at' | 'release_date'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<FilterState | null>(null);
  const [searchState, setSearchState] = useState<'loading' | 'empty' | 'error' | 'results'>('results');

  useEffect(() => { loadMovies(); }, [filter]);

  // 每次页面获得焦点时刷新
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadMovies);
    return unsubscribe;
  }, [navigation]);

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

  const filteredMovies = useMemo(() => {
    let result = movies;
    
    // 基础搜索
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((m) => m.title?.toLowerCase().includes(q) || m.original_title?.toLowerCase().includes(q));
    }
    
    // 高级筛选
    if (filters) {
      // 类型筛选
      if (filters.genres.length > 0) {
        result = result.filter(m => 
          m.genre && filters.genres.some(g => 
            m.genre.toLowerCase().includes(g.toLowerCase())
          )
        );
      }
      
      // 评分筛选
      if (filters.minRating !== null) {
        result = result.filter(m => (m.personal_rating || 0) >= filters.minRating!);
      }
      if (filters.maxRating !== null) {
        result = result.filter(m => (m.personal_rating || 10) <= filters.maxRating!);
      }
      
      // 更新排序
      if (filters.sortBy) {
        setSortBy(filters.sortBy as any);
      }
      if (filters.sortOrder) {
        setSortOrder(filters.sortOrder);
      }
    }
    
    const sorted = [...result].sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortBy) {
        case 'title':
          aVal = (a.original_title || a.title || '').toLowerCase();
          bVal = (b.original_title || b.title || '').toLowerCase();
          return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        case 'year':
          aVal = a.year || 0;
          bVal = b.year || 0;
          return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        case 'release_date':
          aVal = a.release_date || '';
          bVal = b.release_date || '';
          return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        case 'created_at':
        default:
          aVal = a.created_at || '';
          bVal = b.created_at || '';
          return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
    });
    return sorted;
  }, [movies, searchQuery, filters, sortBy, sortOrder]);

  // 更新搜索状态
  useEffect(() => {
    if (movies.length === 0) {
      setSearchState('empty');
    } else if (filteredMovies.length === 0) {
      setSearchState('empty');
    } else {
      setSearchState('results');
    }
  }, [movies, filteredMovies, searchQuery]);

  const renderMovieItem = ({ item }: { item: any }) => {
    if (viewMode === 'list') {
      return (
        <TouchableOpacity
          style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={() => handleMoviePress(item)}
          activeOpacity={0.8}
        >
          {item.poster_url ? (
            <Image source={{ uri: item.poster_url }} style={styles.listThumb} resizeMode="cover" />
          ) : (
            <View style={[styles.listThumb, { backgroundColor: colors.inputBg, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ fontSize: 16, opacity: 0.4 }}>🎬</Text>
            </View>
          )}
          <View style={styles.listInfo}>
            <Text style={[styles.listTitle, { color: colors.text }]} numberOfLines={1}>
              {item.original_title || item.title}
            </Text>
            {item.title && item.original_title && item.title !== item.original_title && (
              <Text style={[styles.listSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.title}
              </Text>
            )}
            <View style={styles.listMetaRow}>
              <Text style={[styles.listMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                {[item.release_date || item.year, item.country].filter(Boolean).join(' · ')}
              </Text>
            </View>
            <View style={styles.listTagRow}>
              <View style={[styles.typeTag, { backgroundColor: item.type === 'movie' ? 'rgba(59,130,246,0.15)' : 'rgba(249,115,22,0.15)' }]}>
                <Text style={[styles.typeTagText, { color: item.type === 'movie' ? '#3b82f6' : '#f97316' }]}>
                  {item.type === 'movie' ? '电影' : '剧集'}
                </Text>
              </View>
              {item.season_number != null && (
                <View style={[styles.typeTag, { backgroundColor: 'rgba(249,115,22,0.15)' }]}>
                  <Text style={[styles.typeTagText, { color: '#f97316' }]}>
                    S{item.season_number}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    }
    // Grid mode
    return (
      <TouchableOpacity
        style={[styles.gridItem, { backgroundColor: colors.card, borderColor: colors.cardBorder, width: GRID_ITEM_WIDTH }]}
        onPress={() => handleMoviePress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.movieInner}>
          {item.poster_url ? (
            <Image source={{ uri: item.poster_url }} style={styles.posterImage} resizeMode="cover" />
          ) : (
            <View style={[styles.posterFallback, { backgroundColor: colors.inputBg }]}>
              <Text style={styles.movieEmoji}>🎬</Text>
            </View>
          )}
        </View>
        <View style={styles.movieTitle}>
          <Text style={styles.titleText} numberOfLines={2}>{item.original_title || item.title}</Text>
          <View style={styles.titleMetaRow}>
            {item.year ? <Text style={styles.titleMetaText}>{item.year}</Text> : null}
            <View style={[styles.gridTypeTag, { backgroundColor: item.type === 'movie' ? 'rgba(59,130,246,0.6)' : 'rgba(249,115,22,0.6)' }]}>
              <Text style={styles.gridTypeTagText}>
                {item.type === 'movie' ? '电影' : '剧集'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="film-outline" size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>暂无影视</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>点击右上角 + 添加你的第一部影视</Text>
    </View>
  );

  const segmentLabels: Record<string, string> = { all: '全部', movie: '电影', series: '剧集' };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>影视</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.viewToggle, { backgroundColor: viewMode === 'grid' ? colors.accent : colors.inputBg }]}
            onPress={() => setViewMode('grid')}
            activeOpacity={0.7}
          >
            <Ionicons name="grid" size={16} color={viewMode === 'grid' ? '#fff' : colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggle, { backgroundColor: viewMode === 'list' ? colors.accent : colors.inputBg }]}
            onPress={() => setViewMode('list')}
            activeOpacity={0.7}
          >
            <Ionicons name="list" size={16} color={viewMode === 'list' ? '#fff' : colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.accent }]} onPress={() => setShowAddModal(true)} activeOpacity={0.8}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.inputBg }]}>
          <Ionicons name="search" size={16} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="搜索影视..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.filterBtn}
            onPress={() => setShowFilter(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="options-outline" size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 搜索结果状态 */}
      {(searchQuery.length > 0 || filters) && (
        <SearchResult
          state={searchState}
          searchText={searchQuery}
          resultCount={filteredMovies.length}
          onRetry={() => loadMovies()}
        />
      )}

      {/* Segment control */}
      <View style={styles.segmentContainer}>
        <View style={[styles.segment, { backgroundColor: colors.inputBg }]}>
          {(['all', 'movie', 'series'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.segmentItem,
                filter === type && { backgroundColor: colors.accent, borderRadius: 6 },
              ]}
              onPress={() => setFilter(type)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.segmentText,
                { color: colors.textSecondary },
                filter === type && { color: '#fff' },
              ]}>
                {segmentLabels[type]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 排序控件 */}
      <View style={styles.sortRow}>
        {[
          { key: 'created_at', label: '添加时间' },
          { key: 'title', label: '名称' },
          { key: 'release_date', label: '上映日期' },
        ].map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.sortChip, sortBy === opt.key && { backgroundColor: colors.accent }]}
            onPress={() => {
              if (sortBy === opt.key) {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy(opt.key as any);
                setSortOrder('desc');
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.sortChipText, { color: sortBy === opt.key ? '#fff' : colors.textSecondary }]}>
              {opt.label}
            </Text>
            {sortBy === opt.key && (
              <Text style={{ color: '#fff', fontSize: 10, marginLeft: 2 }}>
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredMovies}
        renderItem={renderMovieItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={viewMode === 'grid' ? NUM_COLUMNS : 1}
        key={viewMode}
        contentContainerStyle={viewMode === 'grid' ? styles.grid : styles.list}
        columnWrapperStyle={viewMode === 'grid' ? styles.row : undefined}
        ListEmptyComponent={renderEmptyState}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      />

      <AddMovieModal visible={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={() => { setShowAddModal(false); loadMovies(); }} />
      <MovieDetailModal visible={showDetail} movie={selectedMovie} onClose={() => setShowDetail(false)} onDelete={() => { setShowDetail(false); if (selectedMovie) handleDelete(selectedMovie.id); }} onUpdate={() => { setShowDetail(false); loadMovies(); }} />
      
      {/* 高级筛选弹窗 */}
      <SearchFilter
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={(newFilters) => setFilters(newFilters)}
        filterType="movie"
        initialFilters={filters || undefined}
      />
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewToggle: {
    width: 32, height: 32,
    borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  addButton: {
    width: 40, height: 40,
    borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  searchContainer: { paddingHorizontal: 16, marginBottom: 10 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 38,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  filterBtn: {
    marginLeft: 8,
    padding: 4,
  },
  segmentContainer: { paddingHorizontal: 16, marginBottom: 12 },
  segment: {
    flexDirection: 'row', borderRadius: 8, padding: 2,
  },
  segmentItem: { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: 6 },
  segmentText: { fontSize: 14, fontWeight: '500' },

  // Grid mode
  grid: { paddingHorizontal: GRID_PADDING, paddingBottom: 100 },
  row: { justifyContent: 'space-between' },
  gridItem: {
    aspectRatio: 2/3,
    marginBottom: GRID_GAP,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
  },
  movieInner: { flex: 1 },
  posterImage: { width: '100%', height: '100%' },
  posterFallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  movieEmoji: { fontSize: 44 },
  movieTitle: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingVertical: 5,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  titleText: {
    color: '#fff', fontSize: 9, fontWeight: '600', lineHeight: 11,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  titleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  titleMetaText: {
    color: 'rgba(255,255,255,0.8)', fontSize: 9,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  gridTypeTag: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  gridTypeTagText: {
    color: '#fff', fontSize: 8, fontWeight: '700',
  },

  // List mode
  list: { paddingHorizontal: GRID_PADDING, paddingBottom: 100 },
  listItem: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  listThumb: {
    width: 52,
    height: 78,
    borderRadius: 6,
    overflow: 'hidden',
  },
  listInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  listSubtitle: {
    fontSize: 13,
    marginBottom: 4,
  },
  listMeta: {
    fontSize: 12,
  },
  listMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  listTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  typeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeTagText: {
    fontSize: 10,
    fontWeight: '600',
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySubtitle: { fontSize: 14, marginTop: 6 },
  sortRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 6,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(128,128,128,0.1)',
  },
  sortChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
