import { create } from 'zustand';

export type BreakType = 'short' | 'lunch';

interface BreakState {
  isOnBreak: boolean;
  breakType: BreakType | null;
  breakStartedAt: number | null; // timestamp ms
  startBreak: (type: BreakType) => void;
  endBreak: () => { type: BreakType; elapsedMinutes: number } | null;
  reset: () => void;
}

export const useBreakStore = create<BreakState>((set, get) => ({
  isOnBreak: false,
  breakType: null,
  breakStartedAt: null,

  startBreak: (type) =>
    set({
      isOnBreak: true,
      breakType: type,
      breakStartedAt: Date.now(),
    }),

  endBreak: () => {
    const { breakType, breakStartedAt } = get();
    if (!breakType || !breakStartedAt) return null;

    const elapsedMs = Date.now() - breakStartedAt;
    const elapsedMinutes = Math.max(1, Math.round(elapsedMs / 60000));

    set({
      isOnBreak: false,
      breakType: null,
      breakStartedAt: null,
    });

    return { type: breakType, elapsedMinutes };
  },

  reset: () =>
    set({
      isOnBreak: false,
      breakType: null,
      breakStartedAt: null,
    }),
}));
