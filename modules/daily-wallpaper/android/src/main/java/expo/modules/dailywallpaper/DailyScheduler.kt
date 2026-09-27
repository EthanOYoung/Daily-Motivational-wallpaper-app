package expo.modules.dailywallpaper

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

/**
 * Arms a single alarm for the next daily change. The receiver applies the wallpaper and arms the
 * following day's alarm, so there is always exactly one pending.
 */
internal object DailyScheduler {
  private const val TAG = "DailyWallpaper"
  private const val REQUEST_CODE = 0x5157

  fun canScheduleExact(context: Context): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true
    val alarmManager = context.getSystemService(AlarmManager::class.java) ?: return false
    return alarmManager.canScheduleExactAlarms()
  }

  fun reschedule(context: Context) {
    val prefs = WallpaperPrefs(context)
    val alarmManager = context.getSystemService(AlarmManager::class.java) ?: return
    val pending = alarmIntent(context)
    alarmManager.cancel(pending)

    if (!prefs.enabled) {
      prefs.recordSchedule(0L, false)
      return
    }

    val triggerAt = nextTriggerAt(prefs.hour, prefs.minute)
    var exact = canScheduleExact(context)
    try {
      if (exact) {
        // Fires even in Doze, at the exact minute.
        alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pending)
      } else {
        // Without "Alarms & reminders" access Android may deliver this a few minutes late.
        alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pending)
      }
    } catch (error: SecurityException) {
      Log.w(TAG, "Exact alarm refused, falling back to an inexact one", error)
      exact = false
      alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pending)
    }
    prefs.recordSchedule(triggerAt, exact)
  }

  private fun alarmIntent(context: Context): PendingIntent {
    val intent = Intent(context, DailyWallpaperReceiver::class.java)
      .setAction(DailyWallpaperReceiver.ACTION_DAILY_CHANGE)
    return PendingIntent.getBroadcast(
      context,
      REQUEST_CODE,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }
}
