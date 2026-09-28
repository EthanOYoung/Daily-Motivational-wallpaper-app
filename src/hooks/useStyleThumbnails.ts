import type { SkImage } from '@shopify/react-native-skia';
import { useEffect, useState } from 'react';

import { STYLE_IDS, type StyleId } from '@/domain/styles';
import { renderWallpaperImage } from '@/wallpaper/device';
import type { TextPosition } from '@/wallpaper/draw';

export interface ThumbnailText {
  text: string;
  author: string;
}

/** Shown on the style thumbnails; public domain (Robert Browning, "Rabbi Ben Ezra"). */
export const SAMPLE_TEXT: ThumbnailText = {
  text: 'The best is yet to be.',
  author: 'Robert Browning',
};
/** Just the background, e.g. for small swatches. */
export const NO_TEXT: ThumbnailText = { text: '', author: '' };

const cache = new Map<string, SkImage>();
const cacheKey = (
  id: StyleId,
  position: TextPosition,
  width: number,
  height: number,
  sample: ThumbnailText
) => `${id}:${position}:${width}x${height}:${sample.text}:${sample.author}`;

type Thumbnails = Partial<Record<StyleId, SkImage>>;

function cached(
  position: TextPosition,
  width: number,
  height: number,
  sample: ThumbnailText
): Thumbnails {
  const images: Thumbnails = {};
  for (const id of STYLE_IDS) {
    const image = cache.get(cacheKey(id, position, width, height, sample));
    if (image) images[id] = image;
  }
  return images;
}

/**
 * Small renders of every background style, drawn with the real wallpaper renderer so they match
 * what ends up on the phone. Drawn one at a time so scrolling stays smooth.
 */
export function useStyleThumbnails(
  width: number,
  height: number,
  position: TextPosition,
  sample: ThumbnailText = SAMPLE_TEXT
): Thumbnails {
  const [images, setImages] = useState<Thumbnails>(() => cached(position, width, height, sample));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const id of STYLE_IDS) {
        const key = cacheKey(id, position, width, height, sample);
        let image = cache.get(key);
        if (!image) {
          await new Promise((resolve) => setTimeout(resolve, 16));
          if (cancelled) return;
          image = await renderWallpaperImage({
            ...sample,
            styleId: id,
            textPosition: position,
            width,
            height,
          });
          cache.set(key, image);
        }
        if (cancelled) return;
        const drawn = image;
        setImages((current) => (current[id] === drawn ? current : { ...current, [id]: drawn }));
      }
    })().catch(() => {
      // Thumbnails are decoration; the picker still works without them.
    });
    return () => {
      cancelled = true;
    };
  }, [width, height, position, sample]);

  return images;
}
