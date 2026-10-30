package com.nova.anime.nova2.ui

import android.Manifest
import android.app.Activity
import android.media.AudioManager
import android.os.Build
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.OptIn
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.focusable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.detectVerticalDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.media3.common.PlaybackException
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import com.nova.anime.nova2.core.playback.AspectRatioFitMode
import com.nova.anime.nova2.core.playback.EpisodeSkipTimes
import com.nova.anime.nova2.core.playback.MediaUriValidationResult
import com.nova.anime.nova2.core.playback.PlaybackSource
import com.nova.anime.nova2.core.playback.PlayerExitState
import com.nova.anime.nova2.core.playback.PlayerMetadata
import com.nova.anime.nova2.core.playback.PlayerServices
import com.nova.anime.nova2.core.playback.RiftMediaSourceFactory
import com.nova.anime.nova2.core.playback.RiftPlayerSessionState
import com.nova.anime.nova2.core.playback.RiftScreenshotCapture
import com.nova.anime.nova2.core.playback.RiftSubtitleEngine
import com.nova.anime.nova2.core.playback.ScreenshotSaveResult
import com.nova.anime.nova2.core.playback.SubtitleColorOption
import com.nova.anime.nova2.core.playback.SubtitleCue
import com.nova.anime.nova2.core.playback.SubtitleFontWeightOption
import com.nova.anime.nova2.core.playback.SubtitleStyleSettings
import com.nova.anime.nova2.core.playback.SubtitleTrack
import com.nova.anime.nova2.core.playback.SubtitleVerticalPosition
import com.nova.anime.nova2.core.playback.UnconfiguredPlayerServices
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlin.math.roundToInt

private const val STALL_THRESHOLD_MS = 8_500L
private const val HUD_AUTO_HIDE_MS = 3_500L

/**
 * Full-screen RTL dark/violet glassmorphic native video player built with Kotlin, Jetpack Compose,
 * and AndroidX Media3 [ExoPlayer].
 *
 * Ports the active behavior and visual design of `artifacts/nova-mobile/components/RiftPlayer.tsx`
 * without React Native, WebView, or default `PlayerView` controls.
 */
@OptIn(UnstableApi::class)
@Composable
fun RiftPlayer(
    sources: List<PlaybackSource>,
    selectedSourceIndex: Int = 0,
    metadata: PlayerMetadata,
    initialPositionMs: Long = 0L,
    externalSubtitles: List<SubtitleTrack> = emptyList(),
    initialSkipTimes: EpisodeSkipTimes = EpisodeSkipTimes(),
    playerServices: PlayerServices = remember { UnconfiguredPlayerServices() },
    isTv: Boolean = false,
    isFullscreen: Boolean = false,
    hasPrevEpisode: Boolean = false,
    hasNextEpisode: Boolean = false,
    onToggleFullscreen: (() -> Unit)? = null,
    onPrevEpisode: () -> Unit = {},
    onNextEpisode: () -> Unit = {},
    onProgress: (positionMs: Long, durationMs: Long) -> Unit = { _, _ -> },
    onActiveSourceChanged: (index: Int, source: PlaybackSource) -> Unit = { _, _ -> },
    onClose: (PlayerExitState) -> Unit = {},
) {
    val context = LocalContext.current
    val activity = context as? Activity
    val audioManager = remember(context) { context.getSystemService(AudioManager::class.java) }
    val scope = rememberCoroutineScope()
    val orientationController = rememberRiftOrientationController(activity = activity, isTv = isTv)

    // Serialized source switch mutex to prevent concurrent native MediaSource switches
    val sourceSwitchMutex = remember { Mutex() }

    var activeIndex by remember(sources) {
        mutableIntStateOf(selectedSourceIndex.coerceIn(0, (sources.size - 1).coerceAtLeast(0)))
    }
    LaunchedEffect(selectedSourceIndex, sources.size) {
        if (selectedSourceIndex in sources.indices && selectedSourceIndex != activeIndex) {
            activeIndex = selectedSourceIndex
        }
    }

    val currentSource: PlaybackSource? = sources.getOrNull(activeIndex)

    // Track single refresh attempts per source key before failing over to the next source
    var refreshedSourceKeys by remember(sources) { mutableStateOf<Set<String>>(emptySet()) }
    var failedSourceKeys by remember(sources) { mutableStateOf<Set<String>>(emptySet()) }
    var sourceStatusNotice by remember { mutableStateOf<String?>(null) }
    var terminalErrorAr by remember { mutableStateOf<String?>(null) }

    // Playback state
    var isPlaying by remember { mutableStateOf(true) }
    var isBuffering by remember { mutableStateOf(true) }
    var isEnded by remember { mutableStateOf(false) }
    var isMuted by remember { mutableStateOf(false) }
    var currentPositionMs by remember { mutableLongStateOf(initialPositionMs.coerceAtLeast(0L)) }
    var durationMs by remember { mutableLongStateOf(0L) }
    var bufferedPositionMs by remember { mutableLongStateOf(0L) }
    var isScrubbing by remember { mutableStateOf(false) }
    var scrubPositionMs by remember { mutableLongStateOf(0L) }

    // Speed state remembered across episode changes in the session
    var playbackSpeed by remember {
        mutableFloatStateOf(RiftPlayerSessionState.rememberedPlaybackSpeed)
    }
    var preBoostSpeed by remember {
        mutableFloatStateOf(RiftPlayerSessionState.rememberedPlaybackSpeed)
    }
    var isLongPressBoosting by remember { mutableStateOf(false) }

    // Display modes: contain / cover / fill + 180-degree flip + touch lock
    var fitMode by remember { mutableStateOf(AspectRatioFitMode.FIT) }
    var isFlipped180 by remember { mutableStateOf(false) }
    var controlsLocked by remember { mutableStateOf(false) }
    var unlockPillVisible by remember { mutableStateOf(true) }
    var hudVisible by remember { mutableStateOf(true) }
    var hudInteractionTick by remember { mutableIntStateOf(0) }
    var gestureHudText by remember { mutableStateOf<String?>(null) }
    var gestureHudProgress by remember { mutableStateOf<Float?>(null) }
    // Transient Brightness / Volume pill (strictly temporary — appears only during touch drag and disappears automatically)
    var transientLevelKind by remember { mutableStateOf<String?>(null) } // "brightness" | "volume"
    var transientLevelPercent by remember { mutableIntStateOf(0) }
    var transientLevelTick by remember { mutableIntStateOf(0) }

    // Subtitles state — immediately cleared whenever source changes
    var serviceSubtitles by remember(metadata.anilistId, metadata.episodeNumber) {
        mutableStateOf<List<SubtitleTrack>>(emptyList())
    }
    val availableSubtitles: List<SubtitleTrack> = remember(
        currentSource?.key,
        externalSubtitles,
        serviceSubtitles,
    ) {
        val sourceTracks = currentSource?.allSubtitleTracks().orEmpty()
        (sourceTracks + externalSubtitles + serviceSubtitles).distinctBy { it.url }
    }
    var selectedSubtitleTrack by remember(currentSource?.key) {
        mutableStateOf<SubtitleTrack?>(null)
    }
    var parsedSubtitleCues by remember(currentSource?.key) {
        mutableStateOf<List<SubtitleCue>>(emptyList())
    }
    var subtitleLoading by remember(currentSource?.key) { mutableStateOf(false) }
    var subtitleStyle by remember { mutableStateOf(SubtitleStyleSettings()) }
    var showSubtitleSettingsModal by remember { mutableStateOf(false) }
    var showSpeedMenu by remember { mutableStateOf(false) }

    // Skip Intro / Outro state
    var resolvedSkipTimes by remember(metadata.anilistId, metadata.episodeNumber) {
        mutableStateOf(initialSkipTimes)
    }
    LaunchedEffect(initialSkipTimes) {
        if (initialSkipTimes.intro != null || initialSkipTimes.outro != null) {
            resolvedSkipTimes = initialSkipTimes
        }
    }

    // Hold reference to PlayerView for screenshot capture
    var playerViewRef by remember { mutableStateOf<PlayerView?>(null) }
    var subtitleLoadJob by remember { mutableStateOf<Job?>(null) }

    // Single reusable ExoPlayer instance
    val player = remember(context) {
        ExoPlayer.Builder(context).build().apply {
            playWhenReady = true
            playbackParameters = PlaybackParameters(playbackSpeed, 1.0f)
        }
    }

    // Helper to trigger single refresh or advance to next source on failure/stall
    fun handleSourceFailureOrStall(reasonAr: String) {
        val activeSrc = currentSource ?: run {
            terminalErrorAr = reasonAr
            return
        }
        scope.launch {
            sourceSwitchMutex.withLock {
                val savedPos = if (player.currentPosition > 1_000L) {
                    player.currentPosition
                } else {
                    currentPositionMs.coerceAtLeast(initialPositionMs)
                }
                currentPositionMs = savedPos

                // Step 1: Attempt single refresh of the current source before failing over
                if (activeSrc.key !in refreshedSourceKeys) {
                    refreshedSourceKeys = refreshedSourceKeys + activeSrc.key
                    sourceStatusNotice = "تعثر المصدر (${activeSrc.name}) — جارٍ إنعاش المصدر من نفس الموضع..."
                    val validation = RiftMediaSourceFactory.validateSourceUrl(activeSrc.url, activeSrc.type)
                    if (validation is MediaUriValidationResult.Valid) {
                        val headers = RiftMediaSourceFactory.buildRequestHeaders(
                            source = activeSrc,
                            defaultHeaders = playerServices.defaultMediaHeaders(),
                        )
                        val mediaSource = RiftMediaSourceFactory.createMediaSource(context, validation, headers)
                        player.stop()
                        player.setMediaSource(mediaSource)
                        if (savedPos > 0L) player.seekTo(savedPos)
                        player.playbackParameters = PlaybackParameters(playbackSpeed, 1.0f)
                        player.prepare()
                        player.playWhenReady = true
                        return@withLock
                    }
                }

                // Step 2: Mark current source failed and advance to next available source
                val updatedFailed = failedSourceKeys + activeSrc.key
                failedSourceKeys = updatedFailed
                val nextIndex = sources.indices.firstOrNull { idx ->
                    idx != activeIndex && sources[idx].key !in updatedFailed
                }

                if (nextIndex != null) {
                    val nextSrc = sources[nextIndex]
                    sourceStatusNotice = "تعذر تشغيل (${activeSrc.name}) — جارٍ الانتقال تلقائيًا إلى (${nextSrc.name})..."
                    terminalErrorAr = null
                    activeIndex = nextIndex
                    onActiveSourceChanged(nextIndex, nextSrc)
                } else {
                    player.pause()
                    isBuffering = false
                    sourceStatusNotice = null
                    terminalErrorAr = "$reasonAr — تعذر تشغيل جميع المصادر المتاحة (${sources.size})"
                }
            }
        }
    }

    // Attach ExoPlayer listener
    DisposableEffect(player, currentSource?.key) {
        val listener = object : Player.Listener {
            override fun onPlaybackStateChanged(playbackState: Int) {
                isBuffering = playbackState == Player.STATE_BUFFERING
                if (playbackState == Player.STATE_READY) {
                    sourceStatusNotice = null
                    terminalErrorAr = null
                    durationMs = player.duration.coerceAtLeast(0L)
                }
                if (playbackState == Player.STATE_ENDED) {
                    isEnded = true
                    isPlaying = false
                    hudVisible = true
                }
            }

            override fun onIsPlayingChanged(playing: Boolean) {
                isPlaying = playing
            }

            override fun onPlayerError(error: PlaybackException) {
                handleSourceFailureOrStall("حدث خطأ أثناء تشغيل المصدر (${currentSource?.name ?: "غير معروف"})")
            }
        }
        player.addListener(listener)
        onDispose {
            player.removeListener(listener)
        }
    }

    // Release ExoPlayer cleanly and report final state on dispose
    DisposableEffect(player) {
        onDispose {
            subtitleLoadJob?.cancel()
            player.release()
        }
    }

    // Load optional tracks and skip times from PlayerServices if configured
    LaunchedEffect(metadata.anilistId, metadata.episodeNumber, playerServices.isConfigured) {
        if (!playerServices.isConfigured) return@LaunchedEffect
        launch {
            val loadedTracks = playerServices.fetchSubtitleTracks(metadata)
            if (loadedTracks.isNotEmpty()) {
                serviceSubtitles = loadedTracks
            }
        }
        launch {
            if (resolvedSkipTimes.intro == null && resolvedSkipTimes.outro == null) {
                val fetchedSkip = playerServices.fetchSkipTimes(
                    metadata = metadata,
                    durationSeconds = metadata.durationSecondsHint,
                )
                if (fetchedSkip.intro != null || fetchedSkip.outro != null) {
                    resolvedSkipTimes = fetchedSkip
                }
            }
        }
    }

    // Switch MediaSource safely when currentSource changes & immediately clear old subtitles
    LaunchedEffect(currentSource?.key) {
        // Immediately stop & clear previous subtitles so stale cues never remain on screen
        subtitleLoadJob?.cancel()
        parsedSubtitleCues = emptyList()
        subtitleLoading = false

        val src = currentSource
        if (src == null) {
            player.stop()
            player.clearMediaItems()
            isBuffering = false
            terminalErrorAr = if (sources.isEmpty()) "لا توجد مصادر تشغيل متاحة لهذه الحلقة" else null
            return@LaunchedEffect
        }

        // Auto-select preferred subtitle track for the new source
        selectedSubtitleTrack = availableSubtitles.firstOrNull {
            it.language.startsWith(subtitleStyle.preferredLanguage, ignoreCase = true)
        } ?: availableSubtitles.firstOrNull()

        sourceSwitchMutex.withLock {
            val resumePos = if (currentPositionMs > 1_000L) {
                currentPositionMs
            } else {
                initialPositionMs.coerceAtLeast(0L)
            }
            val validation = RiftMediaSourceFactory.validateSourceUrl(src.url, src.type)
            when (validation) {
                is MediaUriValidationResult.Invalid -> {
                    handleSourceFailureOrStall(validation.reasonAr)
                }
                is MediaUriValidationResult.Valid -> {
                    terminalErrorAr = null
                    isEnded = false
                    isBuffering = true
                    val headers = RiftMediaSourceFactory.buildRequestHeaders(
                        source = src,
                        defaultHeaders = playerServices.defaultMediaHeaders(),
                    )
                    val mediaSource = RiftMediaSourceFactory.createMediaSource(
                        context = context,
                        valid = validation,
                        requestHeaders = headers,
                    )
                    player.stop()
                    player.setMediaSource(mediaSource)
                    if (resumePos > 0L) {
                        player.seekTo(resumePos)
                    }
                    // Preserve natural audio pitch (1.0f) with remembered playback speed
                    player.playbackParameters = PlaybackParameters(playbackSpeed, 1.0f)
                    player.prepare()
                    player.playWhenReady = true
                }
            }
        }
    }

    // Load VTT/SRT cues whenever selectedSubtitleTrack changes
    LaunchedEffect(selectedSubtitleTrack?.url, currentSource?.key, subtitleStyle.enabled) {
        subtitleLoadJob?.cancel()
        parsedSubtitleCues = emptyList()
        val track = selectedSubtitleTrack
        val src = currentSource
        if (!subtitleStyle.enabled || track == null || src == null) {
            subtitleLoading = false
            return@LaunchedEffect
        }
        subtitleLoading = true
        val job = scope.launch {
            val cues = RiftSubtitleEngine.loadAndParseTrack(
                context = context,
                track = track,
                sourceHeaders = src.headers,
                playerServices = playerServices,
            )
            parsedSubtitleCues = cues
            subtitleLoading = false
        }
        subtitleLoadJob = job
    }

    // Apply playback speed while keeping pitch = 1.0f (natural voice pitch)
    LaunchedEffect(playbackSpeed) {
        player.playbackParameters = PlaybackParameters(playbackSpeed, 1.0f)
    }

    // Apply mute state
    LaunchedEffect(isMuted) {
        player.volume = if (isMuted) 0f else 1f
    }

    // Progress polling + True Stall Detection watchdog
    LaunchedEffect(player, currentSource?.key) {
        var lastAdvancedPositionMs = -1L
        var stallAccumulatedMs = 0L

        while (true) {
            delay(250L)
            val pos = player.currentPosition.coerceAtLeast(0L)
            val dur = player.duration.coerceAtLeast(0L)
            val buf = player.bufferedPosition.coerceAtLeast(pos)
            val state = player.playbackState

            if (!isScrubbing) {
                currentPositionMs = pos
            }
            if (dur > 0L) {
                durationMs = dur
            }
            bufferedPositionMs = buf
            isPlaying = player.isPlaying
            isBuffering = state == Player.STATE_BUFFERING

            if (pos > 0L && dur > 0L) {
                onProgress(pos, dur)
            }

            // Detect real stall: player wants to play (playWhenReady && !isEnded && terminalErrorAr == null),
            // but playhead hasn't moved and buffer is exhausted for > STALL_THRESHOLD_MS
            val shouldBeAdvancing = player.playWhenReady &&
                state != Player.STATE_ENDED &&
                state != Player.STATE_IDLE &&
                terminalErrorAr == null &&
                currentSource != null

            if (shouldBeAdvancing) {
                if (pos == lastAdvancedPositionMs && (state == Player.STATE_BUFFERING || !player.isPlaying)) {
                    stallAccumulatedMs += 250L
                    if (stallAccumulatedMs >= STALL_THRESHOLD_MS) {
                        stallAccumulatedMs = 0L
                        handleSourceFailureOrStall("توقف البث لفترة طويلة دون استجابة")
                    }
                } else {
                    lastAdvancedPositionMs = pos
                    stallAccumulatedMs = 0L
                }
            } else {
                stallAccumulatedMs = 0L
            }
        }
    }

    // Auto-hide HUD after inactivity when playing
    LaunchedEffect(hudVisible, hudInteractionTick, isPlaying, showSubtitleSettingsModal, showSpeedMenu, isEnded) {
        if (hudVisible && isPlaying && !showSubtitleSettingsModal && !showSpeedMenu && !isEnded && terminalErrorAr == null) {
            delay(HUD_AUTO_HIDE_MS)
            hudVisible = false
        }
    }

    // Auto-hide unlock pill when controls are locked
    LaunchedEffect(controlsLocked, unlockPillVisible) {
        if (controlsLocked && unlockPillVisible) {
            delay(3_200L)
            unlockPillVisible = false
        }
    }

    // Auto-clear gesture HUD toast
    LaunchedEffect(gestureHudText) {
        if (gestureHudText != null) {
            delay(1_150L)
            gestureHudText = null
            gestureHudProgress = null
        }
    }

    // Auto-hide transient Brightness / Volume pill ~1.1s after vertical touch swipe stops
    LaunchedEffect(transientLevelKind, transientLevelTick) {
        if (transientLevelKind != null) {
            delay(1_100L)
            transientLevelKind = null
        }
    }

    // Storage permission launcher for API < 29 screenshot saving
    val storagePermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission(),
    ) { granted ->
        if (granted) {
            gestureHudText = "تم منح الإذن — اضغط زر لقطة الشاشة مرة أخرى للحفظ"
        } else {
            gestureHudText = "تعذر حفظ لقطة الشاشة لعدم منح إذن الصور"
        }
    }

    // Active subtitle text synchronized with currentPositionMs and timingOffsetMs
    val activeSubtitleText: String? = remember(
        parsedSubtitleCues,
        currentPositionMs,
        subtitleStyle.enabled,
        subtitleStyle.timingOffsetMs,
    ) {
        if (!subtitleStyle.enabled) {
            null
        } else {
            RiftSubtitleEngine.findActiveSubtitleText(
                cues = parsedSubtitleCues,
                positionMs = currentPositionMs,
                timingOffsetMs = subtitleStyle.timingOffsetMs,
            )
        }
    }

    // Effective skip intro / outro intervals (source overrides or PlayerServices fallback)
    val effectiveIntro = currentSource?.skipIntro ?: resolvedSkipTimes.intro
    val effectiveOutro = currentSource?.skipOutro ?: resolvedSkipTimes.outro
    val currentPosSeconds = currentPositionMs / 1000.0
    val activeIntro = effectiveIntro?.takeIf { it.contains(currentPosSeconds) }
    val activeOutro = effectiveOutro?.takeIf { it.contains(currentPosSeconds) }

    fun bumpHud() {
        hudVisible = true
        hudInteractionTick += 1
    }

    fun seekByDeltaMs(deltaMs: Long) {
        val maxDur = if (durationMs > 0L) durationMs else Long.MAX_VALUE
        val target = (player.currentPosition + deltaMs).coerceIn(0L, maxDur)
        player.seekTo(target)
        currentPositionMs = target
        bumpHud()
        gestureHudText = if (deltaMs >= 0L) "+${deltaMs / 1000} ثوانٍ" else "${deltaMs / 1000} ثوانٍ"
    }

    fun handleExitPlayer() {
        val exitState = PlayerExitState(
            finalPositionMs = currentPositionMs,
            durationMs = durationMs,
            isPlaying = isPlaying,
            completed = isEnded,
            playbackSpeed = playbackSpeed,
        )
        orientationController.restoreExitOrientation()
        onClose(exitState)
    }

    fun triggerScreenshotCapture() {
        bumpHud()
        val src = currentSource ?: return
        if (!RiftScreenshotCapture.hasGalleryPermission(context) &&
            Build.VERSION.SDK_INT < Build.VERSION_CODES.Q
        ) {
            storagePermissionLauncher.launch(Manifest.permission.WRITE_EXTERNAL_STORAGE)
            return
        }
        scope.launch {
            val headers = RiftMediaSourceFactory.buildRequestHeaders(
                source = src,
                defaultHeaders = playerServices.defaultMediaHeaders(),
            )
            val res = RiftScreenshotCapture.captureAndSaveToGallery(
                context = context,
                playerView = playerViewRef,
                currentSource = src,
                requestHeaders = headers,
                positionMs = currentPositionMs,
                isFlipped180 = isFlipped180,
                activeSubtitleText = activeSubtitleText,
                subtitleStyle = subtitleStyle,
                episodeLabel = "${metadata.title}_ep${metadata.episodeNumber ?: 1}",
            )
            gestureHudText = when (res) {
                is ScreenshotSaveResult.Success -> res.messageAr
                is ScreenshotSaveResult.PermissionRequired -> res.messageAr
                is ScreenshotSaveResult.Failure -> res.messageAr
            }
        }
    }

    BackHandler(enabled = showSubtitleSettingsModal || showSpeedMenu || controlsLocked || isFullscreen) {
        when {
            showSubtitleSettingsModal -> showSubtitleSettingsModal = false
            showSpeedMenu -> showSpeedMenu = false
            controlsLocked -> {
                controlsLocked = false
                hudVisible = true
                gestureHudText = "🔓 تم إلغاء قفل التحكم"
            }
            isFullscreen && onToggleFullscreen != null -> onToggleFullscreen()
            else -> handleExitPlayer()
        }
    }

    val isLandscapeLayout = isTv || isFullscreen || orientationController.isLandscape

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .then(
                if (isFullscreen) Modifier.fillMaxSize()
                else Modifier.height(if (isTv) 520.dp else 310.dp),
            )
            .background(Color.Black)
            .onPreviewKeyEvent { event ->
                if (event.type != KeyEventType.KeyDown) return@onPreviewKeyEvent false
                if (controlsLocked) {
                    unlockPillVisible = true
                    return@onPreviewKeyEvent true
                }
                when (event.key) {
                    Key.DirectionCenter, Key.Enter -> {
                        if (!hudVisible) {
                            bumpHud()
                            true
                        } else {
                            false
                        }
                    }
                    Key.MediaPlayPause -> {
                        if (player.isPlaying) player.pause() else player.play()
                        bumpHud()
                        true
                    }
                    Key.DirectionLeft -> {
                        if (!hudVisible) {
                            seekByDeltaMs(-10_000L)
                            true
                        } else {
                            bumpHud()
                            false
                        }
                    }
                    Key.DirectionRight -> {
                        if (!hudVisible) {
                            seekByDeltaMs(10_000L)
                            true
                        } else {
                            bumpHud()
                            false
                        }
                    }
                    Key.DirectionUp, Key.DirectionDown -> {
                        if (!hudVisible) {
                            bumpHud()
                            true
                        } else {
                            bumpHud()
                            false
                        }
                    }
                    Key.Back, Key.Escape -> {
                        when {
                            showSubtitleSettingsModal -> {
                                showSubtitleSettingsModal = false
                                true
                            }
                            showSpeedMenu -> {
                                showSpeedMenu = false
                                true
                            }
                            hudVisible && isTv -> {
                                hudVisible = false
                                true
                            }
                            else -> false
                        }
                    }
                    else -> false
                }
            }
            .pointerInput(isTv, controlsLocked) {
                detectTapGestures(
                    onTap = {
                        if (controlsLocked) {
                            unlockPillVisible = !unlockPillVisible
                        } else if (showSubtitleSettingsModal || showSpeedMenu) {
                            showSubtitleSettingsModal = false
                            showSpeedMenu = false
                        } else {
                            hudVisible = !hudVisible
                            if (hudVisible) hudInteractionTick += 1
                        }
                    },
                    onDoubleTap = { offset ->
                        if (isTv || controlsLocked) return@detectTapGestures
                        val isLeftHalf = offset.x < size.width / 2f
                        seekByDeltaMs(if (isLeftHalf) -10_000L else 10_000L)
                    },
                    onLongPress = {
                        if (isTv || controlsLocked) return@detectTapGestures
                        preBoostSpeed = playbackSpeed
                        isLongPressBoosting = true
                        player.playbackParameters = PlaybackParameters(2.0f, 1.0f)
                        gestureHudText = "⚡ سرعة 2.0x (ضغط مطوّل)"
                    },
                    onPress = {
                        tryAwaitRelease()
                        if (isLongPressBoosting) {
                            isLongPressBoosting = false
                            player.playbackParameters = PlaybackParameters(preBoostSpeed, 1.0f)
                            gestureHudText = "⚡ السرعة ${preBoostSpeed}x"
                        }
                    },
                )
            }
            .pointerInput(isTv, controlsLocked) {
                if (isTv || controlsLocked) return@pointerInput
                // Vertical drag gesture:
                // - Left half of screen = Brightness (السطوع)
                // - Right half of screen = Volume (الصوت)
                // Swipe UP (negative dragAmount) increases level; swipe DOWN decreases level.
                detectVerticalDragGestures { change, dragAmount ->
                    change.consume()
                    val isLeftSide = change.position.x < size.width / 2f
                    if (isLeftSide && activity != null) {
                        val lp = activity.window.attributes
                        val currentBrightness = if (lp.screenBrightness < 0f) 0.55f else lp.screenBrightness
                        val nextBrightness = (currentBrightness - dragAmount / 520f).coerceIn(0.05f, 1.0f)
                        lp.screenBrightness = nextBrightness
                        activity.window.attributes = lp
                        val pct = (nextBrightness * 100).roundToInt().coerceIn(5, 100)
                        transientLevelKind = "brightness"
                        transientLevelPercent = pct
                        transientLevelTick += 1
                    } else if (audioManager != null) {
                        val maxVol = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC).coerceAtLeast(1)
                        val curVol = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC)
                        val delta = if (dragAmount < 0) 1 else -1
                        val nextVol = (curVol + delta).coerceIn(0, maxVol)
                        audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, nextVol, 0)
                        isMuted = nextVol == 0
                        val pct = ((nextVol.toFloat() / maxVol.toFloat()) * 100).roundToInt().coerceIn(0, 100)
                        transientLevelKind = "volume"
                        transientLevelPercent = pct
                        transientLevelTick += 1
                    }
                }
            },
    ) {
        // 1. Native Media3 ExoPlayer Surface (with useController = false and 180-degree flip support)
        AndroidView(
            factory = { ctx ->
                PlayerView(ctx).apply {
                    this.player = player
                    useController = false
                    keepScreenOn = true
                    resizeMode = fitMode.toMedia3ResizeMode()
                    subtitleView?.visibility = android.view.View.GONE
                    playerViewRef = this
                }
            },
            modifier = Modifier
                .fillMaxSize()
                .graphicsLayer {
                    rotationZ = if (isFlipped180) 180f else 0f
                },
            update = { view ->
                view.player = player
                view.useController = false
                view.resizeMode = fitMode.toMedia3ResizeMode()
                playerViewRef = view
            },
        )

        // 2. Custom Synchronized VTT/SRT Subtitle Overlay
        if (subtitleStyle.enabled && !activeSubtitleText.isNullOrBlank()) {
            val baseAlignment = when (subtitleStyle.verticalPosition) {
                SubtitleVerticalPosition.TOP -> Alignment.TopCenter
                SubtitleVerticalPosition.CENTER -> Alignment.Center
                SubtitleVerticalPosition.BOTTOM -> Alignment.BottomCenter
            }
            val basePadding = when (subtitleStyle.verticalPosition) {
                SubtitleVerticalPosition.TOP -> PaddingValues(top = 48.dp, start = 24.dp, end = 24.dp)
                SubtitleVerticalPosition.CENTER -> PaddingValues(horizontal = 24.dp)
                SubtitleVerticalPosition.BOTTOM -> PaddingValues(bottom = if (hudVisible) 108.dp else 28.dp, start = 24.dp, end = 24.dp)
            }

            Box(
                modifier = Modifier
                    .align(baseAlignment)
                    .padding(basePadding)
                    .offset { IntOffset(0, subtitleStyle.verticalOffsetDp.dp.roundToPx()) }
                    .clip(RoundedCornerShape(10.dp))
                    .background(
                        Color(0xFF07070C).copy(alpha = subtitleStyle.backgroundAlpha.coerceIn(0f, 1f)),
                    )
                    .padding(horizontal = 14.dp, vertical = 6.dp),
            ) {
                Text(
                    text = activeSubtitleText,
                    color = subtitleStyle.colorOption.composeColor,
                    fontSize = subtitleStyle.fontSizeSp.sp,
                    fontWeight = subtitleStyle.fontWeightOption.composeWeight,
                    textAlign = TextAlign.Center,
                    style = TextStyle(
                        shadow = Shadow(
                            color = Color.Black,
                            offset = Offset(0f, 2f),
                            blurRadius = 6f,
                        ),
                    ),
                )
            }
        }

        // 3. Buffering Spinner & Source Failover Status Notice
        if ((isBuffering || sourceStatusNotice != null) && terminalErrorAr == null && !isEnded) {
            Column(
                modifier = Modifier
                    .align(Alignment.Center)
                    .clip(RoundedCornerShape(18.dp))
                    .background(Color(0xB3090812))
                    .padding(horizontal = 20.dp, vertical = 14.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                CircularProgressIndicator(
                    color = Color(0xFFFF1717),
                    strokeWidth = 3.dp,
                    modifier = Modifier.size(36.dp),
                )
                Text(
                    text = sourceStatusNotice ?: "جارٍ التحميل والتخزين المؤقت...",
                    color = Color.White,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center,
                )
            }
        }

        // 4. Transient Brightness / Volume Pill on Middle-Left (Strictly temporary — disappears automatically)
        transientLevelKind?.let { kind ->
            Surface(
                color = Color(0xD616161A),
                shape = RoundedCornerShape(999.dp),
                border = BorderStroke(1.dp, Color(0x14FFFFFF)),
                modifier = Modifier
                    .align(Alignment.CenterStart)
                    .padding(start = if (isLandscapeLayout) 40.dp else 18.dp),
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 22.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    Text(
                        text = if (kind == "brightness") "☀" else "🔊",
                        color = Color.White,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        text = "${transientLevelPercent}%",
                        color = Color.White,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                    )
                }
            }
        }

        // 4b. Other Action Feedback Toast (Seek / 2x Speed / Screenshot / Aspect)
        gestureHudText?.let { feedback ->
            Surface(
                color = Color(0xD9101014),
                shape = RoundedCornerShape(999.dp),
                border = BorderStroke(1.dp, Color(0x26FFFFFF)),
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .padding(top = 18.dp),
            ) {
                Text(
                    text = feedback,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 7.dp),
                )
            }
        }

        // 5. Floating Skip Intro / Skip Outro Manual Button
        val activeSkipInterval = activeIntro ?: activeOutro
        if (activeSkipInterval != null && !controlsLocked && !isEnded && terminalErrorAr == null) {
            Button(
                onClick = {
                    val targetMs = (activeSkipInterval.endSeconds * 1000.0).toLong()
                    player.seekTo(targetMs)
                    currentPositionMs = targetMs
                    gestureHudText = if (activeIntro != null) "تم تخطي المقدمة ⏭" else "تم تخطي الخاتمة ⏭"
                },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xEB141418)),
                shape = RoundedCornerShape(999.dp),
                border = BorderStroke(1.5.dp, Color(0x99F59E0B)),
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(end = 20.dp, bottom = if (hudVisible) 138.dp else 48.dp),
            ) {
                Text(
                    text = if (activeIntro != null) "تخطي المقدمة ⏭" else "تخطي الخاتمة ⏭",
                    color = Color(0xFFFBBF24),
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 13.sp,
                )
            }
        }

        // 6. Touch Lock Unlock Button (Clear & prominent when screen is locked)
        if (controlsLocked && unlockPillVisible) {
            Button(
                onClick = {
                    controlsLocked = false
                    hudVisible = true
                    gestureHudText = "🔓 تم إلغاء قفل اللمس"
                },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xEB121216)),
                shape = RoundedCornerShape(999.dp),
                border = BorderStroke(1.dp, Color(0x40FFFFFF)),
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .padding(top = 24.dp),
            ) {
                Text(
                    text = "🔒 الشاشة مقفلة — اضغط لإلغاء القفل",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                )
            }
        }

        // 7. Full Custom HUD Overlay Matching the Reference Portrait & Landscape Screenshots
        val formattedSubtitleLine = remember(
            metadata.episodeNumber,
            currentSource?.quality,
            metadata.quality,
        ) {
            val epPart = "الحلقة ${metadata.episodeNumber ?: 1}"
            val qualPart = (currentSource?.quality ?: metadata.quality ?: "1080P").uppercase()
            "$epPart • العربية • مترجم • $qualPart"
        }

        AnimatedVisibility(
            visible = hudVisible && !controlsLocked && !isEnded && terminalErrorAr == null,
            enter = fadeIn(),
            exit = fadeOut(),
            modifier = Modifier.fillMaxSize(),
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(
                                Color(0xD9000000),
                                Color(0x26000000),
                                Color(0x26000000),
                                Color(0xE6000000),
                            ),
                        ),
                    ),
            ) {
                // TOP HEADER (Landscape vs. Portrait layout matching the reference screenshots)
                if (isLandscapeLayout) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .align(Alignment.TopCenter)
                            .padding(horizontal = 24.dp, vertical = 18.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Top,
                    ) {
                        // Left: Title + Episode/Lang/Sub/Quality line
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = metadata.title,
                                color = Color.White,
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = if (isTv) 22.sp else 20.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                            Spacer(Modifier.height(4.dp))
                            Text(
                                text = formattedSubtitleLine,
                                color = Color(0xFFEBEBF0),
                                fontWeight = FontWeight.Medium,
                                fontSize = 14.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                        }

                        // Right: 5 Circular Dark Icon Buttons [Camera, PiP/Flip, Aspect, Rotate, Close]
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            RiftDarkCircleIconButton(
                                iconText = "📷",
                                onClick = { triggerScreenshotCapture() },
                            )
                            RiftDarkCircleIconButton(
                                iconText = "⧉",
                                active = isFlipped180,
                                onClick = {
                                    isFlipped180 = !isFlipped180
                                    bumpHud()
                                    gestureHudText = if (isFlipped180) "تم قلب الصورة 180°" else "الوضع الطبيعي للصورة"
                                },
                            )
                            RiftDarkCircleIconButton(
                                iconText = "⛶",
                                active = fitMode != AspectRatioFitMode.FIT,
                                onClick = {
                                    val modes = AspectRatioFitMode.entries
                                    fitMode = modes[(modes.indexOf(fitMode) + 1) % modes.size]
                                    bumpHud()
                                    gestureHudText = "الأبعاد: ${fitMode.labelAr}"
                                },
                            )
                            if (!isTv) {
                                RiftDarkCircleIconButton(
                                    iconText = "🔄",
                                    onClick = {
                                        val nowLandscape = orientationController.toggleOrientation()
                                        bumpHud()
                                        gestureHudText = if (nowLandscape) "الوضع الأفقي" else "الوضع العمودي"
                                    },
                                )
                            }
                            RiftDarkCircleIconButton(
                                iconText = "✕",
                                onClick = { handleExitPlayer() },
                            )
                        }
                    }
                } else {
                    // Portrait Header: Top row has 4 right-aligned circular buttons; second row has Title + Subtitle on left
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .align(Alignment.TopCenter)
                            .padding(horizontal = 20.dp, vertical = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp),
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.End,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                RiftDarkCircleIconButton(
                                    iconText = "📷",
                                    onClick = { triggerScreenshotCapture() },
                                )
                                RiftDarkCircleIconButton(
                                    iconText = "⧉",
                                    active = isFlipped180,
                                    onClick = {
                                        isFlipped180 = !isFlipped180
                                        bumpHud()
                                        gestureHudText = if (isFlipped180) "تم قلب الصورة 180°" else "الوضع الطبيعي للصورة"
                                    },
                                )
                                RiftDarkCircleIconButton(
                                    iconText = "🔄",
                                    onClick = {
                                        val nowLandscape = orientationController.toggleOrientation()
                                        bumpHud()
                                        gestureHudText = if (nowLandscape) "الوضع الأفقي" else "الوضع العمودي"
                                    },
                                )
                                RiftDarkCircleIconButton(
                                    iconText = "✕",
                                    onClick = { handleExitPlayer() },
                                )
                            }
                        }
                        Column(modifier = Modifier.fillMaxWidth()) {
                            Text(
                                text = metadata.title,
                                color = Color.White,
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 21.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                            Spacer(Modifier.height(4.dp))
                            Text(
                                text = formattedSubtitleLine,
                                color = Color(0xFFEBEBF0),
                                fontWeight = FontWeight.Medium,
                                fontSize = 14.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                        }
                    }
                }

                // PORTRAIT CENTER SEEK BUTTONS (↺ 5 and ↻ 5 float in the center of the video in Portrait mode)
                if (!isLandscapeLayout) {
                    Row(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalArrangement = Arrangement.spacedBy(76.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        RiftSeek5CircleButton(
                            isForward = false,
                            onClick = { seekByDeltaMs(-5_000L) },
                        )
                        RiftSeek5CircleButton(
                            isForward = true,
                            onClick = { seekByDeltaMs(5_000L) },
                        )
                    }
                }

                // BOTTOM TIMELINE + CONTROL BAR
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .align(Alignment.BottomCenter)
                        .padding(
                            horizontal = if (isLandscapeLayout) 28.dp else 20.dp,
                            vertical = if (isLandscapeLayout) 16.dp else 22.dp,
                        ),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    val displayPosMs = if (isScrubbing) scrubPositionMs else currentPositionMs

                    // Timestamps row ABOVE the seekbar (Current time on left, Total duration on right)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            text = formatDurationMs(displayPosMs),
                            color = Color.White,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.SemiBold,
                        )
                        Text(
                            text = formatDurationMs(durationMs),
                            color = Color.White,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.SemiBold,
                        )
                    }

                    // Interactive LTR Red Seekbar with Yellow (#F59E0B) Intro & Outro Skip Segments
                    RiftTimelineSeekBar(
                        positionMs = displayPosMs,
                        durationMs = durationMs,
                        bufferedPositionMs = bufferedPositionMs,
                        introInterval = effectiveIntro,
                        outroInterval = effectiveOutro,
                        isTv = isTv,
                        modifier = Modifier.fillMaxWidth(),
                        onScrubStart = { pos ->
                            isScrubbing = true
                            scrubPositionMs = pos
                            bumpHud()
                        },
                        onScrubChange = { pos ->
                            scrubPositionMs = pos
                            bumpHud()
                        },
                        onScrubConfirm = { pos ->
                            isScrubbing = false
                            player.seekTo(pos)
                            currentPositionMs = pos
                            bumpHud()
                        },
                    )

                    // Bottom Control Bar:
                    // Left: [ ⏩ FastForward / Skip ] + [ Speedometer ]
                    // Center: [ ↺ 5 ] (landscape) + [ ( || / ▶ ) white-ringed circle ] + [ ↻ 5 ] (landscape)
                    // Right: [ CC ] + [ 🔓 Lock ]
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 4.dp),
                    ) {
                        // Left Controls
                        Row(
                            modifier = Modifier.align(Alignment.CenterStart),
                            horizontalArrangement = Arrangement.spacedBy(18.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            RiftPlainIconButton(
                                label = "⏩",
                                onClick = {
                                    val skipTarget = activeIntro ?: activeOutro
                                    if (skipTarget != null) {
                                        val targetMs = (skipTarget.endSeconds * 1000.0).toLong()
                                        player.seekTo(targetMs)
                                        currentPositionMs = targetMs
                                    } else {
                                        seekByDeltaMs(10_000L)
                                    }
                                },
                            )
                            RiftPlainIconButton(
                                label = if (playbackSpeed != 1.0f) "${playbackSpeed}x" else "⏱",
                                active = playbackSpeed != 1.0f || showSpeedMenu,
                                onClick = {
                                    showSpeedMenu = !showSpeedMenu
                                    showSubtitleSettingsModal = false
                                    bumpHud()
                                },
                            )
                        }

                        // Center Controls
                        Row(
                            modifier = Modifier.align(Alignment.Center),
                            horizontalArrangement = Arrangement.spacedBy(34.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            if (isLandscapeLayout) {
                                RiftSeek5CircleButton(
                                    isForward = false,
                                    onClick = { seekByDeltaMs(-5_000L) },
                                )
                            }
                            // White-ringed Play / Pause Circle Button
                            Box(
                                modifier = Modifier
                                    .size(if (isTv) 68.dp else 60.dp)
                                    .clip(CircleShape)
                                    .background(Color(0x730E0E12))
                                    .border(2.5.dp, Color.White, CircleShape)
                                    .clickable {
                                        if (player.isPlaying) player.pause() else player.play()
                                        bumpHud()
                                    },
                                contentAlignment = Alignment.Center,
                            ) {
                                Text(
                                    text = if (isPlaying) "⏸" else "▶",
                                    color = Color.White,
                                    fontSize = 22.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                )
                            }
                            if (isLandscapeLayout) {
                                RiftSeek5CircleButton(
                                    isForward = true,
                                    onClick = { seekByDeltaMs(5_000L) },
                                )
                            }
                        }

                        // Right Controls
                        Row(
                            modifier = Modifier.align(Alignment.CenterEnd),
                            horizontalArrangement = Arrangement.spacedBy(18.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(5.dp))
                                    .background(
                                        if (subtitleStyle.enabled) Color.White else Color(0x88FFFFFF),
                                    )
                                    .clickable {
                                        showSubtitleSettingsModal = true
                                        showSpeedMenu = false
                                        bumpHud()
                                    }
                                    .padding(horizontal = 7.dp, vertical = 3.dp),
                                contentAlignment = Alignment.Center,
                            ) {
                                Text(
                                    text = "CC",
                                    color = Color.Black,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                )
                            }
                            RiftPlainIconButton(
                                label = "🔓",
                                onClick = {
                                    controlsLocked = true
                                    unlockPillVisible = true
                                    hudVisible = false
                                },
                            )
                        }
                    }
                }
            }
        }

        // 8. Playback Speed Selector Popover (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x with natural audio pitch)
        if (showSpeedMenu && !controlsLocked) {
            Surface(
                color = Color(0xF2120E1E),
                shape = RoundedCornerShape(18.dp),
                border = BorderStroke(1.dp, Color(0x66A855F7)),
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(start = 16.dp, bottom = 58.dp),
            ) {
                Column(
                    modifier = Modifier.padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    Text(
                        text = "سرعة التشغيل (مع الحفاظ على طبقة الصوت)",
                        color = Color(0xFFD8B4FE),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        RiftPlayerSessionState.SUPPORTED_SPEEDS.forEach { spd ->
                            RiftGlassButton(
                                label = "${spd}x",
                                active = playbackSpeed == spd,
                                onClick = {
                                    playbackSpeed = spd
                                    preBoostSpeed = spd
                                    RiftPlayerSessionState.rememberedPlaybackSpeed = spd
                                    showSpeedMenu = false
                                    gestureHudText = "⚡ سرعة التشغيل ${spd}x"
                                },
                            )
                        }
                    }
                }
            }
        }

        // 9. Subtitle Settings Modal (On/Off, Language, 5 Sizes, 5 Colors, Top/Center/Bottom, Vertical Offset, Background, Bold/Extra-Bold, ±0.5s Timing Offset)
        if (showSubtitleSettingsModal && !controlsLocked) {
            RiftSubtitleSettingsDialog(
                availableTracks = availableSubtitles,
                selectedTrack = selectedSubtitleTrack,
                subtitleLoading = subtitleLoading,
                style = subtitleStyle,
                isServiceConfigured = playerServices.isConfigured,
                onSelectTrack = { track ->
                    selectedSubtitleTrack = track
                    if (track != null) {
                        subtitleStyle = subtitleStyle.copy(
                            enabled = true,
                            preferredLanguage = track.language,
                        )
                    }
                },
                onUpdateStyle = { subtitleStyle = it },
                onClose = { showSubtitleSettingsModal = false },
            )
        }

        // 10. End-of-Episode Overlay Card (Manual Replay, Back, and Manual Next Episode — NO auto-advance countdown)
        if (isEnded && terminalErrorAr == null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color(0xD905040A)),
                contentAlignment = Alignment.Center,
            ) {
                Surface(
                    color = Color(0xF2130F24),
                    shape = RoundedCornerShape(22.dp),
                    border = BorderStroke(1.dp, Color(0x66A855F7)),
                    modifier = Modifier
                        .padding(24.dp)
                        .width(if (isTv) 460.dp else 360.dp),
                ) {
                    Column(
                        modifier = Modifier.padding(22.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        Text(
                            text = "انتهت الحلقة ${metadata.episodeNumber ?: ""}".trim(),
                            color = Color.White,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.ExtraBold,
                        )
                        Text(
                            text = metadata.title,
                            color = Color(0xFFD8B4FE),
                            fontSize = 13.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            OutlinedButton(
                                onClick = {
                                    isEnded = false
                                    player.seekTo(0L)
                                    player.playWhenReady = true
                                    player.play()
                                },
                            ) {
                                Text("↺ إعادة التشغيل")
                            }
                            if (hasNextEpisode) {
                                Button(
                                    onClick = {
                                        isEnded = false
                                        onNextEpisode()
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7C3AED)),
                                ) {
                                    Text("الحلقة التالية ⏭", color = Color.White, fontWeight = FontWeight.Bold)
                                }
                            }
                            OutlinedButton(
                                onClick = { handleExitPlayer() },
                            ) {
                                Text("الرجوع")
                            }
                        }
                    }
                }
            }
        }

        // 11. Terminal Error Overlay Card (when single source or all sources fail after refresh & failover)
        terminalErrorAr?.let { errMessage ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color(0xE606050B)),
                contentAlignment = Alignment.Center,
            ) {
                Surface(
                    color = Color(0xF2181124),
                    shape = RoundedCornerShape(20.dp),
                    border = BorderStroke(1.dp, Color(0x66EF4444)),
                    modifier = Modifier
                        .padding(20.dp)
                        .width(if (isTv) 480.dp else 360.dp),
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        Text(
                            text = "تعذر تشغيل الفيديو",
                            color = Color(0xFFF87171),
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 17.sp,
                        )
                        Text(
                            text = errMessage,
                            color = Color(0xFFE4E4E7),
                            fontSize = 13.sp,
                            textAlign = TextAlign.Center,
                        )
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Button(
                                onClick = {
                                    refreshedSourceKeys = emptySet()
                                    failedSourceKeys = emptySet()
                                    terminalErrorAr = null
                                    activeIndex = 0
                                    val first = sources.firstOrNull()
                                    if (first != null) {
                                        val validation = RiftMediaSourceFactory.validateSourceUrl(first.url, first.type)
                                        if (validation is MediaUriValidationResult.Valid) {
                                            val headers = RiftMediaSourceFactory.buildRequestHeaders(
                                                source = first,
                                                defaultHeaders = playerServices.defaultMediaHeaders(),
                                            )
                                            val mediaSource = RiftMediaSourceFactory.createMediaSource(context, validation, headers)
                                            player.stop()
                                            player.setMediaSource(mediaSource)
                                            if (currentPositionMs > 0L) player.seekTo(currentPositionMs)
                                            player.prepare()
                                            player.playWhenReady = true
                                        }
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7C3AED)),
                            ) {
                                Text("إعادة المحاولة", color = Color.White, fontWeight = FontWeight.Bold)
                            }
                            OutlinedButton(
                                onClick = { handleExitPlayer() },
                            ) {
                                Text("الرجوع")
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun RiftTimelineSeekBar(
    positionMs: Long,
    durationMs: Long,
    bufferedPositionMs: Long,
    introInterval: com.nova.anime.nova2.core.playback.SkipInterval?,
    outroInterval: com.nova.anime.nova2.core.playback.SkipInterval?,
    isTv: Boolean,
    modifier: Modifier = Modifier,
    onScrubStart: (Long) -> Unit,
    onScrubChange: (Long) -> Unit,
    onScrubConfirm: (Long) -> Unit,
) {
    var focused by remember { mutableStateOf(false) }
    val safeDuration = durationMs.coerceAtLeast(1L)
    val progressFraction = (positionMs.toFloat() / safeDuration.toFloat()).coerceIn(0f, 1f)
    val bufferedFraction = (bufferedPositionMs.toFloat() / safeDuration.toFloat()).coerceIn(0f, 1f)

    Box(
        modifier = modifier
            .height(28.dp)
            .onFocusChanged { focused = it.isFocused }
            .focusable()
            .onPreviewKeyEvent { event ->
                if (!focused || event.type != KeyEventType.KeyDown) return@onPreviewKeyEvent false
                when (event.key) {
                    Key.DirectionLeft -> {
                        val next = (positionMs - 10_000L).coerceIn(0L, safeDuration)
                        onScrubConfirm(next)
                        true
                    }
                    Key.DirectionRight -> {
                        val next = (positionMs + 10_000L).coerceIn(0L, safeDuration)
                        onScrubConfirm(next)
                        true
                    }
                    else -> false
                }
            }
            .pointerInput(safeDuration) {
                detectTapGestures { offset ->
                    val fraction = (offset.x / size.width.toFloat()).coerceIn(0f, 1f)
                    val target = (fraction * safeDuration).toLong()
                    onScrubConfirm(target)
                }
            }
            .pointerInput(safeDuration) {
                detectHorizontalDragGestures(
                    onDragStart = { offset ->
                        val fraction = (offset.x / size.width.toFloat()).coerceIn(0f, 1f)
                        onScrubStart((fraction * safeDuration).toLong())
                    },
                    onHorizontalDrag = { change, _ ->
                        change.consume()
                        val fraction = (change.position.x / size.width.toFloat()).coerceIn(0f, 1f)
                        onScrubChange((fraction * safeDuration).toLong())
                    },
                    onDragEnd = {
                        onScrubConfirm(positionMs)
                    },
                )
            },
        contentAlignment = Alignment.Center,
    ) {
        Canvas(modifier = Modifier.fillMaxWidth().height(if (focused || isTv) 9.dp else 7.dp)) {
            val trackHeight = size.height
            val corner = CornerRadius(trackHeight / 2f, trackHeight / 2f)

            // Base unplayed grey track
            drawRoundRect(
                color = Color(0x52FFFFFF),
                size = Size(size.width, trackHeight),
                cornerRadius = corner,
            )

            // Buffered progress (LTR)
            val bufferedWidth = size.width * bufferedFraction
            drawRoundRect(
                color = Color(0x66FFFFFF),
                topLeft = Offset(0f, 0f),
                size = Size(bufferedWidth, trackHeight),
                cornerRadius = corner,
            )

            // Active playback progress (Eye-friendly Emerald -> Cyan -> Sky gradient)
            val activeWidth = size.width * progressFraction
            drawRoundRect(
                brush = Brush.horizontalGradient(
                    colors = listOf(Color(0xFF10B981), Color(0xFF06B6D4), Color(0xFF38BDF8)),
                ),
                topLeft = Offset(0f, 0f),
                size = Size(activeWidth, trackHeight),
                cornerRadius = corner,
            )

            // Yellow (#F59E0B) Intro & Outro Skip Segments on the Seekbar
            val durationSec = safeDuration / 1000.0
            if (durationSec > 0.0) {
                introInterval?.let { intro ->
                    val startFrac = (intro.startSeconds / durationSec).toFloat().coerceIn(0f, 1f)
                    val endFrac = (intro.endSeconds / durationSec).toFloat().coerceIn(0f, 1f)
                    val segWidth = ((endFrac - startFrac) * size.width).coerceAtLeast(6f)
                    drawRoundRect(
                        color = Color(0xFFF59E0B),
                        topLeft = Offset(size.width * startFrac, 0f),
                        size = Size(segWidth, trackHeight),
                        cornerRadius = corner,
                    )
                }
                outroInterval?.let { outro ->
                    val startFrac = (outro.startSeconds / durationSec).toFloat().coerceIn(0f, 1f)
                    val endFrac = (outro.endSeconds / durationSec).toFloat().coerceIn(0f, 1f)
                    val segWidth = ((endFrac - startFrac) * size.width).coerceAtLeast(6f)
                    drawRoundRect(
                        color = Color(0xFFF59E0B),
                        topLeft = Offset(size.width * startFrac, 0f),
                        size = Size(segWidth, trackHeight),
                        cornerRadius = corner,
                    )
                }
            }

            // Sleek White-Ringed Emerald Thumb Indicator
            val thumbX = (size.width * progressFraction).coerceIn(0f, size.width)
            val outerRadius = if (focused || isTv) 10.5.dp.toPx() else 9.dp.toPx()
            val innerRadius = if (focused || isTv) 7.5.dp.toPx() else 6.5.dp.toPx()
            drawCircle(
                color = Color.White,
                radius = outerRadius,
                center = Offset(thumbX, trackHeight / 2f),
            )
            drawCircle(
                color = Color(0xFF10B981),
                radius = innerRadius,
                center = Offset(thumbX, trackHeight / 2f),
            )
        }
    }
}

@Composable
private fun RiftSubtitleSettingsDialog(
    availableTracks: List<SubtitleTrack>,
    selectedTrack: SubtitleTrack?,
    subtitleLoading: Boolean,
    style: SubtitleStyleSettings,
    isServiceConfigured: Boolean,
    onSelectTrack: (SubtitleTrack?) -> Unit,
    onUpdateStyle: (SubtitleStyleSettings) -> Unit,
    onClose: () -> Unit,
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xCC05040A))
            .clickable(onClick = onClose),
        contentAlignment = Alignment.Center,
    ) {
        Surface(
            color = Color(0xF5120E20),
            shape = RoundedCornerShape(20.dp),
            border = BorderStroke(1.dp, Color(0x66A855F7)),
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(0.92f)
                .clickable(enabled = false) {},
        ) {
            Column(
                modifier = Modifier
                    .padding(16.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = "إعدادات الترجمة والمزامنة",
                        color = Color.White,
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 15.sp,
                    )
                    RiftGlassButton(label = "إغلاق ✕", onClick = onClose)
                }

                if (!isServiceConfigured && availableTracks.isEmpty()) {
                    Text(
                        text = "ملاحظة: خدمة مسارات الترجمة الخارجية غير مهيأة؛ يتم عرض الترجمات المرفقة بالمصدر فقط عند توفرها.",
                        color = Color(0xFFFBBF24),
                        fontSize = 11.sp,
                    )
                }

                // 1. On / Off & Language tracks
                Text("حالة الترجمة واللغة", color = Color(0xFFD8B4FE), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    item {
                        FilterChip(
                            selected = !style.enabled || selectedTrack == null,
                            onClick = {
                                onUpdateStyle(style.copy(enabled = false))
                                onSelectTrack(null)
                            },
                            label = { Text("إيقاف الترجمة") },
                        )
                    }
                    items(availableTracks, key = { it.key }) { track ->
                        FilterChip(
                            selected = style.enabled && selectedTrack?.key == track.key,
                            onClick = {
                                onUpdateStyle(style.copy(enabled = true, preferredLanguage = track.language))
                                onSelectTrack(track)
                            },
                            label = { Text(track.label) },
                        )
                    }
                }
                if (subtitleLoading) {
                    Text("جارٍ تحميل ملف الترجمة (VTT/SRT)...", color = Color(0xFFA855F7), fontSize = 11.sp)
                }

                // 2. Font Size
                Text("حجم الخط", color = Color(0xFFD8B4FE), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(SubtitleStyleSettings.FONT_SIZE_PRESETS_SP) { (sizeSp, label) ->
                        FilterChip(
                            selected = style.fontSizeSp == sizeSp,
                            onClick = { onUpdateStyle(style.copy(fontSizeSp = sizeSp)) },
                            label = { Text("$label (${sizeSp}sp)") },
                        )
                    }
                }

                // 3. Text Colors
                Text("لون النص", color = Color(0xFFD8B4FE), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(SubtitleColorOption.entries) { colorOpt ->
                        FilterChip(
                            selected = style.colorOption == colorOpt,
                            onClick = { onUpdateStyle(style.copy(colorOption = colorOpt)) },
                            label = { Text(colorOpt.labelAr, color = colorOpt.composeColor) },
                        )
                    }
                }

                // 4. Vertical Position (Top / Center / Bottom) + Fine Vertical Offset
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("موضع الترجمة والتحريك الرأسي", color = Color(0xFFD8B4FE), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Text("الإزاحة: ${style.verticalOffsetDp}dp", color = Color.White, fontSize = 11.sp)
                }
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(SubtitleVerticalPosition.entries) { pos ->
                        FilterChip(
                            selected = style.verticalPosition == pos,
                            onClick = { onUpdateStyle(style.copy(verticalPosition = pos)) },
                            label = { Text(pos.labelAr) },
                        )
                    }
                    item {
                        RiftGlassButton(
                            label = "أعلى ▲",
                            onClick = { onUpdateStyle(style.withClampedVerticalOffset(style.verticalOffsetDp - 8)) },
                        )
                    }
                    item {
                        RiftGlassButton(
                            label = "أسفل ▼",
                            onClick = { onUpdateStyle(style.withClampedVerticalOffset(style.verticalOffsetDp + 8)) },
                        )
                    }
                    item {
                        RiftGlassButton(
                            label = "تصفير الموضع",
                            onClick = { onUpdateStyle(style.withClampedVerticalOffset(0)) },
                        )
                    }
                }

                // 5. Font Weight (Normal / Bold / Extra-Bold) & Background Opacity
                Text("سماكة الخط وخلفية النص", color = Color(0xFFD8B4FE), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(SubtitleFontWeightOption.entries) { weightOpt ->
                        FilterChip(
                            selected = style.fontWeightOption == weightOpt,
                            onClick = { onUpdateStyle(style.copy(fontWeightOption = weightOpt)) },
                            label = { Text(weightOpt.labelAr, fontWeight = weightOpt.composeWeight) },
                        )
                    }
                    items(SubtitleStyleSettings.BACKGROUND_ALPHA_PRESETS) { (alpha, label) ->
                        FilterChip(
                            selected = kotlin.math.abs(style.backgroundAlpha - alpha) < 0.05f,
                            onClick = { onUpdateStyle(style.copy(backgroundAlpha = alpha)) },
                            label = { Text("خلفية: $label") },
                        )
                    }
                }

                // 6. Timing Offset in 0.5s (±500ms) safe steps [-10s .. +10s]
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = "إزاحة التوقيت: ${"%.1f".format(style.timingOffsetMs / 1000f)} ثانية",
                        color = Color(0xFFD8B4FE),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        RiftGlassButton(
                            label = "-0.5s",
                            onClick = {
                                onUpdateStyle(style.withSteppedTimingOffset(-SubtitleStyleSettings.TIMING_STEP_MS))
                            },
                        )
                        RiftGlassButton(
                            label = "0.0s",
                            onClick = { onUpdateStyle(style.copy(timingOffsetMs = 0L)) },
                        )
                        RiftGlassButton(
                            label = "+0.5s",
                            onClick = {
                                onUpdateStyle(style.withSteppedTimingOffset(SubtitleStyleSettings.TIMING_STEP_MS))
                            },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun RiftGlassButton(
    label: String,
    active: Boolean = false,
    onClick: () -> Unit,
) {
    var focused by remember { mutableStateOf(false) }
    val bgColor = when {
        focused -> Color(0xFF7C3AED)
        active -> Color(0x996D28D9)
        else -> Color(0x99141220)
    }
    val borderColor = when {
        focused -> Color(0xFFFACC15)
        active -> Color(0xFFA855F7)
        else -> Color(0x33FFFFFF)
    }

    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .background(bgColor)
            .border(if (focused) 2.dp else 1.dp, borderColor, RoundedCornerShape(12.dp))
            .onFocusChanged { focused = it.isFocused }
            .focusable()
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp, vertical = 6.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = label,
            color = Color.White,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
        )
    }
}

@Composable
private fun RiftGlassCircleButton(
    label: String,
    isPrimary: Boolean = false,
    isTv: Boolean = false,
    onClick: () -> Unit,
) {
    var focused by remember { mutableStateOf(false) }
    val sizeDp = when {
        isPrimary && isTv -> 74.dp
        isPrimary -> 62.dp
        isTv -> 58.dp
        else -> 48.dp
    }
    val bgColor = when {
        focused -> Color(0xFF9333EA)
        isPrimary -> Color(0xCC7C3AED)
        else -> Color(0x99141220)
    }
    val borderColor = if (focused) Color(0xFFFACC15) else Color(0x55DDD6FE)

    Box(
        modifier = Modifier
            .size(sizeDp)
            .clip(CircleShape)
            .background(bgColor)
            .border(if (focused) 2.5.dp else 1.dp, borderColor, CircleShape)
            .onFocusChanged { focused = it.isFocused }
            .focusable()
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = label,
            color = Color.White,
            fontWeight = FontWeight.ExtraBold,
            fontSize = if (isPrimary) 18.sp else 12.sp,
        )
    }
}

@Composable
private fun RiftDarkCircleIconButton(
    iconText: String,
    active: Boolean = false,
    onClick: () -> Unit,
) {
    var focused by remember { mutableStateOf(false) }
    val bgColor = when {
        focused -> Color(0xCC27272A)
        active -> Color(0xD927272A)
        else -> Color(0xB8121216)
    }
    val borderColor = when {
        focused -> Color(0xFFFACC15)
        active -> Color(0x88FFFFFF)
        else -> Color(0x14FFFFFF)
    }

    Box(
        modifier = Modifier
            .size(44.dp)
            .clip(CircleShape)
            .background(bgColor)
            .border(1.dp, borderColor, CircleShape)
            .onFocusChanged { focused = it.isFocused }
            .focusable()
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = iconText,
            color = Color.White,
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold,
        )
    }
}

@Composable
private fun RiftSeek5CircleButton(
    isForward: Boolean,
    onClick: () -> Unit,
) {
    var focused by remember { mutableStateOf(false) }
    Box(
        modifier = Modifier
            .size(54.dp)
            .clip(CircleShape)
            .background(if (focused) Color(0xCC27272A) else Color(0xA60E0E12))
            .border(1.5.dp, if (focused) Color(0xFFFACC15) else Color(0x66FFFFFF), CircleShape)
            .onFocusChanged { focused = it.isFocused }
            .focusable()
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = if (isForward) "↻5" else "↺5",
            color = Color.White,
            fontWeight = FontWeight.ExtraBold,
            fontSize = 15.sp,
        )
    }
}

@Composable
private fun RiftPlainIconButton(
    label: String,
    active: Boolean = false,
    onClick: () -> Unit,
) {
    var focused by remember { mutableStateOf(false) }
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .onFocusChanged { focused = it.isFocused }
            .focusable()
            .clickable(onClick = onClick)
            .padding(horizontal = 6.dp, vertical = 4.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = label,
            color = if (focused || active) Color(0xFFFACC15) else Color.White,
            fontWeight = FontWeight.ExtraBold,
            fontSize = 18.sp,
        )
    }
}

@OptIn(UnstableApi::class)
private fun AspectRatioFitMode.toMedia3ResizeMode(): Int = when (this) {
    AspectRatioFitMode.FIT -> AspectRatioFrameLayout.RESIZE_MODE_FIT
    AspectRatioFitMode.ZOOM -> AspectRatioFrameLayout.RESIZE_MODE_ZOOM
    AspectRatioFitMode.FILL -> AspectRatioFrameLayout.RESIZE_MODE_FILL
}

private fun formatDurationMs(ms: Long): String {
    val totalSeconds = (ms.coerceAtLeast(0L) / 1000L).toInt()
    val hours = totalSeconds / 3600
    val minutes = (totalSeconds % 3600) / 60
    val seconds = totalSeconds % 60
    return if (hours > 0) {
        "%d:%02d:%02d".format(hours, minutes, seconds)
    } else {
        "%02d:%02d".format(minutes, seconds)
    }
}
