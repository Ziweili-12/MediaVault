import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
            <View style={styles.searchContainer}>
              <View style={styles.searchHeadArea}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="搜索电影或剧集名称..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  autoFocus
                />
              </View>
              <View style={styles.searchResultsArea}>
                {loading && <View style={styles.loadingContainer}><ActivityIndicator color="#30d158" /></View>}
                {!loading && searchResults.length > 0 && <Text style={styles.searchCount}>找到 {searchResults.length} 个结果</Text>}
                {searchResults.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.searchResult}
                    onPress={() => handleSelectResult(item)}
                  >
                    {item.Poster !== 'N/A' ? (
                      <Image
                        source={{ uri: item.Poster }}
                        style={styles.resultThumb}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.resultThumbPlaceholder}>
                        <Ionicons name="film" size={20} color="rgba(255,255,255,0.3)" />
                      </View>
                    )}
                    <View style={styles.resultInfo}>
                      <Text style={styles.resultTitle}>{item.Title}</Text>
                      <Text style={styles.resultSubtitle}>
                        {item.Year} • {item.Type === 'movie' ? '电影' : '剧集'}
                        {item.imdbRating && <Text> • IMDb {item.imdbRating}</Text>}
                      </Text>
                    </View>
                    <Ionicons name="chevron-right" size={18} color="rgba(255,255,255,0.3)" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {selectedMovie && (
            <>
              <View style={styles.confirmCoverSection}>
                {selectedMovie.Poster !== 'N/A' ? (
                  <Image
                    source={{ uri: selectedMovie.Poster }}
                    style={styles.confirmPoster}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.confirmPosterPlaceholder}>
                    <Ionicons name="film" size={64} color="rgba(255,255,255,0.3)" />
                  </View>
                )}
                <View style={styles.confirmTypeBadge}>
                  <Text style={styles.confirmTypeText}>{selectedMovie.Type === 'movie' ? '电影' : '剧集'}</Text>
                </View>
              </View>

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
              {selectedMovie.Genre !== 'N/A' && (
                <View style={styles.confirmSection}>
                  <Text style={styles.confirmLabel}>类型</Text>
                  <Text style={styles.confirmValue}>{selectedMovie.Genre}</Text>
                </View>
              )}
              {selectedMovie.Runtime !== 'N/A' && (
                <View style={styles.confirmSection}>
                  <Text style={styles.confirmLabel}>时长</Text>
                  <Text style={styles.confirmValue}>{selectedMovie.Runtime}</Text>
                </View>
              )}
              {selectedMovie.imdbRating !== 'N/A' && (
                <View style={styles.confirmSection}>
                  <Text style={styles.confirmLabel}>IMDb评分</Text>
                  <Text style={styles.confirmValue}>{selectedMovie.imdbRating}</Text>
                </View>
              )}

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
                <Text style={styles.saveButtonText}>添加到收藏</Text>
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 40,
    height: '90%',
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
  searchInput: {
    width: '100%',
    backgroundColor: '#2c2c2e',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 16,
  },
  searchResultsArea: {
    paddingBottom: 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  searchCount: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  searchResult: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#2c2c2e',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  resultThumb: {
    width: 56,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#3c3c3e',
  },
  resultThumbPlaceholder: {
    width: 56,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#3c3c3e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultInfo: {
    flex: 1,
    marginLeft: 14,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 3,
    lineHeight: 18,
  },
  resultSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 16,
  },
  confirmCoverSection: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 24,
  },
  confirmPoster: {
    width: 160,
    height: 240,
    borderRadius: 16,
    backgroundColor: '#2c2c2e',
  },
  confirmPosterPlaceholder: {
    width: 160,
    height: 240,
    borderRadius: 16,
    backgroundColor: '#2c2c2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmTypeBadge: {
    position: 'absolute',
    top: 12,
    left: '50%',
    transform: [{ translateX: -60 }],
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  confirmTypeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  confirmSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.06)',
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
    marginLeft: 20,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
    marginLeft: 20,
  },
  saveButton: {
    backgroundColor: '#30d158',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    shadowColor: '#30d158',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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