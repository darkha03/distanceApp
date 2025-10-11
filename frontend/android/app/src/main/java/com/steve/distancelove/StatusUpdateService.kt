package com.steve.distancelove

import android.app.Service
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.IBinder
import android.widget.RemoteViews

class StatusUpdateService : Service() {

    // The companion object is now empty as constants are moved.

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_UPDATE_STATUS) {
            val status = intent.getStringExtra(EXTRA_STATUS)
            if (status != null) {
                // 1. Save the status to SharedPreferences
                val sharedPrefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                with(sharedPrefs.edit()) {
                    putString(KEY_CURRENT_STATUS, status)
                    apply()
                }

                // 2. Update the widget UI
                updateWidget(status)
            }
        }

        stopSelf(startId)
        return START_NOT_STICKY
    }

    private fun updateWidget(activeStatus: String) {
        val context: Context = this
        val appWidgetManager = AppWidgetManager.getInstance(context)
        val widgetComponent = ComponentName(context, MainWidget::class.java)
        val appWidgetIds = appWidgetManager.getAppWidgetIds(widgetComponent)

        for (appWidgetId in appWidgetIds) {
            val views = RemoteViews(context.packageName, R.layout.main_widget)

            views.setImageViewResource(R.id.btn_sleep, R.drawable.widget_switch_inactive_sleep)
            views.setImageViewResource(R.id.btn_music, R.drawable.widget_switch_inactive_music)
            views.setImageViewResource(R.id.btn_study, R.drawable.widget_switch_inactive_study)
            views.setImageViewResource(R.id.btn_play, R.drawable.widget_switch_inactive_play)

            // FIX: Now references the top-level constants directly
            when (activeStatus) {
                STATUS_SLEEP -> views.setImageViewResource(R.id.btn_sleep, R.drawable.widget_switch_active_sleep)
                STATUS_MUSIC -> views.setImageViewResource(R.id.btn_music, R.drawable.widget_switch_active_music)
                STATUS_STUDY -> views.setImageViewResource(R.id.btn_study, R.drawable.widget_switch_active_study)
                STATUS_PLAY -> views.setImageViewResource(R.id.btn_play, R.drawable.widget_switch_active_play)
            }

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }
}
