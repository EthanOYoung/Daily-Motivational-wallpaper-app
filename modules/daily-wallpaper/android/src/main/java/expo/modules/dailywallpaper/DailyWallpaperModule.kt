package expo.modules.dailywallpaper

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.hardware.display.DisplayManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.util.DisplayMetrics
import android.view.Display
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.File
import kotlin.math.max
import kotlin.math.min

class ScheduleOptions : Record {
  @Field
  val enabled: Boolean = false

  @Field
  val hour: Int = 6

  @Field
  val minute: Int = 0

  @Field
  val target: String = WallpaperPrefs.TARGET_BOTH
}

class WallpaperNotSetException(message: String) : CodedException(message)

class DailyWallpaperModule : Module() {
  private val context: Context
    get() = appContext.reactContext?.applicationContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("DailyWallpaper")

    /** The panel's real size in pixels (portrait), so wallpapers match it exactly. */
    Function("getScreenSize") {
      val metrics = DisplayMetrics()
      val display = context.getSystemService(DisplayManager::class.java)
        ?.getDisplay(Display.DEFAULT_DISPLAY)
      @Suppress("DEPRECATION")
      display?.getRealMetrics(metrics)
      mapOf(
        "width" to min(metrics.widthPixels, metrics.heightPixels),
        "height" to max(metrics.widthPixels, metrics.heightPixels)
      )
    }

    /** Saves the schedule and (re)arms the daily alarm. */
    AsyncFunction("configureAsync") { options: ScheduleOptions ->
      val prefs = WallpaperPrefs(context)
      prefs.configure(options.enabled, options.hour, options.minute, options.target)
      DailyScheduler.reschedule(context)
      status(context)
    }

    /** Applies today's prepared wallpaper if the change time has passed and it isn't showing yet. */
    AsyncFunction("applyTodayIfDueAsync") {
      WallpaperApplier.applyTodayIfDue(context).value
    }

    /** Sets a wallpaper right away ("Set now"), remembering it as the given day's wallpaper. */
    AsyncFunction("setWallpaperAsync") { uri: String, target: String, date: String ->
      val file = File(Uri.parse(uri).path ?: uri)
      if (!file.exists()) throw WallpaperNotSetException("The wallpaper image is missing")
      val outcome = WallpaperApplier.apply(context, file, target, date)
      if (outcome != ApplyOutcome.APPLIED) {
        throw WallpaperNotSetException(WallpaperPrefs(context).lastError ?: "Couldn't set the wallpaper")
      }
    }

    Function("getStatus") {
      status(context)
    }

    /** Opens the "Alarms & reminders" screen for this app (Android 12+). */
    AsyncFunction("openExactAlarmSettingsAsync") {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return@AsyncFunction false
      val packageUri = Uri.parse("package:${context.packageName}")
      try {
        context.startActivity(
          Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, packageUri)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        )
      } catch (error: ActivityNotFoundException) {
        // Some devices hide that screen; the app's settings page links to it instead.
        context.startActivity(
          Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, packageUri)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        )
      }
      true
    }
  }

  private fun status(context: Context): Map<String, Any?> {
    val prefs = WallpaperPrefs(context)
    return mapOf(
      "enabled" to prefs.enabled,
      "hour" to prefs.hour,
      "minute" to prefs.minute,
      "target" to prefs.target,
      "lastAppliedDate" to prefs.lastAppliedDate,
      "lastAppliedAt" to prefs.lastAppliedAt.takeIf { it > 0 }?.toDouble(),
      "lastError" to prefs.lastError,
      "lastErrorAt" to prefs.lastErrorAt.takeIf { it > 0 }?.toDouble(),
      "nextTriggerAt" to prefs.nextTriggerAt.takeIf { it > 0 }?.toDouble(),
      "exactAlarm" to prefs.exactAlarm,
      "canScheduleExactAlarms" to DailyScheduler.canScheduleExact(context),
      "exactAlarmSettingsAvailable" to (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S)
    )
  }
}
