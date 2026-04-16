import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  TimeEntryWithCategory,
  TimeCategory,
  useUpdateTimeEntry,
  useDeleteTimeEntry,
  useTimeCategories,
} from '../../lib/api/hr';
import { useI18n } from '../../lib/i18n';
import { Button } from '../ui/Button';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../constants/theme';

interface EditTimeEntryModalProps {
  visible: boolean;
  entry: TimeEntryWithCategory | null;
  onClose: () => void;
}

function parseTimeString(isoString: string | null): { hours: string; minutes: string } {
  if (!isoString) return { hours: '00', minutes: '00' };
  const d = new Date(isoString);
  return {
    hours: d.getHours().toString().padStart(2, '0'),
    minutes: d.getMinutes().toString().padStart(2, '0'),
  };
}

function buildISOFromTime(
  dateStr: string,
  hours: string,
  minutes: string,
): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setHours(parseInt(hours, 10) || 0);
  d.setMinutes(parseInt(minutes, 10) || 0);
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d.toISOString();
}

export function EditTimeEntryModal({
  visible,
  entry,
  onClose,
}: EditTimeEntryModalProps) {
  const { t } = useI18n();
  const { data: categories = [] } = useTimeCategories();
  const updateEntry = useUpdateTimeEntry();
  const deleteEntry = useDeleteTimeEntry();

  const [categoryId, setCategoryId] = useState('');
  const [startHours, setStartHours] = useState('');
  const [startMinutes, setStartMinutes] = useState('');
  const [endHours, setEndHours] = useState('');
  const [endMinutes, setEndMinutes] = useState('');
  const [note, setNote] = useState('');
  const [shortBreak, setShortBreak] = useState('');
  const [lunchBreak, setLunchBreak] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    if (entry) {
      setCategoryId(entry.category_id ?? '');
      const start = parseTimeString(entry.started_at);
      setStartHours(start.hours);
      setStartMinutes(start.minutes);
      if (entry.ended_at) {
        const end = parseTimeString(entry.ended_at);
        setEndHours(end.hours);
        setEndMinutes(end.minutes);
      } else {
        setEndHours('');
        setEndMinutes('');
      }
      setNote(entry.note ?? '');
      setShortBreak(String(entry.short_break_minutes ?? 0));
      setLunchBreak(String(entry.lunch_break_minutes ?? 0));
    }
  }, [entry]);

  if (!entry) return null;

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const isCompleted = entry.status === 'completed';

  const handleSave = () => {
    const updates: Record<string, unknown> = {
      category_id: categoryId || undefined,
      note: note || null,
      short_break_minutes: parseInt(shortBreak, 10) || 0,
      lunch_break_minutes: parseInt(lunchBreak, 10) || 0,
    };

    if (entry.date) {
      updates.started_at = buildISOFromTime(entry.date, startHours, startMinutes);
      if (isCompleted && endHours) {
        updates.ended_at = buildISOFromTime(entry.date, endHours, endMinutes);
      }
    }

    updateEntry.mutate(
      { entryId: entry.id, updates },
      { onSuccess: onClose },
    );
  };

  const handleDelete = () => {
    Alert.alert(t('hr_deleteEntry'), t('hr_deleteConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => {
          deleteEntry.mutate(entry.id, { onSuccess: onClose });
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('hr_editEntry')}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {/* Category picker */}
          <Text style={styles.label}>{t('hr_currentActivity')}</Text>
          <TouchableOpacity
            style={styles.categorySelect}
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            activeOpacity={0.7}
          >
            {selectedCategory && (
              <View
                style={[styles.catDot, { backgroundColor: selectedCategory.color }]}
              />
            )}
            <Text style={styles.categorySelectText}>
              {selectedCategory?.name ?? '—'}
            </Text>
            <Ionicons
              name={showCategoryPicker ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {showCategoryPicker && (
            <View style={styles.categoryList}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryOption,
                    cat.id === categoryId && styles.categoryOptionSelected,
                  ]}
                  onPress={() => {
                    setCategoryId(cat.id);
                    setShowCategoryPicker(false);
                  }}
                >
                  <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                  <Text style={styles.categoryOptionText}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Start time */}
          <Text style={styles.label}>{t('hr_startTime')}</Text>
          <View style={styles.timeRow}>
            <TextInput
              style={styles.timeInput}
              value={startHours}
              onChangeText={setStartHours}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="HH"
              placeholderTextColor={colors.textTertiary}
            />
            <Text style={styles.timeSep}>:</Text>
            <TextInput
              style={styles.timeInput}
              value={startMinutes}
              onChangeText={setStartMinutes}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="MM"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          {/* End time (only for completed) */}
          {isCompleted && (
            <>
              <Text style={styles.label}>{t('hr_endTime')}</Text>
              <View style={styles.timeRow}>
                <TextInput
                  style={styles.timeInput}
                  value={endHours}
                  onChangeText={setEndHours}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="HH"
                  placeholderTextColor={colors.textTertiary}
                />
                <Text style={styles.timeSep}>:</Text>
                <TextInput
                  style={styles.timeInput}
                  value={endMinutes}
                  onChangeText={setEndMinutes}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="MM"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </>
          )}

          {/* Note */}
          <Text style={styles.label}>{t('hr_note')}</Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder={t('hr_addNote')}
            placeholderTextColor={colors.textTertiary}
            multiline
          />

          {/* Break minutes */}
          <Text style={styles.label}>{t('hr_breaks')}</Text>
          <View style={styles.breakRow}>
            <View style={styles.breakField}>
              <Text style={styles.breakFieldLabel}>{t('hr_shortBreak')}</Text>
              <TextInput
                style={styles.breakInput}
                value={shortBreak}
                onChangeText={setShortBreak}
                keyboardType="number-pad"
                maxLength={3}
              />
              <Text style={styles.breakUnit}>min</Text>
            </View>
            <View style={styles.breakField}>
              <Text style={styles.breakFieldLabel}>{t('hr_lunchBreak')}</Text>
              <TextInput
                style={styles.breakInput}
                value={lunchBreak}
                onChangeText={setLunchBreak}
                keyboardType="number-pad"
                maxLength={3}
              />
              <Text style={styles.breakUnit}>min</Text>
            </View>
          </View>

          {/* Save */}
          <View style={styles.saveRow}>
            <Button
              title={t('hr_save')}
              onPress={handleSave}
              loading={updateEntry.isPending}
              disabled={updateEntry.isPending || deleteEntry.isPending}
              size="lg"
            />
          </View>

          {/* Delete */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={deleteEntry.isPending}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} />
            <Text style={styles.deleteText}>{t('hr_deleteEntry')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 16 : spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: spacing.md,
    paddingBottom: 60,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  categorySelect: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 4,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  catDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categorySelectText: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  categoryList: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  categoryOptionSelected: {
    backgroundColor: colors.background,
  },
  categoryOptionText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timeInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm + 4,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    textAlign: 'center',
    width: 60,
  },
  timeSep: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
  },
  noteInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm + 4,
    fontSize: fontSize.md,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  breakRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  breakField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  breakFieldLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  breakInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
    textAlign: 'center',
    width: 50,
  },
  breakUnit: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  saveRow: {
    marginTop: spacing.lg,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  deleteText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.error,
  },
});
