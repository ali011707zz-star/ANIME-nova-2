package com.nova.anime.nova2.core.download

import android.app.DownloadManager
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import com.nova.anime.nova2.core.catalog.AnimeDetails
import com.nova.anime.nova2.core.catalog.EpisodeItem
import com.nova.anime.nova2.core.library.DownloadRecord
import com.nova.anime.nova2.core.library.DownloadState
import com.nova.anime.nova2.core.library.LibraryStore
import com.nova.anime.nova2.core.network.NovaApiClient
import com.nova.anime.nova2.core.playback.PlaybackSource
import com.nova.anime.nova2.core.playback.PlaybackType
import java.io.File
import java.util.Locale

class DownloadRepository(
    context: Context,
    private val libraryStore: LibraryStore,
    private val apiClient: NovaApiClient,
) {
    private val appContext = context.applicationContext
    private val downloadManager =
        appContext.getSystemService(DownloadManager::class.java)

    /**
     * Enqueues an official MP4 download via Android DownloadManager.
     * HLS (.m3u8) streams are explicitly rejected because offline HLS packaging is not
     * supported by the server's /api/anime/download-mp4 contract.
     */
    fun enqueue(
        details: AnimeDetails,
        episode: EpisodeItem,
        source: PlaybackSource,
    ): DownloadRecord? {
        if (source.type == PlaybackType.HLS) return null
        val downloadUrl = apiClient.buildDownloadUrl(source.site, source.url) ?: return null
        val safeTitle = sourceName(details.card.title)
        val safeQuality = sourceName(source.quality)
        val request = DownloadManager.Request(Uri.parse(downloadUrl))
            .setTitle("${details.card.title} · الحلقة ${episode.number}")
            .setDescription("Anime NOVA · ${source.quality}")
            .setMimeType("video/mp4")
            .setAllowedOverMetered(true)
            .setAllowedOverRoaming(true)
            .setNotificationVisibility(
                DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED,
            )
            .setDestinationInExternalFilesDir(
                appContext,
                Environment.DIRECTORY_MOVIES,
                "AnimeNOVA/$safeTitle/episode-${episode.number}-$safeQuality.mp4",
            )

        apiClient.mediaRequestHeaders().forEach { (name, value) ->
            if (name.isNotBlank() && value.isNotBlank()) request.addRequestHeader(name, value)
        }

        val id = downloadManager.enqueue(request)
        return DownloadRecord(
            downloadId = id,
            animeId = details.card.id,
            title = details.card.title,
            coverUrl = details.card.coverUrl,
            episode = episode.number,
            site = source.site,
            quality = source.quality,
            subtitleUrl = source.embeddedSubtitles.firstOrNull()?.url,
            createdAt = System.currentTimeMillis(),
        ).also(libraryStore::addDownload)
    }

    fun refresh(): List<DownloadRecord> {
        val refreshed = libraryStore.downloads.value.map(::queryRecord)
        refreshed.forEach { record ->
            if (record.state == DownloadState.REMOVED) {
                libraryStore.removeDownload(record.downloadId)
            } else {
                libraryStore.updateDownload(record)
            }
        }
        return libraryStore.downloads.value
    }

    fun cancel(record: DownloadRecord) {
        downloadManager.remove(record.downloadId)
        libraryStore.removeDownload(record.downloadId)
    }

    fun openIntent(record: DownloadRecord): Intent? {
        val uri = record.localUri?.let(Uri::parse) ?: queryUri(record.downloadId) ?: return null
        return Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, record.mimeType)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
    }

    /**
     * Copies a completed MP4 download into the device's public Movies/AnimeNOVA gallery folder
     * via MediaStore (matches saveDownloadToGallery in artifacts/nova-mobile/utils/downloadManager.ts).
     */
    fun saveToGallery(record: DownloadRecord): Boolean {
        if (record.state != DownloadState.COMPLETE) return false
        val localUriStr = record.localUri ?: queryUri(record.downloadId)?.toString() ?: return false
        val sourceUri = Uri.parse(localUriStr)
        val resolver = appContext.contentResolver
        val displayName = "${sourceName(record.title)}-ep-${record.episode}-${sourceName(record.quality)}.mp4"

        val values = ContentValues().apply {
            put(MediaStore.Video.Media.DISPLAY_NAME, displayName)
            put(MediaStore.Video.Media.MIME_TYPE, "video/mp4")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                put(MediaStore.Video.Media.RELATIVE_PATH, "${Environment.DIRECTORY_MOVIES}/AnimeNOVA")
                put(MediaStore.Video.Media.IS_PENDING, 1)
            }
        }

        val targetUri = resolver.insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, values) ?: return false
        val copied = runCatching {
            val input = when (sourceUri.scheme) {
                "file" -> File(sourceUri.path ?: return false).inputStream()
                else -> resolver.openInputStream(sourceUri) ?: return false
            }
            input.use { inStream ->
                resolver.openOutputStream(targetUri)?.use { outStream ->
                    inStream.copyTo(outStream)
                } ?: error("Failed to open gallery output stream")
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val doneValues = ContentValues().apply { put(MediaStore.Video.Media.IS_PENDING, 0) }
                resolver.update(targetUri, doneValues, null, null)
            }
            true
        }.getOrElse {
            resolver.delete(targetUri, null, null)
            false
        }

        if (copied) {
            libraryStore.updateDownload(record.copy(savedToGallery = true))
        }
        return copied
    }

    private fun queryRecord(record: DownloadRecord): DownloadRecord {
        val cursor = runCatching {
            downloadManager.query(DownloadManager.Query().setFilterById(record.downloadId))
        }.getOrNull() ?: return record
        cursor.use {
            if (!it.moveToFirst()) return record.copy(state = DownloadState.REMOVED)
            val status = it.getInt(it.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))
            val bytesSoFar = it.getLong(it.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR))
                .coerceAtLeast(0L)
            val totalBytes = it.getLong(it.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES))
                .coerceAtLeast(0L)
            val state = when (status) {
                DownloadManager.STATUS_PENDING -> DownloadState.QUEUED
                DownloadManager.STATUS_RUNNING -> DownloadState.RUNNING
                DownloadManager.STATUS_PAUSED -> DownloadState.PAUSED
                DownloadManager.STATUS_SUCCESSFUL -> DownloadState.COMPLETE
                DownloadManager.STATUS_FAILED -> DownloadState.FAILED
                else -> record.state
            }
            val uri = it.getString(
                it.getColumnIndexOrThrow(DownloadManager.COLUMN_LOCAL_URI),
            )
            return record.copy(
                state = state,
                localUri = uri ?: record.localUri,
                bytesDownloaded = bytesSoFar,
                totalBytes = totalBytes,
            )
        }
    }

    private fun queryUri(downloadId: Long): Uri? {
        val cursor = runCatching {
            downloadManager.query(DownloadManager.Query().setFilterById(downloadId))
        }.getOrNull() ?: return null
        cursor.use {
            if (!it.moveToFirst()) return null
            val uri = it.getString(it.getColumnIndexOrThrow(DownloadManager.COLUMN_LOCAL_URI))
            return uri?.let(Uri::parse)
        }
    }

    private fun sourceName(value: String): String =
        value.lowercase(Locale.ROOT)
            .replace(Regex("[^a-z0-9\\u0600-\\u06ff]+"), "-")
            .trim('-')
            .take(60)
            .ifBlank { "anime" }
}
