import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useVoice } from '../../hooks/useVoice';
import { formatCallDuration } from '../../lib/voice/callState';
import { Colors } from '../../constants/colors';

export function CallScreen() {
  const { callState, remoteNumber, muted, onHold, callStartTime, hangup, toggleMute, toggleHold } = useVoice();
  const [duration, setDuration] = useState('00:00');

  useEffect(() => {
    if (callState !== 'connected') return;
    const interval = setInterval(() => {
      setDuration(formatCallDuration(callStartTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [callState, callStartTime]);

  return (
    <View style={styles.container}>
      <Text style={styles.number}>{remoteNumber ?? 'Unbekannt'}</Text>
      <Text style={styles.status}>
        {callState === 'connected' ? duration : callState === 'ringing' ? 'Klingelt...' : 'Verbindet...'}
      </Text>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlBtn, muted && styles.controlActive]}
          onPress={toggleMute}
        >
          <Text style={styles.controlText}>Stumm</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlBtn, onHold && styles.controlActive]}
          onPress={toggleHold}
        >
          <Text style={styles.controlText}>Halten</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.hangupBtn} onPress={hangup}>
        <Text style={styles.hangupText}>Auflegen</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primaryDark },
  number: { fontSize: 28, fontWeight: '700', color: Colors.textInverse, marginBottom: 8 },
  status: { fontSize: 16, color: Colors.textMuted, marginBottom: 48 },
  controls: { flexDirection: 'row', gap: 24, marginBottom: 48 },
  controlBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  controlActive: { backgroundColor: Colors.textInverse },
  controlText: { fontSize: 12, color: Colors.textInverse, marginTop: 4 },
  hangupBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.callEnd, justifyContent: 'center', alignItems: 'center' },
  hangupText: { fontSize: 12, color: Colors.textInverse, fontWeight: '600' },
});
