import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { DateKey } from '@/domain/types';

import { deviceStorage } from './storage';

export interface RenderRecord {
  /** Fingerprint of everything that went into the image (see `renderKey`). */
  key: string;
  uri: string;
  renderedAt: number;
}

interface RenderState {
  records: Record<DateKey, RenderRecord>;
  setRecord: (date: DateKey, record: RenderRecord) => void;
  /** Drops records for days not in `keep`. */
  prune: (keep: ReadonlySet<DateKey>) => void;
}

/** Remembers which wallpaper file on disk belongs to which day. */
export const useRenderStore = create<RenderState>()(
  persist(
    (set) => ({
      records: {},
      setRecord: (date, record) => set((s) => ({ records: { ...s.records, [date]: record } })),
      prune: (keep) =>
        set((s) => ({
          records: Object.fromEntries(Object.entries(s.records).filter(([date]) => keep.has(date))),
        })),
    }),
    {
      name: 'renders',
      version: 1,
      storage: deviceStorage,
      partialize: ({ records }) => ({ records }),
    }
  )
);
