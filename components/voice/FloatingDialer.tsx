import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  FlatList,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVoice } from '../../lib/voice/VoiceContext';
import { useI18n } from '../../lib/i18n';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../constants/theme';

const DIALPAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['*', '0', '#'],
];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function FloatingDialer() {
  const { t } = useI18n();
  const {
    status,
    callDuration,
    isMuted,
    dialerNumber,
    dialerExpanded,
    setDialerNumber,
    setDialerExpanded,
    makeCall,
    hangUp,
    toggleMute,
    pendingDial,
    clearPendingDial,
  } = useVoice();

  const isInCall = status === 'connected' || status === 'connecting' || status === 'ringing';

  // Auto-dial when pendingDial is set
  useEffect(() => {
    if (pendingDial && status === 'ready') {
      makeCall(pendingDial);
      clearPendingDial();
    }
  }, [pendingDial, status, makeCall, clearPendingDial]);

  const handleDial = () => {
    if (dialerNumber.length > 0) {
      makeCall(dialerNumber);
      setDialerExpanded(false);
    }
  };

  const handleDigit = (digit: string) => {
    setDialerNumber(dialerNumber + digit);
  };

  // During an active call, show mini call card
  if (isInCall && !dialerExpanded) {
    return (
      <TouchableOpacity
        style={styles.miniCallCard}
        onPress={() => setDialerExpanded(true)}
        activeOpacity={0.8}
      >
        <View style={styles.miniCallDot} />
        <Text style={styles.miniCallText}>
          {status === 'connected'
            ? formatDuration(callDuration)
            : t('voice_connecting')}
        </Text>
        <TouchableOpacity onPress={hangUp} style={styles.miniHangup}>
          <Ionicons name="call" size={16} color={colors.white} style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  // FAB button
  if (!dialerExpanded) {
    return (
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setDialerExpanded(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="call" size={24} color={colors.white} />
      </TouchableOpacity>
    );
  }

  // Expanded dialer modal
  return (
    <Modal
      visible={dialerExpanded}
      animationType="slide"
      transparent
      onRequestClose={() => setDialerExpanded(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.dialerSheet}>
          {/* Header */}
          <View style={styles.dialerHeader}>
            <Text style={styles.dialerTitle}>{t('voice_dialer')}</Text>
            <TouchableOpacity onPress={() => setDialerExpanded(false)}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Number display */}
          <View style={styles.numberDisplay}>
            <TextInput
              style={styles.numberInput}
              value={dialerNumber}
              onChangeText={setDialerNumber}
              placeholder={t('voice_enterNumber')}
              placeholderTextColor={colors.textTertiary}
              keyboardType="phone-pad"
            />
            {dialerNumber.length > 0 && (
              <TouchableOpacity
                onPress={() => setDialerNumber(dialerNumber.slice(0, -1))}
                style={styles.backspace}
              >
                <Ionicons name="backspace-outline" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Dialpad */}
          <View style={styles.dialpad}>
            {DIALPAD.map((row, ri) => (
              <View key={ri} style={styles.dialpadRow}>
                {row.map((digit) => (
                  <TouchableOpacity
                    key={digit}
                    style={styles.digitButton}
                    onPress={() => handleDigit(digit)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.digitText}>{digit}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          {/* Call / Hangup button */}
          {isInCall ? (
            <View style={styles.callControls}>
              <TouchableOpacity
                style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
                onPress={toggleMute}
              >
                <Ionicons
                  name={isMuted ? 'mic-off' : 'mic'}
                  size={22}
                  color={isMuted ? colors.white : colors.text}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.hangupBtn} onPress={hangUp}>
                <Ionicons name="call" size={28} color={colors.white} style={{ transform: [{ rotate: '135deg' }] }} />
              </TouchableOpacity>
              <View style={styles.durationContainer}>
                <Text style={styles.durationText}>{formatDuration(callDuration)}</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.callButton,
                dialerNumber.length === 0 && styles.callButtonDisabled,
              ]}
              onPress={handleDial}
              disabled={dialerNumber.length === 0}
              activeOpacity={0.7}
            >
              <Ionicons name="call" size={28} color={colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');
const DIGIT_SIZE = Math.min((width - 120) / 3, 72);

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 160,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  miniCallCard: {
    position: 'absolute',
    bottom: 160,
    right: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 6,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    gap: 10,
  },
  miniCallDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
  miniCallText: {
    flex: 1,
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  miniHangup: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  dialerSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  dialerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dialerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  numberDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 20,
    paddingBottom: 12,
  },
  numberInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 2,
  },
  backspace: {
    padding: 8,
  },
  dialpad: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  dialpadRow: {
    flexDirection: 'row',
    gap: 20,
  },
  digitButton: {
    width: DIGIT_SIZE,
    height: DIGIT_SIZE,
    borderRadius: DIGIT_SIZE / 2,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitText: {
    fontSize: 24,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  callButton: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callButtonDisabled: {
    backgroundColor: colors.textTertiary,
  },
  callControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnActive: {
    backgroundColor: colors.primary,
  },
  hangupBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationContainer: {
    minWidth: 48,
    alignItems: 'center',
  },
  durationText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.success,
    fontVariant: ['tabular-nums'],
  },
});
