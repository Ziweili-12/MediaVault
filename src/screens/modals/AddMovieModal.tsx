import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useTheme } from '../../theme';
import {
  searchTMDB,
  getTMDBMovieDetails,
  getTMDBPosterUrl,
  formatTMDBForMovie,
  getTMDBImages,
  extractDirectors,
  getTMDBSeasonDetail,
  extractSeasonDirectors,
} from '../../services/api';
import { insertMovie } from '../../database/database';
import { createNotionPage, formatMovieForNotion } from '../../services/api';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function StarRating({
  rating,
  onChange,
  accentColor,
}: {
  rating: number;
  onChange: (r: number) => void;
  accentColor: string;
}) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onChange(star)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
          <Text style={[styles.star, { color: star <= rating ? accentColor : 'rgba(255,255,255,0.2)' }]}>
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// 每季的信息
interface SeasonInfo {
  season_number: number;
  name: string;
  episode_count: number;
  air_date?: string;
  poster_path?: string;
  vote_average?: number;
  directors?: string[];
  cast?: { name: string; original_name: string; character: string }[];
  selected: boolean;
}

export default function AddMovieModal({ visible, onClose, onSuccess }: Props) {
  const { isDark, colors } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<'movie' | 'tv'>('movie');
  const [availablePosters, setAvailablePosters] = useState<string[]>([]);
  const [selectedPosterIndex, setSelectedPosterIndex] = useState(0);
  const [seasons, setSeasons] = useState<SeasonInfo[]>([]);
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form fields
  const [watchDateYear, setWatchDateYear] = useState('');
  const [watchDateMonth, setWatchDateMonth] = useState('');
  const [watchDateDay, setWatchDateDay] = useState('');
  const [personalRating, setPersonalRating] = useState(0);
  const [currentSeason, setCurrentSeason] = useState('');
  const [currentEpisode, setCurrentEpisode] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const results = await searchTMDB(searchQuery);
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
      const type = result.media_type as 'movie' | 'tv';
      setSelectedType(type);

      // 一次调用拿到 details + credits
      const details = await getTMDBMovieDetails(result.id, type);
      if (details) {
        // 从合并的 credits 中提取导演
        const directors = extractDirectors(details, type);
        (details as any)._directors = directors;
        const formatted = formatTMDBForMovie(details, type);
        setSelectedMovie({ ...details, _formatted: formatted });
        setSearchResults([]);
        setSearchQuery('');
      }

      // 获取海报列表
      const posters = await getTMDBImages(result.id, type);
      setAvailablePosters(posters.length > 0 ? posters : [result.poster_path].filter(Boolean));
      setSelectedPosterIndex(0);

      // 获取每季详情（剧集）
      if (type === 'tv') {
        const tvDetails = details as any;
        const rawSeasons = tvDetails.seasons || [];
        const seasonInfos: SeasonInfo[] = [];

        // 先显示基本季信息（快速）
        for (const s of rawSeasons) {
          if (s.season_number === 0) continue; // 跳过特别篇
          seasonInfos.push({
            season_number: s.season_number,
            name: s.name || `第${s.season_number}季`,
            episode_count: s.episode_count || 0,
            air_date: s.air_date || undefined,
            poster_path: s.poster_path || undefined,
            vote_average: s.vote_average || undefined,
            selected: true,
          });
        }
        setSeasons(seasonInfos);

        // 异步加载每季的详细信息（海报、导演、演员）
        setLoadingSeasons(true);
        const updatedSeasons = [...seasonInfos];
        for (let i = 0; i < updatedSeasons.length; i++) {
          try {
            const seasonDetail = await getTMDBSeasonDetail(result.id, updatedSeasons[i].season_number);
            if (seasonDetail) {
              updatedSeasons[i] = {
                ...updatedSeasons[i],
                poster_path: seasonDetail.poster_path || updatedSeasons[i].poster_path,
                air_date: seasonDetail.air_date || updatedSeasons[i].air_date,
                directors: extractSeasonDirectors(seasonDetail),
                cast: (seasonDetail.credits?.cast || []).slice(0, 5).map((c: any) => ({
                  name: c.name,
                  original_name: c.original_name,
                  character: c.character,
                })),
              };
              setSeasons([...updatedSeasons]); // 逐个更新 UI
            }
          } catch (e) {
            // 某季获取失败不影响其他季
          }
        }
        setLoadingSeasons(false);
      } else {
        setSeasons([]);
      }
    } catch (error) {
      Alert.alert('获取详情失败', '请重试');
    } finally {
      setLoading(false);
    }
  };

  const toggleSeason = (index: number) => {
    const updated = [...seasons];
    updated[index].selected = !updated[index].selected;
    setSeasons(updated);
  };

  const buildWatchDate = (): string | undefined => {
    if (!watchDateYear) return undefined;
    const y = watchDateYear.padStart(4, '0');
    const m = watchDateMonth ? watchDateMonth.padStart(2, '0') : '01';
    const d = watchDateDay ? watchDateDay.padStart(2, '0') : '01';
    return `${y}-${m}-${d}`;
  };

  const handleSave = async () => {
    if (!selectedMovie || !selectedMovie._formatted) return;
    setLoading(true);
    try {
      const f = selectedMovie._formatted;
      const selectedPosterPath = availablePosters[selectedPosterIndex] || f.poster_url;
      const directors = (selectedMovie as any)._directors?.join('/') || undefined;
      const watchDate = buildWatchDate();
      const posterUrl = selectedPosterPath
        ? `https://image.tmdb.org/t/p/w500${selectedPosterPath}`
        : f.poster_url;

      if (selectedType === 'tv' && seasons.length > 0) {
        // 剧集：为每个已选中的季创建独立记录
        const selectedSeasons = seasons.filter((s) => s.selected);
        for (const season of selectedSeasons) {
          const seasonPosterUrl = season.poster_path
            ? `https://image.tmdb.org/t/p/w500${season.poster_path}`
            : posterUrl;
          const seasonDirector = season.directors?.join('/') || directors;
          const seasonCast = season.cast?.map((c) => c.original_name || c.name).join('/') || undefined;

          const movieData = {
            title: f.title,
            original_title: f.original_title,
            director: seasonDirector,
            year: season.air_date ? parseInt(season.air_date.substring(0, 4)) : f.year,
            release_date: season.air_date || f.release_date,
            type: 'series' as const,
            tmdb_id: f.tmdb_id,
            imdb_id: f.imdb_id,
            poster_url: seasonPosterUrl,
            genre: f.genre,
            country: f.country,
            runtime: f.runtime,
            imdb_rating: f.imdb_rating,
            personal_rating: personalRating > 0 ? personalRating : undefined,
            watch_date: watchDate,
            current_season: season.season_number,
            current_episode: season.episode_count,
            season_number: season.season_number,
            season_poster: season.poster_path,
            season_air_date: season.air_date,
            parent_tv_id: f.tmdb_id,
            status: 'watched' as const,
          };

          const movieId = await insertMovie(movieData);

          // Sync to Notion
          try {
            const notionProperties = formatMovieForNotion(movieData);
            const pageId = await createNotionPage(
              process.env.EXPO_PUBLIC_NOTION_MOVIES_DB_ID || '',
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
        }
      } else {
        // 电影：直接保存
        const movieData = {
          title: f.title,
          original_title: f.original_title,
          director: directors,
          year: f.year,
          release_date: f.release_date,
          type: 'movie' as const,
          tmdb_id: f.tmdb_id,
          imdb_id: f.imdb_id,
          poster_url: posterUrl,
          genre: f.genre,
          country: f.country,
          runtime: f.runtime,
          imdb_rating: f.imdb_rating,
          personal_rating: personalRating > 0 ? personalRating : undefined,
          watch_date: watchDate,
          status: 'watched' as const,
        };

        const movieId = await insertMovie(movieData);

        try {
          const notionProperties = formatMovieForNotion(movieData);
          const pageId = await createNotionPage(
            process.env.EXPO_PUBLIC_NOTION_MOVIES_DB_ID || '',
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
      }

      const selectedCount = seasons.filter((s) => s.selected).length;
      const msg =
        selectedType === 'tv' && selectedCount > 0
          ? `已添加 ${selectedCount} 季`
          : '影视已添加';
      Alert.alert('成功', msg);
      resetForm();
      onSuccess();
    } catch (error) {
      console.error(error);
      Alert.alert('保存失败', '请重试');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedMovie(null);
    setAvailablePosters([]);
    setSelectedPosterIndex(0);
    setSeasons([]);
    setWatchDateYear('');
    setWatchDateMonth('');
    setWatchDateDay('');
    setPersonalRating(0);
    setCurrentSeason('');
    setCurrentEpisode('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.header}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>添加影视</Text>
              <TouchableOpacity onPress={() => { resetForm(); onClose(); }}>
                <Text style={[styles.closeButton, { color: colors.accent }]}>取消</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="always"
              automaticallyAdjustKeyboardInsets={true}
              showsVerticalScrollIndicator={false}
            >
              {/* ── Search phase ── */}
              {!selectedMovie && (
                <View>
                  <TextInput
                    style={[styles.searchInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                    placeholder="搜索电影或剧集名称..."
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                    autoFocus
                  />

                  {loading && <ActivityIndicator color={colors.accent} style={{ marginTop: 12 }} />}

                  {searchResults.length > 0 && (
                    <Text style={[styles.searchCount, { color: colors.textSecondary }]}>
                      找到 {searchResults.length} 个结果
                    </Text>
                  )}

                  {searchResults.map((item, index) => {
                    const posterUrl = item.poster_path
                      ? `https://image.tmdb.org/t/p/w154${item.poster_path}`
                      : null;
                    const cnTitle = item.media_type === 'movie' ? item.title : item.name;
                    const originalTitle = item.media_type === 'movie' ? item.original_title : item.original_name;
                    const dateStr = item.media_type === 'movie' ? item.release_date : item.first_air_date;
                    const year = dateStr ? dateStr.substring(0, 4) : '';
                    const typeLabel = item.media_type === 'movie' ? '电影' : '剧集';
                    const country = item.origin_country?.join('/') || '';
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[styles.searchResult, { borderBottomColor: colors.cardBorder }]}
                        onPress={() => handleSelectResult(item)}
                      >
                        {posterUrl ? (
                          <Image source={{ uri: posterUrl }} style={styles.resultThumb} resizeMode="cover" />
                        ) : (
                          <View style={[styles.resultThumb, { backgroundColor: colors.inputBg }]}>
                            <Text style={{ fontSize: 18, opacity: 0.5 }}>🎬</Text>
                          </View>
                        )}
                        <View style={styles.resultInfo}>
                          <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={1}>
                            {originalTitle || cnTitle}
                          </Text>
                          {cnTitle && cnTitle !== originalTitle && (
                            <Text style={[styles.resultMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                              {cnTitle}
                            </Text>
                          )}
                          <View style={styles.resultTags}>
                            {year ? <Text style={[styles.resultTag, { color: colors.textSecondary }]}>{year}</Text> : null}
                            {country ? <Text style={[styles.resultTag, { color: colors.textSecondary }]}>{country}</Text> : null}
                            <Text style={[styles.resultTag, { color: item.media_type === 'movie' ? '#3b82f6' : '#f97316' }]}>
                              {typeLabel}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* ── Confirmation / details phase ── */}
              {selectedMovie && (
                <>
                  {/* Poster gallery */}
                  {availablePosters.length > 0 && (
                    <View style={styles.posterGallery}>
                      <Image
                        source={{ uri: `https://image.tmdb.org/t/p/w500${availablePosters[selectedPosterIndex]}` }}
                        style={styles.posterPreview}
                        resizeMode="contain"
                      />
                      {availablePosters.length > 1 && (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          style={styles.posterStrip}
                          contentContainerStyle={styles.posterStripContent}
                        >
                          {availablePosters.map((posterPath, index) => (
                            <TouchableOpacity
                              key={posterPath}
                              onPress={() => setSelectedPosterIndex(index)}
                              style={[
                                styles.posterThumb,
                                index === selectedPosterIndex && styles.posterThumbActive,
                              ]}
                            >
                              <Image
                                source={{ uri: `https://image.tmdb.org/t/p/w154${posterPath}` }}
                                style={styles.posterThumbImg}
                                resizeMode="cover"
                              />
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  )}

                  {/* 基本信息 */}
                  <View style={[styles.confirmSection, { borderBottomColor: colors.cardBorder }]}>
                    <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>英文</Text>
                    <Text style={[styles.confirmValue, { color: colors.text }]}>
                      {selectedMovie._formatted.original_title || '-'}
                    </Text>
                  </View>
                  <View style={[styles.confirmSection, { borderBottomColor: colors.cardBorder }]}>
                    <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>中文</Text>
                    <Text style={[styles.confirmValue, { color: colors.text }]}>
                      {selectedMovie._formatted.title}
                    </Text>
                  </View>
                  <View style={[styles.confirmSection, { borderBottomColor: colors.cardBorder }]}>
                    <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>导演/创作者</Text>
                    <Text style={[styles.confirmValue, { color: colors.text }]} numberOfLines={2}>
                      {(selectedMovie as any)._directors?.join('/') ||
                        (selectedMovie as any).created_by?.map((c: any) => c.name).join('/') || '-'}
                    </Text>
                  </View>
                  <View style={[styles.confirmSection, { borderBottomColor: colors.cardBorder }]}>
                    <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>上映日期</Text>
                    <Text style={[styles.confirmValue, { color: colors.text }]}>
                      {selectedMovie._formatted.release_date ||
                        (selectedMovie._formatted.year ? String(selectedMovie._formatted.year) : '-')}
                    </Text>
                  </View>
                  <View style={[styles.confirmSection, { borderBottomColor: colors.cardBorder }]}>
                    <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>国别</Text>
                    <Text style={[styles.confirmValue, { color: colors.text }]}>
                      {selectedMovie._formatted.country || '-'}
                    </Text>
                  </View>
                  <View style={[styles.confirmSection, { borderBottomColor: colors.cardBorder }]}>
                    <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>类型</Text>
                    <Text style={[styles.confirmValue, { color: colors.text }]}>
                      {selectedMovie._formatted.type === 'movie' ? '电影' : '剧集'}
                    </Text>
                  </View>
                  {selectedMovie._formatted.genre && (
                    <View style={[styles.confirmSection, { borderBottomColor: colors.cardBorder }]}>
                      <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>分类</Text>
                      <Text style={[styles.confirmValue, { color: colors.text }]}>
                        {selectedMovie._formatted.genre}
                      </Text>
                    </View>
                  )}
                  {selectedMovie._formatted.imdb_rating && (
                    <View style={[styles.confirmSection, { borderBottomColor: colors.cardBorder }]}>
                      <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>评分</Text>
                      <Text style={[styles.confirmValue, { color: colors.text }]}>
                        {selectedMovie._formatted.imdb_rating}
                      </Text>
                    </View>
                  )}

                  {/* 观看日期 */}
                  <View style={[styles.confirmSection, { borderBottomColor: colors.cardBorder }]}>
                    <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>观看日期</Text>
                    <View style={styles.dateRow}>
                      <TextInput
                        style={[styles.dateInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.cardBorder }]}
                        placeholder="YYYY"
                        placeholderTextColor={colors.textSecondary}
                        value={watchDateYear}
                        onChangeText={(t) => setWatchDateYear(t.replace(/[^0-9]/g, ''))}
                        keyboardType="numeric"
                        maxLength={4}
                      />
                      <Text style={[styles.dateSep, { color: colors.textSecondary }]}>-</Text>
                      <TextInput
                        style={[styles.dateInput, styles.dateInputSmall, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.cardBorder }]}
                        placeholder="MM"
                        placeholderTextColor={colors.textSecondary}
                        value={watchDateMonth}
                        onChangeText={(t) => setWatchDateMonth(t.replace(/[^0-9]/g, ''))}
                        keyboardType="numeric"
                        maxLength={2}
                      />
                      <Text style={[styles.dateSep, { color: colors.textSecondary }]}>-</Text>
                      <TextInput
                        style={[styles.dateInput, styles.dateInputSmall, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.cardBorder }]}
                        placeholder="DD"
                        placeholderTextColor={colors.textSecondary}
                        value={watchDateDay}
                        onChangeText={(t) => setWatchDateDay(t.replace(/[^0-9]/g, ''))}
                        keyboardType="numeric"
                        maxLength={2}
                      />
                    </View>
                  </View>

                  {/* 剧集：按季分开展示 */}
                  {selectedMovie._formatted.type === 'series' && seasons.length > 0 && (
                    <View style={[styles.confirmSection, { borderBottomColor: colors.cardBorder, flexDirection: 'column', alignItems: 'flex-start' }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>分季列表</Text>
                        {loadingSeasons && (
                          <ActivityIndicator size="small" color={colors.accent} style={{ marginLeft: 8 }} />
                        )}
                      </View>

                      {seasons.map((season, index) => (
                        <TouchableOpacity
                          key={season.season_number}
                          style={[
                            styles.seasonCard,
                            {
                              backgroundColor: season.selected ? 'rgba(59,130,246,0.08)' : 'transparent',
                              borderColor: season.selected ? '#3b82f6' : colors.cardBorder,
                            },
                          ]}
                          onPress={() => toggleSeason(index)}
                          activeOpacity={0.7}
                        >
                          {/* 季海报 */}
                          {season.poster_path ? (
                            <Image
                              source={{ uri: `https://image.tmdb.org/t/p/w154${season.poster_path}` }}
                              style={styles.seasonPoster}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={[styles.seasonPoster, { backgroundColor: colors.inputBg, justifyContent: 'center', alignItems: 'center' }]}>
                              <Text style={{ fontSize: 16, opacity: 0.4 }}>📺</Text>
                            </View>
                          )}

                          {/* 季信息 */}
                          <View style={styles.seasonInfo}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Text style={[styles.seasonName, { color: colors.text }]}>{season.name}</Text>
                              <View
                                style={[
                                  styles.seasonCheck,
                                  {
                                    borderColor: season.selected ? '#3b82f6' : colors.cardBorder,
                                    backgroundColor: season.selected ? '#3b82f6' : 'transparent',
                                  },
                                ]}
                              >
                                {season.selected && <Text style={styles.seasonCheckMark}>✓</Text>}
                              </View>
                            </View>

                            <Text style={[styles.seasonMeta, { color: colors.textSecondary }]}>
                              {season.episode_count}集
                              {season.air_date ? ` · ${season.air_date}` : ''}
                            </Text>

                            {season.directors && season.directors.length > 0 && (
                              <Text style={[styles.seasonDetail, { color: colors.textSecondary }]} numberOfLines={1}>
                                导演: {season.directors.join(' / ')}
                              </Text>
                            )}

                            {season.cast && season.cast.length > 0 && (
                              <Text style={[styles.seasonDetail, { color: colors.textSecondary }]} numberOfLines={1}>
                                主演: {season.cast.map((c) => c.original_name || c.name).join(' / ')}
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Star rating */}
                  <View style={[styles.confirmSection, { borderBottomColor: colors.cardBorder }]}>
                    <Text style={[styles.confirmLabel, { color: colors.textSecondary }]}>个人评分</Text>
                    <StarRating rating={personalRating} onChange={setPersonalRating} accentColor={colors.accent} />
                  </View>
                </>
              )}

              {/* Save button */}
              {selectedMovie && (
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: colors.accent }, loading && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {selectedType === 'tv' && seasons.filter((s) => s.selected).length > 0
                        ? `确认添加 ${seasons.filter((s) => s.selected).length} 季`
                        : '确认添加'}
                    </Text>
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
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 22,
    paddingBottom: 34,
    height: '92%',
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
    letterSpacing: -0.3,
  },
  closeButton: {
    fontSize: 17,
    fontWeight: '600',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  searchInput: {
    width: '100%',
    borderRadius: 10,
    padding: 13,
    fontSize: 16,
    marginBottom: 14,
  },
  searchCount: {
    fontSize: 13,
    marginBottom: 6,
    marginLeft: 2,
  },
  searchResult: {
    padding: 14,
    borderBottomWidth: 0.5,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  resultThumb: {
    width: 52,
    height: 78,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  resultInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  resultMeta: {
    fontSize: 13,
    marginBottom: 4,
  },
  resultTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  resultTag: {
    fontSize: 11,
  },
  posterPreview: {
    width: 120,
    height: 180,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 8,
  },
  posterGallery: {
    alignItems: 'center',
    marginBottom: 16,
  },
  posterStrip: {
    marginTop: 10,
    maxHeight: 72,
  },
  posterStripContent: {
    gap: 8,
    paddingHorizontal: 4,
  },
  posterThumb: {
    width: 44,
    height: 66,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  posterThumbActive: {
    borderColor: '#3b82f6',
  },
  posterThumbImg: {
    width: '100%',
    height: '100%',
  },
  // 季卡片
  seasonCard: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1.5,
    width: '100%',
  },
  seasonPoster: {
    width: 56,
    height: 84,
    borderRadius: 6,
    marginRight: 10,
    overflow: 'hidden',
  },
  seasonInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  seasonName: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  seasonMeta: {
    fontSize: 12,
    marginTop: 4,
  },
  seasonDetail: {
    fontSize: 11,
    marginTop: 2,
  },
  seasonCheck: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  seasonCheckMark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  confirmSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  confirmLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  confirmValue: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    flex: 1,
    textAlign: 'right',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    width: 62,
  },
  dateInputSmall: {
    width: 42,
  },
  dateSep: {
    fontSize: 15,
    fontWeight: '600',
  },
  starRow: {
    flexDirection: 'row',
    gap: 6,
  },
  star: {
    fontSize: 26,
  },
  saveButton: {
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
});
