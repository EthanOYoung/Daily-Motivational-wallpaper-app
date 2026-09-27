import { useEffect } from 'react';
import { AppState } from 'react-native';

import { registerBackgroundRefresh } from '@/scheduling/backgroundTask';
import { prepareWallpapers } from '@/scheduling/prepare';
import { useDailyStore } from '@/store/daily';
import { useSettingsStore } from '@/store/settings';

const SETTLE_MS = 500;

/**
 * Keeps the wallpaper files and the platform schedule in step with the app: on launch, when the
 * app returns to the foreground, and shortly after any setting or planned day changes.
 */
export function useWallpaperPipeline() {
  useEffect(() => {
    void prepareWallpapers('launch');
    void registerBackgroundRefresh();

    let timer: ReturnType<typeof setTimeout> | undefined;
    const soon = (reason: 'settings' | 'plan') => {
      clearTimeout(timer);
      timer = setTimeout(() => void prepareWallpapers(reason), SETTLE_MS);
    };

    const unsubscribeSettings = useSettingsStore.subscribe((state, previous) => {
      if (state !== previous) soon('settings');
    });
    const unsubscribePlan = useDailyStore.subscribe((state, previous) => {
      if (state.days !== previous.days) soon('plan');
    });
    const appState = AppState.addEventListener('change', (next) => {
      if (next === 'active') void prepareWallpapers('foreground');
    });

    return () => {
      clearTimeout(timer);
      unsubscribeSettings();
      unsubscribePlan();
      appState.remove();
    };
  }, []);
}
