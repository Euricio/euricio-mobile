/**
 * Twilio Voice React Native SDK integration.
 *
 * The SDK is imported dynamically so the app can still run in Expo Go
 * (where native modules are unavailable). When running in Expo Go,
 * the manager enters a "no-native" fallback mode — voice features are
 * simply hidden and the FAB never appears.
 */

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

/* ── Lazy SDK references (set after dynamic import) ───────── */
let TwilioVoice: typeof import('@twilio/voice-react-native-sdk').Voice | null = null;
let TwilioCall: typeof import('@twilio/voice-react-native-sdk').Call | null = null;
let sdkAvailable: boolean | null = null; // null = not checked yet

function loadSdkSync(): boolean {
  if (sdkAvailable !== null) return sdkAvailable;
  try {
    // Use require() so Metro can tree-shake in Expo Go where the
    // native module won't resolve at runtime.
    const mod = require('@twilio/voice-react-native-sdk');
    TwilioVoice = mod.Voice;
    TwilioCall = mod.Call;
    sdkAvailable = true;
  } catch {
    console.log('[VoiceManager] Twilio SDK not available (Expo Go?)');
    sdkAvailable = false;
  }
  return sdkAvailable;
}

async function loadSdk(): Promise<boolean> {
  return loadSdkSync();
}

export class VoiceManager {
  private static instance: VoiceManager;
  private voice: InstanceType<typeof import('@twilio/voice-react-native-sdk').Voice> | null = null;
  private activeCall: InstanceType<typeof import('@twilio/voice-react-native-sdk').Call> | null = null;
  private pendingInvite: InstanceType<typeof import('@twilio/voice-react-native-sdk').CallInvite> | null = null;
  private listeners: Set<Listener> = new Set();
  private registered = false;
  private tokenRefreshTimer: ReturnType<typeof setTimeout> | null = null;
  private nativeAvailable = false;

  private constructor() {}

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
    if (!this.voice || !TwilioVoice) return;

    this.voice.on(TwilioVoice.Event.CallInvite, (invite: any) => {
      this.pendingInvite = invite;
      this.emit({
        type: 'incoming',
        payload: {
          callSid: invite.getCallSid?.() || '',
          from: invite.getFrom?.() || '',
          to: invite.getTo?.() || '',
        },
      });
      this.emit({ type: 'status', payload: 'ringing' });
    });

    this.voice.on(TwilioVoice.Event.CancelledCallInvite, () => {
      this.pendingInvite = null;
      this.emit({ type: 'status', payload: 'ready' });
    });

    this.voice.on(TwilioVoice.Event.Registered, () => {
      this.registered = true;
      this.emit({ type: 'status', payload: 'ready' });
    });

    this.voice.on(TwilioVoice.Event.Unregistered, () => {
      this.registered = false;
      this.emit({ type: 'status', payload: 'idle' });
    });
  }

  private attachCallListeners(call: any) {
    if (!TwilioCall) return;

    call.on(TwilioCall.Event.Connected, () => {
      this.emit({ type: 'callConnected' });
      this.emit({ type: 'status', payload: 'connected' });
    });

    call.on(TwilioCall.Event.Ringing, () => {
      this.emit({ type: 'callRinging' });
      this.emit({ type: 'status', payload: 'ringing' });
    });

    call.on(TwilioCall.Event.Disconnected, () => {
      this.activeCall = null;
      this.emit({ type: 'callDisconnected' });
      this.emit({ type: 'status', payload: 'disconnected' });
      setTimeout(() => this.emit({ type: 'status', payload: 'ready' }), 1500);
    });

    call.on(TwilioCall.Event.ConnectFailure, (error: unknown) => {
      this.activeCall = null;
      this.emit({ type: 'error', payload: error });
      this.emit({ type: 'status', payload: 'error' });
    });
  }

  /* ── Registration ──────────────────────────────────────────── */

  async register(): Promise<void> {
    // Load SDK on first register attempt
    const available = await loadSdk();
    if (!available || !TwilioVoice) {
      this.nativeAvailable = false;
      // Silently remain in idle — no error for Expo Go
      return;
    }

    this.nativeAvailable = true;

    if (!this.voice) {
      this.voice = new TwilioVoice();
      this.setupVoiceListeners();
    }

    try {
      const { getVoiceAccessToken } = await import('./accessToken');
      const token = await getVoiceAccessToken();
      await this.voice.register(token);
      this.scheduleTokenRefresh();
    } catch (err) {
      this.emit({ type: 'error', payload: err });
      this.emit({ type: 'status', payload: 'error' });
    }
  }

  async unregister(): Promise<void> {
    if (!this.voice || !this.nativeAvailable) return;
    try {
      const { getVoiceAccessToken } = await import('./accessToken');
      await this.voice.unregister(await getVoiceAccessToken());
      this.registered = false;
      if (this.tokenRefreshTimer) clearTimeout(this.tokenRefreshTimer);
    } catch {
      /* ignore */
    }
  }

  private scheduleTokenRefresh() {
    if (this.tokenRefreshTimer) clearTimeout(this.tokenRefreshTimer);
    this.tokenRefreshTimer = setTimeout(async () => {
      try {
        const { getVoiceAccessToken } = await import('./accessToken');
        const token = await getVoiceAccessToken();
        if (this.voice) {
          await this.voice.register(token);
        }
        this.scheduleTokenRefresh();
      } catch {
        /* will retry on next call */
      }
    }, 55 * 60 * 1000);
  }

  isRegistered(): boolean {
    return this.registered;
  }

  isNativeAvailable(): boolean {
    return this.nativeAvailable;
  }

  /* ── Outbound calls ────────────────────────────────────────── */

  async makeCall(to: string): Promise<boolean> {
    if (!this.nativeAvailable || !this.voice || this.activeCall) return false;
    this.emit({ type: 'status', payload: 'connecting' });

    try {
      const { getVoiceAccessToken } = await import('./accessToken');
      const token = await getVoiceAccessToken();
      const call = await this.voice.connect(token, { params: { To: to } });
      this.activeCall = call;
      this.attachCallListeners(call);
      return true;
    } catch (err) {
      this.emit({ type: 'error', payload: err });
      this.emit({ type: 'status', payload: 'error' });
      return false;
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

  getActiveCall() {
    return this.activeCall;
  }

  getPendingInvite() {
    return this.pendingInvite;
  }
}
