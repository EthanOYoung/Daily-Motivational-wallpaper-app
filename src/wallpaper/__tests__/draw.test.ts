/**
 * @jest-environment node
 *
 * Runs the real drawing code on CanvasKit (Skia compiled to WebAssembly), the same engine the
 * app uses on the phone.
 */
/// <reference types="node" />
/* eslint-disable @typescript-eslint/no-require-imports -- CanvasKit is loaded as CommonJS. */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import type { SkTypefaceFontProvider } from '@shopify/react-native-skia';

import { BUNDLED_QUOTES, MAX_QUOTE_LENGTH } from '@/domain/quotes';
import { STYLE_IDS } from '@/domain/styles';

import { contrastRatio, parseHex, type RGB } from '../color';
import { TEXT_ZONES, drawWallpaper, layoutWallpaperText, type SkiaApi } from '../draw';
import { WALLPAPER_FONT_FILES } from '../fonts';
import { renderKey } from '../renderKey';
import { getWallpaperStyle } from '../styles';

const root = path.resolve(__dirname, '../../..');
let Skia: SkiaApi;
let fonts: SkTypefaceFontProvider;

beforeAll(async () => {
  // jest-expo installs Expo's UTF-8-only TextDecoder; CanvasKit also needs UTF-16.
  globalThis.TextDecoder = require('node:util').TextDecoder;
  const ckDir = path.join(root, 'node_modules/canvaskit-wasm/bin/full');
  const CanvasKitInit = require(path.join(ckDir, 'canvaskit.js'));
  const CanvasKit = await CanvasKitInit({ locateFile: (file: string) => path.join(ckDir, file) });
  (globalThis as { CanvasKit?: unknown }).CanvasKit = CanvasKit;
  const { JsiSkApi } = require('@shopify/react-native-skia/lib/commonjs/skia/web/JsiSkia.js');
  Skia = JsiSkApi(CanvasKit);
  fonts = Skia.TypefaceFontProvider.Make();
  for (const [family, file] of Object.entries(WALLPAPER_FONT_FILES)) {
    const bytes = new Uint8Array(readFileSync(path.join(root, 'assets/fonts', file)));
    fonts.registerFont(Skia.Typeface.MakeFreeTypeFaceFromData(Skia.Data.fromBytes(bytes))!, family);
  }
}, 30_000);

const SCREENS = [
  { width: 750, height: 1334 }, // iPhone SE
  { width: 1179, height: 2556 }, // iPhone 15
  { width: 1080, height: 2400 }, // common Android
  { width: 1440, height: 3200 }, // large Android
];

const byLength = [...BUNDLED_QUOTES].sort((a, b) => a.text.length - b.text.length);
const QUOTES = [
  byLength[0]!,
  byLength[byLength.length - 1]!,
  {
    text: `${'Every small step counts. '.repeat(9)}`.slice(0, MAX_QUOTE_LENGTH).trim(),
    author: 'A very long custom author name here',
  },
];

describe('wallpaper text layout', () => {
  it.each(STYLE_IDS)('keeps the %s text inside the middle-to-lower band', (styleId) => {
    for (const screen of SCREENS) {
      for (const quote of QUOTES) {
        for (const textPosition of ['lower', 'center'] as const) {
          const layout = layoutWallpaperText(Skia, fonts, {
            text: quote.text,
            author: quote.author,
            styleId,
            textPosition,
            ...screen,
          });
          const zone = TEXT_ZONES[textPosition];
          expect(layout.block.y).toBeGreaterThanOrEqual(zone.top * screen.height - 0.5);
          expect(layout.block.y + layout.block.height).toBeLessThanOrEqual(
            zone.bottom * screen.height + 0.5
          );
          expect(layout.block.x).toBeGreaterThan(screen.width * 0.1);
          expect(layout.lineCount).toBeGreaterThan(0);
          expect(layout.fontSize).toBeGreaterThanOrEqual(screen.width * 0.036 - 0.01);
        }
      }
    }
  });

  it('uses bigger type for shorter quotes', () => {
    const size = (text: string) =>
      layoutWallpaperText(Skia, fonts, {
        text,
        author: 'X',
        styleId: 'dawn',
        width: 1179,
        height: 2556,
      }).fontSize;
    expect(size(byLength[0]!.text)).toBeGreaterThan(size(byLength[byLength.length - 1]!.text));
  });
});

describe('wallpaper contrast', () => {
  const W = 393;
  const H = 852;

  function averageBehindText(styleId: string): RGB {
    const layout = layoutWallpaperText(Skia, fonts, {
      text: 'The quick brown fox jumps over the lazy dog, twice over.',
      author: 'Test',
      styleId,
      width: W,
      height: H,
    });
    const surface = Skia.Surface.Make(W, H)!;
    drawWallpaper(Skia, surface.getCanvas(), fonts, {
      text: ' ',
      author: ' ',
      styleId,
      width: W,
      height: H,
    });
    const pixels = surface.makeImageSnapshot().readPixels() as Uint8Array;
    const { x, y, width, height } = layout.block;
    const sum: RGB = [0, 0, 0];
    let n = 0;
    for (let py = Math.floor(y); py < y + height; py += 2) {
      for (let px = Math.floor(x); px < x + width; px += 2) {
        const i = (py * W + px) * 4;
        sum[0] += pixels[i]!;
        sum[1] += pixels[i + 1]!;
        sum[2] += pixels[i + 2]!;
        n++;
      }
    }
    return [sum[0] / n, sum[1] / n, sum[2] / n];
  }

  it.each(STYLE_IDS)('%s keeps the quote and author readable', (styleId) => {
    const style = getWallpaperStyle(styleId);
    const background = averageBehindText(styleId);
    expect(contrastRatio(parseHex(style.quoteColor), background)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(parseHex(style.authorColor), background)).toBeGreaterThanOrEqual(3.5);
  });
});

describe('renderKey', () => {
  const base = {
    text: 'a',
    author: 'b',
    styleId: 'dawn',
    width: 1,
    height: 2,
    textPosition: 'lower' as const,
  };

  it('changes whenever something visible changes', () => {
    const key = renderKey(base);
    expect(renderKey({ ...base })).toBe(key);
    expect(renderKey({ ...base, text: 'c' })).not.toBe(key);
    expect(renderKey({ ...base, styleId: 'dusk' })).not.toBe(key);
    expect(renderKey({ ...base, width: 3 })).not.toBe(key);
    expect(renderKey({ ...base, textPosition: 'center' })).not.toBe(key);
  });
});

describe('colour helpers', () => {
  it('computes WCAG contrast', () => {
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 0);
    expect(contrastRatio(parseHex('#777'), parseHex('#777'))).toBe(1);
  });
});
