import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
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
  const [step, setStep] = useState<'scan' | 'search' | 'confirm'>('scan');
  const [scanning, setScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedRelease, setSelectedRelease] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 表单数据
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
      // 1. 保存到本地数据库
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

      // 2. 同步到Notion（可选）
      try {
        const notionProperties = formatVinylForNotion(vinylData);
        const pageId = await createNotionPage(
          process.env.NOTION_VINYLS_DB_ID || '',
          notionProperties,
          vinylData.cover_url
        );

        if (pageId) {
          // 更新本地记录的notion_page_id
          const { updateVinyl } = require('../../database/database');
          await updateVinyl(vinylId, { notion_page_id: pageId });
        }
      } catch (error) {
        console.log('⚠️ Notion sync skipped:', error);
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
    setStep('scan');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedRelease(null);
    setPurchaseDate('');
    setPrice('');
    setPersonalRating('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.modalTitle}>添加黑胶</Text>
            <TouchableOpacity onPress={() => { resetForm(); onClose(); }}>
              <Text style={styles.closeButton}>取消</Text>
            </TouchableOpacity>
          </View>

          {step === 'scan' && (
            <View style={styles.scanArea} onTouchStart={async () => {
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
                  <Text style={styles.scanIcon}>📷</Text>
                  <Text style={styles.scanText}>点击扫描条形码</Text>
                </>
              )}
            </View>
          )}

          {step === 'search' && (
            <>
              <TextInput
                style={styles.searchInput}
                placeholder="搜索专辑名或艺术家..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                autoFocus
              />
              {loading && <ActivityIndicator color="#0a84ff" />}
              {searchResults.map((result, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.searchResult}
                  onPress={() => handleSelectResult(result)}
                >
                  <View style={styles.resultThumb} />
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultTitle}>{result.title}</Text>
                    <Text style={styles.resultSubtitle}>
                      {result.year} • {result.genres?.join(', ')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {step === 'confirm' && selectedRelease && (
            <>
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
              <View style={styles.confirmSection}>
                <Text style={styles.confirmLabel}>版本</Text>
                <Text style={styles.confirmValue}>
                  {selectedRelease.formats?.[0]?.descriptions?.join(', ') || 'N/A'}
                </Text>
              </View>

              <View style={styles.confirmSection}>
                <Text style={styles.confirmLabel}>购买日期</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={purchaseDate}
                  onChangeText={setPurchaseDate}
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
              </View>

              <View style={styles.confirmSection}>
                <Text style={styles.confirmLabel}>价格</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
              </View>

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

          {step === 'confirm' && (
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

          {step === 'scan' && (
            <Text style={styles.divider}>或</Text>
          )}

          {step !== 'search' && (
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => setStep('search')}
            >
              <Text style={styles.searchButtonText}>手动搜索</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
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
  scanArea: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 50,
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
  },
  scanIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  scanText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
  },
  divider: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
    marginVertical: 16,
    fontWeight: '500',
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
  searchButton: {
    backgroundColor: '#2c2c2e',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
  },
  searchButtonText: {
    color: '#0a84ff',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
});
