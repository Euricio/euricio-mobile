import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ActionSheetIOS,
  Modal,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
  usePropertyImages,
  useUploadPropertyImage,
  useDeletePropertyImage,
  useSetCoverImage,
  usePropertyDocuments,
  useUploadPropertyDocument,
  useDeletePropertyDocument,
  DOCUMENT_TYPE_LABELS,
  PropertyImage,
  PropertyDocument,
} from '../../lib/api/propertyMedia';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { useI18n } from '../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadow,
} from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_SIZE = (SCREEN_WIDTH - spacing.md * 2 - spacing.sm * 2) / 3;

type TabKey = 'photos' | 'documents';

const DOCUMENT_TYPE_OPTIONS = Object.entries(DOCUMENT_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export default function PropertyMediaScreen() {
  const { propertyId, propertyTitle } = useLocalSearchParams<{
    propertyId: string;
    propertyTitle?: string;
  }>();
  const [activeTab, setActiveTab] = useState<TabKey>('photos');
  const { t } = useI18n();

  if (!propertyId) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ headerTitle: t('media_title'), headerShown: true }} />
        <Text style={styles.errorText}>{t('media_noPropertySelected')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: propertyTitle || t('media_title'),
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerShadowVisible: false,
        }}
      />

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'photos' && styles.tabActive]}
          onPress={() => setActiveTab('photos')}
        >
          <Ionicons
            name="images-outline"
            size={18}
            color={activeTab === 'photos' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'photos' && styles.tabTextActive,
            ]}
          >
            {t('media_photos')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'documents' && styles.tabActive]}
          onPress={() => setActiveTab('documents')}
        >
          <Ionicons
            name="document-text-outline"
            size={18}
            color={activeTab === 'documents' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'documents' && styles.tabTextActive,
            ]}
          >
            {t('media_documents')}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'photos' ? (
        <PhotosTab propertyId={propertyId} />
      ) : (
        <DocumentsTab propertyId={propertyId} />
      )}
    </View>
  );
}

// ─── Photos Tab ──────────────────────────────────────────────────────

function PhotosTab({ propertyId }: { propertyId: string }) {
  const { data: images, isLoading, refetch, isRefetching } = usePropertyImages(propertyId);
  const uploadImage = useUploadPropertyImage();
  const deleteImage = useDeletePropertyImage();
  const setCover = useSetCoverImage();
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<PropertyImage | null>(null);
  const { t } = useI18n();

  const handleAddPhoto = () => {
    const options = [t('media_camera'), t('media_library'), t('cancel')];
    const cancelIndex = 2;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIndex, title: t('media_addPhoto') },
        (buttonIndex) => {
          if (buttonIndex === 0) launchCamera();
          else if (buttonIndex === 1) launchLibrary();
        },
      );
    } else {
      // Android fallback with Alert
      Alert.alert(t('media_addPhoto'), undefined, [
        { text: t('media_camera'), onPress: launchCamera },
        { text: t('media_library'), onPress: launchLibrary },
        { text: t('cancel'), style: 'cancel' },
      ]);
    }
  };

  const launchCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('media_permissionRequired'), t('media_cameraPermission'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
      exif: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      await uploadImages(result.assets);
    }
  };

  const launchLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('media_permissionRequired'), t('media_libraryPermission'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 10,
      exif: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      await uploadImages(result.assets);
    }
  };

  const uploadImages = async (assets: ImagePicker.ImagePickerAsset[]) => {
    setUploading(true);
    try {
      for (let i = 0; i < assets.length; i++) {
        await uploadImage.mutateAsync({
          propertyId,
          uri: assets[i].uri,
          index: i,
        });
      }
    } catch (e: any) {
      Alert.alert(t('error'), e.message || t('media_uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = (image: PropertyImage) => {
    Alert.alert(t('media_deletePhoto'), t('media_deletePhotoConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => {
          deleteImage.mutate(
            {
              imageId: image.id,
              storagePath: image.storage_path,
              propertyId,
            },
            {
              onError: () =>
                Alert.alert(t('error'), t('media_deletePhotoError')),
            },
          );
          setSelectedImage(null);
        },
      },
    ]);
  };

  const handleSetCover = (image: PropertyImage) => {
    setCover.mutate(
      { imageId: image.id, propertyId },
      {
        onError: () =>
          Alert.alert(t('error'), t('media_setCoverError')),
      },
    );
    setSelectedImage(null);
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.tabContent}>
      <FlatList
        data={images}
        numColumns={3}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.imageGrid}
        columnWrapperStyle={styles.imageRow}
        refreshing={isRefetching}
        onRefresh={() => refetch()}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyText}>{t('media_noPhotos')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.imageThumb}
            activeOpacity={0.8}
            onPress={() => setSelectedImage(item)}
            onLongPress={() => setSelectedImage(item)}
          >
            <Image source={{ uri: item.url }} style={styles.thumbImage} />
            {item.is_cover && (
              <View style={styles.coverBadge}>
                <Ionicons name="star" size={12} color={colors.accent} />
              </View>
            )}
          </TouchableOpacity>
        )}
      />

      {/* Upload button */}
      <View style={styles.addButtonContainer}>
        <Button
          title={uploading ? t('media_uploading') : t('media_addPhoto')}
          onPress={handleAddPhoto}
          loading={uploading}
          icon={
            !uploading ? (
              <Ionicons name="camera-outline" size={20} color={colors.white} />
            ) : undefined
          }
        />
      </View>

      {/* Image action modal */}
      <Modal
        visible={!!selectedImage}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedImage(null)}
        >
          <View style={styles.imageActionSheet}>
            {selectedImage && (
              <>
                <Image
                  source={{ uri: selectedImage.url }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
                <View style={styles.imageActions}>
                  {!selectedImage.is_cover && (
                    <TouchableOpacity
                      style={styles.imageActionRow}
                      onPress={() => handleSetCover(selectedImage)}
                    >
                      <Ionicons name="star-outline" size={22} color={colors.accent} />
                      <Text style={styles.imageActionText}>{t('media_setCover')}</Text>
                    </TouchableOpacity>
                  )}
                  {selectedImage.is_cover && (
                    <View style={styles.imageActionRow}>
                      <Ionicons name="star" size={22} color={colors.accent} />
                      <Text style={[styles.imageActionText, { color: colors.accent }]}>
                        {t('media_currentCover')}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.imageActionRow}
                    onPress={() => handleDeleteImage(selectedImage)}
                  >
                    <Ionicons name="trash-outline" size={22} color={colors.error} />
                    <Text style={[styles.imageActionText, { color: colors.error }]}>
                      {t('media_deletePhoto')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.imageActionRow, { borderBottomWidth: 0 }]}
                    onPress={() => setSelectedImage(null)}
                  >
                    <Ionicons name="close-outline" size={22} color={colors.textSecondary} />
                    <Text style={styles.imageActionText}>{t('close')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Documents Tab ───────────────────────────────────────────────────

function DocumentsTab({ propertyId }: { propertyId: string }) {
  const {
    data: documents,
    isLoading,
    refetch,
    isRefetching,
  } = usePropertyDocuments(propertyId);
  const uploadDocument = useUploadPropertyDocument();
  const deleteDocument = useDeletePropertyDocument();
  const [uploading, setUploading] = useState(false);
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [pendingFile, setPendingFile] = useState<{
    uri: string;
    name: string;
    size: number | null;
    mimeType: string;
  } | null>(null);
  const { t, formatDate } = useI18n();

  const handleAddDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPendingFile({
          uri: asset.uri,
          name: asset.name,
          size: asset.size ?? null,
          mimeType: asset.mimeType || 'application/octet-stream',
        });
        setTypeModalVisible(true);
      }
    } catch (e: any) {
      Alert.alert(t('error'), t('media_docSelectError'));
    }
  };

  const handleSelectType = async (documentType: string) => {
    setTypeModalVisible(false);
    if (!pendingFile) return;

    setUploading(true);
    try {
      await uploadDocument.mutateAsync({
        propertyId,
        uri: pendingFile.uri,
        fileName: pendingFile.name,
        fileSize: pendingFile.size,
        mimeType: pendingFile.mimeType,
        documentType,
      });
    } catch (e: any) {
      Alert.alert(t('error'), e.message || t('media_docUploadError'));
    } finally {
      setUploading(false);
      setPendingFile(null);
    }
  };

  const handleOpenDocument = useCallback(async (doc: PropertyDocument) => {
    try {
      let url = doc.signed_url;

      // If no signed URL available, generate one on demand
      if (!url) {
        const { data } = await supabase.storage
          .from('property-documents')
          .createSignedUrl(doc.storage_path, 3600);
        url = data?.signedUrl;
      }

      if (!url) {
        Alert.alert(t('error'), 'Could not generate download URL');
        return;
      }

      const fileUri = FileSystem.cacheDirectory + doc.file_name;
      const result = await FileSystem.downloadAsync(url, fileUri);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri);
      } else {
        await Linking.openURL(url);
      }
    } catch (err: any) {
      console.error('Document open failed:', err);
      if (doc.signed_url) {
        Linking.openURL(doc.signed_url);
      } else {
        Alert.alert(t('error'), err?.message || 'Download failed');
      }
    }
  }, [t]);

  const handleDeleteDocument = (doc: PropertyDocument) => {
    Alert.alert(t('media_deleteDoc'), t('media_deleteDocConfirm', { name: doc.file_name }), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => {
          deleteDocument.mutate(
            {
              documentId: doc.id,
              storagePath: doc.storage_path,
              propertyId,
            },
            {
              onError: () =>
                Alert.alert(t('error'), t('media_deleteDocError')),
            },
          );
        },
      },
    ]);
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocumentIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'expose':
        return 'document-text';
      case 'floor_plan':
        return 'map';
      case 'energy_cert':
        return 'flash';
      case 'purchase_contract':
        return 'document';
      case 'land_registry':
        return 'book';
      case 'partition':
        return 'grid';
      case 'appraisal':
        return 'analytics';
      default:
        return 'attach';
    }
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.tabContent}>
      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.docList}
        refreshing={isRefetching}
        onRefresh={() => refetch()}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyText}>{t('media_noDocuments')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.docItem}
            activeOpacity={0.7}
            onPress={() => handleOpenDocument(item)}
          >
            <View style={styles.docIconContainer}>
              <Ionicons
                name={getDocumentIcon(item.document_type)}
                size={24}
                color={colors.primary}
              />
            </View>
            <View style={styles.docInfo}>
              <Text style={styles.docName} numberOfLines={1}>
                {item.file_name}
              </Text>
              <View style={styles.docMeta}>
                <Badge
                  label={DOCUMENT_TYPE_LABELS[item.document_type] ?? item.document_type}
                  variant="primary"
                  size="sm"
                />
                <Text style={styles.docDate}>{formatDate(item.created_at)}</Text>
                {item.file_size && (
                  <Text style={styles.docSize}>{formatFileSize(item.file_size)}</Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.docDeleteBtn}
              onPress={() => handleDeleteDocument(item)}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      {/* Upload button */}
      <View style={styles.addButtonContainer}>
        <Button
          title={uploading ? t('media_uploading') : t('media_addDocument')}
          onPress={handleAddDocument}
          loading={uploading}
          icon={
            !uploading ? (
              <Ionicons name="add-circle-outline" size={20} color={colors.white} />
            ) : undefined
          }
        />
      </View>

      {/* Document type selector modal */}
      <Modal
        visible={typeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setTypeModalVisible(false);
          setPendingFile(null);
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setTypeModalVisible(false);
            setPendingFile(null);
          }}
        >
          <View style={styles.typeSelector}>
            <Text style={styles.typeSelectorTitle}>{t('media_selectDocType')}</Text>
            {pendingFile && (
              <Text style={styles.typeSelectorFile} numberOfLines={1}>
                {pendingFile.name}
              </Text>
            )}
            <FlatList
              data={DOCUMENT_TYPE_OPTIONS}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.typeOption}
                  onPress={() => handleSelectType(item.value)}
                >
                  <Ionicons
                    name={getDocumentIcon(item.value)}
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.typeOptionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: fontSize.lg,
    color: colors.error,
    marginTop: spacing.md,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },

  // Shared
  tabContent: {
    flex: 1,
  },
  addButtonContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textTertiary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },

  // Photos
  imageGrid: {
    padding: spacing.md,
  },
  imageRow: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  imageThumb: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.borderLight,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  coverBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: borderRadius.sm,
    padding: 3,
  },

  // Image action sheet
  imageActionSheet: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadow.lg,
  },
  previewImage: {
    width: '100%',
    height: 220,
  },
  imageActions: {
    paddingVertical: spacing.sm,
  },
  imageActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  imageActionText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },

  // Documents
  docList: {
    padding: spacing.md,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  docIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  docInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  docName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  docMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  docDate: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  docSize: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  docDeleteBtn: {
    padding: spacing.sm,
  },

  // Document type selector
  typeSelector: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    maxHeight: 480,
    ...shadow.lg,
  },
  typeSelectorTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  typeSelectorFile: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  typeOptionText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
});
