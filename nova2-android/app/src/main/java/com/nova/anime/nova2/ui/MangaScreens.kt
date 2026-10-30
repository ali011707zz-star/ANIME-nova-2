package com.nova.anime.nova2.ui

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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.nova.anime.nova2.core.catalog.AnilistRepository

data class MangaChapterEntry(
    val number: Int,
    val titleAr: String,
    val pagesCount: Int = 14,
)

data class MangaSeriesEntry(
    val id: String,
    val titleAr: String,
    val titleEn: String,
    val coverUrl: String,
    val score: Double,
    val statusAr: String,
    val synopsisAr: String,
    val chapters: List<MangaChapterEntry>,
)

private val DEFAULT_MANGA_CATALOG: List<MangaSeriesEntry> = listOf(
    MangaSeriesEntry(
        id = "solo-leveling-manga",
        titleAr = "سولو ليفلينغ (الارتقاء المنفرد)",
        titleEn = "Solo Leveling",
        coverUrl = "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-m1gX3iwfIsLu.png",
        score = 9.4,
        statusAr = "مكتملة · مانهوا ملونة",
        synopsisAr = "بعد دخول البوابة المزدوجة الغامضة، يستيقظ الصياد الضعيف سونغ جين وو بقدرة فريدة تتيح له الارتقاء بلا حدود.",
        chapters = (1..12).map { ch ->
            MangaChapterEntry(
                number = ch,
                titleAr = when (ch) {
                    1 -> "الفصل 1: الصياد الأضعف في العالم"
                    2 -> "الفصل 2: البوابة المزدوجة والتمثال العظيم"
                    3 -> "الفصل 3: شروط التضحية والنجاة"
                    4 -> "الفصل 4: استيقاظ النظام السري"
                    else -> "الفصل $ch: مواجهة زعماء البوابات"
                },
            )
        },
    ),
    MangaSeriesEntry(
        id = "one-piece-manga",
        titleAr = "ون بيس (مانجا أودا الرسمية)",
        titleEn = "One Piece",
        coverUrl = "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-YCDoj1EkAxFn.jpg",
        score = 9.5,
        statusAr = "مستمرة · شونين",
        synopsisAr = "رحلة مونكي دي لوفي وطاقم قبعة القش عبر الغراند لاين للوصول إلى كنز الون بيس الأسطوري.",
        chapters = (1..12).map { ch ->
            MangaChapterEntry(
                number = ch,
                titleAr = "الفصل $ch: مغامرة فجر الرومانسية والبحر الجديد",
            )
        },
    ),
    MangaSeriesEntry(
        id = "jjk-manga",
        titleAr = "جوجوتسو كايسن (معركة السحرة)",
        titleEn = "Jujutsu Kaisen",
        coverUrl = "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-bbBWj4pEFseh.jpg",
        score = 9.1,
        statusAr = "مكتملة · أكشن خارق",
        synopsisAr = "إيتادوري يوجي يبتلع إصبع ريومن سوكونا الملعون ليدخل عالم مستعملي الجوجوتسو.",
        chapters = (1..10).map { ch ->
            MangaChapterEntry(
                number = ch,
                titleAr = "الفصل $ch: ريومن سوكونا والمجال الملعون",
            )
        },
    ),
)

@Composable
fun MangaCatalogScreen(
    repository: AnilistRepository? = null,
    onBack: () -> Unit,
) {
    var selectedSeries by remember { mutableStateOf<MangaSeriesEntry?>(null) }
    var activeChapterNumber by rememberSaveable { mutableIntStateOf(0) }
    var searchQuery by rememberSaveable { mutableStateOf("") }
    var detailDropdownExpanded by remember { mutableStateOf(false) }
    var readerDropdownExpanded by remember { mutableStateOf(false) }
    var dropdownSearch by rememberSaveable { mutableStateOf("") }
    var remoteManga by remember { mutableStateOf<List<MangaSeriesEntry>>(emptyList()) }

    LaunchedEffect(repository, searchQuery) {
        val repo = repository ?: return@LaunchedEffect
        val loaded = runCatching {
            repo.loadManga(search = searchQuery.trim().takeIf { it.isNotEmpty() })
        }.getOrDefault(emptyList())
        remoteManga = loaded.map { card ->
            val totalCh = (card.chapters ?: 12).coerceIn(6, 24)
            MangaSeriesEntry(
                id = "anilist-manga-${card.id}",
                titleAr = card.englishTitle ?: card.title,
                titleEn = card.title,
                coverUrl = card.coverUrl.orEmpty(),
                score = ((card.score ?: 85) / 10.0),
                statusAr = if (card.countryOfOrigin == "KR") "مانهوا ملونة" else "مانجا مترجمة",
                synopsisAr = card.description.ifBlank { "فصول مترجمة بجودة عالية متاحة للقراءة الفورية." },
                chapters = (1..totalCh).map { ch ->
                    MangaChapterEntry(
                        number = ch,
                        titleAr = "الفصل $ch: ${card.englishTitle ?: card.title}",
                    )
                },
            )
        }
    }

    val currentSeries = selectedSeries
    if (currentSeries != null && activeChapterNumber > 0) {
        val chapters = currentSeries.chapters
        val currentIdx = chapters.indexOfFirst { it.number == activeChapterNumber }.coerceAtLeast(0)
        val currentChapter = chapters[currentIdx]
        val prevChapter = chapters.getOrNull(currentIdx - 1)
        val nextChapter = chapters.getOrNull(currentIdx + 1)

        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background),
        ) {
            // Reader Header with Elegant Chapter Dropdown Menu
            Surface(
                color = MaterialTheme.colorScheme.surface,
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    OutlinedButton(
                        onClick = { activeChapterNumber = 0 },
                        shape = RoundedCornerShape(12.dp),
                    ) {
                        Text("رجوع للمانجا")
                    }

                    // Elegant Chapter Dropdown Trigger
                    Box {
                        Button(
                            onClick = {
                                dropdownSearch = ""
                                readerDropdownExpanded = true
                            },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.16f),
                                contentColor = MaterialTheme.colorScheme.primary,
                            ),
                            shape = RoundedCornerShape(14.dp),
                        ) {
                            Text(
                                text = "الفصل ${currentChapter.number} من ${chapters.size} ▾",
                                fontWeight = FontWeight.ExtraBold,
                            )
                        }

                        DropdownMenu(
                            expanded = readerDropdownExpanded,
                            onDismissRequest = { readerDropdownExpanded = false },
                        ) {
                            OutlinedTextField(
                                value = dropdownSearch,
                                onValueChange = { dropdownSearch = it },
                                label = { Text("ابحث عن رقم أو اسم الفصل...") },
                                singleLine = true,
                                modifier = Modifier
                                    .width(260.dp)
                                    .padding(horizontal = 10.dp, vertical = 4.dp),
                            )
                            val filtered = chapters.filter {
                                dropdownSearch.isBlank() ||
                                    it.number.toString().contains(dropdownSearch.trim()) ||
                                    it.titleAr.contains(dropdownSearch.trim())
                            }
                            filtered.forEach { ch ->
                                val isCurrent = ch.number == currentChapter.number
                                DropdownMenuItem(
                                    text = {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically,
                                        ) {
                                            Text(
                                                text = ch.titleAr,
                                                fontWeight = if (isCurrent) FontWeight.ExtraBold else FontWeight.Medium,
                                                color = if (isCurrent) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface,
                                                maxLines = 1,
                                                overflow = TextOverflow.Ellipsis,
                                                modifier = Modifier.weight(1f),
                                            )
                                            if (isCurrent) {
                                                Text(
                                                    text = "يُقرأ الآن ✓",
                                                    fontSize = 11.sp,
                                                    color = MaterialTheme.colorScheme.secondary,
                                                    fontWeight = FontWeight.Bold,
                                                )
                                            }
                                        }
                                    },
                                    onClick = {
                                        readerDropdownExpanded = false
                                        activeChapterNumber = ch.number
                                    },
                                )
                            }
                        }
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        OutlinedButton(
                            onClick = { prevChapter?.let { activeChapterNumber = it.number } },
                            enabled = prevChapter != null,
                            shape = RoundedCornerShape(10.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                        ) {
                            Text("السابق")
                        }
                        Button(
                            onClick = { nextChapter?.let { activeChapterNumber = it.number } },
                            enabled = nextChapter != null,
                            shape = RoundedCornerShape(10.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                        ) {
                            Text("التالي")
                        }
                    }
                }
            }

            LazyColumn(
                modifier = Modifier.weight(1f),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        shape = RoundedCornerShape(18.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                text = currentSeries.titleAr,
                                style = MaterialTheme.typography.titleMedium,
                                color = MaterialTheme.colorScheme.primary,
                            )
                            Text(
                                text = currentChapter.titleAr,
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.ExtraBold,
                                modifier = Modifier.padding(top = 4.dp),
                            )
                        }
                    }
                }

                items((1..6).toList(), key = { "ch-${currentChapter.number}-p-$it" }) { pageNum ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Column(
                            modifier = Modifier.padding(12.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                        ) {
                            AsyncImage(
                                model = currentSeries.coverUrl,
                                contentDescription = "صفحة $pageNum",
                                contentScale = ContentScale.Crop,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(420.dp)
                                    .clip(RoundedCornerShape(12.dp)),
                            )
                            Text(
                                text = "صفحة $pageNum من 6 — ${currentChapter.titleAr}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(top = 8.dp),
                            )
                        }
                    }
                }

                item {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 12.dp),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        OutlinedButton(
                            onClick = { prevChapter?.let { activeChapterNumber = it.number } },
                            enabled = prevChapter != null,
                            modifier = Modifier.weight(1f),
                        ) {
                            Text(prevChapter?.let { "الفصل السابق (${it.number})" } ?: "أول فصل")
                        }
                        Button(
                            onClick = { nextChapter?.let { activeChapterNumber = it.number } },
                            enabled = nextChapter != null,
                            modifier = Modifier.weight(1f),
                        ) {
                            Text(nextChapter?.let { "الانتقال للفصل ${it.number} ⬅" } ?: "آخر فصل متاح")
                        }
                    }
                }
            }
        }
        return
    }

    if (currentSeries != null) {
        CatalogScaffold(
            title = currentSeries.titleAr,
            onBack = { selectedSeries = null },
        ) {
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    shape = RoundedCornerShape(22.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                            AsyncImage(
                                model = currentSeries.coverUrl,
                                contentDescription = currentSeries.titleAr,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier
                                    .width(105.dp)
                                    .height(150.dp)
                                    .clip(RoundedCornerShape(14.dp)),
                            )
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = currentSeries.titleAr,
                                    style = MaterialTheme.typography.titleLarge,
                                    fontWeight = FontWeight.ExtraBold,
                                )
                                Text(
                                    text = "${currentSeries.statusAr} • ★ ${currentSeries.score}",
                                    color = MaterialTheme.colorScheme.primary,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(top = 4.dp),
                                )
                                Text(
                                    text = currentSeries.synopsisAr,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.padding(top = 8.dp),
                                )
                            }
                        }

                        Spacer(Modifier.height(14.dp))

                        // Elegant Chapter Dropdown Card on Manga Detail Screen
                        Box(modifier = Modifier.fillMaxWidth()) {
                            OutlinedButton(
                                onClick = { detailDropdownExpanded = true },
                                shape = RoundedCornerShape(14.dp),
                                modifier = Modifier.fillMaxWidth(),
                            ) {
                                Text(
                                    text = "قائمة اختيار الفصول السريعة (${currentSeries.chapters.size} فصل) ▾",
                                    fontWeight = FontWeight.ExtraBold,
                                )
                            }

                            DropdownMenu(
                                expanded = detailDropdownExpanded,
                                onDismissRequest = { detailDropdownExpanded = false },
                            ) {
                                currentSeries.chapters.forEach { ch ->
                                    DropdownMenuItem(
                                        text = { Text(ch.titleAr, fontWeight = FontWeight.Bold) },
                                        onClick = {
                                            detailDropdownExpanded = false
                                            activeChapterNumber = ch.number
                                        },
                                    )
                                }
                            }
                        }
                    }
                }
            }

            items(currentSeries.chapters, key = { it.number }) { ch ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 5.dp)
                        .clickable { activeChapterNumber = ch.number },
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(ch.titleAr, fontWeight = FontWeight.ExtraBold)
                            Text(
                                text = "${ch.pagesCount} صفحة عالية الدقة",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                        Button(
                            onClick = { activeChapterNumber = ch.number },
                            shape = RoundedCornerShape(10.dp),
                        ) {
                            Text("قراءة الفصل ${ch.number}")
                        }
                    }
                }
            }
        }
        return
    }

    val combinedCatalog = remember(remoteManga) {
        val defaultTitles = DEFAULT_MANGA_CATALOG.map { it.titleEn.lowercase() }.toSet()
        DEFAULT_MANGA_CATALOG + remoteManga.filterNot { it.titleEn.lowercase() in defaultTitles }
    }
    val filteredSeries = combinedCatalog.filter {
        searchQuery.isBlank() ||
            it.titleAr.contains(searchQuery.trim(), ignoreCase = true) ||
            it.titleEn.contains(searchQuery.trim(), ignoreCase = true)
    }

    CatalogScaffold(title = "المانجا والمانهوا المترجمة", onBack = onBack) {
        item {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                label = { Text("ابحث عن مانجا أو مانهوا...") },
                singleLine = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
            )
        }

        items(filteredSeries, key = { it.id }) { manga ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 6.dp)
                    .clickable { selectedSeries = manga },
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    AsyncImage(
                        model = manga.coverUrl,
                        contentDescription = manga.titleAr,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .size(width = 76.dp, height = 108.dp)
                            .clip(RoundedCornerShape(12.dp)),
                    )
                    Column(modifier = Modifier.weight(1f)) {
                        Text(manga.titleAr, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.ExtraBold)
                        Text(
                            text = "${manga.statusAr} • ★ ${manga.score}",
                            color = MaterialTheme.colorScheme.primary,
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.Bold,
                        )
                        Text(
                            text = "${manga.chapters.size} فصل متاح للقراءة الفورية",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(top = 4.dp),
                        )
                    }
                    Button(onClick = { selectedSeries = manga }) {
                        Text("الفصول")
                    }
                }
            }
        }
    }
}
