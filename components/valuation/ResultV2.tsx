import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import type {
  ValuationResultV2,
  ConfidenceClass,
  MethodOutput,
  Warning,
} from '../../lib/valuation/types';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../constants/theme';

interface ResultV2Props {
  result: ValuationResultV2;
}

function formatEuro(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

const CONF_COLOR: Record<ConfidenceClass, { bg: string; fg: string }> = {
  alta: { bg: colors.successLight, fg: colors.success },
  media: { bg: colors.warningLight, fg: colors.warning },
  baja: { bg: colors.errorLight, fg: colors.error },
};

function severityIcon(sev: Warning['severity']): keyof typeof Ionicons.glyphMap {
  if (sev === 'error') return 'alert-circle';
  if (sev === 'warn') return 'warning';
  return 'information-circle-outline';
}

function severityColor(sev: Warning['severity']): string {
  if (sev === 'error') return colors.error;
  if (sev === 'warn') return colors.warning;
  return colors.info;
}

export function ResultV2({ result }: ResultV2Props) {
  const [explainOpen, setExplainOpen] = useState(false);
  const confCol = CONF_COLOR[result.confidence.class] || CONF_COLOR.media;

  return (
    <View>
      {/* Range */}
      <Card style={styles.rangeCard}>
        <Text style={styles.rangeLabel}>{/* TODO i18n */ 'Valor estimado'}</Text>
        <Text style={styles.rangeBase}>{formatEuro(result.range.base)}</Text>
        <View style={styles.rangeRow}>
          <Text style={styles.rangeSide}>{formatEuro(result.range.low)}</Text>
          <Text style={styles.rangeDash}>—</Text>
          <Text style={styles.rangeSide}>{formatEuro(result.range.high)}</Text>
        </View>
        {result.value_per_sqm != null && (
          <Text style={styles.rangeMeta}>
            {/* TODO i18n */}
            {formatEuro(result.value_per_sqm)} / m²
          </Text>
        )}
      </Card>

      {/* Confidence */}
      <View style={[styles.confBadge, { backgroundColor: confCol.bg }]}>
        <Ionicons name="shield-checkmark-outline" size={18} color={confCol.fg} />
        <Text style={[styles.confText, { color: confCol.fg }]}>
          {/* TODO i18n */}
          Confianza {result.confidence.class} ({result.confidence.score})
        </Text>
      </View>

      {/* Methods chips */}
      <View style={styles.chipsRow}>
        {result.methods.map((m: MethodOutput) => {
          const pct = Math.round((result.weights[m.method] ?? 0) * 100);
          return (
            <View key={m.method} style={styles.chip}>
              <Text style={styles.chipText}>
                {m.method} {pct}%
              </Text>
            </View>
          );
        })}
      </View>

      {/* VPO banner */}
      {result.vpo?.legal_review_required && (
        <View style={styles.vpoBanner}>
          <Ionicons name="document-text-outline" size={20} color={colors.warning} />
          <Text style={styles.vpoText}>
            {/* TODO i18n */}
            Vivienda protegida — revisión legal obligatoria
          </Text>
        </View>
      )}

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <Card style={styles.warningsCard}>
          <Text style={styles.sectionTitle}>{/* TODO i18n */ 'Avisos'}</Text>
          {result.warnings.map((w, i) => (
            <View key={`${w.code}-${i}`} style={styles.warnRow}>
              <Ionicons
                name={severityIcon(w.severity)}
                size={16}
                color={severityColor(w.severity)}
              />
              <Text style={styles.warnMessage}>{w.message}</Text>
            </View>
          ))}
        </Card>
      )}

      {/* Confidence breakdown */}
      {result.confidence.breakdown.length > 0 && (
        <Card style={styles.breakdownCard}>
          <Text style={styles.sectionTitle}>{/* TODO i18n */ 'Desglose de confianza'}</Text>
          {result.confidence.breakdown.map((e, i) => (
            <View key={`${e.code ?? i}`} style={styles.breakRow}>
              <Text style={styles.breakReason}>{e.reason}</Text>
              <Text style={[styles.breakDelta, e.delta < 0 && { color: colors.error }]}>
                {e.delta > 0 ? `+${e.delta}` : e.delta}
              </Text>
            </View>
          ))}
        </Card>
      )}

      {/* Explanation */}
      <TouchableOpacity
        style={styles.explainToggle}
        onPress={() => setExplainOpen((o) => !o)}
        activeOpacity={0.7}
      >
        <Text style={styles.explainToggleText}>
          {/* TODO i18n */}
          {explainOpen ? 'Ocultar' : 'Mostrar'} cómo se ha calculado
        </Text>
        <Ionicons
          name={explainOpen ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.primary}
        />
      </TouchableOpacity>

      {explainOpen && (
        <View>
          {result.methods.map((m) => (
            <Card key={m.method} style={styles.methodCard}>
              <Text style={styles.methodTitle}>{m.explanation.title}</Text>
              <Text style={styles.methodValue}>{formatEuro(m.value)}</Text>
              {m.explanation.steps.map((step, i) => (
                <View key={i} style={styles.stepBox}>
                  <Text style={styles.stepLabel}>{step.label}</Text>
                  {step.formula && <Text style={styles.stepFormula}>{step.formula}</Text>}
                  {step.inputs && Object.keys(step.inputs).length > 0 && (
                    <Text style={styles.stepInputs}>
                      {JSON.stringify(step.inputs, null, 2)}
                    </Text>
                  )}
                  {step.result != null && (
                    <Text style={styles.stepResult}>
                      = {step.result.toLocaleString('es-ES')} {step.unit ?? ''}
                    </Text>
                  )}
                  {step.note && <Text style={styles.stepNote}>{step.note}</Text>}
                </View>
              ))}
            </Card>
          ))}

          {/* Market data */}
          <Card style={styles.methodCard}>
            <Text style={styles.methodTitle}>{/* TODO i18n */ 'Datos de mercado'}</Text>
            <Text style={styles.stepLabel}>
              {result.market_data.source_label ?? result.market_data.source}
            </Text>
            {result.market_data.municipality && (
              <Text style={styles.stepInputs}>
                {result.market_data.municipality}
                {result.market_data.province ? ` · ${result.market_data.province}` : ''}
              </Text>
            )}
            {result.market_data.reference_period && (
              <Text style={styles.stepInputs}>
                {/* TODO i18n */} Periodo: {result.market_data.reference_period}
              </Text>
            )}
            {result.market_data.age_days != null && (
              <Text style={styles.stepInputs}>
                {/* TODO i18n */} Antigüedad: {result.market_data.age_days} días
              </Text>
            )}
          </Card>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rangeCard: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  rangeLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rangeBase: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginVertical: spacing.xs,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rangeSide: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  rangeDash: {
    fontSize: fontSize.md,
    color: colors.textTertiary,
  },
  rangeMeta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  confBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  confText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    backgroundColor: colors.borderLight,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  chipText: {
    fontSize: fontSize.xs,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  vpoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warningLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  vpoText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.semibold,
    flex: 1,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  warningsCard: {
    marginBottom: spacing.md,
  },
  warnRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  warnMessage: {
    fontSize: fontSize.sm,
    color: colors.text,
    flex: 1,
  },
  breakdownCard: {
    marginBottom: spacing.md,
  },
  breakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  breakReason: {
    fontSize: fontSize.sm,
    color: colors.text,
    flex: 1,
  },
  breakDelta: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  explainToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  explainToggleText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  methodCard: {
    marginBottom: spacing.md,
  },
  methodTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  methodValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  stepBox: {
    marginVertical: spacing.xs,
    paddingLeft: spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: colors.borderLight,
  },
  stepLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  stepFormula: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    fontFamily: 'Courier',
    marginTop: 2,
  },
  stepInputs: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontFamily: 'Courier',
    marginTop: 2,
  },
  stepResult: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
    marginTop: 2,
  },
  stepNote: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
