import { CATEGORIES } from '../categories';
import {
  BUNDLED_QUOTES,
  MAX_QUOTE_LENGTH,
  buildQuotePool,
  countQuotesByCategory,
  normalizeQuoteText,
  validateQuoteInput,
} from '../quotes';
import { CATEGORY_IDS, isCategoryId, type Quote } from '../types';

describe('bundled quote library', () => {
  it('has at least 30 quotes in every category', () => {
    const counts = countQuotesByCategory();
    for (const id of CATEGORY_IDS) {
      expect(counts[id]).toBeGreaterThanOrEqual(30);
    }
  });

  it('only uses known categories and has metadata for each one', () => {
    expect(CATEGORIES.map((c) => c.id).sort()).toEqual([...CATEGORY_IDS].sort());
    for (const quote of BUNDLED_QUOTES) {
      expect(isCategoryId(quote.category)).toBe(true);
    }
  });

  it('has unique ids and no duplicate quotes', () => {
    const ids = new Set(BUNDLED_QUOTES.map((q) => q.id));
    expect(ids.size).toBe(BUNDLED_QUOTES.length);
    const texts = new Set(BUNDLED_QUOTES.map((q) => q.text.toLowerCase().replace(/[^a-z]/g, '')));
    expect(texts.size).toBe(BUNDLED_QUOTES.length);
  });

  it('attributes every quote and keeps it short enough for a wallpaper', () => {
    for (const quote of BUNDLED_QUOTES) {
      expect(quote.author.trim().length).toBeGreaterThan(0);
      expect(quote.text).toBe(normalizeQuoteText(quote.text));
      expect(quote.text.length).toBeLessThanOrEqual(MAX_QUOTE_LENGTH);
      expect(quote.id.startsWith(`${quote.category}-`)).toBe(true);
    }
  });

  it('uses typographic dashes and quotes instead of ASCII look-alikes', () => {
    for (const quote of BUNDLED_QUOTES) {
      expect(quote.text).not.toMatch(/ - |--|"/);
    }
  });
});

describe('buildQuotePool', () => {
  const custom: Quote = {
    id: 'custom-1',
    text: 'Small steps every day.',
    author: 'Me',
    category: 'ambition',
    isCustom: true,
  };

  it('keeps only the selected categories', () => {
    const pool = buildQuotePool(['gratitude', 'family']);
    expect(pool.length).toBeGreaterThanOrEqual(60);
    expect(new Set(pool.map((q) => q.category))).toEqual(new Set(['gratitude', 'family']));
  });

  it('includes custom quotes from selected categories only', () => {
    expect(buildQuotePool(['ambition'], [custom]).some((q) => q.id === 'custom-1')).toBe(true);
    expect(buildQuotePool(['family'], [custom]).some((q) => q.id === 'custom-1')).toBe(false);
  });

  it('is empty when nothing is selected', () => {
    expect(buildQuotePool([])).toEqual([]);
  });
});

describe('validateQuoteInput', () => {
  it('accepts a normal quote', () => {
    expect(validateQuoteInput({ text: 'Keep going.', author: '', category: 'resilience' })).toEqual(
      {}
    );
  });

  it('rejects empty, overly long and uncategorised quotes', () => {
    expect(validateQuoteInput({ text: '   ', author: '', category: 'family' }).text).toBeDefined();
    expect(
      validateQuoteInput({ text: 'a'.repeat(MAX_QUOTE_LENGTH + 1), author: '', category: 'family' })
        .text
    ).toBeDefined();
    expect(validateQuoteInput({ text: 'Hi', author: '', category: null }).category).toBeDefined();
  });

  it('normalises whitespace', () => {
    expect(normalizeQuoteText('  one\n two   three ')).toBe('one two three');
  });
});
