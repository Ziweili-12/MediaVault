import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView,
  Alert, TextInput, Image, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../theme';
import { updateMovie } from '../../database/database';
import { getTMDBImages } from '../../services/api';

interface Props {
  visible: boolean;
  movie: any;
  onClose: () => void;
  onDelete: () => void;
  onUpdate: () => void;
}

function StarRating({
  rating, onChange, accentColor,
}: {
  rating: number; onChange: (r: number) => void; accentColor: string;
}) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onChange(star)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
          <Text style={[styles.star, { color: star <= rating ? accentColor : 'rgba(255,255,255,0.2)' }]}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function MovieDetailModal({ visible, movie, onClose, onDelete, onUpdate }: Props) {
  const { isDark, colors } = useTheme();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [editTitle, setEditTitle] = useState('');
  const [editDirector, setEditDirector] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editRating, setEditRating] = useState(0);
  const [editWatchDateYear, setEditWatchDateYear] = useState('');
  const [editWatchDateMonth, setEditWatchDateMonth] = useState('');
  const [editWatchDateDay, setEditWatchDateDay] = useState('');

  // Poster editing
  const [availablePosters, setAvailablePosters] = useState<string[]>([]);
  const [selectedPosterIndex, setSelectedPosterIndex] = useState(0);
  const [loadingPosters, setLoadingPosters] = useState(false);

  useEffect(() => {
    if (movie && editing) {
      setEditTitle(movie.title || '');
      setEditDirector(movie.director || '');
      setEditNotes(movie.notes || '');
      setEditRating(movie.personal_rating || 0);
      // Parse watch date
      if (movie.watch_date) {
        const parts = movie.watch_date.split('-');
        setEditWatchDateYear(parts[0] || '');
        setEditWatchDateMonth(parts[1] || '');
        setEditWatchDateDay(parts[2] || '');
      } else {
        setEditWatchDateYear('');
        setEditWatchDateMonth('');
        setEditWatchDateDay('');
      }
      // Load posters
      if (movie.tmdb_id && movie.type) {
        loadPosters();
      }
    }
  }, [movie, editing]);

  const loadPosters = async () => {
    if (!movie?.tmdb_id) return;
    setLoadingPosters(true);
    try {
      const type = movie.type === 'movie' ? 'movie' : 'tv';
      const posters = await getTMDBImages(movie.tmdb_id, type);
      setAvailablePosters(posters.length > 0 ? posters : []);
      // Find current poster index
      const currentPath = movie.poster_url?.match(/\/t\/p\/w\d+(\/.+)$/)?.[1];
      if (currentPath) {
        const idx = posters.indexOf(currentPath);
        setSelectedPosterIndex(idx >= 0 ? idx : 0);
      }
    } catch (e) {
      console.error('Failed to load posters:', e);
    } finally {
      setLoadingPosters(false);
    }
  };

  if (!movie) return null;

  const handleDelete = () => {
    Alert.alert('确认删除', `确定要删除「${movie.title}」吗？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: onDelete },
    ]);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      Alert.alert('提示', '标题不能为空');
      return;
    }
    setSaving(true);
    try {
      const updateData: any = {
        title: editTitle.trim(),
        director: editDirector.trim() || undefined,
        notes: editNotes.trim() || undefined,
        personal_rating: editRating > 0 ? editRating : undefined,
      };
      // Watch date
      if (editWatchDateYear) {
        const y = editWatchDateYear.padStart(4, '0');
        const m = editWatchDateMonth ? editWatchDateMonth.padStart(2, '0') : '01';
        const d = editWatchDateDay ? editWatchDateDay.padStart(2, '0') : '01';
        updateData.watch_date = `${y}-${m}-${d}`;
      }
      // Poster
      if (availablePosters.length > 0 && selectedPosterIndex < availablePosters.length) {
        updateData.poster_url = `https://image.tmdb.org/t/p/w500${availablePosters[selectedPosterIndex]}`;
      }
      await updateMovie(movie.id, updateData);
      Alert.alert('成功', '已保存修改');
      setEditing(false);
      onUpdate();
    } catch (error) {
      Alert.alert('错误', '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const FieldRow = ({ label, value }: { label: string; value: string }) => (
    <View style={[styles.field, { borderBottomColor: colors.cardBorder }]}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.fieldValue, { color: colors.text }]}>{value}</Text>
    </View>
  );

  const seasonLabel = movie.season_number 
    ? `Season ${movie.season_number}` 
    : movie.current_season 
      ? `Season ${movie.current_season}` 
      : null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editing ? '编辑影视' : '影视详情'}
            </Text>
            <TouchableOpacity onPress={editing ? () => setEditing(false) : onClose}>
              <Text style={[styles.closeButton, { color: colors.accent }]}>
                {editing ? '取消' : '完成'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Poster - view or edit */}
            {!editing ? (
              movie.poster_url ? (
                <Image source={{ uri: movie.poster_url }} style={styles.coverPortrait} resizeMode="contain" />
              ) : (
                <View style={[styles.coverPortrait, styles.coverPlaceholder, { backgroundColor: colors.inputBg, borderColor: colors.cardBorder }]}>
                  <Text style={styles.coverEmoji}>🎬</Text>
                </View>
              )
            ) : (
              /* Poster selection in edit mode */
              <View style={styles.posterEditSection}>
                {loadingPosters ? (
                  <ActivityIndicator color={colors.accent} style={{ marginVertical: 20 }} />
                ) : availablePosters.length > 0 ? (
                  <>
                    <Image
                      source={{ uri: `https://image.tmdb.org/t/p/w500${availablePosters[selectedPosterIndex]}` }}
                      style={styles.coverPortrait}
                      resizeMode="contain"
                    />
                    <Text style={[styles.posterHint, { color: colors.textSecondary }]}>点击缩略图更换海报</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.posterStrip} contentContainerStyle={styles.posterStripContent}>
                      {availablePosters.slice(0, 10).map((path, index) => (
                        <TouchableOpacity
                          key={path}
                          onPress={() => setSelectedPosterIndex(index)}
                          style={[styles.posterThumb, index === selectedPosterIndex && styles.posterThumbActive]}
                        >
                          <Image source={{ uri: `https://image.tmdb.org/t/p/w154${path}` }} style={styles.posterThumbImg} resizeMode="cover" />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </>
                ) : (
                  movie.poster_url ? (
                    <Image source={{ uri: movie.poster_url }} style={styles.coverPortrait} resizeMode="contain" />
                  ) : null
                )}
              </View>
            )}

            {/* View mode */}
            {!editing && (
              <>
                {(() => {
                  const isChineseMovie = movie.country &&
                    (movie.country.includes('中国') || movie.country.includes('China') ||
                     movie.country.includes('香港') || movie.country.includes('台湾'));
                  const hasBoth = movie.original_title && movie.original_title !== movie.title;
                  if (isChineseMovie) {
                    return (
                      <>
                        <FieldRow label="标题" value={movie.title} />
                        {hasBoth && <FieldRow label="英文" value={movie.original_title} />}
                      </>
                    );
                  } else {
                    return (
                      <>
                        {hasBoth && <FieldRow label="标题" value={movie.original_title} />}
                        <FieldRow label="中文" value={movie.title} />
                      </>
                    );
                  }
                })()}
                {seasonLabel && <FieldRow label="Season" value={seasonLabel} />}
                {movie.director && <FieldRow label="导演/创作者" value={movie.director} />}
                {(movie.release_date || movie.year) && (
                  <FieldRow label="上映日期" value={movie.release_date || String(movie.year)} />
                )}
                {movie.season_air_date && movie.season_air_date !== movie.release_date && (
                  <FieldRow label="开播日期" value={movie.season_air_date} />
                )}
                {movie.country && <FieldRow label="国别" value={movie.country} />}
                {movie.type && <FieldRow label="类型" value={movie.type === 'movie' ? '电影' : '剧集'} />}
                {movie.genre && <FieldRow label="分类" value={movie.genre} />}
                {movie.imdb_rating && <FieldRow label="评分" value={String(movie.imdb_rating)} />}
                {movie.type === 'series' && movie.current_episode != null && (
                  <FieldRow label="集数" value={`${movie.current_episode}集`} />
                )}
                {movie.watch_date && <FieldRow label="观看日期" value={movie.watch_date} />}
                {movie.personal_rating > 0 && (
                  <View style={[styles.field, { borderBottomColor: colors.cardBorder }]}>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>个人评分</Text>
                    <Text style={[styles.fieldValue, { color: colors.accent }]}>
                      {'★'.repeat(movie.personal_rating)}{'☆'.repeat(5 - movie.personal_rating)}
                    </Text>
                  </View>
                )}
                {movie.notes && (
                  <View style={[styles.field, { borderBottomColor: colors.cardBorder }]}>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>备注</Text>
                    <Text style={[styles.fieldValue, { color: colors.text }]}>{movie.notes}</Text>
                  </View>
                )}
              </>
            )}

            {/* Edit mode */}
            {editing && (
              <>
                {/* Title */}
                <View style={[styles.editField, { borderBottomColor: colors.cardBorder }]}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>标题</Text>
                  <TextInput
                    style={[styles.editInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.cardBorder }]}
                    value={editTitle}
                    onChangeText={setEditTitle}
                    placeholder="影片标题"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                {/* Director */}
                <View style={[styles.editField, { borderBottomColor: colors.cardBorder }]}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>导演/创作者</Text>
                  <TextInput
                    style={[styles.editInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.cardBorder }]}
                    value={editDirector}
                    onChangeText={setEditDirector}
                    placeholder="导演名称"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                {/* Watch date */}
                <View style={[styles.editField, { borderBottomColor: colors.cardBorder }]}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>观看日期</Text>
                  <View style={styles.dateRow}>
                    <TextInput
                      style={[styles.dateInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.cardBorder }]}
                      placeholder="YYYY" placeholderTextColor={colors.textSecondary}
                      value={editWatchDateYear} onChangeText={(t) => setEditWatchDateYear(t.replace(/[^0-9]/g, ''))}
                      keyboardType="numeric" maxLength={4}
                    />
                    <Text style={[styles.dateSep, { color: colors.textSecondary }]}>-</Text>
                    <TextInput
                      style={[styles.dateInput, styles.dateInputSmall, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.cardBorder }]}
                      placeholder="MM" placeholderTextColor={colors.textSecondary}
                      value={editWatchDateMonth} onChangeText={(t) => setEditWatchDateMonth(t.replace(/[^0-9]/g, ''))}
                      keyboardType="numeric" maxLength={2}
                    />
                    <Text style={[styles.dateSep, { color: colors.textSecondary }]}>-</Text>
                    <TextInput
                      style={[styles.dateInput, styles.dateInputSmall, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.cardBorder }]}
                      placeholder="DD" placeholderTextColor={colors.textSecondary}
                      value={editWatchDateDay} onChangeText={(t) => setEditWatchDateDay(t.replace(/[^0-9]/g, ''))}
                      keyboardType="numeric" maxLength={2}
                    />
                  </View>
                </View>

                {/* Rating */}
                <View style={[styles.editField, { borderBottomColor: colors.cardBorder }]}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>个人评分</Text>
                  <StarRating rating={editRating} onChange={setEditRating} accentColor={colors.accent} />
                </View>

                {/* Notes */}
                <View style={[styles.editField, { borderBottomColor: colors.cardBorder }]}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>备注</Text>
                  <TextInput
                    style={[styles.editInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.cardBorder, minHeight: 60, textAlignVertical: 'top' }]}
                    value={editNotes} onChangeText={setEditNotes}
                    placeholder="添加备注..." placeholderTextColor={colors.textSecondary}
                    multiline
                  />
                </View>
              </>
            )}
          </ScrollView>

          {/* Action buttons */}
          {editing ? (
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.accent }, saving && styles.buttonDisabled]}
              onPress={handleSaveEdit} disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>保存修改</Text>}
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={[styles.editButton, { backgroundColor: colors.accent }]} onPress={() => setEditing(true)}>
                <Text style={styles.editButtonText}>编辑</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <Text style={[styles.deleteButtonText, { color: colors.red }]}>删除</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 22, paddingBottom: 34, maxHeight: '88%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  modalTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  closeButton: { fontSize: 17, fontWeight: '600' },
  coverPortrait: { width: 160, height: 240, borderRadius: 10, alignSelf: 'center', marginBottom: 22 },
  coverPlaceholder: { justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  coverEmoji: { fontSize: 72 },
  posterEditSection: { alignItems: 'center', marginBottom: 16 },
  posterHint: { fontSize: 12, marginBottom: 8 },
  posterStrip: { maxHeight: 72, marginTop: 4 },
  posterStripContent: { gap: 8, paddingHorizontal: 4 },
  posterThumb: { width: 44, height: 66, borderRadius: 4, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  posterThumbActive: { borderColor: '#3b82f6' },
  posterThumbImg: { width: '100%', height: '100%' },
  field: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 0.5 },
  fieldLabel: { fontSize: 15, fontWeight: '500' },
  fieldValue: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2, flex: 1, textAlign: 'right' },
  editField: { paddingVertical: 12, borderBottomWidth: 0.5 },
  editInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 15, fontWeight: '600', marginTop: 6 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  dateInput: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6, fontSize: 14, fontWeight: '600', textAlign: 'center', width: 62 },
  dateInputSmall: { width: 42 },
  dateSep: { fontSize: 15, fontWeight: '600' },
  starRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  star: { fontSize: 26 },
  editButton: { borderRadius: 10, padding: 15, marginTop: 16 },
  editButtonText: { color: '#fff', fontSize: 17, fontWeight: '600', textAlign: 'center' },
  saveButton: { borderRadius: 10, padding: 15, marginTop: 16 },
  saveButtonText: { color: '#fff', fontSize: 17, fontWeight: '600', textAlign: 'center' },
  buttonDisabled: { opacity: 0.6 },
  syncButton: { borderRadius: 10, padding: 15, marginTop: 10 },
  syncButtonText: { fontSize: 17, fontWeight: '600', textAlign: 'center' },
  deleteButton: { padding: 15, marginTop: 10 },
  deleteButtonText: { fontSize: 17, fontWeight: '600', textAlign: 'center' },
});
