import type {
  SkCanvas,
  SkImage,
  SkParagraph,
  SkTypefaceFontProvider,
  Skia,
} from '@shopify/react-native-skia';

import { AUTHOR_FONT } from './fonts';
import { getWallpaperStyle, type Background, type WallpaperStyle } from './styles';

/** The Skia API object: the native one on the phone, a CanvasKit-backed one in Node. */
export type SkiaApi = typeof Skia;

// Numeric values of the Skia enums used here. Keeping them local means this module has no runtime
// dependency on the React Native package, so the Node sample renderer can use it unchanged.
const TEXT_ALIGN_CENTER = 2;
const TILE_CLAMP = 0;
const TILE_REPEAT = 1;
const FILTER_NEAREST = 0;
const MIPMAP_NONE = 0;
const BLEND_SCREEN = 14;
const BLEND_OVERLAY = 15;
export const IMAGE_FORMAT = { JPEG: 3, PNG: 4 } as const;

export type TextPosition = 'center' | 'lower';

export interface WallpaperSpec {
  text: string;
  author: string;
  styleId: string;
  width: number;
  height: number;
  textPosition?: TextPosition;
}

export interface TextLayout {
  fontSize: number;
  lineCount: number;
  /** Rectangle the text block occupies, in canvas pixels. */
  block: { x: number; y: number; width: number; height: number };
  /** Vertical band the text is allowed to use. */
  zone: { top: number; bottom: number };
}

/**
 * The band the text may occupy, as fractions of the height. It sits in the middle-to-lower part of
 * the screen so the lock screen clock and widgets (top) and shortcuts (bottom) don't cover it.
 */
export const TEXT_ZONES: Record<TextPosition, { top: number; bottom: number; center: number }> = {
  lower: { top: 0.44, bottom: 0.8, center: 0.62 },
  center: { top: 0.36, bottom: 0.74, center: 0.55 },
};

const COLUMN_WIDTH = 0.78;
const LINE_HEIGHT = 1.34;

function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex.slice(0, 7)}${a}`;
}

/** Largest comfortable font size for a quote of this length, as a fraction of the width. */
function maxFontFraction(length: number): number {
  return Math.min(0.074, Math.max(0.046, 0.08 - 0.00017 * length));
}

function buildQuote(
  Skia: SkiaApi,
  fonts: SkTypefaceFontProvider,
  style: WallpaperStyle,
  text: string,
  fontSize: number
): SkParagraph {
  return Skia.ParagraphBuilder.Make({ textAlign: TEXT_ALIGN_CENTER }, fonts)
    .pushStyle({
      color: Skia.Color(style.quoteColor),
      fontFamilies: [style.quoteFont],
      fontSize,
      heightMultiplier: LINE_HEIGHT,
      halfLeading: true,
    })
    .addText(text)
    .build();
}

function buildAuthor(
  Skia: SkiaApi,
  fonts: SkTypefaceFontProvider,
  style: WallpaperStyle,
  author: string,
  fontSize: number
): SkParagraph {
  return Skia.ParagraphBuilder.Make({ textAlign: TEXT_ALIGN_CENTER, maxLines: 2 }, fonts)
    .pushStyle({
      color: Skia.Color(style.authorColor),
      fontFamilies: [AUTHOR_FONT],
      fontSize,
      letterSpacing: fontSize * 0.14,
      heightMultiplier: 1.3,
      halfLeading: true,
    })
    .addText(author.toUpperCase())
    .build();
}

/**
 * Narrows the text column as far as possible without adding a line, which evens out line
 * lengths (no lonely last word) the way CSS `text-wrap: balance` does.
 */
function balanceWidth(paragraph: SkParagraph, maxWidth: number): number {
  paragraph.layout(maxWidth);
  const lines = paragraph.getLineMetrics().length;
  if (lines <= 1) return Math.min(maxWidth, Math.ceil(paragraph.getLongestLine()) + 2);
  let lo = maxWidth * 0.55;
  let hi = maxWidth;
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    paragraph.layout(mid);
    if (paragraph.getLineMetrics().length > lines) lo = mid;
    else hi = mid;
  }
  paragraph.layout(hi);
  return hi;
}

interface Measured {
  layout: TextLayout;
  quote: SkParagraph;
  author: SkParagraph;
  authorSize: number;
  gap: number;
}

function measure(
  Skia: SkiaApi,
  fonts: SkTypefaceFontProvider,
  spec: WallpaperSpec,
  style: WallpaperStyle
): Measured {
  const { width: W, height: H } = spec;
  const zoneSpec = TEXT_ZONES[spec.textPosition ?? 'lower'];
  const zone = { top: zoneSpec.top * H, bottom: zoneSpec.bottom * H };
  const columnWidth = W * COLUMN_WIDTH;
  const minFont = W * 0.036;
  let fontSize = W * maxFontFraction(spec.text.length);

  for (;;) {
    const quote = buildQuote(Skia, fonts, style, spec.text, fontSize);
    const quoteWidth = balanceWidth(quote, columnWidth);
    const authorSize = Math.min(W * 0.03, Math.max(W * 0.024, fontSize * 0.38));
    const author = buildAuthor(Skia, fonts, style, spec.author, authorSize);
    author.layout(columnWidth);
    const gap = fontSize * 0.85;
    const height = quote.getHeight() + gap * 2 + author.getHeight();

    if (height <= zone.bottom - zone.top || fontSize <= minFont) {
      const centered = zoneSpec.center * H - height / 2;
      const y = Math.max(zone.top, Math.min(centered, zone.bottom - height));
      return {
        layout: {
          fontSize,
          lineCount: quote.getLineMetrics().length,
          block: { x: (W - quoteWidth) / 2, y, width: quoteWidth, height },
          zone,
        },
        quote,
        author,
        authorSize,
        gap,
      };
    }
    fontSize = Math.max(minFont, fontSize * 0.94);
  }
}

function gradientPoints(Skia: SkiaApi, angle: number, W: number, H: number) {
  const rad = (angle * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  const half = (Math.abs(W * dx) + Math.abs(H * dy)) / 2;
  return [
    Skia.Point(W / 2 - dx * half, H / 2 - dy * half),
    Skia.Point(W / 2 + dx * half, H / 2 + dy * half),
  ] as const;
}

function drawBackground(
  Skia: SkiaApi,
  canvas: SkCanvas,
  background: Background,
  W: number,
  H: number
) {
  const paint = Skia.Paint();
  if (background.kind === 'solid') {
    paint.setColor(Skia.Color(background.color));
  } else {
    const [start, end] = gradientPoints(Skia, background.angle, W, H);
    paint.setShader(
      Skia.Shader.MakeLinearGradient(
        start,
        end,
        background.colors.map((c) => Skia.Color(c)),
        background.positions ?? null,
        TILE_CLAMP
      )
    );
  }
  canvas.drawRect(Skia.XYWHRect(0, 0, W, H), paint);
}

function drawRadial(
  Skia: SkiaApi,
  canvas: SkCanvas,
  cx: number,
  cy: number,
  radius: number,
  colors: string[],
  positions: number[],
  W: number,
  H: number
) {
  const paint = Skia.Paint();
  paint.setShader(
    Skia.Shader.MakeRadialGradient(
      Skia.Point(cx, cy),
      radius,
      colors.map((c) => Skia.Color(c)),
      positions,
      TILE_CLAMP
    )
  );
  canvas.drawRect(Skia.XYWHRect(0, 0, W, H), paint);
}

const NOISE_TILE = 256;
const noiseTiles = new Map<string, SkImage>();

/**
 * A seamless tile of fractal noise. Computing noise for every pixel of a phone-sized canvas is
 * slow, so a small tile is made once and repeated across the wallpaper.
 */
function noiseTile(Skia: SkiaApi, frequency: number, octaves: number): SkImage | null {
  const cacheKey = `${frequency.toFixed(4)}:${octaves}`;
  const cached = noiseTiles.get(cacheKey);
  if (cached) return cached;
  const surface = Skia.Surface.Make(NOISE_TILE, NOISE_TILE);
  if (!surface) return null;
  const paint = Skia.Paint();
  paint.setShader(
    Skia.Shader.MakeFractalNoise(frequency, frequency, octaves, 11, NOISE_TILE, NOISE_TILE)
  );
  surface.getCanvas().drawRect(Skia.XYWHRect(0, 0, NOISE_TILE, NOISE_TILE), paint);
  surface.flush();
  const tile = surface.makeImageSnapshot();
  noiseTiles.set(cacheKey, tile);
  return tile;
}

function drawGrain(
  Skia: SkiaApi,
  canvas: SkCanvas,
  grain: NonNullable<WallpaperStyle['grain']>,
  W: number,
  H: number
) {
  // Frequency is tied to the canvas width so the grain looks the same on every screen density.
  const frequency = (0.9 * (1080 / W)) / grain.scale;
  const tile = noiseTile(Skia, frequency, grain.octaves ?? 2);
  if (!tile) return;
  // Grey noise. The colour filter runs after the paint's alpha, so the grain opacity is set in the
  // matrix itself. Overlay lightens and darkens around mid-grey without shifting the overall
  // colour; screen adds a faint lift that reads as grain on dark backgrounds.
  const toGrey = Skia.ColorFilter.MakeMatrix([
    0.33, 0.33, 0.33, 0, 0,
    0.33, 0.33, 0.33, 0, 0,
    0.33, 0.33, 0.33, 0, 0,
    0, 0, 0, 0, grain.opacity,
  ]); // prettier-ignore
  const paint = Skia.Paint();
  paint.setShader(tile.makeShaderOptions(TILE_REPEAT, TILE_REPEAT, FILTER_NEAREST, MIPMAP_NONE));
  paint.setColorFilter(toGrey);
  paint.setBlendMode(grain.tone === 'light' ? BLEND_SCREEN : BLEND_OVERLAY);
  canvas.drawRect(Skia.XYWHRect(0, 0, W, H), paint);
}

/** Computes where the text goes without drawing anything. */
export function layoutWallpaperText(
  Skia: SkiaApi,
  fonts: SkTypefaceFontProvider,
  spec: WallpaperSpec
): TextLayout {
  return measure(Skia, fonts, spec, getWallpaperStyle(spec.styleId)).layout;
}

/** Draws the full wallpaper (background, texture and text) onto `canvas`. */
export function drawWallpaper(
  Skia: SkiaApi,
  canvas: SkCanvas,
  fonts: SkTypefaceFontProvider,
  spec: WallpaperSpec
): TextLayout {
  const { width: W, height: H } = spec;
  const style = getWallpaperStyle(spec.styleId);

  drawBackground(Skia, canvas, style.background, W, H);
  if (style.glow) {
    const { color, x, y, radius, opacity } = style.glow;
    drawRadial(
      Skia,
      canvas,
      x * W,
      y * H,
      radius * H,
      [withAlpha(color, opacity), withAlpha(color, 0)],
      [0, 1],
      W,
      H
    );
  }
  if (style.vignette) {
    const { color, opacity } = style.vignette;
    const radius = Math.hypot(W, H) * 0.6;
    drawRadial(
      Skia,
      canvas,
      W / 2,
      H * 0.55,
      radius,
      [withAlpha(color, 0), withAlpha(color, 0), withAlpha(color, opacity)],
      [0, 0.55, 1],
      W,
      H
    );
  }
  if (style.grain) drawGrain(Skia, canvas, style.grain, W, H);

  const { layout, quote, author, gap } = measure(Skia, fonts, spec, style);
  const { block } = layout;
  quote.paint(canvas, block.x, block.y);

  const ruleY = block.y + quote.getHeight() + gap;
  const ruleWidth = W * 0.07;
  const rule = Skia.Paint();
  rule.setColor(Skia.Color(style.ruleColor));
  canvas.drawRect(
    Skia.XYWHRect(
      (W - ruleWidth) / 2,
      ruleY - Math.max(1, W * 0.0012),
      ruleWidth,
      Math.max(2, W * 0.0024)
    ),
    rule
  );

  const columnWidth = W * COLUMN_WIDTH;
  author.paint(canvas, (W - columnWidth) / 2, ruleY + gap);
  return layout;
}

/** Renders a wallpaper into a CPU-backed image (works in background tasks, no GPU needed). */
export function renderWallpaper(
  Skia: SkiaApi,
  fonts: SkTypefaceFontProvider,
  spec: WallpaperSpec
): SkImage {
  const surface = Skia.Surface.Make(spec.width, spec.height);
  if (!surface) throw new Error(`Could not create a ${spec.width}x${spec.height} drawing surface`);
  drawWallpaper(Skia, surface.getCanvas(), fonts, spec);
  surface.flush();
  return surface.makeImageSnapshot();
}
