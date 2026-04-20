import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../../lib/i18n';
import { useRecordInteraction, InteractionPayload } from '../../lib/api/callWorkspace';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../constants/theme';

export type QuickActionKind = 'note' | 'callback' | 'task' | 'appointment';

interface Props {
  entity_type: 'lead' | 'property_owner' | 'partner';
  entity_id: number;
  entityName: string;
  /** Render style — 'dark' for the in-call screen, 'light' elsewhere */
  variant?: 'dark' | 'light';
  onActionRecorded?: (kind: QuickActionKind) => void;
}

const ICON_BY_KIND: Record<QuickActionKind, keyof typeof import('@expo/vector-icons').Ionicons.glyphMap> = {
  note: 'document-text-outline',
  callback: 'call-outline',
  task: 'checkbox-outline',
  appointment: 'calendar-outline',
};

const KIND_LABEL: Record<QuickActionKind, string> = {
  note: 'call_ws_action_note',
  callback: 'call_ws_action_callback',
  task: 'call_ws_action_task',
  appointment: 'call_ws_action_appointment',
};

export function QuickActions({
  entity_type,
  entity_id,
  entityName,
  variant = 'dark',
  onActionRecorded,
}: Props) {
  const { t } = useI18n();
  const [openKind, setOpenKind] = useState<QuickActionKind | null>(null);

  const kinds: QuickActionKind[] =
    entity_type === 'lead'
      ? ['note', 'callback', 'task', 'appointment']
      : entity_type === 'property_owner'
      ? ['note', 'appointment']
      : ['note'];

  return (
    <View style={styles.row}>
      {kinds.map(kind => (
        <TouchableOpacity
          key={kind}
          style={[styles.chip, variant === 'dark' ? styles.chipDark : styles.chipLight]}
          onPress={() => setOpenKind(kind)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={ICON_BY_KIND[kind]}
            size={20}
            color={variant === 'dark' ? colors.white : colors.primary}
          />
          <Text
            style={[
              styles.chipLabel,
              variant === 'dark' ? styles.chipLabelDark : styles.chipLabelLight,
            ]}
            numberOfLines={1}
          >
            {t(KIND_LABEL[kind])}
          </Text>
        </TouchableOpacity>
      ))}

      {openKind && (
        <QuickActionModal
          kind={openKind}
          entity_type={entity_type}
          entity_id={entity_id}
          entityName={entityName}
          onClose={() => setOpenKind(null)}
          onSaved={k => {
            onActionRecorded?.(k);
            setOpenKind(null);
          }}
        />
      )}
    </View>
  );
}

interface ModalProps {
  kind: QuickActionKind;
  entity_type: 'lead' | 'property_owner' | 'partner';
  entity_id: number;
  entityName: string;
  onClose: () => void;
  onSaved: (kind: QuickActionKind) => void;
}

function QuickActionModal({
  kind,
  entity_type,
  entity_id,
  entityName,
  onClose,
  onSaved,
}: ModalProps) {
  const { t } = useI18n();
  const mutation = useRecordInteraction();

  const [summary, setSummary] = useState('');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [startAt, setStartAt] = useState('');

  const title_i18n = t(KIND_LABEL[kind]);

  async function handleSave() {
    const s = summary.trim();
    const base: InteractionPayload = {
      entity_type,
      entity_id,
      interaction_type: 'note',
      summary: s,
    };

    let payload: InteractionPayload;

    switch (kind) {
      case 'note':
        if (!s) {
          Alert.alert(t('error'), t('call_ws_summary_required') || 'Summary required');
          return;
        }
        payload = { ...base, interaction_type: 'note' };
        break;

      case 'callback': {
        if (!dueDate) {
          Alert.alert(t('error'), t('call_ws_due_required') || 'Date required');
          return;
        }
        payload = {
          ...base,
          interaction_type: 'callback_scheduled',
          summary: s || `Callback ${dueDate}`,
          callback_at: dueDate,
        };
        break;
      }

      case 'task': {
        if (!title.trim()) {
          Alert.alert(t('error'), t('call_ws_title_required') || 'Title required');
          return;
        }
        payload = {
          ...base,
          interaction_type: 'task_created',
          summary: s || title.trim(),
          task: {
            title: title.trim(),
            due_date: dueDate || undefined,
          },
        };
        break;
      }

      case 'appointment': {
        if (!title.trim() || !startAt) {
          Alert.alert(t('error'), t('call_ws_appointment_required') || 'Title and start required');
          return;
        }
        payload = {
          ...base,
          interaction_type: 'appointment_scheduled',
          summary: s || title.trim(),
          appointment: {
            title: title.trim(),
            start_at: startAt,
            description: s || undefined,
          },
        };
        break;
      }
    }

    try {
      await mutation.mutateAsync(payload);
      onSaved(kind);
    } catch (err) {
      Alert.alert(t('error'), err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title_i18n}</Text>
              <TouchableOpacity onPress={onClose} hitSlop={12}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle} numberOfLines={1}>
              {entityName}
            </Text>

            <ScrollView
              contentContainerStyle={styles.modalBody}
              keyboardShouldPersistTaps="handled"
            >
              {(kind === 'task' || kind === 'appointment') && (
                <>
                  <Text style={styles.label}>{t('call_ws_title_label') || 'Title'}</Text>
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    style={styles.input}
                    placeholder={t('call_ws_title_placeholder') || '…'}
                    placeholderTextColor={colors.textTertiary}
                  />
                </>
              )}

              {kind === 'callback' && (
                <>
                  <Text style={styles.label}>
                    {t('call_ws_callback_date_label') || 'Callback date'}
                  </Text>
                  <TextInput
                    value={dueDate}
                    onChangeText={setDueDate}
                    style={styles.input}
                    placeholder="2026-04-21"
                    placeholderTextColor={colors.textTertiary}
                  />
                </>
              )}

              {kind === 'task' && (
                <>
                  <Text style={styles.label}>
                    {t('call_ws_due_label') || 'Due date (optional)'}
                  </Text>
                  <TextInput
                    value={dueDate}
                    onChangeText={setDueDate}
                    style={styles.input}
                    placeholder="2026-04-25"
                    placeholderTextColor={colors.textTertiary}
                  />
                </>
              )}

              {kind === 'appointment' && (
                <>
                  <Text style={styles.label}>
                    {t('call_ws_start_label') || 'Start (ISO)'}
                  </Text>
                  <TextInput
                    value={startAt}
                    onChangeText={setStartAt}
                    style={styles.input}
                    placeholder="2026-04-22T10:00:00Z"
                    placeholderTextColor={colors.textTertiary}
                  />
                </>
              )}

              <Text style={[styles.label, { marginTop: spacing.md }]}>
                {t('call_ws_note_label') || 'Note'}
              </Text>
              <TextInput
                value={summary}
                onChangeText={setSummary}
                style={styles.textarea}
                multiline
                numberOfLines={4}
                placeholder={t('call_ws_note_placeholder') || '…'}
                placeholderTextColor={colors.textTertiary}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.btn, styles.btnSecondary]}
                onPress={onClose}
                disabled={mutation.isPending}
              >
                <Text style={styles.btnSecondaryLabel}>{t('cancel') || 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary, mutation.isPending && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.btnPrimaryLabel}>{t('save') || 'Save'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
    minWidth: 112,
    justifyContent: 'center',
  },
  chipDark: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  chipLight: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  chipLabelDark: { color: colors.white },
  chipLabelLight: { color: colors.text },

  modalRoot: { flex: 1 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  modalBody: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  textarea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.surface,
    textAlignVertical: 'top',
    minHeight: 96,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  btn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryLabel: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  btnSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnSecondaryLabel: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
