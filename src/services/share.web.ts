import type { DateKey } from '@/domain/types';

// The web build is a preview only: there is no photo library or share sheet for local files.

export class PermissionDeniedError extends Error {
  constructor() {
    super('Photo library permission was not granted');
  }
}

export async function saveWallpaperToPhotos(_uri: string, _date: DateKey): Promise<void> {
  throw new Error('Saving to Photos is only available in the mobile app');
}

export async function shareWallpaper(_uri: string, _date: DateKey): Promise<void> {
  throw new Error('Sharing is only available in the mobile app');
}
