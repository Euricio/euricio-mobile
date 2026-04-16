import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TimeCategory } from '../../lib/api/hr';
import { useI18n } from '../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadow,
} from '../../constants/theme';

interface ActivityPickerProps {
  visible: boolean;
  onClose: () => void;
  categories: TimeCategory[];
  onSelect: (category: TimeCategory) => void;
  currentCategoryId?: string | null;
  loading?: boolean;
}

export function ActivityPicker({
  visible,
  onClose,
  categories,
  onSelect,
  currentCategoryId,
  loading,
}: ActivityPickerProps) {
  const { t } = useI18n();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('hr_selectActivity')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}

          <View style={styles.grid}>
            {categories.map((cat) => {
              const isActive = cat.id === currentCategoryId;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryCard,
                    { borderColor: cat.color },
                    isActive && { backgroundColor: cat.color + '18' },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => onSelect(cat)}
                  disabled={loading}
                >
                  <View style={[styles.colorDot, { backgroundColor: cat.color }]} />
                  <Text
                    style={[
                      styles.categoryName,
                      isActive && { color: cat.color, fontWeight: fontWeight.bold },
                    ]}
                    numberOfLines={2}
                  >
                    {cat.name}
                  </Text>
                  {isActive && (
                    <View style={[styles.activeBadge, { backgroundColor: cat.color }]}>
                      <Ionicons name="checkmark" size={12} color={colors.white} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  loadingContainer: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryCard: {
    width: '47.5%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    ...shadow.sm,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: spacing.sm,
    flexShrink: 0,
  },
  categoryName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    flex: 1,
  },
  activeBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
});
