import { addDays, toDateKey } from '@/domain/dates';
import { PLAN_HORIZON_DAYS, useDailyStore } from '@/store/daily';
import { useRenderStore } from '@/store/renders';
import { useSchedulingStore } from '@/store/scheduling';
import { DEFAULT_SETTINGS, useSettingsStore } from '@/store/settings';
import { pruneWallpaperFiles } from '@/wallpaper/files';
import { ensureDayRendered, isDayRendered } from '@/wallpaper/renderDay';

import { getAlbumAccess, saveToAlbum } from '../album';
import { prepareWallpapers } from '../prepare';

jest.mock('@/wallpaper/renderDay', () => ({
  isDayRendered: jest.fn(() => false),
  ensureDayRendered: jest.fn(async (entry: { date: string; quote: { id: string } }) => ({
    date: entry.date,
    uri: `file:///documents/Wallpapers/${entry.date}.jpg`,
    key: `key-${entry.quote.id}`,
    image: null,
  })),
}));
jest.mock('@/wallpaper/files', () => ({ pruneWallpaperFiles: jest.fn() }));
jest.mock('../album', () => ({
  getAlbumAccess: jest.fn(async () => 'full'),
  saveToAlbum: jest.fn(async () => {}),
}));
jest.mock('../android', () => ({
  applyNativeScreenSize: jest.fn(),
  applyTodayIfDue: jest.fn(async () => 'applied'),
  refreshAndroidStatus: jest.fn(),
  syncAndroidSchedule: jest.fn(async () => null),
}));

const today = () => toDateKey(new Date());

beforeEach(() => {
  jest.clearAllMocks();
  useSettingsStore.setState({ ...DEFAULT_SETTINGS, onboarded: true });
  useDailyStore.setState({ used: [], days: [] });
  useRenderStore.setState({ records: {} });
  useSchedulingStore.setState({ albumSaves: {}, lastPreparedAt: null });
});

describe('prepareWallpapers', () => {
  it('renders every upcoming day, today first, and keeps only those files', async () => {
    const result = await prepareWallpapers('launch');
    expect(result.error).toBeNull();
    expect(result.rendered).toBe(PLAN_HORIZON_DAYS);

    const renderedDates = jest.mocked(ensureDayRendered).mock.calls.map(([entry]) => entry.date);
    expect(renderedDates[0]).toBe(today());
    expect(renderedDates).toContain(addDays(today(), PLAN_HORIZON_DAYS - 1));

    const kept = jest.mocked(pruneWallpaperFiles).mock.calls[0]![0];
    expect(kept.has(today())).toBe(true);
    expect(kept.has(addDays(today(), -1))).toBe(false);
  });

  it('skips days that are already rendered', async () => {
    jest.mocked(isDayRendered).mockReturnValue(true);
    const result = await prepareWallpapers('foreground');
    expect(result.rendered).toBe(0);
    jest.mocked(isDayRendered).mockReturnValue(false);
  });

  it('saves today to the Photos album once per image when enabled (iOS)', async () => {
    useSettingsStore.setState({ saveToAlbum: true });
    await prepareWallpapers('launch');
    await prepareWallpapers('foreground');
    expect(saveToAlbum).toHaveBeenCalledTimes(1);
    expect(jest.mocked(saveToAlbum).mock.calls[0]![1]).toBe(today());
    expect(useSchedulingStore.getState().albumSaves[today()]).toBeDefined();
  });

  it('does not touch the album without full access or when turned off', async () => {
    await prepareWallpapers('launch');
    expect(saveToAlbum).not.toHaveBeenCalled();

    useSettingsStore.setState({ saveToAlbum: true });
    jest.mocked(getAlbumAccess).mockResolvedValueOnce('limited');
    await prepareWallpapers('launch');
    expect(saveToAlbum).not.toHaveBeenCalled();
  });

  it('leaves the album and schedule alone until the introduction is finished', async () => {
    useSettingsStore.setState({ onboarded: false, saveToAlbum: true });
    const result = await prepareWallpapers('launch');
    expect(result.rendered).toBe(PLAN_HORIZON_DAYS);
    expect(saveToAlbum).not.toHaveBeenCalled();

    useSettingsStore.setState({ onboarded: true });
    await prepareWallpapers('settings');
    expect(saveToAlbum).toHaveBeenCalledTimes(1);
  });

  it('runs one at a time and follows up once for calls made meanwhile', async () => {
    const first = prepareWallpapers('launch');
    const second = prepareWallpapers('settings');
    const third = prepareWallpapers('plan');
    expect(second).not.toBe(first);
    expect(third).toBe(second);

    await first;
    expect(useSchedulingStore.getState().lastPrepareReason).toBe('launch');
    await third;
    // The follow-up ran once, with the latest reason.
    expect(useSchedulingStore.getState().lastPrepareReason).toBe('plan');

    await prepareWallpapers('manual');
    expect(useSchedulingStore.getState().lastPrepareReason).toBe('manual');
  });

  it('records errors instead of throwing', async () => {
    jest.mocked(ensureDayRendered).mockRejectedValueOnce(new Error('disk full'));
    const result = await prepareWallpapers('background');
    expect(result.error).toBe('disk full');
    expect(useSchedulingStore.getState().lastPrepareError).toBe('disk full');
  });
});
