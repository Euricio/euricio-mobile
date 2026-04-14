import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';

interface LeadActionsProps {
  onCall: () => void;
  onWhatsApp: () => void;
  onEmail: () => void;
  onTask: () => void;
}

export function LeadActions({ onCall, onWhatsApp, onEmail, onTask }: LeadActionsProps) {
  return (
    <View style={styles.container}>
      <ActionButton label="Anrufen" color={Colors.callActive} onPress={onCall} />
      <ActionButton label="WhatsApp" color="#25D366" onPress={onWhatsApp} />
      <ActionButton label="E-Mail" color={Colors.info} onPress={onEmail} />
      <ActionButton label="Aufgabe" color={Colors.secondary} onPress={onTask} />
    </View>
  );
}

function ActionButton({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.button, { backgroundColor: color }]} onPress={onPress}>
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 8, paddingVertical: 12 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  buttonText: { fontSize: 13, fontWeight: '600', color: Colors.textInverse },
});
