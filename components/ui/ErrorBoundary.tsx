import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  label?: string;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    const message =
      error instanceof Error ? error.message : typeof error === 'string' ? error : 'unknown error';
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown) {
    if (__DEV__) {
      console.warn('[ErrorBoundary]', this.props.label ?? '', error);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) return this.props.fallback;
      return (
        <View style={styles.box}>
          <Text style={styles.title}>
            {this.props.label ? `${this.props.label}: ` : ''}Anzeige nicht verfügbar
          </Text>
          {!!this.state.message && <Text style={styles.msg}>{this.state.message}</Text>}
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  box: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  title: {
    fontSize: fontSize.sm,
    color: colors.error,
    fontWeight: '600',
  },
  msg: {
    fontSize: fontSize.xs,
    color: colors.error,
    marginTop: 4,
  },
});
