import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { assignCallLog, CallerMatch } from '../../lib/voice/voiceApi';
import EntitySearchPanel from './EntitySearchPanel';
import { useI18n } from '../../lib/i18n';
import { Button } from '../ui/Button';
import { colors, spacing, fontSize, fontWeight } from '../../constants/theme';

interface ManualAssignmentSheetProps {
  visible: boolean;
  phoneNumber: string;
  callSid: string;
  onClose: () => void;
  onAssigned: () => void;
}

export default function ManualAssignmentSheet({
  visible,
  phoneNumber,
  callSid,
  onClose,
  onAssigned,
}: ManualAssignmentSheetProps) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);

  const handleSelect = async (match: CallerMatch) => {
    setSaving(true);
    try {
      await assignCallLog({
        call_sid: callSid,
        entity_type: match.entity_type,
        entity_id: match.entity_id,
      });
      onAssigned();
    } catch {
      Alert.alert(t('voice_error'), t('voice_assignFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{t('voice_assignCall')}</Text>
              <Text style={styles.subtitle}>{phoneNumber}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Search panel */}
          <EntitySearchPanel onSelect={handleSelect} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
});
