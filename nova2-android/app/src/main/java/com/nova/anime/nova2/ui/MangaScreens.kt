package com.nova.anime.nova2.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.focusable
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.nova.anime.nova2.core.catalog.AnilistRepository
import com.nova.anime.nova2.core.catalog.MangaCard
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

private enum class MangaFilter(
    val label: String,
    val apiStatus: String? = null,
    val countryOfOrigin: String? = null,
) {
    ALL("جميع المانجا"),
    ONGOING("مستمرة", apiStatus = "RELEASING"),
    COMPLETED("مكتملة", apiStatus = "FINISHED"),
    MANHWA("مانهوا ملونة", countryOfOrigin = "KR"),
}

@Composable
fun MangaCatalogScreen(
    repository: AnilistRepository,
    onBack: () -> Unit,
) {
    var searchQuery by rememberSaveable { mutableStateOf("") }
    var selectedFilterName by rememberSaveable { mutableStateOf(MangaFilter.ALL.name) }
    var mangaItems by remember { mutableStateOf<List<MangaCard>>(emptyList()) }
    var selectedManga by remember { mutableStateOf<MangaCard?>(null) }
    var readingChapter by rememberSaveable { mutableStateOf<Int?>(null) }
    var loading by remember { mutableStateOf(false) }
    var loadingMore by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var page by remember { mutableStateOf(1) }
    var hasMore by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val filter = MangaFilter.entries.firstOrNull { it.name == selectedFilterName } ?: MangaFilter.ALL

    LaunchedEffect(searchQuery, filter) {
        delay(300L)
        loading = true
        errorMessage = null
        page = 1
        try {
            val response = repository.loadManga(
                page = 1,
                search = searchQuery,
                status = filter.apiStatus,
                countryOfOrigin = filter.countryOfOrigin,
            )
            mangaItems = response.forFilter(filter)
            hasMore = response.size >= MANGA_PAGE_SIZE
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (failure: Exception) {
            mangaItems = emptyList()
            hasMore = false
            errorMessage = failure.message ?: "تعذر تحميل قائمة المانجا"
        } finally {
            loading = false
        }
    }

    val activeManga = selectedManga
    val activeChapter = readingChapter
    if (activeManga != null && activeChapter != null) {
        MangaChapterReader(
            manga = activeManga,
            initialChapter = activeChapter,
            onBack = { readingChapter = null },
            onSelectChapter = { readingChapter = it },
        )
    } else {
        CatalogScaffold(title = "المانجا", onBack = onBack) {
            item {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    label = { Text("ابحث في المانجا والمانهوا") },
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                )
            }
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Spacer(Modifier.width(8.dp))
                    MangaFilter.entries.forEach { option ->
                        FilterChip(
                            selected = option == filter,
                            onClick = { selectedFilterName = option.name },
                            label = { Text(option.label) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = MANGA_ACCENT,
                                selectedLabelColor = Color(0xFF111827),
                            ),
                        )
                    }
                    Spacer(Modifier.width(8.dp))
                }
            }
            if (loading && mangaItems.isEmpty()) {
                item { MangaLoadingState() }
            }
            errorMessage?.let { message ->
                item { MangaErrorState(message) }
            }
            if (!loading && errorMessage == null && mangaItems.isEmpty()) {
                item {
                    Text(
                        text = "لا توجد نتائج مطابقة",
                        modifier = Modifier.fillMaxWidth().padding(24.dp),
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            if (mangaItems.isNotEmpty()) {
                item {
                    MangaPosterGrid(
                        items = mangaItems,
                        onOpen = { selectedManga = it },
                    )
                }
            }
            if (hasMore) {
                item {
                    OutlinedButton(
                        enabled = !loading && !loadingMore,
                        onClick = {
                            scope.launch {
                                loadingMore = true
                                errorMessage = null
                                try {
                                    val nextPage = page + 1
                                    val response = repository.loadManga(
                                        page = nextPage,
                                        search = searchQuery,
                                        status = filter.apiStatus,
                                        countryOfOrigin = filter.countryOfOrigin,
                                    )
                                    mangaItems = (mangaItems + response.forFilter(filter)).distinctBy { it.id }
                                    page = nextPage
                                    hasMore = response.size >= MANGA_PAGE_SIZE
                                } catch (cancelled: CancellationException) {
                                    throw cancelled
                                } catch (failure: Exception) {
                                    errorMessage = failure.message ?: "تعذر تحميل المزيد من المانجا"
                                } finally {
                                    loadingMore = false
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth().padding(12.dp),
                    ) {
                        Text(if (loadingMore) "جارٍ التحميل…" else "عرض المزيد")
                    }
                }
            }
        }

        selectedManga?.let { item ->
            MangaDetailsDialog(
                manga = item,
                onDismiss = { selectedManga = null },
                onReadChapter = { readingChapter = it },
            )
        }
    }
}

private const val MANGA_PAGE_SIZE = 30
private val MANGA_ACCENT = Color(0xFFF59E0B)

private fun List<MangaCard>.forFilter(filter: MangaFilter): List<MangaCard> =
    if (filter.countryOfOrigin != null) {
        this.filter { it.countryOfOrigin.equals(filter.countryOfOrigin, ignoreCase = true) }
    } else {
        this
    }

@Composable
private fun MangaPosterGrid(
    items: List<MangaCard>,
    onOpen: (MangaCard) -> Unit,
) {
    val layout = rememberNovaLayout()
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = layout.horizontalPadding, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(if (layout.isTv) 24.dp else 18.dp),
    ) {
        items.chunked(layout.columns).forEach { rowItems ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(if (layout.isTv) 16.dp else 10.dp),
            ) {
                rowItems.forEach { item ->
                    MangaPosterCard(
                        manga = item,
                        width = layout.cardWidth,
                        isTv = layout.isTv,
                        onClick = { onOpen(item) },
                    )
                }
                repeat((layout.columns - rowItems.size).coerceAtLeast(0)) {
                    Spacer(Modifier.width(layout.cardWidth))
                }
            }
        }
    }
}

@Composable
private fun MangaPosterCard(
    manga: MangaCard,
    width: Dp,
    isTv: Boolean,
    onClick: () -> Unit,
) {
    var focused by remember { mutableStateOf(false) }
    Column(
        modifier = Modifier
            .width(width)
            .onFocusChanged { focused = it.isFocused }
            .focusable()
            .clickable(onClick = onClick)
            .then(
                if (focused && isTv) Modifier.shadow(12.dp, RoundedCornerShape(12.dp))
                else Modifier,
            ),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(width * 1.475f)
                .clip(RoundedCornerShape(12.dp))
                .background(MaterialTheme.colorScheme.surfaceVariant),
        ) {
            manga.coverUrl?.let { cover ->
                AsyncImage(
                    model = cover,
                    contentDescription = manga.title,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize(),
                )
            }
            Box(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .height(width * .60f)
                    .background(
                        Brush.verticalGradient(
                            listOf(Color.Transparent, Color.Black.copy(alpha = .88f)),
                        ),
                    ),
            )
            MangaBadge(
                text = manga.status.toArabicStatus(),
                background = if (manga.status == "RELEASING") Color(0xE610B981) else Color(0xE6F59E0B),
                modifier = Modifier.align(Alignment.TopEnd).padding(6.dp),
            )
            manga.chapters?.let { chapters ->
                MangaBadge(
                    text = "$chapters فصل",
                    background = Color(0xD9000000),
                    modifier = Modifier.align(Alignment.BottomEnd).padding(6.dp),
                )
            }
            if (focused && isTv) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .border(BorderStroke(3.dp, Color(0xFFFBBF24)), RoundedCornerShape(12.dp)),
                )
            }
        }
        Text(
            text = manga.englishTitle ?: manga.title,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onBackground,
            fontWeight = FontWeight.Bold,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
        )
        manga.score?.let { score ->
            Text(
                text = "★ %.1f".format(score / 10f),
                style = MaterialTheme.typography.labelSmall,
                color = MANGA_ACCENT,
                fontWeight = FontWeight.Bold,
            )
        }
    }
}

@Composable
private fun MangaBadge(
    text: String,
    background: Color,
    modifier: Modifier = Modifier,
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(999.dp),
        colors = CardDefaults.cardColors(containerColor = background),
    ) {
        Text(
            text = text,
            color = Color.White,
            fontSize = 9.sp,
            fontWeight = FontWeight.ExtraBold,
            modifier = Modifier.padding(horizontal = 7.dp, vertical = 3.dp),
        )
    }
}

@Composable
private fun MangaLoadingState() {
    Column(
        modifier = Modifier.fillMaxWidth().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        CircularProgressIndicator(color = MANGA_ACCENT)
        Text("جارٍ تحميل المانجا من AniList")
    }
}

@Composable
private fun MangaErrorState(message: String) {
    Text(
        text = "تعذر تحميل المانجا: $message",
        modifier = Modifier.fillMaxWidth().padding(20.dp),
        color = MaterialTheme.colorScheme.error,
    )
}

@Composable
private fun MangaDetailsDialog(
    manga: MangaCard,
    onDismiss: () -> Unit,
    onReadChapter: (Int) -> Unit,
) {
    val maxChapter = manga.referenceChapterCount()
    var chapterNumber by rememberSaveable(manga.id) { mutableStateOf("1") }
    val validChapter = chapterNumber.toIntOrNull()?.takeIf { it in 1..maxChapter }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(manga.englishTitle ?: manga.title) },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                manga.coverUrl?.let { cover ->
                    AsyncImage(
                        model = cover,
                        contentDescription = manga.title,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(220.dp)
                            .clip(RoundedCornerShape(12.dp)),
                    )
                }
                Text(
                    text = buildString {
                        append(manga.status.toArabicStatus())
                        manga.chapters?.let { append(" · $it فصل") }
                        manga.volumes?.let { append(" · $it مجلد") }
                        manga.year?.let { append(" · $it") }
                    },
                    color = MANGA_ACCENT,
                    fontWeight = FontWeight.Bold,
                )
                if (manga.genres.isNotEmpty()) {
                    Text(
                        manga.genres.joinToString(" · "),
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Text(
                    manga.description.ifBlank { "لا يتوفر ملخص لهذا العمل." },
                    color = MaterialTheme.colorScheme.onSurface,
                )
                Text(
                    "اختر رقم الفصل لفتحه في القارئ",
                    color = MaterialTheme.colorScheme.onSurface,
                    fontWeight = FontWeight.Bold,
                )
                OutlinedTextField(
                    value = chapterNumber,
                    onValueChange = { chapterNumber = it.filter(Char::isDigit) },
                    label = { Text("الفصل 1 إلى $maxChapter") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                Text(
                    "تظهر في القارئ معاينة الصور الموجودة في النسخة المرجعية؛ صور صفحات الفصول نفسها غير متاحة من خادم المشروع.",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.labelSmall,
                )
            }
        },
        confirmButton = {
            TextButton(
                enabled = validChapter != null,
                onClick = { validChapter?.let(onReadChapter) },
            ) {
                Text("قراءة الفصل")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("إغلاق") }
        },
    )
}

private fun String?.toArabicStatus(): String = when (this) {
    "RELEASING" -> "مستمرة"
    "FINISHED" -> "مكتملة"
    "NOT_YET_RELEASED" -> "قريبًا"
    "CANCELLED" -> "متوقفة"
    "HIATUS" -> "متوقفة مؤقتًا"
    else -> "مانجا"
}
