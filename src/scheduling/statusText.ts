import { addDays, formatTimeOfDay, toDateKey } from '@/domain/dates';
import type { DateKey, TimeOfDay } from '@/domain/types';

import type { DailyWallpaperStatus, WallpaperTarget } from '../../modules/daily-wallpaper';

export interface StatusText {
  title: string;
  detail?: string;
  warning?: string;
}

export const TARGET_LABELS: Record<WallpaperTarget, string> = {
  both: 'lock and home screens',
  lock: 'lock screen',
  home: 'home screen',
};

function formatClock(ms: number): string {
  const date = new Date(ms);
  return formatTimeOfDay({ hour: date.getHours(), minute: date.getMinutes() });
}

function relativeDay(ms: number, today: DateKey): string {
  const day = toDateKey(new Date(ms));
  if (day === today) return 'today';
  if (day === addDays(today, 1)) return 'tomorrow';
  return new Date(ms).toLocaleDateString(undefined, { weekday: 'long' });
}

interface AndroidInput {
  today: DateKey;
  now: Date;
  autoApply: boolean;
  dailyTime: TimeOfDay;
  target: WallpaperTarget;
}

/** One-line summary of what the Android scheduler is doing, for the Today screen. */
export function describeAndroidStatus(
  status: DailyWallpaperStatus | null,
  { today, now, autoApply, dailyTime, target }: AndroidInput
): StatusText {
  if (!status) {
    return {
      title: 'Automatic wallpapers need the app build',
      detail:
        "Expo Go can preview wallpapers but can't set them. Install the development build to turn this on.",
    };
  }

  const time = formatTimeOfDay(dailyTime);
  const appliedToday = status.lastAppliedDate === today && status.lastAppliedAt;
  const lateWarning =
    autoApply && !status.exactAlarm && status.exactAlarmSettingsAvailable
      ? 'Android may change it a few minutes late. Allow exact timing in Settings.'
      : undefined;
  const errorWarning =
    status.lastError && status.lastErrorAt && toDateKey(new Date(status.lastErrorAt)) === today
      ? status.lastError
      : undefined;

  if (!autoApply) {
    return {
      title: appliedToday
        ? `On your ${TARGET_LABELS[target]} since ${formatClock(status.lastAppliedAt!)}`
        : 'Automatic changes are off',
      detail: 'Turn them on in Settings, or tap Set now.',
    };
  }

  if (appliedToday) {
    return {
      title: `On your ${TARGET_LABELS[target]} since ${formatClock(status.lastAppliedAt!)}`,
      detail: status.nextTriggerAt
        ? `Next change ${relativeDay(status.nextTriggerAt, today)} at ${time}.`
        : undefined,
      warning: lateWarning,
    };
  }

  const beforeTime =
    now.getHours() < dailyTime.hour ||
    (now.getHours() === dailyTime.hour && now.getMinutes() < dailyTime.minute);
  return {
    title: beforeTime ? `Changes today at ${time}` : "Setting today's wallpaper…",
    detail: `Then every day at ${time} on your ${TARGET_LABELS[target]}.`,
    warning: errorWarning ?? lateWarning,
  };
}

/** Summary for iPhone, where a Shortcuts automation sets the wallpaper. */
export function describeIosStatus({
  saveToAlbum,
  savedToAlbumToday,
}: {
  saveToAlbum: boolean;
  savedToAlbumToday: boolean;
}): StatusText {
  return {
    title: 'Changes automatically with Shortcuts',
    detail: saveToAlbum
      ? savedToAlbumToday
        ? "Today's wallpaper is in your “Daily Quote Wallpaper” album and the app's folder in Files."
        : "Today's wallpaper will be saved to your album shortly."
      : "Each day's wallpaper is ready in Files › On My iPhone › Daily Quote Wallpaper. Set up the automation once.",
  };
}
