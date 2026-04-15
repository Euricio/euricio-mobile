import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '../../constants/theme';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: colors.borderLight, text: colors.textSecondary },
  success: { bg: colors.successLight, text: '#065F46' },
  warning: { bg: colors.warningLight, text: '#92400E' },
  error: { bg: colors.errorLight, text: '#991B1B' },
  info: { bg: colors.infoLight, text: '#1E40AF' },
  primary: { bg: '#E0E7F1', text: colors.primary },
};

export function Badge({ label, variant = 'default', size = 'sm' }: BadgeProps) {
  const c = variantColors[variant];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: c.bg },
        size === 'md' && styles.badgeMd,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: c.text },
          size === 'md' && styles.textMd,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  badgeMd: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  textMd: {
    fontSize: fontSize.sm,
  },
});
