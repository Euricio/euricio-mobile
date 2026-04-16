import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useTwilioVoice, IncomingCallInfo } from './useTwilioVoice';
import { VoiceStatus } from './voiceManager';

interface VoiceContextType {
  /* Twilio Voice state */
  status: VoiceStatus;
  error: string | null;
  isMuted: boolean;
  isOnHold: boolean;
  callDuration: number;
  isInitialized: boolean;
  incomingCall: IncomingCallInfo | null;
  makeCall: (toNumber: string) => Promise<void>;
  hangUp: () => Promise<void>;
  toggleMute: () => Promise<void>;
  toggleHold: () => Promise<void>;
  sendDigits: (digits: string) => Promise<void>;
  acceptIncoming: () => Promise<void>;
  rejectIncoming: () => void;
  retry: () => void;

  /* Dialer state */
  dialerNumber: string;
  dialerExpanded: boolean;
  setDialerNumber: (n: string) => void;
  setDialerExpanded: (e: boolean) => void;
  dialNumber: (phone: string) => void;
  pendingDial: string | null;
  clearPendingDial: () => void;
}

const VoiceContext = createContext<VoiceContextType | null>(null);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const voice = useTwilioVoice();

  const [dialerNumber, setDialerNumber] = useState('');
  const [dialerExpanded, setDialerExpanded] = useState(false);
  const [pendingDial, setPendingDial] = useState<string | null>(null);

  const dialNumber = useCallback((phone: string) => {
    setDialerNumber(phone);
    setDialerExpanded(true);
    setPendingDial(phone);
  }, []);

  const clearPendingDial = useCallback(() => {
    setPendingDial(null);
  }, []);

  return (
    <VoiceContext.Provider
      value={{
        ...voice,
        dialerNumber,
        dialerExpanded,
        setDialerNumber,
        setDialerExpanded,
        dialNumber,
        pendingDial,
        clearPendingDial,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice(): VoiceContextType {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error('useVoice must be used inside VoiceProvider');
  return ctx;
}
