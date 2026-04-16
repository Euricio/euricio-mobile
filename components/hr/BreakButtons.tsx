import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useBreakStore, BreakType } from '../../store/breakStore';
import { useSaveBreakMinutes } from '../../lib/api/hr';
import { useI18n } from '../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../constants/theme';

interface BreakButtonsProps {
  activeEntryId: number;
}

function useBreakTimer(startedAt: number | null) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) {
      setElapsed(0);
      return;
    }
    const update = () => {
      setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return elapsed;
}

function formatBreakTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function BreakButtons({ activeEntryId }: BreakButtonsProps) {
  const { t } = useI18n();
  const { isOnBreak, breakType, breakStartedAt, startBreak, endBreak } = useBreakStore();
  const saveBreak = useSaveBreakMinutes();
  const breakElapsed = useBreakTimer(breakStartedAt);

  const handleToggleBreak = (type: BreakType) => {
    if (isOnBreak && breakType === type) {
      // End break
      const result = endBreak();
      if (result) {
        saveBreak.mutate({
          entryId: activeEntryId,
          field: result.type === 'short' ? 'short_break_minutes' : 'lunch_break_minutes',
          additionalMinutes: result.elapsedMinutes,
        });
      }
    } else if (!isOnBreak) {
      startBreak(type);
    }
  };

  if (isOnBreak) {
    const label = breakType === 'short' ? t('hr_shortBreak') : t('hr_lunchBreak');
    const icon = breakType === 'short' ? '\u2615' : '\uD83C\uDF7D\uFE0F';

    return (
      <View style={styles.breakActiveContainer}>
        <View style={styles.breakActiveHeader}>
          <Text style={styles.breakActiveIcon}>{icon}</Text>
          <Text style={styles.breakActiveLabel}>{label}</Text>
        </View>
        <Text style={styles.breakTimer}>{formatBreakTime(breakElapsed)}</Text>
        <Text style={styles.breakRunningText}>{t('hr_breakRunning')}</Text>
        <TouchableOpacity
          style={styles.endBreakButton}
          onPress={() => handleToggleBreak(breakType!)}
          activeOpacity={0.7}
        >
          <Text style={styles.endBreakText}>{t('hr_endBreak')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.breakRow}>
      <TouchableOpacity
        style={styles.breakButton}
        onPress={() => handleToggleBreak('short')}
        activeOpacity={0.7}
      >
        <Text style={styles.breakIcon}>{'\u2615'}</Text>
        <Text style={styles.breakLabel}>{t('hr_shortBreak')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.breakButton}
        onPress={() => handleToggleBreak('lunch')}
        activeOpacity={0.7}
      >
        <Text style={styles.breakIcon}>{'\uD83C\uDF7D\uFE0F'}</Text>
        <Text style={styles.breakLabel}>{t('hr_lunchBreak')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  breakRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  breakButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  breakIcon: {
    fontSize: fontSize.md,
  },
  breakLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  breakActiveContainer: {
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  breakActiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  breakActiveIcon: {
    fontSize: fontSize.xl,
  },
  breakActiveLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  breakTimer: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.warning,
    marginBottom: spacing.xs,
  },
  breakRunningText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  endBreakButton: {
    backgroundColor: colors.warning,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  endBreakText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});
