     1|import React, { useEffect, useState } from 'react';
     2|import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
     3|import { Ionicons } from '@expo/vector-icons';
     4|import { getAllVinyls, deleteVinyl } from '../database/database';
     5|import VinylDetailModal from './modals/VinylDetailModal';
     6|import AddVinylModal from './modals/AddVinylModal';
     7|
     8|export default function MusicScreen() {
     9|  const [vinyls, setVinyls] = useState<any[]>([]);
    10|  const [refreshing, setRefreshing] = useState(false);
    11|  const [selectedVinyl, setSelectedVinyl] = useState<any>(null);
    12|  const [showAddModal, setShowAddModal] = useState(false);
    13|  const [showDetail, setShowDetail] = useState(false);
    14|
    15|  useEffect(() => {
    16|    loadVinyls();
    17|  }, []);
    18|
    19|  const loadVinyls = async () => {
    20|    try {
    21|      const data = await getAllVinyls();
    22|      setVinyls(data);
    23|    } catch (error) {
    24|      console.error('❌ Failed to load vinyls:', error);
    25|    }
    26|  };
    27|
    28|  const handleRefresh = async () => {
    29|    setRefreshing(true);
    30|    await loadVinyls();
    31|    setRefreshing(false);
    32|  };
    33|
    34|  const handleVinylPress = (vinyl: any) => {
    35|    setSelectedVinyl(vinyl);
    36|    setShowDetail(true);
    37|  };
    38|
    39|  const handleDelete = async (id: number) => {
    40|    try {
    41|      await deleteVinyl(id);
    42|      await loadVinyls();
    43|    } catch (error) {
    44|      console.error('❌ Delete failed:', error);
    45|    }
    46|  };
    47|
    48|  const renderVinylItem = ({ item }: { item: any }) => (
    49|    <TouchableOpacity
    50|      style={styles.gridItem}
    51|      onPress={() => handleVinylPress(item)}
    52|      activeOpacity={0.8}
    53|    >
    54|      <View style={styles.vinylInner}>
    55|        <Text style={styles.vinylEmoji}>💿</Text>
    56|      </View>
    57|      <View style={styles.vinylTitle}>
    58|        <Text style={styles.titleText} numberOfLines={2}>
    59|          {item.album_name}
    60|        </Text>
    61|      </View>
    62|    </TouchableOpacity>
    63|  );
    64|
    65|  return (
    66|    <View style={styles.container}>
    67|      <View style={styles.header}>
    68|        <Text style={styles.headerTitle}>我的黑胶</Text>
    69|        <TouchableOpacity
    70|          style={styles.addButton}
    71|          onPress={() => setShowAddModal(true)}
    72|        >
    73|          <Text style={styles.addButtonText}>+</Text>
    74|        </TouchableOpacity>
    75|      </View>
    76|
    77|      <FlatList
    78|        data={vinyls}
    79|        renderItem={renderVinylItem}
    80|        keyExtractor={(item) => item.id.toString()}
    81|        numColumns={3}
    82|        contentContainerStyle={styles.grid}
    83|        refreshControl={
    84|          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
    85|        }
    86|      />
    87|
    88|      {/* 添加黑胶弹窗 */}
    89|      <AddVinylModal
    90|        visible={showAddModal}
    91|        onClose={() => setShowAddModal(false)}
    92|        onSuccess={() => {
    93|          setShowAddModal(false);
    94|          loadVinyls();
    95|        }}
    96|      />
    97|
    98|      {/* 详情弹窗 */}
    99|      <VinylDetailModal
   100|        visible={showDetail}
   101|        vinyl={selectedVinyl}
   102|        onClose={() => setShowDetail(false)}
   103|        onDelete={() => {
   104|          setShowDetail(false);
   105|          if (selectedVinyl) handleDelete(selectedVinyl.id);
   106|        }}
   107|        onUpdate={() => {
   108|          setShowDetail(false);
   109|          loadVinyls();
   110|        }}
   111|      />
   112|    </View>
   113|  );
   114|}
   115|
   116|const styles = StyleSheet.create({
   117|  container: {
   118|    flex: 1,
   119|    backgroundColor: '#000',
   120|  },
   121|  header: {
   122|    flexDirection: 'row',
   123|    justifyContent: 'space-between',
   124|    alignItems: 'center',
   125|    paddingHorizontal: 16,
   126|    paddingTop: 24,
   127|    paddingBottom: 16,
   128|  },
   129|  headerTitle: {
   130|    fontSize: 22,
   131|    fontWeight: '700',
   132|    color: '#fff',
   133|    letterSpacing: -0.3,
   134|  },
   135|  addButton: {
   136|    width: 28,
   137|    height: 28,
   138|    backgroundColor: '#0a84ff',
   139|    borderRadius: 14,
   140|    justifyContent: 'center',
   141|    alignItems: 'center',
   142|  },
   143|  addButtonText: {
   144|    color: '#fff',
   145|    fontSize: 20,
   146|    fontWeight: '300',
   147|    lineHeight: 28,
   148|  },
   149|  grid: {
   150|    padding: 16,
   151|    paddingBottom: 100,
   152|  },
   153|  gridItem: {
   154|    flex: 1,
   155|    aspectRatio: 1,
   156|    margin: 5,
   157|    borderRadius: 8,
   158|    overflow: 'hidden',
   159|    backgroundColor: '#1c1c1e',
   160|    borderWidth: 1,
   161|    borderColor: 'rgba(255,255,255,0.08)',
   162|  },
   163|  vinylInner: {
   164|    flex: 1,
   165|    justifyContent: 'center',
   166|    alignItems: 'center',
   167|    backgroundColor: '#1c1c1e',
   168|  },
   169|  vinylEmoji: {
   170|    fontSize: 44,
   171|  },
   172|  vinylTitle: {
   173|    position: 'absolute',
   174|    bottom: 0,
   175|    left: 0,
   176|    right: 0,
   177|    padding: 6,
   178|    backgroundColor: 'rgba(0,0,0,0.85)',
   179|  },
   180|  titleText: {
   181|    color: '#fff',
   182|    fontSize: 11,
   183|    fontWeight: '600',
   184|    lineHeight: 13,
   185|  },
   186|});
   187|