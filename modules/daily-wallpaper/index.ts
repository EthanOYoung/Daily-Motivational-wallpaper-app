import DailyWallpaperModule from './src/DailyWallpaperModule';

export * from './src/DailyWallpaper.types';

/** The native module, or `null` on iOS, web and in Expo Go. */
export const DailyWallpaper = DailyWallpaperModule;

export function isDailyWallpaperAvailable(): boolean {
  return DailyWallpaperModule != null;
}
