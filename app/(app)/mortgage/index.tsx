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
  shadow,
} from '../../../constants/theme';

type LoanType = 'annuity' | 'variable' | 'fixed10' | 'fixed15';
type Tab = 'calculator' | 'comparison' | 'budget';

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

const LOAN_TYPES: LoanType[] = ['annuity', 'variable', 'fixed10', 'fixed15'];

function calcMortgage(amount: number, annualRate: number, years: number) {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0 || n === 0) {
    return {
      monthly: n > 0 ? amount / n : 0,
      totalInterest: 0,
      totalAmount: amount,
      schedule: [] as { month: number; payment: number; principal: number; interest: number; balance: number }[],
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

function fmt(val: number) {
  return '€\u00a0' + val.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pct(val: number) {
  return val.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + ' %';
}

/* ─── Slider Input ─────────────────────────────────────────────── */
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

/* ─── Tab Button ───────────────────────────────────────────────── */
function TabButton({ title, active, onPress }: { title: string; active: boolean; onPress: () => void }) {
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

/* ═══════════════════════════════════════════════════════════════════
   MAIN SCREEN
   ═══════════════════════════════════════════════════════════════════ */
export default function MortgageScreen() {
  const { t } = useI18n();

  const [tab, setTab] = useState<Tab>('calculator');
  const [purchasePrice, setPurchasePrice] = useState(300000);
  const [equity, setEquity] = useState(60000);
  const [baseRate, setBaseRate] = useState(3.5);
  const [duration, setDuration] = useState(25);
  const [activeType, setActiveType] = useState<LoanType>('annuity');
  const [showSchedule, setShowSchedule] = useState(false);

  // Budget sliders
  const [netIncome, setNetIncome] = useState(4500);
  const [existingDebt, setExistingDebt] = useState(0);
  const [livingCosts, setLivingCosts] = useState(1200);

  const loanAmount = Math.max(0, purchasePrice - equity);

  const allCalcs = useMemo(() =>
    LOAN_TYPES.map((id) => {
      const rate = Math.max(0.1, baseRate + RATE_OFFSET[id]);
      return { id, rate, ...calcMortgage(loanAmount, rate, duration) };
    }),
    [loanAmount, baseRate, duration],
  );

  const active = allCalcs.find(c => c.id === activeType)!;
  const availableMonthly = netIncome - existingDebt - livingCosts;
  const affordabilityRatio = netIncome > 0 ? (active.monthly + existingDebt) / netIncome * 100 : 0;
  const isWarning = affordabilityRatio > WARNING_THRESHOLD && affordabilityRatio <= DANGER_THRESHOLD;
  const isDanger = affordabilityRatio > DANGER_THRESHOLD;
  const canAfford = availableMonthly >= active.monthly;
  const recommended = allCalcs.reduce((best, cur) => cur.monthly < best.monthly ? cur : best);

  const healthColor = isDanger ? colors.error : isWarning ? colors.warning : colors.success;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ headerTitle: t('mortgage_title') }} />

      {/* ─── Warning Banner ─────────────────────────────────── */}
      {(isWarning || isDanger) && (
        <View style={[styles.warningBanner, {
          backgroundColor: isDanger ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
          borderColor: isDanger ? colors.error : colors.warning,
        }]}>
          <Text style={styles.warningIcon}>{isDanger ? '🚨' : '⚠️'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.warningTitle, { color: isDanger ? colors.error : colors.warning }]}>
              {isDanger ? t('mortgage_dangerTitle') : t('mortgage_warnTitle')}
            </Text>
            <Text style={styles.warningBody}>
              {t('mortgage_ratioText')}{' '}
              <Text style={{ fontWeight: fontWeight.bold }}>{pct(affordabilityRatio)}</Text>{' '}
              {isDanger ? t('mortgage_dangerText') : t('mortgage_warnText')}
            </Text>
          </View>
        </View>
      )}

      {/* ─── Tabs ───────────────────────────────────────────── */}
      <View style={styles.tabRow}>
        <TabButton title={t('mortgage_tab_calculator')} active={tab === 'calculator'} onPress={() => setTab('calculator')} />
        <TabButton title={t('mortgage_tab_comparison')} active={tab === 'comparison'} onPress={() => setTab('comparison')} />
        <TabButton title={t('mortgage_tab_budget')} active={tab === 'budget'} onPress={() => setTab('budget')} />
      </View>

      {/* ─── Shared Sliders: Property & Loan ───────────────── */}
      <Card>
        <Text style={styles.sectionLabel}>{t('mortgage_sectionProperty')}</Text>
        <SliderInput label={t('mortgage_purchasePrice')} value={purchasePrice} min={50000} max={3000000} step={5000} displayValue={fmt(purchasePrice)} onValueChange={setPurchasePrice} />
        <SliderInput label={t('mortgage_equity')} value={equity} min={0} max={purchasePrice} step={1000} displayValue={fmt(equity)} onValueChange={setEquity} />

        {/* Loan amount display */}
        <View style={styles.loanAmountBox}>
          <Text style={styles.loanAmountLabel}>{t('mortgage_loanAmount').toUpperCase()}</Text>
          <Text style={styles.loanAmountValue}>{fmt(loanAmount)}</Text>
          <Text style={styles.loanAmountSub}>
            {t('mortgage_equityRatio')}: {purchasePrice > 0 ? Math.round(equity / purchasePrice * 100) : 0} %
          </Text>
        </View>

        <SliderInput label={t('mortgage_interestRate')} value={baseRate} min={0.5} max={12} step={0.1} displayValue={pct(baseRate)} onValueChange={setBaseRate} />
        <SliderInput label={t('mortgage_duration')} value={duration} min={5} max={50} step={1} displayValue={`${duration} ${t('mortgage_years')}`} onValueChange={(v) => setDuration(Math.round(v))} />
      </Card>

      {/* ─── Shared Sliders: Household ──────────────────────── */}
      <Card>
        <Text style={styles.sectionLabel}>{t('mortgage_sectionHousehold')}</Text>
        <SliderInput label={t('mortgage_netIncome')} value={netIncome} min={500} max={20000} step={100} displayValue={fmt(netIncome) + '/mo'} onValueChange={setNetIncome} />
        <SliderInput label={t('mortgage_existingDebt')} value={existingDebt} min={0} max={5000} step={50} displayValue={fmt(existingDebt) + '/mo'} onValueChange={setExistingDebt} />
        <SliderInput label={t('mortgage_livingCosts')} value={livingCosts} min={500} max={8000} step={50} displayValue={fmt(livingCosts) + '/mo'} onValueChange={setLivingCosts} />
      </Card>

      {/* ═══════════════════════════════════════════════════════
         TAB 1: CALCULATOR
         ═══════════════════════════════════════════════════════ */}
      {tab === 'calculator' && (
        <>
          {/* Loan Type Cards (2×2 grid) */}
          <Card>
            <Text style={styles.sectionLabel}>{t('mortgage_loanType')}</Text>
            <View style={styles.loanTypeGrid}>
              {allCalcs.map((tp) => {
                const color = LOAN_TYPE_COLORS[tp.id as LoanType];
                const isActive = activeType === tp.id;
                return (
                  <TouchableOpacity
                    key={tp.id}
                    style={[
                      styles.loanTypeCard,
                      {
                        borderColor: isActive ? color : colors.border,
                        borderWidth: isActive ? 2 : 1,
                        backgroundColor: isActive ? color + '12' : colors.surface,
                      },
                    ]}
                    onPress={() => setActiveType(tp.id as LoanType)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.loanTypeCardTitle, { color: isActive ? color : colors.text }]}>
                      {t(`mortgage_type_${tp.id}`)}
                    </Text>
                    <Text style={styles.loanTypeCardDesc} numberOfLines={2}>
                      {t(`mortgage_type_${tp.id}_desc`)}
                    </Text>
                    <Text style={[styles.loanTypeCardRate, { color }]}>
                      {fmt(tp.monthly)}/mo
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          {/* Hero Monthly Payment */}
          <View style={[styles.heroCard, { borderColor: LOAN_TYPE_COLORS[activeType] }]}>
            <Text style={[styles.heroLabel, { color: LOAN_TYPE_COLORS[activeType] }]}>
              {t('mortgage_monthlyPayment')} · {t(`mortgage_type_${activeType}`)}
            </Text>
            <Text style={styles.heroAmount}>{fmt(active.monthly)}</Text>
            <Text style={styles.heroSubtitle}>
              {t('mortgage_atRate')} {pct(active.rate)}
            </Text>
          </View>

          {/* Stats Grid (3 columns) */}
          <View style={styles.statsRow}>
            {[
              { label: t('mortgage_totalInterest'), value: fmt(active.totalInterest), color: colors.error },
              { label: t('mortgage_totalAmount'), value: fmt(active.totalAmount), color: colors.text },
              { label: t('mortgage_interestShare'), value: active.totalAmount > 0 ? Math.round(active.totalInterest / active.totalAmount * 100) + ' %' : '0 %', color: colors.warning },
            ].map((item) => (
              <View key={item.label} style={styles.statCard}>
                <Text style={styles.statLabel}>{item.label}</Text>
                <Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text>
              </View>
            ))}
          </View>

          {/* Cost Distribution Bar */}
          <Card>
            <Text style={styles.cardTitle}>{t('mortgage_costDistribution')}</Text>
            <View style={styles.distBar}>
              <View style={[styles.distBarCapital, {
                width: active.totalAmount > 0 ? (loanAmount / active.totalAmount * 100) + '%' : '100%',
                backgroundColor: LOAN_TYPE_COLORS[activeType],
              }]} />
              <View style={styles.distBarInterest} />
            </View>
            <View style={styles.distLegend}>
              <View style={styles.distLegendItem}>
                <View style={[styles.distDot, { backgroundColor: LOAN_TYPE_COLORS[activeType] }]} />
                <Text style={styles.distText}>
                  {t('mortgage_capital')} {active.totalAmount > 0 ? Math.round(loanAmount / active.totalAmount * 100) : 0} %
                </Text>
              </View>
              <View style={styles.distLegendItem}>
                <View style={[styles.distDot, { backgroundColor: colors.error, opacity: 0.7 }]} />
                <Text style={styles.distText}>
                  {t('mortgage_interest')} {active.totalAmount > 0 ? Math.round(active.totalInterest / active.totalAmount * 100) : 0} %
                </Text>
              </View>
            </View>
          </Card>

          {/* Amortization Schedule (collapsible) */}
          <View style={styles.scheduleContainer}>
            <TouchableOpacity
              style={[styles.scheduleHeader, showSchedule && styles.scheduleHeaderBorder]}
              onPress={() => setShowSchedule(!showSchedule)}
              activeOpacity={0.7}
            >
              <Text style={styles.scheduleHeaderText}>{t('mortgage_amortization')}</Text>
              <Text style={styles.scheduleChevron}>{showSchedule ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showSchedule && (
              <View style={styles.scheduleBody}>
                {/* Header row */}
                <View style={styles.scheduleTableHeader}>
                  <Text style={[styles.scheduleHeaderCell, { flex: 0.6, textAlign: 'left' }]}>{t('mortgage_month')}</Text>
                  <Text style={styles.scheduleHeaderCell}>{t('mortgage_payment')}</Text>
                  <Text style={styles.scheduleHeaderCell}>{t('mortgage_principal')}</Text>
                  <Text style={styles.scheduleHeaderCell}>{t('mortgage_interest')}</Text>
                  <Text style={styles.scheduleHeaderCell}>{t('mortgage_balance')}</Text>
                </View>
                {/* Data rows */}
                {active.schedule.map((row) => (
                  <View key={row.month} style={styles.scheduleRow}>
                    <Text style={[styles.scheduleCellText, { flex: 0.6, textAlign: 'left' }]}>
                      {t('mortgage_month')} {row.month}
                    </Text>
                    <Text style={styles.scheduleCellText}>{fmt(row.payment)}</Text>
                    <Text style={[styles.scheduleCellText, { color: LOAN_TYPE_COLORS[activeType] }]}>{fmt(row.principal)}</Text>
                    <Text style={[styles.scheduleCellText, { color: colors.error }]}>{fmt(row.interest)}</Text>
                    <Text style={[styles.scheduleCellText, { fontWeight: fontWeight.semibold }]}>{fmt(row.balance)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════
         TAB 2: COMPARISON
         ═══════════════════════════════════════════════════════ */}
      {tab === 'comparison' && (
        <>
          {/* Recommendation Card */}
          <Card>
            <Text style={styles.sectionLabel}>{t('mortgage_recommended')}</Text>
            <Text style={styles.recommendText}>
              {t('mortgage_recommendationText')}{' '}
              <Text style={{ color: LOAN_TYPE_COLORS[recommended.id as LoanType], fontWeight: fontWeight.bold }}>
                {t(`mortgage_type_${recommended.id}`)}
              </Text>{' '}
              {t('mortgage_recommendationSuffix')}
            </Text>
          </Card>

          {/* Comparison cards for each type */}
          {allCalcs.map((c) => {
            const color = LOAN_TYPE_COLORS[c.id as LoanType];
            const isRec = c.id === recommended.id;
            const dRatio = netIncome > 0 ? (c.monthly + existingDebt) / netIncome * 100 : 0;
            const ok = dRatio <= WARNING_THRESHOLD;
            const warn = dRatio > WARNING_THRESHOLD && dRatio <= DANGER_THRESHOLD;

            let badgeLabel: string;
            let badgeColor: string;
            let badgeBg: string;
            if (isRec) {
              badgeLabel = t('mortgage_recommended');
              badgeColor = colors.success;
              badgeBg = colors.successLight;
            } else if (ok) {
              badgeLabel = t('mortgage_ratingOk');
              badgeColor = colors.info;
              badgeBg = colors.infoLight;
            } else if (warn) {
              badgeLabel = t('mortgage_ratingWarn');
              badgeColor = colors.warning;
              badgeBg = colors.warningLight;
            } else {
              badgeLabel = t('mortgage_ratingDanger');
              badgeColor = colors.error;
              badgeBg = colors.errorLight;
            }

            return (
              <Card key={c.id} style={isRec ? { borderWidth: 2, borderColor: color, backgroundColor: color + '08' } : undefined}>
                <View style={styles.compHeader}>
                  <View style={[styles.compDot, { backgroundColor: color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.compTitle}>{t(`mortgage_type_${c.id}`)}</Text>
                    <Text style={styles.compDesc}>{t(`mortgage_type_${c.id}_desc`)}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                    <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeLabel}</Text>
                  </View>
                </View>

                <View style={styles.compGrid}>
                  <View style={styles.compItem}>
                    <Text style={styles.compLabel}>{t('mortgage_colRate')}</Text>
                    <Text style={styles.compValue}>{pct(c.rate)}</Text>
                  </View>
                  <View style={styles.compItem}>
                    <Text style={styles.compLabel}>{t('mortgage_monthlyPayment')}</Text>
                    <Text style={[styles.compValue, { color, fontWeight: fontWeight.bold }]}>{fmt(c.monthly)}</Text>
                  </View>
                  <View style={styles.compItem}>
                    <Text style={styles.compLabel}>{t('mortgage_totalInterest')}</Text>
                    <Text style={[styles.compValue, { color: colors.error }]}>{fmt(c.totalInterest)}</Text>
                  </View>
                  <View style={styles.compItem}>
                    <Text style={styles.compLabel}>{t('mortgage_totalAmount')}</Text>
                    <Text style={styles.compValue}>{fmt(c.totalAmount)}</Text>
                  </View>
                </View>
              </Card>
            );
          })}

          {/* Monthly Comparison Bars */}
          <Card>
            <Text style={styles.cardTitle}>{t('mortgage_monthlyComparison')}</Text>
            {allCalcs.map((c) => {
              const maxMonthly = Math.max(...allCalcs.map(x => x.monthly));
              const color = LOAN_TYPE_COLORS[c.id as LoanType];
              return (
                <View key={c.id} style={styles.barChartRow}>
                  <View style={styles.barChartLabels}>
                    <Text style={styles.barChartName}>{t(`mortgage_type_${c.id}`)}</Text>
                    <Text style={[styles.barChartAmount, { color }]}>{fmt(c.monthly)}</Text>
                  </View>
                  <View style={styles.barChartTrack}>
                    <View style={[styles.barChartFill, { width: maxMonthly > 0 ? (c.monthly / maxMonthly * 100) + '%' : '0%', backgroundColor: color }]} />
                  </View>
                </View>
              );
            })}
          </Card>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════
         TAB 3: BUDGET / HOUSEHOLD
         ═══════════════════════════════════════════════════════ */}
      {tab === 'budget' && (
        <>
          {/* Debt Ratio Summary Cards (2×2) */}
          <Card>
            <Text style={styles.sectionLabel}>{t('mortgage_debtRatio')}</Text>
            <View style={styles.debtGrid}>
              {[
                { label: t('mortgage_newRate'), value: fmt(active.monthly), color: colors.info },
                { label: t('mortgage_existingDebt'), value: fmt(existingDebt), color: colors.warning },
                { label: t('mortgage_totalBurden'), value: fmt(active.monthly + existingDebt), color: healthColor },
                { label: t('mortgage_debtRatio'), value: pct(affordabilityRatio), color: healthColor },
              ].map((item) => (
                <View key={item.label} style={styles.debtCard}>
                  <Text style={styles.debtCardLabel}>{item.label}</Text>
                  <Text style={[styles.debtCardValue, { color: item.color }]}>{item.value}</Text>
                </View>
              ))}
            </View>

            {/* Gradient Gauge Bar */}
            <View style={styles.gaugeSection}>
              <View style={styles.gaugeScaleLabels}>
                <Text style={styles.gaugeScaleText}>0 %</Text>
                <Text style={styles.gaugeScaleText}>35 % {t('mortgage_warningLabel')}</Text>
                <Text style={styles.gaugeScaleText}>40 % {t('mortgage_limitLabel')}</Text>
                <Text style={styles.gaugeScaleText}>100 %</Text>
              </View>
              <View style={styles.gaugeBarOuter}>
                {/* Green segment: 0-35% */}
                <View style={[styles.gaugeSegment, { flex: 35, backgroundColor: '#34c759', borderTopLeftRadius: 7, borderBottomLeftRadius: 7 }]} />
                {/* Orange segment: 35-40% */}
                <View style={[styles.gaugeSegment, { flex: 5, backgroundColor: '#ff9500' }]} />
                {/* Red segment: 40-100% */}
                <View style={[styles.gaugeSegment, { flex: 60, backgroundColor: '#ff3b30', borderTopRightRadius: 7, borderBottomRightRadius: 7 }]} />
                {/* Circular marker */}
                <View style={[styles.gaugeMarker, {
                  left: `${Math.min(affordabilityRatio, 100)}%`,
                  borderColor: healthColor,
                }]} />
              </View>
              <Text style={[styles.gaugeStatusText, { color: healthColor }]}>
                {isDanger ? t('mortgage_critical') : isWarning ? t('mortgage_elevated') : t('mortgage_healthy2')} — {pct(affordabilityRatio)} {t('mortgage_ofIncome')}
              </Text>
            </View>
          </Card>

          {/* Monthly Budget Breakdown */}
          <Card>
            <Text style={styles.sectionLabel}>{t('mortgage_monthlyBudget')}</Text>
            {[
              { label: t('mortgage_netIncome'), value: netIncome, color: colors.success, sign: '+' },
              { label: t('mortgage_livingCosts'), value: -livingCosts, color: colors.textSecondary, sign: '−' },
              { label: t('mortgage_existingDebt'), value: -existingDebt, color: colors.warning, sign: '−' },
              { label: t('mortgage_monthlyPayment'), value: -active.monthly, color: colors.error, sign: '−' },
            ].map((item, i) => (
              <View key={i} style={[styles.budgetRow, i < 3 && styles.budgetRowBorder]}>
                <View style={styles.budgetRowLeft}>
                  <Text style={[styles.budgetSign, { color: item.color }]}>{item.sign}</Text>
                  <Text style={styles.budgetLabel}>{item.label}</Text>
                </View>
                <Text style={[styles.budgetValue, { color: item.color }]}>
                  {fmt(Math.abs(item.value))}
                </Text>
              </View>
            ))}

            {/* Free Budget Total */}
            <View style={styles.freeBudgetRow}>
              <Text style={styles.freeBudgetLabel}>{t('mortgage_freeBudget')}</Text>
              <Text style={[styles.freeBudgetValue, {
                color: (availableMonthly - active.monthly) >= 0 ? colors.success : colors.error,
              }]}>
                {fmt(availableMonthly - active.monthly)}
              </Text>
            </View>

            {/* Cannot Afford Warning */}
            {!canAfford && (
              <View style={styles.cannotAffordBox}>
                <Text style={styles.cannotAffordText}>{t('mortgage_cannotAfford')}</Text>
              </View>
            )}
          </Card>

          {/* Financial Tips */}
          <Card>
            <Text style={styles.sectionLabel}>{t('mortgage_tipsTitle')}</Text>
            {[
              { ok: purchasePrice > 0 && equity / purchasePrice >= 0.2, text: t('mortgage_tipEquityText'), good: t('mortgage_tipEquityGood'), bad: t('mortgage_tipEquityBad') },
              { ok: !isDanger && !isWarning, text: t('mortgage_tipRatioText'), good: t('mortgage_tipRatioGood'), bad: t('mortgage_tipRatioBad') },
              { ok: availableMonthly - active.monthly > 500, text: t('mortgage_tipBufferText'), good: t('mortgage_tipBufferGood'), bad: t('mortgage_tipBufferBad') },
              { ok: netIncome > 0 && existingDebt / netIncome < 0.1, text: t('mortgage_tipDebtText'), good: t('mortgage_tipDebtGood'), bad: t('mortgage_tipDebtBad') },
            ].map((tip, i) => (
              <View key={i} style={[styles.tipRow, i < 3 && styles.tipRowBorder]}>
                <View style={[styles.tipIcon, {
                  backgroundColor: tip.ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.1)',
                }]}>
                  <Text style={[styles.tipIconText, { color: tip.ok ? colors.success : colors.error }]}>
                    {tip.ok ? '✓' : '!'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tipTitle}>{tip.text}</Text>
                  <Text style={[styles.tipMessage, { color: tip.ok ? colors.success : colors.error }]}>
                    {tip.ok ? tip.good : tip.bad}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        </>
      )}
    </ScrollView>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 120,
  },

  /* ─── Warning Banner ───────────────────────────────── */
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  warningIcon: { fontSize: 22 },
  warningTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    marginBottom: 4,
  },
  warningBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  /* ─── Tabs ─────────────────────────────────────────── */
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
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  tabButtonTextActive: {
    color: colors.white,
  },

  /* ─── Sliders ──────────────────────────────────────── */
  sliderRow: { marginBottom: spacing.md },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sliderLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sliderValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  slider: { width: '100%', height: 36 },

  /* ─── Section Label ────────────────────────────────── */
  sectionLabel: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },

  /* ─── Loan Amount Box ──────────────────────────────── */
  loanAmountBox: {
    padding: 12,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(0,122,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,122,255,0.2)',
    marginBottom: spacing.md,
  },
  loanAmountLabel: {
    fontSize: 11,
    color: '#007aff',
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  loanAmountValue: {
    fontSize: 20,
    fontWeight: fontWeight.bold,
    color: '#007aff',
  },
  loanAmountSub: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },

  /* ─── Loan Type Cards ──────────────────────────────── */
  loanTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  loanTypeCard: {
    width: '48%',
    flexGrow: 1,
    padding: 12,
    borderRadius: borderRadius.sm,
  },
  loanTypeCardTitle: {
    fontSize: 13,
    fontWeight: fontWeight.bold,
    marginBottom: 2,
  },
  loanTypeCardDesc: {
    fontSize: 11,
    color: colors.textTertiary,
    lineHeight: 15,
  },
  loanTypeCardRate: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    marginTop: spacing.sm,
  },

  /* ─── Hero Card ────────────────────────────────────── */
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadow.md,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  heroAmount: {
    fontSize: 44,
    fontWeight: '800' as any,
    color: colors.text,
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 10,
  },

  /* ─── Stats Row (3 columns) ────────────────────────── */
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 14,
    alignItems: 'center',
    ...shadow.sm,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.textSecondary,
    marginBottom: 6,
    textAlign: 'center',
  },
  statValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },

  /* ─── Cost Distribution ────────────────────────────── */
  cardTitle: {
    fontSize: 13,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: 12,
  },
  distBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10,
  },
  distBarCapital: { borderRadius: 0 },
  distBarInterest: { flex: 1, backgroundColor: colors.error, opacity: 0.6 },
  distLegend: { flexDirection: 'row', gap: 20 },
  distLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  distDot: { width: 10, height: 10, borderRadius: 2 },
  distText: { fontSize: fontSize.xs, color: colors.textSecondary },

  /* ─── Amortization Schedule ────────────────────────── */
  scheduleContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    ...shadow.md,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  scheduleHeaderBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  scheduleHeaderText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  scheduleChevron: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  scheduleBody: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  scheduleTableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  scheduleHeaderCell: {
    flex: 1,
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  scheduleRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  scheduleCellText: {
    flex: 1,
    fontSize: 10,
    color: colors.text,
    textAlign: 'right',
  },

  /* ─── Comparison ───────────────────────────────────── */
  recommendText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
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
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  compDesc: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
  },
  compGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  compItem: {
    width: '47%',
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

  /* ─── Bar Chart ────────────────────────────────────── */
  barChartRow: {
    marginBottom: 14,
  },
  barChartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  barChartName: { fontSize: fontSize.xs, color: colors.textSecondary },
  barChartAmount: { fontSize: 13, fontWeight: fontWeight.bold },
  barChartTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderLight,
    overflow: 'hidden',
  },
  barChartFill: { height: '100%', borderRadius: 4 },

  /* ─── Debt Ratio Cards ─────────────────────────────── */
  debtGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  debtCard: {
    width: '47%',
    flexGrow: 1,
    padding: 14,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.borderLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  debtCardLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    marginBottom: 4,
  },
  debtCardValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },

  /* ─── Gradient Gauge ───────────────────────────────── */
  gaugeSection: { marginBottom: 10 },
  gaugeScaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  gaugeScaleText: { fontSize: 10, color: colors.textTertiary },
  gaugeBarOuter: {
    height: 14,
    borderRadius: 7,
    overflow: 'visible',
    position: 'relative',
    flexDirection: 'row',
  },
  gaugeSegment: {
    height: 14,
  },
  gaugeMarker: {
    position: 'absolute',
    top: -3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
    borderWidth: 3,
    marginLeft: -10,
    ...shadow.md,
  },
  gaugeStatusText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 13,
    fontWeight: fontWeight.bold,
  },

  /* ─── Monthly Budget Breakdown ─────────────────────── */
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  budgetRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  budgetRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  budgetSign: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    width: 16,
    textAlign: 'center',
  },
  budgetLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  budgetValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  freeBudgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    marginTop: 4,
  },
  freeBudgetLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  freeBudgetValue: {
    fontSize: 20,
    fontWeight: '800' as any,
  },
  cannotAffordBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: colors.error,
  },
  cannotAffordText: {
    fontSize: 13,
    color: colors.error,
  },

  /* ─── Financial Tips ───────────────────────────────── */
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
  },
  tipRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tipIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipIconText: {
    fontSize: 12,
    fontWeight: fontWeight.bold,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  tipMessage: {
    fontSize: fontSize.xs,
  },
});
