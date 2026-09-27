import { addDays, dateRange, dayNumber } from './dates';
import { pickNextQuote, type RandomFn } from './rotation';
import type { DateKey, Quote } from './types';

/** One day's wallpaper: the quote and the background style it is drawn on. */
export interface DayEntry {
  date: DateKey;
  quote: Quote;
  styleId: string;
  /** Chosen by the user (e.g. a favourite for today); kept even if its category is turned off. */
  pinned?: boolean;
}

export interface PlanState {
  /** Quote ids used in the current no-repeat cycle (shown or already planned). */
  used: string[];
  /** Past, current and upcoming days, sorted by date. */
  days: DayEntry[];
}

export interface PlanContext {
  today: DateKey;
  /** Days to keep planned ahead, including today. */
  horizon: number;
  pool: readonly Quote[];
  /** Enabled background styles, in rotation order. */
  styleIds: readonly string[];
  random?: RandomFn;
  /** Past days kept for the history list. */
  historyLimit?: number;
  /** Every known quote, used to refresh pinned days (whose quote may be outside the pool). */
  catalog?: readonly Quote[];
}

export const EMPTY_PLAN: PlanState = { used: [], days: [] };
export const DEFAULT_HISTORY_LIMIT = 400;

const byDate = (a: DayEntry, b: DayEntry) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);

/** Styles rotate by calendar day so consecutive days always look different. */
export function styleForDate(date: DateKey, styleIds: readonly string[]): string {
  if (styleIds.length === 0) throw new Error('At least one background style must be enabled');
  const n = styleIds.length;
  return styleIds[((dayNumber(date) % n) + n) % n]!;
}

/** The next enabled style after `current`, used when regenerating a day. */
export function nextStyle(current: string, styleIds: readonly string[]): string {
  const index = styleIds.indexOf(current);
  return styleIds[(index + 1) % styleIds.length] ?? styleIds[0]!;
}

export function findDay(state: PlanState, date: DateKey): DayEntry | undefined {
  return state.days.find((d) => d.date === date);
}

/**
 * Makes sure `today` and the following days up to `horizon` each have a quote and style.
 *
 * Planned days whose quote left the pool (category deselected, custom quote deleted) are
 * re-planned; upcoming ones give their quote back to the cycle since nobody saw it yet. Pinned
 * days are kept as chosen unless their quote was deleted. Quote snapshots are refreshed so edits
 * to custom quotes show up.
 */
export function ensurePlan(state: PlanState, ctx: PlanContext): PlanState {
  const { today, pool, styleIds, random, historyLimit = DEFAULT_HISTORY_LIMIT } = ctx;
  const horizon = Math.max(1, ctx.horizon);
  const lastDay = addDays(today, horizon - 1);

  const past = state.days.filter((d) => d.date < today).slice(-historyLimit);
  if (pool.length === 0 || styleIds.length === 0) {
    // Nothing to plan with; keep what we have until the user picks categories again.
    return { used: state.used, days: [...past, ...state.days.filter((d) => d.date >= today)] };
  }

  const poolById = new Map(pool.map((q) => [q.id, q]));
  const catalogById = new Map((ctx.catalog ?? []).map((q) => [q.id, q]));
  let used = new Set(state.used);
  const kept = new Map<DateKey, DayEntry>();

  for (const entry of state.days) {
    if (entry.date < today) continue;
    // Pinned quotes may sit outside the pool; one missing from the catalog was deleted.
    const fresh = entry.pinned
      ? ctx.catalog
        ? catalogById.get(entry.quote.id)
        : entry.quote
      : poolById.get(entry.quote.id);
    if (entry.date > lastDay || !fresh) {
      // Unseen future quotes return to the cycle; today's quote counts as shown.
      if (entry.date > today) used.delete(entry.quote.id);
      if (entry.date > lastDay) continue;
    }
    if (!fresh) continue;
    kept.set(entry.date, {
      ...entry,
      quote: fresh,
      styleId: styleIds.includes(entry.styleId)
        ? entry.styleId
        : styleForDate(entry.date, styleIds),
    });
  }

  let previousId = past[past.length - 1]?.quote.id;
  for (const date of dateRange(today, horizon)) {
    const existing = kept.get(date);
    if (existing) {
      previousId = existing.quote.id;
      continue;
    }
    const exclude = new Set([...kept.values()].map((d) => d.quote.id));
    const pick = pickNextQuote(pool, used, { exclude, lastId: previousId, random });
    if (!pick) break;
    used = pick.used;
    kept.set(date, { date, quote: pick.quote, styleId: styleForDate(date, styleIds) });
    previousId = pick.quote.id;
  }

  return { used: [...used], days: [...past, ...[...kept.values()].sort(byDate)] };
}

/** Swaps the quote for `date` with a new unused one and moves to the next style. */
export function regenerateDay(state: PlanState, date: DateKey, ctx: PlanContext): PlanState {
  const planned = ensurePlan(state, ctx);
  const current = findDay(planned, date);
  if (!current) return planned;

  const exclude = new Set(planned.days.filter((d) => d.date >= ctx.today).map((d) => d.quote.id));
  const pick = pickNextQuote(ctx.pool, new Set(planned.used), {
    exclude,
    lastId: current.quote.id,
    random: ctx.random,
  });
  if (!pick) return planned;

  const replacement: DayEntry = {
    date,
    quote: pick.quote,
    styleId: ctx.styleIds.length > 1 ? nextStyle(current.styleId, ctx.styleIds) : current.styleId,
  };
  return {
    used: [...pick.used],
    days: planned.days.map((d) => (d.date === date ? replacement : d)),
  };
}

/**
 * Pins a specific quote to `date`, e.g. when choosing a favourite for today. Later days that had
 * the same quote planned are dropped so the next `ensurePlan` gives them a different one.
 */
export function assignQuoteToDay(state: PlanState, date: DateKey, quote: Quote): PlanState {
  const used = new Set(state.used);
  used.add(quote.id);
  const days = state.days
    .filter((d) => d.date <= date || d.quote.id !== quote.id)
    .map((d) => (d.date === date ? { ...d, quote, pinned: true } : d));
  return { used: [...used], days };
}
