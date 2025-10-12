package com.steve.distancelove

import android.app.Service
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.IBinder
import android.util.Log
import android.widget.RemoteViews
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

class StatusUpdateService : Service() {

    private val client = OkHttpClient()
    private val serviceScope = CoroutineScope(Dispatchers.IO) // Scope for background tasks

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

                // 3. Send the update to the backend in the background
                sendUpdateRequestToBackend(status)
            }
        }

        stopSelf(startId)
        return START_NOT_STICKY
    }

    private fun sendUpdateRequestToBackend(status: String) {
        serviceScope.launch {
            try {
                // --- GET AUTH TOKEN ---
                // 1. Create a master key
                val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)

                // 2. Get instance of the same EncryptedSharedPreferences file
                val securePrefs = EncryptedSharedPreferences.create(
                    "secure_prefs",
                    masterKeyAlias,
                    applicationContext,
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
                )

                // 3. Read the token
                val authToken = securePrefs.getString("auth_token", null)

                if (authToken == null) {
                    Log.e("StatusUpdateService", "Auth token is missing. Aborting backend update.")
                    return@launch // Stop execution if no token is found
                }
                // --- END GET AUTH TOKEN ---

                Log.i("StatusUpdateService", "Sending backend update for status: $status")

                val apiBaseUrl = BuildConfig.API_BASE_URL
                val endpoint = "$apiBaseUrl/api/users/status"
                Log.i("StatusUpdateService", "Endpoint: $endpoint")

                val json = """{"status":"$status"}"""
                val requestBody = json.toRequestBody("application/json; charset=utf-8".toMediaType())

                val request = Request.Builder()
                    .url(endpoint)
                    .put(requestBody)
                    // 4. Add the retrieved token to the Authorization header
                    .addHeader("Authorization", "Bearer $authToken")
                    .build()

                client.newCall(request).execute().use { response ->
                    if (!response.isSuccessful) {
                        Log.e("StatusUpdateService", "Backend update failed: ${response.code} ${response.body?.string()}")
                    } else {
                        Log.i("StatusUpdateService", "Backend update successful for status: $status")
                    }
                }
            } catch (e: Exception) {
                Log.e("StatusUpdateService", "Exception during backend update", e)
            }
        }
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
