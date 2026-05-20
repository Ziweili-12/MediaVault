import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, Switch, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import feishuSync from '../services/feishuSync';
import { getAllVinyls, getAllMovies } from '../database/database';

export default function SettingsScreen() {
  const { isDark, colors, toggleTheme } = useTheme();
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');

  // 同步所有数据到飞书
  const handleSyncToFeishu = async () => {
    setSyncing(true);
    setSyncStatus('正在同步...');
    
    try {
      // 获取本地数据
      const vinyls = await getAllVinyls();
      const movies = await getAllMovies();
      
      let vinylCount = 0;
      let movieCount = 0;
      
      // 同步黑胶唱片
      for (const vinyl of vinyls) {
        const result = await feishuSync.syncVinylToFeishu(vinyl);
        if (result) vinylCount++;
      }
      
      // 同步影视
      for (const movie of movies) {
        const result = await feishuSync.syncMovieToFeishu(movie);
        if (result) movieCount++;
      }
      
      setSyncStatus(`同步完成！黑胶 ${vinylCount} 条，影视 ${movieCount} 条`);
      Alert.alert('同步成功', `已同步 ${vinylCount + movieCount} 条数据到飞书`);
    } catch (error) {
      console.error('同步失败:', error);
      setSyncStatus('同步失败');
      Alert.alert('同步失败', '请检查网络连接');
    } finally {
      setSyncing(false);
    }
  };

  // 从飞书恢复数据
  const handleRestoreFromFeishu = async () => {
    Alert.alert(
      '确认恢复',
      '这将从飞书下载数据，会与本地数据合并。继续吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '继续',
          onPress: async () => {
            setSyncing(true);
            setSyncStatus('正在恢复...');
            
            try {
              const feishuVinyls = await feishuSync.getAllVinylsFromFeishu();
              const feishuMovies = await feishuSync.getAllMoviesFromFeishu();
              
              setSyncStatus(`恢复完成！获取黑胶 ${feishuVinyls.length} 条，影视 ${feishuMovies.length} 条`);
              Alert.alert('恢复成功', `从飞书获取 ${feishuVinyls.length + feishuMovies.length} 条数据`);
            } catch (error) {
              console.error('恢复失败:', error);
              setSyncStatus('恢复失败');
              Alert.alert('恢复失败', '请检查网络连接');
            } finally {
              setSyncing(false);
            }
          }
        }
      ]
    );
  };

  // 打开飞书表格
  const handleOpenFeishuSheet = () => {
    Alert.alert(
      '飞书多维表格',
      'App Token: P46XbhU5iaBAtCsafB1cWPmlnJc\n\n你可以在飞书中打开这个表格查看和编辑数据。',
      [{ text: '知道了' }]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>设置</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 外观设置 */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>外观</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon-outline" size={22} color={colors.accent} />
              <Text style={[styles.settingText, { color: colors.text }]}>深色模式</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.inputBg, true: colors.accent }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* 数据同步 */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>数据同步</Text>
          
          <TouchableOpacity style={styles.settingRow} onPress={handleOpenFeishuSheet}>
            <View style={styles.settingLeft}>
              <Ionicons name="cloud-outline" size={22} color={colors.accent} />
              <View>
                <Text style={[styles.settingText, { color: colors.text }]}>飞书云同步</Text>
                <Text style={[styles.settingSubtext, { color: colors.textSecondary }]}>
                  数据自动备份到飞书多维表格
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingRow} 
            onPress={handleSyncToFeishu}
            disabled={syncing}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="cloud-upload-outline" size={22} color={colors.accent} />
              <Text style={[styles.settingText, { color: colors.text }]}>同步到飞书</Text>
            </View>
            {syncing ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingRow} 
            onPress={handleRestoreFromFeishu}
            disabled={syncing}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="cloud-download-outline" size={22} color={colors.accent} />
              <Text style={[styles.settingText, { color: colors.text }]}>从飞书恢复</Text>
            </View>
            {syncing ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            )}
          </TouchableOpacity>

          {syncStatus ? (
            <Text style={[styles.syncStatus, { color: colors.textSecondary }]}>
              {syncStatus}
            </Text>
          ) : null}
        </View>

        {/* 关于 */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>关于</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="information-circle-outline" size={22} color={colors.accent} />
              <Text style={[styles.settingText, { color: colors.text }]}>版本</Text>
            </View>
            <Text style={[styles.settingValue, { color: colors.textSecondary }]}>1.0.0</Text>
          </View>
        </View>

        {/* 底部间距 */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  content: { flex: 1, paddingHorizontal: 16 },
  section: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingText: { fontSize: 16 },
  settingSubtext: { fontSize: 12, marginTop: 2 },
  settingValue: { fontSize: 15 },
  syncStatus: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});
