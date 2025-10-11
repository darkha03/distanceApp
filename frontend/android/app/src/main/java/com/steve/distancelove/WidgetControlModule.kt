package com.steve.distancelove

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WidgetControlModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "WidgetControlModule"

    @ReactMethod
    fun updateStatus(status: String) {
        val context = reactApplicationContext

        // 1. Save the new status to the same SharedPreferences file the widget uses
        val sharedPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        with(sharedPrefs.edit()) {
            putString(KEY_CURRENT_STATUS, status)
            apply()
        }

        // Trigger a widget update
        updateWidgets()
    }

    /**
     * NEW: A method callable from JS to update the partner's status.
     */
    @ReactMethod
    fun updatePartnerStatus(partnerStatus: String) {
        val context = reactApplicationContext
        val sharedPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        with(sharedPrefs.edit()) {
            putString(KEY_PARTNER_STATUS, partnerStatus)
            apply()
        }
        updateWidgets()
    }

    /**
     * NEW: A method callable from JS to update the partner's timezone.
     */
    @ReactMethod
    fun updatePartnerTimezone(partnerTimezone: String) {
        val context = reactApplicationContext
        val sharedPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        with(sharedPrefs.edit()) {
            putString(KEY_PARTNER_TIMEZONE, partnerTimezone)
            apply()
        }
        updateWidgets()
    }

    /**
     * NEW: A helper function to reduce code duplication. It sends the broadcast
     * to the AppWidgetManager to refresh all widgets.
     */
    private fun updateWidgets() {
        val context = reactApplicationContext
        // 2. Create an Intent to trigger a widget update
        val intent = Intent(context, MainWidget::class.java).apply {
            action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
            // Get all widget IDs for our provider
            val ids = AppWidgetManager.getInstance(context).getAppWidgetIds(
                ComponentName(context, MainWidget::class.java)
            )
            putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
        }

        // 3. Broadcast the intent to trigger the update
        context.sendBroadcast(intent)
    }
}
