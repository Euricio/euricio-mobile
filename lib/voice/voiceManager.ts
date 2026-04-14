import { Voice, Call, CallInvite } from '@twilio/voice-react-native-sdk';
import { Config } from '../../constants/config';
import { useCallStore } from '../../store/callStore';

const voice = new Voice();
let activeCall: Call | null = null;

/**
 * Twilio Voice SDK Manager
 *
 * Verwaltet die gesamte Voice-Kommunikation:
 * - Registrierung mit Access Token
 * - Ausgehende Anrufe
 * - Eingehende Anrufe annehmen/ablehnen
 * - Anruf-Steuerung (Mute, Hold, Hangup)
 */

export async function register(accessToken: string): Promise<void> {
  await voice.register(accessToken);

  voice.on(Voice.Event.CallInvite, handleIncomingCall);
  voice.on(Voice.Event.CancelledCallInvite, handleCancelledInvite);

  console.log('[VoiceManager] Registered for incoming calls');
}

export async function unregister(accessToken: string): Promise<void> {
  await voice.unregister(accessToken);
  voice.removeAllListeners();
  console.log('[VoiceManager] Unregistered');
}

export async function connect(
  accessToken: string,
  to: string,
  params?: Record<string, string>
): Promise<Call> {
  const store = useCallStore.getState();

  const call = await voice.connect(accessToken, {
    params: {
      To: to,
      ...params,
    },
  });

  activeCall = call;
  store.setCallState('connecting');
  store.setRemoteNumber(to);

  setupCallListeners(call);
  return call;
}

export function accept(callInvite: CallInvite): void {
  const call = callInvite.accept();
  activeCall = call;
  setupCallListeners(call);
}

export function reject(callInvite: CallInvite): void {
  callInvite.reject();
  useCallStore.getState().reset();
}

export function hangup(): void {
  if (activeCall) {
    activeCall.disconnect();
    activeCall = null;
  }
  useCallStore.getState().reset();
}

export function mute(muted: boolean): void {
  if (activeCall) {
    activeCall.mute(muted);
    useCallStore.getState().setMuted(muted);
  }
}

export function hold(onHold: boolean): void {
  if (activeCall) {
    activeCall.hold(onHold);
    useCallStore.getState().setOnHold(onHold);
  }
}

export function sendDigits(digits: string): void {
  if (activeCall) {
    activeCall.sendDigits(digits);
  }
}

export function getActiveCall(): Call | null {
  return activeCall;
}

// --- Private Handlers ---

function handleIncomingCall(callInvite: CallInvite): void {
  const store = useCallStore.getState();
  store.setCallState('ringing');
  store.setDirection('inbound');
  store.setRemoteNumber(callInvite.getFrom() || 'Unbekannt');
  store.setCallInvite(callInvite);
}

function handleCancelledInvite(_callInvite: CallInvite): void {
  useCallStore.getState().reset();
}

function setupCallListeners(call: Call): void {
  const store = useCallStore.getState();

  call.on(Call.Event.Connected, () => {
    store.setCallState('connected');
    store.setCallStartTime(Date.now());
  });

  call.on(Call.Event.Reconnecting, () => {
    store.setCallState('reconnecting');
  });

  call.on(Call.Event.Reconnected, () => {
    store.setCallState('connected');
  });

  call.on(Call.Event.Disconnected, () => {
    activeCall = null;
    store.reset();
  });

  call.on(Call.Event.ConnectFailure, (error) => {
    console.error('[VoiceManager] Connect failure:', error);
    activeCall = null;
    store.setCallState('failed');
  });
}
