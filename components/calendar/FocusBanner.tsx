import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { Appointment } from '../../lib/api/calendar';
import { useI18n } from '../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../constants/theme';

interface Props {
  appointments: Appointment[] | undefined;
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Shows a banner at the top of the calendar while a deep-work
 * (blocks_calls=true) appointment is currently active. Tapping it
 * opens the appointment so the user can end it or change redirects.
 */
export function FocusBanner({ appointments }: Props) {
  const { t } = useI18n();

  const activeFocus = React.useMemo(() => {
    if (!appointments) return null;
    const now = new Date();
    for (const a of appointments) {
      if (!(a as any).blocks_calls) continue;
      const start = parseDate(a.start_at);
      const end = parseDate(a.end_at);
      if (!start || !end) continue;
      if (start.getTime() <= now.getTime() && now.getTime() <= end.getTime()) {
        return a;
      }
    }
    return null;
  }, [appointments]);

  if (!activeFocus) return null;

  const endStr = parseDate(activeFocus.end_at)?.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  }) ?? '';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.banner}
      onPress={() =>
        router.push({
          pathname: '/(app)/calendar/appointment',
          params: { id: activeFocus.id },
        })
      }
    >
      <View style={styles.icon}>
        <Ionicons name="moon" size={20} color={colors.white} />
      </View>
      <View style={styles.textBox}>
        <Text style={styles.title} numberOfLines={1}>
          {t('calendar_focus_active') || 'Focus mode active'}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {activeFocus.title}
          {endStr ? `  ·  ${t('calendar_focus_until') || 'until'} ${endStr}` : ''}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.white} style={{ opacity: 0.8 }} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBox: { flex: 1 },
  title: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: fontSize.xs,
    marginTop: 2,
  },
});
