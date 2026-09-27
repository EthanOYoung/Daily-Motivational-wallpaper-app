package expo.modules.dailywallpaper

import android.app.WallpaperManager
import android.content.Context
import java.io.File
import java.io.FileInputStream

internal enum class ApplyOutcome(val value: String) {
  APPLIED("applied"),
  ALREADY_APPLIED("already_applied"),
  NOT_DUE("not_due"),
  DISABLED("disabled"),
  MISSING_FILE("missing_file"),
  FAILED("failed"),
}

/**
 * Sets the wallpaper from the image the app prepared for today. The JavaScript side renders
 * upcoming days ahead of time into `files/Wallpapers/<yyyy-MM-dd>.jpg`, so nothing needs to run
 * in JavaScript when the alarm fires.
 */
internal object WallpaperApplier {
  fun wallpaperFile(context: Context, date: String): File =
    File(File(context.filesDir, "Wallpapers"), "$date.jpg")

  /**
   * Applies today's wallpaper if the daily time has passed and it isn't showing yet (or today's
   * image was redrawn since it was applied, e.g. after "New quote").
   */
  fun applyTodayIfDue(context: Context, now: Long = System.currentTimeMillis()): ApplyOutcome {
    val prefs = WallpaperPrefs(context)
    if (!prefs.enabled) return ApplyOutcome.DISABLED
    if (now < todayAt(prefs.hour, prefs.minute, now)) return ApplyOutcome.NOT_DUE

    val today = dateKey(now)
    val file = wallpaperFile(context, today)
    if (!file.exists()) {
      prefs.recordError("No wallpaper was prepared for $today. Open the app to prepare it.")
      return ApplyOutcome.MISSING_FILE
    }
    if (prefs.lastAppliedDate == today && prefs.lastAppliedStamp == file.lastModified()) {
      return ApplyOutcome.ALREADY_APPLIED
    }
    return apply(context, file, prefs.target, today)
  }

  fun apply(context: Context, file: File, target: String, date: String): ApplyOutcome {
    val prefs = WallpaperPrefs(context)
    return try {
      setWallpaper(context, file, target)
      prefs.recordApplied(date, file.lastModified())
      ApplyOutcome.APPLIED
    } catch (error: Exception) {
      prefs.recordError(error.message ?: error.javaClass.simpleName)
      ApplyOutcome.FAILED
    }
  }

  fun setWallpaper(context: Context, file: File, target: String) {
    val manager = WallpaperManager.getInstance(context)
    if (!manager.isWallpaperSupported || !manager.isSetWallpaperAllowed) {
      throw IllegalStateException("This device doesn't allow apps to change the wallpaper")
    }
    val flags = when (target) {
      WallpaperPrefs.TARGET_HOME -> listOf(WallpaperManager.FLAG_SYSTEM)
      WallpaperPrefs.TARGET_LOCK -> listOf(WallpaperManager.FLAG_LOCK)
      // Set separately: some devices ignore the lock flag when both are combined in one call.
      else -> listOf(WallpaperManager.FLAG_SYSTEM, WallpaperManager.FLAG_LOCK)
    }
    for (flag in flags) {
      FileInputStream(file).use { stream -> manager.setStream(stream, null, true, flag) }
    }
  }
}
