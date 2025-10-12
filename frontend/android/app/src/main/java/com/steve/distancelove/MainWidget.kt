package com.steve.distancelove

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/**
 * Implementation of App Widget functionality.
 */
class MainWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        // Use the fully qualified name for AppWidgetManager here
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        // Update all widgets
        for (widgetId in appWidgetIds) {
            // The call is now correctly resolved to the function in the companion object.
            updateAppWidget(context, appWidgetManager, widgetId)
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
        }

    }

    companion object {

        // Helper function to create a PendingIntent for a switch
        private fun getPendingSelfIntent(context: Context, action: String, appWidgetId: Int): PendingIntent {
            val intent = Intent(context, MainWidget::class.java).apply {
                this.action = action
            }
            return PendingIntent.getBroadcast(
                context,
                action.hashCode(), // Unique request code
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        }

        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            // The reference to R.layout.main_widget will now resolve correctly.
            val views = RemoteViews(context.packageName, R.layout.main_widget)
            val sharedPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val currentStatus = sharedPrefs.getString(KEY_CURRENT_STATUS, STATUS_SLEEP)

            // --- TIME AND DATE UPDATE ---
            // 1. Get the stored timezone ID string, defaulting to UTC.
            val partnerTimezoneId = sharedPrefs.getString(KEY_PARTNER_TIMEZONE, "UTC")
            val partnerTimeZone = TimeZone.getTimeZone(partnerTimezoneId)

            // 2. Create formatters and apply the partner's timezone to them.
            val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault()).apply {
                timeZone = partnerTimeZone
            }
            val dateFormat = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault()).apply {
                timeZone = partnerTimeZone
            }

            // 3. Format the current time and date using the timezone-aware formatters.
            val currentTime = timeFormat.format(Date())
            views.setTextViewText(R.id.widget_time_text, currentTime)
            val currentDate = dateFormat.format(Date())
            views.setTextViewText(R.id.widget_date_text, currentDate)


            // Example: set an image (from drawable)
            views.setImageViewResource(R.id.widget_image, R.drawable.widget_image_placeholder)
            // Set partnerStatus
            val partnerStatus = sharedPrefs.getString(KEY_PARTNER_STATUS, STATUS_SLEEP)
            views.setTextViewText(R.id.widget_status_pill, partnerStatus)

            // Set the active switch based on SharedPreferences
            views.setImageViewResource(R.id.btn_sleep, if (currentStatus == STATUS_SLEEP) R.drawable.widget_switch_active_sleep else R.drawable.widget_switch_inactive_sleep)
            views.setImageViewResource(R.id.btn_music, if (currentStatus == STATUS_MUSIC) R.drawable.widget_switch_active_music else R.drawable.widget_switch_inactive_music)
            views.setImageViewResource(R.id.btn_study, if (currentStatus == STATUS_STUDY) R.drawable.widget_switch_active_study else R.drawable.widget_switch_inactive_study)
            views.setImageViewResource(R.id.btn_play, if (currentStatus == STATUS_PLAY) R.drawable.widget_switch_active_play else R.drawable.widget_switch_inactive_play)

            // Set up the click listeners for each switch
            views.setOnClickPendingIntent(R.id.btn_sleep, getPendingSelfIntent(context, ACTION_SLEEP_CLICK, appWidgetId))
            views.setOnClickPendingIntent(R.id.btn_music, getPendingSelfIntent(context, ACTION_MUSIC_CLICK, appWidgetId))
            views.setOnClickPendingIntent(R.id.btn_study, getPendingSelfIntent(context, ACTION_STUDY_CLICK, appWidgetId))
            views.setOnClickPendingIntent(R.id.btn_play, getPendingSelfIntent(context, ACTION_PLAY_CLICK, appWidgetId))

            // Example: onClick -> open app
            val intent = Intent(context, MainActivity::class.java)
            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )
            views.setOnClickPendingIntent(R.id.widget_image, pendingIntent)

            // Apply the update
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
