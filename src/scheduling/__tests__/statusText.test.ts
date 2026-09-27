import type { DailyWallpaperStatus } from '../../../modules/daily-wallpaper';
import { describeAndroidStatus, describeIosStatus } from '../statusText';

const TODAY = '2026-09-28';
const at = (h: number, m: number, day = 28) => new Date(2026, 8, day, h, m).getTime();

const baseStatus: DailyWallpaperStatus = {
  enabled: true,
  hour: 6,
  minute: 0,
  target: 'both',
  lastAppliedDate: null,
  lastAppliedAt: null,
  lastError: null,
  lastErrorAt: null,
  nextTriggerAt: at(6, 0),
  exactAlarm: true,
  canScheduleExactAlarms: true,
  exactAlarmSettingsAvailable: true,
};

const input = (overrides: Partial<Parameters<typeof describeAndroidStatus>[1]> = {}) => ({
  today: TODAY,
  now: new Date(at(5, 0)),
  autoApply: true,
  dailyTime: { hour: 6, minute: 0 },
  target: 'both' as const,
  ...overrides,
});

describe('describeAndroidStatus', () => {
  it('explains that Expo Go cannot set wallpapers', () => {
    expect(describeAndroidStatus(null, input()).title).toMatch(/app build/);
  });

  it('shows the upcoming change before the daily time', () => {
    const text = describeAndroidStatus(baseStatus, input());
    expect(text.title).toMatch(/^Changes today at/);
    expect(text.warning).toBeUndefined();
  });

  it('confirms when today’s wallpaper is on screen', () => {
    const text = describeAndroidStatus(
      {
        ...baseStatus,
        lastAppliedDate: TODAY,
        lastAppliedAt: at(6, 1),
        nextTriggerAt: at(6, 0, 29),
      },
      input({ now: new Date(at(9, 0)) })
    );
    expect(text.title).toMatch(/^On your lock and home screens since/);
    expect(text.detail).toMatch(/^Next change tomorrow at/);
  });

  it('surfaces today’s error after the change time', () => {
    const text = describeAndroidStatus(
      { ...baseStatus, lastError: 'No wallpaper was prepared', lastErrorAt: at(6, 0) },
      input({ now: new Date(at(7, 0)) })
    );
    expect(text.warning).toBe('No wallpaper was prepared');
  });

  it('warns when exact alarms are not allowed', () => {
    const text = describeAndroidStatus({ ...baseStatus, exactAlarm: false }, input());
    expect(text.warning).toMatch(/few minutes late/);
  });

  it('says when automatic changes are off', () => {
    expect(describeAndroidStatus(baseStatus, input({ autoApply: false })).title).toBe(
      'Automatic changes are off'
    );
  });
});

describe('describeIosStatus', () => {
  it('points to Files when the album is off', () => {
    expect(describeIosStatus({ saveToAlbum: false, savedToAlbumToday: false }).detail).toMatch(
      /Files/
    );
  });

  it('confirms the album save', () => {
    expect(describeIosStatus({ saveToAlbum: true, savedToAlbumToday: true }).detail).toMatch(
      /album/
    );
  });
});
