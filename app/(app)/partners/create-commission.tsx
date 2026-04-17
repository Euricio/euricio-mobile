import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Alert,
  View,
  Text,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useI18n } from '../../../lib/i18n';
import { useCreateCommission } from '../../../lib/api/partners';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { FormInput } from '../../../components/ui/FormInput';
import { FormSelect } from '../../../components/ui/FormSelect';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
} from '../../../constants/theme';

const COMMISSION_TYPES = ['percent', 'fixed'];
const COMMISSION_STATUSES = ['pending', 'approved', 'paid', 'rejected'];

export default function CreateCommissionScreen() {
  const { t, formatPrice } = useI18n();
  const { partnerId } = useLocalSearchParams<{ partnerId: string }>();
  const createCommission = useCreateCommission();

  const [description, setDescription] = useState('');
  const [propertyPrice, setPropertyPrice] = useState('');
  const [commissionType, setCommissionType] = useState('percent');
  const [commissionValue, setCommissionValue] = useState('');
  const [status, setStatus] = useState('pending');
  const [notes, setNotes] = useState('');

  const calculatedAmount = useMemo(() => {
    const val = parseFloat(commissionValue);
    const price = parseFloat(propertyPrice);
    if (isNaN(val)) return null;
    if (commissionType === 'percent') {
      if (isNaN(price)) return null;
      return (price * val) / 100;
    }
    return val;
  }, [commissionType, commissionValue, propertyPrice]);

  const handleSave = async () => {
    const val = parseFloat(commissionValue);
    if (isNaN(val)) {
      Alert.alert(t('error'), t('required'));
      return;
    }

    try {
      await createCommission.mutateAsync({
        partner_id: partnerId,
        description: description.trim() || null,
        property_price: propertyPrice ? parseFloat(propertyPrice) : null,
        commission_type: commissionType,
        commission_value: val,
        commission_amount: calculatedAmount,
        status,
        notes: notes.trim() || null,
      });
      router.back();
    } catch {
      Alert.alert(t('error'), t('partner_commissionCreateError'));
    }
  };

  const commTypeOptions = COMMISSION_TYPES.map((ct) => ({
    label: t(`partner_commission_${ct}`),
    value: ct,
  }));

  const statusOptions = COMMISSION_STATUSES.map((s) => ({
    label: t(`partner_commissionStatus_${s}`),
    value: s,
  }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ headerTitle: t('partner_newCommission') }} />

      <Card>
        <FormInput
          label={t('partner_commissionDescription')}
          value={description}
          onChangeText={setDescription}
        />
        <FormInput
          label={t('partner_commissionPropertyPrice')}
          value={propertyPrice}
          onChangeText={setPropertyPrice}
          keyboardType="decimal-pad"
        />
        <FormSelect
          label={t('partner_commissionType')}
          value={commissionType}
          onChange={setCommissionType}
          options={commTypeOptions}
        />
        <FormInput
          label={t('partner_commissionValue')}
          value={commissionValue}
          onChangeText={setCommissionValue}
          keyboardType="decimal-pad"
        />

        {calculatedAmount != null && (
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>{t('partner_commissionAmount')}</Text>
            <Text style={styles.amountValue}>{formatPrice(calculatedAmount)}</Text>
          </View>
        )}

        <FormSelect
          label={t('partner_commissionStatus')}
          value={status}
          onChange={setStatus}
          options={statusOptions}
        />
        <FormInput
          label={t('partner_notes')}
          value={notes}
          onChangeText={setNotes}
          placeholder={t('partner_notesPlaceholder')}
          multiline
          numberOfLines={3}
        />
      </Card>

      <Button
        title={t('save')}
        onPress={handleSave}
        size="lg"
        style={{ marginTop: spacing.lg }}
      />
    </ScrollView>
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
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginTop: spacing.sm,
  },
  amountLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  amountValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
});
