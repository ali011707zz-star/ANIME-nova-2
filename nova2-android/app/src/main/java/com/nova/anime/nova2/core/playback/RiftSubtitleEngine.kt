package com.nova.anime.nova2.core.playback

import android.content.Context
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

/**
 * Subtitle parser and synchronizer supporting WebVTT (.vtt) and SubRip (.srt).
 * Mirrors subtitle parsing & synchronization in artifacts/nova-mobile/components/RiftPlayer.tsx.
 */
object RiftSubtitleEngine {

    private val timestampLineRegex = Regex(
        """^\s*((?:\d{1,2}:)?\d{2}:\d{2}[.,]\d{1,3})\s*-->\s*((?:\d{1,2}:)?\d{2}:\d{2}[.,]\d{1,3})""",
    )
    private val htmlTagRegex = Regex("""<[^>]+>""")

    /**
     * Loads and parses a VTT/SRT subtitle track from either a local URI (`file://`, `content://`)
     * or a remote URL (`http://`, `https://`) via [PlayerServices].
     */
    suspend fun loadAndParseTrack(
        context: Context,
        track: SubtitleTrack,
        sourceHeaders: Map<String, String>,
        playerServices: PlayerServices,
    ): List<SubtitleCue> = withContext(Dispatchers.IO) {
        val rawUrl = track.url.trim()
        if (rawUrl.isEmpty()) return@withContext emptyList()

        val rawText: String? = when {
            rawUrl.startsWith("file://", ignoreCase = true) -> {
                runCatching {
                    val path = Uri.parse(rawUrl).path ?: return@runCatching null
                    File(path).takeIf { it.exists() }?.readText(Charsets.UTF_8)
                }.getOrNull()
            }
            rawUrl.startsWith("content://", ignoreCase = true) -> {
                runCatching {
                    context.contentResolver.openInputStream(Uri.parse(rawUrl))?.bufferedReader(Charsets.UTF_8)?.use {
                        it.readText()
                    }
                }.getOrNull()
            }
            rawUrl.startsWith("/") -> {
                runCatching {
                    File(rawUrl).takeIf { it.exists() }?.readText(Charsets.UTF_8)
                }.getOrNull()
            }
            else -> {
                playerServices.fetchSubtitleText(rawUrl, sourceHeaders)
            }
        }

        if (rawText.isNullOrBlank()) return@withContext emptyList()
        parseVttOrSrt(rawText)
    }

    /**
     * Parses WebVTT or SRT subtitle text into sorted [SubtitleCue] items.
     */
    fun parseVttOrSrt(rawContent: String): List<SubtitleCue> {
        val normalized = rawContent
            .replace("\uFEFF", "")
            .replace("\r\n", "\n")
            .replace('\r', '\n')

        val lines = normalized.lines()
        val cues = ArrayList<SubtitleCue>()
        var i = 0

        while (i < lines.size) {
            val line = lines[i].trim()
            if (line.isEmpty() || line.startsWith("WEBVTT", ignoreCase = true) || line.startsWith("NOTE", ignoreCase = true)) {
                i++
                continue
            }

            // Skip optional numeric cue index or header line if next line is timestamp
            var match = timestampLineRegex.find(line)
            if (match == null && i + 1 < lines.size) {
                val nextLine = lines[i + 1].trim()
                val nextMatch = timestampLineRegex.find(nextLine)
                if (nextMatch != null) {
                    match = nextMatch
                    i++
                }
            }

            if (match != null) {
                val startMs = parseTimestampMs(match.groupValues[1])
                val endMs = parseTimestampMs(match.groupValues[2])
                i++
                val textBuilder = StringBuilder()
                while (i < lines.size && lines[i].trim().isNotEmpty()) {
                    val cleaned = cleanCueLine(lines[i])
                    if (cleaned.isNotEmpty()) {
                        if (textBuilder.isNotEmpty()) textBuilder.append('\n')
                        textBuilder.append(cleaned)
                    }
                    i++
                }
                val cueText = textBuilder.toString().trim()
                if (startMs >= 0L && endMs > startMs && cueText.isNotEmpty()) {
                    cues.add(SubtitleCue(startMs = startMs, endMs = endMs, text = cueText))
                }
            } else {
                i++
            }
        }

        return cues.sortedBy { it.startMs }
    }

    /**
     * Returns active subtitle text at [positionMs] adjusted by [timingOffsetMs].
     * A positive [timingOffsetMs] delays subtitles; a negative offset advances them.
     */
    fun findActiveSubtitleText(
        cues: List<SubtitleCue>,
        positionMs: Long,
        timingOffsetMs: Long,
    ): String? {
        if (cues.isEmpty()) return null
        val effectiveTimeMs = positionMs - timingOffsetMs
        if (effectiveTimeMs < 0L) return null

        val matching = cues.filter { cue ->
            effectiveTimeMs >= cue.startMs && effectiveTimeMs <= cue.endMs
        }
        if (matching.isEmpty()) return null
        return matching.joinToString("\n") { it.text }
    }

    private fun parseTimestampMs(raw: String): Long {
        val cleaned = raw.trim().replace(',', '.')
        val parts = cleaned.split(':')
        return runCatching {
            val (hours, minutes, secondsAndMillis) = when (parts.size) {
                3 -> Triple(parts[0].toLong(), parts[1].toLong(), parts[2])
                2 -> Triple(0L, parts[0].toLong(), parts[1])
                else -> return@runCatching -1L
            }
            val secParts = secondsAndMillis.split('.')
            val seconds = secParts[0].toLong()
            val millis = if (secParts.size > 1) {
                secParts[1].padEnd(3, '0').take(3).toLong()
            } else {
                0L
            }
            ((hours * 3600L) + (minutes * 60L) + seconds) * 1000L + millis
        }.getOrDefault(-1L)
    }

    private fun cleanCueLine(line: String): String {
        return line
            .replace(htmlTagRegex, "")
            .replace("&nbsp;", " ")
            .replace("&amp;", "&")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
            .replace("&quot;", "\"")
            .replace("&#39;", "'")
            .trim()
    }
}
