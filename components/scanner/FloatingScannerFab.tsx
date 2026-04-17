import React from 'react';
import { TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '../../constants/theme';
import { useProfile } from '../../lib/api/profile';
import { canAccessPdfTools } from '../../lib/planAccess';
import { useI18n } from '../../lib/i18n';

const UPGRADE_URL = 'https://euricio.es/settings/subscription';

export default function FloatingScannerFab() {
  const { data: profile } = useProfile();
  const { t } = useI18n();

  const handlePress = () => {
    if (canAccessPdfTools(profile)) {
      router.push('/(app)/scanner');
    } else {
      Alert.alert(
        t('upgrade_scanner_title'),
        t('upgrade_scanner_description'),
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('upgrade_cta'),
            onPress: () => Linking.openURL(UPGRADE_URL),
          },
        ],
      );
    }
  };

  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={handlePress}
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
