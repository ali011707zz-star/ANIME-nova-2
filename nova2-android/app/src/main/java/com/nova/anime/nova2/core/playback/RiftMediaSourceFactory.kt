package com.nova.anime.nova2.core.playback

import android.content.Context
import android.net.Uri
import androidx.annotation.OptIn
import androidx.media3.common.MediaItem
import androidx.media3.common.MimeTypes
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DataSource
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.datasource.okhttp.OkHttpDataSource
import androidx.media3.exoplayer.hls.HlsMediaSource
import androidx.media3.exoplayer.source.MediaSource
import androidx.media3.exoplayer.source.ProgressiveMediaSource
import okhttp3.OkHttpClient
import java.io.File
import java.util.concurrent.TimeUnit

sealed class MediaUriValidationResult {
    data class Valid(
        val uri: Uri,
        val normalizedUrl: String,
        val resolvedType: PlaybackType,
        val isLocalFile: Boolean,
    ) : MediaUriValidationResult()

    data class Invalid(
        val reasonAr: String,
    ) : MediaUriValidationResult()
}

/**
 * Validates media URLs and builds Media3 [MediaSource] instances with:
 * - Strict rejection of empty, blank, or malformed URLs before touching ExoPlayer.
 * - Explicit distinction between HLS ([HlsMediaSource]) and progressive MP4/video ([ProgressiveMediaSource]).
 * - Support for local files (`file://`, `content://`, or absolute filesystem paths).
 * - Per-source custom HTTP headers (`Referer`, `Origin`, `User-Agent`, etc.) applied via [OkHttpDataSource.Factory].
 */
object RiftMediaSourceFactory {

    private val sharedHttpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)
            .followRedirects(true)
            .followSslRedirects(true)
            .build()
    }

    private val hlsPattern = Regex(
        pattern = """\.m3u8(?:[?#]|$)|/hls(?:/|$)|hls-proxy|manifest\.m3u8""",
        option = RegexOption.IGNORE_CASE,
    )

    fun validateSourceUrl(
        rawUrl: String?,
        explicitType: PlaybackType? = null,
    ): MediaUriValidationResult {
        val trimmed = rawUrl?.trim().orEmpty()
        if (trimmed.isEmpty()) {
            return MediaUriValidationResult.Invalid("رابط المصدر فارغ — لا يمكن تمريره إلى المشغّل")
        }

        // Local absolute path without scheme
        if (trimmed.startsWith("/")) {
            val file = File(trimmed)
            val uri = Uri.fromFile(file)
            val isHls = explicitType == PlaybackType.HLS || hlsPattern.containsMatchIn(trimmed)
            return MediaUriValidationResult.Valid(
                uri = uri,
                normalizedUrl = uri.toString(),
                resolvedType = if (isHls) PlaybackType.HLS else PlaybackType.MP4,
                isLocalFile = true,
            )
        }

        val parsed = runCatching { Uri.parse(trimmed) }.getOrNull()
            ?: return MediaUriValidationResult.Invalid("صيغة رابط المصدر غير صالحة")

        val scheme = parsed.scheme?.lowercase().orEmpty()
        return when (scheme) {
            "file", "content" -> {
                if (parsed.path.isNullOrBlank() && parsed.authority.isNullOrBlank()) {
                    MediaUriValidationResult.Invalid("مسار الملف المحلي غير صالح")
                } else {
                    val isHls = explicitType == PlaybackType.HLS || hlsPattern.containsMatchIn(trimmed)
                    MediaUriValidationResult.Valid(
                        uri = parsed,
                        normalizedUrl = trimmed,
                        resolvedType = if (isHls) PlaybackType.HLS else PlaybackType.MP4,
                        isLocalFile = true,
                    )
                }
            }
            "http", "https" -> {
                val host = parsed.host?.trim().orEmpty()
                if (host.isEmpty() || host.contains(" ")) {
                    MediaUriValidationResult.Invalid("عنوان الخادم في رابط المصدر غير صالح")
                } else {
                    val isHls = explicitType == PlaybackType.HLS || hlsPattern.containsMatchIn(trimmed)
                    MediaUriValidationResult.Valid(
                        uri = parsed,
                        normalizedUrl = trimmed,
                        resolvedType = if (isHls) PlaybackType.HLS else PlaybackType.MP4,
                        isLocalFile = false,
                    )
                }
            }
            else -> MediaUriValidationResult.Invalid("بروتوكول الرابط غير مدعوم ($scheme)")
        }
    }

    /**
     * Merges default service headers with source-specific custom HTTP headers (`Referer`, `Origin`, `User-Agent`, etc.).
     * Source-specific headers take precedence.
     */
    fun buildRequestHeaders(
        source: PlaybackSource,
        defaultHeaders: Map<String, String> = emptyMap(),
    ): Map<String, String> {
        val merged = LinkedHashMap<String, String>()
        defaultHeaders.forEach { (k, v) ->
            val key = k.trim()
            val value = v.trim()
            if (key.isNotEmpty() && value.isNotEmpty()) {
                merged[key] = value
            }
        }
        source.headers.forEach { (k, v) ->
            val key = k.trim()
            val value = v.trim()
            if (key.isNotEmpty() && value.isNotEmpty()) {
                merged[key] = value
            }
        }
        return merged
    }

    @OptIn(UnstableApi::class)
    fun createMediaSource(
        context: Context,
        valid: MediaUriValidationResult.Valid,
        requestHeaders: Map<String, String>,
    ): MediaSource {
        val dataSourceFactory: DataSource.Factory = if (valid.isLocalFile) {
            DefaultDataSource.Factory(context)
        } else {
            val userAgent = requestHeaders.entries
                .firstOrNull { it.key.equals("User-Agent", ignoreCase = true) }
                ?.value
                ?: "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"

            val httpFactory = OkHttpDataSource.Factory(sharedHttpClient)
                .setUserAgent(userAgent)
                .setDefaultRequestProperties(requestHeaders)

            DefaultDataSource.Factory(context, httpFactory)
        }

        val mimeType = when (valid.resolvedType) {
            PlaybackType.HLS -> MimeTypes.APPLICATION_M3U8
            PlaybackType.MP4 -> MimeTypes.VIDEO_MP4
        }

        val mediaItem = MediaItem.Builder()
            .setUri(valid.uri)
            .setMimeType(mimeType)
            .build()

        return when (valid.resolvedType) {
            PlaybackType.HLS -> HlsMediaSource.Factory(dataSourceFactory)
                .setAllowChunklessPreparation(true)
                .createMediaSource(mediaItem)
            PlaybackType.MP4 -> ProgressiveMediaSource.Factory(dataSourceFactory)
                .createMediaSource(mediaItem)
        }
    }
}
