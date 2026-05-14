import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updateMovie } from '../../database/database';
import { formatMovieForNotion, updateNotionPage } from '../../services/api';

interface Props {
  visible: boolean;
  movie: any;
  onClose: () => void;
  onDelete: () => void;
  onUpdate: () => void;
}

export default function MovieDetailModal({ visible, movie, onClose, onDelete, onUpdate }: Props) {
  if (!movie) return null;

  const handleDelete = () => {
    Alert.alert(
      '确认删除',
      `确定要删除「${movie.title}」吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    );
  };

  const handleSyncToNotion = async () => {
    try {
      if (!movie.notion_page_id) {
        Alert.alert('提示', '此记录尚未同步到Notion');
        return;
      }

      const properties = formatMovieForNotion(movie);
      const success = await updateNotionPage(movie.notion_page_id, properties);

      if (success) {
        Alert.alert('成功', '已同步到Notion');
        onUpdate();
      } else {
        Alert.alert('失败', '同步到Notion失败');
      }
    } catch (error) {
      Alert.alert('错误', '同步失败');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.modalTitle}>影视详情</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>完成</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.posterSection}>
              {movie.poster_url ? (
                <Image
                  source={{ uri: movie.poster_url }}
                  style={styles.posterImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.posterPlaceholder}>
                  <Ionicons name="film" size={64} color="rgba(255,255,255,0.3)" />
                </View>
              )}
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>{movie.type === 'movie' ? '电影' : '剧集'}</Text>
              </View>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>标题</Text>
                <Text style={styles.fieldValue}>{movie.title}</Text>
              </View>

              {movie.director && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>导演</Text>
                  <Text style={styles.fieldValue}>{movie.director}</Text>
                </View>
              )}

              {movie.year && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>年份</Text>
                  <Text style={styles.fieldValue}>{movie.year}</Text>
                </View>
              )}

              {movie.genre && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>类型</Text>
                  <Text style={styles.fieldValue}>{movie.genre}</Text>
                </View>
              )}

              {movie.runtime && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>时长</Text>
                  <Text style={styles.fieldValue}>{movie.runtime} 分钟</Text>
                </View>
              )}

              {movie.imdb_rating && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>IMDb评分</Text>
                  <Text style={styles.fieldValue}>{movie.imdb_rating}</Text>
                </View>
              )}

              {movie.watch_date && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>观看日期</Text>
                  <Text style={styles.fieldValue}>{movie.watch_date}</Text>
                </View>
              )}

              {movie.personal_rating && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>个人评分</Text>
                  <Text style={styles.fieldValue}>{'⭐'.repeat(movie.personal_rating)}</Text>
                </View>
              )}

              {movie.type === 'series' && (
                <>
                  {movie.current_season && (
                    <View style={styles.field}>
                      <Text style={styles.fieldLabel}>当前季数</Text>
                      <Text style={styles.fieldValue}>第 {movie.current_season} 季</Text>
                    </View>
                  )}
                  {movie.current_episode && (
                    <View style={styles.field}>
                      <Text style={styles.fieldLabel}>当前集数</Text>
                      <Text style={styles.fieldValue}>第 {movie.current_episode} 集</Text>
                    </View>
                  )}
                </>
              )}

              {movie.notes && (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>备注</Text>
                  <Text style={styles.fieldValue}>{movie.notes}</Text>
                </View>
              )}
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.editButton} onPress={onUpdate}>
            <Text style={styles.editButtonText}>编辑</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.syncButton} onPress={handleSyncToNotion}>
            <Text style={styles.syncButtonText}>同步到Notion</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>删除</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
  },
  closeButton: {
    color: '#30d158',
    fontSize: 17,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingBottom: 20,
  },
  posterSection: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 24,
  },
  posterImage: {
    width: 160,
    height: 240,
    borderRadius: 16,
    backgroundColor: '#2c2c2e',
  },
  posterPlaceholder: {
    width: 160,
    height: 240,
    borderRadius: 16,
    backgroundColor: '#2c2c2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    position: 'absolute',
    top: 12,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  infoSection: {
    paddingHorizontal: 4,
  },
  field: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  fieldLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 15,
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: -0.2,
    flex: 1,
    textAlign: 'right',
    marginLeft: 20,
  },
  editButton: {
    backgroundColor: '#30d158',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    shadowColor: '#30d158',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  syncButton: {
    backgroundColor: '#2c2c2e',
    borderRadius: 14,
    padding: 16,
    marginTop: 10,
  },
  syncButtonText: {
    color: '#30d158',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: 'transparent',
    padding: 16,
    marginTop: 10,
  },
  deleteButtonText: {
    color: '#ff375f',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
});