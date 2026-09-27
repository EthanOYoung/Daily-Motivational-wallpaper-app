import { addDays } from '../dates';
import {
  EMPTY_PLAN,
  assignQuoteToDay,
  ensurePlan,
  findDay,
  nextStyle,
  regenerateDay,
  styleForDate,
  type PlanContext,
} from '../plan';
import { buildQuotePool } from '../quotes';
import { seededRandom } from '../rotation';
import type { Quote } from '../types';

const STYLES = ['dawn', 'sea-glass', 'sage', 'midnight', 'linen', 'dusk'];
const TODAY = '2026-09-28';

const context = (overrides: Partial<PlanContext> = {}): PlanContext => ({
  today: TODAY,
  horizon: 7,
  pool: buildQuotePool(['gratitude', 'happiness']),
  styleIds: STYLES,
  random: seededRandom(1),
  ...overrides,
});

describe('ensurePlan', () => {
  it('plans today and the following days with distinct quotes', () => {
    const plan = ensurePlan(EMPTY_PLAN, context());
    expect(plan.days.map((d) => d.date)).toEqual(
      Array.from({ length: 7 }, (_, i) => addDays(TODAY, i))
    );
    expect(new Set(plan.days.map((d) => d.quote.id)).size).toBe(7);
    expect(new Set(plan.used)).toEqual(new Set(plan.days.map((d) => d.quote.id)));
  });

  it('rotates background styles so consecutive days differ', () => {
    const plan = ensurePlan(EMPTY_PLAN, context());
    for (let i = 1; i < plan.days.length; i++) {
      expect(plan.days[i]!.styleId).not.toBe(plan.days[i - 1]!.styleId);
    }
  });

  it('keeps existing entries when nothing changed', () => {
    const plan = ensurePlan(EMPTY_PLAN, context());
    expect(ensurePlan(plan, context({ random: seededRandom(99) }))).toEqual(plan);
  });

  it('moves past days into history and plans new days as time goes on', () => {
    const plan = ensurePlan(EMPTY_PLAN, context());
    const tomorrow = addDays(TODAY, 1);
    const next = ensurePlan(plan, context({ today: tomorrow }));
    expect(next.days[0]!.date).toBe(TODAY);
    expect(findDay(next, tomorrow)!.quote.id).toBe(findDay(plan, tomorrow)!.quote.id);
    expect(next.days[next.days.length - 1]!.date).toBe(addDays(tomorrow, 6));
  });

  it('never repeats a quote until the whole pool has been shown', () => {
    const pool = buildQuotePool(['family']);
    let plan = EMPTY_PLAN;
    const shown: string[] = [];
    let day = TODAY;
    for (let i = 0; i < pool.length; i++) {
      plan = ensurePlan(plan, context({ today: day, pool, horizon: 3 }));
      shown.push(findDay(plan, day)!.quote.id);
      day = addDays(day, 1);
    }
    expect(new Set(shown).size).toBe(pool.length);
  });

  it('re-plans future days when a category is deselected and frees their quotes', () => {
    const plan = ensurePlan(EMPTY_PLAN, context());
    const futureGratitude = plan.days.filter(
      (d) => d.date > TODAY && d.quote.category === 'gratitude'
    );
    const next = ensurePlan(plan, context({ pool: buildQuotePool(['happiness']) }));
    expect(next.days.every((d) => d.quote.category === 'happiness')).toBe(true);
    for (const entry of futureGratitude) {
      expect(next.used).not.toContain(entry.quote.id);
    }
  });

  it('refreshes quote snapshots from the pool', () => {
    const custom: Quote = {
      id: 'custom-1',
      text: 'Old text',
      author: 'Me',
      category: 'ambition',
      isCustom: true,
    };
    const plan = ensurePlan(EMPTY_PLAN, context({ pool: [custom], horizon: 1 }));
    const edited = { ...custom, text: 'New text' };
    const next = ensurePlan(plan, context({ pool: [edited], horizon: 1 }));
    expect(findDay(next, TODAY)!.quote.text).toBe('New text');
  });

  it('leaves the plan alone when there is nothing to pick from', () => {
    const plan = ensurePlan(EMPTY_PLAN, context());
    expect(ensurePlan(plan, context({ pool: [] })).days).toEqual(plan.days);
  });

  it('replaces styles that were turned off', () => {
    const plan = ensurePlan(EMPTY_PLAN, context());
    const next = ensurePlan(plan, context({ styleIds: ['linen'] }));
    expect(next.days.every((d) => d.styleId === 'linen')).toBe(true);
  });

  it('caps the history length', () => {
    let plan = EMPTY_PLAN;
    let day = TODAY;
    for (let i = 0; i < 10; i++) {
      plan = ensurePlan(plan, context({ today: day, horizon: 1, historyLimit: 3 }));
      day = addDays(day, 1);
    }
    expect(plan.days.filter((d) => d.date < addDays(day, -1))).toHaveLength(3);
  });
});

describe('regenerateDay', () => {
  it('picks a new, unplanned quote and the next style', () => {
    const plan = ensurePlan(EMPTY_PLAN, context());
    const before = findDay(plan, TODAY)!;
    const after = regenerateDay(plan, TODAY, context({ random: seededRandom(5) }));
    const today = findDay(after, TODAY)!;
    expect(today.quote.id).not.toBe(before.quote.id);
    expect(today.styleId).toBe(nextStyle(before.styleId, STYLES));
    const upcoming = after.days.filter((d) => d.date >= TODAY).map((d) => d.quote.id);
    expect(new Set(upcoming).size).toBe(upcoming.length);
    // The replaced quote was already seen, so it stays used in this cycle.
    expect(after.used).toContain(before.quote.id);
  });
});

describe('assignQuoteToDay', () => {
  it('sets the quote and drops later days that planned the same quote', () => {
    const plan = ensurePlan(EMPTY_PLAN, context());
    const later = plan.days[3]!;
    const next = assignQuoteToDay(plan, TODAY, later.quote);
    expect(findDay(next, TODAY)!.quote.id).toBe(later.quote.id);
    expect(findDay(next, later.date)).toBeUndefined();
    const refilled = ensurePlan(next, context());
    expect(findDay(refilled, later.date)!.quote.id).not.toBe(later.quote.id);
  });
});

describe('styles', () => {
  it('picks styles deterministically by date', () => {
    expect(styleForDate(TODAY, STYLES)).toBe(styleForDate(TODAY, STYLES));
    expect(styleForDate(TODAY, ['only'])).toBe('only');
    expect(nextStyle('dusk', STYLES)).toBe('dawn');
  });
});
