import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useMyActiveTimeEntry,
  useMyTimeEntriesToday,
  useClockIn,
  useClockOut,
  useChangeActivity,
  useTimeCategories,
  useUpdateTimeEntryNote,
  TimeCategory,
} from '../../lib/api/hr';
import { useBreakStore } from '../../store/breakStore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ActivityPicker } from './ActivityPicker';
import { BreakButtons } from './BreakButtons';
import { useI18n } from '../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../constants/theme';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
}

function formatDurationShort(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

function useElapsedTimer(startedAt: string | null) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) {
      setElapsed(0);
      return;
    }
    const start = new Date(startedAt).getTime();
    const update = () => {
      setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return elapsed;
}

export function ClockWidget() {
  const { t } = useI18n();
  const { data: activeEntry, isLoading: loadingActive } = useMyActiveTimeEntry();
  const { data: todayEntries } = useMyTimeEntriesToday();
  const { data: categories = [] } = useTimeCategories();
  const clockIn = useClockIn();
  const clockOut = useClockOut();
  const changeActivity = useChangeActivity();
  const updateNote = useUpdateTimeEntryNote();
  const breakStore = useBreakStore();

  // Sync break state from DB (when web CRM starts/stops a break)
  useEffect(() => {
    if (!activeEntry) return;
    const dbMode = activeEntry.break_mode;
    if (!dbMode || dbMode === 'work') {
      // DB says not on break — if local store thinks we are, end it (web ended the break)
      if (breakStore.isOnBreak) {
        breakStore.reset();
      }
    } else if (dbMode === 'short' || dbMode === 'lunch') {
      // DB says on break — if local store doesn't know, start it
      if (!breakStore.isOnBreak) {
        breakStore.startBreak(dbMode);
      }
    }
  }, [activeEntry?.break_mode]);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<'clockIn' | 'change'>('clockIn');
  const [noteText, setNoteText] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  const elapsed = useElapsedTimer(activeEntry?.started_at ?? null);
  const isClockedIn = !!activeEntry;
  const currentCategory = activeEntry?.category ?? null;

  // Sync note text when active entry changes
  useEffect(() => {
    if (activeEntry?.note) {
      setNoteText(activeEntry.note);
    } else {
      setNoteText('');
    }
  }, [activeEntry?.id, activeEntry?.note]);

  // Calculate today's total (in minutes for the summary row)
  // Subtract break minutes from total
  const completedMinutes = (todayEntries ?? [])
    .filter((e) => e.status === 'completed' && e.duration_minutes)
    .reduce((sum, e) => sum + (e.duration_minutes ?? 0), 0);

  const totalBreakMinutes = (todayEntries ?? []).reduce(
    (sum, e) => sum + (e.short_break_minutes ?? 0) + (e.lunch_break_minutes ?? 0),
    0,
  );

  const elapsedMinutes = Math.floor(elapsed / 60);
  const grossMinutes = completedMinutes + (isClockedIn ? elapsedMinutes : 0);
  const totalMinutes = Math.max(0, grossMinutes - totalBreakMinutes);

  const handleOpenClockIn = () => {
    setPickerMode('clockIn');
    setPickerVisible(true);
  };

  const handleOpenChange = () => {
    setPickerMode('change');
    setPickerVisible(true);
  };

  const handleCategorySelect = (category: TimeCategory) => {
    if (pickerMode === 'clockIn') {
      clockIn.mutate(category.id, {
        onSuccess: () => setPickerVisible(false),
      });
    } else {
      if (activeEntry && category.id !== activeEntry.category_id) {
        changeActivity.mutate(
          { currentEntryId: activeEntry.id, newCategoryId: category.id },
          { onSuccess: () => setPickerVisible(false) },
        );
      } else {
        setPickerVisible(false);
      }
    }
  };

  const handleClockOut = () => {
    if (activeEntry) {
      // End any active break before clocking out
      if (breakStore.isOnBreak) {
        breakStore.endBreak();
      }
      breakStore.reset();
      clockOut.mutate(activeEntry.id);
    }
  };

  const handleSaveNote = () => {
    if (activeEntry) {
      updateNote.mutate({ entryId: activeEntry.id, note: noteText });
      setShowNoteInput(false);
    }
  };

  const isMutating = clockIn.isPending || changeActivity.isPending;

  return (
    <>
      <Card style={breakStore.isOnBreak ? { ...styles.card, ...styles.cardBreakActive } : styles.card}>
        {isClockedIn ? (
          <>
            {/* Current activity header */}
            <View style={styles.header}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={styles.headerText}>{t('hr_clockedInSince')}</Text>
            </View>

            {/* Current activity indicator */}
            {currentCategory && (
              <TouchableOpacity
                style={styles.activityRow}
                onPress={handleOpenChange}
                activeOpacity={0.7}
              >
                <View style={[styles.activityDot, { backgroundColor: currentCategory.color }]} />
                <Text style={[styles.activityName, { color: currentCategory.color }]}>
                  {currentCategory.name}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            )}

            {/* Timer — hidden when on break, show break UI instead */}
            {!breakStore.isOnBreak && (
              <View style={styles.timerSection}>
                <Text style={styles.timer}>{formatDuration(elapsed)}</Text>
              </View>
            )}

            {/* Break buttons / active break display */}
            <BreakButtons activeEntryId={activeEntry.id} />

            {/* Today total */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('hr_workedToday')}</Text>
              <Text style={styles.totalValue}>{formatDurationShort(totalMinutes)}</Text>
            </View>

            {/* Note section */}
            {showNoteInput ? (
              <View style={styles.noteContainer}>
                <TextInput
                  style={styles.noteInput}
                  value={noteText}
                  onChangeText={setNoteText}
                  placeholder={t('hr_addNote')}
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  autoFocus
                />
                <View style={styles.noteActions}>
                  <TouchableOpacity onPress={() => setShowNoteInput(false)}>
                    <Text style={styles.noteCancelText}>{t('cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSaveNote}>
                    <Text style={styles.noteSaveText}>{t('hr_save')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.noteLink}
                onPress={() => setShowNoteInput(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="pencil-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.noteLinkText}>
                  {activeEntry.note ? activeEntry.note : t('hr_addNote')}
                </Text>
              </TouchableOpacity>
            )}

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <View style={styles.buttonHalf}>
                <Button
                  title={t('hr_changeActivity')}
                  onPress={handleOpenChange}
                  variant="outline"
                  loading={changeActivity.isPending}
                  disabled={isMutating || breakStore.isOnBreak}
                  icon={<Ionicons name="swap-horizontal-outline" size={18} color={colors.primary} />}
                  size="lg"
                />
              </View>
              <View style={styles.buttonHalf}>
                <Button
                  title={t('hr_clockOut')}
                  onPress={handleClockOut}
                  variant="danger"
                  loading={clockOut.isPending}
                  disabled={clockOut.isPending || isMutating}
                  icon={<Ionicons name="stop-circle-outline" size={18} color={colors.white} />}
                  size="lg"
                />
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Not clocked in state */}
            <View style={styles.header}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={styles.headerText}>{t('hr_workday')}</Text>
            </View>

            {/* Today total if any */}
            {totalMinutes > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{t('hr_workedToday')}</Text>
                <Text style={styles.totalValue}>{formatDurationShort(totalMinutes)}</Text>
              </View>
            )}

            {/* Category grid for quick clock-in */}
            <Text style={styles.selectLabel}>{t('hr_selectActivity')}</Text>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryChip, { borderColor: cat.color }]}
                  activeOpacity={0.7}
                  onPress={() => clockIn.mutate(cat.id)}
                  disabled={clockIn.isPending || loadingActive}
                >
                  <View style={[styles.chipDot, { backgroundColor: cat.color }]} />
                  <Text style={styles.chipText} numberOfLines={1}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </Card>

      <ActivityPicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        categories={categories}
        onSelect={handleCategorySelect}
        currentCategoryId={activeEntry?.category_id}
        loading={isMutating}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  cardBreakActive: {
    borderWidth: 2,
    borderColor: colors.warning,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm + 4,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  activityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  activityName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    flex: 1,
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  timer: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  totalLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  totalValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  noteContainer: {
    marginBottom: spacing.md,
  },
  noteInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 4,
    fontSize: fontSize.sm,
    color: colors.text,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  noteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  noteCancelText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  noteSaveText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  noteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  noteLinkText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  buttonHalf: {
    flex: 1,
  },
  selectLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    width: '48%',
  },
  chipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  chipText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.text,
    flex: 1,
  },
});
