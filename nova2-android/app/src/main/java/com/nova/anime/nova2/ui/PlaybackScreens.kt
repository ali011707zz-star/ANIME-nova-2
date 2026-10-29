package com.nova.anime.nova2.ui

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.nova.anime.nova2.core.catalog.AnimeDetails
import com.nova.anime.nova2.core.catalog.AnilistRepository
import com.nova.anime.nova2.core.catalog.EpisodeItem
import com.nova.anime.nova2.core.download.DownloadRepository
import com.nova.anime.nova2.core.library.LibraryStore
import com.nova.anime.nova2.core.playback.EpisodeSkipTimes
import com.nova.anime.nova2.core.playback.NovaPlayerServicesAdapter
import com.nova.anime.nova2.core.playback.PlaybackRepository
import com.nova.anime.nova2.core.playback.PlaybackSource
import com.nova.anime.nova2.core.playback.PlaybackType
import com.nova.anime.nova2.core.playback.PlayerMetadata
import com.nova.anime.nova2.core.playback.SubtitleTrack
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

private const val NOVA_EXTERNAL_PLAYER_PKG = "com.player.easy"
private const val NOVA_EXTERNAL_PLAYER_APK_URL = "https://animenovaa.duckdns.org/nova-player.apk"

@Composable
fun WatchScreen(
    repository: AnilistRepository,
    playbackRepository: PlaybackRepository,
    libraryStore: LibraryStore,
    downloadRepository: DownloadRepository,
    id: Int,
    episodeNumber: Int,
    onOpenEpisode: (Int) -> Unit = {},
    onBack: () -> Unit,
) {
    val context = LocalContext.current
    val layout = rememberNovaLayout()
    val scope = rememberCoroutineScope()

    var details by remember(id) { mutableStateOf<AnimeDetails?>(null) }
    var sources by remember(id, episodeNumber) { mutableStateOf<List<PlaybackSource>>(emptyList()) }
    var selectedSourceIndex by remember(id, episodeNumber) { mutableIntStateOf(0) }
    var subtitles by remember(id, episodeNumber) { mutableStateOf<List<SubtitleTrack>>(emptyList()) }
    var skipTimes by remember(id, episodeNumber) { mutableStateOf(EpisodeSkipTimes()) }
    var savedPositionMs by remember(id, episodeNumber) {
        mutableLongStateOf(libraryStore.getSavedPositionMs(id, episodeNumber))
    }
    var loading by remember(id, episodeNumber) { mutableStateOf(true) }
    var error by remember(id, episodeNumber) { mutableStateOf<String?>(null) }
    var downloadMessage by remember(id, episodeNumber) { mutableStateOf<String?>(null) }
    var isFullscreen by remember { mutableStateOf(false) }

    val playerServices = remember(playbackRepository.apiClient) {
        NovaPlayerServicesAdapter(playbackRepository.apiClient)
    }

    // Cancel any active SSE source stream immediately when exiting or switching episodes
    DisposableEffect(id, episodeNumber) {
        val streamJob: Job = scope.launch {
            loading = true
            error = null
            sources = emptyList()
            selectedSourceIndex = 0

            // Check if a completed offline MP4 download exists first
            val localDownload = libraryStore.findCompletedDownload(id, episodeNumber)
            if (localDownload?.localUri != null) {
                val offlineSource = PlaybackSource(
                    key = "offline|${localDownload.downloadId}",
                    site = "ملف محلي (${localDownload.site})",
                    name = "تنزيل أوفلاين",
                    quality = localDownload.quality,
                    qualityRank = 100,
                    url = localDownload.localUri,
                    type = PlaybackType.MP4,
                )
                sources = listOf(offlineSource)
                selectedSourceIndex = 0
            }

            runCatching {
                val loaded = repository.details(id)
                details = loaded
                val episode = EpisodeItem(episodeNumber)

                launch {
                    runCatching { playbackRepository.loadSubtitles(loaded, episode) }
                        .onSuccess { loadedSubs ->
                            subtitles = (loadedSubs + subtitles).distinctBy { it.url }
                        }
                }

                launch {
                    skipTimes = playbackRepository.loadSkipTimes(
                        loaded,
                        episodeNumber,
                        (loaded.durationMinutes ?: 24) * 60,
                    )
                }

                playbackRepository.streamSources(loaded, episode) { source ->
                    sources = (sources + source)
                        .distinctBy { it.key }
                        .sortedByDescending { it.qualityRank }
                    if (source.embeddedSubtitles.isNotEmpty()) {
                        subtitles = (source.embeddedSubtitles + subtitles).distinctBy { it.url }
                    }
                }
            }.onFailure { err ->
                if (sources.isEmpty()) {
                    error = err.message ?: "تعذر تحميل مصادر المشاهدة"
                }
            }
            loading = false
        }

        onDispose {
            streamJob.cancel()
        }
    }

    val totalEpisodes = details?.card?.episodes ?: (episodeNumber + 1)
    val hasPrevEpisode = episodeNumber > 1
    val hasNextEpisode = episodeNumber < totalEpisodes
    val currentSource = sources.getOrNull(selectedSourceIndex)

    val metadata = remember(details, episodeNumber, currentSource) {
        PlayerMetadata(
            title = details?.card?.arabicTitle ?: details?.card?.title ?: "المشاهدة",
            episodeNumber = episodeNumber,
            episodeTitle = details?.card?.englishTitle,
            quality = currentSource?.quality,
            sourceName = currentSource?.name ?: currentSource?.site,
            anilistId = id,
            malId = details?.malId,
            durationSecondsHint = (details?.durationMinutes ?: 24) * 60,
        )
    }

    if (isFullscreen && sources.isNotEmpty()) {
        RiftPlayer(
            sources = sources,
            selectedSourceIndex = selectedSourceIndex,
            metadata = metadata,
            initialPositionMs = savedPositionMs,
            externalSubtitles = subtitles,
            initialSkipTimes = skipTimes,
            playerServices = playerServices,
            isTv = layout.isTv,
            isFullscreen = true,
            hasPrevEpisode = hasPrevEpisode,
            hasNextEpisode = hasNextEpisode,
            onToggleFullscreen = { isFullscreen = false },
            onPrevEpisode = { if (hasPrevEpisode) onOpenEpisode(episodeNumber - 1) },
            onNextEpisode = { if (hasNextEpisode) onOpenEpisode(episodeNumber + 1) },
            onProgress = { positionMs, durationMs ->
                savedPositionMs = positionMs
                val card = details?.card
                libraryStore.recordHistory(
                    animeId = id,
                    title = card?.title ?: "أنمي #$id",
                    coverUrl = card?.coverUrl,
                    episode = episodeNumber,
                    positionMs = positionMs,
                    durationMs = durationMs,
                )
            },
            onActiveSourceChanged = { newIndex, _ ->
                selectedSourceIndex = newIndex
            },
            onClose = { exitState ->
                savedPositionMs = exitState.finalPositionMs
                isFullscreen = false
            },
        )
        return
    }

    CatalogScaffold(
        title = "${details?.card?.title ?: "المشاهدة"} · الحلقة $episodeNumber",
        onBack = onBack,
    ) {
        if (loading && sources.isEmpty()) {
            item { LoadingBlock() }
        }
        error?.let { item { ErrorBlock(it) } }

        if (sources.isNotEmpty()) {
            item {
                RiftPlayer(
                    sources = sources,
                    selectedSourceIndex = selectedSourceIndex,
                    metadata = metadata,
                    initialPositionMs = savedPositionMs,
                    externalSubtitles = subtitles,
                    initialSkipTimes = skipTimes,
                    playerServices = playerServices,
                    isTv = layout.isTv,
                    isFullscreen = false,
                    hasPrevEpisode = hasPrevEpisode,
                    hasNextEpisode = hasNextEpisode,
                    onToggleFullscreen = { isFullscreen = true },
                    onPrevEpisode = { if (hasPrevEpisode) onOpenEpisode(episodeNumber - 1) },
                    onNextEpisode = { if (hasNextEpisode) onOpenEpisode(episodeNumber + 1) },
                    onProgress = { positionMs, durationMs ->
                        savedPositionMs = positionMs
                        val card = details?.card
                        libraryStore.recordHistory(
                            animeId = id,
                            title = card?.title ?: "أنمي #$id",
                            coverUrl = card?.coverUrl,
                            episode = episodeNumber,
                            positionMs = positionMs,
                            durationMs = durationMs,
                        )
                    },
                    onActiveSourceChanged = { newIndex, _ ->
                        selectedSourceIndex = newIndex
                    },
                    onClose = { exitState ->
                        savedPositionMs = exitState.finalPositionMs
                        onBack()
                    },
                )
            }

            // Server selector stays in the parent WatchScreen (outside RiftPlayer)
            item {
                Text(
                    "السيرفرات والجودات المتاحة (${sources.size})",
                    style = MaterialTheme.typography.titleLarge,
                    modifier = Modifier.padding(start = 16.dp, top = 16.dp, end = 16.dp),
                )
            }
            item {
                LazyRow(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    itemsIndexed(sources, key = { _, src -> src.key }) { index, source ->
                        FilterChip(
                            selected = index == selectedSourceIndex,
                            onClick = { selectedSourceIndex = index },
                            label = {
                                Text(
                                    buildString {
                                        append("${source.site} · ${source.quality}")
                                        if (source.type == PlaybackType.HLS) append(" (HLS)")
                                    },
                                )
                            },
                        )
                    }
                }
            }
            item {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    val canDownloadMp4 = details != null &&
                        currentSource?.let {
                            it.type == PlaybackType.MP4 &&
                                playbackRepository.apiClient.buildDownloadUrl(it.site, it.url) != null
                        } == true
                    Button(
                        enabled = canDownloadMp4,
                        onClick = {
                            val currentDetails = details
                            val activeSrc = currentSource
                            val record = if (currentDetails != null && activeSrc != null) {
                                runCatching {
                                    downloadRepository.enqueue(
                                        currentDetails,
                                        EpisodeItem(episodeNumber),
                                        activeSrc,
                                    )
                                }.getOrNull()
                            } else {
                                null
                            }
                            downloadMessage = if (record != null) {
                                "تمت إضافة الحلقة إلى التنزيلات (MP4)"
                            } else {
                                "التنزيل متاح لمصادر MP4 المباشرة عبر خادم NOVA فقط (روابط HLS غير مدعومة للتنزيل المحلي)"
                            }
                        },
                        modifier = Modifier.weight(1f),
                    ) {
                        Text(if (canDownloadMp4) "تنزيل الحلقة كـ MP4" else "تنزيل MP4 (اختر مصدر MP4)")
                    }
                    OutlinedButton(
                        onClick = {
                            currentSource?.url?.let { openInExternalNovaPlayer(context, it) }
                        },
                    ) {
                        Text("NOVA Player الخارجي")
                    }
                }
                downloadMessage?.let {
                    Text(
                        it,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp),
                        color = MaterialTheme.colorScheme.secondary,
                    )
                }
            }
        }

        if (!loading && sources.isEmpty() && error == null) {
            item {
                Text(
                    "لا توجد مصادر تشغيل متاحة حاليًا لهذه الحلقة",
                    modifier = Modifier.padding(16.dp),
                )
            }
        }
    }
}

private fun openInExternalNovaPlayer(context: Context, videoUrl: String) {
    val launchIntent = Intent(Intent.ACTION_VIEW).apply {
        setDataAndType(Uri.parse(videoUrl), "video/*")
        setPackage(NOVA_EXTERNAL_PLAYER_PKG)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    val canResolve = launchIntent.resolveActivity(context.packageManager) != null
    if (canResolve) {
        runCatching { context.startActivity(launchIntent) }
    } else {
        val fallbackDownload = Intent(Intent.ACTION_VIEW, Uri.parse(NOVA_EXTERNAL_PLAYER_APK_URL)).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        runCatching { context.startActivity(fallbackDownload) }
    }
}
