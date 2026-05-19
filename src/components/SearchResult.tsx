import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

type SearchState = 'loading' | 'empty' | 'error' | 'results';

interface SearchResultProps {
  state: SearchState;
  searchText?: string;
  resultCount?: number;
  onRetry?: () => void;
  errorMessage?: string;
}

const SearchResult: React.FC<SearchResultProps> = ({
  state,
  searchText = '',
  resultCount = 0,
  onRetry,
  errorMessage = '网络连接失败，请检查网络设置',
}) => {
  const { colors } = useTheme();

  if (state === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          搜索中...
        </Text>
      </View>
    );
  }

  if (state === 'error') {
    return (
      <View style={styles.container}>
        <View style={[styles.iconContainer, { backgroundColor: '#ff375f' + '15' }]}>
          <Ionicons name="cloud-offline-outline" size={48} color="#ff375f" />
        </View>
        <Text style={[styles.errorTitle, { color: colors.text }]}>
          网络错误
        </Text>
        <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
          {errorMessage}
        </Text>
        {onRetry && (
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.accent }]}
            onPress={onRetry}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.retryBtnText}>重试</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (state === 'empty') {
    return (
      <View style={styles.container}>
        <View style={[styles.iconContainer, { backgroundColor: colors.inputBg }]}>
          <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          未找到结果
        </Text>
        <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
          {searchText
            ? `没有找到与"${searchText}"相关的内容`
            : '暂无内容'}
        </Text>
        <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
          尝试使用不同的关键词搜索
        </Text>
      </View>
    );
  }

  // state === 'results'
  return (
    <View style={styles.resultHeader}>
      <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
        找到 {resultCount} 个结果
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  emptyHint: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  resultHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultCount: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default SearchResult;
