import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetSnapshot } from '../lib/widgets/snapshot';

/**
 * Android home-screen widget for Euricio.
 *
 * Rendered via `react-native-android-widget`. The JSX below is serialised to
 * RemoteViews at widget update time, so only the exported primitive widgets
 * from that package are usable here (no arbitrary React Native components).
 *
 * Brand: Waldgrün #1B5E3F / accent #2A8F5F.
 */

const BRAND_BG = '#1B5E3F';
const BRAND_ACCENT = '#2A8F5F';
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_MUTED = '#E4F1EA';

function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  } catch {
    return '—';
  }
}

export interface EuricioNextCallWidgetProps {
  snapshot: WidgetSnapshot | null;
  locale?: 'de' | 'en' | 'es';
}

const COPY: Record<
  'de' | 'en' | 'es',
  {
    focus: string;
    nextCall: string;
    none: string;
    noneSub: string;
    tasks: string;
    callbacks: string;
    open: string;
  }
> = {
  de: {
    focus: 'Fokus aktiv',
    nextCall: 'Nächster Call',
    none: 'Keine Calls',
    noneSub: 'in den nächsten 24 h',
    tasks: 'Aufgaben',
    callbacks: 'Rückrufe',
    open: 'Euricio öffnen',
  },
  en: {
    focus: 'Focus on',
    nextCall: 'Next call',
    none: 'No calls',
    noneSub: 'in the next 24 h',
    tasks: 'Tasks',
    callbacks: 'Callbacks',
    open: 'Open Euricio',
  },
  es: {
    focus: 'Modo foco',
    nextCall: 'Próxima llamada',
    none: 'Sin llamadas',
    noneSub: 'en las próximas 24 h',
    tasks: 'Tareas',
    callbacks: 'Devoluciones',
    open: 'Abrir Euricio',
  },
};

export function EuricioNextCallWidget({
  snapshot,
  locale = 'de',
}: EuricioNextCallWidgetProps) {
  const t = COPY[locale] ?? COPY.de;
  const busy = snapshot?.is_busy === true;
  const next = snapshot?.next_call ?? null;

  const clickAction = next?.entity_id
    ? `euricio://call/${next.entity_id}`
    : 'euricio://tasks';

  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: clickAction }}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: BRAND_BG,
        borderRadius: 16,
        padding: 12,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Header */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          width: 'match_parent',
          height: 'wrap_content',
        }}
      >
        <TextWidget
          text={busy ? '●' : '•'}
          style={{
            fontSize: 14,
            fontWeight: '700',
            color: BRAND_ACCENT,
            marginRight: 6,
          }}
        />
        <TextWidget
          text={busy ? t.focus : t.nextCall}
          style={{
            fontSize: 11,
            fontWeight: '600',
            color: TEXT_MUTED,
          }}
        />
      </FlexWidget>

      {/* Body */}
      {snapshot && next ? (
        <FlexWidget
          style={{
            flexDirection: 'column',
            width: 'match_parent',
            height: 'wrap_content',
          }}
        >
          <TextWidget
            text={formatTime(next.when)}
            style={{
              fontSize: 22,
              fontWeight: '700',
              color: TEXT_PRIMARY,
            }}
          />
          <TextWidget
            text={(next.entity_name || next.title || '—').slice(0, 32)}
            style={{ fontSize: 12, color: TEXT_MUTED }}
            maxLines={1}
          />
        </FlexWidget>
      ) : snapshot ? (
        <FlexWidget
          style={{
            flexDirection: 'column',
            width: 'match_parent',
            height: 'wrap_content',
          }}
        >
          <TextWidget
            text={t.none}
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: TEXT_PRIMARY,
            }}
          />
          <TextWidget
            text={t.noneSub}
            style={{ fontSize: 11, color: TEXT_MUTED }}
          />
        </FlexWidget>
      ) : (
        <TextWidget
          text={t.open}
          style={{ fontSize: 12, color: TEXT_MUTED }}
        />
      )}

      {/* Footer / counters */}
      {snapshot ? (
        <FlexWidget
          style={{
            flexDirection: 'row',
            width: 'match_parent',
            height: 'wrap_content',
          }}
        >
          <TextWidget
            text={`✓ ${snapshot.open_tasks_count}`}
            style={{
              fontSize: 11,
              color: TEXT_MUTED,
              marginRight: 10,
            }}
          />
          <TextWidget
            text={`↺ ${snapshot.open_callbacks_count}`}
            style={{ fontSize: 11, color: TEXT_MUTED }}
          />
        </FlexWidget>
      ) : null}
    </FlexWidget>
  );
}

export default EuricioNextCallWidget;
