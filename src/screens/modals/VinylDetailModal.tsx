import React, { useState, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView,
  Alert, Image, TextInput, ActivityIndicator,
} from 'react-native';
import { updateVinyl } from '../../database/database';
import { useTheme } from '../../theme';

interface Props {
  visible: boolean;
  vinyl: any;
  onClose: () => void;
  onDelete: () => void;
  onUpdate: () => void;
}

export default function VinylDetailModal({ visible, vinyl, onClose, onDelete, onUpdate }: Props) {
  const { isDark, colors } = useTheme();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editAlbumName, setEditAlbumName] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editVersion, setEditVersion] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editRating, setEditRating] = useState<number>(0);

  useEffect(() => {
    if (vinyl) {
      setEditAlbumName(vinyl.album_name || '');
      setEditArtist(vinyl.artist || '');
      setEditVersion(vinyl.version || '');
      setEditPrice(vinyl.price != null ? String(vinyl.price) : '');
      setEditNotes(vinyl.notes || '');
      setEditRating(vinyl.personal_rating || 0);
    }
  }, [vinyl]);

  const handleSave = async () => {
    if (!vinyl?.id) return;
    setSaving(true);
    try {
      await updateVinyl(vinyl.id, {
        album_name: editAlbumName,
        artist: editArtist,
        version: editVersion || undefined,
        price: editPrice ? parseFloat(editPrice) : undefined,
        notes: editNotes || undefined,
        personal_rating: editRating > 0 ? editRating : undefined,
      });
      setEditing(false);
      onUpdate();
      Alert.alert('成功', '已保存更改');
    } catch (error) {
      Alert.alert('错误', '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('确认删除', `确定要删除「${vinyl?.album_name}」吗？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: onDelete },
    ]);
  };

  if (!vinyl) return null;

  // 版本标签：拆分为独立 tag（详情页显示全部）
  const versionTags = vinyl.version
    ? [...new Set(vinyl.version.split(',').map((t: string) => t.trim()).filter(Boolean))]
    : [];

  const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: colors.card, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 22, paddingBottom: 34, maxHeight: '88%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
    modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
    closeBtn: { color: colors.accent, fontSize: 17, fontWeight: '600' },
    cover: { width: 180, height: 180, borderRadius: 10, alignSelf: 'center', marginBottom: 22, backgroundColor: colors.inputBg },
    coverImg: { width: 180, height: 180, borderRadius: 10 },
    coverEmoji: { fontSize: 72, textAlign: 'center', lineHeight: 180 },
    field: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: colors.cardBorder },
    label: { color: colors.textSecondary, fontSize: 15, fontWeight: '500', flexShrink: 0 },
    value: { fontSize: 15, fontWeight: '600', color: colors.text, letterSpacing: -0.2, flex: 1, textAlign: 'right' },
    valueSmall: { fontSize: 13, fontWeight: '600', color: colors.text, letterSpacing: -0.2, flex: 1, textAlign: 'right' },
    tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end', flex: 1, maxWidth: '65%' },
    tag: { backgroundColor: 'rgba(249,115,22,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    tagText: { color: '#f97316', fontSize: 12, fontWeight: '600' },
    input: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text, textAlign: 'right', backgroundColor: colors.inputBg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginLeft: 12 },
    inputMulti: { flex: 1, fontSize: 15, fontWeight: '500', color: colors.text, textAlign: 'right', backgroundColor: colors.inputBg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginLeft: 12, minHeight: 60, textAlignVertical: 'top' },
    starRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 12 },
    star: { fontSize: 22 },
    editBtn: { backgroundColor: colors.accent, borderRadius: 10, padding: 15, marginTop: 16 },
    editBtnText: { color: '#fff', fontSize: 17, fontWeight: '600', textAlign: 'center' },
    saveBtn: { backgroundColor: colors.accent, borderRadius: 10, padding: 15, marginTop: 16 },
    saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '600', textAlign: 'center' },
    saveBtnDisabled: { opacity: 0.6 },
    cancelBtn: { backgroundColor: colors.inputBg, borderRadius: 10, padding: 15, marginTop: 10 },
    cancelBtnText: { color: colors.textSecondary, fontSize: 17, fontWeight: '600', textAlign: 'center' },
    syncBtn: { backgroundColor: colors.inputBg, borderRadius: 10, padding: 15, marginTop: 10 },
    syncBtnText: { color: colors.accent, fontSize: 17, fontWeight: '600', textAlign: 'center' },
    deleteBtn: { backgroundColor: 'transparent', padding: 15, marginTop: 10 },
    deleteBtnText: { color: colors.red, fontSize: 17, fontWeight: '600', textAlign: 'center' },
  });

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      {children}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.modalContent}>
          <View style={s.header}>
            <Text style={s.modalTitle}>{editing ? '编辑专辑' : '专辑详情'}</Text>
            <TouchableOpacity onPress={editing ? () => setEditing(false) : onClose}>
              <Text style={s.closeBtn}>{editing ? '取消' : '完成'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 封面 */}
            <View style={s.cover}>
              {vinyl.cover_url ? (
                <Image source={{ uri: vinyl.cover_url, headers: { 'User-Agent': 'MediaVault/1.0' } }} style={s.coverImg} resizeMode="cover" />
              ) : (
                <Text style={s.coverEmoji}>💿</Text>
              )}
            </View>

            {/* 专辑名 */}
            <Field label="专辑名">
              {editing ? (
                <TextInput style={s.input} value={editAlbumName} onChangeText={setEditAlbumName} />
              ) : (
                <Text style={s.value}>{vinyl.album_name}</Text>
              )}
            </Field>

            {/* 艺术家 */}
            <Field label="艺术家">
              {editing ? (
                <TextInput style={s.input} value={editArtist} onChangeText={setEditArtist} />
              ) : (
                <Text style={s.value}>{vinyl.artist}</Text>
              )}
            </Field>

            {/* 发行日期 — 始终展示 */}
            <Field label="发行日期">
              <Text style={s.value}>
                {vinyl.release_date || (vinyl.year ? String(vinyl.year) : '未知')}
              </Text>
            </Field>

            {/* 版本 — tag 样式 */}
            {(versionTags.length > 0 || editing) && (
              <Field label="版本">
                {editing ? (
                  <TextInput style={s.input} value={editVersion} onChangeText={setEditVersion} placeholder="版本信息" placeholderTextColor={colors.textSecondary} />
                ) : (
                  <View style={s.tagWrap}>
                    {versionTags.map((tag: string, i: number) => (
                      <View key={i} style={s.tag}>
                        <Text style={s.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </Field>
            )}

            {/* 条形码 — 始终展示（有值时） */}
            {vinyl.barcode && (
              <Field label="条形码">
                <Text style={s.valueSmall}>{vinyl.barcode}</Text>
              </Field>
            )}

            {/* 国家 */}
            {vinyl.country && (
              <Field label="国家/地区">
                <Text style={s.value}>{vinyl.country}</Text>
              </Field>
            )}

            {/* 厂牌 */}
            {vinyl.label && (
              <Field label="厂牌">
                <Text style={s.value}>{vinyl.label}</Text>
              </Field>
            )}

            {/* 购买日期 */}
            {vinyl.purchase_date && (
              <Field label="购买日期">
                <Text style={s.value}>{vinyl.purchase_date}</Text>
              </Field>
            )}

            {/* 价格 */}
            {(vinyl.price != null || editing) && (
              <Field label="价格">
                {editing ? (
                  <TextInput style={s.input} value={editPrice} onChangeText={setEditPrice} placeholder="0.00" placeholderTextColor={colors.textSecondary} keyboardType="numeric" />
                ) : (
                  <Text style={s.value}>¥{vinyl.price}</Text>
                )}
              </Field>
            )}

            {/* 流派 */}
            {vinyl.genre && (
              <Field label="流派">
                <Text style={s.value}>{vinyl.genre}</Text>
              </Field>
            )}

            {/* 风格 */}
            {vinyl.style && (
              <Field label="风格">
                <Text style={s.value}>{vinyl.style}</Text>
              </Field>
            )}

            {/* 个人评分 */}
            {(vinyl.personal_rating || editing) && (
              <Field label="个人评分">
                {editing ? (
                  <View style={s.starRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity key={star} onPress={() => setEditRating(star === editRating ? 0 : star)}>
                        <Text style={s.star}>{star <= editRating ? '⭐' : '☆'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={s.value}>{'⭐'.repeat(vinyl.personal_rating || 0)}</Text>
                )}
              </Field>
            )}

            {/* 备注 */}
            {(vinyl.notes || editing) && (
              <Field label="备注">
                {editing ? (
                  <TextInput style={s.inputMulti} value={editNotes} onChangeText={setEditNotes} placeholder="添加备注..." placeholderTextColor={colors.textSecondary} multiline numberOfLines={3} />
                ) : (
                  <Text style={s.value}>{vinyl.notes}</Text>
                )}
              </Field>
            )}
          </ScrollView>

          {editing ? (
            <>
              <TouchableOpacity style={[s.saveBtn, saving && s.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>保存更改</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setEditing(false)}>
                <Text style={s.cancelBtnText}>取消编辑</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={s.editBtn} onPress={() => setEditing(true)}>
                <Text style={s.editBtnText}>编辑</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.deleteBtn} onPress={handleDelete}>
                <Text style={s.deleteBtnText}>删除</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
