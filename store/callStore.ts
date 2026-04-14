import { create } from 'zustand';
import { CallInvite } from '@twilio/voice-react-native-sdk';
import { CallState, CallDirection, initialCallInfo } from '../lib/voice/callState';

interface CallStoreState {
  callState: CallState;
  direction: CallDirection | null;
  remoteNumber: string | null;
  callStartTime: number | null;
  muted: boolean;
  onHold: boolean;
  callInvite: CallInvite | null;

  setCallState: (state: CallState) => void;
  setDirection: (direction: CallDirection) => void;
  setRemoteNumber: (number: string) => void;
  setCallStartTime: (time: number) => void;
  setMuted: (muted: boolean) => void;
  setOnHold: (onHold: boolean) => void;
  setCallInvite: (invite: CallInvite | null) => void;
  reset: () => void;
}

export const useCallStore = create<CallStoreState>((set) => ({
  ...initialCallInfo,
  callInvite: null,

  setCallState: (callState) => set({ callState }),
  setDirection: (direction) => set({ direction }),
  setRemoteNumber: (remoteNumber) => set({ remoteNumber }),
  setCallStartTime: (callStartTime) => set({ callStartTime }),
  setMuted: (muted) => set({ muted }),
  setOnHold: (onHold) => set({ onHold }),
  setCallInvite: (callInvite) => set({ callInvite }),
  reset: () => set({ ...initialCallInfo, callInvite: null }),
}));
