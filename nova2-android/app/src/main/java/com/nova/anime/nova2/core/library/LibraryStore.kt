package com.nova.anime.nova2.core.library

import android.content.Context
import com.nova.anime.nova2.core.catalog.AnimeCard
import com.nova.anime.nova2.core.catalog.WatchContentKind
import com.nova.anime.nova2.core.catalog.getWatchContentId
import com.nova.anime.nova2.core.model.UserFavoriteSyncPayload
import com.nova.anime.nova2.core.model.UserHistorySyncPayload
import com.nova.anime.nova2.core.model.UserProgressSyncPayload
import com.nova.anime.nova2.core.network.NovaApiClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.net.URLDecoder
import java.net.URLEncoder

/**
 * Local + Cloud synchronized LibraryStore matching artifacts/nova-mobile/context/AppContext.tsx:
 * - Isolates anonymous vs account storage keys (nova-history:account:{userId} / nova-favorites:account:{userId})
 * - Tracks deferred deletions (nova-history-deleted:{userId} / nova-favorites-deleted:{userId})
 * - Encodes/decodes non-anime kinds (dubbed, aw-dubbed, stardima) in serverAnimeType
 */
class LibraryStore(
    context: Context,
    private val apiClient: NovaApiClient? = null,
) {
    private val preferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
    }

    @Volatile
    private var activeUserId: String? = null

    private val _favorites = MutableStateFlow(readFavoritesForOwner(null))
    val favorites: StateFlow<List<SavedAnime>> = _favorites.asStateFlow()

    private val _history = MutableStateFlow(readHistoryForOwner(null))
    val history: StateFlow<List<HistoryEntry>> = _history.asStateFlow()

    private val _downloads = MutableStateFlow(
        readList(DOWNLOADS_KEY, ListSerializer(DownloadRecord.serializer())),
    )
    val downloads: StateFlow<List<DownloadRecord>> = _downloads.asStateFlow()

    /** Switch active storage namespace when user logs in or logs out. */
    @Synchronized
    fun bindUserSession(userId: String?) {
        val cleaned = userId?.trim()?.takeIf { it.isNotEmpty() }
        if (activeUserId == cleaned) return
        activeUserId = cleaned
        _favorites.value = readFavoritesForOwner(cleaned)
        _history.value = readHistoryForOwner(cleaned)
        if (cleaned != null && apiClient != null) {
            scope.launch { syncWithServer(cleaned, apiClient) }
        }
    }

    @Synchronized
    fun toggleFavorite(anime: AnimeCard): Boolean {
        val surrogateId = if (anime.contentKind == WatchContentKind.ANIME) {
            anime.id
        } else {
            getWatchContentId(anime.contentKind, anime.contentKey)
        }
        val current = _favorites.value
        val exists = current.any { it.id == surrogateId }
        val userId = activeUserId

        val next = if (exists) {
            current.filterNot { it.id == surrogateId }
        } else {
            listOf(
                SavedAnime(
                    id = surrogateId,
                    title = anime.title,
                    englishTitle = anime.englishTitle,
                    coverUrl = anime.coverUrl,
                    episodes = anime.episodes,
                    score = anime.score,
                    contentKind = anime.contentKind.wireName,
                    contentKey = anime.contentKey,
                    savedAt = now(),
                ),
            ) + current
        }
        setFavorites(next)

        if (userId != null && apiClient != null) {
            scope.launch {
                val deletedKey = favoritesDeletedKey(userId)
                val deleted = readIntSet(deletedKey)
                if (exists) {
                    writeIntSet(deletedKey, deleted + surrogateId)
                    runCatching { apiClient.deleteServerFavorite(surrogateId) }.onSuccess {
                        writeIntSet(deletedKey, deleted - surrogateId)
                    }
                } else {
                    if (surrogateId in deleted) writeIntSet(deletedKey, deleted - surrogateId)
                    runCatching {
                        apiClient.postServerFavorite(
                            UserFavoriteSyncPayload(
                                animeId = surrogateId,
                                animeTitle = anime.title,
                                animeCover = anime.coverUrl,
                                animeType = anime.contentKind.wireName,
                                score = anime.score,
                                episodes = anime.episodes,
                            ),
                        )
                    }
                }
            }
        }
        return !exists
    }

    fun isFavorite(animeId: Int): Boolean = _favorites.value.any { it.id == animeId }

    @Synchronized
    fun recordHistory(
        animeId: Int,
        title: String,
        coverUrl: String?,
        episode: Int,
        positionMs: Long = 0L,
        durationMs: Long = 0L,
        season: Int = 1,
        contentKind: WatchContentKind = WatchContentKind.ANIME,
        contentKey: String = animeId.toString(),
        episodeUrl: String = "",
        seasonLabel: String = "",
    ) {
        val resolvedId = if (contentKind == WatchContentKind.ANIME) {
            animeId
        } else {
            getWatchContentId(contentKind, contentKey)
        }
        val entry = HistoryEntry(
            animeId = resolvedId,
            title = title.ifBlank { "أنمي #$resolvedId" },
            coverUrl = coverUrl,
            episode = episode,
            season = season,
            positionMs = positionMs.coerceAtLeast(0L),
            durationMs = durationMs.coerceAtLeast(0L),
            contentKind = contentKind.wireName,
            contentKey = contentKey,
            episodeUrl = episodeUrl,
            seasonLabel = seasonLabel,
            updatedAt = now(),
        )
        val next = listOf(entry) + _history.value.filterNot {
            it.contentKind == entry.contentKind &&
                it.contentKey == entry.contentKey &&
                it.episode == entry.episode &&
                it.season == entry.season
        }
        setHistory(next.take(MAX_HISTORY_ITEMS))

        val userId = activeUserId
        if (userId != null && apiClient != null) {
            scope.launch {
                val deletedKey = historyDeletedKey(userId)
                val deleted = readIntSet(deletedKey)
                if (resolvedId in deleted) writeIntSet(deletedKey, deleted - resolvedId)
                runCatching {
                    apiClient.postServerHistory(
                        UserHistorySyncPayload(
                            animeId = resolvedId,
                            animeTitle = entry.title,
                            animeCover = entry.coverUrl,
                            animeType = encodeServerAnimeType(entry),
                            episodeNumber = entry.episode,
                            seasonNumber = entry.season,
                        ),
                    )
                    if (positionMs > 0L) {
                        apiClient.postServerWatchProgress(
                            UserProgressSyncPayload(
                                animeId = resolvedId,
                                animeType = encodeServerAnimeType(entry),
                                episodeNumber = entry.episode,
                                seasonNumber = entry.season,
                                progressSeconds = (positionMs / 1000L).toInt(),
                                durationSeconds = (durationMs / 1000L).toInt(),
                            ),
                        )
                    }
                }
            }
        }
    }

    fun getSavedPositionMs(animeId: Int, episode: Int): Long =
        _history.value.firstOrNull { it.animeId == animeId && it.episode == episode }?.positionMs ?: 0L

    @Synchronized
    fun removeHistory(entry: HistoryEntry) {
        setHistory(
            _history.value.filterNot {
                it.animeId == entry.animeId && it.episode == entry.episode
            },
        )
        val userId = activeUserId
        if (userId != null && apiClient != null) {
            scope.launch {
                val key = historyDeletedKey(userId)
                val deleted = readIntSet(key)
                writeIntSet(key, deleted + entry.animeId)
                runCatching { apiClient.deleteServerHistoryAnime(entry.animeId) }.onSuccess {
                    writeIntSet(key, deleted - entry.animeId)
                }
            }
        }
    }

    @Synchronized
    fun addDownload(record: DownloadRecord) {
        setDownloads(listOf(record) + _downloads.value.filterNot { it.downloadId == record.downloadId })
    }

    @Synchronized
    fun updateDownload(record: DownloadRecord) {
        setDownloads(
            _downloads.value.map {
                if (it.downloadId == record.downloadId) record else it
            },
        )
    }

    @Synchronized
    fun removeDownload(downloadId: Long) {
        setDownloads(_downloads.value.filterNot { it.downloadId == downloadId })
    }

    fun findCompletedDownload(animeId: Int, episode: Int): DownloadRecord? =
        _downloads.value.firstOrNull {
            it.animeId == animeId &&
                it.episode == episode &&
                it.state == DownloadState.COMPLETE &&
                !it.localUri.isNullOrBlank()
        }

    @Synchronized
    fun clearHistory() {
        setHistory(emptyList())
        val userId = activeUserId
        if (userId != null && apiClient != null) {
            preferences.edit().putBoolean(historyClearPendingKey(userId), true).apply()
            scope.launch {
                runCatching { apiClient.clearServerHistory() }.onSuccess {
                    preferences.edit().remove(historyClearPendingKey(userId)).apply()
                }
            }
        }
    }

    @Synchronized
    fun clearFavorites() {
        setFavorites(emptyList())
        val userId = activeUserId
        if (userId != null && apiClient != null) {
            preferences.edit().putBoolean(favoritesClearPendingKey(userId), true).apply()
            scope.launch {
                runCatching { apiClient.clearServerFavorites() }.onSuccess {
                    preferences.edit().remove(favoritesClearPendingKey(userId)).apply()
                }
            }
        }
    }

    @Synchronized
    fun clearDownloads() = setDownloads(emptyList())

    private suspend fun syncWithServer(userId: String, api: NovaApiClient) {
        // Flush pending full clears first
        if (preferences.getBoolean(favoritesClearPendingKey(userId), false)) {
            if (runCatching { api.clearServerFavorites() }.isSuccess) {
                preferences.edit().remove(favoritesClearPendingKey(userId)).apply()
            }
        }
        if (preferences.getBoolean(historyClearPendingKey(userId), false)) {
            if (runCatching { api.clearServerHistory() }.isSuccess) {
                preferences.edit().remove(historyClearPendingKey(userId)).apply()
            }
        }

        val deletedFavs = readIntSet(favoritesDeletedKey(userId))
        runCatching { api.fetchServerFavorites() }.getOrNull()?.let { payload ->
            val remoteList = payload["favorites"]?.jsonArray?.mapNotNull { el ->
                val obj = el.jsonObject
                val id = obj["anime_id"]?.jsonPrimitive?.intOrNull ?: return@mapNotNull null
                if (id in deletedFavs) return@mapNotNull null
                SavedAnime(
                    id = id,
                    title = obj["anime_title"]?.jsonPrimitive?.contentOrNull ?: "أنمي #$id",
                    coverUrl = obj["anime_cover"]?.jsonPrimitive?.contentOrNull,
                    episodes = obj["episodes"]?.jsonPrimitive?.intOrNull,
                    score = obj["score"]?.jsonPrimitive?.intOrNull,
                    contentKind = obj["anime_type"]?.jsonPrimitive?.contentOrNull ?: "anime",
                    contentKey = id.toString(),
                    savedAt = now(),
                )
            }.orEmpty()
            if (remoteList.isNotEmpty() && activeUserId == userId) {
                val merged = (_favorites.value + remoteList).distinctBy { it.id }
                setFavorites(merged)
            }
        }

        val deletedHist = readIntSet(historyDeletedKey(userId))
        runCatching { api.fetchServerHistory() }.getOrNull()?.let { payload ->
            val remoteHist = payload["history"]?.jsonArray?.mapNotNull { el ->
                val obj = el.jsonObject
                val id = obj["anime_id"]?.jsonPrimitive?.intOrNull ?: return@mapNotNull null
                if (id in deletedHist) return@mapNotNull null
                val rawType = obj["anime_type"]?.jsonPrimitive?.contentOrNull ?: "anime"
                val decoded = decodeServerAnimeType(rawType)
                HistoryEntry(
                    animeId = id,
                    title = obj["anime_title"]?.jsonPrimitive?.contentOrNull ?: "أنمي #$id",
                    coverUrl = obj["anime_cover"]?.jsonPrimitive?.contentOrNull,
                    episode = obj["episode_number"]?.jsonPrimitive?.intOrNull ?: 1,
                    season = obj["season_number"]?.jsonPrimitive?.intOrNull ?: 1,
                    contentKind = decoded.kind,
                    contentKey = decoded.key.ifBlank { id.toString() },
                    episodeUrl = decoded.episodeUrl,
                    seasonLabel = decoded.seasonLabel,
                    updatedAt = now(),
                )
            }.orEmpty()
            if (remoteHist.isNotEmpty() && activeUserId == userId) {
                val merged = (_history.value + remoteHist)
                    .distinctBy { "${it.contentKind}:${it.contentKey}:${it.episode}" }
                    .take(MAX_HISTORY_ITEMS)
                setHistory(merged)
            }
        }
    }

    private fun encodeServerAnimeType(item: HistoryEntry): String {
        if (item.contentKind == WatchContentKind.ANIME.wireName) return "anime"
        val encKey = urlEncode(item.contentKey)
        val encSeason = urlEncode(item.seasonLabel)
        return when (item.contentKind) {
            WatchContentKind.STARDIMA.wireName ->
                "stardima:$encKey:${urlEncode(item.catalogEpisodeId)}:${urlEncode(item.catalogMediaType)}:$encSeason:${urlEncode(item.episodeTitle)}"
            WatchContentKind.DUBBED.wireName ->
                "dubbed:$encKey:${urlEncode(item.episodeUrl)}:$encSeason"
            else ->
                "${item.contentKind}:$encKey:$encSeason"
        }
    }

    private data class DecodedAnimeType(
        val kind: String,
        val key: String,
        val episodeUrl: String,
        val seasonLabel: String,
    )

    private fun decodeServerAnimeType(raw: String): DecodedAnimeType {
        val parts = raw.split(":")
        val kind = parts.firstOrNull().orEmpty()
        if (kind !in listOf("dubbed", "aw-dubbed", "stardima") || parts.size < 2) {
            return DecodedAnimeType("anime", "", "", "")
        }
        return DecodedAnimeType(
            kind = kind,
            key = urlDecode(parts.getOrNull(1).orEmpty()),
            episodeUrl = if (kind == "dubbed") urlDecode(parts.getOrNull(2).orEmpty()) else "",
            seasonLabel = urlDecode(parts.getOrNull(if (kind == "dubbed") 3 else 2).orEmpty()),
        )
    }

    private fun urlEncode(value: String): String =
        runCatching { URLEncoder.encode(value, "UTF-8") }.getOrDefault(value)

    private fun urlDecode(value: String): String =
        runCatching { URLDecoder.decode(value, "UTF-8") }.getOrDefault(value)

    private fun readFavoritesForOwner(userId: String?): List<SavedAnime> =
        readList(favoritesKey(userId), ListSerializer(SavedAnime.serializer()))

    private fun readHistoryForOwner(userId: String?): List<HistoryEntry> =
        readList(historyKey(userId), ListSerializer(HistoryEntry.serializer()))

    private fun setFavorites(value: List<SavedAnime>) {
        _favorites.value = value
        writeList(favoritesKey(activeUserId), value, ListSerializer(SavedAnime.serializer()))
    }

    private fun setHistory(value: List<HistoryEntry>) {
        _history.value = value
        writeList(historyKey(activeUserId), value, ListSerializer(HistoryEntry.serializer()))
    }

    private fun setDownloads(value: List<DownloadRecord>) {
        _downloads.value = value
        writeList(DOWNLOADS_KEY, value, ListSerializer(DownloadRecord.serializer()))
    }

    private fun readIntSet(key: String): Set<Int> =
        readList(key, ListSerializer(Int.serializer())).toSet()

    private fun writeIntSet(key: String, values: Set<Int>) =
        writeList(key, values.toList(), ListSerializer(Int.serializer()))

    private fun <T> readList(key: String, serializer: kotlinx.serialization.KSerializer<List<T>>): List<T> {
        val value = preferences.getString(key, null) ?: return emptyList()
        return runCatching { json.decodeFromString(serializer, value) }.getOrDefault(emptyList())
    }

    private fun <T> writeList(
        key: String,
        value: List<T>,
        serializer: kotlinx.serialization.KSerializer<List<T>>,
    ) {
        preferences.edit().putString(key, json.encodeToString(serializer, value)).apply()
    }

    private fun favoritesKey(userId: String?): String =
        if (userId.isNullOrBlank()) FAVORITES_KEY else "nova-favorites:account:$userId"

    private fun historyKey(userId: String?): String =
        if (userId.isNullOrBlank()) HISTORY_KEY else "nova-history:account:$userId"

    private fun favoritesDeletedKey(userId: String): String = "nova-favorites-deleted:$userId"
    private fun historyDeletedKey(userId: String): String = "nova-history-deleted:$userId"
    private fun favoritesClearPendingKey(userId: String): String = "nova-favorites-clear-pending:$userId"
    private fun historyClearPendingKey(userId: String): String = "nova-history-clear-pending:$userId"

    private fun now(): Long = System.currentTimeMillis()

    private companion object {
        const val PREFERENCES_NAME = "nova2_library"
        const val FAVORITES_KEY = "nova-favorites"
        const val HISTORY_KEY = "nova-history"
        const val DOWNLOADS_KEY = "nova-downloads-v3"
        const val MAX_HISTORY_ITEMS = 100
    }
}
