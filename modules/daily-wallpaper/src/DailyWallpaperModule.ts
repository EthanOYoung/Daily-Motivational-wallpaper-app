import { NativeModule, requireOptionalNativeModule } from 'expo';

import type {
  ApplyOutcome,
  DailyWallpaperStatus,
  ScheduleOptions,
  ScreenSize,
  WallpaperTarget,
} from './DailyWallpaper.types';

declare class DailyWallpaperNativeModule extends NativeModule<Record<string, never>> {
  getScreenSize(): ScreenSize;
  configureAsync(options: ScheduleOptions): Promise<DailyWallpaperStatus>;
  applyTodayIfDueAsync(): Promise<ApplyOutcome>;
  setWallpaperAsync(uri: string, target: WallpaperTarget, date: string): Promise<void>;
  getStatus(): DailyWallpaperStatus;
  openExactAlarmSettingsAsync(): Promise<boolean>;
}

/**
 * The Android wallpaper module, or `null` where it isn't available (iOS, web, Expo Go).
 * It is only compiled into Android development and release builds.
 */
export default requireOptionalNativeModule<DailyWallpaperNativeModule>('DailyWallpaper');
