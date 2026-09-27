/** Background styles the daily wallpaper rotates through. Visuals live in `src/wallpaper/styles.ts`. */
export const STYLE_IDS = ['dawn', 'sea-glass', 'sage', 'midnight', 'linen', 'dusk'] as const;

export type StyleId = (typeof STYLE_IDS)[number];

export interface StyleInfo {
  id: StyleId;
  name: string;
  description: string;
}

export const STYLES: readonly StyleInfo[] = [
  { id: 'dawn', name: 'Dawn', description: 'Soft peach to lavender gradient' },
  { id: 'sea-glass', name: 'Sea Glass', description: 'Misty mint and pale blue gradient' },
  { id: 'sage', name: 'Sage', description: 'Solid sage green with a gentle glow' },
  { id: 'midnight', name: 'Midnight', description: 'Deep navy with a fine grain' },
  { id: 'linen', name: 'Linen', description: 'Warm paper texture' },
  { id: 'dusk', name: 'Dusk', description: 'Plum to amber gradient with grain' },
];

export function isStyleId(value: unknown): value is StyleId {
  return typeof value === 'string' && (STYLE_IDS as readonly string[]).includes(value);
}

export function getStyleInfo(id: string): StyleInfo {
  return STYLES.find((s) => s.id === id) ?? STYLES[0]!;
}
