import { Platform } from 'react-native';

import { toDateKey } from '@/domain/dates';
import type { DateKey } from '@/domain/types';
import { useDailyStore } from '@/store/daily';
import { waitForStoresHydrated } from '@/store/hydration';
import { useRenderStore } from '@/store/renders';
import { useSchedulingStore, type PrepareReason } from '@/store/scheduling';
import { useSettingsStore } from '@/store/settings';
import { pruneWallpaperFiles } from '@/wallpaper/files';
import { ensureDayRendered, isDayRendered } from '@/wallpaper/renderDay';

import { getAlbumAccess, saveToAlbum } from './album';
import {
  applyNativeScreenSize,
  applyTodayIfDue,
  refreshAndroidStatus,
  syncAndroidSchedule,
} from './android';

export interface PrepareResult {
  rendered: number;
  error: string | null;
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** iOS: puts today's wallpaper into the Photos album once per version of the image. */
async function saveTodayToAlbumIfNeeded(today: DateKey) {
  if (!useSettingsStore.getState().saveToAlbum) return;
  if ((await getAlbumAccess()) !== 'full') return;
  const entry = useDailyStore.getState().days.find((d) => d.date === today);
  if (!entry) return;
  const rendered = await ensureDayRendered(entry);
  if (useSchedulingStore.getState().albumSaves[today] === rendered.key) return;
  await saveToAlbum(rendered.uri, today);
  useSchedulingStore.getState().recordAlbumSave(today, rendered.key);
}

async function prepare(reason: PrepareReason): Promise<PrepareResult> {
  await waitForStoresHydrated();
  if (Platform.OS === 'web') return { rendered: 0, error: null };
  applyNativeScreenSize();

  const today = toDateKey(new Date());
  useDailyStore.getState().sync(today);
  const upcoming = useDailyStore.getState().days.filter((d) => d.date >= today);

  let rendered = 0;
  let error: string | null = null;
  try {
    // Today first (it's on screen soonest), then the following days. A short pause between
    // images keeps the UI responsive because drawing runs on the JavaScript thread.
    for (const day of upcoming) {
      if (isDayRendered(day)) continue;
      await ensureDayRendered(day);
      rendered++;
      if (reason !== 'background') await pause(40);
    }

    const keep = new Set(upcoming.map((d) => d.date));
    pruneWallpaperFiles(keep);
    useRenderStore.getState().prune(keep);
    useSchedulingStore.getState().pruneAlbumSaves(keep);

    if (Platform.OS === 'android') {
      await syncAndroidSchedule();
      await applyTodayIfDue();
      refreshAndroidStatus();
    } else if (Platform.OS === 'ios') {
      await saveTodayToAlbumIfNeeded(today);
    }
  } catch (caught) {
    error = caught instanceof Error ? caught.message : String(caught);
  }
  useSchedulingStore.getState().recordPrepared(reason, error);
  return { rendered, error };
}

let running: Promise<PrepareResult> | null = null;
let followUp: Promise<PrepareResult> | null = null;
let followUpReason: PrepareReason | null = null;

/**
 * Renders the upcoming days' wallpapers, removes old ones and hands today's to the platform
 * (Android: sets it if due and re-arms the daily alarm; iOS: saves it to the album if enabled).
 *
 * Safe to call often: runs one at a time. Calls made while a run is in progress share a single
 * follow-up run, and their promise resolves once that run (with the latest settings) finishes.
 */
export function prepareWallpapers(reason: PrepareReason): Promise<PrepareResult> {
  if (!running) {
    running = prepare(reason).finally(() => {
      running = null;
    });
    return running;
  }
  followUpReason = reason;
  followUp ??= running
    .catch(() => undefined)
    .then(() => {
      const next = followUpReason ?? reason;
      followUp = null;
      followUpReason = null;
      return prepareWallpapers(next);
    });
  return followUp;
}
