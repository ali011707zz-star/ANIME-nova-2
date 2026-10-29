package com.nova.anime.nova2.ui

import android.content.Intent
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
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

@Composable
fun LibraryScreen(
    libraryStore: LibraryStore,
    downloadRepository: DownloadRepository,
    initialTab: String = LibraryTab.FAVORITES.name,
    onOpenDetails: (Int) -> Unit,
    onOpenWatch: (Int, Int) -> Unit,
    onBack: () -> Unit,
) {
    var tab by rememberSaveable(initialTab) {
        mutableStateOf(LibraryTab.entries.firstOrNull { it.name == initialTab } ?: LibraryTab.FAVORITES)
    }
    val favorites by libraryStore.favorites.collectAsState()
    val history by libraryStore.history.collectAsState()
    val downloads by libraryStore.downloads.collectAsState()
    val context = LocalContext.current
    val layout = rememberNovaLayout()
    var galleryNotice by remember { mutableStateOf<String?>(null) }
    var activeOfflineRecord by remember { mutableStateOf<DownloadRecord?>(null) }

    LaunchedEffect(tab) {
        while (tab == LibraryTab.DOWNLOADS) {
            downloadRepository.refresh()
            delay(2_500L)
        }
    }

    CatalogScaffold(title = "مكتبتي وتنزيلاتي", onBack = {
        if (activeOfflineRecord != null) {
            activeOfflineRecord = null
        } else {
            onBack()
        }
    }) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                LibraryTab.entries.forEach { current ->
                    FilterChip(
                        selected = tab == current,
                        onClick = { tab = current },
                        label = { Text(current.title) },
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
                        DownloadRow(
                            record = record,
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
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            AsyncImage(
                model = entry.coverUrl,
                contentDescription = entry.title,
                modifier = Modifier.width(64.dp).height(90.dp),
            )
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = entry.title,
                    style = MaterialTheme.typography.titleMedium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text("الحلقة ${entry.episode} · ${entry.contentKind}")
                if (entry.durationMs > 0L) {
                    val percent = progressPercent(entry.positionMs, entry.durationMs)
                    Text("التقدم: $percent%")
                    LinearProgressIndicator(
                        progress = { percent / 100f },
                        modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
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
    onOpen: () -> Unit,
    onSaveToGallery: () -> Unit,
    onCancel: () -> Unit,
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(record.title, style = MaterialTheme.typography.titleMedium)
            Text("الحلقة ${record.episode} · ${record.site} · ${record.quality}")
            Text("${record.state.toArabicLabel()} (${record.progressPercent}%)")
            if (record.state == DownloadState.RUNNING || record.state == DownloadState.QUEUED) {
                LinearProgressIndicator(
                    progress = { record.progressPercent / 100f },
                    modifier = Modifier.fillMaxWidth().padding(top = 6.dp),
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
                }
                OutlinedButton(onClick = onCancel) {
                    Text("حذف")
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
        modifier = Modifier.fillMaxWidth().padding(32.dp),
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
    val state by sessionViewModel.state.collectAsState()
    val context = LocalContext.current
    var confirmation by remember { mutableStateOf<SettingsAction?>(null) }
    var displayName by rememberSaveable(state.user?.displayName) {
        mutableStateOf(state.user?.displayName ?: state.user?.display_name ?: "")
    }
    var username by rememberSaveable(state.user?.username) {
        mutableStateOf(state.user?.username ?: "")
    }
    var customApiUrl by rememberSaveable(state.activeApiUrl) {
        mutableStateOf(state.activeApiUrl)
    }
    var tvClaimCode by rememberSaveable { mutableStateOf("") }

    CatalogScaffold(title = "الإعدادات والحساب وربط التلفاز", onBack = onBack) {
        item {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                state.notice?.let {
                    Text(it, color = MaterialTheme.colorScheme.secondary, fontWeight = FontWeight.Bold)
                }
                state.error?.let {
                    Text(it, color = MaterialTheme.colorScheme.error, fontWeight = FontWeight.Bold)
                }

                // Account & Profile Section
                Text("الحساب والملف الشخصي", style = MaterialTheme.typography.titleLarge)
                if (state.user != null) {
                    Text("البريد: ${state.user?.email ?: "غير متوفر"}")
                    OutlinedTextField(
                        value = displayName,
                        onValueChange = { displayName = it },
                        label = { Text("الاسم الظاهر") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    OutlinedTextField(
                        value = username,
                        onValueChange = { username = it },
                        label = { Text("اسم المستخدم (@handle)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Button(
                        onClick = { sessionViewModel.updateProfile(displayName, username, state.user?.avatarColor) },
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("حفظ تعديلات الملف الشخصي")
                    }

                    // Phone -> TV Link Code Generator
                    Text(
                        "ربط شاشة التلفاز (Android TV Link)",
                        style = MaterialTheme.typography.titleLarge,
                        modifier = Modifier.padding(top = 12.dp),
                    )
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

                    if (state.linkedDevices.isNotEmpty()) {
                        Text("الأجهزة المرتبطة (${state.linkedDevices.size}/8):", fontWeight = FontWeight.Bold)
                        state.linkedDevices.forEach { device ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            ) {
                                Row(
                                    modifier = Modifier.padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(device.deviceName, fontWeight = FontWeight.Bold)
                                        Text(
                                            "المنصة: ${device.platform}",
                                            style = MaterialTheme.typography.bodySmall,
                                        )
                                    }
                                    OutlinedButton(onClick = { sessionViewModel.revokeDevice(device.id) }) {
                                        Text("إلغاء الربط")
                                    }
                                }
                            }
                        }
                    }
                } else {
                    Text("أنت تتصفح كزائر. يمكنك ربط التلفاز بإدخال الرمز المكون من 6 أرقام:")
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

                // Runtime API URL Section (matches utils/baseUrl.ts)
                Text(
                    "عنوان خادم NOVA (مع فحص /health التلقائي)",
                    style = MaterialTheme.typography.titleLarge,
                    modifier = Modifier.padding(top = 14.dp),
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

                // Local Storage Clear Section
                Text(
                    "التخزين والمزامنة",
                    style = MaterialTheme.typography.titleLarge,
                    modifier = Modifier.padding(top = 14.dp),
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

                Card(
                    modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                    shape = RoundedCornerShape(18.dp),
                    border = BorderStroke(1.dp, Color(0x6652D3A4)),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF10211D)),
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Favorite,
                                contentDescription = null,
                                tint = Color(0xFF34D399),
                                modifier = Modifier.size(22.dp),
                            )
                            Text(
                                text = "ادعمني ليستمر التطبيق بالعمل مجانًا",
                                style = MaterialTheme.typography.titleMedium,
                                modifier = Modifier.padding(start = 8.dp),
                            )
                        }
                        Text(
                            text = "مشاركة التطبيق مع أصدقائك تساعد على وصوله لمحبي الأنمي.",
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Button(
                            onClick = {
                                val shareIntent = Intent(Intent.ACTION_SEND).apply {
                                    type = "text/plain"
                                    putExtra(
                                        Intent.EXTRA_TEXT,
                                        "أستخدم Anime NOVA لمتابعة الأنمي. شاركه مع محبي الأنمي لدعم استمرار التطبيق.",
                                    )
                                }
                                runCatching {
                                    context.startActivity(Intent.createChooser(shareIntent, "مشاركة Anime NOVA"))
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Text("مشاركة التطبيق")
                        }
                    }
                }

                if (state.user != null) {
                    OutlinedButton(
                        onClick = onSignOut,
                        modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                    ) {
                        Text("تسجيل الخروج")
                    }
                }
            }
        }
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
