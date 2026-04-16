import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchFlow,
  saveFlow,
  publishFlow,
  FlowNode,
  FlowDetail,
} from '../../../../lib/voice/voiceApi';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { FormInput } from '../../../../components/ui/FormInput';
import { FormSelect } from '../../../../components/ui/FormSelect';
import { useI18n } from '../../../../lib/i18n';
import { colors, spacing, fontSize, fontWeight } from '../../../../constants/theme';

const NODE_TYPES = [
  { value: 'greeting', label: 'Begrüßung', icon: 'chatbubble-outline' },
  { value: 'menu', label: 'Menü', icon: 'keypad-outline' },
  { value: 'forward', label: 'Weiterleitung', icon: 'arrow-forward-outline' },
  { value: 'voicemail', label: 'Voicemail', icon: 'recording-outline' },
  { value: 'queue', label: 'Warteschlange', icon: 'people-outline' },
  { value: 'hangup', label: 'Auflegen', icon: 'call-outline' },
] as const;

const NODE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  greeting: 'chatbubble-outline',
  menu: 'keypad-outline',
  forward: 'arrow-forward-outline',
  voicemail: 'recording-outline',
  queue: 'people-outline',
  hangup: 'call-outline',
};

const NODE_COLORS: Record<string, string> = {
  greeting: colors.info,
  menu: colors.accent,
  forward: colors.success,
  voicemail: colors.warning,
  queue: colors.primaryLight,
  hangup: colors.error,
};

interface EditNode {
  type: string;
  label: string;
  config: Record<string, unknown>;
}

export default function FlowEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const qc = useQueryClient();

  const { data: flow, isLoading } = useQuery({
    queryKey: ['voice-flow', id],
    queryFn: () => fetchFlow(id!),
    enabled: !!id,
  });

  const [nodes, setNodes] = useState<EditNode[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (flow?.nodes) {
      setNodes(
        flow.nodes
          .sort((a, b) => a.position_y - b.position_y)
          .map((n) => ({
            type: n.type,
            label: n.label,
            config: n.config,
          }))
      );
    }
  }, [flow]);

  const saveMut = useMutation({
    mutationFn: () =>
      saveFlow(id!, {
        nodes: nodes.map((n, i) => ({
          type: n.type,
          label: n.label,
          config: n.config,
          position_x: 0,
          position_y: i * 100,
        })),
        edges: nodes.slice(0, -1).map((_, i) => ({
          source_node_id: String(i),
          target_node_id: String(i + 1),
        })),
      }),
    onSuccess: () => {
      setHasChanges(false);
      qc.invalidateQueries({ queryKey: ['voice-flow', id] });
      Alert.alert(t('voice_success'), t('voice_flowSaved'));
    },
    onError: () => Alert.alert(t('voice_error'), t('voice_saveFailed')),
  });

  const publishMut = useMutation({
    mutationFn: () => publishFlow(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['voice-flow', id] });
      qc.invalidateQueries({ queryKey: ['voice-flows'] });
      Alert.alert(t('voice_success'), t('voice_flowPublished'));
    },
    onError: () => Alert.alert(t('voice_error'), t('voice_publishFailed')),
  });

  const addNode = () => {
    setNodes([...nodes, { type: 'greeting', label: '', config: {} }]);
    setHasChanges(true);
  };

  const removeNode = (index: number) => {
    setNodes(nodes.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const updateNode = (index: number, updates: Partial<EditNode>) => {
    setNodes(
      nodes.map((n, i) => (i === index ? { ...n, ...updates } : n))
    );
    setHasChanges(true);
  };

  const moveNode = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= nodes.length) return;
    const updated = [...nodes];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setNodes(updated);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ headerTitle: t('voice_flowBuilder') }} />
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          headerTitle: flow?.name || t('voice_flowBuilder'),
        }}
      />

      {/* Flow info */}
      <Card style={styles.card}>
        <Text style={styles.flowName}>{flow?.name}</Text>
        {flow?.description && (
          <Text style={styles.flowDesc}>{flow.description}</Text>
        )}
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>
            {flow?.is_published ? t('voice_published') : t('voice_draft')}
          </Text>
        </View>
      </Card>

      {/* Nodes list */}
      <Text style={styles.sectionTitle}>{t('voice_flowNodes')}</Text>

      {nodes.map((node, index) => (
        <Card key={index} style={styles.nodeCard}>
          {/* Connection line */}
          {index > 0 && (
            <View style={styles.connectorLine}>
              <View style={styles.connectorDot} />
            </View>
          )}

          <View style={styles.nodeHeader}>
            <View
              style={[
                styles.nodeIcon,
                { backgroundColor: (NODE_COLORS[node.type] || colors.primary) + '15' },
              ]}
            >
              <Ionicons
                name={NODE_ICONS[node.type] || 'cube-outline'}
                size={18}
                color={NODE_COLORS[node.type] || colors.primary}
              />
            </View>
            <Text style={styles.nodeIndex}>#{index + 1}</Text>
            <View style={styles.nodeActions}>
              {index > 0 && (
                <TouchableOpacity onPress={() => moveNode(index, 'up')}>
                  <Ionicons name="arrow-up" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
              {index < nodes.length - 1 && (
                <TouchableOpacity onPress={() => moveNode(index, 'down')}>
                  <Ionicons name="arrow-down" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => removeNode(index)}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.nodeForm}>
            <FormSelect
              label={t('voice_nodeType')}
              value={node.type}
              onValueChange={(v) => updateNode(index, { type: v })}
              items={NODE_TYPES.map((nt) => ({ label: nt.label, value: nt.value }))}
            />
            <FormInput
              label={t('voice_nodeLabel')}
              value={node.label}
              onChangeText={(v) => updateNode(index, { label: v })}
              placeholder={t('voice_nodeLabelPlaceholder')}
            />
          </View>
        </Card>
      ))}

      {/* Add node button */}
      <TouchableOpacity style={styles.addNodeBtn} onPress={addNode} activeOpacity={0.7}>
        <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
        <Text style={styles.addNodeText}>{t('voice_addNode')}</Text>
      </TouchableOpacity>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Button
          title={t('voice_save')}
          onPress={() => saveMut.mutate()}
          loading={saveMut.isPending}
          disabled={!hasChanges}
          style={{ flex: 1 }}
        />
        <Button
          title={t('voice_publish')}
          onPress={() =>
            Alert.alert(t('voice_publishFlow'), t('voice_publishConfirm'), [
              { text: t('cancel'), style: 'cancel' },
              { text: t('voice_publish'), onPress: () => publishMut.mutate() },
            ])
          }
          loading={publishMut.isPending}
          variant="secondary"
          style={{ flex: 1 }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { marginBottom: spacing.sm },
  flowName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  flowDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statusRow: {
    marginTop: 8,
  },
  statusLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  nodeCard: {
    marginBottom: 4,
  },
  connectorLine: {
    position: 'absolute',
    top: -12,
    left: 28,
    width: 2,
    height: 12,
    backgroundColor: colors.border,
  },
  connectorDot: {
    position: 'absolute',
    top: -3,
    left: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  nodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  nodeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeIndex: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  nodeActions: {
    flexDirection: 'row',
    gap: 12,
  },
  nodeForm: {
    gap: 8,
  },
  addNodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  addNodeText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: spacing.lg,
  },
});
