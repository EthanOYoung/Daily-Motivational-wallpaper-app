export const CATEGORY_IDS = [
  'self-love',
  'happiness',
  'ambition',
  'family',
  'resilience',
  'gratitude',
  'mindfulness',
  'confidence',
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export interface Quote {
  /** Stable id. Bundled quotes look like `gratitude-004`, custom ones `custom-<uuid>`. */
  id: string;
  text: string;
  author: string;
  category: CategoryId;
  /** The work the quote comes from, when known. */
  source?: string;
  isCustom?: boolean;
}

/** Local calendar date formatted as `YYYY-MM-DD`. */
export type DateKey = string;

export interface TimeOfDay {
  hour: number;
  minute: number;
}

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'string' && (CATEGORY_IDS as readonly string[]).includes(value);
}
