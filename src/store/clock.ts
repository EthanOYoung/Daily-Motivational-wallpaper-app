import { create } from 'zustand';

import { toDateKey } from '@/domain/dates';
import type { DateKey } from '@/domain/types';

interface ClockState {
  /** The current local calendar day; refreshed by `useDayTicker`. */
  today: DateKey;
  refresh: () => void;
}

export const useClockStore = create<ClockState>()((set, get) => ({
  today: toDateKey(new Date()),
  refresh: () => {
    const today = toDateKey(new Date());
    if (today !== get().today) set({ today });
  },
}));
