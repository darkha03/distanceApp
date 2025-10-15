package com.steve.distancelove

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Log
import android.widget.RemoteViews
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/**
 * Implementation of App Widget functionality.
 */
class MainWidget : AppWidgetProvider() {

    private val widgetScope = CoroutineScope(Dispatchers.IO)

    override fun onUpdate(
        context: Context,
        // Use the fully qualified name for AppWidgetManager here
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        // Launch a coroutine to handle updates for all widgets
        widgetScope.launch {
            for (widgetId in appWidgetIds) {
                updateAppWidget(context, appWidgetManager, widgetId)
            }
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        val status = when (intent.action) {
            ACTION_SLEEP_CLICK -> STATUS_SLEEP
            ACTION_MUSIC_CLICK -> STATUS_MUSIC
            ACTION_STUDY_CLICK -> STATUS_STUDY
            ACTION_PLAY_CLICK -> STATUS_PLAY
            else -> null
        }

        if (status != null) {

            val serviceIntent = Intent(context, StatusUpdateService::class.java).apply {
                action = ACTION_UPDATE_STATUS
                putExtra(EXTRA_STATUS, status)
            }
            context.startService(serviceIntent)
            /**
            val brIntent = Intent(context, StatusActionReceiver::class.java).apply {
                putExtra(EXTRA_STATUS, status)
            }
            context.sendBroadcast(brIntent)
            **/
        }

    }

    private suspend fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val views = RemoteViews(context.packageName, R.layout.main_widget)
        val sharedPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

        // --- TIME AND DATE UPDATE ---
        val partnerTimezoneId = sharedPrefs.getString(KEY_PARTNER_TIMEZONE, "UTC")
        val partnerTimeZone = TimeZone.getTimeZone(partnerTimezoneId)
        val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault()).apply { timeZone = partnerTimeZone }
        val dateFormat = SimpleDateFormat("EEEE, d MMM, yyyy", Locale.getDefault()).apply { timeZone = partnerTimeZone }
        views.setTextViewText(R.id.widget_time_text, timeFormat.format(Date()))
        views.setTextViewText(R.id.widget_date_text, dateFormat.format(Date()))

        // --- IMAGE LOADING LOGIC ---
        val partnerImagePath = sharedPrefs.getString(KEY_PARTNER_IMAGE_URL, null)
        var imageBitmap: Bitmap? = null

        if (!partnerImagePath.isNullOrEmpty()) {
            // If a local path exists, try to load it
            imageBitmap = loadImageFromFile(partnerImagePath)
        }

        if (imageBitmap != null) {
            // SUCCESS: Set the loaded bitmap from the local file
            views.setImageViewBitmap(R.id.widget_image, imageBitmap)
        } else {
            // FALLBACK: Load from local drawables based on status and image set
            val partnerStatus = sharedPrefs.getString(KEY_PARTNER_STATUS, STATUS_SLEEP)
            val imageSet = sharedPrefs.getString(KEY_PARTNER_IMAGE_SET, "default")
            val fallbackImageResource = getFallbackImageResource(imageSet, partnerStatus)
            views.setImageViewResource(R.id.widget_image, fallbackImageResource)
        }

        // --- STATUS PILL and SWITCHES ---
        val partnerStatus = sharedPrefs.getString(KEY_PARTNER_STATUS, STATUS_SLEEP)
        val capitalizedPartnerStatus = partnerStatus?.replaceFirstChar {
            if (it.isLowerCase()) it.titlecase(Locale.getDefault()) else it.toString()
        }
        views.setTextViewText(R.id.widget_status_pill, capitalizedPartnerStatus)

        val currentStatus = sharedPrefs.getString(KEY_CURRENT_STATUS, STATUS_SLEEP)
        views.setImageViewResource(R.id.btn_sleep, if (currentStatus == STATUS_SLEEP) R.drawable.widget_switch_active_sleep else R.drawable.widget_switch_inactive_sleep)
        views.setImageViewResource(R.id.btn_music, if (currentStatus == STATUS_MUSIC) R.drawable.widget_switch_active_music else R.drawable.widget_switch_inactive_music)
        views.setImageViewResource(R.id.btn_study, if (currentStatus == STATUS_STUDY) R.drawable.widget_switch_active_study else R.drawable.widget_switch_inactive_study)
        views.setImageViewResource(R.id.btn_play, if (currentStatus == STATUS_PLAY) R.drawable.widget_switch_active_play else R.drawable.widget_switch_inactive_play)

        // --- CLICK LISTENERS ---
        views.setOnClickPendingIntent(R.id.btn_sleep, getPendingSelfIntent(context, ACTION_SLEEP_CLICK, appWidgetId))
        views.setOnClickPendingIntent(R.id.btn_music, getPendingSelfIntent(context, ACTION_MUSIC_CLICK, appWidgetId))
        views.setOnClickPendingIntent(R.id.btn_study, getPendingSelfIntent(context, ACTION_STUDY_CLICK, appWidgetId))
        views.setOnClickPendingIntent(R.id.btn_play, getPendingSelfIntent(context, ACTION_PLAY_CLICK, appWidgetId))
        val intent = Intent(context, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        views.setOnClickPendingIntent(R.id.widget_image, pendingIntent)

        // Apply the update to the widget on the main thread
        withContext(Dispatchers.Main) {
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }

    // --- NEW: Helper function to load an image from a local file path ---
    private suspend fun loadImageFromFile(path: String): Bitmap? {
        return withContext(Dispatchers.IO) {
            try {
                val file = File(path)
                if (file.exists()) {
                    BitmapFactory.decodeFile(file.absolutePath)
                } else {
                    Log.e("MainWidget", "Image file does not exist at path: $path")
                    null
                }
            } catch (e: Exception) {
                Log.e("MainWidget", "Exception loading image from file", e)
                null
            }
        }
    }

    // --- Helper function for fallback image logic ---
    private fun getFallbackImageResource(imageSet: String?, partnerStatus: String?): Int {
        return when (imageSet) {
            "1" -> when (partnerStatus) {
                STATUS_SLEEP -> R.drawable.set_one_sleep
                STATUS_MUSIC -> R.drawable.set_one_relax
                STATUS_STUDY -> R.drawable.set_one_study
                STATUS_PLAY -> R.drawable.set_one_play
                else -> R.drawable.set_default_sleep
            }
            "2" -> when (partnerStatus) {
                STATUS_SLEEP -> R.drawable.set_two_sleep
                STATUS_MUSIC -> R.drawable.set_two_relax
                STATUS_STUDY -> R.drawable.set_two_study
                STATUS_PLAY -> R.drawable.set_two_play
                else -> R.drawable.set_default_sleep
            }
            else -> when (partnerStatus) {
                STATUS_SLEEP -> R.drawable.set_default_sleep
                STATUS_MUSIC -> R.drawable.set_default_relax
                STATUS_STUDY -> R.drawable.set_default_study
                STATUS_PLAY -> R.drawable.set_default_play
                else -> R.drawable.set_default_sleep
            }
        }
    }

    // --- Helper function to create a PendingIntent ---
    private fun getPendingSelfIntent(context: Context, action: String, appWidgetId: Int): PendingIntent {
        val intent = Intent(context, MainWidget::class.java).apply { this.action = action }
        return PendingIntent.getBroadcast(
            context,
            appWidgetId + action.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }
}
