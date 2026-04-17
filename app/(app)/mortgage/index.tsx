import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Stack } from 'expo-router';
import { useI18n } from '../../../lib/i18n';
import { Card } from '../../../components/ui/Card';
import {
  colors,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
} from '../../../constants/theme';

type LoanType = 'annuity' | 'variable' | 'fixed10' | 'fixed15';

const RATE_OFFSET: Record<LoanType, number> = {
  annuity: 0,
  variable: -0.8,
  fixed10: 0.2,
  fixed15: 0.5,
};

const LOAN_TYPE_COLORS: Record<LoanType, string> = {
  annuity: '#007aff',
  variable: '#ff9500',
  fixed10: '#34c759',
  fixed15: '#af52de',
};

const WARNING_THRESHOLD = 35;
const DANGER_THRESHOLD = 40;

function calcMortgage(amount: number, annualRate: number, years: number) {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0 || n === 0) {
    return {
      monthly: n > 0 ? amount / n : 0,
      totalInterest: 0,
      totalAmount: amount,
      schedule: [],
    };
  }
  const monthly = (amount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalAmount = monthly * n;
  const totalInterest = totalAmount - amount;

  const schedule: { month: number; payment: number; principal: number; interest: number; balance: number }[] = [];
  let balance = amount;
  for (let i = 1; i <= Math.min(12, n); i++) {
    const interestPart = balance * r;
    const principalPart = monthly - interestPart;
    balance -= principalPart;
    schedule.push({
      month: i,
      payment: monthly,
      principal: principalPart,
      interest: interestPart,
      balance: Math.max(0, balance),
    });
  }

  return { monthly, totalInterest, totalAmount, schedule };
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(val);
}

function formatPercent(val: number) {
  return `${val.toFixed(1)}%`;
}

function SliderInput({
  label,
  value,
  min,
  max,
  step,
  displayValue,
  onValueChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  onValueChange: (v: number) => void;
}) {
  return (
    <View style={styles.sliderRow}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.sliderValue}>{displayValue}</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onValueChange}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.primary}
      />
    </View>
  );
}

function TabButton({
  title,
  active,
  onPress,
}: {
  title: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.tabButton, active && styles.tabButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

function ResultCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View style={styles.resultCard}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={[styles.resultValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

export default function MortgageScreen() {
  const { t } = useI18n();

  const [tab, setTab] = useState<'calculator' | 'comparison' | 'budget'>('calculator');
  const [purchasePrice, setPurchasePrice] = useState(300000);
  const [equity, setEquity] = useState(60000);
  const [baseRate, setBaseRate] = useState(3.5);
  const [duration, setDuration] = useState(25);
  const [loanType, setLoanType] = useState<LoanType>('annuity');

  // Budget tab
  const [netIncome, setNetIncome] = useState(4000);
  const [existingDebt, setExistingDebt] = useState(0);
  const [livingCosts, setLivingCosts] = useState(1500);

  const loanAmount = Math.max(0, purchasePrice - equity);
  const effectiveRate = Math.max(0.1, baseRate + RATE_OFFSET[loanType]);
  const result = useMemo(
    () => calcMortgage(loanAmount, effectiveRate, duration),
    [loanAmount, effectiveRate, duration],
  );

  // Comparison results for all loan types
  const comparison = useMemo(() => {
    return (['annuity', 'variable', 'fixed10', 'fixed15'] as LoanType[]).map((lt) => {
      const rate = Math.max(0.1, baseRate + RATE_OFFSET[lt]);
      const calc = calcMortgage(loanAmount, rate, duration);
      return { type: lt, rate, ...calc };
    });
  }, [loanAmount, baseRate, duration]);

  const bestType = comparison.reduce((best, c) =>
    c.totalInterest < best.totalInterest ? c : best,
  );

  // Budget analysis
  const debtRatio = netIncome > 0
    ? ((result.monthly + existingDebt) / netIncome) * 100
    : 0;
  const remainingBudget = netIncome - result.monthly - existingDebt - livingCosts;

  const debtRatioColor =
    debtRatio > DANGER_THRESHOLD ? colors.error :
    debtRatio > WARNING_THRESHOLD ? colors.warning :
    colors.success;

  const debtRatioLabel =
    debtRatio > DANGER_THRESHOLD ? t('mortgage_danger') :
    debtRatio > WARNING_THRESHOLD ? t('mortgage_warning') :
    t('mortgage_healthy');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ headerTitle: t('mortgage_title') }} />

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TabButton
          title={t('mortgage_tab_calculator')}
          active={tab === 'calculator'}
          onPress={() => setTab('calculator')}
        />
        <TabButton
          title={t('mortgage_tab_comparison')}
          active={tab === 'comparison'}
          onPress={() => setTab('comparison')}
        />
        <TabButton
          title={t('mortgage_tab_budget')}
          active={tab === 'budget'}
          onPress={() => setTab('budget')}
        />
      </View>

      {/* Shared sliders */}
      <Card>
        <SliderInput
          label={t('mortgage_purchasePrice')}
          value={purchasePrice}
          min={50000}
          max={3000000}
          step={10000}
          displayValue={formatCurrency(purchasePrice)}
          onValueChange={setPurchasePrice}
        />
        <SliderInput
          label={t('mortgage_equity')}
          value={equity}
          min={0}
          max={purchasePrice}
          step={5000}
          displayValue={formatCurrency(equity)}
          onValueChange={setEquity}
        />
        <View style={styles.loanAmountRow}>
          <Text style={styles.loanAmountLabel}>{t('mortgage_loanAmount')}</Text>
          <Text style={styles.loanAmountValue}>{formatCurrency(loanAmount)}</Text>
        </View>
        <SliderInput
          label={t('mortgage_interestRate')}
          value={baseRate}
          min={0.5}
          max={12}
          step={0.1}
          displayValue={formatPercent(baseRate)}
          onValueChange={setBaseRate}
        />
        <SliderInput
          label={t('mortgage_duration')}
          value={duration}
          min={5}
          max={50}
          step={1}
          displayValue={`${duration} ${t('mortgage_years')}`}
          onValueChange={setDuration}
        />
      </Card>

      {/* Calculator Tab */}
      {tab === 'calculator' && (
        <>
          {/* Loan type selector */}
          <Text style={styles.sectionTitle}>{t('mortgage_loanType')}</Text>
          <View style={styles.loanTypeRow}>
            {(['annuity', 'variable', 'fixed10', 'fixed15'] as LoanType[]).map((lt) => (
              <TouchableOpacity
                key={lt}
                style={[
                  styles.loanTypeChip,
                  loanType === lt && { backgroundColor: LOAN_TYPE_COLORS[lt], borderColor: LOAN_TYPE_COLORS[lt] },
                ]}
                onPress={() => setLoanType(lt)}
              >
                <Text
                  style={[
                    styles.loanTypeText,
                    loanType === lt && { color: colors.white },
                  ]}
                  numberOfLines={1}
                >
                  {t(`mortgage_type_${lt}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.resultGrid}>
            <ResultCard
              label={t('mortgage_monthlyPayment')}
              value={formatCurrency(result.monthly)}
              color={LOAN_TYPE_COLORS[loanType]}
            />
            <ResultCard
              label={t('mortgage_totalInterest')}
              value={formatCurrency(result.totalInterest)}
            />
            <ResultCard
              label={t('mortgage_totalAmount')}
              value={formatCurrency(result.totalAmount)}
            />
            <ResultCard
              label={t('mortgage_interestShare')}
              value={formatPercent(
                result.totalAmount > 0
                  ? (result.totalInterest / result.totalAmount) * 100
                  : 0,
              )}
            />
          </View>

          {/* Amortization table */}
          <Text style={styles.sectionTitle}>{t('mortgage_amortization')}</Text>
          <Card style={styles.tableCard}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>#</Text>
              <Text style={styles.tableHeaderCell}>{t('mortgage_payment')}</Text>
              <Text style={styles.tableHeaderCell}>{t('mortgage_principal')}</Text>
              <Text style={styles.tableHeaderCell}>{t('mortgage_interest')}</Text>
              <Text style={styles.tableHeaderCell}>{t('mortgage_balance')}</Text>
            </View>
            {result.schedule.map((row) => (
              <View key={row.month} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 0.5 }]}>{row.month}</Text>
                <Text style={styles.tableCell}>{formatCurrency(row.payment)}</Text>
                <Text style={styles.tableCell}>{formatCurrency(row.principal)}</Text>
                <Text style={styles.tableCell}>{formatCurrency(row.interest)}</Text>
                <Text style={styles.tableCell}>{formatCurrency(row.balance)}</Text>
              </View>
            ))}
          </Card>
        </>
      )}

      {/* Comparison Tab */}
      {tab === 'comparison' && (
        <>
          <Text style={styles.sectionTitle}>{t('mortgage_comparison')}</Text>
          {comparison.map((c) => {
            const isBest = c.type === bestType.type;
            return (
              <Card key={c.type} style={isBest ? { ...styles.compCard, ...styles.compCardBest } : styles.compCard}>
                <View style={styles.compHeader}>
                  <View style={[styles.compDot, { backgroundColor: LOAN_TYPE_COLORS[c.type] }]} />
                  <Text style={styles.compTitle}>{t(`mortgage_type_${c.type}`)}</Text>
                  {isBest && (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>{t('mortgage_recommended')}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.compGrid}>
                  <View style={styles.compItem}>
                    <Text style={styles.compLabel}>{t('mortgage_interestRate')}</Text>
                    <Text style={styles.compValue}>{formatPercent(c.rate)}</Text>
                  </View>
                  <View style={styles.compItem}>
                    <Text style={styles.compLabel}>{t('mortgage_monthlyPayment')}</Text>
                    <Text style={[styles.compValue, { color: LOAN_TYPE_COLORS[c.type] }]}>
                      {formatCurrency(c.monthly)}
                    </Text>
                  </View>
                  <View style={styles.compItem}>
                    <Text style={styles.compLabel}>{t('mortgage_totalInterest')}</Text>
                    <Text style={styles.compValue}>{formatCurrency(c.totalInterest)}</Text>
                  </View>
                  <View style={styles.compItem}>
                    <Text style={styles.compLabel}>{t('mortgage_totalAmount')}</Text>
                    <Text style={styles.compValue}>{formatCurrency(c.totalAmount)}</Text>
                  </View>
                </View>
              </Card>
            );
          })}
        </>
      )}

      {/* Budget Tab */}
      {tab === 'budget' && (
        <>
          <Text style={styles.sectionTitle}>{t('mortgage_budgetAnalysis')}</Text>
          <Card>
            <SliderInput
              label={t('mortgage_netIncome')}
              value={netIncome}
              min={500}
              max={20000}
              step={100}
              displayValue={formatCurrency(netIncome)}
              onValueChange={setNetIncome}
            />
            <SliderInput
              label={t('mortgage_existingDebt')}
              value={existingDebt}
              min={0}
              max={5000}
              step={50}
              displayValue={formatCurrency(existingDebt)}
              onValueChange={setExistingDebt}
            />
            <SliderInput
              label={t('mortgage_livingCosts')}
              value={livingCosts}
              min={500}
              max={8000}
              step={100}
              displayValue={formatCurrency(livingCosts)}
              onValueChange={setLivingCosts}
            />
          </Card>

          {/* Debt ratio gauge */}
          <Card style={styles.gaugeCard}>
            <Text style={styles.gaugeTitle}>{t('mortgage_debtRatio')}</Text>
            <View style={styles.gaugeBar}>
              <View
                style={[
                  styles.gaugeFill,
                  {
                    width: `${Math.min(100, debtRatio)}%`,
                    backgroundColor: debtRatioColor,
                  },
                ]}
              />
            </View>
            <View style={styles.gaugeLabels}>
              <Text style={[styles.gaugePercent, { color: debtRatioColor }]}>
                {formatPercent(debtRatio)}
              </Text>
              <Text style={[styles.gaugeStatus, { color: debtRatioColor }]}>
                {debtRatioLabel}
              </Text>
            </View>
          </Card>

          {/* Monthly budget breakdown */}
          <Card>
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>{t('mortgage_monthlyPayment')}</Text>
              <Text style={styles.budgetValue}>{formatCurrency(result.monthly)}</Text>
            </View>
            <View style={[styles.budgetRow, styles.budgetRowBorder]}>
              <Text style={styles.budgetLabel}>{t('mortgage_existingDebt')}</Text>
              <Text style={styles.budgetValue}>{formatCurrency(existingDebt)}</Text>
            </View>
            <View style={[styles.budgetRow, styles.budgetRowBorder]}>
              <Text style={styles.budgetLabel}>{t('mortgage_livingCosts')}</Text>
              <Text style={styles.budgetValue}>{formatCurrency(livingCosts)}</Text>
            </View>
            <View style={[styles.budgetRow, styles.budgetRowBorder, styles.budgetRowTotal]}>
              <Text style={styles.budgetTotalLabel}>{t('mortgage_remainingBudget')}</Text>
              <Text
                style={[
                  styles.budgetTotalValue,
                  { color: remainingBudget >= 0 ? colors.success : colors.error },
                ]}
              >
                {formatCurrency(remainingBudget)}
              </Text>
            </View>
          </Card>
        </>
      )}
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
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: spacing.md,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  tabButtonTextActive: {
    color: colors.white,
  },
  sliderRow: {
    marginBottom: spacing.md,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sliderLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  sliderValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  slider: {
    width: '100%',
    height: 36,
  },
  loanAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginBottom: spacing.sm,
  },
  loanAmountLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  loanAmountValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  loanTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  loanTypeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  loanTypeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  resultGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  resultCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  resultLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  resultValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  tableCard: {
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: spacing.sm,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
    color: colors.text,
    textAlign: 'right',
  },
  compCard: {
    marginBottom: spacing.sm,
  },
  compCardBest: {
    borderWidth: 2,
    borderColor: colors.success,
  },
  compHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  compDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  compTitle: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  recommendedBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  recommendedText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.success,
  },
  compGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  compItem: {
    width: '48%',
  },
  compLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  compValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  gaugeCard: {
    marginBottom: spacing.sm,
  },
  gaugeTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  gaugeBar: {
    height: 12,
    backgroundColor: colors.borderLight,
    borderRadius: 6,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 6,
  },
  gaugeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  gaugePercent: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  gaugeStatus: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    alignSelf: 'center',
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  budgetRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  budgetRowTotal: {
    paddingTop: spacing.md,
  },
  budgetLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  budgetValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  budgetTotalLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  budgetTotalValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
});
