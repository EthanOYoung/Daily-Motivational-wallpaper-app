/**
 * Draws the app icon and everything derived from it, so the design can be tweaked and redrawn:
 *
 *   npm run make:icons
 *
 * Writes to assets/images: the iOS icon with its dark and tinted variants, the Android adaptive
 * icon layers (background, foreground, monochrome), the splash image and the web favicon.
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';

import type { Canvas, CanvasKit, Typeface } from 'canvaskit-wasm';

import { fontBytes, loadCanvasKit, root } from './skia-node';

const SIZE = 1024;
/** Sage, as in the app's accent colour and the Sage wallpaper style. Top to bottom. */
const BACKGROUND = ['#6A8470', '#58705E', '#4C6352'];
const GLOW = '#95AA96';
const CREAM = '#FBF8F0';
const DARK_MARK = '#A9C6B2';
const MARK = '“'; // “ in Playfair Display
/** Height of the mark's ink as a share of the icon. */
const MARK_HEIGHT = 0.32;
/** Android adaptive icons show the middle 72dp of a 108dp canvas. */
const ADAPTIVE_VISIBLE = 72 / 108;
/** iOS-style corner radius for the splash and favicon. */
const CORNER = 0.2237;

type Draw = (canvas: Canvas, size: number) => void;

async function main() {
  const CK = await loadCanvasKit();
  const bytes = fontBytes('PlayfairDisplay_400Regular.ttf');
  const typeface = CK.Typeface.MakeTypefaceFromData(bytes.buffer as ArrayBuffer);
  if (!typeface) throw new Error('Could not load Playfair Display');

  const background: Draw = (canvas, size) => {
    const paint = new CK.Paint();
    paint.setShader(
      CK.Shader.MakeLinearGradient(
        [0, 0],
        [0, size],
        BACKGROUND.map((c) => CK.parseColorString(c)),
        null,
        CK.TileMode.Clamp
      )
    );
    canvas.drawRect(CK.XYWHRect(0, 0, size, size), paint);

    const [r, g, b] = CK.parseColorString(GLOW);
    const glow = new CK.Paint();
    glow.setShader(
      CK.Shader.MakeRadialGradient(
        [size * 0.5, size * 0.12],
        size * 0.62,
        [CK.Color4f(r!, g!, b!, 0.55), CK.Color4f(r!, g!, b!, 0)],
        null,
        CK.TileMode.Clamp
      )
    );
    canvas.drawRect(CK.XYWHRect(0, 0, size, size), glow);
  };

  const mark =
    (color: string, inkHeight = MARK_HEIGHT): Draw =>
    (canvas, size) =>
      drawCentred(CK, canvas, typeface, inkHeight * size, size / 2, size / 2, color);

  const icon: Draw = (canvas, size) => {
    background(canvas, size);
    mark(CREAM)(canvas, size);
  };

  const rounded =
    (draw: Draw): Draw =>
    (canvas, size) => {
      canvas.save();
      const radius = size * CORNER;
      canvas.clipRRect(
        CK.RRectXY(CK.XYWHRect(0, 0, size, size), radius, radius),
        CK.ClipOp.Intersect,
        true
      );
      draw(canvas, size);
      canvas.restore();
    };

  const write = (file: string, size: number, draw: Draw) => {
    const surface = CK.MakeSurface(size, size);
    if (!surface) throw new Error('Could not create a drawing surface');
    const canvas = surface.getCanvas();
    canvas.clear(CK.TRANSPARENT);
    draw(canvas, size);
    surface.flush();
    const png = surface.makeImageSnapshot().encodeToBytes();
    if (!png) throw new Error(`Could not encode ${file}`);
    writeFileSync(path.join(root, 'assets/images', file), png);
    surface.delete();
    console.log(`assets/images/${file}  ${size}×${size}`);
  };

  // iOS: full-bleed icon (the system rounds the corners), dark (mark on a transparent
  // background, shown over the system's dark backdrop) and tinted (grayscale on black).
  write('icon.png', SIZE, icon);
  write('icon-dark.png', SIZE, mark(DARK_MARK));
  write('icon-tinted.png', SIZE, (canvas, size) => {
    canvas.clear(CK.BLACK);
    mark('#FFFFFF')(canvas, size);
  });

  // Android adaptive icon: the launcher masks the layers, so keep the mark in the safe zone.
  write('android-icon-background.png', SIZE, background);
  write('android-icon-foreground.png', SIZE, mark(CREAM, MARK_HEIGHT * ADAPTIVE_VISIBLE));
  write('android-icon-monochrome.png', SIZE, mark('#FFFFFF', MARK_HEIGHT * ADAPTIVE_VISIBLE));

  // Splash screen and web favicon: the icon with rounded corners.
  write('splash-icon.png', SIZE, rounded(icon));
  write('favicon.png', 48, rounded(icon));
}

/** Draws `text` so its ink (not its line box) is centred on (cx, cy) with the given height. */
function drawCentred(
  CK: CanvasKit,
  canvas: Canvas,
  typeface: Typeface,
  inkHeight: number,
  cx: number,
  cy: number,
  color: string
) {
  const probe = new CK.Font(typeface, 100);
  const ids = probe.getGlyphIDs(MARK);
  const bounds = probe.getGlyphBounds(ids);
  const widths = probe.getGlyphWidths(ids);
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  let x = 0;
  ids.forEach((_, i) => {
    left = Math.min(left, x + bounds[i * 4]!);
    top = Math.min(top, bounds[i * 4 + 1]!);
    right = Math.max(right, x + bounds[i * 4 + 2]!);
    bottom = Math.max(bottom, bounds[i * 4 + 3]!);
    x += widths[i]!;
  });
  const scale = inkHeight / (bottom - top);
  const font = new CK.Font(typeface, 100 * scale);
  const paint = new CK.Paint();
  paint.setAntiAlias(true);
  paint.setColor(CK.parseColorString(color));
  canvas.drawText(
    MARK,
    cx - ((left + right) / 2) * scale,
    cy - ((top + bottom) / 2) * scale,
    paint,
    font
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
