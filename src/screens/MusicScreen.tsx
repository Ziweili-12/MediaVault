import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, useColorScheme, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getAllVinyls, deleteVinyl } from '../database/database';
import VinylDetailModal from './modals/VinylDetailModal';
import AddVinylModal from './modals/AddVinylModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const themes = {
  dark: { bg: '#000', card: '#1c1c1e', border: 'rgba(255,255,255,0.08)', text: '#fff', secondary: 'rgba(255,255,255,0.55)' },
  light: { bg: '#f2f2f7', card: '#fff', border: 'rgba(0,0,0,0.06)', text: '#000', secondary: 'rgba(0,0,0,0.45)' },
};

export default function MusicScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const c = isDark ? themes.dark : themes.light;

  const [vinyls, setVinyls] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVinyl, setSelectedVinyl] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => { loadVinyls(); }, []);

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

  const renderVinylItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.gridItem, { backgroundColor: c.card, borderColor: c.border }]}
      onPress={() => handleVinylPress(item)}
      activeOpacity={0.85}
    >
      <View style={styles.vinylCover}>
        {item.cover_url ? (
          <Image
            source={{ uri: item.cover_url }}
            style={styles.coverImage}
            resizeMode="cover"
            defaultSource={{ uri: 'https://via.placeholder.com/300' }}
          />
        ) : (
          <View style={[styles.coverPlaceholder, { backgroundColor: '#2c2c2e' }]}>
            <Ionicons name="disc" size={48} color={c.secondary} />
          </View>
        )}
        {item.version && (
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>{item.version}</Text>
          </View>
        )}
      </View>
      <View style={styles.vinylInfo}>
        <Text style={[styles.titleText, { color: c.text }]} numberOfLines={1}>
          {item.album_name}
        </Text>
        <Text style={[styles.artistText, { color: c.secondary }]} numberOfLines={1}>
          {item.artist}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: c.text }]}>我的黑胶</Text>
          <Text style={[styles.headerSub, { color: c.secondary }]}>
            共 {vinyls.length} 张专辑
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)} activeOpacity={0.8}>
          <Ionicons name="plus" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={vinyls}
        renderItem={renderVinylItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.grid}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#0a84ff" />}
        showsVerticalScrollIndicator={false}
      />

      <AddVinylModal visible={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={() => { setShowAddModal(false); loadVinyls(); }} />
      <VinylDetailModal visible={showDetail} vinyl={selectedVinyl} onClose={() => setShowDetail(false)} onDelete={() => { setShowDetail(false); if (selectedVinyl) handleDelete(selectedVinyl.id); }} onUpdate={() => { setShowDetail(false); loadVinyls(); }} />
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
    backgroundColor: '#0a84ff',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0a84ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  grid: { padding: 16, paddingBottom: 100 },
  gridItem: {
    flex: 1,
    margin: 6,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    backgroundColor: '#1c1c1e',
  },
  vinylCover: {
    aspectRatio: 1,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  versionBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  versionText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
  },
  vinylInfo: {
    padding: 10,
    backgroundColor: '#1c1c1e',
  },
  titleText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  artistText: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
    lineHeight: 16,
  },
});