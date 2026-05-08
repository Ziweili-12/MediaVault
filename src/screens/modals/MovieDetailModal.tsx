import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { updateMovie } from '../database/database';
import { formatMovieForNotion, updateNotionPage } from '../services/api';

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

          <ScrollView>
            <View style={styles.coverPortrait}>
              <Text style={styles.coverEmoji}>🎬</Text>
            </View>

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

            {movie.type && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>类型</Text>
                <Text style={styles.fieldValue}>{movie.type === 'movie' ? '电影' : '剧集'}</Text>
              </View>
            )}

            {movie.genre && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>分类</Text>
                <Text style={styles.fieldValue}>{movie.genre}</Text>
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
                    <Text style={styles.fieldValue}>{movie.current_season}</Text>
                  </View>
                )}
                {movie.current_episode && (
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>当前集数</Text>
                    <Text style={styles.fieldValue}>{movie.current_episode}</Text>
                  </View>
                )}
              </>
            )}
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 22,
    paddingBottom: 34,
    maxHeight: '82%',
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
    color: '#0a84ff',
    fontSize: 17,
    fontWeight: '600',
  },
  coverPortrait: {
    width: 160,
    height: 240,
    borderRadius: 10,
    marginHorizontal: 'auto',
    marginBottom: 22,
    backgroundColor: '#2c2c2e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  coverEmoji: {
    fontSize: 72,
  },
  field: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.08)',
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
  },
  editButton: {
    backgroundColor: '#0a84ff',
    borderRadius: 10,
    padding: 15,
    marginTop: 16,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  syncButton: {
    backgroundColor: '#2c2c2e',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
  },
  syncButtonText: {
    color: '#0a84ff',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: 'transparent',
    padding: 15,
    marginTop: 10,
  },
  deleteButtonText: {
    color: '#ff375f',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
});
