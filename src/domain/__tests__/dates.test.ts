import {
  addDays,
  atTime,
  dateRange,
  dayNumber,
  describePastDate,
  formatClockTime,
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

describe('formatClockTime', () => {
  it('formats like a lock screen clock', () => {
    const morning = new Date(2026, 8, 28, 6, 5);
    const evening = new Date(2026, 8, 28, 18, 30);
    const midnight = new Date(2026, 8, 28, 0, 0);
    expect(formatClockTime(morning, false)).toBe('6:05');
    expect(formatClockTime(evening, false)).toBe('6:30');
    expect(formatClockTime(midnight, false)).toBe('12:00');
    expect(formatClockTime(morning, true)).toBe('06:05');
    expect(formatClockTime(evening, true)).toBe('18:30');
    expect(formatClockTime(midnight, true)).toBe('00:00');
  });
});

describe('describePastDate', () => {
  it('names yesterday and spells out older days', () => {
    expect(describePastDate('2026-09-27', '2026-09-28', 'en-US')).toBe('Yesterday');
    expect(describePastDate('2026-09-26', '2026-09-28', 'en-US')).toBe('Saturday, September 26');
    expect(describePastDate('2025-12-31', '2026-01-02', 'en-US')).toBe(
      'Wednesday, December 31, 2025'
    );
  });
});
