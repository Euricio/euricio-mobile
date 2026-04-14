import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useVoice } from '../../hooks/useVoice';
import { Colors } from '../../constants/colors';

export function IncomingCallPopup() {
  const { isRinging, remoteNumber, acceptCall, rejectCall } = useVoice();

  if (!isRinging) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.label}>Eingehender Anruf</Text>
        <Text style={styles.number}>{remoteNumber ?? 'Unbekannt'}</Text>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.rejectBtn} onPress={rejectCall}>
            <Text style={styles.btnText}>Ablehnen</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptBtn} onPress={acceptCall}>
            <Text style={styles.btnText}>Annehmen</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  card: { backgroundColor: Colors.surface, borderRadius: 20, padding: 32, width: '85%', alignItems: 'center' },
  label: { fontSize: 14, color: Colors.textSecondary, marginBottom: 8 },
  number: { fontSize: 24, fontWeight: '700', color: Colors.text, marginBottom: 32 },
  buttons: { flexDirection: 'row', gap: 20 },
  rejectBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.callEnd, justifyContent: 'center', alignItems: 'center' },
  acceptBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.callActive, justifyContent: 'center', alignItems: 'center' },
  btnText: { fontSize: 11, color: Colors.textInverse, fontWeight: '600' },
});
