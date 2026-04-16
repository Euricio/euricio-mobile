import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTeamMembers, TeamMember } from '../../lib/api/hr';
import { Avatar } from './Avatar';
import { SearchBar } from './SearchBar';
import { useI18n } from '../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadow,
} from '../../constants/theme';

interface MemberPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (member: TeamMember) => void;
  selectedId?: string;
}

export function MemberPicker({ visible, onClose, onSelect, selectedId }: MemberPickerProps) {
  const { t } = useI18n();
  const { data: members } = useTeamMembers();
  const [search, setSearch] = useState('');

  const filtered = (members ?? []).filter((m) =>
    !search || m.full_name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modal}>
          <Text style={styles.title}>{t('hr_selectMember')}</Text>
          <View style={styles.searchContainer}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder={t('search')}
            />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.option,
                  item.id === selectedId && styles.optionActive,
                ]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                  setSearch('');
                }}
              >
                <Avatar name={item.full_name} size={36} />
                <View style={styles.optionInfo}>
                  <Text style={styles.optionName}>{item.full_name}</Text>
                  {item.position && (
                    <Text style={styles.optionPosition}>{item.position}</Text>
                  )}
                </View>
                {item.id === selectedId && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>{t('noResults')}</Text>
            }
            style={styles.list}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    maxHeight: 500,
    ...shadow.lg,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  searchContainer: {
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  list: {
    maxHeight: 340,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.md,
  },
  optionActive: {
    backgroundColor: colors.background,
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  optionPosition: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});
