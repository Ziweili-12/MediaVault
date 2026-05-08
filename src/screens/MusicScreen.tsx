import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getVinyls, deleteVinyl } from '../database/database';
import VinylDetailModal from './modals/VinylDetailModal';
import AddVinylModal from './modals/AddVinylModal';

export default function MusicScreen() {
  const [vinyls, setVinyls] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVinyl, setSelectedVinyl] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    loadVinyls();
  }, []);

  const loadVinyls = async () => {
    try {
      const data = await getVinyls();
      setVinyls(data);
    } catch (error) {
      console.error('❌ Failed to load vinyls:', error);
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
      console.error('❌ Delete failed:', error);
    }
  };

  const renderVinylItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => handleVinylPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.vinylInner}>
        <Text style={styles.vinylEmoji}>💿</Text>
      </View>
      <View style={styles.vinylTitle}>
        <Text style={styles.titleText} numberOfLines={2}>
          {item.album_name}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>我的黑胶</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={vinyls}
        renderItem={renderVinylItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />

      {/* 添加黑胶弹窗 */}
      <AddVinylModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          loadVinyls();
        }}
      />

      {/* 详情弹窗 */}
      <VinylDetailModal
        visible={showDetail}
        vinyl={selectedVinyl}
        onClose={() => setShowDetail(false)}
        onDelete={() => {
          setShowDetail(false);
          if (selectedVinyl) handleDelete(selectedVinyl.id);
        }}
        onUpdate={() => {
          setShowDetail(false);
          loadVinyls();
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
  grid: {
    padding: 16,
    paddingBottom: 100,
  },
  gridItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 5,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  vinylInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
  },
  vinylEmoji: {
    fontSize: 44,
  },
  vinylTitle: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 6,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  titleText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 13,
  },
});
