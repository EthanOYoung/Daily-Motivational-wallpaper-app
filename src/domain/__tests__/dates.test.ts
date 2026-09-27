import {
  addDays,
  atTime,
  dateRange,
  dayNumber,
  fromDateKey,
  hasTimePassed,
  msUntilMidnight,
  nextOccurrence,
  toDateKey,
} from '../dates';

describe('date keys', () => {
  it('round-trips local dates', () => {
    const date = new Date(2026, 8, 28, 23, 59);
    expect(toDateKey(date)).toBe('2026-09-28');
    expect(fromDateKey('2026-09-28').getDate()).toBe(28);
  });

  it('adds days across month, year and leap-day boundaries', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('counts days consistently', () => {
    expect(dayNumber('1970-01-02')).toBe(1);
    expect(dayNumber('2026-09-29') - dayNumber('2026-09-28')).toBe(1);
    expect(dateRange('2026-09-28', 3)).toEqual(['2026-09-28', '2026-09-29', '2026-09-30']);
  });

  it('rejects malformed keys', () => {
    expect(() => fromDateKey('28/09/2026')).toThrow();
  });
});

describe('scheduling helpers', () => {
  const six = { hour: 6, minute: 0 };

  it('knows whether the daily time has passed', () => {
    expect(hasTimePassed(new Date(2026, 8, 28, 5, 59), six)).toBe(false);
    expect(hasTimePassed(new Date(2026, 8, 28, 6, 0), six)).toBe(true);
  });

  it('finds the next occurrence of the daily time', () => {
    expect(nextOccurrence(new Date(2026, 8, 28, 5, 0), six)).toEqual(new Date(2026, 8, 28, 6, 0));
    expect(nextOccurrence(new Date(2026, 8, 28, 6, 0), six)).toEqual(new Date(2026, 8, 29, 6, 0));
    expect(atTime('2026-09-28', { hour: 18, minute: 30 })).toEqual(new Date(2026, 8, 28, 18, 30));
  });

  it('measures the time until midnight', () => {
    expect(msUntilMidnight(new Date(2026, 8, 28, 23, 0))).toBe(60 * 60 * 1000);
  });
});
