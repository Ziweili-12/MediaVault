import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

interface FilterOption {
  id: string;
  label: string;
  value: any;
}

interface SearchFilterProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  filterType: 'music' | 'movie';
  initialFilters?: FilterState;
}

export interface FilterState {
  searchText: string;
  artists: string[];
  years: string[];
  genres: string[];
  minRating: number | null;
  maxRating: number | null;
  sortBy: 'name' | 'date' | 'rating' | 'artist';
  sortOrder: 'asc' | 'desc';
}

const SearchFilter: React.FC<SearchFilterProps> = ({
  visible,
  onClose,
  onApply,
  filterType,
  initialFilters,
}) => {
  const { colors } = useTheme();

  const defaultFilters: FilterState = {
    searchText: '',
    artists: [],
    years: [],
    genres: [],
    minRating: null,
    maxRating: null,
    sortBy: 'date',
    sortOrder: 'desc',
  };

  const [filters, setFilters] = useState<FilterState>(initialFilters || defaultFilters);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // 音乐筛选选项
  const musicFilters = {
    genres: [
      { id: 'rock', label: '摇滚', value: 'Rock' },
      { id: 'pop', label: '流行', value: 'Pop' },
      { id: 'jazz', label: '爵士', value: 'Jazz' },
      { id: 'classical', label: '古典', value: 'Classical' },
      { id: 'electronic', label: '电子', value: 'Electronic' },
      { id: 'hiphop', label: '嘻哈', value: 'Hip-Hop' },
      { id: 'rnb', label: 'R&B', value: 'R&B' },
      { id: 'folk', label: '民谣', value: 'Folk' },
      { id: 'country', label: '乡村', value: 'Country' },
      { id: 'blues', label: '布鲁斯', value: 'Blues' },
    ],
    sortOptions: [
      { id: 'date', label: '添加日期', value: 'date' },
      { id: 'name', label: '专辑名称', value: 'name' },
      { id: 'artist', label: '艺术家', value: 'artist' },
      { id: 'year', label: '发行年份', value: 'year' },
    ],
  };

  // 影视筛选选项
  const movieFilters = {
    genres: [
      { id: 'action', label: '动作', value: 'Action' },
      { id: 'comedy', label: '喜剧', value: 'Comedy' },
      { id: 'drama', label: '剧情', value: 'Drama' },
      { id: 'scifi', label: '科幻', value: 'Sci-Fi' },
      { id: 'horror', label: '恐怖', value: 'Horror' },
      { id: 'romance', label: '爱情', value: 'Romance' },
      { id: 'thriller', label: '惊悚', value: 'Thriller' },
      { id: 'animation', label: '动画', value: 'Animation' },
      { id: 'documentary', label: '纪录片', value: 'Documentary' },
    ],
    sortOptions: [
      { id: 'date', label: '观看日期', value: 'date' },
      { id: 'name', label: '片名', value: 'name' },
      { id: 'year', label: '上映年份', value: 'year' },
      { id: 'rating', label: '评分', value: 'rating' },
    ],
  };

  const currentFilters = filterType === 'music' ? musicFilters : movieFilters;

  // 切换筛选选项
  const toggleArrayFilter = (key: 'artists' | 'years' | 'genres', value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value],
    }));
  };

  // 设置评分范围
  const setRatingRange = (min: number | null, max: number | null) => {
    setFilters(prev => ({
      ...prev,
      minRating: min,
      maxRating: max,
    }));
  };

  // 清除所有筛选
  const clearAllFilters = () => {
    setFilters(defaultFilters);
  };

  // 应用筛选
  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  // 计算激活的筛选数量
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.artists.length > 0) count++;
    if (filters.years.length > 0) count++;
    if (filters.genres.length > 0) count++;
    if (filters.minRating !== null || filters.maxRating !== null) count++;
    return count;
  }, [filters]);

  // 渲染筛选区块
  const renderSection = (
    title: string,
    sectionKey: string,
    content: React.ReactNode
  ) => {
    const isExpanded = expandedSection === sectionKey;

    return (
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setExpandedSection(isExpanded ? null : sectionKey)}
          activeOpacity={0.7}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
        {isExpanded && <View style={styles.sectionContent}>{content}</View>}
      </View>
    );
  };

  // 渲染标签按钮组
  const renderTagGroup = (
    options: FilterOption[],
    selectedValues: string[],
    onToggle: (value: string) => void
  ) => (
    <View style={styles.tagGroup}>
      {options.map(option => {
        const isSelected = selectedValues.includes(option.value);
        return (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.tag,
              {
                backgroundColor: isSelected ? colors.accent : colors.inputBg,
                borderColor: isSelected ? colors.accent : colors.cardBorder,
              },
            ]}
            onPress={() => onToggle(option.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tagText,
                { color: isSelected ? '#fff' : colors.text },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // 渲染评分选择
  const renderRatingSelector = () => {
    const ratings = [null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    return (
      <View>
        <Text style={[styles.subLabel, { color: colors.textSecondary }]}>最低评分</Text>
        <View style={styles.ratingRow}>
          {ratings.map(rating => (
            <TouchableOpacity
              key={`min-${rating}`}
              style={[
                styles.ratingBtn,
                {
                  backgroundColor: filters.minRating === rating ? colors.accent : colors.inputBg,
                },
              ]}
              onPress={() => setRatingRange(rating, filters.maxRating)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.ratingBtnText,
                  { color: filters.minRating === rating ? '#fff' : colors.text },
                ]}
              >
                {rating === null ? '不限' : rating}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.subLabel, { color: colors.textSecondary, marginTop: 12 }]}>最高评分</Text>
        <View style={styles.ratingRow}>
          {ratings.map(rating => (
            <TouchableOpacity
              key={`max-${rating}`}
              style={[
                styles.ratingBtn,
                {
                  backgroundColor: filters.maxRating === rating ? colors.accent : colors.inputBg,
                },
              ]}
              onPress={() => setRatingRange(filters.minRating, rating)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.ratingBtnText,
                  { color: filters.maxRating === rating ? '#fff' : colors.text },
                ]}
              >
                {rating === null ? '不限' : rating}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* 头部 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Text style={[styles.headerBtnText, { color: colors.accent }]}>取消</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            筛选 {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Text>
          <TouchableOpacity onPress={handleApply} style={styles.headerBtn}>
            <Text style={[styles.headerBtnText, { color: colors.accent }]}>应用</Text>
          </TouchableOpacity>
        </View>

        {/* 搜索框 */}
        <View style={[styles.searchBar, { backgroundColor: colors.inputBg }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="搜索..."
            placeholderTextColor={colors.textSecondary}
            value={filters.searchText}
            onChangeText={text => setFilters(prev => ({ ...prev, searchText: text }))}
          />
          {filters.searchText.length > 0 && (
            <TouchableOpacity onPress={() => setFilters(prev => ({ ...prev, searchText: '' }))}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* 筛选内容 */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderSection('类型', 'genres', renderTagGroup(
            currentFilters.genres,
            filters.genres,
            value => toggleArrayFilter('genres', value)
          ))}

          {renderSection('评分', 'rating', renderRatingSelector())}

          {renderSection('排序', 'sort', (
            <View>
              <Text style={[styles.subLabel, { color: colors.textSecondary }]}>排序方式</Text>
              <View style={styles.tagGroup}>
                {currentFilters.sortOptions.map(option => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.tag,
                      {
                        backgroundColor: filters.sortBy === option.value ? colors.accent : colors.inputBg,
                        borderColor: filters.sortBy === option.value ? colors.accent : colors.cardBorder,
                      },
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, sortBy: option.value }))}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        { color: filters.sortBy === option.value ? '#fff' : colors.text },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.subLabel, { color: colors.textSecondary, marginTop: 12 }]}>排序顺序</Text>
              <View style={styles.tagGroup}>
                <TouchableOpacity
                  style={[
                    styles.tag,
                    {
                      backgroundColor: filters.sortOrder === 'desc' ? colors.accent : colors.inputBg,
                      borderColor: filters.sortOrder === 'desc' ? colors.accent : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev, sortOrder: 'desc' }))}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tagText,
                      { color: filters.sortOrder === 'desc' ? '#fff' : colors.text },
                    ]}
                  >
                    降序
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tag,
                    {
                      backgroundColor: filters.sortOrder === 'asc' ? colors.accent : colors.inputBg,
                      borderColor: filters.sortOrder === 'asc' ? colors.accent : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setFilters(prev => ({ ...prev, sortOrder: 'asc' }))}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tagText,
                      { color: filters.sortOrder === 'asc' ? '#fff' : colors.text },
                    ]}
                  >
                    升序
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* 底部按钮 */}
        <View style={[styles.footer, { borderTopColor: colors.cardBorder }]}>
          <TouchableOpacity
            style={[styles.clearBtn, { borderColor: colors.cardBorder }]}
            onPress={clearAllFilters}
            activeOpacity={0.7}
          >
            <Text style={[styles.clearBtnText, { color: colors.text }]}>清除筛选</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.applyBtn, { backgroundColor: colors.accent }]}
            onPress={handleApply}
            activeOpacity={0.7}
          >
            <Text style={styles.applyBtnText}>应用筛选</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerBtn: {
    width: 60,
  },
  headerBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  section: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  tagGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
  },
  subLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  ratingBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  ratingBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    gap: 12,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  clearBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});

export default SearchFilter;
