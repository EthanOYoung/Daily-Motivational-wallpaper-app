import type { SkImage } from '@shopify/react-native-skia';
import { useEffect, useState } from 'react';

import type { DayEntry } from '@/domain/plan';
import { useSettingsStore } from '@/store/settings';
import { renderKey } from '@/wallpaper/renderKey';
import { ensureDayRendered, loadImage, renderInputsFor } from '@/wallpaper/renderDay';

export interface DayWallpaper {
  image: SkImage | null;
  uri: string | null;
  loading: boolean;
  error: Error | null;
}

// A few recent images so switching back and forth doesn't re-decode files.
const imageCache = new Map<string, SkImage>();
function remember(key: string, image: SkImage) {
  imageCache.set(key, image);
  while (imageCache.size > 4) imageCache.delete(imageCache.keys().next().value!);
}

/** The rendered wallpaper for a day, drawing it on first use. */
export function useDayWallpaper(entry: DayEntry | undefined): DayWallpaper {
  // Subscribe so a text position change recomputes the key below.
  useSettingsStore((s) => s.textPosition);
  const key = entry ? renderKey(renderInputsFor(entry)) : null;
  const [state, setState] = useState<DayWallpaper>(() => ({
    image: key ? (imageCache.get(key) ?? null) : null,
    uri: null,
    loading: !!entry,
    error: null,
  }));

  useEffect(() => {
    if (!entry || !key) return;
    let cancelled = false;
    const cached = imageCache.get(key);
    setState((s) => ({ ...s, image: cached ?? s.image, loading: !cached, error: null }));

    // Let the loading state paint first: drawing runs synchronously on the JS thread.
    const timer = setTimeout(async () => {
      try {
        const rendered = await ensureDayRendered(entry);
        const image = rendered.image ?? cached ?? (await loadImage(rendered.uri));
        if (image) remember(rendered.key, image);
        if (!cancelled) setState({ image, uri: rendered.uri, loading: false, error: null });
      } catch (error) {
        if (!cancelled) {
          setState((s) => ({ ...s, loading: false, error: error as Error }));
        }
      }
    }, 16);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // `entry` changes identity on every plan sync; the key captures what matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}
