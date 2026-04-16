import { Voice, Call, CallInvite } from '@twilio/voice-react-native-sdk';
import { getVoiceAccessToken } from './accessToken';

export type VoiceStatus =
  | 'idle'
  | 'ready'
  | 'connecting'
  | 'ringing'
  | 'connected'
  | 'disconnected'
  | 'error';

export interface VoiceEvent {
  type:
    | 'status'
    | 'error'
    | 'incoming'
    | 'callConnected'
    | 'callDisconnected'
    | 'callRinging'
    | 'mute'
    | 'hold';
  payload?: unknown;
}

type Listener = (event: VoiceEvent) => void;

/**
 * Singleton that wraps @twilio/voice-react-native-sdk.
 * Manages device registration, call lifecycle, and emits events
 * consumed by useTwilioVoice hook.
 */
export class VoiceManager {
  private static instance: VoiceManager;
  private voice: Voice;
  private activeCall: Call | null = null;
  private pendingInvite: CallInvite | null = null;
  private listeners: Set<Listener> = new Set();
  private registered = false;
  private tokenRefreshTimer: ReturnType<typeof setTimeout> | null = null;

  private constructor() {
    this.voice = new Voice();
    this.setupVoiceListeners();
  }

  static getInstance(): VoiceManager {
    if (!VoiceManager.instance) {
      VoiceManager.instance = new VoiceManager();
    }
    return VoiceManager.instance;
  }

  /* ── Event emitter ─────────────────────────────────────────── */

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: VoiceEvent) {
    this.listeners.forEach((fn) => fn(event));
  }

  /* ── Voice SDK listeners ───────────────────────────────────── */

  private setupVoiceListeners() {
    this.voice.on(Voice.Event.CallInvite, (invite: CallInvite) => {
      this.pendingInvite = invite;
      this.emit({
        type: 'incoming',
        payload: {
          callSid: invite.getCallSid(),
          from: invite.getFrom(),
          to: invite.getTo(),
        },
      });
      this.emit({ type: 'status', payload: 'ringing' });
    });

    this.voice.on(Voice.Event.CancelledCallInvite, () => {
      this.pendingInvite = null;
      this.emit({ type: 'status', payload: 'ready' });
    });

    this.voice.on(Voice.Event.Registered, () => {
      this.registered = true;
      this.emit({ type: 'status', payload: 'ready' });
    });

    this.voice.on(Voice.Event.Unregistered, () => {
      this.registered = false;
      this.emit({ type: 'status', payload: 'idle' });
    });
  }

  private attachCallListeners(call: Call) {
    call.on(Call.Event.Connected, () => {
      this.emit({ type: 'callConnected' });
      this.emit({ type: 'status', payload: 'connected' });
    });

    call.on(Call.Event.Ringing, () => {
      this.emit({ type: 'callRinging' });
      this.emit({ type: 'status', payload: 'ringing' });
    });

    call.on(Call.Event.Disconnected, () => {
      this.activeCall = null;
      this.emit({ type: 'callDisconnected' });
      this.emit({ type: 'status', payload: 'disconnected' });
      setTimeout(() => this.emit({ type: 'status', payload: 'ready' }), 1500);
    });

    call.on(Call.Event.ConnectFailure, (error: unknown) => {
      this.activeCall = null;
      this.emit({ type: 'error', payload: error });
      this.emit({ type: 'status', payload: 'error' });
    });
  }

  /* ── Registration ──────────────────────────────────────────── */

  async register(): Promise<void> {
    try {
      const token = await getVoiceAccessToken();
      await this.voice.register(token);
      this.scheduleTokenRefresh();
    } catch (err) {
      this.emit({ type: 'error', payload: err });
      this.emit({ type: 'status', payload: 'error' });
    }
  }

  async unregister(): Promise<void> {
    try {
      await this.voice.unregister(await getVoiceAccessToken());
      this.registered = false;
      if (this.tokenRefreshTimer) clearTimeout(this.tokenRefreshTimer);
    } catch {
      /* ignore */
    }
  }

  private scheduleTokenRefresh() {
    if (this.tokenRefreshTimer) clearTimeout(this.tokenRefreshTimer);
    // Refresh 5 min before expiry (token TTL = 1 hour → refresh at 55 min)
    this.tokenRefreshTimer = setTimeout(async () => {
      try {
        const token = await getVoiceAccessToken();
        await this.voice.register(token);
        this.scheduleTokenRefresh();
      } catch {
        /* will retry on next call */
      }
    }, 55 * 60 * 1000);
  }

  isRegistered(): boolean {
    return this.registered;
  }

  /* ── Outbound calls ────────────────────────────────────────── */

  async makeCall(to: string): Promise<void> {
    if (this.activeCall) return;
    this.emit({ type: 'status', payload: 'connecting' });

    try {
      const token = await getVoiceAccessToken();
      const call = await this.voice.connect(token, { params: { To: to } });
      this.activeCall = call;
      this.attachCallListeners(call);
    } catch (err) {
      this.emit({ type: 'error', payload: err });
      this.emit({ type: 'status', payload: 'error' });
    }
  }

  /* ── Incoming calls ────────────────────────────────────────── */

  async acceptCall(): Promise<void> {
    if (!this.pendingInvite) return;
    try {
      const call = await this.pendingInvite.accept();
      this.activeCall = call;
      this.pendingInvite = null;
      this.attachCallListeners(call);
      this.emit({ type: 'status', payload: 'connected' });
    } catch (err) {
      this.emit({ type: 'error', payload: err });
    }
  }

  rejectCall(): void {
    if (!this.pendingInvite) return;
    this.pendingInvite.reject();
    this.pendingInvite = null;
    this.emit({ type: 'status', payload: 'ready' });
  }

  /* ── Active call controls ──────────────────────────────────── */

  async hangup(): Promise<void> {
    if (this.activeCall) {
      await this.activeCall.disconnect();
      this.activeCall = null;
    }
  }

  async toggleMute(): Promise<boolean> {
    if (!this.activeCall) return false;
    const muted = await this.activeCall.isMuted();
    await this.activeCall.mute(!muted);
    this.emit({ type: 'mute', payload: !muted });
    return !muted;
  }

  async toggleHold(): Promise<boolean> {
    if (!this.activeCall) return false;
    const held = await this.activeCall.isOnHold();
    await this.activeCall.hold(!held);
    this.emit({ type: 'hold', payload: !held });
    return !held;
  }

  async sendDigits(digits: string): Promise<void> {
    if (this.activeCall) {
      await this.activeCall.sendDigits(digits);
    }
  }

  getActiveCall(): Call | null {
    return this.activeCall;
  }

  getPendingInvite(): CallInvite | null {
    return this.pendingInvite;
  }
}
