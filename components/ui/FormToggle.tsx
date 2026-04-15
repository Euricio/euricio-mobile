import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, fontWeight } from '../../constants/theme';

interface FormToggleProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export function FormToggle({ label, value, onChange }: FormToggleProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primaryLight }}
        thumbColor={value ? colors.primary : colors.surface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    flex: 1,
  },
});
