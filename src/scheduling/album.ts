import * as MediaLibrary from 'expo-media-library';

import type { DateKey } from '@/domain/types';
import { friendlyCopy } from '@/wallpaper/files';

/** The Photos album the iOS Shortcut reads from. */
export const ALBUM_TITLE = 'Daily Quote Wallpaper';

export type AlbumAccess = 'full' | 'limited' | 'denied' | 'undetermined';

function toAccess(response: MediaLibrary.PermissionResponse): AlbumAccess {
  if (response.granted) return response.accessPrivileges === 'limited' ? 'limited' : 'full';
  return response.canAskAgain ? 'undetermined' : 'denied';
}

/** Creating and filling an album needs full photo library access on iOS. */
export async function getAlbumAccess(): Promise<AlbumAccess> {
  return toAccess(await MediaLibrary.getPermissionsAsync(false));
}

export async function requestAlbumAccess(): Promise<AlbumAccess> {
  return toAccess(await MediaLibrary.requestPermissionsAsync(false));
}

/** Adds the wallpaper to the album, creating the album the first time. */
export async function saveToAlbum(uri: string, date: DateKey): Promise<void> {
  const copy = await friendlyCopy(uri, date);
  const album = await MediaLibrary.Album.get(ALBUM_TITLE);
  if (album) {
    await MediaLibrary.Asset.create(copy.uri, album);
  } else {
    const asset = await MediaLibrary.Asset.create(copy.uri);
    await MediaLibrary.Album.create(ALBUM_TITLE, [asset], false);
  }
}
