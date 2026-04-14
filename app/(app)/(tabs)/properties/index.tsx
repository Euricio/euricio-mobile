import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '../../../../constants/colors';

export default function PropertiesListScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: 'Objekte', headerShown: true }} />
      <Text style={styles.placeholder}>Immobilien-Liste wird hier angezeigt.</Text>
      <Text style={styles.hint}>Villen, Apartments, Grundstücke — durchsuchen und filtern.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundSecondary, justifyContent: 'center', alignItems: 'center', padding: 32 },
  placeholder: { fontSize: 18, fontWeight: '600', color: Colors.text, textAlign: 'center' },
  hint: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 },
});
