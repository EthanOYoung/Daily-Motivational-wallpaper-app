package expo.modules.dailywallpaper

import android.content.Context
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

/**
 * Settings and state shared by the module, the alarm receiver and the boot receiver.
 * Stored in SharedPreferences so they survive process death and reboots.
 */
internal class WallpaperPrefs(context: Context) {
  private val prefs = context.getSharedPreferences("daily_wallpaper", Context.MODE_PRIVATE)

  val enabled: Boolean get() = prefs.getBoolean(KEY_ENABLED, false)
  val hour: Int get() = prefs.getInt(KEY_HOUR, 6)
  val minute: Int get() = prefs.getInt(KEY_MINUTE, 0)
  val target: String get() = prefs.getString(KEY_TARGET, TARGET_BOTH) ?: TARGET_BOTH

  val lastAppliedDate: String? get() = prefs.getString(KEY_LAST_APPLIED_DATE, null)
  val lastAppliedAt: Long get() = prefs.getLong(KEY_LAST_APPLIED_AT, 0L)
  /** Modification time of the file that was applied, to notice when today's image is redrawn. */
  val lastAppliedStamp: Long get() = prefs.getLong(KEY_LAST_APPLIED_STAMP, 0L)
  val lastError: String? get() = prefs.getString(KEY_LAST_ERROR, null)
  val lastErrorAt: Long get() = prefs.getLong(KEY_LAST_ERROR_AT, 0L)
  val nextTriggerAt: Long get() = prefs.getLong(KEY_NEXT_TRIGGER_AT, 0L)
  val exactAlarm: Boolean get() = prefs.getBoolean(KEY_EXACT_ALARM, false)

  fun configure(enabled: Boolean, hour: Int, minute: Int, target: String) {
    prefs.edit()
      .putBoolean(KEY_ENABLED, enabled)
      .putInt(KEY_HOUR, hour.coerceIn(0, 23))
      .putInt(KEY_MINUTE, minute.coerceIn(0, 59))
      .putString(KEY_TARGET, if (target in TARGETS) target else TARGET_BOTH)
      .commit()
  }

  fun recordApplied(date: String, fileStamp: Long) {
    prefs.edit()
      .putString(KEY_LAST_APPLIED_DATE, date)
      .putLong(KEY_LAST_APPLIED_AT, System.currentTimeMillis())
      .putLong(KEY_LAST_APPLIED_STAMP, fileStamp)
      .remove(KEY_LAST_ERROR)
      .remove(KEY_LAST_ERROR_AT)
      .commit()
  }

  fun recordError(message: String) {
    prefs.edit()
      .putString(KEY_LAST_ERROR, message)
      .putLong(KEY_LAST_ERROR_AT, System.currentTimeMillis())
      .commit()
  }

  fun recordSchedule(nextTriggerAt: Long, exact: Boolean) {
    prefs.edit()
      .putLong(KEY_NEXT_TRIGGER_AT, nextTriggerAt)
      .putBoolean(KEY_EXACT_ALARM, exact)
      .commit()
  }

  companion object {
    const val TARGET_HOME = "home"
    const val TARGET_LOCK = "lock"
    const val TARGET_BOTH = "both"
    private val TARGETS = setOf(TARGET_HOME, TARGET_LOCK, TARGET_BOTH)

    private const val KEY_ENABLED = "enabled"
    private const val KEY_HOUR = "hour"
    private const val KEY_MINUTE = "minute"
    private const val KEY_TARGET = "target"
    private const val KEY_LAST_APPLIED_DATE = "lastAppliedDate"
    private const val KEY_LAST_APPLIED_AT = "lastAppliedAt"
    private const val KEY_LAST_APPLIED_STAMP = "lastAppliedStamp"
    private const val KEY_LAST_ERROR = "lastError"
    private const val KEY_LAST_ERROR_AT = "lastErrorAt"
    private const val KEY_NEXT_TRIGGER_AT = "nextTriggerAt"
    private const val KEY_EXACT_ALARM = "exactAlarm"
  }
}

/** Local calendar date as `yyyy-MM-dd`, matching the file names written by the JavaScript side. */
internal fun dateKey(time: Long = System.currentTimeMillis()): String =
  SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date(time))

/** Today's change time (in local time) as epoch milliseconds. */
internal fun todayAt(hour: Int, minute: Int, now: Long = System.currentTimeMillis()): Long =
  Calendar.getInstance().apply {
    timeInMillis = now
    set(Calendar.HOUR_OF_DAY, hour)
    set(Calendar.MINUTE, minute)
    set(Calendar.SECOND, 0)
    set(Calendar.MILLISECOND, 0)
  }.timeInMillis

/** The next change time strictly after `now`. */
internal fun nextTriggerAt(hour: Int, minute: Int, now: Long = System.currentTimeMillis()): Long {
  val today = todayAt(hour, minute, now)
  if (today > now) return today
  return Calendar.getInstance().apply {
    timeInMillis = today
    add(Calendar.DAY_OF_YEAR, 1)
    // Re-apply the wall-clock time in case the day was shortened or lengthened by DST.
    set(Calendar.HOUR_OF_DAY, hour)
    set(Calendar.MINUTE, minute)
  }.timeInMillis
}
