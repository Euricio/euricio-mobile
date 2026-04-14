import { useEffect, useCallback } from 'react';
import { useCallStore } from '../store/callStore';
import * as VoiceManager from '../lib/voice/voiceManager';
import { getAccessToken, clearTokenCache } from '../lib/voice/accessToken';
import { Config } from '../constants/config';

/**
 * Hook für Twilio Voice Integration.
 * Registriert sich automatisch bei Mount und erneuert Tokens.
 */
export function useVoice() {
  const callState = useCallStore((s) => s.callState);
  const direction = useCallStore((s) => s.direction);
  const remoteNumber = useCallStore((s) => s.remoteNumber);
  const muted = useCallStore((s) => s.muted);
  const onHold = useCallStore((s) => s.onHold);
  const callStartTime = useCallStore((s) => s.callStartTime);
  const callInvite = useCallStore((s) => s.callInvite);

  useEffect(() => {
    let tokenRefreshInterval: ReturnType<typeof setInterval>;

    async function init() {
      try {
        const token = await getAccessToken();
        await VoiceManager.register(token);

        // Token regelmäßig erneuern
        tokenRefreshInterval = setInterval(async () => {
          const newToken = await getAccessToken();
          await VoiceManager.register(newToken);
        }, Config.timeouts.tokenRefresh);
      } catch (error) {
        console.error('[useVoice] Registration failed:', error);
      }
    }

    if (Config.features.voipEnabled) {
      init();
    }

    return () => {
      clearInterval(tokenRefreshInterval);
      clearTokenCache();
    };
  }, []);

  const makeCall = useCallback(async (to: string) => {
    const token = await getAccessToken();
    await VoiceManager.connect(token, to);
  }, []);

  const acceptCall = useCallback(() => {
    if (callInvite) {
      VoiceManager.accept(callInvite);
    }
  }, [callInvite]);

  const rejectCall = useCallback(() => {
    if (callInvite) {
      VoiceManager.reject(callInvite);
    }
  }, [callInvite]);

  return {
    callState,
    direction,
    remoteNumber,
    muted,
    onHold,
    callStartTime,
    isInCall: callState === 'connected' || callState === 'reconnecting',
    isRinging: callState === 'ringing',
    makeCall,
    acceptCall,
    rejectCall,
    hangup: VoiceManager.hangup,
    toggleMute: () => VoiceManager.mute(!muted),
    toggleHold: () => VoiceManager.hold(!onHold),
    sendDigits: VoiceManager.sendDigits,
  };
}
