import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuth } from '../../../lib/auth/authContext';
import { useAuthStore } from '../../../store/authStore';
import { Card } from '../../../components/ui/Card';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../../constants/theme';

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const user = useAuthStore((s) => s.user);

  const handleSignOut = () => {
    Alert.alert('Abmelden', 'Möchten Sie sich wirklich abmelden?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Abmelden',
        style: 'destructive',
        onPress: signOut,
      },
    ]);
  };

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || '—';
  const userEmail = user?.email || '—';
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Profile Section */}
      <Card style={styles.profileCard}>
        <View style={styles.profileRow}>
          <Avatar name={userName} size={56} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userName}</Text>
            <Text style={styles.profileEmail}>{userEmail}</Text>
          </View>
        </View>
      </Card>

      {/* Telefonie Section */}
      <Text style={styles.sectionHeader}>Telefonie</Text>
      <Card>
        <SettingRow
          icon="call-outline"
          label="Verfügbarkeit"
          right={<Switch value={true} trackColor={{ true: colors.success }} />}
        />
      </Card>

      {/* Benachrichtigungen Section */}
      <Text style={styles.sectionHeader}>Benachrichtigungen</Text>
      <Card>
        <SettingRow
          icon="notifications-outline"
          label="Push-Benachrichtigungen"
          right={<Switch value={true} trackColor={{ true: colors.primary }} />}
        />
        <SettingRow
          icon="call-outline"
          label="Verpasste Anrufe"
          right={<Switch value={true} trackColor={{ true: colors.primary }} />}
          showBorder
        />
        <SettingRow
          icon="person-add-outline"
          label="Neue Leads"
          right={<Switch value={true} trackColor={{ true: colors.primary }} />}
          showBorder
        />
      </Card>

      {/* Über Euricio Section */}
      <Text style={styles.sectionHeader}>Über Euricio</Text>
      <Card>
        <SettingRow
          icon="information-circle-outline"
          label="App-Version"
          value={appVersion}
        />
        <SettingRow
          icon="document-text-outline"
          label="Datenschutz"
          showBorder
          showChevron
        />
        <SettingRow
          icon="shield-outline"
          label="Impressum"
          showBorder
          showChevron
        />
      </Card>

      {/* Logout */}
      <View style={styles.logoutSection}>
        <Button
          title="Abmelden"
          onPress={handleSignOut}
          variant="danger"
          icon={<Ionicons name="log-out-outline" size={18} color={colors.white} />}
          size="lg"
        />
      </View>
    </ScrollView>
  );
}

function SettingRow({
  icon,
  label,
  value,
  right,
  showBorder,
  showChevron,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  right?: React.ReactNode;
  showBorder?: boolean;
  showChevron?: boolean;
}) {
  return (
    <View
      style={[
        styles.settingRow,
        showBorder && styles.settingBorder,
      ]}
    >
      <Ionicons name={icon} size={20} color={colors.textSecondary} />
      <Text style={styles.settingLabel}>{label}</Text>
      {value && <Text style={styles.settingValue}>{value}</Text>}
      {right}
      {showChevron && (
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  profileCard: {
    marginBottom: spacing.md,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  profileName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  profileEmail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: spacing.md,
  },
  settingBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  settingLabel: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  settingValue: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  logoutSection: {
    marginTop: spacing.xl,
  },
});
