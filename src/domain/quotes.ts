import rawQuotes from '@/data/quotes.json';

import { isCategoryId, type CategoryId, type Quote } from './types';

/** Longest quote text the wallpaper layout is designed for. */
export const MAX_QUOTE_LENGTH = 220;
export const MAX_AUTHOR_LENGTH = 60;

export const BUNDLED_QUOTES: readonly Quote[] = rawQuotes as Quote[];

/** Every quote (bundled + custom) in the selected categories. */
export function buildQuotePool(
  selected: readonly CategoryId[],
  customQuotes: readonly Quote[] = []
): Quote[] {
  const wanted = new Set(selected);
  return [...BUNDLED_QUOTES, ...customQuotes].filter((q) => wanted.has(q.category));
}

export function countQuotesByCategory(
  customQuotes: readonly Quote[] = []
): Record<CategoryId, number> {
  const counts = {} as Record<CategoryId, number>;
  for (const q of [...BUNDLED_QUOTES, ...customQuotes]) {
    counts[q.category] = (counts[q.category] ?? 0) + 1;
  }
  return counts;
}

export interface QuoteInput {
  text: string;
  author: string;
  category: CategoryId | null;
}

export type QuoteInputErrors = Partial<Record<keyof QuoteInput, string>>;

/** Collapses runs of whitespace so quotes lay out predictably on the wallpaper. */
export function normalizeQuoteText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function validateQuoteInput(input: QuoteInput): QuoteInputErrors {
  const errors: QuoteInputErrors = {};
  const text = normalizeQuoteText(input.text);
  if (text.length === 0) {
    errors.text = 'Write a quote first.';
  } else if (text.length > MAX_QUOTE_LENGTH) {
    errors.text = `Keep it under ${MAX_QUOTE_LENGTH} characters so it fits the wallpaper.`;
  }
  if (normalizeQuoteText(input.author).length > MAX_AUTHOR_LENGTH) {
    errors.author = `Keep the author under ${MAX_AUTHOR_LENGTH} characters.`;
  }
  if (!input.category || !isCategoryId(input.category)) {
    errors.category = 'Pick a category.';
  }
  return errors;
}
