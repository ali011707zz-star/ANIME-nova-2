package com.nova.anime.nova2.core.library

import com.nova.anime.nova2.core.catalog.WatchContentKind
import kotlinx.serialization.Serializable

@Serializable
data class SavedAnime(
    val id: Int,
    val title: String,
    val englishTitle: String? = null,
    val coverUrl: String? = null,
    val episodes: Int? = null,
    val score: Int? = null,
    val contentKind: String = WatchContentKind.ANIME.wireName,
    val contentKey: String = id.toString(),
    val savedAt: Long = 0L,
)

@Serializable
data class HistoryEntry(
    val animeId: Int,
    val title: String,
    val coverUrl: String? = null,
    val episode: Int,
    val season: Int = 1,
    val positionMs: Long = 0L,
    val durationMs: Long = 0L,
    val contentKind: String = WatchContentKind.ANIME.wireName,
    val contentKey: String = animeId.toString(),
    val episodeUrl: String = "",
    val catalogEpisodeId: String = "",
    val catalogMediaType: String = "series",
    val episodeTitle: String = "",
    val seasonLabel: String = "",
    val updatedAt: Long = 0L,
)

@Serializable
data class DownloadRecord(
    val downloadId: Long,
    val animeId: Int,
    val title: String,
    val coverUrl: String? = null,
    val episode: Int,
    val site: String = "nova",
    val quality: String,
    val mimeType: String = "video/mp4",
    val localUri: String? = null,
    val subtitleUrl: String? = null,
    val bytesDownloaded: Long = 0L,
    val totalBytes: Long = 0L,
    val savedToGallery: Boolean = false,
    val state: DownloadState = DownloadState.QUEUED,
    val createdAt: Long = 0L,
) {
    val progressPercent: Int
        get() = when {
            state == DownloadState.COMPLETE -> 100
            totalBytes > 0L -> ((bytesDownloaded * 100L) / totalBytes).toInt().coerceIn(0, 100)
            else -> 0
        }
}

@Serializable
enum class DownloadState {
    QUEUED,
    RUNNING,
    PAUSED,
    COMPLETE,
    FAILED,
    REMOVED,
}
