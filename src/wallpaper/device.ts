import { Skia, type SkImage, type SkTypefaceFontProvider } from '@shopify/react-native-skia';
import { Asset } from 'expo-asset';
import { Dimensions, PixelRatio } from 'react-native';

import { renderWallpaper, type WallpaperSpec } from './draw';
import type { WallpaperFontFamily } from './fonts';

// Keep in sync with WALLPAPER_FONT_FILES in ./fonts (Metro needs literal require paths).
const FONT_MODULES: Record<WallpaperFontFamily, number> = {
  Lora: require('../../assets/fonts/Lora_400Regular.ttf'),
  'Lora Italic': require('../../assets/fonts/Lora_400Regular_Italic.ttf'),
  'Playfair Display': require('../../assets/fonts/PlayfairDisplay_400Regular.ttf'),
  'Playfair Display Italic': require('../../assets/fonts/PlayfairDisplay_400Regular_Italic.ttf'),
  'Cormorant Garamond': require('../../assets/fonts/CormorantGaramond_500Medium.ttf'),
  Inter: require('../../assets/fonts/Inter_500Medium.ttf'),
};

let fontsPromise: Promise<SkTypefaceFontProvider> | null = null;

/**
 * Loads the wallpaper fonts into Skia once. Works in background tasks too: expo-asset copies the
 * bundled font files to real `file://` paths that Skia can read.
 */
export function loadWallpaperFonts(): Promise<SkTypefaceFontProvider> {
  fontsPromise ??= (async () => {
    const provider = Skia.TypefaceFontProvider.Make();
    await Promise.all(
      Object.entries(FONT_MODULES).map(async ([family, moduleId]) => {
        const asset = await Asset.fromModule(moduleId).downloadAsync();
        const data = await Skia.Data.fromURI(asset.localUri ?? asset.uri);
        const typeface = Skia.Typeface.MakeFreeTypeFaceFromData(data);
        if (!typeface) throw new Error(`Could not load the ${family} font`);
        provider.registerFont(typeface, family);
      })
    );
    return provider;
  })().catch((error) => {
    fontsPromise = null;
    throw error;
  });
  return fontsPromise;
}

export interface PixelSize {
  width: number;
  height: number;
}

let screenOverride: PixelSize | null = null;

/** Lets the Android module report the exact panel resolution when it knows better. */
export function setScreenPixelSize(size: PixelSize | null) {
  screenOverride = size;
}

/** The device screen in physical pixels, always in portrait orientation. */
export function getScreenPixelSize(): PixelSize {
  if (screenOverride) return screenOverride;
  const { width, height } = Dimensions.get('screen');
  const scale = PixelRatio.get();
  const w = Math.round(Math.min(width, height) * scale);
  const h = Math.round(Math.max(width, height) * scale);
  // Guard against odd values reported before the UI is attached (e.g. in a headless task).
  return w > 100 && h > 100 ? { width: w, height: h } : { width: 1080, height: 2400 };
}

export type DeviceWallpaperSpec = Omit<WallpaperSpec, 'width' | 'height'> & Partial<PixelSize>;

export async function renderWallpaperImage(spec: DeviceWallpaperSpec): Promise<SkImage> {
  const fonts = await loadWallpaperFonts();
  const size = getScreenPixelSize();
  return renderWallpaper(Skia, fonts, {
    ...spec,
    width: spec.width ?? size.width,
    height: spec.height ?? size.height,
  });
}
