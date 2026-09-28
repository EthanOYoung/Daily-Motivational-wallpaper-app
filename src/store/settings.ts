import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STYLE_IDS, type StyleId } from '@/domain/styles';
import { CATEGORY_IDS, type CategoryId, type TimeOfDay } from '@/domain/types';
import type { TextPosition } from '@/wallpaper/draw';

import type { WallpaperTarget } from '../../modules/daily-wallpaper';

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
  /** Android: set the wallpaper automatically at `dailyTime`. */
  autoApply: boolean;
  /** Android: which screens get the wallpaper. */
  wallpaperTarget: WallpaperTarget;
  /** iOS: also save each day's wallpaper to the "Daily Quote Wallpaper" album. */
  saveToAlbum: boolean;
  /** Set once the first-launch introduction has been completed. */
  onboarded: boolean;
}

interface SettingsActions {
  toggleCategory: (id: CategoryId) => void;
  setCategories: (ids: CategoryId[]) => void;
  setThemePreference: (preference: ThemePreference) => void;
  setDailyTime: (time: TimeOfDay) => void;
  setTextPosition: (position: TextPosition) => void;
  setAutoApply: (enabled: boolean) => void;
  setWallpaperTarget: (target: WallpaperTarget) => void;
  setSaveToAlbum: (enabled: boolean) => void;
  /** Turns a background style on or off; the last one can't be turned off. */
  toggleStyle: (id: StyleId) => void;
  setOnboarded: (onboarded: boolean) => void;
}

export type SettingsState = SettingsValues & SettingsActions;

export const DEFAULT_SETTINGS: SettingsValues = {
  selectedCategories: [...CATEGORY_IDS],
  themePreference: 'system',
  dailyTime: { hour: 6, minute: 0 },
  enabledStyles: [...STYLE_IDS],
  textPosition: 'lower',
  autoApply: true,
  wallpaperTarget: 'both',
  saveToAlbum: false,
  onboarded: false,
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

      setAutoApply: (autoApply) => set({ autoApply }),

      setWallpaperTarget: (wallpaperTarget) => set({ wallpaperTarget }),

      setSaveToAlbum: (saveToAlbum) => set({ saveToAlbum }),

      toggleStyle: (id) =>
        set((state) => {
          const enabled = new Set(state.enabledStyles);
          if (enabled.has(id)) {
            if (enabled.size === 1) return state;
            enabled.delete(id);
          } else {
            enabled.add(id);
          }
          return { enabledStyles: STYLE_IDS.filter((style) => enabled.has(style)) };
        }),

      setOnboarded: (onboarded) => set({ onboarded }),
    }),
    {
      name: 'settings',
      version: 2,
      storage: deviceStorage,
      migrate: (persisted, version) => {
        const values = (persisted ?? {}) as Partial<SettingsValues>;
        // Installs from before the introduction existed have already set the app up.
        return version < 2 ? { ...values, onboarded: true } : values;
      },
      // Persist every value, none of the actions.
      partialize: (state): SettingsValues => {
        const values = {} as Record<string, unknown>;
        for (const key of Object.keys(DEFAULT_SETTINGS)) {
          values[key] = state[key as keyof SettingsValues];
        }
        return values as unknown as SettingsValues;
      },
    }
  )
);
