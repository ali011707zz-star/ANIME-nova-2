package com.nova.anime.nova2.ui

import android.app.Activity
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListScope
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberDrawerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.nova.anime.nova2.core.catalog.AiringScheduleItem
import com.nova.anime.nova2.core.catalog.AnimationCard
import com.nova.anime.nova2.core.catalog.AnimeCard
import com.nova.anime.nova2.core.catalog.AnimeDetails
import com.nova.anime.nova2.core.catalog.AnilistRepository
import com.nova.anime.nova2.core.catalog.BrowseFilters
import com.nova.anime.nova2.core.catalog.DubbedEpisodeItem
import com.nova.anime.nova2.core.catalog.DubbedSeriesCard
import com.nova.anime.nova2.core.catalog.EpisodeItem
import com.nova.anime.nova2.core.catalog.HomeCatalog
import com.nova.anime.nova2.core.catalog.LatestEpisodeCard
import com.nova.anime.nova2.core.catalog.StardimaEpisodeEntry
import com.nova.anime.nova2.core.catalog.StardimaServerEntry
import com.nova.anime.nova2.core.catalog.StardimaTitleCard
import com.nova.anime.nova2.core.catalog.WatchContentKind
import com.nova.anime.nova2.core.library.HistoryEntry
import com.nova.anime.nova2.core.library.LibraryStore
import com.nova.anime.nova2.core.model.CommentDto
import com.nova.anime.nova2.core.model.CreateCommentRequest
import com.nova.anime.nova2.core.model.NewsArticleDto
import com.nova.anime.nova2.core.playback.NovaPlayerServicesAdapter
import com.nova.anime.nova2.core.playback.PlaybackRepository
import com.nova.anime.nova2.core.playback.PlaybackSource
import com.nova.anime.nova2.core.playback.PlaybackType
import com.nova.anime.nova2.core.playback.PlayerMetadata
import com.nova.anime.nova2.core.session.SessionViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun HomeScreen(
    repository: AnilistRepository,
    libraryStore: LibraryStore,
    onOpenDetails: (Int) -> Unit,
    onOpenEpisodes: (Int) -> Unit,
    onOpenWatch: (Int, Int) -> Unit,
    onOpenLatestEpisodes: () -> Unit,
    onOpenSeasons: () -> Unit,
    onOpenComingSoon: () -> Unit,
    onOpenTvLink: () -> Unit,
    onOpenBrowse: () -> Unit,
    onOpenSearch: () -> Unit,
    onOpenDubbed: () -> Unit,
    onOpenDownloads: () -> Unit,
    onOpenAnimations: () -> Unit,
    onOpenManga: () -> Unit,
    onOpenStardima: () -> Unit,
    onOpenSchedule: () -> Unit,
    onOpenNews: () -> Unit,
    onOpenLibrary: () -> Unit,
    onOpenSettings: () -> Unit,
) {
    var catalog by remember { mutableStateOf<HomeCatalog?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var tvExitPending by remember { mutableStateOf(false) }
    val history by libraryStore.history.collectAsState()
    val context = LocalContext.current
    val layout = rememberNovaLayout()

    LaunchedEffect(Unit) {
        runCatching { repository.loadHome() }
            .onSuccess { catalog = it; error = null }
            .onFailure { error = it.message ?: "تعذر تحميل الصفحة الرئيسية" }
    }

    LaunchedEffect(tvExitPending) {
        if (tvExitPending) {
            delay(1_800L)
            tvExitPending = false
        }
    }

    // TV double-back exit protection matching artifacts/nova-mobile/app/_layout.tsx
    BackHandler(enabled = layout.isTv) {
        if (tvExitPending) {
            (context as? Activity)?.finish()
        } else {
            tvExitPending = true
        }
    }

    val drawerState = rememberDrawerState(DrawerValue.Closed)
    val drawerScope = rememberCoroutineScope()

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            NovaDrawerContent(
                selected = "الرئيسية",
                onSelect = { destination ->
                    drawerScope.launch { drawerState.close() }
                    when (destination) {
                        "بحث" -> onOpenSearch()
                        "أحدث الحلقات" -> onOpenLatestEpisodes()
                        "المواسم" -> onOpenSeasons()
                        "قريبًا" -> onOpenComingSoon()
                        "ربط التلفاز" -> onOpenTvLink()
                        "تنزيلاتي" -> onOpenDownloads()
                        "تصفح" -> onOpenBrowse()
                        "المانجا" -> onOpenManga()
                        "مدبلج" -> onOpenDubbed()
                        "أنيميشن" -> onOpenAnimations()
                        "ستارديما" -> onOpenStardima()
                        "جدول البث" -> onOpenSchedule()
                        "الأخبار" -> onOpenNews()
                        "مكتبتي" -> onOpenLibrary()
                        "الإعدادات" -> onOpenSettings()
                    }
                },
            )
        },
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            Column(modifier = Modifier.fillMaxSize()) {
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    contentPadding = PaddingValues(bottom = if (layout.isTv) 20.dp else 12.dp),
                ) {
                    item {
                        NovaHeader(
                            onMenu = { drawerScope.launch { drawerState.open() } },
                            onSearch = onOpenSearch,
                        )
                    }
                    when {
                        error != null -> item { ErrorBlock(error!!) }
                        catalog == null -> item { LoadingBlock() }
                        else -> {
                            catalog!!.trending.take(6).ifEmpty { catalog!!.popular.take(6) }
                                .takeIf { it.isNotEmpty() }?.let { heroItems ->
                                item {
                                    NovaHero(
                                        items = heroItems,
                                        onDetails = onOpenDetails,
                                        onEpisodes = onOpenEpisodes,
                                    )
                                }
                            }
                            val resumableHistory = history.filter {
                                it.contentKind == WatchContentKind.ANIME.wireName
                            }
                            if (resumableHistory.isNotEmpty()) {
                                item {
                                    ContinueWatchingRail(
                                        history = resumableHistory,
                                        onResume = { entry ->
                                            onOpenWatch(entry.animeId, entry.episode)
                                        },
                                        onOpenLibrary = onOpenLibrary,
                                    )
                                }
                            }
                            if (catalog!!.latestEpisodes.isNotEmpty()) {
                                item {
                                    LatestEpisodesRail(
                                        episodes = catalog!!.latestEpisodes,
                                        onOpenWatch = onOpenWatch,
                                        onOpenAll = onOpenLatestEpisodes,
                                    )
                                }
                            }
                            item { NovaSection("الأكثر رواجًا", catalog!!.trending, onOpenDetails) }
                            item { NovaSection("الأكثر شعبية", catalog!!.popular, onOpenDetails) }
                            item { NovaSection("يُعرض حاليًا", catalog!!.airing, onOpenDetails, Color(0xFF22C55E)) }
                            item { NovaSection("الموسم الحالي", catalog!!.seasonal, onOpenDetails) }
                            item { NovaSection("الأعلى تقييمًا", catalog!!.topRated, onOpenDetails, Color(0xFFFFD700)) }
                            item { NovaSection("أفلام الأنمي", catalog!!.movies, onOpenDetails, Color(0xFF3B82F6)) }
                            if (catalog!!.isekai.isNotEmpty()) {
                                item { NovaSection("عالم آخر (Isekai)", catalog!!.isekai, onOpenDetails, Color(0xFFA855F7)) }
                            }
                        }
                    }
                }
                NovaBottomNavigation(selected = "الرئيسية") { destination ->
                    when (destination) {
                        "بحث" -> onOpenSearch()
                        "تصفح" -> onOpenBrowse()
                        "مدبلج" -> onOpenDubbed()
                        "تنزيلاتي" -> onOpenDownloads()
                        "مكتبتي", "قائمتي" -> onOpenLibrary()
                    }
                }
            }

            if (tvExitPending) {
                Surface(
                    color = Color(0xE6090A0C),
                    shape = RoundedCornerShape(999.dp),
                    border = BorderStroke(1.dp, Color(0x33FFFFFF)),
                    modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 112.dp),
                ) {
                    Text(
                        text = "اضغط رجوع مرة أخرى للخروج",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 20.dp, vertical = 10.dp),
                    )
                }
            }
        }
    }
}

@Composable
private fun LatestEpisodesRail(
    episodes: List<LatestEpisodeCard>,
    onOpenWatch: (Int, Int) -> Unit,
    onOpenAll: () -> Unit,
) {
    val layout = rememberNovaLayout()
    Column(modifier = Modifier.fillMaxWidth().padding(top = 18.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = layout.horizontalPadding),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("أحدث الحلقات", style = MaterialTheme.typography.titleLarge)
            Text(
                text = "عرض الكل",
                color = MaterialTheme.colorScheme.primary,
                style = MaterialTheme.typography.labelLarge,
                modifier = Modifier.clickable(onClick = onOpenAll).padding(8.dp),
            )
        }
        LazyRow(
            contentPadding = PaddingValues(horizontal = layout.horizontalPadding, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            items(episodes, key = { "${it.anilistId}-${it.episode}-${it.sourceSite}" }) { ep ->
                Card(
                    modifier = Modifier
                        .width(if (layout.isTv) 220.dp else 160.dp)
                        .clickable { onOpenWatch(ep.anilistId, ep.episode) },
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                ) {
                    Column(modifier = Modifier.padding(8.dp)) {
                        AsyncImage(
                            model = ep.coverUrl,
                            contentDescription = ep.title,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(if (layout.isTv) 128.dp else 94.dp)
                                .clip(RoundedCornerShape(10.dp)),
                        )
                        Text(
                            text = ep.arabicTitle ?: ep.title,
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.padding(top = 6.dp),
                        )
                        Text(
                            text = "الحلقة ${ep.episode} · ${ep.sourceSite}",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.primary,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ContinueWatchingRail(
    history: List<HistoryEntry>,
    onResume: (HistoryEntry) -> Unit,
    onOpenLibrary: () -> Unit,
) {
    val layout = rememberNovaLayout()
    Column(
        modifier = Modifier.fillMaxWidth().padding(top = 20.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = layout.horizontalPadding),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column {
                Text("متابعة المشاهدة", style = MaterialTheme.typography.titleLarge)
                Text(
                    "أكمل حلقاتك من حيث توقفت",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.labelSmall,
                )
            }
            Text(
                text = "السجل الكامل",
                color = MaterialTheme.colorScheme.onSurface,
                style = MaterialTheme.typography.labelLarge,
                modifier = Modifier.clickable(onClick = onOpenLibrary).padding(8.dp),
            )
        }
        LazyRow(
            contentPadding = PaddingValues(horizontal = layout.horizontalPadding),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            items(
                items = history,
                key = { "${it.animeId}-${it.episode}-${it.season}" },
            ) { entry ->
                val progress = if (entry.durationMs > 0L) {
                    ((entry.positionMs * 100L) / entry.durationMs).toInt().coerceIn(0, 100)
                } else {
                    45
                }
                val remainingMinutes = if (entry.durationMs > 0L) {
                    ((entry.durationMs - entry.positionMs).coerceAtLeast(0L) / 60_000L)
                        .toInt().coerceAtLeast(1)
                } else {
                    13
                }
                Card(
                    modifier = Modifier
                        .width(if (layout.isTv) 200.dp else 168.dp)
                        .clickable { onResume(entry) },
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                ) {
                    Column {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(if (layout.isTv) 116.dp else 92.dp)
                                .background(Color(0xFF0B0F17)),
                        ) {
                            entry.coverUrl?.let { cover ->
                                AsyncImage(
                                    model = cover,
                                    contentDescription = entry.title,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize(),
                                )
                            }
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(54.dp)
                                    .align(Alignment.BottomCenter)
                                    .background(
                                        Brush.verticalGradient(
                                            listOf(Color.Transparent, Color.Black.copy(alpha = .88f)),
                                        ),
                                    ),
                            )
                            Surface(
                                color = Color.Black.copy(alpha = .84f),
                                shape = RoundedCornerShape(6.dp),
                                modifier = Modifier.align(Alignment.TopEnd).padding(6.dp),
                            ) {
                                Text(
                                    "الحلقة ${entry.episode}",
                                    color = Color.White,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp),
                                )
                            }
                            Surface(
                                color = Color.Black.copy(alpha = .78f),
                                shape = RoundedCornerShape(6.dp),
                                modifier = Modifier.align(Alignment.TopStart).padding(6.dp),
                            ) {
                                Text(
                                    "متبقي $remainingMinutes د",
                                    color = Color.White,
                                    fontSize = 8.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp),
                                )
                            }
                            Text(
                                text = entry.title,
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                modifier = Modifier.align(Alignment.BottomEnd).padding(8.dp),
                            )
                        }
                        Column(
                            modifier = Modifier.fillMaxWidth().padding(horizontal = 10.dp, vertical = 8.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp),
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                            ) {
                                Text(
                                    "استئناف المشاهدة الآن",
                                    color = MaterialTheme.colorScheme.onSurface,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                )
                                Text(
                                    "$progress%",
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                )
                            }
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(4.dp)
                                    .clip(RoundedCornerShape(999.dp))
                                    .background(Color.White.copy(alpha = .12f)),
                            ) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth(progress / 100f)
                                        .height(4.dp)
                                        .clip(RoundedCornerShape(999.dp))
                                        .background(Color(0xFF0EA5E9)),
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun LatestEpisodesScreen(
    repository: AnilistRepository,
    onOpenDetails: (Int) -> Unit,
    onOpenWatch: (Int, Int) -> Unit,
    onBack: () -> Unit,
) {
    var episodes by remember { mutableStateOf<List<LatestEpisodeCard>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        runCatching { repository.loadHome().latestEpisodes }
            .onSuccess { episodes = it }
            .onFailure { error = it.message ?: "تعذر تحميل أحدث الحلقات" }
        loading = false
    }

    CatalogScaffold(title = "أحدث الحلقات", onBack = onBack) {
        when {
            loading -> item { LoadingBlock() }
            error != null -> item { ErrorBlock(error!!) }
            episodes.isEmpty() -> item {
                Text(
                    "لا توجد حلقات مضافة حاليًا",
                    modifier = Modifier.fillMaxWidth().padding(24.dp),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            else -> items(
                items = episodes,
                key = { "${it.anilistId}-${it.episode}-${it.sourceSite}" },
            ) { episode ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 5.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        AsyncImage(
                            model = episode.coverUrl,
                            contentDescription = episode.title,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier
                                .width(82.dp)
                                .height(112.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .clickable { onOpenDetails(episode.anilistId) },
                        )
                        Column(
                            modifier = Modifier.weight(1f),
                            verticalArrangement = Arrangement.spacedBy(6.dp),
                        ) {
                            Text(
                                episode.arabicTitle ?: episode.title,
                                style = MaterialTheme.typography.titleMedium,
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis,
                            )
                            Text(
                                "الحلقة ${episode.episode} · ${episode.sourceSite}",
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                style = MaterialTheme.typography.bodySmall,
                            )
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Button(onClick = {
                                    onOpenWatch(episode.anilistId, episode.episode)
                                }) {
                                    Text("مشاهدة")
                                }
                                OutlinedButton(onClick = {
                                    onOpenDetails(episode.anilistId)
                                }) {
                                    Text("التفاصيل")
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

private data class AnimeSeasonPeriod(
    val code: String,
    val year: Int,
)

private val ANIME_SEASONS = listOf("WINTER", "SPRING", "SUMMER", "FALL")

private fun currentAnimeSeason(): AnimeSeasonPeriod {
    val calendar = java.util.Calendar.getInstance()
    val month = calendar.get(java.util.Calendar.MONTH)
    val code = when (month) {
        in 0..2 -> "WINTER"
        in 3..5 -> "SPRING"
        in 6..8 -> "SUMMER"
        else -> "FALL"
    }
    return AnimeSeasonPeriod(code, calendar.get(java.util.Calendar.YEAR))
}

private fun shiftAnimeSeason(period: AnimeSeasonPeriod, offset: Int): AnimeSeasonPeriod {
    val shiftedIndex = ANIME_SEASONS.indexOf(period.code) + offset
    val yearOffset = Math.floorDiv(shiftedIndex, ANIME_SEASONS.size)
    val seasonIndex = Math.floorMod(shiftedIndex, ANIME_SEASONS.size)
    return AnimeSeasonPeriod(ANIME_SEASONS[seasonIndex], period.year + yearOffset)
}

private fun String.toArabicSeason(): String = when (this) {
    "WINTER" -> "الشتاء"
    "SPRING" -> "الربيع"
    "SUMMER" -> "الصيف"
    "FALL" -> "الخريف"
    else -> this
}

@Composable
fun SeasonsScreen(
    repository: AnilistRepository,
    onOpenDetails: (Int) -> Unit,
    onBack: () -> Unit,
) {
    val current = remember { currentAnimeSeason() }
    val tabs = listOf("جميع المواسم", "الموسم القادم", "الموسم الحالي", "الموسم السابق")
    var selectedTab by remember { mutableStateOf("الموسم الحالي") }
    var selectedSeason by remember { mutableStateOf(current.code) }
    var searchQuery by remember { mutableStateOf("") }
    var results by remember { mutableStateOf<List<AnimeCard>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(selectedTab, selectedSeason, searchQuery) {
        delay(250L)
        loading = true
        error = null
        val period = when (selectedTab) {
            "الموسم القادم" -> shiftAnimeSeason(current, 1)
            "الموسم السابق" -> shiftAnimeSeason(current, -1)
            "جميع المواسم" -> AnimeSeasonPeriod(selectedSeason, current.year)
            else -> current
        }
        val filters = BrowseFilters(
            search = searchQuery.trim().takeIf { it.isNotEmpty() },
            sort = "POPULARITY_DESC",
            season = if (selectedTab == "جميع المواسم") selectedSeason else period.code,
            year = period.year,
        )
        runCatching { repository.browse(filters, 1) }
            .onSuccess { results = it }
            .onFailure { error = it.message ?: "تعذر تحميل قائمة المواسم" }
        loading = false
    }

    CatalogScaffold(title = "المواسم", onBack = onBack) {
        item {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                label = { Text("ابحث في المواسم") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
            )
        }
        item {
            LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                items(tabs) { tab ->
                    FilterChip(
                        selected = selectedTab == tab,
                        onClick = { selectedTab = tab },
                        label = { Text(tab) },
                    )
                }
            }
        }
        if (selectedTab == "جميع المواسم") {
            item {
                LazyRow(
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    items(ANIME_SEASONS) { season ->
                        FilterChip(
                            selected = selectedSeason == season,
                            onClick = { selectedSeason = season },
                            label = { Text("${season.toArabicSeason()} ${current.year}") },
                        )
                    }
                }
            }
        } else {
            val period = when (selectedTab) {
                "الموسم القادم" -> shiftAnimeSeason(current, 1)
                "الموسم السابق" -> shiftAnimeSeason(current, -1)
                else -> current
            }
            item {
                Text(
                    "${period.code.toArabicSeason()} ${period.year}",
                    color = MaterialTheme.colorScheme.primary,
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                )
            }
        }
        if (loading && results.isEmpty()) item { LoadingBlock() }
        error?.let { item { ErrorBlock(it) } }
        if (!loading && error == null && results.isEmpty()) {
            item {
                Text(
                    "لا توجد أعمال لهذا الموسم",
                    modifier = Modifier.fillMaxWidth().padding(24.dp),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        if (results.isNotEmpty()) item { NovaAnimeGrid(results, onOpenDetails) }
    }
}

@Composable
fun ComingSoonScreen(
    repository: AnilistRepository,
    onOpenDetails: (Int) -> Unit,
    onBack: () -> Unit,
) {
    var query by remember { mutableStateOf("") }
    var results by remember { mutableStateOf<List<AnimeCard>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var loadingMore by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var page by remember { mutableIntStateOf(1) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(query) {
        delay(250L)
        loading = true
        error = null
        page = 1
        runCatching {
            repository.browse(
                BrowseFilters(
                    search = query.trim().takeIf { it.isNotEmpty() },
                    sort = "POPULARITY_DESC",
                    status = "NOT_YET_RELEASED",
                ),
                1,
            )
        }.onSuccess { results = it }
            .onFailure { error = it.message ?: "تعذر تحميل الأعمال القادمة" }
        loading = false
    }

    CatalogScaffold(title = "قريبًا", onBack = onBack) {
        item {
            OutlinedTextField(
                value = query,
                onValueChange = { query = it },
                label = { Text("ابحث عن عمل قادم") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
            )
        }
        if (loading && results.isEmpty()) item { LoadingBlock() }
        error?.let { item { ErrorBlock(it) } }
        if (!loading && error == null && results.isEmpty()) {
            item {
                Text(
                    "لا توجد أعمال قادمة مطابقة",
                    modifier = Modifier.fillMaxWidth().padding(24.dp),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        if (results.isNotEmpty()) {
            item { NovaAnimeGrid(results, onOpenDetails) }
            if (results.size >= 30) {
                item {
                    Button(
                        enabled = !loadingMore,
                        onClick = {
                            scope.launch {
                                loadingMore = true
                                val nextPage = page + 1
                                runCatching {
                                    repository.browse(
                                        BrowseFilters(
                                            search = query.trim().takeIf { it.isNotEmpty() },
                                            sort = "POPULARITY_DESC",
                                            status = "NOT_YET_RELEASED",
                                        ),
                                        nextPage,
                                    )
                                }.onSuccess {
                                    results = (results + it).distinctBy(AnimeCard::id)
                                    page = nextPage
                                }.onFailure {
                                    error = it.message ?: "تعذر تحميل المزيد"
                                }
                                loadingMore = false
                            }
                        },
                        modifier = Modifier.fillMaxWidth().padding(16.dp),
                    ) {
                        Text(if (loadingMore) "جارٍ التحميل…" else "تحميل المزيد")
                    }
                }
            }
        }
    }
}

@Composable
fun TvLinkScreen(
    sessionViewModel: SessionViewModel,
    onBack: () -> Unit,
) {
    val state by sessionViewModel.state.collectAsState()
    var code by rememberSaveable { mutableStateOf("") }

    CatalogScaffold(title = "ربط التلفاز", onBack = onBack) {
        item {
            Column(
                modifier = Modifier.fillMaxWidth().padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Text(
                    "اربط شاشة Android TV بحسابك",
                    style = MaterialTheme.typography.titleLarge,
                )
                Text(
                    "أدخل رمز الربط المكوّن من 6 أرقام الظاهر على شاشة التلفاز.",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.bodyMedium,
                )
                if (state.user == null) {
                    Text(
                        "سجّل الدخول إلى حسابك أولًا، ثم أعد فتح صفحة ربط التلفاز.",
                        color = MaterialTheme.colorScheme.secondary,
                    )
                } else {
                    OutlinedTextField(
                        value = code,
                        onValueChange = { value ->
                            code = value.filter(Char::isDigit).take(6)
                        },
                        label = { Text("رمز الربط") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Button(
                        enabled = code.length == 6 && !state.authLoading,
                        onClick = { sessionViewModel.claimTvLinkCode(code) },
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(if (state.authLoading) "جارٍ الربط…" else "ربط التلفاز")
                    }
                }
                state.notice?.let { notice ->
                    Text(notice, color = MaterialTheme.colorScheme.secondary)
                }
                state.error?.let { error ->
                    Text(error, color = MaterialTheme.colorScheme.error)
                }
            }
        }
    }
}

@Composable
fun BrowseScreen(
    repository: AnilistRepository,
    onOpenDetails: (Int) -> Unit,
    onBack: () -> Unit,
) {
    var filters by remember { mutableStateOf(BrowseFilters()) }
    var results by remember { mutableStateOf<List<AnimeCard>>(emptyList()) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var page by remember { mutableIntStateOf(1) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(filters) {
        loading = true
        error = null
        page = 1
        runCatching { repository.browse(filters, 1) }
            .onSuccess { results = it }
            .onFailure { error = it.message ?: "تعذر تحميل النتائج" }
        loading = false
    }

    CatalogScaffold(title = "تصفح الأنمي", onBack = onBack) {
        item {
            FilterRail(
                filters = filters,
                onChange = { filters = it },
            )
        }
        if (loading && results.isEmpty()) item { LoadingBlock() }
        error?.let { item { ErrorBlock(it) } }
        if (results.isNotEmpty()) {
            item { NovaAnimeGrid(results, onOpenDetails) }
        }
        if (!loading && results.size >= 30) {
            item {
                Button(
                    onClick = {
                        scope.launch {
                            loading = true
                            val nextPage = page + 1
                            runCatching { repository.browse(filters, nextPage) }
                                .onSuccess {
                                    results = (results + it).distinctBy(AnimeCard::id)
                                    page = nextPage
                                }
                                .onFailure { error = it.message ?: "تعذر تحميل المزيد" }
                            loading = false
                        }
                    },
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                ) {
                    Text("تحميل المزيد")
                }
            }
        }
        if (loading && results.isNotEmpty()) item { LoadingBlock() }
    }
}

@Composable
fun SearchScreen(
    repository: AnilistRepository,
    onOpenDetails: (Int) -> Unit,
    onBack: () -> Unit,
) {
    var query by remember { mutableStateOf("") }
    var submittedQuery by remember { mutableStateOf<String?>(null) }
    var searchHistory by remember { mutableStateOf(listOf("One Piece", "Solo Leveling", "Jujutsu Kaisen", "Attack on Titan")) }
    var results by remember { mutableStateOf<List<AnimeCard>>(emptyList()) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(submittedQuery) {
        val search = submittedQuery?.trim().orEmpty()
        if (search.isEmpty()) {
            results = emptyList()
            return@LaunchedEffect
        }
        if (search !in searchHistory) {
            searchHistory = (listOf(search) + searchHistory).take(10)
        }
        loading = true
        error = null
        runCatching { repository.search(search) }
            .onSuccess { results = it }
            .onFailure { error = it.message ?: "تعذر تنفيذ البحث" }
        loading = false
    }

    CatalogScaffold(title = "بحث (عربي / إنجليزي / ياباني)", onBack = onBack) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                OutlinedTextField(
                    value = query,
                    onValueChange = { query = it },
                    label = { Text("ابحث عن أنمي بالعربية أو الإنجليزية") },
                    singleLine = true,
                    modifier = Modifier.weight(1f),
                )
                Spacer(Modifier.width(8.dp))
                Button(onClick = { submittedQuery = query }) {
                    Text("بحث")
                }
            }
        }
        if (searchHistory.isNotEmpty() && submittedQuery.isNullOrBlank()) {
            item {
                LazyRow(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    items(searchHistory) { item ->
                        AssistChip(
                            onClick = {
                                query = item
                                submittedQuery = item
                            },
                            label = { Text(item) },
                        )
                    }
                }
            }
        }
        if (loading) item { LoadingBlock() }
        error?.let { item { ErrorBlock(it) } }
        if (results.isNotEmpty()) {
            item { NovaAnimeGrid(results, onOpenDetails) }
        }
        if (!loading && submittedQuery != null && results.isEmpty() && error == null) {
            item { Text("لا توجد نتائج مطابقة", modifier = Modifier.fillMaxWidth().padding(32.dp)) }
        }
    }
}

@Composable
fun DetailsScreen(
    repository: AnilistRepository,
    id: Int,
    libraryStore: LibraryStore,
    onOpenDetails: (Int) -> Unit = {},
    onOpenEpisodes: (Int) -> Unit,
    onOpenComments: (Int) -> Unit = {},
    onBack: () -> Unit,
) {
    var details by remember(id) { mutableStateOf<AnimeDetails?>(null) }
    var comments by remember(id) { mutableStateOf<List<CommentDto>>(emptyList()) }
    var newCommentText by remember(id) { mutableStateOf("") }
    var showArabicSynopsis by remember(id) { mutableStateOf(true) }
    var error by remember(id) { mutableStateOf<String?>(null) }
    var favorite by remember(id) { mutableStateOf(libraryStore.isFavorite(id)) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(id) {
        runCatching { repository.details(id) }
            .onSuccess {
                details = it
                favorite = libraryStore.isFavorite(it.card.id)
                error = null
            }
            .onFailure { error = it.message ?: "تعذر تحميل التفاصيل" }
        runCatching { repository.loadComments(animeId = id) }
            .onSuccess { comments = it }
    }

    CatalogScaffold(title = details?.card?.title ?: "التفاصيل", onBack = onBack) {
        when {
            error != null -> item { ErrorBlock(error!!) }
            details == null -> item { LoadingBlock() }
            else -> {
                val item = details!!
                item {
                    Column(modifier = Modifier.padding(16.dp)) {
                        AsyncImage(
                            model = item.card.bannerUrl ?: item.card.coverUrl,
                            contentDescription = item.card.title,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(220.dp)
                                .clip(RoundedCornerShape(20.dp)),
                        )
                        Text(
                            text = item.card.title,
                            style = MaterialTheme.typography.headlineLarge,
                            modifier = Modifier.padding(top = 16.dp),
                        )
                        item.card.englishTitle?.takeIf { it != item.card.title }?.let {
                            Text(
                                text = it,
                                style = MaterialTheme.typography.titleMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                        Text(
                            text = buildList {
                                item.card.year?.let { add(it.toString()) }
                                item.card.format?.let(::add)
                                item.card.episodes?.let { add("$it حلقة") }
                                item.durationMinutes?.let { add("$it دقيقة") }
                                item.card.score?.let { add("★ %.1f".format(it / 10f)) }
                            }.joinToString("  •  "),
                            modifier = Modifier.padding(top = 8.dp),
                            color = MaterialTheme.colorScheme.secondary,
                        )
                        if (item.card.genres.isNotEmpty()) {
                            LazyRow(
                                modifier = Modifier.padding(top = 10.dp),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                            ) {
                                items(item.card.genres) { genre ->
                                    AssistChip(onClick = {}, label = { Text(genre) })
                                }
                            }
                        }

                        // Synopsis with Arabic translation toggle
                        val activeSynopsis = if (showArabicSynopsis && !item.arabicDescription.isNullOrBlank()) {
                            item.arabicDescription
                        } else {
                            item.description
                        }
                        if (activeSynopsis.isNotBlank()) {
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(top = 14.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Text("القصة", style = MaterialTheme.typography.titleLarge)
                                if (!item.arabicDescription.isNullOrBlank() && item.arabicDescription != item.description) {
                                    FilterChip(
                                        selected = showArabicSynopsis,
                                        onClick = { showArabicSynopsis = !showArabicSynopsis },
                                        label = { Text(if (showArabicSynopsis) "مترجمة للعربية" else "النص الأصلي") },
                                    )
                                }
                            }
                            Text(
                                text = activeSynopsis,
                                modifier = Modifier.padding(top = 8.dp),
                                style = MaterialTheme.typography.bodyLarge,
                            )
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth().padding(top = 18.dp),
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                        ) {
                            Button(
                                onClick = { onOpenEpisodes(item.card.id) },
                                modifier = Modifier.weight(1f),
                            ) {
                                Text("عرض الحلقات والمشاهدة")
                            }
                            OutlinedButton(
                                onClick = { favorite = libraryStore.toggleFavorite(item.card) },
                            ) {
                                Icon(
                                    if (favorite) Icons.Default.Favorite else Icons.Outlined.FavoriteBorder,
                                    contentDescription = "المفضلة",
                                    modifier = Modifier.size(18.dp),
                                )
                                Spacer(Modifier.width(6.dp))
                                Text(if (favorite) "في المفضلة" else "أضف للمفضلة")
                            }
                        }
                    }
                }

                // Related Seasons / Relations Rail
                if (item.relations.isNotEmpty()) {
                    item {
                        Text(
                            "المواسم والأعمال المرتبطة (${item.relations.size})",
                            style = MaterialTheme.typography.titleLarge,
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                        )
                        LazyRow(
                            contentPadding = PaddingValues(horizontal = 16.dp),
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                        ) {
                            items(item.relations, key = { it.id }) { rel ->
                                Card(
                                    modifier = Modifier
                                        .width(136.dp)
                                        .clickable { onOpenDetails(rel.id) },
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                ) {
                                    Column(modifier = Modifier.padding(8.dp)) {
                                        AsyncImage(
                                            model = rel.coverUrl,
                                            contentDescription = rel.title,
                                            contentScale = ContentScale.Crop,
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .height(160.dp)
                                                .clip(RoundedCornerShape(10.dp)),
                                        )
                                        Text(
                                            rel.relationType,
                                            fontSize = 10.sp,
                                            color = MaterialTheme.colorScheme.primary,
                                            modifier = Modifier.padding(top = 4.dp),
                                        )
                                        Text(
                                            rel.title,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis,
                                            style = MaterialTheme.typography.bodySmall,
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // Recommendations Rail
                if (item.recommendations.isNotEmpty()) {
                    item {
                        NovaSection("توصيات مشابهة", item.recommendations, onOpenDetails)
                    }
                }

                // Comments Section (/api/comments)
                item {
                    Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text("التعليقات (${comments.size})", style = MaterialTheme.typography.titleLarge)
                            TextButton(onClick = { onOpenComments(id) }) {
                                Text("عرض الكل")
                            }
                        }
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            OutlinedTextField(
                                value = newCommentText,
                                onValueChange = { newCommentText = it },
                                label = { Text("أضف تعليقًا حول هذا الأنمي") },
                                singleLine = true,
                                modifier = Modifier.weight(1f),
                            )
                            Button(
                                enabled = newCommentText.isNotBlank(),
                                onClick = {
                                    val textToPost = newCommentText.trim()
                                    newCommentText = ""
                                    scope.launch {
                                        val ok = repository.createComment(
                                            CreateCommentRequest(animeId = id, text = textToPost),
                                        )
                                        if (ok) {
                                            comments = runCatching { repository.loadComments(animeId = id) }
                                                .getOrDefault(comments)
                                        }
                                    }
                                },
                            ) {
                                Text("نشر")
                            }
                        }
                    }
                }

                items(comments, key = { it.id }) { comment ->
                    Card(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                            ) {
                                Text(comment.username, fontWeight = FontWeight.Bold)
                                Text("♥ ${comment.likes}", color = MaterialTheme.colorScheme.primary)
                            }
                            Text(comment.text, modifier = Modifier.padding(top = 4.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun CommentsScreen(
    repository: AnilistRepository,
    animeId: Int,
    onBack: () -> Unit,
) {
    var comments by remember(animeId) { mutableStateOf<List<CommentDto>>(emptyList()) }
    var message by rememberSaveable(animeId) { mutableStateOf("") }
    var loading by remember(animeId) { mutableStateOf(true) }
    var submitting by remember { mutableStateOf(false) }
    var error by remember(animeId) { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(animeId) {
        runCatching { repository.loadComments(animeId = animeId) }
            .onSuccess { comments = it }
            .onFailure { error = it.message ?: "تعذر تحميل التعليقات" }
        loading = false
    }

    CatalogScaffold(title = "التعليقات", onBack = onBack) {
        item {
            Column(
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Text("شارك رأيك حول هذا العمل", style = MaterialTheme.typography.titleMedium)
                OutlinedTextField(
                    value = message,
                    onValueChange = { message = it },
                    label = { Text("اكتب تعليقك") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3,
                    maxLines = 6,
                )
                Button(
                    enabled = message.isNotBlank() && !submitting,
                    onClick = {
                        val text = message.trim()
                        submitting = true
                        error = null
                        scope.launch {
                            val posted = runCatching {
                                repository.createComment(
                                    CreateCommentRequest(animeId = animeId, text = text),
                                )
                            }.getOrElse {
                                error = it.message ?: "تعذر نشر التعليق"
                                false
                            }
                            if (posted) {
                                message = ""
                                runCatching { repository.loadComments(animeId = animeId) }
                                    .onSuccess { comments = it }
                                    .onFailure { error = it.message ?: "تم النشر لكن تعذر تحديث القائمة" }
                            } else if (error == null) {
                                error = "تعذر نشر التعليق"
                            }
                            submitting = false
                        }
                    },
                ) {
                    Text(if (submitting) "جارٍ النشر…" else "نشر التعليق")
                }
            }
        }
        error?.let { item { ErrorBlock(it) } }
        if (loading) {
            item { LoadingBlock() }
        } else if (comments.isEmpty()) {
            item {
                Text(
                    "لا توجد تعليقات بعد",
                    modifier = Modifier.fillMaxWidth().padding(24.dp),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        } else {
            items(comments, key = { it.id }) { comment ->
                Card(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 5.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                ) {
                    Column(
                        modifier = Modifier.padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            Text(comment.username, fontWeight = FontWeight.Bold)
                            Text("♥ ${comment.likes}", color = MaterialTheme.colorScheme.primary)
                        }
                        Text(comment.text)
                    }
                }
            }
        }
    }
}

@Composable
fun EpisodesScreen(
    repository: AnilistRepository,
    id: Int,
    onOpenWatch: (Int, Int) -> Unit,
    onBack: () -> Unit,
) {
    var details by remember(id) { mutableStateOf<AnimeDetails?>(null) }
    var episodes by remember(id) { mutableStateOf<List<EpisodeItem>>(emptyList()) }
    var searchFilter by remember(id) { mutableStateOf("") }
    var error by remember(id) { mutableStateOf<String?>(null) }

    LaunchedEffect(id) {
        runCatching {
            val loadedDetails = repository.details(id)
            details = loadedDetails
            episodes = repository.episodes(loadedDetails)
            error = null
        }.onFailure {
            error = it.message ?: "تعذر تحميل الحلقات"
        }
    }

    val filteredEpisodes = remember(episodes, searchFilter) {
        val q = searchFilter.trim()
        if (q.isEmpty()) episodes
        else episodes.filter {
            it.number.toString().contains(q) ||
                it.title?.contains(q, ignoreCase = true) == true ||
                it.arabicTitle?.contains(q, ignoreCase = true) == true
        }
    }

    CatalogScaffold(title = details?.card?.title ?: "الحلقات", onBack = onBack) {
        when {
            error != null -> item { ErrorBlock(error!!) }
            episodes.isEmpty() -> item { LoadingBlock() }
            else -> {
                item {
                    OutlinedTextField(
                        value = searchFilter,
                        onValueChange = { searchFilter = it },
                        label = { Text("ابحث برقم الحلقة أو عنوانها (${episodes.size} حلقة)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                    )
                }
                items(filteredEpisodes, key = { it.number }) { episode ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 6.dp)
                            .clickable { onOpenWatch(id, episode.number) },
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("الحلقة ${episode.number}", style = MaterialTheme.typography.titleMedium)
                                (episode.arabicTitle ?: episode.title)?.let {
                                    Text(it, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                            if (episode.filler) {
                                Surface(
                                    color = Color(0x33F59E0B),
                                    shape = RoundedCornerShape(6.dp),
                                ) {
                                    Text(
                                        "فلر",
                                        color = Color(0xFFFBBF24),
                                        fontSize = 11.sp,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun DubbedHubScreen(
    repository: AnilistRepository,
    playbackRepository: PlaybackRepository,
    onBack: () -> Unit,
) {
    var selectedTab by remember { mutableIntStateOf(0) }
    var seriesList by remember { mutableStateOf<List<DubbedSeriesCard>>(emptyList()) }
    var selectedSeries by remember { mutableStateOf<DubbedSeriesCard?>(null) }
    var episodes by remember { mutableStateOf<List<DubbedEpisodeItem>>(emptyList()) }
    var activeEpisode by remember { mutableStateOf<DubbedEpisodeItem?>(null) }
    var dubbedSources by remember { mutableStateOf<List<PlaybackSource>>(emptyList()) }
    var selectedSourceIndex by remember { mutableIntStateOf(0) }
    var loading by remember { mutableStateOf(true) }
    val layout = rememberNovaLayout()
    val scope = rememberCoroutineScope()
    val playerServices = remember(playbackRepository.apiClient) {
        NovaPlayerServicesAdapter(playbackRepository.apiClient)
    }

    LaunchedEffect(selectedTab) {
        selectedSeries = null
        activeEpisode = null
        dubbedSources = emptyList()
        loading = true
        seriesList = runCatching {
            when (selectedTab) {
                0 -> repository.loadDubbedCatalog(WatchContentKind.AW_DUBBED)
                1 -> repository.loadDubbedCatalog(WatchContentKind.DUBBED, carateenProvider = "spacetoon")
                else -> repository.loadDubbedCatalog(WatchContentKind.DUBBED, carateenProvider = "arabictoons")
            }
        }.getOrDefault(emptyList())
        loading = false
    }

    fun playDubbedEpisode(series: DubbedSeriesCard, ep: DubbedEpisodeItem) {
        activeEpisode = ep
        selectedSourceIndex = 0
        scope.launch {
            dubbedSources = runCatching { playbackRepository.loadDubbedSources(series, ep) }
                .getOrDefault(emptyList())
        }
    }

    CatalogScaffold(title = selectedSeries?.title ?: "المدبلج وسبيستون والكرتون", onBack = {
        when {
            activeEpisode != null -> {
                activeEpisode = null
                dubbedSources = emptyList()
            }
            selectedSeries != null -> selectedSeries = null
            else -> onBack()
        }
    }) {
        if (selectedSeries == null) {
            item {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    listOf("أنمي مدبلج (AW)", "سبيستون وCarateen", "كرتون عربي").forEachIndexed { idx, label ->
                        FilterChip(
                            selected = selectedTab == idx,
                            onClick = { selectedTab = idx },
                            label = { Text(label) },
                        )
                    }
                }
            }
            if (loading) {
                item { LoadingBlock() }
            } else {
                items(seriesList, key = { "${it.provider}-${it.key}" }) { item ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 6.dp)
                            .clickable {
                                selectedSeries = item
                                activeEpisode = null
                                dubbedSources = emptyList()
                                scope.launch {
                                    episodes = runCatching { repository.loadDubbedEpisodes(item) }
                                        .getOrDefault(emptyList())
                                }
                            },
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            AsyncImage(
                                model = item.posterUrl,
                                contentDescription = item.title,
                                modifier = Modifier.width(64.dp).height(90.dp).clip(RoundedCornerShape(10.dp)),
                                contentScale = ContentScale.Crop,
                            )
                            Spacer(Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(item.arabicTitle ?: item.title, style = MaterialTheme.typography.titleMedium)
                                Text("المزود: ${item.provider} · ${item.seasonLabel}")
                            }
                        }
                    }
                }
            }
        } else {
            val currentSeries = selectedSeries!!
            val currentEp = activeEpisode
            if (currentEp != null && dubbedSources.isNotEmpty()) {
                val epIdx = episodes.indexOfFirst { it.number == currentEp.number }
                val hasPrev = epIdx > 0
                val hasNext = epIdx >= 0 && epIdx < episodes.lastIndex
                val activeSrc = dubbedSources.getOrNull(selectedSourceIndex)
                item {
                    RiftPlayer(
                        sources = dubbedSources,
                        selectedSourceIndex = selectedSourceIndex,
                        metadata = PlayerMetadata(
                            title = currentSeries.arabicTitle ?: currentSeries.title,
                            episodeNumber = currentEp.number,
                            episodeTitle = currentEp.title,
                            quality = activeSrc?.quality,
                            sourceName = activeSrc?.name ?: activeSrc?.site,
                        ),
                        playerServices = playerServices,
                        isTv = layout.isTv,
                        hasPrevEpisode = hasPrev,
                        hasNextEpisode = hasNext,
                        onPrevEpisode = { if (hasPrev) playDubbedEpisode(currentSeries, episodes[epIdx - 1]) },
                        onNextEpisode = { if (hasNext) playDubbedEpisode(currentSeries, episodes[epIdx + 1]) },
                        onActiveSourceChanged = { idx, _ -> selectedSourceIndex = idx },
                        onClose = {
                            activeEpisode = null
                            dubbedSources = emptyList()
                        },
                    )
                }
            }
            items(episodes, key = { it.number }) { ep ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 6.dp)
                        .clickable { playDubbedEpisode(currentSeries, ep) },
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(ep.title, style = MaterialTheme.typography.titleMedium)
                        Text("تشغيل الحلقة ${ep.number}", color = MaterialTheme.colorScheme.primary)
                    }
                }
            }
        }
    }
}

@Composable
fun AnimationsCatalogScreen(
    repository: AnilistRepository,
    onBack: () -> Unit,
) {
    var mediaType by remember { mutableStateOf("tv") }
    var items by remember { mutableStateOf<List<AnimationCard>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }

    LaunchedEffect(mediaType) {
        loading = true
        items = runCatching { repository.loadAnimationCatalog(type = mediaType) }.getOrDefault(emptyList())
        loading = false
    }

    CatalogScaffold(title = "قسم الأنيميشن والأفلام الكرتونية", onBack = onBack) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                FilterChip(selected = mediaType == "tv", onClick = { mediaType = "tv" }, label = { Text("مسلسلات أنيميشن") })
                FilterChip(selected = mediaType == "movie", onClick = { mediaType = "movie" }, label = { Text("أفلام أنيميشن") })
            }
        }
        if (loading) {
            item { LoadingBlock() }
        } else {
            items(items, key = { "${it.mediaType}-${it.id}" }) { card ->
                Card(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                ) {
                    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        AsyncImage(
                            model = card.posterUrl,
                            contentDescription = card.title,
                            modifier = Modifier.width(64.dp).height(92.dp).clip(RoundedCornerShape(10.dp)),
                            contentScale = ContentScale.Crop,
                        )
                        Spacer(Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(card.title, style = MaterialTheme.typography.titleMedium)
                            Text(listOfNotNull(card.year?.toString(), card.rating?.let { "★ %.1f".format(it) }).joinToString(" • "))
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun StardimaCatalogScreen(
    repository: AnilistRepository,
    onBack: () -> Unit,
) {
    var titles by remember { mutableStateOf<List<StardimaTitleCard>>(emptyList()) }
    var selectedTitle by remember { mutableStateOf<StardimaTitleCard?>(null) }
    var episodes by remember { mutableStateOf<List<StardimaEpisodeEntry>>(emptyList()) }
    var selectedEpisode by remember { mutableStateOf<StardimaEpisodeEntry?>(null) }
    var servers by remember { mutableStateOf<List<StardimaServerEntry>>(emptyList()) }
    var selectedServerIndex by remember { mutableIntStateOf(0) }
    var loading by remember { mutableStateOf(true) }
    val layout = rememberNovaLayout()
    val scope = rememberCoroutineScope()

    val stardimaSources: List<PlaybackSource> = remember(servers) {
        servers.mapIndexed { idx, srv ->
            val isHls = srv.watchUrl.contains(".m3u8", ignoreCase = true) || srv.watchUrl.contains("/hls", ignoreCase = true)
            PlaybackSource(
                key = "stardima|$idx|${srv.watchUrl}",
                site = srv.name,
                name = srv.name,
                quality = srv.quality ?: "HD",
                qualityRank = 10 - idx,
                url = srv.watchUrl,
                type = if (isHls) PlaybackType.HLS else PlaybackType.MP4,
            )
        }
    }

    LaunchedEffect(Unit) {
        loading = true
        titles = runCatching { repository.loadStardimaCatalog() }.getOrDefault(emptyList())
        loading = false
    }

    CatalogScaffold(title = selectedTitle?.titleAr ?: selectedTitle?.title ?: "كتالوج ستارديما (StarDima)", onBack = {
        if (selectedTitle != null) {
            selectedTitle = null
            selectedEpisode = null
            episodes = emptyList()
            servers = emptyList()
        } else {
            onBack()
        }
    }) {
        if (selectedTitle == null) {
            if (loading) {
                item { LoadingBlock() }
            } else {
                items(titles, key = { it.providerTitleId }) { item ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 6.dp)
                            .clickable {
                                selectedTitle = item
                                selectedEpisode = null
                                servers = emptyList()
                                scope.launch {
                                    episodes = runCatching { repository.loadStardimaEpisodes(item.providerTitleId) }
                                        .getOrDefault(emptyList())
                                }
                            },
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    ) {
                        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            AsyncImage(
                                model = item.posterUrl,
                                contentDescription = item.title,
                                modifier = Modifier.width(64.dp).height(92.dp).clip(RoundedCornerShape(10.dp)),
                                contentScale = ContentScale.Crop,
                            )
                            Spacer(Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(item.titleAr ?: item.title, style = MaterialTheme.typography.titleMedium)
                                Text(item.localizationLabels.joinToString(" · ").ifBlank { item.mediaType })
                            }
                        }
                    }
                }
            }
        } else {
            if (stardimaSources.isNotEmpty()) {
                val activeSrc = stardimaSources.getOrNull(selectedServerIndex)
                item {
                    RiftPlayer(
                        sources = stardimaSources,
                        selectedSourceIndex = selectedServerIndex,
                        metadata = PlayerMetadata(
                            title = selectedTitle?.titleAr ?: selectedTitle?.title ?: "StarDima",
                            episodeTitle = selectedEpisode?.title,
                            quality = activeSrc?.quality,
                            sourceName = activeSrc?.name,
                        ),
                        isTv = layout.isTv,
                        onActiveSourceChanged = { idx, _ -> selectedServerIndex = idx },
                        onClose = { servers = emptyList() },
                    )
                }
            }
            items(episodes, key = { it.episodeId }) { ep ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 6.dp)
                        .clickable {
                            selectedEpisode = ep
                            selectedServerIndex = 0
                            scope.launch {
                                servers = runCatching { repository.loadStardimaServers(ep.episodeId) }
                                    .getOrDefault(emptyList())
                            }
                        },
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(ep.title, style = MaterialTheme.typography.titleMedium)
                        Text("تشغيل عبر المشغّل", color = MaterialTheme.colorScheme.primary)
                    }
                }
            }
            if (servers.isNotEmpty()) {
                item {
                    Text(
                        "سيرفرات الحلقة المتاحة (${servers.size})",
                        style = MaterialTheme.typography.titleLarge,
                        modifier = Modifier.padding(16.dp),
                    )
                }
                items(servers, key = { it.watchUrl }) { srv ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 4.dp)
                            .clickable {
                                val idx = servers.indexOfFirst { it.watchUrl == srv.watchUrl }
                                if (idx >= 0) selectedServerIndex = idx
                            },
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    ) {
                        Row(modifier = Modifier.padding(12.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(srv.name, fontWeight = FontWeight.Bold)
                            Text(srv.quality ?: "HD", color = MaterialTheme.colorScheme.secondary)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ScheduleScreen(
    repository: AnilistRepository,
    onOpenDetails: (Int) -> Unit,
    onBack: () -> Unit,
) {
    var items by remember { mutableStateOf<List<AiringScheduleItem>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        val nowSec = System.currentTimeMillis() / 1000L
        items = runCatching { repository.loadSchedule(nowSec - 86_400L, nowSec + 6 * 86_400L) }
            .getOrDefault(emptyList())
        loading = false
    }

    CatalogScaffold(title = "جدول البث الأسبوعي", onBack = onBack) {
        if (loading) {
            item { LoadingBlock() }
        } else {
            items(items, key = { it.id }) { sched ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 6.dp)
                        .clickable { onOpenDetails(sched.anime.id) },
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                ) {
                    Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        AsyncImage(
                            model = sched.anime.coverUrl,
                            contentDescription = sched.anime.title,
                            modifier = Modifier.width(60.dp).height(84.dp).clip(RoundedCornerShape(10.dp)),
                            contentScale = ContentScale.Crop,
                        )
                        Spacer(Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(sched.anime.title, style = MaterialTheme.typography.titleMedium)
                            Text(
                                "الحلقة ${sched.episode}",
                                color = MaterialTheme.colorScheme.primary,
                                fontWeight = FontWeight.Bold,
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun NewsScreen(
    repository: AnilistRepository,
    onBack: () -> Unit,
) {
    var articles by remember { mutableStateOf<List<NewsArticleDto>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        articles = runCatching { repository.loadNews(1) }.getOrDefault(emptyList())
        loading = false
    }

    CatalogScaffold(title = "أخبار الأنمي", onBack = onBack) {
        if (loading) {
            item { LoadingBlock() }
        } else {
            items(articles, key = { it.id }) { article ->
                Card(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        article.thumbnail?.let { thumb ->
                            AsyncImage(
                                model = thumb,
                                contentDescription = article.title,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(160.dp)
                                    .clip(RoundedCornerShape(12.dp)),
                            )
                            Spacer(Modifier.height(10.dp))
                        }
                        Text(article.category, color = MaterialTheme.colorScheme.primary, fontSize = 11.sp)
                        Text(article.title, style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(top = 4.dp))
                        if (article.description.isNotBlank()) {
                            Text(
                                article.description,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(top = 6.dp),
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun CatalogScaffold(
    title: String,
    onBack: () -> Unit,
    content: LazyListScope.() -> Unit,
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = 24.dp),
    ) {
        item {
            NovaHeader(title = title, onBack = onBack)
        }
        content()
    }
}

@Composable
private fun FilterRail(
    filters: BrowseFilters,
    onChange: (BrowseFilters) -> Unit,
) {
    val sorts = listOf(
        "POPULARITY_DESC" to "الأكثر شعبية",
        "TRENDING_DESC" to "الرائج",
        "SCORE_DESC" to "الأعلى تقييمًا",
        "START_DATE_DESC" to "الأحدث",
    )
    val formats = listOf(
        null to "الكل",
        "TV" to "مسلسل",
        "MOVIE" to "فيلم",
        "OVA" to "OVA",
        "ONA" to "ONA",
    )
    Column {
        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            items(sorts) { (value, label) ->
                FilterChip(
                    selected = filters.sort == value,
                    onClick = { onChange(filters.copy(sort = value)) },
                    label = { Text(label) },
                )
            }
        }
        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            items(formats) { (value, label) ->
                FilterChip(
                    selected = filters.format == value,
                    onClick = { onChange(filters.copy(format = value)) },
                    label = { Text(label) },
                )
            }
        }
    }
}

@Composable
fun LoadingBlock() {
    Box(
        modifier = Modifier.fillMaxWidth().padding(36.dp),
        contentAlignment = Alignment.Center,
    ) {
        CircularProgressIndicator()
    }
}

@Composable
fun ErrorBlock(message: String) {
    Text(
        text = message,
        color = MaterialTheme.colorScheme.error,
        modifier = Modifier.fillMaxWidth().padding(24.dp),
    )
}
