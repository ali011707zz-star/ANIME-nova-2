package com.nova.anime.nova2.core.catalog

import com.nova.anime.nova2.core.model.CommentDto
import com.nova.anime.nova2.core.model.CreateCommentRequest
import com.nova.anime.nova2.core.model.NewsArticleDto
import com.nova.anime.nova2.core.network.NovaApiClient
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.longOrNull
import kotlinx.serialization.json.put
import java.util.Calendar

class AnilistRepository(
    val apiClient: NovaApiClient,
) {
    suspend fun loadHome(): HomeCatalog = coroutineScope {
        val (season, year) = currentSeason()
        val anilistDeferred = async {
            apiClient.queryAniList(
                HOME_QUERY,
                buildJsonObject {
                    put("season", season)
                    put("seasonYear", year)
                },
            )
        }
        val latestAnslayerDeferred = async {
            runCatching { apiClient.fetchLatestFromProvider("anslayer-latest").asLatestEpisodes("anslayer") }
                .getOrDefault(emptyList())
        }
        val latestAwDeferred = async {
            runCatching { apiClient.fetchLatestFromProvider("aw-latest").asLatestEpisodes("animewitcher") }
                .getOrDefault(emptyList())
        }
        val awDubbedDeferred = async {
            runCatching { apiClient.fetchAwDubbedCatalog(page = 1).asDubbedSeriesList(WatchContentKind.AW_DUBBED) }
                .getOrDefault(emptyList())
        }

        val response = anilistDeferred.await()
        val data = response.requireData()
        val latestCombined = (latestAwDeferred.await() + latestAnslayerDeferred.await())
            .distinctBy { "${it.anilistId}:${it.episode}:${it.title}" }
            .take(24)

        HomeCatalog(
            trending = data.mediaPage("trending"),
            popular = data.mediaPage("popular"),
            airing = data.mediaPage("airing"),
            seasonal = data.mediaPage("seasonal"),
            topRated = data.mediaPage("topRated"),
            movies = data.mediaPage("movies"),
            isekai = data.mediaPage("isekai"),
            latestEpisodes = latestCombined,
            dubbedHighlights = awDubbedDeferred.await().take(16),
        )
    }

    suspend fun browse(filters: BrowseFilters, page: Int = 1): List<AnimeCard> {
        val search = filters.search?.trim()?.takeIf { it.isNotEmpty() }
        if (search != null && ARABIC_PATTERN.containsMatchIn(search)) {
            val arabicIds = runCatching {
                val payload = apiClient.searchArabicTitleIds(search)
                payload["items"]?.jsonArray?.mapNotNull { it.jsonObjectOrNull()?.int("id") }.orEmpty()
            }.getOrDefault(emptyList())
            if (arabicIds.isNotEmpty()) {
                val idResponse = apiClient.queryAniList(
                    buildArabicIdQuery(arabicIds),
                    buildJsonObject {
                        put("page", page)
                        put("perPage", 30)
                    },
                )
                val byId = idResponse.requireData().mediaPage("Page")
                if (byId.isNotEmpty()) return byId
            }
        }

        val resolvedSearch = search?.let { resolveSearchText(it) }
        val variables = buildJsonObject {
            put("page", page)
            put("perPage", 30)
            put("sort", JsonArray(listOf(JsonPrimitive(filters.sort))))
            resolvedSearch?.let { put("search", it) }
            filters.format?.let { put("format", it) }
            filters.status?.let { put("status", it) }
            filters.genre?.let { put("genre", it) }
            filters.season?.let { put("season", it) }
            filters.year?.let { put("seasonYear", it) }
        }
        val response = apiClient.queryAniList(BROWSE_QUERY, variables)
        return response.requireData().mediaPage("Page")
    }

    suspend fun search(query: String, page: Int = 1): List<AnimeCard> {
        val trimmed = query.trim()
        if (trimmed.isEmpty()) return emptyList()
        return browse(
            BrowseFilters(
                search = trimmed,
                sort = "SEARCH_MATCH",
            ),
            page = page,
        )
    }

    suspend fun loadManga(
        page: Int = 1,
        search: String? = null,
        status: String? = null,
        countryOfOrigin: String? = null,
    ): List<MangaCard> {
        val normalizedSearch = search?.trim()?.takeIf { it.isNotEmpty() }
        val resolvedSearch = normalizedSearch?.let { resolveSearchText(it) }
        val variables = buildJsonObject {
            put("page", page.coerceAtLeast(1))
            put("perPage", 30)
            put(
                "sort",
                JsonArray(
                    listOf(
                        JsonPrimitive(
                            if (resolvedSearch == null) "POPULARITY_DESC" else "SEARCH_MATCH",
                        ),
                    ),
                ),
            )
            resolvedSearch?.let { put("search", it) }
            status?.let { put("status", it) }
            countryOfOrigin?.let { put("countryOfOrigin", it) }
        }
        val response = apiClient.queryAniList(MANGA_QUERY, variables)
        return response.requireData()["Page"]?.jsonObjectOrNull()
            ?.get("media")?.jsonArray
            ?.mapNotNull { it.jsonObjectOrNull()?.toMangaCard() }
            ?.filterNot { manga -> manga.genres.any { it in BLOCKED_GENRES } }
            .orEmpty()
    }

    suspend fun details(id: Int, externalSource: String? = null): AnimeDetails {
        if (!externalSource.isNullOrBlank()) {
            val external = runCatching { apiClient.fetchAnimeMetadata(id.toString(), externalSource) }.getOrNull()
            val media = external?.get("media")?.jsonObjectOrNull() ?: external
            if (media != null && media.int("id") != null) {
                return parseMediaDetails(media)
            }
        }
        val response = apiClient.queryAniList(
            DETAILS_QUERY,
            buildJsonObject { put("id", id) },
        )
        val media = response.requireData()["Media"]?.jsonObject
            ?: throw CatalogException("لم يتم العثور على هذا الأنمي")
        val parsed = parseMediaDetails(media)
        val arabicSynopsis = if (parsed.description.isNotBlank() && !ARABIC_PATTERN.containsMatchIn(parsed.description)) {
            runCatching {
                apiClient.translateText(
                    text = parsed.description.take(480),
                    from = "en",
                    to = "ar",
                    kind = "synopsis",
                ).string("translated")
            }.getOrNull()
        } else {
            parsed.description
        }
        return parsed.copy(arabicDescription = arabicSynopsis)
    }

    suspend fun episodes(details: AnimeDetails, page: Int = 1): List<EpisodeItem> {
        val titlesResponse = runCatching {
            apiClient.fetchEpisodeTitles(
                malId = details.malId ?: 0,
                anilistId = details.card.id,
                page = page,
            )
        }.getOrNull()

        val titlesByNumber = titlesResponse
            ?.get("episodes")
            ?.jsonArray
            ?.mapNotNull { item ->
                val obj = item.jsonObjectOrNull() ?: return@mapNotNull null
                val number = obj.int("number") ?: obj.int("episode") ?: return@mapNotNull null
                val title = obj.string("title_ar") ?: obj.string("title") ?: obj.string("name")
                val filler = obj["filler"]?.jsonPrimitive?.booleanOrNull ?: false
                number to EpisodeItem(
                    number = number,
                    title = title,
                    arabicTitle = obj.string("title_ar"),
                    imageUrl = obj.string("image") ?: details.card.coverUrl,
                    filler = filler,
                )
            }
            ?.toMap()
            .orEmpty()

        val releasedTotal = listOfNotNull(
            titlesResponse?.int("releasedTotal"),
            titlesResponse?.int("latestEpisode"),
            titlesResponse?.int("anilistAiredEpisode"),
            details.nextEpisode?.minus(1)?.takeIf { it > 0 },
            details.card.episodes,
            titlesByNumber.keys.maxOrNull(),
        ).maxOrNull()?.coerceIn(1, 1500) ?: 12

        return (1..releasedTotal).map { number ->
            val fromServer = titlesByNumber[number]
            EpisodeItem(
                number = number,
                title = fromServer?.title ?: "الحلقة $number",
                arabicTitle = fromServer?.arabicTitle,
                imageUrl = fromServer?.imageUrl ?: details.card.coverUrl,
                filler = fromServer?.filler ?: false,
            )
        }
    }

    suspend fun loadSchedule(startEpochSec: Long, endEpochSec: Long): List<AiringScheduleItem> {
        val response = apiClient.queryAniList(
            SCHEDULE_QUERY,
            buildJsonObject {
                put("start", startEpochSec)
                put("end", endEpochSec)
            },
        )
        val schedules = response.requireData()["Page"]?.jsonObject
            ?.get("airingSchedules")?.jsonArray.orEmpty()
        return schedules.mapNotNull { el ->
            val obj = el.jsonObjectOrNull() ?: return@mapNotNull null
            val media = obj["media"]?.jsonObjectOrNull()?.toAnimeCard() ?: return@mapNotNull null
            AiringScheduleItem(
                id = obj.int("id") ?: return@mapNotNull null,
                episode = obj.int("episode") ?: 1,
                airingAtEpochSec = obj["airingAt"]?.jsonPrimitive?.longOrNull ?: 0L,
                anime = media,
            )
        }
    }

    suspend fun loadDubbedCatalog(
        kind: WatchContentKind,
        page: Int = 1,
        query: String? = null,
        carateenProvider: String = "spacetoon",
    ): List<DubbedSeriesCard> {
        return when (kind) {
            WatchContentKind.AW_DUBBED ->
                apiClient.fetchAwDubbedCatalog(page, query).asDubbedSeriesList(WatchContentKind.AW_DUBBED)
            WatchContentKind.DUBBED -> {
                if (!query.isNullOrBlank()) {
                    apiClient.searchDubbed(query).asDubbedSeriesList(WatchContentKind.DUBBED)
                } else if (carateenProvider.isNotBlank() && carateenProvider != "arabictoons") {
                    apiClient.fetchCarateenCatalog(carateenProvider, page)
                        .asDubbedSeriesList(WatchContentKind.DUBBED, carateenProvider)
                } else {
                    apiClient.fetchDubbedCatalog(page).asDubbedSeriesList(WatchContentKind.DUBBED, "arabictoons")
                }
            }
            else -> emptyList()
        }
    }

    suspend fun loadDubbedEpisodes(card: DubbedSeriesCard): List<DubbedEpisodeItem> {
        val raw = when {
            card.kind == WatchContentKind.AW_DUBBED ->
                apiClient.fetchAwDubbedEpisodes(card.key)
            card.provider != "arabictoons" && card.provider != "aw-dubbed" ->
                apiClient.fetchCarateenEpisodes(card.provider, card.key)
            else ->
                apiClient.fetchDubbedEpisodes(card.key)
        }
        val arr = when (raw) {
            is JsonArray -> raw
            is JsonObject -> raw["episodes"]?.jsonArray ?: raw["items"]?.jsonArray ?: JsonArray(emptyList())
            else -> JsonArray(emptyList())
        }
        return arr.mapIndexedNotNull { idx, item ->
            val obj = item.jsonObjectOrNull() ?: return@mapIndexedNotNull null
            val epNum = obj.int("number") ?: obj.int("ep") ?: obj.int("episode") ?: (idx + 1)
            DubbedEpisodeItem(
                number = epNum,
                title = obj.string("title") ?: obj.string("name") ?: "الحلقة $epNum",
                episodeUrl = obj.string("url") ?: obj.string("epUrl") ?: "",
                episodeId = obj.string("id") ?: obj.string("episodeId") ?: epNum.toString(),
            )
        }
    }

    suspend fun loadAnimationCatalog(
        type: String = "tv",
        genre: String = "",
        sort: String = "popularity.desc",
        year: String = "",
        page: Int = 1,
        query: String? = null,
    ): List<AnimationCard> {
        val payload = if (!query.isNullOrBlank()) {
            apiClient.searchAnimation(query.trim(), type)
        } else {
            apiClient.fetchAnimationBrowse(type, genre, sort, year, page)
        }
        val items = (payload["results"] ?: payload["items"])?.jsonArray.orEmpty()
        return items.mapNotNull { el ->
            val obj = el.jsonObjectOrNull() ?: return@mapNotNull null
            val id = obj.string("id") ?: obj.int("id")?.toString() ?: return@mapNotNull null
            val title = obj.string("title") ?: obj.string("name") ?: return@mapNotNull null
            AnimationCard(
                id = id,
                mediaType = obj.string("media_type") ?: type,
                title = title,
                posterUrl = obj.string("poster") ?: obj.string("poster_path")?.let {
                    apiClient.resolveUrl("/api/source-catalog/tmdb-poster/w342/${it.trimStart('/')}")
                },
                backdropUrl = obj.string("backdrop") ?: obj.string("backdrop_path"),
                year = obj.string("release_date")?.take(4)?.toIntOrNull()
                    ?: obj.string("first_air_date")?.take(4)?.toIntOrNull(),
                rating = obj["vote_average"]?.jsonPrimitive?.doubleOrNull,
                overview = obj.string("overview") ?: "",
            )
        }
    }

    suspend fun loadStardimaCatalog(
        page: Int = 1,
        mediaType: String = "",
        category: String = "",
        localization: String = "",
        query: String = "",
    ): List<StardimaTitleCard> {
        val payload = apiClient.fetchStardimaTitles(page, mediaType, category, localization, query)
        val results = payload["results"]?.jsonArray.orEmpty()
        return results.mapNotNull { el ->
            val obj = el.jsonObjectOrNull() ?: return@mapNotNull null
            val providerId = obj.string("provider_title_id") ?: obj.string("id") ?: return@mapNotNull null
            val classification = obj["classification"]?.jsonObjectOrNull()
            val labels = classification?.get("localizationLabels")?.jsonArray
                ?.mapNotNull { it.jsonPrimitive.contentOrNull }.orEmpty()
            StardimaTitleCard(
                providerTitleId = providerId,
                title = obj.string("title") ?: providerId,
                titleAr = obj.string("title_ar"),
                posterUrl = obj.string("poster_url")?.let(apiClient::resolveUrl),
                backdropUrl = obj.string("backdrop_url")?.let(apiClient::resolveUrl),
                mediaType = obj.string("media_type") ?: "series",
                releaseYear = obj.int("release_year"),
                episodeCount = obj.int("episode_count"),
                localizationLabels = labels,
            )
        }
    }

    suspend fun loadStardimaEpisodes(providerTitleId: String): List<StardimaEpisodeEntry> {
        val detail = apiClient.fetchStardimaTitleDetails(providerTitleId)
        val episodes = (detail["episodes"] ?: detail["title"]?.jsonObjectOrNull()?.get("episodes"))
            ?.jsonArray.orEmpty()
        return episodes.mapIndexedNotNull { index, el ->
            val obj = el.jsonObjectOrNull() ?: return@mapIndexedNotNull null
            val epId = obj.string("id") ?: obj.int("id")?.toString() ?: return@mapIndexedNotNull null
            val number = obj.int("episode_number") ?: obj.int("number") ?: (index + 1)
            StardimaEpisodeEntry(
                episodeId = epId,
                number = number,
                title = obj.string("title") ?: "الحلقة $number",
                seasonNumber = obj.int("season_number") ?: 1,
            )
        }
    }

    suspend fun loadStardimaServers(episodeId: String): List<StardimaServerEntry> {
        val response = apiClient.fetchStardimaEpisodeServers(episodeId)
        val servers = response["servers"]?.jsonArray.orEmpty()
        return servers.mapNotNull { el ->
            val obj = el.jsonObjectOrNull() ?: return@mapNotNull null
            val url = obj.string("watch_url") ?: obj.string("url") ?: return@mapNotNull null
            StardimaServerEntry(
                name = obj.string("server_name") ?: obj.string("name") ?: "StarDima",
                watchUrl = url,
                quality = obj.string("quality"),
            )
        }
    }

    suspend fun loadNews(page: Int = 1): List<NewsArticleDto> =
        apiClient.fetchNews(page).articles

    suspend fun loadComments(
        animeId: Int? = null,
        tmdbId: String? = null,
        episodeNumber: Int? = null,
    ): List<CommentDto> {
        val payload = apiClient.fetchComments(animeId, tmdbId, episodeNumber)
        val rows = payload["comments"]?.jsonArray.orEmpty()
        return rows.mapNotNull { el ->
            val obj = el.jsonObjectOrNull() ?: return@mapNotNull null
            CommentDto(
                id = obj.string("id") ?: obj.int("id")?.toString() ?: return@mapNotNull null,
                userId = obj.string("userId") ?: obj.string("user_id"),
                username = obj.string("username") ?: "مستخدم",
                userHandle = obj.string("userHandle") ?: obj.string("user_handle"),
                avatarUrl = obj.string("avatarUrl") ?: obj.string("avatar_url"),
                animeId = obj.int("animeId") ?: obj.int("anime_id"),
                tmdbId = obj.string("tmdbId") ?: obj.string("tmdb_id"),
                episodeNumber = obj.int("episodeNumber") ?: obj.int("episode_number"),
                animeType = obj.string("animeType") ?: obj.string("anime_type") ?: "anime",
                text = obj.string("text") ?: "",
                likes = obj.int("likes") ?: 0,
                likedByMe = obj["likedByMe"]?.jsonPrimitive?.booleanOrNull ?: false,
                parentId = obj.string("parentId") ?: obj.string("parent_id"),
                replyToUsername = obj.string("replyToUsername") ?: obj.string("reply_to_username"),
                createdAt = obj.string("createdAt") ?: obj.string("created_at"),
            )
        }
    }

    suspend fun createComment(request: CreateCommentRequest): Boolean =
        runCatching { apiClient.postComment(request) }.isSuccess

    suspend fun toggleCommentLike(commentId: String): Boolean =
        runCatching { apiClient.toggleCommentLike(commentId) }.isSuccess

    private suspend fun resolveSearchText(query: String): String {
        if (!ARABIC_PATTERN.containsMatchIn(query)) return query
        val translated = runCatching {
            apiClient.translateSearchText(query).string("translated")
        }.getOrNull()
        return translated?.takeIf { it.isNotBlank() } ?: query
    }

    private fun parseMediaDetails(media: JsonObject): AnimeDetails {
        val card = media.toAnimeCard() ?: throw CatalogException("بيانات الأنمي غير مكتملة")
        val studios = media["studios"]?.jsonObjectOrNull()
            ?.get("nodes")?.jsonArray
            ?.mapNotNull { it.jsonObjectOrNull()?.string("name") }
            .orEmpty()
        val trailer = media["trailer"]?.jsonObjectOrNull()
        val trailerYoutubeId = if (trailer?.string("site")?.equals("youtube", ignoreCase = true) == true) {
            trailer.string("id")
        } else {
            null
        }
        val relations = media["relations"]?.jsonObjectOrNull()
            ?.get("edges")?.jsonArray
            ?.mapNotNull { edge ->
                val edgeObj = edge.jsonObjectOrNull() ?: return@mapNotNull null
                val relType = edgeObj.string("relationType") ?: "RELATED"
                val node = edgeObj["node"]?.jsonObjectOrNull() ?: return@mapNotNull null
                if (node.string("type")?.let { it != "ANIME" } == true) return@mapNotNull null
                val nodeCard = node.toAnimeCard() ?: return@mapNotNull null
                RelationItem(
                    id = nodeCard.id,
                    relationType = relType,
                    title = nodeCard.englishTitle ?: nodeCard.title,
                    coverUrl = nodeCard.coverUrl,
                    format = nodeCard.format,
                    episodes = nodeCard.episodes,
                )
            }
            .orEmpty()
        val characters = media["characters"]?.jsonObjectOrNull()
            ?.get("edges")?.jsonArray
            ?.mapNotNull { edge ->
                val edgeObj = edge.jsonObjectOrNull() ?: return@mapNotNull null
                val role = edgeObj.string("role") ?: "SUPPORTING"
                val node = edgeObj["node"]?.jsonObjectOrNull() ?: return@mapNotNull null
                val charId = node.int("id") ?: return@mapNotNull null
                val name = node["name"]?.jsonObjectOrNull()?.string("full") ?: return@mapNotNull null
                val img = node["image"]?.jsonObjectOrNull()?.string("large")
                CharacterItem(id = charId, name = name, role = role, imageUrl = img)
            }
            .orEmpty()
        val recommendations = media["recommendations"]?.jsonObjectOrNull()
            ?.get("nodes")?.jsonArray
            ?.mapNotNull { rec ->
                rec.jsonObjectOrNull()
                    ?.get("mediaRecommendation")
                    ?.jsonObjectOrNull()
                    ?.toAnimeCard()
            }
            .orEmpty()

        return AnimeDetails(
            card = card,
            malId = media.int("idMal"),
            description = cleanDescription(media.string("description")),
            durationMinutes = media.int("duration"),
            studios = studios,
            nextEpisode = media["nextAiringEpisode"]?.jsonObjectOrNull()?.int("episode"),
            nextAiringAtEpochSec = media["nextAiringEpisode"]?.jsonObjectOrNull()
                ?.get("airingAt")?.jsonPrimitive?.longOrNull,
            season = media.string("season"),
            sourceMaterial = media.string("source"),
            popularity = media.int("popularity"),
            favourites = media.int("favourites"),
            trailerYoutubeId = trailerYoutubeId,
            relations = relations,
            characters = characters,
            recommendations = recommendations,
        )
    }

    private fun JsonElement.asLatestEpisodes(source: String): List<LatestEpisodeCard> {
        val arr = when (this) {
            is JsonArray -> this
            is JsonObject -> this["items"]?.jsonArray ?: this["episodes"]?.jsonArray ?: JsonArray(emptyList())
            else -> JsonArray(emptyList())
        }
        return arr.mapNotNull { el ->
            val obj = el.jsonObjectOrNull() ?: return@mapNotNull null
            val rawAniList = obj.int("anilistId") ?: obj.int("anilist_id") ?: 0
            val rawAnimeId = obj.int("animeId") ?: obj.int("anime_id") ?: rawAniList
            val ep = obj.int("episode") ?: obj.int("ep") ?: 1
            val title = obj.string("romaji") ?: obj.string("title") ?: obj.string("name") ?: return@mapNotNull null
            LatestEpisodeCard(
                animeId = rawAnimeId,
                anilistId = if (rawAniList > 0) rawAniList else rawAnimeId,
                episode = ep,
                title = title,
                englishTitle = obj.string("english"),
                arabicTitle = obj.string("titleAr") ?: obj.string("title_ar"),
                coverUrl = obj.string("cover") ?: obj.string("thumbnail") ?: obj.string("poster"),
                sourceSite = source,
                awAnimeId = obj.string("awAnimeId"),
            )
        }
    }

    private fun JsonElement.asDubbedSeriesList(
        kind: WatchContentKind,
        provider: String = kind.wireName,
    ): List<DubbedSeriesCard> {
        val arr = when (this) {
            is JsonArray -> this
            is JsonObject -> this["items"]?.jsonArray ?: this["series"]?.jsonArray ?: this["results"]?.jsonArray ?: JsonArray(emptyList())
            else -> JsonArray(emptyList())
        }
        return arr.mapNotNull { el ->
            val obj = el.jsonObjectOrNull() ?: return@mapNotNull null
            val key = obj.string("key") ?: obj.string("animeId") ?: obj.string("id") ?: return@mapNotNull null
            val title = obj.string("title") ?: obj.string("name") ?: key
            val rawPoster = obj.string("poster") ?: obj.string("cover") ?: obj.string("thumbnail")
            DubbedSeriesCard(
                key = key,
                title = title,
                arabicTitle = obj.string("titleAr") ?: obj.string("title_ar"),
                posterUrl = rawPoster?.let(apiClient::resolveUrl),
                episodeCount = obj.int("episodesCount") ?: obj.int("episodeCount") ?: obj.int("episodes"),
                kind = kind,
                provider = provider,
                seasonLabel = obj.string("season") ?: "الموسم 1",
            )
        }
    }

    private fun JsonObject.requireData(): JsonObject {
        val errors = this["errors"]?.jsonArray
        if (!errors.isNullOrEmpty()) {
            val message = errors.firstOrNull()?.jsonObjectOrNull()?.string("message")
                ?: "خطأ أثناء تحميل الكتالوج"
            throw CatalogException(message)
        }
        return this["data"]?.jsonObject ?: throw CatalogException("استجابة الكتالوج غير صالحة")
    }

    private fun JsonObject.mediaPage(field: String): List<AnimeCard> =
        this[field]?.jsonObjectOrNull()
            ?.get("media")?.jsonArray
            ?.mapNotNull { it.jsonObjectOrNull()?.toAnimeCard() }
            ?.filterNot { card -> card.genres.any { it in BLOCKED_GENRES } }
            .orEmpty()

    private fun JsonObject.toAnimeCard(): AnimeCard? {
        val id = int("id") ?: return null
        val titleObject = this["title"]?.jsonObjectOrNull()
        val romaji = titleObject?.string("romaji")
        val english = titleObject?.string("english")
        val native = titleObject?.string("native")
        val title = romaji ?: english ?: native ?: return null
        val coverObject = this["coverImage"]?.jsonObjectOrNull()
        val cover = coverObject?.string("extraLarge") ?: coverObject?.string("large")
        val genres = this["genres"]?.jsonArray
            ?.mapNotNull { it.jsonPrimitive.contentOrNull }
            .orEmpty()
        return AnimeCard(
            id = id,
            title = title,
            englishTitle = english,
            nativeTitle = native,
            arabicTitle = string("title_ar"),
            coverUrl = cover,
            bannerUrl = string("bannerImage"),
            score = int("averageScore"),
            episodes = int("episodes"),
            format = string("format"),
            status = string("status"),
            year = int("seasonYear") ?: this["startDate"]?.jsonObjectOrNull()?.int("year"),
            genres = genres,
        )
    }

    private fun JsonObject.toMangaCard(): MangaCard? {
        val id = int("id") ?: return null
        val titleObject = this["title"]?.jsonObjectOrNull()
        val romaji = titleObject?.string("romaji")
        val english = titleObject?.string("english")
        val native = titleObject?.string("native")
        val title = romaji ?: english ?: native ?: return null
        val coverObject = this["coverImage"]?.jsonObjectOrNull()
        val cover = coverObject?.string("extraLarge") ?: coverObject?.string("large")
        val genres = this["genres"]?.jsonArray
            ?.mapNotNull { it.jsonPrimitive.contentOrNull }
            .orEmpty()
        return MangaCard(
            id = id,
            title = title,
            englishTitle = english,
            nativeTitle = native,
            coverUrl = cover,
            score = int("averageScore"),
            chapters = int("chapters"),
            volumes = int("volumes"),
            format = string("format"),
            status = string("status"),
            countryOfOrigin = string("countryOfOrigin"),
            year = this["startDate"]?.jsonObjectOrNull()?.int("year"),
            description = cleanDescription(string("description")),
            genres = genres,
        )
    }

    private fun JsonElement.jsonObjectOrNull(): JsonObject? =
        if (this is JsonNull) null else runCatching { jsonObject }.getOrNull()

    private fun JsonObject.string(key: String): String? =
        (this[key] as? JsonPrimitive)?.contentOrNull?.takeIf { it.isNotBlank() }

    private fun JsonObject.int(key: String): Int? =
        (this[key] as? JsonPrimitive)?.intOrNull

    private fun cleanDescription(raw: String?): String =
        raw.orEmpty()
            .replace(Regex("<br\\s*/?>", RegexOption.IGNORE_CASE), "\n")
            .replace(Regex("<[^>]+>"), "")
            .replace("&quot;", "\"")
            .replace("&#039;", "'")
            .replace("&amp;", "&")
            .trim()

    private fun currentSeason(): Pair<String, Int> {
        val calendar = Calendar.getInstance()
        val month = calendar.get(Calendar.MONTH) + 1
        val year = calendar.get(Calendar.YEAR)
        val season = when (month) {
            1, 2, 3 -> "WINTER"
            4, 5, 6 -> "SPRING"
            7, 8, 9 -> "SUMMER"
            else -> "FALL"
        }
        return season to year
    }

    private fun buildArabicIdQuery(ids: List<Int>): String = """
        query (${"$"}page: Int, ${"$"}perPage: Int) {
          Page(page: ${"$"}page, perPage: ${"$"}perPage) {
            media(id_in: [${ids.joinToString(",")}], type: ANIME, isAdult: false, genre_not_in: ["Hentai","Ecchi"]) {
              $MEDIA_FIELDS
            }
          }
        }
    """.trimIndent()

    private companion object {
        val ARABIC_PATTERN = Regex("[\\u0600-\\u06FF]")
        val BLOCKED_GENRES = setOf("Hentai", "Ecchi")

        const val MEDIA_FIELDS = """
            id
            title { romaji english native }
            coverImage { large extraLarge }
            bannerImage
            averageScore
            episodes
            format
            status
            seasonYear
            startDate { year }
            genres
        """

        val HOME_QUERY = """
            query (${"$"}season: MediaSeason, ${"$"}seasonYear: Int) {
              trending: Page(page: 1, perPage: 20) {
                media(type: ANIME, sort: [TRENDING_DESC], isAdult: false, genre_not_in: ["Hentai","Ecchi"]) {
                  $MEDIA_FIELDS
                }
              }
              popular: Page(page: 1, perPage: 20) {
                media(type: ANIME, sort: [POPULARITY_DESC], isAdult: false, genre_not_in: ["Hentai","Ecchi"]) {
                  $MEDIA_FIELDS
                }
              }
              airing: Page(page: 1, perPage: 25) {
                media(type: ANIME, status: RELEASING, sort: [POPULARITY_DESC], isAdult: false, genre_not_in: ["Hentai","Ecchi"]) {
                  $MEDIA_FIELDS
                }
              }
              seasonal: Page(page: 1, perPage: 25) {
                media(type: ANIME, season: ${"$"}season, seasonYear: ${"$"}seasonYear, sort: [POPULARITY_DESC], isAdult: false, genre_not_in: ["Hentai","Ecchi"]) {
                  $MEDIA_FIELDS
                }
              }
              topRated: Page(page: 1, perPage: 20) {
                media(type: ANIME, sort: [SCORE_DESC], isAdult: false, genre_not_in: ["Hentai","Ecchi"]) {
                  $MEDIA_FIELDS
                }
              }
              movies: Page(page: 1, perPage: 20) {
                media(type: ANIME, format: MOVIE, sort: [POPULARITY_DESC], isAdult: false, genre_not_in: ["Hentai","Ecchi"]) {
                  $MEDIA_FIELDS
                }
              }
              isekai: Page(page: 1, perPage: 20) {
                media(type: ANIME, tag: "Isekai", sort: [POPULARITY_DESC], isAdult: false, genre_not_in: ["Hentai","Ecchi"]) {
                  $MEDIA_FIELDS
                }
              }
            }
        """.trimIndent()

        val BROWSE_QUERY = """
            query (
              ${"$"}page: Int = 1,
              ${"$"}perPage: Int = 30,
              ${"$"}sort: [MediaSort] = [POPULARITY_DESC],
              ${"$"}search: String,
              ${"$"}format: MediaFormat,
              ${"$"}status: MediaStatus,
              ${"$"}genre: String,
              ${"$"}season: MediaSeason,
              ${"$"}seasonYear: Int
            ) {
              Page(page: ${"$"}page, perPage: ${"$"}perPage) {
                media(
                  type: ANIME,
                  sort: ${"$"}sort,
                  search: ${"$"}search,
                  format: ${"$"}format,
                  status: ${"$"}status,
                  genre: ${"$"}genre,
                  season: ${"$"}season,
                  seasonYear: ${"$"}seasonYear,
                  isAdult: false,
                  genre_not_in: ["Hentai","Ecchi"]
                ) {
                  $MEDIA_FIELDS
                }
              }
            }
        """.trimIndent()

        val MANGA_QUERY = """
            query (
              ${"$"}page: Int = 1,
              ${"$"}perPage: Int = 30,
              ${"$"}search: String,
              ${"$"}status: MediaStatus,
              ${"$"}countryOfOrigin: CountryCode,
              ${"$"}sort: [MediaSort] = [POPULARITY_DESC]
            ) {
              Page(page: ${"$"}page, perPage: ${"$"}perPage) {
                media(
                  type: MANGA,
                  format_in: [MANGA, ONE_SHOT],
                  search: ${"$"}search,
                  status: ${"$"}status,
                  countryOfOrigin: ${"$"}countryOfOrigin,
                  sort: ${"$"}sort,
                  isAdult: false,
                  genre_not_in: ["Hentai", "Ecchi"]
                ) {
                  id
                  title { romaji english native }
                  coverImage { large extraLarge }
                  averageScore
                  chapters
                  volumes
                  format
                  status
                  countryOfOrigin
                  startDate { year }
                  description
                  genres
                }
              }
            }
        """.trimIndent()

        const val DETAILS_QUERY = """
            query (${"$"}id: Int) {
              Media(id: ${"$"}id, type: ANIME) {
                id
                idMal
                title { romaji english native }
                coverImage { large extraLarge }
                bannerImage
                description
                episodes
                duration
                status
                format
                source
                season
                seasonYear
                startDate { year month day }
                averageScore
                popularity
                favourites
                genres
                trailer { id site }
                nextAiringEpisode { episode airingAt }
                studios { nodes { name } }
                relations {
                  edges {
                    relationType
                    node {
                      id
                      type
                      title { romaji english native }
                      coverImage { large extraLarge }
                      format
                      episodes
                      averageScore
                    }
                  }
                }
                characters(sort: [ROLE, RELEVANCE], perPage: 12) {
                  edges {
                    role
                    node {
                      id
                      name { full }
                      image { large }
                    }
                  }
                }
                recommendations(sort: [RATING_DESC], perPage: 10) {
                  nodes {
                    mediaRecommendation {
                      id
                      title { romaji english native }
                      coverImage { large extraLarge }
                      averageScore
                      episodes
                      format
                      status
                    }
                  }
                }
              }
            }
        """

        const val SCHEDULE_QUERY = """
            query (${"$"}start: Int, ${"$"}end: Int) {
              Page(page: 1, perPage: 50) {
                airingSchedules(airingAt_greater: ${"$"}start, airingAt_lesser: ${"$"}end, sort: [TIME]) {
                  id
                  episode
                  airingAt
                  media {
                    $MEDIA_FIELDS
                  }
                }
              }
            }
        """
    }
}
