import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

import type { DateKey } from '@/domain/types';
import { friendlyCopy } from '@/wallpaper/files';

export class PermissionDeniedError extends Error {
  constructor() {
    super('Photo library permission was not granted');
  }
}

/** Saves the wallpaper to the photo library (asks for add-only access). */
export async function saveWallpaperToPhotos(uri: string, date: DateKey): Promise<void> {
  const permission = await MediaLibrary.requestPermissionsAsync(true);
  if (!permission.granted) throw new PermissionDeniedError();
  const copy = await friendlyCopy(uri, date);
  await MediaLibrary.Asset.create(copy.uri);
}

/** Opens the system share sheet with the wallpaper image. */
export async function shareWallpaper(uri: string, date: DateKey): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device');
  }
  const copy = await friendlyCopy(uri, date);
  await Sharing.shareAsync(copy.uri, {
    mimeType: 'image/jpeg',
    UTI: 'public.jpeg',
    dialogTitle: 'Share wallpaper',
  });
}
