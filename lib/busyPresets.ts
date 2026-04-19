export type BusyPresetKey =
  | 'in_appointment'
  | 'at_notary'
  | 'at_viewing'
  | 'on_call'
  | 'in_meeting'
  | 'off_duty'
  | 'on_vacation'
  | 'sick_leave'
  | 'custom';

export interface BusyPreset {
  key: BusyPresetKey;
  icon: string;
}

export const BUSY_PRESETS: BusyPreset[] = [
  { key: 'in_appointment', icon: '📅' },
  { key: 'at_notary',      icon: '✍️' },
  { key: 'at_viewing',     icon: '🏠' },
  { key: 'on_call',        icon: '📞' },
  { key: 'in_meeting',     icon: '👥' },
  { key: 'off_duty',       icon: '🌙' },
  { key: 'on_vacation',    icon: '🏖️' },
  { key: 'sick_leave',     icon: '🤒' },
  { key: 'custom',         icon: '✏️' },
];

export function buildBusyAnnouncement(
  presetKey: BusyPresetKey,
  displayName: string,
  callbackTime: string | null | undefined,
  t: (key: string) => string,
): string {
  if (presetKey === 'custom') return '';
  const hasCallback = !!(callbackTime && callbackTime.trim().length > 0);
  const baseKey = hasCallback
    ? `busy.presets.${presetKey}.announcement_with_callback`
    : `busy.presets.${presetKey}.announcement`;
  const template = t(baseKey);
  return template
    .replace(/\{\{\s*name\s*\}\}/g, displayName)
    .replace(/\{\{\s*callbackTime\s*\}\}/g, callbackTime ?? '');
}
