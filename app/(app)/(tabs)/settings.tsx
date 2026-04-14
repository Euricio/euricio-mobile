import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuthStore } from '../../../store/authStore';
import { Card } from '../../../components/common/Card';
import { Colors } from '../../../constants/colors';

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert('Abmelden', 'Möchten Sie sich wirklich abmelden?', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Abmelden', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card title="Konto">
        <Text style={styles.email}>{user?.email ?? '—'}</Text>
      </Card>

      <Card title="Telefonie">
        <SettingRow label="VoIP aktiv" value="Ja" />
        <SettingRow label="Twilio Status" value="Verbunden" />
      </Card>

      <Card title="Benachrichtigungen">
        <SettingRow label="Push-Benachrichtigungen" value="Aktiviert" />
        <SettingRow label="Verpasste Anrufe" value="An" />
        <SettingRow label="Neue Leads" value="An" />
      </Card>

      <Card title="App">
        <SettingRow label="Version" value="1.0.0" />
        <SettingRow label="Build" value="scaffold" />
      </Card>

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Abmelden</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundSecondary },
  content: { padding: 16 },
  email: { fontSize: 15, color: Colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  rowLabel: { fontSize: 14, color: Colors.text },
  rowValue: { fontSize: 14, color: Colors.textSecondary },
  signOutBtn: { marginTop: 24, backgroundColor: Colors.error, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  signOutText: { color: Colors.textInverse, fontSize: 16, fontWeight: '700' },
});
