import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { DateKey } from '@/domain/types';

import { deviceStorage } from './storage';

export type PrepareReason = 'launch' | 'foreground' | 'settings' | 'plan' | 'background' | 'manual';

interface SchedulingState {
  /** iOS: which day's wallpaper (by render key) was last saved to the album. */
  albumSaves: Record<DateKey, string>;
  lastPreparedAt: number | null;
  lastPrepareReason: PrepareReason | null;
  lastPrepareError: string | null;
  lastBackgroundRunAt: number | null;
  recordAlbumSave: (date: DateKey, key: string) => void;
  recordPrepared: (reason: PrepareReason, error: string | null) => void;
  pruneAlbumSaves: (keep: ReadonlySet<DateKey>) => void;
}

export const useSchedulingStore = create<SchedulingState>()(
  persist(
    (set) => ({
      albumSaves: {},
      lastPreparedAt: null,
      lastPrepareReason: null,
      lastPrepareError: null,
      lastBackgroundRunAt: null,
      recordAlbumSave: (date, key) =>
        set((s) => ({ albumSaves: { ...s.albumSaves, [date]: key } })),
      recordPrepared: (reason, error) =>
        set((s) => ({
          lastPreparedAt: Date.now(),
          lastPrepareReason: reason,
          lastPrepareError: error,
          lastBackgroundRunAt: reason === 'background' ? Date.now() : s.lastBackgroundRunAt,
        })),
      pruneAlbumSaves: (keep) =>
        set((s) => ({
          albumSaves: Object.fromEntries(
            Object.entries(s.albumSaves).filter(([date]) => keep.has(date))
          ),
        })),
    }),
    {
      name: 'scheduling',
      version: 1,
      storage: deviceStorage,
      partialize: ({
        albumSaves,
        lastPreparedAt,
        lastPrepareReason,
        lastPrepareError,
        lastBackgroundRunAt,
      }) => ({
        albumSaves,
        lastPreparedAt,
        lastPrepareReason,
        lastPrepareError,
        lastBackgroundRunAt,
      }),
    }
  )
);
