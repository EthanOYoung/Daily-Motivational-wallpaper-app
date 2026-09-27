import { Platform } from 'react-native';

import type { DateKey } from '@/domain/types';
import { useSettingsStore } from '@/store/settings';
import { setScreenPixelSize } from '@/wallpaper/device';

import {
  DailyWallpaper,
  type ApplyOutcome,
  type DailyWallpaperStatus,
} from '../../modules/daily-wallpaper';

/** True in Android builds that include the native wallpaper module (not Expo Go). */
export const canSetWallpaper = Platform.OS === 'android' && DailyWallpaper != null;

/** Uses the panel's exact pixel size for rendering, which `Dimensions` can round. */
export function applyNativeScreenSize() {
  if (!DailyWallpaper) return;
  try {
    const size = DailyWallpaper.getScreenSize();
    if (size.width > 0 && size.height > 0) setScreenPixelSize(size);
  } catch {
    // Keep the Dimensions-based size.
  }
}

/** Pushes the current time and target to the native scheduler and re-arms the daily alarm. */
export async function syncAndroidSchedule(): Promise<DailyWallpaperStatus | null> {
  if (!DailyWallpaper) return null;
  const { autoApply, dailyTime, wallpaperTarget } = useSettingsStore.getState();
  return DailyWallpaper.configureAsync({
    enabled: autoApply,
    hour: dailyTime.hour,
    minute: dailyTime.minute,
    target: wallpaperTarget,
  });
}

/** Sets today's wallpaper if the change time has passed and it isn't showing yet. */
export async function applyTodayIfDue(): Promise<ApplyOutcome | null> {
  if (!DailyWallpaper) return null;
  return DailyWallpaper.applyTodayIfDueAsync();
}

/** "Set now": applies a day's wallpaper immediately, whatever the time. */
export async function setWallpaperNow(uri: string, date: DateKey): Promise<void> {
  if (!DailyWallpaper) throw new Error('Setting the wallpaper needs the Android app build');
  const { wallpaperTarget } = useSettingsStore.getState();
  await DailyWallpaper.setWallpaperAsync(uri, wallpaperTarget, date);
}

export function getAndroidStatus(): DailyWallpaperStatus | null {
  if (!DailyWallpaper) return null;
  try {
    return DailyWallpaper.getStatus();
  } catch {
    return null;
  }
}

// A tiny external store so screens can show the scheduler's latest status.
let statusSnapshot: DailyWallpaperStatus | null = null;
let statusLoaded = false;
const statusListeners = new Set<() => void>();

export function readAndroidStatus(): DailyWallpaperStatus | null {
  if (!statusLoaded) {
    statusSnapshot = getAndroidStatus();
    statusLoaded = true;
  }
  return statusSnapshot;
}

export function refreshAndroidStatus() {
  statusSnapshot = getAndroidStatus();
  statusLoaded = true;
  statusListeners.forEach((listener) => listener());
}

export function subscribeAndroidStatus(listener: () => void): () => void {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

export async function openExactAlarmSettings(): Promise<boolean> {
  if (!DailyWallpaper) return false;
  return DailyWallpaper.openExactAlarmSettingsAsync();
}
