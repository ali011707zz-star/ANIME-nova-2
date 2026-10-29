package com.nova.anime.nova2.core.playback

import com.nova.anime.nova2.core.network.NovaApiClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit

/**
 * Decoupled service interface for optional Nova backend integrations inside RiftPlayer.
 * Does not hardcode any URLs or secrets inside the player component.
 * If a project does not configure Nova backend services, [UnconfiguredPlayerServices] is used
 * and the player relies cleanly on source-provided subtitles and skip intervals.
 */
interface PlayerServices {
    val isConfigured: Boolean

    fun defaultMediaHeaders(): Map<String, String> = emptyMap()

    suspend fun fetchSubtitleTracks(metadata: PlayerMetadata): List<SubtitleTrack> = emptyList()

    suspend fun fetchSkipTimes(metadata: PlayerMetadata, durationSeconds: Int): EpisodeSkipTimes =
        EpisodeSkipTimes()

    suspend fun fetchSubtitleText(
        url: String,
        headers: Map<String, String> = emptyMap(),
    ): String?
}

/**
 * Fallback implementation when Nova backend services are not configured.
 * Still supports downloading direct VTT/SRT files attached to a [PlayerSource].
 */
open class UnconfiguredPlayerServices(
    protected val httpClient: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(12, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build(),
) : PlayerServices {
    override val isConfigured: Boolean = false

    override suspend fun fetchSubtitleText(
        url: String,
        headers: Map<String, String>,
    ): String? = withContext(Dispatchers.IO) {
        val trimmed = url.trim()
        if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
            return@withContext null
        }
        runCatching {
            val reqBuilder = Request.Builder().url(trimmed).get()
            headers.forEach { (k, v) ->
                if (k.isNotBlank() && v.isNotBlank()) {
                    reqBuilder.header(k, v)
                }
            }
            httpClient.newCall(reqBuilder.build()).execute().use { response ->
                if (!response.isSuccessful) return@use null
                response.body?.string()
            }
        }.getOrNull()
    }
}

/**
 * Adapter bridging the existing [NovaApiClient] to [PlayerServices] without exposing
 * internal client tokens or URLs inside the player UI layer.
 */
class NovaPlayerServicesAdapter(
    private val apiClient: NovaApiClient?,
) : UnconfiguredPlayerServices() {
    override val isConfigured: Boolean
        get() = apiClient != null

    override fun defaultMediaHeaders(): Map<String, String> =
        apiClient?.mediaRequestHeaders().orEmpty()

    override suspend fun fetchSubtitleTracks(metadata: PlayerMetadata): List<SubtitleTrack> {
        val client = apiClient ?: return emptyList()
        val anilistId = metadata.anilistId ?: return emptyList()
        val episode = metadata.episodeNumber ?: return emptyList()
        return runCatching {
            val response = client.fetchSubtitleTracks(
                anilistId = anilistId,
                episode = episode,
                title = metadata.title,
                malId = metadata.malId,
            )
            val tracks = response["tracks"]?.jsonArray.orEmpty()
            tracks.mapNotNull { element ->
                val obj = runCatching { element.jsonObject }.getOrNull() ?: return@mapNotNull null
                val rawUrl = obj.str("url") ?: obj.str("src") ?: return@mapNotNull null
                val resolved = client.resolveUrl(rawUrl)
                if (!resolved.startsWith("http://") && !resolved.startsWith("https://")) {
                    return@mapNotNull null
                }
                val lang = obj.str("lang") ?: obj.str("language") ?: "ar"
                val label = obj.str("label") ?: when {
                    lang.startsWith("ar", ignoreCase = true) -> "العربية"
                    lang.startsWith("en", ignoreCase = true) -> "English"
                    else -> lang
                }
                SubtitleTrack(
                    key = obj.str("id") ?: "$lang|$resolved",
                    language = lang,
                    label = label,
                    url = resolved,
                )
            }.distinctBy { it.url }
        }.getOrDefault(emptyList())
    }

    override suspend fun fetchSkipTimes(
        metadata: PlayerMetadata,
        durationSeconds: Int,
    ): EpisodeSkipTimes {
        val client = apiClient ?: return EpisodeSkipTimes()
        val anilistId = metadata.anilistId ?: return EpisodeSkipTimes()
        val episode = metadata.episodeNumber ?: return EpisodeSkipTimes()
        return runCatching {
            val response = client.fetchSkipTimes(
                malId = metadata.malId,
                anilistId = anilistId,
                episode = episode,
                durationSeconds = durationSeconds,
            )
            val intro = response["op"].toSkipInterval() ?: response["intro"].toSkipInterval()
            val outro = response["ed"].toSkipInterval() ?: response["outro"].toSkipInterval()
            EpisodeSkipTimes(
                intro = intro?.takeIf { it.isValid(durationSeconds.toDouble()) },
                outro = outro?.takeIf { it.isValid(durationSeconds.toDouble()) },
            )
        }.getOrDefault(EpisodeSkipTimes())
    }

    override suspend fun fetchSubtitleText(
        url: String,
        headers: Map<String, String>,
    ): String? {
        val mergedHeaders = defaultMediaHeaders() + headers
        return super.fetchSubtitleText(url, mergedHeaders)
    }

    private fun JsonObject.str(key: String): String? =
        this[key]?.jsonPrimitive?.contentOrNull?.takeIf { it.isNotBlank() }

    private fun kotlinx.serialization.json.JsonElement?.toSkipInterval(): SkipInterval? {
        val obj = runCatching { this?.jsonObject }.getOrNull() ?: return null
        val start = obj["start"]?.jsonPrimitive?.doubleOrNull
            ?: obj["startTime"]?.jsonPrimitive?.doubleOrNull
            ?: return null
        val end = obj["end"]?.jsonPrimitive?.doubleOrNull
            ?: obj["endTime"]?.jsonPrimitive?.doubleOrNull
            ?: return null
        return SkipInterval(start, end)
    }
}
