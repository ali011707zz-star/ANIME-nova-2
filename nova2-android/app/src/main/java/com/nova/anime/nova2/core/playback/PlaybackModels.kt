package com.nova.anime.nova2.core.playback

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight

/**
 * Interval in seconds for opening (intro) or ending (outro) segments.
 * Mirrors artifacts/nova-mobile/lib/skipTimes.mjs validation rules.
 */
data class SkipInterval(
    val startSeconds: Double,
    val endSeconds: Double,
) {
    fun isValid(durationSeconds: Double = 0.0): Boolean {
        val length = endSeconds - startSeconds
        if (!startSeconds.isFinite() || !endSeconds.isFinite()) return false
        if (startSeconds < 0.0 || endSeconds <= startSeconds) return false
        if (length < 5.0 || length > 300.0) return false
        if (durationSeconds > 0.0 && startSeconds >= durationSeconds) return false
        return true
    }

    fun contains(positionSeconds: Double): Boolean =
        positionSeconds >= startSeconds && positionSeconds < endSeconds - 0.5
}

data class EpisodeSkipTimes(
    val intro: SkipInterval? = null,
    val outro: SkipInterval? = null,
)

enum class SubtitleVerticalPosition(val labelAr: String) {
    TOP("أعلى"),
    CENTER("وسط"),
    BOTTOM("أسفل"),
}

enum class SubtitleFontWeightOption(val labelAr: String, val composeWeight: FontWeight) {
    NORMAL("عادي", FontWeight.Medium),
    BOLD("عريض", FontWeight.Bold),
    EXTRA_BOLD("عريض جدًا", FontWeight.Black),
}

enum class SubtitleColorOption(val labelAr: String, val colorHex: Long) {
    WHITE("أبيض", 0xFFFFFFFF),
    YELLOW("أصفر", 0xFFFACC15),
    CYAN("سماوي", 0xFF38BDF8),
    GREEN("أخضر", 0xFF4ADE80),
    VIOLET("بنفسجي", 0xFFC084FC),
    ;

    val composeColor: Color
        get() = Color(colorHex)
}

/**
 * Full subtitle appearance & timing settings matching RiftPlayer.tsx:
 * - On/Off toggle
 * - Language selection (ar, en, etc.)
 * - Multiple font sizes
 * - Multiple colors
 * - Vertical alignment (Top / Center / Bottom) + vertical offset
 * - Background opacity
 * - Bold & Extra-Bold weights
 * - Timing offset in 0.5s (500ms) steps within safe bounds [-10_000ms .. +10_000ms]
 */
data class SubtitleStyleSettings(
    val enabled: Boolean = true,
    val preferredLanguage: String = "ar",
    val fontSizeSp: Int = 20,
    val colorOption: SubtitleColorOption = SubtitleColorOption.WHITE,
    val verticalPosition: SubtitleVerticalPosition = SubtitleVerticalPosition.BOTTOM,
    val verticalOffsetDp: Int = 0,
    val backgroundAlpha: Float = 0.72f,
    val fontWeightOption: SubtitleFontWeightOption = SubtitleFontWeightOption.BOLD,
    val timingOffsetMs: Long = 0L,
) {
    fun withSteppedTimingOffset(deltaMs: Long): SubtitleStyleSettings {
        val clamped = (timingOffsetMs + deltaMs).coerceIn(MIN_TIMING_OFFSET_MS, MAX_TIMING_OFFSET_MS)
        return copy(timingOffsetMs = clamped)
    }

    fun withClampedVerticalOffset(offsetDp: Int): SubtitleStyleSettings =
        copy(verticalOffsetDp = offsetDp.coerceIn(-60, 60))

    companion object {
        const val TIMING_STEP_MS: Long = 500L
        const val MIN_TIMING_OFFSET_MS: Long = -10_000L
        const val MAX_TIMING_OFFSET_MS: Long = 10_000L
        val FONT_SIZE_PRESETS_SP: List<Pair<Int, String>> = listOf(
            15 to "صغير",
            18 to "متوسط",
            22 to "كبير",
            26 to "كبير جدًا",
            32 to "تلفاز",
        )
        val BACKGROUND_ALPHA_PRESETS: List<Pair<Float, String>> = listOf(
            0.0f to "شفاف",
            0.45f to "خفيف",
            0.75f to "داكن",
            0.95f to "معتم",
        )
    }
}

/**
 * Picture aspect ratio modes matching RiftPlayer.tsx:
 * - FIT (contain with bars)
 * - ZOOM (cover full screen)
 * - FILL (stretch to fill)
 */
enum class AspectRatioFitMode(val id: String, val labelAr: String) {
    FIT("contain", "احتواء (Contain)"),
    ZOOM("cover", "ملء مع قص (Cover)"),
    FILL("fill", "تمديد كامل (Fill)"),
}

enum class PlaybackType {
    HLS,
    MP4,
}

data class SubtitleTrack(
    val key: String,
    val language: String,
    val label: String,
    val url: String,
)

/**
 * Parsed subtitle cue in milliseconds.
 */
data class SubtitleCue(
    val startMs: Long,
    val endMs: Long,
    val text: String,
)

/**
 * Unified player source model matching PlayerSource in artifacts/nova-mobile/components/RiftPlayer.tsx.
 */
data class PlaybackSource(
    val key: String,
    val site: String,
    val name: String,
    val quality: String,
    val qualityRank: Int = 10,
    val url: String,
    val type: PlaybackType = PlaybackType.MP4,
    val headers: Map<String, String> = emptyMap(),
    val embeddedSubtitles: List<SubtitleTrack> = emptyList(),
    val subtitleUrl: String? = null,
    val skipIntro: SkipInterval? = null,
    val skipOutro: SkipInterval? = null,
    val requiresExternalNovaPlayer: Boolean = false,
) {
    fun allSubtitleTracks(): List<SubtitleTrack> {
        val directTrack = subtitleUrl?.trim()?.takeIf { it.isNotEmpty() }?.let { raw ->
            SubtitleTrack(
                key = "source-direct|$raw",
                language = "ar",
                label = "ترجمة المصدر (العربية)",
                url = raw,
            )
        }
        return buildList {
            directTrack?.let(::add)
            addAll(embeddedSubtitles)
        }.distinctBy { it.url }
    }
}

typealias PlayerSource = PlaybackSource

/**
 * Episode & media metadata passed to RiftPlayer.
 */
data class PlayerMetadata(
    val title: String,
    val episodeNumber: Int? = null,
    val episodeTitle: String? = null,
    val quality: String? = null,
    val sourceName: String? = null,
    val anilistId: Int? = null,
    val malId: Int? = null,
    val durationSecondsHint: Int = 0,
)

/**
 * Final playback state returned to caller when the player closes.
 */
data class PlayerExitState(
    val finalPositionMs: Long,
    val durationMs: Long,
    val isPlaying: Boolean,
    val completed: Boolean,
    val playbackSpeed: Float,
)

/**
 * Session-scoped state holder to remember user's chosen playback speed across episode switches
 * in the same app session (as in RiftPlayer.tsx).
 */
object RiftPlayerSessionState {
    val SUPPORTED_SPEEDS: List<Float> = listOf(0.5f, 0.75f, 1.0f, 1.25f, 1.5f, 2.0f)

    @Volatile
    var rememberedPlaybackSpeed: Float = 1.0f
        set(value) {
            field = if (value in SUPPORTED_SPEEDS) value else 1.0f
        }
}
