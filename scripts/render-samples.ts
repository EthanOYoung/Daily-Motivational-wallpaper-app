/**
 * Renders sample wallpapers on your computer with the exact drawing code the app uses, via
 * CanvasKit (Skia compiled to WebAssembly). Handy for reviewing styles without a phone.
 *
 *   npm run render:samples            # writes JPEGs + a contact sheet to ./samples
 *   npm run render:samples -- --check # also fails if any text is hard to read
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

import type { SkTypefaceFontProvider } from '@shopify/react-native-skia';

import { STYLE_IDS } from '../src/domain/styles';
import { contrastRatio, parseHex, type RGB } from '../src/wallpaper/color';
import {
  IMAGE_FORMAT,
  drawWallpaper,
  type SkiaApi,
  type TextPosition,
} from '../src/wallpaper/draw';
import { WALLPAPER_FONT_FILES } from '../src/wallpaper/fonts';
import { getWallpaperStyle } from '../src/wallpaper/styles';

const require = createRequire(__filename);
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'samples');
const check = process.argv.includes('--check');

const SCREENS = [
  { name: 'iphone', width: 1179, height: 2556 },
  { name: 'android', width: 1080, height: 2400 },
];

const QUOTES = [
  { text: 'Fall seven times, stand up eight.', author: 'Japanese proverb' },
  {
    text: 'To love oneself is the beginning of a lifelong romance.',
    author: 'Oscar Wilde',
  },
  {
    text: 'If a man does not keep pace with his companions, perhaps it is because he hears a different drummer. Let him step to the music which he hears, however measured or far away.',
    author: 'Henry David Thoreau',
  },
  {
    text: "Rest is not idleness, and to lie sometimes on the grass under trees on a summer's day, listening to the murmur of the water, or watching the clouds float across the sky, is by no means a waste of time.",
    author: 'John Lubbock',
  },
];

async function loadSkia(): Promise<SkiaApi> {
  const ckDir = path.join(root, 'node_modules/canvaskit-wasm/bin/full');
  const CanvasKitInit = require(path.join(ckDir, 'canvaskit.js'));
  const CanvasKit = await CanvasKitInit({ locateFile: (file: string) => path.join(ckDir, file) });
  (globalThis as { CanvasKit?: unknown }).CanvasKit = CanvasKit;
  const { JsiSkApi } = require('@shopify/react-native-skia/lib/commonjs/skia/web/JsiSkia.js');
  return JsiSkApi(CanvasKit) as SkiaApi;
}

function loadFonts(Skia: SkiaApi): SkTypefaceFontProvider {
  const provider = Skia.TypefaceFontProvider.Make();
  for (const [family, file] of Object.entries(WALLPAPER_FONT_FILES)) {
    const bytes = new Uint8Array(readFileSync(path.join(root, 'assets/fonts', file)));
    const typeface = Skia.Typeface.MakeFreeTypeFaceFromData(Skia.Data.fromBytes(bytes));
    if (!typeface) throw new Error(`Could not load ${file}`);
    provider.registerFont(typeface, family);
  }
  return provider;
}

/** Average background colour behind the text block, read from a text-free render. */
function averageColor(
  pixels: Uint8Array,
  width: number,
  rect: { x: number; y: number; width: number; height: number }
): RGB {
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let y = Math.floor(rect.y); y < rect.y + rect.height; y += 4) {
    for (let x = Math.floor(rect.x); x < rect.x + rect.width; x += 4) {
      const i = (y * width + x) * 4;
      r += pixels[i]!;
      g += pixels[i + 1]!;
      b += pixels[i + 2]!;
      n++;
    }
  }
  return [r / n, g / n, b / n];
}

async function main() {
  const Skia = await loadSkia();
  const fonts = loadFonts(Skia);
  mkdirSync(outDir, { recursive: true });
  const problems: string[] = [];
  const thumbs: { file: string; label: string }[] = [];

  for (const screen of SCREENS) {
    for (const [i, styleId] of STYLE_IDS.entries()) {
      const quote = QUOTES[i % QUOTES.length]!;
      for (const textPosition of ['lower'] as TextPosition[]) {
        const started = Date.now();
        const surface = Skia.Surface.Make(screen.width, screen.height)!;
        const layout = drawWallpaper(Skia, surface.getCanvas(), fonts, {
          ...quote,
          styleId,
          width: screen.width,
          height: screen.height,
          textPosition,
        });
        surface.flush();
        const image = surface.makeImageSnapshot();
        const jpeg = image.encodeToBytes(IMAGE_FORMAT.JPEG, 92);
        const elapsed = Date.now() - started;
        const file = `${screen.name}-${styleId}.jpg`;
        writeFileSync(path.join(outDir, file), jpeg);
        thumbs.push({ file, label: `${styleId} (${screen.name})` });

        // Contrast: render the background alone and compare it with the text colours.
        const bgSurface = Skia.Surface.Make(screen.width, screen.height)!;
        drawWallpaper(Skia, bgSurface.getCanvas(), fonts, {
          ...quote,
          text: ' ',
          author: ' ',
          styleId,
          width: screen.width,
          height: screen.height,
          textPosition,
        });
        const pixels = bgSurface.makeImageSnapshot().readPixels() as Uint8Array;
        const bg = averageColor(pixels, screen.width, layout.block);
        const style = getWallpaperStyle(styleId);
        const quoteContrast = contrastRatio(parseHex(style.quoteColor), bg);
        const authorContrast = contrastRatio(parseHex(style.authorColor), bg);
        const pct = (v: number) => `${Math.round((v / screen.height) * 100)}%`;
        console.log(
          `${file.padEnd(24)} ${String(elapsed).padStart(5)}ms ${(jpeg.length / 1024).toFixed(0).padStart(5)}KB  font ${layout.fontSize.toFixed(0)}px x${layout.lineCount} lines  text ${pct(layout.block.y)}–${pct(layout.block.y + layout.block.height)}  contrast quote ${quoteContrast.toFixed(1)} author ${authorContrast.toFixed(1)}`
        );
        if (quoteContrast < 4.5)
          problems.push(`${file}: quote contrast ${quoteContrast.toFixed(2)} < 4.5`);
        if (authorContrast < 3.5)
          problems.push(`${file}: author contrast ${authorContrast.toFixed(2)} < 3.5`);
      }
    }
  }

  // Contact sheet of the iPhone renders for a quick side-by-side look.
  const cols = 3;
  const thumbW = 393;
  const thumbH = 852;
  const pad = 24;
  const iphone = thumbs.filter((t) => t.file.startsWith('iphone'));
  const rows = Math.ceil(iphone.length / cols);
  const sheet = Skia.Surface.Make(
    cols * thumbW + (cols + 1) * pad,
    rows * thumbH + (rows + 1) * pad
  )!;
  const canvas = sheet.getCanvas();
  canvas.drawColor(Skia.Color('#E9E5DF'));
  iphone.forEach((t, i) => {
    const img = Skia.Image.MakeImageFromEncoded(
      Skia.Data.fromBytes(new Uint8Array(readFileSync(path.join(outDir, t.file))))
    )!;
    const x = pad + (i % cols) * (thumbW + pad);
    const y = pad + Math.floor(i / cols) * (thumbH + pad);
    canvas.drawImageRect(
      img,
      Skia.XYWHRect(0, 0, img.width(), img.height()),
      Skia.XYWHRect(x, y, thumbW, thumbH),
      Skia.Paint()
    );
  });
  sheet.flush();
  writeFileSync(
    path.join(outDir, 'contact-sheet.jpg'),
    sheet.makeImageSnapshot().encodeToBytes(IMAGE_FORMAT.JPEG, 90)
  );
  console.log(
    `\nWrote ${thumbs.length} samples and contact-sheet.jpg to ${path.relative(root, outDir)}/`
  );

  if (problems.length) {
    console.log(`\nReadability problems:\n  ${problems.join('\n  ')}`);
    if (check) process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
