import { Skia, type SkImage } from '@shopify/react-native-skia';
import { Platform } from 'react-native';

import type { DayEntry } from '@/domain/plan';
import type { DateKey } from '@/domain/types';
import { useRenderStore } from '@/store/renders';
import { useSettingsStore } from '@/store/settings';

import { getScreenPixelSize, renderWallpaperImage } from './device';
import { fileExists, writeWallpaperFile } from './files';
import { renderKey, type RenderInputs } from './renderKey';

export interface RenderedDay {
  date: DateKey;
  uri: string;
  key: string;
  /** Present when the image was just drawn; otherwise load it from `uri` if needed. */
  image: SkImage | null;
}

export function renderInputsFor(entry: DayEntry): RenderInputs {
  const { width, height } = getScreenPixelSize();
  return {
    text: entry.quote.text,
    author: entry.quote.author,
    styleId: entry.styleId,
    width,
    height,
    textPosition: useSettingsStore.getState().textPosition,
  };
}

export function isDayRendered(entry: DayEntry): boolean {
  const record = useRenderStore.getState().records[entry.date];
  return !!record && record.key === renderKey(renderInputsFor(entry)) && fileExists(record.uri);
}

const inFlight = new Map<string, Promise<RenderedDay>>();

/** Returns the day's wallpaper file, drawing it first if it is missing or out of date. */
export function ensureDayRendered(entry: DayEntry): Promise<RenderedDay> {
  const inputs = renderInputsFor(entry);
  const key = renderKey(inputs);
  const record = useRenderStore.getState().records[entry.date];
  if (record && record.key === key && fileExists(record.uri)) {
    return Promise.resolve({ date: entry.date, uri: record.uri, key, image: null });
  }

  const flightKey = `${entry.date}:${key}`;
  const pending = inFlight.get(flightKey);
  if (pending) return pending;

  const job = (async () => {
    const image = await renderWallpaperImage(inputs);
    if (Platform.OS === 'web') {
      // The web preview has no file system; keep the image in memory only.
      return { date: entry.date, uri: '', key, image };
    }
    const file = writeWallpaperFile(entry.date, image);
    useRenderStore.getState().setRecord(entry.date, { key, uri: file.uri, renderedAt: Date.now() });
    return { date: entry.date, uri: file.uri, key, image };
  })().finally(() => inFlight.delete(flightKey));
  inFlight.set(flightKey, job);
  return job;
}

export async function loadImage(uri: string): Promise<SkImage | null> {
  const data = await Skia.Data.fromURI(uri);
  return Skia.Image.MakeImageFromEncoded(data);
}
