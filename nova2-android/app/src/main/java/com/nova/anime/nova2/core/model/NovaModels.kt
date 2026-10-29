package com.nova.anime.nova2.core.model

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject

@Serializable
data class AnonymousTokenResponse(
    val token: String? = null,
    val exp: Long? = null,
    val ttl: Int? = null,
    val downloadToken: String? = null,
    val downloadExp: Long? = null,
)

@Serializable
data class SignInRequest(
    val email: String,
    val password: String,
)

@Serializable
data class SignUpRequest(
    val email: String,
    val password: String,
    val displayName: String? = null,
    val verifyCode: String? = null,
)

@Serializable
data class VerifyCodeRequest(
    val email: String,
    val type: String = "signup",
)

@Serializable
data class AuthResponse(
    val id: String? = null,
    val email: String? = null,
    val displayName: String? = null,
    val username: String? = null,
    val avatarColor: Int? = null,
    val profileImageUrl: String? = null,
    val authToken: String? = null,
)

@Serializable
data class ProfileUpdateRequest(
    val displayName: String? = null,
    val username: String? = null,
    val avatarColor: Int? = null,
    val profileImageUrl: String? = null,
)

@Serializable
data class BasicOkResponse(
    val ok: Boolean = false,
)

@Serializable
data class GraphQlRequest(
    val query: String,
    val variables: JsonObject = JsonObject(emptyMap()),
)

@Serializable
data class RemoteConfigResponse(
    val sources: Map<String, Boolean> = emptyMap(),
    val announcements: List<AnnouncementDto> = emptyList(),
    val features: Map<String, Boolean> = emptyMap(),
    val maintenanceMode: Boolean = false,
    val maintenanceMessage: String? = null,
    val version: String? = null,
    val limits: LimitsDto? = null,
    val officialDownloadRequired: Boolean = false,
)

@Serializable
data class AnnouncementDto(
    val id: String,
    val message: String,
    val type: String = "info",
    val link: String? = null,
)

@Serializable
data class LimitsDto(
    val downloadLimit: Int? = null,
    val watchAccessMinutes: Int? = null,
)

@Serializable
data class UserDto(
    val id: String? = null,
    val email: String? = null,
    val displayName: String? = null,
    val display_name: String? = null,
    val username: String? = null,
    val avatarColor: Int? = null,
    val avatar_color: Int? = null,
    val profileImageUrl: String? = null,
    val profile_image_url: String? = null,
)

@Serializable
data class VideoSourceDto(
    val url: String? = null,
    val directUrl: String? = null,
    val label: String? = null,
    val quality: String? = null,
    val type: String? = null,
    val subtitles: List<SubtitleTrackDto> = emptyList(),
    val server: String? = null,
    val qualityRank: Int? = null,
    val referer: String? = null,
)

@Serializable
data class SubtitleTrackDto(
    val label: String? = null,
    val src: String? = null,
    val kind: String? = null,
    val language: String? = null,
)

@Serializable
data class AnimeItemDto(
    val id: Int? = null,
    val title: String? = null,
    val english: String? = null,
    val thumbnail: String? = null,
    val cover: String? = null,
    val banner: String? = null,
    val episodes: Int? = null,
    val score: Double? = null,
    val genres: List<String> = emptyList(),
)

@Serializable
data class ApiErrorDto(
    val code: String? = null,
    val message: String? = null,
    val error: String? = null,
    val officialDownloadRequired: Boolean = false,
)

@Serializable
data class DeviceLinkRequestResponse(
    val ok: Boolean = false,
    val requestId: String? = null,
    val code: String? = null,
    val expiresAt: String? = null,
    val ttlSeconds: Int = 300,
)

@Serializable
data class DeviceLinkClaimRequest(
    val code: String,
    val deviceId: String,
    val platform: String = "android-tv",
    val deviceName: String = "Android TV",
)

@Serializable
data class LinkedDeviceDto(
    val id: String,
    val deviceId: String? = null,
    val deviceName: String = "جهاز مرتبط",
    val platform: String = "android",
    val linkedAt: String? = null,
    val lastSeenAt: String? = null,
)

@Serializable
data class DeviceLinkClaimResponse(
    val ok: Boolean = false,
    val id: String? = null,
    val email: String? = null,
    val displayName: String? = null,
    val username: String? = null,
    val avatarColor: Int? = null,
    val profileImageUrl: String? = null,
    val authToken: String? = null,
    val device: LinkedDeviceDto? = null,
)

@Serializable
data class LinkedDevicesResponse(
    val devices: List<LinkedDeviceDto> = emptyList(),
)

@Serializable
data class CommentDto(
    val id: String,
    val userId: String? = null,
    val username: String = "مستخدم",
    val userHandle: String? = null,
    val avatarUrl: String? = null,
    val animeId: Int? = null,
    val tmdbId: String? = null,
    val episodeNumber: Int? = null,
    val animeType: String = "anime",
    val text: String = "",
    val likes: Int = 0,
    val likedByMe: Boolean = false,
    val parentId: String? = null,
    val replyToUsername: String? = null,
    val createdAt: String? = null,
)

@Serializable
data class CreateCommentRequest(
    val animeId: Int? = null,
    val tmdbId: String? = null,
    val episodeNumber: Int? = null,
    val animeType: String = "anime",
    val text: String,
    val username: String? = null,
    val userHandle: String? = null,
    val avatarUrl: String? = null,
    val parentId: String? = null,
    val replyToUsername: String? = null,
)

@Serializable
data class NewsArticleDto(
    val id: String,
    val title: String,
    val description: String = "",
    val url: String = "",
    val thumbnail: String? = null,
    val publishedAt: String = "",
    val category: String = "أخبار الأنمي",
)

@Serializable
data class NewsResponseDto(
    val articles: List<NewsArticleDto> = emptyList(),
    val total: Int = 0,
)

@Serializable
data class ReportSubmitRequest(
    val animeId: Int? = null,
    val title: String,
    val episode: Int? = null,
    val server: String? = null,
    val reason: String,
    val details: String? = null,
)

@Serializable
data class CrashReportPayload(
    val ts: Long = System.currentTimeMillis(),
    val type: String,
    val message: String,
    val stack: String? = null,
    val context: String? = null,
    val isFatal: Boolean = false,
    val platform: String = "android",
    val appVersion: String = "1.0.0",
    val deviceModel: String? = null,
)

@Serializable
data class UserFavoriteSyncPayload(
    val animeId: Int,
    val animeTitle: String,
    val animeCover: String? = null,
    val animeType: String = "anime",
    val score: Int? = null,
    val episodes: Int? = null,
)

@Serializable
data class UserHistorySyncPayload(
    val animeId: Int,
    val animeTitle: String,
    val animeCover: String? = null,
    val animeType: String = "anime",
    val episodeNumber: Int,
    val seasonNumber: Int = 1,
    val tmdbId: String? = null,
    val mediaType: String? = null,
)

@Serializable
data class UserProgressSyncPayload(
    val animeId: Int,
    val animeType: String = "anime",
    val episodeNumber: Int,
    val seasonNumber: Int = 1,
    val tmdbId: String? = null,
    val progressSeconds: Int,
    val durationSeconds: Int,
)

@Serializable
data class StardimaResolveRequest(
    val watchUrl: String,
    val referer: String? = null,
)

data class SourceRequest(
    val site: String,
    val title: String,
    val episode: Int,
    val animeId: String? = null,
    val malId: Int? = null,
    val anilistId: Int? = null,
    val season: Int? = null,
    val english: String? = null,
    val native: String? = null,
    val format: String? = null,
    val year: Int? = null,
    val episodes: Int? = null,
    val titleAr: String? = null,
)

data class SourceStreamEvent(
    val event: String,
    val data: JsonElement?,
)
