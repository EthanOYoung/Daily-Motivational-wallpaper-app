import type { StyleId } from '@/domain/styles';

import type { WallpaperFontFamily } from './fonts';

export type Background =
  /** `angle` in degrees: 180 runs top to bottom, 135 runs top-left to bottom-right. */
  | { kind: 'linear'; colors: string[]; positions?: number[]; angle: number }
  | { kind: 'solid'; color: string };

export interface WallpaperStyle {
  id: StyleId;
  background: Background;
  /** Soft light spot, centred as fractions of the canvas, radius as a fraction of the height. */
  glow?: { color: string; x: number; y: number; radius: number; opacity: number };
  /** Darkens the corners slightly to frame the text. */
  vignette?: { color: string; opacity: number };
  /**
   * Film grain or paper texture. `light` grain lifts dark backgrounds; `dark` grain is overlaid on
   * light ones. Larger `scale` gives coarser texture; more `octaves` gives a fibrous, paper feel.
   */
  grain?: { opacity: number; tone: 'light' | 'dark'; scale: number; octaves?: number };
  quoteFont: WallpaperFontFamily;
  quoteColor: string;
  authorColor: string;
  /** Short rule between the quote and the author. */
  ruleColor: string;
}

export const WALLPAPER_STYLES: Record<StyleId, WallpaperStyle> = {
  dawn: {
    id: 'dawn',
    background: {
      kind: 'linear',
      colors: ['#F7D5C3', '#F1CDD3', '#DCCDEB'],
      positions: [0, 0.5, 1],
      angle: 165,
    },
    glow: { color: '#FFF3EA', x: 0.3, y: 0.18, radius: 0.45, opacity: 0.55 },
    grain: { opacity: 0.12, tone: 'dark', scale: 1 },
    quoteFont: 'Playfair Display Italic',
    quoteColor: '#3F2B45',
    authorColor: '#6B5570',
    ruleColor: '#8E7593',
  },
  'sea-glass': {
    id: 'sea-glass',
    background: {
      kind: 'linear',
      colors: ['#DDF0E8', '#CFE4EC', '#B7D1E2'],
      positions: [0, 0.55, 1],
      angle: 200,
    },
    glow: { color: '#F4FBF8', x: 0.75, y: 0.2, radius: 0.5, opacity: 0.5 },
    grain: { opacity: 0.1, tone: 'dark', scale: 1 },
    quoteFont: 'Lora',
    quoteColor: '#1E3A44',
    authorColor: '#46666F',
    ruleColor: '#6F8E96',
  },
  sage: {
    id: 'sage',
    background: { kind: 'solid', color: '#58705E' },
    glow: { color: '#7F9582', x: 0.5, y: 0.12, radius: 0.42, opacity: 0.55 },
    vignette: { color: '#1F2B23', opacity: 0.3 },
    grain: { opacity: 0.05, tone: 'light', scale: 1 },
    quoteFont: 'Cormorant Garamond',
    quoteColor: '#FBF8F0',
    authorColor: '#E3E8DD',
    ruleColor: '#C9D3C4',
  },
  midnight: {
    id: 'midnight',
    background: { kind: 'solid', color: '#131A2B' },
    glow: { color: '#26345A', x: 0.5, y: 0.6, radius: 0.55, opacity: 0.8 },
    vignette: { color: '#05070D', opacity: 0.5 },
    grain: { opacity: 0.07, tone: 'light', scale: 1 },
    quoteFont: 'Lora Italic',
    quoteColor: '#F2EBDD',
    authorColor: '#B8B1A3',
    ruleColor: '#8C8578',
  },
  linen: {
    id: 'linen',
    background: { kind: 'solid', color: '#F1E9DB' },
    glow: { color: '#FBF7EF', x: 0.5, y: 0.4, radius: 0.6, opacity: 0.6 },
    vignette: { color: '#B9A98E', opacity: 0.25 },
    grain: { opacity: 0.32, tone: 'dark', scale: 2.8, octaves: 4 },
    quoteFont: 'Playfair Display',
    quoteColor: '#2D2923',
    authorColor: '#6A6154',
    ruleColor: '#A89B87',
  },
  dusk: {
    id: 'dusk',
    background: {
      kind: 'linear',
      colors: ['#2A1C3D', '#523058', '#80405A', '#B8674F'],
      positions: [0, 0.45, 0.8, 1],
      angle: 180,
    },
    glow: { color: '#E59A6B', x: 0.5, y: 1.05, radius: 0.45, opacity: 0.35 },
    grain: { opacity: 0.08, tone: 'light', scale: 1 },
    quoteFont: 'Lora',
    quoteColor: '#FFF3E4',
    authorColor: '#F0D2BE',
    ruleColor: '#D9A58B',
  },
};

export function getWallpaperStyle(id: string): WallpaperStyle {
  return WALLPAPER_STYLES[id as StyleId] ?? WALLPAPER_STYLES.dawn;
}
