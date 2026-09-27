import type { Quote } from './types';

export type RandomFn = () => number;

export interface PickOptions {
  /** Ids that should not be chosen, e.g. quotes already planned for other days. */
  exclude?: ReadonlySet<string>;
  /** Most recently shown id; avoided when a new cycle starts so it isn't shown twice in a row. */
  lastId?: string;
  random?: RandomFn;
}

export interface PickResult {
  quote: Quote;
  /** Ids used in the current cycle, including the picked quote. */
  used: Set<string>;
  /** True when every quote in the pool had already been used and a fresh cycle began. */
  cycleReset: boolean;
}

/**
 * Picks a random quote that hasn't been used in the current cycle.
 *
 * A quote only repeats once every quote in `pool` has been used. When that happens the pool's
 * quotes are forgotten (except ones still excluded) and a new cycle starts.
 */
export function pickNextQuote(
  pool: readonly Quote[],
  used: ReadonlySet<string>,
  { exclude = new Set(), lastId, random = Math.random }: PickOptions = {}
): PickResult | null {
  if (pool.length === 0) return null;

  const nextUsed = new Set(used);
  let candidates = pool.filter((q) => !used.has(q.id) && !exclude.has(q.id));
  let cycleReset = false;

  if (candidates.length === 0) {
    cycleReset = true;
    for (const q of pool) {
      if (!exclude.has(q.id)) nextUsed.delete(q.id);
    }
    candidates = pool.filter((q) => !exclude.has(q.id) && q.id !== lastId);
    // Tiny pools: allow the last quote, then anything at all, rather than showing nothing.
    if (candidates.length === 0) candidates = pool.filter((q) => !exclude.has(q.id));
    if (candidates.length === 0) candidates = [...pool];
  }

  const index = Math.min(candidates.length - 1, Math.floor(random() * candidates.length));
  const quote = candidates[index]!;
  nextUsed.add(quote.id);
  return { quote, used: nextUsed, cycleReset };
}

/** Deterministic PRNG (mulberry32) for tests and reproducible renders. */
export function seededRandom(seed: number): RandomFn {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
