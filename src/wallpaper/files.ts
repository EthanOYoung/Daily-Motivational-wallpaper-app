import type { SkImage } from '@shopify/react-native-skia';
import { Directory, File, Paths } from 'expo-file-system';

import type { DateKey } from '@/domain/types';

import { IMAGE_FORMAT } from './draw';

/**
 * Rendered wallpapers live in `Documents/Wallpapers/<YYYY-MM-DD>.jpg`, one per day.
 *
 * - Android: the native scheduler reads today's file from here at the chosen time.
 * - iOS: the folder is visible in the Files app (On My iPhone › Daily Quote Wallpaper), so a
 *   Shortcuts automation can pick up today's file by date even if the app hasn't run.
 */
export const WALLPAPER_FOLDER = 'Wallpapers';
export const JPEG_QUALITY = 92;

export function wallpaperDirectory(): Directory {
  return new Directory(Paths.document, WALLPAPER_FOLDER);
}

export function wallpaperFile(date: DateKey): File {
  return new File(wallpaperDirectory(), `${date}.jpg`);
}

export function writeWallpaperFile(date: DateKey, image: SkImage): File {
  const directory = wallpaperDirectory();
  if (!directory.exists) directory.create({ intermediates: true, idempotent: true });
  const file = wallpaperFile(date);
  file.create({ overwrite: true });
  file.write(image.encodeToBytes(IMAGE_FORMAT.JPEG, JPEG_QUALITY));
  return file;
}

export function fileExists(uri: string): boolean {
  if (!uri) return false;
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}

/** Removes wallpapers for days that are no longer needed. */
export function pruneWallpaperFiles(keep: ReadonlySet<DateKey>): void {
  const directory = wallpaperDirectory();
  if (!directory.exists) return;
  for (const entry of directory.list()) {
    const match = /^(\d{4}-\d{2}-\d{2})\.jpg$/.exec(entry.name);
    if (entry instanceof File && match && !keep.has(match[1]!)) {
      try {
        entry.delete();
      } catch {
        // Another task may have removed it already.
      }
    }
  }
}

/** A copy with a friendly name for saving or sharing, e.g. "Daily Quote 2026-09-28.jpg". */
export async function friendlyCopy(uri: string, date: DateKey): Promise<File> {
  const copy = new File(Paths.cache, `Daily Quote ${date}.jpg`);
  if (copy.exists) copy.delete();
  await new File(uri).copy(copy);
  return copy;
}
