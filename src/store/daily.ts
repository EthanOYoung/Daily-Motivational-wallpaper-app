import { Platform } from 'react-native';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { toDateKey } from '@/domain/dates';
import {
  EMPTY_PLAN,
  assignQuoteToDay,
  ensurePlan,
  regenerateDay,
  type PlanContext,
  type PlanState,
} from '@/domain/plan';
import { BUNDLED_QUOTES, buildQuotePool } from '@/domain/quotes';
import type { DateKey, Quote } from '@/domain/types';

import { useLibraryStore } from './library';
import { useSettingsStore } from './settings';
import { deviceStorage } from './storage';

/**
 * Days planned and pre-rendered ahead of time. iOS keeps a longer runway
 * because iOS rarely wakes the app in the background.
 */
export const PLAN_HORIZON_DAYS = Platform.OS === 'ios' ? 14 : 7;

interface DailyActions {
  /** Plans today plus the upcoming days using the current settings. */
  sync: (today?: DateKey) => void;
  /** Replaces the quote (and style) for a day with a fresh one. */
  regenerate: (date: DateKey) => void;
  /** Uses a specific quote for a day. */
  assign: (date: DateKey, quote: Quote) => void;
}

export type DailyState = PlanState & DailyActions;

function planContext(today: DateKey): PlanContext {
  const { selectedCategories, enabledStyles } = useSettingsStore.getState();
  const { customQuotes } = useLibraryStore.getState();
  return {
    today,
    horizon: PLAN_HORIZON_DAYS,
    pool: buildQuotePool(selectedCategories, customQuotes),
    styleIds: enabledStyles,
    catalog: [...BUNDLED_QUOTES, ...customQuotes],
  };
}

const planOf = (state: PlanState): PlanState => ({ used: state.used, days: state.days });

export const useDailyStore = create<DailyState>()(
  persist(
    (set, get) => ({
      ...EMPTY_PLAN,

      sync: (today = toDateKey(new Date())) => {
        const current = planOf(get());
        const next = ensurePlan(current, planContext(today));
        if (JSON.stringify(next) !== JSON.stringify(current)) set(next);
      },

      regenerate: (date) => {
        const today = toDateKey(new Date());
        set(regenerateDay(planOf(get()), date, planContext(today)));
      },

      assign: (date, quote) => {
        const context = planContext(toDateKey(new Date()));
        // Plan first so the day exists, then refill any later day that had the same quote.
        const planned = ensurePlan(planOf(get()), context);
        set(ensurePlan(assignQuoteToDay(planned, date, quote), context));
      },
    }),
    {
      name: 'daily-plan',
      version: 1,
      storage: deviceStorage,
      partialize: ({ used, days }) => ({ used, days }),
    }
  )
);

export function selectDay(date: DateKey) {
  return (state: DailyState) => state.days.find((d) => d.date === date);
}
