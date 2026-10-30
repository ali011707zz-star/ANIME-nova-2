package com.nova.anime.nova2.core.network

import com.nova.anime.nova2.core.config.NovaBuildConfig
import com.nova.anime.nova2.core.model.AnonymousTokenResponse
import com.nova.anime.nova2.core.model.ApiErrorDto
import com.nova.anime.nova2.core.model.AuthResponse
import com.nova.anime.nova2.core.model.BasicOkResponse
import com.nova.anime.nova2.core.model.CrashReportPayload
import com.nova.anime.nova2.core.model.CreateCommentRequest
import com.nova.anime.nova2.core.model.DeviceLinkClaimRequest
import com.nova.anime.nova2.core.model.DeviceLinkClaimResponse
import com.nova.anime.nova2.core.model.DeviceLinkRequestResponse
import com.nova.anime.nova2.core.model.GraphQlRequest
import com.nova.anime.nova2.core.model.LinkedDevicesResponse
import com.nova.anime.nova2.core.model.NewsResponseDto
import com.nova.anime.nova2.core.model.ProfileUpdateRequest
import com.nova.anime.nova2.core.model.RemoteConfigResponse
import com.nova.anime.nova2.core.model.ReportSubmitRequest
import com.nova.anime.nova2.core.model.SignInRequest
import com.nova.anime.nova2.core.model.SignUpRequest
import com.nova.anime.nova2.core.model.SourceRequest
import com.nova.anime.nova2.core.model.SourceStreamEvent
import com.nova.anime.nova2.core.model.StardimaResolveRequest
import com.nova.anime.nova2.core.model.UserDto
import com.nova.anime.nova2.core.model.UserFavoriteSyncPayload
import com.nova.anime.nova2.core.model.UserHistorySyncPayload
import com.nova.anime.nova2.core.model.UserProgressSyncPayload
import com.nova.anime.nova2.core.model.VerifyCodeRequest
import com.nova.anime.nova2.core.storage.StoredToken
import com.nova.anime.nova2.core.storage.TokenStore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.serializer
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okio.BufferedSource
import java.io.IOException
import java.util.Locale
import java.util.concurrent.TimeUnit

class NovaApiClient(
    val tokenStore: TokenStore,
    private val httpClient: OkHttpClient = defaultHttpClient(),
    private val json: Json = novaJson,
) {
    private val tokenMutex = Mutex()

    /**
     * Load and verify a custom API URL persisted in settings (matches utils/baseUrl.ts).
     * If /health fails or times out within 4 seconds, reverts to the default server URL.
     */
    suspend fun initializeRuntimeApiUrl(): String = withContext(Dispatchers.IO) {
        val saved = tokenStore.readCustomApiUrl() ?: return@withContext NovaBuildConfig.identity.apiUrl
        val ok = probeServerHealth(saved)
        if (ok) {
            NovaBuildConfig.identity.runtimeApiUrl = saved
        } else {
            tokenStore.writeCustomApiUrl(null)
            NovaBuildConfig.identity.runtimeApiUrl = null
        }
        NovaBuildConfig.identity.apiUrl
    }

    suspend fun probeAndSetCustomApiUrl(candidateUrl: String?): Boolean = withContext(Dispatchers.IO) {
        val cleaned = candidateUrl?.trim()?.trimEnd('/')
        if (cleaned.isNullOrBlank()) {
            tokenStore.writeCustomApiUrl(null)
            NovaBuildConfig.identity.runtimeApiUrl = null
            return@withContext true
        }
        val normalized = if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
            cleaned
        } else {
            "https://$cleaned"
        }
        if (probeServerHealth(normalized)) {
            tokenStore.writeCustomApiUrl(normalized)
            NovaBuildConfig.identity.runtimeApiUrl = normalized
            true
        } else {
            false
        }
    }

    private fun probeServerHealth(baseUrl: String): Boolean {
        val probeClient = httpClient.newBuilder()
            .connectTimeout(4, TimeUnit.SECONDS)
            .readTimeout(4, TimeUnit.SECONDS)
            .build()
        return runCatching {
            val req = Request.Builder()
                .url("${baseUrl.trimEnd('/')}/health")
                .get()
                .build()
            probeClient.newCall(req).execute().use { it.isSuccessful }
        }.getOrDefault(false)
    }

    suspend fun fetchRemoteConfig(): RemoteConfigResponse =
        getJson("/api/config")

    suspend fun fetchCurrentUser(): UserDto =
        getJson("/api/auth/me")

    suspend fun signIn(email: String, password: String): AuthResponse =
        postPublicJson("/api/auth/signin", SignInRequest(email.trim().lowercase(), password))

    suspend fun sendSignupVerificationCode(email: String): JsonObject =
        postPublicJson(
            "/api/auth/send-verify-code",
            VerifyCodeRequest(email.trim().lowercase()),
        )

    suspend fun signUp(
        email: String,
        password: String,
        displayName: String?,
        verifyCode: String,
    ): AuthResponse =
        postPublicJson(
            "/api/auth/signup",
            SignUpRequest(
                email = email.trim().lowercase(),
                password = password,
                displayName = displayName?.trim()?.takeIf { it.isNotEmpty() },
                verifyCode = verifyCode.trim(),
            ),
        )

    suspend fun signOut(): BasicOkResponse =
        postJson("/api/auth/signout", EmptyJsonRequest())

    suspend fun updateProfile(payload: ProfileUpdateRequest): JsonObject =
        patchJson("/api/auth/profile", payload)

    // ── TV Device Link Contracts (routes/deviceLink.ts) ──────────────────────
    suspend fun requestDeviceLinkCode(): DeviceLinkRequestResponse =
        postJson("/api/device-link/request", EmptyJsonRequest())

    suspend fun claimDeviceLinkCode(
        code: String,
        deviceName: String = "Android TV",
    ): DeviceLinkClaimResponse =
        postPublicJson(
            "/api/device-link/claim",
            DeviceLinkClaimRequest(
                code = code.trim(),
                deviceId = tokenStore.readOrCreateDeviceId(),
                platform = "android-tv",
                deviceName = deviceName,
            ),
        )

    suspend fun fetchLinkedDevices(): LinkedDevicesResponse =
        getJson("/api/device-link/devices")

    suspend fun revokeLinkedDevice(id: String): BasicOkResponse =
        deleteJson("/api/device-link/devices/$id")

    suspend fun sendDeviceHeartbeat(): BasicOkResponse =
        postJson("/api/device-link/heartbeat", EmptyJsonRequest())

    // ── Catalog & Metadata Contracts ─────────────────────────────────────────
    suspend fun queryAniList(
        query: String,
        variables: JsonObject = JsonObject(emptyMap()),
    ): JsonObject = withContext(Dispatchers.IO) {
        runCatching {
            postPublicJson<JsonObject, GraphQlRequest>("/api/anilist", GraphQlRequest(query, variables))
        }.getOrElse {
            val payload = json.encodeToString(
                serializer<GraphQlRequest>(),
                GraphQlRequest(query, variables),
            )
            val request = Request.Builder()
                .url("https://graphql.anilist.co")
                .header("Accept", "application/json")
                .header("Content-Type", "application/json")
                .post(payload.toRequestBody(JSON_MEDIA_TYPE))
                .build()
            executeUnauthenticated(request).use { parseBody(it) }
        }
    }

    suspend fun fetchLatestFromProvider(endpoint: String): JsonElement =
        getJson("/api/anime/$endpoint")

    suspend fun searchArabicTitleIds(query: String): JsonObject =
        getJson("/api/anime/title-ar/search", mapOf("q" to query))

    suspend fun fetchEpisodeTitles(
        malId: Int,
        anilistId: Int,
        page: Int = 1,
    ): JsonObject =
        getJson(
            "/api/anime/episode-titles",
            mapOf(
                "malId" to malId.toString(),
                "anilistId" to anilistId.toString(),
                "page" to page.toString(),
            ),
        )

    suspend fun translateText(
        text: String,
        from: String = "ar",
        to: String = "en",
        kind: String = "search",
    ): JsonObject =
        getJson(
            "/api/anime/translate",
            mapOf(
                "text" to text,
                "from" to from,
                "to" to to,
                "kind" to kind,
            ),
        )

    suspend fun translateSearchText(text: String): JsonObject =
        translateText(text, from = "ar", to = "en", kind = "search")

    suspend fun fetchSkipTimes(
        malId: Int?,
        anilistId: Int,
        episode: Int,
        durationSeconds: Int = 0,
    ): JsonObject =
        getJson(
            "/api/anime/skip-times",
            buildMap {
                put("anilistId", anilistId.toString())
                put("ep", episode.toString())
                malId?.takeIf { it > 0 }?.let { put("malId", it.toString()) }
                if (durationSeconds > 0) put("duration", durationSeconds.toString())
            },
        )

    suspend fun fetchSubtitleTracks(
        anilistId: Int,
        episode: Int,
        title: String,
        english: String? = null,
        malId: Int? = null,
        season: Int = 1,
    ): JsonObject =
        getJson(
            "/api/anime/subtitle-tracks",
            buildMap {
                put("anilistId", anilistId.toString())
                put("ep", episode.toString())
                put("season", season.toString())
                put("title", title)
                english?.takeIf(String::isNotBlank)?.let { put("english", it) }
                malId?.let { put("malId", it.toString()) }
            },
        )

    suspend fun fetchSingleSource(request: SourceRequest): JsonObject =
        getJson("/api/anime/fetch-source", request.toQuery())

    suspend fun fetchAnimeMetadata(id: String, source: String? = null): JsonObject =
        getJson(
            "/api/anime/meta-by-id",
            buildMap {
                put("id", id)
                if (!source.isNullOrBlank()) put("source", source)
            },
        )

    // ── Dubbed, Carateen, AW-Dubbed, Animation & StarDima Contracts ──────────
    suspend fun fetchDubbedCatalog(page: Int = 1): JsonElement =
        getJson("/api/dubbed/catalog", mapOf("page" to page.toString()))

    suspend fun searchDubbed(query: String): JsonElement =
        getJson("/api/dubbed/search", mapOf("q" to query))

    suspend fun fetchDubbedEpisodes(series: String): JsonElement =
        getJson("/api/dubbed/episodes", mapOf("series" to series))

    suspend fun fetchDubbedWatchSources(epUrl: String): JsonElement =
        getJson("/api/dubbed/watch-src", mapOf("epUrl" to epUrl))

    suspend fun fetchCarateenCatalog(provider: String = "spacetoon", page: Int = 1): JsonElement =
        getJson("/api/dubbed/carateen/catalog", mapOf("provider" to provider, "page" to page.toString()))

    suspend fun fetchCarateenEpisodes(provider: String, showId: String): JsonElement =
        getJson("/api/dubbed/carateen/episodes", mapOf("provider" to provider, "showId" to showId))

    suspend fun fetchCarateenWatchSources(provider: String, showId: String, episodeId: String): JsonElement =
        getJson(
            "/api/dubbed/carateen/watch-src",
            mapOf("provider" to provider, "showId" to showId, "episodeId" to episodeId),
        )

    suspend fun fetchAwDubbedCatalog(page: Int = 1, query: String? = null): JsonElement =
        getJson(
            "/api/aw-dubbed/catalog",
            buildMap {
                put("page", page.toString())
                query?.takeIf(String::isNotBlank)?.let { put("q", it) }
            },
        )

    suspend fun fetchAwDubbedEpisodes(series: String): JsonElement =
        getJson("/api/aw-dubbed/episodes", mapOf("series" to series))

    suspend fun fetchAwDubbedWatchSources(series: String, episode: Int): JsonElement =
        getJson("/api/aw-dubbed/watch-src", mapOf("series" to series, "ep" to episode.toString()))

    suspend fun fetchAnimationBrowse(
        type: String = "tv",
        genre: String = "",
        sort: String = "popularity.desc",
        year: String = "",
        page: Int = 1,
    ): JsonObject =
        getJson(
            "/api/animation/browse",
            buildMap {
                put("type", type)
                if (genre.isNotBlank()) put("genre", genre)
                put("sort", sort)
                if (year.isNotBlank()) put("year", year)
                put("page", page.toString())
            },
        )

    suspend fun searchAnimation(query: String, type: String = "tv"): JsonObject =
        getJson("/api/animation/search", mapOf("q" to query, "type" to type))

    suspend fun fetchAnimationDetail(type: String, id: String): JsonObject =
        getJson("/api/animation/detail", mapOf("type" to type, "id" to id))

    suspend fun fetchAnimationSeason(id: String, season: Int): JsonObject =
        getJson("/api/animation/season", mapOf("id" to id, "season" to season.toString()))

    suspend fun fetchStardimaCategories(): JsonObject =
        getJson("/api/source-catalog/categories", mapOf("provider" to "stardima_catalog"))

    suspend fun fetchStardimaTitles(
        page: Int = 1,
        mediaType: String = "",
        category: String = "",
        localization: String = "",
        query: String = "",
    ): JsonObject =
        getJson(
            "/api/source-catalog/titles",
            buildMap {
                put("provider", "stardima_catalog")
                put("page", page.toString())
                put("limit", "30")
                if (mediaType.isNotBlank()) put("mediaType", mediaType)
                if (category.isNotBlank()) put("category", category)
                if (localization.isNotBlank()) put("localization", localization)
                if (query.isNotBlank()) put("q", query)
            },
        )

    suspend fun fetchStardimaTitleDetails(providerTitleId: String): JsonObject =
        getJson("/api/source-catalog/titles/stardima_catalog/$providerTitleId")

    suspend fun fetchStardimaEpisodeServers(episodeId: String): JsonObject =
        getJson("/api/source-catalog/episodes/$episodeId/servers")

    suspend fun resolveStardimaStream(watchUrl: String, referer: String? = null): JsonObject =
        postJson("/api/anime/stardima/resolve", StardimaResolveRequest(watchUrl, referer))

    // ── News, Comments, User Data Sync & Reports ─────────────────────────────
    suspend fun fetchNews(page: Int = 1, limit: Int = 20): NewsResponseDto =
        getJson("/api/news", mapOf("page" to page.toString(), "limit" to limit.toString()))

    suspend fun fetchComments(
        animeId: Int? = null,
        tmdbId: String? = null,
        episodeNumber: Int? = null,
    ): JsonObject =
        getJson(
            "/api/comments",
            buildMap {
                animeId?.let { put("animeId", it.toString()) }
                tmdbId?.takeIf(String::isNotBlank)?.let { put("tmdbId", it) }
                episodeNumber?.let { put("episodeNumber", it.toString()) }
            },
        )

    suspend fun postComment(payload: CreateCommentRequest): JsonObject =
        postJson("/api/comments", payload)

    suspend fun deleteComment(commentId: String): BasicOkResponse =
        deleteJson("/api/comments/$commentId")

    suspend fun toggleCommentLike(commentId: String): JsonObject =
        postJson("/api/comments/$commentId/like", EmptyJsonRequest())

    suspend fun fetchServerFavorites(): JsonObject =
        getJson("/api/user/favorites")

    suspend fun postServerFavorite(payload: UserFavoriteSyncPayload): JsonObject =
        postJson("/api/user/favorites", payload)

    suspend fun deleteServerFavorite(animeId: Int): BasicOkResponse =
        deleteJson("/api/user/favorites/$animeId")

    suspend fun clearServerFavorites(): BasicOkResponse =
        deleteJson("/api/user/favorites")

    suspend fun fetchServerHistory(): JsonObject =
        getJson("/api/user/history")

    suspend fun postServerHistory(payload: UserHistorySyncPayload): JsonObject =
        postJson("/api/user/history", payload)

    suspend fun deleteServerHistoryAnime(animeId: Int): BasicOkResponse =
        deleteJson("/api/user/history/anime/$animeId")

    suspend fun clearServerHistory(): BasicOkResponse =
        deleteJson("/api/user/history")

    suspend fun postServerWatchProgress(payload: UserProgressSyncPayload): JsonObject =
        postJson("/api/user/progress", payload)

    suspend fun submitReport(payload: ReportSubmitRequest): JsonObject =
        postJson("/api/report", payload)

    suspend fun submitCrashReport(payload: CrashReportPayload): BasicOkResponse =
        postPublicJson("/api/crash-report", payload)

    // ── Media Proxy & Streaming ──────────────────────────────────────────────
    suspend fun openHlsProxy(url: String, referer: String? = null): String =
        buildMediaUrl(
            "/api/anime/hls-proxy",
            buildMap {
                put("url", url)
                put("mobile", "1")
                if (!referer.isNullOrBlank()) put("ref", referer)
            },
        )

    suspend fun openVideoProxy(url: String, referer: String? = null): String =
        buildMediaUrl(
            "/api/anime/video-proxy",
            buildMap {
                put("url", url)
                if (!referer.isNullOrBlank()) put("ref", referer)
            },
        )

    fun resolveUrl(urlOrPath: String): String {
        val trimmed = urlOrPath.trim()
        if (trimmed.isEmpty()) return ""
        return when {
            trimmed.startsWith("http://") || trimmed.startsWith("https://") -> trimmed
            trimmed.startsWith("/") -> "${NovaBuildConfig.identity.apiUrl}$trimmed"
            else -> "${NovaBuildConfig.identity.apiUrl}/$trimmed"
        }
    }

    fun buildDownloadUrl(site: String, sourceUrl: String): String? {
        if (site.lowercase(Locale.ROOT) !in DOWNLOAD_ALLOWED_SITES) return null
        val resolved = resolveUrl(sourceUrl)
        if (!resolved.startsWith("http://") && !resolved.startsWith("https://")) return null
        if (Regex("""\.m3u8(?:[?#]|$)|hls-proxy""", RegexOption.IGNORE_CASE).containsMatchIn(resolved)) {
            return null
        }
        if (resolved.contains("/api/anime/download-mp4")) return resolved
        return buildMediaUrl(
            "/api/anime/download-mp4",
            mapOf("site" to site, "url" to resolved),
        )
    }

    fun mediaRequestHeaders(): Map<String, String> = buildMap {
        put("X-Nova-Client", NovaBuildConfig.identity.clientId)
        put("X-Nova-Version", NovaBuildConfig.identity.version)
        put("X-Nova-Package", NovaBuildConfig.identity.packageName)
        put("User-Agent", NovaBuildConfig.identity.userAgent)
        tokenStore.readAnonymousToken()?.value?.let { put("X-App-Token", it) }
        tokenStore.readDownloadToken()?.value?.let { put("X-Download-Token", it) }
        tokenStore.readUserToken()?.let { put("X-User-Token", it) }
    }

    suspend fun streamAnimeSources(
        request: SourceRequest,
        onEvent: suspend (SourceStreamEvent) -> Unit,
    ) = withContext(Dispatchers.IO) {
        val httpRequest = baseRequest("/api/anime/sources-stream", request.toQuery())
            .header("Accept", "text/event-stream")
            .get()
            .build()
        val response = executeAuthenticated(httpRequest)
        response.use {
            if (!it.isSuccessful) throw parseHttpError(it)
            val body = it.body ?: throw NovaApiException.EmptyResponse()
            readServerSentEvents(body.source(), onEvent)
        }
    }

    suspend fun fetchAnonymousToken(): StoredToken = withContext(Dispatchers.IO) {
        val request = baseRequest("/api/auth/anon-token")
            .post("{}".toRequestBody(JSON_MEDIA_TYPE))
            .build()
        val response = executePublic(request)
        response.use {
            val payload = parseBody<AnonymousTokenResponse>(it)
            val token = payload.token?.takeIf { it.isNotBlank() }
                ?: throw NovaApiException.EmptyResponse()
            val expiry = payload.exp ?: throw NovaApiException.Parse(
                IllegalStateException("anonymous token expiry missing"),
            )
            if (!payload.downloadToken.isNullOrBlank() && payload.downloadExp != null) {
                tokenStore.writeDownloadToken(StoredToken(payload.downloadToken, payload.downloadExp))
            }
            StoredToken(token, expiry)
        }
    }

    private suspend inline fun <reified T> getJson(
        path: String,
        query: Map<String, String> = emptyMap(),
    ): T = withContext(Dispatchers.IO) {
        val request = baseRequest(path, query).get().build()
        val response = executeAuthenticated(request)
        response.use { parseBody(it) }
    }

    private suspend inline fun <reified T, reified B> postJson(
        path: String,
        payload: B,
    ): T = withContext(Dispatchers.IO) {
        val request = baseRequest(path)
            .header("Content-Type", "application/json")
            .post(json.encodeToString(serializer<B>(), payload).toRequestBody(JSON_MEDIA_TYPE))
            .build()
        val response = executeAuthenticated(request)
        response.use { parseBody(it) }
    }

    private suspend inline fun <reified T, reified B> patchJson(
        path: String,
        payload: B,
    ): T = withContext(Dispatchers.IO) {
        val request = baseRequest(path)
            .header("Content-Type", "application/json")
            .patch(json.encodeToString(serializer<B>(), payload).toRequestBody(JSON_MEDIA_TYPE))
            .build()
        val response = executeAuthenticated(request)
        response.use { parseBody(it) }
    }

    private suspend inline fun <reified T> deleteJson(
        path: String,
    ): T = withContext(Dispatchers.IO) {
        val request = baseRequest(path).delete().build()
        val response = executeAuthenticated(request)
        response.use { parseBody(it) }
    }

    private suspend inline fun <reified T, reified B> postPublicJson(
        path: String,
        payload: B,
    ): T = withContext(Dispatchers.IO) {
        val request = baseRequest(path)
            .header("Content-Type", "application/json")
            .post(json.encodeToString(serializer<B>(), payload).toRequestBody(JSON_MEDIA_TYPE))
            .build()
        val response = executePublic(request)
        response.use { parseBody(it) }
    }

    private suspend inline fun <reified T> parseBody(response: okhttp3.Response): T {
        if (!response.isSuccessful) throw parseHttpError(response)
        val body = response.body?.string()?.takeIf(String::isNotBlank)
            ?: throw NovaApiException.EmptyResponse()
        return try {
            json.decodeFromString(body)
        } catch (error: Exception) {
            throw NovaApiException.Parse(error)
        }
    }

    private suspend fun executeAuthenticated(request: Request): okhttp3.Response {
        val token = ensureAnonymousToken()
        val response = executeUnauthenticated(request.withNovaHeaders(token))
        if (response.code != 403) return response

        val errorDto = response.peekBody(MAX_ERROR_BODY_BYTES).let { body ->
            runCatching { json.decodeFromString<ApiErrorDto>(body.string()) }.getOrNull()
        }
        if (errorDto?.code == "DEVICE_REVOKED") {
            tokenStore.writeUserToken(null)
            return response
        }
        if (errorDto?.code != "INVALID_TOKEN") return response

        response.close()
        tokenStore.clearAnonymousToken()
        val fresh = ensureAnonymousToken(forceRefresh = true)
        return executeUnauthenticated(request.withNovaHeaders(fresh))
    }

    suspend fun ensureAnonymousToken(forceRefresh: Boolean = false): String =
        tokenMutex.withLock {
            val now = System.currentTimeMillis() / 1000
            val stored = tokenStore.readAnonymousToken()
            if (!forceRefresh && stored != null && stored.expiresAtEpochSeconds > now + TOKEN_SAFETY_WINDOW) {
                return@withLock stored.value
            }
            val fresh = fetchAnonymousToken()
            tokenStore.writeAnonymousToken(fresh)
            fresh.value
        }

    private suspend fun executeUnauthenticated(request: Request): okhttp3.Response =
        withContext(Dispatchers.IO) {
            try {
                httpClient.newCall(request).execute()
            } catch (error: java.net.SocketTimeoutException) {
                throw NovaApiException.Timeout(error)
            } catch (error: IOException) {
                throw NovaApiException.Network(error)
            }
        }

    private suspend fun executePublic(request: Request): okhttp3.Response =
        executeUnauthenticated(request.withClientHeaders())

    private fun parseHttpError(response: okhttp3.Response): NovaApiException {
        val body = response.peekBody(MAX_ERROR_BODY_BYTES).string()
        val details = runCatching { json.decodeFromString<ApiErrorDto>(body) }.getOrNull()
        if (details?.officialDownloadRequired == true) return NovaApiException.OfficialAppRequired()
        if (response.code >= 500) return NovaApiException.ServerUnavailable(response.code)
        return NovaApiException.Http(
            status = response.code,
            code = details?.code,
            message = details?.message ?: details?.error ?: "HTTP ${response.code}",
        )
    }

    private fun baseRequest(
        path: String,
        query: Map<String, String> = emptyMap(),
    ): Request.Builder =
        Request.Builder().url(buildUrl(path, query)).header("Accept", "application/json")

    private fun Request.withNovaHeaders(anonymousToken: String): Request =
        withClientHeaders()
            .newBuilder()
            .header("X-App-Token", anonymousToken)
            .apply {
                tokenStore.readUserToken()?.let { header("X-User-Token", it) }
            }
            .build()

    private fun Request.withClientHeaders(): Request =
        newBuilder()
            .header("X-Nova-Client", NovaBuildConfig.identity.clientId)
            .header("X-Nova-Version", NovaBuildConfig.identity.version)
            .header("X-Nova-Package", NovaBuildConfig.identity.packageName)
            .header("User-Agent", NovaBuildConfig.identity.userAgent)
            .build()

    private fun buildMediaUrl(path: String, query: Map<String, String>): String =
        buildUrl(path, query).toString()

    private fun buildUrl(path: String, query: Map<String, String> = emptyMap()) =
        NovaBuildConfig.identity.apiUrl
            .toHttpUrl()
            .newBuilder()
            .addPathSegments(path.removePrefix("/"))
            .apply { query.forEach { (key, value) -> addQueryParameter(key, value) } }
            .build()

    private fun SourceRequest.toQuery(): Map<String, String> = buildMap {
        put("site", site)
        put("title", title)
        put("ep", episode.toString())
        animeId?.let { put("id", it) }
        malId?.let { put("malId", it.toString()) }
        anilistId?.let { put("anilistId", it.toString()) }
        season?.let { put("season", it.toString()) }
        english?.let { put("english", it) }
        native?.let { put("native", it) }
        format?.let { put("format", it) }
        year?.let { put("year", it.toString()) }
        episodes?.let { put("episodes", it.toString()) }
        titleAr?.let { put("titleAr", it) }
    }

    private suspend fun readServerSentEvents(
        source: BufferedSource,
        onEvent: suspend (SourceStreamEvent) -> Unit,
    ) {
        var event = "message"
        var data: String? = null
        while (!source.exhausted()) {
            currentCoroutineContext().ensureActive()
            val line = source.readUtf8Line() ?: break
            when {
                line.startsWith("event:") -> event = line.removePrefix("event:").trim()
                line.startsWith("data:") -> data = line.removePrefix("data:").trim()
                line.isBlank() -> {
                    if (data != null) {
                        val element = runCatching { json.parseToJsonElement(data!!) }.getOrNull()
                        onEvent(SourceStreamEvent(event, element))
                    }
                    event = "message"
                    data = null
                }
            }
        }
    }

    private companion object {
        val JSON_MEDIA_TYPE = "application/json".toMediaType()
        val DOWNLOAD_ALLOWED_SITES = setOf(
            "animewitcher", "kawaii", "shahiid", "okanime", "animeify",
            "animephoenix", "sanime", "anipm", "arabseed", "stardima",
        )
        val novaJson = Json {
            ignoreUnknownKeys = true
            isLenient = true
            explicitNulls = false
        }
        const val TOKEN_SAFETY_WINDOW = 60L
        const val MAX_ERROR_BODY_BYTES = 16 * 1024L

        fun defaultHttpClient(): OkHttpClient = OkHttpClient.Builder()
            .connectTimeout(12, TimeUnit.SECONDS)
            .readTimeout(45, TimeUnit.SECONDS)
            .writeTimeout(15, TimeUnit.SECONDS)
            .build()
    }
}

@kotlinx.serialization.Serializable
private class EmptyJsonRequest(
    val request: String = "nova",
)
