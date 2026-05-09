import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getAllVinyls, deleteVinyl } from '../database/database';
import VinylDetailModal from './modals/VinylDetailModal';
import AddVinylModal from './modals/AddVinylModal';

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
      activeOpacity={0.8}
    >
      <View style={[styles.vinylInner, { backgroundColor: c.card }]}>
        <Text style={styles.vinylEmoji}>{item.cover_url ? null : '💿'}</Text>
      </View>
      <View style={styles.vinylTitle}>
        <Text style={styles.titleText} numberOfLines={2}>{item.album_name}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: c.text }]}>我的黑胶</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)} activeOpacity={0.8}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={vinyls}
        renderItem={renderVinylItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
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
  grid: { padding: 16, paddingBottom: 100 },
  gridItem: {
    flex: 1, aspectRatio: 1,
    margin: 5, borderRadius: 8, overflow: 'hidden',
    borderWidth: 1,
  },
  vinylInner: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  vinylEmoji: { fontSize: 44 },
  vinylTitle: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 6,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  titleText: { color: '#fff', fontSize: 11, fontWeight: '600', lineHeight: 13 },
});
