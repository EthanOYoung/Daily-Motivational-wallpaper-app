import type { DateKey, TimeOfDay } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

/** Formats a date as a `YYYY-MM-DD` key in the device's local time zone. */
export function toDateKey(date: Date): DateKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parts(key: DateKey): [number, number, number] {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) throw new Error(`Invalid date key: ${key}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** Local midnight at the start of the given day. */
export function fromDateKey(key: DateKey): Date {
  const [y, m, d] = parts(key);
  return new Date(y, m - 1, d);
}

/** Whole days since 1970-01-01, independent of time zones and DST. */
export function dayNumber(key: DateKey): number {
  const [y, m, d] = parts(key);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
}

export function addDays(key: DateKey, days: number): DateKey {
  const [y, m, d] = parts(key);
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  return `${utc.getUTCFullYear()}-${pad(utc.getUTCMonth() + 1)}-${pad(utc.getUTCDate())}`;
}

/** Keys from `start` (inclusive) for `count` consecutive days. */
export function dateRange(start: DateKey, count: number): DateKey[] {
  return Array.from({ length: count }, (_, i) => addDays(start, i));
}

/** The given local day at `time`. */
export function atTime(key: DateKey, time: TimeOfDay): Date {
  const date = fromDateKey(key);
  date.setHours(time.hour, time.minute, 0, 0);
  return date;
}

/** Whether today's scheduled change time has already passed at `now`. */
export function hasTimePassed(now: Date, time: TimeOfDay): boolean {
  return now.getTime() >= atTime(toDateKey(now), time).getTime();
}

/** The next moment (strictly after `now`) that falls on `time`. */
export function nextOccurrence(now: Date, time: TimeOfDay): Date {
  const today = toDateKey(now);
  const candidate = atTime(today, time);
  return candidate.getTime() > now.getTime() ? candidate : atTime(addDays(today, 1), time);
}

/** Milliseconds from `now` until the next local midnight. */
export function msUntilMidnight(now: Date): number {
  return fromDateKey(addDays(toDateKey(now), 1)).getTime() - now.getTime();
}

export function formatTimeOfDay(time: TimeOfDay, locale?: string): string {
  const date = new Date(2000, 0, 1, time.hour, time.minute);
  return date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
}

/** Lock screen style clock: "6:05" on a 12-hour clock (no AM/PM), "06:05" on a 24-hour clock. */
export function formatClockTime(date: Date, uses24Hour: boolean): string {
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const hours = uses24Hour
    ? String(date.getHours()).padStart(2, '0')
    : String(date.getHours() % 12 || 12);
  return `${hours}:${minutes}`;
}

export function formatDateKey(
  key: DateKey,
  options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' },
  locale?: string
): string {
  return fromDateKey(key).toLocaleDateString(locale, options);
}

/** "Yesterday", else e.g. "Saturday, September 26" (with the year when it isn't this year). */
export function describePastDate(date: DateKey, today: DateKey, locale?: string): string {
  if (date === addDays(today, -1)) return 'Yesterday';
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
  if (date.slice(0, 4) !== today.slice(0, 4)) options.year = 'numeric';
  return formatDateKey(date, options, locale);
}
