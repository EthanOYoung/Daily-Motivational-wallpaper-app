import type { DateKey } from '@/domain/types';

// The web preview has no photo library.
export const ALBUM_TITLE = 'Daily Quote Wallpaper';

export type AlbumAccess = 'full' | 'limited' | 'denied' | 'undetermined';

export async function getAlbumAccess(): Promise<AlbumAccess> {
  return 'denied';
}

export async function requestAlbumAccess(): Promise<AlbumAccess> {
  return 'denied';
}

export async function saveToAlbum(_uri: string, _date: DateKey): Promise<void> {
  throw new Error('Photo albums are only available in the mobile app');
}
