package com.nova.anime.nova2.ui

import android.app.Activity
import android.content.pm.ActivityInfo
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue

/**
 * Single-owner orientation controller for RiftPlayer (mirrors utils/watchOrientation.ts).
 * Ensures only the player manages orientation transitions while active and restores
 * the exact pre-player orientation upon exit so parent screens and the player never conflict.
 */
@Stable
class RiftOrientationController(
    private val activity: Activity?,
    private val isTv: Boolean,
) {
    private val originalOrientation: Int =
        activity?.requestedOrientation ?: ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED

    var isLandscape by mutableStateOf(true)
        private set

    fun enterPlayerOrientation() {
        if (isTv || activity == null) return
        isLandscape = true
        activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
    }

    fun toggleOrientation(): Boolean {
        if (isTv || activity == null) return isLandscape
        isLandscape = !isLandscape
        activity.requestedOrientation = if (isLandscape) {
            ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
        } else {
            ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
        }
        return isLandscape
    }

    fun restoreExitOrientation() {
        if (isTv || activity == null) return
        activity.requestedOrientation = if (originalOrientation != ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED) {
            originalOrientation
        } else {
            ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
        }
    }
}

@Composable
fun rememberRiftOrientationController(
    activity: Activity?,
    isTv: Boolean,
): RiftOrientationController {
    val controller = remember(activity, isTv) {
        RiftOrientationController(activity = activity, isTv = isTv)
    }
    DisposableEffect(controller) {
        controller.enterPlayerOrientation()
        onDispose {
            controller.restoreExitOrientation()
        }
    }
    return controller
}
