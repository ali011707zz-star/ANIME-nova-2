package com.nova.anime.nova2.core.catalog

enum class WatchContentKind(val wireName: String) {
    ANIME("anime"),
    DUBBED("dubbed"),
    AW_DUBBED("aw-dubbed"),
    ANIMATION("animation"),
    STARDIMA("stardima"),
}

/**
 * Computes a deterministic positive surrogate ID for string-keyed content
 * (dubbed, aw-dubbed, animation, stardima) so it never collides with AniList IDs.
 * Matches getWatchContentId() in artifacts/nova-mobile/context/AppContext.tsx.
 */
fun getWatchContentId(kind: WatchContentKind, key: String): Int {
    if (kind == WatchContentKind.ANIME) {
        return key.toIntOrNull()?.takeIf { it > 0 } ?: 0
    }
    var hash = 2166136261L
    val input = "${kind.wireName}:$key"
    for (ch in input) {
        hash = hash xor ch.code.toLong()
        hash = (hash * 16777619L) and 0xFFFFFFFFL
    }
    return (100_000_000L + (hash % 1_900_000_000L)).toInt()
}

data class AnimeCard(
    val id: Int,
    val title: String,
    val englishTitle: String? = null,
    val nativeTitle: String? = null,
    val arabicTitle: String? = null,
    val coverUrl: String? = null,
    val bannerUrl: String? = null,
    val score: Int? = null,
    val episodes: Int? = null,
    val format: String? = null,
    val status: String? = null,
    val year: Int? = null,
    val genres: List<String> = emptyList(),
    val contentKind: WatchContentKind = WatchContentKind.ANIME,
    val contentKey: String = id.toString(),
) {
    fun displayTitle(): String =
        arabicTitle?.takeIf { it.isNotBlank() }
            ?: englishTitle?.takeIf { it.isNotBlank() }
            ?: title
}

data class MangaCard(
    val id: Int,
    val title: String,
    val englishTitle: String? = null,
    val nativeTitle: String? = null,
    val coverUrl: String? = null,
    val score: Int? = null,
    val chapters: Int? = null,
    val volumes: Int? = null,
    val format: String? = null,
    val status: String? = null,
    val countryOfOrigin: String? = null,
    val year: Int? = null,
    val description: String = "",
    val genres: List<String> = emptyList(),
)

data class RelationItem(
    val id: Int,
    val relationType: String,
    val title: String,
    val coverUrl: String? = null,
    val format: String? = null,
    val episodes: Int? = null,
)

data class CharacterItem(
    val id: Int,
    val name: String,
    val role: String,
    val imageUrl: String? = null,
)

data class AnimeDetails(
    val card: AnimeCard,
    val malId: Int? = null,
    val description: String = "",
    val arabicDescription: String? = null,
    val durationMinutes: Int? = null,
    val studios: List<String> = emptyList(),
    val nextEpisode: Int? = null,
    val nextAiringAtEpochSec: Long? = null,
    val season: String? = null,
    val sourceMaterial: String? = null,
    val popularity: Int? = null,
    val favourites: Int? = null,
    val trailerYoutubeId: String? = null,
    val relations: List<RelationItem> = emptyList(),
    val characters: List<CharacterItem> = emptyList(),
    val recommendations: List<AnimeCard> = emptyList(),
)

data class EpisodeItem(
    val number: Int,
    val title: String? = null,
    val arabicTitle: String? = null,
    val imageUrl: String? = null,
    val filler: Boolean = false,
)

data class LatestEpisodeCard(
    val animeId: Int,
    val anilistId: Int,
    val episode: Int,
    val title: String,
    val englishTitle: String? = null,
    val arabicTitle: String? = null,
    val coverUrl: String? = null,
    val sourceSite: String = "anslayer",
    val awAnimeId: String? = null,
)

data class DubbedSeriesCard(
    val key: String,
    val title: String,
    val arabicTitle: String? = null,
    val posterUrl: String? = null,
    val episodeCount: Int? = null,
    val kind: WatchContentKind = WatchContentKind.AW_DUBBED,
    val provider: String = "aw-dubbed",
    val seasonLabel: String = "الموسم 1",
)

data class DubbedEpisodeItem(
    val number: Int,
    val title: String,
    val episodeUrl: String = "",
    val episodeId: String = "",
)

data class AnimationCard(
    val id: String,
    val mediaType: String = "tv",
    val title: String,
    val posterUrl: String? = null,
    val backdropUrl: String? = null,
    val year: Int? = null,
    val rating: Double? = null,
    val overview: String = "",
)

data class StardimaTitleCard(
    val providerTitleId: String,
    val title: String,
    val titleAr: String? = null,
    val posterUrl: String? = null,
    val backdropUrl: String? = null,
    val mediaType: String = "series",
    val releaseYear: Int? = null,
    val episodeCount: Int? = null,
    val localizationLabels: List<String> = emptyList(),
)

data class StardimaEpisodeEntry(
    val episodeId: String,
    val number: Int,
    val title: String,
    val seasonNumber: Int = 1,
)

data class StardimaServerEntry(
    val name: String,
    val watchUrl: String,
    val quality: String? = null,
)

data class AiringScheduleItem(
    val id: Int,
    val episode: Int,
    val airingAtEpochSec: Long,
    val anime: AnimeCard,
) {
    val airingAt: Long
        get() = airingAtEpochSec

    val timeUntilAiring: Long
        get() = airingAtEpochSec - (System.currentTimeMillis() / 1000L)
}

data class HomeCatalog(
    val trending: List<AnimeCard> = emptyList(),
    val popular: List<AnimeCard> = emptyList(),
    val airing: List<AnimeCard> = emptyList(),
    val seasonal: List<AnimeCard> = emptyList(),
    val topRated: List<AnimeCard> = emptyList(),
    val movies: List<AnimeCard> = emptyList(),
    val isekai: List<AnimeCard> = emptyList(),
    val latestEpisodes: List<LatestEpisodeCard> = emptyList(),
    val dubbedHighlights: List<DubbedSeriesCard> = emptyList(),
)

data class BrowseFilters(
    val search: String? = null,
    val sort: String = "POPULARITY_DESC",
    val format: String? = null,
    val status: String? = null,
    val genre: String? = null,
    val season: String? = null,
    val year: Int? = null,
)

class CatalogException(message: String) : Exception(message)
