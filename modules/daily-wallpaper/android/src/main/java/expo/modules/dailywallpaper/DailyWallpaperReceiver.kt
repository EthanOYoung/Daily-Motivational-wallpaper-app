package expo.modules.dailywallpaper

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * Handles the daily alarm and the system events after which the alarm must be re-armed
 * (reboot, app update, clock or time zone change, exact-alarm permission granted). In every case
 * it catches up on today's wallpaper if the change time has passed, then schedules the next one.
 */
class DailyWallpaperReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val action = intent.action ?: return
    if (action !in HANDLED_ACTIONS) return
    val appContext = context.applicationContext
    val pending = goAsync()
    Thread {
      try {
        val outcome = WallpaperApplier.applyTodayIfDue(appContext)
        Log.i(TAG, "$action: ${outcome.value}")
      } catch (error: Exception) {
        Log.w(TAG, "Daily wallpaper update failed", error)
      } finally {
        DailyScheduler.reschedule(appContext)
        pending.finish()
      }
    }.start()
  }

  companion object {
    private const val TAG = "DailyWallpaper"
    const val ACTION_DAILY_CHANGE = "expo.modules.dailywallpaper.DAILY_CHANGE"

    private val HANDLED_ACTIONS = setOf(
      ACTION_DAILY_CHANGE,
      Intent.ACTION_BOOT_COMPLETED,
      Intent.ACTION_MY_PACKAGE_REPLACED,
      Intent.ACTION_TIME_CHANGED,
      Intent.ACTION_TIMEZONE_CHANGED,
      "android.app.action.SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED",
    )
  }
}
