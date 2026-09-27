import { addDays } from '@/domain/dates';

import { PLAN_HORIZON_DAYS, useDailyStore } from '../daily';
import { DEFAULT_SETTINGS, useSettingsStore } from '../settings';

const TODAY = '2026-09-28';

beforeEach(() => {
  useSettingsStore.setState(DEFAULT_SETTINGS);
  useDailyStore.setState({ used: [], days: [] });
});

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
});
