import React, { useMemo } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  FlatList, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import type { Vinyl } from '../../database/schema';

interface ArtistItem {
  name: string;
  count: number;
}

interface Props {
  visible: boolean;
  artistName: string;
  vinyls: Vinyl[];
  artists?: ArtistItem[];
  onClose: () => void;
  onVinylPress: (vinyl: Vinyl) => void;
  onArtistPress?: (artistName: string) => void;
}

export default function ArtistDetailModal({ visible, artistName, vinyls, artists = [], onClose, onVinylPress, onArtistPress }: Props) {
  const { isDark, colors } = useTheme();

  const showArtistList = !artistName;

  const sortedVinyls = useMemo(() => {
    return [...vinyls].sort((a, b) => {
      const ya = a.year ?? 0;
      const yb = b.year ?? 0;
      return ya - yb;
    });
  }, [vinyls]);

  const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 22, borderTopRightRadius: 22,
      padding: 22, paddingBottom: 34,
      maxHeight: '88%',
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    modalTitle: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
    closeBtn: { color: colors.accent, fontSize: 17, fontWeight: '600' },
    artistNameStyle: {
      fontSize: 26, fontWeight: '800', color: colors.text,
      letterSpacing: -0.5, marginBottom: 4,
    },
    countText: {
      fontSize: 14, color: colors.textSecondary, marginBottom: 18,
      fontWeight: '500',
    },
    // List item styles (matching MusicScreen)
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 10,
      overflow: 'hidden',
      borderWidth: 1,
      padding: 8,
      backgroundColor: colors.card,
      borderColor: colors.cardBorder,
      marginBottom: 6,
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
      backgroundColor: colors.inputBg,
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
      color: colors.text,
    },
    listArtist: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    listFormat: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.accent,
    },
    listMetaRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 2,
    },
    listMetaText: {
      fontSize: 10,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    // Artist list item
    artistRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 4,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.cardBorder,
    },
    artistRowName: { fontSize: 15, fontWeight: '600', color: colors.text, letterSpacing: -0.2 },
    artistRowCount: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
    emptyText: { textAlign: 'center', fontSize: 13, color: colors.textSecondary, paddingVertical: 40 },
  });

  const renderVinylItem = ({ item }: { item: Vinyl }) => {
    const year = item.year ? String(item.year) : (item.release_date ? item.release_date.substring(0, 4) : null);
    const allTags = item.version
      ? [...new Set(item.version.split(',').map((t: string) => t.trim()).filter(Boolean))]
      : [];
    const generic = ['Vinyl', 'LP', 'Album', 'All Media', 'Reissue', 'Single Sided'];
    const filteredTags = allTags.filter(t => !generic.includes(t));
    const displayTags = filteredTags.length > 0 ? filteredTags : allTags;

    return (
      <TouchableOpacity style={s.listItem} activeOpacity={0.8} onPress={() => onVinylPress(item)}>
        <View style={s.listCoverWrap}>
          {item.cover_url ? (
            <Image
              source={{ uri: item.cover_url, headers: { 'User-Agent': 'MediaVault/1.0' } }}
              style={s.listCover}
              resizeMode="cover"
            />
          ) : (
            <View style={s.listCoverPlaceholder}>
              <Ionicons name="disc-outline" size={24} color={colors.textSecondary} />
            </View>
          )}
        </View>
        <View style={s.listInfo}>
          <Text style={s.listTitle} numberOfLines={1}>
            {item.album_name}
          </Text>
          {item.artist ? (
            <Text style={s.listArtist} numberOfLines={1}>
              {item.artist}
            </Text>
          ) : null}
          <View style={s.listMetaRow}>
            {(item.release_date || item.year) && (
              <Text style={s.listMetaText}>
                {item.release_date || String(item.year)}
              </Text>
            )}
          </View>
          {item.version ? (
            <Text style={s.listFormat} numberOfLines={1}>
              {(() => {
                const parts = item.version.split(',').map((t: string) => t.trim()).filter(Boolean);
                const unique = [...new Set(parts)];
                const genericWords = ['Vinyl', 'LP', 'Album', 'All Media', 'Reissue'];
                const filtered = unique.filter((t: string) => !genericWords.includes(t));
                return filtered.length > 0 ? filtered.join(' · ') : unique.join(' · ');
              })()}
            </Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  const renderArtistItem = ({ item }: { item: ArtistItem }) => (
    <TouchableOpacity
      style={s.artistRow}
      activeOpacity={0.6}
      onPress={() => onArtistPress?.(item.name)}
    >
      <Text style={s.artistRowName}>{item.name}</Text>
      <Text style={s.artistRowCount}>{item.count}张收藏 ›</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.modalContent}>
          <View style={s.header}>
            <Text style={s.modalTitle}>{showArtistList ? '艺术家列表' : '艺术家详情'}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={s.closeBtn}>完成</Text>
            </TouchableOpacity>
          </View>

          {showArtistList ? (
            <>
              <Text style={s.artistNameStyle}>所有艺术家</Text>
              <Text style={s.countText}>{artists.length} 位艺术家</Text>
              {artists.length === 0 ? (
                <Text style={s.emptyText}>暂无艺术家</Text>
              ) : (
                <FlatList
                  data={artists}
                  keyExtractor={(item) => item.name}
                  renderItem={renderArtistItem}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 8 }}
                />
              )}
            </>
          ) : (
            <>
              <Text style={s.artistNameStyle}>{artistName}</Text>
              <Text style={s.countText}>{vinyls.length} 张专辑收藏</Text>
              {sortedVinyls.length === 0 ? (
                <Text style={s.emptyText}>暂无专辑</Text>
              ) : (
                <FlatList
                  data={sortedVinyls}
                  keyExtractor={(item) => String(item.id)}
                  renderItem={renderVinylItem}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 8 }}
                />
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
