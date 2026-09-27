import { buildQuotePool } from '../quotes';
import { pickNextQuote, seededRandom } from '../rotation';
import type { Quote } from '../types';

const makePool = (n: number): Quote[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `q${i}`,
    text: `Quote ${i}`,
    author: 'Test',
    category: 'gratitude',
  }));

describe('pickNextQuote', () => {
  it('returns null for an empty pool', () => {
    expect(pickNextQuote([], new Set())).toBeNull();
  });

  it('never repeats until every quote in the pool has been shown', () => {
    const pool = buildQuotePool(['mindfulness', 'confidence']);
    const random = seededRandom(42);
    let used = new Set<string>();
    const seen: string[] = [];
    for (let i = 0; i < pool.length; i++) {
      const pick = pickNextQuote(pool, used, { random, lastId: seen[seen.length - 1] })!;
      expect(pick.cycleReset).toBe(false);
      seen.push(pick.quote.id);
      used = pick.used;
    }
    expect(new Set(seen).size).toBe(pool.length);

    // The next pick starts a new cycle and avoids repeating the very last quote.
    const next = pickNextQuote(pool, used, { random, lastId: seen[seen.length - 1] })!;
    expect(next.cycleReset).toBe(true);
    expect(next.quote.id).not.toBe(seen[seen.length - 1]);
    expect([...next.used]).toEqual([next.quote.id]);
  });

  it('keeps quotes used in other categories when a cycle resets', () => {
    const pool = makePool(2);
    const used = new Set(['q0', 'q1', 'other-category-7']);
    const pick = pickNextQuote(pool, used, { random: () => 0 })!;
    expect(pick.cycleReset).toBe(true);
    expect(pick.used.has('other-category-7')).toBe(true);
  });

  it('skips excluded quotes while unused ones remain', () => {
    const pool = makePool(3);
    const pick = pickNextQuote(pool, new Set(), {
      exclude: new Set(['q0', 'q1']),
      random: () => 0,
    })!;
    expect(pick.quote.id).toBe('q2');
  });

  it('falls back to repeating when the pool is smaller than what is excluded', () => {
    const pool = makePool(1);
    const pick = pickNextQuote(pool, new Set(['q0']), { exclude: new Set(['q0']), lastId: 'q0' })!;
    expect(pick.quote.id).toBe('q0');
  });

  it('is deterministic with a seeded random source', () => {
    const pool = makePool(20);
    const a = pickNextQuote(pool, new Set(), { random: seededRandom(7) })!;
    const b = pickNextQuote(pool, new Set(), { random: seededRandom(7) })!;
    expect(a.quote.id).toBe(b.quote.id);
  });
});
