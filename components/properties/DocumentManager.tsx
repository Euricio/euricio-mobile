import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
  ActivityIndicator,
  Switch,
  Linking,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useI18n, LOCALE_LABELS } from '../../lib/i18n';
import type { Locale } from '../../lib/i18n';
import {
  useDocumentRequests,
  usePortalAccesses,
  useCustomDocTypes,
  useSaveDocumentRequests,
  useAddCustomDocType,
  useRemoveCustomDocType,
  useCreateAccessWithRequests,
  useTogglePortalAccess,
  useDeletePortalAccess,
  DOCUMENT_TYPES,
  DocumentRequest,
  CustomDocType,
} from '../../lib/api/document-requests';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../constants/theme';

// ─── Status badge colors ─────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  not_requested: { bg: colors.borderLight, text: colors.textTertiary },
  requested: { bg: 'rgba(245,158,11,0.12)', text: '#F59E0B' },
  uploaded: { bg: 'rgba(16,185,129,0.12)', text: '#10B981' },
  verified: { bg: 'rgba(59,130,246,0.12)', text: '#3B82F6' },
};

// ─── Props ───────────────────────────────────────────────────────────

interface DocumentManagerProps {
  propertyId: string;
  propertyName?: string;
  propertyAddress?: string;
}

// ─── Component ───────────────────────────────────────────────────────

export function DocumentManager({
  propertyId,
  propertyName,
  propertyAddress,
}: DocumentManagerProps) {
  const { t, locale, formatDate } = useI18n();

  // ── Data hooks ────────────────────────────────────────────────────
  const { data: requests = [], isLoading: loadingReqs } = useDocumentRequests(propertyId);
  const { data: accesses = [], isLoading: loadingAccesses } = usePortalAccesses(propertyId);
  const { data: customTypes = [] } = useCustomDocTypes();

  const saveRequests = useSaveDocumentRequests();
  const addCustomType = useAddCustomDocType();
  const removeCustomType = useRemoveCustomDocType();
  // Verheirateter Flow: Access + Dokumenten-Anforderungen in einem Call.
  // Ersetzt useCreatePortalAccess hier, damit ein einziger Button beides
  // erledigt. Die Legacy-Hook bleibt im API-Modul erhalten für zukünftige
  // separate Use-Cases.
  const createPortalAccess = useCreateAccessWithRequests();
  const togglePortalAccess = useTogglePortalAccess();
  const deletePortalAccess = useDeletePortalAccess();

  // ── Local state ───────────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [deleteMsg, setDeleteMsg] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalEmail, setModalEmail] = useState('');
  const [modalCustomerName, setModalCustomerName] = useState('');
  const [modalLanguage, setModalLanguage] = useState<Locale>(locale);
  const [createdCreds, setCreatedCreds] = useState<{
    email: string;
    password: string;
    link: string;
    emailResult: { sent: boolean; error: string; smtpWarning: boolean };
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [openingReqId, setOpeningReqId] = useState<string | null>(null);

  // ── Initialize selection from existing requests ───────────────────
  useEffect(() => {
    if (!initialized && requests.length > 0) {
      const preSelected = new Set<string>();
      requests.forEach((r) => preSelected.add(r.document_type));
      setSelected(preSelected);
      setInitialized(true);
    }
  }, [requests, initialized]);

  // ── Helpers ───────────────────────────────────────────────────────
  const getStatus = useCallback(
    (docKey: string): string => {
      const req = requests.find((r) => r.document_type === docKey);
      return req ? req.status : 'not_requested';
    },
    [requests],
  );

  const getRequest = useCallback(
    (docKey: string): DocumentRequest | undefined => {
      return requests.find((r) => r.document_type === docKey);
    },
    [requests],
  );

  const toggleDoc = useCallback(
    (key: string) => {
      const req = requests.find((r) => r.document_type === key);
      if (req && (req.status === 'uploaded' || req.status === 'verified')) return;
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    },
    [requests],
  );

  const selectAll = useCallback(() => {
    const all = new Set<string>();
    DOCUMENT_TYPES.forEach((d) => all.add(d.key));
    customTypes.forEach((ct) => all.add(`custom:${ct.id}`));
    setSelected(all);
  }, [customTypes]);

  const deselectAll = useCallback(() => {
    const keep = new Set<string>();
    requests.forEach((r) => {
      if (r.status === 'uploaded' || r.status === 'verified') keep.add(r.document_type);
    });
    setSelected(keep);
  }, [requests]);

  // ── Actions ───────────────────────────────────────────────────────
  const handleSaveRequests = useCallback(() => {
    setSaveMsg('');
    saveRequests.mutate(
      { propertyId, selected: Array.from(selected), existingRequests: requests },
      {
        onSuccess: () => {
          setSaveMsg(t('docportal.requestDocs.saved'));
          setTimeout(() => setSaveMsg(''), 2000);
        },
      },
    );
  }, [propertyId, selected, requests, saveRequests, t]);

  const handleAddCustom = useCallback(() => {
    const name = customInput.trim();
    if (!name) return;
    addCustomType.mutate(name, {
      onSuccess: () => setCustomInput(''),
    });
  }, [customInput, addCustomType]);

  const handleRemoveCustom = useCallback(
    (ct: CustomDocType) => {
      const docTypeKey = `custom:${ct.id}`;
      const req = requests.find((r) => r.document_type === docTypeKey);
      if (req && (req.status === 'uploaded' || req.status === 'verified')) return;

      removeCustomType.mutate(
        { customId: ct.id, propertyId, existingRequest: req },
        {
          onSuccess: () => {
            setSelected((prev) => {
              const next = new Set(prev);
              next.delete(docTypeKey);
              return next;
            });
          },
        },
      );
    },
    [requests, propertyId, removeCustomType],
  );

  const openModal = useCallback(() => {
    setCreatedCreds(null);
    setModalEmail('');
    setModalCustomerName('');
    setModalLanguage(locale);
    setCopiedField(null);
    setShowModal(true);
  }, [locale]);

  const handleCreateAccess = useCallback(async () => {
    if (!modalEmail.trim()) return;

    createPortalAccess.mutate(
      {
        propertyId,
        clientEmail: modalEmail.trim(),
        customerName: modalCustomerName.trim(),
        selectedDocs: Array.from(selected),
        propertyName: propertyName || 'Property',
        propertyAddress: propertyAddress || '',
        language: modalLanguage as 'de' | 'en' | 'es',
        customTypes,
      },
      {
        onSuccess: (result) => {
          setCreatedCreds({
            email: result.email,
            password: result.password,
            link: result.link,
            emailResult: result.emailResult,
          });
        },
      },
    );
  }, [
    modalEmail,
    modalCustomerName,
    modalLanguage,
    propertyId,
    selected,
    propertyName,
    propertyAddress,
    customTypes,
    createPortalAccess,
  ]);

  const handleToggleAccess = useCallback(
    (accessId: string, isActive: boolean) => {
      togglePortalAccess.mutate({ accessId, isActive, propertyId });
    },
    [propertyId, togglePortalAccess],
  );

  const handleDeleteAccess = useCallback(
    (accessId: string, email: string) => {
      const msg = t('docportal.access.delete_confirm').replace('{email}', email);
      Alert.alert(t('docportal.access.delete'), msg, [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => {
            deletePortalAccess.mutate(
              { accessId, propertyId },
              {
                onSuccess: () => {
                  setDeleteMsg(t('docportal.access.deleted'));
                  setTimeout(() => setDeleteMsg(''), 2000);
                },
              },
            );
          },
        },
      ]);
    },
    [propertyId, deletePortalAccess, t],
  );

  const copyToClipboard = useCallback(async (text: string, field: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  const copyAllCredentials = useCallback(() => {
    if (!createdCreds) return;
    const text = `${t('docportal.accessModal.email.label')}: ${createdCreds.email}\n${t('docportal.accessModal.password')}: ${createdCreds.password}\n${t('docportal.accessModal.portalLink')}: ${createdCreds.link}`;
    copyToClipboard(text, 'all-creds');
  }, [createdCreds, t, copyToClipboard]);

  const fmtDate = (s: string | null) => {
    if (!s) return '—';
    return formatDate(s);
  };

  // Hooks MUST be declared before any conditional return — otherwise the
  // hook count between renders changes (loading → loaded) and React throws
  // "Rendered more hooks than during the previous render". Hotfix #5 left
  // `handleOpenRequest` after the `if (loadingReqs) return …` block, which
  // produced exactly that crash on the property detail screen.
  const handleOpenRequest = useCallback(async (req: DocumentRequest) => {
    if (!req.storage_path) {
      Alert.alert(t('error'), t('docportal.open.noPath'));
      return;
    }
    setOpeningReqId(req.id);
    try {
      // Auth-Token der Makler-Session holen — der Proxy-Endpoint erwartet
      // einen gültigen Supabase-Bearer.
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        Alert.alert(t('error'), t('docportal.open.failed'));
        return;
      }

      // Datei-URL über eigene Domain (crm.euricio.es/api/files/…). Damit
      // sieht der Nutzer niemals eine Supabase-URL.
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://crm.euricio.es';
      const proxyUrl = `${apiUrl}/api/files/${req.storage_path.split('/').map(encodeURIComponent).join('/')}`;

      // Dateinamen + Extension ableiten für lokalen Cache-Pfad
      const rawName = req.file_name || req.storage_path.split('/').pop() || 'dokument';
      let decodedName = rawName;
      try { decodedName = decodeURIComponent(rawName); } catch { /* ignore */ }
      const safeName = decodedName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120) || 'dokument';

      // Download in Cache-Verzeichnis (mit Auth-Header)
      const cacheDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
      if (!cacheDir) {
        Alert.alert(t('error'), t('docportal.open.failed'));
        return;
      }
      const localPath = `${cacheDir}${Date.now()}_${safeName}`;
      const download = await FileSystem.downloadAsync(proxyUrl, localPath, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (download.status !== 200) {
        Alert.alert(t('error'), `HTTP ${download.status}`);
        return;
      }

      // Öffnen via Share-Sheet — iOS Quick-Look öffnet inline (PDF, Bilder,
      // DOCX etc.), Android nutzt den MIME-Typ für passende App-Auswahl.
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(download.uri, {
          mimeType: req.mime_type ?? undefined,
          UTI: req.mime_type === 'application/pdf' ? 'com.adobe.pdf' : undefined,
          dialogTitle: decodedName,
        });
      } else {
        await Linking.openURL(download.uri);
      }
    } catch (e: any) {
      Alert.alert(t('error'), e?.message ?? t('docportal.open.failed'));
    } finally {
      setOpeningReqId(null);
    }
  }, [t]);

  // ── Loading state ─────────────────────────────────────────────────
  // (Now safe — declared after every hook so the hook count is stable.)
  if (loadingReqs) {
    return (
      <Card style={styles.section}>
        <Text style={styles.sectionLabel}>{t('docportal.section.title')}</Text>
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
      </Card>
    );
  }

  // ── Render doc row ────────────────────────────────────────────────
  const renderDocRow = (docKey: string, label: string, category: string, isCustom: boolean, customType?: CustomDocType) => {
    const status = getStatus(docKey);
    const req = getRequest(docKey);
    const sty = STATUS_COLORS[status] || STATUS_COLORS.not_requested;
    const isLocked = status === 'uploaded' || status === 'verified';
    const isChecked = selected.has(docKey);
    const canOpen = (status === 'uploaded' || status === 'verified') && !!req?.storage_path;
    const isOpening = openingReqId === req?.id;

    return (
      <TouchableOpacity
        key={docKey}
        style={[styles.docRow, isChecked && styles.docRowSelected]}
        onPress={() => toggleDoc(docKey)}
        activeOpacity={isLocked ? 1 : 0.7}
        disabled={isLocked}
      >
        {/* Checkbox */}
        <View style={[styles.checkbox, isChecked && styles.checkboxChecked, isLocked && styles.checkboxLocked]}>
          {isChecked && <Ionicons name="checkmark" size={14} color={isLocked ? colors.textTertiary : colors.white} />}
        </View>

        {/* Doc name + category */}
        <View style={styles.docInfo}>
          <Text style={styles.docName}>{label}</Text>
          <Text style={styles.docCategory}>{category}</Text>
        </View>

        {/* Upload date */}
        {req?.uploaded_at && (
          <Text style={styles.docDate}>{fmtDate(req.uploaded_at)}</Text>
        )}

        {/* Open uploaded document */}
        {canOpen && req && (
          <TouchableOpacity
            style={styles.openBtn}
            onPress={(e) => {
              e.stopPropagation?.();
              handleOpenRequest(req);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            disabled={isOpening}
          >
            {isOpening ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="open-outline" size={18} color={colors.primary} />
            )}
          </TouchableOpacity>
        )}

        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: sty.bg }]}>
          <Text style={[styles.statusText, { color: sty.text }]}>
            {t(`docportal.status.${status}`)}
          </Text>
        </View>

        {/* Delete button for custom types */}
        {isCustom && !isLocked && customType && (
          <TouchableOpacity
            style={styles.deleteCustomBtn}
            onPress={(e) => {
              e.stopPropagation?.();
              handleRemoveCustom(customType);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      {/* ═══ Document Checklist ═══════════════════════════════════════ */}
      <Card style={styles.section}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.sectionLabel}>{t('docportal.section.title')}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={selectAll} style={styles.ghostBtn}>
              <Text style={styles.ghostBtnText}>{t('docportal.selectAll')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={deselectAll} style={styles.ghostBtn}>
              <Text style={styles.ghostBtnText}>{t('docportal.deselectAll')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Standard document types */}
        {DOCUMENT_TYPES.map((doc) =>
          renderDocRow(
            doc.key,
            t(`docportal.doc.${doc.key}`),
            t(`docportal.category.${doc.category}`),
            false,
          ),
        )}

        {/* Custom document types */}
        {customTypes.map((ct) =>
          renderDocRow(
            `custom:${ct.id}`,
            ct.name,
            t('docportal.category.custom'),
            true,
            ct,
          ),
        )}

        {/* Add custom type */}
        <View style={styles.addCustomSection}>
          <Text style={styles.addCustomLabel}>{t('docportal.addCustom')}</Text>
          <View style={styles.addCustomRow}>
            <TextInput
              style={styles.addCustomInput}
              value={customInput}
              onChangeText={setCustomInput}
              placeholder={t('docportal.customName.placeholder')}
              placeholderTextColor={colors.textTertiary}
              returnKeyType="done"
              onSubmitEditing={handleAddCustom}
            />
            <Button
              title={t('docportal.add')}
              onPress={handleAddCustom}
              size="sm"
              disabled={addCustomType.isPending || !customInput.trim()}
              loading={addCustomType.isPending}
            />
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <Button
            title={saveRequests.isPending ? t('docportal.requestDocs.saving') : t('docportal.requestDocs')}
            onPress={handleSaveRequests}
            loading={saveRequests.isPending}
            disabled={saveRequests.isPending}
            size="sm"
            icon={<Ionicons name="save-outline" size={16} color={colors.white} />}
          />
          <Button
            title={t('docportal.createAccess')}
            onPress={openModal}
            variant="outline"
            size="sm"
            icon={<Ionicons name="link-outline" size={16} color={colors.primary} />}
          />
        </View>
        {saveMsg !== '' && <Text style={styles.successMsg}>{saveMsg}</Text>}
      </Card>

      {/* ═══ Portal Access List ═══════════════════════════════════════ */}
      {accesses.length > 0 && (
        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>{t('docportal.manageAccess')}</Text>
          {deleteMsg !== '' && <Text style={styles.successMsg}>{deleteMsg}</Text>}
          {accesses.map((acc) => (
            <View key={acc.id} style={styles.accessCard}>
              <View style={styles.accessInfo}>
                <Text style={styles.accessEmail}>{acc.client_email}</Text>
                <Text style={styles.accessDate}>
                  {t('general.created_at')}: {fmtDate(acc.created_at)}
                </Text>
              </View>
              <View style={styles.accessActions}>
                <View style={[styles.activeBadge, { backgroundColor: acc.is_active ? colors.successLight : colors.borderLight }]}>
                  <Text style={[styles.activeBadgeText, { color: acc.is_active ? colors.success : colors.textTertiary }]}>
                    {acc.is_active ? t('docportal.accessModal.activate') : t('docportal.accessModal.deactivate')}
                  </Text>
                </View>
                <Switch
                  value={acc.is_active}
                  onValueChange={() => handleToggleAccess(acc.id, acc.is_active)}
                  trackColor={{ false: colors.borderLight, true: colors.primaryLight }}
                  thumbColor={acc.is_active ? colors.primary : colors.textTertiary}
                  style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                />
                <TouchableOpacity
                  onPress={() => handleDeleteAccess(acc.id, acc.client_email)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </Card>
      )}

      {/* ═══ Create Portal Access Modal ═══════════════════════════════ */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.backdrop} onPress={() => setShowModal(false)} />
          <View style={styles.sheet}>
            <View style={styles.handle} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Ionicons name="link-outline" size={22} color={colors.primary} />
              <Text style={styles.modalTitle}>{t('docportal.accessModal.title')}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              {!createdCreds ? (
                <>
                  {/* Email */}
                  <Text style={styles.inputLabel}>{t('docportal.accessModal.email')}</Text>
                  <TextInput
                    style={styles.input}
                    value={modalEmail}
                    onChangeText={setModalEmail}
                    placeholder={t('docportal.accessModal.emailPlaceholder')}
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                  />

                  {/* Customer name */}
                  <Text style={styles.inputLabel}>{t('docportal.accessModal.customerName')}</Text>
                  <TextInput
                    style={styles.input}
                    value={modalCustomerName}
                    onChangeText={setModalCustomerName}
                    placeholder={t('docportal.accessModal.customerName')}
                    placeholderTextColor={colors.textTertiary}
                  />

                  {/* Language */}
                  <Text style={styles.inputLabel}>
                    {t('docportal.accessModal.customerLanguage')} <Text style={{ color: colors.error }}>*</Text>
                  </Text>
                  <View style={styles.langRow}>
                    {(['de', 'en', 'es'] as Locale[]).map((loc) => (
                      <TouchableOpacity
                        key={loc}
                        style={[styles.langChip, modalLanguage === loc && styles.langChipActive]}
                        onPress={() => setModalLanguage(loc)}
                      >
                        <Text
                          style={[styles.langChipText, modalLanguage === loc && styles.langChipTextActive]}
                        >
                          {LOCALE_LABELS[loc]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Selected docs summary */}
                  <Text style={styles.inputLabel}>
                    {t('docportal.accessModal.requestedDocs')} ({selected.size} {t('docportal.accessModal.docsSelected')})
                  </Text>
                  {selected.size === 0 ? (
                    <View style={styles.warningBox}>
                      <Text style={styles.warningText}>{t('docportal.accessModal.noDocsSelected')}</Text>
                    </View>
                  ) : (
                    <View style={styles.selectedDocsList}>
                      {Array.from(selected).map((docKey) => {
                        const isCustom = docKey.startsWith('custom:');
                        const customType = isCustom ? customTypes.find((ct) => `custom:${ct.id}` === docKey) : null;
                        const label = isCustom ? (customType?.name || docKey) : t(`docportal.doc.${docKey}`);
                        return (
                          <View key={docKey} style={styles.selectedDocItem}>
                            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                            <Text style={styles.selectedDocText}>{label}</Text>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* Modal Actions */}
                  <View style={styles.modalActions}>
                    <Button
                      title={t('cancel')}
                      onPress={() => setShowModal(false)}
                      variant="ghost"
                      size="sm"
                    />
                    <Button
                      title={createPortalAccess.isPending ? t('docportal.accessModal.creating') : t('docportal.accessModal.createAndSend')}
                      onPress={handleCreateAccess}
                      loading={createPortalAccess.isPending}
                      disabled={createPortalAccess.isPending || !modalEmail.trim()}
                      size="sm"
                      icon={!createPortalAccess.isPending ? <Ionicons name="send" size={14} color={colors.white} /> : undefined}
                    />
                  </View>
                </>
              ) : (
                <>
                  {/* Success message */}
                  <View style={styles.successBox}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                    <Text style={styles.successBoxText}>{t('docportal.accessModal.success')}</Text>
                  </View>

                  {/* Email status */}
                  {createdCreds.emailResult.sent && (
                    <View style={styles.infoBox}>
                      <Ionicons name="mail" size={14} color={colors.info} />
                      <Text style={styles.infoBoxText}>
                        {t('docportal.email.successWithEmail')} {createdCreds.email}
                      </Text>
                    </View>
                  )}
                  {createdCreds.emailResult.smtpWarning && (
                    <View style={styles.warningBox}>
                      <Ionicons name="warning" size={14} color={colors.warning} />
                      <Text style={styles.warningText}>{t('docportal.email.smtpWarning')}</Text>
                    </View>
                  )}
                  {createdCreds.emailResult.error !== '' && !createdCreds.emailResult.smtpWarning && (
                    <View style={styles.errorBox}>
                      <Ionicons name="close-circle" size={14} color={colors.error} />
                      <Text style={styles.errorBoxText}>{t('docportal.email.error')}</Text>
                    </View>
                  )}

                  {/* Credentials */}
                  <Text style={styles.credentialsLabel}>{t('docportal.accessModal.credentials')}</Text>
                  <Text style={styles.credentialsHint}>{t('docportal.accessModal.passwordHint')}</Text>
                  {[
                    { label: t('docportal.accessModal.email.label'), value: createdCreds.email, field: 'cred-email' },
                    { label: t('docportal.accessModal.password'), value: createdCreds.password, field: 'cred-pass' },
                    { label: t('docportal.accessModal.portalLink'), value: createdCreds.link, field: 'cred-link' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.field}
                      style={styles.credRow}
                      onPress={() => copyToClipboard(item.value, item.field)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.credLabel}>{item.label}</Text>
                      <Text style={styles.credValue} numberOfLines={1}>{item.value}</Text>
                      <View style={styles.copyBtn}>
                        <Ionicons
                          name={copiedField === item.field ? 'checkmark' : 'copy-outline'}
                          size={16}
                          color={copiedField === item.field ? colors.success : colors.primary}
                        />
                      </View>
                    </TouchableOpacity>
                  ))}

                  {/* Done actions */}
                  <View style={styles.modalActions}>
                    <Button
                      title={copiedField === 'all-creds' ? t('docportal.accessModal.copied') : t('docportal.accessModal.copyAll')}
                      onPress={copyAllCredentials}
                      variant="outline"
                      size="sm"
                      icon={<Ionicons name="copy-outline" size={14} color={colors.primary} />}
                    />
                    <Button
                      title={t('docportal.accessModal.close')}
                      onPress={() => setShowModal(false)}
                      size="sm"
                    />
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  section: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  ghostBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  ghostBtnText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },

  // Document row
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: spacing.sm,
  },
  docRowSelected: {
    backgroundColor: colors.background,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkboxLocked: {
    backgroundColor: colors.borderLight,
    borderColor: colors.border,
  },
  docInfo: {
    flex: 1,
    minWidth: 0,
  },
  docName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  docCategory: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  docDate: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  deleteCustomBtn: {
    padding: spacing.xs,
  },
  openBtn: {
    padding: spacing.xs,
    marginRight: spacing.xs,
  },

  // Add custom
  addCustomSection: {
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  addCustomLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  addCustomRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  addCustomInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: fontSize.sm,
    color: colors.text,
  },

  // Action row
  actionRow: {
    flexDirection: 'column',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  successMsg: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.success,
    marginTop: spacing.sm,
  },

  // Portal access list
  accessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  accessInfo: {
    flex: 1,
  },
  accessEmail: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  accessDate: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  accessActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  activeBadge: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
  },
  activeBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },

  // Modal
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + 20,
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modalTitle: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  modalScroll: {
    flexGrow: 0,
  },
  inputLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  langRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  langChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  langChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  langChipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  langChipTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  passwordRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  generateBtnText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },

  // Selected docs in modal
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
  },
  warningText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.warning,
  },
  selectedDocsList: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    maxHeight: 140,
  },
  selectedDocItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  selectedDocText: {
    fontSize: fontSize.xs,
    color: colors.text,
  },

  // Modal actions
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },

  // Credentials after creation
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.2)',
    marginBottom: spacing.md,
  },
  successBoxText: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.success,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.infoLight,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.15)',
    marginBottom: spacing.md,
  },
  infoBoxText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.info,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.15)',
    marginBottom: spacing.md,
  },
  errorBoxText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.error,
  },
  credentialsLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  credentialsHint: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: spacing.sm,
  },
  credRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  credLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textTertiary,
    minWidth: 60,
  },
  credValue: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  copyBtn: {
    padding: spacing.xs,
  },
});
