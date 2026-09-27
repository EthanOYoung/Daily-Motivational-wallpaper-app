import { addDays } from '@/domain/dates';

import { PLAN_HORIZON_DAYS, useDailyStore } from '../daily';
import { useLibraryStore } from '../library';
import { DEFAULT_SETTINGS, useSettingsStore } from '../settings';

const TODAY = '2026-09-28';

beforeEach(() => {
  // Actions that act on "today" read the clock, so keep it on TODAY.
  jest.useFakeTimers({ now: new Date(2026, 8, 28, 9, 30) });
  useSettingsStore.setState(DEFAULT_SETTINGS);
  useLibraryStore.setState({ customQuotes: [], favourites: [] });
  useDailyStore.setState({ used: [], days: [] });
});

afterEach(() => {
  jest.useRealTimers();
});

const todayEntry = () => useDailyStore.getState().days.find((d) => d.date === TODAY);

describe('daily store', () => {
  it('plans the upcoming days from the selected categories', () => {
    useSettingsStore.getState().setCategories(['resilience']);
    useDailyStore.getState().sync(TODAY);
    const { days } = useDailyStore.getState();
    expect(days).toHaveLength(PLAN_HORIZON_DAYS);
    expect(days[0]!.date).toBe(TODAY);
    expect(days[days.length - 1]!.date).toBe(addDays(TODAY, PLAN_HORIZON_DAYS - 1));
    expect(days.every((d) => d.quote.category === 'resilience')).toBe(true);
  });

  it('re-plans when the selected categories change', () => {
    useSettingsStore.getState().setCategories(['resilience']);
    useDailyStore.getState().sync(TODAY);
    useSettingsStore.getState().setCategories(['gratitude']);
    useDailyStore.getState().sync(TODAY);
    expect(useDailyStore.getState().days.every((d) => d.quote.category === 'gratitude')).toBe(true);
  });

  it('assigns a chosen quote to a day', () => {
    useDailyStore.getState().sync(TODAY);
    const later = useDailyStore.getState().days[2]!;
    useDailyStore.getState().assign(TODAY, later.quote);
    const days = useDailyStore.getState().days;
    expect(days.find((d) => d.date === TODAY)!.quote.id).toBe(later.quote.id);
    expect(days.filter((d) => d.quote.id === later.quote.id)).toHaveLength(1);
  });

  it('assigns a quote to today before the day has been planned', () => {
    const quote = useLibraryStore
      .getState()
      .addCustomQuote({ text: 'Fresh start', author: '', category: 'ambition' });
    useDailyStore.getState().assign(TODAY, quote);
    expect(todayEntry()!.quote.id).toBe(quote.id);
    expect(useDailyStore.getState().days).toHaveLength(PLAN_HORIZON_DAYS);
  });

  it('adds custom quotes to the rotation of their category', () => {
    useSettingsStore.getState().setCategories(['family']);
    const quote = useLibraryStore
      .getState()
      .addCustomQuote({ text: 'Home is people.', author: 'Me', category: 'family' });
    // Every family quote gets shown once per cycle, the custom one included.
    const cycle = new Set<string>();
    for (let day = 0; day < 60 && !cycle.has(quote.id); day++) {
      useDailyStore.getState().sync(addDays(TODAY, day));
      cycle.add(
        useDailyStore.getState().days.find((d) => d.date === addDays(TODAY, day))!.quote.id
      );
    }
    expect(cycle.has(quote.id)).toBe(true);
  });

  it('keeps a chosen quote for today when its category is turned off, until it is deleted', () => {
    useSettingsStore.getState().setCategories(['gratitude']);
    const quote = useLibraryStore
      .getState()
      .addCustomQuote({ text: 'Keep this one', author: '', category: 'ambition' });
    useDailyStore.getState().assign(TODAY, quote);
    useDailyStore.getState().sync(TODAY);
    expect(todayEntry()!.quote.id).toBe(quote.id);

    useLibraryStore.getState().updateCustomQuote(quote.id, {
      text: 'Keep this one, edited',
      author: '',
      category: 'ambition',
    });
    useDailyStore.getState().sync(TODAY);
    expect(todayEntry()!.quote.text).toBe('Keep this one, edited');

    useLibraryStore.getState().deleteCustomQuote(quote.id);
    useDailyStore.getState().sync(TODAY);
    expect(todayEntry()!.quote.category).toBe('gratitude');
  });
});
