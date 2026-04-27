import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  ActionSheetIOS,
  Platform,
  ActivityIndicator,
  Share,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useUploadSignedPdf } from '../../lib/api/contracts';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useI18n } from '../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadow,
} from '../../constants/theme';

interface PageItem {
  id: string;
  uri: string;
}

interface SignedPdfUploadProps {
  contractId: string;
  signedPdfUrl: string | null;
  onUploadComplete: () => void;
}

export function SignedPdfUpload({
  contractId,
  signedPdfUrl,
  onUploadComplete,
}: SignedPdfUploadProps) {
  const { t } = useI18n();
  const uploadSignedPdf = useUploadSignedPdf();
  const [pages, setPages] = useState<PageItem[]>([]);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ─── Source Picker ──────────────────────────────────────────────────

  const showUploadOptions = () => {
    if (signedPdfUrl) {
      Alert.alert(t('signedPdf_replace'), t('signedPdf_replaceConfirm'), [
        { text: t('cancel'), style: 'cancel' },
        { text: t('signedPdf_replace'), onPress: showSourcePicker },
      ]);
    } else {
      showSourcePicker();
    }
  };

  const showSourcePicker = () => {
    const options = [
      t('signedPdf_camera'),
      t('signedPdf_gallery'),
      t('signedPdf_file'),
      t('cancel'),
    ];
    const cancelIndex = 3;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIndex, title: t('signedPdf_uploadTitle') },
        (buttonIndex) => {
          if (buttonIndex === 0) launchCamera();
          else if (buttonIndex === 1) launchGallery();
          else if (buttonIndex === 2) launchFilePicker();
        },
      );
    } else {
      Alert.alert(t('signedPdf_uploadTitle'), undefined, [
        { text: t('signedPdf_camera'), onPress: launchCamera },
        { text: t('signedPdf_gallery'), onPress: launchGallery },
        { text: t('signedPdf_file'), onPress: launchFilePicker },
        { text: t('cancel'), style: 'cancel' },
      ]);
    }
  };

  // ─── Camera ─────────────────────────────────────────────────────────

  const launchCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('signedPdf_permissionRequired'), t('signedPdf_cameraPermission'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
      exif: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newPages = result.assets.map((asset) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        uri: asset.uri,
      }));
      setPages((prev) => [...prev, ...newPages]);
      setScannerVisible(true);
    }
  };

  // ─── Gallery ────────────────────────────────────────────────────────

  const launchGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('signedPdf_permissionRequired'), t('signedPdf_galleryPermission'));
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
      const newPages = result.assets.map((asset) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        uri: asset.uri,
      }));
      setPages((prev) => [...prev, ...newPages]);
      setScannerVisible(true);
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
        // Direct PDF upload — skip scanner modal
        await handleUpload([asset.uri], 'pdf');
      }
    } catch {
      Alert.alert(t('error'), t('signedPdf_uploadError'));
    }
  };

  // ─── Page Management ────────────────────────────────────────────────

  const removePage = useCallback((pageId: string) => {
    setPages((prev) => {
      const updated = prev.filter((p) => p.id !== pageId);
      if (updated.length === 0) {
        setScannerVisible(false);
      }
      return updated;
    });
  }, []);

  const movePage = useCallback((fromIndex: number, toIndex: number) => {
    setPages((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  }, []);

  // ─── Upload ─────────────────────────────────────────────────────────

  const handleUpload = async (uris: string[], mode: 'images' | 'pdf') => {
    setUploading(true);
    try {
      await uploadSignedPdf.mutateAsync({
        contractId,
        fileUris: uris,
        mode,
      });
      Alert.alert(t('signedPdf_uploadSuccess'));
      setPages([]);
      setScannerVisible(false);
      onUploadComplete();
    } catch {
      Alert.alert(t('error'), t('signedPdf_uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const handleUploadPages = () => {
    if (pages.length === 0) return;
    handleUpload(
      pages.map((p) => p.uri),
      'images',
    );
  };

  // ─── View / Share existing signed PDF ───────────────────────────────

  const handleViewSignedPdf = () => {
    if (signedPdfUrl) {
      Linking.openURL(signedPdfUrl);
    }
  };

  const handleShareSignedPdf = async () => {
    if (signedPdfUrl) {
      try {
        await Share.share({ url: signedPdfUrl, message: signedPdfUrl });
      } catch {
        // user cancelled share
      }
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <>
      {/* Signed PDF Section in Contract Detail — manual upload of paper-signed copy */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>{t('signedPdf_manualTitle')}</Text>
        <Text style={styles.sectionHint}>{t('signedPdf_manualHint')}</Text>

        {signedPdfUrl ? (
          <View style={styles.signedPdfContainer}>
            <View style={styles.signedPdfInfo}>
              <View style={styles.signedPdfIcon}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              </View>
              <Text style={styles.signedPdfText}>{t('signedPdf_signedPdf')}</Text>
            </View>
            <View style={styles.signedPdfActions}>
              <TouchableOpacity style={styles.actionChip} onPress={handleViewSignedPdf}>
                <Ionicons name="eye-outline" size={16} color={colors.primary} />
                <Text style={styles.actionChipText}>{t('signedPdf_view')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionChip} onPress={handleShareSignedPdf}>
                <Ionicons name="share-outline" size={16} color={colors.primary} />
                <Text style={styles.actionChipText}>{t('signedPdf_share')}</Text>
              </TouchableOpacity>
            </View>
            <Button
              title={t('signedPdf_replace')}
              variant="outline"
              size="sm"
              icon={<Ionicons name="cloud-upload-outline" size={16} color={colors.primary} />}
              onPress={showUploadOptions}
              style={styles.replaceBtn}
            />
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadArea} onPress={showUploadOptions}>
            <Ionicons name="cloud-upload-outline" size={36} color={colors.textTertiary} />
            <Text style={styles.uploadAreaTitle}>{t('signedPdf_uploadTitle')}</Text>
            <View style={styles.uploadHints}>
              <UploadHint icon="camera-outline" text={t('signedPdf_cameraDesc')} />
              <UploadHint icon="images-outline" text={t('signedPdf_galleryDesc')} />
              <UploadHint icon="document-outline" text={t('signedPdf_fileDesc')} />
            </View>
          </TouchableOpacity>
        )}
      </Card>

      {/* Scanner / Page Preview Modal */}
      <Modal
        visible={scannerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          if (!uploading) {
            setScannerVisible(false);
            setPages([]);
          }
        }}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                if (!uploading) {
                  setScannerVisible(false);
                  setPages([]);
                }
              }}
              disabled={uploading}
            >
              <Text style={styles.modalCancel}>{t('cancel')}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {t('signedPdf_pages')} ({pages.length})
            </Text>
            <TouchableOpacity
              onPress={handleUploadPages}
              disabled={uploading || pages.length === 0}
            >
              {uploading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text
                  style={[
                    styles.modalDone,
                    pages.length === 0 && styles.modalDoneDisabled,
                  ]}
                >
                  {t('signedPdf_uploading').replace('...', '')}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Page thumbnails */}
          {pages.length === 0 ? (
            <View style={styles.emptyPages}>
              <Ionicons name="documents-outline" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyPagesText}>{t('signedPdf_noPages')}</Text>
            </View>
          ) : (
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
          )}

          {/* Add more pages */}
          <View style={styles.modalFooter}>
            <Button
              title={t('signedPdf_addMore')}
              variant="outline"
              icon={<Ionicons name="add" size={18} color={colors.primary} />}
              onPress={showSourcePickerForMore}
              disabled={uploading}
              style={styles.addMoreBtn}
            />
            <Button
              title={uploading ? t('signedPdf_uploading') : t('signedPdf_uploadTitle')}
              onPress={handleUploadPages}
              loading={uploading}
              disabled={uploading || pages.length === 0}
              icon={
                !uploading ? (
                  <Ionicons name="cloud-upload-outline" size={18} color={colors.white} />
                ) : undefined
              }
              style={styles.uploadBtn}
            />
          </View>
        </View>
      </Modal>
    </>
  );

  // Add more pages within the scanner modal
  function showSourcePickerForMore() {
    const options = [t('signedPdf_camera'), t('signedPdf_gallery'), t('cancel')];
    const cancelIndex = 2;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIndex, title: t('signedPdf_addMore') },
        (buttonIndex) => {
          if (buttonIndex === 0) launchCamera();
          else if (buttonIndex === 1) launchGallery();
        },
      );
    } else {
      Alert.alert(t('signedPdf_addMore'), undefined, [
        { text: t('signedPdf_camera'), onPress: launchCamera },
        { text: t('signedPdf_gallery'), onPress: launchGallery },
        { text: t('cancel'), style: 'cancel' },
      ]);
    }
  }
}

// ─── Helper Components ────────────────────────────────────────────────

function UploadHint({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.uploadHint}>
      <Ionicons name={icon} size={14} color={colors.textSecondary} />
      <Text style={styles.uploadHintText}>{text}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  section: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionHint: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },

  // Upload area (empty state)
  uploadArea: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  uploadAreaTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  uploadHints: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  uploadHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  uploadHintText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },

  // Signed PDF display
  signedPdfContainer: {
    gap: spacing.sm,
  },
  signedPdfInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  signedPdfIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signedPdfText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    flex: 1,
  },
  signedPdfActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.sm,
  },
  actionChipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
  replaceBtn: {
    marginTop: spacing.xs,
  },

  // Scanner modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCancel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  modalTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  modalDone: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  modalDoneDisabled: {
    color: colors.textTertiary,
  },

  // Empty pages
  emptyPages: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  emptyPagesText: {
    fontSize: fontSize.md,
    color: colors.textTertiary,
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

  // Modal footer
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addMoreBtn: {
    flex: 1,
  },
  uploadBtn: {
    flex: 2,
  },
});
