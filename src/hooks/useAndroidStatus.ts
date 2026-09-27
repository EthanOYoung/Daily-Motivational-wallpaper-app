import { useFocusEffect } from 'expo-router';
import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import {
  readAndroidStatus,
  refreshAndroidStatus,
  subscribeAndroidStatus,
} from '@/scheduling/android';

import type { DailyWallpaperStatus } from '../../modules/daily-wallpaper';

/** The native scheduler's status, refreshed on focus, on resume and after each prepare run. */
export function useAndroidStatus(): { status: DailyWallpaperStatus | null; refresh: () => void } {
  const status = useSyncExternalStore(subscribeAndroidStatus, readAndroidStatus, readAndroidStatus);

  useFocusEffect(refreshAndroidStatus);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshAndroidStatus();
    });
    return () => subscription.remove();
  }, []);

  return { status, refresh: refreshAndroidStatus };
}
