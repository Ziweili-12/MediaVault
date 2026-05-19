import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, TextInput, Image, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getAllVinyls, deleteVinyl } from '../database/database';
import VinylDetailModal from './modals/VinylDetailModal';
import AddVinylModal from './modals/AddVinylModal';
import { useTheme } from '../theme';
import { DEVICE } from '../utils/deviceAdapter';
import SearchFilter, { FilterState } from '../components/SearchFilter';
import SearchResult from '../components/SearchResult';

const ITEM_MARGIN = DEVICE.GRID_GAP;
const SCREEN_WIDTH = Dimensions.get('window').width;
const NUM_COLUMNS = 2;
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - (DEVICE.IS_SMALL_SCREEN ? 28 : 32) - ITEM_MARGIN) / NUM_COLUMNS;

export default function MusicScreen() {
  const { isDark, colors } = useTheme();
  const navigation = useNavigation();

  const [vinyls, setVinyls] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVinyl, setSelectedVinyl] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'album_name' | 'artist' | 'year' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<FilterState | null>(null);
  const [searchState, setSearchState] = useState<'loading' | 'empty' | 'error' | 'results'>('results');

  useEffect(() => { loadVinyls(); }, []);

  // 每次页面获得焦点时刷新
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadVinyls);
    return unsubscribe;
  }, [navigation]);

  const loadVinyls = async () => {
    try {
      const data = await getAllVinyls();
      setVinyls(data);
    } catch (error) {
      console.error('Failed to load vinyls:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadVinyls();
    setRefreshing(false);
  };

  const handleVinylPress = (vinyl: any) => {
    setSelectedVinyl(vinyl);
    setShowDetail(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteVinyl(id);
      await loadVinyls();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  // 根据搜索关键词过滤 + 高级筛选 + 排序
  const filteredVinyls = useMemo(() => {
    let result = vinyls;
    
    // 基础搜索
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (v) =>
          (v.album_name && v.album_name.toLowerCase().includes(q)) ||
          (v.artist && v.artist.toLowerCase().includes(q))
      );
    }
    
    // 高级筛选
    if (filters) {
      // 类型筛选
      if (filters.genres.length > 0) {
        result = result.filter(v => 
          v.genre && filters.genres.some(g => 
            v.genre.toLowerCase().includes(g.toLowerCase())
          )
        );
      }
      
      // 评分筛选
      if (filters.minRating !== null) {
        result = result.filter(v => (v.personal_rating || 0) >= filters.minRating!);
      }
      if (filters.maxRating !== null) {
        result = result.filter(v => (v.personal_rating || 10) <= filters.maxRating!);
      }
      
      // 更新排序
      if (filters.sortBy) {
        setSortBy(filters.sortBy as any);
      }
      if (filters.sortOrder) {
        setSortOrder(filters.sortOrder);
      }
    }
    
    // 排序
    const sorted = [...result].sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortBy) {
        case 'album_name':
          aVal = (a.album_name || '').toLowerCase();
          bVal = (b.album_name || '').toLowerCase();
          return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        case 'artist':
          aVal = (a.artist || '').toLowerCase();
          bVal = (b.artist || '').toLowerCase();
          return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        case 'year':
          aVal = a.year || 0;
          bVal = b.year || 0;
          return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        case 'created_at':
        default:
          aVal = a.created_at || '';
          bVal = b.created_at || '';
          return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
    });
    return sorted;
  }, [vinyls, searchQuery, filters, sortBy, sortOrder]);

  // 更新搜索状态
  useEffect(() => {
    if (vinyls.length === 0) {
      setSearchState('empty');
    } else if (filteredVinyls.length === 0) {
      setSearchState('empty');
    } else {
      setSearchState('results');
    }
  }, [vinyls, filteredVinyls, searchQuery]);

  const renderGridItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.gridItem, { backgroundColor: colors.card, borderColor: colors.cardBorder, width: GRID_ITEM_WIDTH, height: GRID_ITEM_WIDTH }]}
      onPress={() => handleVinylPress(item)}
      activeOpacity={0.8}
    >
      {item.cover_url ? (
        <Image
          source={{ uri: item.cover_url, headers: { 'User-Agent': 'MediaVault/1.0' } }}
          style={styles.coverImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.coverPlaceholder, { backgroundColor: colors.card }]}>
          <Ionicons name="disc-outline" size={44} color={colors.textSecondary} />
        </View>
      )}
      <View style={styles.gridOverlay}>
        <Text style={styles.overlayTitle} numberOfLines={2}>
          {item.album_name}
        </Text>
        {item.artist ? (
          <Text style={styles.overlaySub} numberOfLines={1}>
            {item.artist}
          </Text>
        ) : null}
        {item.version ? (
          <Text style={styles.overlayTag} numberOfLines={1}>
            {(() => {
              const parts = item.version.split(',').map((t: string) => t.trim()).filter(Boolean);
              const unique = [...new Set(parts)];
              const generic = ['Vinyl', 'LP', 'Album', 'All Media', 'Reissue', 'Special Edition', 'Limited Edition', 'Deluxe Edition', 'Collector\'s Edition', 'Anniversary Edition', 'Remastered Edition', 'Edition', 'Stereo', 'Alternative Cover', 'Mono'];
              const filtered = unique.filter((t: string) => !generic.some(g => t.toLowerCase().includes(g.toLowerCase())));
              return filtered.length > 0 ? filtered.join(' · ') : '';
            })()}
          </Text>
        ) : null}
        {item.release_date || item.year ? (
          <Text style={styles.overlaySub} numberOfLines={1}>
            {item.release_date ? item.release_date.substring(0, 4) : String(item.year)}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  const renderListItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      onPress={() => handleVinylPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.listCoverWrap}>
        {item.cover_url ? (
          <Image
            source={{ uri: item.cover_url, headers: { 'User-Agent': 'MediaVault/1.0' } }}
            style={styles.listCover}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.listCoverPlaceholder, { backgroundColor: colors.inputBg }]}>
            <Ionicons name="disc-outline" size={24} color={colors.textSecondary} />
          </View>
        )}
      </View>
      <View style={styles.listInfo}>
        <Text style={[styles.listTitle, { color: colors.text }]} numberOfLines={1}>
          {item.album_name}
        </Text>
        {item.artist ? (
          <Text style={[styles.listArtist, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.artist}
          </Text>
        ) : null}
        <View style={styles.listMetaRow}>
          {(item.release_date || item.year) && (
            <Text style={[styles.listMetaText, { color: colors.textSecondary }]}>
              {item.release_date || String(item.year)}
            </Text>
          )}
        </View>
        {(item.version) ? (
          <Text style={[styles.listFormat, { color: colors.accent }]} numberOfLines={1}>
            {(() => {
              const parts = item.version.split(',').map((t: string) => t.trim()).filter(Boolean);
              const unique = [...new Set(parts)];
              // 去掉通用格式词，保留特色信息
              const generic = ['Vinyl', 'LP', 'Album', 'All Media', 'Reissue'];
              const filtered = unique.filter((t: string) => !generic.includes(t));
              return filtered.length > 0 ? filtered.join(' · ') : unique.join(' · ');
            })()}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="disc-outline" size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>还没有黑胶唱片</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        点击下方按钮添加你的第一张黑胶
      </Text>
      <TouchableOpacity
        style={[styles.emptyAddButton, { backgroundColor: colors.accent }]}
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.emptyAddText}>添加黑胶</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>黑胶</Text>
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
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.accent }]}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 搜索栏 */}
      <View style={[styles.searchBar, { backgroundColor: colors.inputBg }]}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="搜索专辑或艺术家…"
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

      {/* 搜索结果状态 */}
      {(searchQuery.length > 0 || filters) && (
        <SearchResult
          state={searchState}
          searchText={searchQuery}
          resultCount={filteredVinyls.length}
          onRetry={() => loadVinyls()}
        />
      )}

      {/* 排序控件 */}
      <View style={styles.sortRow}>
        {[
          { key: 'created_at', label: '添加时间' },
          { key: 'album_name', label: '专辑名' },
          { key: 'artist', label: '艺术家' },
          { key: 'year', label: '发行年份' },
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

      {viewMode === 'grid' ? (
        <FlatList
          key="grid"
          data={filteredVinyls}
          renderItem={renderGridItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />
      ) : (
        <FlatList
          key="list"
          data={filteredVinyls}
          renderItem={renderListItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />
      )}

      <AddVinylModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => { setShowAddModal(false); loadVinyls(); }}
      />
      <VinylDetailModal
        visible={showDetail}
        vinyl={selectedVinyl}
        onClose={() => setShowDetail(false)}
        onDelete={() => { setShowDetail(false); if (selectedVinyl) handleDelete(selectedVinyl.id); }}
        onUpdate={() => { setShowDetail(false); loadVinyls(); }}
      />
      
      {/* 高级筛选弹窗 */}
      <SearchFilter
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={(newFilters) => setFilters(newFilters)}
        filterType="music"
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  viewToggle: {
    width: 32, height: 32,
    borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  addButton: {
    width: 40, height: 40,
    borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    marginLeft: 8,
  },

  // 搜索栏
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    marginLeft: 8,
    paddingVertical: 0,
  },
  filterBtn: {
    marginLeft: 8,
    padding: 4,
  },

  // 网格视图
  grid: {
    paddingHorizontal: 16 - ITEM_MARGIN / 2,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'flex-start',
  },
  gridItem: {
    margin: ITEM_MARGIN / 2,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 8,
    paddingBottom: 3,
    paddingHorizontal: 5,
    backgroundColor: 'rgba(0,0,0,0.25)',
    flexDirection: 'column',
    gap: 0,
  },
  overlayTitle: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 11,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  overlaySub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 9,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  overlayTag: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 8,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  overlayTagBadge: {
    marginTop: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },

  // 列表视图
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    padding: 8,
  },
  listCoverWrap: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    flexShrink: 0,
  },
  listCover: {
    width: '100%',
    height: '100%',
  },
  listCoverPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  listInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
    gap: 2,
  },
  listTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  listArtist: {
    fontSize: 11,
  },
  listFormat: {
    fontSize: 10,
    fontWeight: '600',
  },
  listMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  listMetaText: {
    fontSize: 10,
    fontWeight: '500',
  },

  // 排序
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

  // 空状态
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyAddText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
});
