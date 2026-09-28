/** Skia in Node via CanvasKit (Skia compiled to WebAssembly), shared by the scripts here. */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

import type { SkTypefaceFontProvider } from '@shopify/react-native-skia';
import type { CanvasKit } from 'canvaskit-wasm';

import type { SkiaApi } from '../src/wallpaper/draw';
import { WALLPAPER_FONT_FILES } from '../src/wallpaper/fonts';

const require = createRequire(__filename);
export const root = path.resolve(__dirname, '..');

let canvasKit: Promise<CanvasKit> | null = null;

/** The raw CanvasKit API (the engine React Native Skia uses on the web). */
export function loadCanvasKit(): Promise<CanvasKit> {
  canvasKit ??= (async () => {
    const ckDir = path.join(root, 'node_modules/canvaskit-wasm/bin/full');
    const CanvasKitInit = require(path.join(ckDir, 'canvaskit.js'));
    return (await CanvasKitInit({
      locateFile: (file: string) => path.join(ckDir, file),
    })) as CanvasKit;
  })();
  return canvasKit;
}

/** The React Native Skia API on top of CanvasKit, so the app's drawing code runs unchanged. */
export async function loadSkia(): Promise<SkiaApi> {
  const CanvasKit = await loadCanvasKit();
  (globalThis as { CanvasKit?: unknown }).CanvasKit = CanvasKit;
  const { JsiSkApi } = require('@shopify/react-native-skia/lib/commonjs/skia/web/JsiSkia.js');
  return JsiSkApi(CanvasKit) as SkiaApi;
}

/** A bundled font file's bytes. */
export function fontBytes(file: string): Uint8Array {
  return new Uint8Array(readFileSync(path.join(root, 'assets/fonts', file)));
}

/** The wallpaper fonts, registered under the family names the renderer uses. */
export function loadFonts(Skia: SkiaApi): SkTypefaceFontProvider {
  const provider = Skia.TypefaceFontProvider.Make();
  for (const [family, file] of Object.entries(WALLPAPER_FONT_FILES)) {
    const typeface = Skia.Typeface.MakeFreeTypeFaceFromData(Skia.Data.fromBytes(fontBytes(file)));
    if (!typeface) throw new Error(`Could not load ${file}`);
    provider.registerFont(typeface, family);
  }
  return provider;
}
