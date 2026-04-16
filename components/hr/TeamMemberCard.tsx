import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TeamMemberStatus } from '../../lib/api/hr';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { useI18n } from '../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
} from '../../constants/theme';

const statusConfig: Record<
  TeamMemberStatus['status'],
  { key: string; variant: 'success' | 'info' | 'warning' | 'default' }
> = {
  available: { key: 'hr_available', variant: 'success' },
  on_shift: { key: 'hr_onShift', variant: 'info' },
  on_vacation: { key: 'hr_onVacation', variant: 'warning' },
  offline: { key: 'hr_offline', variant: 'default' },
};

interface TeamMemberCardProps {
  item: TeamMemberStatus;
  onPress?: () => void;
}

export function TeamMemberCard({ item, onPress }: TeamMemberCardProps) {
  const { t } = useI18n();
  const config = statusConfig[item.status];

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <Avatar name={item.member.full_name} size={44} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {item.member.full_name}
          </Text>
          {item.member.position && (
            <Text style={styles.position} numberOfLines={1}>
              {item.member.position}
            </Text>
          )}
        </View>
        <Badge label={t(config.key)} variant={config.variant} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  position: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
