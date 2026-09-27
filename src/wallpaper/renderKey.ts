import type { TextPosition } from './draw';

/** Bump when drawing changes in a way that should re-render wallpapers already on disk. */
export const RENDERER_VERSION = 1;

export interface RenderInputs {
  text: string;
  author: string;
  styleId: string;
  width: number;
  height: number;
  textPosition: TextPosition;
}

/** FNV-1a, enough to tell whether a saved wallpaper still matches what would be drawn now. */
function hash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

export function renderKey(inputs: RenderInputs): string {
  const { text, author, styleId, width, height, textPosition } = inputs;
  return hash([RENDERER_VERSION, text, author, styleId, width, height, textPosition].join('|'));
}
