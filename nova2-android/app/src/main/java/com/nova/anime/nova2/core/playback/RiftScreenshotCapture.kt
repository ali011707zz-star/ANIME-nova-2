package com.nova.anime.nova2.core.playback

import android.Manifest
import android.content.ContentValues
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Typeface
import android.media.MediaMetadataRetriever
import android.os.Build
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import android.view.PixelCopy
import android.view.SurfaceView
import android.view.TextureView
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.media3.ui.PlayerView
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import java.io.OutputStream
import kotlin.coroutines.resume
import kotlin.math.roundToInt

sealed class ScreenshotSaveResult {
    data class Success(val messageAr: String) : ScreenshotSaveResult()
    data class PermissionRequired(val messageAr: String) : ScreenshotSaveResult()
    data class Failure(val messageAr: String) : ScreenshotSaveResult()
}

/**
 * Captures the current video frame from [PlayerView] (`SurfaceView` via [PixelCopy] or `TextureView.bitmap`,
 * with [MediaMetadataRetriever] fallback), burns in the active subtitle cue with the user's current
 * [SubtitleStyleSettings], and saves the image into the device gallery (`Pictures/AnimeNOVA`).
 */
object RiftScreenshotCapture {

    fun hasGalleryPermission(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            true
        } else {
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.WRITE_EXTERNAL_STORAGE,
            ) == PackageManager.PERMISSION_GRANTED
        }
    }

    suspend fun captureAndSaveToGallery(
        context: Context,
        playerView: PlayerView?,
        currentSource: PlaybackSource,
        requestHeaders: Map<String, String>,
        positionMs: Long,
        isFlipped180: Boolean,
        activeSubtitleText: String?,
        subtitleStyle: SubtitleStyleSettings,
        episodeLabel: String,
    ): ScreenshotSaveResult {
        if (!hasGalleryPermission(context)) {
            return ScreenshotSaveResult.PermissionRequired(
                "يلزم منح إذن التخزين لحفظ لقطة الشاشة في المعرض",
            )
        }

        val frameBitmap = captureVideoFrame(
            playerView = playerView,
            currentSource = currentSource,
            requestHeaders = requestHeaders,
            positionMs = positionMs,
        ) ?: return ScreenshotSaveResult.Failure(
            "تعذر التقاط إطار الفيديو الحالي (قد يكون محميًا أو قيد التهيئة)",
        )

        return withContext(Dispatchers.IO) {
            runCatching {
                val composedBitmap = composeFrameAndSubtitle(
                    sourceBitmap = frameBitmap,
                    isFlipped180 = isFlipped180,
                    subtitleText = activeSubtitleText?.takeIf { subtitleStyle.enabled && it.isNotBlank() },
                    subtitleStyle = subtitleStyle,
                )
                val saved = writeBitmapToMediaStore(
                    context = context,
                    bitmap = composedBitmap,
                    episodeLabel = episodeLabel,
                )
                if (composedBitmap !== frameBitmap) {
                    frameBitmap.recycle()
                }
                composedBitmap.recycle()

                if (saved) {
                    ScreenshotSaveResult.Success("📸 تم حفظ لقطة الشاشة مع الترجمة في معرض الصور")
                } else {
                    ScreenshotSaveResult.Failure("تعذر حفظ لقطة الشاشة في معرض الصور")
                }
            }.getOrElse {
                ScreenshotSaveResult.Failure("فشل حفظ لقطة الشاشة في المعرض")
            }
        }
    }

    private suspend fun captureVideoFrame(
        playerView: PlayerView?,
        currentSource: PlaybackSource,
        requestHeaders: Map<String, String>,
        positionMs: Long,
    ): Bitmap? {
        val videoSurfaceView = playerView?.videoSurfaceView
        if (videoSurfaceView is TextureView) {
            val bmp = runCatching { videoSurfaceView.bitmap }.getOrNull()
            if (bmp != null) return bmp
        }

        val surfaceView = (videoSurfaceView as? SurfaceView) ?: findSurfaceView(playerView)
        if (surfaceView != null && surfaceView.width > 0 && surfaceView.height > 0 && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            val pixelCopyBmp = requestPixelCopy(surfaceView)
            if (pixelCopyBmp != null) return pixelCopyBmp
        }

        // Fallback to MediaMetadataRetriever for progressive/local MP4 streams
        return withContext(Dispatchers.IO) {
            runCatching {
                val retriever = MediaMetadataRetriever()
                try {
                    if (currentSource.url.startsWith("http://") || currentSource.url.startsWith("https://")) {
                        retriever.setDataSource(currentSource.url, requestHeaders)
                    } else {
                        retriever.setDataSource(currentSource.url)
                    }
                    retriever.getFrameAtTime(
                        positionMs.coerceAtLeast(0L) * 1000L,
                        MediaMetadataRetriever.OPTION_CLOSEST_SYNC,
                    )
                } finally {
                    runCatching { retriever.release() }
                }
            }.getOrNull()
        }
    }

    private suspend fun requestPixelCopy(surfaceView: SurfaceView): Bitmap? =
        suspendCancellableCoroutine { cont ->
            val width = surfaceView.width.coerceAtLeast(1)
            val height = surfaceView.height.coerceAtLeast(1)
            val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
            val handler = Handler(Looper.getMainLooper())
            runCatching {
                PixelCopy.request(
                    surfaceView,
                    bitmap,
                    { copyResult ->
                        if (!cont.isActive) return@request
                        if (copyResult == PixelCopy.SUCCESS) {
                            cont.resume(bitmap)
                        } else {
                            bitmap.recycle()
                            cont.resume(null)
                        }
                    },
                    handler,
                )
            }.onFailure {
                bitmap.recycle()
                if (cont.isActive) cont.resume(null)
            }
        }

    private fun findSurfaceView(root: View?): SurfaceView? {
        if (root == null) return null
        if (root is SurfaceView) return root
        if (root is ViewGroup) {
            for (i in 0 until root.childCount) {
                val found = findSurfaceView(root.getChildAt(i))
                if (found != null) return found
            }
        }
        return null
    }

    private fun composeFrameAndSubtitle(
        sourceBitmap: Bitmap,
        isFlipped180: Boolean,
        subtitleText: String?,
        subtitleStyle: SubtitleStyleSettings,
    ): Bitmap {
        val width = sourceBitmap.width.coerceAtLeast(1)
        val height = sourceBitmap.height.coerceAtLeast(1)
        val result = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(result)

        if (isFlipped180) {
            canvas.save()
            canvas.rotate(180f, width / 2f, height / 2f)
            canvas.drawBitmap(sourceBitmap, 0f, 0f, null)
            canvas.restore()
        } else {
            canvas.drawBitmap(sourceBitmap, 0f, 0f, null)
        }

        if (!subtitleText.isNullOrBlank()) {
            drawSubtitleOnCanvas(
                canvas = canvas,
                width = width,
                height = height,
                subtitleText = subtitleText,
                style = subtitleStyle,
            )
        }

        return result
    }

    private fun drawSubtitleOnCanvas(
        canvas: Canvas,
        width: Int,
        height: Int,
        subtitleText: String,
        style: SubtitleStyleSettings,
    ) {
        val scaleFactor = (height / 480f).coerceIn(0.85f, 3.0f)
        val textSizePx = style.fontSizeSp * scaleFactor * 1.15f

        val typefaceStyle = when (style.fontWeightOption) {
            SubtitleFontWeightOption.NORMAL -> Typeface.NORMAL
            SubtitleFontWeightOption.BOLD, SubtitleFontWeightOption.EXTRA_BOLD -> Typeface.BOLD
        }

        val textPaint = TextPaint(Paint.ANTI_ALIAS_FLAG).apply {
            color = style.colorOption.colorHex.toInt()
            textSize = textSizePx
            typeface = Typeface.create(Typeface.DEFAULT, typefaceStyle)
            if (style.fontWeightOption == SubtitleFontWeightOption.EXTRA_BOLD) {
                isFakeBoldText = true
            }
            setShadowLayer(4f * scaleFactor, 0f, 2f * scaleFactor, Color.BLACK)
        }

        val maxTextWidth = (width * 0.84f).roundToInt().coerceAtLeast(100)
        val staticLayout = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            StaticLayout.Builder
                .obtain(subtitleText, 0, subtitleText.length, textPaint, maxTextWidth)
                .setAlignment(Layout.Alignment.ALIGN_CENTER)
                .setIncludePad(true)
                .build()
        } else {
            @Suppress("DEPRECATION")
            StaticLayout(
                subtitleText,
                textPaint,
                maxTextWidth,
                Layout.Alignment.ALIGN_CENTER,
                1.0f,
                0.0f,
                true,
            )
        }

        val layoutHeight = staticLayout.height.toFloat()
        var maxLineWidth = 0f
        for (i in 0 until staticLayout.lineCount) {
            maxLineWidth = maxOf(maxLineWidth, staticLayout.getLineWidth(i))
        }

        val padH = 16f * scaleFactor
        val padV = 10f * scaleFactor
        val offsetPx = style.verticalOffsetDp * scaleFactor

        val baseTop = when (style.verticalPosition) {
            SubtitleVerticalPosition.TOP -> height * 0.08f
            SubtitleVerticalPosition.CENTER -> (height - layoutHeight) / 2f
            SubtitleVerticalPosition.BOTTOM -> height * 0.86f - layoutHeight
        }
        val boxTop = (baseTop + offsetPx).coerceIn(16f, (height - layoutHeight - 16f).coerceAtLeast(16f))
        val boxLeft = (width - maxLineWidth) / 2f - padH
        val boxRight = (width + maxLineWidth) / 2f + padH
        val boxBottom = boxTop + layoutHeight + padV * 2f

        if (style.backgroundAlpha > 0.01f) {
            val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = Color.argb((style.backgroundAlpha.coerceIn(0f, 1f) * 255).roundToInt(), 9, 9, 15)
            }
            val rect = RectF(boxLeft, boxTop - padV, boxRight, boxBottom - padV)
            canvas.drawRoundRect(rect, 12f * scaleFactor, 12f * scaleFactor, bgPaint)
        }

        canvas.save()
        canvas.translate((width - maxTextWidth) / 2f, boxTop)
        staticLayout.draw(canvas)
        canvas.restore()
    }

    private fun writeBitmapToMediaStore(
        context: Context,
        bitmap: Bitmap,
        episodeLabel: String,
    ): Boolean {
        val resolver = context.contentResolver
        val safeName = episodeLabel.replace(Regex("""[^\p{L}\p{N}_-]+"""), "_").take(40)
        val fileName = "NOVA_${safeName}_${System.currentTimeMillis()}.png"

        val values = ContentValues().apply {
            put(MediaStore.Images.Media.DISPLAY_NAME, fileName)
            put(MediaStore.Images.Media.MIME_TYPE, "image/png")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                put(MediaStore.Images.Media.RELATIVE_PATH, "${Environment.DIRECTORY_PICTURES}/AnimeNOVA")
                put(MediaStore.Images.Media.IS_PENDING, 1)
            }
        }

        val uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values) ?: return false
        return try {
            val stream: OutputStream = resolver.openOutputStream(uri) ?: return false
            val compressed = stream.use { out ->
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val completeValues = ContentValues().apply {
                    put(MediaStore.Images.Media.IS_PENDING, 0)
                }
                resolver.update(uri, completeValues, null, null)
            }
            compressed
        } catch (_: Throwable) {
            runCatching { resolver.delete(uri, null, null) }
            false
        }
    }
}
