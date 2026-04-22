import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, fontWeight } from '../../constants/theme';

interface StepperProps {
  steps: string[];
  current: number;
}

export function Stepper({ steps, current }: StepperProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {steps.map((label, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === current;
          const isDone = stepNum < current;
          return (
            <React.Fragment key={label}>
              <View style={styles.stepCol}>
                <View
                  style={[
                    styles.circle,
                    isActive && styles.circleActive,
                    isDone && styles.circleDone,
                  ]}
                >
                  <Text
                    style={[
                      styles.circleText,
                      (isActive || isDone) && styles.circleTextActive,
                    ]}
                  >
                    {stepNum}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.label,
                    isActive && styles.labelActive,
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </View>
              {i < steps.length - 1 && (
                <View
                  style={[
                    styles.connector,
                    stepNum < current && styles.connectorDone,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const CIRCLE = 28;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepCol: {
    alignItems: 'center',
    width: 64,
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    backgroundColor: colors.borderLight,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  circleDone: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryLight,
  },
  circleText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  circleTextActive: {
    color: colors.white,
  },
  label: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  labelActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginTop: CIRCLE / 2 - 1,
    marginHorizontal: -8,
  },
  connectorDone: {
    backgroundColor: colors.primaryLight,
  },
});
