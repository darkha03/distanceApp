package com.steve.distancelove

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.work.Data
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager

class StatusActionReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val status = intent.getStringExtra(EXTRA_STATUS) ?: return
        val work = OneTimeWorkRequestBuilder<StatusUpdateWorker>()
            .setInputData(
                Data.Builder()
                    .putString("status", status)
                    .build()
            )
            .build()
        WorkManager.getInstance(context).enqueue(work)
    }
}