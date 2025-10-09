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

/**
 * Implementation of App Widget functionality.
 */
class MainWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        // Use the fully qualified name for AppWidgetManager here
        appWidgetManager: android.appwidget.AppWidgetManager,
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
        val appWidgetManager = AppWidgetManager.getInstance(context)
        val appWidgetId = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
        if (appWidgetId != AppWidgetManager.INVALID_APPWIDGET_ID) {
            val views = RemoteViews(context.packageName, R.layout.main_widget)

            // Reset all switches to inactive by default
            views.setImageViewResource(R.id.btn_sleep, R.drawable.widget_switch_inactive_sleep)
            views.setImageViewResource(R.id.btn_music, R.drawable.widget_switch_inactive_music)
            views.setImageViewResource(R.id.btn_study, R.drawable.widget_switch_inactive_study)
            views.setImageViewResource(R.id.btn_play, R.drawable.widget_switch_inactive_play)

            // Set the appropriate switch based on the intent action
            when (intent.action) {
                ACTION_SLEEP_CLICK -> views.setImageViewResource(R.id.btn_sleep, R.drawable.widget_switch_active_sleep)
                ACTION_MUSIC_CLICK -> views.setImageViewResource(R.id.btn_music, R.drawable.widget_switch_active_music)
                ACTION_STUDY_CLICK -> views.setImageViewResource(R.id.btn_study, R.drawable.widget_switch_active_study)
                ACTION_PLAY_CLICK -> views.setImageViewResource(R.id.btn_play, R.drawable.widget_switch_active_play)
                // Add more cases for other actions if needed
            }
            // Update the widget
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

    }

    companion object {
        // Define unique action strings for each button
        private const val ACTION_SLEEP_CLICK = "com.steve.distancelove.ACTION_SLEEP_CLICK"
        private const val ACTION_MUSIC_CLICK = "com.steve.distancelove.ACTION_MUSIC_CLICK"
        private const val ACTION_STUDY_CLICK = "com.steve.distancelove.ACTION_STUDY_CLICK"
        private const val ACTION_PLAY_CLICK = "com.steve.distancelove.ACTION_PLAY_CLICK"

        // Helper function to create a PendingIntent for a switch
        private fun getPendingSelfIntent(context: Context, action: String, appWidgetId: Int): PendingIntent {
            val intent = Intent(context, MainWidget::class.java).apply {
                this.action = action
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
            }
            return PendingIntent.getBroadcast(
                context,
                appWidgetId and action.hashCode(), // Unique request code
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        }

        fun updateAppWidget(
            context: Context,
            // And also use the fully qualified name here
            appWidgetManager: android.appwidget.AppWidgetManager,
            appWidgetId: Int
        ) {
            // The reference to R.layout.main_widget will now resolve correctly.
            val views = RemoteViews(context.packageName, R.layout.main_widget)

            // Example: dynamic time update
            val currentTime = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())
            views.setTextViewText(R.id.widget_time_text, currentTime)
            val currentDate = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault()).format(Date())
            views.setTextViewText(R.id.widget_date_text, currentDate)

            // Example: set an image (from drawable)
            views.setImageViewResource(R.id.widget_image, R.drawable.widget_image_placeholder)

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
