package com.steve.distancelove

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.widget.RemoteViews
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL

class StatusUpdateWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {
    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val status = inputData.getString("status") ?: return@withContext Result.failure()

        val prefs = applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
        val securePrefs = EncryptedSharedPreferences.create(
            "secure_prefs",
            masterKeyAlias,
            applicationContext,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
        val token = securePrefs.getString(KEY_AUTH_TOKEN, null)
        // Save current status locally
        prefs.edit().putString(KEY_CURRENT_STATUS, status).commit()

        // Refresh widget
        updateWidget(applicationContext, status)
        // Update backend
        try {
            val baseUrl = BuildConfig.API_BASE_URL
            val url = URL("$baseUrl/api/users/status")

            (url.openConnection() as? HttpURLConnection)?.let { conn ->
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json")
                if (!token.isNullOrEmpty()) conn.setRequestProperty("Authorization", "Bearer $token")
                conn.doOutput = true
                conn.outputStream.use { os ->
                    os.write("""{"status":"$status"}""".toByteArray())
                }
                conn.responseCode // trigger request
                conn.disconnect()
            }
        } catch (_: Throwable) { /* ignore or log */ }
        Result.success()
    }

    private fun updateWidget(context: Context, activeStatus: String) {
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
}