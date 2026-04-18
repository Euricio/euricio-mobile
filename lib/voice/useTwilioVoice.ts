import { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceManager, VoiceStatus, VoiceEvent } from './voiceManager';

export interface IncomingCallInfo {
  callSid: string;
  from: string;
  to: string;
  accepted: boolean;
}

interface UseTwilioVoiceReturn {
  status: VoiceStatus;
  error: string | null;
  isMuted: boolean;
  isOnHold: boolean;
  callDuration: number;
  isInitialized: boolean;
  incomingCall: IncomingCallInfo | null;
  /** Returns true if the call was actually placed, false if the SDK wasn't ready. */
  makeCall: (toNumber: string) => Promise<boolean>;
  hangUp: () => Promise<void>;
  toggleMute: () => Promise<void>;
  toggleHold: () => Promise<void>;
  sendDigits: (digits: string) => Promise<void>;
  acceptIncoming: () => Promise<void>;
  rejectIncoming: () => void;
  retry: () => void;
}

export function useTwilioVoice(): UseTwilioVoiceReturn {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCallInfo | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const managerRef = useRef<VoiceManager>(VoiceManager.getInstance());

  const startTimer = useCallback(() => {
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const manager = managerRef.current;

    const unsubscribe = manager.subscribe((event: VoiceEvent) => {
      switch (event.type) {
        case 'status':
          setStatus(event.payload as VoiceStatus);
          if (event.payload === 'ready') {
            setIsInitialized(true);
            setError(null);
          }
          if (event.payload === 'disconnected') {
            stopTimer();
            setIsMuted(false);
            setIsOnHold(false);
            setIncomingCall(null);
          }
          break;

        case 'error':
          setError(
            event.payload instanceof Error
              ? event.payload.message
              : String(event.payload || 'Unbekannter Fehler')
          );
          break;

        case 'incoming':
          {
            const info = event.payload as {
              callSid: string;
              from: string;
              to: string;
            };
            setIncomingCall({
              callSid: info.callSid || '',
              from: info.from || '',
              to: info.to || '',
              accepted: false,
            });
          }
          break;

        case 'callConnected':
          startTimer();
          setIncomingCall((prev) =>
            prev ? { ...prev, accepted: true } : null
          );
          break;

        case 'callDisconnected':
          stopTimer();
          setIncomingCall(null);
          break;

        case 'mute':
          setIsMuted(event.payload as boolean);
          break;

        case 'hold':
          setIsOnHold(event.payload as boolean);
          break;
      }
    });

    // Register on mount
    manager.register();

    return () => {
      unsubscribe();
      stopTimer();
    };
  }, [startTimer, stopTimer]);

  const makeCall = useCallback(async (toNumber: string): Promise<boolean> => {
    setError(null);
    setIsMuted(false);
    setIsOnHold(false);
    setCallDuration(0);
    const started = await managerRef.current.makeCall(toNumber);
    // If SDK loaded lazily during makeCall(), mark as initialized so the UI
    // stops showing the greyed-out state for subsequent calls.
    if (managerRef.current.isNativeAvailable()) {
      setIsInitialized(true);
    }
    return started;
  }, []);

  const hangUp = useCallback(async () => {
    await managerRef.current.hangup();
    stopTimer();
  }, [stopTimer]);

  const toggleMute = useCallback(async () => {
    await managerRef.current.toggleMute();
  }, []);

  const toggleHold = useCallback(async () => {
    await managerRef.current.toggleHold();
  }, []);

  const sendDigits = useCallback(async (digits: string) => {
    await managerRef.current.sendDigits(digits);
  }, []);

  const acceptIncoming = useCallback(async () => {
    await managerRef.current.acceptCall();
  }, []);

  const rejectIncoming = useCallback(() => {
    managerRef.current.rejectCall();
    setIncomingCall(null);
  }, []);

  const retry = useCallback(() => {
    setError(null);
    setStatus('idle');
    managerRef.current.register();
  }, []);

  return {
    status,
    error,
    isMuted,
    isOnHold,
    callDuration,
    isInitialized,
    incomingCall,
    makeCall,
    hangUp,
    toggleMute,
    toggleHold,
    sendDigits,
    acceptIncoming,
    rejectIncoming,
    retry,
  };
}
