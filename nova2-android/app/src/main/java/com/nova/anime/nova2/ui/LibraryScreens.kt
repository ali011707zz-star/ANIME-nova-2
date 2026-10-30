package com.nova.anime.nova2.ui

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.nova.anime.nova2.core.catalog.WatchContentKind
import com.nova.anime.nova2.core.download.DownloadRepository
import com.nova.anime.nova2.core.library.DownloadRecord
import com.nova.anime.nova2.core.library.DownloadState
import com.nova.anime.nova2.core.library.HistoryEntry
import com.nova.anime.nova2.core.library.LibraryStore
import com.nova.anime.nova2.core.library.SavedAnime
import com.nova.anime.nova2.core.playback.PlaybackSource
import com.nova.anime.nova2.core.playback.PlaybackType
import com.nova.anime.nova2.core.playback.PlayerMetadata
import com.nova.anime.nova2.core.session.SessionViewModel
import kotlinx.coroutines.delay

private enum class LibraryTab(val title: String) {
    FAVORITES("المفضلة"),
    HISTORY("سجل المشاهدة"),
    DOWNLOADS("التنزيلات"),
}

private enum class AccountManagementTab(val title: String) {
    PROFILE("اليوزر والاسم"),
    AVATAR("صورة البروفايل"),
    FAVORITES("المفضلة"),
    COMMENTS("سجل تعليقاتك"),
}

private val PRESET_ANIME_AVATARS = listOf(
    "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-m1gX3iwfIsLu.png",
    "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg",
    "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-YCDoj1EkAxFn.jpg",
    "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-n1fmjRv4J6d1.jpg",
)

@Composable
fun LibraryScreen(
    libraryStore: LibraryStore,
    downloadRepository: DownloadRepository,
    initialTab: String = "FAVORITES",
    onOpenDetails: (Int) -> Unit,
    onOpenWatch: (Int, Int) -> Unit,
    onBack: () -> Unit,
) {
    var tab by remember(initialTab) {
        mutableStateOf(
            runCatching { LibraryTab.valueOf(initialTab.uppercase()) }
                .getOrDefault(LibraryTab.FAVORITES),
        )
    }
    val favorites by libraryStore.favorites.collectAsState()
    val history by libraryStore.history.collectAsState()
    val downloads by libraryStore.downloads.collectAsState()
    val context = LocalContext.current
    val layout = rememberNovaLayout()
    var galleryNotice by remember { mutableStateOf<String?>(null) }
    var activeOfflineRecord by remember { mutableStateOf<DownloadRecord?>(null) }
    var pausedDownloadIds by rememberSaveable { mutableStateOf(setOf<Long>()) }

    LaunchedEffect(tab) {
        while (tab == LibraryTab.DOWNLOADS) {
            downloadRepository.refresh()
            delay(2_500L)
        }
    }

    CatalogScaffold(title = "قائمتي وتنزيلاتي", onBack = {
        if (activeOfflineRecord != null) {
            activeOfflineRecord = null
        } else {
            onBack()
        }
    }) {
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                LibraryTab.entries.forEach { current ->
                    FilterChip(
                        selected = tab == current,
                        onClick = { tab = current },
                        label = { Text(current.title, fontWeight = FontWeight.Bold) },
                    )
                }
            }
        }

        galleryNotice?.let { msg ->
            item {
                Text(
                    text = msg,
                    color = MaterialTheme.colorScheme.secondary,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp),
                )
            }
        }

        when (tab) {
            LibraryTab.FAVORITES -> {
                if (favorites.isEmpty()) {
                    item { EmptyLibraryMessage("لا توجد أعمال في المفضلة بعد") }
                } else {
                    item {
                        NovaAnimeGrid(
                            items = favorites.map(SavedAnime::toAnimeCard),
                            onOpenDetails = onOpenDetails,
                        )
                    }
                }
            }

            LibraryTab.HISTORY -> {
                if (history.isEmpty()) {
                    item { EmptyLibraryMessage("لم تشاهد أي حلقة بعد") }
                } else {
                    items(history, key = { "${it.contentKind}-${it.contentKey}-${it.episode}" }) { entry ->
                        HistoryRow(
                            entry = entry,
                            onResume = { onOpenWatch(entry.animeId, entry.episode) },
                            onRemove = { libraryStore.removeHistory(entry) },
                        )
                    }
                }
            }

            LibraryTab.DOWNLOADS -> {
                activeOfflineRecord?.let { record ->
                    val localUrl = record.localUri
                    if (!localUrl.isNullOrBlank()) {
                        val offlineSource = PlaybackSource(
                            key = "offline|${record.downloadId}",
                            site = record.site,
                            name = "ملف محلي (${record.site})",
                            quality = record.quality,
                            qualityRank = 100,
                            url = localUrl,
                            type = PlaybackType.MP4,
                        )
                        item {
                            RiftPlayer(
                                sources = listOf(offlineSource),
                                selectedSourceIndex = 0,
                                metadata = PlayerMetadata(
                                    title = record.title,
                                    episodeNumber = record.episode,
                                    quality = record.quality,
                                    sourceName = "تنزيل محلي (${record.site})",
                                    anilistId = record.animeId,
                                ),
                                initialPositionMs = libraryStore.getSavedPositionMs(record.animeId, record.episode),
                                isTv = layout.isTv,
                                onProgress = { posMs, durMs ->
                                    libraryStore.recordHistory(
                                        animeId = record.animeId,
                                        title = record.title,
                                        coverUrl = record.coverUrl,
                                        episode = record.episode,
                                        positionMs = posMs,
                                        durationMs = durMs,
                                    )
                                },
                                onClose = {
                                    activeOfflineRecord = null
                                },
                            )
                        }
                    }
                }

                if (downloads.isEmpty()) {
                    item { EmptyLibraryMessage("لا توجد حلقات منزلة بعد") }
                } else {
                    items(downloads, key = { it.downloadId }) { record ->
                        val isManuallyPaused = record.downloadId in pausedDownloadIds
                        DownloadRow(
                            record = record,
                            isManuallyPaused = isManuallyPaused,
                            onTogglePauseResume = {
                                pausedDownloadIds = if (isManuallyPaused) {
                                    pausedDownloadIds - record.downloadId
                                } else {
                                    pausedDownloadIds + record.downloadId
                                }
                            },
                            onOpen = {
                                if (!record.localUri.isNullOrBlank()) {
                                    activeOfflineRecord = record
                                } else {
                                    downloadRepository.openIntent(record)?.let { intent ->
                                        runCatching { context.startActivity(intent) }
                                    }
                                }
                            },
                            onSaveToGallery = {
                                val saved = downloadRepository.saveToGallery(record)
                                galleryNotice = if (saved) {
                                    "تم حفظ الحلقة ${record.episode} في معرض الفيديو (Movies/AnimeNOVA)"
                                } else {
                                    "تعذر حفظ الفيديو في المعرض"
                                }
                            },
                            onCancel = {
                                if (activeOfflineRecord?.downloadId == record.downloadId) {
                                    activeOfflineRecord = null
                                }
                                downloadRepository.cancel(record)
                            },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun HistoryRow(
    entry: HistoryEntry,
    onResume: () -> Unit,
    onRemove: () -> Unit,
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp)
            .clickable(onClick = onResume),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            AsyncImage(
                model = entry.coverUrl,
                contentDescription = entry.title,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .width(64.dp)
                    .height(90.dp)
                    .clip(RoundedCornerShape(10.dp)),
            )
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = entry.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.ExtraBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text("الحلقة ${entry.episode} · ${entry.contentKind}")
                if (entry.durationMs > 0L) {
                    val percent = progressPercent(entry.positionMs, entry.durationMs)
                    Text("التقدم: $percent%")
                    LinearProgressIndicator(
                        progress = { percent / 100f },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 4.dp),
                    )
                }
            }
            Spacer(Modifier.width(8.dp))
            OutlinedButton(onClick = onRemove) {
                Text("حذف")
            }
        }
    }
}

@Composable
private fun DownloadRow(
    record: DownloadRecord,
    isManuallyPaused: Boolean,
    onTogglePauseResume: () -> Unit,
    onOpen: () -> Unit,
    onSaveToGallery: () -> Unit,
    onCancel: () -> Unit,
) {
    val effectivePaused = isManuallyPaused || record.state == DownloadState.PAUSED
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            // Clean Anime Poster WITHOUT any video badge icon overlay
            AsyncImage(
                model = record.coverUrl,
                contentDescription = record.title,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .width(68.dp)
                    .height(96.dp)
                    .clip(RoundedCornerShape(12.dp)),
            )

            Column(modifier = Modifier.weight(1f)) {
                Text(record.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.ExtraBold)
                Text("الحلقة ${record.episode} · ${record.site} · ${record.quality}")
                val statusLabel = if (effectivePaused && record.state != DownloadState.COMPLETE) {
                    "متوقف مؤقتًا (${record.progressPercent}%)"
                } else {
                    "${record.state.toArabicLabel()} (${record.progressPercent}%)"
                }
                Text(
                    text = statusLabel,
                    color = if (effectivePaused) Color(0xFFF59E0B) else MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold,
                )
                if (record.state != DownloadState.COMPLETE) {
                    LinearProgressIndicator(
                        progress = { record.progressPercent / 100f },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 6.dp),
                    )
                }
                Row(
                    modifier = Modifier.padding(top = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    if (record.state == DownloadState.COMPLETE) {
                        Button(onClick = onOpen) {
                            Text("تشغيل أوفلاين")
                        }
                        OutlinedButton(
                            onClick = onSaveToGallery,
                            enabled = !record.savedToGallery,
                        ) {
                            Text(if (record.savedToGallery) "محفوظ بالمعرض ✓" else "حفظ بالمعرض")
                        }
                    } else {
                        // Pause / Resume Download Button
                        Button(
                            onClick = onTogglePauseResume,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (effectivePaused) Color(0xFF10B981) else Color(0xFFF59E0B),
                            ),
                        ) {
                            Text(
                                text = if (effectivePaused) "▶ استئناف التنزيل" else "⏸ إيقاف مؤقت",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                            )
                        }
                    }
                    OutlinedButton(onClick = onCancel) {
                        Text("حذف")
                    }
                }
            }
        }
    }
}

private fun DownloadState.toArabicLabel(): String = when (this) {
    DownloadState.QUEUED -> "في الانتظار"
    DownloadState.RUNNING -> "جارٍ التنزيل"
    DownloadState.PAUSED -> "متوقف مؤقتًا"
    DownloadState.COMPLETE -> "اكتمل التنزيل"
    DownloadState.FAILED -> "فشل التنزيل"
    DownloadState.REMOVED -> "أزيل التنزيل"
}

@Composable
private fun EmptyLibraryMessage(message: String) {
    Text(
        text = message,
        modifier = Modifier
            .fillMaxWidth()
            .padding(32.dp),
        color = MaterialTheme.colorScheme.onSurfaceVariant,
    )
}

@Composable
fun SettingsScreen(
    libraryStore: LibraryStore,
    sessionViewModel: SessionViewModel,
    onSignOut: () -> Unit,
    onBack: () -> Unit,
) {
    val context = LocalContext.current
    val themeState = LocalNovaThemeState.current
    val state by sessionViewModel.state.collectAsState()
    val favorites by libraryStore.favorites.collectAsState()
    var confirmation by remember { mutableStateOf<SettingsAction?>(null) }
    var showFullScreenAccountManagement by rememberSaveable { mutableStateOf(false) }
    var accountTab by rememberSaveable { mutableStateOf(AccountManagementTab.PROFILE) }
    var displayName by rememberSaveable(state.user?.displayName) {
        mutableStateOf(state.user?.displayName ?: state.user?.display_name ?: "Ali Anime NOVA")
    }
    var username by rememberSaveable(state.user?.username) {
        mutableStateOf(state.user?.username ?: "@ali0117078153")
    }
    var selectedAvatarUrl by rememberSaveable {
        mutableStateOf(PRESET_ANIME_AVATARS.first())
    }
    var customApiUrl by rememberSaveable(state.activeApiUrl) {
        mutableStateOf(state.activeApiUrl)
    }
    var tvClaimCode by rememberSaveable { mutableStateOf("") }

    // Support Me via Telegram Stars / Gifts State
    var showSupportModal by rememberSaveable { mutableStateOf(false) }
    var selectedSupportTier by rememberSaveable { mutableStateOf("") }
    var supportCount by rememberSaveable { mutableIntStateOf(3) }

    val galleryPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent(),
    ) { uri: Uri? ->
        if (uri != null) {
            selectedAvatarUrl = uri.toString()
        }
    }

    // Dedicated Fullscreen Account Management Page (يفتح في صفحة كاملة لوحده)
    if (showFullScreenAccountManagement) {
        BackHandler { showFullScreenAccountManagement = false }
        CatalogScaffold(
            title = "إدارة الحساب والملف الشخصي",
            onBack = { showFullScreenAccountManagement = false },
        ) {
            item {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                ) {
                    // User Summary Header Card
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(22.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    ) {
                        Row(
                            modifier = Modifier.padding(16.dp),
                            horizontalArrangement = Arrangement.spacedBy(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            AsyncImage(
                                model = selectedAvatarUrl,
                                contentDescription = displayName,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier
                                    .size(64.dp)
                                    .clip(CircleShape),
                            )
                            Column(modifier = Modifier.weight(1f)) {
                                Text(displayName, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.ExtraBold)
                                Text(username, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                                Text(
                                    text = state.user?.email ?: "ali0117078153@gmail.com • متصل بـ Google ✓",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                        }
                    }

                    // 4 Account Management Tabs
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        AccountManagementTab.entries.forEach { tab ->
                            FilterChip(
                                selected = accountTab == tab,
                                onClick = { accountTab = tab },
                                label = { Text(tab.title, fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                            )
                        }
                    }

                    when (accountTab) {
                        AccountManagementTab.PROFILE -> {
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(18.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            ) {
                                Column(
                                    modifier = Modifier.padding(16.dp),
                                    verticalArrangement = Arrangement.spacedBy(10.dp),
                                ) {
                                    Text("تعديل اسم المستخدم واليوزر", fontWeight = FontWeight.ExtraBold)
                                    OutlinedTextField(
                                        value = displayName,
                                        onValueChange = { displayName = it },
                                        label = { Text("اسم المستخدم (الاسم الظاهر)") },
                                        singleLine = true,
                                        modifier = Modifier.fillMaxWidth(),
                                    )
                                    OutlinedTextField(
                                        value = username,
                                        onValueChange = { username = it },
                                        label = { Text("اليوزر (@username)") },
                                        singleLine = true,
                                        modifier = Modifier.fillMaxWidth(),
                                    )
                                    Button(
                                        onClick = {
                                            sessionViewModel.updateProfile(displayName, username, state.user?.avatarColor)
                                        },
                                        modifier = Modifier.fillMaxWidth(),
                                    ) {
                                        Text("✓ حفظ التعديلات")
                                    }
                                }
                            }
                        }

                        AccountManagementTab.AVATAR -> {
                            // Avatar selection WITHOUT URL input (اختيار من الأفاتار أو معرض الجهاز فقط)
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(18.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            ) {
                                Column(
                                    modifier = Modifier.padding(16.dp),
                                    verticalArrangement = Arrangement.spacedBy(12.dp),
                                ) {
                                    Text("اختر صورة رمزية من شخصيات الأنمي:", fontWeight = FontWeight.ExtraBold)
                                    LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                        items(PRESET_ANIME_AVATARS) { avatarUrl ->
                                            AsyncImage(
                                                model = avatarUrl,
                                                contentDescription = "أفاتار",
                                                contentScale = ContentScale.Crop,
                                                modifier = Modifier
                                                    .size(68.dp)
                                                    .clip(CircleShape)
                                                    .clickable { selectedAvatarUrl = avatarUrl },
                                            )
                                        }
                                    }
                                    Button(
                                        onClick = { galleryPickerLauncher.launch("image/*") },
                                        modifier = Modifier.fillMaxWidth(),
                                    ) {
                                        Text("📁 اختيار صورة من معرض هاتفك")
                                    }
                                }
                            }
                        }

                        AccountManagementTab.FAVORITES -> {
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(18.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            ) {
                                Column(
                                    modifier = Modifier.padding(16.dp),
                                    verticalArrangement = Arrangement.spacedBy(10.dp),
                                ) {
                                    Text("قائمة مفضلتك المحفوظة (${favorites.size})", fontWeight = FontWeight.ExtraBold)
                                    if (favorites.isEmpty()) {
                                        Text(
                                            text = "لا توجد أنميات في مفضلتك حالياً",
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        )
                                    } else {
                                        favorites.forEach { fav ->
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                verticalAlignment = Alignment.CenterVertically,
                                            ) {
                                                Text(fav.title, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                                                Text("★ ${fav.score ?: 9.0}", color = MaterialTheme.colorScheme.primary)
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        AccountManagementTab.COMMENTS -> {
                            // Saved Comments History ONLY (تم حذف نشر تعليق أو البحث فيه من الملف الشخصي)
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(18.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            ) {
                                Column(
                                    modifier = Modifier.padding(16.dp),
                                    verticalArrangement = Arrangement.spacedBy(10.dp),
                                ) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                    ) {
                                        Text("سجل تعليقاتك في الحلقات", fontWeight = FontWeight.ExtraBold)
                                        Text(username, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                                    }
                                    Surface(
                                        color = MaterialTheme.colorScheme.surfaceVariant,
                                        shape = RoundedCornerShape(12.dp),
                                        modifier = Modifier.fillMaxWidth(),
                                    ) {
                                        Column(modifier = Modifier.padding(12.dp)) {
                                            Text("سولو ليفلينغ • الحلقة 7", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                                            Text("حلقة أسطورية وتحريك قتالي خارق!", modifier = Modifier.padding(top = 4.dp))
                                        }
                                    }
                                    Surface(
                                        color = MaterialTheme.colorScheme.surfaceVariant,
                                        shape = RoundedCornerShape(12.dp),
                                        modifier = Modifier.fillMaxWidth(),
                                    ) {
                                        Column(modifier = Modifier.padding(12.dp)) {
                                            Text("جوجوتسو كايسن • الحلقة 12", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                                            Text("أفضل مشهد في الموسم بلا منازع 🔥", modifier = Modifier.padding(top = 4.dp))
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return
    }

    CatalogScaffold(title = "الملف الشخصي والإعدادات", onBack = onBack) {
        item {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                // 1. Profile Card with "إدارة الحساب" Button (Opens Fullscreen)
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(22.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                AsyncImage(
                                    model = selectedAvatarUrl,
                                    contentDescription = displayName,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier
                                        .size(56.dp)
                                        .clip(CircleShape),
                                )
                                Column {
                                    Text(displayName, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.ExtraBold)
                                    Text(username, color = MaterialTheme.colorScheme.primary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                    Text(
                                        text = state.user?.email ?: "ali0117078153@gmail.com",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    )
                                }
                            }
                            Button(
                                onClick = { showFullScreenAccountManagement = true },
                                shape = RoundedCornerShape(12.dp),
                            ) {
                                Text("⚙️ إدارة الحساب", fontWeight = FontWeight.ExtraBold)
                            }
                        }
                    }
                }

                // 2. Nova Premium Card + "ادعمني ليستمر التطبيق بالعمل مجاناً" directly underneath
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.4f)),
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Nova Premium • VIP 1.99$", fontWeight = FontWeight.ExtraBold, color = MaterialTheme.colorScheme.primary)
                            Text(
                                text = "مشاهدة فائقة بدون إعلانات مع تخطي تلقائي للمقدمات وجودة 1080p",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                        Button(onClick = {}) {
                            Text("ترقية")
                        }
                    }
                }

                // 2B. Support Me Card (ادعمني ليستمر التطبيق بالعمل مجاناً — بنجوم أو هدايا تلجرام)
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showSupportModal = true },
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(1.dp, Color(0xFF10B981).copy(alpha = 0.5f)),
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "ادعمني ليستمر التطبيق بالعمل مجاناً ❤️",
                                    fontWeight = FontWeight.ExtraBold,
                                    color = Color(0xFF10B981),
                                )
                                Text(
                                    text = "ادعمني بنجوم أو هدايا تلجرام ⭐🎁 لدعم خوادم البث السحابية",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                            Button(
                                onClick = { showSupportModal = true },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                            ) {
                                Text("ادعمني", color = Color.White, fontWeight = FontWeight.Bold)
                            }
                        }
                        Text(
                            text = "✓ ادعمني بنجوم أو هدايا تلجرام  •  ✓ دعم سيرفرات الحلقات  •  مساهماتك: $supportCount ⭐",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }

                // 3. Appearance & Theme (أسود ملكي OLED / أبيض ساطع)
                Text("المظهر وتجربة العرض", style = MaterialTheme.typography.titleLarge)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    Button(
                        onClick = { themeState.onToggleTheme(false) },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (!themeState.isLight) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
                        ),
                        modifier = Modifier.weight(1f),
                    ) {
                        Text(
                            text = "🌙 أسود ملكي (OLED)",
                            color = if (!themeState.isLight) Color.White else MaterialTheme.colorScheme.onSurface,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                    Button(
                        onClick = { themeState.onToggleTheme(true) },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (themeState.isLight) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
                        ),
                        modifier = Modifier.weight(1f),
                    ) {
                        Text(
                            text = "☀️ أبيض ساطع",
                            color = if (themeState.isLight) Color.White else MaterialTheme.colorScheme.onSurface,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                }

                // 4. Phone -> TV Link Code Generator
                Text(
                    "ربط شاشة التلفاز (Android TV Link)",
                    style = MaterialTheme.typography.titleLarge,
                    modifier = Modifier.padding(top = 6.dp),
                )
                if (state.user != null) {
                    Button(
                        onClick = { sessionViewModel.generateTvLinkCode() },
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("إنشاء رمز ربط التلفاز (6 أرقام)")
                    }
                    state.generatedLinkCode?.let { code ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                            ) {
                                Text("أدخل هذا الرمز في شاشة التلفاز:", style = MaterialTheme.typography.bodyMedium)
                                Text(
                                    text = code.chunked(1).joinToString(" "),
                                    fontSize = 28.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.padding(top = 6.dp),
                                )
                            }
                        }
                    }
                } else {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        OutlinedTextField(
                            value = tvClaimCode,
                            onValueChange = { tvClaimCode = it },
                            label = { Text("رمز التلفاز (6 أرقام)") },
                            singleLine = true,
                            modifier = Modifier.weight(1f),
                        )
                        Button(onClick = { sessionViewModel.claimTvLinkCode(tvClaimCode) }) {
                            Text("ربط")
                        }
                    }
                }

                // 5. Runtime API URL Section
                Text(
                    "عنوان خادم NOVA (مع فحص /health التلقائي)",
                    style = MaterialTheme.typography.titleLarge,
                    modifier = Modifier.padding(top = 6.dp),
                )
                OutlinedTextField(
                    value = customApiUrl,
                    onValueChange = { customApiUrl = it },
                    label = { Text("عنوان الخادم") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = { sessionViewModel.updateCustomApiUrl(customApiUrl) },
                        modifier = Modifier.weight(1f),
                    ) {
                        Text("تحقق وحفظ")
                    }
                    OutlinedButton(
                        onClick = { sessionViewModel.updateCustomApiUrl(null) },
                    ) {
                        Text("استعادة الافتراضي")
                    }
                }

                // 6. Local Storage Clear Section
                Text(
                    "التخزين والمزامنة",
                    style = MaterialTheme.typography.titleLarge,
                    modifier = Modifier.padding(top = 6.dp),
                )
                Button(
                    onClick = { confirmation = SettingsAction.CLEAR_HISTORY },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("مسح سجل المشاهدة")
                }
                Button(
                    onClick = { confirmation = SettingsAction.CLEAR_FAVORITES },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("مسح المفضلة")
                }

                if (state.user != null) {
                    OutlinedButton(
                        onClick = onSignOut,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 8.dp),
                    ) {
                        Text("تسجيل الخروج")
                    }
                }
            }
        }
    }

    // Support Me via Telegram Stars / Gifts Dialog (ادعمني بنجوم أو هدايا تلجرام + اذهب إلى تلجرام)
    if (showSupportModal) {
        AlertDialog(
            onDismissRequest = { showSupportModal = false },
            containerColor = MaterialTheme.colorScheme.surface,
            title = {
                Text(
                    text = "ادعمني بنجوم أو هدايا تلجرام ⭐🎁",
                    fontWeight = FontWeight.ExtraBold,
                    color = MaterialTheme.colorScheme.onSurface,
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "يمكنك إرسال نجوم تلجرام (Telegram Stars) أو هدايا رمزية لدعم استمرار سيرفرات المشاهدة والتحميل مجاناً للجميع.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Text(
                        text = "اختر مبلغ الدعم أو الهدية عبر تلجرام:",
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        listOf(
                            Triple("coffee", "1$", "50 نجمة ⭐"),
                            Triple("server", "3$", "150 نجمة ⭐"),
                            Triple("gold", "5$", "هدية تلجرام 🎁"),
                        ).forEach { (id, amount, label) ->
                            val selected = selectedSupportTier == id
                            OutlinedButton(
                                onClick = {
                                    selectedSupportTier = id
                                    supportCount += 1
                                },
                                border = BorderStroke(
                                    width = if (selected) 2.dp else 1.dp,
                                    color = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline,
                                ),
                                modifier = Modifier.weight(1f),
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(amount, fontWeight = FontWeight.ExtraBold, color = MaterialTheme.colorScheme.primary)
                                    Text(label, fontSize = 10.sp)
                                }
                            }
                        }
                    }

                    // Dynamic "اذهب إلى تلجرام" button shown when a specific amount is selected
                    if (selectedSupportTier.isNotEmpty()) {
                        Button(
                            onClick = {
                                runCatching {
                                    context.startActivity(
                                        Intent(Intent.ACTION_VIEW, Uri.parse("https://t.me/ANIME_N0VA")),
                                    )
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0EA5E9)),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 6.dp),
                        ) {
                            Text("🚀 اذهب إلى تلجرام (@ANIME_N0VA)", color = Color.White, fontWeight = FontWeight.ExtraBold)
                        }
                    }
                }
            },
            confirmButton = {
                Button(onClick = { showSupportModal = false }) {
                    Text("إغلاق")
                }
            },
        )
    }

    confirmation?.let { action ->
        AlertDialog(
            onDismissRequest = { confirmation = null },
            title = { Text("تأكيد العملية") },
            text = { Text(action.confirmation) },
            confirmButton = {
                Button(onClick = {
                    when (action) {
                        SettingsAction.CLEAR_HISTORY -> libraryStore.clearHistory()
                        SettingsAction.CLEAR_FAVORITES -> libraryStore.clearFavorites()
                    }
                    confirmation = null
                }) {
                    Text("مسح")
                }
            },
            dismissButton = {
                Button(onClick = { confirmation = null }) { Text("إلغاء") }
            },
        )
    }
}

private enum class SettingsAction(val confirmation: String) {
    CLEAR_HISTORY("سيتم حذف سجل المشاهدة من هذا الجهاز ومزامنة الحذف مع الحساب."),
    CLEAR_FAVORITES("سيتم حذف جميع الأعمال من المفضلة على هذا الجهاز ومزامنة الحذف مع الحساب."),
}

private fun progressPercent(positionMs: Long, durationMs: Long): Int =
    ((positionMs.toDouble() / durationMs.toDouble()) * 100.0)
        .toInt()
        .coerceIn(0, 100)

private fun SavedAnime.toAnimeCard() = com.nova.anime.nova2.core.catalog.AnimeCard(
    id = id,
    title = title,
    englishTitle = englishTitle,
    coverUrl = coverUrl,
    episodes = episodes,
    score = score,
    contentKind = WatchContentKind.entries.firstOrNull { it.wireName == contentKind } ?: WatchContentKind.ANIME,
    contentKey = contentKey,
)
