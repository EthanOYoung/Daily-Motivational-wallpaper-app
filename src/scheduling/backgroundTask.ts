import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { prepareWallpapers } from './prepare';

export const REFRESH_TASK = 'daily-quote-wallpaper-refresh';

/** Ask the OS to wake the app roughly this often (it decides the exact time). */
const MINIMUM_INTERVAL_MINUTES = 6 * 60;

// Must be defined at startup (imported from the app entry) so the OS can run it while the app
// is in the background or not running.
TaskManager.defineTask(REFRESH_TASK, async () => {
  try {
    const { error } = await prepareWallpapers('background');
    return error
      ? BackgroundTask.BackgroundTaskResult.Failed
      : BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

/**
 * Keeps upcoming wallpapers rendered even when the app isn't opened: Android runs this through
 * WorkManager, iOS through BGTaskScheduler (usually overnight while charging).
 */
export async function registerBackgroundRefresh(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status === BackgroundTask.BackgroundTaskStatus.Restricted) return false;
    if (!(await TaskManager.isTaskRegisteredAsync(REFRESH_TASK))) {
      await BackgroundTask.registerTaskAsync(REFRESH_TASK, {
        minimumInterval: MINIMUM_INTERVAL_MINUTES,
      });
    }
    return true;
  } catch {
    return false;
  }
}
