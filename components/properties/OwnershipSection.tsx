import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import {
  PropertyOwner,
  usePropertyOwners,
  useCreatePropertyOwner,
  useUpdatePropertyOwner,
  useDeletePropertyOwner,
} from '../../lib/api/properties';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useI18n } from '../../lib/i18n';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../constants/theme';

const OWNER_COLORS = ['#007aff', '#af52de', '#f59e0b', '#34c759', '#ff2d55', '#5ac8fa', '#ff9500', '#ff3b30'];
const STATUS_COLORS: Record<string, string> = { won: '#34c759', pending: '#f59e0b', against: '#ff3b30' };

interface OwnerForm {
  name: string;
  percentage: string;
  status: 'won' | 'pending' | 'against';
  email: string;
  phone: string;
  notes: string;
}

const emptyForm: OwnerForm = {
  name: '',
  percentage: '',
  status: 'pending',
  email: '',
  phone: '',
  notes: '',
};

// ─── SVG Donut Chart ──────────────────────────────
interface PieSlice {
  value: number;
  color: string;
  label: string;
}

function DonutChart({
  slices,
  centerLabel,
  centerSub,
}: {
  slices: PieSlice[];
  centerLabel: string;
  centerSub?: string;
}) {
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 64;
  const innerR = 40;

  const total = slices.reduce((s, sl) => s + sl.value, 0);
  if (total === 0) {
    return (
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={cx} cy={cy} r={outerR} fill="none" stroke={colors.borderLight} strokeWidth={outerR - innerR} />
        <SvgText x={cx} y={cy} textAnchor="middle" alignmentBaseline="central" fontSize={12} fill={colors.textTertiary}>
          —
        </SvgText>
      </Svg>
    );
  }

  let currentAngle = -Math.PI / 2;
  const paths = slices
    .filter((sl) => sl.value > 0)
    .map((sl) => {
      const fraction = sl.value / total;
      const angle = fraction * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const x1 = cx + outerR * Math.cos(startAngle);
      const y1 = cy + outerR * Math.sin(startAngle);
      const x2 = cx + outerR * Math.cos(endAngle);
      const y2 = cy + outerR * Math.sin(endAngle);
      const ix1 = cx + innerR * Math.cos(endAngle);
      const iy1 = cy + innerR * Math.sin(endAngle);
      const ix2 = cx + innerR * Math.cos(startAngle);
      const iy2 = cy + innerR * Math.sin(startAngle);

      const largeArc = angle > Math.PI ? 1 : 0;

      if (fraction >= 0.9999) {
        const midAngle = startAngle + Math.PI;
        const mx = cx + outerR * Math.cos(midAngle);
        const my = cy + outerR * Math.sin(midAngle);
        const imx = cx + innerR * Math.cos(midAngle);
        const imy = cy + innerR * Math.sin(midAngle);
        const d = [
          `M ${x1} ${y1}`,
          `A ${outerR} ${outerR} 0 1 1 ${mx} ${my}`,
          `A ${outerR} ${outerR} 0 1 1 ${x1} ${y1}`,
          `Z`,
          `M ${ix2} ${iy2}`,
          `A ${innerR} ${innerR} 0 1 0 ${imx} ${imy}`,
          `A ${innerR} ${innerR} 0 1 0 ${ix2} ${iy2}`,
          `Z`,
        ].join(' ');
        return <Path key={sl.label} d={d} fill={sl.color} fillRule="evenodd" />;
      }

      const d = [
        `M ${x1} ${y1}`,
        `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${ix1} ${iy1}`,
        `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2}`,
        `Z`,
      ].join(' ');

      return <Path key={sl.label} d={d} fill={sl.color} />;
    });

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {paths}
      <SvgText
        x={cx}
        y={centerSub ? cy - 6 : cy}
        textAnchor="middle"
        alignmentBaseline="central"
        fontSize={13}
        fontWeight="700"
        fill={colors.textPrimary}
      >
        {centerLabel}
      </SvgText>
      {centerSub && (
        <SvgText
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          alignmentBaseline="central"
          fontSize={10}
          fill={colors.textTertiary}
        >
          {centerSub}
        </SvgText>
      )}
    </Svg>
  );
}

// ─── Main Component ──────────────────────────────
export function OwnershipSection({ propertyId }: { propertyId: string }) {
  const { t } = useI18n();
  const { data: owners = [] } = usePropertyOwners(propertyId);
  const createOwner = useCreatePropertyOwner();
  const updateOwner = useUpdatePropertyOwner();
  const deleteOwner = useDeletePropertyOwner();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingOwner, setEditingOwner] = useState<PropertyOwner | null>(null);
  const [form, setForm] = useState<OwnerForm>(emptyForm);

  const totalPct = useMemo(() => owners.reduce((s, o) => s + (o.percentage ?? 0), 0), [owners]);
  const remainingPct = 100 - totalPct;

  const effectiveRemaining = editingOwner
    ? remainingPct + (editingOwner.percentage ?? 0)
    : remainingPct;

  // Chart data
  const ownershipSlices: PieSlice[] = useMemo(
    () =>
      owners.map((o, i) => ({
        value: o.percentage ?? 0,
        color: OWNER_COLORS[i % OWNER_COLORS.length],
        label: o.name,
      })),
    [owners],
  );

  const wonPct = useMemo(
    () => owners.filter((o) => o.status === 'won').reduce((s, o) => s + (o.percentage ?? 0), 0),
    [owners],
  );
  const pendingPct = useMemo(
    () => owners.filter((o) => o.status === 'pending').reduce((s, o) => s + (o.percentage ?? 0), 0),
    [owners],
  );
  const againstPct = useMemo(
    () => owners.filter((o) => o.status === 'against').reduce((s, o) => s + (o.percentage ?? 0), 0),
    [owners],
  );

  const consentSlices: PieSlice[] = useMemo(
    () => [
      { value: wonPct, color: STATUS_COLORS.won, label: t('prop_won') },
      { value: pendingPct, color: STATUS_COLORS.pending, label: t('prop_pending') },
      { value: againstPct, color: STATUS_COLORS.against, label: t('prop_against') },
    ],
    [wonPct, pendingPct, againstPct, t],
  );

  const openAdd = useCallback(() => {
    setEditingOwner(null);
    setForm(emptyForm);
    setModalVisible(true);
  }, []);

  const openEdit = useCallback((o: PropertyOwner) => {
    setEditingOwner(o);
    setForm({
      name: o.name,
      percentage: o.percentage != null ? String(o.percentage) : '',
      status: o.status || 'pending',
      email: o.email || '',
      phone: o.phone || '',
      notes: o.notes || '',
    });
    setModalVisible(true);
  }, []);

  const saveOwner = useCallback(() => {
    if (!form.name.trim() || !form.percentage) return;
    const payload = {
      property_id: propertyId,
      name: form.name.trim(),
      percentage: Number(form.percentage),
      status: form.status,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      notes: form.notes.trim() || null,
    };

    if (editingOwner) {
      updateOwner.mutate(
        { id: editingOwner.id, ...payload },
        { onSuccess: () => setModalVisible(false) },
      );
    } else {
      createOwner.mutate(payload, {
        onSuccess: () => setModalVisible(false),
      });
    }
  }, [form, propertyId, editingOwner, createOwner, updateOwner]);

  const confirmDelete = useCallback(
    (owner: PropertyOwner) => {
      Alert.alert(t('prop_deleteOwnerConfirm'), owner.name, [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () =>
            deleteOwner.mutate({ id: owner.id, propertyId }),
        },
      ]);
    },
    [t, deleteOwner, propertyId],
  );

  const statusLabel = (s: string) =>
    s === 'won' ? t('prop_won') : s === 'pending' ? t('prop_pending') : t('prop_against');

  const isSaving = createOwner.isPending || updateOwner.isPending;

  return (
    <>
      <Card style={s.section}>
        {/* Header */}
        <View style={s.headerRow}>
          <Text style={s.sectionTitle}>{t('prop_ownershipStructure')}</Text>
          <TouchableOpacity onPress={openAdd} style={s.addButton}>
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text style={s.addButtonText}>{t('prop_addOwner')}</Text>
          </TouchableOpacity>
        </View>

        {owners.length === 0 ? (
          <Text style={s.emptyText}>{t('prop_noOwners')}</Text>
        ) : (
          <>
            {/* Charts Row */}
            <View style={s.chartsRow}>
              {/* Ownership Shares Chart */}
              <View style={s.chartColumn}>
                <Text style={s.chartLabel}>{t('prop_ownershipShares')}</Text>
                <DonutChart
                  slices={ownershipSlices}
                  centerLabel={String(owners.length)}
                  centerSub={t('prop_owners')}
                />
                <View style={s.legendContainer}>
                  {owners.map((o, i) => (
                    <View key={o.id} style={s.legendRow}>
                      <View style={[s.legendDot, { backgroundColor: OWNER_COLORS[i % OWNER_COLORS.length] }]} />
                      <Text style={s.legendName} numberOfLines={1}>{o.name}</Text>
                      <Text style={s.legendValue}>{o.percentage ?? 0}%</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Consent Status Chart */}
              <View style={s.chartColumn}>
                <Text style={s.chartLabel}>{t('prop_consentStatus')}</Text>
                <DonutChart
                  slices={consentSlices}
                  centerLabel={t('prop_wonSummary').replace('{pct}', String(Math.round(wonPct)))}
                />
                <View style={s.legendContainer}>
                  {consentSlices
                    .filter((sl) => sl.value > 0)
                    .map((sl) => (
                      <View key={sl.label} style={s.legendRow}>
                        <View style={[s.legendDot, { backgroundColor: sl.color }]} />
                        <Text style={s.legendName}>{sl.label}</Text>
                        <Text style={s.legendValue}>{Math.round(sl.value)}%</Text>
                      </View>
                    ))}
                </View>
              </View>
            </View>

            {/* Percentage Warning */}
            {totalPct !== 100 && totalPct > 0 && (
              <View style={s.warningBox}>
                <Ionicons name="warning-outline" size={16} color="#b45309" />
                <Text style={s.warningText}>
                  {t('prop_pctWarning').replace('{pct}', String(totalPct))}
                </Text>
              </View>
            )}

            {/* Owner List */}
            {owners.map((o, i) => (
              <View key={o.id} style={[s.ownerRow, i < owners.length - 1 && s.ownerRowBorder]}>
                <View style={s.ownerInfo}>
                  <Text style={s.ownerName}>{o.name}</Text>
                  {(o.email || o.phone) && (
                    <View style={s.ownerContact}>
                      {o.email && (
                        <TouchableOpacity onPress={() => Linking.openURL(`mailto:${o.email}`)}>
                          <Text style={s.ownerContactText}>{o.email}</Text>
                        </TouchableOpacity>
                      )}
                      {o.email && o.phone && <Text style={s.ownerContactText}> · </Text>}
                      {o.phone && (
                        <TouchableOpacity onPress={() => Linking.openURL(`tel:${o.phone}`)}>
                          <Text style={s.ownerContactText}>{o.phone}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
                <Text style={s.ownerPct}>{o.percentage ?? 0}%</Text>
                <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[o.status || 'pending'] + '18' }]}>
                  <View style={[s.statusDot, { backgroundColor: STATUS_COLORS[o.status || 'pending'] }]} />
                  <Text style={[s.statusText, { color: STATUS_COLORS[o.status || 'pending'] }]}>
                    {statusLabel(o.status || 'pending')}
                  </Text>
                </View>
                <View style={s.ownerActions}>
                  <TouchableOpacity onPress={() => openEdit(o)} style={s.actionBtn}>
                    <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => confirmDelete(o)} style={s.actionBtn}>
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
      </Card>

      {/* ─── Add/Edit Modal ──────────────── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.modalTitle}>
                {editingOwner ? t('prop_editOwner') : t('prop_addOwner')}
              </Text>

              {/* Name */}
              <Text style={s.inputLabel}>{t('prop_ownerFullName')} *</Text>
              <TextInput
                style={s.input}
                value={form.name}
                onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                placeholder={t('ownership_namePlaceholder')}
                placeholderTextColor={colors.textTertiary}
              />

              {/* Percentage */}
              <Text style={s.inputLabel}>{t('prop_ownershipPct')} *</Text>
              <TextInput
                style={s.input}
                value={form.percentage}
                onChangeText={(v) => setForm((f) => ({ ...f, percentage: v }))}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
              />
              {effectiveRemaining > 0 && (
                <Text style={s.availableHint}>
                  {effectiveRemaining}% {t('prop_pctAvailable')}
                </Text>
              )}

              {/* Status Selector */}
              <Text style={s.inputLabel}>{t('prop_status') || 'Status'}</Text>
              <View style={s.statusRow}>
                {(['won', 'pending', 'against'] as const).map((st) => {
                  const isActive = form.status === st;
                  return (
                    <TouchableOpacity
                      key={st}
                      onPress={() => setForm((f) => ({ ...f, status: st }))}
                      style={[
                        s.statusBtn,
                        isActive && {
                          borderColor: STATUS_COLORS[st],
                          borderWidth: 2,
                          backgroundColor:
                            st === 'won'
                              ? 'rgba(52,199,89,0.1)'
                              : st === 'pending'
                              ? 'rgba(245,158,11,0.1)'
                              : 'rgba(255,59,48,0.1)',
                        },
                      ]}
                    >
                      <View style={[s.statusBtnDot, { backgroundColor: STATUS_COLORS[st] }]} />
                      <Text
                        style={[
                          s.statusBtnText,
                          isActive && { color: STATUS_COLORS[st], fontWeight: '600' },
                        ]}
                      >
                        {statusLabel(st)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Email */}
              <Text style={s.inputLabel}>{t('ownership_email')}</Text>
              <TextInput
                style={s.input}
                value={form.email}
                onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder={t('ownership_emailPlaceholder')}
                placeholderTextColor={colors.textTertiary}
              />

              {/* Phone */}
              <Text style={s.inputLabel}>{t('ownership_phone')}</Text>
              <TextInput
                style={s.input}
                value={form.phone}
                onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
                keyboardType="phone-pad"
                placeholder={t('ownership_phonePlaceholder')}
                placeholderTextColor={colors.textTertiary}
              />

              {/* Notes */}
              <Text style={s.inputLabel}>{t('prop_ownerNotes')}</Text>
              <TextInput
                style={[s.input, s.inputMultiline]}
                value={form.notes}
                onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
                multiline
                numberOfLines={3}
                placeholder={t('ownership_notesPlaceholder')}
                placeholderTextColor={colors.textTertiary}
              />

              {/* Actions */}
              <View style={s.modalActions}>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={s.cancelBtn}
                >
                  <Text style={s.cancelBtnText}>{t('cancel')}</Text>
                </TouchableOpacity>
                <Button
                  title={t('save')}
                  onPress={saveOwner}
                  loading={isSaving}
                  disabled={!form.name.trim() || !form.percentage}
                  style={s.saveBtn}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ─── Styles ──────────────────────────────
const s = StyleSheet.create({
  section: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold as any,
    color: colors.textPrimary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  addButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium as any,
    color: colors.primary,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },

  // Charts
  chartsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  chartColumn: {
    alignItems: 'center',
    minWidth: 150,
    flex: 1,
  },
  chartLabel: {
    fontSize: 10,
    fontWeight: fontWeight.semibold as any,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  legendContainer: {
    marginTop: 8,
    width: '100%',
    gap: 3,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendName: {
    flex: 1,
    fontSize: 11,
    color: colors.textPrimary,
  },
  legendValue: {
    fontSize: 11,
    fontWeight: fontWeight.semibold as any,
    color: colors.textSecondary,
  },

  // Warning
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,149,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,149,0,0.25)',
    borderRadius: borderRadius.sm,
    padding: 8,
    marginBottom: spacing.md,
  },
  warningText: {
    fontSize: fontSize.xs,
    color: '#b45309',
    flex: 1,
  },

  // Owner rows
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  ownerRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  ownerInfo: {
    flex: 1,
    minWidth: 0,
  },
  ownerName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold as any,
    color: colors.textPrimary,
  },
  ownerContact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  ownerContactText: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  ownerPct: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold as any,
    color: colors.textPrimary,
    minWidth: 36,
    textAlign: 'right',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold as any,
  },
  ownerActions: {
    flexDirection: 'row',
    gap: 2,
  },
  actionBtn: {
    padding: 6,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold as any,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium as any,
    color: colors.textSecondary,
    marginBottom: 4,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  inputMultiline: {
    height: 70,
    textAlignVertical: 'top',
  },
  availableHint: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 3,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  statusBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.background,
  },
  statusBtnDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusBtnText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: borderRadius.sm,
  },
  cancelBtnText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium as any,
  },
  saveBtn: {
    minWidth: 100,
  },
});
