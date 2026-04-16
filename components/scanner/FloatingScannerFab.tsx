import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '../../constants/theme';

export default function FloatingScannerFab() {
  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={() => router.push('/(app)/scanner')}
      activeOpacity={0.8}
    >
      <Ionicons name="document-text-outline" size={24} color={colors.white} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 220,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
});
