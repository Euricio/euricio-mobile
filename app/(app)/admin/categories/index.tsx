import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useI18n } from '../../../../lib/i18n';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../../../../lib/api/categories';
import type { TimeCategory } from '../../../../lib/api/categories';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadow,
} from '../../../../constants/theme';

const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

export default function CategoriesScreen() {
  const { t } = useI18n();
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // New category form state
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [newActive, setNewActive] = useState(true);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editActive, setEditActive] = useState(true);

  const handleStartEdit = (category: TimeCategory) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditColor(category.color);
    setEditActive(category.is_active);
    setShowCreate(false);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    updateCategory.mutate({
      id,
      name: editName.trim(),
      color: editColor,
      is_active: editActive,
    });
    setEditingId(null);
  };

  const handleDelete = (category: TimeCategory) => {
    Alert.alert(t('delete'), t('categories_deleteConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => {
          deleteCategory.mutate(category.id);
          if (editingId === category.id) setEditingId(null);
        },
      },
    ]);
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    createCategory.mutate({
      name: newName.trim(),
      color: newColor,
      is_active: newActive,
      sort_order: (categories?.length ?? 0) + 1,
    });
    setNewName('');
    setNewColor(COLORS[0]);
    setNewActive(true);
    setShowCreate(false);
  };

  const handleCancelCreate = () => {
    setShowCreate(false);
    setNewName('');
    setNewColor(COLORS[0]);
    setNewActive(true);
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: t('categories_title'),
          headerShown: true,
          headerStyle: { backgroundColor: colors.surface },
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(app)/(tabs)/more');
                }
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{ paddingRight: 8 }}
            >
              <Ionicons name="chevron-back" size={26} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {showCreate && (
          <Card style={styles.card}>
            <Text style={styles.sectionHeader}>{t('categories_addNew')}</Text>

            <Text style={styles.inputLabel}>{t('categories_name')}</Text>
            <TextInput
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              placeholder={t('categories_namePlaceholder')}
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={styles.inputLabel}>{t('categories_color')}</Text>
            <View style={styles.colorRow}>
              {COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: c },
                    newColor === c && styles.colorSwatchActive,
                  ]}
                  onPress={() => setNewColor(c)}
                />
              ))}
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>{t('categories_active')}</Text>
              <Switch
                value={newActive}
                onValueChange={setNewActive}
                trackColor={{ true: colors.primary }}
              />
            </View>

            <View style={styles.formActions}>
              <Button title={t('cancel')} onPress={handleCancelCreate} variant="secondary" />
              <Button title={t('save')} onPress={handleCreate} />
            </View>
          </Card>
        )}

        {(categories ?? []).map((category) => (
          <Card key={category.id} style={styles.card}>
            {editingId === category.id ? (
              <>
                <Text style={styles.inputLabel}>{t('categories_name')}</Text>
                <TextInput
                  style={styles.input}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder={t('categories_namePlaceholder')}
                  placeholderTextColor={colors.textTertiary}
                />

                <Text style={styles.inputLabel}>{t('categories_color')}</Text>
                <View style={styles.colorRow}>
                  {COLORS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: c },
                        editColor === c && styles.colorSwatchActive,
                      ]}
                      onPress={() => setEditColor(c)}
                    />
                  ))}
                </View>

                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>{t('categories_active')}</Text>
                  <Switch
                    value={editActive}
                    onValueChange={setEditActive}
                    trackColor={{ true: colors.primary }}
                  />
                </View>

                <View style={styles.formActions}>
                  <Button
                    title={t('delete')}
                    onPress={() => handleDelete(category)}
                    variant="danger"
                    size="sm"
                  />
                  <View style={{ flex: 1 }} />
                  <Button
                    title={t('cancel')}
                    onPress={() => setEditingId(null)}
                    variant="secondary"
                    size="sm"
                  />
                  <Button
                    title={t('save')}
                    onPress={() => handleSaveEdit(category.id)}
                    size="sm"
                  />
                </View>
              </>
            ) : (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleStartEdit(category)}
              >
                <View style={styles.categoryRow}>
                  <View
                    style={[styles.colorDot, { backgroundColor: category.color }]}
                  />
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </View>
                  <Badge
                    label={category.is_active ? t('categories_active') : t('categories_inactive')}
                    variant={category.is_active ? 'success' : 'default'}
                  />
                  <Ionicons
                    name="pencil-outline"
                    size={18}
                    color={colors.textSecondary}
                    style={styles.editIcon}
                  />
                </View>
              </TouchableOpacity>
            )}
          </Card>
        ))}
      </ScrollView>

      {!showCreate && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.8}
          onPress={() => {
            setEditingId(null);
            setShowCreate(true);
          }}
        >
          <Ionicons name="add" size={28} color={colors.white} />
        </TouchableOpacity>
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
    paddingBottom: 120,
    gap: spacing.sm,
  },
  card: {
    marginBottom: 0,
  },
  sectionHeader: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  editIcon: {
    marginLeft: spacing.sm,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.background,
  },
  colorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchActive: {
    borderColor: colors.text,
    borderWidth: 3,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  toggleLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.lg,
  },
});
