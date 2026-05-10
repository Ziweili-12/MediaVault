import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { updateVinyl } from '../../database/database';
import { formatVinylForNotion, updateNotionPage } from '../../services/api';

interface Props {
  visible: boolean;
  vinyl: any;
  onClose: () => void;
  onDelete: () => void;
  onUpdate: () => void;
}

export default function VinylDetailModal({ visible, vinyl, onClose, onDelete, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      '确认删除',
      `确定要删除「${vinyl?.album_name}」吗？`,
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
      if (!vinyl.notion_page_id) {
        Alert.alert('提示', '此记录尚未同步到Notion');
        return;
      }

      const properties = formatVinylForNotion(vinyl);
      const success = await updateNotionPage(vinyl.notion_page_id, properties);

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

  if (!vinyl) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.modalTitle}>专辑详情</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>完成</Text>
            </TouchableOpacity>
          </View>

          <ScrollView>
            <View style={styles.coverSquare}>
              <Text style={styles.coverEmoji}>💿</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>专辑名</Text>
              <Text style={styles.fieldValue}>{vinyl.album_name}</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>艺术家</Text>
              <Text style={styles.fieldValue}>{vinyl.artist}</Text>
            </View>

            {vinyl.version && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>版本</Text>
                <Text style={styles.fieldValue}>{vinyl.version}</Text>
              </View>
            )}

            {vinyl.purchase_date && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>购买日期</Text>
                <Text style={styles.fieldValue}>{vinyl.purchase_date}</Text>
              </View>
            )}

            {vinyl.price && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>价格</Text>
                <Text style={styles.fieldValue}>¥{vinyl.price}</Text>
              </View>
            )}

            {vinyl.genre && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>流派</Text>
                <Text style={styles.fieldValue}>{vinyl.genre}</Text>
              </View>
            )}

            {vinyl.personal_rating && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>个人评分</Text>
                <Text style={styles.fieldValue}>
                  {'⭐'.repeat(vinyl.personal_rating)}
                </Text>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.editButton} onPress={() => setEditing(!editing)}>
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
  coverSquare: {
    width: 180,
    height: 180,
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
