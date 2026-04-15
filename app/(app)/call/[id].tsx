import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight } from '../../../constants/theme';

export default function CallScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      {/* Call Info */}
      <View style={styles.header}>
        <Text style={styles.callerName}>Anruf</Text>
        <Text style={styles.status}>Verbindung wird hergestellt...</Text>
      </View>

      {/* Call Controls */}
      <View style={styles.controls}>
        <ControlButton icon="mic-off-outline" label="Stumm" />
        <ControlButton icon="volume-high-outline" label="Lautspr." />
        <ControlButton icon="pause-outline" label="Halten" />
      </View>

      {/* Hangup */}
      <TouchableOpacity
        style={styles.hangupButton}
        onPress={() => router.back()}
      >
        <Ionicons name="call" size={32} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

function ControlButton({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <TouchableOpacity style={styles.controlButton}>
      <View style={styles.controlIconBg}>
        <Ionicons name={icon} size={24} color={colors.white} />
      </View>
      <Text style={styles.controlLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 80,
  },
  header: {
    alignItems: 'center',
  },
  callerName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  status: {
    fontSize: fontSize.md,
    color: 'rgba(255,255,255,0.7)',
    marginTop: spacing.sm,
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  controlButton: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  controlIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlLabel: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
  },
  hangupButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '135deg' }],
  },
});
