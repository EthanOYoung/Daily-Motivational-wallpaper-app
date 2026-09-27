import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STYLE_IDS, type StyleId } from '@/domain/styles';
import { CATEGORY_IDS, type CategoryId, type TimeOfDay } from '@/domain/types';
import type { TextPosition } from '@/wallpaper/draw';

import { deviceStorage } from './storage';

export type ThemePreference = 'system' | 'light' | 'dark';

interface SettingsValues {
  selectedCategories: CategoryId[];
  themePreference: ThemePreference;
  /** When the new wallpaper takes over each day. */
  dailyTime: TimeOfDay;
  enabledStyles: StyleId[];
  /** Where the quote sits on the wallpaper. */
  textPosition: TextPosition;
}

interface SettingsActions {
  toggleCategory: (id: CategoryId) => void;
  setCategories: (ids: CategoryId[]) => void;
  setThemePreference: (preference: ThemePreference) => void;
  setDailyTime: (time: TimeOfDay) => void;
  setTextPosition: (position: TextPosition) => void;
}

export type SettingsState = SettingsValues & SettingsActions;

export const DEFAULT_SETTINGS: SettingsValues = {
  selectedCategories: [...CATEGORY_IDS],
  themePreference: 'system',
  dailyTime: { hour: 6, minute: 0 },
  enabledStyles: [...STYLE_IDS],
  textPosition: 'lower',
};

/** Keeps category order stable (library order) no matter how they were toggled. */
const ordered = (ids: Iterable<CategoryId>) => {
  const set = new Set(ids);
  return CATEGORY_IDS.filter((id) => set.has(id));
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      toggleCategory: (id) =>
        set((state) => {
          const selected = new Set(state.selectedCategories);
          if (selected.has(id)) {
            // At least one category must stay on, otherwise there is nothing to show.
            if (selected.size === 1) return state;
            selected.delete(id);
          } else {
            selected.add(id);
          }
          return { selectedCategories: ordered(selected) };
        }),

      setCategories: (ids) => {
        if (ids.length > 0) set({ selectedCategories: ordered(ids) });
      },

      setThemePreference: (themePreference) => set({ themePreference }),

      setDailyTime: (dailyTime) => set({ dailyTime }),

      setTextPosition: (textPosition) => set({ textPosition }),
    }),
    {
      name: 'settings',
      version: 1,
      storage: deviceStorage,
      partialize: ({
        selectedCategories,
        themePreference,
        dailyTime,
        enabledStyles,
        textPosition,
      }) => ({ selectedCategories, themePreference, dailyTime, enabledStyles, textPosition }),
    }
  )
);
