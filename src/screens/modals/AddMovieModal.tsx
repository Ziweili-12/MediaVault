import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { searchOMDBByTitle, getOMDBMovieDetails } from '../../services/api';
import { insertMovie } from '../../database/database';
import { createNotionPage, formatMovieForNotion } from '../../services/api';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddMovieModal({ visible, onClose, onSuccess }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 表单数据
  const [watchDate, setWatchDate] = useState('');
  const [personalRating, setPersonalRating] = useState('');
  const [currentSeason, setCurrentSeason] = useState('');
  const [currentEpisode, setCurrentEpisode] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const results = await searchOMDBByTitle(searchQuery);
      setSearchResults(results);
    } catch (error) {
      Alert.alert('搜索失败', '请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResult = async (result: any) => {
    setLoading(true);
    try {
      const details = await getOMDBMovieDetails(result.imdbID);
      if (details) {
        setSelectedMovie(details);
        setSearchResults([]);
        setSearchQuery('');
      }
    } catch (error) {
      Alert.alert('获取详情失败', '请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedMovie) return;

    setLoading(true);
    try {
      const movieData = {
        title: selectedMovie.Title,
        director: selectedMovie.Director !== 'N/A' ? selectedMovie.Director : undefined,
        year: selectedMovie.Year ? parseInt(selectedMovie.Year) : undefined,
        type: selectedMovie.Type === 'movie' ? 'movie' as const : 'series' as const,
        imdb_id: selectedMovie.imdbID,
        poster_url: selectedMovie.Poster !== 'N/A' ? selectedMovie.Poster : undefined,
        genre: selectedMovie.Genre !== 'N/A' ? selectedMovie.Genre : undefined,
        runtime: selectedMovie.Runtime ? parseInt(selectedMovie.Runtime) : undefined,
        imdb_rating: selectedMovie.imdbRating !== 'N/A' ? parseFloat(selectedMovie.imdbRating) : undefined,
        personal_rating: personalRating ? parseInt(personalRating) : undefined,
        watch_date: watchDate || undefined,
        current_season: currentSeason ? parseInt(currentSeason) : undefined,
        current_episode: currentEpisode ? parseInt(currentEpisode) : undefined,
        status: 'watched' as const,
      };

      const movieId = await insertMovie(movieData);

      // 同步到Notion（可选）
      try {
        const notionProperties = formatMovieForNotion(movieData);
        const pageId = await createNotionPage(
          process.env.NOTION_MOVIES_DB_ID || '',
          notionProperties,
          movieData.poster_url
        );

        if (pageId) {
          const { updateMovie } = require('../../database/database');
          await updateMovie(movieId, { notion_page_id: pageId });
        }
      } catch (error) {
        console.log('⚠️ Notion sync skipped:', error);
      }

      Alert.alert('成功', '影视已添加');
      resetForm();
      onSuccess();
    } catch (error) {
      Alert.alert('保存失败', '请重试');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedMovie(null);
    setWatchDate('');
    setPersonalRating('');
    setCurrentSeason('');
    setCurrentEpisode('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.modalTitle}>添加影视</Text>
              <TouchableOpacity onPress={() => { resetForm(); onClose(); }}>
                <Text style={styles.closeButton}>取消</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >

          {!selectedMovie && (
            <>
              <TextInput
                style={styles.searchInput}
                placeholder="搜索电影或剧集名称..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                autoFocus
              />
              {loading && <ActivityIndicator color="#0a84ff" />}
              <FlatList
                data={searchResults}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.searchResult}
                    onPress={() => handleSelectResult(item)}
                  >
                    <View style={styles.resultThumb} />
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultTitle}>{item.Title}</Text>
                      <Text style={styles.resultSubtitle}>
                        {item.Year} • {item.Type === 'movie' ? '电影' : '剧集'}
                        {item.imdbRating ? ` • IMDb ${item.imdbRating}` : ''}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.imdbID}
              />
            </>
          )}

          {selectedMovie && (
            <>
              <View style={styles.confirmSection}>
                <Text style={styles.confirmLabel}>标题</Text>
                <Text style={styles.confirmValue}>{selectedMovie.Title}</Text>
              </View>
              <View style={styles.confirmSection}>
                <Text style={styles.confirmLabel}>导演</Text>
                <Text style={styles.confirmValue}>{selectedMovie.Director !== 'N/A' ? selectedMovie.Director : 'N/A'}</Text>
              </View>
              <View style={styles.confirmSection}>
                <Text style={styles.confirmLabel}>年份</Text>
                <Text style={styles.confirmValue}>{selectedMovie.Year}</Text>
              </View>
              <View style={styles.confirmSection}>
                <Text style={styles.confirmLabel}>类型</Text>
                <Text style={styles.confirmValue}>{selectedMovie.Type === 'movie' ? '电影' : '剧集'}</Text>
              </View>

              <View style={styles.confirmSection}>
                <Text style={styles.confirmLabel}>观看日期</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={watchDate}
                  onChangeText={setWatchDate}
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
              </View>

              {selectedMovie.Type === 'series' && (
                <>
                  <View style={styles.confirmSection}>
                    <Text style={styles.confirmLabel}>当前季数</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      value={currentSeason}
                      onChangeText={setCurrentSeason}
                      keyboardType="numeric"
                      maxLength={2}
                      placeholderTextColor="rgba(255,255,255,0.3)"
                    />
                  </View>
                  <View style={styles.confirmSection}>
                    <Text style={styles.confirmLabel}>当前集数</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      value={currentEpisode}
                      onChangeText={setCurrentEpisode}
                      keyboardType="numeric"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                    />
                  </View>
                </>
              )}

              <View style={styles.confirmSection}>
                <Text style={styles.confirmLabel}>个人评分 (1-5)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={personalRating}
                  onChangeText={setPersonalRating}
                  keyboardType="numeric"
                  maxLength={1}
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
              </View>
            </>
          )}

          {selectedMovie && (
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>确认添加</Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
        </View>
      </View>
      </KeyboardAvoidingView>
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
    color: '#0a84ff',
    fontSize: 17,
    fontWeight: '600',
  },
  searchInput: {
    width: '100%',
    backgroundColor: '#2c2c2e',
    borderRadius: 10,
    padding: 13,
    color: '#fff',
    fontSize: 16,
    marginBottom: 14,
  },
  searchResult: {
    padding: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    gap: 12,
  },
  resultThumb: {
    width: 46,
    height: 46,
    borderRadius: 6,
    backgroundColor: '#2c2c2e',
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 18,
  },
  confirmSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  confirmLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 15,
    fontWeight: '500',
  },
  confirmValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: -0.2,
    flex: 1,
    textAlign: 'right',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
  },
  saveButton: {
    backgroundColor: '#0a84ff',
    borderRadius: 10,
    padding: 15,
    marginTop: 16,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

});