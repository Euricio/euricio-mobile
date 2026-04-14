export type CallState =
  | 'idle'
  | 'connecting'
  | 'ringing'
  | 'connected'
  | 'reconnecting'
  | 'disconnecting'
  | 'failed';

export type CallDirection = 'inbound' | 'outbound';

export interface CallInfo {
  state: CallState;
  direction: CallDirection | null;
  remoteNumber: string | null;
  startTime: number | null;
  muted: boolean;
  onHold: boolean;
}

export const initialCallInfo: CallInfo = {
  state: 'idle',
  direction: null,
  remoteNumber: null,
  startTime: null,
  muted: false,
  onHold: false,
};

export function formatCallDuration(startTime: number | null): string {
  if (!startTime) return '00:00';
  const seconds = Math.floor((Date.now() - startTime) / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
