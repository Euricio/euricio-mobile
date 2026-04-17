import React, { useState, useCallback, useRef, useMemo } from 'react';
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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { imagesToPdf } from '../../../lib/imagesToPdf';
import { useContracts, useProperties } from '../../../lib/api/contracts';
import { useLeads, useUploadLeadDocument } from '../../../lib/api/leads';
import { useTeamMembers } from '../../../lib/api/admin-team';
import { useUploadScan } from '../../../lib/api/scanner';
import { uploadToStorage, supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';
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

type SaveLocation = 'device' | 'cloud' | 'contract' | 'property' | 'lead' | 'employee';

export default function ScannerScreen() {
  const { t } = useI18n();
  const uploadScan = useUploadScan();
  const { data: contracts } = useContracts();
  const { data: properties } = useProperties();
  const { data: leads } = useLeads();
  const { data: teamMembers } = useTeamMembers();
  const uploadLeadDoc = useUploadLeadDocument();
  const [pages, setPages] = useState<PageItem[]>([]);
  const [uploading, setUploading] = useState(false);

  // ─── Single Save Modal State ──────────────────────────────────────
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [docName, setDocName] = useState('');
  const [saveLocation, setSaveLocation] = useState<SaveLocation | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const sanitizeFileName = (name: string): string =>
    name.replace(/[^a-zA-Z0-9äöüÄÖÜß _-]/g, '').trim() || 'Scan';

  // ─── Persist picked images to a stable cache dir immediately ────────
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

  // ─── Save Options — Single Modal ───────────────────────────────────

  const showSaveOptions = () => {
    if (pages.length === 0) return;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setDocName(
      `Scan_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`,
    );
    setSaveLocation(null);
    setSelectedItemId(null);
    setSearchQuery('');
    setSaveModalVisible(true);
  };

  const closeSaveModal = () => {
    setSaveModalVisible(false);
  };

  // ─── Picker data & labels per location ─────────────────────────────

  const needsPicker = saveLocation === 'contract' || saveLocation === 'property' || saveLocation === 'lead' || saveLocation === 'employee';

  const pickerSectionLabel = useMemo(() => {
    switch (saveLocation) {
      case 'contract': return t('scanner_selectContract');
      case 'property': return t('scanner_selectProperty');
      case 'lead': return t('scanner_selectLead');
      case 'employee': return t('scanner_selectEmployee');
      default: return '';
    }
  }, [saveLocation, t]);

  const pickerItems: { id: string; label: string; subtitle?: string }[] = useMemo(() => {
    const query = searchQuery.toLowerCase();
    switch (saveLocation) {
      case 'contract': {
        const list = contracts ?? [];
        return list
          .filter((c) => {
            if (!query) return true;
            const label = `${c.client_name} ${t(`contractType_${c.contract_type}`)}`.toLowerCase();
            return label.includes(query);
          })
          .map((c) => ({
            id: c.id,
            label: `${c.client_name} — ${t(`contractType_${c.contract_type}`)}`,
          }));
      }
      case 'property': {
        const list = properties ?? [];
        return list
          .filter((p) => {
            if (!query) return true;
            const label = (p.title || `${p.address || ''} ${p.city || ''}`).toLowerCase();
            return label.includes(query);
          })
          .map((p) => ({
            id: p.id,
            label: p.title || `${p.address || ''}, ${p.city || ''}`.replace(/^, |, $/g, ''),
          }));
      }
      case 'lead': {
        const list = leads ?? [];
        return list
          .filter((l) => {
            if (!query) return true;
            return l.full_name.toLowerCase().includes(query);
          })
          .map((l) => ({
            id: l.id,
            label: l.full_name,
          }));
      }
      case 'employee': {
        const list = teamMembers ?? [];
        return list
          .filter((m) => {
            if (!query) return true;
            const label = `${m.full_name || ''} ${m.position || ''} ${m.email || ''}`.toLowerCase();
            return label.includes(query);
          })
          .map((m) => ({
            id: m.id,
            label: m.full_name || m.email || m.id,
            subtitle: m.position || undefined,
          }));
      }
      default:
        return [];
    }
  }, [saveLocation, searchQuery, contracts, properties, leads, teamMembers, t]);

  // ─── Can save? ─────────────────────────────────────────────────────

  const canSave = useMemo(() => {
    if (!saveLocation) return false;
    if (!docName.trim()) return false;
    if (needsPicker && !selectedItemId) return false;
    return true;
  }, [saveLocation, docName, needsPicker, selectedItemId]);

  // ─── Confirm save ──────────────────────────────────────────────────

  const handleSaveConfirm = () => {
    setSaveModalVisible(false);
    const name = sanitizeFileName(docName);
    switch (saveLocation) {
      case 'device':
        handleShareToDevice(name);
        break;
      case 'cloud':
        handleSave(pages.map((p) => p.uri), 'images', undefined, name);
        break;
      case 'contract':
        handleSave(pages.map((p) => p.uri), 'images', selectedItemId!, name);
        break;
      case 'property':
        handlePropertyUpload(selectedItemId!, name);
        break;
      case 'lead':
        handleLeadUpload(selectedItemId!, name);
        break;
      case 'employee':
        handleEmployeeUpload(selectedItemId!, name);
        break;
    }
  };

  // ─── Save to device via share sheet ─────────────────────────────────

  const handleShareToDevice = async (docName?: string) => {
    if (pages.length === 0) return;
    setUploading(true);
    try {
      const uris = pages.map((p) => p.uri);
      const pdfUri = await imagesToPdf(uris);

      await uploadScan.mutateAsync({
        fileUris: [pdfUri],
        mode: 'pdf',
      });

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

  const handleSave = async (uris: string[], mode: 'images' | 'pdf', contractId?: string, docName?: string) => {
    setUploading(true);
    try {
      let finalUris = uris;
      let finalMode: 'images' | 'pdf' = mode;

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

  // ─── Property Upload ───────────────────────────────────────────────

  const handlePropertyUpload = async (propertyId: string, docName?: string) => {
    setUploading(true);
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) throw new Error('Not authenticated');

      const uris = pages.map((p) => p.uri);
      const pdfUri = await imagesToPdf(uris);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = docName ? `${docName}.pdf` : `${timestamp}.pdf`;
      const storagePath = `${userId}/properties/${propertyId}/${fileName}`;

      const { size } = await uploadToStorage(
        'property-documents',
        storagePath,
        pdfUri,
        'application/pdf',
      );

      const { error } = await supabase.from('property_documents').insert({
        property_id: propertyId,
        storage_path: storagePath,
        file_name: fileName,
        file_size: size,
        document_type: 'scan',
        uploaded_by: userId,
      });
      if (error) throw error;

      Alert.alert(t('scanner_propertySuccess'));
      setPages([]);
      router.back();
    } catch (err: any) {
      console.error('Scanner property upload failed:', err);
      Alert.alert(t('error'), err?.message || t('scanner_uploadError'));
    } finally {
      setUploading(false);
    }
  };

  // ─── Lead Upload ──────────────────────────────────────────────────

  const handleLeadUpload = async (leadId: string, docName?: string) => {
    setUploading(true);
    try {
      const uris = pages.map((p) => p.uri);
      const pdfUri = await imagesToPdf(uris);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = docName ? `${docName}.pdf` : `${timestamp}.pdf`;

      await uploadLeadDoc.mutateAsync({ leadId, pdfUri, fileName });

      Alert.alert(t('scanner_leadSuccess'));
      setPages([]);
      router.back();
    } catch (err: any) {
      console.error('Scanner lead upload failed:', err);
      Alert.alert(t('error'), err?.message || t('scanner_uploadError'));
    } finally {
      setUploading(false);
    }
  };

  // ─── Employee Upload (NEW) ────────────────────────────────────────

  const handleEmployeeUpload = async (profileId: string, docName?: string) => {
    setUploading(true);
    try {
      const userId = useAuthStore.getState().user?.id;
      if (!userId) throw new Error('Not authenticated');

      const uris = pages.map((p) => p.uri);
      const pdfUri = await imagesToPdf(uris);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = docName ? `${docName}.pdf` : `${timestamp}.pdf`;
      const storagePath = `employee-docs/${profileId}/${fileName}`;

      await uploadToStorage(
        'scanned-documents',
        storagePath,
        pdfUri,
        'application/pdf',
      );

      Alert.alert(t('scanner_employeeSuccess'));
      setPages([]);
      router.back();
    } catch (err: any) {
      console.error('Scanner employee upload failed:', err);
      Alert.alert(t('error'), err?.message || t('scanner_uploadError'));
    } finally {
      setUploading(false);
    }
  };

  // ─── Location selection handler ────────────────────────────────────

  const handleLocationSelect = (location: SaveLocation) => {
    setSaveLocation(location);
    setSelectedItemId(null);
    setSearchQuery('');
  };

  // ─── Render ─────────────────────────────────────────────────────────

  const locationOptions: { key: SaveLocation; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    { key: 'device', icon: 'phone-portrait-outline', label: t('scanner_saveToDevice') },
    { key: 'cloud', icon: 'cloud-upload-outline', label: t('scanner_uploadToCloud') },
    { key: 'contract', icon: 'document-text-outline', label: t('scanner_assignToContract') },
    { key: 'property', icon: 'home-outline', label: t('scanner_assignToProperty') },
    { key: 'lead', icon: 'person-outline', label: t('scanner_assignToLead') },
    { key: 'employee', icon: 'people-outline', label: t('scanner_assignToEmployee') },
  ];

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

      {/* ─── Single Full-Screen Save Modal ───────────────────────── */}
      <Modal
        visible={saveModalVisible}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
        onRequestClose={closeSaveModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.saveModalContainer}
        >
          {/* Header */}
          <View style={styles.saveModalHeader}>
            <TouchableOpacity onPress={closeSaveModal} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.saveModalTitle}>{t('scanner_saveDocument')}</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView
            style={styles.saveModalBody}
            contentContainerStyle={styles.saveModalBodyContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Document Name */}
            <Text style={styles.sectionLabel}>{t('scanner_documentName').toUpperCase()}</Text>
            <TextInput
              style={styles.docNameInput}
              value={docName}
              onChangeText={setDocName}
              placeholder={t('scanner_documentNamePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              autoCorrect={false}
              selectTextOnFocus
            />

            {/* Save Location */}
            <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>
              {t('scanner_saveLocation').toUpperCase()}
            </Text>
            <View style={styles.radioGroup}>
              {locationOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={styles.radioRow}
                  onPress={() => handleLocationSelect(opt.key)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.radioCircle,
                    saveLocation === opt.key && styles.radioCircleSelected,
                  ]}>
                    {saveLocation === opt.key && <View style={styles.radioCircleInner} />}
                  </View>
                  <Ionicons name={opt.icon} size={20} color={saveLocation === opt.key ? colors.primary : colors.textSecondary} />
                  <Text style={[
                    styles.radioLabel,
                    saveLocation === opt.key && styles.radioLabelSelected,
                  ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Conditional Picker */}
            {needsPicker && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>
                  {pickerSectionLabel.toUpperCase()}
                </Text>
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={t('scanner_search')}
                  placeholderTextColor={colors.textSecondary}
                  autoCorrect={false}
                />
                <View style={styles.pickerList}>
                  {pickerItems.length === 0 ? (
                    <Text style={styles.pickerEmpty}>
                      {saveLocation === 'contract' ? t('scanner_noContracts') :
                       saveLocation === 'property' ? t('scanner_noProperties') :
                       saveLocation === 'lead' ? t('scanner_noLeads') :
                       t('scanner_noEmployees')}
                    </Text>
                  ) : (
                    pickerItems.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.pickerItem,
                          selectedItemId === item.id && styles.pickerItemSelected,
                        ]}
                        onPress={() => setSelectedItemId(item.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[
                          styles.radioCircle,
                          selectedItemId === item.id && styles.radioCircleSelected,
                        ]}>
                          {selectedItemId === item.id && <View style={styles.radioCircleInner} />}
                        </View>
                        <View style={styles.pickerItemText}>
                          <Text
                            style={[
                              styles.pickerItemLabel,
                              selectedItemId === item.id && styles.pickerItemLabelSelected,
                            ]}
                            numberOfLines={1}
                          >
                            {item.label}
                          </Text>
                          {'subtitle' in item && item.subtitle ? (
                            <Text style={styles.pickerItemSubtitle} numberOfLines={1}>
                              {item.subtitle}
                            </Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </>
            )}
          </ScrollView>

          {/* Speichern Button */}
          <View style={styles.saveModalFooter}>
            <TouchableOpacity
              style={[styles.confirmButton, !canSave && styles.confirmButtonDisabled]}
              onPress={handleSaveConfirm}
              disabled={!canSave}
              activeOpacity={0.8}
            >
              <Text style={[styles.confirmButtonText, !canSave && styles.confirmButtonTextDisabled]}>
                {t('scanner_save').toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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

  // ─── Save Modal ────────────────────────────────────────────────────
  saveModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  saveModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  saveModalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  saveModalBody: {
    flex: 1,
  },
  saveModalBodyContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  docNameInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.surface,
  },

  // Radio group
  radioGroup: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: colors.primary,
  },
  radioCircleInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  radioLabel: {
    fontSize: fontSize.md,
    color: colors.text,
    flex: 1,
  },
  radioLabelSelected: {
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },

  // Search input
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },

  // Picker list
  pickerList: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    maxHeight: 280,
  },
  pickerEmpty: {
    padding: spacing.md,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pickerItemSelected: {
    backgroundColor: colors.primary + '08',
  },
  pickerItemText: {
    flex: 1,
  },
  pickerItemLabel: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  pickerItemLabelSelected: {
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  pickerItemSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Confirm button
  saveModalFooter: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: colors.border,
  },
  confirmButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
    letterSpacing: 0.5,
  },
  confirmButtonTextDisabled: {
    color: colors.textSecondary,
  },
});
