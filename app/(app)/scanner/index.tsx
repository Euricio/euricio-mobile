import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { imagesToPdf } from '../../../lib/imagesToPdf';
import { useContracts } from '../../../lib/api/contracts';
import { useUploadScan } from '../../../lib/api/scanner';
import { useI18n } from '../../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadow,
} from '../../../constants/theme';

interface PageItem {
  id: string;
  uri: string;
}

export default function ScannerScreen() {
  const { t } = useI18n();
  const uploadScan = useUploadScan();
  const { data: contracts } = useContracts();
  const [pages, setPages] = useState<PageItem[]>([]);
  const [uploading, setUploading] = useState(false);

  // ─── Persist picked images to a stable cache dir immediately ────────
  // iOS can revoke access to ImagePicker temp URIs at any time.
  // Copying right after selection guarantees the file is readable later.

  const persistToCache = async (uris: string[]): Promise<PageItem[]> => {
    const items: PageItem[] = [];
    for (const uri of uris) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const dest = `${FileSystem.cacheDirectory}scanner-${id}.jpg`;
      try {
        await FileSystem.copyAsync({ from: uri, to: dest });
        items.push({ id, uri: dest });
      } catch (err) {
        console.error('[scanner] Failed to persist image to cache:', uri, err);
        // Fallback: try using the original URI (may still work for display)
        items.push({ id, uri });
      }
    }
    return items;
  };

  // ─── Source Picker ──────────────────────────────────────────────────

  const showSourcePicker = () => {
    const options = [
      t('scanner_camera'),
      t('scanner_gallery'),
      t('scanner_file'),
      t('cancel'),
    ];
    const cancelIndex = 3;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIndex, title: t('scanner_chooseSource') },
        (buttonIndex) => {
          if (buttonIndex === 0) launchCamera();
          else if (buttonIndex === 1) launchGallery();
          else if (buttonIndex === 2) launchFilePicker();
        },
      );
    } else {
      Alert.alert(t('scanner_chooseSource'), undefined, [
        { text: t('scanner_camera'), onPress: launchCamera },
        { text: t('scanner_gallery'), onPress: launchGallery },
        { text: t('scanner_file'), onPress: launchFilePicker },
        { text: t('cancel'), style: 'cancel' },
      ]);
    }
  };

  // ─── Camera ─────────────────────────────────────────────────────────

  const launchCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('scanner_permissionRequired'), t('scanner_cameraPermission'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
      exif: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newPages = await persistToCache(result.assets.map((a) => a.uri));
      setPages((prev) => [...prev, ...newPages]);
    }
  };

  // ─── Gallery ────────────────────────────────────────────────────────

  const launchGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('scanner_permissionRequired'), t('scanner_galleryPermission'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 20,
      exif: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newPages = await persistToCache(result.assets.map((a) => a.uri));
      setPages((prev) => [...prev, ...newPages]);
    }
  };

  // ─── File Picker ────────────────────────────────────────────────────

  const launchFilePicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        handleSave([asset.uri], 'pdf');
      }
    } catch (err: any) {
      console.error('Scanner file pick failed:', err);
      Alert.alert(t('error'), err?.message || t('scanner_uploadError'));
    }
  };

  // ─── Page Management ────────────────────────────────────────────────

  const removePage = useCallback((pageId: string) => {
    setPages((prev) => prev.filter((p) => p.id !== pageId));
  }, []);

  const movePage = useCallback((fromIndex: number, toIndex: number) => {
    setPages((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  }, []);

  // ─── Save Options ──────────────────────────────────────────────────

  const showSaveOptions = () => {
    if (pages.length === 0) return;

    const options = [
      t('scanner_saveToDevice'),
      t('scanner_uploadToCloud'),
      t('scanner_attachToContract'),
      t('cancel'),
    ];
    const cancelIndex = 3;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIndex, title: t('scanner_saveOptions') },
        (buttonIndex) => {
          if (buttonIndex === 0) handleShareToDevice();
          else if (buttonIndex === 1) handleSave(pages.map((p) => p.uri), 'images');
          else if (buttonIndex === 2) showContractPicker();
        },
      );
    } else {
      Alert.alert(t('scanner_saveOptions'), undefined, [
        { text: t('scanner_saveToDevice'), onPress: handleShareToDevice },
        {
          text: t('scanner_uploadToCloud'),
          onPress: () => handleSave(pages.map((p) => p.uri), 'images'),
        },
        { text: t('scanner_attachToContract'), onPress: showContractPicker },
        { text: t('cancel'), style: 'cancel' },
      ]);
    }
  };

  // ─── Save to device via share sheet ─────────────────────────────────

  const handleShareToDevice = async () => {
    if (pages.length === 0) return;
    setUploading(true);
    try {
      const uris = pages.map((p) => p.uri);
      // Convert images to PDF
      const pdfUri = await imagesToPdf(uris);

      await uploadScan.mutateAsync({
        fileUris: [pdfUri],
        mode: 'pdf',
      });

      // Share the generated PDF
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(pdfUri);
      }
      Alert.alert(t('scanner_saveSuccess'));
      setPages([]);
      router.back();
    } catch (err: any) {
      console.error('Scanner share-to-device failed:', err);
      Alert.alert(t('error'), err?.message || t('scanner_uploadError'));
    } finally {
      setUploading(false);
    }
  };

  // ─── Upload to cloud ───────────────────────────────────────────────

  const handleSave = async (uris: string[], mode: 'images' | 'pdf', contractId?: string) => {
    setUploading(true);
    try {
      let finalUris = uris;
      let finalMode: 'images' | 'pdf' = mode;

      // Convert images to a single PDF
      if (mode === 'images' && uris.length > 0) {
        const pdfUri = await imagesToPdf(uris);
        finalUris = [pdfUri];
        finalMode = 'pdf';
      }

      await uploadScan.mutateAsync({ fileUris: finalUris, mode: finalMode, contractId });
      Alert.alert(contractId ? t('scanner_attachSuccess') : t('scanner_saveSuccess'));
      setPages([]);
      router.back();
    } catch (err: any) {
      console.error('Scanner upload failed:', err);
      Alert.alert(t('error'), err?.message || t('scanner_uploadError'));
    } finally {
      setUploading(false);
    }
  };

  // ─── Contract Picker ───────────────────────────────────────────────

  const showContractPicker = () => {
    if (!contracts || contracts.length === 0) {
      Alert.alert(t('scanner_noContracts'));
      return;
    }

    const contractOptions = contracts.slice(0, 10).map(
      (c) => `${c.client_name} — ${t(`contractType_${c.contract_type}`)}`,
    );
    contractOptions.push(t('cancel'));

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: contractOptions,
          cancelButtonIndex: contractOptions.length - 1,
          title: t('scanner_selectContract'),
        },
        (buttonIndex) => {
          if (buttonIndex < contracts.length && buttonIndex < 10) {
            handleSave(pages.map((p) => p.uri), 'images', contracts[buttonIndex].id);
          }
        },
      );
    } else {
      const alertOptions = contracts.slice(0, 10).map((c, i) => ({
        text: `${c.client_name} — ${t(`contractType_${c.contract_type}`)}`,
        onPress: () => handleSave(pages.map((p) => p.uri), 'images', c.id),
      }));
      alertOptions.push({ text: t('cancel'), onPress: async () => {} });
      Alert.alert(t('scanner_selectContract'), undefined, alertOptions);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: t('scanner_title'),
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerShadowVisible: false,
        }}
      />

      {pages.length === 0 ? (
        /* Empty state — source options */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="scan-outline" size={48} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>{t('scanner_emptyTitle')}</Text>
          <Text style={styles.emptySubtitle}>{t('scanner_emptySubtitle')}</Text>

          <View style={styles.sourceCards}>
            <SourceCard
              icon="camera-outline"
              label={t('scanner_camera')}
              description={t('scanner_cameraDesc')}
              onPress={launchCamera}
            />
            <SourceCard
              icon="images-outline"
              label={t('scanner_gallery')}
              description={t('scanner_galleryDesc')}
              onPress={launchGallery}
            />
            <SourceCard
              icon="document-outline"
              label={t('scanner_file')}
              description={t('scanner_fileDesc')}
              onPress={launchFilePicker}
            />
          </View>
        </View>
      ) : (
        /* Pages preview */
        <>
          <View style={styles.pagesHeader}>
            <Text style={styles.pagesTitle}>
              {t('scanner_pages')} ({pages.length})
            </Text>
            <TouchableOpacity onPress={showSourcePicker} disabled={uploading}>
              <View style={styles.addMoreChip}>
                <Ionicons name="add" size={16} color={colors.primary} />
                <Text style={styles.addMoreText}>{t('scanner_addMore')}</Text>
              </View>
            </TouchableOpacity>
          </View>

          <FlatList
            data={pages}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.pageGrid}
            columnWrapperStyle={styles.pageRow}
            renderItem={({ item, index }) => (
              <View style={styles.pageThumb}>
                <Image source={{ uri: item.uri }} style={styles.pageImage} />
                <View style={styles.pageOverlay}>
                  <Text style={styles.pageNumber}>{index + 1}</Text>
                </View>
                {/* Move buttons */}
                <View style={styles.pageControls}>
                  {index > 0 && (
                    <TouchableOpacity
                      style={styles.pageControlBtn}
                      onPress={() => movePage(index, index - 1)}
                    >
                      <Ionicons name="arrow-back" size={14} color={colors.white} />
                    </TouchableOpacity>
                  )}
                  {index < pages.length - 1 && (
                    <TouchableOpacity
                      style={styles.pageControlBtn}
                      onPress={() => movePage(index, index + 1)}
                    >
                      <Ionicons name="arrow-forward" size={14} color={colors.white} />
                    </TouchableOpacity>
                  )}
                </View>
                {/* Delete */}
                <TouchableOpacity
                  style={styles.pageDeleteBtn}
                  onPress={() => removePage(item.id)}
                >
                  <Ionicons name="close-circle" size={22} color={colors.error} />
                </TouchableOpacity>
              </View>
            )}
          />

          {/* Footer actions */}
          <View style={styles.footer}>
            {uploading ? (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.uploadingText}>{t('scanner_uploading')}</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.saveButton}
                onPress={showSaveOptions}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />
                <Text style={styles.saveButtonText}>{t('scanner_save')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </View>
  );
}

// ─── Helper Components ────────────────────────────────────────────────

function SourceCard({
  icon,
  label,
  description,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.sourceCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.sourceCardIcon}>
        <Ionicons name={icon} size={28} color={colors.primary} />
      </View>
      <Text style={styles.sourceCardLabel}>{label}</Text>
      <Text style={styles.sourceCardDesc}>{description}</Text>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  sourceCards: {
    width: '100%',
    gap: spacing.sm,
  },
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
    ...shadow.sm,
  },
  sourceCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceCardLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 0,
  },
  sourceCardDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },

  // Pages header
  pagesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pagesTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  addMoreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.primary + '12',
    borderRadius: borderRadius.sm,
  },
  addMoreText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },

  // Page grid
  pageGrid: {
    padding: spacing.md,
  },
  pageRow: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  pageThumb: {
    flex: 1,
    aspectRatio: 0.75,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.borderLight,
    ...shadow.sm,
  },
  pageImage: {
    width: '100%',
    height: '100%',
  },
  pageOverlay: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pageNumber: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  pageControls: {
    position: 'absolute',
    bottom: spacing.xs,
    left: spacing.xs,
    flexDirection: 'row',
    gap: 4,
  },
  pageControlBtn: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: borderRadius.sm,
    padding: 4,
  },
  pageDeleteBtn: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
  },

  // Footer
  footer: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
  },
  saveButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
  },
  uploadingText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
});
