package com.steve.distancelove

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys
import com.facebook.react.bridge.Promise
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

    @ReactMethod
    fun updatePartnerImageSet(partnerImageSet: String) {
        val context = reactApplicationContext
        val sharedPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        with(sharedPrefs.edit()) {
            putString(KEY_PARTNER_IMAGE_SET, partnerImageSet)
            apply()
        }
        updateWidgets()
    }

    @ReactMethod
    fun updatePartnerImageUrl(partnerImageUrl: String) {
        val context = reactApplicationContext
        val sharedPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        with(sharedPrefs.edit()) {
            putString(KEY_PARTNER_IMAGE_URL, partnerImageUrl)
            apply()
        }
        updateWidgets()
    }

    @ReactMethod
    fun updatePartnerImageLocalPath(partnerImageLocalPath: String) {
        val context = reactApplicationContext
        val sharedPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        with(sharedPrefs.edit()) {
            putString(KEY_PARTNER_IMAGE_LOCAL_PATH, partnerImageLocalPath)
            apply()
        }
        updateWidgets()
    }

    @ReactMethod
    fun setAuthToken(token: String?) {
        val context = reactApplicationContext

        // 1. Create a master key for encryption
        val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)

        // 2. Get an instance of EncryptedSharedPreferences
        val sharedPreferences = EncryptedSharedPreferences.create(
            "secure_prefs", // A unique name for the secure file
            masterKeyAlias,
            context,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
        with(sharedPreferences.edit()) {
            if (token != null) {
                putString(KEY_AUTH_TOKEN, token)
                Log.i("WidgetControlModule", "Auth token has been set.")
            } else {
                // FIX: Use the 'remove' method from the SharedPreferences.Editor
                remove(KEY_AUTH_TOKEN)
                Log.i("WidgetControlModule", "Auth token has been cleared.")
            }
            apply()
        }
    }

    @ReactMethod
    fun getCurrentStatus(promise: Promise) {
        try {
            val context = reactApplicationContext
            val sharedPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val currentStatus = sharedPrefs.getString(KEY_CURRENT_STATUS, STATUS_SLEEP) // Default to sleep
            promise.resolve(currentStatus)
        } catch (e: Exception) {
            promise.reject("E_WIDGET_CONTROL", "Failed to get current status", e)
        }
    }

    @ReactMethod
    fun getPartnerImageUrl(promise: Promise) {
        try {
            val context = reactApplicationContext
            val sharedPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val partnerImageUrl = sharedPrefs.getString(KEY_PARTNER_IMAGE_URL, null)
            promise.resolve(partnerImageUrl)
        } catch (e: Exception) {
            promise.reject("E_WIDGET_CONTROL", "Failed to get partner image URL", e)
        }
    }
    /**
     * A helper function to reduce code duplication. It sends the broadcast
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
