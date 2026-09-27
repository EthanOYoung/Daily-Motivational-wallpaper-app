export type WallpaperTarget = 'home' | 'lock' | 'both';

export interface ScheduleOptions {
  /** Whether the wallpaper should change automatically every day. */
  enabled: boolean;
  hour: number;
  minute: number;
  target: WallpaperTarget;
}

export type ApplyOutcome =
  'applied' | 'already_applied' | 'not_due' | 'disabled' | 'missing_file' | 'failed';

export interface DailyWallpaperStatus {
  enabled: boolean;
  hour: number;
  minute: number;
  target: WallpaperTarget;
  /** Day (`YYYY-MM-DD`) whose wallpaper was last set. */
  lastAppliedDate: string | null;
  lastAppliedAt: number | null;
  lastError: string | null;
  lastErrorAt: number | null;
  /** When the next automatic change is due (epoch ms). */
  nextTriggerAt: number | null;
  /** Whether the current alarm is exact (needs "Alarms & reminders" access on Android 12+). */
  exactAlarm: boolean;
  canScheduleExactAlarms: boolean;
  exactAlarmSettingsAvailable: boolean;
}

export interface ScreenSize {
  width: number;
  height: number;
}
