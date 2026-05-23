import React, { useState, useRef } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet, TextInput,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
  Image, ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { insertVinyl, updateVinyl } from '../../database/database';
import { searchDiscogsByBarcode, searchDiscogsByQuery, getDiscogsRelease } from '../../services/api';
import { useTheme } from '../../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddVinylModal({ visible, onClose, onSuccess }: Props) {
  const { isDark, colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<'welcome' | 'scan' | 'search' | 'confirm'>('welcome');
  const [scanning, setScanning] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const lastScannedCode = useRef<string>('');
  const scanTimer = useRef<NodeJS.Timeout | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedRelease, setSelectedRelease] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [purchaseDate, setPurchaseDate] = useState('');
  const [price, setPrice] = useState('');
  const [personalRating, setPersonalRating] = useState<number>(0);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    // 连续识别3次相同条码才确认，提高准确度
    if (lastScannedCode.current === data) {
      setScanCount(prev => prev + 1);
    } else {
      lastScannedCode.current = data;
      setScanCount(1);
    }

    // 清除之前的定时器
    if (scanTimer.current) clearTimeout(scanTimer.current);
    // 2秒内没有继续扫到相同码则重置
    scanTimer.current = setTimeout(() => {
      lastScannedCode.current = '';
      setScanCount(0);
    }, 2000);

    if (scanCount < 2) return; // 需要扫到3次

    setScanning(false);
    setScanCount(0);
    lastScannedCode.current = '';
    setLoading(true);
    try {
      const release = await searchDiscogsByBarcode(data);
      if (release) { setSelectedRelease(release); setStep('confirm'); }
      else { Alert.alert('未找到', '该条形码未找到对应专辑，请手动搜索'); setStep('search'); }
    } catch (error) {
      Alert.alert('扫描失败', '请重试或手动搜索');
      setStep('search');
    } finally { setLoading(false); }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const results = await searchDiscogsByQuery(searchQuery);
      setSearchResults(results);
    } catch (error) { Alert.alert('搜索失败', '请重试'); }
    finally { setLoading(false); }
  };

  const handleSelectResult = async (result: any) => {
    setLoading(true);
    try {
      const release = await getDiscogsRelease(result.id);
      if (release) { setSelectedRelease(release); setStep('confirm'); }
    } catch (error) { Alert.alert('获取详情失败', '请重试'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!selectedRelease) return;
    setLoading(true);
    try {
      const barcodeFromIdentifiers = selectedRelease.identifiers
        ?.filter((i: any) => i.type === 'Barcode')
        ?.map((i: any) => i.value)
        ?.join(', ') || '';

      // 格式化日期：YYYYMMDD → YYYY-MM-DD
      const normalizeDate = (d: string | undefined): string | undefined => {
        if (!d) return undefined;
        const cleaned = d.replace(/[^0-9]/g, '');
        if (cleaned.length === 8) return `${cleaned.slice(0,4)}-${cleaned.slice(4,6)}-${cleaned.slice(6,8)}`;
        if (cleaned.length === 6) return `${cleaned.slice(0,4)}-${cleaned.slice(4,6)}-01`;
        if (cleaned.length === 4) return `${cleaned}-01-01`;
        return d; // 已经是 YYYY-MM-DD 或其他格式
      };

      // 遍历所有 formats 提取版本信息（含颜色等 text 字段）
      const versionParts: string[] = [];
      if (selectedRelease.formats) {
        for (const fmt of selectedRelease.formats) {
          if (fmt.descriptions) versionParts.push(...fmt.descriptions);
          if (fmt.text) versionParts.push(fmt.text);
        }
      }
      // 去重
      const uniqueVersionParts = [...new Set(versionParts)];

      console.log('📀 Discogs release data:', {
        released: selectedRelease.released,
        year: selectedRelease.year,
        formats_count: selectedRelease.formats?.length,
        format_texts: selectedRelease.formats?.map((f: any) => f.text).filter(Boolean),
      });

      const vinylData = {
        album_name: selectedRelease.title.split(' - ')[1] || selectedRelease.title,
        artist: selectedRelease.artists?.[0]?.name || 'Unknown',
        version: uniqueVersionParts.join(', ') || '',
        cover_url: selectedRelease.images?.find((i: any) => i.type === 'primary')?.uri
          || selectedRelease.images?.[0]?.uri || '',
        release_id: selectedRelease.id,
        barcode: barcodeFromIdentifiers || selectedRelease.barcode?.[0] || '',
        purchase_date: normalizeDate(purchaseDate),
        price: price ? parseFloat(price) : undefined,
        personal_rating: personalRating > 0 ? personalRating : undefined,
        genre: selectedRelease.genres?.join(', ') || '',
        year: selectedRelease.year || undefined,
        release_date: selectedRelease.released || undefined,
        country: selectedRelease.country || undefined,
        label: selectedRelease.labels?.[0]?.name || undefined,
        style: selectedRelease.styles?.join(', ') || undefined,
      };

      const vinylId = await insertVinyl(vinylData);

      Alert.alert('成功', '黑胶已添加');
      resetForm();
      onSuccess();
    } catch (error) { Alert.alert('保存失败', '请重试'); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setStep('welcome'); setSearchQuery(''); setSearchResults([]);
    setSelectedRelease(null); setPurchaseDate(''); setPrice(''); setPersonalRating(0);
  };

  // 搜索结果渲染 — 条状布局
  const renderSearchResult = ({ item, index }: { item: any; index: number }) => {
    const titleParts = item.title?.split(' - ') || [];
    const artist = titleParts[0] || '';
    const album = titleParts.slice(1).join(' - ') || item.title || '';
    const year = item.year || '';
    const country = item.country || '';
    // 版本 tags — 遍历所有 formats
    const versionTags: string[] = [];
    if (item.formats) {
      for (const fmt of item.formats) {
        if (fmt.descriptions) versionTags.push(...fmt.descriptions);
        if (fmt.text) versionTags.push(fmt.text);
      }
    }
    const uniqueVersionTags = [...new Set(versionTags)];
    // 缩略图：优先 thumb（小图加载快），回退 cover_image
    const thumbUrl = item.thumb || item.cover_image || '';

    return (
      <TouchableOpacity
        key={index}
        style={[styles.resultBar, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        onPress={() => handleSelectResult(item)}
        activeOpacity={0.7}
      >
        {/* 缩略图 */}
        <View style={styles.resultThumbWrap}>
          {thumbUrl ? (
            <Image
              source={{ uri: thumbUrl, headers: { 'User-Agent': 'MediaVault/1.0' } }}
              style={styles.resultThumb}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.resultThumb, { backgroundColor: colors.inputBg, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ fontSize: 20, opacity: 0.4 }}>♫</Text>
            </View>
          )}
        </View>

        {/* 信息 */}
        <View style={styles.resultInfo}>
          <Text style={[styles.resultAlbum, { color: colors.text }]} numberOfLines={1}>{album}</Text>
          <Text style={[styles.resultArtist, { color: colors.textSecondary }]} numberOfLines={1}>{artist}</Text>
          <View style={styles.resultMeta}>
            {year ? <Text style={[styles.resultMetaText, { color: colors.textSecondary }]}>{year}</Text> : null}
            {country ? <Text style={[styles.resultMetaText, { color: colors.textSecondary }]}>· {country}</Text> : null}
          </View>
          {/* 版本 tags */}
          {uniqueVersionTags.length > 0 && (
            <View style={styles.tagRow}>
              {uniqueVersionTags.map((tag, i) => (
                <View key={i} style={[styles.tag, { backgroundColor: 'rgba(249,115,22,0.12)' }]}>
                  <Text style={[styles.tagText, { color: '#f97316' }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <Text style={[styles.resultArrow, { color: colors.textSecondary }]}>›</Text>
      </TouchableOpacity>
    );
  };

  // 确认页中的版本 tags — 遍历所有 formats
  const confirmVersionTags: string[] = [];
  if (selectedRelease?.formats) {
    for (const fmt of selectedRelease.formats) {
      if (fmt.descriptions) confirmVersionTags.push(...fmt.descriptions);
      if (fmt.text) confirmVersionTags.push(fmt.text);
    }
  }
  const uniqueConfirmVersionTags = [...new Set(confirmVersionTags)];

  const ts = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    modal: { backgroundColor: colors.card, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 22, paddingBottom: 34, height: '92%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
    title: { fontSize: 20, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
    closeBtn: { color: colors.accent, fontSize: 17, fontWeight: '600' },
    welcome: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 },
    welcomeTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
    welcomeSub: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
    welcomeBtn: { width: '100%', borderRadius: 12, padding: 16, alignItems: 'center' },
    welcomeBtnText: { color: '#fff', fontSize: 17, fontWeight: '600' },
    welcomeBtnOutline: { width: '100%', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: colors.cardBorder },
    welcomeBtnOutlineText: { fontSize: 17, fontWeight: '600', color: colors.text },
    cameraWrap: { flex: 1, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000' },
    camera: { flex: 1 },
    scanOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
    scanFrame: { width: 300, height: 180, borderWidth: 2, borderColor: '#fff', borderRadius: 12 },
    scanHint: { position: 'absolute', bottom: 40, color: '#fff', fontSize: 14, fontWeight: '500', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    searchInput: { width: '100%', borderRadius: 10, padding: 13, fontSize: 16, marginBottom: 14, backgroundColor: colors.inputBg, color: colors.text },
    searchCount: { fontSize: 13, color: colors.textSecondary, marginBottom: 8, marginLeft: 2 },
    confirmSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: colors.cardBorder },
    confirmLabel: { fontSize: 15, fontWeight: '500', color: colors.textSecondary },
    confirmValue: { fontSize: 15, fontWeight: '600', color: colors.text, letterSpacing: -0.2, maxWidth: '60%', textAlign: 'right' },
    confirmTagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end', flex: 1, maxWidth: '65%' },
    confirmTag: { backgroundColor: 'rgba(249,115,22,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    confirmTagText: { color: '#f97316', fontSize: 12, fontWeight: '600' },
    starRow: { flexDirection: 'row', gap: 6 },
    star: { fontSize: 26 },
    saveBtn: { backgroundColor: colors.accent, borderRadius: 10, padding: 15, marginTop: 16 },
    saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '600', textAlign: 'center' },
    saveBtnDisabled: { opacity: 0.6 },
  });

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={ts.overlay}>
          <View style={ts.modal}>
            <View style={ts.header}>
              <Text style={ts.title}>添加黑胶</Text>
              <TouchableOpacity onPress={() => { resetForm(); onClose(); }}>
                <Text style={ts.closeBtn}>取消</Text>
              </TouchableOpacity>
            </View>

            {step === 'welcome' && (
              <View style={ts.welcome}>
                <Text style={ts.welcomeTitle}>添加新黑胶</Text>
                <Text style={ts.welcomeSub}>扫描条形码自动识别，{'\n'}或手动搜索专辑名称</Text>
                <TouchableOpacity style={[ts.welcomeBtn, { backgroundColor: colors.accent }]}
                  onPress={async () => {
                    if (!permission?.granted) {
                      const r = await requestPermission();
                      if (!r.granted) { Alert.alert('需要相机权限', '请在设置中允许访问相机'); return; }
                    }
                    setStep('scan'); setScanning(true); setScanCount(0); lastScannedCode.current = '';
                  }}>
                  <Text style={ts.welcomeBtnText}>📷 扫描条形码</Text>
                </TouchableOpacity>
                <TouchableOpacity style={ts.welcomeBtnOutline} onPress={() => setStep('search')}>
                  <Text style={ts.welcomeBtnOutlineText}>🔍 手动搜索</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 'scan' && (
              <View style={ts.cameraWrap}>
                {scanning ? (
                  <>
                    <CameraView style={ts.camera} facing="back" onBarcodeScanned={handleBarCodeScanned}
                      barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'itf14'] }}
                      zoom={0.1} />
                    <View style={ts.scanOverlay}>
                      <View style={ts.scanFrame} />
                      <Text style={ts.scanHint}>
                        {scanCount === 0 ? '将条形码对准框内' : `识别中... (${scanCount}/3)`}
                      </Text>
                    </View>
                  </>
                ) : (
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.accent} />
                    <Text style={{ color: colors.textSecondary, marginTop: 12 }}>识别中...</Text>
                  </View>
                )}
              </View>
            )}

            {step === 'search' && (
              <ScrollView keyboardShouldPersistTaps="always" automaticallyAdjustKeyboardInsets={true}>
                <TextInput style={ts.searchInput} placeholder="搜索专辑名称或艺术家..."
                  placeholderTextColor={colors.textSecondary} value={searchQuery}
                  onChangeText={setSearchQuery} onSubmitEditing={handleSearch} autoFocus />
                {loading && <ActivityIndicator color={colors.accent} style={{ marginTop: 12 }} />}
                {searchResults.length > 0 && (
                  <Text style={ts.searchCount}>找到 {searchResults.length} 个结果</Text>
                )}
                {searchResults.map((item, index) => renderSearchResult({ item, index }))}
              </ScrollView>
            )}

            {step === 'confirm' && selectedRelease && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {selectedRelease.images?.[0]?.uri ? (
                  <Image source={{ uri: selectedRelease.images[0].uri, headers: { 'User-Agent': 'MediaVault/1.0' } }}
                    style={{ width: 180, height: 180, borderRadius: 10, alignSelf: 'center', marginBottom: 20 }} resizeMode="cover" />
                ) : null}

                <View style={ts.confirmSection}>
                  <Text style={ts.confirmLabel}>专辑名</Text>
                  <Text style={ts.confirmValue}>{selectedRelease.title.split(' - ')[1] || selectedRelease.title}</Text>
                </View>
                <View style={ts.confirmSection}>
                  <Text style={ts.confirmLabel}>艺术家</Text>
                  <Text style={ts.confirmValue}>{selectedRelease.artists?.[0]?.name || '-'}</Text>
                </View>
                <View style={ts.confirmSection}>
                  <Text style={ts.confirmLabel}>发行日期</Text>
                  <Text style={ts.confirmValue}>{selectedRelease.released || selectedRelease.year || '-'}</Text>
                </View>
                {/* 版本 — tag 样式 */}
                {uniqueConfirmVersionTags.length > 0 && (
                  <View style={ts.confirmSection}>
                    <Text style={ts.confirmLabel}>版本</Text>
                    <View style={ts.confirmTagWrap}>
                      {uniqueConfirmVersionTags.map((tag, i) => (
                        <View key={i} style={ts.confirmTag}>
                          <Text style={ts.confirmTagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                {selectedRelease.country && (
                  <View style={ts.confirmSection}>
                    <Text style={ts.confirmLabel}>国家/地区</Text>
                    <Text style={ts.confirmValue}>{selectedRelease.country}</Text>
                  </View>
                )}
                {selectedRelease.labels?.[0]?.name && (
                  <View style={ts.confirmSection}>
                    <Text style={ts.confirmLabel}>厂牌</Text>
                    <Text style={ts.confirmValue}>{selectedRelease.labels[0].name}</Text>
                  </View>
                )}
                <View style={ts.confirmSection}>
                  <Text style={ts.confirmLabel}>流派</Text>
                  <Text style={ts.confirmValue}>{selectedRelease.genres?.join(', ') || '-'}</Text>
                </View>
                {selectedRelease.styles?.length > 0 && (
                  <View style={ts.confirmSection}>
                    <Text style={ts.confirmLabel}>风格</Text>
                    <Text style={ts.confirmValue}>{selectedRelease.styles.join(', ')}</Text>
                  </View>
                )}
                {/* Barcode */}
                {(() => {
                  const bc = selectedRelease.identifiers?.filter((i: any) => i.type === 'Barcode')?.map((i: any) => i.value)?.join(', ') || '';
                  return bc ? (
                    <View style={ts.confirmSection}>
                      <Text style={ts.confirmLabel}>条形码</Text>
                      <Text style={[ts.confirmValue, { fontSize: 13 }]}>{bc}</Text>
                    </View>
                  ) : null;
                })()}

                <View style={ts.confirmSection}>
                  <Text style={ts.confirmLabel}>购买日期</Text>
                  <TextInput style={{ flex: 1, fontSize: 15, fontWeight: '600', color: colors.text, textAlign: 'right' }}
                    placeholder="YYYY-MM-DD" placeholderTextColor={colors.textSecondary}
                    value={purchaseDate} onChangeText={setPurchaseDate} />
                </View>
                <View style={ts.confirmSection}>
                  <Text style={ts.confirmLabel}>价格</Text>
                  <TextInput style={{ flex: 1, fontSize: 15, fontWeight: '600', color: colors.text, textAlign: 'right' }}
                    placeholder="0.00" placeholderTextColor={colors.textSecondary}
                    value={price} onChangeText={setPrice} keyboardType="numeric" />
                </View>
                <View style={ts.confirmSection}>
                  <Text style={ts.confirmLabel}>个人评分</Text>
                  <View style={ts.starRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity key={star} onPress={() => setPersonalRating(star === personalRating ? 0 : star)}>
                        <Text style={ts.star}>{star <= personalRating ? '⭐' : '☆'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity style={[ts.saveBtn, loading && ts.saveBtnDisabled]} onPress={handleSave} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={ts.saveBtnText}>保存</Text>}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // 搜索结果条
  resultBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  resultThumbWrap: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    flexShrink: 0,
    marginRight: 12,
  },
  resultThumb: {
    width: '100%',
    height: '100%',
  },
  resultInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  resultAlbum: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  resultArtist: {
    fontSize: 13,
    marginBottom: 4,
  },
  resultMeta: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  resultMetaText: {
    fontSize: 11,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  resultArrow: {
    fontSize: 22,
    fontWeight: '300',
    marginLeft: 8,
  },
});
