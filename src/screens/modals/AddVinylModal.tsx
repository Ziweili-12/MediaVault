import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { insertVinyl } from '../../database/database';
import { searchDiscogsByBarcode, searchDiscogsByQuery, getDiscogsRelease } from '../../services/api';
import { createNotionPage, formatVinylForNotion } from '../../services/api';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddVinylModal({ visible, onClose, onSuccess }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<'welcome' | 'scan' | 'search' | 'confirm'>('welcome');
  const [scanning, setScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedRelease, setSelectedRelease] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [purchaseDate, setPurchaseDate] = useState('');
  const [price, setPrice] = useState('');
  const [personalRating, setPersonalRating] = useState('');

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanning(false);
    setLoading(true);

    try {
      const release = await searchDiscogsByBarcode(data);
      if (release) {
        setSelectedRelease(release);
        setStep('confirm');
      } else {
        Alert.alert('未找到', '该条形码未找到对应专辑，请手动搜索');
        setStep('search');
      }
    } catch (error) {
      Alert.alert('扫描失败', '请重试或手动搜索');
      setStep('search');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const results = await searchDiscogsByQuery(searchQuery);
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
      const release = await getDiscogsRelease(result.id);
      if (release) {
        setSelectedRelease(release);
        setStep('confirm');
      }
    } catch (error) {
      Alert.alert('获取详情失败', '请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedRelease) return;

    setLoading(true);
    try {
      const vinylData = {
        album_name: selectedRelease.title.split(' - ')[1] || selectedRelease.title,
        artist: selectedRelease.artists?.[0]?.name || 'Unknown',
        version: selectedRelease.formats?.[0]?.descriptions?.join(', ') || '',
        cover_url: selectedRelease.images?.[0]?.uri || '',
        release_id: selectedRelease.id,
        barcode: selectedRelease.barcode?.[0] || '',
        purchase_date: purchaseDate || undefined,
        price: price ? parseFloat(price) : undefined,
        personal_rating: personalRating ? parseInt(personalRating) : undefined,
        genre: selectedRelease.genres?.join(', ') || '',
      };

      const vinylId = await insertVinyl(vinylData);

      try {
        const notionProperties = formatVinylForNotion(vinylData);
        const pageId = await createNotionPage(
          process.env.NOTION_VINYLS_DB_ID || '',
          notionProperties,
          vinylData.cover_url
        );

        if (pageId) {
          const { updateVinyl } = require('../../database/database');
          await updateVinyl(vinylId, { notion_page_id: pageId });
        }
      } catch (error) {
        console.log('Notion sync skipped:', error);
      }

      Alert.alert('成功', '黑胶已添加');
      resetForm();
      onSuccess();
    } catch (error) {
      Alert.alert('保存失败', '请重试');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('welcome');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedRelease(null);
    setPurchaseDate('');
    setPrice('');
    setPersonalRating('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.modalTitle}>添加黑胶</Text>
              <TouchableOpacity onPress={() => { resetForm(); onClose(); }}>
                <Text style={styles.closeButton}>取消</Text>
              </TouchableOpacity>
            </View>

            {(step === 'welcome') && (
              <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeTitle}>添加黑胶唱片</Text>
                <Text style={styles.welcomeSub}>选择添加方式</Text>

                <TouchableOpacity
                  style={styles.welcomeOption}
                  onPress={() => setStep('search')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.welcomeOptionIcon, { backgroundColor: '#0a84ff20' }]}>
                    <Text style={styles.welcomeOptionEmoji}>🔍</Text>
                  </View>
                  <View style={styles.welcomeOptionText}>
                    <Text style={styles.welcomeOptionTitle}>搜索添加</Text>
                    <Text style={styles.welcomeOptionSub}>按专辑名或艺术家搜索</Text>
                  </View>
                  <Ionicons name="chevron-right" size={20} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.welcomeOption}
                  onPress={() => { setStep('scan'); setScanning(false); }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.welcomeOptionIcon, { backgroundColor: '#30d15820' }]}>
                    <Text style={styles.welcomeOptionEmoji}>📷</Text>
                  </View>
                  <View style={styles.welcomeOptionText}>
                    <Text style={styles.welcomeOptionTitle}>扫码添加</Text>
                    <Text style={styles.welcomeOptionSub}>扫描黑胶条形码</Text>
                  </View>
                  <Ionicons name="chevron-right" size={20} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              </View>
            )}

            {(step === 'search') && (
              <View style={styles.searchContainer}>
                <View style={styles.searchHeadArea}>
                  <TouchableOpacity onPress={() => { setStep('welcome'); setSearchQuery(''); setSearchResults([]); }} style={styles.backRow}>
                    <Text style={styles.backBtn}>← 返回</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="搜索专辑名或艺术家..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                    autoFocus
                  />
                </View>
                <ScrollView style={styles.searchResultsArea} showsVerticalScrollIndicator={false}>
                  {loading && <View style={styles.loadingContainer}><ActivityIndicator color="#0a84ff" /></View>}
                  {!loading && searchResults.length > 0 && <Text style={styles.searchCount}>找到 {searchResults.length} 个结果</Text>}
                  {searchResults.map((result, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.searchResult}
                      onPress={() => handleSelectResult(result)}
                    >
                      {result.cover_image ? (
                        <Image
                          source={{ uri: result.cover_image }}
                          style={styles.resultThumb}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.resultThumbPlaceholder}>
                          <Ionicons name="disc" size={20} color="rgba(255,255,255,0.3)" />
                        </View>
                      )}
                      <View style={styles.resultInfo}>
                        <Text style={styles.resultTitle}>{result.title}</Text>
                        <Text style={styles.resultSubtitle}>
                          {result.year} • {result.genres?.join(', ')}
                        </Text>
                      </View>
                      <Ionicons name="chevron-right" size={18} color="rgba(255,255,255,0.3)" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {(step === 'scan') && (
              <View style={styles.scanFullScreen}>
                <View style={styles.scanHeader}>
                  <TouchableOpacity onPress={() => setStep('welcome')}>
                    <Text style={styles.scanBackBtn}>← 返回</Text>
                  </TouchableOpacity>
                  <Text style={styles.scanHeaderTitle}>扫描条形码</Text>
                  <View style={{width: 60}} />
                </View>
                <View style={styles.scanAreaBig} onTouchStart={async () => {
                  if (!permission?.granted) {
                    const result = await requestPermission();
                    if (!result.granted) {
                      Alert.alert('需要相机权限', '请在设置中允许访问相机以扫描条形码');
                      return;
                    }
                  }
                  setScanning(true);
                }}>
                  {scanning ? (
                    <CameraView
                      style={StyleSheet.absoluteFillObject}
                      facing="back"
                      onBarcodeScanned={handleBarCodeScanned}
                      barcodeScannerSettings={{
                        barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'code93'],
                      }}
                    />
                  ) : (
                    <>
                      <View style={styles.scanFrame}>
                        <View style={styles.scanCorner} />
                        <View style={[styles.scanCorner, { transform: [{ rotate: '90deg' }] }]} />
                        <View style={[styles.scanCorner, { transform: [{ rotate: '180deg' }] }]} />
                        <View style={[styles.scanCorner, { transform: [{ rotate: '270deg' }] }]} />
                      </View>
                      <Text style={styles.scanIcon}>📷</Text>
                      <Text style={styles.scanText}>点击开始扫描</Text>
                    </>
                  )}
                </View>
              </View>
            )}

            {(step === 'confirm') && selectedRelease && (
              <ScrollView style={styles.confirmScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.confirmCoverSection}>
                  {selectedRelease.images?.[0]?.uri ? (
                    <Image
                      source={{ uri: selectedRelease.images[0].uri }}
                      style={styles.confirmCover}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.confirmCoverPlaceholder}>
                      <Ionicons name="disc" size={64} color="rgba(255,255,255,0.3)" />
                    </View>
                  )}
                  <View style={styles.confirmVersionBadge}>
                    <Text style={styles.confirmVersionText}>{selectedRelease.formats?.[0]?.name || 'Vinyl'}</Text>
                  </View>
                </View>

                <View style={styles.confirmSection}>
                  <Text style={styles.confirmLabel}>专辑名</Text>
                  <Text style={styles.confirmValue}>
                    {selectedRelease.title.split(' - ')[1] || selectedRelease.title}
                  </Text>
                </View>
                <View style={styles.confirmSection}>
                  <Text style={styles.confirmLabel}>艺术家</Text>
                  <Text style={styles.confirmValue}>
                    {selectedRelease.artists?.[0]?.name}
                  </Text>
                </View>
                {selectedRelease.formats?.[0]?.descriptions?.join(', ') && (
                  <View style={styles.confirmSection}>
                    <Text style={styles.confirmLabel}>版本</Text>
                    <Text style={styles.confirmValue}>
                      {selectedRelease.formats[0].descriptions.join(', ')}
                    </Text>
                  </View>
                )}
                {selectedRelease.genres && (
                  <View style={styles.confirmSection}>
                    <Text style={styles.confirmLabel}>流派</Text>
                    <Text style={styles.confirmValue}>
                      {selectedRelease.genres.join(', ')}
                    </Text>
                  </View>
                )}
                <View style={styles.confirmSection}>
                  <Text style={styles.confirmLabel}>购买日期</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={purchaseDate}
                    onChangeText={setPurchaseDate}
                  />
                </View>
                <View style={styles.confirmSection}>
                  <Text style={styles.confirmLabel}>价格</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.confirmSection}>
                  <Text style={styles.confirmLabel}>个人评分 (1-5)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={personalRating}
                    onChangeText={setPersonalRating}
                    keyboardType="numeric"
                  />
                </View>
              </ScrollView>
            )}

            {(step === 'confirm') && selectedRelease && (
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
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

import { Ionicons } from '@expo/vector-icons';

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
    color: '#0a84ff',
    fontSize: 17,
    fontWeight: '600',
  },

  welcomeContainer: {
    padding: 8,
    paddingTop: 40,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  welcomeSub: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 32,
  },
  welcomeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c2c2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  welcomeOptionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  welcomeOptionEmoji: {
    fontSize: 26,
  },
  welcomeOptionText: {
    flex: 1,
  },
  welcomeOptionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  welcomeOptionSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
  },

  searchContainer: {
    flex: 1,
  },
  searchHeadArea: {
    marginBottom: 12,
  },
  backRow: {
    marginBottom: 8,
  },
  backBtn: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0a84ff',
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
    flex: 1,
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
    height: 56,
    borderRadius: 8,
    backgroundColor: '#3c3c3e',
  },
  resultThumbPlaceholder: {
    width: 56,
    height: 56,
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

  scanFullScreen: {
    flex: 1,
  },
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  scanBackBtn: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0a84ff',
  },
  scanHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  scanAreaBig: {
    flex: 1,
    margin: 16,
    borderRadius: 20,
    backgroundColor: '#2c2c2e',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderWidth: 2,
    borderColor: '#0a84ff',
    borderRadius: 16,
    opacity: 0.8,
  },
  scanCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderLeftWidth: 3,
    borderTopWidth: 3,
    borderColor: '#0a84ff',
    top: -2,
    left: -2,
  },
  scanIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  scanText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },

  confirmScroll: {
    flex: 1,
    paddingBottom: 20,
  },
  confirmCoverSection: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 24,
  },
  confirmCover: {
    width: 200,
    height: 200,
    borderRadius: 16,
    backgroundColor: '#2c2c2e',
  },
  confirmCoverPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 16,
    backgroundColor: '#2c2c2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmVersionBadge: {
    position: 'absolute',
    top: 12,
    left: '50%',
    transform: [{ translateX: -80 }],
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  confirmVersionText: {
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
    backgroundColor: '#0a84ff',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    shadowColor: '#0a84ff',
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
});